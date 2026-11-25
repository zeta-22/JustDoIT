// @ts-nocheck
/* PRIMO PIANO, per i movimenti troppo piccoli per la figura intera: il piede (short foot) visto dal lato interno
   e la mano (estensioni delle dita con elastico) vista dal dorso. Stesso stile dell'"Atleta flat": pelle grigia,
   muscoli unico colore (rosso principali, arancio secondari); l'elastico è blu.
   Una posa: { k } da 0 (riposo) a 1 (massimo): tutto il disegno si calcola da k. viewBox come le altre figure. */

const C = {
  skin: "var(--fl-skin,#d3d9df)", skinFar: "var(--fl-skinFar,#b9c1c9)", shade: "var(--fl-shade,#c3cad1)", line: "var(--fl-line,#a9b2bb)",
  nail: "var(--fl-shade,#c3cad1)", band: "var(--fl-band,#3f7fc4)",
  mus: "var(--mus,#e8333a)", mus2: "var(--mus2,#ff9f1a)", edge: "var(--mus-edge,#a3161c)", edge2: "var(--mus2-edge,#b86a00)",
};
const f = n => n.toFixed(1);
const mfill = (lvl, op) => `fill="${lvl === 1 ? C.mus : C.mus2}" fill-opacity="${f(.55 + .45 * op)}" stroke="${lvl === 1 ? C.edge : C.edge2}" stroke-width=".6"`;
const lvl = (mus, n) => mus.p.includes(n) ? 1 : mus.s.includes(n) ? 2 : 0;
function cap(A, B, ra, rb, fill, extra = "") {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return `<path d="M${f(A[0] + nx * ra)} ${f(A[1] + ny * ra)} L${f(B[0] + nx * rb)} ${f(B[1] + ny * rb)} A${f(rb)} ${f(rb)} 0 0 0 ${f(B[0] - nx * rb)} ${f(B[1] - ny * rb)} L${f(A[0] - nx * ra)} ${f(A[1] - ny * ra)} A${f(ra)} ${f(ra)} 0 0 0 ${f(A[0] + nx * ra)} ${f(A[1] + ny * ra)}Z" fill="${fill}" ${extra}/>`;
}
const arrow = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
  return `<path class="arrow" d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])} M${f(b[0] - ux * 4 - uy * 3)} ${f(b[1] - uy * 4 + ux * 3)} L${f(b[0])} ${f(b[1])} L${f(b[0] - ux * 4 + uy * 3)} ${f(b[1] - uy * 4 - ux * 3)}"/>`; };
const txt = (x, y, s, a = "start") => `<text class="ptxt" x="${x}" y="${y}" text-anchor="${a}" style="font-size:7px">${s}</text>`;

/* Short foot: piede destro visto dal lato interno (dita a destra). k: l'arco sale e il piede si accorcia un poco,
   le dita restano piatte a terra (l'errore tipico è arricciarle). */
function foot(pose, mus, op) {
  const k = pose.k, G = 112, h = 7 + 13 * k, sh = 5 * k; // altezza dell'arco, accorciamento
  const ball = 132 - sh, tip = 170 - sh;
  let o = `<line class="gnd" x1="0" y1="${G}" x2="200" y2="${G}"/>`;
  o += cap([68, -12], [80, 66], 13, 10.5, C.skin); // gamba
  // piede: tallone, arco interno, avampiede, dita
  const d = `M80 60 Q66 62 58 80 Q52 98 60 ${G - 2} Q66 ${G} 76 ${G} L84 ${G} Q${f(100 - sh / 2)} ${f(G - h)} ${f(ball - 6)} ${G - 1} L${f(ball)} ${G} L${f(tip - 4)} ${G} Q${f(tip + 2)} ${G - 1} ${f(tip)} ${G - 6} Q${f(tip - 3)} ${G - 9} ${f(tip - 12)} ${G - 10} Q${f(ball + 6)} ${f(G - 13)} ${f(ball - 4)} ${f(G - 17 - 2 * k)} Q${f(110 - sh)} ${f(80 - 3 * k)} 92 66 Z`;
  o += `<path d="${d}" fill="${C.skin}"/>`;
  o += `<path d="M84 ${G} Q${f(100 - sh / 2)} ${f(G - h)} ${f(ball - 6)} ${G - 1}" fill="none" stroke="${C.shade}" stroke-width="1.6"/>`; // bordo dell'arco
  // alluce e dita (vista interna: si vede soprattutto l'alluce), unghia
  o += `<path d="M${f(tip - 12)} ${G - 10} Q${f(tip - 1)} ${G - 9.5} ${f(tip)} ${G - 6}" fill="none" stroke="${C.shade}" stroke-width="1"/><ellipse cx="${f(tip - 5)}" cy="${G - 8.6}" rx="3.2" ry="1.4" fill="${C.nail}"/>`;
  // muscoli dell'arco (intrinseci del piede): una fascia lungo l'arco interno
  const l = lvl(mus, "muscoli del piede");
  if (l) o += `<path d="M80 ${G - 4} Q${f(100 - sh / 2)} ${f(G - h - 9)} ${f(ball - 6)} ${G - 5} Q${f(100 - sh / 2)} ${f(G - h - 4)} 80 ${G - 4}Z" ${mfill(l, op)}/>`;
  // freccia sotto l'arco, dita ferme
  o += arrow([100 - sh / 2, G + 12], [100 - sh / 2, G - h + 3]) + txt(106 - sh / 2, G + 12, "l'arco sale");
  o += txt(tip, G - 34, "dita piatte,", "end") + txt(tip, G - 26, "non arricciate", "end");
  return o;
}

/* Estensioni delle dita: mano destra vista dal dorso, dita in alto, elastico attorno alle dita chiuse.
   k: le dita si aprono a ventaglio tirando l'elastico; i muscoli che lavorano sono gli estensori dell'avambraccio. */
function hand(pose, mus, op) {
  const k = pose.k; let o = "";
  // avambraccio e polso
  o += cap([100, 160], [100, 100], 15, 13, C.skin);
  const l = lvl(mus, "avambracci");
  if (l) o += `<path d="M94 150 Q92 126 95.5 106 Q100 103 104.5 106 Q108 126 106 150 Q100 153 94 150Z" ${mfill(l, op)}/>`;
  // dita: base sulle nocche, angolo che si apre con k (gradi dalla verticale), lunghezza
  /* a riposo le dita sono chiuse a punta (convergono), aperte si allargano a ventaglio; chiuse sono anche un po' piegate */
  const F = [{ b: [86, 64], a0: 9, a1: -26, L: 31 }, { b: [96, 61], a0: 3, a1: -9, L: 36 }, { b: [106, 61], a0: -3, a1: 9, L: 34 }, { b: [115, 64], a0: -9, a1: 25, L: 28 }];
  const tips = []; const ring = []; const bend = .84 + .16 * k;
  for (const fi of F) { const a = (fi.a0 + (fi.a1 - fi.a0) * k) * Math.PI / 180, Lk = fi.L * bend; const t = [fi.b[0] + Math.sin(a) * Lk, fi.b[1] - Math.cos(a) * Lk];
    tips.push({ b: fi.b, t }); ring.push([fi.b[0] + Math.sin(a) * Lk * .74, fi.b[1] - Math.cos(a) * Lk * .74]); }
  // pollice: dal lato sinistro del dorso (mano destra vista dal dorso)
  const ta = (-8 - 52 * k) * Math.PI / 180, tb = [81, 84], tt = [tb[0] + Math.sin(ta) * 26, tb[1] - Math.cos(ta) * 26];
  ring.unshift([tb[0] + Math.sin(ta) * 26 * .8, tb[1] - Math.cos(ta) * 26 * .8]);
  /* elastico: gira attorno alle cinque dita. Dal dorso si vede il tratto che passa sopra le dita (davanti, pieno);
     il ritorno dal mignolo al pollice passa dal lato del palmo (dietro, più chiaro) */
  const pts = ps => ps.map(p => `${f(p[0])} ${f(p[1])}`).join(" L");
  const smooth = ps => { let d = `M${f(ps[0][0])} ${f(ps[0][1])}`; // curva morbida che passa per tutti i punti (Catmull-Rom)
    for (let i = 0; i < ps.length - 1; i++) { const a = ps[i - 1] || ps[i], b = ps[i], c = ps[i + 1], e = ps[i + 2] || c;
      d += ` C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`; }
    return d; };
  o += `<path d="M${pts([ring[ring.length - 1], ring[0]])}" fill="none" stroke="${C.band}" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`;
  // dorso della mano
  o += `<path d="M84 100 Q80 82 81 66 Q83 58 92 58 L112 58 Q119 59 120 66 Q121 84 116 100 Z" fill="${C.skin}"/>`;
  o += cap(tb, tt, 6.2, 4.6, C.skin) + `<ellipse cx="${f(tt[0] + Math.sin(ta) * -2)}" cy="${f(tt[1] - Math.cos(ta) * -2)}" rx="2.2" ry="1.6" fill="${C.nail}" transform="rotate(${f(ta * 180 / Math.PI)} ${f(tt[0])} ${f(tt[1])})"/>`;
  for (const { b, t } of tips) { o += cap(b, t, 5.2, 4.2, C.skin);
    const dx = t[0] - b[0], dy = t[1] - b[1], L = Math.hypot(dx, dy); const n = [t[0] - dx / L * 3, t[1] - dy / L * 3];
    o += `<ellipse cx="${f(n[0])}" cy="${f(n[1])}" rx="2.4" ry="1.7" fill="${C.nail}" transform="rotate(${f(Math.atan2(dy, dx) * 180 / Math.PI + 90)} ${f(n[0])} ${f(n[1])})"/>`;
    o += `<path d="M${f(b[0] - 2.5)} ${f(b[1] + 1)} Q${f(b[0])} ${f(b[1] - 1.5)} ${f(b[0] + 2.5)} ${f(b[1] + 1)}" fill="none" stroke="${C.shade}" stroke-width="1"/>`; } // nocca
  // elastico sopra le dita
  o += `<path d="${smooth(ring)}" fill="none" stroke="${C.band}" stroke-width="2.8" stroke-linecap="round"/>`;
  o += txt(140, 34, "apri la mano", "start") + txt(140, 43, "al massimo", "start") + txt(140, 120, "ritorno lento", "start");
  return o;
}

const FIGD = {
  shortfoot: { draw: foot, poses: [{ k: 0 }, { k: 1 }], t1: 1.2, t2: 1.2, h1: .8, h2: 2.2 },
  fingerext: { draw: hand, poses: [{ k: 0 }, { k: 1 }], t1: .9, t2: 1.8, h1: .5, h2: .5, vb: "20 -2 168 131" },
};
export function renderDetail(ex, pose, mus, op) { return ex.draw(pose, mus, op); }
export { FIGD };
