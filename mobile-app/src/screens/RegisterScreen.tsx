/**
 * RegisterScreen
 *
 * Email/password registration and Google OAuth with comprehensive validation.
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
  HelperText,
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

const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  UPPERCASE_REGEX: /[A-Z]/,
  LOWERCASE_REGEX: /[a-z]/,
  NUMBER_REGEX: /[0-9]/,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// TYPES
// ============================================================================

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { paperTheme, loadUserTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
    if (__DEV__) {
      console.log('✅ [RegisterScreen] Google Sign-In configured');
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
        console.log('🔵 [RegisterScreen] Starting Google Sign-In');
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (__DEV__) {
        console.log('✅ [RegisterScreen] Google Sign-In successful:', userInfo.data?.user?.email);
      }

      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const authResponse = await authApi.googleAuth(idToken);

      await authStorage.saveToken(authResponse.token);
      await authStorage.saveUser(authResponse.user);

      loadUserTheme(authResponse.user);
      await favoritesStorage.syncWithBackend();

      if (__DEV__) {
        console.log('✅ [RegisterScreen] Authentication complete');
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'OysterList' }],
        })
      );
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [RegisterScreen] Google Sign-In error:', error);
      }

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        if (__DEV__) {
          console.log('ℹ️ [RegisterScreen] User cancelled Google Sign-In');
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

  const validateForm = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
      Alert.alert('Password Too Short', `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`);
      return false;
    }

    if (!PASSWORD_REQUIREMENTS.UPPERCASE_REGEX.test(password)) {
      Alert.alert(
        'Password Missing Uppercase',
        'Password must contain at least one uppercase letter (A-Z)'
      );
      return false;
    }

    if (!PASSWORD_REQUIREMENTS.LOWERCASE_REGEX.test(password)) {
      Alert.alert(
        'Password Missing Lowercase',
        'Password must contain at least one lowercase letter (a-z)'
      );
      return false;
    }

    if (!PASSWORD_REQUIREMENTS.NUMBER_REGEX.test(password)) {
      Alert.alert(
        'Password Missing Number',
        'Password must contain at least one number (0-9)'
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    return true;
  }, [name, email, password, confirmPassword]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (__DEV__) {
        console.log('📤 [RegisterScreen] Registration attempt:', {
          email: email.trim(),
          name: name.trim(),
          passwordLength: password.length,
        });
      }

      const response = await authApi.register(email.trim(), name.trim(), password);

      if (__DEV__) {
        console.log('✅ [RegisterScreen] Registration successful');
      }

      await authStorage.saveToken(response.token);
      await authStorage.saveUser(response.user);

      loadUserTheme(response.user);
      await favoritesStorage.syncWithBackend();

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'OysterList' }],
              })
            ),
        },
      ]);
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [RegisterScreen] Registration error:', error);
      }
      Alert.alert(
        'Registration Failed',
        error?.response?.data?.error || 'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [validateForm, email, name, password, loadUserTheme, navigation]);

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
              Create Account
            </Text>
            <Text variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant }}>
              Join Oysterette today!
            </Text>
          </View>

          <Card mode="elevated" style={styles.card}>
            <Card.Content>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="name"
                disabled={loading || googleLoading}
                left={<TextInput.Icon icon="account" />}
                style={styles.input}
              />

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

              <HelperText type="info" visible={true}>
                At least 8 characters, 1 uppercase, 1 lowercase, 1 number
              </HelperText>

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!confirmPasswordVisible}
                autoCapitalize="none"
                disabled={loading || googleLoading}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={confirmPasswordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  />
                }
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading || googleLoading}
                style={styles.registerButton}
                icon="account-plus"
              >
                Create Account
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

              <View style={styles.loginContainer}>
                <Text variant="bodyMedium">Already have an account? </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Login')}
                  disabled={loading || googleLoading}
                  compact
                  labelStyle={styles.loginButtonLabel}
                >
                  Log In
                </Button>
              </View>
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
    marginBottom: 8,
  },
  registerButton: {
    marginTop: 16,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonLabel: {
    marginHorizontal: 0,
  },
});
