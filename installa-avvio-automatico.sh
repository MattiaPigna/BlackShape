#!/bin/bash
# Fa partire BLACKBLADE automaticamente all'accensione del Raspberry Pi.
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$DIR/start.sh"
LINE="$DIR/start.sh &"

# Raspberry Pi OS Bookworm con labwc (default dal 2024)
mkdir -p "$HOME/.config/labwc"
grep -qF "$LINE" "$HOME/.config/labwc/autostart" 2>/dev/null || echo "$LINE" >> "$HOME/.config/labwc/autostart"

# Raspberry Pi OS Bookworm con wayfire (versioni precedenti)
if [ -f "$HOME/.config/wayfire.ini" ] && ! grep -q "blackblade" "$HOME/.config/wayfire.ini"; then
  if grep -q "^\[autostart\]" "$HOME/.config/wayfire.ini"; then
    sed -i "/^\[autostart\]/a blackblade = $DIR/start.sh" "$HOME/.config/wayfire.ini"
  else
    printf "\n[autostart]\nblackblade = %s/start.sh\n" "$DIR" >> "$HOME/.config/wayfire.ini"
  fi
fi

# Raspberry Pi OS Bullseye / X11 (LXDE)
mkdir -p "$HOME/.config/lxsession/LXDE-pi"
grep -qF "@$DIR/start.sh" "$HOME/.config/lxsession/LXDE-pi/autostart" 2>/dev/null || echo "@$DIR/start.sh" >> "$HOME/.config/lxsession/LXDE-pi/autostart"

echo "Fatto! Riavvia il Raspberry (sudo reboot) e BLACKBLADE partirà da solo."
