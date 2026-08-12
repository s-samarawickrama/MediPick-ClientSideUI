import { apiRequest } from './client';
import { PaymentIntentResponse } from '../types/api';

export const paymentsApi = {
  createIntent: async (token?: string) =>
    apiRequest<PaymentIntentResponse>('/payments/intents', {
      method: 'POST',
      token,
    }),
};
