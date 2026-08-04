import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'> & {
  onSignIn: () => void;
};

export const OTPScreen: React.FC<Props> = ({ navigation, route, onSignIn }) => {
  const { phone } = route.params;
  const [otp,      setOtp]      = useState('');
  const [otpErr,   setOtpErr]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [seconds,  setSeconds]  = useState(59);
  const [canResend, setCanResend] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();

    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleVerify = () => {
    if (otp.length < 6) { setOtpErr('Enter 6-digit code'); return; }
    setOtpErr('');
    setLoading(true);
    setTimeout(() => { setLoading(false); onSignIn(); }, 700);
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setSeconds(59);
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.peacockBlue} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[s.content, { opacity, transform: [{ translateY: slideY }] }]}>

        <View style={s.heading}>
          <Text style={s.title}>Enter Code</Text>
          <Text style={s.desc}>
            Sent to <Text style={s.phone}>{phone}</Text>
          </Text>
        </View>

        <View style={s.otpContainer}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[
              s.otpBox, 
              otp.length > i && s.otpBoxFilled,
              !!otpErr && s.otpBoxError
            ]}>
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
              if (otpErr) setOtpErr('');
            }}
            autoFocus
          />
        </View>
        {!!otpErr && <Text style={s.errorText}>{otpErr}</Text>}

        <Button
          title="Verify"
          onPress={handleVerify}
          isLoading={loading}
          style={{ marginBottom: 20 }}
        />

        <TouchableOpacity
          style={s.resendRow}
          onPress={handleResend}
          disabled={!canResend}
          activeOpacity={canResend ? 0.7 : 1}
        >
          <RotateCcw color={canResend ? COLORS.deepTeal : COLORS.textMuted} size={14} strokeWidth={2} />
          <Text style={[s.resendText, canResend && s.resendActive]}>
            {canResend
              ? 'Resend Code'
              : `Resend in 0:${String(seconds).padStart(2, '0')}`}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  nav: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  heading: { marginBottom: 28 },
  title: { fontFamily: FONTS.black, fontSize: 30, color: COLORS.peacockBlue, letterSpacing: -0.6, marginBottom: 6 },
  desc: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textMuted },
  phone: { fontFamily: FONTS.bold, color: COLORS.peacockBlue },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  resendText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textMuted },
  resendActive: { color: COLORS.deepTeal, fontFamily: FONTS.bold },

  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, position: 'relative' },
  otpBox: { 
    width: 48, height: 56, borderRadius: 12, backgroundColor: '#F8FAFC',
    borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center'
  },
  otpBoxFilled: { borderColor: COLORS.softLime, backgroundColor: COLORS.limeWhisper },
  otpBoxError: { borderColor: COLORS.error, backgroundColor: '#FEF2F2' },
  otpText: { fontFamily: FONTS.black, fontSize: 24, color: COLORS.peacockBlue },
  hiddenOtpInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
  errorText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.error, marginTop: -12, marginBottom: 16 },
});
