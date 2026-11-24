# Arquitectura — Aprende y Traza

Documento vivo. Describe cómo está organizado el proyecto tras el Sprint 3 y qué contratos deben respetarse al añadir más fichas, láminas y en los sprints siguientes.

## 1. Visión general

Aprende y Traza es una **aplicación cliente 100 % local**:

- React renderiza la interfaz.
- Un router propio basado en el hash gestiona la navegación (web y WebView).
- HTML5 Canvas captura y pinta la tinta del dedo.
- SVG define los recorridos de letras y números.
- IndexedDB guarda progreso y ajustes.
- vite-plugin-pwa genera el manifest y el service worker.
- Capacitor envuelve la build web en una app Android.

No hay servidor, autenticación, API remota ni telemetría. El único límite externo es el navegador/WebView del dispositivo.

```text
┌──────────────────────────────────────────────────────────┐
│                    Dispositivo (Android / web)           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ React + CSS Modules                                │  │
│  │  app/ (router, error boundary)                     │  │
│  │  modules/ (home, learning, lessons, tracing,       │  │
│  │            artworks, progress, rewards,            │  │
│  │            storage, pwa, native)                   │  │
│  │  components/ (layout, ui, icons, mascots)          │  │
│  └───────────────┬───────────────────────┬────────────┘  │
│                  │                       │               │
│         ┌────────▼────────┐     ┌────────▼────────┐      │
│         │ Canvas / SVG    │     │ IndexedDB       │      │
│         │ dibujo y trazos │     │ progreso local  │      │
│         └─────────────────┘     └─────────────────┘      │
│                                                          │
│  ┌──────────────────────┐   ┌──────────────────────────┐ │
│  │ Service Worker (PWA) │   │ WebView / Capacitor      │ │
│  │ precache offline     │   │ Android, botón Atrás     │ │
│  └──────────────────────┘   └──────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## 2. Capas y dependencias

```text
main.tsx
  └── app/App.tsx ──────────────┐
        ├── app/router.ts       │
        ├── app/ErrorBoundary   │
        └── modules/*/Screen ───┤
              ├── components/*  │  UI reutilizable
              ├── modules/lessons/content
              ├── modules/artworks
              ├── modules/progress (provider + repositorio)
              ├── modules/storage/db
              ├── modules/rewards
              └── modules/tracing
```

Reglas:

- `app/` puede depender de `modules/` y `components/`.
- `modules/` puede depender de `components/`, `styles/` y de otros módulos de infraestructura (`storage`, `lessons`).
- La lógica pura (tipos, cálculos, repositorios, contenido) **no importa React**.
- `components/` no conoce reglas de negocio; recibe props.
- `storage/db.ts` es la única puerta a IndexedDB.
- `artworks/` contiene la pizarra y el catálogo de láminas; no abre IndexedDB, usa `useProgress().saveArtwork`.
- `native/` aísla Capacitor para que el resto de la app siga siendo web estándar.

## 3. Arranque

`src/main.tsx`:

1. Busca `#root`.
2. Monta `<StrictMode>` → `<ErrorBoundary>` → `<ProgressProvider>` → `<App>`.
3. Importa estilos globales: fuentes, tokens y base.
4. Registra la PWA (`registerPwa`) y el botón Atrás nativo (`registerHardwareBack`).

`ErrorBoundary` captura errores de render y muestra una tarjeta amable con botón de recarga. No envía datos a ningún sitio; solo registra en consola local.

## 4. Navegación

Router propio en `src/app/router.ts`:

| Hash | Pantalla | Componente |
| --- | --- | --- |
| `#/` (o vacío) | Portada | `HomeScreen` |
| `#/aprender` | Selección de mundos | `LearningScreen` |
| `#/aprender/:packId` | Vista previa de paquete | `LessonPreviewScreen` |
| `#/aprender/:packId/:characterId` | Ficha de trazado | `TraceScreen` |
| `#/pizarra` | Pizarra libre | `DoodleScreen` + `ArtworkBoard` |
| `#/pizarra/dibujo/:drawingId` | Colorear una lámina | `DoodleScreen` + `ArtworkBoard` |
| `#/progreso` | Progreso | `ProgressScreen` |
| `#/recompensas` | Recompensas | `RewardsScreen` |
| otro | 404 amable | `NotFoundScreen` |

- `parseRoute` normaliza barras, query y decodifica `packId`, `characterId` y `drawingId`.
- `useAppRoute` usa `useSyncExternalStore` sobre `hashchange`.
- `routeKey` reinicia la pantalla al cambiar de lección, ficha o lámina; la `key` del árbol de la pizarra fuerza el remount y evita mezclar composiciones.
- `drawingHref(drawingId)` construye la ruta de una lámina desbloqueada.
- El hash funciona en cualquier subdirectorio, en el WebView y con el botón Atrás del navegador.
- En Android, `registerHardwareBack` escucha `backButton`: si no estamos en la portada vuelve atrás; en la portada cierra la app.

Para añadir una ruta: amplía la unión `AppRoute`, `parseRoute`, `ROUTES`, `pageTitle`, `screenForRoute` y las pruebas del router.

## 5. Módulos de dominio

### Home

Portada con saludo, mascota Mochi y cuatro accesos grandes: Aprender, Pizarra, Estrellas y Recompensas. Muestra el contador de estrellas con estado de carga y resume el siguiente hito.

### Learning

Lista los paquetes de `LESSON_PACKS` y enlaza a la vista previa. No contiene datos educativos propios. La vista previa marca con un ▶ las fichas que ya tienen trazos y ofrece un acceso directo a la primera disponible; con el catálogo completo indica «¡Todas las fichas están listas!».

### Lessons

- `lesson.types.ts`: contratos de paquete, carácter, punto, dirección y trazo (`kind: 'stroke' | 'dot'`).
- `content.ts`: única fuente de verdad del catálogo.
- `traces/`: definiciones de recorridos por paquete. `traces/index.ts` expone `getCharacterTrace` y `hasCharacterTrace`.
- Los datos son puros y serializables; no conocen React ni Canvas.
- `TraceStroke` describe un `<path>` SVG con inicio, fin, dirección, orden, instrucción y tolerancia; `CharacterTrace` agrupa los trazos y el `viewBox` (`0 0 100 140` por convención).
- Las 64 fichas están registradas: `uppercase.ts` (27), `lowercase.ts` (27) y `digits.ts` (10). Cada trazo es un único subcamino (`M`) y sus extremos coinciden con `start`/`end`.

Identificadores estables:

- Mayúsculas: `upper-a` … `upper-z`, `upper-ñ`.
- Minúsculas: `lower-a` … `lower-z`, `lower-ñ`.
- Dígitos: `digit-0` … `digit-9`.

Se usan como clave de progreso. No los cambies sin migración.

### Tracing

El módulo contiene el motor del lápiz táctil y el motor educativo, que comparten Canvas y Pointer Events. La pantalla de pizarra que los usa vive en `modules/artworks/`.

**Pizarra**

- `drawing.ts`: puntos normalizados (0–1) para la pizarra libre, trazos con color y `widthRatio`, recorte al lienzo, descarte de puntos muy cercanos (1,4 px), grosor mínimo de 3 px, paleta de 17 colores y tres grosores.
- `InkCanvas.tsx`: ciclo de vida de Canvas, Pointer Events, captura del puntero, eventos coalescidos, DPR limitado a 3, `ResizeObserver` y repintado incremental. Es la capa de tinta que usan la pizarra libre y el modo colorear.
- `ArtworkBoard.tsx` (en `artworks/`) es la pantalla de pizarra: decide entre modo libre y modo colorear, monta las capas y ofrece herramientas.
- El modelo normalizado permite redimensionar sin deformar el dibujo.
- El estado pesado vive en refs; el estado de React solo controla botones, color y mensajes accesibles.

**Motor educativo**

- `traceGeometry.ts`: lectura del `viewBox`, conversión píxeles → `viewBox`, muestreo de `M/L/H/V/C/S/Q/T/A/Z`, distancias punto-polilínea, progreso y punto/ángulo a una proporción. Los arcos se convierten a centro y radios con el algoritmo de la especificación SVG.
- `traceValidation.ts`: métricas de inicio, cobertura, precisión, dirección, progreso, final, longitud y detección de orden incorrecto. Geometría pura, sin React. Los trazos `dot` usan una validación de toque propia.
- `traceSession.ts`: máquina de estados que impone el orden, cuenta intentos y calcula la precisión media.
- `TraceGuide.tsx`: guía SVG con puntos, trazo actual, completados, inicio pulsante, flecha y marcas de punto para i/j.
- `TraceCanvas.tsx`: tinta transparente; guarda puntos en coordenadas del `viewBox`, pinta solo el segmento nuevo y limpia al cancelar o repetir.
- `TraceScreen.tsx`: instrucciones de Mochi, pasos, feedback, celebración, repetición, vuelta y persistencia.

Flujo de un trazo educativo:

```text
pointerdown → captura + punto inicial en viewBox + primer punto de tinta
pointermove → convierte coordenadas, filtra puntos cercanos, pinta el segmento nuevo
pointerup → libera captura y envía el trazo a la sesión
sesión → evalúa solo el trazo actual; acepta y avanza, o rechaza y permite repetir
ronda completa → celebración + registro en IndexedDB
pointercancel / lostcapture → descarta la tinta y libera el puntero
```

El tablero usa SVG + Canvas superpuestos con proporción 5:7 para que ambas capas compartan el mismo sistema de coordenadas. La guía SVG declara `preserveAspectRatio="none"` para aplicar exactamente la misma transformación que el canvas, de modo que la tinta nunca se desplaza respecto a los puntitos aunque el borde del tablero reste algún píxel. No debe añadirse otra librería de dibujo.

El tamaño del tablero se deriva del alto real del viewport (`calc((100dvh - …) * 5 / 7)`), no de píxeles fijos, y conserva `aspect-ratio: 5 / 7` en vertical y horizontal. En horizontal la pantalla usa CSS Grid con dos zonas: el tablero ocupa la columna izquierda a todo el alto y la zona auxiliar (Mochi, pasos, pista y controles) queda a la derecha.

### Artworks

El módulo `src/modules/artworks/` contiene la pizarra y todo lo que se guarda en una composición:

- `artwork.types.ts`: `ArtworkState` con `fills` por región, `strokes` normalizados y `stickers`; límites `MAX_ARTWORK_STROKES = 400` y `MAX_ARTWORK_STICKERS = 60`; `PLAYGROUND_ARTWORK_ID = 'playground'` y `isArtworkColored`.
- `drawings/`: catálogo de 37 láminas. `letterDrawings.ts` (27), `numberDrawings.ts` (10), `shapes.ts` (constructores SVG y tipos), `importedDrawings.ts` (láminas externas de dominio público y MIT) e `index.ts` (`DRAWINGS`, `getDrawing`, `drawingIdForCharacter`).
- `DrawingLayers.tsx`: capa de rellenos interactiva y capa de contornos. Cada región es un `<path>` cerrado con `data-region-id`; el cubo solo cambia el `fill` de la región tocada.
- `StickerLayer.tsx`: pegatinas por encima de todo, con selección, arrastre por Pointer Events y tamaño relativo.
- `StickerTray.tsx`: bandeja de pegatinas desbloqueadas por estrellas.
- `useStoredArtwork.ts`: estado local de la composición, historial de 30 pasos y autoguardado con 650 ms de retardo; fuerza el guardado al ocultar la pestaña o desmontar.
- `ArtworkBoard.tsx`: capas de abajo a arriba **rellenos SVG → `InkCanvas` → contornos SVG → pegatinas**; herramientas de pincel/cubo, grosores, paleta, deshacer, limpiar con confirmación y mensajes accesibles.

Las composiciones se identifican por `artworkId`: `letter-a`…`letter-z`, `letter-enye`, `number-0`…`number-9` o `playground`. Mayúscula y minúscula comparten `letter-*`; la Ñ usa `letter-enye`. Este id es también la clave en `ProgressSnapshot.artworks`.

Nueve letras usan ilustraciones externas en `importedDrawings.ts`: G, J, P y V
de Openclipart (dominio público / CC0) y B, E, T, U e Y de Fluent UI Emoji
(MIT). La W y la Ñ son redibujos propios en `letterDrawings.ts`. La procedencia,
la licencia y las modificaciones de cada una se documentan en
[`docs/svg-sources.md`](svg-sources.md); el aviso MIT vive en
`licenses/MIT-Fluent-Emoji.txt`. Las láminas importadas conservan el mismo
contrato: `viewBox` 400 × 400, regiones cerradas con id estable y detalles no
coloreables.

Flujo de una región:

```text
pointerdown en región (modo cubo) → handleRegionTap(regionId)
  → checkpoint() para deshacer
  → update: fills[regionId] = color
  → autoguardado 650 ms → saveArtwork → IndexedDB
contornos y pegatinas quedan por encima y no se repintan
```

### Progress

Separación deliberada:

- `progress.types.ts`: `ProgressSnapshot`, `CharacterProgress` y `PROGRESS_SCHEMA_VERSION`.
- `progress.repository.ts`: carga, guardado, suma de estrellas, registro de práctica, guardado de composiciones y reset; valida datos y serializa las escrituras con una cola.
- `progress.utils.ts`: `summarizeProgress` deriva estrellas, caracteres practicados y progreso por paquete.
- `progressContext.ts`: contexto y hook, sin JSX (permite Fast Refresh limpio).
- `ProgressProvider.tsx`: estado `loading | ready | error`, recarga con token, acciones `recordPractice` y `saveArtwork`, y cancelación lógica al desmontar.

`ProgressSnapshot`:

```ts
{
  schemaVersion: 2,
  stars: number,
  characters: {
    [characterId]: {
      characterId, packId, attempts, starsEarned,
      bestAccuracy, completions, lastResult, lastPracticedAt
    }
  },
  artworks: {
    [artworkId]: {
      artworkId, unlockedAt, fills, strokes, stickers, updatedAt
    }
  },
  updatedAt: number
}
```

`recordPractice({ packId, characterId, attempts, completed, accuracy })` suma intentos, incrementa `completions` al terminar una ronda, conserva la mejor precisión, guarda `lastResult` y actualiza la fecha. La primera finalización concede **1 estrella** de forma idempotente (`starsEarned` pasa de 0 a 1); repetir o dejar el intento incompleto no suma. Devuelve `PracticeRecordSummary { snapshot, starEarned, newDrawingId }`; `newDrawingId` solo aparece la primera vez y alimenta la celebración de dibujo nuevo. Los campos `completions` y `lastResult` son opcionales para seguir leyendo datos antiguos.

**Migración v1 → v2:** al leer un documento con `schemaVersion: 1`, se añade `artworks: {}`, se desbloquean las láminas de las fichas ya completadas (`starsEarned >= 1`) y se nivela `stars` al número de fichas completadas si el valor antiguo era menor. No se borra ningún dato y la migración se repite de forma segura si el guardado se interrumpe. `DB_VERSION` de IndexedDB sigue en 1: la migración es del documento, no de la base.

`saveArtwork(artwork)` valida el `artworkId`: la pizarra libre (`playground`) siempre se permite; una lámina del catálogo debe estar desbloqueada; un id desconocido se rechaza. Se guarda un único registro `{ id: 'default', data }` en el store `progress`.

### Rewards

`rewards.ts` define el catálogo de pegatinas y los hitos de estrellas (0, 1, 3, 5, 8, 12). `StickerArt.tsx` dibuja cada pegatina en SVG local. `RewardsScreen.tsx` es la galería «Recompensas» con pestañas Dibujos y Pegatinas: las láminas bloqueadas se muestran en silueta con su pista («Completa la A»), las desbloqueadas enlazan a la pizarra y las coloreadas muestran previsualización y «Continuar». Las recompensas son derivadas del progreso: las pegatinas se desbloquean con estrellas y las láminas con `artworks`; no se guardan catálogos aparte y no hay compras ni azar.

### Storage

`storage/db.ts` es una capa mínima y sin dependencias:

- Base `aprende-y-traza`, versión 1.
- Stores `progress` (keyPath `id`) y `settings` (keyPath `key`).
- Apertura memoizada, cierre en `versionchange`.
- Operaciones `getRecord`, `getAllRecords`, `putRecord`, `deleteRecord`.
- Errores propagados para que la UI muestre estados amables.

`settings` está preparado para volumen, silencio y preferencias de accesibilidad; aún no se usa.

### PWA

- `vite-plugin-pwa` en modo `generateSW` con `registerType: 'autoUpdate'`.
- Registro manual (`injectRegister: null`) en `registerPwa.ts`.
- Solo se registra en producción web y nunca en Capacitor.
- Precache de JS, CSS, HTML, SVG, PNG, ICO, webmanifest, WOFF2 y WAV.
- `navigateFallback: index.html` y limpieza de cachés antiguas.
- Manifest: nombre, colores, orientación libre (`any`), iconos `any` y `maskable`.
- `viewport-fit=cover` y tokens de safe area para notch y barras del sistema.

### Native

`hardwareBack.ts` importa `@capacitor/app` de forma diferida y solo actúa en plataforma nativa. Si falla, la app sigue funcionando.

## 6. Diseño y estilos

- `styles/tokens.css`: colores pastel, tipografías, radios, sombras, safe areas, tamaños táctiles y curvas de animación.
- `styles/fonts.css`: `@font-face` con WOFF2 locales.
- `styles/base.css`: reset, fondo degradado, foco visible, animaciones suaves y `prefers-reduced-motion`.
- CSS Modules por componente/pantalla.
- Componentes compartidos: `AppShell`, `Screen`, `ScreenHeader`, `BigTile`, `BigActionLink`, `StarPill`, iconos SVG y mascota Mochi.
- **Diseño adaptable por tamaño real del viewport**, no por orientación declarada:
  - vertical: columna centrada de hasta 560 px;
  - horizontal: `(min-width: 600px) and (min-aspect-ratio: 1/1)`, con `AppShell` de hasta 1120 px (1200 px en pantallas grandes) y pantallas reorganizadas en dos columnas;
  - variantes compactas con `max-height: 540px` y `max-height: 430px` para móviles tumbados.
- `AppShell` aplica padding con `env(safe-area-inset-*)` y oculta el pie en horizontal de poca altura.
- Los textos son cortos y en español; los iconos permiten usar la app sin leer.

## 7. Manejo de errores

| Situación | Respuesta |
| --- | --- |
| Error de render | `ErrorBoundary` con tarjeta y recarga |
| Ruta desconocida | `NotFoundScreen` con vuelta al inicio |
| Progreso corrupto o versión desconocida | Se devuelve progreso vacío, sin romper |
| Lámina bloqueada o id desconocido | `DoodleScreen` muestra aviso amable y vuelve a Recompensas; `saveArtwork` rechaza la escritura |
| Composición con datos inválidos | Se normaliza o se descarta la parte dañada; la app sigue abierta |
| IndexedDB bloqueada o no disponible | Estado `error` + botón “Reintentar” en Progreso |
| Canvas no disponible | Texto alternativo dentro del `<canvas>` |
| Puntero cancelado | Se descarta el trazo activo y se libera la captura |
| Trazo rechazado | Mensaje amable con la pista concreta y reinicio automático |
| Ficha sin trazos | Pantalla «¡Muy pronto!» con vuelta al listado (solo si se declara un carácter sin `CharacterTrace`) |
| PWA no registrable | Aviso en consola; la app sigue funcionando |

## 8. Pruebas

- Vitest 4 + jsdom + Testing Library.
- `src/test/setup.ts`: `jest-dom`, `fake-indexeddb/auto`, limpieza tras cada test, `ResizeObserver` controlable, `scrollTo` y un contexto Canvas 2D mínimo para jsdom.
- `src/test/resizeObserver.ts`: doble que conserva los observadores activos y permite dispararlos con `triggerResizeObservers()` para simular giros y redimensionados.
- 15 archivos, 144 pruebas en Sprint 3:
  - Router y rutas (incluidas la ficha de carácter y la lámina `#/pizarra/dibujo/:id`).
  - Contenidos (64 caracteres, ids únicos, Ñ, palabras).
  - Catálogo de los 64 trazos: cobertura exacta, ids únicos, orden, extremos, límites del tablero, arcos, puntos de i/j, A intacta, Ñ, autotrazado, recorrido inverso, saltos de orden y garabatos.
  - Catálogo de las 37 láminas: ids únicos, 27 letras + 10 números, regiones cerradas, Ñ y mapeo desde el catálogo educativo.
  - Resumen de progreso y casos corruptos.
  - Repositorio IndexedDB (guardado, suma, reset, práctica, estrellas idempotentes, desbloqueo de láminas, migración v1 → v2 y datos inválidos).
  - Utilidades de dibujo (normalización, recorte, puntos, grosor, paleta y grosores).
  - Geometría del trazado (muestreo SVG, arcos grandes/pequeños, bucles cerrados, distancias, conversión de coordenadas).
  - Validación (correcto, invertido, extremos, incompleto, desviación, garabato, orden, tamaños horizontal/tablet, tolerancias estables y puntos de i/j).
  - Sesión ordenada (avance, saltos, reintento, reset y precisión).
  - Recompensas (hitos, desbloqueo, galería de dibujos).
  - Integración de la app y del flujo A → ejercicio → celebración → dibujo nuevo → IndexedDB, incluida la finalización tras girar a horizontal, una minúscula, un número y el punto de la i.
  - Pantallas principales en viewports horizontales.
  - Guarda de configuración de orientación (manifest Android, manifest PWA y viewport).

Criterio: la lógica nueva debe llegar con pruebas; los errores y datos corruptos también se prueban. La interacción táctil real se verifica en Chromium; jsdom solo aporta dobles de Canvas.

## 9. Rendimiento

- Canvas con DPR limitado a 3 y repintado incremental.
- Puntos descartados si están a menos de 1,4 px (pizarra) o 1,2 px (trazado) para no acumular memoria.
- Estado de dibujo en refs para evitar renders por cada movimiento.
- SVG e iconos locales, sin imágenes pesadas.
- Bundle de producción ≈ 371 kB JS (≈ 114 kB gzip) y ≈ 57 kB CSS (≈ 12 kB gzip) en Sprint 3.
- Las 37 láminas son datos SVG en código, sin imágenes ni peticiones de red.
- El autoguardado vectorial evita serializar bitmaps en cada trazo; el historial se limita a 30 pasos y las composiciones a 400 trazos y 60 pegatinas.
- Animaciones con `transform`/`opacity`; se desactivan con `prefers-reduced-motion`.

El Sprint 9 (o el Sprint 2 si se amplía el catálogo) medirá memoria y fps en dispositivos reales; si hace falta, se limitará el número de puntos o se usarán paths simplificados.

## 10. Recetas de extensión

### Añadir un paquete/alfabeto

1. Crea un `LessonPack` en `content.ts` con `id`, `scriptId`, título, badge, acento y caracteres.
2. Usa ids estables y palabras de ejemplo en español.
3. Añade sus `CharacterTrace` en `traces/` y regístralos en `traces/index.ts`.
4. Actualiza pruebas de contenido e integridad de trazos.
5. No toques las pantallas: ya iteran sobre `LESSON_PACKS` y detectan las fichas disponibles con `hasCharacterTrace`.

### Añadir o cambiar una ficha de trazado

1. Define el `CharacterTrace` en `traces/<paquete>.ts` con un `viewBox` coherente.
2. Ordena los trazos y haz que `start`/`end` coincidan con los extremos del `path`.
3. Escribe una `instruction` corta, sin tecnicismos, y ajusta `tolerance` si la letra lo necesita.
4. Usa `kind: 'dot'` solo para toques puntuales (i/j) y un único subcamino `M` por trazo.
5. Registra el `characterId` en `traces/index.ts`.
6. Añade pruebas de geometría/validación y comprueba la ficha en móvil.

### Añadir una pantalla

1. Crea `modules/<dominio>/<Nombre>Screen.tsx` y su `.module.css`.
2. Añade la ruta a `AppRoute`, `parseRoute`, `ROUTES`, `pageTitle` y `screenForRoute`.
3. Reutiliza `Screen` y `ScreenHeader`.
4. Añade pruebas de router y de render.

### Añadir o cambiar una lámina para colorear

1. Crea un `DrawingTemplate` en `artworks/drawings/letterDrawings.ts` o `numberDrawings.ts`. Si la lámina procede de una fuente externa, intégrala en `importedDrawings.ts` y documenta su licencia en `docs/svg-sources.md`.
2. Usa `viewBox` `0 0 400 400`, fondo transparente y un `id` estable (`letter-x` o `number-x`).
3. Define cada región como un path cerrado (`Z`) con `id` único dentro de la lámina; los adornos van en `details`.
4. Mantén el trazo oscuro `#4a3a48` y formas grandes, sin detalles pequeños.
5. Regístrala en `DRAWINGS` (vía los arrays existentes) y comprueba `drawingIdForCharacter`.
6. Actualiza `drawings.test.ts` y revisa la lámina en vertical y horizontal.

### Cambiar el esquema de progreso

1. Si cambia la estructura de IndexedDB (stores o keyPaths), incrementa `DB_VERSION` y añade migración en `onupgradeneeded`.
2. Si cambia el documento de progreso, incrementa `PROGRESS_SCHEMA_VERSION` y añade una migración al leer, sin perder datos válidos.
3. Actualiza tipos, repositorio y pruebas de migración desde la versión anterior.
4. Documenta la decisión en el ADR.

### Añadir una recompensa

1. Añade una entrada en `REWARD_STICKERS` con hito creciente.
2. Añade el arte en `StickerArt.tsx` (SVG local).
3. Actualiza pruebas de hitos y comprueba la bandeja de la pizarra.

## 11. Decisiones y documentos relacionados

- [`technical-decisions.md`](technical-decisions.md): por qué se eligió cada pieza.
- [`sprint-0.md`](sprint-0.md): evidencia de validación del Sprint 0.
- [`sprint-1.md`](sprint-1.md): motor de trazado, algoritmo y validación del Sprint 1.
- [`sprint-1.5.md`](sprint-1.5.md): orientación vertical/horizontal, distribuciones y verificación.
- [`sprint-2.md`](sprint-2.md): catálogo completo, arcos, puntos y verificación.
- [`sprint-3.md`](sprint-3.md): recompensas, láminas para colorear, relleno y pegatinas.
- [`../ROADMAP.md`](../ROADMAP.md): secuencia de sprints.
- [`../AGENTS.md`](../AGENTS.md): reglas de contribución.
