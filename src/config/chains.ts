import { http } from 'viem';
import { arbitrum, base, mainnet, bsc, polygon, optimism, avalanche } from 'wagmi/chains';

export const supportedChains = [mainnet, arbitrum, base, bsc, polygon, optimism, avalanche] as const;

export type SupportedChain = (typeof supportedChains)[number]['id'];

const drpcKey = process.env.NEXT_PUBLIC_DRPC_API_KEY;

export const transports: Record<SupportedChain, ReturnType<typeof http>> = {
  [mainnet.id]: http(`https://lb.drpc.org/ethereum/${drpcKey}`),
  [arbitrum.id]: http(`https://lb.drpc.org/arbitrum/${drpcKey}`),
  [base.id]: http(`https://lb.drpc.org/base/${drpcKey}`),
  [bsc.id]: http(`https://lb.drpc.live/bsc/${drpcKey}`),
  [polygon.id]: http(`https://lb.drpc.live/polygon/${drpcKey}`),
  [optimism.id]: http(`https://lb.drpc.live/optimism/${drpcKey}`),
  [avalanche.id]: http(`https://lb.drpc.live/avalanche/${drpcKey}`),
} as const;

export const chainNames: Record<SupportedChain, string> = {
  [mainnet.id]: 'Ethereum',
  [base.id]: 'Base',
  [arbitrum.id]: 'Arbitrum',
  [bsc.id]: 'BSC',
  [polygon.id]: 'Polygon',
  [optimism.id]: 'Optimism',
  [avalanche.id]: 'Avalanche',
};

export const blockExplorerUrls: Record<SupportedChain, string> = {
  [mainnet.id]: 'https://etherscan.io',
  [base.id]: 'https://basescan.org',
  [arbitrum.id]: 'https://arbiscan.io',
  [bsc.id]: 'https://bscscan.com',
  [polygon.id]: 'https://polygonscan.com',
  [optimism.id]: 'https://optimistic.etherscan.io',
  [avalanche.id]: 'https://snowtrace.io',
};

// Native token configuration per chain
export const NATIVE_TOKENS: Record<SupportedChain, { symbol: string; decimals: number }> = {
  [mainnet.id]: { symbol: 'ETH', decimals: 18 },
  [arbitrum.id]: { symbol: 'ETH', decimals: 18 },
  [base.id]: { symbol: 'ETH', decimals: 18 },
  [bsc.id]: { symbol: 'BNB', decimals: 18 },
  [polygon.id]: { symbol: 'POL', decimals: 18 },
  [optimism.id]: { symbol: 'ETH', decimals: 18 },
  [avalanche.id]: { symbol: 'AVAX', decimals: 18 },
};
