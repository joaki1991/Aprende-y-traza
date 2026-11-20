# Aprende y Traza

Aplicación educativa **kawaii** para que una niña de unos 4 años aprenda a trazar letras mayúsculas, minúsculas y números. Funciona como PWA instalable y está preparada para empaquetarse como app Android con Capacitor.

> **Estado actual: Sprint 1.5 completado.** La app ya incluye un motor real de trazado y una ficha completa para la **A mayúscula**: guía SVG, tinta Canvas, validación de inicio/recorrido/dirección/orden, feedback amable y registro local. Además, toda la interfaz funciona en vertical y horizontal: Android y la PWA ya no bloquean la orientación y las pantallas se reorganizan para aprovechar el espacio. El resto de fichas y las minúsculas/números llegan en los siguientes sprints.

---

## Qué incluye esta versión

- Interfaz completa y navegable: portada, selección de contenidos, vista previa de paquetes, pizarra libre, progreso y recompensas.
- Identidad kawaii pastel con tipografías locales, mascota SVG y pegatinas SVG.
- Ejercicio de trazado de la A mayúscula con tres trazos ordenados, flecha, guía punteada y celebración con Mochi.
- Motor geométrico propio que valida inicio, cobertura, desviación, dirección, final y orden, y rechaza garabatos.
- Pizarra táctil sobre Canvas con Pointer Events, captura de puntero, DPR y `ResizeObserver`.
- Progreso y ajustes en IndexedDB, sin registro ni datos personales; el ejercicio guarda intentos, rondas completadas, precisión y fecha.
- PWA con manifest, iconos, service worker y funcionamiento offline.
- Proyecto Android generado con Capacitor, orientación libre, iconos y splash propios.
- Diseño adaptable a vertical y horizontal (móvil, tablet y ventana de escritorio) con safe areas y sin scroll horizontal.
- 81 pruebas automatizadas, TypeScript estricto, ESLint y build de producción verificado.

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
│   ├── icons/               Iconos PWA, favicons y Apple Touch Icon
│   └── robots.txt
├── scripts/
│   └── generate-icons.mjs   Generación reproducible de iconos y splash
├── src/
│   ├── app/                 Arranque, router hash, ErrorBoundary, 404
│   ├── assets/fonts/        Fredoka y Nunito variables (WOFF2 locales)
│   ├── components/          UI reutilizable: layout, iconos, mascota, botones
│   ├── modules/
│   │   ├── home/            Pantalla principal
│   │   ├── learning/        Selección y vista previa de paquetes
│   │   ├── lessons/         Modelo, contenido y trazos SVG (`traces/`)
│   │   ├── native/          Integración Android (botón Atrás)
│   │   ├── progress/        Progreso, resumen y provider
│   │   ├── pwa/             Registro del service worker
│   │   ├── rewards/         Catálogo y arte de pegatinas
│   │   ├── storage/         Capa mínima sobre IndexedDB
│   │   └── tracing/         Pizarra, motor geométrico y pantalla de trazado
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

Cada carácter tiene `id`, `glyph`, nombre accesible, palabra de ejemplo y orden. Los recorridos de escritura viven en `src/modules/lessons/traces/`: hoy está registrada la A mayúscula y el resto se irá añadiendo sin tocar el motor ni las pantallas.

Para probar el ejercicio, abre `#/aprender/mayusculas/upper-a` o entra en Aprender → Mayúsculas → «Trazar la A».

Para añadir un alfabeto nuevo (por ejemplo, cursiva o pictogramas):

1. Crea una nueva entrada en `LESSON_PACKS`.
2. Usa un `scriptId` nuevo y caracteres con identificadores estables.
3. Añade sus `CharacterTrace` en `traces/` y regístralos en `traces/index.ts`.
4. Ejecuta las pruebas y actualiza `docs/architecture.md` si cambia el modelo.

## Orientación y diseño adaptable

- **Vertical:** columna centrada, botones grandes y texto mínimo; es la distribución prioritaria en móvil.
- **Horizontal:** se activa por tamaño real del viewport (`min-width: 600px` y `min-aspect-ratio: 1/1`), no por la orientación declarada. La portada coloca el hero a la izquierda y las actividades a la derecha; el trazado usa dos zonas con el tablero a la izquierda a todo el alto y Mochi, pasos y controles a la derecha.
- **Trazado:** el tablero conserva la proporción 5:7 y se dimensiona con el alto disponible, así que el texto nunca lo encoge. La guía SVG y el canvas comparten la misma transformación.
- **Safe areas:** padding con `env(safe-area-inset-*)` para notch, barras y gestos del sistema.
- Al girar no se recarga la app ni se pierde la ronda: Android conserva la actividad y React mantiene el estado.

## Privacidad y offline

- Sin backend, sin registro, sin cuentas y sin datos personales.
- Sin anuncios, analítica, píxeles de seguimiento ni enlaces externos.
- Sin Google Fonts, CDNs ni APIs remotas: fuentes, SVG, iconos y datos están en el paquete.
- El progreso se guarda solo en IndexedDB, en el dispositivo.
- La versión web funciona offline tras la primera carga; la versión Android lleva los assets dentro del APK.
- No hay compras ni servicios de pago.

Las tipografías **Fredoka** y **Nunito** se distribuyen bajo SIL Open Font License 1.1. Las licencias están en `licenses/`.

## Calidad y verificación

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Resultados de referencia del Sprint 1.5: [`docs/sprint-1.5.md`](docs/sprint-1.5.md). El Sprint 1 queda documentado en [`docs/sprint-1.md`](docs/sprint-1.md) y el Sprint 0 en [`docs/sprint-0.md`](docs/sprint-0.md).

## Documentación

- [`docs/architecture.md`](docs/architecture.md): arquitectura, capas, flujos y guías de extensión.
- [`docs/technical-decisions.md`](docs/technical-decisions.md): registro de decisiones técnicas (ADR).
- [`docs/sprint-1.5.md`](docs/sprint-1.5.md): orientación adaptable, distribuciones y verificación.
- [`docs/sprint-1.md`](docs/sprint-1.md): motor de trazado, algoritmo de validación, pruebas y limitaciones.
- [`docs/sprint-0.md`](docs/sprint-0.md): entregables y validación de la base técnica.
- [`ROADMAP.md`](ROADMAP.md): plan de sprints.
- [`AGENTS.md`](AGENTS.md): normas de desarrollo para OpenCode y colaboradores.
