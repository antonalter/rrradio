const esc=t=>String(t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const ic=(p,v='0 0 24 24')=>`<svg viewBox="${v}" aria-hidden="true">${p}</svg>`;
const I={play:ic('<path d="M7 4.5v15l13-7.5z"/>'),pause:ic('<path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/>'),next:ic('<path d="M5 4.5v15L15 12zM16 4.5h3v15h-3z"/>'),prev:ic('<path d="M19 4.5v15L9 12zM5 4.5h3v15H5z"/>'),heart:ic('<path d="M12 21S3 15.2 3 8.8C3 6 5.2 4 7.7 4c1.8 0 3.3 1 4.3 2.6C13 5 14.500 4 16.300 4 18.800 4 21 6 21 8.800 21 15.200 12 21 12 21z"/>'),
 x:ic('<path d="M5.700 4.300 12 10.600l6.300-6.300 1.400 1.400L13.400 12l6.300 6.300-1.400 1.400L12 13.400l-6.300 6.300-1.400-1.400L10.600 12 4.300 5.700z"/>'),plus:ic('<path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/>'),flag:ic('<path d="M6 3h2v18H6zM9 4h10l-3 4 3 4H9z"/>'),list:ic('<path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z"/>'),info:ic('<path d="M11 10h2v8h-2zM11 6h2v2h-2z"/><path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"/>'),moon:ic('<path d="M12 3a9 9 0 1 0 9 9c-5 1-10-4-9-9z"/>'),eye:ic('<path fill-rule="evenodd" d="M12 5C7 5 3 9 1.500 12 3 15 7 19 12 19s9-4 10.500-7C21 9 17 5 12 5zm0 3.500a3.500 3.500 0 1 1 0 7 3.500 3.500 0 0 1 0-7z"/>'),q:ic('<path d="M11 16h2v2h-2zM12 5c-2.500 0-4 1.500-4 3.700h2c0-1.200.700-1.900 2-1.900s2 .700 2 1.700c0 2-3 2.200-3 5.500h2c0-2.300 3-2.700 3-5.600C16 6.500 14.400 5 12 5z"/>'),gear:ic('<path d="M4 7h10.200a3 3 0 0 1 5.600 0H20v2h-.2a3 3 0 0 1-5.600 0H4zM4 15h.2a3 3 0 0 1 5.600 0H20v2H9.800a3 3 0 0 1-5.600 0H4z"/>'),vibe:ic('<path d="M3 8c3-3 5-3 9 0s6 3 9 0v3c-3 3-5 3-9 0s-6-3-9 0zM3 14c3-3 5-3 9 0s6 3 9 0v3c-3 3-5 3-9 0s-6-3-9 0z"/>'),cur:ic('<path d="M4 2v18l5-5 3.500 7 3-1.500L12 14h7z"/>'),trail:ic('<path d="M5 21a2.500 2.500 0 1 1 0-5 2.500 2.500 0 0 1 0 5zm7-7a2.500 2.500 0 1 1 0-5 2.500 2.500 0 0 1 0 5zm7-6a2.500 2.500 0 1 1 0-5 2.500 2.500 0 0 1 0 5zM6.200 16.800l4.200-3.600 1.300 1.500-4.200 3.600zm7-5.500 4.200-3.600 1.300 1.500-4.200 3.600z"/>')};

/* rrradio live player: the extension's look, none of its controls you can't have on a radio */
const BASE = ((window.IRR && IRR.radio) || "").replace(/\/$/, "");
const KEYS = ["fresh", "clock", "global", "club", "cellar", "tube", "taste"];
const SHORT = { fresh: "Arrivals", clock: "Library", global: "GGB", club: "Union Sq", cellar: "Powerhouse", tube: "Lakefield", taste: "Deepot" };
const HUE = [200, 265, 320, 20], clamp = (v, a, b) => Math.max(a, Math.min(b, v)), logErr = e => console.warn("rrradio", e);
const keep = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v) } catch { } };
const S = { ch: KEYS.includes(keep("rr-ch")) ? keep("rr-ch") : "taste", layer: 1, vz: keep("rr-vz") === "0" ? 0 : 1, day: keep("rr-day") === "1" ? 1 : 0, vi: 1, hue: 40, hueT: null, bass: 0, mid: 0, high: 0, flux: 0, en: 0, z: 0, A: null, P: null, trT: 0, cs: 300, mvT: 0, mvD: 1, on: false };
const au = new Audio(); au.crossOrigin = "anonymous"; au.preload = "none";
const H = { p: { paused: () => au.paused } };
const R = document.createElement("div"); R.id = "rr";
R.innerHTML = `<div id=stage><canvas id=gl></canvas><canvas id=ov></canvas><canvas id=cov></canvas><div id=sweep></div><div class=rrl aria-hidden=true><div class=rrt>${"<i>r</i>".repeat(56)}</div></div></div>
<header class=rail><button id=logo title="About rrradio">rrradio</button><nav id=chs aria-label="Stations"><i id=chi></i>${KEYS.map((k, i) => `<button data-c=${k}><sup>${i + 1}</sup><span class=sn>${SHORT[k]}</span><span class=fn>${SHORT[k]}</span></button>`).join("")}</nav>
<div class=tools><button class=ib id=tvp title="Station visuals on or off (V)">${I.eye}</button><button class=ib id=tdy title="Day or night">${I.moon}</button><button class=ib id=thp title="About and listen anywhere">${I.q}</button></div></header>
<div class=ch-m>${KEYS.map(k => `<button data-c=${k}>${SHORT[k]}</button>`).join("")}</div>
<div id=toast role=status></div>
<aside id=qp aria-label="Coming up"><header><span class=m>Coming up</span><button class=ib id=qx title="Hide">${I.x}</button></header><div id=ql></div></aside>
<footer id=dock><div class=now><div class=tw><h1 id=ttl>rrradio</h1></div><div class=sub><button id=art></button><span id=why class=m>Live radio</span></div></div>
<div id=seek aria-label="Track position"><span id=t1>0:00</span><div id=sb><i></i></div><span id=t2>0:00</span></div>
<div class=ctl><div class=cl><span class="m live"><i></i><b id=lv>Live</b></span></div>
<div class=ce><button id=pp class=paused title="Listen or pause (Space)"><span class=pl>${I.play}</span><span class=pa>${I.pause}</span></button></div>
<div class="cl cr"><input type=range id=vl min=0 max=100 aria-label=Volume><span class=qi><button class=ib id=inb title="About rrradio">${I.info}</button><button class=ib id=qb title="Coming up (Q)">${I.list}</button></span></div></div></footer>
<section id=info aria-label="About rrradio"><button class=ib id=ix title="Close (Esc)">${I.x}</button><div id=inm>Just the feed.</div><div id=ibio>One stream for everyone, chosen by hand and timed to the hour. You can't skip, and that is the point. No ads, no accounts, no tracking.</div><div id=ilong></div></section>
<div id=gate><i class=pulse></i><h2>Listen</h2><p>live radio · press space or click anywhere</p><div class=rrl aria-hidden=true><div class=rrt>${"<i>r</i>".repeat(56)}</div></div></div>`;
document.body.append(R);
const $ = s => R.querySelector(s), $$ = s => [...R.querySelectorAll(s)];
const fm = t => isFinite(t) && t > 0 ? (t / 60 | 0) + ":" + ("0" + (t % 60 | 0)).slice(-2) : "0:00";

/* irradiation 6 — visuals. Everything draws inside #stage, never behind the controls.
   Slow fields only: no scan flicker, no glitch slices, no strobing bands. */
const VZ=(()=>{let W=10,H_=10,AN=null,fd=new Uint8Array(128),fp=new Uint8Array(128),td=new Uint8Array(256);
const col=(h,s,l,a)=>`hsla(${h},${s}%,${l}%,${a})`;
let glc,ovc,ovx,cvc,cvx,gl,P1,P2,fb=[],tx=[],cur=0,U1={},U2={},tex=new WeakMap(),blank,sTex,ok=false,kick=0,FOC=[0,0];const spD=new Uint8Array(64),HIST=[];let hf=0;
const VS='#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}';
const FS1=`#version 300 es
precision highp float;uniform sampler2D uA,uP,uF,uS;uniform vec2 uR;uniform float uT,uTr,uK,uD,uMv,uMs,uDir;uniform vec3 uHc;uniform float uSd,uEc;uniform int uVar;uniform vec4 uAu;out vec4 o;
vec2 mir(vec2 u){return 1.-abs(1.-mod(u,2.));}
float hsh(float n){return fract(sin(n*91.73)*43758.55);}
float spec(float x){return texture(uS,vec2(clamp(x,0.,1.),.5)).r;}
float lumT(sampler2D s,vec2 u){return dot(texture(s,mir(u)).rgb,vec3(.3,.59,.11));}
void main(){float asp=uR.x/uR.y;vec2 uv0=gl_FragCoord.xy/uR,p=(gl_FragCoord.xy-.5*uR)/uR.y;float bass=uAu.x,mid=uAu.y,t=uT,r=length(p);
 vec2 w=p+.055*vec2(sin(p.y*2.6+t*.13)+.5*sin(p.y*6.1-t*.09),cos(p.x*2.4-t*.11)+.5*cos(p.x*5.3+t*.07))*(1.+mid*.5);
 w*=1.-.05*uD-.015*bass;w.x+=uDir*uMs*1.6;vec2 uv=w/max(asp,1.)+.5;
 float R=uTr*1.7,trm=uTr>=.999?1.:1.-smoothstep(R-.2,R+.2,r);
 vec3 soft=mix(textureLod(uP,mir(uv),6.).rgb,textureLod(uA,mir(uv),6.).rgb,trm);soft=mix(soft,uHc*(.25+dot(soft,vec3(.33))*1.5),.6);vec3 col=soft*(.42+.2*bass);float ln=0.,sp=spec(uv0.x);
 if(uVar==1){float N=46.,Ls=uR.y/N,y=gl_FragCoord.y,k0=floor(y/Ls),best=0.;
  for(int j=-4;j<=4;j++){float k=k0+float(j),yk=(k+.5)*Ls,py=(yk-.5*uR.y)/uR.y;vec2 u2=vec2(uv.x,py/max(asp,1.)+.5);float lum=mix(lumT(uP,u2),lumT(uA,u2),trm),d=(lum-.32)*Ls*(2.+7.*sp*(.5+bass+mid));best=max(best,smoothstep(1.5,.2,abs(y-(yk+d)))*(.3+.7*lum));}
  ln=best*.8;col*=.34;}
 if(uVar==2){float L2=mix(lumT(uP,uv),lumT(uA,uv),trm),q=L2*6.+t*.035+sp*.5,c=1.-abs(fract(q)-.5)*2.;ln=smoothstep(.9,1.,c)*(.4+.6*L2)*.8;col*=.4;}
 if(uVar==4){float rw=floor(p.y*(12.+floor(uSd*10.))),band=exp(-pow((fract(p.y*16.)-.5)*7.,2.)),run=smoothstep(.55,1.,fract(p.x*.45+hsh(rw)-t*.035*(.4+hsh(rw+3.))*(1.+uAu.z*3.)));ln=band*run*(.35+.65*spec(hsh(rw)))*(.7+uAu.w*1.6+uAu.z*.8);col*=.36;}
 if(uVar==5){float L5=mix(lumT(uP,uv),lumT(uA,uv),trm);vec2 c5=vec2(.3+uSd*.25,.05+sin(t*.05)*.1),f5=vec2(30.+uSd*20.)*(1.+bass*.18);float q5=sin(length(p-c5)*f5.x-t*.35*(1.+mid))*sin(length(p+c5)*f5.y+t*.27);ln=smoothstep(.8-uAu.w*.25,1.,q5)*(.3+.7*L5)*(.6+bass*.9);col*=.42;}
 if(uVar==6){float L6=mix(lumT(uP,uv),lumT(uA,uv),trm),q6=sin(p.y*(40.+uSd*16.)+sin(p.x*2.6+t*.25)*2.4*(1.+mid*1.4)-t*.45*(1.+bass));ln=smoothstep(.75,1.,q6)*(.25+.5*L6)*smoothstep(.45,-.1,p.y)*(.7+bass*.8);col*=.52;}
 if(uVar==7){vec2 q7=uv;for(int i=0;i<3;i++)q7+=.035*vec2(sin(q7.y*5.+t*.05*(1.+mid*2.)+uSd*9.),cos(q7.x*4.-t*.04+uSd*5.))*(1.+mid*1.2);vec3 ik=mix(textureLod(uP,mir(q7),2.4).rgb,textureLod(uA,mir(q7),2.4).rgb,trm);float L7=dot(ik,vec3(.33));col=mix(col,mix(ik,uHc*(.25+L7*1.5),.4)*(.5+bass*.45),.72);ln=smoothstep(.96,1.,1.-abs(fract(L7*3.+t*.012)-.5)*2.)*.35;}
 col+=soft*ln*.6+vec3(ln)*.5;
 {float kn=floor(2.+uSd*5.),ca=cos(t*.01+uSd*6.),sa=sin(t*.01+uSd*6.);vec2 kp=mat2(ca,-sa,sa,ca)*p;float ka=atan(kp.y,kp.x),kr=length(kp)*(.7+uSd*.7)*(1.-bass*.06);ka=mod(ka,6.2832/kn);ka=abs(ka-3.1416/kn);vec2 ku=vec2(cos(ka),sin(ka))*kr+.5+vec2(sin(t*.02),cos(t*.017))*.08;
  vec3 ec=mix(textureLod(uP,mir(ku),3.).rgb,textureLod(uA,mir(ku),3.).rgb,trm);col+=mix(ec,uHc*dot(ec,vec3(.4)),.45)*uEc*(.24+.32*bass+.18*uAu.w);}
 col*=1.+bass*.22;
 float spd=pow(hsh(floor(gl_FragCoord.y/uR.y*70.)),9.)*(.6+.4*sin(p.x*4.-uT*30.*uDir));col+=(soft*1.6+.06)*spd*uMv*.9;
 float ring=exp(-pow((r-uK*1.1)*9.,2.))*(1.-uK)*step(.001,uK);col+=(soft*1.6+.15)*ring*.55;
 float tr=exp(-pow((r-R)*7.,2.))*sin(3.14159*uTr);col+=(soft*1.4+.08)*tr*.5;
 vec2 f=(uv0-.5)*(1.-.0018*(.5+bass))+.5;col=mix(col,max(col,texture(uF,f).rgb*.93),.82);
 o=vec4(clamp(col,0.,1.),1.);}`;
const FS2=`#version 300 es
precision highp float;uniform sampler2D uF;uniform vec2 uR;uniform float uDay;out vec4 o;
void main(){vec2 uv=gl_FragCoord.xy/uR;vec3 c=texture(uF,uv).rgb;c=pow(c,vec3(1.1));if(uDay>.5){float l=dot(c,vec3(.33));c=mix(vec3(.91,.9,.87),vec3(.07,.07,.1)+(c-l)*.7,clamp(l*1.7,0.,1.));}o=vec4(c,1.);}`;
function initGL(){try{gl=glc.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'low-power'});if(!gl)return;
 const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x};
 const pg=f=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p};
 P1=pg(FS1);P2=pg(FS2);blank=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,blank);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([8,8,12,255]));par(0);
 sTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,sTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,64,1,0,gl.RED,gl.UNSIGNED_BYTE,spD);par(0);ok=true}catch(e){ok=false;logErr(e.message||e)}}
const par=m=>{gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,m?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)};
const mk=(w,h)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);par(0);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);return[f,t]};
const T=ob=>{if(!ob?.o)return blank;let t=tex.get(ob);if(!t){t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,ob.o);gl.generateMipmap(gl.TEXTURE_2D);par(1);tex.set(ob,t)}return t};
const u=(p,U,n)=>U[n]||(U[n]=gl.getUniformLocation(p,n));
function glDraw(t,now){const w=Math.max(2,W*.5|0),h=Math.max(2,H_*.5|0);if(glc.width!==w||glc.height!==h){glc.width=w;glc.height=h;for(let i=0;i<2;i++){if(fb[i]){gl.deleteFramebuffer(fb[i]);gl.deleteTexture(tx[i])}[fb[i],tx[i]]=mk(w,h)}}
 for(let i=0;i<64;i++){const b=Math.min(127,Math.floor(Math.pow(i/63,1.7)*100)+1);spD[i]=Math.min(255,spc(b)*255*S.vi)}if(++hf%5===0){HIST.push(Float32Array.from(spD,v=>v/255));if(HIST.length>34)HIST.shift()}
 const hasP=S.P&&S.P!==S.A,p=hasP?clamp((now-S.trT)/3600,0,1):1;kick=kick>0?Math.min(1,kick+.018):0;if(kick>=1)kick=0;
 gl.viewport(0,0,w,h);const nx=1-cur;gl.bindFramebuffer(gl.FRAMEBUFFER,fb[nx]);gl.useProgram(P1);
 [[T(S.A),'uA'],[T(hasP?S.P:S.A),'uP'],[tx[cur],'uF']].forEach(([x,n],i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,x);gl.uniform1i(u(P1,U1,n),i)});
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,sTex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,64,1,gl.RED,gl.UNSIGNED_BYTE,spD);gl.uniform1i(u(P1,U1,'uS'),3);
 gl.uniform2f(u(P1,U1,'uR'),w,h);gl.uniform1f(u(P1,U1,'uT'),t);gl.uniform1f(u(P1,U1,'uTr'),p);gl.uniform1f(u(P1,U1,'uK'),kick);gl.uniform1f(u(P1,U1,'uD'),S.layer);const sv=SV[S.ch]??3,mv=S.mvT?clamp((now-S.mvT)/1700,0,1):1,ms=mv*mv*(3-2*mv);if(S.A!==lastA){lastA=S.A;S.sd=Math.random()}gl.uniform1f(u(P1,U1,'uSd'),S.sd||0);gl.uniform1f(u(P1,U1,'uEc'),SE[S.ch]??.5);gl.uniform1i(u(P1,U1,'uVar'),sv);{const hc=hsl2rgb(S.hue/360,.62,.55);gl.uniform3f(u(P1,U1,'uHc'),hc[0],hc[1],hc[2])}gl.uniform1f(u(P1,U1,'uMv'),mv<1?Math.sin(Math.PI*mv):0);gl.uniform1f(u(P1,U1,'uMs'),mv<1?ms:0);gl.uniform1f(u(P1,U1,'uDir'),S.mvD||1);gl.uniform4f(u(P1,U1,'uAu'),S.bass*S.vi,S.mid*S.vi,S.high*S.vi,S.flux*S.vi);
 gl.drawArrays(gl.TRIANGLES,0,3);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(P2);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tx[nx]);gl.uniform1i(u(P2,U2,'uF'),0);gl.uniform2f(u(P2,U2,'uR'),w,h);gl.uniform1f(u(P2,U2,'uDay'),S.day?1:0);gl.drawArrays(gl.TRIANGLES,0,3);cur=nx}
function ridges(){const n=HIST.length;if(n<2)return;const z=ovx,d=S.day,bw=Math.min(W*.74,H_*1.5),x0=W/2-bw/2,top=H_*.16,bot=H_*.9,amp=H_*.13;z.lineWidth=1.1;z.lineJoin='round';
 for(let j=0;j<n;j++){const yb=top+j/(n-1)*(bot-top),pts=[];for(let i=0;i<64;i++){const e=Math.exp(-Math.pow((i/63-.5)*3.3,2));pts.push([x0+i/63*bw,yb-HIST[j][i]*e*amp*(.7+S.bass*.5)])}
  z.beginPath();pts.forEach((q,i)=>i?z.lineTo(q[0],q[1]):z.moveTo(q[0],q[1]));z.lineTo(x0+bw,yb+3);z.lineTo(x0,yb+3);z.closePath();z.fillStyle=d?'rgba(233,230,223,.92)':'rgba(8,8,10,.9)';z.fill();
  z.beginPath();pts.forEach((q,i)=>i?z.lineTo(q[0],q[1]):z.moveTo(q[0],q[1]));z.strokeStyle=d?'rgba(10,10,16,.85)':`hsla(${S.hue},30%,88%,.8)`;z.stroke()}}
function clockDraw(cx,cy,r0){const n=new Date(),h=n.getHours(),m=n.getMinutes(),s=n.getSeconds()+n.getMilliseconds()/1e3,d=S.day,c=(a)=>d?`rgba(12,12,18,${a})`:`rgba(242,239,233,${a})`,z=ovx;z.save();z.translate(cx,cy);z.lineCap='round';
 for(let i=0;i<60;i++){const an=i/60*6.2832-1.5708,big=i%5==0,a=r0*(big?.93:.965);z.strokeStyle=c(big?.8:.28);z.lineWidth=big?2:1;z.beginPath();z.moveTo(Math.cos(an)*a,Math.sin(an)*a);z.lineTo(Math.cos(an)*r0,Math.sin(an)*r0);z.stroke()}
 const hand=(g,len,w)=>{const an=g*6.2832-1.5708;z.strokeStyle=c(.95);z.lineWidth=w;z.beginPath();z.moveTo(0,0);z.lineTo(Math.cos(an)*len,Math.sin(an)*len);z.stroke()};
 hand((h%12+m/60)/12,r0*.6,4);hand((m+s/60)/60,r0*.86,2.5);hand(s/60,r0*.94,1);z.restore()}
/* every station has its own field and colour; the cover only nudges the colour */
const hsl2rgb=(h,s,l)=>{const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);return l-a*Math.max(-1,Math.min(k-3,9-k,1))};return[f(0),f(8),f(4)]};
const SE={fresh:.45,clock:.6,global:.7,club:.35,cellar:.4,tube:.8,taste:.9};let lastA=null;
const SV={fresh:4,clock:7,global:5,club:0,cellar:1,tube:6,taste:3},STH={fresh:192,clock:152,global:36,club:318,cellar:96,tube:18,taste:40};
const MOTES=Array.from({length:70},(_,i)=>[Math.random(),Math.random(),.3+Math.random(),Math.random()*6.28]);
function dust(t){const z=ovx;for(const m of MOTES){const x=((m[0]+t*.004*m[2])%1)*W,y=((m[1]-t*.006*m[2]+1)%1)*H_,a=.18+.22*Math.sin(t*.7+m[3]);z.fillStyle=`hsla(${S.hue},70%,80%,${a*(.6+S.mid)})`;z.beginPath();z.arc(x,y,.6+m[2]*1.3,0,7);z.fill()}}
const spc=k=>AN?fd[Math.min(127,k)]/255:(.25+.2*Math.sin(k*.9+performance.now()/900)+.15*Math.sin(k*.31-performance.now()/1400))*(.55+S.bass);
function lv(){let b=0,m=0,h=0,fl=0,ce=0,sm=0;if(AN){AN.getByteFrequencyData(fd);for(let i=1;i<128;i++){const v=fd[i];if(i<6)b+=v;else if(i<40)m+=v;else if(i<100)h+=v;fl+=Math.max(0,v-fp[i]);ce+=i*v;sm+=v;fp[i]=v}b/=1275;m/=8670;h/=15300;fl/=3900;ce=sm?ce/sm/128:0;S.z=b+m+h<.001?S.z+1:0}
 if(!AN||S.z>90){const t=performance.now()/1e3;b=.3+.2*Math.max(0,Math.sin(t*2.4));m=.3+.12*Math.sin(t*.9);h=.2+.08*Math.sin(t*1.3);fl=.15;ce=.4}
 if(H.p.paused()){b=m=h=fl=0}S.bass+=(b-S.bass)*.18;S.mid+=(m-S.mid)*.18;S.high+=(h-S.high)*.18;S.flux+=(Math.min(1,fl)-S.flux)*.2;S.en+=((S.bass*.5+S.mid*.3+S.high*.2)-S.en)*.03}
function cover(now){const q=S.cs,N=cvc.width;cvx.clearRect(0,0,N,N);const a=S.P||S.A,b=S.A;if(!b)return;const m=(N-q)/2,p=(now-S.trT)/1400;
 cvx.save();cvx.shadowColor='rgba(0,0,0,.55)';cvx.shadowBlur=40;cvx.shadowOffsetY=18;cvx.fillStyle='#000';cvx.fillRect(m,m,q,q);cvx.restore();
 const s=1+S.bass*.006;cvx.save();cvx.translate(N/2,N/2);cvx.scale(s,s);cvx.translate(-N/2,-N/2);if(p>=1)cvx.drawImage(b.o,m,m,q,q);else{const e=p*p*(3-2*p);if(a)cvx.drawImage(a.o,m,m,q,q);cvx.globalAlpha=e;cvx.drawImage(b.o,m,m,q,q);cvx.globalAlpha=1}cvx.restore()}
function resize(){const r=$('#stage').getBoundingClientRect();W=r.width|0;H_=r.height|0;ovc.width=W;ovc.height=H_;S.cs=Math.round(Math.min(H_*.62,W*.42));const N=S.cs+120;cvc.width=cvc.height=N;cvc.style.width=cvc.style.height=N+'px'}
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;const t=now/1e3;lv();
 const sh=(STH[S.ch]??HUE[S.layer])+S.layer*6,target=S.hueT==null?sh:sh+((((S.hueT-sh)+540)%360)-180)*.22;let dh=((target-S.hue+540)%360)-180;S.hue=(S.hue+dh*.025+360)%360;R.style.setProperty('--a',S.day?`hsl(${S.hue},55%,30%)`:`hsl(${S.hue},70%,72%)`);R.style.setProperty('--a2',`hsl(${(S.hue+40)%360},60%,${S.day?36:64}%)`);
 ovx.clearRect(0,0,W,H_);
 if(S.vz&&ok){glc.style.display='';try{glDraw(t,now);if(SV[S.ch]===0)ridges();if(S.ch==='taste')dust(t)}catch(e){ok=false;logErr(e.message)}}else glc.style.display='none';
 if(S.ch==='clock'&&S.vz)clockDraw(W/2,H_/2,S.cs*.74);
 cover(now)}
return{init(){glc=$('#gl');ovc=$('#ov');ovx=ovc.getContext('2d');cvc=$('#cov');cvx=cvc.getContext('2d');initGL();resize();new ResizeObserver(resize).observe($('#stage'));requestAnimationFrame(frame)},
 attach(an){AN=an},kick(){kick=.02},
 prep(im){if(!im)return null;const o=document.createElement('canvas');o.width=o.height=512;const w0=im.naturalWidth||im.width,h0=im.naturalHeight||im.height,z=Math.min(w0,h0);o.getContext('2d').drawImage(im,(w0-z)/2,(h0-z)/2,z,z,0,0,512,512);return{o}},
 tint(a){if(!a){S.hueT=null;return}try{const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(a.o,0,0,24,24);const d=g.getImageData(0,0,24,24).data;let sx=0,sy=0;for(let i=0;i<d.length;i+=4){const r=d[i]/255,gr=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,gr,b),mn=Math.min(r,gr,b),de=mx-mn;if(de<.12)continue;let h=mx===r?((gr-b)/de)%6:mx===gr?(b-r)/de+2:(r-gr)/de+4;h*=1.0472;sx+=Math.cos(h)*de;sy+=Math.sin(h)*de}S.hueT=Math.hypot(sx,sy)>1?((Math.atan2(sy,sx)*57.2958)+360)%360:null}catch{S.hueT=null}}}})();

/* ============================================================ state from the radio */
let data = null, lastNow = "", an = null, actx = null, tT = 0, idle = 0, swT = 0;
const station = () => data?.stations.find(s => s.id === S.ch) || data?.stations[0];
function flash(s) { const t = $("#toast"); t.textContent = s; t.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("on"), 1800) }
function wake() { R.classList.remove("idle"); clearTimeout(idle); idle = setTimeout(() => { if (S.on && !$$("#qp.on,#info.on").length) R.classList.add("idle") }, 4500) }
function sweep(w) { const e = $("#sweep"); e.textContent = w; e.style.fontSize = Math.min(19, 92 / (w.length * .66)) + "vw"; e.classList.remove("fly"); void e.offsetWidth; e.classList.add("fly"); VZ.kick(); clearTimeout(swT); swT = setTimeout(() => e.classList.remove("fly"), 1300) }
async function poll() {
  try { data = await fetch(BASE + "/api/stations", { cache: "no-store" }).then(r => r.json()) } catch { $("#lv").textContent = "Off air"; R.classList.add("offair"); return }
  R.classList.remove("offair"); if (!data.stations.some(s => s.id === S.ch)) S.ch = data.stations[0].id;
  $$("[data-c]").forEach(b => { const s = data.stations.find(x => x.id === b.dataset.c); if (!s) { b.hidden = true; return } b.title = s.name; const f = b.querySelector(".fn"); if (f) f.textContent = s.name });
  render() }
function coverFor(n) {
  return new Promise(res => {
    if (n.cover) { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => res(blankCover(n)); im.src = `${BASE}/api/cover/${n.id}` } else res(blankCover(n)) }) }
function blankCover(n) { /* no artwork: the artist's name, set in the house type */
  const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d"); x.fillStyle = "#121216"; x.fillRect(0, 0, 512, 512);
  x.fillStyle = `hsl(${S.hue},60%,72%)`; let fs = 120; x.font = `800 ${fs}px 'Roboto Flex', Arial, sans-serif`; const w = (n.artist || "rrradio").split(" ");
  while (fs > 30 && Math.max(...w.map(s => x.measureText(s).width)) > 440) { fs -= 6; x.font = `800 ${fs}px 'Roboto Flex', Arial, sans-serif` }
  w.forEach((s, i) => x.fillText(s, 36, 80 + fs + i * fs * .92)); return c }
async function render() {
  const s = station(); if (!s) return;
  $$("[data-c]").forEach(e => e.classList.toggle("on", e.dataset.c === S.ch)); const chip = $(`#chs [data-c=${S.ch}]`), chi = $("#chi"); if (chip) { chi.style.left = chip.offsetLeft + "px"; chi.style.width = chip.offsetWidth + "px" }
  const n = s.now || {}; $("#ttl").textContent = n.title || s.name; $("#art").textContent = n.artist || ""; $("#why").textContent = `${s.name} · live${s.listeners ? " · " + s.listeners + " listening" : ""}`;
  $("#ql").innerHTML = (s.next || []).map(q => `<div class=qi2><b>${esc(q.title)}</b><span>${esc(q.artist)}</span></div>`).join("") || `<p class=m>Picked live, track by track.</p>`;
  const key = S.ch + ":" + (n.id || ""); if (key === lastNow) return; lastNow = key;
  const im = await coverFor(n); if (lastNow !== key) return; const a = VZ.prep(im); S.P = S.A || a; S.A = a; S.trT = performance.now(); VZ.tint(a);
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: n.title || s.name, artist: n.artist || "rrradio", album: "rrradio · " + s.name, artwork: n.cover ? [{ src: `${BASE}/api/cover/${n.id}`, sizes: "512x512" }] : [{ src: "icon.png", sizes: "512x512" }] }) }
function tick() { /* the bar only shows where the track is; a radio can't be scrubbed */
  const n = station()?.now; if (!n || !n.dur) return; const el = clamp(Date.now() / 1000 - n.started, 0, n.dur);
  $("#t1").textContent = fm(el); $("#t2").textContent = fm(n.dur); $("#sb i").style.width = (el / n.dur * 100).toFixed(2) + "%";
  if (el >= n.dur - .5) poll() }

/* ============================================================ listening */
function audioGraph() { if (actx) return; try { actx = new (window.AudioContext || window.webkitAudioContext)(); const src = actx.createMediaElementSource(au); an = actx.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = .7; src.connect(an); an.connect(actx.destination); VZ.attach(an) } catch (e) { logErr(e) } }
function listen() { const s = station(); if (!s) return; au.src = `${BASE}/stream/${s.id}.mp3?t=${Date.now()}`; audioGraph(); actx?.resume(); au.play().catch(() => { }); S.on = true; $("#gate").classList.add("off"); $("#pp").classList.add("wait"); wake() }
function stop() { au.pause(); au.removeAttribute("src"); au.load(); S.on = false; $("#pp").classList.add("paused"); R.classList.remove("idle") }
au.addEventListener("playing", () => { const p = $("#pp"); p.classList.remove("paused", "wait"); $("#lv").textContent = "Live" });
let retry = 0; const recover = () => { if (!S.on) return; $("#pp").classList.add("wait"); setTimeout(() => S.on && listen(), Math.min(8000, 1000 * ++retry)) };
au.addEventListener("error", recover); au.addEventListener("ended", recover);
function setC(c) { if (c === S.ch) return; S.mvD = KEYS.indexOf(c) >= KEYS.indexOf(S.ch) ? 1 : -1; S.mvT = performance.now(); S.ch = c; keep("rr-ch", c); sweep(station()?.name || SHORT[c]); render(); if (S.on) listen() }
au.volume = (+(keep("rr-vol") ?? 80)) / 100; $("#vl").value = Math.round(au.volume * 100); $("#vl").oninput = e => { au.volume = e.target.value / 100; keep("rr-vol", e.target.value) };

/* ============================================================ wiring */
function panel(id, on) { $(id).classList.toggle("on", on ?? !$(id).classList.contains("on")) }
function infoFill() { const L = $("#ilong"), ss = data?.stations || []; L.innerHTML = `<p class=m>Listen anywhere</p><p>Open a station in any player app or smart speaker:</p><ul>${ss.map(s => `<li><a href="${BASE}/listen/${s.id}.m3u">${esc(s.name)}</a></li>`).join("")}</ul><p class=m>The personal version</p><p>The browser extension learns your taste, follows threads between artists, and lets you skip, love and dig deeper.</p><p><a class="bt on" href="${data?.extension ? BASE + data.extension : "downloads/rrradio-extension.zip"}">Get the extension</a></p>` }
R.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.c) setC(b.dataset.c) });
$("#gate").addEventListener("click", listen);
$("#pp").addEventListener("click", () => S.on ? stop() : listen());
$("#qb").addEventListener("click", () => panel("#qp")); $("#qx").addEventListener("click", () => panel("#qp", false));
["#inb", "#thp", "#logo"].forEach(id => $(id).addEventListener("click", () => { infoFill(); panel("#info", true) })); $("#ix").addEventListener("click", () => panel("#info", false));
$("#tvp").addEventListener("click", () => { S.vz = S.vz ? 0 : 1; keep("rr-vz", S.vz); $("#tvp").classList.toggle("on", !!S.vz); flash(S.vz ? "Station visuals on" : "Visuals off") });
$("#tdy").addEventListener("click", () => { S.day = S.day ? 0 : 1; keep("rr-day", S.day); R.classList.toggle("day", !!S.day) });
addEventListener("keydown", e => { if (e.target.closest("input")) return; const k = e.key;
  if (k === " ") { e.preventDefault(); S.on ? stop() : listen() } else if (/^[1-7]$/.test(k)) setC(KEYS[+k - 1]); else if (k === "v") $("#tvp").click(); else if (k === "q") panel("#qp"); else if (k === "Escape") { panel("#info", false); panel("#qp", false) } wake() });
addEventListener("pointermove", wake);
R.classList.toggle("day", !!S.day); $("#tvp").classList.toggle("on", !!S.vz);
VZ.init(); poll(); setInterval(poll, 10000); setInterval(tick, 500); addEventListener("resize", () => render());
