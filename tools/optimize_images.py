#!/usr/bin/env python3
"""Makes small WebP copies (400, 600, 800 and 1200 px wide) of every photo in images/uploads into images/opt.
The website uses these instead of the original files, which can be several MB each.
EVERY photo of every product (1st, 2nd, 3rd ...) is also evened out: when it is a cut-out on a transparent or plain light background,
the empty space around it is trimmed and it is placed on a 4:5 canvas at one fixed size; any other photo is placed whole on a 4:5 canvas
(nothing is cut off). So photo 1 of one product matches photo 1 of the next, and so on, on computers and phones. The original file is never changed.
Names: /images/opt/<lowercase-name-with-dashes>-<width>.webp. Run by the GitHub Action whenever a photo is added or changed."""
import os, re, glob, json, hashlib
from urllib.parse import unquote
from PIL import Image, ImageChops
SRC, OUT, WIDTHS = 'images/uploads', 'images/opt', (400, 600, 800, 1200)
def slug(name): return re.sub(r'[^a-z0-9]+', '-', unquote(name).lower()).strip('-')
NORM = 'even-v2'          # change this text to redo every evened-out photo
CANVAS = (1200, 1500)     # 4:5, the shape of a product card
FIT_H, FIT_W = 0.76, 0.74 # the bottle fills at most this share of the canvas height and width
def main_photos():
    out = set()
    for f in glob.glob('data/products/*.json'):
        try:
            for im in (json.load(open(f, encoding='utf8')).get('images') or []):
                im = im.get('image') if isinstance(im, dict) else im
                if im: out.add(os.path.basename(unquote(str(im))))
        except Exception: pass
    return out
def even_out(im):
    """Returns the bottle centred on the canvas at the fixed size, or None when the photo is not a cut-out on a plain background."""
    rgba = im.convert('RGBA'); a = rgba.split()[3]
    if a.getextrema()[0] < 128:                                   # transparent background
        box = a.point(lambda v: 255 if v > 40 else 0).getbbox(); bg = (0, 0, 0, 0)
    else:                                                          # plain light background: all four corners nearly the same light colour
        w, h = rgba.size; cs = [rgba.getpixel(p)[:3] for p in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3))]
        if min(min(c) for c in cs) < 225 or max(max(abs(c[i] - cs[0][i]) for i in range(3)) for c in cs) > 10: return None
        diff = ImageChops.difference(rgba.convert('RGB'), Image.new('RGB', rgba.size, cs[0])).convert('L')
        box = diff.point(lambda v: 255 if v > 16 else 0).getbbox(); bg = cs[0] + (255,)
    if not box: return None
    sub = rgba.crop(box); k = min(CANVAS[1] * FIT_H / sub.height, CANVAS[0] * FIT_W / sub.width)
    sub = sub.resize((max(1, round(sub.width * k)), max(1, round(sub.height * k))), Image.LANCZOS)
    out = Image.new('RGBA', CANVAS, bg); out.paste(sub, ((CANVAS[0] - sub.width) // 2, (CANVAS[1] - sub.height) // 2), sub if bg[3] == 0 else None)
    if bg[3] == 0: out.paste(sub, ((CANVAS[0] - sub.width) // 2, (CANVAS[1] - sub.height) // 2))   # keep the soft transparent edges exactly
    return out if bg[3] == 0 else out.convert('RGB')
def frame(im):
    """Any other photo (not a cut-out): the whole picture on a 4:5 canvas, padded with its own edge colour. Nothing is cropped."""
    w, h = im.size
    if abs(w / h - CANVAS[0] / CANVAS[1]) < 0.02: return im
    rgb = im.convert('RGB'); px = [rgb.getpixel((x, y)) for x in range(0, w, max(1, w // 20)) for y in (0, h - 1)] + [rgb.getpixel((x, y)) for y in range(0, h, max(1, h // 20)) for x in (0, w - 1)]
    bg = tuple(sorted(c[i] for c in px)[len(px) // 2] for i in range(3))
    k = min(CANVAS[0] / w, CANVAS[1] / h); r = rgb.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    out = Image.new('RGB', CANVAS, bg); out.paste(r, ((CANVAS[0] - r.width) // 2, (CANVAS[1] - r.height) // 2)); return out
MAIN = main_photos()
os.makedirs(OUT, exist_ok=True)
stamp_file = os.path.join(OUT, 'stamps.json')
stamps = json.load(open(stamp_file)) if os.path.exists(stamp_file) else {}
seen, slugs, made = set(), {}, 0
for f in sorted(glob.glob(SRC + '/*')):
    stem, ext = os.path.splitext(os.path.basename(f))
    if ext.lower() not in ('.png', '.jpg', '.jpeg'): continue
    s = slug(stem); assert s not in slugs, f'two photos give the same short name {s}: {f} and {slugs[s]}'; slugs[s] = f
    h = hashlib.sha1(open(f, 'rb').read()).hexdigest() + ('|' + NORM if os.path.basename(f) in MAIN else ''); seen.add(s)
    if stamps.get(s) == h and all(os.path.exists(f'{OUT}/{s}-{w}.webp') for w in WIDTHS): continue
    im = Image.open(f); im.load()
    im = im.convert('RGBA' if ('A' in im.getbands() or im.mode == 'P' and 'transparency' in im.info) else 'RGB')
    if os.path.basename(f) in MAIN:
        ev = even_out(im)
        im = ev if ev is not None else frame(im)
    for w in WIDTHS:
        o = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        o.save(f'{OUT}/{s}-{w}.webp', 'WEBP', quality=80, method=6)
    stamps[s] = h; made += 1
for f in glob.glob(OUT + '/*.webp'):
    base = re.sub(r'-\d+\.webp$', '', os.path.basename(f))
    if base not in seen: os.remove(f)
stamps = {k: v for k, v in stamps.items() if k in seen}
json.dump(stamps, open(stamp_file, 'w'), indent=0)
print('optimised', made, 'photos;', len(seen), 'in total')
