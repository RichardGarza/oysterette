/**
 * LoginScreen
 *
 * Email/password and Google OAuth authentication with auto-redirect.
 */

import React, { useState, useCallback } from 'react';
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

// ============================================================================
// CONSTANTS
// ============================================================================

const GOOGLE_WEB_CLIENT_ID = '578059352307-osnf9gtai7o1g9h40bp0f997e286uit0.apps.googleusercontent.com';

// ============================================================================
// TYPES
// ============================================================================

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function LoginScreen() {
  if (__DEV__) {
    console.log('🔵 [LoginScreen] Component rendering');
  }

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { paperTheme, loadUserTheme } = useTheme();

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
    if (__DEV__) {
      console.log('✅ [LoginScreen] Google Sign-In configured');
    }
  }, []);

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
  }, [navigation]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setGoogleLoading(true);
      if (__DEV__) {
        console.log('🔵 [LoginScreen] Starting Google Sign-In');
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (__DEV__) {
        console.log('✅ [LoginScreen] Google Sign-In successful:', userInfo.data?.user?.email);
      }

      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const authResponse = await authApi.googleAuth(idToken);

      if (__DEV__) {
        console.log('📦 [LoginScreen] Auth response received:', {
          hasToken: !!authResponse.token,
          hasUser: !!authResponse.user,
          userId: authResponse.user?.id
        });
      }

      if (!authResponse.token || typeof authResponse.token !== 'string' || authResponse.token.length === 0) {
        throw new Error('Invalid token received from backend');
      }

      await authStorage.saveToken(authResponse.token);
      await authStorage.saveUser(authResponse.user);

      loadUserTheme(authResponse.user);
      await favoritesStorage.syncWithBackend();

      if (__DEV__) {
        console.log('✅ [LoginScreen] Authentication complete');
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'OysterList' }],
        })
      );
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [LoginScreen] Google Sign-In error:', error);
      }

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        if (__DEV__) {
          console.log('ℹ️ [LoginScreen] User cancelled Google Sign-In');
        }
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
  }, [loadUserTheme, navigation]);

  const handleLogin = useCallback(async () => {
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
  }, [email, password, loadUserTheme, navigation]);

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
