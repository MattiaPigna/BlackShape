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
#          <colore>/v0.webp ... v9.webp = stesse viste coi capelli ricolorati (castano, biondo, grigio):
#          il colore si cambia qui, sul pannello pulito, prima della compressione WebP
# Uso: python tools/prepara-viste.py [lato=512] [id ...]     (senza id: tutti i fogli trovati)
import glob, os, re, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

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

# ---------- colore dei capelli ----------
# colore di arrivo: (radice scura, punta chiara) in RGB, guadagno di luminosita', saturazione
COLORI = {
    'castano': ((52, 38, 28), (165, 128, 95), 1.6, 0.9),
    'biondo':  ((95, 72, 45), (228, 200, 150), 2.2, 0.85),
    'grigio':  ((60, 60, 63), (212, 212, 216), 2.0, 1.0),
}

def hair_mask(a):
    """quanto ogni pixel e' capello: i capelli sono marroni (rosso > blu), testa d'argilla e sfondo sono grigi"""
    warm = a[..., 0] - a[..., 2]
    lum = a.mean(axis=2)
    m = np.clip((warm - 4) / 10, 0, 1) * np.clip((150 - lum) / 40, 0, 1)
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    return np.asarray(im, dtype=np.float32) / 255

def recolor(a, mask, colore):
    lo, hi, gain, sat = colore
    t = np.clip(a.mean(axis=2) / 255.0 * gain, 0, 1)[..., None]   # luminosita' originale -> punto della sfumatura
    col = np.array(lo, np.float32) * (1 - t) + np.array(hi, np.float32) * t
    if sat != 1:
        g = col.mean(axis=2, keepdims=True)
        col = g + (col - g) * sat
    # nelle sfumature (pelo rado sulla pelle) un colore chiaro pieno fa alone: li' la maschera si attenua
    m = (mask ** (1 + max(0, (sum(hi) / 3 - 170) / 60)))[..., None]
    return Image.fromarray(np.clip(a * (1 - m) + col * m, 0, 255).astype(np.uint8))

def colori(im):
    a = np.asarray(im, dtype=np.float32)
    m = hair_mask(a)
    return {k: recolor(a, m, c) for k, c in COLORI.items()}

def read_panels(path):
    sheet = Image.open(path).convert('RGB')
    pw, ph = sheet.width / COLS, sheet.height / ROWS
    side = min(pw, ph)
    panels = []
    for n in range(COLS * ROWS):
        c, r = n % COLS, n // COLS
        cx, cy = (c + 0.5) * pw, (r + 0.5) * ph
        box = tuple(round(v) for v in (cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2))
        panels.append(normalize(sheet.crop(box)))
    return panels

def main():
    for path in sorted(glob.glob(os.path.join(ROOT, 'da-sistemare', 'bb-foglio6-*.png'))):
        cut = re.match(r'bb-foglio6-(.+)\.png$', os.path.basename(path)).group(1)
        if ONLY and cut not in ONLY:
            continue
        if not os.path.isdir(os.path.join(ROOT, 'tagli', cut)):
            print(f'{cut}: cartella tagli/{cut} mancante, salto')
            continue
        panels = read_panels(path)
        right = path.replace('bb-foglio6-', 'bb-foglio6d-')
        if os.path.exists(right):
            # lato destro vero (stessa griglia ma testa vista da destra): niente specchio, la riga resta al suo posto
            rp = read_panels(right)
            views = panels + [rp[k] for k in (4, 3, 2, 1)]
        else:
            views = panels + [ImageOps.mirror(panels[k]) for k in (4, 3, 2, 1)]
        out = os.path.join(ROOT, 'tagli', cut, 'viste')
        os.makedirs(out, exist_ok=True)
        for i, im in enumerate(views):
            im.save(os.path.join(out, f'v{i}.webp'), 'WEBP', quality=90, method=6)
            for k, ci in colori(im).items():
                os.makedirs(os.path.join(out, k), exist_ok=True)
                ci.save(os.path.join(out, k, f'v{i}.webp'), 'WEBP', quality=90, method=6)
        # miniatura per l'elenco dei tagli: la vista di fronte, ritagliata sulla testa
        t = views[0].crop((round(SIZE * .14), 0, round(SIZE * .86), round(SIZE * .72))).resize((200, 200), Image.LANCZOS)
        t.save(os.path.join(out, 't.webp'), 'WEBP', quality=85, method=6)
        print(f'{cut}: {len(views)} viste' + (' (lato destro dal foglio 6d)' if os.path.exists(right) else ''))

if __name__ == '__main__':
    main()
