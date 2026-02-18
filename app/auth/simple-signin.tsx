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

const SimpleSignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, verifyOTP, pendingVerification } = useSimpleAuthStore();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);
      
      if (result.needsOTP) {
        setShowOTP(true);
        Alert.alert(
          '2FA Required 🔐',
          'Check console for OTP code\n(In real app, check your email)'
        );
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const verified = await verifyOTP(otp);
      if (verified) {
        Alert.alert('Success! ✅', 'Login successful!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Error', 'Invalid OTP code');
      }
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
                {showOTP ? 'Enter OTP' : 'Welcome Back'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontFamily: 'RubikRegular' }}>
                {showOTP ? 'Check your email for code' : 'Sign in to continue'}
              </Text>
            </View>

            {/* Form Container */}
            <View style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: 16, 
              padding: 24 
            }}>
              {!showOTP ? (
                <>
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
                  <View style={{ marginBottom: 24 }}>
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

                  {/* Sign In Button */}
                  <Pressable
                    onPress={handleSignIn}
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
                        Sign In
                      </Text>
                    )}
                  </Pressable>

                  {/* Sign Up Link */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'RubikRegular' }}>
                      Don't have an account?{' '}
                    </Text>
                    <Pressable onPress={() => router.push('../auth/simple-signup')}>
                      <Text style={{ color: '#60a5fa', fontFamily: 'RubikBold' }}>
                        Sign Up
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  {/* OTP Input */}
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ 
                      color: 'white', 
                      marginBottom: 16, 
                      textAlign: 'center',
                      fontFamily: 'RubikMedium' 
                    }}>
                      Enter 6-digit code
                    </Text>
                    <TextInput
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        color: 'white',
                        textAlign: 'center',
                        fontSize: 24,
                        fontFamily: 'RubikBold',
                        letterSpacing: 8,
                      }}
                      placeholder="000000"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    
                    {pendingVerification && (
                      <View style={{ 
                        backgroundColor: 'rgba(234, 179, 8, 0.2)',
                        borderRadius: 12,
                        padding: 12,
                        marginTop: 16,
                      }}>
                        <Text style={{ 
                          color: '#fcd34d', 
                          textAlign: 'center',
                          fontFamily: 'RubikMedium'
                        }}>
                          📧 Demo: Your code is {pendingVerification.code}
                        </Text>
                        <Text style={{ 
                          color: 'rgba(252, 211, 77, 0.7)',
                          fontSize: 12,
                          textAlign: 'center',
                          marginTop: 4,
                          fontFamily: 'RubikRegular'
                        }}>
                          (In production, this would be sent to your email)
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Verify Button */}
                  <Pressable
                    onPress={handleVerifyOTP}
                    disabled={loading}
                    style={{
                      backgroundColor: '#3b82f6',
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={{ color: 'white', fontSize: 18, fontFamily: 'RubikBold' }}>
                        Verify & Sign In
                      </Text>
                    )}
                  </Pressable>

                  {/* Back Button */}
                  <Pressable
                    onPress={() => {
                      setShowOTP(false);
                      setOtp('');
                    }}
                    style={{ alignItems: 'center' }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'RubikRegular' }}>
                      Back to Sign In
                    </Text>
                  </Pressable>
                </>
              )}
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

export default SimpleSignInScreen;
