import React, { useState, useEffect, createContext, useContext } from 'react';
import * as auth from '../lib/auth.js';
import * as db from '../lib/db.js';

const ContextoAuth = createContext(null);

export function ProviderAuth({ children }) {
  const [token, setTokenState] = useState(() => auth.getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveTauriToken = (t) => {
    if (typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ != null || window.__TAURI__ != null)) {
      const invoke = window.__TAURI__?.core?.invoke;
      if (invoke) invoke('set_auth_token', { token: t || null }).catch(() => {});
    }
  };

  const checkAuth = async () => {
    const t = auth.getToken();
    if (!t) {
      setTokenState(null);
      setUser(null);
      setLoading(false);
      return;
    }
    const u = await auth.me();
    if (!u) {
      auth.logout();
      setTokenState(null);
      setUser(null);
    } else {
      setTokenState(t);
      setUser(u);
      saveTauriToken(t);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password, remember = true) => {
    const u = await auth.login(email, password, remember);
    setTokenState(auth.getToken());
    setUser(u);
    saveTauriToken(auth.getToken());
  };

  const register = async (email, password, nome, remember = true) => {
    const u = await auth.register(email, password, nome, remember);
    setTokenState(auth.getToken());
    setUser(u);
    saveTauriToken(auth.getToken());
  };

  const logout = () => {
    db.clearUserData().catch(() => {});
    saveTauriToken(null);
    auth.logout();
    setTokenState(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!token && !!user
  };

  return <ContextoAuth.Provider value={value}>{children}</ContextoAuth.Provider>;
}

export function useAuth() {
  const ctx = useContext(ContextoAuth);
  if (!ctx) throw new Error('useAuth must be used within ProviderAuth');
  return ctx;
}
