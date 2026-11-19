// Funciones que cada persona puede activar o desactivar desde Ajustes → Funciones.
import { useStore } from '../store/AppStore';

export const FEATURE_GROUPS = [
  {
    title: 'Apartados',
    hint: '«Hoy» siempre está visible.',
    items: [
      { key: 'inbox', label: 'Bandeja de entrada', text: 'Captura rápida de ideas y tareas' },
      { key: 'week', label: 'Semana', text: 'Kanban de lunes a domingo' },
      { key: 'month', label: 'Mes', text: 'Calendario, objetivos y constancia' },
      { key: 'areas', label: 'Proyectos y áreas', text: 'Tus contextos de vida' },
    ],
  },
  {
    title: 'Organización',
    items: [
      { key: 'habits', label: 'Hábitos', text: 'Rastreador diario, rachas y matriz mensual' },
      { key: 'goals', label: 'Objetivos del mes', text: 'OKRs con progreso automático' },
      { key: 'milestones', label: 'Hitos y fechas clave', text: 'Entregas, eventos y fechas límite' },
      { key: 'agenda', label: 'Agenda y bloques de tiempo', text: 'Línea de tiempo de 08:00 a 22:00' },
      { key: 'mits', label: 'Las 3 prioridades del día', text: 'Anillo de MITs en «Hoy»' },
      { key: 'priorities', label: 'Prioridad de tareas', text: 'Alta, media y baja' },
      { key: 'estimates', label: 'Duración estimada', text: 'Tiempo de cada tarea y carga del día' },
    ],
  },
  {
    title: 'Hoy',
    items: [
      { key: 'secondary', label: 'Tareas secundarias', text: 'Recados y tareas menores' },
      { key: 'overdue', label: 'Pendientes de días anteriores', text: 'Aviso de tareas atrasadas' },
    ],
  },
  {
    title: 'Semana',
    items: [
      { key: 'weekFocus', label: 'Enfoque de la semana', text: 'Una frase que guía tu semana' },
      { key: 'workload', label: 'Barra de carga del día', text: 'Avisa si un día está saturado' },
      { key: 'weeklyReview', label: 'Revisión semanal', text: 'Asistente de 3 pasos' },
    ],
  },
  {
    title: 'General',
    items: [
      { key: 'greetings', label: 'Saludos variados', text: 'Frases según la hora y el día (si no, saludo clásico)' },
      { key: 'progress', label: 'Progreso del día', text: 'Anillo y barra de progreso' },
      { key: 'reminders', label: 'Recordatorios por Telegram', text: 'Avisos y resumen diario' },
      { key: 'animations', label: 'Celebraciones', text: 'Animación al completar tareas y hábitos' },
    ],
  },
];

export const DEFAULT_FEATURES = Object.fromEntries(FEATURE_GROUPS.flatMap((g) => g.items.map((i) => [i.key, true])));

export function resolveFeatures(settings) {
  return { ...DEFAULT_FEATURES, ...(settings?.features || {}) };
}

/** Funciones activas de la persona */
export function useFeatures() {
  const { state } = useStore();
  return resolveFeatures(state.settings);
}
