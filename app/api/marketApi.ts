// app/api/stockApi.ts
import axios from "axios";
import Constants from "expo-constants";

// ========= API Key Configuration =========

const getApiKey = () => {
    if (__DEV__ && process.env.EXPO_PUBLIC_FINANCE_API_KEY) {
        return process.env.EXPO_PUBLIC_FINANCE_API_KEY;
    }
    return Constants.expoConfig?.extra?.FINANCE_API_KEY;
};

const getApiHost = () => {
    if (__DEV__ && process.env.EXPO_PUBLIC_FINANCE_API_HOST) {
        return process.env.EXPO_PUBLIC_FINANCE_API_HOST;
    }
    return Constants.expoConfig?.extra?.FINANCE_API_HOST;
};

console.log("API Key:", getApiKey(), "API Host:", getApiHost());

const baseHeaders = {
    "x-rapidapi-key": getApiKey(),
    "x-rapidapi-host": getApiHost(),
};

const BASE_URL = `https://${getApiHost()}`;

// ========= Type Definitions =========

// Market Tickers
export interface StockTicker {
    symbol: string;
    name: string;
    lastsale: string;
    netchange: string;
    pctchange: string;
    marketCap: string;
}

export interface MarketTickersResponse {
    meta: {
        version: string;
        status: number;
        copyright: string;
        totalrecords: number;
        headers: {
            symbol: string;
            name: string;
            lastsale: string;
            netchange: string;
            pctchange: string;
        };
    };
    body: StockTicker[];
}

// Stock History
export interface StockHistoryPoint {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    date: string;
    date_utc: number;
}

export interface StockHistoryData {
    body: {
        [timestamp: string]: StockHistoryPoint;
    };
    meta: {
        chartPreviousClose: number;
        currency: string;
        dataGranularity: string;
        exchangeName: string;
        exchangeTimezoneName: string;
        fiftyTwoWeekHigh: number;
        fiftyTwoWeekLow: number;
        firstTradeDate: number;
        fullExchangeName: string;
        gmtoffset: number;
        hasPrePostMarketData: boolean;
        instrumentType: string;
        longName: string;
        previousClose: number;
        priceHint: number;
        processedTime: string;
        range: string;
        regularMarketDayHigh: number;
        regularMarketDayLow: number;
        regularMarketPrice: number;
        regularMarketTime: number;
        regularMarketVolume: number;
        scale: number;
        shortName: string;
        status: number;
        symbol: string;
        timezone: string;
        version: string;
    };
}

// Stock Module/Company Data
export interface StockModuleData {
    meta: {
        version: string;
        status: number;
    };
    body: {
        companyOfficers: any;
        address1: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        phone: string;
        website: string;
        industry: string;
        industryKey: string;
        industryDisp: string;
        sector: string;
        sectorKey: string;
        sectorDisp: string;
        longBusinessSummary: string;
        fullTimeEmployees: number;
    };
}

// Stock Quote
export interface StockQuote {
    symbol: string;
    shortName: string;
    longName: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketTime: string;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
    regularMarketPreviousClose: number;
    regularMarketOpen: number;
    fiftyTwoWeekLow: number;
    fiftyTwoWeekHigh: number;
    currency: string;
    exchangeName: string;
    marketCap: number;
    trailingPE?: number;
    dividendYield?: number;
}

export interface QuotesResponse {
    meta: {
        version: string;
        status: number;
    };
    body: StockQuote[];
}

// Insider Trades
export interface InsiderTrade {
    symbol: string;
    insiderName: string;
    position: string;
    transactionDate: string;
    transactionType: string;
    shares: number;
    price: number;
    totalValue: number;
    filingDate: string;
}

export interface InsiderTradesResponse {
    meta: {
        version: string;
        status: number;
        copyright: string;
    };
    body: InsiderTrade[];
}

// News
export interface NewsItem {
    uuid: string;
    title: string;
    publisher: string;
    link: string;
    providerPublishTime: number;
    type: string;
    thumbnail?: {
        resolutions: Array<{
            url: string;
            width: number;
            height: number;
        }>;
    };
    relatedTickers?: string[];
}

export interface NewsResponse {
    meta: {
        version: string;
        status: number;
    };
    body: NewsItem[];
}

// Search
export interface SearchResult {
    symbol: string;
    name: string;
    exch: string;
    type: string;
    exchDisp: string;
    typeDisp: string;
}

export interface SearchResponse {
    count: number;
    quotes: SearchResult[];
    news: any[];
}

// ========= Helper Function for Error Handling =========

const handleApiError = (error: any, context: string) => {
    if (error.response?.status === 429) {
        console.warn(`⚠️ Rate limit exceeded for ${context}. Please wait before trying again.`);
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
    }
    
    console.error(`Error in ${context}:`, error.message || error);
    throw error;
};

// ========= API Functions =========

/**
 * Fetch paginated market tickers (Top Movers, Market Overview)
 */
export async function fetchMarketTickers(
    page: number = 1,
    type: string = "STOCKS"
): Promise<MarketTickersResponse> {
    const options = {
        method: "GET",
        url: `${BASE_URL}/api/v2/markets/tickers`,
        params: {
            page: page.toString(),
            type,
        },
        headers: baseHeaders,
    };

    try {
        const response = await axios.request<MarketTickersResponse>(options);
        return response.data;
    } catch (error) {
        handleApiError(error, "fetchMarketTickers");
        throw error;
    }
}

/**
 * Fetch stock quotes for multiple symbols
 */
export async function fetchStockQuotes(
    symbols: string[]
): Promise<QuotesResponse> {
    const options = {
        method: "GET",
        url: `${BASE_URL}/api/v1/markets/stock/quotes`,
        params: {
            ticker: symbols.join(","),
        },
        headers: baseHeaders,
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        handleApiError(error, "fetchStockQuotes");
        throw error;
    }
}

/**
 * Fetch stock module data (company profile, statistics, etc.)
 */
export async function fetchStockModule(
    ticker: string,
    module: "asset-profile" | "summary-detail" | "default-key-statistics"
): Promise<StockModuleData> {
    const options = {
        method: "GET",
        url: `${BASE_URL}/api/v1/markets/stock/modules`,
        params: {
            ticker,
            module,
        },
        headers: baseHeaders,
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        handleApiError(error, "fetchStockModule");
        throw error;
    }
}

/**
 * Fetch historical OHLCV data for charts
 */
export async function fetchStockHistory(
    symbol: string,
    interval: "1m" | "5m" | "15m" | "1d" | "1w" | "1mo" = "1d",
    diffandsplits: "true" | "false" = "true"
): Promise<StockHistoryData> {
    const options = {
        method: "GET",
        url: `${BASE_URL}/api/v1/markets/stock/history`,
        params: {
            symbol,
            interval,
            diffandsplits,
        },
        headers: baseHeaders,
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        handleApiError(error, `fetchStockHistory for ${symbol}`);
        throw error;
    }
}

/**
 * Fetch insider trading data
 */
export async function fetchInsiderTrades(symbol: string): Promise<InsiderTradesResponse> {
    const options = {
        method: "GET",
        url: `${BASE_URL}/api/v2/insiders/trades`,
        params: {
            symbol,
        },
        headers: baseHeaders,
    };

    try {
        const response = await axios.request<InsiderTradesResponse>(options);
        return response.data;
    } catch (error) {
        handleApiError(error, `fetchInsiderTrades for ${symbol}`);
        throw error;
    }
}

/**
 * Fetch latest news (optionally filtered by symbol)
 */
export async function fetchStockNews(symbol?: string): Promise<NewsResponse> {
    const options = {
        method: "GET",
        url: `${BASE_URL}/api/v2/news`,
        params: symbol ? { symbol } : {},
        headers: baseHeaders,
    };

    try {
        const response = await axios.request<NewsResponse>(options);
        return response.data;
    } catch (error) {
        handleApiError(error, "fetchStockNews");
        throw error;
    }
}

/**
 * Search stocks by query string
 */
export async function searchStocks(query: string): Promise<SearchResponse> {
    const options = {
        method: "GET",
        url: `${BASE_URL}/api/v2/search`,
        params: {
            q: query,
        },
        headers: baseHeaders,
    };

    try {
        const response = await axios.request<SearchResponse>(options);
        return response.data;
    } catch (error) {
        handleApiError(error, "searchStocks");
        throw error;
    }
}
