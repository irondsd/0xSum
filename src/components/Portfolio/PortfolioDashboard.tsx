'use client';

import { useMemo } from 'react';
import { type Address } from 'viem';
import { useSubAccounts } from '@/hooks/useSubAccounts';
import { useMultiAccountBalances, aggregateBalances, type AccountBalances } from '@/hooks/useMultiChainBalances';
import { TotalBalance } from './TotalBalance';
import { TokenBreakdown } from './TokenBreakdown';
import { AccountCard } from './AccountCard';
import { AddSubAccount } from './AddSubAccount';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/providers/SettingsContext';
import s from './Portfolio.module.scss';

interface PortfolioDashboardProps {
  mainAddress: Address;
}

export function PortfolioDashboard({ mainAddress }: PortfolioDashboardProps) {
  const { subAccounts, isLoaded, addSubAccount, removeSubAccount } = useSubAccounts(mainAddress);
  const { hideSmallBalances, toggleHideSmallBalances } = useSettings();

  // Combine all addresses into a single array for the multi-account hook
  const allAddresses = useMemo(() => {
    return [mainAddress, ...subAccounts];
  }, [mainAddress, subAccounts]);

  // Fetch balances for all accounts at once
  const { balancesByAddress, isLoading: balancesLoading, isError } = useMultiAccountBalances(allAddresses);

  // Get main account balances from the multi-account result
  const mainBalances = balancesByAddress.get(mainAddress);

  // Prepare list of all account balances for aggregation and display
  const allBalances: AccountBalances[] = useMemo(() => {
    return allAddresses.map((addr) => {
      const accountBalances = balancesByAddress.get(addr);
      return (
        accountBalances || {
          address: addr,
          balances: [],
          totalUsd: 0,
          isLoading: balancesLoading,
          isError,
        }
      );
    });
  }, [allAddresses, balancesByAddress, balancesLoading, isError]);

  const aggregated = aggregateBalances(allBalances);

  // Calculate total USD
  const totalUsd = allBalances.reduce((sum, account) => sum + (account?.totalUsd || 0), 0);

  // Check loading state
  const isLoading = !isLoaded || balancesLoading;

  const handleAddSubAccount = (address: string) => {
    return addSubAccount(address);
  };

  return (
    <div className={s.dashboard}>
      <TotalBalance totalUsd={totalUsd} isLoading={isLoading} />

      <div className="mb-6 flex items-center justify-end gap-2 cursor-pointer" onClick={toggleHideSmallBalances}>
        <span className="text-sm font-medium text-muted-foreground">Hide small balances</span>
        <Switch checked={hideSmallBalances} onCheckedChange={toggleHideSmallBalances} />
      </div>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Token Breakdown</h2>
        <TokenBreakdown balances={aggregated} isLoading={isLoading} />
      </section>

      <section className={s.section}>
        <div className={s.sectionHeader}>
          <h2 className={s.sectionTitle}>Accounts</h2>
          {isLoading && <Spinner size="sm" />}
        </div>

        <div className={s.accountsList}>
          {/* Main Account */}
          <AccountCard
            address={mainAddress}
            balances={mainBalances?.balances || []}
            isLoading={mainBalances?.isLoading || false}
            isMain
            canRemove={false}
          />

          {/* Sub Accounts */}
          {subAccounts.map((addr) => {
            // Find this address in allBalances (skip index 0 which is main)
            const accountBalance = allBalances.find((b) => b.address === addr);
            return (
              <AccountCard
                key={addr}
                address={addr}
                balances={accountBalance?.balances || []}
                isLoading={accountBalance?.isLoading || false}
                canRemove
                onRemove={() => removeSubAccount(addr)}
              />
            );
          })}
        </div>

        <AddSubAccount onAdd={handleAddSubAccount} />
      </section>
    </div>
  );
}
