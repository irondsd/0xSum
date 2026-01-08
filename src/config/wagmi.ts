'use client';

import { connectorsForWallets, getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  ledgerWallet,
  metaMaskWallet,
  oneInchWallet,
  rainbowWallet,
  safeWallet,
  trustWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';

import { server } from './server';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;

// this function has to be called on the client
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, walletConnectWallet],
    },

    {
      groupName: 'Popular wallets',
      wallets: [injectedWallet, rainbowWallet, oneInchWallet, ledgerWallet, trustWallet, safeWallet],
    },
  ],
  {
    appName: '0xSum',
    projectId: walletConnectProjectId,
  },
);

// extend server wagmi config with connectors on the client
const wagmiConfig = {
  ...server,
  connectors,
};

export const config = getDefaultConfig({
  ...wagmiConfig,
  projectId: walletConnectProjectId,
  appName: '0xSum',
  appDescription: '',
  appUrl: 'https://0xSum.io',
  appIcon: 'https://app.0xSum.io/images/logo-mini.svg',
});
