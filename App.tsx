import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/theme/colors';

import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';
import { OrderProvider } from './src/context/OrderContext';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgWarm }}>
        <ActivityIndicator color={COLORS.midTeal} size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <OrderProvider>
          <CartProvider>
            <AppNavigator />
          </CartProvider>
        </OrderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
