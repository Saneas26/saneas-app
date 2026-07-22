# Saneas26 v1.2 · Estructura del repositorio

La app dejó de ser un `index.html` monolítico de 3.500 líneas. Ahora `index.html` es solo el
esqueleto (~235 líneas: HTML de las pantallas) y el código vive en ficheros pequeños. **El
comportamiento es idéntico al monolito**: la división se hizo cortando por secciones y se
verificó que la concatenación de los trozos reproduce el original byte a byte.

Para el cliente el update es invisible: misma URL, misma sesión (mismo proyecto y clave de
Supabase → no se cierra la sesión de nadie), misma PWA instalada, mismos datos.

## Mapa de ficheros

| Fichero | Qué contiene |
|---|---|
| `index.html` | Esqueleto HTML: splash, acceso, pantallas, nav. Sin CSS ni JS propios. |
| `css/base.css` | Variables, splash y pantalla de acceso |
| `css/app.css` | Estructura de la app y todas las pantallas |
| `css/narrativa.css` | Inicio narrativo: capítulo, misión, mapa, victorias, niveles |
| `js/01-config.js` | Supabase (URL + clave publicable), versión de la app, flags de plan |
| `js/02-util.js` | Estado global, fechas/horas (Canarias↔Madrid, corte 10:00) y formato |
| `js/03-auth.js` | Login OTP, alta de cliente nuevo y ficha personal |
| `js/04-bloqueo.js` | Bloqueo por renovación caducada |
| `js/05-sesion.js` | Arranque de sesión: carga de datos, push, pasos, avisos, dieta |
| `js/06-objetivos.js` | Objetivos (peso/grasa/IMC), validación de datos, historial, calorías |
| `js/07-inicio.js` | Pantalla de inicio: agua, narrativa (capítulo/misión/niveles/victorias) |
| `js/08-social.js` | Saneamigos (invitar) y compartir evolución |
| `js/09-dieta.js` | Pizarra de dieta y lista de la compra |
| `js/10-detalle.js` | Ficha de producto/receta y FAQ «Cómo funciona» |
| `js/11-registro.js` | Registro semanal: secciones y aviso de plazo |
| `js/12-extras-inicio.js` | Qué decir, mapa de progreso, legado (100 días), reporte de voz, fase |
| `js/13-registro-envio.js` | Envío del registro: validación y guardado |
| `js/14-nav.js` | Navegación entre pestañas |
| `js/15-gym.js` | Entrenamiento (casa/gym) y registro de pesos |
| `js/16-pagos.js` | Página de pagos (escaparate) |
| `js/17-mas.js` | Pestaña Más: tienda, recetas y opinión |
| `js/18-facturas.js` | Facturas de la clienta (desde 01/07, desplegable) y toast |
| `js/19-arranque.js` | Arranque con sesión persistente |
| `js/20-miplan.js` | Mi Plan Semanal (generador de la clienta, RPC sin secreto) |
| `js/21-diario.js` | Diario de comidas: buscador sobre la biblioteca + entrada a mano |
| `css/diario.css` | Estilos del diario de comidas |
| `supabase/fase1_diario.sql` | Tablas `alimentos` (capa nutricional del CAT_Tienda) y `diario_comidas` + RLS. Pegar en el SQL Editor |
| `supabase/alimentos_semilla.sql` | ~85 alimentos genéricos para arrancar (revisables por Oscar) |
| `herramientas/importar_alimentos_off.py` | Cruza el CAT_Tienda con Open Food Facts España y genera los CSV de carga |

`panel.html` sigue siendo monolítico; su división es el siguiente paso.

## Reglas (aprendidas a base de errores)

1. **El orden de carga importa.** Los `<script src>` de `index.html` van numerados y se cargan
   en ese orden; comparten ámbito global como el monolito original. No reordenar ni saltarse
   la numeración al crear un fichero nuevo.
2. **Editar por github.dev**, fichero a fichero:
   `https://github.dev/Saneas26/saneas-app/blob/main/js/07-inicio.js`
   Los ficheros pequeños hacen inofensivas las trampas del editor que costaron dos
   corrupciones el 19/07 (campo de reemplazo de una sola línea, widgets a medio renderizar).
3. **Para leer sin editor**, la URL raw por fichero:
   `https://raw.githubusercontent.com/Saneas26/saneas-app/refs/heads/main/js/01-config.js`
4. **Nada de secretos en JS.** En `js/01-config.js` solo va la clave *publicable* de Supabase.
   Cualquier secreto (tipo `SANEAS_SYNC_2026`) que viaje en un fichero de esta carpeta es
   público en el momento en que se despliega.
5. **No duplicar lógica con `panel.html`.** La fórmula de grasa ya divergió una vez por estar
   copiada en dos sitios. Si algo se necesita en app y panel, se decide una sola fuente.
6. **Caché:** Vercel sirve HTML, `sw.js`, `js/*` y `css/*` con `no-store` → guardar en main
   es desplegar, sin esperas ni versiones a medias. El `?v=` de los `<link>/<script>` se
   sube solo si algún día se quita el `no-store`.
7. **Después de editar un fichero JS**, comprobación mínima: `node --check js/XX-fichero.js`
   (o pegarlo en la consola del navegador). Un error de sintaxis en un fichero ya no tumba
   toda la app —los demás cargan—, pero deja su pantalla rota.

## Versión

La versión visible está en `js/01-config.js` (`APP_VERSION`) y la ve la clienta al pie de la
pestaña «Más». Subirla en cada cambio funcional, no en cada retoque.
