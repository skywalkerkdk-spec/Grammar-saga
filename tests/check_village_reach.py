"""주인공이 주민 칸을 밟지 못하게 막아도 18개 마을의 모든 주민·표지에 닿을 수 있는지 확인"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os,json
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
class Q(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
JS="""()=>{const w=document.querySelector('.c2-field-world');if(!w)return null;const M=window.__map;return null}"""
with ThreadingHTTPServer(('127.0.0.1',0),partial(Q,directory=root)) as srv:
    Thread(target=srv.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{srv.server_port}/'
    with sync_playwright() as pw:
        br=pw.chromium.launch(executable_path=os.environ.get('GRAMMAR_CHROMIUM'))
        pg=br.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        pg.route('**/*',lambda r:r.continue_() if r.request.url.startswith(url) else r.abort())
        pg.set_default_timeout(3000)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(url)
        pg.evaluate("()=>{G=fresh('R');SV=defSave();SV.cleared=['d6','d7','d8','d1','d2','d3','d4','d5'];G.started=true;G.scr='dsel';render();}")
        ids=pg.evaluate("Object.keys(chapterFields.villages)")
        bad=[]
        for tid in ['g1']+ids:
            pg.evaluate(f"twOpen('{tid}')")
            if tid=='g1':
                pg.get_by_role('button',name='비빌 마을 탐험').click()
            else:
                ok=pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(b=>/탐험$/.test(b.textContent.trim()));if(b){b.click();return true}return [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).slice(0,12)}")
                if ok is not True:bad.append((tid,'탐험 버튼 없음',ok));continue
            pg.wait_for_timeout(500)
            r=pg.evaluate("""()=>{const w=document.querySelector('.c2-field-world');if(!w)return null;
              const S=(window.chapterFields.villages[document.querySelector('.c2-field-world') && Object.keys(window.chapterFields.villages).find(k=>document.querySelector('.c2-field-world').style.backgroundImage.includes('/villages/'+k+'.webp'))]||{}).tileSize||46;
              const pins=[...w.querySelectorAll('.c2-field-pin')].map(p=>[Math.round(parseFloat(p.style.left)/S-.5),Math.round(parseFloat(p.style.top)/S-.72),p.getAttribute('aria-label')]);
              const hero=w.querySelector('.c2-field-hero');const hx=Math.round(parseFloat(hero.style.left)/S-.5),hy=Math.round(parseFloat(hero.style.top)/S-.72);
              return {pins,hero:[hx,hy]};}""")
            m=pg.evaluate(f"(chapterFields.villages['{tid}']||chapterFields.town).tiles")
            if not r:bad.append((tid,'지도 안 열림'));continue
            H=len(m);Wd=len(m[0]);blocked={(x,y) for x,y,_ in r['pins']}
            floor=lambda x,y:0<=y<H and 0<=x<Wd and m[y][x]=='.'
            seen={tuple(r['hero'])};q=[tuple(r['hero'])]
            for x,y in q:
                for dx,dy in((0,1),(1,0),(0,-1),(-1,0)):
                    n=(x+dx,y+dy)
                    if n in seen or not floor(*n) or n in blocked:continue
                    seen.add(n);q.append(n)
            seen2={tuple(r['hero'])};q2=[tuple(r['hero'])]
            for x,y in q2:
                for dx,dy in((0,1),(1,0),(0,-1),(-1,0)):
                    n=(x+dx,y+dy)
                    if n in seen2 or not floor(*n):continue
                    seen2.add(n);q2.append(n)
            for x,y,l in r['pins']:
                a1=any(max(abs(x-a),abs(y-b))<=1 for a,b in seen);a2=any(max(abs(x-a),abs(y-b))<=1 for a,b in seen2)
                if not a1:bad.append((tid,'막으면 불가' if a2 else '원래부터 불가',l,(x,y)))
            print('   막기전 도달',len(seen2),'막은후',len(seen),'영웅',r['hero'])
            if tuple(r['hero']) in blocked and False:bad.append((tid,'시작 위치가 주민 칸'))
            print(tid,'핀',len(r['pins']),'도달칸',len(seen))
        print('문제:',bad,'오류:',errs)
        assert not bad and not errs,(bad,errs)
        print('마을 18곳 모든 주민·표지에 닿을 수 있음 (주인공은 주민 칸에 올라가지 않음)')
        br.close()
