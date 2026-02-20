// app/stock/[symbol].tsx
import { formatStockForAi } from "@/utils/aiService";
import { useRealtimePrice } from "@/utils/realtimeApi";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Line, Rect } from 'react-native-svg';
// import { blurhash } from "../../app/index";
import {
  calculateHealthScore,
  fetchFinancialSummary,
  formatLargeNumber,
  formatNumber,
  formatPercentage,
  getHealthScoreInfo
} from "../api/financialApi";
import { fetchStockHistory, fetchStockModule, fetchStockQuotes } from "../api/marketApi";
import { fetchCompanyNews, NewsArticle } from "../api/newsApi";
import { useChatStore } from "../store/chatStore";
import { usePortfolioStore } from "../store/portfolioStore";
import { useWatchlistStore } from "../store/watchlistStore";

// Import currency detection
import { detectCurrency, getCurrencySymbol } from "@/utils/currencyHelper";

const timeFrames = [
  { label: "1D", interval: "5m", days: 1 },
  { label: "1W", interval: "15m", days: 7 },
  { label: "1M", interval: "1d", days: 30 },
  { label: "3M", interval: "1d", days: 90 },
  { label: "1Y", interval: "1wk", days: 365 },
  { label: "All", interval: "1mo", days: 0 },
];

const TABS = ["Overview", "Financials", "News"];

const GRADIENT_COLORS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 280;

const StockDetailsScreen = () => {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();

  const [activeTab, setActiveTab] = useState(0);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(0);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState("");
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const { setContext } = useChatStore();
  const { buyStock, virtualCash } = usePortfolioStore();
  const { stocks, addStock, removeStock, isInWatchlist } = useWatchlistStore();

  const { liveData, loading: liveLoading } = useRealtimePrice(symbol);

  // Detect currency
  const currency = useMemo(() => detectCurrency(symbol), [symbol]);
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

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

  const { data: financialData, isPending: isFinancialLoading } = useQuery({
    queryKey: ["financialSummary", symbol],
    queryFn: () => fetchFinancialSummary(symbol as string),
    enabled: !!symbol && activeTab === 1,
    staleTime: 1000 * 60 * 30,
  });

  const { data: newsData, isLoading: isNewsLoading, refetch: refetchNews } = useQuery({
    queryKey: ['companyNews', symbol],
    queryFn: () => fetchCompanyNews(symbol as string),
    enabled: !!symbol && activeTab === 2,
    staleTime: 1000 * 60 * 5,
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
        `You need ${currencySymbol}${totalCost.toFixed(2)} but only have ${currencySymbol}${virtualCash.toFixed(2)}\n\nMaximum shares: ${maxShares}`
      );
      return;
    }

    const success = buyStock(symbol, quantity, currentPrice);

    if (success !== false) {
      setShowBuyModal(false);
      Alert.alert(
        "Success! 🎉",
        `Bought ${quantity} share${quantity > 1 ? 's' : ''} of ${symbol} for ${currencySymbol}${totalCost.toFixed(2)}\n\nRemaining Cash: ${currencySymbol}${(virtualCash - totalCost).toFixed(2)}\n\nCheck your Portfolio tab!`
      );
    } else {
      Alert.alert("Error", "Failed to purchase stock");
    }
  };

  const formatNewsDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  
  const getGradientColors = (index: number): [string, string] => {
    return GRADIENT_COLORS[index % GRADIENT_COLORS.length] as [string, string];
  };


  const handleTimeframeSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTimeFrame(index);
  };

  // CANDLESTICK ONLY Chart - NO LINE GRAPH
  const renderChart = () => {
    if (!processedChartData || processedChartData.length === 0) {
      return (
        <View style={chartStyles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color="#94a3b8" />
          <Text style={chartStyles.emptyText}>No chart data available</Text>
        </View>
      );
    }

    const currentPrice = (() => {
      if (liveData?.price && liveData.price > 0) return liveData.price;
      if (processedChartData.length > 0) {
        const lastPrice = processedChartData[processedChartData.length - 1]?.value;
        if (lastPrice && lastPrice > 0) return lastPrice;
      }
      const quotePrice = quoteData?.body?.[0]?.regularMarketPrice;
      return (quotePrice && quotePrice > 0) ? quotePrice : 0;
    })();

    const priceChange = liveData?.change ?? priceChangeData.change;
    const percentChange = liveData?.percentChange ?? priceChangeData.percentChange;
    const isPositive = priceChange >= 0;
    const lineColor = isPositive ? '#22c55e' : '#ef4444';

    const candleDataForChart = processedChartData.slice(-30);

    const allPrices = candleDataForChart.flatMap(d => [d.high, d.low]).filter(p => p > 0);
    if (allPrices.length === 0) {
      return (
        <View style={chartStyles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color="#94a3b8" />
          <Text style={chartStyles.emptyText}>Invalid price data</Text>
        </View>
      );
    }

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.1;

    return (
      <View style={chartStyles.container}>
        {/* Chart Header */}
        <View style={chartStyles.header}>
          <View>
            <Text style={chartStyles.price}>{currencySymbol}{currentPrice.toFixed(2)}</Text>
            <View style={chartStyles.changeContainer}>
              <Ionicons
                name={isPositive ? "arrow-up" : "arrow-down"}
                size={16}
                color={lineColor}
              />
              <Text style={[chartStyles.change, { color: lineColor }]}>
                {currencySymbol}{Math.abs(priceChange).toFixed(2)} ({Math.abs(percentChange).toFixed(2)}%)
              </Text>
              <View style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                marginLeft: 8,
              }}>
                <Text style={{
                  fontSize: 10,
                  color: '#3b82f6',
                  fontFamily: 'RubikBold',
                }}>
                  {currency}
                </Text>
              </View>
            </View>
          </View>

          {/* Candlestick Label */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#3b82f6',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            gap: 4,
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Ionicons name="bar-chart" size={18} color="#fff" />
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#ffffff',
              fontFamily: 'RubikMedium',
            }}>
              Candle
            </Text>
          </View>
        </View>

        {/* Candlestick Chart */}
        <View style={chartStyles.chartContainer}>
          <View style={{
            backgroundColor: '#f8fafc',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}>
            <Svg width={CHART_WIDTH - 24} height={CHART_HEIGHT - 80}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                <Line
                  key={`grid-${idx}`}
                  x1={10}
                  y1={(CHART_HEIGHT - 120) * ratio + 10}
                  x2={CHART_WIDTH - 34}
                  y2={(CHART_HEIGHT - 120) * ratio + 10}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              ))}

              {candleDataForChart.map((candle, index) => {
                if (candle.open === 0 || candle.close === 0) return null;

                const isPositiveCandle = candle.close >= candle.open;
                const candleWidth = Math.max((CHART_WIDTH - 80) / candleDataForChart.length - 2, 6);
                const spacing = (CHART_WIDTH - 80) / candleDataForChart.length;
                const x = index * spacing + spacing / 2 + 10;

                const chartHeightForCandles = CHART_HEIGHT - 120;
                const scaleY = (price: number) => {
                  const normalized = (price - (minPrice - padding)) / (priceRange + 2 * padding);
                  return chartHeightForCandles - (normalized * chartHeightForCandles) + 10;
                };

                const highY = scaleY(candle.high);
                const lowY = scaleY(candle.low);
                const openY = scaleY(candle.open);
                const closeY = scaleY(candle.close);

                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

                return (
                  <React.Fragment key={index}>
                    {/* Shadow wick */}
                    <Line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isPositiveCandle ? '#86efac' : '#fca5a5'}
                      strokeWidth={1}
                      opacity={0.5}
                    />

                    {/* Main wick */}
                    <Line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isPositiveCandle ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                    />

                    {/* Candle body */}
                    <Rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={isPositiveCandle ? '#22c55e' : '#ef4444'}
                      rx={2}
                      ry={2}
                    />

                    {/* Highlight */}
                    <Rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight / 3}
                      fill="white"
                      opacity={0.2}
                      rx={2}
                      ry={2}
                    />
                  </React.Fragment>
                );
              })}
            </Svg>

            {/* High/Low Labels */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
              paddingHorizontal: 12,
              borderTopWidth: 1,
              borderTopColor: '#e2e8f0',
              paddingTop: 8,
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 10,
                  color: '#ef4444',
                  fontFamily: 'RubikBold',
                  marginBottom: 2,
                }}>
                  Low
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: '#64748b',
                  fontFamily: 'RubikMedium'
                }}>
                  {currencySymbol}{minPrice.toFixed(2)}
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 10,
                  color: '#22c55e',
                  fontFamily: 'RubikBold',
                  marginBottom: 2,
                }}>
                  High
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: '#64748b',
                  fontFamily: 'RubikMedium'
                }}>
                  {currencySymbol}{maxPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* OHLC Data - FIXED */}
          {(() => {
            const quote = quoteData?.body?.[0];

            // Use quoteData fields directly — these are always correct
            const open = quote?.regularMarketOpen ||
              quote?.regularMarketPrice || 0;
            const high = quote?.regularMarketDayHigh ||
              quote?.regularMarketPrice || 0;
            const low = quote?.regularMarketDayLow ||
              quote?.regularMarketPrice || 0;
            const close = quote?.regularMarketPrice ||
              quote?.regularMarketPreviousClose || 0;

            return (
              <View style={chartStyles.ohlcContainer}>
                <View style={chartStyles.ohlcRow}>
                  <Text style={chartStyles.ohlcLabel}>Open</Text>
                  <Text style={chartStyles.ohlcValue}>
                    {currencySymbol}{open > 0 ? open.toFixed(2) : '--'}
                  </Text>
                </View>
                <View style={chartStyles.ohlcRow}>
                  <Text style={chartStyles.ohlcLabel}>High</Text>
                  <Text style={[chartStyles.ohlcValue, { color: '#22c55e' }]}>
                    {currencySymbol}{high > 0 ? high.toFixed(2) : '--'}
                  </Text>
                </View>
                <View style={chartStyles.ohlcRow}>
                  <Text style={chartStyles.ohlcLabel}>Low</Text>
                  <Text style={[chartStyles.ohlcValue, { color: '#ef4444' }]}>
                    {currencySymbol}{low > 0 ? low.toFixed(2) : '--'}
                  </Text>
                </View>
                <View style={chartStyles.ohlcRow}>
                  <Text style={chartStyles.ohlcLabel}>Close</Text>
                  <Text style={chartStyles.ohlcValue}>
                    {currencySymbol}{close > 0 ? close.toFixed(2) : '--'}
                  </Text>
                </View>
              </View>
            );
          })()}


        </View>

        {/* Chart Info Bar */}
        <View style={chartStyles.infoBar}>
          <View style={chartStyles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={chartStyles.infoText}>{timeFrames[selectedTimeFrame].label}</Text>
          </View>
          <View style={chartStyles.infoItem}>
            <Ionicons name="pulse-outline" size={14} color="#64748b" />
            <Text style={chartStyles.infoText}>Real-time</Text>
          </View>
          <View style={chartStyles.infoItem}>
            <View style={[chartStyles.indicator, { backgroundColor: lineColor }]} />
            <Text style={chartStyles.infoText}>{symbol}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTimeframeSelector = () => {
    return (
      <View style={timeframeStyles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={timeframeStyles.scrollContent}
        >
          {timeFrames.map((timeframe, index) => (
            <Pressable
              key={timeframe.label}
              style={[
                timeframeStyles.button,
                selectedTimeFrame === index && timeframeStyles.buttonActive,
              ]}
              onPress={() => handleTimeframeSelect(index)}
            >
              <Text
                style={[
                  timeframeStyles.buttonText,
                  selectedTimeFrame === index && timeframeStyles.buttonTextActive,
                ]}
              >
                {timeframe.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderNewsItem = ({ item, index }: { item: NewsArticle; index: number }) => {
    const hasImageError = failedImages.has(item.id);
    const hasValidImage = item.image && item.image.length > 10 && !hasImageError && !item.image.includes('stage');

    return (
      <Pressable
        onPress={() => Linking.openURL(item.url)}
        className="bg-white rounded-xl mb-3 overflow-hidden shadow-sm"
        style={{ elevation: 3 }}
      >
        {hasValidImage ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: 200 }}
            // placeholder={{ blurhash }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority="normal"
            onError={() => {
              setFailedImages(prev => new Set(prev).add(item.id));
            }}
          />
        ) : (
          <LinearGradient
            colors={getGradientColors(index)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: 200,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="analytics" size={64} color="white" style={{ opacity: 0.9 }} />
              <Text style={{
                color: 'white',
                marginTop: 16,
                fontFamily: "RubikBold",
                fontSize: 24,
                textAlign: 'center',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
                {symbol}
              </Text>
              <Text style={{
                color: 'white',
                marginTop: 8,
                fontFamily: "RubikMedium",
                fontSize: 14,
                opacity: 0.95,
                textAlign: 'center',
              }}>
                Stock Market News
              </Text>
            </View>
          </LinearGradient>
        )}

        <View className="p-4">
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 px-3 py-1.5 rounded-full">
              <Text className="text-blue-700 text-xs" style={{ fontFamily: "RubikBold" }}>
                {item.source}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs mx-2">•</Text>
            <Text className="text-gray-500 text-xs" style={{ fontFamily: "RubikRegular" }}>
              {formatNewsDate(item.datetime)}
            </Text>
          </View>

          <Text
            className="text-gray-900 text-base mb-2"
            style={{ fontFamily: "RubikBold", lineHeight: 22 }}
            numberOfLines={3}
          >
            {item.headline}
          </Text>

          {item.summary && item.summary.length > 0 && (
            <Text
              className="text-gray-600 text-sm mb-3"
              style={{ fontFamily: "RubikRegular", lineHeight: 20 }}
              numberOfLines={2}
            >
              {item.summary}
            </Text>
          )}

          <View className="flex-row items-center pt-2 border-t border-gray-100">
            <Ionicons name="open-outline" size={16} color="#3b82f6" />
            <Text className="text-blue-600 text-xs ml-2" style={{ fontFamily: "RubikMedium" }}>
              Read full article
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderTabBar = () => {
    return (
      <View className="flex-row bg-white border-b border-gray-200 rounded-t-xl overflow-hidden mt-2">
        {TABS.map((tab, index) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(index)}
            className={`flex-1 py-3 items-center ${activeTab === index
              ? "border-b-2 border-blue-600"
              : "border-b-2 border-transparent"
              }`}
          >
            <Text
              className={`${activeTab === index ? "text-blue-600" : "text-gray-600"
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
      <View className="bg-white rounded-b-xl p-4">
        {profile?.longBusinessSummary && (
          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "RubikBold" }}>
              About
            </Text>
            <Text className="text-gray-700" style={{ fontFamily: "RubikMedium" }}>
              {showFullSummary || profile.longBusinessSummary.length <= 250
                ? profile.longBusinessSummary
                : `${profile.longBusinessSummary.substring(0, 250)}...`}
            </Text>
            {profile.longBusinessSummary.length > 250 && (
              <Pressable onPress={() => setShowFullSummary(!showFullSummary)} className="mt-1">
                <Text className="text-blue-600 text-sm" style={{ fontFamily: "RubikMedium" }}>
                  {showFullSummary ? "Show Less" : "Show More"}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "RubikBold" }}>
            Company Info
          </Text>
          <View className="bg-gray-50 rounded-lg p-4">
            {profile?.sector && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Sector</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{profile.sector}</Text>
              </View>
            )}
            {profile?.industry && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Industry</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{profile.industry}</Text>
              </View>
            )}
            {profile?.fullTimeEmployees && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
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
            <Text className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "RubikBold" }}>
              Key Executives
            </Text>
            <View className="bg-gray-50 rounded-lg p-4">
              {profile.companyOfficers.slice(0, 5).map((officer: any, index: number) => (
                <View
                  key={index}
                  className={`py-2 ${index < Math.min(profile.companyOfficers.length, 5) - 1 ? "border-b border-gray-200" : ""
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
    if (isFinancialLoading) {
      return (
        <View className="bg-white rounded-b-xl py-8 items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-700 mt-2" style={{ fontFamily: "RubikMedium" }}>
            Loading financial data...
          </Text>
        </View>
      );
    }

    if (!financialData) {
      return (
        <View className="bg-white rounded-b-xl py-8 items-center">
          <Text className="text-gray-700 text-center" style={{ fontFamily: "RubikMedium" }}>
            No financial data available for {symbol}
          </Text>
        </View>
      );
    }

    const healthScore = calculateHealthScore(financialData.financialData);
    const healthInfo = getHealthScoreInfo(healthScore);
    const stats = financialData.keyStatistics;
    const finData = financialData.financialData;

    return (
      <View className="bg-white rounded-b-xl p-4">
        <View className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-100">
          <Text className="text-gray-900 text-lg mb-3" style={{ fontFamily: "RubikBold" }}>
            {healthInfo.emoji} Financial Health Score
          </Text>

          <View className="flex-row items-center mb-2">
            <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden mr-3">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${healthScore}%`,
                  backgroundColor: healthInfo.color
                }}
              />
            </View>
            <Text className="text-gray-900 text-2xl" style={{ fontFamily: "RubikBold" }}>
              {healthScore}
            </Text>
          </View>

          <Text className="text-gray-700" style={{ fontFamily: "RubikMedium" }}>
            {healthInfo.label} - {
              healthScore >= 80 ? "Strong fundamentals with healthy financials" :
                healthScore >= 60 ? "Good financial position with room for improvement" :
                  healthScore >= 40 ? "Average financial health, monitor closely" :
                    "Financial metrics need attention"
            }
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-gray-900 text-lg mb-3" style={{ fontFamily: "RubikBold" }}>
            📊 Key Metrics
          </Text>
          <View className="bg-gray-50 rounded-xl p-4">
            {stats?.marketCap && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Market Cap</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{formatLargeNumber(stats.marketCap)}</Text>
              </View>
            )}
            {stats?.trailingPE && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>P/E Ratio (TTM)</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{formatNumber(stats.trailingPE)}</Text>
              </View>
            )}
            {stats?.forwardPE && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Forward P/E</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{formatNumber(stats.forwardPE)}</Text>
              </View>
            )}
            {stats?.beta && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Beta</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{formatNumber(stats.beta, 3)}</Text>
              </View>
            )}
            {stats?.bookValue && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Book Value</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>${formatNumber(stats.bookValue)}</Text>
              </View>
            )}
            {stats?.fiftyTwoWeekHigh && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>52 Week High</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>${formatNumber(stats.fiftyTwoWeekHigh)}</Text>
              </View>
            )}
            {stats?.fiftyTwoWeekLow && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>52 Week Low</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>${formatNumber(stats.fiftyTwoWeekLow)}</Text>
              </View>
            )}
            {stats?.averageVolume && (
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Avg Volume</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{formatLargeNumber(stats.averageVolume)}</Text>
              </View>
            )}
            {stats?.sharesOutstanding && (
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Shares Outstanding</Text>
                <Text style={{ fontFamily: "RubikMedium" }}>{formatLargeNumber(stats.sharesOutstanding)}</Text>
              </View>
            )}
          </View>
        </View>

        {finData && (finData.totalRevenue || finData.grossProfits || finData.ebitda) && (
          <View className="mb-4">
            <Text className="text-gray-900 text-lg mb-3" style={{ fontFamily: "RubikBold" }}>
              💰 Financial Performance
            </Text>
            <View className="bg-gray-50 rounded-xl p-4">
              {finData.totalRevenue && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Total Revenue</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>{formatLargeNumber(finData.totalRevenue)}</Text>
                </View>
              )}
              {finData.grossProfits && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Gross Profit</Text>
                  <Text className="text-green-600" style={{ fontFamily: "RubikBold" }}>
                    {formatLargeNumber(finData.grossProfits)}
                  </Text>
                </View>
              )}
              {finData.ebitda && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>EBITDA</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>{formatLargeNumber(finData.ebitda)}</Text>
                </View>
              )}
              {finData.profitMargins && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Profit Margin</Text>
                  <Text className="text-green-600" style={{ fontFamily: "RubikBold" }}>
                    {formatPercentage(finData.profitMargins)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {finData && (finData.operatingCashflow || finData.freeCashflow) && (
          <View className="mb-4">
            <Text className="text-gray-900 text-lg mb-3" style={{ fontFamily: "RubikBold" }}>
              💵 Cash Flow
            </Text>
            <View className="bg-gray-50 rounded-xl p-4">
              {finData.totalCash && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Total Cash</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>{formatLargeNumber(finData.totalCash)}</Text>
                </View>
              )}
              {finData.operatingCashflow && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Operating Cash Flow</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>{formatLargeNumber(finData.operatingCashflow)}</Text>
                </View>
              )}
              {finData.freeCashflow && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Free Cash Flow</Text>
                  <Text className="text-green-600" style={{ fontFamily: "RubikBold" }}>
                    {formatLargeNumber(finData.freeCashflow)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {finData && (finData.currentRatio || finData.debtToEquity || finData.returnOnEquity) && (
          <View className="mb-4">
            <Text className="text-gray-900 text-lg mb-3" style={{ fontFamily: "RubikBold" }}>
              🔢 Financial Ratios
            </Text>
            <View className="bg-gray-50 rounded-xl p-4">
              {finData.currentRatio && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Current Ratio</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>{formatNumber(finData.currentRatio)}</Text>
                </View>
              )}
              {finData.debtToEquity !== undefined && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Debt-to-Equity</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>{formatNumber(finData.debtToEquity)}</Text>
                </View>
              )}
              {finData.returnOnAssets && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Return on Assets (ROA)</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>{formatPercentage(finData.returnOnAssets)}</Text>
                </View>
              )}
              {finData.returnOnEquity && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Return on Equity (ROE)</Text>
                  <Text className="text-green-600" style={{ fontFamily: "RubikBold" }}>
                    {formatPercentage(finData.returnOnEquity)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {finData && (finData.revenueGrowth || finData.earningsGrowth) && (
          <View className="mb-4">
            <Text className="text-gray-900 text-lg mb-3" style={{ fontFamily: "RubikBold" }}>
              🚀 Growth Metrics
            </Text>
            <View className="bg-gray-50 rounded-xl p-4">
              {finData.revenueGrowth !== undefined && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Revenue Growth (YoY)</Text>
                  <Text
                    className={finData.revenueGrowth > 0 ? "text-green-600" : "text-red-600"}
                    style={{ fontFamily: "RubikBold" }}
                  >
                    {formatPercentage(finData.revenueGrowth)}
                  </Text>
                </View>
              )}
              {finData.earningsGrowth !== undefined && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Earnings Growth (YoY)</Text>
                  <Text
                    className={finData.earningsGrowth > 0 ? "text-green-600" : "text-red-600"}
                    style={{ fontFamily: "RubikBold" }}
                  >
                    {formatPercentage(finData.earningsGrowth)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {finData && finData.targetMeanPrice && (
          <View className="mb-4">
            <Text className="text-gray-900 text-lg mb-3" style={{ fontFamily: "RubikBold" }}>
              🎯 Analyst Price Targets
            </Text>
            <View className="bg-gray-50 rounded-xl p-4">
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Target Price</Text>
                <Text className="text-blue-600" style={{ fontFamily: "RubikBold" }}>
                  ${formatNumber(finData.targetMeanPrice)}
                </Text>
              </View>
              {finData.targetHighPrice && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>High Target</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>${formatNumber(finData.targetHighPrice)}</Text>
                </View>
              )}
              {finData.targetLowPrice && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Low Target</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>${formatNumber(finData.targetLowPrice)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {stats && (stats.dividendYield || stats.dividendRate) && (
          <View className="mb-4">
            <Text className="text-gray-900 text-lg mb-3" style={{ fontFamily: "RubikBold" }}>
              💎 Dividend Information
            </Text>
            <View className="bg-gray-50 rounded-xl p-4">
              {stats.dividendRate && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Dividend Rate</Text>
                  <Text style={{ fontFamily: "RubikMedium" }}>${formatNumber(stats.dividendRate)}</Text>
                </View>
              )}
              {stats.dividendYield && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>Dividend Yield</Text>
                  <Text className="text-green-600" style={{ fontFamily: "RubikBold" }}>
                    {formatPercentage(stats.dividendYield)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
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

      <LinearGradient colors={["#00194b", "#0C0C0C"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="flex-1">
        <View className="pt-16 px-4 flex-row justify-between items-center">
          <Pressable className="mx-2 bg-white rounded-full p-1" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0284c7" />
          </Pressable>
          <Pressable className="mx-2 bg-white rounded-full p-1" onPress={handleWatchlistPress}>
            <Ionicons name={isWatched ? "star" : "star-outline"} size={24} color={isWatched ? "#fbbf24" : "#0284c7"} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 200 }}
        >
          <View className="px-4">
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
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text className="text-2xl font-bold text-white text-right">
                    {currencySymbol}{(() => {
                      if (liveData?.price && liveData.price > 0) return liveData.price.toFixed(2);
                      if (processedChartData.length > 0) {
                        const lastPrice = processedChartData[processedChartData.length - 1]?.value;
                        if (lastPrice && lastPrice > 0) return lastPrice.toFixed(2);
                      }
                      const quotePrice = quoteData?.body?.[0]?.regularMarketPrice;
                      return (quotePrice && quotePrice > 0) ? quotePrice.toFixed(2) : '0.00';
                    })()}
                  </Text>
                  <Text style={{
                    fontSize: 10,
                    color: '#9ca3af',
                    marginLeft: 4,
                    fontFamily: 'RubikMedium',
                  }}>
                    {currency}
                  </Text>
                </View>

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

                      return `${isPositive ? "+" : ""}${currencySymbol}${Math.abs(change).toFixed(2)} (${isPositive ? "+" : ""}${percentChange.toFixed(2)}%)`;
                    })()}
                  </Text>
                </View>
              </View>
            </View>

            {renderTimeframeSelector()}
            {renderChart()}
            {renderTabBar()}
          </View>

          <View className="px-4">
            {activeTab === 0 && renderOverview()}
            {activeTab === 1 && renderFinancialsTab()}
            {activeTab === 2 && (
              <View className="bg-white rounded-b-xl p-4">
                {isNewsLoading ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-gray-700 mt-2" style={{ fontFamily: "RubikMedium" }}>
                      Loading latest news...
                    </Text>
                  </View>
                ) : !newsData || newsData.length === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons name="newspaper-outline" size={48} color="#9ca3af" />
                    <Text className="text-gray-700 text-center mt-4" style={{ fontFamily: "RubikMedium" }}>
                      No recent news available for {symbol}
                    </Text>
                    <Pressable
                      onPress={() => refetchNews()}
                      className="bg-blue-600 rounded-lg px-6 py-3 mt-4"
                    >
                      <Text className="text-white" style={{ fontFamily: "RubikBold" }}>
                        Refresh News
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <Text className="text-gray-900 text-lg mb-4" style={{ fontFamily: "RubikBold" }}>
                      📰 Latest News for {symbol}
                    </Text>
                    {newsData.slice(0, 15).map((item, index) => (
                      <View key={item.id}>
                        {renderNewsItem({ item, index })}
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal visible={showBuyModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl mb-2" style={{ fontFamily: "RubikBold" }}>Buy {symbol}</Text>
            <Text className="text-gray-600 mb-4" style={{ fontFamily: "RubikMedium" }}>
              Current Price: {currencySymbol}{currentPrice.toFixed(2)}
            </Text>
            <Text className="text-gray-600 mb-4" style={{ fontFamily: "RubikMedium" }}>
              Available Cash: {currencySymbol}{virtualCash.toFixed(2)}
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

      <View
        className="absolute bottom-0 left-0 right-0 pb-6 pt-4 px-5"
        style={{ backgroundColor: '#00194b', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}
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
              // placeholder={{ blurhash }}
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

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    fontFamily: 'RubikBold',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'RubikMedium',
  },
  chartContainer: {
    marginVertical: 8,
  },
  ohlcContainer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ohlcRow: {
    alignItems: 'center',
  },
  ohlcLabel: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'RubikMedium',
    marginBottom: 4,
  },
  ohlcValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    fontFamily: 'RubikBold',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'RubikMedium',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'RubikMedium',
  },
});

const timeframeStyles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    minWidth: 60,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'RubikMedium',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
});

export default StockDetailsScreen;
