export function uid(prefix = 'id') {
  const rnd = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

/** Vibración háptica ligera en dispositivos compatibles (Android). iOS la ignora sin error. */
export function haptic(ms = 8) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* sin soporte */
  }
}

export const PRIORITIES = {
  high: { label: 'Alta', short: 'Alta', color: 'var(--prio-high)' },
  medium: { label: 'Media', short: 'Media', color: 'var(--prio-medium)' },
  low: { label: 'Baja', short: 'Baja', color: 'var(--prio-low)' },
};

export const AREA_COLORS = ['#0A84FF', '#BF5AF2', '#30D158', '#FFD60A', '#FF9F0A', '#FF375F', '#64D2FF', '#5E5CE6'];

export const MILESTONE_TYPES = {
  hito: { label: 'Hito' },
  entrega: { label: 'Entrega' },
  evento: { label: 'Evento' },
  limite: { label: 'Fecha límite' },
};

export const DAY_CAPACITY_MIN = 6 * 60; // capacidad diaria planificable
export const DEFAULT_ESTIMATE = 30;
