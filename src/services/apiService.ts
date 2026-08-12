import {
  authApi,
  chatApi,
  issuesApi,
  notificationsApi,
  ordersApi,
  paymentsApi,
  pharmaciesApi,
  prescriptionsApi,
  productsApi,
  quotesApi,
  usersApi,
} from '../api';

export const apiService = {
  auth: authApi,
  pharmacies: pharmaciesApi,
  products: productsApi,
  prescriptions: prescriptionsApi,
  orders: ordersApi,
  quotes: quotesApi,
  users: usersApi,
  notifications: notificationsApi,
  chat: chatApi,
  issues: issuesApi,
  payments: paymentsApi,
};

export default apiService;
