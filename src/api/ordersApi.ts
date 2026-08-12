import { apiRequest } from './client';
import {
  CancelOrderResponse,
  OrderApiDetail,
  OrderApiSummary,
  RatingRequest,
  RatingResponse,
} from '../types/api';

export interface CreateOrderPayload {
  orderType: 'OTC' | 'PRESCRIPTION';
  pharmacyId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod?: 'ONLINE' | 'PAY_AT_COUNTER';
}

export const ordersApi = {
  list: async (token?: string) =>
    apiRequest<OrderApiSummary[]>('/orders', {
      method: 'GET',
      token,
    }),

  getById: async (orderId: string, token?: string) =>
    apiRequest<OrderApiDetail>(`/orders/${orderId}`, {
      method: 'GET',
      token,
    }),

  create: async (payload: CreateOrderPayload, token?: string) =>
    apiRequest<OrderApiDetail>('/orders', {
      method: 'POST',
      body: payload,
      token,
    }),

  cancel: async (orderId: string, token?: string) =>
    apiRequest<CancelOrderResponse>(`/orders/${orderId}/cancel`, {
      method: 'POST',
      token,
    }),

  rate: async (orderId: string, payload: RatingRequest, token?: string) =>
    apiRequest<RatingResponse>(`/orders/${orderId}/rating`, {
      method: 'POST',
      body: payload,
      token,
    }),
};
