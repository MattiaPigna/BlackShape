# BLACKBLADE — Galleria dei tagli

App a tema mafia (nero e rosso) per far scegliere il taglio ai clienti su uno schermo touch.
Funziona **offline** (font e immagini sono nella cartella).

## Cosa fa
- **Testa che gira**: 10 viste per taglio prese dai fogli AI, si gira trascinando col dito.
  Toccando un taglio la testa fa un giro completo e si ferma di fronte.
- **20 tagli** divisi in *Classici* e *Moderni*, con miniature, descrizione e schede
  (tempo in poltrona, ogni quanto ritoccarlo, prodotto). Testi e schede in `tagli/tagli.json`.
- **Scelgo questo**: scheda a tutto schermo con fronte, profilo e nuca da mostrare al barbiere.
- **Trova il tuo taglio**: 3 domande (lunghezza, lati, tempo per la piega) e l'app propone 3 tagli.
- **Vetrina** dopo 8 s senza tocchi (gira da sola e cambia taglio) e **standby** con il logo
  dopo 45 s (`?standby=secondi` per cambiarlo).

Il vecchio showroom 3D resta disponibile aggiungendo `?3d` all'indirizzo (solo sul PC).

## Installazione su Raspberry Pi
Consigliato: Raspberry Pi 4 o 5 (va bene anche da 1 GB) con **Raspberry Pi OS Lite** (senza desktop).

1. Sul PC crea il pacchetto leggero (~5 MB invece di oltre 2 GB):
   ```bash
   python tools/prepara-pi.py
   ```
   Esce `dist/blackblade-pi.zip`.
2. Copia lo zip sul Raspberry (chiavetta USB, oppure `scp dist/blackblade-pi.zip pi@IP-DEL-RASPBERRY:~`)
   e scompattalo nella home: viene la cartella `~/blackblade`.
3. Sul Raspberry, con internet collegato, una volta sola:
   ```bash
   unzip blackblade-pi.zip -d ~ && cd ~/blackblade
   ./installa-kiosk.sh
   sudo reboot
   ```
   All'accensione parte solo l'app a schermo intero. Uso della RAM: circa 400-500 MB su 1 GB.
   Per tornare al terminale: `Ctrl+Alt+F2` (con tastiera collegata).

Con Raspberry Pi OS **Desktop** invece: `./start.sh` per provarla e `./installa-avvio-automatico.sh`
per farla partire a ogni accensione.

Per aggiornare l'app sul Raspberry: rifai il pacchetto, copialo e scompattalo sopra quello vecchio.

## Viste dei tagli
La galleria mostra 10 viste per taglio prese direttamente dal foglio AI (`da-sistemare/bb-foglio6-<id>.png`,
griglia 3x2): i 6 pannelli e 4 di questi specchiati per l'altro lato. Per i tagli con la riga da un lato c'e' anche
il foglio del lato destro (`bb-foglio6d-<id>.png`): se esiste, le viste di destra vengono da li'
invece che dallo specchio. Dopo aver aggiunto o rifatto un foglio:
```bash
python tools/prepara-viste.py                 # tutti i tagli (512 px, risoluzione piena del foglio)
python tools/prepara-viste.py 512 pompadour   # un solo taglio
```
poi cambia `VISTE_VER` in `galleria.js` cosi' il browser ricarica le immagini.

## Provarla su Windows
Doppio clic su `avvia-su-windows.bat` (serve Python), si apre il browser.

## Personalizzare
- `tagli/tagli.json`: elenco dei tagli, gruppo (Classici/Moderni), nome, descrizione e schede
  (`info`: lunghezza, sfumatura, minuti di piega, ritocco, prodotto, durata; servono anche al quiz).
- `galleria.js`: tempi della vetrina e dello standby, angoli delle viste.

Parametri utili nell'indirizzo (es. `http://127.0.0.1:8765/?cut=undercut&standby=60`):
`cut`, `nospin`, `nohint`, `standby` (secondi), `pick` / `quiz` (aprono subito la scheda o il quiz).

## Archivio
`modelli/god+father_+15cm.stl` e' il busto originale da cui e' nato il modello dei fogli AI.
Il vecchio showroom 3D e' stato tolto: si recupera dalla storia di git (commit 2214d03).
