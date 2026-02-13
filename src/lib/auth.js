const API_URL = import.meta.env.VITE_CLOUD_API_URL || '';
const TOKEN_KEY = 'vertexads_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token, remember = true) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (token) {
    if (remember) localStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export async function login(email, password, remember = true) {
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
  setToken(data.token, remember);
  return data.user;
}

export async function register(email, password, nome, remember = true) {
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
  setToken(data.token, remember);
  return data.user;
}

export async function me() {
  const token = getToken();
  if (!token || !API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.user || null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
