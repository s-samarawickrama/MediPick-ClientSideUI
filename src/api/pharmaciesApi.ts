import { apiRequest } from './client';
import { PaginationQuery, PharmacySummary } from '../types/api';

export interface PharmacyListQuery extends PaginationQuery {
  search?: string;
  latitude?: number;
  longitude?: number;
  sort?: 'distance' | 'rating' | 'popularity';
}

export const pharmaciesApi = {
  list: async (query?: PharmacyListQuery, token?: string) =>
    apiRequest<PharmacySummary[]>('/pharmacies', {
      method: 'GET',
      query,
      token,
    }),

  getById: async (pharmacyId: string, token?: string) =>
    apiRequest<PharmacySummary>(`/pharmacies/${pharmacyId}`, {
      method: 'GET',
      token,
    }),

  addFavorite: async (pharmacyId: string, token: string) =>
    apiRequest<{ favoriteId: string }>(`/pharmacies/${pharmacyId}/favorites`, {
      method: 'POST',
      token,
    }),

  removeFavorite: async (pharmacyId: string, favoriteId: string, token: string) =>
    apiRequest<{ success: true }>(`/pharmacies/${pharmacyId}/favorites/${favoriteId}`, {
      method: 'DELETE',
      token,
    }),
};
