// Token addresses per chain
// Format: { chainId: [tokenAddress1, tokenAddress2, ...] }
// We read symbol and decimals from the contract using ERC20 standard

import { type Address } from 'viem';

// USDC addresses per chain
export const USDC_ADDRESSES: Record<number, Address> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum Mainnet
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One (native USDC)
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
};

// USDT addresses per chain
export const USDT_ADDRESSES: Record<number, Address> = {
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum Mainnet
  42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum One
  8453: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // Base (Bridged USDT)
};

// Combined token addresses per chain
// Format: { chainId: [address1, address2, ...] }
export const TOKEN_ADDRESSES: Record<number, Address[]> = {
  1: [USDC_ADDRESSES[1], USDT_ADDRESSES[1]],
  42161: [USDC_ADDRESSES[42161], USDT_ADDRESSES[42161]],
  8453: [USDC_ADDRESSES[8453], USDT_ADDRESSES[8453]],
  11155111: [], // Sepolia - no stablecoins
};

// Symbol to full name mapping
export const TOKEN_NAMES: Record<string, string> = {
  ETH: 'Ethereum',
  USDC: 'USD Coin',
  USDT: 'Tether USD',
  WETH: 'Wrapped Ether',
};

// Helper to get token name from symbol
export const getTokenName = (symbol: string): string => {
  return TOKEN_NAMES[symbol] || symbol;
};

// ERC20 ABI for reading token info
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
