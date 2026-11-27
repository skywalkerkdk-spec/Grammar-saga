"""NPC 검사기가 좋은 시트는 통과시키고 나쁜 시트는 잡는지 확인 (합성 이미지)"""
import sys,os,tempfile
import numpy as np
from PIL import Image,ImageDraw
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','tools'))
import npc_sheet_check as c
def good_mobile(h=100,foot=116):
    im=Image.new('RGBA',(1024,512));d=ImageDraw.Draw(im)
    for r in range(4):
        for k in range(8):
            ox=k*128;oy=r*128;sway=[-4,0,4,0][k%4]
            d.rectangle((ox+44+sway,oy+foot-h,ox+84+sway,oy+foot),fill=(180,60+r*5,60,255))
            d.rectangle((ox+54+sway*2,oy+foot-h+8,ox+60+sway*2,oy+foot-h+14),fill=(20,20,20,255))
    return im
def save(im,name):
    p=os.path.join(tempfile.mkdtemp(),name);im.save(p);return p
ok=0
E,W,_=c.check_mobile(save(good_mobile(),'g.png'));assert not E,E;ok+=1
im=good_mobile().resize((512,256));E,_,_=c.check_mobile(save(im,'s.png'));assert any('크기' in e for e in E);ok+=1
im=Image.new('RGBA',(1024,512),(255,255,255,255));E,_,_=c.check_mobile(save(im,'bg.png'));assert E;ok+=1
im=good_mobile();a=np.array(im);a[0:128,0:128]=0;E,_,_=c.check_mobile(save(Image.fromarray(a),'e.png'));assert any('빈 칸' in e for e in E);ok+=1
im=good_mobile();d=ImageDraw.Draw(im);d.rectangle((128+44,128+0,128+84,128+128),fill=(200,0,0,255));E,_,_=c.check_mobile(save(im,'cut.png'));assert E;ok+=1
im=Image.new('RGBA',(1024,512));d=ImageDraw.Draw(im)
for r in range(4):
    for k in range(8):d.rectangle((k*128+44,r*128+16,k*128+84,r*128+(116 if k else 90)),fill=(150,60,60,255))
E,_,_=c.check_mobile(save(im,'foot.png'));assert any('발 기준선' in e or '높이' in e for e in E);ok+=1
im=Image.new('RGBA',(1024,512));d=ImageDraw.Draw(im)
for r in range(4):
    for k in range(8):d.rectangle((k*128+44,r*128+16,k*128+84,r*128+116),fill=(150,60,60,255))
E,_,_=c.check_mobile(save(im,'still.png'));assert any('프레임이 모두 같음' in e for e in E);ok+=1
f=Image.new('RGBA',(128,128));ImageDraw.Draw(f).rectangle((40,18,88,118),fill=(10,90,160,255));E,W,_=c.check_fixed(save(f,'f.png'));assert not E,E;ok+=1
f=Image.new('RGBA',(128,128),(255,255,255,255));E,_,_=c.check_fixed(save(f,'fb.png'));assert E;ok+=1
print('NPC 검사기 테스트 통과',ok,'/ 9')
