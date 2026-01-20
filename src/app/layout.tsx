import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Web3Provider } from '@/providers/Web3Provider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SettingsProvider } from '@/providers/SettingsContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import s from './layout.module.scss';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: '0xSum - Multi-Wallet Portfolio Tracker',
  description: 'Track your crypto portfolio across multiple wallets and chains',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SettingsProvider>
            <Web3Provider>
              <div className={s.layout}>
                <Header />
                <main className={s.main}>{children}</main>
                <Footer />
              </div>
            </Web3Provider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
