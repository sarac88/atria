#!/usr/bin/env python3
"""Prepara las ilustraciones de clase descargadas de Magnific.

Uso: python3 apps/web/scripts/process-class-art.py <carpeta-con-pngs>

Cada `<id>.png` (math-1, art-3…) se recorta a 21:9 anclado a la derecha, se
guarda en public/class-art/<id>.webp y se imprime el color de fondo medido en
la franja izquierda, que es el que usa la cabecera para fundirse con la imagen.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "class-art"
SIZE = (1344, 576)  # 21:9, el tamaño que exporta Magnific


def fit_right(img: Image.Image) -> Image.Image:
    """Recorta a 21:9 sin tocar el lado derecho, donde van los objetos."""
    w, h = img.size
    target = SIZE[0] / SIZE[1]
    if w / h > target:
        nw = round(h * target)
        img = img.crop((w - nw, 0, w, h))
    else:
        nh = round(w / target)
        top = (h - nh) // 2
        img = img.crop((0, top, w, top + nh))
    return img.resize(SIZE, Image.LANCZOS)


def background(img: Image.Image) -> str:
    """Mediana del 15 % izquierdo: ahí sólo hay fondo."""
    strip = img.crop((0, 0, int(img.width * 0.15), img.height)).convert("RGB")
    chans = list(zip(*strip.getdata()))
    med = [sorted(c)[len(c) // 2] for c in chans]
    return "#{:02x}{:02x}{:02x}".format(*med)


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not src or not src.is_dir():
        sys.exit(__doc__)
    OUT.mkdir(parents=True, exist_ok=True)
    for path in sorted(src.glob("*.png")) + sorted(src.glob("*.jpg")) + sorted(src.glob("*.webp")):
        img = fit_right(Image.open(path).convert("RGB"))
        img.save(OUT / f"{path.stem}.webp", "WEBP", quality=86, method=6)
        print(f'{{ id: "{path.stem}", bg: "{background(img)}" }},')


if __name__ == "__main__":
    main()
