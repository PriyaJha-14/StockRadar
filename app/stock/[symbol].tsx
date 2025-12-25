import { formatStockForAi } from "@/utils/aiService";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { blurhash } from "../../app/index";
import { fetchStockHistory, fetchStockModule, fetchStockQuotes } from "../api/marketApi";
import { useChatStore } from "../store/chatStore";
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

    

    const { setContext } = useChatStore();  // FIXED: SetContext → setContext (lowercase)

    const { addStock, removeStock, isInWatchlist } = useWatchlistStore();
    const isWatched = isInWatchlist(symbol);

    const { data: quoteData } = useQuery({
        queryKey: ["stockData", symbol],
        queryFn: () => fetchStockQuotes([symbol as string]),
        enabled: !!symbol,
    });

    // History Data
    const { data: historyData, isPending: isHistoryLoading } = useQuery({
        queryKey: ["stockHistory", symbol, timeFrames[selectedTimeFrame].interval],
        queryFn: () => fetchStockHistory(
            symbol as string,
            timeFrames[selectedTimeFrame].interval as any
        ),
        enabled: !!symbol,
    });

    // Profile Data  
    const { data: profileData, isPending: isProfileLoading } = useQuery({
        queryKey: ["stockModule", symbol, "all"],
        queryFn: () => fetchStockModule(
            symbol as string,
            "asset-profile"
        ),
        enabled: !!symbol,
    });

    const processedChartData = useMemo(() => {
        if (!historyData?.body) return [];

        return Object.entries(historyData.body).map(([timestamp, data]) => ({
            timestamp: parseInt(timestamp),
            date: new Date(parseInt(timestamp) * 1000),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            value: data.close,
            volume: data.volume,
        }));
    }, [historyData]);

    const priceChangeData = useMemo(() => {
        if (processedChartData.length === 0)
            return { change: 0, percentChange: 0, isPositive: false };

        const firstPrice = processedChartData[0]?.value || 0;
        const lastPrice = processedChartData[processedChartData.length - 1]?.value || 0;

        const change = lastPrice - firstPrice;
        const percentChange = ((change / firstPrice) * 100);

        return { change, percentChange, isPositive: change > 0 };
    }, [processedChartData]);

    const renderTabBar = () => {
        return (
            <View className="flex-row bg-white border-b border-gray-200">
                {TABS.map((tab, index) => (
                    <Pressable
                        key={tab}
                        onPress={() => setActiveTab(index)}
                        className={`flex-1 py-3 items-center ${activeTab === index ? "border-b-2 border-blue-600" : "border-b-2 border-transparent"}`}
                    >
                        <Text
                            className={`${activeTab === index ? "text-blue-600" : "text-gray-600"}`}
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
                {/* Company Description */}
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
                                <Text className="text-blue-400 text-sm">
                                    {showFullSummary ? "Show Less" : "Show More"}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}

                {/* Company Info */}
                <View className="mb-4">
                    <Text className="text-lg font-bold text-white mb-2" style={{ fontFamily: "RubikBold" }}>
                        Company Info
                    </Text>

                    <View className="bg-white rounded-lg p-4 shadow-sm">
                        {profile?.sector && (
                            <View className="flex-row justify-between py-2 border-b border-gray-100">
                                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>
                                    Sector
                                </Text>
                                <Text style={{ fontFamily: "RubikMedium" }}>
                                    {profile.sector}
                                </Text>
                            </View>
                        )}

                        {profile?.industry && (
                            <View className="flex-row justify-between py-2 border-b border-gray-100">
                                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>
                                    Industry
                                </Text>
                                <Text style={{ fontFamily: "RubikMedium" }}>
                                    {profile.industry}
                                </Text>
                            </View>
                        )}

                        {profile?.fullTimeEmployees && (
                            <View className="flex-row justify-between py-2 border-b border-gray-100">
                                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>
                                    Full Time Employees
                                </Text>
                                <Text style={{ fontFamily: "RubikMedium" }}>
                                    {profile.fullTimeEmployees.toLocaleString()}
                                </Text>
                            </View>
                        )}

                        {profile?.website && (
                            <View className="flex-row justify-between py-2">
                                <Text className="text-gray-600" style={{ fontFamily: "RubikBold" }}>
                                    Website
                                </Text>
                                <Text style={{ fontFamily: "RubikMedium" }} numberOfLines={1}>
                                    {profile.website.replace("https://", "").replace("http://", "")}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Company Officers */}
                {profile?.companyOfficers && profile.companyOfficers.length > 0 && (
                    <View className="mb-4">
                        <Text className="text-lg font-bold text-white mb-2" style={{ fontFamily: "RubikBold" }}>
                            Key Executives
                        </Text>

                        <View className="bg-white rounded-lg p-4 shadow-sm">
                            {profile.companyOfficers.map((officer: any, index: number) => (
                                <View
                                    key={index}
                                    className={`py-2 ${index < profile.companyOfficers.length - 1 ? "border-b border-gray-100" : ""}`}
                                >
                                    <Text className="font-bold" style={{ fontFamily: "RubikBold" }}>
                                        {officer.name}
                                    </Text>
                                    <Text className="text-gray-600 text-sm" style={{ fontFamily: "RubikMedium" }}>
                                        {officer.title}
                                    </Text>

                                    {officer.totalPay && (
                                        <Text
                                            className="text-gray-500"
                                            style={{ fontFamily: "RubikMedium" }}
                                        >
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
                    lastsale: processedChartData[processedChartData.length - 1]?.value.toString(),
                    netchange: priceChangeData.change.toString(),
                    pctchange: priceChangeData.percentChange.toFixed(2) + "%",
                    name: quoteData.body[0]?.longName,
                },
                profileData?.body
            );
            setContext(stockContext);  // FIXED: SetContext → setContext
            router.push("/(tabs)/ai-chat");  // Navigate to AI chat
        }
    };

    const handleWatchlistPress = () => {

        console.log("isWatched", isWatched);
        if (isWatched) {
            console.log("removeStock", symbol);
            removeStock(symbol)
        } else {
            console.log("addStock", symbol);
            addStock(symbol)
        }
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
                <View className="pt-16 px-4 flex-row justify-between items-center">
                    <Pressable
                        className="mx-2 bg-white rounded-full p-1"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#0284c7" />
                    </Pressable>

                    <Pressable className="mx-2 bg-white rounded-full p-1"
                        onPress={handleWatchlistPress}
                    >
                        <Ionicons
                            name={isWatched ? "star" : "star-outline"}
                            size={24}
                            color={isWatched ? "#fbbf24" : "#0284c7"}
                        />
                    </Pressable>
                </View>

                <View className="h-full px-4">
                    {/* Stock Price Header */}
                    <View className="flex-row items-center justify-between py-4">
                        <View>
                            <Text className="text-2xl text-white" style={{ fontFamily: "RubikBold" }}>
                                {symbol}
                            </Text>
                            {quoteData?.body?.[0]?.longName && (
                                <Text className="text-white/80 text-lg" style={{ fontFamily: "RubikMedium" }}>
                                    {quoteData.body[0]?.longName}
                                </Text>
                            )}
                        </View>

                        <View>
                            <Text className="text-2xl font-bold text-white text-right">
                                ${processedChartData.length > 0
                                    ? processedChartData[processedChartData.length - 1].value.toFixed(2)
                                    : "--"}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <Text
                                    className={`text-lg ${priceChangeData.isPositive ? "text-green-600" : "text-red-600"}`}
                                    style={{ fontFamily: "RubikBold" }}
                                >
                                    {priceChangeData.isPositive ? "+" : ""}
                                    {priceChangeData.change.toFixed(2)} (
                                    {priceChangeData.isPositive ? "+" : ""}
                                    {priceChangeData.percentChange.toFixed(2)}%)
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stock Body */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingBottom: 400,
                        }}
                    >
                        {renderTabBar()}
                        {activeTab === 0 && renderOverview()}
                        {activeTab === 1 && renderFinancialsTab()}
                    </ScrollView>
                </View>
            </LinearGradient>

            {/* Floating Bottom Bar */}
            <Pressable
                onPress={handleAskAi}
                className="absolute z-[99] bottom-6 w-[90%] h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg flex-row px-4"
                style={{ alignSelf: "center" }}
            >
                <View className="w-10 h-10 mr-2">
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

                <Text
                    style={{ fontFamily: "RubikMedium" }}
                    className="text-white text-lg"
                >
                    Ask Sage AI About {symbol}
                </Text>
            </Pressable>
        </View>
    );
};

export default StockDetailsScreen;
