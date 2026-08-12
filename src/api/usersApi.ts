import { apiRequest } from './client';
import {
  CustomerUserResponse,
  UserPreferenceUpdate,
  UserPhoneUpdate,
} from '../types/api';

export const usersApi = {
  getMe: async (token: string) =>
    apiRequest<CustomerUserResponse>('/users/me', {
      method: 'GET',
      token,
    }),

  updateProfile: async (payload: Partial<CustomerUserResponse>, token: string) =>
    apiRequest<CustomerUserResponse>('/users/me', {
      method: 'PATCH',
      body: payload,
      token,
    }),

  updatePreferences: async (payload: UserPreferenceUpdate, token: string) =>
    apiRequest<UserPreferenceUpdate>('/users/me/preferences', {
      method: 'PATCH',
      body: payload,
      token,
    }),

  updatePhone: async (payload: UserPhoneUpdate, token: string) =>
    apiRequest<{ message: string }>('/users/me/phone', {
      method: 'PATCH',
      body: payload,
      token,
    }),

  verifyPhone: async (payload: { newPhoneNumber: string; otp: string }, token: string) =>
    apiRequest<{ message: string }>('/users/me/phone/verify', {
      method: 'POST',
      body: payload,
      token,
    }),

  savePushToken: async (payload: { pushToken: string }, token: string) =>
    apiRequest<{ message: string }>('/users/me/push-token', {
      method: 'POST',
      body: payload,
      token,
    }),
};
