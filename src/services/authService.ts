import {
  authApi,
  RequestOtpPayload,
  VerifyOtpPayload,
} from '../api/authApi';
import { ApiResponse, CustomerUserResponse } from '../types/api';

export const authService = {
  requestOtp: (payload: RequestOtpPayload, token?: string) =>
    authApi.requestOtp(payload, token),

  verifyOtp: (payload: VerifyOtpPayload, token?: string) =>
    authApi.verifyOtp(payload, token),

  resendOtp: (phoneNumber: string, token?: string) =>
    authApi.resendOtp(phoneNumber, token),

  logout: (token?: string) => authApi.logout(token),

  getMe: (token: string) => authApi.getMe(token),

  updateProfile: (payload: Partial<CustomerUserResponse>, token: string) =>
    authApi.updateProfile(payload, token),

  updatePreferences: (
    payload: { pushNotificationsEnabled?: boolean; emailReceiptsEnabled?: boolean },
    token: string,
  ) => authApi.updatePreferences(payload, token),

  changePhone: (payload: { newPhoneNumber: string }, token: string) =>
    authApi.changePhone(payload, token),

  verifyNewPhone: (payload: { newPhoneNumber: string; otp: string }, token: string) =>
    authApi.verifyNewPhone(payload, token),
};

export type AuthService = typeof authService;
export default authService;
