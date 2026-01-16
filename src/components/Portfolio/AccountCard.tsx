'use client';

import { useState, useCallback } from 'react';
import { type Address } from 'viem';
import { ChevronDown, ChevronUp, Copy, Check, Trash2, User } from 'lucide-react';
import { shortenAddress, formatBalance, formatUSD } from '@/utils/format';
import { type TokenBalance } from '@/hooks/useMultiChainBalances';
import { chainNames } from '@/config/chains';
import { formatTokenSymbol } from '@/config/tokens';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import s from './Portfolio.module.scss';

interface AccountCardProps {
  address: Address;
  balances: TokenBalance[];
  isLoading: boolean;
  isMain?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
}

export function AccountCard({
  address,
  balances,
  isLoading,
  isMain = false,
  canRemove = false,
  onRemove,
}: AccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const totalUsd = balances.reduce((sum, b) => sum + b.usdValue, 0);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  }, [address]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  }, [onRemove]);

  // Group balances by chain
  const balancesByChain = balances.reduce((acc, balance) => {
    const chainId = balance.chainId;
    if (!acc[chainId]) acc[chainId] = [];
    acc[chainId].push(balance);
    return acc;
  }, {} as Record<number, TokenBalance[]>);

  return (
    <div className={s.accountCard}>
      <div
        className={s.accountHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className={s.accountInfo}>
          <div className={s.accountIcon}>
            <User className="size-4" />
          </div>
          <div className={s.accountDetails}>
            <div className={s.accountAddressRow}>
              <span className={s.accountAddress}>{shortenAddress(address)}</span>
              {isMain && <span className={s.mainBadge}>Main</span>}
              <button
                className={s.copyButton}
                onClick={handleCopy}
                type="button"
                aria-label="Copy address"
              >
                {isCopied ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
            <span className={s.accountUsd}>
              {isLoading ? <Skeleton className="h-4 w-16" /> : formatUSD(totalUsd)}
            </span>
          </div>
        </div>

        <div className={s.accountActions}>
          {canRemove && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRemove}
              className={s.removeButton}
              aria-label="Remove account"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="size-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className={s.accountContent}>
          {isLoading ? (
            <div className={s.accountTokens}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : Object.entries(balancesByChain).length === 0 ? (
            <p className={s.noTokens}>No tokens found</p>
          ) : (
            Object.entries(balancesByChain).map(([chainId, chainBalances]) => (
              <div key={chainId} className={s.chainSection}>
                <h4 className={s.chainName}>
                  {chainNames[Number(chainId)] || `Chain ${chainId}`}
                </h4>
                <div className={s.accountTokens}>
                  {chainBalances.map((balance, index) => (
                    <div key={`${balance.symbol}-${balance.address}-${index}`} className={s.tokenRow}>
                      <span className={s.tokenRowSymbol}>
                        {formatTokenSymbol[balance.symbol] || balance.symbol}
                      </span>
                      <span className={s.tokenRowBalance}>
                        {formatBalance(balance.balance, balance.decimals)}
                      </span>
                      <span className={s.tokenRowUsd}>{formatUSD(balance.usdValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
