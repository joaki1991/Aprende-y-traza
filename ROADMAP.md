# ROADMAP — Aprende y Traza

Plan de sprints secuenciales. Cada sprint termina con una demo verificable, pruebas y documentación actualizada. **No se empieza el siguiente si lint, typecheck, tests o build fallan, o si quedan errores críticos abiertos.**

Leyenda: ✅ completado · 🚧 en curso · ⏳ pendiente

## Resumen

| Sprint | Objetivo | Estado |
| --- | --- | --- |
| 0 | Arquitectura, base técnica, PWA y Android | ✅ |
| 1 | Motor de trazado educativo y ficha de la A | ✅ |
| 1.5 | Orientación vertical y horizontal en todas las pantallas | ✅ |
| 2 | Catálogo completo: 27 mayúsculas, 27 minúsculas y 10 números | ✅ |
| 3 | Flujo de lecciones y evaluación | ⏳ |
| 4 | Sistema visual definitivo y revisión pedagógica | ⏳ |
| 5 | Progreso detallado y persistencia avanzada | ⏳ |
| 6 | Recompensas y motivación | ⏳ |
| 7 | Sonido, accesibilidad y refuerzo educativo | ⏳ |
| 8 | PWA offline avanzada e instalación | ⏳ |
| 9 | Android, rendimiento y preparación de release | ⏳ |

---

## Sprint 0 — Arquitectura y preparación ✅

**Objetivo:** dejar una base sólida, offline-first, documentada y verificable, sin implementar todavía el motor educativo.

**Entregables:**

- Proyecto React + Vite + TypeScript estricto.
- Estructura modular por dominios.
- Dependencias fijadas y compatibles con Node 20.
- PWA configurada con manifest, iconos y service worker.
- Capacitor Android generado, en vertical, con iconos y splash propios.
- Interfaz provisional completa y navegable.
- Fuentes, mascota, iconos y pegatinas locales.
- IndexedDB con validación defensiva.
- README, AGENTS, ROADMAP, arquitectura, ADR y validación del sprint.
- Build y pruebas verdes.

**Criterio de aceptación:** `npm run lint`, `npm run typecheck`, `npm run test:run` y `npm run build` pasan; la PWA carga sin red después de la primera visita; el APK debug compila.

**Evidencia:** [`docs/sprint-0.md`](docs/sprint-0.md).

---

## Sprint 1 — Motor de trazado educativo y ficha de la A ✅

**Objetivo:** implementar el primer motor funcional de trazado con una ficha completa para la A mayúscula, evaluación geométrica y persistencia local.

**Entregables:**

- `CharacterTrace` y `TraceStroke` ampliados de forma compatible (`instruction`, `tolerance`).
- Tres trazos ordenados para la A mayúscula en `src/modules/lessons/traces/`.
- Muestreador SVG propio para `M/L/H/V/C/S/Q/T/Z`, en coordenadas del `viewBox`.
- Validación de inicio, cobertura, desviación, dirección, progreso, final, longitud y orden.
- Detección de trazo equivocado y rechazo de garabatos.
- Sesión pura que impone el orden y permite reintentar sin penalización.
- Pantalla de trazado con guía SVG, flecha, pasos, Mochi, celebración y botones grandes.
- Canvas transparente con Pointer Events, captura, DPR, `ResizeObserver` y limpieza.
- Persistencia de intentos, rondas completadas, precisión y fecha en IndexedDB.
- 39 pruebas nuevas (72 en total), incluida la integración del flujo completo.
- `docs/sprint-1.md`, ADR nuevos, arquitectura, README y roadmap actualizados.
- APK debug regenerado.

**Criterio de aceptación:** se completa la A con el dedo siguiendo el orden, el motor rechaza garabatos y trazos fuera de orden, el resultado se guarda en IndexedDB y lint, typecheck, pruebas y build pasan.

**Evidencia:** [`docs/sprint-1.md`](docs/sprint-1.md).

---

## Sprint 1.5 — Orientación vertical y horizontal ✅

**Objetivo:** permitir girar el dispositivo y adaptar toda la interfaz a ambas orientaciones sin tocar el motor de trazado ni el contenido educativo.

**Entregables:**

- Android sin `screenOrientation` bloqueada y conservando `configChanges` para no recrear la actividad al girar.
- Manifest PWA con `orientation: 'any'`; viewport con `viewport-fit=cover` y safe areas.
- `AppShell` con ancho de 1120–1200 px en horizontal y padding con safe areas.
- Portada, Aprender, vista previa de paquete, progreso y recompensas con distribución horizontal propia.
- Pantalla de trazado horizontal en dos zonas: tablero a la izquierda a todo el alto y Mochi, pasos, pista y controles a la derecha.
- Tablero con proporción 5:7 y anchura derivada del alto real del viewport, sin encogerse por el texto.
- Guía SVG y Canvas con la misma transformación (`preserveAspectRatio="none"`).
- Doble controlable de `ResizeObserver` y pruebas de giro a mitad de ronda.
- Guarda de regresión que lee la configuración de Android y PWA.
- 81 pruebas (12 archivos), build y APK debug.
- `docs/sprint-1.5.md`, ADR de orientación, arquitectura, README y AGENTS actualizados.

**Criterio de aceptación:** la app se usa en vertical y horizontal sin desbordamientos, la A se completa en ambas y al girar no se pierde la ronda; lint, typecheck, pruebas y build pasan.

**Evidencia:** [`docs/sprint-1.5.md`](docs/sprint-1.5.md).

---

## Sprint 2 — Catálogo completo de fichas ✅

**Objetivo:** implementar las 64 fichas educativas reutilizando el mismo motor de trazado, sin duplicar pantallas ni lógica.

**Entregables:**

- 27 mayúsculas en `traces/uppercase.ts`, conservando intacta la geometría de la A del Sprint 1.
- 27 minúsculas en `traces/lowercase.ts`, con altura de x en `y=62`, ascendentes hasta `y=16` y descendentes hasta `y=136`.
- 10 números en `traces/digits.ts`, cada uno con su orden de escritura propio.
- Ñ mayúscula = cuerpo de N + virgulilla; ñ minúscula con virgulilla sobre la altura de x.
- Soporte nativo de arcos `A` en el muestreador SVG, con conversión endpoint → centro de la especificación.
- Tipo de trazo `dot` para los puntos de i y j, validados como toque puntual.
- Métrica de dirección por avance neto, estable con trazos densos y bucles cerrados (O, 0, 8, bolas de a/b/d/g/p/q).
- Catálogo completo registrado y visible en Aprender; ya no hay «¡Muy pronto!» en fichas del catálogo.
- Pruebas de contenido, integridad de los 64 trazos, arcos, puntos, autotrazado, recorrido inverso, saltos de orden y garabatos.
- Integración de minúscula, número y punto de i con persistencia en IndexedDB.
- `docs/sprint-2.md`, ADR de arcos, puntos y dirección, arquitectura y README actualizados.
- 113 pruebas (14 archivos), lint, typecheck y build verdes.

**Criterio de aceptación:** cualquier letra mayúscula, minúscula o número se puede seleccionar y completar con el mismo motor; los trazos invertidos, incompletos y fuera de orden se rechazan; la A sigue funcionando; vertical y horizontal siguen operativos.

**Fuera de alcance (para los siguientes sprints):** niveles progresivos, estrellas definitivas, sonidos, panel parental, backend y publicación.

**Evidencia:** [`docs/sprint-2.md`](docs/sprint-2.md).

---

## Sprint 3 — Flujo de lecciones y evaluación ⏳

**Objetivo:** convertir el motor en un juego guiado por pasos.

**Alcance:**

- Selector de caracteres dentro de cada paquete, con estado practicado/pendiente.
- Flujo: elegir carácter → ver demostración → trazar → celebrar → siguiente.
- 3 intentos amables, sin cronómetros ni presión.
- Estrellas por logro (máximo 3) y registro de intentos en IndexedDB.
- Transiciones, progreso del paquete y pantalla de fin de ronda.
- Persistencia tras cerrar la app y recuperación de la última lección.
- Pruebas de flujo con Testing Library y de repositorio.

**Criterio de aceptación:** completar una ronda de 5 letras, cerrar la app, reabrirla y conservar estrellas e intentos; ningún estado roto si se interrumpe a mitad.

**Dependencias:** Sprint 2.

---

## Sprint 4 — Sistema visual definitivo y revisión pedagógica ⏳

**Objetivo:** pulir la experiencia infantil una vez que todo el catálogo ya es trazable y revisar la calidad pedagógica de las 64 fichas.

**Alcance:**

- Revisar jerarquía visual, tamaños táctiles y legibilidad en móviles de 360–430 px.
- Estados vacíos, de carga y de error amables en todas las pantallas.
- Navegación inferior o accesos rápidos adaptados a una niña que no lee.
- Ajustar animaciones y respetar `prefers-reduced-motion`.
- Revisar contraste, foco y etiquetas accesibles.
- Pantalla de ajustes para adultos (sin datos personales): reset de progreso, información de privacidad y versión.
- Revisión con la niña de una muestra de mayúsculas, minúsculas y números; ajustar geometrías o tolerancias por trazo si hace falta.
- Revisión pedagógica de las palabras de ejemplo y del orden de escritura.
- Posibilidad de añadir un alfabeto nuevo solo con datos (paquete + trazos).
- Pruebas de regresión de navegación y accesibilidad.

**Criterio de aceptación:** recorrido completo sin callejones sin salida; ningún target táctil principal por debajo de 56 px; sin desbordamientos a 360 px; revisión con la niña documentada.

**Riesgos:** tolerancias demasiado estrictas en letras con curvas; sobrecargar la interfaz con texto.

**Dependencias:** Sprints 2 y 3.

---

## Sprint 5 — Progreso detallado y persistencia avanzada ⏳

**Objetivo:** dar información útil a la niña y a un adulto, sin convertir la app en un panel complicado.

**Alcance:**

- Vista de progreso por carácter y por paquete, con estrellas y mejor precisión.
- Historial local agregado por día (sin datos personales).
- Migraciones de esquema IndexedDB y pruebas desde versiones anteriores.
- Reset de progreso protegido para adultos.
- Exportación/importación local opcional si se decide, sin nube.
- Panel adulto con información de uso y privacidad.

**Criterio de aceptación:** migración probada; ningún dato personal; reset claro y reversible solo con confirmación adulta.

**Dependencias:** Sprint 3.

---

## Sprint 6 — Recompensas y motivación ⏳

**Objetivo:** mantener la motivación con recompensas simbólicas, sin azar ni presión.

**Alcance:**

- Catálogo de pegatinas ampliado y desbloqueo por hitos.
- Álbum de pegatinas con animación de desbloqueo.
- Recompensas por constancia, no por velocidad.
- Mascota Mochi con reacciones y frases cortas.
- Sin monedas, loot boxes, compras ni mecánicas adictivas.
- Pruebas de hitos y de estados bloqueado/desbloqueado.

**Criterio de aceptación:** todas las recompensas se obtienen jugando; no hay forma de comprar ni de perderlas; el álbum funciona offline.

**Dependencias:** Sprint 5.

---

## Sprint 7 — Sonido, accesibilidad y refuerzo educativo ⏳

**Objetivo:** añadir apoyo auditivo y reforzar el aprendizaje sin depender de la lectura.

**Alcance:**

- Efectos y voces locales (archivos propios o TTS del dispositivo como mejora opcional, nunca servicio obligatorio).
- Instrucciones habladas por carácter y por acción.
- Control de volumen y silencio persistido en ajustes.
- Modo alto contraste y texto grande.
- Compatibilidad con lectores de pantalla en la web.
- Actividades de refuerzo: asociar sonido, imagen y carácter.

**Criterio de aceptación:** la app se puede usar con sonido y sin él; todos los audios están empaquetados; no se descargan voces en tiempo de ejecución.

**Dependencias:** Sprints 3 y 4.

---

## Sprint 8 — PWA offline avanzada e instalación ⏳

**Objetivo:** que la instalación y el uso sin conexión sean fiables en cualquier condición.

**Alcance:**

- Estrategia de caché revisada para todos los assets (incluidos sonidos).
- Pantalla “lista para offline” y actualización controlada.
- Pruebas de instalación en Android/Chrome, iOS/Safari y escritorio.
- Manejo de cuota de almacenamiento y datos corruptos.
- Revisión de manifest, iconos maskable, splash y accesibilidad.
- Documentación de despliegue estático.

**Criterio de aceptación:** instalación limpia, recarga offline, actualización sin pantalla en blanco y sin recursos externos en la red.

**Dependencias:** Sprints 0 y 7.

---

## Sprint 9 — Android, rendimiento y preparación de release ⏳

**Objetivo:** entregar un APK/AAB estable y preparado para uso real.

**Alcance:**

- Firma release y configuración de versión.
- Pruebas en al menos dos dispositivos Android (gama baja y media).
- Perfilado de Canvas y memoria; límites de DPR y partículas.
- Revisión de permisos, privacidad y política para tiendas.
- Iconos adaptativos, splash y orientación verificados.
- Build reproducible y checklist de release.
- Documentación de instalación para familias.

**Criterio de aceptación:** APK release firmado, instalado y probado sin conexión; sin permisos innecesarios; rendimiento estable durante 15 minutos de uso.

**Dependencias:** todos los anteriores.

---

## Puertas de calidad transversales

En cada sprint:

1. `npm run lint` sin errores.
2. `npm run typecheck` sin errores.
3. `npm run test:run` verde y con pruebas nuevas para la lógica añadida.
4. `npm run build` correcto y PWA generada.
5. Revisión en viewport móvil real o emulado (360×640 como mínimo).
6. Sin recursos remotos, datos personales, anuncios ni analítica.
7. Documentación y ADR actualizados.
8. Si aplica: `npm run android:sync` y APK debug compilado.

## Fuera de alcance (por ahora)

- Backend, cuentas, sincronización en nube o multijugador.
- Compras, suscripciones, anuncios o analítica.
- Contenido generado por IA en tiempo de ejecución.
- Idiomas distintos del español (la arquitectura debe permitirlo, pero no es prioridad).
- Publicación en Google Play antes del Sprint 9.
