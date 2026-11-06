# Unisce i render di tools/render-guscio.html nei fotogrammi finali del giro:
#   fotogramma = pelle (argilla illuminata colorata) * (1 - alpha capelli) + capelli
# La pelle: il render e' argilla grigia con luce bianca, quindi basta moltiplicare (in luce lineare) per il
# rapporto colore-pelle / grigio-argilla. Nella sfumatura le parti grigie dei pannelli AI diventano pelle,
# i capelli (castani, "caldi") restano come sono.
# Uscita: tagli/<id>/giro/h000.webp ... (768 px). Uso: python tools/componi-giro.py <id> [pelle B,G,R]
import os, sys
import numpy as np, cv2

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
cut = sys.argv[1]
PELLE = [float(v) for v in (sys.argv[2] if len(sys.argv) > 2 else '128,152,196').split(',')]   # BGR
SRC = os.path.join(ROOT, 'modelli', 'viste', f'g-{cut}')
OUT = os.path.join(ROOT, 'tagli', cut, 'giro')
os.makedirs(OUT, exist_ok=True)
OS = 768

def lin(x):
    x = x / 255.0
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)

def srgb(x):
    x = np.clip(x, 0, None)
    return np.clip(np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055), 0, 1) * 255

RAP = (lin(np.array(PELLE)) / lin(np.array([165., 163., 163.]))).astype(np.float32)   # pelle / argilla (BGR)
# con la pelle realistica (tools/pelle.py) l'argilla e' gia' colorata nel render: si usa il tono medio
# della pelle solo per la sfumatura dei pannelli dei capelli
MEDIA = os.path.join(ROOT, 'modelli', 'guscio', 'pelle-media.txt')
PELLE_VERA = os.path.exists(MEDIA)
if PELLE_VERA: RAP = np.array([float(v) for v in open(MEDIA).read().split(',')], np.float32)
BG = np.array([45, 43, 43], np.float32)

NF = len([f for f in os.listdir(SRC) if f.startswith('a')])
for f in os.listdir(OUT):
    if f.endswith('.webp'): os.remove(os.path.join(OUT, f))
for k in range(NF):
    rd = lambda p: cv2.imread(os.path.join(SRC, f'{p}{k:03d}.png')).astype(np.float32)
    c, h, a = rd('c'), rd('h'), rd('a')[..., :1] / 255
    fondo = (np.abs(c - BG).max(-1) < 4)[..., None]
    pelle = c if PELLE_VERA else np.where(fondo, c, srgb(lin(c) * RAP))
    hc = h / np.maximum(a, 1e-3)                                   # colore capelli non premoltiplicato
    caldo = hc[..., 2:3] - hc[..., 0:1]                              # castano: rosso > blu; grigio: ~0
    w = np.clip(1 - (caldo - 4) / 14, 0, 1)                          # quanto e' "pelle grigia" della sfumatura
    if PELLE_VERA:   # la parte grigia dei pannelli (pelle della sfumatura) prende il colore della pelle VERA sotto
        sc = lin(np.clip(hc, 0, 255)).mean(-1, keepdims=True) / 0.37          # chiaro/scuro rispetto all'argilla
        hc = hc * (1 - w) + srgb(lin(c) * sc) * w
    else:
        hc = hc * (1 - w) + srgb(lin(np.clip(hc, 0, 255)) * RAP) * w
    out = np.clip(pelle * (1 - a) + hc * a, 0, 255)
    out = cv2.resize(out, (OS, OS), interpolation=cv2.INTER_AREA).astype(np.uint8)
    cv2.imwrite(os.path.join(OUT, f'h{k:03d}.webp'), out, [cv2.IMWRITE_WEBP_QUALITY, 82])
print(cut, 'ok:', NF, 'fotogrammi')
