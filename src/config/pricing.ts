export type PricingStrategy = 'api' | 'protocol';

export type ProtocolType = 'yearn';

export interface ProtocolPricingConfig {
  type: 'protocol';
  protocol: ProtocolType;
}

export interface ApiPricingConfig {
  type: 'api';
}

export type TokenPricingConfig = ProtocolPricingConfig | ApiPricingConfig;

// Map of normalized symbol to pricing strategy
// If a token is not in this map, it defaults to 'api'
export const TOKEN_PRICING_STRATEGIES: Record<string, TokenPricingConfig> = {
  'yvusdt-1': { type: 'protocol', protocol: 'yearn' },
};
