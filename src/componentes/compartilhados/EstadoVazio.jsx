import React from 'react';

/**
 * Mensagem quando não há itens na lista
 */
export function EstadoVazio({ mensagem = 'Nada encontrado' }) {
  return (
    <div className="text-center py-20 italic font-black uppercase text-xs text-slate-700 tracking-widest">
      {mensagem}
    </div>
  );
}
