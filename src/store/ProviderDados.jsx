import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import * as db from '../lib/db';
import * as auth from '../lib/auth';
import { pullFromCloud, pushToCloud, registerPushOnClose, isTauri } from '../lib/sync';
import { DEFAULT_CONTAS, getContasFromConfig, validarContas } from '../lib/contas';
import { normalizeClientes } from '../lib/clientes';
import { reaisParaCentavos, centavosParaReais } from '../lib/moeda';

const DEFAULT_CATEGORIAS = ['Serviços', 'Infraestrutura', 'Assinaturas', 'Geral', 'Vendas', 'Impostos', 'Marketing'];
const DEFAULT_STATUS_LANCAMENTO = [
  { id: 'pago', label: 'Pago' },
  { id: 'previsto', label: 'Previsto' }
];
const MIGRADO_KEY = 'VertexAds_migradoCentavos';

/** Valores > 100.000 provavelmente já estão em centavos (ex: 130000 = R$ 1.300). */
function pareceCentavos(val) {
  const n = Number(val);
  return !Number.isNaN(n) && n > 100000;
}

/** Migra valores de reais para centavos (uma vez). Evita reconverter dados já em centavos. */
function migrarParaCentavos(txs, recs, tauriInvoke) {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(MIGRADO_KEY)) {
    return { txs, recs };
  }
  const txsMig = txs.map((t) => ({
    ...t,
    value: t.value != null ? (pareceCentavos(t.value) ? Number(t.value) : reaisParaCentavos(t.value)) : 0
  }));
  const recsMig = recs.map((r) => ({
    ...r,
    valor: r.valor != null ? (pareceCentavos(r.valor) ? Number(r.valor) : reaisParaCentavos(r.valor)) : 0
  }));
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
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const hydrated = useRef(false);
  const lastPutTransacoesRef = useRef(Promise.resolve());
  const unregisterPushRef = useRef(null);

  const persistTransacoes = useCallback((next) => {
    if (!Array.isArray(next)) return;
    db.putTransacoes(next)
      .then(() => {
        if (!auth.getToken()) return;
        setSyncStatus('syncing');
        setSyncError(null);
        pushToCloud()
          .then((r) => {
            if (r?.ok === false) {
              setSyncStatus('error');
              setSyncError(r.error || `Falha ${r.status || ''}`);
              return;
            }
            return db.getConfig().then((c) => { setLastSyncedAt(c.lastSyncedAt); setSyncStatus('synced'); });
          })
          .catch((e) => { console.warn('[Sync] push falhou:', e?.message || e); setSyncStatus('error'); setSyncError(e?.message || 'Falha ao enviar'); });
      })
      .catch((e) => console.warn('Persist transacoes failed', e));
  }, []);
  const persistRecorrentes = useCallback((next) => {
    if (!Array.isArray(next)) return;
    db.putRecorrentes(next)
      .then(() => {
        if (!auth.getToken()) return;
        setSyncStatus('syncing');
        setSyncError(null);
        pushToCloud()
          .then((r) => {
            if (r?.ok === false) {
              setSyncStatus('error');
              setSyncError(r.error || `Falha ${r.status || ''}`);
              return;
            }
            return db.getConfig().then((c) => { setLastSyncedAt(c.lastSyncedAt); setSyncStatus('synced'); });
          })
          .catch((e) => { console.warn('[Sync] push falhou:', e?.message || e); setSyncStatus('error'); setSyncError(e?.message || 'Falha ao enviar'); });
      })
      .catch((e) => console.warn('Persist recorrentes failed', e));
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
          // Se tem token, puxa da nuvem PRIMEIRO para garantir dados atuais ao entrar na conta
          if (auth.getToken()) {
            try {
              await invoke('sync_pull', { token: auth.getToken() || undefined });
              if (cancelled) return;
              await lastPutTransacoesRef.current;
              if (cancelled) return;
              console.log('[Sync] pull OK – dados sincronizados com o servidor');
            } catch (e) {
              console.warn('[Sync] pull falhou (servidor offline ou sem token):', e?.message || e);
            }
          }
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
          hydrated.current = true;
        } catch (e) {
          console.warn('Tauri load failed', e);
        }
        setLoading(false);
        return;
      }
      try {
        let pullOk = true;
        if (auth.getToken()) {
          setSyncStatus('syncing');
          setSyncError(null);
          try {
            const r = await pullFromCloud();
            if (cancelled) return;
            if (r?.ok === false) {
              pullOk = false;
              setSyncStatus('error');
              setSyncError(r.error === 'auth' ? 'Sessão expirada.' : r.error || 'Falha ao sincronizar');
            }
          } catch (e) {
            pullOk = false;
            console.warn('[Sync] pull falhou (PWA):', e?.message || e);
            setSyncStatus('error');
            setSyncError(e?.message || 'Falha ao sincronizar');
          }
        }
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
        setLastSyncedAt(config.lastSyncedAt);
        if (auth.getToken() && pullOk) setSyncStatus('synced');
        unregisterPushRef.current = registerPushOnClose({
          onPushStart: () => setSyncStatus('syncing'),
          onPushEnd: () => {
            setSyncStatus('synced');
            db.getConfig().then((c) => setLastSyncedAt(c.lastSyncedAt));
          },
          onPushError: (e) => {
            setSyncStatus('error');
            setSyncError(e?.message || 'Falha ao enviar');
          },
          onVisibilityVisible: async () => {
            if (!auth.getToken()) return;
            setSyncStatus('syncing');
            setSyncError(null);
            try {
              const r = await pullFromCloud();
              if (r?.ok === false) {
                setSyncStatus('error');
                setSyncError(r.error === 'auth' ? 'Sessão expirada.' : r.error || 'Falha ao sincronizar');
                return;
              }
              await refreshFromDb();
              const cfg = await db.getConfig();
              setLastSyncedAt(cfg.lastSyncedAt);
              setSyncStatus('synced');
            } catch (e) {
              console.warn('[Sync] pull ao voltar falhou:', e?.message || e);
              setSyncStatus('error');
              setSyncError(e?.message || 'Falha ao sincronizar');
            }
          }
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      unregisterPushRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (isTauri()) return;
    const onOnline = () => setSyncStatus((s) => (s === 'offline' ? 'idle' : s));
    const onOffline = () => setSyncStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    if (!navigator.onLine) setSyncStatus('offline');
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
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
    refreshFromDb,
    syncStatus,
    lastSyncedAt,
    syncError,
    setSyncStatus,
    setSyncError,
    triggerPush: () => {
      setSyncStatus('syncing');
      setSyncError(null);
      return pushToCloud()
        .then((r) => {
          if (r?.ok === false) {
            setSyncStatus('error');
            setSyncError(r.error || `Falha ${r.status || ''}`);
            throw new Error(r.error || 'Push falhou');
          }
          return db.getConfig().then((c) => { setLastSyncedAt(c.lastSyncedAt); setSyncStatus('synced'); });
        })
        .catch((e) => { setSyncStatus('error'); setSyncError(e?.message || 'Falha ao enviar'); throw e; });
    },
    triggerPull: async () => {
      if (!auth.getToken()) return;
      setSyncStatus('syncing');
      setSyncError(null);
      try {
        const r = await pullFromCloud();
        if (r?.ok === false) {
          setSyncStatus('error');
          setSyncError(r.error === 'auth' ? 'Sessão expirada. Faça login.' : r.error || 'Falha ao sincronizar');
          return;
        }
        await refreshFromDb();
        const cfg = await db.getConfig();
        setLastSyncedAt(cfg.lastSyncedAt);
        setSyncStatus('synced');
      } catch (e) {
        setSyncStatus('error');
        setSyncError(e?.message || 'Falha ao sincronizar');
        throw e;
      }
    }
  };

  return <ContextoDados.Provider value={value}>{children}</ContextoDados.Provider>;
}

export function useDados() {
  const ctx = useContext(ContextoDados);
  if (!ctx) throw new Error('useDados must be used within ProviderDados');
  return ctx;
}
