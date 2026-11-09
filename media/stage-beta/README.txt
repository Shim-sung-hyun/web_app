무대 베타(stage-beta) — 무대 설치도구로 다시 만드는 새 무대를 모으는 자리 (2026-11-09 선생님 결정)

- 기존 무대(media/stage/nature/<12곳>)는 건드리지 않는다. 설치도구(media/stage/install.html)로 12곳을 새로 만들어 여기에 넣는다.
- 새 무대는 밑동 덮개 없이, 소품 그림 자체에 밑동의 흙·풀을 그린다(2026-11-09). 그래서 여기 무대에는 skirt/ 가 없다.
- 구조는 media/stage 와 같다: <갈래>/<장소>/ (bg.jpg · items/*.webp · stage.json), 차림표 index.json.
  · 설치도구 '직접 저장': 폴더 고르기에서 media/stage-beta 를 고름(index.json 이 있어야 함).
  · 'ZIP 받기': ZIP을 이 폴더에 풀고 index-entry.json 내용을 index.json 에 합침(어려우면 ZIP을 Claude 대화에 올리면 넣어 줌).
- 보기: 무대 시험 페이지에 ?root=stage-beta 를 붙여 연다.
  https://shim-sung-hyun.github.io/web_app/media/stage/test.html?root=stage-beta
- 12곳이 다 되면 기존 media/stage/nature/ 를 새 것으로 완전히 바꾸고(덮개 없는 판), 기존 소품을 더 쓸지는 그때 선생님이 정한다.
  바꿀 때 앱(008 베타 등)이 부르는 주소·hide-index.json 도 함께 고친다.

■ 무대 하나를 완성하는 순서(2026-11-09, 숲 견본으로 정함 — 나머지 11곳도 이대로)
1. 설치도구 1단계: 장소 설명(영어) · 소품 8종류와 실제 높이 · 판 수 3(판 2 = 같은 종류 다른 모양, 판 3 = 새 종류) → 프롬프트 복사
2. 그림 받기: ① 표준 장면 ② 빈 배경 ③ 소품 판 1·2·3 ④ 큰 그림(도구가 셈한 것) ⑤ 가까운 큰 줄기·바위처럼 가장자리에 설 것 두어 장(해당하는 곳만)
3. 기존 무대(media/stage/nature/<곳>)의 소품 중 밑동이 자연스럽고 해상도가 괜찮은 것을 골라 빌려 씀(from ../stage/nature/<곳>) — Claude가 새 배경에 놓아 보고 고름
4. 설치도구로 확정하거나 원본 그림을 Claude에게 줌 → Claude가 잘라(글자·흰 틈·땅 줄 지우기) media/stage-beta/nature/<곳>/에 넣고, 지평선·빽빽함(compose)·큰 것의 깊이(ground)를 맞춤
5. 무대 보기(?root=stage-beta)와 숨기기 시험대에서 확인 → 어긋나면 '판 번호 + 어긋난 원리'로 고침
6. 12곳이 다 되면 기존 무대를 새 판으로 바꾸고 008을 무대 위에서 새로 짬

■ 지금 들어 있는 것
- nature/new-forest 숲(2026-11-09, 선생님이 설치도구로 만든 첫 견본): 배경·표준 장면·소품 8개. 별 표시는 Claude가 지움.
  지평선은 ZIP 기본값(.36)이 배경과 맞지 않아 빈 땅이 시작하는 줄에 맞춰 .64·땅 시작 .66으로 고침(설치도구 '이 배치에서 익히기'로 다시 맞추면 됨).
  standard.jpg = 숲 표준 장면 → 다른 곳을 만들 때 그림풍 본보기로 붙임(설치도구 1단계 ① 안내의 forest 대신 new-forest 폴더).
- 기존 소품 다시 쓰기(2026-11-09): 기존 숲 소품 18개를 새 배경에 놓아 보고, 밑동이 원래 자연스러운 8개만 빌려 씀(복사 안 함, "from":"../stage/nature/forest" — 베타 자리 기준 상대 주소):
  통나무 log · 버섯 핀 통나무 rottenlog · 그루터기 stump · 나뭇가지 더미 branchpile · 이끼 바위 mossrock · 버섯 mushrooms · 쓰러진 큰 나무 fallengiant · 큰 이끼 바위 bigboulder(뒤 둘은 300점 그림이라 먼 쪽 절반에만).
  안 쓴 것: 참나무·소나무·전나무(작은 그림·밑동이 가늘게 끊김), 덤불·진달래 숲(밑이 반듯하게 잘림), 고사리·키 큰 고사리·가시덤불(줄기 끝이 맨 땅에 떠 보임), 가까운 줄기 2개(밑이 네모로 잘림).
- 소품마다 kind(종류: oak·fir·log·fern·bush·rock·mushroom·leaves·stump·branch) — 3판(한 종류 3가지 모양)을 받으면 같은 종류끼리 묶임.
- 판 2·3(2026-11-09, Claude가 잘라 넣음 — 원본 그림만 받음): 판 2 = 같은 종류 다른 모양 item-01-2…item-08-2(참나무 2·전나무 2는 큰 그림),
  판 3 = 새 종류 maple 어린 단풍나무·smallpine 작은 소나무(둘 다 큰 그림)·tallferns·azalea·wildflowers·raspberry·mossmound·rootmass. 칸 글자는 작은 조각으로 지움.
  안 쓴 것: 단풍잎이 달린 소나무 큰 그림 1장(두 나무가 섞임). 전나무 2 큰 그림 밑의 가로 땅 줄은 지움. 숲 소품 모두 32가지.
- 가까운 줄기 2(2026-11-09): neartrunk-oak·neartrunk-pine(뿌리가 흙·이끼로 스며드는 고해상도, role frame). 화면 좌우 가장자리에, 위는 화면 밖, 판마다 반쯤.
  stage.json frameShow(그림 폭 중 화면 안에 보일 몫, .55)·frameY(밑동 높이 [.96,1]) — 기본값(.35, .9~.98)은 옛 줄기용. 땅 높이의 가는 가로줄은 지움.
- 줄기가 선 판엔 소품을 더(compose.frameExtra, 기본 3~5 — 줄기 쪽은 피함): 줄기 판 평균 30개 · 없는 판 25개. 숨길 때 동물끼리 몰리지 않게(한 소품 뒤에 여럿 겹치던 것).
- 숲 견본 정리 끝(2026-11-09). 다음 곳은 선생님이 고름.
