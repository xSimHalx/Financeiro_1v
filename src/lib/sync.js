import * as db from './db.js';
import { getToken } from './auth.js';

const API_URL = import.meta.env.VITE_CLOUD_API_URL || '';

/**
 * Retorna true se estamos no Tauri (sync é feito pelo Rust)
 */
export function isTauri() {
  return typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ != null || window.__TAURI__ != null);
}

/**
 * Pull da nuvem: GET /sync?since=ISO. Mescla no IndexedDB e atualiza lastSyncedAt.
 * Chamado ao abrir o app (uma vez).
 */
export async function pullFromCloud() {
  if (isTauri() || !API_URL || !navigator.onLine) return { ok: true, skipped: true };
  const config = await db.getConfig();
  const since = config.lastSyncedAt || '';
  const url = since ? `${API_URL}/sync?since=${encodeURIComponent(since)}` : `${API_URL}/sync`;
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) throw new Error(`Sync pull failed: ${res.status}`);
  const data = await res.json();
  const now = new Date().toISOString();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/056378c2-918b-4829-95ff-935ea09984ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sync.js:pullFromCloud',message:'Before clear - checking db structure',data:{hasTransacoes:!!db.transacoes,hasRecorrentes:!!db.recorrentes,hasDb:!!db.db,hasDbTransacoes:!!(db.db?.transacoes),hasDbRecorrentes:!!(db.db?.recorrentes),dataHasTransacoes:Array.isArray(data.transacoes),dataHasRecorrentes:Array.isArray(data.recorrentes)},timestamp:Date.now(),hypothesisId:'H1,H2,H5'})}).catch(()=>{});
  // #endregion
  if (Array.isArray(data.transacoes)) {
    await db.db.transacoes.clear();
    if (data.transacoes.length) await db.putTransacoes(data.transacoes);
  }
  if (Array.isArray(data.recorrentes)) {
    await db.db.recorrentes.clear();
    if (data.recorrentes.length) await db.putRecorrentes(data.recorrentes);
  }
  if (data.config) {
    if (data.config.categorias?.length) await db.setConfig({ categorias: data.config.categorias });
    if (data.config.contas?.length) await db.setConfig({ contas: data.config.contas });
    if (Array.isArray(data.config.contasInvestimento)) await db.setConfig({ contasInvestimento: data.config.contasInvestimento });
    if (Array.isArray(data.config.clientes)) await db.setConfig({ clientes: data.config.clientes });
    if ((data.config.statusLancamento ?? []).length) await db.setConfig({ statusLancamento: data.config.statusLancamento });
  }
  await db.setConfig({ lastSyncedAt: now });
  return { ok: true };
}

/**
 * Push para nuvem: envia alterações locais desde lastSyncedAt. POST /sync.
 * Chamado ao fechar o app (pagehide / beforeunload).
 */
export async function pushToCloud() {
  if (isTauri() || !API_URL || !navigator.onLine) return { ok: true, skipped: true };
  const config = await db.getConfig();
  const since = config.lastSyncedAt || null;
  const transacoes = await db.getTransacoesSince(since);
  const recorrentes = await db.getRecorrentesSince(since);
  const body = { transacoes, recorrentes, config: { categorias: config.categorias, contas: config.contas, contasInvestimento: config.contasInvestimento, clientes: config.clientes, statusLancamento: config.statusLancamento } };
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/sync`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Sync push failed: ${res.status}`);
  const now = new Date().toISOString();
  await db.setConfig({ lastSyncedAt: now });
  return { ok: true };
}

/**
 * Restaurar da nuvem: GET /sync (snapshot completo), substitui dados locais.
 */
export async function restoreFromCloud() {
  if (isTauri()) return { ok: false, message: 'Use o comando Restaurar no app desktop.' };
  if (!API_URL || !navigator.onLine) throw new Error('Sem conexão ou API não configurada.');
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/sync`, { method: 'GET', headers });
  if (!res.ok) throw new Error(`Restore failed: ${res.status}`);
  const data = await res.json();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/056378c2-918b-4829-95ff-935ea09984ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sync.js:restoreFromCloud',message:'Before clear - checking db structure',data:{hasTransacoes:!!db.transacoes,hasRecorrentes:!!db.recorrentes,hasDb:!!db.db,hasDbTransacoes:!!(db.db?.transacoes),hasDbRecorrentes:!!(db.db?.recorrentes)},timestamp:Date.now(),hypothesisId:'H1,H2,H5'})}).catch(()=>{});
  // #endregion
  if (data.transacoes?.length) {
    await db.db.transacoes.clear();
    await db.putTransacoes(data.transacoes);
  }
  if (data.recorrentes?.length) {
    await db.db.recorrentes.clear();
    await db.putRecorrentes(data.recorrentes);
  }
  if (data.config?.categorias?.length) await db.setConfig({ categorias: data.config.categorias });
  if (data.config?.contas?.length) await db.setConfig({ contas: data.config.contas });
  if (Array.isArray(data.config?.contasInvestimento)) await db.setConfig({ contasInvestimento: data.config.contasInvestimento });
  if (Array.isArray(data.config?.clientes)) await db.setConfig({ clientes: data.config.clientes });
  if ((data.config?.statusLancamento ?? []).length) await db.setConfig({ statusLancamento: data.config.statusLancamento });
  await db.setConfig({ lastSyncedAt: new Date().toISOString() });
  return { ok: true };
}

/**
 * Registra push ao fechar a aba/app (pagehide).
 * Pull é chamado explicitamente ao montar a app (no provider de dados).
 */
export function registerPushOnClose() {
  if (isTauri()) return;
  const onClose = () => {
    if (!navigator.onLine || !API_URL) return;
    pushToCloud().catch((e) => console.warn('Sync push on close failed', e));
  };
  window.addEventListener('pagehide', onClose);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onClose();
  });
}
