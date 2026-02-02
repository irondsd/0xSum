'use client';

import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import s from './OfflineIndicator.module.scss';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // if (!isOffline) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={s.indicator}>
          <svg className={s.spinner} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className={s.spinnerTrack} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path
              className={s.spinnerArc}
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className={s.text}>Connecting</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>You&apos;re offline - data may be outdated</TooltipContent>
    </Tooltip>
  );
}
