/* ORVISH storefront – static site driven by /data/*.json (editable from /admin) */
(function () {
  'use strict';
  var S = {}, P = [], PAGES = [], cart = [], discount = null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return (S.currency_symbol || '₹') + Number(n).toLocaleString('en-IN', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  var qs = new URLSearchParams(location.search);
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var ICONS = {
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    truck: '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    bag: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
    whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.2-6 8-6s7 1.5 8 6"/>', filter: '<path d="M4 6h16M7 12h10M10 18h4"/>', down: '<path d="M6 9l6 6 6-6"/>', left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>'
  };
  var ico = function (n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || ICONS.star) + '</svg>'; };
  var fetchJSON = function (u) { return fetch(u + '?v=' + Date.now()).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); };

  function applyTheme() {
    var T = S.theme || {}, r = document.documentElement.style;
    if (T.bg) r.setProperty('--bg', T.bg); if (T.ink) r.setProperty('--ink', T.ink);
    if (T.primary) r.setProperty('--maroon', T.primary); if (T.accent) r.setProperty('--gold', T.accent);
    if (T.button_radius != null) r.setProperty('--r-btn', T.button_radius + 'px');
    var single = ['Acme', 'Bebas Neue', 'DM Serif Display'], load = [];
    [['--font-heading', T.heading_font], ['--font-sub', T.subheading_font], ['--font-body', T.body_font]].forEach(function (x) {
      if (!x[1]) return; r.setProperty(x[0], "'" + x[1] + "'," + (x[1] === 'Georgia' ? 'serif' : 'Georgia,serif'));
      if (['Georgia', 'Acme', 'Andada Pro', 'Inter'].indexOf(x[1]) < 0 && load.indexOf(x[1]) < 0) load.push(x[1]);
    });
    if (load.length) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?' + load.map(function (f) { return 'family=' + f.replace(/ /g, '+') + (single.indexOf(f) > -1 ? '' : ':wght@400;500;600;700'); }).join('&') + '&display=swap'; document.head.appendChild(l); }
    r.setProperty('--logo-h', (S.logo_height || 38) + 'px');
    if (S.favicon) { var f = document.createElement('link'); f.rel = 'icon'; f.href = S.favicon; document.head.appendChild(f); }
  }
  function logoHTML() { return S.logo ? '<img class="logo-img" src="' + esc(S.logo) + '" alt="' + esc(S.store_name) + '">' : esc(S.store_name || 'ORVISH'); }
  function waLink(txt) { var n = String(S.whatsapp_number || '').replace(/\D/g, ''); return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(txt || 'Hi, I need help with an order') : ''; }

  /* markdown (small subset) */
  function md(src) {
    var out = [], list = false;
    String(src || '').split(/\n/).forEach(function (l) {
      var t = esc(l).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, a, u) { return /^(https?:|mailto:|tel:|\/|page|shop|index)/.test(u) ? '<a href="' + u + '">' + a + '</a>' : m; })
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
      var h = t.match(/^(#{1,4})\s+(.*)/);
      if (/^\s*[-*]\s+/.test(l)) { if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + t.replace(/^\s*[-*]\s+/, '') + '</li>'); return; }
      if (list) { out.push('</ul>'); list = false; }
      if (h) out.push('<h' + (h[1].length + 1) + '>' + h[2] + '</h' + (h[1].length + 1) + '>');
      else if (t.trim()) out.push('<p>' + t + '</p>');
    });
    if (list) out.push('</ul>');
    return out.join('\n');
  }

  /* Meta (Facebook/Instagram) Pixel – active when a Pixel ID is set in admin */
  function fbq_() { if (window.fbq) window.fbq.apply(null, arguments); }
  function metaInit() {
    var id = S.meta_pixel_id && String(S.meta_pixel_id).replace(/\D/g, ''); if (!id || window.fbq) return;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id); window.fbq('track', 'PageView');
  }
  /* customer accounts (Firebase Auth + Firestore, free plan) */
  var FB = null, USER = null, fbWait = [];
  function loadJS(u) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function fbReady() {
    var c = S.firebase_config; if (!c || !c.apiKey) return Promise.resolve(null);
    if (FB) return Promise.resolve(FB);
    var b = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-';
    return loadJS(b + 'app-compat.js').then(function () { return loadJS(b + 'auth-compat.js'); }).then(function () { return loadJS(b + 'firestore-compat.js'); }).then(function () {
      firebase.initializeApp(c); FB = { auth: firebase.auth(), db: firebase.firestore() };
      return new Promise(function (ok) { FB.auth.onAuthStateChanged(function (u) { USER = u; ok(FB); var a = $('#acct-dot'); if (a) a.style.display = u ? 'block' : 'none'; }); });
    }).catch(function () { return null; });
  }
  function payLogos() {
    var L = (S.payment_logos || []).filter(function (x) { return x && x.image; });
    if (L.length) return '<div class="paylogos img" aria-label="Accepted payments">' + L.map(function (x) { return '<span class="pl"><img src="' + esc(x.image) + '" alt="' + esc(x.name || 'Payment method') + '" loading="lazy"></span>'; }).join('') + '</div>';
    return '<div class="paylogos" aria-label="Accepted payments"><span class="pl">Cards</span><span class="pl">UPI</span><span class="pl">Net Banking</span><span class="pl">Cash on delivery</span></div>';
  }
  /* reviews (stored in the Google Sheet 'Reviews' tab; only rows marked Approved are shown) */
  var R = null;
  function starsHTML(v) { return '<span class="stars" aria-label="' + v.toFixed(1) + ' out of 5"><span style="width:' + Math.round(v / 5 * 100) + '%">★★★★★</span>★★★★★</span>'; }
  function rateOf(id) { var pp = P.filter(function (x) { return x.id === id; })[0], own = ((pp && pp.reviews) || []).filter(function (x) { return x && x.name && x.review && Number(x.rating); }); var l = own.concat((R || []).filter(function (x) { return x.product_id === id; })); if (!l.length) return null; return { n: l.length, avg: l.reduce(function (a, x) { return a + Number(x.rating || 0); }, 0) / l.length, list: l }; }
  function ratingHTML(id) { var x = rateOf(id); return x ? starsHTML(x.avg) + '<small>' + x.avg.toFixed(1) + ' (' + x.n + ')</small>' : ''; }
  function fillRatings() { $$('.rating[data-pid]').forEach(function (e) { e.innerHTML = ratingHTML(e.dataset.pid); }); }
  function loadReviews() {
    if (!S.order_webhook_url) return Promise.resolve([]);
    try { var c = JSON.parse(sessionStorage.getItem('orvish_reviews') || 'null'); if (c && Date.now() - c.t < 300000) { R = c.d; return Promise.resolve(R); } } catch (e) {}
    return fetch(S.order_webhook_url + '?action=reviews&_=' + Date.now()).then(function (x) { return x.json(); }).then(function (d) { R = (d && d.reviews) || []; try { sessionStorage.setItem('orvish_reviews', JSON.stringify({ t: Date.now(), d: R })); } catch (e) {} return R; }).catch(function () { R = []; return R; });
  }
  /* visit tracking for the admin traffic dashboard (page, rough location, source – no names, no IP addresses) */
  function geo() {
    var c = store.get('orvish_geo', null); if (c && Date.now() - c.t < 86400000) return Promise.resolve(c);
    var save = function (g) { g.t = Date.now(); store.set('orvish_geo', g); return g; };
    return fetch('https://ipapi.co/json/').then(function (x) { return x.json(); }).then(function (d) { if (!d || d.error) throw 0; return save({ c: d.country_name || '', r: d.region || '', city: d.city || '' }); })
      .catch(function () { return fetch('https://www.cloudflare.com/cdn-cgi/trace').then(function (x) { return x.text(); }).then(function (t) { var m = /loc=(\w+)/.exec(t); return save({ c: m ? m[1] : '', r: '', city: '' }); }).catch(function () { return { c: '', r: '', city: '' }; }); });
  }
  function track(ev, pid) {
    try {
      if (!(S.firebase_config && S.firebase_config.apiKey) || navigator.webdriver || store.get('orvish_notrack', false)) return;
      var sid = sessionStorage.getItem('orvish_sid'); if (!sid) { sid = Math.random().toString(36).slice(2, 12); sessionStorage.setItem('orvish_sid', sid); }
      var ref = ''; try { ref = document.referrer && new URL(document.referrer).hostname.replace(/^www\./, ''); if (ref === location.hostname.replace(/^www\./, '')) ref = ''; } catch (e) {}
      var src = (qs.get('utm_source') || (qs.get('fbclid') ? 'facebook' : '') || (qs.get('gclid') ? 'google-ads' : '') || sessionStorage.getItem('orvish_src') || '').slice(0, 40); if (src) sessionStorage.setItem('orvish_src', src);
      Promise.all([fbReady(), geo()]).then(function (a) {
        if (!a[0]) return; var g = a[1], n = new Date();
        a[0].db.collection('visits').add({ t: Date.now(), ev: ev, p: location.pathname.slice(0, 80), pid: String(pid || '').slice(0, 80), ref: String(ref || '').slice(0, 60), src: src, c: String(g.c || '').slice(0, 40), r: String(g.r || '').slice(0, 40), city: String(g.city || '').slice(0, 40), dev: window.innerWidth < 821 ? 'Mobile' : 'Desktop', sid: sid }).catch(function () {});
      });
    } catch (e) {}
  }
  /* cart (lines are {id, v: variant label, q}) */
  function saveCart() { store.set('orvish_cart', cart); renderCart(); }
  function findP(id) { return P.filter(function (p) { return p.id === id; })[0]; }
  function vs(p) { return (p.variants && p.variants.length) ? p.variants : null; }
  function vOf(p, label) { var v = vs(p); return v ? (v.filter(function (x) { return x.label === label; })[0] || v[0]) : null; }
  function bundlePct(p, q) { var b = 0; (p.bundles || []).forEach(function (x) { if (q >= Number(x.qty) && Number(x.percent) > b) b = Number(x.percent); }); return b; }
  function unit(l) { var p = findP(l.id), v = p && vOf(p, l.v), base = v && v.price != null ? Number(v.price) : p.price, bp = bundlePct(p, l.q || 1);
    return { p: p, label: v ? v.label : '', price: Math.round(base * (100 - bp)) / 100, base: base, bp: bp, old: v && v.compare_at_price ? Number(v.compare_at_price) : p.compare_at_price }; }
  function inStock(p, label) { if (p.in_stock === false) return false; var v = vs(p); if (!v) return true; if (label) { var x = vOf(p, label); return x.in_stock !== false; } return v.some(function (x) { return x.in_stock !== false; }); }
  function addToCart(id, q, label) {
    var p = findP(id); if (!p) return; var v = vs(p); if (v && !label) { var f = v.filter(function (x) { return x.in_stock !== false; })[0]; label = f && f.label; }
    if (!inStock(p, label)) return; label = label || '';
    var l = cart.filter(function (x) { return x.id === id && (x.v || '') === label; })[0];
    if (l) l.q += q || 1; else cart.push({ id: id, v: label, q: q || 1 });
    saveCart(); toast('Added to cart'); track('cart', id); fbq_('track', 'AddToCart', { content_ids: [id], content_name: p.title, content_type: 'product', value: unit({ id: id, v: label }).price * (q || 1), currency: 'INR' });
  }
  function totals() {
    var items = 0, sub = 0;
    cart.forEach(function (l) { if (findP(l.id)) { items += l.q; sub += unit(l).price * l.q; } });
    var off = 0;
    if (discount && items >= (discount.min_items || 1)) off = Math.round(sub * discount.percent) / 100;
    var after = sub - off, thr = S.free_shipping_above || 0;
    var ship = items === 0 ? 0 : (thr && after >= thr ? 0 : (S.shipping_fee || 0));
    return { items: items, sub: sub, off: off, ship: ship, total: after + ship };
  }
  var key = function (l) { return l.id + '|' + (l.v || ''); };
  function renderCart() {
    cart = cart.filter(function (l) { return findP(l.id); });
    var t = totals();
    $$('.cart-count').forEach(function (e) { e.textContent = t.items; e.style.display = t.items ? 'grid' : 'none'; });
    var body = $('#cart-body'), foot = $('#cart-foot'); if (!body) return;
    if (!cart.length) { body.innerHTML = '<div class="empty">Your cart is empty.<br><br><a class="btn" href="/shop">Continue shopping</a></div>'; foot.innerHTML = ''; return; }
    var thr = S.free_shipping_above || 0, left = thr - (t.sub - t.off);
    var bar = thr ? '<div class="ship-bar"><p>' + (left > 0 ? 'Add ' + money(left) + ' more for <b>free shipping</b>' : '🎉 You have <b>free shipping</b>') + '</p><i><b style="width:' + Math.min(100, Math.round((t.sub - t.off) / thr * 100)) + '%"></b></i></div>' : '';
    body.innerHTML = bar + cart.map(function (l) {
      var u = unit(l), k = esc(key(l));
      return '<div class="line"><img src="' + esc(u.p.images[0]) + '" alt=""><div><div class="t">' + esc(u.p.title) + '</div>' + (u.label ? '<div class="vl">' + esc(u.label) + '</div>' : '') + '<div class="price" style="padding:0">' + money(u.price) + '</div>' +
        '<div class="qty sm" style="margin-top:6px"><button data-dec="' + k + '">−</button><span>' + l.q + '</span><button data-inc="' + k + '">+</button></div>' +
        '<br><button class="rm" data-rm="' + k + '">Remove</button></div><div class="price">' + money(u.price * l.q) + '</div></div>';
    }).join('');
    foot.innerHTML = '<div class="disc"><input id="dc" placeholder="Discount code" value="' + esc(discount ? discount.code : '') + '"><button class="btn secondary" id="dc-apply" style="padding:9px 16px">Apply</button></div><div class="msg" id="dc-msg"></div>' +
      '<div class="row"><span>Subtotal</span><span>' + money(t.sub) + '</span></div>' +
      (t.off ? '<div class="row"><span>Discount (' + esc(discount.code) + ')</span><span>−' + money(t.off) + '</span></div>' : '') +
      '<div class="row"><span>Shipping</span><span>' + (t.ship ? money(t.ship) : 'Free') + '</span></div>' +
      '<div class="row total"><span>Total</span><span>' + money(t.total) + '</span></div>' +
      '<button class="btn block" id="checkout" style="margin-top:10px">Checkout · ' + money(t.total) + '</button>' + payLogos();
  }
  function openCart(o) { $('#cart').classList.toggle('open', o); $('#ov').classList.toggle('on', o); }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 1800); }

  /* checkout */
  function methods() { var m = []; if (S.razorpay_key_id) m.push(['online', 'Pay online (UPI / Cards / Netbanking)']); if (S.cod_enabled !== false) m.push(['cod', 'Cash on delivery']); if (!m.length) m.push(['cod', 'Pay on delivery / we will contact you']); return m; }
  function openCheckout() {
    var t = totals(); if (!t.items) return; track('checkout'); fbq_('track', 'InitiateCheckout', { value: t.total, currency: 'INR', num_items: t.items });
    var m = $('#checkout-modal'), ms = methods();
    var sum = cart.map(function (l) { var u = unit(l); return '<div class="sum-l"><img src="' + esc(u.p.images[0]) + '" alt=""><div><b>' + esc(u.p.title) + '</b>' + (u.label ? '<br><small>' + esc(u.label) + '</small>' : '') + '</div><span>×' + l.q + '</span><span>' + money(u.price * l.q) + '</span></div>'; }).join('');
    m.innerHTML = '<div class="box"><button class="icon-btn" style="position:absolute;right:8px;top:8px;color:var(--ink)" data-close-modal>' + ico('close') + '</button><h4>Checkout</h4>' +
      '<div class="sum">' + sum + '</div>' +
      (S.firebase_config && S.firebase_config.apiKey && !USER ? '<p class="msg" style="margin:0 0 8px">Have an account? <a class="link" href="/account?next=1">Log in</a> to save your orders.</p>' : '') + '<form id="co-form"><h6 class="co-h">Contact &amp; delivery</h6><div class="two"><div class="field"><label>Full name</label><input name="name" required autocomplete="name" value="' + esc(USER ? USER.displayName || '' : '') + '"></div><div class="field"><label>Phone</label><input name="phone" type="tel" required pattern="[0-9+ ]{10,15}" autocomplete="tel" value="' + esc(USER && USER.phoneNumber ? USER.phoneNumber : '') + '"></div></div>' +
      '<div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" value="' + esc(USER ? USER.email || '' : '') + '"></div>' +
      '<div class="field"><label>Address</label><textarea name="address" rows="2" required autocomplete="street-address"></textarea></div>' +
      '<div class="two"><div class="field"><label>City</label><input name="city" required></div><div class="field"><label>PIN code</label><input name="pin" required pattern="[0-9]{6}" inputmode="numeric"></div></div>' +
      '<h6 class="co-h">Payment</h6><div class="pay">' + ms.map(function (x, i) { return '<label><input type="radio" name="pm" value="' + x[0] + '"' + (i ? '' : ' checked') + '> ' + x[1] + '</label>'; }).join('') + '</div>' +
      '<div class="row"><span>Subtotal</span><span>' + money(t.sub) + '</span></div>' + (t.off ? '<div class="row"><span>Discount</span><span>−' + money(t.off) + '</span></div>' : '') + '<div class="row"><span>Shipping</span><span>' + (t.ship ? money(t.ship) : 'Free') + '</span></div>' +
      '<div class="row total"><span>Total</span><span>' + money(t.total) + '</span></div>' +
      '<div class="msg err" id="co-msg"></div><button class="btn block" type="submit" style="margin-top:10px">' + (ms[0][0] === 'online' ? 'Continue to payment · ' : 'Place order · ') + money(t.total) + '</button></form></div>';
    m.classList.add('open'); $('#ov').classList.add('on');
    $('#co-form').addEventListener('submit', function (e) { e.preventDefault(); var f = Object.fromEntries(new FormData(e.target)); if (f.pm === 'online') {
        if (S.firebase_config && S.firebase_config.apiKey && !USER) { $('#co-msg').innerHTML = 'Please <a class="link" href="/account?next=1">log in or create an account</a> to pay online. Your cart is saved.'; return; }
        payRazorpay(f, t);
      } else emailOrder(f, t); });
  }
  function orderLines() { return cart.map(function (l) { var u = unit(l); return l.q + ' x ' + u.p.title + (u.label ? ' ' + u.label : '') + ' (' + money(u.price) + ')'; }); }
  function sendOrder(f, t, status, payId, extra) {
    var url = S.order_webhook_url; if (!url) return null;
    var id = 'ORV-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var body = new URLSearchParams({ date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }), order_id: id, name: f.name, phone: f.phone, email: f.email || '', address: f.address, city: f.city, pin: f.pin, items: orderLines().join('; '), total: String(t.total), payment_status: status, order_status: 'New', payment_id: payId || '', rzp_order_id: (extra && extra.o) || '', rzp_signature: (extra && extra.s) || '' });
    try { fetch(url, { method: 'POST', mode: 'no-cors', body: body }).catch(function () {}); } catch (e) {}
    var o = store.get('orvish_orders', []); o.unshift({ id: id, phone: String(f.phone).replace(/\D/g, '').slice(-10), total: t.total, date: Date.now() }); store.set('orvish_orders', o.slice(0, 20));
    if (FB && USER) { try { FB.db.collection('orders').doc(id).set({ uid: USER.uid, order_id: id, phone: String(f.phone).replace(/\D/g, '').slice(-10), items: orderLines().join('; '), total: t.total, created: Date.now() }).catch(function () {}); } catch (e) {} }
    return id;
  }
  function emailOrder(f, t) {
    var oid = sendOrder(f, t, 'COD');
    if (oid) { done('Thank you! Your order ' + oid + ' has been received. We will contact you on ' + f.phone + ' to confirm it.', oid, t.total); return; }
    var wa = waLink('Hi, I want to place an order: ' + orderLines().join(', ') + ' Total ' + money(t.total));
    $('#checkout-modal').innerHTML = '<div class="box"><h4>Ordering is unavailable</h4><p>Sorry, we could not place your order online right now.' + (wa ? ' Please order on WhatsApp instead.' : ' Please try again later.') + '</p>' + (wa ? '<a class="btn" href="' + wa + '" target="_blank" rel="noopener">Order on WhatsApp</a>' : '') + '</div>';
  }
  function payRazorpay(f, t) {
    var btn = $('#co-form button[type=submit]'); if (btn) { btn.disabled = true; btn.textContent = 'Opening payment…'; }
    var open = function (rzOrder) {
      var go = function () {
        var o = {
          key: S.razorpay_key_id, amount: Math.round(t.total * 100), currency: 'INR', name: S.store_name || 'ORVISH', description: orderLines().join(', ').slice(0, 250),
          prefill: { name: f.name, email: f.email, contact: f.phone },
          notes: { items: orderLines().join(' | ').slice(0, 250), address: (f.address + ', ' + f.city + ' - ' + f.pin).slice(0, 250), phone: f.phone },
          theme: { color: '#761941' },
          modal: { ondismiss: function () { if (btn) { btn.disabled = false; btn.textContent = 'Continue to payment · ' + money(t.total); } } },
          handler: function (r) { var oid = sendOrder(f, t, 'Paid', r.razorpay_payment_id, { o: r.razorpay_order_id || '', s: r.razorpay_signature || '' }); done('Payment successful! Payment ID: ' + r.razorpay_payment_id + '.' + (oid ? ' Your order ID is ' + oid + '.' : ''), oid, t.total); }
        };
        if (rzOrder) o.order_id = rzOrder;
        new window.Razorpay(o).open();
      };
      if (window.Razorpay) return go();
      var s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = go; s.onerror = function () { toast('Could not load payment. Try again.'); }; document.head.appendChild(s);
    };
    if (!S.order_webhook_url) return open('');
    fetch(S.order_webhook_url + '?action=rzp_order&amount=' + Math.round(t.total * 100) + '&_=' + Date.now()).then(function (x) { return x.json(); }).then(function (d) { open(d && d.id ? d.id : ''); }).catch(function () { open(''); });
  }
  function done(msg, oid, tot) {
    if (tot != null) { fbq_('track', 'Purchase', { value: tot, currency: 'INR' }); track('order'); }
    cart = []; discount = null; saveCart(); openCart(false);
    $('#checkout-modal').innerHTML = '<div class="box" style="text-align:center"><h4>Thank you</h4><p>' + esc(msg) + '</p>' + (oid ? '<a class="btn secondary" href="/track?id=' + encodeURIComponent(oid) + '">Track my order</a> ' : '') + '<a class="btn" href="/">Back to home</a></div>';
  }

  /* shell */
  function navHTML() {
    return (S.menu || []).map(function (m) {
      var c = m.children || [];
      return '<div class="ni' + (c.length ? ' has' : '') + '"><a href="' + esc(m.url) + '">' + esc(m.label) + (c.length ? ico('down') : '') + '</a>' +
        (c.length ? '<div class="dd">' + c.map(function (x) { return '<a href="' + esc(x.url) + '">' + esc(x.label) + '</a>'; }).join('') + '</div>' : '') + '</div>';
    }).join('');
  }
  function mobileNavHTML() {
    return (S.menu || []).map(function (m) {
      var c = m.children || [];
      return c.length ? '<details><summary>' + esc(m.label) + '</summary>' + c.map(function (x) { return '<a href="' + esc(x.url) + '">' + esc(x.label) + '</a>'; }).join('') + '</details>' : '<a class="top" href="' + esc(m.url) + '">' + esc(m.label) + '</a>';
    }).join('') + '<a class="top" href="/account">My account</a><a class="top" href="/track">Track your order</a>';
  }
  function shell() {
    var anns = (S.announcements || []).filter(function (x) { return x && String(x).trim(); }); if (!anns.length) $('#announce').style.display = 'none';
    $('#announce').innerHTML = anns.map(function (a, i) { return '<span class="' + (i ? '' : 'on') + '">' + esc(a) + '</span>'; }).join('');
    var ai = 0, sp = $$('#announce span'); if (sp.length > 1) setInterval(function () { sp[ai].classList.remove('on'); ai = (ai + 1) % sp.length; sp[ai].classList.add('on'); }, 4000);
    $('#header').innerHTML = '<div class="wrap"><div style="display:flex;align-items:center;gap:20px"><button class="icon-btn burger" id="burger" aria-label="Menu">' + ico('menu') + '</button><nav class="nav">' + navHTML() + '</nav></div>' +
      '<a class="logo" href="/">' + logoHTML() + '</a><div class="actions"><button class="icon-btn" id="open-search" aria-label="Search">' + ico('search') + '</button><a class="icon-btn acct" href="/account" aria-label="My account">' + ico('user') + '<i id="acct-dot"></i></a><button class="icon-btn" id="open-cart" aria-label="Cart">' + ico('bag') + '<span class="cart-count"></span></button></div></div>';
    var li = function (a) { return (a || []).map(function (l) { return '<li><a href="' + esc(l.url) + '">' + esc(l.label) + '</a></li>'; }).join(''); };
    var cols = (S.footer_columns || []).map(function (c) { return '<div><h6>' + esc(c.title) + '</h6><ul>' + li(c.links) + '</ul></div>'; }).join('');
    $('#footer').innerHTML = '<div class="wrap"><div class="f-top"><div><div class="logo">' + logoHTML() + '</div><p style="font-size:13px;color:#555;margin:6px 0 0">' + esc(S.tagline || '') + '<br>Email : <a href="mailto:' + esc(S.support_email) + '">' + esc(S.support_email) + '</a></p></div>' +
      '<div class="nl"><h6><em>Get In Touch</em></h6><p style="font-size:13px;margin:0">' + esc(S.footer_newsletter_text) + '</p><form class="news" id="news"><input type="email" placeholder="Email" required><button class="btn" type="submit">Sign up</button></form></div></div>' +
      '<div class="f-grid">' + cols + '</div>' + payLogos() + '<div class="copy">© ' + new Date().getFullYear() + ' ' + esc(S.store_name) + '. All rights reserved.</div></div>';
    document.body.insertAdjacentHTML('beforeend',
      '<div class="mobile-nav" id="mnav">' + mobileNavHTML() + '</div><div class="overlay" id="ov"></div>' +
      '<aside class="drawer" id="cart"><div class="d-head"><h4>Cart</h4><button class="icon-btn" style="color:var(--ink)" id="close-cart">' + ico('close') + '</button></div><div class="d-body" id="cart-body"></div><div class="d-foot" id="cart-foot"></div></aside>' +
      '<div class="modal" id="checkout-modal"></div><div class="search-box" id="sb"><div class="in"><input id="sq" placeholder="Search products" autocomplete="off"><button class="icon-btn" style="color:var(--ink)" id="close-search">' + ico('close') + '</button></div>' +
      ((S.trending || []).length ? '<div class="trend"><b>Trending searches</b>' + S.trending.map(function (x) { return '<a href="' + esc(x.url) + '">' + esc(x.label) + '</a>'; }).join('') + '</div>' : '') + '<div class="hits" id="hits"></div></div><div class="toast" id="toast"></div>' +
      '<nav class="bnav" id="bnav"><a href="/">' + ico('home') + 'Home</a><a href="/shop">' + ico('grid') + 'Shop</a><button id="b-search">' + ico('search') + 'Search</button><a href="/account">' + ico('user') + 'Account</a><button id="b-cart">' + ico('bag') + 'Cart<span class="cart-count"></span></button></nav>' +
      (waLink() ? '<a class="wa" href="' + waLink() + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><img src="/images/whatsapp.png" alt="WhatsApp"></a>' : ''));
    document.title = (document.title && document.title !== 'ORVISH' ? document.title + ' – ' : '') + (S.store_name || 'ORVISH');
    renderCart();
  }
  function closeAll() { openCart(false); $('#mnav').classList.remove('open'); $('#checkout-modal').classList.remove('open'); var f = $('#fpanel'); if (f) f.classList.remove('open'); $('#ov').classList.remove('on'); }
  function events() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('button,a,[data-close-modal]'); if (!t) return;
      var kk = function (k) { return cart.filter(function (l) { return key(l) === k; })[0]; };
      if (t.id === 'open-cart' || t.id === 'b-cart') openCart(true);
      else if (t.id === 'close-cart') openCart(false);
      else if (t.id === 'burger') { $('#mnav').classList.add('open'); $('#ov').classList.add('on'); }
      else if (t.id === 'open-search' || t.id === 'b-search') { $('#sb').classList.add('open'); $('#sq').focus(); }
      else if (t.id === 'close-search') $('#sb').classList.remove('open');
      else if (t.hasAttribute('data-close-modal')) closeAll();
      else if (t.dataset.inc) { kk(t.dataset.inc).q++; saveCart(); }
      else if (t.dataset.dec) { var l = kk(t.dataset.dec); l.q = Math.max(1, l.q - 1); saveCart(); }
      else if (t.dataset.rm) { cart = cart.filter(function (l) { return key(l) !== t.dataset.rm; }); saveCart(); }
      else if (t.dataset.add) { e.preventDefault(); e.stopPropagation(); addToCart(t.dataset.add, 1); openCart(true); }
      else if (t.id === 'dc-apply') {
        var c = ($('#dc').value || '').trim().toUpperCase(), f = (S.discount_codes || []).filter(function (d) { return d.code.toUpperCase() === c; })[0], tt = totals();
        if (!c) { discount = null; saveCart(); return; }
        if (!f) { $('#dc-msg').textContent = 'Invalid code'; return; }
        if (tt.items < (f.min_items || 1)) { $('#dc-msg').textContent = 'Add at least ' + f.min_items + ' items to use this code'; return; }
        discount = f; saveCart(); toast('Code applied');
      } else if (t.id === 'checkout') openCheckout();
    });
    $('#ov').addEventListener('click', closeAll);
    var hd = $('#header'), sc = function () { hd.classList.toggle('scrolled', window.scrollY > 30); }; window.addEventListener('scroll', sc, { passive: true }); sc();
    $('#news').addEventListener('submit', function (e) { e.preventDefault(); location.href = 'mailto:' + S.support_email + '?subject=Subscribe&body=Please add ' + encodeURIComponent(e.target.querySelector('input').value) + ' to your mailing list.'; });
    $('#sq').addEventListener('input', function (e) {
      var q = e.target.value.toLowerCase().trim();
      $('#hits').innerHTML = !q ? '' : P.filter(function (p) { return (p.title + ' ' + (p.short_description || '') + ' ' + (p.notes || []).join(' ')).toLowerCase().indexOf(q) > -1; }).slice(0, 8).map(function (p) {
        return '<a class="hit" href="/product?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(p.images[0]) + '" alt=""><div><div style="font-family:var(--font-sub)">' + esc(p.title) + '</div><div class="price" style="padding:0">' + money(p.price) + '</div></div></a>';
      }).join('') || '<p class="empty">No results</p>';
    });
    $('#sq').addEventListener('keydown', function (e) { if (e.key === 'Enter') location.href = '/shop?q=' + encodeURIComponent(e.target.value); if (e.key === 'Escape') $('#sb').classList.remove('open'); });
  }

  function swipe(el, cb) {
    var x0 = null; if (!el) return;
    el.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function (e) { if (x0 == null) return; var d = x0 - e.changedTouches[0].clientX; if (Math.abs(d) > 40) cb(d); x0 = null; });
  }
  /* views */
  function pct(p) { return p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0; }
  function cardHTML(p) {
    var sale = pct(p), so = !inStock(p), href = '/product?id=' + encodeURIComponent(p.id), multi = vs(p);
    return '<div class="card"><a class="img" href="' + href + '">' + (so ? '<span class="badge so">Sold out</span>' : sale ? '<span class="badge">' + sale + '% off</span>' : (p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : '')) +
      '<img loading="lazy" src="' + esc(p.images[0]) + '" alt="' + esc(p.title) + '">' + (p.images[1] ? '<img class="alt" loading="lazy" src="' + esc(p.images[1]) + '" alt="">' : '') + '</a>' +
      '<div class="meta">' + ((p.notes || []).length ? '<div class="tags">' + p.notes.slice(0, 3).map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' : '') +
      (p.brand ? '<div class="brand">' + esc(p.brand) + '</div>' : '') + '<h5><a href="' + href + '">' + esc(p.title) + '</a></h5><div class="rating" data-pid="' + esc(p.id) + '">' + ratingHTML(p.id) + '</div><div class="price">' + (multi ? '<small>From </small>' : '') + money(p.price) + (sale ? '<s>' + money(p.compare_at_price) + '</s>' : '') + '</div>' +
      (so ? '<button class="btn block" disabled>Sold out</button>' : multi ? '<a class="btn block" href="' + href + '">Choose options</a>' : '<button class="btn block" data-add="' + esc(p.id) + '">Add to cart</button>') + '</div></div>';
  }
  function row(title, list, link) {
    if (!list.length) return '';
    return '<section class="section"><div class="wrap"><div class="sec-head"><h3>' + esc(title) + '</h3>' + (link ? '<a class="link" href="' + esc(link) + '">View all</a>' : '') + '</div><div class="rail">' + list.map(cardHTML).join('') + '</div></div></section>';
  }
  function home() {
    var sl = S.slides || []; if (!sl.length) $('#slider').style.display = 'none';
    $('#slider').innerHTML = sl.map(function (s, i) {
      return '<div class="slide' + (i ? '' : ' active') + '"><img src="' + esc(s.image) + '" alt="' + esc(s.caption) + '"><div class="cap">' + (s.caption ? '<p>' + esc(s.caption) + '</p>' : '') + (s.button_label ? '<a class="btn" href="' + esc(s.button_link || '/shop') + '">' + esc(s.button_label) + '</a>' : '') + '</div></div>';
    }).join('') + (sl.length > 1 ? '<button class="s-arrow s-prev" aria-label="Previous">' + ico('left') + '</button><button class="s-arrow s-next" aria-label="Next">' + ico('right') + '</button><div class="dots">' + sl.map(function (_, i) { return '<button class="' + (i ? '' : 'on') + '" aria-label="Slide ' + (i + 1) + '"></button>'; }).join('') + '</div>' : '');
    swipe($('#slider'), function (d) { d > 0 ? $('.s-next') && $('.s-next').click() : $('.s-prev') && $('.s-prev').click(); });
    var cur = 0, slides = $$('.slide', $('#slider')), dots = $$('.dots button'), timer;
    function go(n) {
      if (slides.length < 2) return; n = (n + slides.length) % slides.length;
      slides.forEach(function (s) { s.classList.remove('prev'); }); slides[cur].classList.remove('active'); slides[cur].classList.add('prev');
      slides[n].classList.add('active'); dots.forEach(function (d, i) { d.classList.toggle('on', i === n); }); var old = cur; cur = n;
      setTimeout(function () { if (cur !== old) slides[old].classList.remove('prev'); }, 700);
    }
    function auto() { clearInterval(timer); timer = setInterval(function () { go(cur + 1); }, 6000); }
    if (slides.length > 1) { $('.s-prev').onclick = function () { go(cur - 1); auto(); }; $('.s-next').onclick = function () { go(cur + 1); auto(); }; dots.forEach(function (d, i) { d.onclick = function () { go(i); auto(); }; }); auto(); }
    if (!(S.ticker || []).length) $('#ticker').style.display = 'none';
    var items = (S.ticker || []).map(function (t) { return '<div class="t-item">' + ico(t.icon) + esc(t.text) + '</div>'; }).join('');
    $('#ticker').innerHTML = '<div class="track">' + items + items + items + items + '</div>';
    var pick = function (ids) { return (ids || []).map(findP).filter(Boolean); };
    var h = '', best = (S.best_pick || []).length ? pick(S.best_pick) : P.filter(function (p) { return p.best_seller; }), tabs = (S.home_tabs || []).filter(function (t) { return P.some(function (p) { return p.collection === t.collection; }); });
    var bl = best.length ? best : P;
    h += '<section class="section"><div class="wrap"><div class="sec-head"><h3>' + esc(S.best_sellers_title || 'Best Sellers') + '</h3><a class="link" href="/shop?best=1">View all</a></div>' +
      (tabs.length ? '<div class="tabs" id="tabs"><button class="on" data-c="">All</button>' + tabs.map(function (t) { return '<button data-c="' + esc(t.collection) + '">' + esc(t.label) + '</button>'; }).join('') + '</div>' : '') + '<div class="rail" id="best-rail">' + bl.map(cardHTML).join('') + '</div></div></section>';
    var ct = (S.collection_tiles || []);
    if (ct.length) h += '<section class="section" style="padding-top:8px"><div class="wrap"><div class="tiles">' + ct.map(function (c) { return '<a class="tile" href="' + esc(c.url) + '"><img loading="lazy" src="' + esc(c.image) + '" alt=""><div><h4>' + esc(c.title) + '</h4><p>' + esc(c.text || '') + '</p><span class="btn">' + esc(c.button || 'View products') + '</span></div></a>'; }).join('') + '</div></div></section>';
    h += row(S.men_title || 'For Him', (S.him_pick || []).length ? pick(S.him_pick) : P.filter(function (p) { return p.gender === 'men'; }), '/shop?gender=men') + row(S.women_title || 'For Her', (S.her_pick || []).length ? pick(S.her_pick) : P.filter(function (p) { return p.gender === 'women'; }), '/shop?gender=women');
    (S.custom_rows || []).forEach(function (cr) { h += row(cr.title, pick(cr.products)); });
    var rest = P.filter(function (p) { return p.featured !== false; }).slice(0, S.products_on_home || 8);
    if (!P.some(function (p) { return p.gender === 'men' || p.gender === 'women'; })) h += '<section class="section"><div class="wrap"><div class="sec-head"><h3>' + esc(S.home_heading || 'Our products') + '</h3><a class="link" href="/shop">View all</a></div><div class="grid">' + rest.map(cardHTML).join('') + '</div></div></section>';
    var nset = {}; P.forEach(function (p) { (p.notes || []).forEach(function (n) { nset[n] = (nset[n] || 0) + 1; }); });
    var nl = Object.keys(nset).sort(function (a, b) { return nset[b] - nset[a]; }).slice(0, 10);
    if (nl.length) h += '<section class="section scent"><div class="wrap"><div class="sec-head"><h3>Find your scent</h3><p class="sub" style="margin:0">Tap a note you love</p></div><div class="chips">' + nl.map(function (n) { return '<a href="/shop?note=' + encodeURIComponent(n) + '">' + esc(n) + '</a>'; }).join('') + '</div></div></section>';
    var mq = String(S.marquee_text || '').trim();
    if (mq) { var one = '<span>' + esc(mq) + '</span><i>✦</i>'; h += '<div class="bigmq" aria-hidden="true"><div class="track">' + one + one + one + one + '</div></div>'; }
    var sv = S.services || [];
    if (sv.length) h += '<section class="services"><div class="wrap">' + sv.map(function (s) { return '<div>' + ico(s.icon) + '<b>' + esc(s.title) + '</b><span>' + esc(s.text) + '</span></div>'; }).join('') + '</div></section>';
    if (S.home_text) h += '<section class="section"><div class="wrap seo"><h3>' + esc(S.home_text_title || '') + '</h3>' + md(S.home_text) + '</div></section>';
    var bb = S.bottom_banner;
    if (bb && (bb.image || bb.title)) h += '<section class="bigbanner"' + (bb.image ? ' style="background-image:url(\'' + esc(bb.image) + '\')"' : '') + '><div class="bb-in">' + (bb.title ? '<h2>' + esc(bb.title) + '</h2>' : '') + (bb.text ? '<p>' + esc(bb.text) + '</p>' : '') + (bb.button_label ? '<a class="btn" href="' + esc(bb.button_link || '/shop') + '">' + esc(bb.button_label) + '</a>' : '') + '</div></section>';
    $('#home-main').innerHTML = h;
    var tb = $('#tabs'); if (tb) tb.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('#tabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); var c = b.dataset.c; $('#best-rail').innerHTML = (bl.filter(function (p) { return !c || p.collection === c; })).map(cardHTML).join('') || '<p class="empty">No products here yet.</p>'; });
  }
  function shop() {
    var f = { q: qs.get('q') || '', c: qs.get('c') || '', gender: qs.get('gender') || '', type: qs.get('type') || '', note: qs.get('note') || '', best: qs.get('best') === '1', stock: false, min: '', max: '', sort: '' };
    var uniq = function (a) { return Array.from(new Set(a.filter(Boolean))); };
    var cols = uniq(P.map(function (p) { return p.collection; })).filter(function (x) { return x !== 'all'; }), types = uniq(P.map(function (p) { return p.type; })), notes = uniq([].concat.apply([], P.map(function (p) { return p.notes || []; })));
    var sel = function (id, lab, opts, val) { return '<label class="fl">' + lab + '<select id="' + id + '"><option value="">All</option>' + opts.map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (v === val ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></label>'; };
    var title = f.best ? (S.best_sellers_title || 'Best Sellers') : f.gender ? ({ men: 'For Him', women: 'For Her', unisex: 'Unisex' }[f.gender] || 'Shop') : f.note ? f.note : f.type ? f.type : f.c ? f.c : 'All products';
    $('#shop-title').textContent = title.charAt(0).toUpperCase() + title.slice(1);
    $('#toolbar').innerHTML = '<button class="btn secondary" id="open-f">' + ico('filter') + 'Filter</button><span class="cnt" id="cnt"></span><label class="sortl">Sort <select id="f-s"><option value="">Featured</option><option value="best">Best selling</option><option value="pa">Price: low to high</option><option value="pd">Price: high to low</option><option value="az">A–Z</option></select></label>';
    document.body.insertAdjacentHTML('beforeend', '<aside class="drawer left" id="fpanel"><div class="d-head"><h4>Filter</h4><button class="icon-btn" style="color:var(--ink)" id="close-f">' + ico('close') + '</button></div><div class="d-body">' +
      '<label class="fl chk"><input type="checkbox" id="f-stock"> In stock only</label><label class="fl">Search<input id="f-q" value="' + esc(f.q) + '" placeholder="Name or notes"></label>' +
      '<div class="two"><label class="fl">Min price<input id="f-min" type="number" min="0" placeholder="₹"></label><label class="fl">Max price<input id="f-max" type="number" min="0" placeholder="₹"></label></div>' +
      sel('f-g', 'Gender', [['men', 'For Him'], ['women', 'For Her'], ['unisex', 'Unisex']], f.gender) + (types.length ? sel('f-t', 'Type', types, f.type) : '') + (notes.length ? sel('f-n', 'Notes', notes, f.note) : '') + (cols.length ? sel('f-c', 'Collection', cols, f.c) : '') + '</div><div class="d-foot"><button class="btn block" id="f-apply">Show results</button><button class="btn secondary block" id="f-clear" style="margin-top:8px">Clear all</button></div></aside>');
    function read() { f.q = $('#f-q').value; f.stock = $('#f-stock').checked; f.min = $('#f-min').value; f.max = $('#f-max').value; f.gender = $('#f-g').value; f.type = $('#f-t') ? $('#f-t').value : ''; f.note = $('#f-n') ? $('#f-n').value : ''; f.c = $('#f-c') ? $('#f-c').value : ''; f.sort = $('#f-s').value; }
    function draw() {
      var qq = f.q.toLowerCase().trim();
      var l = P.filter(function (p) {
        return (!f.c || p.collection === f.c) && (!f.gender || p.gender === f.gender) && (!f.type || p.type === f.type) && (!f.note || (p.notes || []).indexOf(f.note) > -1) && (!f.best || p.best_seller) && (!f.stock || inStock(p)) &&
          (f.min === '' || p.price >= Number(f.min)) && (f.max === '' || p.price <= Number(f.max)) && (!qq || (p.title + ' ' + (p.short_description || '') + ' ' + (p.notes || []).join(' ')).toLowerCase().indexOf(qq) > -1);
      });
      if (f.sort === 'pa') l.sort(function (a, b) { return a.price - b.price; }); if (f.sort === 'pd') l.sort(function (a, b) { return b.price - a.price; }); if (f.sort === 'az') l.sort(function (a, b) { return a.title.localeCompare(b.title); });
      if (f.sort === 'best') l.sort(function (a, b) { return (b.best_seller ? 1 : 0) - (a.best_seller ? 1 : 0); });
      $('#cnt').textContent = l.length + (l.length === 1 ? ' product' : ' products');
      $('#shop-grid').innerHTML = l.length ? l.map(cardHTML).join('') : '<p class="empty" style="grid-column:1/-1">No products found.</p>';
    }
    var fp = $('#fpanel');
    $('#open-f').onclick = function () { fp.classList.add('open'); $('#ov').classList.add('on'); };
    $('#close-f').onclick = $('#f-apply').onclick = function () { read(); draw(); closeAll(); };
    $('#f-clear').onclick = function () { $$('#fpanel input').forEach(function (i) { i.type === 'checkbox' ? i.checked = false : i.value = ''; }); $$('#fpanel select').forEach(function (s) { s.value = ''; }); f.best = false; read(); draw(); closeAll(); };
    $('#f-s').onchange = function () { read(); draw(); };
    $('#f-q').addEventListener('input', function () { read(); draw(); });
    draw();
  }
  function noteBlock(p) {
    var n = p.note_pyramid; if (!n || !(n.top || n.heart || n.base)) return '';
    return '<div class="notes"><h4>Fragrance notes</h4><div>' + [['Top notes', n.top], ['Heart notes', n.heart], ['Base notes', n.base]].filter(function (x) { return x[1]; }).map(function (x) { return '<div><b>' + x[0] + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div></div>';
  }
  function product() {
    var p = findP(qs.get('id')), el = $('#pdp');
    if (!p) { el.innerHTML = '<p class="empty">Product not found. <a class="link" href="/shop">Back to shop</a></p>'; return; }
    document.title = p.title; fbq_('track', 'ViewContent', { content_ids: [p.id], content_name: p.title, content_type: 'product', value: p.price, currency: 'INR' }); var q = 1, v = vs(p), cur = v ? (v.filter(function (x) { return x.in_stock !== false; })[0] || v[0]).label : '';
    function info() { var u = unit({ id: p.id, v: cur, q: q }), s = u.old && u.old > u.price; return { u: u, s: s, so: !inStock(p, cur) }; }
    function priceHTML() { var i = info(); return money(i.u.price) + (i.s ? '<s>' + money(i.u.old) + '</s> <span class="badge" style="position:static;display:inline-block;margin-left:6px">' + Math.round((1 - i.u.price / i.u.old) * 100) + '% off</span>' : '') + '<small class="tax">' + (i.u.bp ? 'per bottle after ' + i.u.bp + '% bundle discount · ' : '') + 'Inclusive of all taxes</small>'; }
    var tags = [(p.type || ''), p.gender ? ({ men: 'For Him', women: 'For Her', unisex: 'Unisex' }[p.gender]) : ''].concat(p.notes || []).filter(Boolean);
    el.innerHTML = '<div class="gallery"><div class="main"><img id="mi" src="' + esc(p.images[0]) + '" alt="' + esc(p.title) + '"></div>' + (p.images.length > 1 ? '<div class="thumbs">' + p.images.map(function (im, i) { return '<img class="' + (i ? '' : 'on') + '" src="' + esc(im) + '" alt="">'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="info"><div class="tags big">' + tags.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' + (p.brand ? '<div class="brand">' + esc(p.brand) + '</div>' : '') + '<h1>' + esc(p.title) + '</h1><a class="rating big" href="#reviews" data-pid="' + esc(p.id) + '">' + ratingHTML(p.id) + '</a><div class="price" id="pp"></div>' +
      (v ? '<div class="vgrp"><b>Size</b><div id="vopts">' + v.map(function (x) { return '<button class="vopt' + (x.label === cur ? ' on' : '') + (x.in_stock === false ? ' off' : '') + '" data-v="' + esc(x.label) + '">' + esc(x.label) + '</button>'; }).join('') + '</div></div>' : '') +
      '<div id="buyarea"></div><div class="pay-note"><b>Secure checkout</b> – pay by card, UPI, net banking or cash on delivery</div>' + payLogos() + '<div class="badges">' + (S.product_badges || []).map(function (b) { return '<div>' + ico(b.icon) + '<span>' + esc(b.text) + '</span></div>'; }).join('') + '</div>' +
      '<div class="desc">' + md(p.description) + '</div>' + noteBlock(p) +
      (p.details || []).map(function (d) { return '<details class="acc"><summary>' + esc(d.title) + '</summary><div>' + md(d.body) + '</div></details>'; }).join('') + '</div>';
    function paint() {
      $('#pp').innerHTML = priceHTML(); var i = info();
      $('#buyarea').innerHTML = i.so ? '<p><strong>Sold out</strong></p>' : (p.bundles && p.bundles.length ? '<div class="bundles"><b>Bundle &amp; save</b>' + [{ qty: 1, percent: 0 }].concat(p.bundles).map(function (b) { return '<button class="bnd' + (q === Number(b.qty) ? ' on' : '') + '" data-q="' + b.qty + '"><span>Buy ' + b.qty + '</span>' + (Number(b.percent) ? '<em>Save ' + b.percent + '%</em>' : '<em>Single</em>') + '</button>'; }).join('') + '</div>' : '') + '<div class="qty" id="pq"><button data-d="-1">−</button><span>' + q + '</span><button data-d="1">+</button></div><div class="buy-row"><button class="btn secondary" id="add">Add to cart</button><button class="btn" id="buy">Buy it now</button></div>';
      if (i.so) return;
      $$('#pq button').forEach(function (b) { b.onclick = function () { q = Math.max(1, q + Number(b.dataset.d)); paint(); }; });
      $$('.bnd').forEach(function (b) { b.onclick = function () { q = Number(b.dataset.q); paint(); }; });
      $('#add').onclick = function () { addToCart(p.id, q, cur); openCart(true); };
      $('#buy').onclick = function () { addToCart(p.id, q, cur); openCheckout(); };
      var s = $('#s-add'); if (s) { $('#s-price').textContent = money(i.u.price); }
    }
    $$('#vopts button').forEach(function (b) { b.onclick = function () { if (b.classList.contains('off')) return; cur = b.dataset.v; $$('#vopts button').forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); }; });
    paint();
    if (p.images.length > 1) { var gi = 0; swipe($('.gallery .main'), function (d) { gi = (gi + (d > 0 ? 1 : -1) + p.images.length) % p.images.length; $('#mi').src = p.images[gi]; $$('.thumbs img').forEach(function (x, i) { x.classList.toggle('on', i === gi); }); }); }
    $$('.thumbs img').forEach(function (t) { t.onclick = function () { $('#mi').src = t.src; $$('.thumbs img').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); }; });
    var wl = waLink('Hi, I want to order: ' + p.title + ' ' + location.href);
    if (wl) $('#buyarea').insertAdjacentHTML('afterend', '<a class="btn secondary block" style="margin:6px 0 16px" target="_blank" rel="noopener" href="' + wl + '"><img class="wa-i" src="/images/whatsapp.png" alt="">Order on WhatsApp</a>');
    if (inStock(p)) { document.body.insertAdjacentHTML('beforeend', '<div class="sticky-buy"><div><div class="price" id="s-price" style="padding:0;font-size:16px">' + money(info().u.price) + '</div><div style="font:12px var(--font-accent);opacity:.7">' + esc(p.title) + '</div></div><button class="btn secondary" id="s-add">Add</button><button class="btn" id="s-buy">Buy now</button></div>');
      $('#s-add').onclick = function () { addToCart(p.id, q, cur); openCart(true); }; $('#s-buy').onclick = function () { addToCart(p.id, q, cur); openCheckout(); }; }
    function drawReviews() {
      var box = $('#reviews'); if (!box) return; var x = rateOf(p.id), mine = store.get('orvish_reviewed', []).indexOf(p.id) > -1;
      var bars = ''; if (x) { for (var st = 5; st >= 1; st--) { var c = x.list.filter(function (y) { return Math.round(Number(y.rating)) === st; }).length; bars += '<div class="rb"><span>' + st + ' ★</span><i><b style="width:' + Math.round(c / x.n * 100) + '%"></b></i><span>' + c + '</span></div>'; } }
      box.innerHTML = '<h3>Customer reviews</h3>' +
        (x ? '<div class="rsum"><div class="ravg"><b>' + x.avg.toFixed(1) + '</b>' + starsHTML(x.avg) + '<small>' + x.n + (x.n === 1 ? ' review' : ' reviews') + '</small></div><div class="rbars">' + bars + '</div></div>' : '<p class="sub" style="margin:0 0 14px">No reviews yet. Be the first to review this product.</p>') +
        (mine ? '<p class="msg">Thank you! Your review was sent and will appear here after we approve it.</p>' : '<details class="rform"><summary class="btn secondary">Write a review</summary><form id="rf"><div class="pick" id="pick">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" aria-label="' + n + ' stars">★</button>'; }).join('') + '<span id="pick-t">Tap to rate</span></div>' +
          '<div class="field"><label>Your name</label><input name="name" required maxlength="40"></div><div class="field"><label>Your review</label><textarea name="review" rows="3" required maxlength="800"></textarea></div>' +
          '<div class="field"><label>Order ID (optional – shows a “Verified buyer” tag)</label><input name="order_id" maxlength="30" placeholder="ORV-..."></div><input name="website" class="hp" tabindex="-1" autocomplete="off">' +
          '<div class="msg err" id="rmsg"></div><button class="btn" type="submit">Submit review</button></form></details>') +
        (x ? '<div class="rlist">' + x.list.slice().reverse().map(function (y) { return '<div class="rev"><div class="rh">' + starsHTML(Number(y.rating)) + '<b>' + esc(y.name) + '</b>' + (y.verified ? '<em>Verified buyer</em>' : '') + '<small>' + esc(y.date || '') + '</small></div><p>' + esc(y.review) + '</p></div>'; }).join('') + '</div>' : '');
      var rate = 0, f = $('#rf'); if (!f) return;
      $$('#pick button').forEach(function (b) { b.onclick = function () { rate = Number(b.dataset.n); $$('#pick button').forEach(function (z) { z.classList.toggle('on', Number(z.dataset.n) <= rate); }); $('#pick-t').textContent = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rate]; }; });
      f.onsubmit = function (e) {
        e.preventDefault(); var d = Object.fromEntries(new FormData(f)); if (d.website) return;
        if (!rate) { $('#rmsg').textContent = 'Please tap the stars to give a rating.'; return; }
        if (!S.order_webhook_url) { $('#rmsg').textContent = 'Reviews are not available right now.'; return; }
        try { fetch(S.order_webhook_url, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'review', product_id: p.id, product: p.title, name: d.name, rating: String(rate), review: d.review, order_id: d.order_id || '', date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) }) }).catch(function () {}); } catch (er) {}
        var m = store.get('orvish_reviewed', []); m.push(p.id); store.set('orvish_reviewed', m); drawReviews();
      };
    }
    drawReviews(); loadReviews().then(function () { fillRatings(); drawReviews(); });
    var fq = S.faq || []; if (fq.length) $('#faq').innerHTML = '<h3>Frequently asked questions</h3>' + fq.map(function (d) { return '<details class="acc"><summary>' + esc(d.title) + '</summary><div>' + md(d.body) + '</div></details>'; }).join('');
    var rel = P.filter(function (x) { return x.id !== p.id; }).slice(0, 4);
    if (rel.length) $('#related').innerHTML = rel.map(cardHTML).join(''); else $('#related-wrap').style.display = 'none';
  }
  function page() {
    var pg = PAGES.filter(function (x) { return x.slug === qs.get('p'); })[0], el = $('#page-body');
    if (!pg) { el.innerHTML = '<h2>Page not found</h2>'; return; }
    document.title = pg.title; el.innerHTML = '<h1 style="font-size:40px">' + esc(pg.title) + '</h1>' + md(pg.body);
  }
  /* order tracking (looks the order up in the Google Sheet through the Apps Script web app) */
  function track() {
    var el = $('#track-body'), mine = store.get('orvish_orders', []);
    var steps = ['New', 'Confirmed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
    el.innerHTML = '<h1>Track your order</h1><p class="sub">Enter your order ID and the phone number you used when ordering.</p><form id="tf" class="tf"><div class="field"><label>Order ID</label><input name="id" required placeholder="ORV-261107-AB12" value="' + esc(qs.get('id') || '') + '"></div><div class="field"><label>Phone number</label><input name="phone" type="tel" required placeholder="10-digit mobile number" value="' + esc(mine[0] ? mine[0].phone : '') + '"></div><button class="btn block" type="submit">Track order</button></form><div id="tres"></div>' +
      (mine.length ? '<h3 style="margin-top:30px">Orders placed on this device</h3><div class="mine">' + mine.map(function (o) { return '<button data-id="' + esc(o.id) + '" data-ph="' + esc(o.phone) + '"><b>' + esc(o.id) + '</b><span>' + money(o.total) + ' · ' + new Date(o.date).toLocaleDateString('en-IN') + '</span></button>'; }).join('') + '</div>' : '');
    function look(id, phone) {
      var r = $('#tres'); if (!S.order_webhook_url) { r.innerHTML = '<p class="msg">Tracking is not available right now.</p>'; return; }
      r.innerHTML = '<p class="msg">Looking up your order…</p>';
      fetch(S.order_webhook_url + '?action=track&order_id=' + encodeURIComponent(id.trim()) + '&phone=' + encodeURIComponent(phone.replace(/\D/g, '')) + '&_=' + Date.now()).then(function (x) { return x.json(); }).then(function (d) {
        if (!d || !d.found) { r.innerHTML = '<p class="msg err">We could not find an order with these details. Please check the order ID and phone number, or <a class="link" href="' + (waLink('Hi, I need help with order ' + id) || '/page?p=contact') + '">contact us</a>.</p>'; return; }
        var st = String(d.order_status || 'New'), i = steps.map(function (s) { return s.toLowerCase(); }).indexOf(st.toLowerCase()), bad = /cancel|return|refund/i.test(st);
        r.innerHTML = '<div class="tcard"><div class="th"><div><small>Order</small><b>' + esc(d.order_id) + '</b></div><span class="pill' + (bad ? ' bad' : '') + '">' + esc(st) + '</span></div>' +
          (bad ? '' : '<ol class="steps">' + steps.map(function (s, k) { return '<li class="' + (k <= i ? 'on' : '') + '"><i></i><span>' + s + '</span></li>'; }).join('') + '</ol>') +
          '<div class="row"><span>Placed on</span><span>' + esc(d.date) + ' ' + esc(d.time || '') + '</span></div><div class="row"><span>Items</span><span style="text-align:right;max-width:65%">' + esc(d.items) + '</span></div><div class="row"><span>Total</span><span>' + money(d.total) + '</span></div><div class="row"><span>Payment</span><span>' + esc(d.payment_status) + '</span></div>' + (d.tracking ? '<div class="row"><span>Tracking</span><span>' + esc(d.tracking) + '</span></div>' : '') + '</div>';
      }).catch(function () { r.innerHTML = '<p class="msg err">Could not load the status right now. Please try again in a moment.</p>'; });
    }
    $('#tf').addEventListener('submit', function (e) { e.preventDefault(); var f = Object.fromEntries(new FormData(e.target)); look(f.id, f.phone); });
    $$('.mine button').forEach(function (b) { b.onclick = function () { $('#tf').elements.id.value = b.dataset.id; $('#tf').elements.phone.value = b.dataset.ph; look(b.dataset.id, b.dataset.ph); }; });
    if (qs.get('id') && mine[0]) look(qs.get('id'), mine[0].phone);
  }

  function account() {
    var el = $('#acct-body');
    if (!(S.firebase_config && S.firebase_config.apiKey)) { el.innerHTML = '<h1>My account</h1><p class="sub">Customer accounts are not switched on yet. You can still <a class="link" href="/track">track an order</a> with your order ID and phone number.</p>'; return; }
    el.innerHTML = '<p class="msg">Loading…</p>';
    fbReady().then(function (f) {
      if (!f) { el.innerHTML = '<p class="msg err">Could not load accounts. Please refresh.</p>'; return; }
      f.auth.onAuthStateChanged(function (u) { u ? dash(u) : loginForm(); });
    });
    function err(e) { var m = (e && e.code) || ''; return /wrong-password|invalid-credential|user-not-found/.test(m) ? 'Wrong email or password.' : /email-already/.test(m) ? 'An account with this email already exists. Please log in.' : /weak-password/.test(m) ? 'Password must be at least 6 characters.' : /popup/.test(m) ? 'Sign-in window was closed.' : /invalid-phone/.test(m) ? 'Please enter a valid mobile number with country code, e.g. +91 98765 43210.' : /invalid-verification-code|code-expired/.test(m) ? 'That code is wrong or expired. Please try again.' : /too-many-requests|quota/.test(m) ? 'Too many SMS codes requested. Please try again later or log in with email or Google.' : /operation-not-allowed|billing/.test(m) ? 'Phone login is not available right now. Please use email or Google.' : /unauthorized-domain/.test(m) ? 'This website address is not allowed yet in Firebase settings.' : (e && e.message) || 'Something went wrong.'; }
    function loginForm() {
      var mode = 'in';
      function paint() {
        el.innerHTML = '<h1>' + (mode === 'in' ? 'Log in' : 'Create account') + '</h1><form id="af">' + (mode === 'up' ? '<div class="field"><label>Full name</label><input name="name" required autocomplete="name"></div>' : '') +
          '<div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Password</label><input name="pw" type="password" required minlength="6" autocomplete="' + (mode === 'in' ? 'current-password' : 'new-password') + '"></div>' +
          '<button class="btn block" type="submit">' + (mode === 'in' ? 'Log in' : 'Create account') + '</button></form><div id="amsg" class="msg err"></div>' +
          (mode === 'in' ? '<p style="text-align:right;margin:6px 0"><button class="link lnk" id="forgot">Forgot password?</button></p>' : '') +
          '<div class="or"><span>or</span></div><button class="btn secondary block" id="gbtn">Continue with Google</button><button class="btn secondary block" id="pbtn" style="margin-top:8px">Continue with phone number</button>' +
          '<p style="text-align:center;margin-top:18px">' + (mode === 'in' ? 'New customer? <button class="link lnk" id="sw">Create an account</button>' : 'Already have an account? <button class="link lnk" id="sw">Log in</button>') + '</p>' +
          '<p style="text-align:center"><a class="link" href="/track">Track an order without an account</a></p>';
        $('#sw').onclick = function () { mode = mode === 'in' ? 'up' : 'in'; paint(); };
        $('#af').onsubmit = function (e) {
          e.preventDefault(); var d = Object.fromEntries(new FormData(e.target)), m = $('#amsg'); m.textContent = '';
          (mode === 'in' ? FB.auth.signInWithEmailAndPassword(d.email, d.pw) : FB.auth.createUserWithEmailAndPassword(d.email, d.pw).then(function (c) { return c.user.updateProfile({ displayName: d.name }); })).catch(function (x) { m.textContent = err(x); });
        };
        $('#gbtn').onclick = function () { FB.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function (x) { $('#amsg').textContent = err(x); }); };
        $('#pbtn').onclick = phoneForm;
        var fg = $('#forgot'); if (fg) fg.onclick = function () { var em = $('#af').elements.email.value; if (!em) { $('#amsg').textContent = 'Type your email above first.'; return; } FB.auth.sendPasswordResetEmail(em).then(function () { $('#amsg').className = 'msg'; $('#amsg').textContent = 'Password reset email sent. Check your inbox.'; }).catch(function (x) { $('#amsg').textContent = err(x); }); };
      }
      function phoneForm() {
        el.innerHTML = '<h1>Log in with phone</h1><p class="sub">We will send a 6-digit code by SMS.</p><form id="pf"><div class="field"><label>Mobile number</label><input name="phone" type="tel" required autocomplete="tel" placeholder="+91 98765 43210" value="+91 "></div><div id="recap"></div><button class="btn block" type="submit" id="psend">Send code</button></form><div id="amsg" class="msg err"></div><p style="text-align:center;margin-top:18px"><button class="link lnk" id="back">Back to other login options</button></p>';
        $('#back').onclick = paint;
        var rv = null;
        $('#pf').onsubmit = function (e) {
          e.preventDefault(); var m = $('#amsg'); m.textContent = ''; var raw = e.target.elements.phone.value.trim(), dg = raw.replace(/\D/g, '');
          var num = raw.charAt(0) === '+' ? '+' + dg : (dg.length === 10 ? '+91' + dg : '+' + dg);
          var btn = $('#psend'); btn.disabled = true; btn.textContent = 'Sending…';
          try { if (!rv) rv = new firebase.auth.RecaptchaVerifier('recap', { size: 'invisible' }); } catch (x) { m.textContent = err(x); btn.disabled = false; btn.textContent = 'Send code'; return; }
          FB.auth.signInWithPhoneNumber(num, rv).then(function (conf) {
            el.innerHTML = '<h1>Enter the code</h1><p class="sub">Sent to ' + esc(num) + '</p><form id="cf"><div class="field"><label>6-digit code</label><input name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" style="letter-spacing:.4em;font-size:20px;text-align:center"></div><button class="btn block" type="submit">Verify and log in</button></form><div id="amsg" class="msg err"></div><p style="text-align:center;margin-top:18px"><button class="link lnk" id="back">Use a different number</button></p>';
            $('#back').onclick = phoneForm;
            $('#cf').onsubmit = function (ev) { ev.preventDefault(); $('#amsg').textContent = ''; conf.confirm(ev.target.elements.code.value.trim()).catch(function (x) { $('#amsg').textContent = err(x); }); };
          }).catch(function (x) { m.textContent = err(x); btn.disabled = false; btn.textContent = 'Send code'; try { rv.clear(); } catch (z) {} rv = null; $('#recap').innerHTML = ''; });
        };
      }
      paint();
    }
    function dash(u) {
      el.innerHTML = '<div class="ah"><div><h1 style="margin:0">My account</h1><p class="sub" style="margin:0">' + esc([u.displayName, u.email, u.phoneNumber].filter(Boolean).join(' · ')) + '</p></div><button class="btn secondary" id="lo">Log out</button></div><h3 style="margin-top:24px">My orders</h3><div id="ol"><p class="msg">Loading orders…</p></div>';
      $('#lo').onclick = function () { f_out(); };
      function f_out() { FB.auth.signOut(); }
      FB.db.collection('orders').where('uid', '==', u.uid).get().then(function (q) {
        var o = q.docs.map(function (d) { return d.data(); }).sort(function (a, b) { return b.created - a.created; });
        if (!o.length) { $('#ol').innerHTML = '<p class="empty" style="padding:24px 0">No orders yet. <a class="link" href="/shop">Start shopping</a></p>'; return; }
        $('#ol').innerHTML = o.map(function (x) { return '<div class="tcard" style="margin-top:12px" data-id="' + esc(x.order_id) + '" data-ph="' + esc(x.phone) + '"><div class="th"><div><small>' + new Date(x.created).toLocaleDateString('en-IN') + '</small><b>' + esc(x.order_id) + '</b></div><span class="pill st">…</span></div><div class="row"><span>Items</span><span style="text-align:right;max-width:65%">' + esc(x.items) + '</span></div><div class="row"><span>Total</span><span>' + money(x.total) + '</span></div></div>'; }).join('');
        $$('#ol .tcard').forEach(function (c) {
          if (!S.order_webhook_url) return;
          fetch(S.order_webhook_url + '?action=track&order_id=' + encodeURIComponent(c.dataset.id) + '&phone=' + c.dataset.ph + '&_=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) { $('.st', c).textContent = d.found ? d.order_status : 'Received'; }).catch(function () { $('.st', c).textContent = 'Received'; });
        });
      }).catch(function () { $('#ol').innerHTML = '<p class="msg err">Could not load orders.</p>'; });
    }
  }

  /* boot */
  Promise.all([fetchJSON('/data/site.json'), fetchJSON('/data/products.json'), fetchJSON('/data/pages.json'), fetchJSON('/data/home.json'), fetchJSON('/data/nav.json'), fetchJSON('/data/commerce.json')]).then(function (r) {
    S = Object.assign({}, r[0], r[3], r[4], r[5]); P = (r[1].products || []).filter(function (p) { return !p.hidden; }).map(function (p) { p.images = (p.images && p.images.length) ? p.images : ['/images/perfume-1.svg']; return p; }); PAGES = r[2].pages || [];
    cart = store.get('orvish_cart', []).map(function (l) { return { id: l.id, v: l.v || '', q: l.q }; });
    applyTheme(); metaInit(); shell(); events();
    var pg = document.body.dataset.page; ({ home: home, shop: shop, product: product, page: page, track: track, account: account }[pg] || function () {})();
    document.body.classList.add('ready'); track('view', document.body.dataset.page === 'product' ? qs.get('id') : '');
    if (document.body.dataset.page !== 'product') loadReviews().then(fillRatings);
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .08 }); $$('main .section, .services, .tile, .faq, .bigmq').forEach(function (e) { e.classList.add('rv'); io.observe(e); }); }
    if (S.firebase_config && S.firebase_config.apiKey && document.body.dataset.page !== 'account') fbReady();
  }).catch(function (e) { document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Could not load store data. Please refresh. (' + esc(e.message) + ')</p>'; });
})();
