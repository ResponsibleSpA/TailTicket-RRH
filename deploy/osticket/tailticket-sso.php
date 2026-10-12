<?php
/**
 * TailTicket SSO bridge (deployment-only, not part of upstream osTicket).
 *
 * The OAuth2 Client PHAR remains the identity provider integration. This
 * endpoint only starts a registered osTicket backend and attests an already
 * authenticated PHP session to TailTicket. It never handles OAuth tokens.
 *
 * IMPORTANT: do not use api.inc.php here: API_SESSION makes *new* PHP API
 * sessions stateless, breaking the OAuth state stored at the first redirect.
 */
require_once dirname(__DIR__) . '/main.inc.php';
require_once INCLUDE_DIR . 'class.staff.php';
require_once INCLUDE_DIR . 'class.usersession.php';

header('Cache-Control: no-store, private');
header('Pragma: no-cache');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');

const TT_SSO_SESSION = ':tailticket:sso';
const TT_SSO_MAX_AGE = 300;

function tt_sso_fail(int $status = 403): void {
    http_response_code($status);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Authentication not available';
    exit;
}

function tt_sso_b64url(string $bytes): string {
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function tt_sso_secret(): string {
    $secret = getenv('TAILTICKET_SSO_SECRET') ?: '';
    if (strlen($secret) < 32) {
        tt_sso_fail(404);
    }
    return $secret;
}

/** A backend is eligible only if the PHP plugin actually registered it. */
function tt_sso_backend(string $realm) {
    if ($realm === 'staff') {
        $backend = StaffAuthenticationBackend::getBackend('oauth2.agent');
        return $backend instanceof ExternalStaffAuthenticationBackend
            && $backend->getBkId() === 'oauth2.agent' ? $backend : null;
    }
    if ($realm === 'client') {
        $backend = UserAuthenticationBackend::getBackend('oauth2.user');
        return $backend instanceof ExternalUserAuthenticationBackend
            && $backend->getBkId() === 'oauth2.user' ? $backend : null;
    }
    return null;
}

/** Only the configured public TailTicket URL may receive the assertion. */
function tt_sso_callback_url(): string {
    $base = rtrim(getenv('TAILTICKET_URL') ?: '', '/');
    $parts = parse_url($base);
    if (!$parts || !isset($parts['scheme'], $parts['host'])
        || !in_array($parts['scheme'], ['http', 'https'], true)
        || ($parts['scheme'] === 'http'
            && !in_array($parts['host'], ['localhost', '127.0.0.1', '::1'], true))
        || isset($parts['user']) || isset($parts['pass'])
        || isset($parts['query']) || isset($parts['fragment'])) {
        tt_sso_fail(503);
    }
    return $base . '/api/auth/osticket/callback';
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    tt_sso_fail(405);
}

$secret = tt_sso_secret();
$action = $_GET['action'] ?? '';

if ($action === 'providers') {
    // This endpoint is consumed server-to-server by Next, not by browsers.
    $header = $_SERVER['HTTP_X_TAILTICKET_SSO_KEY'] ?? '';
    if (!is_string($header) || !hash_equals($secret, $header)) {
        tt_sso_fail();
    }
    $available = [];
    foreach (['staff', 'client'] as $realm) {
        $backend = tt_sso_backend($realm);
        if ($backend) {
            $available[$realm] = [
                'id' => $backend->getBkId(),
                'label' => (string) $backend->getServiceName(),
            ];
        }
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($available, JSON_THROW_ON_ERROR);
    exit;
}

if ($action === 'start') {
    $realm = $_GET['realm'] ?? '';
    $nonce = $_GET['nonce'] ?? '';
    if (!is_string($realm) || !is_string($nonce)
        || !in_array($realm, ['staff', 'client'], true)
        || !preg_match('/^[A-Za-z0-9_-]{32,64}$/D', $nonce)
        || !($backend = tt_sso_backend($realm))) {
        tt_sso_fail();
    }

    // Validate the configured return address *before* contacting the IdP.
    tt_sso_callback_url();
    $_SESSION[TT_SSO_SESSION] = [
        'realm' => $realm,
        'nonce' => $nonce,
        'started' => time(),
    ];
    $dest = ROOT_PATH . 'api/tailticket-sso.php?action=finish';
    if ($realm === 'staff') {
        $_SESSION['_staff']['auth']['dest'] = $dest;
    } else {
        $_SESSION['_client']['auth']['dest'] = $dest;
    }

    // Registers ext:bk:id and redirects to the IdP with the native OAuth state.
    $backend->triggerAuth();
    tt_sso_fail(); // Fail closed if the plugin did not redirect.
}

if ($action === 'finish') {
    $transaction = $_SESSION[TT_SSO_SESSION] ?? null;
    if (!is_array($transaction)
        || !isset($transaction['realm'], $transaction['nonce'], $transaction['started'])
        || !in_array($transaction['realm'], ['staff', 'client'], true)
        || !is_int($transaction['started'])
        || time() - $transaction['started'] > TT_SSO_MAX_AGE
        || $transaction['started'] > time() + 30
        || !is_string($transaction['nonce'])
        || !preg_match('/^[A-Za-z0-9_-]{32,64}$/D', $transaction['nonce'])) {
        unset($_SESSION[TT_SSO_SESSION]);
        tt_sso_fail();
    }
    $realm = $transaction['realm'];
    $backend = tt_sso_backend($realm);
    if (!$backend) {
        unset($_SESSION[TT_SSO_SESSION]);
        tt_sso_fail();
    }

    if ($realm === 'staff') {
        $user = StaffAuthenticationBackend::getUser();
        // Native PHP handles the 2FA challenge; never mint a Next session
        // while the second factor is still pending.
        if ($user && $user->is2FAPending()) {
            Http::redirect(ROOT_PATH . 'scp/login.php');
            exit;
        }
        if (!$user || !$user->getId() || !$user->isActive()
            || !$user->isValid() || $user->force2faConfig()
            || !StaffAuthenticationBackend::isBackendAllowed($user, $backend)
            || !str_starts_with((string) $user->getAuthKey(), 'oauth2.agent:')) {
            unset($_SESSION[TT_SSO_SESSION]);
            tt_sso_fail();
        }
    } else {
        $user = UserAuthenticationBackend::getUser();
        if (!$user || !$user->getId() || !$user->isValid()
            || !str_starts_with((string) $user->getAuthKey(), 'oauth2.user:')) {
            unset($_SESSION[TT_SSO_SESSION]);
            tt_sso_fail();
        }
        $account = $user->getAccount();
        if (!$account || !$account->isActive()) {
            unset($_SESSION[TT_SSO_SESSION]);
            tt_sso_fail();
        }
    }

    $uid = (int) $user->getId();
    if ($uid <= 0) {
        unset($_SESSION[TT_SSO_SESSION]);
        tt_sso_fail();
    }

    // Narrow, short-lived signed assertion, bound to Next's browser nonce.
    // The assertion contains no IdP access/refresh token, password or email.
    $now = time();
    $payload = [
        'v' => 1,
        'realm' => $realm,
        'uid' => $uid,
        'backend' => $backend->getBkId(),
        'nonce' => $transaction['nonce'],
        'iat' => $now,
        'exp' => $now + 60,
        'jti' => tt_sso_b64url(random_bytes(24)),
    ];
    $body = tt_sso_b64url(json_encode($payload, JSON_THROW_ON_ERROR));
    $signature = tt_sso_b64url(hash_hmac('sha256', $body, $secret, true));

    // Consume the PHP-side transaction too; the Next side also enforces
    // one-time redemption, expiry and nonce binding.
    unset($_SESSION[TT_SSO_SESSION]);
    if ($realm === 'staff') {
        unset($_SESSION['_staff']['auth']['dest']);
    } else {
        unset($_SESSION['_client']['auth']['dest']);
    }

    Http::redirect(tt_sso_callback_url() . '?proof=' . rawurlencode($body . '.' . $signature));
    exit;
}

tt_sso_fail(404);
