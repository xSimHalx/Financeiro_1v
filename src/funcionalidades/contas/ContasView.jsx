import React from 'react';
import { Cartao } from '../../componentes/ui';
import { formatarMoeda } from '../../lib/formatadores';

/**
 * Minhas Contas: saldo por conta (considerando contexto Empresa/Pessoal se aplicável)
 */
export function ContasView({ saldosPorConta }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {saldosPorConta.map(({ name, balance }) => (
          <Cartao key={name}>
            <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">{name}</h4>
            <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              {formatarMoeda(balance)}
            </p>
          </Cartao>
        ))}
      </div>
    </div>
  );
}
