# Procedencia de las ilustraciones SVG

Este documento registra el origen, la licencia y las modificaciones de las
ilustraciones externas que forman parte del catálogo de láminas para colorear.
Su objetivo es poder auditar la procedencia de cada dibujo y acreditar que se
puede reutilizar, modificar y distribuir con la app.

## Criterio de licencia

Antes de reutilizar una ilustración se comprueba que su licencia permita, sin
ambigüedad:

- usarla en una aplicación distribuida;
- modificarla (normalizar geometría, quitar color y separar regiones);
- redistribuirla dentro del paquete de la app.

Solo se aceptan obras de **dominio público / CC0** o licencias permisivas con
atribución compatible, como **MIT**. En ese caso se conserva el aviso de
copyright y permiso en `licenses/`. No se reutiliza ningún repositorio sin
archivo de licencia, aunque su README diga que es «free» o «open source».

### Descartado: `joshnishikawa/savage`

Se revisó el repositorio <https://github.com/joshnishikawa/savage> como posible
fuente. El repositorio no declara licencia (`license: null`) y no incluye
archivo `LICENSE`; su README solo indica «Free and Open-sourced». Al no existir
una cesión de derechos clara, **no se ha reutilizado ninguno de sus dibujos**.

## Fuente elegida: Openclipart

- Sitio: <https://openclipart.org/>
- Autor de las cuatro láminas: **lemmling**
- Licencia declarada en los metadatos RDF de cada SVG:
  `http://creativecommons.org/licenses/publicdomain/` (dominio público / CC0).
- Los archivos originales incluyen `<dc:creator>`, `<dc:source>` y
  `<cc:license>`, de modo que la autoría y la licencia se pueden verificar en el
  propio archivo, no solo en la ficha web.

CC0 no exige atribución, pero se documenta igualmente por transparencia y para
poder volver a la fuente si hay que regenerar una lámina.

## Fuente elegida: Fluent UI Emoji

- Repositorio: <https://github.com/microsoft/fluentui-emoji>
- Autor: **Microsoft Corporation**
- Licencia: **MIT**. El texto completo del aviso se conserva en
  [`licenses/MIT-Fluent-Emoji.txt`](../licenses/MIT-Fluent-Emoji.txt).
- Archivos originales: SVG planos de `assets/<Nombre>/Flat/<nombre>_flat.svg`.
- Láminas usadas: `Whale`, `Elephant`, `Turtle`, `Unicorn` y `Yo-yo`.

Se eligió la variante **Flat** porque sus contornos y rellenos planos encajan
mejor con el estilo de la app que las variantes 3D o Color. Los SVG se
descargaron del repositorio, se aplanaron y se normalizaron con el mismo
conversor local que las láminas de Openclipart; no se añadió ninguna dependencia
al proyecto.

## Láminas propias: Waffle y Ñandú

La lámina `letter-w` se redibujó a mano con una cuadrícula de 3 × 3 y una
porción de mantequilla, porque la versión de Fluent resultaba demasiado
recargada de líneas al tamaño real de la pizarra.

La lámina `letter-enye` tampoco se sustituyó por una ilustración externa: se
redibujó a mano en el estilo de la app para conservar el pico, el cuello largo,
las patas y las plumas de la cola, y para que el resultado fuera coherente con
el resto de animales. Ambas viven directamente en `letterDrawings.ts` y no
tienen requisitos de atribución externa.

## Láminas integradas

| Letra | Lámina en la app | Título original | Repositorio | Archivo SVG | Autor | Licencia | URL | Modificaciones |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B | Ballena | Whale | Fluent UI Emoji | `whale_flat.svg` | Microsoft | MIT | <https://github.com/microsoft/fluentui-emoji/blob/main/assets/Whale/Flat/whale_flat.svg> | Transformaciones aplanadas, geometría normalizada a 400 × 400, color sustituido por regiones y detalles, contorno unificado. |
| E | Elefante | Elephant | Fluent UI Emoji | `elephant_flat.svg` | Microsoft | MIT | <https://github.com/microsoft/fluentui-emoji/blob/main/assets/Elephant/Flat/elephant_flat.svg> | Transformaciones aplanadas, geometría normalizada a 400 × 400, color sustituido por regiones y detalles, contorno unificado. |
| G | Gato | Cartoon cat | Openclipart | `17683.svg` | lemmling | Dominio público / CC0 | <https://openclipart.org/detail/17683/cartoon-cat-by-lemmling> | Transformaciones aplanadas, geometría normalizada a 400 × 400, color sustituido por regiones y detalles, contorno unificado. |
| J | Jirafa | Cartoon giraffe | Openclipart | `17628.svg` | lemmling | Dominio público / CC0 | <https://openclipart.org/detail/17628/cartoon-giraffe-by-lemmling> | Transformaciones aplanadas, arcos rotados convertidos a cúbicas, geometría normalizada, color sustituido por regiones y detalles, contorno unificado. |
| P | Pingüino | Little penguin | Openclipart | `27563.svg` | lemmling | Dominio público / CC0 | <https://openclipart.org/detail/27563/little-penguin-by-lemmling> | Transformaciones aplanadas, geometría normalizada a 400 × 400, color sustituido por regiones y detalles, contorno unificado. |
| T | Tortuga | Turtle | Fluent UI Emoji | `turtle_flat.svg` | Microsoft | MIT | <https://github.com/microsoft/fluentui-emoji/blob/main/assets/Turtle/Flat/turtle_flat.svg> | Transformaciones aplanadas, geometría normalizada a 400 × 400, color sustituido por regiones y detalles, contorno unificado. |
| U | Unicornio | Unicorn | Fluent UI Emoji | `unicorn_flat.svg` | Microsoft | MIT | <https://github.com/microsoft/fluentui-emoji/blob/main/assets/Unicorn/Flat/unicorn_flat.svg> | Transformaciones aplanadas, geometría normalizada a 400 × 400, color sustituido por regiones y detalles, contorno unificado. |
| V | Vaca | Cartoon cow | Openclipart | `17676.svg` | lemmling | Dominio público / CC0 | <https://openclipart.org/detail/17676/cartoon-cow-by-lemmling> | Transformaciones aplanadas, geometría normalizada, color sustituido por regiones y detalles, contorno unificado. |
| W | Waffle | Dibujo propio | — | — | — | — | — | Redibujado a mano en `letterDrawings.ts` con cuadrícula de 3 × 3 y mantequilla; sin licencia externa. |
| Y | Yoyó | Yo-yo | Fluent UI Emoji | `yo-yo_flat.svg` | Microsoft | MIT | <https://github.com/microsoft/fluentui-emoji/blob/main/assets/Yo-yo/Flat/yo-yo_flat.svg> | Transformaciones aplanadas, geometría normalizada a 400 × 400, color sustituido por regiones y detalles, contorno unificado. |
| Ñ | Ñandú | Dibujo propio | — | — | — | — | — | Redibujado a mano en `letterDrawings.ts`; sin licencia externa. |

Los archivos originales **no se guardan en el repositorio**: solo se conserva la
geometría derivada en `src/modules/artworks/drawings/importedDrawings.ts` y, en
el caso del waffle y el ñandú, en `letterDrawings.ts`. Las URL de la tabla
permiten descargar de nuevo el original si hiciera falta.

## Proceso de conversión

La conversión se hizo con un script local, fuera del repositorio y sin añadir
dependencias al proyecto:

1. **Aplanar transformaciones** (`translate`, `scale`, `matrix`, `rotate`) para
   que cada path quede en coordenadas absolutas.
2. **Conservar arcos** cuando solo hay escala o traslación; convertirlos a
   cúbicas cuando hay rotación o reflexión.
3. **Descartar sombras y degradados**: se eliminan rellenos con
   `fill-opacity < 0.85` y referencias `url(...)`.
4. **Clasificar figuras**:
   - relleno opaco y grande → **región** coloreable;
   - trazo suelto, relleno oscuro pequeño o figura minúscula → **detalle** no
     coloreable.
5. **Normalizar** todo el dibujo a un `viewBox` de `0 0 400 400`, con un margen
   de 24 unidades y coordenadas redondeadas a dos decimales.
6. **Unificar el estilo**: el color original se descarta; la app pinta los
   contornos con `#4a3a48` y 9 px, y los detalles con el grosor derivado del
   original (entre 3 y 9 px).
7. **Asignar ids estables** por posición (`part-01`, `part-02`…) dentro de cada
   lámina. Al no existir ids semánticos en los SVG de origen, se optó por ids
   posicionales reproducibles.

Cada región es un path cerrado (`M…Z`). La mayoría son un único subcamino; en
las láminas de Fluent algunas regiones agrupan varios subcaminos (anillos,
patrones del caparazón o de la melena) para que el relleno sea coherente con la
forma original. Los detalles pueden ser trazos abiertos (ojos, bocas, líneas de
pelo) o rellenos oscuros pequeños.

## Candidatos evaluados y descartados

Se revisaron más de cien SVG de Openclipart/Publicdomainvectors, Fluent UI Emoji
y Twemoji. La mayoría de los candidatos externos eran siluetas, tenían una sola
región coloreable o no mejoraban la lámina existente. Además de las integradas,
se valoraron estas:

| Candidato | Letra posible | Motivo del descarte |
| --- | --- | --- |
| Beluga (`357703`) | B | La forma se lee como un pez con labios, no como una ballena. |
| Ballena (`18925`) | B | Demasiado simple: una sola región grande y un ojo; peor para colorear que la lámina actual. |
| Mariposa (`17643`) | M | Casi toda el ala es un detalle oscuro; quedan muy pocas regiones coloreables. |
| Ratón con queso (`17633`) | Q | El ratón domina la composición y el queso se lee como un triángulo. |
| Tortuga (`17592`) | T | El caparazón es un círculo y las patas son bucles; menos legible que la lámina actual. |
| Elefante (`17482`) | E | El cuerpo es una única región grande; poca interacción al colorear. |
| Oso (`17702`) | O | Lleva un pez en la boca, poco adecuado para la ficha del oso. |
| Cabra, foca, perro, oveja, ardilla, búho, canguro | C, F, P, O, A, B, C | La ilustración no coincide con la palabra de ejemplo de la ficha; se conserva la lámina actual para no mezclar conceptos. |

En Fluent UI Emoji se compararon las variantes **Flat**, **Color** y **3D**. Se
eligió Flat porque sus contornos planos y sus regiones amplias encajan mejor con
el contorno unificado de la app. También se probaron las versiones de Twemoji
(CC-BY 4.0) de los mismos términos; se descartaron porque el resultado era más
difícil de separar en regiones limpias y no superaba a Fluent.

Se hicieron además bocetos propios de ballena, elefante, tortuga, unicornio,
waffle y yoyó. Se conservó el waffle porque la versión de Fluent quedaba
demasiado recargada de líneas al tamaño real de la pizarra; el resto se descartó
porque Fluent era más legible. El ñandú, que no tenía una versión externa clara,
también se redibujó a mano.

La regla aplicada fue sustituir una lámina solo cuando la ilustración externa
coincide con el nombre actual de la lámina y mejora claramente la existente.
Así se evita que la galería muestre un dibujo con un nombre distinto al que la
niña asocia a esa letra.

## Compatibilidad con composiciones guardadas

Las once láminas sustituidas cambian de geometría y de ids de región. La
compatibilidad se resuelve así:

- El `artworkId` no cambia (`letter-b`, `letter-e`, `letter-g`, `letter-j`,
  `letter-p`, `letter-t`, `letter-u`, `letter-v`, `letter-w`, `letter-y` y
  `letter-enye`), así que la lámina sigue desbloqueada y la relación con la
  ficha y la recompensa se mantiene.
- Los trazos libres, las pegatinas, la fecha de desbloqueo y las estrellas se
  conservan intactos.
- Los rellenos antiguos **no se borran**: `normalizeFills` conserva cualquier
  clave y `saveArtwork` la vuelve a persistir. Mientras el id no exista en la
  nueva plantilla simplemente no se pinta.
- No se remapean automáticamente los ids antiguos (`head`, `body`, `tail`…) a
  las nuevas regiones (`part-01`, `part-02`…) porque las formas no se
  corresponden y un mapeo automático pintaría zonas arbitrarias. Si en el futuro
  se revierte una lámina, sus colores originales vuelven a aplicarse.

Este comportamiento está cubierto por una prueba en
`progress.repository.test.ts`: un relleno con un id que ya no existe sobrevive
al ciclo de guardado y lectura.

## Mantenimiento

- Para cambiar una lámina importada, actualiza el JSON de origen y vuelve a
  ejecutar el conversor; no edites los paths a mano.
- Si se regenera una lámina, los ids `part-NN` pueden cambiar. Los rellenos
  antiguos se conservan en IndexedDB, pero dejan de mostrarse hasta que se
  repinte la lámina.
- Cualquier nueva fuente debe añadirse a este documento antes de integrarse.
