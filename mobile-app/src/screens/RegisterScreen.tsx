/**
 * RegisterScreen - Migrated to React Native Paper
 *
 * User registration screen with email/password and Google OAuth options.
 *
 * Features:
 * - Email/password registration form with comprehensive validation
 * - Native Google Sign-In integration (Android)
 * - Auto-redirect if already logged in
 * - Favorites sync after successful registration
 * - Theme preference loading from new account
 * - KeyboardAvoidingView for iOS keyboard handling
 * - ScrollView for long forms
 * - Link to Login screen for existing users
 * - Theme-aware styling via React Native Paper
 *
 * Material Design Components:
 * - Card: Form container with elevation
 * - TextInput: All form inputs with icons and floating labels
 * - Button: Primary (contained) and secondary (outlined) buttons
 * - Divider: "OR" separator between auth methods
 * - Text: Typography with variants (headlineLarge, bodyMedium, etc.)
 * - HelperText: Password requirements hint
 *
 * Migration Benefits:
 * - Built-in password visibility toggles for both password fields
 * - Floating labels with smooth animations
 * - Helper text for password requirements (Material Design pattern)
 * - Icons for all inputs (account, email, lock)
 * - Automatic error states
 * - Better accessibility
 * - Consistent Material Design look
 *
 * Password Requirements (enforced by backend, validated in frontend):
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
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

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

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

  // Configure Google Sign-In
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '578059352307-osnf9gtai7o1g9h40bp0f997e286uit0.apps.googleusercontent.com',
      offlineAccess: false,
    });
    console.log('✅ Native Google Sign-In configured in RegisterScreen');
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

      await authStorage.saveToken(authResponse.token);
      await authStorage.saveUser(authResponse.user);

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

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Password Too Short', 'Password must be at least 8 characters long');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert(
        'Password Missing Uppercase',
        'Password must contain at least one uppercase letter (A-Z)'
      );
      return false;
    }

    if (!/[a-z]/.test(password)) {
      Alert.alert(
        'Password Missing Lowercase',
        'Password must contain at least one lowercase letter (a-z)'
      );
      return false;
    }

    if (!/[0-9]/.test(password)) {
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
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      console.log('📤 Registration attempt:', {
        email: email.trim(),
        name: name.trim(),
        passwordLength: password.length,
      });

      const response = await authApi.register(email.trim(), name.trim(), password);

      console.log('✅ Registration successful');

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
      console.error('❌ Registration error:', error);

      const errorData = error?.response?.data;

      if (errorData?.details && Array.isArray(errorData.details)) {
        const errorMessages = errorData.details
          .map((detail: any) => {
            const field = detail.field || 'Unknown';
            const message = detail.message || 'Invalid';
            return `• ${field}: ${message}`;
          })
          .join('\n');

        Alert.alert('Registration Error', `Please fix the following:\n\n${errorMessages}`);
      } else if (errorData?.error) {
        Alert.alert('Registration Failed', errorData.error);
      } else {
        const statusCode = error?.response?.status || 'Unknown';
        Alert.alert(
          'Registration Failed',
          `Failed to create account.\n\nError code: ${statusCode}\n\nPlease check your internet connection and try again.`
        );
      }
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
              Create Account
            </Text>
            <Text variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant }}>
              Join Oysterette today
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
                Must be 8+ characters with uppercase, lowercase, and a number
              </HelperText>

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!confirmPasswordVisible}
                autoCapitalize="none"
                disabled={loading || googleLoading}
                left={<TextInput.Icon icon="lock-check" />}
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
                style={styles.signUpButton}
                icon="account-plus"
              >
                Sign Up
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
  signUpButton: {
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
