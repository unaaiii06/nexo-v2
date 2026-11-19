import { useState } from 'react';
import { ChevronLeft, ChevronRight, Target, Plus, Grid3x3, Flag, CalendarDays } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { areaById, goalProgress, goalsOfMonth, milestonesOn } from '../store/selectors';
import {
  addMonths, formatMonthYear, formatLongDate, formatShortDate, fromKey, monthDays, monthKeyOf, monthMatrix, WEEKDAY_SHORT, WEEKDAY_INITIALS, diffDays,
} from '../lib/dates';
import { useToday } from '../lib/hooks';
import { cx, haptic, MILESTONE_TYPES } from '../lib/utils';
import { AreaBadge, EmptyState, ProgressBar, SectionTitle } from '../components/primitives';
import { HABIT_ICONS, iconFor } from '../components/icons';
import Sheet from '../components/Sheet';

const typeColor = (m, area) => area?.color || (m.type === 'limite' ? '#FF453A' : '#0A84FF');

export default function MonthView() {
  const today = useToday();
  const [month, setMonth] = useState(() => monthKeyOf(today));
  const [selected, setSelected] = useState(null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5 stagger">
      <CalendarCard month={month} setMonth={setMonth} today={today} onSelect={setSelected} />
      <GoalsCard month={month} today={today} />
      <HabitMatrix month={month} today={today} />
      <DaySheet date={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CalendarCard({ month, setMonth, today, onSelect }) {
  const { state } = useStore();
  const cells = monthMatrix(month);
  // Recorta la 6.ª semana si es completamente del mes siguiente
  const visible = cells.slice(35).every((d) => monthKeyOf(d) !== month) ? cells.slice(0, 35) : cells;
  const count = state.milestones.filter((m) => monthKeyOf(m.date) === month).length;

  return (
    <section className="glass rounded-[28px] p-4 md:p-5 lg:col-span-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <CalendarDays size={15} />
          </span>
          <div>
            <h2 className="text-[19px] font-semibold tracking-tight">{formatMonthYear(month)}</h2>
            <p className="text-[13px] muted">{count} hitos y fechas clave</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {month !== monthKeyOf(today) && (
            <button type="button" className="chip" onClick={() => setMonth(monthKeyOf(today))}>
              Hoy
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Mes anterior">
            <ChevronLeft size={19} />
          </button>
          <button type="button" className="icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Mes siguiente">
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-1.5">
        {WEEKDAY_SHORT.map((d, i) => (
          <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider faint">
            <span className="md:hidden">{WEEKDAY_INITIALS[i]}</span>
            <span className="hidden md:inline">{d}</span>
          </div>
        ))}
        {visible.map((d) => {
          const inMonth = monthKeyOf(d) === month;
          const isToday = d === today;
          const ms = milestonesOn(state, d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelect(d)}
              className={cx(
                'pressable relative flex aspect-square flex-col items-center rounded-xl p-1 text-left transition-colors md:aspect-auto md:min-h-[96px] md:items-stretch md:p-1.5',
                inMonth ? 'card card-interactive' : 'opacity-35',
              )}
              aria-label={`${formatLongDate(d)}${ms.length ? `, ${ms.length} hitos` : ''}`}
            >
              <span
                className={cx(
                  'flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums md:h-6 md:w-6 md:text-[12px]',
                  isToday && 'bg-accent text-white shadow-[0_0_12px_rgb(var(--accent)/0.6)]',
                )}
              >
                {fromKey(d).getDate()}
              </span>
              {/* iPhone: puntos de color */}
              {ms.length > 0 && (
                <span className="mt-auto flex gap-0.5 pb-0.5 md:hidden">
                  {ms.slice(0, 3).map((m) => (
                    <span key={m.id} className="h-[5px] w-[5px] rounded-full" style={{ background: typeColor(m, areaById(state, m.areaId)) }} />
                  ))}
                </span>
              )}
              {/* Escritorio: píldoras translúcidas */}
              <span className="mt-1 hidden min-w-0 flex-col gap-1 md:flex">
                {ms.slice(0, 3).map((m) => {
                  const c = typeColor(m, areaById(state, m.areaId));
                  return (
                    <span
                      key={m.id}
                      className="block truncate rounded-md px-1.5 py-[3px] text-[11px] font-semibold leading-tight"
                      style={{ color: c, background: `color-mix(in srgb, ${c} 16%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 26%, transparent)` }}
                      title={`${MILESTONE_TYPES[m.type]?.label}: ${m.title}`}
                    >
                      {m.title}
                    </span>
                  );
                })}
                {ms.length > 3 && <span className="px-1 text-[10px] font-semibold muted">+{ms.length - 3} más</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] faint">Solo hitos, entregas, eventos clave y fechas límite. Toca un día para ver o añadir.</p>
    </section>
  );
}

function DaySheet({ date, onClose }) {
  const { state } = useStore();
  const { openEditor } = useUI();
  const ms = date ? milestonesOn(state, date) : [];
  return (
    <Sheet open={Boolean(date)} onClose={onClose} title={date ? formatLongDate(date) : ''} subtitle={`${ms.length} ${ms.length === 1 ? 'hito' : 'hitos'}`} size="sm">
      <div className="space-y-2">
        {ms.length === 0 && <EmptyState icon={Flag} title="Sin hitos" text="Los días tranquilos también cuentan." />}
        {ms.map((m) => {
          const area = areaById(state, m.areaId);
          const c = typeColor(m, area);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onClose();
                openEditor('milestone', m);
              }}
              className="pressable flex w-full items-center gap-3 rounded-2xl p-3 text-left card"
            >
              <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{m.title}</span>
                <span className="flex items-center gap-2 text-[12px] muted">
                  {MILESTONE_TYPES[m.type]?.label}
                  <AreaBadge area={area} />
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className="btn btn-ghost mt-2 w-full"
          onClick={() => {
            const d = date;
            onClose();
            openEditor('milestone', null, { date: d });
          }}
        >
          <Plus size={17} /> Añadir hito este día
        </button>
      </div>
    </Sheet>
  );
}

function GoalsCard({ month, today }) {
  const { state } = useStore();
  const { openEditor, showToast } = useUI();
  const goals = goalsOfMonth(state, month);
  const avg = goals.length ? Math.round(goals.reduce((s, g) => s + goalProgress(state, g.id).pct, 0) / goals.length) : 0;

  return (
    <section className="glass rounded-[28px] p-5 lg:col-span-4">
      <SectionTitle
        icon={Target}
        title="Objetivos del mes"
        subtitle={goals.length ? `${goals.length} objetivos · ${avg}% de media` : 'Define de 3 a 5 objetivos'}
        right={
          <button
            type="button"
            className="icon-btn card"
            onClick={() => (goals.length >= 5 ? showToast('Máximo 5 objetivos por mes') : openEditor('goal', null, { month }))}
            aria-label="Nuevo objetivo"
          >
            <Plus size={18} />
          </button>
        }
      />
      {goals.length === 0 ? (
        <EmptyState icon={Target} title="Sin objetivos" text="Vincula tareas a un objetivo y su progreso se calculará solo." />
      ) : (
        <div className="space-y-2.5">
          {goals.map((g) => {
            const p = goalProgress(state, g.id);
            const area = areaById(state, g.areaId);
            const left = g.deadline ? diffDays(today, g.deadline) : null;
            return (
              <button key={g.id} type="button" onClick={() => openEditor('goal', g)} className="pressable block w-full rounded-2xl p-3.5 text-left card card-interactive">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold leading-snug tracking-tight">{g.title}</p>
                  <span className="text-[17px] font-bold tabular-nums" style={{ color: area?.color }}>
                    {p.pct}%
                  </span>
                </div>
                <ProgressBar value={p.pct} className="mt-2.5" color={area ? `linear-gradient(90deg, color-mix(in srgb, ${area.color} 70%, white), ${area.color})` : undefined} />
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] muted">
                  <AreaBadge area={area} />
                  <span className="tabular-nums">
                    {p.done}/{p.total} tareas
                  </span>
                  {g.deadline && (
                    <span className={cx('tabular-nums', left !== null && left < 0 && p.pct < 100 && 'text-danger')}>
                      {left < 0 ? 'Venció' : 'Límite'} {formatShortDate(g.deadline)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HabitMatrix({ month, today }) {
  const { state, actions } = useStore();
  const days = monthDays(month);

  return (
    <section className="glass rounded-[28px] p-5 lg:col-span-12">
      <SectionTitle icon={Grid3x3} title="Matriz de constancia" subtitle={`Hábitos de ${formatMonthYear(month).toLowerCase()}`} />
      <div className="no-scrollbar -mx-5 overflow-x-auto px-5">
        <div className="min-w-max space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="w-28 shrink-0" />
            <div className="flex gap-[3px]">
              {days.map((d) => (
                <span key={d} className={cx('w-[14px] text-center text-[9px] tabular-nums', d === today ? 'font-bold text-accent' : 'faint')}>
                  {fromKey(d).getDate() % 5 === 0 || fromKey(d).getDate() === 1 ? fromKey(d).getDate() : ''}
                </span>
              ))}
            </div>
          </div>
          {state.habits.map((h) => {
            const Icon = iconFor(HABIT_ICONS, h.icon);
            const doneDays = days.filter((d) => h.log[d]).length;
            const elapsed = days.filter((d) => d <= today).length;
            return (
              <div key={h.id} className="flex items-center gap-3">
                <div className="flex w-28 shrink-0 items-center gap-2">
                  <Icon size={14} style={{ color: h.color }} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{h.name}</span>
                  <span className="text-[11px] tabular-nums faint">{elapsed ? Math.round((doneDays / elapsed) * 100) : 0}%</span>
                </div>
                <div className="flex gap-[3px]">
                  {days.map((d) => {
                    const done = Boolean(h.log[d]);
                    const future = d > today;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={future}
                        onClick={() => {
                          haptic();
                          actions.toggleHabit(h.id, d);
                        }}
                        className={cx('h-[14px] w-[14px] rounded-[4px] transition-all duration-300', d === today && 'ring-1 ring-fg/40 ring-offset-0')}
                        style={{
                          background: done ? h.color : future ? 'rgb(var(--fg) / 0.03)' : 'rgb(var(--fg) / 0.08)',
                          boxShadow: done ? `0 0 6px color-mix(in srgb, ${h.color} 50%, transparent)` : undefined,
                        }}
                        aria-label={`${h.name}, ${formatLongDate(d)}: ${done ? 'hecho' : 'sin hacer'}`}
                        title={`${formatShortDate(d)} · ${done ? 'Hecho' : 'Sin hacer'}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
