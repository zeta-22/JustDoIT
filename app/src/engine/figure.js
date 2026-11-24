// @ts-nocheck
/* Motore figure: scheletro 2D (pose A/B per esercizio, IK), personaggio stile fumetto, mappa muscoli.
   Le pose degli esercizi sono in FIG; ogni esercizio = poses[] + tempi + attrezzi (props). */
/* ---------- geometria figura ---------- */
const L={th:32,sh:32,to:40,ua:24,fo:22,hr:9,nk:4,ft:11};
const R=d=>d*Math.PI/180;
const clone=o=>JSON.parse(JSON.stringify(o));
const mod=(A,f)=>{const B=clone(A);f(B);return B;};
function ik(root,tg,l1,l2,bend){
  let dx=tg[0]-root[0],dy=tg[1]-root[1],d=Math.hypot(dx,dy);const mx=l1+l2-0.01;
  if(d>mx){tg=[root[0]+dx/d*mx,root[1]+dy/d*mx];dx=tg[0]-root[0];dy=tg[1]-root[1];d=mx;}
  d=Math.max(d,Math.abs(l1-l2)+0.01);
  const base=Math.atan2(dy,dx);
  const a=Math.acos(Math.min(1,Math.max(-1,(l1*l1+d*d-l2*l2)/(2*l1*d))));
  const c1=[root[0]+l1*Math.cos(base+a),root[1]+l1*Math.sin(base+a)];
  const c2=[root[0]+l1*Math.cos(base-a),root[1]+l1*Math.sin(base-a)];
  const m=[(root[0]+tg[0])/2,(root[1]+tg[1])/2];
  const s=j=>(j[0]-m[0])*bend[0]+(j[1]-m[1])*bend[1];
  return [s(c1)>=s(c2)?c1:c2,tg];
}
function skel(P){
  const s={P:P.hip};const t=P.t||0;
  s.S=[P.hip[0]+L.to*Math.sin(R(t)),P.hip[1]-L.to*Math.cos(R(t))];
  const ht=t+(P.hd||0);
  s.Hd=[s.S[0]+(L.nk+L.hr)*Math.sin(R(ht)),s.S[1]-(L.nk+L.hr)*Math.cos(R(ht))];
  s.sp=P.sp||0;
  s.legs=P.legs.map(l=>{const [k,a]=ik(s.P,l.f,L.th,L.sh,l.b||[1,0]);const fa=(l.fa===undefined?90:l.fa);
    return {k,a,toe:[a[0]+L.ft*Math.sin(R(fa)),a[1]+L.ft*Math.cos(R(fa))]};});
  s.arms=P.arms.map(m=>{
    if(m.h){const [e,h]=ik(s.S,m.h,L.ua,L.fo,m.b||[0,1]);return {e,h};}
    const e=[s.S[0]+L.ua*Math.sin(R(m.u)),s.S[1]+L.ua*Math.cos(R(m.u))];
    return {e,h:[e[0]+L.fo*Math.sin(R(m.f)),e[1]+L.fo*Math.cos(R(m.f))]};});
  return s;
}
const DEF={fa:90,hd:0,sp:0,t:0};
function lerp(a,b,t){
  if(typeof a==="number")return a+(b-a)*t;
  if(Array.isArray(a))return a.map((v,i)=>lerp(v,b[i],t));
  if(a&&typeof a==="object"){const o={};const keys=new Set([...Object.keys(a),...Object.keys(b)]);
    keys.forEach(k=>{const av=k in a?a[k]:DEF[k],bv=k in b?b[k]:DEF[k];o[k]=(av===undefined)?bv:(bv===undefined?av:lerp(av,bv,t));});return o;}
  return a;
}
const f=n=>n.toFixed(1);
const pts=a=>a.map(p=>f(p[0])+","+f(p[1])).join(" ");
function pt(s,ref){
  if(Array.isArray(ref))return ref;
  const m={k0:()=>s.legs[0].k,h0:()=>s.arms[0].h,h1:()=>s.arms[1].h,e0:()=>s.arms[0].e,a0:()=>s.legs[0].a,a1:()=>s.legs[1].a,S:()=>s.S,P:()=>s.P,Hd:()=>s.Hd};
  return m[ref]();
}
/* ---------- attrezzi ---------- */
const PROP={
  bench:p=>`<rect class="pf" x="${p.x}" y="${p.y}" width="${p.w}" height="5" rx="1.5"/><line class="pl" x1="${p.x+5}" y1="${p.y+5}" x2="${p.x+5}" y2="130"/><line class="pl" x1="${p.x+p.w-5}" y1="${p.y+5}" x2="${p.x+p.w-5}" y2="130"/>`,
  box:p=>`<rect class="pf" x="${p.x}" y="${p.y}" width="${p.w}" height="${130-p.y}" rx="2"/>`,
  wall:p=>`<rect class="pf" x="${p.x-8}" y="0" width="8" height="130"/>`,
  post:p=>`<rect class="pf" x="${p.x}" y="${p.y}" width="5" height="${130-p.y}" rx="1"/>`,
  column:p=>`<rect class="pf" x="${p.x}" y="4" width="11" height="126" rx="2"/><circle class="pk" cx="${p.px}" cy="${p.py}" r="3.2"/>`,
  bar:p=>`<line class="pl" x1="${p.x1}" y1="${p.y}" x2="${p.x2}" y2="${p.y}" style="stroke-width:3.5"/><line class="pl" x1="${p.x1}" y1="${p.y-6}" x2="${p.x1}" y2="${p.y}"/><line class="pl" x1="${p.x2}" y1="${p.y-6}" x2="${p.x2}" y2="${p.y}"/>`,
  db:(p,s)=>{const h=pt(s,p.at);return `<line class="pl" x1="${f(h[0]-8)}" y1="${f(h[1])}" x2="${f(h[0]+8)}" y2="${f(h[1])}" style="stroke-width:2.6"/><rect class="pk" x="${f(h[0]-11)}" y="${f(h[1]-6)}" width="4.5" height="12" rx="1"/><rect class="pk" x="${f(h[0]+6.5)}" y="${f(h[1]-6)}" width="4.5" height="12" rx="1"/>`;},
  kb:(p,s)=>{const h=pt(s,p.at);const dy=p.up?-9:9;let c=[h[0],h[1]+dy];if(p.al){const e=s.arms[0].e,dx=h[0]-e[0],dd=h[1]-e[1],l=Math.hypot(dx,dd)||1;c=[h[0]+dx/l*8,h[1]+dd/l*8];}return `<circle class="pk" cx="${f(c[0])}" cy="${f(c[1])}" r="6.5"/><path class="pl" d="M${f(h[0]-4)} ${f(c[1]-(p.up?-4:4))} Q ${f(h[0])} ${f(h[1]-(p.up?-1:1)*3)} ${f(h[0]+4)} ${f(c[1]-(p.up?-4:4))}"/>`;},
  cable:(p,s)=>{const h=pt(s,p.at);return `<line class="cable" x1="${p.from[0]}" y1="${p.from[1]}" x2="${f(h[0])}" y2="${f(h[1])}" ${p.dash?'stroke-dasharray="3 3"':''}/>`;},
  rope:(p,s)=>{const a=s.arms[0].h,b=s.arms[1].h;return `<line class="pl" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1]+3)}"/>`;},
  lm:(p,s)=>{const h=pt(s,p.at),pv=p.pivot;const dx=h[0]-pv[0],dy=h[1]-pv[1],d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d;
    const end=[h[0]+ux*6,h[1]+uy*6],pl=[h[0]-ux*15,h[1]-uy*15];
    return `<line class="pl" x1="${pv[0]}" y1="${pv[1]}" x2="${f(end[0])}" y2="${f(end[1])}" style="stroke-width:3.2"/><circle class="pk" cx="${f(pl[0])}" cy="${f(pl[1])}" r="9"/>`;},
  arrow:(p,s,ph)=>{const a=p.from,b=p.to;const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d;
    const w1=[b[0]-ux*4-uy*3,b[1]-uy*4+ux*3],w2=[b[0]-ux*4+uy*3,b[1]-uy*4-ux*3];
    const op=p.pulse?(0.35+0.65*(0.5+0.5*Math.sin(ph*6.283*1.2))):1;
    return `<g style="opacity:${op.toFixed(2)}"><path class="arrow" d="M${a[0]} ${a[1]} L${b[0]} ${b[1]} M${f(w1[0])} ${f(w1[1])} L${b[0]} ${b[1]} L${f(w2[0])} ${f(w2[1])}"/></g>`;},
  plate:(p,s)=>{const h0=pt(s,p.at);const h=[h0[0]+(p.dx||0),h0[1]+(p.dy||0)];const r=p.r||16;return `<circle class="pk" cx="${f(h[0])}" cy="${f(h[1])}" r="${r}"/><circle class="pf" cx="${f(h[0])}" cy="${f(h[1])}" r="${(r*.28).toFixed(1)}"/>`;},
  vrope:p=>`<line x1="${p.x}" y1="-10" x2="${p.x}" y2="130" stroke="var(--prop2)" stroke-width="3.2" stroke-linecap="round"/>`,
  incline:p=>`<line class="pl" x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" style="stroke-width:6"/><line class="pl" x1="${p.x2-6}" y1="${p.y2+3}" x2="${p.x2-6}" y2="130"/><line class="pl" x1="${p.x1+4}" y1="${p.y1}" x2="${p.x1+4}" y2="130"/>`,
  txt:p=>`<text class="ptxt" x="${p.x}" y="${p.y}" text-anchor="${p.anchor||'start'}">${p.s}</text>`
};
function limb(a,b,c,cls){return `<polyline class="fg ${cls}" points="${pts([a,b,c])}"/>`;}
function figure(s){
  let o="";
  const l1=s.legs[1],a1=s.arms[1],l0=s.legs[0],a0=s.arms[0];
  if(l1)o+=limb(s.P,l1.k,l1.a,"far")+`<line class="fg far" style="stroke-width:4" x1="${f(l1.a[0])}" y1="${f(l1.a[1])}" x2="${f(l1.toe[0])}" y2="${f(l1.toe[1])}"/>`;
  if(a1)o+=limb(s.S,a1.e,a1.h,"far")+`<circle class="hand-f" cx="${f(a1.h[0])}" cy="${f(a1.h[1])}" r="2.8"/>`;
  if(s.sp){const dx=s.S[0]-s.P[0],dy=s.S[1]-s.P[1],len=Math.hypot(dx,dy);const nx=dy/len,ny=-dx/len;
    const c=[(s.P[0]+s.S[0])/2+nx*s.sp*2,(s.P[1]+s.S[1])/2+ny*s.sp*2];
    o+=`<path class="fg near" style="stroke-width:6" d="M${f(s.P[0])} ${f(s.P[1])} Q ${f(c[0])} ${f(c[1])} ${f(s.S[0])} ${f(s.S[1])}"/>`;}
  else o+=`<line class="fg near" style="stroke-width:6" x1="${f(s.P[0])}" y1="${f(s.P[1])}" x2="${f(s.S[0])}" y2="${f(s.S[1])}"/>`;
  o+=`<line class="fg near" x1="${f(s.S[0])}" y1="${f(s.S[1])}" x2="${f((s.S[0]*.6+s.Hd[0]*.4))}" y2="${f((s.S[1]*.6+s.Hd[1]*.4))}"/>`;
  o+=`<circle class="headc" cx="${f(s.Hd[0])}" cy="${f(s.Hd[1])}" r="${L.hr}"/>`;
  if(l0)o+=limb(s.P,l0.k,l0.a,"near")+`<line class="fg near" style="stroke-width:4" x1="${f(l0.a[0])}" y1="${f(l0.a[1])}" x2="${f(l0.toe[0])}" y2="${f(l0.toe[1])}"/>`;
  if(a0)o+=limb(s.S,a0.e,a0.h,"near")+`<circle class="hand-n" cx="${f(a0.h[0])}" cy="${f(a0.h[1])}" r="2.8"/>`;
  return o;
}
function scene(ex,pose,ph,ghost){
  const s=skel(pose);let back="",front="";
  (ex.props||[]).forEach(p=>{const h=PROP[p.k](p,s,ph);if(p.z==="front")front+=h;else back+=h;});
  return {back,body:figure(s),front};
}
function render(ex,pose,ph,ghostPose){
  let g=`<line class="gnd" x1="0" y1="130" x2="200" y2="130"/>`;
  if(ghostPose){const gs=scene(ex,ghostPose,ph);g+=`<g class="ghost">${gs.back}${gs.body}${gs.front}</g>`;}
  const sc=scene(ex,pose,ph);
  return g+sc.back+sc.body+sc.front;
}

/* ---------- pose ---------- */
const STAND={hip:[100,64],t:0,legs:[{f:[102,127],b:[1,0]},{f:[97,127],b:[1,0]}],arms:[{u:0,f:0},{u:3,f:3}]};
const FIG={};
/* CARs spalla */
(()=>{const A=mod(STAND,P=>{P.arms=[{u:-15,f:-15},{u:4,f:6}];});
  FIG.cars={poses:[A,mod(A,P=>{P.arms[0]={u:195,f:195};})],t1:2.4,t2:2.4,h1:.3,h2:.3};})();
/* cat-camel */
(()=>{const A={hip:[80,97],t:69.6,sp:9,hd:48,legs:[{f:[50,127],b:[0,1],fa:-90},{f:[53,127],b:[0,1],fa:-90}],arms:[{h:[118,127],b:[-1,0]},{h:[121,127],b:[-1,0]}]};
  FIG.cat={poses:[A,mod(A,P=>{P.sp=-7;P.hd=-38;})],t1:2,t2:2,h1:.6,h2:.6};})();
/* squat */
(()=>{const A={hip:[100,64],t:0,legs:[{f:[104,127],b:[1,0]},{f:[100,127],b:[1,0]}],arms:[{u:90,f:90},{u:86,f:86}]};
  FIG.squat={poses:[A,mod(A,P=>{P.hip=[86,100];P.t=38;})],t1:3,t2:1.4,h1:.4,h2:1};})();
/* dead bug */
(()=>{const A={hip:[112,120],t:-90,legs:[{f:[144,88],b:[0,-1],fa:180},{f:[146,90],b:[0,-1],fa:180}],arms:[{u:180,f:180},{u:178,f:178}]};
  FIG.deadbug={poses:[A,mod(A,P=>{P.legs[0]={f:[174,113],b:[0,-1],fa:150};P.arms[1]={u:280,f:280};})],t1:1.8,t2:1.4,h1:.5,h2:.8};})();
/* RDL */
(()=>{const A={hip:[96,64],t:0,legs:[{f:[100,127],b:[1,0]},{f:[97,127],b:[1,0]}],arms:[{u:0,f:0},{u:2,f:2}]};
  FIG.rdl={poses:[A,mod(A,P=>{P.hip=[80,68];P.t=80;P.hd=-12;})],t1:3,t2:1.5,h1:.5,h2:.4,
  props:[{k:"db",at:"h1"},{k:"db",at:"h0",z:"front"}]};})();
/* Copenhagen */
(()=>{const B={hip:[82,102.6],t:-95,legs:[{f:[146,97],b:[0,-1],fa:160},{f:[136,127],b:[0,-1]}],arms:[{h:[66,127],b:[0,1]},{h:[84,98],b:[0,-1]}]};
  const A=mod(B,P=>{P.hip=[86,117];P.t=-75.6;P.arms[1]={h:[88,112],b:[0,-1]};});
  FIG.cop={poses:[A,B],t1:1.4,t2:1.4,h1:.6,h2:2,props:[{k:"bench",x:132,y:100,w:44}]};})();
/* bulgaro */
(()=>{const A={hip:[100,66],t:5,legs:[{f:[118,127],b:[1,0]},{f:[58,101],b:[0,1],fa:-100}],arms:[{u:0,f:0},{u:3,f:3}]};
  FIG.bss={poses:[A,mod(A,P=>{P.hip=[94,96];P.t=14;})],t1:2.4,t2:1.4,h1:.4,h2:.4,
  props:[{k:"bench",x:30,y:104,w:38},{k:"db",at:"h1"},{k:"db",at:"h0",z:"front"}]};})();
/* step-down */
(()=>{const A={hip:[96,42],t:0,legs:[{f:[96,105],b:[1,0]},{f:[120,100],b:[1,0],fa:70}],arms:[{u:60,f:75},{u:65,f:80}]};
  FIG.step={poses:[A,mod(A,P=>{P.hip=[88,72];P.t=24;P.legs[1]={f:[116,127],b:[1,0],fa:90};P.arms=[{u:85,f:90},{u:88,f:92}];})],t1:3.6,t2:1.2,h1:.5,h2:.3,
  props:[{k:"box",x:62,y:108,w:48}]};})();
/* calf raise ginocchio piegato */
(()=>{const A={hip:[100,72],t:3,legs:[{f:[102,127],b:[1,0],fa:90},{f:[82,108],b:[1,.6],fa:60}],arms:[{u:0,f:0},{h:[137,54],b:[0,1]}]};
  FIG.calf={poses:[A,mod(A,P=>{P.hip=[101,64];P.legs[0]={f:[103,119],b:[1,0],fa:40};P.legs[1].f=[83,100];P.arms[1]={h:[137,47],b:[0,1]};})],t1:1,t2:2.2,h1:.4,h2:1,
  props:[{k:"post",x:139,y:20},{k:"db",at:"h0",z:"front"}]};})();
/* tibialis */
(()=>{const A={hip:[76,70],t:-12,legs:[{f:[100,126],b:[1,0],fa:90},{f:[97,126],b:[1,0],fa:90}],arms:[{u:-5,f:-5},{u:-3,f:-3}]};
  FIG.tib={poses:[A,mod(A,P=>{P.legs[0].fa=140;P.legs[1].fa=140;})],t1:.8,t2:1.6,h1:.4,h2:.6,props:[{k:"wall",x:56}]};})();
/* rematore */
(()=>{const A={hip:[64,72],t:80,hd:8,legs:[{f:[66,127],b:[1,0]},{f:[36,101],b:[0,1],fa:-90}],arms:[{u:0,f:0},{h:[120,102],b:[0,1]}]};
  FIG.row={poses:[A,mod(A,P=>{P.arms[0]={u:-150,f:0};})],t1:1,t2:2,h1:.5,h2:.7,
  props:[{k:"bench",x:26,y:104,w:100},{k:"db",at:"h0",z:"front"}]};})();
/* landmine */
(()=>{const A={hip:[86,96],t:8,legs:[{f:[54,127],b:[0,1],fa:-90},{f:[122,127],b:[1,0]}],arms:[{h:[106,62],b:[0,1]},{u:12,f:50}]};
  FIG.lm={poses:[A,mod(A,P=>{P.arms[0]={h:[126,26],b:[0,1]};})],t1:1.2,t2:1.8,h1:.5,h2:.5,
  props:[{k:"lm",pivot:[259,127],at:"h0",z:"front"}]};})();
/* face pull */
(()=>{const A={hip:[96,64],t:-4,legs:[{f:[104,127],b:[1,0]},{f:[86,127],b:[1,0]}],arms:[{h:[138,30],b:[0,1]},{h:[136,32],b:[0,1]}]};
  FIG.face={poses:[A,mod(A,P=>{P.arms=[{h:[104,14],b:[-1,-.4]},{h:[102,16],b:[-1,-.4]}];})],t1:1,t2:1.6,h1:.4,h2:.8,
  props:[{k:"column",x:182,px:180,py:26},{k:"cable",from:[180,26],at:"h0"},{k:"rope",z:"front"}]};})();
/* farmer carry */
(()=>{const A={hip:[100,63],t:0,legs:[{f:[114,127],b:[1,0]},{f:[86,127],b:[1,0]}],arms:[{u:3,f:0},{u:-3,f:0}]};
  const M1=mod(A,P=>{P.hip=[100,61];P.legs=[{f:[100,127],b:[1,0]},{f:[101,115],b:[1,0]}];P.arms=[{u:0,f:0},{u:0,f:0}];});
  const B=mod(A,P=>{P.legs=[{f:[86,127],b:[1,0]},{f:[114,127],b:[1,0]}];P.arms=[{u:-3,f:0},{u:3,f:0}];});
  const M2=mod(A,P=>{P.hip=[100,61];P.legs=[{f:[101,115],b:[1,0]},{f:[100,127],b:[1,0]}];P.arms=[{u:0,f:0},{u:0,f:0}];});
  FIG.farmer={poses:[A,M1,B,M2],loop:.45,props:[{k:"kb",at:"h1"},{k:"kb",at:"h0",z:"front"}]};})();
/* Turkish get-up (fase 1) */
(()=>{const A={hip:[104,120],t:-90,legs:[{f:[134,127],b:[0,-1]},{f:[166,124],b:[0,-1],fa:150}],arms:[{u:180,f:180},{h:[20,125],b:[0,-1]}]};
  FIG.tgu={poses:[A,mod(A,P=>{P.hip=[104,118];P.t=-48;P.arms[1]={h:[50,126],b:[-1,0]};})],t1:2,t2:2,h1:.6,h2:.8,
  props:[{k:"kb",at:"h0",up:true,z:"front"}]};})();
/* Pallof */
(()=>{const A={hip:[104,64],t:0,legs:[{f:[110,127],b:[1,0]},{f:[98,127],b:[1,0]}],arms:[{h:[114,40],b:[0,1]},{h:[116,41],b:[0,1]}]};
  FIG.pallof={poses:[A,mod(A,P=>{P.arms=[{h:[148,34],b:[0,1]},{h:[149,35],b:[0,1]}];})],t1:1,t2:1,h1:.5,h2:1.6,
  props:[{k:"column",x:14,px:27,py:46},{k:"cable",from:[27,46],at:"h0",dash:true},{k:"txt",x:30,y:40,s:"cavo di lato"}]};})();
/* collo */
(()=>{const A={hip:[100,64],t:0,legs:[{f:[102,127],b:[1,0]},{f:[97,127],b:[1,0]}],arms:[{h:[110,9],b:[1,1]},{u:2,f:2}]};
  FIG.neck={poses:[A,mod(A,P=>{P.hd=2;})],t1:.4,t2:.4,h1:1.6,h2:1.6,
  props:[{k:"arrow",from:[140,9],to:[119,9],pulse:true,z:"front"},{k:"arrow",from:[72,9],to:[87,9],pulse:true,z:"front"},{k:"txt",x:142,y:22,s:"mano spinge",anchor:"start"},{k:"txt",x:20,y:22,s:"testa resiste"}]};})();
/* dead hang */
(()=>{const A={hip:[100,98],t:0,legs:[{f:[84,124],b:[1,0],fa:60},{f:[80,122],b:[1,0],fa:60}],arms:[{h:[104,10],b:[1,0]},{h:[98,10],b:[1,0]}]};
  FIG.hang={poses:[A,mod(A,P=>{P.hip=[100,92];P.legs=[{f:[84,118],b:[1,0],fa:60},{f:[80,116],b:[1,0],fa:60}];})],t1:1,t2:1,h1:1,h2:1,
  props:[{k:"bar",x1:66,x2:134,y:9}]};})();
/* couch stretch */
(()=>{const A={hip:[78,104],t:0,legs:[{f:[54,96],b:[0,1],fa:180},{f:[124,127],b:[1,-.3]}],arms:[{h:[108,94],b:[1,1]},{h:[110,95],b:[1,1]}]};
  FIG.couch={poses:[A,mod(A,P=>{P.hip=[81.5,107.4];P.t=-6;P.arms=[{h:[110,94],b:[1,1]},{h:[112,95],b:[1,1]}];})],t1:2,t2:2,h1:.8,h2:1.6,props:[{k:"wall",x:48}]};})();

/* ---------- gruppo 1 di animazioni nuove (approvato il 24/11, collegato in data/figures.ts) ---------- */
/* Nordic curl: ginocchia ferme sul cuscino, corpo rigido che scende in avanti */
(()=>{const A={hip:[100,94],t:0,legs:[{f:[68,126],b:[.3,1],fa:-90},{f:[66,126],b:[.3,1],fa:-90}],arms:[{u:25,f:160},{u:22,f:158}]};
  FIG.nordic={poses:[A,mod(A,P=>{P.hip=[126.2,107.6];P.t=55;P.arms=[{u:55,f:40},{u:52,f:38}];})],t1:3,t2:1.2,h1:.6,h2:.3,
  props:[{k:"box",x:56,y:116,w:16},{k:"box",x:88,y:126,w:26}]};})();
/* Hip thrust: spalle sulla panca, bacino che sale */
(()=>{const A={hip:[108,120],t:-55,hd:30,legs:[{f:[138,127],b:[0,-1]},{f:[134,127],b:[0,-1]}],arms:[{h:[106,114],b:[0,1]},{h:[104,113],b:[0,1]}]};
  FIG.hipthrust={poses:[A,mod(A,P=>{P.hip=[114,98];P.t=-82;P.hd=40;P.arms=[{h:[112,92],b:[0,1]},{h:[110,91],b:[0,1]}];})],t1:.9,t2:1.6,h1:.4,h2:.8,
  props:[{k:"bench",x:30,y:96,w:48},{k:"plate",at:"h0",dx:5,dy:-2,r:9,z:"front"}]};})();
/* Stacco con trap bar: più ginocchio dello stacco rumeno, dischi che toccano terra */
(()=>{const A={hip:[86,92],t:48,hd:-20,legs:[{f:[104,127],b:[1,0]},{f:[100,127],b:[1,0]}],arms:[{u:0,f:0},{u:2,f:2}]};
  FIG.trapbar={poses:[A,mod(A,P=>{P.hip=[98,64];P.t=2;P.hd=0;})],t1:1.2,t2:2,h1:.6,h2:.5,
  props:[{k:"plate",at:"h1"},{k:"plate",at:"h0",z:"front"}]};})();
/* Stacco rumeno monopodalico: la gamba dietro sale in linea con il busto */
(()=>{const A={hip:[98,64],t:0,legs:[{f:[100,127],b:[1,0]},{f:[94,122],b:[0,1],fa:30}],arms:[{u:0,f:0},{u:3,f:3}]};
  FIG.slrdl={poses:[A,mod(A,P=>{P.hip=[86,70];P.t=78;P.hd=-10;P.legs[1]={f:[26,82],b:[0,1],fa:0};})],t1:2.2,t2:1.4,h1:.5,h2:.4,
  props:[{k:"db",at:"h0",z:"front"}]};})();
/* Kettlebell swing: cerniera d'anca e slancio fino all'altezza delle spalle */
(()=>{const A={hip:[82,72],t:66,hd:-18,legs:[{f:[104,127],b:[1,0]},{f:[98,127],b:[1,0]}],arms:[{u:-24,f:-24},{u:-22,f:-22}]};
  FIG.swing={poses:[A,mod(A,P=>{P.hip=[98,64];P.t=-4;P.hd=0;P.arms=[{u:92,f:92},{u:90,f:90}];})],t1:.55,t2:.6,h1:.05,h2:.12,
  props:[{k:"kb",at:"h0",al:true,z:"front"}]};})();
/* Front squat: bilanciere sulle spalle davanti, gomiti alti, busto dritto */
(()=>{const A={hip:[100,64],t:0,legs:[{f:[104,127],b:[1,0]},{f:[100,127],b:[1,0]}],arms:[{u:95,f:268},{u:93,f:266}]};
  FIG.fsquat={poses:[A,mod(A,P=>{P.hip=[88,98];P.t=22;P.arms=[{u:110,f:285},{u:108,f:283}];})],t1:2.4,t2:1.4,h1:.5,h2:.4,
  props:[{k:"plate",at:"S",dx:8,dy:-1,r:9,z:"front"}]};})();
/* Jump squat: mezzo squat e salto, atterraggio morbido */
(()=>{const A={hip:[92,84],t:26,legs:[{f:[104,127],b:[1,0]},{f:[100,127],b:[1,0]}],arms:[{u:-35,f:-30},{u:-33,f:-28}]};
  FIG.jump={poses:[A,mod(A,P=>{P.hip=[100,56];P.t=0;P.legs=[{f:[103,119],b:[1,0],fa:40},{f:[99,119],b:[1,0],fa:40}];P.arms=[{u:120,f:130},{u:118,f:128}];})],t1:.35,t2:.7,h1:.6,h2:.12};})();
/* Mid-thigh pull isometrico: bilanciere bloccato a metà coscia, spinta contro il pavimento */
(()=>{const A={hip:[88,80],t:28,hd:-6,legs:[{f:[104,127],b:[1,0]},{f:[100,127],b:[1,0]}],arms:[{u:-4,f:-4},{u:-2,f:-2}]};
  FIG.mtp={poses:[A,mod(A,P=>{P.hip=[88,79];P.t=27;})],t1:.3,t2:.3,h1:1.4,h2:2.2,
  props:[{k:"post",x:134,y:40},{k:"plate",at:"h0",r:16,z:"front"},{k:"arrow",from:[150,100],to:[150,72],pulse:true,z:"front"},{k:"txt",x:154,y:90,s:"tira 3–5\""}]};})();
/* Panca piana: sdraiato, bilanciere dal petto a braccia tese */
(()=>{const A={hip:[112,96],t:-90,hd:0,legs:[{f:[146,127],b:[0,-1]},{f:[142,127],b:[0,-1]}],arms:[{h:[78,82],b:[0,1]},{h:[76,83],b:[0,1]}]};
  FIG.bench={poses:[A,mod(A,P=>{P.arms=[{h:[76,50],b:[0,1]},{h:[74,51],b:[0,1]}];})],t1:1,t2:1.8,h1:.5,h2:.4,
  props:[{k:"bench",x:52,y:100,w:76},{k:"plate",at:"h0",r:14,z:"front"}]};})();
/* Trazioni (anche al gi): da appeso a mento sopra la sbarra */
(()=>{const A={hip:[100,106],t:0,legs:[{f:[84,128],b:[1,0],fa:60},{f:[80,127],b:[1,0],fa:60}],arms:[{h:[112,20],b:[1,0]},{h:[106,20],b:[1,0]}]};
  FIG.pullup={poses:[A,mod(A,P=>{P.hip=[100,62];P.legs=[{f:[84,86],b:[1,0],fa:60},{f:[80,85],b:[1,0],fa:60}];P.arms=[{h:[112,20],b:[1,.6]},{h:[106,20],b:[1,.6]}];})],t1:1.1,t2:2,h1:.6,h2:.5,
  props:[{k:"bar",x1:66,x2:134,y:19}]};})();

/* ---------- gruppo 2 (approvato il 25/11, collegato in data/figures.ts) ---------- */
/* Rematore col gi: busto a 45°, gi agganciato al cavo basso, gomiti verso i fianchi */
(()=>{const A={hip:[84,68],t:45,hd:-12,legs:[{f:[102,127],b:[1,0]},{f:[96,127],b:[1,0]}],arms:[{h:[146,86],b:[0,1]},{h:[144,87],b:[0,1]}]};
  FIG.girow={poses:[A,mod(A,P=>{P.arms=[{h:[112,64],b:[-1,.3]},{h:[110,65],b:[-1,.3]}];})],t1:1,t2:1.8,h1:.4,h2:1,
  props:[{k:"column",x:182,px:180,py:100},{k:"cable",from:[180,100],at:"h0"},{k:"rope",z:"front"},{k:"txt",x:150,y:118,s:"gi sul cavo"}]};})();
/* Chest-supported row: petto sulla panca inclinata, manubri dal basso ai fianchi */
(()=>{const A={hip:[82,86],t:58,hd:-6,legs:[{f:[66,127],b:[1,0]},{f:[62,127],b:[1,0]}],arms:[{u:0,f:0},{u:2,f:2}]};
  FIG.csrow={poses:[A,mod(A,P=>{P.arms=[{u:-62,f:-5},{u:-60,f:-3}];})],t1:1,t2:1.8,h1:.4,h2:1,
  props:[{k:"incline",x1:78,y1:96,x2:120,y2:71},{k:"db",at:"h1"},{k:"db",at:"h0",z:"front"}]};})();
/* Zercher squat: bilanciere nell'incavo dei gomiti, discesa profonda */
(()=>{const A={hip:[100,64],t:2,legs:[{f:[104,127],b:[1,0]},{f:[100,127],b:[1,0]}],arms:[{u:28,f:165},{u:26,f:163}]};
  FIG.zercher={poses:[A,mod(A,P=>{P.hip=[86,100];P.t=28;P.arms=[{u:52,f:190},{u:50,f:188}];})],t1:2.4,t2:1.4,h1:.5,h2:.4,
  props:[{k:"plate",at:"e0",dx:2,r:9,z:"front"}]};})();
/* Hang power clean: dall'appeso sopra le ginocchia, estensione esplosiva, ricezione sulle spalle in mezzo squat */
(()=>{const A={hip:[88,74],t:30,hd:-8,legs:[{f:[104,127],b:[1,0]},{f:[100,127],b:[1,0]}],arms:[{u:-2,f:-2},{u:0,f:0}]};
  const X={hip:[100,58],t:-6,hd:0,legs:[{f:[104,121],b:[1,0],fa:40},{f:[100,121],b:[1,0],fa:40}],arms:[{u:-14,f:10},{u:-12,f:12}]};
  const Cc={hip:[94,82],t:10,hd:0,legs:[{f:[104,127],b:[1,0]},{f:[100,127],b:[1,0]}],arms:[{u:105,f:278},{u:103,f:276}]};
  FIG.clean={poses:[A,X,Cc,mod(Cc,P=>{P.hip=[99,64];P.t=2;})],loop:.65,props:[{k:"plate",at:"h0",r:10,z:"front"}]};})();
/* Box jump: contromovimento, salto, atterraggio morbido sul box */
(()=>{const A={hip:[70,64],t:0,legs:[{f:[74,127],b:[1,0]},{f:[70,127],b:[1,0]}],arms:[{u:4,f:4},{u:2,f:2}]};
  const D={hip:[66,84],t:30,legs:[{f:[74,127],b:[1,0]},{f:[70,127],b:[1,0]}],arms:[{u:-45,f:-40},{u:-43,f:-38}]};
  const J={hip:[104,48],t:6,legs:[{f:[122,78],b:[1,0],fa:50},{f:[118,80],b:[1,0],fa:50}],arms:[{u:150,f:160},{u:148,f:158}]};
  const Lnd={hip:[124,60],t:26,legs:[{f:[138,87],b:[1,0]},{f:[134,87],b:[1,0]}],arms:[{u:70,f:80},{u:68,f:78}]};
  FIG.boxjump={poses:[A,D,J,Lnd],loop:.6,props:[{k:"box",x:116,y:90,w:52}]};})();
/* Ab rollout: in ginocchio, la ruota va avanti tenendo il corpo rigido */
(()=>{const A={hip:[84,94],t:58,hd:-10,legs:[{f:[52,126],b:[.3,1],fa:-90},{f:[50,126],b:[.3,1],fa:-90}],arms:[{h:[120,118],b:[1,0]},{h:[118,118],b:[1,0]}]};
  FIG.rollout={poses:[A,mod(A,P=>{P.hip=[110.2,107.6];P.t=82;P.hd=-14;P.arms=[{h:[178,118],b:[0,1]},{h:[176,118],b:[0,1]}];})],t1:3,t2:2,h1:.5,h2:.5,
  props:[{k:"plate",at:"h0",dy:5,r:6.5,z:"front"},{k:"box",x:76,y:126,w:18}]};})();
/* Arrampicata alla corda: tirata con le braccia, poi le gambe risalgono e bloccano la corda */
(()=>{const A={hip:[100,96],t:-4,legs:[{f:[106,120],b:[1,0],fa:70},{f:[104,118],b:[1,0],fa:70}],arms:[{h:[108,6],b:[1,0]},{h:[108,20],b:[1,0]}]};
  FIG.rope={poses:[A,mod(A,P=>{P.hip=[100,72];P.legs=[{f:[106,96],b:[1,0],fa:70},{f:[104,94],b:[1,0],fa:70}];P.arms=[{h:[108,6],b:[1,.5]},{h:[108,20],b:[1,.5]}];})],t1:1.2,t2:1.4,h1:.6,h2:.6,
  props:[{k:"vrope",x:108}]};})();
/* Spanish squat: elastico dietro le ginocchia, tibie verticali, tenuta isometrica */
(()=>{const A={hip:[68.4,100],t:10,legs:[{f:[100,127],b:[1,0]},{f:[96,127],b:[1,0]}],arms:[{u:80,f:84},{u:78,f:82}]};
  FIG.spanish={poses:[A,mod(A,P=>{P.hip=[68.4,100.6];})],t1:.3,t2:.3,h1:1.6,h2:1.6,
  props:[{k:"column",x:182,px:180,py:95},{k:"cable",from:[180,95],at:"k0"},{k:"txt",x:120,y:84,s:"tieni 30–45\""}]};})();

/* ---------- personaggio v3: sagome continue, muscoli parametrici ---------- */
const H={skin:"var(--skin)",skinF:"var(--skinF)",shade:"var(--shade)",line:"var(--ink-line)",def:"var(--def)",shorts:"var(--shorts)",shortsF:"var(--shortsF)",shoe:"var(--shoe)",sole:"var(--sole)",hair:"var(--hair)",mus:"var(--mus)",mus2:"var(--mus2)"};
const lerpN=(a,b,t)=>a+(b-a)*t;
function prof(keys,t){ // keys [[t,wf,wb],...]
  if(t<=keys[0][0])return [keys[0][1],keys[0][2]];
  for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const a=keys[i-1],b=keys[i],u=(t-a[0])/(b[0]-a[0]);return [lerpN(a[1],b[1],u),lerpN(a[2],b[2],u)];}
  const z=keys[keys.length-1];return [z[1],z[2]];}
/* sample a joint chain; profs[i] = profile of segment i; returns list of {p,n,wf,wb,seg,t} */
function sampleChain(chain,profs,steps=10){
  const out=[];
  for(let i=0;i<chain.length-1;i++){const a=chain[i],b=chain[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;
    const n=[dy/l,-dx/l];
    for(let k=(i===0?0:1);k<=steps;k++){const t=k/steps;const [wf,wb]=prof(profs[i],t);
      out.push({p:[a[0]+dx*t,a[1]+dy*t],n:n.slice(),wf,wb,seg:i,t});}}
  // smooth normals at joints
  for(let j=1;j<out.length-1;j++){const pr=out[j-1].n,nx=out[j+1].n;if(out[j].t===1||out[j].t===0||out[j].seg!==out[j+1].seg){const m=[pr[0]+nx[0],pr[1]+nx[1]],l=Math.hypot(m[0],m[1])||1;out[j].n=[m[0]/l,m[1]/l];}}
  return out;}
function smooth(pts,closed=true){const n=pts.length;if(n<3)return "";let d=`M${f(pts[0][0])} ${f(pts[0][1])}`;
  const lim=closed?n:n-1;
  for(let i=0;i<lim;i++){const p0=pts[closed?(i-1+n)%n:Math.max(0,i-1)],p1=pts[i],p2=pts[(i+1)%n],p3=pts[closed?(i+2)%n:Math.min(n-1,i+2)];
    d+=` C${f(p1[0]+(p2[0]-p0[0])/6)} ${f(p1[1]+(p2[1]-p0[1])/6)} ${f(p2[0]-(p3[0]-p1[0])/6)} ${f(p2[1]-(p3[1]-p1[1])/6)} ${f(p2[0])} ${f(p2[1])}`;}
  return d+(closed?"Z":"");}
function outline(S,capA=true){const fr=S.map(q=>[q.p[0]+q.n[0]*q.wf,q.p[1]+q.n[1]*q.wf]),bk=S.map(q=>[q.p[0]-q.n[0]*q.wb,q.p[1]-q.n[1]*q.wb]).reverse();
  return fr.concat(bk);}
/* region on one side: side=+1 front, -1 back; a,b = inner/outer fraction of that side's width; c = center offset band (side 0) */
function region(S,seg,t0,t1,side,a,b){const sel=S.filter(q=>q.seg===seg&&q.t>=t0-1e-6&&q.t<=t1+1e-6);if(sel.length<2)return null;
  const w=q=>side>0?q.wf:side<0?q.wb:(q.wf+q.wb)/2;const sg=side===0?1:side;
  const off=(q,fr)=>{const base=side===0?(q.wf-q.wb)/2:0;const o=side===0?base+(fr-0.5)*w(q)*0.9:sg*w(q)*fr;return [q.p[0]+q.n[0]*o,q.p[1]+q.n[1]*o];};
  const n=sel.length,env=i=>.2+.8*Math.pow(Math.sin(Math.PI*(i/(n-1))),.7);
  const outer=sel.map((q,i)=>off(q,side===0?.5+(b-.5)*env(i):a+(b-a)*env(i))),inner=sel.map((q,i)=>off(q,side===0?.5-(.5-a)*env(i):a)).reverse();
  // taper ends
  return outer.concat(inner);}
function pth(d,fill,stroke,sw,extra=""){return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;}
function musLayer(regs,mus,op){let o="";regs.forEach(([name,pts])=>{if(!pts)return;const lv=mus.p.includes(name)?1:mus.s.includes(name)?2:0;
  const d=smooth(pts);
  if(lv)o+=pth(d,lv===1?H.mus:H.mus2,"none",0,`opacity="${(lv===1?op:op*.85).toFixed(2)}"`);
  o+=pth(d,"none",H.def,.75,'opacity="0.6"');});return o;}
function shadeBack(S,frac=.55){const bk=S.map(q=>[q.p[0]-q.n[0]*q.wb,q.p[1]-q.n[1]*q.wb]),in_=S.map(q=>[q.p[0]-q.n[0]*q.wb*frac,q.p[1]-q.n[1]*q.wb*frac]).reverse();
  return pth(smooth(bk.concat(in_)),H.shade,"none",0,'opacity="0.28"');}
/* profiles */
const LEG=[[[0,7.5,8],[.3,9.6,8.6],[.6,8.6,7],[.88,6.4,5.6],[1,5.2,5.4]],[[0,5,5.4],[.25,4.6,7.6],[.5,4.2,6.4],[.78,3.4,3.8],[1,3.1,3.3]]];
const ARM=[[[0,5.6,5.6],[.35,6,6.2],[.7,5,5],[1,3.8,3.8]],[[0,4,4],[.2,4.6,4.6],[.6,3.4,3.4],[1,2.7,2.7]]];
const TOR=[[[0,8.5,8],[.12,11.4,9.4],[.3,10.6,10],[.48,8.4,8.6],[.7,8.2,7.6],[.86,8.4,9.6],[1,7,9.4]]];

/* ---------- v4: due passate (contorno unito + riempimento), mani, volto, pantaloncini unici ---------- */
function grp(ds,fill){return `<g>${ds.map(d=>`<path d="${d}" fill="${H.line}" stroke="${H.line}" stroke-width="3.1" stroke-linejoin="round"/>`).join("")}${ds.map(d=>`<path d="${d}" fill="${fill}"/>`).join("")}</g>`;}
function hiFront(S,fr0=.35,fr1=.8){const a=S.map(q=>[q.p[0]+q.n[0]*q.wf*fr1,q.p[1]+q.n[1]*q.wf*fr1]),b=S.map(q=>[q.p[0]+q.n[0]*q.wf*fr0,q.p[1]+q.n[1]*q.wf*fr0]).reverse();
  return pth(smooth(a.concat(b)),"#fff","none",0,'opacity="0.13"');}
function legS(s,i){const L=s.legs[i];return L?sampleChain([s.P,L.k,L.a],LEG):null;}
function legGroup(s,i,far,mus,op){const L=s.legs[i];if(!L)return "";const S=legS(s,i);
  let o=grp([smooth(outline(S))],far?H.skinF:H.skin)+shadeBack(S)+hiFront(S);
  o+=musLayer([["quadricipiti",region(S,0,.12,.9,1,.12,.92)],["femorali",region(S,0,.12,.92,-1,.1,.9)],
    ["polpacci",region(S,1,.05,.62,-1,.1,.9)],["tibiale",region(S,1,.06,.7,1,.15,.85)],["adduttori",region(S,0,.05,.55,0,.2,.8)]],mus,op);
  // knee cap hint
  const kq=S.find(q=>q.seg===1&&q.t>0)||S[11];const kp=[L.k[0]+kq.n[0]*2.4,L.k[1]+kq.n[1]*2.4];
  o+=pth(smooth([[kp[0]-kq.n[1]*-2,kp[1]+kq.n[0]*-2],[kp[0]+kq.n[0]*1.6,kp[1]+kq.n[1]*1.6],[kp[0]-kq.n[1]*2,kp[1]+kq.n[0]*2]],false),"none",H.def,.8,'opacity=".55"');
  return o+shoeG(L,far);}
function shoeG(L,far){const ax=L.toe[0]-L.a[0],ay=L.toe[1]-L.a[1],al=Math.hypot(ax,ay)||1,ux=ax/al,uy=ay/al,nx=uy,ny=-ux;
  const P=(u,v)=>[L.a[0]+ux*u+nx*v,L.a[1]+uy*u+ny*v];
  let o=grp([smooth([P(-4.2,4.4),P(3.6,5),P(10.6,2.6),P(13.4,-.8),P(12.2,-3.4),P(-4.6,-3.4),P(-5.8,.4)])],far?H.sole:H.shoe);
  o+=pth(smooth([P(-5,-2.6),P(12.8,-2.6)],false),"none",H.sole,1.6);
  o+=pth(smooth([P(2,3.6),P(4.6,1.6)],false),"none",H.sole,.9)+pth(smooth([P(4.4,3.2),P(7,1.4)],false),"none",H.sole,.9);
  return o;}
function shortsGroup(s,Sleg,far){const dx=s.P[0]-s.S[0],dy=s.P[1]-s.S[1];const P2=[s.P[0]+dx*.13,s.P[1]+dy*.13];const T=sampleChain([s.S,P2],TOR,16);
  const ds=[];
  if(!far){const sh=T.filter(q=>q.t>=.74);ds.push(smooth(sh.map(q=>[q.p[0]+q.n[0]*(q.wf+.9),q.p[1]+q.n[1]*(q.wf+.9)]).concat(sh.map(q=>[q.p[0]-q.n[0]*(q.wb+.9),q.p[1]-q.n[1]*(q.wb+.9)]).reverse())));}
  if(Sleg){const th=Sleg.filter(q=>q.seg===0&&q.t<=.44);ds.push(smooth(th.map(q=>[q.p[0]+q.n[0]*(q.wf+.9),q.p[1]+q.n[1]*(q.wf+.9)]).concat(th.map(q=>[q.p[0]-q.n[0]*(q.wb+.9),q.p[1]-q.n[1]*(q.wb+.9)]).reverse())));}
  let o=grp(ds,far?H.shortsF:H.shorts);
  if(Sleg){const q=Sleg.filter(z=>z.seg===0&&z.t<=.44).pop();o+=pth(smooth([[q.p[0]+q.n[0]*(q.wf+.2),q.p[1]+q.n[1]*(q.wf+.2)],[q.p[0]-q.n[0]*(q.wb+.2),q.p[1]-q.n[1]*(q.wb+.2)]],false),"none","rgba(255,255,255,.28)",1.1);
    if(!far){const m=Sleg.filter(z=>z.seg===0&&z.t>=.1&&z.t<=.4);o+=pth(smooth(m.map(z=>[z.p[0]-z.n[0]*z.wb*.2,z.p[1]-z.n[1]*z.wb*.2]),false),"none","rgba(255,255,255,.12)",1);}}
  return o;}
function fist(A,far){const ux0=A.h[0]-A.e[0],uy0=A.h[1]-A.e[1],l=Math.hypot(ux0,uy0)||1,ux=ux0/l,uy=uy0/l,nx=uy,ny=-ux;
  const P=(u,v)=>[A.h[0]+ux*u+nx*v,A.h[1]+uy*u+ny*v];
  let o=grp([smooth([P(-2.6,-3.9),P(2.6,-4.4),P(6,-3),P(6.6,.6),P(5.6,3.8),P(2,4.6),P(-2.6,4)])],far?H.skinF:H.skin);
  [-1.6,.6,2.8].forEach(v=>o+=pth(smooth([P(3.4,v),P(6.2,v)],false),"none",H.def,.7,'opacity=".7"'));
  o+=pth(smooth([P(-.6,3.4),P(2.6,4.8),P(4.6,3.6)],false),"none",H.def,.8,'opacity=".75"');
  return o;}
function armGroup(s,i,far,mus,op){const A=s.arms[i];if(!A)return "";
  const S=sampleChain([s.S,A.e,A.h],ARM);
  const d0=S[0].n,dirx=A.e[0]-s.S[0],diry=A.e[1]-s.S[1],dl=Math.hypot(dirx,diry)||1,ux=dirx/dl,uy=diry/dl;
  const Q=(u,v)=>[s.S[0]+ux*u+d0[0]*v,s.S[1]+uy*u+d0[1]*v];
  const del=[[-3,-5.2],[-4.6,0],[-2.4,5.6],[3.6,6.2],[8.6,4],[10,0],[8.2,-4.2],[2.6,-6]].map(([u,v])=>Q(u*.82+1,v*.82));
  let o=grp([smooth(outline(S)),smooth(del)],far?H.skinF:H.skin)+shadeBack(S,.5)+hiFront(S,.3,.75);
  o+=musLayer([["bicipiti",region(S,0,.25,.88,1,.1,.9)],["tricipiti",region(S,0,.18,.9,-1,.1,.9)],["avambracci",region(S,1,.04,.62,0,.15,.85)]],mus,op);
  const lv=mus.p.includes("deltoidi")?1:mus.s.includes("deltoidi")?2:0;
  if(lv)o+=pth(smooth(del.map(p=>[p[0]*.88+s.S[0]*.12+ux*.6,p[1]*.88+s.S[1]*.12+uy*.6])),lv===1?H.mus:H.mus2,"none",0,`opacity="${op.toFixed(2)}"`);
  o+=pth(smooth([Q(7.6,-2.4),Q(4.6,0),Q(7.6,2.8)],false),"none",H.def,.75,'opacity=".6"');
  return o+fist(A,far);}
function torsoGroup(s,mus,op){const dx=s.P[0]-s.S[0],dy=s.P[1]-s.S[1];const P2=[s.P[0]+dx*.13,s.P[1]+dy*.13];
  const S=sampleChain([s.S,P2],TOR,16);
  const n0=S[0].n,l=Math.hypot(dx,dy),ux=-dx/l,uy=-dy/l;const Q=(u,v)=>[s.S[0]+ux*u+n0[0]*v,s.S[1]+uy*u+n0[1]*v];
  const neck=[Q(-1.5,-6.4),Q(6.6,-4.4),Q(10.4,-3),Q(10.4,3.4),Q(6,5.6),Q(-1.5,6.2)];
  let o=grp([smooth(neck),smooth(outline(S))],H.skin)+shadeBack(S,.6)+hiFront(S,.3,.78);
  o+=pth(smooth([Q(9.4,2.6),Q(5,4.4),Q(.5,5.8)],false),"none",H.def,.8,'opacity=".6"'); // collo
  o+=musLayer([["pettorali",region(S,0,.03,.3,1,.1,.95)],["addominali",region(S,0,.36,.86,1,.1,.62)],["obliqui",region(S,0,.4,.82,1,.66,.95)],
    ["dorsali",region(S,0,.14,.52,-1,.15,.9)],["erettori",region(S,0,.5,.86,-1,.08,.5)],["trapezi",region(S,0,0,.16,-1,.05,.85)]],mus,op);
  [.5,.62,.74].forEach(t=>{const q=S.find(z=>Math.abs(z.t-t)<.04);if(q)o+=pth(smooth([[q.p[0]+q.n[0]*q.wf*.15,q.p[1]+q.n[1]*q.wf*.15],[q.p[0]+q.n[0]*q.wf*.6,q.p[1]+q.n[1]*q.wf*.6]],false),"none",H.def,.75,'opacity=".6"');});
  return {o,S};}
function headG(s){const dx=s.S[0]-s.Hd[0],dy=s.S[1]-s.Hd[1],l=Math.hypot(dx,dy)||1,uy=[dx/l,dy/l],ux=[uy[1],-uy[0]];
  const F=(x,y)=>[s.Hd[0]+ux[0]*x*1.1+uy[0]*y*1.1,s.Hd[1]+ux[1]*x*1.1+uy[1]*y*1.1];
  let o=grp([smooth([F(-1,-11.6),F(6.4,-9.8),F(9.6,-5),F(10,-1.4),F(10.6,.8),F(12.6,3.2),F(10.6,5),F(10.4,6.6),F(9.6,9),F(6.8,11.6),F(2,12.2),F(-3.2,10.6),F(-8.6,4.6),F(-10.6,-2.4),F(-7.8,-9)])],H.skin);
  o+=pth(smooth([F(-3,9.4),F(2,11.4),F(6.6,10.8),F(9,8.4)],false),"none",H.shade,2.2,'opacity=".35"');   // jaw shadow
  o+=grp([smooth([F(-10.9,-1.2),F(-9.6,-8.8),F(-2.4,-13.2),F(6,-12),F(10.2,-7.6),F(8,-6.6),F(3,-8),F(-1.6,-7),F(-4.6,-5.2),F(-6.6,-.4),F(-8.6,3.2)])],H.hair);
  o+=pth(smooth([F(-3,-.4),F(-1,-1.2),F(-.6,2.8),F(-2,3.8),F(-3.2,2.6)]),H.skin,H.line,1.1)+pth(smooth([F(-2.2,.4),F(-1.4,1.6),F(-2.2,2.4)],false),"none",H.def,.7);
  const e=F(6.4,-.8);o+=`<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="1.6" ry="1.3" fill="#fff" stroke="${H.line}" stroke-width=".7"/><circle cx="${f(F(7,-.8)[0])}" cy="${f(F(7,-.8)[1])}" r=".9" fill="${H.line}"/>`;
  o+=pth(smooth([F(3.6,-3.6),F(6.4,-4.4),F(9,-3.6)],false),"none",H.line,1.6);
  o+=pth(smooth([F(10.2,1.4),F(11.4,3.4),F(10.2,4.4)],false),"none",H.def,.8);
  o+=pth(smooth([F(7.6,7.4),F(9.8,7.1)],false),"none",H.line,1);
  return o;}
function hero(s,mus,op){let o="";
  o+=armGroup(s,1,true,mus,op);
  o+=legGroup(s,1,true,mus,op)+shortsGroup(s,legS(s,1),true);
  const T=torsoGroup(s,mus,op);o+=T.o;
  o+=legGroup(s,0,false,mus,op)+shortsGroup(s,legS(s,0),false);
  const g=region(T.S,0,.8,1,-1,.08,.92);const lv=mus.p.includes("glutei")?1:mus.s.includes("glutei")?2:0;
  if(g&&lv)o+=pth(smooth(g),lv===1?H.mus:H.mus2,"rgba(255,255,255,.3)",.8,`fill-opacity="${(op*.75).toFixed(2)}"`);
  o+=headG(s);
  o+=armGroup(s,0,false,mus,op);
  return o;}

/* ---------- mappa muscoli ---------- */
const ZF=[["deltoidi","ellipse",32,54,8,9],["deltoidi","ellipse",88,54,8,9],["pettorali","ellipse",49,63,11,8.5],["pettorali","ellipse",71,63,11,8.5],
 ["bicipiti","ellipse",28,77,5,13],["bicipiti","ellipse",92,77,5,13],["avambracci","ellipse",24,120,5,17],["avambracci","ellipse",96,120,5,17],
 ["addominali","rect",51,75,18,42],["obliqui","ellipse",42,99,4.5,13],["obliqui","ellipse",78,99,4.5,13],
 ["quadricipiti","ellipse",46.5,160,7.5,23],["quadricipiti","ellipse",73.5,160,7.5,23],["adduttori","ellipse",55.5,145,3.2,13],["adduttori","ellipse",64.5,145,3.2,13],
 ["tibiale","ellipse",46,212,3.5,17],["tibiale","ellipse",74,212,3.5,17]];
const ZB=[["trapezi","poly","60,43 77,52 60,76 43,52"],["deltoidi","ellipse",32,54,8,9],["deltoidi","ellipse",88,54,8,9],
 ["dorsali","ellipse",46,88,8.5,17],["dorsali","ellipse",74,88,8.5,17],["tricipiti","ellipse",28,77,5,13],["tricipiti","ellipse",92,77,5,13],
 ["avambracci","ellipse",24,120,5,17],["avambracci","ellipse",96,120,5,17],["erettori","rect",55,76,10,48],
 ["glutei","ellipse",49,138,10.5,10],["glutei","ellipse",71,138,10.5,10],["femorali","ellipse",48,170,7.5,19],["femorali","ellipse",72,170,7.5,19],
 ["polpacci","ellipse",48,207,6,15],["polpacci","ellipse",72,207,6,15],["adduttori","ellipse",57,152,2.6,11],["adduttori","ellipse",63,152,2.6,11]];
function sil(){return `<circle class="sil" cx="60" cy="22" r="14"/><rect class="sil" x="54" y="33" width="12" height="12"/><rect class="sil" x="36" y="43" width="48" height="88" rx="13"/>
<rect class="sil" x="21" y="47" width="14" height="54" rx="7"/><rect class="sil" x="85" y="47" width="14" height="54" rx="7"/><rect class="sil" x="18" y="99" width="13" height="50" rx="6.5"/><rect class="sil" x="89" y="99" width="13" height="50" rx="6.5"/>
<rect class="sil" x="37" y="126" width="21" height="66" rx="10"/><rect class="sil" x="62" y="126" width="21" height="66" rx="10"/><rect class="sil" x="39" y="188" width="17" height="50" rx="8"/><rect class="sil" x="64" y="188" width="17" height="50" rx="8"/>`;}
function zones(Z,mp,ms){return Z.map(z=>{const c="zone"+(mp.includes(z[0])?" p":ms.includes(z[0])?" s":"");
  if(z[1]==="ellipse")return `<ellipse class="${c}" cx="${z[2]}" cy="${z[3]}" rx="${z[4]}" ry="${z[5]}"><title>${z[0]}</title></ellipse>`;
  if(z[1]==="rect")return `<rect class="${c}" x="${z[2]}" y="${z[3]}" width="${z[4]}" height="${z[5]}" rx="5"><title>${z[0]}</title></rect>`;
  return `<polygon class="${c}" points="${z[2]}"><title>${z[0]}</title></polygon>`;}).join("");}
function maps(mp,ms){return `<div class="maps"><figure><svg viewBox="0 0 120 245" role="img" aria-label="Muscoli, vista frontale">${sil()}${zones(ZF,mp,ms)}</svg><figcaption>Fronte</figcaption></figure><figure><svg viewBox="0 0 120 245" role="img" aria-label="Muscoli, vista posteriore">${sil()}${zones(ZB,mp,ms)}</svg><figcaption>Retro</figcaption></figure></div>`;}



export { L, skel, lerp, FIG, PROP, hero, maps, render };
