# Prompt per generare le immagini dei tagli

Usa sempre la stessa chat dell'AI (ChatGPT / Gemini / ecc.) per uno stesso taglio:
così il manichino, la luce e lo sfondo restano uguali in tutte e 4 le viste.

## 1) Prima immagine di ogni taglio (vista FRONTE)

Copia questo e sostituisci [TAGLIO] con la descrizione dalla tabella sotto:

```
Ultra-photorealistic studio photo of a smooth matte grey male mannequin head
with neck and upper shoulders, realistic neutral male face, eyes closed.
The mannequin wears a real human men's haircut: [TAGLIO].
Real individual hair strands, natural dark brown hair color, realistic scalp
visible through the skin fade, crisp clean barber lines, professional barbershop
quality, freshly cut.
Front view, head facing the camera straight on, centered, head and shoulders in frame.
Plain dark charcoal background, soft even studio lighting, no harsh shadows,
no text, no logo, no watermark, no props, no hands.
Vertical portrait format 4:5, 85mm lens, sharp focus on the hair.
```

## 2) Le altre 3 viste (nella STESSA chat, subito dopo)

```
Same mannequin, same haircut, same lighting, same background, same framing.
Rotate the head: three-quarter view, turned 45 degrees to the left.
```
```
Same mannequin, same haircut, same lighting, same background, same framing.
Rotate the head: exact side profile, facing left, ear fully visible so the fade is clearly shown.
```
```
Same mannequin, same haircut, same lighting, same background, same framing.
Rotate the head: back view, showing the nape and the back of the haircut.
```

## 3) Descrizioni dei tagli ([TAGLIO])

| Cartella | Descrizione da incollare |
|---|---|
| slick | classic slick back, all hair combed straight back with high-shine pomade, sides scissor-tapered short and neat |
| sidepart | classic side part on the left with a sharp shaved part line, top 6 cm combed to the side, tapered sides |
| pompadour | high voluminous pompadour, glossy pomade, tall wave at the front, short shiny tapered sides |
| quiff | textured quiff swept up and forward, matte finish, top 7 cm, mid fade on the sides |
| crew | crew cut, top 3 cm slightly longer at the front, sides and back clipper #2 tapered |
| flattop | flat top, perfectly flat squared top 3 cm, faded sides, very precise edges |
| buzz | uniform buzz cut, clipper #3 all over the head, clean natural hairline |
| undercut | disconnected undercut, sides and back shaved with clipper #1, long top 12 cm slicked back, hard contrast |
| lowfade | low skin fade starting just above the ear and at the nape, short textured top 4 cm pushed forward |
| midfade | mid skin fade rising to the temples, textured messy top 4-5 cm |
| highfade | high skin fade up to the parietal ridge, very short top 2-3 cm |
| taper | taper fade only at the sideburns and nape, rest of the hair full, medium length 5 cm |
| dropfade | drop fade that curves down behind the ear toward the nape, soft fringe swept forward |
| burst | burst fade, skin-faded semicircle around the ear, full nape, textured faux hawk on top |
| crop | textured French crop, mid skin fade, short blunt fringe on the forehead, choppy texture on top |
| buzzfade | buzz cut clipper #2 on top, skin fade on the sides and back |

## 4) Dove metterle

Basta salvarle tutte in una cartella (es. `BlackShape\da-sistemare\`), con nomi qualsiasi:
le smisto, rinomino, ritaglio e comprimo io.
Oppure direttamente in `tagli\<cartella>\fronte.jpg`, `tre-quarti.jpg`, `profilo.jpg`, `nuca.jpg`.

---

## 5) Capelli in 3D sul NOSTRO modello (metodo attuale)

Ogni taglio = 1 sola immagine di ChatGPT + script. Niente piu' foto separate per vista.

1. Nuova chat ChatGPT, allega 4 immagini: `modelli/viste/foglio-6viste.png` (testa calva da 6 angoli)
   + le 3 foto del taglio (`da-sistemare/tellbarber/<id>__front/side/back.png`).
2. Prompt (cambia solo la parte in MAIUSCOLO):

```
Create an image. Image 1 is a 3x2 turnaround sheet (landscape 3:2) of ONE grey clay sculpture of a bald male head
seen from 6 angles, rotating from front view (top-left) to back view (bottom-right). Images 2, 3 and 4 show the
haircut I want, on a real man (front, side, back): NOME TAGLIO - descrizione breve. Edit image 1: give the head in
all 6 panels exactly this haircut, as photorealistic dark brown human hair with individual strands and a realistic
skin fade where the haircut has one. CRUCIAL: it is the SAME head and the SAME haircut in all 6 panels, so the hair
must be perfectly consistent between panels (same strands, same volume, same color, same fade height), like a real
3D object photographed from 6 cameras. Keep everything else identical: the 3x2 layout, the grey sculpted face,
mustache, eyebrows, closed eyes, ears, each pose, camera angle, framing, lighting and dark background.
Do not add clothes. Landscape 3:2 image.
```

3. Salva il risultato come `da-sistemare/bb-foglio6-<id>.png`.
4. Modello 3D dei capelli: `bash tools/fai-guscio.sh <id>`
   - tagli con frangia sulla fronte: `BB_FRANGIA=1` davanti a `python tools/guscio-capelli.py <id>`
   - capelli lunghi su orecchie/nuca: `BB_LUNGHI=1`
5. Render: avvia `python tools/server-salva.py`, apri `http://127.0.0.1:8766/tools/render-guscio.html?id=<id>&n=120`
   (piu' tagli: `id=a,b,c`), poi `python tools/componi-giro.py <id>`.
6. In `galleria.js` cambia `GIRO_VER` cosi' i browser ricaricano le immagini nuove.
