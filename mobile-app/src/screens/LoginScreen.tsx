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
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authApi } from '../services/api';
import { authStorage } from '../services/auth';
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
  const { theme, loadUserTheme } = useTheme();

  console.log('🔵 LoginScreen: State initialized');

  const styles = createStyles(theme.colors);

  console.log('🔵 LoginScreen: Styles created');

  // Configure Google Sign-In
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '578059352307-osnf9gtai7o1g9h40bp0f997e286uit0.apps.googleusercontent.com', // Web client ID for backend verification
      offlineAccess: false,
    });
    console.log('✅ Native Google Sign-In configured');
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

      console.log('📦 [LoginScreen] Auth response received:', {
        hasToken: !!authResponse.token,
        tokenLength: authResponse.token?.length,
        tokenPreview: authResponse.token?.substring(0, 20) + '...',
        hasUser: !!authResponse.user,
        userId: authResponse.user?.id
      });

      // Validate token before saving
      if (!authResponse.token || typeof authResponse.token !== 'string' || authResponse.token.length === 0) {
        throw new Error('Invalid token received from backend');
      }

      // Save token and user data
      await authStorage.saveToken(authResponse.token);
      await authStorage.saveUser(authResponse.user);

      // Verify token was saved
      const savedToken = await authStorage.getToken();
      console.log('✅ [LoginScreen] Token saved and verified:', savedToken ? savedToken.substring(0, 20) + '...' : 'NULL');

      // Load user's theme preference
      loadUserTheme(authResponse.user);

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

  console.log('🟢 LoginScreen: About to render JSX');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.login(email.trim(), password);

      // Save token and user data
      await authStorage.saveToken(response.token);
      await authStorage.saveUser(response.user);

      // Load user's theme preference
      loadUserTheme(response.user);

      // Navigate to main app and reset navigation stack
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Oysterette</Text>
            <Text style={styles.subtitle}>Welcome back!</Text>
          </View>

          <View style={styles.form}>
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
              placeholderTextColor={theme.colors.textSecondary}
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
              placeholderTextColor={theme.colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
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

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => navigation.navigate('OysterList')}
              disabled={loading}
            >
              <Text style={styles.skipText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
    },
    form: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 12,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
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
    registerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    registerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    registerLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    skipButton: {
      alignItems: 'center',
      marginTop: 15,
      paddingVertical: 10,
    },
    skipText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 10,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: colors.border,
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
