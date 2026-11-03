무대(stage) — 장면을 레이어로 쌓아 만드는 공통 자료·모듈 (2026-11-03 시작 안내·보관 구조 정함. 그림은 아직 없음 — 다음 주쯤 받기 시작)
무대 세션이 이 글부터 읽고 시작한다. 정한 것과 다음 할 일은 이 글을 고쳐 적는다(덧붙이기보다 해당 줄을 고쳐 씀).

■ 왜(선생님 생각, 2026-11-03)
지금 008 숨은 동물 찾기는 완성된 장면 그림 한 장 위에 소품을 붙인다. 장면에 그려진 선인장·바위에는 앞뒤가 없어
붙인 소품(흙탑 등)이 그 앞에서 떠 보이고, 땅에 박힌 듯 보이게 소품 아랫단을 흐리게 하면 뒤에 숨은 동물 다리가 비쳐 보인다.
포토샵 레이어처럼 ① 배경(하늘·먼 산·지평선·빈 땅)을 그리고 ② 그 위에 올릴 요소를 따로 그려 ③ 깊이 순서대로 쌓으면
가림이 늘 맞고 흐리게 할 필요가 없다. 서식지만이 아니라 다른 앱(교실·가게·길·집 안 등)에서도 쓸 수 있게 공통으로 만든다.

■ 보관 구조(2026-11-03 정함 — 장소별, 3단: 갈래 / 장소 / 파일)
media/stage/
  index.json            모든 장소의 차림표. 다른 앱은 이것 하나만 읽고 찾는다(아래 꼴)
  README.txt  test.html
  nature/  자연     desert 사막 · forest 숲 · grassland 초원 · sea 바다 · polar 극지 · wetland 습지
                    pond 연못 · mudflat 갯벌 · underground 땅속 · sky 하늘   ← 008 서식지 이름과 같게
  town/    마을 바깥 street 길 · crosswalk 횡단보도 · park 공원 · playground 놀이터 · busstop 버스 정류장 …
  school/  학교     classroom 교실 · hallway 복도 · cafeteria 급식실 · gym 강당 · schoolyard 운동장 …
  home/    집       livingroom 거실 · kitchen 부엌 · bathroom 화장실 · bedroom 방 …
  public/  가게·기관 mart 마트 · convenience 편의점 · hospital 병원 · library 도서관 · bus 버스 안 …
  _common/ 어느 한 곳 것이 아닌 요소(공·가방·의자처럼 여기저기 놓이는 것). bg 없이 items/ 만
  (갈래는 이 다섯 + _common 으로 묶어 둠. 새 갈래는 꼭 필요할 때만 만들고 이 줄을 고친다)

한 장소 폴더 안 (예: media/stage/nature/desert/)
  bg.jpg               빈 배경 4:3. 앞에 설 만한 것(나무·바위·선인장·건물·책상)은 하나도 없음
  bg-<때>.jpg          같은 곳 다른 판이 생기면(bg-night, bg-winter, bg-rain …). 기본은 늘 bg.jpg
  items/<이름>.webp    요소(투명 바탕, 밑동이 반듯하게 땅에 닿게). 크기만 다른 같은 것은 cactus-s / cactus-l
  stage.json           지평선·땅 시작 높이, 놓으면 안 되는 자리, 요소마다 실제 높이(m)·밑동 자리·놓일 땅 높이 범위·뒤집기
  prompts.txt          Gemini에 넣은 프롬프트 기록(다시 받을 때 그림체 맞추기)
- 이름: 폴더·파일은 영어 소문자·숫자·붙임표만(008 props와 같은 꼴). 한글 이름은 index.json·stage.json에.
- 다른 곳 요소 빌려 쓰기: 복사하지 않는다. stage.json 에 "from":"school/classroom" 처럼 적어 그 곳 파일을 부른다.
  두 곳 넘게 쓰이게 되면 _common/items/ 로 옮기고 부르던 곳의 from 을 고친다.
- 008 media/habitats/props/ 소품은 그대로 둔다(008이 쓰는 중). 무대에 맞게 다시 그린 것만 여기 넣는다.
- 앱 안에서는 늘 GitHub 절대 주소로 부른다(media/ 다른 자료와 같음).

index.json 꼴(장소 하나에 한 줄)
  {"nature/desert": {"name":"사막","group":"nature","bg":["bg"],"items":["cactus-l","cactus-s","rock", …],
                     "tags":["더움","모래"],"used_by":["008"]}, …}
  - 그림을 넣거나 빼면 index.json 과 그 곳 stage.json 을 함께 고친다(나중에 tools/로 자동 만들기를 둘 수도)

■ 모듈 common/stage.js — 쌓는 규칙(공통 모듈: 원본 한 곳, tools/sync-modules.py로 앱에 복사)
    · 부르기: 장소 이름("nature/desert")만 넘기면 index.json·stage.json을 읽어 그림
    · 깊이: 밑동이 화면 아래쪽(가까운 것)일수록 위 레이어. 동물·앱 소품도 같은 규칙으로 함께 쌓음
    · 원근: 밑동 높이에 따라 크기를 줄임(지평선에 가까울수록 작게). 실제 높이 × 그 자리의 '1m가 몇 점'
    · 무작위 배치(판마다 다른 장면)와 고정 배치(설명서·캡처용) 둘 다
    · 모듈은 동작만, 얼굴(테두리·그림자 세기)은 앱이 넘겨 줌

■ 그림 받는 법(선생님이 Gemini로)
- 그림체는 media/habitats/props/prompts/style-ref.png 와 같게(소품) — 배경은 지금 장면(media/habitats/*.jpg) 그림체
- 오른쪽 아래 Gemini 별 표시가 걸치지 않게 "오른쪽 1/5과 아래 1/5은 비워 두기"(한 장 한 개) 또는 3×3 판의 9번 칸 비우기
- 배경 프롬프트에는 "NO trees, NO rocks, NO cactus, NO buildings — only sky, far mountains, horizon and empty ground" 를 꼭
- 요소는 "flat bottom touching the ground, seen from the front at eye level, no shadow, no ground line"
- 받은 그림 자르기: 008에서 쓴 방법(별 지우기·흰 테두리 정리 tools/clean-edges.py, 투명 바탕으로 온 그림은 그대로)

■ 순서(권함)
1. (다음 주부터) 사막 nature/desert 하나로 시험: 빈 배경 1장 + 요소 판 1~2장(선인장 크고 작게·바위·흙탑·덤불·마른 풀)
2. common/stage.js 로 사막을 쌓아 보는 시험 페이지(media/stage/test.html) — 무작위 몇 판을 찍어 선생님께 보임
3. 좋으면 008 베타 숨은 동물 찾기에 연결해 지금 방식과 견줌(소품 아랫단 흐리게 하기를 없앨 수 있는지)
4. 나머지 곳으로 넓힘. 다른 앱이 쓰려면 그 앱 세션이 common/stage.js 를 넣고 media/stage/<이름>/ 을 부름

■ 참고: 008이 지금 가진 것(옮겨 쓸 수 있음)
- 008/animal-home.html: playHide·hideCfg·pickHide(실제 크기·보이는 넓이로 숨기기), PREAL(소품 실제 높이), zIndex = 밑동 높이 순
- media/habitats/props/index.json: 소품 크기·꽉 찬 부분·모양 표·실제 높이·쓰는 곳 — stage.json의 본보기
- 008/README.txt: 숨기기 규칙과 그동안 고친 것
