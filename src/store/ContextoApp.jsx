import React, { createContext, useContext, useState, useCallback } from 'react';

const ContextoApp = createContext(null);

const VISUALIZACOES = ['dashboard', 'transactions', 'recorrentes', 'accounts', 'clientes', 'investimentos', 'trash', 'config'];
const TITULOS = {
  dashboard: 'Dashboard',
  transactions: 'Livro Caixa',
  recorrentes: 'Recorrências',
  accounts: 'Minhas Contas',
  clientes: 'Clientes',
  investimentos: 'Investimentos',
  trash: 'Lixeira',
  config: 'Configurações'
};

/**
 * Provider com estado de visualização (aba) e contexto Empresa/Pessoal
 */
export function ProviderApp({ children }) {
  const [visualizacaoAtual, setVisualizacaoAtual] = useState('dashboard');
  const [visualizacaoContexto, setVisualizacaoContexto] = useState('empresa');

  const aoMudarVisualizacao = useCallback((id) => {
    if (VISUALIZACOES.includes(id)) setVisualizacaoAtual(id);
  }, []);

  const aoMudarContexto = useCallback((contexto) => {
    if (contexto === 'empresa' || contexto === 'pessoal') setVisualizacaoContexto(contexto);
  }, []);

  const tituloAtual = TITULOS[visualizacaoAtual] || 'Dashboard';

  const valor = {
    visualizacaoAtual,
    visualizacaoContexto,
    tituloAtual,
    aoMudarVisualizacao,
    aoMudarContexto
  };

  return <ContextoApp.Provider value={valor}>{children}</ContextoApp.Provider>;
}

export function useApp() {
  const ctx = useContext(ContextoApp);
  if (!ctx) throw new Error('useApp deve ser usado dentro de ProviderApp');
  return ctx;
}
