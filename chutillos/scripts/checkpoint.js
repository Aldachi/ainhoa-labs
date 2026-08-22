/* ============================================
   CH'UTILLOS 2026 — Punto de control
   ============================================

   Pantalla pensada para un voluntario parado en la calle, con una mano
   ocupada, ruido, sol de frente y señal intermitente:

   · Un toque = un reporte. Sin confirmaciones ni diálogos.
   · Confirmación optimista: el botón cambia al instante, aunque el envío
     todavía no haya salido. El voluntario no espera a la red.
   · Ventana de "deshacer" de 6 s, porque tocar la fila equivocada es el
     error más probable y hay que poder corregirlo sin ayuda.
   · Las fraternidades ya reportadas se van al final de la lista, para que
     arriba queden siempre las que faltan.
   ============================================ */

(() => {
  'use strict';

  const CFG = window.CHUTILLOS_CONFIG;
  const Datos = window.CHUTILLOS_DATOS;
  const U = window.CHUTILLOS_UTIL;
  const Cola = window.CHUTILLOS_COLA;

  const token = U.param('t');
  const MS_DESHACER = 6000;

  let checkpoint = null;
  let fraternidades = [];
  let cola = null;

  /* fraternidad_id -> { ts, colaId } */
  let reportadas = new Map();

  let filtroDia = U.diaActual() || CFG.DIAS[0].dia;
  let filtroTexto = '';
  let timerToast = null;

  const $ = id => document.getElementById(id);

  /* ============================================================
     Arranque
     ============================================================ */
  async function iniciar() {
    if (!token) return mostrarError();

    try {
      checkpoint = await Datos.getCheckpointPorToken(token);
      if (checkpoint) fraternidades = await Datos.getFraternidades();
    } catch (err) {
      console.error('[checkpoint] Error de carga', err);
    }

    if (!checkpoint) return mostrarError();

    $('nombre-chk').textContent = checkpoint.nombre;
    document.title = `${checkpoint.nombre} — Ch'utillos 2026`;
    $('panel-op').hidden = false;

    /* Las marcas de esta jornada se recuerdan en el dispositivo: si el
       navegador recarga la página, el voluntario no pierde lo que ya
       reportó. */
    cargarReportadas();

    cola = new Cola(`checkpoint-${checkpoint.id}`);
    cola.onCambio(e => {
      if (!e.enLinea) pintarEstado('offline', 'Sin señal');
      else if (e.pendientes > 0) pintarEstado('pendiente', `${e.pendientes} por enviar`);
      else pintarEstado('vivo', 'Listo');
    });

    pintarDias();
    pintarLista();
  }

  function mostrarError() {
    $('panel-error').hidden = false;
    pintarEstado('offline', 'Sin acceso');
  }

  /* ============================================================
     Persistencia local de lo ya reportado
     ============================================================ */
  function claveLocal() {
    return `chutillos:reportadas:${checkpoint.id}:${filtroDia}`;
  }

  function cargarReportadas() {
    try {
      const raw = localStorage.getItem(claveLocal());
      reportadas = new Map(raw ? JSON.parse(raw) : []);
    } catch (_) {
      reportadas = new Map();
    }
  }

  function guardarReportadas() {
    try {
      localStorage.setItem(claveLocal(), JSON.stringify(Array.from(reportadas)));
    } catch (_) {}
  }

  /* ============================================================
     Render
     ============================================================ */
  function pintarDias() {
    $('dias').innerHTML = '';
    CFG.DIAS.forEach(d => {
      const b = document.createElement('button');
      b.className = 'chx-dia';
      b.type = 'button';
      b.textContent = d.etiqueta;
      b.title = d.nombre;
      b.setAttribute('aria-pressed', String(d.dia === filtroDia));
      b.addEventListener('click', () => {
        filtroDia = d.dia;
        cargarReportadas();
        pintarDias();
        pintarLista();
      });
      $('dias').appendChild(b);
    });
  }

  function visibles() {
    const q = U.normalizar(filtroTexto).trim();
    return fraternidades
      .filter(f => f.dia === filtroDia)
      .filter(f => !q || U.normalizar(f.nombre).includes(q))
      .sort((a, b) => {
        /* Las pendientes primero; dentro de cada grupo, por orden de ingreso */
        const ra = reportadas.has(a.id) ? 1 : 0;
        const rb = reportadas.has(b.id) ? 1 : 0;
        if (ra !== rb) return ra - rb;
        return a.orden_ingreso - b.orden_ingreso;
      });
  }

  function pintarLista() {
    const items = visibles();
    const cont = $('lista-frats');

    $('vacio').hidden = items.length > 0;
    cont.hidden = items.length === 0;

    const total = fraternidades.filter(f => f.dia === filtroDia).length;
    $('resumen').innerHTML =
      `<b>${reportadas.size}</b> de <b>${total}</b> reportadas en este punto`;

    const frag = document.createDocumentFragment();

    items.forEach(f => {
      const marcada = reportadas.has(f.id);

      const b = document.createElement('button');
      b.className = 'chx-btn-gigante';
      b.type = 'button';
      b.dataset.reportada = String(marcada);
      b.dataset.id = f.id;

      /* El horario solo se muestra si el rol cargado es el definitivo. Con
         el rol de la Pre-Entrada, una hora de otro día en pantalla
         confunde al voluntario justo cuando tiene que decidir rápido. El
         orden de ingreso, en cambio, sí es la referencia que sirve. */
      const referencia = CFG.ROL_OFICIAL
        ? `Ingreso ${f.orden_ingreso} · ${f.hora_estimada}`
        : `Ingreso ${f.orden_ingreso}`;

      const cuando = marcada
        ? U.haceCuanto(new Date(reportadas.get(f.id).ts).toISOString())
        : referencia;

      b.innerHTML =
        `<span>` +
          `<span class="chx-nombre">${U.esc(f.nombre)}</span>` +
          `<span class="chx-sub">${U.esc(cuando)}</span>` +
        `</span>` +
        `<svg class="chx-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" aria-hidden="true">` +
          `<polyline points="4 12 10 18 20 6"/>` +
        `</svg>`;

      b.setAttribute('aria-pressed', String(marcada));
      b.addEventListener('click', () => reportar(f));
      frag.appendChild(b);
    });

    cont.innerHTML = '';
    cont.appendChild(frag);
  }

  /* ============================================================
     Reportar
     ============================================================ */
  function reportar(f) {
    /* Ya estaba marcada: no se vuelve a enviar. Para corregir un error hay
       que usar Deshacer dentro de la ventana. */
    if (reportadas.has(f.id)) {
      mostrarToast(`${f.nombre} ya fue reportada`, null);
      return;
    }

    const ts = Date.now();
    const clientId = `${U.idDispositivo()}-${checkpoint.id}-${f.id}-${ts}`;

    const colaId = cola.encolar(
      {
        token,
        fraternidad_id: f.id,
        client_id: clientId
      },
      payload => Datos.reportarCheckpoint(payload)
    );

    reportadas.set(f.id, { ts, colaId });
    guardarReportadas();
    pintarLista();

    /* Vibración corta como confirmación táctil: el voluntario puede no
       estar mirando la pantalla. */
    if (navigator.vibrate) navigator.vibrate(40);

    mostrarToast(`${f.nombre} reportada`, () => deshacer(f, colaId));
  }

  function deshacer(f, colaId) {
    /* Solo se puede deshacer si el envío todavía no salió. Si ya salió, se
       dice con claridad en vez de fingir que se borró. */
    const alcanzado = cola.cancelar(colaId);

    reportadas.delete(f.id);
    guardarReportadas();
    pintarLista();

    if (!alcanzado) {
      mostrarToast('El reporte ya se había enviado. Avisá a Ainhoa Labs para corregirlo.', null, 8000);
    } else {
      ocultarToast();
    }
  }

  /* ============================================================
     Toast
     ============================================================ */
  function mostrarToast(texto, alDeshacer, duracion = MS_DESHACER) {
    clearTimeout(timerToast);
    $('toast-texto').textContent = texto;

    const btn = $('toast-deshacer');
    btn.hidden = !alDeshacer;
    btn.onclick = alDeshacer || null;

    $('toast').classList.add('visible');
    timerToast = setTimeout(ocultarToast, duracion);
  }

  function ocultarToast() {
    clearTimeout(timerToast);
    $('toast').classList.remove('visible');
  }

  /* ============================================================
     Búsqueda
     ============================================================ */
  let debounce = null;
  $('buscar').addEventListener('input', () => {
    filtroTexto = $('buscar').value;
    $('limpiar').hidden = !filtroTexto;
    clearTimeout(debounce);
    debounce = setTimeout(pintarLista, 120);
  });

  $('limpiar').addEventListener('click', () => {
    $('buscar').value = '';
    filtroTexto = '';
    $('limpiar').hidden = true;
    pintarLista();
    $('buscar').focus();
  });

  function pintarEstado(tipo, texto) {
    $('estado').dataset.estado = tipo;
    $('estado-texto').textContent = texto;
  }

  /* Refresca los "hace X min" de las ya reportadas */
  setInterval(() => {
    if (reportadas.size) pintarLista();
  }, 30000);

  iniciar();
})();
