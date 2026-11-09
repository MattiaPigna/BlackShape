// BLACKBLADE — Galleria dei tagli: la testa del modello gira trascinando col dito.
// Ogni taglio ha 10 viste prese direttamente dal foglio AI (capelli con la qualita' originale, niente 3D):
// tagli/<id>/viste/v0.webp ... v9.webp (+ t.webp miniatura), generate con tools/prepara-viste.py.
// Elenco, testi e schede in tagli/tagli.json.
//
// Schermo: a sinistra la testa grande, a destra la colonna con nome del taglio, viste, "Scelgo questo",
// schede Classici/Moderni e miniature. "Scelgo questo" apre la scheda da mostrare al barbiere.

const Q = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
// angolo di ogni vista (0 = fronte, 90 = profilo sinistro, 180 = nuca); v6-v9 sono le viste specchiate
const ANGLES = [0, 45, 90, 125, 155, 180, 205, 235, 270, 315];
const VISTE_VER = 'ai7';   // cambia quando si rigenerano le viste (il browser ricarica le immagini)
// passaggio tra due viste vicine: per la parte centrale del tratto le due immagini si dissolvono l'una
// nell'altra seguendo l'angolo; nel resto si vede una sola vista nitida. 0 = scatto netto, 1 = sempre sfumato
const BLEND = Math.min(1, Math.max(0, Q.has('blend') ? +Q.get('blend') : 0.35));
const frameSrc = (c, i) => `tagli/${c.id}/viste/v${i}.webp?v=${VISTE_VER}`;
const thumbSrc = (c) => `tagli/${c.id}/viste/t.webp?v=${VISTE_VER}`;
const angDist = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);
const viewAt = (ang) => {   // vista piu' vicina all'angolo
  let best = 0;
  ANGLES.forEach((a, i) => { if (angDist(ang, a) < angDist(ang, ANGLES[best])) best = i; });
  return best;
};
const DRAG_DEG_PER_PX = 0.45;   // quanto gira la testa per ogni pixel trascinato
const AUTO_DEG_PER_S = 24;       // vetrina: velocita' di rotazione
const IDLE_MS = 8000;           // dopo quanto riparte la vetrina se nessuno tocca
const PICK_IDLE_MS = 90000;     // la scheda "Scelgo questo" si chiude da sola dopo 90 s senza tocchi
const STANDBY_MS = (+Q.get('standby') || 45) * 1000;   // dopo quanto compare il logo (standby); ?standby=secondi
const SPIN_MS = 3200;           // scegliendo un taglio la testa fa un giro completo in questo tempo
const CUT_EVERY_DEG = 360;      // in vetrina: cambia taglio dopo un giro completo

document.body.classList.add('gallery');

const loadImg = (src) => new Promise((ok) => {
  const im = new Image();
  im.decoding = 'async';
  im.onload = () => ok(im);
  im.onerror = () => ok(null);
  im.src = src;
});

// ---------- stato ----------
let CUTS = [], GROUPS = [], VISI = {};
const state = { cut: 0, ang: 0, tab: null, face: null };
let autoSpin = !Q.has('nospin');
// all'avvio la vetrina parte subito, il logo di standby arriva dopo STANDBY_MS
let lastInput = performance.now() - IDLE_MS, vel = 0, spun = 0, pickOpen = false, quizOpen = false;

// ---------- palco (testa grande) ----------
const stage = document.createElement('div');
stage.id = 'stage';
stage.innerHTML = `
  <div class="frame">
    <canvas class="view"></canvas>
    <div class="empty"><div class="em-t">In preparazione</div><div class="em-s">Questo taglio arriva presto sul modello.</div></div>
    <button class="nav prev" aria-label="Ruota a sinistra">&#8249;</button>
    <button class="nav next" aria-label="Ruota a destra">&#8250;</button>
    <div class="attract">Tocca e trascina per scegliere il tuo taglio</div>
  </div>`;
document.body.insertBefore(stage, document.querySelector('.vignette').nextSibling);
const cv = stage.querySelector('canvas.view');
const ctx = cv.getContext('2d');
ctx.imageSmoothingQuality = 'high';
let layers = [];

// ---------- colonna destra: si riusano gli elementi di index.html (logo, nome, viste, elenco) ----------
const side = document.createElement('aside');
side.id = 'side';
side.innerHTML = `
  <div class="s-info"></div>
  <button id="pickBtn" class="pick-btn">✂ Scelgo questo</button>
  <div class="tabs" id="tabs"></div>`;
document.body.appendChild(side);
side.prepend(document.querySelector('.brand'));
const info = side.querySelector('.s-info');
['cutIt', 'cutName', 'cutDesc'].forEach((id) => info.appendChild($(id)));
const tagsEl = document.createElement('div');
tagsEl.className = 'cut-tags';
info.appendChild(tagsEl);
info.appendChild(document.querySelector('.views'));
side.appendChild($('cuts'));

// ---------- scheda "Scelgo questo" da mostrare al barbiere ----------
const pick = document.createElement('div');
pick.id = 'pick';
pick.innerHTML = `
  <div class="pk-card">
    <div class="pk-k">Il tuo taglio</div>
    <div class="pk-name"></div>
    <div class="pk-it"></div>
    <div class="pk-shots"></div>
    <div class="pk-tags"></div>
    <div class="pk-desc"></div>
    <div class="pk-note">Mostra questa schermata al barbiere</div>
    <button class="pk-close">Cambia taglio</button>
  </div>`;
document.body.appendChild(pick);

// ---------- schede del taglio: ritocco, prodotto, durata (campo "info" in tagli.json) ----------
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function tagsHtml(C, full) {
  const I = C.info;
  if (!I) return '';
  const t = full
    ? [['✂', `In poltrona ${I.durata}`], ['⟳', `Ritocco ogni ${I.ritocco}`], ['◆', `Prodotto: ${I.prodotto}`],
       ['☀', I.piega ? `Piega: ${I.piega} min al mattino` : 'Pronto senza piega'],
       ...(visiPer(C).length ? [['◎', visiPer(C).length === Object.keys(VISI).length ? 'Sta bene con ogni forma di viso'
         : `Ideale per viso ${visiPer(C).map((k) => VISI[k].nome.toLowerCase()).join(', ')}`]] : [])]
    : [['✂', I.durata], ['⟳', `ogni ${I.ritocco.replace('settimane', 'sett.')}`], ['◆', I.prodotto]];
  return t.map(([ic, tx]) => `<span><b>${ic}</b>${esc(tx)}</span>`).join('');
}

// ---------- forma del viso (campo "visi" in tagli.json) ----------
const FACE_SVG = {
  ovale: '<ellipse cx="30" cy="40" rx="19" ry="30"/>',
  rotondo: '<circle cx="30" cy="41" r="25"/>',
  quadrato: '<rect x="7" y="13" width="46" height="56" rx="9"/>',
  rettangolare: '<rect x="12" y="5" width="36" height="70" rx="11"/>',
  triangolare: '<path d="M21 9H39Q44 9 45 17L54 60Q55 73 43 73H17Q5 73 6 60L15 17Q16 9 21 9Z"/>',
  diamante: '<path d="M30 5Q36 5 40 19L53 40L39 66Q33 76 30 76Q27 76 21 66L7 40L20 19Q24 5 30 5Z"/>',
};
const faceSvg = (k) => `<svg viewBox="0 0 60 80" aria-hidden="true">${FACE_SVG[k] || '<text x="30" y="52" text-anchor="middle">?</text>'}</svg>`;
const visiPer = (C) => Object.keys(VISI).filter((k) => VISI[k].si.includes(C.id));

// ---------- "Trova il tuo taglio": viso + 3 domande, poi i 3 tagli piu' adatti ----------
const QUIZ = [
  { q: 'Che forma ha il tuo viso?', k: 'viso', faces: true },
  { q: 'Come li vuoi?', k: 'lunghezza', opts: [['Corti', 'corto'], ['Medi', 'medio'], ['Lunghi', 'lungo']] },
  { q: 'I lati?', k: 'sfumatura', opts: [['Sfumati', 'si'], ['Naturali', 'no'], ['Indifferente', 'x']] },
  { q: 'Quanto tempo per sistemarli al mattino?', k: 'piega', opts: [['Zero, pronti subito', '0'], ['Pochi minuti', '5'], ['Mi piace curarli', '10']] },
];
function quizScore(C, ans) {
  const I = C.info;
  if (!I) return -1;
  const L = ['corto', 'medio', 'lungo'];
  const dl = Math.abs(L.indexOf(I.lunghezza) - L.indexOf(ans.lunghezza));
  let sc = dl === 0 ? 3 : dl === 1 ? 1 : 0;
  if (ans.sfumatura === 'si' && I.sfumatura) sc += 2;
  if (ans.sfumatura === 'no' && !I.sfumatura) sc += 2;
  const V = VISI[ans.viso];
  if (V) {
    if (V.no.includes(C.id)) return -1;   // da evitare per questo viso: escluso
    if (V.si.includes(C.id)) sc += 3;
  }
  const p = I.piega;
  if (ans.piega === '0') sc += p === 0 ? 3 : p <= 2 ? 2 : p <= 3 ? 1 : 0;
  if (ans.piega === '5') sc += p >= 3 && p <= 5 ? 2 : p <= 2 ? 1 : 0;
  if (ans.piega === '10') sc += p >= 10 ? 2 : p >= 5 ? 1 : 0;
  return sc;
}
const quiz = document.createElement('div');
quiz.id = 'quiz';
quiz.innerHTML = `
  <div class="qz-card">
    <div class="qz-k">✦ Trova il tuo taglio</div>
    <div class="qz-step"></div>
    <div class="qz-q"></div>
    <div class="qz-opts"></div>
    <div class="qz-bar"><button class="qz-back">‹ Indietro</button><button class="qz-close">Chiudi</button></div>
  </div>`;
document.body.appendChild(quiz);
let qStep = 0, qAns = {};
function renderQuiz() {
  const opts = quiz.querySelector('.qz-opts');
  quiz.querySelector('.qz-back').style.visibility = qStep > 0 ? 'visible' : 'hidden';
  if (qStep < QUIZ.length) {
    const Qz = QUIZ[qStep];
    quiz.querySelector('.qz-step').textContent = `Domanda ${qStep + 1} di ${QUIZ.length}`;
    quiz.querySelector('.qz-q').textContent = Qz.q;
    opts.className = 'qz-opts' + (Qz.faces ? ' qz-faces' : '');
    opts.innerHTML = '';
    const list = Qz.faces
      ? [...Object.entries(VISI).map(([k, V]) => [V.nome, k, V.come]), ['Non lo so', 'x', 'Salta questa domanda']]
      : Qz.opts;
    list.forEach(([label, val, hint]) => {
      const b = document.createElement('button');
      if (Qz.faces) b.innerHTML = `${faceSvg(val)}<span class="fn">${esc(label)}</span><span class="fh">${esc(hint)}</span>`;
      else b.textContent = label;
      b.onclick = () => { touch(); qAns[Qz.k] = val; qStep++; renderQuiz(); };
      opts.appendChild(b);
    });
    return;
  }
  // risultati: i 3 tagli col punteggio piu' alto (a parita' vale l'ordine dell'elenco)
  const best = CUTS.map((C, idx) => ({ C, idx, sc: C.has ? quizScore(C, qAns) : -1 }))
    .filter((r) => r.sc >= 0).sort((a, b) => b.sc - a.sc || a.idx - b.idx).slice(0, 3);
  quiz.querySelector('.qz-step').textContent = 'Fatti per te';
  quiz.querySelector('.qz-q').textContent = 'Tocca un taglio per vederlo';
  opts.className = 'qz-opts qz-res';
  opts.innerHTML = '';
  best.forEach(({ C, idx }) => {
    const b = document.createElement('button');
    b.className = 'qz-cut';
    const fit = VISI[qAns.viso] && VISI[qAns.viso].si.includes(C.id)
      ? `<span class="qz-fit">✓ Ideale per viso ${esc(VISI[qAns.viso].nome.toLowerCase())}</span>` : '';
    b.innerHTML = `<img src="${thumbSrc(C)}" alt=""><span class="nm">${esc(C.nome)}</span><span class="it">${esc(C.it)}</span>${fit}` +
      `<span class="cut-tags">${tagsHtml(C, false)}</span>`;
    b.onclick = () => { closeQuiz(); selectCut(idx); spinShow(); };
    opts.appendChild(b);
  });
}
function openQuiz() { qStep = 0; qAns = {}; renderQuiz(); quizOpen = true; quiz.classList.add('on'); touch(); }
function closeQuiz() { quizOpen = false; quiz.classList.remove('on'); touch(); }
quiz.querySelector('.qz-close').onclick = closeQuiz;
quiz.querySelector('.qz-back').onclick = () => { touch(); if (qStep > 0) { qStep--; renderQuiz(); } };
quiz.addEventListener('pointerdown', touch);

// ---------- standby: logo BLACKBLADE a tutto schermo quando nessuno usa l'app ----------
const standby = document.createElement('div');
standby.id = 'standby';
standby.innerHTML = `
  <div class="sb-logo">
    ${document.querySelector('.brand .razor').outerHTML}
    <h1>BLACKBLADE</h1>
    <p class="sb-tag">Barberia · <em>Un taglio che non potrai rifiutare</em></p>
    <p class="sb-touch">Tocca lo schermo per scegliere il tuo taglio</p>
    <button class="sb-quiz">✦ Non sai cosa scegliere? Trova il tuo taglio</button>
  </div>`;
document.body.appendChild(standby);
let standbyOn = false;
function setStandby(on) {
  if (on === standbyOn) return;
  standbyOn = on; standby.classList.toggle('on', on);
}
standby.addEventListener('pointerdown', touch);
standby.addEventListener('click', (e) => { e.stopPropagation(); touch(); setStandby(false); });
standby.querySelector('.sb-quiz').addEventListener('click', (e) => { e.stopPropagation(); setStandby(false); openQuiz(); });

function openPick() {
  const C = CUTS[state.cut];
  if (!C.has) return;
  pick.querySelector('.pk-name').textContent = C.nome;
  pick.querySelector('.pk-it').textContent = C.it;
  pick.querySelector('.pk-desc').textContent = C.desc;
  pick.querySelector('.pk-tags').innerHTML = tagsHtml(C, true);
  pick.querySelector('.pk-shots').innerHTML = [['Fronte', 0], ['Profilo', 90], ['Nuca', 180]]
    .map(([n, a]) => `<figure><img src="${frameSrc(C, viewAt(a))}" alt=""><figcaption>${n}</figcaption></figure>`).join('');
  pickOpen = true; pick.classList.add('on'); touch();
}
function closePick() { pickOpen = false; pick.classList.remove('on'); touch(); }
$('pickBtn').onclick = openPick;
pick.querySelector('.pk-close').onclick = closePick;
pick.addEventListener('pointerdown', touch);

function fitCanvas() {
  const r = cv.getBoundingClientRect();
  const px = Math.min(1024, Math.round(r.width * (window.devicePixelRatio || 1)));
  if (cv.width !== px) { cv.width = px; cv.height = px; }
}
window.addEventListener('resize', () => { fitCanvas(); drawnKey = ''; draw(); });

let mountToken = 0;
async function mountCut() {
  const c = CUTS[state.cut];
  const tok = ++mountToken;
  layers = [];
  fitCanvas(); drawnKey = '';
  stage.querySelector('.empty').classList.toggle('on', !c.has);
  stage.querySelectorAll('.nav').forEach((b) => { b.style.visibility = c.has ? 'visible' : 'hidden'; });
  $('pickBtn').disabled = !c.has;
  if (!c.has) { ctx.clearRect(0, 0, cv.width, cv.height); return; }
  if (!c.frames) {
    // tiene in memoria solo il taglio corrente (il Raspberry ha poca RAM): libera gli altri prima di caricare
    CUTS.forEach((o) => { if (o !== c) o.frames = null; });
    $('loading').textContent = 'Carico il taglio…'; $('loading').classList.add('on');
    const fr = await Promise.all(ANGLES.map((_, i) => loadImg(frameSrc(c, i))));
    if (tok === mountToken) $('loading').classList.remove('on');
    if (!fr.every(Boolean)) { c.has = false; if (tok === mountToken) mountCut(); return; }
    if (tok !== mountToken) return;   // nel frattempo e' stato scelto un altro taglio: non tenerlo in memoria
    c.frames = fr;
  }
  if (tok !== mountToken) return;
  layers = c.frames;
  drawnKey = '';
  draw();
}

// disegna la testa all'angolo corrente: la vista prima e quella dopo, sfumate solo vicino a meta' strada
let drawnKey = '';
function draw() {
  if (!layers.length) return;
  const a = ((state.ang % 360) + 360) % 360;
  let i0 = ANGLES.length - 1;
  for (let k = 0; k < ANGLES.length; k++) if (ANGLES[k] <= a) i0 = k;
  const i1 = (i0 + 1) % ANGLES.length;
  const a0 = ANGLES[i0], a1 = i1 ? ANGLES[i1] : 360;
  const f = ((a - a0 + 360) % 360) / (a1 - a0);          // 0 = vista i0, 1 = vista i1
  let w = BLEND > 0 ? Math.min(1, Math.max(0, (f - 0.5) / BLEND + 0.5)) : (f >= 0.5 ? 1 : 0);
  w = w * w * (3 - 2 * w);                                 // entra ed esce morbida
  w = Math.round(w * 32) / 32;                             // evita di ridisegnare per differenze invisibili
  const key = i0 + ':' + i1 + ':' + w + ':' + cv.width;
  if (key !== drawnKey) {
    drawnKey = key;
    const W = cv.width;
    ctx.globalAlpha = 1;
    ctx.drawImage(layers[w >= 1 ? i1 : i0], 0, 0, W, W);
    if (w > 0 && w < 1) { ctx.globalAlpha = w; ctx.drawImage(layers[i1], 0, 0, W, W); ctx.globalAlpha = 1; }
  }
  const near = [0, 90, 180, 270].reduce((m, x) => (angDist(a, x) < angDist(a, m) ? x : m), 0);
  document.querySelectorAll('[data-view]').forEach((b) => {
    const target = { front: 0, side: 90, back: 180 }[b.dataset.view];
    b.disabled = !layers.length;
    b.classList.toggle('on', near === target || (target === 90 && near === 270));
  });
}

// schede Classici / Moderni / Viso + miniature dei tagli
const FACE_TAB = '__viso';
function cutButton(C, idx) {
  const b = document.createElement('button');
  b.className = 'cut' + (idx === state.cut ? ' on' : '') + (C.has ? '' : ' missing');
  b.innerHTML = (C.has ? `<img src="${thumbSrc(C)}" alt="" loading="lazy">` : '<span class="ph">In arrivo</span>') +
    `<span class="nm">${esc(C.nome)}</span>`;
  // dalla scheda Viso si resta li': l'elenco dei tagli adatti non sparisce
  b.onclick = () => { touch(); selectCut(idx, state.tab === FACE_TAB); spinShow(); };
  return b;
}
function renderList() {
  const tabs = $('tabs');
  tabs.innerHTML = '';
  const tabList = GROUPS.map((g) => [g, g]);
  if (Object.keys(VISI).length) tabList.push(['◎ Viso', FACE_TAB]);
  tabList.forEach(([label, key]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = (key === FACE_TAB ? 'tab-face ' : '') + (key === state.tab ? 'on' : '');
    b.onclick = () => { touch(); state.tab = key; renderList(); $('cuts').scrollTop = 0; };
    tabs.appendChild(b);
  });
  const qb = document.createElement('button');
  qb.className = 'tab-quiz'; qb.textContent = '✦ Trova';
  qb.onclick = openQuiz;
  tabs.appendChild(qb);

  const box = $('cuts');
  box.innerHTML = '';
  if (state.tab === FACE_TAB) {
    // scheda Viso: si tocca la forma del viso e compaiono tutti i tagli consigliati
    const fp = document.createElement('div');
    fp.className = 'face-pick';
    Object.entries(VISI).forEach(([k, V]) => {
      const b = document.createElement('button');
      b.className = k === state.face ? 'on' : '';
      b.innerHTML = `${faceSvg(k)}<span>${esc(V.nome)}</span>`;
      b.onclick = () => { touch(); state.face = k; renderList(); };
      fp.appendChild(b);
    });
    box.appendChild(fp);
    const note = document.createElement('p');
    note.className = 'face-note';
    const V = VISI[state.face];
    note.textContent = V ? `${V.come} Tagli consigliati:` : 'Tocca la forma del tuo viso per vedere i tagli che ti stanno meglio.';
    box.appendChild(note);
    if (V) CUTS.forEach((C, idx) => { if (V.si.includes(C.id)) box.appendChild(cutButton(C, idx)); });
    return;
  }
  CUTS.forEach((C, idx) => { if ((C.gruppo || '') === state.tab) box.appendChild(cutButton(C, idx)); });
  // porta in vista il taglio scelto (dopo che caratteri e miniature hanno preso la loro misura)
  setTimeout(() => {
    const on = box.querySelector('.cut.on');
    if (on) box.scrollTo({ top: on.offsetTop - box.offsetTop - (box.clientHeight - on.offsetHeight) / 2, behavior: 'smooth' });
  }, 250);
}

function updateInfo() {
  const C = CUTS[state.cut];
  for (const [id, txt] of [['cutIt', C.it], ['cutName', C.nome], ['cutDesc', C.desc]]) {
    const el = $(id); el.textContent = txt;
    el.classList.remove('fade-swap'); void el.offsetWidth; el.classList.add('fade-swap');
  }
  tagsEl.innerHTML = tagsHtml(C, false);
}

function selectCut(idx, keepTab) {
  if (state.cut === idx) return;
  state.cut = idx; state.ang = 0; vel = 0; spun = 0; anim = null;
  if (!keepTab) state.tab = CUTS[idx].gruppo || '';
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
function snap() { goTo(ANGLES[viewAt(state.ang)], 300); }
// giro completo di presentazione quando si sceglie un taglio (parte e finisce di fronte)
function spinShow() {
  const a = Math.round(state.ang / 360) * 360;
  state.ang = a; vel = 0;
  anim = { from: a, to: a + 360, t0: performance.now(), dur: SPIN_MS, smooth: true };
}
// frecce e tastiera: vista successiva / precedente
function step(dir) {
  const n = ANGLES.length, i = (viewAt(state.ang) + dir + n) % n;
  touch(); goTo(ANGLES[i]);
}
function touch() { lastInput = performance.now(); }

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (pickOpen && now - lastInput > PICK_IDLE_MS) closePick();
  if (quizOpen && now - lastInput > PICK_IDLE_MS) closeQuiz();
  const modal = pickOpen || quizOpen;
  setStandby(!modal && now - lastInput > STANDBY_MS);
  const idle = autoSpin && !modal && !dragging && now - lastInput > IDLE_MS && layers.length;
  stage.classList.toggle('attracting', !!idle);
  if (anim) {
    let t = Math.min(1, (now - anim.t0) / anim.dur);
    t = anim.smooth ? t * t * (3 - 2 * t) : 1 - Math.pow(1 - t, 3);   // giro: parte e frena dolce
    state.ang = anim.from + (anim.to - anim.from) * t;
    if (t >= 1) anim = null;
    draw();
  } else if (!dragging && Math.abs(vel) > 2) {
    // inerzia dopo il trascinamento
    state.ang += vel * dt; vel *= Math.pow(0.04, dt); draw();
    if (Math.abs(vel) <= 2) snap();
  } else if (idle) {
    // vetrina: gira da sola e ogni giro passa al taglio successivo
    const d = AUTO_DEG_PER_S * dt;
    state.ang += d; spun += d; draw();
    if (spun >= CUT_EVERY_DEG) {
      spun = 0;
      for (let k = 1; k <= CUTS.length; k++) {
        const j = (state.cut + k) % CUTS.length;
        if (CUTS[j].has) { if (j !== state.cut) selectCut(j); break; }
      }
    }
  } else spun = 0;
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
side.addEventListener('pointerdown', touch);
side.addEventListener('scroll', touch, true);

stage.querySelector('.prev').onclick = (e) => { e.stopPropagation(); step(-1); };
stage.querySelector('.next').onclick = (e) => { e.stopPropagation(); step(1); };
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pickOpen) closePick();
  if (e.key === 'Escape' && quizOpen) closeQuiz();
  if (pickOpen || quizOpen) return;
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.querySelectorAll('[data-view]').forEach((b) => {
  b.onclick = () => { touch(); goTo({ front: 0, side: 90, back: 180 }[b.dataset.view]); };
});
$('spinBtn').onclick = () => { autoSpin = !autoSpin; $('spinBtn').classList.toggle('on', autoSpin); if (autoSpin) lastInput = performance.now() - IDLE_MS; };
$('spinBtn').classList.toggle('on', autoSpin);

// ---------- avvio ----------
(async () => {
  $('loading').textContent = 'Preparo la galleria…';
  $('loading').classList.add('on');
  const DATA = await (await fetch('tagli/tagli.json', { cache: 'no-cache' })).json();
  CUTS = DATA.tagli;
  GROUPS = [...new Set(CUTS.map((c) => c.gruppo || ''))];
  VISI = DATA.visi || {};
  if (!Object.keys(VISI).length) QUIZ.shift();   // senza dati sui visi il quiz parte dalla lunghezza
  // controlla quali tagli hanno le viste (le altre si caricano quando si sceglie il taglio)
  await Promise.all(CUTS.map(async (c) => {
    c.has = !!(await loadImg(frameSrc(c, 0)));
    c.frames = null;
  }));
  $('loading').classList.remove('on');

  let i = CUTS.findIndex((c) => c.id === Q.get('cut'));
  if (i < 0) i = CUTS.findIndex((c) => c.has);
  state.cut = Math.max(0, i);
  state.tab = CUTS[state.cut].gruppo || '';
  const hint = $('hint');
  hint.lastChild.textContent = ' Trascina col dito per girare la testa';
  if (Q.has('nohint')) hint.classList.add('gone');
  setTimeout(() => hint.classList.add('gone'), 9000);
  stage.addEventListener('pointerdown', () => hint.classList.add('gone'));
  mountCut(); renderList(); updateInfo();
  if (Q.has('pick')) openPick();
  if (Q.has('quiz')) openQuiz();
  requestAnimationFrame(tick);
})();
if (Q.has('debug')) window.__bb = { state, draw: () => draw(), get anim() { return anim; }, get idleMs() { return performance.now() - lastInput; }, STANDBY_MS };
