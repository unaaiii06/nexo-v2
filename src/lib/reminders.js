// Recordatorios: una tarea o bloque guarda `reminds` (lista de «cómo avisar») y
// `remindAts` (instantes exactos en ISO/UTC), que es lo que lee el servidor para enviar
// cada Telegram. Compatible con el formato antiguo de un solo aviso (`remind`/`remindAt`).
import { fromKey } from './dates';

export const MAX_REMINDS = 5;

export const REMIND_OPTIONS = {
  withStart: [
    { mode: 'start', label: 'A la hora' },
    { mode: 'before', minutes: 5, label: '5 min antes' },
    { mode: 'before', minutes: 15, label: '15 min antes' },
    { mode: 'before', minutes: 30, label: '30 min antes' },
    { mode: 'before', minutes: 60, label: '1 h antes' },
    { mode: 'before', minutes: 1440, label: '1 día antes' },
  ],
  // Solo hitos (entregas y eventos): con antelación
  milestone: [
    { mode: 'daysBefore', days: 7, time: '09:00', label: '1 semana antes' },
    { mode: 'daysBefore', days: 3, time: '09:00', label: '3 días antes' },
  ],
  dayOnly: [
    { mode: 'dayBefore', time: '20:00', label: 'La víspera a las 20:00' },
    { mode: 'time', time: '09:00', label: 'A las 9:00' },
    { mode: 'time', time: '13:00', label: 'A las 13:00' },
    { mode: 'time', time: '18:00', label: 'A las 18:00' },
  ],
};

function at(dateKey, hhmm) {
  if (!dateKey || !hhmm) return null;
  const d = fromKey(dateKey);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Lista de avisos de un elemento (acepta el formato antiguo de un solo aviso) */
export function getReminds(item) {
  if (Array.isArray(item?.reminds)) return item.reminds;
  return item?.remind ? [item.remind] : [];
}

/** Instante de UN aviso según la fecha/hora del elemento */
export function computeOne(item, r) {
  let d = null;
  if (r.mode === 'custom') d = r.at ? new Date(r.at) : null;
  else if (r.mode === 'start') d = at(item.date, item.start);
  else if (r.mode === 'before') {
    d = at(item.date, item.start);
    if (d) d = new Date(d.getTime() - (r.minutes || 0) * 60_000);
  } else if (r.mode === 'time') d = at(item.date, r.time);
  else if (r.mode === 'dayBefore') {
    d = at(item.date, r.time);
    if (d) d.setDate(d.getDate() - 1);
  } else if (r.mode === 'daysBefore') {
    d = at(item.date, r.time || '09:00');
    if (d) d.setDate(d.getDate() - (r.days || 1));
  }
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
}

/** Todos los instantes de aviso, ordenados y sin duplicados */
export function computeRemindAts(item, reminds = getReminds(item)) {
  return [...new Set(reminds.map((r) => computeOne(item, r)).filter(Boolean))].sort();
}

/** Próximo aviso pendiente (o null) */
export function nextRemind(item, now = Date.now()) {
  const list = Array.isArray(item?.remindAts) ? item.remindAts : item?.remindAt ? [item.remindAt] : [];
  return list.filter((iso) => Date.parse(iso) > now).sort()[0] ?? null;
}

export function upcomingCount(item, now = Date.now()) {
  const list = Array.isArray(item?.remindAts) ? item.remindAts : item?.remindAt ? [item.remindAt] : [];
  return list.filter((iso) => Date.parse(iso) > now).length;
}

export function sameRemind(a, b) {
  return (
    a?.mode === b?.mode &&
    (a?.minutes ?? null) === (b?.minutes ?? null) &&
    (a?.time ?? null) === (b?.time ?? null) &&
    (a?.days ?? null) === (b?.days ?? null)
  );
}

/** "YYYY-MM-DDTHH:MM" local para <input type="datetime-local"> */
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function formatRemind(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  return `${d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).replace('.', '')} ${time}`;
}
