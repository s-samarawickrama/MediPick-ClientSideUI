import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Sparkles, PackageCheck, Pill, ShieldAlert, FileText, CheckCircle2, Shield } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';

// High-end 3D style vector graphic for Hero Prescription Banner
export const PrescriptionHeroGraphic = () => (
  <View style={s.rxGraphicWrap}>
    <View style={s.rxGlowBg} />
    <View style={s.rxDocTile}>
      <View style={s.rxHeaderRow}>
        <View style={s.rxBadgeCircle}>
          <Pill color={COLORS.midTeal} size={20} strokeWidth={2.2} />
        </View>
        <Sparkles color="#F59E0B" size={16} strokeWidth={2.5} />
      </View>

      <View style={s.rxLineLong} />
      <View style={s.rxLineMedium} />

      {/* Floating 3D AI Verified Badge overlapping bottom-right corner */}
      <View style={s.rxCheckBadgeFloating}>
        <Shield color={COLORS.midTeal} size={11} strokeWidth={2.8} />
        <View>
          <Text style={s.badgeLabelTop}>AI</Text>
          <Text style={s.badgeLabelBottom}>Verified</Text>
        </View>
      </View>
    </View>
  </View>
);

// High-end 3D style clip art for Category Thumbnails
export const CategoryTileGraphic = ({ type }: { type: 'vitamins' | 'firstaid' | 'supplements' | 'skincare' }) => {
  const configs = {
    vitamins:    { img: require('../../../assets/images/cat_vitamins_bg_1785829652014.png') },
    firstaid:    { img: require('../../../assets/images/cat_firstaid_bg_1785829660930.png') },
    supplements: { img: require('../../../assets/images/cat_supplements_bg_1785829673928.png') },
    skincare:    { img: require('../../../assets/images/cat_skincare_bg_1785829684632.png') },
  }[type];

  return (
    <View style={[s.catTileWrap, { backgroundColor: '#F6F8F6', overflow: 'hidden' }]}>
      <Image source={configs.img} style={{ width: '100%', height: '100%', transform: [{ scale: 1.35 }] }} resizeMode="cover" />
    </View>
  );
};

const s = StyleSheet.create({
  rxGraphicWrap: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rxGlowBg: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.limeWhisper,
    opacity: 0.9,
  },
  rxDocTile: {
    width: 76,
    height: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    gap: 7,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  rxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rxBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rxLineLong: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    width: '100%',
  },
  rxLineMedium: {
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    width: '65%',
  },

  // Floating Glassmorphic AI Verified Pill Badge
  rxCheckBadgeFloating: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeLabelTop: {
    fontFamily: 'Outfit_900Black',
    fontSize: 9,
    color: COLORS.midTeal,
    lineHeight: 10,
  },
  badgeLabelBottom: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    color: COLORS.midTeal,
    lineHeight: 10,
  },

  // Category Tiles
  catTileWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
});
