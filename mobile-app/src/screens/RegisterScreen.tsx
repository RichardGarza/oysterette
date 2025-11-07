/**
 * RegisterScreen
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
 * - Theme-aware styling
 *
 * Registration Flow (Email/Password):
 * 1. Validates form fields:
 *    - Name not empty
 *    - Email valid format (regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
 *    - Password min 8 chars
 *    - Password contains uppercase letter
 *    - Password contains lowercase letter
 *    - Password contains number
 *    - Passwords match (password === confirmPassword)
 * 2. Calls authApi.register() with credentials
 * 3. Saves JWT token and user data to storage
 * 4. Loads user's theme preference (light/dark/system)
 * 5. Syncs favorites with backend
 * 6. Shows success alert
 * 7. Resets navigation stack to OysterList
 *
 * Google Sign-In Flow:
 * 1. Configures GoogleSignin with web client ID
 * 2. Checks Google Play Services availability
 * 3. Initiates native Google Sign-In UI
 * 4. Extracts ID token from sign-in result
 * 5. Sends ID token to backend for verification
 * 6. Backend verifies token with Google API and creates/finds user
 * 7. Saves JWT token and user data to storage
 * 8. Loads theme and syncs favorites
 * 9. Resets navigation stack to OysterList
 *
 * Password Requirements (enforced by backend, validated in frontend):
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 *
 * Validation Alerts:
 * - Shows specific error message for each validation failure
 * - Examples: "Password Too Short", "Password Missing Uppercase", etc.
 * - Backend validation errors parsed from Zod and displayed
 * - Handles duplicate email errors gracefully
 *
 * Error Handling:
 * - Backend validation errors: Parses Zod details array and formats as bullets
 * - Backend error message: Shows specific error (e.g., "Email already exists")
 * - Generic errors: Shows status code and suggests checking connection
 * - Google Sign-In: Same error handling as LoginScreen
 *
 * Auto-Redirect:
 * - useEffect checks for existing token on mount
 * - If token exists, resets navigation to OysterList
 * - Prevents duplicate registration for authenticated users
 *
 * Navigation:
 * - Uses CommonActions.reset() to clear navigation history
 * - Prevents back button from returning to register after signup
 * - Login link navigates to LoginScreen
 *
 * State:
 * - name, email, password, confirmPassword: Form input values
 * - loading: Email/password registration in progress
 * - googleLoading: Google Sign-In in progress
 * - Both disabled during either loading state
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
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
  const { theme, loadUserTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Configure Google Sign-In
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '578059352307-osnf9gtai7o1g9h40bp0f997e286uit0.apps.googleusercontent.com', // Web client ID for backend verification
      offlineAccess: false,
    });
    console.log('✅ Native Google Sign-In configured in RegisterScreen');
  }, []);

  // Redirect if already logged in
  React.useEffect(() => {
    const checkIfLoggedIn = async () => {
      const token = await authStorage.getToken();
      if (token) {
        // User is already logged in, redirect to OysterList
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

      // Check if Google Play services are available
      await GoogleSignin.hasPlayServices();

      // Sign in and get user info with ID token
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Google Sign-In successful, user:', userInfo.data?.user?.email);

      // Get the ID token
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      console.log('🔵 Sending ID token to backend...');

      // Send ID token to backend for verification
      const authResponse = await authApi.googleAuth(idToken);

      // Save token and user data
      await authStorage.saveToken(authResponse.token);
      await authStorage.saveUser(authResponse.user);

      // Load user's theme preference
      loadUserTheme(authResponse.user);

      // Sync favorites with backend
      await favoritesStorage.syncWithBackend();

      console.log('✅ Authentication complete, navigating to OysterList');

      // Navigate to main app and reset navigation stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'OysterList' }],
        })
      );
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in, no alert needed
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    // Password validation matching backend requirements
    if (password.length < 8) {
      Alert.alert(
        'Password Too Short',
        'Password must be at least 8 characters long'
      );
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

      // Save token and user data
      await authStorage.saveToken(response.token);
      await authStorage.saveUser(response.user);

      // Load user's theme preference
      loadUserTheme(response.user);

      // Sync favorites with backend
      await favoritesStorage.syncWithBackend();

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'OysterList' }],
            })
          ),
        },
      ]);
    } catch (error: any) {
      console.error('❌ Registration error:', error);

      // Parse validation errors from backend
      const errorData = error?.response?.data;

      if (errorData?.details && Array.isArray(errorData.details)) {
        // Show specific validation errors from Zod
        const errorMessages = errorData.details
          .map((detail: any) => {
            const field = detail.field || 'Unknown';
            const message = detail.message || 'Invalid';
            return `• ${field}: ${message}`;
          })
          .join('\n');

        Alert.alert(
          'Registration Error',
          `Please fix the following:\n\n${errorMessages}`
        );
      } else if (errorData?.error) {
        // Show specific error message from backend
        Alert.alert(
          'Registration Failed',
          errorData.error
        );
      } else {
        // Show generic error with status code
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join Oysterette today</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
              <Text style={styles.passwordHint}>
                Must be 8+ characters with uppercase, lowercase, and a number
              </Text>

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              {/* Google Sign-In - Native Implementation */}
              <>
                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign-In Button */}
                <TouchableOpacity
                  style={[styles.googleButton, (googleLoading || loading) && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <ActivityIndicator color="#555" />
                  ) : (
                    <>
                      <Text style={styles.googleIcon}>G</Text>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  disabled={loading}
                >
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#555',
  },
  loginLink: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  passwordHint: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    marginLeft: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
});
