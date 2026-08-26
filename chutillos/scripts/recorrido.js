/* ============================================
   CH'UTILLOS 2026 — Geometría del recorrido
   ============================================

   Biblioteca pura: no conoce los datos del evento, se le pasan.

   Sirve para responder tres preguntas que la interfaz necesita todo el
   tiempo:

     · ¿a cuántos metros del inicio está este punto de control?
     · ¿qué coordenada corresponde al metro N del recorrido?
     · ¿qué pedazo de la polilínea va del metro A al metro B?

   Esa última es la que permite dibujar una fraternidad como una banda
   sobre el trazado en vez de un punto suelto.

   Se trabaja en un plano local en metros. A la escala de Potosí (3.5 km)
   la distorsión frente a una proyección geodésica está muy por debajo del
   error de cualquier estimación de posición que hagamos acá.
   ============================================ */

(() => {
  'use strict';

  const LAT_M = 111320;

  function construir(recorrido, checkpoints, calles) {
    if (!recorrido || recorrido.length < 2) return null;

    const latRef = recorrido[0][0];
    const LNG_M = 111320 * Math.cos(latRef * Math.PI / 180);
    const xy = (la, ln) => [ln * LNG_M, la * LAT_M];

    /* Distancia acumulada hasta cada vértice */
    const acum = [0];
    for (let i = 1; i < recorrido.length; i++) {
      const a = xy(recorrido[i - 1][0], recorrido[i - 1][1]);
      const b = xy(recorrido[i][0], recorrido[i][1]);
      acum.push(acum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    const total = acum[acum.length - 1];

    /** Proyecta una coordenada sobre la polilínea.
        Devuelve { s, desvio } en metros. */
    function proyectar(lat, lng) {
      const p = xy(lat, lng);
      let mejor = { s: 0, desvio: Infinity };

      for (let i = 1; i < recorrido.length; i++) {
        const a = xy(recorrido[i - 1][0], recorrido[i - 1][1]);
        const b = xy(recorrido[i][0], recorrido[i][1]);
        const vx = b[0] - a[0], vy = b[1] - a[1];
        const L2 = vx * vx + vy * vy;
        let t = L2 ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2 : 0;
        t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
        if (d < mejor.desvio) {
          mejor = { s: acum[i - 1] + t * Math.sqrt(L2), desvio: d };
        }
      }
      return mejor;
    }

    /** Coordenada en el metro `s` del recorrido. */
    function puntoEn(s) {
      const d = Math.max(0, Math.min(total, s));
      for (let i = 1; i < acum.length; i++) {
        if (d <= acum[i]) {
          const largo = acum[i] - acum[i - 1] || 1;
          const t = (d - acum[i - 1]) / largo;
          return [
            recorrido[i - 1][0] + (recorrido[i][0] - recorrido[i - 1][0]) * t,
            recorrido[i - 1][1] + (recorrido[i][1] - recorrido[i - 1][1]) * t
          ];
        }
      }
      return recorrido[recorrido.length - 1].slice();
    }

    /** Pedazo de polilínea entre dos metros, con los vértices intermedios
        incluidos para que la banda siga las curvas de las calles en vez de
        cortar en línea recta. */
    function tramo(desde, hasta) {
      let a = Math.max(0, Math.min(total, desde));
      let b = Math.max(0, Math.min(total, hasta));
      if (b < a) [a, b] = [b, a];

      const pts = [puntoEn(a)];
      for (let i = 0; i < acum.length; i++) {
        if (acum[i] > a && acum[i] < b) pts.push(recorrido[i].slice());
      }
      pts.push(puntoEn(b));
      return pts;
    }

    /* ---- Checkpoints situados sobre el recorrido ---- */
    const porId = new Map();
    const ordenados = (checkpoints || [])
      .map(c => {
        const { s, desvio } = proyectar(c.lat, c.lng);
        const info = { id: c.id, nombre: c.nombre, s, desvio, ref: c };
        porId.set(c.id, info);
        return info;
      })
      .sort((x, y) => x.s - y.s);

    /** Metro del recorrido donde está un checkpoint. */
    function sDe(chkId) {
      const c = porId.get(chkId);
      return c ? c.s : null;
    }

    /** El checkpoint siguiente al dado, o null si es el último. */
    function siguiente(chkId) {
      const i = ordenados.findIndex(c => c.id === chkId);
      return (i >= 0 && i < ordenados.length - 1) ? ordenados[i + 1] : null;
    }

    /* Los límites de calle pueden venir en metros o como id de checkpoint
       ('chk-02'). Se resuelven una sola vez acá: en la calle el recorrido
       se piensa por puntos de control, no por metros, y así el dato sigue
       siendo correcto aunque después se muevan los puntos. */
    const callesResueltas = (calles || []).map(c => {
      const aMetros = v => {
        if (typeof v === 'number') return v;
        const s = sDe(v);
        return s == null ? null : s;
      };
      return {
        ...c,
        desde: aMetros(c.desde) ?? 0,
        hasta: aMetros(c.hasta) ?? total
      };
    }).filter(c => c.hasta > c.desde)
      .sort((a, b) => a.desde - b.desde);

    /** Tramo de vía en el metro `s`, o null si no hay tabla cargada. */
    function calleObjEn(s) {
      if (!callesResueltas.length) return null;
      const d = Math.max(0, Math.min(total, s));
      return callesResueltas.find(x => d >= x.desde && d < x.hasta)
          || callesResueltas[callesResueltas.length - 1];
    }

    /** Nombre de la vía en el metro `s`. */
    function calleEn(s) {
      const c = calleObjEn(s);
      return c ? c.nombre : null;
    }

    /** ¿El metro `s` cae en el tramo final del recorrido? */
    function esFinal(s) {
      const c = calleObjEn(s);
      return !!(c && c.esFinal);
    }

    /** Nombre del tramo de largada, para las que aún no salieron. */
    function calleDeSalida() {
      return callesResueltas.length ? callesResueltas[0].nombre : null;
    }

    return {
      total,
      checkpoints: ordenados,
      calles: callesResueltas,
      proyectar,
      puntoEn,
      tramo,
      sDe,
      siguiente,
      calleEn,
      calleObjEn,
      esFinal,
      calleDeSalida
    };
  }

  window.CHUTILLOS_RECORRIDO = { construir };
})();
