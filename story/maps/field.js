/* Walkable illustrated fields for Chapter II. Movement is local to the open map. */
window.openChapterField = function(container, map, hero, targets, options={}) {
  const directions=[[0,1],[-1,0],[1,0],[0,-1]];
  const keys=['ArrowDown','ArrowLeft','ArrowRight','ArrowUp'];
  const size=46;
  const duration=155;
  const world=document.createElement('div');
  world.className='c2-field-world';
  world.style.width=map.tiles[0].length*size+'px';
  world.style.height=map.tiles.length*size+'px';
  world.style.backgroundImage=`url(${map.image})`;
  const viewport=document.createElement('div');
  viewport.className='c2-field-viewport';
  viewport.append(world);
  const actor=document.createElement('div');
  actor.className='c2-field-hero';
  actor.style.backgroundImage=`url(story/maps/wk_${hero}_walk8.webp)`;
  world.append(actor);
  const controls=document.createElement('div');
  controls.className='c2-field-controls';
  const instructions=document.createElement('p');
  instructions.textContent='길이나 주민을 누르거나 방향키로 이동하세요.';
  const destinations=document.createElement('select');
  destinations.setAttribute('aria-label','탐험 목적지');
  destinations.add(new Option('목적지 선택',''));
  for (const target of targets) destinations.add(new Option(target.label,target.id));
  destinations.onchange=()=>{
    const target=targets.find(item=>item.id===destinations.value);
    if (target) moveTo(...map.points[target.id],target.action);
    destinations.value='';
  };
  container.append(destinations,viewport,controls,instructions);
  let [x,y,initialFace]=options.position||map.spawn;
  let face=initialFace??0;
  let segment=null;
  let route=[];
  let arrival=null;
  let held=null;
  let requested=null;
  let frame=0;
  let began=null;

  function walkable(x,y) {
    return map.tiles[y]?.[x]==='.';
  }

  function paint(px,py,step) {
    const left=(px+.5)*size;
    const top=(py+.72)*size;
    actor.style.left=left+'px';
    actor.style.top=top+'px';
    actor.style.zIndex=String(10+Math.floor(py*10));
    actor.style.backgroundPosition=`${step/7*100}% ${face/3*100}%`;
    viewport.scrollLeft=left-viewport.clientWidth/2;
    viewport.scrollTop=top-viewport.clientHeight/2;
  }

  function schedule() {
    if (!frame) frame=requestAnimationFrame(tick);
  }

  function tick(now) {
    frame=0;
    if (!world.isConnected) return;
    let start=now;
    if (segment && now>=segment.start+duration) {
      x=segment.x;y=segment.y;
      start=Math.max(now-30,segment.start+duration);
      segment=null;
      if (options.onStep?.([x,y,face])) return;
    }
    if (!segment) {
      const direction=requested??route.shift()??held?.direction;
      requested=null;
      if (direction!==undefined) {
        const [dx,dy]=directions[direction];
        face=direction;
        if (walkable(x+dx,y+dy)) {
          segment={x:x+dx,y:y+dy,start};
          began??=start;
        }
      }
    }
    if (segment) {
      const t=(now-segment.start)/duration;
      paint(x+(segment.x-x)*t,y+(segment.y-y)*t,Math.floor((now-began)/29)%8);
      schedule();
    } else {
      began=null;
      paint(x,y,2);
      const action=arrival;
      arrival=null;
      action?.();
    }
  }

  function moveTo(tx,ty,action=null) {
    const start=segment||{x,y};
    const queue=[{...start,path:[]}];
    const seen=new Set([start.x+','+start.y]);
    for (const current of queue) {
      const distance=Math.abs(current.x-tx)+Math.abs(current.y-ty);
      if (distance<=(action?1:0)) {
        route=current.path;
        held=requested=null;
        arrival=action ? ()=>{
          const toward=directions.findIndex(([dx,dy])=>x+dx===tx&&y+dy===ty);
          if (toward>=0) face=toward;
          paint(x,y,2);
          action();
        } : null;
        schedule();
        return;
      }
      directions.forEach(([dx,dy],direction)=>{
        const nx=current.x+dx,ny=current.y+dy,key=nx+','+ny;
        if (!walkable(nx,ny)||seen.has(key)) return;
        seen.add(key);
        queue.push({x:nx,y:ny,path:[...current.path,direction]});
      });
    }
  }

  function move(direction,token) {
    route=[];
    arrival=null;
    held=token ? {direction,token} : null;
    requested=direction;
    schedule();
  }

  function control(label,action) {
    const el=document.createElement('button');
    el.type='button';
    el.className='btn-s';
    el.textContent=label;
    el.onclick=action;
    return el;
  }

  for (const target of targets) {
    const [tx,ty]=map.points[target.id];
    const pin=control('',()=>moveTo(tx,ty,target.action));
    pin.classList.add('c2-field-pin');
    pin.setAttribute('aria-label',target.label);
    pin.style.left=(tx+.5)*size+'px';
    pin.style.top=(ty+.72)*size+'px';
    pin.style.zIndex=String(10+ty*10);
    if (target.art) pin.append(target.art());
    if (target.image) {
      const sprite=document.createElement('img');
      sprite.src=target.image;
      sprite.alt='';
      pin.append(sprite);
    }
    const label=document.createElement('span');
    label.textContent=target.label;
    pin.append(label);
    world.append(pin);
  }

  for (const direction of [3,1,0,2]) {
    const el=control(['▼','◀','▶','▲'][direction],event=>{if(event.detail===0)move(direction);});
    el.setAttribute('aria-label',['아래로 이동','왼쪽으로 이동','오른쪽으로 이동','위로 이동'][direction]);
    el.onpointerdown=event=>{
      if (event.button!==0) return;
      el.setPointerCapture(event.pointerId);
      move(direction,el);
    };
    el.onlostpointercapture=()=>{if(held?.token===el)held=null;};
    controls.append(el);
  }
  const interact=control('상호작용',()=>{
    const target=targets.find(item=>{
      const [tx,ty]=map.points[item.id];
      return Math.abs(x-tx)+Math.abs(y-ty)<=1;
    });
    if (target && !segment) target.action();
  });
  controls.append(interact);
  container.onkeydown=event=>{
    const direction=keys.indexOf(event.key);
    if (direction<0 || event.target===destinations) return;
    event.preventDefault();
    if (!event.repeat || !held) move(direction,event.key);
  };
  container.onkeyup=event=>{if(held?.token===event.key)held=null;};
  container.onfocusout=event=>{if(!container.contains(event.relatedTarget))held=null;};
  world.onclick=event=>{
    if (event.target!==world) return;
    const box=world.getBoundingClientRect();
    moveTo(Math.floor((event.clientX-box.left)/size),Math.floor((event.clientY-box.top)/size));
  };
  schedule();
};
