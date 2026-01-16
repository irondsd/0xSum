'use client';

import { formatBalance, formatUSD } from '@/utils/format';
import { type AggregatedBalance } from '@/hooks/useMultiChainBalances';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTokenSymbol } from '@/config/tokens';
import s from './Portfolio.module.scss';

interface TokenBreakdownProps {
  balances: AggregatedBalance[];
  isLoading?: boolean;
}

export function TokenBreakdown({ balances, isLoading }: TokenBreakdownProps) {
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

  return (
    <div className={s.tokenList}>
      {balances.map((balance) => {
        const displaySymbol = formatTokenSymbol[balance.symbol] || balance.symbol;
        return (
          <div key={balance.symbol} className={s.tokenItem}>
            <div className={s.tokenIcon}>
              {displaySymbol.slice(0, 2)}
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
