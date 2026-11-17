# Aprende y Traza

Aplicación educativa **kawaii** para que una niña de unos 4 años aprenda a trazar letras mayúsculas, minúsculas y números. Funciona como PWA instalable y está preparada para empaquetarse como app Android con Capacitor.

> **Estado actual: Sprint 0 completado.** La base técnica, la identidad visual provisional, la PWA, el almacenamiento local y el proyecto Android están preparados. El motor de trazado educativo y las fichas de lecciones se implementarán en sprints posteriores.

---

## Qué incluye esta versión

- Interfaz completa y navegable: portada, selección de contenidos, vista previa de paquetes, pizarra libre, progreso y recompensas.
- Identidad kawaii pastel con tipografías locales, mascota SVG y pegatinas SVG.
- Pizarra táctil sobre Canvas con Pointer Events, captura de puntero, DPR y `ResizeObserver`.
- Progreso y ajustes en IndexedDB, sin registro ni datos personales.
- PWA con manifest, iconos, service worker y funcionamiento offline.
- Proyecto Android generado con Capacitor, orientación vertical, iconos y splash propios.
- 33 pruebas automatizadas, TypeScript estricto, ESLint y build de producción verificado.

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

- La app está bloqueada en orientación vertical.
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
│   │   ├── lessons/         Modelo y contenido educativo centralizado
│   │   ├── native/          Integración Android (botón Atrás)
│   │   ├── progress/        Progreso, resumen y provider
│   │   ├── pwa/             Registro del service worker
│   │   ├── rewards/         Catálogo y arte de pegatinas
│   │   ├── storage/         Capa mínima sobre IndexedDB
│   │   └── tracing/         Pizarra Canvas y utilidades de dibujo
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

Cada carácter tiene `id`, `glyph`, nombre accesible, palabra de ejemplo y orden. El modelo `lesson.types.ts` ya define `TraceStroke` y `CharacterTrace` para que el motor de trazado del Sprint 2 consuma recorridos SVG sin cambiar los datos.

Para añadir un alfabeto nuevo (por ejemplo, cursiva o pictogramas):

1. Crea una nueva entrada en `LESSON_PACKS`.
2. Usa un `scriptId` nuevo y caracteres con identificadores estables.
3. Añade sus trazos SVG cuando exista el motor de trazado.
4. Ejecuta las pruebas y actualiza `docs/architecture.md` si cambia el modelo.

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

Resultados de referencia del Sprint 0 y limitaciones conocidas: [`docs/sprint-0.md`](docs/sprint-0.md).

## Documentación

- [`docs/architecture.md`](docs/architecture.md): arquitectura, capas, flujos y guías de extensión.
- [`docs/technical-decisions.md`](docs/technical-decisions.md): registro de decisiones técnicas (ADR).
- [`docs/sprint-0.md`](docs/sprint-0.md): entregables, pruebas y tareas pendientes.
- [`ROADMAP.md`](ROADMAP.md): plan de sprints.
- [`AGENTS.md`](AGENTS.md): normas de desarrollo para OpenCode y colaboradores.
