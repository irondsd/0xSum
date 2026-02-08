# Copilot instructions for 0xSum

## Build & lint commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format` (write) / `npm run format:check` (verify)

## Environment setup
- Create `.env.local` with:
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
  - `NEXT_PUBLIC_DRPC_API_KEY`
  - `COINMARKETCAP_API_KEY`

## High-level architecture
- **Next.js App Router** in `src/app`: `layout.tsx` wraps `ThemeProvider`, `SettingsProvider`, and `Web3Provider` with shared `Header`/`Footer`; `page.tsx` renders the main `Portfolio`.
- **Data fetching pipeline**: hooks in `src/hooks` use `wagmi` + `@tanstack/react-query` to pull native + ERC20 balances across `supportedChains`, then price them via:
  - `/api/tokenPrices` (`src/app/api/tokenPrices/route.ts`) for CoinMarketCap API pricing
  - protocol pricing modules (`src/protocols/*`) for on-chain pricing (e.g., Yearn)
- **Configuration hub**: `src/config` defines chains (`chains.ts`), token lists (`tokens.ts`), and pricing strategy (`pricing.ts`), which the hooks consume.
- **PWA/offline**: service worker in `src/app/sw.ts` (Serwist) with fallback page `src/app/~offline`; manifest in `src/app/manifest.ts`.

## Key conventions
- Use the `@/` alias for `src/*` imports (see `tsconfig.json` paths).
- Client components/hooks include `'use client'` and typically use SCSS modules (`*.module.scss`) with `s` as the import name.
- Normalize token symbols with `normalizeTokenSymbol()` before indexing `TOKEN_NAMES` or `TOKEN_PRICING_STRATEGIES` (keys are lowercase, with special handling for USDT).
- Adding protocol pricing requires:
  - extending `ProtocolType` + `TOKEN_PRICING_STRATEGIES` in `src/config/pricing.ts`
  - adding `src/protocols/<protocol>/pricing.ts` with `getContractConfig` + `formatPrice`
  - registering the module in `useProtocolPrices` (`src/hooks/useProtocolPrices.ts`)
- Adding chains or tokens flows through `src/config/chains.ts` and `src/config/tokens.ts`; hooks read these lists directly.
