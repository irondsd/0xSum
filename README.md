# 0x∑ or 0xSum

A Web3 portfolio tracker that consolidates your crypto holdings across multiple wallets and blockchains in one intuitive dashboard.

## Features

- **Multi-Wallet Tracking**: Connect a primary account via standard wallet connection, then add unlimited sub-accounts that are saved locally for seamless portfolio management
- **Multi-Chain Support**: Track your assets across multiple blockchains (easily extensible to add more chains)
- **Real-Time Pricing**: Token prices powered by CoinMarketCap API for accurate valuation
- **DeFi Protocol Integration**: Built-in support for Yearn Finance with an extensible architecture to add more protocols
- **Offline Support**: Works offline with cached data for reliability
- **Light/Dark Mode**: Comfortable viewing in any environment

## Getting Started

### Prerequisites

- Node.js 18+
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Architecture

This project is built with extensibility in mind. The modular structure allows:

- **Protocol Pricing**: Add new DeFi protocols by creating a pricing module in `src/protocols/`
- **Chain Support**: Extend `src/config/chains.ts` to add new blockchain networks
- **Token Lists**: Update `src/config/tokens.ts` to include additional tokens

### Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [wagmi](https://wagmi.sh) - Web3 hooks for Ethereum
- [React Query](https://tanstack.com/query) - Data fetching and caching
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [SCSS Modules](https://sass-lang.com) - Styling

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_DRPC_API_KEY=your_drpc_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

See `.env.local.example` for reference.

### Required API Keys

- **WalletConnect Project ID**: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- **dRPC API Key**: Get from [dRPC](https://drpc.org/)
- **CoinMarketCap API Key**: Get from [CoinMarketCap API](https://coinmarketcap.com/api/)

## Contributing

Contributions are welcome! Areas for enhancement include:

- Adding support for additional chains
- Extending token lists
- Implementing more DeFi protocols
- UI/UX improvements
- Bug fixes and performance optimizations

Please feel free to submit PRs with improvements.

## License

Open source - feel free to use and modify as needed.
