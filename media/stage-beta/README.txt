무대 베타(stage-beta) — 무대 설치도구로 다시 만드는 새 무대를 모으는 자리 (2026-11-09 선생님 결정, Claude 정리 2026-11-09)

- 기존 무대(media/stage/nature/<12곳>)는 건드리지 않는다. 설치도구(media/stage/install.html)로 12곳을 새로 만들어 여기에 넣는다.
- 새 무대는 밑동 덮개 없이, 소품 그림 자체에 밑동의 흙·풀을 그린다. 원리는 media/stage/README.txt '장면의 원리'.
- 구조는 media/stage 와 같다: <갈래>/<장소>/ (bg.jpg · standard.jpg · items/*.webp · stage.json), 차림표 index.json.
  · 설치도구 '직접 저장': 폴더 고르기에서 media/stage-beta 를 고름. · 'ZIP 받기': 이 폴더에 풀고 index-entry.json 을 index.json 에 합침(어려우면 Claude 대화에 올림).
- 보기(올린 뒤 1~2분): 무대 보기 https://shim-sung-hyun.github.io/web_app/media/stage/test.html?root=stage-beta
  숨기기 시험 https://shim-sung-hyun.github.io/web_app/media/stage/hide-test.html?place=nature/new-forest (다른 곳은 place=nature/new-<곳>)
- 12곳이 다 되면 기존 media/stage/nature/ 를 새 것으로 바꾸고(앱이 부르는 주소·hide-index.json도), 기존 소품을 더 쓸지는 그때 선생님이 정한다.

■ 무대 하나를 완성하는 순서(숲 견본으로 정함 — 나머지 11곳도 이대로)
1. 설치도구 1단계: '자연 장소 고르기'에서 곳을 고름 → 이름·배경 설명·지평선·소품(판 1·3)·가장자리 큰 것·동물·블록이 들어감(media/stage/places.json).
   '숨길 동물' 칸에서 가장 큰 동물을 가릴 소품이 있는지 봄 — 없으면 큰 소품을 더 적음. 프롬프트 복사.
2. 그림 받기: ① 표준 장면(숲 standard.jpg를 그림풍 본보기로) ② 빈 배경 ③ 소품 판 1·2·3 ④ 큰 그림(도구가 셈한 것 — 앞에서 1.2배 넘게 늘어날 소품) ⑤ 가장자리 큰 것(해당하는 곳만)
3. 설치도구로 확정하거나 원본 그림을 Claude에게 줌 → Claude가 잘라(글자·흰 틈·땅 줄 지우기, 무섭거나 훼손된 꼴 빼기) 넣고 지평선·빽빽함·큰 것의 깊이를 맞춤.
   기존 무대 소품 중 밑동이 자연스럽고 해상도가 괜찮은 것은 빌려 씀(from ../stage/nature/<곳>).
4. 무대 보기·숨기기 시험에서 확인 → 어긋나면 '판 번호 + 어긋난 원리'로 원리를 고침.

■ nature/new-forest 숲(견본, 끝남 2026-11-09)
- 배경(별 지움, 지평선 .64·땅 시작 .66) · standard.jpg · 소품 33가지 + 가장자리 큰 줄기 2(neartrunk-oak·pine, frameShow .55·frameY [.96,1]).
- 빌려 쓰는 기존 소품: rottenlog·stump·mushrooms(from ../stage/nature/forest). 나머지는 새 그림(가까이 올 것은 큰 그림 18장으로 바꿈).
- 뺀 것(_trash): rootmass(잘린 손처럼 보임), 뿌리가 손가락처럼 꼬인 쓰러진 나무 1장, 밑이 반듯한 줄로 끝난 고사리 1장, 큰 그림으로 바뀐 예전 판 그림 10장.
- stage.json: compose 빽빽하게(clusters 5~7·maxSame 4) · blocks '바위와 나무'·'덤불 무리' · animals 숲 동물 8(다람쥐·너구리·토끼·멧돼지·사슴·산양·곰·호랑이).
- 아직 조금 작은 그림: item-03-2(161점, 맨 앞 끝에서만 아주 조금).

■ nature/new-grassland 초원(설치도구 첫 적용, 2026-11-10)
- stage-beta에 배경·표준 장면·소품 25가지, blocks 2종, 동물 10종을 적용. 무대 보기와 숨기기 시험에서 확인.
- 보기: test.html?root=stage-beta#nature/new-grassland · hide-test.html?place=nature/new-grassland

■ 다음
- 사막 설치 결과를 확인해 stage-beta에 넣고 무대 보기·숨기기 시험. 물·하늘·땅속 자리(물낯·물속·흙 속)는 그곳을 만들 때 원리 11~15와 2번(두 자리에 걸친 것)을 무대에 넣음.
- 숨기기 시험은 지금 땅 무대(숲·초원·사막·극지방·갯벌·들판)만 맞음.
