-- ============================================
-- CH'UTILLOS 2026 — Calles y avenidas del recorrido
-- ============================================
--
-- Cada tramo, en metros desde la salida, con el nombre de la via.
-- Es lo que permite que la ficha publica diga "va por la Avenida
-- Universitaria" en vez de "entre el Punto 3 y el Punto 4": un punto de
-- control es una referencia interna nuestra, una avenida es algo que la
-- gente ubica sin que se lo expliquen.
--
-- ⚠️ VERIFICAR ANTES DEL EVENTO
--
-- Los nueve nombres son los que paso el cliente. Los cortes salen de la
-- geometria del trazado: tiene exactamente nueve tramos rectos separados
-- por giros fuertes, y los nombres se asignaron en el orden en que fueron
-- listados, asumiendo que ese es el orden del recorrido.
--
-- La cantidad coincide y el orden es plausible, pero nadie verifico sobre
-- el terreno que nombre corresponde a cada tramo. Una calle equivocada en
-- la ficha es peor que ninguna: alguien puede salir a buscar a su
-- fraternidad a la avenida que no es.
--
-- Para contrastar: abrir /chutillos/admin/recorrido/, mirar a que altura
-- del trazado cae cada rango y corregir los numeros de abajo.
--
-- Ejecutar despues de schema.sql y seed-recorrido.sql.
-- ============================================

delete from calles;

insert into calles (desde, hasta, nombre) values
  (   0,  290, 'Arco Mejillones'),
  ( 290,  516, 'Calle Mejillones'),
  ( 516,  953, 'Calle H. Vásquez'),
  ( 953, 1233, 'Avenida Tinkuy'),
  (1233, 1736, 'Avenida Universitaria'),
  (1736, 2309, 'Avenida Sevilla'),
  (2309, 2791, 'Avenida Litoral'),
  (2791, 3372, 'Avenida Cívica'),
  (3372, 9999, 'Plaza San Bernardo');

-- Comprobacion: 9 filas, sin huecos ni superposiciones entre tramos
--   select desde, hasta, nombre,
--          lag(hasta) over (order by desde) as fin_anterior
--   from calles order by desde;
