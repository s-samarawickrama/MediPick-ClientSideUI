import { apiRequest } from './client';
import { MedicineSummary } from '../types/api';

export const medicinesApi = {
  list: async (token?: string) =>
    apiRequest<MedicineSummary[]>('/medicines', {
      method: 'GET',
      token,
    }),

  getById: async (medicineId: string, token?: string) =>
    apiRequest<MedicineSummary>(`/medicines/${medicineId}`, {
      method: 'GET',
      token,
    }),
};

// Backward compatibility alias
export const productsApi = medicinesApi;

// Backward compatibility type alias
export type ProductSummary = MedicineSummary;
