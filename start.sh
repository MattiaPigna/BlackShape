#!/bin/bash
# BLACKBLADE - avvio showroom 3D a schermo intero (Raspberry Pi)
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8765

# server locale (i moduli JavaScript non funzionano aprendo il file direttamente)
if ! curl -s "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
  (cd "$DIR" && python3 tools/server.py $PORT >/dev/null 2>&1 &)
  sleep 2
fi

# nasconde il cursore se è installato unclutter (sudo apt install unclutter)
command -v unclutter >/dev/null && unclutter -idle 3 &

BROWSER=$(command -v chromium-browser || command -v chromium)
exec "$BROWSER" \
  --kiosk --noerrdialogs --disable-infobars --incognito \
  --check-for-update-interval=31536000 \
  --disable-pinch --overscroll-history-navigation=0 \
  --ignore-gpu-blocklist --enable-gpu-rasterization \
  --password-store=basic \
  "http://127.0.0.1:$PORT/${1:+?$1}"
