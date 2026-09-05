#!/usr/bin/env python3
"""Extrae ilustraciones de cabecera con fondo transparente."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path("/Users/saracouso/.cursor/projects/Users-saracouso-atria/assets")
OUT = ROOT / "public" / "headers"

PRESETS = [
    ("math", "ChatGPT_Image_4_sept_2026__17_16_49-661c4760-e458-4eab-8d64-27224eb435d3.jpg", "#a8ccf5"),
    ("science", "ChatGPT_Image_4_sept_2026__17_17_09-c986cd4c-1f12-4047-9514-c2aff588cbf2.jpg", "#c8e6a0"),
    ("physics", "ChatGPT_Image_4_sept_2026__17_16_38-4816030c-8b0b-4b94-959c-01fc840bcf41.jpg", "#a9ddcf"),
    ("literature", "ChatGPT_Image_4_sept_2026__17_16_43-836515d7-83ee-44a6-9a3a-fad1afff9651.jpg", "#c3a8f2"),
    ("history", "ChatGPT_Image_4_sept_2026__17_17_04-d918dae2-7009-42a1-9275-0775dba81069.jpg", "#fbd684"),
    ("art", "ChatGPT_Image_4_sept_2026__17_16_58-32ae0716-9431-40cc-adb6-381f6cd1d1ea.jpg", "#f9bcd0"),
]


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def color_dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def sample_bg(img: Image.Image) -> tuple[int, int, int]:
    w, h = img.size
    pts: list[tuple[int, int, int]] = []
    for x in range(0, int(w * 0.35), max(1, w // 40)):
        for y in range(0, h, max(1, h // 12)):
            pts.append(img.getpixel((x, y))[:3])
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        pts.append(img.getpixel((x, y))[:3])
    return max(set(pts), key=pts.count)


def remove_bg(img: Image.Image, tint: str, tolerance: float = 42.0) -> Image.Image:
    rgb = img.convert("RGBA")
    target = hex_to_rgb(tint)
    bg = sample_bg(rgb)
    # Usa el tono más cercano entre el tint declarado y el muestreado.
    ref = target if color_dist(target, bg) < 30 else bg
    px = rgb.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            d = color_dist((r, g, b), ref)
            if d <= tolerance:
                px[x, y] = (r, g, b, 0)
            elif d <= tolerance + 28:
                fade = int(255 * (d - tolerance) / 28)
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
    for name, src_name, tint in PRESETS:
        src = ASSETS / src_name
        out = OUT / f"{name}.png"
        img = Image.open(src)
        cut = crop_cluster(remove_bg(img, tint))
        cut.save(out, optimize=True)
        print(f"{name}: {cut.size[0]}x{cut.size[1]} -> {out}")

    for old in OUT.glob("*.webp"):
        old.unlink()
        print(f"removed {old.name}")


if __name__ == "__main__":
    main()
