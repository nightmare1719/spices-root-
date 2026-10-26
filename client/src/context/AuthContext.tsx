import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<IUser>;
  loginWithGoogle: (credential: string) => Promise<{ user: IUser; isNewUser: boolean }>;
  linkGoogleAccount: (credential: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; phone?: string }) => Promise<IUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('spiceroots_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    if (res.success && res.data.token) {
      localStorage.setItem('spiceroots_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: res.data.user } }));
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const loginWithGoogle = async (credential: string) => {
    const guestId = localStorage.getItem('spiceroots_guest_id') || undefined;
    const res = await api.googleAuth(credential, guestId);
    if (res.success && res.data?.token) {
      localStorage.setItem('spiceroots_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: res.data.user } }));
      return { user: res.data.user, isNewUser: !!res.data.isNewUser };
    }
    throw new Error(res.message || 'Google sign-in failed');
  };

  const linkGoogleAccount = async (credential: string) => {
    const res = await api.linkGoogle(credential);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: res.data.user } }));
    } else {
      throw new Error(res.message || 'Failed to link Google account');
    }
  };

  const register = async (payload: { name: string; email: string; password: string; phone?: string }) => {
    const res = await api.register(payload);
    if (res.success && res.data.token) {
      localStorage.setItem('spiceroots_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: res.data.user } }));
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('spiceroots_token');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: null } }));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithGoogle,
        linkGoogleAccount,
        register,
        logout,
        refreshUser,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
