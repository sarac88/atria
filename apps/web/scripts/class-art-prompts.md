# Ilustraciones de clase (cabecera + miniatura)

Una sola imagen por variante sirve para la cabecera y para la miniatura.
Estilo de referencia: los banners de Google Classroom — fondo plano de color
medio-oscuro, pocos objetos planos agrupados a la derecha, la izquierda vacía
para el título en blanco.

## Formato

- **Proporción 21:9** en Magnific (si no aparece, 16:9). Exportar PNG.
- Objetos **sólo en el 45 % derecho**, centrados en vertical, con aire arriba
  y abajo (la cabecera recorta poco, la miniatura 2:1 recorta por la izquierda).
- Fondo **liso**, sin degradado ni textura: el script mide su color y la
  cabecera lo usa de fondo para que la imagen se funda sin bordes.
- Sin texto, letras ni números (salen ilegibles), sin personas, sin marco.
- Nombrar las descargas `math-1.png`, `math-2.png`… y pasarlas por
  `python3 apps/web/scripts/process-class-art.py <carpeta>`.

## Prompt base

Rellenar `{BG}` y `{OBJECTS}` con cada fila de la tabla.

```
Flat vector illustration in the style of Google Classroom class banners.
Solid flat background color {BG} covering the entire canvas, no gradient,
no texture, no vignette. On the right side only, a small composed group of
{OBJECTS}. Simple geometric shapes, clean flat fills, very subtle soft shadows,
minimal detail, slight three-quarter top view, 3 to 4 harmonious accent colors
that contrast with the background. The left 55% of the image is completely
empty background. No text, no letters, no numbers, no people, no border,
no frame. Calm, modern, friendly.
```

Negative prompt (si lo admite): `text, letters, numbers, watermark, gradient
background, texture, noise, 3d render, photorealistic, people, hands, frame,
clutter`.

## Variantes

| id | Asignatura | {BG} | {OBJECTS} |
|---|---|---|---|
| math-1 | Matemáticas | `#2F5DA8` | a drawing compass, a yellow set square and a translucent ruler |
| math-2 | Matemáticas | `#3A4A5C` | a sheet of grid paper with a single red curve, a calculator and a pencil |
| math-3 | Matemáticas | `#B8365F` | three geometric solids: a cube, a cone and a sphere, with a protractor |
| science-1 | Naturales | `#2E7D4F` | a microscope, a large green leaf and a petri dish |
| science-2 | Naturales | `#1F6F8B` | a small globe, a magnifying glass and a butterfly |
| science-3 | Naturales | `#5E6B22` | a potted seedling, a glass jar with a sprout and a ladybug |
| physics-1 | Física y Química | `#1F7A72` | an erlenmeyer flask with green liquid, two test tubes in a rack and a simple atom symbol |
| physics-2 | Física y Química | `#5B3E96` | a glowing light bulb, a red horseshoe magnet and a small gear |
| physics-3 | Física y Química | `#2B4C7E` | a ringed planet with an orbit line, a small telescope and a few stars |
| literature-1 | Lengua | `#6A4BA8` | an open book, a feather quill and an inkwell |
| literature-2 | Lengua | `#9C3D3D` | a short stack of closed books, round reading glasses and a ribbon bookmark |
| literature-3 | Lengua | `#2F5D62` | a vintage typewriter with a blank sheet of paper and a pencil |
| history-1 | Historia | `#A0522D` | a greek column, a rolled parchment scroll and an amphora |
| history-2 | Historia | `#7A5230` | an old folded map with a compass rose and an hourglass |
| history-3 | Historia | `#45603A` | a medieval shield, a knight helmet and an old key |
| art-1 | Arte | `#B03A6A` | a painter's palette, two brushes and a paint tube |
| art-2 | Arte | `#B5462C` | a small easel with an abstract canvas and a jar of brushes |
| art-3 | Arte | `#3D5A99` | a clay vase, a sketchbook and colored pencils |
| social-1 | Ciencias sociales | `#7C4A6E` | a small bar chart card, a short stack of gold coins and a piggy bank |
| social-2 | Ciencias sociales | `#4E5BA6` | a small classical courthouse building, balance scales and a ballot box |
| social-3 | Ciencias sociales | `#8A5A1F` | a folded newspaper, a megaphone and two empty speech bubbles |
| computing-1 | Informática | `#263238` | an open laptop whose screen shows a few colored horizontal bars like code lines, a computer mouse and a coffee mug |
| computing-2 | Informática | `#5E35B1` | a small friendly robot, a microchip with circuit traces and a gear |
| computing-3 | Informática | `#00695C` | a cloud icon linked by dotted lines to a small server rack and a smartphone |

Todos los fondos dan ≥ 5:1 de contraste con texto blanco.

## Consejos

- Genera las 18 con la misma semilla/estilo (o usa la primera buena como
  *style reference*) para que la colección se vea coherente.
- Si un objeto sale demasiado grande o invade la izquierda, añade
  `small objects, lots of empty space` al prompt.
