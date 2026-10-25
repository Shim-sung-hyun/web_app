<?php
/* donate-config.php — donate-admin.php가 비공개 저장소(charum-inbox)에 사진을 보낼 때 쓰는 열쇠.
   이 파일을 "donate-config.php"라는 이름으로 서버 맨 위 폴더(donate-admin.php 옆)에 두고,
   아래 따옴표 안에 GitHub 토큰을 넣으세요. 저장소·채팅에는 절대 넣지 않습니다.
   토큰: GitHub > Settings > Developer settings > Fine-grained tokens > Generate new token
         Repository access = Only select repositories → charum-inbox 하나만
         Permissions > Repository permissions > Contents = Read and write (그 밖은 그대로) */
$GITHUB_TOKEN = '';
$INBOX_REPO   = 'Shim-sung-hyun/charum-inbox';
