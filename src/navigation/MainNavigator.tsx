import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShoppingBag, Pill, Package, MessageSquare, User } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { FavoritesScreen } from '../screens/home/FavoritesScreen';
import { BrowseOTCScreen } from '../screens/otc/BrowseOTCScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { QuotationScreen } from '../screens/orders/QuotationScreen';
import { ReadyForPickupScreen } from '../screens/orders/ReadyForPickupScreen';
import { OrderDetailsScreen } from '../screens/orders/OrderDetailsScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { PharmacyChatScreen } from '../screens/chat/PharmacyChatScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { UploadPrescriptionScreen } from '../screens/prescription/UploadPrescriptionScreen';
import { AIQualityCheckScreen } from '../screens/prescription/AIQualityCheckScreen';

import { SelectPharmacyScreen } from '../screens/prescription/SelectPharmacyScreen';
import { ReportIssueScreen } from '../screens/issues/ReportIssueScreen';

import { MultiStoreCartScreen } from '../screens/cart/MultiStoreCartScreen';
import { LegalDocScreen } from '../screens/legal/LegalDocScreen';

export type MainStackParamList = {
  Tabs: { screen?: string; params?: { initialMode?: 'meds' | 'pharmacies'; category?: string; storeId?: string } } | undefined;
  Browse: { initialMode?: 'meds' | 'pharmacies'; category?: string; storeId?: string } | undefined;
  UploadPrescription: { pharmacyId?: string; pharmacyName?: string; initialSelectedExtraItems?: Record<string, number> } | undefined;
  AIQualityCheck: { clarityScore?: number; pharmacyId?: string; pharmacyName?: string; selectedItems?: string[]; selectedExtraItemsDict?: Record<string, number>; nextScreen?: string; nextParams?: any } | undefined;

  SelectPharmacy: undefined;
  Quotation: { orderId: string; pharmacyId?: string };
  ReadyForPickup: { orderId: string; isPaidOnline?: boolean };
  OrderDetails: { orderId: string };
  PharmacyChat: { orderId: string };
  Notifications: undefined;
  ReportIssue: { orderId: string };
  MultiStoreCart: undefined;
  LegalDoc: { type: 'terms' | 'privacy' | 'faq' };
  Favorites: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<MainStackParamList>();

// Custom bottom tab bar
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const tabs = [
    { key: 'Home',    label: 'Home',    Icon: ShoppingBag },
    { key: 'Browse',  label: 'Browse',  Icon: Pill },
    { key: 'Orders',  label: 'Orders',  Icon: Package },
    { key: 'Chat',    label: 'Chat',    Icon: MessageSquare },
    { key: 'Profile', label: 'Profile', Icon: User },
  ];

  return (
    <View style={tabStyles.container}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const { Icon, label } = tabs[index];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (route.name === 'Browse') {
            if (isFocused) {
              navigation.navigate('Browse', { initialMode: 'meds', storeId: undefined, category: undefined });
            } else if (!event.defaultPrevented) {
              navigation.navigate('Browse', { initialMode: 'meds', storeId: undefined, category: undefined });
            }
          } else {
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={label}
          >
            <View style={[tabStyles.iconWrap, isFocused && tabStyles.iconWrapActive]}>
              <Icon
                color={isFocused ? COLORS.midTeal : '#94A3B8'}
                size={22}
                strokeWidth={isFocused ? 2.5 : 1.8}
              />
            </View>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceWhite,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.limeWhisper,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  labelActive: {
    color: COLORS.midTeal,
  },
});

// Tab screens
const TabsNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Browse" component={BrowseOTCScreen} />
    <Tab.Screen name="Orders" component={OrdersScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main stack wrapping the tabs + all modal screens
export const MainNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={TabsNavigator} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="UploadPrescription" component={UploadPrescriptionScreen} />
    <Stack.Screen name="AIQualityCheck" component={AIQualityCheckScreen} options={{ gestureEnabled: false }} />

    <Stack.Screen name="SelectPharmacy" component={SelectPharmacyScreen} />
    <Stack.Screen name="Quotation" component={QuotationScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="ReadyForPickup" component={ReadyForPickupScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="PharmacyChat" component={PharmacyChatScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="MultiStoreCart" component={MultiStoreCartScreen} options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="LegalDoc" component={LegalDocScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ animation: 'slide_from_bottom' }} />
  </Stack.Navigator>
);
