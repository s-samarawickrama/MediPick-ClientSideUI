/**
 * MediPick — API Core Client
 *
 * Base HTTP client for all API calls.
 * - Attaches Authorization: Bearer <accessToken> to every protected request
 * - Silently refreshes the access token on 401 using the refresh token
 * - On refresh failure → clears SecureStore and throws AUTH_EXPIRED error
 *   (the AuthContext will catch this and redirect to Login)
 *
 * ─── MOCK MODE ────────────────────────────────────────────────────────────────
 * When MOCK_MODE = true, all API requests are intercepted by the mock engine
 * (src/mock/engine.ts) instead of making real network calls.
 * The mock engine enforces real JWT expiry, token rotation, and session logic.
 *
 * To switch to the real backend: set MOCK_MODE = false.
 * Zero changes needed in screens or API modules — this is the only line to change.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Source of truth: MediPick_API_Design_Document.md v3.0 — Section 1
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── 🔧 Toggle this to switch between mock and real backend ───────────────────
export const MOCK_MODE = true;

// ─── Constants ────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api-staging.medipick.lk/v1';

const ACCESS_TOKEN_KEY  = 'medipick_access_token';
const REFRESH_TOKEN_KEY = 'medipick_refresh_token';

// ─── Token Helpers ────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Promise.all([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  } else {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  }
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  } else {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  }
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ApiMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data:    T;
  meta?:   ApiMeta;
}

export interface ApiErrorResponse {
  success:    false;
  error:      string;  // machine-readable code e.g. "OTP_INVALID"
  message:    string;  // human-readable description
  statusCode: number;
}

// Thrown by apiRequest on any non-2xx response
export class ApiError extends Error {
  constructor(
    public readonly code:       string,
    public readonly statusCode: number,
    message:                    string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Thrown when silent token refresh fails — AuthContext should catch this
export class AuthExpiredError extends Error {
  constructor() {
    super('Session expired. Please log in again.');
    this.name = 'AuthExpiredError';
  }
}

// ─── Core Request Function ────────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Makes an authenticated API request.
 * When MOCK_MODE = true, requests are intercepted by the mock engine.
 * When MOCK_MODE = false, real network fetch() is used.
 *
 * Automatically attaches Bearer token and handles 401 silent refresh.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<ApiSuccessResponse<T>> {
  const accessToken = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // ── Mock Mode: intercept and route to mock engine ─────────────────────────
  if (MOCK_MODE) {
    const { dispatchMockRequest } = await import('../mock/engine');
    const bodyStr = options.body as string | undefined;
    const parsedBody = bodyStr ? JSON.parse(bodyStr) : undefined;

    const mockResult = await dispatchMockRequest(
      `${API_BASE_URL}${path}`,
      API_BASE_URL,
      options.method ?? 'GET',
      headers as Record<string, string | null>,
      parsedBody,
    );

    // Handle 401 with silent refresh (same flow as real network)
    if (mockResult.status === 401 && !isRetry) {
      try {
        await silentRefresh();
        return apiRequest<T>(path, options, true);
      } catch {
        await clearTokens();
        throw new AuthExpiredError();
      }
    }

    const body = mockResult.body as ApiSuccessResponse<T> | ApiErrorResponse;
    if (mockResult.status < 200 || mockResult.status >= 300 || !body.success) {
      const err = body as ApiErrorResponse;
      throw new ApiError(err.error ?? 'UNKNOWN_ERROR', mockResult.status, err.message ?? 'An error occurred.');
    }

    return body as ApiSuccessResponse<T>;
  }

  // ── Real Network Mode ─────────────────────────────────────────────────────
  const response = await fetch(`${API_BASE_URL}${path}`, {

    ...options,
    headers,
  });

  // ── 401: Try silent token refresh, then retry original request once ────────
  if (response.status === 401 && !isRetry) {
    try {
      const newAccessToken = await silentRefresh();
      return apiRequest<T>(path, options, true);
    } catch {
      await clearTokens();
      throw new AuthExpiredError();
    }
  }

  // ── Parse response body ────────────────────────────────────────────────────
  let body: ApiSuccessResponse<T> | ApiErrorResponse;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('PARSE_ERROR', response.status, 'Failed to parse server response.');
  }

  if (!response.ok || !body.success) {
    const err = body as ApiErrorResponse;
    throw new ApiError(
      err.error ?? 'UNKNOWN_ERROR',
      response.status,
      err.message ?? 'An unexpected error occurred.',
    );
  }

  return body as ApiSuccessResponse<T>;
}

/**
 * Silent token refresh — uses the stored refresh token to get a new access token.
 * Only one refresh attempt runs at a time (deduplication via shared promise).
 */
async function silentRefresh(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token stored.');

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error('Refresh token rejected by server.');

    const body: ApiSuccessResponse<{
      accessToken:  string;
      refreshToken: string;
      expiresIn:    number;
    }> = await response.json();

    await saveTokens(body.data.accessToken, body.data.refreshToken);
    return body.data.accessToken;
  })().finally(() => {
    isRefreshing    = false;
    refreshPromise  = null;
  });

  return refreshPromise;
}

/**
 * Convenience wrappers for common HTTP methods.
 * These are what the individual API modules use.
 */
export const api = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    apiRequest<T>(path, { method: 'GET', headers }),

  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>(path, {
      method: 'POST',
      body:   body != null ? JSON.stringify(body) : undefined,
      headers,
    }),

  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    apiRequest<T>(path, {
      method: 'PATCH',
      body:   body != null ? JSON.stringify(body) : undefined,
      headers,
    }),

  delete: <T>(path: string, headers?: Record<string, string>) =>
    apiRequest<T>(path, { method: 'DELETE', headers }),
};
