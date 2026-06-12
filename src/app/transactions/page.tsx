import type { Metadata } from 'next';
import { Transactions } from '@/components/Transactions';

export const metadata: Metadata = {
  title: 'Transactions - 0xSum',
};

export default function Page() {
  return <Transactions />;
}
