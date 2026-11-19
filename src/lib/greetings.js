// Saludos variados según la franja del día, el día de la semana y cómo va el día.
// {n} se sustituye por el nombre. Todas las frases son neutras en género.

const BANDS = [
  { id: 'madrugada', from: 0, to: 6 },
  { id: 'temprano', from: 6, to: 9 },
  { id: 'manana', from: 9, to: 12 },
  { id: 'mediodia', from: 12, to: 15 },
  { id: 'tarde', from: 15, to: 20 },
  { id: 'noche', from: 20, to: 24 },
];

const POOL = {
  madrugada: [
    'Es tarde, {n}. Descansar también es productivo',
    'La ciudad duerme, {n}',
    'Hola, {n}. Hora de las ideas nocturnas',
    'Buenas noches, {n}. Mañana será otro gran día',
    'Silencio total, {n}. Que no se te haga muy tarde',
  ],
  temprano: [
    'Buenos días, {n}',
    'Arriba, {n}. El día acaba de empezar',
    'Café y foco, {n}',
    'Primera hora, {n}. Mente clara',
    'Buenos días, {n}. ¿Qué hará que hoy merezca la pena?',
    'Amanece, {n}. Empieza por lo importante',
  ],
  manana: [
    'Buenos días, {n}',
    'A por la mañana, {n}',
    'Hola, {n}. Momento perfecto para lo difícil',
    'Buen ritmo, {n}. Sigue así',
    'Buenos días, {n}. Paso a paso',
    'Mañana productiva, {n}',
  ],
  mediodia: [
    'Hola, {n}. Mitad del día',
    '¿Qué tal va la mañana, {n}?',
    'Pausa merecida, {n}',
    'Hola, {n}. Recarga energía para la tarde',
  ],
  tarde: [
    'Buenas tardes, {n}',
    'La tarde es tuya, {n}',
    'Segunda mitad del día, {n}',
    'Buenas tardes, {n}. Último empujón',
    'Hola, {n}. Aún queda tarde por delante',
    'Buenas tardes, {n}. ¿Cómo va todo?',
  ],
  noche: [
    'Buenas noches, {n}',
    'Hora de bajar el ritmo, {n}',
    'Buenas noches, {n}. Repasa cómo ha ido el día',
    'Buen trabajo hoy, {n}',
    'Buenas noches, {n}. Mañana más y mejor',
    'Desconecta, {n}. Te lo has ganado',
  ],
};

// Frases especiales según el día de la semana (0 = domingo … 6 = sábado)
const SPECIAL = [
  { day: 1, bands: ['temprano', 'manana'], text: 'Feliz lunes, {n}. Semana nueva, página en blanco' },
  { day: 1, bands: ['temprano', 'manana'], text: 'Buenos días, {n}. A estrenar semana' },
  { day: 3, bands: ['mediodia', 'tarde'], text: 'Mitad de semana, {n}. Vas bien' },
  { day: 5, bands: ['mediodia', 'tarde'], text: '¡Por fin viernes, {n}!' },
  { day: 5, bands: ['noche'], text: 'Feliz viernes noche, {n}' },
  { day: 6, bands: ['temprano', 'manana', 'mediodia'], text: 'Feliz sábado, {n}' },
  { day: 6, bands: ['tarde', 'noche'], text: 'Buen fin de semana, {n}' },
  { day: 0, bands: ['temprano', 'manana', 'mediodia'], text: 'Feliz domingo, {n}' },
  { day: 0, bands: ['tarde', 'noche'], text: 'Domingo tranquilo, {n}. Buen momento para la revisión semanal' },
];

// Semilla por sesión: cada vez que abres la app el saludo puede cambiar,
// pero se mantiene estable mientras la usas (no salta cada minuto).
const SESSION_SEED = Math.floor(Math.random() * 1e9);

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dayBand(date = new Date()) {
  const h = date.getHours();
  return BANDS.find((b) => h >= b.from && h < b.to).id;
}

/** Icono sugerido para la franja (nombre de lucide-react) */
export function bandIcon(band) {
  return { madrugada: 'moon-star', temprano: 'sunrise', manana: 'sun', mediodia: 'sun', tarde: 'sunset', noche: 'moon' }[band];
}

function fill(text, name) {
  return name ? text.replace('{n}', name) : text.replace(/,?\s*\{n\}/, '').replace(/^\s*\.\s*/, '');
}

/**
 * Devuelve un saludo variado.
 * @param {{ name?: string, date?: Date, progress?: { done: number, total: number } }} opts
 */
export function personalGreeting({ name = '', date = new Date(), progress } = {}) {
  const band = dayBand(date);
  const dow = date.getDay();
  const n = name.trim();

  // Contexto: si ya has terminado todo lo de hoy (a partir del mediodía)
  if (progress && progress.total > 0 && progress.done === progress.total && ['mediodia', 'tarde', 'noche'].includes(band)) {
    const done = ['Todo hecho por hoy, {n}. ¡Bravo!', 'Día completado, {n}', 'Lo has clavado hoy, {n}'];
    return fill(done[hash(`${SESSION_SEED}${n}`) % done.length], n);
  }

  const options = [...POOL[band], ...SPECIAL.filter((s) => s.day === dow && s.bands.includes(band)).map((s) => s.text)];
  // Hora de comer en España
  if (date.getHours() === 14) options.push('Buen provecho, {n}', 'Que aproveche, {n}');
  // Las frases especiales del día pesan doble para que se vean a menudo
  SPECIAL.filter((s) => s.day === dow && s.bands.includes(band)).forEach((s) => options.push(s.text));
  const key = `${SESSION_SEED}|${date.toDateString()}|${band}|${n}`;
  return fill(options[hash(key) % options.length], n);
}

/** Saludo corto y clásico (Buenos días / Buenas tardes / Buenas noches) */
export { greeting as shortGreeting } from './dates';
