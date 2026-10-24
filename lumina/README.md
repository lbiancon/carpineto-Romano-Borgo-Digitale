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

## Cosa non fa

Un solo locale per attività. Niente pagamenti online, niente gateway di messaggi, niente account staff che modifica prezzi o impostazioni.
