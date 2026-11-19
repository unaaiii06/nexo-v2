import { useRef, useState } from 'react';
import { CornerDownLeft, Inbox, Sparkles, CalendarCheck2, Sunrise, CalendarRange, Target } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { inboxTasks } from '../store/selectors';
import TaskRow from '../components/TaskRow';
import { EmptyState } from '../components/primitives';
import { PRIORITIES, cx, haptic } from '../lib/utils';

const WHEN = [
  { id: 'today', label: 'Hoy', icon: CalendarCheck2, toast: 'Movida a Hoy' },
  { id: 'tomorrow', label: 'Mañana', icon: Sunrise, toast: 'Programada para mañana' },
  { id: 'week', label: 'Esta semana', icon: CalendarRange, toast: 'Movida al backlog semanal' },
];

export default function InboxView() {
  const { state, actions } = useStore();
  const { showToast } = useUI();
  const [text, setText] = useState('');
  const [leaving, setLeaving] = useState({});
  const [fresh, setFresh] = useState(null);
  const inputRef = useRef(null);
  const items = inboxTasks(state);

  function capture(e) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    const t = actions.addTask({ title });
    setFresh(t.id);
    setText('');
    haptic();
  }

  function schedule(task, when) {
    setLeaving((l) => ({ ...l, [task.id]: true }));
    haptic(10);
    setTimeout(() => {
      actions.scheduleTask(task.id, when.id);
      setLeaving((l) => {
        const n = { ...l };
        delete n[task.id];
        return n;
      });
      showToast(when.toast, { label: 'Deshacer', run: () => actions.scheduleTask(task.id, 'inbox') });
    }, 320);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Input hero estilo Spotlight */}
      <form onSubmit={capture} className="glass flex items-center gap-3 rounded-[22px] py-2 pl-5 pr-2 animate-fade-up">
        <Sparkles size={20} className="shrink-0 text-accent" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Captura una idea, tarea o recado…"
          className="h-12 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-fg/40"
          enterKeyHint="send"
          autoComplete="off"
          aria-label="Nueva captura"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className={cx('btn btn-primary h-11 px-4 transition-opacity', !text.trim() && 'opacity-40')}
          aria-label="Añadir"
        >
          <span className="hidden sm:inline">Añadir</span>
          <CornerDownLeft size={16} />
        </button>
      </form>

      <div className="flex items-baseline justify-between px-1">
        <p className="eyebrow">{items.length ? `${items.length} sin procesar` : 'Todo procesado'}</p>
        <p className="hidden text-[12px] faint sm:block">Asigna una fecha para sacarla de la bandeja</p>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-[28px]">
          <EmptyState
            icon={Inbox}
            title="Bandeja vacía"
            text="Mente despejada. Todo lo que captures aparecerá aquí hasta que lo planifiques."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((task) => (
            <li
              key={task.id}
              className={cx('glass rounded-[22px] p-2', leaving[task.id] ? 'animate-leave' : task.id === fresh ? 'animate-pop-in' : 'animate-fade-up')}
            >
              <TaskRow task={task} className="!border-0 !bg-transparent !shadow-none" />
              <ProcessBar task={task} onSchedule={(w) => schedule(task, w)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProcessBar({ task, onSchedule }) {
  const { state, actions } = useStore();
  return (
    <div className="space-y-2 px-2 pb-1.5 pt-1">
      <div className="flex flex-wrap gap-2">
        {WHEN.map((w) => (
          <button key={w.id} type="button" onClick={() => onSchedule(w)} className="chip">
            <w.icon size={14} className="text-accent" />
            {w.label}
          </button>
        ))}
        <span className="mx-0.5 hidden w-px shrink-0 self-stretch sm:block" style={{ background: 'var(--hairline)' }} />
        {Object.entries(PRIORITIES).map(([k, p]) => (
          <button
            key={k}
            type="button"
            onClick={() => actions.updateTask(task.id, { priority: task.priority === k ? null : k })}
            className={cx('chip', task.priority === k && 'chip-active')}
            aria-pressed={task.priority === k}
          >
            <span className="glow-dot" style={{ color: p.color, width: 7, height: 7 }} />
            {p.short}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          className="field !min-h-[40px] !rounded-full !py-1.5 !text-[14px]"
          value={task.areaId || ''}
          onChange={(e) => actions.updateTask(task.id, { areaId: e.target.value || null })}
          aria-label="Área"
        >
          <option value="">Área…</option>
          {state.areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <label className="relative block">
          <Target size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 muted" />
          <select
            className="field !min-h-[40px] !rounded-full !py-1.5 !pl-8 !text-[14px]"
            value={task.goalId || ''}
            onChange={(e) => {
              const goalId = e.target.value || null;
              const g = state.goals.find((x) => x.id === goalId);
              actions.updateTask(task.id, { goalId, ...(g && !task.areaId ? { areaId: g.areaId } : {}) });
            }}
            aria-label="Objetivo mensual"
          >
            <option value="">Objetivo…</option>
            {state.goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
