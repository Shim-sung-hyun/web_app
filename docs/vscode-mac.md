# 맥북 VS Code에서 차름 작업하기 (2026-11-09)

윈도 VS Code와 맥북 VS Code, Claude Code(클라우드 세션)가 **같은 GitHub 저장소**를 함께 씁니다. 판이 엇갈리지 않게 아래 순서를 지킵니다.

## 처음 한 번 (맥북)
1. 터미널(Spotlight에서 "터미널")에서 git이 있는지 확인: `git --version` — 없으면 설치 창이 뜨니 '설치'.
2. VS Code 설치 → 왼쪽 아래 사람 모양에서 **GitHub로 로그인**(Copilot도 이 계정).
3. 저장소 받기: VS Code `명령 팔레트(⌘⇧P)` → `Git: Clone` → `https://github.com/Shim-sung-hyun/web_app.git` → 둘 곳 고르기(예: `문서/web_app`) → 열기.
4. 터미널(VS Code 메뉴 Terminal → New Terminal)에서 이름 정하기(한 번만):
   `git config --global user.name "심성현"` · `git config --global user.email "simdoly@gmail.com"`

## 일할 때마다
1. **시작 전:** `git pull` (다른 컴퓨터·Claude가 올린 것을 받음)
2. 고치기 — Copilot은 `.github/copilot-instructions.md`를 읽고 같은 규칙을 따름. 일이 끝나면 그 앱 README에 정한 것·다음 할 일을 적게 함.
3. **올리기:** VS Code 왼쪽 '소스 제어'에서 메시지(한국어로 무엇을 왜) 쓰고 커밋 → `git push`
   - 거부(rejected)되면: `git pull --rebase` 뒤 다시 `git push`
   - 충돌(conflict)이 나면 멈추고 화면을 Claude에게 보여 줌
4. 다른 컴퓨터(윈도)로 옮기기 전에는 꼭 올리고, 옮긴 컴퓨터에서 먼저 `git pull`.

## 무대 만들기
- 설치도구: VS Code에서 `media/stage/install.html` 오른쪽 클릭 → **Reveal in Finder** → 크롬으로 열기(또는 `https://shim-sung-hyun.github.io/web_app/media/stage/install.html`).
  - 크롬이면 5단계 **'media/stage-beta에 직접 저장'** → 폴더 고르기에서 저장소의 `media/stage-beta` → 커밋·푸시.
  - 직접 저장이 어렵거나, 원본 그림을 넘길 때는 ZIP·그림을 Claude 대화에 올리면 Claude가 넣음(기존 소품 고르기·흰 구멍 검사·지평선·빽빽함 맞추기도 Claude가 함).
- 순서는 `media/stage-beta/README.txt` 맨 위 '무대 하나를 완성하는 순서', 원리는 `media/stage/README.txt` '장면의 원리'.
- 보기: `media/stage/test.html?root=stage-beta`, 숨기기 시험대 `media/stage/hide-test.html`(올린 뒤 1~2분이면 GitHub 주소에서 열림).

## 맥에서 알아 둘 것
- 파일 이름의 한글이 맥과 윈도에서 다르게 저장될 수 있음 — 저장소 파일 이름은 영문만(지침).
- 맥이 만드는 `.DS_Store` 파일은 올리지 않음(올라가면 Claude가 지움).
