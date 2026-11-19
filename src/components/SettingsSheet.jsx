import { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, ShieldCheck, Eraser, LogOut, RefreshCw, History, Smartphone } from 'lucide-react';
import Sheet from './Sheet';
import Avatar from './Avatar';
import TelegramCard from './TelegramCard';
import { syncLabel } from './SyncBadge';
import { ThemeCards } from './ThemePicker';
import { useStore, normalizeState } from '../store/AppStore';
import { useAuth } from '../store/auth';
import { useUI } from '../store/ui';
import { listV1Profiles } from '../lib/legacy';
import { todayKey } from '../lib/dates';
import { cx } from '../lib/utils';

function Row({ icon: Icon, title, text, onClick, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('pressable flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left', danger && 'text-danger')}
    >
      <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', danger ? 'bg-danger/15' : 'bg-accent/15 text-accent')}>
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{title}</span>
        {text && <span className="block text-[13px] muted">{text}</span>}
      </span>
      {children}
    </button>
  );
}

export default function SettingsSheet() {
  const { settings, setSettings, showToast } = useUI();
  const { state, actions, sync } = useStore();
  const { user, isCloud, signOut, rename } = useAuth();
  const fileRef = useRef(null);
  const [name, setName] = useState(user?.name || '');
  const [confirm, setConfirm] = useState(null); // 'seed' | 'empty' | 'logout' | 'v1:<id>'
  const v1 = settings ? listV1Profiles() : [];

  const ask = (what, run) => {
    if (confirm !== what) {
      setConfirm(what);
      return;
    }
    setConfirm(null);
    run();
  };

  function close() {
    setConfirm(null);
    setSettings(false);
  }

  async function saveName() {
    if (!name.trim() || name.trim() === user.name) return;
    try {
      await rename(name);
      showToast('Nombre actualizado');
    } catch (err) {
      showToast(err.message);
    }
  }

  async function exportData() {
    const { _sync, ...data } = state;
    const payload = { app: 'nexo', version: state.version, exportedAt: new Date().toISOString(), data };
    const fname = `nexo-${(user?.name || 'copia').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '')}-${todayKey()}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    try {
      const file = new File([blob], fname, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
        await navigator.share({ files: [file], title: 'Copia de Nexo' });
        showToast('Copia de seguridad lista');
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('Copia de seguridad descargada');
  }

  function importState(raw, label) {
    const next = normalizeState(raw);
    next.settings = { ...next.settings, theme: state.settings.theme, sidebarCollapsed: state.settings.sidebarCollapsed };
    actions.replaceAll(next);
    showToast(`${label} · ${next.tasks.length} tareas${isCloud ? ' · sincronizando…' : ''}`);
    close();
  }

  async function importFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      importState(JSON.parse(await file.text()), 'Copia importada');
    } catch (err) {
      showToast(`No se pudo importar: ${err.message || 'archivo no válido'}`);
    }
  }

  return (
    <Sheet open={settings} onClose={close} title="Ajustes" size="md">
      <div className="space-y-6">
        {/* Cuenta */}
        <section>
          <p className="eyebrow mb-2.5">Cuenta</p>
          <div className="rounded-2xl p-4 card">
            <div className="flex items-center gap-3">
              <Avatar name={name || user?.name} size={52} />
              <div className="min-w-0 flex-1">
                <input
                  className="field !py-2 text-[17px] font-semibold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  placeholder="Tu nombre"
                  autoCapitalize="words"
                  enterKeyHint="done"
                  aria-label="Tu nombre"
                />
                {user?.email && <p className="mt-1 truncate px-1 text-[13px] muted">{user.email}</p>}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--field)' }}>
              <span
                className={cx(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  sync.phase === 'synced' ? 'bg-ok' : sync.phase === 'error' ? 'bg-danger' : sync.phase === 'offline' ? 'bg-warn' : 'bg-fg/30',
                )}
              />
              <span className="min-w-0 flex-1 text-[13px]">
                <span className="block font-medium">{syncLabel(sync)}</span>
                {sync.at && sync.phase === 'synced' && (
                  <span className="block muted">Última vez: {new Date(sync.at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </span>
              {isCloud && (
                <button type="button" onClick={sync.syncNow} className="icon-btn !h-9 !w-9 muted" aria-label="Sincronizar ahora">
                  <RefreshCw size={16} className={cx(sync.phase === 'syncing' && 'animate-spin')} />
                </button>
              )}
            </div>

            {isCloud && (
              <button
                type="button"
                onClick={() =>
                  ask('logout', async () => {
                    close();
                    await signOut();
                  })
                }
                className={cx('btn btn-ghost mt-3 w-full', confirm === 'logout' && 'text-danger')}
              >
                <LogOut size={16} />
                {confirm === 'logout' ? (sync.pending ? `Hay ${sync.pending} cambios sin subir. ¿Salir igualmente?` : 'Toca de nuevo para cerrar sesión') : 'Cerrar sesión'}
              </button>
            )}
          </div>
        </section>

        {/* Telegram */}
        <section>
          <p className="eyebrow mb-2.5">Recordatorios por Telegram</p>
          <TelegramCard />
        </section>

        <section>
          <p className="eyebrow mb-2.5">Tema de este dispositivo</p>
          <ThemeCards />
        </section>

        {/* Datos */}
        <section>
          <p className="eyebrow mb-2.5">Datos</p>
          <div className="divide-hairline overflow-hidden rounded-2xl card">
            {v1.map((p) => (
              <Row
                key={p.id}
                icon={History}
                title={confirm === `v1:${p.id}` ? 'Toca de nuevo para importar' : `Importar «${p.name}» de Nexo 1`}
                text={confirm === `v1:${p.id}` ? 'Reemplaza los datos de tu cuenta por los de Nexo 1' : `${p.tasks} tareas guardadas en este navegador`}
                onClick={() => ask(`v1:${p.id}`, () => importState(p.data, `Importado de Nexo 1 (${p.name})`))}
              />
            ))}
            <Row icon={Upload} title="Importar copia (.json)" text="También sirve una copia exportada desde Nexo 1" onClick={() => fileRef.current?.click()} />
            <Row icon={Download} title="Exportar copia de seguridad" text="Descarga un .json con todos tus datos" onClick={exportData} />
            <Row
              icon={RotateCcw}
              title={confirm === 'seed' ? 'Toca de nuevo para confirmar' : 'Cargar datos de ejemplo'}
              text={confirm === 'seed' ? 'Se reemplazarán tus datos en todos tus dispositivos' : 'Para explorar la app con datos de demostración'}
              onClick={() =>
                ask('seed', () => {
                  actions.resetSeed(state.settings);
                  close();
                  showToast('Datos de ejemplo cargados');
                })
              }
            />
            <Row
              icon={Eraser}
              danger
              title={confirm === 'empty' ? 'Toca de nuevo para confirmar' : 'Empezar de cero'}
              text={confirm === 'empty' ? 'Se borrará todo, también en tus otros dispositivos' : 'Borra tareas, hitos y objetivos'}
              onClick={() =>
                ask('empty', () => {
                  actions.resetEmpty(state.settings);
                  close();
                  showToast('Todo limpio. ¡A empezar!');
                })
              }
            />
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importFile} />
        </section>

        <section className="space-y-3 rounded-2xl p-4 card">
          <div className="flex gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" />
            <p className="text-[13px] muted">
              {isCloud
                ? 'Tus datos se guardan en este dispositivo y en tu cuenta. Entra con la misma cuenta en el iPhone y en el Mac y se sincronizan solos, también sin conexión (se suben al volver). Solo tú puedes verlos.'
                : 'Modo local: los datos se guardan solo en este dispositivo.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Smartphone size={18} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[13px] muted">
              Para instalarla en el iPhone: ábrela en Safari → Compartir → <b className="text-fg">Añadir a pantalla de inicio</b>.
            </p>
          </div>
        </section>
        <p className="pb-2 text-center text-[12px] faint">Nexo 2 · {state.tasks.length} tareas</p>
      </div>
    </Sheet>
  );
}
