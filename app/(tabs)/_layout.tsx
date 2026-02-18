// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { useSimpleAuthStore } from '../store/simpleAuthStore';
import { useWatchlistStore } from '../store/watchlistStore';

export default function TabLayout() {
  const { loadUsers, currentUser } = useSimpleAuthStore();
  
  // ✅ Load users on app start
  useEffect(() => {
    console.log('🚀 App started, loading users...');
    loadUsers();
  }, []);
  
  // ✅ Load user-specific data when user logs in
  useEffect(() => {
    if (currentUser) {
      console.log('👤 User logged in:', currentUser.email);
      console.log('📂 Loading user data...');
      
      // Load portfolio data
      const { holdings, virtualCash } = usePortfolioStore.getState();
      usePortfolioStore.setState({
        holdings: currentUser.portfolio || [],
        virtualCash: currentUser.virtualCash || 100000,
      });
      
      // Load watchlist data
      useWatchlistStore.setState({
        stocks: currentUser.watchlist || [],
      });
      
      // Load chat history
      useChatStore.setState({
        messages: currentUser.chatHistory || [],
      });
      
      console.log('✅ User data loaded successfully');
    } else {
      console.log('👤 No user logged in (Guest mode)');
    }
  }, [currentUser]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#0C0C0C",
          borderTopColor: "#1f2937",
          borderTopWidth: 1,
          height: 80, 
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: "RubikMedium",
          fontSize: 11,
          marginBottom: 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Market",
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
          tabBarIcon: ({ color }) => (
            <Ionicons name="star" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarIcon: ({ color }) => (
            <Ionicons name="briefcase" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
