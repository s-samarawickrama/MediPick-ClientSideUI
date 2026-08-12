import { paymentsApi } from '../api/paymentsApi';

export const paymentService = {
  createIntent: (token?: string) => paymentsApi.createIntent(token),
};

export type PaymentService = typeof paymentService;
export default paymentService;
