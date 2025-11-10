/**
 * MenuScreen - Hamburger menu with auth-based options
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { List, Divider, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { authStorage } from '../services/auth';
import { RootStackParamList } from '../navigation/types';

export default function MenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { paperTheme } = useTheme();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await authStorage.getToken();
    setIsSignedIn(!!token);
  };

  const handleLogout = async () => {
    await authStorage.removeToken();
    setIsSignedIn(false);
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <ScrollView>
        {isSignedIn ? (
          <>
            <List.Item
              title="My Profile"
              left={(props) => <List.Icon {...props} icon="account" />}
              onPress={() => navigation.navigate('Profile', { userId: undefined })}
            />
            <Divider />
            <List.Item
              title="Favorites"
              left={(props) => <List.Icon {...props} icon="heart" />}
              onPress={() => navigation.navigate('OysterList', { showFavorites: true })}
            />
            <Divider />
            <List.Item
              title="Friends"
              left={(props) => <List.Icon {...props} icon="account-group" />}
              onPress={() => navigation.navigate('Friends')}
            />
            <Divider />
            <List.Item
              title="Settings"
              left={(props) => <List.Icon {...props} icon="cog" />}
              onPress={() => navigation.navigate('Settings')}
            />
            <Divider />
            <List.Item
              title="Log Out"
              left={(props) => <List.Icon {...props} icon="logout" />}
              onPress={handleLogout}
            />
          </>
        ) : (
          <>
            <List.Item
              title="Sign In"
              left={(props) => <List.Icon {...props} icon="login" />}
              onPress={() => navigation.navigate('Login')}
            />
            <Divider />
            <List.Item
              title="Sign Up"
              left={(props) => <List.Icon {...props} icon="account-plus" />}
              onPress={() => navigation.navigate('Register')}
            />
            <Divider />
            <List.Item
              title="Top Oysters"
              left={(props) => <List.Icon {...props} icon="star" />}
              onPress={() => navigation.navigate('Home')}
            />
            <Divider />
            <List.Item
              title="Settings"
              left={(props) => <List.Icon {...props} icon="cog" />}
              onPress={() => navigation.navigate('Settings')}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
