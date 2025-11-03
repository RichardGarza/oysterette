import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OysterListScreen from './src/screens/OysterListScreen';
import OysterDetailScreen from './src/screens/OysterDetailScreen';
import AddOysterScreen from './src/screens/AddOysterScreen';
import AddReviewScreen from './src/screens/AddReviewScreen';
import EditReviewScreen from './src/screens/EditReviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TopOystersScreen from './src/screens/TopOystersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Oysterette' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Log In' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Sign Up' }}
        />
        <Stack.Screen
          name="OysterList"
          component={OysterListScreen}
          options={{ title: 'Browse Oysters' }}
        />
        <Stack.Screen
          name="OysterDetail"
          component={OysterDetailScreen}
          options={{ title: 'Oyster Details' }}
        />
        <Stack.Screen
          name="AddOyster"
          component={AddOysterScreen}
          options={{ title: 'Add Oyster' }}
        />
        <Stack.Screen
          name="AddReview"
          component={AddReviewScreen}
          options={{ title: 'Write Review' }}
        />
        <Stack.Screen
          name="EditReview"
          component={EditReviewScreen}
          options={{ title: 'Edit Review' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="TopOysters"
          component={TopOystersScreen}
          options={{ title: 'Top Oysters' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
