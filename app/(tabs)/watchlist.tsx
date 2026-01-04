import { formatStockForAi } from "@/utils/aiService";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef } from "react";
import { ActivityIndicator, Animated, FlatList, Pressable, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { fetchStockQuotes } from "../api/marketApi";
import { blurhash } from "../index";
import { useChatStore } from "../store/chatStore";
import { useWatchlistStore } from "../store/watchlistStore";

const WatchlistScreen = () => {
    const { stocks, removeStock } = useWatchlistStore();
    const { setContext } = useChatStore();
    const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

    const { data: quotes, isPending: isLoadingQuotes } = useQuery({
        queryKey: ["watchlist-quotes", stocks],
        queryFn: () => fetchStockQuotes(stocks),
        enabled: stocks.length > 0,
        refetchInterval: 30000,
        staleTime: 1000 * 60 * 1,
    });

    const handleAnalyzePortfolio = () => {
        console.log("Analyze Portfolio");
        // TODO: Navigate to AI chat with portfolio context
        // router.push("/(tabs)/ai-chat");
    };

    const handleAnalyzeStock = (symbol: string) => {
        const quote = quotes?.body?.find((q) => q.symbol === symbol);

        if (quote) {
            const stockContext = formatStockForAi(
                {
                    symbol,
                    lastsale: quote.regularMarketPrice.toString() || "0",
                    netchange: quote.regularMarketChange.toString() || "0",
                    pctchange: quote.regularMarketChangePercent.toFixed(2) + "%" || "0",
                    name: quote.longName,
                },
                undefined
            );

            setContext(stockContext);
            router.push(`/(tabs)/ai-chat`);
        }
    };

    const closeAllSwipeables = (exceptSymbol?: string) => {
        swipeableRefs.current.forEach((ref, symbol) => {
            if (symbol !== exceptSymbol && ref) {
                ref.close();
            }
        });
    };

    const handleDelete = (symbol: string) => {
        // Close the swipeable row
        swipeableRefs.current.get(symbol)?.close();
        
        // Remove from watchlist
        removeStock(symbol);
        
        // Clean up ref
        swipeableRefs.current.delete(symbol);
    };

    const renderRightActions = (symbol: string, dragX: Animated.AnimatedInterpolation<number>) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: "clamp",
        });

        return (
            <TouchableOpacity
                onPress={() => handleDelete(symbol)}
                className="bg-red-500 justify-center items-center px-6 rounded-lg mr-2"
            >
                <Animated.View style={{ transform: [{ scale }] }}>
                    <Ionicons name="trash" size={24} color="white" />
                    <Text className="text-white text-xs mt-1" style={{ fontFamily: "RubikSemiBold" }}>
                        Delete
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item: symbol }: { item: string }) => {
        const quote = quotes?.body?.find((q) => q.symbol === symbol);
        const change = quote?.regularMarketChange || 0;
        const isPositive = change >= 0;
        const isPreMarket = quote?.marketState === "PRE";
        const isPostMarket = quote?.marketState === "POST";

        const currentPrice = isPreMarket
            ? quote?.preMarketPrice
            : isPostMarket
            ? quote?.postMarketPrice
            : quote?.regularMarketPrice;

        const currentChange = isPreMarket
            ? quote?.preMarketChange
            : isPostMarket
            ? quote?.postMarketChange
            : quote?.regularMarketChange;

        const currentChangePercent = isPreMarket
            ? quote?.preMarketChangePercent
            : isPostMarket
            ? quote?.postMarketChangePercent
            : quote?.regularMarketChangePercent;

        return (
            <Swipeable
                ref={(ref) => {
                    if (ref) {
                        swipeableRefs.current.set(symbol, ref);
                    }
                }}
                renderRightActions={(_, dragX) => renderRightActions(symbol, dragX)}
                overshootRight={false}
                onSwipeableOpen={() => closeAllSwipeables(symbol)}
                friction={2}
                rightThreshold={40}
            >
                <Pressable
                    onPress={() => {
                        closeAllSwipeables();
                        router.push(`/stock/${symbol}`);
                    }}
                    className="mb-3 rounded-lg overflow-hidden"
                >
                    <View className="bg-white p-4 rounded-lg">
                        <View className="flex-row justify-between items-center">
                            <View className="flex-1">
                                <Text className="text-base" style={{ fontFamily: "RubikBold" }}>
                                    {symbol}
                                </Text>

                                <Text className="text-sm text-gray-600" style={{ fontFamily: "RubikMedium" }} numberOfLines={1}>
                                    {quote?.shortName || quote?.longName || symbol}
                                </Text>

                                {quote?.exchangeName && (
                                    <Text className="text-xs text-gray-400" style={{ fontFamily: "RubikRegular" }}>
                                        {quote.exchangeName}
                                    </Text>
                                )}
                            </View>

                            <View className="items-end">
                                <Text className="text-base" style={{ fontFamily: "RubikBold" }}>
                                    ${currentPrice?.toFixed(2) || "0.00"}
                                </Text>

                                <Text
                                    className={`text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}
                                    style={{ fontFamily: "RubikSemiBold" }}
                                >
                                    {isPositive ? "+" : ""}
                                    {currentChange?.toFixed(2) || "0.00"} (
                                    {isPositive ? "+" : ""}
                                    {currentChangePercent?.toFixed(2) || "0.00"}%)
                                </Text>

                                {(isPreMarket || isPostMarket) && (
                                    <Text className="text-xs text-gray-500" style={{ fontFamily: "RubikMedium" }}>
                                        {isPreMarket ? "Pre-Market" : "Post-Market"}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* AI Analysis Button */}
                        <View className="mt-3 pt-3 border-t border-gray-100">
                            <TouchableOpacity
                                onPress={() => handleAnalyzeStock(symbol)}
                                className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex-row items-center justify-center"
                            >
                                <View className="w-6 h-6 mr-2">
                                    <Image
                                        style={{
                                            flex: 1,
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: 12,
                                            backgroundColor: "white",
                                        }}
                                        source={require("../../assets/images/logo.png")}
                                        placeholder={{ blurhash }}
                                        contentFit="contain"
                                        transition={1000}
                                    />
                                </View>
                                <Text className="text-blue-600 text-sm" style={{ fontFamily: "RubikSemiBold" }}>
                                    Analyze Stock
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Swipeable>
        );
    };

    return (
        <View className="flex-1">
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={["#00194b", "#0C0C0C"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="h-full">
                <View className="h-full px-4 pt-16">
                    {stocks.length === 0 ? (
                        <View className="flex-1 items-center justify-center p-4">
                            <Text className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: "RubikBold" }}>
                                Your Watchlist is Empty
                            </Text>
                            <Text className="text-base text-center text-white/70" style={{ fontFamily: "RubikMedium" }}>
                                Add stocks to your watchlist to track their performance and get AI-powered insights
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-2xl font-bold text-white" style={{ fontFamily: "RubikBold" }}>
                                    Watchlist
                                </Text>
                                <Text className="text-white/70 text-lg" style={{ fontFamily: "RubikMedium" }}>
                                    {stocks.length} {stocks.length === 1 ? "Stock" : "Stocks"}
                                </Text>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{
                                    paddingBottom: 200,
                                }}
                            >
                                {/* AI Portfolio Analysis Card */}
                                <View className="mb-4 bg-white/10 rounded-xl p-4 border border-white/20">
                                    <Text className="text-white text-base mb-3" style={{ fontFamily: "RubikMedium" }}>
                                        Get comprehensive AI analysis of your entire watchlist including diversification, risk assessment, and market outlook.
                                    </Text>

                                    <TouchableOpacity
                                        onPress={handleAnalyzePortfolio}
                                        className="bg-purple-600 rounded-lg px-4 py-3 flex-row items-center justify-center"
                                    >
                                        <View className="w-8 h-8 mr-2">
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
                                        </View>

                                        <Text className="text-white text-base" style={{ fontFamily: "RubikSemiBold" }}>
                                            Analyze Portfolio with AI
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Loading State */}
                                {isLoadingQuotes && (
                                    <View className="py-8 items-center">
                                        <ActivityIndicator size="large" color="#ffffff" />
                                        <Text className="text-white mt-2" style={{ fontFamily: "RubikMedium" }}>
                                            Loading stock data...
                                        </Text>
                                    </View>
                                )}

                                {/* Stocks List */}
                                {!isLoadingQuotes && (
                                    <FlatList
                                        showsVerticalScrollIndicator={false}
                                        nestedScrollEnabled={true}
                                        scrollEnabled={false}
                                        data={stocks}
                                        renderItem={renderItem}
                                        keyExtractor={(item) => item}
                                        ListEmptyComponent={
                                            <View className="py-8 items-center">
                                                <Text className="text-white/70" style={{ fontFamily: "RubikMedium" }}>
                                                    No stocks in watchlist
                                                </Text>
                                            </View>
                                        }
                                    />
                                )}
                            </ScrollView>
                        </>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
};

export default WatchlistScreen;
