/* Chapter II uses the live town and clear records from index.html. */
(() => {
  'use strict';

  const modes = { literal:'직독직해', natural:'자연스러운 해석', english:'영어 전용' };
  const preferencesKey = 'grammar-saga.chapter2.dialogue';
  let story;
  let episodes = new Map();
  let specialQuests = new Map();
  let specialPalette;
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

  function show(title, lines, done, back, options = {}) {
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
      for (const [key,label] of Object.entries(modes)) select.add(new Option(options.gloss&&key==='natural'?'한국어 풀이':label,key,key===reading.mode,key===reading.mode));
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
          if (reading.color) span.style.color=(options.palette||story.palette)[i];
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
      actions.append(audio,previous,advance);
      if (options.skip!==false) actions.append(button('건너뛰기',finish));
      actions.append(button('닫기',leave));
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
      const next= !episodeState(episode.id).seenEvents?.nextDialogue &&
        ((episode.next_id&&canLink)||(!episode.next_id&&allOthers));
      if (next) lines.push(episode.next_dialogue);
      show(titleFor(episode),lines,()=>{
        if (!episodeState(episode.id).rewardClaimed && twCleared(episode.id)) {
          update(episode.id,{accepted:true,rewardClaimed:true});
        }
        rememberEpisode(episode.id,'completion');
        if (next) rememberEpisode(episode.id,'nextDialogue');
        render();
      });
    }));
  }

  function decorate() {
    if (!story || !worldOpen()) return;
    decorateSpecial();
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

  function specialState(townId) {
    return SV.specialQuests?.[townId] || {};
  }

  function saveSpecial(townId, changes) {
    const quests=SV.specialQuests ||= {};
    quests[townId]={...quests[townId],...changes};
    saveNow();
  }

  function clueAvailable(townId,index) {
    return twCleared(townId) || !!SV.town?.[townId]?.q?.[index];
  }

  function readClue(quest,index,back,collect) {
    const townId=quest.town_id;
    show(specialTitle(quest),[quest.clues[index]],()=>{
      if (collect && clueAvailable(townId,index) && !specialState(townId).clues?.[index]) {
        saveSpecial(townId,{clues:{...specialState(townId).clues,[index]:true}});
      }
    },back,{palette:specialPalette,gloss:true,skip:!collect});
  }

  function specialTitle(quest) {
    return displayName(quest.title_en,quest.title_ko);
  }

  const caseBoards = {
    identity_match:'안내소의 이름표와 위치', order_builder:'주문표와 확인 질문',
    safety_plan:'통행 경로와 안전 장비', suspect_match:'수색 대상과 목격 기록',
    detective:'용의자와 책의 회수 장소', memory_archive:'편지의 인물과 사건',
    manuscript_decode:'발견자와 비문의 내용', wish_solution:'소원과 해결 방법',
    lost_found:'분실물에 주인 연결하기', goal_match:'여행 목표와 활동',
    witness_board:'목격한 일과 느낀 일', festival_setup:'축제 물품과 안전 표지',
    seal_puzzle:'문을 연 열쇠와 필요한 덕목',
  };

  function saveAnswers(quest, correct) {
    const townId=quest.town_id;
    const saved=specialState(townId);
    if (!quest.clues.every((_,i)=>saved.clues?.[i])) return;
    const answers={...saved.answers};
    for (const task of correct) answers[task.id]=true;
    const complete=quest.tasks.every(task=>answers[task.id]);
    saveSpecial(townId,{answers,...(complete?{completionFlag:quest.reward.id}:{})});
  }

  function taskField(task) {
    const field=node('fieldset',undefined,'c2-task');
    const english=node('legend',task.question_en);
    english.lang='en';
    field.append(english);
    if (reading.mode!=='english') field.append(node('p',task.question_ko));
    return field;
  }

  function feedbackBox() {
    const feedback=node('p',undefined,'c2-feedback');
    feedback.setAttribute('role','status');
    return feedback;
  }

  function caseBoard(quest,saved,back) {
    const board=node('section',undefined,'c2-case');
    const feedback=feedbackBox();
    const selected=new Map();
    const slots=[];
    const allDone=quest.tasks.every(task=>saved.answers?.[task.id]);
    board.append(node('h4',caseBoards[quest.interaction_type] ||
      (quest.interaction_type==='ranking'?'시상대 배치':'사건 기록')));
    if (!allDone) board.append(node('p','각 칸에 후보를 놓고 제출하세요.'));
    for (const [index,task] of quest.tasks.entries()) {
      const field=taskField(task);
      field.classList.add('c2-slot');
      if (saved.answers?.[task.id]) {
        field.append(node('p',task.options[task.correct_index],'c2-placement'));
      } else {
        const placement=node('p','비어 있음','c2-placement');
        placement.setAttribute('aria-live','polite');
        const options=node('div',undefined,'c2-actions');
        const choices=task.options.map((choice,i)=>{
          const option=button(choice,()=>{
            selected.set(task.id,i);
            placement.textContent=choice;
            placement.lang='en';
            choices.forEach((item,j)=>item.setAttribute('aria-pressed',String(i===j)));
            updateSubmit();
          });
          option.lang='en';
          option.setAttribute('aria-pressed','false');
          return option;
        });
        options.append(...choices);
        field.append(placement,options);
        slots.push({task,field});
      }
      if (quest.interaction_type==='ranking') {
        field.classList.add('c2-podium');
        field.dataset.place=String(index+1);
      }
      board.append(field);
    }
    const submit=button('배치 제출',()=>{
      const correct=slots.filter(({task})=>selected.get(task.id)===task.correct_index);
      const wrong=slots.filter(slot=>!correct.includes(slot));
      if (!wrong.length) {saveAnswers(quest,correct.map(slot=>slot.task));back();return;}
      if (correct.length) {
        saveAnswers(quest,correct.map(slot=>slot.task));
        for (const {field,task} of correct) {
          field.querySelector('.c2-actions').remove();
          field.querySelector('.c2-placement').textContent=task.options[task.correct_index];
        }
        slots.splice(0,slots.length,...wrong);
      }
      feedback.textContent=wrong.map(({task})=>task.retry_ko).join(' ');
      updateSubmit();
    });
    function updateSubmit() {
      const choices=quest.tasks.map(task=>saved.answers?.[task.id]?task.options[task.correct_index]:task.options[selected.get(task.id)]);
      const duplicate=quest.interaction_type==='ranking' && choices[0] && choices[0]===choices[1];
      submit.disabled=!!duplicate || slots.some(({task})=>!selected.has(task.id));
      if (duplicate) feedback.textContent='1위와 2위에는 서로 다른 선수를 놓아야 합니다.';
      else if (feedback.textContent==='1위와 2위에는 서로 다른 선수를 놓아야 합니다.') feedback.textContent='';
    }
    if (!allDone) {
      updateSubmit();
      board.append(submit,feedback);
    }
    return board;
  }

  function chronology(task) {
    const order=['Baking bread','Buying apples','Delivering the cake'].map(event=>task.options.indexOf(event));
    return order[0]===task.correct_index && order.every(index=>index>=0) ? order : null;
  }

  function timelineTask(quest,task,back,sequence) {
    const field=taskField(task);
    field.append(node('p','위·아래 버튼으로 이른 사건부터 순서대로 배치하세요.'));
    const order=task.options.map((_,index)=>index);
    const list=node('ol',undefined,'c2-timeline');
    const feedback=feedbackBox();
    function renderOrder(focusIndex,direction) {
      list.replaceChildren(...order.map((index,position)=>{
        const row=node('li');
        const event=node('span',task.options[index]);
        event.lang='en';
        const controls=node('div',undefined,'c2-actions');
        for (const delta of [-1,1]) {
          const move=button(delta<0?'↑':'↓',()=>{
            const other=position+delta;
            [order[position],order[other]]=[order[other],order[position]];
            feedback.textContent='';
            renderOrder(other,delta);
          });
          move.setAttribute('aria-label',task.options[index]+(delta<0?' 위로':' 아래로'));
          move.dataset.delta=delta;
          move.disabled=position+delta<0 || position+delta>=order.length;
          controls.append(move);
        }
        row.append(event,controls);
        return row;
      }));
      if (focusIndex!==undefined) {
        const row=list.children[focusIndex];
        (row.querySelector('[data-delta="'+direction+'"]:not(:disabled)') || row.querySelector('button:not(:disabled)')).focus();
      }
    }
    renderOrder();
    field.append(list,button('시간표 제출',()=>{
      if (order.some((index,i)=>index!==sequence[i])) {feedback.textContent=task.retry_ko;return;}
      saveAnswers(quest,[task]);
      back();
    }),feedback);
    return field;
  }

  function choiceTask(quest,task,back, map) {
    const field=taskField(task);
    const feedback=feedbackBox();
    const options=node('div',undefined,map?'c2-map c2-map-'+quest.town_id:'c2-actions');
    if (map) field.append(node('p','약도에서 단서와 일치하는 지점을 선택하세요.'));
    task.options.forEach((choice,index)=>{
      const option=button(choice,()=>{
        if (index!==task.correct_index) {feedback.textContent=task.retry_ko;return;}
        saveAnswers(quest,[task]);
        back();
      });
      option.lang='en';
      if (map) option.classList.add('c2-map-point');
      options.append(option);
    });
    field.append(options,feedback);
    return field;
  }

  function renderSpecialTasks(body,quest,saved,back) {
    const type=quest.interaction_type;
    if (Object.hasOwn(caseBoards,type) || type==='ranking') {
      body.append(caseBoard(quest,saved,back));
      return;
    }
    const map=['map_search','navigation','message_restore'].includes(type);
    for (const [i,task] of quest.tasks.entries()) {
      const sequence=i===0 && type==='timeline' ? chronology(task) : null;
      if (saved.answers?.[task.id]) {
        const field=taskField(task);
        field.append(node('p','해결 완료'));
        body.append(field);
      } else if (sequence) {
        body.append(timelineTask(quest,task,back,sequence));
      } else {
        body.append(choiceTask(quest,task,back,map&&i===0));
      }
    }
  }

  function specialJournal(townId) {
    closeDialogueIfOpen();
    const quest=specialQuests.get(townId);
    const title='특별 퀘스트 일지';
    dialogue=node('dialog',undefined,'c2-dialog');
    dialogue.setAttribute('aria-label',title);
    document.body.append(dialogue);
    const body=node('div',undefined,'c2-body');
    dialogue.append(body);
    dialogue.addEventListener('cancel',event=>{event.preventDefault();closeDialogue();});
    body.append(node('h2',title));
    const back=()=>specialJournal(townId);
    const navigation=node('div',undefined,'c2-actions');
    if (quest) navigation.append(button('퀘스트 목록',()=>specialJournal()));
    navigation.append(button('닫기',closeDialogue));
    body.append(navigation);
    if (quest) {
      const saved=specialState(townId);
      const count=quest.clues.filter((_,i)=>saved.clues?.[i]).length;
      body.append(node('h3',specialTitle(quest)),node('p',quest.premise_ko),
        node('p',`수집한 단서 ${count} / ${quest.clues.length}${saved.completionFlag?' · 사건 해결 완료':''}`));
      const evidence=node('ol',undefined,'c2-evidence');
      quest.clues.forEach((clue,i)=>{
        const row=node('li');
        if (saved.clues?.[i]) row.append(button(clue.speaker+' · 단서 다시 보기',()=>readClue(quest,i,back,false)));
        else row.append(node('span',clue.speaker+' · 미수집'));
        evidence.append(row);
      });
      body.append(evidence);
      if (count<quest.clues.length) {
        body.append(node('p','마을에서 주민의 말을 고치거나 관련 던전을 클리어한 후, 주민에게 단서를 들을 수 있어요.'));
        if (G.scr!=='town' || G.tw?.id!==townId) {
          body.append(button('마을 방문',()=>{closeDialogue();twOpen(townId);}));
        }
      } else {
        renderSpecialTasks(body,quest,saved,back);
      }
      if (saved.completionFlag && !episodeState(townId).seenEvents?.nextDialogue &&
          (!quest.next_id ? [...episodes.keys()].every(id=>episodeState(id).rewardClaimed) : true)) {
        body.append(button('후속 대화',()=>show(specialTitle(quest),[quest.next_dialogue],
          ()=>rememberEpisode(townId,'nextDialogue'),back)));
      }
    } else {
      const list=node('ul');
      for (const item of specialQuests.values()) {
        const saved=specialState(item.town_id);
        const count=item.clues.filter((_,i)=>saved.clues?.[i]).length;
        const row=node('li');
        row.append(button(`${item.town_en} · ${item.title_ko} · ${saved.completionFlag?'해결 완료':count+' / '+item.clues.length}`,
          ()=>specialJournal(item.town_id)));
        list.append(row);
      }
      body.append(list);
    }
    dialogue.showModal();
  }

  function decorateSpecial() {
    if (!specialQuests.size) return;
    const app=document.getElementById('app');
    if (app.querySelector('[data-special-quest]')) return;
    if (G.scr==='dsel') {
      const entry=button('특별 퀘스트 일지',()=>specialJournal());
      entry.dataset.specialQuest='';
      (app.querySelector('.card') || app).prepend(entry);
    } else if (G.scr==='town') {
      const quest=specialQuests.get(G.tw?.id);
      if (!quest) return;
      const entry=button('특별 퀘스트 일지',()=>specialJournal(quest.town_id));
      entry.dataset.specialQuest='';
      (app.querySelector('.card') || app).prepend(entry);
      const cards=app.querySelectorAll('.twn');
      quest.clues.forEach((_,i)=>{
        const collected=specialState(quest.town_id).clues?.[i];
        const clue=button(collected?'단서 다시 보기':'특별 퀘스트 단서',()=>readClue(quest,i,()=>{
          render();
          specialJournal(quest.town_id);
        },!collected));
        clue.disabled=!clueAvailable(quest.town_id,i) && !collected;
        if (clue.disabled) clue.title='주민 교정 또는 던전 클리어 후 열립니다.';
        cards[i]?.append(clue);
      });
    }
  }

  function validateSpecial(data) {
    if (!Array.isArray(data.palette) || !data.palette.every(c=>/^#[0-9a-f]{6}$/i.test(c))) throw new Error('Invalid special quest palette');
    const ids=new Set();
    for (const quest of data.quests) {
      const episode=episodes.get(quest.town_id);
      if (!episode || ids.has(quest.town_id) || quest.clues.length!==4 || quest.tasks.length!==2 ||
          quest.town_en!==episode.town_en || quest.reward.type!=='completion_flag' ||
          quest.clues.some((line,i)=>line.speaker!==episode.residents.find(r=>r.index===i)?.name_en ||
            !line.chunks.length || line.chunks.length>data.palette.length ||
            !line.chunks.every(chunk=>typeof chunk.en==='string' && typeof chunk.ko==='string')) ||
          quest.tasks.some(task=>task.options.length!==3 || !Number.isInteger(task.correct_index) ||
            task.correct_index<0 || task.correct_index>=task.options.length ||
            !task.evidence_indices.length || task.evidence_indices.some(i=>!Number.isInteger(i)||!quest.clues[i]))) {
        throw new Error('Invalid special quest: '+quest.town_id);
      }
      ids.add(quest.town_id);
    }
    if (ids.size!==episodes.size) throw new Error('Incomplete special quest coverage');
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

  // Keep monotonic story flags from both devices using the existing save conflict rule.
  function mergeChapter(local, online = {}) {
    const merged={episodes:{...online.episodes},seenEvents:{...online.seenEvents,...local.seenEvents}};
    for (const [id,item] of Object.entries(local.episodes||{})) {
      const previous=merged.episodes[id]||{};
      merged.episodes[id]={
        accepted:!!(previous.accepted||item.accepted),
        rewardClaimed:!!(previous.rewardClaimed||item.rewardClaimed),
        registered:!!(previous.registered||item.registered),
        seenEvents:{...previous.seenEvents,...item.seenEvents},
      };
    }
    return merged;
  }

  function mergeSpecial(local, online = {}) {
    const merged={...online};
    for (const [id,item] of Object.entries(local)) {
      const previous=merged[id]||{};
      merged[id]={...previous,...item,clues:{...previous.clues,...item.clues},answers:{...previous.answers,...item.answers}};
      const quest=specialQuests.get(id);
      if (quest && quest.clues.every((_,i)=>merged[id].clues[i]) && quest.tasks.every(task=>merged[id].answers[task.id])) {
        merged[id].completionFlag ||= quest.reward.id;
      }
    }
    return merged;
  }

  const baseMergeSave=mergeSave;
  mergeSave=function(name,remote) {
    const key='sg_save_'+name;
    let local;
    try { local=JSON.parse(lsg(key)||'null'); } catch {}
    const localNewer=baseMergeSave.call(this,name,remote);
    if (!local || !remote) return localNewer;
    const chosen=JSON.parse(lsg(key)||'null');
    if (!chosen) return localNewer;
    let added=false;
    for (const [field,merge] of [['chapter2',mergeChapter],['specialQuests',mergeSpecial]]) {
      if (!local[field]) {
        if (localNewer && remote[field]) chosen[field]=remote[field];
        continue;
      }
      chosen[field]=merge(local[field],remote[field]);
      if (JSON.stringify(chosen[field])!==JSON.stringify(remote[field])) added=true;
    }
    if (added || localNewer) lss(key,JSON.stringify(chosen));
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
      return loadData('story/SPECIAL_QUESTS.json').then(special=>{
        validateSpecial(special);
        specialPalette=special.palette;
        specialQuests=new Map(special.quests.map(quest=>[quest.town_id,quest]));
        decorate();
      });
    })
    .catch(error=>console.error('Chapter II:',error));
})();
