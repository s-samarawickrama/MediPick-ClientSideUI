import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, StatusBar, Image, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, MapPin, Receipt, ShieldCheck, CheckCircle2, XCircle, Clock, ChevronRight, FileText, Plus, Phone, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_ORDERS } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Button } from '../../components/common/Button';
import { AlertTriangle } from 'lucide-react-native';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'OrderDetails'>;

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    // @ts-ignore - dynamic require for native Alert
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};

export const OrderDetailsScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const opacity = useRef(new Animated.Value(0)).current;

  const orderId = route.params?.orderId;
  const order = MOCK_ORDERS.find((o) => o.id === orderId) ?? MOCK_ORDERS[0];

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

  const isCompleted = order.state === 'COMPLETED';
  const isCancelled = ['CANCELLED', 'CLOSED', 'REJECTED'].includes(order.state);
  const isReupload  = order.state === 'REUPLOAD_REQUESTED';
  const isQuote     = order.state === 'WAITING_CUSTOMER_CONFIRMATION';
  const isActive = !isCompleted && !isCancelled;

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Order {order.orderNumber}</Text>
          <View style={s.statusTag}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isCompleted ? COLORS.midTeal : isCancelled ? '#EF4444' : COLORS.midTeal }} />
            <Text style={s.statusTagText}>
              {isCompleted ? 'Completed' : isCancelled ? 'Declined' : 'Live'}
            </Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Rejection / Reupload Banner */}
        {(isCancelled || isReupload) && order.rejectReason && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: isCancelled ? '#FEF2F2' : '#E6DFE8', 
            borderRadius: 16, padding: 14,
            borderWidth: 1, borderColor: isCancelled ? '#FECACA' : '#D4C9D6', 
            marginBottom: 16,
          }}>
            <FileText color={isCancelled ? '#EF4444' : COLORS.deepPlum} size={24} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: isCancelled ? '#B91C1C' : COLORS.deepPlum }}>
                {isReupload ? 'Action Required: Image Unclear' : 'Order Declined'}
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: isCancelled ? COLORS.textMuted : COLORS.deepPlum, marginTop: 1, opacity: 0.9 }}>
                {isReupload && <Text style={{ color: '#EF4444', fontFamily: FONTS.bold }}>23h 59m remaining to re-upload. </Text>}
                {order.rejectReason}
              </Text>
            </View>
            {isReupload && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                }}
                onPress={() => navigation.navigate('UploadPrescription', { pharmacyId: order.pharmacy?.id, pharmacyName: order.pharmacy?.name })}
              >
                <Plus color="#FFF" size={14} strokeWidth={3} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#FFFFFF' }}>Re-upload</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Confirm Quote Banner */}
        {isQuote && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: '#E6DFE8', borderRadius: 16, padding: 14,
            borderWidth: 1, borderColor: '#D4C9D6', marginBottom: 16,
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

        {/* Pharmacy Info */}
        <TouchableOpacity 
          style={s.card} 
          activeOpacity={0.7}
          onPress={() => {
            if (order.pharmacy?.id) {
              navigation.navigate('Tabs', { 
                screen: 'Browse', 
                params: { initialMode: 'pharmacies', storeId: order.pharmacy.id } 
              });
            }
          }}
        >
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Pharmacy</Text>
          </View>
          <View style={s.pharmacyRow}>
            {order.pharmacy?.image ? (
              <Image source={order.pharmacy.image} style={s.pharmAvatar} />
            ) : (
              <View style={[s.pharmAvatar, { backgroundColor: COLORS.limeWhisper }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.pharmName}>{order.pharmacy?.name}</Text>
              <Text style={s.pharmAddress}>{order.pharmacy?.address}</Text>
            </View>
            {isActive ? (
              <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
                <TouchableOpacity 
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center' }}
                  onPress={(e) => { e.stopPropagation(); showAlert('Call', 'Calling pharmacy...'); }}
                >
                  <Phone color={COLORS.midTeal} size={16} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center' }}
                  onPress={(e) => { e.stopPropagation(); showAlert('Chat', 'Opening chat...'); }}
                >
                  <MessageCircle color={COLORS.midTeal} size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ) : (
              <ChevronRight color={COLORS.borderSoft} size={20} />
            )}
          </View>
        </TouchableOpacity>

        {/* Prescription Images (if applicable) */}
        {(order.orderType === 'PRESCRIPTION' || order.orderType === 'MIXED') && (
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Uploaded Prescriptions</Text>
            </View>
            <View style={s.prescriptionGrid}>
              <TouchableOpacity 
                style={s.prescriptionPlaceholder}
                activeOpacity={0.7}
                onPress={() => showAlert('Prescription', 'Opening high-res prescription image viewer...')}
              >
                <FileText color={COLORS.midTeal} size={28} style={{ opacity: 0.5 }} />
                <Text style={s.prescriptionPlaceholderText}>Page 1</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={s.prescriptionPlaceholder}
                activeOpacity={0.7}
                onPress={() => showAlert('Prescription', 'Opening high-res prescription image viewer...')}
              >
                <FileText color={COLORS.midTeal} size={28} style={{ opacity: 0.5 }} />
                <Text style={s.prescriptionPlaceholderText}>Page 2</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Order Items</Text>
          </View>
          <View style={s.itemsList}>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <View key={index} style={s.itemRow}>
                  <View style={s.itemQtyBox}>
                    <Text style={s.itemQty}>{item.quantity}x</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{item.medicine.name}</Text>
                    {item.medicine.genericName && (
                      <Text style={s.itemSub}>{item.medicine.genericName}</Text>
                    )}
                  </View>
                  <Text style={s.itemPrice}>LKR {item.price * item.quantity}</Text>
                </View>
              ))
            ) : (
              <Text style={s.noItemsText}>Prescription-only order or items not listed.</Text>
            )}
          </View>

          {/* Totals */}
          <View style={s.totalsDivider} />
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Subtotal</Text>
            <Text style={s.totalsValue}>LKR {order.totalMrp}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Discount</Text>
            <Text style={[s.totalsValue, { color: COLORS.midTeal }]}>- LKR {order.totalMrp - order.totalAmount}</Text>
          </View>
          <View style={[s.totalsRow, { marginTop: 12 }]}>
            <Text style={s.grandTotalLabel}>Total Paid</Text>
            <Text style={s.grandTotalValue}>LKR {order.totalAmount}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionsWrapper}>
          {isActive ? (
            order.state === 'WAITING_PHARMACY_CONFIRMATION' ? (
              <Button 
                title="Waiting for Pharmacy Quote..." 
                variant="secondary" 
                onPress={() => {}} 
                disabled 
              />
            ) : (
              <Button 
                title={order.state === 'WAITING_CUSTOMER_CONFIRMATION' ? "Review Quotation" : "Track Order Status"}
                variant="primary" 
                onPress={() => {
                  if (order.state === 'WAITING_CUSTOMER_CONFIRMATION') {
                    navigation.navigate('Quotation', { orderId: order.id });
                  } else {
                    navigation.navigate('ReadyForPickup', { orderId: order.id });
                  }
                }} 
              />
            )
          ) : isCompleted ? (
            <Button title="Reorder Items" variant="primary" onPress={() => {}} />
          ) : null}
        </View>

      </Animated.ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: COLORS.bgWarm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  headerTitle: { fontFamily: FONTS.black, fontSize: 16, color: COLORS.textDark },
  statusTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusTagCompleted: {},
  statusTagCancelled: {},
  statusTagActive: {},
  statusTagText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.midTealDark },

  scrollContent: { padding: 16, paddingBottom: 60, gap: 16 },

  card: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.textDark },

  pharmacyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pharmAvatar: { width: 50, height: 50, borderRadius: 12 },
  pharmName: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.textDark },
  pharmAddress: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  prescriptionGrid: { flexDirection: 'row', gap: 12 },
  prescriptionPlaceholder: {
    width: 80, height: 100, borderRadius: 12, backgroundColor: COLORS.limeWhisper,
    borderWidth: 1, borderColor: COLORS.borderSoft, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  prescriptionPlaceholderText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.midTeal },

  itemsList: { gap: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemQtyBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },
  itemQty: { fontFamily: FONTS.black, fontSize: 13, color: COLORS.midTeal },
  itemName: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  itemSub: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  itemPrice: { fontFamily: FONTS.black, fontSize: 14, color: COLORS.textDark },
  noItemsText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  totalsDivider: { height: 1, backgroundColor: COLORS.borderSoft, marginVertical: 16 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalsLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  totalsValue: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textDark },
  grandTotalLabel: { fontFamily: FONTS.black, fontSize: 15, color: COLORS.textDark },
  grandTotalValue: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.midTeal },

  actionsWrapper: { marginTop: 10, gap: 10 },
});
