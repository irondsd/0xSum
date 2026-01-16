'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';
import s from './Portfolio.module.scss';

export function NotConnected() {
  return (
    <div className={s.notConnected}>
      <div className={s.hero}>
        <div className={s.iconWrapper}>
          <Wallet className={s.heroIcon} />
        </div>
        <h1 className={s.heroTitle}>Connect Your Wallet</h1>
        <p className={s.heroDescription}>
          Connect your wallet to view your multi-chain portfolio across Ethereum, Arbitrum, Base, and more.
        </p>
      </div>
      <div className={s.connectWrapper}>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button onClick={openConnectModal} className={s.connectButton}>
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}
