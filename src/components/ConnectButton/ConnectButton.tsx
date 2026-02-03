'use client';

import { ConnectButton as RainbowKitButton } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useMemo, type FC } from 'react';

import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/utils/format';

import { Wallet } from 'lucide-react';

export const ConnectButton: FC = () => {
  const getButtonTitle = useMemo(
    () => (isConnected: boolean, address?: string | null) => {
      return isConnected ? shortenAddress(address || '') : 'Connect Wallet';
    },
    [],
  );

  return (
    <RainbowKitButton.Custom>
      {({ account, openConnectModal, openAccountModal }) => {
        const isConnected = Boolean(account?.address);
        return (
          <Button
            className="px-4 h-10 sm:px-6"
            variant="default"
            size="lg"
            onClick={isConnected ? openAccountModal : openConnectModal}
          >
            <Wallet size={26} /> {getButtonTitle(isConnected, account?.address)}
          </Button>
        );
      }}
    </RainbowKitButton.Custom>
  );
};
