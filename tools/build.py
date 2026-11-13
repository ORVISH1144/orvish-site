#!/usr/bin/env python3
"""Rebuilds everything that is generated from the product files:
   data/products.json, one real page per product at /p/<id>/ (title, description, image and
   structured data are in the page itself, so Google and WhatsApp/Facebook previews see them), and sitemap.xml.
   Runs in the GitHub workflow on every product change; run it by hand after editing product.html."""
import json, glob, os, re, shutil, html
from urllib.parse import quote, unquote
SITE = 'https://www.orvish.com'
items = [json.load(open(f, encoding='utf8')) for f in glob.glob('data/products/*.json')]
items.sort(key=lambda p: (p.get('position', 100), p.get('title', '')))
for p in items: p.pop('position', None)
json.dump({'products': items}, open('data/products.json', 'w', encoding='utf8'), indent=2, ensure_ascii=False)
shown = [p for p in items if not p.get('hidden')]
commerce = json.load(open('data/commerce.json', encoding='utf8'))
tpl = open('product.html', encoding='utf8').read().replace('href="css/', 'href="/css/').replace('src="js/', 'src="/js/')
esc = lambda t: html.escape(str(t or ''), quote=True)
absu = lambda u: u if re.match(r'https?://', u or '') else SITE + quote(u or '/images/share.jpg', safe='/')
def plain(md):
    t = re.sub(r'[#*_`>]+', '', str(md or '')); t = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', t); return re.sub(r'\s+', ' ', t).strip()
def clip(t, n):
    return t if len(t) <= n else t[:n - 1].rsplit(' ', 1)[0].rstrip(',.;:') + '…'
keep = set()
for p in shown:
    pid = p['id']; keep.add(pid); url = f'{SITE}/p/{quote(pid)}/'
    imgs = [absu(i) for i in (p.get('images') or [])] or [SITE + '/images/share.jpg']
    brand = p.get('brand') or ''; price = p.get('price') or 0; notes = ', '.join(p.get('notes') or [])
    title = clip(f"{p['title']} | Buy Online – ORVISH", 70)
    free = commerce.get('free_shipping_above')
    desc = clip(' '.join(x for x in [
        f"Buy {p['title']}{' by ' + brand if brand else ''} online at ORVISH for ₹{price:,}.",
        f"Notes of {notes.lower()}." if notes else '',
        plain(p.get('short_description') or ''),
        'Authentic, with express shipping across India' + (f' and free shipping above ₹{free}.' if free else '.')] if x), 160)
    ld = [{'@context': 'https://schema.org', '@type': 'Product', 'name': p['title'], 'image': imgs, 'description': clip(plain(p.get('description') or p.get('short_description') or p['title']), 500), 'sku': pid,
           'offers': {'@type': 'Offer', 'url': url, 'priceCurrency': 'INR', 'price': price, 'availability': 'https://schema.org/' + ('InStock' if p.get('in_stock', True) else 'OutOfStock'), 'itemCondition': 'https://schema.org/NewCondition'}},
          {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
              {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'}, {'@type': 'ListItem', 'position': 2, 'name': 'Shop', 'item': SITE + '/shop'}, {'@type': 'ListItem', 'position': 3, 'name': p['title'], 'item': url}]}]
    if brand: ld[0]['brand'] = {'@type': 'Brand', 'name': brand}
    rd = commerce.get('return_window_days'); fee = commerce.get('shipping_fee') or 0
    if isinstance(rd, (int, float)) and rd > 0:
        ld[0]['offers']['hasMerchantReturnPolicy'] = {'@type': 'MerchantReturnPolicy', 'applicableCountry': 'IN', 'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow', 'merchantReturnDays': int(rd)}
    ld[0]['offers']['shippingDetails'] = {'@type': 'OfferShippingDetails', 'shippingRate': {'@type': 'MonetaryAmount', 'value': 0 if (free and price >= free) else fee, 'currency': 'INR'},
        'shippingDestination': {'@type': 'DefinedRegion', 'addressCountry': 'IN'},
        'deliveryTime': {'@type': 'ShippingDeliveryTime', 'handlingTime': {'@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 1, 'unitCode': 'DAY'},
                         'transitTime': {'@type': 'QuantitativeValue', 'minValue': int(commerce.get('delivery_days_min') or 3), 'maxValue': int(commerce.get('delivery_days_max') or 6), 'unitCode': 'DAY'}}}
    first = (p.get('images') or [''])[0]; mo = re.match(r'^/images/uploads/([^/?#]+)\.(png|jpe?g)$', first, re.I); pre = ''
    if mo:   # start downloading the main photo (the biggest thing on the page) straight away
        sl = re.sub(r'[^a-z0-9]+', '-', unquote(mo.group(1)).lower()).strip('-')
        pre = f'<link rel="preload" as="image" href="/images/opt/{sl}-800.webp" imagesrcset="/images/opt/{sl}-400.webp 400w, /images/opt/{sl}-600.webp 600w, /images/opt/{sl}-800.webp 800w, /images/opt/{sl}-1200.webp 1200w" imagesizes="(max-width:820px) 100vw, 50vw" fetchpriority="high">'
    head = (f'<title>{esc(title)}</title><meta name="description" content="{esc(desc)}"><link rel="canonical" href="{url}">'
            f'<meta property="og:type" content="product"><meta property="og:title" content="{esc(p["title"])}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{url}">'
            f'<meta property="og:image" content="{esc(imgs[0])}">{pre}<meta property="product:price:amount" content="{price}"><meta property="product:price:currency" content="INR"><meta name="twitter:card" content="summary_large_image">'
            + ''.join(f'<script type="application/ld+json" data-static-ld>{json.dumps(x, ensure_ascii=False).replace("</", "<\\/")}</script>' for x in ld))
    page = re.sub(r'<title>.*?</title><meta name="description" content="[^"]*">', lambda m: head, tpl, count=1, flags=re.S)
    page = re.sub(r'<meta property="og:image" content="https://www\.orvish\.com/images/share\.jpg">', '', page, count=1)
    fallback = (f'<noscript><h1>{esc(p["title"])}</h1><img src="{esc(imgs[0])}" alt="{esc(p["title"])}" width="400"><p>{esc(brand)}</p><p>₹{price:,}</p><p>{esc(plain(p.get("description") or ""))}</p></noscript>')
    page = page.replace('<div class="pdp" id="pdp"></div>', '<div class="pdp" id="pdp">' + fallback + '</div>', 1)
    assert 'data-static-ld' in page and fallback in page, 'product.html template changed: update tools/build.py'
    os.makedirs(f'p/{pid}', exist_ok=True); open(f'p/{pid}/index.html', 'w', encoding='utf8').write(page)
for d in glob.glob('p/*'):
    if os.path.isdir(d) and os.path.basename(d) not in keep: shutil.rmtree(d)
# plain links to every product inside the home and shop pages, so search engines find them without running the page script
links = '<noscript><ul>' + ''.join(f'<li><a href="/p/{quote(p["id"])}/">{esc(p["title"])}</a></li>' for p in shown) + '</ul></noscript>'
for f in ('index.html', 'shop.html'):
    t = open(f, encoding='utf8').read(); assert '<!--plinks-->' in t, f + ' lost its <!--plinks--> marker'
    open(f, 'w', encoding='utf8').write(re.sub(r'<!--plinks-->.*?<!--/plinks-->', lambda m: '<!--plinks-->' + links + '<!--/plinks-->', t, flags=re.S))
pages = json.load(open('data/pages.json', encoding='utf8'))['pages']
# one real page per info page at /info/<slug>/ with the text in the page itself
def md(src):
    out, lst = [], False
    def inline(l):
        t = esc(l)
        t = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: f'<a href="{m.group(2)}">{m.group(1)}</a>' if re.match(r'(https?:|mailto:|tel:|/|page|shop|index)', m.group(2)) else m.group(0), t)
        t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t); return re.sub(r'\*([^*]+)\*', r'<em>\1</em>', t)
    for l in str(src or '').split('\n'):
        t = inline(l); h = re.match(r'^(#{1,4})\s+(.*)', t)
        if re.match(r'^\s*[-*]\s+', l):
            if not lst: out.append('<ul>'); lst = True
            out.append('<li>' + re.sub(r'^\s*[-*]\s+', '', t) + '</li>'); continue
        if lst: out.append('</ul>'); lst = False
        if h: n = len(h.group(1)) + 1; out.append(f'<h{n}>{h.group(2)}</h{n}>')
        elif t.strip(): out.append('<p>' + t + '</p>')
    if lst: out.append('</ul>')
    return '\n'.join(out)
ptpl = open('page.html', encoding='utf8').read().replace('href="css/', 'href="/css/').replace('src="js/', 'src="/js/')
keep_i = set()
for x in pages:
    slug = x['slug']; keep_i.add(slug); url = f'{SITE}/info/{quote(slug)}/'
    d = clip(plain(x.get('body') or x['title']), 155) or x['title']
    head = (f'<title>{esc(x["title"])} – ORVISH</title><meta name="description" content="{esc(d)}"><link rel="canonical" href="{url}">'
            f'<meta property="og:type" content="article"><meta property="og:title" content="{esc(x["title"])} – ORVISH"><meta property="og:description" content="{esc(d)}"><meta property="og:url" content="{url}">')
    pg = re.sub(r'<title>.*?</title><meta name="description" content="[^"]*">', lambda m: head, ptpl, count=1, flags=re.S)
    body = f'<h1 style="font-size:40px">{esc(x["title"])}</h1>' + md(x.get('body'))
    pg = pg.replace('<div class="page-body" id="page-body"></div>', '<div class="page-body" id="page-body">' + body + '</div>', 1)
    assert 'rel="canonical"' in pg and body in pg, 'page.html template changed: update tools/build.py'
    os.makedirs(f'info/{slug}', exist_ok=True); open(f'info/{slug}/index.html', 'w', encoding='utf8').write(pg)
for d in glob.glob('info/*'):
    if os.path.isdir(d) and os.path.basename(d) not in keep_i: shutil.rmtree(d)
urls = [SITE + '/', SITE + '/shop'] + [f'{SITE}/p/{quote(p["id"])}/' for p in shown] + [f'{SITE}/info/{quote(x["slug"])}/' for x in pages]
open('sitemap.xml', 'w', encoding='utf8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('  <url><loc>%s</loc></url>\n' % u.replace('&', '&amp;') for u in urls) + '</urlset>\n')
print('built', len(shown), 'product pages,', len(pages), 'info pages,', len(urls), 'sitemap urls')
