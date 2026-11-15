숲 그림 받는 곳 (2026-11-13, 원본 색 붓 준비 2026-11-15)
받은 빙 그림을 이 폴더에 이름만 맞춰 올려 주세요. 프롬프트: media/stage/prompts/PROMPTS-new-forest-pencil.txt
  배경  bg.jpg
  소품  종류-1.jpg, 종류-2.jpg   (예: oak-1.jpg, fern-2.jpg — 종류 이름은 프롬프트의 ■ 줄 괄호 안)
  동물  이름.jpg                 (예: saseum.jpg — 프롬프트의 ■ 줄 괄호 안)
Claude가 python3 tools/stage-intake.py nature/new-forest media/stage-beta/nature/new-forest/in 한 줄로 넣고, 넣은 원본은 이 폴더에서 지웁니다.
(이제 넣을 때 받은 원본을 src/이름.jpg로 함께 남겨, 소품 손질의 '원본 색 붓'을 바로 쓸 수 있어요.)

■ 원본 색 붓용 원본 올리기(2026-11-15) — 지금 숲 소품 54장 모두 원본이 저장소에 없어 '원본 색 붓'이 꺼져 있어요.
처음 받은 빙 그림(자르기 전 jpg)을 아래 소품 이름 그대로 이 폴더에 올려 주시면,
Claude가 python3 tools/src-align.py --dir media/stage-beta/nature/new-forest/in media/stage-beta/nature/new-forest 한 줄로 src/에 맞춰 둡니다(소품 그림은 안 바뀜).
손질할 소품 몇 장만 먼저 올려도 됩니다.
  azalea-1 azalea-2 bigboulder-1 bigboulder-2 branchpile-1 branchpile-2 bush-1 bush-2 densethicket-1 densethicket-2 drybracken-1 drybracken-2 fallengiant-1 fern-1 fern-2 fern-3 fir-1 fir-2 greycrag-1 greycrag-2 leafmound-1 leafmound-2 leafmound-3 leafpile-1 leafpile-2 logfern-1 logfern-2 maple-1 maple-2 mossrock-1 mossrock-2 mossrock-3 mushrooms-1 mushrooms-2 oak-1 oak-2 oak-3 pine-1 pine-2 pine-3 reedgrass-1 reedgrass-2 rockfern-1 rockfern-2 rockpile-1 rockpile-2 stump-1 stump-2 tallferns-1 tallferns-2 wildflowers-1 wildflowers-2 youngfirs-1 youngfirs-2 
