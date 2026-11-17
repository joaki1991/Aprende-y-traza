# Sprint 0 — Validación y entrega

**Fecha:** 17 de noviembre de 2026 · **Estado:** completado ✅

Este documento resume los entregables, las verificaciones realizadas, las limitaciones conocidas y el punto de partida del Sprint 1.

## 1. Entorno de verificación

| Elemento | Valor |
| --- | --- |
| Sistema | Windows (win32) |
| Node.js | 20.15.1 |
| npm | 10.9.4 (usado para instalar por el bug de npm 10.7) |
| JDK | 21 |
| Android SDK | Platform 35, Build Tools 35.0.0 |
| Navegador de pruebas | Chromium integrado (viewport 912×678; app limitada a 560 px) |
| Emulación móvil | iframe 390×844 dentro del navegador |

## 2. Entregables

| Entregable | Estado | Dónde |
| --- | --- | --- |
| Proyecto React + Vite + TypeScript | ✅ | `package.json`, `vite.config.ts`, `src/` |
| Estructura de carpetas modular | ✅ | `src/app`, `src/modules`, `src/components`, `src/styles` |
| Dependencias configuradas y fijadas | ✅ | `package.json`, `package-lock.json` |
| TypeScript estricto | ✅ | `tsconfig.app.json`, `tsconfig.node.json` |
| ESLint 9 | ✅ | `eslint.config.js` |
| Vitest + Testing Library | ✅ | `vitest.config.ts`, `src/test/setup.ts` |
| PWA (manifest, iconos, service worker) | ✅ | `vite.config.ts`, `public/icons/`, build |
| Capacitor Android | ✅ | `capacitor.config.ts`, `android/` |
| Iconos y splash Android propios | ✅ | `android/app/src/main/res/`, `npm run icons` |
| Interfaz provisional completa | ✅ | pantallas Home, Learning, Lesson, Doodle, Progress, Rewards, 404 |
| Mascota e ilustraciones locales | ✅ | `components/mascots/MochiCat.tsx`, `modules/rewards/StickerArt.tsx` |
| Tipografías locales con licencia | ✅ | `src/assets/fonts/`, `licenses/` |
| Progreso en IndexedDB | ✅ | `modules/storage/db.ts`, `modules/progress/` |
| Documentación | ✅ | `README.md`, `AGENTS.md`, `ROADMAP.md`, `docs/` |
| Build y ejecución verificadas | ✅ | ver sección 3 |

## 3. Pruebas realizadas

### 3.1 Calidad de código

| Comando | Resultado |
| --- | --- |
| `npm run lint` | ✅ Sin errores |
| `npm run typecheck` | ✅ Sin errores |
| `npm run test:run` | ✅ 7 archivos, 33 pruebas |
| `npm run build` | ✅ 86 módulos transformados |
| `npm run icons` | ✅ PWA, favicons, iconos Android y splash regenerados |

Pruebas por área:

- Router y rutas: 7 pruebas.
- Contenidos: 4 pruebas.
- Progreso (resumen): 3 pruebas.
- Repositorio IndexedDB: 5 pruebas.
- Dibujo: 6 pruebas.
- Recompensas: 4 pruebas.
- Integración de la app: 4 pruebas.

### 3.2 Build de producción

```text
dist/manifest.webmanifest                          0.74 kB
dist/index.html                                    1.48 kB │ gzip: 0.65 kB
dist/assets/fredoka-latin-variable-*.woff2        29.73 kB
dist/assets/nunito-latin-variable-*.woff2         39.13 kB
dist/assets/index-*.css                           27.40 kB │ gzip: 6.42 kB
dist/assets/index-*.js                           275.93 kB │ gzip: 86.81 kB
PWA: 21 entradas precacheadas (464.05 KiB)
```

Artefactos generados: `dist/sw.js`, `dist/workbox-*.js`, manifest e iconos.

### 3.3 PWA y offline

- Service worker: registrado, `activated`, controlando la página (`controller: true`).
- Caché: `workbox-precache-v2-http://localhost:4173/` con los assets de la build.
- Peticiones externas durante la navegación: **0** (todo same-origin).
- Prueba offline real: se detuvo el servidor de `preview`, se recargó la pestaña y la app siguió renderizando la portada desde la caché.
- Manifest: nombre, colores, orientación vertical, iconos `any` y `maskable` generados.
- No se registra el service worker en desarrollo ni en Capacitor.

### 3.4 Interfaz y Canvas

- Portada, Aprender, vista previa de Mayúsculas, Pizarra, Progreso y Sorpresas revisadas sin errores de consola.
- Comprobación a 390×844: la portada mantiene la jerarquía, los botones grandes y las dos columnas de actividades; el footer y las decoraciones no desbordan.
- Pizarra: se dibujó un trazo sintético con Pointer Events y se comprobó que se pintaron 4.038 píxeles.
- Deshacer: dejó el lienzo a 0 píxeles pintados.
- Borrar: dejó el lienzo a 0 y “Deshacer” restauró el dibujo (3.630 píxeles).
- No se detectaron errores en consola durante las pruebas.

### 3.5 Lighthouse (build de producción)

| Categoría | Puntuación |
| --- | --- |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

Se añadió `public/robots.txt` para que la comprobación de SEO no fallara por un `robots.txt` inexistente.

### 3.6 Android

| Comprobación | Resultado |
| --- | --- |
| `npx cap sync android` | ✅ 1 plugin (`@capacitor/app`) |
| `gradlew assembleDebug` | ✅ BUILD SUCCESSFUL en 4m 18s |
| APK | `android/app/build/outputs/apk/debug/app-debug.apk` (5.286.658 bytes) |
| Package | `com.aprendeytraza.app` |
| Versión | `versionCode 1`, `versionName 0.1.0` |
| SDK | mínimo 23, target/compile 35 |
| Label | `Aprende y Traza` |
| Orientación | `portrait` (0x1) confirmada en el manifest compilado |
| Iconos/splash | Generados por `scripts/generate-icons.mjs` en todas las densidades |

No se instaló el APK en un dispositivo físico ni en un emulador en esta validación; solo se verificó la compilación y el contenido del manifest/APK.

### 3.7 Dependencias

- `npm audit`: 4 vulnerabilidades **moderadas**, todas en dependencias de desarrollo de Workbox (`glob`/`minimatch`). No afectan a las dependencias de producción ni al runtime infantil.
- No se aplica `npm audit fix --force` porque propone cambios incompatibles en Vite/vite-plugin-pwa.
- Avisos `EBADENGINE` en algunas herramientas de linting por Node 20.15.1; lint y build funcionan.

## 4. Decisiones destacadas

Resumen; el detalle está en [`technical-decisions.md`](technical-decisions.md).

1. Router hash propio en lugar de React Router: cero dependencias y compatibilidad con WebView/subdirectorios.
2. Canvas + Pointer Events con coordenadas normalizadas y DPR limitado: base del motor de trazado.
3. Trazos SVG como datos (`TraceStroke`) para que el motor del Sprint 2 no dependa de la UI.
4. IndexedDB con wrapper propio y validación defensiva, sin dependencias.
5. Fuentes Fredoka y Nunito autoalojadas, con licencias OFL.
6. Iconos, mascota y pegatinas en SVG local; PNG reproducibles con Sharp.
7. PWA con registro manual solo en web de producción.
8. Capacitor 7 con orientación vertical y botón Atrás nativo mediante `@capacitor/app`.
9. CSS Modules y tokens, sin framework de UI.
10. Recompensas derivadas de estrellas, sin inventario ni mecánicas de azar.

## 5. Limitaciones conocidas

- **No existe motor de trazado educativo.** La pizarra libre valida Canvas, gestos y ciclo de vida, pero no evalúa letras.
- **No hay fichas de lecciones ni flujo de práctica.** Las pantallas muestran el catálogo y un aviso de “muy pronto”.
- **No se pueden ganar estrellas desde la interfaz.** El repositorio tiene `addStars`, pero nada lo llama todavía.
- **No hay sonidos.** Los assets de audio se añadirán en el Sprint 7 y se incluirán en el precache.
- **No hay panel de adultos ni reset visible.** `resetProgress` existe en el repositorio, sin UI.
- **El store `settings` está vacío.** Se reserva para volumen, silencio y accesibilidad.
- **No hay firma release ni publicación.** Solo APK debug.
- **No hay pruebas en dispositivo real.** Pendiente para el Sprint 9 y recomendable antes.
- **La internacionalización no está extraída.** Los textos están en los componentes, en español.
- **Los avisos de engine/audit de tooling** quedan documentados; no bloquean el desarrollo.

## 6. Tareas pendientes recomendadas

### Antes del Sprint 1

- Instalar el APK debug en un móvil Android real y comprobar arranque, orientación, splash y botón Atrás.
- Revisar la interfaz con la niña y anotar fricciones reales (sin introducir texto excesivo).
- Decidir si la primera pantalla debe ser la portada o un acceso directo a “Aprender”.

### Sprint 1

- Pulir estados de carga/error y navegación inferior o accesos rápidos.
- Añadir ajustes para adultos con reset de progreso e información de privacidad.
- Revisar 360 px, contraste y foco.
- Añadir pruebas de navegación y de estados vacíos.

### Sprints 2–3

- Definir los trazos SVG de las 27 mayúsculas.
- Implementar evaluación tolerante y feedback.
- Crear el flujo de lección y la concesión de estrellas.

## 7. Reproducir la validación

```bash
npm install
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run preview
```

Para Android:

```bash
npm run android:sync
cd android
./gradlew assembleDebug   # Windows: gradlew.bat assembleDebug
```

Para regenerar iconos y splash:

```bash
npm run icons
```

## 8. Conclusión

El Sprint 0 entrega una base técnica coherente, offline, documentada y verificable. La app ya se puede abrir, navegar, dibujar y guardar progreso local; la PWA se instala y funciona sin red; el APK debug compila. El siguiente paso natural es convertir la pizarra y el modelo SVG en el motor de trazado del Sprint 2, sin romper las restricciones de privacidad, offline y simplicidad.
