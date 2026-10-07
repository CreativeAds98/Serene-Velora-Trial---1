(() => {
  'use strict';
  // Set your verified WhatsApp number: digits only, with country code (no + or spaces).
  const WA_NUMBER = '';

  const DEST = ['Kerala', 'Nilgiris', 'Goa', 'Bali', 'Singapore', 'Thailand', 'Kashmir', 'Maldives', 'Help me choose'];
  const WHO = [['Two of us', 'two of us'], ['Family', 'my family'], ['Friends or group', 'a group of friends']];
  const MONTHS = ['Flexible', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };

  const fab = el('button', 'wa-fab', '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false"><path fill="#fff" d="M16 3C9.4 3 4 8.1 4 14.5c0 2.6.9 5 2.5 7L5 28l6.8-2c1.3.5 2.8.8 4.2.8 6.6 0 12-5.1 12-11.5S22.6 3 16 3zm0 20.800c-1.300 0-2.6-.3-3.8-.9l-.5-.2-3.100.9.9-3-.3-.5a8.800 8.800 0 0 1-1.500-4.900C7.700 10.300 11.400 6.800 16 6.800s8.300 3.500 8.300 7.800-3.700 8.200-8.300 8.200z"/></svg>');
  fab.type = 'button'; fab.setAttribute('aria-label', 'Plan your trip on WhatsApp'); fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'waPanel');
  const panel = el('section', 'wa-panel');
  panel.id = 'waPanel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Plan your trip on WhatsApp');
  panel.innerHTML = '<header><div><strong>Serene Velora Holidays</strong><span>Plan your escape</span></div><button type="button" class="wa-x" aria-label="Close chat">&times;</button></header><div class="wa-log" role="log" aria-live="polite"></div><div class="wa-opts"></div>';
  document.body.append(fab, panel);
  if (document.querySelector('.mbar')) { fab.classList.add('wa-up'); panel.classList.add('wa-up'); }
  const log = panel.querySelector('.wa-log'), opts = panel.querySelector('.wa-opts'), closeBtn = panel.querySelector('.wa-x');
  let s = {};

  const say = (t, who) => { const b = el('div', 'wa-msg ' + who); b.textContent = t; log.append(b); log.scrollTop = log.scrollHeight; };
  const chips = (list, pick) => {
    opts.innerHTML = '';
    list.forEach(([label, val]) => { const b = el('button', 'chip'); b.type = 'button'; b.textContent = label; b.addEventListener('click', () => pick(val, label)); opts.append(b); });
  };

  function stepDest() {
    say('Hi! Where would you love to go? Pick a destination, or skip.', 'bot');
    chips(DEST.map(d => [d, d]).concat([['Skip', '']]), (v, l) => { s.dest = v; say(l, 'me'); stepWho(); });
  }
  function stepWho() {
    say('Who is travelling?', 'bot');
    chips(WHO.map(w => [w[0], w[1]]).concat([['Skip', '']]), (v, l) => { s.who = v; say(l, 'me'); stepMonth(); });
  }
  function stepMonth() {
    say('When would you like to travel?', 'bot');
    opts.innerHTML = '';
    const sel = el('select', 'wa-sel'); sel.setAttribute('aria-label', 'Travel month');
    MONTHS.forEach(m => sel.add(new Option(m, m)));
    const go = el('button', 'chip gold', 'Continue'); go.type = 'button';
    go.addEventListener('click', () => { s.month = sel.value; say(sel.value, 'me'); finish(); });
    opts.append(sel, go);
  }
  function message() {
    let m = 'Hi Serene Velora Holidays, I would like to plan a trip';
    if (s.dest && s.dest !== 'Help me choose') m += ' to ' + s.dest;
    if (s.who) m += ' for ' + s.who;
    if (s.month && s.month !== 'Flexible') m += ' in ' + s.month; else if (s.month === 'Flexible') m += ' with flexible dates';
    if (s.dest === 'Help me choose') m += ' and I would like help choosing a destination';
    return m + '. Please help me with an itinerary and quote.';
  }
  function finish() {
    const m = message();
    say('Here is your message. You can edit it in WhatsApp before sending:', 'bot'); say(m, 'me');
    opts.innerHTML = '';
    if (WA_NUMBER) {
      const a = el('a', 'chip gold', 'Continue on WhatsApp'); a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(m); a.target = '_blank'; a.rel = 'noopener';
      opts.append(a);
    } else {
      say('WhatsApp is not connected yet. You can send the same details through our enquiry form.', 'bot');
      const a = el('a', 'chip gold', 'Open enquiry form'); a.href = 'contact.html' + (s.dest && s.dest !== 'Help me choose' ? '?destination=' + encodeURIComponent(s.dest) : '');
      opts.append(a);
    }
    const r = el('button', 'chip', 'Start again'); r.type = 'button'; r.addEventListener('click', start); opts.append(r);
  }
  function start() { s = {}; log.innerHTML = ''; stepDest(); }

  const open = () => { panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); if (!log.children.length) start(); closeBtn.focus(); };
  const close = () => { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.focus(); };
  fab.addEventListener('click', () => panel.hidden ? open() : close());
  closeBtn.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  document.addEventListener('click', e => { if (e.target.closest('[data-open-chat]') && panel.hidden) open(); });
})();
