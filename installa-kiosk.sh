#!/bin/bash
# BLACKBLADE su Raspberry Pi OS Lite (senza desktop), pensato per Raspberry da 1 GB di RAM.
# All'accensione il Raspberry entra da solo e mostra SOLO l'app a schermo intero (niente desktop, niente menu).
# Uso (una volta sola, dal terminale del Raspberry, con internet collegato):
#   cd ~/blackblade && chmod +x *.sh && ./installa-kiosk.sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$DIR/start.sh"

echo "== Installo il minimo indispensabile (cage + Chromium) =="
sudo apt-get update
sudo apt-get install -y --no-install-recommends cage python3 curl fonts-dejavu-core
# il pacchetto di Chromium ha nomi diversi a seconda della versione di Raspberry Pi OS
sudo apt-get install -y --no-install-recommends chromium \
  || sudo apt-get install -y --no-install-recommends chromium-browser

echo "== Accesso automatico all'accensione (senza password, solo console) =="
sudo raspi-config nonint do_boot_behaviour B2

echo "== Avvio automatico dell'app =="
PROFILE="$HOME/.bash_profile"
touch "$PROFILE"
if ! grep -q "BLACKBLADE-KIOSK" "$PROFILE"; then
  cat >> "$PROFILE" <<EOF

# BLACKBLADE-KIOSK: sul primo schermo apre solo l'app; se il browser si chiude, riparte da solo
if [ -z "\$WAYLAND_DISPLAY" ] && [ "\$(tty)" = /dev/tty1 ]; then
  while true; do
    cage -s -- "$DIR/start.sh" lite
    sleep 2
  done
fi
EOF
fi

echo
echo "Fatto! Riavvia il Raspberry (sudo reboot): partira' direttamente BLACKBLADE."
echo "Per tornare al terminale: Ctrl+Alt+F2 (con tastiera collegata)."
echo "Per togliere l'avvio automatico: cancella il blocco BLACKBLADE-KIOSK da ~/.bash_profile"
