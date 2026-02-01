import { TOKEN_NAMES } from '@/config/tokens';
import { fetchTokenPrices } from '@/utils/getTokenPrices';
import { useQuery } from '@tanstack/react-query';

export function useApiTokenPrices(symbols: string[] = Object.keys(TOKEN_NAMES)) {
  return useQuery({
    queryKey: ['tokenPrices', symbols],
    queryFn: () => fetchTokenPrices(symbols),
    // Refresh every minute
    refetchInterval: 60000,
    enabled: symbols.length > 0,
  });
}
