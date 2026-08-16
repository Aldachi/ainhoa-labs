/* ============================================
   CH'UTILLOS 2026 — Cola de envíos con reintento
   ============================================

   El evento ocurre en la calle, con miles de personas saturando la red
   móvil. Un reporte de checkpoint que se pierde porque justo no había
   señal es un fallo inaceptable: el voluntario ya hizo su trabajo.

   Esta cola:
     · persiste en localStorage, así que sobrevive a recargas y a que el
       navegador mate la pestaña;
     · reintenta con backoff exponencial y tope;
     · descarta solo los envíos que fallan de forma permanente (token
       inválido), nunca los que fallan por red;
     · deduplica por `client_id`, para que un doble toque o un reintento
       tras un timeout ambiguo no genere dos registros.

   La UI se suscribe con onCambio() para mostrar cuántos envíos quedan
   pendientes.
   ============================================ */

(() => {
  'use strict';

  const CFG = window.CHUTILLOS_CONFIG;
  const { ErrorPermanente } = window.CHUTILLOS_ERRORES;

  const CLAVE = 'chutillos:cola:v1';

  class Cola {
    constructor(nombre) {
      this.clave = `${CLAVE}:${nombre}`;
      this.items = this._cargar();
      this.suscriptores = [];
      this.enVuelo = false;
      this.timer = null;

      /* Reintento inmediato cuando vuelve la conexión */
      window.addEventListener('online', () => this.procesar());

      /* Reintento al volver a la pestaña */
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.procesar();
      });

      /* Arranque: si quedaron pendientes de una sesión anterior, salen ya */
      if (this.items.length) this.procesar();
    }

    /* ---- API pública ---- */

    /** Encola un envío. `fn` recibe el payload y debe devolver una promesa. */
    encolar(payload, fn) {
      const item = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        payload,
        intentos: 0,
        creado: Date.now()
      };

      /* Dedupe: si ya hay un pendiente con el mismo client_id, no se duplica */
      if (payload.client_id &&
          this.items.some(i => i.payload.client_id === payload.client_id)) {
        return item.id;
      }

      this.items.push(item);
      this._guardar();
      this._notificar();

      this._fn = fn;
      this.procesar();
      return item.id;
    }

    /** Cancela un envío que todavía no salió. Devuelve true si lo alcanzó. */
    cancelar(id) {
      const antes = this.items.length;
      this.items = this.items.filter(i => i.id !== id);
      const quitado = this.items.length < antes;
      if (quitado) {
        this._guardar();
        this._notificar();
      }
      return quitado;
    }

    get pendientes() {
      return this.items.length;
    }

    onCambio(fn) {
      this.suscriptores.push(fn);
      fn(this.estado());
    }

    estado() {
      return {
        pendientes: this.items.length,
        enLinea: navigator.onLine,
        masAntiguo: this.items.length
          ? Date.now() - this.items[0].creado
          : 0
      };
    }

    /* ---- Motor ---- */

    async procesar() {
      if (this.enVuelo || !this.items.length || !this._fn) return;
      if (!navigator.onLine) {
        this._reprogramar(CFG.COLA_REINTENTO_BASE_MS);
        return;
      }

      this.enVuelo = true;
      const item = this.items[0];

      try {
        await this._fn(item.payload);

        /* Salió bien: fuera de la cola */
        this.items.shift();
        this._guardar();
        this._notificar();
        this.enVuelo = false;

        /* Encadena el siguiente sin esperar */
        if (this.items.length) this.procesar();

      } catch (err) {
        this.enVuelo = false;
        item.intentos++;

        const descartar =
          err instanceof ErrorPermanente ||
          err.permanente === true ||
          item.intentos >= CFG.COLA_MAX_INTENTOS;

        if (descartar) {
          console.error('[cola] Envío descartado:', err.message, item.payload);
          this.items.shift();
          this._guardar();
          this._notificar();
          if (this.items.length) this.procesar();
          return;
        }

        /* Backoff exponencial con tope y algo de jitter para no sincronizar
           a todos los voluntarios en el mismo instante */
        const espera = Math.min(
          CFG.COLA_REINTENTO_BASE_MS * Math.pow(2, item.intentos - 1),
          CFG.COLA_REINTENTO_MAX_MS
        );
        const jitter = Math.random() * 0.3 * espera;

        this._guardar();
        this._notificar();
        this._reprogramar(espera + jitter);
      }
    }

    _reprogramar(ms) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.procesar(), ms);
    }

    /* ---- Persistencia ---- */

    _cargar() {
      try {
        const raw = localStorage.getItem(this.clave);
        return raw ? JSON.parse(raw) : [];
      } catch (_) {
        return [];
      }
    }

    _guardar() {
      try {
        localStorage.setItem(this.clave, JSON.stringify(this.items));
      } catch (_) {
        /* Sin localStorage (modo privado, cuota llena): la cola sigue
           funcionando en memoria. Se pierde al recargar, pero no rompe. */
      }
    }

    _notificar() {
      const e = this.estado();
      this.suscriptores.forEach(fn => {
        try { fn(e); } catch (_) {}
      });
    }
  }

  window.CHUTILLOS_COLA = Cola;
})();
