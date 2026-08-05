import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Pressable, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Star, Clock, MapPin, ChevronRight, SlidersHorizontal, Navigation } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_PHARMACIES } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const SelectPharmacyScreen = () => {
  const navigation = useNavigation<Nav>();

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(14)).current;
  const [sortBy, setSortBy] = useState<'nearest' | 'rating'>('nearest');

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const selectPharmacy = (id: string, name: string) => {
    navigation.navigate('UploadPrescription', { pharmacyId: id, pharmacyName: name });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.peacockBlue} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Select Pharmacy</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity, transform: [{ translateY: slideY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.counterRow}>
          <Text style={s.counterTitle}>Upload Prescription</Text>
          <Text style={s.counterSubtitle}>Choose a trusted pharmacy to fulfill your order.</Text>
        </View>

        {/* Location & Filter Control */}
        <View style={s.controlPanel}>
          <View style={s.locationPill}>
            <Navigation color={COLORS.midTeal} size={14} strokeWidth={2.5} />
            <Text style={s.locationText}>Delivering to: <Text style={{ fontFamily: FONTS.bold, color: COLORS.textDark }}>Colombo 03</Text></Text>
          </View>
          
          <View style={s.sortToggle}>
            <TouchableOpacity 
              style={[s.sortBtn, sortBy === 'nearest' && s.sortBtnActive]}
              onPress={() => setSortBy('nearest')}
            >
              <Text style={[s.sortBtnText, sortBy === 'nearest' && s.sortBtnTextActive]}>Nearest</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.sortBtn, sortBy === 'rating' && s.sortBtnActive]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[s.sortBtnText, sortBy === 'rating' && s.sortBtnTextActive]}>Top Rated</Text>
            </TouchableOpacity>
          </View>
        </View>

        {[...MOCK_PHARMACIES]
          .sort((a, b) => {
            if (sortBy === 'rating') {
              return parseFloat(b.rating) - parseFloat(a.rating);
            }
            // Mock distance sort by converting "0.8 km" to 0.8
            const distA = parseFloat(a.distance);
            const distB = parseFloat(b.distance);
            return distA - distB;
          })
          .map((p) => {
          const isTopRated = parseFloat(p.rating) >= 4.9;
          const isFastest = p.deliveryTime === '15 mins';

          return (
            <Pressable
              key={p.id}
              style={({ pressed }) => [
                s.card,
                pressed && { transform: [{ scale: 0.98 }] },
                !p.isOpen && { opacity: 0.7 }
              ]}
              onPress={() => p.isOpen && selectPharmacy(p.id, p.name)}
            >
              <View style={s.cardTop}>
                <View style={s.logoBox}>
                  {p.image ? (
                    <Image source={p.image} style={s.logoImg} resizeMode="cover" />
                  ) : (
                    <Text style={s.logoText}>{p.name.charAt(0)}</Text>
                  )}
                </View>
                <View style={s.cardInfo}>
                  <View style={s.nameBadgeRow}>
                    <Text style={s.pharmacyName} numberOfLines={1}>{p.name}</Text>
                    {(isTopRated || isFastest) && (
                      <View style={[s.badge, isTopRated ? s.badgeTop : s.badgeFast]}>
                        <Text style={[s.badgeText, isTopRated ? s.badgeTextTop : s.badgeTextFast]}>
                          {isTopRated ? 'TOP RATED' : 'FASTEST'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={s.ratingRow}>
                    <Star color="#F59E0B" size={14} fill="#F59E0B" />
                    <Text style={s.ratingText}>{p.rating}</Text>
                    <View style={s.dot} />
                    <Clock color={COLORS.textMuted} size={12} strokeWidth={2} />
                    <Text style={s.metaText}>{p.estimatedResponseTime}</Text>
                    <View style={s.dot} />
                    <MapPin color={COLORS.textMuted} size={12} strokeWidth={2} />
                    <Text style={s.metaText}>{p.distance}</Text>
                  </View>
                  
                  {p.isOpen ? (
                    <View style={s.openPill}>
                      <View style={s.openDot} />
                      <Text style={s.openPillText}>Open Now</Text>
                    </View>
                  ) : (
                    <View style={[s.openPill, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                      <View style={[s.openDot, { backgroundColor: '#EF4444' }]} />
                      <Text style={[s.openPillText, { color: '#B91C1C' }]}>Closed</Text>
                    </View>
                  )}
                </View>
                
                <View style={[s.arrowCircle, !p.isOpen && { backgroundColor: '#F8FAFC' }]}>
                  <ChevronRight color={p.isOpen ? COLORS.midTeal : COLORS.textMuted} size={20} strokeWidth={2.5} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: COLORS.bgWarm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  navTitle: {
    flex: 1, textAlign: 'center', fontSize: 16,
    fontFamily: FONTS.bold, color: COLORS.peacockBlue,
  },
  scroll: { padding: 20, paddingBottom: 40, gap: 14 },
  counterRow: {
    marginBottom: 12, gap: 4,
  },
  counterTitle: {
    fontSize: 24, fontFamily: FONTS.black, color: COLORS.textDark,
  },
  counterSubtitle: {
    fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textMuted,
  },
  
  controlPanel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, gap: 10,
  },
  locationPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
  },
  locationText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.midTeal },
  sortToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceWhite,
    borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  sortBtnActive: { backgroundColor: COLORS.midTeal },
  sortBtnText: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.textMuted },
  sortBtnTextActive: { color: '#FFF' },

  card: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 3,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  logoBox: {
    width: 68, height: 68, borderRadius: 18,
    backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%', height: '100%',
  },
  logoText: {
    fontSize: 24, fontFamily: FONTS.black, color: COLORS.midTeal,
  },
  cardInfo: { flex: 1, gap: 8 },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pharmacyName: {
    flex: 1, fontSize: 16, fontFamily: FONTS.black, color: COLORS.peacockBlue,
  },
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeTop: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  badgeFast: { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
  badgeText: { fontFamily: FONTS.bold, fontSize: 9, letterSpacing: 0.5 },
  badgeTextTop: { color: '#D97706' },
  badgeTextFast: { color: '#16A34A' },
  
  ratingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  ratingText: {
    fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textDark,
  },
  metaText: {
    fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textMuted,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.borderSoft },
  arrowCircle: { 
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.limeWhisper, 
    justifyContent: 'center', alignItems: 'center'
  },
  openPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: '#BBF7D0', marginTop: 2,
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  openPillText: { fontFamily: FONTS.bold, fontSize: 9, color: '#15803D', textTransform: 'uppercase' },
});
