<?php
/* =====================================================================
   차름 사진 기증함 (donate.php) — 2026-10-23 판
   선생님이 사진을 기증하면 여기 대기함에 쌓이고,
   제작자가 확인 화면(media/photos/review.html)에서 보고 골라 차름 사진 모음(media/photos)에 올린다.
   - 어느 앱에서든 보냄: 001 "내 사진" 기증(도형 분석 함께), 휴대폰 "폰에서 받기" 기증(사진만),
     제작자 "사진 모으기"(media/photos/collect.html, app 000 — 이름·장소·태그·추천 앱을 meta로).
   - 앱·휴대폰이 보내기 전에 Gemini로 사람·얼굴·이름·번호를 살펴 막는다(서버는 사진 속을 판단하지 못함).
     키가 없어 살피지 못한 사진은 check=none 으로 와서 확인 화면에 "검사 안 함"이 붙는다(제작자가 더 꼼꼼히).
   - 서버는 모양만 검사: 진짜 JPEG인지, 크기, 동의했는지, 하루 횟수, 전체 개수.
   - 데이터베이스 없음. 이 파일과 같은 폴더의 donate-data/ 에 저장(웹에서 직접 열리지 않게 막음).
   - 자리: 서버 맨 위의 charum-api/ 폴더(2026-10-25 루트에서 옮김, 루트의 donate.php는 이 파일을 부르는 다리).
   - 서버 루트에 게시판 이름(mid)과 같은 폴더를 만들지 말 것(라이믹스 403).
   - 이 파일을 채팅·게시판에 붙일 때는 아래 $REVIEW_TOKEN 값을 지우고 붙일 것.
   ===================================================================== */

$REVIEW_TOKEN  = '';   // ← 제작자만 아는 긴 글자(20자 이상)를 따옴표 안에 넣으세요. 확인 화면에서 이 글자를 넣어야 목록이 보입니다.
$ALLOW_ORIGINS = ['https://shim-sung-hyun.github.io', 'https://www.charum.org', 'https://charum.org'];
$MAX_IMG       = 3 * 1024 * 1024;   // 사진·그림 하나의 base64 최대 길이(약 2MB)
$MAX_BODY      = 7 * 1024 * 1024;
$PER_IP_DAY    = 20;                // 한 곳(IP)에서 하루 기증 최대
$PER_IP_DAY_COLLECT = 60;           // 제작자 "사진 모으기"(app 000)는 하루 최대
$MAX_PENDING   = 300;               // 대기함 최대 개수

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
/* 오류도 200으로(호스팅 오류 페이지가 가로채지 않게). 오류는 {"error":"..."} */
function out($a) { http_response_code(200); echo json_encode($a, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit; }

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $ALLOW_ORIGINS, true)) {
  header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin');
  header('Access-Control-Allow-Methods: POST, OPTIONS'); header('Access-Control-Allow-Headers: Content-Type'); header('Access-Control-Max-Age: 600');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$DIR = __DIR__ . '/donate-data';
if (!is_dir($DIR)) {
  @mkdir($DIR, 0700, true);
  @file_put_contents($DIR . '/.htaccess', "Require all denied\nDeny from all\n");
  @file_put_contents($DIR . '/index.html', '');
}
/* 주소창에서 열면 점검: token_set 이 true 여야 확인 화면이 열림 */
if ($_SERVER['REQUEST_METHOD'] === 'GET') out(['ok' => true, 'name' => 'charum donate', 'version' => '2026-10-23', 'pending' => count(glob($DIR . '/d_*.json') ?: []), 'token_set' => strlen($REVIEW_TOKEN) >= 20, 'data_dir' => is_writable($DIR) ? 'ok' : 'cannot write']);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'method']);
if (!$origin || !in_array($origin, $ALLOW_ORIGINS, true)) out(['error' => 'origin']);

$raw = file_get_contents('php://input', false, null, 0, $MAX_BODY + 1);
if ($raw === false || strlen($raw) > $MAX_BODY) out(['error' => 'toolarge']);
$in = json_decode($raw, true);
if (!is_array($in)) out(['error' => 'bad']);
$a = $in['a'] ?? '';

function isJpeg($b64, $max) {
  if (!is_string($b64) || $b64 === '' || strlen($b64) > $max || !preg_match('/^[A-Za-z0-9+\/=]+$/', $b64)) return false;
  $bin = base64_decode($b64, true); if ($bin === false || strlen($bin) < 1000) return false;
  if (substr($bin, 0, 3) !== "\xFF\xD8\xFF") return false;
  if (function_exists('getimagesizefromstring')) { $s = @getimagesizefromstring($bin); if (!$s || $s[0] > 4000 || $s[1] > 4000) return false; }
  return true;
}
function clean($s, $n) { $s = is_string($s) ? $s : ''; $s = preg_replace('/[\x00-\x1F<>]/u', '', $s); return mb_substr(trim($s), 0, $n); }
function authed() { global $REVIEW_TOKEN, $in; return strlen($REVIEW_TOKEN) >= 20 && hash_equals($REVIEW_TOKEN, (string)($in['token'] ?? '')); }
function idok($id) { return is_string($id) && preg_match('/^[a-z0-9]{8,40}$/', $id); }

if ($a === 'give') {
  if (count(glob($DIR . '/d_*.json') ?: []) >= $MAX_PENDING) out(['error' => 'full']);
  /* 어느 앱(001·002…), 앱 검사(gemini = 통과 / none = 키가 없어 못 함). 예전 001은 app·check를 보내지 않음 → 001·gemini */
  $app = (string)($in['app'] ?? '001'); if (!preg_match('/^\d{3}$/', $app)) $app = '001';
  $check = ($in['check'] ?? 'gemini') === 'none' ? 'none' : 'gemini';
  /* 휴대폰 기증은 동의 칸을 눌러야 보냄(agree=true). 예전 001 기증 창도 동의 칸이 있어 보냄 */
  if (isset($in['agree']) && $in['agree'] !== true) out(['error' => 'agree']);
  /* 하루 횟수(IP는 해시만) */
  $ip = $_SERVER['REMOTE_ADDR'] ?? '0'; $day = gmdate('Y-m-d', time() + 9 * 3600);
  $rf = $DIR . '/r_' . substr(hash('sha256', $ip . '|' . $day . '|charum'), 0, 24);
  $n = is_file($rf) ? (int)@file_get_contents($rf) : 0;
  if ($n >= ($app === '000' ? $PER_IP_DAY_COLLECT : $PER_IP_DAY)) out(['error' => 'busy']);
  if (!isJpeg($in['img'] ?? '', $MAX_IMG)) out(['error' => 'img']);
  $art = $in['art'] ?? '';
  if ($art !== '' && !isJpeg($art, $MAX_IMG)) $art = '';
  /* 도형 분석은 있으면 검사해서 받고, 없으면(휴대폰 기증) 빈 목록 */
  $shapes = $in['shapes'] ?? [];
  if (!is_array($shapes) || count($shapes) > 40) out(['error' => 'shapes']);
  $okShapes = [];
  foreach ($shapes as $s) {
    if (!is_array($s) || !in_array($s['type'] ?? '', ['circle', 'ellipse', 'triangle', 'quad'], true) || !is_array($s['box'] ?? null)) out(['error' => 'shapes']);
    $b = $s['box']; foreach (['x0', 'y0', 'x1', 'y1'] as $k) if (!is_numeric($b[$k] ?? null)) out(['error' => 'shapes']);
    $pts = null;
    if (is_array($s['pts'] ?? null)) { $pts = []; foreach (array_slice($s['pts'], 0, 8) as $p) if (is_array($p) && is_numeric($p[0] ?? null) && is_numeric($p[1] ?? null)) $pts[] = [round($p[0], 1), round($p[1], 1)]; }
    $okShapes[] = ['type' => $s['type'], 'obj' => clean($s['obj'] ?? '', 30), 'box' => ['x0' => +$b['x0'], 'y0' => +$b['y0'], 'x1' => +$b['x1'], 'y1' => +$b['y1']],
      'pts' => $pts, 'realRight' => !empty($s['realRight']), 'ratio' => is_numeric($s['ratio'] ?? null) ? +$s['ratio'] : 0];
  }
  if ($app === '001' && !count($okShapes) && !isset($in['agree'])) out(['error' => 'shapes']);   /* 예전 001 기증 창은 도형이 꼭 있음 */
  $title = clean($in['title'] ?? '', 40);
  /* 사진 모으기의 분류(있으면): 장소·태그·추천 앱·메모 */
  $meta = null;
  if (is_array($in['meta'] ?? null)) { $m = $in['meta']; $tags = [];
    foreach (array_slice(is_array($m['tags'] ?? null) ? $m['tags'] : [], 0, 6) as $t) { $t = clean($t, 12); if ($t !== '') $tags[] = $t; }
    $meta = ['place' => clean($m['place'] ?? '', 12), 'tags' => $tags,
      'suggest' => ['shape' => !empty($m['suggest']['shape']), 'puzzle' => !empty($m['suggest']['puzzle'])], 'note' => clean($m['note'] ?? '', 80)]; }
  $id = gmdate('ymdHis') . bin2hex(random_bytes(4));
  $d = ['id' => $id, 't' => time(), 'app' => $app, 'check' => $check, 'title' => $title, 'shapes' => $okShapes, 'img' => $in['img'], 'art' => $art, 'meta' => $meta];
  if (@file_put_contents($DIR . '/d_' . $id . '.json', json_encode($d, JSON_UNESCAPED_UNICODE), LOCK_EX) === false) out(['error' => 'storage']);
  @file_put_contents($rf, (string)($n + 1), LOCK_EX);
  foreach (glob($DIR . '/r_*') ?: [] as $f) { if (@filemtime($f) < time() - 2 * 86400) @unlink($f); }
  out(['ok' => true]);
}

/* ---------- 제작자(확인 화면 media/photos/review.html) ---------- */
if (!authed()) out(['error' => 'token']);
if ($a === 'list') {
  $list = [];
  foreach (glob($DIR . '/d_*.json') ?: [] as $f) { $d = json_decode((string)@file_get_contents($f), true); if (!$d) continue;
    $list[] = ['id' => $d['id'], 't' => $d['t'], 'title' => $d['title'], 'n' => count($d['shapes'] ?? []), 'art' => ($d['art'] ?? '') !== '',
      'app' => $d['app'] ?? '001', 'check' => $d['check'] ?? 'gemini', 'meta' => $d['meta'] ?? null]; }
  usort($list, function ($x, $y) { return $x['t'] <=> $y['t']; });
  out(['list' => $list]);
}
if ($a === 'get') { $id = $in['id'] ?? ''; if (!idok($id) || !is_file($DIR . '/d_' . $id . '.json')) out(['error' => 'nofile']);
  $d = json_decode((string)file_get_contents($DIR . '/d_' . $id . '.json'), true);
  $d['app'] = $d['app'] ?? '001'; $d['check'] = $d['check'] ?? 'gemini'; $d['shapes'] = $d['shapes'] ?? [];
  out($d); }
if ($a === 'del') { $id = $in['id'] ?? ''; if (idok($id)) @unlink($DIR . '/d_' . $id . '.json'); out(['ok' => true]); }
out(['error' => 'bad']);
