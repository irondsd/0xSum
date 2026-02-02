'use client';

import { useAccount } from 'wagmi';
import { NotConnected } from './NotConnected';
import { PortfolioDashboard } from './PortfolioDashboard';
import s from './Portfolio.module.scss';

export function Portfolio() {
  const { isConnected, address } = useAccount();

  return <div className={s.container}>{isConnected && address ? <PortfolioDashboard /> : <NotConnected />}</div>;
}
