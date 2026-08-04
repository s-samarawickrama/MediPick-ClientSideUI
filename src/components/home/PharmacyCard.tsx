import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Badge } from '../common/Badge';
import { ShieldCheck, MapPin, Star, Clock } from 'lucide-react-native';
import { Pharmacy } from '../../types';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  onSelect?: () => void;
}

export const PharmacyCard: React.FC<PharmacyCardProps> = ({ pharmacy, onSelect }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      <View style={styles.headerRow}>
        <View style={styles.infoLeft}>
          <Text style={styles.name}>{pharmacy.name}</Text>
          <View style={styles.locationRow}>
            <MapPin color={COLORS.deepTeal} size={13} />
            <Text style={styles.subText}>{pharmacy.address} • </Text>
            <Text style={styles.distanceText}>{pharmacy.distance}</Text>
          </View>
        </View>

        <View style={styles.ratingBox}>
          <Star color="#EAB308" size={14} fill="#EAB308" />
          <Text style={styles.ratingText}>{pharmacy.rating}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <Badge
          label={`License: ${pharmacy.nmraLicense}`}
          variant="lime"
          icon={<ShieldCheck color={COLORS.deepIndigo} size={12} />}
        />
        <View style={styles.timeBox}>
          <Clock color={COLORS.textMuted} size={12} />
          <Text style={styles.timeText}>{pharmacy.estimatedResponseTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLeft: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.deepIndigo,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.deepTeal,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
