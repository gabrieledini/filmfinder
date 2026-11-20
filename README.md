# Cineteca

Cineteca è una web app per cercare film e attori. Mostra trame, regia, cast e filmografie usando i dati di [TMDb](https://www.themoviedb.org/). È una PWA, quindi si può installare sul telefono o sul computer e aprire come un'app.

## Funzionalità

- **Ricerca per titolo o per attore**, con risultati mentre scrivi.
- **Film in tendenza** della settimana nella schermata iniziale.
- **Scheda film**: foto di scena, locandina, anno, durata, voto, generi, trama, regia e cast principale. Se la trama in italiano non c'è, viene mostrata quella in inglese.
- **Scheda attore**: foto, data e luogo di nascita, biografia e filmografia completa, dal film più recente.
- **Tema chiaro e scuro** automatico, secondo le impostazioni del dispositivo.
- **Installabile**: icona sulla schermata Home, apertura a schermo intero e avviso quando è disponibile una nuova versione.

## Requisiti

Serve una API key TMDb (v3), gratuita:

1. Crea un account su [themoviedb.org](https://www.themoviedb.org/signup).
2. Vai su [Impostazioni → API](https://www.themoviedb.org/settings/api) e richiedi una chiave.
3. Copia il valore **API Key (v3 auth)**.

Al primo avvio l'app chiede la chiave. La chiave viene salvata solo nel browser del dispositivo (`localStorage`) e non viene inviata altrove se non a TMDb. Per cambiarla usa il link **Cambia API key**.

## Avvio in locale

L'app è un'unica pagina HTML, senza build né dipendenze. Il service worker però funziona solo su `http://localhost` o su HTTPS, quindi aprendo il file direttamente (`file://`) l'installazione non è disponibile.

Avvia un server statico nella cartella del progetto, ad esempio:

```bash
npx serve .
# oppure
python -m http.server 8000
```

Poi apri l'indirizzo indicato dal comando nel browser.

## Installazione sul telefono

Pubblica la cartella su un hosting HTTPS (per esempio GitHub Pages), poi apri il sito dal telefono:

- **Android (Chrome, Edge, Samsung Internet)**: tocca **Installa** nel banner in basso, oppure usa il menu del browser → *Installa app*.
- **iPhone e iPad (Safari)**: tocca il pulsante Condividi e poi **Aggiungi alla schermata Home**.

## Struttura del progetto

| File | Contenuto |
| --- | --- |
| `index.html` | Interfaccia, stili e logica dell'app |
| `manifest.webmanifest` | Nome, colori e icone dell'app installata |
| `sw.js` | Service worker: cache dell'app, dei font e delle immagini |
| `icons/` | Icone per Android, iOS e favicon |

## Pubblicare un aggiornamento

Quando modifichi `index.html` o altri file dell'app, cambia anche la costante `VERSION` in `sw.js`. Così il browser scarica i file nuovi e chi ha l'app installata vede l'avviso **Aggiorna**.

Le richieste alle API di TMDb non vengono mai messe in cache: i dati sono sempre aggiornati e la ricerca richiede una connessione.

## Crediti

Dati e immagini forniti da [TMDb](https://www.themoviedb.org/). Questo prodotto usa le API di TMDb ma non è approvato né certificato da TMDb.

## Licenza

Distribuito con licenza [MIT](LICENSE).
