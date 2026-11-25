# Sprint 6 — Música ambiental y PWA inmersiva

**Estado:** implementado y verificado, **pendiente de revisión y commit**.
**Base publicada:** `b4dd875` — `feat(sprint-5): improve tracing completion flow` (`HEAD == origin/main`).

## 1. Música ambiental

### Arquitectura

Un único reproductor para toda la aplicación:

```text
App
└── AmbientMusicProvider          ← un solo por sesión
    ├── AppShell
    │   ├── MusicToggle           ← botón global fijo
    │   └── pantalla de la ruta
    └── MusicPlayerContext → useAmbientMusic()
```

| Archivo | Responsabilidad |
| --- | --- |
| `src/modules/audio/musicPlayer.ts` | Lógica pura sin React: crea un `HTMLAudioElement`, bucle, volumen, autoplay, visibilidad, errores y silencio. |
| `src/modules/audio/musicPreferences.ts` | Lee y guarda `aprende-y-traza.music.muted` en `localStorage`. |
| `src/modules/audio/musicContext.ts` | Contexto y hook `useAmbientMusic` con `useSyncExternalStore`. |
| `src/modules/audio/AmbientMusicProvider.tsx` | Monta el reproductor una sola vez por encima del router. |
| `src/modules/audio/MusicToggle.tsx` | Botón de altavoz con `aria-pressed`, etiqueta en español y estado real. |
| `src/modules/audio/MusicToggle.module.css` | Posición fija, áreas seguras, responsive y objetivo táctil de 46 px. |

El audio se crea de forma diferida: si la preferencia guardada es «silenciado», no se descarga ni se instancia hasta que la niña active la música. El elemento es el mismo durante toda la sesión; navegar entre rutas no lo desmonta ni reinicia `currentTime`.

### Archivo de audio

```text
public/audio/background-music.mp3   (1 978 618 bytes)
```

`MUSIC_SOURCE` resuelve `${import.meta.env.BASE_URL}audio/background-music.mp3`, así que funciona en web, subdirectorios, PWA y Capacitor. Workbox precarga `mp3` y `ogg` con un límite de 5 MiB por archivo.

Instrucciones de sustitución, licencia y comportamiento si falta el archivo: `public/audio/README.md`.

### Comportamiento

- Volumen inicial `0.24`; el archivo se reproduce en bucle.
- Silenciar pausa el elemento inmediatamente y guarda la preferencia.
- Activar reanuda el mismo elemento en el mismo instante, sin reiniciar la canción.
- La preferencia se conserva al cerrar y abrir la app.
- Si el navegador bloquea `play()`, no hay error visible: se espera a `pointerdown`/`keydown` y se reintenta.
- `visibilitychange` pausa al ocultar la app y reanuda al volver si la música sigue activa.
- Un archivo ausente o no decodificable marca `unavailable`, avisa en consola y no rompe nada.
- No se crean reproductores por pantalla, ni listeners duplicados: `attach()` es idempotente y devuelve su limpieza.

## 2. PWA instalada

- `display: 'standalone'` y `display_override: ['standalone', 'minimal-ui']`.
- `orientation: 'any'`, sin bloquear vertical ni horizontal.
- `theme_color: '#ffd6e7'`, `background_color: '#fff6fb'`, iconos `any` y `maskable`.
- `viewport-fit=cover` en `index.html`.
- Alturas `100vh` como respaldo y `100dvh` cuando está disponible en `body`, `#root` y `AppShell`.
- `overflow-x: clip` y `overscroll-behavior-y: none` para evitar desplazamientos laterales y el rebote vertical.
- `env(safe-area-inset-*)` a través de los tokens `--safe-*` en el armazón y en el botón de música.
- El botón global reserva su columna en el encabezado de Inicio para no tapar la píldora de estrellas ni la marca.

No se fuerza `fullscreen`: la app instalada oculta la barra de direcciones, pero las barras de estado y navegación del sistema pueden seguir visibles. Es una limitación del sistema operativo y del navegador, no de la app.

## 3. Pruebas

Automatizadas (18 archivos, 173 pruebas):

- Música: reproducción, bucle, un solo reproductor, silencio persistido, reanudación sin reinicio, pausa al ocultar, autoplay bloqueado, archivo ausente, suscripciones y botón global.
- Navegación: el botón y su preferencia sobreviven al cambio de pantalla.
- PWA: manifest, colores, iconos, precache de MP3/OGG, viewport, alturas dinámicas, áreas seguras y ausencia de scroll lateral.
- Regresión: trazado, contenidos, recompensas, progreso, IndexedDB y orientación siguen pasando.

Manual en Chromium:

- Portada, Aprender y Pizarra a 360 × 640 y 740 × 360, sin scroll lateral ni controles bajo el notch simulado.
- Botón visible y sin solaparse con los controles del ejercicio o de la pizarra.
- Silencio persistente tras recargar y al cambiar de ruta.
- Una sola petición del MP3; sin errores en consola.
- Build de producción: el service worker precarga `index.html` y `audio/background-music.mp3` (1 978 618 bytes), por lo que la música está disponible sin conexión.

## 4. Comandos verificados

```bash
npm run lint        # OK
npm run typecheck   # OK
npm run test:run    # 18 archivos, 173 pruebas
npm run build       # OK, PWA con 22 entradas de precache
npm run android:apk # BUILD SUCCESSFUL
```

## 5. APK

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Generado de nuevo con los assets del Sprint 6 y `cap sync android`.

## 6. Limitaciones conocidas

- Android/Chrome: la app instalada abre sin barra de direcciones; la barra de estado y la de gestos pueden permanecer visibles o aparecer al deslizar.
- iOS/Safari: `display_override` puede ignorarse; la barra de estado de iOS sigue visible según el estilo configurado.
- El autoplay puede requerir el primer toque. No se intenta evitar esa restricción del navegador.
- La licencia del MP3 aportado debe confirmarse antes de distribuir la app.

## 7. Cambios pendientes de commit

Nada del Sprint 6 se ha confirmado ni publicado. Quedan modificados `AGENTS.md`, `README.md`, `ROADMAP.md`, `docs/architecture.md`, `docs/technical-decisions.md`, `src/app/*`, `src/components/icons/Icons.tsx`, `src/components/layout/AppShell.module.css`, `src/modules/home/HomeScreen.module.css`, `src/styles/base.css`, `src/test/setup.ts`, `vite.config.ts`, y sin seguimiento `public/audio/`, `src/app/pwa.test.ts` y `src/modules/audio/`.
