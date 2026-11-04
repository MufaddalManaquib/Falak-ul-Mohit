// A scroll story: one beat at a time, text on one side and a visual on the other, held in place
// while the reader scrolls through it (sticky), with three parallax layers of stars behind.
// Used by the capabilities tour and by the history of models.

import { smoothWheel } from './smooth.js';

export function createStory(root, BEATS, { onAction, onClose, vhPerBeat = 150 } = {}) {
  const stage = root.querySelector('.t-stage'), track = root.querySelector('.t-track'), prog = root.querySelector('.t-prog');
  const pars = [...root.querySelectorAll('.t-par')];
  let raf = 0, active = -1, pSmooth = 0, pTarget = 0, last = performance.now();
  pars.forEach((p, k) => { const c = document.createElement('canvas'); c.width = 900; c.height = 900; const x = c.getContext('2d'); let s = 17 + k * 31;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 260 - k * 60; i++) { const a = .25 + r() * .55; x.fillStyle = `rgba(${200 + (r() * 55) | 0},${210 + (r() * 45) | 0},255,${a})`; const z = (.5 + k * .55) * (r() * .9 + .4); x.beginPath(); x.arc(r() * 900, r() * 900, z, 0, 7); x.fill(); }
    p.style.backgroundImage = `url(${c.toDataURL()})`; });
  BEATS.forEach((b, k) => {
    const sec = document.createElement('section'); sec.className = 'tb ' + (b.layout || 'side') + (b.cls ? ' ' + b.cls : '');
    if (b.layout === 'title') sec.innerHTML = `<div class="tcenter">${b.html}</div>`;
    else { sec.innerHTML = `<div class="tcol">${b.era ? `<p class="t-era">${b.era}</p>` : ''}<p class="kicker">${b.kicker}</p><h2 class="ttl">${b.title}</h2><p class="body">${b.body}</p>${b.extra || ''}</div><div class="tvis"></div>`;
      try { b.vis(sec.querySelector('.tvis')); } catch (e) { console.error(e); sec.querySelector('.tvis').textContent = 'This visual could not be drawn: ' + e.message; } }
    b.el = sec; stage.appendChild(sec);
    const dot = document.createElement('button'); dot.className = 'tdot'; dot.setAttribute('aria-label', b.title || b.label || (k === 0 ? 'Start' : 'End')); dot.onclick = () => jump(k); prog.appendChild(dot); b.dot = dot; });
  track.style.height = (BEATS.length * vhPerBeat) + 'vh';
  const sw = smoothWheel(root);
  root.addEventListener('scroll', () => { const max = root.scrollHeight - root.clientHeight; pTarget = max > 0 ? root.scrollTop / max : 0; }, { passive: true });
  root.querySelector('.t-x').onclick = () => close();
  root.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a && onAction) onAction(a.dataset.act, close); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !root.hidden) close(); });
  // a beat whose content is taller than the screen glides upward as you scroll through it, so nothing is cut off
  function measure(b) { const el = b.el; el.style.transform = ''; el.classList.remove('tall');
    const over0 = el.scrollHeight - el.clientHeight; if (over0 > 4) { el.classList.add('tall'); b.over = el.scrollHeight - el.clientHeight + 24; } else b.over = 0; }
  addEventListener('resize', () => { if (active >= 0) measure(BEATS[active]); });
  function jump(k) { const max = root.scrollHeight - root.clientHeight; root.scrollTo({ top: (k + .4) / BEATS.length * max, behavior: 'smooth' }); }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    pSmooth += (pTarget - pSmooth) * Math.min(1, dt * 16); if (Math.abs(pTarget - pSmooth) < 1e-5) pSmooth = pTarget;
    const N = BEATS.length, x = pSmooth * N, i = Math.min(N - 1, Math.floor(x)), s = Math.min(1, x - i);
    const on = (i === 0 && s < .93) || (i === N - 1 && s > .03) || (s > .03 && s < .96) ? i : -1;
    if (on !== active) { BEATS.forEach((b, k) => { b.el.classList.toggle('on', k === on); b.dot.classList.toggle('cur', k === i); });
      if (on >= 0) { measure(BEATS[on]); if (BEATS[on].onEnter) { try { BEATS[on].onEnter(); } catch (e) { console.error(e); } } }
      active = on; }
    const b = BEATS[i]; b._s = s;
    if (on === i) { if (b.onScrub) b.onScrub(s); if (b.anim) b.anim(now / 1000, dt, s); }
    b.el.style.setProperty('--s', s.toFixed(4));
    if (on === i && b.over) { const f = Math.min(1, Math.max(0, (s - .12) / .72)); b.el.style.transform = `translate3d(0,${(-b.over * f).toFixed(1)}px,0)`; }
    const H = innerHeight; pars.forEach((p, k) => { p.style.transform = `translate3d(0,${(-pSmooth * H * (0.5 + k * .9)) % 900}px,0)`; });
  }
  function open() {
    root.hidden = false; root.scrollTop = 0; sw.stop(); pTarget = pSmooth = 0; active = -1; document.body.classList.add('touring');
    requestAnimationFrame(() => root.classList.add('in'));
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); root.focus({ preventScroll: true });
  }
  function close(silent) { root.classList.remove('in'); document.body.classList.remove('touring'); cancelAnimationFrame(raf); setTimeout(() => { root.hidden = true; }, 450); if (!silent && onClose) onClose(); }
  return { open, close };
}
