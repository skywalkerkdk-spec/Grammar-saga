from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json
import os
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'story/STORY_DATA.json').read_text())
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=root))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('GRAMMAR_CHROMIUM'),args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    page.route('**/*',lambda route: route.continue_() if route.request.url.startswith(url) else route.abort())
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda msg:errors.append(msg.text) if msg.text.startswith('Chapter II:') else None)

    page.goto(url)
    page.evaluate("""() => {
      G=fresh('Full Chapter II QA');SV=defSave();SV.level='beginner';G.started=true;
      G.scr='dsel';SV.cleared=['d6','d7','d8'];SV.cry=9;SV.rg=6;saveNow();render();
    }""")
    page.locator('#c2-library').click()
    room=lambda name: page.locator('dialog').get_by_role('button',name=name,exact=False)
    room('문법 자료실').click()
    page.get_by_role('button',name='be동사',exact=True).click()
    page.get_by_role('button',name='이중 언어 예문',exact=True).click()
    assert not page.get_by_label('대화 표시 모드').locator('option[value=natural]').count()
    assert page.locator('.c2-line[lang=en]').text_content().startswith('I am')
    page.get_by_role('button',name='닫기',exact=True).click()
    page.get_by_role('button',name='is',exact=True).click()
    assert '3인칭 단수' in page.locator('[role=status]').inner_text()
    room('문법 자료실로').click()
    room('대도서관으로').click()
    room('세계관 도감').click()
    assert page.locator('dialog details').count()==18
    assert page.locator('dialog details li').count()==72
    room('대도서관으로').click()
    room('몬스터 도감').click()
    assert page.locator('dialog details').count()==18
    assert page.locator('dialog canvas').count()==0
    room('대도서관으로').click()
    room('모험 일지').click()
    assert page.get_by_text('동료 기록 미발견',exact=False).count()==8
    room('특별 퀘스트 일지').click()
    assert page.get_by_text('Passive Lake',exact=False).count()>=1
    room('대도서관으로').click()
    room('대도서관으로').click()
    room('비밀 기록실').click()
    assert page.get_by_role('button',name='Sanctuary of Silence',exact=False).count()==0
    room('대도서관으로').click()
    room('그라마티카 복원실').click()
    assert page.get_by_text('미수집',exact=False).count()==18
    room('Beville · 비빌 방문').click()
    page.get_by_role('button',name='마을 도착 장면',exact=True).click()
    assert 'The welcome desk is closed.' in page.locator('.c2-line[lang=en]').text_content().replace(' / ',' ')
    room('완료').click()
    assert page.get_by_role('button',name='마을 도착 장면 다시 보기',exact=True).count()==1
    page.evaluate("SV.rcleared.push('g1');twOpen('g1')")
    page.get_by_role('button',name='마을 회복 장면',exact=True).click()
    room('완료').click()
    page.get_by_role('button',name='The First Step',exact=True).click()
    room('건너뛰기').click()
    room('동료 기록 남기기').click()
    assert page.evaluate("SV.chapter2.episodes.g1.seenEvents['companion:Subject']")
    page.evaluate("""ids=> {
      for(const id of ids) SV.cleared.push(id);
      SV.chapter2.episodes = Object.fromEntries(ids.map(id=>[id,{accepted:true,rewardClaimed:true,registered:false,seenEvents:{}}]));
      G.scr='dsel';render();
    }""",[e['id'] for e in data['episodes']])
    page.locator('#c2-library').click()
    room('그라마티카 복원실').click()
    page.get_by_role('button',name='등록',exact=True).first.click()
    assert '1 / 18' in page.locator('.c2-body').inner_text()
    room('가져온 페이지 모두 등록').click()
    assert '18 / 18' in page.locator('.c2-body').inner_text()
    assert page.get_by_role('button',name='등록',exact=True).count()==0
    room('대도서관으로').click()
    room('비밀 기록실').click()
    for title in ['The Shared Mark','The Fallen Guardians','The Created Monsters','The Night of the Theft','The Black Seal','The Last Warning']:
        room(title).click()
        room('완료').click()
    room('Sanctuary of Silence').click()
    room('성역 입장').click()
    room('건너뛰기').click()
    page.locator('#enter').click()
    assert page.evaluate("G.run.length===18 && new Set(G.run.map(q=>q.pool)).size===18 && new Set(G.run.map(q=>q.phase)).size===4")
    print('Passed library rooms, legacy recovery, companion event, unique pages, milestones and finale generation',flush=True)
    for i in range(18):
        page.evaluate("""() => {
          const e=G.run[G.ei];
          document.querySelector('#qc [data-i="'+e.answer+'"]').click();
        }""")
        page.locator('#nx').wait_for()
        page.wait_for_timeout(240)
        page.locator('#nx').click()
    page.get_by_role('button',name='Chapter II 엔딩 보기',exact=True).click()
    room('건너뛰기').click()
    assert page.evaluate("SV.cleared.includes('sanctuary_of_silence') && SV.chapter2.seenEvents.finaleTitle==='Guardian of Language'")
    assert page.evaluate("SV.cry===9 && SV.rg===6")
    assert not errors, errors
    print('Passed all 18 in-engine battle answers, ending and cosmetic-only reward',flush=True)
