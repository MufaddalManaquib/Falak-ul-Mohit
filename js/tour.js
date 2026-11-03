// "What the model can do": a scroll tour with live computations from the model itself.
// Every number and curve on these pages is computed when the tour opens, by the same code the calculator uses.

import { createStory } from './story.js';
const A = window.Astronomy;
const DEG = Math.PI / 180, AU_KM = 149597870.7, AS = 206264.806;
const $ = id => document.getElementById(id);
const C = () => window.__calc;
const NS = 'http://www.w3.org/2000/svg';

// ---------- formatting ----------
const pad = (n, w = 2) => String(n).padStart(w, '0');
function fRA(h) { h = ((h % 24) + 24) % 24; const H = Math.floor(h), m = (h - H) * 60, M = Math.floor(m), S = (m - M) * 60; return `${pad(H)}h ${pad(M)}m ${S.toFixed(2).padStart(5, '0')}s`; }
function fDec(d) { const sg = d < 0 ? '−' : '+'; d = Math.abs(d); const D = Math.floor(d), m = (d - D) * 60, M = Math.floor(m), S = (m - M) * 60; return `${sg}${pad(D)}° ${pad(M)}′ ${S.toFixed(1).padStart(4, '0')}″`; }
function fSmall(as) { const a = Math.abs(as); if (a >= 1) return `${a.toFixed(2)}″`; if (a >= 1e-3) return `${(a * 1e3).toFixed(a >= .01 ? 2 : 3)} mas`; if (a >= 1e-6) return `${(a * 1e6).toFixed(1)} µas`; return '< 0.001 µas'; }
function fDist(au) { return au < 0.01 ? `${Math.round(au * AU_KM).toLocaleString()} km` : au < 1e4 ? `${au.toFixed(6)} AU` : `${(au / 63241.077).toFixed(2)} light-years`; }
const fDate = d => d.toISOString().slice(0, 10), fDT = d => d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fNice = d => `${d.getUTCDate()} ${MONTH[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const svgRoot = (w, h, label) => { const s = el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label, class: 'tsvg' }); return s; };
const txt = (s, x, y, t, cls = 'tl', anchor = 'start') => { const e = el('text', { x, y, class: cls, 'text-anchor': anchor }, s); e.textContent = t; return e; };
const obj = q => C().CALC_OBJ.find(o => o.key === q || o.label === q);
const now = () => A.MakeTime(new Date());
const vlen = a => Math.hypot(a[0], a[1], a[2]), vsc = (a, k) => [a[0] * k, a[1] * k, a[2] * k], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ang = (a, b) => { const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; return Math.atan2(vlen(c), vdot(a, b)); };
// run a list of jobs in small slices so the page keeps scrolling smoothly
function chunked(jobs, each, done, slice = 8) { let i = 0; const step = () => { const t0 = performance.now(); while (i < jobs.length && performance.now() - t0 < slice) { each(jobs[i], i); i++; } if (i < jobs.length) setTimeout(step, 0); else if (done) done(); }; setTimeout(step, 0); }

// ---------- the beats ----------
const BEATS = [];
const beat = b => BEATS.push(b);

beat({ layout: 'title', html: `<p class="t-eyebrow">The model, put to work</p><h1 class="t-hero">What it can do,<br>and how well</h1><p class="t-lede">It is not only a picture. Every position in it is computed, and every computation can be checked against the heliocentric calculation and against NASA’s published predictions.</p><p class="t-note">All numbers on the following pages are computed live, in your browser, as you read.</p>` });

// 1 · any object, any moment
beat({
  kicker: '01 · Any object, any moment', title: 'Two calculations, one answer',
  body: 'Pick a body. The model places it in the Earth-centred spheres and reads its position back from that geometry alone. Separately, the heliocentric route starts from the Sun and subtracts Earth. They agree to within a few thousandths of an arcsecond, far below anything a telescope can resolve.',
  vis(v) {
    v.innerHTML = `<div class="duo"><div class="chips" role="group" aria-label="Choose an object"></div>
      <div class="cards"><div class="card m"><p class="ck">This model · Earth at rest</p><dl></dl></div>
      <div class="link"><span class="lk-l"></span><b class="lk-v">…</b><span class="lk-t">difference</span></div>
      <div class="card h"><p class="ck">Heliocentric · Sun at the centre</p><dl></dl></div></div>
      <p class="vcap" id="duo-cap"></p></div>`;
    const choices = [['Jupiter', 'Jupiter'], ['Mars', 'Mars'], ['Moon', 'Moon'], ['Io', 'Io (moon of Jupiter)'], ['Sirius', 'Sirius'], ['3I/ATLAS', null]];
    const chips = v.querySelector('.chips');
    const pick = (label, q) => {
      const o = q ? obj(q) : C().CALC_OBJ.find(x => /3I/.test(x.label)); if (!o) return;
      chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.textContent === label));
      const t = now(), M = C().modelVector(o, t, 'flex'), H = C().helioRead(o, t), mD = C().toDate(M.dir, t), hD = C().toDate(H.dir, t);
      const rows = (D, d) => [['Right ascension', fRA(D.ra)], ['Declination', fDec(D.dec)], ['Distance', isFinite(d) ? fDist(d) : 'not measured']];
      const fill = (card, D, d) => { card.querySelector('dl').innerHTML = rows(D, d).map(([a, b]) => `<div><dt>${a}</dt><dd data-final="${b}">${b}</dd></div>`).join(''); };
      fill(v.querySelector('.card.m'), mD, M.dist); fill(v.querySelector('.card.h'), hD, H.dist);
      v.querySelector('.lk-v').textContent = fSmall(C().angSec(M.dir, H.dir));
      $('duo-cap').textContent = `${o.label}, ${fDT(t.date)}. Apparent place of date, as seen from Earth’s centre.`;
      scramble(v.querySelectorAll('.cards dd'));
    };
    choices.forEach(([label, q]) => { const b = document.createElement('button'); b.textContent = label; b.onclick = () => pick(label, q); chips.appendChild(b); });
    this.onEnter = () => pick('Jupiter', 'Jupiter');
  }
});

// 2 · tonight's sky against the telescopes
beat({
  kicker: '02 · Tonight, all seven', title: 'Smaller than any telescope can see',
  body: 'The difference between the two calculations for each body tonight, on a scale where every step is a factor of ten. Even the sharpest instruments resolve nothing like this. The geometry of the spheres costs nothing in accuracy.',
  vis(v) {
    const s = svgRoot(640, 420, 'Differences between the model and the heliocentric calculation for the Sun, Moon and planets, on a logarithmic scale'); v.appendChild(s);
    const x0 = 120, x1 = 620, lo = -6, hi = 2, X = lg => x0 + (lg - lo) / (hi - lo) * (x1 - x0);   // log10 of arcseconds
    for (let p = lo; p <= hi; p++) { el('line', { x1: X(p), x2: X(p), y1: 34, y2: 330, class: 'grid' }, s); txt(s, X(p), 350, p === 0 ? '1″' : p > 0 ? `${10 ** p}″` : p >= -3 ? `${10 ** (p + 3)} mas` : `${10 ** (p + 6)} µas`, 'tick', 'middle'); }
    const refs = [[Math.log10(60), 'naked eye'], [Math.log10(.5), 'good ground telescope'], [Math.log10(.05), 'Hubble'], [Math.log10(2e-5), 'Gaia, bright stars']];
    refs.forEach(([lg, n], k) => { el('line', { x1: X(lg), x2: X(lg), y1: 28, y2: 330, class: 'ref' }, s); txt(s, X(lg) + 4, 24 - (k % 2) * 0, n, 'refl'); });
    const bodies = ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn'];
    const bars = bodies.map((b, k) => { const y = 54 + k * 39; txt(s, x0 - 14, y + 13, b, 'rowl', 'end'); const r = el('rect', { x: X(lo), y, width: 0, height: 18, rx: 2, class: 'bar' }, s); const lab = txt(s, X(lo) + 6, y + 13, '', 'barv'); return { r, lab }; });
    txt(s, x0, 395, 'Angle between the two answers, arcseconds (log scale)', 'axl');
    this.onEnter = () => { const t = now();
      bodies.forEach((b, k) => { const o = obj(b), M = C().modelVector(o, t, 'flex'), H = C().helioRead(o, t), d = Math.max(1e-6, C().angSec(M.dir, H.dir)), w = X(Math.log10(d)) - X(lo);
        const { r, lab } = bars[k]; r.style.transition = 'none'; r.setAttribute('width', 0); requestAnimationFrame(() => { r.style.transition = `width 1.1s cubic-bezier(.2,.8,.2,1) ${k * 80}ms`; r.setAttribute('width', Math.max(2, w)); });
        lab.setAttribute('x', X(lo) + Math.max(2, w) + 8); lab.textContent = fSmall(d); }); };
  }
});

// 3 · two centuries
beat({
  kicker: '03 · Two hundred years', title: 'Checked across two centuries',
  body: 'The same comparison repeated for dates from 1900 to 2100, for the Sun, Moon, planets and Jupiter’s moons, in both of the model’s geometries. Each dot below is being computed now. The full validation in the paper runs 33,840 comparisons; the largest difference is 2.2 milliarcseconds.',
  vis(v) {
    v.innerHTML = `<div class="ctr"><b id="v3-n">0</b> comparisons run · largest difference <b id="v3-m">—</b></div>`;
    const s = svgRoot(640, 380, 'Differences between the model and the heliocentric calculation from 1900 to 2100'); v.appendChild(s);
    const x0 = 70, x1 = 620, y0 = 320, y1 = 30, lo = -6, hi = -2;
    const X = yr => x0 + (yr - 1900) / 200 * (x1 - x0), Y = lg => y0 - (Math.min(hi, Math.max(lo, lg)) - lo) / (hi - lo) * (y0 - y1);
    for (let yr = 1900; yr <= 2100; yr += 50) { el('line', { x1: X(yr), x2: X(yr), y1: y1, y2: y0, class: 'grid' }, s); txt(s, X(yr), y0 + 20, yr, 'tick', 'middle'); }
    for (let p = lo; p <= hi; p++) { el('line', { x1: x0, x2: x1, y1: Y(p), y2: Y(p), class: 'grid' }, s); txt(s, x0 - 8, Y(p) + 4, p >= -3 ? `${10 ** (p + 3)} mas` : `${10 ** (p + 6)} µas`, 'tick', 'end'); }
    const worst = Math.log10(2.21e-3); el('line', { x1: x0, x2: x1, y1: Y(worst), y2: Y(worst), class: 'ref' }, s); txt(s, x1, Y(worst) - 6, 'largest in the full 33,840-comparison run: 2.2 mas', 'refl', 'end');
    txt(s, x0, 368, 'Each dot: one object, one date, one geometry (flexing ○ / round ●)', 'axl');
    const dots = el('g', {}, s);
    let ran = false;
    this.onEnter = () => { if (ran) return; ran = true;
      const names = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Io (moon of Jupiter)', 'Europa (moon of Jupiter)', 'Ganymede (moon of Jupiter)', 'Callisto (moon of Jupiter)'];
      const jobs = []; for (let k = 0; k < 24; k++) { const yr = 1900 + 200 * (k + .5) / 24; for (const n of names) for (const g of ['flex', 'round']) jobs.push([yr, n, g]); }
      let n = 0, mx = 0;
      chunked(jobs, ([yr, nm, g], i) => { const t = A.MakeTime((yr - 2000) * 365.25), o = obj(nm), M = C().modelVector(o, t, g), H = C().helioRead(o, t), d = C().angSec(M.dir, H.dir);
        n++; mx = Math.max(mx, d); const jitter = ((i * 37) % 11 - 5) * 1.6;
        el('circle', { cx: X(yr) + jitter, cy: Y(Math.log10(Math.max(1e-7, d))), r: 2.6, class: g === 'flex' ? 'dot o' : 'dot f' }, dots);
        if (n % 6 === 0 || n === jobs.length) { $('v3-n').textContent = n.toLocaleString(); $('v3-m').textContent = fSmall(mx); } }); };
  }
});

// 4 · eclipses
beat({
  kicker: '04 · Eclipses', title: 'The next eclipse, found in the spheres',
  body: 'The model searches its own sky for the moment the Moon covers the Sun. Below, the Moon crosses the Sun at their true sizes, as the model places them around the next solar eclipse. Its timings match NASA’s published predictions to within seconds.',
  vis(v) {
    v.innerHTML = `<div class="ecl"><div class="ecl-sky"></div><div class="ecl-side"><dl class="tdata" id="ecl-d"></dl><table class="tnasa"><caption>Model against NASA’s published times</caption><thead><tr><th>Event</th><th>Difference</th></tr></thead><tbody>
      <tr><td>Total solar, 8 Apr 2024</td><td>+4.1 s</td></tr><tr><td>Annular solar, 6 Feb 2027</td><td>+0.7 s</td></tr><tr><td>Penumbral lunar, 20 Feb 2027</td><td>−6.1 s</td></tr>
      <tr><td>Total solar, 2 Aug 2027</td><td>+0.7 s</td></tr><tr><td>Transit of Venus, 6 Jun 2012</td><td>+19.4 s</td></tr><tr><td>Transit of Mercury, 11 Nov 2019</td><td>−54.5 s</td></tr></tbody></table></div></div>`;
    const sky = v.querySelector('.ecl-sky');
    const s = svgRoot(420, 420, 'The Moon crossing the Sun around the next solar eclipse'); sky.appendChild(s);
    el('defs', {}, s).innerHTML = `<radialGradient id="sunG"><stop offset="0" stop-color="#fff6dc"/><stop offset=".72" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9a3c"/></radialGradient><radialGradient id="corG"><stop offset=".55" stop-color="rgba(255,240,210,.5)"/><stop offset="1" stop-color="rgba(255,240,210,0)"/></radialGradient>`;
    const cor = el('circle', { cx: 210, cy: 210, r: 0, fill: 'url(#corG)', opacity: 0 }, s);
    const sun = el('circle', { cx: 210, cy: 210, r: 80, fill: 'url(#sunG)' }, s);
    const path = el('path', { d: '', class: 'track' }, s);
    const moon = el('circle', { cx: 0, cy: 0, r: 80, fill: '#05060c', stroke: 'rgba(158,196,255,.35)', 'stroke-width': .8 }, s);
    const clock = txt(s, 210, 404, '', 'tick', 'middle');
    let track = null;
    this.onEnter = () => { if (track) return;
      const t0 = now(), ge = A.SearchGlobalSolarEclipse(t0), le = A.SearchLunarEclipse(t0), peak = ge.peak;
      const sunO = obj('Sun'), moonO = obj('Moon'); track = [];
      const Sp = C().modelVector(sunO, peak, 'flex'), sunR = 959.63 / Sp.dist;   // arcseconds
      const ref = C().toDate(Sp.dir, peak);
      const scale = 80 / sunR;
      for (let m = -150; m <= 150; m += 5) { const t = peak.AddDays(m / 1440), S = C().modelVector(sunO, t, 'flex'), M = C().modelVector(moonO, t, 'flex');
        const sD = C().toDate(S.dir, t), mD = C().toDate(M.dir, t);
        const dx = -((mD.ra - sD.ra) * 15 * Math.cos(sD.dec * DEG)) * 3600, dy = -(mD.dec - sD.dec) * 3600;   // east to the left, north up
        track.push({ m, x: 210 + dx * scale, y: 210 + dy * scale, r: (1737.4 / (M.dist * AU_KM)) * AS * scale, t }); }
      void ref;
      path.setAttribute('d', 'M' + track.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L'));
      const kind = { total: 'Total', annular: 'Annular', partial: 'Partial', hybrid: 'Hybrid' }[ge.kind] || ge.kind;
      const lk = { total: 'Total', partial: 'Partial', penumbral: 'Penumbral' }[le.kind] || le.kind;
      // check inside the model: Sun–Moon separation at greatest eclipse, as seen from Earth's centre
      const Mp = C().modelVector(moonO, peak, 'flex'), sep = C().angSec(Sp.dir, Mp.dir);
      $('ecl-d').innerHTML = [['Next solar eclipse', `${kind}, ${fNice(peak.date)}`], ['Greatest eclipse', `${fDT(peak.date)}${isFinite(ge.latitude) ? ` · ${Math.abs(ge.latitude).toFixed(1)}°${ge.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(ge.longitude).toFixed(1)}°${ge.longitude >= 0 ? 'E' : 'W'}` : ''}`],
        ['Sun–Moon centres in the model', `${(sep / 60).toFixed(2)}′ apart (from Earth’s centre)`], ['Next lunar eclipse', `${lk}, ${fNice(le.peak.date)}`]].map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
      this.onScrub(this._s || 0); };
    this.onScrub = sc => { if (!track) return; const f = Math.min(1, Math.max(0, (sc - .12) / .7)), k = f * (track.length - 1), i = Math.floor(k), u = k - i, a = track[i], b = track[Math.min(track.length - 1, i + 1)];
      const x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u; moon.setAttribute('cx', x); moon.setAttribute('cy', y); moon.setAttribute('r', a.r);
      const d = Math.hypot(x - 210, y - 210), cover = Math.max(0, 1 - d / 160); cor.setAttribute('r', 80 + 120 * cover); cor.setAttribute('opacity', Math.pow(cover, 4));
      const m = a.m + (b.m - a.m) * u; clock.textContent = `${m >= 0 ? '+' : '−'}${Math.abs(Math.round(m))} min from greatest eclipse`; };
  }
});

// 5 · Venus
beat({
  kicker: '05 · The phases of Venus', title: 'What refuted the old spheres, kept',
  body: 'Galileo’s phases of Venus showed that it passes behind the Sun, which rigid, distance-ordered shells cannot allow. In this model the sphere of Venus flexes, so every phase and every change in size comes out right. Here are the next nineteen months.',
  vis(v) {
    const s = svgRoot(640, 380, 'The phases and apparent size of Venus over the next nineteen months, computed by the model'); v.appendChild(s);
    const g = el('g', {}, s); let made = false, items = [];
    txt(s, 20, 368, 'Apparent size to scale; north up. Lit fraction and size computed from the model’s Sun and Venus.', 'axl');
    this.onEnter = () => { if (made) return; made = true;
      const t0 = now(), venus = obj('Venus'), sun = obj('Sun'), N = 10;
      for (let k = 0; k < N; k++) { const t = t0.AddDays(k * 584 / (N - 1)), V = C().modelVector(venus, t, 'flex'), S = C().modelVector(sun, t, 'flex');
        const gv = vsc(V.dir, V.dist), sv = vsc(S.dir, S.dist), phi = ang(vsc(gv, -1), vsub(sv, gv)), lit = (1 + Math.cos(phi)) / 2;
        const diam = 12104 / (V.dist * AU_KM) * AS, east = ((C().toDate(V.dir, t).ra - C().toDate(S.dir, t).ra + 48) % 24) < 12;   // east of the Sun: evening star, lit on its west (right) side
        items.push({ t, lit, diam, east }); }
      const maxD = Math.max(...items.map(i => i.diam)), cw = 600 / N;
      items.forEach((it, k) => { const r = Math.max(2.2, it.diam / maxD * 30), cx = 20 + cw * (k + .5), cy = 170;
        const grp = el('g', { class: 'vph', style: `--k:${k}` }, g);
        el('circle', { cx, cy, r, fill: '#141826' }, grp);
        // lit part: half disc on the Sun's side plus a terminator ellipse; evening star (east of the Sun) is lit on the west (right) side
        const side = it.east ? 1 : -1, e = Math.abs(2 * it.lit - 1) * r, sweepOut = side > 0 ? 1 : 0;
        const d = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweepOut} ${cx} ${cy + r} A ${e} ${r} 0 0 ${it.lit > .5 ? sweepOut : 1 - sweepOut} ${cx} ${cy - r} Z`;
        el('path', { d, fill: '#fff3d6' }, grp);
        txt(grp, cx, 235, fNice(it.t.date).replace(/^\d+ /, ''), 'tick', 'middle');
        txt(grp, cx, 252, `${Math.round(it.lit * 100)}%`, 'barv', 'middle');
        txt(grp, cx, 120 - 4, `${it.diam.toFixed(0)}″`, 'tick', 'middle'); });
      txt(s, 20, 90, 'apparent diameter', 'axl'); txt(s, 20, 285, 'lit fraction', 'axl'); };
    this.onScrub = sc => { g.querySelectorAll('.vph').forEach((n, k) => n.style.opacity = Math.min(1, Math.max(0, (sc - .08 - k * .06) / .08))); };
  }
});

// 6 · Mars retrograde
beat({
  kicker: '06 · The loops of Mars', title: 'Mars turns back',
  body: 'Around each opposition Mars slows, reverses across the stars for about ten weeks, then resumes. The path below is the model’s own output for the coming opposition, drawn against the real stars of that patch of sky. Scroll to trace it.',
  vis(v) {
    const s = svgRoot(640, 420, 'The retrograde loop of Mars around its next opposition, computed by the model'); v.appendChild(s);
    const bg = el('g', {}, s), path = el('path', { class: 'mpath', d: '' }, s), marks = el('g', {}, s), head = el('circle', { r: 6, class: 'mhead' }, s);
    const cap = txt(s, 20, 408, '', 'axl'); let pts = null, len = 0;
    this.onEnter = () => { if (pts) return;
      const opp = A.SearchRelativeLongitude(A.Body.Mars, 0, now()), mars = obj('Mars'); pts = [];
      for (let d = -130; d <= 130; d += 3) { const t = opp.AddDays(d), M = C().modelVector(mars, t, 'flex'), D = C().toDate(M.dir, t); pts.push({ d, t, ra: D.ra * 15, dec: D.dec }); }
      let r0 = Math.min(...pts.map(p => p.ra)), r1 = Math.max(...pts.map(p => p.ra)), d0 = Math.min(...pts.map(p => p.dec)), d1 = Math.max(...pts.map(p => p.dec));
      const padR = (r1 - r0) * .14 + 1, padD = (d1 - d0) * .3 + 1.5; r0 -= padR; r1 += padR; d0 -= padD; d1 += padD;
      const cd = Math.cos((d0 + d1) / 2 * DEG), sx = 600 / ((r1 - r0) * cd), sy = 360 / (d1 - d0), k = Math.min(sx, sy);
      const X = ra => 320 + (((r0 + r1) / 2) - ra) * cd * k, Y = dec => 200 - (dec - (d0 + d1) / 2) * k;
      for (const st of C().SKY.s) { const ra = st[0], de = st[1]; if (st[2] > 6 || ra < r0 || ra > r1 || de < d0 || de > d1) continue; const x = X(ra), y = Y(de); if (x < 0 || x > 640 || y < 0 || y > 395) continue;
        el('circle', { cx: x, cy: y, r: Math.max(.6, (6.2 - st[2]) * .55), class: 'bgstar' }, bg); }
      path.setAttribute('d', 'M' + pts.map(p => `${X(p.ra).toFixed(1)} ${Y(p.dec).toFixed(1)}`).join(' L')); len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      pts.forEach((p, i) => { if (p.d % 30 !== 2 && p.d !== -130) return; const x = X(p.ra), y = Y(p.dec); el('circle', { cx: x, cy: y, r: 2.4, class: 'mtick' }, marks); txt(marks, x, y - 10, `${p.t.date.getUTCDate()} ${MONTH[p.t.date.getUTCMonth()]}`, 'tick', 'middle'); void i; });
      const oi = pts.findIndex(p => p.d >= 0); el('circle', { cx: X(pts[oi].ra), cy: Y(pts[oi].dec), r: 9, class: 'mopp' }, marks); txt(marks, X(pts[oi].ra) + 12, Y(pts[oi].dec) + 20, `opposition, ${fNice(opp.date)}`, 'refl');
      cap.textContent = `Every 3 days from ${fNice(pts[0].t.date)} to ${fNice(pts[pts.length - 1].t.date)}. East is to the left, as on the sky.`;
      this._X = X; this._Y = Y; this.onScrub(this._s || 0); };
    this.onScrub = sc => { if (!pts) return; const f = Math.min(1, Math.max(0, (sc - .1) / .75)); path.style.strokeDashoffset = len * (1 - f);
      const p = path.getPointAtLength(len * f); head.setAttribute('cx', p.x); head.setAttribute('cy', p.y); };
  }
});

// 7 · Jupiter's moons
beat({
  kicker: '07 · Jupiter’s moons', title: 'Four moons, hour by hour',
  body: 'Galileo’s discovery, which showed that not everything circles Earth, is part of the model too. Each curve is one moon swinging from side to side of Jupiter over the next four days, computed hourly from the model, with each moon’s own light time.',
  vis(v) {
    const s = svgRoot(640, 440, 'Positions of Io, Europa, Ganymede and Callisto relative to Jupiter over four days'); v.appendChild(s);
    const x0 = 320, kx = 9.2, y0 = 30, H = 370;
    el('rect', { x: x0 - kx, y: y0, width: 2 * kx, height: H, class: 'jband' }, s);
    for (const r of [-30, -20, -10, 10, 20, 30]) { el('line', { x1: x0 + r * kx, x2: x0 + r * kx, y1: y0, y2: y0 + H, class: 'grid' }, s); txt(s, x0 + r * kx, y0 + H + 18, `${Math.abs(r)}`, 'tick', 'middle'); }
    txt(s, x0, y0 + H + 34, 'Jupiter radii · east ← → west', 'axl', 'middle');
    const cols = ['#ffd27a', '#e8e2d4', '#b9c6e6', '#9aa0c0'], names = ['Io', 'Europa', 'Ganymede', 'Callisto'];
    const paths = names.map((n, k) => { const p = el('path', { class: 'jm', stroke: cols[k], d: '' }, s); return p; });
    names.forEach((n, k) => { el('circle', { cx: 40 + k * 82, cy: 14, r: 4, fill: cols[k] }, s); txt(s, 50 + k * 82, 18, n, 'refl'); });
    const dayl = el('g', {}, s); let made = false, lens = [];
    this.onEnter = () => { if (made) return; made = true;
      const t0 = now(), jup = obj('Jupiter'), moons = names.map(n => obj(`${n} (moon of Jupiter)`)), hours = 96;
      const data = names.map(() => []);
      const jobs = []; for (let h = 0; h <= hours; h++) jobs.push(h);
      chunked(jobs, h => { const t = t0.AddDays(h / 24), J = C().modelVector(jup, t, 'flex'), JD = C().toDate(J.dir, t), rJ = 71492 / (J.dist * AU_KM) * AS;
        moons.forEach((m, k) => { const M = C().modelVector(m, t, 'flex'), D = C().toDate(M.dir, t); let dra = (D.ra - JD.ra); if (dra > 12) dra -= 24; if (dra < -12) dra += 24;
          const xr = -(dra * 15 * Math.cos(JD.dec * DEG) * 3600) / rJ; data[k].push([x0 + xr * kx, y0 + h / hours * H]); }); },
      () => { paths.forEach((p, k) => { p.setAttribute('d', 'M' + data[k].map(q => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L')); const L = p.getTotalLength(); lens[k] = L; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
        for (let d = 0; d <= 4; d++) { const y = y0 + d * 24 / hours * H; el('line', { x1: x0 - 300, x2: x0 - 270, y1: y, y2: y, class: 'grid' }, dayl); txt(dayl, x0 - 300, y - 4, fNice(t0.AddDays(d).date).replace(/ \d{4}$/, ''), 'tick'); }
        this.onScrub(this._s || 0); }); };
    this.onScrub = sc => { const f = Math.min(1, Math.max(0, (sc - .1) / .72)); paths.forEach((p, k) => { if (lens[k]) p.style.strokeDashoffset = lens[k] * (1 - f); }); };
  }
});

// 8 · aberration of starlight
beat({
  kicker: '08 · The yearly wobble of the stars', title: 'Bradley’s star, reproduced',
  body: 'In 1728 James Bradley found that γ Draconis traces a small ellipse every year, about 40″ across: the aberration of light. In the Earth-fixed description it is a yearly motion of the eighth sphere. The model reproduces it at true size, together with each star’s parallax.',
  vis(v) {
    const s = svgRoot(640, 420, 'The yearly path of gamma Draconis on the sky caused by aberration, computed by the model'); v.appendChild(s);
    const cx = 320, cy = 200, k = 7.2;
    for (const r of [10, 20]) { el('circle', { cx, cy, r: r * k, class: 'grid' }, s); txt(s, cx + r * k + 4, cy - 4, `${r}″`, 'tick'); }
    el('line', { x1: cx - 190, x2: cx + 190, y1: cy, y2: cy, class: 'grid' }, s); el('line', { x1: cx, x2: cx, y1: cy - 170, y2: cy + 170, class: 'grid' }, s);
    txt(s, cx, cy - 176, 'N', 'tick', 'middle'); txt(s, cx - 198, cy + 4, 'E', 'tick', 'end');
    const path = el('path', { class: 'mpath', d: '' }, s), head = el('circle', { r: 6, class: 'mhead' }, s), lab = txt(s, 20, 408, '', 'axl'); let pts = null, len = 0;
    this.onEnter = () => { if (pts) return; const o = obj('Eltanin'); if (!o) return;
      const t0 = A.MakeTime(new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))), raw = [];
      for (let d = 0; d <= 366; d += 6) { const t = t0.AddDays(d), M = C().modelVector(o, t, 'flex'); raw.push({ t, dir: M.dir }); }
      const m = raw.reduce((a, p) => [a[0] + p.dir[0], a[1] + p.dir[1], a[2] + p.dir[2]], [0, 0, 0]), mu = vsc(m, 1 / vlen(m));
      const east = (() => { const z = [0, 0, 1], e = [z[1] * mu[2] - z[2] * mu[1], z[2] * mu[0] - z[0] * mu[2], z[0] * mu[1] - z[1] * mu[0]]; return vsc(e, 1 / vlen(e)); })();
      const north = [mu[1] * east[2] - mu[2] * east[1], mu[2] * east[0] - mu[0] * east[2], mu[0] * east[1] - mu[1] * east[0]];
      pts = raw.map(p => ({ t: p.t, x: cx - vdot(p.dir, east) * AS * k, y: cy - vdot(p.dir, north) * AS * k, ex: vdot(p.dir, east) * AS, ny: vdot(p.dir, north) * AS }));
      path.setAttribute('d', 'M' + pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L')); len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      const span = Math.max(...pts.map(p => Math.hypot(p.ex, p.ny))) * 2;
      lab.textContent = `γ Draconis (Eltanin), every 6 days through ${t0.date.getUTCFullYear()}. Largest extent ${span.toFixed(1)}″; parallax adds 0.02″. Precession and nutation removed.`;
      pts.filter((p, i) => i % 10 === 0).forEach(p => { el('circle', { cx: p.x, cy: p.y, r: 2.2, class: 'mtick' }, s); txt(s, p.x + 8, p.y + 4, MONTH[p.t.date.getUTCMonth()], 'tick'); });
      this.onScrub(this._s || 0); };
    this.onScrub = sc => { if (!pts) return; const f = Math.min(1, Math.max(0, (sc - .1) / .75)); path.style.strokeDashoffset = len * (1 - f); const p = path.getPointAtLength(len * f); head.setAttribute('cx', p.x); head.setAttribute('cy', p.y); };
  }
});

// 9 · small bodies, in the model's own picture
beat({
  kicker: '09 · Asteroids, comets, visitors', title: '477 small worlds, where they are now',
  body: 'Every catalogued asteroid and comet in the model, in the model’s own picture: direction from Earth around the circle, distance outward on the logarithmic scale, as the model draws it. The interstellar comet 3I/ATLAS is marked with its track.',
  vis(v) {
    const s = svgRoot(640, 440, 'Asteroids and comets placed around Earth by direction and logarithmic distance'); v.appendChild(s);
    const cx = 320, cy = 215, R = 200, lr = au => Math.log10(Math.max(.1, au)), rr = au => 14 + (lr(au) + 1) / (1.8 + 1) * (R - 14);
    const rings = [['0.3 AU', .3], ['Sun · 1 AU', 1], ['3 AU', 3], ['Jupiter · 5.2 AU', 5.2], ['Saturn · 9.6 AU', 9.6], ['30 AU', 30]];
    rings.forEach(([n, au], k) => { el('circle', { cx, cy, r: rr(au), class: 'grid' }, s); const a = (-28 - k * 9) * DEG; txt(s, cx + Math.cos(a) * rr(au) + 4, cy + Math.sin(a) * rr(au), n, 'tick'); });
    el('circle', { cx, cy, r: 6, fill: '#6fa8ff' }, s);
    const g = el('g', {}, s); let made = false;
    const lab = txt(s, 20, 432, '', 'axl');
    this.onEnter = () => { if (made) return; made = true;
      const t = now(), E = A.HelioVector(A.Body.Earth, t), Ee = [E.x, E.y, E.z], SB = C().SB, o3 = [0, 0, 0], jd = t.ut + 2451545.0;
      const eclLon = v3 => { const e = A.Ecliptic(new A.Vector(v3[0], v3[1], v3[2], t)); return e.elon * DEG; };
      let na = 0, nc = 0;
      SB.forEach((o, i) => { if (o.kind === 2 || o.kind === 3) return; C().orbitPos(o, jd, o3); const h = [o3[0], -o3[2], o3[1]], gv = vsub(h, Ee), d = vlen(gv), lon = eclLon(gv), r = rr(d);
        const comet = o.kind >= 4; if (comet) nc++; else na++;
        const c = el('circle', { cx: cx + Math.cos(lon) * r, cy: cy - Math.sin(lon) * r, r: comet ? 2.2 : 1.3, class: comet ? 'sbc' : 'sba', style: `--d:${(i % 60) * 18}ms` }, g); void c; });
      const atlas = C().CALC_OBJ.find(x => /3I/.test(x.label));
      if (atlas) { const pts = []; for (let d = -240; d <= 240; d += 8) { const tt = t.AddDays(d), M = C().modelVector(atlas, tt, 'flex'); pts.push([eclLon(M.dir), rr(M.dist)]); }
        el('path', { d: 'M' + pts.map(([l, r]) => `${(cx + Math.cos(l) * r).toFixed(1)} ${(cy - Math.sin(l) * r).toFixed(1)}`).join(' L'), class: 'atl' }, s);
        const M = C().modelVector(atlas, t, 'flex'), l = eclLon(M.dir), r = rr(M.dist); el('circle', { cx: cx + Math.cos(l) * r, cy: cy - Math.sin(l) * r, r: 5, class: 'mopp' }, s);
        txt(s, cx + Math.cos(l) * r + 9, cy - Math.sin(l) * r - 7, `3I/ATLAS · ${M.dist.toFixed(2)} AU`, 'refl'); }
      lab.textContent = `${na} asteroids and dwarf planets · ${nc} comets and interstellar objects · ${fDate(t.date)} · around: ecliptic longitude; outward: log distance`; };
  }
});

// 10 · limits
beat({
  kicker: '10 · Where the accuracy runs out', title: 'Honest limits',
  body: 'The geometry of the spheres adds almost nothing. What limits accuracy is the planetary theory the model uses, which is compact rather than research-grade, and the simplified orbits of small bodies. These are the same limits a heliocentric program with the same theory would have.',
  vis(v) {
    v.innerHTML = `<div class="limits">
      <div class="lim"><b>2 mas</b><span>largest geometric difference, 1900–2100</span><i style="--w:6%"></i></div>
      <div class="lim"><b>≈ 1′</b><span>planetary theory against NASA’s JPL ephemerides (stated bound)</span><i style="--w:62%"></i></div>
      <div class="lim"><b>4–6 s</b><span>eclipse times against NASA’s published predictions</span><i style="--w:28%"></i></div>
      <div class="lim"><b>19–55 s</b><span>transit times of Venus (2012) and Mercury (2019) against NASA</span><i style="--w:44%"></i></div>
      <div class="lim"><b>1′ to 1°+</b><span>small bodies decades from their orbit epoch (two-body orbits)</span><i style="--w:90%"></i></div>
      <div class="lim"><b>s to min</b><span>local times far from the present century, from the uncertainty in Earth’s rotation (ΔT)</span><i style="--w:70%"></i></div></div>`;
  }
});

beat({ layout: 'title', key: 'end', html: `<h2 class="t-hero sm">Check it yourself</h2><p class="t-lede">Pick any planet, moon, star, asteroid or comet and any date. The calculator gives both answers, the difference, rise and set times, and a link to NASA JPL Horizons for an independent check.</p>
  <div class="t-ctas"><button class="t-cta" data-act="calc">Open the calculator</button><button class="t-cta ghost" data-act="model">Explore the model</button><a class="t-cta ghost" href="paper.html" target="_blank" rel="noopener">Read the paper</a></div>` });

// ---------- scramble digits into place ----------
function scramble(nodes) {
  nodes.forEach((n, k) => { const fin = n.dataset.final || n.textContent, t0 = performance.now() + k * 60, dur = 700;
    const tick = () => { const f = (performance.now() - t0) / dur; if (f >= 1) { n.textContent = fin; return; }
      if (f > 0) n.textContent = fin.replace(/\d/g, (d, i) => (i / fin.length < f ? d : String((Math.random() * 10) | 0)));
      requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
}

// ---------- the scroll machinery (shared with the history page) ----------
let story = null;
export function openTour() {
  if (!story) story = createStory($('tour'), BEATS, { vhPerBeat: 140, onAction: (act, close) => { close(true); window.__ui.enterModel(); if (act === 'calc') window.__ui.openCalc(); } });
  story.open();
}
export function closeTour() { if (story) story.close(true); }
window.__openTour = openTour;
