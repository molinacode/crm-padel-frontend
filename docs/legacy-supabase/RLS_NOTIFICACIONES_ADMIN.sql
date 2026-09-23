-- ==========================================================
-- Tabla + RLS para notificaciones administrativas de conciliacion
-- ==========================================================

create extension if not exists pgcrypto;

create table if not exists public.notificaciones_admin (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensaje text not null,
  datos jsonb not null default '{}'::jsonb,
  leida boolean not null default false,
  leida_at timestamptz null
);

create index if not exists idx_notif_admin_created_at
  on public.notificaciones_admin (created_at desc);

create index if not exists idx_notif_admin_leida
  on public.notificaciones_admin (leida);

create index if not exists idx_notif_admin_tipo
  on public.notificaciones_admin (tipo);

-- Trigger para marcar fecha de lectura
create or replace function public.set_notificacion_admin_leida_at()
returns trigger
language plpgsql
as $$
begin
  if new.leida = true and old.leida = false then
    new.leida_at = now();
  elsif new.leida = false then
    new.leida_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificacion_admin_leida_at on public.notificaciones_admin;
create trigger trg_notificacion_admin_leida_at
before update on public.notificaciones_admin
for each row
execute function public.set_notificacion_admin_leida_at();

-- ==========================================================
-- RLS
-- Estrategia inicial: cada usuario autenticado solo ve/edita
-- sus propias notificaciones (created_by = auth.uid()).
-- ==========================================================

alter table public.notificaciones_admin enable row level security;

drop policy if exists "na_select_own" on public.notificaciones_admin;
create policy "na_select_own"
on public.notificaciones_admin
for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "na_insert_own" on public.notificaciones_admin;
create policy "na_insert_own"
on public.notificaciones_admin
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "na_update_own" on public.notificaciones_admin;
create policy "na_update_own"
on public.notificaciones_admin
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "na_delete_own" on public.notificaciones_admin;
create policy "na_delete_own"
on public.notificaciones_admin
for delete
to authenticated
using (created_by = auth.uid());

-- ==========================================================
-- Opcional (si quieres visibilidad compartida de admins):
-- sustituir las policies por una variante con helper de roles.
-- ==========================================================
