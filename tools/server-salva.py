# Server locale per tools/render-viste.html: serve la cartella BlackShape e salva i PNG in modelli/viste/
import http.server, os, re, urllib.parse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'modelli', 'viste')
os.makedirs(OUT, exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        nome = re.sub(r'[^a-z0-9_./-]', '', q.get('nome', ['x'])[0]).replace('..', '').lstrip('/')
        data = self.rfile.read(int(self.headers['Content-Length']))
        dst = os.path.join(OUT, nome if '.' in os.path.basename(nome) else nome + '.png')
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, 'wb') as f:
            f.write(data)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')

http.server.ThreadingHTTPServer(('127.0.0.1', 8766), H).serve_forever()
