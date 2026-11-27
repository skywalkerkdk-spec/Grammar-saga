#!/usr/bin/env python3
"""art/npc/sprites/ 의 그림을 검사하고, 합격한 것만 story/maps/npc-atlas.js 에 ready:true 로 등록합니다.
  python3 tools/npc_build_atlas.py
front=정면 128×128(전원), walk=4프레임 걷기 512×512(기존 이동형 52명). 불합격·없음은 ready:false → 게임이 기존 그림으로 대체합니다."""
import json,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import npc_sheet_check as chk
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man=json.load(open(os.path.join(root,'art/npc/NPC_MANIFEST.json'),encoding='utf-8'))
at={};nf=nw=0;fail=[]
def entry(path,kind):
    p=os.path.join(root,path)
    if not os.path.exists(p):return False
    E,W,_=chk.run(p,kind)
    if E:fail.append((os.path.basename(path),E));return False
    return True
for n in man['npcs']:
    e=dict(profession=n['profession'],front=dict(sheet=n['front_sheet'],ready=entry(n['front_sheet'],'front')))
    nf+=e['front']['ready']
    if n['walk']:
        e['walk']=dict(sheet=n['walk_sheet'],ready=entry(n['walk_sheet'],'walk'),cols=4,rows=4,cell=128,idle=1,rowOrder=['down','left','right','up'])
        nw+=e['walk']['ready']
    at[n['npc_id']]=e
open(os.path.join(root,'story/maps/npc-atlas.js'),'w',encoding='utf-8').write('/* 자동 생성: python3 tools/npc_build_atlas.py — 직접 고치지 마세요 */\nwindow.NPC_ATLAS='+json.dumps(at,ensure_ascii=False,separators=(',',':'))+';\n')
print(f'정면 등록 {nf}/{len(man["npcs"])} · 걷기 등록 {nw}/{sum(1 for n in man["npcs"] if n["walk"])} · 검사 불합격 {len(fail)}')
for i,e in fail:print(' ',i,e)
