# Formato del Grupo Saneas · cómo se pone en cada propiedad

**Formato cerrado el 30/07/2026 por Oscar.** Este documento manda: si una web o
una app del grupo no se parece a lo que hay aquí, la que está mal es ella.

Dos superficies, siempre las mismas:

1. **La pastilla de la cabecera** — un botón, arriba del todo, visible nada más
   abrir. Al pulsarlo se despliega el grupo entero.
2. **La parrilla del pie** — los iconos de las marcas donde el visitante ya ha
   llegado abajo. Al tocar un icono se abre su ficha con el botón «Ir a».

---

## 1. La pastilla

```html
<button class="gs-btn" onclick="GrupoSaneas.abrirMenu()">
  <span class="gs-btn-l1">Grupo Saneas <span class="gs-btn-fle">&#9662;</span></span>
  <span class="gs-btn-mas">despliega</span></button>
```

Reglas del botón, sin excepciones:

- **Dos líneas.** Arriba «Grupo Saneas» con su flecha `▾`; debajo, más pequeña
  pero perfectamente legible, la palabra **despliega**. Nunca en una sola línea
  y **nunca con emoji**.
- «Grupo Saneas» en el color de la marca, la flecha en el mismo color al 70 % y
  **«despliega» en naranja** (`--orange`, #F5862E).
- Forma de pastilla: `border-radius:99px` y **la fuente del sistema** (nunca la
  tipográfica de la casa: es un elemento del grupo, no de la marca).
- **Sobre barra de color, la pastilla es blanca; sobre barra blanca, en teal
  claro** (`#e8f4f7`). Lo que no cambia nunca es la forma ni el texto.

```css
.gs-btn{display:inline-flex;flex-direction:column;align-items:center;gap:2px;
  padding:7px 18px;border-radius:99px;background:#fff;color:var(--teal);border:0;
  cursor:pointer;white-space:nowrap;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  box-shadow:0 2px 8px rgba(16,40,48,.18)}
.gs-btn .gs-btn-l1{font-size:16px;font-weight:600;line-height:1.15}
.gs-btn .gs-btn-fle{font-size:14px;opacity:.7;margin-left:2px}
.gs-btn .gs-btn-mas{font-size:12.5px;font-weight:800;letter-spacing:.4px;
  color:var(--orange);line-height:1.15}
```

### Dónde va, según el tipo de propiedad

**En una app** (barra de color con la marca y el avatar): la pastilla va **entre
la marca y el avatar**, como hijo directo de la barra y **fuera** de `.brand`.
A dos líneas mide unos 155 px y cabe de sobra en 375 px; se deja `flex-wrap`
por si alguna casa tiene la barra más cargada.

```css
.appbar{flex-wrap:wrap;row-gap:10px;padding-bottom:12px;
  padding-top:calc(14px + env(safe-area-inset-top,0px))}
.brand{font-weight:700;font-size:22px;letter-spacing:.5px;user-select:none}
```

**Ese `env(safe-area-inset-top)` no es opcional.** Las apps declaran
`viewport-fit=cover`, así que dibujan por debajo de la barra de estado del
iPhone. Sin ese relleno, la franja de arriba la pinta el fondo del `body` y se
ve un corte de otro color encima de la cabecera. `env()` vale 0 donde no hay
notch, así que no estorba en ningún sitio.

**En una web de marketing** (barra blanca fija con logo a un lado y CTA al
otro): la pastilla va **junto al logo**, los dos dentro de `.nav-izq`, y el
logo sigue abriendo el desplegable además del botón.

```html
<div class="nav-izq"><div class="nav-logo saneas">Saneas®</div><button class="gs-btn" …></button></div>
```

Como ahí compite con el CTA, se aprieta por escalones (probado a 1280, 860, 560,
430, 375, 360 y 320 px; a 320 quedan 7 px de aire):

| Ancho | Qué pasa |
|---|---|
| ≤ 560 px | barra a 16 px de margen, logo a 18 px, pastilla a 13,5 px |
| ≤ 430 px | logo 17 px, pastilla a 12 px, el CTA se aprieta un punto |
| ≤ 345 px | margen a 10 px, logo 15 px, pastilla a 11 px |

Las dos líneas nunca se rompen: la coletilla no se esconde en ningún ancho.

**Cuidado con la especificidad:** si el bloque nuevo se inserta antes que la
regla base del CTA, hay que escribir `nav .nav-wa{…}` para que gane la del móvil.

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

---

## 3. Los logotipos

Cinco PNG cuadrados de 192 px en la carpeta de `logos`:

| Fichero | Marca |
|---|---|
| `app-saneas-web.png` | Saneas (el logotipo completo sobre teal, no la «S» suelta) |
| `app-pordondevoy.png` | Pordondevoy |
| `app-activala.png` | Activala |
| `app-laora.png` | laOra |
| `app-acumula.png` | Acumula |

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

| Propiedad | Pastilla | Componente | Pendiente |
|---|---|---|---|
| App Saneas | ✅ | ✅ al día | — |
| saneas.es | ✅ index y asesorias | ✅ al día | `instala-app.html` no tiene cabecera ni pie del grupo |
| Pordondevoy | ❌ | ❌ (solo «Grupo Saneas» a mano en el splash) | todo |
| laOra | ❌ | ❌ | todo, en sus 7 páginas |
| Activala | ❌ | ❌ | todo, en sus 3 páginas |
| Acumula | ❌ | ❌ (tiene su página «El grupo», con laOra aún como «Muy pronto») | adaptar a Flask + Jinja |
