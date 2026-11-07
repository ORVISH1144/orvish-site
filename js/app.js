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
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>'
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

  /* cart */
  function saveCart() { store.set('orvish_cart', cart); renderCart(); }
  function findP(id) { return P.filter(function (p) { return p.id === id; })[0]; }
  function addToCart(id, q) {
    var p = findP(id); if (!p || p.in_stock === false) return;
    var l = cart.filter(function (x) { return x.id === id; })[0];
    if (l) l.q += q || 1; else cart.push({ id: id, q: q || 1 });
    saveCart(); toast('Added to cart');
  }
  function totals() {
    var items = 0, sub = 0;
    cart.forEach(function (l) { var p = findP(l.id); if (p) { items += l.q; sub += p.price * l.q; } });
    var off = 0;
    if (discount && items >= (discount.min_items || 1)) off = Math.round(sub * discount.percent) / 100;
    var after = sub - off;
    var ship = items === 0 ? 0 : (after >= (S.free_shipping_above || 0) && S.free_shipping_above ? 0 : (S.shipping_fee || 0));
    return { items: items, sub: sub, off: off, ship: ship, total: after + ship };
  }
  function renderCart() {
    cart = cart.filter(function (l) { return findP(l.id); });
    var t = totals();
    $$('.cart-count').forEach(function (e) { e.textContent = t.items; e.style.display = t.items ? 'grid' : 'none'; });
    var body = $('#cart-body'), foot = $('#cart-foot'); if (!body) return;
    if (!cart.length) { body.innerHTML = '<div class="empty">Your cart is empty.<br><br><a class="btn" href="/shop">Continue shopping</a></div>'; foot.innerHTML = ''; return; }
    body.innerHTML = cart.map(function (l) {
      var p = findP(l.id);
      return '<div class="line"><img src="' + esc(p.images[0]) + '" alt=""><div><div class="t">' + esc(p.title) + '</div><div class="price" style="padding:0">' + money(p.price) + '</div>' +
        '<div class="qty" style="margin-top:6px"><button data-dec="' + esc(p.id) + '">−</button><span>' + l.q + '</span><button data-inc="' + esc(p.id) + '">+</button></div>' +
        '<br><button class="rm" data-rm="' + esc(p.id) + '">Remove</button></div><div class="price">' + money(p.price * l.q) + '</div></div>';
    }).join('');
    foot.innerHTML = '<div class="disc"><input id="dc" placeholder="Discount code" value="' + esc(discount ? discount.code : '') + '"><button class="btn secondary" id="dc-apply" style="padding:9px 16px">Apply</button></div><div class="msg" id="dc-msg"></div>' +
      '<div class="row"><span>Subtotal</span><span>' + money(t.sub) + '</span></div>' +
      (t.off ? '<div class="row"><span>Discount (' + esc(discount.code) + ')</span><span>−' + money(t.off) + '</span></div>' : '') +
      '<div class="row"><span>Shipping</span><span>' + (t.ship ? money(t.ship) : 'Free') + '</span></div>' +
      '<div class="row total"><span>Total</span><span>' + money(t.total) + '</span></div>' +
      '<button class="btn block" id="checkout" style="margin-top:10px">Checkout</button>';
  }
  function openCart(o) { $('#cart').classList.toggle('open', o); $('#ov').classList.toggle('on', o); }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 1800); }

  /* checkout */
  function openCheckout() {
    var t = totals(); if (!t.items) return;
    var m = $('#checkout-modal'), cfg = !!S.razorpay_key_id;
    m.innerHTML = '<div class="box"><button class="icon-btn" style="position:absolute;right:8px;top:8px;color:var(--ink)" data-close-modal>' + ico('close') + '</button><h4>Delivery details</h4>' +
      '<form id="co-form"><div class="two"><div class="field"><label>Full name</label><input name="name" required></div><div class="field"><label>Phone</label><input name="phone" type="tel" required pattern="[0-9+ ]{10,15}"></div></div>' +
      '<div class="field"><label>Email</label><input name="email" type="email" required></div>' +
      '<div class="field"><label>Address</label><textarea name="address" rows="2" required></textarea></div>' +
      '<div class="two"><div class="field"><label>City</label><input name="city" required></div><div class="field"><label>PIN code</label><input name="pin" required pattern="[0-9]{6}" inputmode="numeric"></div></div>' +
      '<div class="row total"><span>Total</span><span>' + money(t.total) + '</span></div>' +
      '<button class="btn block" type="submit" style="margin-top:10px">' + (cfg ? 'Pay ' + money(t.total) : 'Send order request') + '</button>' +
      (cfg ? '' : '<p class="msg">Online payment is not switched on yet. Your order request will be sent to us by email and we will contact you to confirm and arrange payment.</p>') + '</form></div>';
    m.classList.add('open'); $('#ov').classList.add('on');
    $('#co-form').addEventListener('submit', function (e) { e.preventDefault(); var f = Object.fromEntries(new FormData(e.target)); cfg ? payRazorpay(f, t) : emailOrder(f, t); });
  }
  function orderLines() { return cart.map(function (l) { var p = findP(l.id); return l.q + ' x ' + p.title + ' (' + money(p.price) + ')'; }); }
  function sendOrder(f, t, status, payId) {
    var url = S.order_webhook_url; if (!url) return null;
    var id = 'ORV-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var body = new URLSearchParams({ date: new Date().toISOString().slice(0, 10), order_id: id, name: f.name, phone: f.phone, email: f.email, address: f.address, city: f.city, pin: f.pin, items: orderLines().join('; '), total: String(t.total), payment_status: status, order_status: 'New', payment_id: payId || '' });
    try { fetch(url, { method: 'POST', mode: 'no-cors', body: body }).catch(function () {}); } catch (e) {}
    return id;
  }
  function emailOrder(f, t) {
    var oid = sendOrder(f, t, 'Pending');
    if (oid) { done('Thank you! Your order ' + oid + ' has been received. We will contact you on ' + f.phone + ' to confirm it and arrange payment.'); return; }
    var body = 'New order request\n\n' + orderLines().join('\n') + '\n\nTotal: ' + money(t.total) + '\n\nName: ' + f.name + '\nPhone: ' + f.phone + '\nEmail: ' + f.email + '\nAddress: ' + f.address + ', ' + f.city + ' - ' + f.pin;
    location.href = 'mailto:' + (S.support_email || '') + '?subject=' + encodeURIComponent('Order request from ' + f.name) + '&body=' + encodeURIComponent(body);
    done('Thanks! Your email app should open with the order details. Please send it to complete your request.');
  }
  function payRazorpay(f, t) {
    var go = function () {
      var rz = new window.Razorpay({
        key: S.razorpay_key_id, amount: Math.round(t.total * 100), currency: 'INR', name: S.store_name || 'ORVISH', description: orderLines().join(', ').slice(0, 250),
        prefill: { name: f.name, email: f.email, contact: f.phone },
        notes: { items: orderLines().join(' | ').slice(0, 250), address: (f.address + ', ' + f.city + ' - ' + f.pin).slice(0, 250), phone: f.phone },
        theme: { color: '#761941' },
        handler: function (r) { sendOrder(f, t, 'Paid', r.razorpay_payment_id); done('Payment successful! Payment ID: ' + r.razorpay_payment_id + '. We will email you the order confirmation.'); }
      });
      rz.open();
    };
    if (window.Razorpay) return go();
    var s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = go; s.onerror = function () { toast('Could not load payment. Try again.'); }; document.head.appendChild(s);
  }
  function done(msg) {
    cart = []; discount = null; saveCart(); openCart(false);
    $('#checkout-modal').innerHTML = '<div class="box"><h4>Thank you</h4><p>' + esc(msg) + '</p><a class="btn" href="/">Back to home</a></div>';
  }

  /* shell */
  function shell() {
    var menu = (S.menu || []).map(function (m) { return '<a href="' + esc(m.url) + '">' + esc(m.label) + '</a>'; }).join('');
    var anns = (S.announcements || []).filter(function (x) { return x && String(x).trim(); }); if (!anns.length) $('#announce').style.display = 'none';
    $('#announce').innerHTML = anns.map(function (a, i) { return '<span class="' + (i ? '' : 'on') + '">' + esc(a) + '</span>'; }).join('');
    var ai = 0, sp = $$('#announce span'); if (sp.length > 1) setInterval(function () { sp[ai].classList.remove('on'); ai = (ai + 1) % sp.length; sp[ai].classList.add('on'); }, 4000);
    $('#header').innerHTML = '<div class="wrap"><div style="display:flex;align-items:center;gap:20px"><button class="icon-btn burger" id="burger" aria-label="Menu">' + ico('menu') + '</button><nav class="nav">' + menu + '</nav></div>' +
      '<a class="logo" href="/">' + logoHTML() + '</a><div class="actions"><button class="icon-btn" id="open-search" aria-label="Search">' + ico('search') + '</button><button class="icon-btn" id="open-cart" aria-label="Cart">' + ico('bag') + '<span class="cart-count"></span></button></div></div>';
    var li = function (a) { return (a || []).map(function (l) { return '<li><a href="' + esc(l.url) + '">' + esc(l.label) + '</a></li>'; }).join(''); };
    $('#footer').innerHTML = '<div class="wrap"><div class="f-grid"><div><div class="logo">' + logoHTML() + '</div><p style="font-size:13px;color:#555">Email : <a href="mailto:' + esc(S.support_email) + '">' + esc(S.support_email) + '</a></p></div>' +
      '<div><h6>Explore</h6><ul>' + li(S.footer_explore) + '</ul></div><div><h6>Policies</h6><ul>' + li(S.footer_policies) + '</ul></div>' +
      '<div><h6><em>Get In Touch</em></h6><p style="font-size:13px;margin:0">' + esc(S.footer_newsletter_text) + '</p><form class="news" id="news"><input type="email" placeholder="Email" required><button class="btn" type="submit">Sign up</button></form></div></div>' +
      '<div class="copy">© ' + new Date().getFullYear() + ' ' + esc(S.store_name) + '. All rights reserved.</div></div>';
    document.body.insertAdjacentHTML('beforeend',
      '<div class="mobile-nav" id="mnav">' + menu + '</div><div class="overlay" id="ov"></div>' +
      '<aside class="drawer" id="cart"><div class="d-head"><h4>Cart</h4><button class="icon-btn" style="color:var(--ink)" id="close-cart">' + ico('close') + '</button></div><div class="d-body" id="cart-body"></div><div class="d-foot" id="cart-foot"></div></aside>' +
      '<div class="modal" id="checkout-modal"></div><div class="search-box" id="sb"><div class="in"><input id="sq" placeholder="Search products" autocomplete="off"><button class="icon-btn" style="color:var(--ink)" id="close-search">' + ico('close') + '</button></div><div class="hits" id="hits"></div></div><div class="toast" id="toast"></div>' +
      '<nav class="bnav" id="bnav"><a href="/">' + ico('home') + 'Home</a><a href="/shop">' + ico('grid') + 'Shop</a><button id="b-search">' + ico('search') + 'Search</button><button id="b-cart">' + ico('bag') + 'Cart<span class="cart-count"></span></button></nav>' +
      (waLink() ? '<a class="wa" href="' + waLink() + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><img src="images/whatsapp.png" alt="WhatsApp"></a>' : ''));
    document.title = (document.title && document.title !== 'ORVISH' ? document.title + ' – ' : '') + (S.store_name || 'ORVISH');
    renderCart();
  }
  function events() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('button,a,[data-close-modal]'); if (!t) return;
      if (t.id === 'open-cart' || t.id === 'b-cart') openCart(true);
      else if (t.id === 'close-cart') openCart(false);
      else if (t.id === 'burger') { $('#mnav').classList.add('open'); $('#ov').classList.add('on'); }
      else if (t.id === 'open-search' || t.id === 'b-search') { $('#sb').classList.add('open'); $('#sq').focus(); }
      else if (t.id === 'close-search') $('#sb').classList.remove('open');
      else if (t.hasAttribute('data-close-modal')) { $('#checkout-modal').classList.remove('open'); $('#ov').classList.remove('on'); }
      else if (t.dataset.inc) { cart.filter(function (l) { return l.id === t.dataset.inc; })[0].q++; saveCart(); }
      else if (t.dataset.dec) { var l = cart.filter(function (x) { return x.id === t.dataset.dec; })[0]; l.q = Math.max(1, l.q - 1); saveCart(); }
      else if (t.dataset.rm) { cart = cart.filter(function (l) { return l.id !== t.dataset.rm; }); saveCart(); }
      else if (t.dataset.add) { e.preventDefault(); addToCart(t.dataset.add, 1); }
      else if (t.id === 'dc-apply') {
        var c = ($('#dc').value || '').trim().toUpperCase(), f = (S.discount_codes || []).filter(function (d) { return d.code.toUpperCase() === c; })[0], tt = totals();
        if (!c) { discount = null; saveCart(); return; }
        if (!f) { $('#dc-msg').textContent = 'Invalid code'; return; }
        if (tt.items < (f.min_items || 1)) { $('#dc-msg').textContent = 'Add at least ' + f.min_items + ' items to use this code'; return; }
        discount = f; saveCart(); toast('Code applied');
      } else if (t.id === 'checkout') openCheckout();
    });
    $('#ov').addEventListener('click', function () { openCart(false); $('#mnav').classList.remove('open'); $('#checkout-modal').classList.remove('open'); $('#ov').classList.remove('on'); });
    $('#news').addEventListener('submit', function (e) { e.preventDefault(); location.href = 'mailto:' + S.support_email + '?subject=Subscribe&body=Please add ' + encodeURIComponent(e.target.querySelector('input').value) + ' to your mailing list.'; });
    $('#sq').addEventListener('input', function (e) {
      var q = e.target.value.toLowerCase().trim();
      $('#hits').innerHTML = !q ? '' : P.filter(function (p) { return (p.title + ' ' + (p.short_description || '')).toLowerCase().indexOf(q) > -1; }).slice(0, 8).map(function (p) {
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
  function cardHTML(p) {
    var sale = p.compare_at_price && p.compare_at_price > p.price, so = p.in_stock === false;
    return '<a class="card" href="/product?id=' + encodeURIComponent(p.id) + '"><div class="img">' + (so ? '<span class="badge so">Sold out</span>' : sale ? '<span class="badge">Sale</span>' : '') +
      '<img loading="lazy" src="' + esc(p.images[0]) + '" alt="' + esc(p.title) + '">' + (so ? '' : '<button class="plus" data-add="' + esc(p.id) + '" aria-label="Add to cart">' + ico('plus') + '</button>') + '</div>' +
      '<h5>' + esc(p.title) + '</h5><div class="price">' + money(p.price) + (sale ? '<s>' + money(p.compare_at_price) + '</s>' : '') + '</div></a>';
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
    function auto() { clearInterval(timer); timer = setInterval(function () { go(cur + 1); }, 4000); }
    if (slides.length > 1) { $('.s-prev').onclick = function () { go(cur - 1); auto(); }; $('.s-next').onclick = function () { go(cur + 1); auto(); }; dots.forEach(function (d, i) { d.onclick = function () { go(i); auto(); }; }); auto(); }
    if (!(S.ticker || []).length) $('#ticker').style.display = 'none';
    var items = (S.ticker || []).map(function (t) { return '<div class="t-item">' + ico(t.icon) + esc(t.text) + '</div>'; }).join('');
    $('#ticker').innerHTML = '<div class="track">' + items + items + items + items + '</div>';
    var feat = P.filter(function (p) { return p.featured !== false; }).slice(0, S.products_on_home || 8);
    $('#home-heading').textContent = S.home_heading == null ? 'Our products' : S.home_heading;
    $('#featured').innerHTML = feat.length ? feat.map(cardHTML).join('') : '<p class="empty" style="grid-column:1/-1">No products yet.</p>';
  }
  function shop() {
    var cols = Array.from(new Set(P.map(function (p) { return p.collection || 'all'; })));
    var q = qs.get('q') || '', c = qs.get('c') || '';
    $('#toolbar').innerHTML = '<input id="f-q" placeholder="Search products" value="' + esc(q) + '"><select id="f-c"><option value="">All collections</option>' + cols.filter(function (x) { return x !== 'all'; }).map(function (x) { return '<option ' + (x === c ? 'selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<select id="f-s"><option value="">Featured</option><option value="pa">Price: low to high</option><option value="pd">Price: high to low</option><option value="az">A–Z</option></select>';
    function draw() {
      var qq = $('#f-q').value.toLowerCase(), cc = $('#f-c').value, ss = $('#f-s').value;
      var l = P.filter(function (p) { return (!cc || p.collection === cc) && (!qq || (p.title + ' ' + (p.short_description || '')).toLowerCase().indexOf(qq) > -1); });
      if (ss === 'pa') l.sort(function (a, b) { return a.price - b.price; }); if (ss === 'pd') l.sort(function (a, b) { return b.price - a.price; }); if (ss === 'az') l.sort(function (a, b) { return a.title.localeCompare(b.title); });
      $('#shop-grid').innerHTML = l.length ? l.map(cardHTML).join('') : '<p class="empty" style="grid-column:1/-1">No products found.</p>';
    }
    $$('#toolbar input,#toolbar select').forEach(function (e) { e.addEventListener('input', draw); }); draw();
  }
  function product() {
    var p = findP(qs.get('id')), el = $('#pdp');
    if (!p) { el.innerHTML = '<p class="empty">Product not found. <a class="link" href="/shop">Back to shop</a></p>'; return; }
    document.title = p.title; var sale = p.compare_at_price && p.compare_at_price > p.price, so = p.in_stock === false, q = 1;
    el.innerHTML = '<div class="gallery"><div class="main"><img id="mi" src="' + esc(p.images[0]) + '" alt="' + esc(p.title) + '"></div>' + (p.images.length > 1 ? '<div class="thumbs">' + p.images.map(function (im, i) { return '<img class="' + (i ? '' : 'on') + '" src="' + esc(im) + '" alt="">'; }).join('') + '</div>' : '') + '</div>' +
      '<div><h1>' + esc(p.title) + '</h1><div class="price">' + money(p.price) + (sale ? '<s>' + money(p.compare_at_price) + '</s> <span class="badge" style="position:static;display:inline-block;margin-left:6px">Sale</span>' : '') + '</div>' +
      '<div>' + md(p.description) + '</div>' +
      (so ? '<p><strong>Sold out</strong></p>' : '<div class="qty" id="pq"><button data-d="-1">−</button><span>1</span><button data-d="1">+</button></div><div class="buy-row"><button class="btn secondary" id="add">Add to cart</button><button class="btn" id="buy">Buy it now</button></div>') +
      (p.details || []).map(function (d) { return '<details class="acc"><summary>' + esc(d.title) + '</summary><div>' + md(d.body) + '</div></details>'; }).join('') + '</div>';
    if (p.images.length > 1) { var gi = 0; swipe($('.gallery .main'), function (d) { gi = (gi + (d > 0 ? 1 : -1) + p.images.length) % p.images.length; $('#mi').src = p.images[gi]; $$('.thumbs img').forEach(function (x, i) { x.classList.toggle('on', i === gi); }); }); }
    $$('.thumbs img').forEach(function (t) { t.onclick = function () { $('#mi').src = t.src; $$('.thumbs img').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); }; });
    if (!so) {
      $$('#pq button').forEach(function (b) { b.onclick = function () { q = Math.max(1, q + Number(b.dataset.d)); $('#pq span').textContent = q; }; });
      $('#add').onclick = function () { addToCart(p.id, q); openCart(true); };
      $('#buy').onclick = function () { addToCart(p.id, q); openCheckout(); };
    }
    var wl = waLink('Hi, I want to order: ' + p.title + ' (' + money(p.price) + ') ' + location.href);
    if (wl) el.lastElementChild.insertAdjacentHTML('beforeend', '<a class="btn secondary block" style="margin:6px 0 16px" target="_blank" rel="noopener" href="' + wl + '"><img class="wa-i" src="images/whatsapp.png" alt="">Order on WhatsApp</a>');
    if (!so) { document.body.insertAdjacentHTML('beforeend', '<div class="sticky-buy"><div><div class="price" style="padding:0;font-size:16px">' + money(p.price) + '</div><div style="font:12px var(--font-accent);opacity:.7">' + esc(p.title) + '</div></div><button class="btn secondary" id="s-add">Add</button><button class="btn" id="s-buy">Buy now</button></div>');
      $('#s-add').onclick = function () { addToCart(p.id, q); openCart(true); }; $('#s-buy').onclick = function () { addToCart(p.id, q); openCheckout(); }; }
    var rel = P.filter(function (x) { return x.id !== p.id; }).slice(0, 4);
    if (rel.length) $('#related').innerHTML = rel.map(cardHTML).join('');
  }
  function page() {
    var pg = PAGES.filter(function (x) { return x.slug === qs.get('p'); })[0], el = $('#page-body');
    if (!pg) { el.innerHTML = '<h2>Page not found</h2>'; return; }
    document.title = pg.title; el.innerHTML = '<h1 style="font-size:40px">' + esc(pg.title) + '</h1>' + md(pg.body);
  }

  /* boot */
  Promise.all([fetchJSON('data/site.json'), fetchJSON('data/products.json'), fetchJSON('data/pages.json')]).then(function (r) {
    S = r[0]; P = (r[1].products || []).map(function (p) { p.images = (p.images && p.images.length) ? p.images : ['images/product-1.svg']; return p; }); PAGES = r[2].pages || [];
    cart = store.get('orvish_cart', []);
    applyTheme(); shell(); events();
    var pg = document.body.dataset.page; ({ home: home, shop: shop, product: product, page: page }[pg] || function () {})();
    document.body.classList.add('ready');
  }).catch(function (e) { document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Could not load store data. Please refresh. (' + esc(e.message) + ')</p>'; });
})();
