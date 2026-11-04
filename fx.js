'use strict';
/* DinoFX: colours nobody has met before, and the congratulations animation - 100 pixel-art variants
   (10 gifts x 10 kinds of small falling things), a different one every time, at most two per 24 hours and 5 hours apart.
   Canvas only: it knows nothing about the game. */
(()=>{
const D=document,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x)},back=x=>{x=clamp(x,0,1)-1;return 1+x*x*(2.70158*x+1.70158)};
const rnd32=s=>()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;
const css=c=>'rgb('+c[0]+','+c[1]+','+c[2]+')',mix=(c,k,t)=>c.map(v=>Math.round(v+(k-v)*t));

/* ---------- the palette: the 256-step cycle behind impossible_colors_1000.json ---------- */
const RARE=[];for(let i=0;i<256;i++)RARE.push([(i*123)&255,(i*200)&255,(i*21)&255]);
const HSL=c=>{const r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s,l]};
const HS=RARE.map(HSL),BRI=[],INK=[];HS.forEach((q,i)=>{if(q[1]>=.45&&q[1]<=.9&&q[2]>=.42&&q[2]<=.76)BRI.push(i);if(q[2]<.2&&q[1]>=.25)INK.push(i)});
const hd=(a,b)=>{const d=Math.abs(a-b)%360;return d>180?360-d:d};
/* n colours that sit together: neighbours on the hue wheel, opposites, or thirds - always from the rare palette */
function pick(r,n){const h0=r()*360,k=(r()*4)|0,off=[[0,25,-25,50,-50,75],[0,180,22,202,-22,158],[0,120,240,30,150,270],[0,150,210,30,180,240]][k],used=[];
  for(let i=0;i<n;i++){const h=h0+off[i%6];let b=-1,bd=1e9;for(const j of BRI){if(used.includes(j))continue;const d=hd(HS[j][0],h)+r()*14;if(d<bd){bd=d;b=j}}used.push(b)}return used.map(i=>RARE[i])}

/* ---------- pixel art: everything is drawn on a small grid and enlarged by a whole number, so every pixel is a sharp square ---------- */
const cnv=(w,h)=>{const c=D.createElement('canvas');c.width=w;c.height=h;return c};
const art=(rows,pal)=>{const c=cnv(rows[0].length,rows.length),g=c.getContext('2d');rows.forEach((s,y)=>{for(let x=0;x<s.length;x++){const k=s[x];if(pal[k]){g.fillStyle=pal[k];g.fillRect(x,y,1,1)}}});return c};
const turn=rows=>Array.from({length:rows[0].length},(_,y)=>rows.map(s=>s[y]).join(''));
/* # main colour, a accent colour, l lighter main */
const SETS=[
/*0 confetti*/[["##","##"],["###","###"],["#","#","#","#"],["##","##","##"]],
/*1 sparkles*/[[".#.","#a#",".#."],["..#..","..#..","##a##","..#..","..#.."],["...#...","...#...","..#a#..","###a###","..#a#..","...#...","...#..."]],
/*2 hearts*/[[".#.#.","#l###","#####",".###.","..#.."],["#.#","###",".#."]],
/*3 petals*/[[".l.","###","###",".#."],[".##.","l###",".##."],[".#.",".#.","###","###",".#."]],
/*4 leaves*/[["...##","..###",".###.","###..","a#..."],["##...","###..",".###.","..###","...#a"]],
/*5 diamonds*/[["..#..",".#l#.","#####",".###.","..#.."],[".#.","###",".#."]],
/*6 snow*/[["#.#.#",".###.","##a##",".###.","#.#.#"],["#.#",".a.","#.#"]],
/*7 rings*/[[".###.","#l..#","#...#","#...#",".###."],["..###..",".#l..#.","#.....#","#.....#","#.....#",".#...#.","..###.."]],
/*8 notes*/[["...##.","...#.#","...#..","...#..",".###..","####..",".##..."],["..#####.","..#...#.","..#...#.","..#...#.",".##..##.","###.###.",".##..##."]],
/*9 flowers*/[[".###.","##a##","#aaa#","##a##",".###."],[".##.","#aa#","#aa#",".##."],["#.#.#","#a#a#",".###.","..a.."]]];
const SPIN=[1,0,0,1,1,0,0,0,0,0];                           /* flutter: confetti, petals and leaves turn over while they fall */
const cache=new Map();
function sprite(set,sh,main,acc,o){const k=set+'.'+sh+'.'+main+'.'+acc+'.'+o;let c=cache.get(k);if(c)return c;let rows=SETS[set][sh];if(o)rows=turn(rows);c=art(rows,{'#':css(main),a:css(acc),l:css(mix(main,255,.5))});cache.set(k,c);return c}

/* the gift: 10 patterns. The body and the lid are drawn once on tiny canvases; the lid lifts off when it opens */
const STAR=["..#..","..#..","#####",".###.","#...#"],HEART=[".#.#.","#####","#####",".###.","..#.."];
function giftArt(pat,w,bh,B,Rb,O){
  const lt=mix(B,255,.3),dk=mix(B,0,.22),cx=(w-1)>>1,body=cnv(w,bh),g=body.getContext('2d'),mid=(bh-1)>>1;
  const px=(c,x,y,a,b)=>{g.fillStyle=css(c);g.fillRect(x,y,a||1,b||1)};
  px(O,1,0,w-2,bh);px(B,2,1,w-4,bh-2);px(lt,2,1,1,bh-2);px(dk,2,bh-2,w-4,1);px(dk,w-3,1,1,bh-3);
  for(let y=1;y<=bh-2;y++)for(let x=2;x<=w-3;x++){const dx=x-cx,m=y-mid;let c=0;
    switch(pat){case 0:c=Math.abs(dx)<=1||Math.abs(m)<=1;break;case 1:c=Math.abs(dx)<=1;break;case 2:c=Math.abs(m)<=1;break;
      case 3:c=y%2===1&&(x+((y>>1)&1)*2)%4===0;break;case 4:c=(x+y)%5===0;break;case 5:c=((x>>1)+(y>>1))%2===0;break;
      case 6:c=Math.abs(dx)===3||Math.abs(m)===2;break;case 7:c=dx===0||(y>=bh-4&&((x+y)&1)===0);break;
      case 8:{const sx=dx+2,sy=m+2;c=sx>=0&&sx<5&&sy>=0&&sy<5&&STAR[sy][sx]==='#';break}
      case 9:{const sx=dx+2,sy=m+2;c=sx>=0&&sx<5&&sy>=0&&sy<5&&HEART[sy][sx]==='#'}}
    if(c)px(Rb,x,y)}
  const lid=cnv(w,9),h=lid.getContext('2d'),q=(c,x,y,a,b)=>{h.fillStyle=css(c);h.fillRect(x,y,a||1,b||1)},rib=pat===0||pat===1||pat===7||pat===8;
  q(O,0,5,w,4);q(lt,1,6,w-2,1);q(B,1,7,w-2,1);if(rib)q(Rb,cx-1,6,3,2);
  const bow=pat%3===0?[".RR...RR.","RllR.RllR","RllRRRllR",".RRRRRRR.","...R.R..."]:pat%3===1?["..RR.RR..",".RllRllR.",".RRRRRRR.","...RRR...","..R...R.."]:["..RRRRR..",".RllllllR",".RRRRRRR.","...RRR...","........."];
  bow.forEach((s,y)=>{for(let x=0;x<s.length;x++){const k=s[x];if(k==='R')q(Rb,cx-4+x,y,1,1);else if(k==='l')q(mix(Rb,255,.5),cx-4+x,y,1,1)}});
  return{body,lid,w,bh}}

/* ---------- one celebration: a gift drops in, opens, and small pixel things drift out and fall ---------- */
const GS=2;                                                  /* the gift is drawn twice as chunky as the things that fall out of it */
function build(v,seed,W,H,calm){
  const r=rnd32((seed^Math.imul(v+1,2654435761))>>>0),pat=v%10,set=(v/10)|0,sty=(v*3+set*7)%5,pal=pick(r,6),O=INK.length?RARE[INK[(r()*INK.length)|0]]:[6,16,26],
    w=[13,15,17,19][(r()*4)|0],G=giftArt(pat,w,9+((r()*4)|0),pal[0],pal[1],O),cx=Math.round(W/2),gy=Math.round(H*(W>H*1.1?.2:.15)),
    ST=[[24,.26,5,78],[80,.42,3,86],[34,.5,2,82],[16,.16,9,67],[28,.3,7,76]][sty],N=calm?34:Math.round(clamp(H*.3,48,92)),TS=.85,TE=calm?1.4:2,items=[];
  let end=0;
  for(let i=0;i<N;i++){const sh=(r()*SETS[set].length)|0,mi=(r()*6)|0,ai=(mi+1+((r()*5)|0))%6,t0=TS+TE*(1-Math.sqrt(1-r())),
      it={sh,main:pal[mi],acc:pal[ai],t0,x0:cx+(r()-.5)*(w*GS-8),y0:gy-2,dx:(r()-.5)*2*ST[1]*W,b:-ST[0]*(.5+r()*.7),fall:ST[3]*(.82+r()*.36),amp:ST[2]*(.6+r()*.8),fr:1.2+r()*1.4,ph:r()*6.283,sr:SPIN[set]?1.6+r()*2.6:0};
    items.push(it);let a=.3;while(a<9){if(at(it,a,H).al<=.01)break;a+=.05}end=Math.max(end,t0+a)}
  return{G,pal,O,items,cx,gy,W,H,set,pat,sty,T:Math.min(8,Math.max(TS+TE+1.2,end+.1)),tOut:TS+TE+.25}}
function at(it,a,H){const tau=.55,vy=it.b-it.fall,y=it.y0+it.fall*a+vy*tau*(1-Math.exp(-a/tau)),x=it.x0+it.dx*(1-Math.exp(-a/.9))+it.amp*Math.sin(it.fr*a+it.ph)*Math.min(1,a/.7),
    al=Math.min(1,a/.2)*(1-clamp((y-H*.78)/(H*.22),0,1));return{x,y,al}}
function render(g,V,t,S){
  g.imageSmoothingEnabled=false;const{G,items,cx,gy,H}=V,T=t,o=ease((T-.62)/.4),out=ease((T-V.tOut)/.6),fade=Math.min(1,T/.22)*(1-out),gx=cx-((G.w*GS)>>1),
    gyy=gy+Math.round((1-back(T/.6))*-(gy+30))-Math.round(out*10),bob=o>.99?Math.round(Math.sin(T*2.1)):0,Z=S*GS;
  const dot=it=>{const a=T-it.t0;if(a<0)return;const p=at(it,a,H);if(p.al<=.01)return;const s=sprite(V.set,it.sh,it.main,it.acc,it.sr?((a*it.sr+it.ph)|0)&1:0);
    g.globalAlpha=p.al;g.drawImage(s,Math.round(p.x-s.width/2)*S,Math.round(p.y-s.height/2)*S,s.width*S,s.height*S)};
  for(const it of items)dot(it);                                /* everything falls behind the gift, so it looks as if it comes out of the box */
  if(fade>.01){g.globalAlpha=fade;g.drawImage(G.body,gx*S,gyy*S,G.w*Z,G.bh*Z);
    if(o>0){g.fillStyle=css(mix(V.pal[0],0,.6));g.fillRect((gx+2*GS)*S,(gyy+GS)*S,(G.w-4)*Z,Z)}
    g.drawImage(G.lid,(gx+Math.round(o*3)*GS)*S,(gyy-(8+Math.round(o*6))*GS+bob*GS)*S,G.w*Z,9*Z)}
  g.globalAlpha=1}

/* ---------- the rules: two a day at most, five hours apart; and never the same one twice in a row ---------- */
const H24=864e5,H5=18e6;
const allowed=(l,now)=>{const a=(l||[]).filter(t=>t>now-H24&&t<=now+6e4);return a.length<2&&(!a.length||now-a[a.length-1]>=H5)};
const log=(l,now)=>(l||[]).filter(t=>t>now-H24&&t<=now+6e4).slice(-1).concat(now);
function order(seed,c){const a=[...Array(100).keys()],r=rnd32((seed^Math.imul(c+1,2654435761))>>>0);for(let i=99;i>0;i--){const j=(r()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function nextVariant(P){const n=P.cn|0;if(!P.cq)P.cq=((Math.random()*4294967295)>>>0)||1;let v=order(P.cq,(n/100)|0)[n%100];if(v===P.cl)v=(v+37)%100;P.cn=n+1;P.cl=v;return v}

let run=0;
function play(v){
  const cv=D.getElementById('cel');if(run||!cv)return false;run=1;
  let calm=false;try{calm=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  const dpr=Math.min(devicePixelRatio||1,3),S=Math.max(2,Math.round(3*dpr));cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);
  const g=cv.getContext('2d');let V;try{V=build(v,(Math.random()*4294967295)>>>0,Math.ceil(cv.width/S),Math.ceil(cv.height/S),calm)}catch(e){run=0;return false}const t0=performance.now();
  cv.classList.add('on');
  const done=()=>{g.clearRect(0,0,cv.width,cv.height);cv.classList.remove('on');cache.clear();run=0};
  const f=now=>{const t=(now-t0)/1000;g.clearRect(0,0,cv.width,cv.height);if(t>=V.T){done();return}try{render(g,V,t,S)}catch(e){done();return}requestAnimationFrame(f)};
  requestAnimationFrame(f);return true}
/* P is the player's saved settings; save() writes them. first=1 is the one-off welcome that does not count against the daily two */
function cheer(P,o){o=o||{};const now=Date.now();if(!o.first){if(!o.force&&!allowed(P.ce,now))return false;P.ce=log(P.ce,now)}const v=nextVariant(P);if(o.save)o.save();return play(v)}

/* ---------- weather: a mood of its own every few seconds - pixel clouds, pixel things in the air, colours from the rare palette.
   No sun, no moon, no planets. It is a pure function of the clock, so the game, the camera and the tutorial all show the same sky. ---------- */
const SEG=4.2,XF=.28,WS=(Math.random()*4294967295)>>>0;
const hh=(i,j)=>{let n=Math.imul(i*7919+j*104729+1,0x45d9f3b);n^=n>>>15;n=Math.imul(n,0x2c1b3c6d);return((n^n>>>13)>>>0)/4294967296};
/* t / b: hue of the top and the bottom of the sky, a: hues of the small things, fx: which two kinds of small things, cl: how many clouds */
const MOODS=[{t:330,b:35,a:[50,300,200],fx:[0,3],cl:4},{t:185,b:150,a:[60,320,200],fx:[5,0],cl:3},{t:215,b:190,a:[190,280,320],fx:[1,6],cl:3},{t:340,b:20,a:[330,40,290],fx:[3,13],cl:3},
  {t:265,b:320,a:[60,300,180],fx:[4,6],cl:2},{t:170,b:255,a:[150,285,200],fx:[8,6],cl:0},{t:15,b:45,a:[30,350,60],fx:[11,9],cl:4},{t:45,b:85,a:[25,100,350],fx:[12,13],cl:3},
  {t:300,b:190,a:[60,330,150,250],fx:[10,0],cl:4},{t:205,b:165,a:[190,260,300],fx:[9,4],cl:5},{t:255,b:300,a:[190,60,330],fx:[7,6],cl:1},{t:130,b:70,a:[330,50,200],fx:[2,3],cl:3}];
const MC=new Map(),SKY=new Map(),OC=new Map();
/* the order of the twelve moods: every cycle is a fresh shuffle, and a mood never shows twice in a row, not even across two cycles */
function ord(c){let o=OC.get(c);if(o)return o;o=[...Array(12).keys()];const r=rnd32((WS^Math.imul(c+3,2654435761))>>>0);for(let i=11;i>0;i--){const j=(r()*(i+1))|0;[o[i],o[j]]=[o[j],o[i]]}if(c>0){const p=ord(c-1);if(o[0]===p[11])[o[0],o[1]]=[o[1],o[0]]}OC.set(c,o);if(OC.size>40)OC.delete(OC.keys().next().value);return o}
const near=(h,lo,hi,sl,r,used)=>{let b=0,bd=1e9;for(let i=0;i<256;i++){const q=HS[i];if(q[1]<sl||q[2]<lo||q[2]>hi||used.includes(i))continue;const d=hd(q[0],h)+r()*9;if(d<bd){bd=d;b=i}}return b};
function mood(n){let m=MC.get(n);if(m)return m;
  const D0=MOODS[ord((n/12)|0)[n%12]],r=rnd32((WS^Math.imul(n+7,2654435761))>>>0),used=[],jt=()=>(r()-.5)*26,pc=(h,lo,hi,s)=>{const i=near(h+jt(),lo,hi,s,r,used);used.push(i);return RARE[i]};
  const top=pc(D0.t,.4,.62,.4),bot=pc(D0.b,.5,.8,.35),acc=D0.a.map(h=>pc(h,.42,.76,.5)),ink=INK.length?RARE[INK[(r()*INK.length)|0]]:[20,20,19];
  m={key:n,fx:D0.fx,top:mix(top,255,.12),bot:mix(bot,255,.62),cs:acc.map(css),lt:css(mix(acc[0],255,.8)),ink:css(ink),wind:(r()-.5)*2,den:.75+r()*.6,bd:D0.cl>0&&r()<.4,cl:[]};
  for(let i=0;i<D0.cl;i++){const w=34+((r()*50)|0),far=w<52;m.cl.push({art:cloudArt(r,w,mix(bot,255,.9),mix(acc[i%acc.length],255,.62),mix(top,255,.45)),fy:.05+r()*.44,sp:(far?3:7)+r()*5,x0:r(),a:far?.62:.92})}
  MC.set(n,m);for(const k of MC.keys())if(k<n-3)MC.delete(k);return m}
/* a cloud is a few overlapping circles with a flat belly, lit from above: light on top, soft in the middle, shaded underneath */
function cloudArt(r,w,l,m,d){const h=Math.round(w*.42),c=cnv(w,h),g=c.getContext('2d'),base=h-3,N=3+((r()*3)|0),cs=[];
  for(let i=0;i<N;i++){const rr=h*(.26+r()*.28);cs.push([w*(.22+.56*i/(N-1))+(r()-.5)*w*.08,base-rr*(.35+r()*.55),rr])}
  const ins=(x,y)=>{if(y>base+.5)return false;for(const[a,b,rr]of cs)if((x-a)*(x-a)+(y-b)*(y-b)<=rr*rr)return true;return y>=base-3&&x>=w*.14&&x<=w*.86};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(ins(x+.5,y+.5)){let up=0;while(up<3&&ins(x+.5,y-.5-up))up++;g.fillStyle=css(y>=base-1?d:up<2?l:m);g.fillRect(x,y,1,1)}
  return c}
const lerp=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
/* the sky: colour steps with an ordered dither, dissolving into the page at the bottom - drawn once, then copied */
function skyArt(m,vw,vh){vw=Math.ceil(vw);vh=Math.ceil(vh);const k=m.key+'|'+vw+'|'+vh;let c=SKY.get(k);if(c){SKY.delete(k);SKY.set(k,c);return c}const H=Math.ceil(vh*.82),NB=14;c=cnv(vw,H);const g=c.getContext('2d'),im=g.createImageData(vw,H),d=im.data;
  for(let y=0;y<H;y++){const u=y/(H-1),fa=u<.14?1:Math.pow(1-(u-.14)/.86,1.2),bu=u*NB,b0=Math.floor(bu),fr=bu-b0;
    for(let x=0;x<vw;x++){const th=(B4[y&3][x&3]+.5)/16,ta=(B4[(y+2)&3][(x+1)&3]+.5)/16,col=lerp(m.top,m.bot,Math.min(1,(fr>th?b0+1:b0)/NB)),i=(y*vw+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=fa>ta?255:0}}
  g.putImageData(im,0,0);SKY.set(k,c);if(SKY.size>16)SKY.delete(SKY.keys().next().value);return c}
/* the small things in the air */
function field(C,m,id,t,al,vw,vh){
  const wv=m.wind*40,N=k=>Math.round(k*m.den),A=m.cs,nA=A.length,W2=vw+80,pos=(i,vx,vy,w2)=>[((hh(i,1)*W2+vx*t+Math.sin(t*1.2+i)*w2)%W2+W2)%W2-40,((hh(i,2)*vh+vy*t)%vh+vh)%vh],
    px=(c,x,y,w,h,a)=>{C.globalAlpha=al*(a===undefined?1:a);C.fillStyle=c;C.fillRect(Math.round(x),Math.round(y),w,h)};
  switch(id){
  case 0:for(let i=0;i<N(14);i++){const[x,y]=pos(i,-8+wv*.3,9,3),a=.45+.55*Math.abs(Math.sin(t*2+i));px(A[i%nA],x+1,y,1,3,a);px(A[i%nA],x,y+1,3,1,a);px(m.lt,x+1,y+1,1,1,a)}break;
  case 1:for(let i=0;i<N(55);i++){const[x,y]=pos(i,-5+wv*.3,26,4);if(i%7===0){px(m.lt,x+1,y,1,3);px(m.lt,x,y+1,3,1)}else px(m.lt,x,y,2,2)}break;
  case 2:for(let i=0;i<N(26);i++){const[x,y]=pos(i,-50+wv*1.5,22,6),c=A[i%nA];if(i%2){px(c,x,y,2,1);px(c,x+1,y+1,2,1)}else{px(c,x+1,y,2,1);px(c,x,y+1,2,1)}}break;
  case 3:for(let i=0;i<N(34);i++){const[x,y]=pos(i,-14+wv*.6,24,8),c=A[i%nA];px(c,x+1,y,1,3);px(c,x,y+1,3,1);px(m.lt,x+1,y+1,1,1,.8)}break;
  case 4:for(let i=0;i<N(18);i++){const[x,y]=pos(i,-4+wv*.2,-3,6),a=.3+.7*Math.abs(Math.sin(t*1.7+i)),c=A[i%nA];px(c,x-1,y,4,2,.25*a);px(c,x,y-1,2,4,.25*a);px(c,x,y,2,2,a);px(m.lt,x,y,1,1,a)}break;
  case 5:for(let i=0;i<N(16);i++){const[x,y]=pos(i,2+wv*.2,-18,5),r=2+i%3;px(m.lt,x+1,y,2*r-1,1,.85);px(m.lt,x+1,y+2*r,2*r-1,1,.85);px(m.lt,x,y+1,1,2*r-1,.85);px(m.lt,x+2*r,y+1,1,2*r-1,.85);px(A[i%nA],x+2,y+2,1,1)}break;
  case 6:for(let i=0;i<N(40);i++){const x=Math.round(hh(i,1)*vw),y=Math.round(hh(i,2)*vh*.7),a=.35+.65*Math.abs(Math.sin(t*1.5+i));px(m.lt,x,y,1,1,a);if(i%5===0){px(m.lt,x-1,y,3,1,a);px(m.lt,x,y-1,1,3,a)}}break;
  case 7:for(let i=0;i<6;i++){const[x,y]=pos(i,-240,130,0);for(let k=0;k<16;k++)px(k<2?'#fff':m.lt,x+k*2,y-k,2,1,1-k/16)}break;
  case 8:for(let r=0;r<3;r++)for(let x=0;x<=vw;x+=4){const y=vh*(.14+r*.1)+Math.sin(x*.025+t*(.7+r*.2)+r*2)*10,c=A[r%nA];px(c,x,y,4,16,.12);px(c,x,y+3,4,9,.12);px(c,x,y+6,4,3,.14)}break;
  case 9:for(let i=0;i<6;i++){const x=((i*83+t*9*(1+i%2*.5)*(1+m.wind*.4))%(vw+200)+vw+200)%(vw+200)-100,y=vh*(.1+i*.11),hw=58+i%3*14,hy=4+i%3;for(let r=-hy;r<=hy;r++){const w=Math.round(hw*Math.sqrt(1-r*r/((hy+1)*(hy+1))));px(m.lt,x-w,y+r,2*w,1,Math.abs(r)>hy-2?.16:.3)}}break;
  case 10:for(let i=0;i<N(30);i++){const[x,y]=pos(i,wv*.4,42,7);px(A[i%nA],x,y,2,i%2?1:2)}break;
  case 11:for(let i=0;i<N(22);i++){const[x,y]=pos(i,wv*.3,-40,5);px(A[i%nA],x,y,1,1+i%2,.4+.6*hh(i,5))}break;
  case 12:for(let i=0;i<N(12);i++){const[x,y]=pos(i,wv*.3,-14,5),a=.5+.5*Math.sin(t*2+i),c=A[i%nA];px(c,x-2,y-1,7,6,.16);px(c,x-1,y-2,5,8,.16);px(c,x,y,3,4,.75+.25*a);px(m.lt,x+1,y+1,1,1,.9)}break;
  case 13:for(let i=0;i<3;i++){const x=vw*(.5+.38*Math.sin(t*.22+i*2.1)),y=vh*(.34+.1*Math.sin(t*.7+i)),o=((t*9+i)|0)%2,c=A[i%nA];if(o){px(c,x,y,2,2);px(c,x+3,y,2,2);px(c,x+2,y+1,1,2)}else{px(c,x+1,y,1,3);px(c,x,y+1,3,1)}}break}}
function elems(C,m,t,al,vw,vh,age){if(al<.01)return;const e=ease(age/1.6);
  for(const id of m.fx)if(id>=6&&id<=8)field(C,m,id,t,al,vw,vh);
  for(const c of m.cl){const w=c.art.width,L=vw+w+24,x=(((c.x0*L+t*c.sp*(m.wind<0?-1:1))%L)+L)%L-w-12;C.globalAlpha=al*c.a*e;C.drawImage(c.art,Math.round(x),Math.round(vh*c.fy+(1-e)*10))}
  for(const id of m.fx)if(id<6||id>8)field(C,m,id,t,al,vw,vh);
  if(m.bd){C.fillStyle=m.ink;for(let i=0;i<4;i++){const w=vw+60,x=(((i*97-t*(26+i*6))%w)+w)%w-30,y=vh*(.12+((i*53)%40)/100)+Math.sin(t*2+i)*4;C.globalAlpha=al*.75;if(((t*7+i)|0)%2){C.fillRect(Math.round(x),Math.round(y),4,2);C.fillRect(Math.round(x)+4,Math.round(y)+2,3,2);C.fillRect(Math.round(x)+7,Math.round(y),4,2)}else{C.fillRect(Math.round(x),Math.round(y)+2,4,2);C.fillRect(Math.round(x)+4,Math.round(y),3,2);C.fillRect(Math.round(x)+7,Math.round(y)+2,4,2)}}}
  C.globalAlpha=1}
/* two skies share the same dither mask, so a change of mood is a plain colour blend of the two (no white flash, no jump at the end);
   the blended sky is then laid over the page at the strength of the sky itself, and only the small things cross-fade */
let XB=null;
function blend(a,b,e){const w=a.width,h=a.height;if(!XB||XB.width!==w||XB.height!==h)XB=cnv(w,h);const g=XB.getContext('2d');g.globalAlpha=1;g.clearRect(0,0,w,h);g.drawImage(a,0,0);g.globalAlpha=e;g.drawImage(b,0,0);g.globalAlpha=1;return XB}
function wxDraw(C,s,vw,vh){const sk=s.sky*(s.wf===undefined?1:s.wf),t=s.clk,q=Math.max(0,s.wt||0)/SEG,n=Math.floor(q),f=q-n,fade=n>0&&f<XF,e=fade?ease(f/XF):1;if(sk<.01)return;C.imageSmoothingEnabled=false;
  const cur=mood(n);let sky=skyArt(cur,vw,vh);if(fade)sky=blend(skyArt(mood(n-1),vw,vh),sky,e);
  C.globalAlpha=sk*.94;C.drawImage(sky,0,0);
  if(fade)elems(C,mood(n-1),t,sk*(1-e),vw,vh,SEG+f*SEG);
  elems(C,cur,t,sk*e,vw,vh,f*SEG);
  if(f>.5)skyArt(mood(n+1),vw,vh);C.globalAlpha=1}
const weather=(C,s,vw,vh)=>{if(!(vw>0&&vh>0))return;try{wxDraw(C,s,vw,vh)}catch(e){C.globalAlpha=1}};

/* ---------- pixel-art plates for the first three leaderboard rows: brushed gold, brushed silver, oak. One cell = one pixel; the page enlarges them with crisp edges. ---------- */
function plate(kind,w,h,seed){
  const c=cnv(w,h),g=c.getContext('2d'),r=rnd32(seed||11),im=g.createImageData(w,h),d=im.data,TAU=Math.PI*2;
  const P={gold:['#6b4300','#9a6508','#c78f12','#e9b92a','#fbd85a','#fff0a6','#fffbe3'],silver:['#5f6878','#8590a2','#aeb8c8','#cdd5e1','#e6ebf3','#f7f9fc','#ffffff'],wood:['#5e3819','#774b24','#915f2f','#aa7740','#c08c52','#d3a068','#e2b886']}[kind]||[];
  const col=P.map(s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)]),n=col.length,wood=kind==='wood',kn=wood?[[w*.28,h*.46,5,3],[w*.78,h*.62,4,2.5]]:[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v;
    if(wood){const wob=Math.sin(x*TAU*2/w+y*.35)*.9+Math.sin(x*TAU/w+y*.8)*.6;v=3.8+Math.sin((y+wob)*1.15)*.85+Math.sin((y+wob*.6)*2.9)*.3-(y<2||y>h-3?.8:0);
      for(const q of kn){const e=((x-q[0])/q[2])**2+((y-q[1])/q[3])**2;if(e<1)v=1.2+e*2;else if(e<1.9)v-=.9*(1.9-e)}}
    else{const u=y/(h-1),band=n-1-Math.abs(u-.38)*(n+1),dg=(((x+y*1.6)%26)+26)%26,st=dg<2?1.6:dg<4?.8:dg>22?-.5:0;v=band+st+((y&3)===0?-.45:0)+(((x*7+y*13)&15)===0?.9:0)}
    if(r()<.035)v+=r()<.5?1:-1;
    const i=Math.max(0,Math.min(n-1,Math.round(v))),o=(y*w+x)*4,q=col[i];d[o]=q[0];d[o+1]=q[1];d[o+2]=q[2];d[o+3]=255}
  g.putImageData(im,0,0);return c}

window.DinoFX={plate,busy:()=>!!run,RARE,pick,allowed,log,nextVariant,play,cheer,build,render,giftArt,SETS,sprite,weather,mood,SEG};
})();
