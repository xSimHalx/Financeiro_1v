import React from 'react';
import { PainelView } from '../funcionalidades/painel';
import { TransacoesView } from '../funcionalidades/transacoes';
import { RecorrenciasView } from '../funcionalidades/recorrencias';
import { ContasView } from '../funcionalidades/contas';
import { ClientesView } from '../funcionalidades/clientes';
import { InvestimentosView } from '../funcionalidades/investimentos';
import { LixeiraView } from '../funcionalidades/lixeira';
import { ConfiguracoesView } from '../funcionalidades/configuracoes';

/**
 * Mapeamento view id -> componente (sem React Router; controle por estado)
 */
export function ConteudoPorView({
  view,
  visualizacaoContexto,
  // Painel
  estatisticas,
  metricasEmpresa,
  dadosPorCategoria,
  dadosPorMetodo,
  saldosPorConta,
  saldosPorContaPessoal,
  saldosInvestimento,
  ultimasMovimentacoesPessoal,
  evolucaoMensal,
  transacoesPendentes,
  recorrentes,
  transacoesFiltradas,
  // Transações
  filtros,
  aoAlterarFiltros,
  categorias,
  aoEditar,
  moverParaLixeira,
  // Recorrências
  aoProjetarMes,
  nomeDoMes,
  feedbackProjetar,
  aoAbrirModalRecorrencia,
  aoRemoverRecorrencia,
  // Contas
  // Lixeira
  itensExcluidos,
  aoRestaurar,
  aoExcluirDefinitivamente,
  // Configurações
  aoRestaurarDaNuvem
}) {
  switch (view) {
    case 'dashboard':
      return (
        <PainelView
          estatisticas={estatisticas}
          metricasEmpresa={metricasEmpresa}
          visualizacaoContexto={visualizacaoContexto}
          dadosPorCategoria={dadosPorCategoria}
          dadosPorMetodo={dadosPorMetodo}
          saldosPorConta={saldosPorConta ?? []}
          transacoesPendentes={transacoesPendentes ?? []}
          recorrentes={recorrentes ?? []}
          transacoesFiltradas={transacoesFiltradas ?? []}
        />
      );
    case 'transactions':
      return (
        <TransacoesView
          transacoesFiltradas={transacoesFiltradas}
          filtros={filtros}
          aoAlterarFiltros={aoAlterarFiltros}
          categorias={categorias}
          aoEditar={aoEditar}
          moverParaLixeira={moverParaLixeira}
        />
      );
    case 'recorrentes':
      return (
        <RecorrenciasView
          recorrentes={recorrentes}
          aoProjetarMes={aoProjetarMes}
          nomeDoMes={nomeDoMes}
          feedbackProjetar={feedbackProjetar}
          aoAbrirModalRecorrencia={aoAbrirModalRecorrencia}
          aoRemover={aoRemoverRecorrencia}
        />
      );
    case 'accounts':
      return <ContasView saldosPorConta={saldosPorConta} />;
    case 'clientes':
      return <ClientesView />;
    case 'investimentos':
      return (
        <InvestimentosView
          saldosPorConta={saldosInvestimento ?? saldosPorContaPessoal ?? []}
          ultimasMovimentacoes={ultimasMovimentacoesPessoal ?? []}
          evolucaoMensal={evolucaoMensal ?? []}
        />
      );
    case 'trash':
      return (
        <LixeiraView
          itensExcluidos={itensExcluidos}
          aoRestaurar={aoRestaurar}
          aoExcluirDefinitivamente={aoExcluirDefinitivamente}
        />
      );
    case 'config':
      return <ConfiguracoesView aoRestaurarDaNuvem={aoRestaurarDaNuvem} />;
    default:
      return (
        <PainelView
          estatisticas={estatisticas}
          metricasEmpresa={metricasEmpresa}
          visualizacaoContexto={visualizacaoContexto}
          dadosPorCategoria={dadosPorCategoria}
          dadosPorMetodo={dadosPorMetodo}
          saldosPorConta={saldosPorConta ?? []}
          transacoesPendentes={transacoesPendentes ?? []}
          recorrentes={recorrentes ?? []}
          transacoesFiltradas={transacoesFiltradas ?? []}
        />
      );
  }
}
