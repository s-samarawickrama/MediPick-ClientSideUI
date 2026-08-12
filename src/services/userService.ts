import { usersApi } from '../api/usersApi';

export const userService = {
  getMe: (token: string) => usersApi.getMe(token),
  updateProfile: (payload: Record<string, unknown>, token: string) =>
    usersApi.updateProfile(payload as any, token),
  updatePreferences: (
    payload: { pushNotificationsEnabled?: boolean; emailReceiptsEnabled?: boolean },
    token: string,
  ) => usersApi.updatePreferences(payload, token),
  updatePhone: (payload: { newPhoneNumber: string }, token: string) =>
    usersApi.updatePhone(payload, token),
  verifyPhone: (payload: { newPhoneNumber: string; otp: string }, token: string) =>
    usersApi.verifyPhone(payload, token),
  savePushToken: (payload: { pushToken: string }, token: string) =>
    usersApi.savePushToken(payload, token),
};

export type UserService = typeof userService;
export default userService;
