// app/(tabs)/portfolio.tsx
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  View
} from "react-native";
import { fetchStockQuotes } from "../api/marketApi";
import { blurhash } from "../index";
import { useChatStore } from "../store/chatStore";
import { usePortfolioStore } from "../store/portfolioStore";

export default function PortfolioScreen() {
  const {
    holdings,
    virtualCash,
    getPortfolioValue,
    getTotalProfit,
    getPortfolioSummary,
    updateCurrentPrices,
    sellHolding,
    clearPortfolio,
  } = usePortfolioStore();

  const { setContext } = useChatStore();

  const symbols = holdings.map((h) => h.symbol);

  // Fetch current prices
  const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
    queryKey: ["portfolio-quotes", symbols],
    queryFn: () => fetchStockQuotes(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 60000, // 1 minute
    staleTime: 1000 * 60 * 2,
  });

  // Update prices when quotes arrive
  useEffect(() => {
    if (quotes?.body) {
      const priceMap: Record<string, number> = {};
      quotes.body.forEach((q) => {
        priceMap[q.symbol] = q.regularMarketPrice;
      });
      updateCurrentPrices(priceMap);
    }
  }, [quotes]);

  const totalValue = getPortfolioValue();
  const totalProfit = getTotalProfit();
  const profitPercentage = ((totalProfit / 100000) * 100).toFixed(2);

  // ✅ FIXED: Handle AI Portfolio Analysis
  const handleAnalyzePortfolio = () => {
    if (holdings.length === 0) {
      Alert.alert(
        "Empty Portfolio",
        "Add some stocks to your portfolio first to get AI analysis."
      );
      return;
    }

    const portfolioSummary = getPortfolioSummary();
    
    // ✅ FIXED: setContext expects a string, not an object
    setContext(portfolioSummary);

    // Navigate to AI Chat
    router.push("/(tabs)/ai-chat");
  };

  const handleSellStock = (holding: any) => {
    Alert.alert(
      `Sell ${holding.symbol}`,
      `How many shares do you want to sell?\n\nYou have: ${holding.quantity} shares\nCurrent Price: $${holding.currentPrice?.toFixed(2) || holding.buyPrice.toFixed(2)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sell All",
          style: "destructive",
          onPress: () => {
            sellHolding(
              holding.id,
              holding.quantity,
              holding.currentPrice || holding.buyPrice
            );
            Alert.alert("Success!", `Sold all ${holding.quantity} shares of ${holding.symbol}`);
          },
        },
        {
          text: "Sell Half",
          onPress: () => {
            const halfQuantity = Math.floor(holding.quantity / 2);
            if (halfQuantity > 0) {
              sellHolding(
                holding.id,
                halfQuantity,
                holding.currentPrice || holding.buyPrice
              );
              Alert.alert("Success!", `Sold ${halfQuantity} shares of ${holding.symbol}`);
            }
          },
        },
      ]
    );
  };

  const handleClearPortfolio = () => {
    Alert.alert(
      "Clear Portfolio",
      "Are you sure you want to reset your portfolio? This will sell all stocks and reset cash to $100,000.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearPortfolio();
            Alert.alert("Portfolio Reset", "Your portfolio has been cleared.");
          },
        },
      ]
    );
  };

  const renderHolding = ({ item }: { item: any }) => {
    const currentPrice = item.currentPrice || item.buyPrice;
    const currentValue = currentPrice * item.quantity;
    const costBasis = item.buyPrice * item.quantity;
    const profit = currentValue - costBasis;
    const profitPercent = ((profit / costBasis) * 100).toFixed(2);

    return (
      <Pressable
        onPress={() => router.push(`/stock/${item.symbol}`)}
        className="bg-white/10 rounded-2xl p-4 mb-3"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-white text-lg" style={{ fontFamily: "RubikBold" }}>
              {item.symbol}
            </Text>
            <Text className="text-white/70 text-sm" style={{ fontFamily: "RubikRegular" }}>
              {item.companyName}
            </Text>
          </View>
          <Pressable
            onPress={() => handleSellStock(item)}
            className="bg-red-500/20 px-3 py-1 rounded-full border border-red-400/30"
          >
            <Text className="text-red-400 text-xs" style={{ fontFamily: "RubikMedium" }}>
              Sell
            </Text>
          </Pressable>
        </View>

        <View className="flex-row justify-between mt-2">
          <View>
            <Text className="text-white/50 text-xs" style={{ fontFamily: "RubikRegular" }}>
              Quantity
            </Text>
            <Text className="text-white text-base" style={{ fontFamily: "RubikMedium" }}>
              {item.quantity} shares
            </Text>
          </View>
          <View>
            <Text className="text-white/50 text-xs" style={{ fontFamily: "RubikRegular" }}>
              Avg. Cost
            </Text>
            <Text className="text-white text-base" style={{ fontFamily: "RubikMedium" }}>
              ${item.buyPrice.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text className="text-white/50 text-xs" style={{ fontFamily: "RubikRegular" }}>
              Current
            </Text>
            <Text className="text-white text-base" style={{ fontFamily: "RubikMedium" }}>
              ${currentPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mt-3 pt-3 border-t border-white/10">
          <View>
            <Text className="text-white/50 text-xs" style={{ fontFamily: "RubikRegular" }}>
              Total Value
            </Text>
            <Text className="text-white text-base" style={{ fontFamily: "RubikBold" }}>
              ${currentValue.toFixed(2)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-white/50 text-xs" style={{ fontFamily: "RubikRegular" }}>
              Profit/Loss
            </Text>
            <Text
              className={`text-base ${profit >= 0 ? "text-green-400" : "text-red-400"}`}
              style={{ fontFamily: "RubikBold" }}
            >
              {profit >= 0 ? "+" : ""}${profit.toFixed(2)} ({profitPercent}%)
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#00194b", "#0C0C0C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="h-full"
      >
        {/* Header */}
        <View className="pt-16 pb-4 px-4 border-b border-white/10">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl" style={{ fontFamily: "RubikBold" }}>
              Portfolio
            </Text>
            {holdings.length > 0 && (
              <Pressable
                onPress={handleClearPortfolio}
                className="p-2 bg-white/10 rounded-full"
              >
                <Ionicons name="refresh" size={20} color="#ef4444" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Portfolio Summary Card */}
        {holdings.length > 0 && (
          <View className="px-4 mt-4 mb-2">
            <LinearGradient
              colors={["#3b82f6", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl p-6"
            >
              <Text className="text-white/80 text-sm mb-1" style={{ fontFamily: "RubikRegular" }}>
                Total Portfolio Value
              </Text>
              <Text className="text-white text-4xl mb-4" style={{ fontFamily: "RubikBold" }}>
                ${totalValue.toFixed(2)}
              </Text>

              <View className="flex-row justify-between mb-4">
                <View>
                  <Text className="text-white/70 text-xs mb-1" style={{ fontFamily: "RubikRegular" }}>
                    Cash Available
                  </Text>
                  <Text className="text-white text-lg" style={{ fontFamily: "RubikMedium" }}>
                    ${virtualCash.toFixed(2)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/70 text-xs mb-1" style={{ fontFamily: "RubikRegular" }}>
                    Total Profit/Loss
                  </Text>
                  <Text
                    className={`text-lg ${totalProfit >= 0 ? "text-green-300" : "text-red-300"}`}
                    style={{ fontFamily: "RubikBold" }}
                  >
                    {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)} ({profitPercentage}%)
                  </Text>
                </View>
              </View>

              {/* ✅ Analyze Portfolio Button */}
              <Pressable
                onPress={handleAnalyzePortfolio}
                className="bg-white rounded-xl p-3 flex-row items-center justify-center"
              >
                <View className="w-6 h-6 mr-2">
                  <Image
                    style={{
                      flex: 1,
                      width: "100%",
                      height: "100%",
                      borderRadius: 6,
                    }}
                    source={require("../../assets/images/logo.png")}
                    placeholder={{ blurhash }}
                    contentFit="contain"
                  />
                </View>
                <Text className="text-[#00194b] text-base" style={{ fontFamily: "RubikBold" }}>
                  Analyze Portfolio with AI
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* Holdings List or Empty State */}
        {holdings.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="briefcase-outline" size={80} color="#ffffff30" />
            <Text className="text-white text-xl text-center mt-4 mb-2" style={{ fontFamily: "RubikBold" }}>
              Your Portfolio is Empty
            </Text>
            <Text className="text-white/50 text-center mb-6" style={{ fontFamily: "RubikRegular" }}>
              Start adding stocks to track your investments
            </Text>
            <Text className="text-white/60 text-center text-sm" style={{ fontFamily: "RubikMedium" }}>
              Starting Virtual Cash: $100,000
            </Text>
          </View>
        ) : (
          <FlatList
            data={holdings}
            renderItem={renderHolding}
            keyExtractor={(item) => item.id}
            className="flex-1 px-4 pt-2"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </LinearGradient>
    </View>
  );
}
