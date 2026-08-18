/**
 * MediPick Mock Engine — Auth Handler (Priority 0)
 *
 * Implements mock logic for all A1 Auth endpoints:
 *   A1.1  POST /auth/otp/request
 *   A1.2  POST /auth/otp/verify
 *   A1.3  POST /auth/otp/resend
 *   A1.4  POST /auth/token/refresh
 *   A1.5  POST /auth/logout
 *
 * Security enforced:
 *   - OTP rate limit: 3 requests per phone per 10 min (tracked in memory)
 *   - OTP expiry: 5 minutes
 *   - OTP max attempts: 5 before invalidation
 *   - JWT access token: 15-minute expiry (real exp claim)
 *   - Refresh token: 30-day expiry, token rotation on use
 *   - Logout: server-side revocation of refresh token
 */

import {
  generateAccessToken,
  generateRefreshToken,
  validateAccessToken,
  extractBearerToken,
  ACCESS_TOKEN_TTL_MS,
} from '../jwt';
import { CustomerStore, RefreshTokenStore, OrderStore } from '../store';
import { mockResponse, mockError, parseBody } from '../engine';
import { MOCK_ORDERS } from '../demoData';

// ─── In-memory OTP store (mimics Redis TTL behaviour) ────────────────────────
interface OtpRecord {
  otp:       string;
  expiresAt: number;  // Date.now() ms
  attempts:  number;
}
const otpStore = new Map<string, OtpRecord>(); // keyed by phoneNumber

// Rate limit: track OTP requests per phone (max 3 per 10 min)
interface RateLimitRecord { count: number; windowStart: number; }
const rateLimitStore = new Map<string, RateLimitRecord>();

const OTP_TTL_MS       = 5  * 60 * 1000;   // 5 minutes
const RATE_LIMIT_MS    = 10 * 60 * 1000;   // 10 minutes window
const RATE_LIMIT_MAX   = 3;
const OTP_MAX_ATTEMPTS = 5;

// In mock mode, always use this fixed OTP so you can test the full flow
const MOCK_OTP = '123456';

// ─── A1.1 — POST /auth/otp/request ───────────────────────────────────────────
export async function handleOtpRequest(body: unknown) {
  const { phoneNumber, surname, email } = parseBody(body) as {
    phoneNumber?: string;
    surname?:     string;
    email?:       string;
  };

  if (!phoneNumber || !surname) {
    return mockError(400, 'VALIDATION_ERROR', 'phoneNumber and surname are required.');
  }
  if (!/^\+\d{10,15}$/.test(phoneNumber)) {
    return mockError(400, 'VALIDATION_ERROR', 'phoneNumber must be in E.164 format (e.g. +94771234567).');
  }
  if (surname.length < 2 || surname.length > 100) {
    return mockError(400, 'VALIDATION_ERROR', 'surname must be 2–100 characters.');
  }

  // Check if customer exists and is locked
  const existingCustomer = await CustomerStore.findByPhone(phoneNumber);
  if (existingCustomer && existingCustomer.isLocked && existingCustomer.lockedUntil) {
    const lockedUntilDate = new Date(existingCustomer.lockedUntil);
    if (lockedUntilDate.getTime() > Date.now()) {
      return mockError(403, 'ACCOUNT_LOCKED', `Account locked due to too many failed attempts. Try again after ${lockedUntilDate.toLocaleTimeString()}.`);
    } else {
      // Lock expired, unlock them
      await CustomerStore.unlockCustomer(existingCustomer.id);
    }
  }

  // Rate limit check
  const now  = Date.now();
  const rate = rateLimitStore.get(phoneNumber);
  if (rate && now - rate.windowStart < RATE_LIMIT_MS) {
    if (rate.count >= RATE_LIMIT_MAX) {
      return mockError(429, 'RATE_LIMIT_EXCEEDED', 'Too many OTP requests. Try again in 10 minutes.');
    }
    rateLimitStore.set(phoneNumber, { count: rate.count + 1, windowStart: rate.windowStart });
  } else {
    rateLimitStore.set(phoneNumber, { count: 1, windowStart: now });
  }

  // Upsert customer
  await CustomerStore.upsert(phoneNumber, surname, email);

  // Issue OTP (mock: always '123456')
  otpStore.set(phoneNumber, {
    otp:       MOCK_OTP,
    expiresAt: now + OTP_TTL_MS,
    attempts:  0,
  });

  console.log(`[MockAuth] OTP for ${phoneNumber}: ${MOCK_OTP}  (expires in 5 min)`);

  return mockResponse(200, {
    message:   `OTP sent to ${phoneNumber}`,
    expiresIn: OTP_TTL_MS / 1000,
  });
}

// ─── A1.2 — POST /auth/otp/verify ────────────────────────────────────────────
export async function handleOtpVerify(body: unknown) {
  const { phoneNumber, otp } = parseBody(body) as {
    phoneNumber?: string;
    otp?:         string;
  };

  if (!phoneNumber || !otp) {
    return mockError(400, 'VALIDATION_ERROR', 'phoneNumber and otp are required.');
  }

  // Load customer
  const customer = await CustomerStore.findByPhone(phoneNumber);
  if (!customer) {
    return mockError(500, 'INTERNAL_ERROR', 'Customer record not found after OTP verification.');
  }

  if (customer.isLocked && customer.lockedUntil) {
    const lockedUntilDate = new Date(customer.lockedUntil);
    if (lockedUntilDate.getTime() > Date.now()) {
      return mockError(403, 'ACCOUNT_LOCKED', `Account locked due to too many failed attempts. Try again after ${lockedUntilDate.toLocaleTimeString()}.`);
    } else {
      await CustomerStore.unlockCustomer(customer.id);
    }
  }

  const record = otpStore.get(phoneNumber);

  if (!record) {
    return mockError(400, 'OTP_INVALID', 'No OTP was requested for this phone number.');
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phoneNumber);
    return mockError(400, 'OTP_EXPIRED', 'OTP has expired. Request a new one.');
  }
  
  if (record.otp !== otp) {
    record.attempts += 1;
    await CustomerStore.incrementStrikes(customer.id);
    
    // Check if they just hit the limit
    const updatedCustomer = await CustomerStore.findByPhone(phoneNumber);
    if (updatedCustomer && updatedCustomer.isLocked) {
      otpStore.delete(phoneNumber);
      const lockedUntilDate = new Date(updatedCustomer.lockedUntil!);
      return mockError(403, 'ACCOUNT_LOCKED', `Account locked due to too many failed attempts. Try again after ${lockedUntilDate.toLocaleTimeString()}.`);
    }

    return mockError(400, 'OTP_INVALID', `Incorrect OTP. ${updatedCustomer!.strikeLimit - updatedCustomer!.strikes} attempts remaining before lockout.`);
  }

  // OTP valid — reset strikes and mark as used
  await CustomerStore.unlockCustomer(customer.id);
  otpStore.delete(phoneNumber);

  // Generate tokens
  const accessToken  = generateAccessToken(customer.id, phoneNumber);
  const refreshToken = generateRefreshToken();
  await RefreshTokenStore.create(customer.id, refreshToken);

  // Seed demo orders if the user has none (for UI testing)
  const existingOrders = await OrderStore.findByCustomer(customer.id);
  if (existingOrders.length === 0) {
    for (let i = 0; i < MOCK_ORDERS.length; i++) {
      const mo = MOCK_ORDERS[i];
      await OrderStore.create({
        ...mo,
        id: `ord-${Date.now()}-${i}`,
        customerId: customer.id
      });
    }
  }

  return mockResponse(200, {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
    user: {
      id:                       customer.id,
      phoneNumber:              customer.phoneNumber,
      surname:                  customer.surname,
      email:                    customer.email,
      isVerified:               customer.isVerified,
      strikes:                  customer.strikes,
      pushNotificationsEnabled: customer.pushNotificationsEnabled,
      emailReceiptsEnabled:     customer.emailReceiptsEnabled,
      createdAt:                customer.createdAt,
    },
  });
}

// ─── A1.3 — POST /auth/otp/resend ────────────────────────────────────────────
export async function handleOtpResend(body: unknown) {
  // Resend is the same as request — rate limiting still applies
  return handleOtpRequest(body);
}

// ─── A1.4 — POST /auth/token/refresh ─────────────────────────────────────────
export async function handleTokenRefresh(body: unknown) {
  const { refreshToken } = parseBody(body) as { refreshToken?: string };

  if (!refreshToken) {
    return mockError(400, 'VALIDATION_ERROR', 'refreshToken is required.');
  }

  const tokenRecord = await RefreshTokenStore.findValid(refreshToken);
  if (!tokenRecord) {
    return mockError(401, 'REFRESH_TOKEN_INVALID', 'Refresh token is invalid, expired, or revoked.');
  }

  const customer = await CustomerStore.findById(tokenRecord.customerId);
  if (!customer) {
    return mockError(401, 'REFRESH_TOKEN_INVALID', 'Associated customer not found.');
  }

  // Rotate: revoke old token, issue new pair
  const newAccessToken  = generateAccessToken(customer.id, customer.phoneNumber);
  const newRefreshToken = generateRefreshToken();
  await RefreshTokenStore.rotate(refreshToken, customer.id, newRefreshToken);

  return mockResponse(200, {
    accessToken:  newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn:    ACCESS_TOKEN_TTL_MS / 1000,
  });
}

// ─── A1.5 — POST /auth/logout ─────────────────────────────────────────────────
export async function handleLogout(authHeader: string | null | undefined) {
  const token = extractBearerToken(authHeader);
  if (!token) {
    return mockError(401, 'UNAUTHORIZED', 'No Bearer token provided.');
  }

  const result = validateAccessToken(token);
  if (!result.valid) {
    // Even on expired token, allow logout — just revoke server-side session
    return mockResponse(200, { message: 'Logged out successfully.' });
  }

  await RefreshTokenStore.revokeByCustomer(result.payload.sub);

  return mockResponse(200, { message: 'Logged out successfully.' });
}

// ─── A1.6 — GET /auth/token/validate ──────────────────────────────────────────
export async function handleTokenValidate(authHeader: string | null | undefined) {
  const token = extractBearerToken(authHeader);
  const result = validateAccessToken(token);
  if (!result.valid) return mockError(401, 'UNAUTHORIZED', 'Invalid or expired token.');

  const customerId = result.payload.sub;
  const customer = await CustomerStore.findById(customerId);
  if (!customer) {
    return mockError(401, 'UNAUTHORIZED', 'Customer not found.');
  }

  // Remove sensitive fields for response
  const { pushToken, updatedAt, ...safeUser } = customer;

  return mockResponse(200, {
    user: safeUser,
  });
}
