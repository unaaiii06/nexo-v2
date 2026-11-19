// Utilidades de fechas en hora local, semanas de lunes a domingo, locale es-ES.
// Las fechas se guardan como claves 'YYYY-MM-DD' para evitar problemas de zona horaria.

const LOCALE = 'es-ES';

const pad = (n) => String(n).padStart(2, '0');

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function addMonths(monthKey, n) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Índice de día con lunes = 0 … domingo = 6 */
export function weekdayIndex(key) {
  return (fromKey(key).getDay() + 6) % 7;
}

/** Lunes de la semana de una fecha */
export function startOfWeek(key) {
  return addDays(key, -weekdayIndex(key));
}

export function weekDays(mondayKey) {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayKey, i));
}

export function monthKeyOf(key) {
  return key.slice(0, 7);
}

export function daysInMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthDays(monthKey) {
  return Array.from({ length: daysInMonth(monthKey) }, (_, i) => `${monthKey}-${pad(i + 1)}`);
}

/** Matriz de 6 semanas (42 claves) que empieza en lunes, para el calendario mensual */
export function monthMatrix(monthKey) {
  const first = `${monthKey}-01`;
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function diffDays(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}

export function isWeekend(key) {
  return weekdayIndex(key) >= 5;
}

const fmtCache = new Map();
function fmt(opts) {
  const id = JSON.stringify(opts);
  if (!fmtCache.has(id)) fmtCache.set(id, new Intl.DateTimeFormat(LOCALE, opts));
  return fmtCache.get(id);
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatLongDate = (key) =>
  cap(fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(fromKey(key)));
export const formatShortDate = (key) => fmt({ day: 'numeric', month: 'short' }).format(fromKey(key)).replace('.', '');
export const formatWeekdayShort = (key) => cap(fmt({ weekday: 'short' }).format(fromKey(key)).replace('.', ''));
export const formatWeekdayLong = (key) => cap(fmt({ weekday: 'long' }).format(fromKey(key)));
export const formatMonthYear = (monthKey) =>
  cap(fmt({ month: 'long', year: 'numeric' }).format(fromKey(`${monthKey}-01`)));
export const formatMonth = (monthKey) => cap(fmt({ month: 'long' }).format(fromKey(`${monthKey}-01`)));

export const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Fecha relativa amable: Hoy, Mañana, Ayer, Lun 12 nov… */
export function relativeDay(key, today = todayKey()) {
  const d = diffDays(today, key);
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  if (d === -1) return 'Ayer';
  if (d > 1 && d < 7) return formatWeekdayLong(key);
  return `${formatWeekdayShort(key)} ${formatShortDate(key)}`;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h >= 6 && h < 14) return 'Buenos días';
  if (h >= 14 && h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

export function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function formatDuration(min) {
  if (!min) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}
