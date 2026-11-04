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
      if (k >= 7) txt(s, ox + rr * Math.cos(-142 * DEG) - 8, oy + rr * Math.sin(-142 * DEG) + (k === 8 ? -8 : 4), lab[k], k === 8 ? 'hlab hgold' : 'hlab', 'end'); });
    earth(s, ox, oy, 9);
    const ticks = el('g', {}, s); for (let k = 0; k < 36; k++) { const a = Math.PI + k / 36 * Math.PI; el('line', { x1: ox + Math.cos(a) * 240, y1: oy + Math.sin(a) * 240, x2: ox + Math.cos(a) * 256, y2: oy + Math.sin(a) * 256, class: 'htick' }, ticks); }
    this.anim = t => { const th = t * .9, c = { x: tx + r * Math.cos(th), y: ty + r * Math.sin(th) }, px = tx + 2 * r * Math.cos(th);
      at(sc, c.x, c.y); sp.setAttribute('x1', c.x); sp.setAttribute('y1', c.y); sp.setAttribute('x2', px); sp.setAttribute('y2', ty); at(pt, px, ty);
      rot(ticks, -((t * 12) % 10), ox, oy); };
  } });

// 4b · rising, descending, turning back
B.push({ era: 'Classical teaching · Ptolemy to the Ikhwān', kicker: 'Istiqāma · wuqūf · rujūʿ', title: 'Rising, descending, turning back',
  body: 'Classical astronomy named three states of a planet’s motion: istiqāma, moving directly eastward; wuqūf, standing at a station; and rujūʿ, turning back. In Ptolemy’s models a planet turns back when it is at the lowest point of its epicycle, nearest Earth (Almagest, Book XII). Each planet was also given houses among the signs, and a sign of exaltation and of fall (Tetrabiblos I.17 and I.19). The Ikhwān al-Ṣafāʾ tabulate the planets’ periods and how long each stays retrograde, and list the exaltations and falls, in their epistle on astronomy.',
  vis(v) { const s = svg('A planet on its epicycle: direct motion, stations and the backward stretch at the lowest point'); v.appendChild(s); defs(s);
    const ex = 250, ey = 250, R = 130, r = 58; ring(s, ex, ey, R); earth(s, ex, ey, 11);
    const epi = ring(s, 0, 0, r, 'hring hi'), tr = curve(s, 'htrail'), back = el('path', { class: 'hback', d: '' }, s), p = dot(s, 6, '#ff9d6e', 'hglow');
    const st1 = dot(s, 4, '#ffe08a'), st2 = dot(s, 4, '#ffe08a'), lab = txt(s, 470, 60, '', 'hlab big', 'start'), lab2 = txt(s, 470, 84, '', 'tick');
    const w1 = .3, w2 = 1.85, pt = t => { const a = t * w1, b = t * w2; return [ex + Math.cos(a) * R + Math.cos(b) * r, ey + Math.sin(a) * R + Math.sin(b) * r]; };
    const ang = t => { const [x, y] = pt(t); return Math.atan2(y - ey, x - ex); };
    txt(s, ex, ey + R + r + 30, 'the backward stretch comes at the bottom of the epicycle, nearest Earth', 'tick', 'middle');
    this.anim = t => { const a = t * w1, c = [ex + Math.cos(a) * R, ey + Math.sin(a) * R], [px, py] = pt(t); at(epi, c[0], c[1]); at(p, px, py); tr.draw(pt, t - 14, t, 260);
      // find the backward stretch of the last loop: where the angle seen from Earth decreases
      const pts = [], stt = []; let prev = ang(t - 14), was = null;
      for (let k = 1; k <= 280; k++) { const tt = t - 14 + 14 * k / 280, an = ang(tt); let d = an - prev; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; const bk = d < 0; if (was !== null && bk !== was) stt.push(pt(tt)); if (bk) { const q = pt(tt); pts.push(`${was ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`); } was = bk; prev = an; }
      back.setAttribute('d', pts.join(' ')); if (stt[0]) at(st1, ...stt[stt.length - 2] || stt[0]); if (stt[1]) at(st2, ...stt[stt.length - 1]);
      let d = ang(t + .02) - ang(t); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; const rate = d / .02;
      const m = Math.abs(rate) < .04 ? ['wuqūf', 'standing at a station'] : rate < 0 ? ['rujūʿ', 'turning back'] : ['istiqāma', 'moving directly'];
      lab.textContent = m[0]; lab2.textContent = m[1]; lab.setAttribute('class', 'hlab big ' + (m[0] === 'rujūʿ' ? 'hwarn' : '')); };
  } });

// 4c · the answer in this model: two steady forward turnings, and a backward stretch that belongs only to the view
B.push({ era: 'The answer in this model', kicker: 'Why Mars turns back', title: 'The lantern on the arm',
  body: 'Positions in the model follow Tycho’s arrangement, which gives exactly the same sky as the Sun-centred picture. The Sun circles the still Earth once a year. Mars rides on an arm from the Sun that turns once in 687 days. Both turnings always go forward, at nearly steady rates; neither ever reverses. Every 26 months the Sun’s faster circle overtakes Mars’s arm on the same side, and for about ten weeks the sum of the two forward motions points backward from Earth: that is rujūʿ. The path traced round Earth does curl at each passing, but nothing in Mars’s own motion turns back. Its arm is also tilted 1.85° to the Sun’s circle, so the path is not flat: it lies on a thin ring-shaped surface, which is why it draws a loop one time and a zigzag the next. In the model, open Mars’s card and choose “See the whole path”.',
  vis(v) { const s = svg('The Sun circles a still Earth; Mars rides on a steadily turning arm from the Sun; the direction seen from Earth turns back at each passing'); v.appendChild(s); defs(s); starfield(s, 50, 41);
    const ex = 235, ey = 245, RS = 66, RA = 66 * 1.524, RZ = 214, wS = .75, wA = wS / 1.881;
    ring(s, ex, ey, RZ, 'hring hi');
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; el('line', { x1: ex + Math.cos(a) * (RZ - 6), y1: ey - Math.sin(a) * (RZ - 6), x2: ex + Math.cos(a) * (RZ + 6), y2: ey - Math.sin(a) * (RZ + 6), class: 'hring hi' }, s); }
    txt(s, ex, ey - RZ - 12, 'the signs, seen from Earth', 'tick', 'middle');
    ring(s, ex, ey, RS, 'hpath'); earth(s, ex, ey, 10);
    const armRing = ring(s, 0, 0, RA), tr = curve(s, 'htrail'), back = el('path', { class: 'hback', d: '' }, s);
    const sight = el('line', { class: 'hsight2' }, s), zArc = el('path', { class: 'hzarc', d: '' }, s), zBack = el('path', { class: 'hback', d: '' }, s), zMark = dot(s, 4, '#ffe08a');
    const sg = el('g', {}, s); sun(sg, 0, 0, 12); const arm = el('line', { class: 'harmM' }, s), md = dot(s, 5.5, '#ff9d6e', 'hglow');
    // three dials: the Sun's circle and the arm always turn forward; the direction seen from Earth sometimes turns back
    const dials = [['the Sun’s circle', '#ffd27a'], ['Mars’s arm', '#ff9d6e'], ['seen from Earth', '#eceef6']].map(([l, c], k) => { const y = 70 + k * 120, g = el('g', {}, s);
      el('circle', { cx: 540, cy: y, r: 28, class: 'hring hi' }, g); const h = el('line', { x1: 540, y1: y, x2: 568, y2: y, stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
      txt(g, 540, y + 46, l, 'tick', 'middle'); const st = txt(g, 540, y + 60, 'always forward', 'tick hok', 'middle'); return { y, h, st, c }; });
    const pos = t => { const a = t * wS, b = t * wA, sx = Math.cos(a) * RS, sy = Math.sin(a) * RS; return { sx, sy, mx: sx + Math.cos(b) * RA, my: sy + Math.sin(b) * RA, a, b }; };
    const P = t => { const q = pos(t); return [ex + q.mx, ey - q.my]; }, dirA = t => { const q = pos(t); return Math.atan2(q.my, q.mx); };
    const setHand = (d, ang) => { d.h.setAttribute('x2', (540 + Math.cos(ang) * 26).toFixed(1)); d.h.setAttribute('y2', (d.y - Math.sin(ang) * 26).toFixed(1)); };
    txt(s, 20, 477, 'Not to scale in time: a year here passes in about eight seconds.', 'tick');
    this.anim = t => { const q = pos(t), sx = ex + q.sx, sy = ey - q.sy, mx = ex + q.mx, my = ey - q.my;
      sg.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`); at(armRing, sx, sy); at(md, mx, my);
      arm.setAttribute('x1', sx); arm.setAttribute('y1', sy); arm.setAttribute('x2', mx); arm.setAttribute('y2', my);
      tr.draw(P, t - 18, t, 300);
      // backward stretches of the path, and of the direction on the ring of signs
      const pb = [], zb = [], za = []; let prev = dirA(t - 18), was = false;
      for (let k = 1; k <= 300; k++) { const tt = t - 18 + 18 * k / 300, an = dirA(tt); let d = an - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; const bk = d < 0;
        if (k > 240) za.push(`${za.length ? 'L' : 'M'}${(ex + Math.cos(an) * RZ).toFixed(1)} ${(ey - Math.sin(an) * RZ).toFixed(1)}`);
        if (bk) { const [x, y] = P(tt); pb.push(`${was ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`); zb.push(`${was ? 'L' : 'M'}${(ex + Math.cos(an) * RZ).toFixed(1)} ${(ey - Math.sin(an) * RZ).toFixed(1)}`); }
        was = bk; prev = an; }
      back.setAttribute('d', pb.join(' ')); zBack.setAttribute('d', zb.join(' ')); zArc.setAttribute('d', za.join(' '));
      const an = dirA(t); at(zMark, ex + Math.cos(an) * RZ, ey - Math.sin(an) * RZ);
      sight.setAttribute('x1', ex); sight.setAttribute('y1', ey); sight.setAttribute('x2', ex + Math.cos(an) * RZ); sight.setAttribute('y2', ey - Math.sin(an) * RZ);
      let d = dirA(t + .02) - an; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      setHand(dials[0], q.a); setHand(dials[1], q.b); setHand(dials[2], an);
      const bk = d < 0, d2 = dials[2]; d2.h.setAttribute('stroke', bk ? '#ff4d6d' : d2.c); const tx = bk ? 'turning back · rujūʿ' : 'forward · istiqāma';
      if (d2.st.textContent !== tx) { d2.st.textContent = tx; d2.st.setAttribute('class', 'tick ' + (bk ? 'hwarn' : 'hok')); } };
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

// 9b · the stars' yearly ellipses, read from a still Earth
const PX = [['Proxima Cen', .768, -44.8], ['61 Cygni', .286, 51.7], ['Vega', .130, 61.7], ['Deneb', .0023, 59.9]];
B.push({ era: 'The answer in this model', kicker: 'Parallax and aberration, read from a still Earth', title: 'Why the stars trace small loops',
  body: 'Each year every star traces a tiny ellipse. In the Sun-centred picture this is Earth swinging round the Sun. With Earth still, the same numbers say something else: the whole eighth sphere is carried, without turning, round a copy of the Sun’s yearly circle, in step with the Sun. No star wanders. The near ones simply show the carry more: Proxima Centauri’s ellipse is 0.77″ across its long half, 61 Cygni’s 0.29″, Deneb’s two thousandths. A second ellipse, 20.5″ for every star alike, is aberration: light arriving through the yearly swing of the frame. It runs a quarter-year behind the first. Both are locked to the Sun’s year, and the model draws both at their true sizes.',
  vis(v) { const s = svg('Every star traces a yearly ellipse in step with the Sun: parallax sized by distance, aberration the same for all'); v.appendChild(s); defs(s); starfield(s, 40, 77);
    const ex = 300, ey = 418, RS = 38, kP = 40, kA = 22, rows = [[118, 'Parallax · the eighth sphere carried round a copy of the Sun’s circle · size ∝ 1/distance'], [270, 'Aberration · 20.5″ for every star · a quarter-year behind']];
    rows.forEach(([y, l]) => txt(s, 20, y - 62, l, 'hlab'));
    ring(s, ex, ey, RS, 'hpath'); earth(s, ex, ey, 9); const sg = el('g', {}, s); sun(sg, 0, 0, 9); const vel = el('line', { class: 'hsight' }, s);
    txt(s, ex + 52, ey + 4, 'the Sun’s yearly circle', 'tick');
    const items = [];
    PX.forEach(([n, p, b], k) => { const x = 85 + k * 145, sb = Math.abs(Math.sin(b * DEG));
      for (const [ri, [y]] of rows.entries()) { const rx = ri ? kA : Math.max(.6, p * kP), ry = rx * sb;
        el('ellipse', { cx: x, cy: y, rx, ry, class: 'hpath' }, s); const d = dot(s, ri ? 3 : 3.6, '#fff', 'hglow'); items.push({ x, y, rx, ry, d, lag: ri ? Math.PI / 2 : 0 }); }
      txt(s, x, rows[0][0] + 42, n, 'tick', 'middle'); txt(s, x, rows[0][0] + 56, p >= .01 ? p.toFixed(2) + '″' : p.toFixed(4) + '″', 'tick', 'middle'); });
    txt(s, 20, 458, 'Parallax drawn 45 times larger than aberration. Phases schematic: each shift points toward', 'tick'); txt(s, 20, 474, 'the Sun’s place (parallax) or opposite to the Sun’s yearly motion (aberration).', 'tick');
    this.anim = t => { const a = t * .8, sx = ex + Math.cos(a) * RS, sy = ey - Math.sin(a) * RS; sg.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
      vel.setAttribute('x1', sx); vel.setAttribute('y1', sy); vel.setAttribute('x2', sx - Math.sin(a) * 26); vel.setAttribute('y2', sy - Math.cos(a) * 26);
      items.forEach(it => { const ph = a - it.lag; at(it.d, it.x + Math.cos(ph) * it.rx, it.y - Math.sin(ph) * it.ry); }); };
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

// 11b · one sky, every test
const TESTS = [
  ['Planets brighten and dim; the Moon’s size changes', 'Spheres flex to each body’s measured distance', 1],
  ['Mars loops backward around opposition', 'Positions from the ephemeris, seen from Earth', 1],
  ['Venus shows every phase, full included', 'Venus’s sphere reaches past the Sun’s', 1],
  ['Moons circle Jupiter', 'Carried with Jupiter, each with its own light time', 1],
  ['Total and annular eclipses, and their times', 'Moon’s true distance; times within seconds of NASA', 1],
  ['Aberration (20.5″) and parallax (to 0.77″)', 'A yearly motion of the eighth sphere, at true size', 1],
  ['Radar and laser ranges', 'Read back from the geometry to one part in 10⁸', 1],
  ['Mercury’s perihelion advance', 'Contained in the fitted ephemeris', 1],
  ['Foucault’s pendulum, the Coriolis effect', 'Frame forces of the Earth-fixed frame (described, not simulated)', 2],
  ['Starlight bent by the Sun', 'Not yet applied: 1.75″ at the Sun’s edge', 0],
  ['Galaxies’ redshifts, the microwave background', 'Placed at comoving distances; physics unchanged', 1]];
B.push({ era: 'The scorecard', kicker: 'Every test, one sky', title: 'What the nested spheres must match',
  body: 'Each model above was caught by something seen from Earth. This model is held to all of it at once, and to the modern barycentric calculation, which it reproduces to milliarcseconds. One item is still open, and it is marked.',
  vis(v) { v.innerHTML = `<table class="hscore"><thead><tr><th>Seen from Earth</th><th>In the flexing spheres</th><th></th></tr></thead><tbody>${TESTS.map(([a, b, ok], i) => `<tr style="--i:${i}"><td>${a}</td><td>${b}</td><td class="st s${ok}">${ok === 1 ? '✓' : ok === 2 ? '≈' : '○'}</td></tr>`).join('')}</tbody></table><p class="hkey">✓ reproduced · ≈ accounted for in the description · ○ not yet applied</p>`; } });

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
  body: 'In this model al-Falak al-Muhit turns once every sidereal day, 23 hours 56 minutes, and its turning carries every sphere within it, so the whole sky wheels around a still Earth. Its inner face lies beyond the edge of the observable universe, 46 billion light-years away. To turn once a day out there, it must move at about 3 × 10²² metres per second, a hundred trillion (10¹⁴) times the speed of light. No material body can do that: here the physics of moving bodies gives out. What remains is geometry, and that is allowed. General relativity accepts the frame in which the heavens turn and Earth is still, and on one reading of the theory the turning heavens drag the inertial frames within them along. Mathematics and physics permit this description; no measurement can confirm or refute it, because nothing from beyond the edge can reach us. What turns al-Muhit, and why inertia follows the distant universe, physics cannot yet say.',
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

B.push({ layout: 'title', label: 'Enter', html: `<p class="t-eyebrow">Now</p><h2 class="t-hero sm">Nine spheres, one sky</h2><p class="t-lede">You have seen how the heavens were drawn. Now see them drawn again: every modern measurement, held in nine spheres around a still Earth, inside al-Falak al-Muhit.</p><div class="t-ctas"><button class="t-cta" data-act="enter">Enter the model</button><button class="t-cta ghost" data-act="tour">What it can do, and how accurately</button><button class="t-cta ghost" data-act="whatif">What if the spheres did more?</button></div>` });


// ---------- for every model: what the sky showed, the fault, and how the flexing spheres handle it ----------
const EVIDENCE = {
  'Rising, descending, turning back': [
    'Every 26 months Mars slows, stands still, turns back for about ten weeks, stands again and moves on. It happens only when Mars is opposite the Sun, nearest Earth and at its brightest.',
    'None in the teaching itself: a planet does turn back at its nearest. What failed was the epicycle taken as a real wheel, together with the rigid order of shells (see Venus’s phases).',
    'The same three states appear in the flexing spheres. Mars descends toward Earth (hubūṭ), stands (wuqūf), turns back at its nearest (rujūʿ), and rises again (ṣuʿūd). The model names each state, and marks every planet’s houses, exaltation and fall.'],
  'Spheres within spheres': [
    'Planets change in brightness: Mars at opposition is many times brighter than at conjunction. Some solar eclipses are total, others annular, so the Moon’s distance changes.',
    'Every body is fixed to a sphere centred on Earth, so its distance can never change. The nested spheres also cannot reproduce the size and shape of Mars’s backward loops.',
    'Each flexing sphere follows its body’s measured distance, bulging and dipping as the body comes nearer or goes farther. Brightness, apparent size and annular eclipses come out right.'],
  'A Sun at the centre, too early': [
    'Critics expected the stars to shift through the year if Earth moved, and saw nothing. No one felt Earth moving.',
    'The objection was mistaken: the largest stellar parallax is 0.77″, far below the eye’s limit. The model itself had circles and no quantitative theory.',
    'The eighth sphere is carried, without turning, round a copy of the Sun’s yearly circle, so each star traces a small ellipse in step with the Sun, larger for nearer stars, at true size. No star wanders; Earth stays still. Aberration (20.5″, the same for all) is drawn too.'],
  'Circles on circles': [
    'Venus shows a full set of phases (Galileo, 1610), so it passes behind the Sun. The Moon’s apparent size changes by only about 13%, not the near doubling Ptolemy’s lunar model implies. By the 16th century the tables were off by degrees for Mars.',
    'Spheres ordered rigidly by distance keep Venus always between Earth and the Sun. The equant breaks uniform circular motion. Each planet’s cycle is tied to the Sun by coincidence, not cause.',
    'The order of the spheres is kept but distances are not forced: when Venus lies beyond the Sun its sphere reaches out past the Sun’s, so every phase appears. The Moon’s distance comes from the ephemeris.'],
  'The ninth sphere': [
    'The same evidence that later counted against Ptolemy: Venus’s full phases, the Moon’s nearly constant size, and the planets’ cycles locked to the Sun’s year.',
    'Better mechanisms (the Ṭūsī couple, Ibn al-Shāṭir’s equant-free models) but the same frame: distance-ordered shells, and no physical reason for the solar link.',
    'The solar link appears because positions come from the Sun’s gravity, expressed in the Earth-fixed frame. The ninth sphere is kept as the description of the daily turn, which is exactly the turn of Earth read the other way.'],
  'Turned inside out': [
    'Tycho measured positions to about 2′. Tables built on Copernicus’s circles missed Mars by degrees; even Kepler’s best circle-based model missed by 8′, the famous eight minutes that forced him to ellipses. No stellar parallax could be found.',
    'Perfect circles at uniform speed, centred near (not on) the Sun, and a single motionless sphere for all the stars.',
    'The ephemeris contains elliptical orbits and the planets’ mutual pulls. The stars are placed at their measured distances, from a few light-years to thousands.'],
  'A still Earth, done better': [
    'Positions cannot tell it from Copernicus. What later counted against it as physics: the aberration of starlight (1728), parallax (1838), and Foucault’s pendulum (1851), which turns because the ground turns under it.',
    'Read as dynamics, a heavy Sun orbiting a light, unaccelerated Earth breaks Newton’s laws. The orbits were still circles.',
    'The model keeps Tycho’s still Earth and adds what Newton requires: the frame forces of the Earth-fixed description. Aberration and parallax become yearly motions of the eighth sphere; the pendulum’s turn is the Coriolis effect of the turning frame.'],
  'Ellipses, and the evidence': [
    'Over decades planets drift off pure ellipses: Jupiter and Saturn speed up and slow down in a 900-year cycle, and Mercury’s closest point to the Sun advances 43″ a century more than Newtonian theory allows.',
    'Each planet is treated alone around a fixed Sun. Mutual pulls and relativity are missing.',
    'The model’s ephemeris (VSOP87) includes the mutual perturbations and is fitted to relativistic numerical ephemerides, so these drifts are in its positions, within its arcminute accuracy.'],
  'One law for heaven and Earth': [
    'Mercury’s extra 43″ per century (Le Verrier, 1859). Starlight bent by 1.75″ at the Sun’s edge (1919), twice the Newtonian value. No experiment could find absolute space (Michelson and Morley, 1887).',
    'Absolute space, and gravity acting instantly at a distance.',
    'Mercury’s advance is in the fitted ephemeris. The frame is a choice, not absolute space. Light bending by the Sun is not yet applied in the model: an open limitation of 1.75″ at the Sun’s edge, a few thousandths of an arcsecond elsewhere.'],
  'The stars move, and so do we': [
    'Aberration of 20.5″ (1728), parallax of 0.3″ for 61 Cygni (1838), the Sun far from the galaxy’s centre (1918), and galaxies beyond our own (1925).',
    'What fell here was the shared assumption of every earlier model: one sphere holding all the stars at a single distance, with nothing beyond.',
    'The eighth sphere holds 8,920 stars at their parallax distances and 9,879 galaxies at distances from their redshifts, out to the edge of what can be seen.'],
  'No privileged frame': [
    'General relativity has passed every test made of it: Mercury, light bending, radar delays, gravitational waves, black-hole images.',
    'No known failure where it has been tested. To fit galaxies and the expansion of the universe it needs dark matter and dark energy, which have not been detected directly.',
    'The model works inside general relativity: an Earth-fixed frame with its frame effects included. It inherits the theory’s successes and its open questions alike.'],
  'Nothing is at rest': [
    'The Sun’s motion through the galaxy is measured from the motions of nearby stars; our motion against the microwave background shows as its 3.36 mK dipole.',
    'No fault: this is the modern, barycentric picture. Its centre is a choice of convenience.',
    'Every observation in this picture is reproduced. Read back from the nested spheres alone, directions agree with it within 2.2 milliarcseconds and distances within one part in 10⁸, from 1900 to 2100.']
};
const evCard = ([seen, fault, fix]) => `<div class="hev"><div class="hev-r seen"><h4>What the sky showed</h4><p>${seen}</p></div><div class="hev-r fault"><h4>The fault</h4><p>${fault}</p></div><div class="hev-r fix"><h4>In the nested, flexing spheres</h4><p>${fix}</p></div></div>`;
B.forEach(b => { const ev = EVIDENCE[b.title]; if (!ev) return; const vis0 = b.vis; b.cls = (b.cls ? b.cls + ' ' : '') + 'hasev';
  b.vis = function (v) { vis0.call(this, v); v.insertAdjacentHTML('beforeend', evCard(ev)); }; });

// ---------- beside each past model: an animation of how the nested, flexing spheres handle the same evidence ----------
const FIXTYPE = { 'Rising, descending, turning back': 'retro', 'Spheres within spheres': 'distance', 'A Sun at the centre, too early': 'parallax', 'Circles on circles': 'venus', 'The ninth sphere': 'solar',
  'Turned inside out': 'ellipse', 'A still Earth, done better': 'frame', 'Ellipses, and the evidence': 'rosette', 'One law for heaven and Earth': 'bending',
  'The stars move, and so do we': 'depth', 'No privileged frame': 'none', 'Nothing is at rest': 'agree' };
function fixScene(type) {
  const s = el('svg', { viewBox: '0 0 300 300', role: 'img', class: 'tsvg hsvg hfixsvg' }); defs(s);
  const C = 150, cap = txt(s, 150, 292, '', 'tick', 'middle'); let anim = () => {};
  const flexLine = cls => el('path', { class: cls }, s);
  const curvePath = f => { const p = []; for (let q = 0; q <= 120; q++) { const th = q / 120 * TAU, r = f(th); p.push(`${(C + Math.cos(th) * r).toFixed(1)},${(C - Math.sin(th) * r).toFixed(1)}`); } return 'M' + p.join(' L') + 'Z'; };
  const bump = (th, th0, w) => { let d = Math.atan2(Math.sin(th - th0), Math.cos(th - th0)); return Math.exp(-d * d / (2 * w * w)); };
  if (type === 'distance') {
    s.setAttribute('aria-label', 'Mars on its flexing sphere, coming nearer and brighter at opposition');
    const sunS = flexLine('hflex sun'), marS = flexLine('hflex'); earth(s, C, C, 8); const sd = dot(s, 6, '#ffd27a'), md = dot(s, 4, '#ff9d6e', 'hglow');
    cap.textContent = 'Mars’s sphere follows its distance: near, and bright, at opposition';
    const R = d => 46 + 52 * Math.log(d / .4);
    anim = t => { const ae = t * .5, am = ae / 1.881, ex = Math.cos(ae), ey = Math.sin(ae), mx = 1.524 * Math.cos(am) - ex, my = 1.524 * Math.sin(am) - ey, dM = Math.hypot(mx, my), thM = Math.atan2(my, mx), thS = Math.atan2(-ey, -ex);
      const rM = R(dM), rS = R(1), fM = th => 108 + (rM - 108) * bump(th, thM, .45), fS = th => Math.min(rS, fM(th) - 9);
      marS.setAttribute('d', curvePath(fM)); sunS.setAttribute('d', curvePath(fS));
      at(sd, C + Math.cos(thS) * rS, C - Math.sin(thS) * rS); at(md, C + Math.cos(thM) * rM, C - Math.sin(thM) * rM); md.setAttribute('r', 2.2 + 3.2 / dM); };
  } else if (type === 'retro') {
    s.setAttribute('aria-label', 'Mars descending to its nearest, turning back, and rising again on its flexing sphere');
    const marS = flexLine('hflex'); earth(s, C, C, 8); const tr = curve(s, 'hasc'), trB = el('path', { class: 'hback', d: '' }, s), md = dot(s, 4.5, '#ff9d6e', 'hglow');
    const lab = txt(s, 150, 28, '', 'hlab big', 'middle');
    const R = d => 34 + 44 * Math.log(d / .35), mars = tt => { const ae = tt * .5, am = ae / 1.881, mx = 1.524 * Math.cos(am) - Math.cos(ae), my = 1.524 * Math.sin(am) - Math.sin(ae); return { d: Math.hypot(mx, my), th: Math.atan2(my, mx) }; };
    const xy = tt => { const m = mars(tt); return [C + Math.cos(m.th) * R(m.d), C - Math.sin(m.th) * R(m.d)]; };
    cap.textContent = 'Sphere blue while Mars descends, gold while it rises; the backward stretch, in red, comes at its nearest';
    anim = t => { const m = mars(t), rM = R(m.d); marS.setAttribute('d', curvePath(th => 104 + (rM - 104) * bump(th, m.th, .45))); const [x, y] = xy(t); at(md, x, y); md.setAttribute('r', 2.2 + 3 / m.d);
      tr.draw(xy, t - 16, t, 240); const pts = []; let prev = mars(t - 16).th;
      let wasB = false; for (let k = 1; k <= 240; k++) { const tt = t - 16 + 16 * k / 240, th = mars(tt).th; let d = th - prev; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; if (d < 0) { const q = xy(tt); pts.push(`${wasB ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`); } wasB = d < 0; prev = th; }
      trB.setAttribute('d', pts.join(' '));
      const d1 = mars(t + .03).d - m.d; let dth = mars(t + .03).th - m.th; if (dth > Math.PI) dth -= 2 * Math.PI; if (dth < -Math.PI) dth += 2 * Math.PI;
      lab.textContent = Math.abs(dth) < .0006 ? 'wuqūf · station' : dth < 0 ? 'rujūʿ · turning back' : d1 < 0 ? 'hubūṭ · descending' : 'ṣuʿūd · rising';
      marS.setAttribute('class', d1 < 0 ? 'hflex desc' : 'hflex asc'); };
  } else if (type === 'parallax') {
    s.setAttribute('aria-label', 'The eighth sphere carried round a copy of the Sun’s yearly circle: nearer stars show bigger ellipses, all in step with the Sun');
    const ex = C, ey = 214, RS = 34; ring(s, ex, ey, RS, 'hpath'); earth(s, ex, ey, 8); const sd = dot(s, 6, '#ffd27a');
    el('path', { d: 'M20 108 Q150 52 280 108', class: 'hring hi' }, s); txt(s, 150, 46, 'the eighth sphere', 'tick', 'middle');
    const st = [[70, 96, 24, 'near'], [150, 74, 11, 'farther'], [232, 96, 2.5, 'far']].map(([x, y, r, l]) => { el('ellipse', { cx: x, cy: y, rx: r, ry: r * .45, class: 'hpath' }, s); txt(s, x, y + 26, l, 'tick', 'middle');
      return { x, y, r, d: dot(s, 3.4, '#fff', 'hglow'), ln: el('line', { class: 'hsight2' }, s) }; });
    cap.textContent = 'Each star copies the Sun’s yearly circle, in step with it; nearer stars show a bigger copy (greatly enlarged)';
    anim = t => { const a = t * .7, c = Math.cos(a), sn = Math.sin(a); at(sd, ex + c * RS, ey - sn * RS);
      st.forEach(q => { const x = q.x + c * q.r, y = q.y - sn * q.r * .45; at(q.d, x, y); q.ln.setAttribute('x1', ex + c * RS); q.ln.setAttribute('y1', ey - sn * RS); q.ln.setAttribute('x2', x); q.ln.setAttribute('y2', y); }); };
  } else if (type === 'venus') {
    s.setAttribute('aria-label', 'Venus’s flexing sphere reaching past the Sun’s, with Venus showing a full phase');
    const vS = flexLine('hflex'), sS = flexLine('hflex sun'); earth(s, C, C, 8); const sd = dot(s, 7, '#ffd27a'), vd = dot(s, 4.5, '#fff3d6');
    const ph = el('g', {}, s), phB = el('circle', { cx: 262, cy: 40, r: 16, fill: '#141826' }, ph), phL = el('path', { fill: '#fff3d6' }, ph); txt(s, 262, 70, 'Venus', 'tick', 'middle'); void phB;
    cap.textContent = 'Beyond the Sun, Venus’s sphere reaches past the Sun’s: full phase';
    anim = t => { const ae = t * .45, av = ae / .615, sx = 80 * Math.cos(ae), sy = 80 * Math.sin(ae), vx = sx + 58 * Math.cos(av), vy = sy + 58 * Math.sin(av);
      const dV = Math.hypot(vx, vy), thV = Math.atan2(vy, vx), thS = Math.atan2(sy, sx), fV = th => 46 + (dV - 46) * bump(th, thV, .32), fS = th => Math.max(80, fV(th) + 9);
      vS.setAttribute('d', curvePath(fV)); sS.setAttribute('d', curvePath(fS)); at(sd, C + sx, C - sy); at(vd, C + vx, C - vy);
      const k = (1 + ((-vx) * (sx - vx) + (-vy) * (sy - vy)) / (dV * 58)) / 2, r = 16, e = Math.abs(2 * k - 1) * r, cx = 262, cy = 40;
      phL.setAttribute('d', `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${e} ${r} 0 0 ${k > .5 ? 1 : 0} ${cx} ${cy - r} Z`); };
  } else if (type === 'solar') {
    s.setAttribute('aria-label', 'Mars looping backward exactly when the Sun is opposite');
    const tr = curve(s, 'htrail'); earth(s, C, C, 8); const sl = el('line', { class: 'hsight' }, s), sd = dot(s, 6, '#ffd27a'), md = dot(s, 4, '#ff9d6e');
    const R = d => 40 + 48 * Math.log(d / .4), mars = tt => { const ae = tt * .5, am = ae / 1.881, mx = 1.524 * Math.cos(am) - Math.cos(ae), my = 1.524 * Math.sin(am) - Math.sin(ae), d = Math.hypot(mx, my), th = Math.atan2(my, mx); return [C + Math.cos(th) * R(d), C - Math.sin(th) * R(d)]; };
    cap.textContent = 'Mars loops when the Sun is opposite: the link is the Sun’s gravity';
    anim = t => { const ae = t * .5, sx = C - Math.cos(ae) * 62, sy = C + Math.sin(ae) * 62; at(sd, sx, sy); sl.setAttribute('x1', C); sl.setAttribute('y1', C); sl.setAttribute('x2', sx); sl.setAttribute('y2', sy);
      const [mx, my] = mars(t); at(md, mx, my); tr.draw(mars, t - 22, t, 260); };
  } else if (type === 'ellipse') {
    s.setAttribute('aria-label', 'The true ellipse of Mars against a circle, with the gap between them');
    const a = 110, e = .28, b = a * Math.sqrt(1 - e * e), cx = C - a * e * .5, fx = cx + a * e;
    el('circle', { cx: fx - a * e / 2, cy: C, r: a, class: 'hring' }, s); el('ellipse', { cx, cy: C, rx: a, ry: b, class: 'hring hi' }, s); sun(s, fx, C, 9);
    const gap = el('line', { class: 'hsight' }, s), ghost = dot(s, 3.5, 'rgba(158,196,255,.7)'), pd = dot(s, 5, '#ff9d6e', 'hglow');
    cap.textContent = 'The ephemeris uses the true ellipse: the old 8′ gap is gone (exaggerated)';
    anim = t => { const M = (t * .45) % TAU; let E = M; for (let k = 0; k < 10; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      const x = cx + a * Math.cos(E), y = C - b * Math.sin(E), gx = fx - a * e / 2 + a * Math.cos(M), gy = C - a * Math.sin(M);
      at(pd, x, y); at(ghost, gx, gy); gap.setAttribute('x1', x); gap.setAttribute('y1', y); gap.setAttribute('x2', gx); gap.setAttribute('y2', gy); };
  } else if (type === 'frame') {
    s.setAttribute('aria-label', 'A uniform yearly field carrying the Sun around a still Earth, and a pendulum turning with the frame');
    ring(s, C, C, 100); const arrows = el('g', {}, s);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { if (!i && !j) continue; el('path', { d: `M${C + i * 44 - 9} ${C + j * 44} L${C + i * 44 + 9} ${C + j * 44} M${C + i * 44 + 4} ${C + j * 44 - 4} L${C + i * 44 + 9} ${C + j * 44} L${C + i * 44 + 4} ${C + j * 44 + 4}`, class: 'hfield', 'data-x': C + i * 44, 'data-y': C + j * 44 }, arrows); }
    earth(s, C, C, 10); const pend = el('line', { class: 'hpend' }, s), sd = dot(s, 7, '#ffd27a');
    cap.textContent = 'The yearly field carries the Sun; the turning frame turns the pendulum';
    anim = t => { const a = t * .5, sx = C + Math.cos(a) * 100, sy = C - Math.sin(a) * 100; at(sd, sx, sy);
      const dir = Math.atan2(-(C - sy), C - sx) * 180 / Math.PI;   // field points from the Sun towards Earth
      arrows.querySelectorAll('path').forEach(p => p.setAttribute('transform', `rotate(${-dir} ${p.dataset.x} ${p.dataset.y})`));
      const pa = t * .35; pend.setAttribute('x1', C - Math.cos(pa) * 18); pend.setAttribute('y1', C - Math.sin(pa) * 18); pend.setAttribute('x2', C + Math.cos(pa) * 18); pend.setAttribute('y2', C + Math.sin(pa) * 18); };
  } else if (type === 'rosette') {
    s.setAttribute('aria-label', 'A slowly turning ellipse: perihelion advance, exaggerated');
    const a = 100, e = .45, b = a * Math.sqrt(1 - e * e); sun(s, C, C, 9);
    const ghosts = [0, 1, 2].map(k => el('ellipse', { rx: a, ry: b, class: 'hring', opacity: .35 + k * .2 }, s)), cur = el('ellipse', { rx: a, ry: b, class: 'hring hi' }, s), pd = dot(s, 5, '#e8ecff', 'hglow');
    cap.textContent = 'Mutual pulls and Mercury’s 43″ a century are in the ephemeris (exaggerated)';
    anim = t => { const w = t * .12; const setE = (n, ang) => n.setAttribute('transform', `translate(${C} ${C}) rotate(${-ang * 180 / Math.PI}) translate(${-a * e} 0)`);
      ghosts.forEach((g, k) => setE(g, w - (3 - k) * .35)); setE(cur, w);
      const M = (t * .9) % TAU; let E = M; for (let k = 0; k < 10; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      const x = a * Math.cos(E) - a * e, y = b * Math.sin(E), cw = Math.cos(w), sw = Math.sin(w); at(pd, C + x * cw + y * sw, C - x * sw + y * cw); };
  } else if (type === 'bending') {
    s.setAttribute('aria-label', 'Starlight bent by the Sun: not yet applied in the model');
    sun(s, C, C, 26); el('circle', { cx: 18, cy: C - 34, r: 3, fill: '#fff' }, s); earth(s, 284, C - 34, 6);
    el('line', { x1: 18, y1: C - 34, x2: 284, y2: C - 34, class: 'hsight2' }, s);
    const bent = el('path', { d: `M18 ${C - 34} Q ${C} ${C - 22} 284 ${C - 34}`, class: 'hbent' }, s), ph = dot(s, 3, '#ffd9a0');
    txt(s, C, 66, '○ open in the model', 'hlab hwarn', 'middle'); cap.textContent = '1.75″ at the Sun’s edge: not yet applied (bending exaggerated)';
    anim = t => { const L = bent.getTotalLength(), p = bent.getPointAtLength((t * 70) % L); at(ph, p.x, p.y); };
  } else if (type === 'depth') {
    s.setAttribute('aria-label', 'Stars and galaxies at their measured distances inside the eighth sphere');
    earth(s, C, C, 7); const g = el('g', {}, s); let q = 5; const r = () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let k = 0; k < 160; k++) { const a = r() * TAU, rr = 50 + Math.pow(r(), .8) * 92; el('circle', { cx: C + Math.cos(a) * rr, cy: C + Math.sin(a) * rr, r: rr > 120 ? .9 : 1.3, fill: rr > 120 ? '#c9b8ff' : '#e8ecff', opacity: .8 }, g); }
    [[50, '4 ly'], [95, '1,000 ly'], [140, 'galaxies · to 46 Gly']].forEach(([rr, l]) => { ring(s, C, C, rr); txt(s, C + 4, C - rr - 3, l, 'tick'); });
    cap.textContent = 'Stars and galaxies at their measured distances (log scale)';
    anim = t => rot(g, (t * 3) % 360, C, C);
  } else if (type === 'none') {
    s.setAttribute('aria-label', 'Nothing to fix');
    el('circle', { cx: C, cy: 128, r: 52, class: 'hring hi' }, s); const ck = el('path', { d: `M${C - 24} 128 L${C - 6} 146 L${C + 28} 110`, class: 'hcheck' }, s);
    txt(s, C, 222, 'Nothing to fix', 'hlab big', 'middle'); cap.textContent = 'The model is general relativity, written for a still Earth';
    let L = 0; anim = t => { if (!L) L = ck.getTotalLength(); ck.style.strokeDasharray = L; ck.style.strokeDashoffset = L * Math.max(0, 1 - ((t % 6) / 1.4)); };
  } else if (type === 'agree') {
    s.setAttribute('aria-label', 'The nested spheres agree with the barycentric calculation');
    const c1 = el('circle', { cx: C - 30, cy: 128, r: 56, class: 'hring hi' }, s), c2 = el('circle', { cx: C + 30, cy: 128, r: 56, class: 'hflex sun' }, s);
    txt(s, C - 70, 52, 'barycentric', 'tick', 'middle'); txt(s, C + 70, 52, 'nested spheres', 'tick', 'middle');
    const v = txt(s, C, 236, '', 'hlab big', 'middle'); cap.textContent = 'Directions within 2.2 mas; distances within 1 part in 10⁸';
    anim = t => { const f = Math.min(1, (t % 7) / 2.5), e = 1 - Math.pow(1 - f, 3); c1.setAttribute('cx', C - 30 * (1 - e)); c2.setAttribute('cx', C + 30 * (1 - e)); v.textContent = f < 1 ? '' : 'They coincide'; };
  }
  return { s, anim };
}
B.forEach(b => { const ty = FIXTYPE[b.title]; if (!ty) return; const vis1 = b.vis;
  b.vis = function (v) { vis1.call(this, v); const past = v.querySelector('svg.hsvg'), card = v.querySelector('.hev'); if (!past) return;
    const pair = document.createElement('div'); pair.className = 'hpair'; v.insertBefore(pair, past);
    const pp = document.createElement('div'); pp.className = 'hpast'; pp.innerHTML = '<h5>The model then</h5>'; pp.appendChild(past); pair.appendChild(pp);
    const fp = document.createElement('div'); fp.className = 'hfix'; fp.innerHTML = '<h5>In the nested, flexing spheres</h5>'; const { s, anim } = fixScene(ty); const capT = s.querySelector('text[y="292"]'); fp.appendChild(s); if (capT) { const pc = document.createElement('p'); pc.className = 'hfixcap'; pc.textContent = capT.textContent; capT.remove(); fp.appendChild(pc); } pair.appendChild(fp);
    if (card) v.appendChild(card);
    const a0 = this.anim; this.anim = (t, dt, sc) => { if (a0) a0.call(this, t, dt, sc); anim(t); }; }; });

let story = null;
export function openHistory() {
  if (!story) story = createStory(document.getElementById('history'), B, { vhPerBeat: 150,
    onAction: (act, close) => { close(true); if (act === 'whatif' && window.__openWhatIf) { setTimeout(() => window.__openWhatIf(), 480); return; } window.__ui.enterModel(); if (act === 'tour' && window.__openTour) setTimeout(() => window.__openTour(), 500); },
    onClose: () => window.__ui.enterModel() });
  story.open();
}
window.__openHistory = openHistory;
