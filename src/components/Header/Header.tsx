'use client';

// import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { OfflineIndicator } from './OfflineIndicator';
import s from './Header.module.scss';
import { InlineSvg } from '@irondsd/inline-svg';
import { useUpdate } from '@/hooks/useUpdate';
import { ConnectButton } from '../ConnectButton/ConnectButton';
import { cn } from '@/utils/cn';

const navLinks = [
  { href: '/', label: 'Portfolio' },
  { href: '/transactions', label: 'Transactions' },
];

export function Header() {
  const { refetchAll } = useUpdate();
  const pathname = usePathname();

  return (
    <header className={s.header}>
      <div className={s.left}>
        <div className={s.logo} onClick={refetchAll}>
          <InlineSvg src="/images/logo.svg" className={s.logoIcon} />
          <span className={s.logoText}>0xSum</span>
        </div>
        <nav className={s.nav}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={cn(s.navLink, pathname === href && s.navLinkActive)}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <OfflineIndicator />
      <div className={s.actions}>
        <ThemeToggle />
        <ConnectButton />
      </div>
    </header>
  );
}
