#!/usr/bin/env python3
"""NPC 제작 목록 자동 산출 (story/NAMING_REGISTRY.json + story/TOWN_NETWORK.json 기준).
실행: python3 tools/npc_manifest.py  → art/npc/NPC_MANIFEST.json, NPC_MANIFEST.csv, NPC_BATCHES.md, 검사 결과 출력
"""
import json,csv,sys,os,collections,re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S=lambda f:json.load(open(os.path.join(ROOT,'story',f),encoding='utf-8'))
reg,net=S('NAMING_REGISTRY.json'),S('TOWN_NETWORK.json')

# 직업 키: (영문 직함 첫 단어/구) → (profession, kind, age, gender) ; kind: fixed=건물·가게에 서 있는 정면 1컷 / mobile=걷기 시트
# 성별은 한국어 원본 이름에 분명히 드러난 경우만 지정(f/m), 아니면 any.
P={
 'Mayor':('mayor','fixed','adult','any'),'Castellan':('castellan','fixed','adult','any'),'Harbor Master':('harbor_master','fixed','adult','any'),
 'Grocer':('grocer','fixed','adult','any'),'Innkeeper':('innkeeper','fixed','adult','any'),'Guard':('guard','mobile','adult','any'),
 'Child':('child','mobile','child','any'),'Courier':('courier','mobile','adult','any'),'Miller':('miller','fixed','adult','any'),
 'Baker':('baker','fixed','adult','any'),'Gardener':('gardener','mobile','adult','any'),'Shepherd':('shepherd','mobile','adult','any'),
 'Waiter':('waiter','fixed','adult','any'),'Fisher':('fisher','mobile','adult','any'),'Cook':('cook','fixed','adult','any'),'Farmer':('farmer','mobile','adult','any'),
 'Clockmaker':('clockmaker','fixed','adult','any'),'Tailor':('tailor','fixed','adult','any'),'Party Planner':('party_planner','mobile','adult','any'),
 'Boatman':('boatman','mobile','adult','any'),'Carpenter':('carpenter','fixed','adult','any'),'Engineer':('engineer','mobile','adult','any'),
 'Healer':('healer','fixed','adult','any'),'Cart Driver':('cart_driver','mobile','adult','any'),'Scout':('scout','mobile','adult','any'),
 'Woodworker':('woodworker','fixed','adult','any'),'Archivist':('archivist','fixed','adult','any'),'Dockworker':('dockworker','mobile','adult','any'),
 'Letter Keeper':('letter_keeper','fixed','adult','any'),'Water Seller':('water_seller','fixed','adult','any'),'Guide':('guide','mobile','adult','any'),
 'Mapmaker':('mapmaker','fixed','adult','any'),'Bell Keeper':('bell_keeper','fixed','adult','any'),'Archaeologist':('archaeologist','fixed','adult','any'),
 'Scribe':('scribe','fixed','adult','any'),'Bird Keeper':('bird_keeper','fixed','adult','any'),'Letter Writer':('letter_writer','fixed','adult','any'),
 'Weaver':('weaver','fixed','adult','any'),'Race Judge':('race_judge','mobile','adult','any'),'Coach':('coach','mobile','adult','any'),
 'Medal Maker':('medal_maker','fixed','adult','any'),'Lost Property Clerk':('lost_property_clerk','fixed','adult','any'),'Umbrella Maker':('umbrella_maker','fixed','adult','any'),
 'Bookbinder':('bookbinder','fixed','adult','any'),'Navigator':('navigator','mobile','adult','any'),'Shipwright':('shipwright','fixed','adult','any'),
 'Lighthouse Keeper':('lighthouse_keeper','fixed','adult','any'),'Travel Agent':('travel_agent','fixed','adult','any'),'Tutor':('tutor','fixed','adult','any'),
 'Equipment Maker':('equipment_maker','fixed','adult','any'),'Forester':('forester','mobile','adult','any'),'Herbalist':('herbalist','fixed','adult','any'),
 'Bell Maker':('bell_maker','fixed','adult','any'),'Stage Manager':('stage_manager','fixed','adult','any'),'Musician':('musician','mobile','adult','any'),
 'Decor Maker':('decor_maker','fixed','adult','any'),'Seal Keeper':('seal_keeper','fixed','adult','any'),'Messenger':('messenger','mobile','adult','any'),
 'Translator':('translator','fixed','adult','any'),'Locksmith':('locksmith','fixed','adult','any'),'Historian':('historian','fixed','adult','any'),'Stoneworker':('stoneworker','fixed','adult','any'),
 # 기존 주민(직함 있음)
 'Little':('child','mobile','child','any'),'Granny':('granny','mobile','elder','f'),'Grandpa':('grandpa','mobile','elder','m'),'Postman':('postman','mobile','adult','any'),
 'Foreman':('foreman','mobile','adult','any'),'Runner':('runner','mobile','adult','any'),'Captain':('captain','mobile','adult','any'),'Ranger':('ranger','mobile','adult','any'),
 'Librarian':('librarian','fixed','adult','any'),'Mechanic':('mechanic','fixed','adult','any'),'Hunter':('hunter','mobile','adult','any'),'Traveler':('traveler','mobile','adult','any'),
 'Cleaner':('cleaner','mobile','adult','any'),'Landlord':('landlord','mobile','adult','any'),'Student':('student','mobile','teen','any'),'Gourmet':('gourmet','mobile','adult','any'),
 'Merchant':('merchant','fixed','adult','any'),'Teacher':('teacher','mobile','adult','any'),'Walker':('walker','mobile','adult','any'),'Falconer':('falconer','mobile','adult','any'),
 'Bookseller':('bookseller','fixed','adult','any'),'Fruit Seller':('fruit_seller','fixed','adult','any'),'Sailor':('sailor','mobile','adult','any'),
 'Swimmer':('swimmer','mobile','adult','any'),'Linguist':('linguist','mobile','adult','any'),'Chess Master':('chess_master','fixed','adult','any'),
 'Birdwatcher':('birdwatcher','mobile','adult','any'),'Mother':('mother','mobile','adult','f'),'Chef':('chef','fixed','adult','any'),'Florist':('florist','fixed','adult','any'),
 'Keeper':('park_keeper','mobile','adult','any'),'Detective':('detective','mobile','adult','any'),'Officer':('officer','mobile','adult','any'),'Artist':('artist','fixed','adult','any'),
 'Mayor Whyatt':('mayor','fixed','adult','any'),
}
# 직함이 없는 기존 주민: 한국어 원본 이름으로 분류
BARE={'Donny':('boy','mobile','child','m'),'Miss Nott':('cat_butler','mobile','adult','f'),'Pasty':('girl','mobile','child','f'),'Wynna':('girl','mobile','child','f'),
      'Faye':('girl','mobile','child','f'),'Wisha':('girl','mobile','child','f'),'Selma':('girl','mobile','child','f'),'Theo':('boy','mobile','child','m'),'Onna':('girl','mobile','child','f'),
      'Ben Bee':('dog_owner','mobile','adult','m')}
# 마을 지역 복식·소품 방향 (마을 ID → 짧은 설명)
REGION={'g1':'Beville 비 초원: 초원 농촌, 밀짚·소박한 린넨','g2':'Queston 의문·부정: 물음표 장식 소품, 호기심 어린 도시 복식','tn':'Tensefield 시제: 시계·시간 모티프, 들판 마을',
'md':'Modalvale 조동사: 건설·항구 작업복, 힘·가능성 모티프','rp':'Relawood 관계대명사: 숲 갈색·초록 사냥복, 연결(끈·매듭) 소품','ps':'Passive Lake 수동태: 호수 마을 푸른 방수 외투, 물가 소품',
'pf':'Perfect Oasis 완료: 사막 오아시스 흰 천·터번, 모래색','rv':'Whereport 관계부사: 항구 선원복, 지도·나침반 소품','pc':'Participle Canyon 분사: 협곡 암갈색·붉은 흙, 탐험가 복장',
'sj':'Ifhaven 가정법: 소원·별·깃털 모티프, 몽환적 보라·남색','cp':'Compare Hills 비교: 달리기·경기장 운동복, 메달·저울 소품','pn':'Pronovia 대명사/관사: 우체·상점가, 라벨·명찰 소품',
'ot':'Prep Isles 전치사: 섬 선원·등대 복식, 위치 표지 소품','iv':'Verbal Heights 부정사/동명사: 산악 여행자·등산 장비','pe':'Sensewood 지각/사역: 숲 감각 모티프, 귀·눈·방울 소품',
'ng':'Nounville 명사/명령/감탄: 축제 의상, 리본·꽃','rs':'Speechport 화법/간접의문: 항구 우편·밀랍 인장, 말풍선 모티프','sx':'Inversion Keep 도치/강조: 성채 문장, 대칭 무늬·강조 부호'}

def classify(en):
    if en in BARE:return BARE[en]
    # 가장 긴 직함부터 매칭
    for k in sorted(P,key=len,reverse=True):
        if en==k or en.startswith(k+' '):return P[k]
    return None

rows=[];bad=[]
for tw in net['towns']:
    tid=tw['town_id']
    for r in reg['episodes'][tid]['residents']:
        c=classify(r['en']);nid=f"{tid}_o{r['index']}"
        if not c:bad.append(nid+' '+r['en']);continue
        rows.append(dict(npc_id=nid,town=tid,origin='original',name_en=r['en'],name_ko=r['ko'],legacy_ko=r['legacy'],profession=c[0],kind=c[1],age=c[2],gender=c[3]))
    for r in tw['new_residents']:
        c=classify(r['name_en'])
        if not c:bad.append(r['id']+' '+r['name_en']);continue
        rows.append(dict(npc_id=r['id'],town=tid,origin='extra',name_en=r['name_en'],name_ko='',legacy_ko='',profession=c[0],kind=c[1],age=c[2],gender=c[3]))
if bad:print('미분류:',bad);sys.exit(1)

# 스프라이트 ID와 시트 파일 규칙
for r in rows:
    r['sprite_id']='npc_'+r['npc_id']
    r['sheet']='art/npc/sprites/%s.webp'%r['sprite_id']
    r['format']='front1_128' if r['kind']=='fixed' else 'walk8x4_1024x512'
    r['region_style']=REGION[r['town']]
# 배치(한 이미지 = 1536×1024 → 3×2칸, 칸당 512×512 시트 1장/걷기형은 8프레임 가로 → 칸당 1024×512이므로 1536×1024에 1장+…): 형식별로 다르게 묶음
fixed=[r for r in rows if r['kind']=='fixed'];mob=[r for r in rows if r['kind']=='mobile']
# 고정형: 128×128 정면 1프레임. 한 이미지(1024×1024)에 4×... 해상도 유지를 위해 8×8=64칸(칸 128px) 대신 안전하게 6×4=24칸(칸 256px 작업 → 128로 축소) 사용 금지: 원본 128 기준 8×6=48칸은 1024×768.
FIX_PER=24   # 1536×1024 이미지에서 6열×4행, 칸 256×256로 그린 뒤 128로 축소
MOB_PER=2    # 걷기형 1024×512 시트 2장을 1024×1024 이미지 한 장에 세로로
def chunk(l,n):return [l[i:i+n] for i in range(0,len(l),n)]
batches=[]
for i,ch in enumerate(chunk(sorted(mob,key=lambda r:(r['origin']!='original',r['town'],r['npc_id'])),MOB_PER),1):
    batches.append(dict(batch='M%03d'%i,kind='mobile',image='1024x1024 (위·아래 1024×512 시트 2장)',npcs=[r['npc_id'] for r in ch]))
for i,ch in enumerate(chunk(sorted(fixed,key=lambda r:(r['origin']!='original',r['profession'],r['town'])),FIX_PER),1):
    batches.append(dict(batch='F%03d'%i,kind='fixed',image='1536x1024 (6열×4행, 칸 256×256)',npcs=[r['npc_id'] for r in ch]))
bmap={n:b['batch'] for b in batches for n in b['npcs']}
for r in rows:r['batch']=bmap[r['npc_id']]

os.makedirs(os.path.join(ROOT,'art/npc'),exist_ok=True)
json.dump(dict(version=1,count=len(rows),npcs=rows,batches=batches),open(os.path.join(ROOT,'art/npc/NPC_MANIFEST.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
with open(os.path.join(ROOT,'art/npc/NPC_MANIFEST.csv'),'w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys()));w.writeheader();w.writerows(rows)
# 검사
ids=[r['npc_id'] for r in rows];assert len(ids)==len(set(ids)),'NPC ID 중복'
assert len(rows)==252,len(rows)
unassigned=[r['npc_id'] for r in rows if not r.get('profession')]
print('총',len(rows),'명 / 고정형',len(fixed),'/ 이동형',len(mob),'/ 미배정',len(unassigned))
pc=collections.Counter((r['profession'],r['kind']) for r in rows)
print('직업 종류',len(pc),'(중복 직업=같은 직업이 여러 마을에 있음, 그림은 인물별로 따로 제작)')
print('직업별 인원:',sorted(((k[0],v) for k,v in pc.items()),key=lambda x:-x[1])[:15])
print('배치(이미지 생성 횟수): 이동형',sum(1 for b in batches if b['kind']=='mobile'),'+ 고정형',sum(1 for b in batches if b['kind']=='fixed'))
