#!/usr/bin/env python3
"""GPT가 만든 한 장짜리 배치 이미지를 NPC별 시트로 자르고 규격에 맞춥니다.
  python3 tools/npc_slice_batch.py M001 batch_M001.png    # 이동형: 1024×1024 → 위·아래 1024×512 시트 2장
  python3 tools/npc_slice_batch.py F001 batch_F001.png    # 고정형: 1536×1024 (6열×4행, 칸 256×256) → 각 128×128, 발 기준 정렬
잘라낸 결과는 art/npc/sprites/<sprite_id>.webp 로 저장되고, 즉시 검사기를 돌려 결과를 보여 줍니다.
검사에서 ERROR가 난 시트는 저장하지만 atlas에 등록되지 않습니다(재생성 필요 목록으로 표시).
"""
import sys,os,json
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import npc_sheet_check as chk
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man=json.load(open(os.path.join(root,'art/npc/NPC_MANIFEST.json'),encoding='utf-8'))
def main(batch,png):
    B=next(b for b in man['batches'] if b['batch']==batch);npcs={n['npc_id']:n for n in man['npcs']}
    im=Image.open(png).convert('RGBA');os.makedirs(os.path.join(root,'art/npc/sprites'),exist_ok=True);out=[]
    if B['kind']=='mobile':
        if im.size!=(1024,1024):sys.exit(f'이동형 배치는 1024×1024 필요(현재 {im.size})')
        for i,nid in enumerate(B['npcs']):out.append((nid,im.crop((0,i*512,1024,i*512+512))))
    else:
        if im.size!=(1536,1024):sys.exit(f'고정형 배치는 1536×1024 필요(현재 {im.size})')
        for i,nid in enumerate(B['npcs']):
            r,c=divmod(i,6);cell=im.crop((c*256,r*256,c*256+256,r*256+256))
            a=np.array(cell);m=a[...,3]>24
            if not m.any():out.append((nid,Image.new('RGBA',(128,128))));continue
            ys,xs=np.where(m);bx=cell.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
            w,h=bx.size;s=0.5  # 256칸에서 그린 그림은 정확히 1/2로 축소
            if h*s>104:s=104/h
            bx=bx.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
            cv=Image.new('RGBA',(128,128));cv.paste(bx,(64-bx.size[0]//2,118-bx.size[1]+1),bx);out.append((nid,cv))
    res=[]
    for nid,img in out:
        n=npcs[nid];p=os.path.join(root,n['sheet']);img.save(p,'WEBP',quality=95,alpha_quality=100,method=6)
        E,W,_=chk.run(p,n['kind']);res.append((nid,E,W))
        print(('불합격 ' if E else '합격   ')+nid,n['name_en'],*E,*[('(경고)'+w) for w in W])
    print('재생성 필요:',[r[0] for r in res if r[1]] or '없음')
if __name__=='__main__':
    if len(sys.argv)!=3:sys.exit(__doc__)
    main(sys.argv[1],sys.argv[2])
