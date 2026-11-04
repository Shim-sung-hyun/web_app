무대(stage) — 장면을 레이어로 쌓아 만드는 공통 자료·모듈 (2026-11-04: 008의 12곳 폴더·stage.json·모듈·시험 페이지·Gemini 프롬프트까지 만듦. 그림은 아직 없음 — 사막부터 받는 중)
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

■ 장면 만드는 원칙(2026-11-04 선생님 결정 — docs/guidelines.md에도 있음)
- 배경 · 대상 · 앞가림을 따로 그려 겹친다(만화영화 셀처럼). 한 장에 다 그려 받지 않는다(대상만 바꾸거나 움직일 수 없음).
- 쌓는 차례는 세 층으로 딱 나누지 않고 '밑동이 아래(가까운 것)일수록 위'. 덤불은 어떤 동물에겐 앞가림, 다른 동물에겐 뒤 배경이 됨.
  따로 그리는 앞가림은 화면 아래에 까는 얇은 띠(풀·모래·물풀)뿐 — front/*.webp. 대상의 아랫부분을 살짝 덮어 "그 안에 있는" 느낌.
- 그림자는 그림에 넣지 않고 모듈이 그림(방향·진하기가 모두 같게, 크기 따라 줄어듦). 대상은 투명 바탕, 밑동은 반듯하게.
- 고르게 흩뿌리지 않음: 2~4 덩어리(큰 것 하나 + 앞쪽 작은 것 몇)와 빈 땅. 먼 것은 살짝 옅고 흐리게(공기 원근).
- 그림체·빛 방향(왼쪽 위)을 하나로: 배경 본보기 media/habitats/<곳>.jpg(그림체만), 요소·띠 본보기 media/habitats/props/prompts/style-ref.png.
- 다시 그려야 하면 과감하게 다시 받는다. 옛 그림(장면에 그려진 나무·바위, 아랫단을 흐린 소품)을 고쳐 쓰느라 품을 들이지 않는다.

■ 모듈 common/stage.js (공통 모듈: 원본 한 곳, python3 tools/sync-modules.py로 <script id="stage"> 칸에 복사)
- Stage.load('nature/desert') → Stage.compose(pl,{seed}) 또는 {fixed:[{id,x,y,r,flip}]} → Stage.add(pl,lay,{동물…}) → Stage.render(div,pl,lay,{shadow,haze,front})
- 좌표는 장면 대비 0~1, y는 밑동. 원근: 1m 몫 = unit × (y−지평선)/(1−지평선). view:'flat'(바닷속·물속·강 단면·땅속)은 어디서나 unit
- 아직 받지 않은 그림은 빼고 그림(배경이 없으면 빈 칸). 시험 페이지 media/stage/test.html (#nature/desert/번호 로 같은 판 다시 보기)
  2026-11-04 대신 그린 네모·타원으로 쌓기·원근·그림자·흐림·띠가 도는 것만 확인함 — 진짜 그림으로는 아직 못 봄

stage.json 꼴(장소마다)
  name·view('ground'|'flat')·horizon(지평선 높이 0~1)·groundTop(요소를 놓기 시작하는 높이)·unit(맨 아래에서 1m 몫)
  avoid:[[x0,y0,x1,y1]…] 놓지 않는 자리 · front:[{src,name,h}] 앞가림 띠(h=띠 높이 몫)
  items:{id:{name, real:[낮은,높은 m], role:'big'(덩어리의 중심), ground:[0~1 범위, 땅 위 어디까지], float(구름처럼 뜸), from(빌려 옴),
            base(그림 중 밑동 줄의 몫, 기본 1), foot:[왼,오른](그림자 폭, 기본 .2~.8), flip:false(뒤집으면 안 됨), scale}}
  그림을 받아 넣은 뒤 지평선(horizon)·unit을 그림에 맞게 고치고 index.json의 bg·ready를 고친다.

■ 그림 받는 법 — 프롬프트 media/stage/prompts/PROMPTS-008.txt (배경 12 · 요소 판 11 · 띠 판 3. 물속은 바닷속 요소를 빌려 씀)
- 한 장마다 Gemini 새 창. [공통] 글 + 그 장의 글 + 본보기 그림. 받은 그림을 이 세션에 올리면 Claude가 잘라 넣음
- 요소: 흰 바탕 3×3 판(9번 칸 비움) → tools/clean-edges.py로 흰 바탕 지우고, 밑동 아래 빈 줄을 잘라 items/<id>.webp
- 배경: 4:3, 1600×1200 jpg로 맞추고 오른쪽 아래 별 표시를 지움 → bg.jpg
- 마음에 안 드는 그림은 저장소에 넣지 않는다. 이미 넣었다가 안 쓰게 된 것은 python3 tools/trash.py 경로 --why "이유" (3개월 뒤 비움)

■ 지금 상태와 다음 할 일
- 폴더: media/stage/nature/ 아래 008의 12곳(desert grassland forest ground polar wetland mudflat sea water pond underground sky). 장소마다 stage.json만 있고 그림 없음.
  index.json 은 모두 ready:false. 다른 갈래(town·school·home·public·_common)는 그 앱이 필요할 때 만든다.
- 다음: ① 사막 배경·요소·띠 판 1 받기 → 넣고 test.html로 네 판 찍어 선생님께 보임 ② 덩어리·크기·그림자·띠 높이 다듬기
  ③ 좋으면 008 베타 숨은 동물 찾기에 연결(소품 아랫단 흐리게 하기 없애기, 동물은 Stage.add로 함께 쌓기) ④ 나머지 11곳 받기
- 008 연결 때 생각할 것: 008의 숨기기 규칙(보이는 넓이·ZONE·FACE)은 008에 그대로 두고, 놓는 자리·크기·깊이만 무대에 맡김.
  다 옮기면 media/habitats/props·game 장면은 _trash로(008이 더는 안 부를 때만).

■ 참고: 008이 지금 가진 것(옮겨 쓸 수 있음)
- 008/animal-home.html: playHide·hideCfg·pickHide(실제 크기·보이는 넓이로 숨기기), PREAL(소품 실제 높이), zIndex = 밑동 높이 순
- media/habitats/props/index.json: 소품 크기·꽉 찬 부분·모양 표·실제 높이·쓰는 곳 — stage.json의 본보기
- 008/README.txt: 숨기기 규칙과 그동안 고친 것
