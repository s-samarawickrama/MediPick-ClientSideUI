import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, StatusBar, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquare, ChevronRight, ShieldCheck, Clock } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const ChatListScreen = () => {
  const navigation = useNavigation<Nav>();
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const CHAT_CONVERSATIONS = [
    {
      orderId: 'ord-1',
      pharmacyName: 'MediCare Central Pharmacy',
      lastMessage: 'Got it! Your items are safely stored until you arrive.',
      time: '2:15 PM',
      unread: 1,
    },
    {
      orderId: 'ord-2',
      pharmacyName: 'City Health Pharmacy',
      lastMessage: 'We have quoted LKR 500 for Amoxicillin.',
      time: 'Yesterday',
      unread: 0,
    },
    {
      orderId: 'ord-3',
      pharmacyName: 'Wellness Care Pharmacy',
      lastMessage: 'Thank you for your pickup confirmation.',
      time: 'Jul 24',
      unread: 0,
    },
  ];

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      <View style={s.header}>
        <Text style={s.title}>Pharmacy Chats</Text>
      </View>

      <Animated.ScrollView
        style={{ opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {CHAT_CONVERSATIONS.map((chat) => (
          <Pressable
            key={chat.orderId}
            style={({ pressed }) => [s.chatCard, pressed && { opacity: 0.92 }]}
            onPress={() => navigation.navigate('PharmacyChat', { orderId: chat.orderId })}
          >
            <View style={s.avatarBox}>
              <Text style={s.avatarInitial}>{chat.pharmacyName[0]}</Text>
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <View style={s.cardTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.pharmName}>{chat.pharmacyName}</Text>
                  <ShieldCheck color={COLORS.midTeal} size={13} strokeWidth={2.5} />
                </View>
                <Text style={s.timeText}>{chat.time}</Text>
              </View>

              <Text style={s.lastMsg} numberOfLines={1}>{chat.lastMessage}</Text>
            </View>

            {chat.unread > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{chat.unread}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </Animated.ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: COLORS.bgWarm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  title: { fontFamily: FONTS.black, fontSize: 24, color: COLORS.textDark, letterSpacing: -0.5 },
  scroll: { padding: 16, gap: 10, paddingBottom: 100 },

  chatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.borderSoft,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  avatarBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.midTeal },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pharmName: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  pharmacistSub: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  lastMsg: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  timeText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  unreadBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.midTeal, justifyContent: 'center', alignItems: 'center',
  },
  unreadText: { fontFamily: FONTS.bold, fontSize: 11, color: '#fff' },
});
