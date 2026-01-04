import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { Alert, FlatList, Pressable, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import ChatInput from "../../components/ChatInput";
import ChatMessage from "../../components/ChatMessage";
import { blurhash } from "../index";
import { useChatStore } from "../store/chatStore";

export default function AiChatScreen() {
  const { currentContext, messages, sendMessage, markTypingCompleted, clearChat, isLoading } = useChatStore();
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  }





  const [inputText, setInputText] = useState("");

  const handleTypingComplete = (messageId: string) => {

    markTypingCompleted(messageId);
  }


  const renderMessage = ({ item }: { item: any }) => (
    <ChatMessage message={item} onTypingComplete={handleTypingComplete} />
  )



  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 mb-4">
        <Image
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            borderRadius: 12,
            backgroundColor: "white",
          }}
          source={require("../assets/images/logo.png")}
          placeholder={{ blurhash }}
          contentFit="contain"
          transition={1000}
        />
      </View>
      <Text
        className="text-white text-2xl text-center"
        style={{ fontFamily: "RubikBold" }}
      >
        Sage AI
      </Text>

      <Text className="text-white/70 text-center text-base mb-8 leading-6"
        style={{ fontFamily: "RubikRegular" }}
      >
        Ask me anything about stocks, market trends, or your investment portfolio. I'll provide educational insights to help you make informed decisions.
      </Text>

      <View className="bg-white/10 rounded-xl p-4 mb-6">

        <Text
          className="text-white text-sm mb-3"
        >
          Try Asking:

        </Text>

        <View className="space-y-2">

          <Text className="text-white/80 text-sm">
            * "Should I buy Apple Stock?"
          </Text>

          <Text className="text-white/80 text-sm">
            * "What's happening with tech stocks"
          </Text>

          <Text className="text-white/80 text-sm">
            * "Analyze My Portfolio"
          </Text>

          <Text className="text-white/80 text-sm">
            * "Explain the recent market movements"
          </Text>

        </View>



      </View>

      <View
        className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30"
      >
        <Text className="text-yellow-200 text-xs text-center"
          style={{ fontFamily: "RubikMedium" }}
        >
          Educational Pusposes Only. Not for financial advices.
        </Text>
      </View>
    </View>
  );

  const handleClearChat = () => {

    Alert.alert("Clear Chat", "Are you sure you want to clear all messages?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearChat },
    ])
  };

  //   const renderMessage = ({ item }: { item: any }) => {
  //     const isUser = item.role === "user";
  //     return (
  //       <View
  //         className={`mb-4 ${isUser ? "items-end" : "items-start"}`}
  //       >
  //         <View
  //           className={`max-w-[80%] p-3 rounded-2xl ${
  //             isUser ? "bg-blue-600" : "bg-white/10"
  //           }`}
  //         >
  //           <Text
  //             className="text-white"
  //             style={{ fontFamily: "RubikRegular" }}
  //           >
  //             {item.content}
  //           </Text>
  //         </View>
  //       </View>
  //     );
  //   };

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText("");
      // Scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
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
        <View className="flex-row items-center justify-between">

          {/* Header */}
          <View className="pt-16 pb-4 px-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 mr-2">
                <Image
                  style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                    backgroundColor: "white",
                  }}
                  source={require("../assets/images/logo.png")}
                  placeholder={{ blurhash }}
                  contentFit="contain"
                  transition={1000}
                />
              </View>

              <View>
                <Text
                  className="text-white text-lg"
                  style={{ fontFamily: "RubikBold" }}
                >
                  Sage AI
                </Text>
                {currentContext && (
                  <Text
                    className="text-white/70 text-sm"
                    style={{ fontFamily: "RubikMedium" }}
                  >
                    Analyzing {currentContext.symbol}
                  </Text>
                )}
              </View>
            </View>

            {
              messages.length > 0 && (
                <TouchableOpacity onPress={handleClearChat} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                  <Ionicons name="trash-outline" size={18} color="white" />

                </TouchableOpacity>
              )
            }
          </View>
        </View>



        {/* Messages */}
        <View className="flex-1">
          {messages.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 20,
              }}
            />
          )}
        </View>

        {/* Input Area */}
        <View className="px-4 pb-8 pt-2">
          <View className="bg-white/10 rounded-2xl flex-row items-center px-4 py-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about stocks..."
              placeholderTextColor="#ffffff70"
              className="flex-1 text-white text-base py-2"
              style={{ fontFamily: "RubikRegular" }}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim()}
              className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${inputText.trim() ? "bg-blue-600" : "bg-white/20"
                }`}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? "white" : "#ffffff50"}
              />
            </Pressable>
          </View>

          {/* Loading Indicator/Chat Bubble */}

          {
            isLoading && (
              <View className="px-4">

                {/* <TypingBubble /> */}
              </View>
            )
          }

          {/*Chat Input */}

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            currentStock={currentContext?.symbol}
          />
        </View>
      </LinearGradient>
    </View>
  );
}
