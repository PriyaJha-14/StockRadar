// app/store/portfolioStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useSimpleAuthStore } from "./simpleAuthStore";

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
}

// Auth check helper
const checkAuth = () => {
  const { isAuthenticated } = useSimpleAuthStore.getState();
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

      buyStock: (symbol, quantity, price, companyName = symbol) => {
        // ✅ Check authentication first
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

        if (existingHolding) {
          const totalQuantity = existingHolding.quantity + quantity;
          const totalCost = (existingHolding.buyPrice * existingHolding.quantity) + cost;
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

          // ✅ Sync to user account
          const { currentUser, updatePortfolio, updateVirtualCash, addTrade } = 
            useSimpleAuthStore.getState();
          
          if (currentUser) {
            updatePortfolio(updatedHoldings);
            updateVirtualCash(virtualCash - cost);
            addTrade({
              type: 'BUY',
              symbol,
              quantity,
              price,
              timestamp: new Date().toISOString(),
            });
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

          // ✅ Sync to user account
          const { currentUser, updatePortfolio, updateVirtualCash, addTrade } = 
            useSimpleAuthStore.getState();
          
          if (currentUser) {
            updatePortfolio(updatedHoldings);
            updateVirtualCash(virtualCash - cost);
            addTrade({
              type: 'BUY',
              symbol,
              quantity,
              price,
              timestamp: new Date().toISOString(),
            });
          }
        }

        Alert.alert(
          '✅ Purchase Successful',
          `Bought ${quantity} shares of ${symbol} at $${price.toFixed(2)}`
        );
        console.log("✅ Bought stock:", symbol, quantity, "@", price);
        return true;
      },

      addHolding: (holding) => {
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

        // Sync to user account
        const { currentUser, updatePortfolio, updateVirtualCash } = 
          useSimpleAuthStore.getState();
        
        if (currentUser) {
          updatePortfolio(updatedHoldings);
          updateVirtualCash(virtualCash - cost);
        }

        console.log("✅ Added holding:", newHolding.symbol);
      },

      removeHolding: (id) => {
        if (!checkAuth()) return;

        const updatedHoldings = get().holdings.filter((h) => h.id !== id);
        set({ holdings: updatedHoldings });

        // Sync to user account
        const { currentUser, updatePortfolio } = useSimpleAuthStore.getState();
        if (currentUser) {
          updatePortfolio(updatedHoldings);
        }
      },

      updateHolding: (id, quantity) => {
        if (!checkAuth()) return;

        const updatedHoldings = get().holdings.map((h) =>
          h.id === id ? { ...h, quantity } : h
        );
        
        set({ holdings: updatedHoldings });

        // Sync to user account
        const { currentUser, updatePortfolio } = useSimpleAuthStore.getState();
        if (currentUser) {
          updatePortfolio(updatedHoldings);
        }
      },

      sellHolding: (id, quantity, sellPrice) => {
        if (!checkAuth()) return;

        const { holdings, virtualCash } = get();
        const holding = holdings.find((h) => h.id === id);

        if (!holding || holding.quantity < quantity) {
          Alert.alert('⚠️ Error', 'Insufficient quantity to sell');
          return;
        }

        const proceeds = quantity * sellPrice;
        const newQuantity = holding.quantity - quantity;

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
          virtualCash: virtualCash + proceeds,
        });

        // Sync to user account
        const { currentUser, updatePortfolio, updateVirtualCash, addTrade } = 
          useSimpleAuthStore.getState();
        
        if (currentUser) {
          updatePortfolio(updatedHoldings);
          updateVirtualCash(virtualCash + proceeds);
          addTrade({
            type: 'SELL',
            symbol: holding.symbol,
            quantity,
            price: sellPrice,
            timestamp: new Date().toISOString(),
          });
        }

        Alert.alert(
          '✅ Sale Successful',
          `Sold ${quantity} shares for $${proceeds.toFixed(2)}`
        );
        console.log("✅ Sold", quantity, "shares for $", proceeds);
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
        set({
          holdings: [],
          virtualCash: 100000,
        });
      },

      // ✅ Load user's portfolio data
      loadUserPortfolio: () => {
        const { currentUser } = useSimpleAuthStore.getState();
        if (currentUser) {
          set({
            holdings: currentUser.portfolio || [],
            virtualCash: currentUser.virtualCash || 100000,
          });
          console.log('📂 Loaded user portfolio');
        }
      },
    }),
    {
      name: "portfolio-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
