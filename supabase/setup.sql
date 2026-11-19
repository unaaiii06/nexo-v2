-- =====================================================================
-- Nexo v2 · Esquema de Supabase
-- Pégalo entero en: Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar varias veces sin romper nada (es idempotente).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Datos sincronizados: una fila por elemento (tarea, hábito, hito…)
-- ---------------------------------------------------------------------
create sequence if not exists public.items_rev_seq;

create table if not exists public.items (
  user_id     uuid not null references auth.users (id) on delete cascade,
  collection  text not null,
  id          text not null,
  data        jsonb,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now(),   -- hora del cambio en el dispositivo
  rev         bigint not null default nextval('public.items_rev_seq'), -- orden en el servidor
  primary key (user_id, collection, id)
);
create index if not exists items_user_rev on public.items (user_id, rev);

-- Cada escritura obtiene un número de revisión nuevo (para descargar solo lo que cambió)
create or replace function public.items_bump_rev() returns trigger
language plpgsql as $$
begin
  new.rev := nextval('public.items_rev_seq');
  return new;
end $$;

drop trigger if exists items_bump_rev on public.items;
create trigger items_bump_rev before insert or update on public.items
for each row execute function public.items_bump_rev();

alter table public.items enable row level security;
drop policy if exists "items: cada uno lo suyo" on public.items;
create policy "items: cada uno lo suyo" on public.items
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Subida de cambios: solo gana el cambio más reciente (last-write-wins por elemento)
create or replace function public.sync_push(rows jsonb) returns void
language plpgsql security invoker set search_path = public as $$
begin
  insert into public.items (user_id, collection, id, data, deleted, updated_at)
  select auth.uid(), r->>'collection', r->>'id', r->'data',
         coalesce((r->>'deleted')::boolean, false), (r->>'updated_at')::timestamptz
  from jsonb_array_elements(rows) as r
  on conflict (user_id, collection, id) do update
    set data = excluded.data, deleted = excluded.deleted, updated_at = excluded.updated_at
    where public.items.updated_at < excluded.updated_at;
end $$;
grant execute on function public.sync_push(jsonb) to authenticated;

-- Tiempo real: avisa a los otros dispositivos al instante
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'items') then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. Perfil: nombre, zona horaria y resumen diario por Telegram
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  name             text,
  tz               text not null default 'Europe/Madrid',
  digest_enabled   boolean not null default true,
  digest_time      time not null default '08:00',
  last_digest_date date,
  updated_at       timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles: cada uno lo suyo" on public.profiles;
create policy "profiles: cada uno lo suyo" on public.profiles
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. Telegram: chat vinculado y códigos de vinculación
-- ---------------------------------------------------------------------
create table if not exists public.telegram_links (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  chat_id    bigint not null unique,
  username   text,
  linked_at  timestamptz not null default now()
);
alter table public.telegram_links enable row level security;
drop policy if exists "telegram_links: ver lo mío" on public.telegram_links;
create policy "telegram_links: ver lo mío" on public.telegram_links
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "telegram_links: desvincular lo mío" on public.telegram_links;
create policy "telegram_links: desvincular lo mío" on public.telegram_links
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.telegram_codes (
  code       text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null
);
alter table public.telegram_codes enable row level security; -- sin políticas: solo el servidor

-- Crea un código de un solo uso (15 min) para vincular Telegram desde la app
create or replace function public.create_telegram_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  delete from public.telegram_codes where user_id = auth.uid() or expires_at < now();
  c := replace(gen_random_uuid()::text, '-', '');
  insert into public.telegram_codes (code, user_id, expires_at) values (c, auth.uid(), now() + interval '15 minutes');
  return c;
end $$;
revoke all on function public.create_telegram_code() from public, anon;
grant execute on function public.create_telegram_code() to authenticated;

-- ---------------------------------------------------------------------
-- 4. Recordatorios: el servidor reclama los pendientes de forma atómica
--    (nunca se envía dos veces el mismo recordatorio)
-- ---------------------------------------------------------------------
create table if not exists public.reminder_log (
  user_id   uuid not null references auth.users (id) on delete cascade,
  item_id   text not null,
  remind_at timestamptz not null,
  sent_at   timestamptz not null default now(),
  primary key (user_id, item_id, remind_at)
);
alter table public.reminder_log enable row level security; -- sin políticas: solo el servidor

create or replace function public.claim_due_reminders()
returns table (user_id uuid, chat_id bigint, collection text, item_id text, data jsonb, remind_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
  with due as (
    -- Cada tarea/bloque puede tener varios avisos (remindAts) o uno antiguo (remindAt)
    select i.user_id, l.chat_id, i.collection, i.id as item_id, i.data, t.at as remind_at
    from public.items i
    join public.telegram_links l on l.user_id = i.user_id
    cross join lateral (
      select (x)::timestamptz as at
      from jsonb_array_elements_text(case when jsonb_typeof(i.data->'remindAts') = 'array' then i.data->'remindAts' else '[]'::jsonb end) as x
      where x <> ''
      union
      select (i.data->>'remindAt')::timestamptz where nullif(i.data->>'remindAt', '') is not null
    ) t
    where i.collection in ('tasks', 'events')
      and not i.deleted
      and coalesce((i.data->>'done')::boolean, false) = false
      and t.at <= now()
      and t.at > now() - interval '6 hours'
  ),
  claimed as (
    insert into public.reminder_log (user_id, item_id, remind_at)
    select d.user_id, d.item_id, d.remind_at from due d
    on conflict do nothing
    returning reminder_log.user_id, reminder_log.item_id, reminder_log.remind_at
  )
  select d.user_id, d.chat_id, d.collection, d.item_id, d.data, d.remind_at
  from due d join claimed c on c.user_id = d.user_id and c.item_id = d.item_id and c.remind_at = d.remind_at;
end $$;
revoke all on function public.claim_due_reminders() from public, anon, authenticated;

-- Resumen diario: devuelve a quién toca enviárselo ahora y lo marca como enviado
create or replace function public.claim_due_digests()
returns table (user_id uuid, chat_id bigint, name text, local_date date)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
  update public.profiles p
     set last_digest_date = (now() at time zone p.tz)::date
    from public.telegram_links l
   where l.user_id = p.user_id
     and p.digest_enabled
     and (now() at time zone p.tz)::time >= p.digest_time
     and (now() at time zone p.tz)::time < p.digest_time + interval '3 hours'
     and (p.last_digest_date is null or p.last_digest_date < (now() at time zone p.tz)::date)
  returning p.user_id, l.chat_id, p.name, p.last_digest_date;
end $$;
revoke all on function public.claim_due_digests() from public, anon, authenticated;

-- Limpieza periódica del registro de recordatorios (más de 30 días)
create or replace function public.cleanup_reminder_log() returns void
language sql security definer set search_path = public as $$
  delete from public.reminder_log where sent_at < now() - interval '30 days';
  delete from public.telegram_codes where expires_at < now();
$$;
revoke all on function public.cleanup_reminder_log() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Permisos explícitos (los proyectos nuevos de Supabase no los dan por defecto).
--    Las reglas RLS de arriba siguen limitando cada fila a su dueño.
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.items to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, delete on public.telegram_links to authenticated;
grant usage, select on sequence public.items_rev_seq to authenticated;
grant all on public.items, public.profiles, public.telegram_links, public.telegram_codes, public.reminder_log to service_role;
grant usage, select on sequence public.items_rev_seq to service_role;
grant execute on function public.claim_due_reminders(), public.claim_due_digests(), public.cleanup_reminder_log() to service_role;
