# OAuth2 Client (auth-oauth2.phar): login in TailTicket RRH

## Perimetro

Questo bridge abilita il **login agenti e clienti** di TailTicket attraverso il plugin PHP ufficiale **OAuth2 Client** di osTicket. Il PHP autentica con l'IdP e mantiene il callback OAuth2 originale; Next riceve solo un'attestazione firmata di una sessione osTicket già valida.

**Non include OAuth2 IMAP/SMTP:** autorizzazione, rinnovo dei token e fetch delle caselle restano nel PHP. Il mailer Next non supporta ancora SMTP XOAUTH2 e, se un account SMTP usa OAuth2, può fallire o usare un relay/sendmail alternativo. Verificare sempre le notifiche separatamente.

**Modalità supportate:** stack integrato e attach a un PHP osTicket esistente. In attach si aggiunge il solo file `api/tailticket-sso.php` e si configurano URL e segreto nel server PHP; il core, il plugin OAuth2 e il suo callback restano quelli dell'installazione originale. L'attivazione è esplicita e richiede il collaudo con il proprio provider.

Il bridge riconosce gli identificativi nativi delle istanze del plugin, per esempio `oauth2.agent.p3i2` e `oauth2.user.p3i2`, e mantiene quell'identificativo nella transazione, nella prova firmata e nei controlli al ritorno. L'interfaccia propone un solo provider per realm: deve esserci **una sola istanza Authentication abilitata per quel target**. Se più istanze Authentication sono eleggibili per lo stesso realm, il bridge non ne sceglie una implicitamente e non mostra il pulsante; le istanze Authorization delle caselle email non partecipano alla selezione.

## Attivazione nello stack integrato

1. Usare le immagini **costruite da questo branch** (`compose.build.yaml`). Il file `deploy/osticket/tailticket-sso.php` viene copiato in `/classic/api/tailticket-sso.php`, **senza modificare `legacy/`**.
2. Installare `auth-oauth2.phar` in `include/plugins/` tramite il pannello classico di osTicket, abilitare il plugin e la relativa istanza.
3. Configurare nel PHP l'istanza con **Type = Authentication** (`auth_type=auth`) e **Target = Agents**, **End Users** oppure **Both** (`auth_target=agents/users/all`). Configurare il provider, gli attributi e il Redirect URI indicato dal plugin, che termina con `/api/auth/oauth2`: nello stack integrato `https://<host>/classic/api/auth/oauth2`.
4. Generare una nuova chiave **indipendente da `SECRET_SALT` e `APP_SESSION_SECRET`** con `openssl rand -hex 32`. Aggiungere `TAILTICKET_SSO_SECRET=<valore>` a `deploy/.env`, non committare il segreto e ricreare i container interessati (`osticket` e `tailticket`).
5. Impostare `TAILTICKET_URL` con l'**esatto URL pubblico** usato dagli utenti (HTTPS in produzione). Il bridge rifiuta il ritorno su HTTP, tranne localhost/loopback per test. Il browser deve poter raggiungere sia il PHP sia TailTicket; nello stack integrato condividono lo stesso host.
6. Ricaricare `/agent/login` oppure `/login`. Il pulsante viene mostrato **solo** se il backend è realmente registrato dal PHP e il target è corrispondente. Segreto non configurato, PHP non raggiungibile, plugin non disponibile o istanza disabilitata => niente pulsante.

### Configurazione Docker

- Il servizio `osticket` riceve `TAILTICKET_SSO_SECRET` e `TAILTICKET_URL`; produce la prova firmata.
- Il servizio `tailticket` riceve **lo stesso** `TAILTICKET_SSO_SECRET` e `TAILTICKET_SSO_PHP_INTERNAL_URL=http://osticket/classic/api/tailticket-sso.php` per interrogare i backend disponibili attraverso una chiamata privata autenticata. `OST_PHP_URL=/classic` serve a costruire il link browser per avviare il login.
- In `deploy/.env.example` la chiave è **vuota**: disattivazione predefinita. `./tailticket init` non la genera automaticamente.

> **Nota:** i container `osticket` e `tailticket` devono essere ricostruiti per rendere disponibile lo script PHP. Non basta cambiare le variabili d'ambiente se si sta utilizzando un'immagine `tailticket-legacy` precedente che non lo contiene.

## Attivazione in modalità attach

Questa procedura mantiene **`/var/www/html/osTicket/osticket-custom` come PHP originale**, con il suo web server, cron, database e `auth-oauth2.phar`. Non avvia un container `osticket` e non copia `legacy/` sopra l'installazione esistente. Gli esempi servono TailTicket alla radice di `https://ticket.responsible.hospital` e il pannello originale su `https://ticket.responsible.hospital:8443`; adattare host e percorsi. Il login SSO sotto un base path come `/app` richiede un collaudo dedicato e non è coperto da questa procedura.

1. Preparare TailTicket in attach come descritto in [deploy/README.md](../deploy/README.md#collegare-un-osticket-esistente-modalità-attach), usando un'immagine Next **costruita da questo branch**. `TAILTICKET_MODE=readonly` resta il default: attivare SSO non abilita le scritture di TailTicket. Il PHP esegue le normali scritture di autenticazione e sessione osTicket.
2. Dalla radice del repository, aggiungere l'endpoint separato alla directory `api/` del PHP esistente (adattare il gruppo del processo PHP):

   ```bash
   sudo install -o root -g www-data -m 0640 deploy/osticket/tailticket-sso.php \
     /var/www/html/osTicket/osticket-custom/api/tailticket-sso.php
   ```

   Non servono modifiche a `main.inc.php`, `ost-config.php`, `.htaccess` o al PHAR. Il bridge carica il `main.inc.php` dell'installazione che lo ospita e usa le sue sessioni e i suoi backend. Per aggiornare il bridge si aggiorna solo questo file aggiuntivo.
3. Generare un segreto dedicato con `openssl rand -hex 32`. In `deploy/.env` impostare:

   ```dotenv
   TAILTICKET_URL=https://ticket.responsible.hospital
   TAILTICKET_CLASSIC_URL=https://ticket.responsible.hospital:8443
   TAILTICKET_SSO_SECRET=<segreto-generato>
   TAILTICKET_SSO_PHP_INTERNAL_URL=https://ticket.responsible.hospital:8443/api/tailticket-sso.php
   ```

   `TAILTICKET_CLASSIC_URL` è la **base pubblica del PHP** usata dal browser (senza `/scp/` o `/api/`). `TAILTICKET_SSO_PHP_INTERNAL_URL` è l'**URL completo del bridge** usato dal server Next: può avere host o porta diversi solo se raggiunge la stessa installazione PHP. Deve essere raggiungibile dal container e rispondere direttamente, senza redirect. Usare HTTPS con certificato attendibile da Node; HTTP è adatto solo a una rete privata fidata. La discovery non segue redirect, per non inoltrare il segreto ad altre destinazioni.
4. Nel **server che esegue il PHP**, rendere disponibili a `getenv()` lo stesso `TAILTICKET_SSO_SECRET` e l'esatto `TAILTICKET_URL` pubblico di Next. Il `.env` di Docker non viene letto dall'Apache/PHP esterno.

   Con Apache e mod_php, partire da [apache-sso.conf.example](../deploy/attach/apache-sso.conf.example): salvare la copia configurata fuori dalla document root, accessibile solo a root, sostituire il segreto vuoto e includerla nel VirtualHost HTTPS del PHP originale. Il frammento limita le due variabili al solo endpoint aggiuntivo. Verificare con `apachectl configtest` e ricaricare Apache. Riferimento: [Apache SetEnv](https://httpd.apache.org/docs/2.4/mod/mod_env.html#setenv).

   Con PHP-FPM, configurare esplicitamente nel pool dell'osTicket esistente:

   ```ini
   env[TAILTICKET_SSO_SECRET] = "<stesso-segreto-generato>"
   env[TAILTICKET_URL] = "https://ticket.responsible.hospital"
   ```

   Conservare il file fuori dalla document root con permessi riservati, verificare la configurazione e ricaricare FPM. Non occorre disabilitare `clear_env`: FPM ammette le variabili dichiarate nel pool. Riferimenti: [configurazione FPM](https://www.php.net/manual/en/install.fpm.configuration.php), [getenv](https://www.php.net/manual/en/function.getenv.php).
5. Nel plugin PHP **esistente**, verificare Type = Authentication e il target agenti/clienti. Per Google mantenere il Redirect URI già configurato nel plugin e in Google Cloud. Se punta all'origine del PHP, nell'esempio è `https://ticket.responsible.hospital:8443/api/auth/oauth2`. Se il callback originale è `https://ticket.responsible.hospital/api/auth/oauth2` sulla porta 443, mantenere quel valore e instradare **solo quel percorso** dal proxy principale al PHP originale su 8443: [esempio Apache](../deploy/attach/apache-oauth-callback.conf.example). Il bridge salva una destinazione di ritorno assoluta sull'origine PHP da cui è partito, così anche il 2FA resta sul pannello classico. La callback Next `/api/auth/osticket/callback` riceve soltanto l'attestazione PHP e non va registrata come Redirect URI Google.
6. Il reverse proxy deve lasciare arrivare al PHP originale **`/api/tailticket-sso.php`**, **`/api/auth/oauth2`** e il login classico necessario al 2FA. Il Caddy attach serve solo Next; se PHP usa un altro host o porta, si mantiene il suo VirtualHost. Se si usa un proxy già esistente sulla stessa origine, queste rotte devono arrivare al PHP, mentre `/api/auth/osticket/*` deve arrivare a Next. Non reindirizzare il callback OAuth2 verso il portale Next.
7. Ricreare il servizio Next con la configurazione attach e verificare il pulsante su `/agent/login` e `/login`, poi eseguire il collaudo sotto. `./tailticket up` applica il normale avvio protetto e il doctor. Con un proxy esistente gestito separatamente, avviare solo il servizio `tailticket` con i file Compose previsti dal proprio deploy.

### Cookie, verifica e disattivazione in attach

Il browser conserva il cookie PHP sull'host del PHP e `ostn_oauth2_pending` sull'host di TailTicket; il ritorno avviene tramite una navigazione GET, compatibile con `SameSite=Lax`. Non occorre condividere `OSTSESSID` con Next, impostare un `Domain` comune o aggiungere CORS. Anche con host diversi, le rotte `start` e `callback` di Next devono essere raggiunte sulla **stessa origine pubblica**, perché il verificatore è nel cookie HttpOnly emesso da Next. Evitare cookie PHP e Next con nomi uguali, anche quando si usano porte diverse dello stesso host.

Se il pulsante manca, controllare che il container abbia le due variabili SSO, che il PHP riceva lo stesso segreto e che l'URL interno restituisca JSON con l'header autenticato `X-TailTicket-SSO-Key`. Un `301/302`, una pagina HTML, un certificato non attendibile o un backend non registrato rendono SSO indisponibile. Non stampare il segreto nei log né disabilitare la verifica TLS. Senza l'header corretto, `?action=providers` deve rifiutare la richiesta; il browser non usa questa discovery autenticata.

Per disattivare il login esterno, svuotare `TAILTICKET_SSO_SECRET` in `deploy/.env` e ricreare Next. Per rimuovere il bridge, eliminare il solo file aggiuntivo `api/tailticket-sso.php` e la sua configurazione nel server PHP. Il plugin, le credenziali Google, il callback originale e il login classico restano disponibili.

## Flusso (senza duplicare OAuth2)

1. La pagina Next richiede al PHP interno l'elenco dei backend **registrati e attivi** (`?action=providers`; header autenticato) e mostra il pulsante nel realm corretto.
2. `/api/auth/osticket/start?realm=staff|client` genera un nonce casuale, lo memorizza in uno store temporaneo in memoria, genera un **verificatore casuale indipendente** conservato nel cookie `HttpOnly/SameSite=Lax` (mai inserito negli URL o nell'attestazione PHP); filtra `next` con le stesse regole del login normale.
3. Reindirizza al PHP `/classic/api/tailticket-sso.php?action=start&realm=...&nonce=...`, che salva la transazione nella sessione PHP e invoca `oauth2.agent` o `oauth2.user` tramite il backend registrato.
4. Il plugin completa la sua **normale** autenticazione presso l'Identity Provider e la callback `/classic/api/auth/oauth2`: il PHP conserva il controllo di `state`, token, mapping, account e autorizzazioni native.
5. Il PHP ritorna al bridge `?action=finish`; il bridge usa **`StaffAuthenticationBackend::getUser()` / `UserAuthenticationBackend::getUser()`** e controlla la validità, l'identificatore di backend e i vincoli dell'account. Per un agente con 2FA PHP pendente, reindirizza al login classico per completare la sfida prima di proseguire. Se è obbligatoria la configurazione del 2FA, rifiuta l'handoff.
6. Solo dopo l'autenticazione completa, il PHP firma un payload minimo `{v, realm, uid, backend, nonce, iat, exp, jti}` con HMAC-SHA256, durata **60 secondi**, poi elimina la transazione PHP e torna alla callback Next.
7. Next confronta la prova con il nonce del browser **e con il verificatore privato nel cookie**, verifica firma e scadenza, impedisce il riuso dello `jti`, controlla ancora lo stato della stessa istanza del provider e dell'account nel database e crea **`ostn_staff`** oppure **`ostn_client`** con la logica di sessione esistente. Destinazione `next` solo interna, con una `Location` relativa che conserva l'origine pubblica anche dietro il reverse proxy; gli obblighi di cambio password restano attivi.

### Garanzie e limiti

- Segreto separato per il bridge; niente access token, refresh token o client secret dell'IdP in Next o nel payload; nessuna scrittura diretta delle sessioni PHP.
- Il payload **non è una sessione persistente**: si consuma una sola volta e richiede la transazione generata nel browser da Next e il relativo **verificatore privato del cookie**, non presente nell'URL. Non permette di scegliere `uid` o il realm da parametri del callback.
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
- [ ] In attach: PHP `osticket-custom` originale, discovery dal container, host/porte differenti, ritorno sulla stessa origine Next e cookie pendente presente; callback Google e login classico ancora funzionanti. Ripetere con segreto mancante/diverso e con redirect sulla discovery: nessuna sessione Next.
- [ ] Logout, timeout e blocco account: nessun accesso a dati protetti con sessione Next invalida.
- [ ] In parallelo: verifica separata dell'invio email con SMTP OAuth2 e dell'eventuale fallback (fuori perimetro di questa PR).

Test automatici: `apps/web/test/unit/oauth2-bridge.test.ts` verifica attestazioni e transazioni; `apps/web/test/unit/oauth2-provider.test.ts` verifica la discovery con server HTTP locali, inclusi identificativi di istanza, errori e redirect verso un'altra origine; `apps/web/test/unit/oauth2-callback.test.ts` verifica il ritorno sull'origine pubblica dietro proxy e il rifiuto di un callback invalido (`npm run test:unit` dalla directory `apps/web`). Questi test non sostituiscono il collaudo PHP/IdP dal browser.
