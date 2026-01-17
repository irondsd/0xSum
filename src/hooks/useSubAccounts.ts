'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Address, isAddress } from 'viem';

const STORAGE_KEY_PREFIX = 'sub_';

/**
 * Hook to manage sub-accounts stored in localStorage
 * Key format: sub_${mainAddress} -> ["0x...", "0x..."]
 */
export function useSubAccounts(mainAddress: Address | undefined) {
  const [subAccounts, setSubAccounts] = useState<Address[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sub-accounts from localStorage when mainAddress changes
  useEffect(() => {
    let accounts: Address[] = [];

    if (mainAddress) {
      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${mainAddress.toLowerCase()}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            accounts = parsed.filter((addr): addr is Address => typeof addr === 'string' && isAddress(addr));
          }
        }
      } catch (error) {
        console.error('Failed to load sub-accounts from localStorage:', error);
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubAccounts(accounts);
    setIsLoaded(true);
  }, [mainAddress]);

  const saveToStorage = useCallback(
    (accounts: Address[]) => {
      if (!mainAddress) return;

      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${mainAddress.toLowerCase()}`;
        localStorage.setItem(storageKey, JSON.stringify(accounts));
      } catch (error) {
        console.error('Failed to save sub-accounts to localStorage:', error);
      }
    },
    [mainAddress],
  );

  const addSubAccount = useCallback(
    (address: string): { success: boolean; error?: string } => {
      // Validate address
      if (!isAddress(address)) {
        return { success: false, error: 'Invalid Ethereum address' };
      }

      const normalizedAddress = address as Address;

      // Check if it's the main address
      if (mainAddress && normalizedAddress.toLowerCase() === mainAddress.toLowerCase()) {
        return { success: false, error: 'Cannot add main wallet as sub-account' };
      }

      // Check for duplicates
      if (subAccounts.some((addr) => addr.toLowerCase() === normalizedAddress.toLowerCase())) {
        return { success: false, error: 'Address already exists' };
      }

      const newAccounts = [...subAccounts, normalizedAddress];
      setSubAccounts(newAccounts);
      saveToStorage(newAccounts);
      return { success: true };
    },
    [mainAddress, subAccounts, saveToStorage],
  );

  const removeSubAccount = useCallback(
    (address: Address) => {
      const newAccounts = subAccounts.filter((addr) => addr.toLowerCase() !== address.toLowerCase());
      setSubAccounts(newAccounts);
      saveToStorage(newAccounts);
    },
    [subAccounts, saveToStorage],
  );

  return {
    subAccounts,
    isLoaded,
    addSubAccount,
    removeSubAccount,
  };
}
