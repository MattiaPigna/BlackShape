# Crea la cartella leggera da copiare sul Raspberry: solo cio' che serve alla galleria (~10 MB invece di >2 GB).
#   uscita: dist/blackblade-pi/   e   dist/blackblade-pi.zip
# Sul Raspberry: scompatta in ~/blackblade, poi  cd ~/blackblade && ./installa-kiosk.sh  (vedi README).
# Il vecchio showroom 3D (?3d) non e' incluso: serve solo per sviluppo.
# Uso: python tools/prepara-pi.py
import glob, json, os, shutil, stat, zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'dist', 'blackblade-pi')
FILES = ['index.html', 'galleria.js', 'style.css', 'README.md',
         'start.sh', 'installa-kiosk.sh', 'installa-avvio-automatico.sh',
         'tools/server.py', 'tagli/tagli.json'] + sorted(glob.glob('fonts/*', root_dir=ROOT))
SCRIPTS = {'start.sh', 'installa-kiosk.sh', 'installa-avvio-automatico.sh'}

if os.path.isdir(OUT):
    shutil.rmtree(OUT)

# solo le viste dei tagli in elenco
cuts = json.load(open(os.path.join(ROOT, 'tagli', 'tagli.json'), encoding='utf-8'))['tagli']
missing = []
for c in cuts:
    found = sorted(glob.glob(f"tagli/{c['id']}/viste/*.webp", root_dir=ROOT))
    if not found:
        missing.append(c['id'])
    FILES += found

def copy(rel):
    src, dst = os.path.join(ROOT, rel), os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if rel in SCRIPTS:   # gli script devono avere gli a capo Linux, anche se la cartella viene da Windows
        data = open(src, 'rb').read().replace(b'\r\n', b'\n')
        open(dst, 'wb').write(data)
    else:
        shutil.copy2(src, dst)

for rel in FILES:
    copy(rel.replace('\\', '/'))

# zip con i permessi di esecuzione per gli script
zpath = OUT + '.zip'
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
    for rel in FILES:
        rel = rel.replace('\\', '/')
        info = zipfile.ZipInfo.from_file(os.path.join(OUT, rel), 'blackblade/' + rel)
        mode = 0o755 if rel in SCRIPTS else 0o644
        info.external_attr = (stat.S_IFREG | mode) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(info, open(os.path.join(OUT, rel), 'rb').read())

size = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
print(f'{len(FILES)} file, {size / 1e6:.1f} MB -> {OUT}')
print(f'zip: {os.path.getsize(zpath) / 1e6:.1f} MB -> {zpath}')
if missing:
    print('ATTENZIONE, tagli senza viste (in app risultano "In arrivo"):', ', '.join(missing))
