import { useMemo } from 'react';

/**
 * Calcula métricas de negócio para o contexto Empresa (mês atual).
 * Valores em centavos; margem em percentual.
 * @param {Array} transacoes - Lista de transações
 * @param {string} mesAtual - Ano-mês (YYYY-MM)
 * @returns {{ faturamento, custo, lucro, margem, nClientes, ticketMedio }}
 */
export function useMetricasEmpresa(transacoes, mesAtual) {
  return useMemo(() => {
    const ativas = (transacoes || []).filter(
      (t) => !t.deleted && t.date.startsWith(mesAtual) && (t.contexto === 'empresa' || !t.contexto)
    );
    const entradas = ativas.filter((t) => t.type === 'entrada');
    const faturamento = entradas.reduce((a, b) => a + (b.value || 0), 0);
    const custo = ativas.filter((t) => t.type === 'saida').reduce((a, b) => a + (b.value || 0), 0);
    const lucro = faturamento - custo;
    const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;
    const clientesUnicos = new Set(
      entradas.map((t) => String(t.client || '').trim()).filter((c) => c.length > 0)
    );
    const nClientes = clientesUnicos.size;
    const nEntradas = entradas.length;
    const ticketMedio = nEntradas > 0 ? Math.round(faturamento / nEntradas) : 0;

    return {
      faturamento,
      custo,
      lucro,
      margem,
      nClientes,
      ticketMedio
    };
  }, [transacoes, mesAtual]);
}
