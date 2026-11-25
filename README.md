# Aprende y Traza

Aplicación educativa **kawaii** para que una niña de unos 4 años aprenda a trazar letras mayúsculas, minúsculas y números. Funciona como PWA instalable y está preparada para empaquetarse como app Android con Capacitor.

> **Estado actual: Sprint 6 publicado; Sprint 7 en curso (local, sin publicar).** La app incluye el catálogo completo de **64 fichas** (27 mayúsculas, 27 minúsculas y 10 números), todas trazables con el mismo motor, y un sistema de recompensas con **37 láminas para colorear** asociadas a las letras y los números. Cada ficha completada por primera vez da una estrella; cada letra o número desbloquea su dibujo, que se colorea por regiones independientes en la pizarra y se decora con pegatinas interactivas. El Sprint 6 publicado añadió música ambiental local y una PWA más inmersiva. El Sprint 7 incorpora efectos de sonido sintetizados, instrucciones habladas con la voz del dispositivo y preferencias independientes de música, efectos y voz. Los niveles progresivos y el panel adulto llegan en los siguientes sprints.

---

## Qué incluye esta versión

- Interfaz completa y navegable: portada, selección de contenidos, vista previa de paquetes, pizarra, progreso y recompensas.
- Identidad kawaii pastel con tipografías locales, mascota SVG y pegatinas SVG.
- Ejercicio de trazado para las 64 fichas: 27 mayúsculas, 27 minúsculas y 10 números, con trazos ordenados, flecha, guía punteada, punto de inicio y celebración con Mochi.
- Motor geométrico propio que valida inicio, cobertura, desviación, dirección, final y orden, y rechaza garabatos. Admite líneas, curvas y arcos SVG; los puntos de i/j se validan como toque independiente.
- Sistema de estrellas idempotente: una estrella por la primera finalización de cada ficha, sin duplicados al repetir y sin premio si el intento queda incompleto.
- 37 dibujos originales en SVG con regiones cerradas e identificadores estables: 27 letras (mayúscula y minúscula comparten lámina) y 10 números.
- Celebración al desbloquear un dibujo, con acceso directo a colorearlo o a seguir aprendiendo.
- Galería «Recompensas» con pestañas Dibujos y Pegatinas: siluetas para los bloqueados, previsualización y botón Continuar para los empezados.
- Pizarra unificada: dibujo libre y modo colorear con cubo de relleno por región, pincel, 17 colores, tres grosores, deshacer, limpiar con confirmación y autoguardado vectorial.
- Pegatinas interactivas sobre la pizarra: añadir varias, arrastrar, cambiar tamaño, quitar y conservar posición y tamaño al reabrir.
- Progreso y composiciones en IndexedDB, sin registro ni datos personales; el ejercicio guarda intentos, rondas completadas, precisión y fecha, y la pizarra guarda colores, trazos y pegatinas.
- PWA con manifest, iconos, service worker y funcionamiento offline.
- Música ambiental local en bucle, con botón global de silencio y preferencia persistida; respeta el bloqueo de reproducción automática del móvil.
- Efectos de sonido originales sintetizados con Web Audio: victoria al completar, estrella, recompensa desbloqueada y pasos sutiles. Suenan en cola, sin solaparse, y nunca en un trazo rechazado.
- Instrucciones habladas con `SpeechSynthesis`: anuncia la letra o el número, lee las mismas frases que muestra Mochi y se detiene al completar o salir. Prefiere una voz `es-ES` y funciona aunque el dispositivo no tenga voz.
- Panel de sonido con tres interruptores independientes (Música, Efectos y Voz); cada preferencia se guarda por separado y sobrevive a la recarga.
- Proyecto Android generado con Capacitor, orientación libre, iconos y splash propios.
- Diseño adaptable a vertical y horizontal (móvil, tablet y ventana de escritorio) con safe areas y sin scroll horizontal.
- 199 pruebas automatizadas en 23 archivos, TypeScript estricto, ESLint y build de producción verificado.

## Requisitos

| Herramienta | Versión recomendada |
| --- | --- |
| Node.js | 20.15 o superior (`>=20`) |
| npm | 10.9 o superior |
| JDK | 21 (solo para compilar Android) |
| Android SDK | Platform 35 + Build Tools 35 (solo Android) |

No se necesita backend, base de datos remota, cuenta de usuario ni conexión a Internet para usar la app.

## Instalación

```bash
npm install
```

Si npm falla con `Cannot read properties of null (reading 'edgesOut')`, usa una versión reciente de npm:

```bash
npx -y npm@10.9.4 install
```

## Desarrollo web

```bash
npm run dev
```

Abre la URL que muestra Vite (por defecto `http://localhost:5173`). El service worker está desactivado en desarrollo para evitar cachés molestas.

## Build y vista previa

```bash
npm run build
npm run preview
```

La PWA solo se registra en la build de producción. Abre `http://localhost:4173`, espera a que la app quede lista y podrás instalarla desde el navegador. Después de la primera visita, prueba a desactivar la red y recargar: la app debe seguir abriéndose.

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Typecheck + build de producción + generación de PWA. |
| `npm run preview` | Sirve la build de producción en local. |
| `npm run lint` | ESLint 9 sobre todo el proyecto. |
| `npm run typecheck` | TypeScript estricto sin emitir archivos. |
| `npm test` | Vitest en modo vigilancia. |
| `npm run test:run` | Vitest una sola vez (CI). |
| `npm run icons` | Regenera iconos PWA, favicons, iconos Android y splash con Sharp. |
| `npm run android:sync` | Build web + copia de assets al proyecto Android. |
| `npm run android:open` | Abre el proyecto Android en Android Studio. |
| `npm run android:apk` | Build web + sync + APK debug (Windows). |

En macOS/Linux, para el APK usa `./gradlew assembleDebug` dentro de `android/`.

## Android

El proyecto nativo vive en `android/` y se versiona en el repositorio. Los assets web copiados (`android/app/src/main/assets/public/`) y los archivos de Gradle generados están ignorados.

```bash
npm run android:sync
npm run android:open
```

Para compilar un APK debug desde consola:

```bash
npm run android:apk
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

Notas:

- La app admite orientación vertical y horizontal; al girar no se recarga ni se pierde la ronda en curso.
- El botón Atrás de Android vuelve a la pantalla anterior y, en la portada, cierra la app.
- Crea `android/local.properties` con `sdk.dir=...` si Gradle no encuentra el SDK. Ese archivo está ignorado por Git.
- Para publicar en Google Play harán falta firma release, revisión de privacidad y pruebas en dispositivos reales (ver `ROADMAP.md`).

## Estructura del proyecto

```text
.
├── android/                 Proyecto nativo Capacitor
├── docs/                    Arquitectura, decisiones y validación
├── licenses/                Licencias de las tipografías (OFL)
├── public/
│   ├── audio/               Música, efectos sintetizados, voz y ajustes de sonido
│   ├── icons/               Iconos PWA, favicons y Apple Touch Icon
│   └── robots.txt
├── scripts/
│   └── generate-icons.mjs   Generación reproducible de iconos y splash
├── src/
│   ├── app/                 Arranque, router hash, ErrorBoundary, 404
│   ├── assets/fonts/        Fredoka y Nunito variables (WOFF2 locales)
│   ├── components/          UI reutilizable: layout, iconos, mascota, botones
│   ├── modules/
│   │   ├── artworks/        Pizarra, láminas SVG, rellenos y pegatinas
│   │   ├── audio/           Música, efectos Web Audio, voz y panel de sonido
│   │   ├── home/            Pantalla principal
│   │   ├── learning/        Selección y vista previa de paquetes
│   │   ├── lessons/         Modelo, contenido y trazos SVG (`traces/`)
│   │   ├── native/          Integración Android (botón Atrás)
│   │   ├── progress/        Progreso, resumen, estrellas y provider
│   │   ├── pwa/             Registro del service worker
│   │   ├── rewards/         Catálogo de pegatinas y galería de recompensas
│   │   ├── storage/         Capa mínima sobre IndexedDB
│   │   └── tracing/         Motor geométrico, pantalla de trazado y lápiz táctil
│   ├── styles/              Tokens, base global y fuentes
│   └── test/                Configuración de pruebas
├── AGENTS.md                Reglas para agentes y colaboradores
├── ROADMAP.md               Plan de sprints
└── vite.config.ts           Vite + PWA + alias
```

## Contenidos educativos

Todo el contenido vive en `src/modules/lessons/content.ts`:

- 27 mayúsculas (incluida la Ñ).
- 27 minúsculas.
- 10 dígitos.

Cada carácter tiene `id`, `glyph`, nombre accesible, palabra de ejemplo y orden. Los recorridos de escritura viven en `src/modules/lessons/traces/`, separados por paquete:

- `uppercase.ts`: 27 mayúsculas.
- `lowercase.ts`: 27 minúsculas, con altura de x en `y=62` y ascendentes/descendentes propios.
- `digits.ts`: los 10 números.
- `index.ts`: registro único que consulta la pantalla de ejercicios.

Todas las fichas están registradas, así que el flujo Portada → Aprender → Categoría → Carácter → Ejercicio → Celebración funciona de principio a fin. Si algún día se añade un carácter sin trazos, la app muestra un aviso amable en lugar de romperse.

Para probar cualquier ficha, abre `#/aprender/mayusculas/upper-a`, `#/aprender/minusculas/lower-i`, `#/aprender/numeros/digit-0` o entra en Aprender y elige una letra o un número.

Para añadir un alfabeto nuevo (por ejemplo, cursiva o pictogramas):

1. Crea una nueva entrada en `LESSON_PACKS`.
2. Usa un `scriptId` nuevo y caracteres con identificadores estables.
3. Añade sus `CharacterTrace` en `traces/` y regístralos en `traces/index.ts`.
4. Ejecuta las pruebas y actualiza `docs/architecture.md` si cambia el modelo.

## Recompensas, dibujos y pizarra

- Cada primera finalización de una ficha concede **1 estrella**. Repetir una ficha ya completada no suma; un intento incompleto tampoco. El contador aparece en la portada y en Recompensas.
- Las estrellas no se gastan: desbloquean pegatinas por hitos (`mochi` 0, `arcoíris` 1, `estrella` 3, `flor` 5, `cupcake` 8, `corona` 12).
- Cada letra y cada número tienen una lámina propia; mayúscula y minúscula comparten dibujo (A y a desbloquean `letter-a`; la Ñ usa `letter-enye`). En total hay **37 dibujos**: 27 de letras y 10 de números.
- El catálogo vive en `src/modules/artworks/drawings/`: `letterDrawings.ts`, `numberDrawings.ts` y `shapes.ts`. Cada lámina usa un `viewBox` de `0 0 400 400`, fondo transparente, contornos oscuros y regiones SVG cerradas con `id` estable.
- La pizarra es una sola pantalla (`ArtworkBoard`). En modo libre guarda la composición `playground`; en modo colorear carga la plantilla de la ruta `#/pizarra/dibujo/<id>`.
- Capas de abajo a arriba: rellenos SVG, tinta libre, contornos SVG y pegatinas. Así el contorno nunca se tapa y las pegatinas siempre quedan encima.
- El autoguardado es vectorial, con 650 ms de retardo: colores por región, trazos normalizados y pegatinas con posición y tamaño. No se guardan mapas de bits ni capturas del lienzo.
- La galería de Recompensas muestra los bloqueados en silueta, abre los desbloqueados y permite continuar los empezados con su previsualización.

Rutas útiles: `#/recompensas`, `#/pizarra` y `#/pizarra/dibujo/letter-a`.

## Orientación y diseño adaptable

- **Vertical:** columna centrada, botones grandes y texto mínimo; es la distribución prioritaria en móvil.
- **Horizontal:** se activa por tamaño real del viewport (`min-width: 600px` y `min-aspect-ratio: 1/1`), no por la orientación declarada. La portada coloca el hero a la izquierda y las actividades a la derecha; el trazado usa dos zonas con el tablero a la izquierda a todo el alto y Mochi, pasos y controles a la derecha.
- **Trazado:** el tablero conserva la proporción 5:7 y se dimensiona con el alto disponible, así que el texto nunca lo encoge. La guía SVG y el canvas comparten la misma transformación.
- **Safe areas:** padding con `env(safe-area-inset-*)` para notch, barras y gestos del sistema.
- Al girar no se recarga la app ni se pierde la ronda: Android conserva la actividad y React mantiene el estado.

## Audio: música, efectos y voz

Los tres sistemas son independientes y se pueden combinar como se quiera: música sin efectos, efectos sin voz, voz con todo lo demás silenciado, etc.

### Música ambiental

- La música vive en `public/audio/music/background-music.mp3` y se empaqueta con la app; funciona sin conexión y el service worker la precarga.
- Un único reproductor `HTMLAudioElement` se crea de forma diferida y se comparte desde `AmbientMusicProvider`, por encima del router: cambiar de pantalla no reinicia la canción.
- El botón de altavoz está fijo en la esquina superior derecha de todas las pantallas, con iconos de altavoz activo y silenciado, y no tapa los controles del ejercicio ni de la pizarra.
- Silenciar pausa el mismo elemento y volver a activar reanuda en el mismo instante. La preferencia se guarda en `localStorage` (`aprende-y-traza.music.muted`) y se conserva entre sesiones.
- Si el navegador bloquea la reproducción automática, la app no muestra errores: espera al primer toque o tecla real y reintenta. Al volver del segundo plano reanuda si la música sigue activa.
- Para sustituir la melodía, sigue `public/audio/README.md`. Si el archivo falta, la app sigue funcionando con normalidad.

### Efectos de sonido

- Se sintetizan con Web Audio en `src/modules/audio/soundEffects.ts`; no hay archivos ni muestras externas, así que no necesitan licencias ni conexión.
- La victoria dura 0,86 s y encadena cuatro campanitas suaves en Do mayor. Después suenan, si corresponden, la estrella y el desbloqueo de la lámina.
- Un único reproductor encola los efectos: la celebración nunca se pisa con la estrella ni con el desbloqueo. Los pasos sutiles se descartan mientras hay una celebración en curso.
- No hay efecto en un trazo incorrecto, incompleto o fuera de orden, ni en botones genéricos. Repetir una ficha correctamente vuelve a celebrar, pero no concede otra estrella.
- La preferencia vive en `localStorage` (`aprende-y-traza.effects.enabled`). Si el dispositivo no ofrece Web Audio, el interruptor aparece desactivado y la app sigue igual.

### Voz e instrucciones

- Usa `SpeechSynthesis` nativo, sin API keys ni servicios externos. Prefiere una voz `es-ES`; si no existe, usa otra voz española y, como último recurso, la predeterminada del sistema.
- `src/modules/tracing/traceNarration.ts` es la única fuente de las frases del ejercicio. `TraceScreen` muestra esos mismos textos y la voz lee exactamente el mismo contenido: no hay un segundo sistema de instrucciones.
- Al entrar anuncia la letra o el número y la primera instrucción. Al aceptar un trazo lee el siguiente paso; al fallar ofrece la pista concreta del motor; al completar cancela la voz, suena la victoria y la felicitación espera a que termine la música.
- Se cancela al salir de la pantalla, al repetir y al completar. Una ventana de 3,5 s evita repetir la misma frase y cada nueva locución cancela la anterior.
- La preferencia vive en `localStorage` (`aprende-y-traza.speech.enabled`). Desactivarla corta la locución en curso; si no hay voces instaladas, la app continúa sin voz y sin errores visibles.

### Panel de sonido

El botón de ajustes, fijo junto al botón de música, abre un panel con tres interruptores grandes e independientes: **Música**, **Efectos** y **Voz**. Cada uno muestra su estado con `aria-checked`, se puede usar con teclado y se cierra con Listo, Escape o un toque fuera. El botón global de música del Sprint 6 se mantiene sin cambios.

## PWA instalada y pantalla completa

- El manifest declara `display: standalone`, `display_override` con `standalone`/`minimal-ui`, `orientation: any`, colores pastel e iconos `any` y `maskable`.
- La app instalada oculta la barra de direcciones, pero no fuerza `fullscreen`: las barras de estado y navegación del sistema pueden seguir visibles. Es la limitación real de Android e iOS.
- `viewport-fit=cover` y las variables `--safe-*` con `env(safe-area-inset-*)` mantienen los controles fuera del notch, las esquinas redondeadas y las barras del sistema.
- Las alturas usan `100vh` como respaldo y `100dvh` cuando está disponible; se evita el scroll horizontal accidental y el rebote vertical.
- En el navegador normal la experiencia sigue siendo la misma, y el WebView de Capacitor conserva el comportamiento de la app Android.

## Privacidad y offline

- Sin backend, sin registro, sin cuentas y sin datos personales.
- Sin anuncios, analítica, píxeles de seguimiento ni enlaces externos.
- Sin Google Fonts, CDNs ni APIs remotas: fuentes, SVG, iconos y datos están en el paquete.
- El progreso se guarda solo en IndexedDB, en el dispositivo. Las preferencias de audio (música, efectos y voz) usan `localStorage` y no contienen datos personales.
- La versión web funciona offline tras la primera carga, incluida la música; la versión Android lleva los assets dentro del APK. Los efectos se generan en el dispositivo y la voz usa las voces instaladas, sin descargas.
- No hay compras ni servicios de pago.

Las tipografías **Fredoka** y **Nunito** se distribuyen bajo SIL Open Font License 1.1. Las licencias están en `licenses/`.

## Calidad y verificación

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Resultados de referencia del Sprint 7: [`docs/sprint-7.md`](docs/sprint-7.md). El Sprint 6 queda documentado en [`docs/sprint-6.md`](docs/sprint-6.md). Las ilustraciones renovadas del Sprint 4 están en [`docs/sprint-4-ilustraciones.md`](docs/sprint-4-ilustraciones.md). El Sprint 3 queda documentado en [`docs/sprint-3.md`](docs/sprint-3.md), el Sprint 2 en [`docs/sprint-2.md`](docs/sprint-2.md), el Sprint 1.5 en [`docs/sprint-1.5.md`](docs/sprint-1.5.md), el Sprint 1 en [`docs/sprint-1.md`](docs/sprint-1.md) y el Sprint 0 en [`docs/sprint-0.md`](docs/sprint-0.md).

## Documentación

- [`docs/architecture.md`](docs/architecture.md): arquitectura, capas, flujos y guías de extensión.
- [`docs/technical-decisions.md`](docs/technical-decisions.md): registro de decisiones técnicas (ADR).
- [`docs/sprint-7.md`](docs/sprint-7.md): efectos Web Audio, voz, preferencias de audio, pruebas y limitaciones.
- [`docs/sprint-6.md`](docs/sprint-6.md): música ambiental, PWA inmersiva, pruebas y limitaciones.
- [`docs/sprint-4-ilustraciones.md`](docs/sprint-4-ilustraciones.md): renovación de láminas y licencias.
- [`docs/sprint-3.md`](docs/sprint-3.md): recompensas, 37 láminas, pizarra de relleno y pegatinas.
- [`docs/sprint-2.md`](docs/sprint-2.md): catálogo completo, geometrías, arcos, puntos y verificación.
- [`docs/sprint-1.5.md`](docs/sprint-1.5.md): orientación adaptable, distribuciones y verificación.
- [`docs/sprint-1.md`](docs/sprint-1.md): motor de trazado, algoritmo de validación, pruebas y limitaciones.
- [`docs/sprint-0.md`](docs/sprint-0.md): entregables y validación de la base técnica.
- [`ROADMAP.md`](ROADMAP.md): plan de sprints.
- [`AGENTS.md`](AGENTS.md): normas de desarrollo para OpenCode y colaboradores.
