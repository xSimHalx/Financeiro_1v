import React, { useState } from 'react';
import { Cartao, Botao } from '../../componentes/ui';
import { RotateCcw, Plus, Pencil, Trash2, Download, Wifi, WifiOff } from 'lucide-react';
import { useDados } from '../../store/ProviderDados';
import { useServerStatus } from '../../hooks';
import { gerarId } from '../../lib/utils';

function slugFromLabel(label) {
  return (label || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'status';
}

/**
 * Configurações: sync, gerenciar categorias, contas, clientes e status de lançamento
 */
export function ConfiguracoesView({ aoRestaurarDaNuvem }) {
  const { categorias, contas, setCategorias, setContas, contasInvestimento, setContasInvestimento, clientes, setClientes, statusLancamento, setStatusLancamento } = useDados();
  const [syncStatus, setSyncStatus] = useState('');
  const [erro, setErro] = useState('');
  const [novoCategoria, setNovoCategoria] = useState('');
  const [novaConta, setNovaConta] = useState('');
  const [novaContaInvestimento, setNovaContaInvestimento] = useState('');
  const [novoCliente, setNovoCliente] = useState('');
  const [novoStatusLabel, setNovoStatusLabel] = useState('');
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [editandoConta, setEditandoConta] = useState(null);
  const [editandoContaInvestimento, setEditandoContaInvestimento] = useState(null);
  const [editandoCliente, setEditandoCliente] = useState(null);
  const [editandoStatus, setEditandoStatus] = useState(null);
  const [valorEditCategoria, setValorEditCategoria] = useState('');
  const [valorEditConta, setValorEditConta] = useState('');
  const [valorEditContaInvestimento, setValorEditContaInvestimento] = useState('');
  const [valorEditCliente, setValorEditCliente] = useState('');
  const [valorEditStatusLabel, setValorEditStatusLabel] = useState('');
  const { status: serverStatus, mensagem: serverMsg, verificar: verificarServidor, checking: serverChecking } = useServerStatus();

  const handleRestaurar = async () => {
    if (!window.confirm('Isso vai substituir os dados locais pelos da nuvem. Continuar?')) return;
    setSyncStatus('Restaurando...');
    setErro('');
    try {
      await aoRestaurarDaNuvem?.();
      setSyncStatus('Dados restaurados da nuvem.');
    } catch (e) {
      setErro(e?.message || 'Falha ao restaurar.');
      setSyncStatus('');
    }
  };

  const adicionarCategoria = () => {
    const nome = (novoCategoria || '').trim();
    if (!nome) return;
    if (categorias.includes(nome)) return;
    setCategorias([...categorias, nome]);
    setNovoCategoria('');
  };

  const adicionarConta = () => {
    const nome = (novaConta || '').trim();
    if (!nome) return;
    if (contas.includes(nome)) return;
    setContas([...contas, nome]);
    setNovaConta('');
  };

  const salvarEdicaoCategoria = (idx) => {
    const nome = (valorEditCategoria || '').trim();
    if (!nome) return;
    const next = [...categorias];
    next[idx] = nome;
    setCategorias(next);
    setEditandoCategoria(null);
    setValorEditCategoria('');
  };

  const salvarEdicaoConta = (idx) => {
    const nome = (valorEditConta || '').trim();
    if (!nome) return;
    const next = [...contas];
    next[idx] = nome;
    setContas(next);
    setEditandoConta(null);
    setValorEditConta('');
  };

  const removerCategoria = (idx) => {
    if (categorias.length <= 1) return;
    setCategorias(categorias.filter((_, i) => i !== idx));
    setEditandoCategoria(null);
  };

  const removerConta = (idx) => {
    if (contas.length <= 1) return;
    setContas(contas.filter((_, i) => i !== idx));
    setEditandoConta(null);
  };

  const listaContasInvestimento = contasInvestimento || [];
  const adicionarContaInvestimento = () => {
    const nome = (novaContaInvestimento || '').trim();
    if (!nome) return;
    if (listaContasInvestimento.includes(nome)) return;
    setContasInvestimento([...listaContasInvestimento, nome]);
    setNovaContaInvestimento('');
  };
  const salvarEdicaoContaInvestimento = (idx) => {
    const nome = (valorEditContaInvestimento || '').trim();
    if (!nome) return;
    const next = [...listaContasInvestimento];
    next[idx] = nome;
    setContasInvestimento(next);
    setEditandoContaInvestimento(null);
    setValorEditContaInvestimento('');
  };
  const removerContaInvestimento = (idx) => {
    setContasInvestimento(listaContasInvestimento.filter((_, i) => i !== idx));
    setEditandoContaInvestimento(null);
  };

  const listaClientes = clientes || [];
  const adicionarCliente = () => {
    const nome = (novoCliente || '').trim();
    if (!nome) return;
    if (listaClientes.some((c) => (c.nome || c) === nome)) return;
    setClientes([...listaClientes, { id: gerarId('cli'), nome, telefone: '', endereco: '' }]);
    setNovoCliente('');
  };
  const salvarEdicaoCliente = (idx) => {
    const nome = (valorEditCliente || '').trim();
    if (!nome) return;
    const next = [...listaClientes];
    const antigo = next[idx];
    next[idx] = typeof antigo === 'object' && antigo !== null ? { ...antigo, nome } : { id: gerarId('cli'), nome, telefone: '', endereco: '' };
    setClientes(next);
    setEditandoCliente(null);
    setValorEditCliente('');
  };
  const removerCliente = (idx) => {
    setClientes(listaClientes.filter((_, i) => i !== idx));
    setEditandoCliente(null);
  };

  const listaStatus = statusLancamento || [];
  const adicionarStatus = () => {
    const label = (novoStatusLabel || '').trim();
    if (!label) return;
    const id = slugFromLabel(label);
    if (listaStatus.some((s) => s.id === id)) return;
    setStatusLancamento([...listaStatus, { id, label }]);
    setNovoStatusLabel('');
  };
  const salvarEdicaoStatus = (idx) => {
    const label = (valorEditStatusLabel || '').trim();
    if (!label) return;
    const existingId = listaStatus[idx]?.id;
    setStatusLancamento(listaStatus.map((s, i) => (i === idx ? { id: existingId, label } : s)));
    setEditandoStatus(null);
    setValorEditStatusLabel('');
  };
  const removerStatus = (idx) => {
    if (listaStatus.length <= 1) return;
    setStatusLancamento(listaStatus.filter((_, i) => i !== idx));
    setEditandoStatus(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Cartao>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4">Servidor</h3>
        <p className="text-slate-400 text-sm mb-4">
          Baixe o pacote do servidor para instalar em outro PC (Mac ou Windows). Extraia o zip, execute <code className="text-xs bg-slate-800 px-1 rounded">npm install</code> e depois <code className="text-xs bg-slate-800 px-1 rounded">npm start</code> ou use os launchers <code className="text-xs bg-slate-800 px-1 rounded">start-server.bat</code> / <code className="text-xs bg-slate-800 px-1 rounded">start-server.command</code>.
        </p>
        <a
          href="/vertexads-server.zip"
          download="vertexads-server.zip"
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <Download size={16} /> Baixar servidor
        </a>
      </Cartao>
      <Cartao>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4">Sincronização</h3>
        <p className="text-slate-400 text-sm mb-4">
          Os dados são guardados no seu dispositivo e copiados para a nuvem ao fechar o app. Ao abrir, o app
          sincroniza uma vez com a nuvem. Use &quot;Restaurar da nuvem&quot; para substituir os dados locais
          pelo backup (útil em outro dispositivo ou após perda de dados).
        </p>
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <Botao
            tipo="button"
            variante="ghost"
            classeNome="flex items-center gap-2 text-slate-400 hover:text-white"
            aoClicar={verificarServidor}
            desabilitado={serverChecking}
          >
            {serverChecking ? (
              <span className="animate-pulse">Verificando...</span>
            ) : (
              <>
                {serverStatus === 'ok' ? <Wifi size={16} className="text-emerald-400" /> : <WifiOff size={16} />}
                Verificar conexão com servidor
              </>
            )}
          </Botao>
          {serverStatus === 'ok' && <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Wifi size={14} /> Conectado</span>}
          {serverStatus === 'erro' && <span className="text-red-400 text-xs font-bold flex items-center gap-1"><WifiOff size={14} /> Desconectado</span>}
        </div>
        {serverMsg && <p className={`text-xs font-bold mb-3 ${serverStatus === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{serverMsg}</p>}
        {aoRestaurarDaNuvem && (
          <Botao
            tipo="button"
            variante="secondary"
            classeNome="flex items-center gap-2"
            aoClicar={handleRestaurar}
          >
            <RotateCcw size={16} /> Restaurar da nuvem
          </Botao>
        )}
        {syncStatus && <p className="mt-3 text-emerald-400 text-xs font-bold">{syncStatus}</p>}
        {erro && <p className="mt-3 text-red-400 text-xs font-bold">{erro}</p>}
      </Cartao>
      <Cartao>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4">Categorias</h3>
        <ul className="space-y-2 mb-4">
          {(categorias || []).map((nome, idx) => (
            <li key={`cat-${idx}`} className="flex items-center gap-2">
              {editandoCategoria === idx ? (
                <>
                  <input
                    type="text"
                    value={valorEditCategoria}
                    onChange={(e) => setValorEditCategoria(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCategoria(idx)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    autoFocus
                  />
                  <Botao variante="primary" classeNome="py-2 px-3" aoClicar={() => salvarEdicaoCategoria(idx)}>Salvar</Botao>
                  <Botao variante="ghost" classeNome="py-2 px-2" aoClicar={() => { setEditandoCategoria(null); setValorEditCategoria(''); }}>Cancelar</Botao>
                </>
              ) : (
                <>
                  <span className="flex-1 text-slate-200 text-sm">{nome}</span>
                  <button type="button" onClick={() => { setEditandoCategoria(idx); setValorEditCategoria(nome); }} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg" aria-label="Editar"><Pencil size={14} /></button>
                  <button type="button" onClick={() => removerCategoria(idx)} disabled={categorias.length <= 1} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg disabled:opacity-40" aria-label="Remover"><Trash2 size={14} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoCategoria}
            onChange={(e) => setNovoCategoria(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarCategoria()}
            placeholder="Nova categoria"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
          />
          <Botao variante="secondary" classeNome="flex items-center gap-1 py-2 px-4" aoClicar={adicionarCategoria}><Plus size={14} /> Adicionar</Botao>
        </div>
      </Cartao>
      <Cartao>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4">Contas</h3>
        <ul className="space-y-2 mb-4">
          {(contas || []).map((nome, idx) => (
            <li key={`conta-${idx}`} className="flex items-center gap-2">
              {editandoConta === idx ? (
                <>
                  <input
                    type="text"
                    value={valorEditConta}
                    onChange={(e) => setValorEditConta(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoConta(idx)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    autoFocus
                  />
                  <Botao variante="primary" classeNome="py-2 px-3" aoClicar={() => salvarEdicaoConta(idx)}>Salvar</Botao>
                  <Botao variante="ghost" classeNome="py-2 px-2" aoClicar={() => { setEditandoConta(null); setValorEditConta(''); }}>Cancelar</Botao>
                </>
              ) : (
                <>
                  <span className="flex-1 text-slate-200 text-sm">{nome}</span>
                  <button type="button" onClick={() => { setEditandoConta(idx); setValorEditConta(nome); }} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg" aria-label="Editar"><Pencil size={14} /></button>
                  <button type="button" onClick={() => removerConta(idx)} disabled={contas.length <= 1} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg disabled:opacity-40" aria-label="Remover"><Trash2 size={14} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={novaConta}
            onChange={(e) => setNovaConta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarConta()}
            placeholder="Nova conta"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
          />
          <Botao variante="secondary" classeNome="flex items-center gap-1 py-2 px-4" aoClicar={adicionarConta}><Plus size={14} /> Adicionar</Botao>
        </div>
      </Cartao>
      <Cartao>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4">Contas de investimento</h3>
        <p className="text-slate-500 text-xs mb-3">Opcional: selecione quais contas aparecem na aba Investimentos. Se vazio, todas as contas são exibidas.</p>
        <ul className="space-y-2 mb-4">
          {listaContasInvestimento.map((nome, idx) => (
            <li key={`conta-inv-${idx}`} className="flex items-center gap-2">
              {editandoContaInvestimento === idx ? (
                <>
                  <input
                    type="text"
                    value={valorEditContaInvestimento}
                    onChange={(e) => setValorEditContaInvestimento(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoContaInvestimento(idx)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    autoFocus
                  />
                  <Botao variante="primary" classeNome="py-2 px-3" aoClicar={() => salvarEdicaoContaInvestimento(idx)}>Salvar</Botao>
                  <Botao variante="ghost" classeNome="py-2 px-2" aoClicar={() => { setEditandoContaInvestimento(null); setValorEditContaInvestimento(''); }}>Cancelar</Botao>
                </>
              ) : (
                <>
                  <span className="flex-1 text-slate-200 text-sm">{nome}</span>
                  <button type="button" onClick={() => { setEditandoContaInvestimento(idx); setValorEditContaInvestimento(nome); }} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg" aria-label="Editar"><Pencil size={14} /></button>
                  <button type="button" onClick={() => removerContaInvestimento(idx)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg" aria-label="Remover"><Trash2 size={14} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={novaContaInvestimento}
            onChange={(e) => setNovaContaInvestimento(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarContaInvestimento()}
            placeholder="Nome da conta (ex.: NuInvest, Tesouro)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
          />
          <Botao variante="secondary" classeNome="flex items-center gap-1 py-2 px-4" aoClicar={adicionarContaInvestimento}><Plus size={14} /> Adicionar</Botao>
        </div>
      </Cartao>
      <Cartao>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4">Clientes</h3>
        <ul className="space-y-2 mb-4">
          {listaClientes.map((c, idx) => {
            const nome = typeof c === 'string' ? c : c.nome;
            return (
              <li key={`cli-${idx}`} className="flex items-center gap-2">
                {editandoCliente === idx ? (
                  <>
                    <input
                      type="text"
                      value={valorEditCliente}
                      onChange={(e) => setValorEditCliente(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCliente(idx)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      autoFocus
                    />
                    <Botao variante="primary" classeNome="py-2 px-3" aoClicar={() => salvarEdicaoCliente(idx)}>Salvar</Botao>
                    <Botao variante="ghost" classeNome="py-2 px-2" aoClicar={() => { setEditandoCliente(null); setValorEditCliente(''); }}>Cancelar</Botao>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-slate-200 text-sm">{nome}</span>
                    <button type="button" onClick={() => { setEditandoCliente(idx); setValorEditCliente(nome); }} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg" aria-label="Editar"><Pencil size={14} /></button>
                    <button type="button" onClick={() => removerCliente(idx)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg" aria-label="Remover"><Trash2 size={14} /></button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoCliente}
            onChange={(e) => setNovoCliente(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarCliente()}
            placeholder="Novo cliente"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
          />
          <Botao variante="secondary" classeNome="flex items-center gap-1 py-2 px-4" aoClicar={adicionarCliente}><Plus size={14} /> Adicionar</Botao>
        </div>
      </Cartao>
      <Cartao>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-4">Status de lançamento</h3>
        <p className="text-slate-500 text-xs mb-3">Usados no modal de lançamento (ex.: Pago, Previsto). Pelo menos um obrigatório.</p>
        <ul className="space-y-2 mb-4">
          {listaStatus.map((s, idx) => (
            <li key={s.id} className="flex items-center gap-2">
              {editandoStatus === idx ? (
                <>
                  <input
                    type="text"
                    value={valorEditStatusLabel}
                    onChange={(e) => setValorEditStatusLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoStatus(idx)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    placeholder="Label"
                    autoFocus
                  />
                  <Botao variante="primary" classeNome="py-2 px-3" aoClicar={() => salvarEdicaoStatus(idx)}>Salvar</Botao>
                  <Botao variante="ghost" classeNome="py-2 px-2" aoClicar={() => { setEditandoStatus(null); setValorEditStatusLabel(''); }}>Cancelar</Botao>
                </>
              ) : (
                <>
                  <span className="flex-1 text-slate-200 text-sm">{s.label}</span>
                  <button type="button" onClick={() => { setEditandoStatus(idx); setValorEditStatusLabel(s.label); }} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg" aria-label="Editar"><Pencil size={14} /></button>
                  <button type="button" onClick={() => removerStatus(idx)} disabled={listaStatus.length <= 1} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg disabled:opacity-40" aria-label="Remover"><Trash2 size={14} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoStatusLabel}
            onChange={(e) => setNovoStatusLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarStatus()}
            placeholder="Novo status (ex.: A vencer)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
          />
          <Botao variante="secondary" classeNome="flex items-center gap-1 py-2 px-4" aoClicar={adicionarStatus}><Plus size={14} /> Adicionar</Botao>
        </div>
      </Cartao>
    </div>
  );
}
