import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, StatusBar, TextInput, Image, Platform, Pressable, Alert,
  KeyboardAvoidingView, Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, ChevronRight, Camera, ImagePlus, CheckCircle2,
  Trash2, MessageSquare, AlertCircle, ShoppingBag, Plus, Minus, Check, Store, Search, X, Info
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { MOCK_MEDICINES } from '../../mock/demoData';
import { useCart } from '../../context/CartContext';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'UploadPrescription'>;

export const UploadPrescriptionScreen = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const targetPharmacyId   = route.params?.pharmacyId;
  const targetPharmacyName = route.params?.pharmacyName;
  const { setAttachedPrescription } = useCart();

  const [note, setNote]                   = useState('');
  const [image, setImage]                 = useState<string | null>(null);
  
  // Track extra items quantity dictionary: { [itemId]: quantity }
  const [selectedItemQtys, setSelectedItemQtys] = useState<Record<string, number>>(
    route.params?.initialSelectedExtraItems || {}
  );

  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [customItems, setCustomItems]       = useState<{ id: string; name: string; price: string; image?: any; dosage?: string; description?: string }[]>([]);
  const [detailModalItem, setDetailModalItem] = useState<any | null>(null);
  const [currentPage, setCurrentPage]         = useState(1);
  const ITEMS_PER_PAGE = 4;

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(14)).current;

  // OTC Catalog items for extra requested items
  const catalogList = [
    ...customItems,
    ...MOCK_MEDICINES
      .filter((m) => !m.isRxRequired)
      .map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        category: m.category,
        description: m.description || 'Quality health & wellness supply.',
        price: `Estimated LKR ${m.pharmacyPrice}`,
        image: m.image,
      })),
  ];

  const filteredCatalog = catalogList.filter((item) =>
    item.name.toLowerCase().includes(itemSearchQuery.trim().toLowerCase()) ||
    (item.dosage && item.dosage.toLowerCase().includes(itemSearchQuery.trim().toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCatalog = filteredCatalog.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemSearchQuery]);

  const handleAddCustomItem = () => {
    if (!itemSearchQuery.trim()) return;
    const newId = `custom-${Date.now()}`;
    const newItem = {
      id: newId,
      name: itemSearchQuery.trim(),
      dosage: 'Custom Request',
      price: 'Quoted upon request',
      description: 'Custom requested pharmacy item specified by patient.',
    };
    setCustomItems([newItem, ...customItems]);
    setSelectedItemQtys((prev) => ({ ...prev, [newId]: 1 }));
    setItemSearchQuery('');
  };

  const setItemQty = (id: string, delta: number) => {
    setSelectedItemQtys((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
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
    if (!image) {
      if (Platform.OS === 'web') {
        window.alert('Please take a photo or upload an image of your prescription first.');
      } else {
        Alert.alert('Missing Prescription', 'Please take a photo or upload an image of your prescription first.');
      }
      return;
    }

    if (targetPharmacyId && targetPharmacyName) {
      setAttachedPrescription({
        image,
        note,
        pharmacyId: targetPharmacyId,
        pharmacyName: targetPharmacyName,
      });
      navigation.navigate('AIQualityCheck', {
        clarityScore: 94,
        pharmacyId: targetPharmacyId,
        pharmacyName: targetPharmacyName,
        nextScreen: 'Tabs',
        nextParams: { screen: 'Cart' }
      });
    } else {
      const selectedItemIds = Object.keys(selectedItemQtys);
      navigation.navigate('AIQualityCheck', {
        clarityScore: 94,
        pharmacyId: targetPharmacyId,
        pharmacyName: targetPharmacyName,
        selectedItems: selectedItemIds,
        selectedExtraItemsDict: selectedItemQtys,
      });
    }
  };

  const totalSelectedItemsCount = Object.values(selectedItemQtys).reduce((a, b) => a + b, 0);

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
            <TouchableOpacity style={s.cameraZone} onPress={takePhoto} activeOpacity={0.88}>
              <View style={s.cameraCircle}>
                <Camera color={COLORS.midTeal} size={32} strokeWidth={2.2} />
              </View>
              <Text style={s.cameraTitle}>Take Prescription Photo</Text>
              <Text style={s.cameraSub}>Hold camera steady under bright lighting</Text>
            </TouchableOpacity>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>OR</Text>
              <View style={s.orLine} />
            </View>

            <TouchableOpacity style={s.fileBtn} onPress={pickFromGallery} activeOpacity={0.8}>
              <ImagePlus color={COLORS.midTeal} size={20} strokeWidth={2.2} />
              <Text style={s.fileBtnText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Prescription Instructions / Notes Card */}
        <View style={s.noteContainer}>
          <View style={s.noteHeaderRow}>
            <MessageSquare color={COLORS.midTeal} size={16} strokeWidth={2.2} />
            <Text style={s.noteTitle}>Prescription Instructions for Pharmacist</Text>
          </View>
          <TextInput
            style={s.noteInput}
            placeholder="E.g. Only need the first 2 items listed, or 1-week supply..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Extra OTC Items Card */}
        {targetPharmacyId ? (
          <View style={[s.extraItemsContainer, { paddingBottom: 24, marginTop: 10 }]}>
            <View style={s.extraHeaderBanner}>
              <View style={s.catchyIconBox}>
                <Store color={COLORS.midTeal} size={22} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.catchyTitle}>Need everyday items?</Text>
                <Text style={s.catchySub}>Browse {targetPharmacyName}'s catalog to add OTC medicines or wellness items directly to this order.</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={s.browseStoreBtn} 
              activeOpacity={0.88}
              onPress={() => {
                if (!image) {
                  if (Platform.OS === 'web') {
                    window.alert('Please take a photo or upload an image of your prescription first before browsing for extra items.');
                  } else {
                    Alert.alert('Missing Prescription', 'Please upload your prescription first before browsing for extra items.');
                  }
                  return;
                }
                setAttachedPrescription({
                  image,
                  note,
                  pharmacyId: targetPharmacyId,
                  pharmacyName: targetPharmacyName!,
                });
                navigation.navigate('AIQualityCheck', {
                  clarityScore: 94,
                  pharmacyId: targetPharmacyId,
                  pharmacyName: targetPharmacyName,
                  nextScreen: 'Tabs',
                  nextParams: { screen: 'Browse', params: { storeId: targetPharmacyId, initialMode: 'meds' } }
                });
              }}
            >
              <ShoppingBag color={COLORS.midTeal} size={18} strokeWidth={2.5} />
              <Text style={s.browseStoreBtnText}>Browse {targetPharmacyName}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.extraItemsContainer}>
            <View style={s.extraHeaderBanner}>
              <View style={s.catchyIconBox}>
                <ShoppingBag color={COLORS.midTeal} size={22} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={s.needMedsBadge}>
                    <Text style={s.needMedsBadgeText}>ADD-ON REQUEST</Text>
                  </View>
                  {totalSelectedItemsCount > 0 && (
                    <View style={s.selectedCountPill}>
                      <Text style={s.selectedCountText}>{totalSelectedItemsCount} added</Text>
                    </View>
                  )}
                </View>
                <Text style={s.catchyTitle}>Need everyday wellness items?</Text>
                <Text style={s.catchySub}>Add items below to get quotes for everything in one go!</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={s.extraSearchBar}>
              <Search color={COLORS.textMuted} size={16} strokeWidth={2} />
              <TextInput
                style={s.extraSearchInput}
                placeholder="Search items (e.g. Panadol, Bandages)..."
                placeholderTextColor={COLORS.textMuted}
                value={itemSearchQuery}
                onChangeText={setItemSearchQuery}
              />
              {itemSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setItemSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X color={COLORS.textMuted} size={16} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            {itemSearchQuery.trim().length > 0 && filteredCatalog.length === 0 && (
              <TouchableOpacity style={s.addCustomBtn} onPress={handleAddCustomItem} activeOpacity={0.8}>
                <Plus color="#FFF" size={16} strokeWidth={3} />
                <Text style={s.addCustomBtnText}>Add "{itemSearchQuery.trim()}" to Request</Text>
              </TouchableOpacity>
            )}

            {/* Premium 2-Column Grid Items List (Paginated) */}
            <View style={s.extraGrid}>
              {paginatedCatalog.map((item) => {
                const qty = selectedItemQtys[item.id] || 0;
                const isSelected = qty > 0;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.gridCard, isSelected && s.gridCardSelected]}
                    onPress={() => setDetailModalItem(item)}
                    activeOpacity={0.93}
                  >
                    {/* Image Box — same as Browse productImgBox */}
                    <View style={[s.gridImgBox, isSelected && s.gridImgBoxSelected]}>
                      {item.image ? (
                        <Image source={item.image} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                      ) : (
                        <ShoppingBag color={COLORS.midTeal} size={28} strokeWidth={2} />
                      )}
                      {/* Info overlay top-right */}
                      <TouchableOpacity
                        style={s.gridInfoBadge}
                        onPress={() => setDetailModalItem(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Info color="rgba(255,255,255,0.9)" size={13} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>

                    {/* Name & Dosage */}
                    <Text style={s.gridProdName} numberOfLines={2}>{item.name}</Text>
                    <Text style={s.gridProdDosage} numberOfLines={1}>{item.dosage || 'Standard'}</Text>

                    {/* Footer: Price + Stepper */}
                    <View style={s.gridCardFooter}>
                      <View style={{ gap: 1 }}>
                        <Text style={s.gridProdPricePrefix}>Starting from</Text>
                        <Text style={s.gridProdPrice}>{item.price?.replace('Estimated ', '')}</Text>
                      </View>
                      {isSelected ? (
                        <View style={s.gridStepperBox}>
                          <TouchableOpacity
                            style={s.gridStepBtn}
                            onPress={(e) => { e.stopPropagation?.(); setItemQty(item.id, -1); }}
                            activeOpacity={0.7}
                          >
                            <Minus color={COLORS.midTeal} size={12} strokeWidth={3} />
                          </TouchableOpacity>
                          <Text style={s.gridStepQty}>{qty}</Text>
                          <TouchableOpacity
                            style={s.gridStepBtn}
                            onPress={(e) => { e.stopPropagation?.(); setItemQty(item.id, 1); }}
                            activeOpacity={0.7}
                          >
                            <Plus color={COLORS.midTeal} size={12} strokeWidth={3} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={s.gridAddCircle}
                          onPress={(e) => { e.stopPropagation?.(); setItemQty(item.id, 1); }}
                          activeOpacity={0.85}
                        >
                          <Plus color="#FFF" size={14} strokeWidth={3} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pagination Controls */}
            {filteredCatalog.length > ITEMS_PER_PAGE && (
              <View style={s.paginationContainer}>
                <Text style={s.paginationInfoText}>
                  Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredCatalog.length)} of {filteredCatalog.length} items
                </Text>
                <View style={s.paginationRow}>
                  <TouchableOpacity
                    style={[s.pageNavBtn, currentPage === 1 && s.pageNavBtnDisabled]}
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft color={currentPage === 1 ? '#94A3B8' : COLORS.midTeal} size={16} strokeWidth={2.5} />
                  </TouchableOpacity>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <TouchableOpacity
                      key={pageNum}
                      style={[s.pageNumberBtn, pageNum === currentPage && s.pageNumberBtnActive]}
                      onPress={() => setCurrentPage(pageNum)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.pageNumberText, pageNum === currentPage && s.pageNumberTextActive]}>
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={[s.pageNavBtn, currentPage === totalPages && s.pageNavBtnDisabled]}
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    activeOpacity={0.7}
                  >
                    <ChevronRight color={currentPage === totalPages ? '#94A3B8' : COLORS.midTeal} size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        <Button
          title="Continue to Quality Check"
          onPress={proceed}
          disabled={!image}
          style={{ marginTop: 4 }}
        />
      </Animated.ScrollView>

      {/* Product Details Modal */}
      <Modal visible={!!detailModalItem} animationType="slide" transparent onRequestClose={() => setDetailModalItem(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setDetailModalItem(null)}>
              <X color={COLORS.textDark} size={18} strokeWidth={2.5} />
            </TouchableOpacity>

            {detailModalItem && (
              <>
                <View style={s.modalImgBox}>
                  {detailModalItem.image ? (
                    <Image source={detailModalItem.image} style={s.modalImg} resizeMode="contain" />
                  ) : (
                    <ShoppingBag color={COLORS.midTeal} size={48} strokeWidth={2} />
                  )}
                </View>

                <Text style={s.modalTitle}>{detailModalItem.name}</Text>
                {detailModalItem.dosage && <Text style={s.modalDosage}>{detailModalItem.dosage}</Text>}

                <View style={s.modalPriceBadge}>
                  <Text style={s.modalPriceText}>{detailModalItem.price}</Text>
                </View>

                <Text style={s.modalDesc}>{detailModalItem.description}</Text>

                {/* Quantity Control in Modal */}
                <View style={s.modalFooterRow}>
                  <View style={s.modalQtyBox}>
                    <TouchableOpacity
                      style={s.modalQtyBtn}
                      onPress={() => setItemQty(detailModalItem.id, -1)}
                    >
                      <Minus color={COLORS.midTeal} size={16} strokeWidth={3} />
                    </TouchableOpacity>
                    <Text style={s.modalQtyText}>{selectedItemQtys[detailModalItem.id] || 0}</Text>
                    <TouchableOpacity
                      style={s.modalQtyBtn}
                      onPress={() => setItemQty(detailModalItem.id, 1)}
                    >
                      <Plus color={COLORS.midTeal} size={16} strokeWidth={3} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={s.modalAddDoneBtn}
                    onPress={() => setDetailModalItem(null)}
                  >
                    <Text style={s.modalAddDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: COLORS.white, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#E2E8F0', gap: 12,
  },
  browseStoreBtn: {
    backgroundColor: COLORS.limeWhisper,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
  },
  browseStoreBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.deepTeal,
  },
  extraHeaderBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catchyIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: COLORS.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  needMedsBadge: {
    backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  needMedsBadgeText: { fontFamily: FONTS.extrabold, fontSize: 8, color: '#EA580C', letterSpacing: 0.5 },
  catchyTitle: { fontFamily: FONTS.black, fontSize: 16, color: COLORS.peacockBlue, letterSpacing: -0.3 },
  catchySub: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
  selectedCountPill: {
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  selectedCountText: { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.midTeal },

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
  // 2-col grid — matches Browse productCard/productImgBox exactly
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridCard: {
    width: '47.5%', backgroundColor: COLORS.white, borderRadius: 20, padding: 12,
    borderWidth: 1, borderColor: '#E8EDF2', gap: 4,
  },
  gridCardSelected: { borderColor: '#D6EDA0', backgroundColor: COLORS.limeWhisper },
  gridImgBox: {
    height: 120, backgroundColor: COLORS.limeWhisper, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 6, padding: 6,
    overflow: 'hidden',
  },
  gridImgBoxSelected: { backgroundColor: '#EDF9E6' },
  gridInfoBadge: {
    position: 'absolute', top: 7, right: 7,
    backgroundColor: 'rgba(15,23,42,0.38)', borderRadius: 10, padding: 4,
  },
  gridProdName: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textDark, lineHeight: 17 },
  gridProdDosage: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  gridCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  gridProdPricePrefix: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textMuted },
  gridProdPrice: { fontFamily: FONTS.black, fontSize: 13, color: COLORS.textDark },
  gridStepperBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.limeWhisper, borderRadius: 10, paddingHorizontal: 6, height: 30,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  gridStepBtn: { width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  gridStepQty: { fontFamily: FONTS.black, fontSize: 12, color: COLORS.midTeal },
  gridAddCircle: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.midTeal,
    justifyContent: 'center', alignItems: 'center',
  },

  paginationContainer: {
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  paginationInfoText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6EDA0',
  },
  pageNavBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  pageNumberBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAF7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageNumberBtnActive: {
    backgroundColor: COLORS.midTeal,
    borderColor: COLORS.midTeal,
  },
  pageNumberText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textDark,
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, gap: 10, position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  modalImgBox: {
    height: 140, backgroundColor: COLORS.limeWhisper, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginVertical: 6,
  },
  modalImg: { width: 120, height: 120 },
  modalTitle: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark },
  modalDosage: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textMuted },
  modalPriceBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.limeWhisper,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  modalPriceText: { fontFamily: FONTS.black, fontSize: 13, color: COLORS.midTeal },
  modalDesc: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginVertical: 4 },
  modalFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  modalQtyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8FAF7', borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  modalQtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  modalQtyText: { fontFamily: FONTS.black, fontSize: 15, color: COLORS.midTeal },
  modalAddDoneBtn: {
    flex: 1, backgroundColor: COLORS.midTeal, borderRadius: 12, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  modalAddDoneText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFF' },

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
  targetBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#D6EDA0',
  },
  targetBannerText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.deepTeal },
});
