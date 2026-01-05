import { AIResponse, FINANCIAL_DISCLAIMER } from "@/types/chat";
import { GoogleGenAI } from "@google/genai";
import Constants from "expo-constants";

// Intialize Google GenAi Client  


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


export const AI_SYSTEM_PROMPT = `You are an Ai stock assistant that provides educational analysis and insights about stocks and financial markets
Your role is to:
1. Analyze stock data and provide educational insights
2. Explain market trends and movements in simple terms
3. Help users understand financial concepts
4. Provide balanced analysis including both opportunities and risks
5. Always include appropriate disclaimers about financial advice


Key guidelines:
- Always be educational and informative, never give direct buy/sell advice
- Include both positive aand negative aspects in your analyis
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


Remember: You're an educational tool,  not a finacial advisor.



`;

interface GeminiRequestOptions {
    userMessage: string;
    stockContext: StockContext;
    conversationHistory?: Array<{ role: "user" | "assistant", content: string }>;
}


export async function sendAIRequest({
    userMessage,
    stockContext,
    conversationHistory = []

}: GeminiRequestOptions): Promise<AIResponse> {

    try {
        // Build context string from stock data

        let contextString = ""


        if (stockContext) {

            contextString = `
        Current Stock Context:

        - Symbol: ${stockContext.symbol}
        - Current Price: ${stockContext.currentPrice}
        - Change: ${stockContext.change > 0 ? "+" : ""} ${stockContext.change.toFixed(2)}


        (${stockContext.percentChange > 0 ? "+" : ""
                } ${stockContext.percentChange.toFixed(2)}%)

        - Company: ${stockContext.companyName || "N/A"}
        - Sector: ${stockContext.sector || "N/A"}
        - Industry: ${stockContext.industry || "N/A"}
        - Market Cap: ${stockContext.marketCap || "N/A"}
        - Volume: ${stockContext.volume || "N/A"}
        ${stockContext.summary ? `- Summary: ${stockContext.summary}` : ""}

        Please analyze this stock data and answer the user's question. 
        `;
        }

        // Build the conversation prompt for Google 

        let fullPrompt = AI_SYSTEM_PROMPT + "\n\n"

        // Add conversation history

        conversationHistory.forEach((msg) => {
            fullPrompt += `${msg.role === "user" ? "User" : "Assistant"} ${msg.content}\n\n`;
        });


        // Add Current user message with context

        fullPrompt += `${contextString}\n\nUser: ${userMessage}\n\nAssistant:`;

        // Make Google Api call using new @google/genai format

        // Make Google Api call using new @google/genai format
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",  // ✅ CHANGED: Better rate limits
            contents: fullPrompt,
        });

        const aiMessage = response.text || "Sorry, i could not generate a response ";



        // Extract suggestions from the response

        const suggestions = extractSuggestions(aiMessage, stockContext);


        return {
            message: `${aiMessage}\n\n${FINANCIAL_DISCLAIMER}`,
            suggestions,
            relatedStocks: stockContext ? [stockContext.symbol] : undefined,
        };

    } catch (error) {

        console.error("Google Api Error:", error);

        // Handle specific errors

        let errorMessage = "I'm having trouble connecting to the Ai service right now. Please try again later.";

        if (error?.status === 429 || error?.message?.includes("quota")) {
            errorMessage = "I'm sorry. I've reached my daily limit. Please try again tomorrow.";
        } else if (error?.status === 401 || error?.message?.includes("API_KEY")) {
            errorMessage = "There's an authentication error. Please check your API key.";
        } else if (error?.status === 403) {
            errorMessage = "Access denied. Please contact support.";

        } else if (!navigator.onLine) {
            errorMessage = "No internet connection. Please check your internet connection and try again.";
        }

        return {
            message: `${errorMessage}\n\n In the meantime, you can:\n *Browse stock details and charts`,
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
        suggestions.push(`What's the market sentiment today for ${context.symbol}?`);
        suggestions.push(`Should I hold or sell ${context.symbol}?`);
        suggestions.push(`Compare ${context.symbol} with competitors`);
        suggestions.push(`Explain the recent price movement for ${context.symbol}`);
    }

    // Add some general suggestions based on context 


    if (message.toLowerCase().includes("risk")) {
        suggestions.push("What are the risks for this stock?");

    }

    if (message.toLowerCase().includes("technical analysis")) {
        suggestions.push("Show me the technical analysis for this stock");
    }



    return suggestions.slice(0, 3); // Limit to 3 suggestions 

}

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