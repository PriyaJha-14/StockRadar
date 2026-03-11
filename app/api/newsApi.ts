// app/api/newsApi.ts
import axios from 'axios';

const GNEWS_API_KEY = process.env.EXPO_PUBLIC_GNEWS_API_KEY;

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
    const cleanSymbol = symbol
      .replace('.NS', '')
      .replace('.BO', '')
      .replace('.BSE', '');

    const response = await axios.get(
      `https://gnews.io/api/v4/search`,
      {
        params: {
          q: cleanSymbol,
          lang: 'en',
          country: 'in',
          max: 10,
          apikey: GNEWS_API_KEY,
        },
        timeout: 8000,
      }
    );

    const articles = response.data?.articles || [];

    return articles.map((item: any, index: number) => ({
      id: index,
      category: 'general',
      datetime: Math.floor(new Date(item.publishedAt).getTime() / 1000),
      headline: item.title || 'No title',
      summary: item.description || '',
      source: item.source?.name || 'GNews',
      url: item.url || '#',
      image: item.image || '',
      related: symbol,
    }));

  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
};


// Fetch general market news
export const fetchMarketNews = async (category = 'general'): Promise<NewsArticle[]> => {
  try {
    const response = await axios.get(
      `https://gnews.io/api/v4/search`,
      {
        params: {
          q: 'stock market india NSE BSE',
          lang: 'en',
          country: 'in',
          max: 10,
          apikey: GNEWS_API_KEY,
        },
        timeout: 8000,
      }
    );

    const articles = response.data?.articles || [];

    return articles.map((item: any, index: number) => ({
      id: index,
      category: category,
      datetime: Math.floor(new Date(item.publishedAt).getTime() / 1000),
      headline: item.title || 'No title',
      summary: item.description || '',
      source: item.source?.name || 'GNews',
      url: item.url || '#',
      image: item.image || '',
      related: '',
    }));

  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
};
