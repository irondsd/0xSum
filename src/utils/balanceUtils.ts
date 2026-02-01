import { Address } from 'viem';

export interface TokenBalance {
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  address: Address | null; // null for native token
  balance: bigint;
  usdValue: number;
}

export interface AccountBalances {
  address: Address;
  balances: TokenBalance[];
  totalUsd: number;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Aggregate balances by token symbol across all accounts
 */
export interface AggregatedBalance {
  symbol: string;
  name: string;
  totalBalance: bigint;
  decimals: number;
  usdValue: number;
}

export function aggregateBalances(accountBalances: (AccountBalances | null)[]): AggregatedBalance[] {
  const aggregated: Record<string, AggregatedBalance> = {};

  accountBalances.forEach((account) => {
    if (!account) return;

    account.balances.forEach((balance) => {
      const symbol = balance.symbol; // Use normalized symbol directly if it's already normalized in the balance object
      
      if (!aggregated[symbol]) {
        aggregated[symbol] = {
          symbol: balance.symbol,
          name: balance.name,
          totalBalance: BigInt(0),
          decimals: balance.decimals,
          usdValue: 0,
        };
      }

      aggregated[symbol].totalBalance += balance.balance;
      aggregated[symbol].usdValue += balance.usdValue;
    });
  });

  return Object.values(aggregated).sort((a, b) => b.usdValue - a.usdValue);
}
