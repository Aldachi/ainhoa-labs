-- ============================================
-- CH'UTILLOS 2026 — Calles y avenidas del recorrido
-- ============================================
--
-- Datos REALES. Marcados por el cliente sobre el mapa con el modo
-- "Calles y avenidas" de /chutillos/admin/recorrido/.
--
-- Es lo que permite que la ficha publica diga "va por la Avenida Tinkuy"
-- en vez de "entre el Punto 2 y el Punto 4": un punto de control es una
-- referencia interna nuestra, una avenida es algo que la gente ubica sin
-- que se lo expliquen.
--
-- Control de calidad del trazado:
--
--   Tramo                    Largo   El corte cae en
--   ---------------------------------------------------------------
--   Arco Mejillones            87 m  (inicio)
--   Calle Mejillones          191 m  sin giro cerca
--   Calle H. Vasquez          225 m  giro a los 290 m
--   Avenida Tinkuy           1238 m  giro a los 516 m + Punto 2
--   Avenida Universitaria      62 m  giro a los 1736 m + Punto 4
--   Avenida Sevilla           505 m  giro a los 1804 m
--   Avenida Litoral           482 m  giro a los 2309 m + Punto 5
--   Avenida Civica            612 m  giro a los 2791 m + Punto 6
--   Plaza San Bernardo        116 m  giro a los 3372 m
--
--   Siete de los ocho cortes caen sobre giros reales del trazado, o sea
--   que fueron puestos en las esquinas. Sin huecos ni superposiciones,
--   cubriendo los 3518 m completos.
--
--   La Universitaria son solo 62 m: el recorrido apenas la cruza entre
--   dos giros. Es corto para una avenida, pero cae exactamente entre dos
--   esquinas reales, asi que lo mas probable es que sea un cruce breve.
--   Vale una mirada rapida al mapa antes del evento.
--
-- El ultimo tramo lleva el marcador de fin: una fraternidad que llega a
-- la Plaza San Bernardo se muestra como "Finalizo el recorrido".
--
-- Ejecutar despues de schema.sql, seed-recorrido.sql y seed-checkpoints.sql.
-- ============================================

delete from calles;

insert into calles (desde, hasta, nombre) values
  (    0,    87, 'Arco Mejillones'),
  (   87,   278, 'Calle Mejillones'),
  (  278,   503, 'Calle H. Vásquez'),
  (  503,  1741, 'Avenida Tinkuy'),
  ( 1741,  1803, 'Avenida Universitaria'),
  ( 1803,  2308, 'Avenida Sevilla'),
  ( 2308,  2790, 'Avenida Litoral'),
  ( 2790,  3402, 'Avenida Cívica'),
  ( 3402, 99999, 'Plaza San Bernardo');

-- Comprobacion: 9 filas, y la columna `hueco` en cero salvo la primera
--   select desde, hasta, nombre,
--          desde - lag(hasta) over (order by desde) as hueco
--   from calles order by desde;
