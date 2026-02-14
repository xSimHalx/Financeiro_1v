import * as db from './db.js';
import { getToken } from './auth.js';

const API_URL = (import.meta.env.VITE_CLOUD_API_URL || 'https://cold-layout-attribute-improvements.trycloudflare.com').replace(/\/$/, '');
const FETCH_TIMEOUT_MS = 15_000;
const RETRY_MAX = 2;
const RETRY_BASE_DELAY_MS = 1000;
const INCREMENTAL_SYNC_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Retorna true se estamos no Tauri (sync é feito pelo Rust)
 */
export function isTauri() {
  return typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ != null || window.__TAURI__ != null);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch com timeout. Aborta após timeoutMs.
 */
async function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch com retry e timeout. Retenta em falha de rede ou 5xx.
 */
async function fetchWithRetry(url, options, { maxRetries = RETRY_MAX, baseDelayMs = RETRY_BASE_DELAY_MS } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (res.ok || res.status < 500) return res;
      lastErr = new Error(`Sync failed: ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    if (attempt < maxRetries) await sleep(baseDelayMs * (attempt + 1));
  }
  throw lastErr;
}

/**
 * Merge por updatedAt (last-write-wins). Usado no sync incremental.
 * O cliente garante updatedAt em putTransacoes/putRecorrentes antes do push.
 */
function mergeByUpdatedAt(existing, incoming) {
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const t of incoming) {
    const cur = byId.get(t.id);
    if (!cur || (t.updatedAt && cur.updatedAt && t.updatedAt > cur.updatedAt)) byId.set(t.id, t);
  }
  return Array.from(byId.values());
}

/**
 * Aplica dados de sync no IndexedDB. Servidor é a fonte da verdade: substitui local.
 * (Push pendente é enviado antes do pull, então o servidor já tem os dados locais.)
 */
async function applySyncData(data, now) {
  const txs = data.transacoes || [];
  const recs = data.recorrentes || [];
  await db.db.transacoes.clear();
  if (txs.length > 0) await db.putTransacoes(txs);
  await db.db.recorrentes.clear();
  if (recs.length > 0) await db.putRecorrentes(recs);
  if (data.config) {
    if (data.config.categorias?.length) await db.setConfig({ categorias: data.config.categorias });
    if (data.config.contas?.length) await db.setConfig({ contas: data.config.contas });
    if (Array.isArray(data.config.contasInvestimento)) await db.setConfig({ contasInvestimento: data.config.contasInvestimento });
    if (Array.isArray(data.config.clientes)) await db.setConfig({ clientes: data.config.clientes });
    if ((data.config.statusLancamento ?? []).length) await db.setConfig({ statusLancamento: data.config.statusLancamento });
  }
  await db.setConfig({ lastSyncedAt: now });
}

/**
 * Aplica dados incrementais: mescla com locais por updatedAt (last-write-wins).
 */
async function applySyncDataIncremental(incoming, now) {
  const [localTxs, localRecs] = await Promise.all([db.getAllTransacoes(true), db.getAllRecorrentes()]);
  const mergedTxs = mergeByUpdatedAt(localTxs, incoming.transacoes || []);
  const mergedRecs = mergeByUpdatedAt(localRecs, incoming.recorrentes || []);
  await db.db.transacoes.clear();
  await db.putTransacoes(mergedTxs);
  await db.db.recorrentes.clear();
  await db.putRecorrentes(mergedRecs);
  if (incoming.config?.categorias?.length) await db.setConfig({ categorias: incoming.config.categorias });
  if (incoming.config?.contas?.length) await db.setConfig({ contas: incoming.config.contas });
  if (Array.isArray(incoming.config?.contasInvestimento)) await db.setConfig({ contasInvestimento: incoming.config.contasInvestimento });
  if (Array.isArray(incoming.config?.clientes)) await db.setConfig({ clientes: incoming.config.clientes });
  if ((incoming.config?.statusLancamento ?? []).length) await db.setConfig({ statusLancamento: incoming.config.statusLancamento });
  await db.setConfig({ lastSyncedAt: now });
}

/**
 * Pull da nuvem: GET /sync. Usa snapshot completo ou incremental conforme lastSyncedAt.
 * IMPORTANTE: Se há push pendente, tenta enviar ANTES de aplicar dados do servidor.
 * Caso contrário, aplicar o pull sobrescreveria os dados locais não enviados.
 */
export async function pullFromCloud() {
  if (isTauri() || !API_URL) return { ok: true, skipped: true };
  const config = await db.getConfig();
  const pending = await db.getPendingPush();
  if (pending && getToken()) {
    const pushHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
    const pushRes = await fetch(`${API_URL}/sync`, { method: 'POST', headers: pushHeaders, body: JSON.stringify(pending), cache: 'no-store' });
    if (!pushRes.ok) {
      console.warn('[Sync] push pendente falhou:', pushRes.status, '- dados locais preservados. Faça login novamente.');
      throw new Error(`Sync push pendente falhou: ${pushRes.status}. Faça login novamente.`);
    }
    await db.setConfig({ lastSyncedAt: new Date().toISOString() });
    await db.clearPendingPush();
    console.log('[Sync] push pendente enviado com sucesso');
  }
  const since = config.lastSyncedAt || '';
  const useIncremental = since && (Date.now() - new Date(since).getTime() < INCREMENTAL_SYNC_MAX_AGE_MS);
  const baseUrl = useIncremental ? `${API_URL}/sync?since=${encodeURIComponent(since)}` : `${API_URL}/sync`;
  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;
  const headers = { Accept: 'application/json', 'Cache-Control': 'no-store', Pragma: 'no-cache' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetchWithRetry(url, { method: 'GET', headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Sync pull failed: ${res.status}`);
  const data = await res.json();
  const now = new Date().toISOString();
  if (useIncremental && (data.transacoes?.length || data.recorrentes?.length || data.config)) {
    await applySyncDataIncremental(data, now);
  } else {
    await applySyncData(data, now);
  }
  if (data.transacoes?.length || data.recorrentes?.length) {
    console.log('[Sync] pull OK –', data.transacoes?.length || 0, 'transações,', data.recorrentes?.length || 0, 'recorrências');
  }
  return { ok: true };
}

/**
 * Push para nuvem: envia alterações locais desde lastSyncedAt. POST /sync.
 * Chamado ao fechar o app (pagehide) ou após alterações (debounced).
 * Usa keepalive: true para permitir o request completar ao fechar a aba.
 */
export async function pushToCloud() {
  if (isTauri() || !API_URL || !getToken()) return { ok: true, skipped: true };
  const config = await db.getConfig();
  const transacoes = await db.getAllTransacoes(true);
  const recorrentes = await db.getAllRecorrentes();
  const body = { transacoes, recorrentes, config: { categorias: config.categorias, contas: config.contas, contasInvestimento: config.contasInvestimento, clientes: config.clientes, statusLancamento: config.statusLancamento } };
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const fetchOpts = { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store', keepalive: true };
  try {
    const res = await fetch(`${API_URL}/sync`, fetchOpts);
    if (!res.ok) {
      if (res.status === 401) console.warn('[Sync] push 401 – token inválido. Faça logout e login novamente.');
      throw new Error(`Sync push failed: ${res.status}`);
    }
    const now = new Date().toISOString();
    await db.setConfig({ lastSyncedAt: now });
    await db.clearPendingPush();
    return { ok: true };
  } catch (e) {
    await db.setPendingPush(body);
    throw e;
  }
}

/**
 * Restaurar da nuvem: GET /sync (snapshot completo), substitui dados locais.
 */
export async function restoreFromCloud() {
  if (isTauri()) return { ok: false, message: 'Use o comando Restaurar no app desktop.' };
  if (!API_URL) throw new Error('API não configurada.');
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetchWithRetry(`${API_URL}/sync`, { method: 'GET', headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Restore failed: ${res.status}`);
  const data = await res.json();
  await applySyncData(data, new Date().toISOString());
  return { ok: true };
}

const SYNC_ON_VISIBLE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Registra push ao fechar a aba/app (pagehide) e pull ao voltar (visibility visible).
 * @param {{ onPushStart?: () => void, onPushEnd?: () => void, onPushError?: (e: Error) => void, onVisibilityVisible?: () => Promise<void> }} callbacks
 */
export function registerPushOnClose(callbacks = {}) {
  if (isTauri()) return;
  const { onPushStart, onPushEnd, onPushError, onVisibilityVisible } = callbacks;
  const onClose = () => {
    if (!API_URL) return;
    onPushStart?.();
    pushToCloud()
      .then(() => onPushEnd?.())
      .catch((e) => {
        console.warn('Sync push on close failed', e);
        onPushError?.(e);
      });
  };
  const onVisible = async () => {
    if (document.visibilityState !== 'visible' || !onVisibilityVisible) return;
    const config = await db.getConfig();
    const last = config.lastSyncedAt ? new Date(config.lastSyncedAt).getTime() : 0;
    if (Date.now() - last > SYNC_ON_VISIBLE_INTERVAL_MS) {
      onVisibilityVisible();
    }
  };
  window.addEventListener('pagehide', onClose);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onClose();
    else onVisible();
  });
}
