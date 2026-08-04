import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Wallet, CreditCard } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';

interface PaymentMethodSelectorProps {
  selectedMethod: 'counter' | 'stripe';
  onSelect: (method: 'counter' | 'stripe') => void;
  title?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
  title = 'Payment Method',
}) => {
  return (
    <View style={s.container}>
      {title ? <Text style={s.sectionTitle}>{title}</Text> : null}

      <View style={s.optionsWrap}>
        {/* Option 1: Pay at Counter */}
        <Pressable
          style={[s.optionCard, selectedMethod === 'counter' && s.optionSelected]}
          onPress={() => onSelect('counter')}
        >
          <View style={[s.iconBox, selectedMethod === 'counter' && s.iconBoxSelected]}>
            <Wallet color={selectedMethod === 'counter' ? COLORS.midTeal : COLORS.textMuted} size={20} strokeWidth={2} />
          </View>

          <View style={s.textWrap}>
            <Text style={s.optionTitle}>Pay at Counter</Text>
            <Text style={s.optionSub}>Cash or card upon pickup</Text>
          </View>

          <View style={[s.radioOuter, selectedMethod === 'counter' && s.radioOuterSelected]}>
            {selectedMethod === 'counter' && <View style={s.radioInner} />}
          </View>
        </Pressable>

        {/* Option 2: Pay Online via Stripe */}
        <Pressable
          style={[s.optionCard, selectedMethod === 'stripe' && s.optionSelected]}
          onPress={() => onSelect('stripe')}
        >
          <View style={[s.iconBox, selectedMethod === 'stripe' && s.iconBoxSelected]}>
            <CreditCard color={selectedMethod === 'stripe' ? COLORS.midTeal : COLORS.textMuted} size={20} strokeWidth={2} />
          </View>

          <View style={s.textWrap}>
            <Text style={s.optionTitle}>Pay Online</Text>
            <Text style={s.optionSub}>Stripe — fast & queue-free</Text>
          </View>

          <View style={[s.radioOuter, selectedMethod === 'stripe' && s.radioOuterSelected]}>
            {selectedMethod === 'stripe' && <View style={s.radioInner} />}
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { gap: 10 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textMuted, letterSpacing: 0.4 },
  optionsWrap: { gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.borderSoft,
  },
  optionSelected: {
    borderColor: COLORS.midTeal, backgroundColor: COLORS.midTealLight,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bgWarm,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBoxSelected: { backgroundColor: COLORS.surfaceWhite },
  textWrap: { flex: 1 },
  optionTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  optionSub: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.borderSoft,
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceWhite,
  },
  radioOuterSelected: { borderColor: COLORS.midTeal },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.midTeal },
});
