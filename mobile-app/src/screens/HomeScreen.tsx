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

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#3498db',
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
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3498db',
    marginBottom: 30,
  },
  secondaryButtonText: {
    color: '#3498db',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
});
