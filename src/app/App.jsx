import React, { useState, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProviderApp, useApp, useAuth } from '../store';
import { ProviderDados, useDados } from '../store/ProviderDados';
import Login from './Login.jsx';
import Termos from './Termos.jsx';
import Privacidade from './Privacidade.jsx';
import { LayoutPrincipal } from '../componentes/layout';
import { ConteudoPorView } from './rotas';
import { ModalTransacao } from '../funcionalidades/transacoes';
import { ModalRecorrencia } from '../funcionalidades/recorrencias';
import { Onboarding } from '../componentes/compartilhados';
import { useFiltros, useEstadoFiltros, useSeletorMes, useMetricasEmpresa } from '../hooks';
import { METODOS_PAGAMENTO } from '../lib/constantes';
import { nomeDoMes } from '../lib/formatadores';
import { gerarId, addMeses } from '../lib/utils';
import { restoreFromCloud } from '../lib/sync';
import { reaisParaCentavos, centavosParaReais } from '../lib/moeda';
import * as db from '../lib/db';

function AppConteudo() {
  const { user } = useAuth();
  const { visualizacaoAtual, visualizacaoContexto, tituloAtual, aoMudarVisualizacao, aoMudarContexto } = useApp();
  const { mesAtual, pickerAberto, aoMudarMes, aoAbrirFecharPicker } = useSeletorMes(null);
  const { transacoes, setTransacoes, recorrentes, setRecorrentes, categorias: CATEGORIAS, contas: LISTA_CONTAS, contasInvestimento, clientes: LISTA_CLIENTES, setClientes, statusLancamento, loading, excluirDefinitivamente, refreshFromDb } = useDados();
  const [termoBusca, setTermoBusca] = useState('');
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [notificacoesAberto, setNotificacoesAberto] = useState(false);
  const [modalLancamentoAberto, setModalLancamentoAberto] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [feedbackProjetar, setFeedbackProjetar] = useState(null);
  const [modalRecorrenciaAberto, setModalRecorrenciaAberto] = useState(false);
  const [formRecorrencia, setFormRecorrencia] = useState(null);
  const { filtros, alterarFiltros } = useEstadoFiltros();

  const transacoesFiltradas = useFiltros(transacoes, mesAtual, visualizacaoAtual, visualizacaoContexto, termoBusca, filtros);
  const estatisticas = useMemo(() => {
    const ativas = transacoes.filter(
      (t) => !t.deleted && (mesAtual == null || t.date.startsWith(mesAtual)) && (t.contexto === visualizacaoContexto || !t.contexto)
    );
    const income = ativas.filter((t) => t.type === 'entrada').reduce((a, b) => a + (b.value || 0), 0);
    const expense = ativas.filter((t) => t.type === 'saida').reduce((a, b) => a + (b.value || 0), 0);
    const paidIncome = ativas.filter((t) => t.type === 'entrada' && t.status === 'pago').reduce((a, b) => a + (b.value || 0), 0);
    const paidExpense = ativas.filter((t) => t.type === 'saida' && t.status === 'pago').reduce((a, b) => a + (b.value || 0), 0);
    return {
      income,
      expense,
      balance: income - expense,
      incomePerc: income ? (paidIncome / income) * 100 : 0,
      expensePerc: expense ? (paidExpense / expense) * 100 : 0
    };
  }, [transacoes, mesAtual, visualizacaoContexto]);

  const dadosPorCategoria = useMemo(() => {
    const map = {};
    transacoesFiltradas.filter((t) => t.type === 'saida').forEach((t) => { map[t.category] = (map[t.category] || 0) + t.value; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transacoesFiltradas]);

  const dadosPorMetodo = useMemo(() => {
    const map = {};
    transacoesFiltradas.filter((t) => t.type === 'entrada').forEach((t) => {
      const label = METODOS_PAGAMENTO.find((m) => m.id === t.metodoPagamento)?.label || 'Outros';
      map[label] = (map[label] || 0) + t.value;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transacoesFiltradas]);

  const saldosPorConta = useMemo(() => {
    return (LISTA_CONTAS || []).map((name) => {
      const balance = transacoes
        .filter((t) => t.account === name && !t.deleted && (t.contexto === visualizacaoContexto || !t.contexto))
        .reduce((acc, cur) => (cur.type === 'entrada' ? acc + cur.value : acc - cur.value), 0);
      return { name, balance };
    });
  }, [transacoes, visualizacaoContexto, LISTA_CONTAS]);

  const saldosPorContaPessoal = useMemo(() => {
    return (LISTA_CONTAS || []).map((name) => {
      const balance = transacoes
        .filter((t) => t.account === name && !t.deleted && (t.contexto === 'pessoal' || !t.contexto))
        .reduce((acc, cur) => (cur.type === 'entrada' ? acc + cur.value : acc - cur.value), 0);
      return { name, balance };
    });
  }, [transacoes, LISTA_CONTAS]);

  const saldosInvestimento = useMemo(() => {
    const lista = contasInvestimento && contasInvestimento.length > 0 ? contasInvestimento : null;
    if (!lista) return saldosPorContaPessoal;
    return saldosPorContaPessoal.filter((c) => lista.includes(c.name));
  }, [saldosPorContaPessoal, contasInvestimento]);

  const ultimasMovimentacoesPessoal = useMemo(() => {
    return transacoes
      .filter((t) => !t.deleted && (t.contexto === 'pessoal' || !t.contexto))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 15);
  }, [transacoes]);

  const evolucaoMensal = useMemo(() => {
    const pessoal = transacoes.filter((t) => !t.deleted && (t.contexto === 'pessoal' || !t.contexto));
    const meses = [...new Set(pessoal.map((t) => t.date?.slice(0, 7)).filter(Boolean))].sort();
    return meses.map((mes) => {
      const total = pessoal
        .filter((t) => (t.date || '').slice(0, 7) <= mes)
        .reduce((acc, cur) => (cur.type === 'entrada' ? acc + (cur.value || 0) : acc - (cur.value || 0)), 0);
      const [y, m] = mes.split('-');
      const mesLabel = new Date(parseInt(y, 10), parseInt(m, 10) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      return { mes, mesLabel, total };
    });
  }, [transacoes]);

  const metricasEmpresa = useMetricasEmpresa(transacoes, mesAtual || '');

  const transacoesPendentes = useMemo(
    () => transacoes.filter((t) => !t.deleted && t.status === 'previsto' && (mesAtual == null || t.date.startsWith(mesAtual)) && (t.contexto === visualizacaoContexto || !t.contexto)),
    [transacoes, mesAtual, visualizacaoContexto]
  );
  const itensExcluidos = useMemo(() => transacoes.filter((t) => t.deleted), [transacoes]);

  const abrirModalLancamento = useCallback((tx = null) => {
    setTransacaoEditando(tx);
    const cats = CATEGORIAS || [];
    const contasList = LISTA_CONTAS || [];
    const hoje = new Date().toISOString().slice(0, 10);
    const statusList = statusLancamento || [];
    const formData = tx
      ? { ...tx, value: tx.value != null ? String(centavosParaReais(tx.value)) : '' }
      : {
          date: hoje,
          value: '',
          description: '',
          client: '',
          type: 'saida',
          contexto: visualizacaoContexto,
          contraparte: null,
          category: cats[0] || 'Geral',
          account: contasList[0] || 'Nubank',
          metodoPagamento: 'pix',
          status: statusList[0]?.id ?? 'pago'
        };
    setFormulario(formData);
    setModalLancamentoAberto(true);
  }, [visualizacaoContexto, CATEGORIAS, LISTA_CONTAS, statusLancamento]);

  const handleSalvar = useCallback(
    async (form) => {
      const clientTrim = (form.client || '').trim();
      const lista = LISTA_CLIENTES || [];
      const jaExiste = lista.some((c) => (typeof c === 'string' ? c : c.nome) === clientTrim);
      if (clientTrim && !jaExiste) {
        setClientes([...lista, { id: gerarId('cli'), nome: clientTrim, telefone: '', endereco: '' }]);
      }
      const payload = {
        ...form,
        value: reaisParaCentavos(form.value),
        id: form.id || gerarId('tx'),
        deleted: false,
        contexto: form.contexto ?? 'empresa',
        contraparte: form.contraparte ?? null
      };
      const next = transacaoEditando
        ? transacoes.map((t) => (t.id === transacaoEditando.id ? payload : t))
        : [payload, ...transacoes];
      await db.putTransacoes(next);
      setTransacoes(next);
      setTransacaoEditando(null);
      setModalLancamentoAberto(false);
      const isNew = !transacaoEditando;
      if (isNew) aoMudarVisualizacao('transactions');
    },
    [transacaoEditando, transacoes, setTransacoes, LISTA_CLIENTES, setClientes, aoMudarVisualizacao]
  );

  const handleExcluirDefinitivamente = useCallback((id) => {
    if (window.confirm('Apagar definitivamente do sistema?')) excluirDefinitivamente(id);
  }, [excluirDefinitivamente]);

  const handleProjetarRecorrencias = useCallback(() => {
    const mesProj = mesAtual || new Date().toISOString().slice(0, 7);
    const novos = [];
    recorrentes.filter((r) => r.ativo).forEach((rec) => {
      const frequencia = rec.frequencia || 'mensal';
      const recorrente = rec.recorrente !== false;
      const quantidadeMeses = rec.quantidadeMeses != null ? Number(rec.quantidadeMeses) : null;
      const dataInicio = rec.dataInicio || mesProj;
      let dentroDaJanela = true;
      if (frequencia === 'anual') {
        const mesRef = (dataInicio || mesProj).slice(0, 7);
        dentroDaJanela = mesProj.slice(5, 7) === mesRef.slice(5, 7) && mesProj >= mesRef;
      } else if (!recorrente && quantidadeMeses != null && quantidadeMeses > 0 && dataInicio) {
        const fimJanela = addMeses(dataInicio, quantidadeMeses - 1);
        dentroDaJanela = mesProj >= dataInicio && mesProj <= fimJanela;
      }
      const existe = transacoes.some((t) => t.recorrenciaId === rec.id && t.date.startsWith(mesProj) && !t.deleted);
      if (dentroDaJanela && !existe) {
        novos.push({
          id: gerarId('tx_rec'),
          date: `${mesProj}-${String(rec.diaVencimento).padStart(2, '0')}`,
          description: rec.titulo,
          client: rec.clienteFornecedor || '',
          value: rec.valor,
          type: rec.tipo,
          contexto: visualizacaoContexto,
          contraparte: null,
          category: rec.categoria,
          account: rec.conta,
          metodoPagamento: rec.metodoPagamento,
          status: 'previsto',
          deleted: false,
          recorrenciaId: rec.id
        });
      }
    });
    if (novos.length) {
      setTransacoes((prev) => [...novos, ...prev]);
      setFeedbackProjetar(`${novos.length} lançamento(s) projetado(s) para ${nomeDoMes(mesProj)}.`);
      window.alert(`${novos.length} lançamento(s) projetado(s) para ${nomeDoMes(mesProj)}.`);
    } else {
      const msg = recorrentes.length === 0
        ? 'Nenhuma recorrência cadastrada. Cadastre recorrências primeiro para projetar.'
        : 'Nada para projetar neste mês (já existem ou nenhuma ativa).';
      setFeedbackProjetar(msg);
      window.alert(msg);
    }
    setTimeout(() => setFeedbackProjetar(null), 6000);
  }, [recorrentes, mesAtual, transacoes, visualizacaoContexto]);

  const abrirModalRecorrencia = useCallback(() => {
    setFormRecorrencia({
      titulo: '',
      valor: '',
      tipo: 'saida',
      diaVencimento: 15,
      frequencia: 'mensal',
      recorrente: true,
      quantidadeMeses: null,
      categoria: (CATEGORIAS || [])[0] || 'Geral',
      conta: (LISTA_CONTAS || [])[0] || 'Nubank',
      clienteFornecedor: '',
      metodoPagamento: 'pix',
      ativo: true
    });
    setModalRecorrenciaAberto(true);
  }, [CATEGORIAS, LISTA_CONTAS]);

  const handleSalvarRecorrencia = useCallback(
    (form) => {
      const recorrente = form.recorrente !== false;
      const quantidadeMeses = recorrente ? null : (form.quantidadeMeses != null && form.quantidadeMeses !== '' ? parseInt(form.quantidadeMeses, 10) : null);
      const ehAnual = form.frequencia === 'anual';
      const dataInicio = ehAnual || (!recorrente && quantidadeMeses) ? (form.dataInicio || new Date().toISOString().slice(0, 7)) : null;
      const rec = {
        id: gerarId('rec'),
        titulo: String(form.titulo || '').trim(),
        valor: reaisParaCentavos(form.valor),
        tipo: form.tipo || 'saida',
        diaVencimento: Math.min(31, Math.max(1, parseInt(form.diaVencimento, 10) || 15)),
        frequencia: form.frequencia || 'mensal',
        recorrente,
        quantidadeMeses: quantidadeMeses || undefined,
        dataInicio: dataInicio || undefined,
        categoria: form.categoria || (CATEGORIAS || [])[0] || 'Geral',
        conta: form.conta || (LISTA_CONTAS || [])[0] || 'Nubank',
        clienteFornecedor: (form.clienteFornecedor || '').trim() || undefined,
        metodoPagamento: form.metodoPagamento || 'pix',
        ativo: true
      };
      setRecorrentes((prev) => [rec, ...prev]);
      setModalRecorrenciaAberto(false);
      setFormRecorrencia(null);
    },
    [setRecorrentes, CATEGORIAS, LISTA_CONTAS]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <>
      <Onboarding userId={user?.id} />
      <LayoutPrincipal
        titulo={tituloAtual}
        mesAtual={mesAtual}
        aoMudarMes={aoMudarMes}
        visualizacaoContexto={visualizacaoContexto}
        aoMudarContexto={aoMudarContexto}
        visualizacaoAtual={visualizacaoAtual}
        aoMudarVisualizacao={aoMudarVisualizacao}
        mesPickerAberto={pickerAberto}
        aoAbrirFecharMesPicker={aoAbrirFecharPicker}
        menuMobileAberto={menuMobileAberto}
        aoAlterarMenuMobile={setMenuMobileAberto}
        transacoesPendentes={transacoesPendentes}
        notificacoesAberto={notificacoesAberto}
        aoAbrirNotificacoes={() => setNotificacoesAberto(true)}
        aoFecharNotificacoes={() => setNotificacoesAberto(false)}
        aoEditarTransacao={abrirModalLancamento}
        aoAbrirLancamento={abrirModalLancamento}
      >
        <ConteudoPorView
          view={visualizacaoAtual}
          visualizacaoContexto={visualizacaoContexto}
          estatisticas={estatisticas}
          metricasEmpresa={metricasEmpresa}
          dadosPorCategoria={dadosPorCategoria}
          dadosPorMetodo={dadosPorMetodo}
          transacoesFiltradas={transacoesFiltradas}
          transacoesPendentes={transacoesPendentes}
          filtros={filtros}
          aoAlterarFiltros={alterarFiltros}
          categorias={CATEGORIAS || []}
          aoEditar={abrirModalLancamento}
          moverParaLixeira={(id) => setTransacoes((prev) => prev.map((t) => (t.id === id ? { ...t, deleted: true } : t)))}
          recorrentes={recorrentes}
          aoProjetarMes={handleProjetarRecorrencias}
          nomeDoMes={mesAtual ? nomeDoMes(mesAtual) : 'Todos'}
          feedbackProjetar={feedbackProjetar}
          aoAbrirModalRecorrencia={abrirModalRecorrencia}
          aoRemoverRecorrencia={(id) => setRecorrentes((prev) => prev.filter((r) => r.id !== id))}
          saldosPorConta={saldosPorConta}
          saldosPorContaPessoal={saldosPorContaPessoal}
          saldosInvestimento={saldosInvestimento}
          ultimasMovimentacoesPessoal={ultimasMovimentacoesPessoal}
          evolucaoMensal={evolucaoMensal}
          itensExcluidos={itensExcluidos}
          aoRestaurar={(id) => setTransacoes((prev) => prev.map((t) => (t.id === id ? { ...t, deleted: false } : t)))}
          aoExcluirDefinitivamente={handleExcluirDefinitivamente}
          aoRestaurarDaNuvem={async () => { await restoreFromCloud(); await refreshFromDb(); }}
        />
      </LayoutPrincipal>

      <ModalTransacao
        aberto={modalLancamentoAberto}
        aoFechar={() => setModalLancamentoAberto(false)}
        formulario={formulario}
        aoAlterarFormulario={setFormulario}
        aoSalvar={handleSalvar}
        categorias={CATEGORIAS || []}
        listaContas={LISTA_CONTAS || []}
        listaClientes={(LISTA_CLIENTES || []).map((c) => (typeof c === 'string' ? c : c.nome))}
        listaStatus={statusLancamento || []}
      />

      <ModalRecorrencia
        aberto={modalRecorrenciaAberto}
        aoFechar={() => { setModalRecorrenciaAberto(false); setFormRecorrencia(null); }}
        formulario={formRecorrencia}
        aoAlterarFormulario={setFormRecorrencia}
        aoSalvar={handleSalvarRecorrencia}
        categorias={CATEGORIAS || []}
        listaContas={LISTA_CONTAS || []}
        listaClientes={(LISTA_CLIENTES || []).map((c) => (typeof c === 'string' ? c : c.nome))}
      />
    </>
  );
}

function AppGate() {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-sm">
        Carregando...
      </div>
    );
  }
  if (!token) return <Login />;
  return (
    <ProviderApp>
      <ProviderDados>
        <AppConteudo />
      </ProviderDados>
    </ProviderApp>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/termos" element={<Termos />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/" element={<AppGate />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
