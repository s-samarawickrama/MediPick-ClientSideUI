import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Pressable, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Store, Heart, Star, Clock } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MOCK_PHARMACIES, togglePharmacyFavorite } from '../../mock/demoData';

export const FavoritesScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation();
  const [, setTick] = useState(0);
  const favoritePharmacies = MOCK_PHARMACIES.filter(p => p.isFavorite);

  const handleToggle = (id: string) => {
    togglePharmacyFavorite(id);
    setTick(t => t + 1);
  };

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      setTick(t => t + 1); // Force re-render to pick up new favorites
    }, [])
  );

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />
      
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Favorite Pharmacies</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {favoritePharmacies.length > 0 ? (
          favoritePharmacies.map(p => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [s.storeCard, pressed && { opacity: 0.9 }]}
              onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { storeId: p.id } })}
            >
              <View style={s.storeHeroBanner}>
                {p.image ? (
                  <Image source={p.image} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} resizeMode="cover" />
                ) : (
                  <Store color={colors.midTeal} size={32} strokeWidth={2} />
                )}
                <View style={s.storeDistanceTag}>
                  <Text style={s.storeDistanceText}>{p.distance}</Text>
                </View>
                <TouchableOpacity
                  style={s.favBtn}
                  onPress={(e) => {
                    handleToggle(p.id);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Heart color="#EF4444" size={20} strokeWidth={2} fill="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={s.storeMetaContainer}>
                <Text style={s.storeTitle} numberOfLines={1}>{p.name}</Text>
                <Text style={s.storeSubText} numberOfLines={1}>{p.address}</Text>

                <View style={s.storeRatingRow}>
                  <Star color="#F59E0B" size={12} fill="#F59E0B" />
                  <Text style={s.ratingText}>{p.rating}</Text>
                  <Text style={s.ratingCount}>(120+)</Text>
                  <Text style={s.bullet}>·</Text>
                  <Clock color={colors.textMuted} size={11} strokeWidth={2} />
                  <Text style={s.timeText}>{p.estimatedResponseTime}</Text>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={s.emptyState}>
            <Heart color={colors.borderSoft} size={48} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>No favorites yet</Text>
            <Text style={s.emptySub}>Tap the heart icon on pharmacies you love to save them here for quick access.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: colors.textDark },
  scroll: { padding: 20, gap: 16, paddingBottom: 60 },

  storeCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 16,
    borderWidth: 1.5, borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  storeHeroBanner: {
    height: 120, backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },
  storeDistanceTag: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  storeDistanceText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textDark },
  favBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  storeMetaContainer: { padding: 14, gap: 2 },
  storeTitle: { fontFamily: FONTS.bold, fontSize: 15, color: colors.textDark },
  storeSubText: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  storeRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textDark },
  ratingCount: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  bullet: { fontFamily: FONTS.black, fontSize: 10, color: colors.textMuted },
  timeText: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 18, color: colors.textDark, marginTop: 16 },
  emptySub: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
