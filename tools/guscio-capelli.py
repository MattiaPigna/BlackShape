# Costruisce i capelli in 3D VERO sopra il busto calvo, partendo dai pannelli del foglio AI.
#   1) quali punti della testa hanno capelli (dai pannelli)
#   2) quanto sono alti i capelli in ogni punto ("guscio"): il punto si alza lungo la normale finche'
#      resta dentro la sagoma capelli+testa in TUTTE le viste (visual hull), lato destro = specchio
#   3) colore dei capelli fissato una volta sola su ogni vertice (non cambia girando)
# Uscita: modelli/guscio/<id>.glb (vertici con colore premoltiplicato + alpha capelli)
# Poi: tools/render-guscio.html?id=<id> (64 angoli) e tools/componi-giro.py <id>
# Uso: BB_PANNELLI=modelli/guscio/pannelli-<id>.npz python tools/prepara-giro.py <id> <foglio>
#      python tools/guscio-capelli.py <id>
import os, sys, json
import numpy as np, cv2, trimesh
import scipy.sparse as sp
from scipy.spatial import cKDTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
cut = sys.argv[1]
REF = os.path.join(ROOT, 'modelli', 'viste')
GD = os.path.join(ROOT, 'modelli', 'guscio')
D = np.load(os.path.join(GD, f'pannelli-{cut}.npz'))
SRC = [int(k) for k in D['src']]
KEY = {k: D[f'key{k}'] for k in SRC}                       # BGR 768
KA = {k: D[f'ka{k}'].astype(np.float32) for k in SRC}      # alpha capelli 768
OS = KEY[SRC[0]].shape[0]

CAM = json.load(open(os.path.join(REF, 'camere.json')))
NM = CAM['N']
VP = [np.array(c['vp'], np.float64).reshape(4, 4).T for c in CAM['cams']]
center = np.array(CAM['center'])

GLB = os.path.join(ROOT, 'modelli', 'Meshy_AI_Stern_Bald_Head_Study_1105104142_generate.glb')
mesh = trimesh.load(GLB).to_geometry()      # vertici fusi: serve per normali e vicini
V = mesh.vertices.astype(np.float64)
F = mesh.faces
nv = len(V)
R = (mesh.bounds[1] - mesh.bounds[0]).max()
DIST = R * 0.5 / np.tan(np.radians(11)) * 1.15

# matrice di media tra vertici vicini (per lisciare sulla superficie)
e = mesh.edges_unique
A = sp.coo_matrix((np.ones(2 * len(e)), (np.r_[e[:, 0], e[:, 1]], np.r_[e[:, 1], e[:, 0]])), shape=(nv, nv)).tocsr()
A = sp.diags(1 / np.maximum(1, np.asarray(A.sum(1)).ravel())) @ A
def smooth(x, it):
    for _ in range(it): x = 0.5 * x + 0.5 * (A @ x)
    return x

N = mesh.vertex_normals.astype(np.float64)
Ns = smooth(N, 40); Ns /= np.linalg.norm(Ns, axis=1, keepdims=True)   # direzione di crescita dei capelli

def project(P, k):
    h = np.c_[P, np.ones(len(P))] @ VP[k].T
    x = (h[:, 0] / h[:, 3] + 1) / 2 * NM - 0.5
    y = (1 - h[:, 1] / h[:, 3]) / 2 * NM - 0.5
    return (x + 0.5) * OS / NM - 0.5, (y + 0.5) * OS / NM - 0.5     # pixel a 768

def campos(k):
    a = np.radians(k * 360 / len(VP))
    d = np.array([np.sin(a), 0.08, np.cos(a)]); d /= np.linalg.norm(d)
    return center + d * DIST

def sample(img, x, y):
    n = len(x); W = 1024; pad = (-n) % W
    mx = np.r_[x, np.zeros(pad)].astype(np.float32).reshape(-1, W)
    my = np.r_[y, np.zeros(pad)].astype(np.float32).reshape(-1, W)
    r = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    return r.reshape(-1, *img.shape[2:])[:n]

def pos_map(k):
    a = np.fromfile(os.path.join(REF, f'pos_{k:02d}.bin'), np.float32).reshape(NM, NM, 4)[::-1]
    return cv2.resize(a, (OS, OS), interpolation=cv2.INTER_NEAREST)

POS = {k: pos_map(k) for k in SRC}
mirror = lambda P: P * np.array([-1, 1, 1])
Vm = V.copy(); Vm[:, 0] = np.abs(Vm[:, 0])          # taglio simmetrico: tutto si calcola sul lato +x
Nm = Ns.copy(); Nm[:, 0] = np.where(V[:, 0] < 0, -Nm[:, 0], Nm[:, 0])

def visible(P, k):
    """il punto P si vede dalla camera k? (non coperto dalla testa calva)"""
    x, y = project(P, k)
    pm = POS[k]
    ix = np.clip(np.round(x).astype(int), 0, OS - 1); iy = np.clip(np.round(y).astype(int), 0, OS - 1)
    on = pm[iy, ix, 3] > 0.5
    c = campos(k)
    dp = np.linalg.norm(P - c, axis=1); dh = np.linalg.norm(pm[iy, ix, :3] - c, axis=1)
    return (~on) | (dp < dh + 0.025), x, y

# zone dove i capelli non vanno mai (faccia, orecchie, collo), in coordinate 3D
x_, y_, z_ = Vm[:, 0], Vm[:, 1], Vm[:, 2]
# BB_LUNGHI=1: tagli con capelli che coprono orecchie e nuca (middle part, mullet...)
LUNGHI = os.environ.get('BB_LUNGHI') == '1'
if LUNGHI:
    face = (((z_ > 0.22) & (y_ < 0.30)) | ((z_ > 0.22) & (x_ < 0.3) & (y_ < 0.42)) | ((z_ > 0.1) & (y_ < 0.02)) | (y_ < -0.55))
else:
    face = (((z_ > 0.22) & (y_ < 0.30)) | ((z_ > 0.22) & (x_ < 0.3) & (y_ < 0.42)) | ((z_ > 0.0) & (y_ < 0.02)) | (x_ > 0.6) | (y_ < -0.2))
if os.environ.get('BB_FRANGIA') == '1':   # frangia sulla fronte: i capelli possono scendere fin sopra le sopracciglia
    face &= ~((z_ > 0.22) & (y_ >= 0.27) & (x_ < 0.45))
noface = 1 - np.clip(smooth(face.astype(np.float64), 15) * 2, 0, 1)

# ---- 1) capelli si/no e colore su ogni vertice (pannelli pesati per quanto guardano di fronte)
def bake(P, Nn):
    wsum = np.zeros(len(P)); col = np.zeros((len(P), 3)); al = np.zeros(len(P))
    for k in SRC:
        vis, x, y = visible(P, k)
        c = campos(k)
        v = c - P; v /= np.linalg.norm(v, axis=1, keepdims=True)
        w = np.clip((Nn * v).sum(1), 0, 1) ** 6 * vis + 1e-9 * vis
        col += w[:, None] * sample(KEY[k].astype(np.float32), x, y)
        al += w * sample(KA[k], x, y)
        wsum += w
    ok = wsum > 0
    return col / np.maximum(wsum, 1e-12)[:, None], al / np.maximum(wsum, 1e-12), ok

_, hair0, _ = bake(Vm, Nm)
hair0 = smooth(hair0 * noface, 3)
is_hair = hair0 > 0.35
print('vertici con capelli:', is_hair.sum(), 'su', nv)

# ---- 2) altezza dei capelli: il punto si alza lungo la normale finche', in OGNI vista (e vista specchiata)
# in cui si vedrebbe (non nascosto dalla testa), cade su capelli del pannello. Se in una vista finirebbe
# davanti a pelle, orecchio o fondo, li' i capelli non ci sono: stop. (visual hull + controllo di visibilita')
SIL = {}
ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
for k in SRC:
    m = (KA[k] > 0.35).astype(np.uint8)
    # riempie i buchi della sagoma (riflessi chiari nei capelli, es. chignon) senza allargarla verso l'esterno
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    SIL[k] = cv2.dilate(m, ker).astype(np.float32)
TS = np.linspace(0, 0.40, 101)   # fino a 0.40: pompadour, chignon e ciuffi alti
t_ok = np.zeros(nv)
alive = is_hair.copy()
for t in TS[1:]:
    P = Vm + Nm * t
    bad = np.zeros(nv, int); seen = np.zeros(nv, bool)
    for k in SRC:
        for Q in (P, mirror(P)):
            vis, x, y = visible(Q, k)
            on_hair = sample(SIL[k], x, y) > 0.5
            bad += vis & ~on_hair
            seen |= vis & on_hair
    # sopra (ciuffi alti) si tollera una vista in disaccordo (i pannelli AI non sono perfetti); sui lati/sfumatura no
    inside = (bad == 0) | ((bad <= 1) & (Vm[:, 1] > 0.45))
    inside &= seen          # nascosto in tutte le viste (es. dietro l'orecchio): nessuna prova di capelli
    alive &= inside
    t_ok = np.where(alive, t, t_ok)
    if not alive.any(): break
h = np.where(is_hair, t_ok, 0.0)
# niente pieghe: si liscia l'altezza e la si raccorda a zero verso la faccia/collo
h = np.maximum(smooth(h, 25), smooth(h, 6))   # liscio ma senza schiacciare le parti alte (chignon, ciuffi)
h = np.minimum(h, smooth(np.where(is_hair, t_ok, 0.0), 6) + 0.01)
hw = np.clip(smooth(hair0, 6) * 2 - 0.3, 0, 1) * noface
# le orecchie non si gonfiano mai (nella sfumatura c'e' solo colore, niente spessore)
ear = (((np.abs(V[:, 0]) > 0.55) & (V[:, 1] < 0.33)) | ((np.abs(V[:, 0]) > 0.47) & (V[:, 1] < 0.25) & (V[:, 2] > -0.3))).astype(np.float64)
if LUNGHI:   # capelli lunghi: solo il padiglione dell'orecchio resta fuori, i capelli gli passano attorno
    ear = ((np.abs(V[:, 0]) > 0.57) & (V[:, 1] > -0.25) & (V[:, 1] < 0.3) & (V[:, 2] > -0.3) & (V[:, 2] < 0.2)).astype(np.float64)
keep = 1 - np.clip(smooth(ear, 4) * 3, 0, 1) if LUNGHI else 1 - np.clip(smooth(ear, 10) * 3, 0, 1)
# il COLORE (sfumatura) si toglie solo dal padiglione dell'orecchio, cosi' attorno non restano chiazze;
# lo SPESSORE invece resta vietato in tutta la zona dell'orecchio (keep)
# padiglione = la parte che sporge dalla testa "liscia" (calcolata una volta e salvata)
ORE = os.path.join(GD, 'orecchie.npy')
if os.path.exists(ORE) and len(np.load(ORE)) == nv:
    pinna = np.load(ORE)
else:
    Vl = V.copy()
    for _ in range(1500): Vl = 0.5 * Vl + 0.5 * (A @ Vl)
    sporge = np.linalg.norm(V - Vl, axis=1)
    pinna = ((np.abs(V[:, 0]) > 0.45) & (V[:, 1] > -0.3) & (V[:, 1] < 0.35) & (V[:, 2] > -0.35) & (V[:, 2] < 0.25) & (sporge > 0.025)).astype(np.float64)
    pinna = (smooth(pinna, 3) > 0.3).astype(np.float64)          # via i puntini isolati
    np.save(ORE, pinna)
if not LUNGHI:   # nei tagli lunghi i capelli passano sopra/attorno all'orecchio
    hw = hw * (1 - np.clip(smooth(pinna, 3) * 3, 0, 1))
h = h * keep
# sopracciglia e baffi (scolpiti sul modello): colorati come peli, non come pelle
Vsm = V.copy()
for _ in range(60): Vsm = 0.5 * Vsm + 0.5 * (A @ Vsm)
rilievo = ((V - Vsm) * N).sum(1)
ax_, ay_, az_ = np.abs(V[:, 0]), V[:, 1], V[:, 2]
Vs8 = V.copy()
for _ in range(8): Vs8 = 0.5 * Vs8 + 0.5 * (A @ Vs8)
dettaglio = smooth(np.abs(((V - Vs8) * N).sum(1)), 4)            # peli scolpiti = tanto dettaglio fine
ciglia = (az_ > 0.5) & (ay_ > 0.19) & (ay_ < 0.32) & (ax_ > 0.05) & (ax_ < 0.43) & (dettaglio > 0.00037)
ciglia = smooth(ciglia.astype(np.float64), 2) > 0.5                # toglie i puntini isolati
baffi = (az_ > 0.58) & (ay_ > -0.32) & (ay_ < -0.2) & (ax_ < 0.24) & (rilievo > 0.0004)
peli = np.clip(smooth((ciglia | baffi).astype(np.float64), 1) * 1.2, 0, 1)
# spessore solo dove i capelli sono pieni (nella sfumatura chiara solo colore, niente bozzi)
h = h * np.clip((smooth(hair0, 3) - 0.55) / 0.3, 0, 1)
h = h * hw * np.clip((smooth(np.where(is_hair, t_ok, 0.0), 6) - 0.006) / 0.02, 0, 1)
if os.environ.get('BB_DEBUG'): np.savez(os.environ['BB_DEBUG'], V=V, h=h, t=t_ok, hair=is_hair, hw=hw)
print('altezza capelli: media %.3f  max %.3f' % (h[is_hair].mean(), h.max()))
# piu' punti nella zona dei capelli = texture piu' nitida (il colore e' salvato per vertice):
# forma calcolata sulla mesh originale, poi suddivisa 2 volte solo dove ci sono capelli
from trimesh.remesh import subdivide
# la mesh in uscita e' quella ORIGINALE (vertici non fusi: orecchie e pieghe restano identiche al render),
# i valori calcolati sulla mesh fusa si riportano ai suoi vertici
raw = trimesh.load(GLB, process=False).to_geometry()
V, F = raw.vertices.astype(np.float64), raw.faces
near = cKDTree(mesh.vertices).query(V)[1]
# pelle realistica (tools/pelle.py): rapporto pelle/argilla per vertice del GLB originale
PELLE_F = os.path.join(GD, 'pelle.npy')
pelle_raw = np.load(PELLE_F) if os.path.exists(PELLE_F) else None
if pelle_raw is not None: peli = peli * 0          # sopracciglia e baffi sono gia' nella pelle
att = {'a': np.c_[h, hw, Ns, peli][near]}
if pelle_raw is not None: att['p'] = pelle_raw.astype(np.float64)
for _ in range(2):
    sel = np.nonzero(att['a'][:, 1][F].max(1) > 0.01)[0]
    V, F, att = subdivide(V, F, face_index=sel, vertex_attributes=att)
h, hw, Ns, peli = att['a'][:, 0], att['a'][:, 1], att['a'][:, 2:5], att['a'][:, 5]
pelle = att.get('p')
Ns = Ns / np.linalg.norm(Ns, axis=1, keepdims=True)
nv = len(V)
e = trimesh.Trimesh(V, F, process=False).edges_unique
A = sp.coo_matrix((np.ones(2 * len(e)), (np.r_[e[:, 0], e[:, 1]], np.r_[e[:, 1], e[:, 0]])), shape=(nv, nv)).tocsr()
A = sp.diags(1 / np.maximum(1, np.asarray(A.sum(1)).ravel())) @ A
print('vertici dopo suddivisione:', nv)
Vh = V + Ns * h[:, None]

# ---- 3) colore definitivo sul guscio (dai pannelli, con visibilita')
Vhm = Vh.copy(); Vhm[:, 0] = np.abs(Vhm[:, 0])
tmp = trimesh.Trimesh(Vh, F, process=False)
Nh = tmp.vertex_normals.copy(); Nh[:, 0] = np.where(Vh[:, 0] < 0, -Nh[:, 0], Nh[:, 0])
col, al, ok = bake(Vhm, Nh)
al = np.clip((smooth(al, 3) - 0.2) / 0.5, 0, 1) * hw
# chiude i buchi dentro la zona dei capelli (riflessi chiari nei pannelli): dilata e poi erode sulla superficie
pieno = (al > 0.5).astype(np.float64)
chiuso = (smooth((smooth(pieno, 6) > 0.15).astype(np.float64), 6) > 0.85).astype(np.float64)
al = np.maximum(al, 0.95 * chiuso * hw)
# il guscio si solleva SOLO dove ci sono capelli pieni: dove i capelli sfumano verso la pelle torna
# sulla testa (niente bozzi d'argilla visibili sotto la sfumatura); dove resta sollevato sono capelli
lift = smooth(np.clip((al - 0.55) / 0.3, 0, 1), 4)
h = h * lift
al = np.maximum(al, np.clip(h / 0.012, 0, 1))
Vh = V + Ns * h[:, None]
rgb = col[:, ::-1]                           # BGR -> RGB
pre = np.clip(rgb * al[:, None], 0, 255)     # colore premoltiplicato
colors = np.c_[pre, al * 255].round().astype(np.uint8)
# sopracciglia e baffi: segnati nei vertici senza capelli come (R=intensita', G=0, B=255, A=0);
# tools/render-guscio.html li scurisce nel materiale illuminato (restano in rilievo, con le ombre)
seg = (peli > 0.02) & (colors[:, 3] == 0)
colors[seg] = np.c_[np.round(peli[seg] * 255), np.zeros(seg.sum()), np.full(seg.sum(), 255), np.zeros(seg.sum())].astype(np.uint8)
out = trimesh.Trimesh(Vh, F, vertex_colors=colors, process=False)
if pelle is not None:   # albedo lineare della pelle (argilla 0xa3a3a5 * rapporto), RGB
    arg = np.array([0.366, 0.366, 0.373])
    out.vertex_attributes['_pelle'] = (pelle[:, ::-1] * arg).astype(np.float32)
dst = os.path.join(GD, f'{cut}.glb')
out.export(dst)
print('salvato', dst)
