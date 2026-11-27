#!/usr/bin/env python3
"""GPT가 만든 배치 이미지를 NPC별 그림으로 자르고 규격에 맞춰 저장·검사합니다.
  python3 tools/npc_slice_batch.py F001 batch_F001.png              # 정면 배치: 칸 사이의 빈 간격을 자동으로 찾아 읽는 순서(위→아래, 왼→오른쪽)로 자름
  python3 tools/npc_slice_batch.py F001 batch.png --grid 6x4         # 빈 간격이 없으면 균등 분할(열x행)
  python3 tools/npc_slice_batch.py W001 batch_W001.png               # 걷기 배치: 1024×1024(2×2) → 512×512 시트 4장
  python3 tools/npc_slice_batch.py W001 one.png --npc cp_o0          # 걷기 한 명짜리 512×512
  python3 tools/npc_slice_batch.py F001 batch.png --dry              # 저장하지 않고 인식 결과만 확인
정면: 각 칸의 그림 테두리를 잘라 128×128 안에 비율 유지로 맞추고(가운데, 아래 y≈122), 반투명(그림자)은 유지합니다.
저장 위치: art/npc/sprites/npc_<ID>.webp (정면), npc_<ID>_walk.webp (걷기). ERROR가 난 그림은 atlas에 등록되지 않으므로 재생성 목록을 확인하세요."""
import sys,os,json,argparse
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import npc_sheet_check as chk
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man=json.load(open(os.path.join(root,'art/npc/NPC_MANIFEST.json'),encoding='utf-8'))
def bands(v,thr=0,minw=3):
    """v>thr 인 연속 구간 목록"""
    out=[];s=None
    for i,x in enumerate(v):
        if x>thr and s is None:s=i
        if x<=thr and s is not None:
            if i-s>=minw:out.append((s,i-1))
            s=None
    if s is not None and len(v)-s>=minw:out.append((s,len(v)-1))
    return out
def detect_cells(im):
    al=np.array(im)[...,3]>24
    rows=bands(al.sum(1))
    cells=[]
    for r0,r1 in rows:
        for c0,c1 in bands(al[r0:r1+1].sum(0)):cells.append((c0,r0,c1+1,r1+1))
    return cells,len(rows)
HI={}
def front_from(cell_img,nid=None):
    a=np.array(cell_img);m=a[...,3]>24
    if not m.any():return Image.new('RGBA',(128,128))
    ys,xs=np.where(m);c=cell_img.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    if nid:HI[nid]=c.copy()  # 걷기 시트를 만들 때 GPT에 줄 고해상도 기준 그림
    w,h=c.size;s=min(112/w,112/h);c=c.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
    arr=np.array(c);arr[...,3]=np.where(arr[...,3]>=240,255,arr[...,3]);c=Image.fromarray(arr)
    cv=Image.new('RGBA',(128,128));cv.alpha_composite(c,(64-c.size[0]//2,122-c.size[1]));return cv
def main():
    ap=argparse.ArgumentParser();ap.add_argument('batch');ap.add_argument('png');ap.add_argument('--grid');ap.add_argument('--npc');ap.add_argument('--dry',action='store_true');a=ap.parse_args()
    B=next((b for b in man['batches'] if b['batch']==a.batch),None)
    if not B:sys.exit('없는 배치: '+a.batch)
    npcs={n['npc_id']:n for n in man['npcs']}
    im=Image.open(a.png).convert('RGBA');out=[]
    if B['kind']=='front':
        if a.grid:
            gc,gr=map(int,a.grid.lower().split('x'));cw,ch=im.size[0]//gc,im.size[1]//gr
            crops=[im.crop((c*cw,r*ch,(c+1)*cw,(r+1)*ch)) for r in range(gr) for c in range(gc)]
        else:
            cells,nr=detect_cells(im)
            if len(cells)!=len(B['npcs']):
                sys.exit(f'칸을 {len(cells)}개 찾았는데 이 배치는 {len(B["npcs"])}명입니다(행 {nr}). 그림이 서로 붙어 있으면 --grid 열x행 으로 다시 시도하세요.')
            crops=[im.crop(c) for c in cells]
        for nid,cr in zip(B['npcs'],crops):out.append((nid,front_from(cr,nid),'front_sheet','front'))
    else:
        if im.size==(512,512):
            if not a.npc or a.npc not in B['npcs']:sys.exit('한 명짜리 512×512는 --npc <ID> 필요. 이 배치: '+', '.join(B['npcs']))
            out.append((a.npc,im,'walk_sheet','walk'))
        elif im.size==(1024,1024):
            for i,nid in enumerate(B['npcs']):
                r,c=divmod(i,2);out.append((nid,im.crop((c*512,r*512,c*512+512,r*512+512)),'walk_sheet','walk'))
        else:sys.exit(f'걷기 배치는 1024×1024(2×2) 또는 한 명짜리 512×512 필요(현재 {im.size})')
    os.makedirs(os.path.join(root,'art/npc/sprites'),exist_ok=True);res=[]
    for nid,img,key,kind in out:
        n=npcs[nid];p=os.path.join(root,n[key])
        if a.dry:p='/tmp/npc_dry_%s_%s.webp'%(nid,kind)
        img.save(p,'WEBP',quality=95,alpha_quality=100,method=6)
        E,W,_=chk.run(p,kind);res.append((nid,E,W))
        if kind=='front' and not a.dry and nid in HI:
            os.makedirs(os.path.join(root,'art/npc/hires'),exist_ok=True);HI[nid].save(os.path.join(root,'art/npc/hires/npc_%s.webp'%nid),'WEBP',quality=92,alpha_quality=100,method=6)
        print(('불합격 ' if E else '합격   ')+nid,n['name_en'],*E,*[('(경고)'+w) for w in W])
    print('재생성 필요:',[r[0] for r in res if r[1]] or '없음')
if __name__=='__main__':main()
