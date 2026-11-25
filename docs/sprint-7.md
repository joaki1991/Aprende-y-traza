# Sprint 7 — Efectos de sonido y acompañamiento por voz

**Estado:** implementado, verificado y revisado; comprometido localmente, **pendiente de push/publicación**.
**Base publicada:** `7336301` — `feat(sprint-6): anadir musica ambiental y PWA inmersiva` (`HEAD == origin/main` al empezar el Sprint 7).

## 1. Resumen

El Sprint 7 añade tres capacidades independientes sobre la base del Sprint 6:

1. Efectos de sonido breves para la finalización correcta, la estrella, el desbloqueo y el avance de trazo.
2. Instrucciones habladas con `SpeechSynthesis`, usando exactamente los textos del motor de trazado.
3. Preferencias separadas de música, efectos y voz, con un panel de sonido accesible desde cualquier pantalla.

No se añadieron dependencias, archivos de efectos, servicios externos ni API keys. La música del Sprint 6 y el botón global de silencio se mantienen sin cambios.

## 2. Efectos de sonido

### Arquitectura

```text
App
└── AmbientMusicProvider
    └── AudioProvider              ← un reproductor de efectos y uno de voz
        └── AppShell
            ├── MusicToggle        ← botón global del Sprint 6
            ├── AudioSettings      ← panel de Música / Efectos / Voz
            └── pantalla de la ruta
```

| Archivo | Responsabilidad |
| --- | --- |
| `src/modules/audio/soundEffects.ts` | Patrones, síntesis Web Audio, cola, prioridades, duplicados y ciclo de vida. |
| `src/modules/audio/soundPreferences.ts` | Preferencia `aprende-y-traza.effects.enabled` en `localStorage`. |
| `src/modules/audio/AudioProvider.tsx` | Crea una sola vez los reproductores de efectos y voz. |
| `src/modules/audio/audioContext.ts` | Contextos y hooks `useSoundEffects` / `useSpeech` con `useSyncExternalStore`. |

### Patrones

| Efecto | Duración | Prioridad | Uso |
| --- | --- | --- | --- |
| `victory` | 0,86 s | 3 | Trazado completado correctamente. Cuatro campanitas ascendentes en Do mayor. |
| `star` | 0,46 s | 2 | Estrella nueva confirmada por `recordPractice`. |
| `unlock` | 0,72 s | 2 | Lámina desbloqueada confirmada por `recordPractice`. |
| `step` | 0,14 s | 1 | Trazo intermedio aceptado. Se descarta durante una celebración. |

Todos los sonidos son senos con armónicos suaves, ganancia maestra `0.42` y envolventes cortas para que no resulten estridentes. No hay muestras ni archivos: cada nota se genera en el dispositivo.

### Reglas de reproducción

- Un solo reproductor para toda la app. Los efectos se encolan con `busyUntil`, así que la victoria no se solapa con la estrella ni con el desbloqueo.
- La cola máxima es de 4 s. Una repetición del mismo efecto en 0,35 s se ignora.
- La victoria se reproduce al aceptar el último trazo, una sola vez por finalización (`completionRecordedRef`).
- Estrella y desbloqueo solo suenan si el resumen de `recordPractice` los confirma. Repetir una ficha correctamente vuelve a celebrar, pero no concede otra estrella.
- No hay efectos en trazos rechazados, incompletos o fuera de orden, ni en botones genéricos.
- Si no existe `AudioContext`, el reproductor queda como no disponible y el interruptor se desactiva; la app sigue funcionando.

## 3. Voz

### Arquitectura

| Archivo | Responsabilidad |
| --- | --- |
| `src/modules/audio/speech.ts` | Envoltura de `SpeechSynthesis`, elección de voz, cancelación, deduplicación y errores. |
| `src/modules/audio/speechPreferences.ts` | Preferencia `aprende-y-traza.speech.enabled` en `localStorage`. |
| `src/modules/tracing/traceNarration.ts` | Fuente única de las frases escritas y habladas del ejercicio. |

### Elección de voz

1. Una voz cuyo idioma sea `es-ES`.
2. Cualquier voz española (`es-*`).
3. La voz predeterminada del sistema.
4. La primera voz disponible o ninguna.

La locución usa `lang = 'es-ES'`, velocidad `0.94`, tono `1.05` y volumen `1`. Si el dispositivo no tiene voces instaladas, la app sigue adelante sin voz y sin errores visibles.

### Ciclo de vida

- Cada nueva locución llama antes a `cancel()`: nunca se solapan dos mensajes.
- La misma frase no se repite en 3,5 s, salvo que se pida con `force`.
- Al completar el trazado se cancela la voz antes de la victoria.
- Al desmontar `TraceScreen` o `TraceCompleteScreen` se limpia el temporizador y se cancela la locución.
- Al repetir el ejercicio se cancela y se vuelve a anunciar el inicio.
- Al desactivar la voz se corta inmediatamente la locución en curso.
- Los errores `canceled` e `interrupted` se ignoran; el resto se registra con `console.info` y se detiene la locución.

## 4. Conexión con las instrucciones existentes

No se creó un segundo sistema de instrucciones. `traceNarration.ts` construye los textos a partir de los datos reales del motor:

- `traceIntroInstruction()`: «Vamos a trazar la A. + instrucción del primer trazo».
- `traceNextInstruction()`: instrucción del trazo actual del `CharacterTrace`.
- `traceSuccessMessage()`: «¡Muy bien!» + instrucción del siguiente trazo.
- `traceRetryMessage()`: pista concreta según `TraceIssue` (`wrong-order`, `start-too-far`, `finish-too-far`, `backwards`, `off-path`, `scribble`, `incomplete`, `too-short`).
- `traceCompletionMessage()` y `traceCongratulation()`: cierre y felicitación con el artículo correcto (`el` para números, `la` para letras).

`TraceScreen` muestra esos textos en la burbuja de Mochi y llama a `speak()` con el mismo string. El motor de trazado (`traceValidation`, `traceSession`) no conoce React, la voz ni el audio.

## 5. Preferencias y panel de sonido

| Sistema | Clave | Por defecto |
| --- | --- | --- |
| Música | `aprende-y-traza.music.muted` | Activada |
| Efectos | `aprende-y-traza.effects.enabled` | Activados |
| Voz | `aprende-y-traza.speech.enabled` | Activada |

Las tres claves son independientes, viven en `localStorage` y se leen de forma defensiva. Si el almacenamiento está bloqueado, el ajuste dura lo que dure la sesión.

`AudioSettings` añade un botón fijo con icono de ajustes junto a `MusicToggle`, a su izquierda. Abre un diálogo con tres interruptores grandes (`role="switch"`, `aria-checked`) y el estado de cada sistema. Se cierra con **Listo**, Escape o un toque fuera. Si el dispositivo no ofrece Web Audio o voz, el interruptor aparece desactivado con un texto amable. No se rediseñó la portada ni la distribución principal.

## 6. Recursos de audio y licencias

```text
public/audio/
├── music/
│   └── background-music.mp3   (música del Sprint 6, 1 978 618 bytes)
└── effects/
    └── README.md              (reservado; los efectos se sintetizan)
```

- La música se empaqueta con la app y Workbox la precarga; funciona sin conexión.
- Los efectos son patrones originales generados con Web Audio: no hay muestras de terceros, archivos que descargar ni licencias de audio que revisar.
- La voz la sintetiza el sistema operativo con las voces instaladas; no se descarga ninguna voz en tiempo de ejecución.
- La licencia de la melodía aportada debe confirmarse antes de distribuir la app (ver `public/audio/README.md`).
- No se añadieron recursos remotos, CDNs, cuentas ni servicios de pago.

## 7. Pruebas

Se añadieron pruebas unitarias y de integración:

- `src/modules/audio/soundEffects.test.ts`: duración de la victoria, cola sin solapamientos, pasos descartados durante la celebración, preferencia independiente y ausencia de Web Audio.
- `src/modules/audio/speech.test.ts`: elección de `es-ES` y alternativas, cancelación de la locución anterior, ventana anti-repetición, preferencia, ausencia de `SpeechSynthesis` y recuperación tras un error.
- `src/modules/audio/AudioSettings.test.tsx`: tres interruptores independientes, persistencia separada, controles desactivados si faltan APIs y cierre con Listo, Escape o toque fuera.
- `src/modules/tracing/traceNarration.test.ts`: frases construidas desde las instrucciones reales y pistas según cada `TraceIssue`.
- `src/modules/tracing/TraceAudio.test.tsx`: integración del ejercicio real con dobles observables; anuncia la letra, lee la siguiente instrucción solo al acertar, no habla en trazos incorrectos y encadena victoria, estrella y desbloqueo.
- `src/test/audioPlayers.ts`: dobles observables de música, efectos y voz para las pruebas de integración.

Resultado: **23 archivos, 199 pruebas, todas en verde**. Las 173 pruebas anteriores siguen pasando.

### Pruebas manuales en Chromium sobre la build de producción

- Portada y panel de sonido: los tres interruptores reflejan su estado, escriben claves separadas y conservan la selección tras recargar. Los botones de música y ajustes comparten fila en la esquina superior derecha, con 8 px de separación y sin solaparse.
- Letra A: se completaron los tres trazos con Pointer Events reales; la guía avanzó, apareció la celebración, se concedió una estrella y se desbloqueó `letter-a`.
- Número 1: se completó el trazo, se concedió otra estrella y se desbloqueó `number-1`.
- Repetición: al repetir el número 1, la celebración mostró «¡Qué bien lo haces!», `completions` subió a 2 y `starsEarned` siguió en 1; el total de estrellas no cambió.
- Error: un trazo invertido en la A mostró «¡Casi! Empieza en el punto verde.», no reprodujo ningún efecto y mantuvo el trazo actual sin avanzar.
- Voz: con `speechSynthesis.speak` instrumentado, se registraron el anuncio inicial, la pista de error, el mensaje de éxito y la felicitación final.
- Efectos: con `AudioContext` instrumentado, la victoria generó exactamente las cuatro notas 523.25, 659.25, 783.99 y 1046.5 Hz; un acierto intermedio generó solo la nota de paso de 880 Hz.
- Consola: sin errores durante todos los flujos.
- Offline: tras visitar la build de producción y activar el service worker, se detuvo el servidor y se recargó la pestaña; la app siguió cargando desde el precache, incluida la ruta de trazado y el MP3 (`ignoreSearch`).

## 8. Comandos y APK

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run android:apk
```

- `lint`: OK.
- `typecheck`: OK.
- `test:run`: 23 archivos, 199 pruebas.
- `build`: OK, PWA generada con el audio precargado.
- `android:apk`: BUILD SUCCESSFUL.

APK debug:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## 9. Limitaciones conocidas

- La voz depende de las voces instaladas en el dispositivo. Puede no existir, sonar robótica o cambiar entre Android, Windows y otros navegadores.
- `SpeechSynthesis` no garantiza una voz española: si no hay ninguna, se usa la predeterminada del sistema.
- En algunos navegadores la lista de voces se carga de forma asíncrona; la app elige la mejor disponible en el momento de hablar.
- Los efectos Web Audio requieren un contexto de audio; si el dispositivo lo bloquea o no lo ofrece, se desactivan sin romper la app.
- No hay control de volumen: el nivel está calibrado en código para evitar cambios accidentales.
- El APK se ha compilado, pero la validación final con voz y sonido en un dispositivo Android real queda pendiente de la revisión del sprint.
- La licencia del MP3 de música debe confirmarse antes de distribuir la app.

## 10. Archivos del Sprint 7

**Nuevos:**

- `src/modules/audio/AudioProvider.tsx`
- `src/modules/audio/AudioSettings.tsx`
- `src/modules/audio/AudioSettings.module.css`
- `src/modules/audio/audioContext.ts`
- `src/modules/audio/soundEffects.ts`
- `src/modules/audio/soundPreferences.ts`
- `src/modules/audio/speech.ts`
- `src/modules/audio/speechPreferences.ts`
- `src/modules/audio/soundEffects.test.ts`
- `src/modules/audio/speech.test.ts`
- `src/modules/audio/AudioSettings.test.tsx`
- `src/modules/tracing/traceNarration.ts`
- `src/modules/tracing/traceNarration.test.ts`
- `src/modules/tracing/TraceAudio.test.tsx`
- `src/test/audioPlayers.ts`
- `public/audio/music/background-music.mp3` (movido desde `public/audio/`)
- `public/audio/effects/README.md`
- `docs/sprint-7.md`

**Modificados:**

- `src/app/App.tsx`
- `src/components/icons/Icons.tsx`
- `src/modules/audio/musicPlayer.ts`
- `src/modules/audio/musicPlayer.test.ts`
- `src/modules/tracing/TraceScreen.tsx`
- `src/modules/tracing/TraceCompleteScreen.tsx`
- `public/audio/README.md`
- `docs/architecture.md`
- `docs/technical-decisions.md` (ADR-036, ADR-037 y ADR-038)
- `README.md`
- `AGENTS.md`
- `ROADMAP.md`
- `docs/sprint-6.md`

## 11. Estado de Git

- El Sprint 6 está publicado en `origin/main` (`7336301`).
- El Sprint 7 está comprometido en `main` localmente, **sin push**.
- No se ha descartado ningún archivo ni cambio.
- `origin/main` conserva `7336301` hasta que se publique el nuevo commit local.
