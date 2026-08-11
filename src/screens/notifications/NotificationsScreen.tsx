import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, StatusBar, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Bell, CheckCircle2, Clock, PackageCheck, AlertCircle, ShoppingBag } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const NotificationsScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const NOTIFICATIONS = [
    {
      id: '1',
      title: 'Order Ready for Pickup!',
      body: 'Your prescription #MP123456 is verified and ready at MediCare Central counter.',
      time: '10 mins ago',
      type: 'success',
      read: false,
      orderId: 'ord-101',
      target: 'ReadyForPickup' as const,
    },
    {
      id: '2',
      title: 'New Pharmacy Quotation',
      body: 'City Pharmacy sent a price quote of LKR 500 for Order #MP982311.',
      time: '2 hours ago',
      type: 'quote',
      read: true,
      orderId: 'ord-102',
      target: 'Quotation' as const,
    },
    {
      id: '3',
      title: 'Prescription Verified',
      body: 'AI Clarity check passed with 94% confidence rating.',
      time: 'Yesterday',
      type: 'info',
      read: true,
      orderId: 'ord-101',
      target: 'OrderDetails' as const,
    },
  ];

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {NOTIFICATIONS.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => {
              if (n.target === 'Quotation') {
                navigation.navigate('Quotation', { orderId: n.orderId });
                return;
              }

              if (n.target === 'ReadyForPickup') {
                navigation.navigate('ReadyForPickup', { orderId: n.orderId });
                return;
              }

              navigation.navigate('OrderDetails', { orderId: n.orderId });
            }}
            style={({ pressed }) => [
              s.card,
              !n.read && s.cardUnread,
              pressed && { opacity: 0.92 },
            ]}
          >
            <View style={s.iconBox}>
              <Bell color={colors.midTeal} size={20} strokeWidth={2} />
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>{n.title}</Text>
                <Text style={s.cardTime}>{n.time}</Text>
              </View>
              <Text style={s.cardBody}>{n.body}</Text>
            </View>
          </Pressable>
        ))}
      </Animated.ScrollView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceWhite, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.black, fontSize: 18, color: colors.textDark },
  scroll: { padding: 16, gap: 12, paddingBottom: 60 },

  card: {
    flexDirection: 'row', gap: 12, padding: 14,
    backgroundColor: colors.surfaceWhite, borderRadius: 16,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  cardUnread: { backgroundColor: colors.limeWhisper, borderColor: '#D6EDA0' },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.midTealLight, justifyContent: 'center', alignItems: 'center',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  cardTime: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  cardBody: { fontFamily: FONTS.regular, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
});
