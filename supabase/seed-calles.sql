-- ============================================
-- CH'UTILLOS 2026 — Calles y avenidas del recorrido
-- ============================================
--
-- Cada tramo, en metros desde la salida, con el nombre de la via.
-- Es lo que permite que la ficha publica diga "va por la Avenida Tinkuy"
-- en vez de "entre el Punto 2 y el Punto 4": un punto de control es una
-- referencia interna nuestra, una avenida es algo que la gente ubica sin
-- que se lo expliquen.
--
-- Los metros de cada punto de control, para referencia:
--
--   Punto 1 →   43 m        Punto 5 → 2306 m
--   Punto 2 →  503 m        Punto 6 → 2788 m
--   Punto 3 →  949 m        Punto 7 → 3448 m
--   Punto 4 → 1741 m        (fin)   → 3518 m
--
-- ============================================
-- ⚠️ SOLO UN TRAMO ESTA CONFIRMADO
-- ============================================
--
-- Avenida Tinkuy (Punto 2 → Punto 4, o sea 503 a 1741 m) la confirmo el
-- cliente. Los otros ocho son el mejor reparto disponible sobre los giros
-- del trazado, siguiendo el orden en que los nombres fueron listados.
--
-- Ese reparto ya se demostro equivocado una vez: Tinkuy figuraba entre
-- los metros 953 y 1233 cuando en realidad abarca de 503 a 1741. Asi que
-- conviene desconfiar del resto tambien.
--
-- Una calle equivocada en la ficha es peor que ninguna: alguien sale a
-- buscar a su fraternidad a la avenida que no es. Confirmar cada tramo
-- con la misma formula -"tal avenida va del Punto N al Punto M"- y
-- ajustar los metros de abajo segun la tabla de arriba.
--
-- Ejecutar despues de schema.sql, seed-recorrido.sql y seed-checkpoints.sql.
-- ============================================

delete from calles;

insert into calles (desde, hasta, nombre) values
  -- Antes del Punto 2 — POR CONFIRMAR
  (   0,   200, 'Arco Mejillones'),
  ( 200,   380, 'Calle Mejillones'),
  ( 380,   503, 'Calle H. Vásquez'),

  -- CONFIRMADO: Punto 2 → Punto 4
  ( 503,  1741, 'Avenida Tinkuy'),

  -- Despues del Punto 4 — POR CONFIRMAR
  (1741,  2309, 'Avenida Universitaria'),
  (2309,  2791, 'Avenida Sevilla'),
  (2791,  3200, 'Avenida Litoral'),
  (3200,  3448, 'Avenida Cívica'),

  -- Tramo final: llegar aca es haber terminado el recorrido
  (3448, 99999, 'Plaza San Bernardo');

-- Comprobacion: 9 filas, sin huecos ni superposiciones
--   select desde, hasta, nombre,
--          desde - lag(hasta) over (order by desde) as hueco
--   from calles order by desde;
