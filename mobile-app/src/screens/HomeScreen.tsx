import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();

  const styles = createStyles(theme.colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Oysterette</Text>
        <Text style={styles.subtitle}>
          Discover, review, and track your favorite oysters
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('OysterList')}
        >
          <Text style={styles.buttonText}>Browse Oysters</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.topOystersButton]}
          onPress={() => navigation.navigate('TopOysters')}
        >
          <Text style={styles.buttonText}>🏆 Top Oysters</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Log In
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Explore oyster varieties from around the world with our 10-point
            attribute system. Create an account to add reviews and track your
            favorite oysters.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 40,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 25,
      marginBottom: 15,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    topOystersButton: {
      backgroundColor: colors.warning,
    },
    secondaryButton: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.primary,
      marginBottom: 30,
    },
    secondaryButtonText: {
      color: colors.primary,
    },
    infoContainer: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 10,
      marginTop: 20,
    },
    infoText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
