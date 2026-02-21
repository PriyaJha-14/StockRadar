// app/auth/simple-signin.tsx
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
import { usePortfolioStore } from '../store/portfolioStore';
import { useWatchlistStore } from '../store/watchlistStore';

export default function SignInScreen() {
  const { signIn } = useAuthStore();
  const { loadFromCloud } = usePortfolioStore();
  const { loadFromCloud: loadWatchlist } = useWatchlistStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('⚠️ Missing Fields', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (error) {
      Alert.alert('❌ Sign In Failed', error);
      return;
    }

    // ✅ Load user data from Supabase after login
    const { user } = useAuthStore.getState();
    if (user?.id) {
      await loadFromCloud(user.id);
      await loadWatchlist(user.id);
    }

    Alert.alert('✅ Welcome Back!', `Signed in as ${email}`, [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ]);
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
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  backgroundColor: 'rgba(59,130,246,0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(59,130,246,0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Ionicons name="trending-up" size={40} color="#60a5fa" />
              </View>
              <Text
                style={{
                  color: 'white',
                  fontSize: 28,
                  fontFamily: 'RubikBold',
                  marginBottom: 8,
                }}
              >
                Welcome Back
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 15,
                  fontFamily: 'RubikRegular',
                  textAlign: 'center',
                }}
              >
                Sign in to access your portfolio{'\n'}and watchlist
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
              {/* Email Input */}
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

              {/* Password Input */}
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
                    placeholder="Enter your password"
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

              {/* Sign In Button */}
              <Pressable
                onPress={handleSignIn}
                disabled={isLoading}
                style={{ borderRadius: 12, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
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
                      <Ionicons name="log-in-outline" size={20} color="white" />
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 16,
                          fontFamily: 'RubikBold',
                          marginLeft: 8,
                        }}
                      >
                        Sign In
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 24,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <Text
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  marginHorizontal: 12,
                  fontFamily: 'RubikRegular',
                }}
              >
                Don't have an account?
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </View>

            {/* Sign Up Link */}
            <Pressable
              onPress={() => router.push('/auth/simple-signup')}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(59,130,246,0.4)',
                paddingVertical: 14,
                alignItems: 'center',
                backgroundColor: 'rgba(59,130,246,0.1)',
              }}
            >
              <Text
                style={{
                  color: '#60a5fa',
                  fontSize: 15,
                  fontFamily: 'RubikBold',
                }}
              >
                Create New Account
              </Text>
            </Pressable>

            {/* Footer */}
            <Text
              style={{
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
                marginTop: 24,
                fontSize: 12,
                fontFamily: 'RubikRegular',
              }}
            >
              Your data is securely stored in the cloud ☁️
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
