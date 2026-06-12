import type { Address } from 'viem';
import type { TransactionsResponse } from '@/types/transactions';

export const fetchTransactions = async (addresses: Address[], cursor: string | null) => {
  const params = new URLSearchParams({ addresses: addresses.join(',') });
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/transactions?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to fetch transactions');
  }
  return res.json() as Promise<TransactionsResponse>;
};
