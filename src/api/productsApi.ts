import { apiRequest } from './client';
import { ProductSummary } from '../types/api';

export const productsApi = {
  list: async (token?: string) =>
    apiRequest<ProductSummary[]>('/products', {
      method: 'GET',
      token,
    }),

  getById: async (productId: string, token?: string) =>
    apiRequest<ProductSummary>(`/products/${productId}`, {
      method: 'GET',
      token,
    }),
};
