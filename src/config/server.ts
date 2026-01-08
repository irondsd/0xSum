import type { Config } from 'wagmi';
import { http, cookieStorage, createStorage, createConfig } from 'wagmi';
import { arbitrum, base, mainnet, sepolia } from 'wagmi/chains';

import { supportedChains } from './chains';

export const server = {
  chains: supportedChains,
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
  },

  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
} as const;

export const serverConfig: Config = createConfig(server);
