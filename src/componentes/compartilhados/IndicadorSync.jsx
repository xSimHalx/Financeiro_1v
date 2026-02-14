import React from 'react';
import { Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { useDados } from '../../store/ProviderDados';
import { isTauri } from '../../lib/sync';

function formatarTempoAtraso(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/**
 * Indicador de status de sincronização com a nuvem.
 * Mostra: Sincronizado há X min, Sincronizando..., Offline, ou Erro.
 */
export function IndicadorSync() {
  const { syncStatus, lastSyncedAt, syncError } = useDados();
  if (isTauri()) return null;

  let icon;
  let label;
  let title;
  let className = 'text-slate-500';

  switch (syncStatus) {
    case 'syncing':
      icon = <Loader2 size={14} className="animate-spin" />;
      label = 'Sincronizando...';
      title = 'Sincronizando com a nuvem';
      break;
    case 'synced':
      icon = <Cloud size={14} />;
      label = lastSyncedAt ? `Há ${formatarTempoAtraso(lastSyncedAt)}` : 'Sincronizado';
      title = lastSyncedAt ? `Sincronizado há ${formatarTempoAtraso(lastSyncedAt)}` : 'Sincronizado';
      className = 'text-emerald-500';
      break;
    case 'offline':
      icon = <CloudOff size={14} />;
      label = 'Offline';
      title = 'Sem conexão. Alterações serão enviadas quando houver conexão.';
      className = 'text-amber-500';
      break;
    case 'error':
      icon = <AlertCircle size={14} />;
      label = 'Erro';
      title = syncError ? `Erro: ${syncError}` : 'Falha ao sincronizar';
      className = 'text-red-400';
      break;
    default:
      icon = <Cloud size={14} />;
      label = '—';
      title = 'Status de sincronização';
  }

  return (
    <span
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${className}`}
      title={title}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
