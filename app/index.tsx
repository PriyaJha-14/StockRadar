import { ImageBackground } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

export default function WelcomeScreen() {
    return (
        <View className="flex-1">
            <StatusBar style="light" />

            <ImageBackground
            source={require("../assets/images/welcome-bg.png")}
            className="flex-1 justify-center items-center"
            resizeMode="cover" 
            >

            </ImageBackground>
            <Text>Hello World</Text>
        </View>
    );
}

