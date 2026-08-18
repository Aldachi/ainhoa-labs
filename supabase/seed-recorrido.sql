-- ============================================
-- CH'UTILLOS 2026 — Trazado del recorrido
-- ============================================
--
-- Datos REALES. Levantados sobre el mapa con el editor de
-- /chutillos/admin/recorrido/.
--
--   18 puntos · 3.51 km de largo
--   Extensión: 1.5 km norte-sur × 875 m este-oeste
--
-- Ejecutar en el SQL Editor de Supabase después de schema.sql.
-- Es idempotente: borra el trazado anterior antes de insertar, así que se
-- puede volver a correr tras cada corrección sin duplicar puntos.
--
-- Para modificarlo: abrir el editor, pegar el arreglo actual en "Cargar un
-- trazado existente", corregir sobre el mapa y volver a exportar.
-- ============================================

delete from recorrido;

insert into recorrido (orden, lat, lng) values
  (1,  -19.591296, -65.757334),
  (2,  -19.591794, -65.758898),
  (3,  -19.592381, -65.759826),
  (4,  -19.592310, -65.761709),
  (5,  -19.592067, -65.761778),
  (6,  -19.591016, -65.761033),
  (7,  -19.589869, -65.760705),
  (8,  -19.588418, -65.760974),
  (9,  -19.586265, -65.759590),
  (10, -19.584153, -65.760942),
  (11, -19.582899, -65.761135),
  (12, -19.582171, -65.760823),
  (13, -19.582596, -65.760362),
  (14, -19.578876, -65.757605),
  (15, -19.580675, -65.753421),
  (16, -19.584931, -65.756629),
  (17, -19.585800, -65.757101),
  (18, -19.586134, -65.757122);

-- Comprobación: debe devolver 18 filas en orden 1..18
--   select orden, lat, lng from recorrido order by orden;
