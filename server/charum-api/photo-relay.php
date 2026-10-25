<?php
/* =====================================================================
   차름 휴대폰 사진 받기 중계 (photo-relay.php) — 2026-10-26 판 (여러 장)
   차름 앱(001 도형 찾기 · 002 내 그림 퍼즐)의 "📱 휴대폰에서 받기".
   - 전자칠판이 번호 4자리 + 공개 열쇠를 맡기면(open), 휴대폰(photo-send.html)이 QR로 열어
     사진을 잠가서(ECDH P-256 → HKDF "webapp-photo-relay|번호" → AES-GCM) 보낸다(send).
     서버는 잠긴 덩어리를 잠깐 맡아 둘 뿐 열어 볼 수 없다.
   - 2026-10-26: 번호 하나로 여러 장(max, 12장까지). 전자칠판이 한 장씩 가져가는 순간(poll) 서버에서 지운다.
     휴대폰이 "다 보냈습니다"(done)를 누르거나, 정한 장 수를 다 받거나, 전자칠판이 닫으면(close) 번호가 끝난다.
     max를 주지 않는 예전 화면은 지금처럼 한 장.
   - 시간: 한 장 번호 3분, 여러 장 번호 10분(사진을 보낼 때마다 5분 늘어남, 처음부터 30분은 넘지 않음).
   - 데이터베이스 없음. 같은 폴더의 photo-relay-data/ 에 저장(웹에서 직접 열리지 않게 막음).
   - 사진 다리(relay.php, 다른 선생님 앱)와는 따로 둔다(선생님 결정).
   - 점검: 주소창에서 ?ping → "ok": true
   ===================================================================== */

$ALLOW_ORIGINS = ['https://shim-sung-hyun.github.io', 'https://www.charum.org', 'https://charum.org'];
$MAX_CT        = 6 * 1024 * 1024;   // 잠긴 사진 하나(base64url) 최대 — 휴대폰은 긴 쪽 1600 JPEG(보통 0.3~1MB)
$MAX_BODY      = $MAX_CT + 4096;
$MAX_N         = 12;                // 번호 하나로 받는 최대 장 수
$TTL_ONE       = 180;               // 한 장 번호
$TTL_MANY      = 600;               // 여러 장 번호
$EXTEND        = 300;               // 보낼 때마다 늘림
$TTL_CAP       = 1800;              // 처음부터 이 시간은 넘지 않음
$OPEN_PER_HOUR = 120;               // 한 곳(IP)에서 한 시간에 여는 번호
$SEND_PER_HOUR = 400;               // 한 곳(IP)에서 한 시간에 보내는 사진(학교는 IP 하나를 여럿이 씀)
$MAX_ACTIVE    = 400;               // 동시에 열린 번호

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out($a) { http_response_code(200); echo json_encode($a, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit; }

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $ALLOW_ORIGINS, true)) {
  header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin');
  header('Access-Control-Allow-Methods: POST, OPTIONS'); header('Access-Control-Allow-Headers: Content-Type'); header('Access-Control-Max-Age: 600');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$DIR = __DIR__ . '/photo-relay-data';
if (!is_dir($DIR)) {
  @mkdir($DIR, 0700, true);
  @file_put_contents($DIR . '/.htaccess', "Require all denied\nDeny from all\n");
  @file_put_contents($DIR . '/index.html', '');
}
if ($_SERVER['REQUEST_METHOD'] === 'GET') out(['ok' => true, 'name' => 'charum photo relay', 'version' => '2026-10-26', 'multi' => $MAX_N, 'data_dir' => is_writable($DIR) ? 'ok' : 'cannot write']);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'method']);
if (!$origin || !in_array($origin, $ALLOW_ORIGINS, true)) out(['error' => 'origin']);

$raw = file_get_contents('php://input', false, null, 0, $MAX_BODY + 1);
if ($raw === false || strlen($raw) > $MAX_BODY) out(['error' => 'toolarge']);
$in = json_decode($raw, true);
if (!is_array($in)) out(['error' => 'bad']);
$a = (string)($in['a'] ?? '');
$now = time();

function b64ok($s, $max) { return is_string($s) && $s !== '' && strlen($s) <= $max && preg_match('/^[A-Za-z0-9_\-]+$/', $s); }
function rnd($n) { return rtrim(strtr(base64_encode(random_bytes($n)), '+/', '-_'), '='); }

/* 오래된 번호 치우기(가끔) */
if (mt_rand(1, 20) === 1) {
  foreach (glob($DIR . '/c_*.json') ?: [] as $f) {
    $s = json_decode((string)@file_get_contents($f), true);
    if (!is_array($s) || ($s['exp'] ?? 0) < $now - 120) { $c = substr(basename($f, '.json'), 2); @unlink($f); foreach (glob($DIR . '/i_' . $c . '_*') ?: [] as $g) @unlink($g); }
  }
  foreach (glob($DIR . '/r_*') ?: [] as $f) if (filemtime($f) < $now - 7200) @unlink($f);
}

/* 한 곳(IP)에서 한 시간 횟수 — IP는 해시로만 */
function rate($kind, $limit) {
  global $DIR, $now;
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  $f = $DIR . '/r_' . substr(hash('sha256', $ip . '|' . $kind . '|' . intdiv($now, 3600) . '|charum'), 0, 24);
  $n = (int)@file_get_contents($f);
  if ($n >= $limit) out(['error' => 'busy']);
  @file_put_contents($f, (string)($n + 1), LOCK_EX);
}

/* 번호 상태 파일을 잠그고 읽고 쓰기 */
function withCode($code, $fn) {
  global $DIR;
  if (!preg_match('/^\d{4}$/', (string)$code)) out(['error' => 'nocode']);
  $f = $DIR . '/c_' . $code . '.json';
  if (!is_file($f)) out(['error' => 'nocode']);
  $h = fopen($f, 'c+'); if (!$h) out(['error' => 'nocode']);
  flock($h, LOCK_EX);
  $s = json_decode(stream_get_contents($h), true);
  if (!is_array($s)) { flock($h, LOCK_UN); fclose($h); out(['error' => 'nocode']); }
  $save = function ($s) use ($h) { ftruncate($h, 0); rewind($h); fwrite($h, json_encode($s)); fflush($h); };
  try { $r = $fn($s, $save, $f); } finally { flock($h, LOCK_UN); fclose($h); }
  return $r;
}
function endCode($code) { global $DIR; @unlink($DIR . '/c_' . $code . '.json'); foreach (glob($DIR . '/i_' . $code . '_*') ?: [] as $g) @unlink($g); }

if ($a === 'open') {
  $pub = $in['pub'] ?? '';
  if (!b64ok($pub, 200)) out(['error' => 'bad']);
  $max = max(1, min($MAX_N, (int)($in['max'] ?? 1)));
  rate('open', $OPEN_PER_HOUR);
  if (count(glob($DIR . '/c_*.json') ?: []) >= $MAX_ACTIVE) out(['error' => 'busy']);
  $ttl = $max > 1 ? $TTL_MANY : $TTL_ONE;
  for ($i = 0; $i < 30; $i++) {
    $code = str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    $f = $DIR . '/c_' . $code . '.json';
    if (is_file($f)) { $o = json_decode((string)@file_get_contents($f), true); if (is_array($o) && ($o['exp'] ?? 0) >= $now) continue; endCode($code); }
    $h = @fopen($f, 'x'); if (!$h) continue;
    $sid = rnd(18);
    fwrite($h, json_encode(['pub' => $pub, 'sid' => hash('sha256', $sid), 'max' => $max, 'sent' => 0, 'got' => [], 'q' => [], 'done' => false, 't0' => $now, 'exp' => $now + $ttl]));
    fclose($h);
    out(['code' => $code, 'sid' => $sid, 'ttl' => $ttl, 'max' => $max]);
  }
  out(['error' => 'busy']);
}

if ($a === 'pub') {
  withCode($in['code'] ?? '', function ($s) use ($now) {
    if ($s['exp'] < $now || $s['done'] || $s['sent'] >= $s['max']) out(['error' => 'nocode']);
    out(['pub' => $s['pub'], 'left' => $s['max'] - $s['sent'], 'max' => $s['max'], 'ttl' => $s['exp'] - $now]);
  });
}

if ($a === 'send') {
  $epub = $in['epub'] ?? ''; $iv = $in['iv'] ?? ''; $ct = $in['ct'] ?? '';
  if (!b64ok($epub, 200) || !b64ok($iv, 40) || !is_string($ct)) out(['error' => 'bad']);
  if (strlen($ct) > $MAX_CT) out(['error' => 'toolarge']);
  if (!b64ok($ct, $MAX_CT)) out(['error' => 'bad']);
  rate('send', $SEND_PER_HOUR);
  $code = (string)($in['code'] ?? '');
  withCode($code, function ($s, $save) use ($now, $epub, $iv, $ct, $code, $EXTEND, $TTL_CAP) {
    global $DIR;
    if ($s['exp'] < $now || $s['done']) out(['error' => 'nocode']);
    if ($s['sent'] >= $s['max']) out(['error' => 'full']);
    $tk = rnd(12);
    $n = $s['sent'] + 1;
    if (@file_put_contents($DIR . '/i_' . $code . '_' . $n, json_encode(['epub' => $epub, 'iv' => $iv, 'ct' => $ct])) === false) out(['error' => 'busy']);
    $s['sent'] = $n; $s['q'][] = ['n' => $n, 'tk' => $tk];
    if ($s['max'] > 1) $s['exp'] = min($s['t0'] + $TTL_CAP, max($s['exp'], $now + $EXTEND));
    $save($s);
    out(['ok' => true, 'tk' => $tk, 'left' => $s['max'] - $s['sent'], 'ttl' => $s['exp'] - $now]);
  });
}

/* 전자칠판: 한 장씩 가져감(가져가는 순간 서버에서 지움) */
if ($a === 'poll') {
  $code = (string)($in['code'] ?? ''); $sid = (string)($in['sid'] ?? '');
  if (!preg_match('/^\d{4}$/', $code) || !is_file($DIR . '/c_' . $code . '.json')) out(['status' => 'gone']);
  withCode($code, function ($s, $save) use ($now, $sid, $code) {
    global $DIR;
    if (!hash_equals($s['sid'], hash('sha256', $sid))) out(['error' => 'nocode']);
    if (count($s['q'])) {
      $it = array_shift($s['q']);
      $p = $DIR . '/i_' . $code . '_' . $it['n'];
      $d = json_decode((string)@file_get_contents($p), true); @unlink($p);
      $s['got'][] = $it['tk']; $save($s);
      if (!is_array($d)) out(['status' => 'wait']);
      $end = !count($s['q']) && ($s['done'] || $s['sent'] >= $s['max']);
      out(['status' => 'done', 'epub' => $d['epub'], 'iv' => $d['iv'], 'ct' => $d['ct'], 'more' => count($s['q']), 'n' => count($s['got']), 'left' => $s['max'] - $s['sent'], 'end' => $end, 'ttl' => $s['exp'] - $now]);
    }
    if ($s['done'] || $s['sent'] >= $s['max']) out(['status' => 'end', 'n' => count($s['got'])]);
    if ($s['exp'] < $now) out(['status' => 'gone']);
    out(['status' => 'wait', 'ttl' => $s['exp'] - $now, 'n' => count($s['got'])]);
  });
}

/* 휴대폰: 보낸 사진이 전자칠판에 들어갔나 */
if ($a === 'check') {
  $code = (string)($in['code'] ?? ''); $tk = (string)($in['tk'] ?? '');
  if (!preg_match('/^\d{4}$/', $code) || !is_file($DIR . '/c_' . $code . '.json')) out(['status' => 'gone']);
  withCode($code, function ($s) use ($now, $tk) {
    if (in_array($tk, $s['got'], true)) out(['status' => 'done', 'n' => count($s['got'])]);
    if ($s['exp'] < $now) out(['status' => 'gone']);
    out(['status' => 'wait', 'n' => count($s['got'])]);
  });
}

/* 휴대폰: 다 보냈습니다 */
if ($a === 'done') {
  withCode($in['code'] ?? '', function ($s, $save) { $s['done'] = true; $save($s); out(['ok' => true]); });
}

/* 전자칠판: 닫기(남은 것 모두 지움) */
if ($a === 'close') {
  $code = (string)($in['code'] ?? ''); $sid = (string)($in['sid'] ?? '');
  if (preg_match('/^\d{4}$/', $code) && is_file($DIR . '/c_' . $code . '.json')) {
    $s = json_decode((string)@file_get_contents($DIR . '/c_' . $code . '.json'), true);
    if (is_array($s) && hash_equals($s['sid'], hash('sha256', $sid))) endCode($code);
  }
  out(['ok' => true]);
}

out(['error' => 'bad']);
