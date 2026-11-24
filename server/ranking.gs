/**
 * Grammar Saga 랭킹 서버 (Google Apps Script)
 * - 주간 랭킹 + 명예의 전당 + 주간 보상 수령
 * - 배포: 웹 앱 / 실행: 나 / 액세스: 모든 사용자
 * - 처음 실행하면 'Grammar Saga 랭킹' 스프레드시트가 내 드라이브에 자동으로 만들어져요.
 */
var TZ = 'Asia/Seoul';
var BOARDS = { dg: 'max', rd: 'max', ar: 'add', acc: 'add' };   // max=최고기록 합산, add=누적
var CAPV = { dg: 1800, rd: 1200, ar: 60, acc: 400 };            // 1회 제출 상한(조작 방지)
var ARENA_DAY_MAX = 15;                                          // 하루 아레나 인정 판 수
var ACC_MIN = 50;                                                // 정확도 랭킹 최소 문제 수
var TOP_N = 50;
// 주간 보상: 각 랭킹(던전/아레나/레이드/정확도)에서 순위별 (c=💎수정, g=💰골드, s=⚒️강화석). 0으로 바꾸면 해당 보상 없음.
var REWARD = [
  { upto: 1,  c: 0, g: 300, s: 5 },
  { upto: 2,  c: 0, g: 200, s: 3 },
  { upto: 3,  c: 0, g: 150, s: 2 },
  { upto: 5,  c: 0, g: 100, s: 1 },
  { upto: 10, c: 0, g: 50,  s: 0 }
];
var CLAIM_WEEKS = 4;
// 셀프던전(학생이 만든 문제): 교사 승인 키 — 반드시 본인만 아는 값으로 바꾸세요(4자 이상). 비어 있으면 승인 기능이 꺼집니다.
var TEACHER_KEY = '';
var SD_DAY_MAX = 3;      // 학생 1명이 하루에 낼 수 있는 문제 수
var SD_WAIT_MAX = 10;    // 승인 대기 중인 문제 최대 개수
var SD_HIDE_AT = 3;      // 신고가 이 수 이상 쌓이면 자동으로 숨김
var SD_REW_OK = 30;      // 문제가 승인되면 💎
var SD_REW_LIKE = 2;     // 좋아요 1개당 💎
var SD_REW_CAP = 150;    // 1회 수령 상한 // 지난 몇 주까지 보상을 받을 수 있는지

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return out_({ ok: true, hello: 'grammar-saga-rank' }); }

function ss_() {
  var P = PropertiesService.getScriptProperties(), id = P.getProperty('SID'), ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create('Grammar Saga 랭킹'); P.setProperty('SID', ss.getId()); }
  return ss;
}
function tab_(ss, name, head) {
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); }
  return sh;
}
function weekKey_(d) { // 그 주 월요일(yyyy-MM-dd) — 주 경계는 월요일 오전 8시
  d = new Date(d.getTime() - 8 * 3600000);
  var dow = Number(Utilities.formatDate(d, TZ, 'u')); // 1=월 ... 7=일
  var m = new Date(d.getTime() - (dow - 1) * 86400000);
  return 'W' + Utilities.formatDate(m, TZ, 'yyyy-MM-dd');
}
function prevWeek_(wk, k) { // wk의 k주 전 주 키
  var base = new Date(wk.slice(1) + 'T12:00:00+09:00');
  return weekKey_(new Date(base.getTime() - 7 * k * 86400000));
}
function reward_(rank) {
  for (var i = 0; i < REWARD.length; i++) if (rank <= REWARD[i].upto) return { c: REWARD[i].c, g: REWARD[i].g, s: REWARD[i].s };
  return null;
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, err: 'bad' }); }
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (d.a === 'submit') return out_(submit_(d));
    if (d.a === 'board') return out_(board_(d));
    if (d.a === 'hof') return out_(hof_(d));
    if (d.a === 'claims') return out_(claims_(d, false));
    if (d.a === 'claim') return out_(claims_(d, true));
    if (d.a === 'sd_submit') return out_(sdSubmit_(d));
    if (d.a === 'sd_list') return out_(sdList_(d));
    if (d.a === 'sd_mine') return out_(sdMine_(d));
    if (d.a === 'sd_rate') return out_(sdRate_(d));
    if (d.a === 'sd_claim') return out_(sdClaim_(d));
    if (d.a === 'sd_pending') return out_(sdPending_(d));
    if (d.a === 'sd_review') return out_(sdReview_(d));
    return out_({ ok: false, err: 'a' });
  } catch (err) {
    return out_({ ok: false, err: 'server', msg: String(err) });
  } finally { lock.releaseLock(); }
}

/* ---------- 사용자 인증(이름 ↔ 토큰 고정) ---------- */
function auth_(ss, n, t) {
  if (typeof n !== 'string' || typeof t !== 'string') return false;
  n = n.trim();
  if (n.length < 1 || n.length > 20 || t.length < 16 || t.length > 100) return false;
  var sh = tab_(ss, '사용자', ['name', 'token', 'first']);
  var v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (String(v[i][0]) === n) return String(v[i][1]) === t;
  sh.appendRow([n, t, new Date()]);
  return true;
}

/* ---------- 점수 제출 ---------- */
function submit_(d) {
  var ss = ss_(), n = String(d.n || '').trim();
  if (!auth_(ss, n, d.t)) return { ok: false, err: 'tok' };
  var board = String(d.board || ''), mode = BOARDS[board];
  if (!mode) return { ok: false, err: 'board' };
  var items = Array.isArray(d.items) ? d.items.slice(0, 8) : [];
  if (!items.length) return { ok: false, err: 'items' };
  var now = new Date(), wk = weekKey_(now), ymd = Utilities.formatDate(now, TZ, 'yyyyMMdd');
  var cache = CacheService.getScriptCache();
  if (mode === 'add' && d.mid) {
    var ck = 'm' + String(d.mid).slice(0, 40);
    if (cache.get(ck)) return { ok: true, dup: true };
    cache.put(ck, '1', 21600);
  }
  var sh = tab_(ss, '점수', ['name', 'board', 'key', 'period', 'value', 'extra', 'ts']);
  var vals = sh.getDataRange().getValues(), idx = {};
  for (var i = 1; i < vals.length; i++) idx[vals[i][0] + '|' + vals[i][1] + '|' + vals[i][2] + '|' + vals[i][3]] = i + 1;
  function upsert(key, period, v, ex) {
    var k = n + '|' + board + '|' + key + '|' + period, r = idx[k];
    if (!r) { sh.appendRow([n, board, key, period, v, ex || '', now]); idx[k] = sh.getLastRow(); return v; }
    var cur = Number(sh.getRange(r, 5).getValue()) || 0;
    if (mode === 'max') { if (v > cur) { sh.getRange(r, 5, 1, 3).setValues([[v, ex || '', now]]); return v; } return cur; }
    sh.getRange(r, 5, 1, 3).setValues([[cur + v, ex || '', now]]); return cur + v;
  }
  if (board === 'ar') { // 하루 판 수 제한
    var hasMat = items.some(function (it) { return it && it.k === 'mat'; });
    if (hasMat) {
      var capKey = n + '|ar|cap' + ymd + '|all', cr = idx[capKey], cnt = 0;
      if (cr) cnt = Number(sh.getRange(cr, 5).getValue()) || 0;
      if (cnt >= ARENA_DAY_MAX) return { ok: true, capped: true };
      if (cr) sh.getRange(cr, 5).setValue(cnt + 1); else { sh.appendRow([n, 'ar', 'cap' + ymd, 'all', 1, '', now]); idx[capKey] = sh.getLastRow(); }
    }
  }
  var cap = CAPV[board], res = {};
  items.forEach(function (it) {
    if (!it || typeof it.k !== 'string' || it.k.length > 24 || it.k.indexOf('cap') === 0) return;
    var v = Number(it.v);
    if (!isFinite(v) || v < 0 || v > cap) return;
    v = Math.round(v);
    var ex = it.ex ? String(JSON.stringify(it.ex)).slice(0, 200) : '';
    upsert(it.k, 'all', v, ex);
    upsert(it.k, wk, v, ex);
    res[it.k] = v;
  });
  return { ok: true, saved: res };
}

/* ---------- 집계 ---------- */
function aggregate_(vals, board, period, keyFilter) {
  var by = {};
  for (var i = 1; i < vals.length; i++) {
    var r = vals[i];
    if (r[1] !== board || String(r[3]) !== period) continue;
    var key = String(r[2]);
    if (key.indexOf('cap') === 0) continue;
    if (keyFilter && key !== keyFilter) continue;
    var n = String(r[0]), o = by[n] || (by[n] = { n: n, s: 0, k: {}, ts: 0 });
    var v = Number(r[4]) || 0;
    o.k[key] = v;
    if (board === 'dg' || board === 'rd') { o.s += v; if (r[5]) { try { o.x = JSON.parse(r[5]); } catch (e) {} } }
    var t = new Date(r[6]).getTime() || 0; if (t > o.ts) o.ts = t;
  }
  var list = Object.keys(by).map(function (n) {
    var o = by[n];
    if (board === 'ar') return { n: n, s: o.k.pts || 0, x: { w: o.k.win || 0, m: o.k.mat || 0 }, ts: o.ts };
    if (board === 'acc') { var tot = o.k.tot || 0, ok = o.k.ok || 0; return { n: n, s: tot >= ACC_MIN ? Math.round(ok / tot * 1000) : -1, x: { ok: ok, tot: tot }, ts: o.ts }; }
    return { n: n, s: o.s, x: o.x || null, c: Object.keys(o.k).length, ts: o.ts };
  }).filter(function (o) { return o.s > 0; });
  list.sort(function (a, b) { return b.s - a.s || a.ts - b.ts || (a.n < b.n ? -1 : 1); });
  list.forEach(function (o, i) { o.r = i + 1; });
  return list;
}
function sheetVals_() { return tab_(ss_(), '점수', ['name', 'board', 'key', 'period', 'value', 'extra', 'ts']).getDataRange().getValues(); }

function board_(d) {
  var board = String(d.board || ''); if (!BOARDS[board]) return { ok: false, err: 'board' };
  var now = new Date(), wk = weekKey_(now);
  var period = d.period === 'week' ? wk : (d.period === 'prev' ? prevWeek_(wk, 1) : 'all');
  var list = aggregate_(sheetVals_(), board, period, d.key ? String(d.key) : '');
  var me = null, n = String(d.n || '');
  if (n) for (var i = 0; i < list.length; i++) if (list[i].n === n) { me = list[i]; break; }
  return { ok: true, week: wk, period: period, total: list.length, rows: list.slice(0, TOP_N), me: me, reward: d.period === 'week' ? REWARD : null };
}

/* ---------- 명예의 전당 ---------- */
function hof_() {
  var vals = sheetVals_(), out = { ok: true, all: {}, records: {}, champs: [] };
  Object.keys(BOARDS).forEach(function (b) { out.all[b] = aggregate_(vals, b, 'all', '').slice(0, 10); });
  // 던전/레이드: 항목별 최고 기록 보유자
  ['dg', 'rd'].forEach(function (b) {
    var best = {};
    for (var i = 1; i < vals.length; i++) {
      var r = vals[i]; if (r[1] !== b || String(r[3]) !== 'all') continue;
      var k = String(r[2]), v = Number(r[4]) || 0;
      if (!best[k] || v > best[k].s) { var x = null; try { x = r[5] ? JSON.parse(r[5]) : null; } catch (e) {} best[k] = { n: String(r[0]), s: v, x: x }; }
    }
    out.records[b] = best;
  });
  // 역대 주간 챔피언
  var weeks = {};
  for (var j = 1; j < vals.length; j++) { var p = String(vals[j][3]); if (p.charAt(0) === 'W') weeks[p] = 1; }
  var nowWk = weekKey_(new Date());
  Object.keys(weeks).sort().reverse().forEach(function (w) {
    if (w === nowWk) return;
    var row = { w: w.slice(1) };
    Object.keys(BOARDS).forEach(function (b) { var l = aggregate_(vals, b, w, ''); if (l.length) row[b] = { n: l[0].n, s: l[0].s }; });
    out.champs.push(row);
  });
  out.champs = out.champs.slice(0, 20);
  return out;
}

/* ---------- 주간 보상 ---------- */
function claims_(d, doClaim) {
  var ss = ss_(), n = String(d.n || '').trim();
  if (!auth_(ss, n, d.t)) return { ok: false, err: 'tok' };
  var vals = sheetVals_(), wk0 = weekKey_(new Date());
  var csh = tab_(ss, '보상수령', ['name', 'week', 'board', 'ts']), cv = csh.getDataRange().getValues(), got = {};
  for (var i = 1; i < cv.length; i++) got[cv[i][0] + '|' + cv[i][1] + '|' + cv[i][2]] = 1;
  var items = [], tot = { c: 0, g: 0, s: 0 };
  for (var k = 1; k <= CLAIM_WEEKS; k++) {
    var w = prevWeek_(wk0, k);
    Object.keys(BOARDS).forEach(function (b) {
      var l = aggregate_(vals, b, w, '');
      for (var j = 0; j < l.length; j++) if (l[j].n === n) {
        var rw = reward_(l[j].r);
        if (rw && !got[n + '|' + w + '|' + b]) {
          items.push({ w: w.slice(1), b: b, r: l[j].r, c: rw.c, g: rw.g, s: rw.s });
          tot.c += rw.c; tot.g += rw.g; tot.s += rw.s;
          if (doClaim) csh.appendRow([n, w, b, new Date()]);
        }
        break;
      }
    });
  }
  return { ok: true, items: items, total: tot, claimed: !!doClaim };
}


/* ================= 셀프던전: 학생이 만든 문제 ================= */
// 시트 '셀프문제' 열: 0 id | 1 이름 | 2 이니셜 | 3 내용(JSON) | 4 상태(wait/ok/no/hide) | 5 시각 | 6 좋아요 | 7 보통 | 8 개선필요 | 9 신고 | 10 승인보상지급 | 11 지급된좋아요 | 12 메모
var SD_HEAD = ['id', 'name', 'ini', 'data', 'status', 'ts', 'L', 'N', 'I', 'R', 'paidA', 'paidL', 'note'];
function sdTab_(ss) { return tab_(ss, '셀프문제', SD_HEAD); }
function sdClean_(s, max) { return String(s == null ? '' : s).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }
function ini_(name) { // 이름 → 이니셜(한글=초성, 영문=각 단어 첫 글자), 최대 3자
  var CH = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', out = '', prev = ' ', s = String(name || '');
  for (var i = 0; i < s.length && out.length < 3; i++) {
    var c = s.charAt(i), code = c.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) out += CH.charAt(Math.floor((code - 0xAC00) / 588));
    else if (/[A-Za-z]/.test(c) && (!/[A-Za-z]/.test(prev) || (c === c.toUpperCase() && prev === prev.toLowerCase() && /[a-z]/.test(prev)))) out += c.toUpperCase();
    prev = c;
  }
  return out || '?';
}
function sdRows_(sh) { return sh.getDataRange().getValues(); }
function sdParse_(cell) { try { return JSON.parse(String(cell)); } catch (e) { return null; } }
function sdAuthT_(d) { var k = String(d.k || ''); return TEACHER_KEY.length >= 4 && k === TEACHER_KEY; }

function sdSubmit_(d) {
  var ss = ss_(), n = String(d.n || '').trim();
  if (!auth_(ss, n, d.t)) return { ok: false, err: 'tok' };
  var q = sdClean_(d.q, 140), a = sdClean_(d.ans, 30), ko = sdClean_(d.ko, 140), ex = sdClean_(d.ex, 200);
  var w = Array.isArray(d.w) ? d.w.slice(0, 4).map(function (x) { return sdClean_(x, 30); }) : [];
  if (q.length < 8 || q.split('____').length !== 2) return { ok: false, err: 'blank' };
  if (!a || w.length !== 4 || w.some(function (x) { return !x; })) return { ok: false, err: 'opts' };
  var seen = {}, all = [a].concat(w);
  for (var i = 0; i < all.length; i++) { var kk = all[i].toLowerCase(); if (seen[kk]) return { ok: false, err: 'same' }; seen[kk] = 1; }
  var sh = sdTab_(ss), v = sdRows_(sh), today = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd'), cnt = 0, wait = 0;
  for (var r = 1; r < v.length; r++) {
    if (String(v[r][3]) && sdParse_(v[r][3]) && sdParse_(v[r][3]).q === q && String(v[r][4]) !== 'no') return { ok: false, err: 'dup' };
    if (String(v[r][1]) === n) {
      if (Utilities.formatDate(new Date(v[r][5]), TZ, 'yyyyMMdd') === today) cnt++;
      if (String(v[r][4]) === 'wait') wait++;
    }
  }
  if (cnt >= SD_DAY_MAX) return { ok: false, err: 'limit' };
  if (wait >= SD_WAIT_MAX) return { ok: false, err: 'pending' };
  var id = 'Q' + new Date().getTime().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  sh.appendRow([id, n, ini_(n), JSON.stringify({ q: q, a: a, w: w, ko: ko, ex: ex }), 'wait', new Date(), 0, 0, 0, 0, 0, 0, '']);
  return { ok: true, id: id };
}
function sdList_(d) {
  var ss = ss_(), n = String(d.n || '').trim();
  if (!auth_(ss, n, d.t)) return { ok: false, err: 'tok' };
  var v = sdRows_(sdTab_(ss)), items = [];
  for (var r = 1; r < v.length; r++) {
    if (String(v[r][4]) !== 'ok') continue;
    var o = sdParse_(v[r][3]); if (!o) continue;
    items.push({ id: String(v[r][0]), q: o.q, a: o.a, w: o.w, ko: o.ko, ex: o.ex, ini: String(v[r][2]), mine: String(v[r][1]) === n });
  }
  for (var i = items.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = items[i]; items[i] = items[j]; items[j] = t; }
  return { ok: true, items: items.slice(0, 300) };
}
function sdMine_(d) {
  var ss = ss_(), n = String(d.n || '').trim();
  if (!auth_(ss, n, d.t)) return { ok: false, err: 'tok' };
  var v = sdRows_(sdTab_(ss)), items = [];
  for (var r = v.length - 1; r >= 1 && items.length < 50; r--) {
    if (String(v[r][1]) !== n) continue;
    var o = sdParse_(v[r][3]) || {};
    items.push({ id: String(v[r][0]), q: o.q, a: o.a, st: String(v[r][4]), L: +v[r][6] || 0, N: +v[r][7] || 0, I: +v[r][8] || 0, R: +v[r][9] || 0, note: String(v[r][12] || '') });
  }
  return { ok: true, items: items };
}
function sdRate_(d) {
  var ss = ss_(), n = String(d.n || '').trim();
  if (!auth_(ss, n, d.t)) return { ok: false, err: 'tok' };
  var id = String(d.id || ''), rt = String(d.r || ''), col = { L: 6, N: 7, I: 8, R: 9 }[rt];
  if (!col) return { ok: false, err: 'r' };
  var sh = sdTab_(ss), v = sdRows_(sh), row = -1;
  for (var r = 1; r < v.length; r++) if (String(v[r][0]) === id) { row = r; break; }
  if (row < 0) return { ok: false, err: 'none' };
  if (String(v[row][1]) === n) return { ok: false, err: 'own' };
  var rs = tab_(ss, '셀프평가', ['id', 'name', 'r', 'ts']), rv = rs.getDataRange().getValues();
  for (var i = 1; i < rv.length; i++) if (String(rv[i][0]) === id && String(rv[i][1]) === n) return { ok: true, dup: true };
  rs.appendRow([id, n, rt, new Date()]);
  var cur = (+v[row][col] || 0) + 1;
  sh.getRange(row + 1, col + 1).setValue(cur);
  if (rt === 'R' && cur >= SD_HIDE_AT && String(v[row][4]) === 'ok') sh.getRange(row + 1, 5).setValue('hide');
  return { ok: true };
}
function sdClaim_(d) { // 내 문제가 승인됐거나 좋아요를 받으면 💎 지급
  var ss = ss_(), n = String(d.n || '').trim();
  if (!auth_(ss, n, d.t)) return { ok: false, err: 'tok' };
  var sh = sdTab_(ss), v = sdRows_(sh), cry = 0, ap = 0, lk = 0;
  for (var r = 1; r < v.length && cry < SD_REW_CAP; r++) {
    if (String(v[r][1]) !== n) continue;
    var st = String(v[r][4]);
    if ((st === 'ok' || st === 'hide') && !(+v[r][10])) { cry += SD_REW_OK; ap++; sh.getRange(r + 1, 11).setValue(1); }
    var newL = (+v[r][6] || 0) - (+v[r][11] || 0);
    if (st === 'ok' && newL > 0) { var g = Math.min(newL, Math.floor((SD_REW_CAP - cry) / SD_REW_LIKE)); if (g > 0) { cry += g * SD_REW_LIKE; lk += g; sh.getRange(r + 1, 12).setValue((+v[r][11] || 0) + g); } }
  }
  return { ok: true, cry: Math.min(cry, SD_REW_CAP), approved: ap, likes: lk };
}
function sdPending_(d) { // 교사용: 승인 대기 + 신고로 숨겨진 문제
  if (!sdAuthT_(d)) return { ok: false, err: 'key' };
  var v = sdRows_(sdTab_(ss_())), wait = [], hide = [];
  for (var r = 1; r < v.length; r++) {
    var st = String(v[r][4]); if (st !== 'wait' && st !== 'hide') continue;
    var o = sdParse_(v[r][3]); if (!o) continue;
    var it = { id: String(v[r][0]), name: String(v[r][1]), ini: String(v[r][2]), q: o.q, a: o.a, w: o.w, ko: o.ko, ex: o.ex, L: +v[r][6] || 0, N: +v[r][7] || 0, I: +v[r][8] || 0, R: +v[r][9] || 0 };
    (st === 'wait' ? wait : hide).push(it);
  }
  return { ok: true, wait: wait.slice(0, 60), hide: hide.slice(0, 40) };
}
function sdReview_(d) { // 교사용: act = ok(승인/복원) | no(반려) | del(삭제)
  if (!sdAuthT_(d)) return { ok: false, err: 'key' };
  var sh = sdTab_(ss_()), v = sdRows_(sh), id = String(d.id || ''), act = String(d.act || '');
  for (var r = 1; r < v.length; r++) {
    if (String(v[r][0]) !== id) continue;
    if (act === 'del') { sh.deleteRow(r + 1); return { ok: true }; }
    if (act === 'ok') { sh.getRange(r + 1, 5).setValue('ok'); if (+v[r][9] >= SD_HIDE_AT) sh.getRange(r + 1, 10).setValue(0); return { ok: true }; }
    if (act === 'no') { sh.getRange(r + 1, 5).setValue('no'); sh.getRange(r + 1, 13).setValue(sdClean_(d.note, 60)); return { ok: true }; }
    return { ok: false, err: 'act' };
  }
  return { ok: false, err: 'none' };
}
