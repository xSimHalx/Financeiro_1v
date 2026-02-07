/**
 * Utilitários gerais
 */

/**
 * Gera um id único simples para transações/recorrências
 * @param {string} prefixo - Ex: "tx", "rec", "tr"
 * @returns {string}
 */
export function gerarId(prefixo = 'tx') {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Garante que o mês está no formato YYYY-MM
 * @param {string} ano - Ex: "2024"
 * @param {number} indiceMes - 0-11
 * @returns {string}
 */
export function formatarAnoMes(ano, indiceMes) {
  const mes = String(indiceMes + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

/**
 * Lista dos 12 meses abreviados em pt-BR
 */
export const MESES_ABREVIADOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Soma n meses a um ano-mês YYYY-MM
 * @param {string} ym - Ex: "2025-02"
 * @param {number} n - Número de meses a somar
 * @returns {string} YYYY-MM
 */
export function addMeses(ym, n) {
  if (!ym || n === 0) return ym;
  const [y, m] = ym.split('-').map(Number);
  const total = (y - 1) * 12 + (m - 1) + n;
  const ano = Math.floor(total / 12) + 1;
  const mes = (total % 12) + 1;
  return `${ano}-${String(mes).padStart(2, '0')}`;
}
