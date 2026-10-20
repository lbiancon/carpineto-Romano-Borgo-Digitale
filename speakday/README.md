# SpeakDay (XAMPP / Apache)

Routine audio in inglese per **riunioni** e **vita quotidiana**.

Funziona con **solo Apache di XAMPP** — niente Node, niente Vite, niente porta 5173.

## Installazione su XAMPP (Windows)

1. Avvia **solo Apache** da XAMPP Control Panel  
2. Copia tutta la cartella `speakday` dentro `C:\xampp\htdocs\`  
   Risultato: `C:\xampp\htdocs\speakday\index.html`  
3. Apri nel browser (meglio **Chrome** o **Edge**):

```
http://localhost/speakday/
```

Non serve `npm`, non serve PHP, non serve MySQL.

## Se il microfono dice “No speech” / non ascolta

1. Usa **Chrome o Edge** (non Firefox/Safari)  
2. Apri proprio `http://localhost/speakday/` (non `file://`)  
3. Quando Chrome chiede il microfono → **Consenti**  
4. Aspetta che il partner finisca di parlare, poi clicca **Tap to speak**  
5. Parla in inglese subito dopo “Listening…”  
6. Se continua a fallire: usa il box **Or type your answer** sotto i pulsanti

## Se non senti l’audio del partner

- Clicca prima un pulsante della pagina, poi “Start audio conversation”  
- Controlla volume Windows / scheda audio

## Struttura

```
speakday/
  index.html
  css/app.css
  js/data.js
  js/speech.js
  js/app.js
  favicon.svg
```
