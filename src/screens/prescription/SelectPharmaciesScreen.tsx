import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Check, Star, Clock, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_PHARMACIES } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'SelectPharmacies'>;

export const SelectPharmaciesScreen = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const selectedItems = route.params?.selectedItems || [];

  const [selected, setSelected] = useState<string[]>(['ph-1', 'ph-2']);
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const proceed = () => {
    navigation.navigate('Quotation', { orderId: 'ord-102' });
  };

  // Mock stock availability for demo requested items per pharmacy
  const getStockStatus = (pharmacyId: string) => {
    if (!selectedItems || selectedItems.length === 0) return null;
    if (pharmacyId === 'ph-3') {
      return { 
        available: false, 
        unavailableItems: ['Panadol Advance 500mg (20s)'],
        label: 'Out of Stock' 
      };
    }
    return { available: true, label: 'In Stock' };
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.peacockBlue} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Select Pharmacies</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity, transform: [{ translateY: slideY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.counterRow}>
          <Text style={s.counterTitle}>Select Up to 3 Pharmacies</Text>
          <View style={s.pillBadge}>
            <Text style={s.pillBadgeText}>{selected.length} of 3 Selected</Text>
          </View>
        </View>

        {MOCK_PHARMACIES.map((p) => {
          const isSelected = selected.includes(p.id);
          const stock = getStockStatus(p.id);
          // Users CAN select out of stock pharmacies because they might want to send a prescription anyway!
          const isDisabled = !isSelected && selected.length >= 3;

          return (
            <Pressable
              key={p.id}
              style={({ pressed }) => [
                s.card,
                isSelected && s.cardSelected,
                isDisabled && s.cardDisabled,
                pressed && !isDisabled && { opacity: 0.9 },
              ]}
              onPress={() => !isDisabled && toggle(p.id)}
            >
              <View style={s.cardTop}>
                <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                  {isSelected && <Check color="#FFFFFF" size={15} strokeWidth={3.5} />}
                </View>

                <View style={s.avatar}>
                  <Text style={s.avatarText}>{p.name[0]}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{p.name}</Text>
                  <View style={s.meta}>
                    <Star color="#F59E0B" size={12} fill="#F59E0B" />
                    <Text style={s.metaText}>{p.rating}</Text>
                    <Text style={s.sep}>·</Text>
                    <Text style={s.metaText}>{p.distance}</Text>
                    <Text style={s.sep}>·</Text>
                    <Clock color={COLORS.textMuted} size={11} strokeWidth={2} />
                    <Text style={s.metaText}>{p.estimatedResponseTime}</Text>
                  </View>
                </View>
              </View>

              {/* Informative Unavailable Items Footer */}
              {stock && !stock.available && (
                <View style={s.unavailableFooter}>
                  <View style={s.unavailableHeader}>
                    <AlertTriangle color="#D97706" size={14} strokeWidth={2.5} />
                    <Text style={s.unavailableTitle}>
                      Cart items unavailable. You can still send your prescription for review.
                    </Text>
                  </View>
                  {stock.unavailableItems && stock.unavailableItems.length > 0 && (
                    <Text style={s.unavailableList}>
                      Missing: {stock.unavailableItems.join(', ')}
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}

        <Button
          title={selected.length > 0 ? `Request Quotes (${selected.length} Selected)` : "Select Pharmacies"}
          onPress={proceed}
          disabled={selected.length === 0}
          style={{ marginTop: 12 }}
        />
      </Animated.ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAF7' },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: COLORS.peacockBlue },
  scroll: { padding: 16, paddingBottom: 60, gap: 12 },
  counterRow: {
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderSoft, gap: 6, marginBottom: 4,
  },
  counterTitle: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.peacockBlue },
  counterSub: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  pillBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.limeWhisper,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: '#D6EDA0', marginTop: 4,
  },
  pillBadgeText: { fontFamily: FONTS.extrabold, fontSize: 11, color: COLORS.midTeal },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0', gap: 10,
  },
  cardSelected: { borderColor: COLORS.deepTeal, backgroundColor: COLORS.limeWhisper },
  cardDisabled: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#CBD5E1',
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: COLORS.midTeal, borderColor: COLORS.midTeal },
  avatar: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.deepTeal },
  name: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.peacockBlue, marginBottom: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  sep: { color: COLORS.textMuted, fontSize: 10 },

  unavailableFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },
  unavailableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  unavailableTitle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#D97706',
    flex: 1,
    lineHeight: 16,
  },
  unavailableList: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    marginLeft: 20,
  },
});
