import { apiRequest } from './client';
import { QuoteResponse } from '../types/api';

export const quotesApi = {
  getForOrder: async (orderId: string, token?: string) =>
    apiRequest<QuoteResponse>(`/orders/${orderId}/quote`, {
      method: 'GET',
      token,
    }),

  accept: async (orderId: string, token?: string) =>
    apiRequest<{ id: string; state: string }>(`/orders/${orderId}/quote/accept`, {
      method: 'POST',
      token,
    }),

  decline: async (orderId: string, token?: string) =>
    apiRequest<{ id: string; state: string }>(`/orders/${orderId}/quote/decline`, {
      method: 'POST',
      token,
    }),
};
