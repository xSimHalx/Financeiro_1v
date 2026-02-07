import React from 'react';
import { Repeat, Trash2, Plus } from 'lucide-react';
import { Cartao } from '../../componentes/ui';
import { formatarMoeda } from '../../lib/formatadores';

/**
 * Tela de recorrências: nova recorrência, projetar + grid de cards
 */
export function RecorrenciasView({ recorrentes, aoProjetarMes, nomeDoMes, feedbackProjetar, aoAbrirModalRecorrencia, aoRemover }) {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4">
      {feedbackProjetar && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-4 text-sm text-slate-200">
          {feedbackProjetar}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {aoAbrirModalRecorrencia && (
          <button
            type="button"
            onClick={aoAbrirModalRecorrencia}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95"
          >
            <Plus size={18} /> Nova recorrência
          </button>
        )}
      <button
        type="button"
        onClick={aoProjetarMes}
        className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95"
      >
        <Repeat size={18} /> Projetar para {nomeDoMes}
      </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recorrentes.map((rec) => (
          <Cartao key={rec.id} className="relative group">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${rec.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                <Repeat size={24} />
              </div>
              <button type="button" onClick={() => aoRemover(rec.id)} className="text-slate-700 hover:text-red-500" aria-label="Remover">
                <Trash2 size={18} />
              </button>
            </div>
            <h4 className="text-lg font-black text-white mb-1 uppercase tracking-tight">{rec.titulo}</h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Vencimento: Todo dia {rec.diaVencimento}
            </p>
            <p className="text-[10px] text-slate-500 mb-8">
              {(rec.frequencia || 'mensal') === 'anual' ? 'Anual' : rec.recorrente !== false ? 'Mensal (recorrente)' : `Mensal · ${rec.quantidadeMeses || 0} meses`}
            </p>
            <h5 className={`text-2xl font-black ${rec.tipo === 'entrada' ? 'text-emerald-500' : 'text-red-400'}`}>
              {formatarMoeda(rec.valor)}
            </h5>
          </Cartao>
        ))}
      </div>
    </div>
  );
}
