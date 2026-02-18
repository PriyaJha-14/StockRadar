// app/components/AuthGuard.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AuthGuardProps {
  feature: string;
  icon?: keyof typeof Ionicons.glyphMap;
  description?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  feature, 
  icon = 'lock-closed',
  description 
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={48} color="white" />
        </View>
        
        <Text style={styles.title}>
          🔒 Sign In Required
        </Text>
        
        <Text style={styles.description}>
          {description || `You need to sign in to use ${feature}`}
        </Text>

        <View style={styles.features}>
          <Text style={styles.featureItem}>✓ Save your data</Text>
          <Text style={styles.featureItem}>✓ Sync across devices</Text>
          <Text style={styles.featureItem}>✓ Secure with 2FA</Text>
          <Text style={styles.featureItem}>✓ Track all your trades</Text>
        </View>

        <Pressable
          onPress={() => router.push('/auth/simple-signup')}
          style={styles.signUpButton}
        >
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/auth/simple-signin')}
          style={styles.signInButton}
        >
          <Text style={styles.signInButtonText}>
            Already have an account? <Text style={styles.signInButtonTextBold}>Sign In</Text>
          </Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'RubikBold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'RubikRegular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  features: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 14,
    fontFamily: 'RubikMedium',
    color: 'white',
    marginBottom: 8,
  },
  signUpButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 12,
  },
  signUpButtonText: {
    fontSize: 16,
    fontFamily: 'RubikBold',
    color: '#3b82f6',
    textAlign: 'center',
  },
  signInButton: {
    paddingVertical: 12,
  },
  signInButtonText: {
    fontSize: 14,
    fontFamily: 'RubikRegular',
    color: 'rgba(255,255,255,0.9)',
  },
  signInButtonTextBold: {
    fontFamily: 'RubikBold',
    color: 'white',
  },
});
