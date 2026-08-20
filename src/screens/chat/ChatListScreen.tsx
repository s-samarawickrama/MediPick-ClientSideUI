import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, StatusBar, Pressable, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquare, ChevronRight, ShieldCheck, Clock } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';

import { useOrders } from '../../context/OrderContext';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const ChatListScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const { orders } = useOrders();
  
  // Filter for active orders (that would have chats)
  const activeChatOrders = orders.filter(
    o => !['COMPLETED', 'CANCELLED', 'CLOSED', 'REJECTED'].includes(o.state)
  );

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

      <View style={s.header}>
        <Text style={s.title}>Pharmacy Chats</Text>
      </View>

      <Animated.ScrollView
        style={{ opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activeChatOrders.map((o) => {
          const pharmName = o.pharmacy?.name || 'MediCare Central Pharmacy';
          const pharmImg = o.pharmacy?.image;
          const isReady = o.state === 'READY_FOR_PICKUP';

          return (
            <Pressable
              key={o.id}
              style={({ pressed }) => [s.chatCard, pressed && { opacity: 0.92 }]}
              onPress={() => navigation.navigate('PharmacyChat', { orderId: o.id })}
            >
              {pharmImg ? (
                <Image source={pharmImg} style={s.avatarImg} />
              ) : (
                <View style={s.avatarBox}>
                  <Text style={s.avatarInitial}>{pharmName[0]}</Text>
                </View>
              )}

              <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                <View style={s.cardTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, paddingRight: 8 }}>
                    <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark }}>
                      {pharmName}
                    </Text>
                    <View style={{ flexShrink: 0 }}>
                      <ShieldCheck color={colors.midTeal} size={13} strokeWidth={2.5} />
                    </View>
                  </View>
                  <Text style={[s.timeText, { flexShrink: 0 }]} numberOfLines={1}>Just now</Text>
                </View>

                <Text style={s.lastMsg} numberOfLines={1}>
                  {isReady ? 'Your pickup code is ready!' : `Order #${o.orderNumber}`}
                </Text>
              </View>

              {isReady && (
                <View style={s.unreadBadge}>
                  <Text style={s.unreadText}>1</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  title: { fontFamily: FONTS.black, fontSize: 24, color: colors.textDark, letterSpacing: -0.5 },
  scroll: { padding: 16, gap: 10, paddingBottom: 100 },

  chatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.borderSoft,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 2,
  },
  avatarBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: {
    width: 44, height: 44, borderRadius: 14, resizeMode: 'cover',
  },
  avatarInitial: { fontFamily: FONTS.black, fontSize: 18, color: colors.midTeal },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  pharmName: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark, flex: 1, minWidth: 0 },
  pharmacistSub: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  lastMsg: { fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  timeText: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, flexShrink: 0 },
  unreadBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.midTeal, justifyContent: 'center', alignItems: 'center',
  },
  unreadText: { fontFamily: FONTS.bold, fontSize: 11, color: '#fff' },
});
