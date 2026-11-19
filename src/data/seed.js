// Datos de ejemplo. Todas las fechas se calculan en relación con el día actual
// para que la app se vea viva y coherente el día que se abra.
import { addDays, monthKeyOf, startOfWeek, todayKey, monthDays, daysInMonth } from '../lib/dates';

export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS = { theme: 'obsidian', sidebarCollapsed: false };

export const DEFAULT_AREAS = [
  { id: 'area_trabajo', name: 'Trabajo y Negocios', icon: 'briefcase', color: '#0A84FF' },
  { id: 'area_estudios', name: 'Estudios', icon: 'graduation', color: '#BF5AF2' },
  { id: 'area_salud', name: 'Salud y Fitness', icon: 'heart', color: '#30D158' },
  { id: 'area_finanzas', name: 'Finanzas', icon: 'wallet', color: '#F5B800' },
  { id: 'area_personal', name: 'Personal', icon: 'sparkles', color: '#FF9F0A' },
];

/** Generador pseudoaleatorio determinista (mulberry32) para historiales creíbles */
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function habitLog(today, seed, rate, streak, doneToday) {
  const rand = rng(seed);
  const log = {};
  // Historial de los últimos 45 días (cubre el mes actual completo y el anterior parcialmente)
  for (let i = 45; i >= 1; i--) {
    const k = addDays(today, -i);
    if (i <= streak || rand() < rate) log[k] = true;
  }
  // Garantiza que la racha termina justo donde debe
  if (streak < 45) delete log[addDays(today, -(streak + 1))];
  if (doneToday) log[today] = true;
  return log;
}

let counter = 0;
const id = (p) => `${p}_seed${(++counter).toString(36)}`;

/** Datos iniciales para una persona real: áreas y hábitos básicos, sin tareas de ejemplo */
export function createEmpty() {
  return {
    version: SCHEMA_VERSION,
    tasks: [],
    events: [],
    milestones: [],
    goals: [],
    habits: [
      { id: 'habit_train', name: 'Entrenar', icon: 'dumbbell', color: '#30D158', log: {} },
      { id: 'habit_water', name: 'Hidratación', icon: 'droplets', color: '#64D2FF', log: {} },
      { id: 'habit_read', name: 'Lectura', icon: 'book', color: '#FF9F0A', log: {} },
      { id: 'habit_deep', name: 'Deep Work', icon: 'brain', color: '#BF5AF2', log: {} },
    ],
    areas: DEFAULT_AREAS.map((a) => ({ ...a })),
    weekFocus: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function createSeed() {
  counter = 0;
  const today = todayKey();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const monday = startOfWeek(today);
  const nextMonday = addDays(monday, 7);
  const month = monthKeyOf(today);
  const endOfMonth = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
  // Día de esta semana posterior a hoy si existe; si hoy es domingo, el siguiente lunes.
  const laterThisWeek = (n) => {
    const d = addDays(today, n);
    return startOfWeek(d) === monday ? d : addDays(nextMonday, Math.min(n - 1, 4));
  };
  const goalDeadline = monthDays(month).indexOf(today) > daysInMonth(month) - 6 ? addDays(today, 10) : endOfMonth;
  const now = Date.now();

  const goals = [
    { id: 'goal_beta', title: 'Lanzar la beta de Atlas', areaId: 'area_trabajo', deadline: goalDeadline, month },
    { id: 'goal_10k', title: 'Correr 10 km en menos de 55 min', areaId: 'area_salud', deadline: addDays(today, 12), month },
    { id: 'goal_fondo', title: 'Ahorrar 1.200 € para el fondo de emergencia', areaId: 'area_finanzas', deadline: goalDeadline, month },
  ];

  const t = (title, o = {}) => ({
    id: id('task'),
    title,
    notes: '',
    date: null,
    weekOf: null,
    priority: null,
    mit: false,
    done: false,
    doneAt: null,
    areaId: null,
    goalId: null,
    start: null,
    end: null,
    estimate: 30,
    createdAt: now - (counter * 3600_000),
    ...o,
    ...(o.done ? { doneAt: now - 1800_000 } : {}),
  });

  const tasks = [
    // Hoy — 3 prioridades del día (MITs)
    t('Cerrar el roadmap de la beta con el equipo', { date: today, mit: true, priority: 'high', areaId: 'area_trabajo', goalId: 'goal_beta', start: '09:30', end: '11:00', estimate: 90 }),
    t('Intervalos 6 × 800 m', { date: today, mit: true, priority: 'high', areaId: 'area_salud', goalId: 'goal_10k', start: '19:00', end: '20:00', estimate: 60 }),
    t('Revisar el presupuesto del mes', { date: today, mit: true, priority: 'medium', areaId: 'area_finanzas', goalId: 'goal_fondo', estimate: 30, done: true }),
    // Hoy — secundarias
    t('Responder correos pendientes', { date: today, priority: 'low', areaId: 'area_trabajo', estimate: 20, done: true }),
    t('Comprar el regalo de Lucía', { date: today, priority: 'low', areaId: 'area_personal', estimate: 30 }),
    t('Recoger el paquete en Correos', { date: today, priority: 'low', areaId: 'area_personal', estimate: 15 }),
    // Ayer
    t('Configurar la analítica de la beta', { date: yesterday, priority: 'medium', areaId: 'area_trabajo', goalId: 'goal_beta', estimate: 60, done: true }),
    t('Tirada larga de 12 km', { date: yesterday, priority: 'medium', areaId: 'area_salud', goalId: 'goal_10k', estimate: 75, done: true }),
    // Resto de la semana
    t('Diseñar el onboarding de la beta', { date: tomorrow, priority: 'high', areaId: 'area_trabajo', goalId: 'goal_beta', estimate: 120 }),
    t('Estudiar el tema 4 de Estadística', { date: tomorrow, priority: 'medium', areaId: 'area_estudios', estimate: 60 }),
    t('Preparar la demo interna de Atlas', { date: laterThisWeek(2), priority: 'high', areaId: 'area_trabajo', goalId: 'goal_beta', estimate: 150 }),
    t('Programar la transferencia al fondo', { date: laterThisWeek(3), priority: 'low', areaId: 'area_finanzas', goalId: 'goal_fondo', estimate: 15 }),
    // Backlog semanal (esta semana, sin día)
    t('Esquema de la presentación del TFM', { weekOf: monday, priority: 'medium', areaId: 'area_estudios', estimate: 90 }),
    t('Pedir cita en el fisio', { weekOf: monday, priority: 'low', areaId: 'area_salud', estimate: 15 }),
    t('Vender 3 cosas en Wallapop', { weekOf: monday, areaId: 'area_finanzas', goalId: 'goal_fondo', estimate: 45 }),
    // Bandeja de entrada
    t('Idea: newsletter mensual para clientes', { areaId: 'area_trabajo' }),
    t('Llamar al banco por la hipoteca', {}),
    t('Renovar el pasaporte antes del verano', {}),
    t('Probar la ruta en bici del embalse', {}),
  ];

  const events = [
    { id: id('event'), title: 'Stand-up del equipo', date: today, start: '08:30', end: '08:50', areaId: 'area_trabajo' },
    { id: id('event'), title: 'Comida con Marta', date: today, start: '14:00', end: '15:00', areaId: 'area_personal' },
    { id: id('event'), title: 'Deep Work · arquitectura', date: today, start: '16:00', end: '18:00', areaId: 'area_trabajo' },
  ];

  const milestones = [
    { id: id('ms'), title: 'Revisión médica anual', date: addDays(today, -4), type: 'evento', areaId: 'area_salud' },
    { id: id('ms'), title: 'Demo interna de Atlas', date: laterThisWeek(2), type: 'evento', areaId: 'area_trabajo' },
    { id: id('ms'), title: 'Cumpleaños de Lucía', date: addDays(today, 3), type: 'evento', areaId: 'area_personal' },
    { id: id('ms'), title: 'Pago del IVA trimestral', date: addDays(today, 5), type: 'limite', areaId: 'area_finanzas' },
    { id: id('ms'), title: 'Borrador del TFM', date: addDays(today, 9), type: 'entrega', areaId: 'area_estudios' },
    { id: id('ms'), title: 'Carrera popular 10K', date: addDays(today, 12), type: 'evento', areaId: 'area_salud' },
    { id: id('ms'), title: 'Lanzamiento beta de Atlas', date: goalDeadline, type: 'hito', areaId: 'area_trabajo' },
  ];

  const habits = [
    { id: 'habit_train', name: 'Entrenar', icon: 'dumbbell', color: '#30D158', log: habitLog(today, 11, 0.62, 3, false) },
    { id: 'habit_water', name: 'Hidratación', icon: 'droplets', color: '#64D2FF', log: habitLog(today, 23, 0.85, 12, true) },
    { id: 'habit_read', name: 'Lectura', icon: 'book', color: '#FF9F0A', log: habitLog(today, 37, 0.7, 6, false) },
    { id: 'habit_deep', name: 'Deep Work', icon: 'brain', color: '#BF5AF2', log: habitLog(today, 51, 0.55, 2, false) },
  ];

  return {
    version: SCHEMA_VERSION,
    tasks,
    events,
    milestones,
    goals,
    habits,
    areas: DEFAULT_AREAS.map((a) => ({ ...a })),
    weekFocus: { [monday]: 'Dejar la beta lista para la demo y mantener 4 entrenos.' },
    settings: { ...DEFAULT_SETTINGS },
  };
}
