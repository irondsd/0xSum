'use client';

import { useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useApiTokenPrices } from '@/hooks/useApiTokenPrices';
import { useSettings } from '@/providers/SettingsContext';
import { TransactionItem } from './TransactionItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import type { TransactionRow } from '@/types/transactions';

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function dayLabel(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return dayFormat.format(date);
}

function groupByDay(rows: TransactionRow[]): { label: string; rows: TransactionRow[] }[] {
  const groups: { label: string; rows: TransactionRow[] }[] = [];
  for (const row of rows) {
    const label = dayLabel(row.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(row);
    else groups.push({ label, rows: [row] });
  }
  return groups;
}

export function TransactionsList() {
  const { rows, isLoading, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useTransactions();
  const { hideSmallBalances, toggleHideSmallBalances, threshold } = useSettings();
  const { data: prices } = useApiTokenPrices();

  // A transaction is "small" when every leg we can price is below the threshold;
  // legs without a known price are kept rather than silently hidden
  const visibleRows = useMemo(() => {
    if (!hideSmallBalances) return rows;
    return rows.filter((row) =>
      row.deltas.some((delta) => {
        const price = prices?.[delta.symbol];
        if (price === undefined) return true;
        const value = BigInt(delta.value);
        const amount = Number(value < 0n ? -value : value) / 10 ** delta.decimals;
        return amount * price >= threshold;
      }),
    );
  }, [rows, hideSmallBalances, prices, threshold]);

  const groups = useMemo(() => groupByDay(visibleRows), [visibleRows]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <div className="flex flex-col gap-px overflow-hidden rounded-xl border border-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Something went wrong'}</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-12 text-center">
        <Inbox className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No transactions with known tokens found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex cursor-pointer items-center justify-end gap-2" onClick={toggleHideSmallBalances}>
        <span className="text-sm font-medium text-muted-foreground">Hide small transactions</span>
        <Switch checked={hideSmallBalances} onCheckedChange={toggleHideSmallBalances} />
      </div>

      {!visibleRows.length && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          All loaded transactions are below the threshold — load more or turn off the filter
        </p>
      )}

      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-2 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.label}</h3>
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {group.rows.map((row) => (
              <TransactionItem key={row.id} row={row} />
            ))}
          </div>
        </section>
      ))}

      {hasNextPage ? (
        <Button
          variant="outline"
          className="self-center"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage && <Spinner size="sm" />}
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </Button>
      ) : (
        <p className="text-center text-xs text-muted-foreground">You’ve reached the end of the history</p>
      )}
    </div>
  );
}
