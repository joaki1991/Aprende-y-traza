# Sprint 2 — Catálogo completo de letras y números

**Fecha:** 20 de noviembre de 2026
**Estado:** completado (cambios sin commitear, pendientes de revisión)
**Alcance:** implementar las 64 fichas educativas sobre el motor de trazado existente, sin duplicar pantallas ni lógica.

---

## 1. Objetivo y punto de partida

El Sprint 1.5 cerró con la interfaz adaptada a vertical y horizontal, pero solo la **A mayúscula** tenía recorrido registrado. El resto de fichas mostraban un aviso amable y el catálogo completo no se podía practicar.

El Sprint 2 no reescribe el motor: amplía lo mínimo necesario para representar todas las formas y registra las 64 fichas en el mismo flujo:

```text
Portada → Aprender → Categoría → Carácter → Ejercicio → Celebración
```

El estado de Git al empezar era `HEAD` = `origin/main` = `df02b8a` (Sprint 1.5 guardado). Los cambios del Sprint 2 quedan sin commitear.

---

## 2. Catálogo implementado

| Paquete | Fichas | Archivo |
| --- | --- | --- |
| Mayúsculas | 27 (A–Z + Ñ) | `src/modules/lessons/traces/uppercase.ts` |
| Minúsculas | 27 (a–z + ñ) | `src/modules/lessons/traces/lowercase.ts` |
| Números | 10 (0–9) | `src/modules/lessons/traces/digits.ts` |
| **Total** | **64** | registro en `traces/index.ts` |

Cada ficha mantiene `characterId` estable, `viewBox` `0 0 100 140`, entre 1 y 4 trazos ordenados, `label`, `instruction`, `start`, `end`, `direction` y, cuando aporta, `tolerance`.

La A mayúscula conserva exactamente la geometría aprobada en el Sprint 1:

```text
M50 16 L20 122
M50 16 L80 122
M29.6 88 L70.4 88
```

---

## 3. Geometrías y proporciones

### 3.1. Sistema de coordenadas

- `viewBox="0 0 100 140"` (proporción 5:7), origen arriba a la izquierda.
- Mayúsculas y números: altura superior `y=16`, línea base `y=122`.
- Minúsculas: altura de x `y=62`, línea base `y=122`.
- Ascendentes (b, d, f, h, k, l, t): desde `y=16–30`.
- Descendentes (g, j, p, q, y): hasta `y=132–138`.
- La Ñ mayúscula usa el cuerpo de la N desde `y=24` para dejar espacio a la virgulilla (`y≈8–14`); la ñ minúscula mantiene la altura de x y coloca la virgulilla en `y≈43–55`.

### 3.2. Orden pedagógico

- **A:** diagonal izquierda → diagonal derecha → línea central.
- **E:** vertical → horizontal superior → horizontal central → horizontal inferior.
- **F:** vertical → horizontal superior → horizontal central.
- **Ñ mayúscula:** cuerpo de la N (3 trazos) → virgulilla.
- **ñ minúscula:** vertical → arco → virgulilla.
- **i / j:** línea (con gancho en la j) → punto independiente.
- Letras de varios trazos (B, D, G, K, M, N, P, Q, R, T, X, Y, f, k, m, r, t, x, y, 4, 7) respetan un orden de escritura natural de izquierda a derecha y de arriba abajo.

### 3.3. Formas especiales

- **Bucles cerrados** (O, Q, o, a, d, g, p, q, 0, 6, 8, 9): se dibujan con dos arcos con extremos en la parte superior e inferior, de modo que el centro es único y el cierre coincide con el inicio.
- **Curvas** (B, C, G, S, U, b, c, e, f, h, m, n, r, s, u, 2, 3, 5, 6, 8, 9): cúbicas con puntos de control suaves.
- **Números 2 y 5** se diferencian por su arranque (2 empieza en curva alta y termina con base; 5 empieza con barra superior y termina en barriga).
- **3, 6, 8 y 9** tienen recorridos propios, no escalados de letras.

---

## 4. Soporte de comandos SVG

`traceGeometry.ts` ya muestreaba `M/L/H/V/C/S/Q/T/Z`. Se añadió:

- **`A` y `a`** (arco elíptico) con la conversión de punto final a centro de la especificación SVG:
  - corrección de radios demasiado pequeños,
  - rotación del eje,
  - flags de arco grande (`large-arc`) y sentido (`sweep`),
  - muestreo del ángulo resultante,
  - radio cero → línea recta; arco sin desplazamiento → no se dibuja.
- El parser reconoce el comando y consume sus siete parámetros.
- Todos los paths siguen teniendo un único subcamino (`M`), requisito del motor y de la guía.

No se añadió ninguna dependencia: la conversión y el muestreo son código propio y puro.

---

## 5. Puntos de i y j

Se añadió `TraceStrokeKind = 'stroke' | 'dot'` y el campo opcional `kind`:

- `kind: 'dot'` describe un toque, no un recorrido.
- La guía lo dibuja como círculo sin flecha (`dotMark`).
- `evaluateDot` valida con factores propios sobre la tolerancia del trazo:
  - inicio × 1,5,
  - distancia máxima × 1,6,
  - longitud máxima × 2,4.
- No se modificaron los umbrales globales: un trazo normal sigue evaluándose igual que en el Sprint 1.

---

## 6. Validación

### 6.1. Corrección de la métrica de dirección

La métrica contaba pasos con un umbral fijo de `0,01` de progreso. Con los 64 trazos apareció un doble fallo en los bucles cerrados:

- En un recorrido denso cada paso avanza menos de `0,01`, así que la O correcta obtenía dirección `0` y se rechazaba con `backwards`.
- El último punto del bucle se proyecta sobre el inicio (`0,995 → 0`), generando un retroceso artificial.
- El recorrido inverso aprovechaba justo lo contrario y se aceptaba.

La métrica ahora suma avances y retrocesos en lugar de contarlos. En trazos cerrados (inicio y fin a menos de `0,5` unidades) el progreso se desenvuelve: un salto menor que `−0,5` se interpreta como continuación. La dirección es `avance / (avance + retroceso)`.

Resultado: la O, el 0, el 8 y las bolas de a/b/d/g/p/q se aceptan con dirección `1`; sus recorridos inversos se rechazan con `backwards`.

### 6.2. Tolerancias

- Se mantiene `DEFAULT_TOLERANCE_RATIO = 0.11` y los umbrales del Sprint 1 (cobertura 0,86; precisión 0,72; dirección 0,70; progreso 0,82; ratio 3,4; inicio × 1,5; fin × 1,8; mínimo 4 puntos).
- No se debilitó la validación para que pasaran las letras: los dos fallos eran de cálculo, no de exigencia.
- Las tolerancias siguen siendo fracción del lado menor del `viewBox`, así que no cambian con el tamaño de pantalla.

### 6.3. Casos cubiertos

| Caso | Resultado |
| --- | --- |
| Recorrido oficial de los 64 caracteres | Aceptado; la ficha se completa |
| Recorrido inverso de cualquier trazo con recorrido | Rechazado (`backwards` / `start-too-far`) |
| Trazo siguiente dibujado antes de tiempo | Rechazado (`wrong-order` con `orderHint`) |
| Garabato vertical sobre la ficha | Rechazado |
| Toque en el punto de i/j | Aceptado |
| Toque lejos o arrastre largo sobre el punto | Rechazado |
| Línea de la i dibujada como si fuera su punto | Rechazado |

---

## 7. Interfaz y textos

- `LessonPreviewScreen`: con el catálogo completo muestra «¡Todas las fichas están listas!» y explica que se puede elegir cualquier letra o número.
- `TraceScreen`: artículo correcto (`la` para letras, `el` para números) en título, instrucción y celebración («La A está preciosa» / «El 0 está genial»).
- `TraceCanvas`: `aria-label` adaptado a «número» o «letra».
- `App.pageTitle`: título del documento con artículo correcto (`Trazar el 8`).
- No se rediseñaron pantallas ni se añadieron flujos nuevos: el Sprint 1.5 se mantiene.

---

## 8. Pruebas

### 8.1. Resultado

```text
14 archivos · 113 pruebas · todas verdes
```

Antes del Sprint 2 había 12 archivos y 81 pruebas.

### 8.2. Pruebas nuevas o ampliadas

- `src/modules/lessons/traces.test.ts` (15 pruebas):
  - 64 fichas exactas (27 + 27 + 10), sin duplicados;
  - `viewBox`, orden, ids únicos, extremos de path, límites del tablero;
  - un único subcamino por trazo;
  - tolerancias coherentes y solo en trazos normales;
  - A intacta, Ñ = N + virgulilla, puntos de i/j, uso de arcos;
  - autotrazado de las 64 fichas;
  - rechazo del recorrido inverso, del salto de orden y de un garabato en todas las fichas.
- `traceGeometry.test.ts`: semicircunferencia con longitud, bucle cerrado tipo O/0, radio cero como línea, arco grande vs. pequeño y arco incompleto.
- `traceValidation.test.ts`: aceptación y rechazo de puntos de i/j, garabato sobre el punto, confusión con la línea y detección de orden.
- `TraceFlow.test.tsx`: flujo completo de `lower-a`, `digit-0` y `lower-i` (incluido el toque del punto) con persistencia en IndexedDB.
- `App.test.tsx`: catálogo de números disponible y título correcto con artículo.
- `TraceFallback.test.tsx`: aviso amable si un carácter declarado no tiene trazos (con doble de `getCharacterTrace`).

### 8.3. Puertas de calidad

```bash
npm run lint       # sin errores
npm run typecheck  # sin errores
npm run test:run   # 14 archivos, 113 pruebas
npm run build      # correcto; PWA con 21 entradas precacheadas
```

---

## 9. Comprobación visual en Chromium

Se revisó una **selección representativa** (no las 64 a mano) en la build de producción con `npm run preview`:

| Ficha | Qué se comprobó |
| --- | --- |
| `upper-a` | Geometría intacta, 3 pasos, flecha y punto de inicio |
| `upper-e` | Cuatro trazos rectos en orden |
| `upper-ñ` | Cuerpo de N + virgulilla, 4 pasos |
| `upper-o` | Bucle cerrado con arco y sin discontinuidad |
| `lower-i` | Punto independiente representado como círculo |
| `lower-g` | Bola + descendente por debajo de la línea base |
| `digit-0` | Bucle cerrado redondo |
| `digit-3` | Dos barrigas y arranque arriba |
| `digit-5` | Barra superior, vertical y barriga |
| `digit-8` | Dos bucles encadenados |

- Ventana horizontal: 916 × 678. Sin desbordamiento horizontal.
- Vista vertical: iframe de 387 × 777 sobre la app real. La distribución vertical se mantiene y el tablero se alcanza desplazando.
- Se comprobó que Aprender → Mayúsculas/Minúsculas/Números muestra las 27/27/10 fichas, sin «¡Muy pronto!» y sin elementos deshabilitados.
- La consola del navegador no mostró errores.

Las capturas no se adjuntan al repositorio porque el proyecto no guarda imágenes de documentación; la verificación se hizo en la build real servida localmente.

---

## 10. Archivos tocados

**Código**

- `src/modules/lessons/lesson.types.ts`
- `src/modules/lessons/traces/uppercase.ts`
- `src/modules/lessons/traces/lowercase.ts` (nuevo)
- `src/modules/lessons/traces/digits.ts` (nuevo)
- `src/modules/lessons/traces/index.ts`
- `src/modules/tracing/traceGeometry.ts`
- `src/modules/tracing/traceValidation.ts`
- `src/modules/tracing/TraceGuide.tsx` y `TraceGuide.module.css`
- `src/modules/tracing/TraceCanvas.tsx`
- `src/modules/tracing/TraceScreen.tsx`
- `src/modules/learning/LessonPreviewScreen.tsx`
- `src/app/App.tsx`

**Pruebas**

- `src/modules/lessons/traces.test.ts` (nuevo)
- `src/modules/tracing/traceGeometry.test.ts`
- `src/modules/tracing/traceValidation.test.ts`
- `src/app/TraceFlow.test.tsx`
- `src/app/App.test.tsx`
- `src/app/TraceFallback.test.tsx` (nuevo)

**Documentación**

- `README.md`, `ROADMAP.md`, `docs/architecture.md`, `docs/technical-decisions.md`, `docs/sprint-2.md`.

---

## 11. Limitaciones pendientes

- La validación está calibrada con trazos sintéticos; falta probarla con la niña y ajustar tolerancias por trazo si alguna letra resulta frustrante.
- La comprobación visual cubrió una selección, no las 64 fichas; conviene una revisión completa en un dispositivo real antes de cerrar el catálogo.
- En vertical, en pantallas de poca altura, el tablero puede requerir desplazamiento; no se modificó el layout del Sprint 1.5.
- No hay niveles progresivos, estrellas definitivas, sonidos ni panel parental: pertenecen a sprints posteriores.
- El APK debug debe regenerarse con `npm run android:sync` cuando se cierre la revisión; no se versiona el APK.

---

## 12. Estado de Git

- Sprint 1.5 guardado en `df02b8a` (`feat(sprint-1.5): adaptar interfaz a orientacion vertical y horizontal`), subido a `origin/main`.
- Los cambios del Sprint 2 están **sin commitear y sin push**, a la espera de revisión.
