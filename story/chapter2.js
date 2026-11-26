/* Chapter II uses the live town and clear records from index.html. */
(() => {
  'use strict';

  const modes = { literal:'직독직해', natural:'자연스러운 해석', english:'영어 전용' };
  const preferencesKey = 'grammar-saga.chapter2.dialogue';
  let story;
  let episodes = new Map();
  let dialogue;
  let reading = {mode:'literal', color:true, slash:true};
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) || '{}');
    if (Object.hasOwn(modes,saved.mode)) reading.mode=saved.mode;
    for (const key of ['color','slash']) if (typeof saved[key] === 'boolean') reading[key]=saved[key];
  } catch {}

  function displayName(english,korean) {
    return english ? english+' · '+korean : korean;
  }

  const titleFor=episode=>displayName(episode.title_en,episode.title);
  const townFor=episode=>displayName(episode.town_en,episode.town);

  function node(tag, value, className) {
    const el = document.createElement(tag);
    if (value !== undefined) el.textContent = value;
    if (className) el.className = className;
    return el;
  }

  function button(label, action) {
    const el=node('button',label,'btn-s');
    el.type='button';
    el.addEventListener('click',action);
    return el;
  }

  function persistReading() {
    try { localStorage.setItem(preferencesKey,JSON.stringify(reading)); } catch {}
  }

  function closeDialogue() {
    window.speechSynthesis?.cancel();
    dialogue.close();
    dialogue.remove();
    dialogue=null;
  }

  function show(title, lines, done, back) {
    if (dialogue?.open) closeDialogue();
    dialogue=node('dialog',undefined,'c2-dialog');
    dialogue.setAttribute('aria-label',title);
    document.body.append(dialogue);
    let index=0;
    const finish=() => { closeDialogue(); done?.(); back?.(); };
    const leave=() => { closeDialogue(); back?.(); };
    dialogue.addEventListener('cancel', event => {event.preventDefault();leave();});
    const section=node('div',undefined,'c2-body');
    dialogue.append(section);
    const speech = window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function';

    function renderLine() {
      const line=lines[index];
      const controls=node('div',undefined,'c2-actions');
      const select=node('select');
      select.setAttribute('aria-label','대화 표시 모드');
      for (const [key,label] of Object.entries(modes)) select.add(new Option(label,key,key===reading.mode,key===reading.mode));
      select.onchange=()=>{reading.mode=select.value;persistReading();renderLine();section.querySelector('select').focus();};
      controls.append(select);
      for (const [key,label] of [['color','색상'],['slash','슬래시']]) {
        const toggle=button(label,()=>{
          reading[key]=!reading[key];persistReading();renderLine();
          section.querySelector('[data-setting="'+key+'"]').focus();
        });
        toggle.dataset.setting=key;
        toggle.setAttribute('aria-pressed',String(reading[key]));
        toggle.disabled=reading.mode!=='literal';
        controls.append(toggle);
      }
      const content=node('div',undefined,'c2-lines');
      content.setAttribute('aria-live','polite');
      content.append(node('strong',displayName(line.speaker_en,line.speaker)));
      const languages=reading.mode==='english' ? ['en'] : ['en','ko'];
      for (const language of languages) {
        const p=node('p',undefined,'c2-line');
        p.lang=language;
        if (reading.mode==='literal') line.chunks.forEach((chunk,i)=>{
          if (i) p.append(reading.slash ? ' / ' : ' ');
          const span=node('span',chunk[language]);
          if (reading.color) span.style.color=story.palette[i];
          p.append(span);
        });
        else p.textContent=line[language];
        content.append(p);
      }
      const actions=node('div',undefined,'c2-actions');
      const audio=button('영어 듣기',()=>{
        window.speechSynthesis.cancel();
        const utterance=new SpeechSynthesisUtterance(line.en);
        utterance.lang='en-US';
        window.speechSynthesis.speak(utterance);
      });
      audio.disabled=!speech;
      const previous=button('이전',()=>{index--;window.speechSynthesis?.cancel();renderLine();section.querySelector('[data-advance]').focus();});
      previous.disabled=index===0;
      const advance=button(index===lines.length-1?'완료':'다음',()=>{
        if (index===lines.length-1) finish();
        else {index++;window.speechSynthesis?.cancel();renderLine();section.querySelector('[data-advance]').focus();}
      });
      advance.dataset.advance='';
      actions.append(audio,previous,advance,button('건너뛰기',finish),button('닫기',leave));
      section.replaceChildren(node('h2',title),node('p',`${index+1} / ${lines.length}`),controls,content,actions);
    }
    renderLine();
    dialogue.showModal();
  }

  function progress() {
    return SV.chapter2 || {episodes:{}, seenEvents:{}};
  }

  function episodeState(id) {
    return progress().episodes?.[id] || {};
  }

  function update(id, changes) {
    const state=SV.chapter2 ||= {episodes:{}, seenEvents:{}};
    if (id) {
      const item=(state.episodes ||= {})[id] ||= {accepted:false,rewardClaimed:false,registered:false,seenEvents:{}};
      Object.assign(item,changes);
    } else Object.assign(state.seenEvents ||= {},changes);
    saveNow();
  }

  function rememberEpisode(id, event) {
    update(id,{seenEvents:{...episodeState(id).seenEvents,[event]:true}});
  }

  function registeredCount() {
    return [...episodes.keys()].filter(id=>episodeState(id).registered).length;
  }

  function library() {
    closeDialogueIfOpen();
    dialogue=node('dialog',undefined,'c2-dialog');
    dialogue.setAttribute('aria-label','그래머 대도서관');
    document.body.append(dialogue);
    const body=node('div',undefined,'c2-body');
    dialogue.append(body);
    dialogue.addEventListener('cancel',event=>{event.preventDefault();closeDialogue();});
    const count=registeredCount();
    const seen=progress().seenEvents || {};
    const read=(title,lines,done)=>show(title,lines,done,library);
    body.append(node('h2','그래머 대도서관'),node('p',displayName(story.library_intro[0].speaker_en,'대사서 렉시온')+' · 그라마티카 등록 '+count+' / 18'));
    const actions=node('div',undefined,'c2-actions');
    actions.append(button(seen.intro?'오프닝 다시 보기':'Chapter II 오프닝',()=>read('The Lost Pages',story.intro,()=>update(null,{intro:true}))),
      button(seen.library?'렉시온 대화 다시 보기':'렉시온과 대화',()=>read(displayName(story.library_intro[0].speaker_en,'대사서 렉시온'),story.library_intro,()=>update(null,{library:true}))));
    if ([...episodes.keys()].some(id=>episodeState(id).rewardClaimed&&!episodeState(id).registered)) {
      actions.append(button('가져온 페이지 등록',()=>{
        for (const id of episodes.keys()) if (episodeState(id).rewardClaimed&&!episodeState(id).registered) update(id,{registered:true});
        library();
      }));
    }
    for (const [number,lines] of Object.entries(story.milestones)) {
      if (count<Number(number)) continue;
      const key='milestone'+number;
      actions.append(button('복원 기록 '+number+'/18'+(seen[key]?' 다시 보기':''),()=>read('복원 기록 '+number+'/18',lines,()=>update(null,{[key]:true}))));
    }
    if (twCleared('d16')) body.append(node('p','노바의 대출 카드 · 그래머 도서관 클리어 기록'));
    if (count===18) actions.append(button(seen.finale?'침묵의 성역 대화 다시 보기':'침묵의 성역 · 최종 대화',()=>read('침묵의 성역',story.finale,()=>update(null,{finale:true}))));
    actions.append(button('닫기',closeDialogue));
    body.append(actions);
    const list=node('ul');
    for (const episode of episodes.values()) {
      const saved=episodeState(episode.id);
      const status=saved.registered?'등록됨':saved.rewardClaimed?'등록 가능':'미수집';
      const item=node('li',`${townFor(episode)} · ${displayName(episode.page_name_en,episode.page_name)} · ${status}${saved.rewardClaimed?' · '+displayName(episode.reward_en,episode.reward):''}`);
      item.append(' ',button(townFor(episode)+' 방문',()=>{closeDialogue();twOpen(episode.id);}));
      list.append(item);
    }
    body.append(list);
    dialogue.showModal();
  }

  function closeDialogueIfOpen() {
    if (dialogue?.open) closeDialogue();
  }

  function decorateTown(episode) {
    const cards=document.querySelectorAll('#app .twn');
    const saved=episodeState(episode.id);
    const cleared=twCleared(episode.id);
    const representative=episode.residents.find(resident=>(resident.name_legacy||resident.name)===(episode.completion.speaker_legacy||episode.completion.speaker));
    const heading=document.querySelector('#app .speaker');
    if (heading) heading.textContent=townFor(episode);
    for (const resident of episode.residents) {
      const card=cards[resident.index];
      if (!card) continue;
      const name=card.querySelector('.twh b');
      if (name) name.textContent=displayName(resident.name_en,resident.name);
      const recovered=cleared || SV.town?.[episode.id]?.q?.[resident.index];
      const line=recovered ? resident.after_recovery : resident.before_problem;
      card.append(button('스토리 대화',()=>show(titleFor(episode),[line],()=>{
        const latest=episodeState(episode.id);
        if (!latest.accepted) update(episode.id,{accepted:true});
        rememberEpisode(episode.id,`resident-${resident.index}-${recovered?'after':'before'}`);
      })));
    }
    if (!cleared || !representative) return;
    cards[representative.index].append(button(saved.rewardClaimed?'마을 완료 대화 다시 보기':'페이지와 기념품 받기',()=>{
      if (!twCleared(episode.id)) return;
      const position=story.episodes.indexOf(episode);
      const prior=story.episodes[position-1];
      const canLink=prior ? episodeState(prior.id).rewardClaimed : true;
      const allOthers=[...episodes.keys()].every(id=>id===episode.id||episodeState(id).rewardClaimed);
      const hasAnotherPage=[...episodes.keys()].some(id=>id!==episode.id&&episodeState(id).rewardClaimed);
      const relevantClear=hasAnotherPage ? episode.boss_clear : episode.boss_clear.filter(line=>!line.en.includes('another page'));
      const lines=[...relevantClear,episode.completion];
      if ((episode.next_id&&canLink)||(!episode.next_id&&allOthers)) lines.push(episode.next_dialogue);
      show(titleFor(episode),lines,()=>{
        if (!episodeState(episode.id).rewardClaimed && twCleared(episode.id)) {
          update(episode.id,{accepted:true,rewardClaimed:true});
        }
        rememberEpisode(episode.id,'completion');
        render();
      });
    }));
  }

  function decorate() {
    if (!story || !worldOpen()) return;
    const app=document.getElementById('app');
    if (G.scr==='dsel' && !app.querySelector('#c2-library')) {
      const entry=button('Chapter II · 그래머 대도서관',library);
      entry.id='c2-library';
      const host=app.querySelector('.card') || app;
      host.prepend(entry);
    }
    const episode=episodes.get(G.scr==='town' ? G.tw?.id : G.dg?.id);
    if (!episode || app.querySelector('[data-c2]')) return;
    if (G.scr==='town') {
      decorateTown(episode);
      app.querySelector('.twn')?.setAttribute('data-c2','');
    }
    const boss=G.scr==='battle' ? G.run?.[G.ei]?.boss : G.scr==='rbattle' && G.rp?.en?.[G.rp.ei]?.boss;
    if (boss && !G.rvm) {
      const entry=button(episodeState(episode.id).seenEvents?.boss?'보스 대화 다시 보기':'보스 대화',
        ()=>show(titleFor(episode),episode.boss_intro,()=>rememberEpisode(episode.id,'boss')));
      entry.dataset.c2='';
      const caption=node('span',displayName(episode.boss_en,episode.boss));
      const item=node('div',undefined,'c2-actions');
      item.append(caption,entry);
      (app.querySelector('.card') || app).prepend(item);
    }
  }

  function validate(data,registry) {
    if (!Array.isArray(data.palette) || !data.palette.every(c=>/^#[0-9a-f]{6}$/i.test(c))) throw new Error('Invalid palette');
    const validateLine=line=>{
      if (!line || !['speaker','en','ko'].every(k=>typeof line[k]==='string') ||
          !Array.isArray(line.chunks) || !line.chunks.length || line.chunks.length>data.palette.length ||
          !line.chunks.every(chunk=>typeof chunk.en==='string'&&typeof chunk.ko==='string')) throw new Error('Invalid dialogue');
    };
    const legacyTown=value=>value?.replace(/\s+/g,'');
    const ids=new Set(), pages=new Set();
    for (const episode of data.episodes) {
      const town=TOWN[episode.id];
      const names=registry.episodes[episode.id];
      const boss=GRMAP[episode.id]?.boss;
      if (!names || legacyTown(town?.nm) !== legacyTown(episode.town_legacy) || boss?.mname !== episode.boss_legacy ||
          names.town.en !== episode.town_en || names.boss.en !== episode.boss_en ||
          episode.residents.some(resident=>{
            const named=names.residents.find(row=>row.index===resident.index);
            return named?.legacy!==resident.name_legacy || named?.en!==resident.name_en;
          })) throw new Error('Naming registry mismatch: '+episode.id);
      if (!town || ids.has(episode.id) || pages.has(episode.page_id) || town.n.length!==episode.residents.length ||
          new Set(episode.residents.map(r=>r.index)).size!==town.n.length ||
          episode.residents.some(r=>town.n[r.index]?.who!==(r.name_legacy||r.name))) throw new Error('Town mismatch: '+episode.id);
      ids.add(episode.id);
      pages.add(episode.page_id);
      [...episode.boss_intro,...episode.boss_clear,episode.completion,episode.next_dialogue,
        ...episode.residents.flatMap(r=>[r.before_problem,r.after_recovery])].forEach(validateLine);
    }
    if (ids.size!==18 || Object.keys(TOWN).some(id=>!ids.has(id))) throw new Error('Expected 18 episodes');
    [...data.intro,...data.library_intro,...data.finale,...Object.values(data.milestones).flat()].forEach(validateLine);
  }

  // Keep Chapter II flags from both copies without changing the base save's timestamp conflict rule.
  const baseMergeSave=mergeSave;
  mergeSave=function(name,remote) {
    let local;
    try { local=JSON.parse(lsg('sg_save_'+name)||'null')?.chapter2; } catch {}
    const localNewer=baseMergeSave.call(this,name,remote);
    if (!local || !remote) return localNewer;
    const key='sg_save_'+name;
    const chosen=JSON.parse(lsg(key)||'null');
    if (!chosen) return localNewer;
    const online=remote.chapter2 || {episodes:{},seenEvents:{}};
    const flags={...online.seenEvents,...local.seenEvents};
    const merged={episodes:{...online.episodes},seenEvents:flags};
    for (const [id,item] of Object.entries(local.episodes||{})) {
      const previous=merged.episodes[id]||{};
      merged.episodes[id]={
        accepted:!!(previous.accepted||item.accepted),
        rewardClaimed:!!(previous.rewardClaimed||item.rewardClaimed),
        registered:!!(previous.registered||item.registered),
        seenEvents:{...previous.seenEvents,...item.seenEvents},
      };
    }
    const added=JSON.stringify(merged)!==JSON.stringify(online);
    if (added || localNewer) {
      chosen.chapter2=merged;
      lss(key,JSON.stringify(chosen));
    }
    return localNewer||added;
  };

  const originalRender=render;
  render=function() {
    const result=originalRender.apply(this,arguments);
    decorate();
    return result;
  };

  function loadData(path) {
    return fetch(new URL(path,document.baseURI),{cache:'no-cache'})
      .then(response=>{if (!response.ok) throw new Error(path+' unavailable');return response.json();});
  }

  Promise.all([loadData('story/STORY_DATA.json'),loadData('story/NAMING_REGISTRY.json')])
    .then(([data,registry])=>{
      validate(data,registry);
      story=data;
      episodes=new Map(data.episodes.map(episode=>[episode.id,episode]));
      decorate();
    })
    .catch(error=>console.error('Chapter II:',error));
})();
