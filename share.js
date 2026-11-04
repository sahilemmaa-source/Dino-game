'use strict';
/* Dino Run - share. The eight apps, the address that hands a ready message to each one, a short video for the video app,
   and the logo slots: put an app's own logo file into the "logos" folder (youtube.png, whatsapp.png ... or .svg) and it is shown here with a light pixel-art look;
   until a file is there a plain placeholder picture is drawn. Nothing in this file touches the page except the canvases it is given. */
(()=>{
const enc=encodeURIComponent;
const APPS=[{k:'yt',n:'YouTube'},{k:'wa',n:'WhatsApp'},{k:'ig',n:'Instagram'},{k:'tg',n:'Telegram'},{k:'sc',n:'Snapchat'},{k:'ms',n:'Messenger'},{k:'go',n:'Google'},{k:'sm',n:'Messages'}];
/* these four can send either a message or a story */
const CHIPS={wa:1,ig:1,sc:1,tg:1};
/* each app has a plain icon (used standing up) and a wordmark, icon + name (used lying down); a missing wordmark falls back to the icon */
const FILES={yt:['youtube','youtube-wordmark'],wa:['whatsapp','whatsapp-wordmark'],ig:['instagram','instagram-wordmark'],tg:['telegram','telegram-wordmark'],sc:['snapchat','snapchat-wordmark'],ms:['messenger','messenger-wordmark'],go:['google','google-wordmark'],sm:['messages','messages-wordmark']};
/* wordmarks drawn in white need a dark plate behind them */
const DARK={wa:1};

/* ---------- placeholder pictures (10 x 10 cells on a 16 x 16 plate) ---------- */
const bm=rows=>rows.map(r=>[...r].map(ch=>ch==='#'?1:0));
const mask=f=>{const r=[];for(let y=0;y<10;y++){const s=[];for(let x=0;x<10;x++)s.push(f(x,y)?1:0);r.push(s)}return r};
const pip=(px,py,P)=>{let o=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>py)!==(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])o=!o}return o};
const GL={
 yt:bm([".........." ,"#######...","#.....#..#","#.....#.##","#.....####","#.....#.##","#.....#..#","#######...","..#..#....",".........."]),
 wa:bm(["..######..",".########.","##########","##.##.##.#","##########",".########.","..######..",".###......","##........","#........."]),
 ig:bm([".........." ,"##########","#....##..#","#....##..#","#........#","#..#.....#","#.###..#.#","#######.##","##########",".........."]),
 tg:mask((x,y)=>pip(x+.5,y+.5,[[0,4.2],[10,0],[6,10],[4.4,6.4]])),
 sc:mask((x,y)=>Math.pow(Math.abs(x-4.5),2/3)+Math.pow(Math.abs(y-4.5),2/3)<=Math.pow(5.1,2/3)),
 ms:bm(["..######..",".########.","###.##.###","##......##","###....###",".###..###.","..######..",".....###..","......##..",".......#.."]),
 go:bm(["..####....",".#....#...","#......#..","#......#..","#......#..","#......#..",".#....#...","..####.##.","........##",".........#"]),
 sm:bm([".........." ,"##########","##......##","#.#....#.#","#..#..#..#","#...##...#","#........#","#........#","##########",".........."])
};
const dpr=()=>devicePixelRatio||1;
const size=(c,W,H)=>{const d=dpr();c.style.width=W/d+'px';c.style.height=H/d+'px'};
/* a calm neutral plate with a dark picture; `px` is the wanted size in device pixels, the real size used is returned */
function plain(c,key,px){const m=GL[key],p=Math.max(1,Math.floor(px/16)),S=16*p;c.width=c.height=S;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(!m)return S;
 const cut=(x,y)=>{const ex=Math.min(x,15-x),ey=Math.min(y,15-y);return ex<3&&ey<3&&ex+ey<3},ins=(x,y)=>x>=0&&y>=0&&x<16&&y<16&&!cut(x,y);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){if(!ins(x,y))continue;const edge=!ins(x-1,y)||!ins(x+1,y)||!ins(x,y-1)||!ins(x,y+1);g.fillStyle=edge?'#141413':(x>=14||y>=14)?'#c3cad6':(x<=1||y<=1)?'#ffffff':'#e6eaf1';g.fillRect(x*p,y*p,p,p)}
 const at=(x,y)=>x>=0&&y>=0&&x<10&&y<10&&m[y][x];
 g.fillStyle='#ffffff';for(let y=0;y<10;y++)for(let x=0;x<10;x++)if(at(x,y))g.fillRect((x+3)*p+p,(y+3)*p+p,p,p);
 g.fillStyle='#2b3140';for(let y=0;y<10;y++)for(let x=0;x<10;x++)if(at(x,y))g.fillRect((x+3)*p,(y+3)*p,p,p);
 return S}

/* ---------- the real logo files in the "logos" folder (svg or png); each is loaded once per page, then remembered ---------- */
const loadImg=u=>new Promise(res=>{const im=new Image();im.decoding='async';im.onload=()=>res(im.naturalWidth||im.width?im:null);im.onerror=()=>res(null);im.src=u});
/* an svg gets an explicit size first, because some browsers report none for a file that only has a viewBox */
async function getSvg(u){try{const r=await fetch(u);if(!r.ok)return null;let t=await r.text();const m=/<svg\b[^>]*>/i.exec(t);if(!m)return null;
 const vb=/viewBox\s*=\s*["']\s*(-?[\d.eE+-]+)[\s,]+(-?[\d.eE+-]+)[\s,]+([\d.eE+]+)[\s,]+([\d.eE+]+)\s*["']/i.exec(m[0]),w=vb?+vb[3]:0,h=vb?+vb[4]:0;
 if(w>0&&h>0){const k=512/Math.max(w,h);t=t.replace(m[0],m[0].replace(/\s(?:width|height)\s*=\s*(["'])[^"']*\1/gi,'').replace(/<svg/i,'<svg width="'+Math.round(w*k)+'" height="'+Math.round(h*k)+'"'))}
 const o=URL.createObjectURL(new Blob([t],{type:'image/svg+xml'})),im=await loadImg(o);URL.revokeObjectURL(o);return im}catch(e){return null}}
const cache={};
/* where the picture really is: the box around everything that is not transparent, so wide or padded files fill their space */
function bbox(im){try{const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,k=Math.min(1,256/Math.max(iw,ih)),w=Math.max(1,Math.round(iw*k)),h=Math.max(1,Math.round(ih*k)),t=document.createElement('canvas');t.width=w;t.height=h;const g=t.getContext('2d');g.drawImage(im,0,0,w,h);const d=g.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 return x1<0?null:[x0/k,y0/k,(x1-x0+1)/k,(y1-y0+1)/k]}catch(e){return null}}
/* the files that are really in the "logos" folder - a name that is not listed is never asked for, so there are no failed requests. To add one (the Messenger logo, say): put messenger.svg or messenger.png in the folder and add its file name here. */
const HAVE=['google.svg','google-wordmark.svg','instagram.svg','instagram-wordmark.svg','messages.svg','snapchat.svg','snapchat-wordmark.svg','telegram.svg','telegram-wordmark.svg','whatsapp.svg','whatsapp-wordmark.svg','youtube.svg','youtube-wordmark.svg'];
const file=nm=>{if(cache[nm])return cache[nm];const f=HAVE.find(h=>h.replace(/\.\w+$/,'')===nm);return cache[nm]=f?(/\.svg$/i.test(f)?getSvg('logos/'+f):loadImg('logos/'+f)).then(im=>im?{im,bb:bbox(im)}:null).catch(()=>null):Promise.resolve(null)};
function real(key,wide){const f=FILES[key];if(!f)return Promise.resolve(null);const icon=()=>file(f[0]).then(r=>r&&{im:r.im,bb:r.bb,wm:0});return wide?file(f[1]).then(r=>r?{im:r.im,bb:r.bb,wm:1}:icon()):icon()}
/* a light pixel-art look: the logo is squeezed to a grid of cells about 2 px wide and drawn back up with hard edges, so it stays easy to recognise */
function pixelate(c,r,bw,bh,key){const im=r.im,iw=im.naturalWidth||im.width||256,ih=im.naturalHeight||im.height||256,bb=r.bb||[0,0,iw,ih],cell=Math.max(1,Math.round(1.8*dpr())),pad=r.wm&&DARK[key]?2:0,
 mw=Math.max(8,Math.floor(bw/cell))-2*pad,mh=Math.max(8,Math.floor(bh/cell))-2*pad,s=Math.min(mw/bb[2],mh/bb[3]),w=Math.max(1,Math.round(bb[2]*s)),h=Math.max(1,Math.round(bb[3]*s)),cw=w+2*pad,ch=h+2*pad;
 let src=im,sx=bb[0],sy=bb[1],sw=bb[2],sh=bb[3];
 while(sw>w*2||sh>h*2){const nw=Math.max(w,Math.ceil(sw/2)),nh=Math.max(h,Math.ceil(sh/2)),t=document.createElement('canvas');t.width=nw;t.height=nh;const tg=t.getContext('2d');tg.imageSmoothingQuality='high';tg.drawImage(src,sx,sy,sw,sh,0,0,nw,nh);src=t;sx=sy=0;sw=nw;sh=nh}
 const sm=document.createElement('canvas');sm.width=cw;sm.height=ch;const sg=sm.getContext('2d');sg.imageSmoothingQuality='high';
 if(pad){sg.fillStyle='#141413';for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const ex=Math.min(x,cw-1-x),ey=Math.min(y,ch-1-y);if(!(ex<2&&ey<2&&ex+ey<2))sg.fillRect(x,y,1,1)}}
 sg.drawImage(src,sx,sy,sw,sh,pad,pad,w,h);
 c.width=cw*cell;c.height=ch*cell;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,c.width,c.height);g.drawImage(sm,0,0,c.width,c.height);return[c.width,c.height]}
/* draws the placeholder at once and swaps in the real logo as soon as its file has loaded; (bw, bh) is the box in device pixels, `wide` picks the wordmark */
function logo(c,key,bw,bh,wide){const t=c._t=(c._t||0)+1,S=plain(c,key,Math.min(bw,bh));size(c,S,S);real(key,wide).then(r=>{if(!r||c._t!==t)return;try{const d=pixelate(c,r,bw,bh,key);size(c,d[0],d[1])}catch(e){}});return S}

/* ---------- where each app gets its message. A web page cannot see anybody's friends inside another app, so: the apps that have an address for a ready
   message get it; the ones that only take a picture (stories, Instagram, the video app) receive it through the phone's own share window ---------- */
function route(key,mode,t,u){const body=(t+(u?' '+u:'')).trim(),st=mode==='s';
 if(key==='wa')return{share:st,open:'https://wa.me/?text='+enc(body)};
 if(key==='tg')return{share:st,open:u?'https://t.me/share/url?url='+enc(u)+'&text='+enc(t):'https://t.me/share/url?url='+enc(body)};
 if(key==='sc')return u?{share:st,open:'https://www.snapchat.com/scan?attachmentUrl='+enc(u)}:{share:1,text:1};
 if(key==='ig')return{share:1,copy:1,open:st?'https://www.instagram.com/':'https://www.instagram.com/direct/inbox/'};
 if(key==='ms')return{share:'text',copy:1,open:'https://www.messenger.com/',deep:/Android/i.test(navigator.userAgent)&&u?'intent://share/?link='+enc(u)+'#Intent;scheme=fb-messenger;package=com.facebook.orca;S.browser_fallback_url='+enc('https://www.messenger.com/')+';end':''};
 if(key==='go')return{open:'https://www.google.com/search?udm=50&q='+enc(body)};
 if(key==='sm')return{deep:'sms:?&body='+enc(body),text:1};
 return{share:1,text:1}}

/* ---------- a short upright video made from one picture (a slow push-in), recorded by the browser itself; resolves to null when the browser cannot ---------- */
function clip(src,ms){return new Promise(res=>{let fin=0;const done=v=>{if(!fin){fin=1;res(v)}};try{
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return done(null);
  const W=540,H=960,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),T=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'],mt=T.find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch(e){return false}});
  if(!mt)return done(null);
  const rec=new MediaRecorder(c.captureStream(30),{mimeType:mt,videoBitsPerSecond:3500000}),parts=[];let stop=0;
  const end=()=>{if(stop)return;stop=1;try{rec.stop()}catch(e){done(null)}};
  rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
  rec.onstop=()=>done(parts.length?new Blob(parts,{type:mt.split(';')[0]}):null);rec.onerror=()=>done(null);
  const t0=performance.now(),draw=()=>{const p=Math.min(1,(performance.now()-t0)/ms),z=1+.07*p*(2-p);g.fillStyle='#fff';g.fillRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.scale(z,z);g.drawImage(src,-W/2,-H/2,W,H);g.restore();if(p<1)requestAnimationFrame(draw);else end()};
  rec.start(200);draw();setTimeout(end,ms+4000)
 }catch(e){done(null)}})}

/* every logo file is fetched once, early, so turning the phone only has to redraw */
const warm=()=>{for(const k in FILES)FILES[k].forEach(n=>file(n))};

window.DinoShare={APPS,CHIPS,logo,route,clip,warm};
})();
