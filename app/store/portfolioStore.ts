// app/store/portfolioStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  buyStock: (symbol: string, quantity: number, price: number) => void; // ✅ FIXED: Proper declaration
  removeHolding: (id: string) => void;
  updateHolding: (id: string, quantity: number) => void;
  sellHolding: (id: string, quantity: number, sellPrice: number) => void;
  updateCurrentPrices: (prices: Record<string, number>) => void;
  getPortfolioValue: () => number;
  getTotalProfit: () => number;
  getPortfolioSummary: () => string;
  clearPortfolio: () => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      holdings: [],
      virtualCash: 100000, // Starting with $100,000 virtual cash

      // ✅ NEW: Simplified buyStock function
      buyStock: (symbol, quantity, price) => {
        const cost = quantity * price;
        const { virtualCash, holdings } = get();

        if (cost > virtualCash) {
          console.warn("⚠️ Insufficient virtual cash");
          return false;
        }

        // Check if stock already exists in portfolio
        const existingHolding = holdings.find(h => h.symbol === symbol);

        if (existingHolding) {
          // Update existing holding (average price)
          const totalQuantity = existingHolding.quantity + quantity;
          const totalCost = (existingHolding.buyPrice * existingHolding.quantity) + cost;
          const newAvgPrice = totalCost / totalQuantity;

          set({
            holdings: holdings.map(h =>
              h.symbol === symbol
                ? { ...h, quantity: totalQuantity, buyPrice: newAvgPrice }
                : h
            ),
            virtualCash: virtualCash - cost,
          });
        } else {
          // Add new holding
          const newHolding: PortfolioHolding = {
            id: Date.now().toString(),
            symbol,
            companyName: symbol, // Will be updated with full name later
            quantity,
            buyPrice: price,
            buyDate: new Date(),
            currentPrice: price,
          };

          set({
            holdings: [...holdings, newHolding],
            virtualCash: virtualCash - cost,
          });
        }

        console.log("✅ Bought stock:", symbol, quantity, "@", price);
        return true;
      },

      addHolding: (holding) => {
        const cost = holding.quantity * holding.buyPrice;
        const { virtualCash, holdings } = get();

        if (cost > virtualCash) {
          console.warn("⚠️ Insufficient virtual cash");
          return;
        }

        const newHolding: PortfolioHolding = {
          ...holding,
          id: Date.now().toString(),
          buyDate: new Date(),
        };

        set({
          holdings: [...holdings, newHolding],
          virtualCash: virtualCash - cost,
        });

        console.log("✅ Added holding:", newHolding.symbol);
      },

      removeHolding: (id) => {
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        }));
      },

      updateHolding: (id, quantity) => {
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, quantity } : h
          ),
        }));
      },

      sellHolding: (id, quantity, sellPrice) => {
        const { holdings, virtualCash } = get();
        const holding = holdings.find((h) => h.id === id);

        if (!holding || holding.quantity < quantity) {
          console.warn("⚠️ Insufficient quantity to sell");
          return;
        }

        const proceeds = quantity * sellPrice;
        const newQuantity = holding.quantity - quantity;

        if (newQuantity === 0) {
          set({
            holdings: holdings.filter((h) => h.id !== id),
            virtualCash: virtualCash + proceeds,
          });
        } else {
          set({
            holdings: holdings.map((h) =>
              h.id === id ? { ...h, quantity: newQuantity } : h
            ),
            virtualCash: virtualCash + proceeds,
          });
        }

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
    }),
    {
      name: "portfolio-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
