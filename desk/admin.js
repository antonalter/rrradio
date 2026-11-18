/* rrradio admin: the control room. Talks to the radio server on your Mac (radio/server.py) with your admin key.
   Nothing here is sent anywhere else, except Lemon Squeezy when you add its key for the Sales tab. */
(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const WORKER='https://rrradio-radio.rrradio.workers.dev';
const ST=[['fresh','Arrivals Hall','f'],['clock','State Library','l'],['global','Global Groove Center','g'],['club','Dance Union Square','u'],['cellar','Haunted Powerhouse','p'],['tube','Lakefield','k'],['taste','Deepot','d']];
const syncNames=()=>{if(!S||!S.stations)return;ST.forEach(x=>{const v=S.stations[x[0]];const n=v&&(typeof v==='string'?v:v.name);if(n)x[1]=n})};
const PARTS=[['morning','Morning 5–11'],['afternoon','Afternoon 11–17'],['evening','Evening 17–22'],['night','Night 22–5']];
const RIGHTS=[['unknown','Rights unknown'],['cleared','Licensed / cleared'],['permission','Artist said yes'],['cc','Creative Commons']];
let C={base:'http://localhost:8800',key:"",remote:0,ls:'',store:'518771',start:30,last:{stations:['club'],parts:[]}},R={},S=null,tab='reviews',cur=0,tmr;
const store=async()=>{await chrome.storage.local.set({adm:C,admRights:R})};
const flash=t=>{const e=$('#msg');e.textContent=t;e.classList.add('on');clearTimeout(flash.t);flash.t=setTimeout(()=>e.classList.remove('on'),2400)};
const fmt=s=>{s=Math.max(0,s|0);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
let BASE=null;
async function base(){if(BASE)return BASE;if(!C.remote)return BASE=C.base.replace(/\/$/,'');
 try{const r=await fetch(WORKER+'/_where',{cache:'no-store'});const t=(await r.text()).trim();const m=t.match(/https?:\/\/[^\s"']+/);if(m)return BASE=m[0].replace(/\/$/,'')}catch{}
 return BASE=WORKER}
async function api(p,o={}){const b=await base();const r=await fetch(b+p,{...o,headers:{'X-Key':C.key||"",'Content-Type':'application/json',...(o.headers||{})}});
 if(r.status===401)throw new Error('Wrong key');const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j}
const post=(p,b)=>api(p,{method:'POST',body:JSON.stringify(b||{})});
async function reach(){const tried=[];const c=[];const b0=await base();c.push(b0);for(const u of ['http://localhost:8800','http://127.0.0.1:8800'])if(!c.includes(u))c.push(u);
 for(const u of c){tried.push(u);try{const r=await fetch(u+'/api/stations',{cache:'no-store'});if(r.ok){BASE=u;return{ok:u,tried}}}catch{}}
 try{const r=await fetch(WORKER+'/_where',{cache:'no-store'});const j=await r.json();if(j.url){tried.push(WORKER);const r2=await fetch(j.url+'/api/stations',{cache:'no-store'});if(r2.ok){BASE=j.url;return{ok:j.url,tried}}}else tried.push(WORKER+' (off air)')}catch{tried.push(WORKER)}
 return{ok:null,tried}}
let LASTTRY=[];
async function load(){try{S=await api('/api/admin/state');syncNames();$('#dot').classList.add('on');$('#conn').textContent=(await base()).replace(/^https?:\/\//,'');}catch(e){if(/fetch|Failed|network/i.test(e.message)){const r=await reach();LASTTRY=r.tried;if(r.ok){try{S=await api('/api/admin/state');syncNames();$('#dot').classList.add('on');$('#conn').textContent=r.ok.replace(/^https?:\/\//,'');draw();return}catch(e2){e=e2}}else e=new Error('Cannot reach the radio')}S=null;$('#dot').classList.remove('on');$('#conn').textContent=e.message}draw()}
/* ---------------------------------------------------------------- tabs */
function tabs(){const q=S?S.inbox.filter(i=>i.ok).length:0,w=S?S.wanted.filter(i=>i.status==='wanted').length:0;
 $('#tabs').innerHTML=[['ovw','Overview',0],['reviews','Ledger',0],['review','MP3 inbox',q],['live','Public view',0],['gaps','Gaps',S?holes().length:0],['air','On air',S?S.library.length:0],['dl','Downloads',w],['rep','Reports',REPN],['focus','Diggers',0],['sales','Sales',0],['set','Settings',0]].map(([k,n,c])=>`<button data-t="${k}" class="${tab===k?'on':''}">${n}${c?`<sup>${c}</sup>`:''}</button>`).join('')}
document.addEventListener('click',e=>{const b=e.target.closest('#tabs [data-t]');if(b){tab=b.dataset.t;draw()}});
function draw(){Object.assign(window,{$,$$,esc,flash,api});window.C=C;tabs();const m=$('#main');if(!S&&tab!=='set'&&tab!=='sales'&&tab!=='ovw'){m.innerHTML=`<h2>Not connected</h2><p>${esc($('#conn').textContent)}.${LASTTRY.length?` Tried: ${LASTTRY.map(esc).join(', ')}.`:''} Start the radio on your Mac (<code>python3 ~/claude_process/irradiation/radio/server.py</code>) and put the admin key in Settings.</p><div class="row"><button class="btn go" data-a="go-set">Open settings</button><button class="btn" data-a="retry">Try again</button></div>`;return}
 ({ovw,review,live,gaps,air,dl,rep,reviews,focus,sales,set})[tab]()}
/* ---------------------------------------------------------------- review desk */
const A=new Audio();A.preload='auto';const cache=new Map();
const queue=()=>S.inbox.filter(i=>i.ok);
async function blobFor(f){if(cache.has(f))return cache.get(f);const p=(async()=>{const b=await base();const r=await fetch(`${b}/api/admin/audio?w=inbox&f=${encodeURIComponent(f)}`,{headers:{'X-Key':C.key||""}});if(!r.ok)throw new Error('audio '+r.status);return URL.createObjectURL(await r.blob())})();cache.set(f,p);
 while(cache.size>4){const k=cache.keys().next().value;cache.get(k).then(u=>URL.revokeObjectURL(u)).catch(()=>{});cache.delete(k)}return p}
let sel={stations:[],parts:[],rights:'unknown'},playingFor=null;
function resetSel(){sel={stations:[...(C.last.stations||[])],parts:[...(C.last.parts||[])],rights:'unknown'}}
function review(){const Q=queue();cur=Math.min(cur,Math.max(0,Q.length-1));const t=Q[cur];const m=$('#main');
 const bad=S.inbox.filter(i=>!i.ok);
 if(!t){A.pause();m.innerHTML=`<h2>Inbox is empty</h2><p>Nothing waits for review. Drop MP3 files into <code>radio/data/inbox/</code> or upload them here.</p>${bad.length?`<p class="m">${bad.length} files cannot be streamed (not MP3)</p>`:''}<div class="row"><label class="btn">Upload MP3<input type="file" id="up" accept=".mp3,audio/mpeg" multiple hidden></label><button class="btn" data-a="retry">Refresh</button></div>`;return}
 m.innerHTML=`<h2>Review</h2><p>${Q.length} to listen to. The player starts ${C.start}% in, so you hear the track, not the intro. Keys work everywhere on this page.</p>
 <div class="warnbar">Public broadcasting needs a licence or the artist's permission. Mark rights for every track you approve; the On air tab shows what is still unknown.</div>
 <div class="desk"><div class="now">
  <div class="m">${cur+1} of ${Q.length} · ${esc(t.file)}</div>
  <div class="t" id="tt">${esc(t.title)}</div><div class="a" id="ta">${esc(t.artist||'Unknown artist')}</div>
  <div class="bar" id="bar"><i id="bi"></i>${[1,2,3,4,5,6,7,8,9].map(i=>`<b style="left:${i*10}%"></b>`).join('')}</div>
  <div class="tm m"><span id="t1">0:00</span><span id="tpl">loading</span><span id="t2">${fmt(t.dur)}</span></div>
  <div class="fields"><input id="fa" value="${esc(t.artist)}" placeholder="Artist"><input id="ft" value="${esc(t.title)}" placeholder="Title"></div>
  <div class="m lbl">Stations</div><div class="row" id="cs">${ST.map(([k,n,key])=>`<button class="chip ${sel.stations.includes(k)?'on':''}" data-st="${k}">${n}<kbd>${key}</kbd></button>`).join('')}</div>
  <div class="m lbl">Parts of the day (none = any time)</div><div class="row" id="cp">${PARTS.map(([k,n],i)=>`<button class="chip ${sel.parts.includes(k)?'on':''}" data-pt="${k}">${n}<kbd>${'qwer'[i]}</kbd></button>`).join('')}</div>
  <div class="m lbl">Rights</div><div class="row" id="cr">${RIGHTS.map(([k,n])=>`<button class="chip ${sel.rights===k?'on':''}" data-rt="${k}">${n}</button>`).join('')}</div>
  <div class="ctrl"><button class="btn go" data-a="approve">Approve <span class="m">enter</span></button><button class="btn" data-a="skip">Next <span class="m">n</span></button><button class="btn warn" data-a="reject" id="rej">Delete <span class="m">x x</span></button><button class="btn" data-a="play">Play / pause <span class="m">space</span></button></div>
  <div class="keys"><kbd>space</kbd> play · <kbd>←</kbd><kbd>→</kbd> ±10 s · <kbd>0</kbd>–<kbd>9</kbd> jump to 0–90% · <kbd>f l g u p k d</kbd> stations · <kbd>q</kbd><kbd>w</kbd><kbd>e</kbd><kbd>r</kbd> parts · <kbd>enter</kbd> approve · <kbd>n</kbd>/<kbd>b</kbd> next/previous · <kbd>x</kbd> twice deletes the file</div>
 </div><div><div class="m lbl" style="margin-top:0">Queue</div><div class="q">${Q.map((x,i)=>`<button data-q="${i}" class="${i===cur?'on':''}"><span class="n">${i+1}</span><b>${esc(x.artist)} — ${esc(x.title)}</b><span class="m">${fmt(x.dur)}</span></button>`).join('')}</div>
 <div class="row" style="margin-top:14px"><label class="btn">Upload MP3<input type="file" id="up" accept=".mp3,audio/mpeg" multiple hidden></label></div></div></div>`;
 play(t)}
async function play(t){if(playingFor===t.file&&!A.paused)return;playingFor=t.file;A.pause();$('#tpl')&&($('#tpl').textContent='loading');
 try{const u=await blobFor(t.file);if(playingFor!==t.file)return;A.src=u;A.onloadedmetadata=()=>{A.currentTime=Math.max(0,Math.min(A.duration*.9,(t.dur||A.duration)*C.start/100));A.play().catch(()=>{})};
  // warm the next two
  const Q=queue();for(const x of Q.slice(cur+1,cur+3))blobFor(x.file).catch(()=>{})}catch(e){flash('Could not load audio');$('#tpl')&&($('#tpl').textContent='error')}}
A.ontimeupdate=()=>{const b=$('#bi');if(!b||!A.duration)return;b.style.width=A.currentTime/A.duration*100+'%';$('#t1').textContent=fmt(A.currentTime);$('#tpl').textContent=A.paused?'paused':'playing'};
let lastEnd=0;A.onended=()=>{if(Date.now()-lastEnd<1500)return;lastEnd=Date.now();go(1)};
function go(d){const n=queue().length;if(!n)return;cur=(cur+d+n)%n;resetSel();playingFor=null;draw()}
async function approve(){const t=queue()[cur];if(!t)return;if(!sel.stations.length){flash('Pick a station first');return}
 try{const r=await post('/api/admin/approve',{file:t.file,artist:$('#fa').value,title:$('#ft').value,stations:sel.stations,parts:sel.parts});
  R[r.id]=sel.rights;C.last={stations:[...sel.stations],parts:[...sel.parts]};await store();flash('On air: '+(sel.stations.map(s=>ST.find(x=>x[0]===s)[1]).join(', ')));
  S.inbox=S.inbox.filter(i=>i.file!==t.file);playingFor=null;A.pause();const n=queue().length;cur=Math.min(cur,Math.max(0,n-1));resetSel();draw();load()}
 catch(e){flash(e.message)}}
let armed=0;
async function reject(){const t=queue()[cur];if(!t)return;if(!armed){armed=setTimeout(()=>{armed=0;$('#rej')&&$('#rej').classList.remove('arm')},2200);$('#rej')&&$('#rej').classList.add('arm');flash('Press again to delete this file for good');return}
 clearTimeout(armed);armed=0;try{await post('/api/admin/reject',{file:t.file});S.inbox=S.inbox.filter(i=>i.file!==t.file);playingFor=null;A.pause();cur=Math.min(cur,Math.max(0,queue().length-1));resetSel();flash('Deleted');draw();load()}catch(e){flash(e.message)}}
/* ---------------------------------------------------------------- on air */
let fq='',fst='all',frt='all';
function air(){const L=S.library,sum=L.reduce((a,t)=>a+(t.dur||0),0);const per=Object.fromEntries(ST.map(([k])=>[k,L.filter(t=>(t.stations||[]).includes(k))]));
 const unk=L.filter(t=>(R[t.id]||'unknown')==='unknown').length;
 let rows=L.filter(t=>(fst==='all'||(t.stations||[]).includes(fst))&&(frt==='all'||(R[t.id]||'unknown')===frt)&&(!fq||(t.artist+' '+t.title).toLowerCase().includes(fq)));
 const m=$('#main');m.innerHTML=`<h2>On air</h2><p>${L.length} tracks, ${(sum/3600).toFixed(1)} hours in rotation. ${unk?`<b style="color:var(--a)">${unk} without marked rights.</b>`:'All tracks have rights marked.'}</p>
 <div class="cards">${ST.map(([k,n])=>{const x=S.stations[k]||n,tr=per[k],h=tr.reduce((a,t)=>a+(t.dur||0),0)/3600,now=S.now&&S.now[k]&&S.now[k].now;return`<div class="card ${tr.length<20?'low':''}"><span class="m">${esc(n)}${tr.length<20?' · thin':''}</span><div class="v">${tr.length}</div><span class="m">${h.toFixed(1)} h · ${(S.now&&S.now[k]?S.now[k].listeners:0)||0} listening</span><div style="margin-top:8px;font-size:12px;color:var(--mut)">${now?esc(now.artist+' — '+now.title):'silent'}</div></div>`}).join('')}</div>
 <h3>Library</h3><div class="row"><input id="fq" placeholder="Search" value="${esc(fq)}"><select id="fst"><option value="all">All stations</option>${ST.map(([k,n])=>`<option value="${k}" ${fst===k?'selected':''}>${n}</option>`).join('')}</select><select id="frt"><option value="all">Any rights</option>${RIGHTS.map(([k,n])=>`<option value="${k}" ${frt===k?'selected':''}>${n}</option>`).join('')}</select></div>
 <table class="tbl" style="margin-top:12px"><tr><th>Track</th><th>Stations</th><th>Parts</th><th>Rights</th><th></th></tr>${rows.slice(0,300).map(t=>{const r=R[t.id]||'unknown';return`<tr data-id="${t.id}"><td><b>${esc(t.artist)}</b><br><span class="s">${esc(t.title)} · ${fmt(t.dur)}</span></td><td class="s">${(t.stations||[]).map(s=>(ST.find(x=>x[0]===s)||[0,s])[1]).join(', ')}</td><td class="s">${(t.parts||[]).join(', ')||'any'}</td><td><select data-rt="${t.id}">${RIGHTS.map(([k,n])=>`<option value="${k}" ${r===k?'selected':''}>${n}</option>`).join('')}</select></td><td><button class="btn warn" data-rm="${t.id}">Remove</button></td></tr>`}).join('')}</table>${rows.length>300?`<p class="m">Showing 300 of ${rows.length}</p>`:''}`}


/* ---------------------------------------------------------------- public view: listen as a listener, fix on the spot */
let LV={st:'club',sel:null,ed:null,tid:null};
const trk=id=>S.library.find(t=>t.id===id);
function lvTarget(){const r=S.now&&S.now[LV.st],n=r&&r.now;const id=LV.sel||(n&&n.id);return{id,n,r,t:id?trk(id):null}}
function lvPanel(){const {id,n,r,t}=lvTarget(),p=$('#lvp');if(!p)return;
 if(!r){p.innerHTML='<p class="s">This station is silent right now.</p>';return}
 const m=t||(n&&n.id===id?n:(r.next||[]).find(x=>x.id===id))||{};
 if(LV.tid!==id){LV.tid=id;LV.ed={stations:[...((t&&t.stations)||[])],parts:[...((t&&t.parts)||[])]}}
 const nowId=n&&n.id,rt=R[id]||'unknown';
 p.innerHTML=`<div class="m lbl">${id===nowId?'Playing now':'Selected, coming up'} · ${r.listeners||0} listening · part: ${esc(r.part||'')}</div>
 ${id?`<div class="row"><input id="lva1" placeholder="Artist" value="${esc(m.artist||'')}"><input id="lva2" placeholder="Title" value="${esc(m.title||'')}"></div>
 <div class="m lbl">Stations</div><div class="row">${ST.map(([k,nn])=>`<button class="chip ${LV.ed.stations.includes(k)?'on':''}" data-lst="${k}">${nn}</button>`).join('')}</div>
 <div class="m lbl">Parts of the day (none = any time)</div><div class="row">${PARTS.map(([k,nn])=>`<button class="chip ${LV.ed.parts.includes(k)?'on':''}" data-lpt="${k}">${nn}</button>`).join('')}</div>
 <div class="m lbl">Rights</div><div class="row"><select id="lvr">${RIGHTS.map(([k,nn])=>`<option value="${k}" ${rt===k?'selected':''}>${nn}</option>`).join('')}</select></div>
 <div class="row" style="margin-top:14px"><button class="btn go" data-a="lv-save">Save changes</button><button class="btn bad" data-lvrm="${id}">Remove from air</button></div>
 <p class="s">A track that is playing finishes first. Changes apply from the next pick. There is no skip on the server.</p>`:'<p class="s">Nothing is playing.</p>'}
 <div class="m lbl" style="margin-top:18px">Up next</div><div class="q">${(r.next||[]).map(x=>`<button data-lsel="${x.id}" class="${x.id===id?'on':''}"><span class="n">›</span><span><b>${esc(x.artist)}</b><br><span class="s">${esc(x.title)}</span></span></button>`).join('')||'<span class="s">The queue fills as the station plays.</span>'}</div>
 ${n&&id!==nowId?`<div class="row"><button class="btn" data-a="lv-now">Back to the playing track</button></div>`:''}`}
function live(){const m=$('#main');if(!$('#lv')){const A2=document.createElement('audio');
  m.innerHTML=`<h2>Public view</h2><p>This is what a listener hears. Pick a station, press play, and fix any track right here.</p>
  <div class="row" id="lvs">${ST.map(([k,n])=>`<button class="chip ${LV.st===k?'on':''}" data-lst2="${k}">${n}</button>`).join('')}</div>
  <div class="row" style="margin:14px 0"><button class="btn go" data-a="lv-play">Listen</button><audio id="lva" controls preload="none" style="height:36px;max-width:100%"></audio></div><div id="lv"><div id="lvp"></div></div>`}
 $$('#lvs [data-lst2]').forEach(b=>b.classList.toggle('on',b.dataset.lst2===LV.st));lvPanel()}
async function lvSwitch(k){LV.st=k;LV.sel=null;LV.tid=null;const a=$('#lva');if(a&&!a.paused){a.src=(await base())+`/stream/${k}.mp3`;a.play().catch(()=>{})}live()}
/* ---------------------------------------------------------------- find tracks for the gaps (Last.fm similar artists) */
const LFK=(()=>{try{return[...atob(_C[0])].map((c,i)=>String.fromCharCode(c.charCodeAt(0)^'rradiation'.charCodeAt(i%10))).join('')}catch{return''}})();
const TAGS={fresh:['indie','electronic'],clock:['ambient','modern classical','drone'],global:['afrobeat','cumbia','highlife','world'],club:['house','techno','electro','uk garage'],cellar:['industrial','experimental','noise','dark ambient'],tube:['post-punk','psychedelic','shoegaze','krautrock']};
const lfm=async(m,p)=>{const r=await fetch('https://ws.audioscrobbler.com/2.0/?'+new URLSearchParams({method:m,api_key:LFK,format:'json',...p}));return r.json()};
let FIND={};
async function findFor(k){const box=$('#find-'+k);if(!box)return;box.innerHTML='<p class="s"><span class="spin"></span>Looking for similar artists…</p>';
 try{const have=new Set([...S.library.map(t=>(t.artist||'').toLowerCase()),...S.wanted.map(i=>(i.a||'').toLowerCase())]);
  const mine=[...new Set(S.library.filter(t=>(t.stations||[]).includes(k)).map(t=>t.artist))].sort(()=>Math.random()-.5).slice(0,6);let cand=[];
  for(const a of mine){const j=await lfm('artist.getSimilar',{artist:a,limit:8,autocorrect:1});cand.push(...((j.similarartists&&j.similarartists.artist)||[]).map(x=>x.name))}
  if(cand.length<10)for(const g of TAGS[k]||[]){const j=await lfm('tag.getTopArtists',{tag:g,limit:10});cand.push(...((j.topartists&&j.topartists.artist)||[]).map(x=>x.name))}
  cand=[...new Set(cand)].filter(n=>!have.has(n.toLowerCase())).sort(()=>Math.random()-.5).slice(0,16);const out=[];
  for(const n of cand){try{const j=await lfm('artist.getTopTracks',{artist:n,limit:1,autocorrect:1});const t=j.toptracks&&j.toptracks.track&&j.toptracks.track[0];if(t)out.push({a:n,t:t.name})}catch{}}
  FIND[k]=out;const parts=holes().filter(x=>x.k===k).map(x=>x.p);
  box.innerHTML=out.length?`<div class="m lbl">${out.length} candidates, ${mine.length?'similar to what is on this station':'from the genre tags'}. Untick what you do not want.</div><div class="cands">${out.map((x,i)=>`<label class="chip on"><input type="checkbox" checked data-fi="${k}:${i}" hidden>${esc(x.a)} · ${esc(x.t)}</label>`).join('')}</div><div class="row" style="margin-top:10px"><button class="btn go" data-fadd="${k}">Add selected to wanted</button><span class="s">They go to ${esc(ST.find(x=>x[0]===k)[1])}${parts.length?', for '+parts.map(p=>p).join(', '):''}.</span></div>`:'<p class="s">Nothing new found. Add a few tracks for this station by hand to seed it.</p>'}
 catch(e){box.innerHTML=`<p class="s">Search failed: ${esc(e.message)}</p>`}}
/* ---------------------------------------------------------------- gaps: where the rotation is thin */
const BRIEF={fresh:'new releases from artists already on air and their neighbours',clock:'calm, mostly instrumental background: ambient, modern classical, slow jazz, drone',global:'groove from Africa, Asia, Latin America and Eastern Europe: cumbia, afrobeat, highlife, dub, folk-electronic',club:'Detroit, house, electro, bass, UK garage, classics and new',cellar:'dark and experimental: industrial, musique concrete, sound art, noise-adjacent',tube:'psych, krautrock, no wave, post-punk, shoegaze, folk rock'};
const PART_MOOD={morning:'gentle, waking up, bright but not loud',afternoon:'steady, focused, mid energy',evening:'warmer, groovier, building',night:'late, deep, strange, slower or hypnotic'};
const MINB=15,GOODB=40;
const ONAIR=ST.filter(x=>x[0]!=='taste');
function binStats(){const L=S.library,o={};ONAIR.forEach(([k,n])=>{const tr=L.filter(t=>(t.stations||[]).includes(k));o[k]={n,tr,all:tr.length,bins:{}};PARTS.forEach(([p])=>{const b=tr.filter(t=>!(t.parts||[]).length||(t.parts||[]).includes(p));o[k].bins[p]={n:b.length,own:tr.filter(t=>(t.parts||[]).includes(p)).length,min:b.reduce((a,t)=>a+(t.dur||0),0)/60,art:new Set(b.map(t=>(t.artist||'').toLowerCase())).size}})});return o}
function holes(){if(!S)return[];const B=binStats(),h=[];ONAIR.forEach(([k])=>PARTS.forEach(([p])=>{const b=B[k].bins[p];if(b.n<MINB)h.push({k,p,n:b.n,need:MINB-b.n})}));return h.sort((a,b)=>b.need-a.need)}
function gaps(){const B=binStats(),H=holes(),inbox=queue().length,wanted=S.wanted.filter(i=>i.status==='wanted').length,d=S.dl||{};
 const thin=[];ONAIR.forEach(([k])=>PARTS.forEach(([p])=>{const b=B[k].bins[p];if(b.n>=MINB&&b.n<GOODB)thin.push({k,p,n:b.n})}));thin.sort((a,b)=>a.n-b.n);
 const L=S.library,untag=L.filter(t=>!(t.parts||[]).length&&(t.stations||[]).some(x=>x!=='taste')).length;
 const cnt={};L.forEach(t=>{const a=(t.artist||'').toLowerCase();cnt[a]=(cnt[a]||0)+1});const heavy=Object.entries(cnt).filter(([,c])=>c>=4).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const unk=L.filter(t=>(R[t.id]||'unknown')==='unknown').length,nm=k=>ST.find(x=>x[0]===k)[1],pn=p=>PARTS.find(x=>x[0]===p)[1].split(' ')[0];
 const byS={};H.forEach(x=>(byS[x.k]=byS[x.k]||[]).push(x));
 const first=[];
 if(inbox)first.push(`<li><b>${inbox} tracks already wait in the inbox.</b> Review them first: the quickest fix. <button class="btn go" data-a="go-rev">Open Review</button></li>`);
 if(wanted&&!d.auto)first.push(`<li><b>${wanted} wanted tracks are not downloading.</b> Turn on auto-download or start it now. <button class="btn" data-a="dl-all">Download all wanted</button></li>`);
 Object.entries(byS).sort((a,b)=>b[1].reduce((n,x)=>n+x.need,0)-a[1].reduce((n,x)=>n+x.need,0)).forEach(([k,xs])=>{const need=xs.reduce((n,x)=>n+x.need,0);
  first.push(`<li><b>${nm(k)}: ${need} more tracks to fill the holes.</b> Short in ${xs.map(x=>`${pn(x.p)} (${x.n})`).join(', ')}.<br><span class="s">Look for: ${BRIEF[k]}.${xs.length<4?' Mood for the empty parts: '+xs.map(x=>`${pn(x.p)} is ${PART_MOOD[x.p]}`).join('; ')+'.':''}</span><br><button class="btn" data-find="${k}">Find tracks for this</button><div id="find-${k}"></div></li>`)});
 const refine=[];
 if(thin.length)refine.push(`<li><b>Thin bins (under ${GOODB} tracks):</b> ${thin.slice(0,8).map(x=>`${nm(x.k)} ${pn(x.p)} ${x.n}`).join(' · ')}. Repeats start to show here.</li>`);
 if(untag)refine.push(`<li><b>${untag} tracks have no part of the day.</b> They play at any hour, so they hide holes. Tag the ones with a clear mood in On air.</li>`);
 if(heavy.length)refine.push(`<li><b>Artists with 4+ tracks:</b> ${heavy.map(([a,c])=>`${esc(a)} ${c}`).join(', ')}. Widen the names.</li>`);
 if(unk)refine.push(`<li><b>${unk} tracks without marked rights.</b> Mark them before the public launch.</li>`);
 const row=([k,n])=>{const x=B[k];return`<tr><td><b>${esc(n)}</b><br><span class="s">${x.all} track${x.all===1?'':'s'}</span></td>${PARTS.map(([p])=>{const b=x.bins[p],c=b.n<MINB?'bad':b.n<GOODB?'a':'ok';return`<td><span class="tag ${c}">${b.n}</span><br><span class="s">${b.min.toFixed(0)} min · ${b.art} artists</span></td>`}).join('')}</tr>`};
 $('#main').innerHTML=`<h2>Gaps</h2><p>Tracks that can play in each part of the day, per station. A track without a part counts everywhere. Under ${MINB} is a hole, under ${GOODB} is thin. Deepot is fed by the other stations.</p>
 <table class="tbl"><tr><th>Station</th>${PARTS.map(([,n])=>`<th>${n}</th>`).join('')}</tr>${ONAIR.map(row).join('')}</table>
 <h3>Fix first: holes</h3>${first.length?`<ol class="todo">${first.join('')}</ol>`:'<p>No holes. Every part of the day has at least '+MINB+' tracks on every station.</p>'}
 <h3>Then refine</h3>${refine.length?`<ol class="todo">${refine.join('')}</ol>`:'<p>Nothing to refine right now.</p>'}
 <h3>New tracks keep arriving</h3><p>Watched folders and the wanted list feed the inbox on their own. Auto-approve puts new tracks on air by themselves, so keep it off while rights are unmarked.</p>
 <div class="row"><label class="chip ${d.auto?'on':''}" data-a="autodl">Auto-download</label><label class="chip ${S.auto?'on':''}" data-a="auto">Auto-approve</label><label class="btn" for="impf">Import YouTube likes (.json)</label><input id="impf" type="file" accept=".json" hidden><span class="s">${(S.watch||[]).length} watched folder${(S.watch||[]).length===1?'':'s'} · ${wanted} wanted · ${inbox} in inbox</span><button class="btn" data-a="go-dl">Downloads</button></div>`}
/* ---------------------------------------------------------------- error reports collected by the player */
let REPN=0,REPS=[];
let LREP=[];async function repLoad(){try{const o=await chrome.storage.local.get(['reports','rep']);REPS=(o.reports||[]).slice().reverse();LREP=(o.rep||[]).slice().reverse();REPN=REPS.length+LREP.filter(r=>r.bug).length}catch{}}
async function rep(){await repLoad();const m=$('#main');
 const lr=LREP.length?`<h3>From the listener's flag</h3><table class="tbl"><tr><th>When</th><th>Station</th><th>Track</th><th>What</th></tr>${LREP.slice(0,200).map(r=>`<tr><td class="s">${new Date(r.t).toLocaleString()}</td><td>${esc(r.from||'')}</td><td>${esc((r.a||'')+' — '+(r.k||''))}</td><td>${r.bug?`<b>bug: ${esc(r.bug)}</b> ${esc(r.txt||'')}`:r.to?`stations: ${esc(r.to)}`:esc(r.why||'')}</td></tr>`).join('')}</table>`:'';const mp=await megaPanel();m.innerHTML=`<h2>Reports</h2>${mp}<p>Every crash the player caught on this computer, newest first. ${REPS.length?`<button class="btn" data-a="rep-clear">Clear all</button>`:''}</p>${REPS.length?`<table class="tbl"><tr><th>When</th><th>Error</th></tr>${REPS.map(r=>`<tr><td class="s">${new Date(r.t).toLocaleString()}</td><td><b>${esc(r.msg)}</b><br><span class="s" style="white-space:pre-wrap">${esc((r.stack||'').split('\n').slice(0,4).join('\n'))}</span></td></tr>`).join('')}</table>`:'<p class="s">No crashes recorded.</p>'}${lr}`}
/* ---------------------------------------------------------------- downloads */
function dlPanel(){const W=S.wanted||[],d=S.dl||{},c=k=>W.filter(i=>i.status===k).length;
 const live=W.filter(i=>i.status!=='removed'),done=c('ready')+c('onair'),tot=live.length||1,fail=W.filter(i=>i.status==='wanted'&&(i.fails||0)>0),busy=d.busy&&W.find(i=>i.id===d.busy),wait=W.filter(i=>i.status==='wanted'&&!(i.fails>0)).length;
 const pc=Math.round(done/tot*100),recent=W.filter(i=>i.status==='ready'||i.status==='onair').sort((a,b)=>(b.found||0)-(a.found||0)).slice(0,5);
 return`<div class="dlp"><div class="dlh"><span class="m">ClipGrab downloader · ${d.ready===false?'<b style="color:var(--bad)">not found</b>':d.busy?'working':d.queue?'starting':'idle'}${d.auto?' · auto on':' · auto off'}</span><span class="m">${done} of ${live.length} fetched · ${pc}%</span></div>
 <div class="pbar"><i style="width:${pc}%"></i></div>
 <div class="cards" style="margin-top:12px"><div class="card ${busy?'low':''}"><span class="m">Now</span><div class="s" style="margin-top:8px;font-size:14px">${busy?`<span class="spin"></span><b>${esc(busy.a)}</b><br>${esc(busy.t)}`:'Nothing downloading'}</div></div>
  <div class="card"><span class="m">In the queue</span><div class="v">${d.queue||0}</div><span class="m">${wait} waiting, not started</span></div>
  <div class="card"><span class="m">In the inbox</span><div class="v">${c('ready')}</div><span class="m">ready for Review</span></div>
  <div class="card ${fail.length?'low':''}"><span class="m">Failed, will retry</span><div class="v">${fail.length}</div><span class="m">${c('onair')} already on air</span></div></div>
 ${fail.length?`<h3>Problems</h3><table class="tbl">${fail.slice(0,6).map(i=>`<tr><td><b>${esc(i.a)}</b><br><span class="s">${esc(i.t)}</span></td><td class="s">${esc(i.note||'')} · tried ${i.fails}×</td></tr>`).join('')}</table>`:''}
 ${recent.length?`<h3>Just arrived</h3><div class="s">${recent.map(i=>esc(i.a+' – '+i.t)).join(' · ')}</div>`:''}</div>`}
function dl(){const W=S.wanted,g={};W.forEach(i=>(g[i.status]=g[i.status]||[]).push(i));const d=S.dl||{};
 const m=$('#main');m.innerHTML=`<h2>Downloads</h2><div id="dlp">${dlPanel()}</div><p>Tracks you loved or added from the extension arrive here, then the server fetches them and puts them in the inbox. ${d.ready?'Downloader is ready.':'<b style="color:var(--bad)">yt-dlp or ffmpeg is missing on the server.</b>'}</p>
 <div class="row" style="margin-top:18px"><button class="btn go" data-a="dl-all">Download all wanted</button><button class="btn" data-a="dl-stop">Stop and pause auto</button><button class="btn" data-a="links">Wanted links (.txt)</button>
  <label class="chip ${S.auto?'on':''}" data-a="auto">Auto-approve</label><label class="chip ${d.auto?'on':''}" data-a="autodl">Auto-download</label></div>
 <h3>Watched folders</h3><div class="row"><textarea id="watch" rows="3" style="width:min(560px,100%)">${esc((S.watch||[]).join('\n'))}</textarea><button class="btn" data-a="watch">Save folders</button></div>
 <h3>Wanted list</h3><table class="tbl"><tr><th>Track</th><th>Station</th><th>Status</th><th></th></tr>${W.slice().reverse().slice(0,250).map(i=>`<tr><td><b>${esc(i.a)}</b><br><span class="s">${esc(i.t)}</span></td><td class="s">${esc((i.stations||[i.ch||'']).join(', '))}</td><td><span class="tag ${i.status==='wanted'?'a':i.status==='removed'?'bad':'ok'}">${esc(i.status)}${i.fails?' · '+i.fails+' fails':''}</span></td><td><button class="btn" data-uw="${esc(i.id)}">Drop</button></td></tr>`).join('')}</table>`}
/* ---------------------------------------------------------------- sales (Lemon Squeezy) */
async function ls(path){const r=await fetch('https://api.lemonsqueezy.com/v1/'+path,{headers:{Accept:'application/vnd.api+json',Authorization:'Bearer '+C.ls}});if(!r.ok)throw new Error('Lemon Squeezy '+r.status);return r.json()}
async function sales(){const m=$('#main');if(!C.ls){m.innerHTML=`<h2>Sales</h2><p>Add your Lemon Squeezy API key in Settings (Lemon Squeezy → Settings → API). It stays in this browser and is only sent to api.lemonsqueezy.com.</p><button class="btn go" data-a="go-set">Open settings</button>`;return}
 m.innerHTML=`<h2>Sales</h2><p class="m">loading…</p>`;
 try{const [o,s,k]=await Promise.all([ls(`orders?filter[store_id]=${C.store}&page[size]=100&sort=-createdAt`),ls(`subscriptions?filter[store_id]=${C.store}&page[size]=100`),ls(`license-keys?filter[store_id]=${C.store}&page[size]=100`)]);
  const od=o.data||[],sub=s.data||[],keys=k.data||[],live=od.filter(x=>!x.attributes.test_mode),test=od.length-live.length;
  const sum=a=>a.reduce((n,x)=>n+(x.attributes.total||0),0)/100,cur=(od[0]&&od[0].attributes.currency)||'EUR';
  const d30=Date.now()-30*864e5,l30=live.filter(x=>Date.parse(x.attributes.created_at)>d30);
  const act=sub.filter(x=>x.attributes.status==='active'&&!x.attributes.test_mode).length;
  m.innerHTML=`<h2>Sales</h2><p>Store ${esc(C.store)}. ${test?`${test} of the latest orders are test-mode and not counted below.`:''}</p>
  <div class="cards"><div class="card"><span class="m">Revenue (live, last 100)</span><div class="v">${sum(live).toFixed(0)} <span class="m" style="display:inline">${cur}</span></div></div><div class="card"><span class="m">Last 30 days</span><div class="v">${sum(l30).toFixed(0)}</div><span class="m">${l30.length} orders</span></div><div class="card"><span class="m">Active subscriptions</span><div class="v">${act}</div></div><div class="card"><span class="m">License keys</span><div class="v">${keys.length}</div><span class="m">${keys.reduce((n,x)=>n+(x.attributes.instances_count||0),0)} activations</span></div></div>
  <h3>Latest orders</h3><table class="tbl"><tr><th>When</th><th>Product</th><th>Total</th><th>Status</th></tr>${od.slice(0,25).map(x=>{const a=x.attributes;return`<tr><td class="s">${new Date(a.created_at).toLocaleString()}</td><td>${esc((a.first_order_item&&a.first_order_item.product_name)||'')}${a.test_mode?' <span class="tag">test</span>':''}</td><td>${esc(a.total_formatted||'')}</td><td><span class="tag ${a.status==='paid'?'ok':a.status==='refunded'?'bad':''}">${esc(a.status)}</span></td></tr>`}).join('')||'<tr><td colspan=4 class="s">No orders yet</td></tr>'}</table>`}
 catch(e){m.innerHTML=`<h2>Sales</h2><p>${esc(e.message)}. Check the API key and store id in Settings.</p><button class="btn go" data-a="go-set">Open settings</button>`}}
/* ---------------------------------------------------------------- settings */
function set(){$('#main').innerHTML=`<h2>Settings</h2><div class="set">
 <label class="m">Radio server address</label><input id="sb" value="${esc(C.base)}">
 <label class="row"><input type="checkbox" id="sr" ${C.remote?'checked':''} style="width:auto"> <span>Use the public address (through the Cloudflare Worker) when away from the Mac</span></label>
 <label class="m">Admin key</label><input id="sk" type="password" value="${esc(C.key)}" placeholder="from radio/data/admin-key.txt" autocomplete="off">
 <label class="m">Start playback at (% of the track)</label><input id="ss" type="number" min="0" max="90" value="${C.start}">
 <label class="m">Lemon Squeezy API key (optional, for Sales)</label><input id="sl" type="password" value="${esc(C.ls)}" autocomplete="off">
 <label class="m">Lemon Squeezy store id</label><input id="sst" value="${esc(C.store)}">
 <div class="row" style="margin-top:20px"><button class="btn go" data-a="save">Save and connect</button></div></div>
 <p style="margin-top:30px">The key is kept in this browser's extension storage on this computer. It is never sent anywhere except your own radio server and, for Sales, Lemon Squeezy.</p>`}
/* ---------------------------------------------------------------- events */
document.addEventListener('click',async e=>{
 const q=e.target.closest('[data-q]');if(q){cur=+q.dataset.q;resetSel();playingFor=null;draw();return}
 const st=e.target.closest('[data-st]');if(st){const k=st.dataset.st,i=sel.stations.indexOf(k);i<0?sel.stations.push(k):sel.stations.splice(i,1);st.classList.toggle('on');return}
 const pt=e.target.closest('[data-pt]');if(pt){const k=pt.dataset.pt,i=sel.parts.indexOf(k);i<0?sel.parts.push(k):sel.parts.splice(i,1);pt.classList.toggle('on');return}
 const rt=e.target.closest('#cr [data-rt]');if(rt){sel.rights=rt.dataset.rt;$$('#cr .chip').forEach(c=>c.classList.toggle('on',c===rt));return}
 const bar=e.target.closest('#bar');if(bar&&A.duration){const r=bar.getBoundingClientRect();A.currentTime=(e.clientX-r.left)/r.width*A.duration;return}
 const rm=e.target.closest('[data-rm]');if(rm){if(!rm.classList.contains('arm')){rm.classList.add('arm');rm.textContent='Sure?';setTimeout(()=>{rm.classList.remove('arm');rm.textContent='Remove'},2500);return}try{await post('/api/admin/remove',{id:rm.dataset.rm});delete R[rm.dataset.rm];await store();flash('Removed');load()}catch(x){flash(x.message)}return}

  const fi=e.target.closest('[data-find]');if(fi){findFor(fi.dataset.find);return}
 const fc=e.target.closest('.cands label');if(fc){e.preventDefault();const cb=fc.querySelector('input');cb.checked=!cb.checked;fc.classList.toggle('on',cb.checked);return}
 const fa=e.target.closest('[data-fadd]');if(fa){const k=fa.dataset.fadd,pts=holes().filter(x=>x.k===k).map(x=>x.p);const sel=[...$$(`[data-fi^="${k}:"]`)].filter(c=>c.checked).map(c=>FIND[k][+c.dataset.fi.split(':')[1]]);
  if(!sel.length){flash('Nothing ticked');return}try{const r=await post('/api/admin/wanted',{items:sel.map(x=>({a:x.a,t:x.t,kind:'love',stations:[k],parts:pts,ts:Date.now()}))});flash(`Added ${r.added} to wanted`);await load()}catch(x){flash(x.message)}return}
const l2=e.target.closest('[data-lst2]');if(l2){lvSwitch(l2.dataset.lst2);return}
 const ls_=e.target.closest('[data-lst]');if(ls_){const k=ls_.dataset.lst,i=LV.ed.stations.indexOf(k);i<0?LV.ed.stations.push(k):LV.ed.stations.splice(i,1);ls_.classList.toggle('on');return}
 const lp_=e.target.closest('[data-lpt]');if(lp_){const k=lp_.dataset.lpt,i=LV.ed.parts.indexOf(k);i<0?LV.ed.parts.push(k):LV.ed.parts.splice(i,1);lp_.classList.toggle('on');return}
 const lsel=e.target.closest('[data-lsel]');if(lsel){LV.sel=lsel.dataset.lsel;lvPanel();return}
 const lrm=e.target.closest('[data-lvrm]');if(lrm){if(!lrm.classList.contains('arm')){lrm.classList.add('arm');lrm.textContent='Sure?';setTimeout(()=>{lrm.classList.remove('arm');lrm.textContent='Remove from air'},2500);return}
  try{await post('/api/admin/remove',{id:lrm.dataset.lvrm});delete R[lrm.dataset.lvrm];await store();LV.sel=null;LV.tid=null;flash('Removed from air');await load()}catch(x){flash(x.message)}return}
 const uw=e.target.closest('[data-uw]');if(uw){try{await post('/api/admin/unwant',{id:uw.dataset.uw});load()}catch(x){flash(x.message)}return}
 const a=e.target.closest('[data-a]');if(!a)return;const k=a.dataset.a;
 try{
  if(k==='rep-clear'){await chrome.storage.local.set({reports:[]});await repLoad();draw()}
  else if(k==='lv-play'){const au=$('#lva');au.src=(await base())+`/stream/${LV.st}.mp3`;au.play().catch(x=>flash('Cannot play: '+x.message))}
  else if(k==='lv-now'){LV.sel=null;LV.tid=null;lvPanel()}
  else if(k==='lv-save'){const {id}=lvTarget();if(!id)return;if(!LV.ed.stations.length){flash('Pick a station first');return}
   await post('/api/admin/update',{id,artist:$('#lva1').value,title:$('#lva2').value,stations:LV.ed.stations,parts:LV.ed.parts});R[id]=$('#lvr').value;await store();flash('Saved');LV.tid=null;await load()}
  else if(k==='retry'){BASE=null;load()}else if(k==='go-set'){tab='set';draw()}else if(k==='go-rev'){tab='review';draw()}else if(k==='go-dl'){tab='dl';draw()}
  else if(k==='approve')approve();else if(k==='skip')go(1);else if(k==='reject')reject();else if(k==='play'){A.paused?A.play():A.pause()}
  else if(k==='dl-all'){const r=await post('/api/admin/download',{});flash('Queued '+r.queued);load()}
  else if(k==='dl-stop'){await post('/api/admin/download',{stop:true});flash('Stopped');load()}
  else if(k==='auto'){await post('/api/admin/settings',{auto:!S.auto});load()}
  else if(k==='autodl'){await post('/api/admin/settings',{autodl:!(S.dl&&S.dl.auto)});load()}
  else if(k==='watch'){await post('/api/admin/settings',{watch:$('#watch').value.split('\n')});flash('Saved');load()}
  else if(k==='links'){const b=await base();const r=await fetch(b+'/api/admin/links.txt',{headers:{'X-Key':C.key||""}});const u=URL.createObjectURL(await r.blob());const l=document.createElement('a');l.href=u;l.download='rrradio-wanted.txt';l.click()}
  else if(k==='save'){C.base=$('#sb').value.trim()||C.base;C.remote=$('#sr').checked?1:0;C.key=$('#sk').value.trim();try{chrome.storage.local.get('radio').then(o=>chrome.storage.local.set({radio:{url:'http://localhost:8800',on:1,...(o.radio||{}),key:C.key}}))}catch{}C.start=Math.min(90,Math.max(0,+$('#ss').value||0));C.ls=$('#sl').value.trim();C.store=$('#sst').value.trim()||'518771';BASE=null;await store();flash('Saved');tab='review';load()}
 }catch(x){flash(x.message)}});
document.addEventListener('change',async e=>{
 if(e.target.id==='impf'){const f=e.target.files[0];if(!f)return;try{const it=JSON.parse(await f.text());let add=0;for(let i=0;i<it.length;i+=200){const r=await post('/api/admin/wanted',{items:it.slice(i,i+200)});add+=r.added||0}
   flash(`Added ${add} of ${it.length} to the wanted list`+(add<it.length?' (the rest were already there)':''));if(add&&S.dl&&S.dl.auto===false)flash(`Added ${add}. Press "Download all wanted" to start`);await load()}catch(x){flash('Import failed: '+x.message)}e.target.value='';return}
 if(e.target.id==='up'){for(const f of e.target.files){try{const b=await base();const r=await fetch(`${b}/api/admin/upload?name=${encodeURIComponent(f.name)}`,{method:'PUT',headers:{'X-Key':C.key||""},body:f});if(!r.ok)throw new Error('upload '+r.status)}catch(x){flash(x.message)}}flash('Uploaded');load();return}
 if(e.target.dataset&&e.target.dataset.rt&&e.target.tagName==='SELECT'){R[e.target.dataset.rt]=e.target.value;await store();flash('Saved');return}
 if(e.target.id==='fst'){fst=e.target.value;air()}if(e.target.id==='frt'){frt=e.target.value;air()}});
document.addEventListener('input',e=>{if(e.target.id==='fq'){fq=e.target.value.toLowerCase();const c=e.target.selectionStart;air();const n=$('#fq');n.focus();n.setSelectionRange(c,c)}});
document.addEventListener('keydown',e=>{if(tab!=='review'||!S||e.ctrlKey||e.metaKey||e.altKey)return;if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){if(e.key==='Escape')e.target.blur();return}
 const k=e.key.toLowerCase(),t=queue()[cur];if(!t)return;
 if(k===' '){e.preventDefault();A.paused?A.play():A.pause()}else if(k==='arrowright'){A.currentTime+=10}else if(k==='arrowleft'){A.currentTime-=10}
 else if(/^[0-9]$/.test(k)&&!e.shiftKey&&A.duration){A.currentTime=A.duration*(+k)/10}
 else if(k==='enter'){e.preventDefault();approve()}else if(k==='n'){go(1)}else if(k==='b'){go(-1)}else if(k==='x'){reject()}
 else if('qwer'.includes(k)&&k.length===1){const b=$(`[data-pt="${PARTS['qwer'.indexOf(k)][0]}"]`);b&&b.click()}else{const s=ST.find(x=>x[2]===k);if(s){const b=$(`[data-st="${s[0]}"]`);b&&b.click()}}});
/* digits 1–4 also toggle parts when shift is held with the number row: kept simple, click the chips */
(async()=>{const o=await chrome.storage.local.get(['adm','admRights']);if(o.adm)C={...C,...o.adm};R=o.admRights||{};
 if(!C.key){tab='set';draw();$('#conn').textContent='no key';return}
 setInterval(()=>{if(tab==='live'&&!document.hidden){const f=document.activeElement;if(f&&/^(INPUT|SELECT)$/.test(f.tagName)&&f.closest('#lvp'))return;load()}},8000);setInterval(async()=>{if(tab!=='dl'||document.hidden||!S)return;try{S=await api('/api/admin/state');const p=$('#dlp');if(p)p.innerHTML=dlPanel()}catch{}},3000);repLoad().then(tabs);await load();clearInterval(tmr);tmr=setInterval(()=>{if(document.hidden||tab==='set'||tab==='live'||(tab==='review'&&!A.paused))return;load()},30000)})();
})();

const KEYB="";
/* ---------------------------------------------------------------- review log and the mega-prompt */
const MEGA=async()=>{const o=await chrome.storage.local.get(['rvlog','rep','reports','verlog']);const L=o.rvlog||[],F=o.rep||[],C=o.reports||[],V=chrome.runtime.getManifest().version;
 const d=t=>new Date(t).toISOString().slice(0,16).replace('T',' '),ctx=r=>[r.ch&&('station '+r.ch),r.view&&('view '+r.view),r.role&&('as '+r.role),r.ver&&('v'+r.ver)].filter(Boolean).join(' · ');
 const ch=L.filter(r=>r.kind==='note'&&r.vote!=='keep'),kp=L.filter(r=>r.kind==='note'&&r.vote==='keep'),lk=L.filter(r=>r.kind==='like');
 let m=`# rrradio · review by Anton · ${d(Date.now())}\n\nBuild in use: ${V} (mega-admin). Entries: ${L.length} review log, ${F.length} flag reports, ${C.length} crashes.\n\n## How to work on this\n- Every comment below is a requirement for the next stable build. Apply it strongly; do not drop or soften any.\n- For anything you redesign, show Anton a before and after for approval first, and say which comment it answers.\n- Work in ~/claude_process/irradiation/rrradio-stable (build.py patches), build, install to ~/rrradio/installed, test on the stand, then report.\n- Keep the budget: no web research unless a comment needs it.\n\n`;
 m+=`## Change these (${ch.length})\n`+(ch.map(r=>`- [${ctx(r)}] \`${r.el}\`${r.text?` (“${r.text}”)`:''}${r.track?` while playing ${r.track}`:''}\n  - Anton: ${r.comment||'(change, no words)'}`).join('\n')||'- none')+'\n\n';
 m+=`## Keep these, they are right (${kp.length})\n`+(kp.map(r=>`- [${ctx(r)}] \`${r.el}\`${r.text?` (“${r.text}”)`:''}${r.comment?` — ${r.comment}`:''}`).join('\n')||'- none')+'\n\n';
 m+=`## Flag reports from the player (${F.length})\n`+(F.slice(-80).map(r=>`- ${d(r.t)} ${r.from||''} · ${r.a||''} — ${r.k||''}: ${r.bug?'bug '+r.bug+(r.txt?' — '+r.txt:''):r.to?'belongs on '+r.to:(r.why||'')}`).join('\n')||'- none')+'\n\n';
 m+=`## Crashes (${C.length})\n`+(C.slice(-20).map(r=>`- ${d(r.t)} ${r.msg}`).join('\n')||'- none')+'\n\n';
 m+=`## Taste signals: likes while listening (${lk.length})\n`+(lk.slice(-60).map(r=>`- ${r.track} [${ctx(r)}]`).join('\n')||'- none')+'\n';
 return m};
const HK=()=>C.key||KEYB,HB='http://127.0.0.1:8899';
const verPanel=async()=>{try{const j=await fetch(HB+'/versions',{headers:{'X-Key':HK()}}).then(r=>r.json());return `<h3>Versions</h3><p class="s">Installed: admin ${esc(j.installed.owner||'-')} · public ${esc(j.installed.public||'-')}. Install any build below; the extension reloads itself, settings and the review log stay.</p><table class="tbl"><tr><th>Version</th><th>Built</th><th></th></tr>${j.versions.map(v=>`<tr><td><b>${esc(v.version)}</b>${v.version===j.installed.owner?' · in use':''}</td><td class="s">${esc(v.at)} · ${esc(v.kinds.join(', '))}</td><td><button class="btn" data-a="ver-install" data-v="${esc(v.version)}">Install</button></td></tr>`).join('')}</table>`}catch(e){return `<h3>Versions</h3><p class="s">The version helper is not running. In Terminal: python3 ~/rrradio/rr.py serve</p>`}};
const megaPanel=async()=>{const o=await chrome.storage.local.get('rvlog');const L=(o.rvlog||[]).slice().reverse();
 return `${await verPanel()}<h3>Review log · ${L.length}</h3><p class="s">Everything you mark in the radio with Review (Alt+Shift+C), every like, every role switch. Kept across updates.</p>
 <div class="btr"><button class="btn" data-a="mega-show">Build the mega-prompt</button><button class="btn" data-a="mega-dl">Download .md</button><button class="btn" data-a="mega-clear">Clear the log</button></div><textarea id="megat" style="width:100%;min-height:220px;margin-top:10px;display:none"></textarea>
 ${L.length?`<table class="tbl"><tr><th>When</th><th>Where</th><th>What</th></tr>${L.slice(0,150).map(r=>`<tr><td class="s">${new Date(r.t).toLocaleString()}</td><td class="s">${esc([r.ch,r.view,r.role].filter(Boolean).join(' · '))}<br>${esc(r.el||'')}</td><td>${r.kind==='note'?`<b>${r.vote==='keep'?'Keep':'Change'}</b> ${esc(r.comment||'')}`:esc(r.kind+': '+(r.comment||'')+(r.track?' · '+r.track:''))}</td></tr>`).join('')}</table>`:''}`};
document.addEventListener('click',async e=>{const a=e.target.closest('[data-a^="mega-"],[data-a="ver-install"]');if(!a)return;const k=a.dataset.a;
 if(k==='mega-show'){const t=document.getElementById('megat');t.value=await MEGA();t.style.display='block';t.select();try{await navigator.clipboard.writeText(t.value);flash('Copied, paste it to Claude')}catch{flash('Select all and copy')}}
 else if(k==='mega-dl'){const b=new Blob([await MEGA()],{type:'text/markdown'}),u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download='rrradio-megaprompt-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.md';document.body.appendChild(l);l.click();l.remove();flash('Saved to Downloads')}
 else if(k==='ver-install'){const v=a.dataset.v;if(!a.dataset.sure){a.dataset.sure=1;a.textContent='Install '+v+'?';return}a.textContent='Installing…';try{const r=await fetch(HB+'/install',{method:'POST',headers:{'X-Key':HK(),'Content-Type':'application/json'},body:JSON.stringify({version:v})}).then(r=>r.json());flash('Installed '+v+': '+(r.installed||[]).join(', ')+'. Reloading…')}catch(x){flash('Helper not reachable')}}
 else if(k==='mega-clear'){if(a.dataset.sure){await chrome.storage.local.set({rvlog:[]});flash('Log cleared');draw()}else{a.dataset.sure=1;a.textContent='Click again to clear'}}});

/* ---------------------------------------------------------------- focus group */
async function focus(){const m=$('#main');m.innerHTML='<h2>Diggers Depot</h2><p class="s">Loading…</p>';let j;try{j=await api('/api/admin/focus')}catch(e){m.innerHTML='<h2>Diggers Depot</h2><p>Cannot reach the radio.</p>';return}
 const P=j.people||[],d=t=>t?new Date(t).toLocaleString():'-';
 if(!P.length){m.innerHTML='<h2>Diggers Depot</h2><p class="s">Nobody yet. Give a trusted listener the Diggers Depot build (~/rrradio/installed/digger); they create a digger profile, and their notes, tracks and use of the radio appear here.</p>';return}
 m.innerHTML=`<h2>Diggers Depot · ${P.length}</h2>`+P.map((p,i)=>`<section class="fgp"><h3>${esc(p.who)} <span class="s">· last seen ${d(p.last)} · ${p.minutes} min listened · ${p.kinds.like||0} likes · ${p.kinds.skip||0} skips · ${p.bugs.length} notes · v${esc((p.versions||[]).join(', '))}</span></h3>
  ${p.bugs.length?`<h4>Notes and bugs</h4><table class="tbl"><tr><th>When</th><th>Where</th><th>What</th></tr>${p.bugs.slice(0,60).map(b=>`<tr><td class="s">${d(b.t)}</td><td class="s">${esc(b.el||'')}${b.ch?'<br>'+esc(b.ch):''}</td><td>${esc(b.txt||'')}${b.track&&b.track!==' — '?`<br><span class="s">while playing ${esc(b.track)}</span>`:''}</td></tr>`).join('')}</table>`:''}
  <h4>Liked tracks · ${p.liked.length}</h4>${p.liked.length?`<div class="btr"><button class="btn go" data-a="fg-want" data-i="${i}">Send all ${p.liked.length} to Downloads</button></div><table class="tbl"><tr><th>Track</th><th>Station</th><th>Signals</th></tr>${p.liked.slice(0,150).map(t=>`<tr><td><b>${esc(t.a)}</b> — ${esc(t.ti)}${t.v?` <a href="https://www.youtube.com/watch?v=${esc(t.v)}" target="_blank" rel="noopener">▶</a>`:''}</td><td class="s">${esc(t.st||'')}</td><td class="s">${esc(Object.entries(t.sig).map(([k,n])=>k+(n>1?' ×'+n:'')).join(', '))}</td></tr>`).join('')}</table>`:'<p class="s">No likes yet.</p>'}
  <h4>How they use it</h4><p class="s">${esc(Object.entries(p.kinds).map(([k,n])=>k+' '+n).join(' · '))}</p><p class="s">Most used: ${esc(p.clicks.map(([k,n])=>k+' ×'+n).join(' · ')||'-')}</p></section>`).join('');
 FOCUSP=P}
let FOCUSP=[];
document.addEventListener('click',async e=>{const a=e.target.closest('[data-a="fg-want"]');if(!a)return;const p=FOCUSP[+a.dataset.i];if(!p)return;
 const items=p.liked.map(t=>({a:t.a,t:t.ti,v:t.v,ch:t.st,kind:'love',stations:t.st?[t.st]:[]}));a.textContent='Sending…';
 try{const r=await fetch(C.base+'/api/admin/wanted',{method:'POST',headers:{'X-Key':C.key||KEYB,'Content-Type':'application/json'},body:JSON.stringify({items})}).then(r=>r.json());flash('Added '+(r.added||0)+' to Downloads (the rest were there already)');a.textContent='Sent'}catch(x){flash('Radio not reachable');a.textContent='Try again'}});

/* ---------------------------------------------------------------- review inbox (6.13.1) */
let REVF='open';const REVN={open:'Open',discuss:'To discuss',planned:'Planned',doing:'Claude is on it',check:'Ready to check',done:'Done',wontfix:"Won't fix"};
const REVC={open:'#f17938',discuss:'#e6b93a',planned:'#2fb0f0',doing:'#a78bfa',check:'#5eead4',done:'#25c08e',wontfix:'#8e8b86'};
async function revDraw(){const m=$('#main');m.innerHTML='<h2>Reviews</h2><p class="s">Loading…</p>';let j;try{j=await api('/api/admin/reviews')}catch(e){m.innerHTML='<h2>Reviews</h2><p>Cannot reach the radio.</p>';return}
 const R=j.reviews||[],cnt=s=>R.filter(r=>r.status===s).length,isOpen=r=>['open','discuss','planned','doing','check'].includes(r.status);let P={};try{P=await api('/api/admin/planned')}catch(e){}
 const L=R.filter(r=>REVF==='all'||(REVF==='open'?isOpen(r):r.status===REVF)),d=t=>t?new Date(t).toLocaleString():'-';
 const pill=s=>`<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;border:1px solid ${REVC[s]};color:${REVC[s]}">${REVN[s]||s}</span>`;
 m.innerHTML=`<h2>Reviews · ${R.filter(isOpen).length} open</h2>
 <p class="s">Every note in one place: yours (the Review mode in the radio, Alt+Shift+C) and the diggers' Review notes. Each one keeps its number. Claude closes a note with the version that fixed it and cites the number in reports. Your notes are discussed with you before a change.</p>
 ${plBox(P,cnt('planned'))}
 <div class="btr">${['open','check','discuss','planned','doing','done','wontfix','all'].map(f=>`<button class="btn${REVF===f?' go':''}" data-a="rev-f" data-f="${f}">${f==='all'?'All · '+R.length:(f==='open'?'Open · '+R.filter(isOpen).length:REVN[f]+' · '+cnt(f))}</button>`).join('')}</div>
 ${L.length?`<table class="tbl"><tr><th>№</th><th>Who · when</th><th>Where</th><th>What</th><th>Status</th></tr>${L.map(r=>`<tr>
  <td><code>${esc(r.id)}</code></td>
  <td><b>${esc(r.who)}</b><br><span class="s">${d(r.t)}<br>v${esc(r.ver||'?')}</span></td>
  <td class="s">${esc(r.st||'')}${r.view&&r.view!==r.st?' · '+esc(r.view):''}${r.el?'<br>'+esc(r.el):''}</td>
  <td>${r.vote==='keep'?'👍 ':r.vote==='change'?'👎 ':''}${esc(r.txt||'')}${r.a?`<br><span class="s">while playing ${esc(r.a)} — ${esc(r.ti||'')}${r.v?` <a href="https://www.youtube.com/watch?v=${esc(r.v)}" target="_blank" rel="noopener">▶</a>`:''}</span>`:''}</td>
  <td>${pill(r.status)}${r.status!=='open'&&(r.fix.ver||r.fix.note)?`<div class="s" style="margin-top:6px">${r.fix.ver?'in '+esc(r.fix.ver)+': ':''}${esc(r.fix.note||'')}${r.fix.by?' · '+esc(r.fix.by):''}</div>`:''}
   <div style="margin-top:6px"><select data-a="rev-s" data-id="${esc(r.id)}" data-ver="${esc(r.fix.ver||'')}" data-note="${esc(r.fix.note||'')}">${Object.keys(REVN).map(s=>`<option value="${s}"${s===r.status?' selected':''}>${REVN[s]}</option>`).join('')}</select></div></td></tr>`).join('')}</table>`:'<p class="s">Nothing here.</p>'}`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a="rev-f"]');if(!b)return;REVF=b.dataset.f;reviews()});
/* 17.11.2026: planned → Claude works them off (this button, or nightly at 03:30), then "Ready to check" or "To discuss" */
function plBox(P,n){const st=P.running?'working since '+new Date(P.started).toLocaleTimeString():P.state==='never'?'not run yet':P.state==='nothing'?'nothing was planned at the last check':P.state==='failed'?'last run failed '+new Date(P.finished||P.at).toLocaleString():'last run finished '+new Date(P.finished||P.at).toLocaleString();
 return`<div style="border:1px solid #2fb0f055;border-radius:14px;padding:14px 16px;margin:0 0 18px"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><b>Planned · ${n}</b><button class="btn go" data-a="pl-run"${P.running||!n?' disabled':''}>${P.running?'Claude is working…':'Do planned now'}</button><span class="s">Claude: ${esc(st)} · also every night at ${esc(P.nightly||'03:30')} (the Mac must be on)</span></div><p class="s" style="margin:8px 0 0">Mark a note <b>Planned</b> to approve it. Claude builds it and sets <b>Ready to check</b> (try it in the radio, then <b>Done</b>) or <b>To discuss</b> with a question. Nothing is published without you.</p>${P.log?`<details style="margin-top:8px"><summary class="s">Last run log</summary><pre style="white-space:pre-wrap;font-size:11px;max-height:320px;overflow:auto">${esc(P.log)}</pre></details>`:''}</div>`}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-a="pl-run"]');if(!b)return;b.disabled=true;try{const r=await api('/api/admin/planned/run',{method:'POST',body:'{}'});flash(r.already?'Claude is already working':'Claude started on the planned notes');setTimeout(reviews,1500)}catch(x){flash('Radio not reachable')}});
setInterval(()=>{try{if(typeof LEDG!=='undefined'&&LEDG==='reviews'&&document.querySelector('[data-a="pl-run"]')&&document.querySelector('[data-a="pl-run"]').disabled&&!document.querySelector('select:focus'))reviews()}catch(e){}},20000);
document.addEventListener('change',async e=>{const s=e.target.closest('[data-a="rev-s"]');if(!s)return;
 try{await api('/api/admin/review',{method:'POST',body:JSON.stringify({id:s.dataset.id,s:s.value,ver:s.dataset.ver,note:s.dataset.note,by:'anton'})});flash('Note '+s.dataset.id+': '+REVN[s.value]);reviews()}catch(x){flash('Radio not reachable')}});
/* ---------------------------------------------------------------- Listening (6.14.0): how the picks land, per station and level */
let LISD=7;const CHN={club:'Union Sq',clock:'State Library',fresh:'Arrivals',global:'Global Groove',cellar:'Powerhouse',tube:'Lakefield',taste:'Deepot',deep:'Deep'};
async function lisDraw(){const m=$('#main');let j;try{j=await api('/api/admin/listen?days='+LISD)}catch(e){m.innerHTML='<p>Cannot reach the radio.</p>';return}
 const pc=(a,b)=>b?Math.round(100*a/b)+'%':'–',R=j.rows||[];
 const col=(v,good,bad,lo)=>{const x=parseInt(v);if(isNaN(x))return v;const ok=lo?x<=good:x>=good,no=lo?x>=bad:x<=bad;return`<b style="color:${ok?'#25c08e':no?'#f17938':'inherit'}">${v}</b>`};
 m.innerHTML=`<h2>Listening · ${j.n} plays</h2><p class="s">Updated ${new Date().toLocaleTimeString()} · refreshes every 30 s while this page is open</p>
 <p class="s">Every track you hear in the admin build, how it ended. <b>Hits</b> = finished or loved. <b>Fast skips</b> = gone in the first 12 s. <b>Repeats</b> = the artist already played in the 30 tracks before on that station. <b>New</b> = an artist you had never played. Core should be mostly hits; Drift and Void mostly new.</p>
 <div class="btr">${[1,7,30].map(d=>`<button class="btn${LISD===d?' go':''}" data-a="lis-d" data-d="${d}">${d===1?'Today':d+' days'}</button>`).join('')}</div>
 ${R.length?`<table class="tbl"><tr><th>Station</th><th>Level</th><th>Plays</th><th>Hits</th><th>Fast skips</th><th>Flagged</th><th>Repeats</th><th>New</th><th>New that hit</th><th>Where picks came from</th><th>Skipped most</th></tr>${R.map(r=>`<tr${r.lv==='all'?' style="border-top:1px solid #ffffff33"':''}>
  <td>${r.lv==='all'?'<b>'+esc(CHN[r.st]||r.st)+'</b>':''}</td><td>${r.lv==='all'?'all':esc(r.lv)}</td><td>${r.plays}</td>
  <td>${col(pc(r.hit,r.plays),r.lv==='Core'?80:60,40)}</td><td>${col(pc(r.fast,r.plays),10,30,1)}</td><td>${pc(r.flag,r.plays)}</td>
  <td>${col(pc(r.rep,r.plays),5,15,1)}</td><td>${pc(r.new,r.plays)}</td><td>${pc(r.newhit,r.new)}</td>
  <td class="s">${Object.entries(r.src||{}).map(([k,n])=>esc(k)+' '+n).join(' · ')}</td><td class="s">${(r.top_skipped||[]).map(esc).join(', ')}</td></tr>`).join('')}</table>`:'<p class="s">No plays logged yet. They start with 6.14.0: listen a little and come back.</p>'}`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a="lis-d"]');if(!b)return;LISD=+b.dataset.d;reviews()});
setInterval(()=>{try{if(LEDG==='listen'&&document.visibilityState==='visible'&&document.querySelector('[data-a="lis-d"]'))reviews()}catch(e){}},30000);
/* ---------------------------------------------------------------- Ledger (6.13.2): everything the admin keeps track of, one page */
let LEDG='reviews',LEDJ=null;
const LEDT=[['reviews','Reviews'],['listen','Listening'],['diggers','Diggers'],['signals','My signals'],['changes','Changes'],['plans','Plans & notes'],['library','Library']];
const ledBar=()=>`<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:0 0 22px;padding-bottom:14px;border-bottom:1px solid #ffffff1c"><b style="margin-right:12px;letter-spacing:.08em;text-transform:uppercase;font-size:12px">Ledger</b>${LEDT.map(([k,n])=>`<button class="btn${LEDG===k?' go':''}" data-a="led" data-k="${k}">${n}</button>`).join('')}</div>`;
async function ledJ(force){if(!LEDJ||force)LEDJ=await api('/api/admin/ledger');return LEDJ}
const ledD=t=>t?new Date(t).toLocaleString():'-';
function md(t){const L=String(t||'').split('\n'),o=[];let i=0;const inl=x=>esc(x).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
 while(i<L.length){const l=L[i];
  if(/^#{1,6} /.test(l)){const n=Math.min(6,l.match(/^#+/)[0].length+1);o.push(`<h${n}>${inl(l.replace(/^#+ /,''))}</h${n}>`);i++;continue}
  if(/^\s*\|/.test(l)){const rows=[];while(i<L.length&&/^\s*\|/.test(L[i])){rows.push(L[i].trim());i++}const cells=r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());const body=rows.filter(r=>!/^\|[\s|:-]+\|$/.test(r));o.push('<table class="tbl">'+body.map((r,j)=>'<tr>'+cells(r).map(c=>j?`<td>${inl(c)}</td>`:`<th>${inl(c)}</th>`).join('')+'</tr>').join('')+'</table>');continue}
  if(/^\s*([-*]|\d+\.) /.test(l)){const it=[];while(i<L.length&&(/^\s*([-*]|\d+\.) /.test(L[i])||(/^\s{2,}\S/.test(L[i])&&it.length))){const x=L[i];if(/^\s*([-*]|\d+\.) /.test(x)){const ind=x.match(/^\s*/)[0].length;it.push(`<li style="margin-left:${ind*7}px">${inl(x.replace(/^\s*([-*]|\d+\.) /,''))}</li>`)}else it[it.length-1]=it[it.length-1].replace(/<\/li>$/,' '+inl(x.trim())+'</li>');i++}o.push('<ul style="padding-left:18px">'+it.join('')+'</ul>');continue}
  if(!l.trim()){i++;continue}
  o.push(`<p>${inl(l)}</p>`);i++}
 return o.join('')}
async function sigDraw(){const m=$('#main');const j=await api('/api/admin/focus');const p=(j.people||[]).find(x=>x.who==='anton');
 if(!p){m.innerHTML='<h2>My signals</h2><p class="s">Nothing from the admin build yet. It sends your log within a minute of opening the radio.</p>';return}
 const K=p.kinds,tag={like:'♥ like',unlike:'unlike',rate:'1–10',subgenre:'subgenre',note:'review note',role:'role'};
 m.innerHTML=`<h2>My signals</h2><p class="s">What you told the radio from the admin build, ${ledD(p.first)} → ${ledD(p.last)}: likes and unlikes, 1–10 ratings in the "To the radio" panel, subgenre switches, review notes. The radio learns from these; Claude reads them when tuning stations.</p>
 <div class="btr">${Object.entries(K).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<span class="btn">${esc(tag[k]||k)} · ${n}</span>`).join('')}</div>
 <h3>Tracks · ${p.tracks.length}</h3><table class="tbl"><tr><th>Track</th><th>Station</th><th>Signals</th><th>Last</th></tr>${p.tracks.slice(0,300).map(t=>`<tr><td><b>${esc(t.a)}</b> — ${esc(t.ti)}${t.v?` <a href="https://www.youtube.com/watch?v=${esc(t.v)}" target="_blank" rel="noopener">▶</a>`:''}</td><td class="s">${esc(t.st||'')}</td><td class="s">${esc(Object.entries(t.sig).map(([k,n])=>(tag[k]||k)+(n>1?' ×'+n:'')).join(', '))}</td><td class="s">${ledD(t.last)}</td></tr>`).join('')}</table>`}
async function chgDraw(){const m=$('#main');const [j,r]=await Promise.all([ledJ(1),api('/api/admin/reviews')]);const c=(j.docs||[]).find(x=>x.name==='CHANGELOG.md');const closed=(r.reviews||[]).filter(x=>x.status==='done'||x.status==='wontfix');
 m.innerHTML=`<h2>Changes</h2><p class="s">Every build: what changed, why, and which review notes it closed. Claude writes it after each build.</p>${closed.length?`<h3>Closed notes · ${closed.length}</h3><table class="tbl"><tr><th>№</th><th>Note</th><th>Closed</th></tr>${closed.map(x=>`<tr><td><code>${esc(x.id)}</code></td><td><b>${esc(x.who)}</b>: ${esc(x.txt||'')}</td><td class="s">${REVN[x.status]}${x.fix.ver?' in '+esc(x.fix.ver):''}${x.fix.note?': '+esc(x.fix.note):''}</td></tr>`).join('')}</table>`:''}${c?md(c.text):'<p class="s">No CHANGELOG.md yet.</p>'}`}
async function planDraw(){const m=$('#main');const j=await ledJ(1);const D=(j.docs||[]).filter(x=>x.name!=='CHANGELOG.md');
 const say={'NOTES.md':'Ideas on the side, to discuss before building','ROADMAP.md':'The line: what comes when','HANDOFF-2026-11-13.md':'Rules, state and priorities handed between sessions','docs/EQ-ROADMAP.md':'EQ button and the sound filter (premium)','BRAND.md':'Name, logo and copy rules'};
 m.innerHTML=`<h2>Plans & notes</h2><p class="s">The documents we keep in the project, read live from the Mac. Newest change first.</p>${D.sort((a,b)=>b.mtime-a.mtime).map((x,i)=>`<details ${i<1?'open':''} style="border-top:1px solid #ffffff1c;padding:12px 0"><summary style="cursor:pointer"><b>${esc(x.name)}</b> <span class="s">· ${esc(say[x.name]||(x.name.startsWith('docs/sound-review')?'Sound review of a station':''))} · updated ${ledD(x.mtime)}</span></summary><div style="margin-top:10px;max-width:900px">${md(x.text)}</div></details>`).join('')}`}
async function libDraw(){const m=$('#main');const j=await ledJ(1);const sh=j.shelves||[];
 m.innerHTML=`<h2>Library</h2><p class="s">The radio's own music on this Mac: ${j.tracks} tracks. A file moved into a station's shelf in Finder plays there within a minute; folders starting with _ are aside. Telegram bot: ${j.tgbot?'running':'<b>not running</b>'}.</p>
 <h3>On air per station</h3><table class="tbl"><tr>${Object.keys(j.on_air).map(k=>`<th>${esc(k)}</th>`).join('')}</tr><tr>${Object.values(j.on_air).map(v=>`<td>${v}</td>`).join('')}</tr></table>
 <h3>Shelves · ~/Music/irradiation-dig</h3><table class="tbl"><tr><th>Folder</th><th>Files</th><th></th></tr>${sh.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${s.files}</td><td class="s">${s.station?'station shelf':s.aside?'aside, not on air from here':''}</td></tr>`).join('')}</table>
 ${(j.off_air||[]).length?`<h3>In the library but off air · ${j.off_air.length}</h3><table class="tbl">${j.off_air.map(t=>`<tr><td><b>${esc(t.a)}</b> — ${esc(t.t)}</td><td class="s">${esc((t.path||'').split('/').slice(-2,-1)[0]||'')}</td></tr>`).join('')}</table>`:''}
 ${(j.scans||[]).map(sc=>`<h3>Sound scan · ${esc(j.names[sc.station]||sc.station)} · ${sc.n} tracks, ${sc.low.length} below 60</h3><table class="tbl"><tr><th>Fit</th><th>Track</th><th>Why</th></tr>${sc.low.map(r=>`<tr><td>${r.fit}</td><td><b>${esc(r.a)}</b> — ${esc(r.t)}</td><td class="s">${esc((r.why||[]).join('; '))}</td></tr>`).join('')}</table>`).join('')}`}
async function reviews(){const m=$('#main');
 try{if(LEDG==='reviews')await revDraw();else if(LEDG==='listen')await lisDraw();else if(LEDG==='diggers')await focus();else if(LEDG==='signals')await sigDraw();else if(LEDG==='changes')await chgDraw();else if(LEDG==='plans')await planDraw();else await libDraw()}catch(e){m.innerHTML='<h2>Ledger</h2><p>Cannot reach the radio: '+esc(String(e&&e.message||e))+'</p>'}
 m.insertAdjacentHTML('afterbegin',ledBar())}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a="led"]');if(!b)return;LEDG=b.dataset.k;reviews()});

const RMAP=[{"h": "Done", "items": [{"t": "Live radio: 7 stations from your Mac, streamed out through a Cloudflare tunnel.", "d": false}, {"t": "Landing: 9 languages, regional prices, legal pages, the 71 logo and the ring net. https://antonalter.github.io/rrradio/", "d": false}, {"t": "Extension 6.2.0: station visuals and the Lemon Squeezy license check, ready once the store id is in.", "d": false}, {"t": "Live player on the site.", "d": false}]}, {"h": "Day 0 · today (Anton, about 1 hour)", "items": [{"t": "Lemon Squeezy, with the project Gmail.", "d": false}, {"t": "Create the store and turn on payouts and tax details.", "d": false}, {"t": "Create the products, each with license keys on: Deepot monthly, yearly, lifetime, founding.", "d": false}, {"t": "Send me the store id and the 4 checkout links. I put them into config and the extension and push.", "d": false}, {"t": "Short-video accounts, same Gmail: TikTok, Instagram, YouTube channel, all named @rrradio. Send me the handles.", "d": false}, {"t": "Domain rrrad.io: buy it when you can. It gives a permanent stream address, not a tunnel that dies on restart.", "d": false}]}, {"h": "Day 1 · first sales", "items": [{"t": "3 shorts a day, 15–25 s, vertical.", "d": false}, {"t": "Hook: \"the radio you can't skip\".", "d": false}, {"t": "Night metro POV, doors open, a station name on the board, 8 seconds of music.", "d": false}, {"t": "Then a hard cut to the ring logo and \"next stop in 3 min\".", "d": false}, {"t": "Caption: \"7 stations. no skip. no algorithm. rrrad.io\".", "d": false}, {"t": "One station per video. Pinned comment: free live link and Deepot founding price.", "d": false}, {"t": "Reply to every comment within the first hour.", "d": false}]}, {"h": "Week 1", "items": [{"t": "Shorts from the player: a script records the player screen for each station and adds the station card and the hook.", "d": false}, {"t": "You approve each one before posting.", "d": false}, {"t": "Music in the videos: platform-licensed sounds, or tracks whose rights are clear. Never post the station audio raw.", "d": false}, {"t": "Measure: visits → plays over 5 min → founding purchases. Stop what doesn't convert.", "d": false}]}, {"h": "Week 2 · Telegram", "items": [{"t": "A bot that posts \"now on air\" to the @rrradio channel with the station card and a listen link.", "d": false}, {"t": "The live player opens inside Telegram as a Mini App.", "d": false}, {"t": "You create the bot in BotFather and give me the token.", "d": false}]}, {"h": "Month 1 · branch lines (premium)", "items": [{"t": "Dance Union Square's branch first: Jack's, Dungeon, Silvercity.", "d": false}, {"t": "The Arrivals board for new releases.", "d": false}, {"t": "Drift routes.", "d": false}]}, {"h": "Month 2 · the city gets people", "items": [{"t": "The Curated / Personal switch, rooms with characters and chat.", "d": false}]}, {"h": "Month 3 · Guilty karaoke", "items": [{"t": "After the rights check. This is the viral piece.", "d": false}]}, {"h": "Keep it free and alive", "items": [{"t": "Mac always on, tunnel monitored.", "d": false}, {"t": "Then a named tunnel or a small server once rrrad.io is bought.", "d": false}, {"t": "Costs stay at zero until 30 Deepot subscribers.", "d": false}]}, {"h": "Next step (noted 2026-11-10, not scheduled)", "items": [{"t": "Bedroom DJ rooms. Premium supporters open their own room on rrradio, style it and themselves as DJ or host, record mixes there; the room also holds a selection from premium supporters. DJs show their rrradio room on thei", "d": false}]}, {"h": "Planned · radio without the Mac (2026-11-10)", "items": [{"t": "Move the live radio to Oracle Cloud Always Free (ARM VM, same server.py + a named Cloudflare tunnel, permanent address). Anton registers the account and card himself; Claude prepares the setup script.", "d": false}, {"t": "Later, optional: MP3s in Cloudflare R2 + a schedule from the Worker, so no server is needed at all.", "d": false}]}, {"h": "Diggers Depot · barter programme (2026-11-10)", "items": [{"t": "Who: a real audience of 1,000+ followers on at least one platform (Instagram, TikTok, YouTube, Telegram, SoundCloud, Mixcloud, Bandcamp, a newsletter or a regular radio show). Plus a small quota (about 1 seat in 10) for ", "d": false}, {"t": "How many: a limited number of seats per month, so it stays special. Seats are personal and not transferable.", "d": false}, {"t": "For how long: 3 months, renewed when the deal is kept.", "d": false}, {"t": "What they give:", "d": false}, {"t": "at least 5 notes a month through Review: bugs, ideas, what is unclear;", "d": false}, {"t": "one honest public mention a month (a post, a story or a short video with their room or mixtape and a link). They say what they really think and mark it as a barter or gifted access, as the law requires;", "d": false}, {"t": "using it for real, at least weekly.", "d": false}, {"t": "What they get: everything open, their own room with crates and a personal broadcast, first access to new branch lines, their name in the credits.", "d": false}, {"t": "Data: creating the digger profile means agreeing that their notes, likes, room and usage go to Anton. Deleted on request. Nothing is sold, ever.", "d": false}, {"t": "End: if the deal is not kept for a month, access returns to the free version. Their room stays exportable.", "d": false}, {"t": "Never: paid fake reviews, required praise, hidden ads.", "d": false}]}];
/* ---------------------------------------------------------------- overview: the whole project on one page */
(()=>{const c=document.createElement('style');c.textContent=`.ov-k{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:14px 0 22px}.ov-k div{padding:14px 14px 12px;border:1px solid #ffffff1c;border-radius:12px}.ov-k b{display:block;font-size:26px;line-height:1.1;font-weight:700}.ov-k span{display:block;margin-top:4px;font-size:12px;opacity:.65}.ov-k a{color:inherit}.ov-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px}.ov-g section{min-width:0}.ov-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;vertical-align:1px;background:#777}.ov-dot.ok{background:#3fae6a}.ov-dot.bad{background:#c8423a}.ov-dot.mid{background:#e6b93a}.ov-bar{height:6px;border-radius:3px;background:#e6b93a;opacity:.8}.ov-map{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin:10px 0}.ov-map div{padding:10px 12px;border-radius:10px;background:#ffffff0a;font-size:13px}.ov-map b{display:block;margin-bottom:3px}.ov-rm details{border-top:1px solid #ffffff14;padding:8px 0}.ov-rm summary{cursor:pointer;font-weight:600}.ov-rm li{margin:4px 0;font-size:13px}.ov-rm li.d{opacity:.45;text-decoration:line-through}`;document.head.appendChild(c)})();
async function ovw(){const m=$('#main');m.innerHTML='<h2>Overview</h2><p class="s">Reading the radio, the extension and the shop…</p>';
 const st=S||{},lib=st.library||[],inbox=(st.inbox||[]).filter(i=>i.ok).length,want=(st.wanted||[]).filter(i=>i.status==='wanted').length,names=st.stations||{},now=st.now||{};
 const per={};lib.forEach(t=>(t.stations||[]).forEach(k=>per[k]=(per[k]||0)+1));const maxPer=Math.max(1,...Object.values(per));
 const [loc,where,focus,ver,orders]=await Promise.all([
  chrome.storage.local.get(['rvlog','rep','reports','radar']).catch(()=>({})),
  fetch('https://rrradio-radio.rrradio.workers.dev/_where',{cache:'no-store'}).then(r=>r.json()).catch(()=>null),
  S?api('/api/admin/focus').catch(()=>null):null,
  fetch(HB+'/versions',{headers:{'X-Key':HK()}}).then(r=>r.json()).catch(()=>null),
  C.ls?ls(`orders?filter[store_id]=${C.store}&page[size]=100&sort=-createdAt`).catch(()=>null):null]);
 const L=loc.rvlog||[],notes=L.filter(r=>r.kind==='note'&&r.vote!=='keep'),flags=loc.rep||[],crashes=loc.reports||[],rad=(loc.radar&&loc.radar.items)||[];
 const ppl=(focus&&focus.people)||[],d30=Date.now()-30*864e5,od=((orders&&orders.data)||[]).filter(x=>!x.attributes.test_mode),o30=od.filter(x=>Date.parse(x.attributes.created_at)>d30),eur=a=>(a.reduce((n,x)=>n+(x.attributes.total||0),0)/100).toFixed(0);
 const listeners=Object.values(now).reduce((n,s)=>n+((s&&s.listeners)||0),0);
 const k=(v,t,href)=>`<div><b>${href?`<a href="${href}" data-t2="${href}">${v}</a>`:v}</b><span>${t}</span></div>`;
 const dot=(ok,t)=>`<span class="ov-dot ${ok===1?'ok':ok===0?'bad':'mid'}"></span>${t}`;
 const ago=t=>{if(!t)return'-';const m=(Date.now()-t)/6e4;return m<60?Math.round(m)+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
 m.innerHTML=`<h2>Overview</h2><p class="s">rrradio on one page: the radio, the listeners, the shop, the work in progress. Read live ${new Date().toLocaleString()}.</p>
 <div class="ov-k">${k(lib.length,'tracks on air','#air')}${k(inbox,'waiting for review','#review')}${k(want,'wanted, to download','#dl')}${k(listeners,'listening right now')}${k(ppl.length,'Diggers'+(ppl[0]?' · last '+ago(Date.parse(ppl[0].last)):''),'#focus')}${C.ls?k('€'+eur(o30),o30.length+' orders, 30 days','#sales'):k('—','sales: add the Lemon Squeezy key','#set')}${k(notes.length,'review notes to act on','#rep')}${k(crashes.length,'crashes logged','#rep')}${k(rad.length,'new releases on the radar')}</div>
 <div class="ov-g">
 <section><h3>Stations</h3><table class="tbl"><tr><th>Station</th><th>Tracks</th><th>On air now</th></tr>${Object.keys(names).map(s=>{const n=now[s]&&now[s].now;return`<tr><td><b>${esc(names[s])}</b><div class="ov-bar" style="width:${Math.round((per[s]||0)/maxPer*100)}%"></div></td><td>${per[s]||0}</td><td class="s">${n?esc(n.artist+' — '+n.title):'off air'}${now[s]&&now[s].listeners?` · ${now[s].listeners} listening`:''}</td></tr>`}).join('')||'<tr><td colspan=3 class="s">The radio is not connected.</td></tr>'}</table></section>
 <section><h3>System</h3><table class="tbl">
  <tr><td>${dot(S?1:0,'Radio on the Mac')}</td><td class="s">${S?esc(C.base):'not reachable'}</td></tr>
  <tr><td>${dot(where&&where.url?1:0,'Public address')}</td><td class="s">${where&&where.url?`rrradio-radio.rrradio.workers.dev → ${esc(where.url.replace('https://',''))}`:'tunnel down'}</td></tr>
  <tr><td>${dot(where&&where.url?1:0,'Telegram mini app')}</td><td class="s"><a href="https://rrradio-radio.rrradio.workers.dev/tg/" target="_blank" rel="noopener">/tg/</a></td></tr>
  <tr><td>${dot(2,'Landing rrrad.io')}</td><td class="s">not deployed yet</td></tr>
  <tr><td>${dot(ver?1:2,'Builds')}</td><td class="s">${ver?`admin ${esc(ver.installed.owner||'-')} · public ${esc(ver.installed.public||'-')}`:'helper off'} · this desk ${esc(chrome.runtime.getManifest().version)}</td></tr>
  <tr><td>${dot(C.ls?1:2,'Shop (Lemon Squeezy)')}</td><td class="s">${C.ls?od.length+' orders in total':'key not set'}</td></tr>
 </table></section>
 <section><h3>Release radar</h3>${rad.length?`<table class="tbl">${rad.slice(0,10).map(r=>`<tr><td><b>${esc(r.a)}</b> — ${esc(r.al)}</td><td class="s">${esc(r.ty||'')} · ${esc(r.d)}</td></tr>`).join('')}</table>`:'<p class="s">Fills in the background while the radio runs: new records by your own artists (Spotify when connected).</p>'}</section>
 <section><h3>What listeners and you said</h3>${notes.length||flags.length?`<table class="tbl">${notes.slice(-5).reverse().map(r=>`<tr><td class="s">${new Date(r.t).toLocaleDateString()}</td><td>${esc(r.comment||'(change)')}<br><span class="s">${esc(r.el||'')}</span></td></tr>`).join('')}${flags.slice(-5).reverse().map(r=>`<tr><td class="s">${new Date(r.t).toLocaleDateString()}</td><td>${esc((r.a||'')+' — '+(r.k||''))}<br><span class="s">${r.bug?'bug: '+esc(r.bug+(r.txt?' · '+r.txt:'')):r.to?'belongs on '+esc(r.to):''}</span></td></tr>`).join('')}</table>`:'<p class="s">Nothing yet.</p>'}
  ${ppl.length?`<h3 style="margin-top:18px">Diggers</h3><table class="tbl">${ppl.slice(0,6).map(p=>`<tr><td><b>${esc(p.who)}</b></td><td class="s">${p.minutes} min · ${p.kinds.like||0} likes · ${p.bugs.length} notes · ${ago(Date.parse(p.last))}</td></tr>`).join('')}</table>`:''}</section>
 </div>
 <h3 style="margin-top:26px">How it fits together</h3><div class="ov-map">
  <div><b>Extension · three builds</b>Admin (this desk, review, ClipGrab), public, Diggers Depot. Each YouTube tab belongs to one build.</div>
  <div><b>Stations</b>Arrivals (release radar), Library, Global Groove, Union Sq, Powerhouse, Lakefield, Deepot. Frames per track, guests between rooms.</div>
  <div><b>Picks → the radio</b>Likes and moves go to the radio on the Mac with station and time of day; the desk reviews and downloads them.</div>
  <div><b>Radio on the Mac</b>One shared live stream per station, port 8800, inbox → library → on air.</div>
  <div><b>Public address</b>Cloudflare tunnel, announced to a fixed workers.dev address; the landing player and Telegram use it.</div>
  <div><b>Money</b>Lemon Squeezy: Deepot keys (start, year, life, founding). Diggers Depot: barter, signals for access.</div>
 </div>
 <h3 style="margin-top:22px">Roadmap</h3><div class="ov-rm">${RMAP.map((s,i)=>`<details${i<3?' open':''}><summary>${esc(s.h)} <span class="s">· ${s.items.filter(x=>x.d).length}/${s.items.length}</span></summary><ul>${s.items.map(x=>`<li class="${x.d?'d':''}">${esc(x.t)}</li>`).join('')}</ul></details>`).join('')}</div>`;
 m.querySelectorAll('[data-t2]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();tab=a.dataset.t2.slice(1);draw()}))}
tab='ovw';
