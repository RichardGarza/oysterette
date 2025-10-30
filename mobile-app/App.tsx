import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OysterListScreen from './src/screens/OysterListScreen';
import OysterDetailScreen from './src/screens/OysterDetailScreen';
import AddOysterScreen from './src/screens/AddOysterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3498db',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
