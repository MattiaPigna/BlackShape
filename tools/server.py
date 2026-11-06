# Server locale dell'app: come "python -m http.server" ma dice al browser di ricontrollare sempre i file,
# cosi' dopo un aggiornamento (nuovi tagli, nuovo codice) non si vede mai la versione vecchia.
# Uso: python tools/server.py [porta=8765]
import http.server, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, *a):
        pass

http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
