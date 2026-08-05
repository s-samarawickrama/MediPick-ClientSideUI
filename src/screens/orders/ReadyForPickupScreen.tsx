import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, StatusBar, Pressable, Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, MessageSquare, AlertTriangle, ShieldCheck,
  Star, PhoneCall, Wallet, CreditCard, CheckCircle2, Clock, Check
} from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { RateExperienceScreen } from '../../components/common/RateExperienceScreen';
import { StripePaymentModal } from '../../components/common/StripePaymentModal';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_ORDERS } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

import { PaymentMethodSelector } from '../../components/common/PaymentMethodSelector';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'ReadyForPickup'>;

export const ReadyForPickupScreen = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  
  console.log('[ReadyForPickupScreen] Rendered. route params:', route.params);
  
  const order      = MOCK_ORDERS.find((o) => o.id === route.params?.orderId) ?? MOCK_ORDERS[1];
  
  console.log('[ReadyForPickupScreen] Found order:', order?.id);

  const [orderState, setOrderState]           = useState<'PREPARING' | 'READY'>('PREPARING');
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number>(5);
  const [payMethod, setPayMethod]             = useState<'counter' | 'stripe'>('counter');
  const [isPaidOnline, setIsPaidOnline]       = useState<boolean>(route.params?.isPaidOnline ?? false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showRateModal, setShowRateModal]     = useState(false);

  const opacity   = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  // Auto-transition from PREPARING to READY after 5 seconds
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    const interval = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setOrderState('READY');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCancelOrder = () => {
    Alert.alert(
      'Late Cancellation Warning',
      'You are cancelling an order while the pharmacist is preparing it. Proceeding will add 1 Strike to your account. 3 Strikes will limit your ability to pay at the counter.\n\nDo you want to proceed?',
      [
        { text: 'Keep Order', style: 'cancel' },
        { 
          text: 'Cancel Order (Add Strike)', 
          style: 'destructive',
          onPress: () => {
            if (order) order.state = 'CANCELLED';
            Alert.alert('Order Cancelled', 'Your order has been cancelled and 1 Strike has been recorded.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        }
      ]
    );
  };

  const handleExtendPickup = () => {
    Alert.alert('Extension Requested', 'Your 24-hour pickup window has been successfully extended.');
  };

  const otp = order.pickupOtp ?? '849201';

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
      
      {/* Top Header */}
      <View style={s.topZone}>
        <View style={s.nav}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={s.navTitle}>{orderState === 'PREPARING' ? 'Preparing Order...' : 'Ready for Pick Up'}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Order Tracker Bar */}
        <View style={s.trackerCard}>
          <View style={s.trackerHeader}>
            <Text style={s.trackerTitle}>Order Tracker</Text>
            {orderState === 'PREPARING' ? (
              <View style={[s.liveBadge, { backgroundColor: '#FEF3C7' }]}>
                <View style={[s.liveDot, { backgroundColor: '#D97706' }]} />
                <Text style={[s.liveText, { color: '#B45309' }]}>Preparing ({prepSecondsLeft}s)</Text>
              </View>
            ) : (
              <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>Ready for Counter Pickup</Text>
              </View>
            )}
          </View>

          <View style={s.stepperCol}>
            {/* Segment 1: Confirmed -> Preparing */}
            <View style={[
              s.vStepLine, { top: 28 }, 
              (orderState === 'PREPARING' || orderState === 'READY') && s.vStepLineDone
            ]} />
            
            {/* Segment 2: Preparing -> Ready */}
            <View style={[
              s.vStepLine, { top: 76 }, 
              orderState === 'READY' && s.vStepLineDone,
              orderState === 'PREPARING' && s.vStepLineActiveToFuture
            ]} />

            {/* Step 1: Confirmed */}
            <View style={s.vStepItem}>
              <View style={[s.vStepDot, s.vStepDotDone]}>
                <Check color={COLORS.midTeal} size={14} strokeWidth={3} />
              </View>
              <View style={s.vStepTextContainer}>
                <Text style={s.vStepTitleDone}>Order Confirmed</Text>
                <Text style={s.vStepSub}>Your prescription has been accepted</Text>
              </View>
            </View>

            {/* Step 2: Preparing */}
            <View style={s.vStepItem}>
              {orderState === 'PREPARING' ? (
                <View style={[s.vStepDot, s.vStepDotActive]}>
                  <Clock color="#fff" size={14} strokeWidth={2.5} />
                </View>
              ) : (
                <View style={[s.vStepDot, s.vStepDotDone]}>
                  <Check color={COLORS.midTeal} size={14} strokeWidth={3} />
                </View>
              )}
              <View style={s.vStepTextContainer}>
                <Text style={orderState === 'PREPARING' ? s.vStepTitleActive : s.vStepTitleDone}>Pharmacist Preparing</Text>
                <Text style={s.vStepSub}>Packaging your items safely</Text>
              </View>
            </View>

            {/* Step 3: Ready */}
            <View style={s.vStepItem}>
              {orderState === 'READY' ? (
                <View style={[s.vStepDot, s.vStepDotActive]}>
                  <Clock color="#fff" size={14} strokeWidth={2.5} />
                </View>
              ) : (
                <View style={s.vStepDot}>
                  <Clock color="#94A3B8" size={14} strokeWidth={2.5} />
                </View>
              )}
              <View style={s.vStepTextContainer}>
                <Text style={orderState === 'READY' ? s.vStepTitleActive : s.vStepTitle}>Ready for Pickup</Text>
                <Text style={s.vStepSub}>Waiting for you at the counter</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ticket Pass Card */}
        <Animated.View style={[s.ticket, { transform: [{ scale: cardScale }] }]}>
          <View style={s.ticketBadge}>
            <ShieldCheck color={COLORS.midTeal} size={14} strokeWidth={2.5} />
            <Text style={s.ticketBadgeText}>Order #{order.orderNumber || 'MP123456'}</Text>
          </View>

          {orderState === 'PREPARING' ? (
            <View style={{ alignItems: 'center', paddingVertical: 16, gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center' }}>
                <Clock color={COLORS.midTeal} size={22} strokeWidth={2.2} />
              </View>
              <Text style={{ fontFamily: FONTS.black, fontSize: 16, color: COLORS.textDark, textAlign: 'center' }}>
                Pharmacist is Packaging Your Order
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 }}>
                The licensed pharmacy staff is assembling your items. Your 6-digit counter pickup OTP will display automatically once ready (in {prepSecondsLeft}s).
              </Text>

            </View>
          ) : (
            <>
              <Text style={s.ticketHint}>Show this 6-digit OTP code at pharmacy counter</Text>
              {/* 6-Digit OTP */}
              <View style={s.otpContainer}>
                <View style={s.otpRow}>
                  {otp.split('').map((d, i) => (
                    <View key={i} style={s.otpCell}>
                      <Text style={s.otpDigit}>{d}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* Pharmacy Details Box */}
        <View style={s.pharmacyBox}>
          <View style={{ flex: 1 }}>
            <Text style={s.pharmName}>{order.pharmacy?.name || 'MediCare Central Pharmacy'}</Text>
            <Text style={s.pharmSub}>Online · Ready for Pickup</Text>
          </View>

          <View style={s.contactRow}>
            <TouchableOpacity 
              style={s.chatIconBtn} 
              onPress={() => navigation.navigate('PharmacyChat', { orderId: order.id })}
            >
              <MessageSquare color={COLORS.midTeal} size={18} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity style={s.callIconBtn}>
              <PhoneCall color={COLORS.midTeal} size={18} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={s.paySection}>
          {isPaidOnline ? (
            <View style={s.paidCard}>
              <CheckCircle2 color={COLORS.midTeal} size={22} strokeWidth={2.5} />
              <View style={{ flex: 1 }}>
                <Text style={s.paidTitle}>Payment Completed</Text>
                <Text style={s.paidSub}>LKR {order.totalAmount || 500} paid via Stripe Online</Text>
              </View>
            </View>
          ) : (
            <>
              <PaymentMethodSelector
                selectedMethod={payMethod}
                onSelect={setPayMethod}
              />

              {payMethod === 'stripe' && (
                <Button
                  title="Pay Now"
                  variant="primary"
                  icon={<CreditCard color="#fff" size={16} strokeWidth={2} />}
                  style={{ marginTop: 4 }}
                  onPress={() => setShowStripeModal(true)}
                />
              )}
            </>
          )}
        </View>

        {/* Rate & Report */}
        <Button
          title="Rate Experience"
          variant="primary"
          icon={<Star color="#fff" size={16} strokeWidth={2.5} />}
          onPress={() => setShowRateModal(true)}
          style={{ marginTop: 6 }}
        />

        <Button
          title="Report an Issue"
          variant="ghost"
          icon={<AlertTriangle color={COLORS.error} size={16} strokeWidth={2} />}
          onPress={() => navigation.navigate('ReportIssue', { orderId: order.id })}
          textStyle={{ color: COLORS.error }}
        />

        {orderState === 'PREPARING' && (
          <Button
            title="Cancel Order"
            variant="ghost"
            onPress={handleCancelOrder}
            textStyle={{ color: COLORS.error }}
            style={{ marginTop: 24, borderColor: COLORS.error, borderWidth: 1 }}
          />
        )}

        {orderState === 'READY' && isPaidOnline && (
          <Button
            title="Extend Pickup Time (24h)"
            variant="outline"
            icon={<Clock color={COLORS.midTeal} size={16} strokeWidth={2} />}
            onPress={handleExtendPickup}
            style={{ marginTop: 24 }}
          />
        )}

        {orderState === 'READY' && !isPaidOnline && (
          <Text style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: COLORS.textMuted, paddingHorizontal: 20 }}>
            Cannot extend pickup time automatically for unpaid orders. Please message the pharmacy if you need an extension.
          </Text>
        )}
      </Animated.ScrollView>

      {/* Rating Modal */}
      <RateExperienceScreen
        visible={showRateModal}
        onClose={() => setShowRateModal(false)}
        pharmacyName={order.pharmacy?.name || 'MediCare Central Pharmacy'}
      />

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        visible={showStripeModal}
        amount={order.totalAmount || 500}
        onClose={() => setShowStripeModal(false)}
        onSuccess={() => {
          setShowStripeModal(false);
          setIsPaidOnline(true);
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },
  topZone: {
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: COLORS.bgWarm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  nav: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark },
  scroll: { padding: 20, paddingBottom: 60, gap: 14 },

  ticket: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 20, padding: 20,
    borderWidth: 1.5, borderColor: COLORS.borderSoft, gap: 14, alignItems: 'center',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 14, elevation: 3,
  },
  ticketBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
  },
  ticketBadgeText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.midTeal },
  ticketHint: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  otpContainer: { width: '100%', alignItems: 'center' },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpCell: {
    width: 44, height: 50, borderRadius: 12,
    backgroundColor: COLORS.limeWhisper, borderWidth: 1.5, borderColor: '#D6EDA0',
    justifyContent: 'center', alignItems: 'center',
  },
  otpDigit: { fontFamily: FONTS.black, fontSize: 22, color: COLORS.midTeal },

  pharmacyBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderSoft, gap: 12,
  },
  pharmName: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  pharmSub: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  contactRow: { flexDirection: 'row', gap: 8 },
  chatIconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  callIconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.midTealLight, justifyContent: 'center', alignItems: 'center',
  },

  // Payment section
  paySection: { gap: 10 },
  paySectionTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  payOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surfaceWhite, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.borderSoft,
  },
  payOptionSelected: { borderColor: COLORS.midTeal, backgroundColor: COLORS.midTealLight },
  payOptionTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  payOptionSub: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  radioDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.borderSoft, backgroundColor: COLORS.surfaceWhite,
  },
  radioDotSelected: { borderColor: COLORS.midTeal, backgroundColor: COLORS.midTeal },

  paidCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.limeWhisper, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#D6EDA0',
  },
  paidTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.midTeal },
  paidSub: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textDark, marginTop: 2 },

  // Tracker Card
  trackerCard: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.borderSoft, gap: 14,
  },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackerTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.midTeal },
  liveText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.midTeal },

  stepperCol: { position: 'relative', marginTop: 10, gap: 20 },
  vStepLine: { position: 'absolute', left: 13, width: 2, height: 20, backgroundColor: '#F1F5F9' },
  vStepLineDone: { backgroundColor: COLORS.limeWhisper },
  vStepLineActiveToFuture: { 
    borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', 
    backgroundColor: 'transparent', width: 1, left: 13.5
  },
  
  vStepItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  vStepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', // light gray for future
    justifyContent: 'center', alignItems: 'center', zIndex: 2,
  },
  vStepDotDone: { backgroundColor: COLORS.limeWhisper },
  vStepDotActive: { backgroundColor: COLORS.midTeal },

  vStepTextContainer: { flex: 1, justifyContent: 'center' },
  vStepTitle: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  vStepTitleDone: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textDark },
  vStepTitleActive: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.midTeal },
  vStepSub: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
