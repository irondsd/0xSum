import { useAddresses } from './useAddresses';
import { useMultiAccountBalances } from './useMultiChainBalances';

export const useUpdate = () => {
  const { allAddresses } = useAddresses();
  const { refetch: refetchBalances } = useMultiAccountBalances(allAddresses);

  const refetchAll = () => {
    refetchBalances();
  };

  return { refetchAll };
};
