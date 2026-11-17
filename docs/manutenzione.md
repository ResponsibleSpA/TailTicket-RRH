# Manutenzione nel portale

TailTicket utilizza i normali reparti, agenti, ruoli, team e argomenti di osTicket. La visibilità dei
ticket dipende esclusivamente da questa configurazione: non esiste un vincolo aggiuntivo tra IT e
Manutenzione. Accessi estesi, assegnazioni e condivisioni mantengono il comportamento di osTicket.

## Scelta dell'area nel portale

`TAILTICKET_PORTAL_AREAS` raggruppa gli argomenti pubblici in base al reparto di destinazione:

```dotenv
TAILTICKET_PORTAL_AREAS='[{"id":"it","name":"IT/Sanitari","departmentIds":[1,4]},{"id":"maintenance","name":"Manutenzione","departmentIds":[6]}]'
```

Gli ID nell'esempio corrispondono all'installazione RRH configurata il 17 novembre 2026. In altre
installazioni usare gli ID dei rispettivi reparti. La variabile è facoltativa: senza configurazione
rimane il normale elenco degli argomenti. È letta a runtime e richiede il riavvio del container se
modificata nel deployment.

La scelta appare in `/open`. Dopo l'area, il richiedente sceglie uno degli argomenti associati; con un
solo argomento viene selezionato automaticamente. Il ticket viene creato con il normale `topicId`:
il reparto, i moduli, le priorità e le assegnazioni restano quelli configurati sull'argomento in
osTicket. Per gli argomenti senza reparto esplicito vale il reparto predefinito del sistema.

Cambiare il reparto di un argomento in amministrazione lo sposta automaticamente nell'area
corrispondente. I reparti aggiunti e non elencati nella variabile restano disponibili sotto
“Altri servizi”. Gli argomenti privati o disattivati non vengono aggiunti al portale.

## Configurazione iniziale RRH

- Reparto **Manutenzione**, attivo, senza accessi estesi agli altri reparti.
- Argomento pubblico **Manutenzione**, destinato al nuovo reparto, con il modulo ticket standard e i moduli
  esistenti per posizione e contatto. Il richiedente compila titolo, descrizione con allegati,
  piano/stanza/reparto e contatto.
- Ruolo **Tecnico Manutenzione**, modificabile in **Amministrazione → Ruoli**.
- Agente locale **manutenzione**, non amministratore, senza accessi estesi né appartenenza a team.
- Coda personale **Manutenzione**: ticket aperti del reparto, iniziale per il nuovo agente.
- Password temporanea con cambio obbligatorio al primo accesso.

osTicket richiede un indirizzo email anche per gli agenti locali: l'account generico usa il segnaposto
non recapitabile `manutenzione@tailticket.invalid`. Non sono stati inviati messaggi di benvenuto;
gli avvisi del nuovo reparto sono inizialmente disabilitati. Prima di attivare notifiche o recupero
password via email occorre indicare una casella reale.

Per cambiare la visibilità, modificare il reparto principale e gli accessi estesi dell'agente in
**Amministrazione → Agenti**, oppure i membri del reparto e dei team. Si applicano anche i normali
permessi globali, come la ricerca su tutti i ticket. Le autorizzazioni degli agenti esistenti non
sono state modificate dalla configurazione della Manutenzione.

Non vengono aggiunte tabelle, colonne, indici o migrazioni. Reparto, ruolo, agente, argomento e coda
sono stati creati con i modelli PHP originali di osTicket.
