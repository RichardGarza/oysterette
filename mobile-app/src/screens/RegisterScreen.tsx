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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authApi } from '../services/api';
import { authStorage } from '../services/auth';
import api from '../services/api';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

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

      // Log what we're sending (for debugging)
      console.log('📤 Registration attempt:', {
        email: email.trim(),
        name: name.trim(),
        passwordLength: password.length,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
      });

      const response = await authApi.register(email.trim(), name.trim(), password);

      console.log('✅ Registration successful');

      // Save token and user data
      await authStorage.saveToken(response.token);
      await authStorage.saveUser(response.user);

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('OysterList'),
        },
      ]);
    } catch (error: any) {
      console.log('❌ Registration error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

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
              <TouchableOpacity
                onPress={() => setShowDebug(!showDebug)}
                style={{ marginTop: 10 }}
              >
                <Text style={{ fontSize: 12, color: '#999' }}>
                  {showDebug ? '🔍 Hide Debug' : '🔍 Show Debug'}
                </Text>
              </TouchableOpacity>
              {showDebug && (
                <View style={styles.debugBox}>
                  <Text style={styles.debugText}>
                    API: {api.defaults.baseURL}
                  </Text>
                  <Text style={styles.debugText}>
                    Platform: {Platform.OS}
                  </Text>
                  <Text style={styles.debugText}>
                    Check console logs for details
                  </Text>
                </View>
              )}
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
  debugBox: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
