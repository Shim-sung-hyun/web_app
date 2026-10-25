<?php
/* 차름 사진 다리 — relay.php 와 relay-admin.php 가 함께 쓰는 부분 (2026-10-25 판)
   기록 폴더: charum-api/relay-data/ (웹에서 막음)
     settings.json      연수 코드와 한도(관리자 화면에서 바꿈)
     usage-YYYY-MM.json 그달 사용량(전송량·번호·장 수, 코드별·날짜별, 부른 주소별) — 사진 내용은 없음
     rate.json          오늘 IP별 횟수(IP는 sha1로 바꿔 세기만, 날마다 새로)
     s_123456.json      열린 번호(받는 화면의 공개 열쇠, 기다리는 차례)
     i_123456_0.json    잠긴 사진 한 장(받는 순간 지움) */
if (!defined('RELAY_VERSION')) {
define('RELAY_VERSION', '2026-10-25');
define('RELAY_DIR', __DIR__ . '/relay-data');
define('RELAY_TTL_IDLE', 180);    /* 번호를 만든 뒤 첫 사진까지 3분 */
define('RELAY_TTL_ACTIVE', 600);  /* 사진이 오면 마지막 사진 뒤 10분까지 더 받음 */
define('RELAY_TTL_MAX', 1800);    /* 번호 하나는 길어도 30분 */
define('RELAY_MAX_SIDE', 1600);   /* 휴대폰이 줄여 보내는 긴 쪽(px) */

if (!is_dir(RELAY_DIR)) @mkdir(RELAY_DIR, 0755, true);
if (!file_exists(RELAY_DIR . '/.htaccess')) @file_put_contents(RELAY_DIR . '/.htaccess', "Require all denied\nDeny from all\n");
if (!file_exists(RELAY_DIR . '/index.html')) @file_put_contents(RELAY_DIR . '/index.html', '');

function relay_lock() { $fp = fopen(RELAY_DIR . '/lock', 'c'); flock($fp, LOCK_EX); return $fp; }
function relay_read($f, $def) { $j = @file_get_contents($f); $a = $j ? json_decode($j, true) : null; return is_array($a) ? $a : $def; }
function relay_write($f, $a) { file_put_contents($f, json_encode($a, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX); }
function relay_today() { return gmdate('Y-m-d', time() + 32400); }

/* ---------- 설정 ---------- */
function relay_defaults() {
  return [
    'monthGB' => 60,      /* 이달 전송량이 이만큼 되면 새 전송을 멈춤(호스팅 한 달 180GB의 1/3) */
    'maxMB' => 4,         /* 사진 한 장 크기(잠근 뒤) */
    'maxItems' => 30,     /* 번호 하나로 보낼 수 있는 장 수 */
    'maxSlots' => 400,    /* 한꺼번에 열려 있을 수 있는 번호 수 */
    'ipOpen' => 300,      /* IP 하나가 하루에 만드는 번호 */
    'ipSend' => 600,      /* IP 하나가 하루에 보내는 장 수 */
    'ipMiss' => 60,       /* 없는 번호를 넣어 본 횟수(하루) */
    'codes' => [
      /* 차름이 직접 쓰는 것. 관리자 화면에서 끄거나 한도를 바꿀 수 있음 */
      'get' => ['label' => '받기 페이지(study/get.html)', 'on' => true, 'until' => '', 'day' => 3000, 'made' => '2026-10-25'],
      'demo' => ['label' => '예시 앱(relay/example.html) — 연수 실습 맛보기', 'on' => true, 'until' => '', 'day' => 300, 'made' => '2026-10-25'],
    ],
  ];
}
function relay_settings() {
  $d = relay_defaults();
  $s = relay_read(RELAY_DIR . '/settings.json', []);
  foreach ($d as $k => $v) if (!isset($s[$k])) $s[$k] = $v;
  if (!is_array($s['codes'])) $s['codes'] = [];
  return $s;
}
function relay_save_settings($s) { relay_write(RELAY_DIR . '/settings.json', $s); }
function relay_code_ok($pc) { return is_string($pc) && preg_match('/^[a-z0-9][a-z0-9-]{2,23}$/', $pc); }
function relay_code_live($c) { return !empty($c['on']) && (empty($c['until']) || $c['until'] >= relay_today()); }

/* ---------- 사용량 ---------- */
function relay_usage($month) {
  $u = relay_read(RELAY_DIR . '/usage-' . $month . '.json', []);
  return $u + ['bytes' => 0, 'o' => 0, 's' => 0, 'g' => 0, 'codes' => [], 'origins' => []];
}
/* kind: o 번호 만듦 · s 사진 옴 · g 사진 가져감. bytes는 오고 간 잠긴 사진 크기 */
function relay_count($month, $day, $pc, $origin, $kind, $bytes) {
  $u = relay_usage($month);
  $u['bytes'] += $bytes; $u[$kind]++;
  $c = $u['codes'][$pc] ?? ['o' => 0, 's' => 0, 'g' => 0, 'bytes' => 0, 'days' => []];
  $c[$kind]++; $c['bytes'] += $bytes;
  $dd = $c['days'][$day] ?? ['o' => 0, 's' => 0];
  if ($kind !== 'g') $dd[$kind]++;
  $c['days'][$day] = $dd;
  $u['codes'][$pc] = $c;
  if ($kind === 'o') {
    $o = $origin === '' ? '(주소 없음)' : $origin;
    if (isset($u['origins'][$o]) || count($u['origins']) < 300) $u['origins'][$o] = ($u['origins'][$o] ?? 0) + 1;
  }
  relay_write(RELAY_DIR . '/usage-' . $month . '.json', $u);
}

/* ---------- IP 하루 횟수 ---------- */
function relay_rate($ip, $kind, $limit, $day) {
  $f = RELAY_DIR . '/rate.json';
  $r = relay_read($f, ['day' => '', 'n' => []]);
  if ($r['day'] !== $day) $r = ['day' => $day, 'n' => []];
  $k = $kind . '|' . $ip;
  $n = ($r['n'][$k] ?? 0) + 1;
  if ($n > $limit) return false;
  $r['n'][$k] = $n;
  relay_write($f, $r);
  return true;
}

/* ---------- 번호(받는 자리) ---------- */
function relay_code6($c) { return is_string($c) && preg_match('/^\d{6}$/', $c); }
function relay_slot_path($code) { return RELAY_DIR . '/s_' . $code . '.json'; }
function relay_item_path($code, $k) { return RELAY_DIR . '/i_' . $code . '_' . (int)$k . '.json'; }
function relay_load_slot($code) { $s = relay_read(relay_slot_path($code), null); return is_array($s) ? $s : null; }
function relay_save_slot($code, $s) { relay_write(relay_slot_path($code), $s); }
function relay_drop_slot($code, $s) {
  foreach (glob(RELAY_DIR . '/i_' . $code . '_*.json') ?: [] as $f) @unlink($f);
  @unlink(relay_slot_path($code));
}
function relay_slot_end($s) {
  $e = $s['t0'] + RELAY_TTL_IDLE;
  if (!empty($s['ts'])) $e = max($e, $s['ts'] + RELAY_TTL_ACTIVE);
  return min($e, $s['t0'] + RELAY_TTL_MAX);
}
function relay_slot_left($s, $now) { return max(0, relay_slot_end($s) - $now); }
/* 시간이 지난 번호·사진을 지움(부를 때마다 조금씩) */
function relay_sweep($now) {
  foreach (glob(RELAY_DIR . '/s_*.json') ?: [] as $f) {
    $code = substr(basename($f, '.json'), 2);
    $s = relay_read($f, null);
    if (!is_array($s) || relay_slot_end($s) < $now) relay_drop_slot($code, is_array($s) ? $s : []);
  }
  foreach (glob(RELAY_DIR . '/i_*.json') ?: [] as $f) if (@filemtime($f) < $now - RELAY_TTL_MAX - 60) @unlink($f);
  foreach (glob(RELAY_DIR . '/usage-*.json') ?: [] as $f) if (@filemtime($f) < $now - 400 * 86400) @unlink($f);   /* 1년쯤 지난 사용량은 지움 */
}
}
