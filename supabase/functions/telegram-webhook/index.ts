// Recibe los mensajes y botones del bot de Telegram.
//  /start <código>  → vincula el chat con tu cuenta de Nexo
//  /hoy             → lista las tareas de hoy
//  /desconectar     → deja de recibir recordatorios
//  Botones          → ✅ Hecho · ⏰ Posponer · 📅 Mañana (se sincroniza al instante con la app)
import { admin, APP_URL, esc, json, localDateKey, PRIORITY, remindAtsOf, remindsOf, tg, WEBHOOK_SECRET } from '../_shared/telegram.ts';

const HELP = [
  '<b>Nexo</b> te avisará de tus tareas aquí.',
  '',
  '/hoy · tareas de hoy',
  '/desconectar · dejar de recibir avisos',
].join('\n');

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.serve(async (req) => {
  // Solo Telegram conoce este secreto (se configura con setWebhook)
  if (!WEBHOOK_SECRET || req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  const update: Any = await req.json().catch(() => ({}));
  const db = admin();

  try {
    if (update.callback_query) await onCallback(db, update.callback_query);
    else if (update.message?.text) await onMessage(db, update.message);
  } catch (err) {
    console.error('[webhook]', err);
  }
  // Responder siempre 200 para que Telegram no reintente
  return json({ ok: true });
});

async function userByChat(db: Any, chatId: number) {
  const { data } = await db.from('telegram_links').select('user_id').eq('chat_id', chatId).maybeSingle();
  return data?.user_id as string | undefined;
}

async function tzOf(db: Any, userId: string) {
  const { data } = await db.from('profiles').select('tz, name').eq('user_id', userId).maybeSingle();
  return { tz: (data?.tz as string) || 'Europe/Madrid', name: data?.name as string | undefined };
}

async function onMessage(db: Any, msg: Any) {
  const chatId = msg.chat.id as number;
  const text = String(msg.text).trim();
  const [cmd, arg] = text.split(/\s+/, 2);

  if (cmd === '/start') {
    if (!arg) {
      const linked = await userByChat(db, chatId);
      await tg('sendMessage', {
        chat_id: chatId,
        parse_mode: 'HTML',
        text: linked
          ? `Ya estás conectado ✅\n\n${HELP}`
          : `Hola 👋\n\nPara conectar este chat abre <b>Nexo → Ajustes → Telegram → Conectar</b>.${APP_URL ? `\n\n${esc(APP_URL)}` : ''}`,
      });
      return;
    }
    const { data: code } = await db.from('telegram_codes').select('user_id, expires_at').eq('code', arg).maybeSingle();
    if (!code || new Date(code.expires_at) < new Date()) {
      await tg('sendMessage', { chat_id: chatId, text: 'Ese enlace ha caducado. Vuelve a tocar «Conectar Telegram» en Nexo.' });
      return;
    }
    // Un chat solo puede pertenecer a una cuenta
    await db.from('telegram_links').delete().eq('chat_id', chatId);
    await db.from('telegram_links').upsert({ user_id: code.user_id, chat_id: chatId, username: msg.from?.username ?? null, linked_at: new Date().toISOString() });
    await db.from('telegram_codes').delete().eq('code', arg);
    const { name } = await tzOf(db, code.user_id);
    await tg('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text: `¡Conectado${name ? `, ${esc(name)}` : ''}! ✅\n\nTe avisaré aquí de las tareas con recordatorio y cada mañana te enviaré el resumen del día.\n\n${HELP}`,
    });
    return;
  }

  const userId = await userByChat(db, chatId);
  if (!userId) {
    await tg('sendMessage', { chat_id: chatId, parse_mode: 'HTML', text: 'Este chat no está conectado. Abre <b>Nexo → Ajustes → Telegram → Conectar</b>.' });
    return;
  }

  if (cmd === '/hoy') {
    const { tz } = await tzOf(db, userId);
    const today = localDateKey(new Date(), tz);
    const { data: items } = await db.from('items').select('data').eq('user_id', userId).eq('collection', 'tasks').eq('deleted', false);
    const list = (items ?? []).map((i: Any) => i.data).filter((t: Any) => t?.date === today);
    if (!list.length) {
      await tg('sendMessage', { chat_id: chatId, text: 'Hoy no tienes tareas. 🌿' });
      return;
    }
    list.sort((a: Any, b: Any) => Number(a.done) - Number(b.done) || Number(b.mit) - Number(a.mit));
    const lines = list.map((t: Any) => `${t.done ? '✅' : t.mit ? '⭐️' : PRIORITY[t.priority] ?? '▫️'} ${t.done ? `<s>${esc(t.title)}</s>` : esc(t.title)}`);
    const done = list.filter((t: Any) => t.done).length;
    await tg('sendMessage', { chat_id: chatId, parse_mode: 'HTML', text: `<b>Hoy</b> · ${done}/${list.length} hechas\n\n${lines.join('\n')}` });
    return;
  }

  if (cmd === '/desconectar' || cmd === '/stop') {
    await db.from('telegram_links').delete().eq('chat_id', chatId);
    await tg('sendMessage', { chat_id: chatId, text: 'Desconectado. Ya no recibirás avisos. Puedes volver a conectarlo desde Nexo cuando quieras.' });
    return;
  }

  await tg('sendMessage', { chat_id: chatId, parse_mode: 'HTML', text: HELP });
}

async function onCallback(db: Any, cb: Any) {
  const chatId = cb.message?.chat?.id as number;
  const [action, itemId, extra] = String(cb.data ?? '').split(':');
  const userId = await userByChat(db, chatId);
  if (!userId || !itemId) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Chat no conectado' });
    return;
  }

  const { data: row } = await db
    .from('items')
    .select('collection, data')
    .eq('user_id', userId)
    .eq('id', itemId)
    .in('collection', ['tasks', 'events', 'milestones'])
    .eq('deleted', false)
    .maybeSingle();
  if (!row) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Ya no existe en Nexo' });
    return;
  }

  const data = { ...row.data };
  let toast = '';
  let footer = '';
  const { tz } = await tzOf(db, userId);

  if (action === 'done') {
    data.done = true;
    data.doneAt = Date.now();
    toast = '¡Hecho! ✅';
    footer = '✅ <b>Completada</b>';
  } else if (action === 'snooze') {
    const minutes = Math.max(5, Math.min(24 * 60, Number(extra) || 15));
    const at = new Date(Date.now() + minutes * 60_000);
    // Se añade un aviso extra; los demás avisos de la tarea se mantienen
    const iso = at.toISOString();
    data.reminds = [...remindsOf(data), { mode: 'custom', at: iso }];
    data.remindAts = [...remindAtsOf(data), iso].sort();
    data.remind = null;
    data.remindAt = null;
    const hhmm = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(at);
    toast = `Te aviso a las ${hhmm}`;
    footer = `⏰ Pospuesto a las ${hhmm}`;
  } else if (action === 'tomorrow') {
    const tomorrow = localDateKey(new Date(Date.now() + 24 * 3600_000), tz);
    data.date = tomorrow;
    data.weekOf = null;
    data.mit = false;
    // Todos los avisos se mueven también un día
    const shift = (iso: string) => new Date(new Date(iso).getTime() + 24 * 3600_000).toISOString();
    data.reminds = remindsOf(data).map((r: Any) => (r.mode === 'custom' && r.at ? { ...r, at: shift(r.at) } : r));
    data.remindAts = remindAtsOf(data).map(shift);
    data.remind = null;
    data.remindAt = null;
    toast = 'Movida a mañana 📅';
    footer = '📅 Movida a mañana';
  } else {
    await tg('answerCallbackQuery', { callback_query_id: cb.id });
    return;
  }

  // Al actualizar la fila, la app recibe el cambio en tiempo real en todos los dispositivos
  await db
    .from('items')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('collection', row.collection)
    .eq('id', itemId);

  await tg('answerCallbackQuery', { callback_query_id: cb.id, text: toast });
  await tg('editMessageText', {
    chat_id: chatId,
    message_id: cb.message.message_id,
    parse_mode: 'HTML',
    text: `${cb.message.text ? esc(cb.message.text) : ''}\n\n${footer}`,
  });
}
