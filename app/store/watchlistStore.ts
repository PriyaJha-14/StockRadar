import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WatchlistState {
    stocks: string[],
    addStock: (stock: string) => void,
    removeStock: (stock: string) => void,
    isInWatchlist: (stock: string) => boolean,
}


export const useWatchlistStore = create<WatchlistState>()(

    persist(
        (set, get) => ({
            stocks: [],
            addStock: (symbol) => {
                const currentStocks = get().stocks;

                if (!currentStocks.includes(symbol)) {
                    set({ stocks: [...currentStocks, symbol] })
                }


            },

            removeStock: (symbol) => {
                set({ stocks: get().stocks.filter((s) => s !== symbol) })
            },
            isInWatchlist: (symbol) => get().stocks.includes(symbol)
        }),
        {
            name: "stock-watchlist",
            storage: createJSONStorage(() => AsyncStorage)

        }
    )
)