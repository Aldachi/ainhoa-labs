/* ============================================
   CH'UTILLOS 2026 — Portador GPS
   ============================================

   Decisiones que importan para que esto aguante varias horas de desfile:

   · Se toma una posición puntual cada 25 s con getCurrentPosition en lugar
     de dejar watchPosition corriendo. watchPosition mantiene el receptor
     GPS despierto de forma continua; con lecturas espaciadas el chip puede
     dormir entre una y otra, que es de donde sale el ahorro real de
     batería. Para un desfile a paso de caminata, 25 s es resolución de
     sobra.

   · Si el portador no se movió más de 15 m, no se envía nada. Evita gastar
     datos y batería mientras la fraternidad está detenida esperando turno.

   · Wake Lock. Este es el punto frágil de cualquier tracker web: si la
     pantalla se apaga, el navegador congela los temporizadores y la
     transmisión se detiene. Se pide un Wake Lock para evitarlo y se
     reintenta cada vez que la página vuelve a primer plano. Aun así, el
     portador tiene que saber que el teléfono debe quedar con la pantalla
     encendida — por eso se le dice de forma explícita en pantalla.

   · Todo envío pasa por la cola con reintento: si falla la red, el ping
     queda guardado y sale cuando haya señal.
   ============================================ */

(() => {
  'use strict';

  const CFG = window.CHUTILLOS_CONFIG;
  const Datos = window.CHUTILLOS_DATOS;
  const U = window.CHUTILLOS_UTIL;
  const Cola = window.CHUTILLOS_COLA;

  const token = U.param('t');

  let fraternidad = null;
  let cola = null;
  let timer = null;
  let wakeLock = null;
  let activo = false;

  let ultimaPos = null;
  let enviados = 0;
  let ultimoEnvio = null;

  const $ = id => document.getElementById(id);

  /* ============================================================
     Arranque
     ============================================================ */
  async function iniciar() {
    /* Los enlaces de portador se repartieron alguna vez; si la modalidad
       queda desactivada hay que decirlo con claridad, no dejar que parezca
       un enlace roto ni que alguien transmita para nada. */
    if (!CFG.GPS_HABILITADO) {
      return mostrarError(
        'Seguimiento por GPS no vigente',
        'Para Ch\'utillos 2026 el recorrido se sigue con puntos de control, ' +
        'sin portadores con GPS. No hace falta que hagas nada: podés cerrar ' +
        'esta página. Si te pidieron usarla, escribinos a Ainhoa Labs.'
      );
    }

    if (!token) return mostrarError();

    try {
      fraternidad = await Datos.getFraternidadPorToken(token);
    } catch (err) {
      console.error('[portador] Error validando token', err);
    }

    if (!fraternidad) return mostrarError();

    $('nombre-frat').textContent = fraternidad.nombre;
    $('nombre-frat-2').textContent = fraternidad.nombre;
    $('detalle-frat').textContent =
      `${U.etiquetaDia(fraternidad.dia)} · Orden de ingreso ${fraternidad.orden_ingreso} · Hora estimada ${fraternidad.hora_estimada}`;

    $('panel-inicio').hidden = false;
    pintarEstado('cargando', 'Listo');

    cola = new Cola(`portador-${fraternidad.id}`);
    cola.onCambio(e => {
      $('d-pendientes').textContent = String(e.pendientes);
      if (activo) {
        if (!e.enLinea) pintarEstado('offline', 'Sin señal');
        else if (e.pendientes > 0) pintarEstado('pendiente', `${e.pendientes} en cola`);
        else pintarEstado('vivo', 'Transmitiendo');
      }
    });

    $('btn-iniciar').addEventListener('click', activar);
    $('btn-detener').addEventListener('click', detener);
  }

  function mostrarError(titulo, texto) {
    if (titulo) $('error-titulo').textContent = titulo;
    if (texto) $('error-texto').textContent = texto;
    $('panel-error').hidden = false;
    pintarEstado('offline', titulo ? 'No vigente' : 'Sin acceso');
  }

  /* ============================================================
     Activación
     ============================================================ */
  async function activar() {
    if (!navigator.geolocation) {
      return ayuda('Este navegador no puede compartir ubicación. Probá con Chrome o Safari actualizados.');
    }

    $('btn-iniciar').disabled = true;
    $('btn-iniciar').textContent = 'Pidiendo permiso...';

    /* Primera lectura: sirve para disparar el diálogo de permiso y para
       confirmar que efectivamente hay señal antes de dar por buena la
       activación. */
    try {
      const pos = await leerPosicion();
      activo = true;
      $('panel-inicio').hidden = true;
      $('panel-activo').hidden = false;
      $('panel-ayuda').hidden = true;
      procesarPosicion(pos, true);
      programarSiguiente();
      await pedirWakeLock();
      pintarEstado('vivo', 'Transmitiendo');
    } catch (err) {
      $('btn-iniciar').disabled = false;
      $('btn-iniciar').textContent = 'Activar mi ubicación';
      ayuda(mensajeGeoError(err));
    }
  }

  function detener() {
    activo = false;
    clearTimeout(timer);
    soltarWakeLock();
    $('panel-activo').hidden = true;
    $('panel-inicio').hidden = false;
    $('btn-iniciar').disabled = false;
    $('btn-iniciar').textContent = 'Reanudar transmisión';
    pintarEstado('cargando', 'Detenido');
  }

  /* ============================================================
     Ciclo de lectura
     ============================================================ */
  function programarSiguiente() {
    clearTimeout(timer);
    if (!activo) return;
    timer = setTimeout(async () => {
      try {
        const pos = await leerPosicion();
        procesarPosicion(pos, false);
      } catch (err) {
        console.warn('[portador] Lectura fallida:', err.message);
        $('d-estado').textContent = 'Buscando señal GPS';
      }
      programarSiguiente();
    }, CFG.GPS_INTERVALO_MS);
  }

  function leerPosicion() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: CFG.GPS_TIMEOUT_MS,
        /* Se acepta una lectura de hasta 10 s de antigüedad: si el sistema
           ya tiene una posición fresca en caché, se evita encender el GPS
           otra vez. */
        maximumAge: 10000
      });
    });
  }

  function procesarPosicion(pos, forzar) {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;

    $('d-precision').textContent = accuracy ? `±${Math.round(accuracy)} m` : '—';
    $('d-estado').textContent = 'Transmitiendo';

    /* Si apenas se movió, no vale la pena gastar datos ni batería */
    if (!forzar && ultimaPos) {
      const d = U.distanciaM(ultimaPos.lat, ultimaPos.lng, lat, lng);
      if (d < CFG.GPS_MOV_MINIMO_M) {
        $('d-estado').textContent = 'En pausa (sin movimiento)';
        return;
      }
    }

    ultimaPos = { lat, lng };

    cola.encolar(
      {
        token,
        lat: +lat.toFixed(6),
        lng: +lng.toFixed(6),
        /* Clave idempotente: si un envío se reintenta tras un timeout
           ambiguo, el servidor no crea un registro duplicado. */
        client_id: `${U.idDispositivo()}-${Date.now()}`
      },
      payload => Datos.enviarPing(payload)
    );

    enviados++;
    ultimoEnvio = Date.now();
    $('d-enviados').textContent = String(enviados);
    refrescarUltimo();
  }

  /* Reloj del "hace X" sin depender de que lleguen posiciones nuevas */
  setInterval(refrescarUltimo, 10000);
  function refrescarUltimo() {
    if (!ultimoEnvio) return;
    $('d-ultimo').textContent = U.haceCuanto(new Date(ultimoEnvio).toISOString());
  }

  /* ============================================================
     Wake Lock
     ============================================================ */
  async function pedirWakeLock() {
    if (!('wakeLock' in navigator)) {
      $('d-wakelock').textContent = 'No disponible';
      ayuda('Tu navegador no puede mantener la pantalla encendida por su cuenta. Configurá el celular para que la pantalla no se apague sola durante el desfile.');
      return;
    }
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      $('d-wakelock').textContent = 'Sí';
      wakeLock.addEventListener('release', () => {
        $('d-wakelock').textContent = 'Liberada';
      });
    } catch (err) {
      $('d-wakelock').textContent = 'No disponible';
      console.warn('[portador] Wake Lock rechazado', err.message);
    }
  }

  function soltarWakeLock() {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
      $('d-wakelock').textContent = '—';
    }
  }

  /* El navegador libera el Wake Lock al pasar a segundo plano; hay que
     volver a pedirlo cuando la página regresa al frente. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && activo) {
      pedirWakeLock();
      /* Al volver, se toma una lectura de inmediato: probablemente los
         temporizadores estuvieron congelados mientras estuvo oculta. */
      leerPosicion()
        .then(p => procesarPosicion(p, false))
        .catch(() => {});
      programarSiguiente();
    }
  });

  /* ============================================================
     Ayuda / errores
     ============================================================ */
  function ayuda(texto) {
    $('texto-ayuda').textContent = texto;
    $('panel-ayuda').hidden = false;
  }

  function mensajeGeoError(err) {
    switch (err && err.code) {
      case 1:
        return 'Rechazaste el permiso de ubicación. Abrí los ajustes del navegador, permití la ubicación para esta página y volvé a intentar.';
      case 2:
        return 'No se pudo obtener la ubicación. Verificá que el GPS del celular esté encendido y que estés al aire libre.';
      case 3:
        return 'La búsqueda de señal GPS tardó demasiado. Probá de nuevo en un lugar despejado.';
      default:
        return 'No se pudo activar la ubicación. Revisá que el GPS esté encendido y volvé a intentar.';
    }
  }

  function pintarEstado(tipo, texto) {
    $('estado').dataset.estado = tipo;
    $('estado-texto').textContent = texto;
  }

  iniciar();
})();
