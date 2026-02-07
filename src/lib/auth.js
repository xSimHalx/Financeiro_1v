const API_URL = import.meta.env.VITE_CLOUD_API_URL || '';
const TOKEN_KEY = 'vertexads_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && typeof data.error === 'string' ? data.error : `Login falhou (${res.status})`;
    throw new Error(msg);
  }
  setToken(data.token);
  return data.user;
}

export async function register(email, password, nome) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password, nome: nome ? String(nome).trim() : '' })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && typeof data.error === 'string' ? data.error : 'Cadastro falhou';
    throw new Error(msg);
  }
  setToken(data.token);
  return data.user;
}

export async function me() {
  const token = getToken();
  if (!token || !API_URL) return null;
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.user || null;
}

export function logout() {
  setToken(null);
}
