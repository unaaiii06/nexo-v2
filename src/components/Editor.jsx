import { useMemo, useState } from 'react';
import { CheckSquare, Clock3, Flag, Target, Repeat, Trash2, Star, BellRing } from 'lucide-react';
import Sheet from './Sheet';
import { Segmented, ProgressBar } from './primitives';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { goalProgress, goalsOfMonth } from '../store/selectors';
import { addDays, addMonths, monthKeyOf, startOfWeek, todayKey, formatMonthYear, timeToMinutes, minutesToTime } from '../lib/dates';
import { AREA_COLORS, MILESTONE_TYPES, PRIORITIES, cx } from '../lib/utils';
import { HABIT_ICONS } from './icons';
import { REMIND_OPTIONS, MAX_REMINDS, computeOne, computeRemindAts, getReminds, sameRemind, toLocalInput, formatRemind } from '../lib/reminders';

const TYPES = [
  { value: 'task', label: 'Tarea', icon: CheckSquare },
  { value: 'event', label: 'Bloque', icon: Clock3 },
  { value: 'milestone', label: 'Hito', icon: Flag },
  { value: 'goal', label: 'Objetivo', icon: Target },
  { value: 'habit', label: 'Hábito', icon: Repeat },
];

const TITLES = {
  task: ['Nueva tarea', 'Editar tarea'],
  event: ['Nuevo bloque de tiempo', 'Editar bloque'],
  milestone: ['Nuevo hito', 'Editar hito'],
  goal: ['Nuevo objetivo del mes', 'Editar objetivo'],
  habit: ['Nuevo hábito', 'Editar hábito'],
};

const CREATED = {
  task: 'Tarea creada',
  event: 'Bloque añadido a la agenda',
  milestone: 'Hito añadido al calendario',
  goal: 'Objetivo creado',
  habit: 'Hábito creado',
};

const COLLECTION = { task: 'tasks', event: 'events', milestone: 'milestones', goal: 'goals', habit: 'habits' };
const ESTIMATES = [15, 30, 60, 90, 120, 180];

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] faint">{hint}</span>}
    </label>
  );
}

function defaultsFor(type, defaults) {
  const today = todayKey();
  switch (type) {
    case 'task':
      return { title: '', notes: '', date: null, weekOf: null, priority: null, mit: false, areaId: null, goalId: null, start: null, end: null, estimate: 30, ...defaults };
    case 'event': {
      const h = Math.min(21, Math.max(8, new Date().getHours() + 1));
      return { title: '', date: today, start: minutesToTime(h * 60), end: minutesToTime(h * 60 + 60), areaId: null, ...defaults };
    }
    case 'milestone':
      return { title: '', date: addDays(today, 7), type: 'hito', areaId: null, ...defaults };
    case 'goal':
      return { title: '', areaId: null, deadline: addDays(today, 21), month: monthKeyOf(today), ...defaults };
    case 'habit':
      return { name: '', icon: 'sun', color: '#64D2FF', log: {}, ...defaults };
    default:
      return {};
  }
}

export default function Editor() {
  const { editor, closeEditor } = useUI();
  if (!editor) return null;
  return <EditorInner key={editor.key} editor={editor} onClose={closeEditor} />;
}

function EditorInner({ editor, onClose }) {
  const { state, actions } = useStore();
  const { showToast } = useUI();
  const isNew = !editor.item;
  const [type, setType] = useState(editor.type);
  const [drafts, setDrafts] = useState(() => ({
    [editor.type]: editor.item ? { ...editor.item } : defaultsFor(editor.type, editor.defaults),
  }));
  const draft = drafts[type] || defaultsFor(type, editor.defaults);
  const set = (patch) => setDrafts((d) => ({ ...d, [type]: { ...(d[type] || defaultsFor(type, editor.defaults)), ...patch } }));

  const titleKey = type === 'habit' ? 'name' : 'title';
  const canSave = String(draft[titleKey] || '').trim().length > 0;

  function save() {
    if (!canSave) return;
    const data = { ...draft, [titleKey]: draft[titleKey].trim() };
    const collection = COLLECTION[type];

    if (type === 'task') {
      if (data.mit && data.date) {
        const mits = state.tasks.filter((t) => t.mit && t.date === data.date && t.id !== data.id);
        if (mits.length >= 3) {
          showToast('Ya hay 3 prioridades para ese día');
          return;
        }
      }
      if (!data.date) data.mit = false;
      if (data.start && data.end && timeToMinutes(data.end) <= timeToMinutes(data.start)) {
        data.end = minutesToTime(Math.min(23 * 60 + 59, timeToMinutes(data.start) + (Number(data.estimate) || 30)));
      }
    }
    if (type === 'event' && timeToMinutes(data.end) <= timeToMinutes(data.start)) {
      data.end = minutesToTime(Math.min(23 * 60 + 59, timeToMinutes(data.start) + 30));
    }
    if (type === 'task' || type === 'event') {
      // Hora exacta del aviso por Telegram (la lee el servidor)
      // Se quitan los avisos que no se pueden calcular (p. ej. «a la hora» sin hora)
      const reminds = getReminds(data).filter((x) => computeOne(data, x));
      data.reminds = reminds;
      data.remindAts = computeRemindAts(data, reminds);
      data.remind = null;
      data.remindAt = null;
    }
    if (type === 'goal') {
      if (isNew && goalsOfMonth(state, data.month).length >= 5) {
        showToast('Máximo 5 objetivos por mes para mantener el foco');
        return;
      }
    }

    if (isNew) {
      if (type === 'task') actions.addTask(data);
      else actions.add(collection, data, type);
      showToast(type === 'task' && !data.date && !data.weekOf ? 'Añadida a la Bandeja de entrada' : CREATED[type]);
    } else {
      actions.upsert(collection, data);
      showToast('Cambios guardados');
    }
    onClose();
  }

  function remove() {
    const collection = COLLECTION[type];
    const snapshot = { ...editor.item };
    const linked = type === 'goal' ? state.tasks.filter((t) => t.goalId === snapshot.id).map((t) => t.id) : [];
    actions.remove(collection, snapshot.id);
    onClose();
    showToast('Eliminado', {
      label: 'Deshacer',
      run: () => {
        actions.upsert(collection, snapshot);
        linked.forEach((id) => actions.updateTask(id, { goalId: snapshot.id }));
      },
    });
  }

  const footer = (
    <div className="flex items-center gap-2">
      {!isNew && (
        <button type="button" onClick={remove} className="btn btn-ghost text-danger" aria-label="Eliminar">
          <Trash2 size={17} />
          <span className="hidden xs:inline">Eliminar</span>
        </button>
      )}
      <div className="flex-1" />
      <button type="button" onClick={onClose} className="btn btn-ghost">
        Cancelar
      </button>
      <button type="button" onClick={save} disabled={!canSave} className={cx('btn btn-primary min-w-[110px]', !canSave && 'opacity-40')}>
        {isNew ? 'Crear' : 'Guardar'}
      </button>
    </div>
  );

  return (
    <Sheet open onClose={onClose} title={TITLES[type][isNew ? 0 : 1]} footer={footer}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-5"
      >
        {isNew && !editor.lockType && (
          <Segmented options={TYPES} value={type} onChange={setType} size="sm" />
        )}

        <input
          autoFocus={isNew && window.matchMedia('(min-width: 768px)').matches}
          className="field text-[17px] font-medium"
          placeholder={type === 'habit' ? 'Nombre del hábito' : '¿Qué quieres conseguir?'}
          value={draft[titleKey] || ''}
          onChange={(e) => set({ [titleKey]: e.target.value })}
          enterKeyHint="done"
          aria-label="Título"
        />

        {type === 'task' && <TaskFields draft={draft} set={set} state={state} />}
        {type === 'event' && <EventFields draft={draft} set={set} state={state} />}
        {type === 'milestone' && <MilestoneFields draft={draft} set={set} state={state} />}
        {type === 'goal' && <GoalFields draft={draft} set={set} state={state} isNew={isNew} />}
        {type === 'habit' && <HabitFields draft={draft} set={set} />}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Sheet>
  );
}

function AreaSelect({ value, onChange, state }) {
  return (
    <select className="field" value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">Sin área</option>
      {state.areas.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}

function TaskFields({ draft, set, state }) {
  const today = todayKey();
  const tomorrow = addDays(today, 1);
  const monday = startOfWeek(today);
  const mode = !draft.date && !draft.weekOf ? 'inbox' : draft.date === today ? 'today' : draft.date === tomorrow ? 'tomorrow' : !draft.date ? 'week' : 'date';
  const [timeOn, setTimeOn] = useState(Boolean(draft.start));
  const goals = useMemo(() => state.goals.filter((g) => !draft.areaId || g.areaId === draft.areaId || g.id === draft.goalId), [state.goals, draft.areaId, draft.goalId]);

  const pick = (m) => {
    if (m === 'inbox') set({ date: null, weekOf: null });
    if (m === 'today') set({ date: today, weekOf: null });
    if (m === 'tomorrow') set({ date: tomorrow, weekOf: null });
    if (m === 'week') set({ date: null, weekOf: draft.weekOf || monday });
    if (m === 'date') set({ date: draft.date || addDays(today, 2), weekOf: null });
  };

  return (
    <>
      <Field label="Cuándo">
        <div className="flex flex-wrap gap-2">
          {[
            ['inbox', 'Bandeja'],
            ['today', 'Hoy'],
            ['tomorrow', 'Mañana'],
            ['week', 'Esta semana'],
            ['date', 'Elegir fecha'],
          ].map(([k, label]) => (
            <button key={k} type="button" onClick={() => pick(k)} className={cx('chip', mode === k && 'chip-active')}>
              {label}
            </button>
          ))}
        </div>
        {mode === 'date' && (
          <input type="date" className="field mt-2" value={draft.date || ''} onChange={(e) => set({ date: e.target.value || null })} />
        )}
      </Field>

      <Field label="Prioridad">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => set({ priority: null })} className={cx('chip', !draft.priority && 'chip-active')}>
            Ninguna
          </button>
          {Object.entries(PRIORITIES).map(([k, p]) => (
            <button key={k} type="button" onClick={() => set({ priority: k })} className={cx('chip', draft.priority === k && 'chip-active')}>
              <span className="glow-dot" style={{ color: p.color, width: 7, height: 7 }} />
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      {draft.date && (
        <button
          type="button"
          onClick={() => set({ mit: !draft.mit })}
          className={cx('flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left card pressable', draft.mit && 'ring-1 ring-warn/50')}
        >
          <Star size={18} className={cx(draft.mit ? 'fill-current text-warn' : 'faint')} />
          <span className="flex-1">
            <span className="block font-medium">Prioridad del día (MIT)</span>
            <span className="block text-[13px] muted">Máximo 3 por día</span>
          </span>
          <span className={cx('relative h-[31px] w-[51px] rounded-full transition-colors', draft.mit ? 'bg-ok' : 'bg-fg/15')}>
            <span
              className="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-300 ease-spring"
              style={{ transform: draft.mit ? 'translateX(20px)' : 'none' }}
            />
          </span>
        </button>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Área">
          <AreaSelect value={draft.areaId} onChange={(areaId) => set({ areaId })} state={state} />
        </Field>
        <Field label="Objetivo mensual">
          <select
            className="field"
            value={draft.goalId || ''}
            onChange={(e) => {
              const goalId = e.target.value || null;
              const g = state.goals.find((x) => x.id === goalId);
              set({ goalId, ...(g && !draft.areaId ? { areaId: g.areaId } : {}) });
            }}
          >
            <option value="">Sin objetivo</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Duración estimada">
        <div className="flex flex-wrap gap-2">
          {ESTIMATES.map((m) => (
            <button key={m} type="button" onClick={() => set({ estimate: m })} className={cx('chip tabular-nums', draft.estimate === m && 'chip-active')}>
              {m < 60 ? `${m} min` : `${m / 60} h`.replace('.5', ',5')}
            </button>
          ))}
        </div>
      </Field>

      {draft.date && (
        <div>
          <button
            type="button"
            onClick={() => {
              if (timeOn) set({ start: null, end: null });
              else set({ start: '10:00', end: minutesToTime(600 + (Number(draft.estimate) || 60)) });
              setTimeOn(!timeOn);
            }}
            className={cx('chip', timeOn && 'chip-active')}
          >
            <Clock3 size={14} /> {timeOn ? 'Bloque en la agenda' : 'Añadir a la agenda'}
          </button>
          {timeOn && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Inicio">
                <input type="time" className="field tabular-nums" value={draft.start || ''} onChange={(e) => set({ start: e.target.value || null })} />
              </Field>
              <Field label="Fin">
                <input type="time" className="field tabular-nums" value={draft.end || ''} onChange={(e) => set({ end: e.target.value || null })} />
              </Field>
            </div>
          )}
        </div>
      )}

      <RemindField draft={draft} set={set} />

      <Field label="Notas">
        <textarea className="field min-h-[88px] resize-none" placeholder="Detalles, enlaces, contexto…" value={draft.notes || ''} onChange={(e) => set({ notes: e.target.value })} />
      </Field>
    </>
  );
}

/** Avisos por Telegram: se pueden combinar varios (hasta 5) */
function RemindField({ draft, set }) {
  const opts = draft.date && draft.start ? REMIND_OPTIONS.withStart : draft.date ? REMIND_OPTIONS.dayOnly : [];
  const reminds = getReminds(draft);
  const presets = reminds.filter((x) => x.mode !== 'custom');
  const customs = reminds.filter((x) => x.mode === 'custom');
  const full = reminds.length >= MAX_REMINDS;
  const times = computeRemindAts(draft, reminds);
  const now = Date.now();

  const update = (list) => set({ reminds: list, remind: null });
  const toggle = (o) => {
    const on = presets.some((x) => sameRemind(x, o));
    if (on) update(reminds.filter((x) => !sameRemind(x, o)));
    else if (!full) update([...reminds, { mode: o.mode, minutes: o.minutes, time: o.time }]);
  };
  const addCustom = () => {
    if (full) return;
    const d = new Date(Date.now() + 60 * 60_000);
    d.setMinutes(0, 0, 0);
    update([...reminds, { mode: 'custom', at: d.toISOString() }]);
  };
  const setCustom = (idx, iso) => {
    let n = -1;
    update(reminds.map((x) => (x.mode === 'custom' && ++n === idx ? { ...x, at: iso } : x)));
  };
  const removeCustom = (idx) => {
    let n = -1;
    update(reminds.filter((x) => !(x.mode === 'custom' && ++n === idx)));
  };

  return (
    <Field label={`Recordatorios por Telegram${reminds.length ? ` · ${reminds.length}` : ''}`}>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const on = presets.some((x) => sameRemind(x, o));
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => toggle(o)}
              disabled={!on && full}
              aria-pressed={on}
              className={cx('chip', on && 'chip-active', !on && full && 'opacity-40')}
            >
              <BellRing size={13} /> {o.label}
            </button>
          );
        })}
        <button type="button" onClick={addCustom} disabled={full} className={cx('chip', full && 'opacity-40')}>
          + Otra fecha y hora
        </button>
        {reminds.length > 0 && (
          <button type="button" onClick={() => update([])} className="chip !text-danger">
            Quitar todos
          </button>
        )}
      </div>

      {customs.map((c, idx) => (
        <div key={idx} className="mt-2 flex items-center gap-2">
          <input
            type="datetime-local"
            className="field tabular-nums"
            value={toLocalInput(c.at)}
            onChange={(e) => e.target.value && setCustom(idx, new Date(e.target.value).toISOString())}
            aria-label={`Aviso personalizado ${idx + 1}`}
          />
          <button type="button" onClick={() => removeCustom(idx)} className="icon-btn shrink-0 faint" aria-label="Quitar este aviso">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <span className="mt-1.5 block text-[12px] faint">
        {!reminds.length
          ? opts.length
            ? 'Elige uno o varios avisos (hasta 5).'
            : 'Esta tarea no tiene día: usa «Otra fecha y hora».'
          : times.length
            ? `Te escribiré: ${times.map((t) => `${formatRemind(t)}${Date.parse(t) < now ? ' (ya pasó)' : ''}`).join(' · ')}`
            : 'Elige un día y una hora para poder avisarte'}
        {full && ' · Máximo 5 avisos.'}
      </span>
    </Field>
  );
}

function EventFields({ draft, set, state }) {
  return (
    <>
      <Field label="Día">
        <input type="date" className="field" value={draft.date || ''} onChange={(e) => set({ date: e.target.value || todayKey() })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Inicio">
          <input type="time" className="field tabular-nums" value={draft.start} onChange={(e) => set({ start: e.target.value || '09:00' })} />
        </Field>
        <Field label="Fin">
          <input type="time" className="field tabular-nums" value={draft.end} onChange={(e) => set({ end: e.target.value || '10:00' })} />
        </Field>
      </div>
      <Field label="Área">
        <AreaSelect value={draft.areaId} onChange={(areaId) => set({ areaId })} state={state} />
      </Field>
      <RemindField draft={draft} set={set} />
    </>
  );
}

function MilestoneFields({ draft, set, state }) {
  return (
    <>
      <Field label="Tipo" hint="El calendario mensual solo muestra hitos, entregas, eventos clave y fechas límite.">
        <div className="flex flex-wrap gap-2">
          {Object.entries(MILESTONE_TYPES).map(([k, m]) => (
            <button key={k} type="button" onClick={() => set({ type: k })} className={cx('chip', draft.type === k && 'chip-active')}>
              {m.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Fecha">
        <input type="date" className="field" value={draft.date || ''} onChange={(e) => set({ date: e.target.value || todayKey() })} />
      </Field>
      <Field label="Área">
        <AreaSelect value={draft.areaId} onChange={(areaId) => set({ areaId })} state={state} />
      </Field>
    </>
  );
}

function GoalFields({ draft, set, state, isNew }) {
  const progress = !isNew ? goalProgress(state, draft.id) : null;
  const months = [-1, 0, 1, 2].map((i) => addMonths(monthKeyOf(todayKey()), i));
  if (draft.month && !months.includes(draft.month)) months.unshift(draft.month);
  return (
    <>
      {progress && (
        <div className="rounded-2xl p-4 card">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[13px] muted">Progreso automático</span>
            <span className="text-[15px] font-semibold tabular-nums">{progress.pct}%</span>
          </div>
          <ProgressBar value={progress.pct} />
          <p className="mt-2 text-[12px] faint tabular-nums">
            {progress.done} de {progress.total} tareas vinculadas completadas
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Categoría (área)">
          <AreaSelect value={draft.areaId} onChange={(areaId) => set({ areaId })} state={state} />
        </Field>
        <Field label="Mes">
          <select className="field" value={draft.month} onChange={(e) => set({ month: e.target.value })}>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthYear(m)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Fecha límite">
        <input type="date" className="field" value={draft.deadline || ''} onChange={(e) => set({ deadline: e.target.value || null })} />
      </Field>
      <p className="text-[13px] faint">El progreso se calcula solo, según las tareas vinculadas a este objetivo que vayas completando.</p>
    </>
  );
}

function HabitFields({ draft, set }) {
  const colors = [...AREA_COLORS];
  return (
    <>
      <Field label="Icono">
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(HABIT_ICONS).map(([k, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => set({ icon: k })}
              className={cx('flex h-12 items-center justify-center rounded-xl card pressable', draft.icon === k && 'ring-2 ring-accent')}
              style={{ color: draft.color }}
              aria-label={k}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Color">
        <div className="flex flex-wrap gap-2.5">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set({ color: c })}
              className="tap-target h-8 w-8 rounded-full transition-transform duration-300 ease-spring"
              style={{
                background: c,
                transform: draft.color === c ? 'scale(1.12)' : undefined,
                boxShadow: draft.color === c ? `0 0 0 3px var(--bg), 0 0 0 5px ${c}` : 'inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </Field>
    </>
  );
}
