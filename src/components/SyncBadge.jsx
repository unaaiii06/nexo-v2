import { Cloud, CloudOff, RefreshCw, AlertTriangle, HardDrive } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { cx } from '../lib/utils';

export function syncLabel(sync) {
  switch (sync.phase) {
    case 'local':
      return 'Modo local (sin sincronizar)';
    case 'offline':
      return sync.pending ? `Sin conexión · ${sync.pending} cambios pendientes` : 'Sin conexión · se sincronizará al volver';
    case 'syncing':
    case 'starting':
      return 'Sincronizando…';
    case 'error':
      return `Error al sincronizar${sync.message ? `: ${sync.message}` : ''}`;
    default:
      return sync.pending ? `${sync.pending} cambios por subir` : 'Sincronizado';
  }
}

/** Indicador de sincronización en la cabecera */
export default function SyncBadge() {
  const { sync } = useStore();
  const { setSettings } = useUI();
  const Icon =
    sync.phase === 'local' ? HardDrive : sync.phase === 'offline' ? CloudOff : sync.phase === 'error' ? AlertTriangle : sync.phase === 'synced' ? Cloud : RefreshCw;
  const color = sync.phase === 'error' ? 'text-danger' : sync.phase === 'offline' ? 'text-warn' : sync.phase === 'synced' ? 'text-ok' : 'muted';
  return (
    <button type="button" onClick={() => setSettings(true)} className={cx('icon-btn !w-9', color)} title={syncLabel(sync)} aria-label={syncLabel(sync)}>
      <Icon size={18} className={cx((sync.phase === 'syncing' || sync.phase === 'starting') && 'animate-spin')} />
    </button>
  );
}
