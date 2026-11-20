# Sprint 1.5 — Orientación adaptable: vertical y horizontal

**Fecha:** 20 de noviembre de 2026
**Estado:** completado (cambios sin commitear, pendientes de revisión)
**Alcance:** permitir y aprovechar la orientación vertical y horizontal en web, PWA y Android sin tocar el contenido educativo ni el comportamiento del motor de trazado.

---

## 1. Objetivo y punto de partida

El Sprint 1 cerró con el motor de trazado y la ficha de la A mayúscula funcionando, pero la experiencia estaba pensada y bloqueada para vertical:

- `android/app/src/main/AndroidManifest.xml` fijaba `android:screenOrientation="portrait"`.
- El manifest PWA declaraba `orientation: 'portrait'` en `vite.config.ts`.
- `AppShell` limitaba toda la app a `max-width: 560px`, así que en horizontal quedaba una columna estrecha centrada con grandes márgenes vacíos.
- Las pantallas usaban una única columna sin variantes por ancho, alto o relación de aspecto.

El Sprint 1.5 elimina esos bloqueos y añade variantes horizontales reales sin rediseñar la identidad visual ni cambiar el motor geométrico.

---

## 2. Cómo se gestiona la orientación

### 2.1. Android y Capacitor

- Se eliminó `android:screenOrientation="portrait"` de la actividad principal.
- Se conserva `android:configChanges="orientation|screenSize|..."` en `MainActivity`, de modo que Android **no recrea la actividad** al girar: React mantiene el estado, la ronda en curso y el progreso.
- `MainActivity` sigue siendo `BridgeActivity`; no se añadió ningún plugin ni permiso nuevo.
- No se fuerza ninguna orientación desde JavaScript y no hay recargas al girar.

### 2.2. PWA

- `vite.config.ts` declara `orientation: 'any'` en el manifest.
- `index.html` mantiene `viewport-fit=cover` y los tokens de safe area (`--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left`) para que las barras del sistema y el notch no tapen contenido.
- El service worker, el modo offline y el registro condicional (solo producción web) no cambian.

### 2.3. Breakpoints por tamaño real, no por orientación declarada

Todas las variantes horizontales usan ancho, alto y relación de aspecto del viewport:

```css
@media (min-width: 600px) and (min-aspect-ratio: 1/1) { /* horizontal */ }
@media (max-height: 540px) and (min-aspect-ratio: 1/1) { /* horizontal con poco alto */ }
@media (max-height: 430px) and (min-aspect-ratio: 1/1) { /* horizontal muy compacto */ }
```

Así funcionan también con barras del navegador visibles, ventanas redimensionadas, pantallas plegables o un tablet en horizontal, sin depender de `orientation: landscape`.

- `AppShell` pasa de 560 px a 1120 px de ancho máximo (1200 px desde 1280 px) y ajusta padding con safe areas.
- Las decoraciones (nubes, destellos) se recolocan o se ocultan cuando el alto es escaso.
- El pie «Sin anuncios · Funciona sin internet» se oculta en horizontal de poca altura para no robar espacio al tablero.

---

## 3. Distribución vertical (sin cambios de fondo)

- Se conserva la columna centrada, los botones grandes y los textos cortos del Sprint 1.
- La portada mantiene hero + Mochi arriba y la cuadrícula 2×2 de actividades debajo.
- El ejercicio mantiene Mochi e instrucciones, pasos, tablero, pista y controles en orden vertical.
- No se añadieron desplazamientos nuevos ni se redujeron targets táctiles.

---

## 4. Distribución horizontal

### 4.1. Portada

- Hero y Mochi a la izquierda; las cuatro actividades en cuadrícula 2×2 a la derecha.
- El título se limita para que no se estire en pantallas anchas.

### 4.2. Aprender y selección de mundos

- Los tres mundos pasan a una fila adaptable (`repeat(auto-fit, minmax(240px, 1fr))`), con tarjetas más bajas que en vertical.

### 4.3. Vista previa de paquete

- Dos columnas: a la izquierda el mundo, el acceso directo y el aviso; a la derecha la cuadrícula de fichas y el acceso a la pizarra.
- La cuadrícula gana columnas, así que las 27 fichas no alargan la pantalla.
- Se añadieron dos envoltorios de presentación (`.primary` y `.secondary`) en `LessonPreviewScreen` para agrupar el contenido sin cambiar la lógica.

### 4.4. Pantalla de trazado (la parte clave)

- CSS Grid con áreas nombradas: el **tablero ocupa la columna izquierda a todo el alto** y la derecha concentra cabecera, Mochi, pasos, pista y controles.
- El tablero nunca se encoge para dejar sitio al texto:

```css
.board {
  width: min(100%, calc((100dvh - 88px) * 5 / 7));
}

/* horizontal con menos de 540 px de alto */
.board {
  width: min(100%, calc((100dvh - 40px) * 5 / 7));
}
```

- Se mantiene `aspect-ratio: 5 / 7` en todos los casos, así que el tablero crece hasta donde permite el alto real del viewport.
- La celebración se compacta (Mochi más pequeño, textos ajustados) pero conserva «Otra vez» como acción principal.
- Los controles «Repetir» y «Volver» bajan a 48 px de alto solo en horizontal de poca altura; en el resto de casos mantienen 56–58 px.

### 4.5. Progreso y recompensas

- Progreso: tarjeta de estrellas a la izquierda; «Tu camino» a la derecha; la pista ocupa el ancho inferior.
- Recompensas: información y próximo objetivo a la izquierda; pegatinas en tres columnas a la derecha.

---

## 5. Integridad del motor de trazado

No se modificó `traceGeometry.ts`, `traceValidation.ts`, `traceSession.ts` ni la lógica de `TraceCanvas`. Se revisó y se reforzó lo siguiente:

1. **Coordenadas del `viewBox`**: la tinta se guarda en coordenadas `0 0 100 140`, no en píxeles. Un giro no invalida los puntos ya dibujados.
2. **Proporción 5:7**: el tablero conserva `aspect-ratio: 5 / 7`; el tamaño cambia, la proporción no.
3. **Guía y canvas alineados**: la guía SVG usa `preserveAspectRatio="none"` para compartir exactamente la misma transformación que el canvas, incluso cuando el borde del tablero resta algún píxel al área interior. Medido en navegador: guía y canvas coinciden en x, y, ancho y alto en vertical y horizontal.
4. **Tolerancias**: se expresan como fracción del lado menor del `viewBox`; no dependen del tamaño en píxeles. Hay pruebas nuevas con tablero horizontal y tablet que verifican que un desplazamiento de 12 unidades se rechaza igual en cualquier tamaño.
5. **Redimensionado**: `TraceCanvas` sigue usando su `ResizeObserver` con DPR limitado a 3; no se duplicó lógica de resize.
6. **Estado de la ronda**: al girar no se remonta la pantalla (no cambia el hash ni la clave de ruta), así que el paso actual se conserva.
7. **Persistencia**: cada intento y cada ronda completada siguen pasando por `recordPractice()` e IndexedDB.

---

## 6. Pruebas

### 6.1. Automatizadas

- `src/test/resizeObserver.ts` (nuevo): doble controlable de `ResizeObserver` con `triggerResizeObservers()` y limpieza entre pruebas. `setup.ts` lo usa en jsdom.
- `src/app/TraceFlow.test.tsx`:
  - completa la A en vertical;
  - completa la A **después de girar a horizontal a mitad de ronda**, conservando el paso y registrando la ronda en IndexedDB;
  - rechaza un trazo fuera de orden **después de girar**.
- `src/app/App.test.tsx`: portada, menú Aprender y selección de letras, progreso y recompensas en viewports horizontales (844×390 y 640×360).
- `src/modules/tracing/traceValidation.test.ts`: validación correcta en tablero horizontal y tablet; tolerancias estables al cambiar de tamaño.
- `src/app/orientation.test.ts` (nuevo): guarda de regresión que lee `AndroidManifest.xml`, `vite.config.ts` e `index.html` como texto (`?raw`) y comprueba que nadie vuelve a bloquear la orientación ni a quitar `viewport-fit=cover`.

Resultado: **12 archivos, 81 pruebas, todas en verde** (antes: 11 archivos, 72 pruebas).

### 6.2. Verificación manual en Chromium

Se montó una página local con tres `iframe` a tamaño real (escalados solo al mostrarse) para probar el comportamiento real de media queries, `ResizeObserver` y layout:

| Viewport | Portada, Aprender, fichas, pizarra, progreso, recompensas | Trazado | Overflow horizontal |
| --- | --- | --- | --- |
| 390 × 844 | correcto | A completada | 0 px |
| 844 × 390 | correcto | A completada, dos zonas | 0 px |
| 640 × 360 | correcto | A completada, dos zonas | 0 px |

Mediciones del tablero:

| Viewport | Tablero | Canvas / guía | Relación |
| --- | --- | --- | --- |
| 390 × 844 | 325 × 455 | 320 × 450 | 0,7143 (5:7) |
| 844 × 390 | 250 × 350 | 245 × 346 | 0,7143 (5:7) |
| 640 × 360 | 229 × 320 | 224 × 315 | 0,7143 (5:7) |

Otras comprobaciones:

- En horizontal, la zona de Mochi empieza a la derecha del tablero (x = 524 frente a borde derecho 393 en 844×390).
- Ningún target táctil medido por debajo de 44 px; los principales miden 58 px en vertical y 48–52 px en horizontal compacto.
- Se completaron los tres trazos de la A en los tres tamaños; el rechazo de trazos fuera de orden, invertidos y garabatos queda cubierto por las pruebas del motor. No hubo errores ni avisos de consola.
- Las 17 peticiones observadas fueron todas a `localhost:4173`; ninguna externa.
- **Giro real a mitad de ronda**: se dibujó el primer trazo en 390×844, se cambió el iframe a 844×390 (dispara media queries y `ResizeObserver`), y se completaron los trazos 2 y 3 sin perder el paso. El progreso quedó en IndexedDB con `completions` incrementado.
- **Offline**: con el service worker activo se detuvo el servidor de preview y se recargó la pestaña; la app volvió a renderizar la portada desde la caché. Después se reinició el servidor.

---

## 7. Android

- `npm run android:apk` ejecutado: build web + `cap sync android` + `assembleDebug`.
- El APK debug queda en `android/app/build/outputs/apk/debug/app-debug.apk` (5,04 MB, 20/11/2026 12:40).
- El manifest final de la actividad no contiene `screenOrientation` y conserva `configChanges` con `orientation` y `screenSize`.
- **No se ha probado en un dispositivo ni emulador Android real**: no había emulador disponible en el entorno. La comprobación de orientación en Android se limita al manifest y a la build; las pruebas funcionales se hicieron en Chromium.

---

## 8. Limitaciones y notas

- El navegador integrado usado para verificar no permite emular la ausencia de red ni la rotación física del dispositivo; la rotación se simuló con iframes a tamaño real y el offline deteniendo el servidor. Falta una pasada en un móvil Android real.
- Las safe areas se aplican vía `env(safe-area-inset-*)`; solo se pueden ver con notch real o emulación de dispositivo.
- En horizontal con menos de 430 px de alto se ocultan algunos textos secundarios (descripciones de pegatinas, aviso de la vista previa). Es deliberado para priorizar el tablero y los botones.
- Los botones «Repetir»/«Volver»/«Otra vez» bajan a 48 px en horizontal muy compacto; siguen por encima del mínimo de 44 px.
- Las pruebas de jsdom no aplican media queries: verifican estado, orden y persistencia; la geometría visual se comprobó en Chromium.

---

## 9. Archivos tocados en el Sprint 1.5

Configuración y layout:

- `android/app/src/main/AndroidManifest.xml`
- `vite.config.ts`
- `src/components/layout/AppShell.module.css`

Pantallas:

- `src/modules/home/HomeScreen.tsx` y `.module.css`
- `src/modules/learning/LearningScreen.tsx` y `.module.css`
- `src/modules/learning/LessonPreviewScreen.tsx` y `.module.css`
- `src/modules/tracing/TraceScreen.module.css`
- `src/modules/tracing/TraceGuide.tsx`
- `src/modules/progress/ProgressScreen.tsx` y `.module.css`
- `src/modules/rewards/RewardsScreen.tsx` y `.module.css`

Pruebas:

- `src/test/resizeObserver.ts` (nuevo)
- `src/test/setup.ts`
- `src/app/orientation.test.ts` (nuevo)
- `src/app/App.test.tsx`
- `src/app/TraceFlow.test.tsx`
- `src/modules/tracing/traceValidation.test.ts`

Documentación:

- `docs/sprint-1.5.md` (este documento)
- `README.md`, `ROADMAP.md`, `docs/architecture.md`, `docs/technical-decisions.md`, `AGENTS.md`
