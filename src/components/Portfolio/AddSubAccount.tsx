'use client';

import { useState } from 'react';
import { isAddress } from 'viem';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import s from './Portfolio.module.scss';

interface AddSubAccountProps {
  onAdd: (address: string) => { success: boolean; error?: string };
}

export function AddSubAccount({ onAdd }: AddSubAccountProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    if (!isAddress(address.trim())) {
      setError('Invalid Ethereum address');
      return;
    }

    const result = onAdd(address.trim());
    if (result.success) {
      setAddress('');
    } else {
      setError(result.error || 'Failed to add account');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={s.addSubAccount}>
      <div className={s.addInputWrapper}>
        <Input
          type="text"
          placeholder="Add sub-account address (0x...)"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setError(null);
          }}
          className={s.addInput}
        />
        <Button type="submit" size="icon" className={s.addButton}>
          <Plus className="size-4" />
        </Button>
      </div>
      {error && <p className={s.addError}>{error}</p>}
    </form>
  );
}
