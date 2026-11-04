'use strict';
/* DinoUI: bottom sheets (snap points, fling, rubber band), custom scrollbars, and the backdrop that
   blurs a little and then turns pure white. Plain DOM - it knows nothing about the game. */
(()=>{
const D=document,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),EO='cubic-bezier(.22,1,.36,1)',EI='cubic-bezier(.5,0,.75,.4)',bars=[],sheets=[];
const near=(a,v)=>a.reduce((p,q,i)=>Math.abs(q-v)<Math.abs(a[p]-v)?i:p,0);
const isLand=()=>innerWidth>innerHeight*1.1;

/* ---------- custom scrollbar: a slim pill that fades in while you scroll; drag it, or scroll the content ---------- */
function scrollbar(el,host,axis){
  const v=axis!=='x',bar=D.createElement('i'),th=D.createElement('b');bar.className='sb '+(v?'sv':'sx');bar.appendChild(th);host.appendChild(bar);
  let tm=0,raf=0,g=null,trk=1,len=1,max=1;
  const show=()=>{bar.classList.add('on');clearTimeout(tm);tm=setTimeout(()=>{if(!g)bar.classList.remove('on')},1100)};
  const upd=()=>{raf=0;const cl=v?el.clientHeight:el.clientWidth,sc=v?el.scrollHeight:el.scrollWidth,pos=v?el.scrollTop:el.scrollLeft;max=sc-cl;
    if(max<3||cl<48){bar.style.display='none';return}
    bar.style.display='';trk=cl-18;len=Math.max(32,Math.round(trk*cl/sc));const o=Math.round((trk-len)*(pos/max));
    if(v){bar.style.top=el.offsetTop+9+'px';bar.style.height=trk+'px';th.style.height=len+'px';th.style.transform='translateY('+o+'px)'}
    else{bar.style.left=el.offsetLeft+9+'px';bar.style.width=trk+'px';th.style.width=len+'px';th.style.transform='translateX('+o+'px)'}};
  const q=()=>{if(!raf)raf=requestAnimationFrame(upd)};
  el.addEventListener('scroll',()=>{q();show()},{passive:true});
  if(window.ResizeObserver)new ResizeObserver(q).observe(el);
  new MutationObserver(q).observe(el,{childList:true,subtree:true});
  th.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();g={p:v?e.clientY:e.clientX,s:v?el.scrollTop:el.scrollLeft};try{th.setPointerCapture(e.pointerId)}catch(_){}bar.classList.add('on','dg')});
  th.addEventListener('pointermove',e=>{if(!g)return;const d=(v?e.clientY:e.clientX)-g.p,x=g.s+d*max/Math.max(1,trk-len);if(v)el.scrollTop=x;else el.scrollLeft=x});
  const end=()=>{if(!g)return;g=null;bar.classList.remove('dg');show()};th.addEventListener('pointerup',end);th.addEventListener('pointercancel',end);
  const a={upd:q,flash:()=>{q();show()}};bars.push(a);q();return a}

/* ---------- bottom sheet: it is as tall as its largest snap and slides by transform only, so dragging never re-lays-out ---------- */
function sheet(el,o){
  const hd=el.querySelector('.hd'),S={el,h:-30,off:0,on:0};let FH=0,sn=[200],dg=null,ct=0,ot=0;
  const calc=()=>{FH=Math.round(innerHeight*.92);sn=o.snaps(innerHeight,FH).map(v=>Math.round(clamp(v,150,FH))).sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>=40);el.style.setProperty('--fh',FH+'px')};
  const put=(h,ms,ez)=>{S.h=h;el.style.transition=ms?'transform '+ms+'ms '+(ez||EO):'none';el.style.transform='translate(-50%,'+(FH-h)+'px)'};
  const off=h=>{S.off=Math.max(0,FH-h);el.style.setProperty('--off',S.off+'px');if(o.onfit)o.onfit(h)};
  const go=t=>{const ms=Math.round(clamp(240+Math.abs(t-S.h)*.55,280,560));clearTimeout(ot);if(t>FH-S.off)off(t);else ot=setTimeout(()=>{if(S.on)off(t)},ms);put(t,ms)};
  calc();put(-30,0);
  S.snaps=()=>sn;
  S.open=i=>{clearTimeout(ct);calc();S.on=1;const h=sn[clamp(i|0,0,sn.length-1)];el.style.visibility='visible';if(S.h<=0){put(-30,0);void el.offsetHeight}off(h);void el.offsetHeight;go(h)};
  S.close=()=>{if(!S.on)return;S.on=0;dg=null;el.classList.remove('dg');clearTimeout(ot);put(-30,340,EI);ct=setTimeout(()=>{if(!S.on)el.style.visibility='hidden'},380)};
  S.fit=()=>{if(!S.on)return;const i=near(sn,FH-S.off);calc();const h=sn[Math.min(i,sn.length-1)];off(h);put(h,0)};
  if(hd&&!o.fixed){
    hd.addEventListener('pointerdown',e=>{if(!S.on||(e.button>0&&e.pointerType==='mouse')||e.target.closest('.x,.ha,button,a,input'))return;const t=performance.now();dg={y0:e.clientY,h0:S.h,t0:t,id:e.pointerId,s:[{t,y:e.clientY}]};try{hd.setPointerCapture(e.pointerId)}catch(_){}el.classList.add('dg');clearTimeout(ot);put(S.h,0)});
    hd.addEventListener('pointermove',e=>{if(!dg||e.pointerId!==dg.id)return;let h=dg.h0+dg.y0-e.clientY;const top=sn[sn.length-1];if(h>top)h=top+(h-top)*.2;put(Math.max(-30,h),0);const t=performance.now();dg.s.push({t,y:e.clientY});while(dg.s.length>2&&t-dg.s[0].t>110)dg.s.shift()});
    const end=e=>{if(!dg||e.pointerId!==dg.id)return;const s=dg.s,a=s[0],b=s[s.length-1],v=b.t>a.t+8?(a.y-b.y)/(b.t-a.t):0,h0=dg.h0,moved=Math.abs(dg.y0-e.clientY),dt=performance.now()-dg.t0;dg=null;el.classList.remove('dg');
      const i0=near(sn,h0);let t;
      if(moved<5&&dt<320&&e.type==='pointerup')t=i0<sn.length-1?sn[i0+1]:sn[0];            /* tap on the handle: next size */
      else if(Math.abs(v)>.7)t=v>0?sn[Math.min(sn.length-1,i0+1)]:(i0>0?sn[i0-1]:0);        /* a flick moves exactly one step; only the lowest step closes */
      else{const proj=S.h+v*230;t=proj<sn[0]*.62?0:sn[near(sn,proj)];                       /* a slow drag lands on the nearest step */
        if(!t&&i0>0&&S.h>=sn[0]*.62)t=sn[0]}                                                /* closing from a higher step needs the finger itself below the lowest */
      if(!t){if(o.onclose)o.onclose();else S.close();return}go(t)};
    hd.addEventListener('pointerup',end);hd.addEventListener('pointercancel',end)}
  sheets.push(S);return S}
addEventListener('resize',()=>sheets.forEach(s=>s.fit()));

/* ---------- backdrop: a little blur, then pure white; leaves the same way ---------- */
function scrim(app,sc,at){at=at||'p';const get=()=>(app.dataset[at]||'')!==''?1:0;let on=get();
  const set=v=>{if(v===on)return;on=v;const c=parseFloat(getComputedStyle(sc).opacity)||0;sc.classList.remove('in','out');sc.style.setProperty('--s0',c);void sc.offsetWidth;sc.classList.add(v?'in':'out')};
  new MutationObserver(()=>set(get())).observe(app,{attributes:true,attributeFilter:['data-'+at]})}

window.DinoUI={sheet,scrollbar,scrim,isLand,refresh:()=>bars.forEach(b=>b.upd()),flash:()=>bars.forEach(b=>b.flash())};
})();
