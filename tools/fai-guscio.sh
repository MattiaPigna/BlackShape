#!/bin/bash
# Dal foglio AI (da-sistemare/bb-foglio6-<id>.png) al modello 3D dei capelli (modelli/guscio/<id>.glb).
# Poi: tools/render-guscio.html?id=<id> (con tools/server-salva.py) e python tools/componi-giro.py <id>
set -e
cd "$(dirname "$0")/.."
id=$1
BB_PANNELLI=modelli/guscio/pannelli-$id.npz python tools/prepara-giro.py $id da-sistemare/bb-foglio6-$id.png
python tools/guscio-capelli.py $id
