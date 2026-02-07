import React, { useState, useMemo } from 'react';
import { Cartao, Botao } from '../../componentes/ui';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useDados } from '../../store/ProviderDados';
import { gerarId } from '../../lib/utils';

/**
 * Aba Clientes: lista clientes (nome, telefone, endereço), adicionar com formulário (nome -> telefone/endereço), editar/remover.
 * Transações referenciam por client (nome). Ao editar nome, atualiza em todas as transações.
 */
export function ClientesView() {
  const { clientes, setClientes, transacoes, setTransacoes } = useDados();
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [valorEditNome, setValorEditNome] = useState('');
  const [valorEditTelefone, setValorEditTelefone] = useState('');
  const [valorEditEndereco, setValorEditEndereco] = useState('');
  const [novoCliente, setNovoCliente] = useState('');
  const [formNovoVisible, setFormNovoVisible] = useState(false);
  const [formNovo, setFormNovo] = useState({ nome: '', telefone: '', endereco: '' });

  const lista = useMemo(() => (clientes || []).map((c) => (typeof c === 'string' ? { id: c, nome: c, telefone: '', endereco: '' } : c)), [clientes]);

  const contagemPorCliente = useMemo(() => {
    const map = {};
    (transacoes || [])
      .filter((t) => !t.deleted && (t.client || '').trim())
      .forEach((t) => {
        const nome = String(t.client || '').trim();
        map[nome] = (map[nome] || 0) + 1;
      });
    return map;
  }, [transacoes]);

  const salvarEdicao = (idx) => {
    const nome = (valorEditNome || '').trim();
    if (!nome) return;
    const antigo = lista[idx];
    const nextLista = [...lista];
    nextLista[idx] = { ...antigo, nome, telefone: (valorEditTelefone || '').trim(), endereco: (valorEditEndereco || '').trim() };
    setClientes(nextLista);
    if (antigo.nome !== nome) {
      setTransacoes((prev) =>
        prev.map((t) => (String(t.client || '').trim() === antigo.nome ? { ...t, client: nome } : t))
      );
    }
    setEditandoIdx(null);
    setValorEditNome('');
    setValorEditTelefone('');
    setValorEditEndereco('');
  };

  const remover = (idx) => {
    const nome = lista[idx].nome;
    setClientes(lista.filter((_, i) => i !== idx));
    setTransacoes((prev) =>
      prev.map((t) => (String(t.client || '').trim() === nome ? { ...t, client: '' } : t))
    );
    setEditandoIdx(null);
  };

  const abrirFormNovo = () => {
    const nome = (novoCliente || '').trim();
    if (!nome) return;
    if (lista.some((c) => c.nome === nome)) return;
    setFormNovo({ nome, telefone: '', endereco: '' });
    setFormNovoVisible(true);
    setNovoCliente('');
  };

  const salvarFormNovo = () => {
    const nome = (formNovo.nome || '').trim();
    if (!nome) return;
    if (lista.some((c) => c.nome === nome)) return;
    setClientes([...lista, { id: gerarId('cli'), nome, telefone: (formNovo.telefone || '').trim(), endereco: (formNovo.endereco || '').trim() }]);
    setFormNovoVisible(false);
    setFormNovo({ nome: '', telefone: '', endereco: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <p className="text-slate-500 text-sm">
        Clientes e fornecedores usados nos lançamentos. Ao adicionar, preencha nome e opcionalmente telefone e endereço.
      </p>
      <Cartao>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4">Clientes</h3>
        {lista.length === 0 && !formNovoVisible ? (
          <p className="text-slate-500 text-sm mb-4">Nenhum cliente cadastrado. Digite um nome e clique em Adicionar para preencher os dados.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {lista.map((cli, idx) => (
              <li key={cli.id || idx} className="py-2 border-b border-slate-800/50 last:border-0">
                {editandoIdx === idx ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={valorEditNome}
                      onChange={(e) => setValorEditNome(e.target.value)}
                      placeholder="Nome"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="text"
                      value={valorEditTelefone}
                      onChange={(e) => setValorEditTelefone(e.target.value)}
                      placeholder="Telefone"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="text"
                      value={valorEditEndereco}
                      onChange={(e) => setValorEditEndereco(e.target.value)}
                      placeholder="Endereço"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                    <div className="flex gap-2">
                      <Botao variante="primary" classeNome="py-2 px-3" aoClicar={() => salvarEdicao(idx)}>Salvar</Botao>
                      <Botao variante="ghost" classeNome="py-2 px-2" aoClicar={() => { setEditandoIdx(null); }}>Cancelar</Botao>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex-1 min-w-0 text-slate-200 text-sm font-medium">{cli.nome}</span>
                    {cli.telefone && <span className="text-slate-500 text-xs">Tel: {cli.telefone}</span>}
                    {cli.endereco && <span className="text-slate-500 text-xs truncate max-w-[200px]" title={cli.endereco}>{cli.endereco}</span>}
                    <span className="text-slate-500 text-xs">{(contagemPorCliente[cli.nome] || 0)} lanç.</span>
                    <button type="button" onClick={() => { setEditandoIdx(idx); setValorEditNome(cli.nome); setValorEditTelefone(cli.telefone || ''); setValorEditEndereco(cli.endereco || ''); }} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg" aria-label="Editar"><Pencil size={14} /></button>
                    <button type="button" onClick={() => remover(idx)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg" aria-label="Remover"><Trash2 size={14} /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {formNovoVisible ? (
          <div className="space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700 mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Novo cliente – preencha o que precisar</p>
            <input
              type="text"
              value={formNovo.nome}
              onChange={(e) => setFormNovo((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Nome *"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              value={formNovo.telefone}
              onChange={(e) => setFormNovo((f) => ({ ...f, telefone: e.target.value }))}
              placeholder="Telefone"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              value={formNovo.endereco}
              onChange={(e) => setFormNovo((f) => ({ ...f, endereco: e.target.value }))}
              placeholder="Endereço"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
            <div className="flex gap-2">
              <Botao variante="primary" classeNome="py-2 px-3" aoClicar={salvarFormNovo}>Salvar cliente</Botao>
              <Botao variante="ghost" classeNome="py-2 px-2" aoClicar={() => { setFormNovoVisible(false); setFormNovo({ nome: '', telefone: '', endereco: '' }); }}>Cancelar</Botao>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={novoCliente}
              onChange={(e) => setNovoCliente(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && abrirFormNovo()}
              placeholder="Nome do cliente ou fornecedor"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
            />
            <Botao variante="secondary" classeNome="flex items-center gap-1 py-2 px-4" aoClicar={abrirFormNovo}>
              <Plus size={14} /> Adicionar
            </Botao>
          </div>
        )}
      </Cartao>
    </div>
  );
}
