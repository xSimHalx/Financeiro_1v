import React from 'react';
import { LayoutDashboard, FileText, Plus, Repeat, Users, TrendingUp, Trash2 } from 'lucide-react';

const itens = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'transactions', icon: FileText },
  { id: 'add', icon: Plus, especial: true },
  { id: 'recorrentes', icon: Repeat },
  { id: 'clientes', icon: Users },
  { id: 'investimentos', icon: TrendingUp },
  { id: 'trash', icon: Trash2 }
];

/**
 * Menu flutuante inferior no mobile
 */
export function MenuMobile({ visualizacaoAtual, aoMudarVisualizacao, aoAbrirLancamento }) {
  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-[2rem] px-8 flex justify-between items-center z-40 shadow-2xl">
      {itens.map((item) =>
        item.especial ? (
          <button
            key={item.id}
            type="button"
            onClick={aoAbrirLancamento}
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-[0_15px_30px_-5px_rgba(16,185,129,0.5)] border-4 border-slate-950 active:scale-90 transition-all"
            aria-label="Novo lançamento"
          >
            <Plus size={32} />
          </button>
        ) : (
          <button
            key={item.id}
            type="button"
            onClick={() => aoMudarVisualizacao(item.id)}
            className={`p-2 transition-all ${visualizacaoAtual === item.id ? 'text-emerald-500 scale-125 opacity-100' : 'text-slate-500 opacity-60'}`}
            aria-label={item.id}
          >
            <item.icon size={22} />
          </button>
        )
      )}
    </div>
  );
}
