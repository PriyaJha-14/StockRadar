import axios from 'axios';

const FINNHUB_API_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export interface NewsArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

// Fetch company-specific news
export const fetchCompanyNews = async (symbol: string): Promise<NewsArticle[]> => {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7); // Last 7 days
    const toDate = new Date();
    
    const response = await axios.get(`${FINNHUB_BASE_URL}/company-news`, {
      params: {
        symbol: symbol,
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
        token: FINNHUB_API_KEY,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
};

// Fetch general market news
export const fetchMarketNews = async (category = 'general'): Promise<NewsArticle[]> => {
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/news`, {
      params: {
        category: category, // Options: general, forex, crypto, merger
        token: FINNHUB_API_KEY,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
};
