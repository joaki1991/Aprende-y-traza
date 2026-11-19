# Sprint 1 — Motor de trazado educativo

**Fecha:** 19 de noviembre de 2026 · **Estado:** completado ✅

Este sprint convierte el modelo `TraceStroke` del Sprint 0 en un motor real de
trazado con evaluación geométrica, una ficha completa para la **A mayúscula**,
interacción táctil y registro local del progreso. No se implementan todavía las
64 fichas, las minúsculas, los números ni la economía de estrellas.

## 1. Objetivo y alcance

**Objetivo:** que la niña pueda entrar en Aprender → Mayúsculas → A, seguir el
recorrido correcto con el dedo y completar la letra, con evaluación tolerante,
feedback amable y persistencia en IndexedDB.

**Incluido:**

- Motor geométrico puro, separado de React y del Canvas.
- Tres trazos ordenados para la A mayúscula.
- Pantalla de ejercicio con guía SVG, tinta Canvas, flecha e indicador de trazo.
- Validación de inicio, recorrido, dirección, cobertura, final y orden.
- Rechazo de garabatos y de trazos en orden incorrecto.
- Feedback de éxito, reintento sin mensajes negativos y celebración final.
- Registro de intentos, resultado, precisión y fecha en el progreso existente.
- Pruebas unitarias e integración del flujo completo.
- Documentación y APK debug actualizado.

**Fuera de alcance:** las 27 mayúsculas restantes, minúsculas, números, sonidos,
estrellas definitivas, pegatinas nuevas, panel de adultos, backend y nuevas
dependencias.

## 2. Flujo de usuario

```text
Portada → Aprender → Mayúsculas
  → «Trazar la A» (CTA o ficha de la A)
  → pantalla de trazado
       trazo 1: diagonal izquierda
       trazo 2: diagonal derecha
       trazo 3: línea del medio
  → celebración con Mochi y «Otra vez»
  → «Volver» regresa a las letras
```

Las demás letras del paquete siguen mostrando su ficha descriptiva y, al abrir
su ruta, una pantalla amable de «¡Muy pronto!». No hay callejones sin salida.

## 3. Modelo de la A mayúscula

Sistema de coordenadas: `viewBox="0 0 100 140"`, origen arriba a la izquierda.
El tablero conserva la proporción 5:7 para que la guía y la tinta compartan
exactamente el mismo sistema.

| Orden | Trazo | Recorrido | Inicio | Fin | Instrucción |
| --- | --- | --- | --- | --- | --- |
| 1 | Diagonal izquierda | `M50 16 L20 122` | (50, 16) | (20, 122) | Baja desde la punta hacia la izquierda. |
| 2 | Diagonal derecha | `M50 16 L80 122` | (50, 16) | (80, 122) | Vuelve arriba y baja hacia la derecha. |
| 3 | Línea del medio | `M29.6 88 L70.4 88` | (29.6, 88) | (70.4, 88) | Cruza una línea en el medio, de izquierda a derecha. |

Cada trazo declara `id`, `order`, `path`, `label`, `instruction`, `start`, `end`,
`direction` y `tolerance` (fracción del lado menor del `viewBox`).

Los datos viven en `src/modules/lessons/traces/uppercase.ts` y se consultan a
través del registro `src/modules/lessons/traces/index.ts`. La pantalla no
contiene geometría: solo consume `CharacterTrace`.

## 4. Algoritmo de validación

La validación es geometría pura en `src/modules/tracing/traceValidation.ts`,
apoyada en `traceGeometry.ts`. No importa React, DOM ni Canvas, por lo que se
prueba de forma aislada.

### 4.1. Preparación

1. El canvas convierte cada puntero de píxeles a coordenadas del `viewBox`
   usando el rectángulo real y el `viewBox` del carácter.
2. El `path` SVG se muestrea en una polilínea con longitud acumulada. Se admiten
   `M`, `L`, `H`, `V`, `C`, `S`, `Q`, `T` y `Z`, en mayúsculas o minúsculas.
3. El trazo del dedo se normaliza como polilínea y se descartan puntos a menos
   de 1,2 px para no acumular ruido.

### 4.2. Métricas

| Métrica | Cálculo | Uso |
| --- | --- | --- |
| `startDistance` | Distancia del primer punto al inicio oficial. | Debe ser ≤ tolerancia × 1,5. |
| `endDistance` | Distancia del último punto al final oficial. | Debe ser ≤ tolerancia × 1,8. |
| `coverage` | Proporción de puntos oficiales que tienen tinta dentro de la tolerancia. | Debe ser ≥ 0,86. |
| `accuracy` | Proporción de puntos dibujados que están dentro del pasillo. | Debe ser ≥ 0,72. |
| `direction` | Proporción de avances con progreso creciente frente a retrocesos. | Debe ser ≥ 0,70. |
| `endProgress` | Progreso máximo alcanzado sobre el recorrido. | Debe ser ≥ 0,82. |
| `lengthRatio` | Longitud dibujada / longitud oficial. | Debe ser ≤ 3,4. |
| `minPoints` | Puntos válidos mínimos. | 4. |

La tolerancia por defecto es `0.11` del lado menor del `viewBox`; la A usa
`0.11` en las diagonales y `0.12` en la línea central. Al depender del `viewBox`
y no de los píxeles, el resultado es el mismo en cualquier tamaño de pantalla.

### 4.3. Reglas de rechazo

Se emite un issue por cada regla incumplida:

- `too-short`: menos de 4 puntos o longitud insuficiente.
- `start-too-far`: no empieza cerca del punto inicial.
- `finish-too-far`: no termina cerca del punto final.
- `off-path`: demasiada desviación respecto al recorrido.
- `incomplete`: cobertura o progreso insuficientes.
- `backwards`: la mayor parte del avance va en sentido contrario.
- `scribble`: recorrido mucho más largo que el oficial.
- `wrong-order`: el trazo dibujado coincide con otro trazo pendiente.

### 4.4. Detección de orden incorrecto

Si el trazo actual falla, el motor vuelve a evaluar el mismo dibujo contra los
trazos restantes. Si alguno se habría aceptado, añade `wrong-order` y devuelve
`orderHint` con su número de orden. Así se detecta que la niña ha empezado por
la diagonal derecha o por la línea central.

La sesión (`traceSession.ts`) impone el orden: solo evalúa el trazo actual. Un
intento rechazado no avanza el índice, no borra puntuaciones y no penaliza.

### 4.5. Puntuación

La puntuación de un trazo aceptado es:

```text
score = 0.45 × cobertura + 0.35 × precisión + 0.20 × dirección
```

Se redondea a tres decimales y se usa para guardar la mejor precisión y para
mostrar la celebración. No otorga estrellas todavía.

## 5. Interfaz y Canvas

### 5.1. Componentes

- `TraceScreen.tsx`: estado de la ronda, instrucciones de Mochi, pasos, feedback,
  celebración, repetir, volver y persistencia.
- `TraceGuide.tsx`: guía SVG con puntos, trazo actual, trazos completados,
  punto de inicio pulsante, flecha de dirección y línea base.
- `TraceCanvas.tsx`: capa transparente de tinta con Pointer Events.
- `traceSession.ts`: máquina de estados pura de la ronda.
- `traceValidation.ts` / `traceGeometry.ts`: motor geométrico.

### 5.2. Ciclo táctil

```text
pointerdown → preventDefault + captura del puntero + punto inicial
pointermove → eventos coalescidos, conversión a viewBox, puntos filtrados,
              pintado solo del segmento nuevo
pointerup   → libera captura y envía el trazo a validar
pointercancel / lostpointercapture → descarta el trazo activo y limpia la tinta
resize      → ResizeObserver, DPR limitado a 3 y repintado completo
unmount     → cancela rAF, desconecta el observer y libera referencias
```

`touch-action: none`, sin selección de texto ni menú contextual. El tablero
mantiene una proporción fija de 5:7 y se limita a
`min(100%, 340px, 38.5dvh)` para aprovechar el alto del móvil sin deformar la
letra.

### 5.3. Feedback

- Trazo aceptado: borde verde, paso marcado con ✓, mensaje de Mochi y avance
  automático tras 800 ms.
- Trazo rechazado: borde rosa suave, mensaje concreto según el issue
  («Empieza en el punto verde», «Ve en el sentido de la flecha»…) y reinicio
  automático del trazo tras 900 ms.
- Ronda completa: superposición con Mochi, «¡Bravo!», mensaje positivo y botón
  «Otra vez».
- Nunca se usan `alert`, `confirm`, mensajes negativos ni castigos.

## 6. Persistencia

Se reutiliza el store `progress` y el repositorio existente. No hay un segundo
sistema de almacenamiento.

`recordPractice(input)` actualiza el carácter:

| Campo | Comportamiento |
| --- | --- |
| `attempts` | Suma cada ronda completada y cada trazo rechazado. |
| `completions` | Suma una vez por ronda completada. |
| `bestAccuracy` | Conserva la mejor puntuación entre 0 y 1. |
| `lastResult` | `completed` o `incomplete`. |
| `lastPracticedAt` | Fecha del último registro. |
| `starsEarned` | Se preserva; no se otorgan estrellas todavía. |

Los datos antiguos o corruptos se normalizan de forma defensiva: enteros no
negativos, precisión dentro de 0–1 y fechas finitas. La interfaz actualiza el
contexto de progreso tras cada guardado.

## 7. Rutas y navegación

| Hash | Pantalla |
| --- | --- |
| `#/aprender` | Selección de mundos |
| `#/aprender/:packId` | Vista previa del paquete |
| `#/aprender/:packId/:characterId` | Ficha de trazado |
| `#/pizarra` | Pizarra libre |
| `#/progreso` | Progreso |
| `#/recompensas` | Recompensas |

`characterHref(packId, characterId)` centraliza los enlaces. El botón Atrás del
navegador y el botón físico de Android funcionan con el router hash existente.

## 8. Pruebas

Se añadieron 39 pruebas nuevas; el total pasa de 33 a **72**.

| Archivo | Pruebas | Cobertura |
| --- | --- | --- |
| `traceGeometry.test.ts` | 11 | viewBox, muestreo SVG, distancias, progreso y conversión desde píxeles. |
| `traceValidation.test.ts` | 10 | trazo correcto, invertido, inicio/final fuera, incompleto, desviación, garabato, orden incorrecto y tamaños de pantalla. |
| `traceSession.test.ts` | 8 | avance ordenado, salto de trazo, error y reintento, fin de ronda, reset y precisión media. |
| `progress.repository.test.ts` | 10 (5 nuevas) | rondas completadas/fallidas, mejor precisión, estrellas intactas y datos corruptos. |
| `TraceFlow.test.tsx` | 2 | Aprender → Mayúsculas → A → tres trazos → celebración → IndexedDB; y rechazo por saltarse un trazo. |
| `App.test.tsx` | 6 | ficha de la A, título, enlace de vuelta y estado «muy pronto». |
| `router.test.ts` | 8 | ruta de ficha, enlaces y `routeKey`. |

Casos obligatorios cubiertos:

- Trazo correcto ✅
- Trazo invertido ✅
- Inicio fuera de tolerancia ✅
- Final fuera de tolerancia ✅
- Recorrido incompleto ✅
- Desviación excesiva ✅
- Trazo en orden incorrecto ✅
- Intento de saltarse un trazo ✅
- Repetición después de un error ✅
- Diferentes tamaños de pantalla ✅
- Integración del flujo completo y persistencia ✅

### 8.1. Resultados

```text
npm run lint       → ✅ sin errores
npm run typecheck  → ✅ sin errores
npm run test:run   → ✅ 11 archivos, 72 pruebas
npm run build      → ✅ 97 módulos, PWA con 21 entradas precacheadas
```

## 9. Verificación manual en navegador

Build de producción servida con `npm run preview` y cargada dentro de un iframe
de **390 × 844** (viewport móvil real, `dvh` y media queries activos).

- La pantalla no desborda: `scrollWidth = clientWidth = 390`,
  `scrollHeight = clientHeight = 844`.
- Todos los controles visibles miden al menos 56 px de alto:
  volver (56), «Otra vez» (58), «Repetir» (58), «Volver» (58).
- Se dibujaron los tres trazos con Pointer Events sintéticos y el resultado fue
  la celebración «¡Bravo! La A está preciosa.».
- IndexedDB quedó con `attempts: 1`, `completions: 1`,
  `lastResult: "completed"`, `bestAccuracy: 1`, `packId: "mayusculas"` y
  `starsEarned: 0`.
- Se repitió el ejercicio empezando por la diagonal derecha: apareció
  «¡Casi! Primero toca este trazo. Sigue la flecha rosa.», no hubo celebración,
  no se usaron mensajes negativos y el progreso registró un intento
  `incomplete` conservando la ronda completada anterior.
- Cero errores de consola y cero peticiones externas.

## 10. Build de producción

```text
dist/manifest.webmanifest                          0.74 kB
dist/index.html                                    1.48 kB │ gzip: 0.65 kB
dist/assets/fredoka-latin-variable-*.woff2        29.73 kB
dist/assets/nunito-latin-variable-*.woff2         39.13 kB
dist/assets/index-*.css                           35.09 kB │ gzip: 7.96 kB
dist/assets/index-*.js                           297.96 kB │ gzip: 94.28 kB
PWA: 21 entradas precacheadas (493.07 KiB)
```

## 11. Android

| Comprobación | Resultado |
| --- | --- |
| `npm run android:apk` | ✅ `BUILD SUCCESSFUL` en 39 s |
| APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Tamaño | 5.286.658 bytes (5,04 MB) |
| Fecha | 2026-11-19 13:43:07 |
| Assets web | Incluyen `index-BSIlsNg-.js` y `index-BN8tyYTt.css` de este sprint |
| Package / orientación | `com.aprendeytraza.app` / `portrait` (sin cambios) |

No se instaló en un dispositivo físico ni en emulador; la compilación y el
contenido del APK sí se verificaron.

## 12. Archivos modificados

**Nuevos**

- `src/modules/lessons/traces/uppercase.ts`
- `src/modules/lessons/traces/index.ts`
- `src/modules/tracing/traceGeometry.ts` + test
- `src/modules/tracing/traceValidation.ts` + test
- `src/modules/tracing/traceSession.ts` + test
- `src/modules/tracing/TraceGuide.tsx` + CSS
- `src/modules/tracing/TraceCanvas.tsx` + CSS
- `src/modules/tracing/TraceScreen.tsx` + CSS
- `src/app/TraceFlow.test.tsx`
- `docs/sprint-1.md`

**Modificados**

- `src/modules/lessons/lesson.types.ts` — `instruction` y `tolerance`.
- `src/modules/learning/LessonPreviewScreen.tsx` + CSS — CTA y fichas disponibles.
- `src/app/router.ts` + test — ruta de ficha y `characterHref`.
- `src/app/App.tsx` — título y pantalla de trazado.
- `src/app/App.test.tsx` — cobertura de la ficha y del estado «muy pronto».
- `src/modules/progress/progress.types.ts` — `completions` y `lastResult`.
- `src/modules/progress/progress.repository.ts` + test — `recordPractice`.
- `src/modules/progress/progressContext.ts` y `ProgressProvider.tsx` — acción de guardado.
- `src/test/setup.ts` — doble mínimo de Canvas 2D para jsdom.
- `ROADMAP.md`, `README.md`, `AGENTS.md`, `docs/architecture.md`,
  `docs/technical-decisions.md`, `docs/sprint-0.md`.

## 13. Limitaciones conocidas

- **Solo existe la ficha de la A mayúscula.** El resto se muestra como «muy
  pronto»; el motor ya admite cualquier número de trazos.
- **El muestreador SVG no soporta arcos (`A`).** Las letras con curvas
  circulares deberán usar `C`/`Q` o ampliar el muestreador antes de definirlas.
- **Un único orden pedagógico.** Se exige empezar arriba y seguir el orden
  definido; variantes válidas de escritura se rechazan a propósito para enseñar
  el trazo escolar.
- **Sin deshacer ni demostración animada.** Solo se puede repetir el ejercicio
  o volver al listado.
- **Sin estrellas ni sonidos.** El progreso registra intentos y precisión, pero
  la economía de recompensas y el audio llegan en sprints posteriores.
- **Sin calibración por niña.** Las tolerancias son fijas y adaptadas al tamaño
  del tablero, no al historial de cada usuaria.
- **Cerrar la app a mitad de ronda no registra ese intento parcial.** Se guarda
  al fallar un trazo, al completar, al repetir o al volver.
- **jsdom no dibuja Canvas real.** Las pruebas usan dobles; la interacción
  táctil se verificó en Chromium y queda pendiente en un Android físico.

## 14. Siguiente paso

Sprint 2: completar las 27 mayúsculas con el mismo modelo, añadir pruebas de
integridad de todos los trazos y pulir la experiencia visual/navegación antes
del flujo de lecciones. No hace falta reescribir el motor: basta con registrar
nuevos `CharacterTrace` y validar sus datos.
