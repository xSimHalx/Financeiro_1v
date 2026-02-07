import Dexie from 'dexie';
import { normalizeClientes } from './clientes.js';

const DB_NAME = 'VertexAdsFinanceiro';
const DB_VERSION = 2;

export const db = new Dexie(DB_NAME);
db.version(1).stores({
  transacoes: 'id, date, contexto, deleted, updatedAt',
  recorrentes: 'id, updatedAt',
  config: 'key'
});
db.version(DB_VERSION).stores({
  transacoes: 'id, date, contexto, deleted, updatedAt',
  recorrentes: 'id, updatedAt, titulo',
  config: 'key'
});

/**
 * Retorna todas as transações (não deletadas por padrão)
 */
export async function getAllTransacoes(includeDeleted = false) {
  let q = db.transacoes.orderBy('date').reverse();
  if (!includeDeleted) q = q.filter((t) => !t.deleted);
  return q.toArray();
}

/**
 * Inclui ou atualiza uma transação; define updatedAt
 */
export async function putTransacao(t) {
  const updatedAt = new Date().toISOString();
  await db.transacoes.put({ ...t, updatedAt });
  return updatedAt;
}

/**
 * Inclui ou atualiza várias transações
 */
export async function putTransacoes(arr) {
  const updatedAt = new Date().toISOString();
  const items = arr.map((t) => ({ ...t, updatedAt }));
  await db.transacoes.bulkPut(items);
  return updatedAt;
}

/**
 * Remove transação por id (delete físico)
 */
export async function deleteTransacao(id) {
  await db.transacoes.delete(id);
}

/**
 * Retorna todas as recorrências
 */
export async function getAllRecorrentes() {
  return db.recorrentes.orderBy('titulo').toArray();
}

export async function putRecorrencia(r) {
  const updatedAt = new Date().toISOString();
  await db.recorrentes.put({ ...r, updatedAt });
  return updatedAt;
}

export async function putRecorrentes(arr) {
  const updatedAt = new Date().toISOString();
  await db.recorrentes.bulkPut(arr.map((r) => ({ ...r, updatedAt })));
  return updatedAt;
}

export async function deleteRecorrencia(id) {
  await db.recorrentes.delete(id);
}

const CONFIG_KEYS = {
  categorias: 'categorias',
  contas: 'contas',
  contasInvestimento: 'contasInvestimento',
  clientes: 'clientes',
  statusLancamento: 'statusLancamento',
  lastSyncedAt: 'lastSyncedAt'
};

const DEFAULT_STATUS_LANCAMENTO = [
  { id: 'pago', label: 'Pago' },
  { id: 'previsto', label: 'Previsto' }
];

/**
 * Retorna o config (categorias, contas, clientes, statusLancamento, lastSyncedAt)
 */
export async function getConfig() {
  const categorias = await db.config.get(CONFIG_KEYS.categorias);
  const contas = await db.config.get(CONFIG_KEYS.contas);
  const contasInvestimento = await db.config.get(CONFIG_KEYS.contasInvestimento);
  const clientes = await db.config.get(CONFIG_KEYS.clientes);
  const statusLancamento = await db.config.get(CONFIG_KEYS.statusLancamento);
  const lastSyncedAt = await db.config.get(CONFIG_KEYS.lastSyncedAt);
  return {
    categorias: (categorias?.value ?? []).length ? categorias.value : ['Serviços', 'Infraestrutura', 'Assinaturas', 'Geral', 'Vendas', 'Impostos', 'Marketing'],
    contas: (contas?.value ?? []).length ? contas.value : ['Nubank', 'Caixa', 'Santander', 'Cofre Empresa'],
    contasInvestimento: Array.isArray(contasInvestimento?.value) ? contasInvestimento.value : [],
    clientes: normalizeClientes(clientes?.value ?? []),
    statusLancamento: (statusLancamento?.value ?? []).length ? statusLancamento.value : DEFAULT_STATUS_LANCAMENTO,
    lastSyncedAt: lastSyncedAt?.value ?? null
  };
}

/**
 * Salva categorias e/ou contas e/ou clientes e/ou statusLancamento e/ou lastSyncedAt
 */
export async function setConfig(updates) {
  const updatedAt = new Date().toISOString();
  if (updates.categorias != null) await db.config.put({ key: CONFIG_KEYS.categorias, value: updates.categorias, updatedAt });
  if (updates.contas != null) await db.config.put({ key: CONFIG_KEYS.contas, value: updates.contas, updatedAt });
  if (updates.contasInvestimento != null) await db.config.put({ key: CONFIG_KEYS.contasInvestimento, value: updates.contasInvestimento, updatedAt });
  if (updates.clientes != null) await db.config.put({ key: CONFIG_KEYS.clientes, value: updates.clientes, updatedAt });
  if (updates.statusLancamento != null) await db.config.put({ key: CONFIG_KEYS.statusLancamento, value: updates.statusLancamento, updatedAt });
  if (updates.lastSyncedAt != null) await db.config.put({ key: CONFIG_KEYS.lastSyncedAt, value: updates.lastSyncedAt, updatedAt });
  return updatedAt;
}

/**
 * Retorna transações com updatedAt > since (para push)
 */
export async function getTransacoesSince(since) {
  if (!since) return db.transacoes.toArray();
  return db.transacoes.where('updatedAt').above(since).toArray();
}

export async function getRecorrentesSince(since) {
  if (!since) return db.recorrentes.toArray();
  return db.recorrentes.where('updatedAt').above(since).toArray();
}
