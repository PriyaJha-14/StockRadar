// app/api/financialApi.ts

import { fetchStockQuotes } from "./marketApi";

/**
 * Financial Data API Service
 * Uses existing marketApi data with proper type safety
 */

export interface KeyStatistics {
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  sharesOutstanding?: number;
  bookValue?: number;
  dividendYield?: number;
  dividendRate?: number;
  averageVolume?: number;
  volume?: number;
}

export interface FinancialData {
  currentPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  targetMeanPrice?: number;
  recommendationKey?: string;
  totalCash?: number;
  ebitda?: number;
  totalDebt?: number;
  currentRatio?: number;
  totalRevenue?: number;
  debtToEquity?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  grossProfits?: number;
  freeCashflow?: number;
  operatingCashflow?: number;
  earningsGrowth?: number;
  revenueGrowth?: number;
  profitMargins?: number;
}

export interface FinancialSummary {
  symbol: string;
  keyStatistics?: KeyStatistics;
  financialData?: FinancialData;
}

/**
 * Format large numbers
 */
export function formatLargeNumber(num?: number): string {
  if (!num || isNaN(num)) return "N/A";
  
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

/**
 * Format percentages
 */
export function formatPercentage(num?: number): string {
  if (!num || isNaN(num)) return "N/A";
  return `${(num * 100).toFixed(2)}%`;
}

/**
 * Format regular numbers
 */
export function formatNumber(num?: number, decimals: number = 2): string {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  return num.toFixed(decimals);
}

/**
 * ✅ FIXED: Safe property access with optional chaining
 */
export async function fetchFinancialSummary(
  symbol: string
): Promise<FinancialSummary | null> {
  try {
    console.log(`📊 Fetching financial data for ${symbol}...`);

    const quoteData = await fetchStockQuotes([symbol]);
    
    if (!quoteData?.body || quoteData.body.length === 0) {
      console.error(`No quote data available for ${symbol}`);
      return null;
    }

    const quote = quoteData.body[0] as any; // ✅ Type as 'any' to avoid errors

    // ✅ Extract key statistics with safe property access
    const keyStatistics: KeyStatistics = {
      marketCap: quote.marketCap,
      trailingPE: quote.trailingPE,
      forwardPE: quote.forwardPE,
      beta: quote.beta,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      fiftyDayAverage: quote.fiftyDayAverage,
      twoHundredDayAverage: quote.twoHundredDayAverage,
      sharesOutstanding: quote.sharesOutstanding,
      bookValue: quote.bookValue,
      dividendYield: quote.dividendYield,
      dividendRate: quote.dividendRate,
      averageVolume: quote.averageVolume,
      volume: quote.regularMarketVolume,
    };

    // ✅ Extract financial data with safe property access
    const financialData: FinancialData = {
      currentPrice: quote.regularMarketPrice,
      targetHighPrice: quote.targetHighPrice,
      targetLowPrice: quote.targetLowPrice,
      targetMeanPrice: quote.targetMeanPrice,
      totalRevenue: quote.totalRevenue,
      ebitda: quote.ebitda,
      grossProfits: quote.grossProfits,
      freeCashflow: quote.freeCashflow,
      operatingCashflow: quote.operatingCashflow,
      revenueGrowth: quote.revenueGrowth,
      earningsGrowth: quote.earningsGrowth,
      returnOnAssets: quote.returnOnAssets,
      returnOnEquity: quote.returnOnEquity,
      debtToEquity: quote.debtToEquity,
      currentRatio: quote.currentRatio,
      profitMargins: quote.profitMargins,
      totalDebt: quote.totalDebt,
      totalCash: quote.totalCash,
    };

    console.log(`✅ Financial data loaded for ${symbol} (using marketApi)`);

    return {
      symbol,
      keyStatistics,
      financialData,
    };
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Calculate Financial Health Score (0-100)
 */
export function calculateHealthScore(financial?: FinancialData): number {
  if (!financial) return 0;

  let score = 0;
  let factors = 0;

  // 1. Profitability (25 points)
  if (financial.profitMargins !== undefined && financial.profitMargins !== null) {
    factors++;
    if (financial.profitMargins > 0.2) score += 25;
    else if (financial.profitMargins > 0.1) score += 20;
    else if (financial.profitMargins > 0.05) score += 15;
    else if (financial.profitMargins > 0) score += 10;
    else score += 5;
  }

  // 2. Liquidity (25 points)
  if (financial.currentRatio !== undefined && financial.currentRatio !== null) {
    factors++;
    if (financial.currentRatio > 2) score += 25;
    else if (financial.currentRatio > 1.5) score += 20;
    else if (financial.currentRatio > 1) score += 15;
    else score += 5;
  }

  // 3. Debt Level (25 points)
  if (financial.debtToEquity !== undefined && financial.debtToEquity !== null) {
    factors++;
    if (financial.debtToEquity < 50) score += 25;
    else if (financial.debtToEquity < 100) score += 20;
    else if (financial.debtToEquity < 150) score += 15;
    else if (financial.debtToEquity < 200) score += 10;
    else score += 5;
  }

  // 4. Growth (25 points)
  if (financial.revenueGrowth !== undefined && financial.revenueGrowth !== null) {
    factors++;
    if (financial.revenueGrowth > 0.2) score += 25;
    else if (financial.revenueGrowth > 0.1) score += 20;
    else if (financial.revenueGrowth > 0.05) score += 15;
    else if (financial.revenueGrowth > 0) score += 10;
    else score += 5;
  }

  // If no factors available, return 50 (neutral)
  if (factors === 0) return 50;

  return Math.round(score / factors * 4);
}

/**
 * Get health score color and label
 */
export function getHealthScoreInfo(score: number): {
  color: string;
  label: string;
  emoji: string;
} {
  if (score >= 80) {
    return { color: "#22c55e", label: "Excellent", emoji: "🟢" };
  } else if (score >= 60) {
    return { color: "#84cc16", label: "Good", emoji: "🟡" };
  } else if (score >= 40) {
    return { color: "#f59e0b", label: "Average", emoji: "🟠" };
  } else {
    return { color: "#ef4444", label: "Poor", emoji: "🔴" };
  }
}
