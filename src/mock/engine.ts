/**
 * MediPick Mock Engine — Core Router
 *
 * Intercepts every API request when MOCK_MODE = true.
 * Routes by HTTP method + URL path to the correct handler.
 *
 * Also exports shared utilities used by all handlers:
 *   - mockResponse()   Build a success response object
 *   - mockError()      Build an error response object
 *   - parseBody()      Safely parse a request body
 *   - requireAuth()    Validate Bearer token and return payload (or error response)
 *
 * How it works:
 *   client.ts calls dispatchMockRequest() instead of fetch().
 *   dispatchMockRequest() returns a Response-like { status, body } object.
 *   client.ts then processes it exactly the same as a real server response.
 */

import { validateAccessToken, extractBearerToken, JwtPayload } from './jwt';
import type { ApiMeta } from '../api/client';

// ─── Shared response builders ─────────────────────────────────────────────────

export interface MockResponseShape {
  status: number;
  body:   object;
}

export function mockResponse(
  status: number,
  data:   unknown,
  meta?:  ApiMeta,
): MockResponseShape {
  return {
    status,
    body: { success: true, data, ...(meta && { meta }) },
  };
}

export function mockError(
  statusCode: number,
  error:      string,
  message:    string,
): MockResponseShape {
  return {
    status: statusCode,
    body:   { success: false, error, message, statusCode },
  };
}

export function parseBody(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  if (typeof body === 'object') return body as Record<string, unknown>;
  return {};
}

// ─── Auth guard helper ────────────────────────────────────────────────────────

type AuthSuccess = { payload: JwtPayload };
type AuthFailure = { error: MockResponseShape };

export async function requireAuth(
  authHeader: string | null | undefined,
): Promise<AuthSuccess | AuthFailure> {
  const token  = extractBearerToken(authHeader);
  const result = validateAccessToken(token);

  if (!result.valid) {
    const map: Record<string, [number, string]> = {
      MISSING:            [401, 'No Bearer token provided.'],
      EXPIRED:            [401, 'Access token has expired. Please refresh.'],
      MALFORMED:          [401, 'Access token is malformed.'],
      INVALID_SIGNATURE:  [401, 'Access token signature is invalid.'],
    };
    const [status, message] = map[result.reason] ?? [401, 'Unauthorized.'];
    return { error: mockError(status, result.reason, message) };
  }

  return { payload: result.payload };
}

// ─── URL Path Parser ──────────────────────────────────────────────────────────

interface ParsedRequest {
  method:  string;
  path:    string;         // e.g. "/auth/otp/request"
  params:  Record<string, string>;  // path variables
  query:   Record<string, string>;  // ?key=value
  headers: Record<string, string | null>;
  body:    unknown;
}

function parsePath(url: string, baseUrl: string): { path: string; query: Record<string, string> } {
  const withoutBase = url.replace(baseUrl, '').replace(/^\/v1/, '');
  const [path, qs]  = withoutBase.split('?');
  const query: Record<string, string> = {};
  if (qs) {
    qs.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent((v ?? '').replace(/\+/g, '%20'));
    });
  }
  return { path: path ?? '/', query };
}

// ─── Route Matching ───────────────────────────────────────────────────────────

interface RouteMatch {
  params: Record<string, string>;
}

function matchRoute(pattern: string, path: string): RouteMatch | null {
  const patParts  = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(':')) {
      params[patParts[i].slice(1)] = pathParts[i];
    } else if (patParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return { params };
}

// ─── Main Dispatcher ──────────────────────────────────────────────────────────

// Lazy imports to avoid circular dependencies
async function getHandlers() {
  const [auth, users, pharmacies, medicines, orders, prescriptions, misc] = await Promise.all([
    import('./handlers/auth.handler'),
    import('./handlers/users.handler'),
    import('./handlers/pharmacies.handler'),
    import('./handlers/medicines.handler'),
    import('./handlers/orders.handler'),
    import('./handlers/prescriptions.handler'),
    import('./handlers/misc.handler'),
    import('./handlers/misc.handler'),
  ]);
  return { auth, users, pharmacies, medicines, orders, prescriptions, misc };
}

const idempotencyCache = new Map<string, MockResponseShape>();

export async function dispatchMockRequest(
  url:        string,
  baseUrl:    string,
  method:     string,
  headers:    Record<string, string | null>,
  body:       unknown,
): Promise<MockResponseShape> {
  const { path, query } = parsePath(url, baseUrl);
  const m               = method.toUpperCase();
  const auth            = headers['Authorization'] ?? headers['authorization'];
  const idempotencyKey  = headers['Idempotency-Key'] ?? headers['idempotency-key'];

  if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
    return idempotencyCache.get(idempotencyKey)!;
  }

  // Add artificial latency to simulate real network (50–200ms)
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));

  const h = await getHandlers();
  let response: MockResponseShape;

  // ── A1 Auth ──────────────────────────────────────────────────────────────
  if (m === 'POST' && path === '/auth/otp/request')    response = await h.auth.handleOtpRequest(body);
  else if (m === 'POST' && path === '/auth/otp/verify')     response = await h.auth.handleOtpVerify(body);
  else if (m === 'POST' && path === '/auth/otp/resend')     response = await h.auth.handleOtpResend(body);
  else if (m === 'POST' && path === '/auth/token/refresh')  response = await h.auth.handleTokenRefresh(body);
  else if (m === 'POST' && path === '/auth/logout')         response = await h.auth.handleLogout(auth);
  else if (m === 'GET'  && path === '/auth/token/validate') response = await h.auth.handleTokenValidate(auth);

  // ── A2 Users ──────────────────────────────────────────────────────────────
  else if (m === 'GET'   && path === '/users/me')                response = await h.users.handleGetMe(auth);
  else if (m === 'PATCH' && path === '/users/me')                response = await h.users.handleUpdateProfile(auth, body);
  else if (m === 'PATCH' && path === '/users/me/preferences')    response = await h.users.handleUpdatePreferences(auth, body);
  else if (m === 'PATCH' && path === '/users/me/phone')          response = await h.users.handleInitiatePhoneChange(auth, body);
  else if (m === 'POST'  && path === '/users/me/phone/verify')   response = await h.users.handleVerifyPhoneChange(auth, body);
  else if (m === 'POST'  && path === '/users/me/push-token')     response = await h.users.handleRegisterPushToken(auth, body);

  // ── A3 Pharmacies ─────────────────────────────────────────────────────────
  else if (m === 'GET' && path === '/pharmacies')           response = await h.pharmacies.handleListPharmacies(query, auth);
  else if (m === 'GET' && path === '/pharmacies/favorites') response = await h.pharmacies.handleListFavorites(auth);
  else if (m === 'GET' && matchRoute('/pharmacies/:id', path)) response = await h.pharmacies.handleGetPharmacy(matchRoute('/pharmacies/:id', path)!.params.id, auth);
  else if (m === 'POST' && matchRoute('/pharmacies/:id/favorites', path)) response = await h.pharmacies.handleAddFavorite(matchRoute('/pharmacies/:id/favorites', path)!.params.id, auth);
  else if (m === 'DELETE' && matchRoute('/pharmacies/:id/favorites/:favoriteId', path)) response = await h.pharmacies.handleRemoveFavorite(matchRoute('/pharmacies/:id/favorites/:favoriteId', path)!.params.id, matchRoute('/pharmacies/:id/favorites/:favoriteId', path)!.params.favoriteId, auth);

  // ── A4 Medicines ──────────────────────────────────────────────────────────
  else if (m === 'GET' && path === '/medicines') response = await h.medicines.handleListMedicines(query);
  else if (m === 'GET' && matchRoute('/medicines/:id', path)) response = await h.medicines.handleGetMedicine(matchRoute('/medicines/:id', path)!.params.id);

  // ── A5 Orders ─────────────────────────────────────────────────────────────
  else if (m === 'GET' && path === '/orders') response = await h.orders.handleListOrders(query, auth);
  else if (m === 'POST' && path === '/orders') response = await h.orders.handleCreateOrder(auth, body);
  else if (m === 'GET' && matchRoute('/orders/:id', path)) response = await h.orders.handleGetOrder(matchRoute('/orders/:id', path)!.params.id, auth);
  else if (m === 'PATCH' && matchRoute('/orders/:id', path)) response = await h.orders.handleUpdateOrderState(matchRoute('/orders/:id', path)!.params.id, body, auth);
  else if (m === 'POST' && matchRoute('/orders/:id/cancel', path)) response = await h.orders.handleCancelOrder(matchRoute('/orders/:id/cancel', path)!.params.id, auth);
  else if (m === 'POST' && matchRoute('/orders/:id/reorder', path)) response = await h.orders.handleReorder(matchRoute('/orders/:id/reorder', path)!.params.id, auth);
  else if (m === 'POST' && matchRoute('/orders/:id/ratings', path)) response = await h.orders.handleSubmitRating(matchRoute('/orders/:id/ratings', path)!.params.id, body, auth);
  else if (m === 'POST' && matchRoute('/orders/:id/pickup/extension-requests', path)) response = await h.orders.handlePickupExtension(matchRoute('/orders/:id/pickup/extension-requests', path)!.params.id, auth);

  // ── A6 Prescriptions ──────────────────────────────────────────────────────
  else if (m === 'GET' && path === '/prescriptions/upload-url') response = await h.prescriptions.handleGetUploadUrl(auth);
  else if (m === 'POST' && path === '/prescriptions') response = await h.prescriptions.handleRegisterPrescription(auth, body);
  else if (m === 'GET' && path === '/prescriptions') response = await h.prescriptions.handleListPrescriptions(auth);
  else if (m === 'GET' && matchRoute('/prescriptions/:id/status', path)) response = await h.prescriptions.handleGetPrescriptionStatus(matchRoute('/prescriptions/:id/status', path)!.params.id, auth);
  else if (m === 'GET' && matchRoute('/prescriptions/:id', path)) response = await h.prescriptions.handleGetPrescription(matchRoute('/prescriptions/:id', path)!.params.id, auth);

  // ── A7 Quotes ─────────────────────────────────────────────────────────────
  else if (m === 'GET' && matchRoute('/orders/:id/quotes/current', path)) response = await h.misc.handleGetCurrentQuote(matchRoute('/orders/:id/quotes/current', path)!.params.id, auth);
  else if (m === 'POST' && matchRoute('/orders/:id/quotes/current/accept', path)) response = await h.misc.handleAcceptQuote(matchRoute('/orders/:id/quotes/current/accept', path)!.params.id, auth);
  else if (m === 'POST' && matchRoute('/orders/:id/quotes/current/decline', path)) response = await h.misc.handleDeclineQuote(matchRoute('/orders/:id/quotes/current/decline', path)!.params.id, auth);

  // ── A8 Payments ───────────────────────────────────────────────────────────
  else if (m === 'POST' && path === '/payments/intents') response = await h.misc.handleCreatePaymentIntent(body, auth);

  // ── A9 Messages ───────────────────────────────────────────────────────────
  else if (m === 'GET' && matchRoute('/orders/:id/messages', path)) response = await h.misc.handleGetMessages(matchRoute('/orders/:id/messages', path)!.params.id, auth);
  else if (m === 'POST' && matchRoute('/orders/:id/messages', path)) response = await h.misc.handleSendMessage(matchRoute('/orders/:id/messages', path)!.params.id, body, auth);

  // ── A10 Notifications ─────────────────────────────────────────────────────
  else if (m === 'GET' && path === '/notifications') response = await h.misc.handleListNotifications(query, auth);
  else if (m === 'POST' && path === '/notifications/read-all') response = await h.misc.handleMarkAllNotificationsRead(auth);
  else if (m === 'PATCH' && matchRoute('/notifications/:id', path)) response = await h.misc.handleMarkNotificationRead(matchRoute('/notifications/:id', path)!.params.id, auth);

  // ── A11 Health Tips ───────────────────────────────────────────────────────
  else if (m === 'GET' && path === '/health-tips') response = await h.misc.handleHealthTips(query);
  else if (m === 'GET' && matchRoute('/health-tips/:id', path)) response = await h.misc.handleGetHealthTip(matchRoute('/health-tips/:id', path)!.params.id);

  // ── A12 Issues ────────────────────────────────────────────────────────────
  else if (m === 'GET' && path === '/issues') response = await h.misc.handleListIssues(query, auth);
  else if (m === 'POST' && path === '/issues') response = await h.misc.handleReportIssue(body, auth);
  else if (m === 'GET' && matchRoute('/issues/:id', path)) response = await h.misc.handleGetIssue(matchRoute('/issues/:id', path)!.params.id, auth);

  // ── 404 for unimplemented routes ──────────────────────────────────────────
  else {
    console.warn(`[MockEngine] Unhandled route: ${m} ${path}`);
    response = mockError(404, 'NOT_FOUND', `Route ${m} ${path} is not yet implemented in the mock engine.`);
  }

  if (idempotencyKey) {
    idempotencyCache.set(idempotencyKey, response);
  }

  return response;
}
