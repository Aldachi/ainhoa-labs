/* ============================================
   CH'UTILLOS 2026 — Configuración
   ============================================

   Único archivo que hay que tocar para pasar de datos mock a Supabase real.
   Ver supabase/README.md para el procedimiento completo.
   ============================================ */

(() => {
  'use strict';

  const params = new URLSearchParams(location.search);

  const CONFIG = {
    /* ---- Fuente de datos -------------------------------------------------
       USAR_MOCK: true  → datos de ejemplo en memoria, sin backend.
       USAR_MOCK: false → Supabase. Requiere URL y ANON_KEY abajo.

       Se puede forzar por URL para pruebas: ?mock=1 o ?mock=0
    --------------------------------------------------------------------- */
    USAR_MOCK: true,

    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',

    /* Endpoint del Worker de Cloudflare que hace las escrituras de admin.
       Las escrituras públicas (pings GPS y reportes de checkpoint) van
       directo a Supabase con la anon key, restringidas por RLS. */
    ADMIN_API: '/api/admin',

    /* ---- Ritmo de lectura de la página pública ---------------------------
       Polling adaptativo: se consulta cada POLL_MS con la pestaña visible y
       se espacia cuando está oculta. Elegido sobre websockets porque escala
       a miles de lectores simultáneos y una petición perdida se recupera
       sola en el siguiente ciclo.
    --------------------------------------------------------------------- */
    POLL_MS: 15000,
    POLL_MS_OCULTO: 60000,

    /* ---- Portador GPS ----------------------------------------------------
       Se toma una posición puntual cada GPS_INTERVALO_MS en lugar de dejar
       watchPosition corriendo: permite que el chip GPS duerma entre lecturas
       y reduce mucho el consumo de batería durante varias horas de desfile.
       Si el desplazamiento es menor a GPS_MOV_MINIMO_M no se envía nada.
    --------------------------------------------------------------------- */
    GPS_INTERVALO_MS: 25000,
    GPS_MOV_MINIMO_M: 15,
    GPS_TIMEOUT_MS: 20000,

    /* ---- Cola offline ---------------------------------------------------- */
    COLA_REINTENTO_BASE_MS: 3000,
    COLA_REINTENTO_MAX_MS: 60000,
    COLA_MAX_INTENTOS: 100,

    /* ---- Portadores GPS ---------------------------------------------------
       En false no se genera ningún token de portador, el panel admin
       oculta esa sección y la página de portador avisa que no está en uso.

       Para Ch'utillos 2026 se decidió cubrir todo con checkpoints, así que
       queda apagado. El código del portador se conserva funcionando: si
       más adelante se suman portadores, alcanza con volver a ponerlo en
       true y marcar las fraternidades como modo_tracking 'gps'.
    --------------------------------------------------------------------- */
    GPS_HABILITADO: false,

    /* ---- Velocidad del desfile -------------------------------------------
       Derivada del comportamiento real del evento: las salidas van de
       08:00 a 19:25 y la última fraternidad termina entre las 23:00 y la
       madrugada. Eso da entre 3.6 y 5.6 horas para 3.5 km.

         termina 23:00  →  0.98 km/h
         termina 00:00  →  0.76 km/h
         termina 01:00  →  0.63 km/h

       Es lento porque no es una caminata: se baila, se para a descansar y
       la banda marca el paso. TIPICA se usa para estimar la posición;
       MIN y MAX definen el ancho de la banda de incertidumbre que se
       dibuja en el mapa.

       Vale la pena revisar estos tres números después del primer día con
       datos reales: son lo que más afecta la exactitud del mapa.
    --------------------------------------------------------------------- */
    VELOCIDAD_KMH: 0.80,
    VELOCIDAD_MIN_KMH: 0.55,
    VELOCIDAD_MAX_KMH: 1.30,

    /* Largo mínimo de la banda en el mapa, en metros. Una fraternidad con
       sus danzantes y su banda ocupa fácil 150 m de calle, así que aunque
       la incertidumbre sea chica se dibuja con cuerpo, no como un punto. */
    LARGO_MINIMO_M: 140,

    /* ---- Evento ---------------------------------------------------------- */
    DIAS: [
      { dia: 28, etiqueta: 'VIE 28', nombre: 'Entrada Autóctona' },
      { dia: 29, etiqueta: 'SÁB 29', nombre: 'Entrada Folklórica' },
      { dia: 30, etiqueta: 'DOM 30', nombre: 'Danzas Ancestrales' }
    ],

    /* Centro y zoom inicial del mapa (Potosí, zona baja) */
    MAPA_CENTRO: [-19.5892, -65.7580],
    MAPA_ZOOM: 14,

    /* El trazado cargado en mock-data.js es el real, levantado sobre el
       mapa por el cliente, así que el aviso de "trazado referencial" ya no
       corresponde.

       Ojo: esto habla solo del recorrido. Los checkpoints siguen sin
       ubicar. */
    RECORRIDO_OFICIAL: true,

    /* Los nombres de las 115 fraternidades son los del Rol de Ingreso
       oficial, pero el orden y los horarios cargados son los de la
       Pre-Entrada (22 y 23 de agosto), no los de las entradas del 28-30.

       Mientras esto sea false, la página pública NO muestra el horario de
       salida: publicar una hora sin confirmar es peor que no publicar
       ninguna, porque la gente organiza su día con eso. Poner en true
       recién cuando esté cargado el rol definitivo de la AFFAP. */
    ROL_OFICIAL: false
  };

  /* Override por querystring, solo para pruebas */
  if (params.has('mock')) {
    CONFIG.USAR_MOCK = params.get('mock') !== '0';
  }

  /* Si no hay credenciales cargadas, no se puede usar Supabase aunque
     USAR_MOCK sea false. Se avisa en consola y se cae a mock para que la
     página nunca quede en blanco durante el evento. */
  if (!CONFIG.USAR_MOCK && (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY)) {
    console.warn('[chutillos] Faltan credenciales de Supabase. Usando datos mock.');
    CONFIG.USAR_MOCK = true;
  }

  window.CHUTILLOS_CONFIG = CONFIG;
})();
