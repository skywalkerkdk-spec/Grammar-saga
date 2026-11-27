#!/usr/bin/env python3
"""NPC 스프라이트 시트 검사기.
  python3 tools/npc_sheet_check.py <png> --kind front|walk   # 한 장 검사
  python3 tools/npc_sheet_check.py --all                      # art/npc/sprites/ 전체 검사(+ 배경 체커보드·누락 리포트)
규격(게임 엔진 기준):
  front : 128×128 RGBA 정면 1컷(252명 전원). 발 중심 약 (64,118).
  walk  : 512×512 RGBA, 4열×4행, 칸 128×128. 행: 아래(정면)·왼쪽·오른쪽·위(뒷모습). 열: 왼발·기본·오른발·기본(기본=2번째 칸). (기존 이동형 52명)
  mobile: 1024×512 8프레임(주인공 규격, 참고)
오류(ERROR)가 하나라도 있으면 게임에 등록하지 않습니다.
"""
import sys,os,json,argparse
import numpy as np
from PIL import Image
CELL=128;COLS=8;ROWS=4
def load(p):
    im=Image.open(p)
    return im,np.array(im.convert('RGBA'))
def bbox(a):
    m=a[...,3]>24
    if not m.any():return None
    ys,xs=np.where(m);return xs.min(),ys.min(),xs.max(),ys.max()
def checker(a):
    """불투명한데 회색·흰색이 번갈아 나오는 가짜 투명 배경 의심"""
    h,w=a.shape[:2];op=a[...,3]>200
    if op.mean()<.5:return False
    g=a[...,:3].astype(int);flat=(abs(g[...,0]-g[...,1])<8)&(abs(g[...,1]-g[...,2])<8)&(g[...,0]>150)
    sub=flat[:min(h,64),:min(w,64)]
    if sub.mean()<.5:return False
    v=g[:min(h,64),:min(w,64),0];return len(np.unique(v//12))>=2 and sub.mean()>.7
def _check_walk(p,cols):
    E=[];W=[];im,a=load(p)
    if im.size!=(CELL*cols,CELL*ROWS):E.append(f'크기 {im.size} → {CELL*cols}×{CELL*ROWS} 필요');return E,W,{}
    if im.mode!='RGBA':E.append('RGBA(투명 PNG/WebP) 아님')
    if (a[...,3]==0).mean()<.3:E.append('투명 영역이 30% 미만 → 배경이 그려졌거나 체커보드가 구워졌을 수 있음')
    if checker(a):E.append('체커보드(회색·흰색 격자) 배경이 불투명으로 구워져 있음')
    feet=[];hts=[];info={}
    for r in range(ROWS):
        rowcol=[]
        for c in range(cols):
            cell=a[r*CELL:(r+1)*CELL,c*CELL:(c+1)*CELL];b=bbox(cell)
            if b is None:E.append(f'빈 칸 행{r} 열{c}');continue
            x0,y0,x1,y1=b
            if x0<2 or y0<2 or x1>CELL-3 or y1>CELL-3:E.append(f'칸 경계에 닿음/잘림 행{r} 열{c} bbox={b}')
            feet.append((r,c,y1));hts.append((r,c,y1-y0+1))
            m=cell[...,3]>24;rowcol.append(cell[m][:,:3].mean(0))
        if rowcol:info[r]=np.mean(rowcol,0)
    if feet:
        fy=np.array([f[2] for f in feet]);
        if fy.max()-fy.min()>4:E.append(f'발 기준선이 칸마다 다름 (y {fy.min()}~{fy.max()}, 허용 4px)')
        hh=np.array([h[2] for h in hts]);
        if (hh.max()-hh.min())>max(8,.12*hh.mean()):E.append(f'캐릭터 높이가 프레임마다 다름 ({hh.min()}~{hh.max()}px)')
        if hh.mean()<60:W.append(f'캐릭터가 작음(평균 {hh.mean():.0f}px, 권장 성인100/어린이80)')
        if hh.mean()>112:W.append(f'캐릭터가 큼(평균 {hh.mean():.0f}px)')
    # 방향 간 색 일관성
    if len(info)==ROWS:
        ref=info[0]
        for r in range(1,ROWS):
            d=np.abs(info[r]-ref).max()
            if d>48:W.append(f'행{r}의 평균 색이 정면과 많이 다름(차 {d:.0f}) → 옷/머리색이 다른 인물일 수 있음')
    # 걷기 동작: 같은 행의 프레임이 전부 같으면 안 됨
    for r in range(ROWS):
        cells=[a[r*CELL:(r+1)*CELL,c*CELL:(c+1)*CELL,3] for c in range(cols)]
        diffs=[(abs(cells[i].astype(int)-cells[(i+1)%cols].astype(int))>40).mean() for i in range(cols)]
        if max(diffs)<.004:E.append(f'행{r}: 프레임이 모두 같음(걷는 동작 없음)')
    # 좌우 행이 서로 거울인지(허용: 비대칭 소품이 있어 경고만)
    return E,W,{'height_mean':float(np.mean([h[2] for h in hts])) if hts else 0}
def check_mobile(p):return _check_walk(p,8)   # 8프레임(주인공 규격)
def check_walk(p):return _check_walk(p,4)     # 4프레임: 왼발·기본·오른발·기본 (기본=2번째 칸)
def check_fixed(p):
    E=[];W=[];im,a=load(p)
    if im.size!=(128,128):E.append(f'크기 {im.size} → 128×128 필요');return E,W,{}
    if im.mode!='RGBA':E.append('RGBA 아님')
    if (a[...,3]==0).mean()<.3:E.append('투명 영역 30% 미만 → 배경 의심')
    if checker(a):E.append('체커보드 배경이 구워져 있음')
    b=bbox(a)
    if b is None:E.append('비어 있음');return E,W,{}
    x0,y0,x1,y1=b
    if x0<1 or y0<1 or x1>126 or y1>126:E.append(f'가장자리에 닿음 bbox={b}')
    h=y1-y0+1
    if h<60:W.append(f'작음 {h}px');
    if abs((x0+x1)/2-64)>10:W.append('가로 중심이 치우침')
    if y1<110 or y1>124:W.append(f'발 기준선 y={y1} (권장 약 118)')
    return E,W,{'height':h}
def run(p,kind):
    return {'mobile':check_mobile,'walk':check_walk}.get(kind,check_fixed)(p)
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('png',nargs='?');ap.add_argument('--kind');ap.add_argument('--all',action='store_true');a=ap.parse_args()
    root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if a.all:
        man=json.load(open(os.path.join(root,'art/npc/NPC_MANIFEST.json'),encoding='utf-8'))
        ok=bad=miss=0;rep=[];total=0
        for n in man['npcs']:
            for key,kind in (('front_sheet','front'),('walk_sheet','walk')):
                if not n.get(key):continue
                total+=1;p=os.path.join(root,n[key])
                if not os.path.exists(p):miss+=1;continue
                E,W,_=run(p,kind);rep.append((n['npc_id']+('(걷기)' if kind=='walk' else ''),E,W))
                if E:bad+=1
                else:ok+=1
        for i,E,W in rep:
            for e in E:print('ERROR',i,e)
            for w in W:print('warn ',i,w)
        print(f'합격 {ok} / 불합격 {bad} / 아직 없음 {miss} / 전체 {total}');sys.exit(1 if bad else 0)
    if not a.png or not a.kind:ap.error('png와 --kind 필요');
    E,W,_=run(a.png,a.kind)
    for e in E:print('ERROR',e)
    for w in W:print('warn ',w)
    print('불합격' if E else '합격');sys.exit(1 if E else 0)
