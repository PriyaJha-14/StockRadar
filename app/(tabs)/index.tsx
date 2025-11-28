import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Carousel from "react-native-reanimated-carousel";
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

export default function HomeScreen() {
  const { data: recentStocksData, isPending: isLoadindRecentStocks } = useQuery({
    queryKey: ["recentStocks"],
    queryFn: () => fetchMarketTickers(1, "STOCKS"),
  })

  return (
    <View className="flex-1" >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#00194b", "#0C0C0C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="h-full"
      >
        <View className="h-full p-4 pt-16">
          {/* Header */}
          <View className="flex-row justofy-between items-center">
            <View className="w-1/2">
              <Text className="text-white text-lg"
                style={{ fontFamily: "Rubikmedium" }}
              >
                Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}
              </Text>
              <Text className="text-white text-2xl font-bold"
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
              paddingBottom: 200,
            }}

          >
            {/*Stocks Section */}
            <View className="mt-4 p-4 rounded-2xl bg-blue-900/10 border border-white overflow-hidden">

              <Text
                className="text-white text-lg mb-2"
                style={{ fontFamily: "RubikBold" }}


              >Stocks</Text>
              {
                isLoadindRecentStocks ? (
                  <View className="h-24 justify-center items-center">
                    <ActivityIndicator
                      size="small" color="white"
                    />
                  </View>
                ) : (
                  <Carousel
                    loop={false}
                    width={width - 32}
                    height={100}
                    data={chunkArray(recentStocksData?.body || [], 6)}
                    scrollAnimationDuration={1000}
                    renderItem={({ item: chunk }) => (
                      <View className="flex-row flex-wrap">{chunk.map((stock: any) => {
                        const isPositive = !stock.netchange.startsWith("-");
                        return (
                          <View key={stock.symbol}>
                            <TouchableOpacity
                              onPress={() => router.push(`/stock/${stock.symbol}`)}
                            >
                              <View className="flex-row items-center">

                                <View className="w-10 h-10 rounded-full bg-white20 items-center justify-center mr-2">
                                  <Text className="text-white text-lg">
                                    {stock.symbol.charAt(0)}
                                  </Text>
                                </View>

                              </View>

                            </TouchableOpacity>

                          </View>
                        )
                      })}</View>
                    )}




                  />
                )}


            </View>

          </ScrollView>
        </View>

      </LinearGradient>



    </View>
  );
}


