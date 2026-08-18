/* ============================================
   CH'UTILLOS 2026 — Editor de recorrido y checkpoints
   ============================================

   Existe porque no hay forma confiable de sacar coordenadas de una captura
   de pantalla: estimarlas a ojo desvía el trazado decenas de metros y en el
   mapa se nota como calles cruzadas por la mitad de una manzana. Acá los
   puntos se marcan sobre el mapa real, así que salen con la precisión del
   zoom al que se trabaje.

   Salida en dos formatos:
     · arreglo JS, para pegar en mock-data.js y verlo funcionando ya
     · INSERT de SQL, para cargar la tabla `recorrido` en Supabase
   ============================================ */

(() => {
  'use strict';

  const CFG = window.CHUTILLOS_CONFIG;
  const U = window.CHUTILLOS_UTIL;

  let modo = 'recorrido';        /* 'recorrido' | 'checkpoints' */
  let formatoSalida = 'js';      /* 'js' | 'sql' */

  let puntos = [];               /* [{lat, lng}] del trazado */
  let checkpoints = [];          /* [{nombre, lat, lng}] */

  let mapa, capaLinea, capaVertices, capaChk;

  const $ = id => document.getElementById(id);

  /* ============================================================
     Mapa
     ============================================================ */
  function iniciarMapa() {
    mapa = L.map('mapa', {
      center: CFG.MAPA_CENTRO,
      zoom: 15,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);

    const panel = mapa.getPane('tilePane');
    if (panel) panel.classList.add('chx-tiles');

    capaLinea = L.layerGroup().addTo(mapa);
    capaVertices = L.layerGroup().addTo(mapa);
    capaChk = L.layerGroup().addTo(mapa);

    mapa.on('click', (e) => {
      if (modo === 'recorrido') {
        puntos.push({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else {
        const nombre = ($('nombre-chk').value || '').trim() ||
                       `Punto ${checkpoints.length + 1}`;
        checkpoints.push({ nombre, lat: e.latlng.lat, lng: e.latlng.lng });
        $('nombre-chk').value = '';
      }
      redibujar();
    });
  }

  /* ============================================================
     Dibujo
     ============================================================ */
  function redibujar() {
    capaLinea.clearLayers();
    capaVertices.clearLayers();
    capaChk.clearLayers();

    /* Trazado */
    if (puntos.length > 1) {
      L.polyline(puntos.map(p => [p.lat, p.lng]), {
        color: '#0066cc',
        weight: 4,
        opacity: 0.8
      }).addTo(capaLinea);
    }

    puntos.forEach((p, i) => {
      const clase = i === 0 ? 'ed-vertice inicio'
                  : i === puntos.length - 1 ? 'ed-vertice fin'
                  : 'ed-vertice';

      const m = L.marker([p.lat, p.lng], {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<div class="${clase}" title="Punto ${i + 1}"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        })
      });

      m.on('drag', (e) => {
        puntos[i] = { lat: e.latlng.lat, lng: e.latlng.lng };
        /* Solo se redibuja la línea mientras se arrastra: recrear los
           marcadores en cada frame cortaría el arrastre. */
        capaLinea.clearLayers();
        if (puntos.length > 1) {
          L.polyline(puntos.map(q => [q.lat, q.lng]), {
            color: '#0066cc', weight: 4, opacity: 0.8
          }).addTo(capaLinea);
        }
        actualizarSalida();
      });

      m.on('dragend', redibujar);

      m.on('contextmenu', (e) => {
        L.DomEvent.stop(e);
        puntos.splice(i, 1);
        redibujar();
      });

      m.addTo(capaVertices);
    });

    /* Checkpoints */
    checkpoints.forEach((c, i) => {
      const m = L.marker([c.lat, c.lng], {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<div class="ed-vertice-chk">${i + 1}</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      });

      m.bindTooltip(c.nombre, { direction: 'top', offset: [0, -10] });

      m.on('dragend', (e) => {
        const ll = e.target.getLatLng();
        checkpoints[i] = { ...checkpoints[i], lat: ll.lat, lng: ll.lng };
        redibujar();
      });

      m.on('contextmenu', (e) => {
        L.DomEvent.stop(e);
        checkpoints.splice(i, 1);
        redibujar();
      });

      m.addTo(capaChk);
    });

    actualizarPanel();
    actualizarSalida();
  }

  /* ============================================================
     Panel
     ============================================================ */
  function actualizarPanel() {
    if (modo === 'recorrido') {
      $('lbl-puntos').textContent = 'Puntos';
      $('d-puntos').textContent = String(puntos.length);
      $('fila-distancia').hidden = false;
      $('d-distancia').textContent = formatoDistancia(longitudTrazado());
    } else {
      $('lbl-puntos').textContent = 'Checkpoints';
      $('d-puntos').textContent = String(checkpoints.length);
      $('fila-distancia').hidden = true;
    }

    $('lista-chk').innerHTML = checkpoints.map((c, i) => `
      <li>
        <span class="ed-orden">${String(i + 1).padStart(2, '0')}</span>
        <span class="ed-nombre-chk">${U.esc(c.nombre)}</span>
        <button type="button" data-quitar="${i}" aria-label="Quitar ${U.esc(c.nombre)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="square">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </li>`).join('');
  }

  function longitudTrazado() {
    let total = 0;
    for (let i = 1; i < puntos.length; i++) {
      total += U.distanciaM(
        puntos[i - 1].lat, puntos[i - 1].lng,
        puntos[i].lat, puntos[i].lng
      );
    }
    return total;
  }

  function formatoDistancia(m) {
    return m < 1000
      ? `${Math.round(m)} m`
      : `${(m / 1000).toFixed(2)} km`;
  }

  /* ============================================================
     Salida
     ============================================================ */
  function actualizarSalida() {
    $('salida').value = modo === 'recorrido'
      ? (formatoSalida === 'js' ? recorridoComoJS() : recorridoComoSQL())
      : (formatoSalida === 'js' ? checkpointsComoJS() : checkpointsComoSQL());
  }

  /* 6 decimales ≈ 11 cm de resolución. Más precisión sería ruido: el GPS
     de un celular no baja de varios metros de error. */
  const f = n => n.toFixed(6);

  function recorridoComoJS() {
    if (!puntos.length) return '// Marcá puntos en el mapa para generar el trazado';
    return 'const RECORRIDO = [\n' +
      puntos.map(p => `    [${f(p.lat)}, ${f(p.lng)}]`).join(',\n') +
      '\n  ];';
  }

  function recorridoComoSQL() {
    if (!puntos.length) return '-- Marcá puntos en el mapa para generar el trazado';
    return 'delete from recorrido;\n\n' +
      'insert into recorrido (orden, lat, lng) values\n' +
      puntos.map((p, i) => `  (${i + 1}, ${f(p.lat)}, ${f(p.lng)})`).join(',\n') +
      ';';
  }

  function checkpointsComoJS() {
    if (!checkpoints.length) return '// Marcá los puntos de control en el mapa';
    return 'const checkpoints = [\n' +
      checkpoints.map((c, i) =>
        `    { id: 'chk-${String(i + 1).padStart(2, '0')}', ` +
        `nombre: ${JSON.stringify(c.nombre)}, ` +
        `orden_en_recorrido: ${i + 1}, ` +
        `lat: ${f(c.lat)}, lng: ${f(c.lng)} }`
      ).join(',\n') +
      '\n  ];';
  }

  function checkpointsComoSQL() {
    if (!checkpoints.length) return '-- Marcá los puntos de control en el mapa';
    return 'insert into checkpoints (id, nombre, orden_en_recorrido, lat, lng) values\n' +
      checkpoints.map((c, i) =>
        `  ('chk-${String(i + 1).padStart(2, '0')}', ` +
        `${sqlTexto(c.nombre)}, ${i + 1}, ${f(c.lat)}, ${f(c.lng)})`
      ).join(',\n') +
      '\non conflict (id) do update set\n' +
      '  nombre = excluded.nombre,\n' +
      '  orden_en_recorrido = excluded.orden_en_recorrido,\n' +
      '  lat = excluded.lat,\n' +
      '  lng = excluded.lng;\n\n' +
      '-- Los tokens se generan aparte (ver supabase/README.md)';
  }

  /* Comillas simples escapadas: un nombre con apóstrofo, como
     "Ch'utillos", rompería el INSERT si se interpolara sin más. */
  function sqlTexto(s) {
    return `'${String(s).replace(/'/g, "''")}'`;
  }

  /* ============================================================
     Importar
     ============================================================ */
  $('btn-cargar').addEventListener('click', () => {
    const err = $('error-importar');
    err.hidden = true;

    const txt = $('entrada').value.trim();
    if (!txt) return;

    try {
      /* Se tolera que peguen la línea completa "const RECORRIDO = [...];" */
      const soloArreglo = txt
        .replace(/^[^[]*/, '')
        .replace(/;\s*$/, '');

      const datos = JSON.parse(soloArreglo);
      if (!Array.isArray(datos)) throw new Error('No es un arreglo');

      const nuevos = datos.map((p, i) => {
        const lat = Array.isArray(p) ? p[0] : p.lat;
        const lng = Array.isArray(p) ? p[1] : p.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          throw new Error(`El punto ${i + 1} no tiene lat/lng numéricos`);
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new Error(`El punto ${i + 1} está fuera de rango`);
        }
        return { lat, lng };
      });

      if (modo === 'recorrido') {
        puntos = nuevos;
      } else {
        checkpoints = datos.map((p, i) => ({
          nombre: p.nombre || `Punto ${i + 1}`,
          lat: Array.isArray(p) ? p[0] : p.lat,
          lng: Array.isArray(p) ? p[1] : p.lng
        }));
      }

      redibujar();
      if (nuevos.length) {
        mapa.fitBounds(nuevos.map(p => [p.lat, p.lng]), { padding: [40, 40] });
      }
      $('entrada').value = '';

    } catch (e) {
      err.textContent = `No se pudo leer: ${e.message}`;
      err.hidden = false;
    }
  });

  /* ============================================================
     Controles
     ============================================================ */
  $('btn-deshacer').addEventListener('click', () => {
    if (modo === 'recorrido') puntos.pop();
    else checkpoints.pop();
    redibujar();
  });

  $('btn-limpiar').addEventListener('click', () => {
    const qué = modo === 'recorrido' ? 'el trazado' : 'los puntos de control';
    if (!confirm(`¿Borrar ${qué}? No se puede deshacer.`)) return;
    if (modo === 'recorrido') puntos = [];
    else checkpoints = [];
    redibujar();
  });

  $('btn-copiar').addEventListener('click', async () => {
    const btn = $('btn-copiar');
    try {
      await navigator.clipboard.writeText($('salida').value);
      btn.textContent = 'Copiado';
    } catch (_) {
      $('salida').select();
      btn.textContent = 'Seleccionado — usá Ctrl+C';
    }
    setTimeout(() => { btn.textContent = 'Copiar'; }, 1800);
  });

  $('lista-chk').addEventListener('click', (e) => {
    const b = e.target.closest('[data-quitar]');
    if (!b) return;
    checkpoints.splice(Number(b.dataset.quitar), 1);
    redibujar();
  });

  document.querySelectorAll('[data-modo]').forEach(btn => {
    btn.addEventListener('click', () => {
      modo = btn.dataset.modo;
      document.querySelectorAll('[data-modo]').forEach(b =>
        b.setAttribute('aria-pressed', String(b === btn)));
      $('panel-chk').hidden = modo !== 'checkpoints';
      $('estado-texto').textContent =
        modo === 'recorrido' ? 'Modo recorrido' : 'Modo checkpoints';
      $('ayuda-mapa').textContent = modo === 'recorrido'
        ? 'Hacé clic sobre las avenidas para ir agregando puntos. Arrastrá un punto para corregirlo. Clic derecho sobre un punto lo borra.'
        : 'Escribí el nombre y hacé clic donde va el punto de control. Arrastrá para reubicar, clic derecho para borrar.';
      redibujar();
    });
  });

  document.querySelectorAll('[data-salida]').forEach(btn => {
    btn.addEventListener('click', () => {
      formatoSalida = btn.dataset.salida;
      document.querySelectorAll('[data-salida]').forEach(b =>
        b.setAttribute('aria-pressed', String(b === btn)));
      actualizarSalida();
    });
  });

  /* Deshacer con Ctrl+Z mientras no se esté escribiendo en un campo */
  document.addEventListener('keydown', (e) => {
    const escribiendo = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (!escribiendo && (e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      $('btn-deshacer').click();
    }
  });

  /* ============================================================
     Arranque
     ============================================================ */
  iniciarMapa();

  /* Se precarga el trazado de ejemplo para tener de dónde partir; el
     primer clic en Limpiar lo borra. */
  if (window.CHUTILLOS_MOCK && window.CHUTILLOS_MOCK.RECORRIDO) {
    puntos = window.CHUTILLOS_MOCK.RECORRIDO.map(p => ({ lat: p[0], lng: p[1] }));
  }
  redibujar();
  if (puntos.length) {
    mapa.fitBounds(puntos.map(p => [p.lat, p.lng]), { padding: [40, 40] });
  }
})();
