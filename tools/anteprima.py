# Foglio di controllo: 12 angoli del giro di un taglio. Uso: python tools/anteprima.py <id> <uscita.jpg>
import sys, os, cv2, numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
cut, dst = sys.argv[1], sys.argv[2]
n = len(os.listdir(os.path.join(ROOT, 'tagli', cut, 'giro')))
ks = [round(i * n / 12) for i in range(12)]
im = [cv2.resize(cv2.imread(os.path.join(ROOT, 'tagli', cut, 'giro', f'h{k:03d}.webp')), (300, 300)) for k in ks]
cv2.imwrite(dst, np.vstack([np.hstack(im[i:i + 6]) for i in (0, 6)]))
