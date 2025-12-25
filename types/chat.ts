// import { StockContext } from "@/utils/aiService";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    stockContext?: StockContext;
    typingCompleted?: boolean;
}

export interface StockContext {
    symbol: string;
    currentPrice: number;
    change: number;
    percentChange: number;
    companyName?: string;
    sector?: string;
    industry?: string;
    marketCap?: string;
    volume?: number;
    summary?: string;
}

export interface AIResponse {
    message: string;
    suggestions?: string[];
    disclaimers?: string[];
    relatedStocks?: string[];
}

export interface ChatStore {
    messages: ChatMessage[];
    isLoading: boolean;
    currentContext?: StockContext;
    addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
    setLoading: (loading: boolean) => void;
    setContext: (context: StockContext | undefined) => void;
    clearChat: () => void;
    sendMessage: (content: string, context?: StockContext) => Promise<void>;
    markTypingCompleted: (messageId: string) => void;
}

export interface AIAnalysisCard {
    title: string;
    content: string;
    type: "bullish" | "bearish" | "neutral";
    confidence: "high" | "medium" | "low";
    keyPoints: string[];
}

export interface MarketInsight {
    title: string;
    summary: string;
    sentiment: "positive" | "negative" | "neutral";
    affectedStocks: string[];
    timestamp: Date;
}

export interface AISystemPrompt {
    role: "system";
    content: string;
}

// Chat loading states for better UX
export interface ChatLoadingState {
    isTyping: boolean;
    isGenerating: boolean;
    progress?: number;
}

export const FINANCIAL_DISCLAIMER = 
    "This analysis is for educational purposes only and should not be considered as financial advice.";

export const AI_SUGGESTIONS = [
    "Analyze this stock for me",
    "What's the market sentiment today?",
    "Should I hold or sell?",
    "Compare with competitors",
    "Explain the recent price movement",
    "What are the risks?",
    "Show me the technical analysis",
    "Analyze my watchlist",
];

// Type-safe AI suggestion type
export type AISuggestion = typeof AI_SUGGESTIONS[number];
