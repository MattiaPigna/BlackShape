# Pelle realistica sul busto calvo: da UN foglio AI (la testa resa come persona vera, 6 viste come
# modelli/viste/foglio-6viste.png) si ricava per ogni vertice il "colore della pelle" rispetto all'argilla grigia.
# Si salva il rapporto foto/argilla (in luce lineare): cosi' nel render la luce resta quella vera del 3D
# (si muove con la testa) e la pelle aggiunge solo colore, pori, sopracciglia e baffi.
# Uscita: modelli/guscio/pelle.npy (un RGB per vertice del GLB originale, ordine dei vertici del file)
#         modelli/guscio/pelle-media.txt (tono medio della pelle sui lati della testa, BGR, per la sfumatura)
# Uso: BB_PANNELLI=modelli/guscio/pannelli-pelle.npz python tools/prepara-giro.py pelle da-sistemare/bb-pelle.png
#      python tools/pelle.py
import os, json
import numpy as np, cv2, trimesh
import scipy.sparse as sp
from scipy.spatial import cKDTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REF = os.path.join(ROOT, 'modelli', 'viste')
GD = os.path.join(ROOT, 'modelli', 'guscio')
GLB = os.path.join(ROOT, 'modelli', 'Meshy_AI_Stern_Bald_Head_Study_1105104142_generate.glb')
D = np.load(os.path.join(GD, 'pannelli-pelle.npz'))
SRC = [int(k) for k in D['src']]
KEY = {k: D[f'key{k}'].astype(np.float32) for k in SRC}
OS = KEY[SRC[0]].shape[0]
CAM = json.load(open(os.path.join(REF, 'camere.json')))
NM = CAM['N']
VP = [np.array(c['vp'], np.float64).reshape(4, 4).T for c in CAM['cams']]
center = np.array(CAM['center'])

def lin(x):
    x = np.clip(x, 0, 255) / 255.0
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)

REND = {k: cv2.resize(cv2.imread(os.path.join(REF, f'r{k:02d}.png')), (OS, OS), interpolation=cv2.INTER_AREA).astype(np.float32) for k in SRC}

mesh = trimesh.load(GLB).to_geometry()
raw = trimesh.load(GLB, process=False).to_geometry()
V = mesh.vertices.astype(np.float64); nv = len(V)
R = (mesh.bounds[1] - mesh.bounds[0]).max()
DIST = R * 0.5 / np.tan(np.radians(11)) * 1.15
e = mesh.edges_unique
A = sp.coo_matrix((np.ones(2 * len(e)), (np.r_[e[:, 0], e[:, 1]], np.r_[e[:, 1], e[:, 0]])), shape=(nv, nv)).tocsr()
A = sp.diags(1 / np.maximum(1, np.asarray(A.sum(1)).ravel())) @ A
def smooth(x, it):
    for _ in range(it): x = 0.5 * x + 0.5 * (A @ x)
    return x
N = mesh.vertex_normals.astype(np.float64)

def project(P, k):
    h = np.c_[P, np.ones(len(P))] @ VP[k].T
    x = (h[:, 0] / h[:, 3] + 1) / 2 * NM - 0.5
    y = (1 - h[:, 1] / h[:, 3]) / 2 * NM - 0.5
    return (x + 0.5) * OS / NM - 0.5, (y + 0.5) * OS / NM - 0.5

def campos(k):
    a = np.radians(k * 360 / len(VP))
    d = np.array([np.sin(a), 0.08, np.cos(a)]); d /= np.linalg.norm(d)
    return center + d * DIST

def sample(img, x, y):
    n = len(x); W = 1024; pad = (-n) % W
    mx = np.r_[x, np.zeros(pad)].astype(np.float32).reshape(-1, W)
    my = np.r_[y, np.zeros(pad)].astype(np.float32).reshape(-1, W)
    r = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return r.reshape(-1, *img.shape[2:])[:n]

def pos_map(k):
    a = np.fromfile(os.path.join(REF, f'pos_{k:02d}.bin'), np.float32).reshape(NM, NM, 4)[::-1]
    return cv2.resize(a, (OS, OS), interpolation=cv2.INTER_NEAREST)
POS = {k: pos_map(k) for k in SRC}

# il lato destro della testa e' lo specchio del sinistro (i pannelli vanno da 0 a 180 gradi)
Vm = V.copy(); Vm[:, 0] = np.abs(Vm[:, 0])
Nm = N.copy(); Nm[:, 0] = np.where(V[:, 0] < 0, -N[:, 0], N[:, 0])
acc = np.zeros((nv, 3)); wsum = np.zeros(nv)
for k in SRC:
    x, y = project(Vm, k)
    pm = POS[k]
    ix = np.clip(np.round(x).astype(int), 0, OS - 1); iy = np.clip(np.round(y).astype(int), 0, OS - 1)
    vis = (pm[iy, ix, 3] > 0.5) & (np.linalg.norm(pm[iy, ix, :3] - Vm, axis=1) < 0.03)
    v = campos(k) - Vm; v /= np.linalg.norm(v, axis=1, keepdims=True)
    w = np.clip((Nm * v).sum(1), 0, 1) ** 4 * vis
    foto = lin(sample(KEY[k], x, y)); arg = lin(sample(REND[k], x, y))
    rap = np.clip(foto / np.maximum(arg, 0.02), 0.1, 3.0)
    acc += w[:, None] * rap; wsum += w
ok = wsum > 1e-4
rap = np.where(ok[:, None], acc / np.maximum(wsum, 1e-9)[:, None], np.nan)
# dove nessuna vista vede il punto (sotto il mento, dentro l'orecchio) si usa la media dei vicini
media = np.nanmedian(rap[ok], axis=0)
rap[~ok] = media
for _ in range(30):
    sm = A @ rap
    rap[~ok] = sm[~ok]
rap = smooth(rap, 1)
# nelle pieghe profonde (rughe scolpite) la foto e' piu' chiara dell'argilla in ombra: si limitano gli
# scostamenti rispetto alla media locale, cosi' non compaiono righe chiare
loc = smooth(rap.copy(), 25)
rap = np.clip(rap, 0.55 * loc, 1.3 * loc)
# riporta ai vertici del GLB originale (stesso ordine che usa tools/guscio-capelli.py)
near = cKDTree(V).query(raw.vertices)[1]
np.save(os.path.join(GD, 'pelle.npy'), rap[near].astype(np.float32))   # BGR
lati = ok & (np.abs(V[:, 0]) > 0.45) & (V[:, 1] > 0.1) & (V[:, 1] < 0.6)
m = np.median(rap[lati], axis=0)
open(os.path.join(GD, 'pelle-media.txt'), 'w').write(','.join(f'{v:.4f}' for v in m))
print('pelle: vertici visti', ok.sum(), 'su', nv, ' rapporto medio BGR', m.round(3))
