/**
 * MediPick Mock Engine — Remaining Handlers (Priority 2 & 3)
 */

import { mockResponse, mockError, requireAuth, parseBody } from '../engine';
import { SEED_HEALTH_TIPS } from '../seed';
import { OrderStore } from '../store';

export async function handleHealthTips(query: Record<string, string>) {
  const { category, page = '1', limit = '10' } = query;
  let tips = [...SEED_HEALTH_TIPS];
  
  if (category) {
    tips = tips.filter((t) => t.category === category);
  }

  return mockResponse(200, tips, {
    page: 1,
    limit: 10,
    total: tips.length,
    totalPages: 1,
  });
}

export async function handleGetHealthTip(id: string) {
  const tip = SEED_HEALTH_TIPS.find((t) => t.id === id);
  if (!tip) return mockError(404, 'NOT_FOUND', 'Tip not found.');
  return mockResponse(200, tip);
}

const mockMessages: Record<string, any[]> = {};

export async function handleGetMessages(orderId: string, authHeader: string | null | undefined) {
  return mockResponse(200, mockMessages[orderId] || []);
}

export async function handleSendMessage(orderId: string, body: unknown, authHeader: string | null | undefined) {
  const payload = parseBody(body) as any;
  const newMsg = {
    id: Math.random().toString(),
    orderId,
    senderRole: 'CUSTOMER',
    senderName: 'You',
    text: payload.text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };
  
  if (!mockMessages[orderId]) mockMessages[orderId] = [];
  mockMessages[orderId].push(newMsg);
  
  return mockResponse(201, newMsg);
}

// Function to allow other handlers (like orders.handler) to inject system messages
export function addSystemMockMessage(orderId: string, text: string) {
  const newMsg = {
    id: Math.random().toString(),
    orderId,
    senderRole: 'SYSTEM',
    senderName: 'System',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };
  if (!mockMessages[orderId]) mockMessages[orderId] = [];
  mockMessages[orderId].push(newMsg);
}

// Stubs for Quotes, Payments, Notifications, Issues (fully mocked out as returning successful defaults to prevent crashes during UI building)
export async function handleGetCurrentQuote(orderId: string, authHeader: string | null | undefined) {
  return mockError(404, 'NOT_FOUND', 'No quote available yet.');
}

export async function handleAcceptQuote(orderId: string, authHeader: string | null | undefined) {
  return mockResponse(200, { message: 'Quote accepted', order: { id: orderId, state: 'PREPARING' } });
}

export async function handleDeclineQuote(orderId: string, authHeader: string | null | undefined) {
  return mockResponse(200, { message: 'Quote declined' });
}

export async function handleCreatePaymentIntent(body: unknown, authHeader: string | null | undefined) {
  return mockResponse(201, {
    paymentIntentId: 'pi_mock123',
    clientSecret: 'mock_client_secret_xyz',
    amount: 1000,
    currency: 'LKR',
    gateway: 'stripe',
    orderId: (parseBody(body) as any).orderId,
  });
}

export async function handleListNotifications(query: Record<string, string>, authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const userOrders = await OrderStore.findByCustomer(auth.payload.sub);
  const activeOrder = userOrders.find(o => o.state === 'READY_FOR_PICKUP' || o.state === 'PREPARING') || userOrders[0];
  const validOrderId = activeOrder ? activeOrder.id : null;

  const mockNotifications = [
    {
      id: 'notif-1',
      title: 'Order Ready for Pickup',
      body: 'Your order at MediCare Central is ready for pickup!',
      type: 'PICKUP_READY',
      read: false,
      orderId: validOrderId,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      title: 'Pickup Extension Approved',
      body: 'Your 24-hour pickup extension has been approved.',
      type: 'SYSTEM',
      read: true,
      orderId: validOrderId,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ];
  return mockResponse(200, mockNotifications, { page: 1, limit: 10, total: 2, totalPages: 1 });
}

export async function handleMarkNotificationRead(id: string, authHeader: string | null | undefined) {
  return mockResponse(200, { id, read: true });
}

export async function handleMarkAllNotificationsRead(authHeader: string | null | undefined) {
  return mockResponse(200, { markedCount: 0 });
}

export async function handleListIssues(query: Record<string, string>, authHeader: string | null | undefined) {
  return mockResponse(200, [], { page: 1, limit: 10, total: 0, totalPages: 1 });
}

export async function handleGetIssue(id: string, authHeader: string | null | undefined) {
  return mockError(404, 'NOT_FOUND', 'Issue not found.');
}

export async function handleReportIssue(body: unknown, authHeader: string | null | undefined) {
  return mockResponse(201, { id: 'iss_123', status: 'OPEN', ...parseBody(body) });
}
