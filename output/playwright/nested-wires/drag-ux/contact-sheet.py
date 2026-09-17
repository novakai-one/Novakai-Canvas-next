"""Compose saved screenshots for review; originals are retained without annotation.
Pillow is the only additional dependency. Rerun replaces contact-sheet.png.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
CROP = (230, 300, 880, 720)
CELL = (390, 278)
SHEET = Image.new('RGB', (CELL[0] * 4, CELL[1] * 8), '#eeeeee')
DRAW = ImageDraw.Draw(SHEET)

for group, name in enumerate(('valid', 'invalid')):
    frames = [OUT / f'{name}-before.png', *sorted((OUT / 'frames').glob(f'{name}-*.png')),
              OUT / f'{name}-after.png']
    for index, path in enumerate(frames):
        x = index % 4 * CELL[0]
        y = (group * 4 + index // 4) * CELL[1]
        with Image.open(path) as source:
            tile = source.crop(CROP).resize((390, 252), Image.Resampling.LANCZOS)
            SHEET.paste(tile, (x, y + 24))
        DRAW.text((x + 8, y + 6), path.stem, fill='#111111')

SHEET.save(OUT / 'contact-sheet.png')
print('Saved contact-sheet.png: before, all 12 moves, after; valid above invalid.')
