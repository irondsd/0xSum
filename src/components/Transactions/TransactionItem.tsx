'use client';

import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ExternalLink } from 'lucide-react';
import { blockExplorerUrls, chainNames } from '@/config/chains';
import { formatTokenSymbol } from '@/config/tokens';
import { formatBalance, formatUSD, shortenAddress } from '@/utils/format';
import { useApiTokenPrices } from '@/hooks/useApiTokenPrices';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import type { TransactionRow } from '@/types/transactions';

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

function txKind(row: TransactionRow): 'received' | 'sent' | 'swap' {
  const hasIn = row.deltas.some((d) => BigInt(d.value) > 0n);
  const hasOut = row.deltas.some((d) => BigInt(d.value) < 0n);
  if (hasIn && hasOut) return 'swap';
  return hasIn ? 'received' : 'sent';
}

const KIND_META = {
  received: { label: 'Received', icon: ArrowDownLeft },
  sent: { label: 'Sent', icon: ArrowUpRight },
  swap: { label: 'Swap', icon: ArrowRightLeft },
} as const;

export function TransactionItem({ row }: { row: TransactionRow }) {
  const kind = txKind(row);
  const { label, icon: Icon } = KIND_META[kind];
  const { data: prices } = useApiTokenPrices();

  // outgoing first so swaps read naturally: -3,000 USDT → +1 stETH
  const deltas = [...row.deltas].sort((a, b) => (BigInt(a.value) < BigInt(b.value) ? -1 : 1));

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          kind === 'received' && 'bg-green-500/10 text-green-500',
          kind === 'sent' && 'bg-red-500/10 text-red-500',
          kind === 'swap' && 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="outline">{chainNames[row.chainId]}</Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span title={row.account}>{shortenAddress(row.account)}</span>
          <span aria-hidden>·</span>
          <span>{timeFormat.format(row.timestamp * 1000)}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        {deltas.map((delta) => {
          const value = BigInt(delta.value);
          const negative = value < 0n;
          const magnitude = negative ? -value : value;
          const amount = formatBalance(magnitude, delta.decimals);
          const price = prices?.[delta.symbol];
          const usd = price === undefined ? null : (Number(magnitude) / 10 ** delta.decimals) * price;
          return (
            <div key={delta.symbol} className="flex flex-col items-end">
              <span
                className={cn('text-sm font-semibold tabular-nums', negative ? 'text-red-500' : 'text-green-500')}
              >
                {negative ? '−' : '+'}
                {amount} {formatTokenSymbol[delta.symbol] || delta.symbol.toUpperCase()}
              </span>
              {usd !== null && <span className="text-xs font-normal text-muted-foreground tabular-nums">{formatUSD(usd)}</span>}
            </div>
          );
        })}
      </div>

      <Button asChild variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground">
        <a
          href={`${blockExplorerUrls[row.chainId]}/tx/${row.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on block explorer"
        >
          <ExternalLink className="size-4" />
        </a>
      </Button>
    </div>
  );
}
