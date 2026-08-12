import { quotesApi } from '../api/quotesApi';

export const quoteService = {
  getForOrder: (orderId: string, token?: string) => quotesApi.getForOrder(orderId, token),
  accept: (orderId: string, token?: string) => quotesApi.accept(orderId, token),
  decline: (orderId: string, token?: string) => quotesApi.decline(orderId, token),
};

export type QuoteService = typeof quoteService;
export default quoteService;
