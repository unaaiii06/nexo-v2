import { useCallback, useEffect, useState } from 'react';
import { Send, Loader2, Unlink, CheckCircle2 } from 'lucide-react';
import { isCloud, supabase, TELEGRAM_BOT } from '../lib/supabase';
import { useAuth } from '../store/auth';
import { useUI } from '../store/ui';
import { cx } from '../lib/utils';

const DIGEST_TIMES = ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'];

/** Conexión con el bot de Telegram + resumen diario */
export default function TelegramCard() {
  const { user } = useAuth();
  const { showToast } = useUI();
  const [link, setLink] = useState(undefined); // undefined = cargando, null = sin vincular
  const [profile, setProfile] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isCloud) return;
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from('telegram_links').select('username, linked_at').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('digest_enabled, digest_time').eq('user_id', user.id).maybeSingle(),
    ]);
    setLink(l ?? null);
    setProfile(p ?? { digest_enabled: true, digest_time: '08:00:00' });
    return l;
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Mientras esperamos a que pulses «Iniciar» en Telegram, comprobamos cada 3 s
  useEffect(() => {
    if (!waiting) return;
    let tries = 0;
    const t = setInterval(async () => {
      tries++;
      const l = await load();
      if (l) {
        setWaiting(false);
        showToast('Telegram conectado ✅');
      } else if (tries > 60) setWaiting(false);
    }, 3000);
    return () => clearInterval(t);
  }, [waiting, load, showToast]);

  if (!isCloud) {
    return <p className="rounded-2xl p-4 text-[13px] muted card">Disponible cuando la app está conectada a Supabase (ver README).</p>;
  }
  if (!TELEGRAM_BOT) {
    return <p className="rounded-2xl p-4 text-[13px] muted card">Falta configurar el bot de Telegram (VITE_TELEGRAM_BOT). Ver README.</p>;
  }

  async function connect() {
    setBusy(true);
    // Abrimos la ventana antes del await para que Safari no la bloquee
    const win = window.open('', '_blank');
    const { data: code, error } = await supabase.rpc('create_telegram_code');
    setBusy(false);
    if (error || !code) {
      win?.close();
      showToast('No se pudo generar el enlace. ¿Tienes conexión?');
      return;
    }
    const url = `https://t.me/${TELEGRAM_BOT}?start=${code}`;
    if (win) win.location.href = url;
    else window.location.href = url;
    setWaiting(true);
  }

  async function disconnect() {
    await supabase.from('telegram_links').delete().eq('user_id', user.id);
    setLink(null);
    showToast('Telegram desconectado');
  }

  async function saveDigest(patch) {
    const next = { ...profile, ...patch };
    setProfile(next);
    const { error } = await supabase.from('profiles').upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' });
    if (error) showToast('No se pudo guardar');
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4 card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: 'linear-gradient(145deg,#37AEE2,#1E96C8)' }}>
            <Send size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Bot de Telegram</p>
            <p className="truncate text-[13px] muted">
              {link === undefined
                ? 'Comprobando…'
                : link
                  ? `Conectado${link.username ? ` como @${link.username}` : ''}`
                  : waiting
                    ? 'Pulsa «Iniciar» en Telegram y vuelve aquí'
                    : `Recibe tus recordatorios en @${TELEGRAM_BOT}`}
            </p>
          </div>
          {link && <CheckCircle2 size={20} className="shrink-0 text-ok" />}
        </div>
        {link ? (
          <button type="button" onClick={disconnect} className="btn btn-ghost mt-3 w-full text-danger">
            <Unlink size={16} /> Desconectar
          </button>
        ) : (
          <button type="button" onClick={connect} disabled={busy} className="btn btn-primary mt-3 w-full">
            {busy || waiting ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />}
            {waiting ? 'Esperando a Telegram…' : 'Conectar Telegram'}
          </button>
        )}
      </div>

      {link && profile && (
        <div className="rounded-2xl p-4 card">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-[15px] font-medium">Resumen diario</span>
              <span className="block text-[13px] muted">Tus prioridades, agenda y tareas de hoy</span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[rgb(var(--accent))]"
              checked={profile.digest_enabled}
              onChange={(e) => saveDigest({ digest_enabled: e.target.checked })}
            />
          </label>
          {profile.digest_enabled && (
            <div className="mt-3 flex flex-wrap gap-2">
              {DIGEST_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => saveDigest({ digest_time: t })}
                  className={cx('chip tabular-nums', profile.digest_time?.startsWith(t) && 'chip-active')}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
