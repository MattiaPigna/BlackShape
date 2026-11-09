# Come creare le immagini di un taglio nuovo

Ogni taglio = **1 immagine generata con ChatGPT** (foglio 3x2 con la testa da 6 angoli) + 1 script.

## 1) Il foglio del taglio
1. Nuova chat ChatGPT, allega `tools/foglio-6viste.png` (la testa calva da 6 angoli).
   Se hai foto del taglio su una persona vera (fronte, lato, nuca), allegale pure: aiutano.
2. Incolla questo prompt, cambiando solo la parte in MAIUSCOLO (nome e descrizione del taglio in inglese):

```
Create an image. The attached image is a 3x2 turnaround sheet (landscape 3:2) of ONE grey clay sculpture of a bald
male head seen from 6 angles, rotating from front view (top-left) to back view (bottom-right). Edit it: give the
head in all 6 panels this haircut: NOME TAGLIO - descrizione. Photorealistic dark brown human hair with individual
strands and a realistic skin fade where the haircut has one. CRUCIAL: it is the SAME head and the SAME haircut in
all 6 panels, so the hair must be perfectly consistent between panels (same strands, same volume, same color, same
fade height), like a real 3D object photographed from 6 cameras. Keep everything else identical: the 3x2 layout,
the grey sculpted face, mustache, eyebrows, closed eyes, ears, each pose, camera angle, framing, head size,
lighting and dark background. Do not add clothes. Landscape 3:2 image.
```

3. Salva il risultato come `da-sistemare/bb-foglio6-<id>.png` (`<id>` = nome della cartella, es. `side-part`).

## 2) Solo per i tagli con la riga da un lato: il lato destro
Il foglio mostra solo il lato sinistro; l'altro lato normalmente si ottiene allo specchio, ma cosi' la riga
cambierebbe lato. Per questi tagli si genera anche il lato destro vero:

1. Nuova chat, allega `tools/foglio-6viste-destra.png` (testa calva vista da destra) e il foglio del punto 1.
2. Prompt:

```
Create an image. Image 1 is a 3x2 turnaround sheet (landscape 3:2) of ONE grey clay sculpture of a bald male head
seen from 6 angles from its RIGHT side, rotating from front view (top-left) to back view (bottom-right). Image 2 is
the SAME head with a NOME TAGLIO haircut, seen from its LEFT side in the same 6 poses. Edit image 1: give the head
in all 6 panels exactly the haircut of image 2, as it really looks from the right side of the head. The part line
stays on the head's LEFT side exactly as in image 2 (it is NOT mirrored). Same hair length, volume, dark brown
color, shine and fade height as image 2, photorealistic individual strands. CRUCIAL: same haircut in all 6 panels,
consistent like a real 3D object photographed from 6 cameras. Keep everything else in image 1 identical: the 3x2
layout, grey sculpted face, mustache, eyebrows, closed eyes, ears, each pose, camera angle, framing, head size,
lighting and dark background. Do not add clothes. Landscape 3:2 image.
```

3. Salva come `da-sistemare/bb-foglio6d-<id>.png` (con la **d** di destra).

## 2b) I vestiti (smoking)
Le viste nell'app hanno lo smoking. Per ogni foglio del punto 1 (e del punto 2, se c'e'):
1. Nuova chat, allega **il foglio del taglio** (`da-sistemare/bb-foglio6-<id>.png`).
2. Prompt (cambia solo NOME TAGLIO):

```
Create an image. The attached image is a 3x2 turnaround sheet (landscape 3:2) of ONE grey clay sculpture of a male
head with NOME TAGLIO haircut, seen from 6 angles rotating from front view (top-left) to back view (bottom-right).
Edit it: dress the figure in all 6 panels in a classic 1940s formal outfit: black tuxedo jacket with satin peak
lapels, crisp white dress shirt with a turned-down collar, black silk bow tie, and a small red rose boutonniere on
the lapel. Only the collar, bow tie, lapels and the top of the shoulders are visible, cropped by the bottom edge of
each panel, like a bust portrait. The clothes are photorealistic real fabric (not clay) and they are the SAME outfit
in all 6 panels, consistent like a real 3D object photographed from 6 cameras, turning together with the head.
CRUCIAL: keep the head exactly identical in every panel: same hair (same strands, volume, dark brown color, fade,
part line), same grey sculpted face, mustache, eyebrows, closed eyes, ears, same pose, camera angle, framing and head
size and position (do NOT zoom out, do NOT move or shrink the head, the whole hair must stay visible inside each
panel). Keep the 3x2 layout, lighting and dark background. Landscape 3:2 image.
```
   Per il lato destro: aggiungi "seen from its RIGHT side," dopo "seen" e metti la rosa "on the figure's LEFT lapel
   (the lapel on the far side from this camera, so it is mostly hidden from this side)".
3. Salva come `da-sistemare/bb-busto6-<id>.png` (lato destro: `bb-busto6d-<id>.png`).
   `prepara-viste.py` usa questi fogli quando ci sono, altrimenti quelli senza vestiti.

## 3) Metterlo nell'app
1. In `tagli/tagli.json` aggiungi il taglio (id, gruppo, nome, it, desc, info) e crea la cartella `tagli/<id>/`.
2. `python tools/prepara-viste.py 512 <id>` -> crea le 10 viste e la miniatura in `tagli/<id>/viste/`.
3. In `galleria.js` cambia `VISTE_VER` cosi' i browser ricaricano le immagini.
4. Per il Raspberry: `python tools/prepara-pi.py` e copia lo zip.
