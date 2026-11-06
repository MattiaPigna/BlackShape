# BLACKBLADE — Showroom 3D dei tagli

App a tema mafia (nero e rosso) per mostrare ai clienti i tagli classici da barbiere
su teste 3D da ruotare con il dito (touch) o con il mouse. Funziona **offline**:
Three.js e i font sono già inclusi nella cartella.

## Cosa contiene
- **4 teste ("La Famiglia")**: **Il Don** (busto scolpito dal tuo file STL), Il Consigliere,
  Il Picciotto, Il Sicario (teste generate al computer).
- **Capelli a fili**: ogni taglio è fatto da decine di migliaia di fili pettinati nella
  direzione giusta, con riflessi realistici; i tagli si trasformano con un'animazione.
- **16 tagli** in due gruppi:
  - *Classici*: Slick Back, Side Part, Pompadour, Quiff, Crew Cut, Flat Top, Buzz Cut, Undercut.
  - *Moderni*: Low / Mid / High Skin Fade, Taper Fade, Drop Fade, Burst Fade, Textured Crop, Buzz Fade.
- **Sfumature vere**: ogni taglio usa la funzione `fade()` in `app.js` con altezza della linea
  (`low`, `mid`, `high`, `drop` o `burst` attorno all'orecchio) e numeri di rialzo (0 = a pelle).
- **6 barbe**: Rasato, Barba di 3 giorni, Baffi, Pizzetto, Barba corta, Barba piena.
- **6 colori**: Nero, Castano scuro, Castano, Brizzolato, Argento, Biondo cenere.
- **Fedora** on/off, viste rapide **Fronte / Profilo / Nuca**, rotazione automatica
  dopo 8 secondi senza tocchi (effetto vetrina).

Comandi: 1 dito / mouse = ruota · 2 dita / rotella = zoom.

## Installazione su Raspberry Pi
Consigliato: Raspberry Pi 4 o 5 con Raspberry Pi OS (Desktop).

1. Copia la cartella `blackblade` nella home, ad es. `/home/pi/blackblade`
   (chiavetta USB, oppure `scp -r blackblade pi@IP-DEL-RASPBERRY:~`).
2. Apri il terminale sul Raspberry:
   ```bash
   cd ~/blackblade
   chmod +x start.sh installa-avvio-automatico.sh
   ./start.sh                         # prova subito a schermo intero
   ./installa-avvio-automatico.sh     # parte da solo a ogni accensione
   ```
3. Per uscire dalla modalità schermo intero: `Alt+F4` (con tastiera collegata).

### Se è lento
Usa la modalità leggera (meno poligoni, niente antialiasing):
```bash
./start.sh lite
```
Per renderla permanente modifica l'ultima riga di `start.sh` sostituendo
`${1:+?$1}` con `?lite`.

## Provarla su Windows
Doppio clic su `avvia-su-windows.bat` (serve Python), si apre il browser.

## Personalizzare
Tutto è in `app.js`:
- `HEADS` → teste: carnagione, mascella, naso, sopracciglia, abito, taglio di default.
- `CUTS` → tagli: nome, descrizione e la funzione `f()` che decide la lunghezza dei
  capelli in ogni punto della testa.
- `COLORS` e `BEARDS` → colori e barbe.

Parametri utili nell'indirizzo (es. `http://127.0.0.1:8765/?head=sicario&cut=undercut`):
`head`, `cut`, `beard`, `color`, `hat=1`, `nospin`, `lite`.

## Aggiungere altre teste da file STL
Il busto originale (`modelli/god+father_+15cm.stl`, 1,7 milioni di triangoli) è stato
convertito in `modelli/don.bbm` (260.000 triangoli + mappa della testa), molto più leggero
per il Raspberry. **Sul Raspberry basta copiare `don.bbm`, non serve l'STL da 84 MB.**

Per convertire un nuovo busto (sul PC, serve Node.js):
```
cd tools
npm install
node prepara-modello.mjs ../modelli/nuovo.stl nome 260000
```
Prima aggiungi in `tools/modelli.json` il centro della testa (circa all'altezza degli
occhi, in mm del file STL) e la scala. Poi in `app.js`, nella lista `HEADS`, aggiungi
`model: 'modelli/nome.bbm'` e la curva dell'attaccatura `hl` (vedi Il Don come esempio).

Parametri di test utili: `noshell`, `nostrands`, `cls` (mostra le zone giacca/camicia).
