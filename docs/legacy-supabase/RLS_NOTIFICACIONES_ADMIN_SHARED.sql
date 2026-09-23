-- ==========================================================
-- Variante RLS "admins compartidos" para notificaciones_admin
-- Todos los admins ven y gestionan todas las notificaciones.
-- ==========================================================
--
-- Requiere tener ya creada la tabla public.notificaciones_admin.
--
-- Esta variante se apoya en claims JWT:
-- - user_metadata.rol
-- - app_metadata.rol
--
-- Valores admin aceptados:
-- - admin
-- - administrador
-- ==========================================================

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() -> 'user_metadata' ->> 'rol') in ('admin', 'administrador')
    or lower(auth.jwt() -> 'app_metadata' ->> 'rol') in ('admin', 'administrador'),
    false
  );
$$;

alter table public.notificaciones_admin enable row level security;

drop policy if exists "na_select_own" on public.notificaciones_admin;
drop policy if exists "na_insert_own" on public.notificaciones_admin;
drop policy if exists "na_update_own" on public.notificaciones_admin;
drop policy if exists "na_delete_own" on public.notificaciones_admin;

drop policy if exists "na_select_admin_shared" on public.notificaciones_admin;
create policy "na_select_admin_shared"
on public.notificaciones_admin
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "na_insert_admin_shared" on public.notificaciones_admin;
create policy "na_insert_admin_shared"
on public.notificaciones_admin
for insert
to authenticated
with check (
  public.is_admin_user()
  and created_by = auth.uid()
);

drop policy if exists "na_update_admin_shared" on public.notificaciones_admin;
create policy "na_update_admin_shared"
on public.notificaciones_admin
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "na_delete_admin_shared" on public.notificaciones_admin;
create policy "na_delete_admin_shared"
on public.notificaciones_admin
for delete
to authenticated
using (public.is_admin_user());
