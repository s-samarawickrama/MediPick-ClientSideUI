import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { Layers, ChevronRight, X } from 'lucide-react-native';

interface ScreenSwitcherProps {
  currentScreen: string;
  onSelectScreen: (screenName: string) => void;
}

const ALL_SCREENS = [
  { id: 'Splash', name: '1. Splash Screen', category: 'Auth' },
  { id: 'Login', name: '2. Passwordless Login', category: 'Auth' },
  { id: 'OTPVerification', name: '3. OTP Verification', category: 'Auth' },
  { id: 'ChangePhone', name: '4. Change Phone Number', category: 'Auth' },
  { id: 'Home', name: '5. Home Dashboard', category: 'Main' },
  { id: 'BrowseOTC', name: '6. Browse OTC Catalog', category: 'OTC Flow' },
  { id: 'Cart', name: '7. Shopping Cart & Checkout', category: 'OTC Flow' },
  { id: 'UploadPrescription', name: '8. Upload Prescription', category: 'Rx Flow' },
  { id: 'AIQualityCheck', name: '9. AI Quality Check', category: 'Rx Flow' },

  { id: 'PrescriptionQuotation', name: '11. Quotation & Offer Review', category: 'Rx Flow' },
  { id: 'MixedOrderReview', name: '12. Mixed Order Summary', category: 'Rx Flow' },
  { id: 'Payment', name: '13. Payment Selection', category: 'Fulfillment' },
  { id: 'OrderTracking', name: '14. 2-FSM Order Tracking', category: 'Fulfillment' },
  { id: 'ReadyForPickup', name: '15. Ready for Pickup & QR', category: 'Fulfillment' },
  { id: 'PharmacyChat', name: '16. Pharmacy Direct Chat', category: 'Support' },
  { id: 'ReportIssue', name: '17. Report Issue / Refund Claim', category: 'Support' },
  { id: 'Profile', name: '18. Customer Profile Settings', category: 'Account' },
];

export const ScreenJumperDrawer: React.FC<ScreenSwitcherProps> = ({ currentScreen, onSelectScreen }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
        accessibilityLabel="Open Developer Screen Switcher Bar"
      >
        <Layers color={COLORS.deepIndigo} size={18} />
        <Text style={styles.triggerText}>Screen: {currentScreen}</Text>
        <ChevronRight color={COLORS.deepIndigo} size={16} />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>MediPick Demo Screen Switcher</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <X color={COLORS.deepIndigo} size={22} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Tap any screen below to preview instantly without navigating through steps:</Text>

            <ScrollView style={styles.screenList}>
              {ALL_SCREENS.map((item) => {
                const isSelected = item.id === currentScreen;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.screenItem, isSelected && styles.screenItemSelected]}
                    onPress={() => {
                      onSelectScreen(item.id);
                      setIsOpen(false);
                    }}
                  >
                    <Text style={[styles.screenText, isSelected && styles.screenTextSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    backgroundColor: COLORS.limeWhisper,
    borderColor: COLORS.softLime,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  triggerText: {
    color: COLORS.deepIndigo,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.deepIndigo,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  closeBtn: {
    padding: 6,
  },
  screenList: {
    marginBottom: 16,
  },
  screenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenItemSelected: {
    backgroundColor: COLORS.limeWhisper,
    borderRadius: 8,
  },
  screenText: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  screenTextSelected: {
    color: COLORS.deepTeal,
    fontWeight: '800',
  },
  categoryBadge: {
    fontSize: 11,
    color: COLORS.deepTeal,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontWeight: '700',
  },
});
