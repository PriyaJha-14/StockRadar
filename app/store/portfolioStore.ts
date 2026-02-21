// app/store/portfolioStore.ts
import { supabase } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";

export interface PortfolioHolding {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  buyPrice: number;
  buyDate: Date;
  currentPrice?: number;
}

interface PortfolioStore {
  holdings: PortfolioHolding[];
  virtualCash: number;
  isLoading: boolean;
  addHolding: (holding: Omit<PortfolioHolding, "id" | "buyDate">) => void;
  buyStock: (symbol: string, quantity: number, price: number, companyName?: string) => boolean;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, quantity: number) => void;
  sellHolding: (id: string, quantity: number, sellPrice: number) => void;
  updateCurrentPrices: (prices: Record<string, number>) => void;
  getPortfolioValue: () => number;
  getTotalProfit: () => number;
  getPortfolioSummary: () => string;
  clearPortfolio: () => void;
  loadUserPortfolio: () => void;
  loadFromCloud: (userId: string) => Promise<void>;
}

// Auth check helper
const checkAuth = () => {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    Alert.alert(
      '🔒 Sign In Required',
      'You need to sign in to buy/sell stocks and save your portfolio',
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

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      holdings: [],
      virtualCash: 100000,
      isLoading: false,

      buyStock: async (symbol, quantity, price, companyName = symbol) => {
        if (!checkAuth()) return false;

        const cost = quantity * price;
        const { virtualCash, holdings } = get();

        if (cost > virtualCash) {
          Alert.alert(
            '⚠️ Insufficient Funds',
            `You need $${cost.toFixed(2)} but only have $${virtualCash.toFixed(2)}`
          );
          return false;
        }

        const existingHolding = holdings.find(h => h.symbol === symbol);
        const { user } = useAuthStore.getState();

        if (existingHolding) {
          const totalQuantity = existingHolding.quantity + quantity;
          const totalCost =
            existingHolding.buyPrice * existingHolding.quantity + cost;
          const newAvgPrice = totalCost / totalQuantity;

          const updatedHoldings = holdings.map(h =>
            h.symbol === symbol
              ? { ...h, quantity: totalQuantity, buyPrice: newAvgPrice }
              : h
          );

          set({
            holdings: updatedHoldings,
            virtualCash: virtualCash - cost,
          });

          // ✅ Update in Supabase
          if (user?.id) {
            await supabase
              .from('portfolio')
              .update({ quantity: totalQuantity, buy_price: newAvgPrice })
              .eq('user_id', user.id)
              .eq('symbol', symbol);

            await supabase
              .from('virtual_cash')
              .upsert({ user_id: user.id, cash: virtualCash - cost });
          }
        } else {
          const newHolding: PortfolioHolding = {
            id: Date.now().toString(),
            symbol,
            companyName,
            quantity,
            buyPrice: price,
            buyDate: new Date(),
            currentPrice: price,
          };

          const updatedHoldings = [...holdings, newHolding];

          set({
            holdings: updatedHoldings,
            virtualCash: virtualCash - cost,
          });

          // ✅ Insert in Supabase
          if (user?.id) {
            await supabase.from('portfolio').insert({
              user_id: user.id,
              symbol,
              company_name: companyName,
              quantity,
              buy_price: price,
            });

            await supabase
              .from('virtual_cash')
              .upsert({ user_id: user.id, cash: virtualCash - cost });
          }
        }

        Alert.alert(
          '✅ Purchase Successful',
          `Bought ${quantity} shares of ${symbol} at $${price.toFixed(2)}`
        );
        console.log('✅ Bought stock:', symbol, quantity, '@', price);
        return true;
      },

      addHolding: async (holding) => {
        if (!checkAuth()) return;

        const cost = holding.quantity * holding.buyPrice;
        const { virtualCash, holdings } = get();

        if (cost > virtualCash) {
          Alert.alert('⚠️ Insufficient Funds');
          return;
        }

        const newHolding: PortfolioHolding = {
          ...holding,
          id: Date.now().toString(),
          buyDate: new Date(),
        };

        const updatedHoldings = [...holdings, newHolding];

        set({
          holdings: updatedHoldings,
          virtualCash: virtualCash - cost,
        });

        // ✅ Save to Supabase
        const { user } = useAuthStore.getState();
        if (user?.id) {
          await supabase.from('portfolio').insert({
            user_id: user.id,
            symbol: holding.symbol,
            company_name: holding.companyName,
            quantity: holding.quantity,
            buy_price: holding.buyPrice,
          });

          await supabase
            .from('virtual_cash')
            .upsert({ user_id: user.id, cash: virtualCash - cost });
        }

        console.log('✅ Added holding:', newHolding.symbol);
      },

      removeHolding: async (id) => {
        if (!checkAuth()) return;

        const holding = get().holdings.find(h => h.id === id);
        const updatedHoldings = get().holdings.filter((h) => h.id !== id);
        set({ holdings: updatedHoldings });

        // ✅ Delete from Supabase
        const { user } = useAuthStore.getState();
        if (user?.id && holding) {
          await supabase
            .from('portfolio')
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', holding.symbol);
        }
      },

      updateHolding: async (id, quantity) => {
        if (!checkAuth()) return;

        const updatedHoldings = get().holdings.map((h) =>
          h.id === id ? { ...h, quantity } : h
        );
        set({ holdings: updatedHoldings });

        // ✅ Update in Supabase
        const holding = get().holdings.find(h => h.id === id);
        const { user } = useAuthStore.getState();
        if (user?.id && holding) {
          await supabase
            .from('portfolio')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('symbol', holding.symbol);
        }
      },

      sellHolding: async (id, quantity, sellPrice) => {
        if (!checkAuth()) return;

        const { holdings, virtualCash } = get();
        const holding = holdings.find((h) => h.id === id);

        if (!holding || holding.quantity < quantity) {
          Alert.alert('⚠️ Error', 'Insufficient quantity to sell');
          return;
        }

        const proceeds = quantity * sellPrice;
        const newQuantity = holding.quantity - quantity;
        const newCash = virtualCash + proceeds;

        let updatedHoldings;
        if (newQuantity === 0) {
          updatedHoldings = holdings.filter((h) => h.id !== id);
        } else {
          updatedHoldings = holdings.map((h) =>
            h.id === id ? { ...h, quantity: newQuantity } : h
          );
        }

        set({
          holdings: updatedHoldings,
          virtualCash: newCash,
        });

        // ✅ Update Supabase
        const { user } = useAuthStore.getState();
        if (user?.id) {
          if (newQuantity === 0) {
            await supabase
              .from('portfolio')
              .delete()
              .eq('user_id', user.id)
              .eq('symbol', holding.symbol);
          } else {
            await supabase
              .from('portfolio')
              .update({ quantity: newQuantity })
              .eq('user_id', user.id)
              .eq('symbol', holding.symbol);
          }

          await supabase
            .from('virtual_cash')
            .upsert({ user_id: user.id, cash: newCash });
        }

        Alert.alert(
          '✅ Sale Successful',
          `Sold ${quantity} shares for $${proceeds.toFixed(2)}`
        );
        console.log('✅ Sold', quantity, 'shares for $', proceeds);
      },

      updateCurrentPrices: (prices) => {
        set((state) => ({
          holdings: state.holdings.map((h) => ({
            ...h,
            currentPrice: prices[h.symbol] || h.currentPrice,
          })),
        }));
      },

      getPortfolioValue: () => {
        const { holdings, virtualCash } = get();
        const stockValue = holdings.reduce(
          (total, h) => total + (h.currentPrice || h.buyPrice) * h.quantity,
          0
        );
        return stockValue + virtualCash;
      },

      getTotalProfit: () => {
        const { holdings } = get();
        return holdings.reduce((total, h) => {
          const currentValue = (h.currentPrice || h.buyPrice) * h.quantity;
          const costBasis = h.buyPrice * h.quantity;
          return total + (currentValue - costBasis);
        }, 0);
      },

      getPortfolioSummary: () => {
        const { holdings, virtualCash } = get();

        if (holdings.length === 0) {
          return "Portfolio is empty. No holdings to analyze.";
        }

        const totalValue = get().getPortfolioValue();
        const totalProfit = get().getTotalProfit();

        let summary = `📊 Portfolio Analysis\n\n`;
        summary += `Total Portfolio Value: $${totalValue.toFixed(2)}\n`;
        summary += `Cash Available: $${virtualCash.toFixed(2)}\n`;
        summary += `Total Profit/Loss: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}\n\n`;
        summary += `Holdings (${holdings.length} stocks):\n\n`;

        holdings.forEach((h, index) => {
          const currentPrice = h.currentPrice || h.buyPrice;
          const currentValue = currentPrice * h.quantity;
          const costBasis = h.buyPrice * h.quantity;
          const profit = currentValue - costBasis;
          const profitPercent = ((profit / costBasis) * 100).toFixed(2);

          summary += `${index + 1}. ${h.symbol} (${h.companyName})\n`;
          summary += `   - Quantity: ${h.quantity} shares\n`;
          summary += `   - Avg Buy Price: $${h.buyPrice.toFixed(2)}\n`;
          summary += `   - Current Price: $${currentPrice.toFixed(2)}\n`;
          summary += `   - Total Value: $${currentValue.toFixed(2)}\n`;
          summary += `   - Profit/Loss: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} (${profitPercent}%)\n\n`;
        });

        return summary;
      },

      clearPortfolio: () => {
        set({ holdings: [], virtualCash: 100000 });
      },

      // ✅ Kept for backward compat
      loadUserPortfolio: () => {
        const { user } = useAuthStore.getState();
        if (user?.id) {
          get().loadFromCloud(user.id);
        }
      },

      // ✅ Load from Supabase cloud
      loadFromCloud: async (userId) => {
        set({ isLoading: true });

        const { data: portfolioData } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', userId);

        const { data: cashData } = await supabase
          .from('virtual_cash')
          .select('cash')
          .eq('user_id', userId)
          .single();

        set({
          holdings: portfolioData?.map((row: any) => ({
            id: row.id,
            symbol: row.symbol,
            companyName: row.company_name,
            quantity: row.quantity,
            buyPrice: row.buy_price,
            buyDate: new Date(row.bought_at),
            currentPrice: row.buy_price,
          })) || [],
          virtualCash: cashData?.cash || 100000,
          isLoading: false,
        });

        console.log('📂 Loaded portfolio from cloud');
      },
    }),
    {
      name: "portfolio-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
