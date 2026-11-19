import { useCallback, useEffect, useRef, useState } from 'react';
import { isCloud, supabase } from '../lib/supabase';
import { outboxRows } from './tracking';

const PAGE = 1000;
const OVERLAP = 200; // vuelve a leer las últimas revisiones por si alguna llegó desordenada

/**
 * Motor de sincronización offline-first.
 *  · Los cambios se guardan al instante en el dispositivo (localStorage).
 *  · Se suben al servidor en segundo plano (y se reintentan si no hay conexión).
 *  · Los cambios de otros dispositivos (o de Telegram) llegan en tiempo real.
 *  · Conflictos: gana el cambio más reciente de cada elemento.
 */
export function useSync({ userId, state, dispatch }) {
  const [status, setStatus] = useState(isCloud ? { phase: 'starting' } : { phase: 'local' });
  const stateRef = useRef(state);
  stateRef.current = state;
  const busy = useRef(false);
  const again = useRef(false);

  const pull = useCallback(async () => {
    let cursor = Math.max(0, (stateRef.current._sync.cursor || 0) - OVERLAP);
    const serverKeys = new Set();
    const firstTime = !stateRef.current._sync.initialized;
    for (;;) {
      const { data, error } = await supabase
        .from('items')
        .select('collection, id, data, deleted, updated_at, rev')
        .gt('rev', cursor)
        .order('rev', { ascending: true })
        .limit(PAGE);
      if (error) throw error;
      if (data.length) {
        dispatch({ type: 'remoteMerge', rows: data });
        data.forEach((r) => !r.deleted && serverKeys.add(`${r.collection}:${r.id}`));
        cursor = data[data.length - 1].rev;
      }
      if (data.length < PAGE) break;
    }
    if (firstTime) dispatch({ type: 'syncInit', serverKeys });
  }, [dispatch]);

  const push = useCallback(async () => {
    const done = {};
    for (let i = 0; i < 50; i++) {
      const { rows, sent } = outboxRows(stateRef.current, 400, done);
      if (!rows.length) return;
      const { error } = await supabase.rpc('sync_push', { rows });
      if (error) throw error;
      Object.assign(done, sent);
      dispatch({ type: 'syncAck', sent });
    }
  }, [dispatch]);

  const run = useCallback(
    async (withPull = true) => {
      if (!isCloud || !userId) return;
      if (busy.current) {
        again.current = true;
        return;
      }
      if (!navigator.onLine) {
        setStatus({ phase: 'offline' });
        return;
      }
      busy.current = true;
      setStatus((s) => ({ ...s, phase: 'syncing' }));
      try {
        if (withPull || !stateRef.current._sync.initialized) await pull();
        // espera a que se procese syncInit antes de subir
        await new Promise((r) => setTimeout(r, 0));
        await push();
        setStatus({ phase: 'synced', at: Date.now() });
      } catch (err) {
        console.warn('[Nexo] Sincronización:', err);
        setStatus({ phase: navigator.onLine ? 'error' : 'offline', message: err?.message });
      } finally {
        busy.current = false;
        if (again.current) {
          again.current = false;
          setTimeout(() => run(true), 50);
        }
      }
    },
    [userId, pull, push],
  );

  // Arranque + reintentos al volver a la app, al recuperar conexión y cada 60 s
  useEffect(() => {
    if (!isCloud || !userId) return;
    run(true);
    const onWake = () => document.visibilityState === 'visible' && run(true);
    const onOnline = () => run(true);
    const onOffline = () => setStatus({ phase: 'offline' });
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const timer = setInterval(() => document.visibilityState === 'visible' && run(true), 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(timer);
    };
  }, [userId, run]);

  // Subida rápida tras cada cambio local (con un pequeño margen para agrupar)
  const pending = Object.keys(state._sync.outbox).length;
  useEffect(() => {
    if (!isCloud || !pending || !state._sync.initialized) return;
    const t = setTimeout(() => run(false), 700);
    return () => clearTimeout(t);
  }, [state._sync.outbox, state._sync.initialized, pending, run]);

  // Tiempo real: cambios de otros dispositivos o de Telegram
  useEffect(() => {
    if (!isCloud || !userId) return;
    const channel = supabase
      .channel(`items-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.new && payload.new.id) dispatch({ type: 'remoteMerge', rows: [payload.new] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, dispatch]);

  return { ...status, pending, syncNow: () => run(true) };
}
