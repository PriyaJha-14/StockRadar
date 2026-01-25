// app/stock/[symbol].tsx
import { formatStockForAi } from "@/utils/aiService";
import { useRealtimePrice } from "@/utils/realtimeApi"; // ✅ NEW: Import real-time hook
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { blurhash } from "../../app/index";
import { fetchStockHistory, fetchStockModule, fetchStockQuotes } from "../api/marketApi";
import { useChatStore } from "../store/chatStore";
import { usePortfolioStore } from "../store/portfolioStore";
import { useWatchlistStore } from "../store/watchlistStore";

const timeFrames = [
  { label: "1D", interval: "5m", days: 1 },
  { label: "1W", interval: "15m", days: 7 },
  { label: "1M", interval: "1d", days: 30 },
  { label: "3M", interval: "1d", days: 90 },
  { label: "1Y", interval: "1wk", days: 365 },
  { label: "All", interval: "1mo", days: 0 },
];

const TABS = ["Overview", "Financials"];

const StockDetailsScreen = () => {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();

  const [activeTab, setActiveTab] = useState(0);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(0);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState("");

  const { setContext } = useChatStore();
  const { buyStock, virtualCash } = usePortfolioStore();
  const { stocks, addStock, removeStock, isInWatchlist } = useWatchlistStore();

  // ✅ NEW: Get real-time data (silently falls back to Yahoo Finance if unavailable)
  const { liveData, loading: liveLoading } = useRealtimePrice(symbol);

  const isWatched = useMemo(() => {
    return isInWatchlist(symbol);
  }, [symbol, stocks]);

  const { data: quoteData, isLoading: isQuoteLoading } = useQuery({
    queryKey: ["stockData", symbol],
    queryFn: () => fetchStockQuotes([symbol as string]),
    enabled: !!symbol,
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["stockHistory", symbol, timeFrames[selectedTimeFrame].interval],
    queryFn: () =>
      fetchStockHistory(
        symbol as string,
        timeFrames[selectedTimeFrame].interval as any
      ),
    enabled: !!symbol,
  });

  const { data: profileData, isPending: isProfileLoading } = useQuery({
    queryKey: ["stockModule", symbol, "all"],
    queryFn: () => fetchStockModule(symbol as string, "asset-profile"),
    enabled: !!symbol,
  });

  const processedChartData = useMemo(() => {
    if (!historyData?.body) return [];
    
    try {
      return Object.entries(historyData.body).map(([timestamp, data]: [string, any]) => ({
        timestamp: parseInt(timestamp),
        date: new Date(parseInt(timestamp) * 1000),
        open: data?.open || 0,
        high: data?.high || 0,
        low: data?.low || 0,
        close: data?.close || 0,
        value: data?.close || 0,
        volume: data?.volume || 0,
      }));
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [historyData]);

  const priceChangeData = useMemo(() => {
    if (processedChartData.length === 0) {
      return { change: 0, percentChange: 0, isPositive: false };
    }

    try {
      const firstPrice = processedChartData[0]?.value || 0;
      const lastPrice = processedChartData[processedChartData.length - 1]?.value || 0;
      
      if (firstPrice === 0) {
        return { change: 0, percentChange: 0, isPositive: false };
      }

      const change = lastPrice - firstPrice;
      const percentChange = (change / firstPrice) * 100;
      
      return { 
        change: isNaN(change) ? 0 : change, 
        percentChange: isNaN(percentChange) ? 0 : percentChange, 
        isPositive: change > 0 
      };
    } catch (error) {
      console.error('Error calculating price change:', error);
      return { change: 0, percentChange: 0, isPositive: false };
    }
  }, [processedChartData]);

  const handleBuyStock = () => {
    const quote = quoteData?.body?.[0];
    if (!quote?.regularMarketPrice) {
      Alert.alert("Error", "Stock price not available");
      return;
    }
    setShowBuyModal(true);
    setBuyQuantity("");
  };

  const processBuy = () => {
    const quote = quoteData?.body?.[0];
    if (!quote?.regularMarketPrice) {
      Alert.alert("Error", "Stock price not available");
      return;
    }

    const currentPrice = quote.regularMarketPrice;
    const quantity = parseInt(buyQuantity);

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Invalid", "Please enter a valid number");
      return;
    }

    const totalCost = quantity * currentPrice;

    if (totalCost > virtualCash) {
      const maxShares = Math.floor(virtualCash / currentPrice);
      Alert.alert(
        "Insufficient Funds",
        `You need $${totalCost.toFixed(2)} but only have $${virtualCash.toFixed(2)}\n\nMaximum shares: ${maxShares}`
      );
      return;
    }

    const success = buyStock(symbol, quantity, currentPrice);

    if (success !== false) {
      setShowBuyModal(false);
      Alert.alert(
        "Success! 🎉",
        `Bought ${quantity} share${quantity > 1 ? 's' : ''} of ${symbol} for $${totalCost.toFixed(2)}\n\nRemaining Cash: $${(virtualCash - totalCost).toFixed(2)}\n\nCheck your Portfolio tab!`
      );
    } else {
      Alert.alert("Error", "Failed to purchase stock");
    }
  };

  const renderTabBar = () => {
    return (
      <View className="flex-row bg-white border-b border-gray-200">
        {TABS.map((tab, index) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(index)}
            className={`flex-1 py-3 items-center ${
              activeTab === index
                ? "border-b-2 border-blue-600"
                : "border-b-2 border-transparent"
            }`}
          >
            <Text
              className={`${
                activeTab === index ? "text-blue-600" : "text-gray-600"
              }`}
              style={{ fontFamily: "RubikMedium" }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderOverview = () => {
    if (isProfileLoading) {
      return (
        <View className="py-8 items-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      );
    }

    const profile = profileData?.body;
    return (
      <View className="p-4">
        {profile?.longBusinessSummary && (
          <View className="mb-4">
            <Text className="text-lg font-bold text-white mb-2" style={{ fontFamily: "RubikBold" }}>
              About
            </Text>
            <Text className="text-white" style={{ fontFamily: "RubikMedium" }}>
              {showFullSummary || profile.longBusinessSummary.length <= 250
                ? profile.longBusinessSummary
                : `${profile.longBusinessSummary.substring(0, 250)}...`}
            </Text>
            {profile.longBusinessSummary.length > 250 && (
              <Pressable onPress={() => setShowFullSummary(!showFullSummary)} className="mt-1">
                <Text className="text-blue-400 text-sm" style={{ fontFamily: "RubikMedium" }}>
                  {showFullSummary ? "Show Less" : "Show More"}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View className="mb-4">
          <Text className="text-lg font-bold text-white mb-2" style={{ fontFamily: "RubikBold" }}>
            Company Info
          </Text>
          <View className="bg-white rounded-lg p-4 shadow-sm">
            {profile?.sector && (
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Sector</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{profile.sector}</Text>
              </View>
            )}
            {profile?.industry && (
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Industry</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{profile.industry}</Text>
              </View>
            )}
            {profile?.fullTimeEmployees && (
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Full Time Employees</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{profile.fullTimeEmployees.toLocaleString()}</Text>
              </View>
            )}
            {profile?.website && (
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Website</Text>
                <Text style={{ fontFamily: "RubikMedium" }} numberOfLines={1}>
                  {profile.website.replace("https://", "").replace("http://", "")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {profile?.companyOfficers && profile.companyOfficers.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-bold text-white mb-2" style={{ fontFamily: "RubikBold" }}>
              Key Executives
            </Text>
            <View className="bg-white rounded-lg p-4 shadow-sm">
              {profile.companyOfficers.slice(0, 5).map((officer: any, index: number) => (
                <View
                  key={index}
                  className={`py-2 ${
                    index < Math.min(profile.companyOfficers.length, 5) - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <Text className="font-bold" style={{ fontFamily: "RubikBold" }}>{officer.name}</Text>
                  <Text className="text-gray-600 text-sm" style={{ fontFamily: "RubikMedium" }}>{officer.title}</Text>
                  {officer.totalPay && (
                    <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: "RubikRegular" }}>
                      Total Pay: {officer.totalPay.fmt}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderFinancialsTab = () => {
    return (
      <View className="p-4">
        <Text className="text-white text-center" style={{ fontFamily: "RubikMedium" }}>
          Financials data coming soon
        </Text>
      </View>
    );
  };

  const handleAskAi = () => {
    if (quoteData?.body?.[0] && processedChartData.length > 0) {
      const stockContext = formatStockForAi(
        {
          symbol,
          lastsale: processedChartData[processedChartData.length - 1]?.value?.toString() || "0",
          netchange: priceChangeData.change.toString(),
          pctchange: priceChangeData.percentChange.toFixed(2) + "%",
          name: quoteData.body[0]?.longName,
        },
        profileData?.body
      );
      setContext(stockContext);
      router.push("/(tabs)/ai-chat");
    }
  };

  const handleWatchlistPress = () => {
    if (isWatched) {
      removeStock(symbol);
      Alert.alert("Removed", `${symbol} removed from watchlist`);
    } else {
      addStock(symbol);
      Alert.alert("Added", `${symbol} added to watchlist`);
    }
  };

  const currentPrice = quoteData?.body?.[0]?.regularMarketPrice || 0;
  const maxShares = currentPrice > 0 ? Math.floor(virtualCash / currentPrice) : 0;

  // Show loading state
  if (isQuoteLoading || isHistoryLoading) {
    return (
      <LinearGradient colors={["#00194b", "#0C0C0C"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="flex-1">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4" style={{ fontFamily: "RubikMedium" }}>
            Loading {symbol}...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={["#00194b", "#0C0C0C"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="h-full">
        <View className="pt-16 px-4 flex-row justify-between items-center">
          <Pressable className="mx-2 bg-white rounded-full p-1" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0284c7" />
          </Pressable>
          <Pressable className="mx-2 bg-white rounded-full p-1" onPress={handleWatchlistPress}>
            <Ionicons name={isWatched ? "star" : "star-outline"} size={24} color={isWatched ? "#fbbf24" : "#0284c7"} />
          </Pressable>
        </View>

        <View className="h-full px-4">
          {/* ✅ UPDATED: Price Display Section with Real-time Data */}
          <View className="flex-row items-center justify-between py-4">
            <View className="flex-1 mr-4">
              <Text className="text-2xl text-white" style={{ fontFamily: "RubikBold" }}>
                {symbol}
              </Text>
              {quoteData?.body?.[0]?.longName && (
                <Text className="text-white/80 text-base" style={{ fontFamily: "RubikMedium" }} numberOfLines={1}>
                  {quoteData.body[0]?.longName}
                </Text>
              )}
            </View>
            
            <View>
              {/* Price - Auto-selects best data source (Real-time > Chart > Quote) */}
              <Text className="text-2xl font-bold text-white text-right">
                ${(() => {
                  // Priority 1: Real-time data (if available)
                  if (liveData?.price) return liveData.price.toFixed(2);
                  
                  // Priority 2: Chart data
                  if (processedChartData.length > 0) {
                    return processedChartData[processedChartData.length - 1]?.value.toFixed(2);
                  }
                  
                  // Priority 3: Quote data
                  return (quoteData?.body?.[0]?.regularMarketPrice || 0).toFixed(2);
                })()}
              </Text>
              
              {/* Change & Percent Change - Auto-selects best data source */}
              <View className="flex-row items-center mt-1 justify-end">
                <Text
                  className={`text-base ${(() => {
                    const change = liveData?.change ?? priceChangeData.change;
                    return change >= 0 ? "text-green-500" : "text-red-500";
                  })()}`}
                  style={{ fontFamily: "RubikBold" }}
                >
                  {(() => {
                    const change = liveData?.change ?? priceChangeData.change;
                    const percentChange = liveData?.percentChange ?? priceChangeData.percentChange;
                    const isPositive = change >= 0;
                    
                    return `${isPositive ? "+" : ""}${change.toFixed(2)} (${isPositive ? "+" : ""}${percentChange.toFixed(2)}%)`;
                  })()}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
            {renderTabBar()}
            {activeTab === 0 && renderOverview()}
            {activeTab === 1 && renderFinancialsTab()}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Buy Modal */}
      <Modal visible={showBuyModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl mb-2" style={{ fontFamily: "RubikBold" }}>Buy {symbol}</Text>
            <Text className="text-gray-600 mb-4" style={{ fontFamily: "RubikMedium" }}>
              Current Price: ${currentPrice.toFixed(2)}
            </Text>
            <Text className="text-gray-600 mb-4" style={{ fontFamily: "RubikMedium" }}>
              Available Cash: ${virtualCash.toFixed(2)}
            </Text>
            <Text className="text-gray-500 text-sm mb-4" style={{ fontFamily: "RubikRegular" }}>
              Maximum shares you can buy: {maxShares}
            </Text>

            <TextInput
              className="border border-gray-300 rounded-lg p-4 mb-4 text-lg"
              placeholder="Enter number of shares"
              keyboardType="numeric"
              value={buyQuantity}
              onChangeText={setBuyQuantity}
              style={{ fontFamily: "RubikMedium" }}
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowBuyModal(false)}
                className="flex-1 bg-gray-200 rounded-lg p-4 items-center"
              >
                <Text className="text-gray-700" style={{ fontFamily: "RubikBold" }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={processBuy} className="flex-1 bg-green-600 rounded-lg p-4 items-center">
                <Text className="text-white" style={{ fontFamily: "RubikBold" }}>Buy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Buttons */}
      <View 
        className="absolute bottom-0 left-0 right-0 pb-6 pt-4 px-5"
        style={{ backgroundColor: '#00194b', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handleBuyStock}
          className="bg-green-600 rounded-xl h-14 items-center justify-center shadow-lg flex-row px-4 mb-3"
        >
          <Ionicons name="cart" size={20} color="white" />
          <Text className="text-white text-base ml-2" style={{ fontFamily: "RubikBold" }}>
            Buy {symbol} (Virtual)
          </Text>
        </Pressable>

        <Pressable onPress={handleAskAi} className="bg-blue-600 rounded-xl h-14 items-center justify-center shadow-lg flex-row px-4">
          <View className="w-8 h-8 mr-2">
            <Image
              style={{ flex: 1, width: "100%", height: "100%", borderRadius: 40, backgroundColor: "white" }}
              source={require("../../assets/images/logo.png")}
              placeholder={{ blurhash }}
              contentFit="contain"
              transition={1000}
            />
          </View>
          <Text style={{ fontFamily: "RubikBold" }} className="text-white text-base">
            Ask Sage AI About {symbol}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default StockDetailsScreen;
