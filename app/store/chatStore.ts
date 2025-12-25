// import { prefetch } from "expo-router/build/global-state/routing";
import { ChatMessage, ChatStore } from "@/types/chat";
import { create } from "zustand";
import { sendAIRequest } from "../../utils/aiService";

export const useChatStore = create<ChatStore>((set, get) => ({
    messages: [],
    isLoading: false,
    currentContext: undefined,

    addMessage: (message) => {
        const newMessage: ChatMessage = {
            ...message,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
        };

        set((state) => ({
            messages: [...state.messages, newMessage],
        }));
    },

    setLoading: (loading) => set({ isLoading: loading }),

    setContext: (context) => set({ currentContext: context }),

    clearChat: () => set({ messages: [], currentContext: undefined }),

    markTypingCompleted: (messageId) => {
        set((state) => ({
            messages: state.messages.map((msg) => 
                msg.id === messageId ? { ...msg, typingCompleted: true } : msg
            ),
        }));
    },

    sendMessage: async (content, context) => {
        const state = get();

        const userMessage: ChatMessage = {
            role: "user",
            content,
            stockContext: context || state.currentContext,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
        };

        set((prevState) => ({
            messages: [...prevState.messages, userMessage],
            isLoading: true,
        }));

        try {
            const updatedState = get();

            // Prepare conversation history for context
            const conversationHistory = updatedState.messages.slice(-6).map((msg) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            }));

            // Send request to AI Service
            const aiResponse = await sendAIRequest({
                userMessage: content,
                stockContext: context || state.currentContext,
                conversationHistory,
            });

            // Add AI response 
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: aiResponse.message,
                stockContext: context || state.currentContext,
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                timestamp: new Date(),
            };

            set((prevState) => ({
                messages: [...prevState.messages, assistantMessage],
                isLoading: false,
            }));

        } catch (error) {
            console.error("Error sending AI message:", error);

            // Add error message
            const errorMessage: ChatMessage = {
                role: "assistant",
                content: "I'm sorry, I encountered an error processing your request. Please try again later.\n\nThis Analysis is for educational purposes only and should not be considered financial advice.",
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                timestamp: new Date(),
            };

            set((prevState) => ({
                messages: [...prevState.messages, errorMessage],
                isLoading: false,
            }));
        }
    },
}));
