# Registro de decisiones técnicas (ADR)

Decisiones tomadas durante los sprints 0, 1, 1.5 y 2. Formato ligero: contexto → decisión → consecuencias. Una decisión nueva debe añadirse aquí, no solo al código.

---

## ADR-001 — React + Vite + TypeScript estricto

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** app educativa pequeña, offline, con UI muy interactiva y necesidad de iterar rápido sin backend.

**Decisión:** React 19, Vite 6 y TypeScript 5.9 en modo estricto (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).

**Consecuencias:**

- Componentes y ecosistema conocidos; build rápido.
- El tipado estricto obliga a modelar bien contenidos y progreso desde el inicio.
- Vite 6 y `@vitejs/plugin-react` 4.7 se eligen por compatibilidad con Node 20.15.1; las últimas majors exigen Node 20.19+/22.
- No se usa `any` ni `@ts-ignore`.

---

## ADR-002 — Router propio basado en hash

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** la app debe funcionar en un subdirectorio, en el WebView de Capacitor y con el botón Atrás, sin configurar un servidor.

**Decisión:** implementar un router mínimo en `src/app/router.ts` con `hashchange`, `useSyncExternalStore` y rutas tipadas. No se añade React Router.

**Consecuencias:**

- Cero dependencias y control total del comportamiento nativo.
- Las URLs son `#/aprender/mayusculas`, estables y compartibles.
- No hay rutas anidadas, loaders ni code splitting por ruta; no se necesitan en este alcance.
- Añadir una ruta exige tocar varios puntos pequeños y sus pruebas.

---

## ADR-003 — Canvas con Pointer Events y coordenadas normalizadas

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** el trazado infantil necesita respuesta inmediata al dedo, soporte táctil/lápiz/ratón y resistencia a cambios de tamaño y densidad de pantalla.

**Decisión:**

- HTML5 Canvas 2D.
- Pointer Events con captura del puntero y eventos coalescidos.
- Puntos normalizados (0–1) en el modelo; píxeles solo al pintar.
- DPR limitado a 3, `ResizeObserver` y repintado incremental.
- `touch-action: none`, sin selección de texto ni menú contextual.

**Consecuencias:**

- Funciona igual en web y Android; el dibujo no se deforma al rotar o redimensionar.
- El motor educativo del Sprint 2 puede reutilizar la geometría y el ciclo de vida.
- Hay que gestionar manualmente cleanup, cancelación y restauración de estado.
- Los trazos se guardan en memoria; no se persisten todavía (la pizarra es libre).

---

## ADR-004 — Recorridos de letras en SVG descritos como datos

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** las letras y números necesitan un recorrido pedagógico (inicio, dirección, orden de trazos) que el motor pueda evaluar y la UI pueda dibujar.

**Decisión:** modelar `TraceStroke` con atributo `d` de `<path>` SVG, puntos de inicio/fin, dirección y orden; agruparlos en `CharacterTrace` con `viewBox` (`0 0 100 140` por convención). Los datos viven en `modules/lessons/`, separados de React y Canvas.

**Consecuencias:**

- Se pueden dibujar guías con SVG nítido y evaluar con la misma geometría.
- Añadir un alfabeto es añadir datos, no duplicar pantallas.
- En Sprint 0 solo están los tipos y el catálogo; las definiciones completas llegan en Sprint 2/4.
- La evaluación futura deberá ser tolerante con trazos infantiles; el modelo no impone umbrales.

---

## ADR-005 — IndexedDB con una capa mínima propia

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** hay que guardar progreso y ajustes sin registro, sin backend y sin añadir peso.

**Decisión:** base `aprende-y-traza` versión 1, stores `progress` y `settings`, con un wrapper propio (`storage/db.ts`) y un repositorio específico (`progress.repository.ts`). Se valida el registro al leer y se vuelve a progreso vacío si es corrupto o de versión desconocida.

**Consecuencias:**

- Cero dependencias (no Dexie ni `idb`).
- Control explícito de transacciones, errores y versionchange.
- El esquema está preparado para migraciones; hay que incrementar `DB_VERSION` y probarlas.
- Un único registro de progreso simplifica el Sprint 0; el Sprint 5 podrá añadir stores o índices.

---

## ADR-006 — Tipografías locales autoalojadas

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** la app debe funcionar sin Internet y sin Google Fonts.

**Decisión:** copiar los WOFF2 variables de **Fredoka** y **Nunito** (subconjunto latino) desde los paquetes de Fontsource a `src/assets/fonts/`, declararlos con `@font-face` y guardar las licencias OFL en `licenses/`. Se eliminan las dependencias `@fontsource-variable/*` una vez copiados los archivos.

**Consecuencias:**

- Sin peticiones externas ni dependencias de fuentes en runtime.
- Solo se cargan dos archivos (≈ 30 kB y ≈ 39 kB).
- Las actualizaciones de fuente son manuales y deben conservar la licencia.

---

## ADR-007 — Arte SVG local e iconos generados con Sharp

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** se necesitan mascota, iconos, pegatinas, iconos PWA y assets Android sin recursos remotos ni binarios difíciles de mantener.

**Decisión:** dibujar mascota, iconos de UI y pegatinas como SVG/React. Generar PNG de PWA, favicons, iconos Android y splash con `scripts/generate-icons.mjs` usando Sharp (dependencia de desarrollo).

**Consecuencias:**

- Iconos nítidos, ligeros y versionables como código.
- `npm run icons` reproduce todos los PNG; no se editan a mano.
- Sharp solo se usa en desarrollo/build, no se envía al cliente.
- Los iconos adaptativos de Android usan un primer plano transparente y fondo pastel sólido.

---

## ADR-008 — PWA con vite-plugin-pwa y registro manual

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** la app debe instalarse y funcionar offline, pero el service worker no debe interferir en el WebView de Capacitor ni en desarrollo.

**Decisión:** `vite-plugin-pwa` 1.3 en modo `generateSW`, `registerType: 'autoUpdate'`, `injectRegister: null` y registro manual en `modules/pwa/registerPwa.ts`, solo si `import.meta.env.PROD` y no es plataforma nativa. Precache de JS, CSS, HTML, SVG, PNG, ICO, manifest, WOFF2 y WAV.

**Consecuencias:**

- Una sola build genera manifest, service worker y precache.
- El modo offline se prueba con `npm run preview`; en desarrollo no hay caché.
- `npm audit` reporta vulnerabilidades moderadas de `glob`/`minimatch` dentro de Workbox (herramientas de build). No afectan al runtime infantil; no se aplica `npm audit fix --force` porque degradaría Vite/PWA.
- Si se añaden sonidos u otros formatos, hay que ampliar `globPatterns`.

---

## ADR-009 — Capacitor 7 para Android con botón Atrás nativo

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** se necesita un APK Android sin reescribir la app, en vertical, con navegación coherente.

**Decisión:** Capacitor 7 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`), `appId com.aprendeytraza.app`, `webDir dist`, orientación vertical en el manifest y `@capacitor/app` para el botón Atrás. El proyecto `android/` se versiona; los assets web copiados y los archivos de Gradle se ignoran.

**Consecuencias:**

- Un solo código para web y Android.
- `npm run android:sync` es obligatorio tras cada build web.
- Compilar requiere JDK 21 y Android SDK 35; el APK debug se genera con Gradle.
- El botón Atrás vuelve a la pantalla anterior y cierra la app en la portada.
- La app no hace peticiones de red; el permiso `INTERNET` se conserva por el comportamiento estándar de Capacitor.

---

## ADR-010 — CSS Modules y tokens, sin framework de UI

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** se busca una identidad kawaii muy concreta, con botones grandes y animaciones suaves, sin peso innecesario.

**Decisión:** CSS moderno con variables en `styles/tokens.css`, CSS Modules por componente y componentes propios. Sin Tailwind, styled-components ni librería de componentes.

**Consecuencias:**

- Control total del diseño y del tamaño del bundle.
- Los estilos quedan encapsulados y son fáciles de revisar.
- Hay que mantener a mano la coherencia visual; los tokens son la fuente de verdad.
- Los tests de UI se apoyan en roles y textos, no en clases.

---

## ADR-011 — Recompensas derivadas de estrellas

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** la motivación debe ser simbólica, offline y sin mecánicas de azar o compra.

**Decisión:** catálogo estático de pegatinas con hitos de estrellas (0, 1, 3, 5, 8, 12). El estado bloqueado/desbloqueado se deriva de `progress.stars`; no se guarda un inventario aparte.

**Consecuencias:**

- No hay estados duplicados ni recompensas perdidas.
- Cambiar un umbral recalcula el álbum automáticamente.
- Las estrellas se ganarán con las fichas de trazado en sprints posteriores; en Sprint 0 el contador empieza en 0 y la primera pegatina está disponible.
- No hay monedas, loot boxes, compras ni publicidad.

---

## ADR-012 — Contenido educativo centralizado y basado en datos

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** se prevén mayúsculas, minúsculas, números y futuros alfabetos, sin duplicar pantallas.

**Decisión:** `modules/lessons/content.ts` define paquetes y caracteres con ids estables; las pantallas iteran sobre `LESSON_PACKS`. Las palabras de ejemplo están en español y la Ñ se incluye en ambos alfabetos.

**Consecuencias:**

- 64 caracteres en Sprint 0 (27 + 27 + 10).
- Añadir un alfabeto no requiere tocar Home, Learning ni Rewards.
- Los ids son claves de progreso: cambiarlos exige migración.
- El modelo es serializable y testeable sin DOM.

---

## ADR-013 — Vitest + Testing Library + fake-indexeddb

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** se necesita verificar lógica, rutas, componentes e IndexedDB sin un navegador real.

**Decisión:** Vitest 4 con jsdom, Testing Library, `jest-dom` y `fake-indexeddb`. Setup común en `src/test/setup.ts` con stub de `ResizeObserver` y `scrollTo`.

**Consecuencias:**

- Pruebas rápidas y integradas con Vite.
- El repositorio se prueba contra una implementación real de IndexedDB en memoria.
- jsdom no reproduce Canvas ni gestos táctiles; el dibujo se prueba a nivel de utilidades puras y se valida manualmente en navegador/dispositivo.
- Los tests de integración cubren navegación y render, no píxeles.

---

## ADR-014 — Manejo defensivo de errores y datos

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** una niña de 4 años no debe ver pantallas rotas ni mensajes técnicos.

**Decisión:** `ErrorBoundary` global con tarjeta amable y recarga; pantalla 404 con vuelta al inicio; validación de progreso con caída a estado vacío; estado `error` con reintento en Progreso; cierre seguro de trazos cancelados.

**Consecuencias:**

- La app degrada con dignidad ante fallos de almacenamiento o render.
- Nunca se muestran stack traces al usuario.
- Los errores se registran solo en consola local.
- El reset silencioso de datos corruptos es aceptable en Sprint 0; el Sprint 5 añadirá migraciones probadas.

---

## ADR-015 — Privacidad y offline como restricciones de diseño

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** app infantil, sin cuenta, que debe funcionar en un dispositivo compartido y sin conexión.

**Decisión:** no hay backend, analítica, anuncios, tracking, enlaces externos, compras ni recursos remotos. Todo el estado vive en IndexedDB. La build incluye fuentes, SVG, iconos y datos.

**Consecuencias:**

- No se recoge ningún dato personal; no hay que gestionar consentimiento ni retención.
- La app funciona en modo avión tras la primera carga/instalación.
- Las mejoras futuras (sonidos, contenido) deben empaquetarse, no descargarse.
- La única concesión es el permiso `INTERNET` estándar de Capacitor, que no se usa para peticiones de la app.

---

## ADR-016 — Interfaz en español, código en inglés

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** la usuaria y su familia hablan español; el equipo técnico trabaja con convenciones internacionales.

**Decisión:** todos los textos visibles, nombres accesibles y documentación de producto en español; identificadores, tipos, archivos y commits en inglés (los mensajes de commit pueden ser descriptivos en español).

**Consecuencias:**

- La niña y los adultos entienden la app.
- El código sigue convenciones habituales y es fácil de mantener.
- Las futuras traducciones deberán extraer textos a un catálogo; hoy están en los componentes por simplicidad.

---

## ADR-017 — Fijar versiones compatibles con Node 20.15

**Fecha:** 2026-11-17 · **Estado:** aceptada

**Contexto:** el entorno tiene Node 20.15.1 y npm 10.7.0. Las últimas versiones de Vite, plugin-react, Vitest y Capacitor exigen Node 20.19+ o 22+.

**Decisión:** fijar Vite 6.4, `@vitejs/plugin-react` 4.7, Vitest 4.1.12 (compatible con Node 20), Capacitor 7, TypeScript 5.9 y vite-plugin-pwa 1.3. Instalar con `npx -y npm@10.9.4` cuando npm 10.7 falla con `edgesOut`.

**Consecuencias:**

- Todo el pipeline funciona en el entorno actual.
- Algunas dependencias de tooling (por ejemplo `eslint-visitor-keys`) muestran avisos `EBADENGINE`, pero lint y build pasan; conviene actualizar Node a 20.19+/22 en el futuro.
- No se actualizan majors sin una tarea dedicada y verificación completa.
- `npm audit` deja 4 vulnerabilidades moderadas en dependencias de desarrollo de Workbox; no se fuerza la corrección porque rompería la compatibilidad.

---

## ADR-018 — Validación geométrica por métricas, no por proximidad simple

**Fecha:** 2026-11-19 · **Estado:** aceptada

**Contexto:** aprobar un trazo solo porque el dedo pasa cerca de la letra permitiría completar garabatos, recorridos parciales o trazos en sentido contrario. La usuaria tiene unos 4 años, así que la exigencia debe ser clara pero tolerante.

**Decisión:** evaluar cada trazo con métricas independientes sobre la polilínea oficial muestreada:

- cobertura del recorrido (≥ 0,86),
- precisión de los puntos dibujados (≥ 0,72),
- dirección de avance (≥ 0,70),
- progreso final (≥ 0,82),
- distancia al inicio (tolerancia × 1,5) y al final (× 1,8),
- ratio de longitud máxima 3,4,
- mínimo 4 puntos.

La puntuación es `0.45 × cobertura + 0.35 × precisión + 0.20 × dirección`. Todos los umbrales son configurables por opciones y las tolerancias se expresan como fracción del lado menor del `viewBox`.

**Consecuencias:**

- Un garabato, un trazo invertido o un recorrido a medias se rechazan con un motivo concreto.
- El mismo trazo se evalúa igual en cualquier tamaño de pantalla.
- Las letras futuras pueden ajustar tolerancia por trazo sin tocar el algoritmo.
- Los umbrales habrá que revisarlos con trazos reales de la niña; hoy están calibrados con trazos sintéticos.

---

## ADR-019 — El `viewBox` es el sistema de coordenadas único del ejercicio

**Fecha:** 2026-11-19 · **Estado:** aceptada

**Decisión:** la guía se dibuja como SVG y la tinta como Canvas transparente superpuesto, ambos con la misma proporción 5:7. El canvas convierte cada evento de puntero a coordenadas del `viewBox` antes de guardar el punto; la validación, el pintado y la guía trabajan siempre en ese sistema.

**Consecuencias:**

- Redimensionar o cambiar de densidad de pantalla no altera ni el dibujo ni el resultado.
- La tinta y la guía quedan alineadas sin cálculos duplicados.
- El tablero debe conservar la proporción del `viewBox`; deformarla invalidaría la geometría. Por eso el CSS fija `aspect-ratio: 5 / 7`.
- jsdom no implementa Canvas 2D: las pruebas montan un contexto mínimo y la interacción real se verifica en Chromium.

---

## ADR-020 — Sesión ordenada y feedback sin penalización

**Fecha:** 2026-11-19 · **Estado:** aceptada

**Contexto:** el orden de escritura forma parte del aprendizaje y la niña no debe sentir que falla.

**Decisión:** una máquina de estados pura (`traceSession.ts`) evalúa solo el trazo actual. Si el dibujo coincide con otro trazo pendiente, la validación añade `wrong-order` y `orderHint`; la sesión no avanza. Un rechazo incrementa el contador interno y permite repetir inmediatamente. La interfaz traduce cada issue a una frase amable y reinicia el trazo automáticamente sin mensajes negativos.

**Consecuencias:**

- No se puede aprobar la letra saltándose trazos ni alterando el orden.
- El estado es testeable sin DOM y no se duplica en la UI.
- La corrección es visible pero no punitiva; no hay vidas, cronómetros ni bloqueos.
- En el futuro se podrá añadir una demostración o una pista sin cambiar el contrato de la sesión.

---

## ADR-021 — Registrar la práctica en el progreso existente, sin estrellas todavía

**Fecha:** 2026-11-19 · **Estado:** aceptada

**Decisión:** ampliar `CharacterProgress` con `completions` y `lastResult` opcionales y añadir `recordPractice()` al repositorio existente. Cada trazo rechazado registra un intento `incomplete`; cada ronda completada registra un intento `completed` con la precisión media. No se modifican las estrellas ni se crea un store nuevo.

**Consecuencias:**

- Se cumple el requisito de intentos, resultado y fecha sin duplicar persistencia.
- Los datos antiguos siguen siendo válidos y se normalizan al leer.
- La economía de estrellas queda libre para un sprint posterior sin migración destructiva.
- Cerrar la app a mitad de ronda no registra ese intento parcial; se evita escribir en cada movimiento para no castigar el rendimiento.

---

## ADR-022 — Orientación libre y breakpoints por tamaño real del viewport

**Fecha:** 2026-11-20 · **Estado:** aceptada · **Sustituye en parte a:** ADR-009

**Contexto:** la app nació bloqueada en vertical (manifest Android, manifest PWA y una columna de 560 px). Una niña pequeña suele girar el móvil y muchos tablets se usan en horizontal; mantener el bloqueo desperdicia espacio y obliga a una experiencia estirada. A la vez, girar no puede recargar la app ni perder la ronda en curso.

**Decisión:**

- Quitar `android:screenOrientation` del manifest y conservar `configChanges` con `orientation` y `screenSize` para que Android no recree la actividad.
- Declarar `orientation: 'any'` en el manifest PWA.
- Elegir las variantes de layout por tamaño real (`min-width`, `max-height`, `min-aspect-ratio`), no por `orientation`.
- Mantener la columna vertical como base y añadir una distribución horizontal de dos columnas para portada, aprender, vista previa, progreso, recompensas y trazado.
- Derivar el tamaño del tablero del alto disponible (`calc((100dvh - …) * 5 / 7)`), conservando la proporción 5:7.
- Aplicar safe areas con `env(safe-area-inset-*)` en el shell.

**Consecuencias:**

- La app funciona en vertical y horizontal sin recargas ni pérdida de estado.
- El tablero no se encoge por culpa de las instrucciones en horizontal.
- Los breakpoints reaccionan a barras del navegador, ventanas redimensionadas y pantallas plegables, no solo a la orientación declarada.
- Un target secundario puede bajar a 48 px en horizontal de poca altura, siempre por encima de 44 px.
- Queda pendiente verificar la rotación física y las safe areas en un dispositivo Android real.

---

## ADR-023 — La guía SVG comparte la transformación exacta del canvas

**Fecha:** 2026-11-20 · **Estado:** aceptada

**Contexto:** el tablero tiene un borde de 3 px y `aspect-ratio: 5 / 7`, así que el área interior no es exactamente 5:7 (por ejemplo, 320 × 450). Con `preserveAspectRatio` por defecto, el SVG centra el `viewBox` y deja una franja de menos de un píxel, mientras el canvas mapea la tinta a todo el rectángulo. La desviación es pequeña, pero rompe la promesa de alineación perfecta entre guía y tinta.

**Decisión:** declarar `preserveAspectRatio="none"` en la guía SVG para que el `viewBox` se estire exactamente al mismo rectángulo que usa el canvas. Ambos comparten así la misma transformación afín, independientemente del tamaño o de los bordes.

**Consecuencias:**

- La guía y la tinta quedan alineadas en cualquier orientación y tamaño, incluso si el contenedor redondea algún píxel.
- La deformación máxima es inferior al 1 % y es idéntica para la guía y para el trazo, por lo que no afecta a la validación (que trabaja en coordenadas del `viewBox`).
- Las pruebas de geometría y validación no cambian: el motor sigue siendo independiente del DOM.

---

## ADR-024 — Arcos SVG nativos para las figuras redondas

**Fecha:** 2026-11-20 · **Estado:** aceptada

**Contexto:** las mayúsculas y minúsculas cerradas (O, C, G, o, c, a, b, d, g, p, q) y los números 0 y 9 necesitan curvas suaves y verificables. Las aproximaciones con curvas cúbicas son posibles, pero obligan a ajustar puntos de control a mano y hacen más difícil razonar sobre el cierre del bucle.

**Decisión:** ampliar `samplePath` con el comando `A/a` y su conversión de punto final a centro de la especificación SVG (radios corregidos, rotación, flags de arco grande y sentido). Los bucles completos se describen con dos arcos que terminan en los extremos superior e inferior, con radios que garantizan un centro único. Los arcos se muestrean como el resto de curvas y la tolerancia sigue siendo una fracción del lado menor del `viewBox`.

**Consecuencias:**

- Las figuras redondas se definen con pocos números y se leen como se dibujan.
- El muestreo es correcto para arcos pequeños, grandes, con rotación y con radios imposibles (se corrigen como indica el estándar).
- Un arco de radio cero se degrada a línea recta y un arco sin desplazamiento no se dibuja, sin romper la app.
- Sigue habiendo una sola implementación de geometría; no se añade ninguna librería de dibujo.
- Las curvas de 3, 5, 6 y 8 se mantienen con cúbicas porque su forma no es un arco simple.

---

## ADR-025 — Puntos independientes con `kind: 'dot'`

**Fecha:** 2026-11-20 · **Estado:** aceptada

**Contexto:** la i y la j incluyen un punto que no es un recorrido: la niña debe tocar, no arrastrar. Validarlo con las métricas de cobertura, dirección y progreso daría resultados absurdos y podría aceptar garabatos largos.

**Decisión:** añadir `TraceStrokeKind = 'stroke' | 'dot'` y el campo opcional `kind` a `TraceStroke`. La guía dibuja los puntos como círculo sin flecha y la validación usa una rama propia (`evaluateDot`) con tres factores sobre la tolerancia del trazo: inicio × 1,5, distancia máxima × 1,6 y longitud máxima × 2,4. No se tocan los umbrales globales de los demás trazos.

**Consecuencias:**

- Un toque en el punto se acepta; un toque lejos o un arrastre largo se rechazan con mensajes amables.
- El punto conserva su posición y su orden dentro de la ficha.
- Los trazos normales mantienen exactamente la validación del Sprint 1.
- El modelo sigue siendo datos puros y las pruebas no necesitan DOM.

---

## ADR-026 — Dirección medida por avance neto, con bucles cerrados

**Fecha:** 2026-11-20 · **Estado:** aceptada

**Contexto:** la métrica de dirección contaba pasos con un umbral fijo de 0,01 de progreso. Con los 64 trazos aparecieron dos fallos: en un recorrido denso cada paso avanza menos de 0,01 (la O correcta daba dirección 0), y en un bucle cerrado el último punto se proyecta sobre el inicio (salto 0,995 → 0) y se contaba como retroceso. El recorrido inverso de la O aprovechaba justo lo contrario y se aceptaba.

**Decisión:** sumar los avances y los retrocesos en lugar de contarlos. En los trazos cuyo inicio y fin coinciden (distancia ≤ 0,5 unidades del `viewBox`), el progreso se desenvuelve: un salto menor que −0,5 se interpreta como continuación sumando 1. La dirección es `avance / (avance + retroceso)`.

**Consecuencias:**

- La métrica no depende del número de muestras ni del tamaño del tablero.
- El recorrido correcto de la O, 0, 8 y las bolas de a/b/d/g/p/q se acepta con dirección 1.
- El recorrido inverso se rechaza con `backwards` en todos los bucles.
- No se debilitan la cobertura, la precisión ni los umbrales; solo se corrige el cálculo.
- Los trazos abiertos siguen usando la misma fórmula sin desenvolverse.

---

## ADR-027 — Progreso v2 con migración al leer, sin tocar `DB_VERSION`

**Fecha:** 2026-11-21 · **Estado:** aceptada

**Contexto:** el Sprint 3 necesita guardar composiciones (dibujos coloreados y pizarra libre), pero las instalaciones existentes ya tienen un documento con `schemaVersion: 1` y no se puede perder el progreso de la niña. Cambiar la base de IndexedDB no es necesario: el store `progress` guarda un único documento validado en JavaScript.

**Decisión:** subir `PROGRESS_SCHEMA_VERSION` a 2 y migrar el documento al leerlo. La migración añade `artworks: {}`, crea una composición vacía para cada ficha con `starsEarned >= 1`, ajusta `stars` al número de fichas completadas si el valor antiguo era menor y conserva el resto de campos. Es idempotente y no destructiva. `DB_VERSION` sigue en 1. Las escrituras pasan por una cola para que dos guardados concurrentes no se pisen.

**Consecuencias:**

- Una instalación anterior sigue abriendo y conserva estrellas, intentos y precisión.
- Completar una ficha antes del Sprint 3 desbloquea su lámina al actualizar.
- Los datos corruptos o de una versión desconocida siguen cayendo en un estado vacío seguro.
- Cualquier cambio futuro del documento debe subir `PROGRESS_SCHEMA_VERSION` y añadir su migración; solo los cambios de stores o keyPaths suben `DB_VERSION`.

---

## ADR-028 — Láminas SVG propias organizadas por regiones

**Fecha:** 2026-11-21 · **Estado:** aceptada

**Contexto:** colorear una imagen plana con un cubo de pintura no es posible sin máscaras ni segmentación. Se necesitan dibujos infantiles reales, sin recursos remotos ni bitmaps, que funcionen offline y permitan rellenar zonas independientes.

**Decisión:** dibujar 37 láminas propias como datos SVG en TypeScript (`artworks/drawings/`). Cada lámina usa `viewBox` de 400 × 400, fondo transparente, trazo oscuro `#4a3a48` y regiones cerradas con `id` estable. Los constructores (`ellipsePath`, `ringPath`, `starPath`, `heartPath`…) generan paths cerrados y legibles. Las caritas y adornos van en `details`, separados de las regiones rellenables. Mayúscula y minúscula comparten lámina (`letter-a`); la Ñ usa `letter-enye`.

**Consecuencias:**

- El cubo solo cambia `fills[regionId]`; no hay máscaras ni efecto sobre regiones vecinas.
- No se descargan imágenes, no hay placeholders y el paquete funciona offline.
- Las láminas se pueden probar sin DOM (ids únicos, 37 totales, paths cerrados y mapeo desde el catálogo educativo).
- Añadir una lámina es añadir datos, no una pantalla nueva.

---

## ADR-029 — Composición vectorial con capas fijas

**Fecha:** 2026-11-21 · **Estado:** aceptada

**Contexto:** la pizarra mezcla rellenos por región, trazos libres y pegatinas. Guardar capturas del lienzo en cada movimiento sería pesado y perdería calidad al redimensionar. Además, los contornos deben quedar siempre visibles para que el resultado parezca un dibujo para colorear.

**Decisión:** guardar solo datos vectoriales: `fills` por id de región, `strokes` con puntos normalizados y `widthRatio`, y `stickers` con centro normalizado y escala. Renderizar en capas fijas de abajo a arriba: rellenos SVG, canvas de tinta, contornos SVG y pegatinas. El autoguardado agrupa cambios con 650 ms de retardo y fuerza el guardado al ocultar la pestaña o desmontar; el historial de deshacer se limita a 30 pasos.

**Consecuencias:**

- La composición ocupa poco y sobrevive a recargas y cambios de tamaño sin pixelarse.
- Los contornos no se pueden tapar con el cubo y las pegatinas siempre quedan encima.
- Nunca se guardan bitmaps ni data URLs del canvas.
- Los límites de 400 trazos y 60 pegatinas protegen el almacenamiento y el rendimiento.

---

## ADR-030 — Pegatinas interactivas, no decorativas

**Fecha:** 2026-11-21 · **Estado:** aceptada

**Contexto:** el sprint pide que las pegatinas desbloqueadas se puedan colocar, mover, redimensionar y quitar dentro de la pizarra, y que su estado sobreviva al cierre. La galería de Recompensas ya usa las mismas piezas SVG.

**Decisión:** modelar cada colocación como `PlacedSticker { id, kind, x, y, scale }`, con `x`/`y` normalizados respecto al tablero y `scale` relativo al ancho. La capa usa Pointer Events para seleccionar y arrastrar; el tamaño se cambia con botones grandes `-` y `+` (0,1 a 0,45); se elimina con un botón grande. `StickerTray` solo muestra las pegatinas desbloqueadas por estrellas y reutiliza `StickerArt`.

**Consecuencias:**

- Se pueden colocar varias pegatinas del mismo tipo sin duplicar el catálogo.
- La interacción es táctil y no depende de controles diminutos ni de gestos de pinza.
- Posición y tamaño se recuperan al reabrir la composición.
- El catálogo, los costes y las reglas de estrellas existentes no cambian.

---

## ADR-031 — Una sola pizarra para dibujo libre y colorear

**Fecha:** 2026-11-21 · **Estado:** aceptada

**Contexto:** había una pizarra libre con su propio canvas (`DoodleCanvas`) y el modo colorear necesitaba casi lo mismo: tinta, colores, grosores, deshacer y limpiar. Mantener dos pantallas duplicaría estado y autoguardado, y aumentaría el riesgo de que una se quedara atrás.

**Decisión:** retirar `DoodleCanvas` y unificar todo en `ArtworkBoard` con `InkCanvas` como capa de tinta. Sin `template` es la pizarra libre (`playground`); con `template` es una lámina del catálogo y aparecen el cubo de relleno y los contornos. `DoodleScreen` resuelve carga, error, bloqueo y monta la pizarra; la ruta `#/pizarra/dibujo/:id` selecciona la lámina.

**Consecuencias:**

- Un único ciclo de autoguardado, deshacer y herramientas para los dos modos.
- La pizarra libre conserva su comportamiento y ahora también admite pegatinas y persiste entre sesiones.
- El modo colorear añade relleno por región sin duplicar el motor de dibujo.
- Se elimina código y superficie de pruebas; no se añade ninguna librería.
