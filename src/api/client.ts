import { APP_CONFIG } from '../config/env';
import { ApiResponse } from '../types/api';

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, any> | FormData | null;
  headers?: Record<string, string>;
  token?: string | null;
  query?: Record<string, any>;
};

const buildUrl = (endpoint: string, query?: Record<string, any>) => {
  const url = new URL(`${APP_CONFIG.apiBaseUrl}${endpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, token, query } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (!(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const requestBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

  const response = await fetch(buildUrl(endpoint, query), {
    method,
    headers: finalHeaders,
    body: requestBody,
  });

  const contentType = response.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw json ?? {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: 'Request failed',
      },
    };
  }

  return json ?? ({ success: true, data: null as T });
}
