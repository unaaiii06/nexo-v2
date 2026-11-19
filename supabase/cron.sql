-- =====================================================================
-- Nexo v2 · Programador de recordatorios (cada minuto)
-- Ejecútalo DESPUÉS de setup.sql y de desplegar las funciones.
-- Sustituye __PROJECT_URL__ por la URL de tu proyecto
-- (p. ej. https://abcdxyz.supabase.co). scripts/supabase-setup.mjs lo hace solo.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Quita versiones anteriores del programador si existían
do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname in ('nexo-reminders', 'nexo-cleanup');
end $$;

-- Cada minuto: envía los recordatorios y resúmenes que tocan
select cron.schedule(
  'nexo-reminders',
  '* * * * *',
  $$ select net.http_post(
       url := '__PROJECT_URL__/functions/v1/send-reminders',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 20000
     ) $$
);

-- Cada noche: limpieza del registro
select cron.schedule('nexo-cleanup', '17 3 * * *', $$ select public.cleanup_reminder_log() $$);
