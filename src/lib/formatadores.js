/**
 * Funções de formatação (moeda, datas, rótulos Empresa/Pessoal)
 */

/**
 * Retorna o rótulo para exibição de transferência/contraparte.
 * Ex: "Empresa - Saída - Pessoal" ou "Entrada (saldo) - Empresa"
 * @param {Object} transacao - { tipo, contexto, contraparte }
 * @returns {string|null} Texto para exibir ou null se não for transferência
 */
export function rotuloContextoContraparte(transacao) {
  const { tipo, contexto, contraparte } = transacao;
  if (!contraparte) return null;

  if (contexto === 'empresa' && tipo === 'saida' && contraparte === 'pessoal') {
    return 'Empresa - Saída - Pessoal';
  }
  if (contexto === 'pessoal' && tipo === 'entrada' && contraparte === 'empresa') {
    return 'Entrada (saldo) - Empresa';
  }
  if (contexto === 'empresa' && tipo === 'entrada' && contraparte === 'pessoal') {
    return 'Entrada - Pessoal';
  }
  if (contexto === 'pessoal' && tipo === 'saida' && contraparte === 'empresa') {
    return 'Saída - Empresa';
  }
  return `${contexto} - ${tipo} - ${contraparte}`;
}

import { centavosParaReais } from './moeda.js';

/**
 * Formata valor em Real (BRL).
 * Espera valor em centavos (inteiro) para evitar erros de ponto flutuante.
 * @param {number} centavos - Valor em centavos. Ex: 10000 = R$ 100,00
 * @param {Object} opcoes - Opções do toLocaleString
 * @returns {string}
 */
export function formatarMoeda(centavos, opcoes = {}) {
  const reais = centavosParaReais(centavos);
  if (Number.isNaN(reais)) return 'R$ 0,00';
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    ...opcoes
  });
}

/**
 * Nome do mês em pt-BR a partir de string YYYY-MM
 * @param {string} anoMes - Ex: "2024-03"
 * @returns {string}
 */
export function nomeDoMes(anoMes) {
  if (!anoMes) return '';
  const [ano, mes] = anoMes.split('-');
  const data = new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, 1);
  return data.toLocaleDateString('pt-BR', { month: 'long' });
}

/**
 * Ano a partir de YYYY-MM
 * @param {string} anoMes
 * @returns {string}
 */
export function anoDeAnoMes(anoMes) {
  return anoMes ? anoMes.split('-')[0] : '';
}
