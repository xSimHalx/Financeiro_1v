import React from 'react';
import { TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Cartao } from '../../componentes/ui';
import { formatarMoeda } from '../../lib/formatadores';

/**
 * Investimentos: saldo por conta no contexto Pessoal (bancos + aplicações).
 * Exibe total geral, grid de contas, últimas movimentações e evolução mensal.
 */
export function InvestimentosView({
  saldosPorConta = [],
  ultimasMovimentacoes = [],
  evolucaoMensal = []
}) {
  const totalGeral = saldosPorConta.reduce((s, c) => s + c.balance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 text-emerald-500 mb-2">
        <TrendingUp size={24} />
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Investimentos (Pessoal)</h2>
      </div>
      <p className="text-slate-500 text-xs max-w-xl">
        Saldo por conta no contexto Pessoal. Adicione contas de investimento em Configurações e lance aplicações e resgates no contexto Pessoal.
      </p>

      {saldosPorConta.length > 0 && (
        <Cartao className="bg-gradient-to-br from-emerald-600/20 to-teal-700/20 border-emerald-500/20">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total</p>
          <p className={`text-3xl font-black tracking-tighter ${totalGeral >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {formatarMoeda(totalGeral)}
          </p>
        </Cartao>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {saldosPorConta.length === 0 ? (
          <Cartao>
            <p className="text-slate-500 text-sm">Nenhuma conta. Configure contas em Configurações.</p>
          </Cartao>
        ) : (
          saldosPorConta.map(({ name, balance }) => (
            <Cartao key={name}>
              <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">{name}</h4>
              <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {formatarMoeda(balance)}
              </p>
            </Cartao>
          ))
        )}
      </div>

      {ultimasMovimentacoes.length > 0 && (
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-6 border-b border-slate-800 pb-4">
            <FileText size={16} className="text-slate-400" /> Últimas movimentações
          </h3>
          <div className="space-y-3">
            {ultimasMovimentacoes.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px]">
                    {tx.description || 'Sem descrição'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {tx.date ? new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
                    {tx.account ? ` · ${tx.account}` : ''}
                  </p>
                </div>
                <span className={`text-sm font-black ${tx.type === 'entrada' ? 'text-emerald-500' : 'text-red-400'}`}>
                  {formatarMoeda(tx.value)}
                </span>
              </div>
            ))}
          </div>
        </Cartao>
      )}

      {evolucaoMensal.length > 0 && (
        <Cartao>
          <h3 className="font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-6 border-b border-slate-800 pb-4">
            <BarChart3 size={16} className="text-emerald-500" /> Evolução mensal (total Pessoal)
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoMensal} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <XAxis dataKey="mesLabel" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tickFormatter={(v) => formatarMoeda(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      )}
    </div>
  );
}
