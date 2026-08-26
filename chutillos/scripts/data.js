/* ============================================
   CH'UTILLOS 2026 — Capa de datos
   ============================================

   Toda la aplicación habla con `Datos`. Debajo hay dos implementaciones
   intercambiables que exponen exactamente la misma interfaz:

     FuenteMock      → datos de ejemplo en memoria
     FuenteSupabase  → PostgREST vía fetch, sin SDK ni build step

   Cambiar de una a otra es una bandera en config.js. Ningún otro archivo
   sabe cuál está activa.

   Nota sobre escrituras: los pings GPS y los reportes de checkpoint NO
   escriben en las tablas directamente. Van por funciones RPC que validan
   el token del lado del servidor. Las políticas RLS bloquean el acceso
   directo a las tablas con la anon key. Ver supabase/schema.sql.
   ============================================ */

(() => {
  'use strict';

  const CFG = window.CHUTILLOS_CONFIG;

  /* ============================================================
     Implementación con datos de ejemplo
     ============================================================ */
  const FuenteMock = {
    nombre: 'mock',

    async getFraternidades() {
      return clonar(window.CHUTILLOS_MOCK.fraternidades);
    },

    async getCheckpoints() {
      return clonar(window.CHUTILLOS_MOCK.checkpoints);
    },

    async getRecorrido() {
      return clonar(window.CHUTILLOS_MOCK.RECORRIDO);
    },

    async getCalles() {
      return clonar(window.CHUTILLOS_MOCK.CALLES);
    },

    async getUltimasPosiciones() {
      const base = window.CHUTILLOS_MOCK.ultimasPosiciones();

      /* Los reportes hechos en esta sesión pisan a los simulados, para que
         al probar la página de checkpoint el cambio se vea reflejado. */
      const porFrat = new Map(base.map(p => [p.fraternidad_id, p]));

      window.CHUTILLOS_MOCK.reportesEnMemoria.forEach(r => {
        const chk = window.CHUTILLOS_MOCK.checkpoints
          .find(c => c.id === r.checkpoint_id);
        if (!chk) return;
        porFrat.set(r.fraternidad_id, {
          fraternidad_id: r.fraternidad_id,
          origen: 'checkpoint',
          lat: chk.lat,
          lng: chk.lng,
          checkpoint_id: chk.id,
          checkpoint_nombre: chk.nombre,
          timestamp: r.timestamp
        });
      });

      window.CHUTILLOS_MOCK.pingsEnMemoria.forEach(p => {
        porFrat.set(p.fraternidad_id, {
          fraternidad_id: p.fraternidad_id,
          origen: 'gps',
          lat: p.lat,
          lng: p.lng,
          checkpoint_id: null,
          checkpoint_nombre: null,
          timestamp: p.timestamp
        });
      });

      return Array.from(porFrat.values());
    },

    async getFraternidadPorToken(token) {
      const f = window.CHUTILLOS_MOCK.fraternidades
        .find(x => x.token_portador === token);
      return f ? clonar(f) : null;
    },

    async getCheckpointPorToken(token) {
      const c = window.CHUTILLOS_MOCK.checkpoints
        .find(x => x.token_voluntario === token);
      return c ? clonar(c) : null;
    },

    async enviarPing({ token, lat, lng }) {
      const f = await this.getFraternidadPorToken(token);
      if (!f) throw new ErrorPermanente('Token de portador no válido');
      window.CHUTILLOS_MOCK.pingsEnMemoria.push({
        fraternidad_id: f.id,
        lat, lng,
        timestamp: new Date().toISOString()
      });
      return { ok: true };
    },

    async reportarCheckpoint({ token, fraternidad_id }) {
      const c = await this.getCheckpointPorToken(token);
      if (!c) throw new ErrorPermanente('Token de checkpoint no válido');
      window.CHUTILLOS_MOCK.reportesEnMemoria.push({
        fraternidad_id,
        checkpoint_id: c.id,
        timestamp: new Date().toISOString()
      });
      return { ok: true };
    }
  };

  /* ============================================================
     Implementación con Supabase (PostgREST por fetch)
     ============================================================ */
  const FuenteSupabase = {
    nombre: 'supabase',

    _headers() {
      return {
        'apikey': CFG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CFG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      };
    },

    async _get(ruta) {
      const res = await fetch(`${CFG.SUPABASE_URL}/rest/v1/${ruta}`, {
        headers: this._headers()
      });
      if (!res.ok) throw await errorDesdeRespuesta(res);
      return res.json();
    },

    async _rpc(fn, args) {
      const res = await fetch(`${CFG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(args)
      });
      if (!res.ok) throw await errorDesdeRespuesta(res);
      const txt = await res.text();
      return txt ? JSON.parse(txt) : null;
    },

    async getFraternidades() {
      /* token_portador queda fuera del select a propósito: la vista pública
         no debe exponer los tokens. */
      return this._get(
        'fraternidades?select=id,nombre,tipo,dia,modo_tracking,orden_ingreso,hora_estimada' +
        '&order=dia.asc,orden_ingreso.asc'
      );
    },

    async getCheckpoints() {
      return this._get(
        'checkpoints?select=id,nombre,orden_en_recorrido,lat,lng' +
        '&order=orden_en_recorrido.asc'
      );
    },

    async getRecorrido() {
      const filas = await this._get(
        'recorrido?select=lat,lng&order=orden.asc'
      );
      return filas.map(p => [p.lat, p.lng]);
    },

    async getCalles() {
      /* Tabla opcional: si todavía no se creó, la ficha simplemente no
         muestra el nombre de la vía en lugar de romperse. */
      try {
        return await this._get('calles?select=desde,hasta,nombre&order=desde.asc');
      } catch (_) {
        return [];
      }
    },

    async getUltimasPosiciones() {
      /* Vista materializada por DISTINCT ON: una sola fila por fraternidad.
         Una petición por ciclo de polling, sin importar cuántas haya. */
      return this._get('vista_ultima_posicion?select=*');
    },

    async getFraternidadPorToken(token) {
      const r = await this._rpc('fn_portador_por_token', { p_token: token });
      return Array.isArray(r) ? (r[0] || null) : r;
    },

    async getCheckpointPorToken(token) {
      const r = await this._rpc('fn_checkpoint_por_token', { p_token: token });
      return Array.isArray(r) ? (r[0] || null) : r;
    },

    async enviarPing({ token, lat, lng, client_id }) {
      return this._rpc('fn_registrar_ping', {
        p_token: token, p_lat: lat, p_lng: lng, p_client_id: client_id
      });
    },

    async reportarCheckpoint({ token, fraternidad_id, client_id }) {
      return this._rpc('fn_reportar_checkpoint', {
        p_token: token, p_fraternidad_id: fraternidad_id, p_client_id: client_id
      });
    }
  };

  /* ============================================================
     Errores
     ------------------------------------------------------------
     La cola offline necesita distinguir entre "falló la red, reintentá"
     y "esto nunca va a funcionar, descartá" (token inválido, por ejemplo).
     ============================================================ */
  class ErrorPermanente extends Error {
    constructor(msg) { super(msg); this.permanente = true; }
  }

  async function errorDesdeRespuesta(res) {
    let detalle = '';
    try { detalle = (await res.text()).slice(0, 200); } catch (_) {}

    /* 4xx (salvo 408/429) son problemas de la petición, no de la red */
    if (res.status >= 400 && res.status < 500 &&
        res.status !== 408 && res.status !== 429) {
      return new ErrorPermanente(`HTTP ${res.status} ${detalle}`);
    }
    return new Error(`HTTP ${res.status} ${detalle}`);
  }

  function clonar(x) {
    return JSON.parse(JSON.stringify(x));
  }

  /* ============================================================
     Selección de fuente
     ============================================================ */
  const Datos = CFG.USAR_MOCK ? FuenteMock : FuenteSupabase;

  window.CHUTILLOS_DATOS = Datos;
  window.CHUTILLOS_ERRORES = { ErrorPermanente };

  console.info(`[chutillos] Fuente de datos: ${Datos.nombre}`);
})();
