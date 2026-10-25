<?php
/* 차름 놀이 · 내 그림 퍼즐 — S·S+ 단계 모든 학교 순위표 (2026-10-25)
   서버 루트(charum.org/puzzle-rank.php)에 올림. 기록은 같은 곳 puzzle-rank-data/ (웹에서 막음).
   받는 것: 별명(한글·영문·숫자 8자까지)·단계(S, S+)·시간(ms)·기기 번호(무작위, 같은 기기·같은 별명은 가장 빠른 기록 하나).
   학생 이름·학교·사진은 받지 않음. IP는 하루 보낸 수를 세는 데만(sha1로, 날마다 지움).
   GET  ?ping                      → 상태
   GET  ?lv=S&dev=기기번호          → 순위 30위까지 + 이 기기 별명들의 순위
   POST {"act":"add","lv":"S","ms":123456,"nick":"번개손","dev":"…"}
   POST {"act":"del","token":"…","lv":"S","nick":"…"}  (제작자만: 아래 $ADMIN_TOKEN, 20자 이상, 서버에서만 넣음) */
$ADMIN_TOKEN = '';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$allow = ['https://shim-sung-hyun.github.io', 'https://www.charum.org', 'https://charum.org'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allow, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') exit;
function out($a) { echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; } /* 오류도 200 + error (호스팅 오류 페이지가 가로채지 않게) */

$DIR = __DIR__ . '/puzzle-rank-data';
if (!is_dir($DIR)) { @mkdir($DIR, 0755, true); }
if (!file_exists("$DIR/.htaccess")) @file_put_contents("$DIR/.htaccess", "Require all denied\nDeny from all\n");
if (!file_exists("$DIR/index.html")) @file_put_contents("$DIR/index.html", '');
$FILE = "$DIR/rank.json";
$LEVELS = ['S', 'S+'];
$MIN_MS = 30000;            /* 50조각을 30초 안에 맞출 수는 없다고 봄 */
$MAX_MS = 6 * 3600 * 1000;
$KEEP = 2000;               /* 단계마다 남길 사람 수 */
$BAD = ['시발','씨발','ㅅㅂ','ㅆㅂ','병신','ㅂㅅ','개새','새끼','좆','존나','지랄','미친','fuck','shit','bitch','sex','섹스','장애','애자','등신','찐따'];

function load_all($FILE) {
  $j = @file_get_contents($FILE);
  $a = $j ? json_decode($j, true) : null;
  return is_array($a) ? $a : ['S' => [], 'S+' => [], 'rate' => ['day' => '', 'ip' => []]];
}
function ranked($list) {
  $v = array_values($list);
  usort($v, function ($a, $b) { return $a['ms'] <=> $b['ms'] ?: strcmp($a['d'], $b['d']); });
  return $v;
}

if (isset($_GET['ping'])) out(['ok' => true, 'version' => '2026-10-25', 'admin_set' => strlen($ADMIN_TOKEN) >= 20]);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
  $lv = $_GET['lv'] ?? '';
  if (!in_array($lv, $LEVELS, true)) out(['error' => 'lv']);
  $dev = preg_match('/^[a-z0-9]{12}$/', $_GET['dev'] ?? '') ? $_GET['dev'] : '';
  $all = load_all($FILE);
  $v = ranked($all[$lv] ?? []);
  $top = []; $mine = [];
  foreach ($v as $i => $e) {
    $me = $dev !== '' && hash_equals($e['h'], substr(sha1('dev|' . $dev), 0, 16));
    $row = ['r' => $i + 1, 'n' => $e['n'], 'ms' => $e['ms'], 'd' => $e['d'], 'me' => $me];
    if ($i < 30) $top[] = $row;
    if ($me) $mine[] = $row;
  }
  out(['ok' => true, 'lv' => $lv, 'total' => count($v), 'top' => $top, 'mine' => $mine]);
}

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) out(['error' => 'json']);
$act = $in['act'] ?? '';
$lv = $in['lv'] ?? '';
if (!in_array($lv, $LEVELS, true)) out(['error' => 'lv']);
$nick = trim(preg_replace('/\s+/u', ' ', (string)($in['nick'] ?? '')));
if (!preg_match('/^[가-힣a-zA-Z0-9 ]{1,8}$/u', $nick)) out(['error' => 'nick']);

$fp = fopen("$DIR/lock", 'c'); flock($fp, LOCK_EX);
$all = load_all($FILE);

if ($act === 'del') {
  if (strlen($ADMIN_TOKEN) < 20 || !hash_equals($ADMIN_TOKEN, (string)($in['token'] ?? ''))) { flock($fp, LOCK_UN); out(['error' => 'token']); }
  $n0 = count($all[$lv]);
  foreach ($all[$lv] as $k => $e) if ($e['n'] === $nick) unset($all[$lv][$k]);
  file_put_contents($FILE, json_encode($all, JSON_UNESCAPED_UNICODE), LOCK_EX);
  flock($fp, LOCK_UN); out(['ok' => true, 'removed' => $n0 - count($all[$lv])]);
}
if ($act !== 'add') { flock($fp, LOCK_UN); out(['error' => 'act']); }

$low = mb_strtolower(str_replace(' ', '', $nick));
foreach ($BAD as $w) if (mb_strpos($low, $w) !== false) { flock($fp, LOCK_UN); out(['error' => 'nick']); }
$ms = (int)($in['ms'] ?? 0);
if ($ms < $MIN_MS || $ms > $MAX_MS) { flock($fp, LOCK_UN); out(['error' => 'ms']); }
$dev = (string)($in['dev'] ?? '');
if (!preg_match('/^[a-z0-9]{12}$/', $dev)) { flock($fp, LOCK_UN); out(['error' => 'dev']); }

/* 하루 IP마다 60건까지 */
$day = gmdate('Y-m-d', time() + 9 * 3600);
if (($all['rate']['day'] ?? '') !== $day) $all['rate'] = ['day' => $day, 'ip' => []];
$ip = substr(sha1('ip|' . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);
$cnt = $all['rate']['ip'][$ip] ?? 0;
if ($cnt >= 60) { flock($fp, LOCK_UN); out(['error' => 'limit']); }
$all['rate']['ip'][$ip] = $cnt + 1;

$h = substr(sha1('dev|' . $dev), 0, 16);
$key = substr(sha1($h . '|' . $nick), 0, 16);
$cur = $all[$lv][$key] ?? null;
$best = false;
if (!$cur || $ms < $cur['ms']) { $all[$lv][$key] = ['n' => $nick, 'ms' => $ms, 'd' => $day, 'h' => $h]; $best = true; }
if (count($all[$lv]) > $KEEP) {
  $v = ranked($all[$lv]); $keep = array_slice($v, 0, $KEEP); $all[$lv] = [];
  foreach ($keep as $e) $all[$lv][substr(sha1($e['h'] . '|' . $e['n']), 0, 16)] = $e;
}
file_put_contents($FILE, json_encode($all, JSON_UNESCAPED_UNICODE), LOCK_EX);
$rank = 1; foreach ($all[$lv] as $e) if ($e['ms'] < $all[$lv][$key]['ms']) $rank++;
flock($fp, LOCK_UN);
out(['ok' => true, 'best' => $best, 'rank' => $rank, 'total' => count($all[$lv])]);
