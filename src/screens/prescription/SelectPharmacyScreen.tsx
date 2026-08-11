import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Pressable, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Star, Clock, MapPin, ChevronRight, SlidersHorizontal, Navigation } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MOCK_PHARMACIES } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const SelectPharmacyScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.peacockBlue} size={20} strokeWidth={2.5} />
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
            <Navigation color={colors.midTeal} size={14} strokeWidth={2.5} />
            <Text style={s.locationText}>Delivering to: <Text style={{ fontFamily: FONTS.bold, color: colors.textDark }}>Colombo 03</Text></Text>
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
              return b.rating - a.rating;
            }
            const distA = parseFloat(a.distance);
            const distB = parseFloat(b.distance);
            return distA - distB;
          })
          .map((p) => {
          const isTopRated = p.rating >= 4.9;
          
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
                    {isTopRated && (
                      <View style={s.badgeTop}>
                        <Text style={s.badgeTextTop}>TOP RATED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.pharmacyAddress} numberOfLines={1}>{p.address}</Text>

                  <View style={s.ratingRow}>
                    <Star color="#F59E0B" size={13} fill="#F59E0B" />
                    <Text style={s.ratingText}>{p.rating}</Text>
                    <Text style={s.sep}>·</Text>
                    <MapPin color={colors.textMuted} size={11} strokeWidth={2.5} />
                    <Text style={s.metaText}>{p.distance}</Text>
                  </View>
                </View>
                
                <View style={[s.arrowCircle, !p.isOpen && { backgroundColor: '#F8FAFC' }]}>
                  <ChevronRight color={p.isOpen ? colors.midTeal : colors.textMuted} size={20} strokeWidth={2.5} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  navTitle: {
    flex: 1, textAlign: 'center', fontSize: 16,
    fontFamily: FONTS.bold, color: colors.peacockBlue,
  },
  scroll: { padding: 20, paddingBottom: 40, gap: 14 },
  counterRow: {
    marginBottom: 12, gap: 4,
  },
  counterTitle: {
    fontSize: 24, fontFamily: FONTS.black, color: colors.textDark,
  },
  counterSubtitle: {
    fontSize: 14, fontFamily: FONTS.medium, color: colors.textMuted,
  },
  
  controlPanel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, gap: 10,
  },
  locationPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.limeWhisper, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
  },
  locationText: { fontSize: 12, fontFamily: FONTS.medium, color: colors.midTeal },
  sortToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceWhite,
    borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.borderSoft,
  },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  sortBtnActive: { backgroundColor: colors.midTeal },
  sortBtnText: { fontFamily: FONTS.semibold, fontSize: 11, color: colors.textMuted },
  sortBtnTextActive: { color: '#FFF' },

  card: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 3,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  logoBox: {
    width: 68, height: 68, borderRadius: 18,
    backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%', height: '100%',
  },
  logoText: {
    fontSize: 24, fontFamily: FONTS.black, color: colors.midTeal,
  },
  cardInfo: { flex: 1, gap: 2, justifyContent: 'center' },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pharmacyName: {
    flex: 1, fontSize: 15, fontFamily: FONTS.bold, color: colors.textDark,
  },
  badgeTop: { 
    backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 3, 
    borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A' 
  },
  badgeTextTop: { 
    fontFamily: FONTS.bold, fontSize: 9, letterSpacing: 0.5, color: '#D97706' 
  },
  pharmacyAddress: {
    fontSize: 12, fontFamily: FONTS.medium, color: colors.textMuted,
  },
  
  ratingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
  },
  ratingText: {
    fontSize: 12, fontFamily: FONTS.bold, color: colors.textDark,
  },
  metaText: {
    fontSize: 12, fontFamily: FONTS.bold, color: colors.textDark,
  },
  sep: { color: colors.textMuted, fontSize: 10 },
  arrowCircle: { 
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.limeWhisper, 
    justifyContent: 'center', alignItems: 'center'
  },
});
