"""주민 걷기: 시트가 있으면 걷고, 대화 중 멈추고, 없으면 기존 그림 유지, 오류 없음 (합성 시트 사용, 디스크에 파일을 남기지 않음)"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os,io,sys
from pathlib import Path
from threading import Thread
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Q(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
def sheet():
    im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im)
    for r in range(4):
        for k in range(4):
            sw=[-4,0,4,0][k];d.rectangle((k*128+44+sw,r*128+16,k*128+84+sw,r*128+116),fill=(200,60+r*40,60,255))
    b=io.BytesIO();im.save(b,'PNG');return b.getvalue()
def front():
    im=Image.new('RGBA',(128,128));ImageDraw.Draw(im).rectangle((40,18,88,118),fill=(30,90,160,255))
    b=io.BytesIO();im.save(b,'PNG');return b.getvalue()
SH=sheet();FR=front()
with ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=root)) as srv:
    Thread(target=srv.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{srv.server_port}/'
    with sync_playwright() as pw:
        br=pw.chromium.launch(executable_path=os.environ.get('GRAMMAR_CHROMIUM'))
        pg=br.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        pg.route('**/*',lambda r:r.continue_() if r.request.url.startswith(url) else r.abort())
        pg.route('**/art/npc/sprites/npc_g1_o0_walk.webp',lambda r:r.fulfill(status=200,body=SH,content_type='image/png'))  # 나중에 등록한 규칙이 먼저 적용됨
        pg.route('**/art/npc/sprites/npc_g1_o1.webp',lambda r:r.fulfill(status=200,body=FR,content_type='image/png'))
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(url)
        pg.evaluate("""()=>{G=fresh('Walk test');SV=defSave();SV.cleared=['d6','d7','d8'];G.started=true;G.scr='dsel';render();
          NPC_ATLAS['g1_o0']={front:{sheet:'art/npc/sprites/npc_g1_o0.webp',ready:false},walk:{sheet:'art/npc/sprites/npc_g1_o0_walk.webp',ready:true,cols:4,rows:4,cell:128,idle:1}};\n          NPC_ATLAS['g1_o1']={front:{sheet:'art/npc/sprites/npc_g1_o1.webp',ready:true}};}""")
        pg.evaluate("twOpen('g1')")
        pg.get_by_role('button',name='비빌 마을 탐험').click()
        pg.wait_for_timeout(800)
        sp=pg.locator('.c2-npc-sprite')
        want=pg.evaluate("Object.entries(NPC_ATLAS).filter(([k,v])=>k.startsWith('g1_')&&v.walk&&v.walk.ready).length")
        assert sp.count()==want,'걷기 스프라이트는 시트 있는 주민 수와 같아야 함: %d/%d'%(sp.count(),want)
        pins=pg.locator('.c2-field-pin').count();imgs=pg.locator('.c2-field-pin img').count()
        assert imgs>=2,'시트 없는 주민은 기존 정지 그림 유지'
        assert pg.locator('.c2-field-pin img[src*="npc_g1_o1.webp"]').count()==1,'정면 그림이 등록된 주민은 새 그림으로 바뀌어야 함'
        assert pg.evaluate("getComputedStyle(document.querySelector('.c2-npc-sprite')).backgroundSize").split(' ')[0]!='auto'
        pos0=pg.evaluate("document.querySelector('.c2-npc-sprite').closest('.c2-field-pin').style.cssText")
        moved=False
        for _ in range(40):
            pg.wait_for_timeout(500)
            if pg.evaluate("document.querySelector('.c2-npc-sprite').closest('.c2-field-pin').style.cssText")!=pos0:moved=True;break
        assert moved,'20초 안에 한 번도 걷지 않음'
        # 대화 중 정지
        pg.evaluate("document.querySelector('.c2-npc-sprite').closest('.c2-field-pin').click()")
        pg.wait_for_timeout(3000)
        dlg=pg.evaluate("!!document.querySelector('dialog[open]')")
        if dlg:
            a=pg.evaluate("document.querySelector('.c2-npc-sprite').closest('.c2-field-pin').style.cssText");pg.wait_for_timeout(3500)
            b=pg.evaluate("document.querySelector('.c2-npc-sprite').closest('.c2-field-pin').style.cssText")
            assert a==b,'대화 중에는 멈춰야 함'
        print('걷기 시작 확인 / 대화 열림:',dlg,'/ 정지 그림 핀',imgs,'/ 오류',errs)
        assert not errs,errs
        br.close()
print('NPC 걷기 테스트 통과')
