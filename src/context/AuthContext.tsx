import React, { createContext, useContext, useState } from 'react';
import { CustomerUser } from '../types';

interface AuthContextType {
  user: CustomerUser;
  login: (phoneNumber: string, surname: string, email?: string) => void;
  verifyOtp: (otp: string) => boolean;
  changePhoneNumber: (newPhone: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser>({
    phoneNumber: '0771234567',
    surname: 'Perera',
    email: 'perera@gmail.com',
    isLoggedIn: true,
  });

  const login = (phoneNumber: string, surname: string, email?: string) => {
    setUser({
      phoneNumber,
      surname,
      email,
      isLoggedIn: false, // Pending OTP
    });
  };

  const verifyOtp = (otp: string) => {
    if (otp.length === 6) {
      setUser((prev) => ({ ...prev, isLoggedIn: true }));
      return true;
    }
    return false;
  };

  const changePhoneNumber = (newPhone: string) => {
    setUser((prev) => ({
      ...prev,
      phoneNumber: newPhone,
    }));
  };

  const logout = () => {
    setUser({
      phoneNumber: '',
      surname: '',
      email: '',
      isLoggedIn: false,
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, changePhoneNumber, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
