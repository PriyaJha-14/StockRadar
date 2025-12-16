import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StatusBar, Text, View } from "react-native";
import { fetchStockQuotes, fetchStockHistory } from "../api/marketApi";
import { useMemo } from "react";


const timeFrames =[
    {label: "1D", interval: "5m", days: 1},
    {label: "1W", interval: "15m", days: 7},
    {label: "1M", interval: "1d", days: 30},
    {label: "3M", interval: "1d", days: 90},
    {label: "6M", interval: "1d", days: 180},
    {lable: "1Y", interval: "1d", days: 365},
    {label: "5Y", interval: "1d", days: 1825},
    {label: "Max", interval: "1d", days: 3650}, //done till here  
]



const StockDetailsScreen = () => {

    const { symbol } = useLocalSearchParams<{ symbol: string }>();

    const isWatched = false;

    const { data: quoteData } = useQuery({
        queryKey: ["stockData", symbol],
        queryFn: () => fetchStockQuotes([symbol as string]),
        enabled: !!symbol,
    });


    // History Data

    const{ data: historyData, isPending: isHistoryPending } = useQuery({
        queryKey: ["stockHistory", symbol, timeFrames[selectedTimeFrame].interval],
        queryFn: () => fetchStockHistory(
            symbol as string,
            timeFrames[selectedTimeFrame].interval as any
        ),
        enabled: !!symbol,
    })

    const processedChangeData = useMemo(() => {
        if (!historyData?.body) return [];

        return Object.entries(history.body).map(([timestamp, data]) => ({
            timestamp: parseInt(timestamp),
            date: new Date(parseInt(timestamp) * 1000),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
        }));
    }, [historyData])

    const priceChangeData = useMemo(() => {
        if (processedChangeData.length === 0)
            return { change: 0, percentChange: 0, isPositive: false }

        const firstPrice = processedChangeData[0]?.value || 0;
        const lastPrice = processedChangeData[processedChangeData.length - 1]?.value || 0;

        const change = lastPrice - firstPrice;
        const percentChange = ((change / firstPrice) * 100)

        return { change, percentChange, isPositive: change > 0 }
    }, [processedChangeData])
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
                                <View className="flex-row items-center mt-1">
                                    <Text className={`text-lg ${priceChangeData.isPositive ? "text-green-600" : "text-red-600"
                                        }`}
                                        style={{ fontFamily: "RubikBold" }}

                                    >
                                        {priceChangeData.isPositive ? "+" : "-"}
                                        {priceChangeData.change.toFixed(2)}
                                        {
                                            { priceChangeData.isPositive ? "+" : "-" }
                                            {priceChangeData.percentChange.toFixed(2)}%
                                        }
                                    </Text>
                                </View>


                            </View>
                        </View>

                    </View>

                </View>


            </LinearGradient>

        </View>
    );
};


export default StockDetailsScreen