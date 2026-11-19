// Se ejecuta cada minuto (pg_cron). Envía por Telegram:
//  · los recordatorios de tareas y bloques cuya hora ha llegado
//  · el resumen diario a la hora elegida por cada persona
// Es idempotente: el servidor «reclama» cada envío una sola vez, así que
// llamarla varias veces no duplica mensajes.
import { admin, describeItem, esc, json, localDateKey, PRIORITY, reminderKeyboard, tg } from '../_shared/telegram.ts';

Deno.serve(async () => {
  const db = admin();
  let reminders = 0;
  let digests = 0;

  // Zonas horarias de cada usuario (para mostrar horas locales)
  const { data: profiles } = await db.from('profiles').select('user_id, tz, name');
  const tzOf = new Map((profiles ?? []).map((p) => [p.user_id, p.tz || 'Europe/Madrid']));

  // 1) Recordatorios
  const { data: due, error } = await db.rpc('claim_due_reminders');
  if (error) console.error('[reminders]', error.message);
  for (const r of due ?? []) {
    const tz = tzOf.get(r.user_id) ?? 'Europe/Madrid';
    await tg('sendMessage', {
      chat_id: r.chat_id,
      text: `🔔 <b>Recordatorio</b>\n\n${describeItem(r.collection, r.data, tz, r.remind_at)}`,
      parse_mode: 'HTML',
      reply_markup: reminderKeyboard(r.item_id, r.collection),
    });
    reminders++;
  }

  // 2) Resumen diario
  const { data: dg, error: dgErr } = await db.rpc('claim_due_digests');
  if (dgErr) console.error('[digest]', dgErr.message);
  for (const d of dg ?? []) {
    const tz = tzOf.get(d.user_id) ?? 'Europe/Madrid';
    const today = localDateKey(new Date(), tz);
    const { data: items } = await db
      .from('items')
      .select('collection, id, data')
      .eq('user_id', d.user_id)
      .eq('deleted', false)
      .in('collection', ['tasks', 'events', 'habits']);

    const tasks = (items ?? []).filter((i) => i.collection === 'tasks' && i.data?.date === today);
    const pending = tasks.filter((t) => !t.data?.done);
    const mits = pending.filter((t) => t.data?.mit);
    const others = pending.filter((t) => !t.data?.mit);
    const events = (items ?? [])
      .filter((i) => i.collection === 'events' && i.data?.date === today)
      .sort((a, b) => String(a.data?.start).localeCompare(String(b.data?.start)));
    const habits = (items ?? []).filter((i) => i.collection === 'habits');

    const lines: string[] = [`☀️ <b>Buenos días${d.name ? `, ${esc(d.name)}` : ''}</b>`, ''];
    if (!pending.length && !events.length) {
      lines.push('Hoy no tienes nada planificado. ¡Día libre para lo que quieras!');
    } else {
      if (mits.length) {
        lines.push('⭐️ <b>Tus prioridades</b>');
        mits.forEach((t, i) => lines.push(`${i + 1}. ${esc(t.data.title)}${t.data.start ? ` · ${esc(t.data.start)}` : ''}`));
        lines.push('');
      }
      if (events.length) {
        lines.push('🗓 <b>Agenda</b>');
        events.forEach((e) => lines.push(`${esc(e.data.start)}–${esc(e.data.end)} · ${esc(e.data.title)}`));
        lines.push('');
      }
      if (others.length) {
        lines.push('📋 <b>Tareas</b>');
        others.slice(0, 12).forEach((t) => lines.push(`${PRIORITY[t.data?.priority] ?? '▫️'} ${esc(t.data.title)}`));
        if (others.length > 12) lines.push(`… y ${others.length - 12} más`);
        lines.push('');
      }
    }
    if (habits.length) lines.push(`🔁 Hábitos de hoy: ${habits.map((h) => esc(h.data?.name)).join(' · ')}`);

    await tg('sendMessage', { chat_id: d.chat_id, text: lines.join('\n').trim(), parse_mode: 'HTML' });
    digests++;
  }

  return json({ ok: true, reminders, digests });
});
