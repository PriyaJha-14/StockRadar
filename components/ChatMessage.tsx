import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { blurhash } from "../app/index";
import TypingMarkdown from "./TypingMarkdown";

interface ChatMessageProps {
    message: any;
    onSuggestionPress?: (suggestion: string) => void;
    onTypingComplete: (messageId: string) => void;
}


export default function ChatMessage({
    message,
    onSuggestionPress,
    onTypingComplete,
}: ChatMessageProps) {

    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";

    const formatTime = (date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true })
    }

    return (


        <View className={`mb-4 ${isUser ? "Items-end" : "items-start"}`}>

            <View className="flex-row items-start max-w-[85%]">

                {
                    isAssistant && (
                        <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center mr-2 mt-1">

                            <Image
                                style={{
                                    flex: 1,
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 40,
                                    backgroundColor: "white",
                                }}
                                source={require("/../assets/images/logo.png")}
                                placeholder={{ blurhash }}
                                contentFit="contain"
                                transition={1000}
                            />

                        </View>
                    )
                }

                {/* Message Bubble */}

                <View className={`rounded-2xl px-4 py-3 ${isUser ? "bg-blue-600 rounded-br-md" : "bg-white border-gray-200 rounded-bl-md"}`
                }>


                    {/* Stock Context Badge */}

                    {
                        message.stockContext && (
                            <View className="mb-2 flex-row items-center">

                                <Ionicons name="trending-up" size={12} color={isUser ? "white" : "#6b7280"} />


                                <Text>

                                    {
                                        message.stockContext.symbol
                                    }
                                    -$

                                    {message.stockContext.currentPrice.toFixed(2)}
                                </Text>



                            </View>
                        )

                    }

                    {/* Message Content */}

                    {
                        isAssistant ? (
                            <TypingMarkdown

                                text={message.content}
                                isUser={isUser}
                                speed={250}
                                onComplete={() => onTypingComplete?.(message.id)}
                                isAlreadyCompleted={message.typingCompleted}
                            />
                        ) : (

                            <Markdown
                                style={{
                                    body: {
                                        color: isUser ? "white" : "#1f2937",
                                        fontFamily: "RubikRegular",
                                        fontSize: 14,
                                        lineHeight: 20,
                                        marginTop: 0,
                                        marginBottom: 0,
                                    },
                                    paragraph: {
                                        marginTop: 0,
                                        marginBottom: 0,
                                    },
                                    strong: {
                                        fontFamily: "RubikSemiBold",
                                        color: isUser ? "white" : "#1f2937",
                                    },
                                    em: {
                                        fontFamily: "RubikMedium",
                                        fontStyle: "italic",
                                    },
                                    code_inline: {
                                        paddingHorizontal: 4,
                                        backgroundColor: isUser ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
                                        paddingVertical: 4,
                                        borderRadius: 4,
                                        fontFamily: "RubikRegular",
                                        fontSize: 14,
                                    },
                                    code_block: {
                                        backgroundColor: isUser ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                                        padding: 8,
                                        borderRadius: 8,
                                        marginVertical: 4,
                                    },
                                }}

                            >

                                {message.content}

                            </Markdown>
                        )
                    }


                    { /* Timestamp */}


                    <Text
                        className={`text-xs mt-2 ${isUser ? "text-blue-100" : "text-gray-400"}`}
                        style={{ fontFamily: "RubikRegular" }}
                    >

                        {formatTime(message.timestamp)}

                    </Text>



                    { /* User Avatar */}

                    {
                        isUser && (
                            <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center ml-2 mt-1">

                                <Ionicons name="person" size={16} color="#6b7280" />

                            </View>

                        )
                    }







                </View>
            </View>

        </View>

    );
}