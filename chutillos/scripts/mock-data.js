/* ============================================
   CH'UTILLOS 2026 — Datos del evento
   ============================================

   Qué es real y qué no, a agosto de 2026:

   ✅ RECORRIDO      — trazado levantado sobre el mapa por el cliente.
   ✅ CHECKPOINTS    — los 7 puntos, ubicados sobre el mapa por el cliente.
   ✅ FRATERNIDADES  — Rol de Ingreso oficial de la AFFAP para los tres
                       días, con su orden y su hora de salida:
                         28 · Danzas Autóctonas   — 60 ingresos, 6 grupos
                         29 · Danzas Folklóricas  — 56 ingresos, 5 grupos
                         30 · Entrada Autóctona   — 47 ingresos, sin grupos
                       Transcritos de los afiches. Las lecturas dudosas
                       están anotadas en DUDAS_DE_TRANSCRIPCION.
   ❌ MODO_TRACKING  — sin portadores GPS: todo se cubre con los puntos
                       de control (ver GPS_HABILITADO en config.js).

   Con el rol definitivo cargado, CFG.ROL_OFICIAL pasa a true y la página
   pública ya publica los horarios de salida.
   ============================================ */

(() => {
  'use strict';

  /* ============================================================
     1. Recorrido — REAL
     ------------------------------------------------------------
     18 puntos, 3.51 km. Levantado con /chutillos/admin/recorrido/.
     ============================================================ */
  const RECORRIDO = [
    [-19.591296, -65.757334],
    [-19.591794, -65.758898],
    [-19.592381, -65.759826],
    [-19.592310, -65.761709],
    [-19.592067, -65.761778],
    [-19.591016, -65.761033],
    [-19.589869, -65.760705],
    [-19.588418, -65.760974],
    [-19.586265, -65.759590],
    [-19.584153, -65.760942],
    [-19.582899, -65.761135],
    [-19.582171, -65.760823],
    [-19.582596, -65.760362],
    [-19.578876, -65.757605],
    [-19.580675, -65.753421],
    [-19.584931, -65.756629],
    [-19.585800, -65.757101],
    [-19.586134, -65.757122]
  ];

  /* ============================================================
     1b. Calles y avenidas del recorrido
     ------------------------------------------------------------
     Cada tramo del trazado, en metros desde la salida, con el nombre de la
     vía por la que pasa. Es lo que permite que la ficha diga "va por la
     Avenida Universitaria" en vez de "entre el Punto 3 y el Punto 4":
     un punto de control es una referencia interna nuestra, una avenida es
     algo que la gente ubica sin explicación.

     Marcadas por el cliente sobre el mapa con el modo "Calles y avenidas"
     de /chutillos/admin/recorrido/. Siete de los ocho cortes caen sobre
     giros reales del trazado, así que fueron puestos en las esquinas y no
     a ojo. Sin huecos ni superposiciones, cubriendo los 3518 m.

     Los límites admiten dos formas: metros desde la salida, o el id de un
     punto de control ('chk-02') que se resuelve a su altura exacta. Acá
     van en metros porque salieron de marcar sobre el mapa; la otra forma
     queda disponible por si alguna vía se define por punto de control.
     ============================================================ */
  const CALLES = [
    { desde:     0, hasta:    87, nombre: 'Arco Mejillones' },
    { desde:    87, hasta:   278, nombre: 'Calle Mejillones' },
    { desde:   278, hasta:   503, nombre: 'Calle H. Vásquez' },
    { desde:   503, hasta:  1741, nombre: 'Avenida Tinkuy' },
    /* 62 m: el recorrido apenas cruza la Universitaria entre dos giros. */
    { desde:  1741, hasta:  1803, nombre: 'Avenida Universitaria' },
    { desde:  1803, hasta:  2308, nombre: 'Avenida Sevilla' },
    { desde:  2308, hasta:  2790, nombre: 'Avenida Litoral' },
    { desde:  2790, hasta:  3402, nombre: 'Avenida Cívica' },

    /* Última: llegar acá es haber terminado el recorrido. */
    { desde:  3402, hasta: 99999, nombre: 'Plaza San Bernardo', esFinal: true }
  ];

  /* ============================================================
     2. Checkpoints — UBICACIÓN REAL
     ------------------------------------------------------------
     7 puntos marcados por el cliente sobre el mapa. Los siete caen
     exactamente sobre el trazado (desvío 0 m).

     Reparto a lo largo del recorrido (3518 m):

       Punto 1     43 m del inicio   — confirma la salida
       Punto 2    503 m                 tramo previo: 460 m
       Punto 3    949 m                 tramo previo: 446 m
       Punto 4   1741 m                 tramo previo: 792 m  <-- el mas largo
       Punto 5   2306 m                 tramo previo: 565 m
       Punto 6   2788 m                 tramo previo: 482 m
       Punto 7   3448 m                 tramo previo: 661 m
                                        hasta el final:  70 m

     El tramo Punto 3 -> Punto 4 son 792 m: a paso de desfile, unos 27
     minutos sin actualizar, por encima del umbral de dato viejo (25 min).
     Las fraternidades que estén en ese tramo se van a ver en gris aunque
     todo funcione. Se puede emparejar corriendo el Punto 3 unos 230 m
     hacia adelante, a lat -19.586681 / lng -65.759857.

     Los nombres "Punto 1" a "Punto 7" son los definitivos, por decisión
     del cliente. Funciona porque el público ya no los necesita para
     ubicarse: la ficha encabeza con la calle —"Va por Avenida Tinkuy"— y
     el punto de control aparece solo en la línea de "Confirmada en …",
     que es trazabilidad, no orientación.
     ============================================================ */
  const CHECKPOINTS_BASE = [
    ['chk-01', 'Punto 1', 1, -19.591421, -65.757720],
    ['chk-02', 'Punto 2', 2, -19.592184, -65.761746],
    ['chk-03', 'Punto 3', 3, -19.588455, -65.760968],
    ['chk-04', 'Punto 4', 4, -19.582200, -65.760791],
    ['chk-05', 'Punto 5', 5, -19.578897, -65.757621],
    ['chk-06', 'Punto 6', 6, -19.580664, -65.753453],
    ['chk-07', 'Punto 7', 7, -19.585541, -65.756958]
  ];

  const checkpoints = CHECKPOINTS_BASE.map(([id, nombre, orden, lat, lng], i) => ({
    id,
    nombre,
    orden_en_recorrido: orden,
    lat,
    lng,
    token_voluntario: `vol-${String(orden).padStart(2, '0')}-${claveCorta(i * 977 + 13)}`
  }));

  /* ------------------------------------------------------------
     Posición de cada checkpoint a lo largo del recorrido, como fracción
     de 0 a 1. Se calcula proyectando cada punto sobre la polilínea.

     La simulación la necesita para decidir por cuál checkpoint pasó ya una
     fraternidad. Antes repartía por índice, dando por sentado que estaban
     equiespaciados; con los puntos reales eso asignaría el checkpoint
     equivocado y el ensayo previo al evento mostraría algo que no se
     corresponde con lo que va a pasar en la calle.

     Se calcula en vez de escribirse a mano para que siga siendo correcto
     si cambian el trazado o la ubicación de los puntos.
     ------------------------------------------------------------ */
  const FRACCIONES_CHK = (() => {
    /* Plano local: a esta escala la distorsión es despreciable y evita
       trigonometría en cada iteración. */
    const LAT_M = 111320;
    const LNG_M = 111320 * Math.cos(-19.586 * Math.PI / 180);
    const xy = (la, ln) => [ln * LNG_M, la * LAT_M];

    const acum = [0];
    for (let i = 1; i < RECORRIDO.length; i++) {
      const a = xy(...RECORRIDO[i - 1]);
      const b = xy(...RECORRIDO[i]);
      acum.push(acum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    const total = acum[acum.length - 1] || 1;

    return checkpoints.map(c => {
      const p = xy(c.lat, c.lng);
      let mejor = { d: Infinity, s: 0 };

      for (let i = 1; i < RECORRIDO.length; i++) {
        const a = xy(...RECORRIDO[i - 1]);
        const b = xy(...RECORRIDO[i]);
        const vx = b[0] - a[0], vy = b[1] - a[1];
        const L2 = vx * vx + vy * vy;
        let t = L2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0;
        t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
        if (d < mejor.d) mejor = { d, s: acum[i - 1] + t * Math.sqrt(L2) };
      }
      return mejor.s / total;
    });
  })();

  /* Último checkpoint que la fraternidad ya dejó atrás, o null si todavía
     no llegó al primero. */
  function checkpointPasado(p) {
    let idx = -1;
    for (let i = 0; i < FRACCIONES_CHK.length; i++) {
      if (p >= FRACCIONES_CHK[i]) idx = i;
    }
    return idx < 0 ? null : checkpoints[idx];
  }

  /* ============================================================
     3. Fraternidades — ROL DE INGRESO OFICIAL AFFAP 2026
     ------------------------------------------------------------
     Formato: [orden, hora, nombre, entidad, grupo]

       orden   — posición global en la fila del día. Es la que usa la
                 cadena del mapa: el desfile es una fila continua y lo que
                 se ve en la calle es el orden global, no el del grupo.
       grupo   — número de grupo del afiche (días 28 y 29), o null.
                 Los afiches numeran del 1 al 10 (o al 12) DENTRO de cada
                 grupo, así que ese número por sí solo no identifica a
                 nadie. Se guarda para poder cotejar con el impreso.
       entidad — institución o comunidad que la presenta. En el día 30 es
                 imprescindible: hay tres "Sicuriada", tres "Jula Jula" y
                 tres "Carnaval Blanco", y lo único que las distingue es
                 de dónde vienen.

     Transcritos a mano de los afiches oficiales de la AFFAP. Las lecturas
     dudosas están anotadas en DUDAS_DE_TRANSCRIPCION, al final de esta
     sección.
     ============================================================ */

  /* --- Día 28: Danzas Autóctonas — rol oficial ---
     El afiche salta del N° 7 al N° 8 en el Grupo 1 y también salta la
     franja de las 10:00. Las dos ausencias coinciden, así que se respeta
     tal cual está impreso en lugar de renumerar. */
  const AUTOCTONAS = [
    [ 1, '08:30', 'Comitiva', null, 1],
    [ 2, '08:40', 'Potolos Manuel Belgrano', null, 1],
    [ 3, '08:50', 'Tinkuy Los Huaynas Corazón de Jesús', null, 1],
    [ 4, '09:00', 'Tarqueada Simón Bolívar', null, 1],
    [ 5, '09:10', 'Potolos Kenny Prieto', null, 1],
    [ 6, '09:20', 'Mineritos Manuel Ascencio Padilla', null, 1],
    [ 7, '09:30', 'Calcheños Luis Felipe Manzano', null, 1],
    [ 8, '09:40', 'Tarqueada Macedonio Nogales', null, 1],
    [ 9, '09:50', 'Potolos Jadi', null, 1],
    [10, '10:10', 'Potosimanta 27 de Mayo', null, 1],

    [11, '10:20', 'Pastorcitos Antonio José de Sucre B', null, 2],
    [12, '10:30', 'Jalk\'as Tomás Frías', null, 2],
    [13, '10:40', 'Tinku Aniceto Arce', null, 2],
    [14, '10:55', 'Tupiceños Santa Rosa', null, 2],
    [15, '11:05', 'Tarqueada 21 de Enero', null, 2],
    [16, '11:15', 'Potolos Oscar Alfaro', null, 2],
    [17, '11:25', 'Pastorcitos 6 de Junio', null, 2],
    [18, '11:35', 'Tupiceños Manuel Basconez', null, 2],
    [19, '11:45', 'Jalk\'as Juan Pablo II', null, 2],
    [20, '11:55', 'Tinku Otto Felipe Braun', null, 2],

    [21, '12:05', 'Yureños Mariscal Sucre', null, 3],
    [22, '12:15', 'Calcheños L.N.A.D.I.', null, 3],
    [23, '12:25', 'Phutukum Enfermería', null, 3],
    [24, '12:35', 'Jalk\'as Mejillones "B"', null, 3],
    [25, '12:45', 'Potosimanta Esfm-Ea', null, 3],
    [26, '12:55', 'Tinkuy Kussy Ñawy Kennedy', null, 3],
    [27, '13:05', 'Chacarera Alma Libre', null, 3],
    [28, '13:15', 'Carnaval Tarijeño Fund. Cultural Andaluz Tarija', null, 3],
    [29, '13:25', 'Tupiceños Catec', null, 3],
    [30, '13:35', 'Mineritos Ingeniería Minera', null, 3],

    [31, '13:45', 'Warak\'aku Cantumarca', null, 4],
    [32, '13:55', 'Moseñada Monseñor Cleto Loayza', null, 4],
    [33, '14:05', 'Mineritos 1ro. de Abril', null, 4],
    [34, '14:20', 'Chacarera Flor de Quebracho', null, 4],
    [35, '14:30', 'Wititis Inbaljap', null, 4],
    [36, '14:40', 'Tarqueada Agronomía', null, 4],
    [37, '14:50', 'Mi Chura Tarija', null, 4],
    [38, '15:00', 'Calcheños Contabilidad y Finanzas', null, 4],
    [39, '15:10', 'Centro Cultural Quebradeños Carnaval Chicheño', null, 4],
    [40, '15:20', 'Wititis Centro Cultural Tolckas Villa Santiago', null, 4],

    [41, '15:30', 'Calcheños Pichincha', null, 5],
    [42, '15:40', 'Burru Khatis Topografía', null, 5],
    [43, '15:50', 'Tarqueada Ing. Desarrollo Rural', null, 5],
    [44, '16:00', 'Mineritos Jodis Zona San Cristóbal', null, 5],
    [45, '16:10', 'Juventud Potolos Villazón', null, 5],
    [46, '16:20', 'Tinkuy Ñawpa Tolck\'as Huachacalla', null, 5],
    [47, '16:30', 'Gran Tarqueada de Ingenieros - Agrónomos', null, 5],
    [48, '16:40', 'Chacarera Pasión Chaqueña', null, 5],
    [49, '16:50', 'Residentes Tupiceños Carnaval Chicheño', null, 5],
    [50, '17:00', 'Wititis Ingeniería Mecánica', null, 5],

    [51, '17:10', 'Mineritos Sinchi Wayra', null, 6],
    [52, '17:20', 'Cultural Tinkuy "Los Tolckas" Zona Huachacalla', null, 6],
    [53, '18:05', 'Flor de Girasoles Filial Potosí - Teodora Flores', null, 6],
    [54, '18:15', 'Wititis Supay Marka', null, 6],
    [55, '18:25', 'Tinkuy Autóctono Huachacalla', null, 6],
    [56, '18:40', 'Mineritos F.U.L. - U.A.T.F.', null, 6],
    [57, '18:55', 'Zapateada Centro Cult. Artística Nueva Gener. Boliviana F. Potosí', null, 6],
    [58, '19:05', 'Mineritos de la Cooperativa Minera Nueva Calamarca', null, 6],
    [59, '19:15', 'Pandilla de Ravelo Flor de Girasoles Potosí', null, 6],
    [60, '19:25', 'Fraternidad Zapateo Los Kachamosos', null, 6]
  ];

  /* --- Día 29: Danzas Folklóricas — rol oficial --- */
  const FOLKLORICAS = [
    [ 1, '08:00', 'Comitiva', null, 1],
    [ 2, '08:10', 'Diablada Cultural y Artística Diablos Rojos Ex Alumnos Pichincha', null, 1],
    [ 3, '08:20', 'Sambos Caporales', null, 1],
    [ 4, '08:30', 'Llamarada San Andrés', null, 1],
    [ 5, '08:40', 'Salay Cristo Maestro', null, 1],
    [ 6, '08:55', 'Llamarada Andina Gualberto Villarroel', null, 1],
    [ 7, '09:05', 'Yotaleños Ayda Mendoza de Alurralde', null, 1],
    [ 8, '09:15', 'Negritos Odontología', null, 1],
    [ 9, '09:30', 'Morenada Sedcam', null, 1],
    [10, '09:45', 'Diablada Mcal. Andrés de Santa Cruz', null, 1],
    [11, '09:55', 'Antawaras Pacífico Sequeiros', null, 1],
    [12, '10:10', 'Suris Carlos Medinaceli', null, 1],
    [13, '10:25', 'Morenada Potosí', null, 1],

    [14, '10:40', 'Caporales Centralistas Socavón', null, 2],
    [15, '10:50', 'Llamarada Zona Norte', null, 2],
    [16, '11:00', 'Salay José David Berrios', null, 2],
    [17, '11:10', 'Diablada Artística Cultural Santa María', null, 2],
    [18, '11:20', 'Negritos Franciscanos', null, 2],
    [19, '11:35', 'Waca Wacas María Gutiérrez', null, 2],
    [20, '11:50', 'Morenada San Cristóbal', null, 2],
    [21, '12:05', 'Llamarada Antofagasta', null, 2],
    [22, '12:20', 'Pujllay 31 de Octubre', null, 2],
    [23, '12:30', 'Suris Bancario', null, 2],
    [24, '12:45', 'Pujllay S.E.P.S.A.', null, 2],
    [25, '13:00', 'Caporales Cervecería Nacional Potosí', null, 2],

    [26, '13:10', 'Llamarada María Auxiliadora', null, 3],
    [27, '13:20', 'Cullaguada San Martín', null, 3],
    [28, '13:30', 'Zambos Medicina', null, 3],
    [29, '13:45', 'Diablada Bamin', null, 3],
    [30, '14:00', 'Morenada Central Potosí', null, 3],
    [31, '14:15', 'Caporales Ingeniería Civil', null, 3],
    [32, '14:25', 'Saya Afro Boliviana Artes UATF', null, 3],
    [33, '14:25', 'Tobas Juan Manuel Calero', null, 3],
    [34, '14:50', 'Caporales Domingo Savio', null, 3],
    [35, '15:05', 'Morenada Auténtica Central Potosí', null, 3],
    [36, '15:20', 'Diablada Santa Lucía', null, 3],
    [37, '15:35', 'Salay Bolivia', null, 3],

    [38, '15:45', 'Caporales Fieras del Gran Potosí', null, 4],
    [39, '15:55', 'Cullaguada Maypes Trabajo Social', null, 4],
    [40, '16:05', 'Morenada 100% Intocables La Nueva Elegancia en Potosí', null, 4],
    [41, '16:20', 'Tobas Ingeniería Informática', null, 4],
    [42, '16:30', 'Pujllay Derecho', null, 4],
    [43, '16:40', 'Caporales San Simón', null, 4],
    [44, '16:50', '100% Salay Potosí', null, 4],
    [45, '17:00', 'Morenada Fanáticos', null, 4],
    [46, '17:15', 'Saya Afro Boliviana Mocafri', null, 4],
    [47, '17:25', 'Diablada LIED Tradicional', null, 4],
    [48, '17:35', 'Salay Tukuypaj', null, 4],
    [49, '17:45', 'Pujllay Economía', null, 4],

    [50, '17:55', 'Salay Cochabamba', null, 5],
    [51, '18:05', 'Negritos de la Torre', null, 5],
    [52, '18:15', 'Llamarada Agroindustrial', null, 5],
    [53, '18:25', 'Salay Expresión Boliviana', null, 5],
    [54, '18:35', 'Saya Afro Boliviana Ingeniería Ambiental', null, 5],
    [55, '18:45', 'Negritos Ingeniería de Sistemas', null, 5],
    [56, '19:00', 'Zapateo Pandilla Nueva Generación', null, 5]
  ];

  /* --- Día 30: Entrada Autóctona — rol oficial del domingo 30 ---
     Un solo bloque corrido de 47 ingresos, cada 10 minutos entre las
     10:00 y las 17:40. Sin grupos y sin comitiva: el afiche no los tiene.

     Acá el nombre solo no alcanza. "Sicuriada" aparece tres veces, "Jula
     Jula" tres veces y "Carnaval Blanco" tres veces: son fraternidades
     distintas de municipios distintos. Por eso la entidad va en su propio
     campo y se muestra debajo del nombre en la lista, en el buscador y en
     la pantalla del voluntario de punto de control — que es quien tiene
     que decidir en dos segundos cuál acaba de pasar. */
  const AUTOCTONAS_30 = [
    [ 1, '10:00', 'La Cacharpaya', 'Comunidad de San Antonio · Municipio de Yocalla', null],
    [ 2, '10:10', 'Pascananitan', 'Asamblea Legislativa Departamental de Potosí', null],
    [ 3, '10:20', 'Carnaval de Antaño', 'Secretaría Departamental de Turismo y Cultura', null],
    [ 4, '10:30', 'Cajanis', 'Municipio de Tahua', null],
    [ 5, '10:40', 'Sicuriada', 'Gobierno Autónomo Departamental de Potosí', null],
    [ 6, '10:50', 'Anatas', 'Municipio de Tahua', null],
    [ 7, '11:00', 'Erkenchada', 'Comunidad de Lampaya · Municipio de Villazón', null],
    [ 8, '11:10', 'Carnaval Carmeño', 'Comunidad de San Miguel · Municipio de Porco', null],
    [ 9, '11:20', 'Carnaval Blanco', 'Municipio de Tomave', null],
    [10, '11:30', 'Carnaval Chumpi', 'Municipio de Tomave', null],
    [11, '11:40', 'Carnaval Blanco', 'Carlos Machicado · Municipio de Tomave', null],
    [12, '11:50', 'Pali Pali', 'Comunidad Originaria de Cocani · Municipio de Colcha K', null],
    [13, '12:00', 'Karapayas', 'Comunidad de Tarapaya · Municipio de Potosí', null],
    [14, '12:10', 'Carnaval Cotagaiteño', 'Municipio de Cotagaita', null],
    [15, '12:20', 'Turuchipeños', 'Comunidad de Turuchipa · Municipio de Ckochas', null],
    [16, '12:30', 'Qhonqhota', 'SEDES', null],
    [17, '12:40', 'Tupiceños', 'Centro Cultural Quebradeños', null],
    [18, '12:50', 'Carnaval Aripalqueño', 'SEDEGES', null],
    [19, '13:00', 'Salaque', 'Municipio de Colquechaca', null],
    [20, '13:10', 'Sicuriada', 'Municipio de Atocha', null],
    [21, '13:20', 'Sampoñaris', 'Municipio de Vitichi', null],
    [22, '13:30', 'Fandango', 'SEDCOHI · Municipio de Ckochas', null],
    [23, '13:40', 'Carnaval Yureño', 'Gobierno Autónomo Indígena Originario Campesino del Jatun Ayllu Yura', null],
    [24, '13:50', 'Conjunto Carnaval Blanco', 'Comunidad de Villa Esperanza · Municipio de Uyuni', null],
    [25, '14:00', 'Anata Carnaval Lipeño', 'Municipio de Llica', null],
    [26, '14:10', 'Burro Qhati', 'Gobierno Autónomo Departamental de Potosí', null],
    [27, '14:20', 'Chililin', 'Municipio de Caiza "D"', null],
    [28, '14:30', 'El Matrimonio', 'Municipio de Llallagua', null],
    [29, '14:40', 'Sicuriada', 'Municipio de Llallagua', null],
    [30, '14:50', 'Jula Jula', 'Municipio de Pocoata', null],
    [31, '15:00', 'Los Viejos de Rodero', 'Municipio de Chaquí', null],
    [32, '15:10', 'Niño de la Virgen de Guadalupe', 'Col. Nal. Chaquí · Municipio de Chaquí', null],
    [33, '15:20', 'Fiesta de Aylantu', 'Comunidad de Yascapi · Municipio de Puna', null],
    [34, '15:30', 'Jula Jula', 'Comunidad de Cantumarca · Municipio de Potosí', null],
    [35, '15:40', 'Pandilla de Condes', 'Municipio de Tacobamba', null],
    [36, '15:50', 'Pascua / Caja Rueda', 'U.E. Alberto Maisano · Comunidad de Ñuqui · Municipio de Puna', null],
    [37, '16:00', 'Pinkillada', 'Municipio de Tinguipaya', null],
    [38, '16:10', 'Carnavalito', 'Municipio de Yocalla', null],
    [39, '16:20', 'Jaylliris', 'Comunidad de Suquicha · Municipio de Puna', null],
    [40, '16:30', 'Jula Jula', 'Comunidad de Puyuj Pata · Ayllu Kollana Inaire · Municipio de Tinguipaya', null],
    [41, '16:40', 'Carnaval Tingueño', 'Municipio de Tinguipaya', null],
    [42, '16:50', 'Carnaval Coromeño', 'Comunidad de Coroma · Municipio de Uyuni', null],
    [43, '17:00', 'Suri Sikus', 'Comunidad de Wila Qullu · Municipio de Potosí', null],
    [44, '17:10', 'Wititis', 'Centro Cultural Supay Marka', null],
    [45, '17:20', 'Saltarín', 'Ballet Cima de Plata', null],
    [46, '17:30', 'Tinkuy', 'Municipio de San Pedro de Macha', null],
    [47, '17:40', 'Tinkuy', 'Fraternidad Cultural Tinkuy Tolckas Huachacalla', null]
  ];

  /* ------------------------------------------------------------
     Lecturas dudosas del afiche

     Son nombres de organizaciones reales, así que en vez de elegir en
     silencio quedan anotados acá para cotejar contra el impreso. No los
     usa el código: existen para que la corrección sea un cambio de una
     línea y no una nueva transcripción.
     ------------------------------------------------------------ */
  const DUDAS_DE_TRANSCRIPCION = [
    'Día 28 · G1: el afiche salta el N° 7 y la franja de las 10:00.',
    'Día 28 · G5 N° 10 (Wititis Ingeniería Mecánica): la hora no se lee en el afiche. Cargada como 17:00 por la cadencia de 10 min del grupo.',
    'Día 28 · G4 N° 8: el afiche dice "Culcheños"; cargado como "Calcheños", que es como figura en el resto del rol.',
    'Día 28 · G6 N° 6: el afiche dice "F.U.L. LLL.A.T.F"; cargado como "F.U.L. - U.A.T.F.".',
    'Día 28 · G6 N° 10: "Kachamosos" o "Kachanosos" — el afiche no distingue la letra.',
    'Día 29: el afiche escribe "Llamarada"; la danza suele escribirse "Llamerada". Se respetó el afiche.',
    'Día 29 · G1 N° 6: "Yotalerios" en el afiche; cargado como "Yotaleños".',
    'Día 29 · G1 N° 10: "Antaveras" en el afiche; cargado como "Antawaras".',
    'Día 29 · G3: los N° 7 y 8 figuran los dos a las 14:25 en el afiche.',
    'Día 29 · G4 N° 2: "Maypes" o "Maypas".'
  ];

  /* ------------------------------------------------------------
     Modo de seguimiento

     Para Ch'utillos 2026 se decidió no usar portadores GPS: las 163
     fraternidades se cubren íntegramente con los puntos de control.

     Si el plan vuelve a cambiar, alcanza con poner GPS_HABILITADO en true
     dentro de config.js y listar acá los órdenes de ingreso que lleven
     portador. El resto del sistema ya lo soporta.
     ------------------------------------------------------------ */
  const CON_GPS_DIA_28 = [];
  const CON_GPS_DIA_29 = [];
  const CON_GPS_DIA_30 = [];

  const fraternidades = [];
  let n = 0;

  construir(AUTOCTONAS,    28, 'autoctona',  CON_GPS_DIA_28);
  construir(FOLKLORICAS,   29, 'folklorica', CON_GPS_DIA_29);
  construir(AUTOCTONAS_30, 30, 'autoctona',  CON_GPS_DIA_30);

  function construir(lista, dia, tipo, conGps) {
    const gpsActivo = window.CHUTILLOS_CONFIG.GPS_HABILITADO;
    lista.forEach(([orden, hora, nombre, entidad, grupo]) => {
      n++;
      const gps = gpsActivo && conGps.includes(orden);
      fraternidades.push({
        id: `fr-${String(n).padStart(3, '0')}`,
        nombre,
        entidad: entidad || null,
        grupo: grupo || null,
        tipo,
        dia,
        modo_tracking: gps ? 'gps' : 'checkpoint',
        orden_ingreso: orden,
        hora_estimada: hora,
        token_portador: gps
          ? `por-${String(n).padStart(3, '0')}-${claveCorta(n * 613 + 41)}`
          : null
      });
    });
  }

  /* ============================================================
     4. Simulación de actividad en vivo
     ------------------------------------------------------------
     Solo para poder probar la interfaz sin backend: coloca a cada
     fraternidad donde le tocaría estar según el rol y el reloj. Al pasar a
     Supabase, la capa de datos deja de llamar a estas funciones y no queda
     rastro de esto.
     ============================================================ */

  const CFG = window.CHUTILLOS_CONFIG;

  /* Va contra el reloj real, no contra un desfase fijo desde que cargó la
     página: a las 11 de la mañana se ve lo que pasa a las 11, y la vista
     sigue siendo correcta sola durante todo el día sin tocar nada.

     Y contra la hora de POTOSÍ, no la del dispositivo. A esta página la
     abren desde afuera —el rol está lleno de residentes y de gente que
     mira de otra ciudad— y con el reloj local un pariente en España vería
     el desfile seis horas adelantado, con todas llegando cuando en Potosí
     recién van por la mitad. Bolivia es UTC-4 todo el año, sin horario de
     verano. */
  const HORA_ARRANQUE = 8 * 60;        // origen comun de los tres dias
  const UTC_BOLIVIA = -4;

  /* Medianoche en Potosí del día que se le pida, como instante absoluto. */
  function medianocheEnPotosi(dia) {
    return Date.UTC(2026, 7, dia, -UTC_BOLIVIA, 0, 0);
  }

  /* Día del evento que se está corriendo. Antes del 28 se asume el 28;
     del 30 en adelante, el 30 — la madrugada del 31 sigue siendo la
     jornada del domingo, que termina pasada la medianoche. */
  const DIA_HOY = (() => {
    const b = new Date(Date.now() + UTC_BOLIVIA * 3600000);
    if (b.getUTCFullYear() === 2026 && b.getUTCMonth() === 7) {
      const d = b.getUTCDate();
      if (d < 28) return 28;
      if (d <= 30) return d;
    }
    return 30;
  })();

  /* El rol siempre sale con atraso. El domingo 30 la primera estaba
     programada 10:00 y salió cerca de las 10:40, así que se corre todo con
     ese atraso de arranque; encima se le suma el que se va acumulando a lo
     largo del día, que crece con el orden de ingreso.

     Si el desfile va más adelantado o más atrasado de lo que muestra el
     mapa, este es el número que hay que mover. */
  const ATRASO_ARRANQUE_MIN = 40;

  /* Minutos transcurridos desde las 08:00 de HOY, la jornada en curso.

     Se cuenta desde el arranque del día y no desde la medianoche a
     proposito: la última sale 18:48 y llega pasadas las 23:00, así que a
     la 01:00 el contador tiene que seguir creciendo en vez de volver a
     cero. Si no, a la madrugada el desfile entero se vería como que
     todavía no salió. */
  function minutoDeEvento() {
    const inicio = medianocheEnPotosi(DIA_HOY) + HORA_ARRANQUE * 60000;
    return (Date.now() - inicio) / 60000;
  }

  /* Fecha real que corresponde a un minuto del rol de un día dado.

     El día importa: un reporte del 28 tiene que caer el 28. Si se calculara
     todo sobre la fecha de hoy, el paso de una fraternidad del viernes por
     el último punto se leería como "dentro de tres horas". */
  function fechaDeMinutoEnDia(dia, m) {
    return new Date(medianocheEnPotosi(dia) + (HORA_ARRANQUE + m) * 60000);
  }

  function horaAMinutos(hhmm) {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + m;
  }

  /* Largo del recorrido en metros, y a qué velocidad se avanza.
     Todas van al mismo ritmo: en un desfile no se adelantan entre sí. Lo
     que las separa es a qué hora salió cada una y cuánto se atrasó. */
  const METROS_POR_MIN = CFG.VELOCIDAD_KMH * 1000 / 60;

  const LARGO_RUTA = (() => {
    const R = 6371000, rad = Math.PI / 180;
    let t = 0;
    for (let i = 1; i < RECORRIDO.length; i++) {
      const [la1, ln1] = RECORRIDO[i - 1], [la2, ln2] = RECORRIDO[i];
      const dLa = (la2 - la1) * rad, dLn = (ln2 - ln1) * rad;
      const a = Math.sin(dLa / 2) ** 2 +
                Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin(dLn / 2) ** 2;
      t += 2 * R * Math.asin(Math.sqrt(a));
    }
    return t;
  })();

  /* Minuto de evento en que sale cada una: la hora del rol más el atraso
     de arranque, más el que se va acumulando a lo largo del día, que crece
     con el orden de ingreso. */
  const salidaDe = new Map();
  fraternidades.forEach(f => {
    const programada = horaAMinutos(f.hora_estimada) - HORA_ARRANQUE;
    const retraso = ATRASO_ARRANQUE_MIN + f.orden_ingreso * 0.6 + (hash(f.id) % 7);
    salidaDe.set(f.id, programada + retraso);
  });

  /** Metros recorridos, o null si todavía no salió.

      Las que ya terminaron NO desaparecen: se quedan clavadas al final,
      que es lo que va a pasar de verdad — el voluntario del último punto
      las reportó y ese reporte queda como su última posición conocida
      para siempre. Si acá se devolviera null, una fraternidad que terminó
      se vería igual que una que todavía no salió, que es justo lo
      contrario. */
  function avanceEnMetros(f) {
    /* Un día que ya pasó está cerrado: todas llegaron a la Plaza San
       Bernardo. No se recalcula contra el reloj de hoy porque daría
       fraternidades del viernes caminando el domingo. */
    if (f.dia < DIA_HOY) return LARGO_RUTA;

    /* Y un día que todavía no llegó no tiene a nadie en la calle. */
    if (f.dia > DIA_HOY) return null;

    const enRuta = minutoDeEvento() - salidaDe.get(f.id);
    if (enRuta <= 0) return null;
    return Math.min(enRuta * METROS_POR_MIN, LARGO_RUTA);
  }

  function ultimasPosiciones() {
    const salida = [];

    fraternidades.forEach(f => {
      const metros = avanceEnMetros(f);
      if (metros === null) return;

      const p = metros / LARGO_RUTA;
      const chk = checkpointPasado(p);

      /* Salió pero todavía no llegó al primer punto: nadie la reportó aún,
         así que no aparece en el mapa. Es exactamente lo que va a pasar el
         día del evento. */
      if (!chk) return;

      /* El reporte lleva la hora en que la comparsa cruzó ESE punto, no la
         de ahora. Es lo que hace que "confirmada hace 25 min" sea un dato
         creíble y que la banda tenga de dónde avanzar. */
      const metrosDelChk = FRACCIONES_CHK[checkpoints.indexOf(chk)] * LARGO_RUTA;
      const minutoDelPaso = salidaDe.get(f.id) + metrosDelChk / METROS_POR_MIN;

      salida.push({
        fraternidad_id: f.id,
        origen: 'checkpoint',
        lat: chk.lat,
        lng: chk.lng,
        checkpoint_id: chk.id,
        checkpoint_nombre: chk.nombre,
        timestamp: fechaDeMinutoEnDia(f.dia, minutoDelPaso).toISOString()
      });
    });

    return salida;
  }

  /* ---- utilidades deterministas ---- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }
  function ruido(id, sal) {
    return ((hash(id + ':' + sal) % 1000) / 1000) - 0.5;
  }
  function claveCorta(semilla) {
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    let x = semilla;
    for (let i = 0; i < 6; i++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      out += abc[x % abc.length];
    }
    return out;
  }

  window.CHUTILLOS_MOCK = {
    RECORRIDO,
    CALLES,
    checkpoints,
    fraternidades,
    ultimasPosiciones,
    reportesEnMemoria: [],
    pingsEnMemoria: []
  };
})();
