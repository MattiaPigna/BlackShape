# Prepara il "giro" 360 di un taglio (64 fotogrammi) da UN foglio generato dall'AI.
#   foglio:  un'unica immagine con il modello calvo + capelli da piu' angoli (es. 3x2),
#            generata in UNA sola volta, cosi' i capelli sono identici in tutte le viste.
#            Si crea partendo da modelli/viste/foglio-6viste.png (vedi tagli/PROMPT-IMMAGINI.md).
#   render:  modelli/viste/rXX.png + pos_XX.bin (il modello vero, da render-viste.html?giro e render-mappe.html)
#   uscita:  tagli/<id>/giro/h00.webp ... h63.webp (64 angoli calcolati dal modello, nessuna dissolvenza)
# Faccia/orecchie/collo vengono dal render vero; dal foglio si prendono solo capelli e sfumatura,
# proiettati sulla geometria 3D del modello. Il lato destro e' lo specchio del sinistro.
# Uso: python tools/prepara-giro.py <id-taglio> <foglio.png> [angoli=0,6,12,20,26,32] [griglia=3x2]
#      (angoli in passi da 5.625 gradi: 0=fronte, 16=profilo, 32=nuca)
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
cut, sheet_path = sys.argv[1], sys.argv[2]
SRC_K = [int(x) for x in (sys.argv[3] if len(sys.argv) > 3 else '0,6,12,20,26,32').split(',')]
COLS, ROWS = [int(x) for x in (sys.argv[4] if len(sys.argv) > 4 else '3x2').split('x')]
REF = os.path.join(ROOT, 'modelli', 'viste')
OUT = os.path.join(ROOT, 'tagli', cut, 'giro')
os.makedirs(OUT, exist_ok=True)
S = 1024
BG = (43, 43, 45)

def mask(im, n=256):
    a = np.asarray(im.convert('L').resize((n, n), Image.BILINEAR), dtype=np.float32)
    return a > 110   # argilla chiara contro fondo scuro

def align(ai, ref):
    """scala e spostamento che sovrappongono la parte bassa (collo/mascella/orecchie)"""
    n = 256
    mr = mask(ref, n)
    rows = slice(int(n * 0.45), n)
    best = (-1, 1.0, 0, 0)
    for s in np.arange(0.86, 1.241, 0.01):
        w = int(round(n * s))
        ma = mask(ai, w)
        for dx in range(-22, 23, 2):
            for dy in range(-22, 23, 2):
                canvas = np.zeros((n, n), bool)
                ox, oy = (n - w) // 2 + dx, (n - w) // 2 + dy
                x0, y0 = max(0, ox), max(0, oy)
                x1, y1 = min(n, ox + w), min(n, oy + w)
                if x1 <= x0 or y1 <= y0: continue
                canvas[y0:y1, x0:x1] = ma[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
                a, b = canvas[rows], mr[rows]
                iou = (a & b).sum() / max(1, (a | b).sum())
                if iou > best[0]: best = (iou, s, dx, dy)
    return best

def place(ai, s, dx, dy):
    w = int(round(S * s))
    big = ai.resize((w, w), Image.LANCZOS)
    out = Image.new('RGB', (S, S), BG)
    k = S / 256
    out.paste(big, ((S - w) // 2 + int(dx * k), (S - w) // 2 + int(dy * k)))
    return out

sheet = Image.open(sheet_path).convert('RGB')
pw, ph = sheet.width / COLS, sheet.height / ROWS
def gray_lower(im, n=128):
    g = np.asarray(im.convert('L').resize((n, n), Image.BILINEAR), dtype=np.float32)[int(n * 0.35):]
    return (g - g.mean()) / (g.std() + 1e-6)

# l'AI non sempre disegna l'angolo richiesto: per ogni pannello si cerca l'angolo vero
# confrontandolo con i render del modello (forma e chiaroscuro di faccia, orecchie e collo)
frames = {}
NOMINAL = SRC_K
SRC_K = []
for n, k0 in enumerate(NOMINAL):
    c, r = n % COLS, n // COLS
    ai = sheet.crop((round(c * pw), round(r * ph), round((c + 1) * pw), round((r + 1) * ph))).resize((S, S), Image.LANCZOS)
    best = None
    for k in range(max(0, k0 - 6), min(32, k0 + 6) + 1):
        ref = Image.open(os.path.join(REF, f'r{k:02d}.png')).convert('RGB')
        iou, s, dx, dy = align(ai, ref)
        ncc = float((gray_lower(place(ai, s, dx, dy)) * gray_lower(ref)).mean())
        score = ncc + iou
        if best is None or score > best[0]: best = (score, k, s, dx, dy)
    _, k, s, dx, dy = best
    if k0 in (0, 32):           # fronte e nuca sono simmetriche: l'angolo stimato non e' affidabile, si tiene quello chiesto
        ref = Image.open(os.path.join(REF, f'r{k0:02d}.png')).convert('RGB')
        _, s, dx, dy = align(ai, ref); k = k0
    while k in SRC_K: k += 1                     # due pannelli sullo stesso angolo: spostane uno
    print(f'pannello {n + 1}: chiesto {k0 * 5.625:6.2f} gradi, disegnato ~{k * 5.625:6.2f}  (scala {s:.2f} sposta {dx:+d},{dy:+d})')
    frames[k] = place(ai, s, dx, dy)
    SRC_K.append(k)
if 0 not in SRC_K or 32 not in SRC_K:
    print('ATTENZIONE: mancano la vista frontale o la nuca nel foglio')
# ---- immagini intermedie: 16 -> 64 fotogrammi (uno ogni 5.625 gradi)
# Usa la geometria vera del busto (modelli/viste/pos_XX.bin, da tools/render-mappe.html):
# per ogni pixel dell'angolo intermedio si sa quale punto 3D della testa e', e dove quel punto
# si trova nelle due foto vicine. Fuori dalla testa (capelli, fondo) si segue il punto piu' vicino.
import json, cv2
OS = 768           # risoluzione finale (leggera per il Raspberry)
CAM = json.load(open(os.path.join(REF, 'camere.json')))
NM = CAM['N']
VP = [np.array(c['vp'], np.float64).reshape(4, 4).T for c in CAM['cams']]   # three.js: colonne

def pos_map(k):
    a = np.fromfile(os.path.join(REF, f'pos_{k:02d}.bin'), np.float32).reshape(NM, NM, 4)[::-1]
    return a[..., :3].astype(np.float64), a[..., 3] > 0.5

def project(P, k):
    h = np.concatenate([P, np.ones(P.shape[:-1] + (1,))], -1) @ VP[k].T
    x = (h[..., 0] / h[..., 3] + 1) / 2 * NM - 0.5
    y = (1 - h[..., 1] / h[..., 3]) / 2 * NM - 0.5
    return x, y

NK = len(VP)                       # 64 angoli del giro
POS = [pos_map(k) for k in range(NK)]
yy, xx = np.mgrid[0:NM, 0:NM].astype(np.float64)

def nearest_head(k):
    """per ogni pixel: punto della testa piu' vicino (dentro la testa e' il pixel stesso)"""
    P, m = POS[k]
    _, lab = cv2.distanceTransformWithLabels((~m).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    zy, zx = np.nonzero(m)                     # le etichette seguono l'ordine di scansione
    ny, nx = zy[lab - 1], zx[lab - 1]
    # normale della superficie (dalle differenze tra pixel vicini della mappa delle posizioni)
    dx = np.zeros_like(P); dy = np.zeros_like(P)
    dx[:, 1:-1] = P[:, 2:] - P[:, :-2]; dy[1:-1] = P[2:] - P[:-2]
    Nrm = np.cross(dy, dx)
    Nrm /= np.linalg.norm(Nrm, axis=-1, keepdims=True) + 1e-9
    Nrm = cv2.GaussianBlur(Nrm.astype(np.float32), (0, 0), 2)
    return P[ny, nx], nx, ny, m, Nrm[ny, nx]

SIGMA = 9.0    # gradi: quanto e' stretta la cucitura tra due pannelli (fissa sulla testa, non nel tempo)
def lookup(k):
    """Per l'angolo k: per ogni pannello sorgente, dove leggere il colore e con che peso.
    Ogni punto della testa prende il colore SEMPRE dallo stesso pannello (quello che lo guarda piu'
    di fronte), quindi i capelli sono una texture fissa che gira con la testa: niente dissolvenze.
    Il lato sinistro della testa usa il punto simmetrico del lato destro (taglio simmetrico)."""
    Pn, nx, ny, m, Nn = nearest_head(k)
    mir = Pn[..., 0] < 0
    Pm = Pn.copy(); Pm[..., 0] = np.abs(Pm[..., 0])
    az = np.degrees(np.arctan2(Pm[..., 0], Pm[..., 2]))       # 0 = davanti, 90 = lato, 180 = dietro
    # fuori dalla sagoma della testa (ciocche che sporgono) si usa il pannello piu' vicino al punto di vista
    view = k * 360 / NK
    view = view if view <= 180 else 360 - view
    # in cima alla testa (superficie rivolta in alto) l'angolo del punto non dice nulla: si usa il punto di vista
    horiz = np.clip((np.hypot(Nn[..., 0], Nn[..., 2]) - 0.35) / 0.4, 0, 1)
    az = np.where(m, horiz * az + (1 - horiz) * view, view)
    offx = np.where(mir, -(xx - nx), xx - nx); offy = yy - ny
    res, logw = [], []
    for s_ in SRC_K:
        sx, sy = project(Pm, s_)
        sx = sx + offx; sy = sy + offy
        PS, mS = POS[s_]
        ix = np.clip(np.round(sx).astype(int), 0, NM - 1); iy = np.clip(np.round(sy).astype(int), 0, NM - 1)
        d = np.linalg.norm(PS[iy, ix] - Pm, axis=-1)
        vis = np.where(m, mS[iy, ix] & (d < 0.04), ~mS[iy, ix])
        lw = -((az - s_ * 5.625) / SIGMA) ** 2 + np.where(vis, 0.0, -60.0)
        res.append((sx, sy)); logw.append(lw)
    logw = np.stack(logw); logw -= logw.max(0)
    w = np.exp(logw); w /= w.sum(0)
    far = np.clip((np.hypot(xx - nx, yy - ny) - 14) / 8, 0, 1)   # niente capelli lontano dalla testa
    return res, w, far

def up(v):   # mappa da NM a OS pixel
    return cv2.resize(((v + 0.5) * OS / NM - 0.5).astype(np.float32), (OS, OS), interpolation=cv2.INTER_LINEAR)

key = {k: cv2.cvtColor(np.asarray(frames[k].resize((OS, OS), Image.LANCZOS)), cv2.COLOR_RGB2BGR) for k in SRC_K}
# ---- composizione finale: argilla (faccia, orecchie, collo) dal render VERO del modello,
# capelli e sfumatura dall'immagine AI. Cosi' la faccia e' identica in ogni angolo.
BGc = key[SRC_K[0]][4, 4].astype(np.float32)
def hair_alpha(ai, rd, inside):
    ai = ai.astype(np.float32); rd = rd.astype(np.float32)
    lum_ai, lum_rd = ai.mean(-1), rd.mean(-1)
    warm = ai[..., 2] - ai[..., 0]                     # capelli castani: rosso > blu
    near_bg = np.abs(ai - BGc).max(-1)
    # dentro la testa del render: capelli = l'AI e' piu' scura o calda dell'argilla
    a_in = np.clip((lum_rd - lum_ai - 10) / 35, 0, 1)
    a_in = np.maximum(a_in, np.clip((warm - 6) / 10, 0, 1))
    bglike = (near_bg < 12) | ((lum_ai < 62) & (np.abs(warm) < 6))
    a_in = np.where(bglike, 0, a_in)                    # l'AI mostra fondo dove c'e' testa: tieni il render
    # fuori dalla testa del render: capelli = tutto cio' che non e' fondo e non e' argilla
    clay = (lum_ai > 95) & (ai.max(-1) - ai.min(-1) < 18)
    a_out = np.where(clay, 0, np.clip((near_bg - 10) / 25, 0, 1))
    al = np.where(inside, a_in, a_out).astype(np.float32)
    # chiude i buchi tra le ciocche (riflessi chiari) senza allargare troppo i bordi
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    closed = cv2.morphologyEx(al, cv2.MORPH_CLOSE, ker)
    al = np.maximum(al, closed)
    # l'AI e' un po' piu' stretta del modello: i buchi di fondo vicino ai capelli si riempiono di capelli
    hair = (al > 0.5).astype(np.uint8)
    near_hair = cv2.dilate(hair, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))) > 0
    fix = inside & bglike & near_hair & (hair == 0)
    return cv2.GaussianBlur(al, (0, 0), 1.2)[..., None], fix


def render_of(k):
    return cv2.resize(cv2.imread(os.path.join(REF, f'r{k:02d}.png')), (OS, OS), interpolation=cv2.INTER_AREA)

def face_zone(k):
    """zone del modello dove i capelli non vanno mai: faccia, fronte sotto l'attaccatura, orecchie"""
    P, m = POS[k]
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    face = m & (((z > 0.22) & (y < 0.30)) | ((z > 0.22) & (np.abs(x) < 0.3) & (y < 0.42)) | ((z > 0.0) & (y < 0.02)) | (np.abs(x) > 0.6))
    return cv2.GaussianBlur(cv2.resize(face.astype(np.float32), (OS, OS)), (0, 0), 8)

# 1) sulle viste del foglio (dove AI e modello coincidono) si decide cosa sono capelli
KA = {}   # alpha capelli per vista
for k in SRC_K:
    rd = render_of(k)
    inside = cv2.resize(POS[k][1].astype(np.float32), (OS, OS)) > 0.5
    al, fix = hair_alpha(key[k], rd, inside)
    fz = face_zone(k)
    fix = fix & (fz < 0.5)
    if fix.any():
        key[k] = cv2.inpaint(key[k], fix.astype(np.uint8), 6, cv2.INPAINT_TELEA)
        al = np.maximum(al, cv2.GaussianBlur(fix.astype(np.float32), (0, 0), 1.2)[..., None])
    KA[k] = (al[..., 0] * (1 - fz)).astype(np.float32)

# con BB_PANNELLI=file.npz si salvano solo i pannelli allineati e i loro capelli (per tools/guscio-capelli.py)
if os.environ.get('BB_PANNELLI'):
    np.savez_compressed(os.environ['BB_PANNELLI'], src=np.array(SRC_K),
                        **{f'key{k}': key[k] for k in SRC_K}, **{f'ka{k}': KA[k].astype(np.float16) for k in SRC_K})
    print('pannelli salvati:', SRC_K); sys.exit(0)

# 2) ogni angolo del giro: capelli letti dai pannelli secondo la posizione 3D, sopra il render vero
for f in os.listdir(OUT):
    if f.endswith('.webp'): os.remove(os.path.join(OUT, f))
for k in range(NK):
    rd = render_of(k).astype(np.float32)
    res, w, far = lookup(k)
    col = np.zeros((OS, OS, 3), np.float32); al = np.zeros((OS, OS, 1), np.float32)
    for (sx, sy), ws, s_ in zip(res, w, SRC_K):
        if ws.max() < 1e-3: continue
        mx, my = up(sx), up(sy)
        wv = cv2.resize(ws.astype(np.float32), (OS, OS))[..., None]
        col += wv * cv2.remap(key[s_], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
        al += wv * cv2.remap(KA[s_], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)[..., None]
    al = al * (1 - face_zone(k)[..., None]) * (1 - cv2.resize(far.astype(np.float32), (OS, OS))[..., None])
    out = np.clip(rd * (1 - al) + col * al, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(OUT, f'h{k:02d}.webp'), out, [cv2.IMWRITE_WEBP_QUALITY, 80])
print(cut, 'ok:', NK, 'fotogrammi')
