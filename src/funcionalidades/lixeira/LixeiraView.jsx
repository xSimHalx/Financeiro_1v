import React from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { Cartao } from '../../componentes/ui';
import { Botao } from '../../componentes/ui';

/**
 * Lixeira: itens excluídos (soft delete) com opção de restaurar ou excluir definitivamente
 */
export function LixeiraView({ itensExcluidos, aoRestaurar, aoExcluirDefinitivamente }) {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itensExcluidos.map((tx) => (
          <Cartao key={tx.id} className="border-red-500/10">
            <div className="flex justify-between items-start mb-6">
              <h4 className="text-sm font-black text-white uppercase">{tx.description}</h4>
              <button
                type="button"
                onClick={() => aoExcluirDefinitivamente(tx.id)}
                className="text-slate-700 hover:text-red-500"
                aria-label="Excluir definitivamente"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <Botao
              tipo="button"
              variante="primary"
              classeNome="w-full flex items-center justify-center gap-2 py-3"
              aoClicar={() => aoRestaurar(tx.id)}
            >
              <RotateCcw size={14} /> Restaurar
            </Botao>
          </Cartao>
        ))}
        {itensExcluidos.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-700 italic font-bold uppercase text-xs tracking-widest">
            Lixeira vazia
          </div>
        )}
      </div>
    </div>
  );
}
