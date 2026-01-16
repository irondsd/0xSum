import { type Chain, arbitrum, base, mainnet, sepolia } from 'wagmi/chains';

const chainLookup = {
  [mainnet.id]: mainnet,
  [arbitrum.id]: arbitrum,
  [base.id]: base,
  [sepolia.id]: sepolia,
} as const;

const availableChainIds = Object.values(chainLookup).map((chain) => chain.id);
const configChainIds = JSON.parse(process.env.NEXT_PUBLIC_CHAINS || '[]').map((id: number) => id) as readonly number[];

// Narrowed type representing only IDs present in `availableChainIds`.
type AvailableChainIds = (typeof availableChainIds)[number];

function assertAvailableChainIds(arr: readonly number[]): asserts arr is AvailableChainIds[] {
  if (!arr.every((id) => availableChainIds.includes(id as AvailableChainIds))) {
    throw new Error(
      `Invalid chain IDs in NEXT_PUBLIC_CHAINS: ${arr.join(', ')}. Available IDs are: ${availableChainIds.join(', ')}`,
    );
  }
}

// Narrow down configChainIds to AvailableChainIds[]
assertAvailableChainIds(configChainIds);

if (configChainIds.length === 0) {
  throw new Error('NEXT_PUBLIC_CHAINS must contain at least one chain id');
}

// Helper to assert an array is non-empty
function assertNonEmpty<T>(arr: readonly T[]): asserts arr is readonly [T, ...T[]] {
  if (arr.length === 0) throw new Error('Expected a non-empty array');
}

const mappedSupportedChains = configChainIds.map(
  (id) => chainLookup[id as keyof typeof chainLookup],
) as readonly Chain[];

// Ensure non-empty and type narrowing
assertNonEmpty(mappedSupportedChains);
export const supportedChains = mappedSupportedChains;

const includedTested = configChainIds.includes(sepolia.id);

export const activityPagesupportedChains = [mainnet, arbitrum, ...(includedTested ? [sepolia] : [])] as const;

// Exclude chains that are already supported from the "coming soon" list.
export const comingSoonChains = [mainnet, base].filter(
  (chain) => !supportedChains.map((c) => c.id).includes(chain.id),
) as Chain[];

export type SupportedChain = (typeof supportedChains)[number]['id'];

export const chainNames: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  42161: 'Arbitrum',
  11155111: 'Sepolia',
};

export const blockExplorerUrls: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  42161: 'https://arbiscan.io',
  11155111: 'https://sepolia.etherscan.io/',
};

// Native token configuration per chain
export const NATIVE_TOKENS: Record<number, { symbol: string; decimals: number }> = {
  1: { symbol: 'ETH', decimals: 18 },
  42161: { symbol: 'ETH', decimals: 18 },
  8453: { symbol: 'ETH', decimals: 18 },
  11155111: { symbol: 'ETH', decimals: 18 },
};
