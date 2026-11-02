차름 소리 모음 (media/voice)

차름 웹앱이 미리 만들어 둔 Google 목소리(Leda)를 한곳에 모읍니다.
파일 이름이 말(글)만으로 정해지므로, 빠르기나 만든 방식이 다른 소리는 묶음을 나눕니다.
같은 묶음 안에서는 같은 말이면 파일 하나를 여러 앱이 함께 씁니다.

■ 묶음
  leda-0.92/  빠르기 0.92 — 001 도형 찾기 · 003 무지개 찾기 · 005 큰 수 읽기 · 006 자리 이름 익히기 · 008 동물원 · 새 앱
              이름 = 말(문장 조각) SHA-1 앞 16자리 .mp3
              한 글자는 "글자. ○." 속에서 만들어 마지막 마디만 씀
  poem/       004 시 외우기 — 시를 통째로 낭송(빠르기 0.86)한 뒤 줄마다 나눔
              이름 = sha1("시|줄 번호|줄 글") 앞 16자리, index.json에 만든 설정
  leda-0.90/  빠르기 0.90 — 007 낱말 익히기(3,339개, 2026-10-22에 007/voice/leda/에서 옮김)
              이름 = 말(낱말·문장) SHA-1 앞 16자리 .mp3, 한 글자는 "글자. ○." 속에서 만들어 마지막 마디만 씀
              "다 했어요."·"잘했어요." 등 일부는 빠르기 0.78이거나 고쳐 만든 소리 → fixes.json
              leda-0.92와 이름이 같은 파일 10개는 빠르기가 달라 소리도 다름(섞어 쓰지 않음)

■ index.json
  files    이 묶음에 있는 소리 이름 목록. 앱은 이 목록으로 "이 말이 있나"를 봄
           (수업에 필요한 말이 하나라도 없으면 그 수업 전체를 기기 목소리로 — 섞지 않음)
  used_by  이 소리를 쓰는 앱(leda-0.92 · leda-0.90). 앱에서 말을 뺄 때 다른 앱이 쓰는지 보고 지움

■ 앱에서 쓰는 법
  https://shim-sung-hyun.github.io/web_app/media/voice/<묶음>/index.json
  https://shim-sung-hyun.github.io/web_app/media/voice/<묶음>/<이름>.mp3
  앱마다 "말 목록 뽑기"(예: 001 __voiceLines() → voice-lines.json)는 그대로 둠.

■ 새 말 넣기(2026-11-02부터 늘 쓰는 도구)
  1) 제작자: media/voice/voice-maker.html 을 엶(https://shim-sung-hyun.github.io/web_app/media/voice/voice-maker.html)
     묶음·앱 번호 → 앱 말 목록(voice-lines.json) 불러오기 → "없는 문장 찾기" → Google 키 → 만들기 → 들어 보고 zip 받기
     (Google Cloud TTS Chirp3-HD Leda = 지금 목소리와 같음. Azure는 목소리가 달라 앱 말 전체를 다른 묶음으로 만들 때만)
  2) Claude 세션에 zip을 올림 → python3 tools/voice-add.py 받은.zip  (wav → mp3, 한 글자는 마지막 마디만, index.json files·used_by에 더함)
  3) 받침·연음·한 글자를 들어 보고 이상하면 다시 만들기

■ 옮긴 앱 (2026-10-22)
  001 · 003 · 004 · 005 · 006 · 008 → 여기서 읽음(001은 정수기 새 말 10마디까지, 006 자리 이름 5개, 008 191마디 더해 729개 — 008은 2026-10-23, 한 글자 이름 개·소·말·곰·벌은 "글자. ○."의 마지막 마디). 옛 NNN/voice/leda/ 는 2026-10-23 지움
  007 → leda-0.90/ 에서 읽음(parts/post.py 함께). 옛 007/voice/leda/ 는 2026-10-23 지움
