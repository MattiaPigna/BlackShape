#!/bin/bash
# Ricostruisce il modello 3D dei capelli dei tagli indicati (o di tutti), con le opzioni giuste per ognuno.
cd "$(dirname "$0")/.."
FRANGIA=" textured-crop french-crop crops-fade two-block edgar-cut "
LUNGHI=" middle-part modern-mullet "
ids="$@"; [ -z "$ids" ] && ids=$(ls modelli/guscio/pannelli-*.npz | sed 's/.*pannelli-//; s/.npz//')
for id in $ids; do
  f=0; l=0
  [[ "$FRANGIA" == *" $id "* ]] && f=1
  [[ "$LUNGHI" == *" $id "* ]] && l=1
  BB_FRANGIA=$f BB_LUNGHI=$l python tools/guscio-capelli.py $id | tail -1
done
