import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAddresses } from './useAddresses';
import { fetchTransactions } from '@/utils/getTransactions';
import type { TransactionRow } from '@/types/transactions';

export function useTransactions() {
  const { allAddresses } = useAddresses();
  const addresses = useMemo(() => allAddresses.filter(Boolean), [allAddresses]);

  const query = useInfiniteQuery({
    queryKey: ['transactions', addresses],
    queryFn: ({ pageParam }) => fetchTransactions(addresses, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: addresses.length > 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rows: TransactionRow[] = useMemo(
    () => query.data?.pages.flatMap((page) => page.rows) ?? [],
    [query.data],
  );

  return { ...query, rows };
}
