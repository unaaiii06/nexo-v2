import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { createEmpty, createSeed, DEFAULT_SETTINGS, DEFAULT_AREAS, SCHEMA_VERSION } from '../data/seed';
import { uid } from '../lib/utils';
import { addDays, startOfWeek, todayKey } from '../lib/dates';

import { track, applyRemote, markLocalOnly, ack, emptySync } from '../sync/tracking';
import { useSync } from '../sync/useSync';

/** Datos de cada cuenta en este dispositivo (prefijo nexo2: para no tocar la v1) */
export const dataKey = (userId) => `nexo2:data:${userId}`;

const COLLECTIONS = ['tasks', 'events', 'milestones', 'goals', 'habits', 'areas'];

/** Valida y normaliza datos externos (localStorage o copia importada). Lanza si no son válidos. */
export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Formato no válido');
  const data = raw.data && (raw.app === 'nexo' || raw.app === 'cascada') ? raw.data : raw; // admite el envoltorio de exportación
  for (const c of ['tasks', 'habits', 'goals']) {
    if (!Array.isArray(data[c])) throw new Error(`Falta la colección «${c}»`);
  }
  const out = {
    version: SCHEMA_VERSION,
    tasks: [],
    events: [],
    milestones: [],
    goals: [],
    habits: [],
    areas: [],
    weekFocus: {},
    settings: { ...DEFAULT_SETTINGS },
  };
  for (const c of COLLECTIONS) {
    out[c] = Array.isArray(data[c]) ? data[c].filter((x) => x && typeof x === 'object' && x.id) : [];
  }
  if (!out.areas.length) out.areas = DEFAULT_AREAS.map((a) => ({ ...a }));
  out.habits = out.habits.map((h) => ({ ...h, log: h.log && typeof h.log === 'object' ? h.log : {} }));
  out.tasks = out.tasks.map((t) => ({
    notes: '', date: null, weekOf: null, priority: null, mit: false, done: false, doneAt: null,
    areaId: null, goalId: null, start: null, end: null, estimate: 30, createdAt: Date.now(),
    ...t,
    title: String(t.title ?? 'Sin título'),
  }));
  if (data.weekFocus && typeof data.weekFocus === 'object') out.weekFocus = { ...data.weekFocus };
  if (data.settings && typeof data.settings === 'object') out.settings = { ...out.settings, ...data.settings };
  out._sync = emptySync();
  return out;
}

function loadInitial(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = normalizeState(parsed);
      // Conserva el estado de sincronización guardado en este dispositivo
      if (parsed._sync && typeof parsed._sync === 'object') state._sync = { ...emptySync(), ...parsed._sync };
      return state;
    }
  } catch (err) {
    console.warn('[Nexo] Datos guardados no válidos; se empieza con datos vacíos.', err);
  }
  return { ...createEmpty(), _sync: emptySync() };
}

/** Reducer raíz: aplica la acción y apunta los cambios locales para sincronizarlos */
function rootReducer(state, action) {
  switch (action.type) {
    case 'remoteMerge':
      return applyRemote(state, action.rows);
    case 'syncInit':
      return markLocalOnly(state, action.serverKeys);
    case 'syncAck':
      return ack(state, action.sent);
    default: {
      const next = reducer(state, action);
      return next === state ? state : track(state, next);
    }
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'upsert': {
      const { collection, item } = action;
      const list = state[collection];
      const exists = list.some((x) => x.id === item.id);
      return {
        ...state,
        [collection]: exists ? list.map((x) => (x.id === item.id ? { ...x, ...item } : x)) : [...list, item],
      };
    }
    case 'patch': {
      const { collection, id, patch } = action;
      return { ...state, [collection]: state[collection].map((x) => (x.id === id ? { ...x, ...patch } : x)) };
    }
    case 'remove': {
      const { collection, id } = action;
      let next = { ...state, [collection]: state[collection].filter((x) => x.id !== id) };
      // Mantiene la integridad referencial
      if (collection === 'goals') next.tasks = next.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t));
      if (collection === 'areas') {
        next.tasks = next.tasks.map((t) => (t.areaId === id ? { ...t, areaId: null } : t));
        next.goals = next.goals.map((g) => (g.areaId === id ? { ...g, areaId: null } : g));
      }
      return next;
    }
    case 'toggleTask':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done, doneAt: !t.done ? Date.now() : null } : t,
        ),
      };
    case 'toggleHabit':
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h;
          const log = { ...h.log };
          if (log[action.date]) delete log[action.date];
          else log[action.date] = true;
          return { ...h, log };
        }),
      };
    case 'weekFocus':
      return { ...state, weekFocus: { ...state.weekFocus, [action.week]: action.text } };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'replace':
      // Importar / restaurar: se conserva el estado de sincronización del dispositivo
      return { ...action.state, _sync: state._sync };
    default:
      return state;
  }
}

const StoreContext = createContext(null);

/** Estado de UNA cuenta. Se monta con key={userId}, así que al cambiar de cuenta se recarga entero. */
export function StoreProvider({ userId, children }) {
  const key = dataKey(userId);
  const [state, dispatch] = useReducer(rootReducer, key, loadInitial);
  const sync = useSync({ userId, state, dispatch });
  // Guardado automático en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.warn('[Nexo] No se pudo guardar en localStorage', err);
    }
  }, [state, key]);

  const actions = useMemo(() => {
    const upsert = (collection, item) => dispatch({ type: 'upsert', collection, item });
    return {
      addTask: (data) => {
        const task = {
          id: uid('task'), title: '', notes: '', date: null, weekOf: null, priority: null, mit: false,
          done: false, doneAt: null, areaId: null, goalId: null, start: null, end: null, estimate: 30,
          createdAt: Date.now(), ...data,
        };
        upsert('tasks', task);
        return task;
      },
      updateTask: (id, patch) => dispatch({ type: 'patch', collection: 'tasks', id, patch }),
      toggleTask: (id) => dispatch({ type: 'toggleTask', id }),
      /** Programa una tarea: 'today' | 'tomorrow' | 'week' | 'nextWeek' | 'inbox' | 'YYYY-MM-DD' | {weekOf} */
      scheduleTask: (id, when) => {
        const today = todayKey();
        let patch;
        if (when === 'inbox') patch = { date: null, weekOf: null };
        else if (when === 'today') patch = { date: today, weekOf: null };
        else if (when === 'tomorrow') patch = { date: addDays(today, 1), weekOf: null };
        else if (when === 'week') patch = { date: null, weekOf: startOfWeek(today) };
        else if (when === 'nextWeek') patch = { date: null, weekOf: startOfWeek(addDays(today, 7)) };
        else if (typeof when === 'object' && when.weekOf) patch = { date: null, weekOf: when.weekOf };
        else patch = { date: when, weekOf: null };
        dispatch({ type: 'patch', collection: 'tasks', id, patch });
      },
      upsert,
      add: (collection, data, prefix) => {
        const item = { id: uid(prefix || collection.slice(0, -1)), ...data };
        upsert(collection, item);
        return item;
      },
      patch: (collection, id, patch) => dispatch({ type: 'patch', collection, id, patch }),
      remove: (collection, id) => dispatch({ type: 'remove', collection, id }),
      toggleHabit: (id, date) => dispatch({ type: 'toggleHabit', id, date }),
      setWeekFocus: (week, text) => dispatch({ type: 'weekFocus', week, text }),
      setSettings: (patch) => dispatch({ type: 'settings', patch }),
      replaceAll: (next) => dispatch({ type: 'replace', state: next }),
      /** Vuelve a la demo conservando los ajustes personales (tema, nombre…) */
      resetSeed: (keepSettings) => {
        const seed = createSeed();
        if (keepSettings) seed.settings = { ...seed.settings, ...keepSettings };
        dispatch({ type: 'replace', state: seed });
      },
      /** Borra todo y empieza de cero (mantiene tema y ajustes) */
      resetEmpty: (keepSettings) => {
        const empty = createEmpty();
        if (keepSettings) empty.settings = { ...empty.settings, ...keepSettings };
        dispatch({ type: 'replace', state: empty });
      },
    };
  }, []);

  const value = useMemo(() => ({ state, actions, sync }), [state, actions, sync]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}
