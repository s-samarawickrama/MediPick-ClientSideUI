import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Alert, Platform, Image
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, CheckCircle2, ShieldCheck, FileText, ShoppingBag, Clock, Phone, MessageCircle
} from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MOCK_ORDERS, MOCK_PHARMACIES } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'Quotation'>;

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
       const destructive = buttons.find(b => b.style === 'destructive');
       if (destructive && destructive.onPress) {
         if (window.confirm(`${title}\n\n${message}`)) {
           destructive.onPress();
         }
       }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export const QuotationScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const order      = MOCK_ORDERS.find((o) => o.id === route.params?.orderId) ?? MOCK_ORDERS[1];
  const pharmacyImage = order.pharmacy?.image ?? MOCK_PHARMACIES.find((p) => p.name === (order.pharmacy?.name ?? 'City Health Pharmacy'))?.image;

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(10)).current;

  const quoteBannerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: isDark ? colors.plumLight : '#EDE7F6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: isDark ? colors.deepPlum : '#D7C6E9',
    marginBottom: 20,
  };

  const quoteBannerTextStyle = {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: isDark ? '#E9D5FF' : colors.deepPlum,
  };

  const quoteBannerSubStyle = {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: isDark ? '#D8B4E2' : colors.textSecondary,
    marginTop: 1,
    opacity: 0.95,
  };

  const quoteBannerTimerStyle = {
    color: isDark ? colors.warning : '#B45309',
    fontFamily: FONTS.bold,
  };

  const savingBadgeStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: isDark ? 'rgba(249, 115, 22, 0.14)' : '#F8E4D3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(251, 146, 60, 0.45)' : '#E6C9A9',
  };

  const savingBadgeTextStyle = {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: isDark ? '#FED7AA' : '#9A5600',
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const handleConfirmOrder = () => {
    if (order && order.state === 'WAITING_CUSTOMER_CONFIRMATION') {
      order.state = 'PREPARING';
    }
    navigation.navigate('ReadyForPickup', { orderId: order?.id ?? 'ord-102', isPaidOnline: false });
  };

  const handleDeclineOrder = () => {
    showAlert(
      'Decline Offer',
      'Are you sure you want to decline this quote? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline Quote', 
          style: 'destructive',
          onPress: () => {
            if (order && order.state === 'WAITING_CUSTOMER_CONFIRMATION') {
              order.state = 'REJECTED';
              order.rejectReason = 'Customer declined the quotation offer.';
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  // Create an offer dynamically from the order data
  const offer = {
    name: order.pharmacy?.name ?? 'MediCare Central',
    address: order.pharmacy?.address ?? '124 Galle Rd, Colombo 03',
    distance: order.pharmacy?.distance ?? '0.8 km',
    totalOffered: order.totalAmount ?? 500,
    totalMrp: order.totalMrp ?? 570,
    items: order.items && order.items.length > 0 
      ? order.items.map(i => ({
          name: i.medicine.name + ' x ' + i.quantity,
          mrp: (i.medicine.mrpPrice || i.price) * i.quantity,
          offered: i.price * i.quantity
        }))
      : [
          { name: 'Amoxicillin 500mg x 10', mrp: 450, offered: 400 },
          { name: 'Panadol 500mg x 10',     mrp: 120, offered: 100 },
        ],
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Review Quote</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity, transform: [{ translateY: slideY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Limit Banner */}
        {order?.state === 'WAITING_CUSTOMER_CONFIRMATION' && (
          <View style={quoteBannerStyle}>
            <Clock color={isDark ? '#F5D6FF' : colors.deepPlum} size={24} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={quoteBannerTextStyle}>Quote Ready for Review</Text>
              <Text style={quoteBannerSubStyle}>
                <Text style={quoteBannerTimerStyle}>23h 59m remaining </Text>
                to confirm before auto-cancellation.
              </Text>
            </View>
          </View>
        )}

        {/* Pharmacy Details */}
        <TouchableOpacity style={s.offerCard} activeOpacity={0.7} onPress={() => Alert.alert(offer.name, `${offer.address}\n\nDistance: ${offer.distance}`)}>
          <View style={s.offerHeaderRow}>
            <View style={s.pharmacyLogoWrap}>
              {pharmacyImage ? (
                <Image source={pharmacyImage} style={s.pharmacyLogo} />
              ) : (
                <View style={s.pharmacyLogoFallback}>
                  <Text style={s.pharmacyLogoFallbackText}>{offer.name.charAt(0)}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.offerPharmName}>{offer.name}</Text>
                <ShieldCheck color={colors.midTeal} size={13} strokeWidth={2.5} />
              </View>
              <Text style={s.offerPharmAddr}>{offer.address} · {offer.distance}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
              <TouchableOpacity 
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center' }}
                onPress={(e) => { e.stopPropagation(); Alert.alert('Call', 'Calling pharmacy...'); }}
              >
                <Phone color={colors.midTeal} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center' }}
                onPress={(e) => { e.stopPropagation(); Alert.alert('Chat', 'Opening chat...'); }}
              >
                <MessageCircle color={colors.midTeal} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Item Breakdown */}
        <View style={s.itemsCard}>
          <Text style={s.itemsHeader}>Quote Breakdown</Text>

          <View style={s.breakdownSectionHeader}>
            <FileText color={colors.midTeal} size={13} strokeWidth={2} />
            <Text style={s.breakdownSectionTitle}>Prescription Medicines</Text>
          </View>

          {offer.items.slice(0, 1).map((item, i) => (
            <View key={i} style={[s.itemRow, s.itemBorder]}>
              <Text style={s.itemName}>{item.name}</Text>
              <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                <Text style={s.itemMrp}>LKR {item.mrp}</Text>
                <Text style={s.itemOffer}>LKR {item.offered}</Text>
              </View>
            </View>
          ))}

          <View style={[s.breakdownSectionHeader, { marginTop: 6 }]}>
            <ShoppingBag color={colors.midTeal} size={13} strokeWidth={2} />
            <Text style={s.breakdownSectionTitle}>Additional Pharmacy Items</Text>
          </View>

          {offer.items.slice(1).map((item, i) => (
            <View key={i} style={[s.itemRow, i < offer.items.slice(1).length - 1 && s.itemBorder]}>
              <Text style={s.itemName}>{item.name}</Text>
              <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                <Text style={s.itemMrp}>LKR {item.mrp}</Text>
                <Text style={s.itemOffer}>LKR {item.offered}</Text>
              </View>
            </View>
          ))}

          <View style={s.totalRow}>
            <Text style={s.totalAmount}>LKR {offer.totalOffered}</Text>
            <View style={[s.savingBadge, { backgroundColor: isDark ? '#2C1C0E' : '#FFF7ED', borderColor: isDark ? '#8B5E34' : '#FCD7B0' }]}>
              <CheckCircle2 color={isDark ? '#FBBF24' : '#C2410C'} size={12} strokeWidth={2.5} />
              <Text style={[s.savingBadgeText, { color: '#F97316' }]}>LKR {offer.totalMrp - offer.totalOffered} saved</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {order?.state === 'WAITING_CUSTOMER_CONFIRMATION' ? (
          <>
            <Button
              title="Confirm Quotation"
              variant="primary"
              onPress={handleConfirmOrder}
              style={{ marginTop: 6, marginBottom: 4 }}
            />
            <Button
              title="Decline Offer"
              variant="ghost"
              onPress={handleDeclineOrder}
              textStyle={{ color: colors.error }}
            />
          </>
        ) : (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.medium, color: colors.textMuted }}>
              This quote is no longer active.
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: colors.textDark },
  scroll: { padding: 16, paddingBottom: 60, gap: 12 },

  offerCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: colors.borderSoft, gap: 10,
  },
  offerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pharmacyLogoWrap: {
    width: 44, height: 44, borderRadius: 12,
    overflow: 'hidden', backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },
  pharmacyLogo: { width: 44, height: 44, borderRadius: 12 },
  pharmacyLogoFallback: {
    width: '100%', height: '100%',
    backgroundColor: colors.midTealLight, justifyContent: 'center', alignItems: 'center',
  },
  pharmacyLogoFallbackText: { fontFamily: FONTS.bold, fontSize: 18, color: colors.midTeal },
  offerPharmName: { fontFamily: FONTS.bold, fontSize: 16, color: colors.textDark },
  offerPharmAddr: { fontFamily: FONTS.regular, fontSize: 13, color: colors.textMuted, marginTop: 1 },

  itemsCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.borderSoft, gap: 4,
  },
  itemsHeader: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark, marginBottom: 4 },
  breakdownSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.limeWhisper, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8,
    marginVertical: 4, alignSelf: 'flex-start',
  },
  breakdownSectionTitle: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal, flex: 1 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, width: '100%',
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  itemName: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textDark, flex: 1, marginRight: 8 },
  itemMrp: { fontFamily: FONTS.regular, fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through' },
  itemOffer: { fontFamily: FONTS.bold, fontSize: 13, color: colors.midTeal },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  totalAmount: { fontFamily: FONTS.black, fontSize: 20, color: colors.textDark },
  savingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  savingBadgeText: { fontFamily: FONTS.bold, fontSize: 12 },
});
