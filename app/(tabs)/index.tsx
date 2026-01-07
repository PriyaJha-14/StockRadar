// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Carousel from "react-native-reanimated-carousel";
import { SafeAreaView } from 'react-native-safe-area-context';
import { blurhash } from "../../app/index";
import { fetchMarketTickers } from '../api/marketApi';

const { width } = Dimensions.get("window");

const chunkArray = (array: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks;
}

const topStocks = ["AAPL", "GOOG", "MSFT", "AMZN", "TSLA"];
const marketTypes = ["STOCKS", "ETF", "MUTUALFUNDS", "FUTURES"];

const sortStocks = (stocks: any[]) => {
  if (!stocks || !stocks.length) return [];

  // First find all the top stocks
  const topStocksItems: any[] = stocks.filter((stock) => 
    topStocks.includes(stock.symbol.toUpperCase())
  );

  // Sort the top stocks according to priority
  const sortedTopStocks = topStocks
    .map((symbol: any) => 
      topStocksItems.find((stock) => stock.symbol.toUpperCase() === symbol)
    )
    .filter(Boolean);

  const otherStocks = stocks.filter((stock) => 
    !topStocks.includes(stock.symbol.toUpperCase())
  );

  // Combine sorted top stocks with the rest of the stocks 
  return [...sortedTopStocks, ...otherStocks];
};

const transformETFData = (data: any) => {
  return {
    ...data,
    body: data.body.map((item: any) => ({
      symbol: item.symbol,
      name: item.companyName,
      pctchange: item.percentChange,
      netchange: item.netChange,
      marketCap: item.marketCap,
      lastsale: item.lastSalePrice,
    }))
  }
}

type MarketType = "STOCKS" | "ETF" | "MUTUALFUNDS" | "FUTURES";

export default function HomeScreen() {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>("STOCKS");

  // Recent stocks query with rate limit protection
  const { 
    data: recentStocksData, 
    isPending: isLoadingRecentStocks, 
    error: recentStocksError 
  } = useQuery({
    queryKey: ["recentStocks"],
    queryFn: () => fetchMarketTickers(1, "STOCKS"),
    select: (data) => {
      if (!data || !data.body) return data;
      return {
        ...data,
        body: sortStocks(data.body)
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  // Market data query with rate limit protection
  const { 
    data: marketData, 
    isPending: isLoadingMarket, 
    error: marketError 
  } = useQuery({
    queryKey: ["marketTickers", selectedMarket],
    queryFn: () => fetchMarketTickers(1, selectedMarket),
    select: (data) => {
      if (selectedMarket === "ETF") {
        return transformETFData(data)
      }
      return data
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#00194b", "#0C0C0C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="h-full"
      >
        <View className="h-full p-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="w-1/2">
              <Text 
                className="text-white text-lg"
                style={{ fontFamily: "RubikMedium" }}
              >
                Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}
              </Text>
              <Text 
                className="text-white text-2xl font-bold"
                style={{ fontFamily: "RubikBold" }}
              >
                Priya Jha
              </Text>
            </View>
            <View className="w-1/2 items-end">
              <Pressable
                onPress={() => router.push("/(tabs)/ai-chat")}
                className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center"
              >
                <Image
                  style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    borderRadius: 40,
                    backgroundColor: "white",
                  }}
                  source={require("../../assets/images/logo.png")}
                  placeholder={{ blurhash }}
                  contentFit="contain"
                  transition={1000}
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 150,
            }}
          >
            {/* Stocks Section */}
            <View className="p-4 rounded-2xl bg-blue-900/10 border border-white/20 overflow-hidden">
              <Text
                className="text-white text-lg mb-2"
                style={{ fontFamily: "RubikBold" }}
              >
                Stocks {recentStocksData?.body?.length || 0}
              </Text>

              {/* Show rate limit error if present */}
              {recentStocksError && (
                <View className="bg-red-500/20 p-3 rounded-lg mb-3">
                  <Text className="text-red-300 text-xs" style={{ fontFamily: "RubikMedium" }}>
                    ⚠️ Rate limit exceeded. Please try again in a few minutes.
                  </Text>
                </View>
              )}

              {isLoadingRecentStocks ? (
                <View className="h-24 justify-center items-center">
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : recentStocksData?.body && recentStocksData.body.length > 0 ? (
                <Carousel
                  loop={false}
                  width={width - 64}
                  height={100}
                  data={chunkArray(recentStocksData?.body || [], 6)}
                  scrollAnimationDuration={1000}
                  renderItem={({ item: chunk }) => (
                    <View className="flex-row flex-wrap">
                      {chunk.map((stock: any) => {
                        const isPositive = !stock.netchange.startsWith("-");
                        return (
                          <View 
                            key={stock.symbol}
                            style={{
                              width: (width - 64) / 4,
                            }}
                            className="mb-2"
                          >
                            <TouchableOpacity
                              onPress={() => router.push(`/stock/${stock.symbol}`)}
                            >
                              <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-2">
                                  <Text 
                                    className="text-white text-base"
                                    style={{ fontFamily: "RubikBold" }}
                                  >
                                    {stock.symbol.charAt(0)}
                                  </Text>
                                </View>
                                <View>
                                  <Text 
                                    className="text-white text-sm"
                                    style={{ fontFamily: "RubikBold" }}
                                  >
                                    {stock.symbol}
                                  </Text>
                                  <Text
                                    style={{ fontFamily: "RubikSemiBold" }}
                                    className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}
                                  >
                                    {stock.pctchange}
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          </View>
                        )
                      })}
                    </View>
                  )}
                />
              ) : (
                <Text className="text-white/60 text-center py-4 text-sm" style={{ fontFamily: "RubikMedium" }}>
                  No stocks available
                </Text>
              )}
            </View>

            {/* Quick AI Action */}
            <View className="my-6">
              <Text
                className="text-white text-lg mb-4"
                style={{ fontFamily: "RubikBold" }}
              >
                Quick AI Action
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/ai-chat")}
                  className="flex-1 bg-white/10 rounded-lg mr-2 p-4"
                >
                  <View className="mb-2">
                    <Ionicons
                      name="analytics"
                      size={24}
                      color="#60a5fa"
                    />
                  </View>
                  <Text 
                    className="text-white text-sm"
                    style={{ fontFamily: "RubikSemiBold" }}
                  >
                    Ask AI About These Stocks
                  </Text>
                  <Text
                    className="text-white/70 text-xs mt-1"
                    style={{ fontFamily: "RubikRegular" }}
                  >
                    Get insights on current market leaders
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/watchlist")}
                  className="flex-1 bg-white/10 rounded-lg ml-2 p-4"
                >
                  <View className="mb-2">
                    <Ionicons
                      name="star"
                      size={24}
                      color="#fbbf24"
                    />
                  </View>
                  <Text 
                    className="text-white text-sm"
                    style={{ fontFamily: "RubikSemiBold" }}
                  >
                    Analyze Watchlist
                  </Text>
                  <Text
                    className="text-white/70 text-xs mt-1"
                    style={{ fontFamily: "RubikRegular" }}
                  >
                    AI Portfolio Analysis
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Market Type Segments */}
            <View className="mb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {marketTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedMarket(type as MarketType)}
                    className={`px-4 py-2 mr-2 rounded-full ${
                      selectedMarket === type ? "bg-white" : "bg-white/10"
                    }`}
                  >
                    <Text
                      className={`${selectedMarket === type ? "text-black" : "text-white"}`}
                      style={{
                        fontFamily: selectedMarket === type ? "RubikBold" : "RubikSemiBold"
                      }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Indices Section */}
            <View className="mb-4">
              <Text
                className="text-white text-lg mb-3"
                style={{ fontFamily: "RubikBold" }}
              >
                Indices
              </Text>

              {/* Show rate limit error if present */}
              {marketError && (
                <View className="bg-red-500/20 p-3 rounded-lg mb-3">
                  <Text className="text-red-300 text-xs" style={{ fontFamily: "RubikMedium" }}>
                    ⚠️ Rate limit exceeded. Please try again in a few minutes.
                  </Text>
                </View>
              )}

              {isLoadingMarket ? (
                <View className="h-32 justify-center items-center bg-white/10 rounded-lg">
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : marketData?.body && marketData.body.length > 0 ? (
                <Carousel
                  loop={false}
                  width={width - 32}
                  height={160}
                  data={chunkArray(marketData?.body || [], 2)}
                  scrollAnimationDuration={1000}
                  renderItem={({ item: chunk }) => (
                    <View className="gap-2 w-[98%]">
                      {chunk.map((item: any) => {
                        const isPositive = !item.netchange.startsWith("-");
                        return (
                          <TouchableOpacity
                            key={item.symbol}
                            onPress={() => router.push(`/stock/${item.symbol}`)}
                            className="bg-white/10 rounded-lg p-4"
                          >
                            <View className="flex-row items-center">
                              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-3">
                                <Text
                                  className="text-white text-lg"
                                  style={{ fontFamily: "RubikBold" }}
                                >
                                  {item.symbol.charAt(0)}
                                </Text>
                              </View>

                              <View className="flex-1 flex-row justify-between items-center">
                                <View className="flex-1 mr-2">
                                  <Text
                                    className="text-white text-base"
                                    style={{ fontFamily: "RubikBold" }}
                                    numberOfLines={1}
                                  >
                                    {item?.symbol}
                                  </Text>
                                  <Text
                                    className="text-white/70 text-xs mt-1"
                                    style={{ fontFamily: "RubikMedium" }}
                                    numberOfLines={1}
                                  >
                                    {item?.name}
                                  </Text>
                                </View>

                                <View className="items-end">
                                  <Text
                                    className="text-white text-base"
                                    style={{ fontFamily: "RubikBold" }}
                                  >
                                    ${item?.lastsale}
                                  </Text>
                                  <Text
                                    style={{ fontFamily: "RubikSemiBold" }}
                                    className={`text-sm ${
                                      isPositive ? "text-green-500" : "text-red-500"
                                    }`}
                                  >
                                    {item.pctchange}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  )}
                />
              ) : (
                <Text className="text-white/60 text-center py-4 text-sm" style={{ fontFamily: "RubikMedium" }}>
                  No data available
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
