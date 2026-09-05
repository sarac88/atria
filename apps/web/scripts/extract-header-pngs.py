#!/usr/bin/env python3
"""Extrae ilustraciones de cabecera con fondo transparente."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path("/Users/saracouso/.cursor/projects/Users-saracouso-atria/assets")
OUT = ROOT / "public" / "headers"

PRESETS = [
    ("math", "ChatGPT_Image_5_sept_2026__15_29_33-197b54e6-a3dd-4f55-888d-7a0ef7addedf.jpg"),
    ("science", "ChatGPT_Image_5_sept_2026__15_27_30-5c7f1616-78a9-498e-a808-737134a735f8.jpg"),
    ("physics", "ChatGPT_Image_5_sept_2026__15_27_37-2c466877-fcb9-48fe-a8bc-183edf05425c.jpg"),
    ("literature", "ChatGPT_Image_5_sept_2026__15_27_48-c290c39a-22c5-457b-ae9d-97cfe2d8765f.jpg"),
    ("history", "ChatGPT_Image_5_sept_2026__15_27_15-5b1f1750-0ab8-488e-b58b-b38462272476.jpg"),
    ("art", "ChatGPT_Image_5_sept_2026__15_27_21-2bb7216b-9573-4058-98c5-7379578f57fd.jpg"),
]


def remove_black(img: Image.Image) -> Image.Image:
    """Quita el fondo negro de los renders nuevos, conservando sombras de color."""
    rgb = img.convert("RGBA")
    px = rgb.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            mx = max(r, g, b)
            chroma = mx - min(r, g, b)
            # Negro neutro (fondo). Los detalles oscuros con color se quedan.
            if mx <= 22 and chroma <= 10:
                px[x, y] = (r, g, b, 0)
            elif mx <= 42 and chroma <= 14:
                fade = int(255 * (mx - 22) / 20)
                px[x, y] = (r, g, b, min(255, fade))
    return rgb


def crop_cluster(img: Image.Image, pad: int = 8) -> Image.Image:
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, src_name in PRESETS:
        src = ASSETS / src_name
        out = OUT / f"{name}.png"
        img = Image.open(src)
        cut = crop_cluster(remove_black(img))
        cut.save(out, optimize=True)
        print(f"{name}: {cut.size[0]}x{cut.size[1]} -> {out}")

    for old in OUT.glob("*.webp"):
        old.unlink()
        print(f"removed {old.name}")


if __name__ == "__main__":
    main()
