// app/utils/aiService.ts
import { AIResponse, FINANCIAL_DISCLAIMER } from "@/types/chat";
import { GoogleGenAI } from "@google/genai";
import Constants from "expo-constants";

// Initialize Google GenAI Client

const getApiKey = () => {
    // For development, use environment variable
    if (__DEV__ && process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
        return process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    }

    // For production, use expo config
    return Constants.expoConfig?.extra?.GEMINI_API_KEY;
};

const ai = new GoogleGenAI({
    apiKey: getApiKey(),
});

export const AI_SYSTEM_PROMPT = `You are an AI stock assistant that provides educational analysis and insights about stocks and financial markets.

Your role is to:
1. Analyze stock data and provide educational insights
2. Explain market trends and movements in simple terms
3. Help users understand financial concepts
4. Provide balanced analysis including both opportunities and risks
5. Always include appropriate disclaimers about financial advice

Key guidelines:
- Always be educational and informative, never give direct buy/sell advice
- Include both positive and negative aspects in your analysis
- Reference specific data points when available (price, volume, market cap, etc.)
- Explain financial terms for beginners
- Be conversational but professional
- Always end response with a disclaimer about not being financial advice
- Keep responses concise and actionable
- Focus on data-driven insights rather than speculation

When analyzing stocks, consider:
- Current price and recent performance
- Company fundamentals (sector, industry, market cap)
- Technical indicators and trends
- Market context and broader economic factors
- Risk factors and potential concerns

Remember: You're an educational tool, not a financial advisor.`;

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

interface GeminiRequestOptions {
    userMessage: string;
    stockContext?: StockContext;
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function sendAIRequest({
    userMessage,
    stockContext,
    conversationHistory = [],
}: GeminiRequestOptions): Promise<AIResponse> {
    // ✅ Model priority list - tries models in order
    const modelPriority = [
        "gemini-2.5-flash-lite",      // Best free tier limits (1000 RPD)
        "gemini-2.5-flash",            // Good fallback (250 RPD)
        "gemini-2.0-flash-001",        // Stable version (200 RPD)
    ];

    try {
        let contextString = "";

        if (stockContext) {
            contextString = `
Current Stock Context:

- Symbol: ${stockContext.symbol}
- Current Price: $${stockContext.currentPrice?.toFixed(2) || "N/A"}
- Change: ${stockContext.change >= 0 ? "+" : ""}${stockContext.change?.toFixed(2) || "0"} (${stockContext.percentChange >= 0 ? "+" : ""}${stockContext.percentChange?.toFixed(2) || "0"}%)
- Company: ${stockContext.companyName || "N/A"}
- Sector: ${stockContext.sector || "N/A"}
- Industry: ${stockContext.industry || "N/A"}
- Market Cap: ${stockContext.marketCap || "N/A"}
- Volume: ${stockContext.volume?.toLocaleString() || "N/A"}
${stockContext.summary ? `- Summary: ${stockContext.summary}` : ""}

Please analyze this stock data and answer the user's question.
`;
        }

        let fullPrompt = AI_SYSTEM_PROMPT + "\n\n";

        conversationHistory.forEach((msg) => {
            fullPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n\n`;
        });

        fullPrompt += `${contextString}\n\nUser: ${userMessage}\n\nAssistant:`;

        console.log("🔍 Sending to AI...");

        // ✅ Try each model in priority order
        let response: any = null;
        let lastError: any = null;

        for (let i = 0; i < modelPriority.length; i++) {
            const model = modelPriority[i];
            
            try {
                console.log(`🤖 Trying model: ${model}`);
                
                response = await ai.models.generateContent({
                    model: model,
                    contents: fullPrompt,
                });

                console.log(`✅ Success with model: ${model}`);
                break; // Success! Exit loop
                
            } catch (error: any) {
                lastError = error;
                console.log(`⚠️ Model ${model} failed:`, error?.status || error?.message);
                
                // If it's the last model, throw the error
                if (i === modelPriority.length - 1) {
                    throw error;
                }
                
                // For 503 (overloaded) or 429 (quota), try next model immediately
                if (error?.status === 503 || error?.status === 429) {
                    console.log(`🔄 Trying next model...`);
                    continue;
                }
                
                // For other errors, throw immediately
                throw error;
            }
        }

        if (!response) {
            throw lastError || new Error("All models failed");
        }

        console.log("📦 Got response:", response);

        // ✅ Extract text from response
        const aiMessage = response.text || "Sorry, I could not generate a response.";

        console.log("✅ AI Message:", aiMessage.substring(0, 100) + "...");
        
        const suggestions = extractSuggestions(aiMessage, stockContext);

        return {
            message: `${aiMessage}\n\n${FINANCIAL_DISCLAIMER}`,
            suggestions,
            relatedStocks: stockContext ? [stockContext.symbol] : undefined,
        };
    } catch (error: any) {
        console.error("❌ Google API Error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));

        let errorMessage = "I'm having trouble connecting to the AI service right now. Please try again later.";

        if (error?.status === 429 || error?.message?.includes("quota")) {
            errorMessage = "I've reached the daily limit. Please try again later or upgrade to a paid plan for unlimited access.";
        } else if (error?.status === 401 || error?.message?.includes("API_KEY")) {
            errorMessage = "There's an authentication error. Please check your API key.";
        } else if (error?.status === 403) {
            errorMessage = "Access denied. Please contact support.";
        } else if (error?.status === 404 || error?.message?.includes("not found")) {
            errorMessage = "AI model temporarily unavailable. Please try again.";
        } else if (error?.status === 503 || error?.message?.includes("overloaded")) {
            errorMessage = "All AI models are currently busy. Please try again in a few moments.";
        } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
            errorMessage = "No internet connection. Please check your connection and try again.";
        }

        return {
            message: `${errorMessage}\n\nIn the meantime, you can:\n• Browse stock details and charts\n• Check your portfolio\n• Review your watchlist`,
            suggestions: [
                "Check stock prices manually",
                "Review your watchlist",
                "Try again in a few minutes",
            ],
        };
    }
}


function extractSuggestions(message: string, context?: StockContext): string[] {
    const suggestions: string[] = [];

    if (context) {
        suggestions.push(`Tell me more about ${context.symbol}`);
        suggestions.push(`What's the market sentiment for ${context.symbol}?`);
        suggestions.push(`Compare ${context.symbol} with competitors`);
        suggestions.push(`Explain the recent price movement for ${context.symbol}`);
    } else {
        // General suggestions when no stock context
        suggestions.push("Analyze my portfolio");
        suggestions.push("What are the trending stocks today?");
        suggestions.push("Explain market trends");
    }

    // Add context-specific suggestions
    if (message.toLowerCase().includes("risk")) {
        suggestions.push("What are the risks for this stock?");
    }

    if (message.toLowerCase().includes("technical")) {
        suggestions.push("Show me technical analysis");
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
}

// ✅ FIXED: Safe property access with proper null checks
export function formatStockForAi(stockData: any, profileData?: any): StockContext {
    // Helper function to safely parse price strings
    const parsePrice = (value: any): number => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const cleaned = value.replace(/[$,]/g, "");
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    // Helper function to safely parse percentage strings
    const parsePercent = (value: any): number => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const cleaned = value.replace(/[%,]/g, "");
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    // Extract values with fallbacks
    const currentPrice = parsePrice(stockData?.lastsale || stockData?.regularMarketPrice || 0);
    const change = parsePrice(stockData?.netchange || stockData?.regularMarketChange || 0);
    const percentChange = parsePercent(stockData?.pctchange || stockData?.regularMarketChangePercent || 0);

    return {
        symbol: stockData?.symbol || "UNKNOWN",
        currentPrice,
        change,
        percentChange,
        companyName:
            stockData?.name ||
            stockData?.longName ||
            stockData?.shortName ||
            profileData?.longName ||
            profileData?.shortName ||
            stockData?.symbol ||
            "Unknown Company",
        sector: profileData?.sector || "N/A",
        industry: profileData?.industry || "N/A",
        volume: stockData?.volume || stockData?.regularMarketVolume || undefined,
        marketCap: stockData?.marketCap || profileData?.marketCap || undefined,
        summary: profileData?.longBusinessSummary
            ? `${profileData.longBusinessSummary.slice(0, 300)}...`
            : undefined,
    };
}
