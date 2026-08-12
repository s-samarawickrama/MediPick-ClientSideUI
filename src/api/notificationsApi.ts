import { apiRequest } from './client';
import { NotificationItem, NotificationReadResponse } from '../types/api';

export const notificationsApi = {
  list: async (token?: string) =>
    apiRequest<NotificationItem[]>('/notifications', {
      method: 'GET',
      token,
    }),

  markRead: async (notificationId: string, token?: string) =>
    apiRequest<NotificationReadResponse>(`/notifications/${notificationId}`, {
      method: 'PATCH',
      token,
    }),
};
