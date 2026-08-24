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

Estado actual del padrón:

| Dato | Estado |
|---|---|
| Recorrido | ✅ Real — 18 puntos, 3.51 km |
| Nombres de las 115 fraternidades | ✅ Reales — Rol de Ingreso AFFAP |
| Orden y horarios | ⚠️ De la Pre-Entrada (22-23 ago), no del 28-30 |
| Día 30 (ancestrales) | ❌ Sin rol publicado |
| Ubicación de los 7 checkpoints | ✅ Real — [`seed-checkpoints.sql`](seed-checkpoints.sql) |
| Nombres de los checkpoints | ⚠️ Provisionales ("Punto 1"…) |
| Portadores GPS | ⛔ No se usan — `GPS_HABILITADO: false` |

Mientras `ROL_OFICIAL` siga en `false` dentro de `config.js`, ni la página
pública ni la de checkpoint muestran los horarios de salida: publicar una
hora sin confirmar es peor que no publicar ninguna, porque la gente
organiza su día con eso.

Cuando llegue el Rol de Ingreso definitivo del 28-29-30:

1. **Fraternidades** — actualizar `orden_ingreso` y `hora_estimada` en
   `mock-data.js`, o importar por CSV desde el Table Editor. Columnas:
   `id`, `nombre`, `tipo`, `dia`, `modo_tracking`, `orden_ingreso`,
   `hora_estimada`, `token_portador`. Después poner `ROL_OFICIAL: true`.
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

> ⚠️ **Al editar `config.js`, subí el número de versión de los assets.**
> Las páginas del módulo referencian sus scripts como `config.js?v=1`. Si
> no se incrementa, los navegadores que ya visitaron el sitio pueden
> seguir sirviendo la versión anterior desde caché — y durante el evento
> eso significa que la página mostraría datos de ejemplo sin avisar. Para
> subir todas de una:
>
> ```bash
> node -e "const fs=require('fs');['chutillos/index.html','chutillos/portador/index.html','chutillos/checkpoint/index.html','chutillos/admin/index.html','chutillos/admin/recorrido/index.html'].forEach(p=>fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/\?v=\d+/g,'?v=2'),'utf8'))"
> ```

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

**La velocidad del desfile es el número más importante de la config.**
`VELOCIDAD_KMH` está en 0.80 km/h, derivada de que las salidas van de
08:00 a 19:25 y la última fraternidad termina entre las 23:00 y la
madrugada. De ahí sale todo lo demás: dónde se dibuja cada fraternidad en
el mapa, cuánto se ensancha su banda y cuándo se marca como demorada.

Después del primer día conviene ajustarla con datos reales. Basta con
mirar en la tabla `reportes_checkpoint` cuánto tardó una fraternidad entre
dos puntos y dividir la distancia del tramo por ese tiempo. Si el mapa se
ve "adelantado" respecto de la realidad, la velocidad está alta; si las
bandas se quedan pegadas al punto anterior, está baja.

**No hay respaldo si un checkpoint se cae.** Al no usar portadores GPS,
las 115 fraternidades dependen íntegramente de los 7 puntos de control. Si
un voluntario no llega, se le agota la batería o se va sin avisar, las
fraternidades que pasen por ahí quedan sin actualizar hasta el punto
siguiente — casi 20 minutos más de lo normal. Por eso el plan de dotación
incluye **relevos flotantes**: gente sin puesto fijo que cubre huecos y
refuerza donde se amontona.

Vale la pena que cada voluntario lleve batería portátil, aunque la página
de checkpoint consume poquísimo comparada con la de GPS.

> El código del portador GPS sigue completo y probado. Si en otra edición
> se decide usarlo, alcanza con poner `GPS_HABILITADO: true` en
> `config.js` y listar en `mock-data.js` qué órdenes de ingreso llevan
> portador.

**El plan gratuito de Supabase tiene límites.** La lectura pública usa
polling en vez de websockets justamente para no chocar contra el tope de
conexiones concurrentes, pero conviene mirar el uso en el dashboard el
día 28 y tener a mano la posibilidad de subir de plan si el tráfico
sorprende.

**El recorrido ya es el real.** 18 puntos, 3.51 km, levantados sobre el
mapa con el editor. Están en `mock-data.js` y en
[`seed-recorrido.sql`](seed-recorrido.sql) para cargar en Supabase.
`RECORRIDO_OFICIAL` está en `true`, así que el mapa público ya no muestra
el aviso de trazado provisional.

**Los checkpoints todavía NO son reales.** Se reparten de forma pareja
sobre el recorrido verdadero, pero ni su ubicación ni su nombre son los
definitivos — se llaman "Punto de control 01…10" justamente para que
nadie los confunda con referencias reales. La página pública los muestra
como *"Vista en …"*, así que un nombre inventado ahí sería información
falsa para el público.

Para ubicarlos: **`/chutillos/admin/recorrido/`**, modo "Puntos de
control". Se escribe el nombre, se hace clic donde va, y la pantalla
genera el `INSERT` con los nombres ya escapados. Conviene trabajar con
bastante zoom: la precisión del resultado es la del zoom al que se hizo
clic.
