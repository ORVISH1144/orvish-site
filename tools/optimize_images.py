#!/usr/bin/env python3
"""Makes small WebP copies (400, 800 and 1200 px wide) of every photo in images/uploads into images/opt.
The website uses these instead of the original files, which can be several MB each.
Names: /images/opt/<lowercase-name-with-dashes>-<width>.webp. Run by the GitHub Action whenever a photo is added or changed."""
import os, re, glob, json, hashlib
from urllib.parse import unquote
from PIL import Image
SRC, OUT, WIDTHS = 'images/uploads', 'images/opt', (400, 800, 1200)
def slug(name): return re.sub(r'[^a-z0-9]+', '-', unquote(name).lower()).strip('-')
os.makedirs(OUT, exist_ok=True)
stamp_file = os.path.join(OUT, 'stamps.json')
stamps = json.load(open(stamp_file)) if os.path.exists(stamp_file) else {}
seen, slugs, made = set(), {}, 0
for f in sorted(glob.glob(SRC + '/*')):
    stem, ext = os.path.splitext(os.path.basename(f))
    if ext.lower() not in ('.png', '.jpg', '.jpeg'): continue
    s = slug(stem); assert s not in slugs, f'two photos give the same short name {s}: {f} and {slugs[s]}'; slugs[s] = f
    h = hashlib.sha1(open(f, 'rb').read()).hexdigest(); seen.add(s)
    if stamps.get(s) == h and all(os.path.exists(f'{OUT}/{s}-{w}.webp') for w in WIDTHS): continue
    im = Image.open(f); im.load()
    im = im.convert('RGBA' if ('A' in im.getbands() or im.mode == 'P' and 'transparency' in im.info) else 'RGB')
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
