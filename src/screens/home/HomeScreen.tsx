import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Pressable,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search, ShieldCheck, Upload, Star, MapPin, Clock,
  ChevronDown, ChevronRight, ShoppingBag, Bell, Store, ShoppingCart, Plus, Minus, X, Heart, Check, Tag, Pill
} from 'lucide-react-native';
import { PrescriptionHeroGraphic, CategoryTileGraphic } from '../../components/common/HeroIllustrations';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MOCK_PHARMACIES, MOCK_ORDERS, MOCK_MEDICINES, togglePharmacyFavorite } from '../../mock/demoData';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get('window');

const AnimatedHeartButton = ({ isFavorite, onPress }: { isFavorite: boolean, onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = (e: any) => {
    e.stopPropagation();
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.6, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity 
      style={s.favBtn} 
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      onPress={handlePress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Heart 
          color={isFavorite ? "#EF4444" : COLORS.borderSoft} 
          size={18} 
          strokeWidth={2} 
          fill={isFavorite ? "#EF4444" : "transparent"} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const CATEGORIES_MEDICHY = [
  { id: 'vitamins',    name: 'Vitamins',    type: 'vitamins' as const },
  { id: 'firstaid',    name: 'First Aid',   type: 'firstaid' as const },
  { id: 'supplements', name: 'Supplements', type: 'supplements' as const },
  { id: 'skincare',    name: 'Skincare',    type: 'skincare' as const },
];

const LOCATIONS_LIST = [
  'Colombo 03 · Kollupitiya',
  'Colombo 07 · Cinnamon Gardens',
  'Colombo 05 · Havelock Town',
  'Dehiwala · Station Road',
  'Mount Lavinia · Beach Road',
];

export const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery]       = useState('');
  const { cartItems }                       = useCart();
  const [, setFavTick]                      = useState(0);
  const [currentLocation, setCurrentLocation] = useState('Colombo 03 · Nearby Pharmacies');
  const [locationModal, setLocationModal]   = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const handleToggleFav = (id: string) => {
    togglePharmacyFavorite(id);
    setFavTick((t) => t + 1);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrders = MOCK_ORDERS.filter((o) => o.state === 'PREPARING' || o.state === 'READY_FOR_PICKUP');

  const q = searchQuery.trim().toLowerCase();
  const filteredMedicines = q
    ? MOCK_MEDICINES.filter(
        (m) => m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      )
    : MOCK_MEDICINES.slice(0, 4);

  const filteredPharmacies = q
    ? MOCK_PHARMACIES.filter(
        (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
      )
    : MOCK_PHARMACIES;

  const filteredLocations = LOCATIONS_LIST.filter((loc) =>
    loc.toLowerCase().includes(locationSearch.trim().toLowerCase())
  );

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />

      {/* DoorDash Style Header Navbar */}
      <View style={s.topBar}>
        <View style={s.userInfoRow}>
          <TouchableOpacity style={s.avatarCircle} onPress={() => (navigation as any).navigate('Profile')}>
            <Text style={s.avatarInitial}>P</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setLocationModal(true)} 
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ flex: 1, paddingRight: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={s.deliverLabel}>COUNTER PICKUP ONLY</Text>
              <ChevronDown color={COLORS.midTeal} size={14} strokeWidth={2.8} />
            </View>
            <Text style={s.greetingTitle} numberOfLines={1} ellipsizeMode="tail">{currentLocation}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity 
            style={s.bellBtn} 
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('MultiStoreCart')}
          >
            <ShoppingCart color={COLORS.textDark} size={19} strokeWidth={2} />
            {totalCartCount > 0 && (
              <View style={s.cartBadgeTop}>
                <Text style={s.cartBadgeTopText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.bellBtn} 
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('Notifications')}
          >
            <Bell color={COLORS.textDark} size={19} strokeWidth={2} />
            <View style={s.bellDot} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activeOrders.length > 0 && (
          <TouchableOpacity 
            style={s.activeOrderBanner}
            onPress={() => (navigation as any).navigate('Tabs', { screen: 'Orders' })}
            activeOpacity={0.9}
          >
            <View style={s.bannerDotPulse} />
            <Text style={s.bannerText}>{activeOrders.length} Live Order{activeOrders.length > 1 ? 's' : ''} in Progress</Text>
            <View style={{ flex: 1 }} />
            <View style={s.bannerTrackBadge}>
              <Text style={s.bannerAction}>Track</Text>
              <ChevronRight color={COLORS.midTeal} size={14} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        )}

        {/* Search Bar Input */}
        <View style={s.searchBarContainer}>
          <Search color={COLORS.midTeal} size={18} strokeWidth={2.5} />
          <TextInput
            style={s.searchInputInline}
            placeholder="Search medicines or partner pharmacies..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color={COLORS.textMuted} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions (Premium 2x2 Grid) */}
        <View style={s.quickActionsGrid}>
          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => (navigation as any).navigate('Favorites')}
            activeOpacity={0.7}
          >
            <View style={[s.actionIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Heart color="#EF4444" size={20} strokeWidth={2.5} />
            </View>
            <Text style={s.actionCardText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: 'All' } })}
            activeOpacity={0.7}
          >
            <View style={[s.actionIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Tag color="#F97316" size={20} strokeWidth={2.5} />
            </View>
            <Text style={s.actionCardText}>Offers</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => Platform.OS === 'web' ? window.alert('Pill reminders will be available in the next update!') : Alert.alert('Coming Soon', 'Pill reminders will be available in the next update!')}
            activeOpacity={0.7}
          >
            <View style={[s.actionIconBox, { backgroundColor: COLORS.plumLight }]}>
              <Pill color={COLORS.deepPlum} size={20} strokeWidth={2.5} />
            </View>
            <Text style={s.actionCardText}>Reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.actionCard}
            onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds' } })}
            activeOpacity={0.7}
          >
            <View style={[s.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Star color="#3B82F6" size={20} strokeWidth={2.5} />
            </View>
            <Text style={s.actionCardText}>Top Brands</Text>
          </TouchableOpacity>
        </View>

        {/* Prescription Hero Banner Card */}
        <TouchableOpacity
          style={s.heroBannerCard}
          onPress={() => navigation.navigate('UploadPrescription')}
          activeOpacity={0.92}
        >
          <View style={s.heroContent}>
            <View style={s.discountBadge}>
              <Text style={s.discountText}>Prescription Matching</Text>
            </View>

            <Text style={s.heroTitle}>Got a{'\n'}Prescription?</Text>
            <Text style={s.heroSub}>Upload it and get quotes from top pharmacies instantly.</Text>

            <View style={{ backgroundColor: COLORS.midTeal, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Upload color="#fff" size={14} strokeWidth={2.5} />
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' }}>Upload Prescription</Text>
            </View>
          </View>

          <PrescriptionHeroGraphic />
        </TouchableOpacity>



        {/* Categories Carousel */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: 'All' } })}>
            <Text style={s.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={s.categoriesGrid}>
          {CATEGORIES_MEDICHY.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={s.catCardTile}
              onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: cat.name } })}
              activeOpacity={0.8}
            >
              <CategoryTileGraphic type={cat.type} />
              <Text style={s.catTileName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DoorDash Style Storefront Cards (Featured Pharmacies) */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Featured Pharmacies</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'pharmacies' } })}>
            <Text style={s.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.storeCarousel}>
          {filteredPharmacies.map((p) => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [s.doorDashStoreCard, pressed && { opacity: 0.92 }]}
              onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'pharmacies', storeId: p.id } })}
            >
              <View style={s.storeHeroBanner}>
                {p.image ? (
                  <Image source={p.image} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.surfaceWhite, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
                    <Store color={COLORS.midTeal} size={26} strokeWidth={2.2} />
                  </View>
                )}

                {/* Live Open / NMRA Badge */}
                <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: COLORS.surfaceWhite, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: COLORS.textDark }}>Open Now</Text>
                </View>

                <View style={s.storeDistanceTag}>
                  <MapPin color={COLORS.midTeal} size={11} strokeWidth={2.5} />
                  <Text style={s.storeDistanceText}>{p.distance}</Text>
                </View>

                <AnimatedHeartButton 
                  isFavorite={!!p.isFavorite}
                  onPress={() => handleToggleFav(p.id)}
                />
              </View>

              <View style={s.storeMetaContainer}>
                <Text style={s.storeTitle} numberOfLines={1}>{p.name}</Text>
                <Text style={s.storeSubText} numberOfLines={1}>{p.address}</Text>

                <View style={s.storeRatingRow}>
                  <Star color="#F59E0B" size={12} fill="#F59E0B" />
                  <Text style={s.ratingText}>{p.rating}</Text>
                  <Text style={s.ratingCount}>(120+)</Text>
                  <Text style={s.bullet}>·</Text>
                  <Clock color={COLORS.textMuted} size={11} strokeWidth={2} />
                  <Text style={s.timeText}>{p.estimatedResponseTime}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Popular Healthcare Products Grid */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Popular Healthcare</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: 'All' } })}>
            <Text style={s.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={s.productGrid}>
          {filteredMedicines.map((med) => {
            const disc = Math.round(((med.mrpPrice - med.pharmacyPrice) / med.mrpPrice) * 100);
            const qty = cartItems.find(c => c.medicine.id === med.id)?.quantity || 0;

            return (
              <Pressable
                key={med.id}
                style={({ pressed }) => [s.productCard, pressed && { opacity: 0.94 }]}
                onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: med.category || 'All' } })}
              >
                <View style={s.productImgBox}>
                  {med.image ? (
                    <Image source={med.image} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                  ) : (
                    <View style={s.productPillGraphic}>
                      <ShoppingBag color={COLORS.midTeal} size={24} strokeWidth={2} />
                    </View>
                  )}
                  {disc > 0 && (
                    <View style={s.discBadge}>
                      <Text style={s.discText}>{disc}% OFF</Text>
                    </View>
                  )}
                  {med.isRxRequired && (
                    <View style={s.rxBadge}>
                      <Text style={s.rxBadgeText}>Prescription Needed</Text>
                    </View>
                  )}
                </View>

                <Text style={s.prodName} numberOfLines={1}>{med.name}</Text>
                <Text style={s.prodGeneric} numberOfLines={1}>{med.genericName}</Text>

                <View style={s.prodFooter}>
                  <View>
                    <Text style={s.fromText}>From</Text>
                    <Text style={s.prodPrice}>LKR {med.pharmacyPrice}</Text>
                  </View>

                  {/* Uber Eats Rule: Must Select Pharmacy Store First */}
                  <TouchableOpacity
                    style={s.storeCountBadge}
                    onPress={(e) => {
                      e.stopPropagation();
                      (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'pharmacies' } });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={s.storeCountText}>Select Store</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            );
          })}
        </View>

      </Animated.ScrollView>

      {/* Full-Screen Location Search Modal */}
      {locationModal && (
        <Modal
          visible={locationModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setLocationModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.bgWarm }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgWarm} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.borderSoft, gap: 12, backgroundColor: COLORS.surfaceWhite }}>
              <TouchableOpacity onPress={() => setLocationModal(false)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bgWarm, justifyContent: 'center', alignItems: 'center' }}>
                <X color={COLORS.textDark} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={{ fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark, flex: 1 }}>Select Pickup Location</Text>
            </View>

            <View style={{ padding: 20, gap: 16, flex: 1 }}>
              {/* Search Locations Input */}
              <View style={s.locationSearchBar}>
                <Search color={COLORS.midTeal} size={18} strokeWidth={2.5} />
                <TextInput
                  style={s.locationSearchInput}
                  placeholder="Search city, area, or street..."
                  placeholderTextColor={COLORS.textMuted}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                  autoFocus
                />
                {locationSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setLocationSearch('')}>
                    <X color={COLORS.textMuted} size={16} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nearby Service Locations</Text>

              {/* Location Suggestions List */}
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filteredLocations.map((loc) => {
                  const isSelected = currentLocation.includes(loc.split(' · ')[0]);

                  return (
                    <TouchableOpacity
                      key={loc}
                      style={[s.locationItemRow, isSelected && s.locationItemRowSelected, { paddingVertical: 14, marginVertical: 2 }]}
                      onPress={() => {
                        setCurrentLocation(`${loc.split(' · ')[0]} · Nearby Pharmacies`);
                        setLocationModal(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <MapPin color={isSelected ? COLORS.midTeal : COLORS.textMuted} size={18} strokeWidth={2} />
                      <Text style={[s.locationItemText, isSelected && s.locationItemTextSelected]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgWarm },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgWarm,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.midTeal,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontFamily: FONTS.black, fontSize: 18, color: '#FFFFFF' },
  deliverLabel: { fontFamily: FONTS.extrabold, fontSize: 10, color: COLORS.midTeal, letterSpacing: 0.8 },
  greetingTitle: { fontFamily: FONTS.black, fontSize: 16, color: COLORS.textDark, letterSpacing: -0.3 },

  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderSoft,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute', top: 9, right: 9,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: COLORS.midTeal,
  },
  cartBadgeTop: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.midTeal, minWidth: 18, height: 18, borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.surfaceWhite,
  },
  cartBadgeTopText: { fontFamily: FONTS.black, fontSize: 9, color: '#FFFFFF' },

  scroll: { padding: 20, paddingBottom: 100, gap: 16 },

  activeOrderBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.midTeal,
    marginTop: 4, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#1D6F72', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  bannerDotPulse: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#34D399', marginRight: 10 },
  bannerText: { fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' },
  bannerTrackBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.limeWhisper,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  bannerAction: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.midTeal },

  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surfaceWhite, borderRadius: 16,
    height: 52, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: COLORS.borderSoft,
    marginBottom: 8,
  },
  searchInputInline: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textDark },

  quickActionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: 0, paddingBottom: 16, rowGap: 12, marginTop: 6,
  },
  actionCard: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surfaceWhite, padding: 10, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.borderSoft,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionCardText: { flex: 1, fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textDark },

  heroBannerCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.heroPeach, borderRadius: 24, padding: 20,
    marginTop: 4,
    borderWidth: 1.5, borderColor: COLORS.heroPeachDark, overflow: 'hidden',
  },
  heroContent: { flex: 1, gap: 4 },
  heroTitle: { fontFamily: FONTS.black, fontSize: 22, color: COLORS.textDark, lineHeight: 26 },
  heroSub: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary, opacity: 0.9, marginTop: 2 },
  discountBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.surfaceWhite,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 6,
  },
  discountText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.midTeal },



  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark, letterSpacing: -0.4 },
  seeAllText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.midTeal },

  categoriesGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  catCardTile: { alignItems: 'center', width: '22%' },
  catTileName: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.textDark, textAlign: 'center' },

  // DoorDash Store Carousel
  storeCarousel: { gap: 14, paddingRight: 20 },
  doorDashStoreCard: {
    width: 280, backgroundColor: COLORS.surfaceWhite, borderRadius: 20, padding: 12,
    borderWidth: 1, borderColor: COLORS.borderSoft, gap: 8,
  },
  storeHeroBanner: {
    height: 130, borderRadius: 16, backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden',
  },
  storeDistanceTag: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  storeDistanceText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.textDark },
  favBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  storeMetaContainer: { padding: 14, gap: 2 },
  storeTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.textDark },
  storeSubText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  storeRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.textDark },
  ratingCount: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  bullet: { color: COLORS.textMuted, fontSize: 10 },
  timeText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.midTeal },

  // DoorDash Multi-Store Product Grid
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  productCard: {
    width: '47.5%', backgroundColor: COLORS.surfaceWhite, borderRadius: 20, padding: 12,
    borderWidth: 1, borderColor: COLORS.borderSoft, gap: 4,
  },
  productImgBox: {
    height: 140, backgroundColor: COLORS.limeWhisper, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 6,
    padding: 6,
  },
  productPillGraphic: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
  },
  discBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.midTeal,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  discText: { fontFamily: FONTS.extrabold, fontSize: 9, color: '#FFFFFF' },
  rxBadge: {
    position: 'absolute', bottom: 8, left: 8, backgroundColor: '#F5D7FF',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  rxBadgeText: { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.deepPlum },
  prodName: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textDark },
  prodGeneric: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  prodFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  fromText: { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase' },
  prodPrice: { fontFamily: FONTS.black, fontSize: 14, color: COLORS.textDark },
  storeCountBadge: {
    backgroundColor: COLORS.limeWhisper, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  storeCountText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.midTeal },

  addBtnInitial: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.midTeal,
    justifyContent: 'center', alignItems: 'center',
  },
  stepperBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.limeWhisper, borderRadius: 10, paddingHorizontal: 6, height: 32,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  stepperBtn: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  stepperQtyText: { fontFamily: FONTS.black, fontSize: 14, color: COLORS.midTeal, paddingHorizontal: 2 },

  floatingCartWrap: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  floatingCartBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.midTeal, borderRadius: 18, height: 54, paddingHorizontal: 16,
  },
  cartCountPill: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  cartCountText: { fontFamily: FONTS.black, fontSize: 13, color: '#FFFFFF' },
  floatingCartText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },
  floatingCartTotal: { fontFamily: FONTS.black, fontSize: 15, color: '#FFFFFF' },

  // Location Selector Modal
  locationModalOverlay: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end',
  },
  locationModalCard: {
    backgroundColor: COLORS.surfaceWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, gap: 14,
  },
  locationModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  locationModalTitle: { fontFamily: FONTS.black, fontSize: 18, color: COLORS.textDark },
  locationSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bgWarm, borderRadius: 14, paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: COLORS.borderSoft,
  },
  locationSearchInput: {
    flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textDark,
    outlineStyle: 'none' as any, outlineWidth: 0 as any,
  },
  locationItemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12,
  },
  locationItemRowSelected: {
    backgroundColor: COLORS.limeWhisper,
  },
  locationItemText: { flex: 1, fontFamily: FONTS.bold, fontSize: 13, color: COLORS.textDark },
  locationItemTextSelected: { color: COLORS.midTeal },
});
