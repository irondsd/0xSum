'use client';

import { useMemo } from 'react';
import { type Address } from 'viem';
import { useReadContracts, useConfig } from 'wagmi';
import { getBalance } from 'wagmi/actions';
import { supportedChains, NATIVE_TOKENS } from '@/config/chains';
import { TOKEN_ADDRESSES, ERC20_ABI, getTokenName, TOKEN_NAMES } from '@/config/tokens';
import { TOKEN_PRICING_STRATEGIES } from '@/config/pricing';

import { normalizeTokenSymbol } from '@/utils/normalizeTokenSymbol';
import { useApiTokenPrices } from './useApiTokenPrices';
import { useProtocolPrices, ProtocolToken } from './useProtocolPrices';
import { AccountBalances } from '@/utils/balanceUtils';
import { useQueries } from '@tanstack/react-query';

/**
 * Hook to fetch balances for multiple addresses at once
 * This avoids the Rules of Hooks violation when using useAccountBalances in a loop
 */
export function useMultiAccountBalances(addresses: Address[]): {
  balancesByAddress: Map<Address, AccountBalances>;
  isLoading: boolean;
  isError: boolean;
} {
  // Build all queries for all addresses for ERC20s
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

  const config = useConfig();

  // Native balance queries for all addresses
  const nativeBalanceQueries = useQueries({
    queries: addresses.flatMap((addr) =>
      supportedChains.map((chain) => ({
        queryKey: ['balance', 'native', addr, chain.id],
        queryFn: () => getBalance(config, { address: addr, chainId: chain.id }),
        staleTime: 1_000 * 30, // 30 seconds
      })),
    ),
  });

  // Fetch all ERC20 balances in one call
  const {
    data: erc20Data,
    isLoading: erc20Loading,
    isError: erc20Error,
  } = useReadContracts({
    contracts: allErc20Queries.map(({ ...query }) => query),
    query: {
      enabled: addresses.length > 0 && allErc20Queries.length > 0,
    },
  });

  // --- Derive Tokens and Fetch Prices ---

  const { uniqueApiSymbols, distinctProtocolTokens } = useMemo(() => {
    const apiSyms = new Set<string>();
    const protoTokens: ProtocolToken[] = [];
    const processedProtoTokens = new Set<string>(); // avoid duplicates

    // 1. Add Native Tokens (always API?)
    // Native tokens usually use API pricing (ETH, MATIC, etc.)
    supportedChains.forEach((chain) => {
      const nativeConfig = NATIVE_TOKENS[chain.id];
      const symbol = normalizeTokenSymbol(nativeConfig?.symbol || 'ETH');
      // Check strategy
      const strategy = TOKEN_PRICING_STRATEGIES[symbol];
      if (strategy?.type === 'protocol') {
        // Rare for native, but possible?
        // Native does not have address, so protocol pricing hook might fail if it expects address.
        // Assumption: Native tokens are always API priced.
      }
      apiSyms.add(symbol);
    });

    // 2. Add ERC20 Tokens from data
    if (erc20Data) {
      let dataIndex = 0;
      addresses.forEach(() => {
        supportedChains.forEach((chain) => {
          const tokens = TOKEN_ADDRESSES[chain.id] || [];
          tokens.forEach((tokenAddress) => {
            // we skip balance result
            const symbolResult = erc20Data[dataIndex + 1];
            const decimalsResult = erc20Data[dataIndex + 2];
            dataIndex += 3;

            if (symbolResult?.status === 'success' && decimalsResult?.status === 'success') {
              const symbol = normalizeTokenSymbol(symbolResult.result as string);
              const decimals = Number(decimalsResult.result);

              const strategy = TOKEN_PRICING_STRATEGIES[symbol];

              if (strategy?.type === 'protocol') {
                const key = `${symbol}-${chain.id}`;
                if (!processedProtoTokens.has(key)) {
                  protoTokens.push({
                    symbol,
                    address: tokenAddress,
                    chainId: chain.id,
                    decimals,
                  });
                  processedProtoTokens.add(key);
                }
              } else {
                apiSyms.add(symbol);
              }
            }
          });
        });
      });
    }

    return {
      uniqueApiSymbols: Array.from(apiSyms),
      distinctProtocolTokens: protoTokens,
    };
  }, [erc20Data, addresses]);

  // Fetch Prices
  const { data: apiPrices } = useApiTokenPrices(uniqueApiSymbols);
  const protocolPrices = useProtocolPrices(distinctProtocolTokens);

  // Process results
  const result = useMemo(() => {
    const balancesByAddress = new Map<Address, AccountBalances>();

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
              const symbol = normalizeTokenSymbol(symbolResult.result as string);
              const decimals = Number(decimalsResult.result);

              // Get price
              let price = 0;
              const strategy = TOKEN_PRICING_STRATEGIES[symbol];

              if (strategy?.type === 'protocol') {
                // Try protocol price specific to chain
                const key = `${symbol}-${chain.id}`;
                price = protocolPrices?.[key] || 0;
              } else {
                price = apiPrices?.[symbol] || 0;
              }

              accountData.balances.push({
                symbol,
                name: getTokenName(symbol),
                decimals,
                chainId: chain.id,
                address: tokenAddress,
                balance,
                usdValue: (Number(balance) / Math.pow(10, decimals)) * price,
              });
            }
          });
        });

        // Add native balances
        supportedChains.forEach((chain) => {
          const queryIndex = addresses.indexOf(ownerAddress) * supportedChains.length + supportedChains.indexOf(chain);
          const nativeBalance = nativeBalanceQueries[queryIndex];
          const nativeConfig = NATIVE_TOKENS[chain.id];

          if (nativeBalance?.data) {
            const balance = nativeBalance.data.value;
            const decimals = nativeConfig?.decimals || 18;
            const symbol = normalizeTokenSymbol(nativeConfig?.symbol || 'ETH');

            // Native is always API priced currently
            const price = apiPrices?.[symbol] || 0;

            accountData.balances.push({
              symbol,
              name: getTokenName(symbol),
              decimals,
              chainId: chain.id,
              address: null,
              balance,
              usdValue: (Number(balance) / Math.pow(10, decimals)) * price,
            });
          }
        });

        accountData.totalUsd = accountData.balances.reduce((sum, b) => sum + b.usdValue, 0);
        accountData.isLoading = erc20Loading;
        accountData.isError = erc20Error;
      });
    }

    return { balancesByAddress, isLoading: erc20Loading, isError: erc20Error };
  }, [addresses, erc20Data, erc20Loading, erc20Error, nativeBalanceQueries, apiPrices, protocolPrices]);

  return result;
}
