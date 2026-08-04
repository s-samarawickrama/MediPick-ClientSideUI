import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Pressable, Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShoppingCart, Plus, Minus, ChevronLeft, Store, CreditCard, Trash2 } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_PHARMACIES, MOCK_MEDICINES } from '../../mock/demoData';
import { PaymentMethodSelector } from '../../components/common/PaymentMethodSelector';
import { StripePaymentModal } from '../../components/common/StripePaymentModal';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const MultiStoreCartScreen = () => {
  const navigation = useNavigation<Nav>();
  const opacity = useRef(new Animated.Value(0)).current;
  const [payMethod, setPayMethod]             = useState<'counter' | 'stripe'>('counter');
  const [showStripeModal, setShowStripeModal] = useState(false);

  // Mock Multi-Pharmacy Cart items (2 Pharmacies simultaneously)
  const [cartStores, setCartStores] = useState([
    {
      pharmacy: MOCK_PHARMACIES[0], // MediCare Central Pharmacy
      items: [
        { ...MOCK_MEDICINES[0], qty: 2 }, // Panadol
        { ...MOCK_MEDICINES[2], qty: 1 }, // Amoxicillin
      ],
    },
    {
      pharmacy: MOCK_PHARMACIES[1], // City Health Pharmacy
      items: [
        { ...MOCK_MEDICINES[1], qty: 1 }, // Vitamin C
      ],
    },
  ]);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const updateItemQty = (pharmacyId: string, medId: string, delta: number) => {
    setCartStores((prev) =>
      prev
        .map((store) => {
          if (store.pharmacy.id !== pharmacyId) return store;
          const updatedItems = store.items
            .map((item) => {
              if (item.id !== medId) return item;
              const newQty = item.qty + delta;
              return newQty > 0 ? { ...item, qty: newQty } : null;
            })
            .filter(Boolean) as typeof store.items;

          return updatedItems.length > 0 ? { ...store, items: updatedItems } : null;
        })
        .filter(Boolean) as typeof prev
    );
  };

  const removeStoreGroup = (pharmacyId: string) => {
    setCartStores((prev) => prev.filter((s) => s.pharmacy.id !== pharmacyId));
  };

  const totalItemCount = cartStores.reduce(
    (sum, store) => sum + store.items.reduce((s, i) => s + i.qty, 0),
    0
  );

  const grandTotal = cartStores.reduce(
    (sum, store) => sum + store.items.reduce((s, i) => s + i.pharmacyPrice * i.qty, 0),
    0
  );

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Nav Header */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Order Cart ({totalItemCount})</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity, flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Explaining 2-Pharmacy Pickup */}
        <View style={s.multiStoreBanner}>
          <Store color={COLORS.midTeal} size={20} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>{cartStores.length} Separate Orders Generated</Text>
            <Text style={s.bannerSub}>Items are split into independent orders with separate counter pickup OTP codes.</Text>
          </View>
        </View>

        {/* Store Groups */}
        {cartStores.map((storeGroup) => {
          const storeSubtotal = storeGroup.items.reduce((s, i) => s + i.pharmacyPrice * i.qty, 0);

          return (
            <View key={storeGroup.pharmacy.id} style={s.storeCard}>
              {/* Store Header */}
              <View style={s.storeCardHeader}>
                <View style={s.storeAvatar}>
                  <Text style={s.storeInitial}>{storeGroup.pharmacy.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.storeName}>{storeGroup.pharmacy.name}</Text>
                  <Text style={s.storeMeta}>{storeGroup.pharmacy.address} · {storeGroup.pharmacy.distance}</Text>
                </View>
                <TouchableOpacity
                  style={s.removeStoreBtn}
                  onPress={() => removeStoreGroup(storeGroup.pharmacy.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 color={COLORS.error} size={16} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={s.divider} />

              {/* Items List */}
              <View style={s.itemList}>
                {storeGroup.items.map((item) => (
                  <View key={item.id} style={s.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.name}</Text>
                      <Text style={s.itemPrice}>LKR {item.pharmacyPrice} / unit</Text>
                    </View>

                    {/* Stepper (- qty +) */}
                    <View style={s.stepperBox}>
                      <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() => updateItemQty(storeGroup.pharmacy.id, item.id, -1)}
                      >
                        <Minus color={COLORS.midTeal} size={13} strokeWidth={3} />
                      </TouchableOpacity>
                      <Text style={s.stepperQty}>{item.qty}</Text>
                      <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() => updateItemQty(storeGroup.pharmacy.id, item.id, 1)}
                      >
                        <Plus color={COLORS.midTeal} size={13} strokeWidth={3} />
                      </TouchableOpacity>
                    </View>

                    <Text style={s.itemTotal}>LKR {item.pharmacyPrice * item.qty}</Text>
                  </View>
                ))}
              </View>

              <View style={s.storeFooter}>
                <Text style={s.subtotalLabel}>Store Subtotal</Text>
                <Text style={s.subtotalPrice}>LKR {storeSubtotal}</Text>
              </View>
            </View>
          );
        })}

        {cartStores.length === 0 && (
          <View style={s.emptyWrap}>
            <ShoppingCart color={COLORS.textMuted} size={44} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>Your Cart is Empty</Text>
            <Text style={s.emptySub}>Add medicines from partner pharmacies to place an order.</Text>
          </View>
        )}

        {/* Standardized Payment Method Selector */}
        {cartStores.length > 0 && (
          <PaymentMethodSelector
            selectedMethod={payMethod}
            onSelect={setPayMethod}
          />
        )}
      </Animated.ScrollView>

      {/* Checkout Action Bar */}
      {cartStores.length > 0 && (
        <View style={s.checkoutFooterWrap}>
          <View style={s.grandTotalRow}>
            <View>
              <Text style={s.grandTotalLabel}>Grand Total ({cartStores.length} Stores)</Text>
              <Text style={s.grandTotalAmount}>LKR {grandTotal}</Text>
            </View>

            <TouchableOpacity
              style={s.checkoutBtn}
              onPress={() => {
                if (payMethod === 'stripe') {
                  setShowStripeModal(true);
                } else {
                  navigation.navigate('ReadyForPickup', { orderId: 'ord-1' });
                }
              }}
              activeOpacity={0.88}
            >
              <Text style={s.checkoutBtnText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        visible={showStripeModal}
        amount={grandTotal}
        onClose={() => setShowStripeModal(false)}
        onSuccess={() => {
          setShowStripeModal(false);
          navigation.navigate('ReadyForPickup', { orderId: 'ord-1' });
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
    backgroundColor: COLORS.bgWarm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.black, fontSize: 16, color: COLORS.textDark },
  scroll: { padding: 20, paddingBottom: 120, gap: 16 },

  multiStoreBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.limeWhisper, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  bannerTitle: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.midTeal },
  bannerSub: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  storeCard: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderSoft, gap: 12,
  },
  storeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storeAvatar: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },
  storeInitial: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.midTeal },
  storeName: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.textDark },
  storeMeta: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  removeStoreBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEE2E2',
    justifyContent: 'center', alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: COLORS.borderSoft },

  itemList: { gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemName: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textDark },
  itemPrice: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  
  stepperBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.limeWhisper, borderRadius: 8, paddingHorizontal: 6, height: 30,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  stepperBtn: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  stepperQty: { fontFamily: FONTS.black, fontSize: 13, color: COLORS.midTeal },
  itemTotal: { fontFamily: FONTS.black, fontSize: 14, color: COLORS.textDark, minWidth: 60, textAlign: 'right' },

  storeFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.borderSoft,
  },
  subtotalLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  subtotalPrice: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.midTeal },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark },
  emptySub: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  checkoutFooterWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surfaceWhite, borderTopWidth: 1, borderTopColor: COLORS.borderSoft,
    padding: 16, paddingBottom: 24,
  },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  grandTotalAmount: { fontFamily: FONTS.black, fontSize: 20, color: COLORS.textDark },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.midTeal, paddingHorizontal: 20, height: 48, borderRadius: 14,
  },
  checkoutBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' },
});
