import { pharmaciesApi, PharmacyListQuery } from '../api/pharmaciesApi';

export const pharmacyService = {
  list: (query?: PharmacyListQuery, token?: string) => pharmaciesApi.list(query, token),
  getById: (pharmacyId: string, token?: string) => pharmaciesApi.getById(pharmacyId, token),
  addFavorite: (pharmacyId: string, token: string) => pharmaciesApi.addFavorite(pharmacyId, token),
  removeFavorite: (pharmacyId: string, favoriteId: string, token: string) =>
    pharmaciesApi.removeFavorite(pharmacyId, favoriteId, token),
};

export type PharmacyService = typeof pharmacyService;
export default pharmacyService;
