"""Compose MEU (Exo 2 ExtraBold, 10deg slant, logo blue) + the official SENAI mark.

Usage: python scripts/make-logo.py assets/senai-mark.png Exo2[wght].ttf assets/meu-senai-logo.png assets/meu-senai-logo-white.png 800
Exo 2 (SIL OFL): https://github.com/google/fonts/tree/main/ofl/exo2
"""
import math
import sys

from PIL import Image, ImageDraw, ImageFont

mark_path, font_path, out_path, out_white = sys.argv[1:5]
SCALE = 3  # work at 3x so the new letters are crisp
BLUE = (14, 65, 148)
SKEW = 10
WEIGHT = float(sys.argv[5]) if len(sys.argv) > 5 else 800

mark = Image.open(mark_path).convert('RGBA')
mark = mark.resize((mark.width * SCALE, mark.height * SCALE), Image.LANCZOS)
alpha = mark.split()[3].point(lambda a: 255 if a > 128 else 0)

# Cap height of the logo = vertical extent of the S (first glyph columns).
s_cols = alpha.crop((0, 0, int(mark.width * 0.17), mark.height))
cap_box = s_cols.getbbox()
cap_top, cap_bottom = cap_box[1], cap_box[3]
cap_h = cap_bottom - cap_top

font = ImageFont.truetype(font_path, 100)
axes = font.get_variation_axes()
font.set_variation_by_axes([WEIGHT])
# Size the font so its rendered cap height matches the logo.
probe = font.getbbox('E')
font_size = 100 * cap_h / (probe[3] - probe[1])
font = ImageFont.truetype(font_path, round(font_size))
font.set_variation_by_axes([WEIGHT])

# Letter spacing: un-slant the logo, then measure the gap between S and E.
k0 = math.tan(math.radians(SKEW))
pad = int(mark.height * k0) + 4
wide = Image.new('L', (mark.width + 2 * pad, mark.height), 0)
wide.paste(alpha, (pad, 0))
upright = wide.transform(wide.size, Image.AFFINE, (1, -k0, k0 * mark.height, 0, 1, 0), resample=Image.NEAREST)
cols = [upright.crop((x, 0, x + 1, mark.height)).getbbox() is not None for x in range(upright.width)]
runs, start = [], None
for x, c in enumerate(cols):
    if c and start is None:
        start = x
    if not c and start is not None:
        runs.append((start, x))
        start = None
gap = runs[1][0] - runs[0][1] if len(runs) > 1 else int(cap_h * 0.08)
print('letter runs', runs)

# Render MEU with the same tracking.
canvas = Image.new('L', (int(cap_h * 6), int(cap_h * 2)), 0)
d = ImageDraw.Draw(canvas)
x, y = int(cap_h * 0.5), int(cap_h * 0.5)
for ch in 'MEU':
    bb = font.getbbox(ch)
    d.text((x - bb[0], y - bb[1]), ch, font=font, fill=255)
    x += (bb[2] - bb[0]) + gap
k = math.tan(math.radians(SKEW))
canvas = canvas.transform(canvas.size, Image.AFFINE, (1, k, -k * (y + cap_h), 0, 1, 0), resample=Image.BICUBIC)
meu = canvas.crop(canvas.getbbox())

word_gap = int(cap_h * 0.42)
W = meu.width + word_gap + mark.width
H = mark.height
out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
meu_rgba = Image.new('RGBA', meu.size, BLUE + (255,))
meu_rgba.putalpha(meu)
out.paste(meu_rgba, (0, cap_top), meu_rgba)
out.paste(mark, (meu.width + word_gap, 0), mark)
out.save(out_path, optimize=True)

# White version for dark backgrounds: blue -> white, keep the orange accent.
px = out.load()
white = out.copy()
wp = white.load()
for yy in range(H):
    for xx in range(W):
        r, g, b, a = px[xx, yy]
        if a and not (r > 150 and b < 120):
            wp[xx, yy] = (255, 255, 255, a)
white.save(out_white, optimize=True)
print('size', out.size, 'cap_h', cap_h, 'gap', gap, 'font_px', round(font_size))
