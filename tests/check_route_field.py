"""실제 브라우저: 이프헤이븐 서쪽 길 의뢰 — 의뢰 전엔 길이 닫혀 있고, 수락 후 필드에서 단서→수호자 문제 3개→마을 복귀까지 진행됨"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os,sys
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Q(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
shot=sys.argv[1] if len(sys.argv)>1 else None
def finish(pg):
    for _ in range(14):
        d=pg.locator('dialog[open]')
        if not d.count():return
        nx=d.locator('button',has_text='다음')
        if nx.count() and nx.first.is_enabled():nx.first.click();pg.wait_for_timeout(200);continue
        done=d.locator('button',has_text='완료')
        if done.count():done.first.click();pg.wait_for_timeout(600);return
        return
with ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=root)) as srv:
    Thread(target=srv.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{srv.server_port}/'
    with sync_playwright() as pw:
        br=pw.chromium.launch(executable_path=os.environ.get('GRAMMAR_CHROMIUM'))
        pg=br.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        pg.route('**/*',lambda r:r.continue_() if r.request.url.startswith(url) else r.abort())
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(url)
        def town(stage=None):
            pg.goto(url)
            pg.evaluate("""s=>{G=fresh('Route test');SV=defSave();SV.cleared=['d6','d7','d8'];if(s!==null)SV.chapter2World={version:1,flags:{},stages:{sj_route_wishing_coin:s}};G.started=true;G.scr='dsel';render();}""",stage)
            pg.wait_for_timeout(1500);pg.evaluate("twOpen('sj')")
            pg.get_by_role('button',name='마을 탐험').click();pg.wait_for_timeout(800)
        def go(label,wait=5000):
            pg.locator('select[aria-label="탐험 목적지"]').select_option(label=label);pg.wait_for_timeout(wait)
        town(None);go('서쪽 산길')
        assert pg.locator('[role=status]').filter(has_text='아직 갈 일이 없는 길').count()==1,'의뢰 전에는 길이 닫혀 있어야 함'
        town(1);go('서쪽 산길');finish(pg)
        assert pg.locator('select[aria-label="탐험 목적지"] option',has_text='젖은 발자국').count()==1,'필드가 열려야 함'
        go('어쩌면 도깨비',20000)
        assert pg.locator('[role=status]').filter(has_text='단서가 부족').count()==1,'단서 전에는 수호자와 싸울 수 없음'
        go('젖은 발자국',20000);finish(pg)
        assert pg.get_by_text('단서를 모았습니다').count()==1
        if shot:pg.screenshot(path=shot)
        go('어쩌면 도깨비',20000);finish(pg)
        for key in ['rains','were','would']:
            pg.wait_for_timeout(300)
            pg.locator('.c2-actions button',has_text=key).first.click();pg.wait_for_timeout(400)
        finish(pg)
        st=pg.evaluate("SV.chapter2World.stages.sj_route_wishing_coin")
        assert st==1,'도깨비를 물리쳐도 던전을 클리어하기 전엔 보고 단계가 아님: %s'%st
        go('도깨비의 동굴',20000);finish(pg)
        assert pg.evaluate("G.scr")=='formed' and pg.evaluate("G.dg.id")=='sj','던전 입구에서 이프헤이븐 던전 파티 결성 화면으로 가야 함'
        print('서쪽 길 의뢰(단서→도깨비→던전 입구) 브라우저 흐름 통과 / 오류',errs)
        assert not errs,errs
