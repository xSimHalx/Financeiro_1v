import { useMemo } from 'react';

/**
 * Calcula estatísticas (entradas, saídas, saldo, percentuais) para um conjunto de transações do mês e contexto
 */
export function useEstatisticas(transacoes, mesAtual, contextoAtual) {
  return useMemo(() => {
    const ativas = transacoes.filter(
      (t) => !t.deleted && t.date.startsWith(mesAtual) && (t.contexto === contextoAtual || !t.contexto)
    );
    const income = ativas.filter((t) => t.type === 'entrada').reduce((a, b) => a + (b.value || 0), 0);
    const expense = ativas.filter((t) => t.type === 'saida').reduce((a, b) => a + (b.value || 0), 0);
    const paidIncome = ativas.filter((t) => t.type === 'entrada' && t.status === 'pago').reduce((a, b) => a + (b.value || 0), 0);
    const paidExpense = ativas.filter((t) => t.type === 'saida' && t.status === 'pago').reduce((a, b) => a + (b.value || 0), 0);
    return {
      income,
      expense,
      balance: income - expense,
      incomePerc: (income ? (paidIncome / income) * 100 : 0),
      expensePerc: (expense ? (paidExpense / expense) * 100 : 0),
      pendingIncome: income - paidIncome,
      pendingExpense: expense - paidExpense
    };
  }, [transacoes, mesAtual, contextoAtual]);
}
