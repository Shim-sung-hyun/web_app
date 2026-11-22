차름 보관함 (media/archive/) — 2026-11-22 만듦

지금 앱에서 쓰지 않지만 버리지 않고 남겨 두는 그림·사진·소리.
선생님(2026-11-22): "사진이나 음성 등의 자료는 가능하면 버리지 말렴 — 나중에 쓸 수도 있으니까."
그래서 그림·소리는 _trash(3개월 뒤 비움)에 넣지 않고 여기에 둔다. 여기는 비우지 않는다.

■ 폴더 = 까닭/원래 자리
  cartoon/    만화풍 그림 — 연필풍으로 바꾸기 전 판(동물 animals/, 무대 소품 stage/nature/곳/)
  replaced/   같은 그림풍으로 다시 받기 전 그림, 손질 전 그림, 모양이 이상했던 그림(까닭은 list.json)
  unused/     쓰지 않게 된 사진·그림·목소리(007·004의 옛 Leda 목소리, 001 시험 사진 등)
  그 아래는 원래 media/ 안의 자리 그대로(stage/legacy/ = 옛 덮개 방식 무대).

■ list.json — 한 줄에 하나
  file 보관함 안 자리 · from 원래 자리 · kind 까닭 · date 넣은 날 · why 까닭 글 · source 어디서 꺼냈나(_trash 또는 git 커밋) · sha 내용 지문
  같은 내용이 앱에서 쓰는 파일과 똑같으면 넣지 않았다(겹침 없음).

■ 넣기: python3 tools/trash.py 경로 --why "이유" [--kind cartoon|replaced|unused]
  그림·소리는 저절로 여기로, 그 밖의 파일(html·글)은 _trash로 간다.
■ 다시 쓰기: 쓰려는 앱 폴더 자리로 git mv(또는 복사)하고 list.json 줄을 지운 뒤 python3 tools/media-index.py.
■ 찾기: python3 tools/find-media.py 낱말 — 보관함도 함께 찾아 '보관'으로 표시한다.
