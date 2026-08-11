import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Sparkles, PackageCheck, Pill, ShieldAlert, FileText, CheckCircle2, Shield } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';

// High-end 3D style vector graphic for Hero Prescription Banner
export const PrescriptionHeroGraphic = () => {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <View style={s.rxGraphicWrap}>
    <View style={s.rxGlowBg} />
    
    {/* High-end 3D Clay Prescription Icon */}
    <View style={s.clayIconWrap}>
      <Image 
        source={require('../../../assets/images/user_clay_rx_latest.jpg')} 
        style={{ width: '100%', height: '100%', transform: [{ scale: 1.45 }] }} 
        resizeMode="cover" 
      />
    </View>

    {/* Floating 3D AI Verified Badge overlapping bottom-right corner */}
    <View style={s.rxCheckBadgeFloating}>
      {/* Real Clay Texture Background */}
      <Image 
        source={require('../../../assets/images/clay_pill_blank.png')} 
        style={[StyleSheet.absoluteFillObject, { transform: [{ scale: 1.5 }] }]} 
        resizeMode="cover" 
      />
      
      <View style={s.clayShieldWrap}>
        <Image 
          source={require('../../../assets/images/clay_shield.png')} 
          style={{ width: '100%', height: '100%', transform: [{ scale: 1.4 }] }} 
          resizeMode="cover" 
        />
      </View>
      <View>
        <Text style={s.badgeLabelTop}>AI</Text>
        <Text style={s.badgeLabelBottom}>Verified</Text>
      </View>
    </View>
    </View>
  );
};

// High-end 3D style clip art for Category Thumbnails
export const CategoryTileGraphic = ({ type }: { type: 'vitamins' | 'firstaid' | 'supplements' | 'skincare' }) => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
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

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: colors.limeWhisper,
    opacity: 0.9,
  },
  clayIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 16,
    backgroundColor: '#EDF4DE',
    overflow: 'hidden',
  },

  // Floating Glassmorphic AI Verified Pill Badge
  rxCheckBadgeFloating: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4', 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF', 
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  clayShieldWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
  },
  badgeLabelTop: {
    fontFamily: 'Outfit_900Black',
    fontSize: 8,
    color: colors.midTeal,
    lineHeight: 9,
  },
  badgeLabelBottom: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 8,
    color: colors.midTeal,
    lineHeight: 9,
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
