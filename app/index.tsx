// app/index.tsx
import { View, Text, ImageBackground, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link } from "expo-router";

export default function WelcomeScreen() {
    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="light" />
            <ImageBackground
                source={require("../assets/images/welcome-bg.png")}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                resizeMode="cover"
            >
                <Text style={{ 
                    color: 'white', 
                    fontSize: 36, 
                    fontWeight: 'bold',
                    marginBottom: 30 
                }}>
                    StockRadar
                </Text>
                
                <Link href="/(tabs)" asChild>
                    <Pressable style={{
                        backgroundColor: '#3b82f6',
                        paddingVertical: 16,
                        paddingHorizontal: 48,
                        borderRadius: 30
                    }}>
                        <Text style={{ 
                            color: 'white', 
                            fontSize: 18,
                            fontWeight: '600' 
                        }}>
                            Get Started
                        </Text>
                    </Pressable>
                </Link>
            </ImageBackground>
        </View>
    );
}
