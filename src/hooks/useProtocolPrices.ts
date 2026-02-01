import { useMemo } from 'react';
import { Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { TOKEN_PRICING_STRATEGIES, ProtocolPricingConfig } from '@/config/pricing';
import { normalizeTokenSymbol } from '@/utils/normalizeTokenSymbol';
import { formatUnits } from 'viem';

// Import protocol pricing ABIs/logic
import yearnAbi from '@/protocols/yearn/abi';

export interface ProtocolToken {
  symbol: string;
  address: Address;
  chainId: number;
  decimals: number;
}

export function useProtocolPrices(tokens: ProtocolToken[]) {
  // 1. Filter tokens that need protocol pricing
  const protocolTokens = useMemo(() => {
    return tokens.filter((token) => {
      const normalizedSymbol = normalizeTokenSymbol(token.symbol);
      const strategy = TOKEN_PRICING_STRATEGIES[normalizedSymbol];
      return strategy?.type === 'protocol';
    });
  }, [tokens]);

  // 2. Build contract reads
  const { data: reads } = useReadContracts({
    contracts: protocolTokens.map((token) => {
      const normalizedSymbol = normalizeTokenSymbol(token.symbol);
      const strategy = TOKEN_PRICING_STRATEGIES[normalizedSymbol] as ProtocolPricingConfig;
      
      if (strategy.protocol === 'yearn') {
        return {
          address: token.address,
          abi: yearnAbi,
          functionName: 'pricePerShare',
          chainId: token.chainId,
        };
      }
      return null;
    }).filter(Boolean) as any[],
    query: {
      enabled: protocolTokens.length > 0,
      // Refresh every minute
      refetchInterval: 60000,
    },
  });

  // 3. Process results into a map: `${symbol}-${chainId}` -> price
  return useMemo(() => {
    const prices: Record<string, number> = {};
    
    if (!reads) return prices;

    protocolTokens.forEach((token, index) => {
      const result = reads[index];
      if (result?.status === 'success') {
        const value = result.result as bigint;
        // Yearn pricePerShare often has different decimals, but usually matches token decimals for vaults?
        // Actually Yearn vaults usually match the underlying token decimals, 
        // BUT pricePerShare is the value of 1 share in terms of underlying asset.
        // It obeys the decimals of the vault itself usually.
        // Let's assume for now we format it using the token's decimals.
        // The user's original code used `formatUnits(data, decimals)`.
        const price = Number(formatUnits(value, token.decimals));
        
        const key = `${normalizeTokenSymbol(token.symbol)}-${token.chainId}`;
        prices[key] = price;
      }
    });

    return prices;
  }, [reads, protocolTokens]);
}
