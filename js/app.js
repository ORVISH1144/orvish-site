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
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.500"/><path d="M3 10h18M7 15h4"/>',
    cash: '<rect x="3" y="6.500" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.500"/><path d="M6.500 9.500v5M17.500 9.500v5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.500C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    locate: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    ticket: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
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
  var FB = null, USER = null, PROFILE = null, fbWait = [];
  function loadJS(u) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  /* phone numbers: the country code is fixed and always shown; the customer types the 10-digit number */
  var CC = '+91';
  function last10(v) { return String(v || '').replace(/\D/g, '').slice(-10); }
  function fullPhone(v) { var d = last10(v); return d ? CC + d : ''; }
  function phoneField(v, req) { return '<div class="ccph"><span>' + CC + '</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="10-digit mobile number" pattern="[0-9]{10}" title="Enter your 10-digit mobile number"' + (req ? ' required' : '') + ' value="' + esc(last10(v)) + '"></div>'; }
  document.addEventListener('input', function (e) { var i = e.target; if (i && i.matches && i.matches('.ccph input')) { var d = i.value.replace(/\D/g, ''); d = d.length > 10 ? d.slice(-10) : d; if (d !== i.value) i.value = d; } });
  /* saved delivery details: kept on this device for everyone, and in the account (Firestore) when logged in */
  function saved(k) { var l = store.get('orvish_details', null) || {}; return (PROFILE && PROFILE[k]) || l[k] || ''; }
  function fillCheckout() {
    var fm = $('#co-form'); if (!fm) return;
    ['name', 'phone', 'email', 'address', 'city', 'pin'].forEach(function (k) { var i = fm.elements[k]; if (i && !i.value && saved(k)) i.value = k === 'phone' ? last10(saved(k)) : saved(k); });
  }
  function loadProfile() {
    if (!FB || !USER) { PROFILE = null; return Promise.resolve(null); }
    return FB.db.collection('customers').doc(USER.uid).get().then(function (d) { PROFILE = d.exists ? d.data() : null; fillCheckout(); return PROFILE; }).catch(function () { PROFILE = null; return null; });
  }
  function saveProfile(f) {
    var d = { name: f.name || '', phone: f.phone || '', email: f.email || '', address: f.address || '', city: f.city || '', pin: f.pin || '', loc: f.loc || '', updated: Date.now() };
    store.set('orvish_details', d);
    if (!FB || !USER) return Promise.resolve(false);
    PROFILE = Object.assign({}, PROFILE, d);
    try { return FB.db.collection('customers').doc(USER.uid).set(d, { merge: true }).then(function () { return true; }).catch(function () { return false; }); } catch (e) { return Promise.resolve(false); }
  }
  function fbReady() {
    var c = S.firebase_config; if (!c || !c.apiKey) return Promise.resolve(null);
    if (FB) return Promise.resolve(FB);
    var b = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-';
    return loadJS(b + 'app-compat.js').then(function () { return Promise.all([loadJS(b + 'auth-compat.js'), loadJS(b + 'firestore-compat.js')]); }).then(function () {
      firebase.initializeApp(c); FB = { auth: firebase.auth(), db: firebase.firestore() };
      return new Promise(function (ok) { FB.auth.onAuthStateChanged(function (u) { USER = u; var a = $('#acct-dot'); if (a) a.style.display = u ? 'block' : 'none'; (u ? loadProfile() : (PROFILE = null, Promise.resolve())).then(function () { ok(FB); }); }); });
    }).catch(function () { return null; });
  }
  /* ---------- delivery location: current location or a pin on the map (OpenStreetMap, no account needed) ---------- */
  function phoneNo() {
    var d = String(S.contact_phone || S.whatsapp_number || '').replace(/\D/g, ''); if (d.length < 8) return null;
    return { tel: '+' + d, text: d.length === 12 && d.slice(0, 2) === '91' ? '+91 ' + d.slice(2, 7) + ' ' + d.slice(7) : '+' + d };
  }
  function etaText() {
    var a = Number(S.delivery_days_min) || 3, b = Math.max(a, Number(S.delivery_days_max) || 6);
    var f = function (n) { return new Date(Date.now() + n * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); };
    return f(a) + ' – ' + f(b);
  }
  function couponText(d) { var n = Number(d.max_uses) || 0; return d.percent + '% off ' + (Number(d.min_items) > 1 ? 'when you buy ' + d.min_items + ' or more' : 'your order') + (Number(d.max_discount) > 0 ? ', up to ' + money(Number(d.max_discount)) : '') + (n === 1 ? ' · once per customer' : n === 2 ? ' · twice per customer' : n > 2 ? ' · ' + n + ' times per customer' : ''); }
  var onCoupon = null;   /* set by the product page so its coupon cards redraw */
  var pendingQty = 0;    /* quantity chosen on the product page that is not in the cart yet */
  /* coupons with a per-customer limit: uses are remembered on this device as well as checked against the order sheet */
  function usedUp(d) { var n = Number(d && d.max_uses) || 0; return n > 0 && (store.get('orvish_coupon_used', {})[d.code] || 0) >= n; }
  function timesText(n) { return n === 1 ? 'once' : n === 2 ? 'twice' : n + ' times'; }
  function pickedCoupon() { return discount ? discount.code : store.get('orvish_coupon', ''); }
  function applyCode(c, pending) {
    c = String(c || '').trim().toUpperCase(); var say = function (x) { var m = $('#dc-msg'); if (m && $('#cart').classList.contains('open')) m.textContent = x; else toast(x); };
    var f = (S.discount_codes || []).filter(function (d) { return d.code.toUpperCase() === c; })[0], tt = totals(), ok = false;
    if (!c) { discount = null; store.set('orvish_coupon', ''); saveCart(); }
    else if (!f) say('This code is not valid');
    else if (usedUp(f)) { discount = null; store.set('orvish_coupon', ''); saveCart(); say(f.code + ' can be used ' + timesText(Number(f.max_uses)) + ' per customer and you have already used it'); }
    else {
      store.set('orvish_coupon', f.code);   /* remembered, so it applies as soon as the cart qualifies */
      var min = f.min_items || 1, will = tt.items + (pending || 0);
      if (tt.items < min && will < min) { discount = null; saveCart(); say('Add ' + (min - will) + ' more to use ' + f.code); }
      else if (tt.items < min) { discount = null; saveCart(); toast(f.code + ' selected. It applies when you add to cart'); ok = true; }
      else { discount = f; if (!totals().off) { discount = null; saveCart(); say(f.code + ' cannot be used together with bundle prices'); } else { saveCart(); toast(f.code + ' applied'); ok = true; } }
    }
    if (onCoupon) onCoupon();
    return ok;
  }
  var LMAP = null;
  function leaflet() {
    if (window.L) return Promise.resolve();
    var c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(c);
    return loadJS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  }
  function placeOf(a) {
    a = a || {}; var city = a.city || a.town || a.village || a.municipality || a.county || a.state_district || '';
    var line = [[a.house_number, a.road].filter(Boolean).join(' '), a.neighbourhood, a.suburb || a.city_district, (a.village || a.town) && (a.village || a.town) !== city ? (a.village || a.town) : '', a.state].filter(Boolean);
    return { address: line.filter(function (x, i) { return line.indexOf(x) === i && x !== city; }).join(', '), city: city, pin: String(a.postcode || '').replace(/\D/g, '').slice(0, 6) };
  }
  /* opens the picker; cb gets { address, city, pin, loc:'lat,lng' }. auto = ask for the current location straight away */
  function pickLocation(cb, auto) {
    var m = $('#locm');
    if (!m) { document.body.insertAdjacentHTML('beforeend', '<div class="locm" id="locm" role="dialog" aria-label="Choose delivery location"><div class="locbox"><div class="lochead"><h4>Choose delivery location</h4><button class="icon-btn" id="loc-x" aria-label="Close" style="color:var(--ink)">' + ico('close') + '</button></div>' +
      '<div class="locbar"><input id="loc-q" placeholder="Search area, street or PIN code" autocomplete="off"><button class="btn secondary" id="loc-me" type="button">' + ico('locate') + 'Use my current location</button></div><div class="lochits" id="loc-hits"></div>' +
      '<div class="locmap"><div id="loc-map"></div><div class="locpin" aria-hidden="true">' + ico('pin') + '</div></div><p class="locaddr" id="loc-addr">Move the map so the pin sits on your delivery spot.</p><div class="msg err" id="loc-msg"></div><button class="btn block" id="loc-ok" type="button" disabled>Confirm location</button></div></div>'); m = $('#locm'); }
    var cur = null, tmr = null, seq = 0, addr = $('#loc-addr'), ok = $('#loc-ok'), msg = $('#loc-msg');
    var close = function () { m.classList.remove('open'); };
    $('#loc-x').onclick = close; m.onclick = function (e) { if (e.target === m) close(); };
    ok.disabled = true; msg.textContent = ''; $('#loc-hits').innerHTML = ''; $('#loc-q').value = ''; m.classList.add('open');
    var rev = function () {
      var c = LMAP.getCenter(), n = ++seq; addr.textContent = 'Finding the address…'; ok.disabled = true;
      fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=' + c.lat + '&lon=' + c.lng).then(function (x) { return x.json(); }).then(function (d) {
        if (n !== seq) return; cur = placeOf(d && d.address); cur.loc = c.lat.toFixed(6) + ',' + c.lng.toFixed(6);
        addr.innerHTML = cur.city || cur.address ? '<b>' + esc([cur.city, cur.pin].filter(Boolean).join(' ')) + '</b><br>' + esc(cur.address) : 'Pin placed. You can type the address at checkout.'; ok.disabled = false;
      }).catch(function () { if (n !== seq) return; cur = { address: '', city: '', pin: '', loc: c.lat.toFixed(6) + ',' + c.lng.toFixed(6) }; addr.textContent = 'Pin placed. You can type the address at checkout.'; ok.disabled = false; });
    };
    var me = function () {
      if (!navigator.geolocation) { msg.textContent = 'This browser cannot share its location. Search for your area or move the map instead.'; return; }
      var b = $('#loc-me'); b.disabled = true; msg.textContent = '';
      navigator.geolocation.getCurrentPosition(function (p) { b.disabled = false; LMAP.setView([p.coords.latitude, p.coords.longitude], 17); },
        function (e) { b.disabled = false; msg.textContent = e && e.code === 1 ? 'Location permission is off. Allow it in your browser, or search for your area and move the map.' : 'Could not find your location. Search for your area or move the map instead.'; }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    };
    $('#loc-me').onclick = me;
    $('#loc-q').oninput = function (e) {
      var q = e.target.value.trim(); clearTimeout(tmr); if (q.length < 3) { $('#loc-hits').innerHTML = ''; return; }
      tmr = setTimeout(function () {
        fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=' + encodeURIComponent(q)).then(function (x) { return x.json(); }).then(function (r) {
          $('#loc-hits').innerHTML = (r || []).map(function (h) { return '<button type="button" data-lat="' + esc(h.lat) + '" data-lon="' + esc(h.lon) + '">' + esc(h.display_name) + '</button>'; }).join('') || '<p class="msg">No place found. Try a nearby landmark or the PIN code.</p>';
          $$('#loc-hits button').forEach(function (b) { b.onclick = function () { LMAP.setView([Number(b.dataset.lat), Number(b.dataset.lon)], 16); $('#loc-hits').innerHTML = ''; }; });
        }).catch(function () {});
      }, 500);
    };
    ok.onclick = function () { if (!cur) return; close(); cb(cur); };
    leaflet().then(function () {
      var s = String(saved('loc') || '').split(','), has = s.length === 2 && !isNaN(Number(s[0]));
      if (!LMAP) {
        LMAP = L.map('loc-map', { zoomControl: true, attributionControl: true }).setView(has ? [Number(s[0]), Number(s[1])] : [20.5937, 78.9629], has ? 16 : 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(LMAP); LMAP.attributionControl.setPrefix(false);
        LMAP.on('moveend', function () { if (LMAP.getZoom() >= 13) LMAP._orvRev(); else { $('#loc-addr').textContent = 'Zoom in and move the map so the pin sits on your delivery spot.'; $('#loc-ok').disabled = true; } });
      }
      LMAP._orvRev = rev; setTimeout(function () { LMAP.invalidateSize(); if (auto) me(); else if (has) rev(); }, 60);
    }).catch(function () { msg.textContent = 'The map could not load. Please type your address at checkout.'; });
  }
  function saveLocation(p) {
    var d = {}; ['name', 'phone', 'email', 'address', 'city', 'pin'].forEach(function (k) { d[k] = saved(k); });
    if (p.address) d.address = p.address; if (p.city) d.city = p.city; if (p.pin) d.pin = p.pin; d.loc = p.loc || '';
    saveProfile(d);
  }
  /* previous / next arrows on product rows that scroll */
  function railNav() {
    $$('.rail').forEach(function (r) {
      if (r.dataset.nav) return; r.dataset.nav = '1'; var w = r.parentNode; w.classList.add('railwrap');
      w.insertAdjacentHTML('beforeend', '<button class="rnav p" data-rail="-1" aria-label="Previous products">' + ico('left') + '</button><button class="rnav n" data-rail="1" aria-label="Next products">' + ico('right') + '</button>');
      var up = function () { w.classList.toggle('scrolls', r.scrollWidth > r.clientWidth + 4); };
      window.addEventListener('resize', up); setTimeout(up, 400); try { new MutationObserver(up).observe(r, { childList: true }); } catch (e) {}
    });
  }
  function purl(id) { return '/p/' + encodeURIComponent(id) + '/'; }
  function pageId() { var m = /^\/p\/([^\/]+)/.exec(location.pathname); return qs.get('id') || (m ? decodeURIComponent(m[1]) : ''); }
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
    var c = store.get('orvish_geo', null); if (c && c.city && Date.now() - c.t < 43200000) return Promise.resolve(c);
    var save = function (g) { g.t = Date.now(); store.set('orvish_geo', g); return g; };
    var j = function (u) { var ac = window.AbortController ? new AbortController() : null; if (ac) setTimeout(function () { ac.abort(); }, 2000); return fetch(u, ac ? { signal: ac.signal } : {}).then(function (x) { return x.json(); }); };
    var mk = function (c, r, city, zip) { city = String(city || '').trim(); zip = String(zip || '').trim(); if (!c || !city) throw 0; return save({ c: String(c).slice(0, 40), r: String(r || '').slice(0, 40), city: (city + (zip ? ' ' + zip : '')).slice(0, 40) }); };
    return j('https://ipapi.co/json/').then(function (d) { if (!d || d.error) throw 0; return mk(d.country_name, d.region, d.city, d.postal); })
      .catch(function () { return j('https://ipwho.is/').then(function (d) { if (!d || d.success === false) throw 0; return mk(d.country, d.region, d.city, d.postal); }); })
      .catch(function () { return j('https://get.geojs.io/v1/ip/geo.json').then(function (d) { return mk(d.country, d.region, d.city, ''); }); })
      .catch(function () { return fetch('https://www.cloudflare.com/cdn-cgi/trace').then(function (x) { return x.text(); }).then(function (t) { var m = /loc=(\w+)/.exec(t); return { c: m ? m[1] : '', r: '', city: '' }; }).catch(function () { return { c: '', r: '', city: '' }; }); });
  }
  function logVisit(ev, pid) {
    try {
      /* add ?trafficcheck=1 to any page address to see on screen whether this device's visit is recorded */
      var chk = ev === 'view' && qs.get('trafficcheck'), tell = function (m) { if (chk) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 9000); } };
      if (store.get('orvish_notrack', false)) { tell('Not counted: this device has opened the admin, so its visits are left out. Untick "Leave out my own visits" on the traffic page to count it.'); return; }
      if (!(S.firebase_config && S.firebase_config.apiKey) || navigator.webdriver) return;
      /* visit id = device part + '.' + session part (no names, no IP address): lets the dashboard count different devices as well as visits */
      var did = store.get('orvish_did', ''); if (!/^[a-z0-9]{8}$/.test(did)) { did = (Math.random().toString(36) + '00000000').slice(2, 10); store.set('orvish_did', did); }
      var sid = sessionStorage.getItem('orvish_sid'); if (!sid || sid.indexOf(did + '.') !== 0) { sid = did + '.' + (Math.random().toString(36) + '00000000').slice(2, 10); sessionStorage.setItem('orvish_sid', sid); }
      var ref = ''; try { ref = document.referrer && new URL(document.referrer).hostname.replace(/^www\./, ''); if (ref === location.hostname.replace(/^www\./, '')) ref = ''; } catch (e) {}
      var src = (qs.get('utm_source') || (qs.get('fbclid') ? 'facebook' : '') || (qs.get('gclid') ? 'google-ads' : '') || sessionStorage.getItem('orvish_src') || '').slice(0, 40); if (src) sessionStorage.setItem('orvish_src', src);
      var cfg = S.firebase_config, wait = new Promise(function (ok) { setTimeout(function () { ok(store.get('orvish_geo', null) || { c: '', r: '', city: '' }); }, 2500); });
      Promise.race([geo(), wait]).then(function (g) {
        var sv = function (v) { return { stringValue: String(v || '') }; };
        var doc = { fields: { t: { integerValue: String(Date.now()) }, ev: sv(ev), p: sv(location.pathname.slice(0, 80)), pid: sv(String(pid || '').slice(0, 80)), ref: sv(String(ref || '').slice(0, 60)), src: sv(src), c: sv(String(g.c || '').slice(0, 40)), r: sv(String(g.r || '').slice(0, 40)), city: sv(String(g.city || '').slice(0, 40)), dev: sv(window.innerWidth < 821 ? 'Mobile' : 'Desktop'), sid: sv(sid) } };
        /* a copy goes to the order sheet (Traffic Log tab), which keeps the monthly and yearly totals */
        if (S.order_webhook_url) { try { var fl = doc.fields; fetch(S.order_webhook_url, { method: 'POST', mode: 'no-cors', keepalive: true, body: new URLSearchParams({ action: 'visit', ev: ev, p: fl.p.stringValue, pid: fl.pid.stringValue, ref: fl.ref.stringValue, src: fl.src.stringValue, c: fl.c.stringValue, r: fl.r.stringValue, city: fl.city.stringValue, dev: fl.dev.stringValue, sid: sid }) }).catch(function () {}); } catch (e2) {} }
        /* written straight to the database so a quick visit still counts; if that is refused, fall back to the full Firebase library */
        var viaSdk = function () { fbReady().then(function (f) { if (!f) { tell('Not recorded: this device could not reach the traffic database. A content blocker or private mode can cause this.'); return; } var d = {}; Object.keys(doc.fields).forEach(function (k) { d[k] = k === 't' ? Number(doc.fields.t.integerValue) : doc.fields[k].stringValue; }); f.db.collection('visits').add(d).then(function () { tell('Visit recorded (backup way).'); }).catch(function (x) { tell('Not recorded: the database refused this visit (' + ((x && x.code) || 'blocked') + ').'); }); }); };
        fetch('https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) + '/databases/(default)/documents/visits?key=' + encodeURIComponent(cfg.apiKey), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc), keepalive: true }).then(function (r) { if (!r.ok) viaSdk(); else { tell('Visit recorded on the traffic page. Checking the sheet…'); if (chk && S.order_webhook_url) fetch(S.order_webhook_url + '?action=version&_=' + Date.now()).then(function (x) { return x.json(); }).then(function (d) { tell(d && Number(d.version) >= 13 ? 'Visit recorded on the traffic page and sent to the sheet (script version ' + d.version + '). Look at the Traffic Log tab.' : 'Visit recorded on the traffic page, but the order script that is live is older than version 13, so nothing is written to the sheet. In Apps Script use Deploy > Manage deployments > edit > New version.'); }).catch(function () { tell('Visit recorded on the traffic page. The order script could not be reached to check the sheet.'); }); } }).catch(viaSdk);
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
    return { p: p, label: v ? v.label : '', price: bp ? Math.round(base * (100 - bp) / 100) : base, base: base, bp: bp, old: v && v.compare_at_price ? Number(v.compare_at_price) : p.compare_at_price }; }
  function inStock(p, label) { if (p.in_stock === false) return false; var v = vs(p); if (!v) return true; if (label) { var x = vOf(p, label); return x.in_stock !== false; } return v.some(function (x) { return x.in_stock !== false; }); }
  function addToCart(id, q, label) {
    var p = findP(id); if (!p) return; var v = vs(p); if (v && !label) { var f = v.filter(function (x) { return x.in_stock !== false; })[0]; label = f && f.label; }
    if (!inStock(p, label)) return; label = label || '';
    var l = cart.filter(function (x) { return x.id === id && (x.v || '') === label; })[0];
    if (l) l.q += q || 1; else cart.push({ id: id, v: label, q: q || 1 });
    saveCart(); toast('Added to cart'); $$('.cart-count').forEach(function (e) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }); logVisit('cart', id); fbq_('track', 'AddToCart', { content_ids: [id], content_name: p.title, content_type: 'product', value: unit({ id: id, v: label }).price * (q || 1), currency: 'INR' });
  }
  function totals() {
    var items = 0, sub = 0, base = 0, plain = 0;   /* base = at single-bottle prices, plain = items not at a bundle price */
    cart.forEach(function (l) { if (findP(l.id)) { var u = unit(l); items += l.q; sub += u.price * l.q; base += u.base * l.q; if (!u.bp) plain += u.price * l.q; } });
    var off = 0;
    if (discount && items >= (discount.min_items || 1)) {
      off = Math.round((discount.stack_with_bundles === false ? plain : sub) * discount.percent / 100);
      if (Number(discount.max_discount) > 0) off = Math.min(off, Number(discount.max_discount));
    }
    var after = sub - off, thr = S.free_shipping_above || 0;
    var ship = items === 0 ? 0 : (thr && after >= thr ? 0 : (S.shipping_fee || 0));
    return { items: items, sub: sub, base: base, bsave: base - sub, off: off, ship: ship, total: after + ship };
  }
  var key = function (l) { return l.id + '|' + (l.v || ''); };
  function renderCart() {
    cart = cart.filter(function (l) { return findP(l.id); });
    if (discount && cart.reduce(function (a, l) { return a + l.q; }, 0) < (discount.min_items || 1)) discount = null;
    if (discount && usedUp(discount)) discount = null;
    if (!discount && cart.length) { var rc = store.get('orvish_coupon', ''), rd = (S.discount_codes || []).filter(function (d) { return d.code === rc && !usedUp(d); })[0]; if (rd && cart.reduce(function (a, l) { return a + l.q; }, 0) >= (rd.min_items || 1)) { discount = rd; if (!totals().off) discount = null; } }
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
    var codes = S.discount_codes || [], sv = t.off + cart.reduce(function (a, l) { var u = unit(l); return a + (u.old && u.old > u.price ? (u.old - u.price) * l.q : 0); }, 0);
    var chips = codes.filter(function (d) { return !usedUp(d); }).map(function (d) { var on = discount && discount.code === d.code, need = !on && pickedCoupon() === d.code; return '<button type="button" class="' + (on ? 'on' : '') + '" data-coupon="' + esc(d.code) + '" title="' + (on ? 'Tap to remove' : esc(couponText(d))) + '">' + ico(on ? 'check' : 'ticket') + '<b>' + esc(d.code) + '</b><span>' + esc(need ? 'Add ' + Math.max(1, (d.min_items || 1) - t.items) + ' more to use this' : couponText(d)) + '</span>' + (on ? '<em>Applied</em>' : '') + '</button>'; }).join('');
    body.insertAdjacentHTML('beforeend', '<div class="cextra">' + (discount && t.off ?
        '<div class="capp">' + ico('ticket') + '<div><b>' + esc(discount.code) + ' applied</b><small>You save ' + money(t.off) + ' with this coupon</small></div><button type="button" class="lnk" data-coupon="' + esc(discount.code) + '">Remove</button></div>' :
        '<div class="disc"><input id="dc" placeholder="Enter coupon code" aria-label="Coupon code" autocapitalize="characters"><button id="dc-apply" type="button">Apply</button></div>') + '<div class="msg" id="dc-msg"></div>' +
      (chips ? '<details class="cmore"' + (discount ? '' : ' open') + '><summary>' + (discount ? 'Use a different coupon' : 'Available coupons') + '</summary><div class="cchips">' + chips + '</div></details>' : '') +
      '<div class="csum"><div class="row"><span>Subtotal</span><span>' + money(t.base) + '</span></div>' + (t.bsave > 0 ? '<div class="row off"><span>Bundle saving</span><span>−' + money(t.bsave) + '</span></div>' : '') +
      (t.off ? '<div class="row off"><span>Coupon discount</span><span>−' + money(t.off) + '</span></div>' : '') +
      '<div class="row"><span>Shipping</span><span>' + (t.ship ? money(t.ship) : '<b class="free">Free</b>') + '</span></div>' +
      '<div class="row total"><span>Total<small>Inclusive of all taxes</small></span><span>' + money(t.total) + '</span></div>' +
      (sv > 0 ? '<div class="saved">You save ' + money(Math.round(sv)) + ' on this order</div>' : '') + '</div></div>');
    foot.innerHTML = '<button class="btn block" id="checkout">Checkout · ' + money(t.total) + '</button>' + payLogos();
  }
  function openCart(o) { $('#cart').classList.toggle('open', o); $('#ov').classList.toggle('on', o); }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 1800); }

  /* checkout */
  function methods() { var m = []; if (S.razorpay_key_id) m.push(['online', 'Pay online (UPI / Cards / Netbanking)']); if (S.cod_enabled !== false) m.push(['cod', 'Cash on delivery']); if (!m.length) m.push(['cod', 'Pay on delivery / we will contact you']); return m; }
  function openCheckout() {
    var t = totals(); if (!t.items) return; logVisit('checkout'); fbq_('track', 'InitiateCheckout', { value: t.total, currency: 'INR', num_items: t.items });
    var m = $('#checkout-modal'), ms = methods();
    var quick = !!(saved('name') && /^[0-9+ ]{10,15}$/.test(saved('phone')) && saved('address') && saved('city') && /^[0-9]{6}$/.test(saved('pin')) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((USER && USER.email) || saved('email')));
    var sum = cart.map(function (l) { var u = unit(l); return '<div class="sum-l"><img src="' + esc(u.p.images[0]) + '" alt=""><div><b>' + esc(u.p.title) + '</b>' + (u.label ? '<br><small>' + esc(u.label) + '</small>' : '') + '</div><span>×' + l.q + '</span><span>' + money(u.price * l.q) + '</span></div>'; }).join('');
    m.innerHTML = '<div class="box"><button class="icon-btn" style="position:absolute;right:8px;top:8px;color:var(--ink)" data-close-modal>' + ico('close') + '</button><h4>Checkout</h4>' +
      '<div class="sum">' + sum + '</div>' +
      (S.firebase_config && S.firebase_config.apiKey && !USER ? '<p class="msg" style="margin:0 0 8px">Have an account? <a class="link" href="/account?next=1">Log in</a> to save your orders.</p>' : '') + '<form id="co-form"><h6 class="co-h">Contact &amp; delivery</h6>' + (quick ? '<div class="co-saved" id="co-saved">' + ico('pin') + '<div><b>' + esc(saved('name')) + '</b> · ' + esc(saved('phone')) + '<br>' + esc([saved('address'), saved('city'), saved('pin')].join(', ')) + '</div><button type="button" class="link lnk" id="co-change">Change</button></div>' : '') + '<div id="co-fields"' + (quick ? ' hidden' : '') + '><div class="two"><div class="field"><label>Full name</label><input name="name" required autocomplete="name" value="' + esc(saved('name') || (USER && USER.displayName) || '') + '"></div><div class="field"><label>Phone</label>' + phoneField(saved('phone') || (USER && USER.phoneNumber) || '', true) + '</div></div>' +
      '<div class="field"><label>Email (for your order confirmation)</label><input name="email" type="email" required autocomplete="email" placeholder="name@example.com" value="' + esc((USER && USER.email) || saved('email')) + '"></div>' +
      '<div class="locbtns"><button type="button" class="btn secondary" id="co-here">' + ico('locate') + 'Use my current location</button><button type="button" class="btn secondary" id="co-map">' + ico('pin') + 'Choose on map</button></div><input type="hidden" name="loc" value="' + esc(saved('loc')) + '">' +
      '<div class="field"><label>Address (house or flat no., building, street)</label><textarea name="address" rows="2" required autocomplete="street-address">' + esc(saved('address')) + '</textarea></div>' +
      '<div class="two"><div class="field"><label>City</label><input name="city" required value="' + esc(saved('city')) + '"></div><div class="field"><label>PIN code</label><input name="pin" required pattern="[0-9]{6}" inputmode="numeric" value="' + esc(saved('pin')) + '"></div></div>' +
      (saved('address') ? '<p class="msg" style="margin:0 0 8px">Using your saved address. <button type="button" class="link lnk" id="co-clear">Not this address?</button></p>' : '') + '</div>' +
      '<h6 class="co-h">Payment</h6><div class="pay2">' + ms.map(function (x, i) { var on = x[0] === 'online'; return '<label class="pm"><input type="radio" name="pm" value="' + x[0] + '"' + (i ? '' : ' checked') + '><span class="pmi">' + ico(on ? 'card' : 'cash') + '</span><span class="pmt"><b>' + (on ? 'Pay online' : 'Cash on delivery') + '</b><small>' + (on ? 'UPI, cards, netbanking and wallets' : 'Pay when your order arrives') + '</small></span><span class="pmr"></span></label>'; }).join('') + '</div><div class="csum co">' +
      '<div class="row"><span>Subtotal</span><span>' + money(t.base) + '</span></div>' + (t.bsave > 0 ? '<div class="row off"><span>Bundle saving</span><span>−' + money(t.bsave) + '</span></div>' : '') + (t.off && discount ? '<div class="row"><span>Discount <span class="cotag">' + ico('ticket') + esc(discount.code) + ' applied</span></span><span>−' + money(t.off) + '</span></div>' : '') + '<div class="row"><span>Shipping</span><span>' + (t.ship ? money(t.ship) : 'Free') + '</span></div>' +
      '<div class="row total"><span>Total<small>Inclusive of all taxes</small></span><span>' + money(t.total) + '</span></div></div>' +
      '<div class="msg err" id="co-msg"></div><button class="btn block" type="submit" style="margin-top:10px">' + (ms[0][0] === 'online' ? 'Continue to payment · ' : 'Place order · ') + money(t.total) + '</button></form></div>';
    $('#cart').classList.remove('open'); m.classList.add('open'); $('#ov').classList.add('on');
    var fm0 = $('#co-form'), flds = $('#co-fields'), sum0 = $('#co-saved');
    var expand = function () { if (flds) flds.hidden = false; if (sum0) sum0.remove(); };
    if ($('#co-change')) $('#co-change').onclick = function () { expand(); fm0.address.focus(); };
    if ($('#co-clear')) $('#co-clear').onclick = function () { fm0.address.value = ''; fm0.city.value = ''; fm0.pin.value = ''; fm0.loc.value = ''; $('#co-clear').closest('.msg').remove(); fm0.address.focus(); };
    var setLoc = function (pl) { if (pl.address) fm0.address.value = pl.address; if (pl.city) fm0.city.value = pl.city; if (pl.pin) fm0.pin.value = pl.pin; fm0.loc.value = pl.loc || ''; fm0.address.focus(); toast('Location added. Add your house or flat number'); };
    $('#co-here').onclick = function () { pickLocation(setLoc, true); }; $('#co-map').onclick = function () { pickLocation(setLoc, false); };
    $('#co-form').addEventListener('submit', function (e) { e.preventDefault(); var f = Object.fromEntries(new FormData(e.target)); f.phone = fullPhone(f.phone);
      var lim = discount && t.off ? Number(discount.max_uses) || 0 : 0, sb = $('#co-form button[type=submit]'), go = function () { if (f.pm === 'online') {
        if (S.firebase_config && S.firebase_config.apiKey && !USER) { $('#co-msg').innerHTML = 'Please <a class="link" href="/account?next=1">log in or create an account</a> to pay online. Your cart is saved.'; return; }
        payRazorpay(f, t);
      } else emailOrder(f, t); };
      if (!lim || !S.order_webhook_url) return go();
      var lbl = sb.textContent; sb.disabled = true; sb.textContent = 'Checking coupon…';
      fetch(S.order_webhook_url + '?action=coupon_uses&code=' + encodeURIComponent(discount.code) + '&phone=' + encodeURIComponent(f.phone) + '&email=' + encodeURIComponent(f.email || '') + '&_=' + Date.now()).then(function (x) { return x.json(); }).then(function (d) {
        sb.disabled = false; sb.textContent = lbl;
        if (d && Number(d.uses) >= lim) { var code = discount.code, cu2 = store.get('orvish_coupon_used', {}); cu2[code] = Math.max(cu2[code] || 0, Number(d.uses)); store.set('orvish_coupon_used', cu2); saveProfile(f); applyCode(''); openCheckout(); $('#co-msg').textContent = code + ' can be used ' + timesText(lim) + ' per customer and you have already used it. It has been removed, please check the new total.'; return; }
        go();
      }).catch(function () { sb.disabled = false; sb.textContent = lbl; go(); }); });
  }
  function orderLines() { return cart.map(function (l) { var u = unit(l); return l.q + ' x ' + u.p.title + (u.label ? ' ' + u.label : '') + ' (' + money(u.price) + ')'; }); }
  function itemsDetail() { return cart.map(function (l) { var u = unit(l); return { id: u.p.id, title: u.p.title, image: u.p.images[0], qty: l.q, price: u.price }; }); }
  function sendOrder(f, t, status, payId, extra) {
    var url = S.order_webhook_url; if (!url) return null;
    var id = 'ORV-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var items = itemsDetail();
    if (t.off && discount) { var cu = store.get('orvish_coupon_used', {}); cu[discount.code] = (cu[discount.code] || 0) + 1; store.set('orvish_coupon_used', cu); }
    var body = new URLSearchParams({ date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }), order_id: id, name: f.name, phone: f.phone, email: f.email || '', address: f.address + (f.loc ? ' (Map pin: https://maps.google.com/?q=' + f.loc + ')' : ''), city: f.city, pin: f.pin, items: orderLines().join('; '), items_json: JSON.stringify(items), total: String(t.total), coupon: t.off && discount ? discount.code + ' (' + money(t.off) + ' off)' : '', payment_status: status, order_status: 'New', payment_id: payId || '', rzp_order_id: (extra && extra.o) || '', rzp_signature: (extra && extra.s) || '' });
    try { fetch(url, { method: 'POST', mode: 'no-cors', body: body }).catch(function () {}); } catch (e) {}
    var o = store.get('orvish_orders', []); o.unshift({ id: id, phone: String(f.phone).replace(/\D/g, '').slice(-10), total: t.total, date: Date.now(), items: orderLines().join('; '), items_detail: items }); store.set('orvish_orders', o.slice(0, 20));
    if (FB && USER) { try { FB.db.collection('orders').doc(id).set({ uid: USER.uid, order_id: id, phone: String(f.phone).replace(/\D/g, '').slice(-10), items: orderLines().join('; '), items_detail: items, total: t.total, created: Date.now() }).catch(function () {}); } catch (e) {} }
    saveProfile(f);
    return id;
  }
  function emailOrder(f, t) {
    var oid = sendOrder(f, t, 'COD');
    if (oid) { done({ id: oid, total: t.total, f: f, pay: 'Cash on delivery' }); return; }
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
          handler: function (r) { var oid = sendOrder(f, t, 'Paid', r.razorpay_payment_id, { o: r.razorpay_order_id || '', s: r.razorpay_signature || '' }); done({ id: oid, total: t.total, f: f, pay: 'Paid online', pid: r.razorpay_payment_id }); }
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
  function done(o) {
    fbq_('track', 'Purchase', { value: o.total, currency: 'INR' }); logVisit('order');
    cart = []; discount = null; store.set('orvish_coupon', ''); saveCart(); openCart(false); if (onCoupon) onCoupon();
    var f = o.f || {}, ph = String(f.phone || '').replace(/\D/g, '').slice(-10), row = function (a, b) { return b ? '<div class="row"><span>' + a + '</span><span>' + b + '</span></div>' : ''; };
    $('#checkout-modal').innerHTML = '<div class="box thanks"><div class="tick">' + ico('check') + '</div><h4>Thank you for your order</h4><p>' + esc(S.order_thanks_message || 'Your order has been placed successfully.') + '</p>' +
      '<div class="tsum">' + row('Order ID', o.id ? '<b>' + esc(o.id) + '</b>' : '') + row('Total', '<b>' + money(o.total) + '</b>') + row('Payment', esc(o.pay)) + row('Payment reference', esc(o.pid || '')) + row('Delivering to', esc([f.address, f.city, f.pin].filter(Boolean).join(', '))) + '</div>' +
      (f.email ? '<p class="msg">A confirmation email is on its way to ' + esc(f.email) + '.</p>' : '') +
      '<div class="tact">' + (o.id ? '<a class="btn secondary" href="/track?id=' + encodeURIComponent(o.id) + '&ph=' + encodeURIComponent(ph) + '">Track my order</a>' : '') + '<a class="btn" href="/shop">Continue shopping</a></div></div>';
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
    var ph = phoneNo();
    $('#header').classList.add('h2');
    $('#header').innerHTML = '<div class="wrap"><div class="hleft"><button class="icon-btn burger" id="burger" aria-label="Menu">' + ico('menu') + '</button><button class="hsearch" id="open-search" aria-label="Search">' + ico('search') + '<span>What are you looking for?</span></button></div>' +
      '<a class="logo" href="/">' + logoHTML() + '</a><div class="actions">' + '<a class="icon-btn acct" href="/account" aria-label="My account">' + ico('user') + '<i id="acct-dot"></i></a><button class="icon-btn" id="open-cart" aria-label="Cart">' + ico('bag') + '<span class="cart-count"></span></button></div></div>' +
      '<div class="navrow"><nav class="nav">' + navHTML() + '</nav></div>';
    var li = function (a) { return (a || []).map(function (l) { return '<li><a href="' + esc(l.url) + '">' + esc(l.label) + '</a></li>'; }).join(''); };
    var cols = (S.footer_columns || []).map(function (c) { return '<div><h6>' + esc(c.title) + '</h6><ul>' + li(c.links) + '</ul></div>'; }).join('');
    $('#footer').innerHTML = '<div class="wrap"><div class="f-top"><div><div class="logo">' + logoHTML() + '</div><p style="font-size:13px;color:#555;margin:6px 0 0">' + esc(S.tagline || '') + '<br>Email : <a href="mailto:' + esc(S.support_email) + '">' + esc(S.support_email) + '</a>' + (ph ? '<br>Phone : <a href="tel:' + esc(ph.tel) + '">' + esc(ph.text) + '</a>' : '') + '</p></div>' +
      '<div class="nl"><h6><em>Get In Touch</em></h6><p style="font-size:13px;margin:0">' + esc(S.footer_newsletter_text) + '</p><form class="news" id="news"><input type="email" placeholder="Email" required><button class="btn" type="submit">Sign up</button></form></div></div>' +
      '<div class="f-grid">' + cols + '</div>' + payLogos() + '<div class="copy">© ' + new Date().getFullYear() + ' ' + esc(S.store_name) + '. All rights reserved.</div></div>';
    document.body.insertAdjacentHTML('beforeend',
      '<div class="mobile-nav" id="mnav">' + mobileNavHTML() + '</div><div class="overlay" id="ov"></div>' +
      '<aside class="drawer" id="cart"><div class="d-head"><h4>Cart</h4><button class="icon-btn" style="color:var(--ink)" id="close-cart">' + ico('close') + '</button></div><div class="d-body" id="cart-body"></div><div class="d-foot" id="cart-foot"></div></aside>' +
      '<div class="modal" id="checkout-modal"></div><div class="search-box" id="sb" role="dialog" aria-label="Search"><div class="sbin"><label class="sfield">' + ico('search') + '<input id="sq" type="search" placeholder="Search perfumes, brands or notes" autocomplete="off" enterkeyhint="search"></label><button class="lnk" id="close-search" type="button">Cancel</button></div>' +
      '<div class="sbody"><div id="sdef">' + ((S.trending || []).length ? '<h6>Trending</h6><div class="trend">' + S.trending.map(function (x) { return '<a href="' + esc(x.url) + '">' + esc(x.label) + '</a>'; }).join('') + '</div>' : '') + '<h6>Popular right now</h6><div class="hits">' + P.filter(function (x) { return x.best_seller; }).concat(P.filter(function (x) { return !x.best_seller; })).slice(0, 4).map(hitHTML).join('') + '</div></div><div class="hits" id="hits"></div></div></div><div class="toast" id="toast"></div>' +
      '<nav class="bnav" id="bnav"><a href="/">' + ico('home') + 'Home</a><a href="/shop">' + ico('grid') + 'Shop</a><button id="b-search">' + ico('search') + 'Search</button><a href="/account">' + ico('user') + 'Account</a><button id="b-cart">' + ico('bag') + 'Cart<span class="cart-count"></span></button></nav>' +
      (waLink() ? '<a class="wa" href="' + waLink() + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><img src="/images/whatsapp.png" alt="WhatsApp"></a>' : ''));
    if (!/orvish/i.test(document.title)) document.title = (document.title ? document.title + ' – ' : '') + 'ORVISH';
    renderCart();
  }
  function hitHTML(p) { return '<a class="hit" href="' + purl(p.id) + '"><img src="' + esc(p.images[0]) + '" alt="" loading="lazy"><div>' + (p.brand ? '<small>' + esc(p.brand) + '</small>' : '') + '<b>' + esc(p.title) + '</b><span>' + money(p.price) + (pct(p) ? '<s>' + money(p.compare_at_price) + '</s>' : '') + '</span></div></a>'; }
  function closeAll() { openCart(false); var sbx = $('#sb'); if (sbx) sbx.classList.remove('open'); $('#mnav').classList.remove('open'); $('#checkout-modal').classList.remove('open'); var f = $('#fpanel'); if (f) f.classList.remove('open'); $('#ov').classList.remove('on'); }
  function events() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('button,a,[data-close-modal]'); if (!t) return;
      var kk = function (k) { return cart.filter(function (l) { return key(l) === k; })[0]; };
      if (t.id === 'open-cart' || t.id === 'b-cart') openCart(true);
      else if (t.id === 'close-cart') openCart(false);
      else if (t.id === 'burger') { $('#mnav').classList.add('open'); $('#ov').classList.add('on'); }
      else if (t.id === 'open-search' || t.id === 'b-search') { closeAll(); $('#sb').classList.add('open'); $('#ov').classList.add('on'); $('#sq').focus(); }
      else if (t.id === 'close-search') closeAll();
      else if (t.hasAttribute('data-close-modal')) closeAll();
      else if (t.dataset.inc) { kk(t.dataset.inc).q++; saveCart(); }
      else if (t.dataset.dec) { var l = kk(t.dataset.dec); l.q = Math.max(1, l.q - 1); saveCart(); }
      else if (t.dataset.rm) { cart = cart.filter(function (l) { return key(l) !== t.dataset.rm; }); saveCart(); }
      else if (t.dataset.add) { e.preventDefault(); e.stopPropagation(); addToCart(t.dataset.add, 1); openCart(true); }
      else if (t.id === 'dc-apply') { if (($('#dc').value || '').trim()) applyCode($('#dc').value); else { $('#dc-msg').textContent = 'Type a coupon code first'; $('#dc').focus(); } }
      else if (t.dataset.coupon) { if (t.dataset.copy) { try { navigator.clipboard.writeText(t.dataset.coupon).catch(function () {}); } catch (x) {} } applyCode(pickedCoupon() === t.dataset.coupon ? '' : t.dataset.coupon, t.dataset.copy ? pendingQty : 0); }
      else if (t.dataset.rail) { var rl = t.parentNode.querySelector('.rail'); if (rl) rl.scrollBy({ left: Number(t.dataset.rail) * rl.clientWidth * .8, behavior: 'smooth' }); }
      else if (t.id === 'checkout') openCheckout();
    });
    $('#ov').addEventListener('click', closeAll);
    var hd = $('#header'), sc = function () { hd.classList.toggle('scrolled', window.scrollY > 30); }; window.addEventListener('scroll', sc, { passive: true }); sc();
    $('#news').addEventListener('submit', function (e) { e.preventDefault(); location.href = 'mailto:' + S.support_email + '?subject=Subscribe&body=Please add ' + encodeURIComponent(e.target.querySelector('input').value) + ' to your mailing list.'; });
    $('#sq').addEventListener('input', function (e) {
      var q = e.target.value.toLowerCase().trim(), r = !q ? [] : P.filter(function (p) { return (p.title + ' ' + (p.brand || '') + ' ' + (p.type || '') + ' ' + (p.short_description || '') + ' ' + (p.notes || []).join(' ')).toLowerCase().indexOf(q) > -1; });
      $('#sdef').hidden = !!q && r.length > 0;
      $('#hits').innerHTML = !q ? '' : r.length ? '<h6>' + r.length + (r.length === 1 ? ' product' : ' products') + '</h6>' + r.slice(0, 8).map(hitHTML).join('') + (r.length > 8 ? '<a class="sall" href="/shop?q=' + encodeURIComponent(q) + '">See all ' + r.length + ' results</a>' : '') : '<p class="snone">Nothing matches “' + esc(e.target.value.trim()) + '”. Try a brand, a note such as rose or oud, or pick from below.</p>';
    });
    $('#sq').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.value.trim()) location.href = '/shop?q=' + encodeURIComponent(e.target.value.trim()); if (e.key === 'Escape') closeAll(); });
  }

  function swipe(el, cb) {
    var x0 = null; if (!el) return;
    el.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function (e) { if (x0 == null) return; var d = x0 - e.changedTouches[0].clientX; if (Math.abs(d) > 40) cb(d); x0 = null; });
  }
  /* views */
  function pct(p) { return p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0; }
  function cardHTML(p) {
    var sale = pct(p), so = !inStock(p), href = '' + purl(p.id), multi = vs(p);
    return '<div class="card"><a class="img" href="' + href + '">' + (so ? '<span class="badge so">Sold out</span>' : sale ? '<span class="badge">' + sale + '% off</span>' : (p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : '')) + (p.best_seller && !so ? '<span class="badge l">Best seller</span>' : '') +
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
    var p = findP(pageId()), el = $('#pdp');
    if (!p) { el.innerHTML = '<p class="empty">Product not found. <a class="link" href="/shop">Back to shop</a></p>'; return; }
    document.title = p.title + ' – ORVISH';
    (function () { var rt = rateOf(p.id), m = document.querySelector('meta[name=description]'); if (m) m.content = (p.short_description || p.title) + ' Buy online at ORVISH with express shipping across India.';
      var ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.title, image: p.images.map(function (i) { return new URL(i, location.origin).href; }), description: p.short_description || p.title, sku: p.id, offers: { '@type': 'Offer', url: 'https://www.orvish.com' + purl(p.id), priceCurrency: 'INR', price: p.price, availability: 'https://schema.org/' + (inStock(p) ? 'InStock' : 'OutOfStock') } };
      if (p.brand) ld.brand = { '@type': 'Brand', name: p.brand }; if (rt) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: rt.avg.toFixed(1), reviewCount: rt.n };
      $$('script[data-static-ld]').forEach(function (x) { x.remove(); }); if (!$('link[rel=canonical]')) { var cn = document.createElement('link'); cn.rel = 'canonical'; cn.href = 'https://www.orvish.com' + purl(p.id); document.head.appendChild(cn); }
      var sc = document.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc); })();
    fbq_('track', 'ViewContent', { content_ids: [p.id], content_name: p.title, content_type: 'product', value: p.price, currency: 'INR' }); var q = 1, v = vs(p), cur = v ? (v.filter(function (x) { return x.in_stock !== false; })[0] || v[0]).label : '';
    function info() { var u = unit({ id: p.id, v: cur, q: q }), s = u.old && u.old > u.price; return { u: u, s: s, so: !inStock(p, cur) }; }
    function priceHTML() { var i = info(); return money(i.u.price) + (i.s ? '<s>' + money(i.u.old) + '</s> <span class="badge" style="position:static;display:inline-block;margin-left:6px">' + Math.round((1 - i.u.price / i.u.old) * 100) + '% off</span>' : '') + '<small class="tax">' + (i.u.bp ? 'each when you buy ' + q + ' · you save ' + money((i.u.base - i.u.price) * q) + ' · ' : '') + 'Inclusive of all taxes</small>'; }
    var tags = [(p.type || ''), p.gender ? ({ men: 'For Him', women: 'For Her', unisex: 'Unisex' }[p.gender]) : ''].concat(p.notes || []).filter(Boolean);
    el.innerHTML = '<div class="gallery"><div class="main"><img id="mi" src="' + esc(p.images[0]) + '" alt="' + esc(p.title) + '"></div>' + (p.images.length > 1 ? '<div class="thumbs">' + p.images.map(function (im, i) { return '<img class="' + (i ? '' : 'on') + '" src="' + esc(im) + '" alt="">'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="info"><div class="tags big">' + tags.map(function (n) { return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' + (p.brand ? '<div class="brand">' + esc(p.brand) + '</div>' : '') + '<h1>' + esc(p.title) + '</h1><a class="rating big" href="#reviews" data-pid="' + esc(p.id) + '">' + ratingHTML(p.id) + '</a><div class="price" id="pp"></div>' +
      (v ? '<div class="vgrp"><b>Size</b><div id="vopts">' + v.map(function (x) { return '<button class="vopt' + (x.label === cur ? ' on' : '') + (x.in_stock === false ? ' off' : '') + '" data-v="' + esc(x.label) + '">' + esc(x.label) + '</button>'; }).join('') + '</div></div>' : '') +
      '<div id="buyarea"></div><div id="pdx"></div><div class="pay-note"><b>Secure checkout</b> – pay by card, UPI, net banking or cash on delivery</div>' + payLogos() + '<div class="badges">' + (S.product_badges || []).map(function (b) { return '<div>' + ico(b.icon) + '<span>' + esc(b.text) + '</span></div>'; }).join('') + '</div>' +
      '<div class="desc">' + md(p.description) + '</div>' + noteBlock(p) +
      (p.details || []).map(function (d) { return '<details class="acc"><summary>' + esc(d.title) + '</summary><div>' + md(d.body) + '</div></details>'; }).join('') + '</div>';
    function paint() {
      $('#pp').innerHTML = priceHTML(); var i = info();
      $('#buyarea').innerHTML = i.so ? '<p><strong>Sold out</strong></p>' : (p.bundles && p.bundles.length ? '<div class="bundles"><b>Bundle &amp; save</b>' + p.bundles.filter(function (b) { return Number(b.qty) > 1 && Number(b.percent) > 0; }).sort(function (x, y) { return x.qty - y.qty; }).map(function (b) { var n = Number(b.qty), bu = unit({ id: p.id, v: cur, q: n }); return '<button class="bnd' + (bundlePct(p, q) === Number(b.percent) && q >= n ? ' on' : '') + '" data-q="' + n + '"><span>Buy ' + n + '</span><em>Save ' + Number(b.percent) + '%</em></button>'; }).join('') + '</div>' : '') + '<div class="qty" id="pq"><button data-d="-1">−</button><span>' + q + '</span><button data-d="1">+</button></div><div class="buy-row"><button class="btn secondary" id="add">Add to cart</button><button class="btn" id="buy">Buy it now</button></div>';
      if (i.so) return;
      $$('#pq button').forEach(function (b) { b.onclick = function () { q = Math.max(1, q + Number(b.dataset.d)); paint(); }; });
      $$('.bnd').forEach(function (b) { b.onclick = function () { q = b.classList.contains('on') ? 1 : Number(b.dataset.q); paint(); }; });
      $('#add').onclick = function () { addToCart(p.id, q, cur); openCart(true); };
      $('#buy').onclick = function () { addToCart(p.id, q, cur); openCheckout(); };
      var s = $('#s-add'); if (s) { $('#s-price').textContent = money(i.u.price); }
      if ($('#pdx')) pdx();
    }
    function pdx() {
      pendingQty = q;
      var where = [saved('city'), saved('pin')].filter(Boolean).join(' '), tt = totals(), thr = S.free_shipping_above || 0, price = info().u.price * q;
      var free = thr && price >= thr, cs = S.discount_codes || [];
      $('#pdx').innerHTML = '<button class="dlv" id="dlv" type="button">' + ico('pin') + '<span>' + (where ? 'Deliver to <b>' + esc(where) + '</b>' : 'Add your delivery location') + '</span>' + ico('edit') + '</button>' +
        '<div class="eta">' + ico('truck') + '<span>Standard delivery<b>Arrives ' + etaText() + '</b></span><em>' + (free || !S.shipping_fee ? 'Free' : money(S.shipping_fee)) + '</em></div>' +
        (cs.length ? '<div class="cpn"><h6>' + ico('ticket') + 'Save extra with coupons</h6>' + cs.map(function (d) { return '<div class="cp' + (pickedCoupon() === d.code ? ' on' : '') + '"><div><b>' + esc(couponText(d).replace(/^./, function (c) { return c.toUpperCase(); })) + '</b><small>' + esc(d.code) + '</small></div>' + (function () { if (usedUp(d)) return '<span class="cpb used">Already used</span>'; var on = pickedCoupon() === d.code, have = tt.items + q, need = on && have < (d.min_items || 1); return (on ? '<span class="cpb' + (need ? ' wait' : '') + '">' + (need ? 'Add ' + ((d.min_items || 1) - have) + ' more' : 'Applied') + '</span>' : '') + '<button type="button" data-coupon="' + esc(d.code) + '"' + (on ? ' class="on" aria-label="Remove coupon ' + esc(d.code) + '">' + ico('close') + 'Remove' : ' data-copy="1">' + ico('copy') + 'Copy') + '</button>'; })() + '</div>'; }).join('') + '</div>' : '');
      $('#dlv').onclick = function () { pickLocation(function (pl) { saveLocation(pl); pdx(); }, !where); };
    }
    onCoupon = function () { if ($('#pdx')) pdx(); };
    $$('#vopts button').forEach(function (b) { b.onclick = function () { if (b.classList.contains('off')) return; cur = b.dataset.v; $$('#vopts button').forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); }; });
    paint();
    if (p.images.length > 1) { var gi = 0; swipe($('.gallery .main'), function (d) { gi = (gi + (d > 0 ? 1 : -1) + p.images.length) % p.images.length; $('#mi').src = p.images[gi]; $$('.thumbs img').forEach(function (x, i) { x.classList.toggle('on', i === gi); }); }); }
    $$('.thumbs img').forEach(function (t) { t.onclick = function () { $('#mi').src = t.src; $$('.thumbs img').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); }; });
    var wl = waLink('Hi, I want to order: ' + p.title + ' ' + location.href);
    if (wl) $('#buyarea').insertAdjacentHTML('afterend', '<a class="btn secondary block" style="margin:6px 0 16px" target="_blank" rel="noopener" href="' + wl + '"><img class="wa-i" src="/images/whatsapp.png" alt="">Order on WhatsApp</a>');
    if (inStock(p)) { document.body.insertAdjacentHTML('beforeend', '<div class="sticky-buy"><div><div class="price" id="s-price" style="padding:0;font-size:16px">' + money(info().u.price) + '</div><div style="font:12px var(--font-accent);opacity:.7">' + esc(p.title) + '</div></div><button class="btn secondary" id="s-add">Add</button><button class="btn" id="s-buy">Buy now</button></div>');
      $('#s-add').onclick = function () { addToCart(p.id, q, cur); openCart(true); }; $('#s-buy').onclick = function () { addToCart(p.id, q, cur); openCheckout(); }; }
    var elig; /* undefined = checking, null = not a buyer, {id, phone} = verified buyer of this product */
    function findBuyer() {
      var has = function (items) { return String(items || '').toLowerCase().indexOf(p.title.toLowerCase()) > -1; };
      return fbReady().then(function () {
        var c = []; if (qs.get('oid') && qs.get('ph')) c.push({ id: qs.get('oid'), phone: qs.get('ph') });
        store.get('orvish_orders', []).forEach(function (o) { if (o.items == null || has(o.items)) c.push({ id: o.id, phone: o.phone }); });
        var more = (FB && USER) ? FB.db.collection('orders').where('uid', '==', USER.uid).get().then(function (q) { q.docs.forEach(function (d) { var o = d.data(); if (has(o.items)) c.push({ id: o.order_id, phone: o.phone }); }); }).catch(function () {}) : Promise.resolve();
        return more.then(function () {
          if (!S.order_webhook_url) return null; c = c.slice(0, 6);
          var next = function (k) {
            if (k >= c.length) return null;
            return fetch(S.order_webhook_url + '?action=track&order_id=' + encodeURIComponent(c[k].id) + '&phone=' + encodeURIComponent(String(c[k].phone).replace(/\D/g, '')) + '&_=' + Date.now()).then(function (x) { return x.json(); })
              .then(function (o) { return (o && o.found && has(o.items) && !/cancel|return/i.test(String(o.order_status || ''))) ? c[k] : next(k + 1); }).catch(function () { return next(k + 1); });
          };
          return next(0);
        });
      }).catch(function () { return null; });
    }
    function drawReviews() {
      var box = $('#reviews'); if (!box) return; var x = rateOf(p.id), mine = store.get('orvish_reviewed', []).indexOf(p.id) > -1;
      var bars = ''; if (x) { for (var st = 5; st >= 1; st--) { var c = x.list.filter(function (y) { return Math.round(Number(y.rating)) === st; }).length; bars += '<div class="rb"><span>' + st + ' ★</span><i><b style="width:' + Math.round(c / x.n * 100) + '%"></b></i><span>' + c + '</span></div>'; } }
      box.innerHTML = '<h3>Customer reviews</h3>' +
        (x ? '<div class="rsum"><div class="ravg"><b>' + x.avg.toFixed(1) + '</b>' + starsHTML(x.avg) + '<small>' + x.n + (x.n === 1 ? ' review' : ' reviews') + '</small></div><div class="rbars">' + bars + '</div></div>' : '<p class="sub" style="margin:0 0 14px">No reviews yet.</p>') +
        (mine ? '<p class="msg">Thank you! Your review was sent and will appear here after we approve it.</p>' :
          elig ? '<details class="rform"' + (qs.get('oid') ? ' open' : '') + '><summary class="btn secondary">Write a review</summary><form id="rf"><div class="pick" id="pick">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" aria-label="' + n + ' stars">★</button>'; }).join('') + '<span id="pick-t">Tap to rate</span></div>' +
          '<div class="field"><label>Your name</label><input name="name" required maxlength="40"></div><div class="field"><label>Your review</label><textarea name="review" rows="3" required maxlength="800"></textarea></div><input name="website" class="hp" tabindex="-1" autocomplete="off">' +
          '<div class="msg err" id="rmsg"></div><button class="btn" type="submit">Submit review</button></form></details>' :
          '') +
        (x ? '<div class="rlist">' + x.list.slice().reverse().map(function (y) { return '<div class="rev"><div class="rh">' + starsHTML(Number(y.rating)) + '<b>' + esc(y.name) + '</b>' + (y.verified ? '<em>Verified buyer</em>' : '') + '<small>' + esc(y.date || '') + '</small></div><p>' + esc(y.review) + '</p></div>'; }).join('') + '</div>' : '');
      var rate = 0, f = $('#rf'); if (!f) return;
      $$('#pick button').forEach(function (b) { b.onclick = function () { rate = Number(b.dataset.n); $$('#pick button').forEach(function (z) { z.classList.toggle('on', Number(z.dataset.n) <= rate); }); $('#pick-t').textContent = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rate]; }; });
      f.onsubmit = function (e) {
        e.preventDefault(); var d = Object.fromEntries(new FormData(f)); if (d.website) return;
        if (!rate) { $('#rmsg').textContent = 'Please tap the stars to give a rating.'; return; }
        if (!S.order_webhook_url || !elig) { $('#rmsg').textContent = 'Reviews are not available right now.'; return; }
        try { fetch(S.order_webhook_url, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ action: 'review', product_id: p.id, product: p.title, name: d.name, rating: String(rate), review: d.review, order_id: elig.id, phone: String(elig.phone).replace(/\D/g, ''), date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) }) }).catch(function () {}); } catch (er) {}
        var mm = store.get('orvish_reviewed', []); mm.push(p.id); store.set('orvish_reviewed', mm); drawReviews();
      };
    }
    findBuyer().then(function (b) { elig = b || null; drawReviews(); if (b && qs.get('oid')) { var rb = $('#reviews'); if (rb) rb.scrollIntoView(); } });
    drawReviews(); loadReviews().then(function () { fillRatings(); drawReviews(); });
    var fq = S.faq || []; if (fq.length) $('#faq').innerHTML = '<h3>Frequently asked questions</h3>' + fq.map(function (d) { return '<details class="acc"><summary>' + esc(d.title) + '</summary><div>' + md(d.body) + '</div></details>'; }).join('');
    var rel = P.filter(function (x) { return x.id !== p.id; }).slice(0, 4);
    if (rel.length) $('#related').innerHTML = rel.map(cardHTML).join(''); else $('#related-wrap').style.display = 'none';
  }
  function page() {
    var im = /^\/info\/([^\/]+)/.exec(location.pathname), slug = qs.get('p') || (im ? decodeURIComponent(im[1]) : '');
    var pg = PAGES.filter(function (x) { return x.slug === slug; })[0], el = $('#page-body');
    if (!el) return;
    if (!pg) { el.innerHTML = '<h2>Page not found</h2>'; return; }
    var md0 = document.querySelector('meta[name=description]'), tx = String(pg.body || '').replace(/[#*_`>\[\]]+/g, '').replace(/\s+/g, ' ').trim(); if (md0 && tx) md0.content = tx.slice(0, 155);
    if (!$('link[rel=canonical]')) { var cn0 = document.createElement('link'); cn0.rel = 'canonical'; cn0.href = 'https://www.orvish.com/info/' + encodeURIComponent(pg.slug) + '/'; document.head.appendChild(cn0); }
    document.title = pg.title + ' – ORVISH'; el.innerHTML = '<h1 style="font-size:40px">' + esc(pg.title) + '</h1>' + md(pg.body);
  }
  /* order helpers shared by the tracking page and the account page */
  var STEPS = ['New', 'Confirmed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'], STEP_LABEL = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'];
  function stInfo(st) { st = String(st || 'New').trim(); var i = STEPS.map(function (s) { return s.toLowerCase(); }).indexOf(st.toLowerCase()); return { st: st, i: i, cls: /cancel/i.test(st) ? ' bad' : /return|refund/i.test(st) ? ' warn' : /delivered/i.test(st) ? ' ok' : '', off: i < 0 }; }
  function stepsHTML(i) { return STEP_LABEL.map(function (s, k) { return '<li class="' + (k <= i ? 'on' : '') + '"><i></i><span>' + s + '</span></li>'; }).join(''); }
  function itemRows(list, text) {
    if (typeof list === 'string') { try { list = JSON.parse(list || '[]'); } catch (e) { list = []; } }
    list = (list || []).filter(function (x) { return x && x.title; });
    if (!list.length) return text ? '<p class="oi-text">' + esc(text) + '</p>' : '';
    return list.map(function (it) { return '<div class="oi"><img src="' + esc(it.image || '/images/perfume-1.svg') + '" alt="" loading="lazy"><div><b>' + esc(it.title) + '</b><small>Qty ' + esc(it.qty || 1) + '</small></div><span>' + money(Number(it.price || 0) * Number(it.qty || 1)) + '</span></div>'; }).join('');
  }
  function reviewLinks(list, itemsText, oid, ph) {
    if (typeof list === 'string') { try { list = JSON.parse(list || '[]'); } catch (e) { list = []; } }
    var ids = (list || []).map(function (x) { return x.id; });
    var bought = P.filter(function (pp) { return ids.indexOf(pp.id) > -1 || (!ids.length && String(itemsText || '').toLowerCase().indexOf(pp.title.toLowerCase()) > -1); });
    return bought.length ? '<div class="revlinks"><b>Bought it? Share your review</b>' + bought.map(function (pp) { return '<a class="btn secondary" href="' + purl(pp.id) + '?oid=' + encodeURIComponent(oid) + '&ph=' + encodeURIComponent(ph) + '#reviews">Review ' + esc(pp.title) + '</a>'; }).join('') + '</div>' : '';
  }
  /* return request (the order script checks the order is delivered and still inside the return window) */
  function returnBox(box, id, ph, d, onDone) {
    if (!box) return;
    if (!d || !d.can_return) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="retbar"><span>Not happy with it? You can ask for a return' + (d.return_until ? ' until <b>' + esc(d.return_until) + '</b>' : '') + '. <a class="link" href="/info/refund-policy/">Return policy</a></span><button class="btn secondary" type="button">Request a return</button></div>';
    $('button', box).onclick = function () {
      box.innerHTML = '<form class="retform"><h6>Request a return</h6><div class="field"><label>Reason</label><select name="why" required><option value="">Choose a reason</option><option>Damaged or leaking</option><option>Wrong item received</option><option>Not as described</option><option>Changed my mind</option><option>Other</option></select></div><div class="field"><label>Tell us more (optional)</label><textarea name="more" rows="2" maxlength="200"></textarea></div><div class="msg err"></div><div class="retact"><button class="btn" type="submit">Send request</button><button class="btn secondary" type="button" data-x>Cancel</button></div></form>';
      $('[data-x]', box).onclick = function () { returnBox(box, id, ph, d, onDone); };
      $('form', box).onsubmit = function (e) {
        e.preventDefault(); var f = Object.fromEntries(new FormData(e.target)), m = $('.msg', box), b = $('button[type=submit]', box);
        b.disabled = true; b.textContent = 'Sending…'; m.textContent = '';
        fetch(S.order_webhook_url + '?action=return_request&order_id=' + encodeURIComponent(id) + '&phone=' + encodeURIComponent(ph) + '&reason=' + encodeURIComponent(f.why + (f.more ? ' – ' + f.more : '')) + '&_=' + Date.now()).then(function (x) { return x.json(); }).then(function (r) {
          if (r && r.ok) { box.innerHTML = '<p class="retok">Return requested. We will review it and contact you about the next steps.</p>'; if (onDone) onDone(); return; }
          b.disabled = false; b.textContent = 'Send request';
          m.textContent = r && r.error === 'window_closed' ? 'Sorry, the return window for this order has closed.' : r && r.error === 'not_delivered' ? 'A return can be requested only after the order is delivered.' : 'Could not send the request. Please try again or contact us.';
        }).catch(function () { b.disabled = false; b.textContent = 'Send request'; m.textContent = 'Could not send the request. Please check your connection and try again.'; });
      };
    };
  }
  /* order tracking (looks the order up in the Google Sheet through the Apps Script web app) */
  function track() {
    var el = $('#track-body'), mine = store.get('orvish_orders', []), qph = (qs.get('ph') || '').replace(/\D/g, '');
    el.innerHTML = '<h1>Track your order</h1><p class="sub">Enter your order ID and the phone number you used when ordering.</p><form id="tf" class="tf"><div class="field"><label>Order ID</label><input name="id" required placeholder="ORV-261107-AB12" value="' + esc(qs.get('id') || '') + '"></div><div class="field"><label>Phone number</label><input name="phone" type="tel" required placeholder="10-digit mobile number" value="' + esc(qph || (mine[0] ? mine[0].phone : '')) + '"></div><button class="btn block" type="submit">Track order</button></form><div id="tres"></div>' +
      (mine.length ? '<h3 style="margin-top:30px">Orders placed on this device</h3><div class="mine">' + mine.map(function (o) { return '<button data-id="' + esc(o.id) + '" data-ph="' + esc(o.phone) + '"><b>' + esc(o.id) + '</b><span>' + money(o.total) + ' · ' + new Date(o.date).toLocaleDateString('en-IN') + '</span></button>'; }).join('') + '</div>' : '');
    function look(id, phone) {
      var r = $('#tres'), ph = String(phone).replace(/\D/g, ''); if (!S.order_webhook_url) { r.innerHTML = '<p class="msg">Tracking is not available right now.</p>'; return; }
      r.innerHTML = '<p class="msg">Looking up your order…</p>';
      fetch(S.order_webhook_url + '?action=track&order_id=' + encodeURIComponent(id.trim()) + '&phone=' + encodeURIComponent(ph) + '&_=' + Date.now()).then(function (x) { return x.json(); }).then(function (d) {
        if (!d || !d.found) { r.innerHTML = '<p class="msg err">We could not find an order with these details. Please check the order ID and phone number, or <a class="link" href="' + (waLink('Hi, I need help with order ' + id) || '/info/contact/') + '">contact us</a>.</p>'; return; }
        var s = stInfo(d.order_status);
        r.innerHTML = '<div class="tcard"><div class="th"><div><small>Order</small><b>' + esc(d.order_id) + '</b></div><span class="pill' + s.cls + '">' + esc(s.st) + '</span></div>' +
          (s.off ? '' : '<ol class="steps">' + stepsHTML(s.i) + '</ol>') + '<div class="ois">' + itemRows(d.items_json, d.items) + '</div>' +
          '<div class="row"><span>Placed on</span><span>' + esc(d.date) + ' ' + esc(d.time || '') + '</span></div><div class="row"><span>Total</span><span>' + money(d.total) + '</span></div><div class="row"><span>Payment</span><span>' + esc(d.payment_status) + '</span></div>' + (d.tracking ? '<div class="row"><span>Courier tracking</span><span>' + esc(d.tracking) + '</span></div>' : '') +
          '<div class="ret"></div>' + (/delivered/i.test(s.st) ? reviewLinks(d.items_json, d.items, d.order_id, ph) : '') + '</div>';
        returnBox($('.ret', r), d.order_id, ph, d, function () { $('.pill', r).className = 'pill warn'; $('.pill', r).textContent = 'Return requested'; var o = $('.steps', r); if (o) o.remove(); });
      }).catch(function () { r.innerHTML = '<p class="msg err">Could not load the status right now. Please try again in a moment.</p>'; });
    }
    $('#tf').addEventListener('submit', function (e) { e.preventDefault(); var f = Object.fromEntries(new FormData(e.target)); look(f.id, f.phone); });
    $$('.mine button').forEach(function (b) { b.onclick = function () { $('#tf').elements.id.value = b.dataset.id; $('#tf').elements.phone.value = b.dataset.ph; look(b.dataset.id, b.dataset.ph); }; });
    if (qs.get('id') && (qph || mine[0])) look(qs.get('id'), qph || mine[0].phone);
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
        el.classList.remove('wide');
        el.innerHTML = '<div class="authcard"><h1>' + (mode === 'in' ? 'Welcome back' : 'Create your account') + '</h1><p class="sub">' + (mode === 'in' ? 'Log in to see your orders, track deliveries and check out faster.' : 'Save your address, track every order and check out faster.') + '</p><form id="af">' + (mode === 'up' ? '<div class="field"><label>Full name</label><input name="name" required autocomplete="name"></div>' : '') +
          '<div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Password</label><input name="pw" type="password" required minlength="6" autocomplete="' + (mode === 'in' ? 'current-password' : 'new-password') + '"></div>' +
          '<button class="btn block" type="submit">' + (mode === 'in' ? 'Log in' : 'Create account') + '</button></form><div id="amsg" class="msg err"></div>' +
          (mode === 'in' ? '<p style="text-align:right;margin:6px 0"><button class="link lnk" id="forgot">Forgot password?</button></p>' : '') +
          '<div class="or"><span>or</span></div><button class="btn secondary block" id="gbtn">Continue with Google</button><button class="btn secondary block" id="pbtn" style="margin-top:8px">Continue with phone number</button>' +
          '<p style="text-align:center;margin-top:18px">' + (mode === 'in' ? 'New customer? <button class="link lnk" id="sw">Create an account</button>' : 'Already have an account? <button class="link lnk" id="sw">Log in</button>') + '</p>' +
          '<p style="text-align:center"><a class="link" href="/track">Track an order without an account</a></p></div>';
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
        el.innerHTML = '<div class="authcard"><h1>Log in with phone</h1><p class="sub">We will send a 6-digit code by SMS.</p><form id="pf"><div class="field"><label>Mobile number</label><input name="phone" type="tel" required autocomplete="tel" placeholder="+91 98765 43210" value="+91 "></div><div id="recap"></div><button class="btn block" type="submit" id="psend">Send code</button></form><div id="amsg" class="msg err"></div><p style="text-align:center;margin-top:18px"><button class="link lnk" id="back">Back to other login options</button></p></div>';
        $('#back').onclick = paint;
        var rv = null;
        $('#pf').onsubmit = function (e) {
          e.preventDefault(); var m = $('#amsg'); m.textContent = ''; var raw = e.target.elements.phone.value.trim(), dg = raw.replace(/\D/g, '');
          var num = raw.charAt(0) === '+' ? '+' + dg : (dg.length === 10 ? '+91' + dg : '+' + dg);
          var btn = $('#psend'); btn.disabled = true; btn.textContent = 'Sending…';
          try { if (!rv) rv = new firebase.auth.RecaptchaVerifier('recap', { size: 'invisible' }); } catch (x) { m.textContent = err(x); btn.disabled = false; btn.textContent = 'Send code'; return; }
          FB.auth.signInWithPhoneNumber(num, rv).then(function (conf) {
            el.innerHTML = '<div class="authcard"><h1>Enter the code</h1><p class="sub">Sent to ' + esc(num) + '</p><form id="cf"><div class="field"><label>6-digit code</label><input name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" style="letter-spacing:.4em;font-size:20px;text-align:center"></div><button class="btn block" type="submit">Verify and log in</button></form><div id="amsg" class="msg err"></div><p style="text-align:center;margin-top:18px"><button class="link lnk" id="back">Use a different number</button></p></div>';
            $('#back').onclick = phoneForm;
            $('#cf').onsubmit = function (ev) { ev.preventDefault(); $('#amsg').textContent = ''; conf.confirm(ev.target.elements.code.value.trim()).catch(function (x) { $('#amsg').textContent = err(x); }); };
          }).catch(function (x) { m.textContent = err(x); btn.disabled = false; btn.textContent = 'Send code'; try { rv.clear(); } catch (z) {} rv = null; $('#recap').innerHTML = ''; });
        };
      }
      paint();
    }
    function dash(u) {
      el.classList.add('wide');
      var nm = u.displayName || saved('name') || '', first = nm.trim().split(' ')[0];
      el.innerHTML = '<div class="acct-head"><div class="av">' + esc((nm || u.email || 'O').trim().charAt(0).toUpperCase()) + '</div><div class="who"><h1>' + (first ? 'Hello, ' + esc(first) : 'My account') + '</h1><p>' + esc([u.email, u.phoneNumber].filter(Boolean).join(' · ')) + '</p></div><button class="btn secondary" id="lo">Log out</button></div>' +
        '<div class="acct-tabs"><button class="on" data-tab="orders">My orders</button><button data-tab="details">Address &amp; details</button></div><div id="tab-orders"><p class="msg">Loading your orders…</p></div><div id="tab-details" hidden></div>';
      $('#lo').onclick = function () { el.classList.remove('wide'); FB.auth.signOut(); };
      $$('.acct-tabs button', el).forEach(function (b) { b.onclick = function () { $$('.acct-tabs button', el).forEach(function (x) { x.classList.toggle('on', x === b); }); $('#tab-orders').hidden = b.dataset.tab !== 'orders'; $('#tab-details').hidden = b.dataset.tab !== 'details'; }; });
      /* saved address and contact details */
      function drawDetails() {
        var g = function (k) { return esc(saved(k)); };
        $('#tab-details').innerHTML = '<form id="df" class="acct-card"><h3>Delivery details</h3><p class="sub">We fill these in for you at checkout, so you never have to type them again.</p>' +
          '<div class="two"><div class="field"><label>Full name</label><input name="name" autocomplete="name" value="' + (g('name') || esc(u.displayName || '')) + '"></div><div class="field"><label>Phone</label>' + phoneField(saved('phone') || u.phoneNumber || '', false) + '</div></div>' +
          '<div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" value="' + esc(u.email || saved('email')) + '"' + (u.email ? ' readonly' : '') + '></div>' +
          '<div class="locbtns"><button type="button" class="btn secondary" id="df-here">' + ico('locate') + 'Use my current location</button><button type="button" class="btn secondary" id="df-map">' + ico('pin') + 'Choose on map</button></div><input type="hidden" name="loc" value="' + g('loc') + '">' +
          '<div class="field"><label>Address (house or flat no., building, street)</label><textarea name="address" rows="2" autocomplete="street-address">' + g('address') + '</textarea></div>' +
          '<div class="two"><div class="field"><label>City</label><input name="city" value="' + g('city') + '"></div><div class="field"><label>PIN code</label><input name="pin" pattern="[0-9]{6}" inputmode="numeric" value="' + g('pin') + '"></div></div>' +
          '<div class="msg" id="dmsg"></div><button class="btn" type="submit">Save details</button></form>';
        var dfm = $('#df'), dset = function (pl) { if (pl.address) dfm.address.value = pl.address; if (pl.city) dfm.city.value = pl.city; if (pl.pin) dfm.pin.value = pl.pin; dfm.loc.value = pl.loc || ''; };
        $('#df-here').onclick = function () { pickLocation(dset, true); }; $('#df-map').onclick = function () { pickLocation(dset, false); };
        $('#df').onsubmit = function (e) {
          e.preventDefault(); var m = $('#dmsg'), b = $('#df button[type=submit]'); b.disabled = true; m.className = 'msg'; m.textContent = 'Saving…';
          var fd = Object.fromEntries(new FormData(e.target)); fd.phone = fullPhone(fd.phone);
          saveProfile(fd).then(function (ok) { b.disabled = false; m.className = ok ? 'msg' : 'msg err'; m.textContent = ok ? 'Saved. These details will be filled in at checkout.' : 'Saved on this device only. We could not save to your account right now.'; });
        };
      }
      loadProfile().then(drawDetails);
      /* orders: shown at once from the copy saved on this device, then refreshed in the background with one request */
      var ck = 'orvish_acct_' + u.uid, mem = store.get(ck, null) || { orders: null, status: {} }, box = $('#tab-orders');
      function paint(c, x, d) {
        var pill = $('.st', c), s = stInfo(d && d.found ? d.order_status : 'New');
        pill.className = 'pill st' + (d ? s.cls : ' wait'); pill.textContent = d ? (d.found ? s.st : 'Received') : 'Updating…';
        var ol = $('.steps', c); ol.hidden = s.off; if (!s.off) ol.innerHTML = stepsHTML(d && d.found ? s.i : 0);
        if (!d || !d.found) return;
        $('.ps', c).textContent = d.payment_status || '–';
        $('.trk', c).hidden = !d.tracking; $('.trk b', c).textContent = d.tracking || '';
        returnBox($('.ret', c), x.order_id, x.phone, d, function () { d.order_status = 'Return requested'; d.can_return = false; mem.status[x.order_id] = d; store.set(ck, mem); paint(c, x, d); });
        $('.rvl', c).innerHTML = /delivered/i.test(s.st) ? reviewLinks(x.items_detail, x.items, x.order_id, x.phone) : '';
      }
      function show(o) {
        if (!o.length) { box.innerHTML = '<div class="acct-card acct-empty"><h3>No orders yet</h3><p class="sub">When you place an order while logged in, it will appear here with its live status.</p><a class="btn" href="/shop">Start shopping</a></div>'; return; }
        box.innerHTML = o.map(function (x) {
          return '<article class="ocard" data-id="' + esc(x.order_id) + '"><header><div><small>Placed on ' + new Date(x.created).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + '</small><b>' + esc(x.order_id) + '</b></div><span class="pill st wait">Updating…</span></header>' +
            '<ol class="steps"></ol><div class="ois">' + itemRows(x.items_detail, x.items) + '</div>' +
            '<footer><div><small>Total</small><b>' + money(x.total) + '</b></div><div><small>Payment</small><b class="ps">–</b></div><div class="trk" hidden><small>Courier tracking</small><b></b></div><a class="btn secondary" href="/track?id=' + encodeURIComponent(x.order_id) + '&ph=' + encodeURIComponent(x.phone) + '">Track order</a></footer><div class="ret"></div><div class="rvl"></div></article>';
        }).join('');
        $$('.ocard', box).forEach(function (c, n) { paint(c, o[n], mem.status[o[n].order_id] || null); });
      }
      function refresh(o) {
        if (!o.length) return;
        var cards = $$('.ocard', box), set = function (n, d) { mem.status[o[n].order_id] = d; if (cards[n]) paint(cards[n], o[n], d); };
        var one = function (n) { return fetch(S.order_webhook_url + '?action=track&order_id=' + encodeURIComponent(o[n].order_id) + '&phone=' + encodeURIComponent(o[n].phone) + '&_=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) { set(n, d); }).catch(function () { if (!mem.status[o[n].order_id]) set(n, { found: false }); }); };
        if (!S.order_webhook_url) { o.forEach(function (x, n) { set(n, { found: false }); }); return; }
        var list = o.slice(0, 25);
        fetch(S.order_webhook_url + '?action=track_many&orders=' + encodeURIComponent(list.map(function (x) { return x.order_id + ':' + x.phone; }).join(',')) + '&_=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.orders) return Promise.all(list.map(function (x, n) { return one(n); }));   /* older order script: ask one by one */
          list.forEach(function (x, n) { set(n, d.orders[x.order_id] || { found: false }); });
        }).catch(function () { list.forEach(function (x, n) { if (!mem.status[x.order_id]) set(n, { found: false }); }); }).then(function () { store.set(ck, mem); });
      }
      if (mem.orders) show(mem.orders); else box.innerHTML = '<div class="ocard sk"><i></i><i></i><i></i></div>';
      FB.db.collection('orders').where('uid', '==', u.uid).get().then(function (q) {
        var o = q.docs.map(function (d) { return d.data(); }).sort(function (a, b) { return b.created - a.created; });
        if (!mem.orders || JSON.stringify(mem.orders) !== JSON.stringify(o)) { mem.orders = o; show(o); }
        store.set(ck, mem); refresh(o);
      }).catch(function () { if (!mem.orders) box.innerHTML = '<p class="msg err">Could not load your orders. Please refresh.</p>'; });
    }
  }

  /* boot */
  Promise.all([fetchJSON('/data/site.json'), fetchJSON('/data/products.json'), fetchJSON('/data/pages.json'), fetchJSON('/data/home.json'), fetchJSON('/data/nav.json'), fetchJSON('/data/commerce.json')]).then(function (r) {
    S = Object.assign({}, r[0], r[3], r[4], r[5]); P = (r[1].products || []).filter(function (p) { return !p.hidden; }).map(function (p) { p.images = (p.images && p.images.length) ? p.images : ['/images/perfume-1.svg']; return p; }); PAGES = r[2].pages || [];
    cart = store.get('orvish_cart', []).map(function (l) { return { id: l.id, v: l.v || '', q: l.q }; });
    applyTheme(); metaInit(); shell(); events();
    var pg = document.body.dataset.page; ({ home: home, shop: shop, product: product, page: page, track: track, account: account }[pg] || function () {})(); railNav();
    $$('a[href^="/page?p="]').forEach(function (a) { a.setAttribute('href', '/info/' + a.getAttribute('href').slice(8).split('&')[0] + '/'); });   /* menu and footer links go to the real info pages */
    document.body.classList.add('ready'); logVisit('view', document.body.dataset.page === 'product' ? pageId() : '');
    if (document.body.dataset.page !== 'product') loadReviews().then(fillRatings);
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .08 }); $$('main .section, .services, .tile, .faq, .bigmq').forEach(function (e) { e.classList.add('rv'); io.observe(e); }); }
    if (S.firebase_config && S.firebase_config.apiKey && document.body.dataset.page !== 'account') fbReady();
  }).catch(function (e) { document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Could not load store data. Please refresh. (' + esc(e.message) + ')</p>'; });
})();
