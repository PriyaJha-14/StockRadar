// app/auth/simple-signup.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

export default function SignUpScreen() {
  const { signUp } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('⚠️ Missing Fields', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('❌ Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('⚠️ Weak Password', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(
      email.trim().toLowerCase(),
      password,
      fullName.trim()
    );
    setIsLoading(false);

    if (error) {
      Alert.alert('❌ Sign Up Failed', error);
      return;
    }

    Alert.alert(
      '✅ Account Created!',
      'Welcome to StockRadar! Your account has been created and you have $100,000 virtual cash to start trading!',
      [{ text: 'Start Trading 🚀', onPress: () => router.replace('/(tabs)') }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <StatusBar barStyle="light-content" />
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
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              padding: 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              style={{
                position: 'absolute',
                top: 16,
                left: 0,
                padding: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={22} color="white" />
              <Text style={{ color: 'white', marginLeft: 4, fontFamily: 'RubikMedium' }}>
                Back
              </Text>
            </Pressable>

            {/* Logo & Title */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  backgroundColor: 'rgba(16,185,129,0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(16,185,129,0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Ionicons name="person-add" size={40} color="#34d399" />
              </View>
              <Text
                style={{
                  color: 'white',
                  fontSize: 28,
                  fontFamily: 'RubikBold',
                  marginBottom: 8,
                }}
              >
                Create Account
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 15,
                  fontFamily: 'RubikRegular',
                  textAlign: 'center',
                }}
              >
                Start with $100,000 virtual cash{'\n'}and trade like a pro 📈
              </Text>
            </View>

            {/* Form Card */}
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              {/* Full Name */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 13,
                    fontFamily: 'RubikMedium',
                    marginBottom: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  FULL NAME
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="words"
                    style={{
                      flex: 1,
                      color: 'white',
                      paddingVertical: 14,
                      paddingLeft: 12,
                      fontFamily: 'RubikRegular',
                      fontSize: 15,
                    }}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 13,
                    fontFamily: 'RubikMedium',
                    marginBottom: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  EMAIL ADDRESS
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      color: 'white',
                      paddingVertical: 14,
                      paddingLeft: 12,
                      fontFamily: 'RubikRegular',
                      fontSize: 15,
                    }}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 13,
                    fontFamily: 'RubikMedium',
                    marginBottom: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  PASSWORD
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.5)" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min 6 characters"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      color: 'white',
                      paddingVertical: 14,
                      paddingLeft: 12,
                      fontFamily: 'RubikRegular',
                      fontSize: 15,
                    }}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="rgba(255,255,255,0.5)"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 13,
                    fontFamily: 'RubikMedium',
                    marginBottom: 8,
                    letterSpacing: 0.5,
                  }}
                >
                  CONFIRM PASSWORD
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: confirmPassword && password !== confirmPassword
                      ? 'rgba(239,68,68,0.5)'
                      : 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={
                      confirmPassword && password !== confirmPassword
                        ? '#ef4444'
                        : 'rgba(255,255,255,0.5)'
                    }
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      color: 'white',
                      paddingVertical: 14,
                      paddingLeft: 12,
                      fontFamily: 'RubikRegular',
                      fontSize: 15,
                    }}
                  />
                  <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="rgba(255,255,255,0.5)"
                    />
                  </Pressable>
                </View>
                {confirmPassword && password !== confirmPassword && (
                  <Text
                    style={{
                      color: '#ef4444',
                      fontSize: 12,
                      fontFamily: 'RubikRegular',
                      marginTop: 4,
                      marginLeft: 4,
                    }}
                  >
                    Passwords do not match
                  </Text>
                )}
              </View>

              {/* Sign Up Button */}
              <Pressable
                onPress={handleSignUp}
                disabled={isLoading}
                style={{ borderRadius: 12, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="rocket-outline" size={20} color="white" />
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 16,
                          fontFamily: 'RubikBold',
                          marginLeft: 8,
                        }}
                      >
                        Create Account & Start Trading
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Sign In Link */}
            <View style={{ marginTop: 24 }}>
              <Pressable
                onPress={() => router.push('/auth/simple-signin')}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 15,
                    fontFamily: 'RubikMedium',
                  }}
                >
                  Already have an account?{' '}
                  <Text style={{ color: '#60a5fa', fontFamily: 'RubikBold' }}>
                    Sign In
                  </Text>
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <Text
              style={{
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
                marginTop: 16,
                fontSize: 12,
                fontFamily: 'RubikRegular',
              }}
            >
              🔒 Secured by Supabase • Data stored in cloud
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
