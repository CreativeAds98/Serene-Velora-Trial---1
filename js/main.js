(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Set to your lead inbox / CRM URL. Leave empty until one exists.
  const ENQUIRY_ENDPOINT = '';

  // Header turns solid after the hero
  const header = document.getElementById('header');
  const hero = document.querySelector('.hero');
  const onScroll = () => header.classList.toggle('solid', scrollY > (hero ? hero.offsetHeight - 90 : 40));
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobile menu
  const btn = document.getElementById('menuBtn'), nav = document.getElementById('nav');
  const setMenu = open => {
    nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', open);
    if (open) header.classList.add('solid'); else onScroll();
  };
  btn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); btn.focus(); } });

  // Destination tabs
  const tabs = [...document.querySelectorAll('.tabs [role=tab]')];
  const select = t => tabs.forEach(x => {
    const on = x === t;
    x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
    document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + 1) % tabs.length]; select(n); n.focus(); }
    });
  });

  // Reveal on first view, and draw the route line once
  const path = document.getElementById('routePath');
  if (path) path.setAttribute('pathLength', '1');
  const route = document.querySelector('.route');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .15 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    if (route) {
      const rio = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { route.classList.add('draw'); rio.disconnect(); }
      }), { threshold: .25 });
      rio.observe(route);
    }
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    if (route) route.classList.add('draw');
  }

  // Enquiry form
  const form = document.getElementById('enqForm'), msg = document.getElementById('formMsg');
  const say = (html, focus) => { msg.innerHTML = html; if (focus) msg.focus(); };
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    form.querySelectorAll('.err').forEach(n => n.remove());
    form.querySelectorAll('.invalid').forEach(n => { n.classList.remove('invalid'); n.removeAttribute('aria-invalid'); });
    say('');
    let first = null;
    const fail = (el, text) => {
      el.classList.add('invalid'); el.setAttribute('aria-invalid', 'true');
      const s = document.createElement('span'); s.className = 'err'; s.textContent = text;
      (el.type === 'checkbox' ? el.closest('label') : el).insertAdjacentElement('afterend', s);
      first = first || el;
    };
    const f = form.elements;
    if (!f.name.value.trim()) fail(f.name, 'Enter your name.');
    if (!/^\+?[\d\s-]{10,15}$/.test(f.mobile.value.trim())) fail(f.mobile, 'Enter a valid mobile number.');
    if (!f.destination.value.trim()) fail(f.destination, 'Enter a destination, or write "Help me choose".');
    if (f.email.value && !f.email.checkValidity()) fail(f.email, 'Enter a valid email address.');
    if (!f.consent.checked) fail(f.consent, 'Tick the box so we can contact you.');
    if (first) { first.focus(); return; }

    const retry = '<p>We could not send your enquiry. Your details are still in the form. Please try again, or contact us by phone or WhatsApp.</p>';
    if (!ENQUIRY_ENDPOINT) { say(retry, true); return; } // never show success without a server
    try {
      const body = JSON.stringify(Object.fromEntries(new FormData(form)));
      const res = await fetch(ENQUIRY_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      say('<p>Thank you for sharing your travel idea. Your enquiry has been received. Our team will contact you using the details provided.</p>', true);
    } catch { say(retry, true); }
  });

  // Scroll progress + subtle hero parallax
  const bar = document.getElementById('progress'), scene = document.querySelector('.scene');
  let tick = false;
  addEventListener('scroll', () => {
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
      if (!reduce && scene && hero && scrollY < hero.offsetHeight) scene.style.transform = 'translateY(' + scrollY * .12 + 'px)';
      tick = false;
    });
  }, { passive: true });

  // Reduced motion: stop SVG plane animations
  if (reduce) { document.querySelectorAll('.rplane').forEach(n => n.remove()); const f = document.querySelector('.flight'); if (f && f.pauseAnimations) { f.setCurrentTime(6); f.pauseAnimations(); } }

  // Optional hero video: loads only if the file exists, motion is allowed and the connection is not slow
  const vid = document.getElementById('heroVideo'), vt = document.getElementById('vidToggle');
  const conn = navigator.connection || {};
  if (vid && !reduce && !conn.saveData && !/2g/.test(conn.effectiveType || '')) {
    vid.addEventListener('canplay', () => { vid.classList.add('on'); vt.hidden = false; vid.play().catch(() => {}); }, { once: true });
    vid.addEventListener('error', () => vid.remove());
    vid.src = vid.dataset.src; vid.load();
    vt.addEventListener('click', () => {
      const p = vid.paused; p ? vid.play() : vid.pause();
      vt.textContent = p ? 'Pause video' : 'Play video';
      vt.setAttribute('aria-label', p ? 'Pause background video' : 'Play background video');
    });
  }

  // Hero slideshow: autoplay (pauses on hover/focus), previous/next and dots; no autoplay with reduced motion
  const slides = [...document.querySelectorAll('.slide')], dots = [...document.querySelectorAll('.dots button')];
  if (slides.length > 1 && hero) {
    let cur = 0, timer = null, held = false;
    const show = k => {
      cur = (k + slides.length) % slides.length;
      slides.forEach((s, i) => { s.classList.toggle('is-active', i === cur); s.setAttribute('aria-hidden', i !== cur); });
      dots.forEach((d, i) => d.setAttribute('aria-current', i === cur));
    };
    const start = () => { clearInterval(timer); timer = null; if (!reduce && !held && !document.hidden) timer = setInterval(() => show(cur + 1), 6500); };
    document.getElementById('prevS').addEventListener('click', () => { show(cur - 1); start(); });
    document.getElementById('nextS').addEventListener('click', () => { show(cur + 1); start(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); start(); }));
    hero.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { held = true; start(); } });
    hero.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { held = false; start(); } });
    hero.addEventListener('focusin', () => { held = true; start(); });
    hero.addEventListener('focusout', e => { if (!hero.contains(e.relatedTarget)) { held = false; start(); } });
    document.addEventListener('visibilitychange', start);
    show(0); start();
  }

  // Prefill destination on the enquiry form from ?destination=
  if (form) { const dv = new URLSearchParams(location.search).get('destination'); if (dv && form.elements.destination && !form.elements.destination.value) form.elements.destination.value = dv; }

  // Holiday catalogue filters
  const cat = document.getElementById('cat');
  if (cat) {
    const d = document.getElementById('fDest'), s = document.getElementById('fStyle'), cnt = document.getElementById('count');
    const cs = [...cat.querySelectorAll('.pk')], q = new URLSearchParams(location.search);
    [['destination', d], ['style', s]].forEach(([k, el]) => { const v = q.get(k); if (v && [...el.options].some(o => o.value === v)) el.value = v; });
    const run = () => {
      let n = 0;
      cs.forEach(c => { const ok = (!d.value || c.dataset.dest === d.value) && (!s.value || c.dataset.style === s.value); c.hidden = !ok; if (ok) n++; });
      cnt.textContent = n ? n + (n === 1 ? ' holiday shown' : ' holidays shown') : 'No holidays match yet. Tell us your idea and we will discuss a custom itinerary.';
    };
    d.addEventListener('change', run); s.addEventListener('change', run); run();
  }

  // Reviews: rendered from js/reviews.js (genuine, approved reviews only)
  const rv = document.getElementById('reviews');
  if (rv) {
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const R = window.SV_REVIEWS || [];
    rv.innerHTML = R.length ? R.map(r => {
      const n = Math.max(1, Math.min(5, +r.rating || 5));
      return '<figure class="rcard"><div class="stars" role="img" aria-label="' + n + ' out of 5">' + '\u2605'.repeat(n) + '\u2606'.repeat(5 - n) + '</div><blockquote><p>' + esc(r.text) + '</p></blockquote><figcaption>' + esc(r.name) + (r.trip ? ', ' + esc(r.trip) : '') + '</figcaption></figure>';
    }).join('') : '';
    rv.hidden = !R.length;
  }

  // Travel your way: banner slides automatically every 3 s, one by one
  const tw = document.querySelector('.tw');
  if (tw) {
    const tt = [...tw.querySelectorAll('.tw-tab')], pp = [...tw.querySelectorAll('.tw-panel')], n = pp.length;
    const DELAY = 3000;
    let cur = 0, timer = null, playing = !reduce, held = false;
    const pos = (k, c) => { const o = (k - c + n) % n; return o === n - 1 ? -1 : o; };
    const offs = pp.map((_, k) => pos(k, 0));
    const render = first => {
      pp.forEach((p, k) => {
        const o = pos(k, cur), on = k === cur;
        p.style.transition = (first || Math.abs(o - offs[k]) > 1) ? 'none' : '';
        p.style.transform = 'translateX(' + o * 100 + '%)'; offs[k] = o;
        p.inert = !on; p.setAttribute('aria-hidden', !on); p.classList.toggle('is-active', on);
      });
      tt.forEach((t, k) => { t.setAttribute('aria-selected', k === cur); t.tabIndex = k === cur ? 0 : -1; });
    };
    const schedule = () => {
      clearTimeout(timer);
      const run = playing && !held && !document.hidden;
      if (run) timer = setTimeout(() => go((cur + 1) % n), DELAY);
      tw.classList.remove('is-playing'); void tw.offsetWidth; if (run) tw.classList.add('is-playing');
    };
    const go = (i, focus) => { cur = i; render(); if (focus) tt[i].focus(); schedule(); };
    tt.forEach((t, i) => {
      t.addEventListener('click', () => go(i));
      t.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go((i + 1) % n, true); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go((i + n - 1) % n, true); }
      });
    });
    tw.querySelectorAll('.tw-stage, .tw-tabs').forEach(el => {
      el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { held = true; schedule(); } });
      el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { held = false; schedule(); } });
    });
    tw.addEventListener('focusin', () => { held = true; schedule(); });
    tw.addEventListener('focusout', e => { if (!tw.contains(e.relatedTarget)) { held = false; schedule(); } });
    document.addEventListener('visibilitychange', schedule);
    render(true); schedule();
  }

  // Back-to-top arrow: appears after scrolling down
  const up = document.createElement('button');
  up.type = 'button'; up.className = 'to-top'; up.setAttribute('aria-label', 'Back to top');
  up.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if (document.querySelector('.mbar')) up.classList.add('wa-up');
  document.body.appendChild(up);
  const toggleUp = () => up.classList.toggle('show', scrollY > 500);
  addEventListener('scroll', toggleUp, { passive: true }); toggleUp();
  up.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const b = document.querySelector('.brand'); if (b) b.focus({ preventScroll: true });
  });
})();
