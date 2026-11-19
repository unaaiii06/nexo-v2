import { Search, Moon, MoonStar, Sun, Sunrise, Sunset } from 'lucide-react';
import { useMemo } from 'react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { dayProgress } from '../store/selectors';
import { formatLongDate, formatShortDate, formatWeekdayShort, toKey } from '../lib/dates';
import { personalGreeting, dayBand } from '../lib/greetings';
import { useAuth } from '../store/auth';
import Avatar from './Avatar';
import SyncBadge from './SyncBadge';
import { useNow } from '../lib/hooks';
import { ThemeOrbs } from './ThemePicker';
import { NAV } from './Navigation';
import { ProgressRing } from './primitives';

export default function Header() {
  const { state } = useStore();
  const { view, setSpotlight, setSettings } = useUI();
  const { user } = useAuth();
  const now = useNow();
  const current = NAV.find((n) => n.id === view);
  const progress = dayProgress(state);
  const name = user?.name || '';
  const band = dayBand(now);
  const allDone = progress.total > 0 && progress.done === progress.total;
  // Se recalcula al cambiar de franja, de persona o al completar el día (no cada minuto)
  const message = useMemo(
    () => personalGreeting({ name, date: now, progress: allDone ? progress : undefined }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, band, allDone, toKey(now)],
  );
  const BandIcon = { madrugada: MoonStar, temprano: Sunrise, manana: Sun, mediodia: Sun, tarde: Sunset, noche: Moon }[band];
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return (
    <header className="relative z-20 pt-safe">
      <p key={message} className="flex items-start gap-1.5 pt-3 text-[15px] font-semibold leading-snug text-fg/85 animate-fade-in md:pt-6 md:text-[16px]">
        <BandIcon size={16} className="mt-[2px] shrink-0 text-accent" aria-hidden="true" />
        <span>{message}</span>
      </p>
      <div className="flex items-end justify-between gap-3 pb-4 pt-1">
        <div className="min-w-0">
          <h1 className="flex items-baseline gap-2.5 text-[30px] font-bold leading-tight tracking-tight md:text-[34px]">
            <span className="truncate md:hidden">{current?.label}</span>
            <span className="hidden truncate md:inline">{current?.long}</span>
            <span className="shrink-0 whitespace-nowrap text-[13px] font-medium tracking-normal tabular-nums muted md:text-[14px]">
              <span className="md:hidden">
                {formatWeekdayShort(toKey(now))} {formatShortDate(toKey(now))}
              </span>
              <span className="hidden md:inline">{formatLongDate(toKey(now))}</span>
            </span>
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {/* Mini anillo de progreso del día (solo iPhone, donde no hay sidebar) */}
          <div className="mr-1 md:hidden" title={`Progreso de hoy: ${progress.pct}%`}>
            <ProgressRing value={progress.pct} size={34} stroke={4}>
              <span className="text-[9px] font-bold tabular-nums">{progress.pct}</span>
            </ProgressRing>
          </div>
          <button
            type="button"
            onClick={() => setSpotlight(true)}
            className="icon-btn card md:w-auto md:gap-2 md:rounded-full md:px-3.5"
            aria-label="Buscar"
          >
            <Search size={18} />
            <span className="hidden text-[14px] muted md:inline">Buscar</span>
            <kbd className="hidden rounded-md px-1.5 py-0.5 text-[11px] font-medium muted md:inline" style={{ background: 'var(--field)' }}>
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
          <div className="hidden lg:block">
            <ThemeOrbs />
          </div>
          <SyncBadge />
          <button type="button" onClick={() => setSettings(true)} className="icon-btn" aria-label={`Cuenta y ajustes de ${name}`} title="Cuenta y ajustes">
            <Avatar name={name} size={38} />
          </button>
        </div>
      </div>
    </header>
  );
}
