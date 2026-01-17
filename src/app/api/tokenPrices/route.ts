import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const revalidate = 60; // 1 minute

const apiKey = process.env.COINMARKETCAP_API_KEY!;
const baseUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

type CMCResponse = {
  data: Record<
    string,
    {
      id: number;
      name: string;
      symbol: string;
      quote: {
        USD: {
          price: number;
        };
      };
    }
  >;
};

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get('symbols');

  if (!symbols) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  if (!symbols.length) return NextResponse.json({});

  const headers = new Headers();
  headers.append('X-CMC_PRO_API_KEY', apiKey);
  const response: CMCResponse = await fetch(`${baseUrl}?symbol=${symbols}&convert=usd`, { headers }).then((res) =>
    res.json(),
  );

  const data = Object.values(response.data).reduce(
    (acc, { symbol, quote }) => {
      acc[symbol.toLowerCase()] = quote.USD.price;
      return acc;
    },
    {} as Record<string, number>,
  );

  return NextResponse.json(data);
}
