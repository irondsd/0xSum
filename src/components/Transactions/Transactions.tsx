'use client';

import { useAccount } from 'wagmi';
import { NotConnected } from '@/components/Portfolio/NotConnected';
import { TransactionsList } from './TransactionsList';

export function Transactions() {
  const { isConnected, address } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className="flex flex-1 flex-col">
        <NotConnected />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-2">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent token activity across your accounts on Ethereum, Arbitrum and Base
        </p>
      </div>
      <TransactionsList />
    </div>
  );
}
