// app/auth/simple-enable-2fa.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSimpleAuthStore } from '../store/simpleAuthStore';

const SimpleEnable2FAScreen = () => {
  const [loading, setLoading] = useState(false);
  const { currentUser, enable2FA } = useSimpleAuthStore();

  const handleEnable = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    setLoading(true);
    try {
      await enable2FA(currentUser.email);
      Alert.alert(
        'Success! 🎉',
        'Email-based 2FA enabled! You will receive a code on your email for each login.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#00194b', '#0C0C0C']}
      className="flex-1"
    >
      <View className="flex-1 justify-center px-6">
        <Pressable
          onPress={() => router.back()}
          className="absolute top-16 left-6 bg-white/10 rounded-full p-2"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        <View className="items-center mb-8">
          <View className="bg-blue-600 rounded-full p-6 mb-4">
            <Ionicons name="shield-checkmark" size={64} color="white" />
          </View>
          <Text className="text-white text-3xl mb-2 text-center" style={{ fontFamily: 'RubikBold' }}>
            Enable 2-Step Verification
          </Text>
          <Text className="text-white/70 text-base text-center px-8" style={{ fontFamily: 'RubikRegular' }}>
            Add an extra layer of security with email-based verification
          </Text>
        </View>

        <View className="bg-white/10 rounded-2xl p-6 mb-6">
          <View className="flex-row items-start mb-4">
            <Ionicons name="mail" size={24} color="#60a5fa" />
            <View className="flex-1 ml-3">
              <Text className="text-white" style={{ fontFamily: 'RubikBold' }}>
                Email Verification
              </Text>
              <Text className="text-white/70 text-sm mt-1" style={{ fontFamily: 'RubikRegular' }}>
                You'll receive a 6-digit code to your email each time you sign in
              </Text>
            </View>
          </View>

          <View className="flex-row items-start mb-4">
            <Ionicons name="shield-checkmark" size={24} color="#22c55e" />
            <View className="flex-1 ml-3">
              <Text className="text-white" style={{ fontFamily: 'RubikBold' }}>
                Enhanced Security
              </Text>
              <Text className="text-white/70 text-sm mt-1" style={{ fontFamily: 'RubikRegular' }}>
                Protect your account from unauthorized access
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="flash" size={24} color="#f59e0b" />
            <View className="flex-1 ml-3">
              <Text className="text-white" style={{ fontFamily: 'RubikBold' }}>
                No Phone Required
              </Text>
              <Text className="text-white/70 text-sm mt-1" style={{ fontFamily: 'RubikRegular' }}>
                Simple email-based verification - no SMS fees
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleEnable}
          disabled={loading}
          className="bg-blue-600 rounded-xl py-4 items-center"
        >
          <Text className="text-white text-lg" style={{ fontFamily: 'RubikBold' }}>
            {loading ? 'Enabling...' : 'Enable 2FA'}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

export default SimpleEnable2FAScreen;
