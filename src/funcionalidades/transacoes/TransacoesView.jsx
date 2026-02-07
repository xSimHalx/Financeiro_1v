import React from 'react';
import { Cartao, Etiqueta } from '../../componentes/ui';
import { BarraFiltros, EstadoVazio } from '../../componentes/compartilhados';
import { formatarMoeda, rotuloContextoContraparte } from '../../lib/formatadores';

/**
 * Livro Caixa: barra de filtros + lista de transações (com rótulo Empresa/Pessoal quando for transferência)
 */
export function TransacoesView({
  transacoesFiltradas,
  filtros,
  aoAlterarFiltros,
  categorias,
  aoEditar,
  moverParaLixeira
}) {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <BarraFiltros filtros={filtros} aoAlterarFiltros={aoAlterarFiltros} categorias={categorias} />
      <div className="space-y-4">
        {transacoesFiltradas.map((tx) => {
          const rotuloTransferencia = rotuloContextoContraparte(tx);
          return (
            <Cartao
              key={tx.id}
              classeNome="flex justify-between items-center group hover:border-emerald-500/30 transition-all cursor-default"
            >
              <div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{tx.date}</span>
                <h4 className="text-sm font-black text-white uppercase tracking-tight mt-1">{tx.description}</h4>
                {rotuloTransferencia && (
                  <p className="text-[10px] text-emerald-400/90 font-bold uppercase mt-0.5">{rotuloTransferencia}</p>
                )}
                <p className="text-[10px] text-slate-500 font-bold uppercase">{tx.client || 'Geral'} • {tx.account}</p>
              </div>
              <div className="text-right">
                <Etiqueta variante={tx.status === 'pago' ? 'success' : 'warning'}>{tx.status}</Etiqueta>
                <h5 className={`text-lg font-black mt-2 ${tx.type === 'entrada' ? 'text-emerald-500' : 'text-red-400'}`}>
                  {formatarMoeda(tx.value)}
                </h5>
                <div className="flex justify-end gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => aoEditar(tx)} className="text-slate-500 hover:text-white">
                    Editar
                  </button>
                  <button type="button" onClick={() => moverParaLixeira(tx.id)} className="text-red-500/50 hover:text-red-500">
                    Lixeira
                  </button>
                </div>
              </div>
            </Cartao>
          );
        })}
        {transacoesFiltradas.length === 0 && <EstadoVazio mensagem="Nada encontrado" />}
      </div>
    </div>
  );
}
