import {
  authApi,
  chatApi,
  issuesApi,
  notificationsApi,
  ordersApi,
  paymentsApi,
  pharmaciesApi,
  prescriptionsApi,
  medicinesApi,
  quotesApi,
  usersApi,
} from '../api';

export const apiService = {
  auth: authApi,
  pharmacies: pharmaciesApi,
  medicines: medicinesApi,
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
