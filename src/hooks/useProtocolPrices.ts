import { useMemo } from 'react';
import { Address } from 'viem';
import { useConfig } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { TOKEN_PRICING_STRATEGIES, ProtocolPricingConfig } from '@/config/pricing';
import { normalizeTokenSymbol } from '@/utils/normalizeTokenSymbol';

// Import protocol pricing modules
import * as yearnPricing from '@/protocols/yearn/pricing';
import { readContracts } from 'wagmi/actions';

export interface ProtocolToken {
  symbol: string;
  address: Address;
  chainId: number;
  decimals: number;
}

const PROTOCOL_MODULES: Record<string, any> = {
  yearn: yearnPricing,
};

export function useProtocolPrices(tokens: ProtocolToken[]) {
  const config = useConfig();

  // 1. Filter tokens that need protocol pricing
  const protocolTokens = useMemo(() => {
    return tokens.filter((token) => {
      const normalizedSymbol = normalizeTokenSymbol(token.symbol);
      const strategy = TOKEN_PRICING_STRATEGIES[normalizedSymbol];
      return strategy?.type === 'protocol';
    });
  }, [tokens]);

  // 2. Build contract reads
  const contractConfigs = useMemo(() => {
    return protocolTokens
      .map((token) => {
        const normalizedSymbol = normalizeTokenSymbol(token.symbol);
        const strategy = TOKEN_PRICING_STRATEGIES[normalizedSymbol] as ProtocolPricingConfig;

        const module = PROTOCOL_MODULES[strategy.protocol];
        if (module) {
          return module.getContractConfig(token);
        }
        return null;
      })
      .filter(Boolean) as any[];
  }, [protocolTokens]);

  const { data: reads, refetch } = useQuery({
    queryKey: ['protocolPrices', contractConfigs],
    queryFn: () => readContracts(config, { contracts: contractConfigs }),
    enabled: protocolTokens.length > 0,
    refetchInterval: 60 * 1000, // 1 minute
  });

  // 3. Process results into a map: `${symbol}-${chainId}` -> price
  const prices = useMemo(() => {
    const prices: Record<string, number> = {};

    if (!reads) return prices;

    protocolTokens.forEach((token, index) => {
      const result = reads[index];
      if (result?.status === 'success') {
        const normalizedSymbol = normalizeTokenSymbol(token.symbol);
        const strategy = TOKEN_PRICING_STRATEGIES[normalizedSymbol] as ProtocolPricingConfig;
        const module = PROTOCOL_MODULES[strategy.protocol];

        if (module && module.formatPrice) {
          const price = module.formatPrice(result.result, token);
          const key = `${normalizedSymbol}-${token.chainId}`;
          prices[key] = price;
        }
      }
    });

    return prices;
  }, [reads, protocolTokens]);

  return { prices, refetch };
}
