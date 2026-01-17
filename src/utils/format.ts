import { type Address, formatUnits } from 'viem';

/**
 * Format a bigint balance to human-readable format
 * @param value - Raw balance as bigint
 * @param decimals - Token decimals
 * @returns Formatted string
 */
export function formatBalance(value: bigint, decimals: number): string {
  const formatted = formatUnits(value, decimals);
  const num = parseFloat(formatted);

  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
  return `${(num / 1000000).toFixed(2)}M`;
}

/**
 * Format a number as USD currency
 * @param value - USD value
 * @returns Formatted USD string
 */
export function formatUSD(value: number): string {
  if (value === 0) return '$0.00';
  if (value < 0.01) return '<$0.01';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Shorten an Ethereum address to 0xABC...xyz format
 * @param address - Full Ethereum address
 * @returns Shortened address (0x + 3 chars + ... + 3 chars)
 */
export function shortenAddress(address: Address | string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-3)}`;
}
