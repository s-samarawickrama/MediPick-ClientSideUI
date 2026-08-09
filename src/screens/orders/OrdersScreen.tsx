import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Image, Platform
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Store, Clock, Package, Navigation2, FileText, Pill, Receipt, Camera, Star, ChevronRight, Phone, MessageCircle } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { useOrders } from '../../context/OrderContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Order } from '../../types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ─── Status config ───────────────────────────────────────────────
function getStatusHeadline(state: string): string {
  if (state === 'COMPLETED')                     return 'Order Completed';
  if (state === 'CANCELLED' || state === 'CLOSED' || state === 'REJECTED') return 'Order Declined';
  if (state === 'READY_FOR_PICKUP')              return 'Ready for Counter Pickup';
  if (state === 'PREPARING')                     return 'Pharmacist is Packaging';
  if (state === 'WAITING_CUSTOMER_CONFIRMATION') return 'Quote Ready to Review';
  if (state === 'WAITING_PHARMACY_CONFIRMATION') return 'Under Pharmacist Review';
  if (state === 'REUPLOAD_REQUESTED')            return 'Action Required';
  if (state === 'ISSUE_REPORTED')                return 'Issue Reported';
  return 'Order Confirmed';
}

function getStatusSub(state: string): string {
  if (state === 'COMPLETED')                     return 'You have successfully picked up this order';
  if (state === 'CANCELLED' || state === 'CLOSED' || state === 'REJECTED') return 'This order was cancelled or declined';
  if (state === 'READY_FOR_PICKUP')              return 'Show your OTP code at the pharmacy counter';
  if (state === 'PREPARING')                     return 'Your medicines are being carefully prepared';
  if (state === 'WAITING_CUSTOMER_CONFIRMATION') return 'Tap to view and confirm your quote';
  if (state === 'WAITING_PHARMACY_CONFIRMATION') return 'Waiting for pharmacy to send a quote';
  if (state === 'REUPLOAD_REQUESTED')            return 'The pharmacist requested a clearer photo';
  if (state === 'ISSUE_REPORTED')                return 'Pharmacy is reviewing your reported issue';
  return 'Your prescription has been received';
}

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    // @ts-ignore - dynamic require for native Alert
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};

// ─── Active Order Card ─────────────────────────────────────────
const ActiveOrderCard = ({
  order,
  onPress,
  onAction,
  onReportIssue,
}: {
  order: Order;
  onPress: () => void;
  onAction: () => void;
  onReportIssue?: () => void;
}) => {
  const isReady = order.state === 'READY_FOR_PICKUP';
  const isQuote = order.state === 'WAITING_CUSTOMER_CONFIRMATION';
  const isCompleted = order.state === 'COMPLETED';
  const isCancelled = ['CANCELLED', 'CLOSED', 'REJECTED'].includes(order.state);
  const isActive = !isCompleted && !isCancelled;
  const isRecentCompleted = isCompleted && !order.refundStatus && !order.rejectReason && new Date(order.createdAt).getTime() > Date.now() - 24 * 3600 * 1000;

  // Dynamic Card Styles
  let cardBg = COLORS.surfaceWhite;
  let cardBorder = COLORS.borderSoft; // Default gray border
  
  if (isReady) {
    cardBg = '#F8FAFC';
    cardBorder = COLORS.softLime; // Dynamic lime pop for ready
  } else if (isCompleted) {
    cardBorder = '#D1FAE5';
  } else if (isCancelled) {
    cardBorder = '#FECACA';
  } else if (order.state === 'REUPLOAD_REQUESTED') {
    cardBorder = COLORS.borderSoft; // Keep it clean, rely on the red button for attention
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[s.activeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      {/* Header Row: Pharmacy info + Live badge */}
      <View style={s.activeCardHeaderRow}>
        <View style={s.pharmAvatar}>
          {order.pharmacy?.image ? (
            <Image source={order.pharmacy.image} style={s.pharmAvatarImage} />
          ) : (
            <Store color={COLORS.midTeal} size={20} strokeWidth={2} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pharmName}>{order.pharmacy?.name ?? 'MediPick Pharmacy'}</Text>
          <Text style={s.pharmType}>
            {order.orderType === 'PRESCRIPTION' ? 'Prescription Order'
              : order.orderType === 'MIXED' ? 'Prescription + OTC' : 'OTC Order'}
          </Text>
        </View>
        
        {isActive ? (
          <View style={[s.liveBadgePill, isReady && s.liveBadgePillReady]}>
            <View style={s.liveDotSmall} />
            <Text style={s.liveBadgeText}>{isReady ? 'Ready' : 'Live'}</Text>
          </View>
        ) : isCompleted ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {order.refundStatus === 'REFUNDED' && (
              <View style={[s.liveBadgePill, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[s.liveBadgeText, { color: COLORS.textMuted }]}>Refunded</Text>
              </View>
            )}
            {!!order.rejectReason && (
              <View style={[s.liveBadgePill, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[s.liveBadgeText, { color: COLORS.error }]}>Rejected</Text>
              </View>
            )}
            <View style={[s.liveBadgePill, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[s.liveBadgeText, { color: COLORS.midTeal }]}>Completed</Text>
            </View>
          </View>
        ) : (
          <View style={[s.liveBadgePill, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[s.liveBadgeText, { color: COLORS.error }]}>Declined</Text>
          </View>
        )}
      </View>

      {/* Status headline */}
      <View style={s.statusBlock}>
        <View style={s.statusTextCol}>
          <Text style={[s.statusHeadline, isReady && { color: COLORS.midTeal }, (isCancelled || order.state === 'REUPLOAD_REQUESTED') && { color: COLORS.error }]}>
            {getStatusHeadline(order.state)}
          </Text>
          <Text style={s.statusSub}>{getStatusSub(order.state)}</Text>
        </View>
        <ChevronRight color={COLORS.textMuted} size={20} strokeWidth={2.5} style={{ opacity: 0.5 }} />
      </View>

      {/* Footer */}
      <View style={s.activeCardFooter}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={s.footerLabel}>Total</Text>
          <Text style={s.footerPrice}>LKR {(order.totalAmount || 0).toLocaleString()}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isReady ? (
            <TouchableOpacity style={[s.footerBtn, s.btnTeal]} onPress={onAction}>
              <Text style={[s.footerBtnText, s.btnTealText]}>Show Pickup Code</Text>
            </TouchableOpacity>
          ) : isQuote ? (
            <TouchableOpacity style={[s.footerBtn, s.btnPurple]} onPress={onAction}>
              <Text style={[s.footerBtnText, s.btnPurpleText]}>Review Quote</Text>
            </TouchableOpacity>
          ) : isCompleted ? (
            <>
              {isRecentCompleted && onReportIssue && (
                <TouchableOpacity style={[s.footerBtn, s.btnLightGray, { marginRight: 'auto' }]} onPress={onReportIssue}>
                  <Text style={[s.footerBtnText, s.btnLightGrayText]}>Report Issue</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.footerBtn, s.btnTeal]} onPress={() => showAlert('Added to Cart', 'Items have been added to your cart for reorder.')}>
                <Text style={[s.footerBtnText, s.btnTealText]}>Reorder</Text>
              </TouchableOpacity>
            </>
          ) : isCancelled || order.state === 'WAITING_PHARMACY_CONFIRMATION' ? (
            <View />
          ) : order.state === 'REUPLOAD_REQUESTED' ? (
            <TouchableOpacity style={[s.footerBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444', borderWidth: 1 }]} onPress={onAction}>
              <Text style={[s.footerBtnText, { color: '#FFFFFF' }]}>Re-upload</Text>
            </TouchableOpacity>
          ) : order.state === 'ISSUE_REPORTED' ? (
            <TouchableOpacity style={[s.footerBtn, { backgroundColor: '#EF4444' }]} onPress={onAction}>
              <Text style={[s.footerBtnText, { color: '#FFF' }]}>Message Pharmacy</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.footerBtn, s.btnGray]} onPress={onAction}>
              <Text style={[s.footerBtnText, s.btnGrayText]}>Track Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const OrdersScreen = () => {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [tab, setTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const { orders } = useOrders();
  const activeOrders    = orders.filter((o) => !['COMPLETED', 'CANCELLED', 'CLOSED', 'REJECTED'].includes(o.state));
  const completedOrders = orders.filter((o) => o.state === 'COMPLETED');
  const cancelledOrders = orders.filter((o) => ['CANCELLED', 'CLOSED', 'REJECTED'].includes(o.state));

  const displayed =
    tab === 'active' ? activeOrders :
    tab === 'completed' ? completedOrders :
    cancelledOrders;

  const goToOrderDetails = (o: Order) => {
    navigation.navigate('OrderDetails', { orderId: o.id });
  };

  const goToTracker = (o: Order) => {
    if (['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED', 'SUBMITTED'].includes(o.state)) {
      navigation.navigate('ReadyForPickup', { orderId: o.id });
    } else if (o.state === 'WAITING_CUSTOMER_CONFIRMATION') {
      navigation.navigate('Quotation', { orderId: o.id });
    } else if (o.state === 'REUPLOAD_REQUESTED') {
      navigation.navigate('UploadPrescription', { pharmacyId: o.pharmacy?.id, pharmacyName: o.pharmacy?.name });
    } else if (o.state === 'ISSUE_REPORTED') {
      navigation.navigate('PharmacyChat', { orderId: o.id });
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Orders</Text>
        {activeOrders.length > 0 && (
          <View style={s.headerLiveBadge}>
            <View style={s.headerLiveDot} />
            <Text style={s.headerLiveText}>{activeOrders.length} Live</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {(
          [
            { key: 'active',    label: 'Active',    count: activeOrders.length },
            { key: 'completed', label: 'Completed', count: completedOrders.length },
            { key: 'cancelled', label: 'Declined',  count: cancelledOrders.length },
          ] as { key: 'active' | 'completed' | 'cancelled'; label: string; count: number }[]
        ).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
            {t.count > 0 && (
              <View style={[s.tabCountBadge, tab === t.key && s.tabCountBadgeActive]}>
                <Text style={[s.tabCountText, tab === t.key && s.tabCountTextActive]}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {displayed.map((o) => (
          <ActiveOrderCard 
            key={o.id} 
            order={o} 
            onPress={() => goToOrderDetails(o)} 
            onAction={() => goToTracker(o)} 
            onReportIssue={() => navigation.navigate('ReportIssue', { orderId: o.id })}
          />
        ))}

        {displayed.length === 0 && (
          <View style={s.emptyWrap}>
            <Package color={COLORS.textMuted} size={44} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>No {tab} orders</Text>
            <Text style={s.emptySub}>Your pharmacy orders will appear here</Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },

  header: {
    backgroundColor: COLORS.bgWarm, paddingTop: 52, paddingBottom: 14,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  headerTitle: { fontFamily: FONTS.black, fontSize: 26, color: COLORS.textDark, letterSpacing: -0.6, flex: 1 },
  headerLiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#A7F3D0',
  },
  headerLiveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.midTeal },
  headerLiveText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.midTeal },

  // Tabs
  tabsRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20,
    paddingVertical: 12, backgroundColor: COLORS.surfaceWhite,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: COLORS.borderSoft, backgroundColor: COLORS.bgWarm,
  },
  tabBtnActive: { borderColor: COLORS.midTeal, backgroundColor: COLORS.midTeal },
  tabText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textMuted },
  tabTextActive: { color: '#fff' },
  tabCountBadge: {
    backgroundColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  tabCountBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontFamily: FONTS.black, fontSize: 10, color: COLORS.textMuted },
  tabCountTextActive: { color: '#fff' },

  scroll: { padding: 16, paddingBottom: 100, gap: 16 },

  // ── Active Order Card ───────────────────────────────────────
  activeCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#1C1917', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    marginBottom: 16, overflow: 'hidden',
  },
  activeCardHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  pharmAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
  },
  pharmAvatarImage: { width: '100%', height: '100%', borderRadius: 14 },
  pharmAvatarText: { fontFamily: FONTS.black, fontSize: 16, color: COLORS.textMuted },
  pharmName: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.textDark },
  pharmType: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  
  liveBadgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgePillReady: { backgroundColor: COLORS.limeWhisper },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.midTeal },
  liveBadgeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.midTeal },

  statusBlock: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 20 },
  statusIconWrapper: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  statusTextCol: { flex: 1 },
  statusHeadline: {
    fontFamily: FONTS.extrabold, fontSize: 16, color: COLORS.textDark,
    letterSpacing: -0.3, marginBottom: 2,
  },
  statusSub: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },

  activeCardFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: COLORS.borderSoft,
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
  },
  footerLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  footerPrice: { fontFamily: FONTS.black, fontSize: 16, color: COLORS.textDark },
  
  footerBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  footerBtnText: { fontFamily: FONTS.bold, fontSize: 13 },
  btnTeal: { backgroundColor: COLORS.midTeal },
  btnTealText: { color: '#FFFFFF' },
  btnPurple: { backgroundColor: COLORS.deepPlum },
  btnPurpleText: { color: '#FFFFFF' },
  btnGray: { backgroundColor: '#0F172A' },
  btnGrayText: { color: '#FFFFFF' },
  btnLightGray: { backgroundColor: '#E2E8F0' },
  btnLightGrayText: { color: COLORS.textDark },

  // ── History Cards ─────────────────────────────────────────────
  historyCard: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.borderSoft, gap: 10,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
  },
  historyCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.bgWarm, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  historyAvatarImage: { width: '100%', height: '100%', borderRadius: 11 },
  historyPharmName: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  historyMeta: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  doneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  doneChipText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.midTeal },
  cancelChip: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1, borderColor: '#E2E8F0',
  },
  cancelChipText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.textMuted },
  reorderBtn: {
    alignSelf: 'flex-end', backgroundColor: COLORS.bgWarm,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  reorderBtnText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.textDark },

  // ── Empty ─────────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.textDark },
  emptySub: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});


