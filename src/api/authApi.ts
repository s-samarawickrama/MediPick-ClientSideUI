import { apiRequest } from './client';
import { ApiResponse, CustomerUserResponse } from '../types/api';

export interface RequestOtpPayload {
  phoneNumber: string;
  surname: string;
  email?: string;
}

export interface VerifyOtpPayload {
  phoneNumber: string;
  otp: string;
}

export interface UserProfileResponse extends CustomerUserResponse {}

export const authApi = {
  requestOtp: async (payload: RequestOtpPayload, token?: string) =>
    apiRequest<{ message: string; expiresIn: number }>('/auth/otp/request', {
      method: 'POST',
      body: payload,
      token,
    }),

  verifyOtp: async (payload: VerifyOtpPayload, token?: string) =>
    apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: UserProfileResponse;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: payload,
      token,
    }),

  resendOtp: async (phoneNumber: string, token?: string) =>
    apiRequest<{ message: string; expiresIn: number }>('/auth/otp/resend', {
      method: 'POST',
      body: { phoneNumber },
      token,
    }),

  logout: async (token?: string): Promise<ApiResponse<{ success: true }>> =>
    apiRequest<{ success: true }>('/auth/logout', {
      method: 'POST',
      token,
    }),

  getMe: async (token: string) =>
    apiRequest<UserProfileResponse>('/users/me', {
      method: 'GET',
      token,
    }),

  updateProfile: async (payload: Partial<UserProfileResponse>, token: string) =>
    apiRequest<UserProfileResponse>('/users/me', {
      method: 'PATCH',
      body: payload,
      token,
    }),

  updatePreferences: async (payload: { pushNotificationsEnabled?: boolean; emailReceiptsEnabled?: boolean }, token: string) =>
    apiRequest<UserProfileResponse>('/users/me/preferences', {
      method: 'PATCH',
      body: payload,
      token,
    }),

  changePhone: async (payload: { newPhoneNumber: string }, token: string) =>
    apiRequest<{ message: string }>('/users/me/phone', {
      method: 'PATCH',
      body: payload,
      token,
    }),

  verifyNewPhone: async (payload: { newPhoneNumber: string; otp: string }, token: string) =>
    apiRequest<{ message: string }>('/users/me/phone/verify', {
      method: 'POST',
      body: payload,
      token,
    }),
};
