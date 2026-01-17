import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getBalance } from 'wagmi/actions';
import { useConfig } from 'wagmi';
import { type Address } from 'viem';
import { supportedChains } from '@/config/chains';

export function useNativeBalances(address: Address | undefined) {
  const config = useConfig();

  const queries = useQueries({
    queries: supportedChains.map((chain) => ({
      queryKey: ['balance', 'native', address, chain.id],
      queryFn: () => getBalance(config, { address: address!, chainId: chain.id }),
      enabled: !!address,
      // Refresh options similar to useBalance or defaults
      staleTime: 1_000 * 30, // 30 seconds
    })),
  });

  return useMemo(() => {
    return supportedChains.reduce(
      (acc, chain, index) => {
        acc[chain.id] = queries[index];
        return acc;
      },
      {} as Record<number, (typeof queries)[number]>,
    );
  }, [queries]);
}
