# AGENTS.md — Normas de desarrollo

Guía para agentes de OpenCode y para cualquier persona que contribuya a **Aprende y Traza**. El objetivo es proteger la simplicidad, la privacidad infantil y el funcionamiento offline mientras el proyecto crece por sprints.

## 1. Contexto

- App educativa kawaii para una niña de ~4 años: trazar mayúsculas, minúsculas y números.
- Interfaz en **español**; identificadores de código en **inglés**.
- Prioridad absoluta: **móvil Android vertical**, botones grandes, lectura mínima, uso con dedos pequeños.
- Estado actual: **Sprint 0 cerrado**. No implementes funcionalidades de sprints futuros sin que se pida explícitamente.

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
- **`src/modules/native/`**: integraciones Capacitor aisladas.

Reglas:

- No dupliques componentes: si un patrón se repite, extráelo a `components/`.
- Mantén la lógica de negocio fuera de los componentes de presentación.
- Usa el alias `@/` para imports internos.
- Los archivos de una pantalla viven en su módulo (`XScreen.tsx` + `XScreen.module.css`).
- No mezcles estilos de negocio en `base.css`; usa tokens y CSS Modules.

## 5. Contenidos educativos

- Fuente única de verdad: `src/modules/lessons/content.ts`.
- Modelo: `src/modules/lessons/lesson.types.ts`.
- Cada carácter necesita `id` estable, `glyph`, `spokenName`, `exampleWord` y `order`.
- Los paquetes se identifican por `packId` (`mayusculas`, `minusculas`, `numeros`).
- Los trazos SVG se describen con `TraceStroke`; no los incrustes en componentes de pantalla.
- Para añadir un alfabeto, crea un paquete nuevo con su `scriptId`; no dupliques la estructura de pantallas.
- Añade o actualiza pruebas de contenido al cambiar el catálogo (longitud, ids únicos, Ñ, palabras de ejemplo).

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

La pizarra actual (`src/modules/tracing/DoodleCanvas.tsx`) es la referencia técnica para el motor del Sprint 2.

- Usa **Pointer Events** (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) y captura del puntero.
- Mantén las coordenadas **normalizadas (0–1)** en el modelo, para que el redimensionado no deforme el dibujo.
- Gestiona **devicePixelRatio** (limitado a 3) y `ResizeObserver`.
- Cancelar `requestAnimationFrame`, desconectar observadores y liberar referencias en el cleanup.
- `touch-action: none`, `user-select: none` y prevención de menú contextual dentro del lienzo.
- No repintes todo el lienzo en cada movimiento si puedes pintar solo el segmento nuevo.
- No añadas una segunda librería de dibujo. El motor educativo debe reutilizar estas utilidades.
- El motor de evaluación de trazos del Sprint 2 irá en `src/modules/tracing/` y consumirá `TraceStroke`; no lo implementes todavía.

## 8. Persistencia

- IndexedDB: base `aprende-y-traza`, versión `1`, stores `progress` y `settings`.
- Toda lectura/escritura pasa por `src/modules/storage/db.ts` y `progress.repository.ts`.
- Valida los datos al leer: si están corruptos o son de una versión desconocida, vuelve a un estado vacío en lugar de romper la app.
- Si cambias el esquema, incrementa `DB_VERSION`, añade migración y prueba apertura desde una versión anterior.
- No guardes nombres, edad, ubicación, identificadores de dispositivo ni nada personal.
- No introduzcas `localStorage` para progreso; IndexedDB es la fuente de verdad.

## 9. PWA y offline

- Configuración en `vite.config.ts` (`VitePWA`).
- El service worker se registra **solo** en build de producción web; nunca en desarrollo ni en Capacitor (`registerPwa.ts`).
- Si añades assets nuevos (sonidos, imágenes), incluye su extensión en `globPatterns` si corresponde.
- Mantén el manifest en español, orientación `portrait` y colores `#ffd6e7` / `#fff6fb`.
- Al cambiar el icono, ejecuta `npm run icons`; no edites PNG a mano.
- Verifica el modo offline con `npm run build && npm run preview`, recarga una vez y luego desactiva la red.

## 10. Android y Capacitor

- Configuración: `capacitor.config.ts`; proyecto nativo en `android/`.
- Tras cambiar assets web o plugins: `npm run android:sync`.
- No edites `android/app/src/main/assets/public/` ni los JSON generados; se sobrescriben.
- Mantén `screenOrientation="portrait"`, el nombre `Aprende y Traza` y el id `com.aprendeytraza.app`.
- El botón Atrás se gestiona en `src/modules/native/hardwareBack.ts`. Si añades rutas nuevas, comprueba que el historial sigue funcionando.
- No añadas permisos Android que no sean necesarios. `INTERNET` se conserva por el funcionamiento estándar de Capacitor, pero la app no debe hacer peticiones de red.
- Los iconos y splash se regeneran con `npm run icons` en `android/app/src/main/res/`.

## 11. Pruebas

Antes de dar una tarea por terminada:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

- Añade pruebas para lógica pura nueva (contenidos, progreso, recompensas, router, dibujo).
- Usa `fake-indexeddb` para el repositorio; no mockees IndexedDB a mano.
- Prueba los estados de error y los datos corruptos, no solo el camino feliz.
- No reduzcas el número de pruebas ni silencies errores de consola para que pasen.
- Si tocas Android, ejecuta al menos `npm run android:sync` y, si es posible, `assembleDebug`.

## 12. Documentación y decisiones

- Cambios de arquitectura: actualiza `docs/architecture.md`.
- Decisiones relevantes (nueva dependencia, cambio de almacenamiento, cambio de estrategia offline): añade una entrada ADR en `docs/technical-decisions.md`.
- Cambios de alcance: actualiza `ROADMAP.md` y `docs/sprint-0.md` si afecta al estado.
- No dejes documentación desactualizada: forma parte de la definición de terminado.

## 13. Estilo de commits

Conventional Commits, en español y con scope:

```text
feat(sprint-0): preparar arquitectura, PWA y Android
fix(tracing): liberar el puntero al cancelar el trazo
docs(arquitectura): documentar el modelo de trazos SVG
test(progress): cubrir datos corruptos en IndexedDB
```

Un commit debe poder explicarse solo. No mezcles refactors masivos con funcionalidades nuevas.

## 14. Dónde tocar cada cosa

| Necesito… | Archivo |
| --- | --- |
| Añadir una pantalla | `src/modules/<dominio>/`, `src/app/router.ts`, `src/app/App.tsx` |
| Añadir una ruta | `src/app/router.ts` + prueba en `router.test.ts` |
| Añadir un carácter o paquete | `src/modules/lessons/content.ts` |
| Cambiar colores/tipografía | `src/styles/tokens.css` |
| Añadir un componente compartido | `src/components/` |
| Añadir una recompensa | `src/modules/rewards/rewards.ts` + `StickerArt.tsx` |
| Cambiar el progreso | `src/modules/progress/*` y `storage/db.ts` |
| Cambiar la PWA | `vite.config.ts` + `public/icons/` |
| Cambiar Android | `capacitor.config.ts` + `android/app/src/main/` |
| Regenerar iconos | `npm run icons` |

## 15. Definición de terminado

Una tarea está terminada cuando:

- Compila sin errores ni warnings nuevos.
- Pasa lint, typecheck y pruebas.
- Funciona en viewport móvil y mantiene el diseño kawaii.
- Sigue funcionando offline (si aplica).
- No introduce recursos remotos, datos personales ni dependencias injustificadas.
- La documentación y las decisiones quedan actualizadas.
