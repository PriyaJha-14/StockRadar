// utils/searchService.ts

export interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  country?: string;
}

/**
 * Search stocks from NSE (India), BSE (India), and US markets
 */
export async function searchStocks(query: string): Promise<SearchResult[]> {
  try {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const results: SearchResult[] = [];
    const searchQuery = query.trim().toUpperCase();

    // 1️⃣ Search NSE (National Stock Exchange - India)
    try {
      const nseUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchQuery)}.NS&quotesCount=10&newsCount=0`;
      const nseResponse = await fetch(nseUrl);
      
      if (nseResponse.ok) {
        const nseData = await nseResponse.json();
        (nseData.quotes || []).forEach((item: any) => {
          if (item.symbol && item.shortname) {
            results.push({
              symbol: item.symbol,
              name: item.shortname || item.longname,
              exchange: 'NSE',
              country: 'India',
            });
          }
        });
      }
    } catch (e) {
      console.log('NSE search failed:', e);
    }

    // 2️⃣ Search BSE (Bombay Stock Exchange - India)
    try {
      const bseUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchQuery)}.BO&quotesCount=10&newsCount=0`;
      const bseResponse = await fetch(bseUrl);
      
      if (bseResponse.ok) {
        const bseData = await bseResponse.json();
        (bseData.quotes || []).forEach((item: any) => {
          if (item.symbol && item.shortname) {
            const exists = results.find(r => r.name === item.shortname);
            if (!exists) {
              results.push({
                symbol: item.symbol,
                name: item.shortname || item.longname,
                exchange: 'BSE',
                country: 'India',
              });
            }
          }
        });
      }
    } catch (e) {
      console.log('BSE search failed:', e);
    }

    // 3️⃣ Search US Stocks
    try {
      const usUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchQuery)}&quotesCount=20&newsCount=0`;
      const usResponse = await fetch(usUrl);
      
      if (usResponse.ok) {
        const usData = await usResponse.json();
        (usData.quotes || []).forEach((item: any) => {
          if (
            item.symbol && 
            item.shortname && 
            !item.symbol.includes('.NS') && 
            !item.symbol.includes('.BO')
          ) {
            results.push({
              symbol: item.symbol,
              name: item.shortname || item.longname,
              exchange: item.exchDisp || 'NASDAQ',
              country: 'USA',
            });
          }
        });
      }
    } catch (e) {
      console.log('US search failed:', e);
    }

    // Remove duplicates
    const unique = results.filter((item, index, self) =>
      index === self.findIndex((t) => t.symbol === item.symbol)
    );

    return unique.slice(0, 30);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Popular stocks for quick access
 */
export const POPULAR_STOCKS = {
  india: [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
    { symbol: 'INFY.NS', name: 'Infosys' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
    { symbol: 'SBIN.NS', name: 'State Bank of India' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
    { symbol: 'WIPRO.NS', name: 'Wipro' },
  ],
  us: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Alphabet (Google)' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'META', name: 'Meta (Facebook)' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'NFLX', name: 'Netflix' },
  ],
};

/**
 * Check if a stock is Indian
 */
export function isIndianStock(symbol: string): boolean {
  return symbol.endsWith('.NS') || symbol.endsWith('.BO');
}
