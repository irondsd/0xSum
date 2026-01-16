'use client';

import { formatUSD } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import s from './Portfolio.module.scss';

interface TotalBalanceProps {
  totalUsd: number;
  isLoading?: boolean;
}

export function TotalBalance({ totalUsd, isLoading }: TotalBalanceProps) {
  return (
    <div className={s.totalBalance}>
      <p className={s.totalLabel}>Total Portfolio Value</p>
      {isLoading ? (
        <Skeleton className={s.totalSkeleton} />
      ) : (
        <p className={s.totalAmount}>{formatUSD(totalUsd)}</p>
      )}
    </div>
  );
}
