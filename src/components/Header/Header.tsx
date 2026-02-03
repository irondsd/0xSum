'use client';

// import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ThemeToggle } from './ThemeToggle';
import { OfflineIndicator } from './OfflineIndicator';
import s from './Header.module.scss';
import { InlineSvg } from '@irondsd/inline-svg';
import { useUpdate } from '@/hooks/useUpdate';
import { ConnectButton } from '../ConnectButton/ConnectButton';

export function Header() {
  const { refetchAll } = useUpdate();

  return (
    <header className={s.header}>
      <div className={s.logo} onClick={refetchAll}>
        <InlineSvg src="/images/logo.svg" className={s.logoIcon} />
        <span className={s.logoText}>0xSum</span>
      </div>
      <OfflineIndicator />
      <div className={s.actions}>
        <ThemeToggle />
        <ConnectButton />
      </div>
    </header>
  );
}
