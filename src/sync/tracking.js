// Seguimiento de cambios para la sincronización.
// Cada cambio local deja una marca en la «bandeja de salida» (outbox) con su hora;
// el motor de sincronización la sube y, al confirmarse, la borra.
import { computeRemindAts, getReminds } from '../lib/reminders';

export const SYNCED = ['tasks', 'events', 'milestones', 'goals', 'habits', 'areas'];
const ALL = [...SYNCED, 'weekFocus', 'meta'];

/** Preferencias que viajan entre dispositivos (la barra lateral es de cada dispositivo) */
export const prefsOf = (settings = {}) => ({
  theme: settings.theme,
  custom: settings.custom ?? null,
  features: settings.features ?? null,
  profile: settings.profile ?? null, // foto y colores del perfil
});
const samePrefs = (a, b) => JSON.stringify(prefsOf(a)) === JSON.stringify(prefsOf(b));

export const emptySync = () => ({ outbox: {}, cursor: 0, initialized: false });

/** Recalcula la hora de aviso si cambió la fecha u hora de una tarea/bloque */
function refreshReminders(prev, next) {
  for (const c of ['tasks', 'events']) {
    if (prev[c] === next[c]) continue;
    const before = new Map(prev[c].map((x) => [x.id, x]));
    let changed = false;
    const list = next[c].map((item) => {
      const old = before.get(item.id);
      if (old === item) return item;
      const reminds = getReminds(item);
      if (!reminds.length) return item;
      if (old && old.date === item.date && old.start === item.start && getReminds(old) === reminds) return item;
      if (reminds.every((x) => x.mode === 'custom') && Array.isArray(item.remindAts)) return item;
      const remindAts = computeRemindAts(item, reminds);
      if (JSON.stringify(remindAts) === JSON.stringify(item.remindAts)) return item;
      changed = true;
      return { ...item, reminds, remindAts, remind: null, remindAt: null };
    });
    if (changed) next = { ...next, [c]: list };
  }
  return next;
}

/** Compara el estado anterior con el nuevo y apunta en el outbox lo que cambió */
export function track(prev, next, now = Date.now()) {
  next = refreshReminders(prev, next);
  const outbox = { ...next._sync.outbox };
  let dirty = false;
  const mark = (key) => {
    outbox[key] = now;
    dirty = true;
  };

  for (const c of SYNCED) {
    if (prev[c] === next[c]) continue;
    const before = new Map(prev[c].map((x) => [x.id, x]));
    const ids = new Set();
    for (const item of next[c]) {
      ids.add(item.id);
      if (before.get(item.id) !== item) mark(`${c}:${item.id}`);
    }
    for (const id of before.keys()) if (!ids.has(id)) mark(`${c}:${id}`);
  }
  if (prev.settings !== next.settings && !samePrefs(prev.settings, next.settings)) mark('meta:prefs');
  if (prev.weekFocus !== next.weekFocus) {
    const keys = new Set([...Object.keys(prev.weekFocus || {}), ...Object.keys(next.weekFocus || {})]);
    for (const k of keys) if ((prev.weekFocus || {})[k] !== (next.weekFocus || {})[k]) mark(`weekFocus:${k}`);
  }
  return dirty ? { ...next, _sync: { ...next._sync, outbox } } : next;
}

export function splitKey(key) {
  const i = key.indexOf(':');
  return [key.slice(0, i), key.slice(i + 1)];
}

/** Convierte las entradas del outbox en filas para el servidor */
export function outboxRows(state, limit = 400, skip = {}) {
  const rows = [];
  const sent = {};
  for (const [key, ts] of Object.entries(state._sync.outbox)) {
    if (rows.length >= limit) break;
    if (skip[key] === ts) continue; // ya enviado en esta tanda
    const [collection, id] = splitKey(key);
    if (!ALL.includes(collection)) continue;
    let data = null;
    if (collection === 'weekFocus') {
      const text = state.weekFocus?.[id];
      data = text != null && text !== '' ? { text } : null;
    } else if (collection === 'meta') {
      if (id !== 'prefs') continue;
      data = prefsOf(state.settings);
    } else {
      data = state[collection].find((x) => x.id === id) ?? null;
    }
    rows.push({ collection, id, data, deleted: data == null, updated_at: new Date(ts).toISOString() });
    sent[key] = ts;
  }
  return { rows, sent };
}

/** Aplica cambios que llegan del servidor (otro dispositivo o Telegram) */
export function applyRemote(state, rows) {
  const outbox = { ...state._sync.outbox };
  const lists = {};
  let weekFocus = state.weekFocus;
  let settings = state.settings;
  let cursor = state._sync.cursor;
  let touched = false;

  for (const row of rows) {
    if (row.rev && row.rev > cursor) cursor = row.rev;
    const key = `${row.collection}:${row.id}`;
    const remoteTs = Date.parse(row.updated_at);
    const pending = outbox[key];
    if (pending && pending >= remoteTs) continue; // mi cambio local es más reciente
    if (pending) delete outbox[key];

    if (row.collection === 'meta') {
      if (row.id === 'prefs' && row.data && !row.deleted) {
        const d = row.data;
        settings = { ...settings, ...(d.theme ? { theme: d.theme } : {}), custom: d.custom ?? null, features: d.features ?? null, profile: d.profile ?? null };
        touched = true;
      }
      continue;
    }
    if (row.collection === 'weekFocus') {
      const nextWf = { ...weekFocus };
      if (row.deleted || !row.data) delete nextWf[row.id];
      else nextWf[row.id] = row.data.text ?? '';
      weekFocus = nextWf;
      touched = true;
      continue;
    }
    if (!SYNCED.includes(row.collection)) continue;
    const c = row.collection;
    const list = lists[c] ?? (lists[c] = [...state[c]]);
    const idx = list.findIndex((x) => x.id === row.id);
    if (row.deleted || !row.data) {
      if (idx >= 0) list.splice(idx, 1);
    } else {
      const item = { ...row.data, id: row.id };
      if (idx >= 0) list[idx] = item;
      else list.push(item);
    }
    touched = true;
  }

  if (!touched && cursor === state._sync.cursor) return state;
  return { ...state, ...lists, weekFocus, settings, _sync: { ...state._sync, outbox, cursor } };
}

/** Primera sincronización del dispositivo: sube lo que solo existe aquí */
export function markLocalOnly(state, serverKeys, now = Date.now()) {
  const outbox = { ...state._sync.outbox };
  for (const c of SYNCED) for (const item of state[c]) if (!serverKeys.has(`${c}:${item.id}`)) outbox[`${c}:${item.id}`] = now;
  for (const k of Object.keys(state.weekFocus || {})) if (!serverKeys.has(`weekFocus:${k}`)) outbox[`weekFocus:${k}`] = now;
  if (!serverKeys.has('meta:prefs')) outbox['meta:prefs'] = now;
  return { ...state, _sync: { ...state._sync, outbox, initialized: true } };
}

export function ack(state, sent) {
  const outbox = { ...state._sync.outbox };
  let changed = false;
  for (const [key, ts] of Object.entries(sent)) {
    if (outbox[key] === ts) {
      delete outbox[key];
      changed = true;
    }
  }
  return changed ? { ...state, _sync: { ...state._sync, outbox } } : state;
}
