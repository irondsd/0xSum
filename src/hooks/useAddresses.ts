import { useSubAccounts } from './useSubAccounts';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { Address } from 'viem';

export const useAddresses = () => {
  const { address: mainAddress } = useAccount();
  const { subAccounts } = useSubAccounts(mainAddress);

  // Combine all addresses into a single array for the multi-account hook
  const allAddresses = useMemo(() => {
    return [mainAddress as Address, ...subAccounts];
  }, [mainAddress, subAccounts]);

  return { mainAddress: mainAddress as Address, allAddresses };
};
