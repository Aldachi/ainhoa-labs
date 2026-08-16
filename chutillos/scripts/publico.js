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
  let marcadores = new Map();   /* fraternidad_id -> L.Marker */
  let mapa = null;
  let capaMarcadores = null;
  let seleccionada = null;
  let timerPoll = null;
  let fallosSeguidos = 0;

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
    const recorrido = await Datos.getRecorrido();
    if (recorrido && recorrido.length > 1) {
      const linea = L.polyline(recorrido, {
        color: '#0066cc',
        weight: 3,
        opacity: 0.55
      }).addTo(mapa);
      mapa.fitBounds(linea.getBounds(), { padding: [30, 30] });
    }

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

  function visibles() {
    const q = U.normalizar(filtroTexto).trim();
    return fraternidades
      .filter(f => f.dia === filtroDia)
      .filter(f => !q || U.normalizar(f.nombre).includes(q))
      .sort((a, b) => a.orden_ingreso - b.orden_ingreso);
  }

  function pintarLista() {
    const items = visibles();

    $vacio.hidden = items.length > 0;
    $lista.hidden = items.length === 0;

    const conDato = items.filter(f => posiciones.has(f.id)).length;
    $resumen.innerHTML =
      `<b>${items.length}</b> fraternidades &middot; <b>${conDato}</b> con reporte reciente`;

    /* Reconstrucción completa: con ~115 filas es instantáneo y evita
       toda una clase de bugs de sincronización de estado. */
    const frag = document.createDocumentFragment();

    items.forEach(f => {
      const pos = posiciones.get(f.id);
      const fres = U.frescura(pos && pos.timestamp);

      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'chx-item';
      btn.type = 'button';
      if (seleccionada === f.id) btn.setAttribute('aria-current', 'true');

      let detalle;
      if (!pos) {
        detalle = 'Sin reportes todavía';
      } else if (pos.origen === 'checkpoint') {
        detalle = `Vista en ${U.esc(pos.checkpoint_nombre || 'un punto de control')}`;
      } else {
        detalle = 'Posición GPS en vivo';
      }

      const cuando = pos ? U.haceCuanto(pos.timestamp) : '—';

      btn.innerHTML =
        `<span class="chx-orden">${String(f.orden_ingreso).padStart(2, '0')}</span>` +
        `<span>` +
          `<span class="chx-nombre">${U.esc(f.nombre)}</span>` +
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

  function pintarMarcadores() {
    if (!capaMarcadores) return;
    capaMarcadores.clearLayers();
    marcadores.clear();

    visibles().forEach(f => {
      const pos = posiciones.get(f.id);
      if (!pos) return;

      /* Decisión de producto del cliente: el marcador es idéntico para GPS
         y para checkpoint. La antigüedad del dato se comunica en el popup
         y en la insignia de la lista. */
      const destacado = seleccionada === f.id;

      const m = L.marker([pos.lat, pos.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div class="chx-marcador${destacado ? ' destacado' : ''}"></div>`,
          iconSize: destacado ? [20, 20] : [14, 14],
          iconAnchor: destacado ? [10, 10] : [7, 7]
        }),
        title: f.nombre,
        zIndexOffset: destacado ? 1000 : 0
      });

      const donde = pos.origen === 'checkpoint'
        ? `Vista en ${U.esc(pos.checkpoint_nombre || 'punto de control')}`
        : 'Posición GPS';

      m.bindPopup(
        `<b>${U.esc(f.nombre)}</b>` +
        `<div class="chx-popup-meta">` +
          `${donde}<br>` +
          `<strong>${U.esc(U.haceCuanto(pos.timestamp))}</strong><br>` +
          `Ingreso ${f.orden_ingreso} &middot; ${U.esc(f.hora_estimada)}` +
        `</div>`
      );

      m.on('click', () => seleccionar(f.id, false));
      m.addTo(capaMarcadores);
      marcadores.set(f.id, m);
    });
  }

  function seleccionar(id, moverMapa = true) {
    seleccionada = seleccionada === id ? null : id;
    pintarLista();
    pintarMarcadores();

    if (!seleccionada) return;

    const m = marcadores.get(seleccionada);
    if (m) {
      if (moverMapa) mapa.setView(m.getLatLng(), Math.max(mapa.getZoom(), 16));
      m.openPopup();
    } else {
      /* Seleccionada una fraternidad sin posición: se avisa en la lista,
         no hay nada que enfocar en el mapa. */
    }
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
