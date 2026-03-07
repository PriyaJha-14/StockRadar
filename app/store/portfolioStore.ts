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
  buyStock: (symbol: string, quantity: number, price: number, companyName?: string) => Promise<boolean>;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, quantity: number) => void;
  sellHolding: (id: string, quantity: number, sellPrice: number) => void;
  updateCurrentPrices: (prices: Record<string, number>) => void;
  refreshCurrentPrices: () => Promise<void>;        // ✅ NEW
  getPortfolioValue: () => number;
  getTotalProfit: () => number;
  getPortfolioSummary: () => string;
  clearPortfolio: () => void;
  loadUserPortfolio: () => void;
  loadFromCloud: (userId: string) => Promise<void>;
}

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

      // ✅ BUY STOCK
      buyStock: async (symbol, quantity, price, companyName = symbol) => {
        if (!checkAuth()) return false;

        const cost = quantity * price;
        const { virtualCash, holdings } = get();
        const { user } = useAuthStore.getState();

        if (cost > virtualCash) {
          Alert.alert(
            '⚠️ Insufficient Funds',
            `You need $${cost.toFixed(2)} but only have $${virtualCash.toFixed(2)}`
          );
          return false;
        }

        const newCash = virtualCash - cost;
        const existingHolding = holdings.find(h => h.symbol === symbol);

        if (existingHolding) {
          const totalQuantity = existingHolding.quantity + quantity;
          const totalCost = existingHolding.buyPrice * existingHolding.quantity + cost;
          const newAvgPrice = totalCost / totalQuantity;

          const updatedHoldings = holdings.map(h =>
            h.symbol === symbol
              ? { ...h, quantity: totalQuantity, buyPrice: newAvgPrice }
              : h
          );

          set({ holdings: updatedHoldings, virtualCash: newCash });

          if (user?.id) {
            const { error: portfolioError } = await supabase
              .from('portfolio')
              .update({ quantity: totalQuantity, buy_price: newAvgPrice })
              .eq('user_id', user.id)
              .eq('symbol', symbol);
            if (portfolioError) console.error('Portfolio update error:', portfolioError.message);

            const { error: cashError } = await supabase
              .from('virtual_cash')
              .update({ cash: newCash })
              .eq('user_id', user.id);
            if (cashError) console.error('Cash update error:', cashError.message);
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

          set({ holdings: [...holdings, newHolding], virtualCash: newCash });

          if (user?.id) {
            const { error: portfolioError } = await supabase
              .from('portfolio')
              .insert({
                user_id: user.id,
                symbol,
                company_name: companyName,
                quantity,
                buy_price: price,
              });
            if (portfolioError) console.error('Portfolio insert error:', portfolioError.message);

            const { error: cashError } = await supabase
              .from('virtual_cash')
              .update({ cash: newCash })
              .eq('user_id', user.id);
            if (cashError) console.error('Cash update error:', cashError.message);
          }
        }

        Alert.alert(
          '✅ Purchase Successful',
          `Bought ${quantity} shares of ${symbol} at $${price.toFixed(2)}`
        );
        return true;
      },

      // ✅ ADD HOLDING
      addHolding: async (holding) => {
        if (!checkAuth()) return;

        const cost = holding.quantity * holding.buyPrice;
        const { virtualCash, holdings } = get();
        const { user } = useAuthStore.getState();

        if (cost > virtualCash) {
          Alert.alert('⚠️ Insufficient Funds');
          return;
        }

        const newCash = virtualCash - cost;
        const newHolding: PortfolioHolding = {
          ...holding,
          id: Date.now().toString(),
          buyDate: new Date(),
        };

        set({ holdings: [...holdings, newHolding], virtualCash: newCash });

        if (user?.id) {
          const { error: portfolioError } = await supabase
            .from('portfolio')
            .insert({
              user_id: user.id,
              symbol: holding.symbol,
              company_name: holding.companyName,
              quantity: holding.quantity,
              buy_price: holding.buyPrice,
            });
          if (portfolioError) console.error('Add holding error:', portfolioError.message);

          const { error: cashError } = await supabase
            .from('virtual_cash')
            .update({ cash: newCash })
            .eq('user_id', user.id);
          if (cashError) console.error('Cash update error:', cashError.message);
        }
      },

      // ✅ REMOVE HOLDING
      removeHolding: async (id) => {
        if (!checkAuth()) return;

        const { holdings } = get();
        const holding = holdings.find(h => h.id === id);
        const { user } = useAuthStore.getState();

        set({ holdings: holdings.filter(h => h.id !== id) });

        if (user?.id && holding) {
          const { error } = await supabase
            .from('portfolio')
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', holding.symbol);
          if (error) console.error('Remove holding error:', error.message);
        }
      },

      // ✅ UPDATE HOLDING QUANTITY
      updateHolding: async (id, quantity) => {
        if (!checkAuth()) return;

        const { holdings } = get();
        const { user } = useAuthStore.getState();
        const holding = holdings.find(h => h.id === id);

        set({ holdings: holdings.map(h => h.id === id ? { ...h, quantity } : h) });

        if (user?.id && holding) {
          const { error } = await supabase
            .from('portfolio')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('symbol', holding.symbol);
          if (error) console.error('Update holding error:', error.message);
        }
      },

      // ✅ SELL HOLDING
      sellHolding: async (id, quantity, sellPrice) => {
        if (!checkAuth()) return;

        const { holdings, virtualCash } = get();
        const { user } = useAuthStore.getState();
        const holding = holdings.find(h => h.id === id);

        if (!holding || holding.quantity < quantity) {
          Alert.alert('⚠️ Error', 'Insufficient quantity to sell');
          return;
        }

        const proceeds = quantity * sellPrice;
        const newCash = virtualCash + proceeds;
        const newQuantity = holding.quantity - quantity;

        const updatedHoldings = newQuantity === 0
          ? holdings.filter(h => h.id !== id)
          : holdings.map(h => h.id === id ? { ...h, quantity: newQuantity } : h);

        set({ holdings: updatedHoldings, virtualCash: newCash });

        if (user?.id) {
          if (newQuantity === 0) {
            const { error } = await supabase
              .from('portfolio')
              .delete()
              .eq('user_id', user.id)
              .eq('symbol', holding.symbol);
            if (error) console.error('Sell delete error:', error.message);
          } else {
            const { error } = await supabase
              .from('portfolio')
              .update({ quantity: newQuantity })
              .eq('user_id', user.id)
              .eq('symbol', holding.symbol);
            if (error) console.error('Sell update error:', error.message);
          }

          const { error: cashError } = await supabase
            .from('virtual_cash')
            .update({ cash: newCash })
            .eq('user_id', user.id);
          if (cashError) console.error('Cash update error:', cashError.message);
        }

        Alert.alert(
          '✅ Sale Successful',
          `Sold ${quantity} shares for $${proceeds.toFixed(2)}`
        );
      },

      // ✅ UPDATE CURRENT PRICES (bulk from outside)
      updateCurrentPrices: (prices) => {
        set((state) => ({
          holdings: state.holdings.map(h => ({
            ...h,
            currentPrice: prices[h.symbol] || h.currentPrice,
          })),
        }));
      },

      // ✅ NEW — Fetch live prices from Finnhub for all holdings
      refreshCurrentPrices: async () => {
        const { holdings } = get();
        if (holdings.length === 0) return;

        console.log('🔄 Refreshing live prices...');

        const updatedHoldings = await Promise.all(
          holdings.map(async (holding) => {
            try {
              const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${holding.symbol}&token=${process.env.EXPO_PUBLIC_FINNHUB_KEY}`
              );
              const data = await response.json();
              return {
                ...holding,
                currentPrice: data.c > 0 ? data.c : (holding.currentPrice ?? holding.buyPrice),
              };
            } catch {
              return holding;
            }
          })
        );

        set({ holdings: updatedHoldings });
        console.log('✅ Live prices updated');
      },

      // ✅ PORTFOLIO VALUE
      getPortfolioValue: () => {
        const { holdings, virtualCash } = get();
        const stockValue = holdings.reduce(
          (total, h) => total + (h.currentPrice || h.buyPrice) * h.quantity,
          0
        );
        return stockValue + virtualCash;
      },

      // ✅ TOTAL PROFIT/LOSS
      getTotalProfit: () => {
        return get().holdings.reduce((total, h) => {
          const currentValue = (h.currentPrice || h.buyPrice) * h.quantity;
          const costBasis = h.buyPrice * h.quantity;
          return total + (currentValue - costBasis);
        }, 0);
      },

      // ✅ PORTFOLIO SUMMARY FOR AI CHAT
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

      // ✅ CLEAR PORTFOLIO
      clearPortfolio: () => {
        set({ holdings: [], virtualCash: 100000 });
      },

      // ✅ BACKWARD COMPAT WRAPPER
      loadUserPortfolio: () => {
        const { user } = useAuthStore.getState();
        if (user?.id) get().loadFromCloud(user.id);
      },

      // ✅ LOAD FROM SUPABASE CLOUD
      loadFromCloud: async (userId) => {
        set({ isLoading: true });

        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', userId);

        if (portfolioError) console.error('Load portfolio error:', portfolioError.message);

        const { data: cashData, error: cashError } = await supabase
          .from('virtual_cash')
          .select('cash')
          .eq('user_id', userId)
          .single();

        if (cashError) console.error('Load cash error:', cashError.message);

        set({
          holdings: portfolioData?.map((row: any) => ({
            id: row.id,
            symbol: row.symbol,
            companyName: row.company_name,
            quantity: row.quantity,
            buyPrice: row.buy_price,
            buyDate: new Date(row.bought_at || row.created_at),
            currentPrice: undefined,   // ✅ FIXED: was row.buy_price → now undefined so live price is fetched
          })) || [],
          virtualCash: cashData?.cash ?? 100000,
          isLoading: false,
        });

        console.log('📂 Loaded portfolio from cloud for user:', userId);

        // ✅ NEW: Fetch live prices immediately after loading
        await get().refreshCurrentPrices();
      },
    }),
    {
      name: "portfolio-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
