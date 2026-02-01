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

// DAI addresses per chain
export const DAI_ADDRESSES: Record<number, Address> = {
  1: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Ethereum Mainnet
  42161: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // Arbitrum One
  8453: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', // Base
};

// Combined token addresses per chain
// Format: { chainId: [address1, address2, ...] }
export const TOKEN_ADDRESSES: Record<number, Address[]> = {
  1: [
    USDC_ADDRESSES[1],
    USDT_ADDRESSES[1],
    '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    '0x68749665FF8D2d112Fa859AA293F07A622782F38', // XAUt
    '0x310B7Ea7475A0B449Cfd73bE81522F1B88eFAFaa', // Yearn USDT-1 yVault (yvUSDT-1)
  ],
  42161: [
    USDC_ADDRESSES[42161],
    USDT_ADDRESSES[42161],
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // WETH
  ],
  8453: [USDC_ADDRESSES[8453], USDT_ADDRESSES[8453]],
};

// Symbol to full name mapping
export const TOKEN_NAMES: Record<string, string> = {
  eth: 'Ethereum',
  usdc: 'USD Coin',
  usdt: 'Tether USD',
  weth: 'Wrapped Ethereum',
  steth: 'Staked Ethereum',
  wsteth: 'Wrapped Staked Ethereum',
  wbtc: 'Wrapped Bitcoin',
  dai: 'Dai Stablecoin',
  xaut: 'Tether Gold',
  avax: 'Avalanche',
  bnb: 'Binance Coin',
  pol: 'Polygon',
  'yvusdt-1': 'Yearn USDT-1 yVault',
};

export const formatTokenSymbol: Record<string, string> = {
  eth: 'ETH',
  usdc: 'USDC',
  usdt: 'USDT',
  weth: 'WETH',
  steth: 'stETH',
  wsteth: 'wstETH',
  wbtc: 'WBTC',
  dai: 'DAI',
  xaut: 'XAUt',
  avax: 'AVAX',
  bnb: 'BNB',
  pol: 'Polygon',
  'yvusdt-1': 'yvUSDT-1',
};

// Helper to get token name from symbol
export const getTokenName = (symbol: string): string => {
  return TOKEN_NAMES[symbol] || TOKEN_NAMES[symbol.toUpperCase()] || symbol;
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
