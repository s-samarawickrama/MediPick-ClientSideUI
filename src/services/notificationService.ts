import { notificationsApi } from '../api/notificationsApi';

export const notificationService = {
  list: (token?: string) => notificationsApi.list(token),
  markRead: (notificationId: string, token?: string) => notificationsApi.markRead(notificationId, token),
};

export type NotificationService = typeof notificationService;
export default notificationService;
