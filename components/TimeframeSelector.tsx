// components/TimeframeSelector.tsx
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface TimeframeOption {
  label: string;
  interval: string;
  days: number;
}

interface TimeframeSelectorProps {
  timeframes: TimeframeOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function TimeframeSelector({
  timeframes,
  selectedIndex,
  onSelect,
}: TimeframeSelectorProps) {
  const handleSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {timeframes.map((timeframe, index) => (
          <Pressable
            key={timeframe.label}
            style={[
              styles.button,
              selectedIndex === index && styles.buttonActive,
            ]}
            onPress={() => handleSelect(index)}
          >
            <Text
              style={[
                styles.buttonText,
                selectedIndex === index && styles.buttonTextActive,
              ]}
            >
              {timeframe.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    minWidth: 60,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'RubikMedium',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
});
