import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Address } from 'viem';
import { NATIVE_TOKENS, type SupportedChain } from '@/config/chains';
import { TOKEN_ADDRESSES } from '@/config/tokens';
import { normalizeTokenSymbol } from '@/utils/normalizeTokenSymbol';
import type { TokenDelta, TransactionRow, TransactionsResponse } from '@/types/transactions';

// Blockscout public instances expose an Etherscan-compatible API
// (module=account) for free, without an API key
const BLOCKSCOUT_HOSTS: Record<number, string> = {
  1: 'https://eth.blockscout.com',
  42161: 'https://arbitrum.blockscout.com',
  8453: 'https://base.blockscout.com',
};

const PAGE_SIZE = 15;
// raw records fetched per stream (account × chain × endpoint) per round
const FETCH_OFFSET = 50;
const MAX_ADDRESSES = 10;
// extra fetch rounds when known-token activity is sparse relative to raw activity
const MAX_ROUNDS = 3;
// stay well within public instance rate limits (applied per host)
const RATE_LIMIT_BATCH = 5;
const RATE_LIMIT_INTERVAL_MS = 1100;
// Blockscout occasionally hangs on txlistinternal for busy accounts —
// give up on the individual call rather than stalling the page
const REQUEST_TIMEOUT_MS = 10_000;
// don't start extra rounds once the response has taken this long
const TIME_BUDGET_MS = 25_000;
const LATEST_BLOCK = 999999999;

export const maxDuration = 60;

// Only chains with both a known-token list and a Blockscout instance are scanned
const TX_CHAINS = Object.keys(TOKEN_ADDRESSES)
  .map(Number)
  .filter((chainId) => chainId in BLOCKSCOUT_HOSTS) as SupportedChain[];

const KNOWN_TOKENS: Record<number, Set<string>> = Object.fromEntries(
  TX_CHAINS.map((chainId) => [chainId, new Set(TOKEN_ADDRESSES[chainId].map((a) => a.toLowerCase()))]),
);

const ACTIONS = ['tokentx', 'txlist', 'txlistinternal'] as const;
type EtherscanAction = (typeof ACTIONS)[number];

type EtherscanTx = {
  blockNumber: string;
  timeStamp: string;
  hash?: string;
  // txlistinternal entries carry the parent hash under a different name
  transactionHash?: string;
  from: string;
  to: string;
  value: string;
  contractAddress?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  isError?: string;
};

type Transfer = {
  chainId: SupportedChain;
  blockNumber: number;
  timestamp: number;
  hash: string;
  account: Address;
  symbol: string;
  decimals: number;
  delta: bigint;
};

type StreamResult = {
  chainId: SupportedChain;
  // a full page means there may be older records we haven't seen yet
  full: boolean;
  oldestTimestamp: number;
  oldestBlock: number;
  transfers: Transfer[];
  // upstream error or timeout: no data this round, but the chain must not be
  // treated as exhausted
  failed?: boolean;
};

// Per-chain pagination state. `endblock` is the upper bound (inclusive) for the
// next fetch; `exclude` holds row ids already emitted at exactly that block so
// re-fetching the boundary block doesn't duplicate them.
type ChainCursor = { endblock: number; exclude: string[]; done?: boolean };
type Cursor = Record<string, ChainCursor>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function initialCursor(): Cursor {
  return Object.fromEntries(TX_CHAINS.map((chainId) => [chainId, { endblock: LATEST_BLOCK, exclude: [] }]));
}

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8')) as Cursor;
    for (const chainId of TX_CHAINS) {
      const c = parsed[chainId];
      if (!c || typeof c.endblock !== 'number' || !Array.isArray(c.exclude)) return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function blockscoutFetch(
  chainId: SupportedChain,
  params: Record<string, string>,
  attempt = 0,
): Promise<EtherscanTx[]> {
  const search = new URLSearchParams(params);
  const res = await fetch(`${BLOCKSCOUT_HOSTS[chainId]}/api?${search}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (res.status === 429 && attempt < 2) {
    await sleep(RATE_LIMIT_INTERVAL_MS);
    return blockscoutFetch(chainId, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`Blockscout HTTP ${res.status}`);
  const body = (await res.json()) as { status: string; message: string; result: EtherscanTx[] | string };

  if (Array.isArray(body.result)) return body.result;

  const msg = typeof body.result === 'string' ? body.result : body.message;
  if (attempt < 2 && msg?.toLowerCase().includes('rate limit')) {
    await sleep(RATE_LIMIT_INTERVAL_MS);
    return blockscoutFetch(chainId, params, attempt + 1);
  }
  throw new Error(`Blockscout error: ${msg}`);
}

// Run tasks in small batches spaced out to respect the 5 req/s free tier
async function throttledAll<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += RATE_LIMIT_BATCH) {
    const started = Date.now();
    results.push(...(await Promise.all(tasks.slice(i, i + RATE_LIMIT_BATCH).map((task) => task()))));
    if (i + RATE_LIMIT_BATCH < tasks.length) {
      const wait = RATE_LIMIT_INTERVAL_MS - (Date.now() - started);
      if (wait > 0) await sleep(wait);
    }
  }
  return results;
}

function toTransfers(
  txs: EtherscanTx[],
  chainId: SupportedChain,
  account: Address,
  action: EtherscanAction,
): Transfer[] {
  const transfers: Transfer[] = [];
  const accountLower = account.toLowerCase();

  for (const tx of txs) {
    const hash = tx.hash || tx.transactionHash;
    if (!hash || tx.value === '0') continue;
    const from = tx.from?.toLowerCase();
    const to = tx.to?.toLowerCase();
    // a self-send nets to zero
    if (from === to) continue;

    let symbol: string;
    let decimals: number;

    if (action === 'tokentx') {
      if (!tx.contractAddress || !KNOWN_TOKENS[chainId].has(tx.contractAddress.toLowerCase())) continue;
      symbol = normalizeTokenSymbol(tx.tokenSymbol || '');
      decimals = Number(tx.tokenDecimal ?? 18);
    } else {
      if (tx.isError === '1') continue;
      const native = NATIVE_TOKENS[chainId];
      symbol = native.symbol.toLowerCase();
      decimals = native.decimals;
    }

    const value = BigInt(tx.value);
    transfers.push({
      chainId,
      blockNumber: Number(tx.blockNumber),
      timestamp: Number(tx.timeStamp),
      hash,
      account,
      symbol,
      decimals,
      delta: to === accountLower ? value : -value,
    });
  }

  return transfers;
}

async function fetchStream(
  chainId: SupportedChain,
  account: Address,
  action: EtherscanAction,
  endblock: number,
): Promise<StreamResult> {
  try {
    const txs = await blockscoutFetch(chainId, {
      module: 'account',
      action,
      address: account,
      startblock: '0',
      endblock: String(endblock),
      page: '1',
      offset: String(FETCH_OFFSET),
      sort: 'desc',
    });

    const oldest = txs[txs.length - 1];
    return {
      chainId,
      full: txs.length >= FETCH_OFFSET,
      oldestTimestamp: oldest ? Number(oldest.timeStamp) : 0,
      oldestBlock: oldest ? Number(oldest.blockNumber) : 0,
      transfers: toTransfers(txs, chainId, account, action),
    };
  } catch (error) {
    console.warn(`transactions: ${action} for ${account} on chain ${chainId} failed:`, error);
    return { chainId, full: false, oldestTimestamp: 0, oldestBlock: 0, transfers: [], failed: true };
  }
}

// Combine per-token transfers of the same transaction into one row per account
function buildRows(transfers: Transfer[]): TransactionRow[] {
  const groups = new Map<string, Transfer[]>();
  for (const t of transfers) {
    const id = `${t.chainId}:${t.hash}:${t.account.toLowerCase()}`;
    const group = groups.get(id);
    if (group) group.push(t);
    else groups.set(id, [t]);
  }

  const rows: TransactionRow[] = [];
  for (const [id, group] of groups) {
    const bySymbol = new Map<string, { decimals: number; delta: bigint }>();
    for (const t of group) {
      const entry = bySymbol.get(t.symbol);
      if (entry) entry.delta += t.delta;
      else bySymbol.set(t.symbol, { decimals: t.decimals, delta: t.delta });
    }

    const deltas: TokenDelta[] = [...bySymbol.entries()]
      .filter(([, { delta }]) => delta !== 0n)
      .map(([symbol, { decimals, delta }]) => ({ symbol, decimals, value: delta.toString() }));
    if (!deltas.length) continue;

    const [first] = group;
    rows.push({
      id,
      chainId: first.chainId,
      hash: first.hash,
      blockNumber: first.blockNumber,
      timestamp: first.timestamp,
      account: first.account,
      deltas,
    });
  }

  return rows;
}

export async function GET(req: NextRequest) {
  const addressesParam = req.nextUrl.searchParams.get('addresses');
  const addresses = (addressesParam?.split(',').filter(Boolean) ?? []) as Address[];
  if (!addresses.length || addresses.length > MAX_ADDRESSES || addresses.some((a) => !/^0x[0-9a-fA-F]{40}$/.test(a))) {
    return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 });
  }

  const cursorParam = req.nextUrl.searchParams.get('cursor');
  let cursor = cursorParam ? decodeCursor(cursorParam) : initialCursor();
  if (!cursor) {
    return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
  }

  const emitted: TransactionRow[] = [];
  const emittedIds = new Set<string>();

  const startedAt = Date.now();

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const activeChains = TX_CHAINS.filter((chainId) => !cursor![chainId].done);
      if (!activeChains.length || emitted.length >= PAGE_SIZE) break;
      if (round > 0 && Date.now() - startedAt > TIME_BUDGET_MS) break;

      // each chain hits its own Blockscout host, so throttle per chain and run
      // the chains in parallel
      const streams = (
        await Promise.all(
          activeChains.map((chainId) =>
            throttledAll(
              addresses.flatMap((account) =>
                ACTIONS.map((action) => () => fetchStream(chainId, account, action, cursor![chainId].endblock)),
              ),
            ),
          ),
        )
      ).flat();

      if (streams.every((s) => s.failed)) {
        throw new Error('all upstream requests failed');
      }

      const rows = buildRows(streams.flatMap((s) => s.transfers)).filter(
        (row) => !cursor![row.chainId].exclude.includes(row.id) && !emittedIds.has(row.id),
      );

      // Rows are only safe to emit if every stream that still has unfetched
      // history has been fetched at least that far back; otherwise ordering
      // across accounts/chains could be wrong.
      const frontier = Math.max(0, ...streams.filter((s) => s.full).map((s) => s.oldestTimestamp));
      const sorted = rows
        .filter((row) => row.timestamp >= frontier)
        .sort(
          (a, b) =>
            b.timestamp - a.timestamp ||
            a.chainId - b.chainId ||
            a.hash.localeCompare(b.hash) ||
            a.account.localeCompare(b.account),
        );

      const roundEmitted = sorted.slice(0, PAGE_SIZE - emitted.length);
      for (const row of roundEmitted) {
        emitted.push(row);
        emittedIds.add(row.id);
      }

      // Advance per-chain cursors past everything emitted this round
      const nextCursor: Cursor = { ...cursor };
      let progressed = false;
      for (const chainId of activeChains) {
        const prev = cursor[chainId];
        const chainStreams = streams.filter((s) => s.chainId === chainId);
        const chainFailed = chainStreams.some((s) => s.failed);
        const chainRows = rows.filter((row) => row.chainId === chainId);
        const chainEmitted = chainRows.filter((row) => emittedIds.has(row.id));

        // blocks the next fetch must still cover: unfinished streams resume from
        // their oldest fetched block, unemitted rows must be re-fetched later
        const candidates = [
          ...chainStreams.filter((s) => s.full).map((s) => s.oldestBlock),
          ...chainRows.filter((row) => !emittedIds.has(row.id)).map((row) => row.blockNumber),
        ];

        if (!candidates.length) {
          if (!chainFailed) {
            nextCursor[chainId] = { ...prev, done: true };
            continue;
          }
          // a stream failed, so the chain may have more history than we saw;
          // keep it open and resume just below what was emitted
          if (!chainEmitted.length) {
            nextCursor[chainId] = prev;
            continue;
          }
          candidates.push(Math.min(...chainEmitted.map((row) => row.blockNumber)));
        }

        const endblock = Math.max(...candidates);
        const exclude = [
          ...(prev.endblock === endblock ? prev.exclude : []),
          ...chainEmitted.filter((row) => row.blockNumber <= endblock).map((row) => row.id),
        ];
        if (endblock !== prev.endblock || chainEmitted.length > 0) progressed = true;
        nextCursor[chainId] = { endblock, exclude };
      }

      // Safety valve: identical cursor and nothing emitted means another round
      // would fetch the exact same data — stop instead of looping forever.
      if (!progressed && roundEmitted.length === 0) {
        if (streams.some((s) => s.failed)) {
          // transient upstream trouble: return what we have, retry on next page
          cursor = nextCursor;
          break;
        }
        for (const chainId of activeChains) nextCursor[chainId] = { ...nextCursor[chainId], done: true };
      }

      cursor = nextCursor;
    }
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 502 });
  }

  const hasMore = TX_CHAINS.some((chainId) => !cursor![chainId].done);
  const response: TransactionsResponse = {
    rows: emitted,
    nextCursor: hasMore ? encodeCursor(cursor) : null,
  };

  return NextResponse.json(response);
}
