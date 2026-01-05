// app/store/chatStore.ts
import { sendAIRequest, StockContext } from "@/utils/aiService";
import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatStore {
  messages: Message[];
  currentContext: StockContext | null;
  isLoading: boolean;
  error: string | null;
  
  setContext: (context: StockContext | null) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearContext: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  currentContext: null,
  isLoading: false,
  error: null,

  setContext: (context) => {
    console.log("📊 Setting stock context:", context?.symbol);
    set({ currentContext: context });
  },

  sendMessage: async (content: string) => {
    const { messages, currentContext } = get();

    console.log("💬 User message:", content);

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    set({
      messages: [...messages, userMessage],
      isLoading: true,
      error: null,
    });

    try {
      console.log("🤖 Calling AI API...");
      
      // Call AI service
      const aiResponse = await sendAIRequest({
        userMessage: content,
        stockContext: currentContext!,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      console.log("✅ Got AI response");

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse.message,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }));

    } catch (error: any) {
      console.error("❌ Error in sendMessage:", error);
      
      set({
        error: error.message || "Failed to get response",
        isLoading: false,
      });

      // Better error messages
      let errorText = "Sorry, I encountered an error.";
      
      if (error.message?.includes("rate limit") || error.message?.includes("quota")) {
        errorText = "⏳ Rate limit reached. Please wait a minute and try again.";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorText = "🌐 Network error. Please check your internet connection.";
      } else {
        errorText = "❌ Sorry, something went wrong. Please try again.";
      }

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
      }));
    }
  },

  // ✅ ADD THIS: Clear all messages
  clearMessages: () => {
    console.log("🗑️ Clearing all messages");
    set({ messages: [], error: null });
  },

  // ✅ ADD THIS: Clear stock context
  clearContext: () => {
    console.log("🗑️ Clearing stock context");
    set({ currentContext: null });
  },
}));
