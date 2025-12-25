export interface StockContext {
    symbol: string;
    currentPrice: number;
    change: number;
    percentChange: number;
    companyName: string;
    sector?: string;
    industry?: string;
    volume?: number;
    marketCap?: string;
    summary?: string;
}



export function formatStockForAi(
    stockData: any,
    profileData: any
): StockContext {

    return {
        symbol: stockData.symbol,
        currentPrice: parseFloat(stockData.lastsale?.replace("$", "") || "0"),
        change: parseFloat(stockData.netchange || "0"),
        percentChange: parseFloat(stockData.pctchange?.replace("%", "") || "0"),
        companyName: stockData.name || profileData.longName,
        sector: profileData.sector,
        industry: profileData.industry,
        marketCap: stockData.marketCap,
        summary: profileData.longBusinesssummary?.slice(0, 300) + "..."
    }
}