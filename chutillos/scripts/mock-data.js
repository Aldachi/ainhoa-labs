/* ============================================
   CH'UTILLOS 2026 — Datos del evento
   ============================================

   Qué es real y qué no, a agosto de 2026:

   ✅ RECORRIDO      — trazado levantado sobre el mapa por el cliente.
   ✅ FRATERNIDADES  — los 115 nombres del Rol de Ingreso oficial de la
                       AFFAP. Transcritos de los afiches de la Pre-Entrada
                       (22 y 23 de agosto).
   ⚠️  ORDEN Y HORAS  — son los de la PRE-ENTRADA, no los de las entradas
                       del 28-29-30. Sirven como referencia de estructura,
                       pero hay que reemplazarlos cuando la AFFAP publique
                       el rol definitivo. Mientras CFG.ROL_OFICIAL sea
                       false, la página pública no muestra los horarios.
   ❌ CHECKPOINTS    — ubicación y nombres todavía sin definir.
   ❌ MODO_TRACKING  — qué fraternidad lleva GPS es decisión del cliente.

   El día 30 (danzas ancestrales) no tiene rol publicado todavía, así que
   queda vacío a propósito.
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

     Los límites se pueden escribir de dos formas:
       · un número      → metros desde la salida
       · 'chk-0N'       → la altura exacta de ese punto de control

     La segunda es la buena cuando se conoce: es como se piensa el
     recorrido en la calle ("Tinkuy va del Punto 2 al Punto 4") y sigue
     siendo correcta aunque después se muevan los puntos.

     ⚠️ SOLO UN TRAMO ESTÁ CONFIRMADO.

     Avenida Tinkuy (Punto 2 → Punto 4) la confirmó el cliente. Los otros
     ocho son mi mejor reparto sobre los giros del trazado, siguiendo el
     orden en que fueron listados — y ese reparto ya se demostró
     equivocado una vez: yo tenía Tinkuy entre los metros 953 y 1233,
     cuando en realidad abarca de 503 a 1741.

     Poner una calle equivocada en la ficha es peor que no poner ninguna,
     porque alguien sale a buscar a su fraternidad a la avenida que no es.
     Confirmar cada tramo con la misma fórmula: "tal avenida va del Punto N
     al Punto M".
     ============================================================ */
  const CALLES = [
    /* --- Antes del Punto 2 --- */
    { desde: 0,        hasta: 200,      nombre: 'Arco Mejillones',       porConfirmar: true },
    { desde: 200,      hasta: 380,      nombre: 'Calle Mejillones',      porConfirmar: true },
    { desde: 380,      hasta: 'chk-02', nombre: 'Calle H. Vásquez',      porConfirmar: true },

    /* --- Confirmado por el cliente --- */
    { desde: 'chk-02', hasta: 'chk-04', nombre: 'Avenida Tinkuy' },

    /* --- Después del Punto 4 --- */
    { desde: 'chk-04', hasta: 2309,     nombre: 'Avenida Universitaria', porConfirmar: true },
    { desde: 2309,     hasta: 2791,     nombre: 'Avenida Sevilla',       porConfirmar: true },
    { desde: 2791,     hasta: 3200,     nombre: 'Avenida Litoral',       porConfirmar: true },
    { desde: 3200,     hasta: 'chk-07', nombre: 'Avenida Cívica',        porConfirmar: true },

    /* Última: llegar acá es haber terminado el recorrido. */
    { desde: 'chk-07', hasta: 99999,    nombre: 'Plaza San Bernardo', esFinal: true }
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

     ⚠️ Los NOMBRES siguen siendo provisionales. La página pública los
     muestra como "Vista en …", así que conviene reemplazar "Punto 1" por
     una referencia que la gente reconozca parada en la calle.
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
     3. Fraternidades — NOMBRES REALES
     ------------------------------------------------------------
     Formato: [orden, hora, nombre]

     Transcritos a mano de los afiches de la AFFAP. Conviene una lectura
     de control contra el original antes del evento: son nombres de
     organizaciones reales y un error tipográfico se ve mal.
     ============================================================ */

  /* --- Día 28: Entrada Autóctona (del rol del 22 de agosto) --- */
  const AUTOCTONAS = [
    [ 1, '08:10', 'Potosinos Kenny Prieto'],
    [ 2, '08:20', 'Mineritos Manuel Ascencio Padilla'],
    [ 3, '08:30', 'Pastorcitos 6 de Junio'],
    [ 4, '08:40', 'Calcheños Luis Felipe Manzano'],
    [ 5, '08:50', 'Tarqueada Macedonio Nogales'],
    [ 6, '09:00', 'Wititis San José'],
    [ 7, '09:10', 'Potosinos Jadi'],
    [ 8, '09:20', 'Potosimanta 27 de Mayo'],
    [ 9, '09:30', 'Pastorcitos Antonio José de Sucre B'],
    [10, '09:40', 'Tarqueada Simón Bolívar'],
    [11, '09:50', 'Jaik\'as Tomás Frías'],
    [12, '10:00', 'Tinku Aniceto Arce'],

    [13, '10:15', 'Tupiceñas Santa Rosa'],
    [14, '10:30', 'Tarqueada 21 de Enero'],
    [15, '11:00', 'Potosios Oscar Alfaro'],
    [16, '10:40', 'Moseñada Monseñor Cleto Loayza'],
    [17, '10:50', 'Tupiceños Manuel Basconez'],
    [18, '11:10', 'Jaik\'as Juan Pablo II'],
    [19, '11:20', 'Tinku Otto Felipe Braun'],
    [20, '11:35', 'Yureñas Mariscal Sucre'],
    [21, '11:50', 'Calcheños I.N.A.D.I.'],
    [22, '12:00', 'Phutukum Enfermería'],
    [23, '12:10', 'Mineritos Ingeniería Minera'],

    [24, '12:20', 'Jaik\'as Mejillones "B"'],
    [25, '12:30', 'Potosimanta Esfm-Ea'],
    [26, '12:45', 'Tinkuy Kussy Ñawy Kennedy'],
    [27, '12:55', 'Chacarera Alma Libre'],
    [28, '13:05', 'Carnaval Tarijeño Fund. Cultural Andaluz Tarija'],
    [29, '13:15', 'Tupiceños Cetec'],
    [30, '13:25', 'Warak\'aku Cantumarca'],
    [31, '13:35', 'Mineritos 1ro. de Abril'],

    [32, '13:50', 'Tinkuy Los Huaynas Corazón de Jesús'],
    [33, '14:05', 'Potosios Manuel Belgrano'],
    [34, '14:15', 'Chacarera Flor de Quebracho'],
    [35, '14:30', 'Wititis Inbojlap'],
    [36, '14:45', 'Tarqueada Agronomía'],
    [37, '14:55', 'Mi Chura Tarija'],
    [38, '15:05', 'Mineritos Sinchi Wayra'],
    [39, '15:20', 'Calcheños Contabilidad y Finanzas'],
    [40, '15:25', 'Centro Cultural Quebradeños Carnaval Chicheño'],
    [41, '15:40', 'Wititis Centro Cultural Tolckas Villa Santiago'],

    [42, '15:50', 'Mineritos Jodis Zona San Cristóbal'],
    [43, '16:00', 'Calcheños Pichincha'],
    [44, '16:15', 'Burru Khatis Topografía'],
    [45, '16:25', 'Tarqueada Ing. Desarrollo Rural'],
    [46, '16:35', 'Juventud Potosinos Villazón'],
    [47, '16:45', 'Tinkuy Ñawpa Tolck\'as Huachacalla'],
    [48, '17:00', 'Gran Tarqueada de Ingenieros y Agrónomos'],
    [49, '17:10', 'Chacarera Pasión Chaqueña'],
    [50, '17:25', 'Residentes Tupiceños Carnaval Chicheño'],
    [51, '17:40', 'Wititis Ingeniería Mecánica'],
    [52, '17:50', 'Cultural Tinkuy "Los Tolckas" Zona Huachacalla'],

    [53, '18:05', 'Flor de Girasoles Filial Potosí - Teodora Flores'],
    [54, '18:15', 'Wititis Supay Marka'],
    [55, '18:25', 'Tinkuy Autóctonos Huachacalla'],
    [56, '18:40', 'Mineritos F.U.L. - U.A.T.F.'],
    [57, '18:55', 'Zapateada Centro Cult. Artística Nueva Gener. Boliviana F. Potosí'],
    [58, '19:05', 'Mineritos de la Cooperativa Minera Nueva Calamarca'],
    [59, '19:15', 'Pandilla de Ravelo Flor de Girasoles Potosí'],
    [60, '19:25', 'Fraternidad Zapateo Los Kachamosos']
  ];

  /* --- Día 29: Entrada Folklórica (del rol del 23 de agosto) --- */
  const FOLKLORICAS = [
    [ 1, '08:10', 'Llamerada San Andrés'],
    [ 2, '08:20', 'Salay Cristo Maestro'],
    [ 3, '08:30', 'Negritos de la Torre'],
    [ 4, '08:45', 'Llamerada Andina Gualberto Villarroel'],
    [ 5, '08:55', 'Yotaleños Ayda Mendoza de Alurralde'],
    [ 6, '09:05', 'Negritos Odontología'],
    [ 7, '09:15', 'Morenada Sedcam'],
    [ 8, '09:30', 'Diablada Mcal. Andrés de Santa Cruz'],
    [ 9, '09:45', 'Antawaras Pacífico Sequeiros'],
    [10, '09:55', 'Suris Carlos Medinaceli'],
    [11, '10:10', 'Morenada Potosí'],
    [12, '10:25', 'Caporales Centralistas Socavón'],

    [13, '10:35', 'Llamerada Zona Norte'],
    [14, '10:45', 'Salay José David Berrios'],
    [15, '10:55', 'Diablada Artística Cultural Santa María'],
    [16, '11:10', 'Negritos Franciscano'],
    [17, '11:25', 'Waca Wacas María Gutiérrez'],
    [18, '11:40', 'Morenada San Cristóbal'],
    [19, '11:55', 'Llamerada Antofagasta'],
    [20, '12:05', 'Pujllay 31 de Octubre'],
    [21, '12:20', 'Suris Bancario'],
    [22, '12:30', 'Pujllay S.E.P.S.A.'],
    [23, '12:45', 'Caporales Cervecería Nacional Potosí'],

    [24, '13:00', 'Llamerada María Auxiliadora'],
    [25, '13:10', 'Cullaguada San Martín'],
    [26, '13:20', 'Zambos Medicina'],
    [27, '13:30', 'Diablada Bamin'],
    [28, '13:45', 'Morenada Central Potosí'],
    [29, '14:00', 'Caporales Ingeniería Civil'],
    [30, '14:15', 'Saya Afro Boliviana Artes Uatf'],
    [31, '14:25', 'Tobas Juan Manuel Calero'],
    [32, '14:40', 'Caporales Domingo Savio'],
    [33, '14:55', 'Morenada Auténtica Central Potosí'],
    [34, '15:10', 'Diablada Santa Lucía'],
    [35, '15:25', 'Salay Bolivia'],
    [36, '15:35', 'Caporales Fieras del Gran Potosí'],

    [37, '15:45', 'Cullaguada Maypas Trabajo Social'],
    [38, '15:55', 'Morenada 100% Intocables La Nueva Elegancia en Potosí'],
    [39, '16:10', 'Tobas Ingeniería Informática'],
    [40, '16:20', 'Pujllay Derecho'],
    [41, '16:35', 'Caporales San Simón'],
    [42, '16:45', 'Diablada LED Tradicional'],
    [43, '16:55', 'Morenada Fanáticos'],
    [44, '17:10', 'Saya Afro Boliviana Mocafri'],
    [45, '17:20', '100% Salay Potosí'],
    [46, '17:30', 'Diablada Cultural y Artística Diablos Rojos Ex Alumnos Pichincha'],
    [47, '17:40', 'Sallay Tukuypaj'],
    [48, '17:50', 'Pujllay Economía'],

    [49, '18:05', 'Salay Cochabamba'],
    [50, '18:15', 'Llamerada Agro Industrial'],
    [51, '18:25', 'Salay Expresión Boliviana'],
    [52, '18:35', 'Saya Afro Boliviana Ingeniería Ambiental'],
    [53, '18:45', 'Negritos Ingeniería de Sistemas'],
    [54, '18:55', 'Zambos Caporales'],
    [55, '19:05', 'Zapatero Pandilla Nueva Generación']
  ];

  /* ------------------------------------------------------------
     Modo de seguimiento

     Para Ch'utillos 2026 se decidió no usar portadores GPS: las 115
     fraternidades se cubren íntegramente con los puntos de control.

     Si el plan vuelve a cambiar, alcanza con poner GPS_HABILITADO en true
     dentro de config.js y listar acá los órdenes de ingreso que lleven
     portador. El resto del sistema ya lo soporta.
     ------------------------------------------------------------ */
  const CON_GPS_DIA_28 = [];
  const CON_GPS_DIA_29 = [];

  const fraternidades = [];
  let n = 0;

  construir(AUTOCTONAS,  28, 'autoctona',  CON_GPS_DIA_28);
  construir(FOLKLORICAS, 29, 'folklorica', CON_GPS_DIA_29);
  /* Día 30 (danzas ancestrales): sin rol publicado todavía. */

  function construir(lista, dia, tipo, conGps) {
    const gpsActivo = window.CHUTILLOS_CONFIG.GPS_HABILITADO;
    lista.forEach(([orden, hora, nombre]) => {
      n++;
      const gps = gpsActivo && conGps.includes(orden);
      fraternidades.push({
        id: `fr-${String(n).padStart(3, '0')}`,
        nombre,
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
     Solo para poder probar la interfaz sin backend: mueve a las
     fraternidades por el recorrido según el tiempo transcurrido desde que
     cargó la página. Al pasar a Supabase, la capa de datos deja de llamar
     a estas funciones y no queda rastro de esto.
     ============================================================ */

  const CFG = window.CHUTILLOS_CONFIG;
  const T0 = Date.now();

  /* Reloj virtual: la vista arranca con el evento ya empezado, para no
     tener que esperar horas a que haya algo en el mapa. Desde ahí el
     tiempo corre normal. */
  const MINUTO_INICIAL = 265;          // ~12:25 de la jornada
  const HORA_ARRANQUE = 8 * 60;        // la primera sale 08:10

  function minutoDeEvento() {
    return MINUTO_INICIAL + (Date.now() - T0) / 60000;
  }

  /* Fecha real que corresponde a un minuto del evento, para que los
     "hace 20 min" de la interfaz den valores creíbles. */
  function fechaDeMinuto(m) {
    return new Date(Date.now() - (minutoDeEvento() - m) * 60000);
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

  /* Minuto de evento en que sale cada una. El rol se va atrasando a lo
     largo del día —algo que pasa siempre— así que se suma un retraso que
     crece con el orden de ingreso. */
  const salidaDe = new Map();
  fraternidades.forEach(f => {
    const programada = horaAMinutos(f.hora_estimada) - HORA_ARRANQUE;
    const retraso = f.orden_ingreso * 0.6 + (hash(f.id) % 7);
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
        timestamp: fechaDeMinuto(minutoDelPaso).toISOString()
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
