# Ch'utillos 2026 — Puesta en producción

Pasos para pasar del modo de datos de ejemplo al sistema real.
Hoy el módulo funciona completo con datos mock; nada de lo de abajo es
necesario para verlo funcionar en local.

---

## 1. Crear el proyecto en Supabase

1. Entrar a [supabase.com](https://supabase.com) y crear un proyecto nuevo
   (plan gratuito alcanza).
2. Elegir la región más cercana a Bolivia — **South America (São Paulo)**
   es la que menos latencia da.
3. Guardar la contraseña de la base en un gestor de contraseñas.

En **Project Settings → API** quedan las tres credenciales que hacen falta:

| Credencial | Dónde se usa | ¿Secreta? |
|---|---|---|
| Project URL | `chutillos/scripts/config.js` y el Worker | No |
| `anon` public key | `chutillos/scripts/config.js` | No — viaja al navegador |
| `service_role` key | Solo el Worker de Cloudflare | **Sí. Nunca en el frontend** |

> La `service_role` key saltea todas las políticas RLS. Si termina en el
> navegador, cualquiera puede borrar la base entera. Va únicamente como
> secreto de Cloudflare.

---

## 2. Crear el esquema

Abrir **SQL Editor** en Supabase, pegar el contenido completo de
[`schema.sql`](schema.sql) y ejecutar.

Después correr la consulta de verificación que está comentada al final del
archivo: las cinco tablas deben aparecer con `rowsecurity = true`.

---

## 3. Cargar los datos reales

Cuando llegue el Rol de Ingreso de la AFFAP:

1. **Fraternidades** — importar por CSV desde el Table Editor, o generar
   los `INSERT`. Columnas: `id`, `nombre`, `tipo`, `dia`, `modo_tracking`,
   `orden_ingreso`, `hora_estimada`, `token_portador`.
2. **Checkpoints** — un registro por punto, con `lat`/`lng` reales y
   `orden_en_recorrido` según la dirección del desfile.
3. **Recorrido** — las coordenadas del trazado, en orden.

### Generar los tokens

Los tokens son la única credencial de portadores y voluntarios, así que
tienen que ser imposibles de adivinar. Desde el SQL Editor:

```sql
-- Portadores: solo las fraternidades marcadas como GPS
update fraternidades
set token_portador = 'por-' || id || '-' || encode(gen_random_bytes(6), 'hex')
where modo_tracking = 'gps'
  and token_portador is null;

-- Voluntarios de checkpoint
update checkpoints
set token_voluntario = 'vol-' || id || '-' || encode(gen_random_bytes(6), 'hex')
where token_voluntario is null;
```

Los enlaces armados salen del panel admin, pestaña **Enlaces**.

---

## 4. Configurar el frontend

En [`chutillos/scripts/config.js`](../chutillos/scripts/config.js):

```js
USAR_MOCK: false,
SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOi...',
```

Nada más cambia. La capa de datos detecta la bandera y usa PostgREST en
lugar del dataset de ejemplo.

> Si `USAR_MOCK` queda en `false` pero falta alguna credencial, la página
> vuelve sola a los datos de ejemplo y lo avisa por consola, en vez de
> quedar en blanco.

Para probar sin tocar el archivo: `?mock=0` o `?mock=1` en la URL.

---

## 5. Configurar el Worker de Cloudflare

El Worker existe para que el panel admin pueda escribir sin exponer la
`service_role` key. Ver [`../worker/index.js`](../worker/index.js).

```bash
# URL del proyecto (variable normal, no secreta)
npx wrangler deploy --var SUPABASE_URL:https://xxxxxxxx.supabase.co

# Secretos: se piden por consola y no quedan en el repositorio
npx wrangler secret put ADMIN_PIN
npx wrangler secret put SESSION_SECRET
npx wrangler secret put SUPABASE_SERVICE_KEY
```

Para `SESSION_SECRET` sirve cualquier cadena larga y aleatoria:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Desplegar:

```bash
npx wrangler deploy
```

---

## 6. Comprobaciones antes del evento

- [ ] Las cinco tablas tienen `rowsecurity = true`.
- [ ] Un `POST` directo a `/rest/v1/fraternidades` con la anon key
      devuelve 401 o 403.
- [ ] `GET /rest/v1/fraternidades?select=token_portador` con la anon key
      falla — los tokens no deben ser legibles.
- [ ] Un enlace de portador abre, pide permiso de ubicación y registra un
      ping en `posiciones_gps`.
- [ ] Un enlace de checkpoint registra en `reportes_checkpoint`.
- [ ] La página pública muestra esa posición dentro de los ~15 s
      siguientes.
- [ ] En modo avión: el reporte queda pendiente y se envía solo al volver
      la señal.
- [ ] El PIN incorrecto en el panel admin devuelve 401.

---

## 7. Cosas que conviene tener presentes el día del evento

**El Wake Lock es el punto frágil del portador GPS.** Si la pantalla del
celular se apaga, el navegador congela los temporizadores y la transmisión
se detiene. La página pide un Wake Lock para evitarlo, pero conviene que
cada portador lleve **batería portátil** y tenga el brillo al mínimo. Es
una limitación real de cualquier tracker que corra en el navegador, no de
esta implementación en particular.

**El plan gratuito de Supabase tiene límites.** La lectura pública usa
polling en vez de websockets justamente para no chocar contra el tope de
conexiones concurrentes, pero conviene mirar el uso en el dashboard el
día 28 y tener a mano la posibilidad de subir de plan si el tráfico
sorprende.

**El recorrido dibujado hoy es referencial.** Está marcado como tal en el
mapa. Hay que reemplazarlo por las coordenadas reales antes del 28, o
quitar el aviso solo cuando ya sean las verdaderas.
