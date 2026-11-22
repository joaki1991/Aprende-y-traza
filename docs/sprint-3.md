# Sprint 3 — Recompensas, dibujos para colorear y pegatinas en la pizarra

**Estado:** completado en el árbol de trabajo, pendiente de revisión y commit.
**Fecha:** 21 de noviembre de 2026.
**Base:** Sprint 2 (`79d85f6`).

## 1. Objetivo

Ampliar el sistema de recompensas para que completar una letra o un número desbloquee una lámina que la niña pueda colorear, renombrar «Sorpresas» a «Recompensas» y permitir que las pegatinas desbloqueadas se coloquen, muevan, redimensionen y eliminen dentro de la pizarra, conservando todo el progreso y las funciones anteriores.

## 2. Alcance entregado

### Estrellas y desbloqueo

- Una estrella por la **primera** finalización de cada ficha, de forma idempotente.
- Repetir una ficha completada no suma ni repite la celebración.
- Un intento incompleto no concede estrella ni desbloquea lámina.
- 27 letras (mayúscula y minúscula comparten dibujo, Ñ incluida) y 10 números: **37 láminas únicas**.
- Contador de estrellas visible en inicio y en Recompensas.

### Celebración

Al desbloquear una lámina nueva, `TraceScreen` muestra:

- El dibujo recién desbloqueado.
- El mensaje «¡Muy bien! Has conseguido un nuevo dibujo: Avión.» con el nombre de la lámina.
- El botón **¡Quiero colorearlo!**, que abre `#/pizarra/dibujo/<id>`.
- El botón **Seguir aprendiendo**, que vuelve al flujo normal.

La celebración solo aparece cuando `recordPractice` devuelve un `newDrawingId` nuevo.

### Recompensas

- La tarjeta de inicio conserva su diseño y pasa a **Recompensas — Desbloquea dibujos y pegatinas**.
- Pestañas **Dibujos** y **Pegatinas** con contadores.
- Dibujos bloqueados: silueta, candado y pista («Completa la A», «Completa el 3»).
- Dibujos desbloqueados: lámina a color, nombre y enlace para colorear.
- Dibujos empezados: previsualización de rellenos y trazos guardados y botón **Continuar**.
- Pegatinas: mismo catálogo, costes, reglas y progreso que antes.

### Pizarra

Una sola pantalla (`ArtworkBoard`) para los dos modos:

- **Dibujo libre** (`#/pizarra`, composición `playground`): conserva el comportamiento anterior y añade pegatinas y persistencia.
- **Colorear** (`#/pizarra/dibujo/<id>`): relleno por región con cubo, pincel encima de la plantilla, 17 colores, tres grosores, deshacer, limpiar con confirmación y autoguardado.
- Capas de abajo a arriba: rellenos SVG → tinta → contornos SVG → pegatinas. Los contornos nunca se tapan.
- Cada región es un `<path>` cerrado con `id` estable; rellenar una no modifica las vecinas.
- Paleta: rojo, rosa, rosa claro, naranja, amarillo, verde claro, verde oscuro, azul claro, azul oscuro, turquesa, morado, lila, marrón, beige, gris, negro y blanco (17).
- Grosores: fino, medio y grueso (8, 14 y 22).
- Deshacer: 30 pasos; limpiar pide confirmación y también se puede deshacer.
- Autoguardado vectorial con 650 ms de retardo; se fuerza al ocultar la pestaña o desmontar.

### Pegatinas en la pizarra

- Bandeja con las pegatinas desbloqueadas por estrellas.
- Varias pegatinas del mismo tipo por composición.
- Selección y arrastre con Pointer Events.
- Tamaño con botones grandes `−` y `+` (0,1–0,45 del ancho).
- Eliminación individual con botón grande.
- Posición y tamaño normalizados, persistidos y recuperados al reabrir.
- Siempre por encima de rellenos, tinta y contornos.
- Límite defensivo de 60 pegatinas y 400 trazos por composición.

## 3. Catálogo de láminas

Todas las láminas son SVG propias, definidas como datos en TypeScript, con `viewBox` `0 0 400 400`, fondo transparente y trazo oscuro `#4a3a48`.

| Letra | Id | Dibujo |
| --- | --- | --- |
| A | `letter-a` | Avión |
| B | `letter-b` | Ballena |
| C | `letter-c` | Conejo |
| D | `letter-d` | Dinosaurio |
| E | `letter-e` | Elefante |
| F | `letter-f` | Fresa |
| G | `letter-g` | Gato |
| H | `letter-h` | Helado |
| I | `letter-i` | Isla |
| J | `letter-j` | Jirafa |
| K | `letter-k` | Koala |
| L | `letter-l` | León |
| M | `letter-m` | Mariposa |
| N | `letter-n` | Nube |
| Ñ | `letter-enye` | Ñandú |
| O | `letter-o` | Oso |
| P | `letter-p` | Pingüino |
| Q | `letter-q` | Queso |
| R | `letter-r` | Rana |
| S | `letter-s` | Sol |
| T | `letter-t` | Tortuga |
| U | `letter-u` | Unicornio |
| V | `letter-v` | Vaquita |
| W | `letter-w` | Waffle |
| X | `letter-x` | Xilófono |
| Y | `letter-y` | Yoyó |
| Z | `letter-z` | Zorro |

| Número | Id | Dibujo |
| --- | --- | --- |
| 0 | `number-0` | Donut |
| 1 | `number-1` | Cohete |
| 2 | `number-2` | Dos patitos |
| 3 | `number-3` | Tres flores |
| 4 | `number-4` | Cuatro estrellas |
| 5 | `number-5` | Cinco globos |
| 6 | `number-6` | Seis mariposas |
| 7 | `number-7` | Siete peces |
| 8 | `number-8` | Ocho caramelos |
| 9 | `number-9` | Nueve corazones |

### Ilustraciones pendientes

**Ninguna.** Las 37 láminas están implementadas y revisadas visualmente; no hay placeholders, emojis ni iconos genéricos. Si en el futuro se quiere sustituir alguna por una ilustración externa, debe respetar esta especificación:

1. **Nombre:** `<id>.svg` (`letter-a.svg`, `number-3.svg`…).
2. **Correspondencia:** el `id` de la tabla anterior.
3. **Formato:** SVG vectorial, sin fuentes, imágenes ni estilos externos.
4. **Dimensiones:** `viewBox="0 0 400 400"`, sin `width`/`height` fijos.
5. **Estructura:** un `<svg>` raíz; las regiones rellenables son `<path>` cerrados con `id` estable y `fill="transparent"`; los detalles van en un grupo aparte.
6. **Regiones:** ids cortos, únicos y semánticos (`body`, `head`, `wing`, `window`, `tail`…). No cambiar los ids existentes sin migración.
7. **Estilo:** contorno `#4a3a48` de 8–12 unidades, formas grandes, pocas zonas pequeñas y fondo transparente.
8. **Ejemplo mínimo válido:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <!-- regiones coloreables -->
  <path id="body" d="M120 220a80 60 0 1 0 160 0a80 60 0 1 0-160 0Z" fill="transparent" />
  <path id="window" d="M180 200a20 20 0 1 0 40 0a20 20 0 1 0-40 0Z" fill="transparent" />
  <!-- contornos por encima -->
  <g fill="none" stroke="#4a3a48" stroke-width="10" stroke-linejoin="round">
    <path d="M120 220a80 60 0 1 0 160 0a80 60 0 1 0-160 0Z" />
    <path d="M180 200a20 20 0 1 0 40 0a20 20 0 1 0-40 0Z" />
  </g>
</svg>
```

La app ya soporta cualquier `DrawingTemplate`; sustituir una lámina consiste en cambiar sus paths y mantener el `id`, el `viewBox` y los ids de región.

## 4. Persistencia y migración

- IndexedDB: base `aprende-y-traza`, versión **1**, stores `progress` y `settings`.
- Documento de progreso: `PROGRESS_SCHEMA_VERSION = 2`.
- `ProgressSnapshot` v2: `stars`, `characters`, `artworks`, `updatedAt`.
- Cada composición guarda `artworkId`, `unlockedAt`, `fills`, `strokes`, `stickers` y `updatedAt`.
- Migración v1 → v2 al leer: añade `artworks`, desbloquea las láminas de fichas ya completadas y nivela `stars`. No borra nada.
- Escrituras serializadas con una cola para evitar carreras entre autoguardado y registro de práctica.
- `saveArtwork` rechaza láminas bloqueadas y composiciones desconocidas.
- Datos corruptos o de versión desconocida siguen cayendo en un estado vacío seguro.
- No se guardan bitmaps, capturas ni `data:` del canvas.

## 5. Archivos principales

| Área | Archivos |
| --- | --- |
| Progreso | `progress.types.ts`, `progress.repository.ts`, `ProgressProvider.tsx`, `progressContext.ts` |
| Láminas | `artworks/drawings/shapes.ts`, `letterDrawings.ts`, `numberDrawings.ts`, `index.ts` |
| Pizarra | `artworks/ArtworkBoard.tsx`, `DrawingLayers.tsx`, `InkCanvas.tsx` |
| Pegatinas | `artworks/StickerLayer.tsx`, `StickerTray.tsx` |
| Persistencia de composición | `artworks/artwork.types.ts`, `useStoredArtwork.ts` |
| Galería | `rewards/RewardsScreen.tsx`, `RewardsScreen.module.css` |
| Celebración | `tracing/TraceScreen.tsx`, `TraceScreen.module.css` |
| Entrada a la pizarra | `tracing/DoodleScreen.tsx`, `DoodleScreen.module.css` |
| Rutas | `app/router.ts`, `app/App.tsx` |
| Inicio | `home/HomeScreen.tsx` |
| Pruebas | `progress.repository.test.ts`, `drawings.test.ts`, `TraceFlow.test.tsx`, `App.test.tsx`, `router.test.ts`, `drawing.test.ts` |

Se retiraron `tracing/DoodleCanvas.tsx` y `DoodleCanvas.module.css`, sustituidos por `ArtworkBoard` e `InkCanvas`.

## 6. Pruebas

```text
npm run lint       ✅
npm run typecheck  ✅
npm run test:run   ✅ 15 archivos, 144 pruebas
npm run build      ✅ 113 módulos, PWA con 21 entradas precacheadas
```

Cobertura nueva o ampliada:

- Estrella idempotente, repetición sin suma e intento incompleto sin premio.
- Mayúscula y minúscula compartiendo lámina; Ñ y los 10 números.
- Migración v1 → v2 con estrellas, intentos y precisión conservados.
- Rechazo de `saveArtwork` para láminas bloqueadas e ids desconocidos.
- Catálogo de 37 láminas: total, ids únicos, regiones cerradas, nombres y mapeo.
- Galería de Recompensas con bloqueados, desbloqueados y continuar.
- Celebración de dibujo nuevo y navegación a la pizarra.
- Utilidades de dibujo y paleta ampliada.

## 7. Verificación visual y funcional

Comprobado en Chromium con viewport de escritorio y un iframe de 390 × 844 para simular móvil vertical:

- Inicio con la tarjeta «Recompensas» y el contador de estrellas.
- Recompensas en vertical y horizontal; 37/37 láminas renderizadas sin desbordes.
- Siluetas de bloqueados y previsualización de coloreados.
- Pizarra de la lámina Avión: relleno de `body`, `wing-top`, `wing-bottom`, `tail` y `window` sin afectar a `propeller`.
- Pegatina añadida, arrastrada y redimensionada; estado «Guardado».
- Recarga completa: rellenos y pegatina conservan posición y tamaño.
- Sin errores de consola.

### Ajuste de caras

Tras revisar las 37 láminas se corrigieron las caras que quedaban forzadas, sobre todo en los dibujos de perfil:

- **Avión (`letter-a`)**: la cara pasa a la ventana de la cabina, en lugar de la cola.
- **Ballena (`letter-b`)**: ojo y sonrisa suben por encima del vientre para que la línea del vientre no parezca una boca.
- **Dinosaurio (`letter-d`)**: ojo, mejilla y hocico se centran en la cabeza; se retiran las líneas del cuerpo que parecían ojos cerrados.
- **Elefante (`letter-e`)**: la oreja se desplaza al fondo para dejar visible la cara en la cabeza.
- **Jirafa (`letter-j`)**: la cara se reparte por la cabeza (ojo, sonrisa, mejilla y fosa nasal).
- **Ñandú (`letter-enye`)**: las plumas del ala dejan de parecer ojos y se añade mejilla.
- **Queso (`letter-q`)**: se reorganizan los agujeros para que la cara quede sobre la cuña, no sobre el borde.
- **Tortuga (`letter-t`)**: la cabeza se acerca al caparazón y la cara se centra.
- **Unicornio (`letter-u`)**: el hocico se reduce y el ojo se acerca al morro.
- **Vaquita (`letter-v`)**: ojos y fosas nasales se separan; las fosas son más pequeñas y se añade el surco del morro.
- **Dos patitos (`number-2`)**: un solo ojo por pato, con mejilla, sin sonrisa duplicada.
- **Tres flores (`number-3`)** y **Siete peces (`number-7`)**: se completan las caras (ojos en las flores y boca en todos los peces).

La revisión se hizo con un renderizador SVG offline de las 37 láminas a 600 × 600 y hojas de contacto a 380 px por celda, además de la galería real.

## 8. Offline y Android

- Build de producción con service worker y precache de 21 entradas.
- Comprobación offline real: con el servidor de vista previa detenido, la recarga de `#/` se sirvió desde la caché del service worker; la portada, el contador de estrellas y la galería `#/recompensas` (37 tarjetas) siguieron funcionando y la consola quedó sin errores.
- `npm run android:sync` correcto; assets copiados al proyecto nativo.
- APK debug regenerado tras el ajuste de caras en `android/app/build/outputs/apk/debug/app-debug.apk` (5,04 MB) con `BUILD SUCCESSFUL`.

## 9. Limitaciones y notas

- El Sprint 3 queda **sin commit y sin push**, como se pidió.
- No se añadieron sonidos, niveles, panel adulto, backend, cuentas, nube, compras ni publicidad.
- Las estrellas siguen siendo acumulativas y no se gastan; las pegatinas se desbloquean por umbrales.
- El historial de deshacer es por sesión de pantalla: al salir y volver se conserva la composición, no la pila de deshacer.
- El arrastre de pegatinas usa Pointer Events y se probó con eventos sintéticos y ratón; conviene una pasada final con dedo real en el dispositivo Android.
- La comodidad de las láminas depende de la pantalla: en móviles muy pequeños conviene comprobar que la barra de herramientas no tapa la zona de dibujo.

## 10. Evidencia y documentos

- [`architecture.md`](architecture.md): módulos, capas, progreso v2 y recetas.
- [`technical-decisions.md`](technical-decisions.md): ADR-027 a ADR-031.
- [`../README.md`](../README.md): estado, rutas y estructura.
- [`../ROADMAP.md`](../ROADMAP.md): Sprint 3 cerrado y Sprint 3.5 pendiente.
