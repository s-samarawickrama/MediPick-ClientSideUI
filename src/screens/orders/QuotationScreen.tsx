import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, CheckCircle2, ShieldCheck, FileText, ShoppingBag, Clock, Phone, MessageCircle
} from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_ORDERS } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'Quotation'>;

export const QuotationScreen = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const order      = MOCK_ORDERS.find((o) => o.id === route.params?.orderId) ?? MOCK_ORDERS[1];

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(10)).current;

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
    if (order && order.state === 'WAITING_CUSTOMER_CONFIRMATION') {
      order.state = 'REJECTED';
      order.rejectReason = 'Customer declined the quotation offer.';
    }
    navigation.goBack();
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
          mrp: (i.medicine.price || i.price) * i.quantity,
          offered: i.price * i.quantity
        }))
      : [
          { name: 'Amoxicillin 500mg x 10', mrp: 450, offered: 400 },
          { name: 'Panadol 500mg x 10',     mrp: 120, offered: 100 },
        ],
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
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
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: '#E6DFE8', borderRadius: 16, padding: 14,
            borderWidth: 1, borderColor: '#D4C9D6', marginBottom: 20,
          }}>
            <Clock color={COLORS.deepPlum} size={24} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: COLORS.deepPlum }}>Quote Ready for Review</Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: COLORS.deepPlum, marginTop: 1, opacity: 0.9 }}>
                <Text style={{ color: '#EF4444', fontFamily: FONTS.bold }}>23h 59m remaining </Text>
                to confirm before auto-cancellation.
              </Text>
            </View>
          </View>
        )}

        {/* Pharmacy Details */}
        <TouchableOpacity style={s.offerCard} activeOpacity={0.7} onPress={() => Alert.alert(offer.name, `${offer.address}\n\nDistance: ${offer.distance}`)}>
          <View style={s.offerHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.offerPharmName}>{offer.name}</Text>
                <ShieldCheck color={COLORS.midTeal} size={13} strokeWidth={2.5} />
              </View>
              <Text style={s.offerPharmAddr}>{offer.address} · {offer.distance}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
              <TouchableOpacity 
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center' }}
                onPress={(e) => { e.stopPropagation(); Alert.alert('Call', 'Calling pharmacy...'); }}
              >
                <Phone color={COLORS.midTeal} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center' }}
                onPress={(e) => { e.stopPropagation(); Alert.alert('Chat', 'Opening chat...'); }}
              >
                <MessageCircle color={COLORS.midTeal} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Item Breakdown */}
        <View style={s.itemsCard}>
          <Text style={s.itemsHeader}>Quote Breakdown</Text>

          <View style={s.breakdownSectionHeader}>
            <FileText color={COLORS.midTeal} size={13} strokeWidth={2} />
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
            <ShoppingBag color={COLORS.midTeal} size={13} strokeWidth={2} />
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
            <View style={s.savingBadge}>
              <CheckCircle2 color="#F97316" size={12} strokeWidth={2.5} />
              <Text style={s.savingBadgeText}>LKR {offer.totalMrp - offer.totalOffered} saved</Text>
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
              textStyle={{ color: COLORS.error }}
            />
          </>
        ) : (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.medium, color: COLORS.textMuted }}>
              This quote is no longer active.
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: COLORS.bgWarm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: COLORS.textDark },
  scroll: { padding: 16, paddingBottom: 60, gap: 12 },

  offerCard: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.borderSoft, gap: 10,
  },
  offerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  offerPharmName: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.textDark },
  offerPharmAddr: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginTop: 1 },

  itemsCard: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.borderSoft, gap: 4,
  },
  itemsHeader: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark, marginBottom: 4 },
  breakdownSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    marginVertical: 4,
  },
  breakdownSectionTitle: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.midTeal },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft },
  itemName: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textDark, flex: 1 },
  itemMrp: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  itemOffer: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.midTeal },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.borderSoft },
  totalAmount: { fontFamily: FONTS.black, fontSize: 20, color: COLORS.textDark },
  savingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  savingBadgeText: { fontFamily: FONTS.bold, fontSize: 12, color: '#EA580C' },
});
