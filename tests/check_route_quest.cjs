/* Drive the route quest (town -> field route -> clue -> guardian questions -> report) with an in-memory DOM. */
const {readFileSync,readdirSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const story=path.join(__dirname,'../story');
global.window={};
require(path.join(story,'maps/fields.js'));
require(path.join(story,'chapter2-world.js'));
const data=Object.fromEntries(readdirSync(story).filter(f=>f.endsWith('.json')).map(f=>[f.slice(0,-5),JSON.parse(readFileSync(path.join(story,f),'utf8'))]));
const state={flags:{}};
let screen,dialogue,fieldTargets,fieldMap,rewarded=null,backed=0;
const node=(tag,text)=>({tag,text,children:[],append(...a){this.children.push(...a);},setAttribute(){}});
const find=(el,pred)=>el?.tag==='button'&&pred(el.text)?el:el?.children?.map(c=>find(c,pred)).find(Boolean);
const press=pred=>{const b=find(screen,pred);assert.ok(b,'Expected button on '+screen.text);b.action();};
const world=window.createChapterWorld({
  node,button:(text,action)=>({...node('button',text),action}),panel:t=>(screen=node('panel',t)),
  show:(title,lines,done,back,options)=>{dialogue={title,lines,done,back,options};},
  state:()=>state,save:()=>{},townName:id=>id,visit:()=>{},flag:id=>!!state.flags[id],recovered:()=>true,available:()=>true,
  companion:()=>true,pages:()=>18,volumeRead:()=>true,shuffle:x=>x,
  field:(body,map,targets)=>{fieldMap=map;fieldTargets=targets;},
  monsterArt:()=>node('div'),reward:(r,back)=>{rewarded=r;back();},
},data);
const quest=data.ROUTE_QUESTS.quests[0];
const title=quest.title_en+' · '+quest.title_ko;
const tiles=window.chapterFields.routes[quest.steps[1].route.id].tiles;
// 0) route is closed before the quest is accepted
assert.equal(world.openRoute('sj','exit_west',()=>{}),false);
// 1) accept from the mayor
world.town('sj',()=>{});
press(t=>t.includes('Wishwell'));
press(t=>t===title);
assert.ok(dialogue.lines.length>=4);
dialogue.done?.();dialogue.back?.();
assert.equal(state.stages[quest.id],1);
// 2) the west road opens the route
assert.equal(world.openRoute('sj','exit_west',()=>{backed++;}),true);
assert.ok(dialogue.lines.length>=2);dialogue.done();
const at=id=>fieldTargets.find(t=>t.id===id);
for(const t of fieldTargets.filter(t=>t.id!=='town')){
  const [x,y]=fieldMap.points[t.id];
  assert.equal(tiles[y][x],'.',t.id+' must stand on a walkable tile');
}
// guardian refuses before the clue
at('monster').action();
assert.equal(state.stages[quest.id],1);
at('clue').action();dialogue.done();
// 3) guardian: wrong answers do not progress, correct answers do
at('monster').action();
dialogue.back();
for(const q of quest.steps[1].route.monster.questions){
  const wrong=q.options.find((_,i)=>i!==q.correct_index);
  press(t=>t===wrong);
  assert.equal(state.stages[quest.id],1);
  press(t=>t===q.options[q.correct_index]);
}
dialogue.done();
assert.equal(state.stages[quest.id],2);
assert.equal(backed,1);
// 4) report to the mayor and finish
world.town('sj',()=>{});
press(t=>t.includes('Wishwell'));
press(t=>t===title);
dialogue.done?.();dialogue.back?.();
const wish=quest.steps[2].task;
assert.equal(wish.options.length,wish.reactions.length);
press(t=>t===wish.options[0]);
dialogue.done();
assert.equal(state.stages[quest.id],3);
assert.equal(state.flags[quest.completion_flag],true);
assert.deepEqual(rewarded,quest.reward_item);
console.log('Passed route quest: accept, clue, guardian questions, report and reward.');
