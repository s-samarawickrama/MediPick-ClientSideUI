/**
 * MediPick Mock Engine — Users Handler (Priority 0)
 *
 * Implements mock logic for all A2 Users endpoints:
 *   A2.1  GET   /users/me
 *   A2.2  PATCH /users/me
 *   A2.3  PATCH /users/me/preferences
 *   A2.4  PATCH /users/me/phone
 *   A2.5  POST  /users/me/phone/verify
 *   A2.6  POST  /users/me/push-token
 *
 * All endpoints require a valid Bearer access token.
 * The token is validated for existence, signature, and expiry on every call.
 */

import { validateAccessToken, extractBearerToken } from '../jwt';
import { CustomerStore } from '../store';
import { mockResponse, mockError, parseBody, requireAuth } from '../engine';

// ─── A2.1 — GET /users/me ────────────────────────────────────────────────────
export async function handleGetMe(authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const customer = await CustomerStore.findById(auth.payload.sub);
  if (!customer) {
    return mockError(404, 'USER_NOT_FOUND', 'Customer profile not found.');
  }

  return mockResponse(200, {
    id:                       customer.id,
    phoneNumber:              customer.phoneNumber,
    surname:                  customer.surname,
    email:                    customer.email,
    isVerified:               customer.isVerified,
    strikes:                  customer.strikes,
    pushNotificationsEnabled: customer.pushNotificationsEnabled,
    emailReceiptsEnabled:     customer.emailReceiptsEnabled,
    createdAt:                customer.createdAt,
  });
}

// ─── A2.2 — PATCH /users/me ──────────────────────────────────────────────────
export async function handleUpdateProfile(
  authHeader: string | null | undefined,
  body: unknown,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const { surname, email } = parseBody(body) as {
    surname?: string;
    email?:   string;
  };

  if (surname !== undefined && (surname.length < 2 || surname.length > 100)) {
    return mockError(400, 'VALIDATION_ERROR', 'surname must be 2–100 characters.');
  }
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return mockError(400, 'VALIDATION_ERROR', 'email must be a valid email address.');
  }

  const updated = await CustomerStore.update(auth.payload.sub, {
    ...(surname !== undefined && { surname }),
    ...(email   !== undefined && { email }),
  });

  if (!updated) {
    return mockError(404, 'USER_NOT_FOUND', 'Customer not found.');
  }

  return mockResponse(200, {
    id:                       updated.id,
    phoneNumber:              updated.phoneNumber,
    surname:                  updated.surname,
    email:                    updated.email,
    isVerified:               updated.isVerified,
    strikes:                  updated.strikes,
    pushNotificationsEnabled: updated.pushNotificationsEnabled,
    emailReceiptsEnabled:     updated.emailReceiptsEnabled,
    createdAt:                updated.createdAt,
  });
}

// ─── A2.3 — PATCH /users/me/preferences ──────────────────────────────────────
export async function handleUpdatePreferences(
  authHeader: string | null | undefined,
  body: unknown,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const { pushNotificationsEnabled, emailReceiptsEnabled } = parseBody(body) as {
    pushNotificationsEnabled?: boolean;
    emailReceiptsEnabled?:     boolean;
  };

  const updated = await CustomerStore.update(auth.payload.sub, {
    ...(pushNotificationsEnabled !== undefined && { pushNotificationsEnabled }),
    ...(emailReceiptsEnabled     !== undefined && { emailReceiptsEnabled }),
  });

  if (!updated) return mockError(404, 'USER_NOT_FOUND', 'Customer not found.');

  return mockResponse(200, {
    id:                       updated.id,
    phoneNumber:              updated.phoneNumber,
    surname:                  updated.surname,
    email:                    updated.email,
    isVerified:               updated.isVerified,
    strikes:                  updated.strikes,
    pushNotificationsEnabled: updated.pushNotificationsEnabled,
    emailReceiptsEnabled:     updated.emailReceiptsEnabled,
    createdAt:                updated.createdAt,
  });
}

// ─── A2.4 — PATCH /users/me/phone ────────────────────────────────────────────
// In mock mode, we skip the actual SMS send and store the pending change in memory
const pendingPhoneChanges = new Map<string, { newPhone: string; otp: string }>();
const PHONE_CHANGE_OTP = '654321';  // Fixed mock OTP for phone changes

export async function handleInitiatePhoneChange(
  authHeader: string | null | undefined,
  body: unknown,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const { newPhoneNumber } = parseBody(body) as { newPhoneNumber?: string };

  if (!newPhoneNumber || !/^\+\d{10,15}$/.test(newPhoneNumber)) {
    return mockError(400, 'VALIDATION_ERROR', 'newPhoneNumber must be in E.164 format.');
  }

  // Check if number is already taken
  const existing = await CustomerStore.findByPhone(newPhoneNumber);
  if (existing && existing.id !== auth.payload.sub) {
    return mockError(409, 'PHONE_ALREADY_REGISTERED', 'This phone number is already in use.');
  }

  pendingPhoneChanges.set(auth.payload.sub, {
    newPhone: newPhoneNumber,
    otp:      PHONE_CHANGE_OTP,
  });

  console.log(`[MockUsers] Phone change OTP for ${newPhoneNumber}: ${PHONE_CHANGE_OTP}`);

  return mockResponse(200, {
    message: `OTP sent to ${newPhoneNumber}. Verify to confirm change.`,
  });
}

// ─── A2.5 — POST /users/me/phone/verify ──────────────────────────────────────
export async function handleVerifyPhoneChange(
  authHeader: string | null | undefined,
  body: unknown,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const { newPhoneNumber, otp } = parseBody(body) as {
    newPhoneNumber?: string;
    otp?:            string;
  };

  if (!newPhoneNumber || !otp) {
    return mockError(400, 'VALIDATION_ERROR', 'newPhoneNumber and otp are required.');
  }

  const pending = pendingPhoneChanges.get(auth.payload.sub);
  if (!pending || pending.newPhone !== newPhoneNumber) {
    return mockError(400, 'OTP_INVALID', 'No pending phone change for this number.');
  }
  if (pending.otp !== otp) {
    return mockError(400, 'OTP_INVALID', 'Incorrect OTP.');
  }

  await CustomerStore.update(auth.payload.sub, { phoneNumber: newPhoneNumber });
  pendingPhoneChanges.delete(auth.payload.sub);

  return mockResponse(200, { message: 'Phone number updated successfully.' });
}

// ─── A2.6 — POST /users/me/push-token ────────────────────────────────────────
export async function handleRegisterPushToken(
  authHeader: string | null | undefined,
  body: unknown,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const { pushToken } = parseBody(body) as { pushToken?: string };

  if (!pushToken) {
    return mockError(400, 'VALIDATION_ERROR', 'pushToken is required.');
  }

  await CustomerStore.update(auth.payload.sub, { pushToken });

  return mockResponse(200, { message: 'Push token registered.' });
}
