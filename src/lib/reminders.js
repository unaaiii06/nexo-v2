// Recordatorios: una tarea o bloque guarda `remind` (cómo avisar) y `remindAt`
// (instante exacto en ISO/UTC) que es lo que lee el servidor para enviar el Telegram.
import { fromKey } from './dates';

export const REMIND_OPTIONS = {
  withStart: [
    { mode: 'start', label: 'A la hora' },
    { mode: 'before', minutes: 15, label: '15 min antes' },
    { mode: 'before', minutes: 60, label: '1 h antes' },
  ],
  dayOnly: [
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

/** Calcula el instante del aviso a partir de la configuración y la fecha/hora del elemento */
export function computeRemindAt(item) {
  const r = item?.remind;
  if (!r) return null;
  let d = null;
  if (r.mode === 'custom') d = r.at ? new Date(r.at) : null;
  else if (r.mode === 'start') d = at(item.date, item.start);
  else if (r.mode === 'before') {
    d = at(item.date, item.start);
    if (d) d = new Date(d.getTime() - (r.minutes || 0) * 60_000);
  } else if (r.mode === 'time') d = at(item.date, r.time);
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
}

export function sameRemind(a, b) {
  return a?.mode === b?.mode && a?.minutes === b?.minutes && a?.time === b?.time;
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
