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
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>'
  };
  var ico = function (n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || ICONS.star) + '</svg>'; };
  var fetchJSON = function (u) { return fetch(u + '?v=' + Date.now()).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); };

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
    if (!cart.length) { body.innerHTML = '<div class="empty">Your cart is empty.<br><br><a class="btn" href="shop.html">Continue shopping</a></div>'; foot.innerHTML = ''; return; }
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
  function emailOrder(f, t) {
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
        handler: function (r) { done('Payment successful! Payment ID: ' + r.razorpay_payment_id + '. We will email you the order confirmation.'); }
      });
      rz.open();
    };
    if (window.Razorpay) return go();
    var s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = go; s.onerror = function () { toast('Could not load payment. Try again.'); }; document.head.appendChild(s);
  }
  function done(msg) {
    cart = []; discount = null; saveCart(); openCart(false);
    $('#checkout-modal').innerHTML = '<div class="box"><h4>Thank you</h4><p>' + esc(msg) + '</p><a class="btn" href="index.html">Back to home</a></div>';
  }

  /* shell */
  function shell() {
    var menu = (S.menu || []).map(function (m) { return '<a href="' + esc(m.url) + '">' + esc(m.label) + '</a>'; }).join('');
    $('#announce').innerHTML = (S.announcements || []).map(function (a, i) { return '<span class="' + (i ? '' : 'on') + '">' + esc(a) + '</span>'; }).join('');
    var ai = 0, sp = $$('#announce span'); if (sp.length > 1) setInterval(function () { sp[ai].classList.remove('on'); ai = (ai + 1) % sp.length; sp[ai].classList.add('on'); }, 4000);
    $('#header').innerHTML = '<div class="wrap"><div style="display:flex;align-items:center;gap:20px"><button class="icon-btn burger" id="burger" aria-label="Menu">' + ico('menu') + '</button><nav class="nav">' + menu + '</nav></div>' +
      '<a class="logo" href="index.html">' + esc(S.store_name || 'ORVISH') + '</a><div class="actions"><button class="icon-btn" id="open-search" aria-label="Search">' + ico('search') + '</button><button class="icon-btn" id="open-cart" aria-label="Cart">' + ico('bag') + '<span class="cart-count"></span></button></div></div>';
    var li = function (a) { return (a || []).map(function (l) { return '<li><a href="' + esc(l.url) + '">' + esc(l.label) + '</a></li>'; }).join(''); };
    $('#footer').innerHTML = '<div class="wrap"><div class="f-grid"><div><div class="logo">' + esc(S.store_name) + '</div><p style="font-size:13px;color:#555">Email : <a href="mailto:' + esc(S.support_email) + '">' + esc(S.support_email) + '</a></p></div>' +
      '<div><h6>Explore</h6><ul>' + li(S.footer_explore) + '</ul></div><div><h6>Policies</h6><ul>' + li(S.footer_policies) + '</ul></div>' +
      '<div><h6><em>Get In Touch</em></h6><p style="font-size:13px;margin:0">' + esc(S.footer_newsletter_text) + '</p><form class="news" id="news"><input type="email" placeholder="Email" required><button class="btn" type="submit">Sign up</button></form></div></div>' +
      '<div class="copy">© ' + new Date().getFullYear() + ' ' + esc(S.store_name) + '. All rights reserved.</div></div>';
    document.body.insertAdjacentHTML('beforeend',
      '<div class="mobile-nav" id="mnav">' + menu + '</div><div class="overlay" id="ov"></div>' +
      '<aside class="drawer" id="cart"><div class="d-head"><h4>Cart</h4><button class="icon-btn" style="color:var(--ink)" id="close-cart">' + ico('close') + '</button></div><div class="d-body" id="cart-body"></div><div class="d-foot" id="cart-foot"></div></aside>' +
      '<div class="modal" id="checkout-modal"></div><div class="search-box" id="sb"><div class="in"><input id="sq" placeholder="Search products" autocomplete="off"><button class="icon-btn" style="color:var(--ink)" id="close-search">' + ico('close') + '</button></div><div class="hits" id="hits"></div></div><div class="toast" id="toast"></div>');
    document.title = (document.title && document.title !== 'ORVISH' ? document.title + ' – ' : '') + (S.store_name || 'ORVISH');
    renderCart();
  }
  function events() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('button,a,[data-close-modal]'); if (!t) return;
      if (t.id === 'open-cart') openCart(true);
      else if (t.id === 'close-cart') openCart(false);
      else if (t.id === 'burger') { $('#mnav').classList.add('open'); $('#ov').classList.add('on'); }
      else if (t.id === 'open-search') { $('#sb').classList.add('open'); $('#sq').focus(); }
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
        return '<a class="hit" href="product.html?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(p.images[0]) + '" alt=""><div><div style="font-family:var(--font-sub)">' + esc(p.title) + '</div><div class="price" style="padding:0">' + money(p.price) + '</div></div></a>';
      }).join('') || '<p class="empty">No results</p>';
    });
    $('#sq').addEventListener('keydown', function (e) { if (e.key === 'Enter') location.href = 'shop.html?q=' + encodeURIComponent(e.target.value); if (e.key === 'Escape') $('#sb').classList.remove('open'); });
  }

  /* views */
  function cardHTML(p) {
    var sale = p.compare_at_price && p.compare_at_price > p.price, so = p.in_stock === false;
    return '<a class="card" href="product.html?id=' + encodeURIComponent(p.id) + '"><div class="img">' + (so ? '<span class="badge so">Sold out</span>' : sale ? '<span class="badge">Sale</span>' : '') +
      '<img loading="lazy" src="' + esc(p.images[0]) + '" alt="' + esc(p.title) + '">' + (so ? '' : '<div class="quick"><button class="btn" data-add="' + esc(p.id) + '">Add to cart</button></div>') + '</div>' +
      '<h5>' + esc(p.title) + '</h5><div class="price">' + money(p.price) + (sale ? '<s>' + money(p.compare_at_price) + '</s>' : '') + '</div></a>';
  }
  function home() {
    var sl = S.slides || [];
    $('#slider').innerHTML = sl.map(function (s, i) {
      return '<div class="slide' + (i ? '' : ' active') + '"><img src="' + esc(s.image) + '" alt="' + esc(s.caption) + '"><div class="cap">' + (s.caption ? '<p>' + esc(s.caption) + '</p>' : '') + (s.button_label ? '<a class="btn" href="' + esc(s.button_link || 'shop.html') + '">' + esc(s.button_label) + '</a>' : '') + '</div></div>';
    }).join('') + (sl.length > 1 ? '<button class="s-arrow s-prev" aria-label="Previous">' + ico('left') + '</button><button class="s-arrow s-next" aria-label="Next">' + ico('right') + '</button><div class="dots">' + sl.map(function (_, i) { return '<button class="' + (i ? '' : 'on') + '" aria-label="Slide ' + (i + 1) + '"></button>'; }).join('') + '</div>' : '');
    var cur = 0, slides = $$('.slide', $('#slider')), dots = $$('.dots button'), timer;
    function go(n) {
      if (slides.length < 2) return; n = (n + slides.length) % slides.length;
      slides.forEach(function (s) { s.classList.remove('prev'); }); slides[cur].classList.remove('active'); slides[cur].classList.add('prev');
      slides[n].classList.add('active'); dots.forEach(function (d, i) { d.classList.toggle('on', i === n); }); var old = cur; cur = n;
      setTimeout(function () { if (cur !== old) slides[old].classList.remove('prev'); }, 700);
    }
    function auto() { clearInterval(timer); timer = setInterval(function () { go(cur + 1); }, 4000); }
    if (slides.length > 1) { $('.s-prev').onclick = function () { go(cur - 1); auto(); }; $('.s-next').onclick = function () { go(cur + 1); auto(); }; dots.forEach(function (d, i) { d.onclick = function () { go(i); auto(); }; }); auto(); }
    var items = (S.ticker || []).map(function (t) { return '<div class="t-item">' + ico(t.icon) + esc(t.text) + '</div>'; }).join('');
    $('#ticker').innerHTML = '<div class="track">' + items + items + items + items + '</div>';
    var feat = P.filter(function (p) { return p.featured !== false; }).slice(0, 8);
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
    if (!p) { el.innerHTML = '<p class="empty">Product not found. <a class="link" href="shop.html">Back to shop</a></p>'; return; }
    document.title = p.title; var sale = p.compare_at_price && p.compare_at_price > p.price, so = p.in_stock === false, q = 1;
    el.innerHTML = '<div class="gallery"><div class="main"><img id="mi" src="' + esc(p.images[0]) + '" alt="' + esc(p.title) + '"></div>' + (p.images.length > 1 ? '<div class="thumbs">' + p.images.map(function (im, i) { return '<img class="' + (i ? '' : 'on') + '" src="' + esc(im) + '" alt="">'; }).join('') + '</div>' : '') + '</div>' +
      '<div><h1>' + esc(p.title) + '</h1><div class="price">' + money(p.price) + (sale ? '<s>' + money(p.compare_at_price) + '</s> <span class="badge" style="position:static;display:inline-block;margin-left:6px">Sale</span>' : '') + '</div>' +
      '<div>' + md(p.description) + '</div>' +
      (so ? '<p><strong>Sold out</strong></p>' : '<div class="qty" id="pq"><button data-d="-1">−</button><span>1</span><button data-d="1">+</button></div><div class="buy-row"><button class="btn secondary" id="add">Add to cart</button><button class="btn" id="buy">Buy it now</button></div>') +
      (p.details || []).map(function (d) { return '<details class="acc"><summary>' + esc(d.title) + '</summary><div>' + md(d.body) + '</div></details>'; }).join('') + '</div>';
    $$('.thumbs img').forEach(function (t) { t.onclick = function () { $('#mi').src = t.src; $$('.thumbs img').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); }; });
    if (!so) {
      $$('#pq button').forEach(function (b) { b.onclick = function () { q = Math.max(1, q + Number(b.dataset.d)); $('#pq span').textContent = q; }; });
      $('#add').onclick = function () { addToCart(p.id, q); openCart(true); };
      $('#buy').onclick = function () { addToCart(p.id, q); openCheckout(); };
    }
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
    shell(); events();
    var pg = document.body.dataset.page; ({ home: home, shop: shop, product: product, page: page }[pg] || function () {})();
    document.body.classList.add('ready');
  }).catch(function (e) { document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Could not load store data. Please refresh. (' + esc(e.message) + ')</p>'; });
})();
