import React from 'react';
import { Menu, Bell, Plus, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CONTEXTOS } from '../../lib';
import { IndicadorSync } from '../compartilhados/IndicadorSync';
import { nomeDoMes, anoDeAnoMes, formatarMoeda } from '../../lib/formatadores';
import { MESES_ABREVIADOS, formatarAnoMes } from '../../lib/utils';

/**
 * Header com título, seletor de mês, toggle Empresa/Pessoal e ações
 */
export function Cabecalho({
  titulo,
  mesAtual,
  aoMudarMes,
  visualizacaoContexto,
  aoMudarContexto,
  mesPickerAberto,
  aoAbrirFecharMesPicker,
  transacoesPendentes = [],
  aoAbrirNotificacoes,
  aoAbrirLancamento,
  menuMobileAberto,
  aoAbrirMenuMobile,
  notificacoesAberto,
  aoFecharNotificacoes,
  aoEditarTransacao
}) {
  const todosOsMeses = mesAtual == null;
  const ano = todosOsMeses ? new Date().getFullYear().toString() : anoDeAnoMes(mesAtual);
  const nomeMes = todosOsMeses ? '' : nomeDoMes(mesAtual);

  return (
    <header className="h-24 md:h-28 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 md:px-12 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={aoAbrirMenuMobile}
          className="md:hidden p-2 text-slate-400"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none">
            {titulo}
          </h1>
          <div className="relative mt-2 flex flex-wrap items-center gap-4">
            {/* Seletor de mês */}
            <div className="relative">
              <button
                type="button"
                onClick={aoAbrirFecharMesPicker}
                className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                  {todosOsMeses ? 'Todos os meses' : `${nomeMes}, ${ano}`}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${mesPickerAberto ? 'rotate-180' : ''}`} />
              </button>
              {mesPickerAberto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={aoAbrirFecharMesPicker} aria-hidden />
                  <div className="absolute top-8 left-0 z-50 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-72">
                    <button
                      type="button"
                      onClick={() => aoMudarMes(null)}
                      className={`w-full mb-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                        mesAtual == null ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      Todos os meses
                    </button>
                    <div className="flex justify-between items-center mb-6 px-2 text-white font-black text-sm">
                      <button
                        type="button"
                        onClick={() => aoMudarMes(formatarAnoMes(String(parseInt(ano, 10) - 1), (mesAtual && mesAtual.split('-')[1]) ? parseInt(mesAtual.split('-')[1], 10) - 1 : 0))}
                        className="p-1 hover:bg-slate-800 rounded-lg"
                        aria-label="Ano anterior"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span>{ano}</span>
                      <button
                        type="button"
                        onClick={() => aoMudarMes(formatarAnoMes(String(parseInt(ano, 10) + 1), (mesAtual && mesAtual.split('-')[1]) ? parseInt(mesAtual.split('-')[1], 10) - 1 : 0))}
                        className="p-1 hover:bg-slate-800 rounded-lg"
                        aria-label="Próximo ano"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {MESES_ABREVIADOS.map((m, idx) => {
                        const mesNum = String(idx + 1).padStart(2, '0');
                        const selecionado = mesAtual != null && mesAtual.split('-')[1] === mesNum;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => aoMudarMes(formatarAnoMes(ano, idx))}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                              selecionado ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Toggle Empresa / Pessoal */}
            <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800">
              {CONTEXTOS.map((ctx) => (
                <button
                  key={ctx.id}
                  type="button"
                  onClick={() => aoMudarContexto(ctx.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    visualizacaoContexto === ctx.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {ctx.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <IndicadorSync />
        <div className="relative">
          <button
            type="button"
            onClick={notificacoesAberto ? aoFecharNotificacoes : aoAbrirNotificacoes}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 relative hover:text-amber-500"
            aria-label="Notificações"
          >
            <Bell size={20} className="md:size-6" />
            {transacoesPendentes.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse border-2 border-slate-950" />
            )}
          </button>
          {notificacoesAberto && (
            <>
              <div className="fixed inset-0 z-40" onClick={aoFecharNotificacoes} aria-hidden />
              <div className="absolute top-full right-0 mt-2 z-50 w-80 max-h-96 overflow-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-3">
                <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Pendentes</p>
                {transacoesPendentes.length === 0 ? (
                  <p className="px-4 py-6 text-slate-500 text-sm">Nenhum pendente</p>
                ) : (
                  <ul className="divide-y divide-slate-800">
                    {transacoesPendentes.map((tx) => (
                      <li key={tx.id}>
                        <button
                          type="button"
                          onClick={() => { aoEditarTransacao?.(tx); aoFecharNotificacoes?.(); }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors"
                        >
                          <span className="text-slate-300 text-sm block truncate">{tx.description || 'Sem descrição'}</span>
                          <span className="text-[10px] text-slate-500">{tx.date} · {tx.account}</span>
                          <span className={`text-xs font-bold block mt-0.5 ${tx.type === 'entrada' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {tx.type === 'entrada' ? '+' : '-'} {formatarMoeda(tx.value)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => aoAbrirLancamento()}
          className="flex items-center gap-3 px-5 md:px-8 py-3 md:py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-900/20 uppercase tracking-widest text-[9px] md:text-[10px] transition-all active:scale-95"
        >
          <Plus size={16} /> <span className="hidden md:inline">Lançamento</span>
        </button>
      </div>
    </header>
  );
}
