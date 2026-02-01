import { TOKEN_NAMES } from '@/config/tokens';
import { fetchTokenPrices } from '@/utils/getTokenPrices';
import { useQuery } from '@tanstack/react-query';

export function useApiTokenPrices(symbols: string[] = Object.keys(TOKEN_NAMES)) {
  return useQuery({
    queryKey: ['tokenPrices', symbols],
    queryFn: () => fetchTokenPrices(symbols),
    refetchInterval: 60 * 1000, // Refresh every minute
    enabled: symbols.length > 0,
  });
}
