-- ============================================================
-- 002_perfiles.sql
-- Autenticación y roles: le asigna un rol (marketing /
-- direccion_comercial) a cada usuario creado en Supabase Auth.
--
-- Cómo usarlo:
-- 1) Correr este archivo completo en el SQL Editor de Supabase
--    (una sola vez, es seguro volver a correrlo).
-- 2) Crear los usuarios en Authentication > Users > Add user
--    (un email + contraseña por persona o por equipo).
-- 3) Copiar el UUID de cada usuario (columna "UID" en esa misma
--    pantalla) y correr el INSERT de ejemplo al final de este
--    archivo, reemplazando los UUID y ajustando el rol de cada uno.
-- ============================================================

create table if not exists perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rol text not null check (rol in ('marketing', 'direccion_comercial')),
  nombre text,
  created_at timestamptz not null default now()
);

comment on table perfiles is
  'Mapea cada usuario de Supabase Auth a su rol dentro de Finko Intelligence. El frontend lo usa para decidir a qué dashboard mandar a cada usuario.';

alter table perfiles enable row level security;

-- Cada usuario autenticado puede leer únicamente su propio perfil
-- (necesario para que el login sepa a qué dashboard redirigirlo).
drop policy if exists "Cada usuario lee su propio perfil" on perfiles;
create policy "Cada usuario lee su propio perfil"
  on perfiles
  for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Ejemplo: después de crear los usuarios en Authentication > Users,
-- completar con sus UUID reales y correr este INSERT.
-- ---------------------------------------------------------------
-- insert into perfiles (user_id, rol, nombre) values
--   ('UUID-DEL-USUARIO-DE-MARKETING', 'marketing', 'Equipo Marketing'),
--   ('UUID-DEL-USUARIO-DE-DIRECCION', 'direccion_comercial', 'Dirección Comercial');
