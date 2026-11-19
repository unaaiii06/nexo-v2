import { useEffect, useRef } from 'react';
import { Flag, Target, X, CheckCircle2, ListTodo } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { areaStats, goalProgress, sortTasks } from '../store/selectors';
import { formatShortDate, relativeDay } from '../lib/dates';
import { useToday } from '../lib/hooks';
import { cx } from '../lib/utils';
import TaskRow from '../components/TaskRow';
import { useFeatures } from '../lib/features';
import { AreaIcon, EmptyState, ProgressBar, ProgressRing } from '../components/primitives';

export default function AreasView() {
  const f = useFeatures();
  const { state } = useStore();
  const { areaFilter, setAreaFilter } = useUI();
  const today = useToday();
  const detailRef = useRef(null);

  useEffect(() => {
    if (areaFilter && detailRef.current && window.matchMedia('(max-width: 1023px)').matches) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [areaFilter]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 stagger">
        {state.areas.map((area, i) => {
          const s = areaStats(state, area.id, today);
          const active = areaFilter === area.id;
          // Bento: las dos primeras tarjetas más anchas en escritorio
          const span = i < 2 ? 'lg:col-span-3' : 'lg:col-span-2';
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => setAreaFilter(active ? null : area.id)}
              className={cx('glass pressable relative overflow-hidden rounded-[calc(26px*var(--rk))] p-5 text-left', span, active && 'ring-2')}
              style={active ? { '--tw-ring-color': area.color } : undefined}
              aria-pressed={active}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full"
                style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${area.color} 30%, transparent), transparent)` }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <AreaIcon area={area} size={20} box={42} />
                <ProgressRing value={s.pct} size={46} stroke={5} color={area.color}>
                  <span className="text-[11px] font-bold tabular-nums">{s.pct}%</span>
                </ProgressRing>
              </div>
              <h3 className="relative mt-4 text-[18px] font-semibold tracking-tight">{area.name}</h3>
              <p className="relative mt-0.5 text-[13px] muted tabular-nums">
                {s.active} {s.active === 1 ? 'tarea activa' : 'tareas activas'}
                {f.goals && ` · ${s.goals.length} ${s.goals.length === 1 ? 'objetivo' : 'objetivos'}`}
              </p>
              <div className="relative mt-4">
                <ProgressBar value={s.pct} color={area.color} height={5} />
              </div>
              {f.milestones && (
              <div className="relative mt-3 flex items-center gap-1.5 text-[12px]">
                <Flag size={12} style={{ color: area.color }} className="shrink-0" />
                {s.nextMilestone ? (
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{s.nextMilestone.title}</span>
                    <span className="muted"> · {relativeDay(s.nextMilestone.date, today)}</span>
                  </span>
                ) : (
                  <span className="faint">Sin hitos próximos</span>
                )}
              </div>
              )}
            </button>
          );
        })}
      </div>

      <div ref={detailRef} className="scroll-mt-4">
        {areaFilter ? <AreaDetail areaId={areaFilter} onClose={() => setAreaFilter(null)} today={today} /> : (
          <p className="text-center text-[13px] faint">Toca un área para ver sus tareas, objetivos e hitos.</p>
        )}
      </div>
    </div>
  );
}

function AreaDetail({ areaId, onClose, today }) {
  const f = useFeatures();
  const { state } = useStore();
  const { openEditor } = useUI();
  const area = state.areas.find((a) => a.id === areaId);
  if (!area) return null;
  const tasks = sortTasks(state.tasks.filter((t) => t.areaId === areaId));
  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const goals = state.goals.filter((g) => g.areaId === areaId);
  const milestones = state.milestones.filter((m) => m.areaId === areaId && m.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="glass rounded-[calc(28px*var(--rk))] p-5 animate-pop-in" key={areaId}>
      <div className="mb-5 flex items-center gap-3">
        <AreaIcon area={area} size={18} box={38} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[20px] font-semibold tracking-tight">{area.name}</h2>
          <p className="text-[13px] muted">Tareas, objetivos e hitos del área</p>
        </div>
        <button type="button" className="icon-btn card" onClick={onClose} aria-label="Quitar filtro">
          <X size={17} />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-2 flex items-center gap-1.5">
            <ListTodo size={12} /> Activas · {active.length}
          </p>
          {active.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Todo al día" text="No hay tareas activas en esta área." />
          ) : (
            <div className="space-y-2">
              {active.map((t) => (
                <TaskRow key={t.id} task={t} compact showDate />
              ))}
            </div>
          )}
          {done.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer list-none text-[13px] font-medium muted">Completadas · {done.length}</summary>
              <div className="mt-2 space-y-2">
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} compact showDate />
                ))}
              </div>
            </details>
          )}
        </div>

        <div className="space-y-5">
          {f.goals && (
          <div>
            <p className="eyebrow mb-2 flex items-center gap-1.5">
              <Target size={12} /> Objetivos
            </p>
            {goals.length === 0 ? (
              <p className="text-[13px] faint">Sin objetivos vinculados.</p>
            ) : (
              <div className="space-y-2">
                {goals.map((g) => {
                  const p = goalProgress(state, g.id);
                  return (
                    <button key={g.id} type="button" onClick={() => openEditor('goal', g)} className="pressable block w-full rounded-2xl p-3 text-left card">
                      <div className="flex justify-between gap-2 text-[14px] font-semibold">
                        <span className="truncate">{g.title}</span>
                        <span className="tabular-nums" style={{ color: area.color }}>{p.pct}%</span>
                      </div>
                      <ProgressBar value={p.pct} color={area.color} height={4} className="mt-2" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          )}
          {f.milestones && (
          <div>
            <p className="eyebrow mb-2 flex items-center gap-1.5">
              <Flag size={12} /> Próximos hitos
            </p>
            {milestones.length === 0 ? (
              <p className="text-[13px] faint">Sin hitos próximos.</p>
            ) : (
              <div className="space-y-1.5">
                {milestones.map((m) => (
                  <button key={m.id} type="button" onClick={() => openEditor('milestone', m)} className="pressable flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left card">
                    <span className="h-2 w-2 rounded-full" style={{ background: area.color }} />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{m.title}</span>
                    <span className="text-[12px] muted tabular-nums">{formatShortDate(m.date)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
