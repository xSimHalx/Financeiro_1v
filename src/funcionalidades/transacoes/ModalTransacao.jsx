import React from 'react';
import { X } from 'lucide-react';
import { FormularioLancamento } from './FormularioLancamento';

/**
 * Modal de lançamento (nova transação ou edição) com opção de contexto (Empresa/Pessoal) e contraparte (transferência)
 */
export function ModalTransacao({
  aberto,
  aoFechar,
  formulario,
  aoAlterarFormulario,
  aoSalvar,
  categorias,
  listaContas,
  listaClientes = [],
  listaStatus = []
}) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4">
      <div className="bg-slate-900 border-t md:border border-slate-800 rounded-t-[2.5rem] md:rounded-[3rem] w-full max-w-2xl animate-in slide-in-from-bottom-20 duration-300 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Lançamento</h2>
          <button type="button" onClick={aoFechar} className="p-2 text-slate-500 hover:text-white transition-colors" aria-label="Fechar">
            <X size={28} />
          </button>
        </div>
        <FormularioLancamento
          formulario={formulario}
          aoAlterarFormulario={aoAlterarFormulario}
          aoSalvar={aoSalvar}
          categorias={categorias}
          listaContas={listaContas}
          listaClientes={listaClientes}
          listaStatus={listaStatus}
        />
      </div>
    </div>
  );
}
