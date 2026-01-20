'use client';

import { formatBalance, formatUSD } from '@/utils/format';
import { type AggregatedBalance } from '@/hooks/useMultiChainBalances';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTokenSymbol } from '@/config/tokens';
import { useSettings } from '@/providers/SettingsContext';
import s from './Portfolio.module.scss';
import Image from 'next/image';

interface TokenBreakdownProps {
  balances: AggregatedBalance[];
  isLoading?: boolean;
}

export function TokenBreakdown({ balances, isLoading }: TokenBreakdownProps) {
  const { hideSmallBalances, threshold } = useSettings();

  if (isLoading) {
    return (
      <div className={s.tokenList}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={s.tokenItem}>
            <Skeleton className={s.tokenIconSkeleton} />
            <div className={s.tokenInfo}>
              <Skeleton className={s.tokenNameSkeleton} />
              <Skeleton className={s.tokenBalanceSkeleton} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className={s.emptyState}>
        <p>No tokens found</p>
      </div>
    );
  }

  // icons downloaded from https://cryptofonts.com/icons.html

  return (
    <div className={s.tokenList}>
      {balances.map((balance) => {
        if (!balance.totalBalance) return null;
        if (hideSmallBalances && balance.usdValue < threshold) return null;

        const displaySymbol = formatTokenSymbol[balance.symbol] || balance.symbol;
        return (
          <div key={balance.symbol} className={s.tokenItem}>
            <div className={s.tokenIcon}>
              <Image src={`/icons/tokens/${balance.symbol}.svg`} alt={displaySymbol} width={24} height={24} />
            </div>
            <div className={s.tokenDetails}>
              <div className={s.tokenHeader}>
                <span className={s.tokenSymbol}>{displaySymbol}</span>
                <span className={s.tokenUsd}>{formatUSD(balance.usdValue)}</span>
              </div>
              <div className={s.tokenSubtext}>
                <span className={s.tokenName}>{balance.name}</span>
                <span className={s.tokenBalance}>
                  {formatBalance(balance.totalBalance, balance.decimals)} {displaySymbol}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
