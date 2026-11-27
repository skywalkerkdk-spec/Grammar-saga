/* Drive the optional quest controller with an in-memory DOM and save. */
const {readFileSync,readdirSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const story=path.join(__dirname,'../story');
global.window={};
require(path.join(story,'chapter2-world.js'));
const data=Object.fromEntries(readdirSync(story).filter(file=>file.endsWith('.json')).map(file=>[
  file.slice(0,-5),JSON.parse(readFileSync(path.join(story,file),'utf8')),
]));
const npcs=new Map(data.TOWN_NETWORK.towns.flatMap(town=>town.new_residents.map(npc=>[
  npc.id,{name:npc.name_en,town:town.town_id},
])));
for(const event of data.DEMON_ARMY_INTRIGUE.events) {
  npcs.set(event.agent.id,{name:event.agent.name_en,town:event.town_id});
}
const state={flags:{}};
let screen, currentDialogue, saves=0;
function node(tag,text){
  return {tag,text,children:[],append(...args){this.children.push(...args);},setAttribute(){}};
}
function screenButton(predicate) {
  const find=el=>{
    if(el?.tag==='button'&&predicate(el.text))return el;
    return el?.children?.map(find).find(Boolean);
  };
  const match=find(screen);
  assert.ok(match,'Expected button on '+screen.text);
  return match;
}
const world=window.createChapterWorld({
  node,
  button:(text,action)=>({...node('button',text),action}),
  panel:title=>(screen=node('panel',title)),
  show:(title,lines,done,back,options)=>{currentDialogue={title,lines,done,back,options};},
  state:()=>state,
  save:()=>{saves++;},
  townName:id=>id,
  visit:()=>{},
  flag:id=>!!state.flags[id],
  recovered:()=>true,
  available:()=>true,
  companion:()=>true,
  pages:()=>18,
  volumeRead:()=>true,
  shuffle:items=>items,
},data);

function complete(event,steps,settings={}){
  const title=settings.title||[event.title_en,event.title_ko].filter(Boolean).join(' · ');
  let town=settings.town||event.town||event.town_id;
  const rewarded=settings.flag||event.completion_flag||event.id+'_complete';
  for(const [index,step] of steps.entries()){
    const key=step.npc||step.npc_id;
    const npc=npcs.get(key);
    town=npc?.town||step.town||town;
    assert.ok(town,event.id);
    world.town(town,()=>{});
    if (npc) screenButton(text=>text.startsWith(npc.name+' ·')||(text.startsWith('(')&&text.endsWith(') '+npc.name.split(' ').pop()))).action();
    currentDialogue=null;
    screenButton(text=>text===title).action();
    const before=state.stages?.[event.id]||0;
    assert.equal(before,index,event.id);
    const task=step.task||(step.options?step:null);
    if(currentDialogue){
      assert.ok(currentDialogue.lines.every(line=>line.en&&line.ko&&line.chunks.length));
      const {done,back}=currentDialogue;
      done?.();
      back?.();
    }
    if(task) {
      if(task.choice) {
        assert.ok(task.options.length===task.reactions?.length,'Every choice needs a reaction '+event.id);
        screenButton(text=>text===task.options[0]).action();
        assert.ok(currentDialogue.lines.every(line=>line.en&&line.ko&&line.chunks.length));
        currentDialogue.done();
      } else {
        const wrong=task.options.find((_,i)=>i!==task.correct_index);
        screenButton(text=>text===wrong).action();
        assert.equal(state.stages?.[event.id]||0,index,'Wrong response moved '+event.id);
        screenButton(text=>text===task.options[task.correct_index]).action();
      }
    }
    assert.equal(state.stages[event.id],index+1,event.id);
  }
  assert.equal(state.flags[rewarded],true,event.id);
}

for(const town of data.TOWN_EVENTS.towns)for(const event of town.events)complete(event,event.steps,{town:town.town_id});
for(const event of [...data.TOWN_UNIQUE_EVENTS.events,...data.TOWN_RELATIONSHIP_STORIES.events])complete(event,event.steps);
for(const event of data.REGIONAL_STORIES_REVISED.cases){
  const base=data.TOWN_NETWORK.chains.find(chain=>chain.id===event.id);
  complete(event,event.steps,{title:base.title_en+' · '+base.title_ko});
}
for(const event of data.DEMON_ARMY_INTRIGUE.events){
  const part=data.DEMON_ARMY_RESOLUTIONS.cases.find(item=>item.parent===event.id);
  complete(event,[...event.steps,...part.steps],{flag:part.steps.at(-1).grant_flag});
}
for(const event of data.BOOK_SECRETS_AND_MERCHANTS.quests)complete(event,event.steps,{title:event.reward.ko+' · 도서 단서'});
for(const room of data.CHAPTER2_CLOSURE_AND_EXPLORATION.vaults)complete(room,[
  {town:room.town,line:room.entry},{town:room.town,line:room.evidence,task:room.task},
]);
for(const event of data.COMPANION_AND_OFFICER_DEPTH.arcs)complete(event,event.scenes,{title:event.character+' · 동료 이야기'});
assert.equal(Object.keys(state.souvenirs).length,30);
assert.equal(Object.keys(state.flags).length,163);
console.log('Passed 136 narrative routes and '+saves+' stage save operations.');
