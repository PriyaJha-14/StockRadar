// app/index.tsx
import { View, Text, ImageBackground, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link } from "expo-router";
import { Image } from "expo-image";

export default function WelcomeScreen() {
    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="light" />
            <ImageBackground
                source={require("../assets/images/welcome-bg.png")}
                style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80 }}
                resizeMode="cover"
            >
                {/* Dark overlay for better text contrast */}
                <View style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.5)' 
                }} />

                {/* Logo */}
                <View style={{ 
                    width: 120, 
                    height: 120, 
                    marginBottom: 24,
                    borderRadius: 60,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1
                }}>
                    <Image
                        source={require("../assets/images/logo.png")}
                        style={{ width: 100, height: 100 }}
                        contentFit="contain"
                    />
                </View>

                {/* App Title */}
                <Text style={{ 
                    color: 'white', 
                    fontSize: 48, 
                    fontWeight: 'bold',
                    marginBottom: 16,
                    zIndex: 1,
                    textAlign: 'center'
                }}>
                    StockRadar AI
                </Text>

                {/* Tagline */}
                <Text style={{ 
                    color: '#e0e0e0', 
                    fontSize: 18, 
                    fontWeight: '500',
                    marginBottom: 12,
                    zIndex: 1,
                    textAlign: 'center'
                }}>
                    Your Intelligent Stock Analysis Companion
                </Text>

                {/* Description */}
                <Text style={{ 
                    color: '#b0b0b0', 
                    fontSize: 14, 
                    marginBottom: 40,
                    zIndex: 1,
                    textAlign: 'center',
                    paddingHorizontal: 40,
                    lineHeight: 22
                }}>
                    Get real-time market data, AI-powered insights, and smart portfolio tracking—all in one place. Make informed decisions with confidence.
                </Text>

                {/* Get Started Button */}
                <Link href="/(tabs)" asChild>
                    <Pressable style={{
                        backgroundColor: '#3b82f6',
                        paddingVertical: 18,
                        paddingHorizontal: 60,
                        borderRadius: 30,
                        shadowColor: '#3b82f6',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.4,
                        shadowRadius: 16,
                        elevation: 8,
                        zIndex: 1
                    }}>
                        <Text style={{ 
                            color: 'white', 
                            fontSize: 18,
                            fontWeight: '700',
                            letterSpacing: 0.5
                        }}>
                            Get Started →
                        </Text>
                    </Pressable>
                </Link>
            </ImageBackground>
        </View>
    );
}
