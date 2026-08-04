import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, StatusBar, TextInput, Image, Platform, Pressable, Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, Camera, ImagePlus, CheckCircle2,
  Trash2, MessageSquare, AlertCircle, ShoppingBag, Plus, Check, Store, Search, X
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { MOCK_MEDICINES } from '../../mock/demoData';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'UploadPrescription'>;

export const UploadPrescriptionScreen = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const targetPharmacyId   = route.params?.pharmacyId;
  const targetPharmacyName = route.params?.pharmacyName;

  const [note, setNote]                   = useState('');
  const [image, setImage]                 = useState<string | null>(null);
  const [selectedExtraItems, setSelectedExtraItems] = useState<string[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [customItems, setCustomItems]       = useState<{ id: string; name: string; price: string }[]>([]);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(14)).current;

  // OTC Catalog items for extra requested items (Filtering out Rx prescription-only meds)
  const catalogList = [
    ...customItems,
    ...MOCK_MEDICINES
      .filter((m) => !m.isRxRequired) // Prescription meds CANNOT be directly added to cart
      .map((m) => ({
        id: m.id,
        name: `${m.name} (${m.dosage})`,
        price: `Starting from LKR ${m.pharmacyPrice}`,
      })),
  ];

  const filteredCatalog = catalogList.filter((item) =>
    item.name.toLowerCase().includes(itemSearchQuery.trim().toLowerCase())
  );

  const handleAddCustomItem = () => {
    if (!itemSearchQuery.trim()) return;
    const newId = `custom-${Date.now()}`;
    const newItem = {
      id: newId,
      name: itemSearchQuery.trim(),
      price: 'Quote upon request',
    };
    setCustomItems([newItem, ...customItems]);
    setSelectedExtraItems([...selectedExtraItems, newId]);
    setItemSearchQuery('');
  };

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const requestPermission = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        // Instant high quality sample prescription image for web demonstration
        setImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
        return;
      }
      const ok = await requestPermission('camera');
      if (!ok) {
        setImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      } else {
        setImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
      }
    } catch {
      setImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
    }
  };

  const pickFromGallery = async () => {
    try {
      if (Platform.OS === 'web') {
        setImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
        return;
      }
      const ok = await requestPermission('gallery');
      if (!ok) {
        setImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      } else {
        setImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
      }
    } catch {
      setImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80');
    }
  };

  const clearImage = () => setImage(null);

  const proceed = () => {
    navigation.navigate('AIQualityCheck', {
      clarityScore: 94,
      pharmacyId: targetPharmacyId,
      pharmacyName: targetPharmacyName,
      selectedItems: selectedExtraItems,
    });
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.peacockBlue} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>{targetPharmacyName ? `Prescription for ${targetPharmacyName}` : 'Prescription Upload'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {targetPharmacyName && (
        <View style={s.targetBanner}>
          <Store color={COLORS.deepTeal} size={18} strokeWidth={2} />
          <Text style={s.targetBannerText}>
            Attaching directly to <Text style={{ fontFamily: FONTS.black }}>{targetPharmacyName}</Text>
          </Text>
        </View>
      )}

      <Animated.ScrollView
        style={{ opacity, transform: [{ translateY: slideY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Preview or Camera Zone */}
        {image ? (
          <View style={s.previewContainer}>
            <Image source={{ uri: image }} style={s.previewImage} resizeMode="cover" />
            {/* Floating Glassmorphic Icon Overlay Bar */}
            <View style={s.floatingIconOverlay}>
              <TouchableOpacity style={s.iconActionBtn} onPress={takePhoto} activeOpacity={0.8}>
                <Camera color="#FFFFFF" size={18} strokeWidth={2.2} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconActionBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                <ImagePlus color="#FFFFFF" size={18} strokeWidth={2.2} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.iconActionBtn, s.iconActionBtnDelete]} onPress={clearImage} activeOpacity={0.8}>
                <Trash2 color="#EF4444" size={18} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Take Photo Button */}
            <TouchableOpacity style={s.cameraZone} onPress={takePhoto} activeOpacity={0.88}>
              <View style={s.cameraCircle}>
                <Camera color={COLORS.deepTeal} size={32} strokeWidth={2} />
              </View>
              <Text style={s.cameraTitle}>Take Photo</Text>
              <Text style={s.cameraSub}>Position prescription in frame</Text>
            </TouchableOpacity>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>OR</Text>
              <View style={s.orLine} />
            </View>

            {/* Pick from Gallery */}
            <TouchableOpacity style={s.fileBtn} onPress={pickFromGallery} activeOpacity={0.85}>
              <ImagePlus color={COLORS.peacockBlue} size={18} strokeWidth={2} />
              <Text style={s.fileBtnText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Interactive Extra Items Card */}
        <View style={s.extraItemsContainer}>
          <View style={s.extraItemsHeader}>
            <ShoppingBag color={COLORS.midTeal} size={18} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={s.extraItemsTitle}>Add Pharmacy Items & Supplies</Text>
              <Text style={s.extraItemsSub}>Your prescription will be processed from the photo. Add any everyday pharmacy items below.</Text>
            </View>
          </View>

          {/* Search / Add Input Bar */}
          <View style={s.extraSearchBar}>
            <Search color={COLORS.textMuted} size={16} strokeWidth={2.5} />
            <TextInput
              style={s.extraSearchInput}
              placeholder="Search pharmacy items (e.g. Panadol, Bandages)..."
              placeholderTextColor={COLORS.textMuted}
              value={itemSearchQuery}
              onChangeText={setItemSearchQuery}
            />
            {itemSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setItemSearchQuery('')} style={{ padding: 4 }}>
                <X color={COLORS.textMuted} size={15} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* If search query doesn't match existing catalog, offer custom "Add Item" button */}
          {itemSearchQuery.trim().length > 0 && filteredCatalog.length === 0 && (
            <TouchableOpacity style={s.addCustomBtn} onPress={handleAddCustomItem} activeOpacity={0.8}>
              <Plus color="#FFF" size={16} strokeWidth={3} />
              <Text style={s.addCustomBtnText}>Add "{itemSearchQuery.trim()}" to Request</Text>
            </TouchableOpacity>
          )}

          {/* Items List */}
          <View style={s.extraItemsList}>
            {filteredCatalog.map((item) => {
              const isSelected = selectedExtraItems.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.extraChip, isSelected && s.extraChipSelected]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedExtraItems(selectedExtraItems.filter((i) => i !== item.id));
                    } else {
                      setSelectedExtraItems([...selectedExtraItems, item.id]);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[s.chipCheck, isSelected && s.chipCheckActive]}>
                    {isSelected && <Check color="#FFF" size={12} strokeWidth={3} />}
                  </View>
                  <Text style={[s.extraChipName, isSelected && s.extraChipNameActive]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={s.extraChipPrice}>{item.price}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Instruction Note for Pharmacist */}
        <View style={s.noteContainer}>
          <View style={s.noteHeaderRow}>
            <MessageSquare color={COLORS.midTeal} size={16} strokeWidth={2} />
            <Text style={s.noteTitle}>Additional Notes for Pharmacist</Text>
          </View>
          <TextInput
            style={s.noteInput}
            placeholder="E.g. Please specify brand preferences or special pharmacy instructions"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={note}
            onChangeText={setNote}
          />
        </View>

        <Button
          title="Continue to Quality Check"
          onPress={proceed}
          disabled={!image}
          style={{ marginTop: 4 }}
        />
      </Animated.ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: COLORS.peacockBlue },
  scroll: { padding: 16, paddingBottom: 60, gap: 14 },

  // Camera zone (empty state)
  cameraZone: {
    backgroundColor: COLORS.white, borderRadius: 18, padding: 32,
    alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.deepTeal,
  },
  cameraCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  cameraTitle: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.peacockBlue },
  cameraSub: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.textMuted },

  fileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0', height: 50, paddingHorizontal: 15,
  },
  fileBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.peacockBlue },

  // Photo preview (filled state)
  previewContainer: {
    backgroundColor: COLORS.white, borderRadius: 18,
    overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.deepTeal,
    position: 'relative',
  },
  previewImage: { width: '100%', height: 220 },
  floatingIconOverlay: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', padding: 6, borderRadius: 16,
  },
  iconActionBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconActionBtnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },

  // Extra OTC Items Card
  extraItemsContainer: {
    backgroundColor: COLORS.white, borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0', gap: 12,
  },
  extraItemsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  extraItemsTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.peacockBlue },
  extraItemsSub: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  extraSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAF7', borderRadius: 12, paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  extraSearchInput: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textDark, height: '100%' },
  addCustomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.midTeal, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  addCustomBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' },
  extraItemsList: { gap: 8 },
  extraChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAF7', borderRadius: 12, padding: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  extraChipSelected: {
    backgroundColor: COLORS.limeWhisper, borderColor: '#D6EDA0',
  },
  chipCheck: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF',
  },
  chipCheckActive: {
    backgroundColor: COLORS.midTeal, borderColor: COLORS.midTeal,
  },
  extraChipName: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textDark },
  extraChipNameActive: { fontFamily: FONTS.bold, color: COLORS.deepTeal },
  extraChipPrice: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.midTeal },

  // Note
  noteContainer: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0', gap: 8,
  },
  noteHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteTitle: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.peacockBlue },
  noteInput: {
    backgroundColor: '#F8FAF7', borderRadius: 12, padding: 12,
    fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textDark,
    minHeight: 70, borderWidth: 1, borderColor: '#E2E8F0',
  },

  requiredHint: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  targetBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#D6EDA0',
  },
  targetBannerText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.deepTeal },
});
