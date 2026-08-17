# MediPick API Documentation

## 1. Overview

This document defines the actual customer-facing API contract implemented for the current MediPick frontend and mock backend. It is intentionally written as a production-style design document for engineering, product, and client review.

### Live Swagger documentation

- Swagger UI: http://127.0.0.1:8000/docs
- OpenAPI schema: http://127.0.0.1:8000/openapi.json

The purpose of this contract is to describe:

- the app domain and user flows
- the naming conventions used across the API
- all implemented routes for the customer app
- the current mock data model and expected payload structure
- the contract boundary that remains stable when the backend is replaced by a live database-backed implementation

This is a frontend-first API design for the customer experience, not an admin or legacy backend surface.

---

## 2. Product scope

This API supports the MediPick customer journey for:

- registration and OTP authentication
- browsing pharmacies and products
- viewing prescriptions and quote approvals
- confirming or declining quotation offers
- tracking order pickup and delivery state
- chat with pharmacist
- receiving notifications
- reporting service issues
- payment intent creation for online checkout
- customer profile and preference management

This is the current app-facing scope and does not include distributor, admin, pharmacy staff dashboards, or enterprise management features.

---

## 3. Architecture and current implementation status

### 3.1 Current architecture

The repository currently contains:

- React Native Expo client in the frontend application
- FastAPI mock backend under backend/app
- route modules under backend/app/api/v1
- centralized mock data under backend/app/mock_data.py
- typed API wrappers in src/api
- service-layer abstraction in src/services

### 3.2 Scope declaration

This API is currently in a mock-backed contract stage. It is designed to behave like a real production API from the frontend perspective while remaining replaceable with a real database-driven backend later.

The contract is intentionally clean and stable. The goal is that the frontend should not need to change when the persistence layer is migrated from mock data to real services.

### 3.3 Route groups implemented

The current backend registers the following route groups:

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

This is the active customer API surface for the app as implemented today.

---

## 4. API design principles

The naming and structure follow a clean REST-style customer API model.

### 4.1 Resource naming conventions

- Use plural nouns for collection resources: /pharmacies, /products, /orders
- Use resource IDs in path variables: /orders/{order_id}
- Use nested routes for child resources under their parent: /orders/{order_id}/quote, /orders/{order_id}/messages
- Use action-oriented subresources only for explicit workflow transitions such as accept, decline, cancel, extend, verify
- Avoid legacy or broad naming patterns that do not match the product domain

### 4.2 URL style

The API uses resource-first URLs, not function-heavy or UI-driven names.

Examples:

- /users/me instead of /profile
- /orders/{order_id}/quote instead of /order_quote
- /orders/{order_id}/pickup instead of /pickup_order_details
- /auth/otp/verify instead of /verifyOtp

### 4.3 Response structure

The application uses a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

For single resource response:

```json
{
  "success": true,
  "data": {
    "id": "usr_001"
  }
}
```

For list response:

```json
{
  "success": true,
  "data": [
    { "id": "ord_001" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

For error response:

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

## 5. Base configuration

### 5.1 Local development

```text
http://127.0.0.1:8000/api/v1
```

### 5.2 Planned production host

```text
https://api.medipick.lk/api/v1
```

### 5.3 Authentication

```http
Authorization: Bearer <access_token>
```

The app currently uses a mock access token flow and expects authenticated customer requests in the same format as a real production client.

---

## 6. Screen-by-screen data mapping

This project is a frontend-first customer app. Each screen consumes a specific subset of the API contract. The table below shows the actual data that each screen expects and where it comes from.

| Screen | Primary route / params | API data consumed | Main fields used |
|---|---|---|---|
| LoginScreen | /auth/otp/request, /auth/otp/verify | Authentication flow | phoneNumber, surname, email, accessToken, refreshToken, user.id |
| OTPScreen | route.params.phone | OTP verification | phone, otp, user.id, isVerified, strikes |
| HomeScreen | /pharmacies, /orders | pharmacy list and active order summary | pharmacy.id, pharmacy.name, pharmacy.distance, order.id, order.state |
| BrowseOTCScreen | /products, /pharmacies | product catalog and selected store | product.id, product.name, product.mrpPrice, pharmacy.id, pharmacy.name |
| UploadPrescriptionScreen | /prescriptions, /pharmacies/{id} | prescription upload + target pharmacy data | pharmacyId, pharmacyName, prescriptionId, clarityScore |
| AIQualityCheckScreen | /prescriptions/{id}/status | AI prescription check result | prescriptionId, clarityScore, pharmacyId, pharmacyName |
| MultiStoreCartScreen | /orders | checkout cart and selected items | pharmacy.id, medicine.id, quantity, price, totalAmount, totalMrp |
| QuotationScreen | /orders/{order_id}/quote | quote review and savings | orderId, pharmacy.id, pharmacy.name, items[], totalAmount, totalMrp, validUntil |
| ReadyForPickupScreen | /orders/{order_id}/pickup | pickup state and OTP | orderId, pickupOtp, pickupDeadline, pharmacy.name, paymentMethod, isPaid |
| OrdersScreen | /orders | order history and status list | order.id, order.orderNumber, order.state, totalAmount, createdAt |
| OrderDetailsScreen | /orders/{order_id} | detailed order info | order.id, order.items[], order.pharmacy, order.state, pickupOtp, rejectReason |
| PharmacyChatScreen | /orders/{order_id}/messages | chat history and order context | orderId, senderRole, senderName, text, timestamp |
| NotificationsScreen | /notifications | customer alerts | notification.id, title, body, type, isRead, orderId |
| ReportIssueScreen | /orders/{order_id}/issues | issue reporting | orderId, category, message, issue status |
| ProfileScreen | /users/me | authenticated user and preferences | user.id, phoneNumber, surname, email, strikes, pushNotificationsEnabled |
| FavoritesScreen | /pharmacies + favorites endpoints | saved pharmacy list | pharmacy.id, pharmacy.name, isFavorite |
| LegalDocScreen | static docs | policy/legal data | doc type, content/title metadata |

### 6.0.1 Shared IDs and common data model

The following identifiers appear across multiple screens and are the primary contract fields for customer flows:

- user.id — authenticated customer ID
- phoneNumber — customer mobile number
- order.id — a unique order identifier
- order.orderNumber — human-friendly order reference such as #MP123456
- pharmacy.id — pharmacy identifier referenced by orders, products, and quotes
- medicine.id — product/medicine identifier for order items and cart selection
- prescriptionId — prescription record ID for AI validation and tracking
- notification.id — alert ID used for read/update actions
- issue.id — issue case reference created after problem reporting

### 6.0.2 Common field catalog used by screens

#### Customer user model

```json
{
  "id": "usr_001",
  "phoneNumber": "+94771234567",
  "surname": "Perera",
  "email": "perera@gmail.com",
  "isVerified": true,
  "strikes": 0,
  "pushNotificationsEnabled": true,
  "emailReceiptsEnabled": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

#### Pharmacy model

```json
{
  "id": "ph_1",
  "name": "MediCare Central Pharmacy",
  "address": "124 Galle Road, Colombo 03",
  "distance": "0.8 km",
  "rating": 4.9,
  "isOpen": true,
  "isFavorite": true,
  "image": "pharmacy-image-url-or-local-asset"
}
```

#### Order model

```json
{
  "id": "ord_xyz",
  "orderNumber": "#MP827341",
  "orderType": "OTC",
  "state": "WAITING_CUSTOMER_CONFIRMATION",
  "pharmacy": {
    "id": "ph_1",
    "name": "MediCare Central Pharmacy"
  },
  "items": [
    {
      "medicine": {
        "id": "med_1",
        "name": "Paracetamol 500mg",
        "mrpPrice": 120,
        "pharmacyPrice": 100
      },
      "quantity": 2,
      "price": 100
    }
  ],
  "totalAmount": 750,
  "totalMrp": 870,
  "paymentMethod": "PAY_AT_COUNTER",
  "isPaid": false,
  "pickupOtp": "849201",
  "pickupDeadline": "2026-08-13T18:00:00Z",
  "createdAt": "2026-08-12T01:00:00Z"
}
```

#### Quote model

```json
{
  "orderId": "ord_xyz",
  "pharmacyId": "ph_1",
  "pharmacyName": "MediCare Central Pharmacy",
  "items": [
    {
      "medicineName": "Amoxicillin 500mg",
      "mrp": 450,
      "quotedPrice": 400,
      "quantity": 10,
      "isAlternative": false
    }
  ],
  "totalAmount": 500,
  "totalMrp": 570,
  "validUntil": "2026-08-13T01:00:00Z"
}
```

#### Notification model

```json
{
  "id": "notif_001",
  "title": "Quote Ready",
  "body": "MediCare Central has sent you a quote. Tap to review.",
  "type": "QUOTATION_READY",
  "orderId": "ord_xyz",
  "isRead": false,
  "createdAt": "2026-08-12T14:00:00Z"
}
```

### 6.0.3 Which data is definitely tied to a screen

- Login / OTP screens: customer phone, OTP result, auth token, user profile
- Home / pharmacy list screens: pharmacy list, favorite state, active orders
- Product / cart screens: medicines, prices, selected pharmacy, cart totals
- Prescription screens: prescription image metadata, AI clarity score, selected pharmacy context
- Quote screen: pharmacy quote, total savings, order state, validUntil time
- Pickup screen: pickup OTP, pickup deadline, pharmacy details, payment state
- Chat screen: orderId, message history, sender roles, timestamps
- Orders screen: order summary list, status, order numbers, amount, createdAt
- Profile screen: user details, phone info, preferences, strike count
- Notifications screen: alert list and read-state

This is the practical data contract that the current frontend app actually uses.

---

## 7. Endpoint inventory

### 6.0 Quick reference matrix

The table below matches the actual routes implemented in the current FastAPI app under backend/app/api/v1 and is the source of truth for the frontend contract.

| Method | Route | Purpose | Notes |
|---|---|---|---|
| 🔵 POST | /auth/otp/request | Request OTP | Auth entry point |
| 🔵 POST | /auth/otp/verify | Verify OTP and sign in | Returns token pair |
| 🔵 POST | /auth/otp/resend | Resend OTP | Same auth flow |
| 🔵 POST | /auth/logout | Log out current session | Session cleanup |
| 🟢 GET | /users/me | Get profile | Current customer record |
| 🟠 PATCH | /users/me | Update profile | Name/email updates |
| 🟠 PATCH | /users/me/preferences | Update preferences | Notification toggles |
| 🟠 PATCH | /users/me/phone | Update phone | Change contact number |
| 🔵 POST | /users/me/phone/verify | Verify updated phone | OTP validation step |
| 🔵 POST | /users/me/push-token | Register device token | Push notification setup |
| 🟢 GET | /pharmacies | List pharmacies | Customer home/search |
| 🟢 GET | /pharmacies/{pharmacy_id} | Get pharmacy detail | Single vendor view |
| 🔵 POST | /pharmacies/{pharmacy_id}/favorites | Add favorite | Favorites action |
| 🔴 DELETE | /pharmacies/{pharmacy_id}/favorites/{favorite_id} | Remove favorite | Favorite removal |
| 🟢 GET | /products | List products | Catalog browsing |
| 🟢 GET | /products/{product_id} | Get product detail | Item detail |
| 🔵 POST | /prescriptions | Create prescription | Upload/submit Rx |
| 🟢 GET | /prescriptions/{prescription_id} | Get prescription detail | prescription record |
| 🟢 GET | /prescriptions/{prescription_id}/status | Check prescription status | AI/pharmacy validation |
| 🔵 POST | /orders | Create order | Checkout/planning |
| 🟢 GET | /orders | List orders | Order history |
| 🟢 GET | /orders/{order_id} | Get order detail | Full order view |
| 🔵 POST | /orders/{order_id}/cancel | Cancel order | Cancel active order |
| 🔵 POST | /orders/{order_id}/rating | Submit rating | Post-order feedback |
| � POST | /orders/{order_id}/reorder | Recreate an order from a previous order | Planned next-phase feature |
| �🟢 GET | /orders/{order_id}/quote | Get quote | Quotation review |
| 🔵 POST | /orders/{order_id}/quote/accept | Accept quote | Transition to prep |
| 🔵 POST | /orders/{order_id}/quote/decline | Decline quote | Reject quote |
| 🟢 GET | /orders/{order_id}/pickup | Get pickup details | OTP + counter status |
| 🔵 POST | /orders/{order_id}/pickup/extend | Extend pickup time | Pickup window action |
| 🟢 GET | /orders/{order_id}/messages | Get chat messages | Conversation history |
| 🔵 POST | /orders/{order_id}/messages | Send message | Message customer/pharmacist |
| 🟢 GET | /notifications | Get notifications | App alerts |
| 🟠 PATCH | /notifications/{notification_id} | Mark read | Notification state update |
| 🔵 POST | /orders/{order_id}/issues | Report issue | Customer support |
| 🔵 POST | /payments/intents | Create pay intent | Stripe/online payment |

> Method coloring key: 🟢 GET, 🔵 POST, 🟠 PATCH, 🔴 DELETE

The following routes are the real implemented interface for the current application.

### 6.1 Authentication

#### POST /auth/otp/request
Description: Request an OTP for phone-number-based customer authentication.

Request body:

```json
{
  "phoneNumber": "0771234567",
  "surname": "Perera",
  "email": "perera@gmail.com"
}
```

Success response:

```json
{
  "message": "OTP sent to customer phone",
  "expiresIn": 300
}
```

Notes:
- This is a frontend-aligned mock contract.
- In production, this should trigger SMS dispatch through a provider such as Twilio or a local telecom gateway.

#### POST /auth/otp/verify
Description: Validate OTP and return the authenticated user plus token pair.

Request body:

```json
{
  "phoneNumber": "0771234567",
  "otp": "123456"
}
```

Success response:

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
Description: Resend OTP for the same phone number.

Request body:

```json
{
  "phoneNumber": "0771234567",
  "surname": "Perera",
  "email": "perera@gmail.com"
}
```

Success response:

```json
{
  "message": "OTP resent successfully",
  "expiresIn": 300
}
```

#### POST /auth/logout
Description: Invalidate the current session.

Success response:

```json
{
  "success": true
}
```

---

### 6.2 Users and profile

#### GET /users/me
Description: Get the current authenticated user profile.

Success response:

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
Description: Update the current user's basic account information.

Typical request:

```json
{
  "surname": "Perera",
  "email": "new@email.com"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "surname": "Perera",
    "email": "new@email.com"
  }
}
```

#### PATCH /users/me/preferences
Description: Update communication preferences.

Request body:

```json
{
  "pushNotificationsEnabled": true,
  "emailReceiptsEnabled": false
}
```

Success response:

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
Description: Update the current phone number.

Success response:

```json
{
  "success": true,
  "data": {
    "message": "Phone number updated"
  }
}
```

#### POST /users/me/phone/verify
Description: Verify a user phone number after update.

Success response:

```json
{
  "success": true,
  "data": {
    "message": "Phone number verified"
  }
}
```

#### POST /users/me/push-token
Description: Register a device push token used for notifications.

Request body:

```json
{
  "token": "device_push_token_here"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "message": "Push token saved"
  }
}
```

---

### 6.3 Pharmacies

#### GET /pharmacies
Description: Return a list of available pharmacies for the customer.

Success response:

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
Description: Fetch pharmacy details for a single pharmacy.

Success response:

```json
{
  "success": true,
  "data": {
    "id": "ph_1",
    "name": "MediCare Central Pharmacy",
    "address": "124 Galle Road, Colombo 03",
    "distance": "0.8 km",
    "rating": 4.9,
    "isOpen": true,
    "isFavorite": true
  }
}
```

#### POST /pharmacies/{pharmacy_id}/favorites
Description: Add a pharmacy to the customer's favorites list.

Success response:

```json
{
  "success": true,
  "data": {
    "favoriteId": "fav_123"
  }
}
```

#### DELETE /pharmacies/{pharmacy_id}/favorites/{favorite_id}
Description: Remove a pharmacy from the favorites list.

Success response:

```json
{
  "success": true
}
```

---

### 6.4 Products

#### GET /products
Description: List products available from pharmacies.

Success response:

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
      "mrpPrice": 120,
      "pharmacyPrice": 100
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
Description: Return one product detail record.

Success response:

```json
{
  "success": true,
  "data": {
    "id": "med_1",
    "name": "Paracetamol 500mg",
    "category": "Cold & Flu",
    "isRxRequired": false,
    "inStock": true,
    "mrpPrice": 120,
    "pharmacyPrice": 100
  }
}
```

---

### 6.5 Prescriptions

#### POST /prescriptions
Description: Create a prescription upload / submission record.

Success response:

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
Description: Fetch a single prescription record.

Success response:

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
Description: Retrieve the current AI or pharmacy review status for a prescription.

Success response:

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

### 6.6 Orders

#### POST /orders
Description: Create a new customer order.

Request body:

```json
{
  "orderType": "OTC",
  "pharmacyId": "ph_1",
  "paymentMethod": "PAY_AT_COUNTER",
  "items": [
    {
      "medicineId": "med_1",
      "quantity": 2
    }
  ]
}
```

Success response:

```json
{
  "id": "ord_xyz",
  "orderNumber": "#MP827341",
  "orderType": "OTC",
  "state": "WAITING_PHARMACY_CONFIRMATION",
  "totalAmount": 750,
  "totalMrp": 870,
  "isPaid": false,
  "paymentMethod": "PAY_AT_COUNTER",
  "createdAt": "2026-08-12T01:00:00Z",
  "pharmacyId": "phm_101"
}
```

#### GET /orders
Description: Return the customer's order history.

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": "ord_xyz",
      "orderNumber": "#MP827341",
      "orderType": "OTC",
      "state": "WAITING_CUSTOMER_CONFIRMATION",
      "totalAmount": 750,
      "totalMrp": 870,
      "isPaid": false,
      "paymentMethod": "PAY_AT_COUNTER",
      "createdAt": "2026-08-12T01:00:00Z"
    }
  ]
}
```

#### GET /orders/{order_id}
Description: Fetch detailed order data for a single order.

Success response:

```json
{
  "id": "ord_xyz",
  "orderNumber": "#MP827341",
  "orderType": "OTC",
  "state": "WAITING_CUSTOMER_CONFIRMATION",
  "totalAmount": 750,
  "totalMrp": 870,
  "isPaid": false,
  "paymentMethod": "PAY_AT_COUNTER",
  "createdAt": "2026-08-12T01:00:00Z",
  "pharmacyId": "phm_101",
  "customerNote": "Please call before pickup"
}
```

#### POST /orders/{order_id}/cancel
Description: Cancel an active order.

Success response:

```json
{
  "id": "ord_xyz",
  "state": "CANCELLED",
  "strikeAdded": true,
  "customerStrikes": 2
}
```

#### POST /orders/{order_id}/rating
Description: Submit customer rating after order completion.

Request body:

```json
{
  "rating": 5,
  "comment": "Very fast pickup and kind pharmacy staff."
}
```

Success response:

```json
{
  "id": "ord_xyz",
  "rating": 5
}
```

#### POST /orders/{order_id}/reorder
Description: Recreate a new order from a previous completed order. This is a planned next-phase API and is not yet implemented in the current mock backend.

Optional request body:

```json
{
  "preferredPharmacyId": "ph_1"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "newOrderId": "ord_new_001",
    "sourceOrderId": "ord_xyz",
    "state": "WAITING_PHARMACY_CONFIRMATION"
  }
}
```

---

### 6.7 Quotes

#### GET /orders/{order_id}/quote
Description: Fetch the latest quote from a pharmacy for an order.

Success response:

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
        "mrp": 450,
        "quotedPrice": 400,
        "quantity": 10,
        "isAlternative": false
      }
    ],
    "totalAmount": 500,
    "totalMrp": 570,
    "validUntil": "2026-08-13T01:00:00Z"
  }
}
```

#### POST /orders/{order_id}/quote/accept
Description: Accept the current quote and move the order into preparation state.

Success response:

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
Description: Decline the current quote.

Success response:

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

### 6.8 Pickup

#### GET /orders/{order_id}/pickup
Description: Get pickup details, including the OTP and pickup deadline.

Success response:

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
Description: Request an extension for pickup time.

Success response:

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

### 6.9 Chat messages

#### GET /orders/{order_id}/messages
Description: Fetch chat history between customer and pharmacy for an order.

Success response:

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
Description: Send a new message from the customer to the pharmacy.

Success response:

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

### 6.10 Notifications

#### GET /notifications
Description: Fetch all notifications for the current customer.

Success response:

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
Description: Mark a notification as read.

Success response:

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

### 6.11 Issues

#### POST /orders/{order_id}/issues
Description: Report an issue related to an order or pharmacy interaction.

Request body:

```json
{
  "category": "DELIVERY",
  "message": "The pharmacy did not respond to my pickup question."
}
```

Success response:

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

### 6.12 Payments

#### POST /payments/intents
Description: Create a payment intent for an online payment session.

Success response:

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_..._secret_..."
  }
}
```

---

## 7. Data model notes

The current mock data layer supports realistic customer flows with fields like:

- pharmacy id, name, address, distance, rating, favorite status
- medicine id, name, price, Rx requirement, inventory status
- order id, number, payment method, total amount, order state, created time
- quote item pricing and savings
- pickup OTP and expiry timestamp
- notification type and read status
- prescription clarity and review status

These fields are intentionally shaped to match the screens already implemented in the React Native app and are a stable contract boundary for future backend replacement.

---

## 8. Naming standards used in this project

The current API uses the following naming discipline:

- nouns and resources in lowercase plural form
- snake_case only for internal data properties where needed in backend contracts
- camelCase for JSON field naming in the app-facing API, such as phoneNumber, totalMrp, pickupOtp, createdAt
- resource IDs consistently named as id, pharmacyId, orderId, prescriptionId
- state names in uppercase constant format such as WAITING_CUSTOMER_CONFIRMATION, PREPARING, READY_FOR_PICKUP
- action endpoints for state transitions: accept, decline, cancel, verify, extend, resend

This is consistent with a modern customer-facing API and avoids the confusion of legacy backend names or admin-only surface naming.

---

## 9. Current product reality and boundary

This implementation is valid for the current app and for frontend integration, but it is not the final production persistence layer.

It should be treated as:

- a customer API contract
- a frontend-ready mock backend
- a stable contract layer before production DB implementation

The backend can later be replaced with PostgreSQL, MySQL, MongoDB, or a service-driven architecture without changing the external API contract, as long as the same resource names and payload shape are preserved.

---

## 10. Final statement

This repository currently delivers a production-style customer API contract aligned to the real MediPick frontend flows. It is structured, named, documented, and separated from the mock data layer in a way that is appropriate for a professional client review and for future backend implementation.

The most important principle is that the API is app-aligned and product-specific, not a generic or unrelated admin API surface.

This is the correct contract for the current frontend-first MediPick application.

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
