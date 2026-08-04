import React, { createContext, useContext, useState } from 'react';
import { Order, FSMOrderState, PharmacyQuote } from '../types';
import { MOCK_ORDERS } from '../mock/demoData';

interface OrderContextType {
  orders: Order[];
  activeOrder: Order | null;
  createPrescriptionOrder: (pharmacyIds: string[], notes?: string) => Order;
  acceptQuote: (orderId: string, quote: PharmacyQuote) => void;
  requestPickupExtension: (orderId: string) => void;
  reportIssue: (orderId: string, issueType: string, description: string) => void;
  setActiveOrder: (order: Order | null) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activeOrder, setActiveOrder] = useState<Order | null>(MOCK_ORDERS[0]);

  const createPrescriptionOrder = (pharmacyIds: string[], notes?: string) => {
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#MP${Math.floor(100000 + Math.random() * 900000)}`,
      orderType: 'PRESCRIPTION',
      state: 'PRESCRIPTION_VALIDATION',
      items: [],
      totalAmount: 0,
      totalMrp: 0,
      isPaid: false,
      createdAt: new Date().toISOString(),
      slaPharmacyReviewDeadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    return newOrder;
  };

  const acceptQuote = (orderId: string, quote: PharmacyQuote) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            state: 'PREPARING',
            selectedQuote: quote,
            pharmacy: {
              id: quote.pharmacyId,
              name: quote.pharmacyName,
              address: 'Selected Pharmacy Branch',
              distance: '1.2 km',
              rating: 4.8,
              nmraLicense: quote.nmraLicense,
              pharmacistName: quote.pharmacistName,
              pharmacistRegNo: quote.pharmacistRegNo,
              estimatedResponseTime: 'Ready soon',
              isOpen: true,
            },
            totalAmount: quote.totalAmount,
            totalMrp: quote.totalMrp,
          };
        }
        return ord;
      })
    );
  };

  const requestPickupExtension = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId && ord.pickupDeadline) {
          const currentDeadline = new Date(ord.pickupDeadline).getTime();
          const extended = new Date(currentDeadline + 24 * 3600 * 1000).toISOString();
          return {
            ...ord,
            pickupDeadline: extended,
            pickupExtensionRequested: true,
          };
        }
        return ord;
      })
    );
  };

  const reportIssue = (orderId: string, issueType: string, description: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return { ...ord, state: 'ISSUE_REPORTED' };
        }
        return ord;
      })
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrder,
        createPrescriptionOrder,
        acceptQuote,
        requestPickupExtension,
        reportIssue,
        setActiveOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};
