import React, { createContext, useContext, useState } from 'react';
import { Order, FSMOrderState, PharmacyQuote, ChatMessage } from '../types';
import { MOCK_ORDERS } from '../mock/demoData';

interface OrderContextType {
  orders: Order[];
  activeOrder: Order | null;
  chatMessages: Record<string, ChatMessage[]>;
  createPrescriptionOrder: (pharmacyIds: string[], notes?: string) => Order;
  acceptQuote: (orderId: string, quote: PharmacyQuote) => void;
  requestPickupExtension: (orderId: string) => void;
  reportIssue: (orderId: string, issueType: string, description: string) => void;
  setActiveOrder: (order: Order | null) => void;
  addChatMessage: (orderId: string, message: Omit<ChatMessage, 'id' | 'orderId' | 'timestamp'>) => void;
  completeOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const INITIAL_CHAT: Record<string, ChatMessage[]> = {
  'ord-101': [
    {
      id: '1',
      orderId: 'ord-101',
      senderRole: 'PHARMACIST',
      senderName: 'Pharmacist',
      text: 'Hello! Your order #MP123456 has been verified and is ready at counter 2.',
      timestamp: '2:10 PM',
    },
    {
      id: '2',
      orderId: 'ord-101',
      senderRole: 'CUSTOMER',
      senderName: 'You',
      text: 'Thank you! Can I collect it around 5:30 PM today?',
      timestamp: '2:14 PM',
    },
    {
      id: '3',
      orderId: 'ord-101',
      senderRole: 'PHARMACIST',
      senderName: 'Pharmacist',
      text: 'Yes, we are open until 8:00 PM. Just show your 6-digit OTP code when you arrive.',
      timestamp: '2:15 PM',
    },
  ],
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activeOrder, setActiveOrder] = useState<Order | null>(MOCK_ORDERS[0]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_CHAT);

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

  const addChatMessage = (orderId: string, message: Omit<ChatMessage, 'id' | 'orderId' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      orderId,
      timestamp,
      ...message,
    };
    setChatMessages((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newMsg],
    }));
  };

  const requestPickupExtension = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId && ord.pickupDeadline) {
          const currentDeadline = new Date(ord.pickupDeadline).getTime();
          const extended = new Date(currentDeadline + 24 * 3600 * 1000).toISOString();
          
          addChatMessage(orderId, {
            senderRole: 'SYSTEM',
            senderName: 'System',
            text: 'Customer requested a 24-hour pickup window extension.',
          });

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

  const completeOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return { ...ord, state: 'COMPLETED' };
        }
        return ord;
      })
    );
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return { ...ord, state: 'CANCELLED' };
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
        chatMessages,
        createPrescriptionOrder,
        acceptQuote,
        requestPickupExtension,
        reportIssue,
        setActiveOrder,
        addChatMessage,
        completeOrder,
        cancelOrder,
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
