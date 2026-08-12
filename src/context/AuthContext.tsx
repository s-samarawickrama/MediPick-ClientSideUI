import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerUser } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: CustomerUser;
  login: (phoneNumber: string, surname: string, email?: string) => void;
  verifyOtp: (otp: string) => boolean;
  changePhoneNumber: (newPhone: string) => void;
  logout: () => void;
  addStrike: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser>({
    phoneNumber: '',
    surname: '',
    email: '',
    isLoggedIn: false,
    strikes: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@medipick_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser({
            phoneNumber: '',
            surname: '',
            email: '',
            isLoggedIn: false,
            strikes: 0,
          });
        }
      } catch (e) {
        console.warn('Failed to load user', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadUser();
  }, []);

  const saveUser = async (newUser: CustomerUser) => {
    setUser(newUser);
    try {
      await AsyncStorage.setItem('@medipick_user', JSON.stringify(newUser));
    } catch (e) {
      console.warn('Failed to save user', e);
    }
  };

  const login = (phoneNumber: string, surname: string, email?: string) => {
    saveUser({
      phoneNumber,
      surname,
      email,
      isLoggedIn: false,
      strikes: 0,
    });
  };

  const verifyOtp = (otp: string) => {
    if (otp.length === 6) {
      saveUser({ ...user, isLoggedIn: true });
      return true;
    }
    return false;
  };

  const changePhoneNumber = (newPhone: string) => {
    saveUser({ ...user, phoneNumber: newPhone });
  };

  const logout = () => {
    saveUser({
      phoneNumber: '',
      surname: '',
      email: '',
      isLoggedIn: false,
      strikes: 0,
    });
  };

  const addStrike = () => saveUser({ ...user, strikes: user.strikes + 1 });

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, changePhoneNumber, logout, addStrike }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
