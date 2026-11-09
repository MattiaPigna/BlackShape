# Prepara le viste di ogni taglio direttamente dal foglio AI (niente 3D: capelli con la qualita' originale).
#   foglio:  da-sistemare/bb-foglio6-<id>.png, griglia 3x2 con 6 viste dallo stesso lato:
#            fronte, 3/4, profilo, profilo da dietro, 3/4 dietro, nuca (vedi tagli/PROMPT-IMMAGINI.md)
#   uscita:  tagli/<id>/viste/v0.webp ... v9.webp
#            v0-v5 = i 6 pannelli (lato sinistro della testa), v6-v9 = pannelli 4..1 specchiati (lato destro)
#            se c'e' anche da-sistemare/bb-foglio6d-<id>.png (stessa griglia, testa vista da destra) v6-v9
#            vengono da li' invece che dallo specchio: serve ai tagli con la riga da un lato
# Gli angoli di ogni vista sono in galleria.js (ANGLES). Lo specchio inverte la riga dei capelli: per i tagli
# con la riga da un lato le viste dell'altro lato la mostrano dalla parte opposta.
#          t.webp = miniatura per l elenco dei tagli
# Versione con i vestiti (smoking): se c'e' da-sistemare/bb-busto6-<id>.png (stesso foglio con lo smoking,
# ottenuto modificando il foglio originale con ChatGPT) si usa quello, e bb-busto6d-<id>.png per il lato destro.
# I pannelli col busto arrivano fino ai bordi: si ritagliano cosi' come sono, senza riportare la testa a misura.
# Uso: python tools/prepara-viste.py [lato=512] [id ...]     (senza id: tutti i fogli trovati)
import glob, os, re, sys
import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 512   # risoluzione piena dei pannelli del foglio
ONLY = set(sys.argv[2:])
COLS, ROWS = 3, 2
# l'AI non disegna la testa sempre della stessa grandezza: ogni vista viene riportata alla stessa altezza
# (cima dei capelli -> base del collo) e posizione, con il collo al centro (asse su cui gira la testa)
HEAD_H = 0.86     # altezza della testa rispetto al riquadro
BOTTOM = 0.95     # dove sta la base del collo (frazione dall'alto)

def head_box(im):
    """riquadro della testa (capelli+viso+collo) staccata dallo sfondo, e centro del collo"""
    a = np.asarray(im, dtype=np.float32)
    bg = np.median(np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3),
                                   a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)]), axis=0)
    m = np.abs(a - bg).max(axis=2) > 28
    # toglie i puntini isolati: tiene solo righe/colonne con abbastanza pixel
    rows = np.where(m.sum(1) > 6)[0]
    cols = np.where(m.sum(0) > 6)[0]
    top, bot = rows[0], rows[-1]
    # collo: le righe chiare (argilla) appena sopra la base
    neck = m[int(bot - (bot - top) * 0.10):bot + 1]
    xs = np.where(neck.any(0))[0]
    neck_x = (xs[0] + xs[-1]) / 2 if len(xs) else (cols[0] + cols[-1]) / 2
    return top, bot, neck_x, tuple(int(v) for v in bg)

def normalize(im):
    top, bot, neck_x, bg = head_box(im)
    s = HEAD_H * SIZE / (bot - top)
    w = round(im.width * s)
    big = im.resize((w, w), Image.LANCZOS)
    out = Image.new('RGB', (SIZE, SIZE), bg)
    out.paste(big, (round(SIZE / 2 - neck_x * s), round(BOTTOM * SIZE - bot * s)))
    return out

def read_panels(path, norm=True):
    sheet = Image.open(path).convert('RGB')
    pw, ph = sheet.width / COLS, sheet.height / ROWS
    side = min(pw, ph)
    panels = []
    for n in range(COLS * ROWS):
        c, r = n % COLS, n // COLS
        cx, cy = (c + 0.5) * pw, (r + 0.5) * ph
        box = tuple(round(v) for v in (cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2))
        crop = sheet.crop(box)
        panels.append(normalize(crop) if norm else crop.resize((SIZE, SIZE), Image.LANCZOS))
    return panels

for path in sorted(glob.glob(os.path.join(ROOT, 'da-sistemare', 'bb-foglio6-*.png'))):
    cut = re.match(r'bb-foglio6-(.+)\.png$', os.path.basename(path)).group(1)
    if ONLY and cut not in ONLY:
        continue
    if not os.path.isdir(os.path.join(ROOT, 'tagli', cut)):
        print(f'{cut}: cartella tagli/{cut} mancante, salto')
        continue
    busto = path.replace('bb-foglio6-', 'bb-busto6-')
    norm = not os.path.exists(busto)
    if not norm:
        path = busto
    panels = read_panels(path, norm)
    right = path.replace('bb-foglio6-', 'bb-foglio6d-').replace('bb-busto6-', 'bb-busto6d-')
    if os.path.exists(right):
        # lato destro vero (stessa griglia ma testa vista da destra): niente specchio, la riga resta al suo posto
        rp = read_panels(right, norm)
        views = panels + [rp[k] for k in (4, 3, 2, 1)]
    else:
        views = panels + [ImageOps.mirror(panels[k]) for k in (4, 3, 2, 1)]
    out = os.path.join(ROOT, 'tagli', cut, 'viste')
    os.makedirs(out, exist_ok=True)
    for i, im in enumerate(views):
        im.save(os.path.join(out, f'v{i}.webp'), 'WEBP', quality=90, method=6)
    # miniatura per l'elenco dei tagli: la vista di fronte, ritagliata sulla testa
    t = views[0].crop((round(SIZE * .14), 0, round(SIZE * .86), round(SIZE * .72))).resize((200, 200), Image.LANCZOS)
    t.save(os.path.join(out, 't.webp'), 'WEBP', quality=85, method=6)
    print(f'{cut}: {len(views)} viste' + ('' if norm else ' (smoking)') + (' (lato destro dal foglio 6d)' if os.path.exists(right) else ''))
