# SpeakDay — teacher a lungo termine (XAMPP)

Routine audio per parlare inglese in **riunioni** e **vita quotidiana**, con:

- aggiornamento curriculum da GitHub (frasi/nuove funzioni)
- Path giornaliero + streak
- Review SRS (ripetizione dilazionata)
- Trucchi concreti IT/EN
- Conversation / Shadow / Phrases

## Installazione XAMPP

1. Copia tutta la cartella `speakday` in `C:\xampp\htdocs\`
2. Avvia **solo Apache**
3. Apri con Chrome/Edge: `http://localhost/speakday/`

## Come si aggiorna da sola

All’apertura (e con **Check for updates**) l’app prova a scaricare:

`speakday/data/curriculum.json`

dal repo GitHub. Se trova una versione più nuova, la salva in `localStorage` e la usa.

Tu **non** devi reinstallare ogni volta per nuove frasi — basta avere internet alla prima apertura del giorno e cliccare **Check for updates** (o semplicemente ricaricare la pagina).

Se cambi file locali (HTML/JS nuovi), copia di nuovo la cartella `speakday` in `htdocs` una volta.

## Modalità

| Mode | Uso |
|------|-----|
| **Path** | Missioni del giorno + kit riunione |
| **Conversation** | Dialogo audio lavoro/vita |
| **Shadow** | Ascolta e ripeti |
| **Phrases** | Banca pezzi pronti |
| **Review** | SRS — memoria a lungo termine |
| **Trucchi** | Tecniche per parlare/capire |

## Microfono

Chrome/Edge + `http://localhost/speakday/` + consenti mic.  
Se fallisce: box **type your answer**.
