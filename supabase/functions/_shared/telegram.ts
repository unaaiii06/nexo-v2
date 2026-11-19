// Utilidades compartidas por las funciones de Nexo (Deno · Supabase Edge Functions)
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
export const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';
export const APP_URL = Deno.env.get('NEXO_APP_URL') ?? '';

/** Cliente con permisos de servidor (las variables las pone Supabase automáticamente) */
export function admin() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

// deno-lint-ignore no-explicit-any
export async function tg(method: string, payload: Record<string, any>) {
  if (!BOT_TOKEN) throw new Error('Falta TELEGRAM_BOT_TOKEN');
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.ok) console.error(`[telegram] ${method}`, json.description);
  return json;
}

/** Escapa texto para parse_mode HTML */
export const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const PRIORITY: Record<string, string> = { high: '🔴', medium: '🟠', low: '🔵' };

/** Hora local "HH:MM" en la zona del usuario */
export function localTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(d);
}

/** Fecha local "YYYY-MM-DD" en la zona del usuario */
export function localDateKey(d: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(d);
  return parts; // en-CA → YYYY-MM-DD
}

export function reminderKeyboard(itemId: string, collection: string) {
  const row = [];
  if (collection === 'tasks') row.push({ text: '✅ Hecho', callback_data: `done:${itemId}` });
  row.push({ text: '⏰ 15 min', callback_data: `snooze:${itemId}:15` });
  row.push({ text: '⏰ 1 h', callback_data: `snooze:${itemId}:60` });
  const rows = [row];
  if (collection === 'tasks') rows.push([{ text: '📅 Mañana', callback_data: `tomorrow:${itemId}` }]);
  return { inline_keyboard: rows };
}

// deno-lint-ignore no-explicit-any
export function describeItem(collection: string, data: any, tz: string, remindAt?: string) {
  const icon = collection === 'events' ? '🗓' : PRIORITY[data?.priority] ?? '🔔';
  const lines = [`${icon} <b>${esc(data?.title)}</b>`];
  if (data?.start) lines.push(`🕒 ${esc(data.start)}${data.end ? `–${esc(data.end)}` : ''}`);
  if (data?.notes) lines.push(`<i>${esc(String(data.notes).slice(0, 300))}</i>`);
  const at = remindAt ?? data?.remindAt;
  if (!data?.start && at) lines.push(`🕒 ${localTime(new Date(at), tz)}`);
  return lines.join('\n');
}

/** Lista de avisos (acepta el formato antiguo de un solo aviso) */
// deno-lint-ignore no-explicit-any
export function remindsOf(data: any) {
  if (Array.isArray(data?.reminds)) return [...data.reminds];
  return data?.remind ? [data.remind] : [];
}

// deno-lint-ignore no-explicit-any
export function remindAtsOf(data: any): string[] {
  const list = Array.isArray(data?.remindAts) ? [...data.remindAts] : [];
  if (data?.remindAt) list.push(data.remindAt);
  return [...new Set(list)].sort();
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
