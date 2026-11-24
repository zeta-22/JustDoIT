-- JustDoIT: archivio online. Da incollare una volta in Supabase → SQL Editor → Run.
-- Un'unica tabella "records": ogni riga è una seduta, una pesata o le impostazioni, salvata come JSON.
-- Il diario del tatami viaggia come kind 'endurance' con id che inizia per "tat-" (app/src/lib/store.ts): nessuna modifica allo schema.
-- Ogni riga appartiene a un utente e solo lui la vede (Row Level Security).

create table if not exists public.records (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('session', 'weight', 'settings', 'endurance')),
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

create index if not exists records_user_updated on public.records (user_id, updated_at);

-- l'ora di modifica la mette il server, così la sincronizzazione non dipende dall'orologio del telefono
create or replace function public.records_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
for each row execute function public.records_touch();

-- permessi sulla tabella per gli utenti collegati (nei progetti nuovi non sono automatici)
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.records to authenticated;

alter table public.records enable row level security;

drop policy if exists "records: leggo i miei" on public.records;
drop policy if exists "records: scrivo i miei" on public.records;
drop policy if exists "records: modifico i miei" on public.records;
drop policy if exists "records: cancello i miei" on public.records;

create policy "records: leggo i miei" on public.records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "records: scrivo i miei" on public.records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "records: modifico i miei" on public.records
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "records: cancello i miei" on public.records
  for delete to authenticated using ((select auth.uid()) = user_id);

-- aggiornamento per chi aveva già la tabella (aggiunto il tipo 'endurance' per nuoto/bici/corsa)
alter table public.records drop constraint if exists records_kind_check;
alter table public.records add constraint records_kind_check check (kind in ('session', 'weight', 'settings', 'endurance'));

-- fa rileggere subito la struttura all'API
notify pgrst, 'reload schema';
