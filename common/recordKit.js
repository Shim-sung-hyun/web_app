/* 차름 공통 모듈: 기록 저장·CSV(recordKit) — 원본은 common/recordKit.js. 앱 안의 <script id="recordKit">는 tools/sync-modules.py가 복사해 넣은 것이라 손으로 고치지 않는다.
   기록은 기기에만(localStorage). 무엇을 한 줄에 적을지·요약 꼴은 앱마다, 저장하고 CSV로 내보내고 불러오는 손놀림만 여기서 한곳에(2026-11-25).
   RecordKit.ls.get(이름) / .set(이름, 글 또는 null=지움)   localStorage를 막아 둔 기기에서도 멈추지 않음(없으면 null)
   RecordKit.json(이름, 없을 때 값) / RecordKit.save(이름, 값)   JSON으로 읽고 쓰기
   RecordKit.csv(머리 칸 배열, 줄 배열)   엑셀에서 바로 열리는 CSV 글(한글 깨짐 막는 BOM, 줄 끝 \r\n, 쉼표·따옴표·줄바꿈이 든 칸만 따옴표)
   RecordKit.download(파일 이름, 글)     CSV 파일로 내려받기
   RecordKit.parse(글)                    CSV 글 → 줄 배열(맨 앞 BOM은 뗌, 칸이 하나뿐인 빈 줄은 뺌) */
window.RecordKit = (function () {
  'use strict';
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  };
  function json(k, d) { try { var v = JSON.parse(ls.get(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { ls.set(k, v == null ? null : JSON.stringify(v)); }
  function cell(v) { v = String(v == null ? '' : v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function csv(head, rows) { return '﻿' + [head].concat(rows).map(function (r) { return r.map(cell).join(','); }).join('\r\n'); }
  function download(name, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function parse(t) {
    t = String(t || '').replace(/^﻿/, '');
    var rows = [], r = [], c = '', q = false;
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { r.push(c); c = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); rows.push(r); r = []; c = ''; }
      else c += ch;
    }
    if (c || r.length) { r.push(c); rows.push(r); }
    return rows.filter(function (x) { return x.length > 1 || (x[0] || '').trim() !== ''; });
  }
  return { ls: ls, json: json, save: save, cell: cell, csv: csv, download: download, parse: parse };
})();
