/**
 * Cliente HTTP centralizado para a API.
 * Usa VITE_API_URL; em DEV fallback para localhost:3000.
 */
import { API_URL } from '../config/api.js';
import { getToken } from '../lib/auth.js';

/**
 * Fetch para a API com headers JSON e token JWT quando disponível.
 * Não usa credentials: 'include' (auth é por Bearer token, não cookie).
 * @param {string} path - Rota relativa (ex: '/auth/login', '/sync')
 * @param {RequestInit} options - fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res;
}

/**
 * Verifica conectividade com a API (GET /health).
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function checkHealth() {
  if (!API_URL) return { ok: false, error: 'API não configurada (VITE_API_URL vazio)' };
  try {
    const res = await fetch(`${API_URL}/health`, { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok) {
      return { ok: true };
    }
    return { ok: false, error: `Servidor retornou ${res.status}` };
  } catch (e) {
    return { ok: false, error: e?.message || 'Falha ao conectar' };
  }
}

// Re-export para compatibilidade
export { API_URL } from '../config/api.js';
