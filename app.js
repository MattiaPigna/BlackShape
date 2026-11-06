// BLACKBLADE — Showroom 3D dei tagli
// Tutto è generato proceduralmente (nessun modello esterno): testa, capelli, barba, abito.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { mergeVertices } from 'three/addons/BufferGeometryUtils.js';

const Q = new URLSearchParams(location.search);
const LITE = Q.has('lite');

/* =========================================================================
   DATI
   ========================================================================= */
const HEADS = [
  { id: 'capo', name: 'Il Capo', role: 'Testa calva da modello', skin: '#c29a80',
    jaw: 0.1, jowl: 0.0, chinF: 1.0, nose: 1.0, brow: 1.0, browHair: 1.0, lid: 1.4, recede: 0.02, age: 0.4,
    cut: 'midfade', color: 'nero', beard: 'none',
    // testa calva (GLB convertito con tools/prepara-modello.mjs): niente capelli scolpiti da radere
    model: 'modelli/capo.bbm', bald: true, bust: true, bustDy: 0.27,
    sculptMustache: true,       // il modello ha gia' baffi e sopracciglia scolpiti
    // attaccatura misurata sul modello: [azimut, altezza] (0 = fronte, PI = nuca)
    hl: [[0, 0.6], [0.45, 0.57], [0.75, 0.5], [0.98, 0.3], [1.12, 0.05], [1.24, -0.04], [1.42, 0.2],
      [1.82, 0.2], [2.15, -0.22], [2.6, -0.42], [Math.PI, -0.46]],
    thick: [0, 0], beardDy: 0, hatPos: [0, 0.55, -0.04], hatScale: 1.1,
    outfit: { suit: '#0d0d0f', shirt: '#ece6da', tie: 'long', tieColor: '#8f0d12', rose: false } },
  { id: 'don', name: 'Il Don', role: 'Il capofamiglia', skin: '#b08a72',
    jaw: 0.13, jowl: 0.045, chinF: 0.9, nose: 1.15, brow: 1.3, browHair: 1.35, lid: 1.52, recede: 0.07, age: 1,
    cut: 'slick', color: 'brizzolato', beard: 'baffi',
    // modello scolpito (busto STL preparato con tools/prepara-modello.mjs)
    model: 'modelli/don.bbm',
    // attaccatura reale del modello: [azimut, altezza] (0 = fronte, PI = nuca)
    hl: [[0, 0.8], [0.5, 0.77], [0.8, 0.63], [1.0, 0.44], [1.1, 0.2], [1.27, 0.02], [1.4, 0.3],
      [1.85, 0.3], [2.05, -0.08], [2.4, -0.24], [Math.PI, -0.26]],
    sculptMustache: true,       // baffi gia' scolpiti nel modello
    thick: [0.03, 0.07],        // spessore dei capelli scolpiti da "radere": lati, sommita'
    beardDy: -0.04,             // bocca/baffi un po' piu' in basso rispetto alla testa procedurale
    hatPos: [0, 0.6, -0.06], hatScale: 1.22,
    outfit: { suit: '#09090a', shirt: '#efe9dd', tie: 'bow', tieColor: '#0b0b0b', rose: true } },
  { id: 'consigliere', name: 'Il Consigliere', role: 'La mente', skin: '#d0ad94',
    jaw: 0.02, jowl: 0.0, chinF: 1.0, nose: 1.02, brow: 0.9, browHair: 0.9, lid: 1.38, recede: 0.03, age: 0.6,
    cut: 'sidepart', color: 'castano', beard: 'baffi',
    outfit: { suit: '#1a1a1f', shirt: '#e8e4dc', tie: 'long', tieColor: '#6e0a0c', rose: false } },
  { id: 'picciotto', name: 'Il Picciotto', role: 'Il giovane', skin: '#c49a7f',
    jaw: 0.06, jowl: 0.0, chinF: 1.05, nose: 0.95, brow: 1.0, browHair: 1.0, lid: 1.3, recede: 0.0, age: 0,
    cut: 'pompadour', color: 'nero', beard: 'none',
    outfit: { suit: '#111113', shirt: '#f2efe8', tie: 'long', tieColor: '#b3121a', rose: false } },
  { id: 'sicario', name: 'Il Sicario', role: "L'esecutore", skin: '#9e765c',
    jaw: 0.16, jowl: 0.015, chinF: 1.1, nose: 1.05, brow: 1.35, browHair: 1.2, lid: 1.46, recede: 0.0, age: 0.3,
    cut: 'crop', color: 'nero', beard: 'corta',
    outfit: { suit: '#0a0a0a', shirt: '#121212', tie: 'none', tieColor: '#000', rose: false } },
];

const COLORS = [
  { id: 'nero', name: 'Nero corvino', hex: '#0d0b0a', gray: 0 },
  { id: 'castano-scuro', name: 'Castano scuro', hex: '#24170f', gray: 0 },
  { id: 'castano', name: 'Castano', hex: '#4a2f1d', gray: 0 },
  { id: 'brizzolato', name: 'Brizzolato', hex: '#17130f', gray: 0.38 },
  { id: 'argento', name: 'Argento', hex: '#4c4844', gray: 0.75 },
  { id: 'biondo', name: 'Biondo cenere', hex: '#7d6040', gray: 0 },
];

// funzioni di utilità
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const g = (v, s) => Math.exp(-(v * v) / (s * s));
const g2 = (u, v, s) => Math.exp(-(u * u + v * v) / (s * s));
const mix = (a, b, t) => a + (b - a) * t;
function curve(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t * t * (3 - 2 * t);
    }
  }
  return pts[pts.length - 1][1];
}

// Info passate alle funzioni dei tagli:
//  px,py,pz = direzione sulla sfera unitaria (z = davanti, y = su)
//  ax = |px|, aa = |azimut| (0 = fronte, PI = nuca), e = distanza sopra l'attaccatura
//  top = quanto siamo sulla calotta, hy/ny = altezza e normale verticale della testa

/* ---------- SFUMATURE ----------
   Rialzo della macchinetta -> lunghezza nel modello (0 = a pelle).
   I valori sono "visivi": 0 = pelle, 1 = ombra scura, 3-4 = capello corto pieno. */
function guard(n) {
  return curve([[0, 0.0003], [0.5, 0.0022], [1, 0.0042], [1.5, 0.006], [2, 0.0085],
    [3, 0.013], [4, 0.018], [6, 0.026], [8, 0.034]], n);
}
// altezza della linea di sfumatura in funzione dell'azimut (0 fronte, PI nuca)
// riferimenti: orecchio ~ -0.06, tempia ~ 0.22, cresta parietale ~ 0.42
const FADE_LINES = {
  low:  [[0.9, 0.1], [1.3, 0.02], [1.7, 0.0], [2.3, -0.12], [Math.PI, -0.26]],
  mid:  [[0.9, 0.26], [1.3, 0.2], [1.7, 0.18], [2.3, 0.08], [Math.PI, -0.04]],
  high: [[0.9, 0.42], [1.3, 0.38], [1.7, 0.37], [2.3, 0.3], [Math.PI, 0.22]],
  // drop: alta sopra l'orecchio, poi "cade" dietro l'orecchio verso la nuca
  drop: [[0.9, 0.26], [1.3, 0.2], [1.75, 0.2], [2.2, 0.1], [2.6, -0.16], [Math.PI, -0.24]],
};
const FADE_BAND = { low: 0.08, mid: 0.16, high: 0.28, drop: 0.16 };
const EAR = new THREE.Vector3(0.97, -0.06, -0.14).normalize();
/* Lunghezza dei lati per una sfumatura.
   o.line: 'low' | 'mid' | 'high' | 'drop'   o.burst: sfumatura a semicerchio attorno all'orecchio
   o.from: rialzo in basso (0 = skin fade)   o.to: rialzo alla linea   o.up: rialzo sopra la linea
   o.blend: quanto e' morbido il passaggio sopra la linea */
function fade(i, o) {
  const hl = i.py - i.e;                    // altezza dell'attaccatura in questo punto
  let t;
  if (o.burst) {
    const d = Math.acos(clamp(i.ax * EAR.x + i.py * EAR.y + i.pz * EAR.z, -1, 1));
    t = smooth(o.r0 ?? 0.12, o.r1 ?? 0.62, d);
    const n = mix(o.from, o.to, t);
    return guard(mix(n, o.up ?? o.to, smooth(o.r1 ?? 0.62, (o.r1 ?? 0.62) + (o.blend ?? 0.2), d)));
  }
  // la linea resta sempre un po' sopra l'attaccatura (es. sopra l'orecchio), cosi' la fascia a pelle c'e' sempre
  const ly = Math.max(curve(FADE_LINES[o.line], i.aa), hl + FADE_BAND[o.line]);
  t = ly > hl + 0.02 ? smooth(hl, ly, i.py) : 1;
  const n = mix(o.from, o.to, Math.sqrt(t));
  return guard(mix(n, o.up ?? o.to, smooth(ly, ly + (o.blend ?? 0.2), i.py)));
}
// zona "sopra" (calotta) dove comanda il taglio superiore
const crown = (i, a = 0.3, b = 0.6) => smooth(a, b, i.py);

const CUTS = [
  /* ----------------------------- CLASSICI ----------------------------- */
  { id: 'slick', group: 'Classici', name: 'Slick Back', it: "Pettinato all'indietro",
    desc: "Il classico del Don: lunghezze sopra, lati sfumati a forbice e brillantina a specchio.",
    flow: [0, 0.3, 1], rough: 0.34,
    f(i) {
      const side = fade(i, { line: 'low', from: 2, to: 4, up: 6, blend: 0.3 });
      const top = 0.045 * i.top + 0.024 * smooth(0.1, 0.8, i.pz) * smooth(0.3, 0.7, i.py);
      return { len: mix(side, side * 0.6 + top, crown(i, 0.25, 0.6)) };
    } },
  { id: 'sidepart', group: 'Classici', name: 'Side Part', it: 'Riga laterale',
    desc: "Riga netta da un lato, volume morbido sull'altro. L'eleganza del consigliere.",
    flow: [0.42, 0.82, 0.38], rough: 0.42,
    f(i) {
      const side = fade(i, { line: 'low', from: 1.5, to: 3, up: 5, blend: 0.3 });
      const top = 0.04 * i.top + 0.026 * smooth(0.2, 0.8, i.pz) * smooth(0.35, 0.7, i.py) * smooth(0.35, -0.2, i.px);
      const part = g(i.px - 0.3, 0.035) * smooth(0.25, 0.5, i.py) * smooth(-0.45, 0.15, i.pz);
      return { len: mix(mix(side, side * 0.6 + top, crown(i, 0.25, 0.6)), 0.003, part * 0.92) };
    } },
  { id: 'pompadour', group: 'Classici', name: 'Pompadour', it: 'Ciuffo alto',
    desc: "Onda alta e voluminosa sulla fronte, lati corti e lucidi. Puro stile anni '50.",
    flow: [0, 0.15, 1], rough: 0.3,
    f(i) {
      const side = fade(i, { line: 'mid', from: 1, to: 3, up: 4, blend: 0.2 });
      const pm = smooth(-0.2, 0.5, i.pz) * g(i.px, 0.45) * smooth(0.2, 0.6, i.py);
      return { len: side + 0.04 * i.top + 0.22 * pm, dz: 0.07 * pm * smooth(0.2, 0.8, i.pz), dy: 0.05 * pm };
    } },
  { id: 'quiff', group: 'Classici', name: 'Quiff', it: 'Ciuffo spettinato',
    desc: "Ciuffo in avanti e in su con finitura opaca, sfumatura media ai lati.",
    flow: [0, 0.2, 1], rough: 0.62,
    f(i) {
      const side = fade(i, { line: 'mid', from: 0.5, to: 2, up: 3.5 });
      const q = smooth(0.0, 0.6, i.pz) * g(i.px, 0.4) * smooth(0.3, 0.62, i.py);
      return { len: side + 0.035 * i.top + 0.085 * q, dz: 0.05 * q * smooth(0.4, 0.9, i.pz), dy: 0.03 * q };
    } },
  { id: 'crew', group: 'Classici', name: 'Crew Cut', it: 'Taglio militare',
    desc: "Corto ai lati, qualche centimetro sopra che sale verso la fronte.",
    flow: [0, 0.75, -0.65], rough: 0.6,
    f(i) {
      const side = fade(i, { line: 'low', from: 1, to: 2, up: 3 });
      const fr = smooth(0.2, 0.9, i.pz) * i.top;
      return { len: mix(side, 0.018 + 0.018 * fr, crown(i, 0.35, 0.6)), dy: 0.012 * fr };
    } },
  { id: 'flattop', group: 'Classici', name: 'Flat Top', it: 'Spazzola piatta',
    desc: "Sopra squadrato e perfettamente piatto, lati sfumati. Precisione da maestro.",
    flow: [0, 1, 0.001], rough: 0.72,
    f(i) {
      const side = fade(i, { line: 'mid', from: 0.5, to: 2, up: 3 });
      const m = smooth(0.42, 0.62, i.py);
      const flat = clamp((1.13 - i.hy) / Math.max(i.ny, 0.35), 0.016, 0.28);
      return { len: mix(side, flat, m) };
    } },
  { id: 'buzz', group: 'Classici', name: 'Buzz Cut', it: 'Rasato a macchinetta',
    desc: "Macchinetta uniforme su tutta la testa. Pulito, deciso, senza compromessi.",
    flow: [0, 0.75, -0.65], rough: 0.85,
    f() { return { len: guard(1.5) }; } },
  { id: 'undercut', group: 'Classici', name: 'Undercut', it: 'Lati rasati',
    desc: "Lati e nuca rasati, sopra lungo e tirato indietro. Un contrasto che non perdona.",
    flow: [0, 0.3, 1], rough: 0.3,
    f(i) {
      const k = smooth(0.34, 0.42, i.py);
      return { len: mix(guard(0.5), 0.05 + 0.03 * smooth(0.2, 0.8, i.pz), k), dy: 0.012 * k };
    } },

  /* ----------------------------- MODERNI ------------------------------ */
  { id: 'lowfade', group: 'Moderni', name: 'Low Skin Fade', it: 'Sfumatura bassa a pelle',
    desc: "A pelle sopra l'orecchio e sulla nuca, poi sale piano. Sopra corto e mosso in avanti.",
    flow: [0, 0.6, -0.8], rough: 0.7,
    f(i) {
      const side = fade(i, { line: 'low', from: 0, to: 2, up: 4 });
      const top = 0.026 + 0.01 * smooth(0.3, 0.9, i.pz);
      return { len: mix(side, top, crown(i, 0.32, 0.6)) };
    } },
  { id: 'midfade', group: 'Moderni', name: 'Mid Skin Fade', it: 'Sfumatura media a pelle',
    desc: "La sfumatura sale fino alla tempia. Il taglio piu' richiesto: pulito ma non estremo.",
    flow: [0.35, 0.8, 0.45], rough: 0.55,
    f(i) {
      const side = fade(i, { line: 'mid', from: 0, to: 2, up: 4 });
      const top = 0.03 + 0.012 * smooth(0.2, 0.8, i.pz) * smooth(0.4, -0.2, i.px);
      return { len: mix(side, top, crown(i, 0.4, 0.62)), dy: 0.006 * i.top };
    } },
  { id: 'highfade', group: 'Moderni', name: 'High Skin Fade', it: 'Sfumatura alta a pelle',
    desc: "Lati a pelle fino alla cresta della testa. Sopra solo pochi centimetri: deciso e moderno.",
    flow: [0, 0.6, -0.8], rough: 0.72,
    f(i) {
      const side = fade(i, { line: 'high', from: 0, to: 1.5, up: 3, blend: 0.08 });
      return { len: mix(side, 0.024 + 0.006 * smooth(0.3, 0.9, i.pz), crown(i, 0.5, 0.66)) };
    } },
  { id: 'taper', group: 'Moderni', name: 'Taper Fade', it: 'Sfumatura solo ai bordi',
    desc: "Sfumata solo basette e nuca, il resto resta pieno. Pulito senza togliere volume.",
    flow: [0.3, 0.85, 0.4], rough: 0.5,
    f(i) {
      // la sfumatura vive solo vicino all'attaccatura (basetta e nuca)
      const edge = smooth(0.0, 0.16, i.e);
      const side = guard(mix(0, 4, edge));
      const top = 0.032 + 0.012 * smooth(0.2, 0.8, i.pz);
      return { len: mix(side, top, crown(i, 0.25, 0.6)) };
    } },
  { id: 'dropfade', group: 'Moderni', name: 'Drop Fade', it: "Sfumatura che scende dietro l'orecchio",
    desc: "La linea sale sopra l'orecchio e cade verso la nuca. Ciuffo morbido in avanti.",
    flow: [0, 0.25, 1], rough: 0.55,
    f(i) {
      const side = fade(i, { line: 'drop', from: 0, to: 2, up: 4 });
      const q = smooth(0.0, 0.6, i.pz) * g(i.px, 0.45) * smooth(0.3, 0.62, i.py);
      return { len: mix(side, 0.03 + 0.05 * q, crown(i, 0.35, 0.6)), dz: 0.03 * q, dy: 0.02 * q };
    } },
  { id: 'burst', group: 'Moderni', name: 'Burst Fade', it: "Sfumatura a raggiera sull'orecchio",
    desc: "Semicerchio a pelle attorno all'orecchio, nuca piena. Cresta centrale testurizzata.",
    flow: [0, 0.6, -0.8], rough: 0.75,
    f(i) {
      const side = fade(i, { burst: true, from: 0, to: 2, up: 4, r0: 0.1, r1: 0.6 });
      const ridge = g(i.px, 0.28) * smooth(0.2, 0.55, i.py);
      return { len: mix(side, 0.025 + 0.03 * ridge, crown(i, 0.4, 0.65) * mix(0.4, 1, ridge)), dy: 0.02 * ridge };
    } },
  { id: 'crop', group: 'Moderni', name: 'Textured Crop', it: 'Crop con skin fade',
    desc: "Sfumatura media a pelle, sopra texture corta e frangia netta sulla fronte.",
    flow: [0, 0.55, -0.85], rough: 0.78, edge: 0.012,
    f(i) {
      const side = fade(i, { line: 'mid', from: 0, to: 1.5, up: 3, blend: 0.1 });
      const fr = smooth(0.5, 0.88, i.pz) * smooth(0.3, 0.5, i.py) * g(i.px, 0.5) * (1 - smooth(0.0, 0.12, i.e));
      return { len: mix(side, 0.024, crown(i, 0.4, 0.62)) + 0.006 * fr, dz: 0.03 * fr, dy: -0.06 * fr };
    } },
  { id: 'buzzfade', group: 'Moderni', name: 'Buzz Fade', it: 'Rasato con sfumatura',
    desc: "Rialzo 2 sopra, sfumato a pelle sui lati. Il minimo indispensabile, fatto bene.",
    flow: [0, 0.75, -0.65], rough: 0.85,
    f(i) { return { len: fade(i, { line: 'mid', from: 0, to: 2, up: 2.5 }) }; } },
];

const BEARDS = [
  { id: 'none', name: 'Rasato' },
  { id: 'ombra', name: 'Barba di 3 giorni' },
  { id: 'baffi', name: 'Baffi' },
  { id: 'pizzetto', name: 'Pizzetto' },
  { id: 'corta', name: 'Barba corta' },
  { id: 'piena', name: 'Barba piena' },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

/* =========================================================================
   FORMA DELLA TESTA
   ========================================================================= */
const SX = 0.75, SY = 0.98, SZ = 0.88;

// Ritorna posizione [x,y,z] e normale "liscia" [nx,ny,nz] per una direzione unitaria
function headAt(px, py, pz, H) {
  const ax = Math.abs(px);
  let x = px * SX, y = py * SY, z = pz * SZ;

  // mascella che si stringe verso il mento (squadrata)
  const low = smooth(-0.15, -0.95, py);
  const back = smooth(0.05, -0.7, pz);
  x *= 1 - (0.2 - H.jaw) * low - 0.06 * smooth(-0.75, -1.0, py) * smooth(0.0, 0.6, pz);
  x *= 1 + 0.07 * g(py + 0.42, 0.32) * smooth(-0.2, 0.4, pz) - 0.22 * smooth(-0.3, -0.95, py) * back;
  // nuca / collo
  z *= 1 - 0.32 * smooth(-0.15, -0.9, py) * back;
  z -= 0.06 * g(py - 0.15, 0.35) * back;
  // piano del viso: porta avanti bocca e mento
  const fw = smooth(0.0, 0.65, pz) * g(px, 0.55);
  z += fw * 0.36 * H.chinF * smooth(-0.15, -0.88, py);
  y -= fw * 0.06 * smooth(-0.6, -1.0, py);
  // fronte leggermente piatta
  z -= 0.03 * smooth(0.3, 0.8, pz) * smooth(0.2, 0.7, py);

  let nx = px / SX, ny = py / SY, nz = pz / SZ;
  const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;

  // dettagli del viso, solo sul davanti
  const fr = smooth(0.3, 0.7, pz);
  let d = 0;
  if (fr > 0) {
    const N = H.nose;
    // arcata sopracciliare
    d += 0.035 * H.brow * g(py - 0.17, 0.075) * g(ax - 0.3, 0.32);
    // orbite
    d -= 0.075 * g2(ax - 0.4, (py - 0.03) * 1.25, 0.15);
    // naso: dorso, punta, ali
    const ridge = (0.025 + 0.085 * smooth(0.1, -0.3, py)) * (1 - smooth(-0.3, -0.4, py)) * smooth(0.18, 0.06, py);
    d += N * ridge * g(px, 0.06 + 0.04 * smooth(0.05, -0.3, py));
    d += N * 0.045 * g2(px, (py + 0.3) * 1.1, 0.09);
    d += N * 0.04 * g2(ax - 0.1, (py + 0.335) * 1.3, 0.06);
    d -= 0.015 * g2(ax - 0.17, py + 0.36, 0.04);
    // labbra
    d += 0.035 * g(py + 0.47, 0.038) * g(px, 0.19);
    d += 0.04 * g(py + 0.565, 0.042) * g(px, 0.16);
    d -= 0.03 * g(py + 0.515, 0.018) * g(px, 0.2);
    d -= 0.02 * g2(ax - 0.23, py + 0.52, 0.045);
    // mento, zigomi, guance cadenti
    d += 0.05 * g2(px * 0.75, py + 0.8, 0.15);
    d += 0.035 * g2(ax - 0.56, py + 0.14, 0.17);
    d += H.jowl * g2(ax - 0.5, py + 0.62, 0.2);
    // tempie
    d -= 0.02 * g2(ax - 0.72, py - 0.22, 0.15);
    // solchi naso-labiali (eta')
    d -= 0.014 * H.age * nasolabial(ax, py);
    d *= fr;
  }
  return [x + nx * d, y + ny * d, z + nz * d, nx, ny, nz];
}

function nasolabial(ax, py) {
  // distanza da un segmento che va dall'ala del naso all'angolo della bocca
  const x0 = 0.15, y0 = -0.33, x1 = 0.25, y1 = -0.56;
  const vx = x1 - x0, vy = y1 - y0;
  const t = clamp(((ax - x0) * vx + (py - y0) * vy) / (vx * vx + vy * vy), 0, 1);
  return g(Math.hypot(ax - x0 - vx * t, py - y0 - vy * t), 0.022);
}

// attaccatura dei capelli in funzione dell'azimut
function hairline(aa, H) {
  if (H.hl) return curve(H.hl, aa);
  return curve([[0, 0.47], [0.5, 0.44], [0.8, 0.37], [1.02, 0.18], [1.14, -0.08], [1.24, -0.08], [1.42, 0.22],
    [1.82, 0.22], [2.15, -0.25], [2.6, -0.48], [Math.PI, -0.52]], aa) + H.recede * g(aa - 0.75, 0.28);
}

/* =========================================================================
   RENDERER / SCENA
   ========================================================================= */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1 : 1.5));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.25;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
scene.add(camera);

const TARGET = new THREE.Vector3(0, -0.34, 0);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 3.2;
controls.maxDistance = 11;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = 2.0;
controls.rotateSpeed = 0.8;
controls.autoRotateSpeed = 1.6;

// luci agganciate alla camera: il "cliente" gira sotto le luci dello studio
const hemi = new THREE.HemisphereLight(0xfff4ea, 0x1a0505, 0.6);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff0e2, 2.5); key.position.set(3.5, 4, 5);
const fill = new THREE.DirectionalLight(0x9aa6c8, 0.45); fill.position.set(-5, 0.5, 3);
const rimL = new THREE.DirectionalLight(0xff2020, 2.2); rimL.position.set(-4.5, 2.5, -4);
const rimR = new THREE.DirectionalLight(0xff3a2a, 1.4); rimR.position.set(4.5, 1.5, -3.5);
const top = new THREE.DirectionalLight(0xffffff, 0.6); top.position.set(0, 6, -1);
for (const l of [key, fill, rimL, rimR, top]) { camera.add(l); l.target.position.set(0, 0, -6); camera.add(l.target); }

/* =========================================================================
   MATERIALI
   ========================================================================= */
function makeHairMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0 });
  const u = {
    uFlow: { value: new THREE.Vector3(0, 0, 1) },
    uT: { value: new THREE.Vector3(1, 0, 0) },
    uB: { value: new THREE.Vector3(0, 1, 0) },
    uGray: { value: 0 },
    uGrayCol: { value: new THREE.Color('#8e8a84') },
    uHairCol: { value: new THREE.Color('#0d0b0a') },
    uDensity: { value: +(Q.get('dens') || (LITE ? 80 : 100)) },   // capelli per unita' (piu' alto = piu' fitti e sottili)
    uRad: { value: +(Q.get('rad') || 0.44) },
    uShine: { value: 90 },                     // riflesso lungo il capello: alto = stretto e lucido
    uSpecK: { value: 0.35 },                   // intensita' del riflesso
    uBump: { value: 0.0035 },                  // profondita' dei solchi della pettinatura                     // spessore del singolo capello nella sua cella
  };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aHair; attribute vec3 aInner; attribute vec3 aTip; attribute float aLen; attribute vec3 aDir; attribute float aLayer;
varying float vHair; varying vec3 vHPos; varying vec3 vFDir; varying float vLayer; varying float vLen; varying vec3 vTanV;
uniform vec3 uFlow;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vHair = aHair; vHPos = aTip; vLayer = aLayer; vLen = aLen;
// strato 0 = sottopelo opaco, strati 1..N = "pelliccia" dalla radice alla punta
if (aLayer > 0.001) transformed = mix(aInner, aTip, aLayer);
vec3 dd = normalize(aDir);
vec3 tf = dd * dot(dd, uFlow) - uFlow; float tl = length(tf);
tf = tl > 1e-4 ? tf / tl : vec3(0.0, -1.0, 0.0);
// il capello si piega lungo la direzione di pettinatura salendo verso la punta
vTanV = normalize(normalMatrix * tf);
float lie = smoothstep(0.004, 0.03, aLen);
vFDir = normalize(dd + tf * aLayer * aLayer * lie * min(aLen, 0.06) * 1.6);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vHair; varying vec3 vHPos; varying vec3 vFDir; varying float vLayer; varying float vLen; varying vec3 vTanV;
uniform vec3 uFlow; uniform vec3 uT; uniform vec3 uB; uniform float uGray; uniform vec3 uGrayCol;
uniform vec3 uHairCol; uniform float uDensity; uniform float uRad; uniform float uShine; uniform float uSpecK; uniform float uBump;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hh(float n){ return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
float pn(float x, float N){ float i = floor(x); float f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(hh(mod(i, N)), hh(mod(i + 1.0, N)), f); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
vec3 hq = normalize(vHPos);
float th = acos(clamp(dot(hq, uFlow), -1.0, 1.0));
float ph = atan(dot(hq, uB), dot(hq, uT)) / 6.2831853 + 0.5;
float wob = sin(th * 7.0) * 0.004 + sin(th * 19.0 + ph * 37.699) * 0.0015;
float x1 = (ph + wob) * 240.0;
float x2 = (ph + wob * 1.3) * 760.0;
float x3 = (ph + wob * 0.7) * 1800.0;
float a1 = 1.0 - smoothstep(0.25, 0.9, fwidth(x1));
float a2 = 1.0 - smoothstep(0.25, 0.9, fwidth(x2));
float a3 = 1.0 - smoothstep(0.25, 0.9, fwidth(x3));
float hN = mix(0.5, pn(x1, 240.0), a1) * 0.45 + mix(0.5, pn(x2, 760.0), a2) * 0.35 + mix(0.5, pn(x3, 1800.0), a3) * 0.2;
float strand = mix(0.62, 1.22, hN);
float gsel = hh(mod(floor(x2), 760.0) + 7.0);
float grayPick = mix(uGray, smoothstep(1.0 - uGray, 1.0 - uGray + 0.08, gsel), a2) * smoothstep(0.3, 0.8, vHair);
vec3 hcol = mix(diffuseColor.rgb, uGrayCol * mix(0.85, 0.6 + 0.5 * hh(floor(x2) + 3.0), a2), grayPick * 0.85);
diffuseColor.rgb = mix(diffuseColor.rgb, hcol * strand, vHair);
if (vLayer > 0.001) {
  // ogni cella della griglia (sulla direzione pettinata) e' un capello: sezione tonda che si assottiglia
  if (vLen < 0.0005) discard;
  vec2 cell; float d;
  float lie = smoothstep(0.012, 0.03, vLen);
  if (lie > 0.5) {
    // capelli lunghi e pettinati: ciocche sottili allungate lungo la pettinatura
    // (x = angolo attorno all'asse di pettinatura, y = distanza lungo la ciocca)
    // vicino al "polo" della pettinatura le ciocche convergono: ne servono meno
    float sx = (ph + wob * 1.3) * uDensity * 9.0 * max(sin(th), 0.12);
    float cx = floor(sx);
    float sy = th * (2.0 + 2.5 * h21(vec2(cx, 1.0))) + h21(vec2(cx, 2.0)) * 10.0;
    cell = vec2(cx, floor(sy));
    d = abs(fract(sx) - 0.5) * 1.6;
  } else {
    // capelli corti: ogni cella della griglia e' un capello con sezione tonda
    vec3 aq = abs(vFDir);
    vec2 uv = (aq.x > aq.y && aq.x > aq.z) ? vFDir.yz : ((aq.y > aq.z) ? vFDir.xz + 7.0 : vFDir.xy + 13.0);
    uv *= uDensity;
    cell = floor(uv);
    vec2 jit = vec2(h21(cell + 3.1), h21(cell + 7.7)) * 0.4 + 0.3;
    d = length(fract(uv) - jit);
  }
  float r1 = h21(cell), r2 = h21(cell + 17.3);
  float hl = 0.55 + 0.45 * r1;                  // lunghezza di questo capello rispetto al taglio
  if (vLayer > hl) discard;
  float rad = uRad * (1.0 - 0.6 * vLayer / hl);
  if (d > rad) discard;
  vec3 hc = mix(uHairCol, uGrayCol * (0.6 + 0.35 * r1), step(r2, uGray));
  hc *= 0.7 + 0.6 * h21(cell + 31.0);
  // radice in ombra, punta piu' chiara (anche i capelli neri hanno punte piu' calde/chiare)
  float tt = vLayer / hl;
  diffuseColor.rgb = hc * mix(0.35, 1.0, tt) + uHairCol * 0.9 * tt * tt + vec3(0.012, 0.009, 0.007) * tt;
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor * mix(1.0, 0.65 + 0.7 * (1.0 - hN), vHair), 0.08, 1.0);
// il sottopelo opaco non deve sembrare plastica: piu' opaco degli strati
if (vLayer < 0.001) roughnessFactor = max(roughnessFactor, 0.85);
else roughnessFactor = max(roughnessFactor, 0.42);   // niente effetto plastica neanche con la brillantina`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
// solchi della pettinatura: rilievo ricavato dal rumore delle ciocche (niente texture)
if (vLayer < 0.001) {
  float hgt = (hN - 0.5) * uBump * vHair;
  vec3 sX = dFdx(-vViewPosition), sY = dFdy(-vViewPosition);
  vec3 R1 = cross(sY, normal), R2 = cross(normal, sX);
  float det = dot(sX, R1);
  vec3 grad = sign(det) * (dFdx(hgt) * R1 + dFdy(hgt) * R2);
  normal = normalize(abs(det) * normal - grad);
}`)
      .replace('#include <opaque_fragment>', `// riflesso "da capello" (Kajiya-Kay): una striscia di luce lungo la direzione delle ciocche
if (vLayer < 0.001 && vHair > 0.01) {
  vec3 T = normalize(vTanV + normal * (hN - 0.5) * 0.5);
  vec3 V = normalize(vViewPosition);
  vec3 L = normalize(vec3(3.5, 4.0, 11.0));          // luce principale (agganciata alla camera)
  vec3 Hh = normalize(L + V);
  float a1 = dot(T, Hh);
  float sp1 = pow(sqrt(max(0.0, 1.0 - a1 * a1)), uShine);
  vec3 T2 = normalize(T + normal * 0.25); float a2 = dot(T2, Hh);
  float sp2 = pow(sqrt(max(0.0, 1.0 - a2 * a2)), uShine * 0.3);
  float vis = clamp(dot(normal, L) * 0.6 + 0.4, 0.0, 1.0);
  // riflesso spezzato dalle ciocche (hN) e leggermente colorato come il capello
  float brk = hN * hN * 1.8;
  vec3 c1 = mix(vec3(0.85, 0.8, 0.75), diffuseColor.rgb * 5.0, 0.35);
  outgoingLight += vis * vHair * uSpecK * (sp1 * c1 * brk + sp2 * diffuseColor.rgb * 1.5 * (0.6 + 0.8 * hN));
}
#include <opaque_fragment>`);
  };
  return m;
}
function setFlow(mat, f) {
  const F = new THREE.Vector3(...f).normalize();
  const ref = Math.abs(F.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const T = new THREE.Vector3().crossVectors(F, ref).normalize();
  const B = new THREE.Vector3().crossVectors(F, T).normalize();
  mat.userData.u.uFlow.value.copy(F); mat.userData.u.uT.value.copy(T); mat.userData.u.uB.value.copy(B);
}

const hairMat = makeHairMaterial();
const faceHairMat = makeHairMaterial();
setFlow(faceHairMat, [0, -1, 0.35]);
faceHairMat.roughness = 0.6;

const skinMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 });
const skinPlain = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0 });

/* =========================================================================
   GEOMETRIE
   ========================================================================= */
function unitSphere(w, h) {
  let geo = new THREE.SphereGeometry(1, w, h);
  geo.deleteAttribute('uv'); geo.deleteAttribute('normal');
  geo = mergeVertices(geo, 1e-5);
  return geo;
}
const HEAD_RES = LITE ? [200, 140] : [300, 210];
const SHELL_RES = LITE ? [160, 110] : [256, 180];
const headUnit = unitSphere(...HEAD_RES);
const shellUnit = unitSphere(...SHELL_RES);

function buildHeadGeometry(H) {
  const geo = headUnit.clone();
  const p = geo.attributes.position;
  const n = p.count;
  const col = new Float32Array(n * 3);
  const skin = new THREE.Color(H.skin);
  const lip = skin.clone().multiply(new THREE.Color(0.86, 0.6, 0.58));
  const blush = new THREE.Color(H.skin).lerp(new THREE.Color('#c2584a'), 0.25);
  for (let k = 0; k < n; k++) {
    const px = p.getX(k), py = p.getY(k), pz = p.getZ(k);
    const r = headAt(px, py, pz, H);
    p.setXYZ(k, r[0], r[1], r[2]);
    const ax = Math.abs(px), fr = smooth(0.3, 0.7, pz);
    const c = skin.clone();
    c.lerp(blush, 0.5 * g2(ax - 0.5, py + 0.25, 0.2) * fr);
    c.lerp(lip, smooth(0.0, 0.5, g(py + 0.515, 0.06) * g(ax, 0.2)) * fr);
    c.multiplyScalar(1 - 0.2 * g2(ax - 0.4, py - 0.02, 0.14) * fr);       // ombra occhi
    c.multiplyScalar(1 - 0.08 * smooth(-0.45, -0.85, py) * smooth(-0.3, 0.3, pz)); // ombra rasatura
    const wr = H.age * fr * (0.22 * nasolabial(ax, py) + 0.08 * g(ax, 0.3) * (g(py - 0.3, 0.012) + g(py - 0.36, 0.012)));
    c.multiplyScalar(1 - wr); // rughe
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

// Pre-calcolo della testa sulla risoluzione dei "gusci" (capelli / barba)
function sampleShellBase(H) {
  const p = shellUnit.attributes.position;
  const n = p.count;
  const base = new Float32Array(n * 6);
  for (let k = 0; k < n; k++) {
    const r = headAt(p.getX(k), p.getY(k), p.getZ(k), H);
    base.set(r, k * 6);
  }
  return base;
}

// Numero di strati della "pelliccia" (piu' strati = capelli piu' pieni, ma piu' lavoro per la GPU)
// ?fur = capelli a strati (pelliccia); di default sono un oggetto 3D pieno
const FUR_ON = Q.has('fur');
const FUR_LAYERS = Q.get('layers') ? +Q.get('layers') : (LITE ? 10 : 22);
// spessore massimo della parte "a strati" sopra il sottopelo opaco
const FUR_DEPTH = 0.03;

function makeShellMesh(mat) {
  const geo = shellUnit.clone();
  const n = geo.attributes.position.count;
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aHair', new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('aInner', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aTip', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aLen', new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('aDir', new THREE.BufferAttribute(shellUnit.attributes.position.array.slice(), 3));
  // un'istanza per strato: 0 = sottopelo, poi 1/N ... 1 = punta
  const layers = new Float32Array(FUR_LAYERS + 1);
  for (let k = 0; k <= FUR_LAYERS; k++) layers[k] = k / FUR_LAYERS;
  geo.setAttribute('aLayer', new THREE.InstancedBufferAttribute(layers, 1));
  const mesh = new THREE.InstancedMesh(geo, mat, FUR_LAYERS + 1);
  const I = new THREE.Matrix4();
  for (let k = 0; k <= FUR_LAYERS; k++) mesh.setMatrixAt(k, I);
  if (!FUR_ON) mesh.count = 1;            // di default i capelli sono un unico oggetto pieno
  mesh.frustumCulled = false;
  mesh.userData.unit = shellUnit.attributes.position.array;
  return mesh;
}

const info = {};
function fillInfo(px, py, pz, H, base, k) {
  info.px = px; info.py = py; info.pz = pz;
  info.ax = Math.abs(px);
  info.aa = Math.abs(Math.atan2(px, pz));
  info.e = py - hairline(info.aa, H);
  info.top = smooth(0.3, 0.75, py);
  info.hy = base[k * 6 + 1];
  info.ny = base[k * 6 + 4];
}

function beardLen(id, i, H) {
  // sopracciglia (sempre presenti)
  const by = 0.2 + 0.04 * Math.sin(clamp((i.ax - 0.12) / 0.55, 0, 1) * Math.PI * 0.8);
  const brow = 0.02 * H.browHair * g(i.py - by, 0.042 - 0.015 * smooth(0.3, 0.68, i.ax)) * smooth(0.1, 0.17, i.ax) * smooth(0.7, 0.6, i.ax) * smooth(0.4, 0.7, i.pz);

  const cheek = curve([[0, -0.37], [0.3, -0.36], [0.55, -0.24], [0.85, -0.06], [1.2, -0.02]], i.aa);
  const area = smooth(cheek + 0.01, cheek - 0.04, i.py) * smooth(1.32, 1.15, i.aa);
  const lips = smooth(0.2, 0.16, i.ax) * smooth(-0.605, -0.585, i.py) * smooth(-0.46, -0.48, i.py);
  const must = (H.sculptMustache ? 0 : 1) * smooth(-0.49, -0.46, i.py) * smooth(-0.355, -0.385, i.py) * smooth(0.25, 0.19, i.ax) * smooth(0.3, 0.6, i.pz);
  const chin = smooth(0.27, 0.19, i.ax) * smooth(-0.57, -0.63, i.py) * smooth(-0.1, 0.35, i.pz);
  const corner = smooth(0.27, 0.21, i.ax) * smooth(0.13, 0.17, i.ax) * smooth(-0.44, -0.48, i.py) * smooth(-0.64, -0.58, i.py) * smooth(0.3, 0.6, i.pz);
  const chinLow = smooth(-0.72, -0.95, i.py) * smooth(0.42, 0.2, i.ax) * smooth(-0.1, 0.3, i.pz);
  let len = 0, dy = 0;
  switch (id) {
    case 'ombra': len = 0.004 * area; break;
    case 'baffi': len = H.sculptMustache ? 0 : 0.03 * must + 0.02 * corner; break;
    case 'pizzetto': len = Math.max(0.026 * must, 0.03 * Math.max(chin, corner)); break;
    case 'corta': len = 0.022 * area + 0.006 * must; break;
    case 'piena': len = 0.048 * area + 0.05 * chinLow * area; dy = -0.05 * chinLow * area; break;
  }
  len *= 1 - lips;
  return { len: H.model ? len : Math.max(len, brow), dy };
}

function computeShell(kind, mesh, H, base, styleId, colorDef) {
  const unit = mesh.userData.unit;
  const n = unit.length / 3;
  const pos = new Float32Array(n * 3);    // sottopelo opaco (strato 0)
  const inner = new Float32Array(n * 3);  // radice degli strati
  const tip = new Float32Array(n * 3);    // punta degli strati
  const lens = new Float32Array(n);
  const col = new Float32Array(n * 3);
  const hair = new Float32Array(n);
  const skin = new THREE.Color(H.skin);
  const hc = new THREE.Color(colorDef.hex);
  const stub = skin.clone().lerp(hc, 0.45).multiplyScalar(0.9);
  const hcDeep = hc.clone().multiplyScalar(0.55);
  const cut = kind === 'hair' ? CUTS.find((c) => c.id === styleId) : null;
  const edge = cut && cut.edge ? cut.edge : 0.05;
  const c = new THREE.Color();
  const put = (arr, k, b, off, dy, dz) => {
    arr[k * 3] = base[b] + base[b + 3] * off;
    arr[k * 3 + 1] = base[b + 1] + base[b + 4] * off + dy;
    arr[k * 3 + 2] = base[b + 2] + base[b + 5] * off + dz;
  };
  for (let k = 0; k < n; k++) {
    const px = unit[k * 3], py = unit[k * 3 + 1], pz = unit[k * 3 + 2];
    fillInfo(px, py, pz, H, base, k);
    // raw = lunghezza vera del capello (0 = pelle). Il sottopelo opaco sta alla radice degli strati;
    // dove e' quasi a pelle sprofonda dentro la testa, cosi' il bordo non si vede
    let raw = 0, dy = 0, dz = 0, shellOff;
    const SKIN_OFF = 0.0003;
    if (kind === 'hair') {
      if (info.e > 0) {
        const r = cut.f(info);
        raw = r.len * smooth(0, edge, info.e);
        dy = r.dy || 0; dz = r.dz || 0;
      }
    } else {
      if (H.beardDy) info.py -= H.beardDy;
      const r = beardLen(styleId, info, H);
      raw = r.len; dy = raw >= 0.004 ? r.dy : 0;
    }
    const tipOff = raw + SKIN_OFF;
    const rootOff = Math.max(tipOff - FUR_DEPTH, SKIN_OFF);
    // fuori dalla zona capelli il guscio resta sotto la pelle (stesso valore del bordo: nessuna linea chiara)
    if (kind === 'hair' && info.e <= 0) shellOff = Math.max(-0.005 + info.e * 0.15, -0.015);
    else shellOff = raw < 0.0025 ? mix(-0.005, SKIN_OFF, smooth(0, 0.0025, raw)) : (FUR_ON ? rootOff : tipOff);
    const kr = tipOff > 0 ? rootOff / tipOff : 0;   // spostamenti (ciuffo) proporzionali all'altezza
    const ks = tipOff > 0 ? clamp(shellOff / tipOff, 0, 1) : 0;
    const b = k * 6;
    put(tip, k, b, tipOff, dy, dz);
    put(inner, k, b, rootOff, dy * kr, dz * kr);
    put(pos, k, b, shellOff, dy * ks, dz * ks);
    lens[k] = raw;
    const h = smooth(0.0025, 0.022, raw);
    c.copy(skin).lerp(stub, smooth(0.0, 0.006, raw)).lerp(hcDeep, h);
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    hair[k] = h;
  }
  return { pos, col, hair, inner, tip, lens };
}

/* =========================================================================
   ORECCHIE, OCCHI, BUSTO, CAPPELLO
   ========================================================================= */
function surface(dir, H) {
  const d = new THREE.Vector3(...dir).normalize();
  const r = headAt(d.x, d.y, d.z, H);
  return { p: new THREE.Vector3(r[0], r[1], r[2]), n: new THREE.Vector3(r[3], r[4], r[5]) };
}

function buildEar(H, side, mat) {
  const ear = new THREE.Group();
  const base = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), mat);
  base.scale.set(0.035, 0.155, 0.095);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 10, 36, Math.PI * 1.55), mat);
  rim.rotation.set(0, Math.PI / 2, Math.PI * 0.62);
  rim.scale.set(1, 1.55, 1);
  rim.position.set(0.03, 0.015, -0.01);
  const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), mat);
  lobe.position.set(0.025, -0.13, 0.015);
  lobe.scale.set(0.6, 1, 1);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(H.skin).multiplyScalar(0.55), roughness: 0.7 }));
  inner.scale.set(0.02, 0.07, 0.045);
  inner.position.set(0.03, -0.02, 0.01);
  ear.add(base, rim, lobe, inner);
  const s = surface([side, -0.06, -0.14], H);
  ear.position.copy(s.p).addScaledVector(s.n, -0.025);
  ear.rotation.y = side > 0 ? -0.25 : 0.25;
  ear.rotation.z = side > 0 ? -0.1 : 0.1;
  ear.scale.set(side < 0 ? -1.7 : 1.7, 1.7, 1.7);
  return ear;
}

const eyeWhite = new THREE.MeshStandardMaterial({ color: '#c9bfb0', roughness: 0.15 });
const irisMat = new THREE.MeshStandardMaterial({ color: '#2a170c', roughness: 0.2 });
const pupilMat = new THREE.MeshStandardMaterial({ color: '#030202', roughness: 0.1 });
function buildEye(H, side, lidMat) {
  const r = 0.1;
  const eye = new THREE.Group();
  eye.add(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), eyeWhite));
  const iris = new THREE.Mesh(new THREE.SphereGeometry(r * 1.004, 28, 8, 0, Math.PI * 2, 0, 0.56), irisMat);
  iris.rotation.x = Math.PI / 2;
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(r * 1.008, 20, 6, 0, Math.PI * 2, 0, 0.2), pupilMat);
  pupil.rotation.x = Math.PI / 2;
  eye.add(iris, pupil);
  // palpebre: superiore pesante (sguardo del boss), inferiore
  const up = new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 32, 16, 0, Math.PI * 2, 0, H.lid - 0.55), lidMat);
  up.rotation.x = 0.55;
  const lo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 32, 12, 0, Math.PI * 2, 0, 1.0), lidMat);
  lo.rotation.x = Math.PI + 0.55;
  eye.add(up, lo);
  const s = surface([side * 0.4, 0.03, 0.92], H);
  eye.position.copy(s.p).addScaledVector(s.n, -r * 0.5);
  eye.rotation.y = side * 0.08;
  return eye;
}

function buildBust(H, neckMat) {
  const o = H.outfit;
  const grp = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: o.suit, roughness: 0.62, metalness: 0.05 });
  const shirt = new THREE.MeshStandardMaterial({ color: o.shirt, roughness: 0.5 });

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.1, 48), neckMat);
  neck.position.set(0, -1.05, -0.16);
  neck.scale.set(1, 1, 0.92);
  grp.add(neck);

  // busto: un'unica forma con camicia a V, revers e cravatta dipinti nei colori dei vertici
  const tg = new THREE.SphereGeometry(1, 160, 96);
  const tp = tg.attributes.position;
  const tc = new Float32Array(tp.count * 3);
  const cSuit = new THREE.Color(o.suit), cShirt = new THREE.Color(o.shirt), cTie = new THREE.Color(o.tieColor);
  const cLapel = cSuit.clone().lerp(new THREE.Color('#5a5a60'), o.tie === 'bow' ? 0.22 : 0.08);
  const c = new THREE.Color();
  for (let k = 0; k < tp.count; k++) {
    const px = tp.getX(k), py = tp.getY(k), pz = tp.getZ(k);
    const X = Math.abs(px * 1.8);
    const w = 0.46 * clamp((py - 0.1) / 0.9, 0, 1);
    // transizioni morbide per evitare bordi seghettati
    const front = smooth(0.0, 0.15, pz);
    const lapW = w + 0.09 + 0.05 * smooth(0.5, 0.95, py);
    c.copy(cSuit).lerp(cLapel, front * smooth(lapW + 0.015, lapW - 0.015, X) * smooth(0.12, 0.2, py));
    c.lerp(cShirt, front * smooth(w + 0.012, w - 0.012, X));
    if (o.tie === 'long') {
      const tw = 0.075 - 0.05 * smooth(0.35, 0.12, py);
      c.lerp(cTie, front * smooth(tw + 0.01, tw - 0.01, X) * smooth(w * 0 + 0.1, 0.16, py));
    }
    tc[k * 3] = c.r; tc[k * 3 + 1] = c.g; tc[k * 3 + 2] = c.b;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(tc, 3));
  const torso = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.04 }));
  torso.scale.set(1.8, 0.8, 0.85);
  torso.position.set(0, -2.12, -0.14);
  grp.add(torso);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.52, 0.26, 48, 1, true), shirt);
  collar.material = shirt.clone(); collar.material.side = THREE.DoubleSide;
  collar.position.set(0, -1.42, -0.12);
  grp.add(collar);

  if (o.tie === 'long') {
    const tm = new THREE.MeshStandardMaterial({ color: o.tieColor, roughness: 0.38, metalness: 0.1 });
    const knot = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), tm);
    knot.scale.set(0.075, 0.085, 0.05); knot.position.set(0, -1.5, 0.38);
    grp.add(knot);
  } else if (o.tie === 'bow') {
    const tm = new THREE.MeshStandardMaterial({ color: o.tieColor, roughness: 0.3, metalness: 0.1 });
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.19, 4), tm);
      w.rotation.z = s * Math.PI / 2; w.position.set(s * 0.095, -1.5, 0.4); w.scale.set(1, 1, 0.45);
      grp.add(w);
    }
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 8), tm); k.position.set(0, -1.5, 0.42);
    grp.add(k);
  }
  if (o.rose) {
    const rm = new THREE.MeshStandardMaterial({ color: '#b00d14', roughness: 0.5, emissive: '#2a0000' });
    const rose = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const pet = new THREE.Mesh(new THREE.SphereGeometry(0.045 - i * 0.003, 12, 8), rm);
      const a = i * 2.4;
      pet.position.set(Math.cos(a) * 0.022 * (i > 0), Math.sin(a) * 0.022 * (i > 0), i * 0.004);
      pet.scale.set(1, 1, 0.7);
      rose.add(pet);
    }
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshStandardMaterial({ color: '#1d3a1a', roughness: 0.6 }));
    leaf.scale.set(0.06, 0.022, 0.012); leaf.position.set(-0.05, -0.04, -0.01); leaf.rotation.z = 0.6;
    rose.add(leaf);
    rose.position.set(0.62, -1.78, 0.6);
    rose.rotation.set(-0.3, 0.25, 0);
    grp.add(rose);
  }
  return grp;
}

function buildHat() {
  const felt = new THREE.MeshStandardMaterial({ color: '#0c0b0b', roughness: 0.8, side: THREE.DoubleSide });
  const band = new THREE.MeshStandardMaterial({ color: '#a3101a', roughness: 0.45 });
  const pts = [
    [1.16, 0.04], [1.18, 0.0], [1.1, -0.012], [0.86, 0.0], [0.82, 0.04],
    [0.8, 0.3], [0.77, 0.5], [0.66, 0.6], [0.4, 0.6], [0.12, 0.54], [0.0, 0.53],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const lathe = new THREE.LatheGeometry(pts, 72);
  // pizzicatura frontale (pinch) tipica del fedora
  const p = lathe.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
    const r = Math.hypot(x, z);
    if (y > 0.25 && r < 0.81) {
      const front = Math.max(0, z / (r || 1));
      const pinch = 1 - 0.12 * Math.pow(front, 3) * smooth(0.25, 0.55, y) * Math.abs(x / (r || 1)) * 2.2;
      p.setX(k, x * pinch);
    }
  }
  lathe.computeVertexNormals();
  const hat = new THREE.Group();
  const shell = new THREE.Mesh(lathe, felt);
  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.805, 0.82, 0.13, 72, 1, true), band);
  ribbon.position.y = 0.11;
  hat.add(shell, ribbon);
  hat.scale.set(0.98, 1, 1.12);
  hat.position.set(0, 0.5, -0.03);
  hat.rotation.set(-0.12, 0, 0.07);
  return hat;
}

/* =========================================================================
   MODELLI SCOLPITI (STL convertiti in .bbm con tools/prepara-modello.mjs)
   ========================================================================= */
const modelCache = {};

// lettura bilineare della mappa dei raggi (in funzione della direzione dal centro testa)
function sampleMap(map, W, Hh, x, y, z) {
  const r = Math.hypot(x, y, z) || 1;
  const th = Math.acos(clamp(y / r, -1, 1));
  const ph = Math.atan2(x, z);
  const u = (ph + Math.PI) / (2 * Math.PI) * W - 0.5;
  const v = clamp(th / Math.PI * Hh - 0.5, 0, Hh - 1.001);
  const i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
  const a0 = ((i0 % W) + W) % W, a1 = (a0 + 1) % W;
  const r0 = j0 * W, r1 = r0 + W;
  return (map[r0 + a0] * (1 - fu) + map[r0 + a1] * fu) * (1 - fv) + (map[r1 + a0] * (1 - fu) + map[r1 + a1] * fu) * fv;
}

function boxBlur(src, W, Hh, rad) {
  const tmp = new Float32Array(W * Hh), out = new Float32Array(W * Hh);
  for (let j = 0; j < Hh; j++) {
    let acc = 0;
    for (let i = -rad; i <= rad; i++) acc += src[j * W + ((i % W) + W) % W];
    for (let i = 0; i < W; i++) {
      tmp[j * W + i] = acc / (2 * rad + 1);
      acc += src[j * W + (i + rad + 1) % W] - src[j * W + (((i - rad) % W) + W) % W];
    }
  }
  for (let i = 0; i < W; i++) {
    for (let j = 0; j < Hh; j++) {
      let acc = 0, c = 0;
      for (let k = Math.max(0, j - rad); k <= Math.min(Hh - 1, j + rad); k++) { acc += tmp[k * W + i]; c++; }
      out[j * W + i] = acc / c;
    }
  }
  return out;
}

// classifica i vertici del busto: 0 pelle/testa, 1 giacca, 2 camicia, 3 papillon
function classifyBust(x, y, z) {
  if (y > -0.25) return 0;
  const zc = z + 0.15, th = Math.abs(Math.atan2(x, zc));
  // bordo superiore del colletto, misurato sul busto (angolo attorno al collo: 0 = davanti)
  const top = curve([[0, -0.88], [0.8, -0.68], [1.57, -0.62], [2.3, -0.31], [Math.PI, -0.28]], th);
  if (y > top) return 0;                                            // pelle (collo, mento)
  if (z > 0.2 && (x / 0.5) ** 2 + ((y + 1.1) / 0.15) ** 2 < 1) return 3;   // papillon
  if (y > top - 0.13) return 2;                                     // colletto della camicia
  const w = curve([[-2.4, 0.24], [-1.6, 0.32], [-1.1, 0.42], [-0.9, 0.45]], y);
  if (z > 0.15 && Math.abs(x) < w && y < -0.85) return 2;           // sparato
  return 1;
}

async function loadModel(H) {
  if (modelCache[H.id]) return modelCache[H.id];
  const buf = await (await fetch(H.model)).arrayBuffer();
  const hd = new Uint32Array(buf, 0, 5);
  const nv = hd[1], ni = hd[2], W = hd[3], Hh = hd[4];
  const P = new Float32Array(buf, 20, nv * 3).slice();
  const I = new Uint32Array(buf, 20 + nv * 12, ni);
  const R = new Float32Array(buf, 20 + nv * 12 + ni * 4, W * Hh);

  // superficie del cranio = media dei raggi nella zona capelli - spessore dei capelli scolpiti
  const wgt = new Float32Array(W * Hh), num = new Float32Array(W * Hh), E = new Float32Array(W * Hh);
  for (let j = 0; j < Hh; j++) {
    const th = (j + 0.5) / Hh * Math.PI;
    for (let i = 0; i < W; i++) {
      const ph = (i + 0.5) / W * Math.PI * 2 - Math.PI;
      const k = j * W + i;
      E[k] = Math.cos(th) - hairline(Math.abs(ph), H);
      wgt[k] = smooth(0.0, 0.08, E[k]) * (R[k] > 0 ? 1 : 0);
      num[k] = R[k] * wgt[k];
    }
  }
  const bn = boxBlur(boxBlur(num, W, Hh, 7), W, Hh, 7);
  const bw = boxBlur(boxBlur(wgt, W, Hh, 7), W, Hh, 7);
  const SURF = new Float32Array(W * Hh);
  for (let k = 0; k < W * Hh; k++) {
    const py = Math.cos((Math.floor(k / W) + 0.5) / Hh * Math.PI);
    const rs = bw[k] > 1e-3 ? bn[k] / bw[k] : R[k];
    const t = (H.thick[0] + H.thick[1] * smooth(0.3, 0.95, py)) * smooth(-0.02, 0.12, E[k]);
    const w = smooth(-0.06, 0.08, E[k]);
    SURF[k] = H.bald ? R[k] : mix(R[k], Math.min(R[k], rs - t), w);
  }

  // "rasatura": i vertici della zona capelli scendono sulla superficie del cranio
  const cls = new Uint8Array(nv);
  for (let v = 0; v < nv; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    cls[v] = H.bust ? 0 : classifyBust(x, y, z);
    if (cls[v] !== 0 || H.bald) continue;   // testa calva: niente da radere
    const r = Math.hypot(x, y, z);
    const e = y / r - hairline(Math.abs(Math.atan2(x, z)), H);
    const w = smooth(-0.06, 0.08, e);
    if (w <= 0) continue;
    const target = sampleMap(SURF, W, Hh, x, y, z);
    if (r < target - 0.12) continue;                          // superfici interne
    const f = mix(r, Math.min(r, target), w) / r;
    P[v * 3] *= f; P[v * 3 + 1] *= f; P[v * 3 + 2] *= f;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setIndex(new THREE.BufferAttribute(I, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  geo.computeVertexNormals();

  // base dei gusci (capelli e barba) campionata sulla superficie rasata
  // dove la mappa "salta" (colletto, papillon, sotto il mento) il guscio viene nascosto dentro la testa
  const RB = boxBlur(R, W, Hh, 3);
  const up = shellUnit.attributes.position.array;
  const ns = up.length / 3;
  const base = new Float32Array(ns * 6);
  const valid = new Uint8Array(ns);
  for (let k = 0; k < ns; k++) {
    const x = up[k * 3], y = up[k * 3 + 1], z = up[k * 3 + 2];
    let r = sampleMap(SURF, W, Hh, x, y, z);
    const jump = Math.abs(sampleMap(R, W, Hh, x, y, z) - sampleMap(RB, W, Hh, x, y, z));
    const bad = !(r > 0.3) || r > 1.35 || y < -0.85 || jump > 0.04;
    if (bad) r = sampleMap(RB, W, Hh, x, y, z) * 0.9 || 0.5;
    valid[k] = bad ? 0 : 1;
    base[k * 6] = x * r; base[k * 6 + 1] = y * r; base[k * 6 + 2] = z * r;
    base[k * 6 + 3] = x; base[k * 6 + 4] = y; base[k * 6 + 5] = z;
  }
  // indici dei gusci senza i triangoli non validi o sempre nascosti (evita "strisce" nel vuoto)
  const fullIdx = shellUnit.index.array;
  const keepHair = [], keepBeard = [];
  const eOf = (k) => up[k * 3 + 1] - hairline(Math.abs(Math.atan2(up[k * 3], up[k * 3 + 2])), H);
  for (let t = 0; t < fullIdx.length; t += 3) {
    const a = fullIdx[t], b = fullIdx[t + 1], c = fullIdx[t + 2];
    if (!(valid[a] && valid[b] && valid[c])) continue;
    if (Math.max(eOf(a), eOf(b), eOf(c)) > -0.15) keepHair.push(a, b, c);
    const face = (k) => up[k * 3 + 1] < 0.35 && Math.abs(Math.atan2(up[k * 3], up[k * 3 + 2])) < 1.45;
    if (face(a) || face(b) || face(c)) keepBeard.push(a, b, c);
  }
  const M = { geo, cls, shellBase: base, nv, SURF, W, Hh,
    hairIndex: new THREE.BufferAttribute(new Uint32Array(keepHair), 1),
    beardIndex: new THREE.BufferAttribute(new Uint32Array(keepBeard), 1) };
  modelCache[H.id] = M;
  return M;
}

function colorModel(M, H) {
  const P = M.geo.attributes.position.array, C = M.geo.attributes.color.array;
  const colorDef = COLORS.find((c) => c.id === state.color) || COLORS[0];
  const skin = new THREE.Color(H.skin);
  const lip = skin.clone().multiply(new THREE.Color(0.85, 0.62, 0.6));
  const brow = skin.clone().lerp(new THREE.Color(colorDef.hex), 0.75);
  const scalp = skin.clone().multiplyScalar(0.93);
  const pal = [null, new THREE.Color(H.outfit.suit), new THREE.Color(H.outfit.shirt), new THREE.Color(H.outfit.tieColor)];
  if (Q.has('cls')) { pal[1] = new THREE.Color('#2040ff'); pal[2] = new THREE.Color('#20ff40'); pal[3] = new THREE.Color('#ff20ff'); }
  const c = new THREE.Color();
  for (let v = 0; v < M.nv; v++) {
    const k = M.cls[v];
    if (k) c.copy(pal[k]);
    else {
      const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      const r = Math.hypot(x, y, z), px = x / r, py = y / r, pz = z / r, ax = Math.abs(px);
      const fr = smooth(0.3, 0.7, pz);
      c.copy(skin);
      const e = py - hairline(Math.abs(Math.atan2(x, z)), H);
      c.lerp(scalp, smooth(-0.02, 0.04, e));
      const pyb = py - (H.beardDy || 0);
      c.lerp(lip, smooth(0.0, 0.5, g(pyb + 0.53, 0.055) * g(ax, 0.2)) * fr);
      const by = 0.17 + 0.04 * Math.sin(clamp((ax - 0.1) / 0.55, 0, 1) * Math.PI * 0.8);
      c.lerp(brow, 0.8 * g(py - by, 0.045) * smooth(0.08, 0.14, ax) * smooth(0.66, 0.56, ax) * fr);
      c.multiplyScalar(1 - 0.12 * g2(ax - 0.38, py, 0.13) * fr);
      // baffi scolpiti: colore dei capelli se la barba scelta li prevede
      if (H.sculptMustache && state.beard !== 'none' && state.beard !== 'ombra') {
        const m = smooth(-0.355, -0.385, pyb) * smooth(-0.5, -0.47, pyb) * smooth(0.3, 0.24, ax) * fr;
        c.lerp(brow, 0.9 * m);
      }
    }
    C[v * 3] = c.r; C[v * 3 + 1] = c.g; C[v * 3 + 2] = c.b;
  }
  M.geo.attributes.color.needsUpdate = true;
}

const sculptMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0 });

/* =========================================================================
   CIOCCHE (fili di capelli e barba) con illuminazione da capello (Kajiya-Kay)
   ========================================================================= */
const STRANDS = { hair: LITE ? 16000 : 38000, beard: LITE ? 6000 : 15000 };
const SEG = 4;

const strandMat = new THREE.ShaderMaterial({
  uniforms: {
    uKey: { value: new THREE.Vector3(3.5, 4, 5).normalize() },
    uKeyC: { value: new THREE.Color(1.0, 0.92, 0.84).multiplyScalar(2.3) },
    uRim: { value: new THREE.Vector3(-4.5, 2.5, -4).normalize() },
    uRimC: { value: new THREE.Color(1.0, 0.12, 0.1).multiplyScalar(1.6) },
    uFill: { value: new THREE.Vector3(-5, 0.5, 3).normalize() },
    uFillC: { value: new THREE.Color(0.6, 0.65, 0.8).multiplyScalar(0.45) },
    uAmb: { value: 0.35 },
    uShine: { value: 80 },
    uSpec: { value: 0.5 },
    uFade: { value: 1 },
  },
  vertexShader: `
    attribute vec3 tangent; attribute vec3 snormal; attribute vec3 color;
    varying vec3 vT; varying vec3 vN; varying vec3 vV; varying vec3 vC;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vT = normalize(normalMatrix * tangent);
      vN = normalize(normalMatrix * snormal);
      vV = -mv.xyz; vC = color;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uKey, uKeyC, uRim, uRimC, uFill, uFillC;
    uniform float uAmb, uShine, uSpec, uFade;
    varying vec3 vT; varying vec3 vN; varying vec3 vV; varying vec3 vC;
    vec3 kk(vec3 T, vec3 N, vec3 V, vec3 L, vec3 Lc) {
      float tl = dot(T, L);
      float wrap = clamp(dot(N, L) * 0.6 + 0.4, 0.0, 1.0);
      float diff = sqrt(max(0.0, 1.0 - tl * tl)) * wrap;
      vec3 H = normalize(L + V);
      float th = dot(T, H);
      float s1 = pow(sqrt(max(0.0, 1.0 - th * th)), uShine);
      vec3 T2 = normalize(T + N * 0.15); float th2 = dot(T2, H);
      float s2 = pow(sqrt(max(0.0, 1.0 - th2 * th2)), uShine * 0.4);
      return Lc * (vC * diff + uSpec * wrap * (s1 * vec3(1.0) + s2 * vC * 2.5));
    }
    void main() {
      vec3 T = normalize(vT), N = normalize(vN), V = normalize(vV);
      vec3 col = vC * uAmb + kk(T, N, V, uKey, uKeyC) + kk(T, N, V, uRim, uRimC) + kk(T, N, V, uFill, uFillC);
      gl_FragColor = vec4(col * uFade, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
});

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// superficie della testa in una direzione qualsiasi: [x,y,z,nx,ny,nz]
const _b6 = new Float32Array(6);
function baseAt(px, py, pz, H) {
  const M = currentModel;
  if (M) {
    const r = sampleMap(M.SURF, M.W, M.Hh, px, py, pz);
    _b6[0] = px * r; _b6[1] = py * r; _b6[2] = pz * r; _b6[3] = px; _b6[4] = py; _b6[5] = pz;
  } else {
    _b6.set(headAt(px, py, pz, H));
  }
  return _b6;
}

// lunghezza e spostamenti del guscio in una direzione
function shellAt(kind, style, H, px, py, pz, out) {
  const b = baseAt(px, py, pz, H);
  fillInfo(px, py, pz, H, b, 0);
  let len = 0, dy = 0, dz = 0, ok = false;
  if (kind === 'hair') {
    const cut = CUTS.find((c) => c.id === style);
    if (info.e > 0) {
      const r = cut.f(info);
      len = r.len * smooth(0, cut.edge || 0.05, info.e);
      dy = r.dy || 0; dz = r.dz || 0;
      ok = true;
    }
  } else {
    if (H.beardDy) info.py -= H.beardDy;
    const r = beardLen(style, info, H);
    len = r.len; dy = r.dy || 0;
    ok = len > 0.004;
  }
  out.ok = ok; out.len = len; out.dy = dy; out.dz = dz;
  out.bx = b[0]; out.by = b[1]; out.bz = b[2]; out.nx = b[3]; out.ny = b[4]; out.nz = b[5];
  return out;
}

const strandMeshes = {};
function buildStrands(kind) {
  if (!Q.has('strands')) return;   // i capelli ora sono fatti a strati; i fili a linee restano solo come opzione
  const H = state.head;
  const style = kind === 'hair' ? state.cut : state.beard;
  const colorDef = COLORS.find((c) => c.id === state.color) || COLORS[0];
  const cut = kind === 'hair' ? CUTS.find((c) => c.id === style) : null;
  const F = new THREE.Vector3(...(kind === 'hair' ? cut.flow : [0, 1, 0.0001])).normalize();
  const n = STRANDS[kind];
  const pos = new Float32Array(n * SEG * 2 * 3);
  const tan = new Float32Array(n * SEG * 2 * 3);
  const nor = new Float32Array(n * SEG * 2 * 3);
  const col = new Float32Array(n * SEG * 2 * 3);
  const rand = rng(kind === 'hair' ? 1234 : 777);
  const base = new THREE.Color(colorDef.hex);
  const grayC = new THREE.Color('#9a958e');
  const S = {}, pts = [];
  for (let i = 0; i <= SEG; i++) pts.push(new THREE.Vector3());
  const d = new THREE.Vector3(), t = new THREE.Vector3(), w = new THREE.Vector3(), c = new THREE.Color();
  const BF = new THREE.Vector3(0, 0.15, 1).normalize();
  let made = 0, tries = 0;
  while (made < n && tries < n * 12) {
    tries++;
    // direzione casuale uniforme
    const u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    d.set(s * Math.cos(a), u, s * Math.sin(a));
    if (kind === 'beard' && (d.y > 0.4 || d.z < -0.2 || (currentModel && d.y < -0.8))) continue;
    shellAt(kind, style, H, d.x, d.y, d.z, S);
    if (!S.ok) continue;
    const L = S.len;
    // zone rasate: meno fili, nessuno dove e' a pelle (sfumature)
    if (L < 0.0035 && rand() > 0.4 * smooth(0.0006, 0.0035, L)) continue;
    const lie = smooth(0.007, 0.03, L);                   // quanto il filo "si stende" pettinato
    const flowDir = kind === 'beard' && d.y > 0.05 ? BF : F;
    const arc = (0.035 + 0.12 * Math.min(L / 0.06, 1.6)) * lie * (0.7 + 0.6 * rand());
    const wig = (rand() - 0.5) * 0.6;
    const hRand = 0.94 + 0.1 * rand();
    let tlen = 0;
    for (let i = 0; i <= SEG; i++) {
      shellAt(kind, style, H, d.x, d.y, d.z, S);
      const f = i / SEG;
      const Lh = Math.max(S.len, 0.0025);
      const h = mix(Lh * mix(0.35, 0.8, lie), Lh * hRand + 0.002, Math.min(1, f * 2.2));
      const k = S.len > 0 ? h / Math.max(S.len, 1e-4) : 0;
      pts[i].set(S.bx + S.nx * h, S.by + S.ny * h + S.dy * Math.min(k, 1), S.bz + S.nz * h + S.dz * Math.min(k, 1));
      if (i === SEG) break;
      // tangente: lontano dal polo di crescita, con una leggera torsione per filo
      t.copy(d).multiplyScalar(d.dot(flowDir)).sub(flowDir);
      if (t.lengthSq() < 1e-6) t.set(0, -1, 0);
      t.normalize();
      w.crossVectors(d, t).multiplyScalar(wig);
      t.add(w).normalize();
      const step = lie > 0.05 ? arc / SEG : 0;
      d.addScaledVector(t, step).normalize();
      tlen += step;
    }
    // stoppia: per i capelli cortissimi il filo esce dritto dalla pelle
    if (lie <= 0.05) {
      const nx = S.nx, ny = S.ny, nz = S.nz;
      const ln = Math.max(S.len, 0.003) * 1.6;
      for (let i = 0; i <= SEG; i++) {
        const f = i / SEG;
        pts[i].set(S.bx + nx * ln * (0.2 + f) + (rand() - 0.5) * 0.002 * f,
          S.by + ny * ln * (0.2 + f), S.bz + nz * ln * (0.2 + f) + (rand() - 0.5) * 0.002 * f);
      }
    }
    // colore per filo (brizzolato = una parte dei fili grigi)
    const gray = rand() < colorDef.gray;
    c.copy(gray ? grayC : base).multiplyScalar(0.75 + 0.5 * rand());
    if (L < 0.006) c.lerp(new THREE.Color(H.skin), 0.35);
    for (let i = 0; i < SEG; i++) {
      const o = (made * SEG + i) * 6;
      const A = pts[i], B = pts[i + 1];
      pos[o] = A.x; pos[o + 1] = A.y; pos[o + 2] = A.z; pos[o + 3] = B.x; pos[o + 4] = B.y; pos[o + 5] = B.z;
      w.subVectors(B, A).normalize();
      tan[o] = tan[o + 3] = w.x; tan[o + 1] = tan[o + 4] = w.y; tan[o + 2] = tan[o + 5] = w.z;
      const rr = A.length() || 1;
      nor[o] = nor[o + 3] = A.x / rr; nor[o + 1] = nor[o + 4] = A.y / rr; nor[o + 2] = nor[o + 5] = A.z / rr;
      const tip = 1 + 0.25 * (i / SEG);
      col[o] = c.r * tip; col[o + 1] = c.g * tip; col[o + 2] = c.b * tip;
      col[o + 3] = c.r * tip * 1.05; col[o + 4] = c.g * tip * 1.05; col[o + 5] = c.b * tip * 1.05;
    }
    made++;
  }
  const cnt = made * SEG * 2;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, cnt * 3), 3));
  geo.setAttribute('tangent', new THREE.BufferAttribute(tan.subarray(0, cnt * 3), 3));
  geo.setAttribute('snormal', new THREE.BufferAttribute(nor.subarray(0, cnt * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col.subarray(0, cnt * 3), 3));
  let mesh = strandMeshes[kind];
  if (!mesh) {
    mesh = new THREE.LineSegments(geo, strandMat.clone());
    mesh.frustumCulled = false;
    strandMeshes[kind] = mesh;
    model.add(mesh);
  } else {
    mesh.geometry.dispose();
    mesh.geometry = geo;
  }
  const rough = kind === 'hair' ? cut.rough : 0.6;
  mesh.material.uniforms.uShine.value = mix(160, 25, rough);
  // riflesso contenuto: con linee da 1 px un riflesso forte rende i capelli "argentati"
  mesh.material.uniforms.uSpec.value = mix(0.2, 0.035, rough);
  mesh.material.uniforms.uFade.value = 0;
  mesh.userData.fadeIn = true;
  mesh.visible = !Q.has('nostrands');
}

/* =========================================================================
   MODELLO (testa + capelli + barba)
   ========================================================================= */
const state = {
  head: HEADS[0], cut: HEADS[0].cut, color: HEADS[0].color, beard: HEADS[0].beard, hat: false,
};
// parametri da URL (utili per test): ?head=don&cut=slick&beard=none&color=nero&hat=1&az=90
if (Q.get('head')) state.head = HEADS.find((h) => h.id === Q.get('head')) || state.head;
state.cut = Q.get('cut') || state.head.cut;
state.beard = Q.get('beard') || state.head.beard;
state.color = Q.get('color') || state.head.color;
state.hat = Q.get('hat') === '1';

const model = new THREE.Group();
scene.add(model);
let headParts = null, shellBase = null;
const hairMesh = makeShellMesh(hairMat);
const beardMesh = makeShellMesh(faceHairMat);
const hat = buildHat();
let morphs = [];
let popT = 1;

function disposeGroup(g) {
  g.traverse((o) => {
    // non buttare le geometrie condivise (gusci) ne' il modello in cache
    if (o.geometry && o.geometry !== hairMesh.geometry && o.geometry !== beardMesh.geometry && o.geometry !== g.userData.keep) o.geometry.dispose();
  });
}

let buildToken = 0;
let currentModel = null;
async function buildHead() {
  const H = state.head;
  const tok = ++buildToken;
  let M = null;
  if (H.model) {
    $('loading').classList.add('on');
    try { M = await loadModel(H); } finally { $('loading').classList.remove('on'); }
    if (tok !== buildToken) return;
  }
  if (headParts) { model.remove(headParts); if (!headParts.userData.cached) disposeGroup(headParts); }
  headParts = new THREE.Group();
  currentModel = M;
  hat.position.set(...(H.hatPos || [0, 0.5, -0.03]));
  hat.scale.set(0.98, 1, 1.12).multiplyScalar(H.hatScale || 1);
  if (M) {
    colorModel(M, H);
    headParts.add(new THREE.Mesh(M.geo, sculptMat));
    headParts.userData.cached = true;
    if (H.bust) {
      // solo testa: spalle, camicia e giacca generate
      const neckMat = skinPlain.clone(); neckMat.color.set(H.skin).multiplyScalar(0.9);
      const bust = buildBust(H, neckMat);
      bust.position.y += H.bustDy || 0;     // colletto alzato fino a coprire la fine del collo del modello
      headParts.add(bust);
      headParts.userData.cached = false;
      headParts.userData.keep = M.geo;
    }
    model.add(headParts);
    shellBase = M.shellBase;
    hairMesh.geometry.setIndex(M.hairIndex);
    beardMesh.geometry.setIndex(M.beardIndex);
    morphs = [];
    applyShell('hair', false);
    applyShell('beard', false);
    if (!hairMesh.parent) model.add(hairMesh, beardMesh);
    hairMesh.visible = beardMesh.visible = !Q.has('noshell');
    model.scale.setScalar(0.94);
    popT = 0;
    return;
  }
  const skinCol = new THREE.Color(H.skin);
  const plain = skinPlain.clone(); plain.color.copy(skinCol);
  const lidMat = plain.clone(); lidMat.color.multiplyScalar(0.92);
  const neckMat = plain.clone(); neckMat.color.multiplyScalar(0.9);

  const head = new THREE.Mesh(buildHeadGeometry(H), skinMat);
  headParts.add(head);
  headParts.add(buildEar(H, 1, plain), buildEar(H, -1, plain));
  headParts.add(buildEye(H, 1, lidMat), buildEye(H, -1, lidMat));
  headParts.add(buildBust(H, neckMat));
  model.add(headParts);

  shellBase = sampleShellBase(H);
  hairMesh.geometry.setIndex(shellUnit.index);
  beardMesh.geometry.setIndex(shellUnit.index);
  morphs = [];
  applyShell('hair', false);
  applyShell('beard', false);
  if (!hairMesh.parent) model.add(hairMesh, beardMesh);
  model.scale.setScalar(0.94);
  popT = 0;
}

// attributi del guscio animati nel passaggio da un taglio all'altro (nome attributo -> campo di computeShell)
const SHELL_ATTRS = [['position', 'pos'], ['color', 'col'], ['aHair', 'hair'], ['aInner', 'inner'], ['aTip', 'tip'], ['aLen', 'lens']];

function applyShell(kind, animate = true) {
  const mesh = kind === 'hair' ? hairMesh : beardMesh;
  const colorDef = COLORS.find((c) => c.id === state.color) || COLORS[0];
  const style = kind === 'hair' ? state.cut : state.beard;
  const res = computeShell(kind, mesh, state.head, shellBase, style, colorDef);
  const mat = mesh.material;
  if (kind === 'hair') {
    const cut = CUTS.find((c) => c.id === style);
    setFlow(mat, cut.flow);
    mat.roughness = cut.rough;
    mat.userData.u.uShine.value = mix(220, 35, cut.rough);
    mat.userData.u.uSpecK.value = mix(0.2, 0.04, cut.rough);
  }
  mat.userData.u.uGray.value = colorDef.gray;
  mat.userData.u.uHairCol.value.set(colorDef.hex);
  const geo = mesh.geometry;
  if (!animate) {
    for (const [name, key] of SHELL_ATTRS) geo.attributes[name].array.set(res[key]);
    finishGeo(geo);
    buildStrands(kind);
    return;
  }
  if (strandMeshes[kind]) strandMeshes[kind].userData.fadeOut = true;
  morphs = morphs.filter((m) => m.geo !== geo);
  morphs.push({
    geo, kind, t: 0,
    from: SHELL_ATTRS.map(([name]) => geo.attributes[name].array.slice()),
    to: SHELL_ATTRS.map(([, key]) => res[key]),
  });
}
function finishGeo(geo) {
  for (const [name] of SHELL_ATTRS) geo.attributes[name].needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
}
function stepMorphs(dt) {
  for (const m of morphs) {
    m.t = Math.min(1, m.t + dt / 0.55);
    const e = m.t < 0.5 ? 4 * m.t * m.t * m.t : 1 - Math.pow(-2 * m.t + 2, 3) / 2;
    SHELL_ATTRS.forEach(([name], a) => {
      const out = m.geo.attributes[name].array, f = m.from[a], t = m.to[a];
      for (let i = 0; i < out.length; i++) out[i] = f[i] + (t[i] - f[i]) * e;
    });
    finishGeo(m.geo);
  }
  for (const m of morphs) if (m.t >= 1) buildStrands(m.kind);
  morphs = morphs.filter((m) => m.t < 1);
}

/* =========================================================================
   INTERFACCIA
   ========================================================================= */
const $ = (id) => document.getElementById(id);

function renderUI() {
  $('heads').innerHTML = '';
  for (const H of HEADS) {
    const b = document.createElement('button');
    b.className = 'head-card' + (H === state.head ? ' on' : '');
    b.innerHTML = `<span class="n">${H.name}</span><span class="r">${H.role}</span>`;
    b.onclick = () => selectHead(H);
    $('heads').appendChild(b);
  }
  $('colors').innerHTML = '';
  for (const C of COLORS) {
    const b = document.createElement('button');
    b.className = 'swatch' + (C.id === state.color ? ' on' : '');
    b.style.background = C.gray
      ? `repeating-linear-gradient(60deg, ${C.hex} 0 3px, #bdb8b0 3px 4px), ${C.hex}`
      : `radial-gradient(circle at 35% 30%, ${lighten(C.hex)} 0%, ${C.hex} 70%)`;
    b.title = C.name;
    b.onclick = () => { state.color = C.id; applyShell('hair'); applyShell('beard'); if (currentModel) colorModel(currentModel, state.head); renderUI(); };
    $('colors').appendChild(b);
  }
  const lab = document.createElement('div');
  lab.className = 'swatch-label';
  lab.textContent = (COLORS.find((c) => c.id === state.color) || COLORS[0]).name;
  $('colors').appendChild(lab);

  $('beards').innerHTML = '';
  for (const B of BEARDS) {
    const b = document.createElement('button');
    b.className = 'chip' + (B.id === state.beard ? ' on' : '');
    b.textContent = B.name;
    b.onclick = () => { state.beard = B.id; applyShell('beard'); if (currentModel) colorModel(currentModel, state.head); renderUI(); };
    $('beards').appendChild(b);
  }
  $('cuts').innerHTML = '';
  CUTS.forEach((C, idx) => {
    if (C.group && (idx === 0 || CUTS[idx - 1].group !== C.group)) {
      const h = document.createElement('div');
      h.className = 'cut-group';
      h.textContent = C.group;
      $('cuts').appendChild(h);
    }
    const b = document.createElement('button');
    b.className = 'cut' + (C.id === state.cut ? ' on' : '');
    b.innerHTML = `<span class="num">${ROMAN[idx]}</span><span class="nm">${C.name}</span><span class="sb">${C.it}</span>`;
    b.onclick = () => { if (state.cut !== C.id) { state.cut = C.id; applyShell('hair'); renderUI(); updateInfo(); } };
    $('cuts').appendChild(b);
  });
  $('hatBtn').classList.toggle('on', state.hat);
}
function lighten(hex) { return '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.25).getHexString(); }

function updateInfo() {
  const C = CUTS.find((c) => c.id === state.cut);
  for (const [id, txt] of [['cutIt', C.it], ['cutName', C.name], ['cutDesc', C.desc]]) {
    const el = $(id); el.textContent = txt;
    el.classList.remove('fade-swap'); void el.offsetWidth; el.classList.add('fade-swap');
  }
}

function selectHead(H) {
  if (H === state.head) return;
  state.head = H; state.cut = H.cut; state.color = H.color; state.beard = H.beard;
  buildHead(); renderUI(); updateInfo();
}

$('hatBtn').onclick = () => { state.hat = !state.hat; hat.visible = state.hat; renderUI(); };

/* ---------- viste e rotazione automatica ---------- */
let autoSpin = !Q.has('nospin');
let lastInput = performance.now();
let viewTween = null;
const sph = new THREE.Spherical();

function goView(az, polar = Math.PI / 2 - 0.05) {
  const off = camera.position.clone().sub(controls.target);
  sph.setFromVector3(off);
  let d = az - sph.theta;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  viewTween = { t: 0, th0: sph.theta, th1: sph.theta + d, ph0: sph.phi, ph1: polar, r: sph.radius };
  lastInput = performance.now();
}
document.querySelectorAll('[data-view]').forEach((b) => {
  b.onclick = () => {
    const v = b.dataset.view;
    goView(v === 'front' ? 0 : v === 'side' ? Math.PI / 2 : Math.PI);
  };
});
$('spinBtn').onclick = () => { autoSpin = !autoSpin; $('spinBtn').classList.toggle('on', autoSpin); if (autoSpin) lastInput = 0; };
$('spinBtn').classList.toggle('on', autoSpin);

const hint = $('hint');
if (Q.has('nohint')) hint.classList.add('gone');
controls.addEventListener('start', () => { lastInput = performance.now(); viewTween = null; hint.classList.add('gone'); });
document.addEventListener('pointerdown', () => { lastInput = performance.now(); });
document.addEventListener('contextmenu', (e) => e.preventDefault());
setTimeout(() => hint.classList.add('gone'), 9000);

/* =========================================================================
   AVVIO E LOOP
   ========================================================================= */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // su schermi stretti allontana un po' la camera
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const startAz = (parseFloat(Q.get('az')) || 0) * Math.PI / 180;
const startD = parseFloat(Q.get('dist')) || 7.6;
if (Q.get('ty')) TARGET.y = parseFloat(Q.get('ty'));
controls.target.copy(TARGET);
camera.position.set(Math.sin(startAz) * startD, parseFloat(Q.get('cy')) || 0.4, Math.cos(startAz) * startD).add(TARGET);
controls.update();

hat.visible = state.hat;
model.add(hat);
buildHead();
renderUI();
updateInfo();


const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  stepMorphs(dt);
  for (const k in strandMeshes) {
    const m = strandMeshes[k], u = m.material.uniforms.uFade;
    if (m.userData.fadeOut) { u.value = Math.max(0, u.value - dt / 0.15); if (u.value === 0) m.userData.fadeOut = false; }
    else if (u.value < 1) u.value = Math.min(1, u.value + dt / 0.35);
    m.visible = u.value > 0.01 && !Q.has('nostrands');
  }

  if (popT < 1) {
    popT = Math.min(1, popT + dt / 0.6);
    const e = 1 - Math.pow(1 - popT, 3);
    model.scale.setScalar(0.9 + 0.1 * e);
  }
  if (viewTween) {
    viewTween.t = Math.min(1, viewTween.t + dt / 0.9);
    const e = viewTween.t < 0.5 ? 2 * viewTween.t ** 2 : 1 - (-2 * viewTween.t + 2) ** 2 / 2;
    sph.set(viewTween.r, mix(viewTween.ph0, viewTween.ph1, e), mix(viewTween.th0, viewTween.th1, e));
    camera.position.setFromSpherical(sph).add(controls.target);
    if (viewTween.t >= 1) viewTween = null;
  }
  controls.autoRotate = autoSpin && !viewTween && performance.now() - lastInput > 8000;
  controls.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();
window.__ready = true;
