/**
 * App.tsx - Root Application Component
 *
 * Oysterette Mobile App Entry Point
 *
 * Purpose:
 * - Configures navigation structure (React Navigation)
 * - Wraps app in ThemeProvider for global theming
 * - Defines all screen routes and parameters
 * - Sets up navigation header styling
 * - Manages status bar appearance
 *
 * Architecture:
 * - ThemeProvider: Outermost wrapper for light/dark mode
 * - NavigationContainer: React Navigation root
 * - Stack.Navigator: Native stack navigation
 * - 12 screens registered with type-safe params
 *
 * Screens:
 * 1. Home: Landing page with auth check
 * 2. Login: Email/password + Google OAuth
 * 3. Register: Account creation
 * 4. OysterList: Main browsing with search/filters
 * 5. OysterDetail: Full oyster view with reviews
 * 6. AddOyster: Community contributions
 * 7. AddReview: Review creation/update
 * 8. EditReview: Standalone review edit
 * 9. Settings: App configuration hub
 * 10. TopOysters: Leaderboard
 * 11. Profile: User stats and history
 * 12. PrivacySettings: Profile visibility config
 *
 * Navigation Configuration:
 * - initialRouteName: "Home" (always starts here)
 * - headerStyle: Theme-aware primary color
 * - headerTintColor: White text
 * - contentStyle: Theme-aware background
 * - StatusBar: Dark/light based on theme
 *
 * Header Components:
 * - SettingsButton: Gear icon (⚙️) in top-right
 *   - Available on: Home, OysterList, OysterDetail, Profile
 *   - Navigates to Settings screen
 * - Back button: Custom "←" text (58px)
 *   - Available on: All non-Home screens
 *   - OysterList back button goes to Home (not Login)
 * - Clickable title: "Oysterette" navigates to Home
 *   - Available on: OysterList (makes logo/title act as home button)
 *
 * Special Navigation Behaviors:
 * - Home screen: headerLeft: null (no back button)
 * - OysterList: Custom back button to Home (prevents going to Login)
 * - OysterList: Clickable "Oysterette" title (home navigation)
 * - Settings: Available from multiple screens via gear icon
 *
 * Theme Integration:
 * - useTheme() hook accesses current theme
 * - theme.colors.primary: Header background
 * - theme.colors.background: Screen backgrounds
 * - isDark: Controls StatusBar style
 * - Entire app re-renders on theme change
 *
 * Type Safety:
 * - RootStackParamList defines all routes and params
 * - TypeScript ensures correct navigation calls
 * - Compile-time validation of screen params
 *
 * Logo Replacement Instructions (Currently Text):
 * - Currently shows "Oysterette" text in header
 * - See comments in file (lines 21-38) for logo image replacement
 * - Recommended size: 150px x 40px PNG with transparency
 * - Would replace text on OysterList screen header
 *
 * Development Notes:
 * - Uses Expo for managed workflow
 * - Native stack navigator for iOS/Android feel
 * - StatusBar managed via expo-status-bar
 * - ThemeProvider must wrap NavigationContainer
 * - All screens lazy-loaded
 *
 * Deployment:
 * - Expo Go: Development testing
 * - EAS Build: Production APK/IPA
 * - OTA Updates: EAS Update for quick fixes
 * - Version in app.json
 */

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
import ProfileScreen from './src/screens/ProfileScreen';
import PrivacySettingsScreen from './src/screens/PrivacySettingsScreen';
import SetFlavorProfileScreen from './src/screens/SetFlavorProfileScreen';

/**
 * TO REPLACE "Oysterette" TEXT WITH LOGO:
 *
 * 1. Add your logo image to assets/ (e.g., assets/header-logo.png)
 *    - Use transparent background PNG
 *    - Recommended size: ~150px wide x 40px tall
 *
 * 2. Import Image component: import { Image } from 'react-native';
 *
 * 3. Replace title with headerTitle for OysterList:
 *    headerTitle: () => (
 *      <Image
 *        source={require('./assets/header-logo.png')}
 *        style={{ width: 150, height: 40 }}
 *        resizeMode="contain"
 *      />
 *    ),
 */

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
            headerLeft: () => null,
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
            headerTitle: () => (
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                  Oysterette
                </Text>
              </TouchableOpacity>
            ),
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Home')}
                style={{ marginLeft: 15 }}
              >
                <Text style={{ color: '#fff', fontSize: 28 }}>←</Text>
              </TouchableOpacity>
            ),
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
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={({ navigation }) => ({
            title: 'My Profile',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="PrivacySettings"
          component={PrivacySettingsScreen}
          options={({ navigation }) => ({
            title: 'Privacy Settings',
            headerRight: () => <SettingsButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="SetFlavorProfile"
          component={SetFlavorProfileScreen}
          options={({ navigation }) => ({
            title: 'Flavor Profile',
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
