// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import { router, useRouter } from "expo-router";
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Carousel from "react-native-reanimated-carousel";
import { SafeAreaView } from 'react-native-safe-area-context';
// import { blurhash } from "../../app/index";
import { fetchMarketTickers } from '../api/marketApi';

const { width } = Dimensions.get("window");

const chunkArray = (array: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const topStocks = ["AAPL", "GOOG", "MSFT", "AMZN", "TSLA"];

const sortStocks = (stocks: any[]) => {
  if (!stocks || !stocks.length) return [];
  const topStocksItems: any[] = stocks.filter((stock) =>
    topStocks.includes(stock.symbol.toUpperCase())
  );
  const sortedTopStocks = topStocks
    .map((symbol: any) =>
      topStocksItems.find((stock) => stock.symbol.toUpperCase() === symbol)
    )
    .filter(Boolean);
  const otherStocks = stocks.filter((stock) =>
    !topStocks.includes(stock.symbol.toUpperCase())
  );
  return [...sortedTopStocks, ...otherStocks];
};

export default function HomeScreen() {
  const routerNav = useRouter();

  // Animated pulse for live dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
        body: sortStocks(data.body),
      };
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
                  // placeholder={{ blurhash }}
                  contentFit="contain"
                  transition={1000}
                />
              </Pressable>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => routerNav.push('/search')}
            activeOpacity={0.7}
          >
            <View style={styles.searchButtonContent}>
              <Ionicons name="search" size={22} color="#fff" />
              <Text style={styles.searchButtonText}>
                Search Stocks (US & India 🇺🇸 🇮🇳)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}
          >

            {/* Stocks Section */}
            <View className="p-4 rounded-2xl bg-blue-900/10 border border-white/20 overflow-hidden">
              <Text
                className="text-white text-lg mb-2"
                style={{ fontFamily: "RubikBold" }}
              >
                Stocks {recentStocksData?.body?.length || 0}
              </Text>

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
                            style={{ width: (width - 64) / 4 }}
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
                        );
                      })}
                    </View>
                  )}
                />
              ) : (
                <Text
                  className="text-white/60 text-center py-4 text-sm"
                  style={{ fontFamily: "RubikMedium" }}
                >
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
                    <Ionicons name="analytics" size={24} color="#60a5fa" />
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
                    <Ionicons name="star" size={24} color="#fbbf24" />
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

            {/* 🔥 MARKET PULSE - WOW SECTION */}
            <View className="mb-6">
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.05)',
                  'rgba(59,130,246,0.1)',
                  'rgba(255,255,255,0.03)'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  marginBottom: 16,
                  overflow: 'hidden',
                }}
              >
                {/* Live Pulse Title */}
                <View className="flex-row items-center mb-4">
                  <Animated.View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#34d399',
                      marginRight: 8,
                      opacity: pulseAnim,
                    }}
                  />
                  <Text
                    className="text-white text-xl"
                    style={{ fontFamily: "RubikBold" }}
                  >
                    Market Pulse
                  </Text>
                </View>

                {/* Stats Row */}
                <View className="flex-row justify-between">
                  <View className="flex-1 mr-2">
                    <Text
                      className="text-white/60 text-xs mb-1"
                      style={{ fontFamily: "RubikMedium" }}
                    >
                      Market Cap
                    </Text>
                    <Text
                      className="text-white text-2xl"
                      style={{ fontFamily: "RubikBold" }}
                    >
                      $2.8T
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 1,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      marginHorizontal: 8,
                    }}
                  />

                  <View className="flex-1 mx-2">
                    <Text
                      className="text-white/60 text-xs mb-1"
                      style={{ fontFamily: "RubikMedium" }}
                    >
                      Volume
                    </Text>
                    <Text
                      className="text-white text-2xl"
                      style={{ fontFamily: "RubikBold" }}
                    >
                      45B
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 1,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      marginHorizontal: 8,
                    }}
                  />

                  <View className="flex-1 ml-2">
                    <Text
                      className="text-white/60 text-xs mb-1"
                      style={{ fontFamily: "RubikMedium" }}
                    >
                      Advance/Decline
                    </Text>
                    <Text
                      className="text-emerald-400 text-2xl"
                      style={{ fontFamily: "RubikBold" }}
                    >
                      1,234 ↗
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text
                    className="text-white/70 text-xs"
                    style={{ fontFamily: "RubikMedium" }}
                  >
                    Live market data • Updated 2s ago
                  </Text>
                </View>
              </LinearGradient>

              {/* 3D Glassmorphism Cards */}
              <View className="flex-row">
                <Pressable
                  onPress={() => router.push("/search?tag=magnificent7")}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(30,41,59,0.8)',
                    borderRadius: 16,
                    padding: 16,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(100,116,139,0.4)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 15,
                  }}
                >
                  <LinearGradient
                    colors={['#a855f7', '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons name="rocket" size={20} color="white" />
                  </LinearGradient>
                  <Text
                    className="text-white text-sm mb-1"
                    style={{ fontFamily: "RubikBold" }}
                  >
                    Magnificent 7
                  </Text>
                  <Text
                    style={{
                      fontFamily: "RubikRegular",
                      color: '#94a3b8',
                      fontSize: 11,
                    }}
                  >
                    AAPL, MSFT, NVDA + 4 more
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push("/search?tag=indian-bluechips")}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(6,78,59,0.5)',
                    borderRadius: 16,
                    padding: 16,
                    marginLeft: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(52,211,153,0.3)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 15,
                  }}
                >
                  <LinearGradient
                    colors={['#10b981', '#14b8a6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons name="trending-up" size={20} color="white" />
                  </LinearGradient>
                  <Text
                    className="text-white text-sm mb-1"
                    style={{ fontFamily: "RubikBold" }}
                  >
                    Indian Bluechips
                  </Text>
                  <Text
                    style={{
                      fontFamily: "RubikRegular",
                      color: '#6ee7b7',
                      fontSize: 11,
                    }}
                  >
                    RELIANCE, TCS, HDFCBANK
                  </Text>
                </Pressable>
              </View>
            </View>

          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '600',
    fontFamily: 'RubikSemiBold',
  },
});
