export const fetchTokenPrices = async (symbols: string[]) => {
  if (!symbols.length) return {};
  const query = symbols.join(',');
  const res = await fetch(`/api/tokenPrices?symbols=${query}`);
  if (!res.ok) throw new Error('Failed to fetch prices');
  return res.json() as Promise<Record<string, number>>;
};
