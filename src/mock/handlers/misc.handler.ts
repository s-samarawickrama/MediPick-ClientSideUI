/**
 * MediPick Mock Engine — Remaining Handlers (Priority 2 & 3)
 */

import { mockResponse, mockError, requireAuth, parseBody } from '../engine';
import { SEED_HEALTH_TIPS } from '../seed';

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

export async function handleGetMessages(orderId: string, authHeader: string | null | undefined) {
  // Return empty messages for now
  return mockResponse(200, []);
}

export async function handleSendMessage(orderId: string, body: unknown, authHeader: string | null | undefined) {
  const payload = parseBody(body) as any;
  return mockResponse(201, {
    id: Math.random().toString(),
    orderId,
    senderRole: 'CUSTOMER',
    senderName: 'You',
    text: payload.text,
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
  });
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
    gateway: 'payhere',
    orderId: (parseBody(body) as any).orderId,
  });
}

export async function handleListNotifications(query: Record<string, string>, authHeader: string | null | undefined) {
  return mockResponse(200, [], { page: 1, limit: 10, total: 0, totalPages: 1 });
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
