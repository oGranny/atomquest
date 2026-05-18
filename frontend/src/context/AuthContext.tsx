'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  managerId?: string;
  managerName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  devMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, managerId?: string) => Promise<void>;
  logout: () => void;
  setDevMode: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      const savedDevMode = localStorage.getItem('devMode') === 'true';
      setDevMode(savedDevMode);
      if (token) {
        try {
          const userData = await fetchApi('/auth/me');
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', token);
    setUser(user);
    router.push('/dashboard');
  };

  const register = async (name: string, email: string, password: string, managerId?: string) => {
    await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, managerId }),
    });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const toggleDevMode = (val: boolean) => {
    setDevMode(val);
    localStorage.setItem('devMode', val.toString());
  };

  return (
    <AuthContext.Provider value={{ user, loading, devMode, login, register, logout, setDevMode: toggleDevMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};