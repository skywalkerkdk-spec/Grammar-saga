/* Drive every route quest: town request -> road (clue / guardian when present) -> dungeon gate -> dungeon cleared -> report. */
const {readFileSync,readdirSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const story=path.join(__dirname,'../story');
global.window={};
require(path.join(story,'maps/fields.js'));
require(path.join(story,'chapter2-world.js'));
const data=Object.fromEntries(readdirSync(story).filter(f=>f.endsWith('.json')).map(f=>[f.slice(0,-5),JSON.parse(readFileSync(path.join(story,f),'utf8'))]));
const state={flags:{}};
const cleared=new Set();
let screen,dialogue,fieldTargets,fieldMap,rewarded=null,entered=null,backed=0;
const node=(tag,text)=>({tag,text,children:[],append(...a){this.children.push(...a);},setAttribute(){}});
const find=(el,pred)=>el?.tag==='button'&&pred(el.text)?el:el?.children?.map(c=>find(c,pred)).find(Boolean);
const press=pred=>{const b=find(screen,pred);assert.ok(b,'Expected button on '+screen.text);b.action();};
const world=window.createChapterWorld({
  node,button:(text,action)=>({...node('button',text),action}),panel:t=>(screen=node('panel',t)),
  show:(title,lines,done,back,options)=>{dialogue={title,lines,done,back,options};},
  state:()=>state,save:()=>{},townName:id=>id,visit:()=>{},flag:id=>!!state.flags[id],recovered:()=>true,available:()=>true,
  companion:()=>true,pages:()=>18,volumeRead:()=>true,shuffle:x=>x,
  field:(body,map,targets)=>{fieldMap=map;fieldTargets=targets;},
  monsterArt:()=>node('div'),dungeonCleared:id=>cleared.has(id),enterDungeon:id=>{entered=id;},
  reward:(r,back)=>{rewarded=r;back();},
},data);
const quests=data.ROUTE_QUESTS.quests;
const nameOf=id=>data.TOWN_EVENTS.towns.flatMap(t=>t.residents).find(r=>r.id===id).name_en.split(' ').pop();
assert.equal(new Set(quests.map(q=>q.town_id)).size,7,'seven towns each have one dungeon request');
for(const quest of quests){
  const town=quest.town_id;
  const title=quest.title_en+' · '+quest.title_ko;
  const route=quest.steps[1].route;
  const tiles=window.chapterFields.routes[route.map||route.id].tiles;
  assert.ok(route.dungeon,town+' must send the player into its dungeon');
  assert.ok(window.chapterFields.villages[town].exits.some(e=>e.id===route.exit),town+' exit exists on the town map');
  rewarded=null;entered=null;backed=0;state.stages={};
  // closed before accepting
  assert.equal(world.openRoute(town,route.exit,()=>{}),false);
  // accept from the giver
  world.town(town,()=>{});
  press(t=>t.includes(nameOf(quest.steps[0].npc)));
  press(t=>t===title||t.endsWith(title));
  assert.ok(dialogue.lines.length>=4);
  dialogue.done?.();dialogue.back?.();
  assert.equal(state.stages[quest.id],1,town+' accepted');
  // road
  assert.equal(world.openRoute(town,route.exit,()=>{backed++;}),true);
  assert.ok(dialogue.lines.length>=2);dialogue.done();
  const at=id=>fieldTargets.find(t=>t.id===id);
  for(const t of fieldTargets.filter(t=>t.id!=='town')){
    const [x,y]=fieldMap.points[t.id]??[];
    assert.ok(x!==undefined,town+' map point for '+t.id);
    assert.equal(fieldMap.tiles[y][x],'.',town+' '+t.id+' must stand on a walkable tile');
  }
  if(route.clue){at('monster')&&at('monster').action();at('clue').action();dialogue.done();}
  if(route.monster){
    at('gate').action();assert.equal(entered,null,'gate stays shut before the guardian is beaten');
    at('monster').action();dialogue.back();
    for(const q of route.monster.questions){
      const wrong=q.options.find((_,i)=>i!==q.correct_index);
      press(t=>t===wrong);press(t=>t===q.options[q.correct_index]);
    }
    dialogue.done();
  }
  at('gate').action();dialogue.done();
  assert.equal(entered,route.dungeon,town+' gate enters its dungeon');
  assert.equal(state.stages[quest.id],1,'quest waits until the dungeon is cleared');
  // back in town the report is not yet offered, then clearing the dungeon unlocks it
  cleared.add(route.dungeon);
  world.town(town,()=>{});
  assert.equal(state.stages[quest.id],2,town+' dungeon clear advances the quest');
  press(t=>t.includes(nameOf(quest.steps[2].npc)));
  press(t=>t===title||t.endsWith(title));
  dialogue.done?.();dialogue.back?.();
  const wish=quest.steps[2].task;
  assert.equal(wish.options.length,wish.reactions.length);
  press(t=>t===wish.options[0]);
  dialogue.done();
  assert.equal(state.stages[quest.id],3);
  assert.equal(state.flags[quest.completion_flag],true);
  assert.deepEqual(rewarded,quest.reward_item);
}
console.log('Passed 7 dungeon requests: accept, road, gate, dungeon clear, report and reward.');
