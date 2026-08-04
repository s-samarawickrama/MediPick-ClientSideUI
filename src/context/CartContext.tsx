import React, { createContext, useContext, useState } from 'react';
import { MedicineItem, Pharmacy } from '../types';

export interface CartItem {
  medicine: MedicineItem;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  selectedPharmacy: Pharmacy | null;
  addToCart: (medicine: MedicineItem) => void;
  removeFromCart: (medicineId: string) => void;
  updateQuantity: (medicineId: string, delta: number) => void;
  setSelectedPharmacy: (pharmacy: Pharmacy | null) => void;
  clearCart: () => void;
  subtotal: number;
  totalMrp: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);

  const addToCart = (medicine: MedicineItem) => {
    if (medicine.isRxRequired) {
      alert('Rx Required: Prescription-Only Medicines cannot be added to direct cart. Please use Prescription Upload!');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.medicine.id === medicine.id);
      if (existing) {
        return prev.map((item) =>
          item.medicine.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCartItems((prev) => prev.filter((item) => item.medicine.id !== medicineId));
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === medicineId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCartItems([]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.medicine.pharmacyPrice * item.quantity, 0);
  const totalMrp = cartItems.reduce((acc, item) => acc + item.medicine.mrpPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedPharmacy,
        addToCart,
        removeFromCart,
        updateQuantity,
        setSelectedPharmacy,
        clearCart,
        subtotal,
        totalMrp,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
