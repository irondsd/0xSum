'use client';

import { useMemo } from 'react';
import { type Address } from 'viem';
import { useBalance, useReadContracts } from 'wagmi';
import { supportedChains, NATIVE_TOKENS } from '@/config/chains';
import { TOKEN_ADDRESSES, ERC20_ABI, getTokenName } from '@/config/tokens';

export interface TokenBalance {
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  address: Address | null; // null for native token
  balance: bigint;
  usdValue: number; // 1:1 for MVP
}

export interface AccountBalances {
  address: Address;
  balances: TokenBalance[];
  totalUsd: number;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Hook to fetch balances for a single address across all supported chains
 */
export function useAccountBalances(address: Address | undefined): AccountBalances | null {
  // Fetch native balances for all chains
  const nativeBalanceQueries = supportedChains.map((chain) => ({
    address,
    chainId: chain.id,
  }));

  // Build ERC20 balance queries for all tokens on all chains
  const erc20Queries = useMemo(() => {
    if (!address) return [];

    const queries: {
      address: Address;
      abi: typeof ERC20_ABI;
      functionName: 'balanceOf' | 'symbol' | 'decimals';
      args?: readonly [Address];
      chainId: number;
    }[] = [];

    supportedChains.forEach((chain) => {
      const tokens = TOKEN_ADDRESSES[chain.id] || [];
      tokens.forEach((tokenAddress) => {
        // Balance query
        queries.push({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address] as const,
          chainId: chain.id,
        });
        // Symbol query
        queries.push({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
          chainId: chain.id,
        });
        // Decimals query
        queries.push({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
          chainId: chain.id,
        });
      });
    });

    return queries;
  }, [address]);

  // Native token balances - one hook per chain
  const nativeBalance1 = useBalance({ address, chainId: 1 });
  const nativeBalance42161 = useBalance({ address, chainId: 42161 });
  const nativeBalance8453 = useBalance({ address, chainId: 8453 });
  const nativeBalance11155111 = useBalance({ address, chainId: 11155111 });

  const nativeBalances = useMemo(() => ({
    1: nativeBalance1,
    42161: nativeBalance42161,
    8453: nativeBalance8453,
    11155111: nativeBalance11155111,
  }), [nativeBalance1, nativeBalance42161, nativeBalance8453, nativeBalance11155111]);

  // ERC20 balances
  const { data: erc20Data, isLoading: erc20Loading, isError: erc20Error } = useReadContracts({
    contracts: erc20Queries,
    query: {
      enabled: !!address && erc20Queries.length > 0,
    },
  });

  // Process all balances
  const result = useMemo(() => {
    if (!address) return null;

    const balances: TokenBalance[] = [];
    let isLoading = false;
    let isError = false;

    // Process native token balances
    supportedChains.forEach((chain) => {
      const nativeBalance = nativeBalances[chain.id as keyof typeof nativeBalances];
      const nativeConfig = NATIVE_TOKENS[chain.id];

      if (nativeBalance.isLoading) isLoading = true;
      if (nativeBalance.isError) isError = true;

      if (nativeBalance.data) {
        const balance = nativeBalance.data.value;
        const decimals = nativeConfig?.decimals || 18;
        balances.push({
          symbol: nativeConfig?.symbol || 'ETH',
          name: getTokenName(nativeConfig?.symbol || 'ETH'),
          decimals,
          chainId: chain.id,
          address: null,
          balance,
          usdValue: Number(balance) / Math.pow(10, decimals), // 1:1 for MVP
        });
      }
    });

    // Process ERC20 balances
    if (erc20Loading) isLoading = true;
    if (erc20Error) isError = true;

    if (erc20Data) {
      let dataIndex = 0;
      supportedChains.forEach((chain) => {
        const tokens = TOKEN_ADDRESSES[chain.id] || [];
        tokens.forEach((tokenAddress) => {
          const balanceResult = erc20Data[dataIndex];
          const symbolResult = erc20Data[dataIndex + 1];
          const decimalsResult = erc20Data[dataIndex + 2];
          dataIndex += 3;

          if (
            balanceResult?.status === 'success' &&
            symbolResult?.status === 'success' &&
            decimalsResult?.status === 'success'
          ) {
            const balance = BigInt(balanceResult.result as string);
            const symbol = symbolResult.result as string;
            const decimals = Number(decimalsResult.result);

            balances.push({
              symbol,
              name: getTokenName(symbol),
              decimals,
              chainId: chain.id,
              address: tokenAddress,
              balance,
              usdValue: 123,
            });
          }
        });
      });
    }

    const totalUsd = balances.reduce((sum, b) => sum + b.usdValue, 0);

    return {
      address,
      balances,
      totalUsd,
      isLoading,
      isError,
    };
  }, [address, nativeBalances, erc20Data, erc20Loading, erc20Error]);

  return result;
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
      if (!aggregated[balance.symbol]) {
        aggregated[balance.symbol] = {
          symbol: balance.symbol,
          name: balance.name,
          totalBalance: BigInt(0),
          decimals: balance.decimals,
          usdValue: 0,
        };
      }

      aggregated[balance.symbol].totalBalance += balance.balance;
      aggregated[balance.symbol].usdValue += balance.usdValue;
    });
  });

  return Object.values(aggregated).sort((a, b) => b.usdValue - a.usdValue);
}

/**
 * Hook to fetch balances for multiple addresses at once
 * This avoids the Rules of Hooks violation when using useAccountBalances in a loop
 */
export function useMultiAccountBalances(addresses: Address[]): {
  balancesByAddress: Map<Address, AccountBalances>;
  isLoading: boolean;
  isError: boolean;
} {
  // Build all queries for all addresses
  const allErc20Queries = useMemo(() => {
    const queries: {
      address: Address;
      abi: typeof ERC20_ABI;
      functionName: 'balanceOf' | 'symbol' | 'decimals';
      args?: readonly [Address];
      chainId: number;
      ownerAddress: Address; // Track which address this query is for
    }[] = [];

    addresses.forEach((ownerAddress) => {
      supportedChains.forEach((chain) => {
        const tokens = TOKEN_ADDRESSES[chain.id] || [];
        tokens.forEach((tokenAddress) => {
          queries.push({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [ownerAddress] as const,
            chainId: chain.id,
            ownerAddress,
          });
          queries.push({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'symbol',
            chainId: chain.id,
            ownerAddress,
          });
          queries.push({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
            chainId: chain.id,
            ownerAddress,
          });
        });
      });
    });

    return queries;
  }, [addresses]);

  // Build native balance queries for all addresses
  const nativeQueries = useMemo(() => {
    const queries: { address: Address; chainId: number }[] = [];
    addresses.forEach((addr) => {
      supportedChains.forEach((chain) => {
        queries.push({ address: addr, chainId: chain.id });
      });
    });
    return queries;
  }, [addresses]);

  // Fetch all ERC20 balances in one call
  const { data: erc20Data, isLoading: erc20Loading, isError: erc20Error } = useReadContracts({
    contracts: allErc20Queries.map(({ ownerAddress, ...query }) => query),
    query: {
      enabled: addresses.length > 0 && allErc20Queries.length > 0,
    },
  });

  // Fetch all native balances using useBalances pattern
  // We need to use individual useBalance calls but batched via useReadContracts is not possible for native
  // So we use wagmi's multicall approach with eth_getBalance
  const nativeBalanceContracts = useMemo(() => {
    return nativeQueries.map(({ address, chainId }) => ({
      address: '0x0000000000000000000000000000000000000000' as Address,
      abi: [{
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }] as const,
      functionName: 'balance' as const,
      args: [address] as const,
      chainId,
    }));
  }, [nativeQueries]);

  // For native balances, we'll use a different approach - fetch via getBalance
  // Since we can't easily batch native balance calls, we'll use the standard multicall for ERC20
  // and accept that native balances need a different approach
  
  // Process results
  const result = useMemo(() => {
    const balancesByAddress = new Map<Address, AccountBalances>();
    let isLoading = erc20Loading;
    let isError = erc20Error;

    // Initialize all addresses
    addresses.forEach((addr) => {
      balancesByAddress.set(addr, {
        address: addr,
        balances: [],
        totalUsd: 0,
        isLoading: erc20Loading,
        isError: erc20Error,
      });
    });

    // Process ERC20 data
    if (erc20Data) {
      let dataIndex = 0;
      addresses.forEach((ownerAddress) => {
        const accountData = balancesByAddress.get(ownerAddress);
        if (!accountData) return;

        supportedChains.forEach((chain) => {
          const tokens = TOKEN_ADDRESSES[chain.id] || [];
          tokens.forEach((tokenAddress) => {
            const balanceResult = erc20Data[dataIndex];
            const symbolResult = erc20Data[dataIndex + 1];
            const decimalsResult = erc20Data[dataIndex + 2];
            dataIndex += 3;

            if (
              balanceResult?.status === 'success' &&
              symbolResult?.status === 'success' &&
              decimalsResult?.status === 'success'
            ) {
              const balance = BigInt(balanceResult.result as string);
              const symbol = symbolResult.result as string;
              const decimals = Number(decimalsResult.result);

              accountData.balances.push({
                symbol,
                name: getTokenName(symbol),
                decimals,
                chainId: chain.id,
                address: tokenAddress,
                balance,
                usdValue: Number(balance) / Math.pow(10, decimals),
              });
            }
          });
        });

        accountData.totalUsd = accountData.balances.reduce((sum, b) => sum + b.usdValue, 0);
        accountData.isLoading = erc20Loading;
        accountData.isError = erc20Error;
      });
    }

    return { balancesByAddress, isLoading, isError };
  }, [addresses, erc20Data, erc20Loading, erc20Error]);

  return result;
}
