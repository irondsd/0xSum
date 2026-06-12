import type { Address } from 'viem';
import type { SupportedChain } from '@/config/chains';

// A signed balance change for one token within a transaction,
// from the perspective of one account
export type TokenDelta = {
  // normalized lowercase symbol, display via formatTokenSymbol
  symbol: string;
  decimals: number;
  // signed raw amount as a bigint string (negative = outgoing)
  value: string;
};

// One transaction as seen by one of the tracked accounts.
// A transfer between two tracked accounts produces two rows.
export type TransactionRow = {
  id: string;
  chainId: SupportedChain;
  hash: string;
  blockNumber: number;
  // unix seconds
  timestamp: number;
  account: Address;
  deltas: TokenDelta[];
};

export type TransactionsResponse = {
  rows: TransactionRow[];
  // opaque cursor for the next page, null when history is exhausted
  nextCursor: string | null;
};
