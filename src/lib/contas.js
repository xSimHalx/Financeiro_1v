/**
 * Módulo dedicado às contas bancárias/carteiras.
 * Centraliza constantes, validação e helpers para a lista de contas.
 */

export const DEFAULT_CONTAS = ['Nubank', 'Caixa', 'Santander', 'Cofre Empresa'];

/**
 * Extrai o array de contas do objeto de config
 * @param {Object} config - { categorias, contas, lastSyncedAt }
 * @returns {string[]}
 */
export function getContasFromConfig(config) {
  const contas = config?.contas;
  if (Array.isArray(contas) && contas.length > 0) return contas;
  return DEFAULT_CONTAS;
}

/**
 * Garante que a lista de contas é válida (array não vazio de strings)
 * @param {unknown} arr
 * @returns {string[]}
 */
export function validarContas(arr) {
  if (!Array.isArray(arr)) return DEFAULT_CONTAS;
  const filtradas = arr.filter((c) => typeof c === 'string' && c.trim());
  return filtradas.length > 0 ? filtradas : DEFAULT_CONTAS;
}
