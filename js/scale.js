// The true-scale journey: everything drawn at its real, uncompressed distance from Earth,
// seen from above the plane of our galaxy, while the field of view widens by powers of ten.
// Nothing here is logarithmic; that is the point of it.

const PC = 3.0857e16, LY = 9.4607e15, AU = 1.495978707e11, C = 299792458;
const DEG = Math.PI / 180;
// ICRS (J2000 equatorial) to galactic coordinates
const RG = [[-0.0548755604, -0.8734370902, -0.4838350155],
            [ 0.4941094279, -0.4448296300,  0.7469822445],
            [-0.8676661490, -0.1980763734,  0.4559837762]];
function galXY(raDeg, decDeg, dist) {
  const ra = raDeg * DEG, de = decDeg * DEG, x = Math.cos(de) * Math.cos(ra), y = Math.cos(de) * Math.sin(ra), z = Math.sin(de);
  const gx = RG[0][0] * x + RG[0][1] * y + RG[0][2] * z, gy = RG[1][0] * x + RG[1][1] * y + RG[1][2] * z;
  return [gx * dist, -gy * dist];          // screen: galactic centre to the right, rotation sense as seen from the north galactic pole
}
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function fmtLength(m) {
  if (m < 1.5e10) return `${Number((m / 1000).toPrecision(m < 1e9 ? 6 : 3)).toLocaleString()} km`;
  if (m < 3e14) { const a = m / AU; return `${a < 10 ? a.toFixed(2) : Math.round(a).toLocaleString()} AU`; }
  const ly = m / LY;
  if (ly < 1e3) return `${ly < 10 ? ly.toFixed(1) : Math.round(ly)} light-years`;
  if (ly < 1e6) return `${Number(ly.toPrecision(2)).toLocaleString()} light-years`;
  if (ly < 1e9) return `${(ly / 1e6).toFixed(ly < 1e7 ? 1 : 0)} million light-years`;
  return `${(ly / 1e9).toFixed(1)} billion light-years`;
}
export function fmtLightTime(m) {
  const s = m / C;
  if (s < 60) return `${s.toFixed(s < 10 ? 2 : 1)} seconds`;
  if (s < 3600) return `${(s / 60).toFixed(1)} minutes`;
  if (s < 86400 * 2) return `${(s / 3600).toFixed(1)} hours`;
  const y = s / (365.25 * 86400);
  if (y < 1) return `${Math.round(s / 86400)} days`;
  if (y < 1e3) return `${y < 10 ? y.toFixed(1) : Math.round(y)} years`;
  if (y < 1e6) return `${Math.round(y / 1e3).toLocaleString()} thousand years`;
  if (y < 1e9) return `${(y / 1e6).toFixed(y < 1e7 ? 1 : 0)} million years`;
  return `${(y / 1e9).toFixed(1)} billion years`;
}

export function createScaleZoom(canvas, U, A) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R0 = 1;
  const resize = () => {
    DPR = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    const wide = W >= 900 && W / H > 1.05;
    cx = wide ? W * 0.66 : W * 0.5; cy = wide ? H * 0.47 : H * 0.62;
    R0 = wide ? Math.min(W * 0.31, H * 0.42) : Math.min(W * 0.46, H * 0.33);
  };
  addEventListener('resize', () => { if (W) resize(); });

  // ---- the spheres of the planets, at their real distances today (geocentric, true scale)
  const now = A.MakeTime(new Date());
  const RINGS = [['Moon', 'Moon'], ['Mercury', 'Mercury'], ['Venus', 'Venus'], ['Sun', 'Sun'], ['Mars', 'Mars'], ['Jupiter', 'Jupiter'], ['Saturn', 'Saturn']].map(([name, body]) => {
    const v = A.GeoVector(A.Body[body], now, true), d = Math.hypot(v.x, v.y, v.z) * AU, ec = A.Ecliptic(v);
    return { name, r: d, ang: -ec.elon * DEG };
  });
  // ---- stars at their parallax distances
  const S = U.s.filter(s => s[4] > 0 && s[4] < 1e5);
  const sx = new Float64Array(S.length), sy = new Float64Array(S.length), sr = new Float64Array(S.length), sb = new Float32Array(S.length), sc = [];
  S.forEach((s, i) => { const [x, y] = galXY(s[0], s[1], s[4] * PC); sx[i] = x; sy[i] = y; sr[i] = s[4] * PC; sb[i] = Math.min(1, Math.max(.18, (6.6 - s[2]) / 5));
    const bv = s[3]; sc.push(bv < 0 ? '170,195,255' : bv < .5 ? '225,232,255' : bv < 1 ? '255,240,215' : '255,205,160'); });
  const namedStars = [];
  for (const [idx, nm] of U.names) { const s = U.s[idx]; if (!(s && s[4] > 0) || !['Sirius', 'Rigil Kentaurus', 'Vega', 'Betelgeuse', 'Polaris', 'Rigel', 'Deneb', 'Arcturus', 'Canopus'].includes(nm)) continue;
    const [x, y] = galXY(s[0], s[1], s[4] * PC); namedStars.push({ nm: nm === 'Rigil Kentaurus' ? 'α Centauri' : nm, x, y, r: s[4] * PC }); }
  // ---- the Milky Way, representative: a barred spiral seen from above, with the Sun 8.2 kpc from its centre
  const MW = 7000, mx = new Float64Array(MW), my = new Float64Array(MW), mb = new Float32Array(MW), mcol = [];
  { const R = rng(7), gcx = 8.2e3 * PC;
    for (let i = 0; i < MW; i++) {
      let x, y, col, b;
      if (i < 1400) { const rr = Math.abs((R() + R() + R() - 1.5)) * 2.4e3 * PC, th = R() * 2 * Math.PI; x = gcx + rr * Math.cos(th) * 1.0; y = rr * Math.sin(th) * .55;
        const bar = 25 * DEG, X = x - gcx, Y = y; x = gcx + X * Math.cos(bar) - Y * Math.sin(bar); y = X * Math.sin(bar) + Y * Math.cos(bar); col = '255,226,180'; b = .55 + .45 * R(); }
      else { const arm = i % 4, t = Math.pow(R(), .7), rr = (1.6 + 14 * t) * 1e3 * PC, pitch = 12.5 * DEG;
        const th = arm * Math.PI / 2 + Math.log(rr / (1.6e3 * PC)) / Math.tan(pitch) + (R() - .5) * .42 + 2.1;
        x = gcx + rr * Math.cos(th) + (R() - .5) * .45e3 * PC; y = rr * Math.sin(th) + (R() - .5) * .45e3 * PC; col = R() < .6 ? '175,200,255' : '235,225,255'; b = .25 + .55 * R() * (1 - t * .5); }
      mx[i] = x; my[i] = y; mb[i] = b; mcol.push(col); } }
  // ---- galaxies at their redshift distances (catalogue), then representative galaxies beyond it
  const G = U.gal, gx = new Float64Array(G.length), gy = new Float64Array(G.length), gr = new Float64Array(G.length);
  G.forEach((g, i) => { const d = Math.pow(10, g[2]) * PC; const [x, y] = galXY(g[0], g[1], d); gx[i] = x; gy[i] = y; gr[i] = d; });
  const edge = Math.pow(10, U.cos.edge) * PC, cmb = Math.pow(10, U.cos.cmb) * PC;
  const ND = 5200, dx = new Float64Array(ND), dy = new Float64Array(ND), dr = new Float64Array(ND);
  { const R = rng(11); const rin = 2.1e9 * LY;
    for (let i = 0; i < ND; i++) { let r; do { r = edge * Math.cbrt(R()); } while (r < rin);
      const u = R() * 2 - 1, th = R() * 2 * Math.PI, s = Math.sqrt(1 - u * u); dx[i] = r * s * Math.cos(th); dy[i] = r * s * Math.sin(th); dr[i] = r; } }
  const LMK = [['Galactic centre', galXY(266.405, -28.936, 8.2e3 * PC)], ['Andromeda', galXY(10.685, 41.269, 2.5e6 * LY)], ['Large Magellanic Cloud', galXY(80.894, -69.756, 1.6e5 * LY)],
    ['Virgo Cluster', galXY(187.7, 12.4, 16.5e6 * PC)], ...U.lm.slice(0, 3).map(l => [l[0].split(' · ')[0], galXY(l[1], l[2], Math.pow(10, l[3]) * PC)])];

  function label(x, y, text, sub, alpha, align = 'left') {
    if (alpha < .02) return;
    ctx.globalAlpha = alpha; ctx.textAlign = align;
    ctx.fillStyle = '#eef0fb'; ctx.font = '400 12px Sora, system-ui, sans-serif'; ctx.fillText(text, x, y);
    if (sub) { ctx.fillStyle = '#8e93b4'; ctx.font = '300 10.5px Sora, system-ui, sans-serif'; ctx.fillText(sub, x, y + 14); }
    ctx.globalAlpha = 1;
  }
  const fadeIn = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));

  function render(L, vel) {
    if (!W) resize();
    const k = R0 / Math.pow(10, L);                 // pixels per metre
    const maxR = Math.hypot(W, H);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const streak = Math.min(.26, Math.max(0, vel) * .045);   // radial motion blur while the view widens quickly (vel in powers of ten per second)
    const pt = (x, y, size, col, a) => {
      const X = cx + x * k, Y = cy + y * k; if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) return;
      if (streak > .01) { ctx.strokeStyle = `rgba(${col},${a * .55})`; ctx.lineWidth = size; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(cx + x * k * (1 + streak), cy + y * k * (1 + streak)); ctx.stroke(); }
      ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(X - size / 2, Y - size / 2, size, size); };

    // the edge and the microwave background
    const Re = edge * k;
    if (Re < maxR * 3 && Re > 2) {
      const gr = ctx.createRadialGradient(cx, cy, Re * .965, cx, cy, Re * 1.02); gr.addColorStop(0, 'rgba(255,170,120,0)'); gr.addColorStop(.6, 'rgba(255,170,120,.16)'); gr.addColorStop(1, 'rgba(255,170,120,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, Re * 1.03, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(158,196,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, Re, 0, 7); ctx.stroke();
      label(cx + Re * .72, cy - Re * .72, 'Edge of the observable universe', '46 billion light-years · light-time 13.8 billion years', fadeIn(Re, 40, 120) * (1 - fadeIn(Re, W, W * 1.6)));
    }
    // representative galaxies beyond the catalogue
    if (L > 22.4) { const a = fadeIn(L, 22.4, 23.6) * .5; for (let i = 0; i < ND; i++) { const r = dr[i] * k; if (r > maxR) continue; pt(dx[i], dy[i], 1, '190,200,240', a * .8); } }
    // catalogued galaxies
    if (L > 20.4) { const a = fadeIn(L, 20.4, 21.6); for (let i = 0; i < G.length; i++) { const r = gr[i] * k; if (r > maxR || r < 1.5) continue; pt(gx[i], gy[i], r > 400 ? 1.8 : 1.1, '220,215,255', a * .42); } }
    // the Milky Way (representative)
    if (L > 18.6 && L < 24.5) { const a = fadeIn(L, 18.6, 19.8) * (1 - fadeIn(L, 23, 24.5));
      for (let i = 0; i < MW; i++) pt(mx[i], my[i], 1.3, mcol[i], mb[i] * a * .7); }
    // stars
    if (L > 14.6 && L < 21.5) { const a = fadeIn(L, 14.6, 15.6) * (1 - fadeIn(L, 20.2, 21.5));
      for (let i = 0; i < S.length; i++) { const r = sr[i] * k; if (r > maxR) continue; pt(sx[i], sy[i], 1 + sb[i] * 1.6, sc[i], sb[i] * a); } }
    // the spheres of the planets at true scale
    for (const g of RINGS) { const R = g.r * k; if (R < 2.5 || R > maxR * 2) continue;
      const a = fadeIn(R, 2.5, 22) * (1 - fadeIn(R, maxR * .9, maxR * 2));
      ctx.strokeStyle = `rgba(158,196,255,${.42 * a})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      const px = cx + Math.cos(g.ang) * R, py = cy + Math.sin(g.ang) * R;
      ctx.fillStyle = g.name === 'Sun' ? `rgba(255,214,140,${a})` : `rgba(240,242,255,${a})`; ctx.beginPath(); ctx.arc(px, py, g.name === 'Sun' ? 3.4 : 2.2, 0, 7); ctx.fill();
      label(px + 8, py - 6, g.name, `${fmtLength(g.r)} · light ${fmtLightTime(g.r)}`, a * fadeIn(R, 60, 150) * (1 - fadeIn(R, W * .7, W)));
    }
    // Earth, at true size until it shrinks to a point
    { const Rer = Math.max(2.4, 6.371e6 * k); const gr2 = ctx.createRadialGradient(cx - Rer * .3, cy - Rer * .3, 0, cx, cy, Rer);
      gr2.addColorStop(0, '#8fc0ff'); gr2.addColorStop(1, '#1d4f9a'); ctx.fillStyle = gr2; ctx.beginPath(); ctx.arc(cx, cy, Rer, 0, 7); ctx.fill();
      if (Rer < 6) { ctx.fillStyle = 'rgba(111,168,255,.25)'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fill(); }
      label(cx + Math.max(Rer, 6) + 8, cy + 4, L < 12.6 ? 'Earth' : 'Earth, Sun and planets', L < 12.6 ? null : 'all within this one point', 1 - fadeIn(L, 16.4, 17.6)); }
    // named stars and landmarks
    for (const s of namedStars) { const r = s.r * k; label(cx + s.x * k + 6, cy + s.y * k - 4, s.nm, fmtLength(s.r), fadeIn(r, 70, 160) * (1 - fadeIn(r, W * .55, W * .85))); }
    for (const [nm, [x, y]] of LMK) { const r = Math.hypot(x, y) * k; if (r < 1) continue;
      const a = fadeIn(r, 80, 170) * (1 - fadeIn(r, W * .55, W * .9)); if (a < .02) continue;
      ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(158,196,255,.7)'; ctx.beginPath(); ctx.arc(cx + x * k, cy + y * k, 5, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      label(cx + x * k + 9, cy + y * k + 4, nm, fmtLength(Math.hypot(x, y)), a); }
  }
  // a round length for the scale bar (about a fifth of the view)
  function scaleBar(L) {
    const k = R0 / Math.pow(10, L), target = W * .16 / k;
    const units = [[1e3, 'km'], [AU, 'AU'], [LY, 'light-year'], [1e6 * LY, 'million light-years'], [1e9 * LY, 'billion light-years']];
    let [u, nm] = units[0]; for (const e of units) if (target >= e[0] * .9) [u, nm] = e;
    const raw = target / u, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p, nice = (m < 2 ? 1 : m < 5 ? 2 : 5) * p;
    const plural = nice === 1 || !nm.endsWith('year') ? nm : nm + 's';
    return { px: nice * u * k, text: `${nice.toLocaleString()} ${plural}` };
  }
  const span = L => (W || (resize(), W)) * Math.pow(10, L) / R0;   // metres across the whole view
  return { render, scaleBar, resize, span };
}
