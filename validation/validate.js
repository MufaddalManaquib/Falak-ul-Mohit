// Validation for "Nine spheres, one sky" (paper.html, Section 10).
// Run from the repository root:   node validation/validate.js
// 1. External check: event times predicted by the model's ephemeris against published NASA predictions
//    (computed from JPL ephemerides by F. Espenak).
// 2. Dynamics check: the solar system integrated (a) in an inertial barycentric frame, (b) in Earth-centred
//    non-rotating coordinates with the frame force −a⊕, and (c) in Earth-fixed rotating coordinates with
//    −a⊕, Coriolis and centrifugal terms. If the frame terms are right, (b) and (c) reproduce (a) exactly.
//    (a) is also compared with the ephemeris, to show Newtonian gravity reproduces the observed sky.
'use strict';
const A = require('../js/vendor/astronomy.browser.min.js');
const DEG = Math.PI/180, AS = 206264.80624709636, AU_KM = 149597870.7;
const sep = (a,b) => { const c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  return Math.atan2(Math.hypot(...c), a[0]*b[0]+a[1]*b[1]+a[2]*b[2])*AS; };
const fmtT = t => t.toISOString().replace('T',' ').slice(0,19);

// ------------------------------------------------------------------ 1. external comparison
console.log('\n1. Event times: this model (Astronomy Engine) against published NASA predictions\n');
const ev = [];
const tdDate = s => new Date(s+'Z');      // published TD instants are compared with TT
const solar = (start, pubTD, label, src) => { const e=A.SearchGlobalSolarEclipse(A.MakeTime(new Date(start)));
  const tt = new Date(Date.UTC(2000,0,1,12) + e.peak.tt*864e5); ev.push({label, model:tt, pub:tdDate(pubTD), scale:'TD', src}); };
const lunar = (start, pubTD, label, src) => { const e=A.SearchLunarEclipse(A.MakeTime(new Date(start)));
  const tt = new Date(Date.UTC(2000,0,1,12) + e.peak.tt*864e5); ev.push({label, model:tt, pub:tdDate(pubTD), scale:'TD', src}); };
const transit = (body, start, pubUT, pubSep, label, src) => { const tr=A.SearchTransit(body, A.MakeTime(new Date(start)));
  ev.push({label, model:tr.peak.date, pub:new Date(pubUT+'Z'), scale:'UT', src, sepModel:tr.separation*60, sepPub:pubSep}); };
solar('2024-03-01', '2024-04-08T18:18:29.4', 'Total solar eclipse, greatest eclipse', 'EclipseWise SE2024Apr08T');
solar('2027-01-01', '2027-02-06T16:00:48', 'Annular solar eclipse, greatest eclipse', 'NASA GSFC OH2027');
lunar('2027-02-01', '2027-02-20T23:14:06', 'Penumbral lunar eclipse, greatest eclipse', 'NASA GSFC OH2027');
lunar('2027-07-01', '2027-07-18T16:04:09', 'Penumbral lunar eclipse, greatest eclipse', 'NASA GSFC OH2027');
solar('2027-07-01', '2027-08-02T10:07:50', 'Total solar eclipse, greatest eclipse', 'NASA GSFC OH2027');
lunar('2027-08-10', '2027-08-17T07:14:59', 'Penumbral lunar eclipse, greatest eclipse', 'NASA GSFC OH2027');
transit('Venus', '2012-05-01', '2012-06-06T01:29:36', 554, 'Transit of Venus, greatest transit', 'NASA GSFC transit12');
transit('Mercury', '2019-10-01', '2019-11-11T15:19:48', 75.9, 'Transit of Mercury, greatest transit', 'EclipseWise tm2019');
for(const e of ev){ const d=(e.model-e.pub)/1000;
  console.log(`${e.label.padEnd(44)} model ${fmtT(e.model)}  published ${fmtT(e.pub)} ${e.scale}  difference ${d>=0?'+':''}${d.toFixed(1)} s`+
    (e.sepModel ? `   minimum separation ${e.sepModel.toFixed(1)}″ vs ${e.sepPub}″` : '')); }

// ------------------------------------------------------------------ 2. dynamics
// Masses as GM in AU^3/day^2 (Sun) divided by the IAU/JPL mass ratios (Sun/Earth 332946.0487, Earth/Moon 81.30056).
const GMS = 2.959122082855911e-4;
const BODIES = [['Sun',1],['Mercury',1/6023600],['Venus',1/408523.71],['Earth',1/332946.0487],['Moon',1/332946.0487/81.30056],
  ['Mars',1/3098703.59],['Jupiter',1/1047.3486],['Saturn',1/3497.898],['Uranus',1/22902.98],['Neptune',1/19412.24]];
const N = BODIES.length, GM = BODIES.map(b=>GMS*b[1]), iE = 3;
const t0 = A.MakeTime(new Date('2026-01-01T00:00:00Z'));
// initial heliocentric states (EQJ, AU, AU/day) from the ephemeris, shifted to the barycentre of these ten bodies
const S0 = BODIES.map(([k]) => { if(k==='Sun') return [0,0,0,0,0,0]; const s=A.HelioState(k,t0); return [s.x,s.y,s.z,s.vx,s.vy,s.vz]; });
const Mt = GM.reduce((a,b)=>a+b,0), cm=[0,0,0,0,0,0]; S0.forEach((s,i)=>s.forEach((v,j)=>cm[j]+=GM[i]*v/Mt));
const bary0 = S0.map(s=>s.map((v,j)=>v-cm[j]));
// Dormand–Prince 5(4) with adaptive steps
function dopri(f, y, t, tEnd, rtol, hMax){ const c=[0,1/5,3/10,4/5,8/9,1,1],
  a=[[],[1/5],[3/40,9/40],[44/45,-56/15,32/9],[19372/6561,-25360/2187,64448/6561,-212/729],[9017/3168,-355/33,46732/5247,49/176,-5103/18656],[35/384,0,500/1113,125/192,-2187/6784,11/84]],
  b5=[35/384,0,500/1113,125/192,-2187/6784,11/84,0], b4=[5179/57600,0,7571/16695,393/640,-92097/339200,187/2100,1/40];
  let h=Math.min(hMax,1e-3), n=y.length, steps=0;
  while(t<tEnd){ if(t+h>tEnd) h=tEnd-t; const k=[];
    for(let s=0;s<7;s++){ const ys=y.slice(); for(let j=0;j<s;j++){ const aj=a[s][j]; if(aj) for(let i=0;i<n;i++) ys[i]+=h*aj*k[j][i]; } k.push(f(t+c[s]*h, ys)); }
    let err=0; const y5=y.slice();
    for(let i=0;i<n;i++){ let d5=0,d4=0; for(let s=0;s<7;s++){ d5+=b5[s]*k[s][i]; d4+=b4[s]*k[s][i]; } y5[i]+=h*d5; const sc=rtol*(Math.abs(y[i])+Math.abs(y5[i]))+1e-18; err=Math.max(err,Math.abs(h*(d5-d4))/sc); }
    if(err<=1){ t+=h; y=y5; steps++; }
    h=Math.min(hMax, h*Math.min(4,Math.max(.2,.9*Math.pow(err||1e-10,-1/5)))); }
  return {y, steps}; }
const pack = arr => arr.flatMap(s=>s), unpack = y => Array.from({length:N},(_,i)=>y.slice(i*6,i*6+6));
// (a) inertial barycentric frame
function fInertial(t,y){ const d=new Array(y.length).fill(0);
  for(let i=0;i<N;i++){ d[i*6]=y[i*6+3]; d[i*6+1]=y[i*6+4]; d[i*6+2]=y[i*6+5];
    for(let j=0;j<N;j++){ if(i===j) continue; const dx=y[j*6]-y[i*6], dy=y[j*6+1]-y[i*6+1], dz=y[j*6+2]-y[i*6+2], r3=Math.pow(dx*dx+dy*dy+dz*dz,1.5);
      d[i*6+3]+=GM[j]*dx/r3; d[i*6+4]+=GM[j]*dy/r3; d[i*6+5]+=GM[j]*dz/r3; } } return d; }
// (b) Earth-centred, non-rotating: every body feels the same gravity plus the frame force −a⊕ (Earth's own acceleration)
function fGeo(t,y){ const d=fInertial(t,y); const ax=d[iE*6+3], ay=d[iE*6+4], az=d[iE*6+5];
  for(let i=0;i<N;i++){ d[i*6+3]-=ax; d[i*6+4]-=ay; d[i*6+5]-=az; } return d; }
// (c) Earth-fixed and rotating about the pole at the sidereal rate: add Coriolis −2Ω×v and centrifugal −Ω×(Ω×r)
const OMEGA = 2*Math.PI*1.00273781191135448;   // rad/day
const rotZ = (v,th) => [Math.cos(th)*v[0]-Math.sin(th)*v[1], Math.sin(th)*v[0]+Math.cos(th)*v[1], v[2]];
function fRot(t,y){ const d=fGeo(t,y), W=OMEGA;
  for(let i=0;i<N;i++){ const x=y[i*6],yy=y[i*6+1],vx=y[i*6+3],vy=y[i*6+4];
    d[i*6+3]+= 2*W*vy + W*W*x; d[i*6+4]+= -2*W*vx + W*W*yy; } return d; }
const toGeo = st => st.map(s=>s.map((v,j)=>v-st[iE][j]));
const toRot = (st,th) => st.map(s=>{ const r=rotZ(s.slice(0,3),-th), v=rotZ(s.slice(3),-th); return [...r, v[0]+OMEGA*r[1], v[1]-OMEGA*r[0], v[2]]; });
const fromRot = (st,th) => st.map(s=>{ const vr=[s[3]-OMEGA*s[1], s[4]+OMEGA*s[0], s[5]]; return [...rotZ(s.slice(0,3),th), ...rotZ(vr,th)]; });
const RTOL = 1e-13;
function compare(label, days, fA, stA, fB, stB, toCommon){ const a=dopri(fA, pack(stA), 0, days, RTOL, .1), b=dopri(fB, pack(stB), 0, days, RTOL, days>50?.1:.005);
  const ga=toGeo(unpack(a.y)), gb=toCommon(unpack(b.y)); let worst=0, wk='';
  BODIES.forEach(([k],i)=>{ if(i===iE) return; const s=sep(ga[i],gb[i]); if(s>worst){ worst=s; wk=k; } });
  console.log(`${label.padEnd(58)} largest difference ${(worst*1000).toExponential(2)} mas (${wk})`); return worst; }
console.log('\n2. Dynamics: the same physics written in three frames, integrated from 2026-01-01\n');
const geo0 = toGeo(bary0);
compare('Earth-centred (frame force) vs inertial, 1 year', 365.25, fInertial, bary0, fGeo, geo0, st=>st);
compare('Earth-centred (frame force) vs inertial, 10 years', 3652.5, fInertial, bary0, fGeo, geo0, st=>st);
compare('Earth-fixed rotating (frame + Coriolis + centrifugal) vs inertial, 10 days', 10, fInertial, bary0, fRot, toRot(geo0,0), st=>fromRot(st, OMEGA*10));
// the frame terms are not optional: drop them and the Earth-centred description fails
{ // Earth pinned at the origin, every other body feeling only real gravity (no frame force)
  const fNo=(t,y)=>{ const d=fInertial(t,y); for(let j=0;j<6;j++) d[iE*6+j]=0; return d; };
  const a=dopri(fInertial, pack(bary0), 0, 365.25, RTOL, .5), b=dopri(fNo, pack(geo0), 0, 365.25, RTOL, .5);
  const ga=toGeo(unpack(a.y)), gb=unpack(b.y);
  console.log(`${'Earth-centred WITHOUT the frame force vs inertial, 1 year'.padEnd(58)} Sun off by ${(sep(ga[0],gb[0])/3600).toFixed(1)}°`); }
// Newtonian gravity against the ephemeris (geocentric directions of the Sun, Moon and planets)
console.log('\n3. Newtonian integration (ten bodies, no relativity) against the ephemeris, geocentric geometric directions\n');
for(const days of [30, 365.25, 3652.5]){ const r=dopri(fInertial, pack(bary0), 0, days, RTOL, .1), g=toGeo(unpack(r.y)), t=A.MakeTime(t0.ut+days);
  const E=A.HelioVector('Earth',t), line=[];
  BODIES.forEach(([k],i)=>{ if(i===iE) return; let v; if(k==='Moon'){ const m=A.GeoMoon(t); v=[m.x,m.y,m.z]; } else if(k==='Sun') v=[-E.x,-E.y,-E.z]; else { const h=A.HelioVector(k,t); v=[h.x-E.x,h.y-E.y,h.z-E.z]; }
    line.push(`${k} ${sep(g[i],v).toFixed(1)}″`); });
  console.log(`after ${String(days).padStart(6)} days: ${line.join(', ')}`); }
console.log('\nThe ephemeris includes relativity, asteroid perturbations and fitted initial conditions; the ten-body Newtonian model does not, so differences grow slowly with time.\n');
