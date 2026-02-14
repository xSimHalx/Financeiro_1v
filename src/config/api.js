/**
 * URL base da API backend (auth, sync, health).
 * Definida em build via VITE_API_URL.
 * Ex.: https://api.simhal.tech ou http://localhost:3001 para dev local.
 */
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
