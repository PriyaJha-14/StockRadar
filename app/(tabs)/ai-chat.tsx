// app/(tabs)/ai-chat.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { blurhash } from "../index";
import { useChatStore } from "../store/chatStore";

export default function AiChatScreen() {
  const { currentContext, messages, sendMessage, isLoading, clearMessages, clearContext } = useChatStore();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState("");

  // Suggested questions
  const suggestedQuestions = [
    "What is P/E ratio?",
    "Explain market cap",
    "How to analyze stocks?",
  ];

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to delete all messages?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearMessages();
            clearContext();
          },
        },
      ]
    );
  };

  const handleSuggestionPress = (question: string) => {
    setInputText(question);
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 mb-6">
        <Image
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            borderRadius: 16,
            backgroundColor: "white",
          }}
          source={require("../../assets/images/logo.png")}
          placeholder={{ blurhash }}
          contentFit="contain"
          transition={1000}
        />
      </View>
      <Text
        className="text-white text-2xl text-center mb-3"
        style={{ fontFamily: "RubikBold" }}
      >
        Ask Sage AI
      </Text>
      <Text
        className="text-white/60 text-center text-base leading-6"
        style={{ fontFamily: "RubikRegular" }}
      >
        Get instant insights about stocks, market trends, and investment strategies.
      </Text>
    </View>
  );

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === "user";
    return (
      <View className={`mb-4 ${isUser ? "items-end" : "items-start"}`}>
        <View
          className={`max-w-[80%] p-4 rounded-2xl ${
            isUser ? "bg-blue-600" : "bg-white/10"
          }`}
        >
          <Text
            className="text-white text-sm leading-6"
            style={{ fontFamily: "RubikRegular" }}
          >
            {item.content}
          </Text>
        </View>
        <Text className="text-white/40 text-xs mt-1 mx-2" style={{ fontFamily: "RubikRegular" }}>
          {new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      const message = inputText.trim();
      setInputText("");

      await sendMessage(message);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#00194b", "#0C0C0C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="h-full"
      >
        {/* Header */}
        <View className="pt-16 pb-4 px-4 border-b border-white/10">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 mr-3">
                <Image
                  style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                    backgroundColor: "white",
                  }}
                  source={require("../../assets/images/logo.png")}
                  placeholder={{ blurhash }}
                  contentFit="contain"
                  transition={1000}
                />
              </View>

              <View>
                <Text
                  className="text-white text-xl"
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

            {/* Delete Button */}
            {messages.length > 0 && (
              <Pressable 
                onPress={handleClearChat}
                className="p-2 bg-white/10 rounded-full"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </Pressable>
            )}
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
              className="flex-1 px-4 pt-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 20,
              }}
            />
          )}
        </View>

        {/* Input Area + Suggestions */}
        <View className="px-4 pb-8 pt-2 border-t border-white/10">
          {/* Suggested Questions - Shows when no messages OR when input is empty */}
          {(messages.length === 0 || !inputText) && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mb-3"
            >
              {suggestedQuestions.map((question, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSuggestionPress(question)}
                  className="bg-white/10 rounded-full px-4 py-2 mr-2 border border-white/20"
                  disabled={isLoading}
                >
                  <Text 
                    className="text-white/80 text-sm" 
                    style={{ fontFamily: "RubikMedium" }}
                  >
                    {question}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Input Box */}
          <View className="bg-white/10 rounded-2xl flex-row items-center px-4 py-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                currentContext 
                  ? `Ask about ${currentContext.symbol}...` 
                  : "Ask about stocks..."
              }
              placeholderTextColor="#ffffff50"
              className="flex-1 text-white text-base py-2 max-h-24"
              style={{ fontFamily: "RubikRegular" }}
              multiline
              maxLength={500}
              editable={!isLoading}
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
                inputText.trim() && !isLoading ? "bg-blue-600" : "bg-white/20"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? "white" : "#ffffff50"}
                />
              )}
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
