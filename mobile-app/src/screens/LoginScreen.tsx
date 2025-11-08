/**
 * LoginScreen - Migrated to React Native Paper
 *
 * Authentication screen supporting email/password and Google OAuth sign-in.
 *
 * Features:
 * - Email/password login form with validation
 * - Native Google Sign-In integration (Android)
 * - Auto-redirect if already logged in
 * - Favorites sync after successful login
 * - Theme preference loading from user account
 * - KeyboardAvoidingView for iOS keyboard handling
 * - "Continue as Guest" option
 * - Link to Register screen
 * - Theme-aware styling via React Native Paper
 *
 * Material Design Components:
 * - Card: Form container with elevation
 * - TextInput: Email and password inputs with icons
 * - Button: Primary (contained) and secondary (outlined) buttons
 * - Divider: "OR" separator between auth methods
 * - Text: Typography with variants (headlineLarge, bodyMedium, etc.)
 * - ActivityIndicator: Built-in loading states in Button
 *
 * Migration Benefits:
 * - Built-in password visibility toggle (eye icon)
 * - Floating labels with smooth animations
 * - Automatic error states and helper text
 * - Better accessibility (labels, hints, error announcements)
 * - Consistent Material Design look
 * - Icons integrated into inputs
 * - Loading states handled by Button component
 *
 * Login Flow (Email/Password):
 * 1. Validates email and password not empty
 * 2. Calls authApi.login() with credentials
 * 3. Saves JWT token and user data to storage
 * 4. Loads user's theme preference (light/dark/system)
 * 5. Syncs favorites with backend
 * 6. Resets navigation stack to OysterList
 *
 * Google Sign-In Flow:
 * 1. Configures GoogleSignin with web client ID
 * 2. Checks Google Play Services availability
 * 3. Initiates native Google Sign-In UI
 * 4. Extracts ID token from sign-in result
 * 5. Sends ID token to backend for verification
 * 6. Backend verifies token with Google API
 * 7. Saves JWT token and user data to storage
 * 8. Loads theme and syncs favorites
 * 9. Resets navigation stack to OysterList
 */

import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  Divider,
} from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authApi } from '../services/api';
import { authStorage } from '../services/auth';
import { favoritesStorage } from '../services/favorites';
import { useTheme } from '../context/ThemeContext';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export default function LoginScreen() {
  console.log('🔵 LoginScreen: Component rendering START');

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { paperTheme, loadUserTheme } = useTheme();

  console.log('🔵 LoginScreen: State initialized');

  // Configure Google Sign-In
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '578059352307-osnf9gtai7o1g9h40bp0f997e286uit0.apps.googleusercontent.com',
      offlineAccess: false,
    });
    console.log('✅ Native Google Sign-In configured');
  }, []);

  // Redirect if already logged in
  React.useEffect(() => {
    const checkIfLoggedIn = async () => {
      const token = await authStorage.getToken();
      if (token) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'OysterList' }],
          })
        );
      }
    };
    checkIfLoggedIn();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      console.log('🔵 Starting native Google Sign-In...');

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful, user:', userInfo.data?.user?.email);

      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      console.log('🔵 Sending ID token to backend...');
      const authResponse = await authApi.googleAuth(idToken);

      console.log('📦 [LoginScreen] Auth response received:', {
        hasToken: !!authResponse.token,
        tokenLength: authResponse.token?.length,
        tokenPreview: authResponse.token?.substring(0, 20) + '...',
        hasUser: !!authResponse.user,
        userId: authResponse.user?.id
      });

      if (!authResponse.token || typeof authResponse.token !== 'string' || authResponse.token.length === 0) {
        throw new Error('Invalid token received from backend');
      }

      await authStorage.saveToken(authResponse.token);
      await authStorage.saveUser(authResponse.user);

      const savedToken = await authStorage.getToken();
      console.log('✅ [LoginScreen] Token saved and verified:', savedToken ? savedToken.substring(0, 20) + '...' : 'NULL');

      loadUserTheme(authResponse.user);
      await favoritesStorage.syncWithBackend();

      console.log('✅ Authentication complete, navigating to OysterList');

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'OysterList' }],
        })
      );
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google Sign-In');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign-In In Progress', 'Google Sign-In is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services Not Available',
          'Please install or update Google Play Services to use Google Sign-In'
        );
      } else {
        Alert.alert(
          'Google Sign-In Failed',
          error?.response?.data?.error || error.message || 'Failed to authenticate with Google'
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.login(email.trim(), password);

      await authStorage.saveToken(response.token);
      await authStorage.saveUser(response.user);

      loadUserTheme(response.user);
      await favoritesStorage.syncWithBackend();

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'OysterList' }],
        })
      );
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error?.response?.data?.error || 'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              Oysterette
            </Text>
            <Text variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant }}>
              Welcome back!
            </Text>
          </View>

          <Card mode="elevated" style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                disabled={loading || googleLoading}
                left={<TextInput.Icon icon="email" />}
                style={styles.input}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                disabled={loading || googleLoading}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  />
                }
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading || googleLoading}
                style={styles.loginButton}
                icon="login"
              >
                Log In
              </Button>

              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text variant="bodySmall" style={styles.dividerText}>
                  OR
                </Text>
                <Divider style={styles.divider} />
              </View>

              <Button
                mode="outlined"
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                disabled={loading || googleLoading}
                icon="google"
                style={styles.googleButton}
              >
                Continue with Google
              </Button>

              <View style={styles.registerContainer}>
                <Text variant="bodyMedium">Don't have an account? </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Register')}
                  disabled={loading || googleLoading}
                  compact
                  labelStyle={styles.registerButtonLabel}
                >
                  Sign Up
                </Button>
              </View>

              <Button
                mode="text"
                onPress={() => navigation.navigate('OysterList')}
                disabled={loading || googleLoading}
                style={styles.guestButton}
              >
                Continue as Guest
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontWeight: '500',
  },
  googleButton: {
    marginBottom: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonLabel: {
    marginHorizontal: 0,
  },
  guestButton: {
    marginTop: 8,
  },
});
