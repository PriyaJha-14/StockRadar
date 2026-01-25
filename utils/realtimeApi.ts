// utils/realtimeApi.ts

import { useEffect, useState } from 'react';

const FINNHUB_API_KEY = (process.env.EXPO_PUBLIC_FINNHUB_API_KEY || '').replace(/^["']|["']$/g, '');

if (!FINNHUB_API_KEY) {
  console.warn('⚠️ FINNHUB_API_KEY not found.');
}

export interface LiveStockData {
  price: number;
  change: number;
  percentChange: number;
  timestamp: number;
  isLive: boolean;
  source?: string;
}

function isIndianStock(symbol: string): boolean {
  return symbol.endsWith('.NS') || symbol.endsWith('.BO');
}

/**
 * US stocks: Use Finnhub
 */
async function getUSStockPrice(symbol: string): Promise<LiveStockData | null> {
  if (!FINNHUB_API_KEY) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();

    if (!data.c || data.c === 0) return null;

    console.log(`✅ ${symbol}: $${data.c.toFixed(2)} (Finnhub - Real-time)`);

    return {
      price: data.c,
      change: data.d || 0,
      percentChange: data.dp || 0,
      timestamp: Date.now(),
      isLive: true,
      source: 'Finnhub',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Universal Yahoo Finance fallback (works for US & Indian stocks)
 */
async function getStockPriceFromYahoo(symbol: string): Promise<LiveStockData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result?.meta) return null;

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    
    if (!currentPrice || currentPrice === 0) return null;

    const change = currentPrice - previousClose;
    const percentChange = (change / previousClose) * 100;

    const currency = isIndianStock(symbol) ? '₹' : '$';
    console.log(`✅ ${symbol}: ${currency}${currentPrice.toFixed(2)} (Live - 1min delay)`);

    return {
      price: currentPrice,
      change: change,
      percentChange: percentChange,
      timestamp: Date.now(),
      isLive: true,
      source: 'Yahoo Finance',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get real-time price for any stock
 */
export async function getRealtimePrice(symbol: string): Promise<LiveStockData | null> {
  if (!symbol) return null;

  if (isIndianStock(symbol)) {
    // Indian stocks: Use Yahoo Finance (1-min delay, reliable)
    return getStockPriceFromYahoo(symbol);
  } else {
    // US stocks: Try Finnhub first, fallback to Yahoo
    const finnhubData = await getUSStockPrice(symbol);
    if (finnhubData) return finnhubData;
    
    return getStockPriceFromYahoo(symbol);
  }
}

/**
 * React Hook for real-time data
 */
export function useRealtimePrice(symbol: string, refreshInterval: number = 5000) {
  const [liveData, setLiveData] = useState<LiveStockData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;

    let isMounted = true;
    let interval: NodeJS.Timeout;

    const fetchPrice = async () => {
      setLoading(true);
      const data = await getRealtimePrice(symbol);
      
      if (isMounted && data) {
        setLiveData(data);
      }
      setLoading(false);
    };

    fetchPrice();
    interval = setInterval(fetchPrice, refreshInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol, refreshInterval]);

  return { liveData, loading };
}
