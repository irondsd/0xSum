'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ThemeToggle } from './ThemeToggle';
import s from './Header.module.scss';

export function Header() {
  return (
    <header className={s.header}>
      <div className={s.logo}>
        <span className={s.logoText}>0xSum</span>
      </div>

      <div className={s.actions}>
        <ThemeToggle />
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
      </div>
    </header>
  );
}
