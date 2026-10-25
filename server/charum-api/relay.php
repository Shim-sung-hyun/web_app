<?php
/* =====================================================================
   차름 사진 다리 (relay.php) — 2026-10-25 판
   연수에서 선생님들이 만든 앱이 "휴대폰 사진 → 전자칠판·태블릿"을 받을 수 있게 중계한다.
   - 서버 맨 위 charum-api/ 폴더에 둔다. 기록은 같은 곳 relay-data/ (스스로 만들고 웹에서 막음).
   - 차름 앱이 쓰는 photo-relay.php 와 따로 둔다(여기서 문제가 생겨도 차름 앱은 그대로).
   - 사진은 휴대폰에서 잠가(ECDH P-256 → HKDF → AES-GCM) 오므로 서버는 열어 볼 수 없다.
     받는 화면이 가져가는 순간 지우고, 안 가져가도 몇 분 뒤 지운다.
   - "연수 코드"(예: 2026-11-seoul)가 켜져 있어야 번호를 만든다. 코드는 relay-admin.php(관리자 로그인)에서 켜고 끈다.
     코드는 선생님 앱 소스에 보이므로 비밀번호가 아니라, 켜고 끄고 한도를 거는 단위다.
   - 한 번 찍으면(번호 하나) 여러 장을 차례로 보낼 수 있다(번호마다 30장까지).

   받는 쪽(선생님 앱, charum-relay.js)
     {"a":"open","pc":"연수코드","pub":"…"}            → {"code":"123456","sid":"…","ttl":180,"max":30,"mb":4}
     {"a":"poll","code":"123456","sid":"…"}            → {"status":"wait"} | {"status":"item","epub","iv","ct","more":0} | {"status":"end"} | {"status":"gone"}
     {"a":"close","code":"123456","sid":"…"}
   보내는 쪽(휴대폰, relay/send.html)
     {"a":"pub","code":"123456"}                       → {"pub":"…","left":30,"mb":4,"max":1600}
     {"a":"send","code":"123456","epub","iv","ct"}     → {"ok":true,"left":29}
     {"a":"done","code":"123456"}                      → 다 보냈다고 알림
   점검: GET ?ping
   오류도 200 + {"error":…} (호스팅 오류 페이지가 가로채지 않게).
   ===================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
/* 누구의 앱이든 부를 수 있게(쿠키를 쓰지 않으므로 * 로 충분). 막는 것은 연수 코드와 한도로 한다. */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') exit;
function out($a) { echo json_encode($a, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit; }

require __DIR__ . '/relay-lib.php';
$now = time();

if (isset($_GET['ping'])) {
  $s = relay_settings();
  $u = relay_usage(gmdate('Y-m', $now + 32400));
  out(['ok' => true, 'version' => RELAY_VERSION, 'codes_on' => count(array_filter($s['codes'], 'relay_code_live')),
       'month_gb' => round($u['bytes'] / 1e9, 2), 'cap_gb' => $s['monthGB']]);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(['error' => 'post']);

$raw = file_get_contents('php://input');
if (strlen($raw) > 8 * 1024 * 1024) out(['error' => 'big']);
$in = json_decode((string)$raw, true);
if (!is_array($in)) out(['error' => 'json']);
$a = (string)($in['a'] ?? '');
$ip = substr(sha1('ip|' . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);
$origin = substr(preg_replace('/[^\x21-\x7e]/', '', (string)($_SERVER['HTTP_ORIGIN'] ?? '')), 0, 80);

$lock = relay_lock();
relay_sweep($now);
$S = relay_settings();
$month = gmdate('Y-m', $now + 32400);   /* 한국 시간 기준 달·날 */
$day = gmdate('Y-m-d', $now + 32400);

/* ---------- 받는 쪽: 번호 만들기 ---------- */
if ($a === 'open') {
  $pc = strtolower((string)($in['pc'] ?? ''));
  $c = $S['codes'][$pc] ?? null;
  if (!relay_code_ok($pc) || !$c) out(['error' => 'pc']);
  if (!relay_code_live($c)) out(['error' => 'pc_off']);
  $pub = (string)($in['pub'] ?? '');
  if (!preg_match('/^[A-Za-z0-9_-]{80,100}$/', $pub)) out(['error' => 'pub']);
  $U = relay_usage($month);
  if ($U['bytes'] >= $S['monthGB'] * 1e9) out(['error' => 'month']);
  if ((($U['codes'][$pc]['days'][$day]['o']) ?? 0) >= $c['day']) out(['error' => 'pc_day']);
  if (!relay_rate($ip, 'o', $S['ipOpen'], $day)) out(['error' => 'busy']);
  if (count(glob(RELAY_DIR . '/s_*.json') ?: []) >= $S['maxSlots']) out(['error' => 'busy']);
  for ($i = 0; $i < 40; $i++) { $code = (string)random_int(100000, 999999); if (!is_file(relay_slot_path($code))) break; }
  if (is_file(relay_slot_path($code))) out(['error' => 'busy']);
  $sid = bin2hex(random_bytes(12));
  relay_save_slot($code, ['sid' => $sid, 'pub' => $pub, 'pc' => $pc, 'o' => $origin, 't0' => $now, 'ts' => 0, 'n' => 0, 'q' => [], 'done' => false]);
  relay_count($month, $day, $pc, $origin, 'o', 0);
  out(['code' => $code, 'sid' => $sid, 'ttl' => RELAY_TTL_IDLE, 'max' => $S['maxItems'], 'mb' => $S['maxMB']]);
}

/* ---------- 받는 쪽: 가져가기 ---------- */
if ($a === 'poll' || $a === 'close') {
  $code = (string)($in['code'] ?? ''); $sid = (string)($in['sid'] ?? '');
  $slot = relay_code6($code) ? relay_load_slot($code) : null;
  if (!$slot || !hash_equals($slot['sid'], $sid)) out(['status' => 'gone']);
  if ($a === 'close') { relay_drop_slot($code, $slot); out(['ok' => true]); }
  if ($slot['q']) {
    $k = array_shift($slot['q']);
    $f = relay_item_path($code, $k);
    $item = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
    @unlink($f);
    relay_save_slot($code, $slot);
    if (!is_array($item)) out(['status' => 'wait']);
    $bytes = strlen($item['ct'] ?? '');
    relay_count($month, $day, $slot['pc'], $slot['o'], 'g', $bytes);
    out(['status' => 'item', 'epub' => $item['epub'], 'iv' => $item['iv'], 'ct' => $item['ct'], 'more' => count($slot['q']), 'n' => $slot['n']]);
  }
  if ($slot['done']) { relay_drop_slot($code, $slot); out(['status' => 'end', 'n' => $slot['n']]); }
  out(['status' => 'wait', 'n' => $slot['n'], 'left' => relay_slot_left($slot, $now)]);
}

/* ---------- 보내는 쪽 ---------- */
if ($a === 'pub' || $a === 'send' || $a === 'done') {
  $code = preg_replace('/\D/', '', (string)($in['code'] ?? ''));
  $slot = relay_code6($code) ? relay_load_slot($code) : null;
  if (!$slot) {
    /* 없는 번호를 자꾸 넣어 보는 것을 막음 */
    if (!relay_rate($ip, 'x', $S['ipMiss'], $day)) out(['error' => 'busy']);
    out(['error' => 'nocode']);
  }
  if ($a === 'pub') out(['pub' => $slot['pub'], 'left' => $S['maxItems'] - $slot['n'], 'mb' => $S['maxMB'], 'max' => RELAY_MAX_SIDE]);
  if ($a === 'done') { $slot['done'] = true; relay_save_slot($code, $slot); out(['ok' => true]); }
  /* send */
  if ($slot['done']) out(['error' => 'nocode']);
  if ($slot['n'] >= $S['maxItems']) out(['error' => 'full']);
  $epub = (string)($in['epub'] ?? ''); $iv = (string)($in['iv'] ?? ''); $ct = (string)($in['ct'] ?? '');
  if (!preg_match('/^[A-Za-z0-9_-]{80,100}$/', $epub) || !preg_match('/^[A-Za-z0-9_-]{16}$/', $iv) || !preg_match('/^[A-Za-z0-9_-]+$/', $ct)) out(['error' => 'bad']);
  if (strlen($ct) > $S['maxMB'] * 1024 * 1024 * 4 / 3 + 64) out(['error' => 'big']);
  $U = relay_usage($month);
  if ($U['bytes'] >= $S['monthGB'] * 1e9) out(['error' => 'month']);
  if (!relay_rate($ip, 's', $S['ipSend'], $day)) out(['error' => 'busy']);
  $k = $slot['n'];
  if (file_put_contents(relay_item_path($code, $k), json_encode(['epub' => $epub, 'iv' => $iv, 'ct' => $ct])) === false) out(['error' => 'disk']);
  $slot['q'][] = $k; $slot['n']++; $slot['ts'] = $now;
  relay_save_slot($code, $slot);
  relay_count($month, $day, $slot['pc'], $slot['o'], 's', strlen($ct));
  out(['ok' => true, 'left' => $S['maxItems'] - $slot['n']]);
}

out(['error' => 'act']);
