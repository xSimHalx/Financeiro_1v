import React from 'react';
import { X } from 'lucide-react';
import { METODOS_PAGAMENTO } from '../../lib/constantes';
import { Input, InputMoeda, Select } from '../../componentes/ui';

const FREQUENCIAS = [
  { id: 'mensal', label: 'Mensal' },
  { id: 'anual', label: 'Anual' }
];

/**
 * Modal para cadastrar nova recorrência (título, valor, tipo, frequência, recorrente/quantidade de meses, dia vencimento, categoria, conta, método).
 */
export function ModalRecorrencia({
  aberto,
  aoFechar,
  formulario,
  aoAlterarFormulario,
  aoSalvar,
  categorias = [],
  listaContas = [],
  listaClientes = []
}) {
  if (!aberto || !formulario) return null;

  const frequencia = formulario.frequencia ?? 'mensal';
  const recorrente = formulario.recorrente !== false;

  const handleSubmit = (e) => {
    e.preventDefault();
    aoSalvar(formulario);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4">
      <div className="bg-slate-900 border-t md:border border-slate-800 rounded-t-[2.5rem] md:rounded-[3rem] w-full max-w-2xl animate-in slide-in-from-bottom-20 duration-300 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Nova recorrência</h2>
          <button type="button" onClick={aoFechar} className="p-2 text-slate-500 hover:text-white transition-colors" aria-label="Fechar">
            <X size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => aoAlterarFormulario({ ...formulario, tipo: 'entrada' })}
              className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${
                formulario.tipo === 'entrada'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-500 hover:bg-slate-800/50'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => aoAlterarFormulario({ ...formulario, tipo: 'saida' })}
              className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${
                formulario.tipo === 'saida'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                  : 'text-slate-500 hover:bg-slate-800/50'
              }`}
            >
              Despesa
            </button>
          </div>

          <Input
            label="Título"
            type="text"
            required
            value={formulario.titulo ?? ''}
            onChange={(e) => aoAlterarFormulario({ ...formulario, titulo: e.target.value })}
            placeholder="Ex: Aluguel, Assinatura..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputMoeda
              label="Valor (R$)"
              required
              value={formulario.valor ?? ''}
              onChange={(e) => aoAlterarFormulario({ ...formulario, valor: e.target.value })}
              placeholder="0,00"
            />
            <Input
              label="Dia do vencimento (1–31)"
              type="number"
              min={1}
              max={31}
              required
              value={formulario.diaVencimento ?? 15}
              onChange={(e) => aoAlterarFormulario({ ...formulario, diaVencimento: parseInt(e.target.value, 10) || 1 })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">Frequência</label>
            <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
              {FREQUENCIAS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => aoAlterarFormulario({ ...formulario, frequencia: f.id })}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                    frequencia === f.id ? 'bg-emerald-600/80 text-white' : 'text-slate-500 hover:bg-slate-800/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {frequencia === 'mensal' && (
            <>
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <input
                  type="checkbox"
                  id="recorrente"
                  checked={recorrente}
                  onChange={(e) => aoAlterarFormulario({ ...formulario, recorrente: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="recorrente" className="text-sm font-bold text-slate-200 cursor-pointer">
                  Recorrente (repetir indefinidamente)
                </label>
              </div>
              {!recorrente && (
                <Input
                  label="Quantidade de meses"
                  type="number"
                  min={1}
                  max={360}
                  required={!recorrente}
                  value={formulario.quantidadeMeses ?? ''}
                  onChange={(e) => aoAlterarFormulario({ ...formulario, quantidadeMeses: e.target.value ? parseInt(e.target.value, 10) : null })}
                  placeholder="Ex: 12"
                />
              )}
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select
              label="Categoria"
              value={formulario.categoria ?? categorias[0]}
              onChange={(e) => aoAlterarFormulario({ ...formulario, categoria: e.target.value })}
              options={categorias.map((c) => ({ value: c, label: c }))}
            />
            <Select
              label="Conta"
              value={formulario.conta ?? listaContas[0]}
              onChange={(e) => aoAlterarFormulario({ ...formulario, conta: e.target.value })}
              options={listaContas.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <Select
            label="Cliente / Fornecedor"
            value={formulario.clienteFornecedor ?? ''}
            onChange={(e) => aoAlterarFormulario({ ...formulario, clienteFornecedor: e.target.value || '' })}
            options={[{ value: '', label: 'Nenhum' }, ...listaClientes.map((c) => ({ value: c, label: c }))]}
          />

          <Select
            label="Método de pagamento"
            value={formulario.metodoPagamento ?? 'pix'}
            onChange={(e) => aoAlterarFormulario({ ...formulario, metodoPagamento: e.target.value })}
            options={METODOS_PAGAMENTO.map((m) => ({ value: m.id, label: m.label }))}
          />

          <button
            type="submit"
            className="w-full py-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-[1.5rem] md:rounded-[2rem] shadow-2xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all uppercase tracking-[0.3em] active:scale-95 text-[10px]"
          >
            Salvar recorrência
          </button>
        </form>
      </div>
    </div>
  );
}
