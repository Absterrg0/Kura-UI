"""Contact sheet: python3 scripts/sheet.py out.png cols frame [frame…] (reads out/stills/fNNNN.png)."""
import sys
from PIL import Image, ImageDraw

out, cols, frames = sys.argv[1], int(sys.argv[2]), [int(f) for f in sys.argv[3:]]
w, h, pad = 640, 360, 6
rows = (len(frames) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + pad), rows * (h + pad + 22)), (40, 40, 44))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(frames):
    im = Image.open(f"out/stills/f{f:04d}.png").convert("RGB").resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * (w + pad), (i // cols) * (h + pad + 22)
    sheet.paste(im, (x, y + 22))
    d.text((x + 4, y + 4), f"f{f}  {f/60:.2f}s", fill=(200, 200, 200))
sheet.save(out)
