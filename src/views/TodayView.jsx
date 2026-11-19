import { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Clock3, Plus, Flame, MoreHorizontal, ListChecks, Repeat, AlertCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { agendaItems, areaById, habitStreak, overdueTasks, sortTasks, tasksOn } from '../store/selectors';
import { useNow, useToday } from '../lib/hooks';
import { minutesToTime, relativeDay, timeToMinutes } from '../lib/dates';
import { cx, haptic, pct } from '../lib/utils';
import TaskRow from '../components/TaskRow';
import { Check, ProgressRing, SectionTitle } from '../components/primitives';
import { HABIT_ICONS, iconFor } from '../components/icons';

export default function TodayView() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5 stagger">
      <MitsCard />
      <AgendaCard />
      <HabitsCard />
      <SecondaryCard />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Las 3 prioridades del día                                        */
/* ------------------------------------------------------------------ */
function MitsCard() {
  const { state } = useStore();
  const { openEditor } = useUI();
  const today = useToday();
  const mits = sortTasks(tasksOn(state, today).filter((t) => t.mit)).slice(0, 3);
  const done = mits.filter((t) => t.done).length;
  const value = pct(done, 3);
  const all = mits.length > 0 && done === mits.length;

  return (
    <section className="glass relative overflow-hidden rounded-[28px] p-5 lg:col-span-5">
      {/* Brillo sutil */}
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-60"
        style={{ background: 'radial-gradient(closest-side, rgb(var(--accent) / 0.28), transparent)' }}
      />
      <div className="relative flex items-center gap-5">
        <ProgressRing value={value} size={104} stroke={11}>
          <span className="text-[24px] font-bold leading-none tabular-nums">
            {done}
            <span className="text-[15px] font-semibold muted">/3</span>
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider muted">MITs</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="eyebrow">Las 3 prioridades</p>
          <h2 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight">
            {all ? '¡Día ganado!' : done === 0 ? 'Lo esencial, primero' : 'Vas por buen camino'}
          </h2>
          <p className="mt-1 text-[13px] muted">
            {all ? 'Has completado lo más importante de hoy.' : 'Si solo haces esto hoy, el día habrá merecido la pena.'}
          </p>
        </div>
      </div>

      <div className="relative mt-5 space-y-2">
        {mits.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-center text-[13px] font-bold tabular-nums faint">{i + 1}</span>
            <TaskRow task={t} className="flex-1" showGoal />
          </div>
        ))}
        {Array.from({ length: 3 - mits.length }).map((_, i) => (
          <div key={`empty${i}`} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-center text-[13px] font-bold tabular-nums faint">{mits.length + i + 1}</span>
            <button
              type="button"
              onClick={() => openEditor('task', null, { date: today, mit: true, priority: 'high' })}
              className="pressable flex min-h-[48px] flex-1 items-center gap-2 rounded-2xl border border-dashed px-3 text-[14px] muted hairline"
            >
              <Plus size={16} /> Añadir prioridad
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Agenda de bloques de tiempo (08:00 – 22:00)                      */
/* ------------------------------------------------------------------ */
const START_H = 8;
const END_H = 22;
const HOUR_PX = 64;

function layoutBlocks(items) {
  // Reparte en columnas los bloques que se solapan
  const out = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = [];
    cluster.forEach((it) => {
      let c = cols.findIndex((end) => end <= it.s);
      if (c === -1) {
        c = cols.length;
        cols.push(0);
      }
      cols[c] = it.e;
      it.col = c;
    });
    cluster.forEach((it) => out.push({ ...it, cols: cols.length }));
    cluster = [];
  };
  items.forEach((item) => {
    const s = timeToMinutes(item.start);
    const e = Math.max(s + 20, timeToMinutes(item.end) ?? s + 30);
    if (s >= clusterEnd && cluster.length) flush();
    cluster.push({ ...item, s, e });
    clusterEnd = Math.max(clusterEnd, e);
  });
  if (cluster.length) flush();
  return out;
}

function AgendaCard() {
  const { state, actions } = useStore();
  const { openEditor } = useUI();
  const today = useToday();
  const now = useNow();
  const scrollRef = useRef(null);
  const blocks = useMemo(() => layoutBlocks(agendaItems(state, today)), [state, today]);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - START_H * 60) / 60) * HOUR_PX;
  const showNow = nowMin >= START_H * 60 && nowMin <= END_H * 60;

  // Scroll automático hasta la hora actual al abrir
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = showNow ? nowTop - el.clientHeight / 3 : nowMin > END_H * 60 ? el.scrollHeight : 0;
    el.scrollTo({ top: Math.max(0, target), behavior: 'auto' });
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hours = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);

  return (
    <section className="glass flex flex-col rounded-[28px] p-5 lg:col-span-7 lg:row-span-2">
      <SectionTitle
        icon={Clock3}
        title="Agenda"
        subtitle={`${blocks.length} bloques · ${minutesToTime(START_H * 60)}–${minutesToTime(END_H * 60)}`}
        right={
          <button
            type="button"
            className="icon-btn card"
            onClick={() => openEditor('event', null, { date: today })}
            aria-label="Nuevo bloque de tiempo"
          >
            <Plus size={18} />
          </button>
        }
      />
      <div ref={scrollRef} className="scroll-area relative -mx-2 h-[440px] overflow-y-auto px-2 lg:h-auto lg:min-h-[480px] lg:flex-1">
        <div className="relative" style={{ height: (END_H - START_H) * HOUR_PX + 16 }}>
          {hours.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() =>
                h < END_H && openEditor('event', null, { date: today, start: minutesToTime(h * 60), end: minutesToTime(h * 60 + 60) })
              }
              className="absolute left-0 right-0 flex items-start text-left"
              style={{ top: (h - START_H) * HOUR_PX, height: HOUR_PX }}
              aria-label={`Crear bloque a las ${h}:00`}
              tabIndex={h < END_H ? 0 : -1}
            >
              <span className="w-12 -translate-y-2 text-[11px] font-medium tabular-nums faint">{String(h).padStart(2, '0')}:00</span>
              <span className="mt-0 h-px flex-1" style={{ background: 'var(--hairline)' }} />
            </button>
          ))}

          {blocks.map((b) => {
            const area = areaById(state, b.areaId);
            const color = area?.color || 'rgb(var(--accent))';
            const top = ((b.s - START_H * 60) / 60) * HOUR_PX;
            const height = Math.max(26, ((b.e - b.s) / 60) * HOUR_PX - 3);
            if (b.e <= START_H * 60 || b.s >= END_H * 60) return null;
            const short = height < 44;
            return (
              <div
                key={`${b.kind}_${b.id}`}
                className="absolute animate-pop-in"
                style={{
                  top: Math.max(0, top) + 1,
                  height,
                  left: `calc(52px + (100% - 56px) * ${b.col / b.cols})`,
                  width: `calc((100% - 56px) / ${b.cols} - 4px)`,
                }}
              >
                <button
                  type="button"
                  onClick={() => openEditor(b.kind, b.ref)}
                  className={cx('pressable flex h-full w-full gap-2 overflow-hidden rounded-xl px-2.5 text-left', short ? 'items-center py-0' : 'flex-col py-1.5')}
                  style={{
                    background: `color-mix(in srgb, ${color} 18%, transparent)`,
                    boxShadow: `inset 3px 0 0 ${color}, inset 0 0 0 1px color-mix(in srgb, ${color} 30%, transparent)`,
                    opacity: b.done ? 0.55 : 1,
                  }}
                >
                  <span className={cx('flex min-w-0 items-center gap-1.5 text-[13px] font-semibold leading-tight', b.done && 'line-through')}>
                    {b.kind === 'task' && (
                      <span
                        role="checkbox"
                        aria-checked={b.done}
                        tabIndex={0}
                        aria-label="Completar"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic();
                          actions.toggleTask(b.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            actions.toggleTask(b.id);
                          }
                        }}
                        className="tap-target inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
                        style={{ border: `1.5px solid ${color}`, background: b.done ? color : 'transparent' }}
                      />
                    )}
                    <span className="truncate">{b.title}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-medium tabular-nums muted">
                    {b.start}–{b.end || minutesToTime(b.e)}
                  </span>
                </button>
              </div>
            );
          })}

          {showNow && (
            <div className="pointer-events-none absolute left-10 right-0 z-10 flex items-center" style={{ top: nowTop - 5 }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--now)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--now) 25%, transparent), 0 0 10px var(--now)' }} />
              <span className="h-[1.5px] flex-1" style={{ background: 'var(--now)', boxShadow: '0 0 6px var(--now)' }} />
              <span className="ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums" style={{ background: 'var(--now)' }}>
                {minutesToTime(nowMin)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3a. Hábitos diarios                                                 */
/* ------------------------------------------------------------------ */
function HabitsCard() {
  const { state, actions } = useStore();
  const { openEditor } = useUI();
  const today = useToday();
  const doneCount = state.habits.filter((h) => h.log[today]).length;

  return (
    <section className="glass rounded-[28px] p-5 lg:col-span-5">
      <SectionTitle
        icon={Repeat}
        title="Hábitos"
        subtitle={`${doneCount} de ${state.habits.length} hoy`}
        right={
          <button type="button" className="icon-btn card" onClick={() => openEditor('habit')} aria-label="Nuevo hábito">
            <Plus size={18} />
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-2.5">
        {state.habits.map((h) => {
          const done = Boolean(h.log[today]);
          const streak = habitStreak(h, today);
          const Icon = iconFor(HABIT_ICONS, h.icon);
          return (
            <div
              key={h.id}
              className="relative overflow-hidden rounded-2xl card transition-colors duration-500"
              style={done ? { background: `color-mix(in srgb, ${h.color} 14%, var(--card))`, borderColor: `color-mix(in srgb, ${h.color} 35%, transparent)` } : undefined}
            >
              <button
                type="button"
                onClick={() => {
                  haptic();
                  actions.toggleHabit(h.id, today);
                }}
                className="pressable flex w-full flex-col items-start gap-2.5 p-3 pr-10 text-left"
                aria-pressed={done}
                aria-label={`${h.name}: ${done ? 'hecho' : 'pendiente'}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: h.color, background: `color-mix(in srgb, ${h.color} 16%, transparent)` }}>
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className="w-full">
                  <span className="block truncate text-[14px] font-semibold tracking-tight">{h.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[12px] muted tabular-nums">
                    <Flame size={12} className={streak > 0 ? 'text-warn' : ''} />
                    {streak} {streak === 1 ? 'día' : 'días'}
                  </span>
                </span>
              </button>
              <div className="absolute right-3 top-3">
                <Check checked={done} color={h.color} size={22} onChange={() => { haptic(); actions.toggleHabit(h.id, today); }} label={`Marcar ${h.name}`} />
              </div>
              <button
                type="button"
                onClick={() => openEditor('habit', h)}
                className="tap-target absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full faint"
                aria-label={`Editar ${h.name}`}
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3b. Tareas secundarias + pendientes de días anteriores              */
/* ------------------------------------------------------------------ */
function SecondaryCard() {
  const { state, actions } = useStore();
  const { showToast } = useUI();
  const today = useToday();
  const [text, setText] = useState('');
  const list = sortTasks(tasksOn(state, today).filter((t) => !t.mit));
  const overdue = overdueTasks(state, today).filter((t) => t.date);
  const mitCount = tasksOn(state, today).filter((t) => t.mit).length;

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    actions.addTask({ title: text.trim(), date: today, priority: 'low', estimate: 15 });
    setText('');
    haptic();
  };

  const promote = (t) => {
    if (mitCount >= 3) {
      showToast('Ya tienes 3 prioridades hoy');
      return;
    }
    actions.updateTask(t.id, { mit: true });
    showToast('Ahora es una prioridad del día');
  };

  return (
    <section className="glass rounded-[28px] p-5 lg:col-span-5">
      <SectionTitle icon={ListChecks} title="Tareas secundarias" subtitle={`${list.filter((t) => t.done).length} de ${list.length} hechas`} />
      <div className="space-y-2">
        {list.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            compact
            actions={
              !t.done && (
                <button type="button" className="icon-btn !h-9 !w-9 faint" onClick={() => promote(t)} aria-label="Convertir en prioridad del día">
                  <Star size={16} />
                </button>
              )
            }
          />
        ))}
      </div>
      <form onSubmit={add} className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed px-3 hairline">
        <Plus size={16} className="muted" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Añadir un recado…"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg/40"
          enterKeyHint="done"
          aria-label="Nuevo recado para hoy"
        />
      </form>

      {overdue.length > 0 && (
        <div className="mt-5">
          <p className="eyebrow mb-2 flex items-center gap-1.5 !text-warn">
            <AlertCircle size={12} /> Pendientes de días anteriores
          </p>
          <div className="space-y-2">
            {overdue.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                compact
                showDate
                actions={
                  <button type="button" className="chip" onClick={() => { actions.scheduleTask(t.id, 'today'); showToast(`«${t.title}» movida a hoy`); }}>
                    Hoy <ArrowRight size={13} />
                  </button>
                }
              />
            ))}
          </div>
          <p className="mt-2 text-[12px] faint">{relativeDay(overdue[0].date)} y antes · usa la revisión semanal para reprogramarlas en bloque.</p>
        </div>
      )}
    </section>
  );
}
