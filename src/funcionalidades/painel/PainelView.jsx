import React, { useMemo } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Tag,
  Banknote,
  Activity,
  CreditCard,
  Clock,
  Repeat,
  FileText,
  Lightbulb,
  Users,
  TrendingUp,
  Percent
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Cartao } from '../../componentes/ui';
import { formatarMoeda } from '../../lib/formatadores';

const CORES_GASTOS = ['#ef4444', '#f87171', '#fb923c', '#f97316', '#ea580c'];
const CORES_RECEITAS = ['#10b981', '#34d399', '#6ee7b7', '#5eead4', '#2dd4bf'];

function useInsights(estatisticas, dadosPorCategoria, transacoesPendentes, saldosPorConta) {
  return useMemo(() => {
    const { balance, expense, income, incomePerc, expensePerc } = estatisticas;
    const insights = [];
    if (balance < 0) {
      insights.push('Suas saídas superaram as entradas este mês.');
    }
    if (dadosPorCategoria.length > 0 && expense > 0) {
      const [maiorCat, maiorVal] = dadosPorCategoria[0];
      const pct = Math.round((maiorVal / expense) * 100);
      insights.push(`A categoria ${maiorCat} representa ${pct}% dos seus gastos.`);
    }
    if (transacoesPendentes.length > 0) {
      const ent = transacoesPendentes.filter((t) => t.type === 'entrada').length;
      const sai = transacoesPendentes.filter((t) => t.type === 'saida').length;
      const partes = [];
      if (ent) partes.push(`${ent} a receber`);
      if (sai) partes.push(`${sai} a pagar`);
      insights.push(`Você tem ${transacoesPendentes.length} lançamento(s) previsto(s) (${partes.join(', ')}).`);
    }
    const contasNegativas = (saldosPorConta || []).filter((c) => c.balance < 0).length;
    if (contasNegativas > 0) {
      insights.push(`Saldo negativo em ${contasNegativas} conta(s).`);
    }
    if (income > 0) {
      insights.push(`${Math.round(incomePerc)}% das entradas já foram recebidas.`);
    }
    if (expense > 0) {
      insights.push(`${Math.round(expensePerc)}% das saídas já foram pagas.`);
    }
    return insights.slice(0, 5);
  }, [estatisticas, dadosPorCategoria, transacoesPendentes, saldosPorConta]);
}

/**
 * Dashboard: KPIs + saldos por conta, pendentes, insights, gráficos (barras/pizza), recorrências, últimas transações.
 * No contexto Empresa exibe também: faturamento, n clientes, custo, ticket médio, lucro, margem.
 */
export function PainelView({
  estatisticas,
  metricasEmpresa = null,
  visualizacaoContexto = 'empresa',
  dadosPorCategoria,
  dadosPorMetodo,
  saldosPorConta = [],
  transacoesPendentes = [],
  recorrentes = [],
  transacoesFiltradas = []
}) {
  const { income, expense, balance, incomePerc, expensePerc } = estatisticas;
  const isEmpresa = visualizacaoContexto === 'empresa' && metricasEmpresa;

  const insights = useInsights(estatisticas, dadosPorCategoria, transacoesPendentes, saldosPorConta);

  const pendentesEntrada = transacoesPendentes
    .filter((t) => t.type === 'entrada')
    .reduce((a, t) => a + (t.value || 0), 0);
  const pendentesSaida = transacoesPendentes
    .filter((t) => t.type === 'saida')
    .reduce((a, t) => a + (t.value || 0), 0);

  const proximasRecorrencias = useMemo(() => {
    return [...recorrentes]
      .filter((r) => r.ativo !== false)
      .sort((a, b) => (a.diaVencimento || 0) - (b.diaVencimento || 0) || (a.titulo || '').localeCompare(b.titulo || ''))
      .slice(0, 5);
  }, [recorrentes]);

  const ultimasTransacoes = (transacoesFiltradas || []).slice(0, 8);

  const dadosPizzaCategoria = useMemo(
    () => dadosPorCategoria.map(([name, value]) => ({ name, value })),
    [dadosPorCategoria]
  );
  const dadosPizzaMetodo = useMemo(
    () => dadosPorMetodo.map(([name, value]) => ({ name, value })),
    [dadosPorMetodo]
  );

  const vazio =
    income === 0 &&
    expense === 0 &&
    balance === 0 &&
    transacoesPendentes.length === 0 &&
    recorrentes.length === 0 &&
    transacoesFiltradas.length === 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Métricas Empresa (apenas quando contexto Empresa) */}
      {isEmpresa && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Cartao classeNome="border-emerald-500/10">
            <div className="flex items-center gap-2 text-emerald-500 mb-2 font-black text-[9px] uppercase tracking-widest opacity-80">
              <TrendingUp size={14} /> Faturamento
            </div>
            <p className="text-xl font-black text-white tracking-tighter">{formatarMoeda(metricasEmpresa.faturamento)}</p>
          </Cartao>
          <Cartao>
            <div className="flex items-center gap-2 text-slate-400 mb-2 font-black text-[9px] uppercase tracking-widest">
              <Users size={14} /> Nº clientes
            </div>
            <p className="text-xl font-black text-white tracking-tighter">{metricasEmpresa.nClientes}</p>
          </Cartao>
          <Cartao classeNome="border-red-500/10">
            <div className="flex items-center gap-2 text-red-500 mb-2 font-black text-[9px] uppercase tracking-widest opacity-80">
              <ArrowDownCircle size={14} /> Custo mensal
            </div>
            <p className="text-xl font-black text-white tracking-tighter">{formatarMoeda(metricasEmpresa.custo)}</p>
          </Cartao>
          <Cartao>
            <div className="flex items-center gap-2 text-amber-500 mb-2 font-black text-[9px] uppercase tracking-widest opacity-80">
              <Banknote size={14} /> Ticket médio
            </div>
            <p className="text-xl font-black text-white tracking-tighter">{formatarMoeda(metricasEmpresa.ticketMedio)}</p>
          </Cartao>
          <Cartao classeNome="border-teal-500/10">
            <div className="flex items-center gap-2 text-teal-400 mb-2 font-black text-[9px] uppercase tracking-widest opacity-80">
              <Wallet size={14} /> Lucro
            </div>
            <p className={`text-xl font-black tracking-tighter ${metricasEmpresa.lucro >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {formatarMoeda(metricasEmpresa.lucro)}
            </p>
          </Cartao>
          <Cartao>
            <div className="flex items-center gap-2 text-blue-400 mb-2 font-black text-[9px] uppercase tracking-widest opacity-80">
              <Percent size={14} /> Margem
            </div>
            <p className="text-xl font-black text-white tracking-tighter">{metricasEmpresa.margem.toFixed(1)}%</p>
          </Cartao>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Cartao classeNome="border-emerald-500/10">
          <div className="flex items-center gap-3 text-emerald-500 mb-4 font-black text-[10px] uppercase tracking-widest opacity-60">
            <ArrowUpCircle size={20} /> Entradas
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">{formatarMoeda(income)}</h2>
        </Cartao>
        <Cartao classeNome="border-red-500/10">
          <div className="flex items-center gap-3 text-red-500 mb-4 font-black text-[10px] uppercase tracking-widest opacity-60">
            <ArrowDownCircle size={20} /> Saídas
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">{formatarMoeda(expense)}</h2>
        </Cartao>
        <Cartao classeNome="bg-gradient-to-br from-emerald-600 to-teal-700 border-none shadow-2xl shadow-emerald-900/40">
          <div className="flex items-center gap-3 text-white mb-4 font-black text-[10px] uppercase tracking-widest">
            <Wallet size={20} /> Saldo
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">{formatarMoeda(balance)}</h2>
        </Cartao>
      </div>

      {/* Estado vazio */}
      {vazio && (
        <Cartao classeNome="border-slate-700/50">
          <p className="text-slate-500 text-center font-bold uppercase tracking-widest text-sm">
            Nenhum lançamento neste período.
          </p>
          <p className="text-slate-600 text-center text-xs mt-2">
            Adicione transações no Livro Caixa ou configure recorrências para ver os gráficos.
          </p>
        </Cartao>
      )}

      {/* Segunda linha: Saldos por conta, Pendentes, Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4 border-b border-slate-800 pb-3">
            <CreditCard size={16} className="text-slate-400" /> Saldos por conta
          </h3>
          <div className="space-y-3">
            {saldosPorConta.length === 0 ? (
              <p className="text-slate-600 text-[10px] uppercase">Nenhuma conta</p>
            ) : (
              saldosPorConta.map(({ name, balance: saldo }) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{name}</span>
                  <span className={`text-sm font-black ${saldo >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {formatarMoeda(saldo)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Cartao>
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4 border-b border-slate-800 pb-3">
            <Clock size={16} className="text-amber-500" /> A receber / A pagar
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase">A receber</span>
              <span className="text-sm font-black text-emerald-500">{formatarMoeda(pendentesEntrada)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase">A pagar</span>
              <span className="text-sm font-black text-red-400">{formatarMoeda(pendentesSaida)}</span>
            </div>
            {transacoesPendentes.length > 0 && (
              <p className="text-[10px] text-slate-500 pt-1">{transacoesPendentes.length} lançamento(s) previsto(s)</p>
            )}
          </div>
        </Cartao>
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4 border-b border-slate-800 pb-3">
            <Lightbulb size={16} className="text-amber-400" /> Insights
          </h3>
          <div className="space-y-2">
            {insights.length === 0 ? (
              <p className="text-slate-600 text-[10px]">Adicione dados para ver análises.</p>
            ) : (
              insights.map((texto, i) => (
                <p key={i} className="text-slate-400 text-[10px] leading-relaxed">
                  {texto}
                </p>
              ))
            )}
          </div>
        </Cartao>
      </div>

      {/* Grid: Gastos por Categoria (barras), Receitas por Método (barras), Saúde do Fluxo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-10 border-b border-slate-800 pb-4">
            <Tag size={16} className="text-red-500" /> Gastos por Categoria
          </h3>
          <div className="space-y-8">
            {dadosPorCategoria.map(([cat, val]) => (
              <div key={cat} className="group">
                <div className="flex justify-between text-[10px] font-black uppercase mb-2.5">
                  <span>{cat}</span>
                  <span className="text-slate-400">{formatarMoeda(val)}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000"
                    style={{ width: `${(expense ? (val / expense) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
            {dadosPorCategoria.length === 0 && (
              <p className="text-slate-600 text-[10px] uppercase">Nenhum gasto no período</p>
            )}
          </div>
        </Cartao>
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-10 border-b border-slate-800 pb-4">
            <Banknote size={16} className="text-emerald-500" /> Receitas por Método
          </h3>
          <div className="space-y-8">
            {dadosPorMetodo.map(([met, val]) => (
              <div key={met} className="group">
                <div className="flex justify-between text-[10px] font-black uppercase mb-2.5">
                  <span>{met}</span>
                  <span className="text-slate-400">{formatarMoeda(val)}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${(income ? (val / income) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
            {dadosPorMetodo.length === 0 && (
              <p className="text-slate-600 text-[10px] uppercase">Nenhuma receita no período</p>
            )}
          </div>
        </Cartao>
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-10 border-b border-slate-800 pb-4">
            <Activity size={16} className="text-blue-500" /> Saúde do Fluxo
          </h3>
          <div className="space-y-10 py-4">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recebimentos Efetuados</p>
              <span className="text-3xl font-black text-white">{Math.round(incomePerc)}%</span>
              <div className="h-2 bg-slate-800 rounded-full">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${incomePerc}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contas Quitadas</p>
              <span className="text-3xl font-black text-white">{Math.round(expensePerc)}%</span>
              <div className="h-2 bg-slate-800 rounded-full">
                <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${expensePerc}%` }} />
              </div>
            </div>
          </div>
        </Cartao>
      </div>

      {/* Gráficos de pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-6 border-b border-slate-800 pb-4">
            <Tag size={16} className="text-red-500" /> Gastos por Categoria (pizza)
          </h3>
          {dadosPizzaCategoria.length > 0 ? (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPizzaCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {dadosPizzaCategoria.map((_, i) => (
                      <Cell key={i} fill={CORES_GASTOS[i % CORES_GASTOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-600 text-[10px] uppercase py-8">Nenhum gasto no período</p>
          )}
        </Cartao>
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-6 border-b border-slate-800 pb-4">
            <Banknote size={16} className="text-emerald-500" /> Receitas por Método (pizza)
          </h3>
          {dadosPizzaMetodo.length > 0 ? (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPizzaMetodo}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {dadosPizzaMetodo.map((_, i) => (
                      <Cell key={i} fill={CORES_RECEITAS[i % CORES_RECEITAS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-600 text-[10px] uppercase py-8">Nenhuma receita no período</p>
          )}
        </Cartao>
      </div>

      {/* Próximas recorrências + Últimas transações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-6 border-b border-slate-800 pb-4">
            <Repeat size={16} className="text-blue-500" /> Próximas recorrências
          </h3>
          <div className="space-y-4">
            {proximasRecorrencias.length === 0 ? (
              <p className="text-slate-600 text-[10px] uppercase">Nenhuma recorrência</p>
            ) : (
              proximasRecorrencias.map((rec) => (
                <div key={rec.id} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{rec.titulo}</p>
                    <p className="text-[10px] text-slate-500">Todo dia {rec.diaVencimento}</p>
                  </div>
                  <span className={`text-sm font-black ${rec.tipo === 'entrada' ? 'text-emerald-500' : 'text-red-400'}`}>
                    {formatarMoeda(rec.valor)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Cartao>
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-6 border-b border-slate-800 pb-4">
            <FileText size={16} className="text-slate-400" /> Últimas transações
          </h3>
          <div className="space-y-3">
            {ultimasTransacoes.length === 0 ? (
              <p className="text-slate-600 text-[10px] uppercase">Nenhuma transação no período</p>
            ) : (
              ultimasTransacoes.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px]">
                      {tx.description || 'Sem descrição'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {tx.date ? new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
                    </p>
                  </div>
                  <span className={`text-sm font-black ${tx.type === 'entrada' ? 'text-emerald-500' : 'text-red-400'}`}>
                    {formatarMoeda(tx.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Cartao>
      </div>
    </div>
  );
}
