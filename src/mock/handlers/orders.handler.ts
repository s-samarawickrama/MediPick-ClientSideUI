/**
 * MediPick Mock Engine — Orders Handler (Priority 1)
 *
 * Implements mock logic for all A5 Orders endpoints.
 */

import { OrderStore } from '../store';
import { SEED_PHARMACIES, SEED_MEDICINES } from '../seed';
import { mockResponse, mockError, parseBody, requireAuth } from '../engine';
import { addSystemMockMessage } from './misc.handler';
import { MOCK_ORDERS } from '../demoData';

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2, 10);

export async function handleListOrders(
  query: Record<string, string>,
  authHeader: string | null | undefined,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const { state, page = '1', limit = '10' } = query;
  
  let orders = await OrderStore.findByCustomer(auth.payload.sub);

  if (state) {
    const states = state.split(',');
    orders = orders.filter((o) => states.includes(o.state));
  }

  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const total = orders.length;
  const sliced = orders.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Convert full orders to OrderSummary shape
  const data = sliced.map((o) => {
    const freshPharmacy = SEED_PHARMACIES.find(p => p.id === o.pharmacy?.id) || o.pharmacy;
    const mockRef = MOCK_ORDERS.find(m => m.orderNumber === o.orderNumber);
    
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      orderType: o.orderType,
      state: o.state,
      pharmacy: freshPharmacy,
      itemCount: o.itemCount,
      items: mockRef ? mockRef.items : o.items,
      allowGenericSubstitutions: mockRef && mockRef.allowGenericSubstitutions !== undefined ? mockRef.allowGenericSubstitutions : o.allowGenericSubstitutions,
      totalMrp: o.totalMrp,
      totalAmount: o.totalAmount,
      savings: o.savings,
      isPaid: o.isPaid,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      rating: mockRef && mockRef.rating ? mockRef.rating : o.rating,
    };
  });

  return mockResponse(200, data, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
}

export async function handleGetOrder(
  orderId: string,
  authHeader: string | null | undefined,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const order = await OrderStore.findById(orderId);
  if (!order || order.customerId !== auth.payload.sub) {
    return mockError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }

  // Re-hydrate pharmacy image references to avoid stale AsyncStorage integer IDs
  if (order.pharmacy?.id) {
    const freshPharmacy = SEED_PHARMACIES.find(p => p.id === order.pharmacy.id);
    if (freshPharmacy) order.pharmacy = freshPharmacy;
  }

  // Overlay rich demo data (items with substitution flags, quotes, rating) from MOCK_ORDERS
  const mockRef = MOCK_ORDERS.find((m: any) => m.orderNumber === order.orderNumber);
  if (mockRef) {
    if (mockRef.items && mockRef.items.length > 0) order.items = mockRef.items;
    if (mockRef.quotes)                              order.quotes = mockRef.quotes;
    if (mockRef.selectedQuote)                       order.selectedQuote = mockRef.selectedQuote;
    if (mockRef.rating)                              order.rating = mockRef.rating;
    if (mockRef.allowGenericSubstitutions !== undefined) {
      order.allowGenericSubstitutions = mockRef.allowGenericSubstitutions;
    }
  }

  // Re-hydrate medicine image references
  if (order.items && Array.isArray(order.items)) {
    order.items = order.items.map((item: any) => {
      if (!item.medicine?.id) return item;
      const freshMed = SEED_MEDICINES.find(m => m.id === item.medicine.id);
      return { ...item, medicine: freshMed || item.medicine };
    });
  }

  return mockResponse(200, order);
}

export async function handleCreateOrder(
  authHeader: string | null | undefined,
  body: unknown,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const payload = parseBody(body) as any;
  const { orderType, pharmacyId, items = [], paymentMethod, prescriptionId, customerNote, allowGenericSubstitutions } = payload;

  const pharmacy = SEED_PHARMACIES.find((p) => p.id === pharmacyId);
  if (!pharmacy) return mockError(404, 'PHARMACY_NOT_FOUND', 'Pharmacy not found.');

  if (orderType === 'PRESCRIPTION' && !prescriptionId) {
    return mockError(400, 'VALIDATION_ERROR', 'prescriptionId is required for PRESCRIPTION orders.');
  }

  let totalMrp = 0;
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const med = SEED_MEDICINES.find((m) => m.id === item.medicineId);
    if (!med) return mockError(404, 'MEDICINE_NOT_FOUND', `Medicine ${item.medicineId} not found.`);
    
    const lineTotalMrp = med.mrpPrice * item.quantity;
    const lineTotal = med.pharmacyPrice * item.quantity;
    totalMrp += lineTotalMrp;
    totalAmount += lineTotal;

    orderItems.push({
      id: uuid(),
      medicineId: med.id,
      medicine: {
        name: med.name,
        genericName: med.genericName,
        dosage: med.dosage,
        image: null,
      },
      quantity: item.quantity,
      unitMrp: med.mrpPrice,
      unitPrice: med.pharmacyPrice,
      lineTotal,
    });
  }

  const newOrder = {
    id: uuid(),
    customerId: auth.payload.sub,
    orderNumber: `#MP${Math.floor(Math.random() * 900000) + 100000}`,
    orderType,
    state: orderType === 'PRESCRIPTION' ? 'PRESCRIPTION_VALIDATION' : 'PREPARING',
    pharmacy: {
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      image: null,
      nmraLicense: pharmacy.nmraLicense,
      pharmacistName: pharmacy.pharmacistName,
      estimatedResponseTime: pharmacy.estimatedResponseTime,
    },
    prescriptionId: prescriptionId || null,
    items: orderItems,
    itemCount: orderItems.reduce((acc, i) => acc + i.quantity, 0),
    totalMrp,
    totalAmount,
    savings: totalMrp - totalAmount,
    paymentMethod: paymentMethod || null,
    isPaid: paymentMethod === 'ONLINE',
    allowGenericSubstitutions: !!allowGenericSubstitutions,
    rejectReason: null,
    refundStatus: null,
    customerNote: customerNote || null,
    pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
    pickupOtpVerified: false,
    pickupDeadline: null,
    pickupExtensionRequested: false,
    slaPharmacyReviewDeadline: new Date(Date.now() + 15 * 60000).toISOString(),
    slaCustomerConfirmDeadline: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await OrderStore.create(newOrder);
  return mockResponse(201, newOrder);
}

export async function handleCancelOrder(orderId: string, authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const order = await OrderStore.findById(orderId);
  if (!order || order.customerId !== auth.payload.sub) {
    return mockError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }

  const updated = await OrderStore.update(orderId, { state: 'CANCELLED', updatedAt: new Date().toISOString() });
  return mockResponse(200, { message: 'Order cancelled.', strikes: 0 });
}

export async function handleReorder(orderId: string, authHeader: string | null | undefined) {
  return mockError(501, 'NOT_IMPLEMENTED', 'Reorder not implemented in mock yet.');
}

export async function handleSubmitRating(orderId: string, body: unknown, authHeader: string | null | undefined) {
  const payload = body as any;
  const rating = {
    overall: payload.rating.overall,
    service: payload.rating.service,
    availability: payload.rating.availability,
    pickup: payload.rating.pickup,
    comment: payload.comment,
  };
  await OrderStore.update(orderId, { rating });
  return mockResponse(200, { message: 'Rating submitted.' });
}

export async function handlePickupExtension(orderId: string, authHeader: string | null | undefined) {
  const updated = await OrderStore.update(orderId, { pickupExtensionRequested: true });
  addSystemMockMessage(orderId, 'Customer requested a 24-hour pickup window extension.');
  return mockResponse(200, { message: 'Extension requested.', newDeadline: new Date(Date.now() + 86400000).toISOString() });
}

export async function handleUpdateOrderState(orderId: string, body: any, authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const order = await OrderStore.findById(orderId);
  if (!order || order.customerId !== auth.payload.sub) {
    return mockError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }

  const { state } = body as any;
  if (!state) {
    return mockError(400, 'BAD_REQUEST', 'State is required.');
  }

  const updated = await OrderStore.update(orderId, { state, updatedAt: new Date().toISOString() });
  if (state === 'READY_FOR_PICKUP') {
    addSystemMockMessage(orderId, 'Your pickup code is ready! Please collect your items.');
  }
  return mockResponse(200, updated);
}
