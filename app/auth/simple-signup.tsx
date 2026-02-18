import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSimpleAuthStore } from '../store/simpleAuthStore';

const SimpleSignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useSimpleAuthStore();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert('Success! 🎉', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#00194b', '#0C0C0C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text style={{ color: 'white', fontSize: 36, marginBottom: 8, fontFamily: 'RubikBold' }}>
                Create Account
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontFamily: 'RubikRegular' }}>
                Simple & Secure
              </Text>
            </View>

            {/* Form Container */}
            <View style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: 16, 
              padding: 24 
            }}>
              {/* Email Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: 'white', marginBottom: 8, fontFamily: 'RubikMedium' }}>
                  Email Address
                </Text>
                <View style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  borderRadius: 12, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingHorizontal: 16 
                }}>
                  <Ionicons name="mail-outline" size={20} color="white" />
                  <TextInput
                    style={{ 
                      flex: 1, 
                      paddingVertical: 16, 
                      paddingHorizontal: 12, 
                      color: 'white',
                      fontFamily: 'RubikRegular'
                    }}
                    placeholder="your@email.com"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: 'white', marginBottom: 8, fontFamily: 'RubikMedium' }}>
                  Password
                </Text>
                <View style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  borderRadius: 12, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingHorizontal: 16 
                }}>
                  <Ionicons name="lock-closed-outline" size={20} color="white" />
                  <TextInput
                    style={{ 
                      flex: 1, 
                      paddingVertical: 16, 
                      paddingHorizontal: 12, 
                      color: 'white',
                      fontFamily: 'RubikRegular'
                    }}
                    placeholder="Enter password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="white"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: 'white', marginBottom: 8, fontFamily: 'RubikMedium' }}>
                  Confirm Password
                </Text>
                <View style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  borderRadius: 12, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingHorizontal: 16 
                }}>
                  <Ionicons name="lock-closed-outline" size={20} color="white" />
                  <TextInput
                    style={{ 
                      flex: 1, 
                      paddingVertical: 16, 
                      paddingHorizontal: 12, 
                      color: 'white',
                      fontFamily: 'RubikRegular'
                    }}
                    placeholder="Confirm password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              {/* Sign Up Button */}
              <Pressable
                onPress={handleSignUp}
                disabled={loading}
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontSize: 18, fontFamily: 'RubikBold' }}>
                    Create Account
                  </Text>
                )}
              </Pressable>

              {/* Sign In Link */}
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'RubikRegular' }}>
                  Already have an account?{' '}
                </Text>
                <Pressable onPress={() => router.push('../auth/simple-signin')}>
                  <Text style={{ color: '#60a5fa', fontFamily: 'RubikBold' }}>
                    Sign In
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Continue as Guest */}
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={{ marginTop: 24, alignItems: 'center' }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'RubikRegular' }}>
                Continue as Guest
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default SimpleSignUpScreen;
