-- ==========================================================
-- Variante RLS "admins compartidos" por tabla interna de roles
-- Recomendado cuando no quieres depender de claims JWT.
-- ==========================================================
--
-- Requiere:
-- - public.notificaciones_admin (ya creada)
--
-- Crea:
-- - public.usuarios_admin_app (mapa user_id -> rol)
-- - helper public.is_admin_user_table()
-- - policies para acceso compartido entre admins
-- ==========================================================

create extension if not exists pgcrypto;

create table if not exists public.usuarios_admin_app (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  rol text not null check (rol in ('admin', 'administrador', 'operador')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_usuarios_admin_app_user_id
  on public.usuarios_admin_app (user_id);

create index if not exists idx_usuarios_admin_app_rol
  on public.usuarios_admin_app (rol, activo);

create or replace function public.is_admin_user_table()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.usuarios_admin_app u
    where u.user_id = auth.uid()
      and u.activo = true
      and lower(u.rol) in ('admin', 'administrador')
  );
$$;

alter table public.notificaciones_admin enable row level security;

drop policy if exists "na_select_own" on public.notificaciones_admin;
drop policy if exists "na_insert_own" on public.notificaciones_admin;
drop policy if exists "na_update_own" on public.notificaciones_admin;
drop policy if exists "na_delete_own" on public.notificaciones_admin;
drop policy if exists "na_select_admin_shared" on public.notificaciones_admin;
drop policy if exists "na_insert_admin_shared" on public.notificaciones_admin;
drop policy if exists "na_update_admin_shared" on public.notificaciones_admin;
drop policy if exists "na_delete_admin_shared" on public.notificaciones_admin;

drop policy if exists "na_select_admin_by_table" on public.notificaciones_admin;
create policy "na_select_admin_by_table"
on public.notificaciones_admin
for select
to authenticated
using (public.is_admin_user_table());

drop policy if exists "na_insert_admin_by_table" on public.notificaciones_admin;
create policy "na_insert_admin_by_table"
on public.notificaciones_admin
for insert
to authenticated
with check (
  public.is_admin_user_table()
  and created_by = auth.uid()
);

drop policy if exists "na_update_admin_by_table" on public.notificaciones_admin;
create policy "na_update_admin_by_table"
on public.notificaciones_admin
for update
to authenticated
using (public.is_admin_user_table())
with check (public.is_admin_user_table());

drop policy if exists "na_delete_admin_by_table" on public.notificaciones_admin;
create policy "na_delete_admin_by_table"
on public.notificaciones_admin
for delete
to authenticated
using (public.is_admin_user_table());

-- ==========================================================
-- Ejemplo de alta de admin:
-- insert into public.usuarios_admin_app (user_id, rol, activo)
-- values ('<UUID_DE_AUTH_USERS>', 'admin', true);
-- ==========================================================
