// app/store/watchlistStore.ts
import { supabase } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";

interface WatchlistState {
  stocks: string[];
  addStock: (stock: string) => void;
  removeStock: (stock: string) => void;
  isInWatchlist: (stock: string) => boolean;
  loadUserWatchlist: () => void;
  loadFromCloud: (userId: string) => Promise<void>;
}

// Auth check helper
const checkAuth = () => {
  const { isAuthenticated } = useAuthStore.getState();
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

      addStock: async (symbol) => {
        if (!checkAuth()) return;

        const currentStocks = get().stocks;

        if (currentStocks.includes(symbol)) {
          Alert.alert('Already Added', `${symbol} is already in your watchlist`);
          return;
        }

        const updatedStocks = [...currentStocks, symbol];
        set({ stocks: updatedStocks });

        // ✅ Save to Supabase
        const { user } = useAuthStore.getState();
        if (user?.id) {
          await supabase
            .from('watchlist')
            .insert({ user_id: user.id, symbol });
        }

        Alert.alert('✅ Added to Watchlist', `${symbol} added successfully`);
        console.log('✅ Added to watchlist:', symbol);
      },

      removeStock: async (symbol) => {
        if (!checkAuth()) return;

        const updatedStocks = get().stocks.filter((s) => s !== symbol);
        set({ stocks: updatedStocks });

        // ✅ Delete from Supabase
        const { user } = useAuthStore.getState();
        if (user?.id) {
          await supabase
            .from('watchlist')
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', symbol);
        }

        console.log('✅ Removed from watchlist:', symbol);
      },

      isInWatchlist: (symbol) => get().stocks.includes(symbol),

      // ✅ Load user watchlist (kept for backward compat)
      loadUserWatchlist: () => {
        const { user } = useAuthStore.getState();
        if (user?.id) {
          get().loadFromCloud(user.id);
        }
      },

      // ✅ Load from Supabase cloud
      loadFromCloud: async (userId) => {
        const { data, error } = await supabase
          .from('watchlist')
          .select('symbol')
          .eq('user_id', userId);

        if (!error && data) {
          set({ stocks: data.map((row: any) => row.symbol) });
          console.log('📂 Loaded watchlist from cloud');
        }
      },
    }),
    {
      name: "stock-watchlist",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
