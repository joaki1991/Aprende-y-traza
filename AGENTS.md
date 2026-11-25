# AGENTS.md — Normas de desarrollo

Guía para agentes de OpenCode y para cualquier persona que contribuya a **Aprende y Traza**. El objetivo es proteger la simplicidad, la privacidad infantil y el funcionamiento offline mientras el proyecto crece por sprints.

## 1. Contexto

- App educativa kawaii para una niña de ~4 años: trazar mayúsculas, minúsculas y números.
- Interfaz en **español**; identificadores de código en **inglés**.
- Prioridad absoluta: **móvil Android**, con diseño completo para vertical y horizontal, botones grandes, lectura mínima y uso con dedos pequeños.
- Estado actual: **Sprint 6 publicado; Sprint 7 implementado, revisado y comprometido localmente (sin push)**. El motor de trazado está implementado y las 64 fichas (27 mayúsculas, 27 minúsculas y 10 números) están registradas y son trazables. Toda la interfaz funciona en vertical y horizontal. El sistema de estrellas y la galería de Recompensas están activos, con 37 láminas SVG para colorear por regiones y pegatinas interactivas en la pizarra. El Sprint 6 publicado añadió música ambiental local y la experiencia PWA inmersiva; el Sprint 7 añade efectos sintetizados, voz con `SpeechSynthesis` y preferencias independientes de música, efectos y voz. No implementes niveles progresivos, panel adulto ni funcionalidades de sprints futuros sin que se pida explícitamente.

## 2. Reglas irrenunciables

1. **Sin backend, sin cuentas y sin datos personales.** Nada sale del dispositivo.
2. **Sin anuncios, analítica, tracking, compras ni enlaces externos** dentro de la app.
3. **Sin recursos remotos en tiempo de ejecución**: nada de Google Fonts, CDNs, APIs ni imágenes externas. Fuentes, SVG, datos y sonidos deben vivir en el repositorio/paquete.
4. **Offline primero**: cualquier función nueva debe seguir funcionando sin conexión una vez instalada.
5. **Sin dependencias innecesarias.** Antes de añadir una librería, comprueba que no se resuelve con la plataforma o con código propio pequeño. Justifica la decisión en `docs/technical-decisions.md`.
6. **TypeScript estricto**: no uses `any`, `@ts-ignore` ni casts inseguros para salir del paso.
7. **No avances de sprint** si lint, typecheck, tests o build fallan.

## 3. Stack y versiones

- React 19 + Vite 6 + TypeScript 5.9.
- Vitest 4 + Testing Library + `fake-indexeddb`.
- `vite-plugin-pwa` 1.x (Workbox).
- Capacitor 7 + `@capacitor/app` para Android.
- CSS Modules + variables CSS. Sin framework de UI.
- Node `>=20`; entorno verificado con Node 20.15.1.

No actualices majors a ciegas: Vite 7/8, plugin-react 6, Vitest 5 o Capacitor 8 pueden romper la compatibilidad con Node 20 y con las versiones fijadas. Si hace falta actualizar, hazlo en una tarea separada y vuelve a verificar todo.

## 4. Arquitectura y dirección de dependencias

```text
app/ ──> modules/ ──> components/ + styles/
  │          │
  └──────────┴──> modules/storage (IndexedDB) y módulos nativos
```

- **`src/app/`**: arranque, router, ErrorBoundary, pantalla 404. Puede importar módulos.
- **`src/modules/<dominio>/`**: lógica y pantallas del dominio. La lógica pura (tipos, cálculos, repositorios) no debe importar React.
- **`src/components/`**: UI reutilizable sin lógica de negocio (layout, iconos, mascota, botones, píldoras).
- **`src/styles/`**: tokens, fuentes y estilos globales.
- **`src/modules/storage/`**: única puerta a IndexedDB. Ningún componente debe abrir IndexedDB directamente.
- **`src/modules/artworks/`**: pizarra, láminas SVG, rellenos y pegatinas. No debe abrir IndexedDB: usa `useProgress().saveArtwork`.
- **`src/modules/audio/`**: música, efectos, voz y preferencias. Los motores puros no importan React; el proveedor y los hooks viven por encima del router.
- **`src/modules/native/`**: integraciones Capacitor aisladas.

Reglas:

- No dupliques componentes: si un patrón se repite, extráelo a `components/`.
- Mantén la lógica de negocio fuera de los componentes de presentación.
- Usa el alias `@/` para imports internos.
- Los archivos de una pantalla viven en su módulo (`XScreen.tsx` + `XScreen.module.css`).
- No mezcles estilos de negocio en `base.css`; usa tokens y CSS Modules.

## 5. Contenidos educativos

- Fuente única de verdad del catálogo: `src/modules/lessons/content.ts`.
- Modelo: `src/modules/lessons/lesson.types.ts`.
- Recorridos de escritura: `src/modules/lessons/traces/` y registro en `traces/index.ts`.
- Cada carácter necesita `id` estable, `glyph`, `spokenName`, `exampleWord` y `order`.
- Los paquetes se identifican por `packId` (`mayusculas`, `minusculas`, `numeros`).
- Los trazos SVG se describen con `TraceStroke`; no los incrustes en componentes de pantalla.
- Cada `TraceStroke` debe declarar `path`, `start`, `end`, `direction`, `order`, `label` e `instruction`; `tolerance` y `kind` son opcionales.
- Las 64 fichas del catálogo tienen `CharacterTrace` registrado. Si algún día se declara un carácter sin trazos, la app debe mostrar un aviso amable, nunca romperse.
- Para añadir un alfabeto, crea un paquete nuevo con su `scriptId`; no dupliques la estructura de pantallas.
- Añade o actualiza pruebas de contenido al cambiar el catálogo (longitud, ids únicos, Ñ, palabras de ejemplo) y pruebas de integridad de los nuevos trazos.

### Láminas para colorear

- Catálogo único: `src/modules/artworks/drawings/`. Cada lámina es un `DrawingTemplate`.
- Hay 37 láminas: 27 de letras (`letter-a`…`letter-z`, `letter-enye`) y 10 de números (`number-0`…`number-9`). Mayúscula y minúscula comparten lámina.
- Cada lámina usa `viewBox="0 0 400 400"`, fondo transparente, trazo oscuro `#4a3a48` y regiones SVG cerradas con `id` estable (`body`, `wing`, `window`…).
- Las regiones deben ser independientes: rellenar una no puede afectar a las vecinas. Los ojos, caritas y adornos van en `details` y no se rellenan con el cubo.
- No uses emojis, iconos genéricos, imágenes remotas ni placeholders. Si falta una ilustración, deja constancia en el informe del sprint.
- Al añadir o cambiar láminas, actualiza `drawings.test.ts` (37, ids únicos, regiones cerradas, mapeo desde el catálogo educativo).

## 6. Diseño visual y accesibilidad

- Paleta, radios, sombras y tipografías: `src/styles/tokens.css`. No inventes colores sueltos en componentes; si hace falta un color nuevo, añádelo como token o variable local documentada.
- Tipografía de marca: Fredoka (títulos); texto: Nunito. Ambas locales en `src/assets/fonts/`.
- Targets táctiles: mínimo **56 px** para acciones principales; nunca por debajo de 44 px.
- Texto grande, frases cortas, tono amable y sin tecnicismos.
- La niña aún no lee: acompaña siempre con iconos, formas y colores; prepara `aria-label` para el futuro audio.
- Respeta `prefers-reduced-motion`.
- No uses `alert()`, `confirm()` ni diálogos del navegador para la experiencia infantil.
- Mantén el foco visible y la navegación por teclado en la web (aunque el objetivo sea táctil).

## 7. Canvas y trazado

La pizarra (`src/modules/artworks/ArtworkBoard.tsx`), su lápiz táctil (`src/modules/tracing/InkCanvas.tsx`) y el ejercicio educativo (`TraceCanvas.tsx`) comparten las reglas técnicas del motor.

- Usa **Pointer Events** (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) y captura del puntero.
- Mantén las coordenadas **normalizadas** en el modelo: 0–1 en la pizarra libre y coordenadas del `viewBox` en el ejercicio educativo, para que el redimensionado no deforme el dibujo.
- Gestiona **devicePixelRatio** (limitado a 3) y `ResizeObserver`.
- Cancela `requestAnimationFrame`, desconecta observadores y libera referencias en el cleanup.
- `touch-action: none`, `user-select: none` y prevención de menú contextual dentro del lienzo.
- No repintes todo el lienzo en cada movimiento si puedes pintar solo el segmento nuevo.
- No añadas una segunda librería de dibujo.

### Pizarra y composiciones

- `ArtworkBoard` sirve para dibujo libre y para colorear. Sin `template` es pizarra libre (`playground`); con `template` es una lámina del catálogo.
- Capas de abajo a arriba: rellenos SVG → canvas de pincel → contornos SVG → pegatinas. No cambies ese orden: los contornos deben quedar visibles y las pegatinas siempre encima.
- El relleno se aplica por `regionId` con un `Record<string, string>`; no pintes una imagen plana ni uses máscaras que afecten a regiones vecinas.
- El pincel reutiliza `InkCanvas` y guarda trazos vectoriales con `widthRatio`; no persistas bitmaps.
- El historial de deshacer vive en `useStoredArtwork` (30 pasos) y el autoguardado se agrupa con 650 ms de retardo.
- Las pegatinas se guardan con `id`, `kind`, centro normalizado `x`/`y` y `scale` relativo al ancho. Se arrastran con Pointer Events y se redimensionan con botones grandes.
- Límites defensivos: `MAX_ARTWORK_STROKES = 400` y `MAX_ARTWORK_STICKERS = 60`.
- La paleta (`DOODLE_COLORS`) tiene 17 colores y `DOODLE_BRUSH_SIZES` tres grosores. Mantén botones táctiles grandes y el color seleccionado claramente marcado.

El motor educativo vive en `src/modules/tracing/`:

- `traceGeometry.ts`: muestreo de paths SVG `M/L/H/V/C/S/Q/T/A/Z` (arcos con conversión endpoint → centro) y conversión de píxeles al `viewBox`.
- `traceValidation.ts`: métricas y umbrales; no importa React ni DOM. La dirección se mide por avance neto (con desenvuelto en bucles cerrados), no por un contador de pasos con umbral fijo.
- `traceSession.ts`: orden de trazos, intentos y precisión.
- `TraceGuide.tsx`, `TraceCanvas.tsx` y `TraceScreen.tsx`: presentación y persistencia.

Reglas para ampliar el motor:

- La validación debe seguir siendo geometría pura y probarse sin DOM.
- El orden de los trazos lo impone la sesión; un intento rechazado no avanza.
- Las tolerancias se expresan como fracción del lado menor del `viewBox`, no en píxeles.
- Los puntos de i/j usan `kind: 'dot'`: se validan como toque y la guía los dibuja sin flecha.
- Cada trazo debe ser un único subcamino (`M`).
- Cualquier letra nueva debe conservar la proporción del tablero (5:7 con `0 0 100 140`).

## 8. Audio, efectos y voz

- Hay **tres preferencias independientes** en `localStorage`: `aprende-y-traza.music.muted`, `aprende-y-traza.effects.enabled` y `aprende-y-traza.speech.enabled`. No uses IndexedDB para ajustes de audio ni mezcles estas claves con el progreso educativo.
- **Música:** un único `HTMLAudioElement` creado de forma diferida en `AmbientMusicProvider`, por encima del router. No crees reproductores por pantalla ni reinicies la canción al navegar. El botón global `MusicToggle` se mantiene.
- **Efectos:** `src/modules/audio/soundEffects.ts` sintetiza los patrones `victory`, `star`, `unlock` y `step` con Web Audio. No añadas archivos ni librerías de sonido si la síntesis resuelve el caso.
- Un único reproductor de efectos encola los sonidos y aplica prioridades. La victoria no debe solaparse con la estrella ni con el desbloqueo, y los pasos sutiles se descartan durante una celebración.
- La victoria suena **una sola vez por finalización válida** y nunca en trazos incorrectos, incompletos o fuera de orden. Estrella y desbloqueo se reproducen después de `recordPractice`, sin alterar el sistema de recompensas.
- **Voz:** `src/modules/audio/speech.ts` envuelve `SpeechSynthesis` sin dependencias. Prefiere `es-ES`, luego cualquier voz española y, como último recurso, la predeterminada del sistema.
- Cada locución nueva cancela la anterior y una ventana de 3,5 s descarta la misma frase repetida. Los errores `canceled` e `interrupted` son benignos; el resto se registra en consola sin romper la app.
- La **fuente única de las instrucciones** es `src/modules/tracing/traceNarration.ts`: la pantalla muestra esas frases y la voz lee exactamente las mismas. No crees textos, mensajes ni un segundo sistema de instrucciones en paralelo.
- Cancela la voz al desmontar la pantalla, al repetir y al completar el trazado. La felicitación de `TraceCompleteScreen` espera con `remainingMs()` a que termine la música de victoria para no pisarla.
- Si `AudioContext` o `SpeechSynthesis` no existen, degrada a «no disponible» sin errores visibles. Ninguna pantalla puede romperse por falta de audio.
- Recursos: la música vive en `public/audio/music/`; `public/audio/effects/` queda reservado y documentado. Registra procedencia y licencia de cualquier archivo nuevo; no uses muestras remotas ni de procedencia dudosa.
- No pongas sonido a todos los botones. Mantén efectos breves (0,5–2 s), volumen suave y un tono amable, nunca estridente.
- Prueba los motores con los dobles de `src/test/audioPlayers.ts`, incluidos ausencia de APIs, errores, deduplicación, cancelación y finalización. No uses `any` para simular el DOM.

## 9. Persistencia

- IndexedDB: base `aprende-y-traza`, versión `1`, stores `progress` y `settings`. El esquema del **documento** de progreso va por `PROGRESS_SCHEMA_VERSION` (2); no confundas ambas versiones.
- Toda lectura/escritura pasa por `src/modules/storage/db.ts` y `progress.repository.ts`. La pizarra usa `useProgress().saveArtwork`.
- `ProgressSnapshot` v2 contiene `stars`, `characters`, `artworks` y `updatedAt`. La migración v1 → v2 se ejecuta al leer, es no destructiva y desbloquea las láminas de las fichas ya completadas.
- El ejercicio registra intentos, rondas completadas, mejor precisión, último resultado y fecha con `recordPractice()`. Devuelve `{ snapshot, starEarned, newDrawingId }`.
- La primera finalización de una ficha concede 1 estrella de forma idempotente; repetir o dejar el intento incompleto no suma. Las estrellas no se gastan.
- `saveArtwork` valida el id: rechaza láminas del catálogo que aún no estén desbloqueadas y composiciones que no existan. La pizarra libre usa `playground`.
- Las composiciones guardan `fills` por región, `strokes` normalizados y `stickers` con posición y tamaño. Nunca bitmaps.
- Valida los datos al leer: si están corruptos o son de una versión desconocida, vuelve a un estado vacío en lugar de romper la app.
- Si cambias el esquema de IndexedDB, incrementa `DB_VERSION`; si cambias el documento de progreso, incrementa `PROGRESS_SCHEMA_VERSION`. Añade migración y prueba apertura desde una versión anterior.
- No guardes nombres, edad, ubicación, identificadores de dispositivo ni nada personal.
- No introduzcas `localStorage` para progreso; IndexedDB es la fuente de verdad.

## 10. PWA y offline

- Configuración en `vite.config.ts` (`VitePWA`).
- El service worker se registra **solo** en build de producción web; nunca en desarrollo ni en Capacitor (`registerPwa.ts`).
- Si añades assets nuevos (sonidos, imágenes), incluye su extensión en `globPatterns` si corresponde.
- Mantén el manifest en español, orientación `any` y colores `#ffd6e7` / `#fff6fb`.
- Al cambiar el icono, ejecuta `npm run icons`; no edites PNG a mano.
- Verifica el modo offline con `npm run build && npm run preview`, recarga una vez y luego desactiva la red.

## 11. Android y Capacitor

- Configuración: `capacitor.config.ts`; proyecto nativo en `android/`.
- Tras cambiar assets web o plugins: `npm run android:sync`.
- No edites `android/app/src/main/assets/public/` ni los JSON generados; se sobrescriben.
- No bloquees la orientación: mantén `android:configChanges` con `orientation` y `screenSize`, el nombre `Aprende y Traza` y el id `com.aprendeytraza.app`. Al girar no debe recrearse la actividad ni perderse la ronda.
- El botón Atrás se gestiona en `src/modules/native/hardwareBack.ts`. Si añades rutas nuevas, comprueba que el historial sigue funcionando.
- No añadas permisos Android que no sean necesarios. `INTERNET` se conserva por el funcionamiento estándar de Capacitor, pero la app no debe hacer peticiones de red.
- Los iconos y splash se regeneran con `npm run icons` en `android/app/src/main/res/`.

## 12. Pruebas

Antes de dar una tarea por terminada:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

- Añade pruebas para lógica pura nueva (contenidos, progreso, recompensas, router, dibujo, audio y narración).
- Usa `fake-indexeddb` para el repositorio; no mockees IndexedDB a mano.
- Para audio, usa los dobles de `src/test/audioPlayers.ts` y prueba también la ausencia de `AudioContext`/`SpeechSynthesis`.
- Prueba los estados de error y los datos corruptos, no solo el camino feliz.
- No reduzcas el número de pruebas ni silencies errores de consola para que pasen.
- Si tocas Android, ejecuta al menos `npm run android:sync` y, si es posible, `assembleDebug`.

## 13. Documentación y decisiones

- Cambios de arquitectura: actualiza `docs/architecture.md`.
- Decisiones relevantes (nueva dependencia, cambio de almacenamiento, cambio de estrategia offline): añade una entrada ADR en `docs/technical-decisions.md`.
- Cambios de alcance: actualiza `ROADMAP.md` y `docs/sprint-0.md` si afecta al estado.
- No dejes documentación desactualizada: forma parte de la definición de terminado.

## 14. Estilo de commits

Conventional Commits, en español y con scope:

```text
feat(sprint-0): preparar arquitectura, PWA y Android
fix(tracing): liberar el puntero al cancelar el trazo
docs(arquitectura): documentar el modelo de trazos SVG
test(progress): cubrir datos corruptos en IndexedDB
```

Un commit debe poder explicarse solo. No mezcles refactors masivos con funcionalidades nuevas.

## 15. Dónde tocar cada cosa

| Necesito… | Archivo |
| --- | --- |
| Añadir una pantalla | `src/modules/<dominio>/`, `src/app/router.ts`, `src/app/App.tsx` |
| Añadir una ruta | `src/app/router.ts` + prueba en `router.test.ts` |
| Añadir un carácter o paquete | `src/modules/lessons/content.ts` |
| Añadir o cambiar trazos | `src/modules/lessons/traces/` + `traces/index.ts` |
| Cambiar la validación o tolerancias | `src/modules/tracing/traceValidation.ts` |
| Cambiar la pantalla de trazado | `src/modules/tracing/TraceScreen.tsx` |
| Cambiar el Canvas del ejercicio | `src/modules/tracing/TraceCanvas.tsx` |
| Cambiar la pizarra o sus herramientas | `src/modules/artworks/ArtworkBoard.tsx` |
| Cambiar el lápiz táctil | `src/modules/tracing/InkCanvas.tsx` |
| Añadir o cambiar una lámina para colorear | `src/modules/artworks/drawings/` + `drawings/index.ts` |
| Cambiar el relleno por regiones | `src/modules/artworks/DrawingLayers.tsx` |
| Cambiar las pegatinas de la pizarra | `src/modules/artworks/StickerLayer.tsx` y `StickerTray.tsx` |
| Cambiar el autoguardado o deshacer | `src/modules/artworks/useStoredArtwork.ts` |
| Cambiar colores/tipografía | `src/styles/tokens.css` |
| Añadir un componente compartido | `src/components/` |
| Añadir una recompensa | `src/modules/rewards/rewards.ts` + `StickerArt.tsx` |
| Cambiar la galería de recompensas | `src/modules/rewards/RewardsScreen.tsx` |
| Cambiar música o preferencia de audio | `src/modules/audio/musicPlayer.ts` + `musicPreferences.ts` |
| Cambiar efectos de sonido | `src/modules/audio/soundEffects.ts` |
| Cambiar la voz o la elección de voces | `src/modules/audio/speech.ts` |
| Cambiar los textos hablados del ejercicio | `src/modules/tracing/traceNarration.ts` |
| Cambiar el panel de Música/Efectos/Voz | `src/modules/audio/AudioSettings.tsx` + `.module.css` |
| Añadir recursos de audio | `public/audio/music/` o `public/audio/effects/` + `vite.config.ts` |
| Cambiar el progreso | `src/modules/progress/*` y `storage/db.ts` |
| Cambiar la PWA | `vite.config.ts` + `public/icons/` |
| Cambiar Android | `capacitor.config.ts` + `android/app/src/main/` |
| Regenerar iconos | `npm run icons` |

## 16. Definición de terminado

Una tarea está terminada cuando:

- Compila sin errores ni warnings nuevos.
- Pasa lint, typecheck y pruebas.
- Funciona en viewport móvil y mantiene el diseño kawaii.
- El ejercicio de trazado se prueba con dedo/ratón en un navegador real, no solo con jsdom.
- Sigue funcionando offline (si aplica).
- No introduce recursos remotos, datos personales ni dependencias injustificadas.
- La documentación y las decisiones quedan actualizadas.
