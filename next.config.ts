import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: '/~offline' }],
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: !isProd,
});

const nextConfig: NextConfig = {
  // Serwist uses webpack plugins, this silences the Next.js 16 Turbopack warning
  turbopack: {},
};

export default withSerwist(nextConfig);
