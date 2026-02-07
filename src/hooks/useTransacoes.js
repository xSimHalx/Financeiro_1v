import { useState, useCallback } from 'react';
import { gerarId } from '../lib/utils';

/**
 * Hook para estado e ações de transações (inclui contexto empresa/pessoal e contraparte)
 */
export function useTransacoes(valorInicial = []) {
  const [transacoes, setTransacoes] = useState(valorInicial);

  const adicionar = useCallback((dados) => {
    const nova = {
      ...dados,
      id: dados.id || gerarId('tx'),
      value: parseFloat(dados.value) || 0,
      deleted: false,
      contexto: dados.contexto ?? 'empresa',
      contraparte: dados.contraparte ?? null
    };
    setTransacoes((prev) => [nova, ...prev]);
    return nova.id;
  }, []);

  const atualizar = useCallback((id, dados) => {
    setTransacoes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...dados, value: parseFloat(dados.value ?? t.value) || 0 } : t))
    );
  }, []);

  const moverParaLixeira = useCallback((id) => {
    setTransacoes((prev) => prev.map((t) => (t.id === id ? { ...t, deleted: true } : t)));
  }, []);

  const restaurar = useCallback((id) => {
    setTransacoes((prev) => prev.map((t) => (t.id === id ? { ...t, deleted: false } : t)));
  }, []);

  const excluirDefinitivamente = useCallback((id) => {
    setTransacoes((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    transacoes,
    setTransacoes,
    adicionar,
    atualizar,
    moverParaLixeira,
    restaurar,
    excluirDefinitivamente
  };
}
