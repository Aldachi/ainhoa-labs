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
     2. Checkpoints — PENDIENTES
     ------------------------------------------------------------
     Se reparten de forma pareja sobre el recorrido real, pero ni la
     ubicación ni el nombre son los definitivos. Nombres deliberadamente
     genéricos: la página pública los muestra como "Vista en …", así que
     un nombre inventado sería información falsa.

     Ubicarlos con /chutillos/admin/recorrido/, modo "Puntos de control".
     El cálculo de dotación sugiere 8 puntos (~500 m de separación).
     ============================================================ */
  const NOMBRES_CHECKPOINT = [
    'Punto de control 01', 'Punto de control 02', 'Punto de control 03',
    'Punto de control 04', 'Punto de control 05', 'Punto de control 06',
    'Punto de control 07', 'Punto de control 08'
  ];

  const checkpoints = NOMBRES_CHECKPOINT.map((nombre, i) => {
    const t = i / (NOMBRES_CHECKPOINT.length - 1);
    const idx = Math.min(RECORRIDO.length - 1, Math.round(t * (RECORRIDO.length - 1)));
    return {
      id: `chk-${String(i + 1).padStart(2, '0')}`,
      nombre,
      orden_en_recorrido: i + 1,
      lat: RECORRIDO[idx][0],
      lng: RECORRIDO[idx][1],
      token_voluntario: `vol-${String(i + 1).padStart(2, '0')}-${claveCorta(i * 977 + 13)}`
    };
  });

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
     Qué fraternidad lleva portador con GPS — DECISIÓN PENDIENTE

     Por ahora se marcan algunas repartidas a lo largo de la jornada, para
     que el mapa muestre puntos GPS en todo el recorrido y no solo al
     principio. La selección real la define el cliente según qué
     fraternidades convocan más público y cuáles consiguen portador.
     ------------------------------------------------------------ */
  const CON_GPS_DIA_28 = [1, 8, 15, 23, 31, 38, 46, 54];
  const CON_GPS_DIA_29 = [1, 9, 17, 25, 33, 41, 49];

  const fraternidades = [];
  let n = 0;

  construir(AUTOCTONAS,  28, 'autoctona',  CON_GPS_DIA_28);
  construir(FOLKLORICAS, 29, 'folklorica', CON_GPS_DIA_29);
  /* Día 30 (danzas ancestrales): sin rol publicado todavía. */

  function construir(lista, dia, tipo, conGps) {
    lista.forEach(([orden, hora, nombre]) => {
      n++;
      const gps = conGps.includes(orden);
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

  const T0 = Date.now();
  const estadoSim = new Map();

  fraternidades.forEach((f, i) => {
    estadoSim.set(f.id, {
      offset: ((i * 37) % 90) / 100,
      velocidad: 1 / ((40 + (i % 31)) * 60 * 1000),
      activa: (i % 8) !== 3
    });
  });

  function progreso(fratId) {
    const s = estadoSim.get(fratId);
    if (!s || !s.activa) return null;
    const p = s.offset + (Date.now() - T0) * s.velocidad;
    return p >= 1 ? null : p;
  }

  function puntoEnRecorrido(p) {
    const total = RECORRIDO.length - 1;
    const pos = p * total;
    const i = Math.min(total - 1, Math.floor(pos));
    const frac = pos - i;
    const [lat1, lng1] = RECORRIDO[i];
    const [lat2, lng2] = RECORRIDO[i + 1];
    return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
  }

  function ultimasPosiciones() {
    const salida = [];

    fraternidades.forEach(f => {
      const p = progreso(f.id);
      if (p === null) return;

      if (f.modo_tracking === 'gps') {
        const [lat, lng] = puntoEnRecorrido(p);
        salida.push({
          fraternidad_id: f.id,
          origen: 'gps',
          lat: +(lat + ruido(f.id, 1) * 0.00035).toFixed(6),
          lng: +(lng + ruido(f.id, 2) * 0.00035).toFixed(6),
          checkpoint_id: null,
          checkpoint_nombre: null,
          timestamp: new Date(Date.now() - (10000 + (hash(f.id) % 90000))).toISOString()
        });
      } else {
        const idx = Math.max(0, Math.min(
          checkpoints.length - 1,
          Math.floor(p * checkpoints.length)
        ));
        const chk = checkpoints[idx];
        salida.push({
          fraternidad_id: f.id,
          origen: 'checkpoint',
          lat: chk.lat,
          lng: chk.lng,
          checkpoint_id: chk.id,
          checkpoint_nombre: chk.nombre,
          timestamp: new Date(Date.now() - (60000 + (hash(f.id) % 1500000))).toISOString()
        });
      }
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
    checkpoints,
    fraternidades,
    ultimasPosiciones,
    reportesEnMemoria: [],
    pingsEnMemoria: []
  };
})();
