/* ORVISH brand film – built from the store's own data (products, prices, stock, theme, logo).
   Everything is set in Admin > Brand film (data/film.json). No video file, no libraries.
   Only transform and opacity are animated, so the phone's graphics chip does the work.
   It starts when the section is on screen, pauses when it is not (or the tab is hidden),
   plays the set number of times, then rests on the end frame. */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cssUrl(u) { return 'url("' + String(u || '').replace(/["\\\n]/g, '') + '")'; }
  function nameOf(p) { return String(p.title || '').split(/\s[–—-]\s/)[0]; }
  function subOf(p) { var s = String(p.title || '').split(/\s[–—-]\s/); return s[1] || p.type || ''; }
  function off(p) { return p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0; }
  function on(v) { return v !== false; }
  var ICO = {
    search: '<svg width="S" height="S" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    pin: '<svg width="S" height="S" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    arrow: '<svg width="S" height="S" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    user: '<svg width="S" height="S" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    bag: '<svg width="S" height="S" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
  };
  function ico(n, s) { return ICO[n].replace(/S/g, s); }

  /* the same little city every time */
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function cityMap(ground) {
    var r = rnd(7), s = '<svg width="1000" height="1000" viewBox="0 0 1000 1000" aria-hidden="true"><rect width="1000" height="1000" fill="' + ground + '"/>';
    for (var i = 0; i <= 8; i++) s += '<rect x="' + (i * 125 - 9) + '" width="18" height="1000" fill="rgba(255,255,255,.10)"/><rect y="' + (i * 125 - 9) + '" width="1000" height="18" fill="rgba(255,255,255,.10)"/>';
    for (var gx = 0; gx < 8; gx++) for (var gy = 0; gy < 8; gy++) {
      var x0 = gx * 125 + 17, y0 = gy * 125 + 17, n = 1 + Math.floor(r() * 3);
      for (var b = 0; b < n; b++) {
        var w = 30 + r() * 55, h = 30 + r() * 55, x = x0 + r() * (91 - w), y = y0 + r() * (91 - h), up = 4 + r() * 12;
        s += '<rect x="' + (x + up * .6).toFixed(1) + '" y="' + (y + up * .6).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="#000" opacity=".45"/>';
        s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="rgba(255,255,255,' + (r() > .5 ? '.10' : '.06') + ')"/>';
      }
    }
    return s + '</svg>';
  }
  var ROUTE = 'M125 875 L375 875 L375 625 L625 625 L625 375 L875 375 L875 250';

  /* scene order and length (seconds); each scene overlaps the next a little */
  var SCENES = [['intro', 1.6], ['logo', 3.6], ['home', 2.4], ['search', 2.6], ['cards', 2.6], ['product', 3.0], ['order', 1.8], ['map', 3.9], ['box', 3.4], ['headline', 2.4], ['tagline', 2.4], ['end', 3.5]];

  function build(d, o) {
    var S = d.site || {}, F = d.film || {}, th = S.theme || {}, sc = F.scenes || {};
    var sym = S.currency_symbol || '₹', money = function (n) { return sym + Number(n).toLocaleString('en-IN'); };
    var inStock = o.inStock || function (p) { return p.in_stock !== false; };
    var all = (d.products || []).filter(function (p) { return p && !p.hidden && p.price > 0; });
    var showSO = F.show_out_of_stock === true, soLabel = F.out_of_stock_label || 'Sold out';
    /* products in the film: the ones picked in the admin (in that order), otherwise the store's order */
    var picked = (F.products || []).map(function (id) { return all.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
    var pool = (picked.length ? picked : all).filter(function (p) { return showSO || inStock(p); });
    if (!pool.length) return null;
    var avail = all.filter(inStock);
    var hero = avail.filter(function (p) { return p.id === F.hero_product; })[0] || avail.filter(function (p) { return p.best_seller; })[0] || avail[0];
    if (!hero) { sc.product = false; sc.order = false; hero = pool[0]; }
    var q = String(F.search_word || '').trim();
    if (!q) { var cnt = {}; avail.forEach(function (p) { (p.notes || []).forEach(function (n) { cnt[n] = (cnt[n] || 0) + 1; }); }); q = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0] || 'Perfume'; }
    var ql = q.toLowerCase();
    var match = function (p) { return (nameOf(p) + ' ' + (p.notes || []).join(' ') + ' ' + (p.type || '')).toLowerCase().indexOf(ql) >= 0; };
    var hits = pool.filter(match), rest = pool.filter(function (p) { return !match(p); });
    var cardsList = hits.concat(rest).slice(0, 6);
    var free = F.shipping_text || ((S.announcements || []).some(function (a) { return /free ship/i.test(a); }) ? 'Free shipping' : 'Express shipping');
    /* the small WebP copy of the photo; if it is missing, the original photo */
    var imgT = function (p) { var s = o.img(p), f = o.orig ? o.orig(p) : s; return '<img src="' + esc(s) + '"' + (f && f !== s ? ' data-f="' + esc(f) + '" onerror="this.onerror=null;this.src=this.dataset.f"' : '') + ' alt="" decoding="async">'; };
    var soChip = function (p) { return inStock(p) ? '' : '<span class="of-so">' + esc(soLabel) + '</span>'; };
    var stars = function (p) { var x = o.rating && o.rating(p.id); return x && x.n ? '★★★★★'.slice(0, Math.round(x.avg)) + ' ' + x.avg.toFixed(1) + ' (' + x.n + ')' : ''; };

    var icon = F.icon || '/images/film/orvish-icon.png', word = F.wordmark || '/images/film/orvish-wordmark.png';
    var vars = '--p:' + (th.primary || '#092d29') + ';--a:' + (th.accent || '#b89519') + ';--c:' + (th.bg || '#f1ece1') + ';--ink:' + (th.ink || '#14211f') +
      ';--g1:' + (F.icon_color || '#f3cf45') + (th.heading_font ? ";--hf:'" + th.heading_font + "',Georgia,serif" : '') + (th.body_font ? ";--bf:'" + th.body_font + "',system-ui,sans-serif" : '') +
      ';--icon:' + cssUrl(icon) + ';--word:' + cssUrl(word);
    var status = '<div class="of-island"></div><div class="of-status"><span>9:41</span><span>●●● <i></i></span></div>';
    var brand = function (cls) {
      return '<div class="of-brand ' + (cls || '') + '"><div class="of-icon"><i class="of-halo"></i><i class="of-wl g"></i><i class="of-wr g"></i><i class="of-wl w"></i><i class="of-wr w"></i><i class="of-shine"><b></b></i></div><i class="of-word"></i></div>';
    };
    var words = function (t, last) {
      var w = String(t).trim().split(/\s+/);
      return w.map(function (x, i) { return '<span class="of-w' + (last && i === w.length - 1 ? ' u' : '') + '" style="--i:' + i + '">' + esc(x) + '</span>'; }).join(' ');
    };

    var parts = {
      intro: '<i class="of-streak" style="--r:-22deg"></i><i class="of-streak" style="--r:16deg;--t:.25s"></i><i class="of-flare"></i>',
      logo: brand(),
      home: '<div class="of-ph of-ph3"><div class="of-scr">' + status + '<div class="of-hdr"><i class="of-mn"><b></b><b></b><b></b></i>' + (o.logo ? '<img class="of-hl" src="' + esc(o.logo) + '" alt="">' : '<i class="of-hw"></i>') + '<span class="of-hi">' + ico('user', 11) + ico('bag', 11) + '</span></div><div class="of-sbar"><div>Search for perfumes, brands…' + ico('search', 10) + '</div></div><div class="of-hh">' + esc(S.home_heading || 'Our products') + '</div><div class="of-grid">' +
        pool.slice(0, 4).map(function (p, i) { return '<div class="of-tile of-up' + (inStock(p) ? '' : ' so') + '" style="--t:' + (.55 + i * .1) + 's"><div class="im">' + imgT(p) + '' + soChip(p) + '</div>' + esc(nameOf(p)) + '<b>' + money(p.price) + '</b></div>'; }).join('') + '</div><i class="of-sweep" style="--t:1.1s"></i></div></div>',
      search: '<div class="of-ph of-ph4"><div class="of-scr">' + status + '<div class="of-field">' + ico('search', 22) + '<span class="of-typed">' + q.split('').map(function (ch, i) { return '<span style="--i:' + i + '">' + esc(ch) + '</span>'; }).join('') + '</span><i class="of-caret"></i><i class="of-prog"></i></div><div class="of-loc">' + ico('pin', 16) + esc(F.location_text || 'Delivering across India') + ' · ' + esc(free) + '</div>' +
        (hits.length ? hits : pool).slice(0, 4).map(function (p, i) {
          var n = esc(nameOf(p)), k = n.toLowerCase().indexOf(esc(ql));
          if (k >= 0) n = n.slice(0, k) + '<b>' + n.slice(k, k + esc(q).length) + '</b>' + n.slice(k + esc(q).length);
          return '<div class="of-sug of-up" style="--t:' + (.75 + q.length * .16 + i * .1) + 's">' + ico('search', 16) + '<span>' + n + (inStock(p) ? '' : ' <em>· ' + esc(soLabel) + '</em>') + '</span>' + ico('arrow', 16) + '</div>';
        }).join('') + '</div></div>',
      cards: '<div class="of-ph of-ph5"><div class="of-scr">' + status + '<div class="of-mini">' + esc(q) + '</div><i class="of-sweep" style="--t:.5s"></i></div></div>' +
        cardsList.map(function (p, i) {
          var P = [[22, 30, -4], [58, 212, 3], [26, 398, -2], [456, 30, 4], [420, 212, -3], [452, 398, 2]][i], st = stars(p);
          return '<div class="of-card' + (inStock(p) ? '' : ' so') + '" style="--x:' + P[0] + 'px;--y:' + P[1] + 'px;--fx:' + (239 - P[0]) + 'px;--fy:' + (215 - P[1]) + 'px;--i:' + i + ';--rot:' + P[2] + 'deg"><div class="of-ci"><div class="im">' + imgT(p) + '' + soChip(p) + '</div><h6>' + esc(nameOf(p)) + '<small>' + esc(subOf(p)) + '</small></h6><div class="st">' + (st || esc((p.notes || []).slice(0, 2).join(' · ') || p.type || '')) + '</div><div class="pr">' + money(p.price) + (off(p) ? '<s>' + money(p.compare_at_price) + '</s>' : '') + '</div><div class="fs">' + (inStock(p) ? esc(free) : esc(soLabel)) + '</div></div></div>';
        }).join(''),
      product: (function () {
        var st = stars(hero), pc = off(hero), tag = hero._deal ? hero._deal.badge : hero.best_seller ? 'Best seller' : hero.badge;
        return '<div class="of-ph of-ph6"><div class="of-scr">' + status + '<span class="of-badge">1</span><div class="of-pin"><div class="of-pim">' + (tag ? '<span class="of-tag">' + esc(tag) + '</span>' : '') + '' + imgT(hero) + '</div><div class="of-dots"><i></i><i></i><i></i></div><div class="of-pt"><h5>' + esc(nameOf(hero)) + '</h5><div class="sub">' + esc(subOf(hero)) + '</div>' + (st ? '<div class="st">' + st + '</div>' : '') +
          '<div class="of-price">' + money(hero.price) + (pc ? '<s>' + money(hero.compare_at_price) + '</s><em>' + pc + '% off</em>' : '') + '</div><div class="of-ship">' + esc(free) + '</div><div class="of-stock"><i></i>In stock</div>' +
          '<div class="of-btn gold">' + ico('bag', 15) + '&nbsp; Add to cart<i class="of-flash" style="--t:1.75s"></i><i class="of-tap" style="--t:1.7s"></i></div><div class="of-btn dark">Buy it now<i class="of-flash" style="--t:2.45s"></i><i class="of-tap" style="--t:2.4s"></i></div><div class="of-pay"><span>UPI</span><span>VISA</span><span>Mastercard</span><span>RuPay</span></div></div></div></div></div>';
      })(),
      order: '<div class="of-btn dark of-big">Buy it now</div><div class="of-ok"><span class="ck"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span>' + esc(F.order_text || 'Order placed, thank you!') + '</span></div><div class="of-oksub of-fade" style="--t:.9s">' + esc(F.order_subtext || 'Paid securely · Confirmation sent to your email') + '</div>',
      map: '<div class="of-persp"><div class="of-plane">' + cityMap('color-mix(in srgb,' + (th.primary || '#092d29') + ' 55%,#000)') + '<svg class="of-route" viewBox="0 0 1000 1000" aria-hidden="true"><path class="g" d="' + ROUTE + '"/><path class="l" d="' + ROUTE + '"/></svg><i class="of-dest" style="left:875px;top:250px"></i><i class="of-van" style="offset-path:path(\'' + ROUTE + '\')"></i></div></div>' +
        '<div class="of-track"><h4>' + esc(F.track_title || 'Arriving today') + '</h4><p>' + esc(F.track_subtext || 'Out for delivery') + '</p><div class="of-steps">' + [0, 1, 2, 3].map(function (i) { return '<i class="' + (i < 3 ? 'on' : '') + '" style="--t:' + (i * .8) + 's"></i>'; }).join('') + '</div><div class="of-lbl"><span>Ordered</span><span>Shipped</span><span>Out for delivery</span><span>Delivered</span></div></div>',
      box: '<div class="of-floor"></div><i class="of-shadow"></i><div class="of-boxw"><div class="of-cube"><div class="of-t"><i class="of-rib"></i></div><div class="of-r"><i class="of-rib"></i></div><div class="of-f"><i class="of-rib"></i><i class="of-mark"></i></div></div></div>' +
        '<div class="of-note"><span class="of-app"></span><div style="flex:1"><small><span>' + esc(String(S.store_name || 'ORVISH').toUpperCase()) + '</span><span>now</span></small><b>' + esc(F.delivered_title || 'Delivered') + '</b><span>' + esc(F.delivered_text || 'Your fragrance has arrived. Enjoy!') + '</span></div></div>',
      headline: '<div class="of-words">' + words(F.headline || 'Every scent you love.', true) + '</div>',
      tagline: (function () {
        var trust = F.show_trust_points === false ? [] : (S.ticker || []).map(function (t) { return t.text; }).filter(Boolean).slice(0, 4);
        return '<div class="of-words sm">' + words(F.tagline || S.tagline || 'Authentic fragrances, delivered across India') + '</div>' + (trust.length ? '<div class="of-chips">' + trust.map(function (t, i) { return '<span class="of-up" style="--t:' + (.7 + i * .12) + 's">' + esc(t) + '</span>'; }).join('') + '</div>' : '');
      })(),
      end: brand('fin') + '<a class="of-cta" href="' + esc(F.button_link || '/shop') + '" data-go="1">' + esc(F.button_label || 'Shop now') + '</a>'
    };
    var t = 0, h = '';
    SCENES.forEach(function (s) {
      if (s[0] !== 'end' && !on(sc[s[0]])) return;
      h += '<div class="of-sc of-' + s[0] + (s[0] === 'end' ? ' last' : '') + '" style="--s:' + t.toFixed(2) + 's;--d:' + s[1] + 's">' + parts[s[0]] + '</div>';
      t += s[1] - .25;
    });
    return { vars: vars, hero: hero, html: '<i class="of-glow"></i><div class="of-stage">' + h + '</div><button class="of-replay" type="button" aria-label="Replay the film">↻ Replay</button>' };
  }

  function mount(el, data, opts) {
    var b = build(data, opts || {});
    if (!b) return null;
    var F = data.film || {}, plays = Math.max(1, Math.min(5, Number(F.plays) || 2)), loops = 0, visible = false, started = false;
    var root = document.createElement('div');
    root.className = 'orv-film';
    root.setAttribute('style', b.vars);
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', F.alt_text || 'ORVISH: find your perfume, order in a tap, delivered to your door');
    root.innerHTML = b.html;
    if (F.tap_link) root.classList.add('tap');
    el.appendChild(root);
    var stage = root.querySelector('.of-stage'), glow = root.querySelector('.of-glow'), last = root.querySelector('.of-sc.last');
    function fit() { var w = root.clientWidth, h = root.clientHeight; if (!w || !h) return; var k = Math.min(w / 600, h / 600); stage.style.setProperty('--k', k); root.style.setProperty('--zy', h > w * 1.1 ? '-110px' : '-185px'); glow.style.setProperty('--k', k); }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(root); else window.addEventListener('resize', fit);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) root.classList.add('static');
    function start() { root.classList.remove('play', 'ended'); void root.offsetWidth; root.classList.add('play'); started = true; }
    function sync() { var run = visible && !document.hidden; root.classList.toggle('paused', !run); if (run && !started && !reduce) start(); }
    last.addEventListener('animationend', function (e) {
      if (e.target !== last) return;
      loops++; root.classList.add('ended');
      if (loops < plays) setTimeout(start, 2500);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }, { threshold: .35 }).observe(root);
    else { visible = true; sync(); }
    document.addEventListener('visibilitychange', sync);
    root.addEventListener('click', function (e) {
      if (e.target.closest('.of-replay')) { e.preventDefault(); loops = 0; reduce = false; root.classList.remove('static'); start(); sync(); return; }
      /* only the end button is a link; a tap elsewhere goes somewhere only if a link is set in the admin */
      if (e.target.closest('[data-go]') || !F.tap_link) return;
      location.href = F.tap_link;
    });
    return root;
  }
  window.OrvFilm = { mount: mount };
})();
