import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, Plus, CalendarClock, Wand2, Archive, Inbox as InboxIcon, Pencil } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { dayLoad, sortTasks, tasksOn, weekBacklog, weekProgress } from '../store/selectors';
import { addDays, formatShortDate, formatWeekdayShort, startOfWeek, weekDays, WEEKDAY_INITIALS, fromKey, formatDuration } from '../lib/dates';
import { useToday } from '../lib/hooks';
import { cx, DAY_CAPACITY_MIN, haptic } from '../lib/utils';
import TaskRow from '../components/TaskRow';
import { ProgressBar, ProgressRing } from '../components/primitives';
import { useFeatures } from '../lib/features';
import WeeklyReview from './WeeklyReview';

export default function WeekView() {
  const f = useFeatures();
  const { state } = useStore();
  const { setReview } = useUI();
  const today = useToday();
  const [monday, setMonday] = useState(() => startOfWeek(today));
  const days = weekDays(monday);
  const progress = weekProgress(state, monday);
  const backlog = sortTasks(weekBacklog(state, monday));
  const isCurrent = monday === startOfWeek(today);
  const focus = state.weekFocus[monday];
  const scroller = useRef(null);

  // En móvil, centra el día de hoy en el carrusel
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const idx = days.indexOf(today);
    const col = el.children[idx >= 0 ? idx : 0];
    if (col) {
      const delta = col.getBoundingClientRect().left - el.getBoundingClientRect().left;
      el.scrollTo({ left: el.scrollLeft + delta - (window.innerWidth < 768 ? 16 : 0), behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monday]);

  const rangeLabel = `${formatShortDate(days[0])} – ${formatShortDate(days[6])}`;

  return (
    <div className="space-y-4">
      {/* Cabecera de la semana */}
      <section className="glass flex flex-wrap items-center gap-4 rounded-[calc(28px*var(--rk))] p-4 md:p-5">
        <ProgressRing value={progress.pct} size={64} stroke={7}>
          <span className="text-[14px] font-bold tabular-nums">{progress.pct}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <button type="button" className="icon-btn !h-9 !w-9" onClick={() => setMonday(addDays(monday, -7))} aria-label="Semana anterior">
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate text-[17px] font-semibold tracking-tight tabular-nums">{rangeLabel}</p>
              <p className="text-[12px] muted">{isCurrent ? 'Esta semana' : monday < startOfWeek(today) ? 'Semana pasada' : 'Próximamente'}</p>
            </div>
            <button type="button" className="icon-btn !h-9 !w-9" onClick={() => setMonday(addDays(monday, 7))} aria-label="Semana siguiente">
              <ChevronRight size={18} />
            </button>
            {!isCurrent && (
              <button type="button" className="chip ml-1" onClick={() => setMonday(startOfWeek(today))}>
                Hoy
              </button>
            )}
          </div>
          <p className="mt-1 px-2 text-[12px] muted tabular-nums">
            {progress.done} de {progress.total} tareas completadas
          </p>
        </div>
        {f.weeklyReview && (
        <button type="button" onClick={() => setReview(true)} className="btn btn-primary w-full sm:w-auto">
          <Wand2 size={17} /> Revisión semanal
        </button>
        )}
      </section>

      {/* Enfoque de la semana */}
      {f.weekFocus && <FocusBanner monday={monday} focus={focus} />}

      {/* Kanban de 7 columnas: carrusel con scroll-snap en móvil */}
      <div
        ref={scroller}
        className="no-scrollbar -mx-4 grid snap-x snap-mandatory auto-cols-[84%] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 xs:auto-cols-[78%] sm:auto-cols-[46%] md:mx-0 md:auto-cols-[minmax(230px,1fr)] md:px-0 2xl:grid-flow-row 2xl:grid-cols-7"
        style={{ scrollPaddingLeft: 16 }}
      >
        {days.map((d) => (
          <DayColumn key={d} date={d} today={today} monday={monday} />
        ))}
      </div>

      {/* Backlog semanal */}
      <section className="glass rounded-[calc(28px*var(--rk))] p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Archive size={15} />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight">Sin día asignado</h2>
              <p className="text-[13px] muted">Backlog semanal · {backlog.length} tareas</p>
            </div>
          </div>
          <BacklogAdd monday={monday} />
        </div>
        {backlog.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-5 text-center text-[14px] muted hairline">Nada pendiente sin día. Todo está planificado.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {backlog.map((t) => (
              <MovableTask key={t.id} task={t} days={days} />
            ))}
          </div>
        )}
      </section>

      <WeeklyReview monday={startOfWeek(today)} />
    </div>
  );
}

function FocusBanner({ monday, focus }) {
  const { actions } = useStore();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(focus || '');
  useEffect(() => setText(focus || ''), [focus, monday]);

  return (
    <section className="relative overflow-hidden rounded-[calc(22px*var(--rk))] p-4 card" style={{ background: 'linear-gradient(120deg, rgb(var(--accent) / 0.14), rgb(var(--accent-2) / 0.1))' }}>
      <div className="flex items-start gap-3">
        <Compass size={20} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Enfoque de la semana</p>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                actions.setWeekFocus(monday, text.trim());
                setEditing(false);
              }}
              className="mt-1.5 flex gap-2"
            >
              <input autoFocus className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="¿Qué hará que esta semana sea un éxito?" enterKeyHint="done" />
              <button type="submit" className="btn btn-primary">OK</button>
            </form>
          ) : (
            <p className={cx('mt-0.5 text-[16px] font-medium leading-snug tracking-tight', !focus && 'muted')}>
              {focus || 'Aún sin definir. ¿Qué hará que esta semana sea un éxito?'}
            </p>
          )}
        </div>
        {!editing && (
          <button type="button" className="icon-btn !h-9 !w-9 muted" onClick={() => setEditing(true)} aria-label="Editar enfoque">
            <Pencil size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

function DayColumn({ date, today, monday }) {
  const f = useFeatures();
  const { state } = useStore();
  const { openEditor } = useUI();
  const list = sortTasks(tasksOn(state, date));
  const load = dayLoad(state, date);
  const isToday = date === today;
  const isPast = date < today;
  const days = weekDays(monday);

  return (
    <section
      className={cx('glass flex snap-start flex-col rounded-[calc(24px*var(--rk))] p-3', isToday && 'ring-1 ring-accent/50', isPast && 'opacity-80')}
      aria-label={formatWeekdayShort(date)}
    >
      <header className="mb-3 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className={cx('text-[26px] font-bold leading-none tracking-tight tabular-nums', isToday && 'text-accent')}>{fromKey(date).getDate()}</span>
            <span className="text-[14px] font-semibold muted">{formatWeekdayShort(date)}</span>
            {isToday && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-accent">Hoy</span>}
          </div>
          <button type="button" className="icon-btn !h-9 !w-9 muted" onClick={() => openEditor('task', null, { date })} aria-label="Añadir tarea a este día">
            <Plus size={17} />
          </button>
        </div>
        {f.workload && f.estimates && (
        <div className="mt-2.5">
          <ProgressBar value={Math.min(100, load.ratio * 100)} level={load.level} height={4} />
          <p className={cx('mt-1 text-[11px] font-medium tabular-nums', load.level === 'over' ? 'text-danger' : load.level === 'high' ? 'text-warn' : 'faint')}>
            {formatDuration(load.total) || '0 min'} / {DAY_CAPACITY_MIN / 60} h
            {load.level === 'over' ? ' · saturado' : load.level === 'high' ? ' · casi lleno' : ''}
          </p>
        </div>
        )}
      </header>
      <div className="flex-1 space-y-2">
        {list.length === 0 && <p className="rounded-2xl border border-dashed py-6 text-center text-[13px] faint hairline">Día libre</p>}
        {list.map((t) => (
          <MovableTask key={t.id} task={t} days={days} />
        ))}
      </div>
    </section>
  );
}

/** Tarea con botones rápidos para cambiar de día (método principal en iOS) */
function MovableTask({ task, days }) {
  const { actions } = useStore();
  const { showToast } = useUI();
  const [open, setOpen] = useState(false);
  const idx = task.date ? days.indexOf(task.date) : -1;

  const move = (when, label) => {
    haptic();
    const prev = { date: task.date, weekOf: task.weekOf };
    actions.scheduleTask(task.id, when);
    setOpen(false);
    showToast(label, { label: 'Deshacer', run: () => actions.updateTask(task.id, prev) });
  };

  return (
    <div>
      <TaskRow
        task={task}
        compact
        actions={
          <button
            type="button"
            className={cx('icon-btn !h-8 !w-8', open ? 'bg-accent/15 text-accent' : 'faint')}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Mover a otro día"
          >
            <CalendarClock size={16} />
          </button>
        }
      />
      {open && (
        <div className="mt-1.5 rounded-2xl p-2 card animate-pop-in">
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => move(d, `Movida al ${formatWeekdayShort(d).toLowerCase()} ${fromKey(d).getDate()}`)}
                className={cx(
                  'flex h-11 flex-col items-center justify-center rounded-xl text-[11px] font-semibold transition-colors active:scale-95',
                  i === idx ? 'bg-accent text-on-accent' : 'hover:bg-fg/10',
                )}
                style={i === idx ? undefined : { background: 'var(--field)' }}
                aria-label={`Mover al ${formatWeekdayShort(d)}`}
              >
                <span className="opacity-70">{WEEKDAY_INITIALS[i]}</span>
                <span className="tabular-nums">{fromKey(d).getDate()}</span>
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {task.date && (
              <button type="button" className="chip" onClick={() => move({ weekOf: days[0] }, 'Movida al backlog semanal')}>
                <Archive size={13} /> Sin día
              </button>
            )}
            <button type="button" className="chip" onClick={() => move({ weekOf: addDays(days[0], 7) }, 'Movida a la próxima semana')}>
              <ChevronRight size={13} /> Próxima semana
            </button>
            <button type="button" className="chip" onClick={() => move('inbox', 'Devuelta a la bandeja')}>
              <InboxIcon size={13} /> Bandeja
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BacklogAdd({ monday }) {
  const { openEditor } = useUI();
  return (
    <button type="button" className="icon-btn card" onClick={() => openEditor('task', null, { weekOf: monday })} aria-label="Añadir al backlog semanal">
      <Plus size={18} />
    </button>
  );
}
