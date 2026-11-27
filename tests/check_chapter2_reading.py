"""Exercise the shelf, lock, and notebook flows against the running game."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

with ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=root)) as server:
    Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=os.environ.get('GRAMMAR_CHROMIUM'))
        page = browser.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(url) else route.abort())
        page.set_default_timeout(10000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda event: errors.append(event.text) if event.text.startswith('Chapter II:') else None)
        page.goto(url)
        page.evaluate("""() => {
          G=fresh('Reading test'); SV=defSave(); SV.cry=27; SV.cleared=['d6','d7','d8']; G.started=true; G.scr='dsel'; render();
        }""")
        page.get_by_role('button', name='Chapter II · 그래머 대도서관').click()
        page.get_by_role('button', name='대도서관 열람실', exact=True).click()
        assert page.locator('.c2-shelf-art').count() == 4
        page.get_by_role('button', name='역사 책장').click()
        page.get_by_text('Chronicles of Grammatica', exact=False).click()
        page.get_by_role('button', name='Before the Roads', exact=False).click()
        page.get_by_label('독서 언어').select_option('aligned')
        assert page.locator('.c2-book-pair').count() >= 6
        page.get_by_label('독서 언어').select_option('en')
        assert page.locator('.c2-book-text [lang=en]').count() == 1
        assert page.locator('.c2-book-text [lang=ko]').count() == 0
        page.get_by_role('button', name='책갈피 꽂기').click()
        page.get_by_role('button', name='이 책에 메모 쓰기').click()
        page.get_by_label('메모 제목').fill('도로 연구')
        page.get_by_label('메모 내용').fill('<b>우물과 다리</b>')
        page.get_by_role('button', name='메모 저장').click()
        assert page.get_by_role('status').inner_text() == '메모를 저장했습니다.'
        page.reload()
        page.evaluate("""() => {
          G=fresh('Reading test'); SV=loadSave(G.name); G.started=true; G.scr='dsel'; render();
        }""")
        page.get_by_role('button', name='모험가의 수첩', exact=True).click()
        page.get_by_label('메모 검색').fill('다리')
        page.get_by_role('button', name='원문 열기').click()
        assert page.locator('.c2-book-text [lang=en]').count() == 1
        assert page.get_by_role('button', name='책갈피 지우기').is_visible()
        page.get_by_role('button', name='책장으로').click()
        page.get_by_role('button', name='편집').click()
        assert page.get_by_label('메모 내용').input_value() == '<b>우물과 다리</b>'
        page.evaluate('window.olderNotebook = loadSave(G.name)')
        page.get_by_role('button', name='메모 삭제').click()
        page.get_by_role('button', name='삭제 확인').click()
        page.evaluate('olderNotebook.ts=Date.now()+1; mergeSave(G.name,olderNotebook)')
        assert not page.evaluate('Object.keys(loadSave(G.name).chapter2World.notebook.entries).length')
        assert page.evaluate('loadSave(G.name).cry') == 27
        assert not errors, errors
        print('Passed mobile shelves, reader modes, bookmark, notebook, legacy currency and reload')
