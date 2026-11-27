from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import os
from threading import Thread
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
dist=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=dist))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('GRAMMAR_CHROMIUM'),args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url) else route.abort())
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))


    import json
    page.goto(url+'index.html',wait_until='domcontentloaded')
    data=page.evaluate("""() => {
      const result={banks:{},runs:{},types:{},checks:0,problems:[]};
      const check=(ok,desc)=>{result.checks++;if(!ok)result.problems.push(desc);};
      const noWord=new Set(['×','(아무것도 필요 없음)']);
      const normAnswer=x=>String(x).toLowerCase().replace(/[’‘]/g,"'").replace(/[^\\p{L}\\p{N}']/gu,'');
      function validateChoices(q,where) {
        check(q.options.length>=2&&q.answer>=0&&q.answer<q.options.length,where+' answer index');
        check(new Set(q.options.map(x=>String(x).trim().toLowerCase().replace(/[’‘]/g,"'"))).size===q.options.length,where+' duplicate options '+JSON.stringify(q.options));
      }
      check(fillGrammarBlanks('She ____ always ____ about the weather.','is / complaining')==='She is always complaining about the weather.','double blank');
      check(fillGrammarBlanks('____ Seoul is the capital of Korea.','×')==='Seoul is the capital of Korea.','zero article');
      check(GQD.g1.some(row=>row[1]==='The children ____ students.'&&row[2][0]==='are'),'child role agreement');
      check(!GQD.g1.some(row=>/^The children ____ a doctor(?:[.!?]| )/.test(row[1])),'invalid job title');
      let poolItems=0;
      function scan(x,path) {
        if(!x||typeof x!=='object')return;
        if(x.c&&x.tr) {
          poolItems++;
          check(x.c.length>0&&x.c.every(c=>c[0]&&c[1]),path+' chunks');
          check(typeof x.tr==='string'&&x.tr.trim().length>0,path+' translation');
          if(x.o) {
            validateChoices({options:x.o,answer:x.a},path);
            const filled=x.s.replace('____',noWord.has(x.o[x.a])?'':x.o[x.a]);
            check(normAnswer(filled)===normAnswer(x.c.map(c=>c[0]).join(' ')),path+' stem/chunks mismatch '+filled);
          }
          return;
        }
        Object.entries(x).forEach(([k,v])=>scan(v,path+'.'+k));
      }
      scan(POOL,'POOL');
      result.banks.POOL=poolItems;
      poolItems=0;
      scan(NEWS,'NEWS');
      result.banks.NEWS=poolItems;
      for(const item of SD_SAMPLES)validateChoices({options:[item.a,...item.w],answer:0},item.id);
      for(const [id,row] of CJM.entries()){
        const correct=row[2],wrong=row[3];
        check(correct.length>=2&&wrong.length>0&&new Set([...correct,...wrong].map(normAnswer)).size===correct.length+wrong.length,'CJM '+id);
      }
      for(const [id,row] of CJS.entries())validateChoices({options:[row[3],...row[4]],answer:0},'CJS '+id);
      result.banks.SD_SAMPLES=SD_SAMPLES.length;
      result.banks.CJM=CJM.length;
      result.banks.CJS=CJS.length;
      result.banks.tip=Object.keys(TIPQ).length;
      result.banks.terms=Object.values(GTERMS).flat().length;
      result.banks.GQD=0;
      for(const [bank,rows] of Object.entries(GQD)){
        if(bank==='sd')continue;
        result.banks.GQD+=rows.length;
        for(const [i,raw] of rows.entries()){
          const q=gqItem(raw),where='GQD.'+bank+'.'+i;
          validateChoices({options:q.o,answer:q.o.indexOf(q.ans)},where);
          check((q.s.match(/____/g)||[]).length===q.ans.split(/\\s+\\/\\s+/).length,where+' blank count');
          check(q.ko.trim()&& !/____|×/.test(q.filled),where+' incomplete sentence '+q.filled);
        }
      }
      result.banks.TOWN=0;
      for(const [town,{n}] of Object.entries(TOWN))for(const item of n){
        result.banks.TOWN++;
        check(item.f&&item.ko&&item.b.includes('[['),'NPC '+town+': '+item.who);
        const options=[item.f,...item.o];
        check(new Set(options.map(normAnswer)).size===options.length,'NPC duplicate '+town+': '+item.who);
      }
      G=fresh('Grammar audit');
      SV=defSave();
      G.started=true;
      const levels=['beginner','intermediate','expert'];
      let seed=2570;
      Math.random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
      function validateRun(run,where) {
        if(!Array.isArray(run)||!run.length){result.problems.push(where+' empty run');return;}
        result.runs[where]=(result.runs[where]||0)+run.length;
        for(const q of run){
          result.types[q.type]=(result.types[q.type]||0)+1;
          if(q.options&&q.answer!==undefined)validateChoices(q,where+' '+q.type+' '+q.sentence);
          if(q.ord)check(q.ord.tiles.length>1&&q.ord.ans.trim().length>0,where+' order');
          if(q.err)check(q.err.bad>=-1&&q.err.bad<q.err.chunks.length,where+' error index');
          if(q.filled)check(!/×|____/.test(q.filled),where+' incomplete fill '+q.filled);
        }
      }
      for(const level of levels){
        SV.level=level;
        for(const dungeon of DUNGEONS){
          if(!dungeon.open)continue;
          G.dg=dungeon;
          const id=dungeon.id;
          try{
            for(let k=0;k<4;k++){
              validateRun(genRun(dungeon),'학습:'+id);
              validateRun(rpgPool(dungeon),'RPG:'+id);
            }
          }catch(error){result.problems.push(level+' '+id+' '+error.message);}
        }
        for(let i=0;i<40;i++)validateRun([pvQ(level,i%2===0)],'대전');
        validateRun(genRunDaily(),'오늘의 뉴스');
      }
      return result;
    }""")
    page.evaluate("saveNow=()=>{}; twOpen('tn')")
    page.locator('[data-two="2"]').click()
    answer=page.locator('[data-twp="2"][data-k="f"]')
    assert 'sunny yesterday afternoon' in answer.inner_text()
    answer.click()
    assert page.evaluate("SV.town.tn.q[2]===1")
    quests=json.loads((dist/'story/SPECIAL_QUESTS.json').read_text())['quests']
    tasks=[task for quest in quests for task in quest['tasks']]
    for task in tasks:
        if not (task['question_en'] and task['question_ko'] and
                0 <= task['correct_index'] < len(task['options']) and len(task['options'])==len(set(task['options']))):
            data['problems'].append('Special quest: '+task['id'])
    data['banks']['special_tasks']=len(tasks)
    if os.environ.get('GRAMMAR_AUDIT_RESULTS'):
        Path(os.environ['GRAMMAR_AUDIT_RESULTS']).write_text(json.dumps(data,ensure_ascii=False,indent=2))
    print(data['banks'],len(data['runs']),sum(data['runs'].values()),data['checks'],len(data['problems']))
    for issue in data['problems'][:25]:print(issue)
    assert not errors, errors
    assert not data['problems'], data['problems']
