버릴 자료 상자 — 안 쓰게 된 그림·파일을 3개월(90일) 두었다가 비운다. 날짜 폴더마다 WHY.txt에 원래 자리와 이유.
넣기: python3 tools/trash.py 경로 --why "이유"   보기: python3 tools/trash.py   비우기: python3 tools/trash.py --empty
되살리기: 날짜 폴더 안의 같은 경로를 원래 자리로 git mv. 앱·도구는 이 폴더를 보지 않는다.
그림·사진·소리는 여기 넣지 않는다(2026-11-22 선생님: 버리지 말 것) — trash.py가 저절로 media/archive/(비우지 않는 보관함)로 보낸다. 예전에 여기 있던 그림·소리 256개도 그리로 옮김.
