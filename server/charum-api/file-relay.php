<?php
/* =====================================================================
   차름 파일 보내기 (file-relay.php) — 2026-10-29 판
   누구나 www.charum.org/study/file.html 을 전자칠판에서 열면 QR·번호 6자리가 나오고,
   휴대폰(또는 다른 컴퓨터)에서 PPT·PDF·한글·사진 같은 파일을 그 전자칠판으로 보낸다. 영상은 받지 않음(보내는 화면에서 막음).
   - 잠금: 파일마다 보내는 쪽이 새 열쇠를 만들어 받는 쪽 공개 열쇠와 ECDH P-256 → HKDF(salt "charum-file|번호", info "v1") → AES-GCM.
     파일 이름·크기도 잠가서 보냄(head). 서버는 열어 볼 수 없다.
   - 1MB씩 나눠 올림(호스팅의 한 번 올리기 한도 때문). 전자칠판이 파일을 다 받아 풀면(ack) 그 순간 서버에서 지운다.
   - 한도(서버 전송량 때문에 불가피): 파일 하나 10MB, 한 곳(IP)에서 하루 FILES_PER_IP_DAY 개(보내는 화면은 기기마다 하루 20개로 안내·막음),
     이달 전송량 MONTH_GB 가 되면 새 전송을 멈춤.
   - 번호: 만든 뒤 15분, 파일이 오면 마지막 파일 뒤 10분까지, 길어도 1시간.
   - 데이터베이스 없음. 같은 폴더의 file-relay-data/ 에 저장(웹에서 직접 열리지 않게 막음).
   - 사진 다리(relay.php)·차름 앱 사진 받기(photo-relay.php)와는 따로 둔다.
   - 점검: 주소창에서 ?ping → "ok": true
   ===================================================================== */

$ALLOW_ORIGINS   = ['https://shim-sung-hyun.github.io', 'https://www.charum.org', 'https://charum.org'];
$MAX_FILE        = 10 * 1024 * 1024;   // 파일 하나(잠그기 전)
$CHUNK           = 1024 * 1024;        // 조각 하나(잠그기 전)
$MAX_CT          = 1450000;            // 조각 하나(잠근 뒤 base64url)
$FILES_PER_IP_DAY = 100;               // 한 곳(IP) 하루 파일 — 학교는 IP 하나를 여럿이 쓰므로 넉넉히(기기마다 20개는 보내는 화면이 막음)
$OPEN_PER_IP_DAY = 300;               // 한 곳(IP) 하루 번호
$MONTH_GB        = 30;                // 이달 전송량(올리기+받기) 안전판
$MAX_SLOTS       = 300;               // 한꺼번에 열린 번호
$MAX_STORE_MB    = 600;               // 서버에 잠깐 쌓여 있을 수 있는 조각 전체
$TTL_IDLE = 900; $TTL_ACTIVE = 600; $TTL_MAX = 3600;

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

$DIR = __DIR__ . '/file-relay-data';
if (!is_dir($DIR)) {
  @mkdir($DIR, 0700, true);
  @file_put_contents($DIR . '/.htaccess', "Require all denied\nDeny from all\n");
  @file_put_contents($DIR . '/index.html', '');
}
$now = time();
$day = gmdate('Y-m-d', $now + 32400);
$month = substr($day, 0, 7);

function rd($f, $def) { $j = @file_get_contents($f); $a = $j ? json_decode($j, true) : null; return is_array($a) ? $a : $def; }
function wr($f, $a) { file_put_contents($f, json_encode($a, JSON_UNESCAPED_SLASHES), LOCK_EX); }
function lockAll() { global $DIR; $fp = fopen($DIR . '/lock', 'c'); flock($fp, LOCK_EX); return $fp; }
function rnd($n) { return rtrim(strtr(base64_encode(random_bytes($n)), '+/', '-_'), '='); }
function b64ok($s, $max) { return is_string($s) && $s !== '' && strlen($s) <= $max && preg_match('/^[A-Za-z0-9_\-]+$/', $s); }
function usage() { global $DIR, $month; return rd($DIR . '/usage-' . $month . '.json', []) + ['bytes' => 0, 'files' => 0, 'opens' => 0, 'days' => []]; }
function addUsage($bytes, $files, $opens) {
  global $DIR, $month, $day; $u = usage();
  $u['bytes'] += $bytes; $u['files'] += $files; $u['opens'] += $opens;
  $d = $u['days'][$day] ?? ['b' => 0, 'f' => 0]; $d['b'] += $bytes; $d['f'] += $files; $u['days'][$day] = $d;
  wr($DIR . '/usage-' . $month . '.json', $u);
}
function monthFull() { global $MONTH_GB; return usage()['bytes'] >= $MONTH_GB * 1e9; }
function ipKey() { return substr(sha1(($_SERVER['REMOTE_ADDR'] ?? '') . '|charum-file'), 0, 16); }
function rate($kind, $limit, $peek = false) {
  global $DIR, $day; $f = $DIR . '/rate.json';
  $r = rd($f, ['day' => '', 'n' => []]); if ($r['day'] !== $day) $r = ['day' => $day, 'n' => []];
  $k = $kind . '|' . ipKey(); $n = $r['n'][$k] ?? 0;
  if ($peek) return max(0, $limit - $n);
  if ($n >= $limit) return false;
  $r['n'][$k] = $n + 1; wr($f, $r); return true;
}
function slotPath($c) { global $DIR; return $DIR . '/s_' . $c . '.json'; }
function partPath($c, $fid, $i) { global $DIR; return $DIR . '/p_' . $c . '_' . $fid . '_' . (int)$i; }
function slotEnd($s) { global $TTL_IDLE, $TTL_ACTIVE, $TTL_MAX; $e = $s['t0'] + $TTL_IDLE; if (!empty($s['ts'])) $e = max($e, $s['ts'] + $TTL_ACTIVE); return min($e, $s['t0'] + $TTL_MAX); }
function dropSlot($c) { global $DIR; foreach (glob($DIR . '/p_' . $c . '_*') ?: [] as $f) @unlink($f); @unlink(slotPath($c)); }
function sweep() {
  global $DIR, $now;
  foreach (glob($DIR . '/s_*.json') ?: [] as $f) { $c = substr(basename($f, '.json'), 2); $s = rd($f, null); if (!is_array($s) || slotEnd($s) < $now - 60) dropSlot($c); }
  foreach (glob($DIR . '/p_*') ?: [] as $f) if (@filemtime($f) < $now - 4000) @unlink($f);
  foreach (glob($DIR . '/usage-*.json') ?: [] as $f) if (@filemtime($f) < $now - 400 * 86400) @unlink($f);
}
function storeBytes() { global $DIR; $t = 0; foreach (glob($DIR . '/p_*') ?: [] as $f) $t += (int)@filesize($f); return $t; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $u = usage();
  out(['ok' => true, 'name' => 'charum file relay', 'version' => '2026-10-29', 'maxMB' => $MAX_FILE / 1048576, 'month_GB' => round($u['bytes'] / 1e9, 2), 'month_cap_GB' => $MONTH_GB, 'files' => $u['files'], 'data_dir' => is_writable($DIR) ? 'ok' : 'cannot write']);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'method']);
if (!$origin || !in_array($origin, $ALLOW_ORIGINS, true)) out(['error' => 'origin']);
$raw = file_get_contents('php://input', false, null, 0, $MAX_CT + 8192);
if ($raw === false || strlen($raw) > $MAX_CT + 4096) out(['error' => 'toolarge']);
$in = json_decode($raw, true);
if (!is_array($in)) out(['error' => 'bad']);
$a = (string)($in['a'] ?? '');
$code = (string)($in['code'] ?? '');
if (mt_rand(1, 25) === 1) { $L = lockAll(); sweep(); flock($L, LOCK_UN); }

/* 받는 쪽(전자칠판): 번호 열기 */
if ($a === 'open') {
  $pub = $in['pub'] ?? '';
  if (!b64ok($pub, 200)) out(['error' => 'bad']);
  if (monthFull()) out(['error' => 'month']);
  $L = lockAll();
  if (!rate('open', $OPEN_PER_IP_DAY)) out(['error' => 'busy']);
  if (count(glob($DIR . '/s_*.json') ?: []) >= $MAX_SLOTS) { sweep(); if (count(glob($DIR . '/s_*.json') ?: []) >= $MAX_SLOTS) out(['error' => 'busy']); }
  for ($i = 0; $i < 40; $i++) {
    $c = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    if (is_file(slotPath($c))) continue;
    $sid = rnd(18);
    wr(slotPath($c), ['pub' => $pub, 'sid' => hash('sha256', $sid), 't0' => $now, 'ts' => 0, 'q' => [], 'f' => [], 'done' => false]);
    addUsage(0, 0, 1);
    out(['code' => $c, 'sid' => $sid, 'ttl' => $TTL_IDLE, 'maxMB' => $MAX_FILE / 1048576]);
  }
  out(['error' => 'busy']);
}

if (!preg_match('/^\d{6}$/', $code)) out(['error' => 'nocode']);
$L = lockAll();
$s = rd(slotPath($code), null);
if (!is_array($s) || slotEnd($s) < $now) { if (is_array($s)) dropSlot($code); if ($a === 'poll' || $a === 'check') out(['status' => 'gone']); out(['error' => 'nocode']); }
$isBoard = isset($in['sid']) && hash_equals($s['sid'], hash('sha256', (string)$in['sid']));

/* 보내는 쪽: 공개 열쇠와 남은 횟수 */
if ($a === 'pub') {
  if ($s['done']) out(['error' => 'nocode']);
  out(['pub' => $s['pub'], 'ttl' => slotEnd($s) - $now, 'maxMB' => $MAX_FILE / 1048576, 'ipLeft' => rate('file', $FILES_PER_IP_DAY, true), 'month' => monthFull() ? 'full' : 'ok']);
}

/* 보내는 쪽: 파일 하나 시작 */
if ($a === 'begin') {
  $n = (int)($in['n'] ?? 0); $size = (int)($in['size'] ?? 0);
  $epub = $in['epub'] ?? ''; $hiv = $in['hiv'] ?? ''; $hct = $in['hct'] ?? '';
  if ($s['done']) out(['error' => 'nocode']);
  if (!b64ok($epub, 200) || !b64ok($hiv, 40) || !b64ok($hct, 2000)) out(['error' => 'bad']);
  if ($size < 1 || $size > $MAX_FILE) out(['error' => 'toolarge']);
  if ($n !== (int)ceil($size / $CHUNK)) out(['error' => 'bad']);
  if (monthFull()) out(['error' => 'month']);
  if (count($s['f']) >= 60) out(['error' => 'full']);
  if (storeBytes() > $MAX_STORE_MB * 1048576) out(['error' => 'busy']);
  if (!rate('file', $FILES_PER_IP_DAY)) out(['error' => 'day']);
  $fid = rnd(6);
  $s['f'][$fid] = ['n' => $n, 'size' => $size, 'got' => 0, 'out' => 0, 'ready' => false, 'given' => false, 'epub' => $epub, 'hiv' => $hiv, 'hct' => $hct, 't' => $now];
  $s['ts'] = $now; wr(slotPath($code), $s);
  addUsage(0, 1, 0);
  out(['fid' => $fid, 'ttl' => slotEnd($s) - $now]);
}

/* 보내는 쪽: 조각 하나 */
if ($a === 'part') {
  $fid = (string)($in['fid'] ?? ''); $i = (int)($in['i'] ?? -1); $iv = $in['iv'] ?? ''; $ct = $in['ct'] ?? '';
  $F = $s['f'][$fid] ?? null;
  if (!$F) out(['error' => 'nofile']);
  if ($i < 0 || $i >= $F['n'] || !b64ok($iv, 40) || !b64ok($ct, $MAX_CT)) out(['error' => 'bad']);
  $p = partPath($code, $fid, $i);
  if (!is_file($p)) { file_put_contents($p, $iv . '.' . $ct); $F['got']++; addUsage(strlen($ct), 0, 0); }
  if ($F['got'] >= $F['n'] && !$F['ready']) { $F['ready'] = true; $s['q'][] = $fid; }
  $s['f'][$fid] = $F; $s['ts'] = $now; wr(slotPath($code), $s);
  out(['ok' => true, 'ready' => $F['ready']]);
}

/* 보내는 쪽: 전자칠판이 받았나 */
if ($a === 'check') {
  $fid = (string)($in['fid'] ?? ''); $F = $s['f'][$fid] ?? null;
  out(['status' => $F && $F['given'] ? 'done' : 'wait', 'n' => count(array_filter($s['f'], function ($x) { return $x['given']; }))]);
}

/* 보내는 쪽: 다 보냈습니다 */
if ($a === 'done') { $s['done'] = true; wr(slotPath($code), $s); out(['ok' => true]); }

if (!$isBoard) out(['error' => 'nocode']);

/* 받는 쪽: 다 올라온 파일이 있나 */
if ($a === 'poll') {
  foreach ($s['q'] as $fid) { $F = $s['f'][$fid] ?? null; if ($F && $F['ready'] && !$F['given'])
    out(['status' => 'file', 'fid' => $fid, 'n' => $F['n'], 'size' => $F['size'], 'epub' => $F['epub'], 'hiv' => $F['hiv'], 'hct' => $F['hct'], 'ttl' => slotEnd($s) - $now]); }
  $busy = count(array_filter($s['f'], function ($x) { return !$x['ready']; }));
  if ($s['done'] && !$busy) out(['status' => 'end']);
  out(['status' => 'wait', 'up' => $busy, 'ttl' => slotEnd($s) - $now]);
}

/* 받는 쪽: 조각 가져가기 → 다 풀면 ack(그 순간 모든 조각을 서버에서 지움) */
if ($a === 'get') {
  $fid = (string)($in['fid'] ?? ''); $i = (int)($in['i'] ?? -1); $F = $s['f'][$fid] ?? null;
  if (!$F || !$F['ready'] || $F['given'] || $i < 0 || $i >= $F['n']) out(['error' => 'nofile']);
  $d = @file_get_contents(partPath($code, $fid, $i));
  if ($d === false) out(['error' => 'nofile']);
  [$iv, $ct] = explode('.', $d, 2);
  addUsage(strlen($ct), 0, 0);
  $s['ts'] = $now; wr(slotPath($code), $s);
  out(['iv' => $iv, 'ct' => $ct]);
}
if ($a === 'ack') {
  $fid = (string)($in['fid'] ?? ''); $F = $s['f'][$fid] ?? null;
  if (!$F) out(['error' => 'nofile']);
  for ($i = 0; $i < $F['n']; $i++) @unlink(partPath($code, $fid, $i));
  $F['given'] = true; $F['epub'] = ''; $F['hct'] = '';
  $s['f'][$fid] = $F; $s['q'] = array_values(array_diff($s['q'], [$fid])); $s['ts'] = $now; wr(slotPath($code), $s);
  out(['ok' => true]);
}

/* 받는 쪽: 닫기 */
if ($a === 'close') { dropSlot($code); out(['ok' => true]); }

out(['error' => 'bad']);
