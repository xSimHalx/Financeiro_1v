import { useState, useMemo } from 'react';

const filtrosIniciais = { type: 'todos', status: 'todos', method: 'todos', category: 'todos' };

/**
 * Filtra transações por mês, contexto, busca e filtros (tipo, status, método, categoria)
 */
export function useFiltros(transacoes, mesAtual, visualizacaoAtual, contextoAtual, termoBusca, filtros) {
  return useMemo(() => {
    return transacoes.filter((tx) => {
      if (tx.deleted && visualizacaoAtual !== 'trash') return false;
      if (!tx.deleted && visualizacaoAtual === 'trash') return false;
      const mesmoMes = mesAtual == null || tx.date.startsWith(mesAtual);
      const mesmoContexto = tx.contexto === contextoAtual || !tx.contexto;
      const busca = (tx.description || '').toLowerCase().includes((termoBusca || '').toLowerCase())
        || (tx.client || '').toLowerCase().includes((termoBusca || '').toLowerCase());
      const tipo = (filtros?.type ?? 'todos') === 'todos' || tx.type === filtros.type;
      const status = (filtros?.status ?? 'todos') === 'todos' || tx.status === filtros.status;
      const method = (filtros?.method ?? 'todos') === 'todos' || tx.metodoPagamento === filtros.method;
      const category = (filtros?.category ?? 'todos') === 'todos' || tx.category === filtros.category;
      return mesmoMes && mesmoContexto && busca && tipo && status && method && category;
    });
  }, [transacoes, mesAtual, visualizacaoAtual, contextoAtual, termoBusca, filtros]);
}

/**
 * Hook para estado dos filtros do Livro Caixa
 */
export function useEstadoFiltros(inicial = filtrosIniciais) {
  const [filtros, setFiltros] = useState(inicial);
  const alterarFiltros = (novo) => setFiltros((prev) => ({ ...prev, ...novo }));
  return { filtros, setFiltros, alterarFiltros };
}
