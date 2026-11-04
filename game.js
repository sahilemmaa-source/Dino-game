'use strict';
(()=>{
{const A=window.DINO_ALLOWED;if(Array.isArray(A)&&A.length&&!A.some(h=>location.hostname===h||location.hostname.endsWith('.'+h))){document.body.textContent='';return}}
const $=s=>document.querySelector(s),KB='dino-run.best.v5',KR='dino-run.session.v2',KP='dino-run.prefs.v2';
const ST={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},d:k=>{try{localStorage.removeItem(k)}catch(e){}}};
let P={zoom:1,rot:1,cap:0,th:0,trk:0};try{Object.assign(P,JSON.parse(ST.g(KP)||'{}'))}catch(e){}
let hi=Math.max(0,parseInt(ST.g(KB))||0);
const FX=window.DinoFX;
let coach={on:0,stage:0,t:0,s:0,off:-9};
const app=$('#app'),cv=$('#c'),cx=cv.getContext('2d',{alpha:false}),hudEl=$('#hud'),hsCv=$('#hs'),hhCv=$('#hh');
/* ---------- sprites: one grid cell = one world unit; masks double as collision pixels ---------- */
const FONT='"FK Grotesk Neue","FK Grotesk",Manrope,Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
const fin=(o,k=[20,20,19])=>{const c=document.createElement('canvas');c.width=o.w;c.height=o.h;const g=c.getContext('2d'),d=g.createImageData(o.w,o.h);for(let i=0;i<o.m.length;i++)if(o.m[i]){d.data[i*4+3]=255;d.data[i*4]=k[0];d.data[i*4+1]=k[1];d.data[i*4+2]=k[2]}g.putImageData(d,0,0);o.c=c;return o};
const rows=(r,w)=>{const h=r.length,m=new Uint8Array(w*h);r.forEach((s,j)=>{for(let i=0;i<s.length;i++)if(s[i]==='#')m[j*w+i]=1});return{w,h,m}};
const rects=(w,h,fn)=>{const m=new Uint8Array(w*h);fn((x,y,a,b)=>{for(let j=y;j<y+b;j++)for(let i=x;i<x+a;i++)if(i>=0&&i<w&&j>=0&&j<h)m[j*w+i]=1});return{w,h,m}};
const BODY=[".........######.","........##.#####","........########","........########","........########","........#####...","#......########.","##....######....","###..#######....","##############..","############.#..",".###########....","..#########.....","...#######......"];
const LA=["....###.##......","....##...#......","....#....##.....","....##.........."],LB=["....###.##......",".....##.##......","......#..##.....","........##......"];
const up2=r=>r.flatMap(s=>{const t=[...s].map(c=>c+c).join('');return[t,t]});
const squash=s=>{const w=44,h=22,m=new Uint8Array(w*h);for(let j=0;j<h;j++)for(let i=0;i<w;i++)m[j*w+i]=s.m[((j*s.h/h)|0)*s.w+((i*s.w/w)|0)];return{w,h,m}};
const dn=l=>rows(up2(BODY.concat(l)),32);
const G=(f,k)=>(x,y,a,b)=>f(Math.round(x*k),Math.round(y*k),Math.round(a*k),Math.round(b*k));
const cact=(f,x,h,l,r)=>{f(x+5,0,5,h);if(l>=0){f(x+1,l,4,8);f(x+1,l+5,6,3)}if(r>=0){f(x+11,r,4,8);f(x+9,r+5,5,3)}};
const crow=n=>{const s=rects(36,26,f=>{const g=G(f,2);g(4,5,9,4);g(1,3,4,4);g(0,5,2,1);g(13,6,5,2);g(14,8,4,1);if(n===0){g(6,0,2,5);g(8,1,3,4)}else if(n===1){g(6,3,7,2)}else{g(6,9,2,4);g(8,9,3,3)}});for(let j=8;j<10;j++)for(let i=4;i<6;i++)s.m[j*36+i]=0;return fin(s)};
const art=(rows,k=2)=>rects(rows[0].length*k,rows.length*k,f=>rows.forEach((r,y)=>{for(let x=0;x<r.length;x++)if(r[x]==='#')f(x*k,y*k,k,k)}));
const CSR=[".....###.....","....#####....","....##.##....","...###.##....","....##.##..#.","....##.##.###","....##.##.###",".#..##.##.###","###.##.##.###","###.#########","###.#########","###.##.###...","#########....","#########....","...###.##....","....##.##....","....##.###...","....##.##...."];
const CTR=[...CSR.slice(0,4),...Array(7).fill("....##.##...."),...CSR.slice(4)];
const CGR=CTR.map((r,y)=>r+'.'+(y<7?'.............':CSR[y-7]));
const SP={dino:[fin(dn(LA)),fin(dn(LB))],duck:[fin(squash(dn(LA))),fin(squash(dn(LB)))],
cac:[fin(art(CSR)),fin(art(CTR)),fin(art(CGR))],crow:[crow(0),crow(1),crow(2)]};
const LANE=[3,26,56],FR=[0,1,2,1],HST=[];
const THM=[[[20,20,19],[20,20,19],[20,20,19]],[[255,92,138],[60,199,154],[108,99,255]],[[30,136,229],[0,168,150],[57,73,171]],[[255,112,67],[171,71,188],[92,107,192]],[[67,160,71],[124,179,66],[109,76,65]],[[249,168,37],[38,166,154],[69,90,100]]];
const tint=()=>{const T=THM[P.th|0]||THM[0];[[SP.dino,T[0]],[SP.duck,T[0]],[SP.cac,T[1]],[SP.crow,T[2]]].forEach(([a,c])=>a.forEach(o=>fin(o,c)))};tint();
/* ---------- world / state ---------- */
const GRAV=945,JV=344,STEP=1/120,HX=34,H0=64;
let st='home',S=1,vw=230,vh=176,gy=130,dpr=1,clk=0,time=0,dist=0,speed=135,scroll=0,score=0,since=0,gap=0,obs=[],skyT=0,sky=0,wt=0,nextM=350,sim=0,land=0;
const D={x:HX,dy:0,vy:0,drag:0,duck:0,pid:-1};
const spd=()=>Math.min(324,135+time*1.9)*(land&&P.rot?1.4:1);
function size(){dpr=Math.min(devicePixelRatio||1,4);const z=P.zoom,w=innerWidth,h=innerHeight;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);land=w>h*1.1?1:0;S=Math.max(1,Math.round(land?Math.max(cv.height/(250/z),cv.width/(420/z)):cv.width/(230/z)));vw=cv.width/S;vh=cv.height/S;gy=Math.round(vh*(land?.74:.72))}
const hs=n=>{n=Math.imul(n^n>>>15,2246822519);n=Math.imul(n^n>>>13,3266489917);return(n^n>>>16)>>>0};
const dspr=s=>(s.duck?SP.duck:SP.dino)[s.dy>0?0:((s.time*11)|0)%2];
const curSpr=()=>dspr({duck:D.duck,dy:D.dy,time});
const osp=(o,t)=>o.k<3?SP.cac[o.k]:SP.crow[FR[((t*10)|0)%4]];
const oy=(o,s)=>o.k<3?gy-s.h:gy-LANE[o.l]-s.h;
function hit(a,ax,ay,b,bx,by){const x0=Math.max(ax,bx),x1=Math.min(ax+a.w,bx+b.w),y0=Math.max(ay,by),y1=Math.min(ay+a.h,by+b.h);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(a.m[(y-ay)*a.w+x-ax]&&b.m[(y-by)*b.w+x-bx])return 1;return 0}
function phys(d,dt){if(!d.drag&&(d.dy>0||d.vy>0)){d.vy-=GRAV*(d.duck?2.2:1)*dt;d.dy+=d.vy*dt;if(d.dy<=0){d.dy=0;d.vy=0}}}
/* ---------- audio: tap blip + synthesized warm guitar loop (Karplus-Strong, fully offline) ---------- */
let AC,mg,mI=0,mOn=0,mN=0,mS=0,mT0=0,TR=null,kc={};
function au(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume().catch(()=>{})}
function blip(f1,f2,d,v){if(!AC)return;try{const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type='square';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)}catch(e){}}
const rnd32=s=>()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;
const SCL=[[0,2,4,7,9],[0,3,5,7,10],[0,2,3,5,7,8,10],[0,2,4,5,7,9,11],[0,2,4,6,7,9,11],[0,2,4,5,7,9,10],[0,2,3,5,7,9,10],[0,2,3,5,7,8,11]],PRG=[[0,5,3,4],[0,3,4,3],[0,4,5,3],[5,3,0,4],[0,2,3,4],[0,3,0,4],[0,5,2,4],[3,4,0,0]],ARP=[[0,1,2,1,3,1,2,1],[0,2,1,2,0,2,3,2],[0,1,2,3,2,1,2,1],[0,2,3,2,1,2,0,1]];
const ORD=(()=>{const a=[...Array(100).keys()],r=rnd32(777);for(let i=99;i>0;i--){const j=(r()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return a})();
function mkTrack(i){const r=rnd32(i*7919+13),sc=SCL[(r()*8)|0];return{sc,n:sc.length,pg:PRG[(r()*8)|0],ap:ARP[(r()*4)|0],root:40+((r()*12)|0),e:30/(60+((r()*52)|0)),mel:.14+r()*.3,br:.32+r()*.33,dec:2.2+r()*1.6,pad:r()<.55,spb:r()<.3?6:8,r:rnd32(i*31+5),mi:5}}
function ks(m,dec,br){const R=22050,f=440*Math.pow(2,(m-69)/12),N=Math.max(2,Math.round(R/f)),len=Math.round(R*dec),b=AC.createBuffer(1,len,R),y=b.getChannelData(0);let s=(m*2654435761)>>>0,pk=1e-6;for(let i=0;i<N;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;y[i]=s/2147483648-1}for(let i=1;i<N;i++){y[i]=br*y[i]+(1-br)*y[i-1];pk=Math.max(pk,Math.abs(y[i]))}const ro=Math.pow(.02,N/len);for(let i=N;i<len;i++)y[i]=.5*(y[i-N]+y[i-N+1])*ro;for(let i=0;i<len;i++)y[i]*=Math.min(1,(len-i)/3000)*.55/pk;return b}
function note(m,t,v,mel){const k=m+(mel?'m':'');let b=kc[k];if(!b)b=kc[k]=ks(m,mel?TR.dec*1.4:TR.dec,mel?Math.min(.9,TR.br+.12):TR.br);const s=AC.createBufferSource(),g=AC.createGain();s.buffer=b;g.gain.value=v;s.connect(g);g.connect(mg);s.start(t)}
function tone(T,d){const n=T.n;return T.root+12*Math.floor(d/n)+T.sc[((d%n)+n)%n]}
function nextTrack(){TR=mkTrack(ORD[(P.trk|0)%100]);P.trk=((P.trk|0)+1)%100;prefs();kc={};mS=0;mT0=mN}
function stepAt(t){const T=TR,j=mS%T.spb,d=T.pg[Math.floor(mS/T.spb)%4],n=T.n,ch=[d,d+2,d+4,d+n];
if(j===0)note(tone(T,d),t,.5);else if(j===T.spb/2)note(tone(T,d+4),t,.32);
note(tone(T,ch[T.ap[j%8]])+12,t,.2+.06*(j%2));
if(T.r()<T.mel&&j%2===0){T.mi=Math.max(0,Math.min(2*n,T.mi+((T.r()*5)|0)-2));note(T.root+24+tone({root:0,sc:T.sc,n},T.mi),t,.26,1)}
if(T.pad&&j===0){for(const c of [d,d+2,d+4]){const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=440*Math.pow(2,(tone(T,c)-69)/12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.5);g.gain.linearRampToValueAtTime(0,t+T.e*T.spb*1.02);o.connect(g);g.connect(mg);o.start(t);o.stop(t+T.e*T.spb*1.05)}}}
function tick(){try{while(mN<AC.currentTime+.4){stepAt(mN);mN+=TR.e;mS++;if(mN-mT0>120)nextTrack()}}catch(e){}}
function music(on,fd){if(!AC)return;const t=AC.currentTime;
if(on&&!mOn){mOn=1;try{if(!mg){mg=AC.createGain();mg.gain.value=0;const dl=AC.createDelay(1),fb=AC.createGain(),wg=AC.createGain();dl.delayTime.value=.34;fb.gain.value=.3;wg.gain.value=.3;mg.connect(AC.destination);mg.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wg);wg.connect(AC.destination)}mg.gain.cancelScheduledValues(t);mg.gain.setValueAtTime(mg.gain.value,t);mg.gain.linearRampToValueAtTime(.67,t+2.5);if(!mI){mN=t+.15;nextTrack();mI=setInterval(tick,100)}}catch(e){mOn=0}}
else if(!on&&mOn){mOn=0;const f=fd||.6;try{mg.gain.cancelScheduledValues(t);mg.gain.setValueAtTime(mg.gain.value,t);mg.gain.linearRampToValueAtTime(0,t+f)}catch(e){}setTimeout(()=>{if(!mOn&&mI){clearInterval(mI);mI=0}},f*1000+150)}}
/* ---------- flow ---------- */
const fs=()=>{try{const e=document.documentElement,f=e.requestFullscreen||e.webkitRequestFullscreen;if(f&&!document.fullscreenElement&&!document.webkitFullscreenElement){const r=f.call(e,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}}catch(e){}};
const vib=p=>{try{const u=navigator.userActivation;if(navigator.vibrate&&(!u||u.hasBeenActive))navigator.vibrate(p)}catch(e){}};
let gT=0;const guard=ms=>{ms=ms||450;gT=performance.now()+ms;app.dataset.g='1';setTimeout(()=>{if(performance.now()>=gT-5)delete app.dataset.g},ms+40)};
const prefs=()=>ST.s(KP,JSON.stringify({v:2,zoom:P.zoom,rot:P.rot,cap:P.cap,th:P.th,trk:P.trk,cp:P.cp|0,runs:P.runs|0,fd:P.fd|0,cs:P.cs|0,ce:(P.ce||[]).slice(-2),cn:P.cn|0,cq:P.cq>>>0,cl:P.cl>=0?P.cl:-1}));
function reset(){banked=0;time=0;dist=0;speed=135;scroll=0;score=0;obs=[];gap=450;since=330;skyT=0;sky=0;wt=0;nextM=350;HST.length=0;hN=0;Object.assign(D,{x:HX,dy:0,vy:0,drag:0,duck:0,pid:-1})}
function set(s){st=s;app.dataset.st=s;if(s!=='run')music(0);if(s==='run'||s==='pause')guard(420);if(s==='over'){guard(700);drawOver()}}
function go(easy){au();fs();wantFs=1;reset();if(easy===1)since=0;set('run');vib(18);coachStart()}
function jump(){if(st==='run'&&!D.drag&&D.dy<=0){D.vy=JV*jb();D.dy=.01;blip(420,880,.09,.06)}}
function die(){set('over');if(score>hi){hi=score;ST.s(KB,String(hi))}ST.d(KR);vib(1000);blip(220,40,.5,.1);bank();qd=time<14?qd+1:0;if((!(P.cp|0)||qd>=3)&&(P.cp|0)<5){qd=0;P.cp=(P.cp|0)+1;prefs();setTimeout(()=>{if(st==='over')openCP()},550)}}
function save(){if(st!=='run'&&st!=='pause')return;ST.s(KR,JSON.stringify({v:2,bk:banked,time,dist,scroll,since,gap,x:D.x,dy:D.dy,vy:D.vy,o:obs.map(o=>[o.k,o.x,o.l])}))}
function pause(){if(st==='run'){set('pause');D.drag=0;D.duck=0;bank();save()}}
function resume(){if(st==='pause'){au();fs();last=0;set('run')}}
function restore(){try{const r=JSON.parse(ST.g(KR)||'null');if(!r||r.v!==2)return;reset();banked=+r.bk||0;time=+r.time||0;dist=+r.dist||0;scroll=+r.scroll||0;since=+r.since||0;gap=+r.gap||300;D.x=+r.x||HX;D.dy=+r.dy||0;D.vy=+r.vy||0;obs=(r.o||[]).filter(a=>a&&a[0]>=0&&a[0]<4).map(a=>({k:a[0]|0,x:+a[1]||0,l:a[2]|0}));speed=spd();score=Math.floor(dist*.1);nextM=350;while(nextM<=score)nextM*=2;set('pause')}catch(e){ST.d(KR);reset();set('home')}}
function toHome(){bank();if(score>hi){hi=score;ST.s(KB,String(hi))}ST.d(KR);reset();set('home');app.dataset.p=''}
function spawn(){let k=(Math.random()*3)|0,l=0;if(score>200&&Math.random()<.34){k=3;const q=Math.random();l=q<.5?1:q<.75?0:2}obs.push({k,x:vw+56,l});gap=speed*.78+70+Math.random()*speed*.75}
function step(dt){time+=dt;speed=spd();const v=speed*(1+.3*sky)*dt;dist+=v;scroll+=v;score=Math.floor(dist*.1);
if(score>=nextM){nextM*=2;if(!sim){blip(660,1320,.14,.05);hudEl.classList.remove('fl');void hudEl.offsetWidth;hudEl.classList.add('fl')}}
phys(D,dt);if(!D.drag)D.x+=(HX-D.x)*Math.min(1,dt*3);
const mx=gy-curSpr().h-vh*.12,h0=Math.min(H0,mx*.62);skyT=D.drag?Math.max(0,Math.min(1,(D.dy-h0)/Math.max(20,mx-h0))):0;if(!sim&&sky>.1)wt+=dt;
if(!sim){if(D.drag&&sky>.2)music(1);else if(mOn&&skyT<.08)music(0,2.4)}
if(sky<.12){since+=v;if(since>=gap){since=0;spawn()}}
for(const o of obs)o.x-=v+(o.k===3?24*dt:0);
while(obs.length&&obs[0].x<-60)obs.shift();
const s=curSpr(),ax=Math.round(D.x),ay=Math.round(gy-s.h-D.dy);
for(const o of obs){const b=osp(o,time);if(o.x>ax+s.w+2||o.x+b.w<ax-2)continue;if(!(ghost>0)&&hit(s,ax,ay,b,Math.round(o.x),oy(o,b))){if(sim)sim=2;else die();return}}}
/* while the fly coach is up the world stands still (no obstacles, no score, no weather) - only the dino can move, so nothing can end the lesson */
function cStep(dt){phys(D,dt);if(!D.drag)D.x+=(HX-D.x)*Math.min(1,dt*3);const mx=gy-curSpr().h-vh*.12,h0=Math.min(H0,mx*.62);skyT=D.drag?Math.max(0,Math.min(1,(D.dy-h0)/Math.max(20,mx-h0))):0;if(D.drag&&sky>.2)music(1);else if(mOn&&skyT<.08)music(0,2.4)}
/* ---------- drawing: one paint() serves the game, the camera shots and the tutorial demos ---------- */
const smile=(C,x,y)=>{C.fillStyle='#fff';C.fillRect(x+24,y+6,2,2);C.fillRect(x+26,y+8,3,2);C.fillRect(x+29,y+6,2,2)};
function paint(C,s,vw,vh,gy){C.imageSmoothingEnabled=false;const sk=s.sky,clk=s.clk,oyy=(o,p)=>o.k<3?gy-p.h:gy-LANE[o.l]-p.h;
if(sk>.01&&FX)FX.weather(C,s,vw,vh);
const ga=Math.max(0,1-sk*1.6);
if(ga>.01){C.globalAlpha=ga;C.fillStyle='#141413';C.fillRect(0,gy,vw,1);const o0=Math.floor(s.scroll),fx=-(s.scroll%1);for(let i=0;i<=vw+1;i++){const h=hs(o0+i);if(h%9===0){C.fillStyle='#141413';C.fillRect(i+fx,gy-1,1+h%3,1)}if(h%5===1){C.fillStyle='#8c8c8c';C.fillRect(i+fx,gy+3+(h>>3)%6,2+(h>>6)%3,1)}}
if(!s.home)for(const o of s.obs){const p=osp(o,s.time);C.drawImage(p.c,Math.round(o.x),oyy(o,p));if(o.x>vw-2&&((clk*7)|0)%2){const my=oyy(o,p)+p.h/2;C.fillStyle='#141413';C.beginPath();C.moveTo(vw-10,my);C.lineTo(vw-3,my-5);C.lineTo(vw-3,my+5);C.fill()}}C.globalAlpha=1}
if(s.home){const port=vw<vh,d=SP.dino[((clk*6)|0)%2],k=Math.max(2,Math.floor(Math.min(vw*.74/32,(gy-vh*.04)/36)*2)/2),dw=d.w*k,dh=d.h*k,x=Math.round(vw*(port?.03:.12)),y=Math.round(gy-dh),c1=SP.cac[1],c0=SP.cac[0],k2=Math.max(1,k*.2);
C.drawImage(c1.c,Math.round(vw*(port?.78:.7)),Math.round(gy-c1.h*k2),c1.w*k2,c1.h*k2);C.drawImage(c0.c,Math.round(vw*(port?.89:.82)),Math.round(gy-c0.h*k2*1.1),c0.w*k2*1.1,c0.h*k2*1.1);
C.fillStyle='rgba(20,20,19,.12)';C.fillRect(x+dw*.08,gy,dw*.9,Math.max(2,k));C.drawImage(d.c,x,y,dw,dh);
const ex=x+20*k,ey=y+2*k;C.fillStyle='#141413';if((clk%4.3)<.14)C.fillRect(ex,ey,2*k,2*k);else C.fillRect(ex+(Math.sin(clk*.9)>0?k:0),ey+(Math.sin(clk*1.3)>.3?k:0),k,k);for(let i=0;i<3;i++)C.fillRect(x+(26+i*2)*k,y+10*k,k,k);
for(let i=0;i<3;i++){const r=SP.crow[FR[((clk*(7+i))|0)%4]],q=[1.5,1.05,.75][i]*Math.max(1,k*.22),w=vw+160,cx=(((vw*(.5+i*.22)-clk*(14+i*6))%w)+w)%w-80,cy=gy-dh*(.72+i*.22)+Math.sin(clk*(1.6+i*.4))*5;C.drawImage(r.c,Math.round(cx),Math.round(cy),r.w*q,r.h*q)}}
else{const p=dspr(s),x=Math.round(s.x),y=Math.round(gy-p.h-s.dy);C.drawImage(p.c,x,y);if(sk>.25&&!s.duck)smile(C,x,y)}}
const cur=c0=>({clk:c0===undefined?clk:c0,time,scroll,sky,wt,x:D.x,dy:D.dy,duck:D.duck,sc:score,home:st==='home',obs:obs.map(o=>({k:o.k,x:o.x,l:o.l}))});
function draw(){const C=cx;C.setTransform(1,0,0,1,0,0);C.fillStyle='#fff';C.fillRect(0,0,cv.width,cv.height);C.setTransform(S,0,0,S,0,0);paint(C,{clk,time,scroll,sky,wt,x:D.x,dy:D.dy,duck:D.duck,obs,home:st==='home',wf:coach.on?0:Math.min(1,(clk-coach.off)/.9)},vw,vh,gy);if(coach.on)coachDraw(C)}
let last=0,acc=0,hl='',hN=0;const pad=n=>String(n).padStart(5,'0');
function frame(t){requestAnimationFrame(frame);if(!last)last=t;const d=Math.min(.1,(t-last)/1000);last=t;clk+=d;
if(st==='run'){acc+=d;let n=0;while(acc>=STEP&&n++<40){if(coach.on)cStep(STEP);else step(STEP);acc-=STEP;if(st!=='run'){acc=0;break}}if(!coach.on&&score>=hN){HST.push(cur());hN=score-score%5+5;if(HST.length>4000)HST.shift()}}else{acc=0;if(st==='home')scroll+=d*60;if(st==='over')skyT=0}
sky+=(skyT-sky)*Math.min(1,d*2.2);if(sky<.002&&skyT===0)sky=0;
draw();coachTick();const h=pad(score)+'|'+pad(hi);if(h!==hl){hl=h;ptx(hsCv,pad(score),Math.max(3,Math.min(7,Math.round(innerWidth/78))),'#141413',0);ptx(hhCv,'HI '+pad(hi),2,'#8a8a85',0)}}
/* camera: a full-size portrait (9:16) photo of any game state */
const AR=9/16;
function shot(s){const tall=vw/vh<AR,ww=tall?vw:vh*AR,wh=tall?vw/AR:vh,x0=tall?0:Math.max(0,Math.min(vw-ww,s.x-ww*.25)),y0=tall?Math.max(0,Math.min(vh-wh,gy-wh*.72)):0,k=4,c=document.createElement('canvas');c.width=Math.round(ww*k);c.height=Math.round(wh*k);
const T=c.getContext('2d');T.fillStyle='#fff';T.fillRect(0,0,c.width,c.height);T.setTransform(k,0,0,k,-x0*k,-y0*k);paint(T,s,vw,vh,gy);T.setTransform(1,0,0,1,0,0);pdraw(T,'HI '+pad(Math.max(hi,s.sc||0))+'  '+pad(s.sc||0),c.width-22,c.height*.04,Math.max(2,Math.round(c.width*.0105)),'#141413','r');return c}
/* ---------- input ---------- */
const wp=e=>({x:e.clientX*dpr/S,y:e.clientY*dpr/S});
function dragTo(p){const h=curSpr().h;D.x=Math.max(2,Math.min(vw*.7,p.x-18));D.dy=Math.max(0,Math.min(gy-h-vh*.12,gy-p.y-h/2));D.vy=0}
let tp=null;
cv.addEventListener('pointerdown',e=>{e.preventDefault();au();if(st==='over'||st==='pause'||app.dataset.p)return;const p=wp(e);
if(st==='home')go();
const s=curSpr(),top=gy-s.h-D.dy;
if(p.x>D.x-10&&p.x<D.x+s.w+10&&p.y>top-10&&p.y<top+s.h+10){D.drag=1;D.pid=e.pointerId;try{cv.setPointerCapture(e.pointerId)}catch(_){}dragTo(p);return}
if(p.y>gy){tp={id:e.pointerId,y:e.clientY};D.duck=1}else jump()});
cv.addEventListener('pointermove',e=>{if(D.drag&&e.pointerId===D.pid)dragTo(wp(e));else if(tp&&tp.id===e.pointerId&&!tp.f&&tp.y-e.clientY>30){tp.f=1;D.duck=0;jump()}});
const up=e=>{if(D.drag&&e.pointerId===D.pid){D.drag=0;D.pid=-1;D.vy=0}if(tp&&tp.id===e.pointerId){D.duck=0;tp=null}};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{const k=e.code;if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;if(k==='Space'||k==='ArrowUp'||k==='KeyW'||k==='Enter'){e.preventDefault();if(e.repeat)return;au();if(app.dataset.p)return;if(st==='home'||st==='over'){go();jump()}else if(st==='pause')resume();else jump()}else if(k==='ArrowDown'||k==='KeyS'){e.preventDefault();D.duck=1}});
addEventListener('keyup',e=>{if(e.code==='ArrowDown'||e.code==='KeyS')D.duck=0});
/* ---------- UI: handle sheets, settings, camera + share, live tutorial demos ---------- */
const OP=["Okay, this Dino game is seriously addictive.","I just ran into the sky with a tiny pixel Dino.","You have to see how far I got in this one.","Found a Dino game that actually feels good to play.","This took me way more tries than I want to admit.","Look at this run, my thumb is still shaking.","Dodging cacti has never felt this smooth.","I flew the Dino above the clouds and a song started playing.","Five minutes turned into an hour with this game.","Here is the moment right before and after my jump."];
const CL=["Think you can beat my score?","Open the link and show me what you've got.","Challenge accepted? Tap the link to play.","Try it once and tell me I'm wrong.","Send me your best run when you're done.","Bet you can't get the Dino into the sky without crashing.","Play it now and bring a friend along.","No download needed, just open the link.","See how far you can run.","Your turn. Let's see that high score."];
const link=()=>{try{const c=document.querySelector('link[rel=canonical]');if(c&&/^https?:/.test(c.href))return c.href;if(window.DINO_PUBLIC_URL)return window.DINO_PUBLIC_URL;if(/^https?:$/.test(location.protocol))return location.origin+location.pathname}catch(e){}return''};
let txt='';
function caption(){const n=PM[(P.cap|0)%1000],a=n%10,m=((n/10)|0)%10,c=((n/100)|0)%10;P.cap=((P.cap|0)+1)%1000;prefs();return OP[a]+' '+MD[m]+' '+CL[c]}
const SH={set:$('#set'),help:$('#help'),shr:$('#shr')},hb=$('#hb');let au0=1,hy=0,dmOn=0;
/* sheets are ~30% tall in portrait (about half in landscape); drag or flick the handle for more room, tap the backdrop or X to close */
const UI=window.DinoUI,SNAPS=(H,F)=>innerWidth>innerHeight*1.1?[H*.56,F]:[Math.min(Math.max(H*.3,236),H*.46),H*.62,F],SHT={};
for(const id in SH)SHT[id]=UI.sheet(SH[id],{snaps:SNAPS,onclose:()=>closeP(),onfit:id==='shr'?()=>requestAnimationFrame(recenter):null});
UI.scrim(app,$('#scrim'));const SBA=[UI.scrollbar(hb,SH.help),UI.scrollbar($('#set .bd'),SH.set),UI.scrollbar($('#lr'),$('#lb'))];
function openP(id){pause();pixAll();if(id==='shr')prepShots();app.dataset.p=id;SHT[id].open(0);setTimeout(()=>SBA.forEach(b=>b.flash()),420);if(id==='set')sync();if(id==='help'){au0=1;hy=0;hb.scrollTop=0;if(!dmOn){dmOn=1;requestAnimationFrame(demoLoop)}}}
const closeP=()=>{if(app.dataset.q)closeS();const id=app.dataset.p;app.dataset.p='';$('#zm').classList.remove('on');if(SHT[id])SHT[id].close()};
addEventListener('keydown',e=>{if(e.code==='Escape'&&(app.dataset.p||app.dataset.q)){if(app.dataset.q)closeS();else if($('#zm').classList.contains('on'))$('#zx').click();else if($('#pm').classList.contains('on'))closePM();else closeP()}});
const tu=$('#tut');let ty=null;tu.addEventListener('pointerdown',e=>{ty=e.clientY});tu.addEventListener('pointermove',e=>{if(ty!==null&&ty-e.clientY>14){ty=null;openP('help')}});tu.addEventListener('pointerup',()=>{ty=null});tu.onclick=()=>openP('help');
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
async function doCopy(){const t=txt+'\n'+link(),b=$('#shk');try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(_){}a.remove()}toast('Link copied')}
function sync(){document.querySelectorAll('#th button').forEach((b,i)=>b.classList.toggle('on',i===(P.th|0)));$('#sl').style.setProperty('--p',Math.max(0,[.85,1,1.2].findIndex(z=>Math.abs(z-P.zoom)<.01)));document.querySelectorAll('[data-z]').forEach(b=>b.classList.toggle('on',Math.abs(+b.dataset.z-P.zoom)<.01));const r=$('#rot');r.classList.toggle('on',!!P.rot);r.setAttribute('aria-checked',!!P.rot)}
document.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{P.zoom=+b.dataset.z;prefs();size();sync()});
$('#rot').onclick=()=>{P.rot=P.rot?0:1;prefs();try{if(P.rot)screen.orientation.unlock();else screen.orientation.lock(screen.orientation.type)}catch(e){}sync()};
/* tutorial demos run the real physics, sprites and sky painter, so they match the game exactly */
/* tutorial demos run the real sprites and sky painter. Each is a pure function of its own clock dT[i]: a finger holds it (pause)
   or slides it left / right (scrub), and the picture always matches the clock */
const DM=[...document.querySelectorAll('.dm')],DW={vw:230,vh:120,gy:100},dT=DM.map(()=>1000),dH=DM.map(()=>0),dV=DM.map(()=>1),SCR=2.4,smt=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
function dstate(i,t){const d={x:HX,dy:0,vy:0,duck:0,drag:0,time:t,scroll:150*t,sky:0,obs:[],tap:0};
if(i===0){const c=(t%2+2)%2,tj=(DW.vw+10-93)/150;d.obs=[{k:0,x:DW.vw+10-150*c,l:0}];if(c>=tj){const u=c-tj;d.dy=Math.max(0,JV*u-GRAV/2*u*u);d.tap=Math.max(0,.35-u)}}
else if(i===1){const c=(t%2+2)%2,ox=DW.vw+10-150*c;d.obs=[{k:3,x:ox,l:1}];d.duck=ox-(d.x+44)<70&&ox+36>d.x-12?1:0}
else{const c=(t%7+7)%7,r=4.8,h0=64+Math.sin(r*2.2)*3,x0=HX+18+Math.sin(r*1.4)*8;
if(c>=1&&c<2.3){d.drag=1;d.dy=64*(.5-.5*Math.cos(Math.PI*(c-1)/1.3));d.x=HX+(c-1)*14}else if(c>=2.3&&c<r){d.drag=1;d.dy=64+Math.sin(c*2.2)*3;d.x=HX+18+Math.sin(c*1.4)*8}else if(c>=r){const u=c-r;d.dy=Math.max(0,h0-GRAV/2*u*u);d.x=HX+(x0-HX)*Math.exp(-3*u)}
d.sky=c<1?0:c<2.4?smt((c-1)/1.4):c<r?1:c<5.8?1-smt((c-r)/1):0}
return d}
function demoLoop(tm){if(app.dataset.p!=='help'){dmOn=0;return}requestAnimationFrame(demoLoop);const t=tm/1000,dt=Math.min(.05,t-(demoLoop.t||t));demoLoop.t=t;autoScroll(dt);
DM.forEach((c,i)=>{if(!dH[i])dT[i]+=dt;if(!dV[i])return;const T=dT[i];if(i>2){demoX(c,i-3,T);return}const d=dstate(i,T),g=c.getContext('2d'),k=c.width/DW.vw;g.setTransform(1,0,0,1,0,0);g.fillStyle=BG[i];g.fillRect(0,0,c.width,c.height);g.setTransform(k,0,0,k,0,0);
paint(g,{clk:T,time:d.time,scroll:d.scroll,sky:d.sky,wt:T*1.3,x:d.x,dy:d.dy,duck:d.duck,obs:d.obs},DW.vw,DW.vh,DW.gy);
if((i===0&&d.tap>0)||(i===1&&d.duck)||(i===2&&d.drag)){const p=dspr(d),y=DW.gy-p.h-d.dy;g.strokeStyle='#ff6b6b';g.fillStyle='rgba(255,107,107,.28)';g.lineWidth=2.5;g.beginPath();g.arc(i===2?d.x+16:196,i===2?y+18:92,i===0?8+(.35-d.tap)*60:13,0,7);g.fill();g.stroke()}})}
if(window.IntersectionObserver){const io=new IntersectionObserver(es=>es.forEach(e=>{dV[DM.indexOf(e.target)]=e.isIntersecting?1:0}),{root:hb});DM.forEach(c=>io.observe(c))}
DM.forEach((c,i)=>{let p=null;const end=e=>{if(p&&(!e||e.pointerId===p.id)){p=null;dH[i]=0}};
c.addEventListener('pointerdown',e=>{p={id:e.pointerId,x:e.clientX,t:dT[i]};dH[i]=1;try{c.setPointerCapture(e.pointerId)}catch(_){}});
c.addEventListener('pointermove',e=>{if(p&&e.pointerId===p.id)dT[i]=p.t-(e.clientX-p.x)/Math.max(1,c.getBoundingClientRect().width)*SCR});
['pointerup','pointercancel','lostpointercapture'].forEach(n=>c.addEventListener(n,end))});
$('#bh').onclick=toHome;$('#bc').onclick=()=>openP('shr');$('#bs').onclick=()=>openP('set');
document.querySelectorAll('.x').forEach(b=>b.onclick=closeP);$('#scrim').addEventListener('pointerdown',closeP);
$('#shs').onclick=doShare;$('#shk').onclick=doSave;$('#play').onclick=resume;$('#retry').onclick=go;
/* ---------- pixel font, pixel icons, game-over art ---------- */
const GLY={A:[14,17,31,17,17],B:[30,17,30,17,30],C:[15,16,16,16,15],D:[30,17,17,17,30],E:[31,16,30,16,31],F:[31,16,30,16,16],G:[14,16,19,17,14],H:[17,17,31,17,17],I:[31,4,4,4,31],J:[7,2,2,18,12],K:[17,18,28,18,17],L:[16,16,16,16,31],M:[17,27,21,17,17],N:[17,25,21,19,17],O:[14,17,17,17,14],P:[30,17,30,16,16],Q:[14,17,21,18,13],R:[30,17,30,18,17],S:[15,16,14,1,30],T:[31,4,4,4,4],U:[17,17,17,17,14],V:[17,17,17,10,4],W:[17,17,21,27,17],X:[17,10,4,10,17],Y:[17,10,4,4,4],Z:[31,2,4,8,31],'0':[14,19,21,25,14],'1':[4,12,4,4,14],'2':[14,17,6,8,31],'3':[30,1,6,1,30],'4':[18,18,31,2,2],'5':[31,16,30,1,30],'6':[14,16,30,17,14],'7':[31,1,2,4,4],'8':[14,17,14,17,14],'9':[14,17,15,1,14],'.':[0,0,0,0,4],',':[0,0,0,4,8],'!':[4,4,4,0,4],'?':[14,17,6,0,4],':':[0,4,0,4,0],'-':[0,0,14,0,0],"'":[4,4,0,0,0],'+':[0,4,14,4,0],'/':[1,2,4,8,16],'%':[25,2,4,8,19],' ':[0,0,0,0,0],'=':[0,14,0,14,0],'@':[14,17,23,21,15],'_':[0,0,0,0,31]};
const IC={home:["....#....","...###...","..#####..",".#######.","#########",".#######.",".##...##.",".##...##.",".##...##."],cam:["...####....","###########","#.........#","#...###...#","#..#...#..#","#..#...#..#","#...###...#","#.........#","###########"],gear:["....###....",".#..###..#.",".#########.","..#######..","###.....###","###.....###","###.....###","..#######..",".#########.",".#..###..#.","....###...."],x:["##...##","###.###",".#####.","..###..",".#####.","###.###","##...##"],ok:[".......##","......###","#....###.","##..###..",".######..","..####...","...##...."],shr:["....#....","...###...","..#####..","....#....","....#....","#...#...#","#.......#","#.......#","#########"],play:["##.......","####.....","######...","########.","#########","########.","######...","####.....","##......."],chev:["##.....##",".##...##.","..##.##..","...###...","....#...."],note:["...#...","...##..","...#.#.","...#...","...#...",".###...","####...",".##...."]};
IC.gear=(()=>{const n=13,c=6,R=[];for(let y=0;y<n;y++){let r='';for(let x=0;x<n;x++){const d=Math.hypot(x-c,y-c),a=Math.atan2(y-c,x-c)*4/Math.PI,t=Math.abs(a-Math.round(a))<.3&&d>4.6&&d<=6.5;r+=(d>=2.3&&d<=4.9)||t?'#':'.'}R.push(r)}return R})();
IC.trophy=["###########","#.#######.#","#.#######.#",".#########.","..#######..","....###....","....###....","...#####...","..#######.."];
IC.spk=["...#...","...#...","..###..","#######","..###..","...#...","...#..."];
IC.pen=[".......#.","......###",".....###.","....###..","...###...","..###....",".###.....",".##......","###......"];
IC.medal=["..#...#..","..##.##..","...###...","..#####..",".#######.",".###.###.",".#######.","..#####.."];
const DPR=()=>devicePixelRatio||1,KD=k=>Math.max(1,Math.round(k*DPR()));
function pdraw(g,t,x,y,k,col,al,sp){t=String(t).toUpperCase();sp=sp||0;const cw=(6+sp)*k,w=t.length*cw-(1+sp)*k;if(al==='r')x-=w;else if(al==='c')x-=w/2;g.fillStyle=col;[...t].forEach((ch,i)=>{const r=GLY[ch]||GLY['?'];for(let yy=0;yy<5;yy++)for(let xx=0;xx<5;xx++)if(r[yy]>>(4-xx)&1)g.fillRect(Math.round(x+i*cw+xx*k),Math.round(y+yy*k),k,k)})}
function ptx(c,t,k,col,mw,sp){t=String(t).toUpperCase();sp=sp||0;const kd=KD(k),cw=(6+sp)*kd,mc=mw?Math.max(4,Math.floor((mw*DPR()+(1+sp)*kd)/cw)):0;let ls=[t];if(mc){ls=[];let l='';for(const w of t.split(' ')){const n=l?l+' '+w:w;if(n.length>mc&&l){ls.push(l);l=w}else l=n}ls.push(l)}const W=Math.max(1,Math.max(...ls.map(s=>s.length))*cw-(1+sp)*kd),H=Math.max(1,ls.length*7*kd-2*kd),g=(c.width=W,c.height=H,c.getContext('2d'));c.style.width=W/DPR()+'px';c.style.height=H/DPR()+'px';ls.forEach((s,j)=>pdraw(g,s,0,j*7*kd,kd,col,'l',sp))}
/* single-line pixel text that never leaves its box: shrink the pixel size first, then cut with a dot */
function ptf(c,t,k,col,maxW,sp){t=String(t);sp=sp||0;const d=DPR(),need=(s,n)=>(n*(6+sp)*KD(s)-(1+sp)*KD(s))/d;let kk=k;while(kk>1&&need(kk,t.length)>maxW)kk=Math.max(1,+(kk-.5).toFixed(1));let s=t;if(need(kk,s.length)>maxW){while(s.length>2&&need(kk,s.length)>maxW)s=s.slice(0,-1);s=s.slice(0,-1)+'.'}ptx(c,s,kk,col,0,sp)}
function idraw(g,n,x,y,k,col){g.fillStyle=col;IC[n].forEach((r,j)=>{for(let i=0;i<r.length;i++)if(r[i]==='#')g.fillRect(Math.round(x+i*k),Math.round(y+j*k),k,k)})}
function ic(c,n,k,col){const r=IC[n];if(!r)return;const kd=KD(k),g=(c.width=r[0].length*kd,c.height=r.length*kd,c.getContext('2d'));c.style.width=c.width/DPR()+'px';c.style.height=c.height/DPR()+'px';idraw(g,n,0,0,kd,col)}
function pixAll(){const L=innerWidth>innerHeight*1.1;document.querySelectorAll('canvas.pt').forEach(c=>{const t=(!L&&c.dataset.tp)?c.dataset.tp:c.dataset.t,k=+c.dataset.k||2,col=c.dataset.c||'#141413',pw=c.parentElement?c.parentElement.clientWidth:0;if(c.dataset.f&&pw>20)ptf(c,t,k,col,pw-(+c.dataset.fo||0));else ptx(c,t,k,col,c.dataset.w&&pw?pw:0)});document.querySelectorAll('canvas.ic').forEach(c=>ic(c,c.dataset.i,+c.dataset.k||3,c.dataset.c||'#141413'))}
function ring(g,n,k,ox,oy,col){const r=(n-1)/2,f=r/9,o=r+.5,a0=-1.4,a1=-.42,A=[o+4.1*f*Math.cos(a0),o+4.1*f*Math.sin(a0)],B=[o+9.7*f*Math.cos(a0),o+9.7*f*Math.sin(a0)],T=[o+6.9*f*Math.cos(a0)-Math.sin(a0)*4.6*f,o+6.9*f*Math.sin(a0)+Math.cos(a0)*4.6*f],sg=(p,q,s)=>(p[0]-s[0])*(q[1]-s[1])-(q[0]-s[0])*(p[1]-s[1]);g.fillStyle=col;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const d=Math.hypot(x-r,y-r),a=Math.atan2(y-r,x-r),p=[x+.5,y+.5],d1=sg(p,A,B),d2=sg(p,B,T),d3=sg(p,T,A),inT=!((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0));if((d>5.2*f&&d<=8.6*f&&!(a>a0&&a<a1))||inT)g.fillRect(ox+x*k,oy+y*k,k,k)}}
function drawOver(){const w=Math.min(innerWidth*.84,380),c=$('#gt');ptx(c,'GAME OVER',Math.max(2,Math.floor(w/61)),'#3d3d3a',0,1);
const NW=37,NH=25,kd=KD(Math.max(3,Math.floor(Math.min(innerWidth*.5,220)/NW))),r=$('#ri'),g=(r.width=NW*kd,r.height=NH*kd,r.getContext('2d'));r.style.width=NW*kd/DPR()+'px';r.style.height=NH*kd/DPR()+'px';
const cc=(x,y,w2,h2,u)=>{const ex=Math.min(x,w2-1-x),ey=Math.min(y,h2-1-y);return ex<u&&ey<u&&ex+ey<u};
for(let y=0;y<NH;y++)for(let x=0;x<NW;x++)if(!cc(x,y,NW,NH,3)){g.fillStyle='#141413';g.fillRect(x*kd,y*kd,kd,kd)}
for(let y=1;y<NH-1;y++)for(let x=1;x<NW-1;x++)if(!cc(x-1,y-1,NW-2,NH-2,2)){g.fillStyle=y>NH-5?'#5f646b':y===1?'#c3c8ce':'#8c9299';g.fillRect(x*kd,y*kd,kd,kd)}
ring(g,19,kd,Math.floor((NW-19)/2)*kd,Math.floor((NH-19)/2)*kd,'#fff')}
let tT=0;function toast(m,hold){const e=$('#toast');ptx(e,m,1.5,'#1d5bd6',0);e.classList.add('on');clearTimeout(tT);if(!hold)tT=setTimeout(()=>e.classList.remove('on'),2400)}
const sl=$('#sl'),ZS=[.85,1,1.2];let sdg=0;const zp=e=>{const r=sl.getBoundingClientRect(),z=ZS[Math.round(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*2)];if(z!==P.zoom){P.zoom=z;prefs();size();sync()}};
sl.addEventListener('pointerdown',e=>{sdg=1;try{sl.setPointerCapture(e.pointerId)}catch(_){}zp(e)});sl.addEventListener('pointermove',e=>{if(sdg)zp(e)});sl.addEventListener('pointerup',()=>sdg=0);sl.addEventListener('pointercancel',()=>sdg=0);
function autoScroll(dt){const m=hb.scrollHeight-hb.clientHeight;if(au0&&m>2){hy=Math.min(m,hy+14*dt);hb.scrollTop=hy}}
['pointerdown','wheel','touchstart'].forEach(n=>hb.addEventListener(n,()=>{au0=0},{passive:true}));
document.querySelectorAll('#th button').forEach((b,i)=>b.onclick=()=>{P.th=i;prefs();tint();sync()});
const BG=['#fff0e0','#e4f2ff','#efe6ff','#e3f7ec','#fff6d6','#ffe4ee','#f3e8ff','#e8f6ff','#fff0f5'];
const MD=["Every run feels a little different.","The sky part still surprises me.","My thumbs are doing all the work.","The speed keeps climbing and I love it.","I keep saying one more run.","Flying the Dino up changes everything.","The music kicks in when you least expect it.","It looks tiny but it plays big.","I am having way too much fun with this.","The weather up there is no joke."];
const PM=(()=>{const a=[...Array(1000).keys()],r=rnd32(20241);for(let i=999;i>0;i--){const j=(r()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return a})();
function demoX(c,j,t){const g=c.getContext('2d'),k=c.width/230,H=120,gY=DW.gy,ph=(t%4)/4,ez=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};g.setTransform(1,0,0,1,0,0);g.fillStyle=BG[3+j];g.fillRect(0,0,c.width,c.height);g.setTransform(k,0,0,k,0,0);g.imageSmoothingEnabled=false;if(j>2){demoY(g,j-3,t);return}
if(j===0){g.fillStyle='#141413';g.fillRect(0,gY,230,1);const dy=Math.max(0,Math.sin(Math.min(ph,.5)*Math.PI*2)*30),sp=SP.dino[0],ca=SP.cac[0];g.drawImage(sp.c,34,gY-sp.h-dy);g.drawImage(ca.c,Math.round(230-Math.min(ph,.5)*2*190),gY-ca.h);
if(ph>.5&&ph<.6){g.fillStyle='rgba(255,255,255,'+(1-(ph-.5)/.1)*.85+')';g.fillRect(0,0,230,H)}
if(ph>=.55){for(let i=0;i<3;i++){const s=ez((ph-.55-i*.05)/.14),w=40*s,h=50*s,x=62+i*53-w/2,y=44-h/2;g.fillStyle='#fff';g.fillRect(x,y,w,h);g.strokeStyle='#141413';g.lineWidth=1.6;g.strokeRect(x,y,w,h);g.fillStyle='#141413';g.fillRect(x+3*s,y+h-9*s,w-6*s,1);g.drawImage(sp.c,x+w/2-7*s,y+h-23*s-(i===1?9*s:0),14*s,14*s)}}
if(ph>=.78){g.globalAlpha=ez((ph-.78)/.1);idraw(g,'ok',44,88,3,'#2e9e5b');idraw(g,'shr',176,86,3,'#2f6fe0');g.globalAlpha=1}}
else if(j===1){const q=(t*.5)%3,a=Math.floor(q),f=ez((q%1)*2),X=[30,115,200],px=X[a]+(X[(a+1)%3]-X[a])*f;g.fillStyle='#d6d6d0';g.fillRect(30,20,170,4);X.forEach(x=>{g.fillStyle='#fff';g.fillRect(x-6,15,12,14);g.strokeStyle='#bdbdb6';g.lineWidth=1.5;g.strokeRect(x-6,15,12,14)});g.fillStyle='#141413';g.fillRect(px-7,13,14,18);
const on=Math.floor(t/2)%2===0;g.fillStyle=on?'#c5efd3':'#f7c9c9';g.fillRect(30,46,46,22);g.strokeStyle=on?'#4fb26f':'#e06666';g.lineWidth=2;g.strokeRect(30,46,46,22);g.fillStyle=on?'#4fb26f':'#e06666';g.fillRect(on?56:34,50,16,14);
const hl=Math.floor(t*1.2)%6;for(let i=0;i<6;i++){const T=THM[i],x=30+i*33;g.fillStyle='rgb('+T[0]+')';g.fillRect(x,84,26,10);g.fillStyle='rgb('+T[1]+')';g.fillRect(x,94,26,8);g.fillStyle='rgb('+T[2]+')';g.fillRect(x,102,26,6);if(i===hl){g.strokeStyle='#141413';g.lineWidth=2;g.strokeRect(x-2,82,30,28)}}}
else{const dy=26+40*(.5-.5*Math.cos(t*.9)),sk=Math.max(0,Math.min(1,(dy-26)/30));paint(g,{clk:t,time:t,scroll:t*150,sky:sk,wt:t*1.4,x:50,dy,duck:0,obs:[]},230,H,gY);for(let i=0;i<3;i++){const q=(t*.45+i/3)%1;g.globalAlpha=Math.sin(q*Math.PI);idraw(g,'note',150+i*24,92-q*84,2,'#141413')}g.globalAlpha=1}}
addEventListener('resize',pixAll);pixAll();
/* ---------- extras: jump bonus, first-tap fullscreen, quick-death colours, profile + leaderboard, camera photos ---------- */
const jb=()=>1;
let wantFs=0,banked=0,qd=0;
['pointerup','touchend','click'].forEach(n=>addEventListener(n,()=>{if(wantFs){wantFs=0;fs()}},true));
const hop=()=>{if(D.dy<=0){D.vy=JV*jb();D.dy=.01}};
function autopilot(){const s=curSpr(),ax=D.x+s.w;D.duck=0;for(const o of obs){const b=osp(o,time),d=o.x-ax;if(o.x+b.w<D.x-2)continue;if(d>speed*.36)break;if(o.k===3){if(o.l===0)hop();else if(o.l===1)D.duck=1}else hop();return}}
function openCP(){$('#cp').classList.add('on')}
document.querySelectorAll('#cp [data-c]').forEach(b=>b.onclick=()=>{P.th=+b.dataset.c;prefs();tint();$('#cp').classList.remove('on');go(1)});
$('#cx').onclick=()=>$('#cp').classList.remove('on');
/* profile + leaderboard */
const MEK='dino-run.me.v1';let ME=null;try{ME=JSON.parse(localStorage.getItem(MEK)||'null')}catch(e){}
if(!ME||typeof ME.id!=='string'||typeof ME.name!=='string'){ME={id:'u'+Math.random().toString(36).slice(2,10)+Date.now().toString(36),name:'@guest'+(1000+Math.floor(Math.random()*9000)),pic:'',total:0}}
ME.total=Math.max(0,ME.total|0);const saveMe=()=>{try{localStorage.setItem(MEK,JSON.stringify(ME))}catch(e){}};saveMe();
const NET=window.DinoNet;let lbRows=[],lbLoading=0,lbTimer=0;
function bank(){const d=Math.floor(score)-banked;if(d>0){banked+=d;ME.total+=d;saveMe();lbPush()}}
function lbPush(){try{if(NET)NET.push(ME)}catch(e){}}
async function lbLoad(){const mine={me:1,name:ME.name,pic:ME.pic,total:ME.total};try{const up=NET?await NET.init():false;if(!up){lbRows=[mine];return 1}await NET.sync();const rows=await NET.lb(ME,100);if(!rows)return 0;lbRows=rows;const m=lbRows.find(x=>x.me);if(m)m.total=Math.max(m.total|0,ME.total|0);else lbRows.push(mine);return 1}catch(e){return 0}}
function avSet(el,r){el.textContent='';el.style.backgroundImage='';if(r.pic&&/^(data:image\/|https?:\/\/|\/api\/)/.test(r.pic))el.style.backgroundImage='url('+r.pic+')';else{const nm=r.name||'@?',hu=[...nm].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7);el.style.background='hsl('+(Math.abs(hu)%360)+',70%,82%)';const c=document.createElement('canvas');ptx(c,(nm.replace('@','')[0]||'?'),2,'#141413',0);el.append(c)}}
function renderMe(){avSet($('#mav'),ME);ptx($('#mn'),ME.name,2,'#141413',0)}
/* the first three places are the rare ones: pixel-art gold, silver and oak plates (drawn once in fx.js), a slow light, twinkles and gold dust. Places 4-10 carry a soft colour, the rest stay plain. */
let lbSk=0;const TN='95,40,241';
function lbSkin(){if(lbSk||!FX||!FX.plate)return;lbSk=1;try{const L=$('#lr');['gold','silver','wood'].forEach((k,i)=>L.style.setProperty('--tx'+(i+1),'url('+FX.plate(k,52,40,[17,29,43][i]).toDataURL()+')'))}catch(e){}}
function lbStar(c,k,col){const r=IC.spk,kd=KD(k),g=(c.width=r[0].length*kd,c.height=r.length*kd,c.getContext('2d'));c.style.width=c.width/DPR()+'px';c.style.height=c.height/DPR()+'px';r.forEach((q,j)=>{for(let i=0;i<q.length;i++)if(q[i]==='#'){g.fillStyle=(i===3&&j>=2&&j<=4)||(j===3&&i>=2&&i<=4)?'#fff':col;g.fillRect(i*kd,j*kd,kd,kd)}})}
function lbFx(n){const f=document.createElement('div'),S=[[[9,0,2.2,0,2.6,'#ffe27a'],[33,1,1.8,.9,3.1,'#fff0a6'],[60,0,2,1.6,2.8,'#ffe27a'],[86,1,2.2,.4,3.3,'#fff0a6']],[[14,1,1.8,0,3.4,'#aeb8c8'],[47,0,2,1.3,3.8,'#cdd5e1'],[81,1,1.8,2.1,3.5,'#aeb8c8']],[[22,0,1.6,0,4.2,'#ffd9a0'],[74,1,1.6,2,4.6,'#ffd9a0']]][n-1];f.className='fx';
S.forEach(q=>{const c=document.createElement('canvas');c.className='gs';lbStar(c,q[2],q[5]);c.style[q[1]?'bottom':'top']='3px';c.style.left=q[0]+'%';c.style.setProperty('--dl',q[3]+'s');c.style.setProperty('--d',q[4]+'s');f.append(c)});
if(n===1)for(let i=0;i<9;i++){const u=document.createElement('i');u.className='gd';u.style.left=(6+i*10.5)+'%';u.style.setProperty('--dl',((i*.67)%3.1).toFixed(2)+'s');u.style.setProperty('--d',(2.4+(i%4)*.55).toFixed(2)+'s');u.style.setProperty('--dx',((i%3)-1)*5+'px');f.append(u)}
return f}
const lbShown={};let lbSig='';
function animNum(cv,from,to,col){const t0=performance.now(),d=Math.min(1200,300+Math.abs(to-from)*4),f=n=>{const p=Math.min(1,(n-t0)/d);ptx(cv,String(Math.round(from+(to-from)*(1-Math.pow(1-p,3)))),2,col,0);if(p<1&&cv.isConnected)requestAnimationFrame(f)};requestAnimationFrame(f)}
function lbRender(){const L=$('#lr'),rows=lbRows.slice().sort((a,b)=>b.total-a.total).slice(0,100),sig=JSON.stringify(rows.map(r=>[r.name,r.total,r.me?1:0,(r.pic||'').length]));if(sig===lbSig)return;lbSig=sig;lbSkin();const st0=L.scrollTop;L.textContent='';
for(let i=0;i<100;i++){const r=rows[i],d=document.createElement('div'),top=r&&i<3,tint=r&&i>2&&i<10;d.className='lrw'+(top?' r'+(i+1):'')+(tint?' tr':'')+(r&&r.me?' me':'')+(r?'':' sk');let rk;
if(tint){const a=.2-(i-3)*.025;d.style.setProperty('--ta','rgba('+TN+','+a.toFixed(3)+')');d.style.setProperty('--tb','rgba('+TN+','+(a+.22).toFixed(3)+')')}
if(top){const pl=document.createElement('div');pl.className='pl';d.append(pl);rk=document.createElement('div');rk.className='bg b'+(i+1);const c=document.createElement('canvas');ptx(c,String(i+1),2,['#4a2e00','#222a36','#fff0d6'][i],0);rk.append(c)}else{rk=document.createElement('canvas');ptx(rk,String(i+1),2,tint?'rgb('+TN+')':'#9aa0a8',0)}
if(r){const av=document.createElement('div');av.className='av';avSet(av,r);const nm=document.createElement('canvas');ptx(nm,r.name||'@guest',2,'#141413',0);const sc=document.createElement('canvas'),key=r.k||(r.me?'me':r.name),from=lbShown[key]==null?r.total:lbShown[key];lbShown[key]=r.total;if(from!==r.total)animNum(sc,from,r.total,'#141413');else ptx(sc,String(r.total|0),2,'#141413',0);d.append(rk,av,nm,sc);if(top)d.append(lbFx(i+1))}
else{const a=document.createElement('div');a.className='av';const b1=document.createElement('div');b1.className='bar';const b2=document.createElement('div');b2.className='bar';b2.style.width='40px';d.append(rk,a,b1,b2)}
L.append(d)}L.scrollTop=st0}
function openLB(){pause();pixAll();app.dataset.p='lb';renderMe();lbLoading=1;lbRender();lbLoad().then(()=>{lbLoading=0;if(app.dataset.p==='lb')lbRender()});clearInterval(lbTimer);lbTimer=setInterval(()=>{if(app.dataset.p!=='lb'){clearInterval(lbTimer);return}lbLoad().then(()=>{if(app.dataset.p==='lb')lbRender()})},3000)}
$('#lbb').onclick=openLB;$('#pe').onclick=()=>openPM();
/* profile window: a pure white page with a small card. The photo is placed with the finger (drag, pinch, wheel); the name has a fixed @ and at most 13 letters;
   the keyboard leaves on Done, or by itself after 5 quiet seconds once the name has 6 letters or more */
const pmEl=$('#pm'),pcv=$('#pc'),pcx=pcv.getContext('2d'),pnEl=$('#pn'),NMAX=13,vvp=window.visualViewport;
let pfImg=null,pfZ=1,pfX=0,pfY=0,pfDirty=0,pfMoved=0,pfPin=null,idleT=0,outT=0;const pfP=new Map();
const cheer=first=>{try{if(FX)FX.cheer(P,{first:first,save:prefs})}catch(e){}};
/* the profile congratulation: the server counts them (2 a day, 5 h apart) when there is one, this phone does when there is not */
const celeb=async()=>{try{if(!FX)return;const ok=NET?await NET.celebrate(ME):null;if(ok===false)return;FX.cheer(P,{force:ok===true,save:prefs})}catch(e){}};
const nmClean=s=>String(s).toLowerCase().replace(/[^a-z0-9_.]/g,'').slice(0,NMAX);
const pfCover=z=>{const b=Math.max(1/pfImg.width,1/pfImg.height)*z;return[pfImg.width*b,pfImg.height*b]};
function pfFit(){const[w,h]=pfCover(pfZ);pfX=Math.max(1-w,Math.min(0,pfX));pfY=Math.max(1-h,Math.min(0,pfY))}
function pDraw(){const N=pcv.width;pcx.fillStyle='#e9e9e4';pcx.fillRect(0,0,N,N);if(!pfImg){const k=Math.max(2,Math.round(N/22));idraw(pcx,'cam',(N-IC.cam[0].length*k)/2,(N-IC.cam.length*k)/2,k,'#b9b9b3');return}pfFit();const[w,h]=pfCover(pfZ);pcx.imageSmoothingQuality='high';pcx.drawImage(pfImg,pfX*N,pfY*N,w*N,h*N)}
function pSize(){const r=pcv.getBoundingClientRect(),n=Math.max(96,Math.min(480,Math.round(r.width*Math.min(DPR(),3))));if(pcv.width!==n)pcv.width=pcv.height=n;pDraw()}
function pLoad(src,done,bad){const im=new Image();im.onload=()=>{const m=Math.max(im.naturalWidth,im.naturalHeight)||1,k=Math.min(1,1280/m),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*k));c.height=Math.max(1,Math.round(im.naturalHeight*k));try{c.getContext('2d').drawImage(im,0,0,c.width,c.height)}catch(e){if(bad)bad();return}pfImg=c;pfZ=1;const[w,h]=pfCover(1);pfX=(1-w)/2;pfY=(1-h)/2;pDraw();if(done)done()};im.onerror=()=>{if(bad)bad()};im.src=src}
function pfZoom(nz,mx,my){nz=Math.max(1,Math.min(5,nz));const[w0,h0]=pfCover(pfZ),u=(mx-pfX)/w0,v=(my-pfY)/h0;pfZ=nz;const[w,h]=pfCover(pfZ);pfX=mx-u*w;pfY=my-v*h;pfDirty=1;pDraw()}
function pExport(){const N=160,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,N,N);pfFit();const[w,h]=pfCover(pfZ);g.imageSmoothingQuality='high';g.drawImage(pfImg,pfX*N,pfY*N,w*N,h*N);return c.toDataURL('image/jpeg',.84)}
/* the card sits in the part of the screen the keyboard leaves free; with little room it lays itself out sideways */
function pmFit(){const h=Math.round(vvp?vvp.height:innerHeight),t=Math.round(vvp?vvp.offsetTop:0);pmEl.style.setProperty('--vh',h+'px');pmEl.style.setProperty('--vt',t+'px');pmEl.classList.toggle('sm',h<290);pmEl.classList.toggle('xs',h<200)}
const pmRe=()=>{if(pmEl.classList.contains('on')){pmFit();pSize()}};
addEventListener('resize',pmRe);if(vvp){vvp.addEventListener('resize',pmRe);vvp.addEventListener('scroll',()=>{if(pmEl.classList.contains('on'))pmFit()})}
function openPM(){clearTimeout(outT);pmEl.classList.remove('out');pnEl.value=ME.name.replace('@','').slice(0,NMAX);pfImg=null;pfZ=1;pfX=pfY=0;pfDirty=0;pfP.clear();pfPin=null;pmFit();pmEl.classList.add('on');pSize();if(ME.pic)pLoad(ME.pic,()=>{pfDirty=0})}
function closePM(){if(!pmEl.classList.contains('on'))return;clearTimeout(idleT);pnEl.blur();pmEl.classList.add('out');clearTimeout(outT);outT=setTimeout(()=>pmEl.classList.remove('on','out'),180)}
$('#pmx').onclick=closePM;$('#pp').onclick=()=>$('#pf').click();
$('#pf').onchange=e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;if(!/^image\//.test(f.type)||f.size>25e6){redMsg('NOT ALLOWED');return}const u=URL.createObjectURL(f);pLoad(u,()=>{pfDirty=1;URL.revokeObjectURL(u)},()=>{URL.revokeObjectURL(u);redMsg('NOT ALLOWED')})};
/* photo: one finger moves it, two fingers (or the wheel) zoom it - the point under the fingers stays put */
const pfR=()=>pcv.getBoundingClientRect();
pcv.addEventListener('pointerdown',e=>{if(!pfImg)return;try{pcv.setPointerCapture(e.pointerId)}catch(_){}pfP.set(e.pointerId,{x:e.clientX,y:e.clientY});pfMoved=0;pcv.classList.add('dg');
  if(pfP.size===2){const[a,b]=[...pfP.values()],R=pfR(),mx=((a.x+b.x)/2-R.left)/R.width,my=((a.y+b.y)/2-R.top)/R.height,[w,h]=pfCover(pfZ);pfPin={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:pfZ,u:(mx-pfX)/w,v:(my-pfY)/h}}});
pcv.addEventListener('pointermove',e=>{const p=pfP.get(e.pointerId);if(!p||!pfImg)return;const R=pfR();
  if(pfP.size>=2&&pfPin){p.x=e.clientX;p.y=e.clientY;const[a,b]=[...pfP.values()];pfZ=Math.max(1,Math.min(5,pfPin.z*(Math.hypot(a.x-b.x,a.y-b.y)||1)/pfPin.d));const[w,h]=pfCover(pfZ);pfX=((a.x+b.x)/2-R.left)/R.width-pfPin.u*w;pfY=((a.y+b.y)/2-R.top)/R.height-pfPin.v*h;pfDirty=1}
  else{pfX+=(e.clientX-p.x)/R.width;pfY+=(e.clientY-p.y)/R.height;pfMoved+=Math.abs(e.clientX-p.x)+Math.abs(e.clientY-p.y);if(pfMoved>4)pfDirty=1;p.x=e.clientX;p.y=e.clientY}
  pDraw()});
const pfEnd=e=>{pfP.delete(e.pointerId);if(pfP.size<2)pfPin=null;if(!pfP.size)pcv.classList.remove('dg')};
pcv.addEventListener('pointerup',pfEnd);pcv.addEventListener('pointercancel',pfEnd);pcv.addEventListener('lostpointercapture',pfEnd);
pcv.addEventListener('wheel',e=>{if(!pfImg)return;e.preventDefault();const R=pfR();pfZoom(pfZ*Math.exp(-e.deltaY*.0018),(e.clientX-R.left)/R.width,(e.clientY-R.top)/R.height)},{passive:false});
pcv.addEventListener('click',()=>{if(!pfImg)$('#pf').click()});
/* name: the keyboard's own Done key (or Enter) closes it, so does five quiet seconds once there are 6 letters or more */
function idleArm(){clearTimeout(idleT);if(document.activeElement===pnEl&&pnEl.value.length>=6)idleT=setTimeout(()=>{if(document.activeElement===pnEl)pnEl.blur()},5000)}
['input','keyup','pointerdown','focus','select'].forEach(n=>pnEl.addEventListener(n,idleArm));pnEl.addEventListener('blur',()=>clearTimeout(idleT));
pnEl.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();pnEl.blur()}});
pnEl.addEventListener('beforeinput',e=>{if(e.data&&!e.isComposing&&pnEl.value.length>=NMAX&&pnEl.selectionStart===pnEl.selectionEnd)redMsg('NOT ALLOWED')});
pmEl.addEventListener('pointerdown',e=>{if(document.activeElement===pnEl&&!e.target.closest('.fld,#po,#pp'))pnEl.blur()});
$('#po').onclick=()=>{const nm=nmClean(pnEl.value),old=ME.name,oldPic=ME.pic;if(nm)ME.name='@'+nm;if(pfImg&&pfDirty){try{ME.pic=pExport()}catch(e){}}const ch=ME.name!==old||ME.pic!==oldPic;saveMe();if(ch&&NET)NET.saveProfile(ME,ME.pic).then(lbPush);else lbPush();closePM();renderMe();if(app.dataset.p==='lb')lbRender();if(ch)setTimeout(celeb,320)};
/* camera: score photos. NOW sits in the middle; every page to the right is 5 points further on, every page to the left 5 points back (down to 000).
   The future keeps playing - an autopilot that cannot crash - also while the game is paused or over. */
const pvEl=$('#pv'),pgEl=$('#pg');let PH=[],pBusy=0,pq=0,BS=0,FS=null,cenK=0,kf=0,pgN=0,pgK=0,pgOn=-1;const CAP=60;
const grab=()=>({time,dist,scroll,since,gap,score,nextM,skyT,sky,speed,obs:obs.map(o=>({...o})),D:{...D}});
const load=s=>{({time,dist,scroll,since,gap,score,nextM,skyT,sky,speed}=s);obs=s.obs.map(o=>({...o}));Object.assign(D,s.D)};
function futInit(){FS=null;if(st!=='run'&&st!=='pause'&&st!=='over')return;const s=grab();s.t0=time;s.c0=clk;if(st==='over'){const sp=curSpr();s.obs=s.obs.filter(o=>{const b=osp(o,s.time);return!(o.x<s.D.x+sp.w+6&&o.x+b.w>s.D.x-6)})}s.D.drag=0;s.D.duck=0;FS=s}
function futNext(tg){if(!FS)return cur();const keep=grab(),t0=FS.t0,c0=FS.c0;let r;ghost=1e9;sim=1;try{load(FS);let n=0;while(score<tg&&n++<1800){autopilot();step(STEP);sky+=(skyT-sky)*Math.min(1,STEP*2.2)}r=cur(c0+time-t0);FS=grab();FS.t0=t0;FS.c0=c0}finally{ghost=0;sim=0;load(keep)}return r}
const hAt=tg=>{let lo=0,hi=HST.length-1;if(hi<0)return null;while(lo<hi){const m=(lo+hi)>>1;if(HST[m].sc<tg)lo=m+1;else hi=m}let b=HST[lo];if(lo>0&&Math.abs(HST[lo-1].sc-tg)<=Math.abs(b.sc-tg))b=HST[lo-1];return Math.abs(b.sc-tg)<=5?b:null};
const pgSc=k=>Math.max(0,BS+5*k),can=k=>PH.length<CAP&&(k===0||(k<0?k>=-Math.ceil(BS/5)&&!!hAt(pgSc(k)):!!FS));
function mkShot(k){return shot(k===0?cur():k<0?(hAt(pgSc(k))||cur()):futNext(BS+5*k))}
function setSel(o,v,q){o.sel=v?1:0;o.b.classList.toggle('on',!!o.sel);o.b.setAttribute('aria-pressed',o.sel?'true':'false');if(!q)updActs()}
function mkPage(k,sel){const c=mkShot(k),fig=document.createElement('figure'),im=new Image(),b=document.createElement('button'),ck=document.createElement('canvas');im.src=c.toDataURL('image/png');im.alt='';im.draggable=false;fig.className='ph';b.type='button';b.className='sel';b.setAttribute('aria-label','Select photo');ic(ck,'ok',2,'#ffffff');b.append(ck);fig.append(im,b);const o={k,url:im.src,im,fig,b,sel:0};setSel(o,sel,1);return o}
function addShot(k,side){if(pBusy||!can(k))return 0;pBusy=1;let ok=0;try{const o=mkPage(k,0);if(side==='l'){const sl0=pvEl.scrollLeft,sw0=pvEl.scrollWidth;PH.unshift(o);pvEl.insertBefore(o.fig,pvEl.firstChild);pvEl.scrollLeft=sl0+(pvEl.scrollWidth-sw0)}else{PH.push(o);pvEl.appendChild(o.fig)}ok=1}catch(e){}pBusy=0;updPager();updActs();return ok}
function recenter(){if(!PH.length)return;const o=PH.find(x=>x.k===cenK)||PH.find(x=>x.k===0)||PH[0],w=o.fig.offsetWidth;if(!w)return;pvEl.style.paddingLeft=pvEl.style.paddingRight=Math.max(10,(pvEl.clientWidth-w)/2)+'px';pvEl.scrollLeft=o.fig.offsetLeft+w/2-pvEl.clientWidth/2}
function prepShots(){draw();BS=score;futInit();pBusy=0;PH=[];pvEl.textContent='';cenK=0;pgN=0;pgOn=-1;kf=0;for(let k=-Math.ceil(BS/5);k<0;k++)if(hAt(pgSc(k))){kf=k;break}[-1,0,1].forEach(k=>{if(PH.length<CAP&&can(k)){const o=mkPage(k,1);PH.push(o);pvEl.appendChild(o.fig)}});txt=caption();$('#shc').textContent=txt;$('#shl').textContent=link();pvEl.classList.remove('on');void pvEl.offsetWidth;setTimeout(()=>{pvEl.classList.add('on');recenter();updPager()},80);setTimeout(()=>{recenter();updPager()},450);updActs()}
function updActs(){const n=PH.some(o=>o.sel);[$('#shk'),$('#shs')].forEach(b=>{b.disabled=!n})}
function updPager(){if(!PH.length){pgEl.textContent='';pgN=0;return}
if(pgN!==PH.length||pgK!==PH[0].k){pgEl.textContent='';pgN=PH.length;pgK=PH[0].k;pgOn=-1;PH.forEach(o=>{const b=document.createElement('button'),cv=document.createElement('canvas');b.type='button';b.className='pn';b.setAttribute('aria-label','Photo '+(o.k-kf+1));b.append(cv);b.onclick=()=>o.fig.scrollIntoView({inline:'center',behavior:'smooth',block:'nearest'});o.chip=b;o.cv=cv;pgEl.append(b);ptx(cv,String(o.k-kf+1),1.5,'#a3a3a0',0)})}
const mid=pvEl.scrollLeft+pvEl.clientWidth/2;let ci=0,bd=1e9;PH.forEach((o,i)=>{const d=Math.abs(o.fig.offsetLeft+o.fig.offsetWidth/2-mid);if(d<bd){bd=d;ci=i}});cenK=PH[ci].k;
if(ci!==pgOn){const p=PH[pgOn];if(p&&p.chip){p.chip.classList.remove('on');ptx(p.cv,String(p.k-kf+1),1.5,'#a3a3a0',0)}const o=PH[ci];o.chip.classList.add('on');ptx(o.cv,String(o.k-kf+1),1.5,'#141413',0);pgOn=ci;pgEl.scrollTo({left:o.chip.offsetLeft-(pgEl.clientWidth-o.chip.offsetWidth)/2,behavior:'smooth'})}}
pvEl.addEventListener('scroll',()=>{if(!PH.length)return;const w=pvEl.clientWidth;if(pvEl.scrollLeft<w*.45)addShot(PH[0].k-1,'l');else if(pvEl.scrollWidth-w-pvEl.scrollLeft<w*.45)addShot(PH[PH.length-1].k+1,'r');if(!pq){pq=1;requestAnimationFrame(()=>{pq=0;updPager()})}},{passive:true});
const dlFile=(c,name)=>new Promise(res=>c.toBlob(b=>{try{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}catch(e){}res()},'image/png'));
const selPH=()=>PH.filter(o=>o.sel);
async function toCanvas(o){try{if(o.im.decode)await o.im.decode()}catch(e){}const c=document.createElement('canvas');c.width=o.im.naturalWidth||1;c.height=o.im.naturalHeight||1;c.getContext('2d').drawImage(o.im,0,0);return c}
async function doSave(){const L=selPH();if(!L.length)return;const tag=Date.now().toString(36);closeP();toast('Saving...',1);let n=0;for(const o of L){await dlFile(await toCanvas(o),'dino-run-'+tag+'-'+(++n)+'.png');await new Promise(r=>setTimeout(r,380))}toast('Saved to your gallery')}
function withFooter(c,L){const T=L.replace(/^https?:\/\//,''),k=T?Math.max(2,Math.min(4,Math.floor(c.width*.9/(T.length*6)))):0,o=document.createElement('canvas');o.width=c.width;o.height=c.height;const g=o.getContext('2d');g.drawImage(c,0,0);if(T)pdraw(g,T,o.width/2,o.height-k*9,k,'#6b6b66','c');return o}
async function doShare(){const sel=selPH();if(!sel.length)return;const L=link();try{const cs=[];for(const o of sel)cs.push(withFooter(await toCanvas(o),L));const files=await Promise.all(cs.map((c,i)=>new Promise(r=>c.toBlob(b=>r(new File([b],'dino-run-'+(i+1)+'.png',{type:'image/png'})),'image/png')))),d={files,title:'Dino Run',text:txt};if(L)d.url=L;if(navigator.canShare&&!navigator.canShare(d)&&files.length>10)d.files=files.slice(0,10);if(navigator.canShare&&navigator.canShare(d)){await navigator.share(d);return}if(navigator.share){await navigator.share(L?{title:'Dino Run',text:txt,url:L}:{title:'Dino Run',text:txt});return}doCopy()}catch(e){if(!e||e.name!=='AbortError')doCopy()}}
/* photo viewer: pinch / wheel zoom to 6x, double-tap, drag to pan, swipe to switch */
const zmEl=$('#zm'),zim=$('#zmi'),zptr=new Map();let zi=0,zs=1,zx=0,zy=0,zb={w:1,h:1},zd=1,z0=1,zlast=0,zlx=0,zly=0,zbusy=0;
const zApply=a=>{zim.style.transition=a?'transform .24s cubic-bezier(.2,.85,.25,1)':'none';zim.style.transform='translate('+zx+'px,'+zy+'px) scale('+zs+')'};
const zClamp=()=>{const mx=Math.max(0,(zb.w*zs-innerWidth)/2),my=Math.max(0,(zb.h*zs-innerHeight)/2);zx=Math.max(-mx,Math.min(mx,zx));zy=Math.max(-my,Math.min(my,zy))};
const zMeasure=()=>{zb={w:zim.offsetWidth||1,h:zim.offsetHeight||1}};
const zLoad=()=>(zim.decode?zim.decode():Promise.resolve()).catch(()=>{});
function zOpen(i){zi=i;zs=1;zx=zy=0;zbusy=0;zim.src=PH[i].url;zmEl.classList.add('on');zApply(0);zLoad().then(zMeasure)}
function zGo(d){const j=zi+d;if(j<0||j>=PH.length||zbusy){zx=0;zApply(1);return}zbusy=1;zim.style.transition='transform .2s ease-in';zx=-d*innerWidth;zim.style.transform='translate('+zx+'px,0) scale(1)';setTimeout(()=>{zi=j;zim.src=PH[j].url;zLoad().then(()=>{zMeasure();zim.style.transition='none';zx=d*innerWidth;zim.style.transform='translate('+zx+'px,0) scale(1)';void zim.offsetWidth;zx=0;zApply(1);zbusy=0})},210)}
zmEl.addEventListener('pointerdown',e=>{if(e.target.closest('.xz')||zbusy)return;try{zmEl.setPointerCapture(e.pointerId)}catch(_){}zptr.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t:performance.now()});if(zptr.size===2){const[a,b]=[...zptr.values()];zd=Math.hypot(a.x-b.x,a.y-b.y)||1;z0=zs}});
zmEl.addEventListener('pointermove',e=>{const p=zptr.get(e.pointerId);if(!p||zbusy)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;if(zptr.size>=2){const[a,b]=[...zptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y),ns=Math.max(1,Math.min(6,z0*d/zd)),cx=(a.x+b.x)/2-innerWidth/2,cy=(a.y+b.y)/2-innerHeight/2,r=ns/zs;zx=cx-(cx-zx)*r;zy=cy-(cy-zy)*r;zs=ns;zClamp();zApply(0)}else if(zs>1.02){zx+=dx;zy+=dy;zClamp();zApply(0)}else{zx+=dx;zApply(0)}});
const zEnd=e=>{const p=zptr.get(e.pointerId);if(!p)return;zptr.delete(e.pointerId);if(zptr.size>0){const q=[...zptr.values()][0];q.x0=q.x;q.y0=q.y;return}const mv=Math.hypot(p.x-p.x0,p.y-p.y0),now=performance.now();if(zs>1.02){zClamp();zApply(1)}
if(mv<10&&now-p.t<300){if(now-zlast<320&&Math.hypot(p.x-zlx,p.y-zly)<40){zlast=0;if(zs>1.05){zs=1;zx=zy=0}else{zs=2.6;zx=-(p.x-innerWidth/2)*(zs-1);zy=-(p.y-innerHeight/2)*(zs-1);zClamp()}zApply(1)}else{zlast=now;zlx=p.x;zly=p.y;if(zs<=1.02){zx=0;zApply(1)}}}
else if(zs<=1.02){if(Math.abs(zx)>innerWidth*.18||(Math.abs(p.x-p.x0)/Math.max(1,now-p.t)>.5&&Math.abs(zx)>30))zGo(zx<0?1:-1);else{zx=0;zApply(1)}}};
zmEl.addEventListener('pointerup',zEnd);zmEl.addEventListener('pointercancel',zEnd);
/* ---------- share window (opened from the leaderboard): eight apps in whole tiles, it scrolls both ways, standing up the logos are plain icons and lying down they are the wide ones with the name; it changes the moment the phone turns ---------- */
const SS=window.DinoShare,ssEl=$('#ssh'),sgr=$('#sgr'),sg=$('#sg'),syt=$('#syt');
const SHS=SS?UI.sheet(ssEl,{fixed:true,snaps:H=>innerWidth>innerHeight*1.1?[H*.56]:[H*.35],onclose:()=>closeS(),onfit:()=>shLayout()}):null;
const SBS=SS?[UI.scrollbar(sgr,ssEl),UI.scrollbar(sgr,ssEl,'x')]:[];if(SS)UI.scrim(app,$('#scrim2'),'q');
let sTxt='',sLink='',sCard=null,sFile=null,sBz=0,sYt=0,sKey='',sPrep=0;
const fitK=(t,maxW,k0)=>Math.max(1,Math.min(k0,Math.floor(maxW/(String(t).length*6-1))));
/* the picture that is shared: my place and score, the top three on their gold / silver / oak plates, and the link */
function shCard(){const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const rows=lbRows.slice().sort((a,b)=>b.total-a.total),mi=rows.findIndex(r=>r.me),me=mi>=0?rows[mi]:{name:ME.name,total:ME.total},rank=mi>=0?mi+1:rows.length+1;
 g.fillStyle='#fff';g.fillRect(0,0,W,H);g.fillStyle='#d9ecff';g.fillRect(0,0,W,640);pdraw(g,'DINO RUN',W/2,84,16,'#141413','c');
 const sp=SP.dino[0],s=Math.max(1,Math.floor(320/sp.w));g.drawImage(sp.c,Math.round((W-sp.w*s)/2),560-sp.h*s,sp.w*s,sp.h*s);g.fillStyle='#141413';g.fillRect(90,560,W-180,10);
 const tt=String(me.total|0),rk=String(rank),nm=me.name||'@guest',k1=Math.min(fitK(tt,640,20),fitK(rk,250,20));pdraw(g,rk,90,700,k1,'#5f28f1');pdraw(g,tt,W-90,700,k1,'#141413','r');pdraw(g,nm,W/2,860,fitK(nm,940,9),'#4a4a46','c');
 const KIND=['gold','silver','wood'],INK=['#4a2e00','#222a36','#fff0d6'],x0=90,w=W-180;
 rows.slice(0,3).forEach((r,i)=>{const y=1000+i*210,h=180,sc=String(r.total|0),ks=fitK(sc,330,10),ty=y+Math.round((h-5*ks)/2),nm2=r.name||'@guest',kn=fitK(nm2,Math.max(60,w-140-80-(sc.length*6-1)*ks-40),10);
  g.save();g.beginPath();g.rect(x0,y,w,h);g.clip();try{const pl=FX.plate(KIND[i],52,40,[17,29,43][i]);for(let x=x0;x<x0+w;x+=260)g.drawImage(pl,x,y-10,260,200)}catch(e){g.fillStyle=['#e9b92a','#cdd5e1','#aa7740'][i];g.fillRect(x0,y,w,h)}g.restore();
  g.strokeStyle='#141413';g.lineWidth=10;g.strokeRect(x0+5,y+5,w-10,h-10);if(r.me)g.strokeRect(x0-14,y-14,w+28,h+28);
  pdraw(g,String(i+1),x0+44,y+Math.round((h-60)/2),12,INK[i]);pdraw(g,nm2,x0+150,y+Math.round((h-5*kn)/2),kn,INK[i]);pdraw(g,sc,x0+w-44,ty,ks,INK[i],'r')});
 if(mi>2){const y=1000+3*210,h=150,sc=String(me.total|0),ks=fitK(sc,330,9),kn=fitK(nm,Math.max(60,w-250-(sc.length*6-1)*ks-80),9);g.fillStyle='#ece6ff';g.fillRect(x0,y,w,h);g.strokeStyle='#5f28f1';g.lineWidth=8;g.strokeRect(x0+4,y+4,w-8,h-8);
  pdraw(g,String(rank),x0+36,y+Math.round((h-50)/2),10,'#5f28f1');pdraw(g,nm,x0+230,y+Math.round((h-5*kn)/2),kn,'#141413');pdraw(g,sc,x0+w-40,y+Math.round((h-5*ks)/2),ks,'#141413','r')}
 const T=(sLink||'').replace(/^https?:\/\//,'');if(T)pdraw(g,T,W/2,H-96,fitK(T,960,8),'#6b6b66','c');return c}
function shPrep(){const my=++sPrep;sCard=null;sFile=null;try{sCard=shCard();sCard.toBlob(b=>{if(my===sPrep&&b)sFile=new File([b],'dino-run.png',{type:'image/png'})},'image/png')}catch(e){}}
function shTile(a,o){const d=document.createElement('div'),dv=DPR(),bt=document.createElement('button'),bx=document.createElement('div'),lc=document.createElement('canvas'),nm=document.createElement('canvas');d.className='st';bt.type='button';bt.className='lg';bt.setAttribute('aria-label',a.n);bx.className='bx';bx.append(lc);SS.logo(lc,a.k,o.lw*dv,o.lh*dv,o.wide);ptf(nm,a.n,1.5,'#141413',o.tw-16);bt.append(bx,nm);bt.onclick=()=>shGo(a.k,'m');d.append(bt);
 if(SS.CHIPS[a.k]){const cp=document.createElement('div');cp.className='cp';[['m','Message'],['s','Story']].forEach(q=>{const b=document.createElement('button'),c=document.createElement('canvas');b.type='button';b.className='ch';b.setAttribute('aria-label',a.n+' '+q[1]);ptf(c,q[1],1.5,'#141413',o.cw-14);b.append(c);b.onclick=()=>shGo(a.k,q[0]);cp.append(b)});d.append(cp)}return d}
/* whole tiles only: the number of columns and rows is worked out from the room there is, so nothing is ever half cut; what does not fit scrolls (snapping tile by tile) */
function shLayout(){if(!SS)return;const W=sgr.clientWidth,H=sgr.clientHeight;if(W<80||H<60)return;
 const wide=UI.isLand(),N=SS.APPS.length,R=Math.max(1,Math.min(wide?2:3,Math.floor(H/(wide?72:80)))),C=Math.max(1,Math.floor(W/(wide?150:116)));let cols=C>=Math.ceil(N/R)?Math.ceil(N/R):(R<2?N:C);cols=Math.max(1,Math.min(cols,N));
 const rows=Math.ceil(N/cols),Rv=Math.min(R,rows),vc=Math.min(cols,C),tw=Math.floor(cols>vc?W/vc:Math.min(wide?230:150,W/vc)),th=Math.floor(H/Rv);let lw,lh,cw;
 if(wide){cw=Math.round(Math.max(56,Math.min(76,tw*.3)));lh=Math.round(Math.max(26,Math.min(60,th-30)));lw=tw-22-cw}else{lh=lw=Math.round(Math.max(36,Math.min(64,th-30,tw-22-56)));cw=tw-22-lw}
 sg.style.paddingRight=cols>vc?W-vc*tw+'px':'0px';sg.style.paddingBottom=rows>Rv?H-Rv*th+'px':'0px';const key=[wide,tw,th,cols,lw,lh,cw,DPR()].join();[['--cn',cols],['--tw',tw+'px'],['--th',th+'px'],['--lw',lw+'px'],['--lh',lh+'px'],['--cw',cw+'px']].forEach(q=>sg.style.setProperty(q[0],q[1]));
 if(key===sKey)return;sKey=key;sg.textContent='';SS.APPS.forEach(a=>sg.append(shTile(a,{wide,tw,lw,lh,cw})))}
function shYtArt(){const wide=UI.isLand(),dv=DPR(),bw=wide?Math.min(240,Math.round(syt.clientWidth*.6)):84,bh=wide?56:84;SS.logo($('#syl'),'yt',bw*dv,bh*dv,wide);ptx($('#syn'),'YouTube',2.5,'#141413',0)}
const dlBlob=(b,name)=>{try{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}catch(e){}};
const shOpen=u=>{try{const a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove()}catch(e){}};
/* an app address (not a web page): true when the phone really switched to the app, false when nothing happened */
function shDeep(u){return new Promise(res=>{let hit=0;const on=()=>{hit=1},vis=()=>{if(document.hidden)hit=1};addEventListener('blur',on);addEventListener('pagehide',on);document.addEventListener('visibilitychange',vis);try{location.href=u}catch(e){}
 setTimeout(()=>{removeEventListener('blur',on);removeEventListener('pagehide',on);document.removeEventListener('visibilitychange',vis);res(!!hit)},1400)})}
async function sCopy(){const t=sTxt+(sLink?'\n'+sLink:'');try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(_){}a.remove()}toast('Link copied')}
async function shRun(r){const body=(sTxt+(sLink?' '+sLink:'')).trim();
 if(r.deep&&await shDeep(r.deep))return 1;
 if(r.share){const d=r.share==='text'?{title:'Dino Run',text:sTxt,url:sLink||undefined}:(sFile?{files:[sFile],title:'Dino Run',text:body}:null);
  if(d&&navigator.share&&(!d.files||(navigator.canShare&&navigator.canShare({files:d.files})))){try{await navigator.share(d);return 1}catch(e){if(e&&e.name==='AbortError')return 0}}}
 if(r.open){if(r.copy)sCopy();shOpen(r.open);return 1}
 if(r.text)await sCopy();return 0}
/* the video app: a three-dot wait of exactly 2.78 s with its logo and name in the middle (the short video is made meanwhile), then the video goes to the phone's share window, or is saved and the upload page opens */
async function shYt(){const my=++sYt;syt.classList.add('on');shYtArt();const cl=sCard?SS.clip(sCard,2600):Promise.resolve(null);await new Promise(r=>setTimeout(r,2780));if(my!==sYt)return 0;const blob=await cl;if(my!==sYt)return 0;syt.classList.remove('on');
 const ext=blob&&/mp4/.test(blob.type)?'mp4':'webm',f=blob?new File([blob],'dino-run-short.'+ext,{type:blob.type}):sFile,body=(sTxt+(sLink?' '+sLink:'')).trim();
 if(f&&navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:sTxt,text:body});return 1}catch(e){if(e&&e.name==='AbortError')return 0}}
 if(blob)dlBlob(blob,'dino-run-short.'+ext);else if(sCard)sCard.toBlob(b=>{if(b)dlBlob(b,'dino-run.png')},'image/png');
 shOpen('https://www.youtube.com/upload');return 1}
async function shGo(k,m){if(!SS||sBz)return;sBz=1;ssEl.classList.add('bz');let ok=0;try{ok=k==='yt'?await shYt():await shRun(SS.route(k,m,sTxt,sLink))}catch(e){}finally{sBz=0;ssEl.classList.remove('bz')}if(ok&&app.dataset.q)setTimeout(closeS,200)}
function openS(){if(!SS||app.dataset.q)return;sTxt=caption();sLink=link();shPrep();sgr.scrollTop=0;sgr.scrollLeft=0;app.dataset.q='1';SHS.open(0);setTimeout(()=>{shLayout();SBS.forEach(b=>b.flash())},60)}
function closeS(){if(!app.dataset.q)return;sYt++;sBz=0;ssEl.classList.remove('bz');syt.classList.remove('on');app.dataset.q='';SHS.close()}
const shRe=()=>{if(!app.dataset.q)return;shLayout();if(syt.classList.contains('on'))shYtArt()};
addEventListener('resize',shRe);addEventListener('orientationchange',()=>{shRe();setTimeout(shRe,120);setTimeout(shRe,400)});
try{matchMedia('(orientation:landscape)').addEventListener('change',shRe)}catch(e){}try{screen.orientation.addEventListener('change',()=>{shRe();setTimeout(shRe,120)})}catch(e){}
if(SS){$('#lsh').onclick=openS;$('#ssx').onclick=closeS;$('#scrim2').addEventListener('pointerdown',closeS);setTimeout(SS.warm,1200)}else $('#lsh').style.display='none';
zmEl.addEventListener('wheel',e=>{e.preventDefault();const ns=Math.max(1,Math.min(6,zs*Math.exp(-e.deltaY*.0018))),cx=e.clientX-innerWidth/2,cy=e.clientY-innerHeight/2,r=ns/zs;zx=cx-(cx-zx)*r;zy=cy-(cy-zy)*r;zs=ns;zClamp();zApply(0)},{passive:false});
$('#zx').onclick=()=>{zmEl.classList.remove('on');const o=PH[zi];if(o)o.fig.scrollIntoView({inline:'center',block:'nearest'})};
pvEl.addEventListener('click',e=>{const sb=e.target.closest('.sel');if(sb){const o=PH.find(x=>x.b===sb);if(o)setSel(o,!o.sel);return}const im=e.target.closest('img'),i=PH.findIndex(o=>o.im===im);if(i>=0)zOpen(i)});
pvEl.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){pvEl.scrollLeft+=e.deltaY;e.preventDefault()}},{passive:false});
addEventListener('keydown',e=>{if(app.dataset.p!=='shr'||$('#zm').classList.contains('on')||(e.code!=='ArrowLeft'&&e.code!=='ArrowRight'))return;e.preventDefault();pvEl.scrollBy({left:(e.code==='ArrowLeft'?-1:1)*((PH[0]?PH[0].fig.offsetWidth:160)+12),behavior:'smooth'})});
/* ---------- ghost future after game over, fly coach, name check, extra tutorial demos ---------- */
let ghost=0,lastBank=0;
const fcEl=$('#fc'),fmEl=$('#fm'),FM=['HOLD THE DINO','NOW DRAG UP','NICE! DONE'];
IC.up=IC.chev.slice().reverse();
function coachMsg(i){coach.stage=i;ptx(fmEl,FM[i],2,'#141413',0)}
function coachStart(){coachStop();P.runs=(P.runs|0)+1;prefs();if(!P.fd&&P.runs>=2&&(P.cs|0)<4){P.cs=(P.cs|0)+1;prefs();coach.on=1;coach.s=clk;coachMsg(0);fcEl.classList.add('on')}}
function coachStop(){if(!coach.on)return;coach.on=0;coach.off=clk;fcEl.classList.remove('on')}
$('#fx').onclick=coachStop;
/* the lesson, in pixels on the pure white game canvas: a ring presses the dino, a ghost dino rises (hold, then drag up); once the finger is on the dino, arrows flow upwards */
function coachDraw(C){const p=curSpr(),w=p.w,h=p.h,mx=gy-h-vh*.12,h0=Math.min(H0,mx*.62),H=Math.round(h0+.72*(mx-h0)),R=Math.round(Math.max(w,h)*.62),OR='#ff8a1e',ez=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)},
ring=(x,y,r,a)=>{if(a<=.01)return;C.globalAlpha=a;C.fillStyle=OR;const q=Math.ceil(r)+1,X=Math.round(x),Y=Math.round(y);for(let j=-q;j<=q;j++)for(let i=-q;i<=q;i++){const d=Math.hypot(i,j);if(d>r-.8&&d<r+.7)C.fillRect(X+i,Y+j,1,1)}},
dot=(x,y,r,a)=>{if(a<=.01)return;C.globalAlpha=a;C.fillStyle=OR;const q=Math.ceil(r),X=Math.round(x),Y=Math.round(y);for(let j=-q;j<=q;j++)for(let i=-q;i<=q;i++)if(Math.hypot(i,j)<=r)C.fillRect(X+i,Y+j,1,1)};
const cx0=D.x+w/2,top=gy-D.dy-h;
if(coach.stage===0&&!D.drag){const T=(clk-coach.s)%3.4,ap=ez(T/.5)*(1-ez((T-2.7)/.5)),pl=T>.5&&T<1.3?.14*Math.sin((T-.5)/.8*Math.PI):0,up=ez((T-1.3)/1.2)*H,cy0=gy-D.dy-h/2-up;
if(T>1.3){const g0=dspr({duck:0,dy:1,time:0});C.globalAlpha=.4*ap;C.drawImage(g0.c,Math.round(D.x),Math.round(gy-g0.h-D.dy-up));C.fillStyle=OR;C.globalAlpha=.55*ap;for(let y=cy0+h/2+6;y<gy-D.dy-h/2-2;y+=8)C.fillRect(Math.round(cx0)-1,Math.round(y),2,2)}
ring(cx0,cy0,R*(1-pl),ap);if(T>.5)dot(cx0,cy0,3,ap*.95)}
else if(coach.stage<2){ring(cx0,gy-D.dy-h/2,R*(1+.06*Math.sin(clk*5)),1);dot(cx0,gy-D.dy-h/2,3,1);
for(let i=0;i<3;i++){const q=(clk*.9+i/3)%1;C.globalAlpha=Math.sin(Math.PI*q)*.95;idraw(C,'up',Math.round(cx0-9),Math.round(top-14-q*H*.55),2,OR)}}
C.globalAlpha=1}
function coachTick(){if(st==='run'&&clk-lastBank>5){lastBank=clk;bank()}if(D.drag&&sky>.5&&!P.fd){P.fd=1;prefs()}
if(!coach.on)return;if(st==='home'||st==='over'){coachStop();return}if(st!=='run')return;
if(coach.stage===0&&D.drag)coachMsg(1);else if(coach.stage===1&&!D.drag){coachMsg(0);coach.s=clk}
if(coach.stage===1&&D.drag&&sky>.45){coachMsg(2);coach.t=clk;P.fd=1;prefs();cheer(1)}
if(coach.stage===2&&((clk-coach.t>1.8&&!(FX&&FX.busy&&FX.busy()))||clk-coach.t>9))coachStop()}
let prT=0;function redMsg(m){const c=$('#pr');ptx(c,m,1.5,'#e57373',0);clearTimeout(prT);prT=setTimeout(()=>{c.width=1;c.height=1;c.style.width='1px';c.style.height='10px'},1800)}
pnEl.oninput=()=>{const raw=pnEl.value,cl=nmClean(raw);if(cl!==raw.toLowerCase())redMsg('NOT ALLOWED');if(cl!==raw)pnEl.value=cl};
function demoY(g,j,t){const ph=(t%5)/5;
if(j===0){const B=[['#ffe27a','#d9a40a'],['#dde3ec','#8e99ab'],['#f0d6bb','#bf8f5f'],['#fff','#e3e3df']];for(let r=0;r<4;r++){const y=8+r*27;g.fillStyle=B[r][0];g.fillRect(14,y,202,22);g.strokeStyle=B[r][1];g.lineWidth=2;g.strokeRect(14,y,202,22);if(r<3){g.fillStyle=B[r][1];g.fillRect(20,y+4,14,14)}pdraw(g,String(r+1),r<3?24:23,y+8,2,r<3?'#fff':'#9aa0a8','l');g.fillStyle='#fff';g.beginPath();g.arc(50,y+11,7,0,7);g.fill();g.strokeStyle='#141413';g.lineWidth=1.4;g.stroke();g.fillStyle='#bdbdb6';g.fillRect(64,y+8,50,6);pdraw(g,String([4210,3580,2950,1810][r]+Math.floor((t%20)*(9-r*2))),208,y+8,2,'#141413','r');if(r<3){g.fillStyle='rgba(255,255,255,.55)';g.fillRect(((t*60+r*50)%260)-30,y,10,22)}}}
else if(j===1){g.fillStyle='#fff';g.beginPath();g.arc(58,52,27,0,7);g.fill();g.strokeStyle='#141413';g.lineWidth=2.5;g.stroke();g.drawImage(SP.dino[0].c,43,38,30,30);const nm='@PLAYER1',n=Math.max(1,Math.min(nm.length,Math.floor(ph*2*nm.length)));g.fillStyle='#fff';g.fillRect(96,40,112,20);g.strokeStyle='#141413';g.lineWidth=2;g.strokeRect(96,40,112,20);pdraw(g,nm.slice(0,n),102,46,2,'#141413','l');idraw(g,'pen',184,6+Math.sin(t*5)*2,2,'#141413');idraw(g,'ok',100,80,3,'#1f7a45');if(ph>.55&&ph<.8)pdraw(g,'NOT ALLOWED',100,68,1.5,'#e57373','l')}
else{const z=1+1.6*(ph<.25?0:ph<.4?(ph-.25)/.15:ph<.75?1:1-(ph-.75)/.25);g.save();g.beginPath();g.rect(50,8,130,104);g.clip();g.fillStyle='#fff';g.fillRect(50,8,130,104);g.translate(115,60);g.scale(z,z);g.translate(-115,-60);g.fillStyle='#141413';g.fillRect(50,92,130,1);g.drawImage(SP.dino[0].c,70,92-SP.dino[0].h);g.drawImage(SP.cac[0].c,130,92-SP.cac[0].h);g.restore();g.strokeStyle='#141413';g.lineWidth=3;g.strokeRect(50,8,130,104);if(ph>.18&&ph<.3){g.strokeStyle='#ff8a1e';g.lineWidth=2.5;g.beginPath();g.arc(115,60,6+(ph-.18)*60,0,7);g.stroke()}if(ph>.8){idraw(g,'chev',18,52,3,'#9aa0a8');idraw(g,'chev',196,52,3,'#9aa0a8')}}}
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
/* ---------- lifecycle ---------- */
let ori=innerWidth>=innerHeight;
function onSize(){size();const o=innerWidth>=innerHeight;if(o!==ori){ori=o;if(P.rot&&st==='run'){pause();vib(70)}}draw()}
addEventListener('resize',onSize);addEventListener('orientationchange',()=>setTimeout(onSize,150));
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();save()}});
addEventListener('pagehide',()=>{pause();save()});
try{history.replaceState({g:0},'');history.pushState({g:1},'')}catch(e){}
addEventListener('popstate',()=>{pause();save();try{history.pushState({g:1},'')}catch(e){}});
setInterval(()=>{if(st==='run')save()},2500);
P.zoom=[.85,1,1.2].reduce((a,b)=>Math.abs(b-P.zoom)<Math.abs(a-P.zoom)?b:a);size();restore();sync();requestAnimationFrame(frame);
})();
