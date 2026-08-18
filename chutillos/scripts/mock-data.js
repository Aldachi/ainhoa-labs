/* ============================================
   CH'UTILLOS 2026 — Datos de ejemplo
   ============================================

   ⚠️  TODO ESTE ARCHIVO ES DE RELLENO. Nada aquí es información oficial.

   Los nombres de fraternidad son plausibles pero inventados; el orden de
   ingreso y los horarios no corresponden al Rol de Ingreso de la AFFAP; y
   el trazado del recorrido es un dibujo referencial sobre la zona baja de
   Potosí, no la ruta levantada con GPS.

   La forma de los objetos SÍ es la definitiva (sección 4 del documento de
   proyecto), de modo que reemplazar este archivo por los datos reales no
   obliga a tocar ninguna otra parte del código.
   ============================================ */

(() => {
  'use strict';

  /* ============================================================
     1. Recorrido — REAL
     ------------------------------------------------------------
     Trazado levantado por el cliente sobre el mapa con el editor de
     /chutillos/admin/recorrido/. 18 puntos, 3.51 km.
     Esto ya NO es dato de relleno.
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
     2. Checkpoints — PLACEHOLDER
     ------------------------------------------------------------
     Se reparten de forma pareja sobre el recorrido real, pero ni su
     ubicación ni su nombre son los definitivos.

     Los nombres son deliberadamente genéricos. Antes decían cosas como
     "Mercado Uyuni" o "Av. Antofagasta", que sonaban autoritativas siendo
     inventadas: ahora que caen sobre coordenadas del recorrido verdadero,
     un nombre falso es peor que uno obviamente provisional. La página
     pública los muestra como "Vista en …", así que tienen que ser
     reemplazados por referencias reales antes del evento — con el editor
     de /chutillos/admin/recorrido/, modo "Puntos de control".
     ============================================================ */
  const NOMBRES_CHECKPOINT = [
    'Punto de control 01',
    'Punto de control 02',
    'Punto de control 03',
    'Punto de control 04',
    'Punto de control 05',
    'Punto de control 06',
    'Punto de control 07',
    'Punto de control 08',
    'Punto de control 09',
    'Punto de control 10'
  ];

  const checkpoints = NOMBRES_CHECKPOINT.map((nombre, i) => {
    /* Se reparten a lo largo del recorrido de forma pareja */
    const t = i / (NOMBRES_CHECKPOINT.length - 1);
    const idx = Math.min(
      RECORRIDO.length - 1,
      Math.round(t * (RECORRIDO.length - 1))
    );
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
     3. Fraternidades — PLACEHOLDER (115, la cifra que reporta AFFAP)
     ============================================================ */
  const DANZAS_AUTOCTONAS = [
    'Tinku', 'Pujllay', 'Jula Jula', 'Sicuris', 'Ayarichi', 'Wayñu',
    'Chatre', 'Potolo', 'Kallawaya', 'Chunchu', 'Mimula', 'Zampoñada'
  ];

  const DANZAS_FOLKLORICAS = [
    'Morenada', 'Diablada', 'Caporales', 'Tinkus', 'Salay', 'Kullawada',
    'Llamerada', 'Waca Waca', 'Doctorcitos', 'Antawara', 'Tobas',
    'Suri Sicuri', 'Negritos', 'Pot–Pourri', 'Cueca Potosina'
  ];

  const SUFIJOS = [
    'Central Potosí', 'Villa Imperial', 'Cerro Rico', 'San Bartolomé',
    'Unión Juvenil', 'Juventud Potosina', 'Los Andes', 'Universitaria',
    'Magisterio Rural', 'Bloque Ferroviario', 'Asociación Comercial',
    'Nueva Generación', 'Corazón de Jesús', 'Virgen del Socavón',
    'Fraternidad Minera', 'Barrio San Pedro', 'Sindicato Fabril',
    'Renacer Andino', 'Tradición Charcas', 'Herencia Colonial'
  ];

  const fraternidades = [];
  let contador = 0;

  /* Día 28 — Entrada Autóctona (38) */
  contador = construirDia({
    dia: 28,
    tipo: 'autoctona',
    cantidad: 38,
    danzas: DANZAS_AUTOCTONAS,
    horaInicio: 9,
    conGps: 4,
    desde: contador
  });

  /* Día 29 — Entrada Folklórica (52, la jornada más grande) */
  contador = construirDia({
    dia: 29,
    tipo: 'folklorica',
    cantidad: 52,
    danzas: DANZAS_FOLKLORICAS,
    horaInicio: 8,
    conGps: 8,
    desde: contador
  });

  /* Día 30 — Danzas ancestrales (25) */
  contador = construirDia({
    dia: 30,
    tipo: 'autoctona',
    cantidad: 25,
    danzas: DANZAS_AUTOCTONAS,
    horaInicio: 10,
    conGps: 3,
    desde: contador
  });

  function construirDia({ dia, tipo, cantidad, danzas, horaInicio, conGps, desde }) {
    for (let i = 0; i < cantidad; i++) {
      const n = desde + i;
      const danza = danzas[n % danzas.length];
      const sufijo = SUFIJOS[(n * 7) % SUFIJOS.length];

      /* Las primeras `conGps` de cada día llevan portador con GPS */
      const modo = i < conGps ? 'gps' : 'checkpoint';

      /* Salidas escalonadas cada ~9 minutos desde horaInicio */
      const minutosTotales = horaInicio * 60 + i * 9;
      const hh = Math.floor(minutosTotales / 60);
      const mm = minutosTotales % 60;

      fraternidades.push({
        id: `fr-${String(n + 1).padStart(3, '0')}`,
        nombre: `${danza} ${sufijo}`,
        tipo,
        dia,
        modo_tracking: modo,
        orden_ingreso: i + 1,
        hora_estimada: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
        token_portador: modo === 'gps'
          ? `por-${String(n + 1).padStart(3, '0')}-${claveCorta(n * 613 + 41)}`
          : null
      });
    }
    return desde + cantidad;
  }

  /* ============================================================
     4. Simulación de actividad en vivo
     ------------------------------------------------------------
     Para que la interfaz se pueda probar de verdad (polling, frescura del
     dato, movimiento en el mapa), las fraternidades avanzan por el
     recorrido en función del tiempo transcurrido desde que cargó la
     página. Nada de esto sobrevive al cambio a datos reales: la capa de
     datos simplemente deja de llamar a estas funciones.
     ============================================================ */

  const T0 = Date.now();

  /* Cada fraternidad arranca en un punto distinto y avanza a su ritmo */
  const estadoSim = new Map();
  fraternidades.forEach((f, i) => {
    estadoSim.set(f.id, {
      /* progreso inicial 0..0.9 repartido por orden de ingreso */
      offset: ((i * 37) % 90) / 100,
      /* velocidad: una vuelta completa entre 40 y 70 minutos */
      velocidad: 1 / ((40 + (i % 31)) * 60 * 1000),
      /* ~12% aún no salen, para probar el estado "sin reportes" */
      activa: (i % 8) !== 3
    });
  });

  function progreso(fratId) {
    const s = estadoSim.get(fratId);
    if (!s || !s.activa) return null;
    const p = s.offset + (Date.now() - T0) * s.velocidad;
    return p >= 1 ? null : p; /* ya terminó el recorrido */
  }

  /* Interpola una coordenada sobre la polilínea del recorrido */
  function puntoEnRecorrido(p) {
    const total = RECORRIDO.length - 1;
    const pos = p * total;
    const i = Math.min(total - 1, Math.floor(pos));
    const frac = pos - i;
    const [lat1, lng1] = RECORRIDO[i];
    const [lat2, lng2] = RECORRIDO[i + 1];
    return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
  }

  /* Última posición conocida, con la misma forma que devuelve la vista
     `vista_ultima_posicion` de Postgres. */
  function ultimasPosiciones() {
    const salida = [];

    fraternidades.forEach(f => {
      const p = progreso(f.id);
      if (p === null) return; /* sin reportes todavía, o ya terminó */

      if (f.modo_tracking === 'gps') {
        const [lat, lng] = puntoEnRecorrido(p);
        /* ping reciente, con algo de jitter */
        const antiguedad = 10000 + (hash(f.id) % 90000);
        salida.push({
          fraternidad_id: f.id,
          origen: 'gps',
          lat: +(lat + ruido(f.id, 1) * 0.00035).toFixed(6),
          lng: +(lng + ruido(f.id, 2) * 0.00035).toFixed(6),
          checkpoint_id: null,
          checkpoint_nombre: null,
          timestamp: new Date(Date.now() - antiguedad).toISOString()
        });
      } else {
        /* El checkpoint más reciente que ya dejó atrás */
        const idx = Math.max(0, Math.min(
          checkpoints.length - 1,
          Math.floor(p * checkpoints.length)
        ));
        const chk = checkpoints[idx];
        /* Los reportes manuales son intrínsecamente más viejos */
        const antiguedad = 60000 + (hash(f.id) % 1500000);
        salida.push({
          fraternidad_id: f.id,
          origen: 'checkpoint',
          lat: chk.lat,
          lng: chk.lng,
          checkpoint_id: chk.id,
          checkpoint_nombre: chk.nombre,
          timestamp: new Date(Date.now() - antiguedad).toISOString()
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
    /* memoria de escrituras hechas durante la sesión (no persiste) */
    reportesEnMemoria: [],
    pingsEnMemoria: []
  };
})();
