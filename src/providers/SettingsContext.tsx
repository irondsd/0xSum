'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  hideSmallBalances: boolean;
  toggleHideSmallBalances: () => void;
  threshold: number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const threshold = 1.0; // Hardcoded threshold: $1.00

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('settings_hideSmallBalances');
      if (stored !== null) {
        setHideSmallBalances(stored === 'true');
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
  }, []);

  const toggleHideSmallBalances = () => {
    setHideSmallBalances((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem('settings_hideSmallBalances',String(newValue));
      } catch (e) {
        console.error('Failed to save settings to localStorage', e);
      }
      return newValue;
    });
  };

  return (
    <SettingsContext.Provider value={{ hideSmallBalances, toggleHideSmallBalances, threshold }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
