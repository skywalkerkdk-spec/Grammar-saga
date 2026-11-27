#!/usr/bin/env python3
"""art/npc/sprites/ 의 시트를 검사하고, 합격한 것만 story/maps/npc-atlas.js 에 ready:true 로 등록합니다.
  python3 tools/npc_build_atlas.py
고정형은 정지 그림(128×128 정면), 이동형은 걷기 시트(1024×512)로 쓰입니다. 불합격·없음은 ready:false → 게임이 기존 그림으로 대체합니다."""
import json,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import npc_sheet_check as chk
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man=json.load(open(os.path.join(root,'art/npc/NPC_MANIFEST.json'),encoding='utf-8'))
at={};ready=0;fail=[]
for n in man['npcs']:
    p=os.path.join(root,n['sheet']);ok=False
    if os.path.exists(p):
        E,W,_=chk.run(p,n['kind']);ok=not E
        if E:fail.append((n['npc_id'],E))
    at[n['npc_id']]=dict(sheet=n['sheet'],kind=n['kind'],profession=n['profession'],ready=ok)
    if n['kind']=='mobile':at[n['npc_id']].update(cols=8,rows=4,cell=128,idle=2,rowOrder=['down','left','right','up'])
    ready+=ok
open(os.path.join(root,'story/maps/npc-atlas.js'),'w',encoding='utf-8').write('/* 자동 생성: python3 tools/npc_build_atlas.py — 직접 고치지 마세요 */\nwindow.NPC_ATLAS='+json.dumps(at,ensure_ascii=False,separators=(',',':'))+';\n')
print(f'등록 {ready} / 전체 {len(man["npcs"])} / 검사 불합격 {len(fail)}')
for i,e in fail:print(' ',i,e)
