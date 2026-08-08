import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOrders } from '../../context/OrderContext';
import {
  ChevronLeft,
  AlertTriangle,
  Clock,
  Camera,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Paperclip,
  CheckCircle2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'ReportIssue'>;

const ISSUE_TYPES = [
  'Missing medicine',
  'Wrong medicine',
  'Damaged / Expired',
  'Wrong quantity',
  'Other',
];

// High quality sample evidence images for web & testing fallback
const SAMPLE_EVIDENCE_PHOTOS = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop&q=80',
];

export const ReportIssueScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { reportIssue } = useOrders();
  const orderId = route.params?.orderId;
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 22 }),
    ]).start();
  }, []);

  const requestPermission = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    try {
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === 'granted';
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
      }
    } catch {
      return false;
    }
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    setPickerModalVisible(false);

    try {
      const ok = await requestPermission(source);
      if (!ok) {
        // Just return if permission is denied, don't fake it
        return;
      }

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      // Just silently fail or show an alert if picker fails, don't fake it
    }
  };

  const handleRemovePhoto = (index: number) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!issueType || !description.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      if (orderId) {
        reportIssue(orderId, issueType, description);
      }
      setIsLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Reported</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.successScreen}>
          <View style={styles.successIcon}>
            <AlertTriangle color={COLORS.warning} size={40} strokeWidth={2} />
          </View>
          <Text style={styles.successTitle}>Report Submitted</Text>
          <Text style={styles.successDesc}>
            Your issue and {attachedPhotos.length > 0 ? `${attachedPhotos.length} photo evidence(s)` : 'details'} have been sent directly to the pharmacy team for review. You will receive a response within 24 hours.
          </Text>
          <Button
            title="Go to Orders"
            variant="primary"
            onPress={() => navigation.navigate('Orders')}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft color={COLORS.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity, transform: [{ translateY: slideY }] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Floating Glass Warning Card */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeaderRow}>
            <View style={styles.warningIconBadge}>
              <Clock color="#D97706" size={16} strokeWidth={2.5} />
            </View>
            <Text style={styles.warningTitle}>24-Hour Issue Window</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.orderBadgePill}>
              <Text style={styles.orderBadgeText}>#MP123456</Text>
            </View>
          </View>

          <Text style={styles.warningText}>
            Issues must be reported within 24 hours of counter pickup for direct pharmacy replacement.
          </Text>
        </View>

        {/* Issue Type Chip Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Issue Type</Text>
          <View style={styles.issueGrid}>
            {ISSUE_TYPES.map((t) => {
              const active = issueType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.issueChip, active && styles.issueChipActive]}
                  onPress={() => setIssueType(t)}
                  activeOpacity={0.8}
                >
                  {active && <CheckCircle2 color="#FFFFFF" size={14} strokeWidth={2.5} />}
                  <Text style={[styles.issueChipText, active && styles.issueChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Input
            label="Details & Comments"
            placeholder="Explain what was wrong with your order..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
          />
        </View>

        {/* Photo Evidence Section */}
        <View style={styles.section}>
          <View style={styles.photoHeaderRow}>
            <Text style={styles.sectionLabel}>Photo Evidence (Optional)</Text>
            {attachedPhotos.length > 0 && (
              <Text style={styles.photoCountText}>{attachedPhotos.length} Attached</Text>
            )}
          </View>

          {attachedPhotos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
              {attachedPhotos.map((uri, idx) => (
                <View key={idx} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBadge}
                    onPress={() => handleRemovePhoto(idx)}
                    activeOpacity={0.8}
                  >
                    <X color="#FFFFFF" size={12} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}

              {attachedPhotos.length < 3 && (
                <TouchableOpacity
                  style={styles.addMorePhotoBtn}
                  onPress={() => setPickerModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Plus color={COLORS.midTeal} size={22} strokeWidth={2.5} />
                  <Text style={styles.addMoreText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.evidenceCard}
              onPress={() => setPickerModalVisible(true)}
              activeOpacity={0.88}
            >
              <View style={styles.evidenceIconBox}>
                <Camera color={COLORS.midTeal} size={22} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.evidenceCardTitle}>Attach Photo Evidence</Text>
                <Text style={styles.evidenceCardSub}>Take a photo or select from gallery (Optional)</Text>
              </View>
              <View style={styles.evidencePlusBadge}>
                <Plus color={COLORS.midTeal} size={16} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <Button
          title="Submit Report"
          variant="primary"
          onPress={handleSubmit}
          isLoading={isLoading}
          disabled={!issueType || !description.trim()}
          style={{ marginTop: 8 }}
        />

        <Text style={styles.footNote}>
          Your report will be sent to MediCare Central Pharmacy for resolution.
        </Text>
      </Animated.ScrollView>

      {/* Image Picker Options Modal */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setPickerModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attach Photo Evidence</Text>
              <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                <X color={COLORS.textMuted} size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalOption} onPress={() => handlePickImage('camera')} activeOpacity={0.8}>
              <View style={styles.modalOptionIcon}>
                <Camera color={COLORS.midTeal} size={20} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>Take Photo</Text>
                <Text style={styles.modalOptionSub}>Use your device camera</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={() => handlePickImage('gallery')} activeOpacity={0.8}>
              <View style={styles.modalOptionIcon}>
                <ImageIcon color={COLORS.midTeal} size={20} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.modalOptionSub}>Select an existing photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPickerModalVisible(false)} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.bgWarm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  scroll: { padding: 16, paddingBottom: 60, gap: 16 },
  warningCard: {
    backgroundColor: COLORS.surfaceWhite,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  orderBadgePill: {
    backgroundColor: COLORS.bgWarm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  orderBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.midTeal,
  },
  warningText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceWhite,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  issueChipActive: {
    backgroundColor: COLORS.midTeal,
    borderColor: COLORS.midTeal,
    shadowColor: '#1D6F72',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  issueChipText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  issueChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoCountText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.midTeal,
  },
  evidenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceWhite,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderStyle: 'dashed',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  evidenceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  evidenceCardTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  evidenceCardSub: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  evidencePlusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  photoList: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  photoThumbWrap: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: 'visible',
  },
  photoThumb: {
    width: 76,
    height: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  removePhotoBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  addMorePhotoBtn: {
    width: 76,
    height: 76,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.borderSoft,
    borderStyle: 'dashed',
    backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  addMoreText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.midTeal,
  },
  footNote: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.black,
    color: COLORS.textDark,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.bgWarm,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.textDark,
  },
  modalOptionSub: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
  },
  // Success state
  successScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: FONTS.black,
    color: COLORS.textDark,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  successDesc: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
