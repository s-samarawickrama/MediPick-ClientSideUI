import { chatApi } from '../api/chatApi';

export const chatService = {
  listMessages: (orderId: string, token?: string) => chatApi.listMessages(orderId, token),
  sendMessage: (orderId: string, payload: { text: string }, token?: string) =>
    chatApi.sendMessage(orderId, payload, token),
};

export type ChatService = typeof chatService;
export default chatService;
