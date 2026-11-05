// BLACKBLADE - prepara un busto STL per l'app
// Uso: node prepara-modello.mjs <file.stl> <nome-uscita> [triangoli=260000]
//
// 1) unisce i vertici e semplifica la mesh (per il Raspberry)
// 2) la porta nel sistema di riferimento della testa (Y su, faccia verso +Z, testa ~2 unità)
// 3) calcola una "mappa dei raggi" della superficie della testa vista dal centro,
//    usata dall'app per radere i capelli scolpiti e far crescere i tagli.
import fs from 'node:fs';
import path from 'node:path';
import { MeshoptSimplifier } from 'meshoptimizer';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const [, , inFile, outName, triArg] = process.argv;
if (!inFile || !outName) { console.log('Uso: node prepara-modello.mjs <file.stl> <nome> [triangoli]'); process.exit(1); }
const TARGET_TRIS = +(triArg || 260000);

// ---- parametri del busto (misurati sul modello: centro testa, mento, cima, verso della faccia)
const CFG = JSON.parse(fs.readFileSync(new URL('./modelli.json', import.meta.url)))[outName];
if (!CFG) { console.log('Manca la configurazione in tools/modelli.json per', outName); process.exit(1); }

// ---- lettura STL binario
const buf = fs.readFileSync(inFile);
const nTri = buf.readUInt32LE(80);
console.log('Triangoli originali:', nTri);

// ---- saldatura vertici
const map = new Map();
const pos = [];
const idx = new Uint32Array(nTri * 3);
const q = 1e4;
for (let i = 0; i < nTri; i++) {
  const o = 84 + i * 50 + 12;
  for (let v = 0; v < 3; v++) {
    const x = buf.readFloatLE(o + v * 12), y = buf.readFloatLE(o + v * 12 + 4), z = buf.readFloatLE(o + v * 12 + 8);
    const key = Math.round(x * q) + ',' + Math.round(y * q) + ',' + Math.round(z * q);
    let id = map.get(key);
    if (id === undefined) { id = pos.length / 3; map.set(key, id); pos.push(x, y, z); }
    idx[i * 3 + v] = id;
  }
}
let positions = new Float32Array(pos);
console.log('Vertici unici:', positions.length / 3);

// ---- semplificazione
await MeshoptSimplifier.ready;
const [simp, err] = MeshoptSimplifier.simplify(idx, positions, 3, TARGET_TRIS * 3, 0.002, []);
console.log('Triangoli dopo semplificazione:', simp.length / 3, 'errore', err.toFixed(5));

// compatta i vertici usati
const remap = new Int32Array(positions.length / 3).fill(-1);
const outPos = [];
const outIdx = new Uint32Array(simp.length);
for (let i = 0; i < simp.length; i++) {
  const v = simp[i];
  if (remap[v] < 0) {
    remap[v] = outPos.length / 3;
    // trasformazione nel riferimento della testa
    const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    const [cx, cy, cz] = CFG.center, s = CFG.scale;
    // STL: Z su, faccia verso -Y  ->  app: Y su, faccia verso +Z
    outPos.push((x - cx) * s, (z - cz) * s, -(y - cy) * s);
  }
  outIdx[i] = remap[v];
}
const P = new Float32Array(outPos);
console.log('Vertici finali:', P.length / 3);

// ---- mappa dei raggi (raycast dall'esterno verso il centro della testa)
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
geo.setIndex(new THREE.BufferAttribute(outIdx, 1));
const bvh = new MeshBVH(geo);
const W = 512, H = 256, START = 1.7;
const rmap = new Float32Array(W * H);
const ray = new THREE.Ray();
const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
for (let j = 0; j < H; j++) {
  const th = (j + 0.5) / H * Math.PI;
  for (let i = 0; i < W; i++) {
    const ph = (i + 0.5) / W * Math.PI * 2 - Math.PI;
    const d = new THREE.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph));
    ray.origin.copy(d).multiplyScalar(START);
    ray.direction.copy(d).negate();
    const hit = bvh.raycastFirst(ray, mat.side);
    rmap[j * W + i] = hit ? START - hit.distance : 0;
  }
}

// ---- scrittura: [magic 'BBM1'][nv][ni][W][H] + posizioni + indici + mappa
const outDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', 'modelli');
const header = new Uint32Array([0x314d4242, P.length / 3, outIdx.length, W, H]);
const file = Buffer.concat([
  Buffer.from(header.buffer), Buffer.from(P.buffer), Buffer.from(outIdx.buffer), Buffer.from(rmap.buffer),
]);
const outFile = path.join(outDir, outName + '.bbm');
fs.writeFileSync(outFile, file);
console.log('Scritto', outFile, (file.length / 1048576).toFixed(1), 'MB');
