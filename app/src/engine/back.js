// @ts-nocheck
/* Vista DA DIETRO, per gli esercizi che di profilo non si capiscono (extrarotazioni, band pull-apart…).
   Stesso stile dell'"Atleta flat": corpo grigio semplice, muscoli unico colore (rosso principali, arancio secondari).
   Il corpo è simmetrico: si descrive il braccio di destra del disegno, quello di sinistra è lo specchio.
   Una posa: { arm: { u:[dx,dy], f:[dx,dy] } } = direzione PROIETTATA di braccio e avambraccio (lunghezza 0–1):
   un segmento che punta in avanti (via da chi guarda) si accorcia fino quasi a sparire.
   Suolo a y=130, centro del corpo x=100 (viewBox 200×140 come le altre figure). */

const C = {
  skin: "var(--fl-skin,#d3d9df)", shade: "var(--fl-shade,#c3cad1)", far: "var(--fl-skinFar,#b9c1c9)",
  hair: "var(--fl-hair,#9aa3ad)", shorts: "var(--fl-shorts,#aeb7c0)", shoe: "var(--fl-shoe,#aeb7c0)", sole: "var(--fl-sole,#8a949e)",
  line: "var(--fl-line,#a9b2bb)", band: "var(--fl-band,#3f7fc4)", mus: "var(--mus,#e8333a)", mus2: "var(--mus2,#ff9f1a)", edge: "var(--mus-edge,#a3161c)", edge2: "var(--mus2-edge,#b86a00)",
};
const f = n => n.toFixed(1);
const UA = 24, FA = 22, SH = [116, 32];
const lvl = (mus, n) => mus.p.includes(n) ? 1 : mus.s.includes(n) ? 2 : 0;
function m(mus, name, op, d) {
  const l = lvl(mus, name); if (!l || !d) return "";
  const a = .6 + .4 * op;
  return `<path d="${d}" fill="${l === 1 ? C.mus : C.mus2}" fill-opacity="${f(l === 1 ? a : a * .9)}" stroke="${l === 1 ? C.edge : C.edge2}" stroke-width=".6" stroke-linejoin="round"/>`;
}
/* capsula da A a B con raggi ra, rb */
function cap(A, B, ra, rb, fill, line = "") {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
  if (L < .5) return `<circle cx="${f(A[0])}" cy="${f(A[1])}" r="${f(Math.max(ra, rb))}" fill="${fill}" ${line}/>`;
  const nx = -dy / L, ny = dx / L;
  return `<path d="M${f(A[0] + nx * ra)} ${f(A[1] + ny * ra)} L${f(B[0] + nx * rb)} ${f(B[1] + ny * rb)} A${f(rb)} ${f(rb)} 0 0 0 ${f(B[0] - nx * rb)} ${f(B[1] - ny * rb)} L${f(A[0] - nx * ra)} ${f(A[1] - ny * ra)} A${f(ra)} ${f(ra)} 0 0 0 ${f(A[0] + nx * ra)} ${f(A[1] + ny * ra)}Z" fill="${fill}" ${line}/>`;
}
/* ellisse lungo un segmento, da frazione t0 a t1, larga w */
function seg(A, B, t0, t1, w) {
  const P = t => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]; const a = P(t0), b = P(t1);
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  return len < .6 ? "" : `M${f(cx - len)} ${f(cy)} a${f(len)} ${f(w)} 0 1 0 ${f(2 * len)} 0 a${f(len)} ${f(w)} 0 1 0 ${f(-2 * len)} 0Z" transform="rotate(${f(ang)} ${f(cx)} ${f(cy)})`;
}
const mir = p => [200 - p[0], p[1]];

/** Punti del braccio di destra (side = 1) o sinistra (side = -1). */
export function armPts(pose, side) {
  const S = side > 0 ? SH : mir(SH); const u = pose.arm.u, fo = pose.arm.f;
  const E = [S[0] + side * u[0] * UA, S[1] + u[1] * UA]; const H = [E[0] + side * fo[0] * FA, E[1] + fo[1] * FA];
  return { S, E, H };
}

export function heroBack(pose, mus, op) {
  let o = "";
  // gambe
  for (const sd of [1, -1]) {
    const hip = [100 + sd * 7, 72], kn = [100 + sd * 8.5, 100], an = [100 + sd * 9.5, 125];
    o += cap(hip, kn, 8.5, 6.2, C.skin) + cap(kn, an, 6, 3.6, C.skin);
    o += `<path d="M${f(an[0] - 4.5)} 125 Q${f(an[0])} 131 ${f(an[0] + 4.5)} 125 L${f(an[0] + 4)} 130.5 L${f(an[0] - 4)} 130.5Z" fill="${C.shoe}"/><rect x="${f(an[0] - 4.6)}" y="129" width="9.2" height="1.8" rx=".9" fill="${C.sole}"/>`;
    o += m(mus, "femorali", op, seg(hip, kn, .3, .95, 5.2));
    o += m(mus, "adduttori", op, seg([hip[0] - sd * 4, hip[1]], [kn[0] - sd * 3, kn[1]], .25, .8, 2.4));
    o += m(mus, "polpacci", op, seg(kn, an, .05, .6, 4.6));
  }
  // pantaloncini
  o += `<path d="M84 64 L116 64 L118 84 Q109 86.5 101.5 84 L100 76 L98.5 84 Q91 86.5 82 84Z" fill="${C.shorts}"/>`;
  o += m(mus, "glutei", op, "M88 68 Q99 66 99 74 Q98 81 88 80 Q84 74 88 68Z") + m(mus, "glutei", op, "M112 68 Q101 66 101 74 Q102 81 112 80 Q116 74 112 68Z");
  // busto (a V) e collo
  o += `<path d="M84 30 Q100 25 116 30 L117 44 Q113 54 111 62 L113 66 L87 66 L89 62 Q87 54 83 44Z" fill="${C.skin}"/>`;
  o += `<path d="M100 30 L100 64" stroke="${C.shade}" stroke-width="1.4" stroke-linecap="round"/>`;
  o += m(mus, "dorsali", op, "M86 42 Q93 46 97 58 Q92 60 89 60 Q87 52 86 42Z") + m(mus, "dorsali", op, "M114 42 Q107 46 103 58 Q108 60 111 60 Q113 52 114 42Z");
  o += m(mus, "erettori", op, "M96 44 L99 44 L99 64 L96.5 64Z") + m(mus, "erettori", op, "M104 44 L101 44 L101 64 L103.5 64Z");
  o += m(mus, "obliqui", op, "M88 54 Q90 60 89 64 L87 64 Q87 59 88 54Z") + m(mus, "obliqui", op, "M112 54 Q110 60 111 64 L113 64 Q113 59 112 54Z");
  o += m(mus, "trapezi", op, "M100 22 Q104 28 114 30.5 Q106 34 103 42 L100 48 L97 42 Q94 34 86 30.5 Q96 28 100 22Z");
  o += `<rect x="95.5" y="19" width="9" height="12" rx="3" fill="${C.skin}"/>`;
  // testa vista da dietro: quasi tutta capelli
  o += `<ellipse cx="94.6" cy="15.5" rx="2" ry="3" fill="${C.skin}"/><ellipse cx="105.4" cy="15.5" rx="2" ry="3" fill="${C.skin}"/>`;
  o += `<circle cx="100" cy="13.5" r="8.6" fill="${C.skin}"/><path d="M91.6 13 Q91 4.6 100 4.6 Q109 4.6 108.4 13 Q107 19 100 18.4 Q93 19 91.6 13Z" fill="${C.hair}"/>`;
  // braccia
  for (const sd of [1, -1]) {
    const { S, E, H } = armPts(pose, sd);
    // contorno leggero: le braccia passano davanti al busto dello stesso colore
    const ln = `stroke="${C.line}" stroke-width=".9"`;
    o += cap(S, E, 5.8, 4.4, C.skin, ln) + cap(E, H, 4.2, 3, C.skin, ln) + `<circle cx="${f(H[0])}" cy="${f(H[1])}" r="3.3" fill="${C.skin}" ${ln}/>` + cap(S, E, 5, 3.8, C.skin);
    o += m(mus, "deltoidi", op, `M${f(S[0] - 6)} ${f(S[1])} a6 5.6 0 1 0 12 0 a6 5.6 0 1 0 -12 0Z`);
    o += m(mus, "tricipiti", op, seg(S, E, .25, .9, 3));
    o += m(mus, "avambracci", op, seg(E, H, .1, .7, 2.6));
  }
  return o;
}

/* ---------- pose ---------- */
const FIGB = {};
/* Extrarotazioni con elastico: gomiti attaccati ai fianchi, avambracci che dal davanti ruotano verso l'esterno */
FIGB.extrarot = {
  poses: [{ arm: { u: [.14, .99], f: [-.08, .06] } }, { arm: { u: [.16, .99], f: [.96, -.04] } }],
  t1: 1.1, t2: 3, h1: .5, h2: .6, props: [{ k: "band" }],
};
/* Band pull-apart: braccia tese davanti, si aprono a T stringendo le scapole */
FIGB.pullapart = {
  poses: [{ arm: { u: [-.12, .06], f: [-.12, .04] } }, { arm: { u: [.99, .03], f: [.99, .03] } }],
  t1: 1, t2: 2.2, h1: .5, h2: .6, props: [{ k: "band" }],
};
/* attrezzi vista da dietro */
const PROPB = {
  band: pose => { const r = armPts(pose, 1).H, l = armPts(pose, -1).H;
    return `<path d="M${f(l[0])} ${f(l[1])} Q100 ${f((l[1] + r[1]) / 2 + 3)} ${f(r[0])} ${f(r[1])}" stroke="${C.band}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; },
};
/** Disegna una posa vista da dietro: l'elastico sta davanti al corpo, quindi lo disegno PRIMA (dietro, per chi guarda). */
export function renderBack(ex, pose, mus, op) {
  const pr = (ex.props || []).map(p => PROPB[p.k](pose)).join("");
  return `<line class="gnd" x1="0" y1="130" x2="200" y2="130"/>` + pr + heroBack(pose, mus, op);
}
export { FIGB };
