# Linee guida dell'interfaccia

L'interfaccia è il punto di forza di TailTicket: sobria, leggibile, veloce da usare tutto il giorno. Queste regole valgono per pannello agenti, area admin e portale clienti. In caso di dubbio: meno colore, più gerarchia.

## Principi
- **Neutri prima di tutto.** Superfici, testi e bordi sono grigi. Il colore del brand segnala solo ciò che si può fare o ciò che è attivo.
- **Il colore ha un significato.** Verde, giallo e rosso solo per stati reali (risolto, in scadenza, scaduto, errore), mai per decorare.
- **Gerarchia con peso e dimensione**, non con il colore: titoli più grandi e scuri, testi secondari più piccoli e grigi.
- **Numeri allineati**: cifre tabulari (`tabular-nums`) in tabelle, KPI e grafici.
- **Una sola fonte**: colori dai token del tema (`--color-brand-*`, `--color-gray-*`, semantici), grafici dal tema comune (`src/lib/charts/`). Niente esadecimali sparsi nei componenti.

## Colori
| Ruolo | Token | Uso |
|---|---|---|
| Sfondo pagina | `gray-50` · scuro `gray-950` | area di lavoro |
| Superficie | `white` · scuro `white/3` | card, tabelle, pannelli |
| Bordo | `gray-200` · scuro `gray-800` | card e separatori, sempre 1px |
| Testo primario | `gray-900` · scuro `white/90` | titoli, oggetti dei ticket, valori |
| Testo secondario | `gray-500` · scuro `gray-400` | etichette, date, descrizioni |
| Primario | `brand-500/600` | pulsante principale, voce di menu attiva, focus, link nel testo, serie principale dei grafici |
| Stati | `success` · `warning` · `error` · `blue-light` | badge e indicatori di stato, mai sfondi grandi |

Il primario è configurabile dall'area admin (Tema): nessun componente deve dare per scontato che sia blu.

**Da evitare**: righe di tabella con oggetto colorato, pulsanti primari multipli nella stessa area, sfondi pieni colorati per le card, più di 3–4 colori in un grafico.

## Componenti
- **Card**: `rounded-2xl`, bordo 1px, nessuna ombra; intestazione con titolo `text-base font-semibold` e descrizione `text-sm gray-500`.
- **Badge di stato**: tenui, con anello sottile: `bg-*-50 text-*-700 ring-1 ring-inset ring-*-600/20` (scuro `bg-*-500/10 text-*-400 ring-*-500/20`).
- **Priorità**: pallino del colore di osTicket + etichetta neutra; il rosso pieno solo per "Emergency" e "Scaduto".
- **Pulsanti**: uno solo primario (pieno) per area; gli altri secondari (bordo) o di testo.
- **Tabelle**: intestazioni `text-theme-xs uppercase gray-500`, righe `hover:bg-gray-50`, oggetto `font-medium gray-900` con hover sul primario.
- **Icone**: solo Lucide (`lucide-react`), `size-4`/`size-5`, tratto 1,75 (globals.css). Nessuna emoji.

## Grafici
- Tema comune in `src/lib/charts/`: font dell'interfaccia, griglia tratteggiata leggera, nessun bordo, tooltip con la stessa card dell'interfaccia, colori letti dai token CSS (seguono primario e modalità scura).
- **Palette delle serie**: primario per la serie principale, una tinta più chiara del primario o un grigio per il confronto, colori semantici solo se la serie è uno stato (chiusi = success, scaduti = error). Massimo 4 serie visibili; le altre si attivano dalla legenda.
- Aree con sfumatura leggera, linee 2px, marcatori solo al passaggio del mouse, assi senza linee, etichette in `gray-500`.
- KPI: valore grande, variazione rispetto al periodo precedente (freccia + percentuale, verde se migliora), mini grafico del periodo.
