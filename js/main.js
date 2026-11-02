// A Different Lens: an Earth-centred universe that agrees with every telescope.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const A = window.Astronomy;
const getJSON = u => fetch(u).then(r=>{ if(!r.ok) throw new Error(`Could not load ${u} (${r.status})`); return r.json(); });
const [U, MINOR] = await Promise.all([getJSON('data/universe.json'), getJSON('data/minor.json')]);
const SKY = U;
const AU_KM = 149597870.7, C_AU_DAY = 173.1446326846693, LIMB_DEFL = 1.751;
const RE = 0.55, DEG = Math.PI/180;
const LS = 1.45, KMOON = 60; // Sun-centred measured view: scene units per AU; Moon's distance from Earth magnified for visibility

// ---------- the ten intellects (after al-Kirmani, Rahat al-'Aql) and their earthly ranks ----------
const INTELLECTS = [
  {k:1,  ar:'العقل الأول',     tr:'al-ʿAql al-Awwal',      alt:'al-Mubdaʿ al-Awwal · al-Sābiq', hadd:'الناطق', htr:'al-Nāṭiq', sphere:'Beyond the spheres', sar:'', key:null},
  {k:2,  ar:'الانبعاث الأول',  tr:'al-Inbiʿāth al-Awwal',  alt:'al-Tālī',  hadd:'الأساس', htr:'al-Asās (al-Waṣī)', sphere:'al-Falak al-Muhit', sar:'الفلك المحيط', key:'Muhit'},
  {k:3,  ar:'الانبعاث الثاني', tr:'al-Inbiʿāth al-Thānī',  alt:'matter and form (hayūlā wa-ṣūra)', hadd:'الإمام', htr:'al-Imām', sphere:'Fixed stars', sar:'فلك البروج', key:'Stars'},
  {k:4,  ar:'العقل الرابع',    tr:'al-ʿAql al-Rābiʿ',      alt:'', hadd:'الباب',        htr:'al-Bāb', sphere:'Saturn',  sar:'فلك زحل', key:'Saturn'},
  {k:5,  ar:'العقل الخامس',    tr:'al-ʿAql al-Khāmis',     alt:'', hadd:'الحجة',        htr:'al-Ḥujja', sphere:'Jupiter', sar:'فلك المشتري', key:'Jupiter'},
  {k:6,  ar:'العقل السادس',    tr:'al-ʿAql al-Sādis',      alt:'', hadd:'داعي البلاغ',  htr:'Dāʿī al-Balāgh', sphere:'Mars', sar:'فلك المريخ', key:'Mars'},
  {k:7,  ar:'العقل السابع',    tr:'al-ʿAql al-Sābiʿ',      alt:'', hadd:'الداعي المطلق', htr:'al-Dāʿī al-Muṭlaq', sphere:'Sun', sar:'فلك الشمس', key:'Sun'},
  {k:8,  ar:'العقل الثامن',    tr:'al-ʿAql al-Thāmin',     alt:'', hadd:'الداعي المحدود',htr:'al-Dāʿī al-Maḥdūd', sphere:'Venus', sar:'فلك الزهرة', key:'Venus'},
  {k:9,  ar:'العقل التاسع',    tr:'al-ʿAql al-Tāsiʿ',      alt:'', hadd:'المأذون المطلق',htr:'al-Maʾdhūn al-Muṭlaq', sphere:'Mercury', sar:'فلك عطارد', key:'Mercury'},
  {k:10, ar:'العقل العاشر',    tr:'al-ʿAql al-ʿĀshir',     alt:'al-ʿAql al-Faʿʿāl · al-Mudabbir', hadd:'المأذون المحدود',htr:'al-Maʾdhūn al-Maḥdūd (al-Mukāsir)', sphere:'Moon and the world below it', sar:'فلك القمر', key:'Moon'},
];
const HNOTE = {
  Moon:'Governs the Moon’s sphere and the world of generation and corruption beneath it. In the Ṭayyibī ḥaqāʾiq the tenth is Adam al-Rūḥānī, who fell from the third rank to the tenth and became the mudabbir of the physical world.',
  Muhit:'Begins past the particle horizon, 46 billion light-years away: the farthest distance from which any signal could ever have reached us. Nothing beyond it can be observed, so its thickness neither confirms nor breaks any law. Here its outer face is drawn 10^1000 times farther than the observable edge, on the same logarithmic scale. Its daily turn carries every sphere inside it.',
  Stars:'The sphere of the twelve buruj, every star, and every galaxy, out to the edge of the observable universe.',
};
const INT = Object.fromEntries(INTELLECTS.filter(i=>i.key).map(i=>[i.key,i]));
const ORD = ['','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'];

// ---------- the nine spheres ----------
const POLE = { Moon:[270,66.54], Mercury:[281.01,61.41], Venus:[272.76,67.16], Sun:[286.13,63.87], Mars:[317.681,52.887], Jupiter:[268.057,64.495], Saturn:[40.589,83.537] };
const BODIES = [
  {key:'Moon',    en:'Moon',    ar:'القمر',   falak:'فلك القمر',   tr:'Falak al-Qamar',   R:2.4,  size:.2727*RE, col:[.86,.85,.8],  km:1737.4, span:27.3,  n:1, type:0},
  {key:'Mercury', en:'Mercury', ar:'عطارد',  falak:'فلك عطارد',  tr:'Falak ʿUṭārid',    R:4.0,  size:.11, col:[.72,.67,.6],  km:2439.7, span:116,   n:2, type:1},
  {key:'Venus',   en:'Venus',   ar:'الزهرة', falak:'فلك الزهرة', tr:'Falak al-Zuhara',  R:5.6,  size:.16, col:[.97,.91,.74], km:6051.8, span:292,   n:3, type:2},
  {key:'Sun',     en:'Sun',     ar:'الشمس',  falak:'فلك الشمس',  tr:'Falak al-Shams',   R:7.4,  size:.42, col:[1,.86,.5],    km:695700, span:365.25,n:4, type:3},
  {key:'Mars',    en:'Mars',    ar:'المريخ', falak:'فلك المريخ', tr:'Falak al-Mirrīkh', R:9.2,  size:.14, col:[.9,.46,.3],   km:3389.5, span:400,   n:5, type:4},
  {key:'Jupiter', en:'Jupiter', ar:'المشتري',falak:'فلك المشتري',tr:'Falak al-Mushtarī',R:11.0, size:.32, col:[.88,.78,.64], km:69911,  span:400,   n:6, type:5},
  {key:'Saturn',  en:'Saturn',  ar:'زحل',    falak:'فلك زحل',    tr:'Falak Zuḥal',      R:12.8, size:.27, col:[.9,.82,.58],  km:58232,  span:380,   n:7, type:6},
];
const BMAP = Object.fromEntries(BODIES.map(b=>[b.key,b]));
const R_SUN = BMAP.Sun.R;
const TEX = {day:'textures/earth_day.jpg', night:'textures/earth_night.jpg', clouds:'textures/earth_clouds.jpg', spec:'textures/earth_specular.jpg', moon:'textures/moon.jpg'};
const OUTER = [ {key:'Uranus',R:14.3,col:[.6,.8,.85]}, {key:'Neptune',R:14.9,col:[.5,.6,.95]} ];
const ELEMENTS = [ {ar:'الماء',tr:'Water',R:.95,c:0x3f6fb0}, {ar:'الهواء',tr:'Air',R:1.4,c:0x9fb7c9}, {ar:'النار',tr:'Fire',R:1.9,c:0xd9763c} ];

// ---------- measured-distance radial scale (monotone, log) ----------
const GB = 0.035, GA = (12.8 - RE)/Math.log(1 + 9.6/GB);
const g = r => RE + GA*Math.log(1 + r/GB);
const PC_AU = 206264.806, LY_AU = 63241.077, LY_PER_PC = 3.26156;
const R8_IN = 13.8;                                   // inner face of the eighth sphere
const rPc = pc => pc>0 ? g(pc*PC_AU) : R8_IN;          // measured distance (parsecs) -> radius on the log map
const R_CMB = rPc(Math.pow(10,U.cos.cmb)), R_EDGE = rPc(Math.pow(10,U.cos.edge));
const R_MI = R_EDGE + 0.8;                             // al-Muhit begins just past the particle horizon
const MUHIT_POW = 1000;                               // al-Muhit's outer face is drawn 10^1000 times farther than the observable edge, on the same log scale
const R_MO = R_EDGE + MUHIT_POW*Math.LN10*GA;
const VIEW_MUHIT = R_MO*2.35;
const R_STARS = R8_IN, R_MUHIT = R_MI;
// Planck 2018 flat LCDM: comoving distance and lookback time as functions of redshift
const COS = (()=>{ const H0=67.66, Om=.3097, Or=9.1e-5, OL=1-Om-Or, C=299792.458, tH=977.8/H0; const zs=[], dc=[], lb=[];
  let D=0, T=0, zp=0; const N=900;
  for(let i=0;i<=N;i++){ const z = i===0?0:Math.pow(10,-4+i*(11/N)); const zm=(z+zp)/2, E=Math.sqrt(Om*(1+zm)**3+Or*(1+zm)**4+OL);
    D += C/H0*(z-zp)/E; T += tH*(z-zp)/((1+zm)*E); zs.push(z); dc.push(D); lb.push(T); zp=z; }
  const interp=(xs,ys,x)=>{ let lo=0,hi=xs.length-1; if(x<=xs[0]) return ys[0]; if(x>=xs[hi]) return ys[hi]; while(hi-lo>1){ const m=(lo+hi)>>1; if(xs[m]>x) hi=m; else lo=m; } const f=(x-xs[lo])/(xs[hi]-xs[lo]); return ys[lo]+f*(ys[hi]-ys[lo]); };
  return { zOfD: Mpc=>interp(dc,zs,Mpc), lbOfZ: z=>interp(zs,lb,z), dOfZ: z=>interp(zs,dc,z) }; })();
const fmtLy = ly => ly<1 ? `${(ly*365.25).toFixed(1)} light-days` : ly<1e3 ? `${ly<10?ly.toFixed(1):Math.round(ly).toLocaleString()} light-years` : ly<1e6 ? `${(ly/1e3).toFixed(ly<1e4?1:0)} thousand light-years` : ly<1e9 ? `${(ly/1e6).toFixed(ly<1e7?1:0)} million light-years` : `${(ly/1e9).toFixed(1)} billion light-years`;
const toS = v => [v.x, v.z, -v.y];           // EQJ -> scene (Y = celestial pole)
const radec = (ra,dec)=>{ const a=ra*DEG, d=dec*DEG; return [Math.cos(d)*Math.cos(a), Math.cos(d)*Math.sin(a), Math.sin(d)]; };
const radecS = (ra,dec)=>{ const v=radec(ra,dec); return [v[0],v[2],-v[1]]; };

// ---------- state ----------
const state = { ut: A.MakeTime(new Date()).ut, rate: 0.0416667, dir: 1, playing: true,
  u: 1, uTarget: 1, c: 0, cTarget: 0, earthFixed: true, skyView: false, sel: 'Venus', mech: 'coord',
  ka: 0, kp: 0, focus: null, zoomGoal: null, time: 0 };

// ---------- the warp: measured space -> nested-sphere space ----------
let anchors = [];
let sunNow = [1,0,0], qsNow = [R_SUN,0,0];
// Display position of an arbitrary point x (AU, scene J2000) for the current blend of
// geometry (u: measured -> spheres) and centre (c: Earth -> Sun). The Sun-centred view is the
// same map with its origin moved to the Sun; nothing else changes.
function dispPoint(x,y,z,out){
  const r = Math.hypot(x,y,z), s = r>1e-12 ? g(r)/r : 0;
  const gx=x*s, gy=y*s, gz=z*s;
  let dx=0,dy=0,dz=0;
  if(state.u>0){
    let sw=1;
    for(const a of anchors){ const ex=x-a.p[0], ey=y-a.p[1], ez=z-a.p[2];
      const d2=(ex*ex+ey*ey+ez*ez)/a.s2+1e-14, w=1/(d2*d2); sw+=w; dx+=w*a.d[0]; dy+=w*a.d[1]; dz+=w*a.d[2]; }
    dx/=sw; dy/=sw; dz/=sw;
  }
  const u=state.u, c=state.c;
  let ox=gx+u*dx, oy=gy+u*dy, oz=gz+u*dz;
  if(c>0){
    const hx=(1-u)*LS*(x-sunNow[0]) + u*(gx+dx-qsNow[0]);
    const hy=(1-u)*LS*(y-sunNow[1]) + u*(gy+dy-qsNow[1]);
    const hz=(1-u)*LS*(z-sunNow[2]) + u*(gz+dz-qsNow[2]);
    ox=(1-c)*ox+c*hx; oy=(1-c)*oy+c*hy; oz=(1-c)*oz+c*hz;
  }
  out[0]=ox; out[1]=oy; out[2]=oz; return out;
}
// Exact display position of a body from its geocentric vector p and the Sun's s at the same instant.
function dispBody(b, p, s, out){
  const u=state.u, c=state.c, d=Math.hypot(p[0],p[1],p[2]);
  const rE=(1-u)*g(d)+u*b.R; let ex=p[0]/d*rE, ey=p[1]/d*rE, ez=p[2]/d*rE;
  if(c>0){
    const sd=Math.hypot(s[0],s[1],s[2]), q=[s[0]/sd*R_SUN, s[1]/sd*R_SUN, s[2]/sd*R_SUN];
    const mk = b.key==='Moon' ? (KMOON-1)*LS : 0;
    const hx=(1-u)*(LS*(p[0]-s[0])+mk*p[0]) + u*(p[0]/d*b.R - q[0]);
    const hy=(1-u)*(LS*(p[1]-s[1])+mk*p[1]) + u*(p[1]/d*b.R - q[1]);
    const hz=(1-u)*(LS*(p[2]-s[2])+mk*p[2]) + u*(p[2]/d*b.R - q[2]);
    ex=(1-c)*ex+c*hx; ey=(1-c)*ey+c*hy; ez=(1-c)*ez+c*hz;
  }
  out[0]=ex; out[1]=ey; out[2]=ez; return out;
}
function dispEarth(s, out){
  const u=state.u, c=state.c, sd=Math.hypot(s[0],s[1],s[2]);
  for(let i=0;i<3;i++) out[i] = c*((1-u)*(-LS*s[i]) + u*(-s[i]/sd*R_SUN));
  return out;
}

// ---------- renderer ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, preserveDrawingBuffer:true});
const DPR_MAX=Math.min(devicePixelRatio, 1.5); let dpr=Math.min(1.25, DPR_MAX);   // start modestly; raised when the device keeps up
renderer.setPixelRatio(dpr);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03040b);
const camera = new THREE.PerspectiveCamera(50, 1, 0.02, 90000);
renderer.localClippingEnabled = true;
const clipPlane = new THREE.Plane(new THREE.Vector3(0,0,1), 1e9);
const HOME = new THREE.Vector3(6, 22, 24);
camera.position.copy(HOME);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = .08;
controls.minDistance = 0.06; controls.maxDistance = R_MO*4.5; controls.zoomSpeed = 1.3;
controls.enablePan = true; controls.screenSpacePanning = true;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256,256), .55, .45, .9);
{ const set=bloom.setSize.bind(bloom); bloom.setSize=(w,h)=>set(Math.max(1,w/3),Math.max(1,h/3)); }
composer.addPass(bloom);
composer.addPass(new OutputPass());

const sky = new THREE.Group();   // turns daily in the Earth-fixed frame
const prec = new THREE.Group();  // J2000 -> equator of date
prec.matrixAutoUpdate = false;
scene.add(sky); sky.add(prec);

// ---------- shared GLSL ----------
const NOISE = `
float hash(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }
`;
const qFromPole = (ra,dec)=>{ const v=radecS(ra,dec); return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), new THREE.Vector3(...v)); };

// ---------- Earth ----------
const texLoader=new THREE.TextureLoader();
const loadTex=(uri,srgb)=>{ const t=texLoader.load(uri); if(srgb) t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; };
const earthMat = new THREE.ShaderMaterial({
  uniforms:{ tDay:{value:loadTex(TEX.day,true)}, tNight:{value:loadTex(TEX.night)}, tCl:{value:loadTex(TEX.clouds)}, tSpec:{value:loadTex(TEX.spec)},
    uL:{value:new THREE.Vector3(1,0,0)}, uLv:{value:new THREE.Vector3(1,0,0)}, uT:{value:0} },
  vertexShader:`varying vec3 vP; varying vec3 vVN; varying vec3 vV; varying vec2 vUv; void main(){ vUv=uv; vP=normalize(position); vVN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader:`uniform sampler2D tDay, tNight, tCl, tSpec; uniform vec3 uL, uLv; uniform float uT; varying vec3 vP; varying vec3 vVN; varying vec3 vV; varying vec2 vUv;
    void main(){
      vec3 n=normalize(vP); float lat=asin(clamp(n.y,-1.,1.)); float lon=atan(-n.z,n.x);
      vec2 uv=vUv;
      vec3 day=texture2D(tDay,uv).rgb; float nl=texture2D(tNight,uv).r; float sp=texture2D(tSpec,uv).r;
      float cl=texture2D(tCl,uv+vec2(uT*.0005,0.)).r;
      float l=dot(n,normalize(uL)); float df=smoothstep(-.2,.25,l);
      vec3 lit=day*(.035+1.2*max(l,0.));
      vec3 night=vec3(1.,.74,.42)*pow(nl,1.8)*1.6*(1.-cl) + day*.015;
      vec3 col=mix(night, lit, df);
      vec3 h=normalize(normalize(uLv)+normalize(vV)); col+=vec3(1.,.93,.8)*pow(max(dot(normalize(vVN),h),0.),120.)*sp*smoothstep(0.,.3,l)*.32;
      col=mix(col, vec3(1.)*(.03+1.1*max(l,0.)), cl*.92*smoothstep(-.3,.15,l));
      float rim=pow(1.-max(dot(normalize(vVN),normalize(vV)),0.),3.2); col+=rim*vec3(.32,.58,1.)*(.12+.9*df);
      gl_FragColor=vec4(col,1.);
    }`
});
const earth = new THREE.Mesh(new THREE.SphereGeometry(RE, 96, 48), earthMat);
scene.add(earth);
{ const lat=25.2*DEG, lon=55.3*DEG; // Dubai, in the Earth-fixed frame (Greenwich = +x)
  const m = new THREE.Mesh(new THREE.SphereGeometry(.025,12,8), new THREE.MeshBasicMaterial({color:0xffd27a}));
  m.position.set(Math.cos(lat)*Math.cos(lon), Math.sin(lat), -Math.cos(lat)*Math.sin(lon)).multiplyScalar(RE*1.005); earth.add(m); }
const earthAtmo = new THREE.Mesh(new THREE.SphereGeometry(RE*1.06, 64, 32), new THREE.ShaderMaterial({
  vertexShader:`varying vec3 vVN; varying vec3 vV; void main(){ vVN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader:`varying vec3 vVN; varying vec3 vV; void main(){ float f=pow(1.-abs(dot(vVN,vV)),4.); gl_FragColor=vec4(vec3(.35,.6,1.)*f*.45,f*.4); }`,
  transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.BackSide }));
earth.add(earthAtmo);

// ---------- crystalline shells ----------
function shellMat(color, strength=1){
  return new THREE.ShaderMaterial({
    uniforms:{uC:{value:new THREE.Color(color)}, uA:{value:strength}, uHi:{value:0}},
    vertexShader:`varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP=normalize(position); vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 uC; uniform float uA, uHi; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        float f=pow(1.-abs(dot(vN,vV)),3.);
        float lat=asin(clamp(vP.y,-1.,1.)), lon=atan(vP.z,vP.x);
        float gr = smoothstep(.9985,1.,cos(lat*12.)) + smoothstep(.9985,1.,cos(lon*12.))*(1.-smoothstep(1.3,1.55,abs(lat)));
        float eq = smoothstep(.99985,1.,cos(lat));
        vec3 iri = uC*(1.+.25*vec3(sin(f*6.),sin(f*6.+2.),sin(f*6.+4.)));
        float a = (0.004 + 0.17*f + gr*.022 + eq*.08)*(1.+uHi*1.8);
        gl_FragColor=vec4(iri, a*uA);
      }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
  });
}
const ECL_Q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), new THREE.Vector3(0,Math.cos(23.4393*DEG),Math.sin(23.4393*DEG)));
const planetShells = [];
for(const b of BODIES){
  const m = new THREE.Mesh(new THREE.SphereGeometry(b.R, 128, 64), shellMat(0xc6d4ff, .42));
  m.quaternion.copy(ECL_Q); m.userData.base=.42; m.userData.key=b.key; prec.add(m); planetShells.push(m); b.shell=m;
}
// Flexing spheres: each sphere is a closed surface around Earth, built in TRUE space as
//   rho_i(n) = clamp( base_i , Lower_i(n), Upper_i(n) ),   rho = ln(distance in AU), n = direction from Earth
//   Lower_i(n) = max_{j<=i} [ rho_j + (i-j)·delta - k_j·|n-n_j|^2 ]      (inner bodies push the sphere outward)
//   Upper_i(n) = min_{l>=i} [ rho_l - (l-i)·delta + k_l·|n-n_l|^2 ]      (outer bodies pull it inward)
// With k_j chosen per conflicting pair (k >= 2·(rho_j - rho_l + (l-j)·delta)/|n_j-n_l|^2), Lower <= Upper everywhere, so:
//   * sphere i passes exactly through body i (rho_i(n_i) = rho_i),
//   * sphere i+1 lies outside sphere i in every direction (nested, never touching),
//   * nothing about space, light or orbits is changed: the spheres are level surfaces of a rank function.
const FLEX_D=.06, FLEX_K0=5, RHO_E=Math.log(6371/AU_KM);
const FLEX_BASE=[.00257,.39,.72,1.0,1.52,5.2,9.5].map(Math.log);
const flexMatOf=()=>{ const m=shellMat(0xc6d4ff,1); m.side=THREE.DoubleSide;
  m.vertexShader=m.vertexShader.replace('varying vec3 vP; void main(){ vP=normalize(position);','attribute vec3 aDir; varying vec3 vP; void main(){ vP=aDir;'); return m; };
const flexGeo0=new THREE.SphereGeometry(1,120,60), NFV=flexGeo0.attributes.position.count, FD=flexGeo0.attributes.position.array.slice();
const CAP_R=18, CAP_S=48;
const capGeo0=(()=>{ const pos=[], idx=[]; for(let r=0;r<=CAP_R;r++) for(let a=0;a<=CAP_S;a++) pos.push(0,0,0);
  for(let r=0;r<CAP_R;r++) for(let a=0;a<CAP_S;a++){ const p=r*(CAP_S+1)+a, q=p+CAP_S+1; idx.push(p,q,p+1, p+1,q,q+1); }
  const gg=new THREE.BufferGeometry(); gg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); gg.setAttribute('aDir',new THREE.Float32BufferAttribute(pos.slice(),3)); gg.setIndex(idx); return gg; })();
const flexShells=BODIES.map(b=>{ const geo=flexGeo0.clone(); geo.setAttribute('aDir',new THREE.BufferAttribute(FD.slice(),3));
  const m=new THREE.Mesh(geo, flexMatOf()); m.frustumCulled=false; m.visible=false; m.userData.key=b.key; prec.add(m);
  const cap=new THREE.Mesh(capGeo0.clone(), m.material); cap.frustumCulled=false; cap.visible=false; prec.add(cap); m.userData.cap=cap; return m; });
const fK=new Float64Array(7), fRho=new Float64Array(7), fU=new Float64Array(21), fC2=new Float64Array(7);
function flexRho(i){ let lo=RHO_E+(i+1)*FLEX_D; for(let j=0;j<=i;j++){ const t=fRho[j]+(i-j)*FLEX_D-fK[j]*fC2[j]; if(t>lo) lo=t; }
  let up=1e9; for(let l=i;l<7;l++){ const t=fRho[l]-(l-i)*FLEX_D+fK[l]*fC2[l]; if(t<up) up=t; }
  return Math.min(up, Math.max(lo, FLEX_BASE[i])); }
function flexC2(nx,ny,nz){ for(let b=0;b<7;b++) fC2[b]=Math.max(0,2*(1-(nx*fU[b*3]+ny*fU[b*3+1]+nz*fU[b*3+2]))); }
function flexDisp(i,nx,ny,nz,r,arr,k){ const c=state.c, ge=g(r); let x=nx*ge, y=ny*ge, z=nz*ge;
  if(c>0){ const mk = i===0 ? (KMOON-1)*LS : 0; x=(1-c)*x+c*(LS*(nx*r-sunNow[0])+mk*nx*r); y=(1-c)*y+c*(LS*(ny*r-sunNow[1])+mk*ny*r); z=(1-c)*z+c*(LS*(nz*r-sunNow[2])+mk*nz*r); }
  arr[k]=x; arr[k+1]=y; arr[k+2]=z; }
function updateFlex(){
  for(let i=0;i<7;i++){ const P=pos[BODIES[i].key]; fRho[i]=Math.log(P.d); fU[i*3]=P.u[0]; fU[i*3+1]=P.u[1]; fU[i*3+2]=P.u[2]; fK[i]=FLEX_K0; }
  for(let j=0;j<7;j++) for(let l=j+1;l<7;l++){ const C=fRho[j]-fRho[l]+(l-j)*FLEX_D; if(C<=0) continue;
    const dx=fU[j*3]-fU[l*3], dy=fU[j*3+1]-fU[l*3+1], dz=fU[j*3+2]-fU[l*3+2]; const need=2.05*C/Math.max(dx*dx+dy*dy+dz*dz,4e-6);
    if(need>fK[j]) fK[j]=need; if(need>fK[l]) fK[l]=need; }
  const arrs=flexShells.map(m=>m.geometry.attributes.position.array);
  for(let v=0;v<NFV;v++){ const nx=FD[v*3], ny=FD[v*3+1], nz=FD[v*3+2]; flexC2(nx,ny,nz);
    for(let i=0;i<7;i++) flexDisp(i,nx,ny,nz,Math.exp(flexRho(i)),arrs[i],v*3); }
  // fine caps around each body so a narrow flex is resolved where the body sits
  for(let i=0;i<7;i++){ const cap=flexShells[i].userData.cap, pa=cap.geometry.attributes.position.array, da=cap.geometry.attributes.aDir.array;
    const ux=fU[i*3], uy=fU[i*3+1], uz=fU[i*3+2]; let ax=Math.abs(ux)<.9?1:0, ay=ax?0:1; // basis
    let e1x=ay*uz-0*uy, e1y=0*ux-ax*uz, e1z=ax*uy-ay*ux; const l1=Math.hypot(e1x,e1y,e1z); e1x/=l1; e1y/=l1; e1z/=l1;
    const e2x=uy*e1z-uz*e1y, e2y=uz*e1x-ux*e1z, e2z=ux*e1y-uy*e1x;
    const Amax=Math.min(.35, Math.max(.01, 3.2/Math.sqrt(fK[i]))); let k=0;
    for(let r=0;r<=CAP_R;r++){ const al=Amax*Math.pow(r/CAP_R,1.5), ca=Math.cos(al), sa=Math.sin(al);
      for(let a=0;a<=CAP_S;a++){ const ph=a/CAP_S*2*Math.PI, cp=Math.cos(ph)*sa, sp=Math.sin(ph)*sa;
        const nx=ca*ux+cp*e1x+sp*e2x, ny=ca*uy+cp*e1y+sp*e2y, nz=ca*uz+cp*e1z+sp*e2z; flexC2(nx,ny,nz);
        da[k]=nx; da[k+1]=ny; da[k+2]=nz; flexDisp(i,nx,ny,nz,Math.exp(flexRho(i)),pa,k); k+=3; } }
    cap.geometry.attributes.position.needsUpdate=true; cap.geometry.attributes.aDir.needsUpdate=true; cap.geometry.computeVertexNormals(); }
  flexShells.forEach(m=>{ m.geometry.attributes.position.needsUpdate=true; m.geometry.computeVertexNormals(); });
}
window.__flexCheck=()=>{ // verifies: each sphere passes through its body; spheres never cross
  let worstMiss=0, crossings=0;
  for(let i=0;i<7;i++){ flexC2(fU[i*3],fU[i*3+1],fU[i*3+2]); worstMiss=Math.max(worstMiss, Math.abs(flexRho(i)-fRho[i])); }
  for(let v=0;v<NFV;v++){ flexC2(FD[v*3],FD[v*3+1],FD[v*3+2]); let prev=-1e9; for(let i=0;i<7;i++){ const r=flexRho(i); if(r<=prev+1e-9) crossings++; prev=r; } }
  return {worstMiss, crossings, k:[...fK].map(x=>+x.toFixed(1))}; };
const starShell = new THREE.Mesh(new THREE.SphereGeometry(R_STARS, 128, 64), shellMat(0x8aa0ff, .5));
starShell.quaternion.copy(ECL_Q); starShell.userData.base=.5; prec.add(starShell);
const elemShells = ELEMENTS.map(e=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(e.R,64,32), shellMat(e.c,.8)); m.userData.base=.8; m.visible=false; prec.add(m); return m; });

function ringLine(R, color, opacity){
  const pts=[]; const eps=23.4393*DEG;
  for(let i=0;i<=256;i++){ const L=i/256*2*Math.PI; const x=Math.cos(L), y=Math.sin(L)*Math.cos(eps), z=Math.sin(L)*Math.sin(eps); pts.push(new THREE.Vector3(x*R, z*R, -y*R)); }
  const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color, transparent:true, opacity, depthWrite:false}));
  l.userData.base=opacity; return l;
}

// ---------- al-Falak al-Muhit: begins past the particle horizon; enormously thick ----------
const CLIPV = `#include <clipping_planes_pars_vertex>\n`, CLIPF = `#include <clipping_planes_pars_fragment>\n`;
function muhitLayer(R, kind){
  const m = new THREE.ShaderMaterial({
    uniforms:{uT:{value:0}, uK:{value:kind}, uIn:{value:1}},
    vertexShader:CLIPV+`varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=normalize(position); vec4 mvPosition=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mvPosition.xyz);
      #include <clipping_planes_vertex>
      gl_Position=projectionMatrix*mvPosition; }`,
    fragmentShader:CLIPF+NOISE+`uniform float uT, uK, uIn; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){
        #include <clipping_planes_fragment>
        float lat=asin(vP.y), lon=atan(-vP.z,vP.x);
        float mer = smoothstep(.997,1.,cos(lon*12.)) * (1.-smoothstep(1.2,1.5,abs(lat)));
        float par = smoothstep(.996,1.,cos(lat*12.));
        float eq = smoothstep(.99993,1.,cos(lat));
        float rim=pow(1.-abs(dot(vN,vV)),2.);
        if(uK<.5){ // inner face
          float neb = fbm(vP*2.2+vec3(0.,uT*.002,0.));
          vec3 base = mix(vec3(.004,.005,.01), vec3(.018,.02,.034), neb)*(.55+.45*(1.-abs(vP.y)));
          vec3 col = base + (mer*.7+par*.35)*vec3(.72,.78,.95)*.035 + eq*vec3(.85,.88,1.)*.03;
          gl_FragColor=vec4(col + rim*vec3(.03,.035,.06), .5);
        } else if(uK<1.5){ // inner strata
          float a=(mer*.6+par*.3)*.03 + rim*.03;
          gl_FragColor=vec4((vec3(.62,.68,.9)*a + vec3(.8,.84,1.)*eq*.05)*uIn, 1.);
        } else { // outer face
          float neb = fbm(vP*1.6-vec3(uT*.001));
          vec3 col = vec3(.42,.48,.7)*rim*1.0 + vec3(.75,.8,1.)*(mer*.5+par*.3+eq)*.14 + vec3(.03,.035,.06)*neb;
          gl_FragColor=vec4(col, 1.);
        }
      }`,
    side: kind<.5 ? THREE.BackSide : (kind<1.5 ? THREE.DoubleSide : THREE.FrontSide),
    transparent:true, depthWrite:false, blending: kind<.5 ? THREE.NormalBlending : THREE.AdditiveBlending,
    clipping:true, clippingPlanes:[clipPlane]
  });
  return new THREE.Mesh(new THREE.SphereGeometry(R, 128, 64), m);
}
const muhitGroup = new THREE.Group(); sky.add(muhitGroup);
const muhit = muhitLayer(R_MI, 0); muhitGroup.add(muhit);
const MUHIT_STRATA = [];
for(let k=1;k<=17;k++){ const L=muhitLayer(R_MI+(R_MO-R_MI)*Math.pow(k/18,1.25),1); muhitGroup.add(L); MUHIT_STRATA.push(L); }
const muhitOuter = muhitLayer(R_MO, 2); muhitGroup.add(muhitOuter);
const muhitMats = [muhit, ...MUHIT_STRATA, muhitOuter].map(m=>m.material);

// ---------- the eighth sphere holds the whole observable universe ----------
let seed=1234567; const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
const gauss=()=>{ let u=0,v=0; while(u===0) u=rnd(); v=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
// galactic (heliocentric x->centre, y->rotation, z->north pole) to equatorial J2000, then to scene
const TG=[[-0.0548755604,-0.8734370902,-0.4838350155],[0.4941094279,-0.4448296300,0.7469822445],[-0.8676661490,-0.1980763734,0.4559837762]];
const galToS=(x,y,z)=>{ const ex=TG[0][0]*x+TG[1][0]*y+TG[2][0]*z, ey=TG[0][1]*x+TG[1][1]*y+TG[2][1]*z, ez=TG[0][2]*x+TG[1][2]*y+TG[2][2]*z; return [ex,ez,-ey]; };
function pointsMat(extra=''){
  return new THREE.ShaderMaterial({
    uniforms:{uPx:{value:1}, uT:{value:0}, uFade:{value:1}},
    vertexShader:`attribute float aSize; attribute vec4 aCol; uniform float uPx; varying vec4 vC;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=aSize*uPx; vC=aCol; vC.a*=clamp(pow(150./max(-mv.z,1.),.85),.06,1.); }`,
    fragmentShader:`uniform float uFade; varying vec4 vC; void main(){ vec2 p=gl_PointCoord-.5; float r=length(p); if(r>.5) discard; float a=smoothstep(.5,0.,r); gl_FragColor=vec4(vC.rgb, vC.a*a*a*uFade); }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending });
}
function makePoints(pos, col, size){ const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('aCol',new THREE.BufferAttribute(col,4)); geo.setAttribute('aSize',new THREE.BufferAttribute(size,1));
  const p=new THREE.Points(geo, pointsMat()); p.frustumCulled=false; prec.add(p); return p; }
const pointMats=[];
// Milky Way: a density model (exponential disc with four spiral arms, a barred bulge), seen from the Sun's real place 8.2 kpc from the centre
const milky = (()=>{ const N=52000, P=new Float32Array(N*3), Cc=new Float32Array(N*4), Sz=new Float32Array(N); let n=0;
  const SUN=[-8.18,0,.02];
  while(n<N){ let x,y,z,kind;
    const r=rnd();
    if(r<.16){ kind=0; const a=gauss()*1.4, b=gauss()*.5, c=gauss()*.35, ang=27*DEG; x=a*Math.cos(ang)-b*Math.sin(ang); y=a*Math.sin(ang)+b*Math.cos(ang); z=c; }
    else { const R=-2.6*Math.log(rnd()*rnd()+1e-9); if(R>16) continue;
      let th=rnd()*2*Math.PI; kind=2;
      if(r<.62){ kind=1; const arm=Math.floor(rnd()*4); th = Math.log(Math.max(R,.6)/3)/Math.tan(12*DEG) + arm*Math.PI/2 + gauss()*.18; }
      x=R*Math.cos(th); y=R*Math.sin(th); z=(rnd()<.5?-1:1)*-.3*Math.log(rnd()+1e-9)*(kind===1?.5:1); }
    const hx=x-SUN[0], hy=y-SUN[1], hz=z-SUN[2]; const d=Math.hypot(hx,hy,hz); if(d<.05) continue;
    const u=galToS(hx/d,hy/d,hz/d), rr=rPc(d*1000);
    P[n*3]=u[0]*rr; P[n*3+1]=u[1]*rr; P[n*3+2]=u[2]*rr;
    const c = kind===0? [1,.78,.5] : kind===1? [.62,.74,1] : [.95,.9,.82];
    Cc.set([...c, kind===0?.025: kind===1?.13:.08], n*4); Sz[n]= kind===1? 2.2 : 1.8; n++; }
  return makePoints(P,Cc,Sz); })();
pointMats.push(milky.material);

// galaxies (OpenNGC; comoving distance from redshift, redshift-independent distances for the nearest)
const NG=U.gal.length, galPos=new Float32Array(NG*3), galInfo=[];
const galaxies = (()=>{ const Cc=new Float32Array(NG*4), Sz=new Float32Array(NG);
  U.gal.forEach((g0,i)=>{ const [ra,dec,ld,t,mag,ni,z]=g0; const u=radecS(ra,dec), pc=Math.pow(10,ld), rr=rPc(pc);
    galPos.set([u[0]*rr,u[1]*rr,u[2]*rr],i*3);
    const warm=Math.min(1,Math.max(0,(ld-6)/3));
    Cc.set([.78+.22*warm, .8+.05*warm, 1-.35*warm, .55+Math.max(0,(14-mag))*.05], i*4);
    Sz[i]= Math.max(2.2, Math.min(9, 2.4+(14-mag)*.75)) * (ni>=0?1.2:1);
    galInfo.push({ra,dec,pc,t,mag,name: ni>=0?U.nm[ni]:'', z}); });
  return makePoints(galPos,Cc,Sz); })();
pointMats.push(galaxies.material);

// clusters and nebulae inside the Milky Way (parallax distances)
const NO=U.obj.length, objPos=new Float32Array(NO*3), objInfo=[];
const OBJ_KIND=['Open star cluster','Globular cluster','Planetary nebula','Nebula','Supernova remnant','Supermassive black hole'];
const OBJ_COL=[[.7,.85,1],[1,.88,.6],[.45,1,.85],[1,.5,.6],[.8,.6,1],[1,.95,.6]];
const objects = (()=>{ const Cc=new Float32Array(NO*4), Sz=new Float32Array(NO);
  U.obj.forEach((o,i)=>{ const [ra,dec,pc,t,mag,ni]=o; const u=radecS(ra,dec), rr=rPc(pc);
    objPos.set([u[0]*rr,u[1]*rr,u[2]*rr],i*3); Cc.set([...OBJ_COL[t], .8], i*4); Sz[i]= ni>=0? 6:3.5;
    objInfo.push({ra,dec,pc,t,mag,name: ni>=0?U.nm[ni]:''}); });
  return makePoints(objPos,Cc,Sz); })();
pointMats.push(objects.material);

// the deep universe beyond the catalogue: a statistical sample at the true comoving number density,
// clustered as galaxies are, out to the most distant galaxies known (z ~ 14)
const deep = (()=>{ const N=46000, P=new Float32Array(N*3), Cc=new Float32Array(N*4), Sz=new Float32Array(N);
  const Dmin=650, Dmax=COS.dOfZ(14.3); let n=0;
  const place=(D,u,i)=>{ const z=COS.zOfD(D), rr=rPc(D*1e6), t=Math.min(1,Math.log10(1+z)/1.2);
    P[i*3]=u[0]*rr; P[i*3+1]=u[1]*rr; P[i*3+2]=u[2]*rr;
    Cc.set([1, .92-.45*t, .85-.7*t, .2*(1-.6*t)], i*4); Sz[i]=1.4+rnd()*1.0; };
  const randDir=()=>{ const zz=2*rnd()-1, ph=2*Math.PI*rnd(), q=Math.sqrt(1-zz*zz); return [q*Math.cos(ph),zz,q*Math.sin(ph)]; };
  while(n<N){ const D=Math.cbrt(Dmin**3+rnd()*(Dmax**3-Dmin**3)); const c=randDir();
    if(rnd()<.6){ const m=Math.min(N-n, 25+Math.floor(rnd()*40)); const cx=c[0]*D, cy=c[1]*D, cz=c[2]*D;
      for(let k=0;k<m;k++){ const x=cx+gauss()*6, y=cy+gauss()*6, z=cz+gauss()*6, d=Math.hypot(x,y,z); place(d,[x/d,y/d,z/d],n++); } }
    else place(D,c,n++); }
  return makePoints(P,Cc,Sz); })();
pointMats.push(deep.material);

// landmarks of the far universe
const lmPos=[], lmInfo=[];
U.lm.forEach(([nm,ra,dec,ld,z])=>{ const u=radecS(ra,dec), rr=rPc(Math.pow(10,ld)); lmPos.push(new THREE.Vector3(u[0]*rr,u[1]*rr,u[2]*rr)); lmInfo.push({name:nm,ra,dec,pc:Math.pow(10,ld),z}); });
const landmarks = makePoints(new Float32Array(lmPos.flatMap(v=>[v.x,v.y,v.z])), new Float32Array(lmPos.flatMap(()=>[1,.85,.6,1])), new Float32Array(lmPos.map(()=>9)));
pointMats.push(landmarks.material);

// the cosmic microwave background (last-scattering surface) and the particle horizon
const DIPOLE=radecS(167.942,-6.944);
const cmb = new THREE.Mesh(new THREE.SphereGeometry(R_CMB, 128, 64), new THREE.ShaderMaterial({
  uniforms:{uD:{value:new THREE.Vector3(...DIPOLE)}},
  vertexShader:CLIPV+`varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=normalize(position); vec4 mvPosition=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mvPosition.xyz);
    #include <clipping_planes_vertex>
    gl_Position=projectionMatrix*mvPosition; }`,
  fragmentShader:CLIPF+NOISE+`uniform vec3 uD; varying vec3 vP; varying vec3 vN; varying vec3 vV;
    void main(){
      #include <clipping_planes_fragment>
      float n = fbm(vP*7.)*.6 + fbm(vP*19.)*.4;
      float dip = dot(vP,uD);
      vec3 col = mix(vec3(.55,.18,.08), vec3(1.,.62,.3), n) * (1.+.35*dip);
      float rim=pow(1.-abs(dot(vN,vV)),1.5);
      gl_FragColor=vec4(col*(.012+.07*rim), 1.);
    }`,
  side:THREE.DoubleSide, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, clipping:true, clippingPlanes:[clipPlane] }));
prec.add(cmb);
const horizon = new THREE.Mesh(new THREE.SphereGeometry(R_EDGE, 128, 64), shellMat(0xe8dccb, .5));
horizon.material.clipping=true; horizon.material.clippingPlanes=[clipPlane];
horizon.material.vertexShader = CLIPV + horizon.material.vertexShader.replace('gl_Position=projectionMatrix*mv;','vec4 mvPosition=mv;\n#include <clipping_planes_vertex>\ngl_Position=projectionMatrix*mv;');
horizon.material.fragmentShader = CLIPF + horizon.material.fragmentShader.replace('void main(){','void main(){\n#include <clipping_planes_fragment>\n');
prec.add(horizon);

// ---------- stars ----------
const NS = SKY.s.length;
const sDir = new Float32Array(NS*3), sMag=new Float32Array(NS), sCol=new Float32Array(NS*3), sPar=new Float32Array(NS), sRad=new Float32Array(NS);
function bvToRGB(bv){ bv=Math.max(-.4,Math.min(2,bv)); const t=(bv+.4)/2.4;
  const r = t<.35? .62+t*1.1 : 1, g2 = t<.5? .75+t*.4 : 1-(t-.5)*.55, b = t<.3? 1 : 1-(t-.3)*1.05;
  return [Math.min(1,r),Math.max(.35,g2),Math.max(.25,b)]; }
SKY.s.forEach((s,i)=>{ sDir.set(radecS(s[0],s[1]), i*3); sMag[i]=s[2]; sCol.set(bvToRGB(s[3]), i*3);
  sPar[i] = (s[4]>0 && s[4]<100000) ? 1/(s[4]*206264.806) : 0; sRad[i]=rPc(s[4]); });
const starGeo=new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(sDir,3));
starGeo.setAttribute('aMag', new THREE.BufferAttribute(sMag,1));
starGeo.setAttribute('aCol', new THREE.BufferAttribute(sCol,3));
starGeo.setAttribute('aPar', new THREE.BufferAttribute(sPar,1));
starGeo.setAttribute('aR', new THREE.BufferAttribute(sRad,1));
const starMat=new THREE.ShaderMaterial({
  uniforms:{uR:{value:R_STARS}, uE:{value:new THREE.Vector3()}, uV:{value:new THREE.Vector3()}, uKa:{value:0}, uKp:{value:0}, uPx:{value:1}, uT:{value:0}},
  vertexShader:`attribute float aMag; attribute vec3 aCol; attribute float aPar; attribute float aR;
    uniform float uR, uKa, uKp, uPx, uT; uniform vec3 uE, uV; varying vec3 vC; varying float vA;
    void main(){
      vec3 d=position;
      vec3 ep = uE - dot(uE,d)*d; vec3 vp = uV - dot(uV,d)*d;
      d = normalize(d - aPar*uKp*ep + uKa*vp);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(d*aR,1.);
      float s = clamp(6.9-aMag, .6, 9.);
      float tw = .85+.15*sin(uT*2.3+position.x*91.+position.y*57.);
      gl_PointSize = (1.2 + s*s*.085)*uPx;
      vC=aCol*(aMag<1.5?1.6:1.); vA=clamp(.25+(6.6-aMag)*.18,.18,1.)*tw;
    }`,
  fragmentShader:`varying vec3 vC; varying float vA;
    void main(){ vec2 p=gl_PointCoord-.5; float r=length(p); if(r>.5) discard;
      float core=smoothstep(.5,.0,r); float spike=max(0.,1.-abs(p.x)*14.)*max(0.,1.-abs(p.y)*2.2)+max(0.,1.-abs(p.y)*14.)*max(0.,1.-abs(p.x)*2.2);
      gl_FragColor=vec4(vC, (core*core + spike*.25*step(1.2,vA*1.4))*vA); }`,
  transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
});
const starPts=new THREE.Points(starGeo, starMat); starPts.frustumCulled=false; prec.add(starPts);

// buruj figures (al-Sufi)
const zodGroup=new THREE.Group(); prec.add(zodGroup);
const zodLabels=[];
for(const z of SKY.z){
  const pts=[]; let cx=0,cy=0,cz=0,n=0;
  for(const L of z.l){ const A3=new THREE.Vector3(...radecS(L[0],L[1])).multiplyScalar(rPc(L[2])), B3=new THREE.Vector3(...radecS(L[3],L[4])).multiplyScalar(rPc(L[5]));
    pts.push(A3,B3); cx+=A3.x+B3.x; cy+=A3.y+B3.y; cz+=A3.z+B3.z; n+=2; }
  zodGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:0x9aa6cc, transparent:true, opacity:.32, depthWrite:false})));
  zodLabels.push({pos:new THREE.Vector3(cx/n,cy/n,cz/n), html:`${z.ar}<small>${z.tr}</small>`});
}
// ecliptic of date and the 12 signs
const signGroup=new THREE.Group(); sky.add(signGroup);
const SIGNS=[['الحمل','al-Ḥamal'],['الثور','al-Thawr'],['الجوزاء','al-Jawzāʾ'],['السرطان','al-Saraṭān'],['الأسد','al-Asad'],['السنبلة','al-Sunbula'],['الميزان','al-Mīzān'],['العقرب','al-ʿAqrab'],['القوس','al-Qaws'],['الجدي','al-Jady'],['الدلو','al-Dalw'],['الحوت','al-Ḥūt']];
const signLabels=[];
{ const eps=23.4393*DEG, Rr=R_STARS*.99;
  const ec = L => new THREE.Vector3(Math.cos(L)*Rr, Math.sin(L)*Math.sin(eps)*Rr, -Math.sin(L)*Math.cos(eps)*Rr);
  const nrm=new THREE.Vector3(0,Math.cos(eps),Math.sin(eps));
  signGroup.add(ringLine(Rr, 0x9aa6cc, .3));
  const tick=[];
  for(let k=0;k<12;k++){ const p=ec(k*30*DEG); tick.push(p.clone().addScaledVector(nrm,.9), p.clone().addScaledVector(nrm,-.9));
    signLabels.push({pos:ec((k*30+15)*DEG).addScaledVector(nrm,-1.25), html:`${SIGNS[k][0]}<small>${SIGNS[k][1]} · ${k*30}°–${k*30+30}°</small>`}); }
  signGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tick), new THREE.LineBasicMaterial({color:0x9aa6cc, transparent:true, opacity:.35})));
}

// ---------- planets ----------
function bodyMat(b){
  return new THREE.ShaderMaterial({
    uniforms:{uL:{value:new THREE.Vector3(1,0,0)}, uT:{value:0}, uType:{value:b.type}, tMap:{value: b.key==='Moon'? loadTex(TEX.moon,true) : null}},
    vertexShader:`varying vec3 vO; varying vec3 vVN; varying vec3 vV; varying vec2 vUv; void main(){ vUv=uv; vO=normalize(position); vVN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:NOISE+`uniform vec3 uL; uniform float uT; uniform int uType; uniform sampler2D tMap; varying vec2 vUv; varying vec3 vO; varying vec3 vVN; varying vec3 vV;
      void main(){
        vec3 n=vO; float lat=n.y; vec3 col; float atm=0.; vec3 atmC=vec3(0.);
        float mu=max(dot(vVN,vV),0.);
        if(uType==3){
          float g1=fbm(n*9.+vec3(uT*.03,0.,uT*.02)), g2=fbm(n*26.-vec3(0.,uT*.05,0.));
          col=mix(vec3(1.,.55,.18),vec3(1.,.93,.72),g1*.7+g2*.5)*(.5+.5*pow(mu,.45))*2.2;
          gl_FragColor=vec4(col,1.); return;
        }
        if(uType==0){ col=texture2D(tMap, vUv).rgb*1.15; }
        else if(uType==1){ col=vec3(.56,.53,.5)*(.65+.55*fbm(n*6.)); col*=.85+.25*smoothstep(.55,.7,fbm(n*20.)); }
        else if(uType==2){ float bnd=fbm(vec3(n.x*2.,n.y*6.,n.z*2.)+vec3(uT*.01,0.,0.)); col=mix(vec3(.9,.8,.55),vec3(1.,.96,.84),bnd); atm=1.; atmC=vec3(1.,.9,.6); }
        else if(uType==4){ float f=fbm(n*3.5); col=mix(vec3(.78,.38,.2),vec3(.42,.2,.12),smoothstep(.42,.66,f)); col=mix(col,vec3(.96,.94,.92),smoothstep(.86,.93,abs(lat))); atm=.5; atmC=vec3(1.,.6,.4); }
        else if(uType==5){ float t=fbm(n*3.+vec3(0.,0.,uT*.01)); float bnd=sin(lat*24.+t*4.5);
          col=mix(vec3(.88,.78,.62),vec3(.6,.43,.3),.5+.5*bnd); col=mix(col,vec3(.97,.94,.88),smoothstep(.55,1.,sin(lat*12.+t*2.))*.45);
          vec3 c0=normalize(vec3(.75,-.38,.54)); float d=length((n-c0)*vec3(1.,1.7,1.)); col=mix(col,vec3(.8,.4,.27),smoothstep(.17,.1,d)); }
        else { float t=fbm(n*2.); float bnd=sin(lat*16.+t*2.); col=mix(vec3(.92,.84,.62),vec3(.78,.66,.46),.5+.5*bnd); col=mix(col,vec3(.6,.62,.6),smoothstep(.9,.97,lat)*.5); }
        float l=dot(n,normalize(uL));
        float lit=smoothstep(-.06,.35,l);
        vec3 c=col*(.025+.86*lit);
        float rim=pow(1.-mu,3.);
        c += atm*rim*atmC*smoothstep(-.3,.4,l)*.8;
        gl_FragColor=vec4(c,1.);
      }`
  });
}
function glowTex(inner='rgba(255,240,200,1)', mid='rgba(255,190,100,.42)', outer='rgba(255,160,60,0)'){
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  const gr=x.createRadialGradient(128,128,0,128,128,128); gr.addColorStop(0,inner); gr.addColorStop(.18,mid); gr.addColorStop(.5,'rgba(255,150,60,.08)'); gr.addColorStop(1,outer);
  x.fillStyle=gr; x.fillRect(0,0,256,256); return new THREE.CanvasTexture(c); }
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(), color:0xffd9a0, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending}));
sunGlow.scale.set(4.2,4.2,1);
function ringTex(){ // Saturn's rings, radial profile (C ring, B ring, Cassini division, A ring, Encke gap)
  const c=document.createElement('canvas'); c.width=512; c.height=4; const x=c.getContext('2d');
  for(let i=0;i<512;i++){ const r=1.24+(2.27-1.24)*i/511; let a=0, col=[220,205,165];
    if(r<1.53){ a=.18+.08*Math.sin(r*90); col=[160,150,130]; }
    else if(r<1.95){ a=.75+.2*Math.sin(r*140); col=[232,215,172]; }
    else if(r<2.03){ a=.06; }
    else { a=.5+.12*Math.sin(r*110); if(Math.abs(r-2.21)<.006) a=.05; col=[210,195,158]; }
    x.fillStyle=`rgba(${col.join(',')},${Math.max(0,Math.min(1,a))})`; x.fillRect(i,0,1,4); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }

const tmpQ=new THREE.Quaternion();
for(const b of BODIES){
  b.mesh=new THREE.Mesh(new THREE.SphereGeometry(b.size,64,32), bodyMat(b));
  b.mesh.quaternion.copy(qFromPole(...POLE[b.key]));
  b.mesh.userData.body=b; prec.add(b.mesh);
  if(b.key==='Sun'){ prec.add(sunGlow); }
  if(b.key==='Saturn'){
    const rg=new THREE.RingGeometry(b.size*1.24,b.size*2.27,128,1);
    const pa=rg.attributes.position, uv=rg.attributes.uv; const v=new THREE.Vector3();
    for(let i=0;i<pa.count;i++){ v.fromBufferAttribute(pa,i); uv.setXY(i,(v.length()-b.size*1.24)/(b.size*1.03),.5); }
    rg.rotateX(-Math.PI/2); // ring in the planet's equatorial plane (local XZ)
    b.ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:ringTex(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    b.mesh.add(b.ring);
  }
  b.trail={pts:[], last:null};
  b.trailLine=trailLine();
}
const earthTrail={trail:{pts:[],last:null}, span:365.25, line:trailLine(), col:[.45,.65,1]};
function trailLine(){ const N=240, tg=new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N*3),3));
  tg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N*4),4)); tg.setDrawRange(0,0);
  const l=new THREE.Line(tg,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  l.frustumCulled=false; prec.add(l); return l; }
for(const o of OUTER){ o.mesh=new THREE.Mesh(new THREE.SphereGeometry(.07,16,8), new THREE.MeshBasicMaterial({color:new THREE.Color(...o.col)})); o.mesh.visible=false; prec.add(o.mesh); }

// ---------- moons of Mars, Jupiter and Saturn ----------
// Jupiter's four large moons use the real ephemeris. Mars's and Saturn's moons run on their true orbits and periods,
// with positions along the orbit approximate. Distances from the planet are compressed to fit the enlarged planet.
const moonR=(b,aPR)=> b.size*(aPR<=2.3? aPR : 2.3+0.9*Math.sqrt(aPR-2.3));
function moonMat(parent,col){ return new THREE.ShaderMaterial({ uniforms:{uL:parent.material.uniforms.uL, uC:{value:new THREE.Color(...col)}},
  vertexShader:`varying vec3 vN; void main(){ vN=normalize(normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`uniform vec3 uL, uC; varying vec3 vN; void main(){ float l=smoothstep(-.05,.4,dot(normalize(vN),normalize(uL))); gl_FragColor=vec4(uC*(.03+.95*l),1.); }` }); }
const MOONS={
  Jupiter:{R:71492, real:true, list:[['Io',5.90,0,.034,[1,.86,.45]],['Europa',9.40,0,.03,[.93,.87,.76]],['Ganymede',14.97,0,.042,[.76,.72,.68]],['Callisto',26.33,0,.04,[.52,.48,.44]]]},
  Saturn:{R:60268, list:[['Mimas',3.08,.942,.012,[.8,.8,.8]],['Enceladus',3.95,1.370,.014,[.97,.97,1]],['Tethys',4.89,1.888,.018,[.85,.85,.85]],['Dione',6.26,2.737,.018,[.82,.82,.82]],['Rhea',8.74,4.518,.022,[.8,.8,.8]],['Titan',20.27,15.945,.04,[.95,.72,.38]],['Iapetus',59.0,79.32,.02,[.7,.62,.52]]]},
  Mars:{R:3389.5, list:[['Phobos',2.76,.3189,.014,[.6,.55,.5]],['Deimos',6.92,1.2624,.011,[.65,.6,.55]]]},
};
const moonGroups=[];
for(const [pk,M] of Object.entries(MOONS)){ const pb=BMAP[pk]; const grp=new THREE.Group(); pb.mesh.add(grp); moonGroups.push(grp);
  M.meshes=M.list.map(([nm,a,P,sz,col],k)=>{ const mm=new THREE.Mesh(new THREE.SphereGeometry(sz,20,12), moonMat(pb.mesh,col)); mm.userData={nm,a,P,ph:k*2.39+.7}; grp.add(mm);
    const pts=[]; const rr=moonR(pb,a); for(let q=0;q<=96;q++){ const th=q/96*2*Math.PI; pts.push(new THREE.Vector3(Math.cos(th)*rr,0,Math.sin(th)*rr)); }
    grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:0x9fd8ff,transparent:true,opacity:.18,depthWrite:false})));
    return mm; }); }
const _inv=new THREE.Quaternion(), _v=new THREE.Vector3();
function updateMoons(t){
  for(const [pk,M] of Object.entries(MOONS)){ const pb=BMAP[pk];
    if(M.real){ const lt=pos[pk].d/C_AU_DAY, jm=A.JupiterMoons(A.MakeTime(t.ut-lt)); const arr=[jm.io,jm.europa,jm.ganymede,jm.callisto]; _inv.copy(pb.mesh.quaternion).invert();
      M.meshes.forEach((mm,k)=>{ const v=arr[k]; const sv=toS({x:v.x,y:v.y,z:v.z}); const d=Math.hypot(...sv); const aPR=d*AU_KM/M.R;
        _v.set(sv[0]/d,sv[1]/d,sv[2]/d).applyQuaternion(_inv).multiplyScalar(moonR(pb,aPR)); mm.position.copy(_v); }); }
    else M.meshes.forEach(mm=>{ const u=mm.userData, th=2*Math.PI*(t.ut/u.P)+u.ph, rr=moonR(pb,u.a); mm.position.set(Math.cos(th)*rr,0,Math.sin(th)*rr); }); }
}

// ---------- asteroids and comets on their real orbits (Stellarium minor-body elements, J2000 ecliptic) ----------
const OBL=23.4392911*DEG, cOb=Math.cos(OBL), sOb=Math.sin(OBL), GK=0.01720209895;
function orbitPos(o, jd, out){ // heliocentric position, scene axes (equatorial J2000)
  let r, nu; const e=o.e;
  if(e<1){ let M=(o.M0 + o.n*(jd-o.ep))*DEG; M=((M%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI;
    let E = e>.8 ? Math.PI*Math.sign(M||1) : M; for(let k=0;k<20;k++){ const f=E-e*Math.sin(E)-M; E-=f/(1-e*Math.cos(E)); }
    r=o.a*(1-e*Math.cos(E)); nu=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2), Math.sqrt(1-e)*Math.cos(E/2)); }
  else { const ee=Math.max(e,1.000001), a=o.q/(ee-1), M=GK/Math.pow(a,1.5)*(jd-o.Tp);
    // hyperbolic Kepler equation e·sinh H − H = M, solved by Newton's method kept inside a bracket
    // (plain Newton overshoots for nearly parabolic orbits); f is monotonic, and |H| ≤ asinh(|M|/(e−1))
    const sg=M<0?-1:1, Ma=Math.abs(M); let lo=0, hi=Math.asinh(Ma/(ee-1)), H=Math.min(hi, Math.cbrt(6*Ma/ee));
    for(let k=0;k<80;k++){ const f=ee*Math.sinh(H)-H-Ma; if(f>0) hi=H; else lo=H; let Hn=H-f/(ee*Math.cosh(H)-1);
      if(!(Hn>lo && Hn<hi)) Hn=(lo+hi)/2; if(Math.abs(Hn-H)<1e-14*Math.max(1,H)){ H=Hn; break; } H=Hn; }
    H*=sg;
    r=a*(ee*Math.cosh(H)-1); nu=2*Math.atan(Math.sqrt((ee+1)/(ee-1))*Math.tanh(H/2)); }
  const uu=o.w+nu, cu=Math.cos(uu), su=Math.sin(uu);
  const X=r*(o.cO*cu-o.sO*su*o.ci), Y=r*(o.sO*cu+o.cO*su*o.ci), Z=r*su*o.si;
  out[0]=X; out[1]=Y*sOb+Z*cOb; out[2]=-(Y*cOb-Z*sOb); return r; }
const mkEl=(i,O,w)=>({i:i*DEG,O:O*DEG,w:w*DEG,ci:Math.cos(i*DEG),si:Math.sin(i*DEG),cO:Math.cos(O*DEG),sO:Math.sin(O*DEG)});
const SB=[]; // small bodies
for(const a of MINOR.ast){ const [A0,e,i,O,w,M0,ep,n,H,name,dw]=a; SB.push({...mkEl(i,O,w), a:A0,e,M0,ep,n, name, kind: dw?1:0, H}); }
// statistical main belt (Kirkwood gaps at the 3:1, 5:2, 7:3, 2:1 resonances) and Jupiter's Trojans
{ const GAPS=[[2.502,.03],[2.825,.025],[2.958,.018],[3.279,.03]];
  for(let k=0;k<5200;){ const a=2.1+rnd()*1.25; if(GAPS.some(([c,w])=>Math.abs(a-c)<w)) continue; if(rnd()>Math.exp(-Math.pow((a-2.7)/.45,2))+.15) continue;
    SB.push({...mkEl(Math.abs(gauss())*8,rnd()*360,rnd()*360), a, e:Math.min(.32,Math.abs(gauss())*.1), M0:rnd()*360, ep:2451545.0, n:0.9856076686/Math.pow(a,1.5), kind:2}); k++; }
  for(let k=0;k<900;k++){ const L4=k%2===0, a=5.2+gauss()*.06, O=rnd()*360, w=rnd()*360, lam=34.40+(L4?60:-60)+gauss()*12;
    SB.push({...mkEl(Math.abs(gauss())*11,O,w), a, e:Math.abs(gauss())*.06, M0:lam-O-w, ep:2451545.0, n:0.08308529, kind:3}); } }
const NC0=SB.length;
for(const c of MINOR.com){ const [q,e,i,O,w,Tp,name,H,inter]=c; const el={...mkEl(i,O,w), q,e,Tp,name,kind: inter?5:4,H};
  if(e<1){ el.a=q/(1-e); el.n=0.9856076686/Math.pow(el.a,1.5); el.M0=0; el.ep=Tp; } SB.push(el); }
const NSB=SB.length, sbHel=new Float32Array(NSB*3), sbPos=new Float32Array(NSB*3), sbR=new Float32Array(NSB);
const SB_COL={0:[.86,.78,.66,.85],1:[.75,.85,1,.95],2:[.62,.58,.52,.32],3:[.7,.6,.5,.35],4:[.65,.95,1,1],5:[1,.6,.95,1]};
const smallBodies=(()=>{ const Cc=new Float32Array(NSB*4), Sz=new Float32Array(NSB);
  SB.forEach((o,i)=>{ Cc.set(SB_COL[o.kind],i*4); Sz[i]= o.kind===2||o.kind===3 ? 1.5 : o.kind===0 ? (o.H<7?5:2.4) : o.kind===1? 4.5 : 5; });
  return makePoints(sbPos,Cc,Sz); })();
pointMats.push(smallBodies.material);
const tailGeo=new THREE.BufferGeometry(); const NCOM=NSB-NC0;
tailGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(NCOM*2*3*4),3)); tailGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(NCOM*2*4*4),4));
const tails=new THREE.LineSegments(tailGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); tails.frustumCulled=false; prec.add(tails);
const FAMOUS=['Halley','Hale-Bopp','NEOWISE','C/2026 C1','3I/ATLAS','2I/','1I/','Lemmon'];
const SB_NAMED=new Set(['Ceres','Vesta','Pallas','Hygiea','Eris','Haumea','Makemake','Sedna','Quaoar','Gonggong','Orcus']);
const cometOrbits=[];
SB.forEach((o,i)=>{ if(o.kind>=4 && FAMOUS.some(f=>o.name.includes(f))){ const pts=[];
  if(o.e<1){ for(let k=0;k<=360;k++){ const nu=(k/360)*2*Math.PI-Math.PI; const r=o.a*(1-o.e*o.e)/(1+o.e*Math.cos(nu)); if(r>80) continue; pts.push(orbitHel(o,nu,r)); } }
  else { const nuMax=Math.acos(-1/o.e)-.02; for(let k=0;k<=300;k++){ const nu=-nuMax+2*nuMax*k/300; const r=o.q*(1+o.e)/(1+o.e*Math.cos(nu)); if(r>60) continue; pts.push(orbitHel(o,nu,r)); } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pts.length*3),3));
  const ln=new THREE.Line(geo,new THREE.LineBasicMaterial({color:o.kind===5?0xd8c8f0:0xc8d8ff,transparent:true,opacity:.09,depthWrite:false,blending:THREE.AdditiveBlending})); ln.frustumCulled=false; prec.add(ln);
  cometOrbits.push({o,pts,ln}); } });
function orbitHel(o,nu,r){ const uu=o.w+nu, cu=Math.cos(uu), su=Math.sin(uu); const X=r*(o.cO*cu-o.sO*su*o.ci), Y=r*(o.sO*cu+o.cO*su*o.ci), Z=r*su*o.si; return [X, Y*sOb+Z*cOb, -(Y*cOb-Z*sOb)]; }
let EH=[0,0,0], EV=[0,0,0];
// apparent geocentric vector of a catalogued small body (scene axes, AU), same convention as the planets
function sbApparent(i, jd, E, V, out){ const o=SB[i], o3=[0,0,0]; orbitPos(o,jd,o3);
  let tau=Math.hypot(o3[0]-E[0],o3[1]-E[1],o3[2]-E[2])/C_AU_DAY;
  for(let k=0;k<3;k++){ orbitPos(o,jd-tau,o3); tau=Math.hypot(o3[0]-E[0],o3[1]-E[1],o3[2]-E[2])/C_AU_DAY; } orbitPos(o,jd-tau,o3);
  const ax=o3[0]-E[0], ay=o3[1]-E[1], az=o3[2]-E[2], L=Math.hypot(ax,ay,az);
  // Earth at the light-departure time: E − Vτ + ½aτ² (the Sun's pull a = −k²E/|E|³), or exactly when the light time is long
  let ex, ey, ez;
  if(tau>0.25){ const Et=toS(A.HelioVector('Earth', A.MakeTime(jd-2451545.0-tau))); ex=Et[0]; ey=Et[1]; ez=Et[2]; }
  else { const re=Math.hypot(E[0],E[1],E[2]), q=0.5*GK*GK/(re*re*re)*tau*tau; ex=E[0]-V[0]*tau-q*E[0]; ey=E[1]-V[1]*tau-q*E[1]; ez=E[2]-V[2]*tau-q*E[2]; }
  const px=o3[0]-ex, py=o3[1]-ey, pz=o3[2]-ez, lp=Math.hypot(px,py,pz);
  out[0]=px/lp*L; out[1]=py/lp*L; out[2]=pz/lp*L; return out; }
let lastSbKey='';
function updateSmallBodies(t, force){
  const key=t.ut+'|'+state.u.toFixed(4)+'|'+state.c.toFixed(4); if(!force && key===lastSbKey) return; lastSbKey=key;
  const jd=t.ut+2451545.0, es=A.HelioState('Earth',t); EH=toS(es); EV=toS({x:es.vx,y:es.vy,z:es.vz});
  const ap=[0,0,0];
  const o3=[0,0,0], ta=tailGeo.attributes.position.array, tc=tailGeo.attributes.color.array; let tk=0;
  for(let i=0;i<NSB;i++){ const o=SB[i]; const r=orbitPos(o,jd,o3); sbHel[i*3]=o3[0]; sbHel[i*3+1]=o3[1]; sbHel[i*3+2]=o3[2]; sbR[i]=r;
    if(o.kind===2||o.kind===3) dispPoint(o3[0]-EH[0],o3[1]-EH[1],o3[2]-EH[2],tmp); else { sbApparent(i,jd,EH,EV,ap); dispPoint(ap[0],ap[1],ap[2],tmp); }
    sbPos[i*3]=tmp[0]; sbPos[i*3+1]=tmp[1]; sbPos[i*3+2]=tmp[2];
    if(o.kind>=4){ // tail points away from the Sun; longer when close to it
      const L = r<5 ? Math.min(.9, .55/Math.pow(Math.max(r,.3),1.4)) : 0;
      for(let seg=0;seg<4;seg++){ const f0=seg/4, f1=(seg+1)/4;
        for(const [f,slot] of [[f0,0],[f1,1]]){ const k=1+L*f/r; dispPoint(o3[0]*k-EH[0],o3[1]*k-EH[1],o3[2]*k-EH[2],tmp);
          ta[tk*3]=tmp[0]; ta[tk*3+1]=tmp[1]; ta[tk*3+2]=tmp[2]; const al=L>0? (1-f)*.85 : 0; tc[tk*4]=.7; tc[tk*4+1]=.95; tc[tk*4+2]=1; tc[tk*4+3]=al; tk++; } } } }
  smallBodies.geometry.attributes.position.needsUpdate=true; tailGeo.attributes.position.needsUpdate=true; tailGeo.attributes.color.needsUpdate=true;
}
function updateCometOrbits(){ for(const co of cometOrbits){ const pa=co.ln.geometry.attributes.position.array;
  co.pts.forEach((p,k)=>{ dispPoint(p[0]-EH[0],p[1]-EH[1],p[2]-EH[2],tmp); pa[k*3]=tmp[0]; pa[k*3+1]=tmp[1]; pa[k*3+2]=tmp[2]; }); co.ln.geometry.attributes.position.needsUpdate=true; } }

// ---------- light paths & warped fabric ----------
const NP=180;
function dynLine(color, opacity, dashed){
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP*3),3));
  const mat = dashed? new THREE.LineDashedMaterial({color,transparent:true,opacity,dashSize:.25,gapSize:.2,depthWrite:false})
                    : new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});
  const l=new THREE.Line(geo,mat); l.frustumCulled=false; prec.add(l); return l; }
const sightLine=dynLine(0xe4ecff,.85), sunLine=dynLine(0xfff2d8,.35), chordLine=dynLine(0x7c84a8,.35,true);
const dispLines=[dynLine(0xff6a5a,.9),dynLine(0x6aff9a,.9),dynLine(0x6a9aff,.9)];
const FAB_R=[.1,.25,.5,.75,1,1.25,1.5,2,2.5,3,4,5,6,8,10], FAB_SP=36, FAB_NC=128, FAB_NS=60;
const fabGeo=new THREE.BufferGeometry();
fabGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array((FAB_R.length*FAB_NC + FAB_SP*FAB_NS)*6),3));
const fabric=new THREE.LineSegments(fabGeo,new THREE.LineBasicMaterial({color:0x6fb5a5,transparent:true,opacity:.2,depthWrite:false,blending:THREE.AdditiveBlending}));
fabric.frustumCulled=false; prec.add(fabric);
const fabSrc=[];
{ const eps=23.4393*DEG; const P=(r,L)=>{ const x=r*Math.cos(L), y=r*Math.sin(L); return [x, y*Math.sin(eps), -y*Math.cos(eps)]; };
  for(const r of FAB_R){ const pl=[]; for(let i=0;i<=FAB_NC;i++) pl.push(P(r,i/FAB_NC*2*Math.PI)); fabSrc.push(pl); }
  for(let k=0;k<FAB_SP;k++){ const L=k/FAB_SP*2*Math.PI; const pl=[]; for(let i=0;i<=FAB_NS;i++) pl.push(P(0.02*Math.pow(500,i/FAB_NS),L)); fabSrc.push(pl); } }

// ---------- per-frame astronomy ----------
const pos = {};
const tmp=[0,0,0], tmp2=[0,0,0], tmp3=[0,0,0];
// Geocentric apparent position (scene axes, AU): direction includes light time and aberration
// (body at t−τ minus Earth at t−τ, to first order); length is the light-time distance |P(t−τ) − E(t)|.
function geoApparent(key, t){
  let app=A.GeoVector(key, t, true);
  if(key==='Moon'){ const d0=Math.hypot(app.x,app.y,app.z); app=A.GeoVector('Moon', A.MakeTime(t.ut - d0/C_AU_DAY), true); } // the library omits the Moon's 1.3 s light time
  let ast;
  if(key==='Moon'){ const es=A.HelioState('Earth',t), tau=Math.hypot(app.x,app.y,app.z)/C_AU_DAY;   // barycentric light-time range, as JPL defines it
    ast={x:app.x-es.vx*tau, y:app.y-es.vy*tau, z:app.z-es.vz*tau}; }
  else ast=A.GeoVector(key, t, false);
  const L=Math.hypot(ast.x,ast.y,ast.z), a=toS(app), la=Math.hypot(...a), u=[a[0]/la,a[1]/la,a[2]/la];
  return {p:[u[0]*L,u[1]*L,u[2]*L], d:L, u};
}
let lastCompUt=null;
function compute(t){
  if(t.ut===lastCompUt) return; lastCompUt=t.ut;   // a pure function of time: nothing to redo when time has not moved
  for(const b of [...BODIES, ...OUTER]){ pos[b.key]=geoApparent(b.key, t); }
  sunNow = pos.Sun.p; qsNow = pos.Sun.u.map(x=>x*R_SUN);
  anchors = [{p:[0,0,0], d:[0,0,0], s2:0.004**2}];
  for(const b of BODIES){ const P=pos[b.key], gr=g(P.d);
    anchors.push({p:P.p, s2:(0.12*P.d+0.004)**2, d:P.u.map(x=>x*(b.R-gr))}); }
}
function sampleAt(key, ut){ const t=A.MakeTime(ut); return { p: key==='EarthT' ? null : geoApparent(key,t).p, s: geoApparent('Sun',t).p }; }
function updateTrail(T, key, span, ut){
  const N=240, step=span/N;
  if(T.last===null || ut < T.last-step || ut - T.last > span){ T.pts=[]; for(let i=N-1;i>=0;i--) T.pts.push(sampleAt(key, ut-i*step)); T.last=ut; }
  else { let k=0; while(T.last+step <= ut && k<40){ T.last+=step; T.pts.push(sampleAt(key,T.last)); if(T.pts.length>N) T.pts.shift(); k++; } }
}
function drawTrail(line, pts, col, fn){
  const pa=line.geometry.attributes.position, ca=line.geometry.attributes.color, n=pts.length;
  for(let i=0;i<n;i++){ fn(pts[i], tmp); pa.setXYZ(i,tmp[0],tmp[1],tmp[2]); const a=Math.pow(i/n,1.6)*.55; ca.setXYZW(i,col[0],col[1],col[2],a); }
  pa.needsUpdate=true; ca.needsUpdate=true; line.geometry.setDrawRange(0,n);
}
function setPath(line, from, to, startDisp, endDisp, spread=0){
  const pa=line.geometry.attributes.position;
  dispPoint(from[0]+(to[0]-from[0])*1e-6, from[1]+(to[1]-from[1])*1e-6, from[2]+(to[2]-from[2])*1e-6, tmp2);
  dispPoint(to[0],to[1],to[2],tmp3);
  const e0=[startDisp[0]-tmp2[0],startDisp[1]-tmp2[1],startDisp[2]-tmp2[2]], e1=[endDisp[0]-tmp3[0],endDisp[1]-tmp3[1],endDisp[2]-tmp3[2]];
  for(let i=0;i<NP;i++){ const s=i/(NP-1), sx=Math.max(s,1e-6);
    dispPoint(from[0]+(to[0]-from[0])*sx, from[1]+(to[1]-from[1])*sx, from[2]+(to[2]-from[2])*sx, tmp);
    pa.setXYZ(i, tmp[0]+e0[0]*(1-s)+e1[0]*s, tmp[1]+e0[1]*(1-s)+e1[1]*s + Math.sin(Math.PI*s)*spread, tmp[2]+e0[2]*(1-s)+e1[2]*s);
  }
  pa.needsUpdate=true; line.geometry.setDrawRange(0,NP);
}
function turning(line){
  const a=line.geometry.attributes.position.array; let tot=0;
  for(let i=1;i<NP-1;i++){ const ax=a[i*3]-a[i*3-3], ay=a[i*3+1]-a[i*3-2], az=a[i*3+2]-a[i*3-1], bx=a[i*3+3]-a[i*3], by=a[i*3+4]-a[i*3+1], bz=a[i*3+5]-a[i*3+2];
    const la=Math.hypot(ax,ay,az), lb=Math.hypot(bx,by,bz); if(la<1e-9||lb<1e-9) continue;
    tot+=Math.acos(Math.max(-1,Math.min(1,(ax*bx+ay*by+az*bz)/(la*lb)))); }
  return tot/DEG;
}
function drawFabric(){
  const pa=fabGeo.attributes.position; let k=0;
  for(const pl of fabSrc){ let px=0,py=0,pz=0,first=true;
    for(const p of pl){ dispPoint(p[0],p[1],p[2],tmp);
      if(!first){ pa.setXYZ(k++,px,py,pz); pa.setXYZ(k++,tmp[0],tmp[1],tmp[2]); } px=tmp[0];py=tmp[1];pz=tmp[2]; first=false; } }
  pa.needsUpdate=true; fabGeo.setDrawRange(0,k);
}

// ---------- labels ----------
const labelsEl=document.getElementById('labels');
const mk=(cls,html)=>{ const e=document.createElement('div'); e.className=cls; e.innerHTML=html; labelsEl.appendChild(e); return e; };
for(const b of BODIES){ b.lbl=mk('lbl',`${b.en}<span class="ar">${b.ar}</span>`); b.lbl.addEventListener('click',()=>clickBody(b.key)); b.lbl.addEventListener('dblclick',()=>focusOn(b.key)); }
const earthLbl=mk('lbl',`Earth<span class="ar">الأرض</span>`); earthLbl.addEventListener('click',()=>setCentre('Earth')); earthLbl.addEventListener('dblclick',()=>focusOn('Earth'));
const shellLbls=[...BODIES.map(b=>({R:b.R, key:b.key, html:`<span dir="rtl">${b.falak}</span><i>sphere ${b.n}<span class="haq"> · ${ORD[INT[b.key].k]} intellect</span></i>`})),
  {R:R_STARS, html:`<span dir="rtl">فلك البروج</span><i>sphere 8<span class="haq"> · 3rd intellect</span> · stars and galaxies</i>`}, {R:R_MUHIT, html:`<span dir="rtl">الفلك المحيط</span><i>sphere 9<span class="haq"> · 2nd intellect</span> · inner face</i>`}, {R:R_MO, html:`<span dir="rtl">الفلك المحيط</span><i>outer face · 10^1000 × farther</i>`}].map(s=>({...s, el:mk('slbl',s.html)}));
const firstLbl=mk('slbl haq',`<span dir="rtl">العقل الأول</span><i>1st intellect · beyond every sphere</i>`);
const sbLbls=SB.map((o,i)=>(o.name && (SB_NAMED.has(o.name) || (o.kind>=4 && FAMOUS.some(f=>o.name.includes(f)))))? {i, el:mk('lmlbl', o.name.replace(/ \(\d{4}\)$/,''))}:null).filter(Boolean);
const dsoLbls=[...galInfo.map((o,i)=>o.name?{pos:new THREE.Vector3(galPos[i*3],galPos[i*3+1],galPos[i*3+2]),el:mk('dlbl',o.name)}:null),
  ...objInfo.map((o,i)=>o.name?{pos:new THREE.Vector3(objPos[i*3],objPos[i*3+1],objPos[i*3+2]),el:mk('dlbl',o.name)}:null)].filter(Boolean);
const lmLbls=lmInfo.map((o,i)=>({pos:lmPos[i], el:mk('lmlbl',o.name.split(' · ')[0])}));
const AUr = au => g(au);
const TICKS=[['Moon','1.3 light-seconds',AUr(.00257)],['Sun','8.3 light-minutes',AUr(1)],['Saturn','1.3 light-hours',AUr(9.54)],
  ['','1 light-year',AUr(LY_AU)],['Proxima Centauri','4.2 light-years',AUr(4.24*LY_AU)],['Pleiades','444 light-years',AUr(444*LY_AU)],
  ['Centre of the Milky Way','26,700 light-years',AUr(26700*LY_AU)],['Large Magellanic Cloud','160,000 light-years',AUr(1.6e5*LY_AU)],
  ['Andromeda','2.5 million light-years',AUr(2.5e6*LY_AU)],['Virgo Cluster','54 million light-years',AUr(5.4e7*LY_AU)],
  ['Coma Cluster',fmtLy(COS.dOfZ(.0231)*1e6*LY_PER_PC),rPc(COS.dOfZ(.0231)*1e6)],['3C 273',fmtLy(COS.dOfZ(.158)*1e6*LY_PER_PC),rPc(COS.dOfZ(.158)*1e6)],
  ['Redshift 1',fmtLy(COS.dOfZ(1)*1e6*LY_PER_PC),rPc(COS.dOfZ(1)*1e6)],['GN-z11',fmtLy(COS.dOfZ(10.6)*1e6*LY_PER_PC),rPc(COS.dOfZ(10.6)*1e6)],
  ['Microwave background',fmtLy(Math.pow(10,U.cos.cmb)*LY_PER_PC),R_CMB],['Edge of the observable universe',fmtLy(Math.pow(10,U.cos.edge)*LY_PER_PC),R_EDGE],
  ['al-Muhit, inner face','beyond all observation',R_MI],['al-Muhit, outer face','10^1000 × the observable universe on this scale',R_MO]]
  .map(([a,b,r])=>({r, el:mk('rt',`${a?`<b>${a}</b> · `:''}${b}`)}));
const rulerLine=document.getElementById('ruler-line');
const elemLbls=ELEMENTS.map(e=>({R:e.R, el:mk('slbl',`${e.ar}<i>${e.tr}</i>`)}));
for(const z of zodLabels) z.el=mk('zlbl',z.html);
for(const s of signLabels) s.el=mk('zlbl',s.html);
const starLbls=SKY.names.map(([i,name])=>({pos:new THREE.Vector3(sDir[i*3],sDir[i*3+1],sDir[i*3+2]).multiplyScalar(sRad[i]), el:mk('stlbl',name)}));
const V=new THREE.Vector3(), W=new THREE.Vector3(), EW=new THREE.Vector3();
let W_=0,H_=0;
function place(el, world, show=true){
  let vis=show && (state.intro===null || el._introOK===true), x=0, y=0;
  if(vis){ V.copy(world).project(camera);
    if(V.z>1 || V.z<-1 || Math.abs(V.x)>1.1 || Math.abs(V.y)>1.1) vis=false; else { x=Math.round((V.x+1)/2*W_*2)/2; y=Math.round((1-V.y)/2*H_*2)/2; } }
  if(vis!==el._v){ el.style.display=vis?'':'none'; el._v=vis; }
  if(vis && (x!==el._x || y!==el._y)){ el.style.transform=`translate3d(${x}px,${y}px,0)`; el._x=x; el._y=y; }
}

// ---------- telescope ----------
const scope=document.getElementById('scope'), sc=scope.getContext('2d');
const FLAT={Jupiter:.0649, Saturn:.098};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function skyBasis(los){ let n=[-los[2]*los[0], -los[2]*los[1], 1-los[2]*los[2]]; const ln=Math.hypot(...n); n=n.map(c=>c/ln);
  return {e:[n[1]*los[2]-n[2]*los[1], n[2]*los[0]-n[0]*los[2], n[0]*los[1]-n[1]*los[0]], n}; }
function drawScope(t, b, il){
  const W=scope.width, c=W/2; sc.clearRect(0,0,W,W);
  sc.save(); sc.beginPath(); sc.arc(c,c,c-1,0,2*Math.PI); sc.clip();
  const bg=sc.createRadialGradient(c,c,0,c,c,c); bg.addColorStop(0,'#070a18'); bg.addColorStop(1,'#010208'); sc.fillStyle=bg; sc.fillRect(0,0,W,W);
  const geo=A.GeoVector(b.key,t,true); const dist=geo.Length(); const los=[geo.x/dist,geo.y/dist,geo.z/dist];
  const {e,n}=skyBasis(los);
  const fov = (b.key==='Moon'||b.key==='Sun') ? 2400 : (b.key==='Jupiter' ? 1100 : 90);
  document.getElementById('scope-fov').textContent = fov>=600? `field ${Math.round(fov/60)}′` : `field ${fov}″`;
  const pxAs = W/fov, angD = 2*Math.atan(b.km/(dist*AU_KM))/DEG*3600, rpx = Math.max(1.5, angD/2*pxAs);
  const P=v=>[c - dot(v,e)/DEG*3600*pxAs, c - dot(v,n)/DEG*3600*pxAs];
  for(let i=0;i<NS;i++){ const raw=SKY.s[i]; const v=radec(raw[0],raw[1]); if(dot(v,los)<Math.cos(fov/3600*DEG)) continue;
    const [x,y]=P(v); sc.fillStyle='rgba(225,225,255,.9)'; sc.globalAlpha=Math.min(1,(7-raw[2])/5); sc.beginPath(); sc.arc(x,y,Math.max(.8,(7-raw[2])*.6),0,6.3); sc.fill(); }
  sc.globalAlpha=1;
  if(b.key==='Jupiter'){ const jm=A.JupiterMoons(A.MakeTime(t.ut-dist/C_AU_DAY));
    for(const [nm,mv] of Object.entries(jm)){ const off=[mv.x,mv.y,mv.z]; const x=c-dot(off,e)/dist/DEG*3600*pxAs, y=c-dot(off,n)/dist/DEG*3600*pxAs;
      if(dot(off,los)>0 && Math.hypot(x-c,y-c)<rpx) continue;
      sc.fillStyle='#efe7d2'; sc.beginPath(); sc.arc(x,y,2.6,0,6.3); sc.fill();
      sc.fillStyle='rgba(200,190,170,.8)'; sc.font='18px "Alegreya Sans",sans-serif'; sc.fillText(nm[0].toUpperCase()+nm.slice(1),x+5,y-7); } }
  const sun=A.GeoVector('Sun',t,true); const toSun=[sun.x-geo.x,sun.y-geo.y,sun.z-geo.z];
  const ang=Math.atan2(-dot(toSun,n), -dot(toSun,e));
  const flat=FLAT[b.key]||0; let poleAng=0;
  if(POLE[b.key]){ const pv=radec(...POLE[b.key]); poleAng=Math.atan2(-dot(pv,n),-dot(pv,e)); }
  const drawRings=front=>{ if(b.key!=='Saturn') return; const tilt=Math.abs(il.ring_tilt)*DEG;
    sc.save(); sc.translate(c,c); sc.rotate(poleAng+Math.PI/2);
    for(const [rr,al,lw] of [[2.2,.75,rpx*.13],[2.08,.55,rpx*.1],[1.85,.9,rpx*.3],[1.6,.6,rpx*.15],[1.35,.25,rpx*.18]]){
      sc.strokeStyle=`rgba(230,212,160,${al})`; sc.lineWidth=Math.max(1,lw);
      sc.beginPath(); sc.ellipse(0,0,rpx*rr,Math.max(.6,rpx*rr*Math.sin(tilt)),0, front?0:Math.PI, front?Math.PI:2*Math.PI); sc.stroke(); }
    sc.restore(); };
  drawRings(false);
  sc.save(); sc.translate(c,c);
  if(flat){ sc.rotate(poleAng); sc.scale(1-flat,1); }
  if(b.key==='Sun'){ const gr=sc.createRadialGradient(0,0,0,0,0,rpx); gr.addColorStop(0,'#fff8e2'); gr.addColorStop(.85,'#f6c46e'); gr.addColorStop(1,'#d98c3a'); sc.fillStyle=gr; sc.beginPath(); sc.arc(0,0,rpx,0,6.3); sc.fill(); }
  else {
    sc.fillStyle='#0b0b10'; sc.beginPath(); sc.arc(0,0,rpx,0,2*Math.PI); sc.fill();
    sc.rotate(flat ? ang-poleAng : ang);
    const k=-Math.cos(il.phase_angle*DEG);
    const gr=sc.createLinearGradient(-rpx,0,rpx,0); const cc=b.col.map(v=>Math.round(v*255)).join(',');
    gr.addColorStop(0,`rgba(${cc},.85)`); gr.addColorStop(1,`rgb(${cc})`); sc.fillStyle=gr;
    sc.beginPath(); for(let s=-90;s<=90;s+=3){ const a=s*DEG; sc.lineTo(rpx*Math.cos(a), rpx*Math.sin(a)); }
    for(let s=90;s>=-90;s-=3){ const a=s*DEG; sc.lineTo(k*rpx*Math.cos(a), rpx*Math.sin(a)); } sc.closePath(); sc.fill();
  }
  sc.restore();
  drawRings(true);
  if(b.key==='Sun'){ const m=A.GeoVector('Moon',t,true); const md=m.Length(); const [x,y]=P([m.x/md,m.y/md,m.z/md]); const mr=Math.atan(1737.4/(md*AU_KM))/DEG*3600*pxAs;
    sc.fillStyle='#050508'; sc.beginPath(); sc.arc(x,y,mr,0,6.3); sc.fill(); }
  sc.restore();
  sc.strokeStyle='rgba(207,168,94,.35)'; sc.lineWidth=1; sc.beginPath(); sc.arc(c,c,c-2,0,6.3); sc.stroke();
  sc.beginPath(); sc.moveTo(c,8); sc.lineTo(c,22); sc.moveTo(c,W-8); sc.lineTo(c,W-22); sc.moveTo(8,c); sc.lineTo(22,c); sc.moveTo(W-8,c); sc.lineTo(W-22,c); sc.stroke();
}

// ---------- readouts ----------
const fmtRA=h=>{ const H=Math.floor(h), m=(h-H)*60; return `${String(H).padStart(2,'0')}h ${m.toFixed(1).padStart(4,'0')}m`; };
const fmtDec=d=>{ const s=d<0?'−':'+'; d=Math.abs(d); const D=Math.floor(d); return `${s}${D}° ${Math.round((d-D)*60)}′`; };
const fmtAs=a=> a>=120? `${(a/60).toFixed(1)}′` : `${a.toFixed(1)}″`;
function readouts(t){
  const b=BMAP[state.sel], il=A.Illumination(b.key,t), dist=pos[b.key].d;
  const eq=A.EquatorFromVector(A.GeoVector(b.key,t,true)), con=A.Constellation(eq.ra,eq.dec);
  const angD=2*Math.atan(b.km/(dist*AU_KM))/DEG*3600, lt=dist*AU_KM/299792.458;
  const e1=A.Ecliptic(A.GeoVector(b.key,A.MakeTime(t.ut-.5),true)).elon, e2=A.Ecliptic(A.GeoVector(b.key,A.MakeTime(t.ut+.5),true)).elon;
  let dl=e2-e1; if(dl>180) dl-=360; if(dl<-180) dl+=360;
  const rows=[['Sky position',`${fmtRA(eq.ra)}  ${fmtDec(eq.dec)}`],['In the figure of',con.name],
    ['Distance', dist<0.01? `${Math.round(dist*AU_KM).toLocaleString()} km` : `${dist.toFixed(3)} AU`],
    ['Light time', lt<60? `${lt.toFixed(2)} s` : `${(lt/60).toFixed(1)} min`],['Radar echo', lt<60? `${(2*lt).toFixed(2)} s` : `${(2*lt/60).toFixed(1)} min`],['Apparent size', fmtAs(angD)]];
  if(b.key!=='Sun') rows.push(['Lit fraction',`${(il.phase_fraction*100).toFixed(1)} %`],['Phase angle',`${il.phase_angle.toFixed(1)}°`],['Angle from Sun',`${A.AngleFromSun(b.key,t).toFixed(1)}°`]);
  rows.push(['Brightness',`mag ${il.mag.toFixed(2)}`]);
  rows.push(['Motion', b.key==='Sun'||b.key==='Moon' ? `${dl.toFixed(2)}° / day` : (dl<0? `<span class="pill" style="color:var(--warn)">retrograde</span> ${dl.toFixed(3)}°/d` : `direct ${dl.toFixed(3)}°/d`)]);
  document.getElementById('ro').innerHTML=rows.map(([k,v])=>`<div class="${k==='Sky position'||k==='Motion'||k==='In the figure of'?'wide':''}"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  drawScope(t,b,il);
  const list=BODIES.map(x=>({b:x,d:pos[x.key].d})).sort((p,q)=>p.d-q.d), maxd=Math.max(...list.map(x=>x.d)); const cross=[];
  document.getElementById('order').innerHTML=list.map((x,i)=>{ const cr=x.b.n!==i+1; if(cr) cross.push(x.b.en);
    const w=Math.max(2, Math.log10(1+x.d*400)/Math.log10(1+maxd*400)*100);
    return `<div class="r ${cr?'cross':''}"><span class="nm">${x.b.n}. ${x.b.en}</span><div class="bar" style="width:${w}%"></div><span class="d">${x.d<0.01?(x.d*AU_KM/1000).toFixed(0)+'k km':x.d.toFixed(2)+' AU'}</span></div>`; }).join('');
  document.getElementById('order-note').innerHTML = cross.length
    ? `Today <b>${cross.join(', ')}</b> ${cross.length>1?'sit':'sits'} out of sphere order by measured distance (highlighted). In the nested model each keeps its own sphere; the warp carries the difference.`
    : `Today the measured distances happen to follow the sphere order.`;
  const turn=turning(sightLine), ratio=turn*3600/LIMB_DEFL;
  const lp=[['Path turns through',`${turn.toFixed(1)}°`],['Sun’s real bending at its edge',`${LIMB_DEFL}″`]];
  if(state.mech==='lens') lp.push(['Mass needed by lensing',`≥ ${ratio>=1e3? ratio.toExponential(1).replace('e+',' × 10^') : ratio.toFixed(0)} × Sun`]);
  if(state.mech==='medium') lp.push(['Colour split shown','red, green, blue']);
  document.getElementById('lp').innerHTML=lp.map(([k,v])=>`<div class="wide"><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

// ---------- mechanisms ----------
const LAWS=[['Light moves at c in vacuum','y','y','p'],['Energy and momentum conserved','y','y','y'],['Planet motions as measured','y','n','y'],
  ['Same path for every colour','y','y','n'],['Radar and signal timings','y','n','n'],['Telescope images (phases, sizes)','y','n','p']];
const MECH_TEXT={
  coord:`Spacetime is left exactly as it is. The nested spheres are a <em>map</em> of it, the way a Mercator map shows a straight great-circle flight as a curve. Physical laws do not depend on the map (general covariance), so every law and every measurement survives. The cost: depth on this map is rank, not ruler distance, and the map reshapes itself every moment as the planets move.`,
  lens:`Mass really does curve spacetime and bend light. The Sun bends starlight by only 1.75″ at its edge, measured since 1919 and now to 0.01 % precision. To bend paths this much, the bodies would need vastly more mass. That mass would wreck every planetary orbit and add huge signal delays, which radar does not see.`,
  medium:`A material whose refractive index varies through space can steer light along any chosen path. Laboratories do this in "invisibility cloak" experiments. This is the closest real phenomenon to a crystalline sphere. But every known medium bends colours differently and slows signals by frequency. Radio, radar and visible light would disagree, and they do not.`,
};
function setMech(m){ state.mech=m; document.getElementById('mech-text').innerHTML=MECH_TEXT[m];
  const col={coord:1,lens:2,medium:3}[m], sym={y:'✓',n:'✗',p:'~'};
  document.getElementById('laws').innerHTML=LAWS.map(r=>`<tr><td>${r[0]}</td>${[1,2,3].map(j=>`<td class="v ${r[j]}" style="${j===col?'background:rgba(207,168,94,.12)':''}">${sym[r[j]]}</td>`).join('')}</tr>`).join('');
  sunGlow.material.color.set(m==='lens'?0xffb070:0xffd9a0); }
document.querySelectorAll('input[name=mech]').forEach(r=>r.addEventListener('change',()=>setMech(r.value)));
setMech('coord');

// ---------- hudud ladder ----------
const ladder=document.getElementById('ladder');
ladder.innerHTML=INTELLECTS.map(i=>`<button data-k="${i.key||''}" data-i="${i.k}"><span class="k">${i.k}</span><span class="a">${i.ar}<small>${i.tr}</small></span><span class="s"><b>${i.hadd}</b>${i.sphere}</span></button>`).join('');
ladder.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{ const k=btn.dataset.k; if(BMAP[k]){ select(k); focusOn(k); } else showIntellect(+btn.dataset.i); });
function hadHTML(I){ return `<div><span class="sublbl">Intellect · ${ORD[I.k]}</span><span class="ar">${I.ar}</span><span class="tr2">${I.tr}</span></div><div><span class="sublbl">Ḥadd</span><span class="ar">${I.hadd}</span><span class="tr2">${I.htr}</span></div>`; }
function showIntellect(k){ const I=INTELLECTS[k-1]; toast(`${ORD[k]} intellect · ${I.tr} · ${I.htr} — ${I.key? (HNOTE[I.key]||I.sphere) : 'Beyond every sphere; the source from which the others emanate.'}`, 6000);
  ladder.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current', +b.dataset.i===k)); }

// ---------- selection, centre, focus ----------
const toastEl=document.getElementById('toast'); let toastT=0;
function toast(msg, ms=3500){ toastEl.textContent=msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove('on'), ms); }
function select(key){ state.sel=key; document.getElementById('right').classList.remove('min'); if(window.__blip) window.__blip(); const b=BMAP[key], I=INT[key];
  document.getElementById('b-name').textContent=b.en; document.getElementById('b-ar').textContent=b.ar;
  document.getElementById('b-rank').textContent=`Sphere ${b.n} of 9 · ${b.falak} · ${b.tr}`;
  document.getElementById('b-hadd').innerHTML=hadHTML(I);
  document.getElementById('b-hnote').textContent=HNOTE[key]||'';
  BODIES.forEach(x=>x.lbl.classList.toggle('sel',x.key===key));
  planetShells.forEach(s=>s.material.uniforms.uHi.value = s.userData.key===key?1:0);
  ladder.querySelectorAll('button').forEach(bt=>bt.setAttribute('aria-current', bt.dataset.k===key));
  readoutDue=0; }
let prevFrame=true, prevRate=null;
function setCentre(which){
  const sun = which==='Sun'; if((state.cTarget===1)===sun) return;
  state.cTarget = sun?1:0;
  $('c-earth').setAttribute('aria-pressed',!sun); $('c-sun').setAttribute('aria-pressed',sun);
  if(sun){ prevFrame=state.earthFixed; setFrame(false); if(state.uTarget>.5) setU(0); if(state.rate<7){ prevRate=state.rate; setRate(7); } state.focus=null; state.zoomGoal=null; }
  else { setFrame(prevFrame); if(prevRate!==null){ setRate(prevRate); prevRate=null; } state.focus=null; }
  $('centre-note').innerHTML = sun
    ? 'The origin has moved to the Sun, and the spheres switched to flexing so every orbit shows as its true ellipse. <b>Only the viewpoint changed</b>: every sky position, phase and timing is identical.'
    : 'Earth sits still at the centre. Click the Sun to move the origin there.';
  toast(sun ? 'The Sun is now the centre. Everything else revolves around it; no measurement changed.' : 'Earth is the centre again.');
  earthLbl.classList.toggle('ctr',!sun); BMAP.Sun.lbl.classList.toggle('ctr',sun);
}
function clickBody(key){ select(key); if(key==='Sun') setCentre('Sun'); }
function bodyWorld(key, out){ if(key==='Earth') return earth.getWorldPosition(out); return BMAP[key].mesh.getWorldPosition(out); }
function focusOn(key){ fxFor(key==='Earth'?4:2); state.focus=key; const size = key==='Earth' ? RE*earth.scale.x : BMAP[key].size*(key==='Saturn'?2.4:1);
  state.zoomGoal=Math.max(.35, size*7); if(state.skyView) toggleSky();
  // approach from the sunlit side
  const bw=bodyWorld(key,new THREE.Vector3()), sw=BMAP.Sun.mesh.getWorldPosition(new THREE.Vector3());
  const toSun = key==='Sun' ? new THREE.Vector3() : sw.sub(bw).normalize();
  const cur = camera.position.clone().sub(controls.target).normalize();
  state.camDir = toSun.multiplyScalar(.85).add(cur.multiplyScalar(.6)).add(new THREE.Vector3(0,.25,0)).normalize(); }

const ray=new THREE.Raycaster(), mouse=new THREE.Vector2(); let downAt=null;
function pick(e){ mouse.set(e.clientX/W_*2-1, -(e.clientY/H_)*2+1); ray.setFromCamera(mouse,camera);
  let best=null,bd=1e9;
  for(const b of BODIES){ b.mesh.getWorldPosition(W); const dd=camera.position.distanceTo(W); const d=ray.ray.distanceToPoint(W);
    const tol=Math.max(b.size*1.3, dd*.025); if(d<tol && dd<bd){bd=dd;best=b.key;} }
  earth.getWorldPosition(W); { const dd=camera.position.distanceTo(W); if(ray.ray.distanceToPoint(W)<Math.max(RE*earth.scale.x*1.1, dd*.02) && dd<bd) best='Earth'; }
  return best; }
function pickFar(e){
  const M=prec.matrixWorld, px=e.clientX, py=e.clientY; let best=null, bd=11*11;
  const test=(x,y,z,kind,i)=>{ V.set(x,y,z).applyMatrix4(M).project(camera); if(V.z>1||V.z<-1) return;
    const sx=(V.x+1)/2*W_-px, sy=(1-V.y)/2*H_-py, d2=sx*sx+sy*sy; if(d2<bd){ bd=d2; best=[kind,i]; } };
  if(landmarks.visible) lmPos.forEach((v,i)=>test(v.x,v.y,v.z,'lm',i));
  if(objects.visible) for(let i=0;i<NO;i++) test(objPos[i*3],objPos[i*3+1],objPos[i*3+2],'obj',i);
  if(smallBodies.visible) for(let i=0;i<NSB;i++){ const o=SB[i]; if(o.kind===2||o.kind===3) continue; test(sbPos[i*3],sbPos[i*3+1],sbPos[i*3+2],'sb',i); }
  if(galaxies.visible) for(let i=0;i<NG;i++) test(galPos[i*3],galPos[i*3+1],galPos[i*3+2],'gal',i);
  for(let i=0;i<NS;i++){ if(sMag[i]>6) continue; const r=sRad[i]; test(sDir[i*3]*r,sDir[i*3+1]*r,sDir[i*3+2]*r,'star',i); }
  if(!best) return false;
  const [kind,i]=best; let msg='';
  const light = z => z>0.0035 ? ` Its light left ${COS.lbOfZ(z)>=1? COS.lbOfZ(z).toFixed(1)+' billion':Math.round(COS.lbOfZ(z)*1000)+' million'} years ago (redshift ${z.toFixed(z<.1?4:2)}).` : '';
  if(kind==='star'){ const st=SKY.s[i], nm=(SKY.names.find(x=>x[0]===i)||[])[1]; const con=A.Constellation(st[0]/15,st[1]).name;
    msg=`${nm||'Star'} in ${con} · magnitude ${st[2].toFixed(1)} · ${st[4]>0? fmtLy(st[4]*LY_PER_PC)+' away (parallax)' : 'distance not measured; drawn on the inner face of the eighth sphere'}`; }
  if(kind==='gal'){ const o=galInfo[i]; msg=`${o.name||'Galaxy'}${o.t===1?' (group)':''} · ${fmtLy(o.pc*LY_PER_PC)} away today.${light(o.z)}`; }
  if(kind==='obj'){ const o=objInfo[i]; msg=`${o.name||OBJ_KIND[o.t]} · ${OBJ_KIND[o.t]} in the Milky Way · ${fmtLy(o.pc*LY_PER_PC)} away`; }
  if(kind==='sb'){ const o=SB[i], r=sbR[i], gd=Math.hypot(sbHel[i*3]-EH[0],sbHel[i*3+1]-EH[1],sbHel[i*3+2]-EH[2]);
    const typ = o.kind===5?'interstellar object': o.kind===4?'comet': o.kind===1?'dwarf planet':'asteroid';
    let extra=''; if(o.kind>=4){ const d=new Date((o.Tp-2440587.5)*864e5); extra=` · closest to the Sun ${d.toISOString().slice(0,10)} at ${o.q.toFixed(2)} AU`; }
    msg=`${o.name||typ} · ${typ} · ${r.toFixed(2)} AU from the Sun, ${gd.toFixed(2)} AU from Earth${extra}`; }
  if(kind==='lm'){ const o=lmInfo[i]; msg=`${o.name} · ${fmtLy(o.pc*LY_PER_PC)} away today.${light(o.z)}`; }
  toast(msg, 7000); return true; }
canvas.addEventListener('pointerdown',e=>downAt=[e.clientX,e.clientY]);
canvas.addEventListener('pointerup',e=>{ if(!downAt||Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>5) return; const k=pick(e);
  if(k==='Earth') setCentre('Earth'); else if(k) clickBody(k); else pickFar(e); });
canvas.addEventListener('dblclick',e=>{ const k=pick(e); if(k) focusOn(k); else { state.focus=null; state.zoomGoal=null; } });

// ---------- controls wiring ----------
const $=id=>document.getElementById(id);
function setU(v){ state.uTarget=v; $('morph').value=v; $('g-onion').setAttribute('aria-pressed',v>.5); $('g-true').setAttribute('aria-pressed',v<=.5); }
$('g-onion').onclick=()=>setU(1); $('g-true').onclick=()=>setU(0);
$('morph').oninput=e=>{ state.uTarget=+e.target.value; state.u=state.uTarget; $('g-onion').setAttribute('aria-pressed',state.u>.5); $('g-true').setAttribute('aria-pressed',state.u<=.5); };
$('c-earth').onclick=()=>setCentre('Earth'); $('c-sun').onclick=()=>{ select('Sun'); setCentre('Sun'); };
function setFrame(ef){ state.earthFixed=ef; $('f-earth').setAttribute('aria-pressed',ef); $('f-star').setAttribute('aria-pressed',!ef);
  $('frame-note').textContent = ef ? 'The Muhit turns once per sidereal day (23 h 56 m) and carries every sphere with it.' : 'The stars are held still for viewing. The Earth is drawn turning instead; the sky positions are identical.'; }
$('f-earth').onclick=()=>setFrame(true); $('f-star').onclick=()=>setFrame(false);
function toggleSky(){ state.skyView=!state.skyView; $('skyview').setAttribute('aria-pressed',state.skyView);
  $('skyview').textContent=state.skyView?'Back to the outside view':'Stand on Earth and look';
  controls.enabled=!state.skyView; camera.fov=state.skyView?40:50; camera.updateProjectionMatrix();
  if(!state.skyView){ camera.position.copy(HOME); controls.target.set(0,0,0); } else { setCentre('Earth'); state.focus=null; } }
$('skyview').onclick=toggleSky;
canvas.addEventListener('wheel',e=>{ if(!state.skyView) return; camera.fov=Math.max(1,Math.min(90,camera.fov*Math.exp(e.deltaY*.001))); camera.updateProjectionMatrix(); },{passive:true});
const dolly=f=>{ state.camDir=null; if(state.skyView){ camera.fov=Math.max(1,Math.min(90,camera.fov*f)); camera.updateProjectionMatrix(); return; }
  state.zoomGoal=Math.max(controls.minDistance, Math.min(controls.maxDistance, camera.position.distanceTo(controls.target)*f)); };
$('z-reset').onclick=()=>{ if(state.skyView) toggleSky(); state.focus=null; state.zoomGoal=null; camera.position.copy(HOME); controls.target.set(0,0,0); };
const layer=(id,fn)=>{ const el=$(id); const go=()=>fn(el.checked); el.addEventListener('change',go); go(); };
layer('l-shells',v=>{ planetShells.forEach(s=>s.visible=v); starShell.visible=v; state.showShells=v; });
layer('l-names',v=>state.showNames=v);
layer('l-trails',v=>state.showTrails=v);
layer('l-light',v=>state.showLight=v);
layer('l-fabric',v=>fabric.visible=v);
layer('l-milky',v=>milky.visible=v);
layer('l-zod',v=>{zodGroup.visible=v; state.showZod=v;});
layer('l-signs',v=>{signGroup.visible=v; state.showSigns=v;});
layer('l-stars',v=>state.showStarNames=v);
layer('l-elem',v=>{elemShells.forEach(m=>m.visible=v); state.showElem=v;});
layer('l-outer',v=>OUTER.forEach(o=>o.mesh.visible=v));
layer('l-glow',v=>bloom.enabled=v);
layer('l-gal',v=>{ galaxies.visible=v; objects.visible=v; });
layer('l-deep',v=>deep.visible=v);
layer('l-lm',v=>{ landmarks.visible=v; state.showLm=v; });
layer('l-dso',v=>state.showDso=v);
layer('l-ruler',v=>{ state.showRuler=v; rulerLine.style.display=v?'':'none'; });
layer('l-cut',v=>state.cut=v);
layer('l-moons',v=>moonGroups.forEach(g0=>g0.visible=v));
layer('l-sb',v=>{ smallBodies.visible=v; tails.visible=v; cometOrbits.forEach(c=>c.ln.visible=v); });
layer('l-sbn',v=>state.showSb=v);
const kfmt=k=>k<=0?'off':`× ${Math.round(k).toLocaleString()}`;
$('ab').oninput=e=>{ const v=+e.target.value; state.ka=v<=0?0:Math.pow(10,v); $('ab-o').textContent=kfmt(state.ka); };
$('px').oninput=e=>{ const v=+e.target.value; state.kp=v<=0?0:Math.pow(10,v); $('px-o').textContent=kfmt(state.kp); };
$('t-play').onclick=()=>{ state.playing=!state.playing; $('t-play').textContent=state.playing?'Pause':'Play'; };
$('t-rev').onclick=()=>{ state.dir*=-1; $('t-rev').textContent=state.dir>0?'◀◀':'▶▶'; $('t-rev').title=state.dir>0?'Reverse time':'Run time forward'; };
$('t-rate').onchange=e=>{ state.rate=+e.target.value; prevRate=null; };
$('t-now').onclick=()=>{ state.ut=A.MakeTime(new Date()).ut; };
$('t-date').onchange=e=>{ if(e.target.value) state.ut=A.MakeTime(new Date(e.target.value+'T00:00:00Z')).ut; };
function setRate(v){ state.rate=v; const s=$('t-rate'); let best=0; [...s.options].forEach((o,i)=>{ if(Math.abs(Math.log(+o.value/v))<Math.abs(Math.log(+s.options[best].value/v))) best=i; }); s.selectedIndex=best; }
document.querySelectorAll('[data-ev]').forEach(btn=>btn.onclick=()=>{
  const t=A.MakeTime(state.ut); let to=null, sel=null, rate=null;
  switch(btn.dataset.ev){
    case 'vsup': to=A.SearchRelativeLongitude('Venus',180,t); sel='Venus'; rate=1; break;
    case 'vinf': to=A.SearchRelativeLongitude('Venus',0,t); sel='Venus'; rate=1; break;
    case 'mopp': to=A.MakeTime(A.SearchRelativeLongitude('Mars',0,t).ut-40); sel='Mars'; rate=1; break;
    case 'solar': to=A.MakeTime(A.SearchGlobalSolarEclipse(t.date).peak.ut-0.04); sel='Sun'; rate=0.000694444; break;
    case 'lunar': to=A.MakeTime(A.SearchLunarEclipse(t.date).peak.ut-0.08); sel='Moon'; rate=0.000694444; break;
  }
  if(to){ state.ut=to.ut; select(sel); setRate(rate); prevRate=null; state.playing=true; $('t-play').textContent='Pause'; }
});
const VIEWS={planets:30, stars:105, galaxies:165, universe:240, muhit:1550};


$('tab-right').onclick=()=>$('right').classList.toggle('min');

function resize(){ W_=innerWidth; H_=innerHeight; renderer.setPixelRatio(dpr); composer.setPixelRatio(dpr); renderer.setSize(W_,H_,false); composer.setSize(W_,H_);
  camera.aspect=W_/H_; camera.updateProjectionMatrix(); starMat.uniforms.uPx.value=renderer.getPixelRatio(); pointMats.forEach(m=>m.uniforms.uPx.value=renderer.getPixelRatio()); }
addEventListener('resize',resize); resize();

// ---------- loop ----------
const precM=new THREE.Matrix4(), nm3=new THREE.Matrix3(), eInv=new THREE.Quaternion();
let last=performance.now(), readoutDue=0, frame=0, lastGeoKey=''; const perf={acc:0,n:0};
const pad=n=>String(n).padStart(2,'0');
const S=[[1,0,0],[0,0,1],[0,-1,0]], Si=[[1,0,0],[0,0,-1],[0,1,0]];
const mul=(a,b)=>a.map(r=>b[0].map((_,j)=>r[0]*b[0][j]+r[1]*b[1][j]+r[2]*b[2][j]));
function tick(now){
  const dt=Math.min(.1,(now-last)/1000); last=now; frame++; state.time+=dt;
  // keep the frame rate smooth: lower the resolution on slow devices, raise it again when there is headroom
  perf.acc+=dt; perf.n++; if(perf.n>=45){ const ms=perf.acc/perf.n*1000; perf.acc=0; perf.n=0;
    if(ms>21 && dpr>.75){ dpr=Math.max(.75,dpr-.25); resize(); } else if(ms<12 && dpr<DPR_MAX){ dpr=Math.min(DPR_MAX,dpr+.25); resize(); } }
  if(state.playing) state.ut += state.rate*state.dir*dt;
  state.ut=Math.max(-1095000, Math.min(1095000, state.ut));
  const ease=k=>Math.min(1,dt*k);
  state.u += (state.uTarget-state.u)*ease(3); if(Math.abs(state.u-state.uTarget)<1e-3) state.u=state.uTarget;
  state.c += (state.cTarget-state.c)*ease(2.5); if(Math.abs(state.c-state.cTarget)<1e-3) state.c=state.cTarget;
  $('morph-o').textContent = state.u>.98?'spheres':state.u<.02?'measured':`${Math.round(state.u*100)} % spheres`;
  const t=A.MakeTime(state.ut);
  compute(t);
  const geoKey=state.ut+'|'+state.u.toFixed(4)+'|'+state.c.toFixed(4), geoChanged=geoKey!==lastGeoKey; lastGeoKey=geoKey;

  const R=A.Rotation_EQJ_EQD(t).rot;
  const M=mul(mul(S,[[R[0][0],R[1][0],R[2][0]],[R[0][1],R[1][1],R[2][1]],[R[0][2],R[1][2],R[2][2]]]),Si);
  precM.set(M[0][0],M[0][1],M[0][2],0, M[1][0],M[1][1],M[1][2],0, M[2][0],M[2][1],M[2][2],0, 0,0,0,1);
  prec.matrix.copy(precM); prec.matrixWorldNeedsUpdate=true;
  const gast=A.SiderealTime(t)*15*DEG, fe = state.earthFixed ? 1 : 0;
  sky.rotation.y=-gast*fe; earth.rotation.y=gast*(1-fe);
  sky.updateMatrixWorld(true);

  // bodies
  const es=1-.75*state.c*(1-state.u);
  { // the Moon keeps its near side toward Earth
    const mu=pos.Moon.u, x=new THREE.Vector3(-mu[0],-mu[1],-mu[2]), pl=new THREE.Vector3(...radecS(270,66.54)); pl.addScaledVector(x,-pl.dot(x)).normalize();
    BMAP.Moon.mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,pl,new THREE.Vector3().crossVectors(x,pl))); BMAP.Moon.mesh.scale.setScalar(es); }
  for(const b of BODIES){
    b.mesh.position.fromArray(dispBody(b, pos[b.key].p, sunNow, tmp));
    const P=pos[b.key].p; W.set(sunNow[0]-P[0], sunNow[1]-P[1], sunNow[2]-P[2]).normalize();
    b.mesh.material.uniforms.uL.value.copy(W.applyQuaternion(tmpQ.copy(b.mesh.quaternion).invert()));
    b.mesh.material.uniforms.uT.value=state.time;
    b.trailLine.visible=state.showTrails;
    if(state.showTrails && geoChanged && (frame%2===0 || state.rate<0.3)){ updateTrail(b.trail, b.key, b.span, state.ut);
      drawTrail(b.trailLine, b.trail.pts, b.col, (q,o)=>dispBody(b,q.p,q.s,o)); }
  }
  sunGlow.position.copy(BMAP.Sun.mesh.position);
  const eD=dispEarth(sunNow,[0,0,0]);
  earthTrail.line.visible = state.showTrails && state.c>0.02;
  if(earthTrail.line.visible && frame%2===0){ updateTrail(earthTrail.trail,'EarthT',365.25,state.ut);
    drawTrail(earthTrail.line, earthTrail.trail.pts, earthTrail.col.map(x=>x*state.c), (q,o)=>dispEarth(q.s,o)); }
  for(const o of OUTER){ const P=pos[o.key]; dispBody({key:o.key,R:o.R}, P.p, sunNow, tmp); o.mesh.position.fromArray(tmp); }
  // Earth and the spheres centred on it
  W.fromArray(eD).applyMatrix4(prec.matrixWorld); earth.position.copy(W);
  earth.scale.setScalar(es);
  for(const s of [...planetShells, ...elemShells]){ s.position.fromArray(eD); s.material.uniforms.uA.value=s.userData.base*state.u*(s.userData.iv??1); }
  starShell.position.fromArray(eD); starShell.material.uniforms.uA.value=starShell.userData.base*(1-state.c)*(starShell.userData.iv??1);
  { const fa=(1-state.u)*(state.showShells?1:0); const on=fa>.01;
    flexShells.forEach(m=>{ m.visible=on; m.userData.cap.visible=on; m.material.uniforms.uA.value=.7*fa; m.material.uniforms.uHi.value = m.userData.key===state.sel?1:0; });
    if(on && (frame%3===0 || state.rate<.05)) updateFlex(); }
  if(moonGroups[0].visible) updateMoons(t);
  if(smallBodies.visible && (frame%2===0)){ updateSmallBodies(t); if(frame%6===0 && geoChanged) updateCometOrbits(); }
  W.set(sunNow[0],sunNow[1],sunNow[2]).applyMatrix3(nm3.setFromMatrix4(prec.matrixWorld)).normalize();
  earthMat.uniforms.uLv.value.copy(W).transformDirection(camera.matrixWorldInverse); earthMat.uniforms.uT.value=state.time;
  earthMat.uniforms.uL.value.copy(W.applyQuaternion(eInv.copy(earth.quaternion).invert()));
  muhitMats.forEach(m=>m.uniforms.uT.value=state.time); starMat.uniforms.uT.value=state.time;
  { const cd=camera.position.length(); const vis=Math.min(1,Math.max(0,(cd-R_MI)/(R_MI*1.5)));
    MUHIT_STRATA.forEach(m=>{ m.material.uniforms.uIn.value=vis; m.visible=vis>.002; });   // skip the full-screen strata when they are faded out muhitOuter.visible = cd>R_MI*0.9; state.far = cd>420;
    if(state.cut && cd>R_MI*0.97 && !state.skyView){ clipPlane.normal.copy(camera.position).normalize().negate(); clipPlane.constant=0; } else clipPlane.constant=1e9; }

  // light paths
  const showLight=state.showLight && !state.skyView;
  [sightLine,sunLine,chordLine].forEach(l=>l.visible=showLight);
  dispLines.forEach(l=>l.visible=showLight && state.mech==='medium');
  if(showLight){
    const b=BMAP[state.sel], P=pos[state.sel].p, end=dispBody(b,P,sunNow,[0,0,0]);
    setPath(sightLine,[0,0,0],P,eD,end);
    if(state.sel!=='Sun') setPath(sunLine,sunNow,P,dispBody(BMAP.Sun,sunNow,sunNow,[0,0,0]),end); else sunLine.visible=false;
    const ch=chordLine.geometry.attributes.position;
    for(let i=0;i<NP;i++){ const s=i/(NP-1); ch.setXYZ(i,eD[0]+(end[0]-eD[0])*s,eD[1]+(end[1]-eD[1])*s,eD[2]+(end[2]-eD[2])*s); } ch.needsUpdate=true; chordLine.computeLineDistances();
    if(state.mech==='medium'){ const sp=[-.35,0,.35]; dispLines.forEach((l,k)=>setPath(l,[0,0,0],P,eD,end,sp[k]*Math.min(1,pos[state.sel].d))); }
  }
  if(fabric.visible && geoChanged && frame%2===0) drawFabric();
  fabric.material.opacity=.2*(1-.6*state.c);

  // stars: yearly aberration and parallax (magnified)
  const hs=A.HelioState('Earth',t);
  starMat.uniforms.uE.value.set(...toS({x:hs.x,y:hs.y,z:hs.z})); starMat.uniforms.uV.value.set(...toS({x:hs.vx/C_AU_DAY,y:hs.vy/C_AU_DAY,z:hs.vz/C_AU_DAY}));
  starMat.uniforms.uKa.value=state.ka; starMat.uniforms.uKp.value=state.kp;

  // camera: follow focus, ease zoom
  if(state.intro!==null){ introCamera(dt); }
  else if(state.skyView){ earth.getWorldPosition(EW); camera.position.copy(EW); bodyWorld(state.sel,W); camera.lookAt(W); }
  else {
    const goal = state.focus ? bodyWorld(state.focus, W) : W.set(0,0,0);
    const d = goal.clone().sub(controls.target).multiplyScalar(ease(state.focus?5:3));
    controls.target.add(d); camera.position.add(d);
    if(state.zoomGoal!==null){ const off=camera.position.clone().sub(controls.target); const cur=off.length();
      const nxt=cur+(state.zoomGoal-cur)*ease(4); off.normalize();
      if(state.camDir){ off.lerp(state.camDir, ease(3)).normalize(); }
      camera.position.copy(controls.target).add(off.multiplyScalar(nxt));
      if(Math.abs(nxt-state.zoomGoal)<state.zoomGoal*.01){ state.zoomGoal=null; state.camDir=null; } }
    controls.update();
  }
  bloom.strength += ((state.warpT>now?1.2:.55) - bloom.strength)*ease(3);
  { const dt2=camera.position.distanceTo(controls.target), nn=Math.min(6,Math.max(.004,dt2*.0006)); if(Math.abs(nn-camera.near)>camera.near*.15){ camera.near=nn; camera.updateProjectionMatrix(); } }
  if(state.intro!==null) applyIntroVis(t);
  composer.render();

  // labels
  for(const b of BODIES){ b.mesh.getWorldPosition(W); place(b.lbl,W,camera.position.length()<140 || state.focus===b.key); }
  earth.getWorldPosition(EW); W.copy(EW); place(earthLbl, W, !state.skyView && (state.c>.02 || camera.position.distanceTo(EW)<6));
  const dir=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(.42).add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(.91));
  const nameOK=state.showNames && !state.skyView;
  for(const s of shellLbls){ const shellOn = s.R>=R_STARS ? true : (state.u>.5 && state.showShells);
    W.copy(dir).multiplyScalar(s.R*.97); if(s.R<R_STARS) W.add(EW); place(s.el,W,nameOK && shellOn && (s.R>=R_STARS || state.c<.5) && (!state.far || s.R>=R_MI)); }
  W.copy(dir).multiplyScalar(R_MO*1.04); place(firstLbl,W,nameOK);
  const camD=camera.position.length();
  for(const s of dsoLbls){ W.copy(s.pos).applyMatrix4(prec.matrixWorld); place(s.el,W,state.showDso && galaxies.visible && !state.far); }
  for(const s of sbLbls){ W.set(sbPos[s.i*3],sbPos[s.i*3+1],sbPos[s.i*3+2]).applyMatrix4(prec.matrixWorld); place(s.el,W,state.showSb && smallBodies.visible && !state.far && camD<200); }
  for(const s of lmLbls){ W.copy(s.pos).applyMatrix4(prec.matrixWorld); place(s.el,W,state.showLm && !state.skyView && camD>55 && !state.far); }
  { const rd=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(.93).add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(-.36)).normalize();
    const on=state.showRuler && !state.skyView;
    for(const t of TICKS){ W.copy(rd).multiplyScalar(t.r); place(t.el,W,on && (!state.far || t.r>=R_MI)); }
    if(on){ W.copy(rd).multiplyScalar(RE*1.2); V.copy(W).project(camera); const x1=(V.x+1)/2*W_, y1=(1-V.y)/2*H_;
      W.copy(rd).multiplyScalar(R_MO); V.copy(W).project(camera); let x2=(V.x+1)/2*W_, y2=(1-V.y)/2*H_;
      if(V.z>1){ x2=x1+(x1-x2)*-50; y2=y1+(y1-y2)*-50; }
      rulerLine.setAttribute('x1',x1); rulerLine.setAttribute('y1',y1); rulerLine.setAttribute('x2',x2); rulerLine.setAttribute('y2',y2); } }
  for(const s of elemLbls){ W.copy(dir).multiplyScalar(s.R*es).add(EW); place(s.el,W,nameOK && state.showElem); }
  for(const z of zodLabels){ W.copy(z.pos).applyMatrix4(prec.matrixWorld); place(z.el,W,(state.intro!==null || state.showZod) && !state.far); }
  for(const s of signLabels){ W.copy(s.pos).applyMatrix4(sky.matrixWorld); place(s.el,W,state.showSigns && !state.far); }
  for(const s of starLbls){ W.copy(s.pos).applyMatrix4(prec.matrixWorld); place(s.el,W,state.showStarNames); }

  const d=t.date; $('clock-d').textContent=`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  $('clock-s').textContent=`${$('t-rate').selectedOptions[0].text}${state.dir<0?', reversed':''}${state.playing?'':', paused'}`;
  if(frame%6===0) uiFrame();
  if(now>readoutDue && state.intro===null && (!$('right').classList.contains('min') || activePane==='light')){ readouts(t); readoutDue=now+250; }
  requestAnimationFrame(tick);
}

// ================= interface: drawers, splash, journey, warp, keys, sound, Haqiqat =================
const body=document.body, warpEl=document.getElementById('warp');
// --- Haqiqat layer: hidden unless the viewer turns it on (remembered per device) or opens the page at #haqiqat
let haqOn=false; try{ haqOn = localStorage.getItem('falak-haq')==='1'; }catch(e){}
if(location.hash==='#haqiqat') haqOn=true;
function applyHaq(v){ haqOn=v; body.classList.toggle('haq-on',v); $('haq-toggle').checked=v; try{ localStorage.setItem('falak-haq', v?'1':'0'); }catch(e){}
  if(!v && activePane==='haq') openPane(null); }
$('haq-toggle').addEventListener('change',e=>applyHaq(e.target.checked));
// --- drawers
let activePane=null;
function openPane(p){ activePane = (p===activePane)? null : p;
  document.querySelectorAll('.rail [data-pane]').forEach(b=>b.setAttribute('aria-pressed', b.dataset.pane===activePane));
  document.querySelectorAll('#left .pane').forEach(s=>s.classList.toggle('on', s.dataset.pane===activePane));
  $('left').classList.toggle('open', !!activePane); }
document.querySelectorAll('.rail [data-pane]').forEach(b=>b.onclick=()=>openPane(b.dataset.pane));
$('card-x').onclick=()=>$('right').classList.add('min');
$('hud').onclick=()=>body.classList.toggle('hud-off');
// --- warp effect
function fxFor(ratioMin){ return ratioMin; }
function warpFx(){ warpEl.classList.remove('on'); void warpEl.offsetWidth; warpEl.classList.add('on'); state.warpT=performance.now()+1300;
  clearTimeout(warpFx.t); warpFx.t=setTimeout(()=>warpEl.classList.remove('on'),1300); if(window.__whoosh) window.__whoosh(); }
function warpTo(d){ if(state.skyView) toggleSky(); state.focus=null; state.camDir=null;
  const cur=camera.position.distanceTo(controls.target); if(Math.max(d/cur,cur/d)>2.2) warpFx(); state.zoomGoal=d; }
const _focusOn=focusOn;
focusOn = function(key){ const cur=camera.position.distanceTo(controls.target); _focusOn(key); if(state.zoomGoal && Math.max(state.zoomGoal/cur,cur/state.zoomGoal)>3) warpFx(); };
const VIEWS2={planets:30, stars:100, galaxies:165, universe:240, muhit:VIEW_MUHIT};
function goView(v){ if(v==='earth'){ setCentre('Earth'); focusOn('Earth'); } else warpTo(VIEWS2[v]); }
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>goView(b.dataset.view));
// --- altitude readout + active scale
function fmtDist(au){ if(au<0.01) return `${Math.round(au*AU_KM).toLocaleString()} km`; if(au<2000) return `${au.toFixed(au<10?2:0)} AU`; return fmtLy(au/LY_AU); }
function uiFrame(){
  const cd=camera.position.length(); let txt;
  if(state.skyView) txt='Standing on Earth';
  else if(cd>R_MO) txt='Outside al-Falak al-Muhit';
  else if(cd>R_MI) txt='Inside the thickness of al-Muhit';
  else if(cd<RE) txt='Inside Earth';
  else txt=`Viewpoint ≈ ${fmtDist(GB*(Math.exp((cd-RE)/GA)-1))} out`;
  $('alt').textContent=txt;
  const v = (state.focus==='Earth'||cd<6)?'earth': cd<62?'planets': cd<130?'stars': cd<200?'galaxies': cd<700?'universe':'muhit';
  document.querySelectorAll('.warpbar [data-view]').forEach(b=>b.setAttribute('aria-current', b.dataset.view===v));
  if(journey.on) journeyTick();
  gaugeFrame();
}
// --- journey
const STOPS=[
  {t:'Outside everything', b:'This is al-Falak al-Muhit seen from beyond its outer face. Watch the scale along the bottom: its thickness spans a thousand powers of ten past the edge of the observable universe, the bright speck at its heart.', go:()=>{ setCentre('Earth'); setU(1); warpTo(VIEW_MUHIT); }},
  {t:'The edge of what we can see', b:'46.3 billion light-years out lies the particle horizon, the farthest distance from which light has had time to reach us. Just inside it glows the cosmic microwave background. Beyond it, nothing can ever be observed.', go:()=>warpTo(235)},
  {t:'Ten thousand real galaxies', b:'Every point is a catalogued galaxy at its measured distance and true direction. Click any one to see how long ago its light set out.', go:()=>warpTo(160)},
  {t:'Our galaxy and its stars', b:'The Milky Way, then 8,920 naked-eye stars placed by parallax. The constellation figures stretch into depth: their stars only look close together from Earth.', go:()=>warpTo(98)},
  {t:'Jupiter and its moons', b:'Io, Europa, Ganymede and Callisto sit exactly where they are tonight. Beyond Mars, the asteroid belt and Jupiter’s Trojans follow their orbits.', go:()=>{ select('Jupiter'); focusOn('Jupiter'); }},
  {t:'Saturn on the seventh sphere', b:'Its rings tilt exactly as telescopes see them today, and its path shows the yearly backward loop.', go:()=>{ select('Saturn'); focusOn('Saturn'); }},
  {t:'Venus keeps its sphere', b:'Venus shows phases like the Moon. On the nested map, the gold curve is the path its light takes to reach Earth, and the telescope view on the card matches the sky.', go:()=>{ select('Venus'); focusOn('Venus'); }},
  {t:'The spheres flex, the orbits stay true', b:'With the Sun at the centre, the flexing spheres still hold each planet while every orbit, Earth’s included, is its true ellipse. Real comets swing through on their measured paths.', go:()=>{ select('Sun'); setCentre('Sun'); setU(0); warpTo(46); }},
  {t:'Home', b:'Back to a still Earth at the centre of nine turning spheres. Scroll to dive through the powers of ten, and click anything to learn what it is.', go:()=>{ setCentre('Earth'); setU(1); select('Moon'); focusOn('Earth'); }},
];
const journey={on:false,i:0,t0:0,dur:9000};
function journeyGo(i){ journey.i=Math.max(0,Math.min(STOPS.length-1,i)); journey.t0=performance.now(); const s=STOPS[journey.i];
  $('cap-t').textContent=s.t; $('cap-b').textContent=s.b; $('cap-n').textContent=`${journey.i+1} of ${STOPS.length}`;
  $('cap-next').textContent = journey.i===STOPS.length-1 ? 'Finish' : 'Next'; s.go(); }
function journeyStart(){ journey.on=true; $('caption').classList.add('on'); controls.autoRotate=true; controls.autoRotateSpeed=.35; openPane(null); $('journey').textContent='Stop journey'; journeyGo(0); }
function journeyStop(){ journey.on=false; $('caption').classList.remove('on'); controls.autoRotate=false; $('journey').textContent='Journey'; }
function journeyTick(){ const f=(performance.now()-journey.t0)/journey.dur; $('cap-p').style.width=Math.min(100,f*100)+'%';
  if(f>=1){ if(journey.i<STOPS.length-1) journeyGo(journey.i+1); else journeyStop(); } }
$('cap-next').onclick=()=>{ if(journey.i<STOPS.length-1) journeyGo(journey.i+1); else journeyStop(); };
$('cap-prev').onclick=()=>journeyGo(journey.i-1);
$('cap-x').onclick=journeyStop;
$('journey').onclick=()=> journey.on? journeyStop() : journeyStart();
canvas.addEventListener('pointerdown',()=>{ if(journey.on){ journey.t0=performance.now(); } controls.autoRotate=false; });
// --- splash
function closeSplash(){ enterModel(); controls.autoRotate=false; if(window.__startAudio && $('snd').getAttribute('aria-pressed')==='true') window.__startAudio(); }

// --- keyboard
const RATES=[...$('t-rate').options].map(o=>+o.value);
addEventListener('keydown',e=>{
  if(e.target.closest('input,select,textarea')) return;
  const k=e.key;
  if(state.intro!==null){ if(k==='Escape'||k==='Enter'){ e.preventDefault(); enterModel(); } return; }
  if(k>='1'&&k<='6'){ goView(['earth','planets','stars','galaxies','universe','muhit'][+k-1]); }
  else if(k===' '){ e.preventDefault(); $('t-play').click(); }
  else if(k===']'||k==='['){ const i=Math.max(0,Math.min(RATES.length-1,$('t-rate').selectedIndex+(k===']'?1:-1))); $('t-rate').selectedIndex=i; state.rate=RATES[i]; }
  else if(k==='s'||k==='S'){ select('Sun'); setCentre('Sun'); }
  else if(k==='e'||k==='E'){ setCentre('Earth'); }
  else if(k==='g'||k==='G'){ setU(state.uTarget>.5?0:1); }
  else if(k==='j'||k==='J'){ journey.on? journeyStop() : journeyStart(); }
  else if(k==='h'||k==='H'){ body.classList.toggle('hud-off'); }
  else if(k==='+'||k==='='){ dolly(.6); } else if(k==='-'){ dolly(1.65); }
  else if(k==='Escape'){ if(journey.on) journeyStop(); else if(activePane) openPane(null); else body.classList.remove('hud-off'); }
});
// --- sound: a low drone and a whoosh on warps (starts only after the viewer turns it on)
let AC=null, master=null;
function initAudio(){ if(AC) return; try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  master=AC.createGain(); master.gain.value=0; master.connect(AC.destination);
  const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=420; lp.connect(master);
  for(const [f,g] of [[55,.5],[82.41,.32],[110.5,.22],[164.8,.08]]){ const o=AC.createOscillator(); o.type='sine'; o.frequency.value=f; const gg=AC.createGain(); gg.gain.value=g;
    const l=AC.createOscillator(); l.frequency.value=.05+Math.random()*.1; const lg=AC.createGain(); lg.gain.value=g*.4; l.connect(lg); lg.connect(gg.gain); l.start(); o.connect(gg); gg.connect(lp); o.start(); }
  window.__whoosh=()=>{ if(!AC||master.gain.value<.001) return; const n=AC.createBufferSource(), len=AC.sampleRate*1.4, buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1; n.buffer=buf; const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1.4;
    bp.frequency.setValueAtTime(180,AC.currentTime); bp.frequency.exponentialRampToValueAtTime(2600,AC.currentTime+1.1);
    const g=AC.createGain(); g.gain.setValueAtTime(0,AC.currentTime); g.gain.linearRampToValueAtTime(.5,AC.currentTime+.35); g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+1.35);
    n.connect(bp); bp.connect(g); g.connect(master); n.start(); };
  window.__blip=()=>{ if(!AC||master.gain.value<.001) return; const o=AC.createOscillator(), g=AC.createGain(); o.frequency.setValueAtTime(880,AC.currentTime); o.frequency.exponentialRampToValueAtTime(1500,AC.currentTime+.08);
    g.gain.setValueAtTime(.18,AC.currentTime); g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.16); o.connect(g); g.connect(master); o.start(); o.stop(AC.currentTime+.2); };
}
$('snd').onclick=()=>{ const on=$('snd').getAttribute('aria-pressed')!=='true'; $('snd').setAttribute('aria-pressed',on); initAudio(); if(!AC) return;
  AC.resume(); master.gain.cancelScheduledValues(AC.currentTime); master.gain.linearRampToValueAtTime(on?.09:0, AC.currentTime+.8); };
// --- opening state: the whole of al-Muhit behind the title
applyHaq(haqOn);
body.classList.add('splash');
// ---- intro: a scroll-driven tour. Earth first, then each sphere in turn, then the scale of everything,
// then al-Muhit, then the way in. Text sits in a column on one side; the model is framed on the other.
const dotSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(220,235,255,1)','rgba(120,170,255,.55)','rgba(80,120,255,0)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
scene.add(dotSprite);
state.intro=0; state.introP=0; state.playing=false; $('t-play').textContent='Play';
controls.enabled=false;
const introEl=$('intro'), stageEl=introEl.querySelector('.stage');
const smooth=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
const AU_M=1.495978707e11, MARBLE_KM=12742;               // Earth's diameter pictured as a 1 cm marble
const fmtMarble = km => { const cm=km/MARBLE_KM; if(cm<100) return `${cm<10?cm.toFixed(1):Math.round(cm)} cm`;
  const m=cm/100; if(m<1000) return `${m<10?m.toFixed(1):Math.round(m)} m`; const k=m/1000; return `${k<10?k.toFixed(1):Math.round(k).toLocaleString()} km`; };
const fmtLight = s => s<60? `${s.toFixed(1)} seconds` : s<3600? `${(s/60).toFixed(1)} minutes` : `${(s/3600).toFixed(2)} hours`;
const liveData = key => { const au=pos[key].d, km=au*AU_KM;
  return [['Distance today', au<.01 ? `${Math.round(km).toLocaleString()} km` : `${au.toFixed(2)} AU`],
          ['Light takes', fmtLight(km/299792.458)], ['If Earth were a 1 cm marble', fmtMarble(km)]]; };
// --- small illustrations ---------------------------------------------------------------------------------
// the nine spheres as nested arcs around Earth, the current one lit
function svgSpheres(cur){ const R=[22,34,46,58,70,82,94,112,136]; let s='';
  R.forEach((r,k)=>{ const n=k+1, on=n===cur, past=n<cur, w = n===9 ? (on?9:6) : (on?2.2:1);
    const col = on?'#9ec4ff':past?'rgba(220,226,255,.55)':'rgba(220,226,255,.14)';
    s+=`<path d="M8 ${150-r} A${r} ${r} 0 0 1 8 ${150+r}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
    s+=`<text x="${8+r}" y="${150+4}" dx="${n===9?8:4}" font-size="9" fill="${on?'#9ec4ff':'rgba(220,226,255,.4)'}">${n}</text>`; });
  return `<svg class="ill" viewBox="0 0 170 300" role="img" aria-label="The nine spheres around Earth, sphere ${cur} highlighted"><circle cx="8" cy="150" r="6" fill="#6fa8ff"/>${s}</svg>`; }
const svgMarble = `<svg class="ill wide" viewBox="0 0 300 70" role="img" aria-label="Earth as a one-centimetre marble">
  <circle cx="30" cy="35" r="14" fill="#2c5aa0"/><circle cx="26" cy="31" r="5" fill="rgba(255,255,255,.25)"/>
  <path d="M16 60 H44" stroke="rgba(220,226,255,.6)"/><path d="M16 56 V64 M44 56 V64" stroke="rgba(220,226,255,.6)"/>
  <text x="30" y="70" font-size="9" fill="rgba(220,226,255,.7)" text-anchor="middle">1 cm</text>
  <text x="62" y="31" font-size="11" fill="rgba(240,242,255,.9)">= 12,742 km</text><text x="62" y="47" font-size="9" fill="rgba(220,226,255,.55)">Every distance that follows uses this scale</text></svg>`;
const svgLog = `<svg class="ill wide" viewBox="0 0 320 120" role="img" aria-label="The same distances on a linear and a logarithmic scale">
  <text x="0" y="12" font-size="9" fill="rgba(220,226,255,.6)">Linear: everything but the edge is crushed into one point</text>
  <path d="M0 28 H320" stroke="rgba(220,226,255,.35)"/><circle cx="1.5" cy="28" r="3" fill="#9ec4ff"/><circle cx="318" cy="28" r="3" fill="rgba(220,226,255,.8)"/>
  <text x="318" y="44" font-size="8" fill="rgba(220,226,255,.5)" text-anchor="end">edge</text><text x="2" y="44" font-size="8" fill="rgba(220,226,255,.5)">Earth, Moon, Sun, stars, galaxies</text>
  <text x="0" y="74" font-size="9" fill="rgba(220,226,255,.6)">Logarithmic: one equal step for each power of ten</text>
  <path d="M0 90 H320" stroke="rgba(220,226,255,.35)"/>
  ${[['Earth',6.8],['Moon',8.6],['Sun',11.2],['Saturn',12.2],['Star',16.6],['Galaxy',22.4],['Edge',26.6]].map(([n,L],k)=>{ const x=(L-6.8)/19.8*316+2;
    return `<circle cx="${x}" cy="90" r="3" fill="${k===0?'#6fa8ff':'rgba(220,226,255,.85)'}"/><text x="${x}" y="${k%2?84:106}" font-size="8" fill="rgba(220,226,255,.6)" text-anchor="middle">${n}</text>`; }).join('')}</svg>`;
const svgMuhit = `<svg class="ill wide" viewBox="0 0 320 90" role="img" aria-label="The observable universe as a speck inside the thickness of al-Muhit">
  <defs><linearGradient id="mh" x1="0" x2="1"><stop offset="0" stop-color="rgba(158,196,255,.55)"/><stop offset="1" stop-color="rgba(158,196,255,0)"/></linearGradient></defs>
  <rect x="34" y="30" width="286" height="18" fill="url(#mh)"/><circle cx="20" cy="39" r="4" fill="rgba(240,242,255,.9)"/>
  <text x="20" y="64" font-size="8" fill="rgba(220,226,255,.6)" text-anchor="middle">all we can see</text>
  <text x="40" y="22" font-size="9" fill="rgba(220,226,255,.75)">al-Muhit: from the edge outward, a thousand powers of ten</text>
  <text x="316" y="64" font-size="8" fill="rgba(220,226,255,.45)" text-anchor="end">10¹⁰⁰⁰ × farther</text></svg>`;
const STATEMENT='No law of physics or mathematics is broken here: it is the same universe and the same light, described from a frame in which Earth is at rest.';
const BEATS=[
 {layout:'title', html:`<h1 class="hero">The universe, through a different lens</h1><p class="lede">A still Earth at the centre of nine nested spheres, with every planet, star and galaxy exactly where telescopes measure it.</p><p class="statement">${STATEMENT}</p>`, d:34},
 {layout:'center', html:'<p class="lede big">Somewhere in this darkness is a small blue point of light.</p>', d:34},
 {layout:'side', key:'earth', kicker:'The centre', title:'Earth', body:'In this model it holds still. Every distance is measured from here, and every direction is the direction a telescope on Earth would point.', data:()=>[['Diameter','12,742 km'],['State','At rest']], ill:()=>svgMarble, d:2.1, m:()=>6.371e6},
 {layout:'side', body_:'Moon', body:'The nearest sphere, turning once a month.', kicker:'Sphere 1 · فلك القمر', title:'The Moon', n:1, d:6.6},
 {layout:'side', body_:'Mercury', body:'The swiftest planet, never far from the Sun.', kicker:'Sphere 2 · فلك عطارد', title:'Mercury', n:2, d:10.6},
 {layout:'side', body_:'Venus', body:'The brightest planet. It shows phases like the Moon, and the model reproduces every one of them.', kicker:'Sphere 3 · فلك الزهرة', title:'Venus', n:3, d:14.6},
 {layout:'side', body_:'Sun', body:'The middle of the seven. Its sphere turns once a year and sets the seasons.', kicker:'Sphere 4 · فلك الشمس', title:'The Sun', n:4, d:19},
 {layout:'side', body_:'Mars', body:'Every two years or so it seems to loop backward across the stars, exactly as the model shows it from Earth.', kicker:'Sphere 5 · فلك المريخ', title:'Mars', n:5, d:23.5},
 {layout:'side', body_:'Jupiter', body:'With its four great moons, placed where they are tonight. Between Mars and Jupiter drift thousands of asteroids, and comets cross on their measured orbits.', kicker:'Sphere 6 · فلك المشتري', title:'Jupiter', n:6, d:28},
 {layout:'side', body_:'Saturn', body:'The last of the planets, its rings tilted as telescopes see them today.', kicker:'Sphere 7 · فلك زحل', title:'Saturn', n:7, d:32.5},
 {layout:'side', key:'stars', kicker:'Sphere 8 · فلك البروج', title:'The fixed stars', body:'Every star sits at its measured distance. The twelve zodiac figures stretch deep into space; only from Earth do their stars line up.', data:()=>[['Stars placed','8,920'],['Nearest star','4.24 light-years'],['If Earth were a 1 cm marble','31,500 km']], n:8, d:105, m:()=>4.0175e16},
 {layout:'side', key:'galaxies', kicker:'Within the eighth sphere', title:'Galaxies', body:'Our galaxy and nearly ten thousand others, each placed where its redshift puts it.', data:()=>[['Galaxies placed','9,879'],['Andromeda','2.5 million light-years'],['If Earth were a 1 cm marble','124 × the Earth–Sun distance']], n:8, d:172, m:()=>2.365e22},
 {layout:'side', key:'edge', kicker:'The limit of observation', title:'The edge of what can be seen', body:'The farthest distance from which light has had time to reach us. Nothing beyond it can be seen, measured or tested.', data:()=>[['Distance today','46.3 billion light-years'],['If Earth were a 1 cm marble','36 light-years']], n:8, d:245, m:()=>4.38e26},
 {layout:'side', key:'log', kicker:'How it all fits', title:'Twenty powers of ten', body:'Each ten-fold step outward takes the same space on this map. Directions are never changed; only depth is compressed. It is the one way Earth and the farthest galaxies fit on a single screen.', ill:()=>svgLog, d:262, m:()=>4.38e26},
 {layout:'side', key:'muhit', kicker:'Sphere 9 · الفلك المحيط', title:'al-Falak al-Muhit', body:'The outermost sphere, turning once a day and carrying all the others. It begins where observation ends, so no measurement can confirm it or rule it out.', ill:()=>svgMuhit, data:()=>[['Thickness drawn','10¹⁰⁰⁰ × the edge'],['Turns','Once a sidereal day']], n:9, d:VIEW_MUHIT, m:()=>1e30},
 {layout:'title', key:'enter', html:`<h2 class="hero sm">Nine spheres. One sky.</h2><p class="statement">${STATEMENT}</p><div class="ctas"><button class="enter" id="intro-enter">Enter the model</button></div><div class="lnks"><button class="lnk" id="intro-calc">Calculate and verify positions</button><button class="lnk" id="intro-read">How it compares with the heliocentric model</button><a class="lnk" href="paper.html" target="_blank" rel="noopener">Read the paper</a></div>`, d:30},
];
BEATS.forEach(b=>{ if(b.body_){ b.body2=b.body_; b.data=()=>liveData(b.body2); if(!b.ill) b.ill=()=>svgSpheres(b.n); } else if(b.n && !b.ill) b.ill=()=>svgSpheres(b.n); });
const NB=BEATS.length;
introEl.querySelector('.track').style.height=(NB*110)+'vh';
const beatEls=BEATS.map(b=>{ const el=document.createElement('section'); el.className='beat '+b.layout;
  el.innerHTML = b.layout==='side'
    ? `<div class="col"><p class="kicker">${b.kicker}</p><h2 class="ttl">${b.title}</h2><p class="body">${b.body}</p><dl class="data"></dl><div class="illw"></div></div>`
    : b.html;
  stageEl.appendChild(el); return el; });
const bIndex = key => BEATS.findIndex(b=>b.body2===key || b.key===key);
// the scale ruler: powers of ten from Earth's radius to the edge of the observable universe, then al-Muhit
const RL_MIN=6.5, RL_MAX=27, RL_W=.86;
const lx = L => L<=RL_MAX ? Math.max(0,(L-RL_MIN)/(RL_MAX-RL_MIN))*RL_W : RL_W+.04+Math.min(1,(L-RL_MAX)/3)*(1-RL_W-.06);
const irEl=document.createElement('div'); irEl.className='iruler'; irEl.setAttribute('aria-hidden','true');
irEl.innerHTML='<div class="ir-read"><b id="ir-num"></b><span id="ir-txt"></span></div><div class="ir-track" id="ir-track"><div class="ir-axis"></div><div class="ir-mseg"></div><div class="ir-brk">//</div><div class="ir-mk" id="ir-mk"></div></div>';
introEl.appendChild(irEl);
const scrimEl=document.createElement('div'); scrimEl.className='scrim'; introEl.appendChild(scrimEl);
const scrimC=document.createElement('div'); scrimC.className='scrim centre'; introEl.appendChild(scrimC);
const irTrack=irEl.querySelector('#ir-track'), irLms=[];
{ const add=(cls,x,html)=>{ const e=document.createElement('div'); e.className=cls; e.style.left=(x*100)+'%'; if(html) e.innerHTML=html; irTrack.appendChild(e); return e; };
  for(let p=7;p<=27;p++){ add('ir-tk'+(p%5===0?' major':''),lx(p)); if(p%5===0) add('ir-tl',lx(p),`10<sup>${p}</sup> m`); }
  [['Earth',6.371e6],['Moon',3.844e8],['Sun',1.496e11],['Saturn',1.43e12],['Proxima',4.0175e16],['Galactic centre',2.5e20],['Andromeda',2.365e22],['Edge',4.38e26]]
    .forEach(([nm,m],k)=>{ const L=Math.log10(m); const e=add('ir-lm'+(k%2?' hi':''),lx(L),nm); irLms.push({e,L,on:false}); });
  irLms.push({e:add('ir-lm muhit',lx(30),'al-Muhit'),L:29.5,on:false}); }
const beatL = k => { const b=BEATS[k]; if(b.body2) return Math.log10(pos[b.body2].d*AU_M); if(b.m) return Math.log10(b.m()); return null; };
const humanM = m => m<1e9 ? `${Math.round(m/1000).toLocaleString()} km` : m<1e14 ? `${(m/AU_M).toFixed(m<1.5e12?2:1)} AU` : fmtLy(m/9.4607e15);
let introDir=null, filled=false, activeBeat=-1, lastL=null, lastOp=-1, viewShift=0, lastShift=null;
introEl.addEventListener('scroll',()=>{ const max=introEl.scrollHeight-introEl.clientHeight; state.introP=max>0? introEl.scrollTop/max : 0; },{passive:true});
function fillBeats(){ BEATS.forEach((b,k)=>{ if(b.layout!=='side') return; const el=beatEls[k];
  if(b.data) el.querySelector('.data').innerHTML=b.data().map(([t,v])=>`<div><dt>${t}</dt><dd>${v}</dd></div>`).join('');
  if(b.ill) el.querySelector('.illw').innerHTML=b.ill(); }); filled=true; }
const sideLayout = () => innerWidth>=900 && innerWidth/innerHeight>1.05;
function introCamera(dt){
  const p = state.intro = state.intro + (state.introP-state.intro)*Math.min(1,dt*7);
  if(!filled) fillBeats();
  if(!introDir){ // look at Earth's sunlit side, a little from above
    const sw=new THREE.Vector3(...sunNow).applyMatrix3(new THREE.Matrix3().setFromMatrix4(prec.matrixWorld)).normalize();
    introDir=sw.clone().multiplyScalar(.75).add(new THREE.Vector3(0,.35,0)).add(new THREE.Vector3().crossVectors(sw,new THREE.Vector3(0,1,0)).normalize().multiplyScalar(.55)).normalize(); }
  const x=p*NB, i=Math.min(NB-1,Math.floor(x)), s=Math.min(1,x-i);
  // text: one beat is on at a time; CSS handles the staggered entrance and the exit
  const on = (i===0 && s<.9) || (i===NB-1 && s>.05) || (s>.05 && s<.92) ? i : -1;
  if(on!==activeBeat){ beatEls.forEach((el,k)=>el.classList.toggle('on',k===on)); activeBeat=on; }
  $('intro-hint').style.opacity = p<.004 ? 1 : 0;
  // frame the model: on wide screens it moves to the right while text occupies the left
  const side = BEATS[i].layout==='side' ? 1 : 0, wide=sideLayout();
  viewShift += (side-viewShift)*Math.min(1,dt*4);
  const sh=Math.round(viewShift*1000)/1000;
  if(sh!==lastShift){ lastShift=sh;
    if(sh<.001) camera.clearViewOffset();
    else camera.setViewOffset(innerWidth, innerHeight, wide ? -sh*innerWidth*.2 : 0, wide ? 0 : -sh*innerHeight*.16, innerWidth, innerHeight);
    scrimEl.style.opacity=sh; scrimEl.classList.toggle('portrait',!wide); scrimC.style.opacity=1-sh; }
  // camera: during the first half of each beat, move (in log distance) from the previous beat's view to this one
  const d0=BEATS[Math.max(0,i-1)].d, d1=BEATS[i].d, e=smooth(0,.55,s), d=d0*Math.pow(d1/d0,e);
  const toTop=smooth(3/NB,3.5/NB,p);
  const dir=introDir.clone().lerp(HOME.clone().normalize(), toTop).normalize().applyAxisAngle(new THREE.Vector3(0,1,0), state.time*.02);
  camera.position.copy(dir.multiplyScalar(d)); camera.lookAt(0,0,0); controls.target.set(0,0,0);
  earth.scale.setScalar(.04+.96*smooth(2/NB,2.45/NB,p));
  dotSprite.scale.setScalar(d*.03); dotSprite.material.opacity=smooth(1.05/NB,1.25/NB,p)*(1-smooth(2.1/NB,2.4/NB,p)); dotSprite.visible=dotSprite.material.opacity>.002;
  if(Math.abs(state.introP-state.intro)>.0015 && Math.max(d1/d0,d0/d1)>2.5 && s<.55) state.warpT=performance.now()+200;   // a brief glow while travelling far
  // the scale ruler (DOM is touched only when something changes)
  const op=Math.round(smooth(2.05/NB,2.35/NB,p)*(1-smooth((NB-1)/NB,(NB-.7)/NB,p))*100)/100;
  if(op!==lastOp){ irEl.style.opacity=op; lastOp=op; }
  if(op>0){ let L;
    if(BEATS[i].key==='log'){ L=6.8+(Math.log10(4.38e26)-6.8)*smooth(.12,.8,s); }
    else { const L1=beatL(i), L0=beatL(Math.max(0,i-1)) ?? L1; L = L1===null ? 6.8 : L0+(L1-L0)*e; }
    L=Math.round(L*100)/100;
    if(L!==lastL){ lastL=L;
      $('ir-mk').style.transform=`translateX(${lx(L)*irTrack.clientWidth}px)`;
      irLms.forEach(o=>{ const v=L>=o.L-.02; if(v!==o.on){ o.e.classList.toggle('on',v); o.on=v; } });
      if(L<=27.05){ $('ir-num').innerHTML=`10<sup>${L.toFixed(1)}</sup> m`; $('ir-txt').textContent=humanM(Math.pow(10,L)); }
      else { $('ir-num').innerHTML='edge × 10<sup>1000</sup>'; $('ir-txt').textContent='the outer face of al-Muhit'; } } }
}
// what the tour shows at each moment: each sphere and its contents appear in turn
const appear = k => smooth((k+.08)/NB,(k+.5)/NB,state.intro);
function applyIntroVis(t){
  BODIES.forEach((b,k)=>{ const f=appear(bIndex(b.key)); b.mesh.visible=f>.001; b.mesh.scale.setScalar(Math.max(.001,f));
    planetShells[k].userData.iv=f; b.trailLine.visible=f>.98; b.lbl._introOK=f>.6; });
  sunGlow.visible=BMAP.Sun.mesh.visible; sunGlow.material.opacity=appear(bIndex('Sun'));
  const fJ=appear(bIndex('Jupiter')), fS=appear(bIndex('Saturn')), fM=appear(bIndex('Mars'));
  moonGroups[0].visible=fJ>.5; moonGroups[1].visible=fS>.5; moonGroups[2].visible=fM>.5;   // Jupiter, Saturn, Mars
  if(fJ>.02 && !smallBodies.visible) updateSmallBodies(t,true);
  smallBodies.visible=fJ>.02; smallBodies.material.uniforms.uFade.value=fJ; tails.visible=fJ>.5; cometOrbits.forEach(c=>c.ln.visible=false);
  const fSt=appear(bIndex('stars')); starShell.userData.iv=fSt; zodGroup.visible=fSt>.02; zodLabels.forEach(z=>z.el._introOK=fSt>.6);
  const fG=appear(bIndex('galaxies')); for(const o of [milky,galaxies,objects]){ o.visible=fG>.01; o.material.uniforms.uFade.value=fG; }
  const fE=appear(bIndex('edge')); for(const o of [deep,landmarks]){ o.visible=fE>.01; o.material.uniforms.uFade.value=fE; }
  cmb.visible=fE>.3; horizon.visible=fE>.3;
  muhitGroup.visible=appear(bIndex('muhit'))>.05;
  for(const o of [fabric, sightLine, sunLine, chordLine, ...dispLines, signGroup, earthTrail.line, ...elemShells]) o.visible=false;
  flexShells.forEach(m=>{ m.visible=false; m.userData.cap.visible=false; }); OUTER.forEach(o=>o.mesh.visible=false);
}
function enterModel(){ if(state.intro===null) return; state.intro=null;
  introEl.classList.add('gone'); body.classList.remove('splash'); dotSprite.visible=false; camera.clearViewOffset(); lastShift=null;
  BODIES.forEach(b=>{ b.mesh.visible=true; b.mesh.scale.setScalar(1); b.lbl._introOK=true; }); sunGlow.visible=true; sunGlow.material.opacity=1;
  planetShells.forEach(sh=>sh.userData.iv=1); starShell.userData.iv=1;
  pointMats.forEach(m=>{ if(m.uniforms.uFade) m.uniforms.uFade.value=1; });
  muhitGroup.visible=true; cmb.visible=true; horizon.visible=true;
  document.querySelectorAll('#left .tog input').forEach(inp=>inp.dispatchEvent(new Event('change')));   // back to the viewer's layer choices
  controls.target.set(0,0,0); controls.enabled=true;
  state.playing=true; $('t-play').textContent='Pause';
  if(camera.position.length()>60) warpTo(30);
  setTimeout(()=>toast('Drag to turn · scroll to zoom · click any planet, star or galaxy',4500),900); }
$('intro-enter').onclick=enterModel; $('intro-skip').onclick=()=>{ enterModel(); warpTo(30); };
$('intro-calc').onclick=()=>{ enterModel(); openCalc(); };
addEventListener('resize',()=>{ lastShift=null; lastL=null; });
camera.position.set(0,0,34);

// ---- zoom: wheel, trackpad pinch and buttons scale the viewing distance by a constant factor,
// so every notch looks the same at every scale (the depth gauge shows the power of ten you are at)
const DECADE = GA*Math.LN10;
addEventListener('wheel', e=>{
  if(state.intro!==null || state.skyView) return;
  if(e.target.closest && e.target.closest('.panel,#article,#calc,#intro')) return;
  e.preventDefault(); e.stopPropagation();
  let dy=e.deltaY; if(e.deltaMode===1) dy*=33; else if(e.deltaMode===2) dy*=400;
  if(e.ctrlKey) dy*=4;                                   // trackpad pinch arrives as small ctrl+wheel steps
  dy=Math.max(-300,Math.min(300,dy));
  const cur = state.zoomGoal ?? camera.position.distanceTo(controls.target);
  const next = Math.max(controls.minDistance, Math.min(controls.maxDistance, cur*Math.exp(dy*0.0017)));
  state.zoomGoal=next; state.camDir=null;
  if(Math.max(next/cur,cur/next)>2.5) warpFx(); }, {passive:false, capture:true});
$('z-in').onclick=()=>dolly(.55); $('z-out').onclick=()=>dolly(1.8);
// ---- the depth gauge (log scale along the bottom)
const GAUGE_A=.80, GAUGE_B=.965, CD_MAX=VIEW_MUHIT*1.2;
const cdToX = cd => cd<=R_EDGE ? Math.max(0,(cd-RE)/(R_EDGE-RE))*GAUGE_A : cd<=R_MO ? GAUGE_A+(cd-R_EDGE)/(R_MO-R_EDGE)*(GAUGE_B-GAUGE_A) : Math.min(1, GAUGE_B+(cd-R_MO)/(CD_MAX-R_MO)*(1-GAUGE_B));
const xToCd = x => x<=GAUGE_A ? RE+x/GAUGE_A*(R_EDGE-RE) : x<=GAUGE_B ? R_EDGE+(x-GAUGE_A)/(GAUGE_B-GAUGE_A)*(R_MO-R_EDGE) : R_MO+(x-GAUGE_B)/(1-GAUGE_B)*(CD_MAX-R_MO);
const mToCd = m => g(m/1.495978707e11);
{ const tr=$('gtrack'); const add=(cls,x,html)=>{ const e=document.createElement('div'); e.className=cls; e.style.left=(x*100)+'%'; if(html) e.innerHTML=html; tr.appendChild(e); return e; };
  const SUP='⁰¹²³⁴⁵⁶⁷⁸⁹'; const sup=n=>String(n).split('').map(c=>SUP[+c]).join('');
  for(let p=7;p<=26;p++){ const x=cdToX(mToCd(10**p)); add('tk'+(p%3===1?' major':''),x); if(p%3===1) add('tl',x,`10${sup(p)} m`); }
  add('brk',GAUGE_A,'≈');
  for(const [nm,m,minor] of [['Moon',3.84e8],['Sun',1.496e11],['Saturn',1.43e12,1],['Proxima',4.0e16],['Galactic centre',2.5e20,1],['Andromeda',2.4e22],['Virgo',5.1e23,1],['Microwave background',4.29e26,1]]) add('lm'+(minor?' minor':''),cdToX(mToCd(m)),nm);
  add('lm',(GAUGE_A+GAUGE_B)/2,'al-Muhit · 1,000 powers of ten');
  tr.addEventListener('click',e=>{ const r=tr.getBoundingClientRect(); warpTo(xToCd((e.clientX-r.left)/r.width)); }); }
let lastDec=null;
function gaugeFrame(){ const cd=state.skyView? RE : camera.position.length();
  $('g-mk').style.left=(cdToX(cd)*100)+'%';
  let main, sub;
  if(cd<=R_EDGE){ const au=GB*(Math.exp((cd-RE)/GA)-1), m=Math.max(6371e3, au*1.495978707e11), L=Math.log10(m);
    main=`10^${L.toFixed(1)} m`; sub= au<0.01? `${Math.round(m/1000).toLocaleString()} km from the centre` : au<2000? `${au.toFixed(au<10?2:0)} AU from the centre` : `${fmtLy(au/LY_AU)} from the centre`;
    const dec=Math.floor(L); if(lastDec!==null && dec!==lastDec){ const b=$('g-read'); b.classList.add('pulse'); setTimeout(()=>b.classList.remove('pulse'),350); } lastDec=dec; }
  else if(cd<=R_MO){ const p=(cd-R_EDGE)/DECADE; main=`edge × 10^${p.toFixed(p<10?1:0)}`; sub='Inside al-Muhit, beyond all observation'; }
  else { main='outside al-Muhit'; sub=`its outer face is 10^${MUHIT_POW} × the observable edge`; }
  $('g-read').textContent=main; $('g-sub').textContent=sub; }
// ---- the physics article
function openArticle(){ $('article').hidden=false; $('article').querySelector('.doc').focus(); }
function closeArticle(){ $('article').hidden=true; }
$('open-article').onclick=openArticle; $('intro-read').onclick=openArticle; $('art-x').onclick=closeArticle;
$('article').addEventListener('click',e=>{ if(e.target.id==='article') closeArticle(); });
addEventListener('keydown',e=>{ if(e.key==='Escape' && !$('article').hidden){ closeArticle(); e.stopImmediatePropagation(); } }, true);
// ================= calculator: this model against the heliocentric calculation =================
// Column 1 ("this model") places the object in the Earth-centred scene exactly as the scene does, then reads the
// answer back out of the scene geometry. Column 2 ("heliocentric") never touches the scene: it takes Sun-centred
// positions, applies light time and aberration, and subtracts Earth's position. Both use the same planetary theory
// (VSOP87 via Astronomy Engine), so agreement shows that the Earth-centred geometry loses no information.
const ginv = r => GB*(Math.exp((r-RE)/GA)-1);
const vsub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], vadd=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], vlen=a=>Math.hypot(a[0],a[1],a[2]);
const vsc=(a,k)=>[a[0]*k,a[1]*k,a[2]*k], vdot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], vunit=a=>vsc(a,1/vlen(a));
const sToEqj = v=>[v[0], -v[2], v[1]], xyz = o=>[o.x,o.y,o.z];
const angSec=(a,b)=>{ const cr=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; return Math.atan2(vlen(cr),vdot(a,b))/DEG*3600; };
const CALC_OBJ=[];
{ const HZ={Sun:'10',Moon:'301',Mercury:'199',Venus:'299',Mars:'499',Jupiter:'599',Saturn:'699'};
  ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'].forEach(k=>CALC_OBJ.push({type:'major',key:k,label:k,group:'Sun, Moon and planets',hz:HZ[k]}));
  ['Io','Europa','Ganymede','Callisto'].forEach((k,i)=>CALC_OBJ.push({type:'moon',idx:i,label:`${k} (moon of Jupiter)`,group:'Moons of Jupiter',hz:String(501+i)}));
  [...SKY.names].sort((a,b)=>a[1].localeCompare(b[1])).forEach(([i,nm])=>CALC_OBJ.push({type:'star',idx:i,label:nm,group:'Bright stars'}));
  SB.map((o,i)=>({o,i})).filter(x=>x.o.kind>=4 && x.o.name).sort((a,b)=>(FAMOUS.some(f=>b.o.name.includes(f))-FAMOUS.some(f=>a.o.name.includes(f)))||a.o.name.localeCompare(b.o.name))
    .forEach(({o,i})=>CALC_OBJ.push({type:'sb',idx:i,label:o.name,group:'Comets and interstellar objects'}));
  SB.map((o,i)=>({o,i})).filter(x=>(x.o.kind===0||x.o.kind===1) && x.o.name).sort((a,b)=>a.o.H-b.o.H).slice(0,80)
    .forEach(({o,i})=>CALC_OBJ.push({type:'sb',idx:i,label:o.name,group:'Asteroids and dwarf planets',hz:`${o.name};`})); }
const SUNOBJ=CALC_OBJ[0];
// --- this model -------------------------------------------------------------------------------------------
// The geocentric vector the scene itself uses for an object at time t (scene axes, AU). Call after compute(t).
function sceneVector(obj, t){
  if(obj.type==='major') return pos[obj.key].p;
  if(obj.type==='moon'){ // the moon rides on Jupiter's sphere; its own light time differs from Jupiter's by a few seconds
    const Jast=toS(A.GeoVector('Jupiter',t,false)), Japp=toS(A.GeoVector('Jupiter',t,true)), tJ=vlen(Jast)/C_AU_DAY;
    let tm=tJ, off; for(let k=0;k<3;k++){ const jm=A.JupiterMoons(A.MakeTime(t.ut-tm)); off=toS([jm.io,jm.europa,jm.ganymede,jm.callisto][obj.idx]); tm=vlen(vadd(Jast,off))/C_AU_DAY; }
    const eS=A.HelioState('Earth',t), jS=A.HelioState('Jupiter',t), dv=vsub(toS({x:eS.vx,y:eS.vy,z:eS.vz}), toS({x:jS.vx,y:jS.vy,z:jS.vz}));
    const app=vadd(vadd(Japp,off), vsc(dv,tm-tJ)), ast=vadd(vadd(Jast,off), vsc(toS({x:jS.vx,y:jS.vy,z:jS.vz}),-(tm-tJ)));
    return vsc(vunit(app), vlen(ast)); }
  const es=A.HelioState('Earth',t), E=toS(es), Vd=toS({x:es.vx,y:es.vy,z:es.vz});
  if(obj.type==='sb') return sbApparent(obj.idx, t.ut+2451545.0, E, Vd, [0,0,0]);
  // a star on the eighth sphere, with the sphere's yearly wobble at true size: parallax and aberration
  const i=obj.idx, st=SKY.s[i], d0=radecS(st[0],st[1]), V=vsc(Vd,1/C_AU_DAY), par=st[4]>0 ? 1/(st[4]*206264.806) : 0;   // double precision, not the GPU's float buffer
  const ep=vsub(E,vsc(d0,vdot(E,d0))), d1=vunit(vsub(d0,vsc(ep,par))), vp=vsub(V,vsc(d1,vdot(V,d1)));
  const dir=vunit(vadd(d1,vp)); return vsc(dir, par>0 ? vlen(vsub(vsc(d0,1/par),E)) : 1e15);
}
// Read an answer back from the scene geometry.
//  Flexing spheres: the displayed point gives the direction, and its radius inverts the log map to give distance.
//  Round spheres: depth is rank, so the observed direction is that of the light path where it leaves Earth, and
//  the distance is the length of that light path measured in the map's own metric.
function modelRead(xS, geom){ const su=state.u, sc=state.c; state.c=0; let dir, dist;
  if(geom==='flex'){ state.u=0; const D=dispPoint(xS[0],xS[1],xS[2],[0,0,0]); dir=vunit(D); dist=ginv(vlen(D)); }
  else { state.u=1; const e=1e-7/vlen(xS), D=dispPoint(xS[0]*e,xS[1]*e,xS[2]*e,[0,0,0]); dir=vunit(D);   // a step of 1e-7 AU along the path
    let L=0, prev=[0,0,0]; for(let k=1;k<=64;k++){ const q=vsc(xS,k/64); L+=vlen(vsub(q,prev)); prev=q; } dist=L; }
  state.u=su; state.c=sc; return {dir:sToEqj(dir), dist};
}
function withTime(t, fn){ compute(t); try { return fn(); } finally { compute(A.MakeTime(state.ut)); } }
const modelAt = (obj,t,geom) => { const r=modelRead(sceneVector(obj,t), obj.type==='star'?'flex':geom);
  if(obj.type==='star' && !(SKY.s[obj.idx][4]>0)) r.dist=Infinity; return r; };
const modelVector = (obj,t,geom) => withTime(t, ()=>modelAt(obj,t,geom));
// --- heliocentric -----------------------------------------------------------------------------------------
function helioPos(obj, t){
  if(obj.type==='major') return obj.key==='Sun' ? [0,0,0] : xyz(A.HelioVector(obj.key,t));
  if(obj.type==='moon'){ const jm=A.JupiterMoons(t); return vadd(xyz(A.HelioVector('Jupiter',t)), xyz([jm.io,jm.europa,jm.ganymede,jm.callisto][obj.idx])); }
  const o3=[0,0,0]; orbitPos(SB[obj.idx], t.ut+2451545.0, o3); return sToEqj(o3);
}
function helioRead(obj, t){
  if(obj.type==='star'){ const st=SKY.s[obj.idx], u0=radec(st[0],st[1]), par=st[4]>0 ? 1/(st[4]*206264.806) : 0, es=A.HelioState('Earth',t), E=[es.x,es.y,es.z], V=vsc([es.vx,es.vy,es.vz],1/C_AU_DAY);
    const rel = par>0 ? vsub(vsc(u0,1/par),E) : u0, u=vunit(rel);
    return {dir:vunit(vadd(u, vsub(V, vsc(u,vdot(u,V))))), dist: par>0 ? vlen(rel) : Infinity}; }
  let tau=0, app, ast, P; const E0=xyz(A.HelioVector('Earth',t));
  for(let k=0;k<5;k++){ const tt=A.MakeTime(t.ut-tau); P=helioPos(obj,tt); ast=vsub(P,E0); app=vsub(P,xyz(A.HelioVector('Earth',tt))); tau=vlen(ast)/C_AU_DAY; }
  return {dir:vunit(app), dist:vlen(ast), P, E:E0};
}
// --- conversions and formatting ---------------------------------------------------------------------------
const toDate=(dir,t)=>{ const e=A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(t), new A.Vector(dir[0],dir[1],dir[2],t))); return {ra:e.ra, dec:e.dec}; };
const toJ2000=(dir,t)=>{ const e=A.EquatorFromVector(new A.Vector(dir[0],dir[1],dir[2],t)); return {ra:e.ra, dec:e.dec}; };
function horizonOf(dir, dist, t, obs){ let v=vsc(dir, isFinite(dist)? dist : 1e12); v=vsub(v, xyz(A.ObserverVector(t,obs,false)));
  const d=toDate(vunit(v),t), h=A.Horizon(t,obs,d.ra,d.dec,'normal'); return {alt:h.altitude, az:h.azimuth}; }
const fRA=h=>{ h=((h%24)+24)%24; let H=Math.floor(h), mm=(h-H)*60, M=Math.floor(mm), S=(mm-M)*60; if(S>=59.9995){S=0;M++;} if(M>=60){M=0;H=(H+1)%24;}
  return `${String(H).padStart(2,'0')}h ${String(M).padStart(2,'0')}m ${S.toFixed(3).padStart(6,'0')}s`; };
const fDeg=(d,dp=2)=>{ const sg=d<0?'−':'+'; d=Math.abs(d); let D=Math.floor(d), mm=(d-D)*60, M=Math.floor(mm), S=(mm-M)*60; if(S>=60-.5*10**-dp){S=0;M++;} if(M>=60){M=0;D++;}
  return `${sg}${String(D).padStart(2,'0')}° ${String(M).padStart(2,'0')}′ ${S.toFixed(dp).padStart(3+dp,'0')}″`; };
const fDist=au=>!isFinite(au)?'not measured': au<0.01? `${(au*AU_KM).toLocaleString(undefined,{maximumFractionDigits:2})} km` : au<2e4? `${au.toFixed(8)} AU` : `${(au/LY_AU).toLocaleString(undefined,{maximumFractionDigits:4})} light-years`;
const fSmall=as=>{ as=Math.abs(as); return as<1e-3? `${(as*1e3).toFixed(4)} mas` : as<1? `${(as*1e3).toFixed(2)} mas` : `${as.toFixed(3)}″`; };
const fRel=(a,b)=>{ if(!isFinite(a)||!isFinite(b)) return '—'; const r=Math.abs(a-b)/b; if(r===0) return 'identical'; const km=Math.abs(a-b)*AU_KM;
  return km<1000? `${km<1? (km*1000).toFixed(1)+' m' : km.toFixed(2)+' km'} (${r.toExponential(1)})` : r.toExponential(2); };
const fUT=t=>t.date.toISOString().replace('T',' ').slice(0,16)+' UTC';
const geomName={flex:'flexing spheres', round:'round spheres'};
// --- the calculator panel ---------------------------------------------------------------------------------
let calcBuilt=false;
function buildCalc(){ if(calcBuilt) return; calcBuilt=true; const sel=$('c-obj'); let grp=null, og=null;
  CALC_OBJ.forEach((o,k)=>{ if(o.group!==grp){ grp=o.group; og=document.createElement('optgroup'); og.label=grp; sel.appendChild(og); }
    const op=document.createElement('option'); op.value=k; op.textContent=o.label; og.appendChild(op); });
  $('calc-form').addEventListener('submit',e=>{ e.preventDefault(); runCalc(); });
  $('c-now').onclick=()=>{ $('c-time').value=A.MakeTime(state.ut).date.toISOString().slice(0,16); runCalc(); runEvents(); };
  $('c-ev-go').onclick=runEvents; }
function calcTime(){ const v=$('c-time').value; const d=new Date((v.length===16?v+':00':v)+'Z'); return A.MakeTime(isNaN(d)? new Date() : d); }
function runCalc(){
  const obj=CALC_OBJ[+$('c-obj').value], t=calcTime(), geom=$('c-geom').value;
  const lat=+$('c-lat').value, lon=+$('c-lon').value, obs=new A.Observer(isFinite(lat)?lat:25.2048, isFinite(lon)?lon:55.2708, 0);
  const t0=performance.now();
  const M=modelVector(obj,t,geom), H=helioRead(obj,t);
  const sepAs=angSec(M.dir,H.dir);
  const mD=toDate(M.dir,t), hD=toDate(H.dir,t), mJ=toJ2000(M.dir,t), hJ=toJ2000(H.dir,t);
  const mH=horizonOf(M.dir,M.dist,t,obs), hH=horizonOf(H.dir,H.dist,t,obs);
  const rows=[];
  const dRA=(a,b,dec)=>{ let x=(a-b)*15*3600; if(x>648000) x-=1296000; if(x<-648000) x+=1296000; return x*Math.cos(dec*DEG); };
  rows.push(['Right ascension (apparent, of date)', fRA(mD.ra), fRA(hD.ra), fSmall(dRA(mD.ra,hD.ra,hD.dec))]);
  rows.push(['Declination (apparent, of date)', fDeg(mD.dec), fDeg(hD.dec), fSmall((mD.dec-hD.dec)*3600)]);
  rows.push(['Direction: total angle between the two answers', '', '', `<b>${fSmall(sepAs)}</b>`]);
  rows.push(['Distance from Earth', fDist(M.dist), fDist(H.dist), fRel(M.dist,H.dist)]);
  if(isFinite(H.dist)) rows.push(['Light-travel time', fmtLight(M.dist*AU_KM/299792.458), fmtLight(H.dist*AU_KM/299792.458), '']);
  if(obj.type==='star'){ rows.push(['Right ascension (J2000, astrometric)', fRA(mJ.ra), fRA(hJ.ra), fSmall(dRA(mJ.ra,hJ.ra,hJ.dec))]); rows.push(['Declination (J2000, astrometric)', fDeg(mJ.dec), fDeg(hJ.dec), fSmall((mJ.dec-hJ.dec)*3600)]); }
  rows.push([`Altitude at ${obs.latitude.toFixed(2)}°, ${obs.longitude.toFixed(2)}°`, `${mH.alt.toFixed(4)}°`, `${hH.alt.toFixed(4)}°`, fSmall((mH.alt-hH.alt)*3600)]);
  rows.push(['Azimuth (from north, through east)', `${mH.az.toFixed(4)}°`, `${hH.az.toFixed(4)}°`, fSmall(((mH.az-hH.az+540)%360-180)*3600)]);
  if(obj.key!=='Sun' && obj.type!=='star'){
    const MS=modelVector(SUNOBJ,t,geom), HS=helioRead(SUNOBJ,t);
    const mEl=angSec(M.dir,MS.dir)/3600, hEl=angSec(H.dir,HS.dir)/3600;
    rows.push(['Angle from the Sun (elongation)', `${mEl.toFixed(5)}°`, `${hEl.toFixed(5)}°`, fSmall((mEl-hEl)*3600)]);
    const g=vsc(M.dir,M.dist), sv=vsc(MS.dir,MS.dist), mPh=angSec(vsc(g,-1), vsub(sv,g))/3600;
    const hPh=angSec(vsub(H.E,H.P), vsc(H.P,-1))/3600;
    rows.push(['Lit fraction of the disc', `${((1+Math.cos(mPh*DEG))/2*100).toFixed(4)} %`, `${((1+Math.cos(hPh*DEG))/2*100).toFixed(4)} %`, `${Math.abs(mPh-hPh).toFixed(5)}° in phase angle`]); }
  rows.push(['Constellation', A.Constellation(mJ.ra,mJ.dec).name, A.Constellation(hJ.ra,hJ.dec).name, '']);
  const ms=(performance.now()-t0).toFixed(0);
  const links=[];
  const t1=t.date.toISOString().slice(0,16).replace('T',' '), t2=new Date(t.date.getTime()+60000).toISOString().slice(0,16).replace('T',' ');
  if(obj.hz){ const q=k=>`'${k}'`; const url='https://ssd.jpl.nasa.gov/api/horizons.api?'+[['format','text'],['COMMAND',q(obj.hz)],['OBJ_DATA',q('NO')],['MAKE_EPHEM',q('YES')],['EPHEM_TYPE',q('OBSERVER')],['CENTER',q('500@399')],['START_TIME',q(t1)],['STOP_TIME',q(t2)],['STEP_SIZE',q('1 m')],['QUANTITIES',q('2,20')]].map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
    links.push(`<a href="${url}" target="_blank" rel="noopener">Check against NASA JPL Horizons</a> <span class="note">(geocentric apparent RA/Dec and range for ${t1} UT; expect agreement within about an arcminute, the accuracy of the compact planetary theory used here)</span>`); }
  if(obj.type==='star') links.push(`<a href="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(obj.label)}" target="_blank" rel="noopener">Look up ${obj.label} in SIMBAD</a> <span class="note">(compare the J2000 rows; proper motion since 2000 is not applied here, so fast-moving stars differ by up to a few arcseconds)</span>`);
  if(obj.type==='sb'){ const o=SB[obj.idx]; if(o.kind>=4){ const d=new Date((o.Tp-2440587.5)*864e5); links.push(`<span class="note">Orbit: closest to the Sun on ${d.toISOString().slice(0,10)} at ${o.q.toFixed(3)} AU, eccentricity ${o.e.toFixed(4)}. Positions from published orbital elements on a pure Kepler orbit; planetary perturbations are not included.</span>`); } }
  $('c-out').innerHTML=`<div class="tw"><table class="ctab"><thead><tr><th>${obj.label} · ${fUT(t)}</th><th>This model<br><span>${geomName[obj.type==='star'?'flex':geom]}, Earth at rest</span></th><th>Heliocentric<br><span>Sun-centred vectors</span></th><th>Difference</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div>
    <p class="note">Computed in ${ms} ms. The two columns use different code paths but the same planetary theory, so agreement to milliarcseconds shows the Earth-centred geometry is an exact change of viewpoint. An independent test against observation is the comparison with NASA's ephemeris below.</p>
    <div class="clinks">${links.map(l=>`<p>${l}</p>`).join('')}<p><button class="btn" type="button" id="c-show">Show ${obj.label} in the model at this time</button></p></div>`;
  $('c-show').onclick=()=>{ closeCalc(); state.ut=t.ut; state.playing=false; $('t-play').textContent='Play'; if(state.cTarget>.5) setCentre('Earth');
    if(obj.type==='major'){ select(obj.key); focusOn(obj.key); } else if(obj.type==='moon'){ select('Jupiter'); focusOn('Jupiter'); } else warpTo(obj.type==='star'?100:30);
    toast(`${obj.label}: RA ${fRA(mD.ra)}, Dec ${fDeg(mD.dec,1)} · ${fDist(M.dist)}`, 6000); };
}
// --- upcoming events, each checked in this model --------------------------------------------------------
function eventsFrom(t0, geom){
  const out=[], O=key=>CALC_OBJ.find(o=>o.key===key);
  const lonAt=(key,t)=>{ const m=modelAt(O(key),t,geom); return A.Ecliptic(new A.Vector(m.dir[0],m.dir[1],m.dir[2],t)).elon; };
  const dl=(a,b)=>((a-b)%360+540)%360-180, norm=a=>((a%360)+360)%360;
  const sepAt=(a,b,t)=>angSec(modelAt(O(a),t,geom).dir, modelAt(O(b),t,geom).dir)/3600;
  const add=(name,t,body,fn,rate)=>{ const r=withTime(t,fn); out.push({name,t,body,check:r[0],ok:r[1],rate}); };
  const nm=A.SearchMoonPhase(0,t0,40); add('New Moon', nm, 'Moon', ()=>{ const d=dl(lonAt('Moon',nm),lonAt('Sun',nm)); return [`Moon − Sun longitude in this model: ${d.toFixed(4)}°`, Math.abs(d)<.01]; });
  const fm=A.SearchMoonPhase(180,t0,40); add('Full Moon', fm, 'Moon', ()=>{ const d=Math.abs(dl(lonAt('Moon',fm),lonAt('Sun',fm))); return [`Moon − Sun longitude in this model: ${d.toFixed(4)}°`, Math.abs(d-180)<.01]; });
  const se=A.SearchGlobalSolarEclipse(t0); add(`Solar eclipse (${se.kind})`, se.peak, 'Sun', ()=>{ const m=modelAt(O('Moon'),se.peak,geom), s=modelAt(O('Sun'),se.peak,geom), sp=angSec(m.dir,s.dir)/3600;
    const km=m.dist*AU_KM, ks=s.dist*AU_KM, lim=(Math.asin(6378.137/km)+Math.asin(695700/ks)+Math.asin(1737.4/km))/DEG;
    return [`Sun–Moon separation from Earth's centre in this model: ${sp.toFixed(3)}°, inside the ${lim.toFixed(3)}° needed for an eclipse somewhere on Earth`, sp<lim]; }, 0.000694444);
  const le=A.SearchLunarEclipse(t0); add(`Lunar eclipse (${le.kind})`, le.peak, 'Moon', ()=>{ const m=modelAt(O('Moon'),le.peak,geom), s=modelAt(O('Sun'),le.peak,geom), sp=180-angSec(m.dir,s.dir)/3600;
    const km=m.dist*AU_KM, ks=s.dist*AU_KM, pen=1.02*(Math.asin(6378.137/km)+Math.asin(6378.137/ks)+Math.asin(695700/ks))/DEG+Math.asin(1737.4/km)/DEG;
    return [`Moon's distance from the point opposite the Sun in this model: ${sp.toFixed(3)}°, inside Earth's shadow (${pen.toFixed(3)}°)`, sp<pen]; }, 0.000694444);
  const y=t0.date.getUTCFullYear();
  [A.Seasons(y),A.Seasons(y+1)].flatMap(S=>[[S.mar_equinox,'March equinox',0],[S.jun_solstice,'June solstice',90],[S.sep_equinox,'September equinox',180],[S.dec_solstice,'December solstice',270]])
    .filter(x=>x[0].ut>t0.ut).slice(0,2).forEach(([t,nm,L])=>add(nm, t, 'Sun', ()=>{ const l=norm(lonAt('Sun',t)); return [`Sun's ecliptic longitude in this model: ${l.toFixed(4)}° (defined as ${L}°)`, Math.abs(dl(l,L))<.01]; }));
  for(const b of ['Mercury','Venus']){ const e=A.SearchMaxElongation(b,t0); add(`${b} at greatest ${e.visibility} elongation`, e.time, b, ()=>{ const el=sepAt(b,'Sun',e.time); return [`Angle from the Sun in this model: ${el.toFixed(4)}° (ephemeris: ${e.elongation.toFixed(4)}°)`, Math.abs(el-e.elongation)<.01]; }); }
  for(const b of ['Mars','Jupiter','Saturn']){ const t=A.SearchRelativeLongitude(b,0,t0); add(`${b} at opposition`, t, b, ()=>{ const d=Math.abs(dl(lonAt(b,t),lonAt('Sun',t))); return [`${b} − Sun longitude in this model: ${d.toFixed(3)}°`, Math.abs(d-180)<.05]; }); }
  for(const b of ['Mercury','Venus']){ const tr=A.SearchTransit(b,t0); add(`Transit of ${b} across the Sun`, tr.peak, b, ()=>{ const s=sepAt(b,'Sun',tr.peak)*60; return [`Separation from the Sun's centre in this model: ${s.toFixed(2)}′ (ephemeris: ${tr.separation.toFixed(2)}′; the Sun's radius is about 16′)`, Math.abs(s-tr.separation)<.2]; }, 0.0104); }
  const ap=A.SearchLunarApsis(t0), near=ap.kind===0; add(near?'Moon at perigee (closest to Earth)':'Moon at apogee (farthest from Earth)', ap.time, 'Moon', ()=>{
    const d=modelAt(O('Moon'),ap.time,geom).dist*AU_KM, dm=withTime(A.MakeTime(ap.time.ut-1/24),()=>modelAt(O('Moon'),A.MakeTime(ap.time.ut-1/24),geom).dist*AU_KM), dp=withTime(A.MakeTime(ap.time.ut+1/24),()=>modelAt(O('Moon'),A.MakeTime(ap.time.ut+1/24),geom).dist*AU_KM);
    compute(ap.time); const ext = near ? (d<dm && d<dp) : (d>dm && d>dp);
    return [`Moon's distance in this model: ${Math.round(d).toLocaleString()} km, ${near?'smaller':'larger'} than an hour before (${Math.round(dm).toLocaleString()} km) and after (${Math.round(dp).toLocaleString()} km)`, ext]; });
  out.sort((a,b)=>a.t.ut-b.t.ut); return out;
}
function runEvents(){ const box=$('c-events'); box.innerHTML='<p class="note">Searching…</p>';
  setTimeout(()=>{ const t0=calcTime(), geom=$('c-geom').value, evs=eventsFrom(t0,geom);
    box.innerHTML=`<div class="evl">${evs.map((e,k)=>`<div class="evr"><div class="evw"><b>${e.name}</b><span>${fUT(e.t)}</span></div><div class="evc"><span class="${e.ok?'y':'n'}">${e.ok?'✓':'✗'}</span> ${e.check}</div><button class="btn sm" type="button" data-evk="${k}">Show</button></div>`).join('')}</div>`;
    box.querySelectorAll('[data-evk]').forEach(b=>b.onclick=()=>{ const e=evs[+b.dataset.evk]; closeCalc(); if(state.cTarget>.5) setCentre('Earth');
      state.ut=e.t.ut-(e.rate&&e.rate<.01? 0.03 : 0.25); select(e.body); focusOn(e.body); setRate(e.rate||.0416667); state.playing=true; $('t-play').textContent='Pause'; toast(`${e.name} · ${fUT(e.t)}`,5000); });
  }, 30); }
function openCalc(){ buildCalc(); $('calc').hidden=false; $('c-geom').value = state.uTarget>.5 ? 'round' : 'flex';
  if(!$('c-time').value) $('c-time').value=A.MakeTime(state.ut).date.toISOString().slice(0,16);
  runCalc(); runEvents(); $('calc').querySelector('.doc').focus(); }
function closeCalc(){ $('calc').hidden=true; }
$('open-calc').onclick=openCalc; $('calc-x').onclick=closeCalc;
$('calc').addEventListener('click',e=>{ if(e.target.id==='calc') closeCalc(); });
addEventListener('keydown',e=>{ if(e.key==='Escape' && !$('calc').hidden){ closeCalc(); e.stopImmediatePropagation(); } }, true);
// --- validation used for the paper: many random epochs, both geometries --------------------------------
window.__calc={CALC_OBJ, modelVector, helioRead, SB, sceneVector, modelRead, dispPoint, compute, state};
window.__validate=(n=120)=>{ const res={epochs:n, maxDirMas:{flex:0,round:0}, maxRelDist:{flex:0,round:0}, worst:null, flex:{epochs:0,worstMiss:0,crossings:0}, events:[]};
  const objs=CALC_OBJ.filter((o,k)=>o.type!=='star' || k%3===0).filter((o,k)=>o.type!=='sb' || k%2===0);
  for(let k=0;k<n;k++){ const t=A.MakeTime(-36525+73050*(k+.5)/n); compute(t);
    for(const o of objs){ const H=helioRead(o,t); for(const geom of ['flex','round']){ const M=modelAt(o,t,geom); const a=angSec(M.dir,H.dir)*1000;
      if(a>res.maxDirMas[geom]){ res.maxDirMas[geom]=a; if(geom==='round') res.worst=`${o.label} ${t.date.toISOString().slice(0,10)}`; }
      if(isFinite(H.dist)){ const r=Math.abs(M.dist-H.dist)/H.dist; if(r>res.maxRelDist[geom]) res.maxRelDist[geom]=r; } } } }
  for(let k=0;k<60;k++){ compute(A.MakeTime(-36525+73050*(k+.5)/60)); updateFlex(); const c=window.__flexCheck(); res.flex.epochs++; res.flex.worstMiss=Math.max(res.flex.worstMiss,c.worstMiss); res.flex.crossings+=c.crossings; }
  const t0=A.MakeTime(new Date('2026-11-02T00:00:00Z')); res.events=eventsFrom(t0,'flex').map(e=>({name:e.name, t:e.t.date.toISOString(), ok:e.ok, check:e.check})); res.failed=res.events.filter(e=>!e.ok);
  compute(A.MakeTime(state.ut)); updateFlex(); return res; };

select('Venus');
$('right').classList.add('min');
earthLbl.classList.add('ctr');
document.getElementById('loading').hidden=true;
requestAnimationFrame(tick);
