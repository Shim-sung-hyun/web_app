차름 사진 모음 (media/photos)

차름 웹앱이 쓰는 모든 실제 사진을 여기 한곳에 모읍니다.
앱은 photos.json 목록을 읽고, 자기에게 맞는 사진만 골라 씁니다.

■ 폴더
  media/photos/<id>/photo.jpg   사진(긴 쪽 1280, 위치 정보 지움)
  media/photos/<id>/art.jpg     끝 그림(사진을 옮긴 깔끔한 그림, 있으면)
  media/photos/<id>/line.png    색칠 도안(있으면)
  media/photos/photos.json      목록
  media/photos/review.html      기증 사진 확인 화면(제작자용)

■ photos.json 한 줄
  id        영문 이름(폴더 이름과 같음). 기증 사진은 d + 대기함 번호
  title     물건 이름(학생이 아는 말, "이것" 금지)
  source    maker(제작자가 찍음) / donated(선생님 기증, 기증자 이름은 남기지 않음)
  added     목록에 넣은 날
  privacy   maker-checked = 제작자가 눈으로 사람·얼굴·이름·번호·번호판·학교 이름 없음을 확인
  check     기증 때 앱 검사: gemini(Gemini 검사 통과) / none(키가 없어 검사 안 함) / maker(제작자 사진)
  tags      장소·주제(교실·화장실·급식실·바깥 …), 앱이 고를 때 씀
  files     photo·art·line 파일(이 폴더 기준 주소)
  uses      앱별로 쓸 수 있는지
            shape  : 001 일상 속 도형 찾기 — ok=true만 예시로, shapes = 도형 분석(0~1000 좌표)
            puzzle : 002 그림 조각 맞추기 — true면 "일상 그림"으로(art 사용)

■ 앱에서 쓰는 법
  목록: https://shim-sung-hyun.github.io/web_app/media/photos/photos.json
  파일: 목록의 base + files.photo (예: .../media/photos/bell/art.jpg)
  늘 GitHub 절대 주소로, 캔버스에 그리면 crossOrigin='anonymous'.

■ 새 사진 넣기
  1) 기증 → review.html에서 골라 zip(폴더 + donations.json)
  2) Claude에게 보내면: 개인 정보 다시 확인 → 001 도형 분석(sample-maker) → 끝 그림·도안 → 목록에 추가
  3) 빼 달라는 요청이 오면 그 폴더와 목록 줄을 지움

■ 옛 주소
  001/samples/ 는 001·002가 새 목록으로 옮긴 뒤(2026-10-22) 목록을 못 받을 때의 대비로만 남겨 둠.
  선생님 확인이 끝나면 지움. 그 뒤로 예시 사진을 고칠 때는 이 폴더와 photos.json만 고침.
  (sample-maker·art-maker·line-maker는 아직 001/samples 꼴로 내보내므로, 새 예시는 Claude가 이 꼴로 옮겨 넣음)
