# AGENTS.md — TailTicket

## Compatibilità con osTicket

- **La struttura del database osTicket non deve mai essere modificata da TailTicket.** Il divieto vale per tutto il repository, inclusi applicazione, script, deploy e migrazioni.
- Non aggiungere, rimuovere, rinominare o alterare tabelle, colonne, tipi, indici, chiavi o vincoli. Non introdurre DDL o migrazioni per TailTicket.
- **TailTicket deve restare compatibile al 100% con osTicket**, permettendo alle due interfacce di lavorare sullo stesso database senza adattamenti dello schema. Se una funzionalità richiede modifiche strutturali, va riprogettata usando lo schema esistente.
- Ogni scrittura deve rispettare il modello dati e i contratti di osTicket ed essere verificata con il codice PHP originale e i test differenziali. Restano valide le regole di sicurezza e permessi del progetto.

Per il lavoro in `apps/web/`, seguire anche `apps/web/AGENTS.md`.
