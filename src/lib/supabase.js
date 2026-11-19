import { createClient } from '@supabase/supabase-js';

// Valores públicos del proyecto (van en el build). Se definen en .env.local
// o, en GitHub, como variables del repositorio (ver README).
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const TELEGRAM_BOT = import.meta.env.VITE_TELEGRAM_BOT || '';

/** Sin configuración, la app funciona en «modo local» (sin cuenta ni sincronización) */
export const isCloud = Boolean(url && key);

export const supabase = isCloud
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'nexo2:auth' },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;
