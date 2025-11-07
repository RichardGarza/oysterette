/**
 * Navigation Types
 *
 * TypeScript type definitions for React Navigation routing and parameters.
 *
 * Purpose:
 * - Type-safe navigation throughout the app
 * - Autocomplete for screen names and params
 * - Compile-time validation of navigation calls
 * - IntelliSense support in IDEs
 *
 * RootStackParamList:
 * - Defines all screens and their required parameters
 * - undefined: Screen takes no params
 * - object: Screen requires specific params
 *
 * Screen Parameters:
 * - Home: No params (landing page)
 * - Login/Register: No params (auth screens)
 * - OysterList: No params (browse all oysters)
 * - OysterDetail: { oysterId: string } - Required oyster ID
 * - AddOyster: No params (new oyster form)
 * - AddReview: { oysterId, oysterName, existingReview? } - Oyster info + optional update mode
 * - EditReview: { review: Review } - Full review object for editing
 * - Settings: No params (app settings)
 * - TopOysters: No params (leaderboard)
 * - Profile: No params (current user profile)
 * - PrivacySettings: No params (privacy configuration)
 *
 * Navigation Prop Types:
 * - HomeScreenNavigationProp: Typed navigate methods for Home
 * - OysterListScreenNavigationProp: Typed for OysterList
 * - OysterDetailScreenNavigationProp: Typed for OysterDetail
 * - AddReviewScreenNavigationProp: Typed for AddReview
 * - Plus others for each screen
 *
 * Route Prop Types:
 * - OysterDetailScreenRouteProp: Access to { oysterId } param
 * - AddReviewScreenRouteProp: Access to { oysterId, oysterName, existingReview? } params
 * - Used with useRoute() hook
 *
 * Usage Examples:
 *
 * 1. In screen component:
 * ```tsx
 * const navigation = useNavigation<OysterListScreenNavigationProp>();
 * navigation.navigate('OysterDetail', { oysterId: '123' }); // Type-safe!
 * ```
 *
 * 2. Access route params:
 * ```tsx
 * const route = useRoute<OysterDetailScreenRouteProp>();
 * const { oysterId } = route.params; // TypeScript knows oysterId exists!
 * ```
 *
 * 3. Invalid navigation (compile error):
 * ```tsx
 * navigation.navigate('OysterDetail'); // ❌ Error: oysterId required
 * navigation.navigate('OysterDetail', { wrong: 'param' }); // ❌ Error: invalid param
 * ```
 *
 * Type Safety Benefits:
 * - Prevents navigation to non-existent screens
 * - Ensures required params are provided
 * - Catches typos in screen names at compile time
 * - Provides autocomplete for screen names
 * - Documents screen parameter requirements
 *
 * Integration:
 * - Used in App.tsx for NavigationContainer
 * - Used in all screen components for navigation
 * - Works with React Navigation v6+
 * - NativeStackNavigationProp for stack navigator
 * - RouteProp for accessing route parameters
 *
 * Note on HomeScreenNavigationProp:
 * - Custom type with explicit navigate overloads
 * - Ensures type safety for specific navigation calls
 * - Can be extended for more specific behaviors
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Review } from '../types/Oyster';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  OysterList: undefined;
  OysterDetail: { oysterId: string };
  AddOyster: undefined;
  AddReview: { oysterId: string; oysterName: string; existingReview?: Review };
  EditReview: { review: Review };
  Settings: undefined;
  TopOysters: undefined;
  Profile: undefined;
  PrivacySettings: undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
> & {
  navigate(screen: 'TopOysters'): void;
  navigate(screen: 'OysterList'): void;
  navigate(screen: 'Login'): void;
};

export type OysterListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OysterList'
>;

export type OysterDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OysterDetail'
>;

export type OysterDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'OysterDetail'
>;

export type AddReviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddReview'
>;

export type AddReviewScreenRouteProp = RouteProp<
  RootStackParamList,
  'AddReview'
>;
