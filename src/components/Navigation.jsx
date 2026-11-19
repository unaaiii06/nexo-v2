import { Inbox, Sun, Columns3, CalendarDays, LayoutGrid, Plus, PanelLeftClose, PanelLeftOpen, Settings2 } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { dayProgress, inboxTasks } from '../store/selectors';
import { formatLongDate } from '../lib/dates';
import { useToday } from '../lib/hooks';
import { cx, haptic } from '../lib/utils';
import { ProgressBar } from './primitives';
import { useFeatures } from '../lib/features';
import AppLogo from './AppLogo';
import { useAuth } from '../store/auth';
import { MyAvatar, useProfileLook } from './Avatar';

export const NAV = [
  { id: 'inbox', label: 'Bandeja', long: 'Bandeja de entrada', icon: Inbox },
  { id: 'today', label: 'Hoy', long: 'Hoy', icon: Sun },
  { id: 'week', label: 'Semana', long: 'Semana', icon: Columns3 },
  { id: 'month', label: 'Mes', long: 'Mes', icon: CalendarDays },
  { id: 'areas', label: 'Áreas', long: 'Proyectos y áreas', icon: LayoutGrid },
];

/** Apartados visibles según Ajustes → Funciones («Hoy» siempre) */
export function visibleNav(f) {
  return NAV.filter((n) => n.id === 'today' || f[n.id]);
}

function Logo({ small }) {
  return <AppLogo size={small ? 30 : 34} />;
}

/** Sidebar flotante colapsable (iPad / escritorio) */
export function Sidebar() {
  const { state, actions } = useStore();
  const { view, setView, openEditor, setSettings } = useUI();
  const { user } = useAuth();
  const look = useProfileLook();
  const f = useFeatures();
  const nav = visibleNav(f);
  const today = useToday();
  const progress = dayProgress(state, today);
  const inboxCount = inboxTasks(state).length;
  const collapsed = state.settings.sidebarCollapsed;

  return (
    <aside
      className={cx(
        'glass fixed bottom-4 left-4 top-4 z-30 hidden flex-col rounded-[calc(28px*var(--rk))] p-3 transition-[width] duration-500 ease-spring md:flex',
        collapsed ? 'w-[76px]' : 'w-[264px]',
      )}
      style={{ top: 'max(16px, env(safe-area-inset-top))', left: 'max(16px, env(safe-area-inset-left))' }}
      aria-label="Navegación principal"
    >
      <div className={cx('flex items-center gap-3 px-1.5 pb-4 pt-1.5', collapsed && 'justify-center px-0')}>
        <Logo />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold tracking-tight">Nexo</p>
            <p className="truncate text-[12px] muted">{formatLongDate(today)}</p>
          </div>
        )}
      </div>

      {!collapsed && f.progress && (
        <div className="mb-4 rounded-2xl p-3.5 card">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="eyebrow">Progreso de hoy</span>
            <span className="text-[13px] font-semibold tabular-nums">{progress.pct}%</span>
          </div>
          <ProgressBar value={progress.pct} />
          <p className="mt-2 text-[12px] muted tabular-nums">
            {progress.done} de {progress.total} tareas
          </p>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id, { area: null })}
              className={cx(
                'pressable relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors duration-300',
                collapsed && 'justify-center px-0',
                active ? 'text-fg' : 'text-fg/60 hover:bg-fg/5 hover:text-fg',
              )}
              style={active ? { background: 'var(--card-hover)', boxShadow: 'var(--specular), inset 0 0 0 1px var(--hairline)' } : undefined}
              title={collapsed ? item.long : undefined}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 2} className={active ? 'text-accent' : ''} />
              {!collapsed && <span className="flex-1 text-left">{item.long}</span>}
              {item.id === 'inbox' && inboxCount > 0 && (
                <span
                  className={cx(
                    'rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-[18px] text-on-accent tabular-nums',
                    collapsed && 'absolute right-1.5 top-1',
                  )}
                >
                  {inboxCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => openEditor('task')}
        className={cx('btn btn-primary mb-2 w-full', collapsed && 'px-0')}
        title="Nueva captura"
      >
        <Plus size={18} strokeWidth={2.6} />
        {!collapsed && 'Nueva captura'}
      </button>
      <div className={cx('flex items-center', collapsed ? 'flex-col' : 'justify-between')}>
        <button
          type="button"
          onClick={() => setSettings(true)}
          className={cx('pressable flex min-h-[44px] min-w-0 items-center gap-2.5 rounded-xl px-1.5 text-left', !collapsed && 'flex-1')}
          title="Cuenta y ajustes"
        >
          <MyAvatar name={user?.name} size={30} />
          {!collapsed && (
            <span className="truncate text-[14px] font-semibold" style={{ color: look.nameColor || undefined }}>
              {user?.name}
            </span>
          )}
        </button>
        <button type="button" className="icon-btn muted" onClick={() => setSettings(true)} aria-label="Ajustes" title="Ajustes">
          <Settings2 size={19} />
        </button>
        <button
          type="button"
          className="icon-btn muted"
          onClick={() => actions.setSettings({ sidebarCollapsed: !collapsed })}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          title={collapsed ? 'Expandir' : 'Contraer'}
        >
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>
      </div>
    </aside>
  );
}

/** Tab Bar inferior de cristal (iPhone) con botón flotante + */
export function TabBar() {
  const { state } = useStore();
  const nav = visibleNav(useFeatures());
  const { view, setView, openEditor } = useUI();
  const inboxCount = inboxTasks(state).length;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic(10);
          openEditor('task');
        }}
        className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform duration-300 ease-spring active:scale-90 md:hidden"
        style={{
          right: 'max(18px, env(safe-area-inset-right))',
          bottom: 'calc(env(safe-area-inset-bottom) + 84px)',
          background: 'linear-gradient(145deg, rgb(var(--accent)), rgb(var(--accent-2)))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 30px rgb(var(--accent) / 0.45), 0 2px 6px rgba(0,0,0,0.25)',
        }}
        aria-label="Nueva captura"
      >
        <Plus size={26} strokeWidth={2.6} />
      </button>

      <nav
        className="glass fixed bottom-0 left-0 right-0 z-30 rounded-t-[calc(26px*var(--rk))] border-b-0 md:hidden"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
        aria-label="Navegación principal"
      >
        <div className="grid px-1 pt-1.5" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const active = view === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptic(6);
                  setView(item.id, { area: null });
                }}
                className={cx(
                  'relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 transition-colors duration-300 active:scale-95',
                  active ? 'text-accent' : 'text-fg/50',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon size={23} strokeWidth={active ? 2.3 : 1.9} />
                  {item.id === 'inbox' && inboxCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-[17px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[17px] text-white tabular-nums">
                      {inboxCount}
                    </span>
                  )}
                </span>
                <span className="text-[10.5px] font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
