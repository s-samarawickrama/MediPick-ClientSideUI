import { ordersApi } from '../api/ordersApi';

export const orderService = {
  list: (token?: string) => ordersApi.list(token),
  getById: (orderId: string, token?: string) => ordersApi.getById(orderId, token),
  create: (payload: {
    orderType: 'OTC' | 'PRESCRIPTION';
    pharmacyId: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod?: 'ONLINE' | 'PAY_AT_COUNTER';
  }, token?: string) => ordersApi.create(payload, token),
  cancel: (orderId: string, token?: string) => ordersApi.cancel(orderId, token),
  rate: (orderId: string, payload: { rating: number; comment?: string }, token?: string) =>
    ordersApi.rate(orderId, payload, token),
  reorder: (orderId: string, token?: string) => ordersApi.reorder(orderId, token),
};

export type OrderService = typeof orderService;
export default orderService;
