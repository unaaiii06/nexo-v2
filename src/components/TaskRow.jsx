import { Clock, Target, Star, BellRing } from 'lucide-react';
import { formatRemind, nextRemind, upcomingCount } from '../lib/reminders';
import { useStore } from '../store/AppStore';
import { useUI } from '../store/ui';
import { areaById, goalById } from '../store/selectors';
import { cx, haptic } from '../lib/utils';
import { formatDuration, relativeDay } from '../lib/dates';
import { Check, PriorityDot, AreaBadge } from './primitives';

/**
 * Fila de tarea reutilizable. `showDate` muestra la fecha relativa, `actions` añade controles a la derecha.
 */
export default function TaskRow({ task, showDate, showGoal = true, actions, className, compact, leaving }) {
  const { state, actions: a } = useStore();
  const { openEditor } = useUI();
  const area = areaById(state, task.areaId);
  const goal = showGoal ? goalById(state, task.goalId) : null;
  const color = 'rgb(var(--accent))';

  return (
    <div
      className={cx(
        'group flex items-start gap-3 rounded-2xl px-3 py-2.5 card card-interactive',
        leaving && 'animate-leave',
        className,
      )}
    >
      <div className="pt-[1px]">
        <Check
          checked={task.done}
          color={color}
          size={compact ? 20 : 22}
          onChange={() => {
            haptic();
            a.toggleTask(task.id);
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => openEditor('task', task)}
        className="min-w-0 flex-1 text-left"
        aria-label={`Editar: ${task.title}`}
      >
        <div className={cx('flex items-center gap-1.5 leading-snug', compact ? 'text-[14px]' : 'text-[15px]', task.done ? 'done-title' : 'font-medium')}>
          {task.mit && !task.done && <Star size={12} className="shrink-0 fill-current text-warn" />}
          <span className="line-clamp-2">{task.title}</span>
        </div>
        {(area || goal || task.start || task.priority || showDate || task.estimate) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] muted">
            <PriorityDot priority={task.priority} />
            {showDate && task.date && <span className="tabular-nums">{relativeDay(task.date)}</span>}
            {task.start && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock size={11} />
                {task.start}
                {task.end ? `–${task.end}` : ''}
              </span>
            )}
            {!task.start && !compact && task.estimate ? <span className="tabular-nums">{formatDuration(task.estimate)}</span> : null}
            {!task.done && nextRemind(task) && (
              <span className="inline-flex items-center gap-1 tabular-nums text-accent">
                <BellRing size={11} />
                {formatRemind(nextRemind(task))}
                {upcomingCount(task) > 1 && <span className="opacity-70">+{upcomingCount(task) - 1}</span>}
              </span>
            )}
            <AreaBadge area={area} compact={compact} />
            {goal && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Target size={11} className="shrink-0" />
                <span className="max-w-[140px] truncate">{goal.title}</span>
              </span>
            )}
          </div>
        )}
      </button>
      {actions && <div className="flex shrink-0 items-center gap-1 self-center">{actions}</div>}
    </div>
  );
}
