import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

// Get git revision for cache busting
const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
});

const nextConfig: NextConfig = {
  // Serwist uses webpack plugins, this silences the Next.js 16 Turbopack warning
  turbopack: {},
};

export default withSerwist(nextConfig);
