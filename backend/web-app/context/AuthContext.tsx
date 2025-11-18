'use client';

/**
 * Auth Context for Web App
 * 
 * Provides global authentication state and methods
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/types';
import { authStorage } from '../lib/auth';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const token = authStorage.getToken();
    const savedUser = authStorage.getUser();

    if (token && savedUser) {
      setUser(savedUser);
      // Optionally refresh user from API
      refreshUser().catch(() => {
        // If refresh fails, clear auth
        authStorage.clearAuth();
        setUser(null);
      });
    }
    setIsLoading(false);
  }, []);

  const refreshUser = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      authStorage.saveUser(profile);
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    authStorage.saveToken(response.token);
    authStorage.saveUser(response.user);
    setUser(response.user);
  };

  const register = async (email: string, name: string, password: string) => {
    const response = await authApi.register(email, name, password);
    authStorage.saveToken(response.token);
    authStorage.saveUser(response.user);
    setUser(response.user);
  };

  const googleLogin = async (idToken: string) => {
    const response = await authApi.googleAuth(idToken);
    authStorage.saveToken(response.token);
    authStorage.saveUser(response.user);
    setUser(response.user);
  };

  const logout = () => {
    authStorage.clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

