import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { MainNavigator } from './MainNavigator';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';

export const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user.isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
