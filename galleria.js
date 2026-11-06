// BLACKBLADE — Galleria dei tagli: la testa del modello ruota a 360° trascinando col dito.
// Ogni taglio ha 64 fotogrammi in tagli/<id>/giro/h00.webp ... h63.webp (uno ogni 5.625°),
// generati con tools/prepara-giro.py. Si caricano solo quelli del taglio scelto. Elenco e testi in tagli/tagli.json.
// Il vecchio showroom 3D resta disponibile con ?3d nell'indirizzo.

const Q = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI',
  'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV'];
const N_FR = 120;   // un fotogramma ogni 3 gradi
const STEP = 360 / N_FR;
const NAV = 45;                 // frecce e tastiera: di quanto gira ogni scatto
const GIRO_VER = '3d3';   // cambia quando si rigenerano i giri (il browser ricarica le immagini)
const frameSrc = (id, i) => `tagli/${id}/giro/h${String(i).padStart(3, '0')}.webp?v=${GIRO_VER}`;
const DRAG_DEG_PER_PX = 0.45;   // quanto gira la testa per ogni pixel trascinato
const AUTO_DEG_PER_S = 24;       // vetrina: velocita' di rotazione
const IDLE_MS = 8000;           // dopo quanto riparte la vetrina se nessuno tocca
const CUT_EVERY_DEG = 360;      // in vetrina: cambia taglio dopo un giro completo
const SNAP = [['Fronte', 0], ['Profilo', 90], ['Nuca', 180]];

document.body.classList.add('gallery');

const loadImg = (src) => new Promise((ok) => {
  const im = new Image();
  im.decoding = 'async';
  im.onload = () => ok(im);
  im.onerror = () => ok(null);
  im.src = src;
});

// ---------- stato ----------
let CUTS = [];
const state = { cut: 0, ang: 0 };
let autoSpin = !Q.has('nospin');
let lastInput = -1e9, vel = 0, spun = 0;

// ---------- palco ----------
const stage = document.createElement('div');
stage.id = 'stage';
stage.innerHTML = `
  <div class="frame">
    <canvas class="view"></canvas>
    <div class="empty"><div class="em-t">In preparazione</div><div class="em-s">Questo taglio arriva presto sul modello.</div></div>
    <button class="nav prev" aria-label="Ruota a sinistra">&#8249;</button>
    <button class="nav next" aria-label="Ruota a destra">&#8250;</button>
    <div class="dial"><div class="dial-dot"></div></div>
  </div>`;
document.body.insertBefore(stage, document.querySelector('.vignette').nextSibling);
const cv = stage.querySelector('canvas.view');
const ctx = cv.getContext('2d');
let layers = [];

function fitCanvas() {
  const r = cv.getBoundingClientRect();
  const px = Math.min(1024, Math.round(r.width * (window.devicePixelRatio || 1)));
  if (cv.width !== px) { cv.width = px; cv.height = px; }
}
window.addEventListener('resize', () => { fitCanvas(); drawnImg = null; draw(); });

let mountToken = 0;
async function mountCut() {
  const c = CUTS[state.cut];
  const tok = ++mountToken;
  layers = [];
  fitCanvas(); drawnImg = null;
  stage.querySelector('.empty').classList.toggle('on', !c.has);
  stage.querySelectorAll('.nav, .dial').forEach((b) => { b.style.visibility = c.has ? 'visible' : 'hidden'; });
  if (!c.has) { ctx.clearRect(0, 0, cv.width, cv.height); return; }
  if (!c.frames) {
    $('loading').textContent = 'Carico il taglio…'; $('loading').classList.add('on');
    const fr = await Promise.all(Array.from({ length: N_FR }, (_, i) => loadImg(frameSrc(c.id, i))));
    $('loading').classList.remove('on');
    if (!fr.every(Boolean)) { c.has = false; if (tok === mountToken) mountCut(); return; }
    c.frames = fr;
    // tiene in memoria solo il taglio corrente (il Raspberry ha poca RAM)
    CUTS.forEach((o) => { if (o !== c) o.frames = null; });
  }
  if (tok !== mountToken) return;
  layers = c.frames;
  draw();
}

// mostra l'angolo corrente: solo il fotogramma piu' vicino (niente dissolvenze, come un vero giro 360)
let shown = -1, drawnImg = null;
function draw() {
  if (!layers.length) return;
  const a = ((state.ang % 360) + 360) % 360;
  const i = Math.round(a / STEP) % N_FR;
  if (i !== shown || layers[i] !== drawnImg) {
    ctx.drawImage(layers[i], 0, 0, cv.width, cv.width);
    shown = i; drawnImg = layers[i];
  }
  stage.querySelector('.dial-dot').style.transform = `rotate(${a}deg) translateY(-15px)`;
  const near = Math.round(a / NAV) * NAV % 360;
  document.querySelectorAll('[data-view]').forEach((b) => {
    const target = { front: 0, side: 90, back: 180 }[b.dataset.view];
    b.disabled = !layers.length;
    b.classList.toggle('on', near === target || (target === 90 && near === 270));
  });
  document.querySelectorAll('.thumb').forEach((b) => b.classList.toggle('on', +b.dataset.ang === near || (+b.dataset.ang === 90 && near === 270)));
}

function renderList() {
  const c = CUTS[state.cut];
  // pannello sinistro: scorciatoie fronte / profilo / nuca
  const th = $('thumbs');
  th.innerHTML = '';
  if (!c.has) th.innerHTML = '<p class="g-note">Questo taglio arriva presto sul modello.</p>';
  else SNAP.forEach(([nome, ang]) => {
    const b = document.createElement('button');
    b.className = 'thumb'; b.dataset.ang = ang;
    b.innerHTML = `<img src="${frameSrc(c.id, Math.round(ang / STEP))}" alt=""><span>${nome}</span>`;
    b.onclick = () => { touch(); goTo(ang); };
    th.appendChild(b);
  });

  $('cuts').innerHTML = '';
  CUTS.forEach((C, idx) => {
    if (C.gruppo && (idx === 0 || CUTS[idx - 1].gruppo !== C.gruppo)) {
      const h = document.createElement('div');
      h.className = 'cut-group'; h.textContent = C.gruppo;
      $('cuts').appendChild(h);
    }
    const b = document.createElement('button');
    b.className = 'cut' + (idx === state.cut ? ' on' : '') + (C.has ? '' : ' missing');
    b.innerHTML = `<span class="num">${ROMAN[idx] || idx + 1}</span><span class="nm">${C.nome}</span><span class="sb">${C.has ? C.it : 'In preparazione'}</span>`;
    b.onclick = () => { touch(); selectCut(idx); };
    $('cuts').appendChild(b);
  });
}

function updateInfo() {
  const C = CUTS[state.cut];
  for (const [id, txt] of [['cutIt', C.it], ['cutName', C.nome], ['cutDesc', C.desc]]) {
    const el = $(id); el.textContent = txt;
    el.classList.remove('fade-swap'); void el.offsetWidth; el.classList.add('fade-swap');
  }
}

function selectCut(idx) {
  if (state.cut === idx) return;
  state.cut = idx; state.ang = 0; vel = 0; spun = 0; anim = null;
  mountCut(); renderList(); updateInfo();
}

// ---------- animazioni ----------
let anim = null;  // rotazione animata verso un angolo preciso
function goTo(target, dur = 450) {
  const a = state.ang;
  let d = ((target - a) % 360 + 540) % 360 - 180;
  anim = { from: a, to: a + d, t0: performance.now(), dur };
  vel = 0;
}
function snap() { goTo(Math.round(state.ang / STEP) * STEP, 300); }
function touch() { lastInput = performance.now(); }

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (anim) {
    let t = Math.min(1, (now - anim.t0) / anim.dur);
    t = 1 - Math.pow(1 - t, 3);
    state.ang = anim.from + (anim.to - anim.from) * t;
    if (t >= 1) anim = null;
    draw();
  } else if (!dragging && Math.abs(vel) > 2) {
    // inerzia dopo il trascinamento
    state.ang += vel * dt; vel *= Math.pow(0.04, dt); draw();
    if (Math.abs(vel) <= 2) snap();
  } else if (autoSpin && !dragging && now - lastInput > IDLE_MS && layers.length) {
    const d = AUTO_DEG_PER_S * dt;
    state.ang += d; spun += d; draw();
    if (spun >= CUT_EVERY_DEG) {
      spun = 0;
      for (let k = 1; k <= CUTS.length; k++) {
        const j = (state.cut + k) % CUTS.length;
        if (CUTS[j].has) { if (j !== state.cut) selectCut(j); break; }
      }
    }
  } else if (!autoSpin || dragging || now - lastInput <= IDLE_MS) spun = 0;
  requestAnimationFrame(tick);
}

// ---------- gesti: trascina col dito / col mouse ----------
let dragging = false, px = 0, pt = 0;
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return;
  dragging = true; px = e.clientX; pt = performance.now(); vel = 0; anim = null; touch();
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const now = performance.now();
  const d = (e.clientX - px) * DRAG_DEG_PER_PX;
  state.ang -= d;
  const dtm = Math.max(1, now - pt);
  vel = vel * 0.6 + (-d / (dtm / 1000)) * 0.4;
  px = e.clientX; pt = now; touch(); draw();
});
const endDrag = () => {
  if (!dragging) return;
  dragging = false; touch();
  if (performance.now() - pt > 80) vel = 0;
  vel = Math.max(-400, Math.min(400, vel));
  if (Math.abs(vel) <= 2) snap();
};
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

stage.querySelector('.prev').onclick = (e) => { e.stopPropagation(); touch(); goTo(Math.round(state.ang / NAV) * NAV - NAV); };
stage.querySelector('.next').onclick = (e) => { e.stopPropagation(); touch(); goTo(Math.round(state.ang / NAV) * NAV + NAV); };
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { touch(); goTo(Math.round(state.ang / NAV) * NAV + NAV); }
  if (e.key === 'ArrowLeft') { touch(); goTo(Math.round(state.ang / NAV) * NAV - NAV); }
});
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.querySelectorAll('[data-view]').forEach((b) => {
  b.onclick = () => { touch(); goTo({ front: 0, side: 90, back: 180 }[b.dataset.view]); };
});
$('spinBtn').onclick = () => { autoSpin = !autoSpin; $('spinBtn').classList.toggle('on', autoSpin); if (autoSpin) lastInput = -1e9; };
$('spinBtn').classList.toggle('on', autoSpin);

// ---------- avvio ----------
(async () => {
  $('loading').textContent = 'Preparo la galleria…';
  $('loading').classList.add('on');
  const DATA = await (await fetch('tagli/tagli.json', { cache: 'no-cache' })).json();
  CUTS = DATA.tagli;
  // carica (e precarica) tutte le 8 immagini di ogni taglio che ha il giro completo
  await Promise.all(CUTS.map(async (c) => {
    c.has = !!(await loadImg(frameSrc(c.id, 0)));   // il giro completo si carica quando serve
    c.frames = null;
  }));
  $('loading').classList.remove('on');

  let i = CUTS.findIndex((c) => c.id === Q.get('cut'));
  if (i < 0) i = CUTS.findIndex((c) => c.has);
  state.cut = Math.max(0, i);
  const hint = $('hint');
  hint.lastChild.textContent = ' Trascina col dito per girare la testa';
  if (Q.has('nohint')) hint.classList.add('gone');
  setTimeout(() => hint.classList.add('gone'), 9000);
  stage.addEventListener('pointerdown', () => hint.classList.add('gone'));
  mountCut(); renderList(); updateInfo();
  requestAnimationFrame(tick);
})();
if (Q.has('debug')) window.__bb = { state, draw: () => draw() };
