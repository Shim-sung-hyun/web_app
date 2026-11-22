차름 공용 자료 (media/)

여러 앱이 함께 쓰는 그림·소리는 모두 여기 한곳에 둡니다(2026-11-04 정리).
앱 폴더(NNN/)에는 그 앱의 html·캡처·설명서만 두고, 자료는 여기서 가져다 씁니다.
앱 안에서는 늘 GitHub 절대 주소로 부릅니다: https://shim-sung-hyun.github.io/web_app/media/...
파일을 옮기거나 이름을 바꾸면 쓰는 앱 주소를 함께 고치고 python3 tools/check-files.py 로 "없는 파일 0"을 확인합니다.

■ 찾기 먼저(2026-11-22) — 그림·사진·소리를 새로 구하기 전에 꼭
  python3 tools/find-media.py 컵            낱말로(비슷한 말·영어 이름까지, 보관함도) → 그림 모음 한 장
  python3 tools/find-media.py --prompt 글   프롬프트 글의 ■ 항목마다 이미 있는지
  python3 tools/find-media.py --say "문장"  목소리가 이미 있는지
  전체 목록 catalog.json — python3 tools/media-index.py 가 폴더마다의 목록을 모아 만듦(손으로 고치지 않음).
  그림·소리를 넣거나 옮긴 뒤 다시 돌린다. 이름을 놓치면 synonyms.json(groups 비슷한 말 · en 파일 이름→한글)에 한 줄.
■ 버리지 않기(2026-11-22) — 안 쓰게 된 그림·사진·소리는 tools/trash.py 가 archive/(보관함, 비우지 않음)로 보냄.

■ 폴더                쓰는 앱              자세한 글
  photos/     실제 사진·끝 그림·색칠 도안     001 002 008 010 photos/README.txt, REVIEW.md
  voice/      미리 만든 목소리(mp3)          대부분           voice/README.txt
  words/      낱말 그림 349장 + pics.json   007 008 009 010  (2026-11-04 007/pics에서 옮김)
  play/       놀이 그림                      007 009
              feed/food 먹이 · feed/animal 입 벌린·먹는 동물 · body 스티커 몸 그림
  animals/    새로 그린 동물(배경 없음)       008 009          animals/index.json, masks.json
  habitats/   사는 곳 배경·소품(만화풍)       008 009          habitats/photos.json (옛 숨은 그림 seek/는 archive로)
  stage/      무대 12곳 nature/<곳>(연필풍)   008 009          stage/README.txt, index.json, props.json(소품실)
              legacy/ 옛 덮개 방식 무대(008 옛 길) · *.html 무대 도구 화면  (2026-11-22 stage-beta를 합침)
  prompts/    모든 프롬프트 글 + 복사 화면 copy.html, 그림풍 견본 style-ref-*.png  (2026-11-22 세 곳에서 모음)
  archive/    보관함: cartoon/ 옛 만화풍 · replaced/ 다시 받기 전 · unused/ 안 쓰게 된 것   archive/README.txt, list.json
  brand/      차름 로고(charum-logo.png — 선생님이 올리면 모든 앱이 씀)
  catalog.json  전체 목록 · synonyms.json 비슷한 말
  fonts/      글꼴(학교안심 바른바탕 B)       007
  materials/  물질 카드 결 사진(빙, 받는 중)    010              materials/README.txt

■ 앱 폴더에 두는 것: 앱.html, 앱01.jpg~ 캡처, 앱-promo.jpg, 앱_manual.html, 앱_guide.html, README.txt
