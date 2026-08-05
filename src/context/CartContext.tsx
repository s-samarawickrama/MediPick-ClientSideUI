import React, { createContext, useContext, useState } from 'react';
import { MedicineItem, Pharmacy } from '../types';

export interface CartItem {
  medicine: MedicineItem;
  quantity: number;
  pharmacy: { id: string; name: string; address: string; distance: string; image?: any };
}

export interface AttachedPrescription {
  image: string;
  note: string;
  pharmacyId: string;
  pharmacyName: string;
}

interface CartContextType {
  cartItems: CartItem[];
  selectedPharmacy: Pharmacy | null;
  attachedPrescription: AttachedPrescription | null;
  addToCart: (medicine: MedicineItem, pharmacy: { id: string; name: string; address: string; distance: string; image?: any }) => void;
  removeFromCart: (medicineId: string, pharmacyId: string) => void;
  removeStoreFromCart: (storeId: string) => void;
  updateQuantity: (medicineId: string, pharmacyId: string, delta: number) => void;
  setSelectedPharmacy: (pharmacy: Pharmacy | null) => void;
  setAttachedPrescription: (prescription: AttachedPrescription | null) => void;
  clearCart: () => void;
  subtotal: number;
  totalMrp: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [attachedPrescription, setAttachedPrescription] = useState<AttachedPrescription | null>(null);

  const addToCart = (medicine: MedicineItem, pharmacy: { id: string; name: string; address: string; distance: string; image?: any }) => {
    if (medicine.isRxRequired) {
      alert('Rx Required: Prescription-Only Medicines cannot be added to direct cart. Please use Prescription Upload!');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.medicine.id === medicine.id && item.pharmacy.id === pharmacy.id);
      if (existing) {
        return prev.map((item) =>
          item.medicine.id === medicine.id && item.pharmacy.id === pharmacy.id 
            ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine, quantity: 1, pharmacy }];
    });
  };

  const removeFromCart = (medicineId: string, pharmacyId: string) => {
    setCartItems((prev) => prev.filter((item) => !(item.medicine.id === medicineId && item.pharmacy.id === pharmacyId)));
  };

  const removeStoreFromCart = (storeId: string) => {
    setCartItems((prev) => prev.filter((item) => item.pharmacy.id !== storeId));
  };

  const updateQuantity = (medicineId: string, pharmacyId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === medicineId && item.pharmacy.id === pharmacyId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAttachedPrescription(null);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.medicine.pharmacyPrice * item.quantity, 0);
  const totalMrp = cartItems.reduce((acc, item) => acc + item.medicine.mrpPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedPharmacy,
        attachedPrescription,
        addToCart,
        removeFromCart,
        removeStoreFromCart,
        updateQuantity,
        setSelectedPharmacy,
        setAttachedPrescription,
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
