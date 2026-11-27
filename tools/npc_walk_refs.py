#!/usr/bin/env python3
"""걷기 배치(W###)용 참조 이미지를 만듭니다: 이미 만든 정면 그림 4명을 2×2로 붙인 PNG (GPT에 함께 첨부 → 같은 인물로 걷기 시트 제작).
  python3 tools/npc_walk_refs.py W001   → art/npc/refs/W001_refs.png   (순서: 왼쪽 위, 오른쪽 위, 왼쪽 아래, 오른쪽 아래 = 요청서의 1~4번)"""
import sys,os,json
from PIL import Image
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man=json.load(open(os.path.join(root,'art/npc/NPC_MANIFEST.json'),encoding='utf-8'))
b=next((x for x in man['batches'] if x['batch']==(sys.argv[1] if len(sys.argv)>1 else '') and x['kind']=='walk'),None)
if not b:sys.exit(__doc__)
cv=Image.new('RGBA',(1024,1024),(255,255,255,0));miss=[]
for i,nid in enumerate(b['npcs']):
    p=os.path.join(root,'art/npc/hires/npc_%s.webp'%nid)
    if not os.path.exists(p):miss.append(nid);continue
    im=Image.open(p).convert('RGBA');s=min(480/im.size[0],480/im.size[1]);im=im.resize((round(im.size[0]*s),round(im.size[1]*s)),Image.LANCZOS)
    r,c=divmod(i,2);cv.alpha_composite(im,(c*512+(512-im.size[0])//2,r*512+(512-im.size[1])//2))
if miss:sys.exit('정면 그림(고해상도 원본)이 아직 없는 주민: '+', '.join(miss)+' → 먼저 정면 배치를 npc_slice_batch.py로 처리하세요.')
os.makedirs(os.path.join(root,'art/npc/refs'),exist_ok=True);out=os.path.join(root,'art/npc/refs/%s_refs.png'%b['batch']);cv.save(out);print('만들었습니다:',out)
