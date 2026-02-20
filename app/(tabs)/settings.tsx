// app/(tabs)/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSimpleAuthStore } from '../store/simpleAuthStore';

const SettingsScreen = () => {
  const { currentUser, signOut, loadUsers } = useSimpleAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    loadUsers();
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const notifications = await AsyncStorage.getItem('notifications_enabled');
      const darkMode = await AsyncStorage.getItem('dark_mode_enabled');
      if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
      if (darkMode !== null) setDarkModeEnabled(JSON.parse(darkMode));
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', JSON.stringify(value));
    Alert.alert(
      value ? 'Notifications Enabled 🔔' : 'Notifications Disabled 🔕',
      value
        ? 'You will receive price alerts and market updates.'
        : 'You will not receive any notifications.'
    );
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkModeEnabled(value);
    await AsyncStorage.setItem('dark_mode_enabled', JSON.stringify(value));
    // No Alert needed — UI instantly changes
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support 📧', 'How would you like to contact us?', [
      {
        text: 'Email',
        onPress: () =>
          Linking.openURL(
            'mailto:support@stockradar.com?subject=Support Request&body=Hi StockRadar Team,\n\n'
          ),
      },
      {
        text: 'WhatsApp',
        onPress: () =>
          Linking.openURL(
            'https://wa.me/919876543210?text=Hi, I need help with StockRadar'
          ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy 🔒',
      'StockRadar Privacy Policy\n\n' +
        '1. We collect minimal data\n' +
        '2. Your portfolio data is stored locally\n' +
        '3. We do not sell your data\n' +
        '4. Email is only used for authentication\n\n' +
        'Full policy available at:\nstockradar.com/privacy',
      [
        {
          text: 'Open Website',
          onPress: () => Linking.openURL('https://stockradar.com/privacy'),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service 📄',
      'StockRadar Terms of Service\n\n' +
        '1. This is a paper trading simulator\n' +
        '2. No real money is involved\n' +
        '3. Market data is for educational purposes\n' +
        '4. We are not financial advisors\n\n' +
        'Full terms available at:\nstockradar.com/terms',
      [
        {
          text: 'Open Website',
          onPress: () => Linking.openURL('https://stockradar.com/terms'),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert('Rate StockRadar ⭐', 'Enjoying StockRadar? Please rate us!', [
      {
        text: '⭐⭐⭐⭐⭐ Love it!',
        onPress: () =>
          Alert.alert('Thank you! 🎉', 'Your feedback means a lot to us!'),
      },
      {
        text: '⭐⭐⭐ Good',
        onPress: () => Alert.alert('Thanks!', "We'll keep improving!"),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleShareApp = () => {
    Alert.alert(
      'Share StockRadar 📤',
      'Share this amazing app with your friends!',
      [
        {
          text: 'Share via WhatsApp',
          onPress: () =>
            Linking.openURL(
              'https://wa.me/?text=Check out StockRadar - The best paper trading app! 📈'
            ),
        },
        {
          text: 'Copy Link',
          onPress: () =>
            Alert.alert('Link Copied! 📋', 'Share link copied to clipboard'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache? 🗑️',
      'This will clear temporary data but keep your account and portfolio.',
      [
        {
          text: 'Clear Cache',
          onPress: async () => {
            await AsyncStorage.removeItem('cache_stocks');
            await AsyncStorage.removeItem('cache_news');
            Alert.alert('Success!', 'Cache cleared successfully');
          },
          style: 'destructive',
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ✅ Dynamic gradient based on dark mode toggle
  const gradientColors = darkModeEnabled
    ? (['#0a0a0a', '#111827'] as const)
    : (['#00194b', '#0C0C0C'] as const);

  // ✅ Dynamic card background based on dark mode
  const cardStyle = darkModeEnabled
    ? { backgroundColor: '#1f2937' }
    : { backgroundColor: 'white' };

  const cardTextColor = darkModeEnabled ? '#f9fafb' : '#000000';
  const cardSubTextColor = darkModeEnabled ? '#9ca3af' : '#666666';
  const cardBorderColor = darkModeEnabled ? '#374151' : '#f3f4f6';

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          {/* Dark mode indicator badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Ionicons
              name={darkModeEnabled ? 'moon' : 'sunny'}
              size={14}
              color={darkModeEnabled ? '#a5b4fc' : '#fbbf24'}
            />
            <Text
              style={{
                color: darkModeEnabled ? '#a5b4fc' : '#fbbf24',
                fontSize: 12,
                fontFamily: 'RubikMedium',
                marginLeft: 4,
              }}
            >
              {darkModeEnabled ? 'Dark Mode On' : 'Light Mode'}
            </Text>
          </View>
        </View>

        {/* Account Security Section */}
        <View style={styles.section}>
          {currentUser ? (
            <View style={[styles.card, cardStyle]}>
              <Text style={[styles.sectionTitle, { color: cardTextColor }]}>
                🔐 Account Security
              </Text>

              <View
                style={[
                  styles.infoRow,
                  { borderBottomColor: cardBorderColor },
                ]}
              >
                <Text style={[styles.infoLabel, { color: cardTextColor }]}>
                  Email
                </Text>
                <Text
                  style={[styles.infoValue, { color: cardTextColor }]}
                  numberOfLines={1}
                >
                  {currentUser.email}
                </Text>
              </View>

              <View
                style={[
                  styles.twoFARow,
                  { borderBottomColor: cardBorderColor },
                ]}
              >
                <View style={styles.flex1}>
                  <Text style={[styles.twoFATitle, { color: cardTextColor }]}>
                    Email-Based 2FA
                  </Text>
                  <Text
                    style={[
                      styles.twoFASubtitle,
                      { color: cardSubTextColor },
                    ]}
                  >
                    {currentUser.is2FAEnabled
                      ? 'Enabled ✅'
                      : 'Protect your account'}
                  </Text>
                </View>
                {!currentUser.is2FAEnabled && (
                  <Pressable
                    onPress={() => router.push('/auth/simple-enable-2fa')}
                    style={styles.enableButton}
                  >
                    <Text style={styles.enableButtonText}>Enable</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={async () => {
                  Alert.alert(
                    'Sign Out?',
                    'Are you sure you want to sign out?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Sign Out',
                        onPress: async () => {
                          await signOut();
                          Alert.alert(
                            'Signed Out',
                            'You have been signed out successfully'
                          );
                        },
                        style: 'destructive',
                      },
                    ]
                  );
                }}
                style={styles.signOutButton}
              >
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => router.push('/auth/simple-signup')}>
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.secureAccountCard}
              >
                <Text style={styles.secureAccountTitle}>
                  🔐 Secure Your Account
                </Text>
                <Text style={styles.secureAccountText}>
                  • Simple email-based 2FA{'\n'}• No phone required{'\n'}• Free
                  & secure{'\n'}• Easy setup
                </Text>
                <View style={styles.createAccountButton}>
                  <Text style={styles.createAccountButtonText}>
                    Create Account
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          )}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={[styles.card, cardStyle]}>
            <View style={styles.cardHeader}>
              <Text
                style={[styles.cardHeaderTitle, { color: cardTextColor }]}
              >
                Preferences
              </Text>
            </View>

            {/* Notifications Toggle */}
            <Pressable
              style={[
                styles.preferenceRow,
                { borderBottomColor: cardBorderColor },
              ]}
            >
              <View style={styles.preferenceRowLeft}>
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: notificationsEnabled
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(156,163,175,0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      notificationsEnabled
                        ? 'notifications'
                        : 'notifications-off-outline'
                    }
                    size={20}
                    color={notificationsEnabled ? '#22c55e' : '#9ca3af'}
                  />
                </View>
                <View style={styles.preferenceRowText}>
                  <Text
                    style={[
                      styles.preferenceRowTitle,
                      { color: cardTextColor },
                    ]}
                  >
                    Push Notifications
                  </Text>
                  <Text
                    style={[
                      styles.preferenceRowSubtitle,
                      { color: cardSubTextColor },
                    ]}
                  >
                    {notificationsEnabled
                      ? 'Alerts enabled 🔔'
                      : 'Alerts muted 🔕'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#d1d5db', true: '#22c55e' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f3f4f6'}
              />
            </Pressable>

            {/* Dark Mode Toggle */}
            <View style={styles.preferenceRowLast}>
              <View style={styles.preferenceRowLeft}>
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: darkModeEnabled
                        ? 'rgba(99,102,241,0.15)'
                        : 'rgba(251,191,36,0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name={darkModeEnabled ? 'moon' : 'sunny-outline'}
                    size={20}
                    color={darkModeEnabled ? '#818cf8' : '#fbbf24'}
                  />
                </View>
                <View style={styles.preferenceRowText}>
                  <Text
                    style={[
                      styles.preferenceRowTitle,
                      { color: cardTextColor },
                    ]}
                  >
                    Dark Mode
                  </Text>
                  <Text
                    style={[
                      styles.preferenceRowSubtitle,
                      { color: cardSubTextColor },
                    ]}
                  >
                    {darkModeEnabled ? 'Enabled 🌙' : 'Disabled ☀️'}
                  </Text>
                </View>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor={darkModeEnabled ? '#a5b4fc' : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={[styles.card, cardStyle]}>
            <View style={styles.cardHeader}>
              <Text
                style={[styles.cardHeaderTitle, { color: cardTextColor }]}
              >
                About
              </Text>
            </View>

            {[
              {
                icon: 'star-outline',
                label: 'Rate StockRadar',
                color: '#fbbf24',
                onPress: handleRateApp,
              },
              {
                icon: 'share-social-outline',
                label: 'Share App',
                color: '#3b82f6',
                onPress: handleShareApp,
              },
              {
                icon: 'mail-outline',
                label: 'Contact Support',
                color: '#22c55e',
                onPress: handleContactSupport,
              },
              {
                icon: 'shield-outline',
                label: 'Privacy Policy',
                color: '#a78bfa',
                onPress: handlePrivacyPolicy,
              },
              {
                icon: 'document-text-outline',
                label: 'Terms of Service',
                color: '#60a5fa',
                onPress: handleTermsOfService,
              },
              {
                icon: 'trash-outline',
                label: 'Clear Cache',
                color: '#ef4444',
                onPress: handleClearCache,
                isLast: true,
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={[
                  item.isLast ? styles.menuRowLast : styles.menuRow,
                  { borderBottomColor: cardBorderColor },
                ]}
              >
                <View style={styles.menuRowLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.color}
                  />
                  <Text
                    style={[
                      styles.menuRowText,
                      {
                        color: item.isLast ? '#ef4444' : cardTextColor,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={cardSubTextColor}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.appInfoCard}>
            <Text style={styles.appInfoTitle}>StockRadar</Text>
            <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
            <Text style={styles.appInfoFooter}>
              Made with ❤️ for smart investors
            </Text>
            <Text style={styles.appInfoBuild}>
              Build: {Platform.OS === 'ios' ? 'iOS' : 'Android'} •{' '}
              {new Date().getFullYear()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'RubikBold',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontFamily: 'RubikBold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: { fontFamily: 'RubikMedium' },
  infoValue: { fontFamily: 'RubikRegular', maxWidth: '60%' },
  twoFARow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  flex1: { flex: 1 },
  twoFATitle: { fontFamily: 'RubikBold' },
  twoFASubtitle: {
    fontFamily: 'RubikRegular',
    fontSize: 12,
    marginTop: 2,
  },
  enableButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enableButtonText: {
    color: 'white',
    fontFamily: 'RubikBold',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  signOutButtonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'RubikBold',
  },
  secureAccountCard: {
    padding: 16,
    borderRadius: 12,
  },
  secureAccountTitle: {
    color: 'white',
    fontSize: 20,
    marginBottom: 8,
    fontFamily: 'RubikBold',
  },
  secureAccountText: {
    color: 'white',
    fontFamily: 'RubikRegular',
    lineHeight: 24,
  },
  createAccountButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  createAccountButtonText: {
    color: '#3b82f6',
    textAlign: 'center',
    fontFamily: 'RubikBold',
  },
  cardHeader: {
    paddingBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontFamily: 'RubikBold',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  preferenceRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  preferenceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceRowText: { flex: 1 },
  preferenceRowTitle: { fontFamily: 'RubikMedium' },
  preferenceRowSubtitle: {
    fontFamily: 'RubikRegular',
    fontSize: 12,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuRowText: {
    marginLeft: 12,
    fontFamily: 'RubikMedium',
  },
  appInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  appInfoTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'RubikBold',
  },
  appInfoVersion: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'RubikRegular',
  },
  appInfoFooter: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'RubikRegular',
  },
  appInfoBuild: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'RubikRegular',
  },
});

export default SettingsScreen;
