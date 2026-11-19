import { useState } from 'react';
import { CalendarClock, Inbox, Compass, Check as CheckIcon, ChevronLeft, Trash2, PartyPopper } from 'lucide-react';
import Sheet from '../components/Sheet';
import TaskRow from '../components/TaskRow';
import { EmptyState } from '../components/primitives';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { inboxTasks, overdueTasks, weekProgress } from '../store/selectors';
import { addDays, formatShortDate } from '../lib/dates';
import { cx, haptic } from '../lib/utils';

const STEPS = [
  { title: 'Reprogramar pendientes', icon: CalendarClock },
  { title: 'Vaciar la bandeja', icon: Inbox },
  { title: 'Enfoque de la próxima semana', icon: Compass },
];

export default function WeeklyReview({ monday }) {
  const { review, setReview } = useUI();
  if (!review) return null;
  return <ReviewFlow monday={monday} onClose={() => setReview(false)} />;
}

function ReviewFlow({ monday, onClose }) {
  const { state, actions } = useStore();
  const { showToast } = useUI();
  const [step, setStep] = useState(0);
  const nextMonday = addDays(monday, 7);
  const [focus, setFocus] = useState(state.weekFocus[nextMonday] || '');
  const overdue = overdueTasks(state);
  const inbox = inboxTasks(state);
  const progress = weekProgress(state, monday);

  const finish = () => {
    if (focus.trim()) actions.setWeekFocus(nextMonday, focus.trim());
    showToast('Revisión semanal completada');
    onClose();
  };

  const Step = STEPS[step];

  const footer = (
    <div className="flex items-center gap-2">
      {step > 0 && (
        <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
          <ChevronLeft size={17} /> Atrás
        </button>
      )}
      <div className="flex-1" />
      {step < 2 ? (
        <button type="button" className="btn btn-primary min-w-[130px]" onClick={() => setStep(step + 1)}>
          Siguiente
        </button>
      ) : (
        <button type="button" className="btn btn-primary min-w-[130px]" onClick={finish}>
          <CheckIcon size={17} /> Terminar
        </button>
      )}
    </div>
  );

  const option = (task, when, label) => (
    <button
      type="button"
      className="chip"
      onClick={() => {
        haptic();
        actions.scheduleTask(task.id, when);
      }}
    >
      {label}
    </button>
  );

  return (
    <Sheet open onClose={onClose} title="Revisión semanal" subtitle={`Paso ${step + 1} de 3 · ${Step.title}`} footer={footer} size="lg">
      {/* Indicador de pasos */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => (
          <button key={s.title} type="button" onClick={() => setStep(i)} className="text-left" aria-label={`Ir al paso ${i + 1}`}>
            <div className="h-1 overflow-hidden rounded-full" style={{ background: 'rgb(var(--fg) / 0.1)' }}>
              <div className="progress-fill h-full rounded-full bg-accent" style={{ transform: `scaleX(${i <= step ? 1 : 0})` }} />
            </div>
            <span className={cx('mt-2 flex items-center gap-1.5 text-[12px] font-medium', i === step ? 'text-accent' : 'faint')}>
              <s.icon size={13} /> <span className="hidden sm:inline">{s.title}</span>
            </span>
          </button>
        ))}
      </div>

      <div key={step} className="animate-fade-up">
        {step === 0 && (
          <div>
            <p className="mb-4 text-[14px] muted">
              Tareas sin completar de días o semanas anteriores. Decide dónde encajan ahora (o márcalas como hechas).
            </p>
            {overdue.length === 0 ? (
              <EmptyState icon={PartyPopper} title="Nada atrasado" text="No arrastras tareas pendientes. ¡Bien hecho!" />
            ) : (
              <div className="space-y-3">
                {overdue.map((t) => (
                  <div key={t.id} className="rounded-2xl p-1.5 card">
                    <TaskRow task={t} compact showDate className="!border-0 !bg-transparent !shadow-none" />
                    <div className="flex flex-wrap gap-1.5 px-2 pb-1.5">
                      {option(t, 'today', 'Hoy')}
                      {option(t, 'tomorrow', 'Mañana')}
                      {option(t, 'week', 'Esta semana')}
                      {option(t, 'nextWeek', 'Próxima semana')}
                      {option(t, 'inbox', 'Bandeja')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="mb-4 text-[14px] muted">Procesa cada captura: planifícala o elimínala si ya no importa.</p>
            {inbox.length === 0 ? (
              <EmptyState icon={Inbox} title="Bandeja a cero" text="No queda nada por procesar." />
            ) : (
              <div className="space-y-3">
                {inbox.map((t) => (
                  <div key={t.id} className="rounded-2xl p-1.5 card">
                    <TaskRow task={t} compact className="!border-0 !bg-transparent !shadow-none" />
                    <div className="flex flex-wrap gap-1.5 px-2 pb-1.5">
                      {option(t, 'today', 'Hoy')}
                      {option(t, 'tomorrow', 'Mañana')}
                      {option(t, 'week', 'Esta semana')}
                      {option(t, 'nextWeek', 'Próxima semana')}
                      <button
                        type="button"
                        className="chip !text-danger"
                        onClick={() => {
                          const snap = { ...t };
                          actions.remove('tasks', t.id);
                          showToast('Eliminada', { label: 'Deshacer', run: () => actions.upsert('tasks', snap) });
                        }}
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Completadas', progress.done],
                ['Planificadas', progress.total],
                ['Cumplimiento', `${progress.pct}%`],
              ].map(([label, v]) => (
                <div key={label} className="rounded-2xl p-3 text-center card">
                  <p className="text-[22px] font-bold tracking-tight tabular-nums">{v}</p>
                  <p className="text-[11px] muted">{label}</p>
                </div>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">
                ¿Cuál es el enfoque de la semana del {formatShortDate(nextMonday)}?
              </span>
              <textarea
                className="field min-h-[110px] resize-none text-[17px]"
                placeholder="Ej.: Cerrar la beta y entrenar 4 días."
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
              />
            </label>
            <p className="text-[13px] faint">Se mostrará en la cabecera de la vista semanal durante esa semana.</p>
          </div>
        )}
      </div>
    </Sheet>
  );
}
