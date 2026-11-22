#!/usr/bin/env python3
"""Makes small WebP copies (400, 600, 800 and 1200 px wide) of every photo in images/uploads into images/opt.
The website uses these instead of the original files, which can be several MB each.
EVERY photo of every product (1st, 2nd, 3rd ...) is also evened out: when it is a cut-out on a transparent or plain light background,
the empty space around it is trimmed and it is placed on a 4:5 canvas at one fixed size; any other photo (a scene with its own background)
is kept exactly as uploaded, with no bars added. So photo 1 of one product matches photo 1 of the next, and so on, on computers and phones. The original file is never changed.
Names: /images/opt/<lowercase-name-with-dashes>-<width>.webp. Run by the GitHub Action whenever a photo is added or changed."""
import os, re, glob, json, hashlib
from urllib.parse import unquote
from PIL import Image, ImageChops
SRC, OUT, WIDTHS = 'images/uploads', 'images/opt', (400, 600, 800, 1200)
def slug(name): return re.sub(r'[^a-z0-9]+', '-', unquote(name).lower()).strip('-')
NORM = 'even-v3'          # change this text to redo every evened-out photo
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
        if ev is not None: im = ev      # other photos (with their own background) are kept exactly as uploaded, no bars added
    for w in WIDTHS:
        o = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        o.save(f'{OUT}/{s}-{w}.webp', 'WEBP', quality=80, method=6)
    stamps[s] = h; made += 1
for f in glob.glob(OUT + '/*.webp'):
    base = re.sub(r'-\d+\.webp$', '', os.path.basename(f))
    if base not in seen: os.remove(f)
stamps = {k: v for k, v in stamps.items() if k in seen or k.startswith('share:')}
json.dump(stamps, open(stamp_file, 'w'), indent=0)
print('optimised', made, 'photos;', len(seen), 'in total')

# ---- link preview pictures (WhatsApp, Instagram/Facebook stories, Google): 1200 x 630 JPEG, small enough for WhatsApp ----
# images/share/<product id>.jpg: the product's first photo on the cream brand colour. images/share/home.jpg: the first bottles side by side.
SHARE, SW, SH, CREAM = 'images/share', 1200, 630, (241, 236, 225)
os.makedirs(SHARE, exist_ok=True)
def bottle(path):
    im = Image.open(path); im.load(); im = im.convert('RGBA')
    ev = even_out(im)
    if ev is not None: im = ev.convert('RGBA')
    a = im.split()[3]; box = a.point(lambda v: 255 if v > 40 else 0).getbbox()
    if box and a.getextrema()[0] < 128: im = im.crop(box)          # cut-out: just the bottle
    return im
def on_cream(parts, out):
    c = Image.new('RGB', (SW, SH), CREAM); n = len(parts); slot = SW // n
    for i, im in enumerate(parts):
        k = min(SH * 0.86 / im.height, slot * 0.86 / im.width); r = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        x = i * slot + (slot - r.width) // 2; y = (SH - r.height) // 2
        c.paste(r, (x, y), r if r.mode == 'RGBA' else None)
    c.save(out, 'JPEG', quality=84, optimize=True, progressive=True)
prods = []
for f in glob.glob('data/products/*.json'):
    try: prods.append(json.load(open(f, encoding='utf8')))
    except Exception: pass
prods.sort(key=lambda p: (p.get('position', 100), p.get('title', '')))
made_share, home_parts, keep_share = 0, [], {'banner.jpg'}
for p in prods:
    im = (p.get('images') or [None])[0]; im = im.get('image') if isinstance(im, dict) else im
    if not p.get('id') or not im: continue
    src = os.path.join(SRC, os.path.basename(unquote(str(im))))
    if not os.path.exists(src): continue
    out = f"{SHARE}/{p['id']}.jpg"; keep_share.add(os.path.basename(out))
    h = hashlib.sha1(open(src, 'rb').read()).hexdigest() + '|share-v1'
    try:
        b = bottle(src)
        if not p.get('hidden') and len(home_parts) < 4: home_parts.append(b)
        if stamps.get('share:' + p['id']) == h and os.path.exists(out): continue
        on_cream([b], out); stamps['share:' + p['id']] = h; made_share += 1
    except Exception as e: print('share picture not made for', p['id'], e)
# the home page (and other non-product pages) use the first banner photo of the home page, cut to 1200 x 630
hero = ''
try: hero = ((json.load(open('data/home.json', encoding='utf8')).get('slides') or [{}])[0].get('image') or '')
except Exception: pass
hsrc = os.path.join(SRC, os.path.basename(unquote(hero))) if hero else ''
if hsrc and os.path.exists(hsrc):
    hh = hashlib.sha1(open(hsrc, 'rb').read()).hexdigest() + '|hero-v1'
    if stamps.get('share:home') != hh or not os.path.exists(SHARE + '/banner.jpg'):
        im = Image.open(hsrc).convert('RGB'); k = max(SW / im.width, SH / im.height); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        x, y = (im.width - SW) // 2, (im.height - SH) // 2; im.crop((x, y, x + SW, y + SH)).save(SHARE + '/banner.jpg', 'JPEG', quality=84, optimize=True, progressive=True); stamps['share:home'] = hh
elif home_parts:
    hh = '|'.join(stamps.get('share:' + p['id'], '') for p in prods if not p.get('hidden'))[:4000]
    if stamps.get('share:home') != hh or not os.path.exists(SHARE + '/banner.jpg'): on_cream(home_parts, SHARE + '/banner.jpg'); stamps['share:home'] = hh
for f in glob.glob(SHARE + '/*.jpg'):
    if os.path.basename(f) not in keep_share: os.remove(f)
json.dump(stamps, open(stamp_file, 'w'), indent=0)
print('share pictures made:', made_share)
