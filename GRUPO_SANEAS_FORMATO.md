# Formato del Grupo Saneas · cómo se pone en cada propiedad

**Formato cerrado el 30/07/2026 por Oscar.** Este documento manda: si una web o
una app del grupo no se parece a lo que hay aquí, la que está mal es ella.

Dos superficies, siempre las mismas:

1. **La pastilla de la cabecera** — un botón, arriba del todo, visible nada más
   abrir. Al pulsarlo se despliega el grupo entero.
2. **La parrilla del pie** — los iconos de las marcas donde el visitante ya ha
   llegado abajo. Al tocar un icono se abre su ficha con el botón «Ir a».

---

## 1. El botón del grupo

**El original vive en Acumula** (`acumula/web/templates/base.html`, clase
`.gs-boton`) y es el que manda. No es una pastilla: es un **botón de texto en dos
filas, sin fondo ni sombra**, discreto pero perfectamente legible, pegado al
logotipo de la casa.

```html
<button type="button" class="gs-boton" onclick="GrupoSaneas.abrirMenu()"
        aria-label="Ver las apps del Grupo Saneas">
  <span class="gs-b-marca">Grupo <b>Saneas</b> &#9656;</span>
  <span class="gs-b-accion">despliega</span>
</button>
```

```css
.gs-boton{background:none;border:0;padding:2px 6px;margin:0;cursor:pointer;
  text-align:left;line-height:1.15;min-height:0;border-radius:8px;
  font-family:"Quicksand",-apple-system,"Segoe UI",sans-serif}
.gs-boton:hover{background:#eef6f8}
.gs-b-marca{display:block;font-size:14px;font-weight:700;color:var(--teal)}
.gs-b-marca b{font-weight:700}
.gs-b-accion{display:block;font-size:11px;font-weight:700;color:#8aa3ab;letter-spacing:.04em}
```

Lo que no se toca en ninguna propiedad:

- **Dos filas alineadas a la izquierda**: arriba `Grupo Saneas ▸` a **14 px/700**;
  debajo `despliega` a **11 px/700** con `letter-spacing:.04em`.
- **Sin fondo, sin borde y sin sombra.** Solo un fondo suave al pasar por encima.
- La flecha es **▸** (`&#9656;`), al final de la primera fila.
- **Quicksand**, que es la letra del grupo, no la de la casa. Servida en local:
  nada de CDN, que la promesa de privacidad de Acumula prohíbe pedir a terceros.
- Va **al lado del logotipo**, dentro del mismo bloque (`.marca` en Acumula,
  `.brand` en la app de Saneas, `.nav-izq` en las webs).

**Lo único que cambia por casa es el color**, según el fondo de su barra:

| Barra | Marca | Acción | Hover |
|---|---|---|---|
| Blanca (Acumula, saneas.es) | `var(--teal)` | `#8aa3ab` | `#eef6f8` |
| De color (app de Saneas, teal) | `#fff` | `rgba(255,255,255,.78)` | `rgba(255,255,255,.14)` |

### En una app con la barra de color

Además de los colores, la barra tiene que cubrir la franja de la barra de estado:

```css
.appbar{padding-top:calc(14px + env(safe-area-inset-top,0px))}
.brand{display:flex;align-items:center;gap:14px}
```

**Ese `env(safe-area-inset-top)` no es opcional.** Las apps declaran
`viewport-fit=cover`, así que dibujan por debajo de la barra de estado del
iPhone. Sin ese relleno, la franja de arriba la pinta el fondo del `body` y se
ve un corte de otro color encima de la cabecera. `env()` vale 0 donde no hay
notch, así que no estorba en ningún sitio.

### En una web de marketing

El botón va junto al logo, los dos dentro de `.nav-izq`, y el logo sigue
abriendo el desplegable además del botón. Mide unos 100 px, así que convive con
el CTA sin apretar nada: solo se reduce el margen de la barra por debajo de
560 px y de 390 px. **Cuidado con la especificidad**: si el bloque nuevo se
inserta antes que la regla base del CTA, hay que escribir `nav .nav-wa{…}`.

---

## 2. El componente compartido

**Un solo archivo, idéntico byte a byte en todas las propiedades**:
`js/24-grupo-saneas.js` en las apps, `assets/js/grupo-saneas.js` en las webs.
Trae los datos de las cinco marcas, se pinta sus propios estilos y no depende
del CSS de la casa. Si se toca en un sitio, se copia tal cual en los demás — el
blob de GitHub debe coincidir.

```js
GrupoSaneas.init({
  actual : 'saneas',            // cuál es esta casa → sale con «estás aquí» y sin enlace
  logos  : 'img/',              // carpeta de los app-<marca>.png
  barra  : '.appbar,header',    // la barra de arriba de esta casa (ver abajo)
  extras : [ … ]                // sub-productos propios; solo Saneas lleva Asesorías
});
```

- **`barra`** dice dónde termina la barra superior, para que el desplegable se
  abra justo debajo y no la tape. Por defecto `.appbar,header`; **las webs de
  marketing pasan `'nav'`**. Ojo: `nav` NO vale como valor por defecto porque en
  las apps el `<nav>` es la barra de pestañas **de abajo**.
- **Los textos de venta son de Oscar y son los mismos en todas partes.** No se
  reescriben por cuenta propia.
- El orden de las marcas es el del array `MARCAS`: Saneas · Pordondevoy ·
  Activala · laOra · Acumula, con el extra insertado en la posición 1.

### La letra del desplegable

Es lo que más se lee, así que va en **la fuente del sistema**, no en la de la
casa (Quicksand a 14 px no se lee en un párrafo largo):

| Elemento | Tamaño | Color |
|---|---|---|
| Título «Grupo Saneas» | 15 px / 700 | `#22313a` |
| Nombre de la marca | 17 px / 800 | `#22313a` |
| Explicación | 16 px · interlineado 1,55 | `#3d4f59` |
| Ficha: título | 24 px | `#22313a` |
| Ficha: texto | 17 px · 1,55 | `#3d4f59` |
| Nombre bajo el icono | 14 px / 700 | `#22313a` |

Nada de `color:#000 !important`: se quitaron los tres que había.

### Compartir: QR y WhatsApp

Cada ficha del desplegable lleva un botón **Compartir** que abre el código QR de
esa casa —para que la otra persona lo escanee delante— y un botón **Enviar por
WhatsApp** (`api.whatsapp.com/send?text=…`).

**Los QR no se calculan en la app.** Son siete direcciones fijas, así que se
generan con `herramientas/qr_grupo.py` (usa `segno`) y se pegan como datos en el
componente: la matriz en binario, empaquetada en base64. Menos de 1 kB en total,
sin codificador ni dependencias en el cliente, y correctos por construcción.

- Si cambia una dirección del grupo, se vuelve a ejecutar el script y se pega el
  bloque `var QRS = {…}` — recordando que el componente es el mismo fichero en
  todas las casas.
- Se pintan con `qrSVG(id, lado)`, que devuelve un `<svg>` de un solo `path`.
  El lado va a **6 px por módulo** a propósito: en escala no entera el navegador
  difumina los bordes y hay lectores que entonces no lo cogen.

---

## 3. Los logotipos

Seis PNG cuadrados de 192 px en la carpeta de `logos`. **Saneas son dos fichas
distintas** y cada una lleva su icono y su enlace:

| Fichero | Ficha | Enlace |
|---|---|---|
| `app-saneas-web.png` | **Saneas** — teal con todas las letras | `https://saneas.es` |
| `app-saneas-s.png` | **APP Saneas** — teal con la S sola | `https://saneas.es/instala-app` |
| `app-pordondevoy.png` | Pordondevoy | su app |
| `app-activala.png` | Activala | `https://activala.es` |
| `app-laora.png` | laOra | `https://laora.es` |
| `app-acumula.png` | Acumula | `https://acumula.es` |

Ojo con una trampa ya pisada: `app-saneas.png` **no significa lo mismo en los dos
repos** (en el de la web es el teal con las letras y en el de la app es la S), así
que el componente no lo usa. La S se llama `app-saneas-s.png` en todas partes.

Si a una propiedad le falta alguno, esa fila del desplegable sale rota. Los
binarios se suben por la API de GitHub (`gh api …/git/blobs` en base64), que
funciona en todos los repos.

---

## 4. Poner el formato en una propiedad nueva

1. Copiar el componente **sin tocar una coma** y comprobar que el hash coincide
   con el de la app.
2. Copiar los cinco PNG a la carpeta de logos.
3. Añadir la pastilla a la cabecera con la variante que toque (app o web).
4. Llamar a `init` con su `actual`, sus `logos` y su `barra`.
5. Pintar la parrilla del pie con `GrupoSaneas.gridHTML()`.
6. Medir en el navegador a 1280, 375 y 320 px que nada se pisa.
7. Rama → preview → «fusiona» de Oscar. Nunca directo a `main`.

**Acumula no lleva telemetría.** El componente del grupo sí; `24-telemetria.js`
NO se copia a Acumula bajo ningún concepto: su promesa pública es cero analítica,
ni siquiera anónima.

---

## 5. Cómo está cada propiedad (30/07/2026)

| Propiedad | Botón | Componente | Pendiente |
|---|---|---|---|
| **Acumula** | ✅ es el original | ⚠️ versión vieja (9,8 kB) | ponerle el componente al día |
| App Saneas | ✅ | ✅ al día | — |
| saneas.es | ✅ index y asesorias | ✅ al día | `instala-app.html` no tiene cabecera ni pie del grupo |
| Pordondevoy | ❌ (parrilla del pie a mano + carrusel) | ❌ | todo |
| laOra | ❌ | ❌ | todo, en sus 7 páginas |
| Activala | ❌ | ❌ | todo, en sus 3 páginas |
