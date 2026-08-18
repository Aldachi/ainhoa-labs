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

    /* ---- Umbrales de antigüedad del dato (minutos) ------------------------
       Se usan para etiquetar cuán fresca es la última posición conocida.
    --------------------------------------------------------------------- */
    FRESCO_MIN: 5,
    TIBIO_MIN: 20,

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

       Ojo: esto habla solo del recorrido. Los checkpoints y los nombres de
       las fraternidades siguen siendo de relleno. */
    RECORRIDO_OFICIAL: true
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
