-- ============================================================
-- 001_recomendaciones_ia.sql
-- Tablas nuevas para el sistema de recomendaciones con IA
-- (ver el documento "Sistema de recomendaciones con IA — Plan
-- de diseño" en los Docs del proyecto para el detalle de cada
-- columna y el razonamiento detrás del modelo).
--
-- Cómo correr esto: pegar todo este archivo en el SQL Editor de
-- Supabase (Project > SQL Editor > New query) y ejecutar una
-- sola vez. Es seguro volver a correrlo (usa IF NOT EXISTS).
-- ============================================================

-- ---------------------------------------------------------------
-- criterios_comerciales
-- Las reglas de negocio: qué decisión corresponde ante cada
-- situación detectada por el dashboard. Esta tabla la llena el
-- equipo de Finko a mano (no el código).
-- ---------------------------------------------------------------
create table if not exists criterios_comerciales (
  id uuid primary key default gen_random_uuid(),
  situacion text not null,
  condicion jsonb,
  decision_esperada text not null,
  definido_por text,
  vigente_desde date not null default current_date,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table criterios_comerciales is
  'Reglas comerciales: si se da la "situacion" (código que usa el dashboard), la decisión es "decision_esperada".';
comment on column criterios_comerciales.situacion is
  'Código técnico de la situación detectada. Ver executive.js (codigo_situacion) para la lista vigente.';

create index if not exists idx_criterios_situacion_activo
  on criterios_comerciales (situacion)
  where activo = true;

-- ---------------------------------------------------------------
-- campanas_historicas
-- Historial de inversión en pauta/promoción. Es lo que hoy no
-- existe y es la base para que la IA pueda sugerir montos con
-- fundamento (fase 3 del plan).
-- ---------------------------------------------------------------
create table if not exists campanas_historicas (
  id uuid primary key default gen_random_uuid(),
  post_id text references publicaciones_instagram(post_id) on delete set null,
  categoria text,
  monto_invertido numeric(12, 2),
  fecha_inicio date,
  fecha_fin date,
  resultado_alcance integer,
  resultado_interacciones integer,
  resultado_conversiones integer,
  notas text,
  created_at timestamptz not null default now()
);

comment on table campanas_historicas is
  'Inversión real en campañas pasadas y su resultado. Carga manual del equipo comercial.';

-- ---------------------------------------------------------------
-- recomendaciones_generadas
-- Cada recomendación que el sistema le mostró al usuario, con su
-- origen (determinista o IA) y los datos que la respaldan. Es lo
-- que permite "profundizar" en una oportunidad.
-- ---------------------------------------------------------------
create table if not exists recomendaciones_generadas (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz not null default now(),
  tipo text not null check (tipo in ('alerta', 'oportunidad', 'inversion')),
  origen text not null check (origen in ('determinista', 'ia')),
  criterio_id uuid references criterios_comerciales(id) on delete set null,
  post_id text references publicaciones_instagram(post_id) on delete set null,
  texto_recomendacion text not null,
  datos_que_la_respaldan jsonb,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada'))
);

comment on table recomendaciones_generadas is
  'Historial de recomendaciones mostradas, para poder auditar de dónde salió cada una.';

-- ---------------------------------------------------------------
-- feedback_recomendaciones
-- El loop de feedback: si una recomendación sirvió o no.
-- ---------------------------------------------------------------
create table if not exists feedback_recomendaciones (
  id uuid primary key default gen_random_uuid(),
  recomendacion_id uuid not null references recomendaciones_generadas(id) on delete cascade,
  usuario text,
  fue_util boolean,
  comentario text,
  fecha timestamptz not null default now()
);

comment on table feedback_recomendaciones is
  'Feedback del equipo sobre cada recomendación, para poder ajustar los criterios con el tiempo.';

-- ---------------------------------------------------------------
-- Seguridad: Row Level Security.
--
-- criterios_comerciales SÍ se lee desde el dashboard (a través de
-- /api/criterios, con la clave publishable, igual que
-- publicaciones_instagram) -> necesita una política de lectura
-- pública.
--
-- Las otras tres tablas NO se leen todavía desde el navegador
-- (eso es fase 3/4 del plan) -> quedan con RLS activado y SIN
-- políticas, lo que significa que por ahora solo se puede acceder
-- a ellas con la service_role key (desde el SQL Editor o un
-- script de backend), nunca desde el dashboard público.
-- ---------------------------------------------------------------
alter table criterios_comerciales enable row level security;
alter table campanas_historicas enable row level security;
alter table recomendaciones_generadas enable row level security;
alter table feedback_recomendaciones enable row level security;

drop policy if exists "Lectura pública de criterios comerciales" on criterios_comerciales;
create policy "Lectura pública de criterios comerciales"
  on criterios_comerciales
  for select
  using (true);
