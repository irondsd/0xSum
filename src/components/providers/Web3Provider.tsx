'use client';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { FC, ReactNode } from 'react';

import { type State, WagmiProvider } from 'wagmi';


import { getQueryClient } from '@/utils/getQueryClient';
import { config } from '@/config/wagmi';

type WagmiProviderProps = {
  children: ReactNode;
  initialState: State | undefined;
};

const appInfo = { appName: 'Liquorice' };

export const Web3Provider: FC<WagmiProviderProps> = ({ children, initialState }) => {
  const queryClient = getQueryClient();


  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider  appInfo={appInfo}>
          {children}
        </RainbowKitProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  );
};
