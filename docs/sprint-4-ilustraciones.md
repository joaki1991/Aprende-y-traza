# Sprint 4 — Mejora de las ilustraciones SVG

**Estado:** revisión visual completada. Los cambios están en el árbol de trabajo,
pendientes de aprobación. No se ha hecho commit ni push de este sprint.

## 1. Publicación del Sprint 3

Antes de tocar las ilustraciones se publicó el trabajo pendiente:

- Commit: `f756a1a feat(sprint-3): completar recompensas, laminas y coloreado`.
- `HEAD` local y `origin/main`: `f756a1abdecd4e561ff435270c7a81a19eb6f31c`.
- Árbol de trabajo limpio tras la publicación.
- `npm run lint`, `npm run typecheck`, `npm run test:run` y `npm run build`
  pasaban antes de publicar.

## 2. Repositorios investigados

### `joshnishikawa/savage`

Se inspeccionaron sus SVG además del README. El repositorio no declara licencia
(`license: null`) y no incluye archivo `LICENSE`; el README solo dice «Free and
Open-sourced». Al no existir una cesión de derechos clara, **no se reutilizó
ningún dibujo**.

### Openclipart

Se revisaron más de veinte ilustraciones del autor **lemmling**. Los SVG
incluyen metadatos RDF con autor, origen y licencia
`http://creativecommons.org/licenses/publicdomain/` (dominio público / CC0), por
lo que se pueden reutilizar, modificar y redistribuir.

### Fluent UI Emoji

Se revisaron las variantes Flat, Color y 3D de **Fluent UI Emoji**
(<https://github.com/microsoft/fluentui-emoji>), con licencia **MIT** de
Microsoft. Se eligió Flat por sus contornos planos y sus regiones amplias. El
aviso de copyright y permiso se conserva en
[`licenses/MIT-Fluent-Emoji.txt`](../licenses/MIT-Fluent-Emoji.txt).

También se probaron Twemoji (CC-BY 4.0) y varios candidatos de
Publicdomainvectors. Se descartaron porque eran más difíciles de separar en
regiones limpias o no mejoraban claramente la lámina existente.

La ficha completa de cada recurso, con URL, archivo, autor, licencia y
modificaciones, está en [`docs/svg-sources.md`](svg-sources.md).

## 3. Dibujos sustituidos

| Letra | Lámina | Origen | Regiones | Detalles |
| --- | --- | --- | --- | --- |
| B | Ballena | Fluent UI Emoji (MIT) | 3 | 2 |
| E | Elefante | Fluent UI Emoji (MIT) | 5 | 1 |
| G | Gato | Openclipart 17683, lemmling (CC0) | 9 | 17 |
| J | Jirafa | Openclipart 17628, lemmling (CC0) | 21 | 4 |
| P | Pingüino | Openclipart 27563, lemmling (CC0) | 10 | 4 |
| T | Tortuga | Fluent UI Emoji (MIT) | 4 | 1 |
| U | Unicornio | Fluent UI Emoji (MIT) | 13 | 3 |
| V | Vaca | Openclipart 17676, lemmling (CC0) | 9 | 6 |
| W | Waffle | Redibujo propio | 10 | 2 |
| Y | Yoyó | Fluent UI Emoji (MIT) | 5 | 0 |
| Ñ | Ñandú | Redibujo propio | 10 | 7 |

Las once conservan el `id` de lámina (`letter-b`, `letter-e`, `letter-g`,
`letter-j`, `letter-p`, `letter-t`, `letter-u`, `letter-v`, `letter-w`,
`letter-y` y `letter-enye`), el nombre de la lámina y la relación con la ficha y
la recompensa. Se descartaron otros candidatos (mariposa, ratón con queso, oso,
etc.) porque eran más simples que la lámina actual, tenían muy pocas regiones
coloreables o no coincidían con la palabra de la ficha. El detalle está en
`docs/svg-sources.md`.

La ballena, el elefante, la tortuga, el unicornio y el yoyó usan la variante
Flat de Fluent UI Emoji (MIT, Microsoft). El waffle se redibujó a mano con una
cuadrícula de 3 × 3 porque la versión de Fluent resultaba demasiado recargada de
líneas al tamaño real de la pizarra. El ñandú también se redibujó a mano para
conservar el pico, el cuello largo y las plumas de la cola. Las láminas de
Fluent tienen menos regiones que las dibujadas a mano, pero son formas amplias,
cerradas y mucho más legibles; el número de regiones se documenta en la tabla.

## 4. Adaptación al motor de coloreado

- Conversión local con un script fuera del repositorio, sin dependencias nuevas.
- Transformaciones aplanadas; arcos rotados convertidos a cúbicas.
- Sombritas y degradados descartados (`fill-opacity < 0.85`, `url(...)`).
- Rellenos opacos grandes convertidos en regiones cerradas; trazos y rellenos
  oscuros pequeños convertidos en detalles no coloreables.
- Normalización a `viewBox` `0 0 400 400`, margen de 24 y coordenadas con dos
  decimales.
- Contorno unificado `#4a3a48`; la app aplica 9 px a las regiones y 3–9 px a los
  detalles.
- Ids de región posicionales y estables (`part-01`, `part-02`…).
- En Fluent, las regiones que el autor diseñó como anillos o patrones agrupan
  varios subcaminos; se conservan como una sola región para que el relleno sea
  coherente. El orden de capas del SVG original se mantiene.
- Sin imágenes remotas, fuentes externas ni bitmaps: todo sigue siendo datos
  TypeScript dentro del paquete.

## 5. Compatibilidad

- Los 37 `artworkId` y el mapeo letra → lámina no cambian.
- Estrellas, desbloqueo, galería y pegatinas no cambian.
- Los trazos libres, pegatinas y fechas de desbloqueo se conservan.
- Los rellenos antiguos de las once láminas sustituidas no se borran: quedan
  almacenados con sus ids originales y dejan de mostrarse mientras esos ids no
  existan en la nueva plantilla. No se remapean a ciegas porque las formas no se
  corresponden.
- Hay una prueba nueva que verifica que un relleno con un id desaparecido
  sobrevive al ciclo de guardado y lectura.

## 6. Revisión visual y funcional

Revisadas las once láminas en el navegador real:

- Se reconocen y están centradas, sin elementos cortados.
- Los contornos se mantienen por encima del color.
- Las regiones se rellenan de forma independiente (probado tocando varias zonas
  del gato, la ballena, el waffle y el yoyó con colores distintos).
- El autoguardado persiste los rellenos: tras recargar la página se recuperan los
  mismos colores en las mismas regiones.
- La galería de Recompensas muestra la miniatura coloreada y el nombre correcto.
- Sin errores de consola.

Vistas previas:

- [Catálogo completo a color](sprint-4-contact.png)
- [Catálogo completo en blanco, como lámina para colorear](sprint-4-lineart.png)

## 7. Pruebas

```text
npm run lint        ✅
npm run typecheck   ✅
npm run test:run    ✅ 15 archivos, 146 pruebas
npm run build       ✅ PWA, 21 entradas precacheadas
```

APK de depuración:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Generado con `npm run android:apk` (`build` + `cap sync android` +
`assembleDebug`).

## 8. Pendiente

- Revisión visual y aprobación.
- Si se aprueba: commit del Sprint 4 y push a `main`.
- Decidir si se alinean las palabras de ejemplo de E (`Estrella`), U (`Uva`),
  W (`Wombat`) e Y (`Yate`) con los nombres de las láminas (`Elefante`,
  `Unicornio`, `Waffle`, `Yoyó`). Es una discrepancia preexistente y no se ha
  tocado el contenido educativo en este sprint.
