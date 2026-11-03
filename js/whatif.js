// "What if?": the model as built changes no physics. This page changes it on purpose, one step at a time,
// works out what the sky would then look like, and sets that against what is observed. Speculative throughout.
import { createStory } from './story.js';

const NS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
const el = (tag, a = {}, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
const svg = (label, w = 620, h = 400) => el('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label, class: 'tsvg wsvg' });
const txt = (s, x, y, t, cls = 'tick', anchor = 'start') => { const e = el('text', { x, y, class: cls, 'text-anchor': anchor }, s); e.textContent = t; return e; };
const path = (pts) => 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
const verdict = (cls, label, text) => `<div class="wv ${cls}"><span>${label}</span><p>${text}</p></div>`;
const change = text => `<div class="wchg"><h4>How the model would change</h4><p>${text}</p></div>`;
// a simple chart frame: returns X, Y mappers and draws axes
function frame(s, { x0 = 70, x1 = 600, y0 = 340, y1 = 30, xr, yr, xlog = false, ylog = false, xt = [], yt = [], xl = '', yl = '' }) {
  const fx = v => xlog ? Math.log10(v) : v, fy = v => ylog ? Math.log10(v) : v;
  const X = v => x0 + (fx(v) - fx(xr[0])) / (fx(xr[1]) - fx(xr[0])) * (x1 - x0), Y = v => y0 - (fy(v) - fy(yr[0])) / (fy(yr[1]) - fy(yr[0])) * (y0 - y1);
  xt.forEach(([v, l]) => { el('line', { x1: X(v), x2: X(v), y1, y2: y0, class: 'grid' }, s); txt(s, X(v), y0 + 18, l, 'tick', 'middle'); });
  yt.forEach(([v, l]) => { el('line', { x1: x0, x2: x1, y1: Y(v), y2: Y(v), class: 'grid' }, s); txt(s, x0 - 8, Y(v) + 4, l, 'tick', 'end'); });
  txt(s, (x0 + x1) / 2, y0 + 40, xl, 'axl', 'middle'); const t = txt(s, 18, (y0 + y1) / 2, yl, 'axl', 'middle'); t.setAttribute('transform', `rotate(-90 18 ${(y0 + y1) / 2})`);
  return { X, Y };
}
const draw = (p, len) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; requestAnimationFrame(() => { p.style.transition = `stroke-dashoffset ${len || 1.6}s cubic-bezier(.3,.7,.2,1)`; p.style.strokeDashoffset = 0; }); };

const B = [];
B.push({ layout: 'title', label: 'Start', html: `<p class="t-eyebrow">Speculation · not part of the model</p><h1 class="t-hero">What if the<br>spheres did more?</h1><p class="t-lede">As built, the model changes nothing in physics: it is the same universe, described from a still Earth. Here we break that rule on purpose, one step at a time, and work out what the sky would then have to look like.</p><p class="t-note">Each step ends with what the observations say.</p>` });

// 1 · baseline
B.push({ kicker: 'The starting point', title: 'The model as built',
  body: 'Nothing in physics is altered. al-Falak al-Muhit is the name given to the daily turn of the sky; it has no mass and drags nothing. The speed of light and the strength of gravity are the measured constants, and the universe has the composition that cosmology infers from observation.',
  extra: verdict('ok', 'Observations', 'Every test reproduced, because the physics is the standard physics. The spheres are a geometry laid over it.'),
  vis(v) { const s = svg('The composition of the universe in the standard cosmological model', 620, 400); v.appendChild(s);
    const cx = 200, cy = 200, R = 140, r = 92, parts = [['Dark energy', .685, '#7ea6ff'], ['Dark matter', .264, '#b49cff'], ['Ordinary matter', .049, '#ffd27a']];
    let a = -Math.PI / 2; parts.forEach(([n, f, c], k) => { const b = a + f * TAU, la = f > .5 ? 1 : 0;
      const d = `M${cx + R * Math.cos(a)} ${cy + R * Math.sin(a)} A${R} ${R} 0 ${la} 1 ${cx + R * Math.cos(b)} ${cy + R * Math.sin(b)} L${cx + r * Math.cos(b)} ${cy + r * Math.sin(b)} A${r} ${r} 0 ${la} 0 ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} Z`;
      el('path', { d, fill: c, opacity: .85, class: 'wseg', style: `--i:${k}` }, s);
      const y = 120 + k * 64; el('rect', { x: 400, y: y - 12, width: 14, height: 14, rx: 3, fill: c }, s); txt(s, 424, y, n, 'wlab'); txt(s, 424, y + 30, `${(f * 100).toFixed(1)} %`, 'wbig'); a = b; });
    txt(s, cx, cy - 4, 'Planck 2018', 'tick', 'middle'); txt(s, cx, cy + 14, 'today', 'tick', 'middle');
    txt(s, 20, 388, 'Only about 5% is matter we have ever detected directly. The rest is inferred from its effects.', 'axl'); } });

// 2 · physical drag
B.push({ kicker: 'What if · 1', title: 'al-Muhit really drags',
  body: 'Give al-Muhit mass and let its turning drag the inertial frames inside it, as a rotating shell does in general relativity. Then the Coriolis force, the turn of Foucault’s pendulum and Earth’s equatorial bulge are no longer effects of Earth spinning: they are the pull of the turning heavens. If the drag is complete, every prediction is unchanged. If it is not, gyroscopes and the stars drift apart. Try it.',
  extra: change('al-Muhit gains a mass of order c²R/G, comparable to everything in the observable universe, and the daily forces become gravitational fields of its rotation. To act on us it must also lie inside the edge of the observable universe, not beyond it.') +
    verdict('mid', 'Observations', 'Gravity Probe B held its gyroscopes against a guide star to milliarcseconds per year, and quasars show no rotation of the sky against local frames. So the drag would have to be complete to about one part in 10¹¹. Allowed, but then indistinguishable from the model as built.'),
  vis(v) { v.innerHTML = `<div class="wdrag"></div><label class="wslider">Drag efficiency <input type="range" min="0.95" max="1" step="0.0005" value="0.985" aria-label="Drag efficiency"><b></b></label><p class="wread"></p>`;
    const s = svg('A gyroscope dragged by the turning sky, compared with the stars', 620, 360); v.querySelector('.wdrag').appendChild(s);
    const cx = 310, cy = 180, sky = el('g', {}, s);
    for (let k = 0; k < 90; k++) { const a = (k * 137.5) % 360 * Math.PI / 180, rr = 60 + ((k * 53) % 110); el('circle', { cx: cx + Math.cos(a) * rr, cy: cy + Math.sin(a) * rr, r: k % 9 ? 1 : 1.8, class: 'wstar' }, sky); }
    el('circle', { cx: cx + 160, cy, r: 4.5, fill: '#ffd27a' }, sky); el('circle', { cx, cy, r: 172, class: 'wring' }, s);
    el('circle', { cx, cy, r: 16, fill: '#2a63b8' }, s);
    const gyro = el('g', {}, s); el('line', { x1: cx, y1: cy, x2: cx + 150, y2: cy, class: 'wgyro' }, gyro); el('circle', { cx: cx + 150, cy, r: 4, fill: '#9ec4ff' }, gyro);
    txt(s, 20, 30, 'Earth still · the sky turns · arrow: a gyroscope aimed at the gold star', 'axl');
    const inp = v.querySelector('input'), out = v.querySelector('b'), read = v.querySelector('.wread'); let eta = +inp.value;
    const upd = () => { eta = +inp.value; out.textContent = `${(eta * 100).toFixed(2)} %`; const drift = (1 - eta) * 360.9856;
      read.textContent = eta >= 1 ? 'Complete drag: the gyroscope stays on its star, exactly as observed.' : `The gyroscope would slip ${drift.toFixed(drift < 1 ? 2 : 1)}° per day against the stars. Observed: less than about 10⁻⁸ ° per day.`; };
    inp.oninput = upd; upd();
    this.anim = t => { const a = t * 18; sky.setAttribute('transform', `rotate(${a % 360} ${cx} ${cy})`); gyro.setAttribute('transform', `rotate(${(a * eta) % 360} ${cx} ${cy})`); };
  } });

// 2a–2c · a whole universe dragged by al-Muhit, Earth still
// Each observation lists the level of new physics at which it first holds:
// 0 literal drag of the spheres only · 1 + the drag carries the inertial frames · 2 + the sky's yearly swing makes a uniform field · 3 + speeds limited locally, al-Muhit a frame
const OBS = [
  ['Rising and setting of Sun, Moon, planets and stars', 0], ['Planet positions and retrograde loops', 0], ['Phases of Venus; planets brighten and dim', 0],
  ['Eclipses and their timing', 0], ['Radar and laser ranges; light-time delays', 0], ['Two tides a day', 0], ['Seasons', 0], ['Stellar parallax', 0],
  ['Foucault’s pendulum turns', 1], ['Coriolis effect: cyclones, trade winds', 1], ['Earth’s equatorial bulge; weaker gravity at the equator', 1],
  ['Geostationary satellites stay put', 1], ['Ring-laser gyroscopes; Sagnac correction in GPS', 1], ['Daily aberration of starlight (0.32″)', 1],
  ['Gyroscopes stay fixed on quasars (Gravity Probe B)', 1], ['Inertia the same in every direction (Hughes–Drever)', 1],
  ['Annual aberration of starlight (20.5″)', 2], ['The Sun’s yearly circuit obeys gravity', 2], ['Spacecraft navigation (Voyager, New Horizons)', 2], ['Yearly Doppler shift of starlight (±30 km/s)', 2],
  ['Nothing outruns light', 3], ['No cause acts from beyond the observable edge', 3]];
const LEVELS = [
  ['Literal drag', 'al-Muhit turns and drags the spheres and everything on them. Earth is still and does not spin. Physics is otherwise ordinary.'],
  ['+ dragged inertial frames', 'New physics: the turning heavens drag inertia itself, completely. The Coriolis and centrifugal forces become fields of al-Muhit’s rotation.'],
  ['+ a yearly field', 'New physics: the sky’s yearly swing creates a uniform field of 5.9 mm/s² everywhere, which carries the Sun round a still Earth.'],
  ['+ al-Muhit as the frame', 'New rule: speeds are limited only locally. al-Muhit is the turning of the frame, sourced by all the matter we can see, not a body beyond the edge.']];
const AUD = 1, ORB = [['Moon', .00257, 27.32, '#d8dbe6', 3], ['Mercury', .387, 87.97, '#c9c4bd', 3], ['Venus', .723, 224.7, '#fff0cc', 4], ['Sun', 1, 365.25, '#ffd27a', 7], ['Mars', 1.524, 686.98, '#ff9d6e', 4], ['Jupiter', 5.203, 4332.6, '#f1e2c4', 6], ['Saturn', 9.537, 10759, '#e9d6b4', 5.5]];
B.push({ kicker: 'What if · 1, built', title: 'A universe dragged by al-Muhit',
  body: 'A working model: Earth still and not spinning, the seven flexible spheres drawn with the nesting rule of the paper, the sphere of stars, and al-Muhit turning once a day and dragging everything inside. Step through the levels: each adds one piece of new physics, and the count shows how many observations the barycentric model explains that this universe still gets right.',
  extra: '<div class="wlev" role="group" aria-label="Level of new physics"></div><p class="wlevtxt"></p>',
  vis(v) { v.innerHTML = '<div class="wuni"></div><div class="wcount"><b>0</b><span>of ' + OBS.length + ' observations hold</span></div><ul class="wfail"></ul>';
    const s = svg('Earth still at the centre; al-Muhit turns and drags seven flexible spheres, the stars and the planets', 600, 590); v.querySelector('.wuni').appendChild(s);
    const cx = 300, cy = 300, R = rho => 34 + (rho + 6.5) * 21.5, delta = .25, k0 = 3, rhoE = Math.log(4.26e-5), beta = [.00257, .39, .72, 1, 1.52, 5.2, 9.5].map(Math.log);
    el('circle', { cx, cy, r: 268, class: 'wmuhitglow' }, s);
    const sky = el('g', {}, s);
    const muhit = el('g', {}, sky); el('circle', { cx, cy, r: 258, class: 'wmuhit' }, muhit);
    for (let k = 0; k < 96; k++) { const a = k / 96 * TAU, r1 = k % 8 ? 252 : 246; el('line', { x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1, x2: cx + Math.cos(a) * 264, y2: cy + Math.sin(a) * 264, class: 'wtick' }, muhit); }
    el('circle', { cx, cy, r: 238, class: 'wring' }, sky);
    for (let k = 0; k < 70; k++) { const a = (k * 137.5) * Math.PI / 180, rr = 228 + (k * 7) % 18; el('circle', { cx: cx + Math.cos(a) * rr, cy: cy + Math.sin(a) * rr, r: k % 7 ? .9 : 1.6, class: 'wstar' }, sky); }
    const goldA = .9; el('circle', { cx: cx + Math.cos(goldA) * 236, cy: cy + Math.sin(goldA) * 236, r: 4, fill: '#ffd27a' }, sky);
    const curves = ORB.map((o, i) => el('path', { class: i === 3 ? 'wsph sun' : 'wsph' }, sky));
    const dots = ORB.map(o => el('circle', { r: o[4], fill: o[3] }, sky));
    const sunWarn = el('circle', { r: 15, class: 'wwarn' }, sky), field = el('line', { class: 'wfield', 'marker-end': 'url(#wArr)' }, sky);
    el('defs', {}, s).innerHTML = '<marker id="wArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffd9a0"/></marker>';
    el('circle', { cx, cy, r: 13, fill: '#2a63b8' }, s); el('circle', { cx: cx - 4, cy: cy - 4, r: 4, fill: 'rgba(255,255,255,.25)' }, s);
    const pend = el('line', { class: 'wpend' }, s), gyro = el('line', { class: 'wgyro2' }, s);
    const lab = txt(s, cx, 584, '', 'wlab', 'middle'), rim = txt(s, 588, 16, '', 'wlab', 'end');
    txt(s, 12, 16, 'Time not to scale; distances on a log scale.', 'axl');
    txt(s, 12, 32, 'white: Foucault pendulum · dashed: gyroscope aimed at the gold star', 'axl');
    let level = 0;
    const lev = v.closest('.tb').querySelector('.wlev'), levTxt = v.closest('.tb').querySelector('.wlevtxt'), cnt = v.querySelector('.wcount b'), fail = v.querySelector('.wfail');
    LEVELS.forEach(([n], k) => { const b = document.createElement('button'); b.textContent = `${k}. ${n}`; b.onclick = () => setLevel(k); lev.appendChild(b); });
    function setLevel(k) { level = k; lev.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', i === k)); levTxt.textContent = LEVELS[k][1];
      const ok = OBS.filter(o => o[1] <= k).length; cnt.textContent = ok; cnt.className = ok === OBS.length ? 'all' : '';
      const bad = OBS.filter(o => o[1] > k); fail.innerHTML = bad.length ? bad.slice(0, 6).map(o => `<li>${o[0]}<i>fixed at level ${o[1]}</i></li>`).join('') + (bad.length > 6 ? `<li class="more">and ${bad.length - 6} more</li>` : '') : '<li class="ok">Every observation on the list holds.</li>';
      rim.textContent = k < 3 ? 'al-Muhit’s rim: 10¹⁴ × light ✕' : 'al-Muhit: a frame, local speeds below light ✓'; rim.setAttribute('class', k < 3 ? 'wlab bad' : 'wlab good'); }
    setLevel(0); this.setLevel = setLevel;
    const geo = (o, tY) => { if (o[0] === 'Moon') { const a = TAU * tY * 365.25 / o[2]; return [o[1] * Math.cos(a), o[1] * Math.sin(a)]; }
      const ae = TAU * tY, E = [Math.cos(ae), Math.sin(ae)]; if (o[0] === 'Sun') return [-E[0], -E[1]];
      const a = TAU * tY * 365.25 / o[2] + o[1]; return [o[1] * Math.cos(a) - E[0], o[1] * Math.sin(a) - E[1]]; };
    this.anim = t => {
      const day = t / 14 * TAU, tY = t / 70;                       // one daily turn per 14 s; one year per 70 s
      sky.setAttribute('transform', `rotate(${(day * 180 / Math.PI) % 360} ${cx} ${cy})`);
      this._f = (this._f || 0) + 1; if (this._f % 2) return;          // the flexing spheres are recomputed every other frame
      const P = ORB.map(o => { const [x, y] = geo(o, tY); return { r: Math.log(Math.hypot(x, y)), th: Math.atan2(y, x) }; });
      const cc = (th, j) => 2 * (1 - Math.cos(th - P[j].th)), N = 7, kk = [];
      for (let j = 0; j < N; j++) { let m = 0; for (let l = 0; l < N; l++) { if (l === j) continue; const a = Math.min(j, l), b = Math.max(j, l), C = P[a].r - P[b].r + (b - a) * delta; if (C > 0) m = Math.max(m, 2.05 * C / Math.max(1e-3, cc(P[l].th, j))); } kk[j] = Math.max(k0, m); }
      for (let i = 0; i < N; i++) { const pts = [];
        for (let q = 0; q <= 140; q++) { const th = q / 140 * TAU; let L = rhoE + (i + 1) * delta, U = 1e9;
          for (let j = 0; j <= i; j++) L = Math.max(L, P[j].r + (i - j) * delta - kk[j] * cc(th, j));
          for (let l = i; l < N; l++) U = Math.min(U, P[l].r - (l - i) * delta + kk[l] * cc(th, l));
          const rr = R(Math.min(U, Math.max(L, beta[i]))); pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
        curves[i].setAttribute('d', path(pts) + 'Z'); }
      P.forEach((p, j) => { const rr = R(p.r); dots[j].setAttribute('cx', cx + Math.cos(p.th) * rr); dots[j].setAttribute('cy', cy + Math.sin(p.th) * rr); });
      const sp = P[3], sx = cx + Math.cos(sp.th) * R(sp.r), sy = cy + Math.sin(sp.th) * R(sp.r);
      sunWarn.setAttribute('cx', sx); sunWarn.setAttribute('cy', sy); sunWarn.style.opacity = level < 2 ? 1 : 0;
      field.setAttribute('x1', sx); field.setAttribute('y1', sy); field.setAttribute('x2', sx + (cx - sx) * .35); field.setAttribute('y2', sy + (cy - sy) * .35); field.style.opacity = level >= 2 ? 1 : 0;
      // on Earth: with frames dragged, the pendulum's plane and the gyroscope turn with the sky; without, they stay fixed to the still Earth
      const fr = level >= 1 ? day : 0, pa = .3 + fr, ga = goldA + fr;
      pend.setAttribute('x1', cx - Math.cos(pa) * 26); pend.setAttribute('y1', cy - Math.sin(pa) * 26); pend.setAttribute('x2', cx + Math.cos(pa) * 26); pend.setAttribute('y2', cy + Math.sin(pa) * 26);
      gyro.setAttribute('x1', cx); gyro.setAttribute('y1', cy); gyro.setAttribute('x2', cx + Math.cos(ga) * 120); gyro.setAttribute('y2', cy + Math.sin(ga) * 120);
      lab.textContent = level >= 1 ? 'Pendulum and gyroscope turn with the sky, as observed' : 'Pendulum and gyroscope stay still while the sky turns: not what is observed';
      lab.setAttribute('class', level >= 1 ? 'wlab good' : 'wlab bad'); };
  } });

const FIX = [
  ['Literal drag', 'Positions, phases, eclipses, distances, tides, seasons, parallax: 8 of 22', 'Everything that depends on rotation or on Earth’s yearly motion against local frames', '—'],
  ['Dragged inertial frames', '+ pendulum, Coriolis, bulge, satellites, gyroscopes, daily aberration: 16 of 22', 'Annual aberration, the Sun’s dynamics, spacecraft, yearly Doppler; superluminal speeds', 'Complete rotational frame dragging (a strong Mach principle). Must be complete to 1 part in 10¹¹ and perfectly uniform (Hughes–Drever).'],
  ['A yearly field', '+ annual aberration, the Sun’s circuit, spacecraft, yearly Doppler: 20 of 22', 'al-Muhit moves 10¹⁴ times faster than light and acts from beyond the observable edge', 'Translational frame dragging: the sky’s yearly swing produces a uniform gravitational field. This is Einstein’s equivalence principle applied to the whole sky.'],
  ['al-Muhit as the frame', '+ no local speed above light; no cause from beyond the edge: 22 of 22', 'Nothing on the list', 'Speeds limited only locally (as in general relativity), and al-Muhit’s pull sourced by all the matter we can see.']];
B.push({ kicker: 'What if · 1, the tally', title: 'What fails, and what it takes',
  body: 'The literal picture keeps everything that is pure geometry and loses everything that is dynamics. Each failure can be repaired, but only by inventing physics: first that the turning heavens carry inertia itself, then that their yearly swing makes a field, then that speed limits apply only locally.',
  vis(v) { v.innerHTML = `<table class="hscore wfix"><thead><tr><th>Level</th><th>Holds</th><th>Still fails</th><th>New physics needed</th></tr></thead><tbody>${FIX.map(([a, b, c, d], i) => `<tr style="--i:${i}"><td><b>${i}.</b> ${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`).join('')}</tbody></table>`; } });

B.push({ kicker: 'What if · 1, the result', title: 'The physics you end up with',
  body: 'Put the three repairs together and something familiar appears. Frame dragging, a uniform field from an accelerating frame, and speed limits that hold only locally are, term for term, general relativity written for a still Earth. The one genuinely new idea left is the strong Machian claim that all inertia comes from al-Muhit. That claim makes two testable demands, and both are already met to extraordinary precision: the drag must be complete, and the encompassing sphere must be perfectly uniform.',
  extra: verdict('mid', 'Verdict', 'Consistent with every observation listed, and indistinguishable from the model as built except through the Machian postulate. Speculative: a synthesis for this page, not an established theory.'),
  vis(v) { const s = svg('The three repairs combine into general relativity in Earth-fixed coordinates plus a Machian postulate', 620, 420); v.appendChild(s);
    const steps = [['Literal drag', '8 / 22', '#ff9d84'], ['+ dragged inertia', '16 / 22', '#ffd9a0'], ['+ yearly field', '20 / 22', '#ffd9a0'], ['+ local speed limit', '22 / 22', '#9fe2b4']];
    steps.forEach(([n, c, col], k) => { const x = 70 + k * 160, g = el('g', { class: 'wstep', style: `--i:${k}` }, s);
      el('circle', { cx: x, cy: 120, r: 46, fill: 'none', stroke: col, 'stroke-width': 1.5 }, g); txt(g, x, 116, c, 'wbig2', 'middle'); txt(g, x, 186, n, 'wlab', 'middle');
      if (k < 3) el('path', { d: `M${x + 52} 120 L${x + 108} 120`, class: 'wlink', 'marker-end': 'url(#wArr2)' }, g); });
    el('defs', {}, s).innerHTML = '<marker id="wArr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8e93b4"/></marker>';
    const g2 = el('g', { class: 'wstep', style: '--i:5' }, s);
    el('rect', { x: 40, y: 236, width: 540, height: 132, rx: 14, class: 'wbox' }, g2);
    txt(g2, 310, 272, '=  general relativity in Earth-fixed coordinates', 'wlab big', 'middle');
    txt(g2, 310, 304, '+  one new postulate: all inertia is induced by al-Muhit', 'wlab big gold', 'middle');
    txt(g2, 310, 340, 'demands: drag complete to 1 part in 10¹¹ (Gravity Probe B) · inertia isotropic (Hughes–Drever)', 'tick', 'middle');
  } });

// 3 · dark matter
const G = 6.674e-11, MSUN = 1.989e30, KPC = 3.0857e19, A0 = 299792458 * (67.66e3 / 3.0857e22) / TAU;
B.push({ kicker: 'What if · 2', title: 'The spheres replace dark matter',
  body: 'Stars at the edges of galaxies orbit too fast for the matter we see. Suppose instead that the nested spheres carry a law of their own: below a minimum acceleration, gravity weakens more slowly. Tie that minimum to the outermost sphere, as the speed of light times the expansion rate divided by 2π, about 1.0 × 10⁻¹⁰ m/s². Strikingly, that is close to the value Milgrom’s modified dynamics (MOND) needs, and it flattens rotation curves with no dark matter at all.',
  extra: change('Galaxies in the eighth sphere would spin faster than their visible matter allows, with no unseen halo. The cosmic budget would lose its 26% of dark matter.') +
    verdict('mid', 'Observations', 'Galaxies: a remarkably good fit. Galaxy clusters: still short of mass by about a factor of two. The Bullet Cluster: lensing mass sits apart from the visible gas. The microwave background’s peaks: need dark matter. So only partly.'),
  vis(v) { const s = svg('Rotation speed against distance for a galaxy: visible matter alone, a sphere law, and the observed flat curve', 620, 400); v.appendChild(s);
    const { X, Y } = frame(s, { xr: [0, 32], yr: [0, 220], xt: [[0, '0'], [10, '10'], [20, '20'], [30, '30']], yt: [[0, '0'], [50, '50'], [100, '100'], [150, '150'], [200, '200']], xl: 'distance from the galaxy’s centre (kpc)', yl: 'orbital speed (km/s)' });
    el('rect', { x: X(8), y: Y(160), width: X(30) - X(8), height: Y(140) - Y(160), class: 'wband' }, s); txt(s, X(30), Y(172), 'observed: flat near 150 km/s (NGC 3198)', 'wlab', 'end');
    const M = 3e10 * MSUN, Rd = 3 * KPC, Mr = r => M * (1 - Math.exp(-r / Rd) * (1 + r / Rd));
    const vN = r => Math.sqrt(G * Mr(r) / r) / 1e3, vM = r => { const gN = G * Mr(r) / (r * r), g = gN / 2 + Math.sqrt(gN * gN / 4 + gN * A0); return Math.sqrt(g * r) / 1e3; };
    const pts = f => { const a = []; for (let k = 1; k <= 160; k++) { const rk = k / 160 * 32; a.push([X(rk), Y(f(rk * KPC))]); } return a; };
    const pN = el('path', { d: path(pts(vN)), class: 'wcurve n' }, s), pM = el('path', { d: path(pts(vM)), class: 'wcurve m' }, s);
    txt(s, X(26), Y(vN(26 * KPC)) + 18, 'visible matter, Newton', 'wlab n'); txt(s, X(31), Y(vM(31 * KPC)) + 22, 'sphere law, a₀ = cH₀/2π', 'wlab m', 'end');
    txt(s, 20, 392, 'Simplified galaxy: 3 × 10¹⁰ solar masses in a disc of scale 3 kpc. Curves computed here.', 'axl');
    this.onEnter = () => { draw(pN); draw(pM, 2.1); };
  } });

// 4 · dark energy
B.push({ kicker: 'What if · 3', title: 'The spheres replace dark energy',
  body: 'Distant supernovae are fainter than a decelerating universe allows, which is why dark energy was proposed. There is a way to fake this that sounds like this model: put Earth near the centre of nested spheres of increasing density, a giant underdense void billions of light-years across. Light from the far side then mimics acceleration, with no dark energy at all.',
  extra: change('The eighth sphere would become a set of nested density shells centred close to Earth, and the cosmic budget would lose its 68.5% of dark energy. Earth would occupy a special place in the universe, not only in the description.') +
    verdict('no', 'Observations', 'A void that large would scatter the microwave background off moving gas, and that kinetic Sunyaev–Zel’dovich signal is not seen (Zhang and Stebbins, 2011). Baryon acoustic oscillations and the CMB also disfavour it. Ruled out at the size needed. Dark energy itself is still not understood, and recent DESI results hint that it may change with time.'),
  vis(v) { const s = svg('Brightness of distant supernovae relative to an empty universe: with dark energy and without', 620, 400); v.appendChild(s);
    const { X, Y } = frame(s, { xr: [0, 1.6], yr: [-.8, .3], xt: [[0, '0'], [.4, '0.4'], [.8, '0.8'], [1.2, '1.2'], [1.6, '1.6']], yt: [[-.8, '−0.8'], [-.4, '−0.4'], [0, '0'], [.2, '+0.2']], xl: 'redshift of the supernova', yl: 'fainter (+) or brighter (−), magnitudes' });
    const c = 299792.458, H0 = 67.66, dl = (z, Om, OL) => { let s = 0; const n = 200; for (let k = 0; k < n; k++) { const x = (k + .5) / n * z; s += 1 / Math.sqrt(Om * (1 + x) ** 3 + OL); } return (1 + z) * c / H0 * s * z / n; };
    const mil = z => c / H0 * z * (1 + z / 2), dmu = (z, Om, OL) => 5 * Math.log10(dl(z, Om, OL) / mil(z));
    const pts = (Om, OL) => { const a = []; for (let k = 1; k <= 120; k++) { const z = k / 120 * 1.6; a.push([X(z), Y(dmu(z, Om, OL))]); } return a; };
    el('line', { x1: X(0), x2: X(1.6), y1: Y(0), y2: Y(0), class: 'ref' }, s); txt(s, X(1.6), Y(0) - 6, 'empty universe', 'tick', 'end');
    const pL = el('path', { d: path(pts(.31, .69)), class: 'wcurve m' }, s), pE = el('path', { d: path(pts(1, 0)), class: 'wcurve n' }, s);
    txt(s, X(.5), Y(dmu(.5, .31, .69)) - 12, 'with dark energy: what supernovae follow', 'wlab m'); txt(s, X(.9), Y(dmu(.9, 1, 0)) + 22, 'matter only, no dark energy', 'wlab n');
    txt(s, 20, 392, 'Curves computed here (flat universes, H₀ = 67.7). Supernova data: Riess 1998, Perlmutter 1999, Pantheon+ 2022.', 'axl');
    this.onEnter = () => { draw(pL); draw(pE, 2); };
  } });

// 5 · speed of light
const OM = TAU / 86164.0905, CL = 299792458, RL = CL / OM;
B.push({ kicker: 'What if · 4', title: 'Light is not constant',
  body: 'The sharpest problem in the Earth-fixed frame is speed: beyond 27.5 AU the turning sky outruns light, and al-Muhit’s rim moves 10¹⁴ times faster than light. Suppose light speeds up with distance just enough to keep pace, c = Ωr beyond 27.5 AU. The problem disappears, but light from everywhere would then reach us almost at once.',
  extra: change('The light cylinder vanishes and the Earth-fixed frame becomes valid everywhere; al-Muhit’s rim speed is allowed. But light from Proxima would take 1.6 days instead of 4.2 years, and from the edge of the universe about 5 days instead of 13.8 billion years: the eighth sphere would show galaxies as they are now, not as they were.') +
    verdict('no', 'Observations', 'The ring around Supernova 1987A lit up over months, and that timing gives the distance to its galaxy in agreement with other methods only for the ordinary speed of light. Images of lensed quasars arrive days to more than a year apart, as standard light speed predicts. The fine-structure constant in light from distant quasars matches today’s to about one part in a million. Ruled out.'),
  vis(v) { const s = svg('Light travel time against distance with constant light speed and with light speed growing with distance', 620, 400); v.appendChild(s);
    const AU = 1.495978707e11, LY = 9.4607e15, DAY = 86400, YR = 3.15576e7;
    const { X, Y } = frame(s, { xr: [1e8, 1e27], yr: [1, 1e18], xlog: true, ylog: true,
      xt: [[3.84e8, 'Moon'], [1.5e11, 'Sun'], [4.0e16, 'Proxima'], [2.5e20, 'Gal. centre'], [2.4e22, 'M31'], [4.4e26, 'edge']],
      yt: [[1, '1 s'], [3600, '1 h'], [DAY * 365, '1 yr'], [YR * 1e6, '1 Myr'], [YR * 1e9, '1 Gyr']], xl: 'distance (logarithmic)', yl: 'time for light to arrive (logarithmic)' });
    const tStd = r => r / CL, tV = r => r <= RL ? r / CL : RL / CL + Math.log(r / RL) / OM;
    const pts = f => { const a = []; for (let k = 0; k <= 200; k++) { const r = 10 ** (8 + k / 200 * 19); a.push([X(r), Y(f(r))]); } return a; };
    el('line', { x1: X(RL), x2: X(RL), y1: 30, y2: 340, class: 'ref' }, s); txt(s, X(RL) + 4, 44, '27.5 AU', 'refl');
    const pS = el('path', { d: path(pts(tStd)), class: 'wcurve m' }, s), pV = el('path', { d: path(pts(tV)), class: 'wcurve n' }, s);
    txt(s, X(3e22), Y(tStd(3e22)) - 10, 'constant c (observed)', 'wlab m', 'end'); txt(s, X(1e25), Y(tV(1e25)) - 10, 'c = Ωr: everything within days', 'wlab n', 'end');
    txt(s, 20, 392, 'Curves computed here. Ω: one turn per sidereal day.', 'axl');
    this.onEnter = () => { draw(pS); draw(pV, 2); };
  } });

// 6 · gravity
B.push({ kicker: 'What if · 5', title: 'Gravity weakens with time',
  body: 'Dirac suggested in 1937 that the strength of gravity falls as the universe ages, G ∝ 1/t. In the spheres, every orbit would slowly widen: the sphere of the Sun would grow by about 10 metres a year, and the young Sun, burning hotter under stronger gravity, would have made early Earth too hot for oceans (Teller, 1948).',
  extra: change('Sphere radii would drift outward year by year, by about one part in 14 billion per year; eclipse and transit times would slide; the Sun’s past brightness would change.') +
    verdict('no', 'Observations', 'Laser ranging to the reflectors left on the Moon finds Ġ/G = (7 ± 8) × 10⁻¹⁴ per year: no change, a thousand times below Dirac’s rate. Radar ranging to Mars and Mercury agrees. Ruled out.'),
  vis(v) { const s = svg('Rate of change of gravity: Dirac’s prediction against the lunar laser ranging limit', 620, 370); v.appendChild(s);
    const { X } = frame(s, { x0: 160, x1: 600, y0: 300, y1: 40, xr: [1e-15, 1e-9], yr: [0, 1], xlog: true, xt: [[1e-15, '10⁻¹⁵'], [1e-13, '10⁻¹³'], [1e-11, '10⁻¹¹'], [1e-9, '10⁻⁹']], xl: 'fractional change in G per year (logarithmic)' });
    const rows = [['Dirac, G ∝ 1/t', 7.2e-11, '#ff9d84'], ['Lunar laser ranging limit', 7.6e-14, '#9fe2b4']];
    rows.forEach(([n, val, c], k) => { const y = 90 + k * 110; txt(s, 150, y + 18, n, 'wlab', 'end'); const r = el('rect', { x: 160, y, width: 0, height: 28, rx: 3, fill: c, opacity: .85 }, s); r.dataset.w = X(val) - 160; txt(s, X(val) + 8, y + 19, val.toExponential(1).replace('e-', ' × 10⁻').replace(/(\d+)$/, m => m.split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')) + ' / yr', 'barv'); });
    txt(s, 20, 356, 'Hofmann and Müller (2018), from decades of lunar laser ranging.', 'axl');
    this.onEnter = () => s.querySelectorAll('rect[data-w]').forEach((r, k) => { r.setAttribute('width', 0); requestAnimationFrame(() => { r.style.transition = `width 1.2s cubic-bezier(.2,.8,.2,1) ${k * .25}s`; r.setAttribute('width', r.dataset.w); }); });
  } });

// 7 · summary
const SUM = [['al-Muhit drags physically', 'The daily forces as gravity of the turning heavens', 'Literal drag: 8 of 22 hold. With three repairs, 22 of 22, but then it is general relativity plus a Machian postulate', 'mid'],
  ['Spheres replace dark matter', 'Flat rotation curves of galaxies', 'Fails for clusters, the Bullet Cluster and the CMB', 'mid'],
  ['Spheres replace dark energy', 'The faintness of distant supernovae', 'A void that large is excluded by the kSZ signal', 'no'],
  ['Light speeds up with distance', 'No superluminal sky; al-Muhit’s rim allowed', 'SN 1987A, lensing delays and quasar spectra exclude it', 'no'],
  ['Gravity weakens with time', 'Large-number coincidences', 'Lunar ranging: no change to 10⁻¹³ per year', 'no']];
B.push({ kicker: 'All together', title: 'What the sky allows',
  body: 'Each change makes the spheres do real physical work, and each real change makes a prediction. The sky has already answered most of them. The model as built survives every test for the opposite reason: it changes nothing, and only describes.',
  vis(v) { v.innerHTML = `<table class="hscore wsum"><thead><tr><th>If the spheres…</th><th>it would explain</th><th>the sky says</th><th></th></tr></thead><tbody>${SUM.map(([a, b, c, k], i) => `<tr style="--i:${i}"><td>${a}</td><td>${b}</td><td>${c}</td><td class="st ${k === 'no' ? 's0' : 's2'}">${k === 'no' ? '✕' : '≈'}</td></tr>`).join('')}<tr style="--i:5" class="base"><td>…change nothing (this model)</td><td>Every observation, as standard physics does</td><td>Reproduced to milliarcseconds</td><td class="st s1">✓</td></tr></tbody></table><p class="hkey">✓ consistent · ≈ allowed only in part, or only if indistinguishable · ✕ ruled out by observation</p>`; } });

B.push({ layout: 'title', label: 'End', html: `<p class="t-eyebrow">Back to the sky</p><h2 class="t-hero sm">Nine spheres, unchanged physics</h2><p class="t-lede">The model you are about to explore keeps every law and every constant, and reads the same universe from a still Earth.</p><div class="t-ctas"><button class="t-cta" data-act="enter">Enter the model</button><button class="t-cta ghost" data-act="history">How the models evolved</button></div>` });

let story = null;
export function openWhatIf() {
  if (!story) story = createStory(document.getElementById('whatif'), B, { vhPerBeat: 150,
    onAction: (act, close) => { close(true); if (act === 'history' && window.__openHistory) setTimeout(() => window.__openHistory(), 480); else window.__ui.enterModel(); },
    onClose: () => window.__ui.enterModel() });
  story.open();
}
window.__openWhatIf = openWhatIf;
