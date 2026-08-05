const fs = require('fs');
const code = `import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Pressable, Image, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShoppingCart, Plus, Minus, ChevronLeft, Store, CreditCard, Trash2, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_PHARMACIES, MOCK_MEDICINES } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const DEMO_CART_STORES = [
  {
    id: 's1', pharmacy: MOCK_PHARMACIES[0], state: 'normal',
    items: [{ ...MOCK_MEDICINES[0], qty: 2 }], hasPrescription: false
  },
  {
    id: 's2', pharmacy: MOCK_PHARMACIES[1], state: 'pending',
    items: [], hasPrescription: true
  },
  {
    id: 's3', pharmacy: MOCK_PHARMACIES[2], state: 'pending',
    items: [{ ...MOCK_MEDICINES[1], qty: 1 }], hasPrescription: true
  },
  {
    id: 's4', pharmacy: MOCK_PHARMACIES[3], state: 'replied',
    items: [{ ...MOCK_MEDICINES[2], qty: 3, pharmacyPrice: 450 }],
    hasPrescription: true, discount: 150, subtotal: 1350, grandTotal: 1200
  },
  {
    id: 's5', pharmacy: MOCK_PHARMACIES[0], state: 'reupload',
    items: [], hasPrescription: true,
    reason: "The uploaded prescription image is too blurry. Please upload a clear photo of the original prescription."
  },
  {
    id: 's6', pharmacy: MOCK_PHARMACIES[1], state: 'rejected',
    items: [], hasPrescription: true,
    reason: "We are currently out of stock for the requested medications in your prescription."
  }
];

export const MultiStoreCartScreen = () => {
  const navigation = useNavigation<Nav>();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const renderStateBanner = (store: any) => {
    switch(store.state) {
      case 'pending':
        return (
          <View style={[s.stateBanner, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Clock color="#D97706" size={16} strokeWidth={2.5} />
            <Text style={[s.stateBannerText, { color: '#D97706' }]}>Awaiting Pharmacy Quotation</Text>
          </View>
        );
      case 'replied':
        return (
          <View style={[s.stateBanner, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
            <CheckCircle2 color="#16A34A" size={16} strokeWidth={2.5} />
            <Text style={[s.stateBannerText, { color: '#16A34A' }]}>Quotation Ready for Confirmation</Text>
          </View>
        );
      case 'reupload':
        return (
          <View style={[s.stateBanner, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
            <AlertCircle color="#DC2626" size={16} strokeWidth={2.5} />
            <Text style={[s.stateBannerText, { color: '#DC2626' }]}>Action Required: Re-upload Prescription</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[s.stateBanner, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
            <XCircle color="#4B5563" size={16} strokeWidth={2.5} />
            <Text style={[s.stateBannerText, { color: '#4B5563' }]}>Order Rejected</Text>
          </View>
        );
      default: return null;
    }
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Orders & Quotations</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView style={{ opacity, flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {DEMO_CART_STORES.map((storeGroup) => {
          return (
            <View key={storeGroup.id} style={s.storeCard}>
              {renderStateBanner(storeGroup)}
              <View style={s.storeCardHeader}>
                {storeGroup.pharmacy.image ? (
                  <Image source={storeGroup.pharmacy.image} style={s.storeAvatarImage} />
                ) : (
                  <View style={s.storeAvatar}>
                    <Text style={s.storeInitial}>{storeGroup.pharmacy.name[0]}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.storeName}>{storeGroup.pharmacy.name}</Text>
                  <Text style={s.storeMeta}>{storeGroup.pharmacy.address}</Text>
                </View>
                {storeGroup.state === 'normal' && (
                  <TouchableOpacity style={s.removeStoreBtn}>
                    <Trash2 color={COLORS.error} size={16} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.divider} />

              {(storeGroup.reason) && (
                <View style={s.reasonBox}>
                  <Text style={s.reasonText}>{storeGroup.reason}</Text>
                  {storeGroup.state === 'reupload' && (
                    <TouchableOpacity style={s.actionBtnMain} activeOpacity={0.8}>
                      <Text style={s.actionBtnMainText}>Re-upload Prescription</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={s.itemList}>
                {storeGroup.hasPrescription && (
                  <View style={s.attachedRxCard}>
                    <View style={s.attachedRxHeader}>
                      <FileText color={COLORS.peacockBlue} size={20} strokeWidth={2} />
                      <Text style={s.attachedRxTitle}>Attached Prescription</Text>
                    </View>
                    <Text style={s.attachedRxNote}>Note: Please provide generic alternatives if possible.</Text>
                    {storeGroup.state === 'pending' && <Text style={s.itemPrice}>(Price will be quoted by pharmacy)</Text>}
                  </View>
                )}
                {storeGroup.items.map((item, idx) => (
                  <View key={idx} style={s.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.name}</Text>
                      {storeGroup.state === 'replied' ? (
                        <Text style={s.itemPrice}>LKR {item.pharmacyPrice} x {item.qty}</Text>
                      ) : storeGroup.state === 'normal' ? (
                        <Text style={s.itemPrice}>LKR {item.pharmacyPrice} / unit</Text>
                      ) : null}
                    </View>
                    {storeGroup.state === 'normal' && (
                      <View style={s.stepperBox}>
                        <TouchableOpacity style={s.stepperBtn}><Minus color={COLORS.midTealDark} size={14} strokeWidth={2.5} /></TouchableOpacity>
                        <Text style={s.stepperQty}>{item.qty}</Text>
                        <TouchableOpacity style={s.stepperBtn}><Plus color={COLORS.midTealDark} size={14} strokeWidth={2.5} /></TouchableOpacity>
                      </View>
                    )}
                    {storeGroup.state === 'normal' && <Text style={s.itemTotal}>LKR {item.pharmacyPrice * item.qty}</Text>}
                    {storeGroup.state === 'replied' && <Text style={s.itemTotal}>LKR {item.pharmacyPrice * item.qty}</Text>}
                  </View>
                ))}
              </View>

              {storeGroup.state === 'replied' && (
                <View style={s.quotationSummary}>
                  <View style={s.summaryRow}><Text style={s.summaryLabel}>Subtotal</Text><Text style={s.summaryVal}>LKR {storeGroup.subtotal}</Text></View>
                  <View style={s.summaryRow}><Text style={s.summaryLabel}>Special Discount</Text><Text style={s.summaryValDiscount}>- LKR {storeGroup.discount}</Text></View>
                  <View style={[s.summaryRow, s.grandRow]}><Text style={s.grandLabel}>Quotation Total</Text><Text style={s.grandVal}>LKR {storeGroup.grandTotal}</Text></View>
                  
                  <View style={s.actionRow}>
                    <TouchableOpacity style={s.actionBtnSecondary}><Text style={s.actionBtnSecondaryText}>Decline</Text></TouchableOpacity>
                    <TouchableOpacity style={s.actionBtnPrimary}><Text style={s.actionBtnPrimaryText}>Accept & Pay</Text></TouchableOpacity>
                  </View>
                </View>
              )}

              {storeGroup.state === 'normal' && (
                <View style={s.storeFooter}>
                  <Text style={s.subtotalLabel}>Store Subtotal</Text>
                  <Text style={s.subtotalPrice}>LKR {storeGroup.items.reduce((s, i) => s + i.pharmacyPrice * i.qty, 0)}</Text>
                </View>
              )}
            </View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },
  nav: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: COLORS.bgWarm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceWhite, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderSoft },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.black, fontSize: 16, color: COLORS.textDark },
  scroll: { padding: 20, paddingBottom: 120, gap: 16 },

  storeCard: { backgroundColor: COLORS.surfaceWhite, borderRadius: 20, padding: 16, gap: 12, shadowColor: '#1C1917', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, overflow: 'hidden' },
  stateBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  stateBannerText: { fontFamily: FONTS.bold, fontSize: 12 },
  
  storeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storeAvatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center' },
  storeAvatarImage: { width: 42, height: 42, borderRadius: 12 },
  storeInitial: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.midTeal },
  storeName: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.textDark },
  storeMeta: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  removeStoreBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: COLORS.borderSoft },

  reasonBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  reasonText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textDark, lineHeight: 18 },
  actionBtnMain: { backgroundColor: COLORS.peacockBlue, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  actionBtnMainText: { fontFamily: FONTS.bold, fontSize: 13, color: '#FFF' },

  itemList: { gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemName: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textDark },
  itemPrice: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  
  stepperBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F1F5F9', borderRadius: 100, paddingHorizontal: 6, height: 32 },
  stepperBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  stepperQty: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark, minWidth: 16, textAlign: 'center' },
  itemTotal: { fontFamily: FONTS.black, fontSize: 14, color: COLORS.textDark, minWidth: 60, textAlign: 'right' },

  storeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.borderSoft },
  subtotalLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  subtotalPrice: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.midTeal },

  quotationSummary: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, marginTop: 4, gap: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  summaryVal: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.textDark },
  summaryValDiscount: { fontFamily: FONTS.bold, fontSize: 13, color: '#16A34A' },
  grandRow: { paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  grandLabel: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  grandVal: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark },
  
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  actionBtnSecondary: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderSoft, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  actionBtnSecondaryText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textDark },
  actionBtnPrimary: { flex: 1, height: 44, borderRadius: 12, backgroundColor: COLORS.midTeal, justifyContent: 'center', alignItems: 'center' },
  actionBtnPrimaryText: { fontFamily: FONTS.bold, fontSize: 13, color: '#FFF' },

  attachedRxCard: { backgroundColor: COLORS.limeWhisper, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#D6EDA0', marginBottom: 8 },
  attachedRxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  attachedRxTitle: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.peacockBlue },
  attachedRxNote: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textDark },
});
`;
fs.writeFileSync('src/screens/cart/MultiStoreCartScreen.tsx', code, 'utf8');
