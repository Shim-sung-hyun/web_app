차름 사진 모음 (media/photos)

차름 웹앱이 쓰는 모든 실제 사진을 여기 한곳에 모읍니다.
한 앱(도형 찾기 같은)만을 위한 것이 아니라, 낱말·도형·색·장소·분류·퍼즐 등 앞으로 만들 여러 학습에
계속 쓰는 공용 자료입니다. 그래서 사진마다 무엇이 보이는지(category·objects·place·colors·shapes)와
권리 검토(rights)를 함께 적어 둡니다. 앱은 photos.json 목록을 읽고, 자기에게 맞는 사진만 골라 씁니다.
기증 사진을 넣는 절차와 권리 검토 기준은 REVIEW.md.

■ 폴더
  media/photos/<id>/photo.jpg   사진(긴 쪽 1280, 위치 정보 지움)
  media/photos/<id>/art.jpg     끝 그림(사진을 옮긴 깔끔한 그림, 있으면)
  media/photos/<id>/line.png    색칠 도안(있으면)
  media/photos/photos.json      목록
  media/photos/review.html      기증 사진 확인 화면(예전 방식, 확인 글자) — 지금은 charum.org/donate-admin.php(관리자 로그인)
  media/photos/REVIEW.md        기증 사진 정리 절차·권리 검토 기준(Claude가 따름)

■ photos.json 한 줄
  id        영문 이름(폴더 이름과 같음). 기증 사진은 d + 대기함 번호
  title     물건 이름(학생이 아는 말, "이것" 금지)
  category  가전·전자기기 / 가구 / 생활용품 / 학용품 / 음식 / 동물 / 식물 / 탈것 / 길·시설 / 학교 시설 / 건물 / 자연 / 작품 / 놀이 / 옷 / 기타
  objects   사진에 또렷이 보이는 것들(주인공 먼저)
  place     교실·복도·화장실·급식실·운동장·바깥·집·가게·교통·기타
  colors    주된 색 2~3개
  shapes    또렷한 모양(원·세모·네모·원기둥 …)
  rights    권리 검토: owner(제작자/기증) · consent · review(검토한 날) · status(ok / check = 쓰기 전에 한 번 더 볼 것) · notes
  source    maker(제작자가 찍음) / donated(선생님 기증, 기증자 이름은 남기지 않음)
  added     목록에 넣은 날
  privacy   maker-checked = 제작자가 눈으로 사람·얼굴·이름·번호·번호판·학교 이름 없음을 확인
  check     기증 때 앱 검사: gemini(Gemini 검사 통과) / none(키가 없어 검사 안 함) / maker(제작자 사진)
  tags      장소·주제(교실·화장실·급식실·바깥 …), 앱이 고를 때 씀
  files     photo·art·line 파일(이 폴더 기준 주소)
  uses      앱별로 쓸 수 있는지
            shape  : 001 [차름 수학] 도형 찾기 — ok=true만 예시로, shapes = 도형 분석(0~1000 좌표)
            puzzle : 002 [차름 놀이] 내 그림 퍼즐 — true면 "일상 그림"으로(art 사용)

■ 앱에서 쓰는 법
  목록: https://shim-sung-hyun.github.io/web_app/media/photos/photos.json
  파일: 목록의 base + files.photo (예: .../media/photos/bell/art.jpg)
  늘 GitHub 절대 주소로, 캔버스에 그리면 crossOrigin='anonymous'.

■ 기증 받는 길 (2026-10-22)
  · 001 "내 사진" 아래 기증 (도형 분석·끝 그림 함께, Gemini 검사 필수)
  · 휴대폰 "폰에서 받기"(photo-send.html) 아래 "이 사진 기증하기"(선택, 기본 꺼짐, 물건 이름 + 동의 칸)
    휴대폰에 Gemini 키가 있으면 검사, 없거나 실패하면 check=none(확인 화면에 "검사 안 함")
  · 서버 원본은 저장소 server/donate.php(확인 글자는 서버에서만 넣음)

■ 제작자가 사진 모으는 두 길 (2026-10-23)
  · 구글 드라이브 "차름 사진함" 폴더(https://drive.google.com/drive/folders/1xVl84AgRAWjzLmAcal-EYFVXf14FflfQ)
    휴대폰 드라이브 앱으로 올려 두고, 채팅에서 "사진함 정리해 줘" → Claude가 사진을 직접 보고
    개인 정보 검사·물건 이름·장소 태그·쓸 앱을 정해 확인 화면(한 장짜리 페이지)으로 보여 줌 → 고른 것만 이 폴더에 넣음.
    이미 넣은 드라이브 파일은 inbox-log.json(드라이브 파일 id → 사진 id 또는 "뺌")에 적어 다시 하지 않음. Gemini 키·서버 필요 없음.
  · 사진 모으기 페이지 collect.html(휴대폰): 여러 장 찍기·고르기 → 제작자 Gemini 키로 이름·장소·태그·쓸 앱·개인 정보 판단
    (사람·얼굴·이름·번호·번호판·학교 이름이 보이면 막음, 키 없으면 직접 이름 + 검사 안 함) → 기증함(app 000, 하루 60장) → review.html

■ 새 사진 넣기
  1) 기증 → review.html에서 골라 zip(폴더 + donations.json)
  2) Claude에게 보내면: 개인 정보 다시 확인 → 001 도형 분석(sample-maker) → 끝 그림·도안 → 목록에 추가
  3) 빼 달라는 요청이 오면 그 폴더와 목록 줄을 지움

■ 키 없을 때 예시 그림 (demo/, 목록에 넣지 않음)
  demo/shape-demo.jpg   001 예시(감·스피커·휴대폰·책, 도형 자리는 001 SAMPLE_SHAPES) — charum 저장소 semple.jpeg를 세워 1280으로 줄임
  demo/puzzle-demo.jpg  002 예시(책상·노트북)

■ 옛 주소
  001/samples/ 와 002/semple.jpeg, charum 저장소 images/semple.jpeg 를 읽던 곳은 2026-10-23에 모두 이리로 옮기고 지움.
  예시 사진을 고칠 때는 이 폴더와 photos.json만 고침.

■ 제작자용 만들기 화면 (001 폴더, 2026-10-23부터 이 목록을 읽고 이 꼴로 내보냄)
  001/sample-maker.html  도형 분석·확인 — uses.shape 가 있고 ok=false 인 사진만 → "photos.json" 통째로 내려받기
  001/art-maker.html     끝 그림 — 모든 사진(그림 없는 것이 위, "모두 그리기"는 그림 없는 것만) → zip(<id>/art.jpg)
  001/line-maker.html    색칠 도안 — 001에서 확인했고 도안이 없는 사진만, 본보기는 shoe-rack/art·line → zip(<id>/line.png)
  받은 photos.json·zip을 Claude에게 보내면 이 폴더에 그대로 넣음
