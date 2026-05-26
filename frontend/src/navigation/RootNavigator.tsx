import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AdminStack from './AdminStack';
import AuthStack from './AuthStack';
import DriverTabs from './DriverTabs';

export default function RootNavigator() {
  const { token, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!token && <AuthStack />}
      {token && role === 'USER' && <DriverTabs />}
      {token && role === 'ADMIN' && <AdminStack />}
    </NavigationContainer>
  );
}
