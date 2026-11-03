// How the heavens have been modelled: a scroll story from Greece to the moving Sun, shown before entering the model.
import { createStory } from './story.js';

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const el = (tag, a = {}, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const svg = (label, w = 600, h = 480) => el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label, class: 'tsvg hsvg' });
const txt = (s, x, y, t, cls = 'tick', anchor = 'start') => { const e = el('text', { x, y, class: cls, 'text-anchor': anchor }, s); e.textContent = t; return e; };
const at = (n, x, y) => { n.setAttribute('cx', x); n.setAttribute('cy', y); };
const rot = (g, deg, cx, cy) => g.setAttribute('transform', `rotate(${deg} ${cx} ${cy})`);
function defs(s) {
  el('defs', {}, s).innerHTML = `
    <radialGradient id="hSun"><stop offset="0" stop-color="#fff7e0"/><stop offset=".6" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9a3c"/></radialGradient>
    <radialGradient id="hSunGlow"><stop offset="0" stop-color="rgba(255,200,120,.55)"/><stop offset="1" stop-color="rgba(255,200,120,0)"/></radialGradient>
    <radialGradient id="hEarth" cx=".35" cy=".35"><stop offset="0" stop-color="#9cc8ff"/><stop offset="1" stop-color="#1d4f9a"/></radialGradient>
    <radialGradient id="hMuhit"><stop offset=".86" stop-color="rgba(158,196,255,0)"/><stop offset=".93" stop-color="rgba(158,196,255,.35)"/><stop offset="1" stop-color="rgba(158,196,255,0)"/></radialGradient>
    <filter id="hGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}
const sun = (s, x, y, r) => { el('circle', { cx: x, cy: y, r: r * 2.6, fill: 'url(#hSunGlow)' }, s); return el('circle', { cx: x, cy: y, r, fill: 'url(#hSun)' }, s); };
const earth = (s, x, y, r = 9) => el('circle', { cx: x, cy: y, r, fill: 'url(#hEarth)' }, s);
const ring = (s, x, y, r, cls = 'hring') => el('circle', { cx: x, cy: y, r, class: cls }, s);
const dot = (s, r, fill, cls) => el('circle', { r, fill, class: cls || '' }, s);
// a trail drawn from the motion's own formula over a past interval, so it stays smooth at any frame rate
function curve(s, cls) { const p = el('polyline', { class: cls, points: '' }, s); return { draw(fn, t0, t1, n) { const pts = []; for (let i = 0; i <= n; i++) { const [x, y] = fn(t0 + (t1 - t0) * i / n); pts.push(`${x.toFixed(1)},${y.toFixed(1)}`); } p.setAttribute('points', pts.join(' ')); } }; }
function starfield(s, n, seed, x0 = 0, y0 = 0, w = 600, h = 480) { let q = seed; const r = () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296); const g = el('g', { class: 'hstars' }, s);
  for (let i = 0; i < n; i++) el('circle', { cx: x0 + r() * w, cy: y0 + r() * h, r: .5 + r() * 1.1, opacity: .25 + r() * .6 }, g); return g; }

const B = [];

B.push({ layout: 'title', label: 'Start', html: `<p class="t-eyebrow">Before you enter</p><h1 class="t-hero">How the heavens<br>have been drawn</h1><p class="t-lede">Two and a half thousand years of models, from the crystal spheres of Greece to a Sun that is itself in motion. Each kept what it could see and changed what it could not.</p><p class="t-note">Scroll to travel through time</p>` });

// 1 · Eudoxus and Aristotle
B.push({ era: 'c. 370–330 BCE · Greece', kicker: 'Eudoxus and Aristotle', title: 'Spheres within spheres',
  body: 'Eudoxus explained each planet’s wandering with nested spheres turning on tilted axes, all centred on Earth. Aristotle made them physical: fifty-five crystalline shells, the outermost carrying the stars, kept turning by an unmoved mover beyond. The starry sphere did the carrying; there was no separate, starless sphere.',
  vis(v) { const s = svg('Nested spheres around Earth after Eudoxus and Aristotle'); v.appendChild(s); defs(s);
    const cx = 250, cy = 250, R = [52, 78, 104, 130, 156, 182];
    R.forEach(r => ring(s, cx, cy, r)); const stars = el('g', {}, s); ring(stars, cx, cy, 212, 'hring hi');
    for (let k = 0; k < 40; k++) el('circle', { cx: cx + Math.cos(k / 40 * TAU) * 212, cy: cy + Math.sin(k / 40 * TAU) * 212, r: k % 3 ? 1.2 : 2, class: 'hstar' }, stars);
    earth(s, cx, cy, 13);
    const pl = R.map((r, k) => ({ r, w: .9 / (k + 1.2), d: dot(s, k === 3 ? 7 : 4.5, k === 3 ? '#ffd27a' : '#e8ecff') }));
    el('path', { d: `M${cx} 18 L${cx} 30`, class: 'harrow' }, s); txt(s, cx, 12, 'the unmoved mover, beyond', 'hlab', 'middle');
    // the hippopede: two spheres turning in opposite senses on tilted axes trace a figure eight
    const hx = 505, hy = 120; txt(s, hx, hy - 58, 'Hippopede', 'hlab', 'middle'); txt(s, hx, hy + 70, 'two counter-turning spheres', 'tick', 'middle');
    const path = []; for (let i = 0; i <= 200; i++) { const t = i / 200 * TAU; path.push(`${(hx + 62 * Math.sin(t)).toFixed(1)},${(hy + 34 * Math.sin(t) * Math.cos(t)).toFixed(1)}`); }
    el('polyline', { points: path.join(' '), class: 'hpath' }, s); const hp = dot(s, 4.5, '#ffd27a', 'hglow');
    this.anim = t => { rot(stars, t * 4, cx, cy); pl.forEach(p => at(p.d, cx + Math.cos(t * p.w) * p.r, cy + Math.sin(t * p.w) * p.r)); const u = t * .9; at(hp, hx + 62 * Math.sin(u), hy + 34 * Math.sin(u) * Math.cos(u)); };
  } });

// 2 · Aristarchus
B.push({ era: 'c. 280 BCE · Samos', kicker: 'Aristarchus', title: 'A Sun at the centre, too early',
  body: 'Aristarchus judged the Sun far larger than Earth and proposed that Earth circles it. The idea was set aside: if Earth moved, the nearer stars should shift through the year, and no one could see them do so. The shift, parallax, is real but tiny. It was first measured in 1838.',
  vis(v) { const s = svg('Aristarchus: Earth circling a central Sun, and the parallax of a nearby star'); v.appendChild(s); defs(s); starfield(s, 70, 3);
    const cx = 230, cy = 290, r = 120; ring(s, cx, cy, r); sun(s, cx, cy, 30); const e = earth(s, 0, 0, 9);
    const st = { x: 500, y: 70 }; el('circle', { cx: st.x, cy: st.y, r: 4, fill: '#fff', class: 'hglow' }, s); txt(s, st.x + 10, st.y + 4, 'a nearer star', 'hlab');
    const sight = el('line', { class: 'hsight' }, s); const back = el('line', { class: 'hsight2' }, s);
    txt(s, 20, 465, 'Through the year the line of sight to a nearer star swings. Real angle: under 1″, too small for the eye.', 'tick');
    this.anim = t => { const a = t * .7, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; at(e, x, y);
      sight.setAttribute('x1', x); sight.setAttribute('y1', y); sight.setAttribute('x2', st.x); sight.setAttribute('y2', st.y);
      const dx = st.x - x, dy = st.y - y, L = Math.hypot(dx, dy); back.setAttribute('x1', st.x); back.setAttribute('y1', st.y); back.setAttribute('x2', st.x + dx / L * 80); back.setAttribute('y2', st.y + dy / L * 80); };
  } });

// 3 · Ptolemy
B.push({ era: 'c. 150 CE · Alexandria', kicker: 'Ptolemy, the Almagest', title: 'Circles on circles',
  body: 'Ptolemy kept Earth still and gave each planet an epicycle riding on a larger deferent, with an off-centre equant to set its pace. It predicted positions well for fourteen centuries. His account begins with the first motion of the whole heavens and works inward, sphere by sphere, down to the Moon and Earth. That order is the one this model keeps.',
  vis(v) { const s = svg('Ptolemy: a planet on an epicycle riding a deferent around Earth, tracing loops'); v.appendChild(s); defs(s);
    const ex = 230, ey = 250, dx = ex + 14, R = 140, r = 52; ring(s, dx, ey, R); earth(s, ex, ey, 11);
    el('circle', { cx: dx + 14, cy: ey, r: 2.5, fill: '#9ec4ff' }, s); txt(s, dx + 20, ey + 16, 'equant', 'tick');
    const epi = ring(s, 0, 0, r, 'hring hi'), arm = el('line', { class: 'harm' }, s), tr = curve(s, 'htrail'), p = dot(s, 6, '#ff9d6e', 'hglow');
    const pt = t => { const a = t * .32, b = t * 1.75; return [dx + Math.cos(a) * R + Math.cos(b) * r, ey + Math.sin(a) * R + Math.sin(b) * r]; };
    const order = ['First motion', 'Fixed stars', 'Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Earth'];
    order.forEach((n, k) => { const y = 52 + k * 40; el('circle', { cx: 470, cy: y, r: k === 9 ? 6 : 3.5, fill: k === 9 ? 'url(#hEarth)' : k === 5 ? '#ffd27a' : '#cfd6ff', class: 'hlad', style: `--i:${k}` }, s); txt(s, 486, y + 4, n, 'hlab hlad', 'start').setAttribute('style', `--i:${k}`); });
    el('path', { d: 'M454 60 L454 404', class: 'harrow' }, s); txt(s, 448, 30, 'outside → in', 'hlab', 'start');
    this.anim = t => { const a = t * .32, c = { x: dx + Math.cos(a) * R, y: ey + Math.sin(a) * R }, [px, py] = pt(t);
      at(epi, c.x, c.y); arm.setAttribute('x1', c.x); arm.setAttribute('y1', c.y); arm.setAttribute('x2', px); arm.setAttribute('y2', py); at(p, px, py); tr.draw(pt, t - 16, t, 320); };
  } });

// 4 · Islamic astronomy: the ninth sphere
B.push({ era: '9th–14th centuries · the Islamic world', kicker: 'al-Battānī · Ibn al-Haytham · al-Ṭūsī · Ibn al-Shāṭir', title: 'The ninth sphere',
  body: 'Astronomers of the Islamic world refined Ptolemy’s numbers, attacked the equant as physically impossible and replaced it. al-Ṭūsī’s pair of circles turns rotation into straight-line motion; Ibn al-Shāṭir’s models need no equant at all. And the cosmos gained a sphere. The eighth, of the stars, was given its own slow motion, the precession. The daily turn of everything was given to a ninth, starless sphere beyond it: al-Falak al-Muhit, the encompassing sphere. It was described by the Ikhwān al-Ṣafāʾ and set by al-Kirmānī into the Ismaili cosmos.',
  vis(v) { const s = svg('The Tusi couple, and nine spheres with the starless ninth sphere outermost'); v.appendChild(s); defs(s);
    const tx = 125, ty = 112, R = 80, r = R / 2; ring(s, tx, ty, R, 'hring hi'); el('line', { x1: tx - R, y1: ty, x2: tx + R, y2: ty, class: 'hline' }, s);
    const sc = ring(s, 0, 0, r, 'hring'), sp = el('line', { class: 'harm' }, s), pt = dot(s, 6, '#ffd27a', 'hglow'); txt(s, tx, ty + R + 26, 'al-Ṭūsī’s couple, 1247', 'hlab', 'middle');
    const ox = 350, oy = 462, RR = [30, 52, 74, 96, 118, 140, 162, 192, 248];
    const lab = ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn', 'Stars · precession', 'al-Falak al-Muhit · starless'];
    RR.forEach((rr, k) => { const g = el('path', { d: `M${ox - rr} ${oy} A${rr} ${rr} 0 0 1 ${ox + rr} ${oy}`, class: k === 8 ? 'hmuhit' : k === 7 ? 'hring hi' : 'hring' }, s); void g;
      if (k >= 7) txt(s, ox + rr * Math.cos(-38 * DEG) + 10, oy + rr * Math.sin(-38 * DEG) + (k === 8 ? -8 : 4), lab[k], k === 8 ? 'hlab hgold' : 'hlab'); });
    earth(s, ox, oy, 9);
    const ticks = el('g', {}, s); for (let k = 0; k < 36; k++) { const a = Math.PI + k / 36 * Math.PI; el('line', { x1: ox + Math.cos(a) * 240, y1: oy + Math.sin(a) * 240, x2: ox + Math.cos(a) * 256, y2: oy + Math.sin(a) * 256, class: 'htick' }, ticks); }
    this.anim = t => { const th = t * .9, c = { x: tx + r * Math.cos(th), y: ty + r * Math.sin(th) }, px = tx + 2 * r * Math.cos(th);
      at(sc, c.x, c.y); sp.setAttribute('x1', c.x); sp.setAttribute('y1', c.y); sp.setAttribute('x2', px); sp.setAttribute('y2', ty); at(pt, px, ty);
      rot(ticks, -((t * 12) % 10), ox, oy); };
  } });

// 5 · Copernicus
B.push({ era: '1543 · Frombork', kicker: 'Copernicus, De revolutionibus', title: 'Turned inside out',
  body: 'Copernicus put the Sun at the centre and set the planets outward from it in order of their periods, fixing their relative distances for the first time. Earth spins once a day, so the outermost sphere of stars is left motionless. With nothing up there to turn, al-Muhit has no place in his scheme.',
  vis(v) { const s = svg('Copernicus: planets around the Sun, with the sphere of fixed stars at rest'); v.appendChild(s); defs(s);
    const cx = 270, cy = 240, P = [['Mercury', .387, .241], ['Venus', .723, .615], ['Earth', 1, 1], ['Mars', 1.524, 1.881], ['Jupiter', 5.2, 11.86], ['Saturn', 9.54, 29.46]];
    const rr = a => 52 * Math.pow(a, .55);
    ring(s, cx, cy, 222, 'hring hi'); for (let k = 0; k < 48; k++) el('circle', { cx: cx + Math.cos(k / 48 * TAU) * 222, cy: cy + Math.sin(k / 48 * TAU) * 222, r: k % 4 ? 1 : 1.8, class: 'hstar' }, s);
    txt(s, cx + 160, cy - 172, 'sphere of the fixed stars: at rest', 'hlab');
    sun(s, cx, cy, 18); const ds = P.map(([n, a, T]) => { ring(s, cx, cy, rr(a)); return { n, r: rr(a), w: .9 / T, d: n === 'Earth' ? earth(s, 0, 0, 7) : dot(s, n === 'Jupiter' || n === 'Saturn' ? 6 : 4, n === 'Mars' ? '#ff9d6e' : '#e8ecff') }; });
    const spin = el('path', { d: 'M -11 -4 A 12 12 0 1 1 -4 11', class: 'hspin' }, s); txt(s, 20, 465, 'Earth spins daily; the planets go round the Sun in order of their periods.', 'tick');
    this.anim = t => { ds.forEach(p => { const a = t * p.w, x = cx + Math.cos(a) * p.r, y = cy - Math.sin(a) * p.r; at(p.d, x, y); if (p.n === 'Earth') spin.setAttribute('transform', `translate(${x} ${y}) rotate(${t * 140})`); }); };
  } });

// 6 · Tycho
B.push({ era: '1588 · Hven', kicker: 'Tycho Brahe', title: 'A still Earth, done better',
  body: 'Tycho kept Earth fixed. The Moon and Sun circle it, and the other planets circle the Sun. For every position in the sky this is exactly equivalent to Copernicus, which is the principle this model rests on. His observations, good to about an arcminute, are what Kepler would use.',
  vis(v) { const s = svg('Tycho: Sun and Moon circle Earth; the planets circle the Sun'); v.appendChild(s); defs(s);
    const cx = 270, cy = 225, RS = 70; earth(s, cx, cy, 12); ring(s, cx, cy, 24); ring(s, cx, cy, RS, 'hring hi');
    const moon = dot(s, 3.5, '#d8dbe6'), sg = el('g', {}, s); const sunC = sun(sg, 0, 0, 14);
    const orbs = [[30, .241, '#e8ecff', 3.5], [56, .615, '#fff0cc', 4.5], [118, 1.881, '#ff9d6e', 5], [160, 11.86, '#f1e2c4', 7]].map(([r, T, c, z]) => ({ r, w: .9 / T, ring: ring(s, 0, 0, r), d: dot(s, z, c) }));
    txt(s, 20, 465, 'Not to scale. Mars’s path around the Sun crosses the Sun’s path around Earth.', 'tick'); void sunC;
    this.anim = t => { const a = t * .9, sx = cx + Math.cos(a) * RS, sy = cy - Math.sin(a) * RS; sg.setAttribute('transform', `translate(${sx} ${sy})`);
      at(moon, cx + Math.cos(t * 3.2) * 24, cy - Math.sin(t * 3.2) * 24);
      orbs.forEach(o => { at(o.ring, sx, sy); const b = t * o.w; at(o.d, sx + Math.cos(b) * o.r, sy - Math.sin(b) * o.r); }); };
  } });

// 7 · Kepler and Galileo
B.push({ era: '1609–1619 · Prague, Linz · 1610 · Padua', kicker: 'Kepler and Galileo', title: 'Ellipses, and the evidence',
  body: 'From Tycho’s Mars, Kepler found that orbits are ellipses, swept at equal areas in equal times, with periods set by their size. Galileo’s telescope showed moons circling Jupiter and Venus running through a full set of phases. Shells nested by distance around Earth could no longer be literally true.',
  vis(v) { const s = svg('Kepler: a planet on an ellipse sweeping equal areas in equal times; Galileo: Jupiter and its moons'); v.appendChild(s); defs(s);
    const a = 190, e = .6, b = a * Math.sqrt(1 - e * e), cx = 270, cy = 250, fx = cx + a * e;
    el('ellipse', { cx, cy, rx: a, ry: b, class: 'hring hi' }, s); sun(s, fx, cy, 14);
    const wedges = el('g', {}, s), p = dot(s, 6, '#ff9d6e', 'hglow'), arm = el('line', { class: 'harm' }, s);
    const pos = M => { let E = M; for (let k = 0; k < 12; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return [cx + a * Math.cos(E), cy - b * Math.sin(E)]; };
    const jx = 500, jy = 70; el('circle', { cx: jx, cy: jy, r: 9, fill: '#e9d6b4' }, s); const jm = [3, 5, 8, 14].map(r => ({ r, d: dot(s, 2.2, '#e8ecff') })); txt(s, jx, jy + 34, 'Jupiter’s moons, 1610', 'tick', 'middle');
    let lastSlot = -1; txt(s, 20, 465, 'Each shaded sector takes the same time.', 'tick');
    this.anim = t => { const T = 9, ph = (t % T) / T, M = ph * TAU, [x, y] = pos(M); at(p, x, y); arm.setAttribute('x1', fx); arm.setAttribute('y1', cy); arm.setAttribute('x2', x); arm.setAttribute('y2', y);
      const slot = Math.floor(ph * 8); if (slot !== lastSlot) { if (slot === 0) wedges.innerHTML = ''; if (lastSlot >= 0 && slot % 2 === 1) { const pts = [`${fx},${cy}`]; for (let q = 0; q <= 20; q++) { const [wx, wy] = pos((slot - 1 + q / 20) / 8 * TAU); pts.push(`${wx.toFixed(1)},${wy.toFixed(1)}`); } el('polygon', { points: pts.join(' '), class: 'hwedge' }, wedges); } lastSlot = slot; }
      jm.forEach((m, k) => at(m.d, jx + Math.cos(t * (2.6 / (k + 1)) + k * 1.7) * m.r * 4, jy)); };
  } });

// 8 · Newton
B.push({ era: '1687 · Cambridge', kicker: 'Newton, Principia', title: 'One law for heaven and Earth',
  body: 'Gravity explains Kepler’s ellipses. The Sun and planets all orbit their common centre of mass, which lies close to the Sun’s surface. Newton tied motion to absolute space: a spinning bucket of water curves its surface, he argued, because it turns against space itself.',
  vis(v) { const s = svg('Newton: the Sun and Jupiter orbit their common centre of mass'); v.appendChild(s); defs(s); starfield(s, 50, 9);
    const cx = 280, cy = 240; ring(s, cx, cy, 190); ring(s, cx, cy, 20, 'hring hi');
    el('path', { d: `M${cx - 6} ${cy} L${cx + 6} ${cy} M${cx} ${cy - 6} L${cx} ${cy + 6}`, class: 'hcross' }, s); txt(s, cx + 10, cy + 34, 'common centre of mass', 'hlab');
    const sg = el('g', {}, s); sun(sg, 0, 0, 30); const j = dot(s, 11, '#e9d6b4');
    txt(s, 20, 465, 'The Sun’s wobble is exaggerated here; for Jupiter alone it is about one solar radius.', 'tick');
    this.anim = t => { const a = t * .5; sg.setAttribute('transform', `translate(${cx - Math.cos(a) * 20} ${cy + Math.sin(a) * 20})`); at(j, cx + Math.cos(a) * 190, cy - Math.sin(a) * 190); };
  } });

// 9 · Aberration, parallax, the galaxy, galaxies
B.push({ era: '1728 – 1925', kicker: 'Bradley · Bessel · Shapley · Hubble', title: 'The stars move, and so do we',
  body: 'Bradley found the yearly aberration of starlight in 1728. Bessel measured the first stellar parallax in 1838. Shapley showed in 1918 that the Sun lies far from the centre of the Milky Way, and Hubble showed in 1925 that the spiral nebulae are galaxies of their own.',
  vis(v) { const s = svg('Stellar parallax: a nearby star shifts against distant ones as Earth moves'); v.appendChild(s); defs(s);
    starfield(s, 60, 21, 0, 0, 600, 120); el('line', { x1: 0, y1: 120, x2: 600, y2: 120, class: 'hline' }, s); txt(s, 10, 140, 'the sky, as seen from Earth', 'tick');
    const cx = 200, cy = 360, r = 70; ring(s, cx, cy, r); sun(s, cx, cy, 14); const e = earth(s, 0, 0, 7);
    const st = { x: 330, y: 220 }; el('circle', { cx: st.x, cy: st.y, r: 4, fill: '#fff', class: 'hglow' }, s); txt(s, st.x + 10, st.y + 4, '61 Cygni', 'hlab');
    const ln = el('line', { class: 'hsight' }, s), img = dot(s, 5, '#ffd27a', 'hglow'); txt(s, 360, 330, 'Bessel, 1838: 0.3″', 'hlab');
    this.anim = t => { const a = t * .8, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; at(e, x, y);
      const dx = st.x - x, dy = st.y - y, k = (120 - y) / dy, ix = x + dx * k; ln.setAttribute('x1', x); ln.setAttribute('y1', y); ln.setAttribute('x2', ix); ln.setAttribute('y2', 120); at(img, ix, 120); };
  } });

// 10 · Einstein: two frames, one sky
B.push({ era: '1915 · Berlin', kicker: 'Einstein, general relativity', title: 'No privileged frame',
  body: 'General relativity writes its laws in any coordinates. A frame in which Earth is still is as legitimate as any other, provided its effects are counted: the forces of a turning frame and, on one reading of the theory, the dragging of inertial frames by the matter turning around it. The two pictures here show exactly the same sky.',
  vis(v) { const s = svg('The same motions drawn with the Sun at rest and with Earth at rest'); v.appendChild(s); defs(s);
    const L = { x: 150, y: 230 }, R = { x: 450, y: 230 }; txt(s, L.x, 40, 'Sun at rest', 'hlab', 'middle'); txt(s, R.x, 40, 'Earth at rest', 'hlab', 'middle');
    el('line', { x1: 300, y1: 60, x2: 300, y2: 420, class: 'hline' }, s);
    ring(s, L.x, L.y, 56); ring(s, L.x, L.y, 86); sun(s, L.x, L.y, 12); const eL = earth(s, 0, 0, 6), mL = dot(s, 4.5, '#ff9d6e');
    earth(s, R.x, R.y, 8); const sR = el('g', {}, s); sun(sR, 0, 0, 10); const mR = dot(s, 4.5, '#ff9d6e', 'hglow'), trR = curve(s, 'htrail'), sTr = curve(s, 'htrail2');
    const sk = 1.15; txt(s, 300, 455, 'Mars’s loops on the right are the same motion seen from Earth.', 'tick', 'middle');
    const kk = sk * .55, E = t => [Math.cos(t * .8) * 56, -Math.sin(t * .8) * 56], Mm = t => [Math.cos(t * .8 / 1.881) * 86, -Math.sin(t * .8 / 1.881) * 86];
    const relM = t => { const e = E(t), m = Mm(t); return [R.x + (m[0] - e[0]) * kk, R.y + (m[1] - e[1]) * kk]; }, relS = t => { const e = E(t); return [R.x - e[0] * kk, R.y - e[1] * kk]; };
    this.anim = t => { const ae = t * .8, am = t * .8 / 1.881, ex = Math.cos(ae) * 56, ey = -Math.sin(ae) * 56, mx = Math.cos(am) * 86, my = -Math.sin(am) * 86;
      at(eL, L.x + ex, L.y + ey); at(mL, L.x + mx, L.y + my);
      const sx = R.x - ex * sk * .55, sy = R.y - ey * sk * .55, rx = R.x + (mx - ex) * sk * .55, ry = R.y + (my - ey) * sk * .55;
      sR.setAttribute('transform', `translate(${sx} ${sy})`); at(mR, rx, ry); trR.draw(relM, t - 18, t, 360); sTr.draw(relS, t - 7.8, t, 120); };
  } });

// 11 · Today: the Sun moves
B.push({ era: 'Today', kicker: 'The Sun in motion', title: 'Nothing is at rest',
  body: 'The Sun carries its planets around the centre of the Milky Way at about 230 km/s, once every 230 million years or so. The planets trace long helices behind it, in a plane tipped about 60° to the galaxy’s. The Milky Way itself moves at about 600 km/s against the microwave background. Every centre is a choice.',
  vis(v) { const s = svg('The Sun moving through the galaxy with the planets tracing helices around it'); v.appendChild(s); defs(s); starfield(s, 90, 33);
    const inc = 60 * DEG, P = [[34, 1, '#9cc8ff'], [48, 1.88, '#ff9d6e'], [80, 5, '#f1e2c4'], [108, 9, '#e9d6b4']];
    const proj = (x, y, z) => [300 + (x - y * .35) * 1, 260 + (-z * .9 + y * .25)];
    const trs = P.map(([r, T, c]) => ({ r, w: 2.2 / T, c, tr: curve(s, 'hhelix') }));
    trs.forEach(o => { o.d = dot(s, o.r > 70 ? 5 : 3.6, o.c); });
    const sg = el('g', {}, s); sun(sg, 0, 0, 13); txt(s, 20, 40, '→ the Sun’s path around the galaxy, about 230 km/s', 'hlab');
    txt(s, 20, 465, 'Schematic: orbit sizes and the Sun’s speed are not to scale.', 'tick');
    this.anim = t => { const cyc = (t * 38) % 1000, sxw = cyc - 500, start = t - cyc / 38; const [sx, sy] = proj(sxw, 0, 0); sg.setAttribute('transform', `translate(${sx} ${sy})`);
      trs.forEach(o => { const f = tt => { const a = tt * o.w, u = Math.cos(a) * o.r, w = Math.sin(a) * o.r; return proj(sxw - (t - tt) * 38 + u, w * Math.cos(inc), w * Math.sin(inc)); };
        const [px, py] = f(t); at(o.d, px, py); o.tr.draw(f, Math.max(start, t - 14), t, 280); }); };
  } });

// 12 · who turns the sky
const ROWS = [['c. 350 BCE', 'Aristotle', 'The sphere of the stars, moved by an unmoved mover beyond it', 0], ['c. 150', 'Ptolemy', 'The first motion of the heavens as a whole; no starless sphere', 0],
  ['10th–11th c.', 'Ikhwān al-Ṣafāʾ · al-Kirmānī', 'al-Falak al-Muhit: a ninth, starless sphere that turns everything within it', 1], ['1543', 'Copernicus', 'Nothing: the stars are at rest and Earth spins', 0],
  ['1588', 'Tycho', 'The heavens turn daily about a still Earth', 0], ['1687', 'Newton', 'Nothing: rotation is measured against absolute space', 0],
  ['1915', 'Einstein', 'No privileged answer: the frame is a choice', 0], ['This model', 'Nine spheres', 'al-Falak al-Muhit, in the frame where Earth is still', 1]];
B.push({ era: 'Across the centuries', kicker: 'Who turns the sky?', title: 'The outermost mover',
  body: 'Every model has to say what makes the sky turn once a day. The starless encompassing sphere appears in only two places on this line: in the cosmology of the Islamic world, and here.',
  vis(v) { v.innerHTML = `<ol class="hline-list">${ROWS.map(([y, w, d, m], i) => `<li class="${m ? 'm' : ''}" style="--i:${i}"><span class="hy">${y}</span><b>${w}</b><span class="hd">${d}</span></li>`).join('')}</ol>`; } });

// 13 · al-Falak al-Muhit
const OMEGA = TAU / 86164.0905, R_EDGE = 46.27e9 * 9.4607e15, C = 299792458, V = OMEGA * R_EDGE;
B.push({ era: 'Sphere 9', cls: 'muhit', kicker: 'al-Falak al-Muhit', title: 'Once a day, beyond the edge',
  body: 'In this model al-Falak al-Muhit turns once every sidereal day, 23 hours 56 minutes, and its turning carries every sphere within it, so the whole sky wheels around a still Earth. Its inner face lies beyond the edge of the observable universe, 46 billion light-years away. To turn once a day out there, it must move at about 3 × 10²² metres per second, a hundred trillion (10¹⁴) times the speed of light. No material body can do that: here the physics of moving bodies gives out. What remains is geometry, and that is allowed. General relativity accepts the frame in which the heavens turn and Earth is still, and on one reading of the theory the turning heavens drag the inertial frames within them along. Mathematics and physics permit this description; no measurement can confirm or refute it, because nothing from beyond the edge can reach us.',
  vis(v) { v.innerHTML = '<div class="mu-wrap"></div><div class="mu-stats"></div>';
    const s = svg('al-Falak al-Muhit turning once a day and carrying the eight spheres within it', 600, 420); v.querySelector('.mu-wrap').appendChild(s); defs(s);
    const cx = 300, cy = 215; el('circle', { cx, cy, r: 205, fill: 'url(#hMuhit)' }, s);
    const all = el('g', {}, s); ring(all, cx, cy, 190, 'hmuhit'); for (let k = 0; k < 72; k++) { const a = k / 72 * TAU, r1 = k % 6 ? 184 : 176; el('line', { x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1, x2: cx + Math.cos(a) * 196, y2: cy + Math.sin(a) * 196, class: 'htick' }, all); }
    [26, 44, 62, 80, 98, 116, 134, 158].forEach((r, k) => { ring(all, cx, cy, r, k === 7 ? 'hring hi' : 'hring'); el('circle', { cx: cx + r, cy, r: k === 3 ? 5 : 3, fill: k === 3 ? '#ffd27a' : k === 7 ? '#fff' : '#cfd6ff' }, all); });
    for (let k = 0; k < 30; k++) { const a = k / 30 * TAU + .1; el('circle', { cx: cx + Math.cos(a) * 158, cy: cy + Math.sin(a) * 158, r: 1.2, class: 'hstar' }, all); }
    earth(s, cx, cy, 11); txt(s, cx, cy + 30, 'Earth, still', 'hlab', 'middle');
    const arc = el('path', { d: `M ${cx + 205} ${cy} A 205 205 0 0 0 ${cx + 205 * Math.cos(-.5)} ${cy + 205 * Math.sin(-.5)}`, class: 'harc', 'marker-end': '' }, s); void arc;
    txt(s, cx + 150, cy - 160, 'drags all within', 'hlab hgold');
    const stats = [['Turns once in', '23 h 56 min 4 s'], ['Inner radius', '4.4 × 10²⁶ m'], ['Speed at the rim', `${(V / 1e22).toFixed(1)} × 10²² m/s`], ['Compared with light', `${(V / C / 1e14).toFixed(2)} × 10¹⁴ c`]];
    v.querySelector('.mu-stats').innerHTML = stats.map(([a, b], i) => `<div style="--i:${i}"><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    this.anim = t => rot(all, -(t * 9) % 360, cx, cy);
  } });

B.push({ layout: 'title', label: 'Enter', html: `<p class="t-eyebrow">Now</p><h2 class="t-hero sm">Nine spheres, one sky</h2><p class="t-lede">You have seen how the heavens were drawn. Now see them drawn again: every modern measurement, held in nine spheres around a still Earth, inside al-Falak al-Muhit.</p><div class="t-ctas"><button class="t-cta" data-act="enter">Enter the model</button><button class="t-cta ghost" data-act="tour">What it can do, and how accurately</button></div>` });

let story = null;
export function openHistory() {
  if (!story) story = createStory(document.getElementById('history'), B, { vhPerBeat: 150,
    onAction: (act, close) => { close(true); window.__ui.enterModel(); if (act === 'tour' && window.__openTour) setTimeout(() => window.__openTour(), 500); },
    onClose: () => window.__ui.enterModel() });
  story.open();
}
window.__openHistory = openHistory;
