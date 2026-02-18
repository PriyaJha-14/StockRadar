// app/store/watchlistStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useSimpleAuthStore } from "./simpleAuthStore";

interface WatchlistState {
  stocks: string[];
  addStock: (stock: string) => void;
  removeStock: (stock: string) => void;
  isInWatchlist: (stock: string) => boolean;
  loadUserWatchlist: () => void;
}

// Auth check helper
const checkAuth = () => {
  const { isAuthenticated } = useSimpleAuthStore.getState();
  if (!isAuthenticated) {
    Alert.alert(
      '🔒 Sign In Required',
      'You need to sign in to add stocks to your watchlist',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign In', 
          onPress: () => router.push('/auth/simple-signin') 
        },
      ]
    );
    return false;
  }
  return true;
};

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      stocks: [],
      
      addStock: (symbol) => {
        // ✅ Check authentication first
        if (!checkAuth()) return;

        const currentStocks = get().stocks;

        if (currentStocks.includes(symbol)) {
          Alert.alert('Already Added', `${symbol} is already in your watchlist`);
          return;
        }

        const updatedStocks = [...currentStocks, symbol];
        set({ stocks: updatedStocks });

        // ✅ Sync to user account
        const { currentUser, updateWatchlist } = useSimpleAuthStore.getState();
        if (currentUser) {
          updateWatchlist(updatedStocks);
        }

        Alert.alert('✅ Added to Watchlist', `${symbol} added successfully`);
        console.log('✅ Added to watchlist:', symbol);
      },

      removeStock: (symbol) => {
        // ✅ Check authentication
        if (!checkAuth()) return;

        const updatedStocks = get().stocks.filter((s) => s !== symbol);
        set({ stocks: updatedStocks });

        // ✅ Sync to user account
        const { currentUser, updateWatchlist } = useSimpleAuthStore.getState();
        if (currentUser) {
          updateWatchlist(updatedStocks);
        }

        console.log('✅ Removed from watchlist:', symbol);
      },

      isInWatchlist: (symbol) => get().stocks.includes(symbol),

      // ✅ Load user's watchlist data
      loadUserWatchlist: () => {
        const { currentUser } = useSimpleAuthStore.getState();
        if (currentUser) {
          set({ stocks: currentUser.watchlist || [] });
          console.log('📂 Loaded user watchlist');
        }
      },
    }),
    {
      name: "stock-watchlist",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
