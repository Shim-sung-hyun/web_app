<?php
/* 다리(2026-10-25): 웹앱 서버 파일은 charum-api/ 폴더로 옮김. 예전 주소로 오는 앱(열어 둔 옛 화면·007 등)을 위해
   그 폴더로 옮겨 가서 같은 파일을 그대로 부름(기록 폴더도 그쪽 것을 씀). 앱이 모두 새 주소를 쓰면 지워도 됨. */
chdir(__DIR__ . "/charum-api");
require __DIR__ . "/charum-api/puzzle-rank.php";
