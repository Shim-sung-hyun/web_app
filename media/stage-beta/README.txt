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
