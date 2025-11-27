import { Image } from 'expo-image';
import { Platform, StyleSheet, View, Text, StatusBar, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Carousel from "react-native-reanimated-carousel";
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { blurhash } from "../../app/index";
import { fetchMarketTickers } from '../api/marketApi';
import { useQuery } from '@tanstack/react-query';



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
                  <Text>{recentStocksData?.body.length}</Text>
                )
              }

            </View>

          </ScrollView>
        </View>

      </LinearGradient>



    </View>
  );
}


