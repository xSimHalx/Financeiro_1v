import React from 'react';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { nomeDoMes, anoDeAnoMes } from '../../lib/formatadores';
import { MESES_ABREVIADOS, formatarAnoMes } from '../../lib/utils';

/**
 * Seletor de mês/ano (dropdown) - uso standalone se precisar fora do header
 */
export function SeletorMes({ mesAtual, aoMudarMes, aberto, aoAbrirFechar, classeNome = '' }) {
  const ano = anoDeAnoMes(mesAtual);
  const nomeMes = nomeDoMes(mesAtual);

  return (
    <div className={`relative ${classeNome}`}>
      <button
        type="button"
        onClick={aoAbrirFechar}
        className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors"
      >
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
          {nomeMes}, {ano}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${aberto ? 'rotate-180' : ''}`} />
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={aoAbrirFechar} aria-hidden />
          <div className="absolute top-8 left-0 z-50 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 w-72">
            <div className="flex justify-between items-center mb-6 px-2 text-white font-black text-sm">
              <button
                type="button"
                onClick={() => aoMudarMes(formatarAnoMes(String(parseInt(ano, 10) - 1), parseInt(mesAtual.split('-')[1], 10) - 1))}
                className="p-1 hover:bg-slate-800 rounded-lg"
              >
                <ChevronLeft size={16} />
              </button>
              <span>{ano}</span>
              <button
                type="button"
                onClick={() => aoMudarMes(formatarAnoMes(String(parseInt(ano, 10) + 1), parseInt(mesAtual.split('-')[1], 10) - 1))}
                className="p-1 hover:bg-slate-800 rounded-lg"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MESES_ABREVIADOS.map((m, idx) => {
                const mesNum = String(idx + 1).padStart(2, '0');
                const selecionado = mesAtual.split('-')[1] === mesNum;
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
  );
}
