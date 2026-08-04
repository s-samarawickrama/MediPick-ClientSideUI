import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Simple in-memory auth state. Replace with AsyncStorage/context in production.
let _resolveNav: ((nav: 'auth' | 'main') => void) | null = null;

export const AppNavigator = () => {
  const [isAuthed, setIsAuthed] = useState(false);

  return (
    <NavigationContainer>
      {isAuthed ? (
        <MainNavigator />
      ) : (
        // We pass setIsAuthed via a workaround since AuthNavigator is stack-based.
        // Screens call global signIn() function.
        <AuthNavigatorWithSignIn onSignIn={() => setIsAuthed(true)} />
      )}
    </NavigationContainer>
  );
};

// Wrapper that injects sign-in handler
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';

import { LegalDocScreen } from '../screens/legal/LegalDocScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  OTP: { phone: string; surname: string };
  LegalDoc: { type: 'terms' | 'privacy' | 'faq' };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigatorWithSignIn: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen
      name="OTP"
      children={(props) => <OTPScreen {...props} onSignIn={onSignIn} />}
    />
    <Stack.Screen name="LegalDoc" component={LegalDocScreen} />
  </Stack.Navigator>
);
