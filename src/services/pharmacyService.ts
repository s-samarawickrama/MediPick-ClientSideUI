import { listPharmacies as apiListPharmacies, listFavoritePharmacies as apiListFavorites, addFavorite as apiAddFavorite, removeFavorite as apiRemoveFavorite, getPharmacy as apiGetPharmacy, Pharmacy, PharmacyListQuery } from '../api/pharmaciesApi';

/**
 * Pharmacy Service
 * Implements the Service Layer pattern for the pharmacy domain.
 * Abstracts raw API fetching and handles optimistic UI logic if needed.
 */
export const pharmacyService = {
  
  async getPharmacies(query: PharmacyListQuery = {}) {
    return apiListPharmacies(query);
  },

  async getPharmacyById(id: string) {
    return apiGetPharmacy(id);
  },

  async getFavorites() {
    return apiListFavorites();
  },

  async toggleFavorite(pharmacy: Pharmacy): Promise<{ isFavorite: boolean; favoriteId: string | null }> {
    try {
      if (pharmacy.isFavorite && pharmacy.favoriteId) {
        await apiRemoveFavorite(pharmacy.id, pharmacy.favoriteId);
        return { isFavorite: false, favoriteId: null };
      } else {
        const res = await apiAddFavorite(pharmacy.id);
        return { isFavorite: true, favoriteId: res.favoriteId };
      }
    } catch (e) {
      console.warn('[PharmacyService] Failed to toggle favorite', e);
      throw e;
    }
  }
};
