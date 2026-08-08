import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Pressable, Modal, TextInput, Alert, Switch,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, Phone, Mail, ChevronRight, LogOut, Bell, HelpCircle, FileText, Lock, Heart, MapPin, CreditCard, X, AlertTriangle } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useAuth } from '../../context/AuthContext';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const opacity = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();

  const [phone, setPhone]                 = useState('+1 (555) 019-2834');
  const [newPhone, setNewPhone]           = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneStep, setPhoneStep]         = useState<'input' | 'otp'>('input');
  const [otp, setOtp]                     = useState('');

  const [notifPush, setNotifPush]         = useState(true);
  const [notifSms, setNotifSms]           = useState(true);
  const [showNotifModal, setShowNotifModal] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const closePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneStep('input');
    setOtp('');
  };

  const handleUpdatePhone = () => {
    if (phoneStep === 'input') {
      if (newPhone.trim().length < 8) {
        Alert.alert('Invalid Number', 'Please enter a valid phone number.');
        return;
      }
      setPhoneStep('otp');
    } else {
      if (otp.length < 6) {
        Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
        return;
      }
      setPhone(newPhone.trim());
      setNewPhone('');
      setOtp('');
      setPhoneStep('input');
      setShowPhoneModal(false);
      Alert.alert('Phone Updated', 'Your phone number has been updated successfully.');
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      <Animated.ScrollView
        style={{ opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Card */}
        <View style={s.profileCard}>
          <View style={s.cardTop}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>P</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.userName}>{user.surname || 'Perera'}</Text>
                <View style={s.verifiedTag}>
                  <ShieldCheck color={COLORS.midTeal} size={13} strokeWidth={2.5} />
                  <Text style={s.verifiedText}>Verified</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Text style={s.userPhone}>{user.phoneNumber || phone}</Text>
                {user.strikes > 0 && (
                  <View style={s.strikeTag}>
                    <AlertTriangle color={COLORS.warning} size={12} strokeWidth={2.5} />
                    <Text style={s.strikeText}>{user.strikes}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* MY ACCOUNT */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionTitle}>MY ACCOUNT</Text>
          <View style={s.menuCard}>
            <Pressable 
              style={s.menuItem}
              onPress={() => (navigation as any).navigate('Favorites')}
            >
              <View style={s.menuIconBox}>
                <Heart color={COLORS.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Favorite Pharmacies</Text>
                <Text style={s.menuSub}>Quick access to your saved stores</Text>
              </View>
              <ChevronRight color={COLORS.textMuted} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionTitle}>PREFERENCES</Text>
          <View style={s.menuCard}>
            <Pressable style={s.menuItem} onPress={() => setShowPhoneModal(true)}>
              <View style={s.menuIconBox}>
                <Phone color={COLORS.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Change Phone Number</Text>
                <Text style={s.menuSub}>{phone}</Text>
              </View>
              <ChevronRight color={COLORS.textMuted} size={16} strokeWidth={2} />
            </Pressable>

            <Pressable style={[s.menuItem, s.menuBorder]} onPress={() => setShowNotifModal(true)}>
              <View style={s.menuIconBox}>
                <Bell color={COLORS.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Notification Settings</Text>
                <Text style={s.menuSub}>Order alerts & SMS updates</Text>
              </View>
              <ChevronRight color={COLORS.textMuted} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* SUPPORT & LEGAL */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionTitle}>SUPPORT & LEGAL</Text>
          <View style={s.menuCard}>
            <Pressable style={s.menuItem} onPress={() => navigation.navigate('LegalDoc', { type: 'terms' })}>
              <View style={s.menuIconBox}>
                <FileText color={COLORS.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Terms of Service</Text>
                <Text style={s.menuSub}>User agreement & policies</Text>
              </View>
              <ChevronRight color={COLORS.textMuted} size={16} strokeWidth={2} />
            </Pressable>

            <Pressable style={[s.menuItem, s.menuBorder]} onPress={() => navigation.navigate('LegalDoc', { type: 'privacy' })}>
              <View style={s.menuIconBox}>
                <Lock color={COLORS.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Privacy Policy</Text>
                <Text style={s.menuSub}>Data protection & security</Text>
              </View>
              <ChevronRight color={COLORS.textMuted} size={16} strokeWidth={2} />
            </Pressable>

            <Pressable style={[s.menuItem, s.menuBorder]} onPress={() => navigation.navigate('LegalDoc', { type: 'faq' })}>
              <View style={s.menuIconBox}>
                <HelpCircle color={COLORS.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Help center</Text>
                <Text style={s.menuSub}>FAQ and chat support</Text>
              </View>
              <ChevronRight color={COLORS.textMuted} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          style={s.signOutBtn} 
          activeOpacity={0.6}
          onPress={() => Platform.OS === 'web' ? window.alert('You have been successfully signed out.') : Alert.alert('Sign Out', 'You have been successfully signed out.')}
        >
          <LogOut color={COLORS.error} size={18} strokeWidth={2.5} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.versionText}>MediPick · Licensed Pharmacy Network</Text>
      </Animated.ScrollView>

      {/* Change Phone Modal */}
      <Modal visible={showPhoneModal} animationType="slide" transparent onRequestClose={closePhoneModal}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalOverlay}
        >
          <View style={s.modalCard}>
            <TouchableOpacity style={s.closeBtn} onPress={closePhoneModal}>
              <X color={COLORS.textDark} size={18} strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={s.modalTitle}>{phoneStep === 'input' ? 'Change Phone Number' : 'Verify New Number'}</Text>
            <Text style={s.modalSub}>
              {phoneStep === 'input' ? `Current number: ${phone}` : `Enter the 6-digit code sent to ${newPhone}`}
            </Text>

            {phoneStep === 'input' ? (
              <TextInput
                style={s.textInput}
                placeholder="Enter new phone number..."
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
                autoFocus
              />
            ) : (
              <View style={s.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={[s.otpBox, otp.length > i && s.otpBoxFilled]}>
                    <Text style={s.otpText}>{otp[i] || ''}</Text>
                  </View>
                ))}
                <TextInput
                  style={s.hiddenOtpInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(val) => {
                    const numericVal = val.replace(/[^0-9]/g, '');
                    setOtp(numericVal);
                  }}
                  autoFocus
                />
              </View>
            )}

            <Button
              title={phoneStep === 'input' ? 'Send OTP' : 'Verify & Update'}
              variant="primary"
              onPress={handleUpdatePhone}
              style={{ marginTop: 6 }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal visible={showNotifModal} animationType="slide" transparent onRequestClose={() => setShowNotifModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowNotifModal(false)}>
              <X color={COLORS.textDark} size={18} strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={s.modalTitle}>Notification Preferences</Text>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Push Notifications</Text>
                <Text style={s.switchSub}>Real-time order quote and pickup alerts</Text>
              </View>
              <Switch value={notifPush} onValueChange={setNotifPush} trackColor={{ false: '#CBD5E1', true: COLORS.midTeal }} />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>SMS Verification Alerts</Text>
                <Text style={s.switchSub}>Text notifications for OTP codes</Text>
              </View>
              <Switch value={notifSms} onValueChange={setNotifSms} trackColor={{ false: '#CBD5E1', true: COLORS.midTeal }} />
            </View>

            <Button
              title="Save Preferences"
              variant="primary"
              onPress={() => {
                setShowNotifModal(false);
                Platform.OS === 'web' ? window.alert('Notification settings saved.') : Alert.alert('Saved', 'Notification settings saved.');
              }}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },
  scroll: { padding: 16, paddingTop: 56, paddingBottom: 100, gap: 16 },

  profileCard: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 20, padding: 18,
    borderWidth: 1.5, borderColor: COLORS.borderSoft, gap: 16,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: COLORS.midTeal, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: FONTS.black, fontSize: 22, color: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontFamily: FONTS.black, fontSize: 20, color: COLORS.textDark, letterSpacing: -0.4 },
  userPhone: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  verifiedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  verifiedText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.midTeal },
  strikeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.warningLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  strikeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.warning },

  sectionWrap: { gap: 8 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.8 },
  menuCard: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.borderSoft, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  menuBorder: { borderTopWidth: 1, borderTopColor: COLORS.borderSoft },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  menuSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 1 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 18, marginTop: 4,
  },
  signOutText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.error },
  versionText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.surfaceWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12, position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bgWarm,
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  modalTitle: { fontFamily: FONTS.black, fontSize: 20, color: COLORS.textDark },
  modalSub: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  textInput: {
    width: '100%', backgroundColor: COLORS.bgWarm, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.borderSoft, paddingHorizontal: 14, height: 48,
    fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textDark,
    outlineStyle: 'none' as any, outlineWidth: 0 as any,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  switchSub: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, position: 'relative' },
  otpBox: { 
    width: 46, height: 56, borderRadius: 12, backgroundColor: COLORS.bgWarm,
    borderWidth: 1, borderColor: COLORS.borderSoft, justifyContent: 'center', alignItems: 'center'
  },
  otpBoxFilled: { borderColor: COLORS.softLime, backgroundColor: COLORS.limeWhisper },
  otpText: { fontFamily: FONTS.black, fontSize: 22, color: COLORS.textDark },
  hiddenOtpInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
});
