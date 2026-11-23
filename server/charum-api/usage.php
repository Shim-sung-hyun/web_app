<?php
/* 차름 웹앱 사용 횟수 (usage.php) — 2026-11-23 판
   서버 charum-api/ 폴더에 올림. 기록은 같은 곳 usage-data/ (스스로 만들고 웹에서 막음).
   받는 것: 앱 번호(001~099)와 '열림' 1번 또는 '다 함' 횟수만. 학생 이름·기록·기기 번호는 받지 않음.
   IP는 하루 보낸 수를 세는 데만(sha1로, 날마다 지움).
   보내는 쪽: 공통 모듈 common/usage.js (navigator.sendBeacon, text/plain)
   GET  ?ping                       → 상태
   POST {"app":"005","open":1}      → 그날 그 앱 열림 +1 (같은 기기·같은 날 한 번은 앱 쪽에서 막음)
   POST {"app":"005","done":3}      → 그날 그 앱 다 함 +3
   보는 곳: usage-admin.php (charum.org 관리자 로그인) */

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
function out($a) { echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; } /* 오류도 200 + error */

$DIR = __DIR__ . '/usage-data';
if (!is_dir($DIR)) { @mkdir($DIR, 0755, true); }
if (!file_exists("$DIR/.htaccess")) @file_put_contents("$DIR/.htaccess", "Require all denied\nDeny from all\n");
if (!file_exists("$DIR/index.html")) @file_put_contents("$DIR/index.html", '');
$IP_DAY = 600;   /* 한 IP가 하루 보낼 수 있는 수(학교 한 곳이 IP 하나를 함께 써도 넉넉하게) */

function kday() { return gmdate('Y-m-d', time() + 32400); }

if (isset($_GET['ping'])) {
  $f = "$DIR/" . substr(kday(), 0, 7) . '.json';
  out(['ok' => true, 'version' => '2026-11-23', 'writable' => is_writable($DIR), 'month_file' => file_exists($f)]);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(['error' => 'post']);
if (!in_array($origin, $allow, true)) out(['error' => 'origin']);

$in = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($in)) out(['error' => 'json']);
$app = (string)($in['app'] ?? '');
if (!preg_match('/^0\d\d$/', $app)) out(['error' => 'app']);
$open = !empty($in['open']) ? 1 : 0;
$done = max(0, min(200, (int)($in['done'] ?? 0)));
if (!$open && !$done) out(['error' => 'empty']);

$day = kday();
$fp = fopen("$DIR/lock", 'c'); flock($fp, LOCK_EX);

/* IP별 하루 보낸 수 */
$rf = "$DIR/rate.json";
$rate = json_decode((string)@file_get_contents($rf), true);
if (!is_array($rate) || ($rate['day'] ?? '') !== $day) $rate = ['day' => $day, 'ip' => []];
$ip = substr(sha1('usage|' . ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $day), 0, 12);
$rate['ip'][$ip] = ($rate['ip'][$ip] ?? 0) + 1;
if ($rate['ip'][$ip] > $IP_DAY) { flock($fp, LOCK_UN); out(['error' => 'rate']); }
file_put_contents($rf, json_encode($rate), LOCK_EX);

/* 달마다 한 파일: {"2026-11-23":{"005":{"o":3,"d":40}}} */
$mf = "$DIR/" . substr($day, 0, 7) . '.json';
$m = json_decode((string)@file_get_contents($mf), true);
if (!is_array($m)) $m = [];
$c = $m[$day][$app] ?? ['o' => 0, 'd' => 0];
$c['o'] += $open; $c['d'] += $done;
$m[$day][$app] = $c;
file_put_contents($mf, json_encode($m), LOCK_EX);
flock($fp, LOCK_UN);
out(['ok' => true]);
