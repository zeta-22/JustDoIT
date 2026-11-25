// @ts-nocheck
/* Vista DI FRONTE, persona seduta a terra (per il 90/90, che di profilo e da dietro non si capisce).
   Stesso stile dell'"Atleta flat" e della vista da dietro: corpo grigio semplice, muscoli unico colore
   (rosso principali, arancio secondari). Coordinate dello schermo: "l" = gamba a sinistra di chi guarda
   (la destra della persona), "r" = a destra di chi guarda. Il pavimento sale con la distanza (camera un po' alta):
   un piede lontano, dietro la persona, sta più in alto nel disegno.
   Una posa: { legs: { l: { k, a, ft, back }, r: {...} } }: ginocchio e caviglia, ft = vettore del piede dalla caviglia,
   back = la tibia va all'indietro (si disegna dietro al corpo). viewBox come le altre figure (suolo a y=130). */

const C = {
  skin: "var(--fl-skin,#d3d9df)", shade: "var(--fl-shade,#c3cad1)", hair: "var(--fl-hair,#9aa3ad)", eye: "var(--fl-eye,#7d8791)",
  shorts: "var(--fl-shorts,#aeb7c0)", shoe: "var(--fl-shoe,#aeb7c0)", line: "var(--fl-line,#a9b2bb)",
  mus: "var(--mus,#e8333a)", mus2: "var(--mus2,#ff9f1a)", edge: "var(--mus-edge,#a3161c)", edge2: "var(--mus2-edge,#b86a00)",
};
const f = n => n.toFixed(1);
const lvl = (mus, n) => mus.p.includes(n) ? 1 : mus.s.includes(n) ? 2 : 0;
function m(mus, name, op, d) {
  const l = lvl(mus, name); if (!l || !d) return "";
  const a = .6 + .4 * op;
  return `<path d="${d}" fill="${l === 1 ? C.mus : C.mus2}" fill-opacity="${f(l === 1 ? a : a * .9)}" stroke="${l === 1 ? C.edge : C.edge2}" stroke-width=".6" stroke-linejoin="round"/>`;
}
function cap(A, B, ra, rb, fill, line = "") {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
  if (L < .5) return `<circle cx="${f(A[0])}" cy="${f(A[1])}" r="${f(Math.max(ra, rb))}" fill="${fill}" ${line}/>`;
  const nx = -dy / L, ny = dx / L;
  return `<path d="M${f(A[0] + nx * ra)} ${f(A[1] + ny * ra)} L${f(B[0] + nx * rb)} ${f(B[1] + ny * rb)} A${f(rb)} ${f(rb)} 0 0 0 ${f(B[0] - nx * rb)} ${f(B[1] - ny * rb)} L${f(A[0] - nx * ra)} ${f(A[1] - ny * ra)} A${f(ra)} ${f(ra)} 0 0 0 ${f(A[0] + nx * ra)} ${f(A[1] + ny * ra)}Z" fill="${fill}" ${line}/>`;
}
/* ellisse lungo un segmento (da t0 a t1), larga w, spostata di "off" di lato */
function seg(A, B, t0, t1, w, off = 0) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * off, ny = dx / L * off;
  const P = t => [A[0] + dx * t + nx, A[1] + dy * t + ny]; const a = P(t0), b = P(t1);
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  return len < .6 ? "" : `M${f(cx - len)} ${f(cy)} a${f(len)} ${f(w)} 0 1 0 ${f(2 * len)} 0 a${f(len)} ${f(w)} 0 1 0 ${f(-2 * len)} 0Z" transform="rotate(${f(ang)} ${f(cx)} ${f(cy)})`;
}
const HIP = { l: [92, 113], r: [108, 113] };

function shin(L, mus, op) {
  const ft = L.ft || [0, 4];
  return cap(L.k, L.a, 6, 3.6, C.skin) + cap(L.a, [L.a[0] + ft[0], L.a[1] + ft[1]], 4, 3.4, C.shoe) + m(mus, "polpacci", op, seg(L.k, L.a, .08, .6, 3.6));
}
function thigh(side, L, mus, op) {
  const H = HIP[side]; const inner = side === "l" ? -1 : 1;
  return cap(H, L.k, 8.6, 6.4, C.skin) + m(mus, "quadricipiti", op, seg(H, L.k, .3, .92, 4.2)) + m(mus, "adduttori", op, seg(H, L.k, .2, .8, 2.2, inner * 4));
}

const raised = (sd, L) => L.k[1] < HIP[sd][1] - 4; // ginocchio sopra l'anca: la coscia viene verso chi guarda
const root = (sd, L) => { const H = HIP[sd], K = L.k; return cap(H, [H[0] + (K[0] - H[0]) * .22, H[1] + (K[1] - H[1]) * .22], 8.8, 8, C.shorts); };

export function heroFront(pose, mus, op) {
  const lg = pose.legs; let o = "";
  // tibie che vanno all'indietro: dietro a tutto
  for (const sd of ["l", "r"]) if (lg[sd].back) o += shin(lg[sd], mus, op);
  // cosce appoggiate a terra, poi i pantaloncini sopra il loro attacco (i glutei, da seduti di fronte, non si vedono)
  for (const sd of ["l", "r"]) if (!raised(sd, lg[sd])) o += thigh(sd, lg[sd], mus, op);
  o += `<path d="M84 101 L116 101 L118.5 115 Q100 120.5 81.5 115Z" fill="${C.shorts}"/>`;
  for (const sd of ["l", "r"]) if (!raised(sd, lg[sd])) o += root(sd, lg[sd]);
  // busto di fronte, collo, testa
  o += `<path d="M84 70 Q100 65 116 70 L117 84 Q113 94 111 102 L113 106 L87 106 L89 102 Q87 94 83 84Z" fill="${C.skin}"/>`;
  o += m(mus, "pettorali", op, "M87 75 Q99 73 99 83 Q93 87.5 86.5 84.5Z") + m(mus, "pettorali", op, "M113 75 Q101 73 101 83 Q107 87.5 113.5 84.5Z");
  o += m(mus, "addominali", op, "M95.5 88 L104.5 88 L104 103 L96 103Z") + m(mus, "obliqui", op, "M88.5 90 Q91 97 90 104 L88 104 Q87.5 97 88.5 90Z") + m(mus, "obliqui", op, "M111.5 90 Q109 97 110 104 L112 104 Q112.5 97 111.5 90Z");
  o += `<rect x="95.5" y="59" width="9" height="12" rx="3" fill="${C.skin}"/>` + m(mus, "trapezi", op, "M96 66 Q90 69 86 70.5 Q93 72 98 70Z") + m(mus, "trapezi", op, "M104 66 Q110 69 114 70.5 Q107 72 102 70Z");
  o += `<ellipse cx="91.3" cy="54.5" rx="1.8" ry="2.8" fill="${C.skin}"/><ellipse cx="108.7" cy="54.5" rx="1.8" ry="2.8" fill="${C.skin}"/>`;
  o += `<circle cx="100" cy="53.5" r="8.6" fill="${C.skin}"/><path d="M91.4 52 Q91 44.6 100 44.6 Q109 44.6 108.6 52 Q105 47.8 100 48.2 Q95 47.8 91.4 52Z" fill="${C.hair}"/>`;
  o += `<circle cx="96.8" cy="54.2" r=".95" fill="${C.eye}"/><circle cx="103.2" cy="54.2" r=".95" fill="${C.eye}"/>`;
  // braccia in avanti all'altezza del petto, per l'equilibrio (le mani non toccano terra): viste di fronte sono corte
  for (const sd of [-1, 1]) {
    const S = [100 + sd * 16, 72], E = [100 + sd * 15, 83], H = [100 + sd * 7.5, 80]; const ln = `stroke="${C.line}" stroke-width=".9"`;
    o += cap(S, E, 5.8, 4.4, C.skin, ln) + cap(E, H, 4.2, 3, C.skin, ln) + `<circle cx="${f(H[0])}" cy="${f(H[1])}" r="3.3" fill="${C.skin}" ${ln}/>` + cap(S, E, 5, 3.8, C.skin);
    o += m(mus, "deltoidi", op, `M${f(S[0] - 6)} ${f(S[1])} a6 5.6 0 1 0 12 0 a6 5.6 0 1 0 -12 0Z`) + m(mus, "bicipiti", op, seg(S, E, .25, .9, 3));
  }
  // cosce con il ginocchio alzato: davanti al busto e alle braccia
  for (const sd of ["l", "r"]) if (raised(sd, lg[sd])) o += thigh(sd, lg[sd], mus, op) + root(sd, lg[sd]);
  // tibie davanti al corpo
  for (const sd of ["l", "r"]) if (!lg[sd].back) o += shin(lg[sd], mus, op);
  return o;
}

/* ---------- pose ---------- */
const FIGF = {};
/* 90/90 con cambio lato senza mani: gamba davanti con la tibia di traverso, gamba dietro con la tibia all'indietro;
   le ginocchia salgono insieme e scendono dall'altra parte (tergicristallo). */
(() => {
  const A = { legs: { l: { k: [64, 122], a: [96, 126.5], ft: [8, .5] }, r: { k: [140, 111], a: [131, 103], ft: [-1, -5], back: true } } };
  const B = { legs: { l: { k: [87, 98], a: [79, 127], ft: [0, 4] }, r: { k: [113, 98], a: [121, 127], ft: [0, 4] } } };
  const Cc = { legs: { r: { k: [136, 122], a: [104, 126.5], ft: [-8, .5] }, l: { k: [60, 111], a: [69, 103], ft: [1, -5], back: true } } };
  FIGF.n9090 = { poses: [A, A, B, Cc, Cc, B], loop: .8, vb: "26 30 148 115", props: [{ k: "mat" }] };
})();
/* attrezzi vista di fronte */
const PROPF = {
  /* tappetino in prospettiva: il bordo lontano è più in alto e più stretto */
  mat: () => `<path d="M34 100 L166 100 L186 131 L14 131Z" fill="var(--prop,#b9c6cf)" opacity=".35"/>`,
};
export function renderFront(ex, pose, mus, op) {
  const pr = (ex.props || []).map(p => PROPF[p.k](pose, p)).join("");
  return `<line class="gnd" x1="0" y1="130" x2="200" y2="130"/>` + pr + heroFront(pose, mus, op);
}
export { FIGF };
