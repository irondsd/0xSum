// USD₮0 is Tether on Arbitrum; some indexers render the ₮ as ASCII "T"
export const normalizeTokenSymbol = (symbol: string) =>
  symbol.toLowerCase().replace('usd₮0', 'usdt').replace('usdt0', 'usdt');
