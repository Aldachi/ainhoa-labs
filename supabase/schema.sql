-- ============================================
-- CH'UTILLOS 2026 — Esquema de base de datos
-- ============================================
--
-- Ejecutar completo en el SQL Editor de Supabase.
-- Es idempotente: se puede correr más de una vez sin romper nada.
--
-- Modelo de seguridad
-- -------------------
-- La anon key viaja al navegador y hay que asumirla pública. Por eso:
--
--   · RLS activo en todas las tablas, sin ninguna política de escritura
--     para anon. Con la anon key es imposible hacer INSERT, UPDATE o
--     DELETE directo sobre las tablas.
--   · Los pings GPS y los reportes de checkpoint entran por funciones
--     SECURITY DEFINER que validan el token del lado del servidor.
--   · Los tokens no son legibles: el GRANT de SELECT sobre fraternidades
--     excluye la columna token_portador a nivel de columna.
--   · El panel admin no usa la anon key en absoluto; escribe con la
--     service key desde el Worker de Cloudflare.
--
-- ============================================


-- ============================================
-- 1. TABLAS
-- ============================================

create table if not exists fraternidades (
  id              text primary key,
  nombre          text not null,
  -- Institucion o comunidad que la presenta. En el dia 30 hay tres
  -- "Sicuriada", tres "Jula Jula" y tres "Carnaval Blanco": el nombre
  -- solo no identifica a nadie, la entidad si.
  entidad         text,
  -- Numero de grupo del afiche (dias 28 y 29). Solo para poder cotejar
  -- con el impreso: el orden que vale es orden_ingreso, que es global.
  grupo           smallint,
  tipo            text not null check (tipo in ('autoctona', 'folklorica')),
  dia             smallint not null check (dia in (28, 29, 30)),
  modo_tracking   text not null default 'checkpoint'
                    check (modo_tracking in ('gps', 'checkpoint')),
  orden_ingreso   integer not null,
  hora_estimada   text,
  token_portador  text unique,
  creado_en       timestamptz not null default now()
);

create table if not exists checkpoints (
  id                 text primary key,
  nombre             text not null,
  orden_en_recorrido integer not null,
  lat                double precision not null,
  lng                double precision not null,
  token_voluntario   text unique,
  creado_en          timestamptz not null default now()
);

-- Trazado del recorrido. Es el mismo todos los días, así que se guarda
-- una sola vez y el mapa lo dibuja de fondo.
create table if not exists recorrido (
  orden integer primary key,
  lat   double precision not null,
  lng   double precision not null
);

-- Nombres de las vías por tramo, en metros desde la salida. Es lo que
-- permite que la ficha diga "va por la Avenida Universitaria" en vez de
-- "entre el Punto 3 y el Punto 4": un punto de control es una referencia
-- interna, una avenida es algo que la gente ubica sin explicación.
create table if not exists calles (
  id      bigserial primary key,
  desde   integer not null,
  hasta   integer not null,
  nombre  text not null,
  check (hasta > desde)
);

create table if not exists posiciones_gps (
  id             bigserial primary key,
  fraternidad_id text not null references fraternidades(id) on delete cascade,
  lat            double precision not null,
  lng            double precision not null,
  -- Clave idempotente enviada por el cliente. Si un ping se reintenta tras
  -- un timeout ambiguo, no se duplica el registro.
  client_id      text unique,
  timestamp      timestamptz not null default now()
);

create table if not exists reportes_checkpoint (
  id             bigserial primary key,
  fraternidad_id text not null references fraternidades(id) on delete cascade,
  checkpoint_id  text not null references checkpoints(id) on delete cascade,
  client_id      text unique,
  timestamp      timestamptz not null default now()
);


-- ============================================
-- 2. ÍNDICES
-- ============================================
-- La consulta caliente es "última fila por fraternidad", que se resuelve
-- con DISTINCT ON. Estos índices la hacen barata aunque la tabla crezca a
-- decenas de miles de pings durante los tres días.

create index if not exists idx_pos_frat_ts
  on posiciones_gps (fraternidad_id, timestamp desc);

create index if not exists idx_rep_frat_ts
  on reportes_checkpoint (fraternidad_id, timestamp desc);

create index if not exists idx_frat_dia_orden
  on fraternidades (dia, orden_ingreso);


-- ============================================
-- 3. VISTA DE ÚLTIMA POSICIÓN CONOCIDA
-- ============================================
-- Unifica las dos fuentes de verdad (GPS y checkpoint) y devuelve una sola
-- fila por fraternidad: la más reciente, venga de donde venga. La página
-- pública consulta solo esto, una petición por ciclo de polling sin
-- importar cuántas fraternidades haya.

create or replace view vista_ultima_posicion as
with todo as (
  select
    p.fraternidad_id,
    'gps'::text        as origen,
    p.lat,
    p.lng,
    null::text         as checkpoint_id,
    null::text         as checkpoint_nombre,
    p.timestamp
  from posiciones_gps p

  union all

  select
    r.fraternidad_id,
    'checkpoint'::text as origen,
    c.lat,
    c.lng,
    c.id               as checkpoint_id,
    c.nombre           as checkpoint_nombre,
    r.timestamp
  from reportes_checkpoint r
  join checkpoints c on c.id = r.checkpoint_id
)
select distinct on (fraternidad_id)
  fraternidad_id, origen, lat, lng, checkpoint_id, checkpoint_nombre, timestamp
from todo
order by fraternidad_id, timestamp desc;


-- ============================================
-- 4. FUNCIONES DE ESCRITURA VALIDADAS POR TOKEN
-- ============================================
-- SECURITY DEFINER: corren con los permisos del dueño, no del que llama.
-- Es lo que permite que anon inserte pings sin tener permiso de INSERT
-- sobre la tabla. El token se valida acá adentro.
--
-- search_path fijo para que no se pueda secuestrar la resolución de
-- nombres desde fuera.

create or replace function fn_registrar_ping(
  p_token     text,
  p_lat       double precision,
  p_lng       double precision,
  p_client_id text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_frat_id text;
begin
  select id into v_frat_id
  from fraternidades
  where token_portador = p_token
    and modo_tracking = 'gps';

  if v_frat_id is null then
    -- 401xx: el cliente lo trata como error permanente y descarta el envío
    -- en vez de reintentar para siempre.
    raise exception 'Token de portador no valido'
      using errcode = '42501';
  end if;

  insert into posiciones_gps (fraternidad_id, lat, lng, client_id)
  values (v_frat_id, p_lat, p_lng, p_client_id)
  on conflict (client_id) do nothing;

  return json_build_object('ok', true, 'fraternidad_id', v_frat_id);
end;
$$;


create or replace function fn_reportar_checkpoint(
  p_token          text,
  p_fraternidad_id text,
  p_client_id      text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chk_id text;
begin
  select id into v_chk_id
  from checkpoints
  where token_voluntario = p_token;

  if v_chk_id is null then
    raise exception 'Token de checkpoint no valido'
      using errcode = '42501';
  end if;

  if not exists (select 1 from fraternidades where id = p_fraternidad_id) then
    raise exception 'Fraternidad inexistente'
      using errcode = '42501';
  end if;

  insert into reportes_checkpoint (fraternidad_id, checkpoint_id, client_id)
  values (p_fraternidad_id, v_chk_id, p_client_id)
  on conflict (client_id) do nothing;

  return json_build_object('ok', true, 'checkpoint_id', v_chk_id);
end;
$$;


-- Resolución de token -> entidad, para que las páginas de portador y de
-- checkpoint sepan a quién representan sin poder listar todos los tokens.

create or replace function fn_portador_por_token(p_token text)
returns table (
  id text, nombre text, tipo text, dia smallint,
  modo_tracking text, orden_ingreso integer, hora_estimada text
)
language sql
security definer
set search_path = public
as $$
  select id, nombre, tipo, dia, modo_tracking, orden_ingreso, hora_estimada
  from fraternidades
  where token_portador = p_token
    and modo_tracking = 'gps';
$$;


create or replace function fn_checkpoint_por_token(p_token text)
returns table (
  id text, nombre text, orden_en_recorrido integer,
  lat double precision, lng double precision
)
language sql
security definer
set search_path = public
as $$
  select id, nombre, orden_en_recorrido, lat, lng
  from checkpoints
  where token_voluntario = p_token;
$$;


-- ============================================
-- 5. RLS Y PERMISOS
-- ============================================

alter table fraternidades        enable row level security;
alter table calles               enable row level security;
alter table checkpoints          enable row level security;
alter table recorrido            enable row level security;
alter table posiciones_gps       enable row level security;
alter table reportes_checkpoint  enable row level security;

-- --- Lectura pública de los catálogos ---

drop policy if exists lectura_publica_frat on fraternidades;
create policy lectura_publica_frat on fraternidades
  for select to anon, authenticated using (true);

drop policy if exists lectura_publica_chk on checkpoints;
create policy lectura_publica_chk on checkpoints
  for select to anon, authenticated using (true);

drop policy if exists lectura_publica_rec on recorrido;
create policy lectura_publica_rec on recorrido
  for select to anon, authenticated using (true);

drop policy if exists lectura_publica_calles on calles;
create policy lectura_publica_calles on calles
  for select to anon, authenticated using (true);

-- Las tablas de eventos no se leen directo: la página pública usa la
-- vista. No se crea ninguna política de SELECT para anon sobre ellas.

-- --- Ninguna política de escritura para anon ---
-- La ausencia es deliberada: con RLS activo y sin política, todo INSERT,
-- UPDATE o DELETE con la anon key es rechazado. Las escrituras legítimas
-- entran por las funciones SECURITY DEFINER de arriba.

-- --- Permisos a nivel de columna ---
-- Acá se protegen los tokens: anon puede leer los datos de la fraternidad
-- pero no la columna token_portador.

revoke all on fraternidades from anon;
grant select (
  id, nombre, entidad, grupo, tipo, dia, modo_tracking, orden_ingreso,
  hora_estimada
) on fraternidades to anon;

revoke all on checkpoints from anon;
grant select (
  id, nombre, orden_en_recorrido, lat, lng
) on checkpoints to anon;

grant select on recorrido to anon;
grant select on calles to anon;
grant select on vista_ultima_posicion to anon;

-- Solo estas cuatro funciones son invocables por el público.
grant execute on function fn_registrar_ping(text, double precision, double precision, text) to anon;
grant execute on function fn_reportar_checkpoint(text, text, text) to anon;
grant execute on function fn_portador_por_token(text) to anon;
grant execute on function fn_checkpoint_por_token(text) to anon;


-- ============================================
-- 6. VERIFICACIÓN
-- ============================================
-- Después de ejecutar todo, esta consulta debe devolver 5 filas con
-- rowsecurity = true. Si alguna dice false, esa tabla quedó expuesta.
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in ('fraternidades','checkpoints','recorrido','calles',
--                       'posiciones_gps','reportes_checkpoint');
--
-- Y esta debe fallar con error de permisos (es la prueba de que la anon
-- key no puede escribir). Ejecutarla desde el cliente, no desde el editor
-- SQL, que corre como superusuario:
--
--   curl -X POST "$SUPABASE_URL/rest/v1/fraternidades" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"id":"hack","nombre":"x","tipo":"autoctona","dia":28,"orden_ingreso":1}'
--
-- Respuesta esperada: 401 o 403.
