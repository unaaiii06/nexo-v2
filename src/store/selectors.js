// Selectores derivados: los progresos nunca se guardan, siempre se calculan del estado.
import { addDays, monthKeyOf, startOfWeek, timeToMinutes, todayKey, weekDays } from '../lib/dates';
import { DAY_CAPACITY_MIN, DEFAULT_ESTIMATE, pct } from '../lib/utils';

export const isInbox = (t) => !t.date && !t.weekOf;

export function inboxTasks(state) {
  return state.tasks.filter(isInbox).sort((a, b) => b.createdAt - a.createdAt);
}

export function tasksOn(state, date) {
  return state.tasks.filter((t) => t.date === date);
}

const prioRank = { high: 0, medium: 1, low: 2 };
export function sortTasks(list) {
  return [...list].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      (prioRank[a.priority] ?? 3) - (prioRank[b.priority] ?? 3) ||
      (timeToMinutes(a.start) ?? 9999) - (timeToMinutes(b.start) ?? 9999) ||
      a.createdAt - b.createdAt,
  );
}

export function dayProgress(state, date = todayKey()) {
  const list = tasksOn(state, date);
  const done = list.filter((t) => t.done).length;
  return { done, total: list.length, pct: pct(done, list.length) };
}

export function dayLoad(state, date) {
  const minutes = tasksOn(state, date)
    .filter((t) => !t.done)
    .reduce((s, t) => s + (Number(t.estimate) || DEFAULT_ESTIMATE), 0);
  const total = tasksOn(state, date).reduce((s, t) => s + (Number(t.estimate) || DEFAULT_ESTIMATE), 0);
  const ratio = total / DAY_CAPACITY_MIN;
  const level = ratio > 1 ? 'over' : ratio > 0.75 ? 'high' : 'ok';
  return { minutes, total, ratio, level };
}

export function weekBacklog(state, monday) {
  return state.tasks.filter((t) => !t.date && t.weekOf === monday);
}

export function weekProgress(state, monday) {
  const days = new Set(weekDays(monday));
  const list = state.tasks.filter((t) => (t.date && days.has(t.date)) || (!t.date && t.weekOf === monday));
  const done = list.filter((t) => t.done).length;
  return { done, total: list.length, pct: pct(done, list.length) };
}

/** Tareas sin completar de días anteriores a hoy o de semanas pasadas sin día */
export function overdueTasks(state, today = todayKey()) {
  const monday = startOfWeek(today);
  return state.tasks.filter(
    (t) => !t.done && ((t.date && t.date < today) || (!t.date && t.weekOf && t.weekOf < monday)),
  );
}

export function goalProgress(state, goalId) {
  const list = state.tasks.filter((t) => t.goalId === goalId);
  const done = list.filter((t) => t.done).length;
  return { done, total: list.length, pct: pct(done, list.length) };
}

export function goalsOfMonth(state, monthKey) {
  return state.goals.filter((g) => (g.month || monthKeyOf(g.deadline || todayKey())) === monthKey);
}

export function areaStats(state, areaId, today = todayKey()) {
  const list = state.tasks.filter((t) => t.areaId === areaId);
  const done = list.filter((t) => t.done).length;
  const nextMilestone = state.milestones
    .filter((m) => m.areaId === areaId && m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return {
    active: list.length - done,
    done,
    total: list.length,
    pct: pct(done, list.length),
    nextMilestone,
    goals: state.goals.filter((g) => g.areaId === areaId),
  };
}

/** Racha actual: días consecutivos hasta hoy (si hoy aún no está hecho, cuenta desde ayer) */
export function habitStreak(habit, today = todayKey()) {
  let d = habit.log[today] ? today : addDays(today, -1);
  let n = 0;
  while (habit.log[d]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function milestonesOn(state, date) {
  return state.milestones.filter((m) => m.date === date);
}

export function agendaItems(state, date) {
  const fromTasks = state.tasks
    .filter((t) => t.date === date && t.start)
    .map((t) => ({ kind: 'task', id: t.id, title: t.title, start: t.start, end: t.end, areaId: t.areaId, done: t.done, ref: t }));
  const fromEvents = state.events
    .filter((e) => e.date === date)
    .map((e) => ({ kind: 'event', id: e.id, title: e.title, start: e.start, end: e.end, areaId: e.areaId, ref: e }));
  return [...fromTasks, ...fromEvents].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

export function areaById(state, id) {
  return state.areas.find((a) => a.id === id);
}

export function goalById(state, id) {
  return state.goals.find((g) => g.id === id);
}
