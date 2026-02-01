import { formatUnits } from 'viem';
import { ProtocolToken } from '@/hooks/useProtocolPrices';
import abi from './abi';

export const getContractConfig = (token: ProtocolToken) => {
  return {
    address: token.address,
    abi,
    functionName: 'pricePerShare',
    chainId: token.chainId,
  };
};

export const formatPrice = (result: unknown, token: ProtocolToken): number => {
  const value = result as bigint;
  // Yearn pricePerShare often has different decimals, but usually matches token decimals for vaults?
  // Actually Yearn vaults usually match the underlying token decimals,
  // BUT pricePerShare is the value of 1 share in terms of underlying asset.
  // It obeys the decimals of the vault itself usually.
  return Number(formatUnits(value, token.decimals));
};
