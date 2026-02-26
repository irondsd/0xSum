'use client';

import { formatBalance, formatUSD } from '@/utils/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTokenSymbol } from '@/config/tokens';
import { useSettings } from '@/providers/SettingsContext';
import s from './Portfolio.module.scss';
import Image from 'next/image';
import { AggregatedBalance } from '@/utils/balanceUtils';

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
        const humanBalance =
          balance.totalBalance > 0n
            ? Number(balance.totalBalance) / 10 ** balance.decimals
            : null;
        const tokenPrice =
          humanBalance && balance.usdValue ? balance.usdValue / humanBalance : null;
        const isStablecoin = tokenPrice !== null && Math.abs(tokenPrice - 1) < 0.02;
        const showTooltip = !isStablecoin && tokenPrice !== null;

        const item = (
          <div key={balance.symbol} className={s.tokenItem}>
            <div className={s.tokenIcon}>
              <Image src={`/icons/tokens/${balance.symbol}.svg`} alt={displaySymbol} width={36} height={36} />
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

        if (!showTooltip) return item;

        return (
          <Tooltip key={balance.symbol}>
            <TooltipTrigger asChild>{item}</TooltipTrigger>
            <TooltipContent>
              1 {displaySymbol} = {formatUSD(tokenPrice)}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
