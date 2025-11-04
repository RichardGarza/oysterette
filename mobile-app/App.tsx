import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text } from 'react-native';
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

  // Settings button component for header
  const SettingsButton = ({ navigation }: any) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: 15 }}
    >
      <Text style={{ fontSize: 24 }}>⚙️</Text>
    </TouchableOpacity>
  );

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
          options={({ navigation }) => ({
            title: 'Oysterette',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={({ navigation }) => ({
            title: 'Log In',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={({ navigation }) => ({
            title: 'Sign Up',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="OysterList"
          component={OysterListScreen}
          options={({ navigation }) => ({
            title: 'Browse Oysters',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="OysterDetail"
          component={OysterDetailScreen}
          options={({ navigation }) => ({
            title: 'Oyster Details',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="AddOyster"
          component={AddOysterScreen}
          options={({ navigation }) => ({
            title: 'Add Oyster',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="AddReview"
          component={AddReviewScreen}
          options={({ navigation }) => ({
            title: 'Write Review',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="EditReview"
          component={EditReviewScreen}
          options={({ navigation }) => ({
            title: 'Edit Review',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="TopOysters"
          component={TopOystersScreen}
          options={({ navigation }) => ({
            title: 'Top Oysters',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
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
