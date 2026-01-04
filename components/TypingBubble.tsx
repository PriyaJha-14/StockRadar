import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { blurhash } from "../app/index";


export default function TypingBubble() {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {

        const createAnimation = (animatedValue: Animated.Value, delay: number) => {


            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(animatedValue, {
                        toValue: 1,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),

                    Animated.timing(animatedValue, {
                        toValue: 0,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]));
        };

        const animation1 = createAnimation(dot1, 0);
        const animation2 = createAnimation(dot2, 200);
        const animation3 = createAnimation(dot3, 400);


        animation1.start();
        animation2.start();
        animation3.start();

        return () => {
            animation1.stop();
            animation2.stop();
            animation3.stop();
        }



    }, [dot1, dot2, dot3]);


    const getDotStyle = (animatedValue: Animated.Value) => ({
        opacity: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
        }),

        transform: [
            {
                scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                }),
            },
        ],
    });



    return (
        <View className="mb-4 items-start">

            <View className="flex-row items-start max-w-[85%]">

                {/* Avatar */}

                <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center mr-2 mt-1">
                    <Image
                        style={{
                            flex: 1,
                            width: "100%",
                            height: "100%",
                            borderRadius: 40,
                            backgroundColor: "white",
                        }}
                        source={require("../assets/images/logo.png")}
                        placeholder={{ blurhash }}
                        contentFit="contain"
                        transition={1000}




                    />

                </View>

                {/* Typing Bubble */}

                <View className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">

                    <View className="flex-row items-center space-x-1">

                        <Animated.View
                            style={[
                                {
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: "#6b7280",
                                    marginHorizontal: 2,
                                },
                                getDotStyle(dot1),
                            ]}

                        />

                        <Animated.View
                            style={[
                                {
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: "#6b7280",
                                    marginHorizontal: 2,
                                },
                                getDotStyle(dot2),
                            ]}

                        />

                        <Animated.View
                            style={[
                                {
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: "#6b7280",
                                    marginHorizontal: 2,
                                },
                                getDotStyle(dot3),
                            ]}

                        />

                    </View>

                </View>

            </View>

        </View>
    )
}