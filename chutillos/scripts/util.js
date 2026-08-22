/* ============================================
   CH'UTILLOS 2026 — Utilidades compartidas
   ============================================ */

(() => {
  'use strict';

  const CFG = window.CHUTILLOS_CONFIG;

  const Util = {

    /** "hace 3 min" / "hace 1 h 20 min" / "recién" */
    haceCuanto(iso) {
      if (!iso) return null;
      const ms = Date.now() - new Date(iso).getTime();
      if (ms < 0) return 'recién';

      const min = Math.floor(ms / 60000);
      if (min < 1) return 'recién';
      if (min === 1) return 'hace 1 min';
      if (min < 60) return `hace ${min} min`;

      const h = Math.floor(min / 60);
      const resto = min % 60;
      if (h === 1 && resto === 0) return 'hace 1 h';
      if (resto === 0) return `hace ${h} h`;
      return `hace ${h} h ${resto} min`;
    },

    /** Clasifica la antigüedad del dato: 'fresco' | 'tibio' | 'viejo' */
    frescura(iso) {
      if (!iso) return 'sin-dato';
      const min = (Date.now() - new Date(iso).getTime()) / 60000;
      if (min <= CFG.FRESCO_MIN) return 'fresco';
      if (min <= CFG.TIBIO_MIN) return 'tibio';
      return 'viejo';
    },

    /* Puntuacion que se ignora al buscar. Varias fraternidades del rol
       llevan apostrofo ("Jaik'as", "Warak'aku", "Tolck'as"), comillas
       ("Mejillones \"B\"") o puntos ("I.N.A.D.I."). Nadie los va a teclear
       en un celular parado en la calle, asi que se descartan de los dos
       lados de la comparacion. Se listan por codepoint para no depender
       de caracteres raros en el codigo fuente. */
    _PUNTUACION: new Set([
      0x27,   // '  apostrofo
      0x22,   // "  comilla doble
      0x2018, // comilla simple izquierda
      0x2019, // comilla simple derecha (la que ponen los celulares)
      0x201C, // comilla doble izquierda
      0x201D, // comilla doble derecha
      0x2E,   // .  punto
      0x2D,   // -  guion
      0x2013, // guion medio
      0x2014  // raya
    ]),

    /** Normaliza para busqueda: minusculas, sin acentos y sin puntuacion.
        Se recorre por codepoint en vez de usar un regex con marcas
        combinantes, para no depender de caracteres invisibles en el
        codigo fuente. */
    normalizar(s) {
      const desc = (s || '').normalize('NFD');
      let out = '';
      for (const ch of desc) {
        const c = ch.codePointAt(0);
        /* Bloque Combining Diacritical Marks */
        if (c >= 0x300 && c <= 0x36f) continue;
        if (this._PUNTUACION.has(c)) continue;
        out += ch;
      }
      return out.toLowerCase();
    },

    /** Distancia en metros entre dos coordenadas (haversine) */
    distanciaM(lat1, lng1, lat2, lng2) {
      const R = 6371000;
      const rad = Math.PI / 180;
      const dLat = (lat2 - lat1) * rad;
      const dLng = (lng2 - lng1) * rad;
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
                Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    },

    /** Lee un parámetro de la URL */
    param(nombre) {
      return new URLSearchParams(location.search).get(nombre);
    },

    /** Escapa texto antes de meterlo en innerHTML */
    esc(s) {
      const d = document.createElement('div');
      d.textContent = s == null ? '' : String(s);
      return d.innerHTML;
    },

    /** Etiqueta legible del día */
    etiquetaDia(dia) {
      const d = CFG.DIAS.find(x => x.dia === Number(dia));
      return d ? d.etiqueta : `Día ${dia}`;
    },

    /** Día del evento que corresponde a hoy, o null si no estamos en fechas */
    diaActual() {
      const hoy = new Date();
      if (hoy.getFullYear() !== 2026 || hoy.getMonth() !== 7) return null;
      const d = hoy.getDate();
      return CFG.DIAS.some(x => x.dia === d) ? d : null;
    },

    /** Identificador estable de este dispositivo, para claves idempotentes */
    idDispositivo() {
      const K = 'chutillos:dispositivo';
      let v = null;
      try { v = localStorage.getItem(K); } catch (_) {}
      if (!v) {
        v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()))
          .slice(0, 8);
        try { localStorage.setItem(K, v); } catch (_) {}
      }
      return v;
    }
  };

  window.CHUTILLOS_UTIL = Util;
})();
