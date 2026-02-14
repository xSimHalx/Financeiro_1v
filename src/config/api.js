/**
 * URL base da API backend (auth, sync, health).
 * Produção: VITE_API_URL (ex.: https://api.simhal.tech)
 * Dev: fallback para localhost:3001
 */
export const API_URL = (
  import.meta.env.DEV ? 'http://localhost:3001' : (import.meta.env.VITE_API_URL || '')
).replace(/\/$/, '');
