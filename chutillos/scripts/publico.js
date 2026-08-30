/* ============================================
   CH'UTILLOS 2026 — Página pública
   ============================================

   Lectura por polling adaptativo en lugar de websockets: durante las
   entradas puede haber miles de personas mirando a la vez, y mantener una
   conexión abierta por visitante es justo lo que rompería el día del
   evento. Con polling, una petición perdida se recupera sola en el
   siguiente ciclo y el costo por lector es mínimo.
   ============================================ */

(() => {
  'use strict';

  const CFG = window.CHUTILLOS_CONFIG;
  const Datos = window.CHUTILLOS_DATOS;
  const U = window.CHUTILLOS_UTIL;

  /* ---- Estado ---- */
  let fraternidades = [];
  let checkpoints = [];
  let posiciones = new Map();   /* fraternidad_id -> última posición */
  let bandas = new Map();       /* fraternidad_id -> { banda, cabeza } */
  let geo = null;               /* geometría del recorrido */
  let mapa = null;
  let capaMarcadores = null;
  let seleccionada = null;
  let timerPoll = null;
  let timerEstimacion = null;
  let fallosSeguidos = 0;
  let grosorCalzada = () => 6;   /* px que cubren el ancho de la calle */

  let filtroDia = U.diaActual() || CFG.DIAS[0].dia;
  let filtroTexto = '';

  /* ---- Nodos ---- */
  const $dias = document.getElementById('dias');
  const $buscar = document.getElementById('buscar');
  const $limpiar = document.getElementById('limpiar');
  const $lista = document.getElementById('lista');
  const $vacio = document.getElementById('vacio');
  const $resumen = document.getElementById('resumen');
  const $estado = document.getElementById('estado');
  const $estadoTexto = document.getElementById('estado-texto');

  /* ============================================================
     Mapa
     ============================================================ */
  async function iniciarMapa() {
    mapa = L.map('mapa', {
      center: CFG.MAPA_CENTRO,
      zoom: CFG.MAPA_ZOOM,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);

    /* Los tiles se oscurecen por CSS para no chocar con el fondo negro */
    const panelTiles = mapa.getPane('tilePane');
    if (panelTiles) panelTiles.classList.add('chx-tiles');

    capaMarcadores = L.layerGroup().addTo(mapa);

    /* Recorrido de fondo */
    const [recorrido, calles] = await Promise.all([
      Datos.getRecorrido(),
      Datos.getCalles ? Datos.getCalles() : Promise.resolve([])
    ]);

    if (recorrido && recorrido.length > 1) {
      const linea = L.polyline(recorrido, {
        color: '#0066cc',
        weight: 6,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapa);

      /* El grosor del trazado se recalcula con el zoom para que cubra el
         ancho real de la calzada —unos 18 m— en vez de quedar como un hilo
         fino cuando se acerca el mapa. Leaflet dibuja con grosor fijo en
         píxeles, así que hay que convertir metros a píxeles en cada
         cambio de zoom. */
      const ANCHO_CALZADA_M = 18;
      const ajustarGrosor = () => {
        const c = mapa.getCenter();
        const mPorPx = 40075016.686 * Math.cos(c.lat * Math.PI / 180) /
                       (256 * Math.pow(2, mapa.getZoom()));
        const px = ANCHO_CALZADA_M / mPorPx;
        linea.setStyle({ weight: Math.max(5, Math.min(34, px)) });
        if (capaMarcadores) pintarMarcadores();
      };
      mapa.on('zoomend', ajustarGrosor);
      ajustarGrosor();
      grosorCalzada = () => {
        const c = mapa.getCenter();
        const mPorPx = 40075016.686 * Math.cos(c.lat * Math.PI / 180) /
                       (256 * Math.pow(2, mapa.getZoom()));
        return Math.max(5, Math.min(34, ANCHO_CALZADA_M / mPorPx));
      };
      /* Encuadre inicial, con dos precauciones:

         invalidateSize antes de medir, porque el mapa vive dentro de un
         grid que puede no haber resuelto su alto todavía cuando se crea.

         Y `animate: false`, que es lo importante: la animación de zoom de
         Leaflet se apoya en requestAnimationFrame, y en una pestaña que
         está en segundo plano rAF no corre. Si alguien abre el enlace y se
         va a otra pestaña —que es lo más normal del mundo cuando te pasan
         un link por WhatsApp— el fitBounds animado nunca llega a
         aplicarse y al volver se encuentra el recorrido metido en una
         esquina, al zoom por defecto. Sin animación se aplica de una y no
         depende de que la página esté visible. Encuadrar de entrada
         tampoco gana nada con animarse. */
      const encuadrar = () => {
        mapa.invalidateSize({ animate: false });
        mapa.fitBounds(linea.getBounds(), { padding: [30, 30], animate: false });
      };
      encuadrar();
      requestAnimationFrame(encuadrar);

      /* Y otra vez cuando la pestaña vuelva a primer plano, por si se
         cargó oculta y algo quedó a medias. */
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) encuadrar();
      }, { once: true });

      /* Y de nuevo si cambia el tamaño de la ventana */
      let tempo;
      window.addEventListener('resize', () => {
        clearTimeout(tempo);
        tempo = setTimeout(encuadrar, 250);
      });

      /* Geometría: convierte metros de recorrido en coordenadas. Es lo que
         permite dibujar cada fraternidad como una banda sobre el trazado y
         saber por qué calle va. */
      geo = window.CHUTILLOS_RECORRIDO.construir(recorrido, checkpoints, calles);
    }

    /* El aviso de trazado provisional solo se muestra mientras el
       recorrido no sea el oficial. */
    const nota = document.getElementById('mapa-nota');
    if (nota && CFG.RECORRIDO_OFICIAL) nota.hidden = true;

    /* Checkpoints como referencia discreta */
    checkpoints.forEach(c => {
      L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="chx-marcador-chk"></div>',
          iconSize: [8, 8],
          iconAnchor: [4, 4]
        }),
        interactive: true,
        keyboard: false
      })
        .bindPopup(`<b>${U.esc(c.nombre)}</b><div class="chx-popup-meta">Punto de control ${c.orden_en_recorrido}</div>`)
        .addTo(mapa);
    });
  }

  /* ============================================================
     Carga inicial
     ============================================================ */
  async function iniciar() {
    pintarDias();

    try {
      [fraternidades, checkpoints] = await Promise.all([
        Datos.getFraternidades(),
        Datos.getCheckpoints()
      ]);
    } catch (err) {
      console.error('[publico] Error cargando datos base', err);
      $resumen.textContent = 'No se pudieron cargar las fraternidades. Reintentando...';
      setTimeout(iniciar, 5000);
      return;
    }

    await iniciarMapa();
    await refrescar();
    programarPoll();
    programarEstimacion();

    /* Al volver a la pestaña se refresca de inmediato y se reajusta el ritmo */
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refrescar();
      programarPoll();
    });

    window.addEventListener('online', () => refrescar());
    window.addEventListener('offline', () => pintarEstado('offline', 'Sin conexión'));
  }

  /* ============================================================
     Polling adaptativo
     ============================================================ */
  /* La posición estimada avanza con el reloj, no con los datos: entre un
     reporte y el siguiente pueden pasar cuarenta minutos, y en ese rato la
     fraternidad recorre medio kilómetro. Redibujar cada 20 s hace que la
     banda se deslice sola por el trazado en vez de quedarse congelada
     esperando al próximo voluntario.

     No cuesta red — es puro cálculo local — y se detiene con la pestaña
     oculta para no gastar batería. */
  function programarEstimacion() {
    clearInterval(timerEstimacion);
    timerEstimacion = setInterval(() => {
      if (document.hidden || !geo) return;
      pintarMarcadores();
      pintarLista();
    }, 20000);
  }

  function programarPoll() {
    clearTimeout(timerPoll);
    const base = document.hidden ? CFG.POLL_MS_OCULTO : CFG.POLL_MS;
    /* Ante fallos seguidos se espacia progresivamente, con tope de 2 min */
    const espera = Math.min(base * Math.pow(1.6, fallosSeguidos), 120000);
    timerPoll = setTimeout(async () => {
      await refrescar();
      programarPoll();
    }, espera);
  }

  async function refrescar() {
    if (!navigator.onLine) {
      pintarEstado('offline', 'Sin conexión');
      return;
    }

    try {
      const filas = await Datos.getUltimasPosiciones();
      posiciones = new Map(filas.map(p => [p.fraternidad_id, p]));
      fallosSeguidos = 0;
      pintarEstado('vivo', 'En vivo');
      pintarLista();
      pintarMarcadores();
    } catch (err) {
      fallosSeguidos++;
      console.warn('[publico] Fallo al refrescar', err.message);
      /* Se mantiene en pantalla el último dato bueno: es preferible a
         vaciar la lista porque una petición falló. */
      pintarEstado('offline', 'Reintentando');
    }
  }

  /* ============================================================
     Render
     ============================================================ */
  function pintarDias() {
    $dias.innerHTML = '';
    CFG.DIAS.forEach(d => {
      const b = document.createElement('button');
      b.className = 'chx-dia';
      b.type = 'button';
      b.textContent = d.etiqueta;
      b.title = d.nombre;
      b.setAttribute('aria-pressed', String(d.dia === filtroDia));
      b.addEventListener('click', () => {
        filtroDia = d.dia;
        seleccionada = null;
        pintarDias();
        pintarLista();
        pintarMarcadores();
      });
      $dias.appendChild(b);
    });
  }

  function delDia() {
    return fraternidades
      .filter(f => f.dia === filtroDia)
      .sort((a, b) => a.orden_ingreso - b.orden_ingreso);
  }

  function visibles() {
    const q = U.normalizar(filtroTexto).trim();
    return delDia()
      .filter(f => !q || U.buscable(f).includes(q));
  }

  /* ============================================================
     La comparsa como cadena continua
     ------------------------------------------------------------
     Cada banda se calculaba por separado a partir de su propio reporte, y
     nada impedía que dos fraternidades se superpusieran — algo que en la
     calle no pasa: una comparsa no puede meterse dentro de otra.

     Acá se recorre la fila de adelante hacia atrás y se acomoda cada una
     detrás de la anterior:

       · no puede adelantarse más allá de la cola de la de adelante
         (ESPACIO_MIN), que es lo que impide la superposición;
       · tampoco puede quedar descolgada muy atrás (ESPACIO_MAX), porque
         aunque los reportes de dos checkpoints lleguen con minutos de
         diferencia, en la calle no se abre un hueco de cuadras.

     Entre esos dos límites manda la estimación del checkpoint, así que los
     reportes siguen moviendo la fila en vez de quedar decorativos.

     Se calcula sobre TODAS las del día, no sobre las filtradas por la
     búsqueda: si no, buscar "morenada" recalcularía la cadena sin las que
     van en el medio y las posiciones saltarían.
     ============================================================ */
  function calcularCadena() {
    const cadena = new Map();
    const finalizadas = new Set();
    if (!geo) return { cadena, finalizadas };

    const LARGO = CFG.LARGO_CUERPO_M;
    let colaAnterior = null;

    delDia().forEach(f => {
      const pos = posiciones.get(f.id);
      if (!pos) return;

      const est = U.estimar(pos, geo);
      if (!est) return;

      /* Las que llegaron a la meta salen de la fila: ya no están en la
         calle, así que no se dibujan en el mapa ni le ponen tope a la que
         viene atrás — esa puede avanzar al tramo que quedó libre. En la
         lista sí siguen, marcadas como finalizadas. */
      if (geo.esFinal && geo.esFinal(est.sRapido)) {
        finalizadas.add(f.id);
        return;
      }

      let cabeza = est.sRapido;

      if (colaAnterior !== null) {
        const masAdelante = colaAnterior - CFG.ESPACIO_MIN_M;
        const masAtras    = colaAnterior - CFG.ESPACIO_MAX_M;
        cabeza = Math.min(cabeza, masAdelante);
        cabeza = Math.max(cabeza, masAtras);
      }

      /* Si la fila viene tan apretada que empujaría a alguien antes del
         arranque, se apoya en el kilómetro cero y se acepta que las
         primeras queden algo juntas: es preferible a dibujarlas fuera del
         recorrido. */
      cabeza = Math.max(cabeza, LARGO * 0.5);

      const cola = Math.max(0, cabeza - LARGO);
      cadena.set(f.id, { cabeza, cola, est });
      colaAnterior = cola;
    });

    return { cadena, finalizadas };
  }

  function pintarLista() {
    const items = visibles();
    const hayEnEsteDia = fraternidades.some(f => f.dia === filtroDia);

    $vacio.hidden = items.length > 0;
    $lista.hidden = items.length === 0;

    /* Un día sin rol publicado y una búsqueda sin resultados son cosas
       distintas: decir "no se encontraron" cuando todavía no hay lista
       hace pensar que el sitio está roto. */
    if (items.length === 0) {
      const d = CFG.DIAS.find(x => x.dia === filtroDia);
      $vacio.textContent = hayEnEsteDia
        ? 'No se encontraron fraternidades con ese nombre.'
        : `La lista de ${d ? d.nombre.toLowerCase() : 'este día'} todavía no fue publicada por la AFFAP.`;
    }

    const conDato = items.filter(f => posiciones.has(f.id)).length;
    $resumen.innerHTML =
      `<b>${items.length}</b> fraternidades &middot; <b>${conDato}</b> con reporte reciente`;

    /* Misma cadena que usa el mapa, para que la lista y el mapa no digan
       cosas distintas de la misma fraternidad. */
    const { cadena: cadenaActual, finalizadas } = calcularCadena();

    /* Reconstrucción completa: con ~115 filas es instantáneo y evita
       toda una clase de bugs de sincronización de estado. */
    const frag = document.createDocumentFragment();

    items.forEach(f => {
      const pos = posiciones.get(f.id);
      const est = pos && geo ? U.estimar(pos, geo) : null;
      let fres = est ? est.frescura : 'sin-dato';

      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'chx-item';
      btn.type = 'button';
      if (seleccionada === f.id) btn.setAttribute('aria-current', 'true');

      /* Se nombra la calle y los metros hechos: es lo que le sirve a
         alguien que quiere ir a buscarla. El punto de control es una
         referencia nuestra, no algo que el público ubique.

         Los dos extremos se dicen con palabras, no como ausencia de dato:
         que todavía no haya reportes no significa "no sabemos nada", sino
         que está en la largada esperando turno. Y llegar al último tramo
         es haber terminado. */
      const eslabon = cadenaActual.get(f.id);
      let detalle;
      if (finalizadas.has(f.id)) {
        detalle = `Finalizó el recorrido · ${Math.round(geo.total).toLocaleString('es-BO')} m`;
      } else if (!pos) {
        const largada = geo && geo.calleDeSalida ? geo.calleDeSalida() : null;
        detalle = largada
          ? `En ${U.esc(largada)} · esperando la salida`
          : 'Esperando la salida';
      } else if (!eslabon) {
        detalle = `Vista en ${U.esc(pos.checkpoint_nombre || 'un punto de control')}`;
      } else {
        const calle = geo.calleEn ? geo.calleEn(eslabon.cabeza) : null;
        const metros = Math.round(eslabon.cabeza).toLocaleString('es-BO');
        detalle = calle
          ? `${U.esc(calle)} · ${metros} m recorridos`
          : `${metros} m recorridos`;
      }

      /* La que terminó no necesita reloj: "hace 45 min" sobre fondo ámbar
         se lee como un dato que se está poniendo viejo, cuando en realidad
         ya no va a cambiar nunca más. */
      const cuando = finalizadas.has(f.id)
        ? 'Llegó'
        : (pos ? U.haceCuanto(pos.timestamp) : '—');
      if (finalizadas.has(f.id)) fres = 'final';

      btn.innerHTML =
        `<span class="chx-orden">${String(f.orden_ingreso).padStart(2, '0')}</span>` +
        `<span>` +
          `<span class="chx-nombre">${U.esc(f.nombre)}</span>` +
          (f.entidad ? `<span class="chx-entidad">${U.esc(f.entidad)}</span>` : '') +
          `<span class="chx-sub">${detalle}</span>` +
        `</span>` +
        `<span class="chx-badge" data-frescura="${fres}">${U.esc(cuando)}</span>`;

      btn.addEventListener('click', () => seleccionar(f.id));
      li.appendChild(btn);
      frag.appendChild(li);
    });

    $lista.innerHTML = '';
    $lista.appendChild(frag);
  }

  /* ============================================================
     Fraternidades sobre el mapa
     ------------------------------------------------------------
     Cada una se dibuja como una BANDA sobre el trazado, no como un punto.

     Dos razones. La primera es honestidad: sabemos que pasó por un punto
     de control hace veinte minutos, no que esté parada ahí. Un punto fijo
     afirma una precisión que no tenemos; una banda dice "va por este
     tramo", que es exactamente lo que sabemos.

     La segunda es que una fraternidad es un cuerpo largo — danzantes más
     banda ocupan más de cien metros de calle — así que verla como una
     franja que avanza se parece mucho más a la realidad que un punto.

     Efecto lateral importante: antes todas las fraternidades reportadas en
     el mismo punto se dibujaban en la MISMA coordenada exacta y se tapaban
     entre sí. Repartidas por el tramo según su hora de paso, ahora se ven
     todas.
     ============================================================ */
  function pintarMarcadores() {
    if (!capaMarcadores || !geo) return;
    capaMarcadores.clearLayers();
    bandas.clear();

    const { cadena } = calcularCadena();

    visibles().forEach(f => {
      const pos = posiciones.get(f.id);
      if (!pos) return;

      /* Sin eslabón es que todavía no salió o que ya terminó: en ninguno de
         los dos casos está en la calle, así que no se dibuja. */
      const eslabon = cadena.get(f.id);
      if (!eslabon) return;

      const { cabeza, cola, est } = eslabon;
      const destacado = seleccionada === f.id;

      const puntos = geo.tramo(cola, cabeza);

      /* Mismo azul para todas; la antigüedad se transmite con la opacidad,
         que no compite con el sistema de color del sitio. */
      const opacidad = { fresco: 0.85, tibio: 0.55, viejo: 0.28 }[est.frescura] || 0.5;

      /* La banda ocupa el ancho de la calzada, igual que el trazado: la
         comparsa toma la calle entera, no va por el borde. */
      const ancho = grosorCalzada();

      const banda = L.polyline(puntos, {
        color: destacado ? '#ffffff' : '#0066cc',
        weight: destacado ? ancho * 1.25 : ancho,
        opacity: destacado ? 1 : opacidad,
        lineCap: 'butt',
        lineJoin: 'round',
        className: destacado ? 'chx-banda destacada' : 'chx-banda'
      });

      /* Cabeza: dónde va el frente de la comparsa */
      const ll = geo.puntoEn(cabeza);
      const marca = L.marker(ll, {
        icon: L.divIcon({
          className: '',
          html: `<div class="chx-cabeza${destacado ? ' destacada' : ''}"></div>`,
          iconSize: destacado ? [16, 16] : [10, 10],
          iconAnchor: destacado ? [8, 8] : [5, 5]
        }),
        title: f.entidad ? f.nombre + " — " + f.entidad : f.nombre,
        zIndexOffset: destacado ? 1000 : 0
      });

      const popup = textoPopup(f, pos, est, cabeza);
      banda.bindPopup(popup);
      marca.bindPopup(popup);

      banda.on('click', () => seleccionar(f.id, false));
      marca.on('click', () => seleccionar(f.id, false));

      banda.addTo(capaMarcadores);
      marca.addTo(capaMarcadores);
      bandas.set(f.id, { banda, marca, cabeza });
    });
  }

  function textoPopup(f, pos, est, cabeza) {
    /* El horario solo se publica si el rol cargado es el definitivo. Una
       hora de salida equivocada hace que la gente se pierda a su
       fraternidad, así que ante la duda no se muestra. */
    const pie = CFG.ROL_OFICIAL
      ? `Ingreso ${f.orden_ingreso} &middot; ${U.esc(f.hora_estimada)}`
      : `Orden de ingreso ${f.orden_ingreso}`;

    const punto = U.esc(pos.checkpoint_nombre || 'un punto de control');

    /* Se encabeza con la calle, no con el punto de control: un checkpoint
       es una referencia interna nuestra, una avenida es algo que la gente
       ubica sin que se lo expliquen. */
    const calle = geo.calleEn ? geo.calleEn(cabeza) : null;
    const recorridos = Math.round(cabeza);
    const restantes = Math.max(0, Math.round(geo.total - cabeza));
    const pct = Math.round(cabeza / geo.total * 100);

    const termino = geo.esFinal && geo.esFinal(cabeza);

    let dondeVa;
    if (termino) {
      dondeVa = `<strong>Finalizó el recorrido</strong><br>Llegó a ${U.esc(calle || 'la meta')}`;
    } else if (calle) {
      dondeVa = `Va por <strong>${U.esc(calle)}</strong>`;
    } else {
      dondeVa = `Pasó por <strong>${punto}</strong>`;
    }

    if (!termino && est.frescura === 'viejo' && !est.enElUltimoTramo) {
      dondeVa += `<br><span class="chx-popup-aviso">Puede estar en un descanso</span>`;
    }

    /* Si ya terminó no se muestran metros restantes: decir "finalizó el
       recorrido" y debajo "faltan 70 m" es contradecirse en dos renglones.
       Se da el total y la barra llena. */
    const avance = termino
      ? `<div class="chx-popup-avance">` +
          `<span><strong>${Math.round(geo.total).toLocaleString('es-BO')} m</strong> recorridos</span>` +
          `<span>recorrido completo</span>` +
        `</div>` +
        `<div class="chx-popup-barra" aria-hidden="true"><span style="width:100%"></span></div>`
      : `<div class="chx-popup-avance">` +
          `<span><strong>${recorridos.toLocaleString('es-BO')} m</strong> recorridos</span>` +
          `<span>faltan ${restantes.toLocaleString('es-BO')} m</span>` +
        `</div>` +
        `<div class="chx-popup-barra" aria-hidden="true"><span style="width:${pct}%"></span></div>`;

    return `<b>${U.esc(f.nombre)}</b>` +
      (f.entidad ? `<div class="chx-popup-entidad">${U.esc(f.entidad)}</div>` : '') +
      `<div class="chx-popup-meta">` +
        `${dondeVa}` +
        avance +
        `Confirmada en ${punto} <strong>${U.esc(U.haceCuanto(pos.timestamp))}</strong><br>` +
        pie +
      `</div>`;
  }

  function seleccionar(id, moverMapa = true) {
    seleccionada = seleccionada === id ? null : id;
    pintarLista();
    pintarMarcadores();

    if (!seleccionada) return;

    const b = bandas.get(seleccionada);
    if (b) {
      if (moverMapa) {
        /* Se encuadra la banda entera, no solo la cabeza: lo que interesa
           es el tramo por donde va. Sin animación por lo mismo que el
           encuadre inicial — en segundo plano no se aplicaría. */
        mapa.fitBounds(b.banda.getBounds(), {
          padding: [80, 80],
          maxZoom: 17,
          animate: false
        });
      }
      b.marca.openPopup();
    }
    /* Si no hay banda es que todavía no la reportaron: se explica en la
       lista y no hay nada que enfocar en el mapa. */
  }

  function pintarEstado(tipo, texto) {
    $estado.dataset.estado = tipo;
    $estadoTexto.textContent = texto;
  }

  /* ============================================================
     Búsqueda
     ============================================================ */
  let debounce = null;
  $buscar.addEventListener('input', () => {
    filtroTexto = $buscar.value;
    $limpiar.hidden = !filtroTexto;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      pintarLista();
      pintarMarcadores();
    }, 120);
  });

  $limpiar.addEventListener('click', () => {
    $buscar.value = '';
    filtroTexto = '';
    $limpiar.hidden = true;
    pintarLista();
    pintarMarcadores();
    $buscar.focus();
  });

  iniciar();
})();
