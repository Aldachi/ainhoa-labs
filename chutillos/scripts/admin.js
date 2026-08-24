/* ============================================
   CH'UTILLOS 2026 — Panel de administración
   ============================================

   En modo Supabase, el PIN se valida contra el Worker de Cloudflare y toda
   escritura pasa por él: la service key nunca llega al navegador. Ver
   worker/index.js.

   En modo mock no hay Worker ni backend, así que el panel entra con
   cualquier PIN y solo permite mirar. Se avisa en pantalla para que nadie
   confunda esta pantalla con el sistema real.
   ============================================ */

(() => {
  'use strict';

  const CFG = window.CHUTILLOS_CONFIG;
  const Datos = window.CHUTILLOS_DATOS;
  const U = window.CHUTILLOS_UTIL;

  const CLAVE_SESION = 'chutillos:admin:sesion';

  let sesion = null;
  let fraternidades = [];
  let checkpoints = [];

  const $ = id => document.getElementById(id);

  /* ============================================================
     Sesión
     ============================================================ */
  $('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = $('pin').value.trim();
    const btn = $('btn-login');

    $('login-error').hidden = true;
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
      if (CFG.USAR_MOCK) {
        /* Sin backend no hay nada contra qué validar. Se entra en modo
           lectura y se avisa con claridad. */
        sesion = { token: null, mock: true };
      } else {
        const res = await fetch(`${CFG.ADMIN_API}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || `Error ${res.status}`);
        }
        const d = await res.json();
        sesion = { token: d.token, expira: d.expira };
        try { sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion)); } catch (_) {}
      }
      await entrar();
    } catch (err) {
      $('login-error').textContent = err.message;
      $('login-error').hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });

  /* Si ya había sesión válida en esta pestaña, se reanuda */
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE_SESION) || 'null');
    if (guardada && guardada.expira && Date.now() < guardada.expira) {
      sesion = guardada;
      entrar();
    }
  } catch (_) {}

  async function entrar() {
    $('panel-login').hidden = true;
    $('panel-admin').hidden = false;
    $('aviso-mock').hidden = !CFG.USAR_MOCK;
    pintarEstado(CFG.USAR_MOCK ? 'pendiente' : 'vivo',
                 CFG.USAR_MOCK ? 'Modo ejemplo' : 'Sesión activa');
    await cargar();
  }

  /* ============================================================
     Carga
     ============================================================ */
  async function cargar() {
    [fraternidades, checkpoints] = await Promise.all([
      Datos.getFraternidades(),
      Datos.getCheckpoints()
    ]);

    /* Los tokens no vienen en el listado público. En modo mock se leen del
       dataset de ejemplo; con Supabase los trae el Worker. */
    if (CFG.USAR_MOCK) {
      fraternidades = window.CHUTILLOS_MOCK.fraternidades;
      checkpoints = window.CHUTILLOS_MOCK.checkpoints;
    } else {
      try {
        const [fr, ck] = await Promise.all([
          apiAdmin('fraternidades?select=*&order=dia.asc,orden_ingreso.asc'),
          apiAdmin('checkpoints?select=*&order=orden_en_recorrido.asc')
        ]);
        fraternidades = fr;
        checkpoints = ck;
      } catch (err) {
        console.error('[admin] No se pudieron traer los tokens', err);
      }
    }

    pintarFraternidades();
    pintarCheckpoints();
    pintarEnlaces();
    await pintarEstadoTabla();
  }

  async function apiAdmin(ruta, opciones = {}) {
    const res = await fetch(`${CFG.ADMIN_API}/${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sesion.token}`,
        ...(opciones.headers || {})
      }
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `Error ${res.status}`);
    }
    return res.json();
  }

  /* ============================================================
     Tablas
     ============================================================ */
  function pintarFraternidades() {
    $('tbody-frats').innerHTML = fraternidades.map(f => `
      <tr>
        <td>${U.esc(U.etiquetaDia(f.dia))}</td>
        <td>${f.orden_ingreso}</td>
        <td>${U.esc(f.nombre)}</td>
        <td>${U.esc(f.tipo)}</td>
        <td>${f.modo_tracking === 'gps'
              ? '<span style="color:var(--color-accent)">GPS</span>'
              : 'Checkpoint'}</td>
        <td>${U.esc(f.hora_estimada)}</td>
      </tr>`).join('');
  }

  function pintarCheckpoints() {
    $('tbody-chks').innerHTML = checkpoints.map(c => `
      <tr>
        <td>${c.orden_en_recorrido}</td>
        <td>${U.esc(c.nombre)}</td>
        <td>${c.lat}</td>
        <td>${c.lng}</td>
      </tr>`).join('');
  }

  function pintarEnlaces() {
    const base = location.origin +
      location.pathname.replace(/\/admin\/.*$/, '');

    const portadores = fraternidades.filter(f => f.modo_tracking === 'gps');

    /* Sin portadores GPS la sección entera se oculta: una tabla vacía
       hace dudar de si falta cargar algo o si está roto. */
    $('seccion-portadores').hidden = !CFG.GPS_HABILITADO || portadores.length === 0;

    $('tbody-portadores').innerHTML = portadores.map(f => {
      const url = `${base}/portador/?t=${encodeURIComponent(f.token_portador || '')}`;
      return `
        <tr>
          <td>${U.esc(f.nombre)}</td>
          <td>${U.esc(U.etiquetaDia(f.dia))}</td>
          <td><code>${U.esc(url)}</code></td>
          <td><button class="chx-link-copiar" data-url="${U.esc(url)}">Copiar</button></td>
        </tr>`;
    }).join('');

    $('tbody-voluntarios').innerHTML = checkpoints.map(c => {
      const url = `${base}/checkpoint/?t=${encodeURIComponent(c.token_voluntario || '')}`;
      return `
        <tr>
          <td>${U.esc(c.nombre)}</td>
          <td>${c.orden_en_recorrido}</td>
          <td><code>${U.esc(url)}</code></td>
          <td><button class="chx-link-copiar" data-url="${U.esc(url)}">Copiar</button></td>
        </tr>`;
    }).join('');
  }

  async function pintarEstadoTabla() {
    let posiciones = [];
    try {
      posiciones = await Datos.getUltimasPosiciones();
    } catch (_) {}

    const porId = new Map(posiciones.map(p => [p.fraternidad_id, p]));

    $('tbody-estado').innerHTML = fraternidades.map(f => {
      const p = porId.get(f.id);
      const fres = U.frescura(p && p.timestamp);
      return `
        <tr>
          <td>${U.esc(f.nombre)}</td>
          <td>${U.esc(U.etiquetaDia(f.dia))}</td>
          <td>${p ? U.esc(p.origen) : '<span style="color:var(--color-muted)">—</span>'}</td>
          <td><span class="chx-badge" data-frescura="${fres}">${
            p ? U.esc(U.haceCuanto(p.timestamp)) : 'Sin reportes'
          }</span></td>
        </tr>`;
    }).join('');
  }

  /* ============================================================
     Copiar enlaces
     ============================================================ */
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.chx-link-copiar');
    if (!btn) return;

    const url = btn.dataset.url;
    try {
      await navigator.clipboard.writeText(url);
      const antes = btn.textContent;
      btn.textContent = 'Copiado';
      setTimeout(() => { btn.textContent = antes; }, 1500);
    } catch (_) {
      /* Sin permiso de portapapeles: se selecciona para copiar a mano */
      const rango = document.createRange();
      rango.selectNodeContents(btn.closest('tr').querySelector('code'));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(rango);
    }
  });

  /* ============================================================
     Pestañas
     ============================================================ */
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(b => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      ['fraternidades', 'checkpoints', 'enlaces', 'estado'].forEach(t => {
        $(`tab-${t}`).hidden = t !== btn.dataset.tab;
      });
      if (btn.dataset.tab === 'estado') pintarEstadoTabla();
    });
  });

  function pintarEstado(tipo, texto) {
    $('estado').dataset.estado = tipo;
    $('estado-texto').textContent = texto;
  }
})();
