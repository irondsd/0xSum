'use client';

import { useMemo } from 'react';
import { type Address } from 'viem';
import { useSubAccounts } from '@/hooks/useSubAccounts';
import { useAccountBalances, useMultiAccountBalances, aggregateBalances, type AccountBalances } from '@/hooks/useMultiChainBalances';
import { TotalBalance } from './TotalBalance';
import { TokenBreakdown } from './TokenBreakdown';
import { AccountCard } from './AccountCard';
import { AddSubAccount } from './AddSubAccount';
import { Spinner } from '@/components/ui/spinner';
import s from './Portfolio.module.scss';

interface PortfolioDashboardProps {
  mainAddress: Address;
}

export function PortfolioDashboard({ mainAddress }: PortfolioDashboardProps) {
  const { subAccounts, isLoaded, addSubAccount, removeSubAccount } = useSubAccounts(mainAddress);
  
  // Combine all addresses into a single array for the multi-account hook
  const allAddresses = useMemo(() => {
    return [mainAddress, ...subAccounts];
  }, [mainAddress, subAccounts]);
  
  // Fetch balances for all accounts at once (avoids Rules of Hooks violation)
  const { balancesByAddress, isLoading: balancesLoading, isError } = useMultiAccountBalances(allAddresses);
  
  // Also fetch native balances for main account
  const mainBalances = useAccountBalances(mainAddress);
  
  // Combine native + ERC20 balances for each account
  const allBalances: AccountBalances[] = useMemo(() => {
    return allAddresses.map((addr) => {
      const erc20Balances = balancesByAddress.get(addr);
      // For main account, merge native balances from useAccountBalances
      if (addr === mainAddress && mainBalances) {
        const nativeOnly = mainBalances.balances.filter(b => b.address === null);
        return {
          address: addr,
          balances: [...nativeOnly, ...(erc20Balances?.balances || [])],
          totalUsd: (erc20Balances?.totalUsd || 0) + nativeOnly.reduce((sum, b) => sum + b.usdValue, 0),
          isLoading: mainBalances.isLoading || (erc20Balances?.isLoading || false),
          isError: mainBalances.isError || (erc20Balances?.isError || false),
        };
      }
      return erc20Balances || {
        address: addr,
        balances: [],
        totalUsd: 0,
        isLoading: balancesLoading,
        isError,
      };
    });
  }, [allAddresses, balancesByAddress, mainAddress, mainBalances, balancesLoading, isError]);
  
  const aggregated = aggregateBalances(allBalances);
  
  // Calculate total USD
  const totalUsd = allBalances.reduce((sum, account) => sum + (account?.totalUsd || 0), 0);
  
  // Check loading state
  const isLoading = !isLoaded || balancesLoading || mainBalances?.isLoading;
  
  const handleAddSubAccount = (address: string) => {
    return addSubAccount(address);
  };

  return (
    <div className={s.dashboard}>
      <TotalBalance totalUsd={totalUsd} isLoading={isLoading} />
      
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
            const accountBalance = allBalances.find(b => b.address === addr);
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
