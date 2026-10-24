# Lumina

Agenda operativa per parrucchieri, palestre e studi. PHP 8.5, MySQL 8, nessuna dipendenza da Composer oltre al runtime.

Gli orari si scrivono nel fuso dell'attività (in demo, Europe/Roma) e si conservano in UTC. Uno slot è **ideale** quando riempie esattamente il buco tra due impegni, **spezzato** quando lascia meno di 30 minuti. Il prezzo vivo applica solo lo sconto più alto della fascia, senza cumularli. Una disdetta offre il posto al primo in lista compatibile, per 180 minuti o fino all'orario. La caparra è un avviso in agenda, non un pagamento. Le notifiche restano nell'applicazione: non partono email né SMS.

## Avvio

```bash
cd lumina
php bin/setup.sh
php bin/serve.sh
```

Poi apri http://127.0.0.1:8080

`setup.sh` applica lo schema se manca e carica la demo. `php bin/seed.php --fresh` la ricrea. `php bin/selftest.php` esegue i controlli sul database `lumina_test`.

## XAMPP su Windows

Il 21 ottobre 2026 PHP ha corretto due falle critiche di esecuzione remota, CVE-2026-109618 e CVE-2026-109619. Un XAMPP più vecchio di 8.5.12 le ha ancora. Lumina non parte sotto quella soglia.

1. Chiudi il pannello XAMPP. Se reinstalli nella stessa cartella, copia prima `C:\xampp\mysql\data`.
2. Installa [XAMPP 8.5.12](https://www.apachefriends.org/download.html) (PHP 8.5.12, MariaDB 10.11). Le build 8.4.27 e 8.3.36 sono corrette, ma questa agenda usa PHP 8.5.
3. Avvia MySQL dal pannello.
4. Nella cartella `lumina` lancia `bin\xampp.bat`.

Lo script crea i database `lumina` e `lumina_test`, l'utente `lumina`, e un virtual host sulla porta 8080 con la cartella `public`. La porta 80 del pannello non cambia. `Require local` fa rispondere la pagina solo da questo PC: XAMPP non va esposto su internet. Poi riavvia Apache dal pannello e apri http://127.0.0.1:8080

Se root di MariaDB ha una password, impostala prima del lancio: `set XAMPP_MYSQL_ROOT_PASSWORD=...`. Se XAMPP non è in `C:\xampp`, imposta `XAMPP_HOME`.

Database locale previsto: `lumina` su `127.0.0.1`, utente `lumina`, password `lumina_local`. Variabili opzionali: `LUMINA_DB_HOST`, `LUMINA_DB_PORT`, `LUMINA_DB_NAME`, `LUMINA_DB_USER`, `LUMINA_DB_PASS`. Con `LUMINA_DEBUG=1` gli errori finiscono nella pagina.

## Demo

Password di tutti gli account: `Lumina-demo-2026`

| Chi | Email | Cosa vede |
| --- | --- | --- |
| Giulia, Atelier Luce | giulia@atelierluce.test | Agenda del salone |
| Marco, collaboratore | marco@atelierluce.test | Operatività, senza listino |
| Elena, Palestra Borgo | elena@palestraborgo.test | Agenda della palestra |
| Bianca, cliente | bianca@email.test | Portale |
| Davide | — | In salone, senza login |

Pagine pubbliche: `/b/atelier-luce` e `/b/palestra-borgo`. Nel salone, il trattamento lampo delle 16 nel primo pomeriggio aperto è lo slot ideale tra un taglio e un colore.

## Ingresso

La registrazione chiede un codice di 6 cifre, valido 10 minuti, monouso, con al massimo 5 tentativi. In alternativa ci sono Google e Apple, se l'installazione ha le chiavi. Un'email non confermata non viene agganciata a un account già presente.

Senza `LUMINA_SMTP_HOST` la lettera resta nella pagina del codice: è la posta locale, non un invio vero. Con SMTP il codice parte e non viene più mostrato.

```
LUMINA_PUBLIC_URL=https://agenda.example
LUMINA_APP_KEY=una-stringa-lunga-almeno-32-caratteri
LUMINA_GOOGLE_CLIENT_ID=
LUMINA_GOOGLE_CLIENT_SECRET=
LUMINA_APPLE_CLIENT_ID=
LUMINA_APPLE_TEAM_ID=
LUMINA_APPLE_KEY_ID=
LUMINA_APPLE_PRIVATE_KEY=/percorso/AuthKey.p8
LUMINA_SMTP_HOST=
LUMINA_SMTP_PORT=587
LUMINA_SMTP_USER=
LUMINA_SMTP_PASS=
LUMINA_MAIL_FROM=noreply@example
```

URI da registrare: `/auth/google/ritorno` e `/auth/apple/ritorno`.

## Piani

IVA esclusa. Bottega 0 €: 1 persona, 40 prenotazioni al mese, slot ideale. Salone 29 € al mese o 290 € l'anno: 8 persone, prezzo vivo, lista, tessere, corsi, export. Borgo 79 € al mese o 790 € l'anno: 40 persone, analisi, regole di prezzo senza tetto. L'anno costa dieci mesi.

Il piano si attiva subito e i limiti valgono. Non parte alcun addebito: il pagamento online non è collegato. In demo Atelier Luce è Salone, Palestra Borgo è Borgo.

## Cosa non fa

Un solo locale per attività. Niente pagamenti online, niente SMS, niente account staff che modifica prezzi o impostazioni. Le email partono solo se configuri l'SMTP.
