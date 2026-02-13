import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import * as db from '../lib/db';
import * as auth from '../lib/auth';
import { pullFromCloud, registerPushOnClose, isTauri } from '../lib/sync';
import { DEFAULT_CONTAS, getContasFromConfig, validarContas } from '../lib/contas';
import { normalizeClientes } from '../lib/clientes';
import { reaisParaCentavos, centavosParaReais } from '../lib/moeda';

const DEFAULT_CATEGORIAS = ['Serviços', 'Infraestrutura', 'Assinaturas', 'Geral', 'Vendas', 'Impostos', 'Marketing'];
const DEFAULT_STATUS_LANCAMENTO = [
  { id: 'pago', label: 'Pago' },
  { id: 'previsto', label: 'Previsto' }
];
const MIGRADO_KEY = 'VertexAds_migradoCentavos';

/** Migra valores de reais para centavos (uma vez). Dados existentes = reais. */
function migrarParaCentavos(txs, recs, tauriInvoke) {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(MIGRADO_KEY)) {
    return { txs, recs };
  }
  const txsMig = txs.map((t) => ({ ...t, value: t.value != null ? reaisParaCentavos(t.value) : 0 }));
  const recsMig = recs.map((r) => ({ ...r, valor: r.valor != null ? reaisParaCentavos(r.valor) : 0 }));
  localStorage.setItem(MIGRADO_KEY, '1');
  if (tauriInvoke && txsMig.length > 0) tauriInvoke('put_transacoes', txsMig).catch(() => {});
  if (tauriInvoke && recsMig.length > 0) tauriInvoke('put_recorrentes', recsMig).catch(() => {});
  return { txs: txsMig, recs: recsMig };
}

const ContextoDados = createContext(null);

/** Remove recorrência de exemplo/demo que não deve aparecer para o usuário */
function filtrarRecorrentesMock(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter(
    (r) =>
      !(
        r.titulo &&
        String(r.titulo).toUpperCase().includes('CONTADOR MENSAL') &&
        (Number(r.valor) === 35000 || Number(r.valor) === 350) && // 350 reais = 35000 centavos (ou legado)
        Number(r.diaVencimento) === 5
      )
  );
}

/** Em Tauri (withGlobalTauri), invoke vem do global; evita que o Vite resolva @tauri-apps/api no PWA. */
function getTauriInvoke() {
  return typeof window !== 'undefined' && window.__TAURI__?.core?.invoke;
}

export function ProviderDados({ children }) {
  const [transacoes, setTransacoesState] = useState([]);
  const [recorrentes, setRecorrentesState] = useState([]);
  const [categorias, setCategorias] = useState(DEFAULT_CATEGORIAS);
  const [contas, setContas] = useState(DEFAULT_CONTAS);
  const [contasInvestimento, setContasInvestimentoState] = useState([]);
  const [clientes, setClientesState] = useState([]);
  const [statusLancamento, setStatusLancamentoState] = useState(DEFAULT_STATUS_LANCAMENTO);
  const [loading, setLoading] = useState(true);
  const hydrated = useRef(false);
  const lastPutTransacoesRef = useRef(Promise.resolve());

  const persistTransacoes = useCallback((next) => {
    if (!Array.isArray(next)) return;
    db.putTransacoes(next).catch((e) => console.warn('Persist transacoes failed', e));
  }, []);
  const persistRecorrentes = useCallback((next) => {
    if (!Array.isArray(next)) return;
    db.putRecorrentes(next).catch((e) => console.warn('Persist recorrentes failed', e));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isTauri()) {
        try {
          const invoke = getTauriInvoke();
          if (!invoke) throw new Error('Tauri core not available');
          await lastPutTransacoesRef.current;
          if (cancelled) return;
          const [txs, recs, config] = await Promise.all([
            invoke('get_transacoes').then((r) => r || []),
            invoke('get_recorrentes').then((r) => r || []),
            invoke('get_config').then((r) => r || {})
          ]);
          if (cancelled) return;
          const { txs: txsMig, recs: recsMig } = migrarParaCentavos(txs || [], recs || [], getTauriInvoke());
          setTransacoesState(Array.isArray(txsMig) ? txsMig : []);
          setRecorrentesState(filtrarRecorrentesMock(Array.isArray(recsMig) ? recsMig : []));
          setCategorias(config?.categorias?.length ? config.categorias : DEFAULT_CATEGORIAS);
          setContas(getContasFromConfig(config || {}));
          setContasInvestimentoState(Array.isArray(config?.contasInvestimento) ? config.contasInvestimento : []);
          setClientesState(normalizeClientes(config?.clientes || []));
          setStatusLancamentoState((config?.statusLancamento ?? []).length ? config.statusLancamento : DEFAULT_STATUS_LANCAMENTO);
          try {
            await invoke('sync_pull', { token: auth.getToken() || undefined });
            if (cancelled) return;
            await lastPutTransacoesRef.current;
            if (cancelled) return;
            const [txs2, recs2, config2] = await Promise.all([
              invoke('get_transacoes').then((r) => r || []),
              invoke('get_recorrentes').then((r) => r || []),
              invoke('get_config').then((r) => r || {})
            ]);
            const { txs: txs2Mig, recs: recs2Mig } = migrarParaCentavos(txs2 || [], recs2 || [], getTauriInvoke());
            setTransacoesState(Array.isArray(txs2Mig) ? txs2Mig : []);
            setRecorrentesState(filtrarRecorrentesMock(Array.isArray(recs2Mig) ? recs2Mig : []));
            if (config2?.categorias?.length) setCategorias(config2.categorias);
            if (config2?.contas?.length) setContas(validarContas(config2.contas));
            if (Array.isArray(config2?.contasInvestimento)) setContasInvestimentoState(config2.contasInvestimento);
            if (config2?.clientes?.length) setClientesState(normalizeClientes(config2.clientes));
            if ((config2?.statusLancamento ?? []).length) setStatusLancamentoState(config2.statusLancamento);
            console.log('[Sync] pull OK – dados sincronizados com o servidor');
          } catch (e) {
            console.warn('[Sync] pull falhou (servidor offline ou sem token):', e?.message || e);
          }
          hydrated.current = true;
        } catch (e) {
          console.warn('Tauri load failed', e);
        }
        setLoading(false);
        return;
      }
      try {
        const [txs, recs, config] = await Promise.all([
          db.getAllTransacoes(true),
          db.getAllRecorrentes(),
          db.getConfig()
        ]);
        if (cancelled) return;
        const { txs: txsMig, recs: recsMig } = migrarParaCentavos(txs, recs);
        setTransacoesState(txsMig);
        setRecorrentesState(filtrarRecorrentesMock(recsMig));
        setCategorias(config.categorias || DEFAULT_CATEGORIAS);
        setContas(getContasFromConfig(config));
        setContasInvestimentoState(Array.isArray(config.contasInvestimento) ? config.contasInvestimento : []);
        setClientesState(normalizeClientes(config.clientes || []));
        setStatusLancamentoState((config.statusLancamento ?? []).length ? config.statusLancamento : DEFAULT_STATUS_LANCAMENTO);
        hydrated.current = true;
        try {
          await pullFromCloud();
          if (cancelled) return;
          const [txs2, recs2, config2] = await Promise.all([
            db.getAllTransacoes(true),
            db.getAllRecorrentes(),
            db.getConfig()
          ]);
          const { txs: txs2Mig, recs: recs2Mig } = migrarParaCentavos(txs2, recs2);
          setTransacoesState(txs2Mig);
          setRecorrentesState(filtrarRecorrentesMock(recs2Mig));
          if (config2.categorias?.length) setCategorias(config2.categorias);
          if (config2.contas?.length) setContas(validarContas(config2.contas));
          if (Array.isArray(config2.contasInvestimento)) setContasInvestimentoState(config2.contasInvestimento);
          if ((config2.clientes ?? []).length) setClientesState(normalizeClientes(config2.clientes));
          if ((config2.statusLancamento ?? []).length) setStatusLancamentoState(config2.statusLancamento);
        } catch (e) {
          console.warn('[Sync] pull falhou (PWA):', e?.message || e);
        }
        registerPushOnClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (isTauri()) {
      const invoke = getTauriInvoke();
      if (invoke) {
        lastPutTransacoesRef.current = lastPutTransacoesRef.current
          .then(() => invoke('put_transacoes', transacoes))
          .catch(() => {});
      }
      return;
    }
    if (transacoes.length === 0) return;
    persistTransacoes(transacoes);
  }, [transacoes, persistTransacoes]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (isTauri()) {
      const invoke = getTauriInvoke();
      if (invoke) invoke('put_recorrentes', recorrentes || []).catch(() => {});
      return;
    }
    if (recorrentes.length === 0) return;
    persistRecorrentes(recorrentes);
  }, [recorrentes, persistRecorrentes]);

  // Tauri: salva ao perder foco (minimizar/trocar app) para não perder dados ao fechar
  useEffect(() => {
    if (!isTauri() || !hydrated.current) return;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      const invoke = getTauriInvoke();
      if (invoke) {
        invoke('put_transacoes', transacoes).catch(() => {});
        invoke('put_recorrentes', recorrentes || []).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [transacoes, recorrentes]);

  const setTransacoes = useCallback((updaterOrValue) => {
    setTransacoesState((prev) => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      return next;
    });
  }, []);
  const setRecorrentes = useCallback((updaterOrValue) => {
    setRecorrentesState((prev) => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      return next;
    });
  }, []);

  const excluirDefinitivamente = useCallback(async (id) => {
    if (isTauri()) {
      try {
        const invoke = getTauriInvoke();
        if (invoke) await invoke('delete_transacao', { id });
        setTransacoesState((prev) => prev.filter((t) => t.id !== id));
      } catch (_) {}
      return;
    }
    await db.deleteTransacao(id);
    setTransacoesState((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshFromDb = useCallback(async () => {
    const [txs, recs, config] = await Promise.all([
      db.getAllTransacoes(true),
      db.getAllRecorrentes(),
      db.getConfig()
    ]);
    const { txs: txsMig, recs: recsMig } = migrarParaCentavos(txs, recs);
    setTransacoesState(txsMig);
    setRecorrentesState(filtrarRecorrentesMock(recsMig));
    if (config.categorias?.length) setCategorias(config.categorias);
    if (config.contas?.length) setContas(validarContas(config.contas));
    if (Array.isArray(config.contasInvestimento)) setContasInvestimentoState(config.contasInvestimento);
    if ((config.clientes ?? []).length) setClientesState(normalizeClientes(config.clientes));
    if ((config.statusLancamento ?? []).length) setStatusLancamentoState(config.statusLancamento);
  }, []);

  const value = {
    transacoes,
    setTransacoes,
    recorrentes,
    setRecorrentes,
    categorias,
    contas,
    setCategorias: (v) => {
      setCategorias(v);
      if (isTauri()) {
        const invoke = getTauriInvoke();
        if (invoke) invoke('set_config', { key: 'categorias', value: JSON.stringify(v) }).catch(() => {});
      } else {
        db.setConfig({ categorias: v }).catch(() => {});
      }
    },
    setContas: (v) => {
      const validas = validarContas(v);
      setContas(validas);
      if (isTauri()) {
        const invoke = getTauriInvoke();
        if (invoke) invoke('set_config', { key: 'contas', value: JSON.stringify(validas) }).catch(() => {});
      } else {
        db.setConfig({ contas: validas }).catch(() => {});
      }
    },
    contasInvestimento,
    setContasInvestimento: (v) => {
      const arr = Array.isArray(v) ? v : [];
      setContasInvestimentoState(arr);
      if (isTauri()) {
        const invoke = getTauriInvoke();
        if (invoke) invoke('set_config', { key: 'contasInvestimento', value: JSON.stringify(arr) }).catch(() => {});
      } else {
        db.setConfig({ contasInvestimento: arr }).catch(() => {});
      }
    },
    clientes,
    setClientes: (v) => {
      const arr = normalizeClientes(Array.isArray(v) ? v : []);
      setClientesState(arr);
      if (isTauri()) {
        const invoke = getTauriInvoke();
        if (invoke) invoke('set_config', { key: 'clientes', value: JSON.stringify(arr) }).catch(() => {});
      } else {
        db.setConfig({ clientes: arr }).catch(() => {});
      }
    },
    statusLancamento,
    setStatusLancamento: (v) => {
      const arr = Array.isArray(v) && v.length > 0 ? v : DEFAULT_STATUS_LANCAMENTO;
      setStatusLancamentoState(arr);
      if (isTauri()) {
        const invoke = getTauriInvoke();
        if (invoke) invoke('set_config', { key: 'statusLancamento', value: JSON.stringify(arr) }).catch(() => {});
      } else {
        db.setConfig({ statusLancamento: arr }).catch(() => {});
      }
    },
    loading,
    excluirDefinitivamente,
    refreshFromDb
  };

  return <ContextoDados.Provider value={value}>{children}</ContextoDados.Provider>;
}

export function useDados() {
  const ctx = useContext(ContextoDados);
  if (!ctx) throw new Error('useDados must be used within ProviderDados');
  return ctx;
}
