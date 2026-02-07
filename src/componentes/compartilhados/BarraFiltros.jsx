import React from 'react';
import { METODOS_PAGAMENTO } from '../../lib/constantes';

/**
 * Barra de filtros para Livro Caixa: tipo, status, método, categoria
 */
export function BarraFiltros({ filtros, aoAlterarFiltros, categorias = [] }) {
  const campos = [
    { chave: 'type', label: 'Fluxo', opcoes: [{ value: 'todos', label: 'Todos' }, { value: 'entrada', label: 'Receitas' }, { value: 'saida', label: 'Despesas' }] },
    { chave: 'status', label: 'Status', opcoes: [{ value: 'todos', label: 'Todos' }, { value: 'pago', label: 'Pago' }, { value: 'previsto', label: 'Previsto' }] },
    { chave: 'method', label: 'Método', opcoes: [{ value: 'todos', label: 'Todos' }, ...METODOS_PAGAMENTO.map((m) => ({ value: m.id, label: m.label }))] },
    { chave: 'category', label: 'Categoria', opcoes: [{ value: 'todos', label: 'Todos' }, ...categorias.map((c) => ({ value: c, label: c }))] }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
      {campos.map(({ chave, label, opcoes }) => (
        <div key={chave} className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
          <select
            value={filtros[chave] ?? 'todos'}
            onChange={(e) => aoAlterarFiltros({ ...filtros, [chave]: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none cursor-pointer uppercase font-bold"
          >
            {opcoes.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
