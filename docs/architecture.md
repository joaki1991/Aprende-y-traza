# Arquitectura — Aprende y Traza

Documento vivo. Describe cómo está organizado el proyecto tras el Sprint 1 y qué contratos deben respetarse al añadir el resto de fichas y los sprints siguientes.

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
│  │            progress, rewards, storage, pwa, native)│  │
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
| `#/pizarra` | Pizarra libre | `DoodleScreen` |
| `#/progreso` | Progreso | `ProgressScreen` |
| `#/recompensas` | Recompensas | `RewardsScreen` |
| otro | 404 amable | `NotFoundScreen` |

- `parseRoute` normaliza barras, query y decodifica `packId` y `characterId`.
- `useAppRoute` usa `useSyncExternalStore` sobre `hashchange`.
- `routeKey` reinicia la pantalla al cambiar de lección o de ficha.
- El hash funciona en cualquier subdirectorio, en el WebView y con el botón Atrás del navegador.
- En Android, `registerHardwareBack` escucha `backButton`: si no estamos en la portada vuelve atrás; en la portada cierra la app.

Para añadir una ruta: amplía la unión `AppRoute`, `parseRoute`, `ROUTES`, `pageTitle`, `screenForRoute` y las pruebas del router.

## 5. Módulos de dominio

### Home

Portada con saludo, mascota Mochi y cuatro accesos grandes: Aprender, Pizarra, Estrellas y Sorpresas. Muestra el contador de estrellas con estado de carga.

### Learning

Lista los paquetes de `LESSON_PACKS` y enlaza a la vista previa. No contiene datos educativos propios. La vista previa marca con un ▶ las fichas que ya tienen trazos y ofrece un acceso directo a la primera disponible.

### Lessons

- `lesson.types.ts`: contratos de paquete, carácter, punto, dirección y trazo.
- `content.ts`: única fuente de verdad del catálogo.
- `traces/`: definiciones de recorridos por paquete. `traces/index.ts` expone `getCharacterTrace` y `hasCharacterTrace`.
- Los datos son puros y serializables; no conocen React ni Canvas.
- `TraceStroke` describe un `<path>` SVG con inicio, fin, dirección, orden, instrucción y tolerancia; `CharacterTrace` agrupa los trazos y el `viewBox` (`0 0 100 140` por convención).
- En el Sprint 1 solo está registrada la A mayúscula (`upper-a`). Las demás fichas muestran un aviso amable.

Identificadores estables:

- Mayúsculas: `upper-a` … `upper-z`, `upper-ñ`.
- Minúsculas: `lower-a` … `lower-z`, `lower-ñ`.
- Dígitos: `digit-0` … `digit-9`.

Se usan como clave de progreso. No los cambies sin migración.

### Tracing

El módulo contiene dos motores independientes que comparten Canvas y Pointer Events:

**Pizarra libre**

- `drawing.ts`: puntos normalizados (0–1), trazos con color y `widthRatio`, recorte al lienzo, descarte de puntos muy cercanos (1,4 px), grosor mínimo de 3 px, pintado de escena/segmento/punto.
- `DoodleCanvas.tsx`: ciclo de vida de Canvas, Pointer Events, captura del puntero, eventos coalescidos, DPR limitado a 3, `ResizeObserver`, deshacer y borrar con restauración.
- El modelo normalizado permite redimensionar sin deformar el dibujo.
- El estado pesado vive en refs; el estado de React solo controla botones, color y mensajes accesibles.

**Motor educativo**

- `traceGeometry.ts`: lectura del `viewBox`, conversión píxeles → `viewBox`, muestreo de `M/L/H/V/C/S/Q/T/Z`, distancias punto-polilínea, progreso y punto/ángulo a una proporción.
- `traceValidation.ts`: métricas de inicio, cobertura, precisión, dirección, progreso, final, longitud y detección de orden incorrecto. Geometría pura, sin React.
- `traceSession.ts`: máquina de estados que impone el orden, cuenta intentos y calcula la precisión media.
- `TraceGuide.tsx`: guía SVG con puntos, trazo actual, completados, inicio pulsante y flecha.
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

El tablero usa SVG + Canvas superpuestos con proporción 5:7 para que ambas capas compartan el mismo sistema de coordenadas. No debe añadirse otra librería de dibujo.

### Progress

Separación deliberada:

- `progress.types.ts`: `ProgressSnapshot`, `CharacterProgress`, versión de esquema.
- `progress.repository.ts`: carga, guardado, suma de estrellas, registro de práctica y reset; valida datos.
- `progress.utils.ts`: `summarizeProgress` deriva estrellas, caracteres practicados y progreso por paquete.
- `progressContext.ts`: contexto y hook, sin JSX (permite Fast Refresh limpio).
- `ProgressProvider.tsx`: estado `loading | ready | error`, recarga con token, acción `recordPractice` y cancelación lógica al desmontar.

`ProgressSnapshot`:

```ts
{
  schemaVersion: 1,
  stars: number,
  characters: {
    [characterId]: {
      characterId, packId, attempts, starsEarned,
      bestAccuracy, completions, lastResult, lastPracticedAt
    }
  },
  updatedAt: number
}
```

`recordPractice({ packId, characterId, attempts, completed, accuracy })` suma intentos, incrementa `completions` al terminar una ronda, conserva la mejor precisión, guarda `lastResult` y actualiza la fecha. No otorga estrellas todavía. Los campos `completions` y `lastResult` son opcionales para seguir leyendo datos del Sprint 0.

Se guarda un único registro `{ id: 'default', data }` en el store `progress`.

### Rewards

`rewards.ts` define el catálogo y los hitos de estrellas (0, 1, 3, 5, 8, 12). `StickerArt.tsx` dibuja cada pegatina en SVG local. Las recompensas son derivadas: no se guardan por separado y no hay compras ni azar.

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
- Manifest: nombre, colores, orientación vertical, iconos `any` y `maskable`.

### Native

`hardwareBack.ts` importa `@capacitor/app` de forma diferida y solo actúa en plataforma nativa. Si falla, la app sigue funcionando.

## 6. Diseño y estilos

- `styles/tokens.css`: colores pastel, tipografías, radios, sombras, safe areas, tamaños táctiles y curvas de animación.
- `styles/fonts.css`: `@font-face` con WOFF2 locales.
- `styles/base.css`: reset, fondo degradado, foco visible, animaciones suaves y `prefers-reduced-motion`.
- CSS Modules por componente/pantalla.
- Componentes compartidos: `AppShell`, `Screen`, `ScreenHeader`, `BigTile`, `BigActionLink`, `StarPill`, iconos SVG y mascota Mochi.
- La interfaz está limitada a `--content-max: 560px` y centrada; el diseño prioritario es 360–430 px de ancho.
- Los textos son cortos y en español; los iconos permiten usar la app sin leer.

## 7. Manejo de errores

| Situación | Respuesta |
| --- | --- |
| Error de render | `ErrorBoundary` con tarjeta y recarga |
| Ruta desconocida | `NotFoundScreen` con vuelta al inicio |
| Progreso corrupto o versión desconocida | Se devuelve progreso vacío, sin romper |
| IndexedDB bloqueada o no disponible | Estado `error` + botón “Reintentar” en Progreso |
| Canvas no disponible | Texto alternativo dentro del `<canvas>` |
| Puntero cancelado | Se descarta el trazo activo y se libera la captura |
| Trazo rechazado | Mensaje amable con la pista concreta y reinicio automático |
| Ficha sin trazos | Pantalla «¡Muy pronto!» con vuelta al listado |
| PWA no registrable | Aviso en consola; la app sigue funcionando |

## 8. Pruebas

- Vitest 4 + jsdom + Testing Library.
- `src/test/setup.ts`: `jest-dom`, `fake-indexeddb/auto`, limpieza tras cada test, stub de `ResizeObserver`, `scrollTo` y un contexto Canvas 2D mínimo para jsdom.
- 11 archivos, 72 pruebas en Sprint 1:
  - Router y rutas (incluida la ficha de carácter).
  - Contenidos (64 caracteres, ids únicos, Ñ, palabras).
  - Resumen de progreso y casos corruptos.
  - Repositorio IndexedDB (guardado, suma, reset, práctica, datos inválidos).
  - Utilidades de dibujo (normalización, recorte, puntos, grosor, paleta).
  - Geometría del trazado (muestreo SVG, distancias, conversión de coordenadas).
  - Validación (correcto, invertido, extremos, incompleto, desviación, garabato, orden y tamaños).
  - Sesión ordenada (avance, saltos, reintento, reset y precisión).
  - Recompensas (hitos, desbloqueo).
  - Integración de la app y del flujo A → ejercicio → celebración → IndexedDB.

Criterio: la lógica nueva debe llegar con pruebas; los errores y datos corruptos también se prueban. La interacción táctil real se verifica en Chromium; jsdom solo aporta dobles de Canvas.

## 9. Rendimiento

- Canvas con DPR limitado a 3 y repintado incremental.
- Puntos descartados si están a menos de 1,4 px (pizarra) o 1,2 px (trazado) para no acumular memoria.
- Estado de dibujo en refs para evitar renders por cada movimiento.
- SVG e iconos locales, sin imágenes pesadas.
- Bundle de producción ≈ 298 kB JS (≈ 94 kB gzip) y ≈ 35 kB CSS en Sprint 1.
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
4. Registra el `characterId` en `traces/index.ts`.
5. Añade pruebas de geometría/validación y comprueba la ficha en móvil.

### Añadir una pantalla

1. Crea `modules/<dominio>/<Nombre>Screen.tsx` y su `.module.css`.
2. Añade la ruta a `AppRoute`, `parseRoute`, `ROUTES`, `pageTitle` y `screenForRoute`.
3. Reutiliza `Screen` y `ScreenHeader`.
4. Añade pruebas de router y de render.

### Añadir una recompensa

1. Añade una entrada en `REWARD_STICKERS` con hito creciente.
2. Añade el arte en `StickerArt.tsx` (SVG local).
3. Actualiza pruebas de hitos.

### Cambiar el esquema de progreso

1. Incrementa `DB_VERSION`.
2. Añade migración en `onupgradeneeded` sin perder datos válidos.
3. Actualiza `PROGRESS_SCHEMA_VERSION`, tipos, repositorio y pruebas de migración.
4. Documenta la decisión en el ADR.

## 11. Decisiones y documentos relacionados

- [`technical-decisions.md`](technical-decisions.md): por qué se eligió cada pieza.
- [`sprint-0.md`](sprint-0.md): evidencia de validación del Sprint 0.
- [`sprint-1.md`](sprint-1.md): motor de trazado, algoritmo y validación del Sprint 1.
- [`../ROADMAP.md`](../ROADMAP.md): secuencia de sprints.
- [`../AGENTS.md`](../AGENTS.md): reglas de contribución.
