import { apiRequest } from './client';
import { ChatMessage } from '../types/index';

export interface SendMessagePayload {
  text: string;
}

export const chatApi = {
  listMessages: async (orderId: string, token?: string) =>
    apiRequest<ChatMessage[]>(`/orders/${orderId}/messages`, {
      method: 'GET',
      token,
    }),

  sendMessage: async (orderId: string, payload: SendMessagePayload, token?: string) =>
    apiRequest<ChatMessage>(`/orders/${orderId}/messages`, {
      method: 'POST',
      body: payload,
      token,
    }),
};
