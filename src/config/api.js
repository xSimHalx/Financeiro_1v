/**
 * URL base da API backend (auth, sync, health).
 * DEV: VITE_API_URL ou fallback http://localhost:3000 (altere se o backend usar outra porta, ex.: 3001)
 * PROD: VITE_API_URL (ex.: https://simhal.tech)
 */
export const API_URL = (
  import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3000')
    : (import.meta.env.VITE_API_URL || '')
).replace(/\/$/, '');
