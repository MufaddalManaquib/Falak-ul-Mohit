// The whole path of a planet, seen out of the plane.
// Earth is still at the centre. The Sun goes round Earth once a year on its circle; the planet sits on an arm
// from the Sun that turns steadily, always the same way. The two turnings add up to the real geocentric path
// (Tycho's arrangement: the same positions as the Sun-centred picture, described from Earth).
// Every point drawn here is computed with Astronomy Engine; the ring-shaped surface is the set of places the
// lantern on the arm can reach. Drag to turn the view.

const A = window.Astronomy;
const INFO = {
  Mercury: { a: .387, i: 7.00, node: 48.33, P: '88 days', syn: 116, span: 1.25, en: 'Mercury' },
  Venus:   { a: .723, i: 3.39, node: 76.68, P: '225 days', syn: 584, span: 4.9, en: 'Venus' },
  Mars:    { a: 1.524, i: 1.85, node: 49.56, P: '687 days', syn: 780, span: 6.5, en: 'Mars' },
  Jupiter: { a: 5.203, i: 1.30, node: 100.46, P: '11.9 years', syn: 399, span: 3.4, en: 'Jupiter' },
  Saturn:  { a: 9.537, i: 2.49, node: 113.67, P: '29.5 years', syn: 378, span: 3.2, en: 'Saturn' },
};
const COL = { Mercury: '#c9bfae', Venus: '#f5e3b8', Mars: '#f08a5d', Jupiter: '#e4cfa8', Saturn: '#e8d39a' };
const DEG = Math.PI / 180;
let root, cv, cx, data, key, raf = 0, yaw = -.6, pitch = .55, hx = 10, play = true, cur = 0, last = 0, dpr = 1, W = 0, H = 0, onDone;

function build() {
  root = document.createElement('div'); root.id = 'torus'; root.className = 'tor'; root.hidden = true;
  root.innerHTML = `<button class="icon x t-x" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <div class="tor-col"><p class="kicker" id="tor-k"></p><h2 class="ttl" id="tor-t"></h2><div class="body" id="tor-b"></div>
    <div class="tor-dials"><div><svg viewBox="-40 -40 80 80" id="d-sun"></svg><span>The Sun's circle<br><b class="ok">always forward</b></span></div>
      <div><svg viewBox="-40 -40 80 80" id="d-arm"></svg><span id="d-arm-l">The arm<br><b class="ok">always forward</b></span></div>
      <div><svg viewBox="-40 -40 80 80" id="d-sky"></svg><span>What Earth sees<br><b id="d-sky-s">forward</b></span></div></div>
    <div class="tor-ctl"><button class="btn" id="tor-play">Pause</button><button class="btn" id="tor-h" aria-pressed="true">Height ×10</button><button class="btn" id="tor-flat">View from above</button><button class="btn" id="tor-side">View edge-on</button></div>
    <p class="note" id="tor-date"></p></div>
  <div class="tor-vis"><canvas aria-label="Three-dimensional path of the planet around a still Earth"></canvas><p class="tor-cap" id="tor-cap"></p></div>`;
  document.body.appendChild(root);
  cv = root.querySelector('canvas'); cx = cv.getContext('2d');
  root.querySelector('.t-x').onclick = close;
  addEventListener('keydown', e => { if (e.key === 'Escape' && !root.hidden) close(); });
  root.querySelector('#tor-play').onclick = e => { play = !play; e.target.textContent = play ? 'Pause' : 'Play'; };
  root.querySelector('#tor-h').onclick = e => { hx = hx === 10 ? 1 : 10; e.target.textContent = hx === 10 ? 'Height ×10' : 'True height'; e.target.setAttribute('aria-pressed', hx === 10); };
  root.querySelector('#tor-flat').onclick = () => { aim = [yaw, 1.45]; };
  root.querySelector('#tor-side').onclick = () => { aim = [yaw, .03]; };
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, yaw, pitch]; aim = null; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; yaw = drag[2] + (e.clientX - drag[0]) * .008; pitch = Math.max(-1.5, Math.min(1.5, drag[3] + (e.clientY - drag[1]) * .008)); });
  cv.addEventListener('pointerup', () => { drag = null; });
  addEventListener('resize', size);
}
let aim = null;
function size() { if (!root || root.hidden) return; const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; }

const fmt = ut => new Date((ut + 10957.5) * 864e5).toISOString().slice(0, 10);
function compute(k, ut0) {
  const I = INFO[k], span = I.span * 365.25, N = 1400, t0 = ut0 - span * .35, pts = [];
  for (let n = 0; n <= N; n++) {
    const ut = t0 + span * n / N, t = A.MakeTime(ut);
    const g = A.Ecliptic(A.GeoVector(k, t, true)), s = A.Ecliptic(A.GeoVector('Sun', t, true));
    pts.push({ ut, x: g.vec.x, y: g.vec.y, z: g.vec.z, lon: g.elon, lat: g.elat, sx: s.vec.x, sy: s.vec.y, sz: s.vec.z, slon: s.elon });
  }
  // unwrap longitudes so forward motion is always increasing
  const unwrap = f => { for (let n = 1; n < pts.length; n++) { let d = pts[n][f] - pts[n - 1][f]; while (d > 180) { pts[n][f] -= 360; d -= 360; } while (d < -180) { pts[n][f] += 360; d += 360; } } };
  for (const p of pts) p.alon = Math.atan2(p.y - p.sy, p.x - p.sx) / DEG;   // direction of the arm, Sun to planet
  unwrap('lon'); unwrap('slon'); unwrap('alon');
  for (let n = 1; n < pts.length; n++) pts[n].back = pts[n].lon < pts[n - 1].lon; pts[0].back = pts[1].back;
  // the backward stretches: middle date, and whether the path loops (latitude turns round) or zigzags (crosses the plane)
  const retro = []; let s0 = -1;
  for (let n = 1; n < pts.length; n++) { if (pts[n].back && s0 < 0) s0 = n; if ((!pts[n].back || n === pts.length - 1) && s0 >= 0) { retro.push([s0, n]); s0 = -1; } }
  const R = retro.filter(([a, b]) => a > 1 && b < pts.length - 1).map(([a, b]) => { const m = (a + b) >> 1, cross = Math.sign(pts[a].lat) !== Math.sign(pts[b].lat);
    return { a, b, m, ut: pts[m].ut, shape: cross ? 'zigzag' : 'loop', days: Math.round(pts[b].ut - pts[a].ut) }; });
  let ext = 0; for (const p of pts) ext = Math.max(ext, Math.hypot(p.x, p.y));
  return { pts, R, ext, I };
}

function proj(x, y, z, sc) {   // ecliptic (x,y in plane, z north) -> screen
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const X = x * cy - y * sy, Y = x * sy + y * cy;            // turn about the pole
  const yy = -z * hx * cp + Y * sp, zz = Y * cp + z * hx * sp; // tilt toward the viewer
  const f = 1 / (1 + zz / (data.ext * 5));
  return [W / 2 + X * sc * f, H * .52 + yy * sc * f, zz];
}

function draw(now) {
  raf = requestAnimationFrame(draw);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (aim) { yaw += (aim[0] - yaw) * Math.min(1, dt * 5); pitch += (aim[1] - pitch) * Math.min(1, dt * 5); if (Math.abs(aim[1] - pitch) < 1e-3) aim = null; }
  const P = data.pts, N = P.length;
  if (play) cur = (cur + dt * N / 26) % N;   // one pass in 26 s
  const i = Math.floor(cur), p = P[i];
  cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
  const sc = Math.min(W, H) * .44 / data.ext;
  const I = data.I, inner = I.a < 1;
  // the ring-shaped surface: a small circle carried round a large one (outer planet: the Sun's yearly circle carried
  // round the planet's arm; inner planet: the planet's arm carried round the Sun's circle). The arm's plane is tilted.
  const Rb = inner ? 1 : I.a, rs = inner ? I.a : 1, nd = I.node * DEG, inc = I.i * DEG;
  const tilt = (x, y, z) => { const xn = x * Math.cos(-nd) - y * Math.sin(-nd), yn = x * Math.sin(-nd) + y * Math.cos(-nd);   // to the node frame
    const y2 = yn * Math.cos(inc) - z * Math.sin(inc), z2 = yn * Math.sin(inc) + z * Math.cos(inc);
    return [xn * Math.cos(nd) - y2 * Math.sin(nd), xn * Math.sin(nd) + y2 * Math.cos(nd), z2]; };
  cx.lineWidth = .7; cx.strokeStyle = 'rgba(158,196,255,.10)';
  for (let k = 0; k < 48; k++) { const th = k / 48 * 2 * Math.PI; cx.beginPath();
    for (let j = 0; j <= 40; j++) { const ph = j / 40 * 2 * Math.PI; let cxp, cyp, czp;
      if (inner) { const [ax, ay, az] = tilt(rs * Math.cos(ph), rs * Math.sin(ph), 0); cxp = Rb * Math.cos(th) + ax; cyp = Rb * Math.sin(th) + ay; czp = az; }
      else { const [bx, by, bz] = tilt(Rb * Math.cos(th), Rb * Math.sin(th), 0); cxp = bx + rs * Math.cos(ph); cyp = by + rs * Math.sin(ph); czp = bz; }
      const q = proj(cxp, cyp, czp, sc); j ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]); }
    cx.stroke(); }
  // the plane of the Sun's circle (ecliptic) as a faint disc edge, and the Sun's own circle
  cx.strokeStyle = 'rgba(255,210,122,.6)'; cx.lineWidth = 1.4; cx.beginPath();
  for (let j = 0; j <= 120; j++) { const ph = j / 120 * 2 * Math.PI, q = proj(Math.cos(ph), Math.sin(ph), 0, sc); j ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1]); } cx.stroke();
  // the path so far (faint for the whole, bright up to now), red where Earth sees it going backward
  const seg = (from, to, alpha) => { let pb = null; cx.beginPath();
    for (let n = from; n <= to; n++) { const q = proj(P[n].x, P[n].y, P[n].z, sc);
      if (pb !== null && P[n].back !== pb) { cx.lineTo(q[0], q[1]); cx.strokeStyle = pb ? `rgba(255,77,109,${alpha})` : (alpha < .5 ? `rgba(236,238,246,${alpha})` : COL[key]); cx.stroke(); cx.beginPath(); cx.moveTo(q[0], q[1]); }
      else if (n === from) cx.moveTo(q[0], q[1]); else cx.lineTo(q[0], q[1]); pb = P[n].back; }
    cx.strokeStyle = pb ? `rgba(255,77,109,${alpha})` : (alpha < .5 ? `rgba(236,238,246,${alpha})` : COL[key]); cx.stroke(); };
  cx.lineWidth = 1; seg(0, N - 1, .16); cx.lineWidth = 1.8; seg(0, i, .95);
  // loop / zigzag labels at the middle of each backward stretch
  cx.font = '11px Sora, system-ui, sans-serif'; cx.textAlign = 'center';
  for (const r of data.R) { if (r.m > i) continue; const q = proj(P[r.m].x, P[r.m].y, P[r.m].z, sc);
    cx.fillStyle = 'rgba(255,170,185,.95)'; cx.fillText(`${r.shape} · ${fmt(r.ut)}`, q[0], q[1] - 12); }
  // Earth (still), the Sun now, the arm and the lantern
  const E = proj(0, 0, 0, sc), S = proj(p.sx, p.sy, p.sz, sc), L = proj(p.x, p.y, p.z, sc);
  cx.strokeStyle = 'rgba(255,210,122,.55)'; cx.setLineDash([3, 4]); cx.beginPath(); cx.moveTo(E[0], E[1]); cx.lineTo(S[0], S[1]); cx.stroke();
  cx.strokeStyle = 'rgba(236,238,246,.30)'; cx.beginPath(); cx.moveTo(E[0], E[1]); cx.lineTo(L[0], L[1]); cx.stroke(); cx.setLineDash([]);
  cx.strokeStyle = COL[key]; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(S[0], S[1]); cx.lineTo(L[0], L[1]); cx.stroke();
  const dot = (q, r, c, glow) => { if (glow) { const g = cx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 4); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(q[0], q[1], r * 4, 0, 7); cx.fill(); } cx.fillStyle = c; cx.beginPath(); cx.arc(q[0], q[1], r, 0, 7); cx.fill(); };
  dot(E, 4.5, '#7fb2ff', true); dot(S, 6, '#ffd27a', true); dot(L, 4.2, P[i].back ? '#ff4d6d' : COL[key], true);
  cx.fillStyle = 'rgba(236,238,246,.85)'; cx.textAlign = 'left';
  cx.fillText('Earth, still', E[0] + 9, E[1] + 4); cx.fillText('Sun', S[0] + 10, S[1] + 4); cx.fillText(I.en, L[0] + 9, L[1] - 6);
  // dials: the Sun's direction and the arm's direction keep turning forward; the sky direction sometimes turns back
  dial('d-sun', p.slon, '#ffd27a', false); dial('d-arm', p.alon, COL[key], false); dial('d-sky', p.lon, p.back ? '#ff4d6d' : '#eceef6', p.back);
  const s = root.querySelector('#d-sky-s'); const txt = p.back ? 'turning back (rujūʿ)' : 'forward (istiqāma)'; if (s.textContent !== txt) { s.textContent = txt; s.className = p.back ? 'bad' : 'ok'; }
  const dEl = root.querySelector('#tor-date'), dt2 = fmt(p.ut); if (dEl._d !== dt2) { dEl._d = dt2; dEl.textContent = `${dt2} · ${I.en} at ecliptic longitude ${(((p.lon % 360) + 360) % 360).toFixed(1)}°, latitude ${P[i].lat >= 0 ? '+' : '−'}${Math.abs(P[i].lat).toFixed(2)}°`; }
}
function dial(id, lonDeg, col, back) {
  const el = root.querySelector('#' + id), a = -lonDeg * DEG;   // ecliptic longitude increases anticlockwise seen from the north
  if (!el._init) { el.innerHTML = `<circle r="33" class="dr"/><path class="dtr"/><line class="dh" x1="0" y1="0" x2="30" y2="0"/><circle r="3" class="dc"/>`; el._init = 1; el._hist = []; }
  const h = el.querySelector('.dh'); h.setAttribute('x2', (30 * Math.cos(a)).toFixed(2)); h.setAttribute('y2', (30 * Math.sin(a)).toFixed(2)); h.style.stroke = col;
  // short trail of the last few degrees, showing which way the hand is going
  el._hist.push(a); if (el._hist.length > 24) el._hist.shift();
  el.querySelector('.dtr').setAttribute('d', 'M' + el._hist.map(b => `${(33 * Math.cos(b)).toFixed(2)} ${(33 * Math.sin(b)).toFixed(2)}`).join(' L')); el.querySelector('.dtr').style.stroke = col;
  el.classList.toggle('back', back);
}

export function openTorus(k, ut, { onClose } = {}) {
  if (!INFO[k]) return;
  if (!root) build();
  key = k; onDone = onClose; data = compute(k, ut);
  const I = data.I, outer = I.a > 1, n = data.R.length, loops = data.R.filter(r => r.shape === 'loop').length;
  root.querySelector('#tor-k').textContent = 'The lantern on the arm';
  root.querySelector('#tor-t').textContent = `${I.en}'s path, seen whole`;
  root.querySelector('#tor-b').innerHTML = `
    <p><b>What ${I.en} does.</b> ${I.en} rides on an arm from the Sun, ${I.a.toFixed(2)} times the Sun's distance, that turns once in ${I.P}, always the same way. The Sun's own circle round the still Earth turns once a year, also always forward. Neither ever reverses: watch the first two dials.</p>
    <p><b>What Earth sees.</b> Earth sits ${outer ? 'inside both circles' : 'outside the arm, at the centre of the Sun\'s circle'}. Once every ${I.syn} days ${outer ? 'the Sun\'s faster circle swings past the arm on the same side as ' + I.en : I.en + '\'s faster arm swings between Earth and the Sun'}, and for a few weeks the two forward turnings add up to a direction that slides backward against the stars. That stretch is <i>rujūʿ</i>, drawn red. The third dial shows it: only the view turns back.</p>
    <p><b>Why a loop one time and a zigzag the next.</b> The arm's plane is tilted ${I.i.toFixed(2)}° to the Sun's circle, so the path is not flat: it lies on the ring-shaped surface drawn faintly, the places the lantern can reach. When the backward stretch comes far from where the two planes cross, ${I.en} is above or below the plane the whole time and draws a <b>loop</b>; when it comes near the crossing, it passes through the plane and draws a <b>zigzag</b>. In this span: ${n} backward stretches, ${loops} loop${loops === 1 ? '' : 's'} and ${n - loops} zigzag${n - loops === 1 ? '' : 's'}.</p>
    <p class="fine">Every point is the measured position (Astronomy Engine, VSOP87). This is Tycho's arrangement; it gives exactly the same sky as the Sun-centred picture, described from a still Earth. Heights are drawn ten times taller unless you switch to true height.</p>`;
  root.querySelector('#d-arm-l').innerHTML = `${I.en}'s arm<br><b class="ok">always forward</b>`;
  root.querySelector('#tor-cap').textContent = `${fmt(data.pts[0].ut)} to ${fmt(data.pts[data.pts.length - 1].ut)} · drag to turn · gold dashes: Earth to Sun · solid: the arm`;
  root.querySelectorAll('.tor-dials svg').forEach(s => { s._init = 0; });
  root.hidden = false; document.body.classList.add('touring'); requestAnimationFrame(() => { root.classList.add('in'); size(); });
  cur = 0; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
}
function close() { root.classList.remove('in'); cancelAnimationFrame(raf); document.body.classList.remove('touring'); setTimeout(() => { root.hidden = true; }, 400); if (onDone) onDone(); }
