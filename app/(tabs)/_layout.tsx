import { Tabs } from 'expo-router';
import React from 'react';
import {Ionicons} from "@expo/vector-icons";
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "white",
        headerShown: false,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "#0C0C0C",
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Market",
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="stats-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="star" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="chatbubble-ellipses" color={color} />,
        }}
      />
    </Tabs>
  );
}
