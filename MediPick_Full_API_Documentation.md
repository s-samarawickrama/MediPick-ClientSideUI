# MediPick Full API Documentation

## 1. Document purpose

This is the actual implementation document for the current MediPick customer-side app.

This is not a generic pharmacy API draft. It reflects what is currently built in this repository:

- a React Native Expo frontend
- a FastAPI backend mock API layer
- a typed frontend service layer
- mock data separated from route logic
- customer flows aligned to the current app screens

This project is currently in a frontend-ready mock API state. It is not yet a live production database-backed backend.

---

## 2. Current implementation status

### What is built right now

The backend has a real FastAPI app with the following route groups registered in [backend/app/api/v1/router.py](backend/app/api/v1/router.py):

- auth
- pharmacies
- products
- users
- prescriptions
- orders
- quotes
- pickup
- chat
- notifications
- issues
- payments

The mock payloads are centralized in [backend/app/mock_data.py](backend/app/mock_data.py) so the route layer stays clean and is easy to replace with a real database layer later.

### Current architecture

Frontend:
- raw HTTP wrappers under [src/api](src/api)
- domain service layer under [src/services](src/services)
- validation helpers under [src/utils](src/utils)

Backend:
- API routes under [backend/app/api/v1](backend/app/api/v1)
- shared mock data under [backend/app/mock_data.py](backend/app/mock_data.py)
- app entry under [backend/app/main.py](backend/app/main.py)

### Important reality check

This current version is designed to:
- match the app screen flows
- support frontend integration before real backend development
- provide realistic response structure for UI implementation
- be replaced with a real persistence layer later without changing the app contract

It is not yet a permanent production database implementation.

---

## 3. Base configuration

### Base URL

```text
http://127.0.0.1:8000/api/v1
```

### Production-style base URL (for contract planning)

```text
https://api.medipick.lk/api/v1
```

### Authentication header

```http
Authorization: Bearer <access_token>
```

---

## 4. Response format

### Success response

```json
{
  "success": true,
  "data": {
    "id": "usr_001"
  }
}
```

### List response

```json
{
  "success": true,
  "data": [
    { "id": "ord_xyz" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Error response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "Invalid or expired OTP.",
    "fields": {
      "otp": "OTP is required"
    }
  }
}
```

---

## 5. API endpoint map

The app currently implements these endpoints.

### 5.1 Authentication

#### POST /auth/otp/request
Purpose: request OTP for phone login.

Request body:

```json
{
  "phoneNumber": "0771234567",
  "surname": "Perera",
  "email": "perera@gmail.com"
}
```

Current backend behavior:

```json
{
  "message": "OTP sent to customer phone",
  "expiresIn": 300
}
```

#### POST /auth/otp/verify
Purpose: verify OTP and return user tokens.

Request body:

```json
{
  "phoneNumber": "0771234567",
  "otp": "123456"
}
```

Current response shape:

```json
{
  "accessToken": "demo-access-token",
  "refreshToken": "demo-refresh-token",
  "user": {
    "id": "usr_001",
    "phoneNumber": "+94771234567",
    "surname": "Perera",
    "email": "perera@gmail.com",
    "isVerified": true,
    "strikes": 0
  }
}
```

#### POST /auth/otp/resend
Purpose: resend OTP.

#### POST /auth/logout
Purpose: log out current customer.

Response:

```json
{ "success": true }
```

---

### 5.2 Users and profile

#### GET /users/me
Purpose: fetch current customer profile.

Current response:

```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "phoneNumber": "+94771234567",
    "surname": "Perera",
    "email": "perera@gmail.com",
    "isVerified": true,
    "strikes": 1,
    "pushNotificationsEnabled": true,
    "emailReceiptsEnabled": true,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

#### PATCH /users/me
Purpose: update profile details such as name or email.

#### PATCH /users/me/preferences
Purpose: update notification preferences.

Current example response:

```json
{
  "success": true,
  "data": {
    "pushNotificationsEnabled": true,
    "emailReceiptsEnabled": false
  }
}
```

#### PATCH /users/me/phone
Purpose: update phone number.

#### POST /users/me/phone/verify
Purpose: verify a newly changed phone number.

#### POST /users/me/push-token
Purpose: save push token for notifications.

---

### 5.3 Pharmacies

#### GET /pharmacies
Purpose: fetch pharmacy list.

Returns list of pharmacies with open status and favorite flag.

Example:

```json
{
  "success": true,
  "data": [
    {
      "id": "ph_1",
      "name": "MediCare Central Pharmacy",
      "address": "124 Galle Road, Colombo 03",
      "distance": "0.8 km",
      "rating": 4.9,
      "isOpen": true,
      "isFavorite": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### GET /pharmacies/{pharmacy_id}
Purpose: fetch one pharmacy detail.

#### POST /pharmacies/{pharmacy_id}/favorites
Purpose: add pharmacy to favorites.

Returns:

```json
{
  "success": true,
  "data": {
    "favoriteId": "fav_123"
  }
}
```

#### DELETE /pharmacies/{pharmacy_id}/favorites/{favorite_id}
Purpose: remove pharmacy from favorites.

---

### 5.4 Products

#### GET /products
Purpose: list available OTC products.

Current response:

```json
{
  "success": true,
  "data": [
    {
      "id": "med_1",
      "name": "Paracetamol 500mg",
      "category": "Cold & Flu",
      "isRxRequired": false,
      "inStock": true,
      "mrpPrice": 120.0,
      "pharmacyPrice": 100.0
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### GET /products/{product_id}
Purpose: fetch one product detail.

---

### 5.5 Prescriptions

#### POST /prescriptions
Purpose: upload prescription for AI quality check.

Current implementation returns a mock prescription result.

Example response:

```json
{
  "success": true,
  "data": {
    "prescriptionId": "presc_abc123",
    "clarityScore": 88,
    "status": "PENDING_REVIEW",
    "checks": {
      "clarity": {
        "score": 88,
        "max": 100,
        "passed": true
      }
    }
  }
}
```

#### GET /prescriptions/{prescription_id}
Purpose: fetch prescription detail.

Example:

```json
{
  "success": true,
  "data": {
    "id": "presc_abc123",
    "status": "APPROVED",
    "clarityScore": 88,
    "targetPharmacyId": "ph_1"
  }
}
```

#### GET /prescriptions/{prescription_id}/status
Purpose: check prescription validation status.

Example:

```json
{
  "success": true,
  "data": {
    "prescriptionId": "presc_abc123",
    "status": "APPROVED",
    "clarityScore": 88
  }
}
```

---

### 5.6 Orders

#### POST /orders
Purpose: create an order.

Request example:

```json
{
  "orderType": "OTC",
  "pharmacyId": "ph_1",
  "paymentMethod": "PAY_AT_COUNTER",
  "items": [
    {
      "productId": "med_1",
      "quantity": 2
    }
  ]
}
```

Current response:

```json
{
  "id": "ord_xyz",
  "orderNumber": "#MP827341",
  "orderType": "OTC",
  "state": "WAITING_PHARMACY_CONFIRMATION",
  "totalAmount": 750.0,
  "totalMrp": 870.0,
  "isPaid": false,
  "paymentMethod": "PAY_AT_COUNTER",
  "createdAt": "2026-08-12T01:00:00Z",
  "pharmacyId": "ph_1",
  "items": [
    {
      "productId": "med_1",
      "quantity": 2
    }
  ]
}
```

#### GET /orders
Purpose: list customer orders.

#### GET /orders/{order_id}
Purpose: fetch order detail.

#### POST /orders/{order_id}/cancel
Purpose: cancel an order.

Current response:

```json
{
  "id": "ord_xyz",
  "state": "CANCELLED",
  "strikeAdded": true,
  "customerStrikes": 2
}
```

#### POST /orders/{order_id}/rating
Purpose: submit order rating.

#### POST /orders/{order_id}/reorder
This is planned but not currently implemented in the mock backend routes.

---

### 5.7 Quotes

#### GET /orders/{order_id}/quote
Purpose: fetch the pharmacy quote for an order.

Current response:

```json
{
  "success": true,
  "data": {
    "orderId": "ord_xyz",
    "pharmacyId": "ph_1",
    "pharmacyName": "MediCare Central Pharmacy",
    "items": [
      {
        "medicineName": "Amoxicillin 500mg",
        "mrp": 450.0,
        "quotedPrice": 400.0,
        "quantity": 10,
        "isAlternative": false
      }
    ],
    "totalAmount": 500.0,
    "totalMrp": 570.0,
    "validUntil": "2026-08-13T01:00:00Z"
  }
}
```

#### POST /orders/{order_id}/quote/accept
Purpose: accept quote.

Current response:

```json
{
  "success": true,
  "data": {
    "id": "ord_xyz",
    "state": "PREPARING"
  }
}
```

#### POST /orders/{order_id}/quote/decline
Purpose: reject quote.

Current response:

```json
{
  "success": true,
  "data": {
    "id": "ord_xyz",
    "state": "REJECTED"
  }
}
```

---

### 5.8 Pickup flow

#### GET /orders/{order_id}/pickup
Purpose: get pickup OTP and pickup details when order is ready.

Current response:

```json
{
  "success": true,
  "data": {
    "orderId": "ord_xyz",
    "state": "READY_FOR_PICKUP",
    "pickupOtp": "849201",
    "pickupDeadline": "2026-08-13T18:00:00Z",
    "pharmacy": {
      "id": "ph_1",
      "name": "MediCare Central Pharmacy",
      "address": "124 Galle Road, Colombo 03"
    }
  }
}
```

#### POST /orders/{order_id}/pickup/extend
Purpose: request pickup extension.

Current response:

```json
{
  "success": true,
  "data": {
    "orderId": "ord_xyz",
    "pickupDeadline": "2026-08-14T18:00:00Z"
  }
}
```

---

### 5.9 Chat

#### GET /orders/{order_id}/messages
Purpose: fetch order chat history.

Current response:

```json
{
  "success": true,
  "data": [
    {
      "id": "msg_001",
      "orderId": "ord_xyz",
      "senderRole": "PHARMACIST",
      "senderName": "Pharmacist",
      "text": "Your order is ready at counter 2.",
      "timestamp": "2026-08-12T14:10:00Z"
    }
  ]
}
```

#### POST /orders/{order_id}/messages
Purpose: send a chat message.

Current response:

```json
{
  "success": true,
  "data": {
    "id": "msg_002",
    "orderId": "ord_xyz",
    "senderRole": "CUSTOMER",
    "text": "Thank you! Can I collect around 5:30 PM?"
  }
}
```

---

### 5.10 Notifications

#### GET /notifications
Purpose: fetch customer notifications.

Current response:

```json
{
  "success": true,
  "data": [
    {
      "id": "notif_001",
      "title": "Quote Ready",
      "body": "MediCare Central has sent you a quote. Tap to review.",
      "type": "QUOTATION_READY",
      "orderId": "ord_xyz",
      "isRead": false,
      "createdAt": "2026-08-12T14:00:00Z"
    }
  ]
}
```

#### PATCH /notifications/{notification_id}
Purpose: mark notification as read.

Current response:

```json
{
  "success": true,
  "data": {
    "id": "notif_001",
    "isRead": true
  }
}
```

---

### 5.11 Issues

#### POST /orders/{order_id}/issues
This route is implemented in the app’s support flow and returns a mock issue record.

Current response:

```json
{
  "success": true,
  "data": {
    "id": "issue_001",
    "orderId": "ord_xyz",
    "status": "ISSUE_REPORTED"
  }
}
```

---

### 5.12 Payments

#### POST /payments/intents
Purpose: generate a payment intent for checkout.

Current response:

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_..._secret_..."
  }
}
```

---

## 6. Current domain data models

### User

```json
{
  "id": "usr_001",
  "phoneNumber": "+94771234567",
  "surname": "Perera",
  "email": "perera@gmail.com",
  "isVerified": true,
  "strikes": 0
}
```

### Pharmacy

```json
{
  "id": "ph_1",
  "name": "MediCare Central Pharmacy",
  "address": "124 Galle Road, Colombo 03",
  "distance": "0.8 km",
  "rating": 4.9,
  "isOpen": true,
  "isFavorite": true
}
```

### Order summary

```json
{
  "id": "ord_xyz",
  "orderNumber": "#MP827341",
  "orderType": "OTC",
  "state": "WAITING_CUSTOMER_CONFIRMATION",
  "totalAmount": 750.0,
  "totalMrp": 870.0,
  "isPaid": false,
  "paymentMethod": "PAY_AT_COUNTER",
  "createdAt": "2026-08-12T01:00:00Z"
}
```

### Quote

```json
{
  "orderId": "ord_xyz",
  "pharmacyId": "ph_1",
  "pharmacyName": "MediCare Central Pharmacy",
  "totalAmount": 500.0,
  "totalMrp": 570.0,
  "validUntil": "2026-08-13T01:00:00Z"
}
```

### Prescription result

```json
{
  "prescriptionId": "presc_abc123",
  "clarityScore": 88,
  "status": "APPROVED"
}
```

---

## 7. Actual business rules represented in the app

These are the rules represented by the current implementation:

1. Customers can browse pharmacies and products.
2. OTC products can be ordered directly.
3. Prescription uploads require AI quality review.
4. A pharmacy quote is accepted or declined by the customer.
5. Orders move through pickup states.
6. Customers can chat with the pharmacy about the order.
7. Notifications are order and quote related.
8. Customer strikes are tracked on the user profile.
9. Pickup-only flow is used for the current app design.
10. All data is currently mock-backed in the backend.

---

## 8. What is mocked vs real

### Mocked currently

The backend is using mock data for:
- auth users and tokens
- pharmacy details and lists
- products
- prescriptions
- orders
- quotes
- pickup data
- chat messages
- notifications
- issue records
- payment intent values

### Real currently

The following are real in this repository:
- FastAPI app structure
- endpoint registration
- request/response contract patterns
- frontend API wrappers and services
- TypeScript typing and validation layer
- mock integration ready for future backend replacement

### Not yet implemented

The following do not exist as real DB-backed business logic yet:
- persistent database
- JWT/session storage
- real payment gateway integration
- real prescription AI pipeline
- production notification backend
- live pharmacy inventory integration
- persistent order history and real chat persistence

---

## 9. Frontend service layer pattern

The app uses a clean frontend pattern:

- [src/api](src/api): raw network clients
- [src/services](src/services): business operations
- [src/utils](src/utils): value formatting and validation

This separation keeps the app clean and makes future backend migration simple.

Example:

```ts
import { authService } from './services';

const result = await authService.requestOtp({
  phoneNumber: '0771234567',
  surname: 'Perera',
  email: 'perera@gmail.com',
});
```

---

## 10. Phone validation and masking

The app includes a Sri Lanka phone number utility in [src/utils/phone.ts](src/utils/phone.ts).

Supported behaviors:
- normalize phone values
- format to local UI-friendly style
- mask sensitive digits for display
- validate Sri Lankan mobile formats

Example validation rules:
- `0771234567` valid
- `+94771234567` valid
- `009471234567` normalized to `+94771234567` when needed

---

## 11. Recommended next step

The correct next implementation evolution is:

1. Keep this API contract as the frontend contract.
2. Replace the mock data layer with real database and service logic.
3. Keep the same endpoint names and payload shapes.
4. Maintain the frontend service contract without UI breakage.

This ensures the app can move from mock-ready to production without changing the client code drastically.

---

## 12. Summary

The current repository already contains the full customer-side API surface needed for the MediPick frontend flow.

The actual state is:
- complete frontend-ready API contract
- real FastAPI route structure
- mock data layer for realistic behavior
- typed frontend API and service integration
- production-style separation of concerns

This is the correct current baseline for the app, and it is ready to evolve into a real backend when the database and service layer are built.
