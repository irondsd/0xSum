import { config } from '@/config/wagmi';
import { Address, formatUnits } from 'viem';

import abi from './abi';
import { readContract } from 'wagmi/actions';
import { SupportedChain } from '@/config/chains';

type GetPriceProps = {
  address: Address;
  chainId: SupportedChain;
  decimals: number;
};

export const getPrice = async ({ address, chainId, decimals }: GetPriceProps) => {
  const data = await readContract(config, {
    abi,
    address: address,
    functionName: 'pricePerShare',
    chainId,
  });

  return Number(formatUnits(data, decimals));
};
