import { Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authStorage } from '../services/auth';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const SUGGEST_OYSTER_TITLE = 'Suggest a new oyster';

export function showSuggestOysterLoginPrompt(navigation: Navigation): void {
  Alert.alert(
    'Sign in required',
    'Sign in to suggest a new oyster for the database.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign In',
        onPress: () => navigation.navigate('Login'),
      },
    ],
  );
}

export async function navigateToSuggestOyster(navigation: Navigation): Promise<void> {
  const token = await authStorage.getToken();
  if (!token) {
    showSuggestOysterLoginPrompt(navigation);
    return;
  }
  navigation.navigate('AddOyster');
}