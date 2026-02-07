/**
 * Helpers para valores monetários em centavos (inteiros).
 * Evita erros de precisão de ponto flutuante em JavaScript.
 */

/**
 * Converte reais (número ou string) para centavos (inteiro)
 * @param {number|string} reais - Ex: 100, "100", "99.99"
 * @returns {number} Centavos. Ex: 10000, 9999
 */
export function reaisParaCentavos(reais) {
  const n = typeof reais === 'string' ? parseFloat(String(reais).replace(',', '.')) : Number(reais);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

/**
 * Converte centavos (inteiro) para reais (número para exibição)
 * @param {number} centavos - Ex: 10000
 * @returns {number} Ex: 100
 */
export function centavosParaReais(centavos) {
  const n = Number(centavos);
  if (Number.isNaN(n)) return 0;
  return n / 100;
}

/**
 * Formata centavos como moeda BRL
 * @param {number} centavos
 * @param {Object} opcoes - Opções do toLocaleString
 * @returns {string} Ex: "R$ 100,00"
 */
export function formatarCentavos(centavos, opcoes = {}) {
  const reais = centavosParaReais(centavos);
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    ...opcoes
  });
}
