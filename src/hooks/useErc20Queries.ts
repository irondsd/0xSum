'use client';

import { useMemo } from 'react';
import { type Address } from 'viem';
import { useConfig } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { supportedChains } from '@/config/chains';
import { TOKEN_ADDRESSES, ERC20_ABI } from '@/config/tokens';
import { readContracts } from 'wagmi/actions';

/**
 * Hook to build and fetch ERC20 balance queries for multiple addresses
 * Returns the contract data along with loading/error states
 */
export function useErc20Queries(addresses: Address[]) {
  const config = useConfig();

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

  // Fetch all ERC20 balances using useQuery for manual refetch control
  const query = useQuery({
    queryKey: ['erc20Balances', addresses],
    queryFn: () => readContracts(config, { contracts: allErc20Queries }),
    enabled: addresses.length > 0 && allErc20Queries.length > 0,
  });

  return query;
}
