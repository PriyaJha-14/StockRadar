import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, StatusBar, View } from "react-native";
const StockDetailsScreen = () => {
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
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#0284c7" />
                    </Pressable>

                </View>
                <View className="h-full p-4 pt-16">

                </View>
 

            </LinearGradient>

        </View>
    );
};


export default StockDetailsScreen