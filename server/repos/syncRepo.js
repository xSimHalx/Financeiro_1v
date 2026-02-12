import { getDb } from '../db.js';

const DEFAULT_CONFIG = {
  categorias: [],
  contas: [],
  contasInvestimento: [],
  clientes: [],
  statusLancamento: [
    { id: 'pago', label: 'Pago' },
    { id: 'previsto', label: 'Previsto' }
  ],
  lastSyncedAt: null
};

/**
 * Retorna o snapshot mais recente do usuário.
 * @param {string} userId
 * @param {string} [since] - Filtrar transacoes/recorrentes com updatedAt >= since (ISO). Se vazio, retorna snapshot completo.
 * @returns { { transacoes, recorrentes, config } } ou estrutura vazia
 */
export function getSnapshot(userId, since = '') {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT payload_json, updated_at FROM snapshots WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1'
    )
    .get(userId);
  if (!row) {
    return {
      transacoes: [],
      recorrentes: [],
      config: { ...DEFAULT_CONFIG }
    };
  }
  const payload = JSON.parse(row.payload_json);
  const config = payload.config || {};
  if (!config.lastSyncedAt) {
    config.lastSyncedAt = row.updated_at;
  }
  let transacoes = payload.transacoes || [];
  let recorrentes = payload.recorrentes || [];
  if (since) {
    transacoes = transacoes.filter((t) => t.updatedAt && t.updatedAt >= since);
    recorrentes = recorrentes.filter((r) => r.updatedAt && r.updatedAt >= since);
  }
  return {
    transacoes,
    recorrentes,
    config: { ...DEFAULT_CONFIG, ...config }
  };
}

function mergeByUpdatedAt(existing, incoming) {
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const t of incoming) {
    const cur = byId.get(t.id);
    if (!cur || (t.updatedAt && cur.updatedAt && t.updatedAt > cur.updatedAt)) byId.set(t.id, t);
  }
  return Array.from(byId.values());
}

/**
 * Salva snapshot fazendo merge com o existente (compatível com frontend que envia incremental).
 * Fase 2: TODO suporte a device_id e conflitos.
 */
export function saveSnapshot(userId, { transacoes = [], recorrentes = [], config = {} }) {
  const db = getDb();
  const existing = getSnapshot(userId);
  const mergedTransacoes = mergeByUpdatedAt(existing.transacoes, transacoes);
  const mergedRecorrentes = mergeByUpdatedAt(existing.recorrentes, recorrentes);
  const mergedConfig = { ...existing.config };
  if (config.categorias?.length) mergedConfig.categorias = config.categorias;
  if (config.contas?.length) mergedConfig.contas = config.contas;
  if (Array.isArray(config.contasInvestimento)) mergedConfig.contasInvestimento = config.contasInvestimento;
  if (Array.isArray(config.clientes)) mergedConfig.clientes = config.clientes;
  if (Array.isArray(config.statusLancamento) && config.statusLancamento.length > 0) {
    mergedConfig.statusLancamento = config.statusLancamento;
  }

  const updatedAt = new Date().toISOString();
  mergedConfig.lastSyncedAt = updatedAt;
  const payload = { transacoes: mergedTransacoes, recorrentes: mergedRecorrentes, config: mergedConfig };

  db.prepare(
    'INSERT INTO snapshots (user_id, updated_at, payload_json, created_at) VALUES (?, ?, ?, ?)'
  ).run(userId, updatedAt, JSON.stringify(payload), updatedAt);

  db.prepare(
    `INSERT INTO meta (user_id, last_synced_at, device_id, schema_version)
     VALUES (?, ?, NULL, 1)
     ON CONFLICT(user_id) DO UPDATE SET last_synced_at = excluded.last_synced_at`
  ).run(userId, updatedAt);

  return updatedAt;
}

/**
 * Retorna meta do usuário (last_synced_at, device_id, schema_version).
 */
export function getMeta(userId) {
  const db = getDb();
  const row = db.prepare('SELECT last_synced_at, device_id, schema_version FROM meta WHERE user_id = ?').get(userId);
  return row || { last_synced_at: null, device_id: null, schema_version: 1 };
}

/**
 * Fase 2: salvar snapshot com controle de versão e device_id.
 * TODO: suporte a múltiplos devices e conflitos.
 * TODO: sync incremental por since.
 */
export function salvarSnapshotComControleDeVersao(userId, payload, updatedAt, deviceId = null) {
  return saveSnapshot(userId, payload);
}
