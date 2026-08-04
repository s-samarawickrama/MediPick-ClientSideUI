import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Pill, ShieldCheck, Heart, ShoppingBag, ArrowRight } from 'lucide-react-native';

interface HeroBannerProps {
  onUploadPress: () => void;
  onBrowseOtcPress: () => void;
}

export const HeroUploadBanner: React.FC<HeroBannerProps> = ({ onUploadPress, onBrowseOtcPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerBadge}>
          <ShieldCheck color={COLORS.softLime} size={16} />
          <Text style={styles.headerBadgeText}>Verified Partner Pharmacies Only</Text>
        </View>
        
        <Text style={styles.title}>Need Prescription Medicine?</Text>
        <Text style={styles.subtitle}>
          Upload your prescription photo or PDF. Get best prices from up to 3 nearby pharmacies!
        </Text>

        <TouchableOpacity style={styles.uploadBtn} onPress={onUploadPress} activeOpacity={0.85}>
          <Pill color={COLORS.deepIndigo} size={20} />
          <Text style={styles.uploadBtnText}>Upload Prescription Now</Text>
          <ArrowRight color={COLORS.deepIndigo} size={18} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.otcBtn} onPress={onBrowseOtcPress} activeOpacity={0.85}>
          <ShoppingBag color={COLORS.white} size={18} />
          <Text style={styles.otcBtnText}>Or Browse OTC Medicines (No Rx needed)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.deepTeal,
    borderRadius: 16,
    padding: 18,
    marginVertical: 12,
    elevation: 4,
  },
  content: {
    gap: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: COLORS.softLime,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 6,
  },
  uploadBtn: {
    backgroundColor: COLORS.softLime,
    minHeight: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  uploadBtnText: {
    color: COLORS.deepIndigo,
    fontWeight: '800',
    fontSize: 15,
  },
  otcBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  otcBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
