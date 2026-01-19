import type { Config } from 'wagmi';
import { cookieStorage, createStorage, createConfig } from 'wagmi';
import { supportedChains, transports } from './chains';

export const server = {
  chains: supportedChains,
  transports,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
} as const;

export const serverConfig: Config = createConfig(server);
