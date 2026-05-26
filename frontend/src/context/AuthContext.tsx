import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse } from '../types';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  role: 'ADMIN' | 'USER' | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    email: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'userId', 'email', 'role']).then((pairs) => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
      setState({
        token: map.token,
        userId: map.userId,
        email: map.email,
        role: (map.role as AuthState['role']) ?? null,
        isLoading: false,
      });
    });
  }, []);

  const login = async (data: AuthResponse) => {
    await AsyncStorage.multiSet([
      ['token', data.token],
      ['userId', data.userId],
      ['email', data.email],
      ['role', data.role],
    ]);
    setState({ token: data.token, userId: data.userId, email: data.email, role: data.role, isLoading: false });
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'userId', 'email', 'role']);
    setState({ token: null, userId: null, email: null, role: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
