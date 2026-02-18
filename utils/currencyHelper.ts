// utils/currencyHelper.ts

// Indian stock symbols and exchanges
const INDIAN_EXCHANGES = ['.NS', '.BO', '.BSE', '.NSE'];

const INDIAN_STOCKS = [
  'IRCTC', 'TCS', 'INFY', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 
  'SBIN', 'BHARTIARTL', 'ITC', 'HINDUNILVR', 'KOTAKBANK', 
  'LT', 'ASIANPAINT', 'AXISBANK', 'BAJFINANCE', 'WIPRO',
  'MARUTI', 'TITAN', 'SUNPHARMA', 'ULTRACEMCO', 'NESTLEIND',
  'TATAMOTORS', 'TATASTEEL', 'TECHM', 'INDUSINDBK', 'POWERGRID',
  'NTPC', 'ONGC', 'COALINDIA', 'GRASIM', 'DRREDDY'
];

export const detectCurrency = (symbol: string): 'INR' | 'USD' => {
  if (!symbol) return 'USD';
  
  const upperSymbol = symbol.toUpperCase();
  
  // Check for Indian exchange suffix
  const hasIndianExchange = INDIAN_EXCHANGES.some(exchange => 
    upperSymbol.endsWith(exchange)
  );
  
  if (hasIndianExchange) return 'INR';
  
  // Check known Indian stocks
  const cleanSymbol = upperSymbol.split('.')[0];
  if (INDIAN_STOCKS.includes(cleanSymbol)) return 'INR';
  
  return 'USD';
};

export const getCurrencySymbol = (currency: 'INR' | 'USD'): string => {
  return currency === 'INR' ? '₹' : '$';
};

export const formatPrice = (price: number, currency: 'INR' | 'USD'): string => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${price.toFixed(2)}`;
};
