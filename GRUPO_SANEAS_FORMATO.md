# Formato Grupo Saneas - Guía de Aplicación a Todas las Apps

## Resumen de Cambios Realizados en Saneas

Se ha implementado un nuevo formato unificado para el **Grupo Saneas** en:
1. **Desplegable de cabecera** (arriba a la izquierda)
2. **Grid de pie final** (abajo con iconos)

## CAMBIOS EN LOS ARCHIVOS

### 1. **index.html** - Estructura del Header

**Ubicación:** `index.html` línea ~108

**Cambio:** Reemplaza:
```html
<div class="brand" onclick="toggleGrupo()">Saneas<span class="bChev">&#9662;</span></div>
```

**Por:**
```html
<div class="brand"><span>NOMBRE_APP</span> <span class="brand-grupo">Grupo Saneas <span class="brand-arrow">→</span> <span class="brand-despliega" onclick="toggleGrupo()">despliega</span></span></div>
```

*Reemplaza `NOMBRE_APP` con: Saneas, laOra, Pordondevoy, Acumula, Activala según la aplicación*

---

### 2. **css/app.css** - Estilos del Header

**Ubicación:** `css/app.css` línea ~284-286

**Busca:** (comentario) `/* ── El grupo Saneas ── el resto lo pone js/24-grupo-saneas.js ── */`

**Reemplaza:**
```css
.brand{cursor:pointer;user-select:none}
.brand .bChev{font-size:12px;opacity:.85;margin-left:3px;vertical-align:2px}
```

**Por:**
```css
.brand{font-weight:700;font-size:22px;letter-spacing:.5px;user-select:none;display:flex;align-items:flex-end;gap:24px}
.brand-grupo{font-weight:700;font-size:16px;letter-spacing:.3px}
.brand-arrow{font-size:16px;margin:0 2px;font-weight:700}
.brand-despliega{font-weight:800;font-size:15px;letter-spacing:1px;cursor:pointer;opacity:1}
```

---

### 3. **js/24-grupo-saneas.js** (Componente Compartido)

**IMPORTANTE:** Este archivo es el componente compartido. Los cambios aquí DEBEN ser copiados a TODAS las apps.

#### 3.1 MARCAS Array - Reordenamiento y Logos

**Ubicación:** Líneas 17-28

**Cambio:** El array debe tener este orden exacto:
```javascript
var MARCAS = [
  { id:'saneas', nombre:'Saneas', logo:'app-saneas-web.png', url:'https://saneas.es',
    texto:'El método de nutrición con 87% de éxito que ha ayudado a más de 1700 personas, sin pastillas, sin batidos y sin inyecciones. Solo cambiando tus hábitos poco a poco. El GPS de la nutrición que te muestra el camino.' },
  { id:'pordondevoy', nombre:'Pordondevoy', logo:'app-pordondevoy.png', url:'https://pordondevoy-saneas.vercel.app',
    texto:'...' },
  { id:'activala', nombre:'Activala', logo:'app-activala.png', url:'https://activala.es',
    texto:'...' },
  { id:'laora', nombre:'laOra', logo:'app-laora.png', url:'https://laora.es',
    texto:'...' },
  { id:'acumula', nombre:'Acumula', logo:'app-acumula.png', url:'https://acumula.es',
    texto:'...' }
];
```

**Notas:**
- Saneas usa `logo:'app-saneas-web.png'` (NO wordmark)
- Todos deben tener logos en formato PNG
- El orden en MARCAS es: Saneas, Pordondevoy, Activala, laOra, Acumula

#### 3.2 Función todas() - Insertar Extras en Posición Correcta

**Ubicación:** Líneas 34-40

**Cambio:**
```javascript
function todas(){
  var result = MARCAS.slice();
  if(CFG.extras && CFG.extras.length > 0){
    result.splice(1, 0, CFG.extras[0]);
  }
  return result;
}
```

**Propósito:** Inserta el primer extra (asesorías) en posición 1 para orden correcto.

#### 3.3 Grid CSS - 3 Columnas

**Ubicación:** Línea 88

**Cambio de:**
```css
'.gs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(74px,1fr));gap:18px 6px;margin-top:12px}',
```

**A:**
```css
'.gs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 6px;margin-top:12px}',
```

#### 3.4 Colores de Explicaciones - Negro Puro

**Ubicaciones:**
- Línea 76: `.gs-tit` - cambiar `color:#5f7178` a `color:#000 !important`
- Línea 85: `.gs-tx span` - cambiar `color:#5f7178` a `color:#000 !important` Y cambiar `font-size:12.5px` a `font-size:14px`
- Línea 98: `.gs-ficha p` - cambiar `color:#41585f` a `color:#000 !important`

---

### 4. **js/23-grupo.js** - Configuración App-Específica

**Ubicación:** `js/23-grupo.js` líneas 5-11

**Cambio:** Adapter la configuración de la app:

```javascript
GrupoSaneas.init({
  actual: 'saneas',  // Cambiar a 'laora', 'pordondevoy', 'acumula', 'activala' según app
  logos : 'img/',
  extras: [{ id:'asesorias', nombre:'Asesorías Saneas',
             url:'https://saneas.es/asesorias',
             texto:'Si te gusta el mundo de la nutrición, ahora tú también puedes. Más fácil que nunca.' }]
});
```

**Cambios por App:**
- **Saneas**: `actual: 'saneas'` (mantener extras con asesorías)
- **laOra**: `actual: 'laora'` (remover extras o deixar vacío: `extras:[]`)
- **Pordondevoy**: `actual: 'pordondevoy'` (remover extras)
- **Acumula**: `actual: 'acumula'` (remover extras)
- **Activala**: `actual: 'activala'` (remover extras)

---

### 5. **Archivos de Imágenes - Logos**

**Ubicación:** Carpeta `img/`

**Archivos necesarios:**
- `app-saneas-web.png` - Logo web de Saneas (texto "Saneas" en teal)
- `app-pordondevoy.png` - Logo Pordondevoy
- `app-activala.png` - Logo Activala
- `app-laora.png` - Logo laOra
- `app-acumula.png` - Logo Acumula

**Todos deben ser 192px × 192px aproximadamente**

---

## ORDEN DE APLICACIÓN PARA CADA APP

### Para LaOra, Pordondevoy, Acumula, Activala:

1. ✅ Copiar `js/24-grupo-saneas.js` desde Saneas (idéntico)
2. ✅ Actualizar `index.html` header con el nuevo formato (cambiar nombre de app)
3. ✅ Actualizar `css/app.css` con nuevos estilos .brand-*
4. ✅ Actualizar `js/23-grupo.js`:
   - Cambiar `actual:` al id de la app correspondiente
   - Cambiar `extras:[]` (vacío, sin asesorías)
5. ✅ Copiar archivos PNG de logos a carpeta `img/`

### Para Web (saneas.es):

1. ✅ Copiar `js/24-grupo-saneas.js` (idéntico al de app)
2. ✅ Igual proceso que las apps, pero sin `js/23-grupo.js` si la web tiene estructura diferente
3. ✅ Adaptar HTML según estructura web

---

## RESULTADO FINAL EN CADA APP

### Header:
```
[Logo App]  Grupo Saneas →  DESPLIEGA
```
- Logo grande (22px, bold)
- "Grupo Saneas" (16px, bold) con flecha
- "DESPLIEGA" (15px, ultra-bold, clickeable)

### Footer Grid:
```
Row 1: [Saneas] [Asesorías*] [Pordondevoy]
Row 2: [Activala] [laOra] [Acumula]
```
*Solo en Saneas app

- 3 columnas
- Iconos 60×60px en grid
- Click abre ficha con explicación en negro puro (15px)

---

## CHECKLIST POR APLICACIÓN

- [ ] Copiar `js/24-grupo-saneas.js` (compartido, idéntico)
- [ ] Actualizar `index.html` header
- [ ] Actualizar `css/app.css` estilos .brand-*
- [ ] Actualizar `js/23-grupo.js` (actual, extras)
- [ ] Verificar logos PNG en `img/`
- [ ] Probar desplegable de cabecera
- [ ] Probar grid de pie final
- [ ] Verificar colores (negro puro en explicaciones)
- [ ] Verificar tamaños de letra
- [ ] Probar responsividad en móvil
