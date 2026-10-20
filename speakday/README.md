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

## Se non senti l’audio

- Usa Chrome o Edge (il TTS è del browser)  
- Clicca prima un pulsante della pagina, poi “Start audio conversation”  
- Il microfono funziona meglio su `http://localhost/...` (non su `file://`)

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
