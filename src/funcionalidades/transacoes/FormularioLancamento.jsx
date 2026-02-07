import React, { useMemo } from 'react';
import { CONTEXTOS, METODOS_PAGAMENTO } from '../../lib/constantes';
import { Input, InputData, InputMoeda, Select } from '../../componentes/ui';

/** Opções de contraparte em função do contexto: só neste contexto ou transferência para o outro */
function opcoesContraparte(contexto) {
  const ctx = contexto || 'empresa';
  if (ctx === 'empresa') {
    return [
      { value: '', label: 'Lançamento só na Empresa' },
      { value: 'pessoal', label: 'Transferência para Pessoal' }
    ];
  }
  return [
    { value: '', label: 'Lançamento só no Pessoal' },
    { value: 'empresa', label: 'Transferência para Empresa' }
  ];
}

/**
 * Formulário do lançamento: tipo, contexto (Empresa/Pessoal), contraparte (transferência), data, valor, descrição, etc.
 */
export function FormularioLancamento({
  formulario,
  aoAlterarFormulario,
  aoSalvar,
  categorias = [],
  listaContas = [],
  listaClientes = [],
  listaStatus = []
}) {
  if (!formulario) return null;

  const contextoAtual = formulario.contexto || 'empresa';
  const opcoesContra = useMemo(() => opcoesContraparte(contextoAtual), [contextoAtual]);

  const handleSubmit = (e) => {
    e.preventDefault();
    aoSalvar(formulario);
  };

  const aoMudarContexto = (novoContexto) => {
    aoAlterarFormulario({ ...formulario, contexto: novoContexto, contraparte: null });
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
      <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => aoAlterarFormulario({ ...formulario, type: 'entrada' })}
          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${
            formulario.type === 'entrada'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-500 hover:bg-slate-800/50'
          }`}
        >
          Receita
        </button>
        <button
          type="button"
          onClick={() => aoAlterarFormulario({ ...formulario, type: 'saida' })}
          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${
            formulario.type === 'saida'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
              : 'text-slate-500 hover:bg-slate-800/50'
          }`}
        >
          Despesa
        </button>
      </div>

      {/* Lançar em: Empresa ou Pessoal */}
      <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Lançar em</label>
        <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
          {CONTEXTOS.map((ctx) => (
            <button
              key={ctx.id}
              type="button"
              onClick={() => aoMudarContexto(ctx.id)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                contextoAtual === ctx.id
                  ? 'bg-emerald-600/80 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {ctx.label}
            </button>
          ))}
        </div>
      </div>

      <Select
        label="Transferência (contraparte)"
        value={formulario.contraparte ?? ''}
        onChange={(e) => aoAlterarFormulario({ ...formulario, contraparte: e.target.value || null })}
        options={opcoesContra}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <InputData
          label="Data"
          required
          value={formulario.date ?? ''}
          onChange={(e) => aoAlterarFormulario({ ...formulario, date: e.target.value })}
        />
        <InputMoeda
          label="Valor"
          required
          value={formulario.value ?? ''}
          onChange={(e) => aoAlterarFormulario({ ...formulario, value: e.target.value })}
          placeholder="0,00"
        />
      </div>

      <Input
        label="Descrição"
        type="text"
        required
        value={formulario.description ?? ''}
        onChange={(e) => aoAlterarFormulario({ ...formulario, description: e.target.value })}
        placeholder="Ex: Fee Mensal..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Input
          label="Cliente / Fornecedor"
          type="text"
          value={formulario.client ?? ''}
          onChange={(e) => aoAlterarFormulario({ ...formulario, client: e.target.value })}
          placeholder="Opcional"
        />
        <Select
          label="Categoria"
          value={formulario.category ?? categorias[0]}
          onChange={(e) => aoAlterarFormulario({ ...formulario, category: e.target.value })}
          options={categorias.map((c) => ({ value: c, label: c }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Select
          label="Conta"
          value={formulario.account ?? listaContas[0]}
          onChange={(e) => aoAlterarFormulario({ ...formulario, account: e.target.value })}
          options={listaContas.map((c) => ({ value: c, label: c }))}
        />
        <Select
          label="Método de pagamento"
          value={formulario.metodoPagamento ?? 'pix'}
          onChange={(e) => aoAlterarFormulario({ ...formulario, metodoPagamento: e.target.value })}
          options={METODOS_PAGAMENTO.map((m) => ({ value: m.id, label: m.label }))}
        />
      </div>

      <Select
        label="Status"
        value={formulario.status ?? (listaStatus[0]?.id ?? 'pago')}
        onChange={(e) => aoAlterarFormulario({ ...formulario, status: e.target.value })}
        options={listaStatus.length ? listaStatus.map((s) => ({ value: s.id, label: s.label })) : [{ value: 'pago', label: 'Pago' }, { value: 'previsto', label: 'Previsto' }]}
      />

      <button
        type="submit"
        className="w-full py-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-[1.5rem] md:rounded-[2rem] shadow-2xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all uppercase tracking-[0.3em] active:scale-95 text-[10px]"
      >
        Confirmar Lançamento
      </button>
    </form>
  );
}
