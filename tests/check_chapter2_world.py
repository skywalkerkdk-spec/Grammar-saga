"""Exercise regional stages and hidden stronghold combat."""
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
        page.evaluate("twOpen('g1')")
        page.get_by_role('button', name='다른 주민 만나기').click()
        page.get_by_role('button', name='(Baker · 제빵사) Belle', exact=False).click()
        page.get_by_role('button', name='The Missing Delivery', exact=False).click()
        page.get_by_role('button', name='닫기', exact=True).click()
        assert not page.evaluate("SV.chapter2World.stages?.regional_1")
        page.get_by_role('button', name='The Missing Delivery', exact=False).click()
        page.get_by_role('button', name='완료', exact=True).click()
        assert page.evaluate("SV.chapter2World.stages.regional_1===1")
        if page.locator('.c2-dialogue-quest-title', has_text='퀘스트 완료').count()or page.get_by_text('퀘스트 완료!').count():
            page.get_by_role('button', name='완료', exact=True).click()
        page.get_by_role('button', name='주민 목록으로', exact=True).click()
        page.get_by_role('button', name='마을 이야기로', exact=True).click()
        cry0=page.evaluate("SV.cry")
        page.evaluate("SV.chapter2World.flags.g1_infiltration_verified=true; SV.chapter2World.flags.tn_infiltration_verified=true; SV.chapter2World.flags.rp_infiltration_verified=true; SV.chapter2World.flags.pn_infiltration_verified=true; SV.chapter2World.flags.hideout_black_hand_briefing_complete=true; G.scr='dsel'; render()")
        page.locator('#c2-library').click()
        page.get_by_role('button', name='Journal', exact=False).click()
        page.get_by_role('button', name='이야기 일지', exact=True).click()
        page.get_by_role('button', name='가면의 창고 입장', exact=True).click()
        page.get_by_role('button', name='던전에 들어가기', exact=True).click()
        page.get_by_label('탐험 목적지').select_option('boss')
        page.locator('#enter').click()
        for _ in range(4):
            page.evaluate("resolve(G.run[G.ei],true)")
            page.wait_for_timeout(300)
            page.locator('#nx').click()
        assert page.evaluate("SV.chapter2World.flags.hideout_black_hand_cleared")
        assert page.evaluate("SV.cry") == cry0
        page.evaluate("SV.chapter2World.flags.book_secret_lantern_complete=true; twOpen('sj')")
        page.get_by_role('button', name='다른 주민 만나기').click()
        page.get_by_role('button', name='The Resting Place · 옛 쉼터').click()
        page.get_by_role('button', name='완료', exact=True).click()
        page.get_by_role('button', name='The Resting Place · 옛 쉼터').click()
        page.get_by_label('탐험 목적지').select_option('chest')
        page.get_by_role('button', name='완료', exact=True).click()
        page.get_by_role('button', name='The tree', exact=True).click()
        assert not page.evaluate("SV.chapter2World.souvenirs?.relic_guild")
        page.get_by_role('button', name='The bird above the circle', exact=True).click()
        assert page.evaluate("SV.chapter2World.souvenirs.relic_guild==='길드 명부 사본'")
        assert page.get_by_text('퀘스트 완료!').count() > 0, '이벤트 완료 보상 대화가 나와야 함'
        page.get_by_role('button', name='완료', exact=True).click()
        page.get_by_role('button', name='마을 이야기로', exact=True).click()
        page.evaluate("SV.chapter2World.flags.regional_1_complete=true; twOpen('g1')")
        page.get_by_role('button', name='다른 주민 만나기').click()
        page.get_by_role('button', name='(Baker · 제빵사) Belle', exact=False).click()
        page.get_by_role('button', name='등불 식료품점').click()
        page.get_by_role('button', name='기념품 받기').click()
        assert page.get_by_role('button', name='기념품 받기').count() == 0
        assert page.evaluate("SV.chapter2World.souvenirs.souvenir_secret_shop_g1")
        page.evaluate("""() => {
          G=fresh('RPG recovery test'); SV=defSave(); SV.cleared=['d6','d7','d8']; SV.mode='rpg';
          G.started=true; twSV('g1').b=1;
          rpgStart(DUNGEONS.find(d=>d.id==='g1'));
        }""")
        enemies = page.evaluate('G.rp.en.length')
        for _ in range(enemies):
            page.evaluate('G.rp.en[G.rp.ei].hp=0; rpgKill()')
            page.wait_for_timeout(120)
        assert page.evaluate("G.scr==='rresult' && SV.rcleared.includes('g1') && !SV.cleared.includes('g1')")
        page.evaluate("twOpen('g1')")
        assert page.get_by_text('던전을 클리어해서 마을의 말이 모두 돌아왔어요!', exact=False).is_visible()
        assert not errors, errors
        print('Passed regional stage dismissal, stage commit, hideout combat, vault, shop and one-time rewards')
