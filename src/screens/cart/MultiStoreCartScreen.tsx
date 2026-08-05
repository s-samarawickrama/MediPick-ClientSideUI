import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Pressable, Modal, Image, Alert, Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShoppingCart, Plus, Minus, ChevronLeft, Store, CreditCard, Trash2, CheckSquare, Square, MinusSquare } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_PHARMACIES, MOCK_MEDICINES, MOCK_ORDERS } from '../../mock/demoData';
import { PaymentMethodSelector } from '../../components/common/PaymentMethodSelector';
import { StripePaymentModal } from '../../components/common/StripePaymentModal';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useCart } from '../../context/CartContext';
import { FileText } from 'lucide-react-native';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const MultiStoreCartScreen = () => {
  const navigation = useNavigation<Nav>();
  const opacity = useRef(new Animated.Value(0)).current;
  const [payMethod, setPayMethod] = useState<'counter' | 'stripe'>('counter');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [storeToCheckout, setStoreToCheckout] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { cartItems, attachedPrescription, updateQuantity, removeFromCart, clearCart, removeStoreFromCart, setAttachedPrescription } = useCart();

  // Group cart items dynamically by pharmacy
  const cartStoresMap: Record<string, {
    pharmacy: { id: string; name: string; address: string; distance: string; image?: any };
    items: any[];
    hasPrescription: boolean;
  }> = {};

  cartItems.forEach(c => {
    if (!cartStoresMap[c.pharmacy.id]) {
      cartStoresMap[c.pharmacy.id] = { pharmacy: c.pharmacy, items: [], hasPrescription: false };
    }
    cartStoresMap[c.pharmacy.id].items.push({ ...c.medicine, qty: c.quantity });
  });

  if (attachedPrescription) {
    if (!cartStoresMap[attachedPrescription.pharmacyId]) {
      cartStoresMap[attachedPrescription.pharmacyId] = {
        pharmacy: {
          id: attachedPrescription.pharmacyId,
          name: attachedPrescription.pharmacyName,
          address: 'See details in store',
          distance: 'Calculated at checkout'
        },
        items: [],
        hasPrescription: true
      };
    } else {
      cartStoresMap[attachedPrescription.pharmacyId].hasPrescription = true;
    }
  }

  const cartStores = Object.values(cartStoresMap);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  // Sync initial selection so all items are selected by default when entering the cart
  useEffect(() => {
    if (selectedItems.size === 0 && cartStores.length > 0) {
      const allItemKeys = new Set<string>();
      cartStores.forEach(s => {
        if (s.hasPrescription) allItemKeys.add(`${s.pharmacy.id}_rx`);
        s.items.forEach(i => allItemKeys.add(`${s.pharmacy.id}_${i.id}`));
      });
      setSelectedItems(allItemKeys);
    }
  }, [cartStores.length]);

  const toggleItemSelection = (pharmacyId: string, itemId: string) => {
    const key = `${pharmacyId}_${itemId}`;
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getStoreCheckStatus = (storeGroup: typeof cartStores[0]) => {
    let totalItems = storeGroup.items.length + (storeGroup.hasPrescription ? 1 : 0);
    if (totalItems === 0) return 'unchecked';

    let checkedCount = 0;
    if (storeGroup.hasPrescription && selectedItems.has(`${storeGroup.pharmacy.id}_rx`)) checkedCount++;
    storeGroup.items.forEach(i => {
      if (selectedItems.has(`${storeGroup.pharmacy.id}_${i.id}`)) checkedCount++;
    });

    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === totalItems) return 'checked';
    return 'indeterminate';
  };

  const toggleStoreSelection = (storeGroup: typeof cartStores[0]) => {
    const isAllChecked = getStoreCheckStatus(storeGroup) === 'checked';
    
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (isAllChecked) {
        if (storeGroup.hasPrescription) next.delete(`${storeGroup.pharmacy.id}_rx`);
        storeGroup.items.forEach(i => next.delete(`${storeGroup.pharmacy.id}_${i.id}`));
      } else {
        if (storeGroup.hasPrescription) next.add(`${storeGroup.pharmacy.id}_rx`);
        storeGroup.items.forEach(i => next.add(`${storeGroup.pharmacy.id}_${i.id}`));
      }
      return next;
    });
  };

  const checkedStores = cartStores.filter(store => getStoreCheckStatus(store) !== 'unchecked');

  const totalItemCount = cartStores.reduce((sum, store) => {
    let count = 0;
    if (store.hasPrescription && selectedItems.has(`${store.pharmacy.id}_rx`)) count++;
    store.items.forEach(c => {
      if (selectedItems.has(`${store.pharmacy.id}_${c.id}`)) count += c.qty;
    });
    return sum + count;
  }, 0);

  const processCheckout = (storeId: string) => {
    const store = cartStores.find(s => s.pharmacy.id === storeId);
    if (!store) return;
    
    store.items.forEach(item => {
      if (selectedItems.has(`${store.pharmacy.id}_${item.id}`)) {
        removeFromCart(item.id, store.pharmacy.id);
      }
    });
    if (store.hasPrescription && selectedItems.has(`${store.pharmacy.id}_rx`)) {
      setAttachedPrescription(null);
    }
  };

  const handleCreateOrderForStore = (storeGroup: typeof cartStores[0]) => {
    const checkedMedicineItems = storeGroup.items.filter(item => selectedItems.has(`${storeGroup.pharmacy.id}_${item.id}`));
    const hasRx = storeGroup.hasPrescription && selectedItems.has(`${storeGroup.pharmacy.id}_rx`);
    
    if (checkedMedicineItems.length === 0 && !hasRx) return;

    const orderType = (hasRx && checkedMedicineItems.length > 0) ? 'MIXED' : (hasRx ? 'PRESCRIPTION' : 'OTC');
    const stTotal = checkedMedicineItems.reduce((s, c) => s + c.pharmacyPrice * c.qty, 0);

    const newOrder = {
      id: `ord-new-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber: `#MP${Math.floor(100000 + Math.random() * 900000)}`,
      orderType: orderType,
      state: 'WAITING_PHARMACY_CONFIRMATION',
      pharmacy: storeGroup.pharmacy,
      items: checkedMedicineItems.map(item => ({ medicine: item, quantity: item.qty, price: item.pharmacyPrice })),
      totalAmount: stTotal,
      totalMrp: stTotal + 100, // mock MRP
      isPaid: payMethod === 'stripe',
      paymentMethod: payMethod === 'stripe' ? 'ONLINE' : 'PAY_AT_COUNTER',
      createdAt: new Date().toISOString(),
    };

    MOCK_ORDERS.unshift(newOrder);
    
    // Remove these items from the cart
    processCheckout(storeGroup.pharmacy.id);

    // Give a success alert and navigate to the orders tab
    Alert.alert(
      'Order Placed Successfully!',
      `Your order for ${storeGroup.pharmacy.name} has been sent.`,
      [{ text: 'View Orders', onPress: () => navigation.navigate('Tabs', { screen: 'Orders' }) }]
    );
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Nav Header */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Order Cart ({totalItemCount})</Text>
        {cartStores.length > 0 ? (
          <TouchableOpacity 
            style={s.clearAllBtn}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (window.confirm('Are you sure you want to clear your entire cart?')) {
                  clearCart();
                  setAttachedPrescription(null);
                }
              } else {
                Alert.alert(
                  'Clear Cart',
                  'Are you sure you want to remove all items from your cart?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Clear All', 
                      style: 'destructive',
                      onPress: () => {
                        clearCart();
                        setAttachedPrescription(null);
                      }
                    }
                  ]
                );
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 color={COLORS.error} size={18} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}
      </View>

      <Animated.ScrollView
        style={{ opacity, flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Explaining Separate Orders */}
        {cartStores.length > 1 && (
          <View style={s.multiStoreBanner}>
            <Store color={COLORS.midTeal} size={20} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={s.bannerTitle}>Multiple Pharmacies in Cart</Text>
              <Text style={s.bannerSub}>Place your orders individually for each pharmacy below.</Text>
            </View>
          </View>
        )}

        {/* Store Groups */}
        {cartStores.map((storeGroup) => {
          const storeSubtotal = storeGroup.items.reduce((s, i) => s + i.pharmacyPrice * i.qty, 0);

          return (
            <View key={storeGroup.pharmacy.id} style={s.storeCard}>
              {/* Store Header */}
              <View style={s.storeCardHeader}>
                <TouchableOpacity onPress={() => toggleStoreSelection(storeGroup)} style={{ marginRight: 12 }}>
                  {getStoreCheckStatus(storeGroup) === 'checked' && <CheckSquare color={COLORS.midTeal} size={22} strokeWidth={2.5} />}
                  {getStoreCheckStatus(storeGroup) === 'indeterminate' && <MinusSquare color={COLORS.midTeal} size={22} strokeWidth={2.5} />}
                  {getStoreCheckStatus(storeGroup) === 'unchecked' && <Square color="#CBD5E1" size={22} strokeWidth={2.5} />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate('Tabs', {
                      screen: 'Browse',
                      params: { storeId: storeGroup.pharmacy.id }
                    });
                  }}
                >
                  {storeGroup.pharmacy.image ? (
                    <Image 
                      source={storeGroup.pharmacy.image} 
                      style={s.storeAvatarImage} 
                    />
                  ) : (
                    <View style={s.storeAvatar}>
                      <Text style={s.storeInitial}>{storeGroup.pharmacy.name[0]}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.storeName}>{storeGroup.pharmacy.name}</Text>
                    <Text style={s.storeMeta}>{storeGroup.pharmacy.address} · {storeGroup.pharmacy.distance}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.removeStoreBtn}
                  onPress={() => {
                    removeStoreFromCart(storeGroup.pharmacy.id);
                    if (storeGroup.hasPrescription) {
                      setAttachedPrescription(null);
                    }
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 color={COLORS.error} size={16} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={s.divider} />

              {/* Items List */}
              <View style={s.itemList}>
                {storeGroup.hasPrescription && attachedPrescription && (
                  <View style={s.itemRow}>
                    <TouchableOpacity onPress={() => toggleItemSelection(storeGroup.pharmacy.id, 'rx')} style={{ marginRight: 12, marginTop: 4 }}>
                      {selectedItems.has(`${storeGroup.pharmacy.id}_rx`) 
                        ? <CheckSquare color={COLORS.midTeal} size={22} strokeWidth={2.5} />
                        : <Square color="#CBD5E1" size={22} strokeWidth={2.5} />}
                    </TouchableOpacity>
                    <View style={[s.attachedRxCard, { flex: 1, marginTop: 0 }]}>
                      <View style={s.attachedRxHeader}>
                        <FileText color={COLORS.peacockBlue} size={20} strokeWidth={2} />
                        <Text style={s.attachedRxTitle}>Attached Prescription</Text>
                      </View>
                      <Text style={s.attachedRxNote}>{attachedPrescription.note || 'No special instructions.'}</Text>
                      <Text style={s.itemPrice}>(Price will be quoted by pharmacy)</Text>
                    </View>
                  </View>
                )}
                {storeGroup.items.map((item) => (
                  <View key={item.id} style={s.itemRow}>
                    <TouchableOpacity onPress={() => toggleItemSelection(storeGroup.pharmacy.id, item.id)} style={{ marginRight: 12, marginTop: 4 }}>
                      {selectedItems.has(`${storeGroup.pharmacy.id}_${item.id}`) 
                        ? <CheckSquare color={COLORS.midTeal} size={22} strokeWidth={2.5} />
                        : <Square color="#CBD5E1" size={22} strokeWidth={2.5} />}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.name}</Text>
                      <Text style={s.itemPrice}>LKR {item.pharmacyPrice} / unit</Text>
                    </View>

                    {/* Stepper (- qty +) */}
                    <View style={s.stepperBox}>
                      <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() => updateQuantity(item.id, storeGroup.pharmacy.id, -1)}
                      >
                        <Minus color={COLORS.midTeal} size={13} strokeWidth={3} />
                      </TouchableOpacity>
                      <Text style={s.stepperQty}>{item.qty}</Text>
                      <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() => updateQuantity(item.id, storeGroup.pharmacy.id, 1)}
                      >
                        <Plus color={COLORS.midTeal} size={13} strokeWidth={3} />
                      </TouchableOpacity>
                    </View>

                    <Text style={s.itemTotal}>LKR {item.pharmacyPrice * item.qty}</Text>
                  </View>
                ))}
              </View>

              <View style={s.storeFooter}>
                <View>
                  <Text style={s.subtotalLabel}>Selected Subtotal</Text>
                  <Text style={s.subtotalPrice}>
                    {storeGroup.hasPrescription && selectedItems.has(`${storeGroup.pharmacy.id}_rx`) 
                      ? 'Pending Quote' 
                      : `LKR ${storeSubtotal}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    s.checkoutBtn,
                    (storeSubtotal === 0 && !(storeGroup.hasPrescription && selectedItems.has(`${storeGroup.pharmacy.id}_rx`))) && s.checkoutBtnDisabled
                  ]}
                  disabled={storeSubtotal === 0 && !(storeGroup.hasPrescription && selectedItems.has(`${storeGroup.pharmacy.id}_rx`))}
                  onPress={() => {
                    if (payMethod === 'stripe') {
                      setStoreToCheckout(storeGroup);
                      setShowStripeModal(true);
                    } else {
                      handleCreateOrderForStore(storeGroup);
                    }
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={s.checkoutBtnText}>Place Order</Text>
                </TouchableOpacity>
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
        {cartStores.length > 0 && !attachedPrescription && (
          <PaymentMethodSelector
            selectedMethod={payMethod}
            onSelect={setPayMethod}
          />
        )}
      </Animated.ScrollView>

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        visible={showStripeModal}
        amount={storeToCheckout ? storeToCheckout.items.filter((i: any) => selectedItems.has(`${storeToCheckout.pharmacy.id}_${i.id}`)).reduce((s: number, i: any) => s + i.pharmacyPrice * i.qty, 0) : 0}
        onClose={() => {
          setShowStripeModal(false);
          setStoreToCheckout(null);
        }}
        onSuccess={() => {
          setShowStripeModal(false);
          if (storeToCheckout) {
            handleCreateOrderForStore(storeToCheckout);
          }
          setStoreToCheckout(null);
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
  clearAllBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2',
    justifyContent: 'center', alignItems: 'center',
  },
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
  storeAvatarImage: {
    width: 42, height: 42, borderRadius: 12,
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
    paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderSoft,
  },
  subtotalLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  subtotalPrice: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.textDark },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.midTeal, paddingHorizontal: 16, height: 40, borderRadius: 10,
  },
  checkoutBtnDisabled: {
    backgroundColor: COLORS.borderSoft,
  },
  checkoutBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark },
  emptySub: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  attachedRxCard: {
    backgroundColor: COLORS.limeWhisper,
    padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#D6EDA0',
    marginBottom: 8,
  },
  attachedRxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  attachedRxTitle: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.peacockBlue },
  attachedRxNote: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textDark },
});
