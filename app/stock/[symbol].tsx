import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { fetchStockHistory, fetchStockModule, fetchStockQuotes } from "../api/marketApi";


const timeFrames = [
    { label: "1D", interval: "5m", days: 1 },
    { label: "1W", interval: "15m", days: 7 },
    { label: "1M", interval: "1d", days: 30 },
    { label: "3M", interval: "1d", days: 90 },
    { lable: "1Y", interval: "1wk", days: 365 },
    { label: "All", interval: "1mo", days: 0 },
]

const TABS = ["Overview", "Financials"]

const StockDetailsScreen = () => {

    const { symbol } = useLocalSearchParams<{ symbol: string }>();

    const [activeTab, setActiveTab] = useState(0);

    const [showFullSummary, setShowFullSummary] = useState(false);

    const [selectedTimeFrame, setSelectedTimeFrame] = useState(0);

    const isWatched = false;

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
    })

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
    }, [historyData])

    const priceChangeData = useMemo(() => {
        if (processedChartData.length === 0)
            return { change: 0, percentChange: 0, isPositive: false }

        const firstPrice = processedChartData[0]?.value || 0;
        const lastPrice = processedChartData[processedChartData.length - 1]?.value || 0;

        const change = lastPrice - firstPrice;
        const percentChange = ((change / firstPrice) * 100)

        return { change, percentChange, isPositive: change > 0 }
    }, [processedChartData])

    const renderTabBar = () => {
        return (
            <View className="flex-row bg-white border-b border-gray-200">
                {TABS.map((tab, index) => (
                    <Pressable key={tab}
                        onPress={() => setActiveTab(index)}
                        className={`flex-1 py-3 items-center border-b-2 *: ${activeTab === index ? "border-b-2 border-blue-600" : "border-b-2 border-transparent"}`}
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
        )
    };

    const renderOverview = () => {
        if (isProfileLoading) {
            return (
                <View>
                    <ActivityIndicator size="large" color="white" />
                </View>
            )
        }

        const profile = profileData?.body;
        return (
            <View className="p-4">

                {/* Company Description */}

                {profile?.longBusinessSummary && (
                    <View className="mb-4">
                        <Text className="text-lg font-bold text-white">About</Text>

                        <Text className="text-white"
                            style={{ fontFamily: "RubikMedium" }}
                        >
                            {
                                showFullSummary || profile.longBusinessSummary.length <= 250 ? profile.longBusinessSummary : `${profile.longBusinessSummary.substring(0, 250)}...`
                            }

                        </Text>
                        {profile.longBusinessSummary.length > 250 && (
                            <Pressable onPress={() => setShowFullSummary(!showFullSummary)}
                            className="mt-1"
                            >
                                <Text className="text-blue-400 text-sm">
                                    {showFullSummary ? "Show Less" : "Show More"}
                                </Text>

                            </Pressable>
                        )}

                    </View>
                )}

            </View>
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
                <View className="pt-16 px-4 flex-row justify-between items-center">
                    <Pressable
                        className="mx-2 bg-white rounded-full p-1"
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#0284c7" />
                    </Pressable>


                    <Pressable
                        className="mx-2 bg-white rounded-full p-1"
                    // onPress={handleWatchlistPress}
                    >
                        <Ionicons name={isWatched ? "star" : "star-outline"} size={24} color={isWatched ? "#fbbf24" : "#0284c7"} />
                    </Pressable>

                </View>
                <View className="h-full px-4">

                    {/* Stock Price Header */}

                    <View className="flex-row items-center justify-between py-4">
                        <View>
                            <Text className="text-2xl text-white"
                                style={{ fontFamily: "RubikBold" }}
                            >
                                {symbol}
                            </Text>
                            {
                                quoteData?.body?.[0]?.longName && (
                                    <Text
                                        className="text-white/80 text-lg"
                                        style={{ fontFamily: "RubikMedium" }}
                                    >
                                        {quoteData.body[0]?.longName}
                                    </Text>
                                )
                            }
                        </View>

                        <View>
                            <View>
                                <Text className="text-2xl font-bold text-white">
                                    ${processedChartData.length > 0 ? processedChartData[processedChartData.length - 1].value.toFixed(2) : "--"}

                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <Text className={`text-lg ${priceChangeData.isPositive ? "text-green-600" : "text-red-600"
                                        }`}
                                        style={{ fontFamily: "RubikBold" }}

                                    >
                                        {priceChangeData.isPositive ? "+" : "-"}
                                        {priceChangeData.change.toFixed(2)}
                                        (
                                        {priceChangeData.isPositive ? "+" : "-"}
                                        {priceChangeData.percentChange.toFixed(2)}%
                                        )

                                    </Text>
                                </View>


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

        </View>
    );
};


export default StockDetailsScreen