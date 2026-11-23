// @ts-nocheck
/* Personaggio "Atleta flat" (proposta 2): stesse pose e stesso scheletro di figure.js (skel),
   ma disegnato a pezzi rigidi senza contorno nero, corpo grigio uniforme e quasi senza dettagli,
   così gli unici elementi colorati sono i muscoli che lavorano (dentro la sagoma, con un bordo scuro).
   Ogni pezzo vive in un sistema locale: x lungo l'osso (0 → lunghezza), y perpendicolare.
   sgn = -1: il lato anatomico anteriore è y negativo (gambe, braccia); sgn = +1 per il busto. */

const C = {
  skin: "var(--fl-skin,#d3d9df)", skinFar: "var(--fl-skinFar,#b9c1c9)", shade: "var(--fl-shade,#c3cad1)", shadeFar: "var(--fl-shadeFar,#b3bbc3)",
  hair: "var(--fl-hair,#9aa3ad)", shorts: "var(--fl-shorts,#aeb7c0)", shortsFar: "var(--fl-shortsFar,#99a3ad)",
  shoe: "var(--fl-shoe,#aeb7c0)", shoeFar: "var(--fl-shoeFar,#99a3ad)", sole: "var(--fl-sole,#8a949e)", eye: "var(--fl-eye,#7d8791)",
  mus: "var(--mus,#e8333a)", mus2: "var(--mus2,#ff9f1a)", edge: "var(--mus-edge,#a3161c)", edge2: "var(--mus2-edge,#b86a00)",
};
const fx = n => n.toFixed(2);
const deg = r => r * 180 / Math.PI;

/* curva chiusa morbida (Catmull-Rom → Bézier) */
function smooth(P, closed = true) {
  const n = P.length; if (n < 3) return "";
  const g = i => P[(i + n) % n];
  let d = `M${fx(P[0][0])} ${fx(P[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = closed ? g(i - 1) : P[Math.max(0, i - 1)], p1 = g(i), p2 = g(i + 1), p3 = closed ? g(i + 2) : P[Math.min(n - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${fx(c1[0])} ${fx(c1[1])} ${fx(c2[0])} ${fx(c2[1])} ${fx(p2[0])} ${fx(p2[1])}`;
  }
  return d + (closed ? "Z" : "");
}
/* profilo: [[t, larghezza anteriore, larghezza posteriore], ...] */
function at(prof, t) {
  return atRaw(prof, t).map((v, i) => i ? v * W : v);
}
const W = 1.15;
function atRaw(prof, t) {
  if (t <= prof[0][0]) return prof[0];
  for (let i = 1; i < prof.length; i++) if (t <= prof[i][0]) {
    const a = prof[i - 1], b = prof[i], u = (t - a[0]) / (b[0] - a[0]), e = .5 - .5 * Math.cos(Math.PI * u);
    return [t, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
  }
  return prof[prof.length - 1];
}
const TS = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1];
/* sagoma a capsula: bordo anteriore, punta arrotondata, bordo posteriore */
function silhouette(len, prof, sgn) {
  const fr = TS.map(t => { const w = at(prof, t); return [t * len, -sgn * w[1]]; });
  const bk = TS.map(t => { const w = at(prof, t); return [t * len, sgn * w[2]]; }).reverse();
  const e0 = at(prof, 0), e1 = at(prof, 1);
  return [[-(e0[1] + e0[2]) * .42, 0], ...fr, [len + (e1[1] + e1[2]) * .42, 0], ...bk];
}
/* fascia lungo un lato: da frazione a0 a a1 della larghezza, tra t0 e t1 (rastremata alle punte) */
function band(len, prof, sgn, side, t0, t1, a0, a1, taper = true) {
  const n = 8, out = [], inn = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + (t1 - t0) * i / n, w = at(prof, Math.min(1, Math.max(0, t)));
    const k = taper ? Math.sin(Math.PI * i / n) ** .55 : 1;
    const W = side === "f" ? -sgn * w[1] : sgn * w[2];
    const mid = (a0 + a1) / 2;
    out.push([t * len, W * (mid + (a1 - mid) * k)]);
    inn.push([t * len, W * (mid + (a0 - mid) * k)]);
  }
  return [...out, ...inn.reverse()];
}
const frame = (A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1]; return { len: Math.hypot(dx, dy) || .001, ang: deg(Math.atan2(dy, dx)) }; };
const tr = (A, ang) => `translate(${fx(A[0])} ${fx(A[1])}) rotate(${fx(ang)})`;
const path = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const lvl = (mus, name) => mus.p.includes(name) ? 1 : mus.s.includes(name) ? 2 : 0;
function musPath(pts, mus, name, op) {
  const l = lvl(mus, name); if (!l) return "";
  const a = .6 + .4 * op;
  return path(smooth(pts), l === 1 ? C.mus : C.mus2, `fill-opacity="${fx(l === 1 ? a : a * .9)}" stroke="${l === 1 ? C.edge : C.edge2}" stroke-width=".6" stroke-linejoin="round"`);
}

/* ---------- profili (unità dello scheletro: coscia 32, gamba 32, busto 40, braccio 24, avambraccio 22) ---------- */
const P_THIGH = [[0, 7.6, 8.6], [.22, 8.8, 9.2], [.5, 7.9, 7.8], [.8, 6, 5.6], [1, 4.9, 4.9]];
const P_SHIN = [[0, 4.6, 4.8], [.18, 4.3, 6.9], [.42, 3.9, 6.2], [.72, 3, 3.6], [1, 2.6, 3]];
const P_TORSO = [[0, 8.2, 9.2], [.12, 7.4, 9.4], [.38, 7.2, 8.2], [.6, 8.4, 8.8], [.78, 10.4, 9.8], [.92, 9.4, 8.6], [1, 7.2, 7]];
const P_UARM = [[0, 5.7, 5.9], [.3, 5.4, 5.8], [.72, 4.3, 4.6], [1, 3.6, 3.7]];
const P_FARM = [[0, 3.8, 3.9], [.25, 4.3, 4.1], [.7, 3.1, 3], [1, 2.5, 2.5]];

/* ---------- pezzi ---------- */
function limbSeg(A, B, prof, sgn, far, muscles, mus, op, extra = "") {
  const { len, ang } = frame(A, B);
  const sil = silhouette(len, prof, sgn);
  let o = path(smooth(sil), far ? C.skinFar : C.skin);
  o += path(smooth(band(len, prof, sgn, "b", -.02, 1.02, .45, 1, false)), far ? C.shadeFar : C.shade, `fill-opacity=".6"`);
  muscles.forEach(([name, side, t0, t1, a0, a1]) => { o += musPath(band(len, prof, sgn, side, t0, t1, a0, a1), mus, name, op); });
  return `<g transform="${tr(A, ang)}">${o}${extra}</g>`;
}
function thigh(s, i, far, mus, op) {
  const L = s.legs[i]; if (!L) return "";
  return limbSeg(s.P, L.k, P_THIGH, -1, far, [
    ["quadricipiti", "f", .12, .9, .05, .9], ["femorali", "b", .2, .88, .05, .88], ["adduttori", "b", .04, .62, -.62, .3],
  ], mus, op);
}
function shin(s, i, far, mus, op) {
  const L = s.legs[i]; if (!L) return "";
  return limbSeg(L.k, L.a, P_SHIN, -1, far, [["polpacci", "b", .05, .62, .08, .92], ["tibiale", "f", .08, .72, .1, .85]], mus, op);
}
function shoe(s, i, far) {
  const L = s.legs[i]; if (!L) return "";
  const { ang } = frame(L.a, L.toe);
  const up = [[-4.4, -2.6], [-4.8, .8], [-3.2, 2.2], [12.8, 2.2], [14.2, .8], [13, -1.4], [8, -3], [3, -5.6], [-1.6, -7]];
  const sole = [[-4.8, 1], [14.4, 1], [14.3, 2.2], [12.8, 3], [-3.4, 3], [-5, 2.2]];
  return `<g transform="${tr(L.a, ang)}">${path(smooth(up), far ? C.shoeFar : C.shoe)}${path(smooth(sole), C.sole, far ? `fill-opacity=".75"` : "")}</g>`;
}
function shorts(s, i, far, mus, op) {
  const L = s.legs[i]; if (!L) return "";
  const { len, ang } = frame(s.P, L.k);
  const pr = P_THIGH.map(([t, a, b]) => [t, a + .9, b + 1]);
  const n = [[-6, -5], ...[0, .1, .2, .3, .38].map(t => [t * len, at(pr, t)[1]]), [.44 * len, at(pr, .44)[1]], [.46 * len, 0], [.44 * len, -at(pr, .44)[2]],
    ...[.38, .3, .2, .1, 0].map(t => [t * len, -at(pr, t)[2]]), [-6, 5]];
  const shape = n.map(([x, y]) => [x, -y]); // sgn = -1: anteriore = y negativo
  let o = path(smooth(shape), far ? C.shortsFar : C.shorts);
  // glutei visti "in trasparenza" sui pantaloncini aderenti
  if (!far) o += musPath([[-6, 3], [-2, 9.4], [5, 10.4], [10.5, 8.8], [12, 5], [6, 3.2], [0, 2.4]], mus, "glutei", op * .9);
  return `<g transform="${tr(s.P, ang)}">${o}</g>`;
}
function torso(s, mus, op) {
  const { len, ang } = frame(s.P, s.S);
  const sgn = 1, sil = silhouette(len, P_TORSO, sgn);
  let o = path(smooth(sil), C.skin);
  o += path(smooth(band(len, P_TORSO, sgn, "b", -.02, 1.02, .45, 1, false)), C.shade, `fill-opacity=".6"`);
  [["addominali", "f", .1, .55, .1, .92], ["obliqui", "f", .05, .5, -.35, .18], ["pettorali", "f", .6, .92, .12, .95],
   ["erettori", "b", .02, .6, .05, .92], ["dorsali", "b", .45, .86, .12, .95], ["trapezi", "b", .82, 1.04, .02, .85]]
    .forEach(([name, side, t0, t1, a0, a1]) => { o += musPath(band(len, P_TORSO, sgn, side, t0, t1, a0, a1), mus, name, op); });
  // vita dei pantaloncini sul bacino
  const wb = [[-7.5, -9.6], [6.2, -8.8], [6.6, 0], [6.2, 9.8], [-7.5, 10.4]];
  o += path(smooth(wb), C.shorts);
  return `<g transform="${tr(s.P, ang)}">${o}</g>`;
}
function neckHead(s) {
  const { len, ang } = frame(s.S, s.Hd);
  // collo: dalla spalla verso la testa
  const neck = [[-1, -4.2], [len * .55, -3.4], [len * .62, 0], [len * .55, 3.6], [-1, 4.8]];
  let o = `<g transform="${tr(s.S, ang)}">${path(smooth(neck), C.skin)}${path(smooth([[0, 1.4], [len * .5, 1.6], [len * .5, 3.4], [0, 4.6]]), C.shade, `fill-opacity=".5"`)}</g>`;
  // testa: sistema con y verso il basso del viso, x verso lo sguardo
  const a = ang + 90; // ang punta "su" lungo il collo; ruoto per avere lo sguardo lungo x
  const skull = [[-8.2, -1], [-7, -6.6], [-1.6, -9.6], [4.6, -8.6], [8.4, -4.2], [9.2, .6], [10.2, 3], [9, 4.2], [8.6, 6.6], [5.6, 9.4], [.6, 9.6], [-4.2, 7], [-7.4, 3.6]];
  const hair = [[-8.8, -.4], [-7.6, -7.2], [-1.8, -10.6], [5, -9.6], [9, -5], [7.2, -4.6], [3.4, -6.2], [-1.2, -5.6], [-3.6, -2.4], [-5.6, 1.6]];
  let h = path(smooth(skull), C.skin);
  h += path(smooth(hair), C.hair);
  h += `<circle cx="5.6" cy="-.4" r="1" fill="${C.eye}"/>`;
  o += `<g transform="${tr(s.Hd, a)}">${h}</g>`;
  return o;
}
function arm(s, i, far, mus, op) {
  const A = s.arms[i]; if (!A) return "";
  let o = limbSeg(s.S, A.e, P_UARM, -1, far, [
    ["deltoidi", "f", -.12, .36, -.6, .96], ["deltoidi", "b", -.12, .36, -.6, .96], ["bicipiti", "f", .3, .9, .08, .9], ["tricipiti", "b", .22, .9, .08, .9],
  ], mus, op);
  o += limbSeg(A.e, A.h, P_FARM, -1, far, [["avambracci", "f", .04, .66, -.5, .9], ["avambracci", "b", .04, .66, -.5, .9]], mus, op);
  const { ang } = frame(A.e, A.h);
  const fist = [[-1.4, -3.2], [2.6, -3.4], [4.6, -1.6], [4.6, 1.8], [2.4, 3.4], [-1.4, 3]];
  o += `<g transform="${tr(A.h, ang)}">${path(smooth(fist), far ? C.skinFar : C.skin)}${path(smooth([[1, -3.6], [3.4, -3.8], [3.6, -2], [1.4, -1.8]]), far ? C.shadeFar : C.shade, `fill-opacity=".8"`)}</g>`;
  return o;
}

/** Disegna l'atleta flat: s = scheletro da skel(), mus = {p,s}, op = intensità dei muscoli (0–1). */
function heroFlat(s, mus, op) {
  let o = "";
  o += arm(s, 1, true, mus, op);
  o += thigh(s, 1, true, mus, op) + shin(s, 1, true, mus, op) + shoe(s, 1, true) + shorts(s, 1, true, mus, op);
  o += torso(s, mus, op);
  o += thigh(s, 0, false, mus, op) + shin(s, 0, false, mus, op) + shoe(s, 0, false) + shorts(s, 0, false, mus, op);
  o += neckHead(s);
  o += arm(s, 0, false, mus, op);
  return o;
}

export { heroFlat };
