-- ============================================
-- CH'UTILLOS 2026 — Puntos de control
-- ============================================
--
-- Ubicaciones REALES, marcadas sobre el mapa con el editor de
-- /chutillos/admin/recorrido/. Los siete caen exactamente sobre el
-- trazado (desvio 0 m).
--
-- Reparto a lo largo de los 3518 m del recorrido:
--
--   Punto 1     43 m del inicio   — confirma la salida
--   Punto 2    503 m                 tramo previo: 460 m   ~35 min
--   Punto 3    949 m                 tramo previo: 446 m   ~33 min
--   Punto 4   1741 m                 tramo previo: 792 m   ~59 min  <-- el mas largo
--   Punto 5   2306 m                 tramo previo: 565 m   ~42 min
--   Punto 6   2788 m                 tramo previo: 482 m   ~36 min
--   Punto 7   3448 m                 tramo previo: 661 m   ~50 min
--                                    hasta el final:  70 m
--
-- (minutos a 0.80 km/h, la velocidad real del desfile con sus descansos:
--  las salidas van de 08:00 a 19:25 y la ultima termina cerca de la
--  medianoche)
--
-- El tramo Punto 3 -> Punto 4 es casi el doble que sus vecinos: 792 m,
-- casi una hora sin actualizar. El sistema ya lo contempla -mide la
-- antiguedad del dato contra lo que tarda cada tramo, no contra un numero
-- global- asi que no se ve como alerta falsa. Aun asi es el tramo con
-- menos cobertura: si aparece gente de sobra, ahi conviene el punto extra.
-- Para emparejarlo sin sumar gente, correr el Punto 3 unos 230 m hacia
-- adelante, a lat -19.586681 / lng -65.759857.
--
-- Los nombres "Punto 1" a "Punto 7" son los DEFINITIVOS, por decision del
-- cliente. Funciona porque el publico ya no los necesita para ubicarse:
-- la ficha encabeza con la calle -"Va por Avenida Tinkuy"- y el punto de
-- control aparece solo en la linea de "Confirmada en ...", que es
-- trazabilidad, no orientacion.
--
-- Ejecutar despues de schema.sql y seed-recorrido.sql.
-- ============================================

insert into checkpoints (id, nombre, orden_en_recorrido, lat, lng) values
  ('chk-01', 'Punto 1', 1, -19.591421, -65.757720),
  ('chk-02', 'Punto 2', 2, -19.592184, -65.761746),
  ('chk-03', 'Punto 3', 3, -19.588455, -65.760968),
  ('chk-04', 'Punto 4', 4, -19.582200, -65.760791),
  ('chk-05', 'Punto 5', 5, -19.578897, -65.757621),
  ('chk-06', 'Punto 6', 6, -19.580664, -65.753453),
  ('chk-07', 'Punto 7', 7, -19.585541, -65.756958)
on conflict (id) do update set
  nombre             = excluded.nombre,
  orden_en_recorrido = excluded.orden_en_recorrido,
  lat                = excluded.lat,
  lng                = excluded.lng;


-- ============================================
-- Tokens de los voluntarios
-- ============================================
-- Son la unica credencial de acceso, asi que tienen que ser imposibles de
-- adivinar. Esto NO pisa los que ya existan: solo llena los vacios, para
-- no invalidar enlaces ya repartidos.

update checkpoints
set token_voluntario = 'vol-' || id || '-' || encode(gen_random_bytes(6), 'hex')
where token_voluntario is null;

-- Los enlaces armados salen del panel admin, pestaña "Enlaces".

-- Comprobacion: 7 filas, todas con token
--   select orden_en_recorrido, nombre, token_voluntario is not null as tiene_token
--   from checkpoints order by orden_en_recorrido;
