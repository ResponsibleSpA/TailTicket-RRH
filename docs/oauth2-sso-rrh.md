# OAuth2 Client (auth-oauth2.phar): login in TailTicket RRH

## Perimetro

Questo bridge abilita il **login agenti e clienti** di TailTicket attraverso il plugin PHP ufficiale **OAuth2 Client** di osTicket. Il PHP autentica con l'IdP e mantiene il callback OAuth2 originale; Next riceve solo un'attestazione firmata di una sessione osTicket già valida.

**Non include OAuth2 IMAP/SMTP:** autorizzazione, rinnovo dei token e fetch delle caselle restano nel PHP. Il mailer Next non supporta ancora SMTP XOAUTH2 e, se un account SMTP usa OAuth2, può fallire o usare un relay/sendmail alternativo. Verificare sempre le notifiche separatamente.

**Supporto attuale:** solo stack integrato con container PHP modificabile. La modalità attach **non è abilitata automaticamente**: richiede installare e configurare esplicitamente il bridge sul PHP osTicket esistente, documentare URL e segreti condivisi e verificare i cookie su eventuali domini differenti.

## Attivazione nello stack integrato

1. Usare le immagini **costruite da questo branch** (`compose.build.yaml`). Il file `deploy/osticket/tailticket-sso.php` viene copiato in `/classic/api/tailticket-sso.php`, **senza modificare `legacy/`**.
2. Installare `auth-oauth2.phar` in `include/plugins/` tramite il pannello classico di osTicket, abilitare il plugin e la relativa istanza.
3. Configurare nel PHP l'istanza con **Type = Authentication** (`auth_type=auth`) e **Target = Agents**, **End Users** oppure **Both** (`auth_target=agents/users/all`). Configurare il provider, gli attributi e il Redirect URI indicato dal plugin, che termina con `/api/auth/oauth2`: nello stack integrato `https://<host>/classic/api/auth/oauth2`.
4. Generare una nuova chiave **indipendente da `SECRET_SALT` e `APP_SESSION_SECRET`** con `openssl rand -hex 32`. Aggiungere `TAILTICKET_SSO_SECRET=<valore>` a `deploy/.env`, non committare il segreto e ricreare i container interessati (`osticket` e `tailticket`).
5. Impostare `TAILTICKET_URL` con l'**esatto URL pubblico** usato dagli utenti (HTTPS in produzione). Il bridge rifiuta il ritorno su HTTP, tranne localhost/loopback per test. Il browser deve poter raggiungere lo stesso host per `/classic/api/tailticket-sso.php` e `/api/auth/osticket/callback`.
6. Ricaricare `/agent/login` oppure `/login`. Il pulsante viene mostrato **solo** se il backend è realmente registrato dal PHP e il target è corrispondente. Segreto non configurato, PHP non raggiungibile, plugin non disponibile o istanza disabilitata => niente pulsante.

### Configurazione Docker

- Il servizio `osticket` riceve `TAILTICKET_SSO_SECRET` e `TAILTICKET_URL`; produce la prova firmata.
- Il servizio `tailticket` riceve **lo stesso** `TAILTICKET_SSO_SECRET` e `TAILTICKET_SSO_PHP_INTERNAL_URL=http://osticket/classic/api/tailticket-sso.php` per interrogare i backend disponibili attraverso una chiamata privata autenticata. `OST_PHP_URL=/classic` serve a costruire il link browser per avviare il login.
- In `deploy/.env.example` la chiave è **vuota**: disattivazione predefinita. `./tailticket init` non la genera automaticamente.

> **Nota:** i container `osticket` e `tailticket` devono essere ricostruiti per rendere disponibile lo script PHP. Non basta cambiare le variabili d'ambiente se si sta utilizzando un'immagine `tailticket-legacy` precedente che non lo contiene.

## Flusso (senza duplicare OAuth2)

1. La pagina Next richiede al PHP interno l'elenco dei backend **registrati e attivi** (`?action=providers`; header autenticato) e mostra il pulsante nel realm corretto.
2. `/api/auth/osticket/start?realm=staff|client` genera un nonce casuale, lo memorizza in uno store temporaneo in memoria e nel cookie `HttpOnly/SameSite=Lax`; filtra `next` con le stesse regole del login normale.
3. Reindirizza al PHP `/classic/api/tailticket-sso.php?action=start&realm=...&nonce=...`, che salva la transazione nella sessione PHP e invoca `oauth2.agent` o `oauth2.user` tramite il backend registrato.
4. Il plugin completa la sua **normale** autenticazione presso l'Identity Provider e la callback `/classic/api/auth/oauth2`: il PHP conserva il controllo di `state`, token, mapping, account e autorizzazioni native.
5. Il PHP ritorna al bridge `?action=finish`; il bridge usa **`StaffAuthenticationBackend::getUser()` / `UserAuthenticationBackend::getUser()`** e controlla la validità, l'identificatore di backend e i vincoli dell'account. Per un agente con 2FA PHP pendente, reindirizza al login classico per completare la sfida prima di proseguire. Se è obbligatoria la configurazione del 2FA, rifiuta l'handoff.
6. Solo dopo l'autenticazione completa, il PHP firma un payload minimo `{v, realm, uid, backend, nonce, iat, exp, jti}` con HMAC-SHA256, durata **60 secondi**, poi elimina la transazione PHP e torna alla callback Next.
7. Next confronta la prova con il nonce del browser, verifica firma e scadenza, impedisce il riuso dello `jti`, controlla ancora lo stato del provider e dell'account nel database e crea **`ostn_staff`** oppure **`ostn_client`** con la logica di sessione esistente. Destinazione `next` solo interna; gli obblighi di cambio password restano attivi.

### Garanzie e limiti

- Segreto separato per il bridge; niente access token, refresh token o client secret dell'IdP in Next o nel payload; nessuna scrittura diretta delle sessioni PHP.
- Il payload **non è una sessione persistente**: si consuma una sola volta e richiede la transazione generata nel browser da Next. Non permette di scegliere `uid` o il realm da parametri del callback.
- Gli store temporanei (nonce/replay) sono in memoria del **singolo processo Next**, analogamente ai contatori e alla 2FA attuali. **Non** usare più istanze Next senza prima sostituire questi store con un backend condiviso e atomico.
- La prova firmata viaggia in una query string di ritorno. Ha TTL corto, viene consumata e non contiene dati IdP, ma la URL può apparire nei log del proxy/browser: non registrare query complete di `/api/auth/osticket/callback`. Ogni risposta del bridge imposta `no-store` e `no-referrer`.
- Il logout da TailTicket revoca la sessione Next; **non effettua single logout** dell'Identity Provider o della sessione PHP. Un nuovo login può riuscire senza nuove credenziali se esiste ancora la sessione IdP.
- In caso di callback OAuth2 fallita lato PHP, potrebbe essere mostrato il portale classico; la transazione scade comunque entro cinque minuti. Un handoff non valido non apre mai una sessione Next.
- Il bridge richiede un **account client osTicket attivo**: non promette l'autoregistrazione di nuovi clienti senza una prova end-to-end del comportamento del PHAR/versione in uso.

## Collaudo necessario prima del merge/produzione

Eseguire in ambiente di test, con **PHAR effettivo installato**, provider OAuth2 configurato e account fittizi:

- [ ] `auth_target=agents` / `users` / `all` / `none` / istanza disabilitata: pulsanti corretti e nessun accesso a realm diverso.
- [ ] Agente attivo, associato al backend OAuth2: login dall'interfaccia Next → IdP → callback PHP → `/agent`, con refresh e permessi corretti.
- [ ] Cliente esistente/confermato/non bloccato: login Next → IdP → `/tickets`; accesso ospite e login locale invariati.
- [ ] 2FA agente PHP: non viene creata sessione Next prima del completamento della verifica; verificare anche `change_passwd` e configurazione 2FA obbligatoria.
- [ ] Assenza plugin, backend disabilitato durante il flusso, PHP indisponibile: errori leggibili, niente bypass.
- [ ] Nonce falso/scaduto, prova alterata/scaduta/riutilizzata, `uid` o realm modificati, open redirect `next`: rifiuto.
- [ ] Verificare `TAILTICKET_CLASSIC_PORTAL=redirect`: sia il callback originale `/classic/api/auth/oauth2` che il bridge arrivano sempre al PHP.
- [ ] Logout, timeout e blocco account: nessun accesso a dati protetti con sessione Next invalida.
- [ ] In parallelo: verifica separata dell'invio email con SMTP OAuth2 e dell'eventuale fallback (fuori perimetro di questa PR).

Test automatici unitari: `apps/web/test/unit/oauth2-bridge.test.ts` (`npm run test:unit` dalla directory `apps/web`). Il solo test unitario non sostituisce il collaudo PHP/IdP dal browser.
