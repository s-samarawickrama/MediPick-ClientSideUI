# MediPick — REST API Specification
### Version 3.0 — Audit-Corrected · Ground Truth for Backend Build
### Sri Lanka Pharmacy Marketplace · Customer-Facing API

---

> [!NOTE]
> **This is the corrected document.** All field names, FSM states, and money formats have been aligned with the actual frontend TypeScript types in `src/types/index.ts` and `src/types/api.ts`. An audit was run across every screen and every context before writing this.

---

## Table of Contents

1. [Security Architecture](#1-security-architecture)
2. [Universal API Conventions](#2-universal-api-conventions)
3. [Money & Price Fields Explained](#3-money--price-fields-explained)
4. [Order FSM — Full Lifecycle](#4-order-fsm--full-lifecycle)
5. [Master API Index](#5-master-api-index)
   - [A1 Auth](#a1-auth)
   - [A2 Users](#a2-users)
   - [A3 Pharmacies](#a3-pharmacies)
   - [A4 Medicines](#a4-medicines)
   - [A5 Orders](#a5-orders)
   - [A6 Prescriptions](#a6-prescriptions)
   - [A7 Quotes](#a7-quotes)
   - [A8 Payments](#a8-payments)
   - [A9 Messages — Chat](#a9-messages--chat)
   - [A10 Notifications](#a10-notifications)
   - [A11 Health Tips](#a11-health-tips)
   - [A12 Issues](#a12-issues)
   - [A13 WebSocket](#a13-websocket)
6. [Screen-by-Screen API Map](#6-screen-by-screen-api-map)
7. [Quick Reference Table](#7-quick-reference-table)
8. [Error Codes Reference](#8-error-codes-reference)
9. [PostgreSQL Database Schema Summary](#9-postgresql-database-schema-summary)

---

## 1. Security Architecture

### 1.1 Authentication Flow

```
1. Customer enters phone + surname → POST /api/v1/auth/otp/request → SMS sent
2. Customer enters 6-digit OTP    → POST /api/v1/auth/otp/verify  → tokens returned
3. Store accessToken + refreshToken in expo-secure-store (NOT AsyncStorage)
4. Every API call: Authorization: Bearer <accessToken>
5. On 401 response: auto-call POST /api/v1/auth/token/refresh
6. On refresh failure: clear SecureStore, redirect to Login
```

### 1.2 Token Spec

| Token | Type | Expiry | Storage Location |
|---|---|---|---|
| **Access Token** | JWT · RS256 signed | **15 minutes** | `expo-secure-store` key: `@medipick_access_token` |
| **Refresh Token** | Opaque UUID | **30 days** | `expo-secure-store` key: `@medipick_refresh_token` |
| **OTP** | 6-digit numeric | **5 minutes** | Server only (Redis TTL) |

### 1.3 JWT Payload

```json
{
  "sub":   "usr_01j4abc",       // Customer UUID
  "role":  "CUSTOMER",
  "phone": "+94771234567",      // E.164 format
  "iat":   1724000000,
  "exp":   1724000900
}
```

### 1.4 Authorization Header

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Legend used throughout this document:**
- 🔓 Public — no token required
- 🔒 Protected — `Authorization: Bearer <accessToken>` required

---

### 1.5 — Roles & Permissions

> [!CAUTION]
> **Critical distinction: `PHARMACIST` ≠ `PHARMACY_STAFF`**
>
> Only a **SLMC-registered, licensed Pharmacist** (`PHARMACIST` role) is legally authorised and system-authorised to make clinical decisions. Generic pharmacy counter staff (`PHARMACY_STAFF`) are **NOT** permitted to perform any action that touches prescription validation, quoting, or issue resolution. This is enforced at the JWT `role` claim level — the backend **must** reject any `PHARMACY_STAFF` token attempting these endpoints with `403 FORBIDDEN`.

#### Role Definitions

| Role | Who Has It | JWT `role` Claim |
|---|---|---|
| `CUSTOMER` | Registered MediPick app users | `CUSTOMER` |
| `PHARMACIST` | SLMC-licensed pharmacist registered on the platform. One per pharmacy license. | `PHARMACIST` |
| `PHARMACY_STAFF` | Counter assistants, packing staff at a pharmacy. No clinical authority. | `PHARMACY_STAFF` |
| `PLATFORM_ADMIN` | MediPick internal team. Dispute resolution moderators. | `PLATFORM_ADMIN` |

#### Permission Matrix

| Action | `CUSTOMER` | `PHARMACIST` | `PHARMACY_STAFF` | `PLATFORM_ADMIN` |
|---|---|---|---|---|
| Place an order | ✅ | ❌ | ❌ | ❌ |
| Cancel own order | ✅ | ❌ | ❌ | ✅ |
| Upload a prescription | ✅ | ❌ | ❌ | ❌ |
| **Validate / approve a prescription** | ❌ | ✅ **ONLY** | ❌ | ❌ |
| **Reject a prescription** | ❌ | ✅ **ONLY** | ❌ | ❌ |
| **Request prescription reupload** | ❌ | ✅ **ONLY** | ❌ | ❌ |
| **Send a price quote to customer** | ❌ | ✅ **ONLY** | ❌ | ❌ |
| Accept / decline a quote | ✅ | ❌ | ❌ | ❌ |
| **Mark order as READY_FOR_PICKUP** | ❌ | ✅ **ONLY** | ❌ | ❌ |
| Verify pickup OTP at counter | ❌ | ✅ | ✅ | ❌ |
| Send chat message | ✅ | ✅ | ✅ | ✅ |
| Report an issue | ✅ | ❌ | ❌ | ❌ |
| **Take issue UNDER_REVIEW** | ❌ | ❌ | ❌ | ✅ **ONLY** |
| **Resolve / reject an issue** | ❌ | ❌ | ❌ | ✅ **ONLY** |
| Manage pharmacy inventory | ❌ | ✅ | ✅ | ✅ |
| View orders for their pharmacy | ❌ | ✅ | ✅ | ✅ |
| View any customer data | ❌ | ❌ | ❌ | ✅ |
| Publish health tips | ❌ | ❌ | ❌ | ✅ |

> [!NOTE]
> **Pickup OTP verification** is the only action shared between `PHARMACIST` and `PHARMACY_STAFF`. A counter staff member can physically scan/enter the OTP when the customer collects — this does not require clinical judgement.
>
> **Issue resolution** is entirely handled by `PLATFORM_ADMIN` (the MediPick internal moderation team), not by the pharmacist. The pharmacist is a party to the dispute, not the arbitrator.

---

## 2. Universal API Conventions

### 2.1 Base URL

```
Production : https://api.medipick.lk/v1
Staging    : https://api-staging.medipick.lk/v1
```

### 2.2 REST Naming Rules

- Nouns, not verbs → `/orders` not `/getOrders`
- Plural resource names → `/pharmacies`, `/medicines`, `/orders`
- Lowercase, hyphen-separated → `/health-tips`, `/push-token`
- Nested resources → `/orders/{orderId}/messages`
- Actions as sub-resources → `/orders/{orderId}/cancel`

### 2.3 Response Envelope

Every API response — success or failure — uses this exact structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code":    "OTP_INVALID",
    "message": "The OTP you entered is incorrect.",
    "fields":  { "otp": "Must be 6 digits" }
  }
}
```

### 2.4 HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success (read / update) |
| `201` | Created |
| `202` | Accepted (async processing started) |
| `204` | Deleted (no body) |
| `400` | Validation error |
| `401` | Missing / expired token |
| `403` | Valid token, not authorized |
| `404` | Not found |
| `409` | Conflict (duplicate) |
| `422` | Business logic rejection |
| `429` | Rate limited |
| `500` | Server error |

### 2.5 Pagination Query Params

| Param | Type | Default | Max |
|---|---|---|---|
| `page` | int | `1` | — |
| `limit` | int | `20` | `100` |

---

## 3. Money & Price Fields Explained

> [!IMPORTANT]
> All monetary values in API request/response bodies are **plain LKR numbers** (e.g. `120` = LKR 120.00). This matches the frontend `types/index.ts` which uses `mrpPrice: number`, `pharmacyPrice: number`, `totalAmount: number`, etc. — all as whole LKR values, **not cents**.

| Field Name | Where Used | Meaning |
|---|---|---|
| `mrpPrice` | `MedicineItem` | **Maximum Retail Price** — Government-mandated ceiling in LKR. No pharmacy can exceed this. |
| `pharmacyPrice` | `MedicineItem` (when pharmacyId filter applied) | This specific pharmacy's selling price ≤ `mrpPrice`. |
| `mrp` | `PrescriptionQuoteItem` | MRP of a quoted item at time of quoting (frozen snapshot). |
| `quotedPrice` | `PrescriptionQuoteItem` | What the pharmacy actually charges for this item (≤ `mrp`). |
| `price` | `Order.items[]` | Per-unit price of a line item (set at time of order, from `pharmacyPrice`). |
| `totalAmount` | `Order`, `PharmacyQuote` | Total the customer pays (sum of `price × quantity` for all items). |
| `totalMrp` | `Order`, `PharmacyQuote` | Total at MRP prices (what it would cost at full MRP). |
| `savings` | Computed on response | `totalMrp - totalAmount` — displayed as "You saved LKR X". |

### Example Calculation

```
Cart:
  Panadol 500mg × 2   @ pharmacy price LKR 100 each  → line total LKR 200
  Vitamin C 1000mg × 1 @ pharmacy price LKR 790 each → line total LKR 790

totalAmount = 200 + 790 = 990     (LKR 990.00)
totalMrp    = 240 + 850 = 1090    (LKR 1,090.00 — full MRP)
savings     = 1090 - 990 = 100    (LKR 100.00 saved)
```

---

## 4. Order FSM — Full Lifecycle

> [!NOTE]
> **Implementation Detail:** The State Machine is a **pre-built external service**. The backend does not need to build the FSM logic from scratch; it simply attaches to and consumes the state machine API for order transitions.

These are the **exact** state names used in both the frontend TypeScript type `FSMOrderState` (in `src/types/index.ts`) and the backend DB.

```
Actor legend:
  [CUSTOMER]        = Customer mobile app
  [PHARMACIST ONLY] = SLMC-licensed pharmacist JWT — PHARMACY_STAFF cannot perform this
  [STAFF/PHARM]     = Either PHARMACIST or PHARMACY_STAFF JWT
  [SYSTEM]          = Automated (scheduler / AI service / SLA timer)
  [ADMIN]           = PLATFORM_ADMIN only

DRAFT
  └─[CUSTOMER]        (OTC order submitted)──────────────────────► SUBMITTED
  └─[CUSTOMER]        (Prescription order submitted)─────────────► PRESCRIPTION_VALIDATION

SUBMITTED (OTC)
  └─[PHARMACIST ONLY] (confirms stock & begins work)─────────────► PREPARING
  └─[CUSTOMER]        (cancels)──────────────────────────────────► CANCELLED (no strike)

PRESCRIPTION_VALIDATION
  └─[SYSTEM]          (AI clarity check passed)──────────────────► WAITING_PHARMACY_CONFIRMATION
  └─[SYSTEM]          (AI clarity check failed)──────────────────► AWAITING_PRESCRIPTION_UPLOAD
  └─[CUSTOMER]        (cancels)──────────────────────────────────► CANCELLED (no strike)

AWAITING_PRESCRIPTION_UPLOAD
  └─[CUSTOMER]        (uploads new prescription)─────────────────► PRESCRIPTION_VALIDATION
  └─[CUSTOMER]        (cancels)──────────────────────────────────► CANCELLED (no strike)

WAITING_PHARMACY_CONFIRMATION
  └─[PHARMACIST ONLY] (reviews Rx and sends quote)───────────────► WAITING_CUSTOMER_CONFIRMATION
  └─[PHARMACIST ONLY] (rejects order — cannot fulfil)────────────► REJECTED
  └─[PHARMACIST ONLY] (requests clearer prescription reupload)────► REUPLOAD_REQUESTED
  └─[SYSTEM]          (SLA expires — pharmacist did not respond)─► CANCELLED (no strike; pharmacy penalised)
  └─[CUSTOMER]        (cancels before pharmacy responds)──────────► CANCELLED (no strike)

REUPLOAD_REQUESTED
  └─[CUSTOMER]        (uploads new prescription)─────────────────► WAITING_PHARMACY_CONFIRMATION
  └─[CUSTOMER]        (cancels)──────────────────────────────────► CANCELLED (no strike)

WAITING_CUSTOMER_CONFIRMATION
  └─[CUSTOMER]        (accepts quote)────────────────────────────► PREPARING
  └─[CUSTOMER]        (declines quote)───────────────────────────► CANCELLED (no strike)
  └─[SYSTEM]          (SLA expires — customer did not respond)───► CANCELLED (no strike)
  └─[CUSTOMER]        (cancels after seeing quote)────────────────► CANCELLED ⚡ STRIKE +1

PREPARING
  └─[PHARMACIST ONLY] (marks order ready for pickup, OTP issued)─► READY_FOR_PICKUP
  └─[CUSTOMER]        (cancels mid-preparation)───────────────────► CANCELLED ⚡ STRIKE +1

READY_FOR_PICKUP
  └─[STAFF/PHARM]     (OTP verified at counter)──────────────────► COMPLETED
  └─[SYSTEM]          (pickup deadline expires)──────────────────► CLOSED  (order void; no OTP)
  └─[CUSTOMER]        (cancels after order is ready)──────────────► CANCELLED ⚡ STRIKE +1

COMPLETED
  └─[CUSTOMER]        (reports issue with order)─────────────────► ISSUE_REPORTED

ISSUE_REPORTED
  └─[ADMIN]           (takes dispute under review)───────────────► UNDER_REVIEW

UNDER_REVIEW
  └─[ADMIN]           (resolves in customer's favour + refund)───► RESOLVED
  └─[ADMIN]           (rejects the dispute)──────────────────────► REJECTED

Terminal states: CANCELLED, REJECTED, CLOSED, RESOLVED
```

### State Descriptions

| State | Who Can Trigger Entry | Description |
|---|---|---|
| `DRAFT` | `CUSTOMER` | Order created, not yet submitted |
| `SUBMITTED` | `CUSTOMER` | OTC order submitted, awaiting pharmacist action |
| `PRESCRIPTION_VALIDATION` | `CUSTOMER` / `SYSTEM` | Prescription uploaded, AI clarity check running |
| `AWAITING_PRESCRIPTION_UPLOAD` | `SYSTEM` (AI fail) | AI check failed; customer must reupload clearer photo |
| `REUPLOAD_REQUESTED` | **`PHARMACIST` ONLY** | Pharmacist manually reviewed and found prescription unclear — customer must reupload |
| `WAITING_PHARMACY_CONFIRMATION` | `SYSTEM` (AI pass) | Prescription AI-cleared; **PHARMACIST** reviewing and preparing a quote |
| `WAITING_CUSTOMER_CONFIRMATION` | **`PHARMACIST` ONLY** | Pharmacist submitted a price quote; customer must accept or decline |
| `PREPARING` | `CUSTOMER` (accepts quote) | Quote accepted + payment confirmed; pharmacy physically preparing the order |
| `READY_FOR_PICKUP` | **`PHARMACIST` ONLY** | Pharmacist marks order packed and ready; OTP generated and sent to customer |
| `COMPLETED` | `PHARMACIST` or `PHARMACY_STAFF` (OTP verify) | Pickup OTP verified at counter; order fulfilled |
| `CANCELLED` | `CUSTOMER` / `SYSTEM` (SLA) | Cancelled by customer or by SLA timer expiry |
| `REJECTED` | **`PHARMACIST` ONLY** | Pharmacist cannot fulfil (out of stock, specialised Rx, etc.) |
| `CLOSED` | `SYSTEM` (deadline timer) | Pickup deadline expired; customer did not collect; order void |
| `ISSUE_REPORTED` | `CUSTOMER` | Customer raised post-completion dispute |
| `UNDER_REVIEW` | **`PLATFORM_ADMIN` ONLY** | MediPick internal moderator reviewing the dispute |
| `RESOLVED` | **`PLATFORM_ADMIN` ONLY** | Dispute resolved in customer's favour; refund processed if applicable |
| `REUPLOAD_REQUESTED` | **`PHARMACIST` ONLY** | Post-AI-pass manual request for clearer prescription |
| `RESOLVED` | Dispute resolved; refund processed if applicable |
| `REUPLOAD_REQUESTED` | Pharmacist manually requested a clearer prescription (post-validation) |

---

## 5. Master API Index

---

## A1 — Auth

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A1.1 | `POST` | `/api/v1/auth/otp/request` | 🔓 | Send OTP to phone (register + login combined) |
| A1.2 | `POST` | `/api/v1/auth/otp/verify` | 🔓 | Verify OTP, receive access + refresh tokens |
| A1.3 | `POST` | `/api/v1/auth/otp/resend` | 🔓 | Resend OTP, invalidates previous |
| A1.4 | `POST` | `/api/v1/auth/token/refresh` | 🔓 | Get new access token using refresh token |
| A1.5 | `POST` | `/api/v1/auth/logout` | 🔒 | Revoke refresh token, end session |
| A1.6 | `GET` | `/api/v1/auth/token/validate` | 🔒 | Validate token and fetch lockout state |

---

### A1.1 `POST /api/v1/auth/otp/request`

**Rate limit:** 3 requests per phone per 10 minutes.

**Request Body:**
```json
{
  "phoneNumber": "+94771234567",
  "surname":     "Perera",
  "email":       "p@example.com"
}
```

| Field | Required | Validation |
|---|---|---|
| `phoneNumber` | ✅ | E.164 format (`+94xxxxxxxxx`) |
| `surname` | ✅ | 2–100 characters |
| `email` | ❌ | Valid email if provided |

**Behaviour:** Upsert customer (create if new, update name/email if existing). Generate 6-digit OTP, hash + store in Redis with 5-min TTL. Send SMS.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "message":   "OTP sent to +94771234567",
    "expiresIn": 300
  }
}
```

---

### A1.2 `POST /api/v1/auth/otp/verify`

**Request Body:**
```json
{
  "phoneNumber": "+94771234567",
  "otp":         "849201"
}
```

**Behaviour:** Validate OTP hash. Max 5 attempts per OTP. Incorrect attempts increment the user's `strikes` counter. If `strikes` reaches `strikeLimit` (5), the account is locked for 1 hour (`lockedUntil`). On success, `strikes` is reset to 0, and JWT access + refresh tokens are issued.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken":  "eyJhbGci...",
    "refreshToken": "a3f2c1d4-e5b6-7890-abcd-ef1234567890",
    "expiresIn":    900,
    "user": {
      "id":                       "usr_01j4abc",
      "phoneNumber":              "+94771234567",
      "surname":                  "Perera",
      "email":                    "p@example.com",
      "isVerified":               true,
      "strikes":                  0,
      "pushNotificationsEnabled": true,
      "emailReceiptsEnabled":     true,
      "createdAt":                "2026-08-01T10:00:00Z"
    }
  }
}
```

**Error Codes:**
| Code | HTTP | Trigger |
|---|---|---|
| `OTP_INVALID` | 400 | Wrong OTP |
| `OTP_EXPIRED` | 400 | Past 5-minute window |
| `OTP_MAX_ATTEMPTS` | 400 | ≥5 failed attempts |

---

### A1.3 `POST /api/v1/auth/otp/resend`

**Request Body:**
```json
{ "phoneNumber": "+94771234567" }
```

**Response `200`:** Same as A1.1.

---

### A1.4 `POST /api/v1/auth/token/refresh`

**Request Body:**
```json
{ "refreshToken": "a3f2c1d4-e5b6-7890-abcd-ef1234567890" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken":  "eyJhbGci...",
    "refreshToken": "new-rotated-refresh-token",
    "expiresIn":    900
  }
}
```

**Error Codes:**
| Code | HTTP | Trigger |
|---|---|---|
| `REFRESH_TOKEN_INVALID` | 401 | Token revoked / not found |
| `REFRESH_TOKEN_EXPIRED` | 401 | 30-day window passed |

---

### A1.5 `POST /api/v1/auth/logout`

**Request Body:** _(empty)_

**Response `200`:**
```json
{ "success": true, "data": { "message": "Logged out successfully." } }
```

---

### A1.6 `GET /api/v1/auth/token/validate`

**Request Body:** _(empty)_

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "user": {
      "id": "usr_...",
      "role": "CUSTOMER",
      "phoneNumber": "+94771234567",
      "strikes": 0,
      "strikeLimit": 5,
      "lockedUntil": null
    }
  }
}
```

---

## A2 — Users

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A2.1 | `GET` | `/api/v1/users/me` | 🔒 | Get authenticated customer profile |
| A2.2 | `PATCH` | `/api/v1/users/me` | 🔒 | Update surname or email |
| A2.3 | `PATCH` | `/api/v1/users/me/preferences` | 🔒 | Toggle notification preferences |
| A2.4 | `PATCH` | `/api/v1/users/me/phone` | 🔒 | Initiate phone number change (sends OTP) |
| A2.5 | `POST` | `/api/v1/users/me/phone/verify` | 🔒 | Confirm phone change with OTP |
| A2.6 | `POST` | `/api/v1/users/me/push-token` | 🔒 | Register / update Expo push notification token |

---

### A2.1 `GET /api/v1/users/me`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id":                       "usr_01j4abc",
    "phoneNumber":              "+94771234567",
    "surname":                  "Perera",
    "email":                    "p@example.com",
    "isVerified":               true,
    "strikes":                  0,
    "pushNotificationsEnabled": true,
    "emailReceiptsEnabled":     false,
    "createdAt":                "2026-08-01T10:00:00Z"
  }
}
```

---

### A2.2 `PATCH /api/v1/users/me`

**Request Body (all optional):**
```json
{
  "surname": "Perera Jayasinghe",
  "email":   "new@example.com"
}
```

**Response `200`:** Updated user object (same shape as A2.1).

---

### A2.3 `PATCH /api/v1/users/me/preferences`

**Request Body (all optional):**
```json
{
  "pushNotificationsEnabled": true,
  "emailReceiptsEnabled":     false
}
```

**Response `200`:** Updated user object.

---

### A2.4 `PATCH /api/v1/users/me/phone`

**Request Body:**
```json
{ "newPhoneNumber": "+94779876543" }
```

**Response `200`:**
```json
{ "success": true, "data": { "message": "OTP sent to +94779876543. Verify to confirm change." } }
```

---

### A2.5 `POST /api/v1/users/me/phone/verify`

**Request Body:**
```json
{
  "newPhoneNumber": "+94779876543",
  "otp":            "123456"
}
```

**Response `200`:**
```json
{ "success": true, "data": { "message": "Phone number updated successfully." } }
```

---

### A2.6 `POST /api/v1/users/me/push-token`

**Request Body:**
```json
{ "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]" }
```

**Response `200`:**
```json
{ "success": true, "data": { "message": "Push token registered." } }
```

---

## A3 — Pharmacies

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A3.1 | `GET` | `/api/v1/pharmacies` | 🔓 | List pharmacies with filtering and distance sort |
| A3.2 | `GET` | `/api/v1/pharmacies/{pharmacyId}` | 🔓 | Get single pharmacy detail |
| A3.3 | `GET` | `/api/v1/pharmacies/favorites` | 🔒 | List customer's favorited pharmacies |
| A3.4 | `POST` | `/api/v1/pharmacies/{pharmacyId}/favorites` | 🔒 | Add pharmacy to favorites |
| A3.5 | `DELETE` | `/api/v1/pharmacies/{pharmacyId}/favorites/{favoriteId}` | 🔒 | Remove pharmacy from favorites |

---

### A3.1 `GET /api/v1/pharmacies`

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Text search on name / address |
| `latitude` | float | Customer GPS latitude |
| `longitude` | float | Customer GPS longitude |
| `sort` | string | `distance` \| `rating` \| `popularity` (default: `popularity`) |
| `page` | int | Page number |
| `limit` | int | Items per page |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id":                   "pha_01j4",
      "name":                 "MediCare Central Pharmacy",
      "address":              "124 Galle Road, Colombo 03",
      "distance":             "0.8 km",
      "rating":               4.9,
      "popularity":           98,
      "nmraLicense":          "PH-2024-8891",
      "pharmacistName":       "SLMC Verified",
      "pharmacistRegNo":      "SL-REG-10492",
      "estimatedResponseTime":"5 - 15 mins",
      "isOpen":               true,
      "isFavorite":           true,
      "favoriteId":           "fav_01j4",
      "hasOffer":             true,
      "offerTag":             "15% Off First Order",
      "image":                "https://cdn.medipick.lk/pharmacies/pha_01j4.jpg",
      "latitude":             6.9034,
      "longitude":            79.8540
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

> [!NOTE]
> `isFavorite` and `favoriteId` are only included in the response when the request is **authenticated**. `favoriteId` is the ID needed to call the DELETE unfavorite endpoint.
>
> `distance` is only present when `latitude` and `longitude` query params are provided.

---

### A3.2 `GET /api/v1/pharmacies/{pharmacyId}`

**Response `200`:** Single pharmacy object — same shape as A3.1 list item.

---

### A3.3 `GET /api/v1/pharmacies/favorites`

**Response `200`:** Paginated list — same shape as A3.1. All items have `isFavorite: true`.

---

### A3.4 `POST /api/v1/pharmacies/{pharmacyId}/favorites`

**Request Body:** _(empty)_

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "favoriteId": "fav_01j4",
    "pharmacyId": "pha_01j4",
    "createdAt":  "2026-08-17T09:31:05Z"
  }
}
```

**Error:** `409 ALREADY_FAVORITED`

---

### A3.5 `DELETE /api/v1/pharmacies/{pharmacyId}/favorites/{favoriteId}`

**Response `204`:** _(No body)_

---

## A4 — Medicines

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A4.1 | `GET` | `/api/v1/medicines` | 🔓 | Browse medicine catalogue |
| A4.2 | `GET` | `/api/v1/medicines/{medicineId}` | 🔓 | Get single medicine detail |

---

### A4.1 `GET /api/v1/medicines`

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `search` | string | Text search on `name` / `genericName` |
| `category` | string | `Cold & Flu` \| `Vitamins` \| `First Aid` \| `Chronic` \| `Supplements` \| `Skincare` \| `Personal Care` \| `Baby Care` |
| `pharmacyId` | UUID | Only return medicines stocked at this pharmacy |
| `isRxRequired` | boolean | `true` = Rx only · `false` = OTC only |
| `inStock` | boolean | Only in-stock items (requires `pharmacyId`) |
| `sort` | string | `popularity` \| `name` \| `price_asc` \| `price_desc` |
| `page` | int | Page number |
| `limit` | int | Items per page |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id":           "med_01j4",
      "name":         "Panadol 500mg (Caplets)",
      "genericName":  "Paracetamol",
      "dosage":       "500mg",
      "category":     "Cold & Flu",
      "description":  "Fast-acting paracetamol for headaches, fever...",
      "isRxRequired": false,
      "mrpPrice":     120,
      "image":        "https://cdn.medipick.lk/medicines/med_01j4.jpg",
      "popularity":   100,
      "inStock":      true,
      "pharmacyPrice": 100
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 16, "totalPages": 1 }
}
```

> [!NOTE]
> `pharmacyPrice` and `inStock` are only present when the `pharmacyId` query param is provided.

---

### A4.2 `GET /api/v1/medicines/{medicineId}`

**Response `200`:** Single medicine object — same shape as A4.1 item.

---

## A5 — Orders

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A5.1 | `GET` | `/api/v1/orders` | 🔒 | List all orders for the customer |
| A5.2 | `GET` | `/api/v1/orders/{orderId}` | 🔒 | Get full order detail |
| A5.3 | `POST` | `/api/v1/orders` | 🔒 | Create a new order |
| A5.4 | `POST` | `/api/v1/orders/{orderId}/cancel` | 🔒 | Cancel an order |
| A5.5 | `POST` | `/api/v1/orders/{orderId}/reorder` | 🔒 | Duplicate a completed order as new draft |
| A5.6 | `POST` | `/api/v1/orders/{orderId}/ratings` | 🔒 | Submit star rating for the order |
| A5.7 | `POST` | `/api/v1/orders/{orderId}/pickup/extension-requests` | 🔒 | Request pickup deadline extension |

---

### A5.1 `GET /api/v1/orders`

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `state` | string | Filter by FSM state(s) e.g. `PREPARING` |
| `orderType` | string | `OTC` \| `PRESCRIPTION` \| `MIXED` |
| `page` | int | Page number |
| `limit` | int | Items per page |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id":             "ord-101",
      "orderNumber":    "#MP123456",
      "orderType":      "MIXED",
      "state":          "READY_FOR_PICKUP",
      "pharmacyName":   "MediCare Central Pharmacy",
      "pharmacyAddress":"124 Galle Road, Colombo 03",
      "totalAmount":    990,
      "totalMrp":       1090,
      "savings":        100,
      "isPaid":         true,
      "paymentMethod":  "ONLINE",
      "itemCount":      2,
      "createdAt":      "2026-08-17T09:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 11, "totalPages": 1 }
}
```

---

### A5.2 `GET /api/v1/orders/{orderId}`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id":          "ord-101",
    "orderNumber": "#MP123456",
    "orderType":   "MIXED",
    "state":       "READY_FOR_PICKUP",
    "pharmacy": {
      "id":                   "pha_01j4",
      "name":                 "MediCare Central Pharmacy",
      "address":              "124 Galle Road, Colombo 03",
      "nmraLicense":          "PH-2024-8891",
      "pharmacistName":       "SLMC Verified",
      "pharmacistRegNo":      "SL-REG-10492",
      "estimatedResponseTime":"5 - 15 mins",
      "distance":             "0.8 km",
      "rating":               4.9,
      "isOpen":               true,
      "image":                "https://cdn.medipick.lk/pharmacies/pha_01j4.jpg",
      "latitude":             6.9034,
      "longitude":            79.8540
    },
    "prescriptionUri":           null,
    "aiClarityScore":            87.5,
    "items": [
      {
        "medicine": {
          "id":          "med_01j4",
          "name":        "Panadol 500mg (Caplets)",
          "genericName": "Paracetamol",
          "dosage":      "500mg",
          "image":       "https://cdn.medipick.lk/medicines/med_01j4.jpg"
        },
        "quantity": 2,
        "price":    100
      }
    ],
    "quotes":             [],
    "selectedQuote":      null,
    "totalAmount":        990,
    "totalMrp":           1090,
    "savings":            100,
    "paymentMethod":      "ONLINE",
    "isPaid":             true,
    "rejectReason":       null,
    "refundStatus":       null,
    "pickupOtp":          "849201",
    "pickupOtpVerified":  false,
    "pickupDeadline":     "2026-08-17T14:00:00Z",
    "pickupExtensionRequested": false,
    "slaPharmacyReviewDeadline": null,
    "slaCustomerConfirmDeadline": null,
    "createdAt":          "2026-08-17T09:00:00Z"
  }
}
```

---

### A5.3 `POST /api/v1/orders`

**Headers:**
- `Idempotency-Key`: UUID or unique string to prevent duplicate orders if network retry occurs.

**Request Body:**
```json
{
  "orderType":      "OTC",
  "pharmacyId":     "pha_01j4",
  "items": [
    { "medicineId": "med_01j4", "quantity": 2 },
    { "medicineId": "med_02j4", "quantity": 1 }
  ],
  "paymentMethod":  "ONLINE",
  "prescriptionId": null,
  "customerNote":   "Please double-bag.",
  "allowGenericSubstitutions": true
}
```

**Validation rules:**
- `prescriptionId` required when `orderType` = `PRESCRIPTION` or `MIXED`
- All medicines must be in stock at the given `pharmacyId`
- Pharmacy must have `isOpen: true`

**Behaviour:**
- OTC → state = `SUBMITTED`, prices copied from `pharmacy_inventory`
- PRESCRIPTION / MIXED → state = `PRESCRIPTION_VALIDATION`, triggers AI check on the attached prescription
- Idempotency is verified using the `Idempotency-Key` header; cached response is returned if it's a duplicate request.

**Response `201`:** Full order detail (same as A5.2).

**Error Codes:**
| Code | HTTP | When |
|---|---|---|
| `PHARMACY_CLOSED` | 422 | Pharmacy not accepting orders |
| `MEDICINE_OUT_OF_STOCK` | 422 | Item not available at this pharmacy |
| `PRESCRIPTION_REQUIRED` | 422 | Rx medicine without prescription |
| `PRESCRIPTION_NOT_APPROVED` | 422 | Prescription clarity check not passed |

---

### A5.4 `POST /api/v1/orders/{orderId}/cancel`

**Request Body:** _(empty)_

**Strike rules (matches current `OrderContext` strike logic):**
- States `DRAFT`, `SUBMITTED`, `PRESCRIPTION_VALIDATION`, `AWAITING_PRESCRIPTION_UPLOAD`, `WAITING_PHARMACY_CONFIRMATION` → **no strike**
- States `WAITING_CUSTOMER_CONFIRMATION`, `PREPARING`, `READY_FOR_PICKUP` → **strike +1**

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id":              "ord-101",
    "state":           "CANCELLED",
    "strikeAdded":     true,
    "customerStrikes": 2
  }
}
```

---

### A5.5 `POST /api/v1/orders/{orderId}/reorder`

**Request Body:** _(empty)_

**Response `201`:** New order detail object (state = `DRAFT`).

---

### A5.6 `POST /api/v1/orders/{orderId}/ratings`

**Request Body:**
```json
{
  "rating":  5,
  "comment": "Very fast and accurate!"
}
```

**Validation:** `rating` integer 1–5. Only callable when `state = COMPLETED`.

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id":         "rat_01j4",
    "rating":     5,
    "orderId":    "ord-101",
    "pharmacyId": "pha_01j4"
  }
}
```

---

### A5.7 `POST /api/v1/orders/{orderId}/pickup/extension-requests`

**Request Body:** _(empty)_

**Behaviour:** Adds system chat message to order thread: `"Customer requested a 24-hour pickup window extension."` and extends `pickupDeadline` by 24 hours.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "pickupDeadline":            "2026-08-18T14:00:00Z",
    "pickupExtensionRequested":  true
  }
}
```

---

## A6 — Prescriptions

> [!NOTE]
> **Implementation Detail:** The Prescription AI Validation is a **pre-built external AI service**. The backend team will build the API endpoints below to integrate with it, but the AI computer vision/OCR engine itself is already built.

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A6.1 | `GET` | `/api/v1/prescriptions/upload-url` | 🔒 | Get pre-signed cloud storage URL for upload |
| A6.2 | `POST` | `/api/v1/prescriptions` | 🔒 | Register prescription after upload |
| A6.3 | `GET` | `/api/v1/prescriptions/{prescriptionId}` | 🔒 | Get full prescription + AI check detail |
| A6.4 | `GET` | `/api/v1/prescriptions/{prescriptionId}/status` | 🔒 | Lightweight status poll |

---

### A6.1 `GET /api/v1/prescriptions/upload-url`

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `contentType` | string | MIME type e.g. `image/jpeg`, `application/pdf` |
| `fileName` | string | Original file name |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://storage.googleapis.com/medipick-rx/...",
    "fileKey":   "prescriptions/usr_01j4/2026-08/rx_8834.jpg",
    "expiresIn": 900
  }
}
```

---

### A6.2 `POST /api/v1/prescriptions`

**Request Body:**
```json
{
  "fileKey":       "prescriptions/usr_01j4/2026-08/rx_8834.jpg",
  "fileName":      "prescription.jpg",
  "contentType":   "image/jpeg",
  "fileSizeBytes": 1245678
}
```

**Behaviour:** Stores record, triggers async AI clarity check.

**Response `202`:**
```json
{
  "success": true,
  "data": {
    "prescriptionId": "prx_01j4",
    "status":         "PRESCRIPTION_VALIDATION",
    "aiClarityScore": null,
    "fileUrl":        "https://cdn.medipick.lk/prescriptions/..."
  }
}
```

---

### A6.3 `GET /api/v1/prescriptions/{prescriptionId}`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id":            "prx_01j4",
    "status":        "WAITING_PHARMACY_CONFIRMATION",
    "aiClarityScore": 87.5,
    "aiChecks": {
      "clarity":         { "score": 87.5, "max": 100, "passed": true },
      "doctorSignature": { "detected": true },
      "patientName":     { "detected": true },
      "date":            { "detected": true, "value": "2026-08-10" }
    },
    "pharmacistNote": null,
    "fileUrl":        "https://cdn.medipick.lk/prescriptions/...",
    "createdAt":      "2026-08-17T09:10:00Z"
  }
}
```

**Prescription `status` Values:**
| Value | Meaning |
|---|---|
| `PRESCRIPTION_VALIDATION` | AI check running |
| `WAITING_PHARMACY_CONFIRMATION` | AI passed; awaiting pharmacist review |
| `REJECTED` | Pharmacist rejected prescription |
| `AWAITING_PRESCRIPTION_UPLOAD` | Pharmacist requested reupload (`REUPLOAD_REQUESTED`) |

---

### A6.4 `GET /api/v1/prescriptions/{prescriptionId}/status`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "prescriptionId": "prx_01j4",
    "status":         "WAITING_PHARMACY_CONFIRMATION",
    "aiClarityScore": 87.5
  }
}
```

---

## A7 — Quotes

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A7.1 | `GET` | `/api/v1/orders/{orderId}/quotes/current` | 🔒 | Get active quote for an order |
| A7.2 | `POST` | `/api/v1/orders/{orderId}/quotes/current/accept` | 🔒 | Accept the quote |
| A7.3 | `POST` | `/api/v1/orders/{orderId}/quotes/current/decline` | 🔒 | Decline the quote |

---

### A7.1 `GET /api/v1/orders/{orderId}/quotes/current`

Only relevant when order `state = WAITING_CUSTOMER_CONFIRMATION`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id":              "qot_01j4",
    "orderId":         "ord-103",
    "pharmacyId":      "pha_01j4",
    "pharmacyName":    "MediCare Central Pharmacy",
    "pharmacistName":  "SLMC Verified",
    "pharmacistRegNo": "SL-REG-10492",
    "nmraLicense":     "PH-2024-8891",
    "items": [
      {
        "medicineName":     "Amoxicillin 500mg Capsules",
        "genericName":      "Amoxicillin Trihydrate",
        "mrp":              450,
        "quotedPrice":      400,
        "quantity":         2,
        "isAlternative":    false,
        "originalPrescribed": null
      }
    ],
    "totalAmount": 800,
    "totalMrp":    900,
    "savings":     100,
    "validUntil":  "2026-08-17T13:31:00Z",
    "status":      "PENDING"
  }
}
```

**Quote `status` values:** `PENDING` · `ACCEPTED` · `DECLINED` · `EXPIRED`

---

### A7.2 `POST /api/v1/orders/{orderId}/quotes/current/accept`

**Request Body:** _(empty)_

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "orderId":           "ord-103",
    "state":             "PREPARING",
    "paymentClientSecret": "pi_3xxx_secret_xxxx"
  }
}
```

> `paymentClientSecret` is only present when `paymentMethod = ONLINE`. It is `null` for `PAY_AT_COUNTER`.

---

### A7.3 `POST /api/v1/orders/{orderId}/quotes/current/decline`

**Request Body:** _(empty)_

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "orderId":     "ord-103",
    "state":       "CANCELLED",
    "strikeAdded": false
  }
}
```

---

## A8 — Payments

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A8.1 | `POST` | `/api/v1/payments/intents` | 🔒 | Create payment intent |
| A8.2 | `POST` | `/api/v1/payments/webhook` | 🔓 (HMAC-signed) | Gateway payment confirmation callback |

---

### A8.1 `POST /api/v1/payments/intents`

**Headers:**
- `Idempotency-Key`: UUID or unique string to prevent duplicate charges if network retry occurs.

**Request Body:**
```json
{ "orderId": "ord-103" }
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "paymentId":    "pay_01j4",
    "clientSecret": "pi_3xxx_secret_xxxx",
    "amount":       800,
    "currency":     "LKR",
    "gateway":      "payhere"
  }
}
```

---

### A8.2 `POST /api/v1/payments/webhook`

Secured via `X-PayHere-Signature` HMAC-SHA256 header verification — **not** customer JWT.

**Response:** `200 OK` (plain text, as required by PayHere).

---

## A9 — Messages (Chat)

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A9.1 | `GET` | `/api/v1/orders/{orderId}/messages` | 🔒 | Get all messages in order chat |
| A9.2 | `POST` | `/api/v1/orders/{orderId}/messages` | 🔒 | Send a message |

---

### A9.1 `GET /api/v1/orders/{orderId}/messages`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id":         "msg_01j4",
      "orderId":    "ord-101",
      "senderRole": "PHARMACIST",
      "senderName": "Pharmacist",
      "text":       "Hello! Your order is verified and ready at counter 2.",
      "timestamp":  "2:10 PM",
      "createdAt":  "2026-08-17T09:35:00Z"
    },
    {
      "id":         "msg_02j4",
      "orderId":    "ord-101",
      "senderRole": "CUSTOMER",
      "senderName": "You",
      "text":       "Thank you! Can I collect it around 5:30 PM today?",
      "timestamp":  "2:14 PM",
      "createdAt":  "2026-08-17T09:37:00Z"
    }
  ]
}
```

> [!NOTE]
> Both `timestamp` (formatted display string like `"2:15 PM"`) **and** `createdAt` (ISO 8601 UTC) are returned. The frontend uses `timestamp` for display; `createdAt` is used for ordering and real-time sync.

**`senderRole` values:** `CUSTOMER` · `PHARMACIST` · `PHARMACY_STAFF` · `PLATFORM_ADMIN` · `SYSTEM`

---

### A9.2 `POST /api/v1/orders/{orderId}/messages`

**Request Body:**
```json
{ "text": "When will my order be ready?" }
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id":         "msg_03j4",
    "orderId":    "ord-101",
    "senderRole": "CUSTOMER",
    "senderName": "Perera",
    "text":       "When will my order be ready?",
    "timestamp":  "2:40 PM",
    "createdAt":  "2026-08-17T09:40:00Z"
  }
}
```

---

## A10 — Notifications

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A10.1 | `GET` | `/api/v1/notifications` | 🔒 | List all customer notifications |
| A10.2 | `PATCH` | `/api/v1/notifications/{notificationId}` | 🔒 | Mark single notification as read |
| A10.3 | `POST` | `/api/v1/notifications/read-all` | 🔒 | Mark all notifications as read |

---

### A10.1 `GET /api/v1/notifications`

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `unreadOnly` | boolean | Only unread notifications |
| `page` | int | Page number |
| `limit` | int | Items per page |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id":        "ntf_01j4",
      "type":      "PICKUP_READY",
      "title":     "Order Ready for Pickup!",
      "body":      "Your prescription #MP123456 is verified and ready at MediCare Central counter.",
      "orderId":   "ord-101",
      "read":      false,
      "createdAt": "2026-08-17T10:15:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

> [!NOTE]
> Field is named `read` (not `isRead`) to match the notification display pattern used in `NotificationsScreen.tsx`.

**Notification `type` values:**
`ORDER_STATUS_CHANGED` · `QUOTE_RECEIVED` · `PICKUP_READY` · `ORDER_CANCELLED` · `PRESCRIPTION_APPROVED` · `PRESCRIPTION_REJECTED` · `PAYMENT_CONFIRMED` · `ISSUE_RESOLVED` · `SYSTEM`

---

### A10.2 `PATCH /api/v1/notifications/{notificationId}`

**Request Body:**
```json
{ "read": true }
```

**Response `200`:**
```json
{ "success": true, "data": { "id": "ntf_01j4", "read": true } }
```

---

### A10.3 `POST /api/v1/notifications/read-all`

**Request Body:** _(empty)_

**Response `200`:**
```json
{ "success": true, "data": { "markedCount": 4 } }
```

---

## A11 — Health Tips

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A11.1 | `GET` | `/api/v1/health-tips` | 🔓 | Browse published articles |
| A11.2 | `GET` | `/api/v1/health-tips/{tipId}` | 🔓 | Get full article with body text |

---

### A11.1 `GET /api/v1/health-tips`

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `category` | string | `Immunity` \| `Skincare` \| `Mental Health` \| `First Aid` |
| `page` | int | Page number |
| `limit` | int | Items per page (default: `10`) |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id":           "tip-1",
      "title":        "5 Ways to Boost Immunity This Winter",
      "category":     "Immunity",
      "previewText":  "Simple lifestyle changes can dramatically increase your body's natural defenses.",
      "imageUrl":     "https://cdn.medipick.lk/tips/tip-1.jpg",
      "publishedAt":  "2024-10-25",
      "readTimeMins": 3
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 4, "totalPages": 1 }
}
```

---

### A11.2 `GET /api/v1/health-tips/{tipId}`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id":           "tip-1",
    "title":        "5 Ways to Boost Immunity This Winter",
    "category":     "Immunity",
    "previewText":  "Simple lifestyle changes...",
    "bodyText":     "With flu season around the corner...\n\n1. Stay Hydrated...",
    "imageUrl":     "https://cdn.medipick.lk/tips/tip-1.jpg",
    "publishedAt":  "2024-10-25",
    "readTimeMins": 3
  }
}
```

---

## A12 — Issues

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| A12.1 | `GET` | `/api/v1/issues/upload-url` | 🔒 | Pre-signed URL for evidence photo upload |
| A12.2 | `POST` | `/api/v1/orders/{orderId}/issues` | 🔒 | Report an issue against a completed order |
| A12.3 | `GET` | `/api/v1/orders/{orderId}/issues/current` | 🔒 | Get current issue for this order |

---

### A12.1 `GET /api/v1/issues/upload-url`

Used by ReportIssueScreen which has an evidence photo picker.

**Query Params:** Same as A6.1 (`contentType`, `fileName`)

**Response `200`:** Same shape as A6.1.

---

### A12.2 `POST /api/v1/orders/{orderId}/issues`

**Request Body:**
```json
{
  "issueType":       "Wrong medicine",
  "description":     "I received Ibuprofen instead of Panadol.",
  "evidenceFileKeys":["issues/usr_01j4/evidence_1.jpg"]
}
```

**`issueType` values (matching ReportIssueScreen):**
`Missing medicine` · `Wrong medicine` · `Damaged / Expired` · `Wrong quantity` · `Other`

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id":        "iss_01j4",
    "orderId":   "ord-101",
    "issueType": "Wrong medicine",
    "status":    "OPEN",
    "createdAt": "2026-08-17T11:00:00Z"
  }
}
```

---

### A12.3 `GET /api/v1/orders/{orderId}/issues/current`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id":          "iss_01j4",
    "issueType":   "Wrong medicine",
    "description": "I received Ibuprofen instead of Panadol.",
    "status":      "RESOLVED",
    "resolution":  "A refund of LKR 150.00 has been processed to your original payment method.",
    "createdAt":   "2026-08-17T11:00:00Z",
    "updatedAt":   "2026-08-18T09:00:00Z"
  }
}
```

**Issue `status` values:** `OPEN` · `UNDER_REVIEW` · `RESOLVED` · `REJECTED`

---

## A13 — WebSocket

For real-time order updates and chat — required by `ReadyForPickupScreen` (OTP verification events) and `PharmacyChatScreen`.

### A13.1 `WSS /api/v1/orders/{orderId}/subscribe`

**Connection URL:**
```
wss://api.medipick.lk/v1/orders/{orderId}/subscribe?token=<accessToken>
```

**Message Types received by client:**

```json
{ "type": "ORDER_STATE_CHANGED",  "data": { "state": "READY_FOR_PICKUP" } }
{ "type": "OTP_VERIFIED",         "data": { "pickupOtpVerified": true } }
{ "type": "NEW_MESSAGE",          "data": { /* ChatMessage object */ } }
{ "type": "QUOTE_RECEIVED",       "data": { /* Quote object */ } }
{ "type": "PING",                 "data": {} }
```

**Fallback:** If WebSocket not available, client polls `GET /api/v1/orders/{orderId}` every 5 seconds.

---

## 6. Screen-by-Screen API Map

For each screen: what APIs it calls, when, and which response fields it uses.

---

### B1 — SplashScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | Check SecureStore for tokens | If no tokens → navigate to Login |
| If tokens found | `GET /api/v1/users/me` (A2.1) | Validate session. Success → Home. `401` → try token refresh |
| On `401` from above | `POST /api/v1/auth/token/refresh` (A1.4) | Silent session restore. Fail → Login |

**Fields used:** `id`, `surname`, `isVerified`, `strikes`

---

### B2 — LoginScreen

| Trigger | API | Purpose |
|---|---|---|
| Tap "Send OTP" | `POST /api/v1/auth/otp/request` (A1.1) | Sends OTP SMS → navigate to OTPScreen |

**Fields sent:** `phoneNumber`, `surname`, `email`
**Fields used from response:** `expiresIn` (countdown timer passed to OTPScreen)

---

### B3 — OTPScreen

| Trigger | API | Purpose |
|---|---|---|
| 6 digits entered | `POST /api/v1/auth/otp/verify` (A1.2) | Verify OTP → save tokens to SecureStore → navigate to Home |
| Tap "Resend" | `POST /api/v1/auth/otp/resend` (A1.3) | New OTP → reset countdown |

**Fields used from A1.2:** `accessToken`, `refreshToken`, `expiresIn`, `user.*`

---

### B4 — HomeScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/users/me` (A2.1) | Load name for avatar greeting |
| On mount | `GET /api/v1/pharmacies` (A3.1) `?latitude=X&longitude=Y&sort=distance&limit=5` | Store carousel |
| On mount | `GET /api/v1/orders` (A5.1) `?state=PREPARING,READY_FOR_PICKUP,WAITING_CUSTOMER_CONFIRMATION` | Active order banner |
| On mount | `GET /api/v1/health-tips` (A11.1) `?limit=3` | Health tips preview |
| On mount | `GET /api/v1/notifications` (A10.1) `?unreadOnly=true&limit=1` | Bell badge unread count |
| Tap heart on pharmacy | `POST /api/v1/pharmacies/{id}/favorites` (A3.4) | Add favorite |
| Tap filled heart | `DELETE /api/v1/pharmacies/{id}/favorites/{favoriteId}` (A3.5) | Remove favorite |

**Pharmacy fields used:** `id`, `name`, `address`, `distance`, `rating`, `isOpen`, `estimatedResponseTime`, `hasOffer`, `offerTag`, `image`, `isFavorite`, `favoriteId`

---

### B5 — FavoritesScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount / focus | `GET /api/v1/pharmacies/favorites` (A3.3) | Load favorited pharmacies |
| Tap heart | `DELETE /api/v1/pharmacies/{id}/favorites/{favoriteId}` (A3.5) | Remove favorite, re-fetch |

**Fields used:** `id`, `name`, `address`, `distance`, `rating`, `estimatedResponseTime`, `image`, `favoriteId`

---

### B6 — BrowseOTCScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/medicines` (A4.1) `?isRxRequired=false` | Full OTC catalogue |
| Pharmacy selected | `GET /api/v1/medicines` (A4.1) `?pharmacyId=X&isRxRequired=false&inStock=true` | Pharmacy-specific stock |
| User searches | `GET /api/v1/medicines` (A4.1) `?search=query` | Live search |
| Category tap | `GET /api/v1/medicines` (A4.1) `?category=X` | Category filter |
| Pharmacy selector | `GET /api/v1/pharmacies` (A3.1) | Pharmacy selector list |
| Tap heart | `POST` / `DELETE` favorites (A3.4 / A3.5) | Toggle favorite |

**Medicine fields used:** `id`, `name`, `genericName`, `dosage`, `category`, `mrpPrice`, `pharmacyPrice`, `image`, `inStock`, `isRxRequired`, `popularity`

---

### B7 — MultiStoreCartScreen

| Trigger | API | Purpose |
|---|---|---|
| Tap "Place Order" | `POST /api/v1/orders` (A5.3) per store | Creates one order per pharmacy's cart |
| If payment = `ONLINE` | `POST /api/v1/payments/intents` (A8.1) | Creates payment intent for modal |

**Fields sent to A5.3:** `orderType`, `pharmacyId`, `items[{medicineId, quantity}]`, `paymentMethod`, `prescriptionId`
**Fields used from A8.1:** `clientSecret`, `amount`, `gateway`

---

### B8 — UploadPrescriptionScreen

| Trigger | API | Purpose |
|---|---|---|
| Image selected from picker | `GET /api/v1/prescriptions/upload-url` (A6.1) | Get pre-signed upload URL |
| After getting URL | Direct `PUT` to cloud storage URL | Upload image file directly |
| After cloud upload | `POST /api/v1/prescriptions` (A6.2) | Register prescription in DB, trigger AI |
| Navigate to AIQualityCheck | Pass `prescriptionId` + `aiClarityScore` as route params | → AIQualityCheckScreen |

---

### B9 — AIQualityCheckScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount (polling every 2s) | `GET /api/v1/prescriptions/{id}/status` (A6.4) | Poll until status leaves `PRESCRIPTION_VALIDATION` |
| On AI completion | `GET /api/v1/prescriptions/{id}` (A6.3) | Full AI checks breakdown to display |

**Fields used from A6.3:** `aiClarityScore`, `aiChecks.*`, `status`, `pharmacistNote`

---

### B10 — SelectPharmacyScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/pharmacies` (A3.1) `?latitude=X&longitude=Y&sort=distance` | List pharmacies by proximity |
| Tap sort toggle | `GET /api/v1/pharmacies` (A3.1) `?sort=rating` | Re-fetch with rating sort |
| Tap "Send to Pharmacy" | `POST /api/v1/orders` (A5.3) | Create PRESCRIPTION order |

**Fields sent to A5.3:** `orderType=PRESCRIPTION`, `pharmacyId`, `prescriptionId`
**Pharmacy fields used:** `id`, `name`, `address`, `distance`, `rating`, `estimatedResponseTime`, `nmraLicense`, `pharmacistName`, `isOpen`, `image`

---

### B11 — OrdersScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount / focus | `GET /api/v1/orders` (A5.1) | Full order list |
| Pull-to-refresh | `GET /api/v1/orders` (A5.1) | Re-fetch |
| Tap "Reorder" | `POST /api/v1/orders/{id}/reorder` (A5.5) | Duplicate order |

**Fields used from A5.1:** `id`, `orderNumber`, `orderType`, `state`, `pharmacyName`, `pharmacyAddress`, `totalAmount`, `totalMrp`, `savings`, `isPaid`, `paymentMethod`, `itemCount`, `createdAt`

---

### B12 — OrderDetailsScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/orders/{id}` (A5.2) | Full order detail |
| Tap "Cancel Order" | `POST /api/v1/orders/{id}/cancel` (A5.4) | Cancel with strike warning |
| Tap "Reorder" | `POST /api/v1/orders/{id}/reorder` (A5.5) | Duplicate |

**All fields from A5.2 used**, including `pharmacy.*`, `items[].medicine.*`, `items[].price`, `pickupOtp`, `rejectReason`, `refundStatus`, `slaPharmacyReviewDeadline`

---

### B13 — QuotationScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/orders/{id}/quotes/current` (A7.1) | Load quote items + totals |
| Tap "Accept & Pay" | `POST /api/v1/orders/{id}/quotes/current/accept` (A7.2) | Accept. If ONLINE → `paymentClientSecret` returned |
| After accepting (ONLINE) | Open StripePaymentModal with `paymentClientSecret` | Payment UI |
| Tap "Decline" | `POST /api/v1/orders/{id}/quotes/current/decline` (A7.3) | Decline |

**Quote fields used:** `items[{medicineName, mrp, quotedPrice, quantity, isAlternative, originalPrescribed}]`, `totalAmount`, `totalMrp`, `savings`, `validUntil`, `pharmacyName`, `pharmacistName`, `nmraLicense`

---

### B14 — ReadyForPickupScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/orders/{id}` (A5.2) | Load `pickupOtp`, `pickupDeadline`, `paymentMethod`, `totalAmount`, `isPaid` |
| WebSocket / Polling | `WSS .../orders/{id}/subscribe` (A13.1) or `GET /api/v1/orders/{id}` | Detect `OTP_VERIFIED` event |
| OTP verified → rate | `POST /api/v1/orders/{id}/ratings` (A5.6) | Submit star rating |
| Tap "Pay Now" | `POST /api/v1/payments/intents` (A8.1) | Online payment for PAY_AT_COUNTER orders switching to online |
| Tap "Request Extension" | `POST /api/v1/orders/{id}/pickup/extension-requests` (A5.7) | Extend pickup deadline |

---

### B15 — ChatListScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/orders` (A5.1) filtered by chat-eligible states | Show conversations list |

**Fields used:** `id`, `orderNumber`, `pharmacy.name`, `pharmacy.image`, `state`, `createdAt`

> [!NOTE]
> The current screen uses a hardcoded `CHAT_CONVERSATIONS` array. When connected to the API, it will call `GET /api/v1/orders` and filter for orders in states `PREPARING`, `WAITING_CUSTOMER_CONFIRMATION`, `READY_FOR_PICKUP`.

---

### B16 — PharmacyChatScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/orders/{id}/messages` (A9.1) | Load message history |
| WebSocket connected | `WSS .../orders/{id}/subscribe` (A13.1) | Real-time incoming messages |
| Tap send | `POST /api/v1/orders/{id}/messages` (A9.2) | Send message |

**Fields used from A9.1:** `id`, `senderRole`, `senderName`, `text`, `timestamp`, `createdAt`

---

### B17 — NotificationsScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount / focus | `GET /api/v1/notifications` (A10.1) | Load all notifications |
| Tap notification (unread) | `PATCH /api/v1/notifications/{id}` (A10.2) `{ "read": true }` | Mark as read |
| Tap "Mark all read" | `POST /api/v1/notifications/read-all` (A10.3) | Mark all read |

**Fields used:** `id`, `type`, `title`, `body`, `orderId`, `read`, `createdAt`

---

### B18 — ProfileScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/users/me` (A2.1) | Load profile data |
| Edit name / email | `PATCH /api/v1/users/me` (A2.2) | Save changes |
| Toggle notifications | `PATCH /api/v1/users/me/preferences` (A2.3) | Save preference |
| Tap "Change Phone" | `PATCH /api/v1/users/me/phone` (A2.4) | Initiate change |
| Enter OTP in modal | `POST /api/v1/users/me/phone/verify` (A2.5) | Confirm new number |
| Tap "Logout" | `POST /api/v1/auth/logout` (A1.5) | Revoke token + clear SecureStore |
| App start (notification permission) | `POST /api/v1/users/me/push-token` (A2.6) | Register push token |

---

### B19 — HealthTipsScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/health-tips` (A11.1) | Load tip list |
| Tap category | `GET /api/v1/health-tips` (A11.1) `?category=X` | Filtered list |

**Fields used:** `id`, `title`, `category`, `previewText`, `imageUrl`, `publishedAt`, `readTimeMins`

---

### B20 — HealthTipDetailsScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/health-tips/{tipId}` (A11.2) | Full article |

**Fields used:** `title`, `category`, `bodyText`, `imageUrl`, `publishedAt`, `readTimeMins`

---

### B21 — ReportIssueScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | `GET /api/v1/orders/{id}/issues/current` (A12.3) | Check if issue already exists |
| On mount | `GET /api/v1/orders/{id}` (A5.2) | Load order context |
| Photo attached | `GET /api/v1/issues/upload-url` (A12.1) + direct PUT | Upload evidence photo |
| Tap "Submit Report" | `POST /api/v1/orders/{id}/issues` (A12.2) | Submit dispute |

**Fields sent to A12.2:** `issueType`, `description`, `evidenceFileKeys[]`

---

### B22 — LegalDocScreen

| Trigger | API | Purpose |
|---|---|---|
| On mount | _(none)_ | Static content embedded in app or fetched as a plain text asset |

---

## 7. Quick Reference Table

| Method | Endpoint | Auth | Screens |
|---|---|---|---|
| `POST` | `/api/v1/auth/otp/request` | 🔓 | LoginScreen |
| `POST` | `/api/v1/auth/otp/verify` | 🔓 | OTPScreen |
| `POST` | `/api/v1/auth/otp/resend` | 🔓 | OTPScreen |
| `POST` | `/api/v1/auth/token/refresh` | 🔓 | SplashScreen · all screens (auto) |
| `POST` | `/api/v1/auth/logout` | 🔒 | ProfileScreen |
| `GET` | `/api/v1/users/me` | 🔒 | SplashScreen · HomeScreen · ProfileScreen |
| `PATCH` | `/api/v1/users/me` | 🔒 | ProfileScreen |
| `PATCH` | `/api/v1/users/me/preferences` | 🔒 | ProfileScreen |
| `PATCH` | `/api/v1/users/me/phone` | 🔒 | ProfileScreen |
| `POST` | `/api/v1/users/me/phone/verify` | 🔒 | ProfileScreen |
| `POST` | `/api/v1/users/me/push-token` | 🔒 | ProfileScreen (app start) |
| `GET` | `/api/v1/pharmacies` | 🔓 | HomeScreen · BrowseOTCScreen · SelectPharmacyScreen |
| `GET` | `/api/v1/pharmacies/{pharmacyId}` | 🔓 | — |
| `GET` | `/api/v1/pharmacies/favorites` | 🔒 | FavoritesScreen |
| `POST` | `/api/v1/pharmacies/{pharmacyId}/favorites` | 🔒 | HomeScreen · BrowseOTCScreen |
| `DELETE` | `/api/v1/pharmacies/{pharmacyId}/favorites/{favoriteId}` | 🔒 | HomeScreen · BrowseOTCScreen · FavoritesScreen |
| `GET` | `/api/v1/medicines` | 🔓 | BrowseOTCScreen |
| `GET` | `/api/v1/medicines/{medicineId}` | 🔓 | — |
| `GET` | `/api/v1/orders` | 🔒 | HomeScreen · OrdersScreen · ChatListScreen |
| `GET` | `/api/v1/orders/{orderId}` | 🔒 | OrderDetailsScreen · ReadyForPickupScreen · ReportIssueScreen |
| `POST` | `/api/v1/orders` | 🔒 | MultiStoreCartScreen · SelectPharmacyScreen |
| `POST` | `/api/v1/orders/{orderId}/cancel` | 🔒 | OrderDetailsScreen |
| `POST` | `/api/v1/orders/{orderId}/reorder` | 🔒 | OrdersScreen · OrderDetailsScreen |
| `POST` | `/api/v1/orders/{orderId}/ratings` | 🔒 | ReadyForPickupScreen |
| `POST` | `/api/v1/orders/{orderId}/pickup/extension-requests` | 🔒 | ReadyForPickupScreen |
| `GET` | `/api/v1/prescriptions/upload-url` | 🔒 | UploadPrescriptionScreen |
| `POST` | `/api/v1/prescriptions` | 🔒 | UploadPrescriptionScreen |
| `GET` | `/api/v1/prescriptions/{prescriptionId}` | 🔒 | AIQualityCheckScreen |
| `GET` | `/api/v1/prescriptions/{prescriptionId}/status` | 🔒 | AIQualityCheckScreen |
| `GET` | `/api/v1/orders/{orderId}/quotes/current` | 🔒 | QuotationScreen |
| `POST` | `/api/v1/orders/{orderId}/quotes/current/accept` | 🔒 | QuotationScreen |
| `POST` | `/api/v1/orders/{orderId}/quotes/current/decline` | 🔒 | QuotationScreen |
| `POST` | `/api/v1/payments/intents` | 🔒 | MultiStoreCartScreen · QuotationScreen · ReadyForPickupScreen |
| `POST` | `/api/v1/payments/webhook` | 🔓 signed | Server-side only |
| `GET` | `/api/v1/orders/{orderId}/messages` | 🔒 | PharmacyChatScreen |
| `POST` | `/api/v1/orders/{orderId}/messages` | 🔒 | PharmacyChatScreen |
| `GET` | `/api/v1/notifications` | 🔒 | HomeScreen · NotificationsScreen |
| `PATCH` | `/api/v1/notifications/{notificationId}` | 🔒 | NotificationsScreen |
| `POST` | `/api/v1/notifications/read-all` | 🔒 | NotificationsScreen |
| `GET` | `/api/v1/health-tips` | 🔓 | HomeScreen · HealthTipsScreen |
| `GET` | `/api/v1/health-tips/{tipId}` | 🔓 | HealthTipDetailsScreen |
| `GET` | `/api/v1/issues/upload-url` | 🔒 | ReportIssueScreen |
| `POST` | `/api/v1/orders/{orderId}/issues` | 🔒 | ReportIssueScreen |
| `GET` | `/api/v1/orders/{orderId}/issues/current` | 🔒 | ReportIssueScreen |
| `WSS` | `/api/v1/orders/{orderId}/subscribe` | 🔒 token | ReadyForPickupScreen · PharmacyChatScreen |

**Total: 45 endpoints + 1 WebSocket across 13 resource groups**

---

## 8. Error Codes Reference

| Code | HTTP | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body failed schema validation |
| `PHONE_INVALID_FORMAT` | 400 | Must be E.164 format |
| `OTP_INVALID` | 400 | Wrong OTP entered |
| `OTP_EXPIRED` | 400 | Past 5-minute window |
| `OTP_MAX_ATTEMPTS` | 400 | ≥5 failed attempts; must request new OTP |
| `UNAUTHORIZED` | 401 | Missing or invalid Authorization header |
| `ACCESS_TOKEN_EXPIRED` | 401 | Access token expired; use refresh |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh token revoked / not found |
| `REFRESH_TOKEN_EXPIRED` | 401 | 30-day window; must log in again |
| `FORBIDDEN` | 403 | Authenticated but not authorised |
| `CUSTOMER_SUSPENDED` | 403 | Customer has ≥3 strikes |
| `NOT_FOUND` | 404 | Resource does not exist |
| `ALREADY_FAVORITED` | 409 | Pharmacy already in favorites |
| `ORDER_INVALID_STATE` | 422 | Action not allowed in current FSM state |
| `QUOTE_EXPIRED` | 422 | Quote validity window passed |
| `PHARMACY_CLOSED` | 422 | Pharmacy not accepting orders |
| `MEDICINE_OUT_OF_STOCK` | 422 | Item unavailable at this pharmacy |
| `PRESCRIPTION_REQUIRED` | 422 | Rx medicine without prescription |
| `PRESCRIPTION_NOT_APPROVED` | 422 | Prescription clarity check not passed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 9. PostgreSQL Database Schema

> [!IMPORTANT]
> Run these statements **in order** — tables with foreign keys must come after the tables they reference. All tables use `UUID` primary keys generated by `gen_random_uuid()`. All monetary values stored as `NUMERIC(10,2)` representing whole LKR (e.g. `990.00` = LKR 990.00).

---

### 9.0 — Setup: Extensions & ENUMs

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fast ILIKE text search on medicines/pharmacies

-- ─── ENUM Types ──────────────────────────────────────────────────────────────

CREATE TYPE order_type_enum AS ENUM (
  'OTC',
  'PRESCRIPTION',
  'MIXED'
);

CREATE TYPE order_state_enum AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'PRESCRIPTION_VALIDATION',
  'AWAITING_PRESCRIPTION_UPLOAD',
  'WAITING_PHARMACY_CONFIRMATION',
  'WAITING_CUSTOMER_CONFIRMATION',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
  'CLOSED',
  'ISSUE_REPORTED',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED',
  'REUPLOAD_REQUESTED'
);

CREATE TYPE payment_method_enum AS ENUM (
  'ONLINE',
  'PAY_AT_COUNTER'
);

CREATE TYPE payment_status_enum AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE prescription_status_enum AS ENUM (
  'PRESCRIPTION_VALIDATION',
  'WAITING_PHARMACY_CONFIRMATION',
  'REJECTED',
  'AWAITING_PRESCRIPTION_UPLOAD'
);

CREATE TYPE quote_status_enum AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED'
);

CREATE TYPE sender_role_enum AS ENUM (
  'CUSTOMER',
  'PHARMACIST',
  'PHARMACY_STAFF',
  'PLATFORM_ADMIN',
  'SYSTEM'
);

CREATE TYPE issue_status_enum AS ENUM (
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED'
);

CREATE TYPE medicine_category_enum AS ENUM (
  'Cold & Flu',
  'First Aid',
  'Vitamins',
  'Personal Care',
  'Chronic',
  'Skincare',
  'Supplements',
  'Baby Care'
);

CREATE TYPE refund_status_enum AS ENUM (
  'REFUNDED'
);
```

---

### 9.1 — Table: `customers`

```sql
-- Stores every registered MediPick customer.
-- One record per phone number. Created on first OTP request (upsert).
CREATE TABLE customers (
  id                          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number                VARCHAR(20)   NOT NULL UNIQUE,  -- E.164 format e.g. +94771234567
  surname                     VARCHAR(100)  NOT NULL,
  email                       VARCHAR(255)  UNIQUE,           -- Optional; used for receipts
  is_verified                 BOOLEAN       NOT NULL DEFAULT FALSE,
  strikes                     SMALLINT      NOT NULL DEFAULT 0 CHECK (strikes >= 0 AND strikes <= 3),
  push_notifications_enabled  BOOLEAN       NOT NULL DEFAULT TRUE,
  email_receipts_enabled      BOOLEAN       NOT NULL DEFAULT TRUE,
  push_token                  TEXT,                           -- Expo push token; updated on app launch
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers (phone_number);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 9.2 — Table: `refresh_tokens`

```sql
-- Stores issued refresh tokens (hashed). One active token per customer.
-- When a token is used to refresh, the old one is revoked and a new one issued (rotation).
CREATE TABLE refresh_tokens (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash   TEXT         NOT NULL UNIQUE,  -- SHA-256 hash of the raw opaque token
  expires_at   TIMESTAMPTZ  NOT NULL,         -- NOW() + 30 days
  revoked      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_customer ON refresh_tokens (customer_id);
CREATE INDEX idx_refresh_tokens_hash     ON refresh_tokens (token_hash);
```

---

### 9.3 — Table: `otp_requests`

```sql
-- Tracks OTP send events and attempt counts.
-- Redis is used for fast lookup during auth flow;
-- this table provides an audit trail.
CREATE TABLE otp_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  otp_hash     TEXT        NOT NULL,       -- bcrypt hash of the 6-digit OTP
  expires_at   TIMESTAMPTZ NOT NULL,       -- NOW() + 5 minutes
  attempts     SMALLINT    NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  used         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_requests_phone ON otp_requests (phone_number);
CREATE INDEX idx_otp_requests_used  ON otp_requests (phone_number, used, expires_at);
```

---

### 9.4 — Table: `pharmacies`

```sql
-- Registered pharmacies on the MediPick platform.
-- Managed by admin/pharmacist side (not customer API).
CREATE TABLE pharmacies (
  id                     UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   VARCHAR(200)    NOT NULL,
  address                TEXT            NOT NULL,
  nmra_license           VARCHAR(50)     NOT NULL UNIQUE,  -- NMRA license number
  pharmacist_name        VARCHAR(100)    NOT NULL,
  pharmacist_reg_no      VARCHAR(50)     NOT NULL,
  latitude               DOUBLE PRECISION NOT NULL,
  longitude              DOUBLE PRECISION NOT NULL,
  rating                 NUMERIC(3,1)    NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  rating_count           INTEGER         NOT NULL DEFAULT 0,
  popularity_score       SMALLINT        NOT NULL DEFAULT 0 CHECK (popularity_score >= 0 AND popularity_score <= 100),
  estimated_response_time VARCHAR(50)    NOT NULL DEFAULT '15 - 30 mins',  -- Free-form display string
  is_open                BOOLEAN         NOT NULL DEFAULT TRUE,
  has_offer              BOOLEAN         NOT NULL DEFAULT FALSE,
  offer_tag              VARCHAR(100),                      -- e.g. "15% Off First Order"
  cover_image_url        TEXT,
  created_at             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pharmacies_location ON pharmacies USING GIST (
  ll_to_earth(latitude, longitude)
);  -- Enables fast KNN distance queries (requires earthdistance extension)

CREATE INDEX idx_pharmacies_is_open   ON pharmacies (is_open);
CREATE INDEX idx_pharmacies_rating    ON pharmacies (rating DESC);
CREATE INDEX idx_pharmacies_popularity ON pharmacies (popularity_score DESC);

CREATE TRIGGER trg_pharmacies_updated_at
  BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 9.5 — Table: `customer_pharmacy_favorites`

```sql
-- Many-to-many: customers ↔ pharmacies they have favorited.
-- The `id` here is what the API returns as `favoriteId`.
-- The client must store it to be able to call the DELETE unfavorite endpoint.
CREATE TABLE customer_pharmacy_favorites (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID        NOT NULL REFERENCES customers(id)  ON DELETE CASCADE,
  pharmacy_id  UUID        NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_customer_pharmacy_favorite UNIQUE (customer_id, pharmacy_id)
);

CREATE INDEX idx_favorites_customer ON customer_pharmacy_favorites (customer_id);
CREATE INDEX idx_favorites_pharmacy ON customer_pharmacy_favorites (pharmacy_id);
```

---

### 9.6 — Table: `medicines`

```sql
-- Master medicine catalogue. MRP is the government-set maximum retail price.
-- Pharmacy-specific pricing is stored in pharmacy_inventory, not here.
CREATE TABLE medicines (
  id             UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(200)          NOT NULL,          -- e.g. "Panadol 500mg (Caplets)"
  generic_name   VARCHAR(200)          NOT NULL,          -- e.g. "Paracetamol"
  brand_name     VARCHAR(100),                            -- e.g. "Panadol"
  dosage         VARCHAR(50),                             -- e.g. "500mg"
  category       medicine_category_enum NOT NULL,
  description    TEXT,
  is_rx_required BOOLEAN               NOT NULL DEFAULT FALSE,
  mrp_price      NUMERIC(10,2)         NOT NULL CHECK (mrp_price > 0),  -- Government MRP in LKR
  image_url      TEXT,
  popularity     SMALLINT              NOT NULL DEFAULT 0 CHECK (popularity >= 0 AND popularity <= 100),
  created_at     TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- GIN index on name + generic_name for fast ILIKE search
CREATE INDEX idx_medicines_name_search    ON medicines USING GIN (name gin_trgm_ops);
CREATE INDEX idx_medicines_generic_search ON medicines USING GIN (generic_name gin_trgm_ops);
CREATE INDEX idx_medicines_category       ON medicines (category);
CREATE INDEX idx_medicines_rx             ON medicines (is_rx_required);
CREATE INDEX idx_medicines_popularity     ON medicines (popularity DESC);

CREATE TRIGGER trg_medicines_updated_at
  BEFORE UPDATE ON medicines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 9.7 — Table: `pharmacy_inventory`

```sql
-- Per-pharmacy stock and pricing for each medicine.
-- pharmacy_price must never exceed mrp_price (enforced by trigger below).
CREATE TABLE pharmacy_inventory (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id     UUID          NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id     UUID          NOT NULL REFERENCES medicines(id)  ON DELETE CASCADE,
  pharmacy_price  NUMERIC(10,2) NOT NULL CHECK (pharmacy_price > 0),  -- Pharmacy's selling price in LKR
  in_stock        BOOLEAN       NOT NULL DEFAULT TRUE,
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_pharmacy_medicine UNIQUE (pharmacy_id, medicine_id)
);

-- Trigger: pharmacy_price cannot exceed mrp_price from the medicines table
CREATE OR REPLACE FUNCTION check_pharmacy_price_vs_mrp()
RETURNS TRIGGER AS $$
DECLARE
  v_mrp NUMERIC(10,2);
BEGIN
  SELECT mrp_price INTO v_mrp FROM medicines WHERE id = NEW.medicine_id;
  IF NEW.pharmacy_price > v_mrp THEN
    RAISE EXCEPTION 'pharmacy_price (%) cannot exceed mrp_price (%) for medicine %',
      NEW.pharmacy_price, v_mrp, NEW.medicine_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_pharmacy_price
  BEFORE INSERT OR UPDATE ON pharmacy_inventory
  FOR EACH ROW EXECUTE FUNCTION check_pharmacy_price_vs_mrp();

CREATE INDEX idx_inventory_pharmacy   ON pharmacy_inventory (pharmacy_id);
CREATE INDEX idx_inventory_medicine   ON pharmacy_inventory (medicine_id);
CREATE INDEX idx_inventory_in_stock   ON pharmacy_inventory (pharmacy_id, in_stock);
```

---

### 9.8 — Table: `prescriptions`

```sql
-- Uploaded prescription images. One prescription can be linked to one order.
-- ai_checks stores the full breakdown from the AI clarity service as JSON.
CREATE TABLE prescriptions (
  id               UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID                     NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  file_url         TEXT                     NOT NULL,  -- CDN URL to the stored image
  file_key         TEXT                     NOT NULL,  -- Cloud storage key (for signed URL generation)
  ai_clarity_score NUMERIC(5,2),                      -- 0–100, null until AI check completes
  ai_checks        JSONB,                             -- Full AI breakdown (clarity, signature, date, etc.)
  status           prescription_status_enum NOT NULL DEFAULT 'PRESCRIPTION_VALIDATION',
  pharmacist_note  TEXT,                              -- Note from pharmacist when rejecting/requesting reupload
  created_at       TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_customer ON prescriptions (customer_id);
CREATE INDEX idx_prescriptions_status   ON prescriptions (status);

CREATE TRIGGER trg_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Example ai_checks JSONB structure:
-- {
--   "clarity":         { "score": 87.5, "max": 100, "passed": true },
--   "doctorSignature": { "detected": true },
--   "patientName":     { "detected": true },
--   "date":            { "detected": true, "value": "2026-08-10" }
-- }
```

---

### 9.9 — Table: `orders`

```sql
-- The central table. One row per order placed by a customer.
-- FSM state transitions are enforced at the application layer,
-- but recorded here. Prices are frozen at time of order (snapshot).
CREATE TABLE orders (
  id                          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number                VARCHAR(20)        NOT NULL UNIQUE,   -- e.g. #MP123456
  customer_id                 UUID               NOT NULL REFERENCES customers(id),
  pharmacy_id                 UUID               NOT NULL REFERENCES pharmacies(id),
  prescription_id             UUID               REFERENCES prescriptions(id),  -- nullable for OTC
  order_type                  order_type_enum    NOT NULL,
  state                       order_state_enum   NOT NULL DEFAULT 'SUBMITTED',
  payment_method              payment_method_enum,                   -- set when customer confirms
  is_paid                     BOOLEAN            NOT NULL DEFAULT FALSE,
  total_mrp                   NUMERIC(10,2)      NOT NULL DEFAULT 0, -- Sum at MRP prices
  total_amount                NUMERIC(10,2)      NOT NULL DEFAULT 0, -- Sum at pharmacy prices (what customer pays)
  -- total_amount must always be <= total_mrp:
  CONSTRAINT chk_total_amount_lte_mrp CHECK (total_amount <= total_mrp),
  reject_reason               TEXT,                                  -- Pharmacist sets when REJECTED
  refund_status               refund_status_enum,                    -- Set after refund processed
  customer_note               TEXT,                                  -- Free-text note from customer
  pickup_otp                  VARCHAR(6),                            -- 6-digit OTP, generated when READY_FOR_PICKUP
  pickup_otp_verified         BOOLEAN            NOT NULL DEFAULT FALSE,
  pickup_deadline             TIMESTAMPTZ,                           -- Customer must collect before this
  pickup_extension_requested  BOOLEAN            NOT NULL DEFAULT FALSE,
  sla_pharmacy_review_deadline TIMESTAMPTZ,                          -- Pharmacist must respond by this time
  sla_customer_confirm_deadline TIMESTAMPTZ,                         -- Customer must accept/decline by this time
  created_at                  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer      ON orders (customer_id);
CREATE INDEX idx_orders_pharmacy      ON orders (pharmacy_id);
CREATE INDEX idx_orders_state         ON orders (state);
CREATE INDEX idx_orders_customer_state ON orders (customer_id, state);  -- Used by list endpoint with state filter
CREATE INDEX idx_orders_created_at    ON orders (created_at DESC);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Function to generate order number: #MP + 6 random digits
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN '#MP' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
```

---

### 9.10 — Table: `order_items`

```sql
-- Individual medicine line items within an order.
-- Prices are snapshots frozen at order creation time so price changes
-- after order creation don't affect the recorded order.
CREATE TABLE order_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  medicine_id UUID          NOT NULL REFERENCES medicines(id),
  quantity    SMALLINT      NOT NULL CHECK (quantity > 0),
  unit_mrp    NUMERIC(10,2) NOT NULL CHECK (unit_mrp > 0),    -- MRP at time of order (snapshot from medicines.mrp_price)
  unit_price  NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),  -- Pharmacy price at time of order (snapshot)
  -- unit_price must not exceed unit_mrp:
  CONSTRAINT chk_unit_price_lte_mrp CHECK (unit_price <= unit_mrp)
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
```

---

### 9.11 — Table: `quotes`

```sql
-- A pharmacist's formal price quote for a PRESCRIPTION or MIXED order.
-- One order can receive multiple quotes over time (if a quote expires
-- and is re-issued), but only one can be PENDING at a time.
CREATE TABLE quotes (
  id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID             NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pharmacy_id  UUID             NOT NULL REFERENCES pharmacies(id),
  total_amount NUMERIC(10,2)    NOT NULL CHECK (total_amount > 0),
  total_mrp    NUMERIC(10,2)    NOT NULL CHECK (total_mrp > 0),
  CONSTRAINT chk_quote_amount_lte_mrp CHECK (total_amount <= total_mrp),
  status       quote_status_enum NOT NULL DEFAULT 'PENDING',
  valid_until  TIMESTAMPTZ      NOT NULL,  -- Quote expires; customer must act before this
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_order  ON quotes (order_id);
-- Enforce only one PENDING quote per order at a time:
CREATE UNIQUE INDEX uq_one_pending_quote_per_order
  ON quotes (order_id)
  WHERE status = 'PENDING';
```

---

### 9.12 — Table: `quote_items`

```sql
-- Individual line items in a pharmacist's quote.
-- medicine_name is stored as text (snapshot) because the pharmacist
-- may substitute an alternative medicine not in the medicines catalogue.
CREATE TABLE quote_items (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id            UUID          NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  medicine_id         UUID          REFERENCES medicines(id),   -- nullable if pharmacist writes a custom item
  medicine_name       VARCHAR(200)  NOT NULL,   -- Snapshot of name at time of quoting
  generic_name        VARCHAR(200),             -- Snapshot
  quantity            SMALLINT      NOT NULL CHECK (quantity > 0),
  unit_mrp            NUMERIC(10,2) NOT NULL,   -- MRP snapshot
  unit_quoted_price   NUMERIC(10,2) NOT NULL,   -- Pharmacy's quoted price per unit
  CONSTRAINT chk_quoted_price_lte_mrp CHECK (unit_quoted_price <= unit_mrp),
  is_alternative      BOOLEAN       NOT NULL DEFAULT FALSE,  -- TRUE if pharmacist is substituting a generic
  original_prescribed VARCHAR(200)  -- Name of the originally prescribed medicine (if is_alternative = true)
);

CREATE INDEX idx_quote_items_quote ON quote_items (quote_id);
```

---

### 9.13 — Table: `payments`

```sql
-- One payment record per online payment attempt.
-- PayHere webhook updates status from PENDING → SUCCEEDED / FAILED.
CREATE TABLE payments (
  id               UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID                 NOT NULL REFERENCES orders(id),
  customer_id      UUID                 NOT NULL REFERENCES customers(id),
  amount           NUMERIC(10,2)        NOT NULL CHECK (amount > 0),
  currency         VARCHAR(3)           NOT NULL DEFAULT 'LKR',
  method           payment_method_enum  NOT NULL,
  status           payment_status_enum  NOT NULL DEFAULT 'PENDING',
  gateway          VARCHAR(50)          NOT NULL DEFAULT 'payhere',  -- Gateway name e.g. "payhere", "stripe"
  gateway_txn_id   VARCHAR(200),                                     -- Transaction ID from the gateway
  gateway_payload  JSONB,                                            -- Full webhook payload (for audit)
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order      ON payments (order_id);
CREATE INDEX idx_payments_customer   ON payments (customer_id);
CREATE INDEX idx_payments_gateway_txn ON payments (gateway_txn_id);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 9.14 — Table: `order_messages`

```sql
-- Chat messages between customer and pharmacist within an order thread.
-- Also used for SYSTEM messages (e.g. pickup extension notifications).
CREATE TABLE order_messages (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID             NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_role       sender_role_enum NOT NULL,
  sender_id         UUID,            -- customer_id or pharmacist_id; null for SYSTEM messages
  sender_name       VARCHAR(100)     NOT NULL,  -- Display name (e.g. "Perera", "Pharmacist", "System")
  text              TEXT             NOT NULL,
  timestamp_display VARCHAR(20)      NOT NULL,  -- Pre-formatted display string e.g. "2:15 PM"
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_order      ON order_messages (order_id);
CREATE INDEX idx_messages_created_at ON order_messages (order_id, created_at ASC);  -- For ordered chat fetch
```

---

### 9.15 — Table: `notifications`

```sql
-- In-app and push notifications delivered to customers.
-- Triggered by order state transitions, quote events, etc.
CREATE TABLE notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id    UUID        REFERENCES orders(id) ON DELETE SET NULL,  -- nullable for SYSTEM notifications
  type        VARCHAR(50) NOT NULL,   -- e.g. PICKUP_READY, QUOTE_RECEIVED, ORDER_CANCELLED
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_customer      ON notifications (customer_id);
CREATE INDEX idx_notifications_customer_read ON notifications (customer_id, read);  -- For unread count
CREATE INDEX idx_notifications_created_at    ON notifications (customer_id, created_at DESC);
```

---

### 9.16 — Table: `order_ratings`

```sql
-- Star rating left by customer after order completion.
-- One rating per order (enforced by unique constraint).
CREATE TABLE order_ratings (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID      NOT NULL REFERENCES customers(id),
  pharmacy_id UUID      NOT NULL REFERENCES pharmacies(id),
  rating      SMALLINT  NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_rating_per_order UNIQUE (order_id)  -- One rating per order only
);

CREATE INDEX idx_ratings_pharmacy ON order_ratings (pharmacy_id);  -- For computing pharmacy avg rating

-- Trigger: update pharmacy.rating and rating_count after each new rating
CREATE OR REPLACE FUNCTION update_pharmacy_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pharmacies
  SET
    rating       = (SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM order_ratings WHERE pharmacy_id = NEW.pharmacy_id),
    rating_count = (SELECT COUNT(*) FROM order_ratings WHERE pharmacy_id = NEW.pharmacy_id)
  WHERE id = NEW.pharmacy_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_pharmacy_rating
  AFTER INSERT OR UPDATE ON order_ratings
  FOR EACH ROW EXECUTE FUNCTION update_pharmacy_rating();
```

---

### 9.17 — Table: `issues`

```sql
-- Customer disputes raised against a completed order.
-- One issue per order (enforced by unique constraint).
-- evidence_file_keys stores the cloud storage keys for evidence photos.
CREATE TABLE issues (
  id                   UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID               NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id          UUID               NOT NULL REFERENCES customers(id),
  issue_type           VARCHAR(100)       NOT NULL,
  -- Allowed values: 'Missing medicine' | 'Wrong medicine' | 'Damaged / Expired' | 'Wrong quantity' | 'Other'
  description          TEXT               NOT NULL,
  evidence_file_keys   JSONB              NOT NULL DEFAULT '[]',  -- Array of cloud storage keys
  status               issue_status_enum  NOT NULL DEFAULT 'OPEN',
  resolution           TEXT,              -- Set by platform moderator when RESOLVED or REJECTED
  created_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_issue_per_order UNIQUE (order_id)  -- One active issue per order
);

CREATE INDEX idx_issues_customer ON issues (customer_id);
CREATE INDEX idx_issues_status   ON issues (status);

CREATE TRIGGER trg_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 9.18 — Table: `health_tips`

```sql
-- Health and wellness articles displayed on the Health Tips screen.
-- Managed by admin. Only `is_published = true` records are returned to customers.
CREATE TABLE health_tips (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(300) NOT NULL,
  category       VARCHAR(100) NOT NULL,  -- e.g. 'Immunity', 'Skincare', 'Mental Health', 'First Aid'
  preview_text   TEXT        NOT NULL,   -- Short excerpt shown on the list screen
  body_text      TEXT        NOT NULL,   -- Full article markdown/plain text shown on detail screen
  image_url      TEXT,
  published_at   DATE,                   -- Display date (may differ from created_at)
  read_time_mins SMALLINT    NOT NULL DEFAULT 3,
  is_published   BOOLEAN     NOT NULL DEFAULT FALSE,  -- Only TRUE records sent to customers
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_tips_published  ON health_tips (is_published, published_at DESC);
CREATE INDEX idx_health_tips_category  ON health_tips (category);

CREATE TRIGGER trg_health_tips_updated_at
  BEFORE UPDATE ON health_tips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 9.19 — Full Entity Relationship Diagram

```
customers
  │
  ├──< refresh_tokens
  ├──< otp_requests          (phone_number, not FK)
  ├──< customer_pharmacy_favorites >── pharmacies
  │
  ├──< prescriptions
  │
  └──< orders ──────────────────────── pharmacies
          │
          ├──< order_items ───────── medicines
          │                               │
          │                    pharmacy_inventory
          │                        (pharmacy_id, medicine_id)
          ├──< quotes
          │       └──< quote_items
          │
          ├──< payments
          ├──< order_messages
          ├──< notifications
          ├──< order_ratings
          └──< issues
```

---

### 9.20 — Table Creation Order (Dependency Order)

Run migrations in exactly this sequence to avoid foreign-key errors:

```
1.  customers
2.  refresh_tokens
3.  otp_requests
4.  pharmacies
5.  customer_pharmacy_favorites
6.  medicines
7.  pharmacy_inventory
8.  prescriptions
9.  orders
10. order_items
11. quotes
12. quote_items
13. payments
14. order_messages
15. notifications
16. order_ratings
17. issues
18. health_tips
```

---

## 10. API Priority Build List

To support the immediate frontend integration, the backend team should build the APIs in the following priority order:

### Priority 0 (Blockers for any user flow)
1. **A1 Auth** — `POST /auth/otp/request` and `POST /auth/otp/verify` (Required to login and get JWT)
2. **A2 Users** — `GET /users/me` (Required for profile and permissions)
3. **A3 Pharmacies** — `GET /pharmacies` (Required for Home Screen and Browse)

### Priority 1 (Core E-commerce flow)
4. **A4 Medicines** — `GET /medicines` (Required for browsing and cart)
5. **A5 Orders** — `POST /orders` (OTC orders) and `GET /orders`
6. **A6 Prescriptions** — Upload URLs and endpoints to integrate with the pre-built AI validation

### Priority 2 (Fulfilment & Quotes)
7. **A7 Quotes** — `GET /quotes/current`, Accept/Decline (Required for prescription lifecycle)
8. **A8 Payments** — Payment intents for online payments

### Priority 3 (Secondary Features)
9. **A9 Messages (Chat)** — Real-time or polling chat integration
10. **A10 Notifications** — Push notifications and listing
11. **A11 Health Tips** — Read-only endpoints for content
12. **A12 Issues** — Reporting and dispute resolution

---

*MediPick REST API Specification v3.0*
*Audit-corrected against source code · 2026-08-17*
