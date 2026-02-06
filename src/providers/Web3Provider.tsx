'use client';

import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react';

import { WagmiProvider } from 'wagmi';

import { getQueryClient } from '@/utils/getQueryClient';
import { config } from '@/config/wagmi';
import { useTheme } from 'next-themes';

type WagmiProviderProps = {
  children: ReactNode;
};

const appInfo = { appName: '0xSum' };

export const Web3Provider: FC<WagmiProviderProps> = ({ children }) => {
  const queryClient = getQueryClient();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rkTheme = useMemo(() => {
    // Use a stable default before mount to avoid mismatched injected CSS
    const t = mounted ? resolvedTheme : 'light';
    return t === 'dark' ? darkTheme() : lightTheme();
  }, [mounted, resolvedTheme]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider appInfo={appInfo} theme={rkTheme}>
          {children}
        </RainbowKitProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  );
};
