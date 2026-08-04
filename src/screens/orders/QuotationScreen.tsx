import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Pressable, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, CheckCircle2, MessageSquare, CreditCard,
  Wallet, ShieldCheck, Check, XCircle, FileText, ShoppingBag
} from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_ORDERS } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'Quotation'>;

const PHARMACY_OFFERS = [
  {
    id: 'ph-1',
    name: 'MediCare Central',
    address: '124 Galle Rd, Colombo 03',
    distance: '0.8 km',
    status: 'ACCEPTED' as const,
    totalOffered: 500,
    totalMrp: 570,
    badge: 'Best Price',
    items: [
      { name: 'Amoxicillin 500mg × 10', mrp: 450, offered: 400 },
      { name: 'Panadol 500mg × 10',     mrp: 120, offered: 100 },
    ],
  },
  {
    id: 'ph-2',
    name: 'City Health Pharmacy',
    address: '45 Kandy Rd, Kiribathgoda',
    distance: '2.4 km',
    status: 'ACCEPTED' as const,
    totalOffered: 540,
    totalMrp: 570,
    badge: 'Nearest',
    items: [
      { name: 'Amoxicillin 500mg × 10', mrp: 450, offered: 430 },
      { name: 'Panadol 500mg × 10',     mrp: 120, offered: 110 },
    ],
  },
  {
    id: 'ph-3',
    name: 'Lanka Care Pharmacy',
    address: '88 Highlevel Rd, Nugegoda',
    distance: '3.1 km',
    status: 'REJECTED' as const,
    rejectionReason: 'Amoxicillin 500mg out of stock.',
  },
];

import { PaymentMethodSelector } from '../../components/common/PaymentMethodSelector';
import { StripePaymentModal } from '../../components/common/StripePaymentModal';

// ...
export const QuotationScreen = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  console.log('[QuotationScreen] route params:', route.params);
  const order      = MOCK_ORDERS.find((o) => o.id === route.params?.orderId) ?? MOCK_ORDERS[1];

  const [selectedPharmId, setSelectedPharmId] = useState<string>('ph-1');
  const [payMethod, setPayMethod]             = useState<'counter' | 'stripe'>('counter');
  const [showStripeModal, setShowStripeModal] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const selectedOffer = PHARMACY_OFFERS.find((o) => o.id === selectedPharmId) ?? PHARMACY_OFFERS[0];

  const handleConfirmOrder = () => {
    console.log('[QuotationScreen] Confirm Order clicked. Method:', payMethod, 'Order:', order?.id);
    try {
      if (payMethod === 'stripe') {
        setShowStripeModal(true);
      } else {
        console.log('[QuotationScreen] Navigating to ReadyForPickup...');
        navigation.navigate('ReadyForPickup', { orderId: order?.id ?? 'ord-102', isPaidOnline: false });
      }
    } catch (err) {
      console.error('[QuotationScreen] Crash caught in handleConfirmOrder:', err);
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Quotes</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity, transform: [{ translateY: slideY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Offer Cards */}
        <View style={s.offersSection}>
          {PHARMACY_OFFERS.map((offer) => {
            const isSelected = offer.id === selectedPharmId;
            const isRejected = offer.status === 'REJECTED';

            if (isRejected) {
              return (
                <View key={offer.id} style={[s.offerCard, { opacity: 0.65 }]}>
                  <View style={s.rejectedRow}>
                    <Text style={[s.offerPharmName, { color: COLORS.textMuted }]}>{offer.name}</Text>
                  </View>
                  <Text style={s.rejectedReason}>{offer.rejectionReason}</Text>
                  
                  <TouchableOpacity
                    style={s.tryOtherBtn}
                    onPress={() => navigation.navigate('SelectPharmacies', { fromOtc: false })}
                    activeOpacity={0.7}
                  >
                    <Text style={s.tryOtherBtnText}>Try Other Pharmacies</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <Pressable
                key={offer.id}
                style={({ pressed }) => [
                  s.offerCard,
                  isSelected && s.offerCardSelected,
                  pressed && { opacity: 0.94 },
                ]}
                onPress={() => setSelectedPharmId(offer.id)}
              >
                <View style={s.offerHeaderRow}>
                  <View style={[s.radioBox, isSelected && s.radioBoxSelected]}>
                    {isSelected && <Check color="#fff" size={13} strokeWidth={3.5} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.offerPharmName}>{offer.name}</Text>
                      <ShieldCheck color={COLORS.midTeal} size={13} strokeWidth={2.5} />
                    </View>
                    <Text style={s.offerPharmAddr}>{offer.address} · {offer.distance}</Text>
                  </View>

                  {offer.badge && (
                    <View style={s.offerBadge}>
                      <Text style={s.offerBadgeText}>{offer.badge}</Text>
                    </View>
                  )}
                </View>

                <View style={s.offerPriceRow}>
                  <View>
                    <Text style={s.offerPriceLabel}>Total</Text>
                    <Text style={s.offerPriceValue}>LKR {offer.totalOffered}</Text>
                  </View>
                  <View style={s.savingTag}>
                    <Text style={s.savingTagText}>Save LKR {(offer.totalMrp ?? 0) - offer.totalOffered}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Item Breakdown */}
        {selectedOffer.items && (
          <View style={s.itemsCard}>
            <Text style={s.itemsHeader}>Quote Breakdown</Text>

            {/* Section 1: Prescription Medicines */}
            <View style={s.breakdownSectionHeader}>
              <FileText color={COLORS.midTeal} size={13} strokeWidth={2} />
              <Text style={s.breakdownSectionTitle}>Prescription Medicines</Text>
            </View>

            {selectedOffer.items.slice(0, 1).map((item, i) => (
              <View key={i} style={[s.itemRow, s.itemBorder]}>
                <Text style={s.itemName}>{item.name}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.itemMrp}>LKR {item.mrp}</Text>
                  <Text style={s.itemOffer}>LKR {item.offered}</Text>
                </View>
              </View>
            ))}

            {/* Section 2: Extra Attached Items */}
            <View style={[s.breakdownSectionHeader, { marginTop: 6 }]}>
              <ShoppingBag color={COLORS.midTeal} size={13} strokeWidth={2} />
              <Text style={s.breakdownSectionTitle}>Additional Pharmacy Items</Text>
            </View>

            {selectedOffer.items.slice(1).map((item, i) => (
              <View key={i} style={[s.itemRow, i < selectedOffer.items.slice(1).length - 1 && s.itemBorder]}>
                <Text style={s.itemName}>{item.name}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.itemMrp}>LKR {item.mrp}</Text>
                  <Text style={s.itemOffer}>LKR {item.offered}</Text>
                </View>
              </View>
            ))}

            <View style={s.totalRow}>
              <Text style={s.totalAmount}>LKR {selectedOffer.totalOffered}</Text>
              <View style={s.savingBadge}>
                <CheckCircle2 color={COLORS.midTeal} size={12} strokeWidth={2.5} />
                <Text style={s.savingBadgeText}>LKR {(selectedOffer.totalMrp ?? 0) - selectedOffer.totalOffered} saved</Text>
              </View>
            </View>
          </View>
        )}

        {/* Unified Standardized Payment Selector */}
        <PaymentMethodSelector
          selectedMethod={payMethod}
          onSelect={setPayMethod}
        />

        {/* Actions */}
        <Button
          title="Confirm Order"
          variant="primary"
          onPress={handleConfirmOrder}
          style={{ marginTop: 6, marginBottom: 4 }}
        />
        <Button
          title="Decline Offers"
          variant="ghost"
          onPress={() => navigation.goBack()}
          textStyle={{ color: COLORS.error }}
        />
      </Animated.ScrollView>

      {/* Stripe Payment Modal if user chooses Stripe online payment */}
      <StripePaymentModal
        visible={showStripeModal}
        amount={selectedOffer.totalOffered ?? 0}
        onClose={() => setShowStripeModal(false)}
        onSuccess={() => {
          setShowStripeModal(false);
          navigation.navigate('ReadyForPickup', { orderId: order?.id ?? 'ord-102', isPaidOnline: true });
        }}
      />
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

  // Offer cards
  offersSection: { gap: 10 },
  offerCard: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.borderSoft, gap: 10,
  },
  offerCardSelected: { borderColor: COLORS.midTeal, backgroundColor: COLORS.midTealLight },
  offerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioBox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceWhite,
  },
  radioBoxSelected: { backgroundColor: COLORS.midTeal, borderColor: COLORS.midTeal },
  offerPharmName: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  offerPharmAddr: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  // Premium Amber saving tag
  offerBadge: {
    backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A',
  },
  offerBadgeText: { fontFamily: FONTS.bold, fontSize: 10, color: '#B45309' },

  offerPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.borderSoft },
  offerPriceLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted },
  offerPriceValue: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark },

  // Premium Amber saving tag
  savingTag: {
    backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A',
  },
  savingTagText: { fontFamily: FONTS.bold, fontSize: 11, color: '#B45309' },

  // Rejected / Unavailable State
  rejectedRow: { flexDirection: 'row', alignItems: 'center' },
  rejectedName: { flex: 1, fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textMuted },
  rejectedReason: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  tryOtherBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  tryOtherBtnText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.midTeal, textDecorationLine: 'underline' },

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
  savingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.limeWhisper, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  savingBadgeText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.midTeal },

  // Payment chips
  paySection: { gap: 6 },
  paySectionLabel: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.textMuted, letterSpacing: 0.4 },
  payRow: { flexDirection: 'row', gap: 10 },
  payChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.surfaceWhite, borderRadius: 12, paddingVertical: 11,
    borderWidth: 1.5, borderColor: COLORS.borderSoft,
  },
  payChipSelected: { borderColor: COLORS.midTeal, backgroundColor: COLORS.midTealLight },
  payChipText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textMuted },
  payChipTextSelected: { color: COLORS.midTeal },
});
