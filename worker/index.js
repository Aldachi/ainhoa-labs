/* ============================================
   AINHOA LABS — Worker de Cloudflare
   ============================================

   Sirve el sitio estático y expone /api/admin/* para las escrituras del
   panel de administración de Ch'utillos.

   Por qué existe este archivo
   ---------------------------
   La anon key de Supabase viaja al navegador; es pública por diseño. Si el
   panel admin escribiera con esa clave, cualquiera que abriera las
   herramientas de desarrollo podría borrar las 115 fraternidades en pleno
   evento, por más PIN que hubiera en el formulario. Un PIN validado solo
   en el cliente no es una restricción de acceso, es una sugerencia.

   Acá el PIN se verifica del lado del servidor y las escrituras se hacen
   con la service key, que nunca sale de Cloudflare. Las políticas RLS de
   Supabase bloquean toda escritura directa con la anon key
   (ver supabase/schema.sql).

   Variables de entorno requeridas
   -------------------------------
     ADMIN_PIN            secreto  — PIN del panel
     SESSION_SECRET       secreto  — clave para firmar sesiones
     SUPABASE_URL         variable — https://xxxx.supabase.co
     SUPABASE_SERVICE_KEY secreto  — service_role key

   Se cargan con:
     npx wrangler secret put ADMIN_PIN
     npx wrangler secret put SESSION_SECRET
     npx wrangler secret put SUPABASE_SERVICE_KEY
   ============================================ */

const DURACION_SESION_MS = 8 * 60 * 60 * 1000; /* 8 h: cubre una jornada */

/* Tablas que el panel puede tocar. Lista blanca explícita: evita que un
   error de la interfaz termine escribiendo en una tabla que no debía. */
const TABLAS_PERMITIDAS = new Set([
  'fraternidades',
  'checkpoints',
  'recorrido'
]);

/* El binding de assets apunta a la raíz del repositorio, así que sin este
   filtro el sitio serviría también la documentación interna, el esquema de
   la base y el código del propio Worker. Nada de eso tiene secretos —
   viven como variables de entorno de Cloudflare — pero publicar el esquema
   le regala a cualquiera el mapa exacto de funciones y políticas contra el
   que probar. */
const RUTAS_PRIVADAS = [
  /^\/worker\//i,
  /^\/supabase\//i,
  /^\/\.claude\//i,
  /^\/design-system\//i,
  /^\/wrangler\.jsonc$/i,
  /^\/[^/]*\.md$/i,        // KNOWLEDGE-BASE.md y demás en la raíz
  /^\/\.git/i
];

function esRutaPrivada(pathname) {
  return RUTAS_PRIVADAS.some(re => re.test(pathname));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/admin')) {
      try {
        return await manejarAdmin(request, env, url);
      } catch (err) {
        return json({ error: 'Error interno', detalle: String(err && err.message) }, 500);
      }
    }

    if (esRutaPrivada(url.pathname)) {
      return new Response('No encontrado', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    /* Cualquier otra ruta la resuelven los archivos estáticos */
    return env.ASSETS.fetch(request);
  }
};

/* ============================================================
   Enrutado del panel
   ============================================================ */
async function manejarAdmin(request, env, url) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cabecerasCors() });
  }

  const ruta = url.pathname.replace(/^\/api\/admin\/?/, '');

  if (!env.ADMIN_PIN || !env.SESSION_SECRET || !env.SUPABASE_SERVICE_KEY || !env.SUPABASE_URL) {
    return json({ error: 'El Worker no tiene configuradas las variables de entorno' }, 503);
  }

  /* ---- Autenticación ---- */
  if (ruta === 'auth' && request.method === 'POST') {
    const { pin } = await leerJson(request);

    if (!pin || !comparacionConstante(String(pin), env.ADMIN_PIN)) {
      /* Retardo fijo ante PIN incorrecto: encarece la fuerza bruta.
         No es un rate limiter completo — para eso haría falta KV o
         Durable Objects. Suficiente para el alcance de este panel. */
      await esperar(1200);
      return json({ error: 'PIN incorrecto' }, 401);
    }

    const expira = Date.now() + DURACION_SESION_MS;
    const token = await firmarSesion(expira, env.SESSION_SECRET);
    return json({ token, expira });
  }

  /* ---- De acá en adelante hace falta sesión válida ---- */
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');

  if (!(await verificarSesion(token, env.SESSION_SECRET))) {
    return json({ error: 'Sesión inválida o vencida' }, 401);
  }

  /* ---- Operaciones sobre tablas ---- */
  const [tabla] = ruta.split('/');

  if (!TABLAS_PERMITIDAS.has(tabla)) {
    return json({ error: `Tabla no permitida: ${tabla}` }, 400);
  }

  const destino = new URL(`${env.SUPABASE_URL}/rest/v1/${tabla}`);
  /* Se reenvían los filtros de PostgREST tal cual (?id=eq.xxx, order, etc.) */
  url.searchParams.forEach((v, k) => destino.searchParams.append(k, v));

  const cabeceras = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': request.headers.get('Prefer') || 'return=representation'
  };

  const init = { method: request.method, headers: cabeceras };
  if (!['GET', 'HEAD', 'DELETE'].includes(request.method)) {
    init.body = await request.text();
  }

  const res = await fetch(destino.toString(), init);
  const cuerpo = await res.text();

  return new Response(cuerpo, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...cabecerasCors() }
  });
}

/* ============================================================
   Sesión firmada (HMAC-SHA256)
   ------------------------------------------------------------
   Formato: <expiraEnMs>.<firmaBase64Url>
   Sin estado del lado del servidor: el Worker no guarda sesiones.
   ============================================================ */
async function firmarSesion(expira, secreto) {
  const datos = String(expira);
  const firma = await hmac(datos, secreto);
  return `${datos}.${firma}`;
}

async function verificarSesion(token, secreto) {
  if (!token || !token.includes('.')) return false;

  const [datos, firma] = token.split('.');
  const expira = Number(datos);

  if (!Number.isFinite(expira) || Date.now() > expira) return false;

  const esperada = await hmac(datos, secreto);
  return comparacionConstante(firma, esperada);
}

async function hmac(mensaje, secreto) {
  const enc = new TextEncoder();
  const clave = await crypto.subtle.importKey(
    'raw', enc.encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const firma = await crypto.subtle.sign('HMAC', clave, enc.encode(mensaje));
  return base64Url(new Uint8Array(firma));
}

function base64Url(bytes) {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* Comparación en tiempo constante: no filtra información por cuánto tarda
   en fallar. Relevante tanto para el PIN como para la firma de sesión. */
function comparacionConstante(a, b) {
  const sa = String(a);
  const sb = String(b);
  if (sa.length !== sb.length) return false;
  let dif = 0;
  for (let i = 0; i < sa.length; i++) {
    dif |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return dif === 0;
}

/* ============================================================
   Utilidades
   ============================================================ */
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cabecerasCors() }
  });
}

function cabecerasCors() {
  /* El panel se sirve desde el mismo origen que el Worker, así que no hace
     falta abrir CORS a terceros. */
  return {
    'Access-Control-Allow-Origin': 'same-origin',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Prefer',
    'Cache-Control': 'no-store'
  };
}

async function leerJson(request) {
  try { return await request.json(); } catch (_) { return {}; }
}

function esperar(ms) {
  return new Promise(r => setTimeout(r, ms));
}
