import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Web3Provider } from '@/providers/Web3Provider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SettingsProvider } from '@/providers/SettingsContext';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import s from './layout.module.scss';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const APP_NAME = '0xSum';
const APP_DESCRIPTION = 'Track your crypto portfolio across multiple wallets and chains';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: '0x∑ - 0xSum',
  description: `0x∑ - ${APP_DESCRIPTION}`,
  manifest: '/site.webmanifest',
  icons: {
    icon: '/web-app-manifest-192x192.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
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
