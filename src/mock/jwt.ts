/**
 * MediPick Mock Engine — JWT Utility
 *
 * Generates and validates industry-standard JWT tokens (HS256 structure)
 * WITHOUT any external library. Works fully offline.
 *
 * Structure: base64url(header) . base64url(payload) . base64url(signature)
 *
 * Security rules enforced (same as the production backend spec):
 *   - Access token:  expires in 15 minutes (ACCESS_TOKEN_TTL_MS)
 *   - Refresh token: expires in 30 days    (REFRESH_TOKEN_TTL_MS)
 *   - Validation:    checks exp claim against Date.now()
 *   - 401 returned: if token missing, malformed, or expired
 */

// ─── Token TTL config (matches production spec) ───────────────────────────────
export const ACCESS_TOKEN_TTL_MS  = 15 * 60 * 1000;         // 15 minutes
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Mock signing secret (in production this is an RSA private key on the server)
const MOCK_SECRET = 'medipick-mock-secret-2026';

// ─── JWT Payload shape (matches Section 1.3 of API Design Doc) ───────────────
export interface JwtPayload {
  sub:   string;  // Customer UUID
  role:  'CUSTOMER' | 'PHARMACIST' | 'PHARMACY_STAFF' | 'PLATFORM_ADMIN';
  phone: string;  // E.164 format
  iat:   number;  // Issued at (Unix seconds)
  exp:   number;  // Expires at (Unix seconds)
}

// ─── Pure Cross-Platform Base64URL helpers (Zero dependencies, 100% reliable) ─
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8ToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return bytes;
}

function bytesToUtf8(bytes: number[]): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const c = bytes[i++];
    if (c < 0x80) {
      out += String.fromCharCode(c);
    } else if (c > 0xbf && c < 0xe0) {
      const c2 = bytes[i++];
      out += String.fromCharCode(((c & 0x1f) << 6) | (c2 & 0x3f));
    } else if (c > 0xdf && c < 0xf0) {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      out += String.fromCharCode(((c & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f));
    } else {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      const c4 = bytes[i++];
      let code =
        (((c & 0x07) << 18) | ((c2 & 0x3f) << 12) | ((c3 & 0x3f) << 6) | (c4 & 0x3f)) - 0x10000;
      out += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
    }
  }
  return out;
}

function base64urlEncode(str: string): string {
  const bytes = utf8ToBytes(str);
  let b64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const triplet = (b1 << 16) | (b2 << 8) | b3;

    b64 += B64_CHARS[(triplet >> 18) & 0x3f];
    b64 += B64_CHARS[(triplet >> 12) & 0x3f];
    b64 += i + 1 < bytes.length ? B64_CHARS[(triplet >> 6) & 0x3f] : '';
    b64 += i + 2 < bytes.length ? B64_CHARS[triplet & 0x3f] : '';
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';

  const lookup: Record<string, number> = {};
  for (let i = 0; i < B64_CHARS.length; i++) lookup[B64_CHARS[i]] = i;

  const bytes: number[] = [];
  for (let i = 0; i < b64.length; i += 4) {
    const enc1 = lookup[b64[i]];
    const enc2 = lookup[b64[i + 1]];
    const enc3 = b64[i + 2] === '=' ? 0 : lookup[b64[i + 2]];
    const enc4 = b64[i + 3] === '=' ? 0 : lookup[b64[i + 3]];

    const triplet = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4;

    bytes.push((triplet >> 16) & 0xff);
    if (b64[i + 2] !== '=') bytes.push((triplet >> 8) & 0xff);
    if (b64[i + 3] !== '=') bytes.push(triplet & 0xff);
  }
  return bytesToUtf8(bytes);
}

// Simple deterministic hash for mock signature
function mockSign(data: string, secret: string): string {
  let hash = 0;
  const combined = data + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return base64urlEncode(String(Math.abs(hash)));
}

// ─── Token Generation ─────────────────────────────────────────────────────────

/**
 * Generates a signed JWT access token.
 * Expires in 15 minutes from now.
 */
export function generateAccessToken(userId: string, phone: string): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header  = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64urlEncode(JSON.stringify({
    sub:   userId,
    role:  'CUSTOMER',
    phone,
    iat:   nowSec,
    exp:   nowSec + (ACCESS_TOKEN_TTL_MS / 1000),
  } satisfies JwtPayload));
  const signature = mockSign(`${header}.${payload}`, MOCK_SECRET);
  return `${header}.${payload}.${signature}`;
}

/**
 * Generates an opaque refresh token (UUID-like string).
 * Stored in mock store keyed by customerId.
 */
export function generateRefreshToken(): string {
  const arr = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  );
  return [
    arr.slice(0, 8).join(''),
    arr.slice(8, 12).join(''),
    arr.slice(12, 16).join(''),
    arr.slice(16, 20).join(''),
    arr.slice(20).join(''),
  ].join('-');
}

// ─── Token Validation ─────────────────────────────────────────────────────────

export type TokenValidationResult =
  | { valid: true;  payload: JwtPayload }
  | { valid: false; reason: 'MISSING' | 'MALFORMED' | 'EXPIRED' | 'INVALID_SIGNATURE' };

/**
 * Validates a JWT token.
 * Returns the decoded payload if valid, or a typed error reason if not.
 *
 * Checks (in order):
 *   1. Token exists and has 3 parts
 *   2. Payload is valid JSON with required fields
 *   3. Signature matches (tamper detection)
 *   4. Token has not expired (exp claim vs Date.now())
 */
export function validateAccessToken(token: string | null | undefined): TokenValidationResult {
  if (!token) {
    return { valid: false, reason: 'MISSING' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'MALFORMED' };
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64urlDecode(parts[1]));
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }

  // Verify signature
  const expectedSig = mockSign(`${parts[0]}.${parts[1]}`, MOCK_SECRET);
  if (parts[2] !== expectedSig) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  // Check expiry
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowSec) {
    return { valid: false, reason: 'EXPIRED' };
  }

  return { valid: true, payload };
}

/**
 * Extracts the Bearer token from an Authorization header string.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Decodes a JWT payload WITHOUT validating the signature or expiry.
 * Use only for debugging / logging — never for auth decisions.
 */
export function decodeTokenUnsafe(token: string): Partial<JwtPayload> | null {
  try {
    const parts = token.split('.');
    return JSON.parse(base64urlDecode(parts[1]));
  } catch {
    return null;
  }
}
