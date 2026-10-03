
(()=>{
'use strict';
const W=320,H=180,T=16,MW=80,MH=60;
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function R(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);}
function h2(x,y,s=0){let n=(x*374761393+y*668265263+s*1442695041)|0;n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967295;}

/* ================= MAP ================= */
const G=0,ROAD=1,SIDE=2,SAND=3,WATER=4,BLD=5,DOCK=6,TREE=7,HOUSE=8,DOOR=9,FLOW=10,PATH=11,ORLA=12,FENCE=13,LAPA=14,ARCH=15,MORRO=16,FAVELA=17,ESTADIO=18,CIRCO=19;
const SOLID=new Set([WATER,BLD,TREE,HOUSE,FENCE,ARCH,MORRO,FAVELA,ESTADIO,CIRCO]);
const XB=[[0,6],[11,26],[31,46],[51,66],[71,79]],YB=[[0,6],[11,20],[25,34]];
const map=new Uint8Array(MW*MH), lotMap=new Int16Array(MW*MH).fill(-1);
const idx=(x,y)=>y*MW+x;
const tileAt=(x,y)=>(x<0||y<0||x>=MW||y>=MH)?WATER:map[idx(x,y)];
const HROADS=[8,22,36],VROADS=[8,28,48,68],ORLA_Y=41;
const DOORT={x:38,y:28};
const HOME={x:DOORT.x*T+8,y:DOORT.y*T+12};
const lots=[];
const ROOFS=['#9b6a55','#6e7f96','#a08f6c','#7f6c93','#5e8b7b','#b07a5a','#8a8f98'];
// o mapa vem do Tiled: mapa/mapa.tmj (edite lá e exporte com Ctrl+E, que regrava mapa/mapa.js)
function buildMap(){
  map.fill(G);lotMap.fill(-1);lots.length=0;
  const M=window.TileMaps&&window.TileMaps.mapa;if(!M){alert('Faltou o arquivo do mapa: fonte/mapa/mapa.js');return;}
  const camada=n=>M.layers.find(l=>l.name===n);
  const chao=camada('chao'); // camada de tiles: cada tile do cidade.png é um tipo de chão (grama, rua, calçada...)
  for(let y=0;y<Math.min(MH,chao.height);y++)for(let x=0;x<Math.min(MW,chao.width);x++){const t=(chao.data[y*chao.width+x]&0x1fffffff)-1;map[idx(x,y)]=t>=0&&t<=CIRCO?t:G;}
  const cor=(v,padrao)=>v?'#'+v.slice(-6):padrao; // o Tiled grava cor como #AARRGGBB
  // camada de objetos: cada retângulo é um prédio; classe loja/bar/sinuca/predio, nome = letreiro
  for(const o of (camada('estabelecimentos')||{objects:[]}).objects){
    const p={};for(const q of o.properties||[])p[q.name]=q.value;
    const x0=Math.round(o.x/T),y0=Math.round(o.y/T),x1=Math.round((o.x+o.width)/T)-1,y1=Math.round((o.y+o.height)/T)-1;if(x1<x0||y1<y0)continue;
    const tipo=o.type||o.class||'predio',bar=tipo==='bar'||tipo==='sinuca',id=lots.length;
    const L={x0,x1,y0,y1,bar,kind:tipo==='sinuca'?'sinuca':'cabeca',samba:!!p.samba,col:cor(p.cor_telhado,ROOFS[id%ROOFS.length]),tank:!!p.caixa_dagua};
    if(tipo==='loja'&&o.name){const fundo=cor(p.cor_letreiro,'#2f6e52');L.loja=o.name.toUpperCase();L.letreiro=[L.loja,fundo,cor(p.cor_letra,'#ffffff'),cor(p.cor_toldo,fundo)];}
    lots.push(L);
    for(let y=Math.max(0,y0);y<=Math.min(MH-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(MW-1,x1);x++){map[idx(x,y)]=BLD;lotMap[idx(x,y)]=id;}
  }
  // tile de prédio pintado sem retângulo em cima: vira um prédio sem loja
  for(let i=0;i<MW*MH;i++){if(map[i]!==BLD||lotMap[i]>=0)continue;
    const id=lots.length,pilha=[i],cel=[];lotMap[i]=id;
    while(pilha.length){const j=pilha.pop();cel.push(j);const x=j%MW,y=(j-x)/MW;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const k=idx(nx,ny);if(map[k]===BLD&&lotMap[k]<0){lotMap[k]=id;pilha.push(k);}}}
    const xs=cel.map(j=>j%MW),ys=cel.map(j=>Math.floor(j/MW));
    lots.push({x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),bar:false,samba:false,col:ROOFS[id%ROOFS.length],tank:false});}
}

/* ============ pixel glyphs for signs ============ */
const GL={B:['110','101','110','101','110'],A:['010','101','111','101','101'],R:['110','101','110','101','101'],L:['100','100','100','100','111'],
  T:['111','010','010','010','010'],I:['111','010','010','010','111'],N:['110','101','101','101','101'],H:['101','101','111','101','101'],O:['010','101','101','101','010'],C:['011','100','100','100','011'],P:['110','101','110','100','100'],S:['011','100','010','001','110'],U:['101','101','101','101','111'],F:['111','100','110','100','100'],E:['111','100','110','100','111'],M:['101','111','111','101','101'],D:['110','101','101','101','110'],G:['011','100','101','101','011'],V:['101','101','101','101','010'],K:['101','101','110','101','101'],J:['001','001','001','101','010'],Q:['010','101','101','110','011'],W:['101','101','111','111','101'],X:['101','101','010','101','101'],Y:['101','101','010','010','010'],Z:['111','001','010','100','111']};
function pxText(c,s,x,y,col){c.fillStyle=col;for(let i=0;i<s.length;i++){const g=GL[s[i]];if(!g)continue;for(let r=0;r<5;r++)for(let k=0;k<3;k++)if(g[r][k]==='1')c.fillRect(x+i*4+k,y+r,1,1);}}

/* ============ background pre-render ============ */
const bg=document.createElement('canvas');bg.width=MW*T;bg.height=MH*T;const bgc=bg.getContext('2d');
function speck(c,X,Y,n,cols,s){for(let i=0;i<n;i++){c.fillStyle=cols[i%cols.length];c.fillRect(X+Math.floor(h2(X,Y,s+i)*15),Y+Math.floor(h2(Y,X,s+i*3)*15),1,1);}}
function grass(c,X,Y){R(c,X,Y,T,T,'#4e9a47');speck(c,X,Y,7,['#438a3d','#5fae52','#3f833a'],1);}
function drawTile(c,x,y){
  const X=x*T,Y=y*T,t=map[idx(x,y)];
  switch(t){
  case G:grass(c,X,Y);break;
  case FLOW:grass(c,X,Y);for(let i=0;i<3;i++){const fx=X+2+Math.floor(h2(x,y,20+i)*12),fy=Y+2+Math.floor(h2(y,x,30+i)*12);R(c,fx,fy,1,1,pick(['#ffe066','#ff7eb6','#ffffff']));R(c,fx,fy+1,1,1,'#2f6b2b');}break;
  case ROAD:{R(c,X,Y,T,T,'#3a3d48');speck(c,X,Y,5,['#444857','#33353f'],2);
    if((HROADS.includes(y)||y===ORLA_Y)&&!VROADS.includes(x)&&!VROADS.includes(x-1)&&x%2===0)R(c,X+3,Y+15,10,2,'#e8c547');
    const inH=HROADS.includes(y)||HROADS.includes(y-1)||y===ORLA_Y||y===ORLA_Y+1;
    if(VROADS.includes(x)&&!inH&&y%2===0)R(c,X+15,Y+3,2,10,'#e8c547');break;}
  case SIDE:R(c,X,Y,T,T,'#b8b1a3');R(c,X,Y,T,1,'#a39c8e');R(c,X,Y,1,T,'#a39c8e');R(c,X,Y+8,T,1,'#aca597');R(c,X+8,Y,1,8,'#aca597');R(c,X+4,Y+8,1,8,'#aca597');break;
  case ORLA:R(c,X,Y,T,T,'#efe9dc');for(let p=0;p<T;p++){const wy=Y+6+Math.round(Math.sin(((X+p)/12)*Math.PI)*3);R(c,X+p,wy,1,4,'#232329');}break;
  case ESTADIO:R(c,X,Y,T,T,'#b8b1a3');R(c,X,Y,T,1,'#a39c8e');R(c,X,Y,1,T,'#a39c8e');R(c,X,Y+8,T,1,'#aca597');R(c,X+8,Y,1,8,'#aca597');R(c,X+4,Y+8,1,8,'#aca597');break; // embaixo do desenho oval do estádio
  case LAPA:case ARCH:case CIRCO:R(c,X,Y,T,T,'#8f8275');for(let r=0;r<4;r++)for(let k=0;k<4;k++){const ox=(r%2)*2;R(c,X+k*4+ox,Y+r*4,3,3,h2(x*4+k,y*4+r,12)>.5?'#a39585':'#978a7c');}break;
  case SAND:R(c,X,Y,T,T,'#e8d193');speck(c,X,Y,6,['#d9bf7c','#f3e2ad'],4);break;
  case WATER:R(c,X,Y,T,T,'#2a6fa8');speck(c,X,Y,4,['#2f7cb8','#2765a0'],5);if(tileAt(x,y-1)===SAND){for(let p=0;p<T;p++){const wy=Y+Math.round(1+Math.sin((X+p)/5)*1.5);R(c,X+p,Y,1,wy-Y+1,'#e9f4ff');}}break;
  case DOCK:{const under=y>=50?'#2a6fa8':'#e8d193';R(c,X,Y,T,T,under);R(c,X,Y,T,T,'#8b5a2e');for(let r=0;r<4;r++)R(c,X,Y+r*4+3,T,1,'#6d4322');R(c,X+2,Y+1,1,1,'#c9a07a');R(c,X+13,Y+9,1,1,'#c9a07a');if(x===5)R(c,X,Y,1,T,'#5a371b');if(x===8)R(c,X+15,Y,1,T,'#5a371b');break;}
  case MORRO:R(c,X,Y,T,T,'#3f7a3a');speck(c,X,Y,9,['#2f6a2e','#4f8a45','#5a9a4a','#2a5a2a'],13);break;
  case FAVELA:{R(c,X,Y,T,T,'#6a5040');const cols=['#c2703a','#e0a060','#f0e0c0','#7aa0c8','#d88a8a','#b8c070','#e8d8a0'];
    for(let k=0;k<2;k++){const hx=X+k*8,hy=Y+(k?3:0),col=cols[Math.floor(h2(x*2+k,y,21)*cols.length)];R(c,hx,hy,8,9,col);R(c,hx,hy,8,2,'#8a8a8a');R(c,hx+2,hy+4,2,2,'#2a1a10');R(c,hx+5,hy+4,2,3,'#2a1a10');if(h2(x,y*2+k,22)>.6)R(c,hx+4,hy-1,3,2,'#2f6fbd');}
    R(c,X,Y+13,T,3,'#5a4030');break;}
  case TREE:if(h2(x,y,23)<.5){grass(c,X,Y);drawPalmTop(c,X+8,Y+7);break;}grass(c,X,Y);R(c,X+7,Y+10,2,5,'#6b4423');c.fillStyle='#2f6e32';c.beginPath();c.arc(X+8,Y+7,7,0,Math.PI*2);c.fill();c.fillStyle='#3f8a3e';c.beginPath();c.arc(X+6,Y+5,3.5,0,Math.PI*2);c.fill();R(c,X+4,Y+13,8,1,'rgba(0,0,0,.2)');break;
  case FENCE:grass(c,X,Y);{const hor=tileAt(x-1,y)===FENCE||tileAt(x+1,y)===FENCE;const ver=tileAt(x,y-1)===FENCE||tileAt(x,y+1)===FENCE;
    if(hor){R(c,X,Y+7,T,1,'#f4f1e8');R(c,X,Y+11,T,1,'#f4f1e8');for(let p=1;p<T;p+=4)R(c,X+p,Y+5,2,9,'#f4f1e8');}
    if(ver){R(c,X+7,Y,1,T,'#f4f1e8');R(c,X+9,Y,1,T,'#f4f1e8');for(let p=1;p<T;p+=4)R(c,X+6,Y+p,5,2,'#f4f1e8');}}break;
  case PATH:R(c,X,Y,T,T,'#c9b48a');for(let r=0;r<4;r++)for(let k=0;k<2;k++)R(c,X+k*8+(r%2)*4,Y+r*4,1,4,'#b39c70');for(let r=0;r<4;r++)R(c,X,Y+r*4,T,1,'#b39c70');break;
  case HOUSE:case DOOR:{const below=tileAt(x,y+1);const roof=(below===HOUSE||below===DOOR);
    if(roof){R(c,X,Y,T,T,'#c2452f');for(let r=0;r<4;r++)R(c,X,Y+r*4+3,T,1,'#a3372a');for(let r=0;r<4;r++)for(let k=0;k<4;k++)R(c,X+k*4+(r%2)*2,Y+r*4,1,3,'#a3372a');if(tileAt(x,y-1)!==HOUSE)R(c,X,Y,T,2,'#8e2a1f');if(x===40&&y===26){R(c,X+4,Y-6,5,9,'#8a8f98');R(c,X+4,Y-6,5,1,'#5c6068');}}
    else{R(c,X,Y,T,T,'#f0e3c4');R(c,X,Y,T,2,'#8e2a1f');R(c,X,Y+15,T,1,'#bba57a');
      if(t===DOOR){R(c,X+4,Y+4,8,12,'#7a4a24');R(c,X+5,Y+5,6,10,'#8f5a2e');R(c,X+9,Y+10,1,1,'#ffd54a');R(c,X+6,Y+2,4,1,'#ffd54a');}
      else{R(c,X+4,Y+5,8,7,'#5b8fc9');R(c,X+4,Y+5,8,1,'#3b3b3b');R(c,X+7,Y+5,1,7,'#f0e3c4');R(c,X+4,Y+8,8,1,'#f0e3c4');R(c,X+3,Y+12,10,1,'#d05050');}}
    break;}
  case BLD:{const id=lotMap[idx(x,y)],L=lots[id];R(c,X,Y,T,T,L.col);speck(c,X,Y,4,['rgba(0,0,0,.12)','rgba(255,255,255,.08)'],6);
    if(y===L.y0)R(c,X,Y,T,2,'rgba(255,255,255,.18)');if(x===L.x0)R(c,X,Y,1,T,'rgba(0,0,0,.25)');if(x===L.x1)R(c,X+15,Y,1,T,'rgba(0,0,0,.25)');
    if(y===L.y1){const wall='#d8cdb6';R(c,X,Y+8,T,8,wall);R(c,X,Y+8,T,1,'rgba(0,0,0,.35)');
      if((L.bar||L.samba)&&x===Math.floor((L.x0+L.x1)/2)){R(c,X+1,Y+9,T-2,7,L.samba?'#2a1236':'#3a1d12');R(c,X+4,Y+11,8,5,'#1a0e08');}
      else{R(c,X+3,Y+10,4,4,'#5b8fc9');R(c,X+9,Y+10,4,4,'#5b8fc9');R(c,X+3,Y+10,4,1,'#3c4a5c');R(c,X+9,Y+10,4,1,'#3c4a5c');}}
    else if(h2(x,y,11)<.12){R(c,X+4,Y+5,5,4,'#9aa2ad');R(c,X+5,Y+6,3,2,'#6d737c');}
    break;}
  }
}
function drawEstadio(c,x0,y0,w,h){ // Maracanã visto de cima: anel de concreto, arquibancada lotada e o gramado
  const cx=x0+w/2,cy=y0+h/2+2;const ell=(rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);c.fill();};
  ell(w/2-2,h/2-3,'#c9ccd2');ell(w/2-6,h/2-7,'#8c96a6');
  const cols=['#e84a4a','#f4f1e8','#2d6fd1','#ffe14f','#2f9a55','#1d1d22','#ff8a3d'];
  for(let yy=y0;yy<y0+h;yy+=3)for(let xx=x0;xx<x0+w;xx+=3){const dx=(xx-cx)/(w/2-8),dy=(yy-cy)/(h/2-9),r=dx*dx+dy*dy;if(r<1&&r>.42&&h2(xx,yy,5)>.25)R(c,xx,yy,2,2,cols[Math.floor(h2(xx,yy,9)*7)%7]);}
  ell(w*.29,h*.25,'#2f8a3a');for(let i=-3;i<=3;i+=2){c.fillStyle='#349a41';c.fillRect(cx+i*w*.04,cy-h*.2,w*.04,h*.4);}
  c.strokeStyle='rgba(240,248,236,.85)';c.lineWidth=1;c.strokeRect(Math.round(cx-w*.22)+.5,Math.round(cy-h*.17)+.5,Math.round(w*.44),Math.round(h*.34));
  c.beginPath();c.moveTo(Math.round(cx)+.5,cy-h*.17);c.lineTo(Math.round(cx)+.5,cy+h*.17);c.stroke();c.beginPath();c.arc(cx,cy,h*.07,0,Math.PI*2);c.stroke();
  }
// fachada de loja: 1º andar com janelas, marquise, letreiro, toldo e térreo com vitrine e porta
const PAREDES=['#efe3c8','#e3cfae','#d7e0e3','#f0d6c8','#dfe6cf','#e8d8e8','#f2e6b8','#cfd8e6'];
function drawFachada(c,L,loja){
  const [nome,bgC,fg,aw]=loja,x0=L.x0*T,w=(L.x1-L.x0+1)*T,top=(L.y1-1)*T,mx=Math.floor((L.x0+L.x1)/2)*T+8;
  const wall=PAREDES[Math.floor(h2(L.x0,L.y1,61)*PAREDES.length)];
  R(c,x0,top-2,w,2,'rgba(0,0,0,.25)'); // beiral do telhado
  R(c,x0,top,w,32,wall);R(c,x0,top,1,32,'rgba(0,0,0,.22)');R(c,x0+w-1,top,1,32,'rgba(0,0,0,.22)');R(c,x0,top,w,1,'rgba(255,255,255,.35)');
  // 1º andar: janelas com moldura (algumas com varandinha, vaso ou ar-condicionado)
  const n=Math.max(2,Math.floor((w-4)/13)),gap=(w-n*7)/(n+1);
  for(let i=0;i<n;i++){const wx=Math.round(x0+gap+i*(7+gap)),v=h2(L.x0+i,L.y1,62),aberta=v<.2;
    R(c,wx-1,top+2,9,10,'#f7f3ea');R(c,wx,top+3,7,8,aberta?'#2a2a38':'#5b8fc9');if(!aberta){R(c,wx,top+3,7,2,'#8ab6e0');R(c,wx+1,top+5,1,3,'#a9cdef');}
    R(c,wx+3,top+3,1,8,'#f7f3ea');R(c,wx,top+7,7,1,'#f7f3ea');R(c,wx-2,top+11,11,1,'rgba(0,0,0,.3)');
    if(v>.62){R(c,wx-2,top+9,11,1,'#2a2a2a');for(let k=0;k<6;k++)R(c,wx-2+k*2,top+9,1,3,'#2a2a2a');}
    else if(v>.45){R(c,wx+1,top+9,5,2,'#b8563a');R(c,wx+1,top+8,1,1,'#3fa34d');R(c,wx+3,top+7,1,2,'#3fa34d');R(c,wx+5,top+8,1,1,'#ff8fc2');}
    else if(v>.35){R(c,wx+8,top+6,4,3,'#d8d8d8');R(c,wx+8,top+8,4,1,'#9a9a9a');}}
  R(c,x0,top+13,w,2,'#8a8278');R(c,x0,top+13,w,1,'#a39c8e'); // marquise
  // letreiro
  R(c,x0+1,top+15,w-2,8,bgC);R(c,x0+1,top+15,w-2,1,'rgba(255,255,255,.25)');R(c,x0+1,top+22,w-2,1,'rgba(0,0,0,.35)');
  const pw=nome.length*4-1;pxText(c,nome,Math.round(x0+(w-pw)/2),top+17,fg);
  // térreo: vitrines com produtos e porta de vidro no meio
  const gt=top+23;R(c,x0,gt,w,9,'#6d6258');R(c,x0,gt,w,1,'#5a5048');
  const vit=(a,b)=>{if(b-a<4)return;R(c,a,gt+3,b-a,5,'#2a3140');R(c,a+1,gt+4,b-a-2,3,'#8ab6e0');
    for(let q=a+2;q<b-2;q+=3)R(c,q,gt+5,2,2,['#ffe14f','#ff4fa0','#4fffd2','#f2a02a','#f4f1e8'][Math.floor(h2(q,gt,63)*5)]);};
  vit(x0+2,mx-6);vit(mx+6,x0+w-2);
  R(c,mx-5,gt+2,10,7,'#3a2a20');R(c,mx-4,gt+3,8,6,'#6fa0c8');R(c,mx,gt+3,1,6,'#3a2a20');R(c,mx-2,gt+5,1,2,'#ffe14f');R(c,mx+2,gt+5,1,2,'#ffe14f');
  // toldo listrado com a barra recortada
  for(let p=0;p<w;p+=4){const col=(p/4)%2?'#f4f1e8':aw;R(c,x0+p,gt,4,3,col);R(c,x0+p+1,gt+3,2,1,col);}
  R(c,x0,gt+8,w,1,'rgba(0,0,0,.3)'); // degrau
}
// Circo Voador visto de cima: a lona branca com as fitas cruzadas, coqueiros, a galera e o letreiro laranja
function drawCirco(c){
  const cx=75.5*T,cy=4*T+10;
  for(const [px,py] of [[71*T+6,3*T+6],[79*T+8,3*T+8],[71*T+6,6*T+6],[79*T+8,6*T+4]])drawPalmTop(c,px,py);
  for(let i=0;i<70;i++){const a=h2(i,5,71)*Math.PI*2,r=.8+h2(i,6,72)*.35;R(c,cx+Math.cos(a)*62*r,cy+14+Math.sin(a)*14*r,2,2,['#e84a4a','#f4f1e8','#2d6fd1','#ffe14f','#1d1d22','#ff8fc2'][i%6]);}
  c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(cx+3,cy+5,58,24,0,0,Math.PI*2);c.fill();
  c.fillStyle='#d8d2c0';c.beginPath();c.ellipse(cx,cy,56,22,0,0,Math.PI*2);c.fill();
  c.fillStyle='#f4f0e2';c.beginPath();c.ellipse(cx-4,cy-3,46,16,0,0,Math.PI*2);c.fill();
  c.fillStyle='#fffdf4';c.beginPath();c.ellipse(cx-8,cy-6,22,7,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#8a8f98';c.lineWidth=2;
  c.beginPath();c.moveTo(cx-50,cy-8);c.quadraticCurveTo(cx,cy-2,cx+48,cy+12);c.stroke();
  c.beginPath();c.moveTo(cx-46,cy+12);c.quadraticCurveTo(cx,cy-2,cx+50,cy-10);c.stroke();
  c.lineWidth=1;c.beginPath();c.ellipse(cx,cy,56,22,0,0,Math.PI*2);c.stroke();
  c.strokeStyle='#6d6d6d';c.beginPath();c.moveTo(cx-56,cy);c.lineTo(cx-66,cy-16);c.moveTo(cx+56,cy);c.lineTo(cx+64,cy-18);c.stroke();
  // letreiro de lâmpadas
  const sx=cx-30,sy=6*T+2;R(c,sx,sy,60,9,'#1d1422');pxText(c,'CIRCO VOADOR',sx+7,sy+2,'#ff9a3a');
  for(let i=0;i<60;i+=3){R(c,sx+i,sy-1,1,1,'#ffe07a');R(c,sx+i,sy+9,1,1,'#ffe07a');}
}
// o navio (desenhado no fundo; no final ele zarpa por cima de uma cópia do fundo sem ele)
const bgSemNavio=document.createElement('canvas');bgSemNavio.width=MW*T;bgSemNavio.height=MH*T;
function drawNavio(c,sx,sy){
  R(c,sx+4,sy+44,236,6,'rgba(10,30,60,.5)');
  c.fillStyle='#8e2b2b';c.beginPath();c.moveTo(sx,sy+16);c.lineTo(sx+240,sy+16);c.lineTo(sx+232,sy+46);c.lineTo(sx+10,sy+46);c.closePath();c.fill();
  R(c,sx,sy+16,240,4,'#f4f1e8');R(c,sx+10,sy+40,222,2,'#6a1f1f');
  R(c,sx+4,sy+20,232,4,'#b53a3a');
  R(c,sx+2,sy+6,236,10,'#8d8a82');R(c,sx+2,sy+6,236,1,'#b9b5aa');
  for(let i=0;i<5;i++){const cc=['#2d6fd1','#e0a02a','#3fa35a','#c2452f','#6d7480'][i];R(c,sx+30+i*22,sy-4,20,10,cc);R(c,sx+30+i*22,sy-4,20,1,'rgba(255,255,255,.35)');for(let k=0;k<4;k++)R(c,sx+33+i*22+k*4,sy-3,1,8,'rgba(0,0,0,.2)');}
  R(c,sx+176,sy-30,54,36,'#f4f1e8');R(c,sx+176,sy-30,54,2,'#c9c2b2');
  for(let i=0;i<5;i++)R(c,sx+181+i*10,sy-22,7,5,'#2c5a8a');
  R(c,sx+196,sy-44,12,14,'#c2452f');R(c,sx+196,sy-44,12,3,'#1d1d22');
  R(c,sx+218,sy-50,1,20,'#1d1d22');
  c.fillStyle='#f4f1e8';c.font='bold 7px monospace';c.fillText('MARÉ ALTA',sx+160,sy+36);
}
// parte de cima do navio (casario, chaminé, contêineres): desenhada por cima de quem anda na areia atrás dele
let navioCv=null;
function navioTopo(){if(!navioCv){navioCv=document.createElement('canvas');navioCv.width=250;navioCv.height=72;drawNavio(navioCv.getContext('2d'),4,56);}return navioCv;}
const noNavio=(px,py)=>px>=9*T&&px<=27*T&&py>=46*T&&py<50*T; // areia colada no navio: sem itens
function renderBG(){
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)drawTile(bgc,x,y);
  for(const L of lots){
    if(L.tank){const tx=(L.x0+1)*T+2,ty=L.y0*T+3;R(bgc,tx,ty,7,6,'#2f6fbd');R(bgc,tx,ty,7,2,'#4a8fe0');R(bgc,tx+1,ty+6,5,1,'rgba(0,0,0,.3)');}
  }
  drawEstadio(bgc,11*T,11*T,16*T,10*T);
  // fachadas das lojas (nome e cores vêm do Tiled)
  for(const L of lots)if(!L.bar&&L.letreiro)drawFachada(bgc,L,L.letreiro);
  for(const L of lots){if(!L.bar)continue;const cx=Math.floor((L.x0+L.x1)/2)*T,cy=L.y1*T;
    if(L.kind==='sinuca'){R(bgc,cx-6,cy+1,28,8,'#1f6a3a');R(bgc,cx-6,cy+8,28,1,'#0f3a20');pxText(bgc,'BAMBINA',cx-5,cy+2,'#ffe14f');}
    else{R(bgc,cx-8,cy-6,32,15,'#ffcf4a');R(bgc,cx-8,cy+8,32,1,'#a27b12');pxText(bgc,'BAR DA',cx-3,cy-4,'#b8261c');pxText(bgc,'CACHACA',cx-5,cy+2,'#b8261c');}}
  drawCirco(bgc);
  // favela Santo Amaro: escadaria e placa na entrada
  {const ex=3*T,ey=20*T;for(let k=0;k<4;k++)R(bgc,ex-8+k*2,ey+4+k*3,T+16-k*4,3,k%2?'#a39c8e':'#c9c2b2');
   R(bgc,ex-20,ey-8,2,20,'#4a3020');R(bgc,ex+34,ey-8,2,20,'#4a3020');R(bgc,ex-20,ey-10,56,9,'#1d2233');R(bgc,ex-20,ey-2,56,1,'#0a0e18');pxText(bgc,'SANTO AMARO',ex-14,ey-8,'#ffe14f');}
  // Cristo Redentor no alto do Corcovado (canto de cima, à esquerda)
  {const cx=3*T+8,cy=5*T+6;bgc.fillStyle='#2f6a2e';bgc.beginPath();bgc.ellipse(cx,cy-2,54,40,0,0,Math.PI*2);bgc.fill(); // abaixo do painel do HUD, pra aparecer
   bgc.fillStyle='#4f8a45';bgc.beginPath();bgc.ellipse(cx-4,cy+4,34,26,0,0,Math.PI*2);bgc.fill();
   bgc.fillStyle='#5a9a4a';bgc.beginPath();bgc.ellipse(cx-8,cy-2,18,12,0,0,Math.PI*2);bgc.fill();
   R(bgc,cx-10,cy+8,20,7,'#8a847a');R(bgc,cx-8,cy+4,16,5,'#a09a90');R(bgc,cx-6,cy+1,12,4,'#c8c2b8'); // pedestal
   R(bgc,cx-5,cy-30,10,32,'#f4f1e8');R(bgc,cx-6,cy-6,12,8,'#e8e2d6');R(bgc,cx-4,cy-2,8,4,'#d8d2c4'); // corpo e túnica
   R(bgc,cx-30,cy-26,60,6,'#f4f1e8');R(bgc,cx-30,cy-21,60,1,'#d8d2c4');R(bgc,cx-32,cy-25,2,4,'#e8e2d6');R(bgc,cx+30,cy-25,2,4,'#e8e2d6'); // braços abertos
   R(bgc,cx-3,cy-38,6,8,'#f4f1e8');R(bgc,cx-2,cy-39,4,1,'#e8e2d6');R(bgc,cx+2,cy-30,3,30,'#d8d2c4');
   R(bgc,cx-22,cy+17,44,9,'#1d2233');pxText(bgc,'CORCOVADO',cx-18,cy+19,'#f4f1e8');}
  // Pedra do Leme: uma pedra só no mar, no fim da praia
  for(const [px,py,rx,ry] of [[74*T,52*T,40,26]]){bgc.fillStyle='#3a4a3a';bgc.beginPath();bgc.ellipse(px,py,rx,ry,0,0,Math.PI*2);bgc.fill();
    bgc.fillStyle='#5a6a58';bgc.beginPath();bgc.ellipse(px-rx*.2,py-ry*.2,rx*.7,ry*.65,0,0,Math.PI*2);bgc.fill();
    bgc.fillStyle='#7a8a74';bgc.beginPath();bgc.ellipse(px-rx*.3,py-ry*.35,rx*.35,ry*.3,0,0,Math.PI*2);bgc.fill();
    for(let i=0;i<40;i++){const a=h2(i,px,31)*Math.PI*2,r=h2(px,i,32);R(bgc,px+Math.cos(a)*rx*r*.95,py+Math.sin(a)*ry*r*.95,2,2,h2(i,i,33)>.5?'#3f7a3a':'#2f6a2e');}
    bgc.strokeStyle='rgba(233,244,255,.8)';bgc.lineWidth=2;bgc.beginPath();bgc.ellipse(px,py,rx+2,ry+2,0,0,Math.PI*2);bgc.stroke();}
  // Pão de Açúcar e Morro da Urca, com o cabo do bondinho
  {const x0=71*T,y0=11*T,w=9*T,h=10*T;R(bgc,x0,y0,w,h,'#3f7a3a');for(let i=0;i<60;i++)R(bgc,x0+h2(i,3,41)*w,y0+h2(i,5,42)*h,3,3,h2(i,7,43)>.5?'#2f6a2e':'#4f8a45');
   const rock=(cx,cy,rx,ry)=>{bgc.fillStyle='#5a6258';bgc.beginPath();bgc.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);bgc.fill();bgc.fillStyle='#7a8478';bgc.beginPath();bgc.ellipse(cx-rx*.25,cy-ry*.2,rx*.55,ry*.7,0,0,Math.PI*2);bgc.fill();
     for(let i=0;i<22;i++){const a=h2(i,cx,51)*Math.PI*2,r=h2(cx,i,52);R(bgc,cx+Math.cos(a)*rx*r*.9,cy+Math.sin(a)*ry*r*.9,2,2,'#3f7a3a');}};
   rock(x0+26,y0+h-34,22,30);rock(x0+100,y0+h-70,30,64);
   bgc.strokeStyle='#1d1d22';bgc.lineWidth=1;bgc.beginPath();bgc.moveTo(x0+26,y0+h-62);bgc.lineTo(x0+100,y0+h-132);bgc.stroke();}
  // Arcos da Lapa (dois andares de arcos brancos) + sobrados coloridos
  const ax0=50*T,ax1=MW*T;
  R(bgc,ax0,0,ax1-ax0,32,'#f1ece0');R(bgc,ax0,30,ax1-ax0,2,'#cfc6b4');R(bgc,ax0,13,ax1-ax0,2,'#d9d1c0');
  for(let x=ax0+2;x<ax1-10;x+=16){bgc.fillStyle='#1d2233';bgc.fillRect(x+3,20,10,12);bgc.beginPath();bgc.arc(x+8,20,5,Math.PI,0);bgc.fill();
    bgc.fillRect(x+5,6,6,6);bgc.beginPath();bgc.arc(x+8,6,3,Math.PI,0);bgc.fill();}
  for(let x=51;x<MW;x+=3){if(tileAt(x,2)!==ARCH||tileAt(x+2,2)!==ARCH)continue;const col=['#e0a02a','#3fa35a','#2d6fd1','#c2452f','#b07a5a','#7f6c93'][Math.floor(h2(x,2,5)*6)];
    R(bgc,x*T,2*T,T*3-2,10,col);for(let k=0;k<3;k++){R(bgc,x*T+3+k*16,2*T+2,6,6,'#f4f1e8');R(bgc,x*T+4+k*16,2*T+3,4,5,'#3a2a20');}}
  R(bgc,53*T,5*T+2,21,9,'#2a2440');pxText(bgc,'LAPA',53*T+3,5*T+4,'#ffe14f');
  // mailbox + doormat
  R(bgc,39*T+4,29*T+4,2,8,'#5c4630');R(bgc,39*T+2,29*T+2,6,4,'#2d6fd1');
  R(bgc,38*T+3,29*T+1,10,4,'#8a3d3d');pxText(bgc,'LAR',38*T+2,29*T+-0,'#f0e3c4');
  // ship
  bgSemNavio.getContext('2d').drawImage(bg,0,0);
  drawNavio(bgc,10*T,50*T+4);
  // gangplank
  R(bgc,9*T,52*T+4,T+8,6,'#a8763f');for(let p=0;p<24;p+=4)R(bgc,9*T+p,52*T+4,1,6,'#6d4322');
}

/* ================= SPRITES ================= */
function drawMarkin(c,x,y,o={}){
  x=Math.round(x);y=Math.round(y);
  const skin=o.burn?'#e0735e':'#d29a6c',hair='#1e140e',fade='#4b3a2e',brow='#1a110b';
  const work=o.outfit==='work';
  const top=work?'#e8742a':'#ece2cc',topD=work?'#b8561b':'#d4c8ae';
  const bot=work?'#e8742a':'#2f6db5',botD=work?'#b8561b':'#244f86';
  const shoe=work?'#3a2a1a':'#f2c230';
  const dir=o.dir||'down',f=o.frame||0;
  R(c,x-5,y-1,10,2,'rgba(0,0,0,.28)');
  const l1=f===1?1:0,l2=f===3?1:0;
  if(o.spider){ // traje do Homem-Aranha
    const red='#d0202a',redD='#8e1219',blue='#1f4fb5';
    R(c,x-3,y-7,3,6-l1,blue);R(c,x+1,y-7,3,6-l2,blue);R(c,x-3,y-2-l1,3,2,red);R(c,x+1,y-2-l2,3,2,red);
    R(c,x-4,y-13,8,6,red);R(c,x-4,y-8,8,1,blue);R(c,x-4,y-12,1,4,blue);R(c,x+3,y-12,1,4,blue);
    R(c,x-5,y-13,1,5,red);R(c,x+4,y-13,1,5,red);R(c,x-5,y-10,1,1,redD);R(c,x+4,y-10,1,1,redD);
    if(dir!=='up'){R(c,x-1,y-12,2,3,'#111');R(c,x-2,y-12,1,1,'#111');R(c,x+1,y-12,1,1,'#111');R(c,x-2,y-10,1,1,'#111');R(c,x+1,y-10,1,1,'#111');}
    else{R(c,x-1,y-12,2,3,'#111');R(c,x-2,y-11,4,1,'#111');}
    if(o.photo){R(c,x-2,y-15,4,2,red);return;}
    R(c,x-4,y-21,8,8,red);R(c,x-3,y-22,6,1,red);R(c,x,y-21,1,8,redD);R(c,x-4,y-17,8,1,redD);
    if(dir!=='up'){R(c,x-3,y-19,3,2,'#fff');R(c,x+1,y-19,3,2,'#fff');R(c,x-3,y-19,3,1,'#111');R(c,x+1,y-19,3,1,'#111');}
    return;
  }
  // corpo: pernas, tronco e braços com passada pros 4 lados; parado ele respira (o tronco sobe 1px)
  const br=o.breath?1:0,side=dir==='left'||dir==='right',fw=dir==='right'?1:-1;
  const tee=work?'#e8742a':'#5a3a26',teeD=work?'#b8561b':'#43291a',teeL=work?'#f08a44':'#6e4a32';
  const leg=work?'#e8742a':'#9cc0e0',legD=work?'#b8561b':'#7496bd',tenis=work?'#3a2a1a':'#f4f1e8',sola=work?'#1d140c':'#9a9aa0';
  const hand=o.burn?'#c95a48':'#b8804f';
  if(!side){
    const a=f===1?1:0,b=f===3?1:0;
    R(c,x-4,y-8,4,7-a,leg);R(c,x,y-8,4,7-b,leg);R(c,x-1,y-8,1,6-a,legD);R(c,x+3,y-7,1,5-b,legD); // calça larga até o tornozelo
    R(c,x-4,y-2-a,4,2,tenis);R(c,x,y-2-b,4,2,tenis);R(c,x-4,y-1-a,4,1,sola);R(c,x,y-1-b,4,1,sola); // tênis
    R(c,x-5,y-15-br,10,8+br,tee);R(c,x-5,y-8,10,1,teeD);R(c,x-5,y-15-br,10,1,teeL); // camiseta oversized
    const s1=f===1?-1:f===3?1:0; // braços balançam ao contrário das pernas
    R(c,x-7,y-15-br+s1,2,4,tee);R(c,x-7,y-11-br+s1,2,3,skin);R(c,x-7,y-8-br+s1,2,1,hand);
    R(c,x+5,y-15-br-s1,2,4,tee);R(c,x+5,y-11-br-s1,2,3,skin);R(c,x+5,y-8-br-s1,2,1,hand);
    if(work){R(c,x-5,y-12-br,10,1,'#f5e663');R(c,x-7,y-11-br+s1,2,3,tee);R(c,x+5,y-11-br-s1,2,3,tee);}
    else if(dir==='down'){
      R(c,x-2,y-14-br,1,1,'#e3b341');R(c,x-1,y-13-br,2,1,'#e3b341');R(c,x+1,y-14-br,1,1,'#e3b341');R(c,x-3,y-14-br,1,2,'#e3b341');R(c,x-2,y-12-br,4,1,'#e3b341');R(c,x+2,y-14-br,1,2,'#e3b341'); // cordões de ouro
      for(let k=0;k<7;k++)R(c,x-4+k,y-15-br+k,1,1,'#2a1d16'); // alça da bolsa atravessada
      R(c,x+2,y-10-br,4,3,'#4a3226');R(c,x+2,y-10-br,4,1,'#2a1d16');}
    else{for(let k=0;k<7;k++)R(c,x+3-k,y-15-br+k,1,1,'#2a1d16');R(c,x-6,y-10-br,3,3,'#4a3226');}
  }else{
    // de lado: perna da frente e de trás abrem na passada, um braço balança
    const st=f===1?1:f===3?-1:0,fx0=x-1+fw*2*st,bx0=x-1-fw*2*st;
    R(c,bx0,y-8,2,7,legD);R(c,fx0,y-8,2,7,leg);if(!st)R(c,x-2,y-8,4,7,leg);
    const shoe=(sx)=>{R(c,sx-(fw<0?2:0),y-2,4,2,tenis);R(c,sx-(fw<0?2:0),y-1,4,1,sola);};
    shoe(bx0-1);shoe(fx0);
    R(c,x-4,y-15-br,8,8+br,tee);R(c,x-4,y-8,8,1,teeD);R(c,x-4,y-15-br,8,1,teeL);R(c,fw>0?x-4:x+3,y-14-br,1,6,teeD);
    if(work)R(c,x-4,y-12-br,8,1,'#f5e663');
    else{R(c,x+fw*2-(fw>0?0:1),y-14-br,1,2,'#e3b341');R(c,x-fw*3-(fw>0?1:0),y-10-br,3,3,'#4a3226');}
    const sw=f===1?fw*2:f===3?-fw*2:0;
    R(c,x-1+sw,y-15-br,3,4,teeL);R(c,x-1+sw+(sw>0?1:sw<0?-1:0),y-11-br,2,3,work?tee:skin);R(c,x-1+sw+(sw>0?1:sw<0?-1:0),y-8-br,2,1,hand);
  }
  if(o.phone){R(c,x+5,y-17-br,3,5,'#1d1d22');R(c,x+6,y-16-br,1,3,'#ff8fc2');R(c,x+5,y-13-br,1,2,skin);} // celular na mão
  if(o.photo){R(c,x-2,y-17-br,4,2,skin);return;} // a cabeça é a foto (camada #head)
  y-=br;
  if(dir==='up'){R(c,x-4,y-21,8,8,hair);R(c,x-4,y-17,1,3,fade);R(c,x+3,y-17,1,3,fade);R(c,x-3,y-13,6,1,skin);}
  else{
    R(c,x-4,y-20,8,7,skin);R(c,x-4,y-21,8,2,hair);R(c,x-3,y-22,6,1,hair);
    let ex1=x-3,ex2=x+1;
    if(dir==='left'){R(c,x+2,y-19,2,3,fade);R(c,x+2,y-16,1,1,'#e3b341');ex1=x-4;ex2=x-1;}
    else if(dir==='right'){R(c,x-4,y-19,2,3,fade);R(c,x-3,y-16,1,1,'#e3b341');ex1=x;ex2=x+3;}
    else{R(c,x-4,y-19,1,2,fade);R(c,x+3,y-19,1,2,fade);R(c,x+4,y-16,1,1,'#e3b341');}
    // sobrancelhas grossas
    if(!o.glasses){R(c,ex1,y-18,2,1,brow);if(dir==='down')R(c,ex2+1,y-18,2,1,brow);else R(c,ex2,y-18,1,1,brow);}
    // bigodinho ralo
    R(c,dir==='left'?x-4:dir==='right'?x-1:x-2,y-15,dir==='down'?4:5,1,'#9a6c4e');
    if(dir==='down'){if(o.sleep)R(c,x-1,y-14,2,1,'#4a1a18');else if(o.tired)R(c,x-1,y-14,2,1,'#8a3a32');else{R(c,x-2,y-14,4,1,'#f4efe2');R(c,x-2,y-14,1,1,'#7a2e2a');R(c,x+1,y-14,1,1,'#7a2e2a');}}
    if(o.glasses){R(c,ex1,y-17,dir==='down'?7:5,1,'#111');R(c,ex1,y-17,2,2,'#111');R(c,ex2,y-17,2,2,'#111');}
    else if(o.sleep){R(c,ex1,y-17,2,1,'#1a1a1a');if(dir==='down')R(c,ex2,y-17,2,1,'#1a1a1a');}
    else{R(c,ex1,y-17,1,1,'#1a1a1a');if(dir==='down'||dir==='left'||dir==='right')R(c,ex2+ (dir==='down'?1:0),y-17,1,1,'#1a1a1a');if(o.tired){R(c,ex1,y-16,2,1,'#8a6a9a');if(dir==='down')R(c,ex2,y-16,2,1,'#8a6a9a');}}
  }
  if(work&&o.helmet!==false){R(c,x-5,y-22,10,3,'#f5f5f5');R(c,x-6,y-19,12,1,'#d8d8d8');}
}
function drawMom(c,x,y,o={}){
  x=Math.round(x);y=Math.round(y);const skin='#c98c64',hair='#6b5a4e',dress='#d9579a';
  R(c,x-5,y-1,10,2,'rgba(0,0,0,.28)');const f=o.frame||0;
  if(o.dir==='left'||o.dir==='right'){drawSenhoraSide(c,x,y,f,o.dir,{skin,hair,dress,dressD:'#b24480',coque:true});
    if(o.chase){const fw=o.dir==='right'?1:-1;R(c,x+fw*5-(fw<0?1:0),y-19,2,6,'#2d6fd1');R(c,x+fw*5-(fw<0?1:0),y-19,2,1,'#f2c230');}return;}
  R(c,x-3,y-4,2,3-(f===1?1:0),skin);R(c,x+1,y-4,2,3-(f===3?1:0),skin);
  R(c,x-5,y-13,10,10,dress);R(c,x-5,y-6,10,1,'#b24480');R(c,x-2,y-10,4,1,'#f4f1e8');
  {const s1=f===1?-1:f===3?1:0;R(c,x-6,y-12+s1,1,5,skin);R(c,x+5,y-12-s1,1,5,skin);}
  R(c,x-4,y-20,8,7,skin);R(c,x-4,y-21,8,3,hair);R(c,x-2,y-24,4,3,hair);R(c,x-4,y-18,1,3,hair);R(c,x+3,y-18,1,3,hair);
  if(o.dir==='up')R(c,x-4,y-20,8,6,hair);
  if(o.dir!=='up'){R(c,x-2,y-17,1,1,'#1a1a1a');R(c,x+1,y-17,1,1,'#1a1a1a');R(c,x-1,y-15,2,1,o.angry?'#7a1c1c':'#b25b5b');if(o.angry){R(c,x-3,y-18,2,1,'#3b2a20');R(c,x+1,y-18,2,1,'#3b2a20');}}
  if(o.chase){R(c,x+6,y-19,2,6,'#2d6fd1');R(c,x+6,y-19,2,1,'#f2c230');R(c,x+5,y-13,1,1,skin);}
  else{R(c,x+5,y-9,3,4,'#6b3f22');}
}
// senhora de perfil (mãe e tias): vestido, passada, braço balançando, olho pro lado que anda
function drawSenhoraSide(c,x,y,f,dir,k){
  const fw=dir==='right'?1:-1,st=f===1?1:f===3?-1:0;
  R(c,x-1-fw*2*st,y-4,2,3,k.skin);R(c,x-1+fw*2*st,y-4,2,3,k.skin);
  R(c,x-4,y-13,8,10,k.dress);R(c,x-4,y-6,8,1,k.dressD);if(k.stripe){R(c,x-4,y-10,8,1,k.stripe);R(c,x-4,y-7,8,1,k.stripe);}
  const sw=f===1?fw*2:f===3?-fw*2:0;R(c,x-1+sw,y-12,2,5,k.skin);
  R(c,x-3,y-20,7,7,k.skin);R(c,x-3,y-21,7,3,k.hair);R(c,fw>0?x-4:x+3,y-20,2,4,k.hair);
  if(k.coque)R(c,fw>0?x-4:x+1,y-24,4,3,k.hair);
  if(k.bobs){R(c,x-3,y-23,2,2,'#ff9ec7');R(c,x,y-23,2,2,'#7fd1ff');R(c,x+3,y-23,2,2,'#ff9ec7');}
  if(k.oculos)R(c,x+fw-(fw>0?0:3),y-17,4,1,'#1a1a1a');
  R(c,x+fw*2-(fw>0?0:1),y-17,1,1,'#1a1a1a');R(c,x+fw*2-(fw>0?1:0),y-15,2,1,'#b25b5b');
}
function drawTia(c,x,y,o={}){
  x=Math.round(x);y=Math.round(y);const skin='#e0b08a';
  R(c,x-5,y-1,10,2,'rgba(0,0,0,.28)');const f=o.frame||0;
  if(o.dir==='left'||o.dir==='right'){drawSenhoraSide(c,x,y,f,o.dir,{skin,hair:'#c9c4be',dress:'#7d54b8',dressD:'#5a3a8a',stripe:'#9b76d6',bobs:true,oculos:true});if(o.alert)R(c,x+4,y-19,2,2,'#d9d9d9');return;}
  R(c,x-3,y-4,2,3-(f===1?1:0),skin);R(c,x+1,y-4,2,3-(f===3?1:0),skin);
  R(c,x-5,y-13,10,10,'#7d54b8');R(c,x-5,y-10,10,1,'#9b76d6');R(c,x-5,y-7,10,1,'#9b76d6');
  R(c,x-6,y-12,1,5,skin);R(c,x+5,y-12,1,5,skin);
  R(c,x-4,y-20,8,7,skin);R(c,x-4,y-21,8,3,'#c9c4be');
  R(c,x-4,y-23,2,2,'#ff9ec7');R(c,x-1,y-23,2,2,'#7fd1ff');R(c,x+2,y-23,2,2,'#ff9ec7');
  R(c,x-3,y-17,6,1,'#1a1a1a');R(c,x-3,y-17,2,2,'#1a1a1a');R(c,x+1,y-17,2,2,'#1a1a1a');R(c,x-1,y-15,2,1,'#b25b5b');
  if(o.alert){R(c,x+4,y-19,2,2,'#d9d9d9');}
}
function drawKey(c,x,y,t){
  x=Math.round(x);y=Math.round(y-3+Math.sin(t*10)*1.2);
  R(c,x-5,y+3,11,2,'rgba(0,0,0,.25)');
  const g='#f2c230',gd='#b8901a';
  R(c,x-6,y-9,7,7,g);R(c,x-5,y-10,5,9,g);R(c,x-7,y-8,9,5,g);
  R(c,x-4,y-7,3,3,'#1d1d22');
  R(c,x-5,y-8,1,1,'#fff');R(c,x-2,y-8,1,1,'#fff');
  R(c,x+1,y-7,7,3,g);R(c,x+1,y-5,7,1,gd);R(c,x+5,y-4,1,3,g);R(c,x+7,y-4,1,2,g);
  R(c,x-6,y-11,2,1,'#1d1d22');R(c,x-2,y-11,2,1,'#1d1d22');
  const k=Math.sin(t*20)>0?1:0;R(c,x-5,y-2,1,2+k,'#1d1d22');R(c,x-1,y-2,1,3-k,'#1d1d22');
}
function drawItem(c,type,x,y,t,alpha=1){
  x=Math.round(x);y=Math.round(y+Math.sin(t*3+x)*1.2);
  c.save();c.globalAlpha=alpha;
  R(c,x-4,y+1,8,2,'rgba(0,0,0,.22)');
  if(type==='palheta'){R(c,x-1,y-10,3,9,'#e8c070');R(c,x-1,y-10,3,1,'#fff1c2');R(c,x-2,y-2,5,2,'#8a6a10');R(c,x,y-8,1,5,'#c9a040');c.restore();return;} // palheta de sax
  if(type==='beer'){R(c,x-2,y-8,4,8,'#8a4b12');R(c,x-1,y-11,2,3,'#8a4b12');R(c,x-1,y-12,2,1,'#d9d9d9');R(c,x-2,y-6,4,3,'#f2e6c8');R(c,x-1,y-5,2,1,'#c2452f');R(c,x+1,y-8,1,2,'#c07a3a');}
  else if(type==='zip'){R(c,x-5,y-9,10,9,'#dfe7f0');R(c,x-5,y-9,10,1,'#3d7bd9');R(c,x-5,y-8,10,1,'#9fb3c8');R(c,x-4,y-4,8,3,'#ffffff');R(c,x-3,y-5,6,1,'#ffffff');R(c,x-5,y-9,1,9,'#9fb3c8');R(c,x+4,y-9,1,9,'#9fb3c8');R(c,x-5,y-1,10,1,'#9fb3c8');if(Math.sin(t*6)>.3){R(c,x+5,y-11,1,3,'#fff');R(c,x+4,y-10,3,1,'#fff');}}
  else if(type==='shroom'){R(c,x-3,y-6,6,6,'#f1e3c6');R(c,x-5,y-11,10,5,'#d8332f');R(c,x-4,y-12,8,1,'#d8332f');R(c,x-3,y-13,6,1,'#d8332f');R(c,x-3,y-11,2,2,'#fff');R(c,x+2,y-10,2,1,'#fff');R(c,x,y-12,1,1,'#fff');R(c,x-2,y-4,1,1,'#1a1a1a');R(c,x+1,y-4,1,1,'#1a1a1a');const m=Math.sin(t*8)>0;R(c,x-1,y-2,2,m?2:1,'#7a2c22');R(c,x-3,y-3,1,1,'#f08a8a');R(c,x+2,y-3,1,1,'#f08a8a');}
  else if(type==='shroomAranha'){R(c,x-2,y-6,4,6,'#1f4fb5');R(c,x-5,y-11,10,5,'#d0202a');R(c,x-4,y-12,8,1,'#d0202a');R(c,x-3,y-13,6,1,'#d0202a');
    R(c,x,y-13,1,7,'#111');R(c,x-5,y-9,10,1,'#111');R(c,x-3,y-12,1,1,'#111');R(c,x+2,y-12,1,1,'#111');R(c,x-4,y-11,3,2,'#fff');R(c,x+2,y-11,3,2,'#fff');
    if(Math.sin(t*4)>.6){R(c,x+5,y-8,1,6,'#e9f4ff');}}
  else if(type==='shroomGold'){R(c,x-2,y-6,4,6,'#f1e3c6');R(c,x-5,y-11,10,5,'#f2c230');R(c,x-4,y-12,8,1,'#f2c230');R(c,x-3,y-13,6,1,'#ffe07a');R(c,x-3,y-11,2,2,'#fff7c2');R(c,x+2,y-10,2,1,'#fff7c2');R(c,x-5,y-7,10,1,'#b8901a');
    if(Math.sin(t*7+x)>.2){R(c,x-7,y-14,1,3,'#fff');R(c,x-8,y-13,3,1,'#fff');}else{R(c,x+6,y-12,1,3,'#fff');R(c,x+5,y-11,3,1,'#fff');}}
  else if(type==='shroomRoxo'){R(c,x-2,y-6,4,6,'#d8d0e8');R(c,x-5,y-11,10,5,'#7d54b8');R(c,x-4,y-12,8,1,'#7d54b8');R(c,x-3,y-13,6,1,'#7d54b8');R(c,x-3,y-11,2,2,'#c9b0ff');R(c,x+2,y-10,2,1,'#c9b0ff');
    R(c,x-2,y-4,2,1,'#1a1a1a');R(c,x+1,y-4,2,1,'#1a1a1a');const zy=Math.floor(t*2)%3;R(c,x+5,y-15-zy,3,1,'#c9b0ff');R(c,x+6,y-14-zy,1,1,'#c9b0ff');R(c,x+5,y-13-zy,3,1,'#c9b0ff');}
  else if(type==='shades'){R(c,x-5,y-5,10,1,'#111');R(c,x-5,y-5,4,3,'#111');R(c,x+1,y-5,4,3,'#111');R(c,x-4,y-4,2,1,'#6f7ff0');R(c,x+2,y-4,2,1,'#6f7ff0');R(c,x-6,y-5,1,1,'#111');R(c,x+5,y-5,1,1,'#111');}
  c.restore();
}
function drawBusStop(c,x,y){
  x=Math.round(x);y=Math.round(y);
  R(c,x-8,y-15,16,2,'#8d97a3');R(c,x-7,y-13,1,12,'#5c6470');R(c,x+6,y-13,1,12,'#5c6470');
  R(c,x-6,y-6,12,2,'#8a5a2e');R(c,x-6,y-4,1,3,'#5c3a1d');R(c,x+5,y-4,1,3,'#5c3a1d');
  R(c,x+9,y-18,1,17,'#5c6470');R(c,x+7,y-22,6,5,'#2d6fd1');R(c,x+8,y-21,4,2,'#fff');R(c,x+8,y-19,1,1,'#fff');R(c,x+11,y-19,1,1,'#fff');
}
function drawChair(c,x,y){
  x=Math.round(x);y=Math.round(y);
  R(c,x-6,y-1,12,2,'rgba(0,0,0,.2)');
  for(let i=0;i<5;i++)R(c,x-5,y-10+i*2,10,2,i%2?'#f4f1e8':'#e84a4a');
  R(c,x-6,y-10,1,10,'#9a9aa0');R(c,x+5,y-10,1,10,'#9a9aa0');
}
function drawUmbrella(c,x,y){
  x=Math.round(x);y=Math.round(y);
  R(c,x+8,y-22,1,22,'#6d6d6d');
  c.fillStyle='#ffcf4a';c.beginPath();c.moveTo(x-3,y-21);c.lineTo(x+8,y-28);c.lineTo(x+20,y-21);c.closePath();c.fill();
  c.fillStyle='#2d6fd1';c.beginPath();c.moveTo(x+4,y-21);c.lineTo(x+8,y-28);c.lineTo(x+12,y-21);c.closePath();c.fill();
}
function drawPalmTop(c,x,y){ // coqueiro visto de cima
  for(let i=0;i<6;i++){c.save();c.translate(x,y);c.rotate(i*Math.PI/3+.3);c.fillStyle='#2f8a3a';c.fillRect(0,-1.5,8,3);c.fillStyle='#4fae4a';c.fillRect(2,-.5,5,1);c.restore();}
  R(c,x-2,y-2,4,4,'#7a5a2e');R(c,x-1,y+1,2,2,'#5a3a1a');}
function drawPalm(c,x,y,t){ // coqueiro do calçadão
  x=Math.round(x);y=Math.round(y);R(c,x-5,y-1,10,2,'rgba(0,0,0,.2)');
  for(let i=0;i<20;i++)R(c,x+Math.round(Math.sin(i/20*1.2)*4)-1,y-i,3,1,i%3?'#9a6a3a':'#7a5028');
  const tx=x+4,ty=y-21,sw=Math.sin(t*1.5+x);
  const fr=(dx,dy,len)=>{for(let k=0;k<len;k++)R(c,tx+Math.round(dx*k+sw*k/len),ty+Math.round(dy*k+k*k*.05),2,2,k<len-2?'#2f8a3a':'#4fae4a');};
  fr(1,-.3,9);fr(-1,-.3,9);fr(.8,.35,8);fr(-.8,.35,8);fr(.2,-.7,6);R(c,tx-1,ty,3,3,'#6a4a1a');R(c,tx+1,ty+2,2,2,'#5a3a12');}
function drawQuiosque(c,x,y){ // quiosque da orla
  x=Math.round(x);y=Math.round(y);R(c,x-10,y-1,20,2,'rgba(0,0,0,.2)');R(c,x-8,y-10,16,9,'#f4f1e8');R(c,x-8,y-6,16,1,'#2f8a3a');R(c,x-6,y-9,5,3,'#1a2a3a');R(c,x+1,y-9,5,3,'#1a2a3a');
  R(c,x-11,y-15,22,5,'#2f8a3a');for(let i=0;i<22;i+=4)R(c,x-11+i,y-15,2,5,'#f4f1e8');R(c,x-7,y-4,3,3,'#8a4b12');R(c,x+3,y-5,3,4,'#3fa35a');}
function drawBondinho(c,cx,cy,t){ // bondinho do Pão de Açúcar
  const a={x:71*T+26,y:21*T-62},b={x:71*T+100,y:21*T-132},u=(Math.sin(t*.25)+1)/2,x=a.x+(b.x-a.x)*u-cx,y=a.y+(b.y-a.y)*u-cy;
  if(x<-10||x>W+10||y<-10||y>H+10)return;R(c,x,y,1,4,'#1d1d22');R(c,x-4,y+4,9,6,'#c2452f');R(c,x-3,y+5,7,2,'#bfe0ff');R(c,x-4,y+9,9,1,'#7a1f1f');}
function drawLamp(c,x,y){x=Math.round(x);y=Math.round(y);R(c,x,y-16,1,16,'#4a4f5a');R(c,x-1,y-18,3,2,'#6a707c');R(c,x-1,y-16,3,1,'#ffe6a0');}
function drawPhoneIcon(c,x,y){R(c,x-4,y-7,8,14,'#1d1d22');R(c,x-3,y-6,6,10,'#ff8fc2');R(c,x-1,y+5,2,1,'#888');}
function drawHouseIcon(c,x,y,col='#c2452f'){c.fillStyle=col;c.beginPath();c.moveTo(x-5,y-1);c.lineTo(x,y-6);c.lineTo(x+5,y-1);c.fill();R(c,x-4,y-1,8,6,'#f0e3c4');R(c,x-1,y+1,2,4,'#7a4a24');}
function drawShipIcon(c,x,y){R(c,x-6,y,12,3,'#8e2b2b');R(c,x-5,y+3,10,1,'#6a1f1f');R(c,x-5,y-1,10,1,'#f4f1e8');R(c,x+1,y-5,4,4,'#f4f1e8');R(c,x+2,y-7,2,2,'#c2452f');R(c,x-4,y-3,4,2,'#2d6fd1');}
/* amigos que seguem o Markin (um por desafio vencido) */
function drawBuddy(c,x,y,b,o={}){
  x=Math.round(x);y=Math.round(y);const f=o.frame||0,t=o.t||0,dir=o.dir||'down';
  R(c,x-5,y-1,10,2,'rgba(0,0,0,.28)');
  const l1=f===1?1:0,l2=f===3?1:0;
  if(dir==='left'||dir==='right'){drawBuddySide(c,x,y,b,f,t,dir);return;}
  R(c,x-3,y-5,2,4-l1,b.skin);R(c,x+1,y-5,2,4-l2,b.skin);R(c,x-3,y-1-l1,3,1,b.shoe||'#f4f1e8');R(c,x+1,y-1-l2,3,1,b.shoe||'#f4f1e8');
  if(b.skirt){R(c,x-5,y-8,10,4,b.shorts);}else R(c,x-4,y-8,8,4,b.shorts);
  R(c,x-4,y-13,8,6,b.shirt||b.skin);if(b.belly)R(c,x-4,y-10,8,3,b.shirt);if(b.belly)R(c,x-5,y-11,10,3,b.shirt);
  if(!b.shirt){R(c,x-2,y-12,1,1,'#9a6040');R(c,x+1,y-12,1,1,'#9a6040');}
  {const s1=f===1?-1:f===3?1:0;R(c,x-5,y-13+s1,1,5,b.skin);R(c,x+4,y-13-s1,1,5,b.skin);} // braços balançam
  R(c,x-4,y-20,8,7,b.skin);R(c,x-4,y-21,8,2,b.hair);R(c,x-3,y-22,6,1,b.hair);
  if(b.long){R(c,x-5,y-20,2,10,b.hair);R(c,x+3,y-20,2,10,b.hair);}
  if(b.cap){R(c,x-4,y-22,8,3,b.cap);R(c,x-6,y-20,4,1,b.cap);}
  if(dir==='up'){R(c,x-4,y-20,8,6,b.long?b.hair:b.hair);}
  else{R(c,x-2,y-17,1,1,'#1a1a1a');R(c,x+1,y-17,1,1,'#1a1a1a');R(c,x-1,y-15,2,1,'#8a3a32');
    if(b.shades){R(c,x-3,y-17,6,1,'#111');R(c,x-3,y-17,2,2,'#111');R(c,x+1,y-17,2,2,'#111');}
    if(b.beard){R(c,x-3,y-15,6,2,b.beard);}
    if(b.earring){R(c,x-5,y-16,1,2,'#e3b341');R(c,x+4,y-16,1,2,'#e3b341');}}
  // o que cada um carrega
  if(b.prop==='ball'){const by=y-24-Math.abs(Math.sin(t*5))*6;R(c,x+5,by,3,3,'#f4f1e8');R(c,x+6,by,1,1,'#2d6fd1');}
  else if(b.prop==='beer'){R(c,x+5,y-14,2,5,'#8a4b12');R(c,x+5,y-15,2,1,'#d9d9d9');R(c,x+5,y-12,2,1,'#f2e6c8');}
  else if(b.prop==='taco'){for(let i=0;i<14;i++)R(c,x+5+Math.floor(i*.35),y-4-i,1,1,i<10?'#c9a060':'#f4f1e8');}
  else if(b.prop==='glitter'){for(let k=0;k<3;k++){const a=t*3+k*2.1;R(c,x+Math.round(Math.cos(a)*7),y-18+Math.round(Math.sin(a)*5),1,1,['#ffe14f','#4fffd2','#ff4fd8'][k]);}}
  else if(b.prop==='tamborim'){const hit=Math.sin(t*12+x)>0;R(c,x+4,y-14,4,4,'#d8d8d8');R(c,x+5,y-13,2,2,'#9a9aa0');R(c,x+7,y-(hit?17:15),1,3,'#6b4423');}
  else if(b.prop==='bandeira'){R(c,x+5,y-30,1,24,'#6d4322');}
  else if(b.prop==='prancha'){R(c,x+5,y-24,4,22,'#f4f1e8');R(c,x+6,y-23,2,20,'#e84a4a');}
}
// NPC de perfil: passada com uma perna na frente e outra atrás, um braço balançando, olho do lado que ele olha
function drawBuddySide(c,x,y,b,f,t,dir){
  const fw=dir==='right'?1:-1,st=f===1?1:f===3?-1:0,fx0=x-1+fw*2*st,bx0=x-1-fw*2*st,sh=b.shoe||'#f4f1e8';
  R(c,bx0,y-5,2,4,b.skin);R(c,fx0,y-5,2,4,b.skin);R(c,bx0-(fw<0?1:0),y-1,3,1,sh);R(c,fx0-(fw<0?1:0),y-1,3,1,sh);
  if(b.skirt)R(c,x-4,y-8,8,4,b.shorts);else R(c,x-3,y-8,6,4,b.shorts);
  R(c,x-3,y-13,6,6,b.shirt||b.skin);if(b.belly)R(c,x-4+(fw>0?1:0),y-11,7,3,b.shirt||b.skin);
  const sw=f===1?fw*2:f===3?-fw*2:0;R(c,x-1+sw,y-13,2,5,b.skin);
  R(c,x-3,y-20,7,7,b.skin);R(c,x-3,y-21,7,2,b.hair);R(c,x-2,y-22,5,1,b.hair);R(c,fw>0?x-3:x+2,y-20,2,4,b.hair);
  if(b.long)R(c,fw>0?x-4:x+2,y-20,3,10,b.hair);
  if(b.cap){R(c,x-3,y-22,7,3,b.cap);R(c,fw>0?x+3:x-6,y-20,4,1,b.cap);}
  R(c,x+fw*2-(fw>0?0:1),y-17,1,1,'#1a1a1a');R(c,x+fw*2-(fw>0?1:0),y-15,2,1,'#8a3a32');
  if(b.shades)R(c,x+fw*1-(fw>0?0:2),y-17,4,1,'#111');
  if(b.beard)R(c,x-2+(fw>0?1:0),y-15,5,2,b.beard);
  if(b.prop==='ball'){const by=y-24-Math.abs(Math.sin(t*5))*6;R(c,x+fw*5,by,3,3,'#f4f1e8');}
  else if(b.prop==='beer'){R(c,x+fw*4,y-14,2,5,'#8a4b12');R(c,x+fw*4,y-15,2,1,'#d9d9d9');}
  else if(b.prop==='taco'){for(let i=0;i<14;i++)R(c,x+fw*(4+Math.floor(i*.35)),y-4-i,1,1,i<10?'#c9a060':'#f4f1e8');}
  else if(b.prop==='glitter'){for(let k=0;k<3;k++){const a=t*3+k*2.1;R(c,x+Math.round(Math.cos(a)*7),y-18+Math.round(Math.sin(a)*5),1,1,['#ffe14f','#4fffd2','#ff4fd8'][k]);}}
  else if(b.prop==='tamborim'){const hit=Math.sin(t*12+x)>0;R(c,x+fw*4,y-14,4,4,'#d8d8d8');R(c,x+fw*5,y-(hit?17:15),1,3,'#6b4423');}
  else if(b.prop==='bandeira')R(c,x+fw*5,y-30,1,24,'#6d4322');
}
/* o Jamal: velho saxofonista de chapéu e barba branca */
function drawMestre(c,x,y,o={}){
  x=Math.round(x);y=Math.round(y);const t=o.t||0,f=o.frame||0,sk='#8a5a3a';
  R(c,x-5,y-1,10,2,'rgba(0,0,0,.28)');
  R(c,x-3,y-5,2,4-(f===1?1:0),'#2a2a2a');R(c,x+1,y-5,2,4-(f===3?1:0),'#2a2a2a');R(c,x-3,y-1,3,1,'#f4f1e8');R(c,x+1,y-1,3,1,'#f4f1e8');
  R(c,x-4,y-8,8,4,'#f4f1e8');
  R(c,x-4,y-14,8,7,'#e84a4a');R(c,x-3,y-13,2,2,'#ffe14f');R(c,x+1,y-11,2,2,'#ffe14f');R(c,x-2,y-9,2,1,'#ffe14f'); // camisa florida
  R(c,x-5,y-14,1,5,sk);R(c,x+4,y-14,1,5,sk);
  R(c,x-4,y-21,8,7,sk);R(c,x-4,y-16,8,3,'#f4f1e8');R(c,x-3,y-14,6,1,'#f4f1e8'); // barba branca
  R(c,x-2,y-19,1,1,'#1a1a1a');R(c,x+1,y-19,1,1,'#1a1a1a');
  R(c,x-6,y-22,12,1,'#e8d193');R(c,x-4,y-25,8,3,'#e8d193');R(c,x-4,y-23,8,1,'#1a1a1a'); // chapéu panamá
  // saxofone dourado
  const s=o.play?Math.round(Math.sin(t*14)):0;
  R(c,x+1,y-15,2,1,'#1a1a1a');R(c,x+2,y-14,2,2,'#e3b341');R(c,x+3,y-12+s,2,7,'#e3b341');R(c,x+3,y-6+s,5,2,'#e3b341');R(c,x+6,y-10+s,2,5,'#e3b341');R(c,x+5,y-11+s,4,2,'#f2d060');R(c,x+3,y-10+s,1,1,'#8a6a10');R(c,x+3,y-8+s,1,1,'#8a6a10');
}

// músico de bloco: corpo de folião + instrumento (trompete, trombone, sax ou caixa), com LED e glitter
function drawMusico(c,x,y,kind,t,look,i=0){
  x=Math.round(x);y=Math.round(y);const f=Math.floor(t*8+i)%4,oro='#e3b341',oroL='#f2d060';
  drawBuddy(c,x,y,{...look,prop:null},{dir:'down',frame:f,t});
  const led=['#ff2bd6','#2bffe0','#fff12b','#2b7bff'][(i+Math.floor(t*6))%4],led2=['#2bffe0','#fff12b','#2b7bff','#ff2bd6'][(i+Math.floor(t*6))%4];
  R(c,x-4,y-22,8,1,led);R(c,x-4,y-12,1,1,led2);R(c,x+3,y-10,1,1,led);R(c,x-2,y-8,4,1,led2); // LED na testa e na roupa
  for(let k=0;k<3;k++){const a=t*3+k*2.1+i;R(c,x+Math.round(Math.cos(a)*8),y-16+Math.round(Math.sin(a)*6),1,1,['#ffe14f','#ffffff','#ff8fc2'][k]);} // glitter
  const s=Math.round(Math.sin(t*10+i));
  if(kind==='trompete'){R(c,x+2,y-16,7,2,oro);R(c,x+9,y-18,2,6,oroL);R(c,x+4,y-17,1,1,'#8a6a10');R(c,x+6,y-17,1,1,'#8a6a10');R(c,x+3,y-15,2,2,look.skin);}
  else if(kind==='trombone'){const sl=3+Math.abs(s)*4;R(c,x+2,y-17,8+sl,1,oro);R(c,x+2,y-15,8+sl,1,oro);R(c,x+9+sl,y-17,1,3,oro);R(c,x+2,y-19,2,5,oroL);R(c,x+1,y-20,3,1,oroL);R(c,x+6+sl,y-16,2,2,look.skin);}
  else if(kind==='sax'){R(c,x+2,y-16,2,1,'#1a1a1a');R(c,x+3,y-15,2,7,oro);R(c,x+3,y-8,5,2,oro);R(c,x+6,y-12,2,5,oroL);}
  else if(kind==='caixa'){R(c,x-5,y-10,10,4,'#f4f1e8');R(c,x-5,y-10,10,1,'#d8332f');R(c,x-5,y-7,10,1,'#d8332f');R(c,x-3,y-12-(s>0?3:0),1,4,'#c9a060');R(c,x+2,y-12-(s>0?0:3),1,4,'#c9a060');}
}
/* o chefão: trio elétrico do Bloco do Jamal rodando pelas ruas */
function drawBossBloco(c,x,y,t){ // o Jamal a pé, tocando sax, com a galerinha dele
  x=Math.round(x);y=Math.round(y);
  const BANDA=[['trompete',{skin:'#8a5a3a',hair:'#1e140e',shirt:'#e84a4a',shorts:'#1d1d22',cap:'#ffe14f'}],['trombone',{skin:'#d29a6c',hair:'#ff4fd8',shirt:'#2d6fd1',shorts:'#f4f1e8'}],
    ['caixa',{skin:'#b8733f',hair:'#1e140e',shirt:'#f4f1e8',shorts:'#2f9a55'}],['folia',{skin:'#e0b08a',hair:'#4fffd2',shirt:'#9b76d6',shorts:'#ff4fd8',prop:'glitter'}],['folia',{skin:'#8a5a3a',hair:'#ffe14f',shirt:'#ff8a3d',shorts:'#1d1d22',prop:'tamborim'}]];
  [[-18,-6],[18,-6],[-12,6],[14,7],[0,11]].forEach(([dx,dy],i)=>{const [k,look]=BANDA[i],yy=y+dy-Math.abs(Math.sin(t*9+i))*2;
    if(k==='folia'){drawBuddy(c,x+dx,yy,look,{frame:Math.floor(t*8+i)%4,t});const led=['#ff2bd6','#2bffe0','#fff12b','#2b7bff'][(i+Math.floor(t*6))%4];R(c,x+dx-4,yy-22,8,1,led);R(c,x+dx-3,yy-11,6,1,led);}
    else drawMusico(c,x+dx,yy,k,t,look,i);});
  c.save();c.translate(x+2,y+6);c.scale(1.6,1.6);drawMestre(c,0,0,{t,play:true,frame:Math.floor(t*8)%4});c.restore();
  for(let i=0;i<3;i++){const a2=t*2+i*2.1;outlineText(c,'♪',x+14+Math.cos(a2)*6,y-34-((t*20+i*9)%18),6,['#ffe14f','#4fffd2','#ff4fd8'][i]);}
}

/* ================= ROSTO DO MARKIN (pixel art + camadas de expressão) ================= */
const FACE_SRC=SVPC_ASSETS.FACE_SRC;
const BALL_SRC=SVPC_ASSETS.BALL_SRC;
const SONO_SRC=SVPC_ASSETS.SONO_SRC; // foto do Markin apagado, na tela de derrota
const faceImg=new Image();faceImg.src=FACE_SRC;
const ballImg=new Image();ballImg.src=BALL_SRC;
const FW=98,FH=122;
const fbuf=document.createElement('canvas');fbuf.width=FW;fbuf.height=FH;const fb=fbuf.getContext('2d');fb.imageSmoothingEnabled=false;
const SK={l:'#fdca87',m:'#f0aa62',s:'#df9556',d:'#b8703e',hair:'#111315',lip:'#e67f64',lipD:'#a8483a',mouth:'#2a1210',teeth:'#f6eed6',tooth:'#cbbf9e',white:'#fbf4e8',pupil:'#2a1a12'};
const TRIPC=['#ff4fd8','#4fffd2','#ffe14f','#6f7ff0','#ff8a3d'];
const fc=$('face').getContext('2d');
function faceLayers(st){
  const e=st.e;
  const eyes=st.sleep?'closed':st.turbo?'wide':st.trip?'trip':st.drunk?'drunk':st.crash?'crash':(st.sono||0)>=90?'dead':(st.sono||0)>=75&&e>18?'half':e>65?'base':e>40?'soft':e>18?'half':'dead';
  let mouth=st.sleep?'o':st.turbo?'mega':st.trip?'goofy':st.drunk?'crooked':st.crash?'frown':(st.sono||0)>=90?'wobbly':(st.sono||0)>=75&&e>18?'open':e>65?'base':e>40?'smile':e>18?'open':'wobbly';
  if(st.mood==='sad')mouth='frown';else if(st.mood==='hype')mouth='mega';
  return{eyes,mouth};
}
function faceRing(st){if(st.spider)return '#d0202a';if(st.trip)return '#ff8fc2';if(st.turbo)return '#ffe14f';if(st.drunk)return '#ffd54a';if(st.glasses)return '#9fd0ff';if(st.sleep)return '#bfe0ff';if(st.crash)return '#8a6a9a';return st.e>65?'#8be08b':st.e>40?'#f3ecd8':st.e>18?'#ffb347':'#ff6b5d';}
// monta o rosto no buffer 98x122
function buildFace(st,o={}){
  const B=(x,y,w,h,c)=>{fb.fillStyle=c;fb.fillRect(x,y,w,h);};
  const t=performance.now()/1000,tk=Math.floor(t*6);
  fb.clearRect(0,0,FW,FH);
  if(o.back){ // nuca: degradê
    fb.fillStyle=SK.m;fb.beginPath();fb.ellipse(49,62,38,59,0,0,Math.PI*2);fb.fill();
    fb.fillStyle='#4b3a2e';fb.beginPath();fb.ellipse(49,52,38,48,0,0,Math.PI*2);fb.fill();
    fb.fillStyle=SK.hair;fb.beginPath();fb.ellipse(49,34,37,32,0,0,Math.PI*2);fb.fill();
    B(10,56,4,14,SK.s);B(84,56,4,14,SK.s);B(84,70,3,3,'#e3b341');
    if(st.spider){spiderMask(false);return;}
    if(o.helmet)helmet(B);return;
  }
  if(!faceImg.complete||!faceImg.naturalWidth){fb.fillStyle=SK.m;fb.beginPath();fb.ellipse(49,62,38,59,0,0,Math.PI*2);fb.fill();if(st.spider)spiderMask(true);return;}
  fb.drawImage(faceImg,0,0);
  if(st.spider){spiderMask(true);return;}
  const L=faceLayers(st);
  const coverEyes=()=>{B(19,47,23,12,SK.m);B(19,47,23,2,SK.s);B(20,57,21,2,SK.l);B(55,48,26,12,SK.m);B(55,48,26,2,SK.s);B(56,58,24,2,SK.l);};
  const coverMouth=()=>{B(24,77,48,4,'#d48a50');B(22,81,52,14,SK.m);B(26,95,44,4,SK.s);B(30,99,36,2,SK.m);B(30,78,36,2,'#c07844');};
  // ---- olhos
  const eyePair=(lx,ly,rx,ry,fn)=>{fn(lx,ly,-1);fn(rx,ry,1);};
  switch(L.eyes){
    case 'base':break;
    case 'soft':B(24,58,13,1,'#d88c6c');B(61,59,14,1,'#d88c6c');break;
    case 'half':coverEyes();eyePair(21,51,57,52,(x,y)=>{B(x,y,19,2,SK.d);B(x+2,y+2,15,3,SK.white);B(x+7,y+2,5,3,SK.pupil);B(x+2,y+6,15,2,'#a07090');});break;
    case 'crash':coverEyes();eyePair(21,51,57,52,(x,y)=>{B(x,y,19,3,SK.d);B(x+2,y+3,15,2,SK.white);B(x+7,y+3,5,2,SK.pupil);B(x+1,y+6,17,3,'#6a4a80');B(x+3,y+9,13,1,'#8a6a9a');});break;
    case 'dead':{coverEyes();const j=()=>Math.random()<.4?(Math.random()<.5?-1:1):0;
      eyePair(21,51,57,52,(x,y,s)=>{B(x,y,19,3+(s<0?1:0),SK.d);B(x+2,y+3,15,2,'#f6b4a4');B(x+4,y+4,3,1,'#d8403a');B(x+7+j(),y+3,4,2,SK.pupil);B(x+1,y+6,17,3,'#6a4a80');});
      B(78,34,3,5,'#9fd0ff');B(79,39,2,2,'#9fd0ff');break;}
    case 'wide':{coverEyes();const j=()=>Math.random()<.5?(Math.random()<.5?-1:1):0;
      eyePair(21,47,58,48,(x,y)=>{B(x,y,18,1,SK.hair);B(x+1,y+1,16,9,SK.white);B(x,y+2,1,6,SK.white);B(x+17,y+2,1,6,SK.white);B(x+7+j(),y+4,3,3,SK.pupil);});break;}
    case 'trip':coverEyes();eyePair(21,48,58,49,(x,y,s)=>{B(x+1,y+1,16,8,SK.white);const k=tk+(s>0?2:0);
      B(x+4,y+2,10,6,TRIPC[k%5]);B(x+6,y+3,6,4,TRIPC[(k+1)%5]);B(x+8,y+4,2,2,TRIPC[(k+2)%5]);});break;
    case 'drunk':coverEyes();eyePair(21,51,57,52,(x,y,s)=>{B(x,y,19,3,SK.d);B(x+2,y+3,15,3,SK.white);B(s<0?x+12:x+3,y+3,4,3,SK.pupil);B(x+2,y+7,15,1,'#c0707a');});break;
    case 'closed':coverEyes();eyePair(21,53,57,54,(x,y)=>{B(x+1,y,17,2,'#3a2418');B(x,y-1,2,1,'#3a2418');B(x+17,y-1,2,1,'#3a2418');B(x+3,y+2,13,1,SK.s);});break;
  }
  // ---- boca
  switch(L.mouth){
    case 'base':break;
    case 'smile':coverMouth();B(29,84,3,3,SK.lipD);B(64,84,3,3,SK.lipD);B(32,87,32,2,SK.lipD);B(34,89,28,3,SK.lip);B(38,92,20,1,'#f09a84');break;
    case 'open':coverMouth();B(37,84,22,3,SK.lip);B(38,87,20,5,SK.mouth);B(40,87,16,1,SK.teeth);B(37,92,22,3,SK.lip);break;
    case 'wobbly':coverMouth();for(let i=0;i<6;i++)B(30+i*6,87+(i%2?2:0),6,2,SK.lipD);B(34,91,28,2,SK.lip);B(56,93,3,4,'#9fd0ff');break;
    case 'mega':B(30,81,36,11,SK.teeth);for(let x=34;x<64;x+=4)B(x,81,1,11,SK.tooth);B(30,86,36,1,SK.tooth);B(28,80,40,1,SK.lipD);B(29,92,38,4,SK.lip);B(27,81,3,10,SK.lipD);B(66,81,3,10,SK.lipD);B(38,72,2,1,'#ffffff');B(52,73,2,1,'#ffffff');B(79,31,3,5,'#9fd0ff');break;
    case 'goofy':B(43,91,12,7,'#e0506a');B(48,92,2,5,'#b83050');B(44,97,10,1,'#c83858');break;
    case 'crooked':coverMouth();B(29,84,18,2,SK.lipD);B(31,86,16,3,SK.teeth);B(35,86,1,3,SK.tooth);B(40,86,1,3,SK.tooth);B(47,87,14,2,SK.lipD);B(60,89,7,2,SK.lipD);B(31,89,22,3,SK.lip);break;
    case 'frown':coverMouth();B(34,88,28,2,SK.lipD);B(30,90,4,3,SK.lipD);B(62,90,4,3,SK.lipD);B(35,90,26,2,SK.lip);break;
    case 'o':coverMouth();B(41,83,14,12,SK.lip);B(43,85,10,8,SK.mouth);break;
  }
  // ---- extras
  if(st.drunk&&!st.glasses){B(15,64,9,5,'rgba(255,70,70,.45)');B(74,64,9,5,'rgba(255,70,70,.45)');B(44,64,6,5,'rgba(255,70,70,.35)');}
  if(st.drunk&&st.glasses){B(15,68,9,4,'rgba(255,70,70,.45)');B(74,68,9,4,'rgba(255,70,70,.45)');B(44,64,6,5,'rgba(255,70,70,.35)');}
  // ---- óculos escuros (combinam com o resto)
  if(st.glasses){
    const tired=['half','crash','dead'].includes(L.eyes);
    const dy=tired?9:0,tilt=st.drunk?3:0;
    const lens=(x,y,w,h,side)=>{
      B(x,y,w,h,'#0b0b10');
      if(st.trip){for(let r=1;r<h-1;r++)B(x+2,y+r,w-4,1,TRIPC[(tk+r+(side>0?2:0))%5]);}
      else{B(x+2,y+1,w-4,h-2,'#161826');B(x+4,y+2,3,1,'#6f7ff0');B(x+3,y+3,3,1,'#6f7ff0');B(x+2,y+4,2,1,'#6f7ff0');}
      B(x,y,1,1,'rgba(0,0,0,0)');
    };
    lens(16,45+dy,26,13,-1);lens(55,46+dy+tilt,27,13,1);
    B(42,48+dy,13,3,'#0b0b10');B(12,47+dy,5,2,'#0b0b10');B(82,48+dy+tilt,5,2,'#0b0b10');
    B(17,45+dy,24,1,'#2a2c3a');B(56,46+dy+tilt,25,1,'#2a2c3a');
  }
  if(st.burn){fb.globalCompositeOperation='source-atop';fb.fillStyle='rgba(255,70,40,.28)';fb.fillRect(0,0,FW,FH);fb.globalCompositeOperation='source-over';}
  if(o.helmet)helmet(B);
}
// máscara do Homem-Aranha pintada por cima do formato da cabeça
function spiderMask(eyes){
  fb.save();fb.globalCompositeOperation='source-atop';
  fb.fillStyle='#d0202a';fb.fillRect(0,0,FW,FH);
  fb.fillStyle='rgba(0,0,0,.18)';fb.fillRect(0,0,12,FH);fb.fillRect(FW-12,0,12,FH);
  const cx=49,cy=eyes?64:40,N=14;fb.strokeStyle='#4a070c';fb.lineWidth=1.4;
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2;fb.beginPath();fb.moveTo(cx,cy);fb.lineTo(cx+Math.cos(a)*110,cy+Math.sin(a)*110);fb.stroke();}
  for(const r of [12,24,37,51,66]){fb.beginPath();for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;
    if(i===0)fb.moveTo(px,py);else{const am=(i-.5)/N*Math.PI*2;fb.quadraticCurveTo(cx+Math.cos(am)*r*.86,cy+Math.sin(am)*r*.86,px,py);}}fb.stroke();}
  if(eyes){
    const poly=(pts,col)=>{fb.fillStyle=col;fb.beginPath();fb.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))fb.lineTo(p[0],p[1]);fb.closePath();fb.fill();};
    poly([[13,40],[43,50],[39,64],[18,62]],'#111');poly([[85,40],[55,50],[59,64],[80,62]],'#111');
    poly([[17,44],[39,52],[36,60],[21,58]],'#fbf4e8');poly([[81,44],[59,52],[62,60],[77,58]],'#fbf4e8');
  }
  fb.restore();
}
function helmet(B){B(12,6,74,16,'#f5f5f5');B(18,2,62,4,'#f5f5f5');B(28,0,42,2,'#f5f5f5');B(6,20,86,5,'#f5f5f5');B(6,24,86,2,'#d8d8d8');B(44,2,10,18,'#e4e4e4');}
// desenha o rosto numa canvas qualquer (encaixa mantendo proporção)
function drawFace(g,st,o={}){
  buildFace(st,o);
  const Wc=g.canvas.width,Hc=g.canvas.height,now=performance.now()/1000;
  g.clearRect(0,0,Wc,Hc);g.imageSmoothingEnabled=false;
  const sc=Math.min(Wc/FW,Hc/FH),dw=FW*sc,dh=FH*sc;
  let dx=(Wc-dw)/2,dy=(Hc-dh)/2,rot=0;
  if(st.turbo){dx+=(Math.random()-.5)*Wc*.05;dy+=(Math.random()-.5)*Hc*.04;}
  if(st.e<18&&!st.sleep){dx+=(Math.random()-.5)*Wc*.03;}
  if(st.drunk)rot=Math.sin(now*1.7)*.12;
  const f=[];if(st.trip)f.push(`hue-rotate(${Math.floor(now*160)%360}deg) saturate(1.6)`);if(st.turbo)f.push('saturate(1.35) contrast(1.15)');if(st.e<18||st.crash)f.push('saturate(.6)');
  g.save();g.filter=f.length?f.join(' '):'none';
  g.translate(dx+dw/2,dy+dh/2);g.rotate(rot);g.drawImage(fbuf,-dw/2,-dh/2,dw,dh);g.restore();
  if(o.ring!==false&&!o.back){g.save();g.globalCompositeOperation='destination-over';g.fillStyle=faceRing(st);g.beginPath();g.ellipse(Wc/2,Hc/2,dw*.42,dh*.5,0,0,Math.PI*2);g.fill();g.restore();}
  if(st.sleep&&!o.back){g.fillStyle='#bfe0ff';g.strokeStyle='#0a1020';g.lineWidth=Math.max(2,Wc*.03);g.font=`bold ${Math.round(Hc*.2)}px 'Pixelify Sans',monospace`;g.textAlign='right';
    const zz=Math.floor(now*2)%2?'z Z':'Z z';g.strokeText(zz,Wc-1,Hc*.2);g.fillText(zz,Wc-1,Hc*.2);}
}
/* cabeçona na tela do jogo */
const headCv=$('head'),hc=headCv.getContext('2d');
function faceState(){return{e:P.energy,sono:P.sono||0,glasses:!!fx&&fx.disguise>0,turbo:!!fx&&fx.turbo>0,trip:!!fx&&fx.trip>0,drunk:!!fx&&fx.drunk>0,crash:!!fx&&fx.crash>0,burn:!!fx&&fx.burn>0,sleep:!!chairS||!!napS,spider:!!fx&&fx.spider>0};}
function renderHead(cx,cy){
  headCv.hidden=false;
  const sx=(P.x-cx)/W*100,sy=(P.y-cy-(P.jumpZ||0)-12+(chairS?2:0))/H*100;
  headCv.style.left=sx+'%';headCv.style.top=sy+'%';
  const back=P.dir==='up'&&!chairS&&!napS;
  drawFace(hc,faceState(),{back,helmet:P.outfit==='work'&&P.helmet,ring:false});
  const respira=!P.moving&&!chairS&&!napS&&!grab&&Math.sin(time*2.6)>.2; // parado, a cabeça sobe 1px junto com o peito
  const bob=(P.moving?Math.sin(P.anim*16)*3:0)-(respira?3.5:0),tilt=P.dir==='left'?-6:P.dir==='right'?6:0;
  headCv.style.transform=`translate(-50%,-100%) translateY(${bob}%) rotate(${tilt+bob*.8}deg)`;
  // atrás do casario do navio: corta o pedaço da cabeça que fica escondido
  let corte=0;const hx0=10*T+176;
  if(navioDX===0&&P.x>hx0-6&&P.x<hx0+60){const topo=P.x>hx0+16&&P.x<hx0+36?50*T+4-44:50*T+4-30;corte=(P.y-12)-topo;}
  const altH=headCv.offsetHeight*W/(cv.clientWidth||1);
  headCv.style.clipPath=corte>0&&altH>0?`inset(0 0 ${Math.min(100,corte/altH*100).toFixed(1)}% 0)`:'';
  const na=(state==='play'||state==='paused'||state==='over')?nightA():0;
  headCv.style.filter=`drop-shadow(1px 2px 0 rgba(0,0,0,.45))`+(na>.01?` brightness(${(1-na*.45).toFixed(2)})`:'');
}

/* ================= AUDIO ================= */
const DIFFS={facil:{nome:'Fácil',e:.7,ini:.85,call:1.4},normal:{nome:'Normal',e:1,ini:1,call:1},dificil:{nome:'Difícil',e:1.3,ini:1.15,call:.75}};
let diff='normal';try{const d=localStorage.getItem('svpc-dificuldade');if(DIFFS[d])diff=d;}catch(e){}
const DF=()=>DIFFS[diff];
let AC=null,MASTER=null,muted=false,volume=.8;try{const v=parseFloat(localStorage.getItem('svpc-volume'));if(v>=0&&v<=1)volume=v;}catch(e){}
function initAudio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){AC=null;}if(AC){MASTER=AC.createGain();MASTER.gain.value=volume;MASTER.connect(AC.destination);musInit();}}
function beep(f,d,type='square',v=.05,slide=0,delay=0){
  if(!AC||muted)return;const t=AC.currentTime+delay;const o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(MASTER);o.start(t);o.stop(t+d+.02);
}
let ultimaDerrota=-1e9; // pra não tocar o som de derrota 2x seguidas
const sfx={
  pick(){beep(660,.07);beep(990,.1,'square',.05,0,.07);},
  gulp(){beep(300,.08,'triangle',.08,180);beep(260,.08,'triangle',.08,160,.1);},
  sniff(){beep(1800,.25,'sawtooth',.03,300);beep(400,.35,'square',.04,1600,.25);},
  trip(){for(let i=0;i<6;i++)beep(300+i*120,.12,'sine',.05,0,i*.07);},
  hit(){beep(200,.25,'sawtooth',.07,60);},
  key(){beep(1400,.06,'square',.04);beep(1900,.06,'square',.04,0,.08);beep(1400,.06,'square',.04,0,.16);},
  horn(){beep(110,1.2,'sawtooth',.07);beep(82,1.2,'square',.05);},
  rip(){for(let i=0;i<5;i++)beep(800-i*90,.05,'square',.04,0,i*.04);},
  ring(){beep(880,.12,'square',.035);beep(660,.12,'square',.035,0,.15);},
  zzz(){beep(220,.2,'sine',.04,180);},
  alert(){beep(1200,.08,'square',.05);beep(1200,.08,'square',.05,0,.12);},
  lose(){ultimaDerrota=performance.now();if(mus)mus.duck=1.3;[392,330,262,196].forEach((f,i)=>beep(f,.25,'square',.05,0,i*.22));},
  win(){if(mus)mus.duck=1.2;[523,659,784,1046,784,1046].forEach((f,i)=>beep(f,.16,'square',.05,0,i*.13));},
  day(){beep(523,.1);beep(784,.15,'square',.05,0,.1);}
};

/* ================= MÚSICA DE FUNDO: chiptune feito na hora, uma trilha pra cada momento ================= */
let musicOn=true,mus=null;
// acordes (notas MIDI) e trilhas: 4 colcheias por compasso; na melodia 0 = pausa, -1 = segura a nota anterior
const MCH={C:[48,52,55],G7:[43,47,53],C7:[48,52,58],F:[41,45,48],Fm:[41,44,48],A7:[45,49,55],Dm:[50,53,57],Am:[45,48,52],E7:[40,44,50],
  Em:[40,43,47],D:[50,54,57],B7:[47,51,57],Gm7:[43,46,50],G:[43,47,50],D7:[50,54,60],Am7:[45,48,55],Dm7:[50,53,60],Cmaj7:[48,52,59],Bm:[47,50,54],A:[45,49,52],E:[40,44,47],B:[47,51,54],'C#m':[49,52,56]};
const MEL_RUA=[67,72,-1,76, 74,-1,71,67, 72,76,79,-1, 76,74,72,70, 69,72,77,-1, 76,-1,72,76, 74,77,74,71, 72,-1,0,67,
  69,-1,72,77, 80,-1,77,72, 79,-1,76,72, 73,76,79,76, 77,-1,74,69, 71,74,77,74, 72,76,72,67, 71,-1,74,0];
const CH_RUA=['C','G7','C','C7','F','C','G7','C','F','Fm','C','A7','Dm','G7','C','G7'];
const MUS_SONGS={
  menu:{bpm:74,spb:8,ch:['Bm','G','D','A','Bm','G','D','A'],drum:'reggae',bass:'reggae',lead:'triangle',lv:.075,
    mel:[0,0,74,-1,76,78,-1,-1, 76,-1,74,-1,71,-1,-1,0, 0,0,74,76,78,-1,81,78, 76,-1,-1,-1,0,0,0,0,
         0,0,78,-1,81,-1,78,76, 74,-1,76,-1,74,71,-1,-1, 0,69,71,74,76,-1,74,-1, 73,-1,-1,-1,69,-1,-1,0]},
  axe:{bpm:138,spb:8,ch:['E','B','C#m','A','E','B','C#m','A'],drum:'axe',bass:'axe',lead:'square',lv:.045,
    mel:[76,-1,78,80,-1,78,76,-1, 78,-1,-1,71,-1,-1,0,0, 73,-1,76,-1,80,-1,78,76, 78,-1,-1,-1,0,0,76,78,
         80,-1,83,-1,80,78,76,-1, 78,-1,80,-1,78,-1,71,-1, 73,76,78,80,-1,78,76,73, 76,-1,-1,-1,-1,0,0,0]},
  funk:{bpm:260,spb:16,ch:['Am','F','C','G'],drum:'funk',bass:'funk',lead:'sawtooth',lv:.032,
    mel:[76,0,0,76,0,0,72,0, 74,0,76,0,0,0,0,0, 77,0,0,77,0,0,76,0, 72,0,69,0,0,0,0,0,
         79,0,0,79,0,0,76,0, 74,0,72,0,0,0,76,0, 74,0,0,74,0,0,71,0, 67,0,0,0,0,0,0,0]},
  cogumelo:{bpm:176,ch:['C','F','G','C','C','Am','F','G'],drum:'fuga',bass:'alt',lead:'square',lv:.042,
    mel:[72,76,79,84, 81,77,72,77, 79,74,71,74, 72,-1,84,0, 76,79,76,72, 81,76,72,69, 77,81,84,81, 79,83,86,-1]},
  torcida:{bpm:104,ch:['C'],drum:'torcida',bass:'nada',lead:'square',lv:0,mel:[0,0,0,0,0,0,0,0]},
  rua:{bpm:128,ch:CH_RUA,mel:MEL_RUA,drum:'marcha',bass:'alt',lead:'square',lv:.04},
  bloco:{bpm:152,ch:CH_RUA,mel:MEL_RUA,drum:'bloco',bass:'alt',lead:'square',lv:.045},
  noite:{bpm:96,ch:['Am','Dm','E7','Am','Am','Dm','E7','Am'],drum:'suave',bass:'longo',lead:'triangle',lv:.07,
    mel:[69,-1,72,-1, 74,-1,77,-1, 76,-1,-1,71, 72,-1,-1,0, 76,-1,74,72, 77,-1,74,-1, 71,-1,68,71, 69,-1,-1,0]},
  sono:{bpm:70,ch:['Am','Dm','E7','Am','Am','Dm','E7','Am'],drum:'nada',bass:'longo',lead:'triangle',lv:.06,down:12,
    mel:[69,-1,72,-1, 74,-1,77,-1, 76,-1,-1,71, 72,-1,-1,0, 76,-1,74,72, 77,-1,74,-1, 71,-1,68,71, 69,-1,-1,0]},
  fuga:{bpm:168,ch:['Em','C','D','B7','Em','C','D','B7'],drum:'fuga',bass:'alt',lead:'square',lv:.035,
    mel:[76,76,0,79, 76,0,74,72, 74,74,0,78, 75,0,71,0, 76,79,83,79, 76,79,72,76, 74,78,81,78, 75,78,71,75]},
  praia:{bpm:120,ch:['F','Gm7','C7','F','F','Gm7','C7','F'],drum:'samba',bass:'alt',lead:'square',lv:.04,
    mel:[72,-1,77,-1, 79,77,74,-1, 76,-1,72,70, 69,-1,-1,72, 77,-1,81,-1, 79,-1,74,77, 76,79,76,72, 77,-1,-1,0]},
  boteco:{bpm:100,ch:['G','E7','Am','D7','G','E7','Am7','D7'],drum:'samba',bass:'alt',lead:'triangle',lv:.07,
    mel:[74,-1,71,74, 76,-1,80,-1, 81,-1,76,72, 74,72,69,-1, 79,-1,74,71, 80,-1,76,74, 72,76,79,76, 74,-1,-1,0]},
  festa:{bpm:112,ch:['Am','F','C','G','Am','F','C','G'],drum:'festa',bass:'colcheia',lead:'sawtooth',lv:.028,
    mel:[69,72,76,72, 77,72,69,72, 79,76,72,76, 79,74,71,74, 81,-1,79,76, 77,-1,76,72, 76,-1,72,67, 74,-1,-1,0]}
};
const MG_MUSICAS={altinha:'altinha.mp3',sinuca:'bambina.mp3',bar:'bar.mp3',bloco:'bloco-secreto.mp3',guitarra:'chefao.mp3',surf:'surf.mp3',labirinto:'becos.mp3'};
function musInit(){
  if(mus||!AC)return;
  const nb=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=20000;lp.connect(MASTER); // abafa a música nas conversas
  const out=AC.createGain();out.gain.value=0;out.connect(lp);
  mus={out,lp,lpF:20000,noise:nb,song:null,step:0,next:AC.currentTime+.15,chaseT:0,vol:0,duck:0};
  crowdInit();
  setInterval(musTick,80);
}
function mNote(n,t,d,type,v){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(n-69)/12);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(mus.out);o.start(t);o.stop(t+d+.03);}
function mNoise(t,d,v,hp){const sr=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();sr.buffer=mus.noise;fl.type='highpass';fl.frequency.value=hp;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);sr.connect(fl);fl.connect(g);g.connect(mus.out);sr.start(t,Math.random()*.3);sr.stop(t+d+.02);}
function mSurdo(t,v){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(48,t+.18);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(g);g.connect(mus.out);o.start(t);o.stop(t+.32);}
// som gravado do Maracanã (áudio enviado pelo João), em loop enquanto ele está no estádio
const MARACA_AUDIO=SVPC_ASSETS.MARACA_AUDIO;
function maracaAudioLoad(){try{const bin=atob(MARACA_AUDIO),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  const p=AC.decodeAudioData(u.buffer,b=>{mus.maracaBuf=b;},()=>{});if(p&&p.catch)p.catch(()=>{});}catch(e){}}
function maracaAudioTick(on){
  const c=mus.crowd;if(!c||!mus.maracaBuf)return;
  if(on&&!c.rec){const src=AC.createBufferSource(),g=AC.createGain();src.buffer=mus.maracaBuf;src.loop=true;src.loopStart=.3;src.loopEnd=Math.max(1,mus.maracaBuf.duration-.6);
    g.gain.value=0;src.connect(g);g.connect(MASTER);src.start(AC.currentTime,.3);g.gain.setTargetAtTime(4.5,AC.currentTime,.15);c.rec={src,g};}
  else if(!on&&c.rec){const r=c.rec;c.rec=null;r.g.gain.cancelScheduledValues(AC.currentTime);r.g.gain.setTargetAtTime(0,AC.currentTime,.05);setTimeout(()=>{try{r.src.stop();}catch(e){}r.g.disconnect();},500);}
}
// música do final (Eva ao vivo, 1m00–1m15): toca em loop depois de vencer o chefão e criar o bloco dele
const FINAL_AUDIO=SVPC_ASSETS.FINAL_AUDIO;
function recDecode(b64,cb){if(!b64)return;try{const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const p=AC.decodeAudioData(u.buffer,cb,()=>{});if(p&&p.catch)p.catch(()=>{});}catch(e){}}
// música da tela inicial e do Bloco Secreto (reggae do Pixabay, enviada pelo João): repete com fade no fim
const INICIO_AUDIO=SVPC_ASSETS.INICIO_AUDIO;
function recLoop(buf,dest,lvl,fade,off=0){const st={on:true,srcs:[],timer:0};
  const play=t0=>{if(!st.on)return;const src=AC.createBufferSource(),g=AC.createGain(),o=off,d=buf.duration-o;off=0;src.buffer=buf;src.connect(g);g.connect(dest);
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(lvl,t0+.4);g.gain.setValueAtTime(lvl,t0+d-fade);g.gain.linearRampToValueAtTime(0,t0+d);
    src.start(t0,o);src.stop(t0+d+.05);st.srcs.push(src);if(st.srcs.length>3)st.srcs.shift();st.timer=setTimeout(()=>play(t0+d),Math.max(0,(t0+d-AC.currentTime-1.5)*1000));};
  play(AC.currentTime+.12);
  st.stop=()=>{st.on=false;clearTimeout(st.timer);for(const x of st.srcs){try{x.stop();}catch(e){}}};return st;}
// música da festa (funk do Pixabay, enviada pelo João)
const FESTA_AUDIO=SVPC_ASSETS.FESTA_AUDIO;
function crowdInit(){
  const len=AC.sampleRate*2,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);let lp=0;
  for(let i=0;i<len;i++){lp=lp*.6+(Math.random()*2-1)*.4;d[i]=lp*(.7+.3*Math.sin(i/len*Math.PI*14));}
  const src=AC.createBufferSource();src.buffer=buf;src.loop=true;
  const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=700;bp.Q.value=.6;
  const g=AC.createGain();g.gain.value=0;src.connect(bp);bp.connect(g);g.connect(MASTER);src.start();
  mus.crowd={g,bp,lvl:0,goal:false,rec:null};
  maracaAudioLoad();fetch('musicas/final.mp3').then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>AC.decodeAudioData(b)).then(buf=>{mus.finalBuf=buf;}).catch(()=>recDecode(FINAL_AUDIO,b=>{mus.finalBuf=b;mus.finalCurta=true;})); // Eva inteira (o trecho do loop é escolhido na hora de tocar)recDecode(INICIO_AUDIO,b=>{mus.inicioBuf=b;});recDecode(FESTA_AUDIO,b=>{mus.festaBuf=b;});
  // músicas dos desafios (mp3 na pasta musicas/, enviadas pelo João)
  mus.mg={};for(const [k,arq] of Object.entries(MG_MUSICAS))fetch('musicas/'+arq).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>AC.decodeAudioData(b)).then(buf=>{mus.mg[k]=buf;}).catch(()=>{});
}
function crowdTick(){
  const c=mus.crowd;if(!c)return;const m=state==='maraca'?mg:null;
  let lvl=0,fq=700;
  maracaAudioTick(!!m&&!muted);const rec=!!c.rec;
  if(m&&!muted){lvl=rec?0:.22;if(m.uuhT>0){lvl=rec?.3:.5;fq=500;}if(m.result==='win'){lvl=rec?.5:.75;fq=900;}if(m.caught>0){lvl=rec?.2:.35;fq=600;}}
  if(Math.abs(lvl-c.lvl)>.01){c.lvl=lvl;c.g.gain.setTargetAtTime(lvl,AC.currentTime,lvl>.4?.08:.4);c.bp.frequency.setTargetAtTime(fq,AC.currentTime,.2);}
  if(m&&m.result==='win'&&!c.goal){c.goal=true;for(let i=0;i<14;i++)mNoise(AC.currentTime+i*.09,.12,.05,2600);} // palmas no gol
  if(!m||!m.result)c.goal=false;
  if(m&&!muted&&Math.random()<.06)mNoise(AC.currentTime+Math.random()*.1,.05,.012,3000); // gritos e palmas soltos
}
// qual trilha combina com o momento
function musWant(){
  if(state==='tempo'||state==='capitulo'||state==='virando')return null; // Música do Tempo, troca de capítulo e transformação: só os efeitos
  if(state==='labirinto'&&mg&&(mg.phase==='ensina'||mg.phase==='repete'||mg.result))return null; // silêncio pra aprender a Música do Tempo
  if(mus.mg&&mus.mg[state])return 'mg_'+state; // desafio com música própria
  if(state==='title'||state==='cut'&&cutKind==='intro')return mus.inicioBuf?'inicio':'menu';
  if(state==='over')return finalStage>=3?(mus.finalBuf?'final':'axe'):null; // venceu: axé; perdeu: silêncio
  if(state==='guitarra')return null; // a guitarra do Jamal tem o próprio ritmo
  if(state==='maraca')return mus.maracaBuf?null:'torcida'; // com o som gravado, sem batucada por cima
  if(state==='altinha'||state==='surf')return 'praia';
  if(state==='bloco')return mus.inicioBuf?'blocoRec':'bloco';
  if(state==='bar'||state==='sinuca')return 'boteco';
  if(state==='festa')return mus.festaBuf?'festaRec':'funk';
  if(state==='mglost')return null; // perdeu o desafio: silêncio e o jingle de fim
  if(state==='paused')return mus.song;
  if(state==='cut'&&cutKind==='sax')return nightA()>.4?'noite':'rua'; // cena do sax do Bloco Secreto: ainda não é a hora do Eva
  if(finalStage>=2||state==='cut')return mus.finalBuf?'final':'axe'; // venceu o Jamal: Eva até o barco
  if(state==='play'&&nightA()>.15)return 'noite'; // escureceu: só a música da noite (sem fuga, cogumelo ou sono por cima)
  if(beg&&state==='play')return mus.song&&!['fuga','cogumelo'].includes(mus.song)?mus.song:nightA()>.4?'noite':'rua'; // conversa: trilha tranquila
  const chase=!!grab||(mom&&mom.chasing&&dist(mom,P)<220)||taxis.some(c=>c.chase);
  if(chase)mus.chaseT=3;
  if(mus.shroomT>0)return 'cogumelo';
  if(mus.chaseT>0)return 'fuga';
  if(P.energy<25||P.sono>=75)return 'sono'; // energia baixa ou barra de sono quase cheia
  return nightA()>.4?'noite':'rua';
}
function musTick(){
  if(!AC||!mus)return;
  const want=musWant();
  if(want!==mus.song){ // troca imediata: a trilha velha é cortada antes da nova começar
    // nunca duas músicas juntas: a trilha velha zera e é desligada na hora
    const old=mus.out,now=AC.currentTime;old.gain.cancelScheduledValues(now);old.gain.setValueAtTime(0,now);try{old.disconnect();}catch(e){}
    mus.out=AC.createGain();mus.out.gain.value=0;mus.out.connect(mus.lp);mus.vol=-1;mus.song=want;mus.step=0;mus.next=now+.12;
    if(mus.rec){const r=mus.rec;mus.rec=null;try{r.stop();}catch(e){}}
    if(want&&want.startsWith('mg_'))mus.rec=recLoop(mus.mg[want.slice(3)],mus.out,.8,2.5);
    if(want==='inicio'&&mus.inicioBuf)mus.rec=recLoop(mus.inicioBuf,mus.out,.8,2.5);
    if(want==='festaRec'&&mus.festaBuf)mus.rec=recLoop(mus.festaBuf,mus.out,.75,2.5);
    if(want==='blocoRec'&&mus.inicioBuf)mus.rec=recLoop(mus.inicioBuf,mus.out,.8,2.5,20);
    if(want==='final'&&mus.finalBuf){const src=AC.createBufferSource(),g=AC.createGain();src.buffer=mus.finalBuf;src.loop=true;g.gain.value=.6;src.connect(g);g.connect(mus.out);
      if(!mus.finalCurta&&mus.finalBuf.duration>80){src.loopStart=55;src.loopEnd=87;src.start(now+.12,55);}else src.start(now+.12); // Eva do 0:55 ao 1:27 em loop
      mus.rec=src;}}
  mus.duck=Math.max(0,mus.duck-.08);if(state==='play'){mus.shroomT=Math.max(0,(mus.shroomT||0)-.08);mus.chaseT=Math.max(0,mus.chaseT-.08);}
  const conversa=!!beg&&state==='play';
  const vol=(!musicOn||muted||!want||mus.duck>0)?0:state==='paused'?.22:conversa?.3:.55;
  const fq=conversa?900:20000;if(mus.lpF!==fq){mus.lp.frequency.setTargetAtTime(fq,AC.currentTime,.2);mus.lpF=fq;}
  if(Math.abs(vol-mus.vol)>.01){const now=AC.currentTime;mus.out.gain.cancelScheduledValues(now);mus.out.gain.setTargetAtTime(vol,now+(mus.vol<0?.1:0),vol===0?.03:.12);mus.vol=vol;}
  crowdTick();
  if(mus.next<AC.currentTime)mus.next=AC.currentTime+.05;
  const ahead=AC.currentTime+.3;
  while(mus.next<ahead){
    const S=MUS_SONGS[mus.song],dur=60/((S&&S.bpm)||120)/2;
    if(S&&vol>0)musStep(S,mus.step,mus.next,dur);
    mus.next+=dur;mus.step=S?(mus.step+1)%S.mel.length:0;
  }
}
function musStep(S,i,t,dur){
  const spb=S.spb||4,bar=Math.floor(i/spb),b=i%spb,ch=MCH[S.ch[bar%S.ch.length]],dn=S.down||0;
  const n=S.mel[i];if(n>0){let len=1;while(S.mel[(i+len)%S.mel.length]===-1&&len<8)len++;mNote(n-dn,t,len*dur*.92,S.lead,S.lv);}
  // baixo
  if(S.bass==='alt'){if(b===0)mNote(ch[0]-12-dn,t,dur*1.7,'triangle',.15);if(b===2)mNote(ch[0]-5-dn,t,dur*1.7,'triangle',.13);}
  else if(S.bass==='longo'){if(b===0)mNote(ch[0]-12-dn,t,dur*3.8,'triangle',.13);}
  else if(S.bass==='reggae'){const BR={1:[0,2.6],3:[0,.8],4:[2,1.6],6:[1,.8],7:[0,.8]}[b];if(BR)mNote(ch[BR[0]]-12,t,dur*BR[1],'triangle',.2);}
  else if(S.bass==='axe'){const BA={0:[0,-12],3:[2,-12],4:[0,-12],6:[0,0]}[b];if(BA)mNote(ch[BA[0]]+BA[1],t,dur*1.4,'triangle',.18);}
  else if(S.bass==='funk'){if([0,3,6,10,13].includes(b))mNote(ch[0]-12,t,dur*2.4,'sine',.24);}
  else if(S.bass==='colcheia')mNote(ch[0]-12,t,dur*.8,'triangle',.13);
  // acompanhamento: o "pá" da marchinha nos contratempos, ou acorde longo nas lentas
  if(S.drum==='marcha'||S.drum==='bloco'||S.drum==='samba'){if(b===1||b===3)for(const c of ch)mNote(c+12,t,dur*.45,'square',.011);}
  else if(S.drum==='suave'||S.drum==='nada'){if(b===0)for(const c of ch)mNote(c+12-dn,t,dur*3.6,'triangle',.022);}
  else if(S.drum==='festa'){mNote(ch[i%3]+24,t,dur*.5,'square',.012);}
  else if(S.drum==='reggae'){if(b===2||b===6)for(const c of ch){mNote(c+12,t,dur*.35,'square',.016);mNote(c+24,t,dur*.25,'triangle',.02);}if(b===3||b===7)for(const c of ch)mNote(c+12,t,dur*.3,'triangle',.012);}
  else if(S.drum==='fuga'){if(b===0)for(const c of ch)mNote(c+12,t,dur*.6,'sawtooth',.012);}
  // percussão
  const TAM=[1,0,1,1,0,1,1,0];
  if(S.drum==='marcha'||S.drum==='bloco'){if(b===2)mSurdo(t,.34);if(b===0)mSurdo(t,.14);if(TAM[i%8])mNoise(t,.045,.05,4200);mNoise(t,.03,.018,7500);
    if(S.drum==='bloco'&&b===3)mNoise(t,.08,.05,1400);}
  else if(S.drum==='samba'){if(b===2)mSurdo(t,.3);if(b===0)mSurdo(t,.1);if(TAM[(i+3)%8])mNoise(t,.04,.045,4800);mNoise(t,.025,.016,8000);}
  else if(S.drum==='suave'){if(b===0&&bar%2===0)mSurdo(t,.1);if(b%2)mNoise(t,.03,.008,7000);}
  else if(S.drum==='fuga'){if(b%2===0)mSurdo(t,.3);else mNoise(t,.09,.06,1500);mNoise(t,.02,.02,8000);}
  else if(S.drum==='axe'){if(b===4)mSurdo(t,.36);if(b===0)mSurdo(t,.2);if(b===2||b===6)for(const c of ch)mNote(c+12,t,dur*.4,'square',.014);
    if([2,3,6].includes(b))mNoise(t,.05,.06,2200);if([3,5,7].includes(b))mNoise(t,.04,.035,3600);mNoise(t,.03,.02,8000);}
  else if(S.drum==='funk'){if([0,3,6,10,13].includes(b))mSurdo(t,.4);if(b===4||b===12)mNoise(t,.1,.07,1200);mNoise(t,.02,b%2?.008:.016,8500);}
  else if(S.drum==='torcida'){if(b===0||b===2)mSurdo(t,b===0?.3:.2);if(b===3)mSurdo(t,.12);if(b%2)mNoise(t,.05,.03,2400);}
  else if(S.drum==='reggae'){if(b===4){mSurdo(t,.32);mNoise(t,.05,.05,2600);}mNoise(t+(b%2?dur*.12:0),.025,b%2?.018:.01,8000);if(b===7&&bar%4===3)mNoise(t,.06,.03,3000);}
  else if(S.drum==='festa'){if(b%2===0)mSurdo(t,.32);else mNoise(t,.12,.03,6000);}
}

/* ================= INPUT ================= */
const keys=new Set();let actionQ=false,declineQ=false,lastAxis='x';
const isTouch=matchMedia('(pointer:coarse)').matches;
const KL=isTouch?'A':'ESPAÇO';
document.addEventListener('pointerdown',()=>initAudio());
// som só com o jogo na frente: escondeu a aba, minimizou ou foi pra outra janela = som para (e o jogo pausa)
function somForaDaTela(){if(AC&&AC.state==='running')AC.suspend();if(state==='play')pause();}
function somDeVolta(){if(AC&&AC.state==='suspended'&&!document.hidden)AC.resume();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)somForaDaTela();else somDeVolta();});
window.addEventListener('pagehide',somForaDaTela);
window.addEventListener('blur',somForaDaTela);
window.addEventListener('focus',somDeVolta);
window.addEventListener('keydown',e=>{initAudio();
  const k=e.code;
  // telas (menu, regras, pausa, fim): espaço ou Enter aperta o botão em destaque (JOGAR, CONTINUAR...)
  if(!screenEl.hidden&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)&&!e.target.closest?.('input')){const bs=[...screenEl.querySelectorAll('button')];if(bs.length){e.preventDefault();const i=bs.indexOf(document.activeElement),d=k==='ArrowUp'||k==='ArrowLeft'?-1:1;bs[((i<0?0:i+d)+bs.length)%bs.length].focus({preventScroll:true});}return;}
  if(!screenEl.hidden&&(k==='Space'||k==='Enter'||k==='NumpadEnter')){e.preventDefault();if(e.repeat)return;const fo=document.activeElement,b=fo&&fo.tagName==='BUTTON'&&screenEl.contains(fo)?fo:screenEl.querySelector('button');if(b)b.click();return;}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(k)&&state!=='title')e.preventDefault();
  if(e.repeat){keys.add(k);return;}
  if(state==='mglost'&&(k==='Space'||k==='Enter')){const b=screenEl.querySelector('[data-act="mgRetry"]');if(b){b.click();actionQ=false;return;}} // perdeu o desafio: ESPAÇO tenta de novo
  keys.add(k);
  if(k==='Space'||k==='KeyE'||k==='Enter')actionQ=true;
  if(k==='KeyR')declineQ=true;
  if(k==='KeyF'&&!isTouch&&!e.repeat)telaCheia();
  if(k==='ArrowLeft'||k==='ArrowRight'||k==='KeyA'||k==='KeyD')lastAxis='x';else if(k==='ArrowUp'||k==='ArrowDown'||k==='KeyW'||k==='KeyS')lastAxis='y';
  if(beg&&state==='play'&&beg.fase==='pergunta'&&['ArrowUp','ArrowDown','KeyW','KeyS'].includes(k)){beg.sel=1-beg.sel;marcaSel();}
  if(k==='KeyQ'&&state==='play'&&fx&&fx.spider>0)shootWeb();
  if(k==='ArrowUp'||k==='KeyW')jumpQ=true;
  if(k==='ArrowLeft'||k==='KeyA')laneQ=-1;if(k==='ArrowRight'||k==='KeyD')laneQ=1;
  if(k==='KeyM'){muted=!muted;toast(muted?'Som desligado':'Som ligado');}
  if(k==='Escape'&&MG_STATES.includes(state)){mgQuit();return;}
  if(state==='festa'){festaKey(k);if(k.startsWith('Digit'))return;}
  if(state==='guitarra'){const ln=GT_KEYS.findIndex(a=>a.includes(k));if(ln>=0)gtPress(ln);return;}
  if(state==='tempo'){const ln=K7890.findIndex(a=>a.includes(k));if(ln>=0)tempoPress(ln);if(k==='Escape')tempoDesiste();return;}
  if(state==='labirinto'&&mg&&mg.phase==='repete'){const ln=K7890.findIndex(a=>a.includes(k));if(ln>=0){labPress(ln);return;}}
  if(k==='KeyP'||k==='Escape'){if(state==='play')pause();else if(state==='paused')resume();else if(state==='cut'&&cutKind==='intro')skipIntro();}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(state==='play')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')pause();});
function takeAction(){const a=actionQ;actionQ=false;return a;}
const joy={x:0,y:0,id:null,ox:0,oy:0};
const stick=$('stick'),sBase=$('stickBase'),knob=sBase.querySelector('i');
function moveJoy(e){const Rr=sBase.clientWidth*.4;let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const d=Math.hypot(dx,dy);if(d>Rr){dx*=Rr/d;dy*=Rr/d;}joy.x=dx/Rr;joy.y=dy/Rr;knob.style.transform=`translate(${dx}px,${dy}px)`;}
// o analógico nasce onde o dedo encosta
stick.addEventListener('pointerdown',e=>{if(joy.id!==null)return;joy.id=e.pointerId;try{stick.setPointerCapture(e.pointerId);}catch(_){}const r=stick.getBoundingClientRect();joy.ox=e.clientX;joy.oy=e.clientY;
  sBase.style.left=(e.clientX-r.left)+'px';sBase.style.top=(e.clientY-r.top)+'px';stick.classList.add('on');initAudio();moveJoy(e);e.preventDefault();});
stick.addEventListener('pointermove',e=>{if(e.pointerId===joy.id)moveJoy(e);});
const endJoy=e=>{if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;knob.style.transform='';sBase.style.left='';sBase.style.top='';stick.classList.remove('on');}};
stick.addEventListener('pointerup',endJoy);stick.addEventListener('pointercancel',endJoy);
let aHeld=false,runHeld=false;
$('btnA').addEventListener('pointerdown',e=>{e.preventDefault();actionQ=true;aHeld=true;initAudio();});
$('btnW').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();if(state==='play'&&fx&&fx.spider>0)shootWeb();});
const ICON_RUN='<svg viewBox="0 0 24 24" fill="none" stroke="#1a1030" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="4.2" r="2.4" fill="#1a1030" stroke="none"/><path stroke-width="3.2" d="M15.2 8.4 11.6 14"/><path stroke-width="2.4" d="M15 8.6 18.4 11.2 21 9.6M14.6 8.8 10.8 8.6 8.6 11"/><path stroke-width="2.6" d="M11.6 14 15.4 16.2 16.6 21.4M11.6 14 8.6 17.6 4.4 17.2"/><path stroke-width="1.5" d="M2 7.2H7.4M1 11.2H6M2.4 15.2H5.4M1 19.6H4"/></svg>';
const ICON_ENTRA='<svg viewBox="0 0 24 24" fill="none" stroke="#1a1030" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3.5H19.5V20.5H13"/><path d="M3 12H14.5M10.5 7.5 15 12 10.5 16.5"/></svg>';
const ICON_DORME='<svg viewBox="0 0 24 24" fill="none" stroke="#1a1030" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8H11L4 17H11"/><path stroke-width="2" d="M14 4H19.5L14 10.5H19.5"/></svg>';
const ICON_FALA='<svg viewBox="0 0 24 24" fill="none" stroke="#1a1030" stroke-width="2.2" stroke-linejoin="round"><path d="M3.5 5H20.5V15.5H11L6 19.5V15.5H3.5Z"/><circle cx="8" cy="10.3" r=".9" fill="#1a1030"/><circle cx="12" cy="10.3" r=".9" fill="#1a1030"/><circle cx="16" cy="10.3" r=".9" fill="#1a1030"/></svg>';
const ICONS={run:ICON_RUN,entra:ICON_ENTRA,dorme:ICON_DORME,fala:ICON_FALA};
const ICON_SURF='<svg viewBox="0 0 24 24" fill="none" stroke="#1a1030" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.4" cy="4.4" r="2.3" fill="#1a1030" stroke="none"/><path stroke-width="3" d="M12.6 7.6 10.8 12.2"/><path stroke-width="2.2" d="M12.2 8.4 16.4 10 19.8 8.8M12 8.6 8.2 8.2 5.8 10.2"/><path stroke-width="2.4" d="M10.8 12.2 14.6 13.4 14.8 16.2M10.8 12.2 8.4 14.4 8.8 17"/><path fill="#1a1030" stroke="none" d="M2.4 18.6C8 16.2 16 15.4 22.6 16.8 17 19.2 8 20.2 2.4 18.6Z"/><path stroke-width="1.4" d="M1.2 6.4H4.6M.8 10.4H3.8M1.4 14.2H3.6"/></svg>';
// ícones dos botões de toque, no estilo do bonequinho correndo
const SVG=(b,c='#1a1030')=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const ICON_CHUTA=SVG('<g transform="rotate(35 13 13)"><path fill="#1a1030" stroke="none" d="M8.2 9.6C9.4 8.8 11 9 12 9.8L14 11.6C15.6 12.8 18 13 20.4 13.4 22 13.7 22.8 15 22.4 16.4L22 17.6H8.4C7.4 17.6 7 16.8 7.2 15.8Z"/><path stroke-width="1.6" d="M1.4 10.6H5M.8 13.8H4.6M1.4 17H4.8"/></g>'); // tênis chutando pra baixo, traços na direção da sola
const ICON_PULA=SVG('<circle cx="14.4" cy="3.2" r="2.3" fill="#1a1030" stroke="none"/><path stroke-width="3" d="M13.4 6.4 11.6 11.6"/><path stroke-width="2.3" d="M13.2 7 16.8 5.2 18.2 2.6M13 7.2 9.6 5.8 7.8 3.6"/><path stroke-width="2.5" d="M11.6 11.6 15.2 13 13.8 16.4M11.6 11.6 8.6 13.8 6.2 13.4"/><path stroke-width="1.6" d="M8.6 18.6V22.4M11.4 19V23M14.2 18.6V22.4"/>');
const ICON_BEBE=SVG('<path stroke-width="2.2" d="M6.4 3.6H17.6L16 21H8Z"/><path fill="#1a1030" stroke="none" d="M7.5 9H16.5L15.5 20H8.5Z"/>'); // um copo
const ICON_SOLTA=SVG('<circle cx="12" cy="4.4" r="2.3" fill="#1a1030" stroke="none"/><path stroke-width="3" d="M12 7.6V13.4"/><path stroke-width="2.3" d="M12 8.4 6.6 5.6M12 8.4 17.4 5.6"/><path stroke-width="2.5" d="M12 13.4 8.4 20.6M12 13.4 15.6 20.6"/><path stroke-width="1.6" d="M2.6 3 4.6 4.6M21.4 3 19.4 4.6M1.6 9.6H4.2M22.4 9.6H19.8M2.8 15.6 4.8 14.4M21.2 15.6 19.2 14.4"/>');
// taco da bambina: traço preto grosso, com a pontinha separada (o anel)
const ICON_FORCA=SVG('<path stroke-width="3.2" d="M3.4 20.6 16 8"/><path stroke-width="2.4" d="M17.6 6.4 19.8 4.2"/>');
const ICON_TACAR=SVG('<path stroke-width="3.2" d="M2.4 21.6 12 12"/><path stroke-width="2.4" d="M13.6 10.4 15 9"/><circle cx="18.4" cy="5.6" r="3.2" fill="#1a1030" stroke="none"/>');
const ICON_ESCOLHE=SVG('<circle cx="12" cy="17.4" r="4" fill="#1a1030" stroke="none"/><path stroke-width="2.4" d="M12 2.4V10M8.6 7 12 10.4 15.4 7"/>');
const ICON_ESPERA=SVG('<path stroke-width="2.2" d="M6 2.8H18M6 21.2H18M7.4 2.8C7.4 8 12 9.6 12 12 12 14.4 7.4 16 7.4 21.2M16.6 2.8C16.6 8 12 9.6 12 12 12 14.4 16.6 16 16.6 21.2"/><path fill="#1a1030" stroke="none" d="M9 20.4C9.6 17.6 12 16.6 12 15.4 12 16.6 14.4 17.6 15 20.4Z"/>');
const ICON_OK=SVG('<path fill="#1a1030" stroke="none" d="M8 4.6V19.4L19.4 12Z"/>');
const ICON_TOQUE=SVG('<path stroke-width="1.6" d="M7.6 6.6A5.2 5.2 0 0 1 16.4 6.6M5.4 4.4A8.4 8.4 0 0 1 18.6 4.4"/><path fill="#1a1030" stroke-width="1.4" d="M10.6 17.4V8.6A1.4 1.4 0 0 1 13.4 8.6V13.2L17.6 14A1.8 1.8 0 0 1 19 16L18.4 21.6H11.6L7.2 17.2A1.3 1.3 0 0 1 9 15.4Z"/>');
const ICON_SAIR=SVG('<path stroke-width="2.4" d="M11 3.5H4.5V20.5H11"/><path stroke-width="2.4" d="M9 12H20.5M16.5 7.5 21 12 16.5 16.5"/>');
const ICON_BTN={run:ICON_RUN,entra:ICON_ENTRA,dorme:ICON_DORME,fala:ICON_FALA,surf:ICON_SURF,chuta:ICON_CHUTA,pula:ICON_PULA,bebe:ICON_BEBE,solta:ICON_SOLTA,forca:ICON_FORCA,tacar:ICON_TACAR,escolhe:ICON_ESCOLHE,espera:ICON_ESPERA,ok:ICON_OK,toque:ICON_TOQUE};
function setIc(el,k){if(el.dataset.ic===k)return;el.dataset.ic=k;el.innerHTML=ICON_BTN[k];el.classList.remove('word');}
const ICON_WEB='<svg viewBox="0 0 12 12" fill="none" stroke="#1a1030" stroke-width="1"><path d="M6 0V12M0 6H12M1.8 1.8L10.2 10.2M10.2 1.8L1.8 10.2"/><circle cx="6" cy="6" r="2"/><circle cx="6" cy="6" r="4.2"/></svg>';
for(const ev of ['gesturestart','gesturechange'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false}); // sem zoom de pinça no iPhone
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
{let ultToque=0;document.addEventListener('touchend',e=>{const ag=Date.now();if(ag-ultToque<350)e.preventDefault();ultToque=ag;},{passive:false});} // sem zoom de duplo toque (iPhone)
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
$('btnW').innerHTML=ICON_WEB;$('btnC').innerHTML=ICON_RUN;$('btnX').innerHTML=ICON_SAIR;$('btnX').setAttribute('aria-label','Sair do desafio');
$('btnC').addEventListener('pointerdown',e=>{e.preventDefault();runHeld=true;initAudio();});
for(const ev of ['pointerup','pointercancel','pointerleave'])$('btnC').addEventListener(ev,()=>{runHeld=false;});
for(const ev of ['pointerup','pointercancel','pointerleave'])$('btnA').addEventListener(ev,()=>{aHeld=false;});
$('decline').addEventListener('click',()=>{declineQ=true;});
$('beg').addEventListener('click',e=>{if(!e.target.closest('button'))actionQ=true;});$('bgSim').addEventListener('click',()=>escolheResposta(0));$('bgNao').addEventListener('click',()=>escolheResposta(1));
$('bgSim').addEventListener('pointerenter',()=>{if(beg){beg.sel=0;marcaSel();}});$('bgNao').addEventListener('pointerenter',()=>{if(beg){beg.sel=1;marcaSel();}});
$('dialog').addEventListener('click',()=>{actionQ=true;});
// cenas (intro, bloco, final): tocar/clicar em qualquer lugar da tela passa a fala
$('game').addEventListener('pointerdown',e=>{if(state==='cut'&&!e.target.closest('button,.phone'))actionQ=true;});
$('nap').addEventListener('pointerdown',()=>{actionQ=true;});
if(isTouch){$('touch').hidden=true;$('declineKey').textContent='';$('bgMais').textContent='toque ▸';$('napHint').textContent='Toque em A quando o marcador estiver no verde';document.body.classList.add('mobile');}
/* ---- controles de toque por desafio ---- */
let touchIx=0,touchMode='';
function holdBtn(id,v){const b=$(id);
  b.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();if(state==='bloco')laneQ=v;else touchIx=v;});
  for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,()=>{touchIx=0;});}
holdBtn('btnL',-1);holdBtn('btnR',1);
$('btnB').addEventListener('pointerdown',e=>{e.preventDefault();jumpQ=true;});
$('btnP').addEventListener('click',()=>{if(state==='play')pause();});
$('btnX').addEventListener('click',()=>{if(MG_STATES.includes(state))mgQuit();});
// Bloco: deslizar pros lados troca de faixa, tocar pula (sem botões na tela)
let swipe=null;const gameEl=$('game');
function aimAt(e){if(!mg||!mg.balls||mg.phase==='roll')return;const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H,c=mg.balls.find(b=>b.cue);
  if(c&&Math.hypot(x-c.x,y-c.y)>6)mg.ang=Math.atan2(y-c.y,x-c.x);}
gameEl.addEventListener('pointerdown',e=>{if(!isTouch||e.target.closest('button,#stick,.festa'))return;swipe={x:e.clientX,y:e.clientY};
  // bambina: só quando o Markin escolhe qual bola dele cai, dá pra tocar direto na bola
  if(state==='sinuca'&&mg&&mg.phase==='pick'){const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;const minhas=bbMinhasNaMesa(mg);let bi=-1,bd=14;minhas.forEach((b,i)=>{const dd=Math.hypot(b.x-x,b.y-y);if(dd<bd){bd=dd;bi=i;}});if(bi>=0){mg.pickI=bi;mg.pickTap=true;}}}); // na bambina tocar na mesa não faz nada: só os botões
// Guitarra: tocar (ou clicar) na coluna da nota
gameEl.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,ln=[0,1,2,3].find(i=>Math.abs(x-gtLaneX(i))<16);
  if(state==='tempo'&&tempoS){initAudio();if(tempoS.phase==='pergunta'){if(x<W/2)actionQ=true;else tempoDesiste();}else if(ln!==undefined)tempoPress(ln);e.preventDefault();return;}
  if(state==='labirinto'&&mg){if(mg.phase==='repete'&&ln!==undefined)labPress(ln);else if(mg.phase==='fala')actionQ=true;
    else if(mg.phase==='conversa'&&mg.cv){if(mg.cv.fase==='escolha'){const y=(e.clientY-r.top)/r.height*H,ls=wrapTxt('x',40);const top=118-26+16+11*wrapTxt(mg.cv.g.falas[mg.cv.g.falas.length-1].join(': '),40).length-8;const i=y<top+12?0:1;mg.cv.sel=i;labEscolhe(i);}else actionQ=true;}return;}
  if(state==='virando'){actionQ=true;return;}});
gameEl.addEventListener('pointerdown',e=>{if(state!=='guitarra'||e.target.closest('button'))return;initAudio();if(mg&&mg.phase!=='play'){actionQ=true;return;}const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W;
  let best=0,bd=1e9;for(let i=0;i<4;i++){const d=Math.abs(x-gtLaneX(i));if(d<bd){bd=d;best=i;}}if(bd<60)gtPress(best);e.preventDefault();});
gameEl.addEventListener('pointerup',e=>{if(!swipe)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;
  if(state==='bloco'){if(Math.abs(dx)>28&&Math.abs(dx)>Math.abs(dy))laneQ=dx>0?1:-1;else jumpQ=true;}});
function updTouchUI(){
  if(!isTouch)return;
  const mode=state==='maraca'&&mg&&mg.phase==='sneak'?'maracaS':MG_STATES.includes(state)?state:state==='play'?(beg?'none':grab?'grab':'play'):(state==='cut'&&cutKind==='intro')?'cut':'none';
  $('btnW').hidden=!(isTouch&&mode==='play'&&fx&&fx.spider>0);
  if(mode==='sinuca'&&mg)setIc($('btnA'),mg.phase==='pick'?'escolhe':mg.turn==='pc'?'espera':mg.phase==='power'?'tacar':'forca');
  if(mode==='play'&&touchMode==='play'){const ic=!nearK?'toque':nearK==='bus'||nearK==='chair'?'dorme':nearK==='npc'?'fala':'entra';
    setIc($('btnA'),ic);$('btnA').classList.toggle('acao',ic!=='toque');$('btnA').hidden=ic==='toque';} // sem nada perto, o botão de ação some
  if(mode==='maracaS'&&mg)setIc($('btnA'),mg.me.x>=MC_BURACO?'pula':'run');
  if(mode===touchMode)return;touchMode=mode;touchIx=0;
  const show=(id,v)=>{$(id).hidden=!v;};
  $('touch').hidden=mode==='none'||mode==='festa';$('touch').dataset.mode=mode;
  show('stick',mode==='play'||mode==='altinha'||mode==='maraca'||mode==='maracaS'||mode==='surf'||mode==='labirinto');
  const lr=['bar','sinuca'].includes(mode);show('btnL',lr);show('btnR',lr);
  show('btnB',mode==='altinha'||mode==='maraca');show('btnA',mode!=='guitarra'&&mode!=='bloco'&&mode!=='cut');show('btnP',mode==='play');show('btnC',mode==='play');if(mode!=='play')runHeld=false;show('btnX',MG_STATES.includes(mode)||mode==='maracaS');
  setIc($('btnA'),{labirinto:'fala',surf:'surf',play:'toque',grab:'solta',cut:'ok',altinha:'chuta',maraca:'chuta',maracaS:'run',bloco:'pula',bar:'bebe',sinuca:'forca'}[mode]||'toque');
  if(mode==='play')$('btnA').classList.remove('acao');setIc($('btnB'),'pula');
}
// tela cheia no PC: o botão do canto e a tecla F ligam e desligam (ESC também sai)
const ICON_CHEIA='<svg viewBox="0 0 24 24" fill="none" stroke="#f3ecd8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4H9M15 4H20V9M20 15V20H15M9 20H4V15"/></svg>';
const ICON_SAI_CHEIA='<svg viewBox="0 0 24 24" fill="none" stroke="#f3ecd8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4V9H4M20 9H15V4M15 20V15H20M4 15H9V20"/></svg>';
function telaCheia(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}catch(_){}}
function marcaTelaCheia(){const on=!!document.fullscreenElement;document.body.classList.toggle('tela-cheia',on&&!isTouch);$('btnFull').innerHTML=on?ICON_SAI_CHEIA:ICON_CHEIA;$('btnFull').title=on?'Sair da tela cheia (F)':'Tela cheia (F)';}
$('btnFull').addEventListener('click',e=>{e.stopPropagation();e.currentTarget.blur();telaCheia();});
document.addEventListener('fullscreenchange',marcaTelaCheia);marcaTelaCheia();
function goFullscreen(){if(!isTouch)return;try{const d=document.documentElement;if(document.fullscreenEnabled&&!document.fullscreenElement&&d.requestFullscreen)d.requestFullscreen().then(()=>{try{screen.orientation.lock('landscape').catch(()=>{});}catch(_){}}).catch(()=>{});}catch(_){}}

/* ================= UI helpers ================= */
const bubLayer=$('bubbles');const bubbles=[];
// no máximo 2 mensagens na tela ao mesmo tempo (balões, avisos, faixa do dia e caixa de diálogo contam; o aviso de interação não)
function nMsgs(){let n=0;for(const b of bubbles)if(!b.dead&&b!==promptObj)n++;if(!$('toast').hidden)n++;if(!$('banner').hidden)n++;if(dlg.active)n++;if(beg)n++;return n;}
function abreEspaco(keep){
  for(let g=0;g<8&&nMsgs()>=2;g++){const old=bubbles.filter(b=>!b.dead&&b!==promptObj).sort((a,b)=>a.born-b.born)[0];
    if(old){old.el.remove();old.dead=true;continue;}
    if(keep!=='banner'&&!$('banner').hidden){$('banner').hidden=true;bannerT=0;continue;}
    if(keep!=='toast'&&!$('toast').hidden){$('toast').hidden=true;toastT=0;continue;}
    break;}}
function bubble(target,text,dur=2.4,cls='',off,prio){
  if(state!=='cut'&&target!==mom&&!(tias&&tias.includes(target)))return; // durante o jogo, balão só da mãe e das tias
  for(const b of bubbles)if(b.target===target&&!b.dead){b.el.remove();b.dead=true;}
  // fala do Markin, da mãe, das tias e as grandes passam na frente; o resto espera a vez (se não couber, não aparece)
  if(prio===undefined)prio=target===P||target===mom||(tias&&tias.includes(target))||cls==='big';
  if(nMsgs()>=2){if(!prio)return;abreEspaco('bubble');}
  dur=Math.max(dur,1.3+String(text).length*.065); // fala maior fica mais tempo
  const el=document.createElement('div');el.className='bub '+cls;el.textContent=text;bubLayer.appendChild(el);
  bubbles.push({el,target,t:dur,off:off??(target.h||24),dead:false,born:performance.now()});
}
// placas das entradas dos jogos (em coordenadas do mundo): os balões desviam delas
function placasEntradas(){const l=[FESTA,ALT,MARACA,SURF,...barDoors];if(bloco)l.push(bloco);if(boss)l.push(boss);return l;}
function updBubbles(dt){
  for(const b of bubbles){if(b.dead)continue;b.t-=dt;if(b.t<=0){b.el.remove();b.dead=true;}}
  for(let i=bubbles.length-1;i>=0;i--)if(bubbles[i].dead)bubbles.splice(i,1);
  const gw=bubLayer.clientWidth||1,gh=bubLayer.clientHeight||1,kx=gw/W,ky=gh/H,pad=3,topMin=gh*.14;
  // obstáculos: placas das entradas que estão na tela
  const obst=[];
  if(state==='play'||state==='cut')for(const o of placasEntradas()){const x=(o.x-cam.x)*kx,y=(o.y-cam.y)*ky;if(x<-60||x>gw+60||y<-60||y>gh+80)continue;
    const top=(o.y-(o.h||30)-12-cam.y)*ky,bot=(o.y-(o.h||30)+14-cam.y)*ky;obst.push([x-24*kx,top,x+24*kx,bot]);}
  const hit=(r,list)=>list.find(q=>r[0]<q[2]+pad&&r[2]>q[0]-pad&&r[1]<q[3]+pad&&r[3]>q[1]-pad);
  // o aviso de interação vai primeiro; depois os balões mais antigos (os novos é que desviam)
  const ordem=bubbles.filter(b=>b===promptObj).concat(bubbles.filter(b=>b!==promptObj));
  const postos=[];
  for(const b of ordem){
    const w=b.el.offsetWidth,h=b.el.offsetHeight+7;
    let ax=clamp((b.target.x-cam.x)*kx,gw*.1,gw*.9),ay=clamp((b.target.y-b.off-cam.y)*ky,topMin+h,gh*.98);
    ax=clamp(ax,w/2+4,gw-w/2-4);
    const tenta=(x,y)=>[x-w/2,y-h,x+w/2,y];
    let r=tenta(ax,ay),achou=false;
    // sobe até achar espaço livre; se bater no topo, tenta desviar pro lado e, por último, pra baixo do alvo
    for(const dx of [0,-.55,.55,-1.1,1.1]){let x=clamp(ax+dx*w,w/2+4,gw-w/2-4),y=ay;
      for(let k=0;k<14;k++){r=tenta(x,y);const q=hit(r,postos)||hit(r,obst);if(!q){achou=true;break;}y=q[1]-pad-1;if(y-h<topMin)break;}
      if(achou){ax=x;ay=y;break;}}
    if(!achou){const y2=clamp((b.target.y-cam.y)*ky+h+6,h,gh-2);r=tenta(ax,y2);if(!hit(r,postos))ay=y2;}
    // anda suave até a posição nova, sem tremer
    if(b.px===undefined){b.px=ax;b.py=ay;}else{const k=Math.min(1,dt*14);b.px+=(ax-b.px)*k;b.py+=(ay-b.py)*k;}
    b.el.style.left=(b.px/gw*100)+'%';b.el.style.top=(b.py/gh*100)+'%';
    postos.push(tenta(b.px,b.py));}
}
function clearBubbles(){for(const b of bubbles)b.el.remove();bubbles.length=0;}
let toastT=0;
function toast(text,cls='',dur=2.8){const el=$('toast');el.hidden=true;abreEspaco('toast');el.textContent=text;el.className='toast '+cls;el.hidden=false;toastT=Math.max(dur,1.6+String(text).length*.055);}
let bannerT=0;
function banner(b,s,dur=2.6){$('banner').hidden=true;abreEspaco('banner');$('bannerB').textContent=b;$('bannerS').textContent=s;$('banner').hidden=false;bannerT=dur;}
const dlg={full:'',shown:0,active:false};
function showDialog(name,text){dlg.active=false;$('dialog').hidden=true;abreEspaco('dialog');$('dname').textContent=name;dlg.full=text;dlg.shown=0;dlg.active=true;$('dtext').textContent='';$('dialog').hidden=false;}
function hideDialog(){dlg.active=false;$('dialog').hidden=true;}
function updDialog(dt){if(!dlg.active)return;if(dlg.shown<dlg.full.length){dlg.shown=Math.min(dlg.full.length,dlg.shown+dt*45);$('dtext').textContent=dlg.full.slice(0,Math.floor(dlg.shown));}}
const screenEl=$('screen');
screenEl.addEventListener('input',e=>{if(e.target.id!=='volR')return;volume=e.target.value/100;$('volO').textContent=e.target.value+'%';initAudio();if(MASTER)MASTER.gain.setTargetAtTime(volume,AC.currentTime,.03);try{localStorage.setItem('svpc-volume',String(volume));}catch(err){}});
screenEl.addEventListener('change',e=>{if(e.target.id==='volR')sfx.pick();}); // um bip pra ouvir o volume novo
function showScreen(html){screenEl.innerHTML=html;screenEl.hidden=false;const b=screenEl.querySelector('button');if(b)setTimeout(()=>b.focus({preventScroll:true}),50);}
function hideScreen(){screenEl.hidden=true;screenEl.innerHTML='';}
screenEl.addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b)return;initAudio();goFullscreen();const a=b.dataset.act;
  if(a==='intro'){hideScreen();startIntro();}
  else if(a==='skipintro'){hideScreen();resetGame();startPlay();}
  else if(a==='play'){hideScreen();startPlay();}
  else if(a==='resume')resume();
  else if(a==='retry'){hideScreen();resetGame();startPlay();}
  else if(a==='continuar'){hideScreen();continuarJogo();}
  else if(a==='again'){hideScreen();resetGame();startIntro();}
  else if(a==='fases')showFases(state==='paused'?'pause':'title');
  else if(a==='fasesVoltar'){if(fasesBack==='pause')pause();else goTitle();}
  else if(a==='fase')playFase(b.dataset.f);
  else if(a==='menu')goTitle();
  else if(a==='mgRetry'){hideScreen();(MG_RETRY[mgKind]||(()=>{state='play';}))();}
  else if(a==='mgSair'){hideScreen();state='play';$('hud').hidden=false;if(isTouch)$('touch').hidden=false;saidaSegura();toast('Saiu do desafio. Dá pra voltar quando quiser.','',2.6);}
  else if(a==='dif'){diff=b.dataset.d;try{localStorage.setItem('svpc-dificuldade',diff);}catch(e){}for(const x of screenEl.querySelectorAll('[data-act=dif]'))x.classList.toggle('ghost',x.dataset.d!==diff);}
  else if(a==='musica'){musicOn=!musicOn;pause();}
  else if(a==='controle')abreCtrlCfg(state==='paused'?'pause':'title');
  else if(a==='ctrlPula'&&ctrlCfg)ctrlCfgProx();
  else if(a==='ctrlPadrao'&&ctrlCfg){ctrlMapa=null;try{localStorage.removeItem('svpc-controle');}catch(e){}const v=ctrlCfg.volta;ctrlCfg=null;toast('Controle no padrão (Xbox/PlayStation).','',2.4);ctrlCfgSai(v);}
  else if(a==='ctrlSai'&&ctrlCfg)ctrlCfgSai(ctrlCfg.volta);
  else if(a==='ctrlFim')ctrlCfgSai(b.dataset.v);
});
$('skip').addEventListener('click',()=>skipIntro());

/* ================= WORLD STATE ================= */
let state='title',cutKind='',cutGen=null,time=0;
const cam={x:0,y:0};let shake=0,flash=0;
const P={x:0,y:0,h:44,dir:'down',anim:0,frame:0,outfit:'work',energy:100,sono:0,mode:'free',helmet:true,hidden:false,jumpZ:0};
let fx,totalMin,day,lastDay,items,keysE,mom,tias,particles,fakeT,nextCall,call,napS,chairS,spawnT,idleT,lowLineT,playerField,pfTile,burnWarned,fieldT,shroomTalkT;
// amigos que seguem o Markin, rastro dele pelo mapa, chefão e fase final (0 tarefas · 1 chefão rodando · 2 bloco indo pro barco · 3 embarcou)
let buddies=[],trail=[],buddyT=12,boss=null,finalStage=0,webCd=0,gatHair='#b58cff';
const DOCKP={x:6*T+8,y:45*T+8};
const busStops=[],chairs=[],lamps=[],palms=[],kiosks=[];
let walkTiles=[],spawnSets={};

function setupStatics(){
  buildMap();renderBG();
  barDoors=lots.filter(L=>L.bar).map(L=>({x:Math.floor((L.x0+L.x1)/2)*T+8,y:(L.y1+1)*T+6,h:30,kind:L.kind}));
  busStops.length=0;chairs.length=0;lamps.length=0;
  const stopCand=[[14,10],[44,10],[75,24],[20,24],[56,35],[18,40]];
  for(const [sx,sy] of stopCand){const t=nearestTile(sx,sy,tt=>tt===SIDE||tt===ORLA);if(t)busStops.push({x:t.x*T+8,y:t.y*T+12,h:26});}
  for(const cx of [16,33,53,70])chairs.push({x:cx*T+8,y:46*T+10,h:22});
  // coqueiros e quiosques no calçadão
  palms.length=0;kiosks.length=0;for(const kx of [11,29,49,65])kiosks.push({x:kx*T+8,y:44*T+12});
  for(let x=3;x<MW;x+=6)if(!kiosks.some(k=>Math.abs(k.x-(x*T+8))<40))palms.push({x:x*T+8,y:44*T+4});
  for(const ry of [7,10,21,24,35,38])for(let x=2;x<MW;x+=7)if(tileAt(x,ry)===SIDE)lamps.push({x:x*T+8,y:ry*T+14});
  for(let x=3;x<MW;x+=6)if(tileAt(x,40)===ORLA)lamps.push({x:x*T+8,y:40*T+14});
  RINGS=[];for(let c=0;c<XB.length;c++)for(let r=0;r<YB.length;r++){const g=blockRing(c,r);if(g)RINGS.push(g);}
  walkTiles=[];spawnSets={beer:[],shroom:[],zip:[],shades:[]};spawnSets.shroomAranha=spawnSets.shroomGold=spawnSets.shroomRoxo=spawnSets.shroom;
  for(let y=0;y<50;y++)for(let x=0;x<MW;x++){const t=map[idx(x,y)];if(SOLID.has(t)||t===DOOR||t===DOCK)continue;
    const yard=x>=31&&x<=46&&y>=25&&y<=34; // quintal da casa
    if(!yard)walkTiles.push({x,y});else if(Math.hypot(x-DOORT.x,y-DOORT.y)<4)continue;
    if(noNavio(x*T+8,y*T+8))continue;
    // zona de itens: cada região do mapa tem os seus
    const q={x,y},perto=(o,r)=>Math.hypot(x-(o.x-8)/T,y-(o.y-10)/T)<=r;
    if(perto(FESTA,8)||t===LAPA||(x>=50&&y<=8)){spawnSets.beer.push(q,q,q);spawnSets.zip.push(q);spawnSets.shades.push(q);if(t!==ROAD)spawnSets.shroom.push(q);} // festa e Lapa: de tudo um pouco
    else if((x>=9&&x<=28&&y>=9&&y<=22)||barDoors.some(b=>perto(b,6))){if(t!==ROAD){const est=x>=9&&x<=28&&y>=9&&y<=22;spawnSets.beer.push(...(est?[q,q,q]:[q]));spawnSets.zip.push(q);}} // Maracanã, bar e sinuca: cerveja e pó mágico
    else if(t===SAND||t===ORLA){spawnSets.beer.push(q);spawnSets.shades.push(q);} // praia: cerveja e óculos
    else if((t===G||t===FLOW)&&x>=62)spawnSets.shroom.push(q); // cogumelos só na área verde da direita
    else if(t===SIDE||t===PATH){spawnSets.beer.push(q);spawnSets.zip.push(q);} // resto da cidade
  }
}
function nearestTile(tx,ty,ok){for(let r=0;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=MW||y>=MH)continue;if(ok(map[idx(x,y)],x,y))return{x,y};}return null;}
const walkable=t=>!SOLID.has(t);
function bfs(tx,ty){
  const d=new Int16Array(MW*MH).fill(-1);if(tx<0||ty<0||tx>=MW||ty>=MH)return d;
  const q=new Int32Array(MW*MH);let h=0,tl=0;d[idx(tx,ty)]=0;q[tl++]=idx(tx,ty);
  while(h<tl){const i=q[h++],x=i%MW,y=(i/MW)|0,nd=d[i]+1;
    if(x>0){const j=i-1;if(d[j]<0&&walkable(map[j])){d[j]=nd;q[tl++]=j;}}
    if(x<MW-1){const j=i+1;if(d[j]<0&&walkable(map[j])){d[j]=nd;q[tl++]=j;}}
    if(y>0){const j=i-MW;if(d[j]<0&&walkable(map[j])){d[j]=nd;q[tl++]=j;}}
    if(y<MH-1){const j=i+MW;if(d[j]<0&&walkable(map[j])){d[j]=nd;q[tl++]=j;}}}
  return d;
}
// anda só na horizontal OU na vertical: termina um eixo antes de trocar pro outro (sem diagonal)
function moveAxis(e,dx,dy,m,ok){
  if(e.ax==='x'&&Math.abs(dx)<.5)e.ax=null;if(e.ax==='y'&&Math.abs(dy)<.5)e.ax=null;
  if(!e.ax)e.ax=Math.abs(dx)>=Math.abs(dy)?'x':'y';
  const tenta=ax=>{const s=ax==='x'?dx:dy,q=Math.min(Math.abs(s),m)*Math.sign(s);if(!q)return false;const nx=ax==='x'?e.x+q:e.x,ny=ax==='y'?e.y+q:e.y;
    if(ok&&!ok(nx,ny))return false;e.x=nx;e.y=ny;e.dir=ax==='x'?(q>0?'right':'left'):(q>0?'down':'up');return true;};
  if(tenta(e.ax))return true;const o=e.ax==='x'?'y':'x';if(tenta(o)){e.ax=o;return true;}return false;
}
function followField(e,field,target,sp,dt){
  const tx=Math.floor(e.x/T),ty=Math.floor((e.y-2)/T);
  let gx=target.x,gy=target.y;const cur=field[idx(clamp(tx,0,MW-1),clamp(ty,0,MH-1))];
  if(cur>1){let best=cur,bx=tx,by=ty;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=tx+dx,ny=ty+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const v=field[idx(nx,ny)];if(v>=0&&v<best){best=v;bx=nx;by=ny;}}
    gx=bx*T+8;gy=by*T+10;}
  const dx=gx-e.x,dy=gy-e.y,d=Math.hypot(dx,dy);
  if(d>.5){e.moving=moveAxis(e,dx,dy,sp*dt);}
  else e.moving=false;
}
// rotas: cada personagem anda no seu retângulo (em tiles). Só vale se as quatro bordas forem andáveis.
function rectRoute(x0,y0,x1,y1){const ok=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&walkable(map[idx(x,y)])&&map[idx(x,y)]!==DOOR;
  for(let x=x0;x<=x1;x++)if(!ok(x,y0)||!ok(x,y1))return null;
  for(let y=y0;y<=y1;y++)if(!ok(x0,y)||!ok(x1,y))return null;
  return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>({x:x*T+8,y:y*T+10}));}
// volta no quarteirão: a calçada logo em volta dele
function blockRing(c,r){const [x0,x1]=XB[c],[y0,y1]=YB[r];return rectRoute(x0-1,y0-1,x1+1,y1+1);}
let RINGS=[];
function patrolStep(e,sp,dt){const r=e.route;let tg=r[e.ri];
  if(Math.hypot(tg.x-e.x,tg.y-e.y)<1.5){e.ri=(e.ri+(e.rev?r.length-1:1))%r.length;tg=r[e.ri];}
  moveAxis(e,tg.x-e.x,tg.y-e.y,sp*dt);e.moving=true;e.anim+=dt;}
function randTileFrom(list,minD,maxD=9999){for(let i=0;i<60;i++){const t=pick(list);const p={x:t.x*T+8,y:t.y*T+10};const d=dist(p,P);if(d>=minD&&d<=maxD)return p;}const t=pick(list);return{x:t.x*T+8,y:t.y*T+10};}

function resetGame(){bandeira=0;
  fx={turbo:0,crash:0,trip:0,disguise:0,drunk:0,burn:0,spider:0,sleepy:0,beers:[]};
  buddies=[];trail=[];buddyT=12;boss=null;finalStage=0;webCd=0;
  totalMin=0;day=1;lastDay=1;time=0;
  P.x=4*T+8;P.y=47*T+10;P.dir='down';P.outfit='casual';P.energy=100;P.sono=0;P.sonoAviso=false;diaSnap={1:{energy:100,sono:0}};sabeMusica=false;palhetas=3;usosTempo=0;palhetaT=60;P.mode='free';P.helmet=false;P.hidden=false;P.jumpZ=0;P.queda=null;P.escalando=false;aranhaPend=false;virar=null;
  items=[];particles=[];keysE=[];tias=[];
  mom={x:HOME.x,y:HOME.y+4,h:26,dir:'down',state:'wander',target:null,field:null,stun:0,alertT:0,moving:false,anim:0,chasing:false};
  // três tias espalhadas: uma no quarteirão de casa, uma no do sambinha (leste) e uma do lado oeste
  for(const [bc,br,st,rev] of [[2,2,0,false],[3,1,2,true],[1,2,1,false]]){const rt=blockRing(bc,br);if(!rt)continue;const p=rt[st];
    tias.push({x:p.x,y:p.y,h:26,dir:'down',route:rt,ri:(st+(rev?3:1))%4,rev,cd:0,anim:0,moving:false,alert:0});}
  fakeT=0;nextCall=rnd(22,35);call=null;napS=null;chairS=null;spawnT=0;idleT=rnd(8,14);lowLineT=0;playerField=null;pfTile=-1;burnWarned=false;fieldT=0;shroomTalkT=0;shroomStreak=0;lastShroomT=-999;psyT=0;dragaoCd=0;mermT=6;
  beg=null;$('beg').hidden=true;librasPend=false;$('phone').hidden=true;$('nap').hidden=true;hideDialog();clearBubbles();$('banner').hidden=true;$('toast').hidden=true;
  cv.style.filter='';cv.style.transform='';
  {const tg=targets();for(const k in tg)for(let i=0;i<tg[k];i++)spawnItem(k,true);} // já começa com as mesmas quantidades de sempre
  navioDX=0;boto=null;
  mg=null;grab=null;spawnNpcs();lastSleep=-999;for(const o of [...busStops,...chairs])o.lastRest=-99999;altinhaDay=0;barDay=0;festaDay=0;tasksDone={};hintT=15;$('festa').hidden=true;taxis=[];taxiT=20;tregua=0;relocateBloco();
}
function targets(){return{beer:12,shroom:2,zip:3,shades:2,shroomGold:1,shroomRoxo:1};} // igual todos os dias
function spawnItem(type,initial=false){
  // escolhe, entre vários lugares do mapa inteiro, o mais longe dos itens que já existem
  const pool=spawnSets[type],minP=initial?70:90;let p=null,bs=-1;
  for(let i=0;i<16;i++){const t=pick(pool),q={x:t.x*T+8,y:t.y*T+10};if(dist(q,P)<minP)continue;let md=1e9;for(const it of items)if(!it.aluc)md=Math.min(md,dist(it,q));if(md>bs){bs=md;p=q;}}
  if(!p)p=randTileFrom(pool,minP);
  items.push({type,x:p.x,y:p.y,h:18,fake:false,talkCd:rnd(0,3)});
}
function nKeys(){return 0;} // a chave saiu do jogo

/* ================= CUTSCENES ================= */
function* wait(s){let t=0;while(t<s){t+=(yield);}}
function* talk(name,text,sozinha){showDialog(name,text);let t=0;actionQ=false;
  while(true){const dt=yield;t+=dt;
    if(sozinha){takeAction();if(t>text.length*.055+1.8)break;continue;} // fala que roda no tempo dela, sem pular
    if(takeAction()&&t>.2){if(dlg.shown<dlg.full.length){dlg.shown=dlg.full.length;$('dtext').textContent=dlg.full;}else break;}
    if(t>text.length*.06+3.2)break;}
  hideDialog();}
// a ligação da mãe aparece cada vez num canto diferente da tela
let phoneSpot=-1;
const PHONE_SPOTS=[[4,26],[40,6],[4,40],[40,40],[74,40],[22,20],[58,20],[74,10]]; // o celular é alto: posições que cabem inteiras na tela
function placePhone(){const el=$('phone');const i=7; // sempre no mesmo canto, igual à primeira ligação
  phoneSpot=i;const [l,t]=PHONE_SPOTS[i];el.style.right='auto';el.style.left=l+'%';el.style.top=t+'%';}
function* walkTo(e,x,y,sp){while(true){const dt=yield;const dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy);if(d<1){e.x=x;e.y=y;e.moving=false;break;}moveAxis(e,dx,dy,sp*dt);e.moving=true;e.anim+=dt;}}
function* jumpTo(e,x,y,dur){const sx=e.x,sy=e.y;let t=0;e.dir=x<sx?'left':'right';while(t<dur){const dt=yield;t=Math.min(dur,t+dt);const k=t/dur;e.x=sx+(x-sx)*k;e.y=sy+(y-sy)*k;e.jumpZ=Math.sin(k*Math.PI)*18;}e.jumpZ=0;
  for(let i=0;i<10;i++)particles.push({x:e.x+rnd(-6,6),y:e.y,vx:rnd(-30,30),vy:rnd(-40,-10),g:120,life:.6,col:'#e8d193',s:1});}
// seta da intro: fica à esquerda do celular, na altura do botão vermelho de recusar
let introCallOk=false;
function placeCallHint(){const ph=$('phone'),h=$('callHint'),g=ph.offsetParent;if(!g)return;
  h.style.right=(g.clientWidth-ph.offsetLeft+6)+'px';h.style.top=Math.max(4,ph.offsetTop+ph.offsetHeight*.78-h.offsetHeight/2)+'px';}
function* introGen(){
  P.x=15*T;P.y=52*T+10;P.outfit='work';P.helmet=true;P.dir='left';P.mode='cut';
  yield* wait(.6);
  sfx.horn();bubble({x:21*T,y:49*T},'FOOOOOOM!',1.6,'big',8);shake=.6;
  yield* wait(1.4);
  yield* talk('Markin','15 dias no mar... MERMÃO, QUINZE. DIAS.',true);
  yield* walkTo(P,9*T+4,52*T+10,40);
  yield* walkTo(P,6*T+8,52*T+10,40);
  yield* walkTo(P,6*T+8,50*T+4,40);
  yield* talk('Markin','Terra firme... minha linda!',true);
  yield* jumpTo(P,3*T+8,47*T+10,.7);
  P.dir='down';
  yield* wait(.3);
  yield* talk('Markin','Esse macacão? Nunca mais.',true);
  sfx.rip();shake=.3;
  for(let i=0;i<22;i++)particles.push({x:P.x+rnd(-5,5),y:P.y-rnd(4,14),vx:rnd(-70,70),vy:rnd(-90,-30),g:160,life:rnd(.8,1.4),col:pick(['#e8742a','#b8561b','#f5e663']),s:2});
  particles.push({x:P.x,y:P.y-20,vx:55,vy:-110,g:180,life:1.6,col:'#f5f5f5',s:4,helmet:true});
  P.outfit='casual';P.helmet=false;
  yield* wait(1.2);
  yield* talk('Markin','Ahhh... liberdade.',true);
  // o celular toca: MÃE na tela
  // a mãe liga: a intro só continua (e só dá pra pular) depois que o jogador recusar
  placePhone(true);$('phone').hidden=false;P.phoneOut=false; // toca no bolso
  $('phoneT').style.width='100%';declineQ=false;
  let ringT=0,ringLast=-1;
  const tocar=dt=>{ringT+=dt;const k=Math.floor(ringT*4);if(k!==ringLast){ringLast=k;if(k%4===0){sfx.ring();particles.push({x:P.x+6,y:P.y-8,vx:rnd(8,16),vy:-14,g:0,life:.9,text:'trrrim',col:'#ff8fc2'});}}};
  {let t=0;while(t<1.2&&!declineQ){const dt=yield;t+=dt;tocar(dt);}}
  P.phoneOut=true;
  if(!declineQ){showDialog('Markin','Ih... é a minha mãe.');placeCallHint();$('callHint').hidden=false;}
  while(!declineQ){const dt=yield;tocar(dt);placeCallHint();}
  declineQ=false;introCallOk=true;hideDialog();$('callHint').hidden=true;$('skip').hidden=false;
  $('phone').hidden=true;sfx.rip();bubble(P,'*recusou*',1.4,'',46);
  yield* wait(1.2);
  sfx.ring();bubble(P,'bizz bizz',1.6,'mom treme',46);
  yield* wait(.8);
  yield* talk('Mãe (mensagem)','Filho, já desembarcou?? Recusou minha ligação?! Vem direto pra casa que eu fiz sopa de chuchu <3');
  P.phoneOut=false;
  yield* talk('Markin','Casa? Casa é pra quem tem sono.');
  yield* talk('Markin','Me dá 15 dias. Ninguém me leva pra casa.');
}
let bandeira=0; // 0 = abaixada, 1 = no alto do mastro
let navioDX=0,boto=null; // no final: o navio anda pra direita e o boto vem pulando da esquerda pra direita
function drawBoto(g,x,y,ang){ // boto cor de rosa com chapéu de palha amarelo (fita roxa)
  g.save();g.translate(Math.round(x),Math.round(y));g.rotate(ang);
  const rosa='#e8479a',rosaL='#f58cc4';
  g.fillStyle=rosa;g.beginPath();g.ellipse(0,0,15,6,0,0,Math.PI*2);g.fill();g.fillStyle=rosaL;g.beginPath();g.ellipse(1,2,11,3,0,0,Math.PI*2);g.fill();
  R(g,13,-2,8,4,rosa);R(g,19,-1,3,2,rosa); // bico
  g.fillStyle=rosa;g.beginPath();g.moveTo(-14,0);g.lineTo(-22,-6);g.lineTo(-20,0);g.lineTo(-22,6);g.fill(); // rabo
  g.beginPath();g.moveTo(-2,-5);g.lineTo(-7,-11);g.lineTo(3,-5);g.fill(); // nadadeira
  R(g,7,-3,3,3,'#ffffff');R(g,8,-2,2,2,'#1a1a1a');R(g,6,-4,4,1,'#1a1a1a');R(g,10,1,6,1,'#9a1a5a'); // olho e sorriso
  R(g,1,-11,12,2,'#f2c230');R(g,3,-15,8,4,'#f2c230');R(g,3,-12,8,1,'#7a3fb8');R(g,2,-11,1,1,'#c99a1a'); // chapéu
  g.restore();}
function drawBotoMar(g,cx,cy){if(!boto)return;const b=boto,k=(b.t%1.6)/1.6; // pula em arco e mergulha
  const bx=b.x-cx,by=b.y-cy-Math.sin(k*Math.PI)*34,ang=-Math.cos(k*Math.PI)*.9;
  if(k<.08||k>.92)for(let i=0;i<6;i++)R(g,bx-8+i*3,b.y-cy-2-Math.random()*5,2,2,'#e9f4ff');
  if(k>.02&&k<.98)drawBoto(g,bx,by,ang);}
function drawBandeira(g,cx,cy){if(bandeira<=0)return;
  const mx=10*T+218+navioDX-cx,top=50*T+4-86-cy,base=50*T+4-30-cy;R(g,mx,top,1,base-top,'#1d1d22');R(g,mx-1,top-2,3,2,'#ffe14f');
  const fy=Math.round(base-14-(base-14-top)*Math.min(1,bandeira)),wv=Math.sin(time*6);
  for(let i=0;i<96;i+=4){const dy=Math.round(Math.sin(time*6+i*.12)*1.5);R(g,mx+1+i,fy+dy,4,16,i%8?'#2f9a55':'#34a85c');}
  R(g,mx+1,fy+Math.round(Math.sin(time*6)*1.5),96,2,'#ffe14f');
  outlineText(g,'PARTIU PAQUETAAAAA!',mx+49,fy+11+Math.round(wv),7,'#ffe14f');}
function* winGen(){
  P.mode='cut';bandeira=0;
  yield* talk('Markin','Chegamo no porto, galera!! Embarca todo mundo!');
  yield* walkTo(P,6*T+8,50*T+4,46);
  yield* walkTo(P,9*T+4,52*T+10,46);
  yield* walkTo(P,15*T,52*T+10,46);
  // a galera toda embarca atrás dele e se espalha pelo convés
  {const n=buddies.length,alvo=buddies.map((b,i)=>({x:11*T+((i*37)%(n||1))/(n||1)*13*T+rnd(-4,4),y:52*T+4+(i%3)*4}));let t=0;
   while(t<2.6){const dt=yield;t+=dt;buddies.forEach((b,i)=>{const a=alvo[i],dx=a.x-b.x,dy=a.y-b.y;if(Math.abs(dx)+Math.abs(dy)>1){moveAxis(b,dx,dy,70*dt);b.moving=true;b.anim+=dt;}else{b.moving=false;b.dir='down';}});}
   buddies.forEach((b,i)=>{b.x=alvo[i].x;b.y=alvo[i].y;b.moving=false;b.dir='down';});}
  sfx.horn();bubble({x:21*T,y:49*T},'FOOOOOOM!',1.6,'big',8);shake=.6;
  // todo mundo a bordo: sobe a bandeira
  bubble(P,'SOBE A BANDEIRA!!',1.8,'big',46);
  {let t=0;while(t<2.2){const dt=yield;t+=dt;bandeira=t/2.2;}}bandeira=1;sfx.win();
  yield* wait(1);
  sfx.ring();bubble(P,'bizz bizz',1.2,'treme',46);
  yield* wait(.8);
  yield* talk('Chefe (ligação)','Markin?! Que barulheira é essa no convés?');
  yield* talk('Markin','É o BLOCO DO MARKIN, chefe. Vai todo mundo pro mar.');
  yield* talk('Mãe (mensagem)','MARKIN!!! A SOPA DE CHUCHU!!!');
  yield* talk('Markin','SEM VOLTA PRA CASA!! FODA-SE A CASA!!');
  yield* talk('Markin','Capitão, muda a rota! Tem bloco em PAQUETÁ!');
  // um boto cor de rosa aparece pulando no mar, vindo da esquerda pra direita
  boto={x:P.x-150,y:55*T+6,t:0};
  {let t=0;while(t<2.4){const dt=yield;t+=dt;boto.t+=dt;boto.x+=60*dt;}}
  yield* talk('Markin','Olha lá! Um BOTO COR DE ROSA de chapéu! É sinal, galera!');
  sfx.horn();bubble({x:21*T,y:49*T},'FOOOOOOM!',1.6,'big',8);shake=.4;
  // o navio zarpa (com o Markin e a galera a bordo) e o boto vem pulando do lado
  {const bordo=[P,...buddies];let v=0,t=0;while(t<6.5){const dt=yield;t+=dt;v=Math.min(46,v+dt*16);const dx=v*dt;navioDX+=dx;for(const o of bordo)o.x+=dx;boto.x+=dx+24*dt;boto.t+=dt;
    if(t>1.2&&t<1.25)bubble(P,'PARTIU PAQUETÁÁÁ!',2,'big',46);}}
  yield* wait(.4);
}
/* venceu o Jamal: nasce o BLOCO DO MARKIN */
function* blocoGen(){
  P.mode='cut';P.dir='down';
  yield* wait(.4);
  yield* talk('Jamal','A regra é a regra... Tu puxou a próxima. A banda é tua, Markin.');
  yield* talk('Trompetista','Puxa a próxima, mestre! A gente vai contigo!');
  const names=buddies.filter(b=>!b.crowd).map(b=>b.nome);
  yield* talk('Markin',names.length?`${names.join(', ')}... cola comigo! Vamo fazer barulho!`:'Galera, cola comigo! Vamo fazer barulho!');
  // a galera chega
  for(let i=0;i<8;i++)addCrowd();
  sfx.win();shake=.5;
  for(let i=0;i<60;i++)particles.push({x:P.x+rnd(-80,80),y:P.y-rnd(40,90),vx:rnd(-20,20),vy:rnd(10,40),g:20,life:rnd(1.5,3),col:pick(['#ff4fd8','#4fffd2','#ffe14f','#ff8a3d','#ffffff']),s:2});
  banner('BLOCO DO MARKIN','SEM VOLTA PRA CASA!! FODA-SE A CASA!!',4.5);
  bubble(P,'FODA-SE A CASA!!',2.6,'big',46);
  yield* wait(2.8);
  yield* talk('Markin','Destino: o porto. O barco não espera. BORA EMBARCAR DE NOVO!');
}
// atalho de teste: pula direto pro chefão (1) ou pra marcha até o barco (2), com as tarefas feitas e a galera junta
function continuarJogo(){
  const sv=salvo;if(!sv){resetGame();startPlay();return;}
  resetGame();startPlay();clearBubbles();
  totalMin=sv.totalMin;day=Math.min(15,Math.floor(totalMin/1440)+1);lastDay=day;gatHair=sv.gatHair;sabeMusica=!!sv.sabeMusica;palhetas=sv.palhetas??3;usosTempo=sv.usosTempo||0;
  for(const t of TASKS)if(sv.tasks[t.k]){tasksDone[t.k]=true;addBuddy(t.k);}
  const todas=TASKS.every(t=>tasksDone[t.k]);
  if(todas&&sv.finalStage>=2){finalStage=1;for(let i=0;i<8;i++)addCrowd();startMarch();mom.x=70*T;mom.y=10*T;}
  else if(todas){finalStage=0;spawnBoss();}
  P.energy=maxE();trail=[];
  const n=TASKS.filter(t=>tasksDone[t.k]).length;
  banner('DE VOLTA PRA RUA',`Dia ${day} · ${n}/${TASKS.length} tarefas feitas. O que já fez continua feito.`,3.6);
}
function skipToFinal(stage){
  resetGame();startPlay();clearBubbles();
  totalMin=8*1440;day=9;lastDay=9;
  for(const t of TASKS){tasksDone[t.k]=true;addBuddy(t.k);}
  if(stage===1){
    finalStage=0;spawnBoss();
    P.x=boss.x-60;P.y=boss.y+12;if(hitsWall(P.x,P.y)){P.x=boss.x;P.y=boss.y+30;}
    banner('ATALHO: CHEFÃO','O Bloco do Jamal tá aqui do lado. Chega perto e aperta '+KL+'.',4);
  }else{
    finalStage=1;for(let i=0;i<8;i++)addCrowd();
    P.x=40*T+8;P.y=37*T+12;startMarch();mom.x=70*T;mom.y=10*T;
    banner('ATALHO: RUMO AO BARCO','Leve o Bloco do Markin até o porto (siga a seta BARCO).',4);
  }
  trail=[];
}
function startMarch(){
  finalStage=2;boss=null;P.mode='free';state='play';
  mom.alertT=25;mom.chasing=true;mom.stun=0;
  toast('A mãe ficou sabendo do bloco e tá vindo! Leva a galera até o barco!','bad',4);
  banner('RUMO AO BARCO','Leve o Bloco do Markin até o porto.',3);
}
function startIntro(){
  resetGame();
  introCallOk=false;state='cut';cutKind='intro';cutGen=introGen();cutGen.next();
  $('hud').hidden=true;$('skip').hidden=true;$('touch').hidden=true;
}
function skipIntro(){
  if(state!=='cut'||cutKind!=='intro'||!introCallOk)return;
  cutGen=null;hideDialog();clearBubbles();particles=[];$('phone').hidden=true;$('callHint').hidden=true;P.phoneOut=false;
  P.x=3*T+8;P.y=47*T+10;P.outfit='casual';P.helmet=false;P.jumpZ=0;P.dir='down';
  endIntro();
}
function endIntro(){
  $('skip').hidden=true;state='ready';P.mode='free';
  showScreen(`<div class="card"><div class="kicker">regras</div><h2>SEM VOLTA<br>PRA CASA</h2>
  <p>Fique <b>15 dias</b> sem voltar pra casa e cumpra as <b>7 tarefas</b> espalhadas pela cidade. Cada uma traz um amigo pro seu bloco. Se a energia zerar, o Markin apaga.</p>
  <div class="rules"><div><em>Pozinho, cogumelos, cerveja</em> repõem energia</div><div><em>Ponto de ônibus / cadeira</em> pra cochilar (${KL})</div><div><em>Óculos</em> te disfarçam da mãe</div><div><em>Sono</em> encheu, o Markin apaga: cochile antes</div></div>
  <div class="btns"><button data-act="play" type="button">JOGAR</button></div></div>`);
}
function startPlay(){
  state='play';P.mode='free';$('hud').hidden=false;$('skip').hidden=true;if(isTouch)$('touch').hidden=false;
  hideScreen();banner('DIA 1',L.days[1]);sfx.day();
  bubble(P,'VAMBORAAA!',2);
}
function pause(){state='paused';keys.clear();
  const lista=TASKS.map(t=>(tasksDone[t.k]?'✔ ':'○ ')+t.curto).join(' · ')+(finalStage>=1?` · ${finalStage>=2?'✔':'★'} Chefão · ${finalStage>=3?'✔':'○'} Barco`:'');
  showScreen(`<div class="card"><h2>PAUSA</h2><p>O Markin tá de olho aberto te esperando.</p><p class="stats">${lista}</p>${sabeMusica?`<p class="stats">Música do Tempo: 7 9 8 0 7 7 · palhetas ${palhetas}/3</p>`:''}<div class="volrow"><label for="volR">Volume</label><input id="volR" type="range" min="0" max="100" step="5" value="${Math.round(volume*100)}"><output id="volO">${Math.round(volume*100)}%</output></div><div class="btns"><button data-act="resume" type="button">CONTINUAR</button><button data-act="fases" class="ghost" type="button">Escolher fase</button><button data-act="controle" class="ghost" type="button">Controle</button><button data-act="menu" class="ghost" type="button">Menu principal</button><button data-act="musica" class="ghost" type="button">${musicOn?'Desligar música':'Ligar música'}</button><button data-act="retry" class="ghost" type="button">Recomeçar</button></div></div>`);}
/* ---------- MENU PRINCIPAL e ESCOLHER FASE ---------- */
function goTitle(){
  cutGen=null;mg=null;grab=null;hideDialog();clearBubbles();setPrompt(null);resetGame();
  state='title';cutKind='';P.x=15*T;P.y=52*T+10;P.outfit='work';P.helmet=true;P.dir='left';P.mode='cut';
  $('hud').hidden=true;$('touch').hidden=true;$('skip').hidden=true;$('festa').hidden=true;
  showScreen(`<div class="card"><div class="kicker">um jogo sobre o Markin</div><h2>SEM VOLTA<br>PRA CASA</h2><p>Depois de 15 dias embarcado, o Markin pisa em terra firme. O desafio: mais 15 dias acordado, sem voltar pra casa.</p><div class="btns"><button data-act="intro" type="button">COMEÇAR</button><button data-act="skipintro" class="ghost" type="button">Pular intro</button><button data-act="fases" class="ghost" type="button">Escolher fase</button><button data-act="controle" class="ghost" type="button">Controle</button></div><div class="difrow">Dificuldade: ${Object.keys(DIFFS).map(k=>`<button data-act="dif" data-d="${k}" type="button" class="${k===diff?'':'ghost'}">${DIFFS[k].nome}</button>`).join('')}</div></div>`);
}
const FASES=[['altinha','Altinha'],['bloco','Bloco Secreto'],['bar','Bar (6 cervejas)'],['sinuca','Bambina'],['festa','Circo Voador'],['maraca','Maracanã'],['surf','Surf'],['chefao','★ Chefão: Guerra dos Músicos'],['barco','★ Marcha ao barco']];
let fasesBack='title';
function showFases(back){
  fasesBack=back;
  showScreen(`<div class="card"><div class="kicker">escolher fase</div><h2>FASES</h2><p>${back==='pause'?'Os desafios continuam a partida atual. O chefão e a marcha começam uma partida nova, já com as 6 tarefas feitas.':'Cada fase começa uma partida nova. O chefão e a marcha já vêm com as tarefas feitas e a galera junta.'}</p>
  <div class="fases">${FASES.map(([k,n])=>`<button data-act="fase" data-f="${k}" type="button" class="${k==='chefao'||k==='barco'?'':'ghost'}">${n}</button>`).join('')}</div>
  <div class="btns"><button data-act="fasesVoltar" class="ghost" type="button">Voltar</button></div></div>`);
}
function playFase(f){
  hideScreen();
  if(f==='chefao'){skipToFinal(1);startGuitarra();return;}
  if(f==='barco'){skipToFinal(2);return;}
  if(fasesBack==='pause')state='play';else{resetGame();startPlay();clearBubbles();}
  ({surf:startSurf,altinha:startAltinha,bloco:startBloco,bar:startBar,sinuca:startSinuca,festa:startFesta,maraca:startMaraca})[f]();
}
function resume(){hideScreen();state='play';}

/* ================= GAMEPLAY ================= */
const L={
  momHit:['MARKIN! Olha essa cara!','Tá comendo direito, filho?','Seu quarto tá arrumadinho te esperando...','Fiz sopa de chuchu. SOPA DE CHUCHU, Markin.','Nem me deu um abraço!','Que olheira é essa?!','Vou contar pro seu pai!'],
  momSpot:['MARKIN!!!','Achei você!','Vem cá, menino!','Ô MARKIN!'],
  decline:['Recusou. A mãe mandou 12 áudios de 4 minutos.','Recusou. "Visualizou e não respondeu, né?"','Recusou. O grupo da família já tá sabendo.','Recusou. Chegou foto da sopa de chuchu.','Recusou. "Tô rezando por você."'],
  shroomTalk:['Psiu, Markin... sua mãe tá pro {d}.','Me come não... ou come. Sei lá.','Dormir é coisa de cogumelo velho.','{h} horas acordado. Respeito.','Aquela tia de bobe tá de olho.','Ouvi um tamborim... o Bloco Secreto tá pro {b}.','Tem altinha rolando na areia. Vai lá.'],
  shroomEat:['AAAH! Tudo bem... eu renasço.','Cuidado com as cores!','Bem-vindo ao outro lado.'],
  beer:['Gelada! Desceu redonda.','Só mais uma. Só mais uma.','Essa é pra lembrar do navio.'],
  zip:['SNIFF! Tô vendo sons.','Energia infinita (por enquanto).','Tô ligado no 220V.'],
  idle:['Eu durmo quando morrer.','Tô ótimo. Tô ÓTIMO.','Que dia é hoje? Não importa.','Pisquei ou dormi?','Meu olho tá tremendo sozinho.','Casa? Nunca ouvi falar.','15 dias no mar, 15 na terra.'],
  low:['A cama tá me chamando...','Só um cochilinho em casa... NÃO!','Tô vendo a sopa de chuchu...','Minhas pernas tão indo sozinhas...'],
  tia:['Ó o Markin ali!!','Vou contar pra sua mãe!','NEIDE! Liga pra mãe dele!','Tá magrinho, hein?'],
  days:{1:'TERRA FIRME',2:'CADÊ MEUS AMIGOS',3:'O OLHO TREMENDO',4:'O CAFÉ NÃO FAZ MAIS EFEITO',5:'AS TIAS FORAM AVISADAS',6:'NUNCA MAIS EU VOU DORMIR',7:'UMA SEMANA',8:'MICHAEL DOUGLAS',9:'O TÁXI DA MÃE',10:'NA ONDA DO COGU',11:'A ÚLTIMA GELADA',12:'DESERDADO',13:'CONTAGEM REGRESSIVA',14:'ÚLTIMAS 24H',15:'SEM VOLTA PRA CASA'}
};
// teto de energia: a barra sempre vale 100, mas com o passar dos dias ele só recupera até um máximo menor (no fim, metade)
function maxE(){return 100-50*clamp((totalMin||0)/(15*1440),0,1);}
function gain(v,label){P.energy=Math.min(maxE(),P.energy+v);particles.push({x:P.x,y:P.y-26,vx:0,vy:-18,g:0,life:1,text:label||('+'+Math.round(v)),col:'#8be08b'});}
function lose(v){P.energy=Math.max(0,P.energy-v);particles.push({x:P.x,y:P.y-26,vx:0,vy:-18,g:0,life:1,text:'-'+Math.round(v),col:'#ff6b5d'});shake=.25;flash=.25;}
function hourF(){return((360+totalMin)%1440)/60;}
function nightA(){const h=hourF();if(h>=20||h<5)return .62;if(h>=18)return (h-18)/2*.62;if(h<7)return (7-h)/2*.62;return 0;}
function isDay(){const h=hourF();return h>=7&&h<18;}
// de Homem-Aranha ele escala prédio, árvore, grade, Arcos, morro e favela (a casa da mãe e o mar não)
const CLIMB=new Set([BLD,CIRCO]); // de Homem-Aranha ele escala prédios, bares e o Circo Voador
// Pão de Açúcar: a grama em volta dá pra andar; só as duas pedras (Urca e Pão) seguram
const naPedraPao=(px,py)=>((px-71*T-26)/22)**2+((py-21*T+34)/30)**2<1||((px-71*T-100)/30)**2+((py-21*T+70)/64)**2<1;
const solidAt=(px,py)=>{const t=tileAt(Math.floor(px/T),Math.floor(py/T));if(t===MORRO&&px>=71*T&&py>=11*T&&py<21*T&&!naPedraPao(px,py))return false;return SOLID.has(t)&&!(fx&&fx.spider>0&&CLIMB.has(t));};
function incog(){return fx.disguise>0||fx.spider>0;} // disfarçado: de óculos ou de Homem-Aranha
function hitsWall(x,y){return solidAt(x-4,y-5)||solidAt(x+4,y-5)||solidAt(x-4,y)||solidAt(x+4,y);}
function moveP(dx,dy){if(dx&&!hitsWall(P.x+dx,P.y))P.x+=dx;if(dy&&!hitsWall(P.x,P.y+dy))P.y+=dy;P.x=clamp(P.x,6,MW*T-6);P.y=clamp(P.y,8,MH*T-2);}
function interruptRest(){if(napS){napS=null;$('nap').hidden=true;}if(chairS){P.y=chairS.oy;chairS=null;}P.mode='free';}
function teleportTowardHome(frac){
  const tx=P.x+(HOME.x-P.x)*frac,ty=P.y+(HOME.y-P.y)*frac;
  const t=nearestTile(Math.floor(tx/T),Math.floor(ty/T),(tt,x,y)=>walkable(tt)&&tt!==DOOR&&tt!==DOCK&&!(x>=31&&x<=46&&y>=25&&y<=34)&&y<50);
  if(t){P.x=t.x*T+8;P.y=t.y*T+12;}
  flash=.5;
}
let salvo=null;
function gameOver(reason,semTempo){
  if(state!=='play')return;
  if(!semTempo&&podeVoltar(reason)){abreTempo(reason);return;}state='over';
  const podeSeguir=reason!=='tarefas'&&reason!=='navio'; // se os 15 dias acabaram, não tem de onde continuar
  salvo=podeSeguir?{tasks:{...tasksDone},finalStage,totalMin,gatHair,sabeMusica,palhetas,usosTempo}:null;closeBeg();interruptRest();$('phone').hidden=true;call=null;sfx.lose();
  const hrs=Math.floor(totalMin/60);
  const why=reason==='door'?['VOLTOU PRA CASA','Entrou pela porta da frente. A sopa de chuchu tava ótima. Você perdeu.']
    :reason==='tarefas'?['FALTOU TAREFA',`Os 15 dias acabaram, mas faltou: ${TASKS.filter(t=>!tasksDone[t.k]).map(t=>t.nome.toLowerCase()).join(', ')}. O Markin embarcou sem viver tudo. Você perdeu.`]
    :reason==='navio'?['O NAVIO ZARPOU',finalStage<=1?'Os 15 dias acabaram e o Markin nunca encarou o Bloco do Jamal. O navio foi embora sem ele. Você perdeu.':'O Bloco do Markin não chegou no porto a tempo. O navio zarpou e a galera foi comer sopa de chuchu. Você perdeu.']
    :reason==='sono'?['APAGOU DE SONO','Não cochilou a tempo e apagou na calçada. Acordou na cama dele, com a mãe fazendo carinho. Você perdeu.']
    :reason==='bloco'?['DORMIU NO BLOCO','Apagou no meio da rua atrás do Bloco Secreto. Acordou em casa, com a mãe fazendo cafuné. Você perdeu.']
    :['APAGOU','A energia zerou. O Markin acordou na cama dele, coberto, com a mãe fazendo carinho. Você perdeu.'];
  setTimeout(()=>showScreen(`<div class="card"><img class="sono" src="${SONO_SRC}" alt="Markin dormindo, enrolado no cobertor azul"><div class="kicker">fim de jogo</div><h2 class="lose">${why[0]}</h2><p>${why[1]}</p><p class="stats">Aguentou até o dia ${day} · ${hrs}h acordado</p><div class="btns">${salvo?'<button data-act="continuar" type="button">CONTINUAR DE ONDE PAROU</button>':''}<button data-act="retry" type="button" class="${salvo?'ghost':''}">${salvo?'Recomeçar do zero':'TENTAR DE NOVO'}</button><button data-act="again" class="ghost" type="button">Ver a intro de novo</button><button data-act="menu" class="ghost" type="button">Menu principal</button></div></div>`),500);
  $('touch').hidden=true;
}
function winGame(){
  state='cut';cutKind='win';interruptRest();$('phone').hidden=true;call=null;
  cutGen=winGen();cutGen.next();
}
function endWin(){
  state='over';sfx.win();$('touch').hidden=true;
  const hh=String(Math.floor(((360+totalMin)%1440)/60)).padStart(2,'0');
  showScreen(`<div class="card"><div class="kicker">dia ${day} · ${hh}h · o navio mudou de rota</div><h2 class="win">BOTO COR DE ROSA!</h2><p>O BLOCO DO MARKIN embarcou inteiro: ${buddies.filter(b=>!b.crowd).map(b=>b.nome).join(', ')||'a galera'} e mais um monte de folião. O Jamal ficou orgulhoso. A sopa de chuchu segue no fogão. E o navio? Foi direto pro bloco do Boto Cor de Rosa.</p><p class="stats">${Math.floor(totalMin/60)}h acordado · energia final ${Math.round(P.energy)}</p><h2 style="font-size:1.6em;margin:.2em 0">CONTINUA NA PARTE 2</h2><div class="btns"><button data-act="retry" type="button">JOGAR DE NOVO</button><button data-act="again" class="ghost" type="button">Ver a intro</button><button data-act="menu" class="ghost" type="button">Menu principal</button></div></div>`);
}

function update(dt){
  time+=dt;ctrlPoll();
  updDialog(dt);
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').hidden=true;}
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').hidden=true;}
  if(shake>0)shake-=dt;if(flash>0)flash-=dt;
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||0)*dt;p.life-=dt;}
  particles=particles.filter(p=>p.life>0);
  if(state==='cut'){
    P.moving=false; // o walkTo da cena liga de novo enquanto ele anda, pra animar a passada (macacão na intro)
    if(cutGen){const r=cutGen.next(dt);if(r.done){cutGen=null;if(cutKind==='intro')endIntro();else if(cutKind==='bloco')startMarch();else if(cutKind==='sax'){state='play';P.mode='free';}else endWin();}}
  }else if(state==='play')play(dt);
  else if(state==='guitarra')updGuitarra(dt);
  else if(state==='maraca')updMaraca(dt);
  else if(state==='altinha')updAltinha(dt);
  else if(state==='surf')updSurf(dt);
  else if(state==='bloco')updBloco(dt);
  else if(state==='bar')updBar(dt);
  else if(state==='sinuca')updSinuca(dt);
  else if(state==='festa')updFesta(dt);
  else if(state==='labirinto')updLabirinto(dt);
  else if(state==='tempo')updTempo(dt);
  else if(state==='virando')updVirando(dt);
  else if(state==='capitulo')updCapitulo(dt);
  if(!MG_STATES.includes(state)&&state!=='title')updBuddies(dt);
  updTouchUI();
  cam.x=clamp(P.x-W/2,0,MW*T-W);cam.y=clamp(P.y-10-H/2,0,MH*T-H);
  updBubbles(dt);
}

function play(dt){
  // numa conversa o mundo para: tempo, vida, sono, efeitos e inimigos congelam; só a galera do bem segue andando
  if(beg){nearK=null;setPrompt(null);updBeg(dt,takeAction());updNpcs(dt);updHUD();return;}
  const clockRate=24; // 1 dia de jogo = 1 minuto (15 dias = 15 min)
  totalMin+=dt*clockRate;
  day=Math.min(15,Math.floor(totalMin/1440)+1);
  if(totalMin>=15*1440){gameOver(TASKS.every(t=>tasksDone[t.k])?'navio':'tarefas');return;}
  if(bloco&&dist(bloco,P)<150){bloco.lineT-=dt;if(bloco.lineT<=0){bloco.lineT=rnd(4,7);bubble(bloco,pick(['Ô abre alas!','ALALAÔ-Ô-Ô!','Vem pro bloco, Markin!','Mamãe eu quero!','Cadê o tamborim?!']),2.2,'tia',44);}}
  if(day!==lastDay){lastDay=day;diaSnap[day]={energy:P.energy,sono:P.sono};abreCapitulo(day);while(keysE.length<nKeys()){const p=randTileFrom(walkTiles,240);keysE.push({x:p.x,y:p.y,h:18});}}
  const wasTurbo=fx.turbo>0,wasSpider=fx.spider>0;
  for(const k of ['turbo','crash','trip','disguise','drunk','burn','spider','sleepy'])fx[k]=Math.max(0,fx[k]-dt);
  if(wasTurbo&&fx.turbo<=0){fx.crash=14;toast('Bateu a bad... tudo pesado.','bad');}
  if(wasSpider&&fx.spider<=0)endSpider();
  webCd=Math.max(0,webCd-dt);tregua=Math.max(0,tregua-dt);
  let decay=DF().e/3; // dia 3x mais longo: a energia gasta o mesmo tanto por diaif(nightA()>.4)decay*=1.2;if(fx.crash>0)decay*=2.2;
  decay*=1-.04*buddies.filter(b=>!b.crowd).length; // a galera anima: energia cai mais devagar
  if(!chairS)P.energy-=decay*dt;if(P.energy>maxE())P.energy=maxE();
  if(!chairS&&!napS)P.sono=Math.min(100,P.sono+dt*clockRate*SONO_MIN*(fx.sleepy>0?2:1)); // o sono só passa cochilando
  // faltando 25% pra apagar: um aviso só (volta a avisar depois de cochilar)
  if(P.sono>=75&&!P.sonoAviso){P.sonoAviso=true;toast(pick(['Arranja um canto pra encostar a cabeça...','Tô pescando... preciso de um ponto de ônibus.','Meu olho tá fechando sozinho. Cadê uma cadeira?']),'bad',3);}
  else if(P.sono<70)P.sonoAviso=false;
  let ix=0,iy=0;
  if(keys.has('ArrowLeft')||keys.has('KeyA'))ix-=1;if(keys.has('ArrowRight')||keys.has('KeyD'))ix+=1;
  if(keys.has('ArrowUp')||keys.has('KeyW'))iy-=1;if(keys.has('ArrowDown')||keys.has('KeyS'))iy+=1;
  if(Math.hypot(joy.x,joy.y)>.2){ix+=joy.x;iy+=joy.y;}
  // sem diagonal: vale o eixo mais forte; empatou (duas teclas), vale a última apertada
  if(ix&&iy){if(Math.abs(ix)>Math.abs(iy)+.05)iy=0;else if(Math.abs(iy)>Math.abs(ix)+.05)ix=0;else if(lastAxis==='x')iy=0;else ix=0;}
  const im=Math.hypot(ix,iy);if(im>1){ix/=im;iy/=im;}
  const act=takeAction();
  if(call){call.t-=dt;$('phoneT').style.width=clamp(call.t/call.max*100,0,100)+'%';
    if(Math.floor(call.t*4)!==call.lastRing){call.lastRing=Math.floor(call.t*4);if(call.lastRing%2===0)sfx.ring();}
    if(declineQ){declineQ=false;call=null;$('phone').hidden=true;toast(pick(L.decline));nextCall=rnd(24,38)*DF().call;}
    else if(call.t<=0){call=null;$('phone').hidden=true;lose(14);toast('Atendeu sem querer. Mãe: "Tô indo aí, filho." E ela tá vindo mesmo!','bad',3.4);mom.alertT=30;mom.chasing=true;mom.stun=0;bubble(mom,'Tô indo, filho!',2,'mom');sfx.alert();nextCall=rnd(20,38);}
  }else{declineQ=false;nextCall-=dt;
    const momNaTela=mom&&mom.x>cam.x-10&&mom.x<cam.x+W+10&&mom.y>cam.y-10&&mom.y<cam.y+H+20;
    if(nextCall<=0&&(momNaTela||grab||mom.chasing||mom.alertT>0||(mom.knowT||0)>0))nextCall=rnd(4,8); // nessas horas ela não liga
    if(nextCall<=0&&!napS){const mx=2.8;call={t:mx,max:mx,lastRing:-1};placePhone();$('phone').hidden=false;}}
  if(grab||napS||chairS||beg)nearK=null;
  if(beg){updBeg(dt,act);setPrompt(null);}
  else if(grab){updGrab(dt,act);setPrompt(null);if(tileAt(Math.floor(P.x/T),Math.floor((P.y-2)/T))===DOOR){grab=null;gameOver('door');return;}}
  else if(napS)updNap(dt,act);
  else if(chairS)updChair(dt,act,im);
  else if(P.queda)updQueda(dt);
  else{
    let sp=52.5*(fx.turbo>0?1.55:1)*(fx.crash>0?.8:1)*(fx.spider>0?1.25:1)*(fx.sleepy>0?.6:1)*(runHeld||keys.has('ShiftLeft')||keys.has('ShiftRight')?1.275:1); // segurar SHIFT (ou o botão de correr) corre
    let vx=ix*sp,vy=iy*sp;if(fx.trip>0){vx=-vx;vy=-vy;}
    if(fx.drunk>0){if(ix)vx+=Math.sin(time*3.1)*20;else if(iy)vy+=Math.sin(time*3.1)*12;} // bêbado cambaleia no mesmo eixo que anda
    moveP(vx*dt,vy*dt);
    P.moving=im>.1;if(P.moving){P.anim+=dt*(fx.turbo>0?1.6:1);
      const ax=fx.trip>0?-ix:ix,ay=fx.trip>0?-iy:iy;if(Math.abs(ax)>Math.abs(ay))P.dir=ax>0?'right':'left';else P.dir=ay>0?'down':'up';}
    let near=null;
    if(dist(ALT,P)<24)near={k:'alt',o:ALT};
    if(!near&&bloco&&dist(bloco,P)<28)near={k:'bloco',o:bloco};
    if(!near&&dist(FESTA,P)<22)near={k:'festa',o:FESTA};
    if(!near&&dist(MARACA,P)<24)near={k:'maraca',o:MARACA};
    if(!near&&dist(SURF,P)<24)near={k:'surf',o:SURF};
    if(boss&&finalStage===1&&dist(boss,P)<34)near={k:'boss',o:boss};
    if(!near)for(const b of barDoors)if(dist(b,P)<15){near={k:b.kind==='sinuca'?'sinuca':'bar',o:b};break;}
    if(!near){let v=null,vd=22;for(const n of npcs){const d=dist(n,P);if(!n.beggar&&n.stun<=0&&n.flee<=0&&totalMin-(n.falouEm??-1e9)>=CONV_GAP&&d<vd){v=n;vd=d;}}if(v)near={k:'npc',o:v};}
    if(!near)for(const s of busStops)if(dist(s,P)<16){near={k:'bus',o:s};break;}
    if(!near)for(const c of chairs)if(dist(c,P)<14){near={k:'chair',o:c};break;}
    const sleepy=near&&(near.k==='bus'||near.k==='chair'),rest=sleepy&&!canRest(near.o);nearK=near?near.k:null;
    setPrompt(near&&near.k==='npc'?KL+': falar com '+near.o.quem:near?KL+': '+{alt:'jogar altinha',bloco:'buscar o Bloco Secreto',bar:'entrar no bar',sinuca:'jogar bambina no bar',festa:'entrar no Circo Voador',lab:'entrar nos becos do Santo Amaro',maraca:'invadir o Maracanã',surf:'pegar onda com o Lucas',bus:'cochilar',chair:'cochilar',boss:'encarar o BLOCO DO JAMAL'}[near.k]:null);
    if(act&&rest){toast('Já cochilei aqui. Bora achar outro canto.','',2.2);}
    else if(act&&!near&&fx.spider>0)shootWeb();
    else if(act&&near&&near.k==='npc')abreConversa(near.o);
    else if(act&&near){if(near.k==='boss'){startGuitarra();return;}if(near.k==='lab'){if(temSax())startLabirinto();else toast('Um moleque na escada: "Os becos só abrem pra quem tem sax. Acha o saxofone no Bloco Secreto e volta aqui."','',4);return;}if(near.k==='alt'){startAltinha();return;}if(near.k==='bloco'){startBloco();return;}if(near.k==='bar'){startBar();return;}if(near.k==='sinuca'){startSinuca();return;}if(near.k==='festa'){startFesta();return;}if(near.k==='maraca'){startMaraca();return;}if(near.k==='surf'){startSurf();return;}if(near.k==='bus')startNap(near.o);else startChair(near.o);}
    if(tileAt(Math.floor(P.x/T),Math.floor((P.y-2)/T))===DOOR){gameOver('door');return;}
    // chegou no porto com o bloco: embarca!
    if(finalStage===2&&dist(P,DOCKP)<22){finalStage=3;winGame();return;}
  }
  // Homem-Aranha no telhado: sobe escalando e fica lá em cima (o desenho sobe e ganha sombra)
  if(!P.queda){const tt=tileAt(Math.floor(P.x/T),Math.floor((P.y-2)/T)),alvo=fx.spider>0&&CLIMB.has(tt)?12:0;
    P.escalando=alvo>0&&P.jumpZ<alvo-1;P.jumpZ=(P.jumpZ||0)+(alvo-(P.jumpZ||0))*Math.min(1,dt*(alvo?5:9));if(P.jumpZ<.2&&!alvo)P.jumpZ=0;}
  for(const it of items){
    if(it.type==='shroom'){it.talkCd-=dt;if(it.talkCd<=0&&dist(it,P)<60&&dist(it,P)>12){it.talkCd=rnd(6,10);let s=pick(L.shroomTalk);s=s.replace('{d}',dirWord(mom,it)).replace('{b}',bloco?dirWord(bloco,it):'norte').replace('{h}',Math.floor(totalMin/60));bubble(it,s,2.6,'shroom',20);}}
    if(!P.hidden&&dist(it,P)<10&&P.mode==='free'){it.dead=true;
      takeItem(it);}
  }
  items=items.filter(i=>!i.dead);
  if(temSax()&&sabeMusica&&palhetas<3&&!items.some(i=>i.type==='palheta')){palhetaT-=dt;if(palhetaT<=0){palhetaT=rnd(60,90);const p=randTileFrom(walkTiles,200);if(!noNavio(p.x,p.y))items.push({type:'palheta',x:p.x,y:p.y,h:18});}}
  spawnT-=dt;if(spawnT<=0){spawnT=1.5;const tg=targets();for(const k in tg){if(k==='shades'&&fx.disguise>0)continue; // de óculos, não aparece outro
const n=items.filter(i=>i.type===k&&!i.aluc).length;if(n<tg[k]){spawnItem(k);break;}}}
  // quase apagando: as alucinações viram itens de verdade, a chance de voltar pro jogo
  if(P.energy<22){fakeT-=dt;if(fakeT<=0){fakeT=rnd(2,4);if(items.filter(i=>i.aluc).length<3){const ang=rnd(0,Math.PI*2),r=rnd(40,90);const x=P.x+Math.cos(ang)*r,y=P.y+Math.sin(ang)*r;if(!hitsWall(x,y)&&!noNavio(x,y))items.push({type:pick(['beer','zip','shroom']),x,y,h:18,aluc:true,talkCd:99});}}}
  else items=items.filter(i=>!i.aluc);
  fieldT-=dt;const ptile=idx(clamp(Math.floor(P.x/T),0,MW-1),clamp(Math.floor((P.y-2)/T),0,MH-1));
  if(!playerField||(ptile!==pfTile&&fieldT<=0)){playerField=bfs(ptile%MW,(ptile/MW)|0);pfTile=ptile;fieldT=.25;}
  updMom(dt);updKeys(dt);updTias(dt);updTaxis(dt);updBoss(dt);updNpcs(dt);if(state!=='play')return;
  idleT-=dt;if(idleT<=0){idleT=rnd(12,20);if(P.mode==='free')bubble(P,pick(P.energy<35?L.low:L.idle),2.4);}
  psyT=fx.trip>0?Math.max(0,psyT-dt):0;dragaoCd=Math.max(0,dragaoCd-dt);
  // quanto mais bêbado/viajando, mais ele fala MERMÃO
  const doido=nivelDoido();if(doido>0){mermT-=dt*doido;if(mermT<=0){mermT=rnd(6,9);if(P.mode==='free'&&!chairS&&!napS)bubble(P,pick(MERMAO),2.2);}}else mermT=Math.min(mermT+dt,4);
  if(P.energy<=0){P.energy=0;gameOver('energy');}
  else if(P.sono>=100){gameOver('sono');return;}
  let filt='';if(psyT>0)filt+=`hue-rotate(${Math.floor(time*260)%360}deg) saturate(2.6) contrast(1.2) `;else if(fx.trip>0)filt+=`hue-rotate(${Math.floor(time*120)%360}deg) saturate(1.8) `;if(fx.turbo>0)filt+='contrast(1.15) saturate(1.3) ';if(P.energy<20)filt+=`blur(${(0.3+Math.sin(time*2)*0.3).toFixed(2)}px) `;
  cv.style.filter=filt;
  cv.style.transform=psyT>0?`rotate(${(Math.sin(time*1.3)*2.6).toFixed(2)}deg) skewX(${(Math.sin(time*.9)*3).toFixed(2)}deg) scale(${(1.06+Math.sin(time*2.2)*.03).toFixed(3)})`:(fx.drunk>0||fx.trip>0)?`rotate(${(Math.sin(time*1.7)*1.2).toFixed(2)}deg) scale(1.03)`:'';
  $('psy').style.opacity=psyT>0?String(Math.min(.55,psyT/6)):'0';
  $('vig').style.opacity=P.energy<35?String(clamp((35-P.energy)/30,0,1)):'0';
  updHUD();
}
function dirWord(a,from){const dx=a.x-from.x,dy=a.y-from.y;return Math.abs(dx)>Math.abs(dy)?(dx>0?'leste':'oeste'):(dy>0?'lado da praia':'norte');}
let promptObj=null,nearK=null;
function setPrompt(text){
  if(!text){if(promptObj){promptObj.el.remove();promptObj.dead=true;promptObj=null;}return;}
  if(promptObj&&promptObj.text===text&&!promptObj.dead){promptObj.t=1;return;}
  if(promptObj){promptObj.el.remove();promptObj.dead=true;}
  const el=document.createElement('div');el.className='bub prompt';el.textContent=text;bubLayer.appendChild(el);
  promptObj={el,target:P,t:1,off:48,text,dead:false};bubbles.push(promptObj);
}
// cogumelos em seguida: 4+ deixa tudo psicodélico, 5+ o dragão mestre cruza a tela
let shroomStreak=0,lastShroomT=-999,psyT=0,dragaoCd=0,mermT=6;
const DRAGAO_FALAS=['Jovem Markin... cogumelo demais em seguida não é rolê, é roleta. Vai com calma.','Ouça o mestre: muito cogumelo confunde a mente e o corpo. Pare, beba água, descanse.','Cogumelo, cerveja e zero sono? Nem dragão aguenta essa mistura, jovem.','Sabedoria antiga: dose alta traz bad trip, ansiedade e paranoia. Respeite o seu limite.','Cogumelo desconhecido pode ser venenoso. Na dúvida, não coma.'];
function comeuCogumelo(semDragao){
  shroomStreak=time-lastShroomT<90?shroomStreak+1:1;lastShroomT=time;
  if(shroomStreak>=4){psyT=fx.trip||12;if(shroomStreak===4)toast('Quatro cogumelos... o mundo derreteu em cores.','',2.6);}
  if(shroomStreak>=5&&dragaoCd<=0&&!semDragao)chamaDragao();}
function chamaDragao(){dragaoCd=40;const d=$('dragao');$('dragaoFala').textContent=pick(DRAGAO_FALAS);
  d.hidden=false;d.classList.remove('voa');void d.offsetWidth;d.classList.add('voa');sfx.horn();
  clearTimeout(chamaDragao.t);chamaDragao.t=setTimeout(()=>{d.hidden=true;d.classList.remove('voa');},12200);}
const MERMAO=['MERMÃO...','MERMÃÃÃO!','Mermão, olha isso, mermão...','MERMÃO, eu tô bem, MERMÃO.','Mermão... que que eu tava falando?','MERMÃO, te amo, mermão!'];
function nivelDoido(){return (fx.drunk>0?1:0)+(fx.drunk>10?1:0)+(fx.trip>0?1:0)+(psyT>0?1:0)+(shroomStreak>=3&&time-lastShroomT<90?1:0);}
function takeItem(it){
  if(it.type==='palheta'){palhetas=Math.min(3,palhetas+1);sfx.pick();toast(`Achou uma palheta de sax! (${palhetas}/3)`,'good');return;}
  if(it.type!=='shroomRoxo')P.sono=Math.max(0,P.sono-5); // item dá uma acordada (o cogumelo estragado não)
  if(it.type.startsWith('shroom'))comeuCogumelo();
  sfx.pick();if(mus&&it.type.startsWith('shroom'))mus.shroomT=it.type==='shroomAranha'?16:it.type==='shroomRoxo'?9:12;
  if(it.type==='beer'){gain(12);sfx.gulp();fx.beers=fx.beers.filter(t=>time-t<40);fx.beers.push(time);
    if(fx.beers.length>=3){fx.drunk=10;fx.beers=[];librasPend=true;toast('Três brejas... o chão tá balançando.','bad');}else toast(pick(L.beer),'good');}
  else if(it.type==='zip'){gain(20);fx.turbo=10;fx.crash=0;sfx.sniff();toast(pick(L.zip),'good');shake=.3;}
  else if(it.type==='shroom'){gain(22);fx.trip=12;sfx.trip();bubble(it,pick(L.shroomEat),1.8,'shroom',20);toast('Viagem: controles invertidos!','');}
  else if(it.type==='shades'){gain(5);fx.disguise=12.5;items=items.filter(o=>o.type!=='shades'); // tira os outros óculos do mapa enquanto ele tá de óculos
  toast('Óculos escuros: ninguém te reconhece.','good');}
  else if(it.type==='shroomAranha'){gain(15);fx.spider=16;fx.trip=0;sfx.trip();sfx.rip();shake=.3;
    for(let i=0;i<16;i++)particles.push({x:P.x+rnd(-6,6),y:P.y-rnd(4,20),vx:rnd(-50,50),vy:rnd(-70,-20),g:120,life:rnd(.6,1.1),col:pick(['#d0202a','#1f4fb5','#f4f1e8']),s:2});
    bubble(P,'COM GRANDES PODERES VEM GRANDES ROLÊS!',2.6,'aranha',46);toast(`HOMEM-ARANHA! Escala prédio, ninguém te reconhece e ${KL} solta teia na mãe!`,'good',3.6);}
  else if(it.type==='shroomGold'){gain(35);sfx.win();toast('Cogumelo dourado! Energia lá em cima, sem viagem.','good');}
  else if(it.type==='shroomRoxo'){lose(12);fx.sleepy=9;sfx.zzz();bubble(P,'Puta que pariu, peguei um cogu estragado!',2.8);toast('Cogumelo estragado: sono pesado, pernas moles.','bad');}
}
// quando acaba o efeito de Homem-Aranha em cima de um prédio, ele desce pro chão mais perto
function endSpider(){
  if(hitsWall(P.x,P.y)){const t=nearestTile(Math.floor(P.x/T),Math.floor((P.y-2)/T),(tt,x,y)=>walkable(tt)&&tt!==DOOR&&y<50);
    if(t){interruptRest();P.queda={t:0,x0:P.x,y0:P.y,x1:t.x*T+8,y1:t.y*T+12,z0:P.jumpZ||12};toast('O efeito passou lá em cima do prédio... PULA!','bad',2.2);return;}}
  toast('O efeito de Homem-Aranha passou.','',2.2);
}
// o pulo do telhado: arco até o chão mais perto e -10 de energia na aterrissagem
function updQueda(dt){const q=P.queda;q.t+=dt;const u=Math.min(1,q.t/.7);
  P.x=q.x0+(q.x1-q.x0)*u;P.y=q.y0+(q.y1-q.y0)*u;P.jumpZ=q.z0*(1-u)+Math.sin(u*Math.PI)*18;P.dir=q.x1<q.x0?'left':'right';P.moving=false;
  if(u>=1){P.queda=null;P.jumpZ=0;lose(10);sfx.hit();shake=.45;particles.push({x:P.x,y:P.y-30,vx:0,vy:-20,g:0,life:1.1,text:'AI!',col:'#ff6b5d'});}}
// teia: gruda a mãe, a chave, as tias e o táxi mais perto
function shootWeb(){
  if(webCd>0)return;
  const cands=[];for(const n of npcs)if(n.beggar)cands.push({o:n,k:'mendigo'});
  if(mom)cands.push({o:mom,k:'mae'});for(const k of keysE)cands.push({o:k,k:'chave'});for(const t of tias)cands.push({o:t,k:'tia'});for(const c of taxis)cands.push({o:c,k:'taxi'});
  const alvo=cands.map(c=>({...c,d:dist(c.o,P)})).filter(c=>c.d<120).sort((a,b)=>a.d-b.d)[0];
  webCd=1;beep(1600,.12,'sawtooth',.03,400);
  if(!alvo){bubble(P,'*thwip* ...errou.',1.2,'aranha',46);return;}
  const o=alvo.o;o.webUntil=time+(alvo.k==='mae'?5:alvo.k==='chave'?7:6);if(alvo.k==='mendigo'){o.stun=6;bubble(o,'Me solta, Homem-Aranha! Só queria um real!',1.6);}
  particles.push({x:P.x,y:P.y-14,vx:0,vy:0,life:.35,web:{x:o.x,y:o.y-10}});
  if(alvo.k==='mae'){mom.stun=5;mom.chasing=false;bubble(mom,'Que teia é essa?! MARKIN?!',2,'mom');}
  else if(alvo.k==='chave'){o.cd=7;bubble(o,'*plim* grudei...',1.6,'',18);}
  else if(alvo.k==='tia'){o.alert=4;o.cd=12;bubble(o,'Credo! Aranha!',1.6,'tia');}
  else{o.stuck=4;bubble(o,'O pneu grudou!',1.6,'mom',16);}
}
// só dá pra dormir (ponto ou cadeira) de 3 em 3 horas
let lastSleep=-999,lastRest={chair:-99999,bus:-99999};
const REST_GAP=720; // 12h de jogo pra cochilar de novo no mesmo ponto ou cadeira
const REST_GAIN={chair:10,bus:20};
const SONO_MIN=100/(48*60); // 3h de sono a cada 2 dias: a barra enche em 48h acordado
const SONO_NAP={bus:100,chair:50}; // ponto de ônibus (3h) zera o sono, cadeira (1h30) tira metade
const NAP_MIN={bus:180,chair:90};
function canRest(o){return totalMin-(o.lastRest??-99999)>=REST_GAP;} // no mesmo lugar só 12h depois; outro lugar pode na hora
// cochilo: 2,4 s de tela com o relógio correndo 3h, energia subindo aos poucos; se alguém interromper, não ganha nada
function startNap(stop){napS={kind:'bus',o:stop,t:0,dur:2.4,got:0};P.mode='nap';P.x=stop.x;P.y=stop.y+2;P.dir='down';setPrompt(null);sfx.zzz();}
function startChair(c){chairS={kind:'chair',c,o:c,oy:P.y,t:0,dur:2.4,got:0};P.mode='chair';P.x=c.x;P.y=c.y-1;P.dir='down';setPrompt(null);sfx.zzz();}
function updCochilo(s,dt){
  const k=Math.min(dt,s.dur-s.t);s.t+=k;totalMin+=NAP_MIN[s.kind]*k/s.dur;const want=REST_GAIN[s.kind]*s.t/s.dur;gain(want-s.got,'');particles.pop();s.got=want;P.sono=Math.max(0,P.sono-SONO_NAP[s.kind]*k/s.dur);
  if(Math.random()<dt*3)particles.push({x:P.x+5,y:P.y-22,vx:6,vy:-12,g:0,life:1.2,text:'z',col:'#e9f4ff'});
  if(s.t>=s.dur){s.o.lastRest=totalMin;lastSleep=totalMin;particles.push({x:P.x,y:P.y-40,vx:0,vy:-14,g:0,life:1.6,text:`+${s.kind==='chair'?'1h30':'3h'}  +${REST_GAIN[s.kind]}`,col:'#bfe0ff'});
    if(s.kind==='chair'){P.y=s.c.y+8;chairS=null;}else napS=null;P.mode='free';}
}
function updNap(dt){updCochilo(napS,dt);}
function updChair(dt){updCochilo(chairS,dt);}
function endChair(){if(!chairS)return;P.y=chairS.c.y+8;chairS=null;P.mode='free';}
const GREET_MOM=['Boa noite, moço!','Oi, tudo bem, moço?','Licença, jovem.','Que óculos bonito, rapaz.'];
const GREET_TIA=['Boa tarde, moço!','Olá, jovem!','Tá calor hoje, né, moço?','Bonito esse óculos, rapaz!'];
const GREET_ARANHA=['Olha o Homem-Aranha!','Tira uma foto comigo, Aranha!','Meu filho adora você!','Que roupa apertada, hein?'];
function updMom(dt){
  const m=mom;m.alertT=Math.max(0,m.alertT-dt);m.knowT=Math.max(0,(m.knowT||0)-dt);m.greetCd=Math.max(0,(m.greetCd||0)-dt);
  if(grab&&grab.kind==='mae'){m.x=P.x+9;m.y=P.y;m.dir='left';m.chasing=true;m.moving=P.moving;if(m.moving)m.anim+=dt;return;} // segurando pelo braço
  if(m.tonto>0)m.tonto-=dt;
  if(m.stun>0){m.stun-=dt;m.moving=false;return;}
  if(tregua>0||grab){m.chasing=false;m.moving=dist(m,P)<130&&afasta(m,30,dt);if(m.moving)m.anim+=dt;return;}
  const d=dist(m,P),disg=incog();
  // de óculos escuros (ou de Homem-Aranha) ela não reconhece: só cumprimenta como se fosse um moço qualquer
  if(disg){m.chasing=false;if(d<34&&m.greetCd<=0&&P.mode!=='cut'){m.greetCd=9;bubble(m,pick(fx.spider>0?GREET_ARANHA:GREET_MOM),2.2,'mom');}}
  const sees=!disg&&d<88;
  if(!disg&&!m.chasing&&(sees||m.alertT>0)){m.chasing=true;if(sees){bubble(m,pick(L.momSpot),1.6,'mom');sfx.alert();}}
  if(m.chasing&&!sees&&m.alertT<=0&&d>150)m.chasing=false;
  if(m.chasing){const sp=(48+(m.alertT>0?14:0))*DF().ini*.75;followField(m,playerField,P,sp,dt);if(d<18)moveAxis(m,P.x-m.x,P.y-m.y,sp*dt);}
  else{
    if(!m.target||dist(m,m.target)<6){const t=pick(spawnSets.beer.filter(tt=>Math.abs(tt.x-38)<22&&tt.y<44));m.target={x:t.x*T+8,y:t.y*T+10};m.field=bfs(t.x,t.y);}
    followField(m,m.field,m.target,30,dt);
  }
  if(m.moving)m.anim+=dt;
  if(!disg&&!grab&&d<10&&P.mode!=='cut'&&Math.random()<.5){interruptRest();sfx.alert();bubble(m,pick(['Peguei! Bora pra casa!','Agora tu vem comigo!','Chega de rua, Markin!']),2.2,'mom');startGrab('mae',m);return;}
  if(!disg&&!grab&&d<10&&P.mode!=='cut'){ // chinelada
    apanhou();interruptRest();lose(22);sfx.hit();bubble(m,'CHINELADA! '+pick(L.momHit),2.4,'mom');particles.push({x:P.x,y:P.y-30,vx:0,vy:-20,g:0,life:1,text:'PÁ!',col:'#ffe14f'});m.stun=2.6;m.chasing=false;setTimeout(()=>{if(state==='play'&&!grab)saidaSegura();},900);
    const dx=P.x-m.x,dy=P.y-m.y,dd=Math.hypot(dx,dy)||1;for(let i=0;i<10;i++)moveP(dx/dd*2.4,dy/dd*2.4);
  }
}
function updKeys(dt){
  for(const k of keysE)if(k.tonto>0)k.tonto-=dt;
  while(keysE.length<nKeys()){const p=randTileFrom(walkTiles,240);keysE.push({x:p.x,y:p.y,h:18,cd:0});}
  const sp=32*DF().ini;
  for(const k of keysE){
    if(grab&&grab.ref===k){k.x=P.x+7;k.y=P.y-4;continue;} // presa no Markin
    k.cd=Math.max(0,(k.cd||0)-dt);
    if(tregua>0||grab){if(dist(k,P)<130)afasta(k,sp,dt);continue;}
    if(incog()||k.cd>0)continue; // de óculos (ou de Homem-Aranha) a chave não te acha
    followField(k,playerField,P,sp,dt);if(dist(k,P)<16)followDirect(k,P,sp,dt);
    if(!grab&&dist(k,P)<9&&P.mode!=='cut'){interruptRest();sfx.key();lose(4);startGrab('chave',k);}
  }
}
function followDirect(e,t,sp,dt){moveAxis(e,t.x-e.x,t.y-e.y,sp*dt*.5);}
function updTias(dt){
  for(const t of tias){t.cd=Math.max(0,t.cd-dt);t.alert=Math.max(0,t.alert-dt);
    if(t.alert<=0&&!(t.webUntil>time))patrolStep(t,16,dt);else t.moving=false;
    if(t.cd<=0&&dist(t,P)<(incog()?30:54)&&P.mode!=='cut'){
      if(incog()){t.cd=10;bubble(t,pick(fx.spider>0?GREET_ARANHA:GREET_TIA),2.2,'tia');}
      else{t.cd=14;t.alert=2.5;bubble(t,pick(L.tia),2.2,'tia');mom.alertT=7;mom.knowT=40;mom.chasing=true;sfx.alert();toast('Uma tia te dedurou! A mãe tá vindo.','bad');}}
  }
}
/* ---------- PRESO: a chave ou a mãe te arrastam pra casa; toque várias vezes pra se soltar ---------- */
let grab=null,homeField=null,tregua=0;
// depois que alguém pega o Markin, os outros se afastam por um tempo
function apanhou(){tregua=Math.max(tregua,8);}
const afasta=(o,sp,dt)=>moveAxis(o,o.x-P.x,o.y-P.y,sp*dt,(x,y)=>!hitsWall(x,y));
function startGrab(kind,ref){
  if(!homeField)homeField=bfs(DOORT.x,DOORT.y);
  const need=kind==='mae'?14:9;
  closeBeg();grab={kind,ref,need,left:need,t:0};actionQ=false;apanhou();
  toast(kind==='mae'?'A mãe te pegou pelo braço! Toque rápido pra se soltar!':'*plim plim* A chave te prendeu! Toque rápido pra se soltar!','bad',3);
  bubble(kind==='mae'?mom:P,kind==='mae'?pick(['Achei! Pra dentro, agora!','Chega de rua, Markin!','A sopa de chuchu tá esfriando!']):'ME SOLTA!',2.2,kind==='mae'?'mom':'',kind==='mae'?26:46);
}
function updGrab(dt,act){
  const g=grab;g.t+=dt;
  if(act){g.left-=1;shake=.12;beep(500+(g.need-g.left)*40,.05,'square',.04);}
  g.left=Math.min(g.need,g.left+dt*(g.kind==='mae'?1.1:.8)); // se parar de tocar, volta a prender
  if(g.left<=0){ // soltou!
    if(g.kind==='chave'){g.ref.cd=10;g.ref.tonto=10;g.ref.y+=10;toast('Se soltou da chave! Ela ficou tonta.','good');}
    else{mom.stun=10;mom.tonto=10;mom.chasing=false;bubble(mom,'Volta aqui, menino!!',2,'mom');moveP(0,10);toast('Se soltou da mãe! Corre!','good');}
    grab=null;flash=.3;tregua=8;return;
  }
  // arrastado pro rumo da porta
  g.drainT=(g.drainT||0)+dt;if(g.drainT>=2){g.drainT-=2;lose(5);} // arrastado cansa: -5 a cada 2 s
  const sp=g.kind==='mae'?8+80*(1-Math.exp(-dist(P,HOME)/250)):54; // a mãe puxa rápido longe de casa e bem devagar perto da porta
  followField(P,homeField,HOME,sp,dt);P.anim+=dt;
}

/* ================= MINIGAMES ================= */
const ALT={x:57*T+8,y:47*T+6,h:34};
const MG_STATES=['altinha','bloco','bar','sinuca','festa','guitarra','maraca','surf','labirinto'];
const MARACA={x:19*T,y:21*T+10,h:34}; // portão do Maracanã, na calçada embaixo do estádio
/* ---------- TAREFAS: só zera cumprindo as 5 dentro dos 15 dias ---------- */
const TASKS=[
  {k:'altinha',curto:'Altinha',nome:'Altinha de 8 toques',onde:()=>ALT,lugar:'na areia da praia'},
  {k:'bloco',curto:'Bloco',nome:'Achar o Bloco Secreto',onde:()=>bloco,lugar:'na Lapa, embaixo dos Arcos'},
  {k:'bar',curto:'Bar',nome:'Beber 6 cervejas',onde:()=>barDoors.find(b=>b.kind==='cabeca'),lugar:'no bar de placa amarela'},
  {k:'sinuca',curto:'Bambina',nome:'Ganhar na bambina',onde:()=>barDoors.find(b=>b.kind==='sinuca'),lugar:'no bar de placa verde'},
  {k:'festa',curto:'Circo Voador',nome:'Conquistar a gatinha',onde:()=>FESTA,lugar:'no Circo Voador, na Lapa'},
  {k:'maraca',curto:'Maracanã',nome:'Fazer gol no Maracanã',onde:()=>MARACA,lugar:'no estádio ao lado da favela'},
  {k:'surf',curto:'Surf',nome:'Surfar 2500 pontos',onde:()=>SURF,lugar:'na areia, depois do navio'}
];
let tasksDone={},hintT=12;
function markTask(k){if(tasksDone[k])return;tasksDone[k]=true;const n=TASKS.filter(t=>tasksDone[t.k]).length;
  const b=addBuddy(k);
  setTimeout(()=>{const NT=TASKS.length;banner(n>=NT?'TODAS AS TAREFAS!':`TAREFA ${n}/${NT}`,n>=NT?'O BLOCO DO JAMAL saiu pelas ruas. Ache o chefão!':`${TASKS.find(t=>t.k===k).nome} · ${b.nome} entrou pra galera!`,3.2);
    if(b)bubble(b,b.oi,2.8,'buddy');
    if(n>=NT)spawnBoss();},60);}
/* ---------- A GALERA: cada desafio vencido traz um amigo que segue o Markin ---------- */
const BUDDY_DEFS={
  maraca:{nome:'Torcedor',skin:'#c98c64',hair:'#1e140e',shirt:'#f2d230',shorts:'#2d6fd1',prop:'ball',oi:'Tu invadiu o Maracanã e fez gol?! Tô contigo!',
    lines:['Olê, olê, olê, olá!','Aqui é Maracanã!','Tu é o camisa 10!','Bora pra geral!']},
  altinha:{nome:'Cria',skin:'#b8733f',hair:'#f4ecb0',shirt:null,shorts:'#d8332f',prop:'ball',oi:'Tu é craque na altinha! Vou contigo!',
    lines:['Bora uma altinha depois?','Tô contigo, parceiro!','Areia quente, pé no chão.','Esse rolê não acaba nunca!']},
  bloco:{nome:'Folião',skin:'#8a5a3a',hair:'#ff4fd8',shirt:'#ffe14f',shorts:'#4fffd2',prop:'glitter',oi:'Achou o Bloco Secreto?! Agora eu te sigo!',
    lines:['ALALAÔ-Ô-Ô!','Purpurina não sai nunca mais.','Cadê o próximo bloco?','Mamãe eu quero!']},
  bar:{nome:'Seu Zé',skin:'#c98c64',hair:'#9a9a9a',shirt:'#f4f1e8',shorts:'#2d6fd1',prop:'beer',belly:true,beard:'#bdbdbd',oi:'Seis brejas e de pé? Tu é dos meus!',
    lines:['Mais uma, garçom!','No meu tempo a gente virava 3 dias.','Saideira? Nunca.','Cerveja é hidratação.']},
  sinuca:{nome:'Tubarão',skin:'#8a5a3a',hair:'#1e140e',shirt:'#2f6e52',shorts:'#1d1d22',prop:'taco',shades:true,cap:'#1d1d22',oi:'Me ganhou na bambina... respeito. Tô contigo.',
    lines:['Vermelha no canto, parceiro.','Taco é extensão do braço.','Ninguém me ganha... quase ninguém.','Fica frio, eu cuido da retaguarda.']},
  festa:{nome:'Gatinha',skin:'#e8b894',hair:'#b58cff',shirt:'#141018',shorts:'#141018',skirt:true,long:true,earring:true,oi:'Eu disse que não era pra sumir. Bora junto!',
    lines:['Tu me deve um nascer do sol.','Que rolê, hein?','Tua mãe liga muito, né?','Vai ter bloco? Eu vou!']}
};
const BUDDY_WARN=['Corre, Markin! Tua mãe!','A MÃE! A MÃE TÁ VINDO!','Disfarça que tua mãe tá aí!','Vaza, vaza, vaza!'];
function addBuddy(k){
  const d=k==='surf'?DUDU:BUDDY_DEFS[k];if(!d)return null;
  const b={...d,k,x:P.x+rnd(-8,8),y:P.y+6,dir:'down',anim:0,moving:false};
  if(k==='festa')b.hair=gatHair;
  buddies.splice(buddies.filter(o=>!o.crowd).length,0,b);return b;
}
function addCrowd(){ // foliões genéricos do Bloco do Markin
  const i=buddies.filter(o=>o.crowd).length;
  const b={nome:'folião',crowd:true,skin:pick(['#d29a6c','#b8733f','#8a5a3a','#e0b08a']),hair:pick(['#1e140e','#ff4fd8','#4fffd2','#ffe14f','#e84a4a']),
    shirt:pick(['#ff4fd8','#4fffd2','#ffe14f','#ff8a3d','#9b76d6','#e84a4a','#f4f1e8']),shorts:pick(['#2d6fd1','#1d1d22','#f4f1e8','#2f9a55']),
    prop:i===1?'bandeira':i%2?'tamborim':'glitter',banner:i===1,ox:rnd(-7,7),x:P.x+rnd(-30,30),y:P.y+rnd(-10,20),dir:'down',anim:0,moving:false};
  buddies.push(b);return b;
}
// o bloco: a galera anda embolada em volta e um pouco atrás do Markin, cada um no seu ritmo, trocando de lugar
function blocoSlot(b,n){b.ang=rnd(0,Math.PI*2);b.rad=rnd(.35,1)*(12+Math.sqrt(n)*7);b.lag=Math.floor(rnd(4,20));b.slotT=rnd(2,5);}
function updBuddies(dt){
  const last=trail[trail.length-1];
  if(!last||dist(last,P)>48){trail=[];for(let i=0;i<120;i++)trail.push({x:P.x,y:P.y});for(const b of buddies){b.x=P.x+rnd(-16,16);b.y=P.y+rnd(-6,14);b.slotT=0;}}
  else if(dist(last,P)>=2){trail.push({x:P.x,y:P.y});if(trail.length>260)trail.splice(0,trail.length-260);}
  const n=buddies.length;
  for(const b of buddies){
    if(b.pace===undefined){b.pace=rnd(.75,1.25);b.ph=rnd(0,6.3);b.slotT=0;}
    b.slotT-=dt;if(b.slotT<=0)blocoSlot(b,n);
    b.ang+=Math.sin(time*.7+b.ph)*.5*dt; // o lugar de cada um vai girando devagar
    const c=trail[Math.max(0,trail.length-1-b.lag)];
    let gx=c.x+Math.cos(b.ang)*b.rad+Math.sin(time*2.3+b.ph)*3,gy=c.y+Math.sin(b.ang)*b.rad*.6+Math.cos(time*1.9+b.ph)*2;
    if(hitsWall(gx,gy)){gx=c.x;gy=c.y;} // não entra em parede: volta pro caminho do Markin
    for(const o of buddies){if(o===b)continue;const ox=b.x-o.x,oy=b.y-o.y,od=Math.hypot(ox,oy);if(od>0&&od<8){gx+=ox/od*(8-od);gy+=oy/od*(8-od);}} // ninguém fica em cima do outro
    const dx=gx-b.x,dy=gy-b.y,d=Math.hypot(dx,dy);
    if(d>1.5){const m=Math.min(d,Math.max(30,d*4)*b.pace*dt),preso=hitsWall(b.x,b.y);
      moveAxis(b,dx,dy,m,(x,y)=>preso||!hitsWall(x,y));
      b.moving=true;b.anim+=dt*b.pace;}
    else{b.moving=Math.sin(time*6+b.ph)>.2;if(b.moving)b.anim+=dt;b.dir=Math.sin(time*.9+b.ph)>0?'down':Math.cos(time*.7+b.ph)>0?'left':'right';} // parado, fica pulando e olhando em volta
  }
  if(state!=='play'||!buddies.length)return;
  buddyT-=dt;if(buddyT<=0){buddyT=rnd(11,17);
    const fr=buddies.filter(b=>!b.crowd);const b=pick(fr.length?fr:buddies);
    if(mom&&mom.chasing&&dist(mom,P)<220)bubble(b,pick(BUDDY_WARN),2.2,'buddy');
    else if(b.crowd)bubble(b,pick(['FODA-SE A CASA!','Sem volta pra casa!','Bloco do Markin!','ALALAÔ!']),2,'buddy');
    else bubble(b,pick(b.lines),2.4,'buddy');}
}
/* ---------- CHEFÃO: o Bloco do Jamal roda pelas ruas depois das 7 tarefas ---------- */
function spawnBoss(){
  if(finalStage>0)return;finalStage=1;
  for(let i=0;i<60;i++){const x=(pick(VROADS)+1)*T,y=(pick(TX_H)+1)*T;const b={x,y,h:48,dir:pick([[1,0],[-1,0],[0,1],[0,-1]]),node:'',lineT:rnd(2,4)};if(dist(b,P)>260||i===59){boss=b;break;}}
  sfx.horn();hintT=6;
  toast('Tá ouvindo esse saxofone? O JAMAL saiu tocando pela cidade. Ache ele pelas ruas!','good',4.5);
}
function relocateBoss(){if(!boss)return;for(let i=0;i<60;i++){const x=(pick(VROADS)+1)*T,y=(pick(TX_H)+1)*T;if(dist({x,y},P)>300||i===59){boss.x=x;boss.y=y;boss.node='';break;}}}
function updBoss(dt){
  if(!boss||finalStage!==1)return;
  const c=boss,sp=24*dt;
  const nx=VROADS.map(v=>(v+1)*T).find(x=>Math.abs(c.x-x)<sp+.5),ny=TX_H.map(r=>(r+1)*T).find(y=>Math.abs(c.y-y)<sp+.5);
  if(nx!==undefined&&ny!==undefined){const key=nx+','+ny;if(c.node!==key){c.node=key;c.x=nx;c.y=ny;
    const opts=[[1,0],[-1,0],[0,-1],[0,1]].filter(o=>!(o[0]===-c.dir[0]&&o[1]===-c.dir[1])&&!(o[1]===1&&ny>=(ORLA_Y+1)*T)&&!(o[1]===-1&&ny<=T*2));
    c.dir=pick(opts);}}
  else c.node='';
  // perto do Markin o trio para e espera
  if(dist(c,P)>40){c.x+=c.dir[0]*sp;c.y+=c.dir[1]*sp;}
  if(c.x<8||c.x>MW*T-8||c.y<8||c.y>(ORLA_Y+1)*T+1){c.dir=[-c.dir[0],-c.dir[1]];c.x=clamp(c.x,8,MW*T-8);c.y=clamp(c.y,8,(ORLA_Y+1)*T);}
  if(dist(c,P)<200){c.lineT-=dt;if(c.lineT<=0){c.lineT=rnd(4,7);bubble(c,pick(['Quem tem coragem de tocar com o Jamal?','Bloco sem saxofone não é bloco!','Chega mais, moleque!','Tá com medo do saxofone?','Ô MARKIN! Tô te esperando!']),2.4,'boss',56);}}
}
function dirHint(p){const dx=p.x-P.x,dy=p.y-P.y,d=Math.hypot(dx,dy);if(d<120)return 'aqui pertinho';
  const v=Math.abs(dy)>60?(dy<0?'no':'su'):'',h=Math.abs(dx)>60?(dx>0?'leste':'oeste'):'';
  const w=v&&h?{'noleste':'nordeste','nooeste':'noroeste','suleste':'sudeste','suoeste':'sudoeste'}[v+h]:v?(v==='no'?'norte':'sul'):h;
  return 'pro '+w+(d>700?', bem longe':'');}
function taskHint(){const pend=TASKS.filter(t=>!tasksDone[t.k]);
  if(!pend.length){
    if(finalStage===1&&boss)toast(`Dica: o Bloco do Jamal (o chefão) tá ${dirHint(boss)}. Chegue perto dele e aprenda saxofone!`,'',4.5);
    else if(finalStage===2)toast(`Dica: leva o Bloco do Markin pro barco no porto. Fica ${dirHint(DOCKP)}.`,'',4.5);
    return;}
  const t=pend.map(t=>({t,d:dist(t.onde(),P)})).sort((a,b)=>a.d-b.d)[0].t;
  toast(`Dica: falta ${t.nome.toLowerCase()} ${t.lugar}. Fica ${dirHint(t.onde())}. (${pend.length} tarefa${pend.length>1?'s':''} faltando)`,'',4.5);}
let bloco=null,mg=null,altinhaDay=0,jumpQ=false,laneQ=0,joyUp=false,joySide=0;
function relocateBloco(){bloco={x:59*T+8,y:4*T+12,h:36,lineT:rnd(3,6)};} // ponto fixo na Lapa, embaixo dos Arcos
let mgE=100,mgKind='';
function mgEnter(kind){
  if(!MG_STATES.includes(state)&&state!=='mglost')mgE=P.energy; // a energia fica guardada do jeito que ele entrou
  closeBeg();mgKind=kind;state=kind;hideScreen();interruptRest();setPrompt(null);call=null;$('phone').hidden=true;$('hud').hidden=true;clearBubbles();hideDialog();
  cv.style.filter='';cv.style.transform='';$('vig').style.opacity='0';$('psy').style.opacity='0';headCv.hidden=true;$('dragao').hidden=true;$('dragao').classList.remove('voa');$('toast').hidden=true;$('banner').hidden=true;
  actionQ=false;jumpQ=false;laneQ=0;
}
function mgExit(msg,cls,dE,minutes){
  state='play';mg=null;$('hud').hidden=false;$('festa').hidden=true;if(isTouch)$('touch').hidden=false;cv.style.filter='';
  P.energy=Math.min(maxE(),mgE);if(dE>0)gain(dE); // volta com a energia de quando entrou (+ o prêmio, se ganhou)
  saidaSegura();
  totalMin+=minutes;P.sono=Math.min(95,P.sono+minutes*SONO_MIN);toast(msg,cls,3.4);actionQ=false;jumpQ=false;laneQ=0;
}
function mgQuit(){if(!mg)return;const k=state;
  if(k==='surf'&&mg.ganhou&&!mg.result){mg.total=Math.round(mg.total+mg.pts);mg.result='win';mg.done=0;return;} /* já tinha tirado 10: sai ganhando */
  mgExit({surf:'Saiu da água. O Lucas ficou pegando as ondas.',altinha:'Largou a altinha no meio.',bloco:'Desistiu de buscar o Bloco Secreto.',bar:'Pediu a conta e saiu do bar.',sinuca:'Largou o taco e saiu.',festa:'Saiu do Circo Voador de fininho.',maraca:'Desistiu de invadir o Maracanã.',guitarra:'Largou a Guerra dos Músicos. O Jamal riu e seguiu tocando pela rua.',labirinto:'Saiu dos becos sem achar o Tavin.'}[k],'bad',0,0);}
// perdeu o desafio: não sai sozinho, escolhe tentar de novo ou sair (sem perder tempo nem energia)
const MG_RETRY={surf:()=>startSurf(),altinha:()=>startAltinha(),bloco:()=>startBloco(),bar:()=>startBar(barDoors.find(b=>b.kind==='cabeca')),sinuca:()=>startSinuca(barDoors.find(b=>b.kind==='sinuca')),festa:()=>startFesta(),maraca:()=>startMaraca(),guitarra:()=>startGuitarra()};
function mgLost(msg){
  mg=null;$('festa').hidden=true;cv.style.filter='';P.energy=Math.min(maxE(),mgE);state='mglost';if(performance.now()-ultimaDerrota>5000)sfx.lose(); // só toca se o desafio ainda não tocou
  showScreen(`<div class="card"><div class="kicker">não foi dessa vez</div><h2 class="lose">PERDEU</h2><p>${msg}</p><p class="stats">Tempo e energia continuam iguais a quando você entrou.</p><div class="btns"><button data-act="mgRetry" type="button">TENTAR DE NOVO</button><button data-act="mgSair" class="ghost" type="button">Sair</button></div></div>`);
}
// ao voltar pro mundo aberto ninguém fica em cima do Markin
function saidaSegura(){
  const longe=o=>{const p=randTileFrom(walkTiles,220,480);o.x=p.x;o.y=p.y;};
  if(mom&&dist(mom,P)<140){longe(mom);mom.chasing=false;mom.alertT=0;mom.stun=2;mom.target=null;}
  for(const k of keysE){k.cd=Math.max(k.cd||0,4);if(dist(k,P)<140)longe(k);}
  taxis=taxis.filter(c=>dist(c,P)>200);
  for(const n of npcs)if(n.beggar){n.cd=Math.max(n.cd,8);}closeBeg();
}
/* ---------- GENTE DA CIDADE: meninas na praia, Robson do mate, torcedores e o mendigo da Lapa ---------- */
const NPC_DEFS=[
  {k:'mina',quem:'a menina da praia',titulo:'MENINA DA PRAIA',conv:'mina1',area:'praia',rota:[13,45,23,48],sp:14,look:{skin:'#e0b08a',hair:'#3a2210',bikini:'#ff4fa0',long:true,shades:true},lines:['Oi, Markin! Tá sumido, hein?','Bora pro mar?','Você vem sempre aqui, gatinho?','Tu não dorme não, garoto?']},
  {k:'mina',quem:'a menina da praia',titulo:'MENINA DA PRAIA',conv:'mina2',area:'praia',rota:[27,45,36,48],st:2,sp:12,look:{skin:'#8a5a3a',hair:'#1e140e',bikini:'#ffe14f',long:true},lines:['Markin! Tu tá com uma cara...','Passa protetor, hein!','Vai no bloco hoje?','Olha o Markin aí!']},
  {k:'robson',quem:'Robson',titulo:'ROBSON DO MATE',area:'robson',rota:[50,45,62,48],sp:9,vende:true,look:{skin:'#8a5a3a',hair:'#1e140e',shirt:'#f2a02a',shorts:'#1d1d22',cap:'#f2a02a',prop:'beer'},lines:['Vai um mate com acerola hoje, Marcola?','Olha o mate! Limão, mate!','Mate gelaaado!','Vai um mate com acerola hoje, Marcola?']},
  {k:'bala',quem:'o menino da bala',titulo:'MENINO DA BALA',conv:'bala',area:'praia',rota:[66,45,77,48],st:1,sp:18,kid:true,look:{skin:'#8a5a3a',hair:'#1e140e',shirt:'#2d6fd1',shorts:'#f2c230',cap:'#d8332f'},lines:['CRL, MONSTRO SAGRADO!','Olha ele! Quebrador de cama box!','Esse dente aí tá avaliado em 2 apartamentos na Barra da Tijuca!','Tio, tu é o Cauã Raymound? Papo reto!','Olha o Brady Pitt aí, monstro!','Monstro sagrado, leva uma bala aí!','Olha a bala! Bala baiana, jujuba, Halls!']},
  {k:'ze',nome:'Seu Zé',quem:'Seu Zé',titulo:'SEU ZÉ',conv:'ze',area:'rua',anel:true,sp:12,onipresente:true,look:{skin:'#c08a5a',hair:'#d8d8d8',shirt:'#f4f1e8',shorts:'#2d6fd1',beard:'#d8d8d8'},
   lines:[()=>`Ô Markin! ${diasNaRua()} te vendo na rua! Tu mora no meio-fio agora?`,()=>`De novo tu? ${diasNaRua()} seguidos na rua. Já pode pagar IPTU da calçada!`,
     ()=>`${diasNaRua()} na rua, Markin... os pombos já te chamam de vizinho.`,()=>`Te vejo mais na rua que o gari! ${diasNaRua()} já!`,
     ()=>`Olha ele! ${diasNaRua()} na pista. Daqui a pouco a prefeitura te põe no mapa.`,()=>`Markin, ${diasNaRua()} na rua. Tua cama já tá fazendo boletim de ocorrência.`]},
  {k:'fla',quem:'o flamenguista',titulo:'FLAMENGUISTA',conv:'fla',area:'maraca',ring:[1,1],st:0,sp:16,coee:true,look:{skin:'#b8733f',hair:'#1e140e',shirt:'#c8102e',shorts:'#f4f1e8',stripes:'#1a1a1a'},lines:['Uma vez Flamengo, sempre Flamengo!','Eu teria um desgosto profundo se faltasse o Flamengo no mundo.','Estamos em outro patamar!']},
  {k:'fla',quem:'o flamenguista',titulo:'FLAMENGUISTA',conv:'fla',area:'maraca',ring:[1,1],st:2,sp:14,look:{skin:'#e0b08a',hair:'#6b4423',shirt:'#c8102e',shorts:'#1a1a1a',stripes:'#1a1a1a',cap:'#1a1a1a'},lines:['Estamos em outro patamar!','Uma vez Flamengo, sempre Flamengo!','Eu teria um desgosto profundo se faltasse o Flamengo no mundo.']},
  {k:'flu',quem:'o tricolor',titulo:'TRICOLOR',conv:'flu',area:'maraca',ring:[1,1],st:1,rev:true,sp:15,look:{skin:'#d29a6c',hair:'#1e140e',shirt:'#8a1538',shorts:'#f4f1e8',stripes:'#1f6a3a'},lines:['Ganhar Fla x Flu é normal.','Vence o Fluminense!','Saudações tricolores!']},
  {k:'flu',quem:'o tricolor',titulo:'TRICOLOR',conv:'flu',area:'maraca',ring:[1,1],st:3,rev:true,sp:13,look:{skin:'#8a5a3a',hair:'#1e140e',shirt:'#8a1538',shorts:'#1f6a3a',stripes:'#f4f1e8',long:true},lines:['Saudações tricolores!','Ganhar Fla x Flu é normal.','Vence o Fluminense!']},
  {k:'criaSA',quem:'o Cria',titulo:'CRIA DO SANTO AMARO',area:'escada',sp:0,look:{skin:'#8a5a3a',hair:'#1e140e',shirt:'#2f9a55',shorts:'#1d1d22',cap:'#ffe14f'},lines:[]},
  {k:'tartaruga',quem:'a tartaruga',titulo:'TARTARUGA',conv:'tartaruga',area:'beira',sp:3,look:{},lines:[]},
  {k:'aranha',quem:'a aranha',titulo:'ARANHA',conv:'aranha',area:'verde',sp:7,look:{},lines:[]},
  {k:'mendigo',nome:'mendigo',quem:'o mendigo',titulo:'MENDIGO DA LAPA',area:'lapa',rota:[52,4,66,7],sp:14,beggar:true,look:{skin:'#a0704a',hair:'#8a8a8a',shirt:'#7a6a4a',shorts:'#4a4030',beard:'#9a9a9a',shoe:'#3a2a1a'},lines:['Um real, Markinho!'],
   provoca:['Ô MARKINHO! Me vê um trocado!','Markinho, meu patrão! Vem cá rapidinho!','Aceito Pix, Markinho!','Markinho, só um realzinho! Um só!','Psiu, Markinho! Tenho uma proposta de negócio!']}
];
let npcs=[],mateBuy=-999,beg=null,librasPend=false;
const diasNaRua=()=>day<=1?'o dia inteiro':day+' dias';
function npcArea(a){const W2=walkTiles;
  if(a==='praia')return W2.filter(t=>tileAt(t.x,t.y)===SAND&&t.y<=48);
  if(a==='robson')return W2.filter(t=>tileAt(t.x,t.y)===SAND&&t.y<=48&&t.x>=50&&t.x<=62);
  if(a==='escada')return [{x:Math.floor(FAVELA_ENT.x/T),y:Math.floor(FAVELA_ENT.y/T)}];
  if(a==='beira')return W2.filter(t=>tileAt(t.x,t.y)===SAND&&t.y===49&&t.x>=34&&t.x<=48);
  if(a==='verde')return W2.filter(t=>{const k=tileAt(t.x,t.y);return (k===G||k===FLOW)&&t.x>=62;});
  if(a==='maraca')return W2.filter(t=>t.x>=9&&t.x<=28&&t.y>=9&&t.y<=21);
  if(a==='lapa')return W2.filter(t=>t.x>=50&&t.y<=9);
  return W2.filter(t=>t.y<40);}
function npcGoal(n){const pool=n.pool,near=pool.filter(t=>Math.abs(t.x*T-n.x)<140&&Math.abs(t.y*T-n.y)<100);const t=pick(near.length?near:pool);return{x:t.x*T+8,y:t.y*T+10};}
function spawnNpcs(){npcs=[];mateBuy=-999;
  for(const d of NPC_DEFS){const pool=npcArea(d.area);if(!pool.length)continue;let t=pick(pool);
    if(d.hostile)for(let i=0;i<30;i++){t=pick(pool);if(Math.hypot(t.x*T-P.x,t.y*T-P.y)>320)break;}
    const route=d.rota?rectRoute(...d.rota):d.ring?blockRing(...d.ring):d.anel?pick(RINGS):null,st=d.st||0;
    const q=route?route[st]:{x:t.x*T+8,y:t.y*T+10};
    npcs.push({...d,pool,route,ri:route?(st+(d.rev?3:1))%4:0,x:q.x,y:q.y,h:24,dir:'down',anim:0,moving:false,tgt:null,wait:rnd(0,2),lineT:rnd(3,10),cd:0,stun:0,flee:0,webUntil:0});}}
function updNpcs(dt){
  for(const n of npcs){n.cd=Math.max(0,n.cd-dt);n.lineT-=dt;
    if(n.onipresente){n.pulo=(n.pulo??25)-dt;const dd=dist(n,P);
      if(dd>260&&n.pulo<=0&&P.mode==='free'&&state==='play'){n.pulo=rnd(35,50);for(let i=0;i<40;i++){const rg=pick(RINGS),k=ri(0,3),a=rg[k],b=rg[(k+1)%4],u=Math.random(),q={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},d=dist(q,P);if(d>150&&d<230){n.x=q.x;n.y=q.y;n.route=rg;n.ri=(k+1)%4;n.rev=false;n.saw=false;break;}}}
}
    // o primeiro que passar depois das 3 cervejas repara
    if(librasPend&&fx.drunk<=0)librasPend=false;
    if(librasPend&&!n.beggar&&dist(n,P)<64&&P.mode==='free'){librasPend=false;n.lineT=rnd(8,12);bubble(n,'Caralho Markin, já tá falando em libras!',3.4,'',28,true);}
    if(beg&&beg.n===n){n.moving=false;n.dir=P.x<n.x?'left':'right';continue;}
    if(n.stun>0){n.stun-=dt;n.moving=false;continue;}
    let gx,gy,sp=n.sp,naRota=false;
    const naLapa=P.x>=49*T&&P.y<=10*T;
    if(n.flee>0){n.flee-=dt;gx=n.x+(n.x-P.x);gy=n.y+(n.y-P.y);sp=n.feliz?30:64;}
    else if(n.beggar&&n.cd<=0&&tregua<=0&&!incog()&&dist(n,P)<100&&P.mode==='free'&&!grab&&naLapa){gx=P.x;gy=P.y;sp=34;} // vem atrás pedir dinheiro (não sai da Lapa)
    else if(n.route){const tg=n.route[n.ri];if(Math.hypot(tg.x-n.x,tg.y-n.y)<1.5)n.ri=(n.ri+(n.rev?3:1))%4;gx=n.route[n.ri].x;gy=n.route[n.ri].y;naRota=true;}
    else{if(!n.tgt||dist(n,n.tgt)<3){if(n.wait>0){n.wait-=dt;n.moving=false;}else{n.tgt=npcGoal(n);n.wait=rnd(.5,3);}}
      if(n.tgt){gx=n.tgt.x;gy=n.tgt.y;}}
    if(gx!==undefined){const dx=gx-n.x,dy=gy-n.y,d=Math.hypot(dx,dy);
      if(d>1){const moved=moveAxis(n,dx,dy,sp*dt,(x,y)=>!hitsWall(x,y));
        if(!moved)n.tgt=null;n.moving=moved;if(moved){n.anim+=dt;n.stuckT=0;}
        // preso na parede voltando pra rota: quando ninguém tá vendo, reaparece no canto da rota
        else if(naRota){n.stuckT=(n.stuckT||0)+dt;if(n.stuckT>1.2&&(Math.abs(n.x-P.x)>W*.6||Math.abs(n.y-P.y)>H*.6)){n.x=gx;n.y=gy;n.stuckT=0;}}}
      else n.moving=false;}
    // mendigo: chegou perto, pede dinheiro
    if(n.beggar&&!beg&&n.cd<=0&&n.flee<=0&&tregua<=0&&!incog()&&dist(n,P)<14&&P.mode==='free'&&!grab&&!napS&&!chairS&&state==='play')abreConversa(n);
    // ele fica na Lapa chamando o Markinho
    if(n.provoca&&n.lineT<=0&&dist(n,P)<150&&P.mode!=='cut'&&n.flee<=0&&n.cd<=0){n.lineT=rnd(8,12);bubble(n,pick(n.provoca),2.6,'',28);}
  }
}
const BEG_PEDE=['Ô Markinho, meu patrão! Me arruma um trocado pro café? O café é cachaça, mas é café.',
  'Markinho, tô juntando pra comprar um iate. Faltam só 4 milhões. Ajuda com um real?',
  'Aceito Pix, cartão, vale-refeição e figurinha da Copa. Colabora aí, Markinho!',
  'Eu já fui embarcado igual tu, Markinho. Olha onde eu parei. Me dá um trocado que eu te conto o final.',
  'Markinho, é pra uma causa nobre: a minha.',
  'Markinho, me empresta 10 conto? Te devolvo semana que vem... de 2037.'];
const BEG_OBRIGADO=['Deus te pague em dobro, Markinho! De preferência no Pix!','Valeu, patrão! Vou investir tudo em pão... e numa cachacinha pro pão descer.','Tu é dos bons, Markinho! Vou rezar pra tua mãe não te achar.','Obrigado, Markinho! Quando eu ficar rico tu vai ser meu sócio.'];
const BEG_DAR=['Toma aí, parceiro. Vai com Deus.','Pega aí, meu chefe. Não gasta tudo em cachaça, hein.','Toma um trocado aí, irmão.'];
const BEG_FACADA=['MÃO DE VACA! Toma essa!','Piranha não, mas pão-duro é! TOMA!','Tu vai me negar um real, Markinho?! TOMA!'];
/* ---------- CONVERSAS: chegou perto, aperta espaço, a pessoa fala e o Markin escolhe uma de duas respostas ---------- */
// cada conversa: f = o que a pessoa fala; a = as 2 respostas do Markin [o que ele diz, o que a pessoa responde, efeito]
const bala=()=>{gain(3);sfx.gulp();};
const CONVERSAS={
  mina1:[
    {f:'Oi, Markin! Tá sumido, hein?',a:[['Tava embarcado, gata. 15 dias no mar.','Hmm, marinheiro... gostei.'],['Sumido nada, tô é fugindo da minha mãe.','Hahaha, tu não presta!']]},
    {f:'Bora pro mar?',a:[['Bora! Se eu dormir na água tu me salva.','Salvo nada, te deixo boiando!'],['Mar eu já vi 15 dias seguidos, obrigado.','Chato!']]},
    {casa:1,f:'Tu não dorme não, garoto?',a:[['Dormir é coisa de quem tem casa.','Que papo triste, Markin...'],['Durmo quando morrer.','Desse jeito vai ser hoje!']]},
    {f:'Você vem sempre aqui, gatinho?',a:[['Só quando a minha mãe não tá olhando.','Então tu vem sempre, né?'],['Venho. E tu, vem sempre aqui?','Essa cantada é de 1998, Markin.']]}],
  mina2:[
    {casa:1,f:'Markin! Tu tá com uma cara...',a:[['Cara de quem tá dias acordado?','Cara de quem tá devendo pra mãe!'],['Cara de galã, né?','De galã de novela das seis, só se for.']]},
    {f:'Vai no bloco hoje?',a:[['Vou! Se eu achar o Bloco Secreto.','Dizem que ele aparece onde menos se espera...'],['Bloco? Eu SOU o bloco.','Ai, que convencido.']]},
    {f:'Passa protetor, hein!',a:[['Passa em mim?','Vou te cancelar, garoto!'],['Protetor é pra fraco.','Vai virar camarão, Markin.']]}],
  bala:[
    {f:'CRL, MONSTRO SAGRADO! Leva uma bala aí!',a:[['Me vê uma jujuba aí, monstro.','Tá na mão! Monstro sagrado!',bala],['Tô liso, moleque.','Liso com esse dente aí? Para, tio!']]},
    {f:'Olha ele! Quebrador de cama box!',a:[['Cama? Faz dias que eu não vejo uma.','Papo reto, tu tá com cara de zumbi, tio!'],['Me vê um Halls que eu tô precisando.','Toma, monstro! Hálito de campeão!',bala]]},
    {f:'Esse dente aí tá avaliado em 2 apartamentos na Barra da Tijuca!',a:[['Parcelei em 48 vezes, moleque.','Tá pagando até hoje, né, tio?'],['Me vê uma bala baiana pra comemorar.','Bala baiana pro Brady Pitt!',bala]]},
    {f:'Tio, tu é o Cauã Raymound? Papo reto!',a:[['Sou. Mas não conta pra ninguém.','Eu sabia! Leva uma bala de presente!',bala],['Sou o Markin, moleque.','Markin? Nunca ouvi falar. Mas leva uma bala aí.']]}],
  ze:[
    {f:'Ô Markin! Desembarcou, é? Como tava o mar?',a:[['Mar tava brabo, Seu Zé.','Mar brabo faz marinheiro forte!'],['Nem me fala, quero é terra firme.','Então aproveita a terra, garoto!']]},
    {casa:1,f:()=>`Ô Markin! ${diasNaRua()} te vendo na rua! Tu mora no meio-fio agora?`,a:[['A rua é a minha casa agora, Seu Zé.','Então paga o aluguel da calçada!'],['E o senhor, que tá em todo lugar?','Eu sou o bairro, Markin. O bairro sou eu.']]},
    {casa:1,f:()=>`${diasNaRua()} na rua, Markin... os pombos já te chamam de vizinho.`,a:[['Os pombos são gente boa.','Gente boa é tua mãe, que tá te procurando!'],['Pombo é parceiro, Seu Zé.','Parceiro de quem dorme no banco, né?']]},
    {casa:1,f:()=>`Markin, ${diasNaRua()} na rua. Tua cama já tá fazendo boletim de ocorrência.`,a:[['Ela vai superar.','Superar? Ela tá de luto, Markin!'],['Diz pra ela que eu tô bem.','Tu tá com uma cara de quem não tá nada bem.']]}],
  fla:[
    {f:'Ô Markin! Hoje tem Mengo!',a:[['Coee Brother! Uma vez Flamengo...','...sempre Flamengo! Coee!'],['Sou Vasco, irmão.','VASCO?! Sai de perto de mim!']]},
    {f:'Estamos em outro patamar!',a:[['Coee Brother! Outro patamar mesmo!','Isso aí, Markin! Mengão!'],['Patamar do rebaixamento?','Respeita o maior do Brasil, rapaz!']]},
    {f:'Eu teria um desgosto profundo se faltasse o Flamengo no mundo.',a:[['Coee Brother! Eu também!','Coee! Mengão até morrer!'],['E se faltasse cama no mundo?','Aí tu nem ia sentir falta, né, Markin?']]}],
  tartaruga:[
    {f:'Ei Markin, kd meu canudo?',a:[['Vou arranjar um pra tu.','Salvou, Markola!'],['Usei no meu mate, foi mal.','MARKIN!!! Vou contar pro Lucas!']]}],
  aranha:[
    {f:'Psssiu... humano... tá pisando na minha teia.',a:[['Foi mal, dona aranha. Já tô saindo.','Educado... gostei. Pode passar.'],['Sai daqui, bicho nojento!','Nojento é tu! *NHAC*',()=>picadaAranha()]]},
    {f:'Tu tem cara de quem não dorme há dias...',a:[['É, tô na luta. E tu?','Aranha nunca dorme. Boa sorte, Markin.'],['Cuida da tua vida, oito-pernas.','Oito pernas e um dente afiado! *NHAC*',()=>picadaAranha()]]},
    {f:'Já viu um Homem-Aranha na Lapa? Eu já fiz um.',a:[['Sério? Que maneiro!','Seriíssimo. Mas só pico quem merece.'],['Para de mentir, bicho feio.','Mentira? Então sente! *NHAC*',()=>picadaAranha()]]}],
  flu:[
    {f:'Saudações tricolores!',a:[['Saudações! Vence o Fluminense!','Isso aí, tricolor de coração!'],['Sou Flamengo, mermão.','Ganhar Fla x Flu é normal, mermão.']]},
    {f:'Ganhar Fla x Flu é normal.',a:[['Normal mesmo. Saudações!','Gostei de você, Markin!'],['Normal é o Mengão ser campeão.','Vai sonhando, urubu!']]}]
};
function convRobson(r){ // só 2 mates a cada 12h de jogo
  r.mateLog=(r.mateLog||[]).filter(t=>totalMin-t<720);
  if(r.mateLog.length>=2){const m=Math.ceil(720-(totalMin-r.mateLog[0]));
    return{f:`Já tomou 2, Marcola! Volta daqui a ${Math.floor(m/60)}h que eu guardo um bem gelado.`,a:[['Fechou, Robson. Tamo junto!','Tamo junto, Marcola!'],['Pô, só mais unzinho...','Nem vem, Marcola! Mate demais dá piriri.']]};}
  return{f:'Fala Jogador caro, vai um mate com maracujá?',a:[['Quer me fazer dormir??','Dormir com mate? Tu é doido, Markin!'],['Manda aí, Robgol!','Toma aí, Markin! Mate gelado!',()=>{r.mateLog.push(totalMin);gain(10);sfx.gulp();}]]};}
function convDe(n){
  if(n.beggar)return{f:pick(BEG_PEDE),a:[[pick(BEG_DAR),pick(BEG_OBRIGADO),'dar'],['Eu sou alguma piranha, por acaso?',pick(BEG_FACADA),'nega']]};
  if(n.vende)return convRobson(n);
  if(n.k==='criaSA')return convCria();
  const lista=CONVERSAS[n.conv].filter(c=>!c.casa||day>=3); // papo de dormir ou voltar pra casa só a partir do dia 3
  const c=pick(lista.length?lista:CONVERSAS[n.conv]);return{f:typeof c.f==='function'?c.f():c.f,a:c.a};}
// o Cria fica na escadaria do Santo Amaro: sem sax não deixa entrar; com sax manda resgatar o Tavin nos becos
function convCria(){
  if(!temSax())return{f:'Na favela só entra os cria.',a:[['Tranquilo, depois eu volto.','Volta com alguma coisa que preste, Markin.'],['Pô, eu sou cria também!','Cria? Cadê teu fuzil?']]};
  if(sabeMusica)return{f:'Coe, Markin! O Tavin tá bem graças a tu. Tamo junto!',a:[['Tamo junto, Cria!','Qualquer coisa, a favela é tua.'],['Toca aquela do Tavin aí?','Toca tu, que agora tu sabe!']]};
  return{f:'Coeeee bracock, que Rifle PICA, entra aí e resgata o Tavin lá... esse mlk tá a dias aí...',
    a:[['Deixa comigo, vou achar o Tavin!',null,()=>startLabirinto()],['Agora não, depois eu volto.','Não demora não, o Tavin tá sofrendo lá dentro.']]};}
// a aranha da parte verde: se o Markin for grosso, ela pica e ele vira Homem-Aranha
// a picada dói na hora; quando a conversa fecha, começa a transformação no centro da tela
let aranhaPend=false,virar=null;
function picadaAranha(){lose(5);sfx.hit();shake=.4;aranhaPend=true;}
function comecaVirar(){virar={t:0};state='virando';interruptRest();setPrompt(null);clearBubbles();P.moving=false;
  $('hud').hidden=true;$('toast').hidden=true;$('banner').hidden=true;$('phone').hidden=true;call=null;}
const VR={ESC:.6,VIRA:2.8,SAI:3.8}; // escurece, vira Homem-Aranha, e a partir daí espaço sai
// som de "pegou a estrela": arpejo rápido e brilhante
function somEstrela(d0,v=.035){[523,659,784,1046,784,659,880,1046,1318,1046,880,1175].forEach((f,i)=>beep(f,.09,'square',v,0,d0+i*.085));}
function updVirando(dt){const v=virar,t0=v.t;v.t+=dt;const act=takeAction();
  if(t0<VR.ESC&&v.t>=VR.ESC){sfx.trip();somEstrela(0);}
  if(v.t>VR.ESC&&v.t<VR.VIRA&&Math.floor(t0/1.05)!==Math.floor(v.t/1.05))somEstrela(0,.03+v.t*.004);
  if(t0<VR.VIRA&&v.t>=VR.VIRA){flash=.8;shake=.6;sfx.rip();[784,988,1175,1568,1175,1568,2093].forEach((f,i)=>beep(f,.16,'square',.05,0,i*.11));v.loop=VR.VIRA+1.2;}
  if(v.t>=VR.VIRA&&v.t>=v.loop){v.loop+=1.6;somEstrela(0,.02);}
  if(v.t>=VR.SAI&&act){virar=null;state='play';P.mode='free';$('hud').hidden=false;fx.spider=16;fx.trip=0;
    toast(`HOMEM-ARANHA! Escala prédios, bares e o Circo, ninguém te reconhece e ${KL} solta teia na mãe.`,'good',3.6);}}
let cap=null;
function abreCapitulo(d){cap={t:0,dia:d};state='capitulo';interruptRest();setPrompt(null);clearBubbles();P.moving=false;$('toast').hidden=true;$('banner').hidden=true;somCapitulo(d);}
// som do capítulo: coração batendo e um zumbido grave; quanto mais dias, mais batidas, mais rápido e mais notas tensas
function somCapitulo(d){const n=2+Math.floor(d/3),gap=Math.max(.3,.62-d*.022),f0=55+d*2;
  for(let i=0;i<n;i++){beep(f0,.18,'sine',.18,30,.35+i*gap);beep(f0-6,.14,'sine',.13,25,.35+i*gap+.15);}
  beep(70+d*4,2.4,'sawtooth',.018+d*.0018,62+d*4,.1);
  if(d>=6)beep(104+d*6,1.8,'square',.012,98+d*6,.6);if(d>=11)beep(147+d*8,1.4,'square',.012,0,1.1);}
const CAP={FECHA:.5,TEXTO:3,ABRE:4};
function updCapitulo(dt){cap.t+=dt;if(cap.t>=CAP.ABRE){cap=null;state='play';P.mode='free';$('hud').hidden=false;}}
// a "íris" que fecha em volta do Markin (r = raio do buraco em px da tela)
function iris(r,px,py){dc.globalCompositeOperation='source-over';dc.clearRect(0,0,W,H);dc.fillStyle='#000';dc.fillRect(0,0,W,H);
  if(r>0){dc.globalCompositeOperation='destination-out';const gr=dc.createRadialGradient(px,py,Math.max(0,r*.75),px,py,r);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');
    dc.fillStyle=gr;dc.beginPath();dc.arc(px,py,r,0,Math.PI*2);dc.fill();dc.globalCompositeOperation='source-over';}
  ctx.drawImage(dk,0,0);}
function renderCapitulo(cx,cy){const t=cap.t,px=P.x-cx,py=P.y-14-cy;
  if(t<CAP.FECHA)iris(70*(1-t/CAP.FECHA),px,py);
  else if(t<CAP.TEXTO){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);const a=Math.min(1,(t-CAP.FECHA)/.4,(CAP.TEXTO-t)/.3);ctx.globalAlpha=Math.max(0,a);
    outlineText(ctx,'DIA '+cap.dia,W/2,H/2-4,18,'#ffe14f');if(L.days[cap.dia])outlineText(ctx,L.days[cap.dia],W/2,H/2+16,8,'#f3ecd8');ctx.globalAlpha=1;$('hud').hidden=true;}
  else iris(400*Math.pow((t-CAP.TEXTO)/(CAP.ABRE-CAP.TEXTO),1.6),px,py);
  if(t>=CAP.FECHA&&t<CAP.TEXTO)headCv.hidden=true;} // a cabeça só some na tela preta
function renderVirando(){const g=ctx,t=virar.t,cx=W/2,cy=H/2;headCv.hidden=true;
  g.fillStyle=`rgba(8,6,20,${.88*Math.min(1,t/VR.ESC)})`;g.fillRect(0,0,W,H);
  const virou=t>=VR.VIRA,pw=Math.max(0,Math.min(1,(t-VR.ESC)/(VR.VIRA-VR.ESC)));
  // raios vermelhos e azuis girando (mais rápido conforme o poder cresce)
  if(t>VR.ESC*.7){const al=Math.min(1,(t-VR.ESC*.7)/.6),rot=t*(virou?.7:1+pw*2.4);
    for(let i=0;i<16;i++){const ang=rot+i/16*Math.PI*2;g.fillStyle=i%2?`rgba(208,32,42,${.32*al})`:`rgba(31,79,181,${.32*al})`;
      g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(ang)*260,cy+Math.sin(ang)*260);g.lineTo(cx+Math.cos(ang+.2)*260,cy+Math.sin(ang+.2)*260);g.closePath();g.fill();}}
  // a teia crescendo do centro
  if(t>VR.ESC+.2){const p=Math.min(1,(t-VR.ESC-.2)/1.6),N=12,R0=150*p;g.strokeStyle='rgba(240,240,255,.45)';g.lineWidth=1;
    for(let i=0;i<N;i++){const ang=i/N*Math.PI*2;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(ang)*R0,cy+Math.sin(ang)*R0);g.stroke();}
    for(let r=18;r<R0;r+=17){g.beginPath();for(let i=0;i<=N;i++){const ang=i/N*Math.PI*2,rr=r-(i%2)*2,x=cx+Math.cos(ang)*rr,y=cy+Math.sin(ang)*rr;if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.stroke();}}
  // o Markin no centro: treme ganhando poder e depois aparece de Homem-Aranha
  const tremor=t>VR.ESC&&!virou?(Math.random()-.5)*4*pw:0,esc=virou?1+Math.max(0,.3-(t-VR.VIRA)*.5):1;
  const bw=56*esc,bh=40*esc,bx=cx-bw/2+tremor,by=cy+10;
  if(t>VR.ESC&&!virou){g.strokeStyle=`rgba(255,70,70,${.4+.4*Math.sin(t*30)})`;g.lineWidth=2+pw*3;g.beginPath();g.ellipse(cx+tremor,cy,42+pw*12+Math.sin(t*22)*3,60+pw*10,0,0,Math.PI*2);g.stroke();}
  if(virou){R(g,bx,by,bw,bh,'#d0202a');R(g,bx,by,bw*.18,bh,'#1f4fb5');R(g,bx+bw*.82,by,bw*.18,bh,'#1f4fb5');
    g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1;for(let i=1;i<4;i++){g.beginPath();g.moveTo(bx+bw*.18,by+bh*i/4);g.lineTo(bx+bw*.82,by+bh*i/4);g.stroke();}
    const ax=cx,ay=by+bh*.4;R(g,ax-2,ay-4,4,8,'#1a1a1a');for(const d of [-1,1]){R(g,ax+d*2,ay-3,d*6,1,'#1a1a1a');R(g,ax+d*2,ay,d*7,1,'#1a1a1a');R(g,ax+d*2,ay+3,d*6,1,'#1a1a1a');}} // a aranha no peito
  else drawMkTorso(g,bx,by,bw,bh);
  const st=faceState();st.spider=virou;st.mood=virou?'hype':null;buildFace(st,{});g.imageSmoothingEnabled=false;
  const fw=50*esc,fh=62*esc;g.drawImage(fbuf,cx-fw/2+tremor,by-fh+8,fw,fh);
  if(virou){const p=Math.min(1,(t-VR.VIRA)/.4);outlineText(g,'HOMEM-ARANHA!',cx,22,Math.round(8+10*p),'#ff3b3b');
    if(t>VR.VIRA+.5)outlineText(g,'COM GRANDES PODERES VEM GRANDES ROLÊS!',cx,H-14,7,'#f3ecd8');
    if(t>=VR.SAI&&Math.floor(t*2)%2)outlineText(g,isTouch?'toque ▸':'ESPAÇO ▸',W-10,H-4,6,'#ffe14f','right');}
  else if(t>VR.ESC)outlineText(g,'A PICADA TÁ FAZENDO EFEITO...',cx,22,8,'#c9a0ff');}
// a conversa toda acontece na caixa: a pessoa fala, o Markin escolhe, o Markin diz e a pessoa responde (espaço passa)
function caixa(nome,texto,opcoes){$('bgnome').textContent=nome;$('bgtext').textContent=texto;$('beg').classList.toggle('falando',!opcoes);}
function marcaSel(){$('bgSim').classList.toggle('sel',beg.sel===0);$('bgNao').classList.toggle('sel',beg.sel===1);}
const CONV_GAP=720; // 12h de jogo pra conversar de novo com a mesma pessoa
function abreConversa(n){if(n.k!=='criaSA')n.falouEm=totalMin;const c=convDe(n);beg={n,t:0,c,fase:'pergunta',sel:0};marcaSel();P.mode='beg';setPrompt(null);if(n.beggar)sfx.alert();
  abreEspaco('beg');caixa(n.titulo,c.f,true);$('bgOp1').textContent=c.a[0][0];$('bgOp2').textContent=c.a[1][0];$('beg').hidden=false;}
function closeBeg(){if(!beg)return;beg=null;$('beg').hidden=true;if(P.mode==='beg')P.mode='free';
  if(aranhaPend&&state==='play'){aranhaPend=false;comecaVirar();}}
function updBeg(dt,act){beg.t+=dt;P.moving=false;if(act&&beg.t>.35){if(beg.fase==='pergunta')escolheResposta(beg.sel);else avancaConversa();}}
function escolheResposta(i){if(!beg||beg.fase!=='pergunta'||beg.t<.35||state!=='play')return;
  beg.esc=beg.c.a[i];beg.fase='markin';beg.t=0;avancaConversa();} // escolheu: já vem direto a resposta da pessoa
function avancaConversa(){const {n,esc}=beg,[,resp,ef]=esc;
  if(beg.fase==='markin'&&resp){beg.fase='resposta';beg.t=0;caixa(n.titulo,resp);
    if(ef==='nega'){apanhou();interruptRest();lose(14);sfx.hit();shake=.5;flash=.4;particles.push({x:P.x,y:P.y-30,vx:0,vy:-20,g:0,life:1.2,text:'FACADA!',col:'#ff4f4f'});}
    else if(ef==='dar')sfx.pick();
    else if(ef)ef();
    return;}
  closeBeg();
  if(typeof ef==='function'){if(!resp)ef();return;} // efeito sem resposta (ex.: entrar nos becos) roda ao fechar; com resposta já rodou
  if(ef==='dar'){n.cd=70;n.flee=4;n.feliz=true;}
  else if(ef==='nega'){n.cd=35;n.flee=3.5;n.feliz=false;}}
function drawBikini(c,x,y,b,o){ // menina de biquíni (pele à mostra, top e calcinha)
  x=Math.round(x);y=Math.round(y);const f=o.frame||0,dir=o.dir||'down',sk=b.skin,bk=b.bikini;
  R(c,x-5,y-1,10,2,'rgba(0,0,0,.28)');const l1=f===1?1:0,l2=f===3?1:0;
  R(c,x-3,y-7,2,6-l1,sk);R(c,x+1,y-7,2,6-l2,sk);R(c,x-3,y-1-l1,2,1,'#c9a060');R(c,x+1,y-1-l2,2,1,'#c9a060'); // pernas e chinelo
  R(c,x-3,y-14,6,7,sk);R(c,x-3,y-9,6,2,bk); // barriga e calcinha
  if(dir!=='up'){R(c,x-3,y-13,2,2,bk);R(c,x+1,y-13,2,2,bk);R(c,x-1,y-13,2,1,bk);}else R(c,x-3,y-13,6,1,bk); // top
  R(c,x-5,y-14,2,5,sk);R(c,x+3,y-14,2,5,sk); // braços
  R(c,x-4,y-21,8,7,sk);R(c,x-4,y-22,8,2,b.hair);R(c,x-3,y-23,6,1,b.hair);R(c,x-5,y-21,2,9,b.hair);R(c,x+3,y-21,2,9,b.hair);
  if(dir==='up')R(c,x-4,y-21,8,7,b.hair);
  else{R(c,x-2,y-18,1,1,'#1a1a1a');R(c,x+1,y-18,1,1,'#1a1a1a');R(c,x-1,y-16,2,1,'#b8404a');if(b.shades){R(c,x-3,y-18,6,1,'#111');R(c,x-3,y-18,2,2,'#111');R(c,x+1,y-18,2,2,'#111');}}}
function drawAranha(c,x,y,t){x=Math.round(x);y=Math.round(y);R(c,x-6,y-1,12,2,'rgba(0,0,0,.25)');const p=Math.floor(t*6)%2;
  for(let i=0;i<4;i++){const ly=y-7+i*2,a=(i+p)%2,b=(i+p+1)%2;R(c,x-9,ly+a,5,1,'#1a1a1a');R(c,x+4,ly+b,5,1,'#1a1a1a');R(c,x-10,ly+1+a,1,2,'#1a1a1a');R(c,x+9,ly+1+b,1,2,'#1a1a1a');}
  R(c,x-4,y-9,8,7,'#1a1a1a');R(c,x-3,y-12,6,4,'#2a2a2a');R(c,x-2,y-8,4,4,'#d0202a');R(c,x-2,y-11,1,1,'#ff4f4f');R(c,x+1,y-11,1,1,'#ff4f4f');}
function drawFuzil(c,x,y){x=Math.round(x);y=Math.round(y); // o fuzil atravessado na frente do Cria
  R(c,x-9,y-13,15,2,'#2a2a2e');R(c,x-11,y-13,2,1,'#2a2a2e');R(c,x+5,y-14,5,4,'#5a3a22');R(c,x-2,y-11,2,4,'#1a1a1e');R(c,x-6,y-15,3,2,'#3a3a40');}
function drawNpc(c,n,x,y){if(n.k==='criaSA'){drawBuddy(c,x,y,n.look,{dir:n.dir,frame:0,t:time});drawFuzil(c,x,y);return;}if(n.k==='aranha'){drawAranha(c,x,y,time);return;}if(n.k==='tartaruga'){c.save();c.translate(Math.round(x),Math.round(y+6));c.scale(.55,.55);drawTartaruga(c,0,0,time,n.dir==='left'?-1:1);c.restore();return;} /* menor que a do surf */const fr=n.moving?Math.floor(n.anim*8)%4:0;if(n.look.bikini){drawBikini(c,x,y,n.look,{dir:n.dir,frame:fr});return;}
  if(n.kid){ // menino da bala: menor, com a caixinha de balas na frente
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(.78,.78);drawBuddy(c,0,0,n.look,{dir:n.dir,frame:fr,t:time});c.restore();
    const bx=Math.round(x),by=Math.round(y);R(c,bx-5,by-10,10,4,'#c89a5a');R(c,bx-5,by-10,10,1,'#8a5a2e');R(c,bx-4,by-9,2,1,'#ff4fa0');R(c,bx-1,by-9,2,1,'#4fffd2');R(c,bx+2,by-9,2,1,'#ffe14f');return;}drawBuddy(c,x,y,n.look,{dir:n.dir,frame:fr,t:time});
  if(n.look.stripes&&n.dir!=='up'){R(c,Math.round(x)-2,Math.round(y)-13,1,6,n.look.stripes);R(c,Math.round(x)+1,Math.round(y)-13,1,6,n.look.stripes);}
  if(n.vende){R(c,Math.round(x)-9,Math.round(y)-12,5,7,'#c9c9c9');R(c,Math.round(x)-9,Math.round(y)-12,5,2,'#f2a02a');}}
function drawWebWrap(c,x,y,h){x=Math.round(x);y=Math.round(y);c.strokeStyle='rgba(245,245,245,.85)';c.lineWidth=1;
  for(let i=0;i<4;i++){const yy=y-4-i*(h/5);c.beginPath();c.moveTo(x-7,yy);c.lineTo(x+7,yy-3);c.stroke();}
  c.beginPath();c.moveTo(x-7,y-2);c.lineTo(x+6,y-h+2);c.moveTo(x+7,y-2);c.lineTo(x-6,y-h+2);c.stroke();}
function galeraMG(g,kind,t){
  let list=buddies.filter(b=>!b.crowd);const dono={bar:'bar',sinuca:'sinuca',maraca:'maraca'}[kind];
  if(dono&&!list.some(b=>b.k===dono))list=[{...BUDDY_DEFS[dono],k:dono},...list]; // o dono do lugar sempre tá lá
  const spots={bar:[],sinuca:[[104,31,1.1],[126,31,1.1],[196,31,1.1],[218,31,1.1]],maraca:[[7,178,1],[16,178,1],[3,170,1]]}[kind];
  list=list.slice(0,spots.length);if(!list.length)return;
  list.forEach((b,i)=>{const [x,y,s]=spots[i];g.save();g.translate(x,y);g.scale(s,s);drawBuddy(g,0,0,{...b,hair:b.k==='festa'?gatHair:b.hair},{dir:'down',frame:Math.floor(t*6+i)%4,t});g.restore();});
  const FALAS={bar:['Vira! Vira! Vira!','Mais uma, garçom!','Segura essa cabeça, Markin!','Tá bebendo ou tá dormindo?'],
    sinuca:['Tá vendo 3 vermelhas onde tem uma?','Mira na bola, não no teto!','O Tubarão tá de sacanagem hoje!','Bambina é paciência, Markin!'],
    maraca:['Vai, Markin! Agora!','A gente distrai o segurança!','Pula esse alambrado!','Invade logo, parça!']}[kind];
  const k=Math.floor(t/3.2),i=k%list.length,[x,y,s]=spots[i];
  // a galera só fala quando não tem outra frase na tela
  const ocupado=!mg||mg.msgT>0||mg.t<6||mg.phase==='pick'||(mg.me&&mg.me.x>=100);
  if(!ocupado&&t%3.2<2.4)outlineText(g,FALAS[k%FALAS.length],clamp(x,56,W-56),y-24*s-8,7,'#fff1c2');
}
function mgInput(){ // teclado + analógico
  let ix=0;if(keys.has('ArrowLeft')||keys.has('KeyA'))ix-=1;if(keys.has('ArrowRight')||keys.has('KeyD'))ix+=1;
  if(Math.abs(joy.x)>.25)ix=clamp(ix+joy.x,-1,1);
  if(touchIx)ix=clamp(ix+touchIx,-1,1);
  if(joy.y<-.6&&!joyUp){jumpQ=true;joyUp=true;}else if(joy.y>-.3)joyUp=false;
  const js=joy.x<-.6?-1:joy.x>.6?1:0;if(js&&js!==joySide)laneQ=js;joySide=js;
  const j=jumpQ,a=actionQ,l=laneQ;jumpQ=false;actionQ=false;laneQ=0;return{ix,jump:j,act:a,lane:l};
}
// texto em camada de alta resolução por cima do jogo (nítido em qualquer tamanho de tela)
const tcv=$('txt'),tx=tcv.getContext('2d');
function outlineText(g,txt,x,y,size,col,align='center',stroke='#0a0612'){
  if(g!==ctx){g.font=`700 ${size}px 'Pixelify Sans',monospace`;g.textAlign=align;g.lineWidth=3;g.strokeStyle=stroke||'#0a0612';g.strokeText(txt,x,y);g.fillStyle=col;g.fillText(txt,x,y);return;}
  const S=tcv.width/W,t=ctx.getTransform(),px=(t.a*x+t.e)*S,py=(t.d*y+t.f)*S,fs=Math.max(size,stroke?8:0)*1.3*S*Math.abs(t.a||1);
  tx.save();tx.globalAlpha=ctx.globalAlpha;tx.font=`${fs}px 'VT323',ui-monospace,monospace`;tx.textAlign=align;tx.lineJoin='round';
  if(stroke){tx.lineWidth=Math.max(3,fs*.22);tx.strokeStyle=stroke;tx.strokeText(txt,px,py);}
  tx.fillStyle=col;tx.fillText(txt,px,py);tx.restore();
}
function quad(g,p,col){g.fillStyle=col;g.beginPath();g.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length;i++)g.lineTo(p[i].x,p[i].y);g.closePath();g.fill();}



/* ---------- ESTANDARTE DE CARNAVAL (igual os de bloco): mastro, travessa dourada, tecido branco com barra vermelha, franja, letras coloridas e emblema ---------- */
function pxTextS(g,str,x,y,s,cols){for(let i=0;i<str.length;i++){const gl=GL[str[i]];if(!gl)continue;g.fillStyle=Array.isArray(cols)?cols[i%cols.length]:cols;
  for(let r=0;r<5;r++)for(let k=0;k<3;k++)if(gl[r][k]==='1')g.fillRect(Math.round(x+(i*4+k)*s),Math.round(y+r*s),Math.ceil(s),Math.ceil(s));}}
const EST_CORES=['#d8332f','#2d6fd1','#f2842a','#2d6fd1','#d8332f','#2f9a55','#9b3fd8'];
function drawEstandarte(g,x,y,s,o={}){
  const t=o.t||0,topo=o.topo||'BLOCO',base=o.base||'SECRETO',w=o.w||Math.max(32,Math.max(topo.length,base.length)*4+6),hw=w/2;
  const Rs=(a,b,ww,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(x+a*s),Math.round(y+b*s),Math.max(1,Math.round(ww*s)),Math.max(1,Math.round(hh*s)));};
  const bal=Math.round(Math.sin(t*2.2)*.8*s)/s; // o tecido balança de leve
  Rs(-.6,-52,1.2,52,'#8a6a3a'); // mastro
  Rs(-hw-3,-51,w+6,1.5,'#c9a040');Rs(-hw-4.5,-52.5,2,4,'#e3b341');Rs(hw+2.5,-52.5,2,4,'#e3b341');Rs(-1.5,-55.5,3,3.5,'#e3b341'); // travessa e ponteiras
  const L=-hw+bal,top=-49.5,alt=27;
  Rs(L,top,w,alt,'#c2201c');Rs(L+1.5,top,w-3,alt-1.5,'#f7f3ea');
  for(let k=0;k<9;k++){const ww=w-k*(w/9);Rs(L+k*w/18,top+alt+k,ww,1,'#c2201c');if(ww-3>0)Rs(L+k*w/18+1.5,top+alt-1+k,ww-3,1,'#f7f3ea');} // ponta do estandarte
  for(let k=0;k<alt;k+=2){Rs(L-1.5,top+k,1.5,1,'#e3b341');Rs(L+w,top+k,1.5,1,'#e3b341');} // franja dourada
  for(let k=0;k<9;k++){Rs(L+k*w/18-1.2,top+alt+k,1.2,1.2,'#e3b341');Rs(L+w-k*w/18,top+alt+k,1.2,1.2,'#e3b341');}
  pxTextS(g,topo,x+(L+hw-topo.length*2+.5)*s,y+(top+2.5)*s,s,EST_CORES);
  pxTextS(g,base,x+(L+hw-base.length*2+.5)*s,y+(top+20.5)*s,s,['#2d6fd1']);
  const ex=L+hw,ey=top+14;
  if(o.face){ // a cara do Markin no meio
    buildFace({e:95,mood:'hype'},{});g.imageSmoothingEnabled=false;g.drawImage(fbuf,Math.round(x+(ex-6)*s),Math.round(y+(ey-7.5)*s),Math.round(12*s),Math.round(15*s));}
  else{ // máscara de carnaval com sombrinhas de frevo
    for(const sd of [-1,1]){const ux=ex+sd*7.5;for(let a=0;a<4;a++)Rs(ux-3+a*1.5,ey-2.5+Math.abs(a-1.5)*.6,1.5,2.5,['#ffe14f','#2f9a55','#2d6fd1','#d8332f'][a]);Rs(ux-.3,ey,1,4,'#6d4322');}
    Rs(ex-5,ey-2,10,4,'#9b3fd8');Rs(ex-5,ey-2,10,1,'#ff4fd8');Rs(ex-4,ey-1,3,2,'#f7f3ea');Rs(ex+1,ey-1,3,2,'#f7f3ea');Rs(ex-3.5,ey-.5,1.5,1,'#1d1d22');Rs(ex+1.5,ey-.5,1.5,1,'#1d1d22');
    Rs(ex-2,ey-6,1.2,4,'#ff4fd8');Rs(ex,ey-7,1.2,5,'#4fffd2');Rs(ex+1.8,ey-6,1.2,4,'#ffe14f');Rs(ex-.5,ey+2,1,4,'#e3b341');}
}
// faixa de bloco: tecido balançando entre dois mastros, franja e estrelinhas
function drawFaixa(g,x0,y,w,h,texto,t,cor,cor2,tinta){
  R(g,x0-3,y-5,2,h+34,'#8a6a3a');R(g,x0+w+1,y-5,2,h+34,'#8a6a3a');R(g,x0-4,y-7,4,3,'#e3b341');R(g,x0+w,y-7,4,3,'#e3b341');
  for(let i=0;i<w;i+=2){const dy=Math.round(Math.sin(t*3+i*.07)*2);R(g,x0+i,y+dy,2,h,cor);R(g,x0+i,y+dy,2,1,'rgba(255,255,255,.4)');R(g,x0+i,y+dy+2,2,1,cor2);R(g,x0+i,y+dy+h-3,2,1,cor2);
    R(g,x0+i,y+dy+h,2,i%4?2:3,i%4?cor2:'#f4f1e8');}
  for(let k=0;k<2;k++){const sx=k?x0+w-10:x0+10,sy=y+h/2+Math.round(Math.sin(t*3+(k?w:0)*.07)*2);outlineText(g,'★',sx,sy+3,8,cor2,'center',null);}
  const tw=texto.length*4*1.5,tx0=x0+w/2-tw/2,ty0=y+h/2-4+Math.round(Math.sin(t*3+w*.035)*2);
  for(const [ox,oy] of [[-1,0],[1,0],[0,-1],[0,1],[1,1]])pxTextS(g,texto,tx0+ox,ty0+oy,1.5,tinta||'#0a1030');pxTextS(g,texto,tx0,ty0,1.5,'#ffffff');
}
/* ---------- MARKIN DE CORPO INTEIRO NOS DESAFIOS: camiseta oversized marrom, cordões, bolsa, jeans largo, tênis branco (com braços) ---------- */
function drawMkCorpo(g,x,y,o={}){
  x=Math.round(x);y=Math.round(y);const f=o.frame||0,face=o.face||1,sk='#d29a6c',hand='#b8804f';
  const tee='#5a3a26',teeD='#43291a',teeL='#6e4a32',leg=o.bermuda?'#2d8fe8':'#9cc0e0',legD=o.bermuda?'#1f6ab8':'#7496bd',tenis='#f4f1e8',sola='#9a9aa0';
  if(o.sombra!==false)R(g,x-7,(o.chao??y)+1,14,3,'rgba(0,0,0,.2)');
  // pernas
  if(o.kick){R(g,x-4,y-9,4,9,leg);R(g,face>0?x:x-12,y-9,12,4,leg);R(g,face>0?x+11:x-15,y-10,4,4,tenis);R(g,x-5,y-2,5,2,tenis);R(g,x-5,y-1,5,1,sola);}
  else if(o.agachado){R(g,x-6,y-6,5,4,leg);R(g,x+1,y-6,5,4,leg);R(g,x-6,y-2,6,2,o.bermuda?sk:tenis);R(g,x+1,y-2,6,2,o.bermuda?sk:tenis);}
  else{const a=o.firme?0:f?2:0,b=o.firme?0:f?0:2,lh=o.bermuda?5:7;
    R(g,x-5,y-9,5,lh-a,leg);R(g,x+1,y-9,5,lh-b,leg);R(g,x-1,y-9,2,3,leg);R(g,x-2,y-8,1,lh-2-a,legD);R(g,x+4,y-8,1,lh-2-b,legD);
    if(o.bermuda){R(g,x-4,y-4-a,3,3,sk);R(g,x+2,y-4-b,3,3,sk);}
    R(g,x-6+(face<0?-1:0),y-2-a,6,2,tenis);R(g,x+1+(face<0?-1:0),y-2-b,6,2,tenis);R(g,x-6+(face<0?-1:0),y-1-a,6,1,sola);R(g,x+1+(face<0?-1:0),y-1-b,6,1,sola);}
  const ty=o.agachado?y-6:y-9;
  // camiseta larga
  R(g,x-7,ty-11,14,12,tee);R(g,x-7,ty,14,1,teeD);R(g,x-7,ty-11,14,1,teeL);R(g,face>0?x-7:x+6,ty-10,1,10,teeD);
  // cordões de ouro e a bolsa atravessada
  R(g,x-3,ty-11,1,2,'#e3b341');R(g,x-2,ty-9,4,1,'#e3b341');R(g,x+2,ty-11,1,2,'#e3b341');R(g,x-4,ty-11,1,4,'#e3b341');R(g,x-3,ty-7,6,1,'#e3b341');R(g,x+3,ty-11,1,4,'#e3b341');
  for(let k=0;k<9;k++)R(g,Math.round(x-6+k*1.3),ty-11+k,1,1,'#2a1d16');R(g,x+3,ty-3,5,4,'#4a3226');R(g,x+3,ty-3,5,1,'#2a1d16');
  // braços (manga, antebraço, mão)
  const sw=o.moving?(f?2:-2):0,arm=o.arms||'down';
  const braco=(bx,dy,pose)=>{if(pose==='up'){R(g,bx,ty-13,3,4,tee);R(g,bx,ty-17,3,4,sk);R(g,bx,ty-19,3,2,hand);}
    else if(pose==='frente'){R(g,bx,ty-11,3,4,tee);R(g,bx+(face>0?2:-5),ty-8,6,3,sk);R(g,bx+(face>0?7:-6),ty-8,2,3,hand);}
    else if(pose==='abre'){R(g,bx,ty-11,3,4,tee);R(g,bx+(bx<x?-4:3),ty-10,5,2,sk);R(g,bx+(bx<x?-6:8),ty-11,2,3,hand);}
    else{R(g,bx,ty-11,3,5,tee);R(g,bx,ty-6+dy,3,5,sk);R(g,bx,ty-1+dy,3,2,hand);}};
  braco(x-10,sw,arm==='rema'?(f?'up':'down'):arm);braco(x+7,-sw,arm==='rema'?(f?'down':'up'):arm==='frente'?'down':arm);
}
// tronco do Markin nas cenas de perto (bar, festa, sax): camiseta oversized marrom, gola, dois cordões de ouro e a alça da bolsa
function drawMkTorso(g,x,y,w,h){
  R(g,x,y,w,h,'#5a3a26');R(g,x,y,w,2,'#6e4a32');R(g,x,y+h-2,w,2,'#43291a');R(g,x+w*.12,y+h*.3,1,h*.7,'#43291a');R(g,x+w*.88,y+h*.3,1,h*.7,'#43291a');
  R(g,x+w*.36,y,w*.28,2,'#43291a');
  const cx=x+w/2;for(let k=0;k<6;k++){R(g,cx-w*.13+k,y+2+k*1.2,1,1,'#e3b341');R(g,cx+w*.13-k,y+2+k*1.2,1,1,'#e3b341');}
  for(let k=0;k<9;k++){R(g,cx-w*.21+k,y+2+k*1.8,1,1,'#f2d060');R(g,cx+w*.21-k,y+2+k*1.8,1,1,'#f2d060');}
  for(let k=0;k<h;k++)R(g,x+w*.08+k*(w*.84/h),y+k,2,1,'#2a1d16');
}
function drawMkCabeca(g,x,y,w){buildFace(faceState(),{});g.imageSmoothingEnabled=false;g.drawImage(fbuf,Math.round(x-w/2),Math.round(y-w*1.23),w,Math.round(w*1.23));}

/* ---------- SURF (estilo Kelly Slater, simplificado): o Lucas fica na água incentivando (e zoando) ---------- */
const SURF={x:30*T+8,y:48*T+8,h:34}; // aula de surf na areia, um pouco depois do navio
let surfDay=0;
const DUDU={nome:'Lucas',skin:'#b8733f',hair:'#f2c230',shirt:null,shorts:'#2d8fe8',prop:'prancha',oi:'Que surf, Markin! Agora é da família do surf. Tô contigo!',
  lines:['Hoje o mar tá clássico!','Rabeou a onda, hein?','Sem onda, sem rolê.','Bora pegar a série das 5?']};
const DUDU_BORA=['Rema, Markin! Rema!','Olha a série chegando!','Essa é tua! Prepara pra dropar!','Vai que é tua, Markin!'];
const DUDU_ZOA=['Tomou uma vaca, hein!','Isso é surf ou natação?','Caiu igual jaca do pé!','Engoliu meio litro de mar!','Tá bebendo a praia, Markin?','Até o boto riu dessa!','Ô, a prancha é pra ficar EM CIMA!'];
const DUDU_MANOBRA=['ISSO!','QUE BATIDA!','Rasgou!','Tá voando, mermão!','Classe A!'];
const DUDU_POCKET=['Volta pro pocket!','Tá longe da onda, volta!','Cola na espuma!'];
/* SURF (visual igual ao surf do Mega Drive): a câmera fica de frente pra parede da onda e o Markin anda pra direita.
   3 ondas. Em cada uma: o Markin já está na parede, deitado remando na diagonal pra baixo, e a barra anda: aperta
   ESPAÇO na hora certa pra dropar. Ele levanta rápido e fica em pé (sempre com os 2 pés na prancha).
   A QUEBRA (a coluna branca de espuma) anda conforme a velocidade dele: → acelera (a quebra vai pra esquerda e some da
   tela), ← freia (a quebra alcança e ele entra no TUBO). Descer a parede (↓) dá velocidade, subir (↑) tira.
   Freou demais e a quebra empurrou ele até o fim da tela = vaca. Só 2 manobras:
   - TUBO: com a quebra logo atrás dele (o lábio passa por cima). Os pontos do tubo sobem com multiplicador (x1, x1.1, ... x5 em 10 s).
   - AÉREO: ESPAÇO só funciona lá em cima da onda. No ar, ← → (ou ↑ ↓) giram a prancha; dá pra fazer 360°,
     mas tem que cair com o bico da prancha apontando pra baixo, senão é vaca.
   Soma 2500 pontos nas 3 ondas pra vencer. */
const SF={TOPO:62,BASE:162,CREST:47,LABIO:49,FUNDO:168,VSAI:70,MX:196,META:2500,VMAX:220,G:400,LEVANTA:.5,CURL:80,TUBO_PTS:1000/29.5,TUBO_PASSO:.25};
// tartarugas: aparecem depois de 5 s em pé, nadando na parede. Bater nelas = vaca (dá pra pular por cima no aéreo)
const TARTA_FALAS=['Kd meu canudo?'];
// frente da quebra na altura y: embaixo fica em cx, e o lábio lá em cima se inclina pra direita (como no jogo)
const surfFrente=(cx,y)=>{const u=clamp((y-SF.CREST)/(H-SF.CREST),0,1);return cx+50*Math.pow(1-u,4);};
function startSurf(){
  mgEnter('surf');
  mg={t:0,phase:'espera',waves:3,onda:0,wave:null,msg:'',msgT:0,result:null,done:0,fala:pick(DUDU_BORA),falaT:2.6,
    me:{x:150},mx:SF.MX,total:0,pts:0,splash:[],pops:[],cai:0,r:null,scroll:0,wipe:0,lev:0,cx:-200};
  surfOnda();
}
function surfOnda(){const m=mg;m.phase='espera';m.wave={x:150+80,sp:rnd(70,85),h:0};m.cai=0;m.onda++;m.pts=0;m.tart=[];m.tartT=0;m.cx=-200;m.mx=SF.MX;m.fala=pick(DUDU_BORA);m.falaT=2.2;}
function surfPts(n,txt){const m=mg;m.pts+=n;m.pops.push({x:m.mx,y:m.r?m.r.y-44:90,t:1.2,txt:`${txt} +${n}`});
  if(n>=200){m.fala=pick(DUDU_MANOBRA);m.falaT=1.6;}beep(760+Math.min(n,600),.08,'square',.05);}
function surfCai(txt){const m=mg;m.phase='caiu';m.tart=[];m.cai=2;m.msg=txt;m.msgT=2;m.fala=pick(DUDU_ZOA);m.falaT=2.4;sfx.hit();shake=.35;
  const kept=Math.round(m.pts*.5);m.total+=kept;m.pops.push({x:m.mx,y:90,t:1.6,txt:`vaca: ficou ${kept}`});m.pts=0;
  for(let i=0;i<26;i++)m.splash.push({x:m.mx+rnd(-12,12),y:m.r?m.r.y:120,vx:rnd(-50,50),vy:rnd(-110,-40),t:rnd(.6,1.1)});
  m.r=null;surfFimOnda();}
function surfFimOnda(){const m=mg;m.total=Math.round(m.total);
  if(m.total>=SF.META&&m.r&&!m.ganhou){m.ganhou=true;m.msg='NOTA 10! Continua surfando! (cai ou ESC pra sair)';m.msgT=3;sfx.win();return;} // bateu a meta em pé: segue na onda
  if(m.total>=SF.META&&m.r)return;
  if(m.total>=SF.META){m.result='win';m.done=2.6;m.msg='NOTA 10! PASSOU DOS '+SF.META+' PONTOS!';m.msgT=2.6;sfx.win();return;}
  if(m.onda>=3){m.result='lose';m.done=2.4;m.msg=`Faltou: ${m.total} de ${SF.META} pontos.`;m.msgT=2.4;}}
function surfInp(){let iy=0;if(keys.has('ArrowUp')||keys.has('KeyW'))iy-=1;if(keys.has('ArrowDown')||keys.has('KeyS'))iy+=1;if(Math.abs(joy.y)>.25)iy=clamp(iy+joy.y,-1,1);
  let ix=0;if(keys.has('ArrowLeft')||keys.has('KeyA'))ix-=1;if(keys.has('ArrowRight')||keys.has('KeyD'))ix+=1;const kx=ix,joyOn=isTouch||Math.hypot(joy.x,joy.y)>.2; // no celular é sempre o analógico (mesmo solto)
  if(Math.abs(joy.x)>.15)ix=clamp(ix+Math.sign(joy.x)*(Math.abs(joy.x)-.15)/.85,-1,1); // analógico: quanto mais empurra, mais acelera/freia
  const a=actionQ;actionQ=false;jumpQ=false;laneQ=0;return{iy,ix,kx,joyOn,act:a,held:keys.has('Space')||aHeld};}
// ângulo da prancha em graus (0 = reta, 90 = bico pra baixo), entre 0 e 360
const surfMult=t=>1+Math.floor(t/SF.TUBO_PASSO+1e-6)*.1; // multiplicador do tubo pelo tempo dentro dele
const surfGraus=a=>((a*180/Math.PI)%360+360)%360;
function updSurf(dt){
  const m=mg;m.t+=dt;m.msgT-=dt;m.falaT-=dt;m.wipe=Math.max(0,m.wipe-dt);const inp=surfInp();
  m.scroll+=(m.r?m.r.v*(m.r.air?m.r.air.hx:Math.cos(m.r.dir||0)):40)*dt; // a parede corre pra esquerda conforme a velocidade
  for(const s of m.splash){s.t-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=260*dt;}m.splash=m.splash.filter(s=>s.t>0);
  for(const q of m.pops){q.t-=dt;q.y-=16*dt;}m.pops=m.pops.filter(q=>q.t>0);
  if(m.result){m.done-=dt;if(m.done<=0){
    if(m.result==='win'){const first=surfDay!==day;surfDay=day;markTask('surf');
      mgExit(first?`Surfou ${m.total} pontos! +3h acordado e +20 de energia. O Lucas entrou pro teu bloco.`:`Mais uma sessão boa (${m.total} pontos)! +3h acordado (+6 de energia).`,'good',first?20:6,180);}
    else mgLost(`Somou ${m.total} de ${SF.META} pontos nas 3 ondas. O Lucas tá rindo até agora.`);}return;}
  if(m.phase==='caiu'){m.cai-=dt;if(m.cai<=0&&!m.result)surfOnda();return;}
  if(m.phase==='espera'){const w=m.wave;w.x-=w.sp*dt;w.h=Math.min(1,w.h+dt*.7);const dx=w.x-m.me.x;
    m.cx=100-dx*.85; // a quebra vem chegando pela esquerda (mesmo ritmo de quando ele tá em pé) e tá quase nele quando a barra chega no verde
    if(inp.act){if(Math.abs(dx)<13){m.phase='levanta';m.lev=0;m.wipe=.4;m.mx=140;
        m.r={y:110,vy:0,v:56,t:0,air:null,ang:.5,dir:.5,face:1,giro:0,tubo:0};beep(700,.1,'square',.05);beep(900,.1,'square',.05,0,.1);surfPts(100,'DROP');}
      else surfCai(dx>0?'Cedo demais! A onda ainda não tava em pé.':'Tarde demais! A onda passou por baixo de você.');}
    else if(dx<-26)surfCai('Perdeu a onda! Ela passou direto.');
    return;}
  const r=m.r;r.t+=dt;
  // ---- ficando em pé: animação rápida, ele ainda não controla ----
  if(m.phase==='levanta'){m.lev+=dt;r.y+=18*dt;m.cx+=(SF.CURL-r.v)*dt;m.mx+=(SF.MX-m.mx)*Math.min(1,dt*6);if(m.lev>=SF.LEVANTA){m.phase='ride';m.msg='';m.msgT=0;}return;}
  // ---- surfando: as setas (ou o analógico) apontam pra onde a prancha vai; dá pra virar 360° na onda ----
  // r.dir = direção da prancha (0 = direita, 90° = baixo). Indo pra esquerda o Markin é desenhado espelhado (nunca de cabeça pra baixo).
  const mag=Math.min(1,Math.hypot(inp.ix,inp.iy)),aponta=mag>.2;
  if(r.air){ // no ar: as setas giram a prancha; tem que pousar com o bico pra baixo
    const a=r.air;a.vz-=SF.G*dt;a.z+=a.vz*dt;
    // no ar: no PC, ← e → giram a prancha; no celular, ela vai virando pra onde o analógico aponta (sem girar de uma vez)
    if(!inp.joyOn&&inp.kx){const passo=inp.kx*r.face*7*dt;r.ang+=passo;a.tot+=passo;}
    else if(a.giro){const passo=Math.sign(a.giro)*Math.min(Math.abs(a.giro),11*dt);a.giro-=passo;r.ang+=passo;a.tot+=passo;} // girando (não para no meio)
    else if(inp.joyOn&&aponta){const th=Math.atan2(inp.iy,inp.ix),alvo=r.face>0?th:Math.PI-th;let dd=alvo-r.ang;dd=Math.atan2(Math.sin(dd),Math.cos(dd));
      // celular: a prancha acompanha o analógico; se ele mudar de repente pra uma direção bem diferente, faz um giro completo no ar
      if(Math.abs(dd)>Math.PI*.75)a.giro=(dd>=0?1:-1)*(Math.PI*2+Math.abs(dd));
      else{const passo=clamp(dd,-12*dt,12*dt);r.ang+=passo;a.tot+=passo;}}
    if(a.z<=0&&surfFrente(m.cx,SF.LABIO+10)>m.mx-12){r.air=null;surfCai('Caiu na espuma! A onda te engoliu.');return;} // pousou da quebra pra esquerda = vaca
    if(a.z<=0){const g=surfGraus(r.ang),bico=g>=8&&g<=115,voltas=Math.floor((Math.abs(a.tot)*180/Math.PI+40)/360);r.air=null;a.z=0;
      if(bico){r.ang=.6;r.dir=r.face>0?.6:Math.PI-.6;r.giro=0;r.y=SF.LABIO+10;r.v=Math.max(r.v,85);surfPts(voltas>0?250+voltas*350:250,voltas?`AÉREO ${voltas*360}°`:'AÉREO');
        for(let i=0;i<12;i++)m.splash.push({x:m.mx+rnd(-8,8),y:r.y+2,vx:rnd(-60,60),vy:rnd(-90,-30),t:rnd(.4,.7)});}
      else{surfCai(g<8||g>300?'Caiu reto demais! Tem que cair com o bico pra baixo.':'Pousou torto! A prancha foi pra um lado, tu pro outro.');return;}}
  }else{
    // PC: ← → giram a prancha na onda (dá pra dar a volta inteira). Celular: a prancha vira pra onde o analógico aponta, pelo caminho mais curto
    if(!inp.joyOn){if(inp.kx){const passo=inp.kx*3.6*dt; // → gira no sentido do relógio, ← no contrário
      r.dir+=passo;r.giro=(r.giro||0)+passo;}}
    else if(aponta){let dd=Math.atan2(inp.iy,inp.ix)-r.dir;dd=Math.atan2(Math.sin(dd),Math.cos(dd));const passo=clamp(dd,-4.6*dt,4.6*dt);r.dir+=passo;r.giro=(r.giro||0)+passo;}
    // volta completa na onda = 360°
    if(Math.abs(r.giro||0)>=Math.PI*2){r.giro-=Math.sign(r.giro)*Math.PI*2;surfPts(250,'360°');}
    const cs=Math.cos(r.dir),sn=Math.sin(r.dir);r.face=cs>=0?1:-1;
    r.ang=Math.atan2(sn,Math.abs(cs)); // ângulo da prancha do jeito que ele tá virado (entre -90° e 90°)
    // velocidade: cada coisa soma um pedaço e só juntando tudo chega no máximo:
    // apontar (até a metade) + segurar ESPAÇO + prancha virada pra cima ou pra baixo (até 90°). Soltando, ele perde velocidade.
    // bombear: cada troca entre subir e descer soma mais velocidade (até +70); andando reto ela vai se perdendo
    const vert=sn<-.3?-1:sn>.3?1:0;if(vert&&r.ultVert&&vert!==r.ultVert)r.bomba=Math.min(70,(r.bomba||0)+14);if(vert)r.ultVert=vert;
    r.bomba=Math.max(0,(r.bomba||0)-(vert?3:9)*dt);
    // PC: ↑ acelera e ↓ freia. Celular: afastar o analógico regula a velocidade (solto = perde velocidade) e segurar o botão acelera
    const acel=inp.joyOn?(aponta?mag:0):(inp.iy<0?1:0),freiaK=!inp.joyOn&&inp.iy>0,solto=inp.joyOn?!aponta:(!acel&&!freiaK&&!inp.kx);
    const alvoV=(acel>0?52+acel*38:22)+(inp.held?40:0)+Math.abs(sn)*40+r.bomba;
    r.v+=(alvoV-r.v)*(alvoV<r.v?(solto?3.9:freiaK?2.6:1.4):1.1)*dt;r.v=clamp(r.v,22,SF.VMAX); // sem mexer no analógico ou nas setas perde velocidade 1,5x mais rápido
    r.vy=sn*clamp(r.v,60,120)*1.5;r.y=clamp(r.y+r.vy*dt,SF.LABIO,SF.FUNDO+2); // sobe e desce na parede mais rápido (1,5x)
    if(r.y>SF.FUNDO){surfCai('Desceu demais e afundou na base da onda!');return;}
    // perdendo velocidade: a rabeta afunda e espirra um jato de água pra trás
    const freia=r.v-alvoV>25;
    if(freia)for(let k=0;k<2;k++)m.splash.push({x:m.mx-18*cs+rnd(-2,2),y:r.y+3-18*sn,vx:-cs*rnd(50,110),vy:rnd(-100,-40),t:rnd(.25,.45)});
    const alvoL=inp.held?.8:freia?-1:acel>.6?acel:0;r.lean=(r.lean||0)+(alvoL-(r.lean||0))*Math.min(1,dt*10); // abaixa acelerando ou freando
    if(inp.held)r.carga=Math.min(1,(r.carga||0)+dt); // segurando ESPAÇO: ganha velocidade e prepara o salto
  }
  // a quebra anda: indo pra direita mais rápido que ela = ela vai embora; devagar ou indo pra esquerda = ela te alcança
  const hv=r.v*(r.air?r.air.hx:Math.cos(r.dir));
  m.cx=clamp(m.cx+(SF.CURL-hv)*dt,-160,W+60);
  // tartarugas (depois de 5 s em pé): vêm da direita junto com a parede
  if(m.phase==='ride'&&r.t>5){m.tartT-=dt;if(m.tartT<=0){m.tartT=rnd(4.4,7.6);m.tart.push({x:W+20,y:rnd(SF.TOPO+12,SF.BASE-4),t:rnd(0,6),fala:null,falaT:0,falou:false});}}
  for(const q of m.tart){q.x-=hv*.9*dt;q.t+=dt;q.falaT-=dt;
    if(!q.falou&&q.x<W-30&&!m.tart.some(o=>o.falaT>0)&&Math.random()<.25){q.fala=pick(TARTA_FALAS);q.falaT=1.8;}if(q.x<W-30)q.falou=true;
    if(!r.air&&Math.abs(q.x-m.mx)<22&&Math.abs(q.y-r.y)<11){surfCai('Bateu numa tartaruga!');q.fala='Achei que nós éramos amigos @#$';q.falaT=2.5;m.tart=[q];return;}}
  m.tart=m.tart.filter(q=>q.x>-30&&q.x<W+60);
  const xb=surfFrente(m.cx,r.y+4); // frente da quebra na altura da prancha
  m.mx+=((xb-32>SF.MX?xb-32:SF.MX)-m.mx)*Math.min(1,dt*5); // depois que ele sumiu na espuma, a quebra empurra ele pra direita
  const noTubo=!r.air&&surfFrente(m.cx,r.y-15)>=m.mx; // metade do corpo já atrás da espuma
  // crista (o meio da linha branca): subindo, ele sai da onda. O salto depende da velocidade, e soltar o ESPAÇO
  // bem no meio da linha branca (depois de segurar) faz voar muito mais. Subindo e apontando pra baixo = BATIDA.
  // Chegar na crista devagar, ou em cima da espuma (da quebra pra esquerda), = vaca.
  if(!r.air&&m.phase==='ride'){
    const subindo=Math.sin(r.dir)<-.3,sf=clamp((r.v-28)/(SF.VMAX-28),0,1),base=20+150*sf,solta=r.segurava&&!inp.held,naEspuma=surfFrente(m.cx,SF.CREST)>m.mx-12;
    const salta=hh=>{r.air={z:0,vz:Math.sqrt(2*SF.G*Math.min(250,hh)),tot:0,hx:Math.cos(r.dir)};r.ang=Math.max(r.ang,-.8);r.carga=0;sfx.pick();m.fala='VOA, MARKIN!';m.falaT=1;};
    if(solta&&subindo&&r.y<=SF.LABIO+12&&!naEspuma&&r.v>=SF.VSAI){const p=1-(r.y-SF.LABIO)/12;salta(base*(1+1.6*p*(r.carga||0)));} // soltou na hora certa
    else if(solta)r.carga=0; // soltou fora da hora: perde a carga
    else if(subindo&&r.y<=SF.LABIO){
      if(naEspuma){surfCai('Subiu na espuma e a onda quebrou em cima!');return;}
      if(inp.joyOn?(aponta&&inp.iy>.3):inp.kx*(r.face||1)>0){ // batida: bate no lábio e volta pra baixo jogando um leque de água
        r.dir=Math.atan2(-Math.sin(r.dir),Math.cos(r.dir));r.y=SF.LABIO+3;
        const perto=m.mx-surfFrente(m.cx,SF.CREST),pts=Math.round(50*clamp(1+(140-perto)/70,1,3)/10)*10;surfPts(pts,'BATIDA');
        for(let i=0;i<22;i++)m.splash.push({x:m.mx-r.face*rnd(6,20),y:r.y,vx:-r.face*rnd(20,120),vy:rnd(-170,-60),t:rnd(.5,.9)});}
      else if(r.v<SF.VSAI){surfCai('Chegou devagar na crista e a onda quebrou em cima!');return;}
      else salta(base);} // saiu da onda (segurando ESPAÇO ou não, pulo normal)
  }
  r.segurava=inp.held;
  // tubo: os pontos vão subindo desde zero, com multiplicador que começa em x1 e sobe 0,1 a cada 0,25 s (x5 em 10 s).
  // Ficando 10 s no tubo, ele soma 1000 pontos.
  if(noTubo){const mult=surfMult(r.tubo),ganho=SF.TUBO_PTS*mult*dt;r.tubo+=dt;r.tuboPts=(r.tuboPts||0)+ganho;m.pts+=ganho;
    if(Math.floor(r.tubo/SF.TUBO_PASSO)!==Math.floor((r.tubo-dt)/SF.TUBO_PASSO))beep(500+Math.min(40,Math.floor(r.tubo/SF.TUBO_PASSO))*25,.05,'square',.04);
    if(r.tubo>.1&&m.falaT<0){m.fala='ENTRA NO TUBO! SEGURA!';m.falaT=1.4;}}
  else{if(r.tuboPts>=1)m.pops.push({x:m.mx,y:r.y-44,t:1.4,txt:`TUBO +${Math.round(r.tuboPts)}`});r.tubo=0;r.tuboPts=0;}
  if(m.mx>W-12){surfCai('O tubo fechou em cima de você!');return;}
  if(m.total+m.pts>=SF.META&&!r.air){m.total+=m.pts;m.pts=0;surfFimOnda();} // a onda não acaba: vai até cair ou bater a meta
}
function drawDudu(g,x,y,t,nadando){ // o Lucas na água, sentado na prancha dele
  R(g,x-14,y,28,3,'#f4f1e8');R(g,x-14,y+1,28,1,'#e84a4a');
  if(nadando){R(g,x-4,y-12,8,10,'#b8733f');R(g,x-6,y-11,2,7,'#b8733f');R(g,x+4,y-11+Math.round(Math.sin(t*6)*2),2,7,'#b8733f');R(g,x-4,y-4,8,4,'#2d8fe8');}
  R(g,x-5,y-21,10,9,'#b8733f');R(g,x-5,y-23,10,4,'#f2c230');R(g,x-3,y-17,2,1,'#111');R(g,x+1,y-17,2,1,'#111');R(g,x-2,y-14,4,1,'#7a2e2a');
}
function drawSurfSpot(g,x,y,t){ // placa AULA DE SURF, a prancha fincada na areia e o Lucas do lado
  x=Math.round(x);y=Math.round(y);
  R(g,x-19,y-1,2,4,'rgba(0,0,0,.25)');R(g,x-20,y-30,2,30,'#6d4322');R(g,x-34,y-40,34,12,'#f4f1e8');R(g,x-34,y-40,34,1,'#2d8fe8');R(g,x-34,y-29,34,1,'#c9c2b2');
  pxText(g,'AULA DE',x-31,y-38,'#1f6ab8');pxText(g,'SURF',x-25,y-33,'#e84a4a');
  R(g,x+10,y-2,8,3,'rgba(0,0,0,.25)');R(g,x+11,y-32,6,30,'#f4f1e8');R(g,x+12,y-34,4,2,'#f4f1e8');R(g,x+13,y-31,2,28,'#e84a4a');R(g,x+11,y-4,6,2,'#d9bf7c');
  drawBuddy(g,x-2,y,DUDU,{dir:'down',frame:Math.sin(t*2)>.7?1:0,t});
}
// Markin na prancha. pose: 'deitado' (remando), 'flexao' (empurrando a prancha), 'agacha' ou 'pe'.
// Prancha grande, vista meio de cima (igual ao jogo); os dois pés ficam sempre em cima dela (inclusive no aéreo).
function drawPrancha(g){
  g.fillStyle='#8a8ab0';g.beginPath();g.ellipse(4,4,24,5,0,0,Math.PI*2);g.fill();
  g.fillStyle='#f4f4f0';g.beginPath();g.ellipse(4,2.5,24,4.5,0,0,Math.PI*2);g.fill();
  g.fillStyle='#ffffff';g.fillRect(-14,0,30,1);
  R(g,16,1,6,1,'#e8f060');R(g,14,2,9,1,'#c8e040');R(g,18,3,4,1,'#e8f060');}
function drawSurfista(g,x,y,ang,pose,lean=0,reto=false,face=1){
  // acelerando o bico desce um pouco; freando o bico levanta (rabeta afunda)
  const ab=ang+(lean>0?.15*lean:.28*lean);
  g.save();g.translate(Math.round(x),Math.round(y));if(face<0)g.scale(-1,1);g.rotate(ab);drawPrancha(g);
  if(Math.abs(lean)>.25&&pose==='pe')pose='agacha'; // acelerando ou freando ele abaixa (só o joelho dobra)
  if(reto)g.rotate(-ab*.2); // virando, o corpo inclina junto com a prancha pros pés ficarem no mesmo lugar
  const bracos=lean>.4?'frente':lean<-.4?'up':'abre'; // acelerando: braços pra frente · freando: braços pra cima equilibrando
  if(pose==='deitado'||pose==='flexao'){const sobe=pose==='flexao'?4:0;
    R(g,-15,-3,9,3,'#d29a6c');R(g,-16,-2,2,2,'#b8804f'); // pernas e pés
    R(g,-7,-4,7,4,'#2d8fe8'); // bermuda
    R(g,0,-5-sobe,10,5,'#5a3a26');R(g,0,-5-sobe,10,1,'#6e4a32'); // camiseta
    R(g,5,-sobe-1,3,sobe+1,'#d29a6c');R(g,5,-1,3,1,'#b8804f'); // braço empurrando a prancha
    drawMkCabeca(g,13,-2-sobe,12);}
  else{const ag=pose==='agacha';
    drawMkCorpo(g,0,0,{bermuda:true,sombra:false,agachado:ag,firme:true,arms:bracos,face:1,frame:0});
    drawMkCabeca(g,0,ag?-16:-19,24);} // abaixado: só o joelho dobra, a cabeça não muda
  g.restore();}
// Markin deitado na prancha remando na diagonal pra baixo, na parede da onda (igual ao "APERTE UM BOTÃO")
function drawRemada(g,x,y,t){
  g.save();g.translate(Math.round(x),Math.round(y));g.rotate(Math.PI-.55);
  // espuma em volta da prancha
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2+t*3,rr=13+Math.sin(t*9+i*2)*3;R(g,Math.cos(a)*rr*.8,Math.sin(a)*rr*1.7,2,2,i%3?'rgba(220,230,255,.8)':'#ffffff');}
  // prancha
  for(let yy=-26;yy<=22;yy++){const u=(yy+2)/24.5,w=Math.round(7.5*Math.sqrt(Math.max(0,1-u*u)));if(w>0){R(g,-w,yy,w*2,1,'#f4f4f0');R(g,-w,yy,1,1,'#8a8ab0');}}
  R(g,-1,-24,2,8,'#e8f060');
  // pernas e pés
  R(g,-4,5,3,13,'#d29a6c');R(g,1,5,3,13,'#d29a6c');R(g,-4,17,3,2,'#b8804f');R(g,1,17,3,2,'#b8804f');
  // bermuda e camiseta
  R(g,-5,-1,10,8,'#2d8fe8');R(g,-5,5,10,1,'#1f6ab8');
  R(g,-6,-14,12,14,'#5a3a26');R(g,-6,-14,12,1,'#6e4a32');R(g,-1,-14,2,3,'#e3b341');
  // braços girando (um na frente, o outro atrás, alternando)
  const a=t*9;
  for(const [sx,ph] of [[-6,a],[6,a+Math.PI]]){
    const reach=Math.cos(ph)*13,naAgua=Math.sin(ph)<0,hx=sx+Math.sign(sx)*(naAgua?5:3),hy=-12-reach;
    g.strokeStyle=naAgua?'#b8804f':'#d29a6c';g.lineWidth=3;g.beginPath();g.moveTo(sx,-12);g.lineTo(hx,hy);g.stroke();
    R(g,hx-1.5,hy-1.5,3,3,'#b8804f');
    if(naAgua&&reach<0)for(let k=0;k<3;k++)R(g,hx+rnd(-3,3),hy+rnd(-2,4),2,2,'#e9f4ff');}
  // cabeça (de cima: cabelo)
  R(g,-4,-22,8,8,'#d29a6c');R(g,-4,-22,8,5,'#2a1d16');R(g,-5,-21,1,4,'#2a1d16');R(g,4,-21,1,4,'#2a1d16');
  g.restore();}
// texturas da onda em pixel art pontilhada (feitas uma vez só): céu, mar lá no fundo, parede e água já quebrada
let surfTex=null;
function surfTexturas(){if(surfTex)return surfTex;
  const hex=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
  const lerp=(a,b,k)=>a+(b-a)*k;
  const hx=(a,b)=>((Math.imul(a+11,73856093)^Math.imul(b+7,19349663))>>>0)%997/997;
  const mk=(w,h,cor)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),id=x.createImageData(w,h);
    for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const k=cor(xx,yy),i=(yy*w+xx)*4;id.data[i]=k[0];id.data[i+1]=k[1];id.data[i+2]=k[2];id.data[i+3]=255;}
    x.putImageData(id,0,0);return c;};
  const dith=(pal,s,xx,yy)=>{const i=Math.floor(s),f=s-i;return pal[clamp(i+(hx(xx,yy)<f?1:0),0,pal.length-1)];};
  const ceuP=['#2a1ac0','#3e2ee0','#5a50ec','#7a78f4','#a0a4fa','#c4c8ff'].map(hex);
  const marP=['#06205a','#0a3478','#10508e','#2a76b0','#6aa0d8','#ffffff'].map(hex);
  const parP=['#04043c','#08085e','#0c0c84','#1414aa','#2028cc','#3442e4','#5a68f2','#8e9cfa','#d0d8ff','#ffffff'].map(hex);
  const queP=['#1414b8','#2a2ad8','#4646ee','#6464f6','#8a8afa','#b4b4fc','#e0e0ff','#ffffff'].map(hex);
  const ceu=mk(W,27,(x,y)=>dith(ceuP,(y/27)*4.6+(y%4===0?.4:0),x,y));
  const mar=mk(384,22,(x,y)=>{const esp=(y===5||y===11||y===16)&&hx(x>>1,y)<.32;if(esp)return marP[hx(x,y+50)<.6?5:4];
    return dith(marP,1+y/22*1.6+Math.sin(x/9+y)*.5,x,y);});
  // parede: "escamas" em V invertido, claras em cima e embaixo e escuras no meio; a crista branca no topo
  const PH=H-SF.CREST;
  const parede=mk(384,PH,(x,y)=>{
    if(y<4){const h=hx(x,y);return y<2?(h<.75?parP[9]:parP[7]):(h<.45?parP[9]:h<.8?parP[8]:parP[6]);}
    const tri=Math.abs(((x%48)/48)*2-1),v=(((y-10*tri+3*Math.sin(x/7))%16)+16)%16/16,n=(hx(x,y+99)-.5)*1.4;
    const base=y<10?5.4:y<40?lerp(4.6,1.6,(y-10)/30):y<95?lerp(1.6,.3,Math.min(1,(y-40)/30)):lerp(.3,2.4,(y-95)/(PH-95));
    const k=y<40?1.3:y<95?.35:1.1;return dith(parP,clamp(base+k*Math.pow(1-v,3)+n-.3,0,9),x,y);});
  // água já quebrada (à esquerda da quebra): faixas onduladas claras, pontinhos escuros e espuma embaixo
  const quebrada=mk(384,PH+4,(x,y)=>{const h=hx(x,y+300);if(h<.05)return parP[1];
    const ond=Math.sin((y+6*Math.sin(x*Math.PI/24))/7);let s=2.6+ond*1.6+(y>PH-30?(y-(PH-30))/30*4:0)+(y<8?2:0);
    return dith(queP,clamp(s,0,7),x,y);});
  return surfTex={ceu,mar,parede,quebrada};}
// a quebra: coluna branca de espuma que ferve, com o lábio inclinado pra direita lá em cima
// tartaruga de lado (casco marrom, cabeça verde de bochecha rosa), com metade do corpo dentro d'água balançando.
// O desenho é virado pra esquerda; dir=1 vira pra direita. Y é a linha d'água.
const TARTA_PX=[
  '.........KKKKKKKK.......',
  '.GGGG..KKwBBKBBwBKK.....',
  'GGGGGG.KBBBBKBBBBBBK....',
  'GwGGGGKBBBBBKBBBBBBBK...',
  'GEGGEGKBBBKKKKKBBBBBBK..',
  'PGGGGPKBBKbbbbbKKBBBBK..',
  'GGGGGGKBKbbbbbbbbKBBBK..',
  '.GGGGGKKbbbbbbbbbbKBBKGG',
  '..GGGGKKKKKKKKKKKKKKKKGG',
  '....GGGGGGGGGGGGGGGGGG..',
  '...gGGGG.........GGGGg..',
  '...gGGGg.........gGGGg..',
  '...ggggg.........ggggg..'];
const TARTA_COR={K:'#2a1a0e',B:'#7a4520',b:'#94562a',w:'#f4e4d4',G:'#3ad84a',g:'#1e9a2e',P:'#ff7a8a',E:'#111111'};
function drawTartaruga(g,X,Y,t,dir){
  const s=1.1,bob=Math.sin(t*3)*1.2,top=Math.round(Y-9*s+bob);
  g.save();g.beginPath();g.rect(X-30,Y-30,60,30);g.clip(); // só a metade de cima aparece, o resto tá dentro d'água
  for(let r=0;r<TARTA_PX.length;r++)for(let c=0;c<24;c++){const k=TARTA_PX[r][c];if(k==='.')continue;
    const cc=dir>0?23-c:c;g.fillStyle=TARTA_COR[k];g.fillRect(Math.round(X-12*s+cc*s),top+Math.round(r*s),Math.ceil(s),Math.ceil(s));}
  g.restore();
  // marolinha em volta, na linha d'água
  for(let i=-8;i<=8;i++){const yy=Y+Math.round(Math.sin(i*.9+t*6)*1);R(g,X+i*2.4-1,yy,2,1,i%2?'#d8e4ff':'#ffffff');}
}
function drawQuebra(g,cx,t){const c=Math.floor(t*12),cores=['#ffffff','#ffffff','#e4e4ff','#b8b8f8','#7c7cf0'];
  for(let y=SF.CREST-6;y<H;y+=2){const u=clamp((y-SF.CREST)/(H-SF.CREST),0,1),xf=surfFrente(cx,y)+Math.sin(y/5+t*8)*1.5,wc=16+u*24;
    if(xf<-4||xf-wc>W)continue;
    for(let x=Math.floor(xf-wc);x<xf+4;x+=2){const h=((Math.imul(x+400,73856093)^Math.imul(y,19349663)^Math.imul(c,83492791))>>>0)%100,borda=x>xf-2||x<xf-wc+4;
      if(borda&&h>45)continue;if(y<SF.CREST&&h>55)continue;R(g,x,y,2,2,cores[h%5]);}
    if(((y*7+c)%9)===0)R(g,xf+3+((y+c)%5),y,2,2,'#d0d0ff');}
  for(let k=0;k<10;k++){const p=(t*.8+k*.1)%1,x0=surfFrente(cx,SF.CREST)-6+(k*5)%14;R(g,x0+p*10,SF.CREST-4-p*14,2,2,'rgba(255,255,255,'+(1-p).toFixed(2)+')');}}
function renderSurf(){
  const g=ctx,m=mg,t=m.t,TX=surfTexturas(),sc=m.scroll,r=m.r;
  const tile=(img,off,y)=>{const o=((off%img.width)+img.width)%img.width;g.drawImage(img,-o,y);if(img.width-o<W)g.drawImage(img,img.width-o,y);};
  g.imageSmoothingEnabled=false;
  // câmera: no aéreo ela sobe junto com o Markin
  const camY=r&&r.air?Math.max(0,Math.round(78-(r.y-r.air.z))):0;
  g.save();g.translate(0,camY);
  if(camY>0){const ce=g.createLinearGradient(0,-camY,0,0);ce.addColorStop(0,'#14086e');ce.addColorStop(1,'#2a1ac0');g.fillStyle=ce;g.fillRect(0,-camY,W,camY);}
  g.drawImage(TX.ceu,0,0);tile(TX.mar,sc*.12+t*4,27);
  tile(TX.parede,Math.round(sc),SF.CREST);
  const temQuebra=m.cx>-150&&(m.phase==='espera'||m.phase==='ride'||m.phase==='levanta'||m.phase==='caiu');
  let aperta=false;
  if(m.phase==='espera'){
    const w=m.wave||{x:-999},dx=w.x-m.me.x,ok=Math.abs(dx)<13,bob=Math.sin(t*3)*1.5;aperta=ok;
    drawRemada(g,140,100+bob,t);
    R(g,m.me.x-40,158,80,5,'#0a1e30');R(g,m.me.x-8,158,16,5,'#3fa34d');
    R(g,clamp(m.me.x+dx*.5,m.me.x-40,m.me.x+38),155,2,11,ok?'#ffe14f':'#f4f1e8');}
  for(const q of m.tart||[])drawTartaruga(g,q.x,q.y,q.t,q.x<m.mx?1:-1);
  if(r&&(m.phase==='ride'||m.phase==='levanta')){
    const mx=m.mx,ay=r.air?r.y-r.air.z:r.y;
    // rastro de espuma atrás da prancha
    const nr=r.lean>.4?18:10; // acelerando: rastro de espuma maior
    const tc=Math.cos(r.dir||0),ts=Math.sin(r.dir||0); // rastro fica atrás da prancha, pra onde ela estiver indo
    for(let i=1;i<nr;i++){const s=Math.sin(i*1.7+t*14),k=20+i*4;R(g,mx-tc*k+s,r.y+2-ts*k*.7+s,2,2,i%2?'rgba(170,190,255,.8)':'#ffffff');}
    if(r.air)R(g,mx-10,r.y+3,20,2,'rgba(0,0,30,.35)');
    const pose=m.phase==='levanta'?(m.lev<SF.LEVANTA*.35?'deitado':m.lev<SF.LEVANTA*.7?'flexao':'agacha'):r.tubo>0?'agacha':'pe';
    drawSurfista(g,mx,ay,m.phase==='levanta'?.3:r.ang,pose,r.air?0:r.lean||0,!r.air,r.face||1);}
  // a parte clara que vem da esquerda (água quebrada + coluna de espuma) passa POR CIMA do Markin;
  // quando ela tá em cima dele (tubo), fica transparente pra dar pra ver ele lá dentro
  const cobre=r&&(m.phase==='ride'||m.phase==='levanta')&&surfFrente(m.cx,r.y-15)>m.mx-26;
  if(cobre)g.globalAlpha=.45;
  if(temQuebra){ // água já quebrada, à esquerda da coluna de espuma
    g.save();g.beginPath();g.moveTo(-2,SF.CREST-2);
    for(let y=SF.CREST-2;y<=H;y+=3){const u=clamp((y-SF.CREST)/(H-SF.CREST),0,1);g.lineTo(surfFrente(m.cx,y)-16-u*24+4,y);}
    g.lineTo(-2,H);g.closePath();g.clip();tile(TX.quebrada,Math.round(sc*.45-t*10),SF.CREST-2);g.restore();}
  if(temQuebra)drawQuebra(g,m.cx,t);
  g.globalAlpha=1;
  for(const s of m.splash)R(g,s.x,s.y,2,2,'#e9f4ff');
  const pop=m.pops[m.pops.length-1]; // só o último ponto ganho aparece
  if(pop){g.globalAlpha=clamp(pop.t,0,1);outlineText(g,pop.txt,pop.x,pop.y,8,'#ffe14f');g.globalAlpha=1;}
  // UMA frase por vez: aviso > tempo no tubo > aperta > tartaruga > Lucas
  const tq=(m.tart||[]).find(q=>q.falaT>0);
  if(m.msgT>0&&m.msg&&m.result!=='win')outlineText(g,m.msg,W/2,40-camY,8,'#ffffff');
  else if(r&&r.tubo>0){outlineText(g,`x${surfMult(r.tubo).toFixed(1)}`,W/2,40-camY,16,'#ffffff');outlineText(g,`${Math.floor(r.tuboPts||0)}`,W/2,54-camY,10,'#ffe14f');}
  else if(aperta)outlineText(g,'APERTA AGORA!!!',W/2,40,12,'#ffe14f');
  else if(tq)outlineText(g,tq.fala,clamp(tq.x,50,W-50),tq.y-20,7,'#c8ffb0');
  else if(m.falaT>0)outlineText(g,'LUCAS: '+m.fala,W/2,150,7,'#fff1c2');
  g.restore();
  // placar
  if(r&&m.phase==='ride'){R(g,W-70,168,60,5,'#0a1e30');R(g,W-70,168,60*clamp((r.v-28)/(SF.VMAX-28),0,1),5,r.v>110?'#ffe14f':'#8be08b');outlineText(g,'VELOCIDADE',W-40,166,6,'#e9f4ff');}
  R(g,4,3,118,26,'rgba(7,11,20,.72)');outlineText(g,`ONDA ${Math.min(m.onda,3)}/3`,8,12,7,'#fff1c2','left');
  outlineText(g,`TOTAL ${Math.floor(m.total)}  · onda ${Math.floor(m.pts)}`,8,24,7,'#8be08b','left');
  outlineText(g,`META ${SF.META}`,W-8,12,7,'#fff1c2','right');R(g,W-78,17,70,5,'#0a1e30');R(g,W-78,17,70*clamp((m.total+m.pts)/SF.META,0,1),5,'#ffe14f');
  if(m.wipe>0){g.fillStyle='rgba(255,255,255,'+(m.wipe/.6)+')';g.fillRect(0,0,W,H);}
  if(m.result==='win')outlineText(g,'NOTA 10!',W/2,92,24,'#ffe14f');
}
/* ---------- ALTINHA (estilo Head Volley, sem rede) ---------- */
const AG=150,ALT_G=300;
function startAltinha(){
  mgEnter('altinha');
  mg={t:0,touches:0,best:0,drops:0,maxDrops:3,msg:'8 toques sem deixar cair!',msgT:2.4,done:0,result:null,serveT:1.6,pops:[],mood:null,moodT:0,
    me:{x:95,y:AG,vy:0,face:1,kick:0,cd:0,ground:true},
    pc:{x:225,y:AG,vy:0,face:-1,kick:0,cd:0,ground:true,think:0,goal:225},
    ball:{x:225,y:100,vx:0,vy:0,r:12,rot:0,live:false}};
}
function aimTo(b,tx,up){b.vy=-up;const apex=b.y-up*up/(2*ALT_G),drop=Math.max(4,(AG-40)-apex);const tt=up/ALT_G+Math.sqrt(2*drop/ALT_G);b.vx=clamp((tx-b.x)/tt,-160,160);}
function aimVx(b,tx,up){const k={x:b.x,y:b.y,vx:0,vy:0};aimTo(k,tx,up);return k.vx;}
function serveAlt(){const b=mg.ball;b.x=mg.pc.x-8;b.y=AG-20;b.live=true;aimTo(b,mg.me.x+rnd(-25,25),rnd(220,280));mg.pc.kick=.25;mg.last=mg.pc;sfx.pick();}
function altMove(p,ix,jump,dt,spd){
  p.vx=ix*spd;p.x=clamp(p.x+p.vx*dt,14,306);if(ix)p.face=ix>0?1:-1;p.run=(p.run||0)+Math.abs(ix)*dt;
  if(jump&&p.ground){p.vy=-285;p.ground=false;}
  p.vy+=700*dt;p.y+=p.vy*dt;if(p.y>=AG){p.y=AG;p.vy=0;p.ground=true;}
  p.kick=Math.max(0,p.kick-dt);p.cd=Math.max(0,p.cd-dt);
}
function altTouch(p){mg.touches++;mg.last=p;p.cd=.28;beep(520+mg.touches*60,.08,'square',.05);mg.pops.push({x:mg.ball.x,y:mg.ball.y-10,t:.8,txt:String(mg.touches)});
  if(p===mg.me){mg.mood='hype';mg.moodT=.5;}
  if(mg.touches>=8&&!mg.result){mg.result='win';mg.done=2.2;mg.msg='OITO TOQUES! Que altinha!';mg.msgT=2.2;mg.mood='hype';mg.moodT=2.2;sfx.win();}}
function altFail(msg){
  const m=mg;m.ball.live=false;m.best=Math.max(m.best,m.touches);m.drops++;sfx.hit();shake=.3;m.mood='sad';m.moodT=1.4;m.last=null;
  const left=m.maxDrops-m.drops;
  if(left<=0){m.result='lose';m.done=2.2;m.msg=msg||'Caiu de novo... acabou a altinha.';m.msgT=2.2;}
  else{m.msg=(msg||(m.touches?`Caiu no ${m.touches}º toque!`:'Caiu!'))+` Faltam ${left} bolas.`;m.msgT=2;m.serveT=1.8;}
  m.touches=0;
}
// devolução do parceiro: meio aleatória (curta, longa, chapéu...)
function pcReturn(b,me){const r=Math.random();
  if(r<.12)aimTo(b,me.x+rnd(-20,20),rnd(320,350));        // chapéu altão
  else if(r<.24)aimTo(b,me.x+rnd(40,70),rnd(170,200));     // curtinha, tem que correr
  else if(r<.36)aimTo(b,me.x-rnd(40,70),rnd(230,270));     // passou do ponto
  else aimTo(b,me.x+rnd(-35,35),rnd(200,300));}
function altHit(p,other,isMe){
  const b=mg.ball;if(!b.live||p.cd>0)return;
  const hx=p.x,hy=p.y-36,dx=b.x-hx,dy=b.y-hy,d=Math.hypot(dx,dy),R=16+b.r;
  const head=d<R&&d>0&&dy<8;
  const kx=p.x+p.face*12,ky=p.y-10,foot=p.kick>0&&Math.hypot(b.x-kx,b.y-ky)<(isMe?28:17); // chute com alcance maior
  if(!head&&!foot)return;
  if(mg.last===p){ // dois toques seguidos
    if(isMe){altFail('Altinha não é embaixadinha!');return;}
    return; // o parceiro deixa passar
  }
  if(head){
    const nx=dx/d,ny=dy/d;b.x=hx+nx*R;b.y=hy+ny*R;
    if(isMe){ // o jeito da cabeçada define o arco: pulo = mais alto, lado da cabeça = direção
      const up=clamp(185+(p.vy<0?-p.vy*.55:0)+(-ny)*55+Math.abs(b.vy)*.1,160,350);
      b.vy=-up;b.vx=clamp((nx*155+p.vx*.55)*.8+aimVx(b,other.x,up)*.2,-180,180);
    }else pcReturn(b,other);
    altTouch(p);return;
  }
  // chute: bola baixa = balão alto; bola mais alta = passe reto e rápido
  b.y=Math.min(b.y,ky-4);
  if(isMe){const rel=clamp(ky-b.y,0,18),up=clamp(300-rel*6,170,310);
    b.vy=-up;b.vx=clamp((p.face*(70+rel*5)+p.vx*.5)*.8+aimVx(b,other.x,up)*.2,-180,180);}
  else pcReturn(b,other);
  altTouch(p);p.kick=0;beep(180,.08,'triangle',.08);
}
function updAltinha(dt){
  const m=mg,b=m.ball;m.t+=dt;m.msgT-=dt;m.moodT-=dt;if(m.moodT<=0)m.mood=null;
  for(const q of m.pops){q.t-=dt;q.y-=20*dt;}m.pops=m.pops.filter(q=>q.t>0);
  const inp=mgInput();
  if(m.result){m.done-=dt;if(m.done<=0){
    if(m.result==='win'){const first=altinhaDay!==day;altinhaDay=day;markTask('altinha');mgExit(first?'Altinha de 8 toques! +6h acordado e +30 de energia.':'Mais uma altinha de 8! +6h acordado (+8 de energia)','good',first?30:8,360);}
    else mgLost(`Acabaram as bolas. Melhor sequência: ${m.best} toques.`);}
    altMove(m.me,0,false,dt,120);altMove(m.pc,0,false,dt,110);return;}
  // eu
  if(inp.act&&m.me.kick<=0)m.me.kick=.32;
  altMove(m.me,inp.ix,inp.jump,dt,125);
  // parceiro (CPU)
  const pc=m.pc;let tx=232;
  if(b.live){let px=b.x,py=b.y,vx=b.vx,vy=b.vy;for(let i=0;i<220;i++){vy+=ALT_G*.016;px+=vx*.016;py+=vy*.016;if(px<6||px>314)vx=-vx*.8;if(vy>0&&py>=AG-42)break;}
    if(m.last!==pc&&(px>158||(b.x>175&&b.vx>-20)))tx=clamp(px+7,168,306);}
  pc.think-=dt;if(pc.think<=0){pc.think=.14;pc.goal=tx+rnd(-3,3);}
  const dg=pc.goal-pc.x;let pix=Math.abs(dg)>3?Math.sign(dg)*Math.min(1,Math.abs(dg)/18):0;
  let pj=false;if(b.live&&Math.abs(b.x-pc.x)<16&&b.vy>0&&b.y<pc.y-52&&b.y>pc.y-78&&Math.random()<.08)pj=true;
  if(b.live&&Math.abs(b.x-(pc.x-10))<14&&b.y>AG-24&&pc.kick<=0)pc.kick=.22;
  altMove(pc,pix,pj,dt,112);pc.face=-1;
  // bola
  if(!b.live){m.serveT-=dt;b.x=pc.x-8;b.y=AG-20;b.vx=0;b.vy=0;if(m.serveT<=0)serveAlt();}
  else{
    b.vy+=ALT_G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=b.vx*dt*.06;
    if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)*.8;}if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx)*.8;}
    altHit(m.me,pc,true);altHit(pc,m.me,false);
    if(b.live&&b.y+b.r>=AG+3&&!m.result)altFail();
  }
}
function drawCria(g,hx,hy,look){ // parceiro da altinha: loiro platinado
  const sk='#b8733f',hair='#f4ecb0';
  R(g,hx-12,hy-15,24,31,sk);R(g,hx-14,hy-10,28,22,sk);R(g,hx-9,hy+16,18,3,sk);R(g,hx-16,hy-1,3,6,sk);R(g,hx+13,hy-1,3,6,sk);R(g,hx+14,hy+5,2,2,'#e3b341');
  R(g,hx-14,hy-19,28,8,hair);R(g,hx-11,hy-21,22,3,hair);R(g,hx-15,hy-13,2,9,'#6a5030');R(g,hx+13,hy-13,2,9,'#6a5030');
  R(g,hx-12,hy-9,10,4,'#111');R(g,hx+2,hy-9,10,4,'#111');R(g,hx-2,hy-8,4,1,'#111');R(g,hx-10,hy-8,3,1,'#6f7ff0');R(g,hx+4,hy-8,3,1,'#6f7ff0');
  R(g,hx-9,hy-3,6,1,'#5a3a1a');R(g,hx+3,hy-3,6,1,'#5a3a1a');
  const lk=clamp(Math.round(look),-1,1);
  R(g,hx-8,hy-1,5,3,'#fff');R(g,hx+3,hy-1,5,3,'#fff');R(g,hx-7+lk,hy,2,2,'#222');R(g,hx+5+lk,hy,2,2,'#222');
  R(g,hx-1,hy+3,3,5,'#9a5a30');R(g,hx-7,hy+9,14,2,'#4a2e18');
  R(g,hx-6,hy+11,12,1,'#7a2e2a');R(g,hx-5,hy+12,10,2,'#fff');R(g,hx-5,hy+14,10,1,'#c7665e');
}
function drawAltBody(g,p,shorts,shirt,skin){
  const x=Math.round(p.x),y=Math.round(p.y),f=p.ground?Math.floor((p.run||0)*10)%2:1;
  R(g,x-7,AG+1,14,3,'rgba(0,0,0,.18)');
  if(p.kick>0){R(g,x-3,y-9,3,9,skin);R(g,p.face>0?x+1:x-12,y-9,11,3,skin);R(g,p.face>0?x+10:x-13,y-10,3,4,'#f2c230');}
  else{R(g,x-4,y-9,3,9-f,skin);R(g,x+1,y-9,3,9-(1-f),skin);}
  R(g,x-5,y-14,10,6,shorts);R(g,x-5,y-10,10,1,'rgba(0,0,0,.2)');
  R(g,x-5,y-20,10,7,shirt);R(g,x-7,y-19,2,6,skin);R(g,x+5,y-19,2,6,skin);
}
function renderAltinha(){
  const g=ctx,m=mg,t=performance.now()/1000;
  const sky=g.createLinearGradient(0,0,0,100);sky.addColorStop(0,'#ff8a5a');sky.addColorStop(1,'#ffd49a');g.fillStyle=sky;g.fillRect(0,0,W,100);
  g.fillStyle='#fff1c2';g.beginPath();g.arc(248,78,16,0,Math.PI*2);g.fill();
  g.fillStyle='#7a4a6a';g.beginPath();g.moveTo(170,98);g.lineTo(196,62);g.lineTo(206,70);g.lineTo(222,48);g.lineTo(240,72);g.lineTo(262,98);g.fill(); // Dois Irmãos
  g.fillStyle='#8a5a7a';g.beginPath();g.moveTo(0,98);g.lineTo(18,84);g.lineTo(40,90);g.lineTo(60,98);g.fill();
  R(g,0,96,W,28,'#2a6fa8');for(let i=0;i<14;i++){const wx=((i*37+t*18)%340)-10;R(g,wx,100+(i%3)*7,12,1,'#6fb3e8');}
  R(g,0,120,W,4,'#e9f4ff');
  R(g,0,124,W,56,'#e8d193');for(let i=0;i<60;i++)R(g,(i*53)%W,126+(i*29)%52,1,1,i%2?'#d9bf7c':'#f3e2ad');
  // guarda-sol e isopor ao fundo
  R(g,22,98,1,26,'#6d6d6d');g.fillStyle='#e84a4a';g.beginPath();g.moveTo(8,100);g.lineTo(23,90);g.lineTo(38,100);g.fill();R(g,290,114,16,10,'#f4f4f4');R(g,290,114,16,3,'#2d6fd1');
  // jogadores
  drawMkCorpo(g,m.me.x,m.me.y,{frame:m.me.ground?Math.floor((m.me.run||0)*10)%2:1,face:m.me.face,kick:m.me.kick>0,moving:m.me.ground&&Math.abs(m.me.vx||0)>5,chao:AG,arms:m.me.ground?'down':'up'});
  drawAltBody(g,m.pc,'#d8332f','#b8733f','#b8733f');
  const st=faceState();if(m.mood)st.mood=m.mood;
  buildFace(st,{});g.imageSmoothingEnabled=false;g.drawImage(fbuf,Math.round(m.me.x-17),Math.round(m.me.y-57),34,42);
  drawCria(g,Math.round(m.pc.x),Math.round(m.pc.y-37),(m.ball.x-m.pc.x)/40);
  // bola
  const b=m.ball,hgt=clamp((AG-b.y)/120,0,1);
  g.fillStyle=`rgba(0,0,0,${(.25-hgt*.15).toFixed(2)})`;g.beginPath();g.ellipse(b.x,AG+2,6-hgt*3,2,0,0,Math.PI*2);g.fill();
  g.save();g.translate(b.x,b.y);g.rotate(b.rot);if(ballImg.complete&&ballImg.naturalWidth)g.drawImage(ballImg,-b.r,-b.r,b.r*2,b.r*2);else{g.fillStyle='#e8f040';g.beginPath();g.arc(0,0,b.r,0,Math.PI*2);g.fill();}g.restore();
  for(const q of m.pops){g.globalAlpha=clamp(q.t/.8,0,1);outlineText(g,q.txt,q.x,q.y,10,'#ffe14f');g.globalAlpha=1;}
  // HUD
  outlineText(g,`${m.touches}/8`,W/2,22,18,m.touches>=6?'#8be08b':'#fff1c2');
  outlineText(g,'TOQUES',W/2,32,7,'#f3ecd8');
  for(let i=0;i<m.maxDrops;i++){const alive=i<m.maxDrops-m.drops;g.globalAlpha=alive?1:.25;if(ballImg.complete)g.drawImage(ballImg,8+i*11,8,9,9);g.globalAlpha=1;}
  outlineText(g,`recorde ${Math.max(m.best,m.touches)}`,W-8,15,8,'#f3ecd8','right');
  if(m.msgT>0)outlineText(g,m.msg,W/2,62,10,'#ffffff');
  else if(m.t<4&&!m.result)outlineText(g,isTouch?'analógico anda · PULA · CHUTA':'← → anda · ↑ pula · ESPAÇO chuta · ESC sai',W/2,174,8,'#fff1c2');
}

/* ---------- BLOCO SECRETO (corrida estilo Subway Surfers) ---------- */
const BZ={HOR:64,BOT:172,CX:160,ZK:9,LW:64,HP:44,FAR:72};
const BUSCOL=[['#f4f4ee','#e2e2da','#8cc63f'],['#f4f4ee','#e2e2da','#8cc63f'],['#f4f4ee','#e2e2da','#8cc63f'],['#f4f4ee','#e2e2da','#f2c230'],['#f4f4ee','#e2e2da','#2d6fd1']];
const ROTAS=['474','472','455','484','433','410','107'];
function bsz(z){return 1/(1+Math.max(z,-2.4)/BZ.ZK);}
function bp(xw,h,z){const s=bsz(z);return{x:BZ.CX+xw*BZ.LW*s,y:BZ.HOR+(BZ.BOT-BZ.HOR)*s-h*BZ.HP*s,s};}
function startBloco(){
  mgEnter('bloco');
  const tipos=['diabinha','anjinha','bebe','fortinho','anjinho','princesa'],people=[];
  for(let i=0;i<17;i++)people.push({x:i*20-4+rnd(-4,4),tipo:tipos[i%tipos.length],skin:pick(['#d29a6c','#b8733f','#8a5a3a','#e0b08a']),hair:pick(['#1e140e','#3a2210','#6b4423','#e8c070']),ph:rnd(0,6)});
  mg={t:0,dist:0,sp:13,p:0,gap:.8,lane:0,prevLane:0,lx:0,h:0,vh:0,gl:0,objs:[],nextWave:14,msg:'O Bloco Heterotop tá vindo! Pule nos ônibus e ache o Bloco Secreto!',msgT:3.4,done:0,result:null,stumble:0,got:0,people,conf:[],drunkT:1.5,pops:[]};
  for(let i=0;i<40;i++)mg.conf.push({x:rnd(0,W),y:rnd(0,H),v:rnd(18,40),c:pick(['#ff4fd8','#4fffd2','#ffe14f','#ff8a3d','#ffffff'])});
}
const RUN_ITEMS=['beer','beer','beer','beer','shroom','shroom','zip','shades'];
function runItem(L,zw,h,v){const o={k:'item',type:pick(RUN_ITEMS),lane:L,zw,len:.6,h,v:v||0};mg.objs.push(o);return o;}
function blocoWave(zw){
  const lanes=[-1,0,1].sort(()=>Math.random()-.5);const nb=Math.random()<.85?1:2;
  lanes.forEach((L,i)=>{
    if(i<nb){const len=rnd(8,11),z=zw+rnd(0,5),v=pick([-1,1])*rnd(3,6); // ônibus andando: vindo na tua direção (v<0) ou indo embora (v>0)
      mg.objs.push({k:'bus',lane:L,zw:z,len,h:1,v,col:pick(BUSCOL),rota:pick(ROTAS)});
      if(Math.random()<.35)runItem(L,z+rnd(2,len-1),1.3,v);}
    else if(i===nb&&Math.random()<.3){const k=pick(['grade','isopor']);mg.objs.push({k,lane:L,zw:zw+rnd(0,7),len:.7,h:k==='grade'?.5:.62});}
    else if(Math.random()<.38)runItem(L,zw+rnd(0,6),.35);
  });
}
function tickFx(dt){const was=fx.turbo>0;for(const k of ['turbo','crash','trip','disguise','drunk','burn','sleepy'])fx[k]=Math.max(0,fx[k]-dt);if(was&&fx.turbo<=0){fx.crash=14;return true;}return false;}
function runPickup(type){ // mesmos itens do mundo aberto
  const m=mg;let txt='';sfx.pick();
  if(type==='beer'){P.energy=Math.min(maxE(),P.energy+12);sfx.gulp();fx.beers=fx.beers.filter(t=>time-t<40);fx.beers.push(time);txt='+12';
    if(fx.beers.length>=3){fx.drunk=10;fx.beers=[];librasPend=true;m.msg='Três brejas... a rua tá balançando!';m.msgT=2;}}
  else if(type==='zip'){P.energy=Math.min(maxE(),P.energy+20);fx.turbo=10;fx.crash=0;sfx.sniff();txt='+20 TURBO';}
  else if(type==='shroom'){P.energy=Math.min(maxE(),P.energy+22);fx.trip=12;sfx.trip();txt='+22';m.msg='Viagem! Tudo colorido.';m.msgT=2;comeuCogumelo(true);} // na corrida do bloco o dragão não aparece
  else if(type==='shades'){P.energy=Math.min(maxE(),P.energy+5);fx.disguise=12.5;txt='DISFARCE';m.msg='De óculos, o Bloco Heterotop não te reconhece.';m.msgT=2;}
  m.got++;m.pops.push({txt,t:1});
}
function updBloco(dt){
  const m=mg;m.t+=dt;m.msgT-=dt;
  for(const c of m.conf){c.y+=c.v*dt;c.x+=Math.sin(m.t*3+c.v)*10*dt;if(c.y>H){c.y=-4;c.x=rnd(0,W);}}
  for(const q of m.pops)q.t-=dt;m.pops=m.pops.filter(q=>q.t>0);
  const inp=mgInput();
  if(m.result){m.done-=dt;m.dist+=m.sp*.4*dt;if(m.done<=0){cv.style.filter='';
    if(m.result==='win'){markTask('bloco');mgExit(`Achou o Bloco Secreto e ganhou um SAXOFONE! +6h acordado e +20 de energia.`,'good',20,360);
      $('toast').hidden=true;state='cut';cutKind='sax';P.mode='cut';cutGen=saxGen();cutGen.next();}
    else if(m.result==='sleep')mgLost('Markin dormiu no meio do bloco...');
    else mgLost('O Bloco Heterotop te engoliu e o Bloco Secreto sumiu.');}return;}
  // efeitos dos itens (os mesmos do mundo aberto)
  if(tickFx(dt)){m.msg='Bateu a bad... tudo pesado.';m.msgT=2;}
  cv.style.filter=fx.turbo>0?'contrast(1.15) saturate(1.3)':P.energy<20?'saturate(.6)':'';
  // a energia acaba bem mais rápido aqui
  P.energy-=2.7*(fx.crash>0?1.6:1)*dt;
  if(P.energy<=0){P.energy=0;m.result='sleep';m.done=2;m.msg='Markin dormiu no meio do bloco...';m.msgT=2;sfx.lose();return;}
  m.sp=Math.min(22,13+m.t*.2)*(m.stumble>0?.72:1)*(fx.turbo>0?1.3:1)*(fx.crash>0?.85:1);m.stumble=Math.max(0,m.stumble-dt);
  m.dist+=m.sp*dt;m.p=Math.min(1,m.t/45);
  for(const o of m.objs)if(o.v)o.zw+=o.v*dt;
  while(m.nextWave-m.dist<BZ.FAR){blocoWave(m.nextWave);const gp=rnd(22,30);if(Math.random()<.3)runItem(pick([-1,0,1]),m.nextWave+gp*.55,.35);m.nextWave+=gp;}
  // faixas e pulo: só muda de faixa quando o jogador aperta (nada de mudar sozinho)
  const dl=inp.lane;
  m.laneT=(m.laneT||0)+dt;
  if(dl){const nl=clamp(m.lane+dl,-1,1);if(nl!==m.lane){m.prevLane=m.lane;m.lane=nl;m.laneT=0;}}
  m.lx+=(m.lane-m.lx)*Math.min(1,dt*14);
  const grounded=m.h<=m.gl+.02;
  if((inp.jump||inp.act)&&grounded){m.vh=6.3;beep(330,.1,'square',.04,660);}
  m.vh-=15*dt;m.h+=m.vh*dt;
  let gl=0;
  for(const o of m.objs){if(o.k!=='bus'||o.dead)continue;const z0=o.zw-m.dist,z1=z0+o.len;
    if(Math.abs(m.lx-o.lane)<.45&&z0<=.3&&z1>=-.3&&m.h>=o.h-.14)gl=Math.max(gl,o.h);}
  m.gl=gl;if(m.h<=gl){m.h=gl;m.vh=0;}
  // colisões
  for(const o of m.objs){if(o.dead||o.hit)continue;const z0=o.zw-m.dist,z1=z0+o.len;
    if(Math.abs(m.lx-o.lane)>=.4||z0>.4||z1<-.2)continue;
    if(o.k==='item'){if(Math.abs(m.h-o.h)<.8){o.dead=true;runPickup(o.type);}continue;}
    if(m.h<o.h-.14){o.hit=true;m.gap-=.25;m.clean=0;m.stumble=.9;sfx.hit();shake=.35;flash=.2;
      m.msg=o.k==='bus'?'Bateu no ônibus! O Bloco Heterotop chegou perto!':'Tropeçou! O Bloco Heterotop chegou perto!';m.msgT=1.6;
      if(o.k==='bus'&&z0<-.1&&m.laneT<.35){m.lane=m.prevLane;m.laneT=1;}}
  }
  m.objs=m.objs.filter(o=>!o.dead&&o.zw+o.len-m.dist>-3);
  // multidão
  // sem bater em nada por 2s, ele vai se afastando do Bloco Heterotop
  m.clean=(m.clean||0)+dt;
  m.gap+=(m.gl>.5?.1:m.clean>2?.04:-.05*(fx.disguise>0?.5:1))*dt+(fx.turbo>0?.05*dt:0);m.gap=clamp(m.gap,0,1);
  if(m.gap<=0){m.result='lose';m.done=2.2;m.msg='O BLOCO HETEROTOP TE ARRASTOU!';m.msgT=2.2;sfx.lose();}
  else if(m.p>=1){m.result='win';m.done=2.4;m.msg='ACHOU O BLOCO SECRETO!';m.msgT=2.4;sfx.win();}
}
function drawBus(g,o,z0,z1){
  const L=o.lane,xl=L-.42,xr=L+.42,h=o.h,zf=Math.max(z0,-2.4);if(z1<=zf)return;
  const [body,roof,faixa]=o.col,blink=o.hit&&Math.floor(performance.now()/80)%2;if(blink)g.globalAlpha=.5;
  if(L!==0){const xs=L<0?xr:xl;quad(g,[bp(xs,0,zf),bp(xs,0,z1),bp(xs,h,z1),bp(xs,h,zf)],body);
    quad(g,[bp(xs,.06,zf),bp(xs,.06,z1),bp(xs,.4,z1),bp(xs,.4,zf)],faixa||'#8cc63f'); // faixa colorida embaixo
    for(let wz=Math.ceil(zf);wz<z1-1;wz+=1.4)quad(g,[bp(xs,.5,wz),bp(xs,.5,wz+1.1),bp(xs,.86,wz+1.1),bp(xs,.86,wz)],'#1a2a3a');
    quad(g,[bp(xs,.44,zf),bp(xs,.44,z1),bp(xs,.47,z1),bp(xs,.47,zf)],'#c9c9c0');
    for(const wz of [z0+.9,z1-1.2])if(wz>zf&&wz<z1)quad(g,[bp(xs,0,wz),bp(xs,0,wz+.55),bp(xs,.14,wz+.55),bp(xs,.14,wz)],'#1d1d22'); // rodas
    quad(g,[bp(xs,0,zf),bp(xs,0,z1),bp(xs,.06,z1),bp(xs,.06,zf)],'rgba(0,0,0,.35)');}
  quad(g,[bp(xl,h,zf),bp(xr,h,zf),bp(xr,h,z1),bp(xl,h,z1)],roof);
  const ac=[Math.max(zf,z0+3),z0+5.5];if(ac[1]>ac[0])quad(g,[bp(L-.2,h,ac[0]),bp(L+.2,h,ac[0]),bp(L+.2,h,ac[1]),bp(L-.2,h,ac[1])],'#c9c9c0');
  if(z0>-.2){const a=bp(xl,h,z0),b=bp(xr,0,z0),w=b.x-a.x,hh=b.y-a.y;
    const back=o.v>0; // indo embora: a gente vê a traseira
    g.fillStyle=body;g.fillRect(a.x,a.y,w,hh);
    g.fillStyle=faixa||'#8cc63f';g.fillRect(a.x,a.y+hh*.6,w,hh*.34);g.fillStyle='#f4f4ee';g.fillRect(a.x,a.y+hh*.6,w,hh*.03);
    g.fillStyle='#1a2a3a';if(back)g.fillRect(a.x+w*.2,a.y+hh*.2,w*.6,hh*.24);else g.fillRect(a.x+w*.07,a.y+hh*.24,w*.86,hh*.34);
    g.fillStyle='#111';g.fillRect(a.x+w*.1,a.y+hh*.03,w*.8,hh*.15); // letreiro de LED
    if(w>18){g.fillStyle='#ffb347';g.font=`700 ${Math.max(5,Math.round(hh*.12))}px monospace`;g.textAlign='center';g.fillText(back?o.rota||'474':(o.rota||'474')+' CENTRO',a.x+w/2,a.y+hh*.15);}
    if(w>34&&!back){g.fillStyle='#2a2a30';g.fillRect(a.x+w*.2,a.y+hh*.19,w*.6,hh*.05);g.fillStyle='#f4f4ee';g.font=`700 ${Math.max(3,Math.round(hh*.045))}px monospace`;g.fillText('AR CONDICIONADO',a.x+w/2,a.y+hh*.235);}
    g.fillStyle=back?'#ff3b30':'#ffe07a';g.fillRect(a.x+w*.06,a.y+hh*.76,w*.14,hh*.08);g.fillRect(a.x+w*.8,a.y+hh*.76,w*.14,hh*.08);
    g.fillStyle='rgba(0,0,0,.4)';g.fillRect(a.x,a.y+hh*.94,w,hh*.06);}
  g.globalAlpha=1;
}
function drawBarrier(g,o,z0){
  if(z0<-.2)return;const a=bp(o.lane-.42,o.h,z0),b=bp(o.lane+.42,0,z0),w=b.x-a.x,hh=b.y-a.y;
  if(o.hit&&Math.floor(performance.now()/80)%2)g.globalAlpha=.5;
  if(o.k==='grade'){g.fillStyle='#c9ccd4';g.fillRect(a.x,a.y,w,Math.max(1,hh*.12));g.fillRect(a.x,a.y+hh*.5,w,Math.max(1,hh*.1));for(let i=0;i<=8;i++)g.fillRect(a.x+i*w/8-.5,a.y,Math.max(1,w*.02),hh);}
  else{g.fillStyle='#f4f4f4';g.fillRect(a.x+w*.1,a.y+hh*.2,w*.8,hh*.8);g.fillStyle='#2d6fd1';g.fillRect(a.x+w*.08,a.y,w*.84,hh*.24);g.fillStyle='#c2452f';g.fillRect(a.x+w*.3,a.y+hh*.5,w*.4,hh*.18);}
  g.globalAlpha=1;
}
function drawRunItem(g,o,z0){if(z0<-.2)return;const p=bp(o.lane,o.h,z0),sc=Math.max(.4,p.s*1.8);
  g.save();g.translate(p.x,p.y);g.scale(sc,sc);drawItem(g,o.type,0,0,performance.now()/1000);g.restore();}
// Bloco Heterotop: diabinha de saia vermelha, anjinha, anjinho, bebezão de fralda e chupeta, fortinho sem camisa e princesa
function drawFolia(g,x,y,q,t){
  const sk=q.skin,arm=Math.sin(t*10+q.ph)>0,tp=q.tipo;
  const cabeca=(hair,longo)=>{if(longo)R(g,x-6,y-15,12,14,hair);R(g,x-5,y-14,10,11,sk);R(g,x-5,y-15,10,3,hair);R(g,x-3,y-10,2,2,'#111');R(g,x+1,y-10,2,2,'#111');R(g,x-2,y-6,4,2,'#7a2e2a');};
  const bracos=col=>{R(g,x-10,y-(arm?16:6),3,14,col||sk);R(g,x+7,y-(arm?6:16),3,14,col||sk);};
  const asas=()=>{R(g,x-15,y-8,7,12,'#f4f4f4');R(g,x-17,y-6,3,8,'#e0e0e8');R(g,x+8,y-8,7,12,'#f4f4f4');R(g,x+14,y-6,3,8,'#e0e0e8');};
  const aureola=()=>{g.strokeStyle='#ffe14f';g.lineWidth=1.5;g.beginPath();g.ellipse(x,y-19,5,1.6,0,0,Math.PI*2);g.stroke();};
  if(tp==='diabinha'){R(g,x-5,y+14,3,14,sk);R(g,x+2,y+14,3,14,sk);R(g,x-9,y+6,18,9,'#e0202a');R(g,x-6,y-2,12,9,'#b0101c');
    g.strokeStyle='#e0202a';g.lineWidth=1.5;g.beginPath();g.moveTo(x+8,y+10);g.quadraticCurveTo(x+16,y+14,x+13,y+22);g.stroke();R(g,x+12,y+21,3,3,'#e0202a');
    bracos();cabeca('#1e140e',true);R(g,x-5,y-18,2,4,'#e0202a');R(g,x+3,y-18,2,4,'#e0202a');
    R(g,x+9,y-(arm?30:20),1,20,'#8a8a8a');R(g,x+7,y-(arm?31:21),5,1,'#8a8a8a');R(g,x+7,y-(arm?33:23),1,2,'#8a8a8a');R(g,x+11,y-(arm?33:23),1,2,'#8a8a8a');}
  else if(tp==='anjinha'){asas();R(g,x-4,y+20,3,8,sk);R(g,x+1,y+20,3,8,sk);R(g,x-8,y-2,16,23,'#f4f1e8');R(g,x-8,y+6,16,1,'#ffe14f');bracos();cabeca('#e8c070',true);aureola();}
  else if(tp==='anjinho'){asas();R(g,x-5,y+12,3,16,sk);R(g,x+2,y+12,3,16,sk);R(g,x-7,y-2,14,15,'#f4f1e8');R(g,x-7,y+8,14,5,'#e8e4dc');bracos();cabeca(q.hair,false);aureola();}
  else if(tp==='bebe'){R(g,x-5,y+14,4,14,sk);R(g,x+1,y+14,4,14,sk);R(g,x-8,y-2,16,12,sk);R(g,x-7,y+1,1,1,'#9a6040');R(g,x+6,y+1,1,1,'#9a6040');R(g,x-1,y+5,2,1,'#9a6040');
    R(g,x-8,y+8,16,8,'#f4f4f4');R(g,x-8,y+8,16,1,'#d8d8e0');R(g,x-6,y+10,2,2,'#7fd1ff');R(g,x+4,y+10,2,2,'#7fd1ff');bracos();
    R(g,x-5,y-14,10,11,sk);R(g,x-5,y-15,10,2,q.hair);R(g,x-3,y-10,2,2,'#111');R(g,x+1,y-10,2,2,'#111');R(g,x-3,y-7,6,3,'#ff8fc2');R(g,x-1,y-6,2,1,'#f4f4f4');R(g,x-4,y-18,8,3,'#7fd1ff');}
  else if(tp==='fortinho'){R(g,x-5,y+12,4,16,sk);R(g,x+1,y+12,4,16,sk);R(g,x-7,y+6,14,8,'#1d1d22');R(g,x-10,y-3,20,11,sk);
    R(g,x-7,y,6,1,'#9a6040');R(g,x+1,y,6,1,'#9a6040');R(g,x-1,y+3,2,1,'#9a6040');R(g,x-1,y+5,2,1,'#9a6040');
    R(g,x-14,y-(arm?17:6),5,15,sk);R(g,x+9,y-(arm?6:17),5,15,sk);cabeca('#1e140e',false);R(g,x-5,y-15,10,2,'#1e140e');}
  else{ // princesa: vestido longo, bodie e tiara
    R(g,x-11,y+8,22,20,'#f2d060');R(g,x-9,y+6,18,3,'#e8c040');R(g,x-6,y-2,12,9,'#3a6fd8');R(g,x-8,y-2,3,3,'#6f9ae8');R(g,x+5,y-2,3,3,'#6f9ae8');
    bracos();cabeca('#3a2210',true);R(g,x-3,y-18,6,2,'#ffe14f');R(g,x-1,y-19,2,1,'#ffe14f');R(g,x,y-18,1,1,'#ff4fd8');}
}
// Bloco Secreto: elas de hot pant e biquíni; eles de camisa florida, short, bag atravessada e bucket
function drawSecreto(g,px,py,s,i,t){
  const sk=['#d29a6c','#b8733f','#8a5a3a','#e0b08a'][i%4],Rs=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(px+x*s,py+y*s,w*s,h*s);};
  if(i%2===0){Rs(-3,-8,2,8,sk);Rs(1,-8,2,8,sk);Rs(-3.5,-11,7,3,'#4f7fc8');Rs(-3,-16,6,5,sk);Rs(-3,-15,6,1.6,['#ff4fd8','#ffe14f','#4fffd2','#e84a4a'][i/2%4|0]);
    Rs(-5,-17,2,7,sk);Rs(3,-17,2,7,sk);Rs(-4,-23,8,7,'#3a2210');Rs(-3,-22,6,6,sk);Rs(-4,-23,8,2,'#3a2210');Rs(-5,-22,2,8,'#3a2210');Rs(3,-22,2,8,'#3a2210');}
  else{const flor=['#e84a4a','#2f9a55','#2d6fd1','#ff8a3d'][(i/2|0)%4];Rs(-3,-6,2,6,sk);Rs(1,-6,2,6,sk);Rs(-3.5,-10,7,4,'#c9b080');Rs(-4,-17,8,7,flor);
    Rs(-3,-16,1.5,1.5,'#ffe14f');Rs(1,-14,1.5,1.5,'#f4f1e8');Rs(-2,-12,1.5,1.5,'#ffe14f');
    for(let k=0;k<7;k++)Rs(3-k,-17+k*1.2,1,1,'#1d1d22');Rs(-5,-11,3,3,'#1d1d22');
    Rs(-5,-17,1,6,sk);Rs(4,-17,1,6,sk);Rs(-3,-23,6,6,sk);Rs(-4.5,-25,9,3,'#e8d8a8');Rs(-3.5,-27,7,2,'#e8d8a8');}
  const led=['#ff2bd6','#2bffe0','#fff12b','#2b7bff'][(i+Math.floor(t*6))%4];Rs(-3.5,-24,7,1,led);Rs(-4,-13,1,1,led);Rs(3,-11,1,1,led);Rs(-2,-9,4,.8,led); // LED
  for(let k=0;k<3;k++){const a=t*3+k*2.1+i;Rs(Math.cos(a)*7,-16+Math.sin(a)*6,1,1,['#ffe14f','#ffffff','#ff8fc2'][k]);} // glitter
}
function renderBloco(){
  const g=ctx,m=mg,t=m.t;
  const sky=g.createLinearGradient(0,0,0,BZ.HOR);sky.addColorStop(0,'#1b2250');sky.addColorStop(.7,'#b0587a');sky.addColorStop(1,'#f0a060');g.fillStyle=sky;g.fillRect(0,0,W,BZ.HOR+2);
  for(let i=0;i<18;i++)R(g,(i*71)%W,(i*37)%(BZ.HOR-30),1,1,'#fff7c2');
  // Theatro Municipal no fim da avenida
  {const cx=BZ.CX,by=BZ.HOR+1;R(g,cx-26,by-12,52,12,'#e8dcc0');R(g,cx-26,by-12,52,1,'#fff6e0');for(let i=0;i<9;i++)R(g,cx-23+i*6,by-10,2,9,'#c9b890');R(g,cx-28,by-14,56,2,'#d8c8a0');
   g.fillStyle='#3f8a6a';g.beginPath();g.ellipse(cx,by-16,9,7,0,Math.PI,0);g.fill();g.beginPath();g.ellipse(cx-20,by-14,4,4,0,Math.PI,0);g.fill();g.beginPath();g.ellipse(cx+20,by-14,4,4,0,Math.PI,0);g.fill();
   R(g,cx-1,by-26,2,4,'#e3b341');R(g,cx-3,by-27,6,1,'#e3b341');R(g,cx-21,by-19,2,2,'#e3b341');R(g,cx+19,by-19,2,2,'#e3b341');}
  // chão
  quad(g,[bp(-3.2,0,BZ.FAR),bp(3.2,0,BZ.FAR),{x:W+200,y:H+20},{x:-200,y:H+20}],'#bdb5a6');
  quad(g,[bp(-1.55,0,BZ.FAR),bp(1.55,0,BZ.FAR),bp(1.55,0,-2.4),bp(-1.55,0,-2.4)],'#3a3d48');
  quad(g,[bp(.5,0,BZ.FAR),bp(1.55,0,BZ.FAR),bp(1.55,0,-2.4),bp(.5,0,-2.4)],'#2d5fa8'); // faixa de ônibus (azul) na direita da Rio Branco
  for(let z=-(m.dist%9)+2;z<BZ.FAR-3;z+=9){if(z<-1.5)continue;const a=bp(1.02,0,z),b=bp(1.02,0,z+1.8),w=Math.abs(bp(1.5,0,z).x-bp(.55,0,z).x);if(w<10)continue;
    g.save();g.translate(a.x,(a.y+b.y)/2);g.scale(1,Math.max(.15,(a.y-b.y)/(w*.26)));g.fillStyle='rgba(244,241,232,.85)';g.font=`700 ${Math.round(w*.26)}px monospace`;g.textAlign='center';g.textBaseline='middle';g.fillText('ÔNIBUS',0,0);g.restore();}
  // prédios
  const seg=7,off=m.dist%seg;
  for(let k=Math.floor(BZ.FAR/seg);k>=0;k--){const z=k*seg-off,id=Math.floor((m.dist+k*seg)/seg);
    for(const sd of [-1,1]){const x0=sd*2.05,hgt=3.4+h2(id,sd,3)*3.2,tipo=Math.floor(h2(id,sd,4)*6),col=['#e0d6c0','#c9b890','#8aa0b8','#b8b1a3','#6a7f96','#d8c8a8'][tipo];
      const p=[bp(x0,0,z),bp(x0,0,z+seg*.92),bp(x0,hgt,z+seg*.92),bp(x0,hgt,z)];quad(g,p,col);
      quad(g,[bp(x0,hgt-.18,z),bp(x0,hgt-.18,z+seg*.92),bp(x0,hgt,z+seg*.92),bp(x0,hgt,z)],'rgba(0,0,0,.18)'); // cornija
      for(let wy=.6;wy<hgt-.4;wy+=.7)for(let wz=.8;wz<seg-1;wz+=1.8){const lit=h2(id*7+Math.round(wy*10),Math.round(wz*10),sd)>.45;
        quad(g,[bp(x0,wy,z+wz),bp(x0,wy,z+wz+.8),bp(x0,wy+.35,z+wz+.8),bp(x0,wy+.35,z+wz)],lit?'#ffcf6a':'#2a2440');}}}
  // faixas
  for(const xw of [-.5,.5])for(let z=-(m.dist%4);z<BZ.FAR;z+=4)quad(g,[bp(xw-.02,0,z),bp(xw+.02,0,z),bp(xw+.02,0,z+1.8),bp(xw-.02,0,z+1.8)],'#f4f1e8');
  // árvores nas calçadas (as copas enormes da avenida)
  {const tseg=3.5,toff=m.dist%tseg;for(let k=Math.floor(BZ.FAR/tseg);k>=0;k--){const z=k*tseg-toff;if(z<-1.5)continue;
    for(const sd of [-1,1]){const tr=bp(sd*1.75,0,z),top=bp(sd*1.75,1.3,z),s=bsz(z);R(g,tr.x-Math.max(1,1.5*s),top.y,Math.max(1,3*s),tr.y-top.y,'#5a3a22');
      const rr=Math.max(3,22*s),id=Math.floor((m.dist+k*tseg)/tseg);g.fillStyle=['#2f6e32','#3a7a36','#2a6230'][id%3];g.beginPath();g.arc(top.x,top.y-rr*.4,rr,0,Math.PI*2);g.fill();
      g.fillStyle='#4f9a45';g.beginPath();g.arc(top.x-rr*.3,top.y-rr*.7,rr*.5,0,Math.PI*2);g.fill();}}}
  // varais de luz
  for(let z=-(m.dist%12)+6;z<BZ.FAR;z+=12){const a=bp(-1.8,2.6,z),b=bp(1.8,2.6,z);g.strokeStyle='#222';g.lineWidth=Math.max(1,bsz(z));g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+10*bsz(z),b.x,b.y);g.stroke();
    for(let i=1;i<10;i++){const u=i/10,x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u+Math.sin(u*Math.PI)*10*bsz(z);g.fillStyle=['#ff4fd8','#4fffd2','#ffe14f','#ff8a3d'][(i+Math.floor(t*4))%4];g.fillRect(x-1,y,Math.max(1,3*bsz(z)),Math.max(1,3*bsz(z)));}}
  // o Bloco Secreto só aparece lá na frente quando você chega perto
  if(m.p>.72){
  const zb=Math.max(2,(BZ.FAR-6)*(1-m.p)/.28+2),pb=bp(0,0,zb),s=pb.s;
  for(let i=0;i<12;i++){const px=pb.x+(i-5.5)*14*s,py=pb.y-Math.abs(Math.sin(t*8+i))*4*s;drawSecreto(g,px,py,s,i,t);}
  drawEstandarte(g,pb.x,pb.y-4*s,1.5*s,{t,topo:'BLOCO',base:'SECRETO'});
  }else{ // ainda buscando: só um "?" piscando no horizonte
    if(Math.floor(t*2)%2)outlineText(g,'?',BZ.CX,BZ.HOR+2,12,'#ffe14f');}
  // objetos (do fundo pra frente)
  const list=m.objs.map(o=>({o,z0:o.zw-m.dist})).filter(q=>q.z0<BZ.FAR&&q.z0+q.o.len>-2.4).sort((a,b)=>(b.z0+(b.o.len||0))-(a.z0+(a.o.len||0)));
  for(const {o,z0} of list){if(o.k==='bus')drawBus(g,o,z0,z0+o.len);else if(o.k==='item')drawRunItem(g,o,z0);else drawBarrier(g,o,z0);}
  // Markin (de costas)
  const pp=bp(m.lx,m.h,0),sh=bp(m.lx,m.gl,0);
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(sh.x,sh.y,11,3,0,0,Math.PI*2);g.fill();
  if(!(m.stumble>0&&Math.floor(t*12)%2)){g.save();g.translate(Math.round(pp.x),Math.round(pp.y));g.scale(2.2,2.2);
    drawMarkin(g,0,0,{dir:'up',frame:m.h>m.gl+.05?1:Math.floor(t*12)%4,outfit:'casual'});g.restore();}
  // multidão atrás
  const cy=H+30-(1-m.gap)*78;
  if(m.gap<.35){g.fillStyle=`rgba(255,30,30,${((.35-m.gap)*.9).toFixed(2)})`;g.fillRect(0,H-40,W,40);}
  for(const q of m.people){const x=Math.round(q.x+Math.sin(t*2+q.ph)*4),y=Math.round(cy+Math.abs(Math.sin(t*9+q.ph))*-5+(q.x%3)*4);drawFolia(g,x,y,q,t);}
  // faixa do Bloco Heterotop por cima da multidão
  const fy=cy-36;drawFaixa(g,58,fy,204,15,'BLOCO HETEROTOP',t,'#2d6fd1','#ffe14f','#0a1e5a');
  for(const c of m.conf)R(g,c.x,c.y,2,2,c.c);
  // HUD: cara + energia do Markin (acaba rápido aqui)
  R(g,4,3,94,34,'rgba(7,11,20,.72)');
  buildFace(faceState(),{});g.imageSmoothingEnabled=false;g.drawImage(fbuf,6,4,26,32);
  outlineText(g,'MARKIN',36,12,7,'#ffb347','left');R(g,36,16,58,6,'#0a1020');const e=clamp(P.energy,0,100);R(g,36,16,58*e/100,6,e>60?'#8be08b':e>30?'#ffb347':'#ff6b5d');
  let cx2=36;for(const [on,lb,col] of [[fx.turbo>0,'TURBO','#ffb347'],[fx.crash>0,'BAD','#ff6b5d'],[fx.trip>0,'VIAGEM','#ff8fc2'],[fx.disguise>0,'ÓCULOS','#9fd0ff'],[fx.drunk>0,'BÊBADO','#ffd54a']])if(on){outlineText(g,lb,cx2,31,6,col,'left');cx2+=lb.length*4+4;}
  outlineText(g,'BUSCANDO O BLOCO SECRETO',W/2+22,11,7,'#ffe14f');R(g,W/2-38,15,120,6,'#1a1030');R(g,W/2-38,15,120*m.p,6,'#ff4fd8');
  outlineText(g,'HETEROTOP',W-6,11,7,'#9fd0ff','right');R(g,W-58,15,52,5,'#1a1030');R(g,W-58,15,52*m.gap,5,m.gap>.5?'#8be08b':m.gap>.25?'#ffb347':'#ff6b5d');
  for(const q of m.pops)if(q.txt){g.globalAlpha=clamp(q.t,0,1);outlineText(g,q.txt,BZ.CX+m.lx*BZ.LW,BZ.BOT-70-(1-q.t)*20,9,'#8be08b');g.globalAlpha=1;}
  if(m.msgT>0)outlineText(g,m.msg,W/2,50,9,'#ffffff');
  else if(t<4&&!m.result)outlineText(g,isTouch?'deslize pros lados: troca de faixa · toque: pula':'← → troca de faixa · ↑ ou ESPAÇO pula · pegue os itens pra não dormir',W/2,62,7,'#f3ecd8');
}
/* ---------- BAR: beber e equilibrar a cabeça pra não dormir sentado ---------- */
let barDoors=[],barDay=0;
function startBar(){
  mgEnter('bar');
  mg={t:0,th:.04,om:0,wind:0,nodT:2.5,beers:0,goal:6,glass:1,drink:0,refillT:0,spills:0,msg:'Beba 6 sem deixar a cabeça cair!',msgT:2.8,done:0,result:null,zz:[]};
}
function updBar(dt){
  const m=mg;m.t+=dt;m.msgT-=dt;
  for(const z of m.zz){z.t-=dt;z.y-=12*dt;z.x+=6*dt;}m.zz=m.zz.filter(z=>z.t>0);
  const inp=mgInput();
  if(m.result){m.done-=dt;if(m.result==='lose'){m.th=clamp(m.th+Math.sign(m.th)*dt*3,-1.45,1.45);}
    if(m.done<=0){
      if(m.result==='win'){const first=barDay!==day;barDay=day;fx.drunk=15;fx.beers=[];librasPend=true;markTask('bar');
        mgExit(first?'Bebeu 6 e não dormiu sentado! +6h acordado. Saiu bêbado.':'Mais uma rodada vencida! +6h acordado. Saiu bêbado.','good',first?12:4,360);}
      else mgLost('Dormiu sentado no bar. O garçom te acordou com a conta.');}
    return;}
  tickFx(dt);
  // quanto mais tempo, cerveja e cansaço, mais a cabeça pesa
  const drowsy=(.5+m.t*.015+m.beers*.12+(1-P.energy/100)*.5+(fx.drunk>0?.3:0)-(fx.turbo>0?.25:0))*.75; // 25% mais fácil
  m.wind+=(rnd(-1,1)*drowsy*5-m.wind)*Math.min(1,dt*1.5);
  m.nodT-=dt;if(m.nodT<=0){m.nodT=rnd(1.6,3.2)/(.6+drowsy*.5);m.om+=pick([-1,1])*rnd(.5,1.1)*drowsy;beep(200,.2,'sine',.04,150);}
  const ix=fx.trip>0?-inp.ix:inp.ix;
  const alpha=1.8*Math.sin(m.th)+m.wind+ix*6.5-1.6*m.om; // a cabeça pesa 25% menos
  m.om+=alpha*dt;m.th+=m.om*dt;
  if(Math.abs(m.th)>.6&&Math.random()<dt*3)m.zz.push({x:160+Math.sin(m.th)*40,y:70,t:1.2});
  if(Math.abs(m.th)>1.15){m.result='lose';m.done=2.2;m.msg='Capotou na mesa... zzz';m.msgT=2.2;sfx.lose();return;}
  if(m.hold>0){m.hold-=dt;if(m.hold<=0){m.hold=0;m.result='win';m.done=2.2;m.msg='SEIS! E acordado!';m.msgT=2.2;sfx.win();}return;}
  // beber
  if(m.drink>0){m.drink-=dt;if(m.drink<=0){m.beers++;m.glass=0;m.refillT=rnd(1.2,2.2);P.energy=Math.min(maxE(),P.energy+6);sfx.gulp();m.om+=rnd(-.4,.4);
    if(m.beers>=m.goal){m.hold=5;m.glass=0;m.msg='SEIS! Agora segura a cabeça por 5 segundos!';m.msgT=2.4;sfx.alert();}
    else if(m.beers===3){m.msg='Tá batendo... a cabeça ficou mais pesada.';m.msgT=2;}}}
  else if(inp.act){
    if(m.glass<=0){m.msg='Copo vazio. Espera o garçom!';m.msgT=1.2;}
    else if(Math.abs(m.th)<.35){m.drink=.7;}
    else{m.glass=0;m.refillT=2;m.spills++;m.msg='Derramou! Endireita a cabeça antes de beber.';m.msgT=1.8;sfx.hit();}
  }
  if(m.beers>=2&&m.msgT<=0){m.mermT=(m.mermT??2)-dt*(m.beers-1);if(m.mermT<=0){m.mermT=rnd(3,5);m.msg='Markin: '+pick(MERMAO);m.msgT=1.6;}}
  if(m.glass<=0&&m.drink<=0){m.refillT-=dt;if(m.refillT<=0){m.glass=1;m.msg=pick(['Desce mais uma!','Olha a gelada!','Essa é por conta da casa... mentira.']);m.msgT=1.2;beep(1200,.06,'square',.04);beep(1500,.06,'square',.04,0,.07);}}
}
// fundo do bar: mesinhas com gente sentada; os amigos do Markin sentam lá também
const BAR_POVO=[{skin:'#e0b08a',hair:'#3a2210',shirt:'#e84a4a',shorts:'#1d1d22',long:true},{skin:'#8a5a3a',hair:'#1e140e',shirt:'#f4f1e8',shorts:'#2d6fd1',cap:'#2f9a55'},
  {skin:'#c98c64',hair:'#9a9a9a',shirt:'#2d6fd1',shorts:'#1d1d22',beard:'#bdbdbd',belly:true},{skin:'#b8733f',hair:'#1e140e',shirt:'#ffe14f',shorts:'#1d1d22'},
  {skin:'#d29a6c',hair:'#6b4423',shirt:'#9b76d6',shorts:'#1d1d22',long:true},{skin:'#8a5a3a',hair:'#1e140e',shirt:'#2f6e52',shorts:'#f4f1e8',shades:true}];
function barFundo(g,t){
  const amigos=buddies.filter(b=>!b.crowd&&b.k!=='bar');
  const lugares=[[20,108],[44,108],[68,108],[200,108],[224,108]];
  lugares.forEach(([x,y],i)=>{const who=amigos[i]?{...amigos[i],hair:amigos[i].k==='festa'?gatHair:amigos[i].hair}:BAR_POVO[i%BAR_POVO.length],beb=Math.sin(t*1.1+i*1.7)>.75;
    g.save();g.translate(x,y+(beb?-1:0));g.scale(1.5,1.5);drawBuddy(g,0,0,{...who,prop:null},{dir:'down',frame:0,t});g.restore();
    if(amigos[i]&&Math.floor(t/3.2)%lugares.length===i&&t%3.2<2.4)outlineText(g,['Vira! Vira!','Mais uma, garçom!','Segura essa cabeça, Markin!','Tá bebendo ou tá dormindo?'][(i+Math.floor(t/3.2))%4],clamp(x,56,W-56),y-40,7,'#fff1c2');});
  for(const [x,y] of lugares){R(g,x-11,y-10,22,3,'#f2c230');R(g,x-10,y-7,2,9,'#c99a1a');R(g,x+8,y-7,2,9,'#c99a1a');R(g,x-3,y-17,3,7,'#6b3a0e');R(g,x+3,y-15,3,5,'rgba(242,182,58,.85)');}
}
function renderBar(){
  const g=ctx,m=mg,t=m.t;
  // azulejo de boteco
  R(g,0,0,W,104,'#eef2f6');
  for(let y=0;y<104;y+=12)for(let x=0;x<W;x+=12){R(g,x,y,12,1,'#c9d3de');R(g,x,y,1,12,'#c9d3de');R(g,x+5,y+3,2,6,'#3d6fb0');R(g,x+3,y+5,6,2,'#3d6fb0');}
  R(g,0,104,W,76,'#2f6e52');R(g,0,104,W,3,'#1f4e3a');
  // TV com futebol
  R(g,14,12,58,38,'#111');R(g,17,15,52,30,'#2f9a55');R(g,42,15,1,30,'#8fd08f');g.strokeStyle='#8fd08f';g.lineWidth=1;g.beginPath();g.arc(42.5,30,5,0,Math.PI*2);g.stroke();
  const bx=20+((t*20)%46);R(g,bx,28+Math.sin(t*5)*6,2,2,'#fff');R(g,30,24,2,3,'#e84a4a');R(g,52,33,2,3,'#f4f4f4');R(g,40,52,6,6,'#333');
  // balcão e prateleira
  R(g,236,44,84,4,'#6d4322');for(let i=0;i<9;i++)R(g,240+i*9,26,5,18,['#3fa35a','#8a4b12','#c2452f','#f2c230','#2d6fd1'][i%5]);
  R(g,236,96,84,84,'#8a5a2e');R(g,236,96,84,4,'#a8763f');
  R(g,244,56,62,18,'#c2452f');pxText(g,'BAR DA',264,59,'#fff1c2');pxText(g,'CACHACA',262,66,'#fff1c2');
  barFundo(g,t);
  // Seu Zé sentado do lado do Markin, do mesmo tamanho
  {const z={...BUDDY_DEFS.bar,prop:null};g.save();g.translate(100,140);g.scale(3.9,3.9);drawBuddy(g,0,0,z,{dir:'down',frame:0,t});g.restore();
   const ze=m.beers>=m.goal&&!m.result?'SEGURA, MARKIN!':null;if(ze)outlineText(g,ze,100,48,7,'#fff1c2');}
  // Markin sentado
  const px=160,py=104;
  drawMkTorso(g,136,104,48,34);
  // cabeça equilibrando (gira no pescoço)
  const st=faceState();if(Math.abs(m.th)>.5)st.e=Math.min(st.e,30);if(Math.abs(m.th)>.85||m.result==='lose')st.sleep=true;if(m.beers>=3)st.drunk=true;if(m.drink>0)st.mood='hype';
  buildFace(st,{});
  g.save();g.translate(px,py+2);g.rotate(m.th);g.imageSmoothingEnabled=false;R(g,-6,-6,12,8,'#d29a6c');g.drawImage(fbuf,-22,-56,44,55);g.restore();
  // mesa amarela de bar
  R(g,92,128,136,7,'#f2c230');R(g,92,134,136,2,'#c99a1a');R(g,100,136,4,44,'#c99a1a');R(g,216,136,4,44,'#c99a1a');
  // braços
  R(g,138,114,10,12,'#5a3a26');R(g,172,114,10,12,'#5a3a26');R(g,128,122,20,7,'#d29a6c');R(g,172,122,20,7,'#d29a6c');R(g,124,121,6,8,'#b8804f');R(g,190,121,6,8,'#b8804f'); // mangas, antebraços e mãos na mesa
  R(g,104,122,22,7,'#c98c64'); // braço do Seu Zé na mesa
  R(g,116,106,9,22,'#6b3a0e');R(g,118,98,5,8,'#6b3a0e');R(g,117,112,7,6,'#f2e6c8'); // a 600 do Seu Zé
  {const zy=128-Math.max(0,Math.sin(t*1.3))*4;R(g,128-4,zy-12,8,12,'rgba(230,240,250,.55)');R(g,128-3,zy-9,6,8,'#f2b63a');R(g,128-3,zy-10,6,2,'#fffbe8');}
  // garrafa 600
  R(g,206,100,10,28,'#6b3a0e');R(g,209,92,4,8,'#6b3a0e');R(g,208,90,6,2,'#d9d9d9');R(g,207,108,8,8,'#f2e6c8');R(g,209,110,4,3,'#c2452f');
  // copo americano (vai até a boca quando bebe)
  let gx=190,gy=128;if(m.drink>0){const k=Math.sin((1-m.drink/.7)*Math.PI);const mx=px+Math.sin(m.th)*22,my=py+2-Math.cos(m.th)*14;gx=gx+(mx-gx)*k;gy=gy+(my-gy)*k;}
  R(g,gx-4,gy-12,8,12,'rgba(230,240,250,.55)');if(m.glass>0||m.drink>0){R(g,gx-3,gy-(m.drink>0?6:10),6,m.drink>0?5:9,'#f2b63a');if(m.drink<=0)R(g,gx-3,gy-11,6,2,'#fffbe8');}
  R(g,gx-4,gy-12,1,12,'#dfe7ee');R(g,gx+3,gy-12,1,12,'#dfe7ee');
  for(const z of m.zz){g.globalAlpha=clamp(z.t,0,1);outlineText(g,'z',z.x,z.y,10,'#bfe0ff');g.globalAlpha=1;}
  // medidor de equilíbrio
  R(g,60,160,200,8,'#1a1030');R(g,60+100-35,160,70,8,'#3fa35a');R(g,60,160,22,8,'#c2452f');R(g,238,160,22,8,'#c2452f');
  const mk=60+100+clamp(m.th/1.15,-1,1)*100;R(g,mk-1,157,3,14,'#fff1c2');
  outlineText(g,'EQUILÍBRIO DA CABEÇA',W/2,155,7,'#f3ecd8');
  // HUD
  outlineText(g,`CERVEJAS ${m.beers}/${m.goal}`,W/2,14,11,'#ffe14f');
  if(m.hold>0)outlineText(g,`SEGURA! ${Math.ceil(m.hold)}`,W/2,58,16,'#ff8a6a');
  R(g,W/2-40,18,80,4,'#0a1020');const e=clamp(P.energy,0,100);R(g,W/2-40,18,80*e/100,4,e>60?'#8be08b':e>30?'#ffb347':'#ff6b5d');
  if(m.msgT>0)outlineText(g,m.msg,W/2,34,9,'#ffffff');
  else if(t<4&&!m.result)outlineText(g,isTouch?'setas seguram a cabeça · BEBE':'← → equilibra a cabeça · ESPAÇO bebe · ESC sai',W/2,178,7,'#fff1c2');
}
/* ---------- BAMBINA: 4 vermelhas x 4 amarelas contra o Tubarão, um de cada vez; cerveja a cada tacada do Markin ----------
   A primeira bola que a branca tocar define a cor de quem tacou. Branca na caçapa: quem tacou perde.
   Se a branca não tocar primeiro numa bola da tua cor, o adversário escolhe uma bola dele pra cair. */
const SN={x0:36,y0:44,x1:284,y1:158,r:4};
const POCKETS=[[36,44],[160,41],[284,44],[36,158],[160,161],[284,158]];
const BB_COL={r:'#d0202a',y:'#f2c230'};
const BB_NOME={r:'VERMELHAS',y:'AMARELAS'};
const bbOutra=t=>t==='r'?'y':'r';
function startSinuca(){
  mgEnter('sinuca');
  // posição simétrica: vermelhas na metade esquerda, amarelas espelhadas na direita, branca no centro
  const balls=[{x:160,y:101,vx:0,vy:0,c:'#f4f1e8',cue:true}];
  for(const [x,y] of [[113,53],[113,149],[45,96.5],[45,105.5]]){balls.push({x,y,vx:0,vy:0,c:BB_COL.r,team:'r'});balls.push({x:320-x,y,vx:0,vy:0,c:BB_COL.y,team:'y'});}
  mg={t:0,balls,ang:0,phase:'aim',pw:0,pwDir:1,turn:'me',myTeam:null,firstHit:null,mine:0,his:0,goal:4,shots:0,beers:0,pickI:0,pickHeld:0,msg:'BAMBINA contra o Tubarão! A primeira bola que tu acertar vira a tua cor.',msgT:3.8,result:null,done:0,scratch:false,potThis:[],drinkT:0,ai:null,fim:''};
}
// cor de cada jogador (null enquanto ninguém acertou nenhuma bola)
function bbCor(m,quem){return m.myTeam?(quem==='me'?m.myTeam:bbOutra(m.myTeam)):null;}
function bbConta(m){const eu=bbCor(m,'me'),ele=bbCor(m,'pc');m.mine=eu?m.balls.filter(b=>b.in&&b.team===eu).length:0;m.his=ele?m.balls.filter(b=>b.in&&b.team===ele).length:0;}
// bolas do Markin que ainda estão na mesa (pra ele escolher qual cai quando o Tubarão faz falta)
function bbMinhasNaMesa(m){const c=bbCor(m,'me');return m.balls.filter(b=>!b.in&&!b.cue&&b.team===c);}
function snWob(m){if(m.turn!=='me')return 0;const d=(m.beers*.12+(fx.drunk>0?.15:0))*.5;return Math.sin(m.t*1.3)*d*.15+Math.sin(m.t*2.6)*d*.05;}
function snPhysics(m,h){
  const B=m.balls.filter(b=>!b.in),r=SN.r;
  for(const b of B){b.x+=b.vx*h;b.y+=b.vy*h;const sp=Math.hypot(b.vx,b.vy);if(sp>0){const ns=Math.max(0,sp-(30+sp*.8)*h);b.vx*=ns/sp;b.vy*=ns/sp;}
    for(const [px,py] of POCKETS)if(Math.hypot(b.x-px,b.y-py)<11){b.in=true;b.vx=b.vy=0;if(b.cue)m.scratch=true;else m.potThis.push(b.team);beep(300,.12,'triangle',.07,120);break;}
    if(b.in)continue;
    if(b.x<SN.x0+r){b.x=SN.x0+r;b.vx=Math.abs(b.vx)*.8;}if(b.x>SN.x1-r){b.x=SN.x1-r;b.vx=-Math.abs(b.vx)*.8;}
    if(b.y<SN.y0+r){b.y=SN.y0+r;b.vy=Math.abs(b.vy)*.8;}if(b.y>SN.y1-r){b.y=SN.y1-r;b.vy=-Math.abs(b.vy)*.8;}}
  for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j];if(a.in||b.in)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<r*2&&d>0){if(!m.firstHit&&(a.cue||b.cue))m.firstHit=(a.cue?b:a).team; // primeira bola que a branca tocou
      const nx=dx/d,ny=dy/d,ov=(r*2-d)/2;a.x-=nx*ov;a.y-=ny*ov;b.x+=nx*ov;b.y+=ny*ov;
      const rv=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rv>0){const k=rv*.96;a.vx-=k*nx;a.vy-=k*ny;b.vx+=k*nx;b.vy+=k*ny;if(rv>20)beep(900,.03,'square',.03);}}}
}
function snShoot(m,cue,a,pw){const v=70+pw*320;cue.vx=Math.cos(a)*v;cue.vy=Math.sin(a)*v;m.phase='roll';m.potThis=[];m.scratch=false;m.firstHit=null;beep(160,.08,'triangle',.08);}
// o Tubarão escolhe a bola dele mais fácil (qualquer uma, se as cores ainda não foram definidas)... e erra 3 de cada 4
function snAiPlan(m,cue){
  const r=SN.r,cor=bbCor(m,'pc');let best=null;
  for(const b of m.balls){if(b.in||b.cue||(cor&&b.team!==cor))continue;
    for(const [px,py] of POCKETS){const dx=px-b.x,dy=py-b.y,dl=Math.hypot(dx,dy),ux=dx/dl,uy=dy/dl;
      const gx=b.x-ux*r*2,gy=b.y-uy*r*2,cx=gx-cue.x,cy=gy-cue.y,cl=Math.hypot(cx,cy)||1,corte=(cx*ux+cy*uy)/cl;
      if(corte<.3)continue;const sc=corte*2-dl/300-cl/400;if(!best||sc>best.sc)best={sc,ang:Math.atan2(cy,cx),d:dl+cl,b};}}
  if(!best){const b=m.balls.find(b=>!b.in&&!b.cue&&(!cor||b.team===cor));best={ang:b?Math.atan2(b.y-cue.y,b.x-cue.x):Math.PI,d:200};}
  // o Tubarão só erra a bola dele 10% das vezes, mas só encaçapa 25%: no resto bate na bola e ela não entra
  const r0=Math.random(),acerta=r0<.25,erraBola=r0>=.9;
  if(!acerta&&!erraBola){const alvo=best.b||m.balls.find(b=>!b.in&&!b.cue&&(!cor||b.team===cor));
    if(alvo){const dx=alvo.x-cue.x,dy=alvo.y-cue.y,dl=Math.hypot(dx,dy)||1,lado=Math.asin(Math.min(1,r*1.5/dl))*pick([-1,1])*rnd(.55,.9);
      return snAiConfere(m,cue,{ang:Math.atan2(dy,dx)+lado,pw:clamp(.3+dl/600+rnd(-.05,.12),.3,.8),t:0,from:m.ang});}}
  const fim={ang:best.ang+(acerta?rnd(-.008,.008):pick([-1,1])*rnd(.16,.42)),pw:clamp((.34+best.d/520)*(acerta?1:rnd(.8,1.25)),.3,1),t:0,from:m.ang};
  return erraBola?fim:snAiConfere(m,cue,fim);} // só 10% das vezes ele erra a bola dele
// confere se a tacada bate primeiro numa bola dele; se não, procura outro ângulo que bata
function snAiConfere(m,cue,plan){const cor=bbCor(m,'pc'),ok=a=>{const pr=snPredict(m,cue,a);return pr.b&&(!cor||pr.b.team===cor);};
  if(ok(plan.ang))return plan;
  for(const b of m.balls){if(b.in||b.cue||(cor&&b.team!==cor))continue;const base=Math.atan2(b.y-cue.y,b.x-cue.x),dl=Math.hypot(b.x-cue.x,b.y-cue.y)||1;
    for(const off of [0,.5,-.5,1,-1,1.4,-1.4]){const a=base+Math.asin(Math.min(1,off*SN.r/dl));if(ok(a))return{...plan,ang:a,pw:clamp(.3+dl/600+rnd(0,.15),.3,.85)};}}
  return plan;}
function snAiTick(m,dt,cue){
  if(!m.ai)m.ai=snAiPlan(m,cue);const ai=m.ai;ai.t+=dt;
  let dA=ai.ang-ai.from;dA=Math.atan2(Math.sin(dA),Math.cos(dA));m.ang=ai.from+dA*Math.min(1,ai.t/1.1);
  if(ai.t>1.1){m.phase='power';m.pw=Math.min(ai.pw,(ai.t-1.1)/.7*ai.pw);}
  if(ai.t>1.9){m.ang=ai.ang;snShoot(m,cue,ai.ang,ai.pw);m.ai=null;}}
function snEndShot(m,cue){
  for(const b of m.balls){b.vx=b.vy=0;}
  const eu=m.turn==='me',quem=eu?'me':'pc';
  if(eu){m.beers++;m.shots++;m.drinkT=1.1;sfx.gulp();}
  m.phase='aim';m.ai=null;m.pw=0;m.pwDir=1;m.msgT=2.4;
  // quem acertou a primeira bola da partida fica com aquela cor
  let definiu=false;
  if(!m.myTeam&&m.firstHit){m.myTeam=eu?m.firstHit:bbOutra(m.firstHit);definiu=true;}
  bbConta(m);
  // branca na caçapa: se foi junto com a última bola de quem tacou, ele perde
  if(m.scratch){const ownS=bbCor(m,quem);
    if(ownS&&m.potThis.includes(ownS)&&(eu?m.mine:m.his)>=m.goal){cue.in=true;m.done=2.8;m.msgT=2.8;
      if(eu){m.result='lose';m.msg='MATOU A BRANCA JUNTO COM A ÚLTIMA! Perdeu.';m.fim='Tu matou a branca junto com a tua última bola... perdeu a bambina pro Tubarão.';sfx.lose();}
      else{m.result='win';m.msg='O TUBARÃO MATOU A BRANCA JUNTO COM A ÚLTIMA! GANHOU!';sfx.win();}
      return;}
    // senão a branca volta pro meio, a vez passa e o adversário tira uma bola dele
    cue.in=false;cue.vx=cue.vy=0;cue.x=160;cue.y=101;
    for(let k=0;k<12&&m.balls.some(b=>!b.in&&!b.cue&&Math.hypot(b.x-cue.x,b.y-cue.y)<SN.r*2+1);k++)cue.x+=SN.r*2+1;
    m.turn=eu?'pc':'me';m.msgT=3;
    if(eu){const dele=ownS?m.balls.filter(b=>!b.in&&!b.cue&&b.team===bbCor(m,'pc')):[],b=pick(dele);
      if(b){b.in=true;beep(300,.12,'triangle',.07,120);}bbConta(m);
      m.msg='MATOU A BRANCA! Ela volta pro meio'+(b?' e o Tubarão tirou uma bola dele.':'. Vez do Tubarão.');
      if(m.his>=m.goal){m.result='lose';m.done=2.6;m.msg='Matou a branca e o Tubarão completou as quatro...';m.fim='Tu matou a branca e o Tubarão tirou a última bola dele... perdeu a bambina.';sfx.lose();}
      return;}
    const minhas=ownS?bbMinhasNaMesa(m):[];
    if(minhas.length){m.phase='pick';m.pickI=0;m.pickHeld=1;m.msg='O TUBARÃO MATOU A BRANCA! Escolhe uma bola tua pra cair.';m.msgT=3.2;}
    else m.msg='O Tubarão matou a branca! Ela volta pro meio. Tua vez.';
    return;}
  const own=bbCor(m,quem);
  // falta com a última bola: encaçapou a última batendo primeiro na do adversário = perde
  if(own&&m.firstHit&&m.firstHit!==own&&m.potThis.includes(own)&&(eu?m.mine:m.his)>=m.goal){m.done=2.8;m.msgT=2.8;
    if(eu){m.result='lose';m.msg='FALTA! Derrubou a última batendo na bola dele. Perdeu.';m.fim='Tu derrubou a tua última bola batendo primeiro na do Tubarão. Falta: perdeu a bambina.';sfx.lose();}
    else{m.result='win';m.msg='O TUBARÃO FEZ FALTA NA ÚLTIMA! GANHOU A BAMBINA!';sfx.win();}
    return;}
  if(m.mine>=m.goal&&(eu||m.his<m.goal)){m.result='win';m.done=2.4;m.msg=`AS QUATRO ${BB_NOME[bbCor(m,'me')]}! GANHOU A BAMBINA!`;m.msgT=2.4;sfx.win();return;}
  if(m.his>=m.goal){m.result='lose';m.done=2.4;m.msg=`O Tubarão matou as quatro ${BB_NOME[bbCor(m,'pc')].toLowerCase()}...`;m.fim=`O Tubarão encaçapou as quatro ${BB_NOME[bbCor(m,'pc')].toLowerCase()} primeiro... perdeu a bambina.`;m.msgT=2.4;sfx.lose();return;}
  // falta: a branca não tocou primeiro numa bola da cor de quem tacou (ou não tocou em nada)
  if(!own||m.firstHit!==own){
    m.turn=eu?'pc':'me';
    if(!own){m.msg=(eu?'Não acertou nenhuma bola! Vez do Tubarão.':'O Tubarão não acertou nenhuma bola! Tua vez.');return;}
    if(eu){ // o Tubarão escolhe uma amarela (ou vermelha) dele pra cair
      const dele=m.balls.filter(b=>!b.in&&!b.cue&&b.team===bbCor(m,'pc'));const b=pick(dele);
      if(b){b.in=true;beep(300,.12,'triangle',.07,120);}bbConta(m);
      m.msg=(m.firstHit?(m.potThis.includes(own)?'Falta! Tua bola caiu, mas bateu primeiro na dele.':'Falta! Bateu primeiro na bola dele.'):'Falta! Não acertou nenhuma bola.')+' Ele tirou uma.';m.msgT=3;
      if(m.his>=m.goal){m.result='lose';m.done=2.6;m.msg='Com a tua falta, o Tubarão completou as quatro...';m.fim='Uma falta tua deu a última bola pro Tubarão... perdeu a bambina.';sfx.lose();}
      return;}
    // falta do Tubarão: o Markin escolhe uma bola dele pra cair
    const minhas=bbMinhasNaMesa(m);
    if(minhas.length){m.phase='pick';m.pickI=0;m.pickHeld=1;m.msg='FALTA DO TUBARÃO! Escolhe uma bola tua pra cair.';m.msgT=3.2;}
    else m.msg='Falta do Tubarão! Tua vez.';
    return;}
  const minhas=m.potThis.filter(t=>t===own).length,dele=m.potThis.length-minhas,segue=minhas>0;
  if(eu)m.msg=(segue?(minhas>1?`${minhas} de uma vez! Joga de novo.`:'Encaçapou! Joga de novo.'):dele?'Encaçapou a bola dele... vez do Tubarão.':'Não encaçapou. Gole de raiva. Vez do Tubarão.');
  else m.msg=(segue?'O Tubarão acertou... ele joga de novo.':dele?'O Tubarão encaçapou uma bola TUA! Valeu, Tubarão. Tua vez.':pick(['O Tubarão errou feio! Tua vez.','Tubarão: "Essa mesa tá torta!" Tua vez.','Errou! Tua vez, Markin.','Tubarão: "Foi o giz!" Tua vez.']));
  if(!segue)m.turn=eu?'pc':'me';
  if(definiu){m.msg=eu?`Tu é das ${BB_NOME[m.myTeam]}! O Tubarão fica com as outras.`:`O Tubarão é das ${BB_NOME[bbOutra(m.myTeam)]}. Tu é das ${BB_NOME[m.myTeam]}.`;m.msgT=3;}
  else if(m.turn==='me'&&eu&&m.beers===3){m.msg='Tá batendo... o taco tá tremendo.';m.msgT=2;}
}
// falta do Tubarão: o Markin escolhe (← → e ESPAÇO) qual bola dele cai
function snPick(m,inp){
  const minhas=bbMinhasNaMesa(m);if(!minhas.length){m.phase='aim';return;}
  m.pickI=((m.pickI%minhas.length)+minhas.length)%minhas.length;
  const dir=inp.ix>.5?1:inp.ix<-.5?-1:0;
  if(dir&&!m.pickHeld){m.pickI=(m.pickI+dir+minhas.length)%minhas.length;beep(700,.04,'square',.03);}
  m.pickHeld=dir!==0;
  if(inp.act||m.pickTap){m.pickTap=false;const b=minhas[m.pickI];b.in=true;beep(300,.12,'triangle',.07,120);bbConta(m);m.phase='aim';
    if(m.mine>=m.goal){m.result='win';m.done=2.4;m.msg=`AS QUATRO ${BB_NOME[bbCor(m,'me')]}! GANHOU A BAMBINA!`;m.msgT=2.4;sfx.win();return;}
    m.msg='Caiu! Agora é tua vez.';m.msgT=1.8;}
}
function updSinuca(dt){
  const m=mg;m.t+=dt;m.msgT-=dt;m.drinkT=Math.max(0,m.drinkT-dt);
  const inp=mgInput();
  if(m.result){m.done-=dt;if(m.done<=0){
    if(m.result==='win'){if(m.beers>=3)librasPend=true;markTask('sinuca');mgExit(`Ganhou a bambina do Tubarão com ${m.beers} cervejas! +6h acordado.`,'good',10,360);}
    else mgLost(m.fim||'Perdeu a bambina pro Tubarão.');}return;}
  tickFx(dt);
  const cue=m.balls.find(b=>b.cue);
  if(m.phase==='roll'){
    for(let s=0;s<4;s++)snPhysics(m,dt/4);
    if(m.balls.every(b=>b.in||Math.hypot(b.vx,b.vy)<2))snEndShot(m,cue);}
  else if(m.phase==='pick')snPick(m,inp);
  else if(m.turn==='pc')snAiTick(m,dt,cue);
  else if(m.phase==='aim'){m.ang+=inp.ix*1.5*dt;if(inp.act){m.phase='power';m.pw=0;m.pwDir=1;}}
  else if(m.phase==='power'){
    const spd=(.75+m.beers*.15)*.5;m.pw+=m.pwDir*spd*dt;if(m.pw>1){m.pw=1;m.pwDir=-1;}if(m.pw<0){m.pw=0;m.pwDir=1;}
    m.ang+=inp.ix*.8*dt;
    if(inp.act)snShoot(m,cue,m.ang+snWob(m),m.pw);
  }
}
// raio de mira: até onde a branca bate e pra onde a bola colorida vai depois
function snPredict(m,cue,a){
  const r=SN.r,ca=Math.cos(a),sa=Math.sin(a);let best=null;
  for(const b of m.balls){if(b.in||b.cue)continue;const ox=b.x-cue.x,oy=b.y-cue.y,pr=ox*ca+oy*sa;if(pr<=0)continue;
    const pe=Math.abs(-ox*sa+oy*ca);if(pe>=r*2)continue;const tt=pr-Math.sqrt(r*r*4-pe*pe);if(!best||tt<best.t)best={t:tt,b};}
  const tw=Math.min(ca>0?(SN.x1-r-cue.x)/ca:ca<0?(SN.x0+r-cue.x)/ca:1e9,sa>0?(SN.y1-r-cue.y)/sa:sa<0?(SN.y0+r-cue.y)/sa:1e9);
  if(best&&best.t<tw){const gx=cue.x+ca*best.t,gy=cue.y+sa*best.t,nx=(best.b.x-gx)/(r*2),ny=(best.b.y-gy)/(r*2);return{gx,gy,b:best.b,nx,ny};}
  return{gx:cue.x+ca*tw,gy:cue.y+sa*tw,wall:true};}
function renderSinuca(){
  const g=ctx,m=mg,t=m.t;
  R(g,0,0,W,H,'#3a2418');for(let x=0;x<W;x+=20)R(g,x,0,1,H,'#2e1c12');
  R(g,236,6,70,16,'#1f6a3a');pxText(g,'BAMBINA',257,11,'#ffe14f');
  const lg=g.createRadialGradient(160,100,10,160,100,170);lg.addColorStop(0,'rgba(255,230,160,.18)');lg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=lg;g.fillRect(0,0,W,H);
  R(g,24,32,272,138,'#6d4322');R(g,26,34,268,134,'#8a5a2e');R(g,30,38,260,126,'#1f6a3a');R(g,SN.x0,SN.y0,SN.x1-SN.x0,SN.y1-SN.y0,'#2f8a4a');
  for(let i=1;i<4;i++){R(g,36+i*62,35,2,2,'#f4f1e8');R(g,36+i*62,166,2,2,'#f4f1e8');}
  for(const [px,py] of POCKETS){g.fillStyle='#0a0a0a';g.beginPath();
    if(px===160){const em=py<100;g.arc(px,em?SN.y0:SN.y1,9,em?Math.PI:0,em?Math.PI*2:Math.PI);g.closePath();} // caçapa do meio: meio círculo com a reta na borda do pano
    else g.arc(px,py,9,0,Math.PI*2);g.fill();}
  const cue=m.balls.find(b=>b.cue);
  // raio de direcionamento (antes das bolas, por baixo delas)
  if(m.phase!=='roll'&&m.phase!=='pick'&&!m.result&&!cue.in){
    const a=m.ang+snWob(m),ca=Math.cos(a),sa=Math.sin(a),pr=snPredict(m,cue,a),len=Math.hypot(pr.gx-cue.x,pr.gy-cue.y);
    g.fillStyle='rgba(255,255,255,.7)';for(let d=7;d<len;d+=4)g.fillRect(cue.x+ca*d-.5,cue.y+sa*d-.5,1.5,1.5);
    if(pr.b){g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1;g.beginPath();g.arc(pr.gx,pr.gy,SN.r,0,Math.PI*2);g.stroke();
      // pra onde a bola colorida vai
      g.strokeStyle=pr.b.c;g.lineWidth=2;g.beginPath();g.moveTo(pr.b.x,pr.b.y);g.lineTo(pr.b.x+pr.nx*46,pr.b.y+pr.ny*46);g.stroke();
      const hx=pr.b.x+pr.nx*46,hy=pr.b.y+pr.ny*46,an=Math.atan2(pr.ny,pr.nx);g.fillStyle=pr.b.c;g.beginPath();g.moveTo(hx+Math.cos(an)*4,hy+Math.sin(an)*4);g.lineTo(hx+Math.cos(an+2.5)*4,hy+Math.sin(an+2.5)*4);g.lineTo(hx+Math.cos(an-2.5)*4,hy+Math.sin(an-2.5)*4);g.fill();
      // e a branca desvia pro lado
      // mirando na bola do Tubarão: um X em cima dela
      const minha=bbCor(m,'me');if(m.turn==='me'&&minha&&pr.b.team!==minha){g.strokeStyle='#ff3b3b';g.lineWidth=2;g.beginPath();g.moveTo(pr.b.x-5,pr.b.y-5);g.lineTo(pr.b.x+5,pr.b.y+5);g.moveTo(pr.b.x+5,pr.b.y-5);g.lineTo(pr.b.x-5,pr.b.y+5);g.stroke();}
      const dot=ca*pr.nx+sa*pr.ny,tx=ca-dot*pr.nx,ty=sa-dot*pr.ny,tl=Math.hypot(tx,ty);if(tl>.05){g.fillStyle='rgba(255,255,255,.35)';for(let d=4;d<20;d+=4)g.fillRect(pr.gx+tx/tl*d-.5,pr.gy+ty/tl*d-.5,1.5,1.5);}}
  }
  for(const b of m.balls){if(b.in)continue;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.arc(b.x+1,b.y+1.5,SN.r,0,Math.PI*2);g.fill();
    g.fillStyle=b.c;g.beginPath();g.arc(b.x,b.y,SN.r,0,Math.PI*2);g.fill();R(g,b.x-2,b.y-2,1,1,'#ffffff');}
  if(m.phase==='pick'&&!m.result){const minhas=bbMinhasNaMesa(m),b=minhas[m.pickI%Math.max(1,minhas.length)];
    if(b){const pul=SN.r+3+Math.abs(Math.sin(t*6))*2;g.strokeStyle='#ffffff';g.lineWidth=1.5;g.beginPath();g.arc(b.x,b.y,pul,0,Math.PI*2);g.stroke();outlineText(g,'ESSA?',b.x,b.y-11,7,'#ffffff');}}
  if(m.phase!=='roll'&&m.phase!=='pick'&&!m.result&&!cue.in){
    const a=m.ang+snWob(m),ca=Math.cos(a),sa=Math.sin(a);
    const pull=6+(m.phase==='power'?m.pw*16:0);g.strokeStyle=m.turn==='pc'?'#8a6a40':'#c9a060';g.lineWidth=2.5;g.beginPath();g.moveTo(cue.x-ca*pull,cue.y-sa*pull);g.lineTo(cue.x-ca*(pull+78),cue.y-sa*(pull+78));g.stroke();
    g.strokeStyle='#f4f1e8';g.lineWidth=2.5;g.beginPath();g.moveTo(cue.x-ca*pull,cue.y-sa*pull);g.lineTo(cue.x-ca*(pull+4),cue.y-sa*(pull+4));g.stroke();
  }
  if(m.phase==='power'&&m.turn==='me'){R(g,302,54,10,96,'#1a1030');const hp=96*m.pw;R(g,302,150-hp,10,hp,m.pw>.75?'#ff6b5d':m.pw>.4?'#ffb347':'#8be08b');outlineText(g,'FORÇA',307,50,6,'#f3ecd8');}
  // placar
  R(g,4,3,96,28,'rgba(7,11,20,.72)');
  const st=faceState();if(m.beers>=3)st.drunk=true;if(m.drinkT>0)st.mood='hype';buildFace(st,{});g.imageSmoothingEnabled=false;g.drawImage(fbuf,6,4,21,26);
  // placar: bolinhas cheias = encaçapadas; contorno na cor de cada um (cinza enquanto a cor não foi definida)
  const placar=(x0,cor,n)=>{for(let i=0;i<4;i++){const cx=x0+i*9;g.fillStyle=i<n&&cor?BB_COL[cor]:'#2a2a30';g.beginPath();g.arc(cx,23,3.2,0,Math.PI*2);g.fill();g.strokeStyle=cor?BB_COL[cor]:'#6a6a74';g.lineWidth=1;g.beginPath();g.arc(cx,23,3.4,0,Math.PI*2);g.stroke();}};
  outlineText(g,'MARKIN',30,12,7,m.turn==='me'?'#ffe14f':'#9fb0cc','left');placar(33,bbCor(m,'me'),m.mine);
  R(g,W-100,3,96,28,'rgba(7,11,20,.72)');
  outlineText(g,'TUBARÃO',W-8,12,7,m.turn==='pc'?'#ffe14f':'#9fb0cc','right');placar(W-38,bbCor(m,'pc'),m.his);
  outlineText(g,m.phase==='pick'?'ESCOLHE UMA BOLA TUA':m.turn==='me'?'TUA VEZ':'VEZ DO TUBARÃO',W/2,14,9,m.turn==='me'?'#8be08b':'#ffb347');
  outlineText(g,`CERVEJAS ${m.beers}`,W/2,25,7,'#f2b63a');
  if(m.drinkT>0){R(g,188,16,6,9,'rgba(230,240,250,.6)');R(g,189,18,4,6,'#f2b63a');}
  if(m.msgT>0)outlineText(g,m.msg,W/2,40,8,'#ffffff');
  else if(m.phase==='pick'&&!m.result)outlineText(g,isTouch?'toque na bola que vai cair (ou ◀ ▶ e ESCOLHE)':'← → troca a bola · ESPAÇO derruba',W/2,178,7,'#fff1c2');
  else if(t<5&&!m.result)outlineText(g,isTouch?'◀ ▶ mira · FORÇA e depois TACAR':'← → mira · ESPAÇO: força · ESPAÇO de novo: tacada · ESC sai',W/2,178,7,'#fff1c2');
}

/* ---------- TÁXI da mãe: roda pelas ruas e, se te vê, vem te buscar ---------- */
let taxis=[],taxiT=20;
const TX_H=[...HROADS,ORLA_Y];
function spawnTaxi(){
  for(let i=0;i<40;i++){
    const t=Math.random()<.6?{x:rnd(4,MW-4)*T,y:(pick(TX_H)+1)*T,dir:pick([[1,0],[-1,0]])}:{x:(pick(VROADS)+1)*T,y:rnd(4,40)*T,dir:pick([[0,1],[0,-1]])};
    if(dist(t,P)>280){taxis.push({...t,h:20,chase:false,node:''});return;}}
}
function updTaxis(dt){
  const want=day>=2?1:0;
  if(taxis.length<want){taxiT-=dt;if(taxiT<=0){taxiT=rnd(15,25);spawnTaxi();}}
  for(const c of taxis){
    const d=dist(c,P),sees=d<170&&!incog()&&P.mode!=='cut'&&tregua<=0&&!grab;
    if(c.stuck>0){c.stuck-=dt;c.chase=false;continue;} // grudado na teia
    if(sees&&!c.chase){bubble(c,pick(['Táxi! Tua mãe que chamou!','Markin? Corrida já tá paga!','Bora pra casa, parceiro!']),2.2,'mom',16);beep(440,.25,'square',.05);beep(370,.3,'square',.05,0,.28);}
    c.chase=sees;
    const sp=(c.chase?86:55)*DF().ini*dt;
    // cruzamentos: decide pra onde virar
    const nx=VROADS.map(v=>(v+1)*T).find(x=>Math.abs(c.x-x)<sp+.5),ny=TX_H.map(r=>(r+1)*T).find(y=>Math.abs(c.y-y)<sp+.5);
    if(nx!==undefined&&ny!==undefined){const key=nx+','+ny;if(c.node!==key){c.node=key;c.x=nx;c.y=ny;
      const opts=[[1,0],[-1,0],[0,-1],[0,1]].filter(o=>!(o[0]===-c.dir[0]&&o[1]===-c.dir[1])&&!(o[1]===1&&ny>=(ORLA_Y+1)*T)&&!(o[1]===-1&&ny<=T*2));
      if(c.chase){const vx=P.x-c.x,vy=P.y-c.y;opts.sort((a,b)=>(b[0]*vx+b[1]*vy)-(a[0]*vx+a[1]*vy));c.dir=opts[0];}
      else if(Math.random()<.5)c.dir=pick(opts);}}
    else c.node='';
    c.x+=c.dir[0]*sp;c.y+=c.dir[1]*sp;
    if(c.x<8||c.x>MW*T-8||c.y<8||c.y>(ORLA_Y+1)*T+1){c.dir=[-c.dir[0],-c.dir[1]];c.x=clamp(c.x,8,MW*T-8);c.y=clamp(c.y,8,(ORLA_Y+1)*T);}
    if(d<16&&P.mode!=='cut'&&state==='play'&&tregua<=0&&!grab){
      interruptRest();lose(6);sfx.horn();c.dead=true;taxiT=25;
      // o táxi larga ele na porta e a mãe já segura pelo braço
      teleportTowardHome(.5);P.dir='up';flash=.5;mom.stun=0;mom.x=P.x+9;mom.y=P.y;if(!grab)startGrab('mae',mom);
      toast('O táxi te largou no meio do caminho e a mãe te pegou pelo braço! Toque rápido pra se soltar!','bad',3.6);
    }
  }
  taxis=taxis.filter(c=>!c.dead);
}
function drawTaxi(g,c,x,y){
  x=Math.round(x);y=Math.round(y);const hz=c.dir[0]!==0,w=hz?20:11,h=hz?11:20;
  R(g,x-w/2+1,y-h/2+2,w,h,'rgba(0,0,0,.3)');R(g,x-w/2,y-h/2,w,h,'#f2c230');
  if(hz){R(g,x-w/2,y-1,w,2,'#2d6fd1');R(g,x+(c.dir[0]>0?4:-8),y-4,4,8,'#1a2a3a');R(g,x+(c.dir[0]>0?-7:3),y-4,4,8,'#1a2a3a');R(g,x-2,y-3,4,6,'#f4f1e8');
    R(g,x+(c.dir[0]>0?w/2-1:-w/2),y-4,1,2,'#fff7c2');R(g,x+(c.dir[0]>0?w/2-1:-w/2),y+2,1,2,'#fff7c2');}
  else{R(g,x-1,y-h/2,2,h,'#2d6fd1');R(g,x-4,y+(c.dir[1]>0?4:-8),8,4,'#1a2a3a');R(g,x-4,y+(c.dir[1]>0?-7:3),8,4,'#1a2a3a');R(g,x-3,y-2,6,4,'#f4f1e8');
    R(g,x-4,y+(c.dir[1]>0?h/2-1:-h/2),2,1,'#fff7c2');R(g,x+2,y+(c.dir[1]>0?h/2-1:-h/2),2,1,'#fff7c2');}
  if(c.chase&&Math.floor(performance.now()/200)%2)R(g,x-1,y-h/2-3,2,2,'#ff6b5d');
}
/* ---------- FESTA ALTERNATIVA NO CENTRO: conquistar a gatinha em 5 rodadas ---------- */
const FESTA={x:75*T+8,y:7*T+12,h:34}; // porta do Circo Voador, na Lapa
let festaDay=0;
// ok = resposta certa · fz = friendzone · esp = espanta
// 3 conversas diferentes: cada vez que ele entra na festa abre a próxima
const FESTA_SETS=[
 {hair:'#b58cff',root:'#6a4a9a',win:'Me passa teu Insta. E aparece no Bloco Secreto comigo, hein?',rounds:[
  {q:'Nunca te vi aqui. Veio pela banda ou pela cerveja barata?',
   ok:'Pela banda. A cerveja barata é só o patrocinador oficial.',
   fz:'Vim com uns amigos, tô só de boa mesmo, relaxa.',
   esp:'Vim porque te vi lá da rua e te segui até aqui.',
   r:'Hahaha, justo. Pelo menos é sincero.'},
  {q:'Tu tá com cara de quem não dorme há dias...',
   ok:'15 dias no mar e mais uns tantos em terra. Dormir é pra quem não tem história.',
   fz:'Pois é... tô precisando de alguém pra desabafar. Posso te contar tudo?',
   esp:'É o efeito que tu causa. Perdi o sono desde que entrei.',
   r:'Marinheiro? Agora fiquei curiosa.'},
  {q:'E aí, que música tu curte?',
   ok:'De tudo um pouco. Se tocar um funk antigo eu provo que sei dançar.',
   fz:'Ah, sei lá, o que tocar tá bom. Tu escolhe, tu que manda.',
   esp:'Só sertanejo. Isso aqui pra mim é barulho de obra.',
   r:'Vou cobrar esse funk, hein.'},
  {q:'Tu mora aqui perto?',
   ok:'Moro, mas tô fugindo de casa. Longa história, te conto no caminho pro bar.',
   fz:'Moro com a minha mãe. Ela é tudo pra mim, a gente faz tudo junto.',
   esp:'Não. Mas posso morar contigo, né?',
   r:'Fugindo de casa? Tô gostando dessa história.'},
  {q:'Vou pegar uma cerveja. Quer vir?',
   ok:'Bora. E a próxima é por minha conta.',
   fz:'Pode ir, eu seguro teu lugar aqui e cuido da tua bolsa.',
   esp:'Só se tu me passar teu número, teu Insta e teu endereço antes.',
   r:'Gostei de tu, Markin.'}]},
 {hair:'#4fd8a0',root:'#1f6a4a',win:'Bora pros Arcos então. Tu me deve um nascer do sol.',rounds:[
  {q:'Tu tá dançando ou tá fugindo de alguém?',
   ok:'Os dois. Tô fugindo da minha mãe, mas dançando pra disfarçar.',
   fz:'Só tô aqui encostado, não sei dançar... mas tu dança super bem!',
   esp:'Tô fugindo da polícia. Brincadeira. Ou não.',
   r:'Hahaha, que tipo de fugitivo foge dançando?'},
  {q:'Tu tem cara de quem trabalha com o quê?',
   ok:'Embarcado. 15 dias no mar, sem wi-fi e sem festa. Tô compensando.',
   fz:'Ah, nada demais... sou meio sem graça, pode falar.',
   esp:'Adivinha. Se errar, tu me paga uma cerveja. Se acertar, paga duas.',
   r:'No mar?! Então tu é tipo pirata.'},
  {q:'Qual foi a coisa mais doida que tu já fez?',
   ok:'Tô fazendo agora: dias sem dormir só pra não voltar pra casa.',
   fz:'Nossa, eu sou bem tranquilo... uma vez comi pizza de madrugada.',
   esp:'Não posso contar aqui. Tem testemunha.',
   r:'Isso é loucura ou compromisso? Respeito.'},
  {q:'Tu acredita em signo?',
   ok:'Não, mas se tu for de Leão eu começo a acreditar hoje.',
   fz:'Acredito, e o meu diz que eu sou ótimo amigo e ótimo ouvinte.',
   esp:'Já descobri teu signo, teu ascendente e onde tu estuda.',
   r:'Leão não, mas quase. Tu tá indo bem.'},
  {q:'O samba tá acabando. E agora?',
   ok:'Bora achar um podrão e ver o sol nascer nos Arcos.',
   fz:'Agora cada um pra sua casa, né? Me avisa quando chegar!',
   esp:'Agora tu vem comigo conhecer minha mãe.',
   r:'Podrão e nascer do sol? Fechou.'}]},
 {hair:'#ff7eb6',root:'#9a3a6a',win:'Salva aí meu número: Gatinha. E não some, hein.',rounds:[
  {q:'Essa fila do banheiro não anda. Tu tá esperando também?',
   ok:'Tava, mas a conversa tá melhor que o banheiro.',
   fz:'Pode passar na minha frente, eu espero, não tem problema nenhum.',
   esp:'Não, tô aqui só te olhando desde que tu chegou.',
   r:'Hahaha, rápido você, hein.'},
  {q:'Gostei da tua corrente. É ouro?',
   ok:'É banhada. Igual meu papo: brilha, mas é honesto.',
   fz:'Foi presente da minha mãe. Ela escolhe todas as minhas roupas.',
   esp:'Se quiser, te dou. Só me passa teu CPF em troca.',
   r:'Brilha mas é honesto... vou anotar essa.'},
  {q:'Tu vem sempre no Circo?',
   ok:'Quando tô em terra, sim. Hoje foi a melhor noite pra ter vindo.',
   fz:'Não, meus amigos me arrastaram. Eu preferia tá em casa vendo série.',
   esp:'Venho em todas que tu vem. Tu nunca reparou?',
   r:'Melhor noite, é? Vamos ver.'},
  {q:'Tô morrendo de fome.',
   ok:'Tem um cachorro-quente ali na esquina. Eu pago, tu escolhe o molho.',
   fz:'Quer que eu vá buscar algo pra tu? Eu vou e volto correndo.',
   esp:'Tenho um biscoito amassado no bolso desde terça. Quer?',
   r:'Molho de tudo. Tu não sabe onde se meteu.'},
  {q:'Se eu te der meu número, tu liga ou manda áudio de 5 minutos?',
   ok:'Mando mensagem amanhã cedo. Se eu tiver acordado. E eu vou tá.',
   fz:'Mando áudio de 5 minutos contando meu dia todo, bem detalhado.',
   esp:'Ligo agora mesmo pra ver se é teu número mesmo.',
   r:'Então tá. Anota aí.'}]}
];
let festaNext=Math.floor(Math.random()*3);
const FESTA_END={
  fz:['ENTROU NA FRIENDZONE','Ai, tu é muito fofo... parece meu primo! Vamo ser amigos?'],
  esp:['ESPANTOU A MENINA','Vou ali no banheiro e já volto... (ela não voltou)'],
  win:['CONQUISTOU A GATINHA!','']
};
function startFesta(){
  mgEnter('festa');
  const set={...(day<3?FESTA_SETS[1+Math.floor(Math.random()*2)]:FESTA_SETS[Math.floor(Math.random()*FESTA_SETS.length)]),hair:FESTA_SETS[0].hair,root:FESTA_SETS[0].root}; // conversa sorteada, gatinha sempre a de cabelo roxo
  mg={t:0,set,round:0,hearts:0,phase:'ask',timer:0,sel:0,opts:[],said:'',fala:set.rounds[0].q,gatMood:'neutral',result:null,title:'',beat:0};
  festaAsk();$('festa').hidden=false;
}
function festaAsk(){
  const m=mg,R0=m.set.rounds[m.round];
  m.opts=[{k:'ok',t:R0.ok},{k:'fz',t:R0.fz},{k:'esp',t:R0.esp}].sort(()=>Math.random()-.5);
  m.phase='ask';m.sel=0;m.fala=R0.q;m.said='';m.gatMood=m.round?'smile':'neutral';festaUI();
}
function festaUI(){
  const m=mg;$('fname').textContent=m.phase==='said'?'MARKIN':'GATINHA';
  $('fline').textContent=m.phase==='said'?m.said:m.fala;
  const box=$('fopts');box.innerHTML='';
  if(m.phase!=='ask')return;
  m.opts.forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.className='fopt'+(i===m.sel&&!isTouch?' on':'');
    b.innerHTML=`<kbd>${i+1}</kbd> ${o.t}`;b.addEventListener('click',()=>festaChoose(i));box.appendChild(b);});
}
function festaChoose(i){
  const m=mg;if(!m||state!=='festa'||m.phase!=='ask')return;initAudio();
  const o=m.opts[i];m.said=o.t;m.pick=o.k;m.phase='said';m.timer=1.6;beep(700,.06,'square',.04);festaUI();
}
function festaKey(k){
  const m=mg;if(!m||m.phase!=='ask')return;
  if(k==='Digit1'||k==='Numpad1')festaChoose(0);else if(k==='Digit2'||k==='Numpad2')festaChoose(1);else if(k==='Digit3'||k==='Numpad3')festaChoose(2);
  else if(k==='ArrowUp'||k==='KeyW'){m.sel=(m.sel+2)%3;festaUI();}else if(k==='ArrowDown'||k==='KeyS'){m.sel=(m.sel+1)%3;festaUI();}
}
function updFesta(dt){
  const m=mg;m.t+=dt;m.beat+=dt;
  if(m.phase==='ask'){if(takeAction())festaChoose(m.sel);jumpQ=false;laneQ=0;return;}
  actionQ=false;m.timer-=dt;if(m.timer>0)return;
  if(m.phase==='said'){
    if(m.pick==='ok'){m.hearts++;m.fala=m.set.rounds[m.round].r;m.gatMood='smile';m.phase='react';m.timer=2;beep(880,.1,'sine',.05);beep(1320,.12,'sine',.05,0,.1);
      if(m.hearts>=5){m.result='win';m.title=FESTA_END.win[0];m.fala=m.set.win;m.gatMood='love';m.phase='end';m.timer=3.4;sfx.win();}}
    else{const e=FESTA_END[m.pick];m.result=m.pick;m.title=e[0];m.fala=e[1];m.gatMood=m.pick==='fz'?'awkward':'scared';m.phase='end';m.timer=3.4;sfx.lose();}
    festaUI();return;}
  if(m.phase==='react'){m.round++;festaAsk();return;}
  if(m.phase==='end'){
    $('festa').hidden=true;
    if(m.result==='win'){const first=festaDay!==day;festaDay=day;if(!tasksDone.festa)gatHair=m.set.hair;markTask('festa');mgExit('Conquistou a gatinha no Circo Voador! +6h acordado.','good',first?25:8,360);}
    else if(m.result==='fz')mgLost('Entrou na friendzone... a gatinha te chamou de primo.');
    else mgLost('Espantou a menina. Ela foi no banheiro e nunca mais voltou.');
  }
}
function drawGatinha(g,x,y,mood,set,corpo){ // retrato pixel 30x38 em escala 2 (com corpo: 30x53)
  const P2=(u,v,w,h,c)=>R(g,x+u*2,y+v*2,w*2,h*2,c);
  const hair=set?set.hair:'#b58cff',root=set?set.root:'#6a4a9a',sk='#e8b894',skD='#d19c78';
  P2(3,2,24,28,hair);P2(4,2,22,3,root);
  P2(7,8,16,23,sk);P2(9,31,12,2,sk);P2(11,33,8,4,skD);P2(11,33,8,1,'#111');
  P2(4,36,22,3,'#141018');P2(9,36,12,1,'#2a2030');
  P2(6,5,18,6,hair);for(const u of [7,10,13,16,19,22])P2(u,11,2,1,hair);P2(4,8,4,20,hair);P2(22,8,4,20,hair);
  P2(5,24,1,2,'#e3b341');P2(24,24,1,2,'#e3b341');
  // olhos com delineado
  const eyes=(sq)=>{for(const [u,w] of [[9,4],[17,4]]){P2(u,16,w,sq?1:2,'#fbf4e8');P2(u+1,16,2,sq?1:2,'#3a2a5a');P2(u-1,15,w+2,1,'#111');}P2(8,14,1,1,'#111');P2(21,14,1,1,'#111');};
  P2(9,13,4,1,'#4a3a3a');P2(17,13,4,1,'#4a3a3a');
  P2(14,19,2,4,skD);P2(16,22,1,1,'#e3b341');
  if(mood==='smile'||mood==='love'){eyes(mood==='love');P2(12,25,6,1,'#7a1f2a');P2(11,24,1,1,'#7a1f2a');P2(18,24,1,1,'#7a1f2a');P2(13,26,4,1,'#b8323a');P2(8,22,3,1,'#f08aa0');P2(19,22,3,1,'#f08aa0');}
  else if(mood==='awkward'){eyes(false);P2(12,25,5,1,'#7a1f2a');P2(17,24,1,1,'#7a1f2a');P2(9,13,4,1,'#4a3a3a');}
  else if(mood==='scared'){P2(9,15,4,3,'#fbf4e8');P2(17,15,4,3,'#fbf4e8');P2(10,16,2,1,'#3a2a5a');P2(18,16,2,1,'#3a2a5a');P2(9,12,4,1,'#4a3a3a');P2(17,12,4,1,'#4a3a3a');P2(13,24,4,3,'#7a1f2a');P2(14,25,2,1,'#2a0a10');}
  else{eyes(false);P2(12,25,6,1,'#9a3040');}
  if(mood==='love')for(const [u,v] of [[1,4],[27,8]]){P2(u,v,1,1,'#ff5a8a');P2(u+2,v,1,1,'#ff5a8a');P2(u,v+1,3,1,'#ff5a8a');P2(u+1,v+2,1,1,'#ff5a8a');}
}
function renderFesta(){
  const g=ctx,m=mg,t=m.t;
  R(g,0,0,W,H,'#120a22');
  // luzes da pista
  for(let i=0;i<5;i++){const a=Math.sin(t*1.3+i*1.7)*.6,cx=40+i*60,col=['rgba(255,79,216,.18)','rgba(79,255,210,.16)','rgba(255,225,79,.14)','rgba(111,127,240,.18)','rgba(255,138,61,.14)'][i];
    g.fillStyle=col;g.beginPath();g.moveTo(cx,0);g.lineTo(cx+Math.sin(a)*120-18,H);g.lineTo(cx+Math.sin(a)*120+18,H);g.closePath();g.fill();}
  // globo espelhado
  g.fillStyle='#c9d3de';g.beginPath();g.arc(160,14,9,0,Math.PI*2);g.fill();for(let i=0;i<8;i++)R(g,153+(i*3)%14,8+Math.floor(i/3)*4,2,2,Math.floor(t*6+i)%2?'#ffffff':'#8a96a8');R(g,160,0,1,5,'#888');
  // galera dançando ao fundo
  for(let i=0;i<14;i++){const x=i*24+6,b=Math.abs(Math.sin(m.beat*6+i))*4,c=['#ff4fd8','#4fffd2','#ffe14f','#6f7ff0','#ff8a3d'][i%5];
    R(g,x,118-b,10,30,'#1d1230');R(g,x+2,110-b,6,8,'#2a1a40');R(g,x+1,120-b,8,2,c);if(Math.sin(m.beat*6+i)>0)R(g,x-2,104-b,2,10,'#2a1a40');}
  R(g,0,140,W,40,'#0a0614');for(let x=0;x<W;x+=16)R(g,x,140,8,2,['#ff4fd8','#4fffd2','#6f7ff0'][(x/16+Math.floor(t*4))%3]);
  // Markin (esquerda) e a gatinha (direita)
  const st=faceState();st.mood=m.phase==='end'?(m.result==='win'?'hype':'sad'):(m.phase==='react'?'hype':null);
  buildFace(st,{});g.imageSmoothingEnabled=false;
  if(!corpo)return;
  // corpo: cabelo caindo nas costas, cropped preto de alcinha, barriga de fora, saia preta com cinto da cor do cabelo
  const top='#141018',topL='#2a2030';
  P2(3,28,4,11,hair);P2(23,28,4,11,hair);
  P2(5,36,20,2,sk);P2(4,37,1,2,sk);P2(25,37,1,2,sk);P2(11,36,8,1,skD);
  P2(9,36,1,2,top);P2(20,36,1,2,top);P2(14,37,2,1,'#e3b341');
  P2(8,38,14,7,top);P2(9,38,12,1,topL);P2(11,40,1,4,topL);P2(18,40,1,4,topL);
  P2(4,38,4,9,sk);P2(22,38,4,9,sk);P2(4,38,1,9,skD);P2(25,38,1,9,skD);
  P2(4,45,4,1,'#4fffd2');P2(22,45,4,1,'#ff4fd8'); // pulseirinhas de festa
  P2(4,47,4,2,skD);P2(22,47,4,2,skD);
  P2(9,45,12,2,sk);P2(9,45,12,1,skD);P2(15,46,1,1,skD);
  P2(8,47,14,1,hair);P2(8,48,14,2,top);P2(7,50,16,3,top);P2(7,52,16,1,topL);P2(12,49,1,3,topL);P2(17,49,1,3,topL);
  const bob=Math.sin(m.beat*6)*1.5;
  drawMkTorso(g,34,104+bob,56,40);R(g,24,106+bob,12,16,'#5a3a26');R(g,88,106+bob,12,16,'#5a3a26');R(g,25,122+bob,10,18,'#d29a6c');R(g,89,122+bob,10,18,'#d29a6c');R(g,25,139+bob,10,5,'#b8804f');R(g,89,139+bob,10,5,'#b8804f');
  g.drawImage(fbuf,32,30+bob,60,75);
  drawGatinha(g,214,38-bob,m.gatMood,m.set,true);
  // corações
  for(let i=0;i<5;i++){const on=i<m.hearts,hx=W/2-34+i*16,hy=24;
    const c=on?'#ff5a8a':'#3a2a4a';R(g,hx,hy,3,3,c);R(g,hx+5,hy,3,3,c);R(g,hx-1,hy+2,10,3,c);R(g,hx+1,hy+5,6,2,c);R(g,hx+3,hy+7,2,1,c);}
  outlineText(g,'CIRCO VOADOR · LAPA',W/2,14,8,'#4fffd2');
  outlineText(g,`rodada ${Math.min(m.round+1,5)}/5`,W/2,44,7,'#f3ecd8');
  if(m.phase==='end'){const blink=Math.floor(t*3)%2;outlineText(g,m.title,W/2,70,15,m.result==='win'?'#8be08b':blink?'#ff6b5d':'#ffb347');}
}
function drawFestaSpot(g,x,y,t){
  x=Math.round(x);y=Math.round(y);
  const cols=['#ff4fd8','#4fffd2','#ffe14f','#6f7ff0'],k=Math.floor(t*4);
  // portaria do Circo Voador (o letreiro de lâmpadas já tá na lona): catraca e cordão de fila
  R(g,x-14,y-10,2,10,'#c9a060');R(g,x+12,y-10,2,10,'#c9a060');for(let i=0;i<24;i+=2)R(g,x-12+i,y-9+Math.round(Math.sin(i/24*Math.PI)*2),2,1,cols[(k+i)%4]);
  // fila na porta
  const guy=(gx,hair,shirt)=>{R(g,gx-3,y-1,6,2,'rgba(0,0,0,.25)');R(g,gx-2,y-5,1,4,'#222');R(g,gx+1,y-5,1,4,'#222');R(g,gx-3,y-11,6,6,shirt);R(g,gx-2,y-16,5,5,'#d9a37a');R(g,gx-3,y-18,6,3,hair);};
  guy(x-9,'#b58cff','#141018');guy(x+9,'#4fffd2','#2a2a2a');
  R(g,x-3,y-12,6,8,'#111');R(g,x-2,y-17,5,5,'#8a5a3a');R(g,x-2,y-14,5,1,'#111'); // segurança
}
/* ---------- SAXOFONE (chefão): o Jamal ensina o Markin a tocar, em 3 lições ---------- */
const GT_KEYS=[['Digit7','Numpad7'],['Digit8','Numpad8'],['Digit9','Numpad9'],['Digit0','Numpad0']]; // no PC as cores são 7 8 9 0
const GT_COL=['#3fc85a','#e84a4a','#ffe14f','#2d8fe8'];
const GT_HIT=146,GT_SPD=95; // linha de acerto e velocidade das notas (px/s)
const GT_SCALE=[196,220,262,294,330,392,440,523,587,659];
// a Guerra dos Músicos: 3 rodadas contra o Jamal; quem terminar puxando a banda leva o bloco
const GT_INTRO=[['Jamal','Olha só... o Markin com um sax de bloco na mão.'],['Jamal','Tu conhece a regra, né? A música acabou, quem puxar a próxima leva o bloco.'],
  ['Markin','A Guerra dos Músicos... Eu contava essa história pra galera e ninguém acreditava.'],['Jamal','Pois agora tu tá nela. Ganhou, minha banda é tua. Perdeu, some da Lapa.']];
const GT_LESSONS=[
  {nome:'RODADA 1: O ESQUENTA',fala:[['Jamal','Esquenta, moleque. Eu toco, tu responde.']],bpm:100,dur:14,lanes:3,dens:.55},
  {nome:'RODADA 2: A RESPOSTA',fala:[['Jamal','Sorte de principiante. Agora eu vou mais rápido.'],['Markin','Pode vir, Jamal.']],bpm:116,dur:16,lanes:4,dens:.66},
  {nome:'RODADA 3: A PUXADA',fala:[['Jamal','A música tá acabando... quem puxar a próxima leva o bloco!']],bpm:132,dur:16,lanes:4,dens:.78}
];
function gtLaneX(i){return 160+(i-1.5)*30;}
function wrapTxt(s,n){const out=[];let cur='';for(const w of s.split(' ')){if(cur&&(cur+' '+w).length>n){out.push(cur);cur=w;}else cur=cur?cur+' '+w:w;}if(cur)out.push(cur);return out;}
function gtSong(L,t0){
  const notes=[],half=30/L.bpm;let lane=0,step=0;
  for(let t=t0+1.6;t<t0+1.6+L.dur;t+=half){step++;
    const strong=step%2===1;if(Math.random()>(strong?L.dens+.25:L.dens*.5))continue;
    lane=clamp(lane+pick([-1,0,1,1,-1,2,-2]),0,L.lanes-1);
    notes.push({t,lane,mel:GT_SCALE[clamp(lane*2+(step%4===0?1:0)+(L.lanes>3?1:0),0,GT_SCALE.length-1)],hit:false,miss:false});}
  return notes;
}
function startGuitarra(){
  mgEnter('guitarra');
  const crowd=[];for(let i=0;i<16;i++)crowd.push({x:i*21+4,ph:rnd(0,6),col:pick(['#ff4fd8','#4fffd2','#ffe14f','#ff8a3d','#9b76d6','#e84a4a']),skin:pick(['#d29a6c','#b8733f','#8a5a3a','#e0b08a'])});
  mg={t:0,lesson:0,phase:'talk',falas:GT_INTRO,fi:0,falaT:0,notes:[],meter:.5,streak:0,best:0,hits:0,total:0,msg:'',msgT:0,result:null,done:0,press:[0,0,0,0],pops:[],beatN:-1,beatT0:0,crowd,intro:true};
}
function gtCheckLose(){const m=mg;if(m.meter<=0&&!m.result){m.meter=0;m.result='lose';m.done=2.6;m.msg='A BANDA INTEIRA FICOU COM O JAMAL...';m.msgT=2.6;sfx.lose();}}
function gtMiss(){const m=mg;m.streak=0;m.meter-=.07;m.total++;beep(110,.15,'sawtooth',.05,70);shake=.12;gtCheckLose();}
function gtPress(ln){
  const m=mg;if(!m||state!=='guitarra'||m.result||m.phase!=='play')return;
  m.press[ln]=.15;
  let best=null,bd=.15;for(const n of m.notes){if(n.hit||n.miss||n.lane!==ln)continue;const d=Math.abs(n.t-m.t);if(d<bd){bd=d;best=n;}}
  if(best){best.hit=true;m.hits++;m.total++;m.streak++;m.best=Math.max(m.best,m.streak);m.meter=Math.min(1,m.meter+.035);
    beep(best.mel,.24,'sawtooth',.035);beep(best.mel*2,.12,'square',.012);
    m.pops.push({lane:ln,txt:bd<.06?'PERFEITO':'BOA',t:.6,col:bd<.06?'#8be08b':'#f3ecd8'});
    if(m.streak%10===0)m.pops.push({lane:null,txt:m.streak+' SEGUIDAS!',t:1,col:'#ffb347'});}
  else{m.meter-=.02;m.streak=0;beep(150,.06,'square',.03);gtCheckLose();}
}
function updGuitarra(dt){
  const m=mg;m.t+=dt;m.msgT-=dt;for(let i=0;i<4;i++)m.press[i]=Math.max(0,m.press[i]-dt);
  for(const q of m.pops)q.t-=dt;m.pops=m.pops.filter(q=>q.t>0);
  const act=actionQ;actionQ=false;jumpQ=false;laneQ=0;
  if(m.result){m.done-=dt;if(m.done<=0){
    if(m.result==='win'){mgExit(`Venceu a Guerra dos Músicos! ${m.hits} notas certas, melhor sequência ${m.best}.`,'good',25,120);
      state='cut';cutKind='bloco';P.mode='cut';cutGen=blocoGen();cutGen.next();}
    else mgLost('O Jamal puxou a próxima música e a banda ficou com ele. "Volta quando souber tocar!"');}
    return;}
  // conversa: só passa apertando espaço (ou tocando na tela)
  if(m.phase==='talk'){if(act&&m.t-m.falaT>.3){m.fi++;m.falaT=m.t;if(m.fi>=m.falas.length){
      if(m.intro){m.intro=false;m.phase='titulo';m.phaseT=2.4;sfx.alert();beep(220,.5,'sawtooth',.05,440);}
      else{const L=GT_LESSONS[m.lesson];m.notes=gtSong(L,m.t);m.phase='play';m.beatT0=m.t;m.beatN=-1;m.msg=L.nome;m.msgT=1.6;}}}return;}
  if(m.phase==='titulo'){m.phaseT-=dt;if(m.phaseT<=0){m.phase='talk';m.falas=GT_LESSONS[0].fala;m.fi=0;m.falaT=m.t;}return;}
  m.meter-=.022*dt;gtCheckLose();if(m.result)return; // o Jamal vai puxando a banda de volta
  // batida de fundo
  const L=GT_LESSONS[m.lesson],beat=60/L.bpm,bn=Math.floor((m.t-m.beatT0)/beat);
  if(bn>m.beatN){m.beatN=bn;if(!(mus&&mus.mg&&mus.mg.guitarra)){beep(70,.12,'sine',.12,40);if(bn%2)beep(2600,.03,'square',.01);}} // com a música do chefão, sem batida extra
  for(const n of m.notes)if(!n.hit&&!n.miss&&m.t-n.t>.16){n.miss=true;gtMiss();if(m.result)return;}
  const lastN=m.notes[m.notes.length-1];
  if(!lastN||m.t>lastN.t+.8){
    m.lesson++;
    if(m.lesson>=GT_LESSONS.length){if(m.meter>=.5){m.result='win';m.done=2.8;m.msg='A BANDA DO JAMAL VIROU PRO MARKIN!';m.msgT=2.8;sfx.win();}
      else{m.result='lose';m.done=2.6;m.msg='O JAMAL PUXOU A PRÓXIMA...';m.msgT=2.6;sfx.lose();}}
    else{m.phase='talk';m.falas=GT_LESSONS[m.lesson].fala;m.fi=0;m.falaT=m.t;m.notes=[];}
  }
}
function renderGuitarra(){
  const g=ctx,m=mg,t=m.t,Lk=Math.min(m.lesson,GT_LESSONS.length-1),L=GT_LESSONS[Lk];
  const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#12081f');sky.addColorStop(1,'#3a1050');g.fillStyle=sky;g.fillRect(0,0,W,H);
  for(let i=0;i<5;i++){const a=Math.sin(t*1.1+i*1.5)*.7,cx=30+i*65,col=['rgba(255,79,216,.16)','rgba(79,255,210,.14)','rgba(255,225,79,.12)','rgba(111,127,240,.16)','rgba(255,138,61,.12)'][i];
    g.fillStyle=col;g.beginPath();g.moveTo(cx,0);g.lineTo(cx+Math.sin(a)*110-16,H);g.lineTo(cx+Math.sin(a)*110+16,H);g.closePath();g.fill();}
  const bpm=m.phase==='play'?L.bpm:90,bb=t*bpm/60*Math.PI*2;
  // a galera do Markin no fundo, torcendo (todos os amigos que ele juntou + foliões)
  {const amigos=buddies.filter(b=>!b.crowd);const lista=amigos.length?amigos:Object.entries(BUDDY_DEFS).map(([k,v])=>({...v,k}));
   for(let i=0;i<16;i++){const q=m.crowd[i],b=Math.abs(Math.sin(bb/2+q.ph))*3*(m.meter>.3?1:.3);R(g,q.x,150-b,10,20,q.col);R(g,q.x+2,142-b,7,7,q.skin);}
   lista.forEach((a,i)=>{const px=14+i*(292/Math.max(1,lista.length-1||1)),pula=Math.abs(Math.sin(bb/2+i))*4*(m.meter>.3?1:.4);
     g.save();g.translate(Math.round(px),Math.round(176-pula));g.scale(2,2);drawBuddy(g,0,0,{...a,hair:a.k==='festa'?gatHair:a.hair},{dir:'down',frame:Math.floor(t*6+i)%4,t});
     if(Math.sin(bb/2+i)>0&&m.meter>.4){R(g,-6,-24,1,6,a.skin);R(g,5,-24,1,6,a.skin);} g.restore(); // braços pra cima
     if(m.meter>.5&&Math.floor(t*1.3+i)%4===0)outlineText(g,['VAI MARKIN!','SOPRA!','É NOSSO!','BLOCO DO MARKIN!'][i%4],px,138-pula,6,'#fff1c2');});}
  // o saxofone gigante: as notas descem pelo corpo dourado e caem nas chaves de madrepérola
  const x0=gtLaneX(0)-17,x1=gtLaneX(3)+17,cxs=(x0+x1)/2;
  const ouro=g.createLinearGradient(x0,0,x1,0);ouro.addColorStop(0,'#8a6a10');ouro.addColorStop(.18,'#e3b341');ouro.addColorStop(.5,'#ffe89a');ouro.addColorStop(.82,'#e3b341');ouro.addColorStop(1,'#8a6a10');
  R(g,cxs-3,3,6,5,'#1d1d22');R(g,cxs-2,8,4,3,'#c9a040');g.fillStyle='#e3b341';g.beginPath();g.moveTo(cxs-2,11);g.quadraticCurveTo(cxs+18,12,cxs+8,24);g.lineTo(cxs+2,24);g.quadraticCurveTo(cxs+10,16,cxs-2,15);g.fill(); // boquilha e tudel
  g.fillStyle=ouro;g.beginPath();g.moveTo(x0+6,24);g.lineTo(x1-6,24);g.lineTo(x1,GT_HIT+14);g.quadraticCurveTo(x1,H+2,cxs+30,H+2);g.lineTo(x0+10,H+2);g.quadraticCurveTo(x0,H-4,x0,GT_HIT+10);g.closePath();g.fill(); // corpo
  g.fillStyle='rgba(60,40,6,.35)';for(let k=0;k<4;k++)g.fillRect(x0+8,40+k*28,x1-x0-16,1);
  for(let k=0;k<7;k++){const ky=34+k*16;g.fillStyle='#c9a040';g.beginPath();g.arc(x0+3,ky,3,0,Math.PI*2);g.fill();g.beginPath();g.arc(x1-3,ky+8,3,0,Math.PI*2);g.fill();R(g,x0+3,ky,x1-x0-6,1,'rgba(120,90,20,.5)');} // varetas e chavinhas dos lados
  g.fillStyle='#ffe89a';g.beginPath();g.ellipse(x1+10,GT_HIT+30,16,9,-.5,0,Math.PI*2);g.fill();g.fillStyle='#3a2a08';g.beginPath();g.ellipse(x1+11,GT_HIT+30,11,5,-.5,0,Math.PI*2);g.fill(); // campana
  for(let i=0;i<4;i++){const on=i<L.lanes||m.phase!=='play';if(!on){g.fillStyle='rgba(20,10,0,.5)';g.fillRect(gtLaneX(i)-14,24,28,H-24);}}
  // notas (bolinhas com colcheia) descendo pelo sax
  for(const n of m.notes){if(n.hit)continue;const y=GT_HIT-(n.t-m.t)*GT_SPD;if(y<18||y>H+6)continue;const x=gtLaneX(n.lane);
    if(n.miss)g.globalAlpha=.3;g.fillStyle='#1a0e04';g.beginPath();g.arc(x,y,8,0,Math.PI*2);g.fill();g.fillStyle=GT_COL[n.lane];g.beginPath();g.arc(x,y,7,0,Math.PI*2);g.fill();
    R(g,x-3,y-5,2,1,'rgba(255,255,255,.6)');R(g,x-1,y-4,1,6,'#1a0e04');R(g,x-3,y+1,3,3,'#1a0e04');R(g,x,y-4,3,1,'#1a0e04');R(g,x+2,y-3,1,2,'#1a0e04');g.globalAlpha=1;}
  // chaves de madrepérola na linha de acerto
  for(let i=0;i<4;i++){const x=gtLaneX(i),on=m.press[i]>0;
    g.fillStyle='#8a6a10';g.beginPath();g.arc(x,GT_HIT,11,0,Math.PI*2);g.fill();g.fillStyle=on?'#ffffff':'#f7efe0';g.beginPath();g.arc(x,GT_HIT,9,0,Math.PI*2);g.fill();
    g.fillStyle=GT_COL[i];g.globalAlpha=on?1:.55;g.beginPath();g.arc(x,GT_HIT,6,0,Math.PI*2);g.fill();g.globalAlpha=1;R(g,x-3,GT_HIT-5,3,2,'rgba(255,255,255,.8)');
    if(!isTouch)outlineText(g,TECLA[i],x,GT_HIT+19,7,'#1a0e04','center','#ffe89a');}
  // o Jamal (esquerda) com a banda dele: trompete, trombone e caixa, e foliões de LED e glitter
  {const band=[['trombone',{skin:'#d29a6c',hair:'#ff4fd8',shirt:'#2d6fd1',shorts:'#f4f1e8'},14,150],['trompete',{skin:'#8a5a3a',hair:'#1e140e',shirt:'#e84a4a',shorts:'#1d1d22',cap:'#ffe14f'},86,150],['caixa',{skin:'#b8733f',hair:'#1e140e',shirt:'#f4f1e8',shorts:'#2f9a55'},20,178]];
   const vira=clamp((m.meter-.5)*160,-20,80); // a banda do Jamal vai indo pro lado de quem tá ganhando
   for(const [k,look,bx0,by] of band){const bx=bx0+vira;g.save();g.translate(bx,by-Math.abs(Math.sin(bb/2+bx))*2);g.scale(2,2);drawMusico(g,0,0,k,t,look,bx);g.restore();}}
  g.save();g.translate(50,146);g.scale(3,3);drawMestre(g,0,0,{t,play:m.phase==='play',frame:0});g.restore();
  const st=faceState();st.mood=m.result==='win'?'hype':m.result==='lose'?'sad':m.streak>=10?'hype':null;
  buildFace(st,{});g.imageSmoothingEnabled=false;
  const bob=m.phase==='play'?Math.abs(Math.sin(bb/2))*2:0;
  if(st.spider)R(g,250,106+bob,46,38,'#d0202a');else drawMkTorso(g,250,106+bob,46,38);R(g,244,108+bob,8,14,st.spider?'#d0202a':'#5a3a26');R(g,294,108+bob,8,14,st.spider?'#d0202a':'#5a3a26');R(g,270,92+bob,4,3,'#1a1a1a');R(g,268,95+bob,4,6,'#e3b341');R(g,264,100+bob,6,30,'#e3b341');R(g,265,100+bob,2,30,'#f2d060');R(g,264,128+bob,16,6,'#e3b341');R(g,275,112+bob,7,18,'#e3b341');R(g,273,109+bob,11,4,'#f2d060');for(let k=0;k<5;k++)R(g,266,104+k*5+bob,3,2,'#8a6a10');
  {const sk=st.spider?'#d0202a':'#d29a6c',hd=st.spider?'#d0202a':'#b8804f';R(g,246,120+bob,20,5,sk);R(g,264,118+bob,5,6,hd);R(g,284,120+bob,-12,5,sk);R(g,280,124+bob,16,5,sk);R(g,272,122+bob,5,7,hd);} // braços segurando o sax
  g.drawImage(fbuf,249,44+bob,48,60);
  // HUD
  outlineText(g,'GUERRA DOS MÚSICOS',W/2,11,7,'#ffe14f');
  if(m.phase==='play'||m.result)outlineText(g,L.nome,W/2,21,6,'#4fffd2');
  // cabo de guerra: banda do Jamal (roxo) contra a do Markin (verde)
  R(g,6,6,70,8,'#0a0612');R(g,7,7,68*(1-m.meter),6,'#9b3fd8');R(g,7+68*(1-m.meter),7,68*m.meter,6,'#8be08b');R(g,40,5,1,10,'#ffffff');
  outlineText(g,'JAMAL',7,23,6,'#c9a0ff','left');outlineText(g,'MARKIN',75,23,6,'#8be08b','right');
  outlineText(g,`${m.streak} seguidas`,W-6,11,7,'#ffb347','right');outlineText(g,`rodada ${Math.min(m.lesson+1,3)}/3`,W-6,21,6,'#f3ecd8','right');
  for(const q of m.pops){g.globalAlpha=clamp(q.t*2,0,1);outlineText(g,q.txt,q.lane!=null?gtLaneX(q.lane):W/2,q.lane!=null?GT_HIT-18-(1-q.t/.6)*14:60,q.lane!=null?6:9,q.col);g.globalAlpha=1;}
  if(m.phase==='talk'&&!m.result){const [quem,txt]=m.falas[m.fi],ls=wrapTxt(quem+': '+txt,36);R(g,60,40,200,16+ls.length*11,'rgba(10,6,20,.92)');R(g,60,40,200,1,'#ffe14f');ls.forEach((s,i)=>outlineText(g,s,W/2,52+i*11,7,quem==='Markin'?'#8be08b':'#ffffff'));
    outlineText(g,isTouch?'toque ▸':'ESPAÇO ▸',254,53+ls.length*11,6,'#ffe14f','right');}
  else if(m.phase==='titulo'){const p=Math.min(1,(2.4-m.phaseT)*3);R(g,0,60,W,48,'rgba(10,6,20,.9)');outlineText(g,'GUERRA DOS',W/2,80,Math.round(8+8*p),'#ffe14f');outlineText(g,'MÚSICOS',W/2,100,Math.round(8+8*p),'#ff4fd8');}
  else if(m.msgT>0)outlineText(g,m.msg,W/2,64,m.result?11:9,m.result==='lose'?'#ff6b5d':m.result==='win'?'#8be08b':'#ffffff');
  else if(m.lesson===0&&m.phase==='play'&&!m.result&&m.t-m.beatT0<4)outlineText(g,isTouch?'toque na coluna quando a nota chegar na linha':'7 8 9 0 quando a nota chegar na linha',W/2,64,7,'#ffe14f');
}
/* marcadores no mapa */
function drawAltinhaSpot(g,x,y,t){
  x=Math.round(x);y=Math.round(y);
  R(g,x-16,y-34,31,9,'#8a5a2e');R(g,x-1,y-25,2,8,'#6d4322');pxText(g,'ALTINHA',x-14,y-32,'#fff1c2');
  const guy=(gx,col,sk)=>{R(g,gx-3,y-1,6,2,'rgba(0,0,0,.2)');R(g,gx-2,y-5,1,4,sk);R(g,gx+1,y-5,1,4,sk);R(g,gx-3,y-8,6,3,col);R(g,gx-3,y-13,6,5,sk);R(g,gx-3,y-17,6,4,sk);R(g,gx-3,y-18,6,2,'#f4ecb0');};
  guy(x-12,'#d8332f','#b8733f');guy(x+12,'#2f9a55','#8a5a3a');
  const ph=(t*.9)%2,dir=ph<1?1:-1,u=ph%1,bx=x-9+18*(dir>0?u:1-u),by=y-20-Math.sin(u*Math.PI)*16;
  R(g,bx-2,y-1,4,1,'rgba(0,0,0,.2)');if(ballImg.complete&&ballImg.naturalWidth)g.drawImage(ballImg,Math.round(bx-3),Math.round(by-3),6,6);
}
function drawBlocoSpot(g,x,y,t){
  x=Math.round(x);y=Math.round(y);
  drawEstandarte(g,x+30,y+2,1,{t,topo:'BLOCO',base:'SECRETO'});
  for(let i=0;i<7;i++){const px=x-18+i*6,py=y-Math.abs(Math.sin(t*8+i))*3,c=['#ff4fd8','#4fffd2','#ffe14f','#ff8a3d','#9b76d6','#e84a4a','#f4f1e8'][i];
    R(g,px-2,py-6,4,5,c);R(g,px-2,py-9,4,3,['#d29a6c','#b8733f','#8a5a3a'][i%3]);R(g,px-1,py-2,1,2,'#333');R(g,px+1,py-2,1,2,'#333');
    if(Math.sin(t*10+i)>0)R(g,px-3,py-12,1,4,'#d29a6c');else R(g,px+2,py-12,1,4,'#d29a6c');
    const led=['#ff2bd6','#2bffe0','#fff12b','#2b7bff'][(i+Math.floor(t*6))%4];R(g,px-2,py-10,4,1,led);R(g,px-2,py-6,1,1,led);R(g,px+1,py-4,1,1,led);} // LED na cabeça e na roupa
  for(let k=0;k<12;k++){const cx=x-22+h2(k,1,9)*44,cy=y-44+((t*22+k*7)%40);R(g,cx,cy,1,1,['#ff4fd8','#4fffd2','#ffe14f','#ffffff'][k%4]);}
}

/* ---------- MARACANÃ: invadir na hora certa e marcar um gol sem os seguranças pegarem ---------- */
let maracaDay=0;
const MC_G=160; // chão da cena
function drawMaracaSpot(g,x,y,t){x=Math.round(x);y=Math.round(y);
  R(g,x-1,y-18,2,18,'#5c4630');R(g,x-22,y-30,44,13,'#1f6a3a');R(g,x-22,y-18,44,1,'#0f3a20');R(g,x-21,y-29,42,1,'#8be08b');
  outlineText(g,'MARACANÃ',x,y-21,6,'#ffe14f');
  const by=y-40-Math.abs(Math.sin(t*4))*6;g.fillStyle='#f4f4f4';g.beginPath();g.arc(x,by,3,0,Math.PI*2);g.fill();R(g,x-1,by-1,2,2,'#1a1a1a');}
function mcGuards(){return [{x:98,st:'away',t:rnd(1.6,2.8),look:0},{x:222,st:'away',t:rnd(2.4,3.8),look:0}];} // mais separados
const MC_CONE=48; // meia largura da área vermelha na altura do Markin: só ali o segurança enxerga (mesmo parado)
const MC_BURACO=282; // buraco do alambrado: fora da visão do segundo segurança
function mcVisto(m){return m.guards.some(g=>g.st==='look'&&g.look>.18&&Math.abs(m.me.x-g.x)<MC_CONE);}
function startMaraca(){
  mgEnter('maraca');
  mg={t:0,phase:'sneak',tries:3,msg:'Só ande quando os seguranças estiverem olhando o jogo!',msgT:3.4,result:null,done:0,caught:0,uuh:rnd(7,11),uuhT:0,pops:[]};
  mcSneak();
}
function mcSneak(){const m=mg;m.phase='sneak';m.me={x:24,y:MC_G,z:0,zv:0,face:1,run:0,climb:0,ground:true};m.guards=mcGuards();m.caught=0;m.ball=null;m.shot=null;m.savedT=undefined;}
function mcCaught(txt){const m=mg;if(m.caught>0||m.result)return;m.caught=2.2;m.tries--;m.msg=txt;m.msgT=2.2;sfx.hit();shake=.3;flash=.3;
  if(m.tries<=0){m.result='lose';m.done=2.6;m.msg='TE BOTARAM PRA FORA DO MARACANÃ!';m.msgT=3;}}
function updMaraca(dt){
  const m=mg;m.t+=dt;m.msgT-=dt;m.uuhT=Math.max(0,m.uuhT-dt);const inp=mgInput();
  for(const q of m.pops){q.t-=dt;q.y-=18*dt;}m.pops=m.pops.filter(q=>q.t>0);
  if(m.ball&&!(m.caught>0))mcBall(dt);
  if(m.result){m.done-=dt;if(m.done<=0){
    if(m.result==='win'){const first=maracaDay!==day;maracaDay=day;
      markTask('maraca');
      mgExit(first?'GOL NO MARACANÃ! +6h acordado e +30 de energia.':'Mais um gol no Maracanã! +6h acordado (+8 de energia)','good',first?30:8,360);}
    else mgLost('Os seguranças te botaram pra fora do Maracanã.');}
    return;}
  if(m.caught>0){m.caught-=dt;if(m.caught<=0)mcSneak();return;}
  if(m.phase==='sneak')mcUpdSneak(dt,inp);else mcUpdPitch(dt,inp);
}
function mcUpdSneak(dt,inp){
  const m=mg,me=m.me;
  // de vez em quando rola um lance perigoso e todo mundo vira pro jogo: é a hora de ir!
  m.uuh-=dt;if(m.uuh<=0){m.uuh=rnd(9,14);m.uuhT=2.8;m.msg='UUUH! Lance perigoso, todo mundo olhando o jogo!';m.msgT=2.2;for(const g of m.guards){g.st='away';g.t=2.8;}beep(260,.6,'sawtooth',.03,160);}
  for(const g of m.guards){g.t-=dt;if(g.st==='look')g.look+=dt;
    if(g.t<=0){if(g.st==='away'){g.st='turn';g.t=.6;beep(700,.05,'square',.03);}
      else if(g.st==='turn'){g.st='look';g.t=rnd(1.2,2.4);g.look=0;}
      else{g.st='away';g.t=rnd(1.2,3);}}}
  if(me.climb>0){ // escalando o alambrado quebrado
    if(mcVisto(m)){mcCaught('TE VIRAM ESCALANDO O ALAMBRADO!');return;}
    me.climb+=dt;if(me.climb>=.8)mcPitch();return;}
  // na área vermelha o segurança te vê, andando ou parado
  if(mcVisto(m)){mcCaught('O SEGURANÇA TE VIU NA ÁREA VERMELHA!');return;}
  // antes de invadir só tem um botão: segura pra correr (no teclado, → ou ESPAÇO; ← volta)
  const noBuraco=me.x>=MC_BURACO;
  const corre=!noBuraco&&(aHeld||keys.has('Space'));let ix=inp.ix;if(corre)ix=1; // o botão de correr vai 25% mais rápido que o analógico
  if(Math.abs(ix)>.15){me.x=clamp(me.x+ix*58*(corre?1.25:1)*dt,14,noBuraco?MC_BURACO+10:MC_BURACO+2);me.face=ix>0?1:-1;me.run+=dt;me.moving=true;}else me.moving=false;
  if(noBuraco&&(inp.jump||inp.act)){me.climb=.001;me.x=MC_BURACO+6;beep(400,.1,'square',.04);}
}
function mcPitch(){const m=mg;m.phase='pitch';m.msg='DENTRO! Corre pro gol e chuta com '+(isTouch?'CHUTA':'ESPAÇO')+'!';m.msgT=2.4;sfx.alert();
  m.me={x:26,y:MC_G,z:0,zv:0,face:1,run:0,ground:true};m.ball={x:40,z:0,vx:0,vz:0,state:'dribble'};
  m.chasers=[{x:-14,sp:64,delay:.8},{x:-40,sp:58,delay:1.6}];
  m.tack={x:330,sp:70,delay:.3,dive:0,down:0,used:false};
  m.gk={z:14,t:0};m.aim={z:6,dir:1};m.shot=null;m.savedT=undefined;}
function mcBall(dt){const m=mg,b=m.ball,me=m.me;
  if(b.state==='dribble'){b.x+=(me.x+9*me.face-b.x)*Math.min(1,dt*12);b.z=me.z*.7+Math.abs(Math.sin((me.run||0)*9))*2;}
  else if(b.state==='shot'){b.t+=dt;const k=Math.min(1,b.t/b.dur);b.x=b.sx+(300-b.sx)*k;b.z=b.sz+(b.tz-b.sz)*k+Math.sin(k*Math.PI)*8;
    if(b.t>.15)m.gk.z+=clamp(b.tz-m.gk.z,-26*dt,26*dt); // o goleiro reage: chute de longe dá tempo pra ele chegar
    if(k>=1){if(Math.abs(m.gk.z-b.tz)<9){b.state='saved';b.vx=-110;b.vz=70;m.msg='O GOLEIRO PEGOU!';m.msgT=1.5;beep(200,.2,'square',.05);m.savedT=.9;}
      else{b.state='goal';b.vx=40;m.result='win';m.done=3.2;sfx.win();m.uuhT=3.2;m.pops.push({x:250,y:MC_G-50,t:1.6,txt:'GOL DO MARKIN!'});}}}
  else if(b.state==='goal'){b.x=Math.min(316,b.x+b.vx*dt);b.vx*=.96;b.z=Math.max(0,b.z-30*dt);}
  else if(b.state==='saved'){b.x+=b.vx*dt;b.vz-=320*dt;b.z+=b.vz*dt;if(b.z<0){b.z=0;b.vz=-b.vz*.4;}b.vx*=.99;}
}
function mcUpdPitch(dt,inp){
  const m=mg,me=m.me,b=m.ball;
  if(!m.shot){me.x=clamp(me.x+inp.ix*80*dt,10,262);me.moving=Math.abs(inp.ix)>.1;if(me.moving){me.face=inp.ix>0?1:-1;me.run+=dt;}}else me.moving=false;
  if(inp.jump&&me.ground){me.zv=215;me.ground=false;beep(500,.06,'square',.03);}
  if(!me.ground){me.zv-=640*dt;me.z+=me.zv*dt;if(me.z<=0){me.z=0;me.zv=0;me.ground=true;}}
  m.aim.z+=m.aim.dir*46*dt;if(m.aim.z>43){m.aim.z=43;m.aim.dir=-1;}if(m.aim.z<4){m.aim.z=4;m.aim.dir=1;}
  if(!m.shot){m.gk.t+=dt;m.gk.z=19+Math.sin(m.gk.t*2.3)*13;}
  if(inp.act&&!m.shot&&b.state==='dribble'){
    if(me.x<100){m.msg='Chega mais perto do gol!';m.msgT=1.2;}
    else{m.shot={tz:m.aim.z};b.state='shot';b.sx=b.x;b.sz=b.z;b.tz=m.aim.z;b.dur=(300-b.x)/210;b.t=0;beep(160,.12,'square',.07);beep(90,.1,'sawtooth',.05,0,.03);}}
  if(m.savedT!==undefined){m.savedT-=dt;if(m.savedT<=0){m.savedT=undefined;mcCaught('DEFENDEU... e os seguranças te pegaram!');return;}}
  for(const c of m.chasers){if(c.delay>0){c.delay-=dt;continue;}c.x+=Math.sign(me.x-c.x)*Math.min(Math.abs(me.x-c.x),c.sp*dt);
    if(Math.abs(c.x-me.x)<9&&me.z<10){mcCaught('OS SEGURANÇAS TE PEGARAM!');return;}}
  const tk=m.tack;if(tk.delay>0)tk.delay-=dt;else{
    if(tk.dive>0){tk.dive-=dt;tk.x-=170*dt;if(tk.dive<=0)tk.down=1.1;if(Math.abs(tk.x-me.x)<11&&me.z<9){mcCaught('CARRINHO DO SEGURANÇA!');return;}}
    else if(tk.down>0)tk.down-=dt;
    else if(!tk.used){tk.x-=tk.sp*dt;if(tk.x>me.x&&tk.x-me.x<58){tk.dive=.42;tk.used=true;m.pops.push({x:tk.x,y:MC_G-44,t:.8,txt:'PULA!'});}}
    else{tk.x+=Math.sign(me.x-tk.x)*Math.min(Math.abs(me.x-tk.x),56*dt);if(Math.abs(tk.x-me.x)<9&&me.z<10){mcCaught('OS SEGURANÇAS TE PEGARAM!');return;}}}
}
function mcCrowd(g,y0,y1,t,hype){const cols=['#e84a4a','#f4f1e8','#2d6fd1','#ffe14f','#2f9a55','#1d1d22','#ff8a3d'];
  for(let y=y0;y<y1;y+=4)for(let x=0;x<W;x+=4){const h=h2(x,y,7);if(h<.12)continue;const j=hype&&h2(x,y,Math.floor(t*6))<.5?-1:0;R(g,x+1,y+1+j,2,2,cols[Math.floor(h*7)%7]);}}
// segurança: de costas (olhando o jogo), de lado (virando) ou de frente (olhando o Markin)
function drawGuard(g,x,y,pose,t,o={}){
  x=Math.round(x);y=Math.round(y);const sk='#8a5a3a',vest='#f2e232',blk='#1d1d22',f=Math.floor(t*10)%2;
  R(g,x-7,y+1,14,3,'rgba(0,0,0,.22)');
  if(pose==='slide'){const d=o.face||-1;R(g,x-12,y-6,24,6,blk);R(g,x-8,y-11,12,6,vest);R(g,d<0?x-15:x+9,y-5,6,4,blk);R(g,d<0?x+8:x-14,y-14,7,6,sk);R(g,d<0?x+8:x-14,y-15,7,2,blk);return;}
  const run=pose==='run';
  R(g,x-4,y-12,3,12-(run&&f?2:0),blk);R(g,x+1,y-12,3,12-(run&&!f?2:0),blk);R(g,x-5,y-1,4,1,'#000');R(g,x+1,y-1,4,1,'#000');
  R(g,x-6,y-24,12,13,vest);R(g,x-6,y-18,12,2,'#c0c0c0');R(g,x-8,y-23,2,9,blk);R(g,x+6,y-23,2,9,blk);
  R(g,x-4,y-32,8,8,sk);R(g,x-5,y-34,10,3,blk);
  if(pose==='back'){R(g,x-4,y-31,8,5,'#1a1410');R(g,x-5,y-22,10,3,blk);}
  else if(pose==='side'){R(g,x-5,y-34,3,2,blk);R(g,x-2,y-29,1,1,'#111');outlineText(g,'?',x+8,y-38,11,'#ffe14f');}
  else{R(g,x-3,y-29,2,1,'#111');R(g,x+1,y-29,2,1,'#111');R(g,x-2,y-26,4,1,'#5a2a20');R(g,x-7,y-35,14,1,blk);
    if(pose==='front'){const k=(H-(y-29))/(MC_G-(y-29));g.fillStyle='rgba(255,60,60,.22)';g.beginPath();g.moveTo(x,y-29);g.lineTo(x-MC_CONE*k,H);g.lineTo(x+MC_CONE*k,H);g.closePath();g.fill();outlineText(g,'!',x,y-40,14,'#ff4f4f');}}
}
function mcDrawGK(g,x,hy){const feet=Math.min(MC_G,hy+18),sk='#c98c64',sh=feet-16;
  R(g,x-3,feet-8,2,8,'#1d1d22');R(g,x+1,feet-8,2,8,'#1d1d22');R(g,x-4,feet-18,8,10,'#2fd1a0');R(g,x-3,feet-25,6,7,sk);R(g,x-3,feet-26,6,2,'#1e140e');
  R(g,x-6,Math.min(hy,sh),2,Math.abs(sh-hy)+2,'#2fd1a0');R(g,x+4,Math.min(hy,sh),2,Math.abs(sh-hy)+2,'#2fd1a0');
  R(g,x-8,hy-2,4,4,'#f4f4f4');R(g,x+4,hy-2,4,4,'#f4f4f4');}
function mcDrawMe(g,x,y,back,moving,face=1){
  const run=mg.me.run||0;
  drawMkCorpo(g,x,y,{frame:moving?Math.floor(run*10)%2:0,face,moving,chao:MC_G,arms:back?'up':'down'});
  buildFace(faceState(),{});g.imageSmoothingEnabled=false;g.drawImage(fbuf,Math.round(x-13),Math.round(y-49),26,32);
}
function renderMaraca(){
  const g=ctx,m=mg,t=performance.now()/1000,hype=m.uuhT>0||m.result==='win',sneak=m.phase==='sneak';
  g.fillStyle='#0b1030';g.fillRect(0,0,W,H);
  for(const lx of [26,294]){g.fillStyle='rgba(255,255,210,.12)';g.beginPath();g.arc(lx,5,26,0,Math.PI*2);g.fill();R(g,lx-9,2,18,6,'#f4f4e0');}
  R(g,0,12,W,sneak?60:52,'#3a3f52');mcCrowd(g,14,sneak?70:62,t,hype);
  if(sneak){
    // gramado lá no fundo, com o jogo rolando
    R(g,0,72,W,30,'#2f8a3a');for(let i=0;i<8;i++)R(g,i*40,72,20,30,'#349a41');R(g,0,86,W,1,'#e8f4e0');
    for(let i=0;i<6;i++){let px=(i*57+Math.sin(t*.8+i)*30+t*6*(i%2?1:-1))%W;if(px<0)px+=W;R(g,px,80+(i%3)*5,2,4,i%2?'#e84a4a':'#f4f1e8');}
    R(g,160+Math.sin(t*.9)*120,90,2,2,'#ffffff');
    // alambrado
    g.strokeStyle='rgba(180,190,205,.5)';g.lineWidth=1;g.beginPath();for(let x=-18;x<W;x+=6){g.moveTo(x,102);g.lineTo(x+18,120);g.moveTo(x+18,102);g.lineTo(x,120);}g.stroke();
    R(g,0,102,W,1,'#9aa3b0');R(g,0,120,W,1,'#9aa3b0');for(let x=0;x<W;x+=40)R(g,x,98,2,24,'#6a7280');
    // passarela
    R(g,0,121,W,59,'#6f6a64');for(let x=0;x<W;x+=32)R(g,x,121,1,59,'#5f5a55');R(g,0,121,W,2,'#8a857e');
    // trecho do alambrado quebrado: tela rasgada e dobrada, é por ali que ele pula
    {const bx=MC_BURACO-4;R(g,bx,103,26,17,'#6f6a64');g.strokeStyle='rgba(180,190,205,.7)';g.beginPath();g.moveTo(bx,103);g.lineTo(bx+8,112);g.lineTo(bx+4,120);g.moveTo(bx+26,103);g.lineTo(bx+18,109);g.lineTo(bx+23,120);g.moveTo(bx+8,112);g.lineTo(bx+18,109);g.stroke();
    R(g,bx,100,2,6,'#6a7280');R(g,bx+24,99,2,5,'#6a7280');R(g,bx+12,101,1,3,'#9aa3b0');}
    for(const s of m.guards)drawGuard(g,s.x,134,s.st==='look'?'front':s.st==='turn'?'side':'back',t,s);
    const me=m.me;
    if(me.climb>0)mcDrawMe(g,me.x,MC_G-Math.min(1,me.climb/.8)*50,true,false);
    else mcDrawMe(g,me.x,MC_G,false,me.moving,me.face);
    R(g,40,175,240,3,'#2a2a2a');R(g,40,175,240*clamp((me.x-24)/(MC_BURACO-24),0,1),3,'#8be08b');
    if(me.x>=MC_BURACO&&!me.climb&&!m.caught&&!(m.msgT>0))outlineText(g,isTouch?'PULA pelo buraco do alambrado':'↑ pula pelo buraco do alambrado',me.x-40,MC_G-58,9,'#ffe14f');
  }else{
    R(g,0,64,W,116,'#2f8a3a');for(let i=0;i<8;i++)R(g,i*40,64,20,116,'#349a41');R(g,0,64,W,2,'#e8f4e0');R(g,0,MC_G+10,W,1,'rgba(232,244,224,.7)');
    const gx=298;g.strokeStyle='rgba(240,240,240,.35)';g.lineWidth=1;g.beginPath();for(let y=MC_G-48;y<MC_G;y+=4){g.moveTo(gx+2,y);g.lineTo(W,y);}for(let x=gx+4;x<W;x+=4){g.moveTo(x,MC_G-48);g.lineTo(x,MC_G);}g.stroke();
    R(g,gx,MC_G-50,2,50,'#f4f4f4');R(g,gx,MC_G-50,22,2,'#f4f4f4'); // gol 25% mais alto
    if(!m.shot&&!m.result){const ay=Math.round(MC_G-m.aim.z);R(g,gx-3,ay-1,8,2,'#ff4f4f');R(g,gx,ay-4,2,8,'#ff4f4f');}
    mcDrawGK(g,gx+6,MC_G-m.gk.z);
    for(const c of m.chasers)if(c.delay<=0)drawGuard(g,c.x,MC_G,'run',t,{face:1});
    const tk=m.tack;if(tk.delay<=0)drawGuard(g,tk.x,MC_G,tk.dive>0||tk.down>0?'slide':'run',t,{face:-1});
    mcDrawMe(g,m.me.x,MC_G-m.me.z,false,m.me.moving,m.me.face);
    const b=m.ball;if(b){R(g,b.x-3,MC_G+1,6,2,'rgba(0,0,0,.25)');g.fillStyle='#f4f4f4';g.beginPath();g.arc(b.x,MC_G-3-b.z,3,0,Math.PI*2);g.fill();R(g,b.x-1,MC_G-4-b.z,2,2,'#1a1a1a');}
    if(m.result==='win')outlineText(g,'GOOOOOL!',W/2,100,26,'#ffe14f');
    if(!m.shot&&!m.result&&m.me.x>=100&&!(m.msgT>0))outlineText(g,'chute quando a mira vermelha estiver longe do goleiro',W/2,176,8,'#fff1c2');
  }
  for(let i=0;i<3;i++){g.globalAlpha=i<m.tries?1:.25;g.fillStyle='#f4f4f4';g.beginPath();g.arc(12+i*12,12,4,0,Math.PI*2);g.fill();R(g,11+i*12,11,2,2,'#1a1a1a');g.globalAlpha=1;}
  outlineText(g,sneak?'INVASÃO':'RUMO AO GOL',W-8,15,9,'#fff1c2','right');
  if(m.msgT>0)outlineText(g,m.msg,W/2,42,10,'#ffffff');
  for(const q of m.pops){g.globalAlpha=clamp(q.t,0,1);outlineText(g,q.txt,q.x,q.y,10,'#ffe14f');g.globalAlpha=1;}
  if(m.t<5&&!m.result&&sneak&&!(m.msgT>0)&&m.me.x<MC_BURACO)outlineText(g,isTouch?'segura CORRE · fora da área vermelha · PULA no buraco':'segura → (ou ESPAÇO) pra correr · fuja da área vermelha · ↑ pula no buraco',W/2,168,8,'#fff1c2');
}

/* ================= HUD ================= */
let faceT=0;
function updHUD(){
  // o painel do Markin fica transparente quando está na frente do Cristo Redentor
  const hl=document.querySelector('.hud-l');if(hl)hl.style.opacity=(26-cam.x<112&&47-cam.y<39&&108-cam.y>5)?'.28':'';
  const hr=document.querySelector('.hud-r');if(hr)hr.style.opacity=(71*T-cam.x<W&&3*T-cam.y<80&&7*T-cam.y>0)?'.28':'';
  $('sbar').style.width=P.sono+'%';$('sbar').parentNode.classList.toggle('alerta',P.sono>75);
  const e=P.energy;$('ebar').style.width=e+'%';$('ecap').style.width=(100-maxE())+'%';$('ebar').style.background=e>60?'#8be08b':e>30?'#ffb347':'#ff6b5d';$('enum').textContent=Math.ceil(e);
  $('dayl').textContent=`DIA ${day}/15`;
  // relógio digital 24h: meia-noite = 00:00
  const mins=Math.floor((360+totalMin)%1440),hh=String(Math.floor(mins/60)).padStart(2,'0'),mm=String(mins%60).padStart(2,'0');
  let tl=TASKS.map(t=>`<li class="${tasksDone[t.k]?'ok':''}">${tasksDone[t.k]?'✔':'○'} ${t.curto}</li>`).join('');
  if(finalStage>=1)tl+=`<li class="${finalStage>=2?'ok':''}">${finalStage>=2?'✔':'★'} Chefão</li><li class="${finalStage>=3?'ok':''}">${finalStage>=3?'✔':'○'} Barco</li>`;
  if(isTouch){const n=TASKS.filter(t=>tasksDone[t.k]).length; // celular: uma linha só (a lista completa fica na pausa)
    tl=finalStage===1?'<li class="ok">★ Ache o CHEFÃO</li>':finalStage>=2?'<li class="ok">★ Rumo ao BARCO</li>':`<li class="${n>=TASKS.length?'ok':''}">Tarefas ${n}/${TASKS.length}</li>`;}const te=$('tasks');if(te.dataset.v!==tl){te.dataset.v=tl;te.innerHTML=tl;}
  const ck=$('clock');if(ck.dataset.v!==hh+mm){ck.dataset.v=hh+mm;ck.innerHTML=`${hh}<i>:</i>${mm}`;}
  $('awake').textContent=`${Math.floor(totalMin/60)}h acordado`;
  const ch=[];
  if(fx.turbo>0)ch.push(['TURBO '+Math.ceil(fx.turbo)+'s','#ffb347']);
  if(fx.crash>0)ch.push(['BAD '+Math.ceil(fx.crash)+'s','#ff6b5d']);
  if(fx.trip>0)ch.push(['VIAGEM '+Math.ceil(fx.trip)+'s','#ff8fc2']);
  if(fx.disguise>0)ch.push(['DISFARÇADO '+Math.ceil(fx.disguise)+'s','#9fd0ff']);
  if(fx.drunk>0)ch.push(['BÊBADO','#ffd54a']);
  if(fx.burn>0)ch.push(['TORRADO','#ff8a6a']);
  if(fx.spider>0)ch.push(['HOMEM-ARANHA '+Math.ceil(fx.spider)+'s','#ff5a5a']);
  if(fx.sleepy>0)ch.push(['SONO '+Math.ceil(fx.sleepy)+'s','#c9b0ff']);
  if(temSax()&&sabeMusica)ch.push(['SAX '+'●'.repeat(palhetas)+'○'.repeat(Math.max(0,3-palhetas)),'#ffe14f']);
  if(buddies.length)ch.push([buddies.length>5?'BLOCO: '+(buddies.length+1):'GALERA: '+buddies.length,'#d6f5ff']);
  const html=ch.map(c=>`<span class="chip" style="color:${c[1]}">${c[0]}</span>`).join('');
  const chips=$('chips');if(chips.innerHTML!==html)chips.innerHTML=html;
  faceT-=1/60;if(faceT<=0){faceT=.12;drawFace(fc,faceState());}
}

/* ================= RENDER ================= */
function render(){
  if(state==='mglost'){headCv.hidden=true;return;} // congela a última imagem do desafio atrás da tela de tentar de novo
  tx.clearRect(0,0,tcv.width,tcv.height);
  if(MG_STATES.includes(state)){headCv.hidden=true;ctx.save();if(shake>0)ctx.translate(rnd(-2,2),rnd(-2,2));({surf:renderSurf,altinha:renderAltinha,bloco:renderBloco,bar:renderBar,sinuca:renderSinuca,festa:renderFesta,guitarra:renderGuitarra,maraca:renderMaraca,labirinto:renderLabirinto})[state]();if(mg&&(state==='sinuca'||(state==='maraca'&&mg.phase==='sneak')))galeraMG(ctx,state,mg.t);ctx.restore();
    if(flash>0){ctx.fillStyle=`rgba(255,80,80,${clamp(flash,0,.5)})`;ctx.fillRect(0,0,W,H);}return;}
  const sx=shake>0?rnd(-2,2):0,sy=shake>0?rnd(-2,2):0;
  const cx=Math.round(cam.x+sx),cy=Math.round(cam.y+sy);
  ctx.drawImage(bg,cx,cy,W,H,0,0,W,H);
  if(navioDX>0){ctx.drawImage(bgSemNavio,cx,50*T-60,W,120,0,50*T-60-cy,W,120);drawNavio(ctx,10*T+navioDX-cx,50*T+4-cy);} // o navio zarpando (antes do Markin e da galera, que estão a bordo)
  drawBondinho(ctx,cx,cy,time);
  const tx0=Math.floor(cx/T),ty0=Math.floor(cy/T);
  for(let y=ty0;y<=ty0+12;y++)for(let x=tx0;x<=tx0+21;x++){if(tileAt(x,y)!==WATER)continue;const k=Math.floor(time*2);if(h2(x,y,k)<.25){R(ctx,x*T+Math.floor(h2(x,y,k+1)*12)-cx,y*T+Math.floor(h2(y,x,k)*14)-cy,3,1,'#6fb3e8');}}
  const vis=(o,m=40)=>o.x>cx-m&&o.x<cx+W+m&&o.y>cy-m&&o.y<cy+H+m;
  const list=[];
  for(const l of lamps)if(vis(l))list.push({y:l.y,d:()=>drawLamp(ctx,l.x-cx,l.y-cy)});
  for(const s of busStops)if(vis(s))list.push({y:s.y,d:()=>drawBusStop(ctx,s.x-cx,s.y-cy)});
  for(const p of palms)if(vis(p))list.push({y:p.y,d:()=>drawPalm(ctx,p.x-cx,p.y-cy,time)});
  for(const k of kiosks)if(vis(k))list.push({y:k.y,d:()=>drawQuiosque(ctx,k.x-cx,k.y-cy)});
  if(vis(FESTA))list.push({y:FESTA.y,d:()=>drawFestaSpot(ctx,FESTA.x-cx,FESTA.y-cy,time)});
  if(vis(MARACA))list.push({y:MARACA.y,d:()=>drawMaracaSpot(ctx,MARACA.x-cx,MARACA.y-cy,time)});
  if(vis(ALT))list.push({y:ALT.y,d:()=>drawAltinhaSpot(ctx,ALT.x-cx,ALT.y-cy,time)});
  if(vis(SURF))list.push({y:SURF.y,d:()=>drawSurfSpot(ctx,SURF.x-cx,SURF.y-cy,time)});
  if(bloco&&vis(bloco,60))list.push({y:bloco.y,d:()=>drawBlocoSpot(ctx,bloco.x-cx,bloco.y-cy,time)});
  for(const c of chairs)if(vis(c)){list.push({y:c.y-2,d:()=>drawChair(ctx,c.x-cx,c.y-cy)});list.push({y:c.y+4,d:()=>drawUmbrella(ctx,c.x-cx-2,c.y-cy-4)});}
  for(const it of (items||[]))if(vis(it))list.push({y:it.y,d:()=>drawItem(ctx,it.type,it.x-cx,it.y-cy,time,it.aluc?(.55+.35*Math.sin(time*9)):1)});
  if(mom&&state!=='title')list.push({y:mom.y,d:()=>drawMom(ctx,mom.x-cx,mom.y-cy,{dir:mom.dir,frame:mom.moving?Math.floor(mom.anim*8)%4:0,chase:mom.chasing,angry:mom.chasing||mom.stun>0})});
  if(tias)for(const t of tias)if(vis(t))list.push({y:t.y,d:()=>drawTia(ctx,t.x-cx,t.y-cy,{dir:t.dir,frame:t.moving?Math.floor(t.anim*6)%4:0,alert:t.alert>0})});
  if(keysE)for(const k of keysE)if(vis(k))list.push({y:k.y,d:()=>drawKey(ctx,k.x-cx,k.y-cy,time)});
  for(const c of taxis)if(vis(c))list.push({y:c.y+6,d:()=>{drawTaxi(ctx,c,c.x-cx,c.y-cy);if(c.stuck>0)for(let i=0;i<4;i++){ctx.strokeStyle='rgba(240,240,255,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(c.x-cx-10+i*6,c.y-cy-8);ctx.lineTo(c.x-cx-4+i*3,c.y-cy+8);ctx.stroke();}}});
  if(boss&&finalStage===1&&vis(boss,80))list.push({y:boss.y,d:()=>{drawBossBloco(ctx,boss.x-cx,boss.y-cy,time);outlineText(ctx,'BLOCO DO JAMAL',boss.x-cx,boss.y-cy-50,7,'#ffe14f');}});
  for(const b of buddies)if(vis(b))list.push({y:b.y,d:()=>{drawBuddy(ctx,b.x-cx,b.y-cy,b,{frame:b.moving?Math.floor(b.anim*8)%4:0,t:time,dir:b.dir});
    if(b.banner)drawEstandarte(ctx,b.x-cx+6,b.y-cy-2,1,{t:time,topo:'BLOCO DO',base:'MARKIN',face:true});}});
  const pf=P.moving?Math.floor(P.anim*8)%4:0,respira=!P.moving&&!chairS&&!napS&&!grab&&Math.sin(time*2.6)>.2;
  list.push({y:P.y+(chairS?6:0),d:()=>{
    const py=P.y-cy-(P.jumpZ||0);
    if(P.jumpZ&&(P.escalando||P.queda||Math.abs(P.jumpZ-12)>1))R(ctx,P.x-cx-4,P.y-cy-1,8,2,'rgba(0,0,0,.25)'); // sombra no chão só subindo, descendo ou pulando (parado no telhado não)
    drawMarkin(ctx,P.x-cx,py,{dir:P.escalando?'up':P.dir,frame:P.escalando?Math.floor(time*12)%4:pf,outfit:P.outfit,helmet:P.helmet,glasses:fx&&fx.disguise>0,burn:fx&&fx.burn>0,sleep:!!chairS||!!napS,tired:P.energy<45,photo:true,phone:!!P.phoneOut||!!call,spider:fx&&fx.spider>0,breath:respira});}});
  for(const n of npcs)if(vis(n))list.push({y:n.y,d:()=>drawNpc(ctx,n,n.x-cx,n.y-cy)});
  list.sort((a,b)=>a.y-b.y);for(const o of list)o.d();
  if(navioDX===0)ctx.drawImage(navioTopo(),10*T-4-cx,50*T+4-56-cy);
  drawBandeira(ctx,cx,cy);drawBotoMar(ctx,cx,cy);
  for(const o of [mom,...(keysE||[])])if(o&&o.tonto>0&&vis(o)){const hx=o.x-cx,hy=o.y-cy-(o===mom?27:20);for(let i=0;i<3;i++){const a=time*5+i*2.1;outlineText(ctx,'★',hx+Math.cos(a)*7,hy+Math.sin(a)*2.5,6,['#ffe14f','#ffffff','#ff8fc2'][i]);}}
  for(const o of [mom,...keysE,...tias,...taxis,...npcs])if(o&&o.webUntil>time&&vis(o))drawWebWrap(ctx,o.x-cx,o.y-cy,o.h||20);
  for(const p of particles){const x=p.x-cx,y=p.y-cy;
    if(p.web){ctx.strokeStyle=`rgba(240,240,255,${clamp(p.life*3,0,1)})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(p.web.x-cx,p.web.y-cy);ctx.stroke();
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.beginPath();ctx.moveTo(p.web.x-cx,p.web.y-cy);ctx.lineTo(p.web.x-cx+Math.cos(a)*7,p.web.y-cy+Math.sin(a)*7);ctx.stroke();}}
    else if(p.text){ctx.globalAlpha=clamp(p.life,0,1);outlineText(ctx,p.text,x,y,9,p.col);ctx.globalAlpha=1;}
    else if(p.helmet){R(ctx,x-4,y-2,8,3,'#f5f5f5');R(ctx,x-5,y+1,10,1,'#d8d8d8');}
    else R(ctx,x,y,p.s,p.s,p.col);}
  if(state==='play'||state==='paused'||state==='over'){const a=nightA();if(a>.01)drawNight(a,cx,cy);}
  if(state==='play'){
    const hx=HOME.x-cx,hy=HOME.y-10-cy;
    if(dist(P,HOME)<260){ // só aparece perto de casa: casinha com sinal de proibido
      const on=!(hx<0||hx>W||hy<0||hy>H),ax=on?hx:clamp(hx,10,W-10),ay=on?hy+2:clamp(hy,48,H-10),pul=Math.sin(time*6)>0;
      R(ctx,ax-8,ay-9,16,17,'rgba(7,11,20,.7)');drawHouseIcon(ctx,ax,ay-1);
      ctx.strokeStyle=pul?'#ff4f4f':'#c2152a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ax,ay-1,7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(ax-5,ay-6);ctx.lineTo(ax+5,ay+4);ctx.stroke();ctx.lineWidth=1;
      if(on)outlineText(ctx,'NÃO!',ax,ay-12,7,'#ff4f4f');}
    // a mãe vindo atrás: aviso na borda da tela apontando de onde ela vem
    if(mom&&mom.chasing&&!(grab&&grab.kind==='mae')){const mx=mom.x-cx,my=mom.y-14-cy;
      if(mx<0||mx>W||my<0||my>H){const ax=clamp(mx,14,W-14),ay=clamp(my,50,H-12),blink=Math.sin(time*10)>0;
        R(ctx,ax-12,ay-9,24,16,blink?'#d9579a':'#7a1f4a');outlineText(ctx,'MÃE',ax,ay+3,8,'#ffffff');}}
    // fase final: seta pro chefão ou pro barco
    const goal=finalStage===1&&boss?{p:boss,txt:'CHEFÃO',col:'#ffe14f',dark:'#7a5a00'}:finalStage===2?{p:DOCKP,txt:'BARCO',col:'#4fd8ff',dark:'#1f6a8a'}:null;
    if(goal){const gx=goal.p.x-cx,gy=goal.p.y-20-cy;
      if(gx<0||gx>W||gy<0||gy>H){const ax=clamp(gx,22,W-22),ay=clamp(gy,52,H-14),blink=Math.sin(time*6)>0;
        R(ctx,ax-19,ay-9,38,16,blink?goal.col:goal.dark);outlineText(ctx,goal.txt,ax,ay+3,8,blink?'#1a1030':'#ffffff',undefined,null);}
      else if(finalStage===2){const bob=Math.sin(time*5)*2;drawShipIcon(ctx,gx,gy-10+bob);outlineText(ctx,'EMBARCA AQUI',gx,gy-20+bob,6,'#4fd8ff');}}
  }
  if(flash>0){ctx.fillStyle=`rgba(255,255,255,${clamp(flash,0,.6)})`;ctx.fillRect(0,0,W,H);}
  if(grab&&state==='play'){const p=clamp(1-grab.left/grab.need,0,1),bw=150,bx=(W-bw)/2,by=118;
    outlineText(ctx,grab.kind==='mae'?'A MÃE TE PEGOU PELO BRAÇO!':'A CHAVE TE PRENDEU!',W/2,100,12,'#ff6b5d');
    outlineText(ctx,isTouch?'toque rápido no botão SOLTA! pra se soltar':'aperte ESPAÇO várias vezes pra se soltar',W/2,112,8,'#fff1c2');
    R(ctx,bx-1,by-1,bw+2,8,'#000');R(ctx,bx,by,bw,6,'#3a1a1a');R(ctx,bx,by,bw*p,6,p>.7?'#8be08b':'#ffb347');}
  renderHead(cx,cy);
  if(state==='tempo')renderTempo();
  if(state==='virando')renderVirando();
  // de madrugada (3h às 6h) a tela vai fechando em volta do Markin até virar o dia
  if((state==='play')&&!grab){const h=hourF();if(h>=3&&h<6){const p=(h-3)/3;iris(400-330*Math.pow(p,1.3),P.x-cx,P.y-14-cy);}}
  if(state==='capitulo'&&cap)renderCapitulo(cx,cy);
}
const dk=document.createElement('canvas');dk.width=W;dk.height=H;const dc=dk.getContext('2d');
function lightHole(wx,wy,r,cx,cy){const x=wx-cx,y=wy-cy;if(x<-r||x>W+r||y<-r||y>H+r)return;const g=dc.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.6,'rgba(0,0,0,.7)');g.addColorStop(1,'rgba(0,0,0,0)');dc.fillStyle=g;dc.fillRect(x-r,y-r,r*2,r*2);}
function drawNight(a,cx,cy){
  dc.globalCompositeOperation='source-over';dc.clearRect(0,0,W,H);dc.fillStyle=`rgba(8,12,38,${a})`;dc.fillRect(0,0,W,H);
  dc.globalCompositeOperation='destination-out';
  lightHole(P.x,P.y-10,44,cx,cy);for(const l of lamps)lightHole(l.x,l.y-14,30,cx,cy);
  ctx.drawImage(dk,0,0);
  ctx.globalCompositeOperation='lighter';
  for(const l of lamps){const x=l.x-cx,y=l.y-14-cy;if(x<-30||x>W+30||y<-30||y>H+30)continue;const g=ctx.createRadialGradient(x,y,0,x,y,26);g.addColorStop(0,`rgba(255,170,70,${.22*a})`);g.addColorStop(1,'rgba(255,170,70,0)');ctx.fillStyle=g;ctx.fillRect(x-26,y-26,52,52);}
  ctx.globalCompositeOperation='source-over';
}

/* ================= O SAX E A MÚSICA DO TEMPO ================= */
// o sax vem do Bloco Secreto; a Música do Tempo, só o Cria do Santo Amaro ensina (no labirinto da favela).
// tocada certinho na hora de perder, ela volta o relógio 48h. Cada vez quebra uma palheta (3 no começo).
const K7890=GT_KEYS;
const TECLA=['7','8','9','0'];
const MUSICA_TEMPO=[0,2,1,3,0,0]; // 7 9 8 0 7 7
const FAVELA_ENT={x:3*T+8,y:21*T+12,h:30}; // escadaria do Santo Amaro
let sabeMusica=false,palhetas=3,usosTempo=0,diaSnap={},tempoS=null,palhetaT=60;
const temSax=()=>!!(tasksDone&&tasksDone.bloco);
// cena depois do Bloco Secreto: o mestre entrega o sax e conta a lenda
function* saxGen(){
  P.mode='cut';P.dir='down';yield* wait(.3);
  yield* talk('Mestre do Bloco','Achou a gente, menino. Pouca gente acha o Bloco Secreto.');
  yield* talk('Mestre do Bloco','Toma. Esse sax já puxou mais música do que tu tem de vida.');
  yield* talk('Markin','Um sax... pra mim?');
  yield* talk('Mestre do Bloco','Tu conhece a Guerra dos Músicos? Quando a música acaba, quem puxa a próxima leva o bloco.');
  yield* talk('Markin','Eu sempre contei essa história! Ninguém acreditava em mim.');
  yield* talk('Mestre do Bloco','Pois é verdade. E tem mais: esse sax guarda a Música do Tempo. Quem toca, volta dois dias.');
  yield* talk('Mestre do Bloco','Mas só a galera do Santo Amaro sabe tocar. Fala com o Cria lá na escadaria da favela.');
  yield* talk('Markin','Santo Amaro... Bora.');
}
function podeVoltar(reason){return ['energy','sono','door'].includes(reason)&&temSax()&&sabeMusica&&palhetas>0;}
function abreTempo(reason){
  closeBeg();interruptRest();grab=null;call=null;$('phone').hidden=true;setPrompt(null);clearBubbles();
  $('hud').hidden=true;$('toast').hidden=true;$('banner').hidden=true;
  state='tempo';tempoS={reason,phase:'pergunta',t:0,notes:[],miss:0,press:[0,0,0,0],fimT:0};sfx.alert();}
function updTempo(dt){const s=tempoS;s.t+=dt;for(let i=0;i<4;i++)s.press[i]=Math.max(0,s.press[i]-dt);const act=takeAction();
  if(s.phase==='pergunta'){if(act&&s.t>.4){const gap=.55*Math.pow(.85,usosTempo); // a cada uso a música fica mais rápida
      s.phase='toca';s.t=0;s.miss=0;s.notes=MUSICA_TEMPO.map((l,i)=>({lane:l,t:1.4+i*gap,hit:false,miss:false}));}return;}
  if(s.phase==='toca'){for(const n of s.notes)if(!n.hit&&!n.miss&&s.t-n.t>.18){n.miss=true;s.miss++;beep(110,.15,'sawtooth',.05,70);}
    const ult=s.notes[s.notes.length-1];if(s.t>ult.t+.5){s.phase='fim';s.fimT=1.8;s.ok=s.miss<=1;if(s.ok)sfx.win();else sfx.lose();}return;}
  if(s.phase==='fim'){s.fimT-=dt;if(s.fimT<=0){if(s.ok)voltaNoTempo(s.reason);else{state='play';$('hud').hidden=false;gameOver(s.reason,true);}}}}
function tempoPress(ln){const s=tempoS;if(state!=='tempo'||!s||s.phase!=='toca')return;s.press[ln]=.15;
  let best=null,bd=.2;for(const n of s.notes){if(n.hit||n.miss||n.lane!==ln)continue;const d=Math.abs(n.t-s.t);if(d<bd){bd=d;best=n;}}
  if(best){best.hit=true;beep(GT_SCALE[[2,4,5,7][ln]],.3,'sawtooth',.04);beep(GT_SCALE[[2,4,5,7][ln]]*2,.15,'square',.012);}
  else{s.miss++;beep(150,.08,'square',.03);}}
function tempoDesiste(){if(state!=='tempo')return;const r=tempoS.reason;state='play';$('hud').hidden=false;gameOver(r,true);}
function voltaNoTempo(reason){
  palhetas--;usosTempo++;
  totalMin=Math.max(0,totalMin-2880);day=Math.min(15,Math.floor(totalMin/1440)+1);lastDay=day;
  for(const k in diaSnap)if(+k>day)delete diaSnap[k];
  const sn=diaSnap[day]||{energy:P.energy,sono:P.sono};
  P.energy=Math.min(maxE(),Math.max(50,sn.energy));P.sono=Math.min(50,sn.sono); // no mínimo metade da energia e no máximo metade do sono
  if(reason==='door'){P.x=4*T+8;P.y=47*T+10;}
  state='play';P.mode='free';$('hud').hidden=false;saidaSegura();tregua=8;flash=.8;shake=.4;
  banner('VOLTOU 2 DIAS',`Dia ${day} · palhetas: ${palhetas}/3`,3);}
function renderTempo(){const g=ctx,s=tempoS;headCv.hidden=true;
  g.fillStyle='rgba(10,6,20,.84)';g.fillRect(0,0,W,H);
  outlineText(g,'MÚSICA DO TEMPO',W/2,26,14,'#ffe14f');
  const pal='●'.repeat(palhetas)+'○'.repeat(Math.max(0,3-palhetas));
  if(s.phase==='pergunta'){
    outlineText(g,{energy:'A energia acabou...',sono:'O sono venceu...',door:'Chegou na porta de casa...'}[s.reason],W/2,52,9,'#ff6b5d');
    outlineText(g,'Tocar o sax e voltar 2 dias?',W/2,72,9,'#f3ecd8');
    outlineText(g,'palhetas '+pal,W/2,88,8,'#ffe14f');
    outlineText(g,'a música: '+MUSICA_TEMPO.map(l=>TECLA[l]).join(' '),W/2,104,8,'#4fffd2');
    if(isTouch){R(g,40,128,110,30,'#2f9a55');outlineText(g,'TOCAR',95,147,10,'#ffffff');R(g,170,128,110,30,'#8a2a2a');outlineText(g,'DESISTIR',225,147,10,'#ffffff');}
    else outlineText(g,'ESPAÇO toca · ESC desiste',W/2,146,9,'#fff1c2');
    return;}
  const hitY=146;
  for(const n of s.notes){if(n.hit)continue;const y=hitY-(n.t-s.t)*90;if(y<34||y>H+8)continue;const x=gtLaneX(n.lane);
    if(n.miss)g.globalAlpha=.3;g.fillStyle='#1a0e04';g.beginPath();g.arc(x,y,8,0,Math.PI*2);g.fill();g.fillStyle=GT_COL[n.lane];g.beginPath();g.arc(x,y,7,0,Math.PI*2);g.fill();g.globalAlpha=1;}
  for(let i=0;i<4;i++){const x=gtLaneX(i),on=s.press[i]>0;g.fillStyle='#8a6a10';g.beginPath();g.arc(x,hitY,11,0,Math.PI*2);g.fill();g.fillStyle=on?'#ffffff':'#f7efe0';g.beginPath();g.arc(x,hitY,9,0,Math.PI*2);g.fill();
    g.fillStyle=GT_COL[i];g.globalAlpha=on?1:.55;g.beginPath();g.arc(x,hitY,6,0,Math.PI*2);g.fill();g.globalAlpha=1;if(!isTouch)outlineText(g,TECLA[i],x,hitY+20,8,'#ffe89a');}
  outlineText(g,'erros '+s.miss+'/1',W-10,44,8,s.miss>1?'#ff6b5d':'#f3ecd8','right');
  if(s.phase==='fim')outlineText(g,s.ok?'O TEMPO VOLTOU!':'DESAFINOU...',W/2,90,14,s.ok?'#8be08b':'#ff6b5d');}

/* ================= LABIRINTO DO SANTO AMARO: achar o Cria nos becos ================= */
const LB={B:9,COLS:15,ROWS:9}; // blocos de 9px; o labirinto tem 15x9 becos
const LB_CORES=['#c2452f','#e0a02a','#2d6fd1','#3fa35a','#d8c8a8','#9b76d6','#e8826a'];
const CRIA_LOOK={skin:'#b8733f',hair:'#1e140e',shirt:'#e8826a',shorts:'#2d6fd1'}; // o Tavin, perdido nos becos
function startLabirinto(){
  mgEnter('labirinto');
  const C=LB.COLS,Rr=LB.ROWS,GW=C*2+1,GH=Rr*2+1,grid=[];for(let y=0;y<GH;y++){grid.push([]);for(let x=0;x<GW;x++)grid[y].push(true);}
  const vis=new Set(),pilha=[[0,Rr-1]];vis.add('0,'+(Rr-1));grid[(Rr-1)*2+1][1]=false;
  while(pilha.length){const [cx,cy]=pilha[pilha.length-1];const viz=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[cx+dx,cy+dy,dx,dy]).filter(([x,y])=>x>=0&&y>=0&&x<C&&y<Rr&&!vis.has(x+','+y));
    if(!viz.length){pilha.pop();continue;}const [nx,ny,dx,dy]=pick(viz);vis.add(nx+','+ny);grid[cy*2+1+dy][cx*2+1+dx]=false;grid[ny*2+1][nx*2+1]=false;pilha.push([nx,ny]);}
  // o Cria fica no beco mais longe da entrada
  const dist0={},fila=[[1,(Rr-1)*2+1]];dist0[fila[0]]=0;let longe=fila[0];
  while(fila.length){const p=fila.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const q=[p[0]+dx,p[1]+dy];if(grid[q[1]]&&grid[q[1]][q[0]]===false&&dist0[q]===undefined){dist0[q]=dist0[p]+1;fila.push(q);if(dist0[q]>dist0[longe])longe=q;}}}
  mg={t:0,phase:'anda',grid,GW,GH,ox:Math.floor((W-GW*LB.B)/2),oy:Math.floor((H-GH*LB.B)/2)+2,me:{gx:1,gy:(Rr-1)*2+1,x:1,y:(Rr-1)*2+1,dir:'right'},cria:{gx:longe[0],gy:longe[1]},moveCd:0,
    falas:null,fi:0,ens:{i:-1,t:0},seq:[],press:[0,0,0,0],msg:'Ache o Tavin nos becos do Santo Amaro!',msgT:3,result:null,done:0,moving:false,anim:0,cv:null,dica:null};
  const cam=labCaminho(grid,[1,(Rr-1)*2+1],[longe[0],longe[1]]);
  mg.gente=[['trafica',.34],['mulher',.68]].map(([k,f])=>{const p=cam[Math.max(2,Math.floor(cam.length*f))]||cam[2];return{k,gx:p[0],gy:p[1],falou:false};});}
// gente no meio dos becos: cada um tem uma resposta que ajuda (mostra o caminho) e uma que atrapalha (volta pra entrada)
const LB_GENTE={
  trafica:{nome:'Traficante',look:{skin:'#8a5a3a',hair:'#1e140e',shirt:'#1d1d22',shorts:'#2d6fd1',cap:'#d0202a'},
    falas:[['Markin','Vc viu o Tavin aí, brother?'],['Traficante','Se eu ver eu mato ele, pagou o Lança com nota falsa na boca, irmão, acredita??']],
    a:[['Nota falsa?! Aí não, né, irmão.','Né não? Vi ele correndo pra lá. Se achar, avisa que o patrão tá esperando.','dica'],
       ['Pô, pega leve com o moleque...','Pega leve? Tá defendendo caloteiro? VAZA DAQUI!','expulsa']]},
  mulher:{nome:'Mulher do chefe',look:{skin:'#c98c64',hair:'#e8c070',shirt:'#ff4fa0',shorts:'#ff4fa0',skirt:true,long:true,earring:true},
    falas:[['Mulher do chefe','Ih, olha só quem apareceu nos becos... Tu não é daqui, né? Gostei dessa corrente.']],
    a:[['E tu, gata? Sozinha num beco escuro desses?','Sozinha não, meu marido é o dono da boca... MÔ! VEM VER QUEM TÁ ME CANTANDO!','expulsa'],
       ['Valeu, mas tô na missão: procurando o Tavin.','Respeitador, hein? Gostei. O Tavin passou correndo pra lá, todo assustado.','dica']]}};
// caminho mais curto entre duas casas do labirinto
function labCaminho(grid,a,b){const pai={},k=p=>p[0]+','+p[1],fila=[a];pai[k(a)]=null;
  while(fila.length){const p=fila.shift();if(p[0]===b[0]&&p[1]===b[1])break;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const q=[p[0]+dx,p[1]+dy];if(grid[q[1]]&&grid[q[1]][q[0]]===false&&!(k(q) in pai)){pai[k(q)]=p;fila.push(q);}}}
  const out=[];let p=b;while(p&&k(p) in pai){out.unshift(p);p=pai[k(p)];}return out;}
const LB_FALAS=[['Tavin','Coeee, Markin?? PQP cara você me salvou! Me leva cntg que eu te ensino uma música maneira nessa parada aí. Não aguento mais bafar'],
  ['Tavin','É a Música do Tempo. Toca certinho no sax e o relógio volta dois dias.'],['Tavin','Mas a palheta não aguenta: cada vez que tu toca, uma quebra. Usa só quando for apagar.'],
  ['Tavin','Presta atenção que eu vou tocar. Depois é contigo.']];
function updLabirinto(dt){
  const m=mg;m.t+=dt;m.msgT-=dt;for(let i=0;i<4;i++)m.press[i]=Math.max(0,m.press[i]-dt);const inp=mgInput();
  if(m.result){m.done-=dt;if(m.done<=0){sabeMusica=true;mgExit('Resgatou o Tavin e aprendeu a Música do Tempo: 7 9 8 0 7 7. Quando for apagar, o sax te salva.','good',10,120);}return;}
  const me=m.me;me.x+=(me.gx-me.x)*Math.min(1,dt*16);me.y+=(me.gy-me.y)*Math.min(1,dt*16);
  if(m.phase==='anda'){m.moveCd-=dt;
    let iy=0;if(keys.has('ArrowUp')||keys.has('KeyW'))iy-=1;if(keys.has('ArrowDown')||keys.has('KeyS'))iy+=1;if(Math.abs(joy.y)>.5)iy=Math.sign(joy.y);
    let dx=0,dy=0;if(Math.abs(inp.ix)>.5)dx=Math.sign(inp.ix);else if(iy)dy=iy;
    m.moving=!!(dx||dy);if(m.moving)m.anim+=dt;
    if((dx||dy)&&m.moveCd<=0){if(dx)me.dir=dx>0?'right':'left';else me.dir=dy>0?'down':'up';
      if(!m.grid[me.gy+dy][me.gx+dx]){me.gx+=dx;me.gy+=dy;m.moveCd=.11;}}
    m.dica&&(m.dica.t-=dt);if(m.dica&&m.dica.t<=0)m.dica=null;
    for(const p of m.gente)if(!p.falou&&Math.abs(me.gx-p.gx)+Math.abs(me.gy-p.gy)<=1){p.falou=true;m.moving=false;m.phase='conversa';m.cv={p,g:LB_GENTE[p.k],fi:0,fase:'falas',sel:0,t0:m.t,lastIy:0};return;}
    if(Math.abs(me.gx-m.cria.gx)+Math.abs(me.gy-m.cria.gy)<=1){m.phase='fala';m.falas=LB_FALAS;m.fi=0;m.falaT=m.t;m.moving=false;sfx.alert();}
    return;}
  if(m.phase==='conversa'){const cv=m.cv;
    let iy=0;if(keys.has('ArrowUp')||keys.has('KeyW'))iy=-1;else if(keys.has('ArrowDown')||keys.has('KeyS'))iy=1;else if(Math.abs(joy.y)>.5)iy=Math.sign(joy.y);
    if(cv.fase==='escolha'&&iy&&iy!==cv.lastIy)cv.sel=1-cv.sel;cv.lastIy=iy;
    if(inp.act&&m.t-cv.t0>.3){cv.t0=m.t;
      if(cv.fase==='falas'){cv.fi++;if(cv.fi>=cv.g.falas.length)cv.fase='escolha';}
      else if(cv.fase==='escolha')labEscolhe(cv.sel);
      else{m.phase='anda';m.cv=null;labEfeito(cv.ef);}}
    return;}
  if(m.phase==='fala'){if(inp.act&&m.t-m.falaT>.3){m.fi++;m.falaT=m.t;if(m.fi>=m.falas.length){m.phase='ensina';m.ens={i:-1,t:-.6};}}return;}
  if(m.phase==='ensina'){m.ens.t+=dt;const i=Math.floor(m.ens.t/.95); // o Cria toca devagar, uma nota de cada vez
    if(i>m.ens.i&&i<MUSICA_TEMPO.length){m.ens.i=i;const ln=MUSICA_TEMPO[i];m.press[ln]=.7;beep(GT_SCALE[[2,4,5,7][ln]],.6,'sawtooth',.04);}
    if(i>=MUSICA_TEMPO.length+1){m.phase='repete';m.seq=[];m.msg='Agora tu! '+(isTouch?'Toque nas cores':'Teclas 7 8 9 0');m.msgT=99;}return;}}
function labEscolhe(i){const m=mg,cv=m.cv;if(!cv||cv.fase!=='escolha')return;const [,resp,ef]=cv.g.a[i];cv.fase='resp';cv.resp=resp;cv.ef=ef;cv.t0=m.t;}
function labEfeito(ef){const m=mg;
  if(ef==='dica'){m.dica={t:7,path:labCaminho(m.grid,[m.me.gx,m.me.gy],[m.cria.gx,m.cria.gy])};m.msg='Segue os pontinhos!';m.msgT=2.4;sfx.pick();}
  else if(ef==='expulsa'){const R2=LB.ROWS;m.me.gx=m.me.x=1;m.me.gy=m.me.y=(R2-1)*2+1;flash=.6;shake=.4;sfx.hit();m.msg='Correu de volta pra entrada dos becos!';m.msgT=2.6;}}
function labPress(ln){const m=mg;if(state!=='labirinto'||!m||m.phase!=='repete'||m.result)return;m.press[ln]=.2;
  beep(GT_SCALE[[2,4,5,7][ln]],.3,'sawtooth',.04);
  if(ln===MUSICA_TEMPO[m.seq.length]){m.seq.push(ln);if(m.seq.length>=MUSICA_TEMPO.length){m.result='win';m.done=2.6;m.msg='APRENDEU A MÚSICA DO TEMPO!';m.msgT=2.6;sfx.win();}}
  else{beep(120,.2,'sawtooth',.05,80);m.msg='Errou! Escuta de novo.';m.msgT=1.6;m.phase='ensina';m.ens={i:-1,t:-1};}}
function renderLabirinto(){
  const g=ctx,m=mg,B=LB.B,t=m.t;R(g,0,0,W,H,'#14101c');
  for(let y=0;y<m.GH;y++)for(let x=0;x<m.GW;x++){const px=m.ox+x*B,py=m.oy+y*B;
    if(m.grid[y][x]){const c=LB_CORES[Math.floor(h2(x,y,61)*LB_CORES.length)];R(g,px,py,B,B,c);R(g,px,py,B,2,'rgba(255,255,255,.18)');R(g,px,py+B-1,B,1,'rgba(0,0,0,.35)');if(h2(x,y,62)>.6)R(g,px+3,py+3,3,3,'#2a3a5a');}
    else{R(g,px,py,B,B,'#5a544c');if(h2(x,y,63)>.8)R(g,px+2,py+4,4,1,'#4a4540');}}
  const cr=m.cria;g.save();g.translate(m.ox+cr.gx*B+B/2,m.oy+cr.gy*B+B-1);g.scale(.5,.5);drawBuddy(g,0,0,CRIA_LOOK,{dir:'down',frame:0,t});g.restore();
  for(const p of m.gente){g.save();g.translate(m.ox+p.gx*B+B/2,m.oy+p.gy*B+B-1);g.scale(.5,.5);drawBuddy(g,0,0,LB_GENTE[p.k].look,{dir:'down',frame:0,t});g.restore();}
  const me=m.me;g.save();g.translate(m.ox+me.x*B+B/2,m.oy+me.y*B+B-1);g.scale(.5,.5);drawMarkin(g,0,0,{dir:me.dir,frame:m.moving?Math.floor(m.anim*10)%4:0,outfit:P.outfit});g.restore();
  // becos escuros: só enxerga em volta do Markin (o Cria aparece quando tu chega perto)
  if(m.phase==='anda'||m.phase==='conversa'){dc.globalCompositeOperation='source-over';dc.clearRect(0,0,W,H);dc.fillStyle='#000';dc.fillRect(0,0,W,H);dc.globalCompositeOperation='destination-out'; // breu total: só a luz em volta do Markin
    const lx=m.ox+me.x*B+B/2,ly=m.oy+me.y*B+B/2,gr=dc.createRadialGradient(lx,ly,0,lx,ly,34);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.6,'rgba(0,0,0,.8)');gr.addColorStop(1,'rgba(0,0,0,0)');dc.fillStyle=gr;dc.fillRect(0,0,W,H);
    dc.globalCompositeOperation='source-over';g.drawImage(dk,0,0);}
  if(m.dica){g.globalAlpha=Math.min(1,m.dica.t);for(const [x,y] of m.dica.path){const k=Math.sin(t*6-(x+y)*.5)*.5+.5;R(g,m.ox+x*B+B/2-1,m.oy+y*B+B/2-1,2,2,k>.5?'#ffe14f':'#ff9a3d');}g.globalAlpha=1;}
  if(m.phase==='conversa'&&m.cv){const cv=m.cv,linha=cv.fase==='falas'?cv.g.falas[cv.fi]:cv.fase==='resp'?[cv.g.nome,cv.resp]:cv.g.falas[cv.g.falas.length-1];
    const ls=wrapTxt(linha[0]+': '+linha[1],40),hOp=cv.fase==='escolha'?26:0,y0=118-hOp;
    R(g,30,y0,260,14+ls.length*11+hOp,'rgba(10,6,20,.94)');R(g,30,y0,260,1,'#ffe14f');
    ls.forEach((s,i)=>outlineText(g,s,W/2,y0+12+i*11,7,linha[0]==='Markin'?'#8be08b':'#ffffff'));
    if(cv.fase==='escolha')cv.g.a.forEach((o,i)=>{const y=y0+16+ls.length*11+i*12,sel=cv.sel===i;R(g,38,y-8,244,11,sel?'#2a1a40':'#1d1230');if(sel)R(g,38,y-8,244,1,'#ffe14f');outlineText(g,(sel?'▸ ':'  ')+o[0],42,y,6,sel?'#ffe14f':'#f3ecd8','left');});
    else outlineText(g,isTouch?'toque ▸':'ESPAÇO ▸',284,y0+10+ls.length*11,6,'#ffe14f','right');}
  if(m.phase==='fala'){const [quem,txt]=m.falas[m.fi],ls=wrapTxt(quem+': '+txt,40);R(g,30,118,260,14+ls.length*11,'rgba(10,6,20,.94)');R(g,30,118,260,1,'#ffe14f');
    ls.forEach((s,i)=>outlineText(g,s,W/2,130+i*11,7,'#ffffff'));outlineText(g,isTouch?'toque ▸':'ESPAÇO ▸',284,128+ls.length*11,6,'#ffe14f','right');}
  if(m.phase==='ensina'||m.phase==='repete'||m.result){R(g,96,140,128,38,'rgba(10,6,20,.9)');
    for(let i=0;i<4;i++){const x=gtLaneX(i),on=m.press[i]>0;g.fillStyle=on?'#ffffff':'#f7efe0';g.beginPath();g.arc(x,156,10,0,Math.PI*2);g.fill();g.fillStyle=GT_COL[i];g.globalAlpha=on?1:.5;g.beginPath();g.arc(x,156,7,0,Math.PI*2);g.fill();g.globalAlpha=1;
      if(!isTouch)outlineText(g,TECLA[i],x,175,7,'#ffe89a');}
    if(m.phase==='repete')for(let i=0;i<MUSICA_TEMPO.length;i++)R(g,128+i*11,145,7,3,i<m.seq.length?'#8be08b':'#3a3050');}
  outlineText(g,'BECOS DO SANTO AMARO',W/2,10,7,'#ffe14f');
  if(m.msgT>0&&m.phase!=='fala')outlineText(g,m.msg,W/2,22,8,m.result?'#8be08b':'#ffffff');}

/* ================= CONTROLE (gamepad): vira teclas do teclado; tela pra configurar qualquer controle ================= */
const CTRL_PASSOS=[['cima','CIMA (direcional)'],['baixo','BAIXO (direcional)'],['esq','ESQUERDA (direcional)'],['dir','DIREITA (direcional)'],
  ['acao','AÇÃO / FALAR / PULAR (A)'],['correr','CORRER (B)'],['teia','TEIA DO HOMEM-ARANHA (X)'],['recusa','RECUSAR LIGAÇÃO (Y)'],['pausa','PAUSAR (Start)'],['sair','SAIR DO DESAFIO (Select)']];
const CTRL_PADRAO={cima:{b:12},baixo:{b:13},esq:{b:14},dir:{b:15},acao:{b:0},correr:{b:1},teia:{b:2},recusa:{b:3},pausa:{b:9},sair:{b:8}};
const CTRL_TECLA={cima:'ArrowUp',baixo:'ArrowDown',esq:'ArrowLeft',dir:'ArrowRight',acao:'Space',correr:'ShiftLeft',teia:'KeyQ',recusa:'KeyR',pausa:'KeyP',sair:'Escape'};
const CTRL_COR={acao:'Digit7',correr:'Digit8',recusa:'Digit9',teia:'Digit0'}; // nos jogos das 4 cores: A verde, B vermelho, Y amarelo, X azul
let ctrlMapa=null,ctrlCfg=null,ctrlAviso=false;const ctrlSoltar={};
try{ctrlMapa=JSON.parse(localStorage.getItem('svpc-controle')||'null');}catch(e){}
const ctrlPad=()=>{try{return [...navigator.getGamepads()].find(p=>p)||null;}catch(e){return null;}};
// lê um "botão" do mapa: botão de verdade ou eixo (alguns controles baratos mandam o direcional como eixo)
function ctrlLe(gp,m){if(!m)return false;if(m.b!==undefined)return !!(gp.buttons[m.b]&&gp.buttons[m.b].pressed);if(m.a!==undefined)return (gp.axes[m.a]||0)*m.s>.5;return false;}
function ctrlTecla(code,down){window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code}));}
const ctrlCores=()=>state==='guitarra'||state==='tempo'||(state==='labirinto'&&mg&&mg.phase==='repete');
function ctrlPoll(){const gp=ctrlPad();if(!gp)return;
  if(!ctrlAviso){ctrlAviso=true;if(screenEl.hidden)toast('Controle conectado! Pra configurar os botões: menu > Controle.','',3.4);}
  if(ctrlCfg){ctrlCfgPoll(gp);return;}
  const mapa=ctrlMapa||CTRL_PADRAO;
  for(const [acao] of CTRL_PASSOS){let on=ctrlLe(gp,mapa[acao]);
    if(acao==='cima')on=on||(gp.axes[1]||0)<-.5;if(acao==='baixo')on=on||(gp.axes[1]||0)>.5;if(acao==='esq')on=on||(gp.axes[0]||0)<-.5;if(acao==='dir')on=on||(gp.axes[0]||0)>.5; // analógico esquerdo sempre anda
    if(on&&!ctrlSoltar[acao]){const code=(ctrlCores()&&CTRL_COR[acao])||CTRL_TECLA[acao];ctrlSoltar[acao]=code;ctrlTecla(code,true);}
    else if(!on&&ctrlSoltar[acao]){ctrlTecla(ctrlSoltar[acao],false);ctrlSoltar[acao]=null;}}}
// tela de configurar: um botão de cada vez
function abreCtrlCfg(volta){const gp=ctrlPad();ctrlCfg={i:0,volta,mapa:{...(ctrlMapa||CTRL_PADRAO)},esperaSoltar:true};ctrlCfgTela(gp?'':'Conecte o controle no USB e aperte qualquer botão.');}
function ctrlCfgTela(aviso){const [,nome]=CTRL_PASSOS[ctrlCfg.i];
  showScreen(`<div class="card"><div class="kicker">configurar controle · ${ctrlCfg.i+1}/${CTRL_PASSOS.length}</div><h2>CONTROLE</h2><p>Aperte no controle o botão pra:</p><p class="stats" style="font-size:1.3em">${nome}</p>${aviso?`<p>${aviso}</p>`:''}
  <div class="btns"><button data-act="ctrlPula" class="ghost" type="button">Pular este</button><button data-act="ctrlPadrao" class="ghost" type="button">Usar padrão</button><button data-act="ctrlSai" class="ghost" type="button">Cancelar</button></div></div>`);}
function ctrlCfgPoll(gp){const c=ctrlCfg;
  const algum=gp.buttons.some(b=>b.pressed)||gp.axes.some(v=>Math.abs(v)>.5);
  if(c.esperaSoltar){if(!algum)c.esperaSoltar=false;return;}
  let pego=null;gp.buttons.forEach((b,i)=>{if(!pego&&b.pressed)pego={b:i};});
  if(!pego)gp.axes.forEach((v,i)=>{if(!pego&&Math.abs(v)>.6)pego={a:i,s:Math.sign(v)};});
  if(pego){c.mapa[CTRL_PASSOS[c.i][0]]=pego;beep(880,.08,'square',.05);ctrlCfgProx();}}
function ctrlCfgProx(){const c=ctrlCfg;c.i++;c.esperaSoltar=true;
  if(c.i>=CTRL_PASSOS.length){ctrlMapa=c.mapa;try{localStorage.setItem('svpc-controle',JSON.stringify(ctrlMapa));}catch(e){}const v=c.volta;ctrlCfg=null;
    showScreen(`<div class="card"><h2>CONTROLE PRONTO!</h2><p>Os botões ficaram salvos neste navegador.</p><div class="btns"><button data-act="ctrlFim" data-v="${v}" type="button">OK</button></div></div>`);}
  else ctrlCfgTela('');}
function ctrlCfgSai(v){ctrlCfg=null;if(v==='pause')pause();else goTitle();}

/* ================= LOOP ================= */
let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  try{update(dt);render();}catch(err){console.error(err);}
  requestAnimationFrame(loop);
}

/* ================= LEGEND SPRITES ================= */
function legend(){
  document.querySelectorAll('canvas[data-spr]').forEach(c=>{
    const g=c.getContext('2d');const s=c.dataset.spr;
    c.width=24;c.height=24;g.imageSmoothingEnabled=false;
    if(['zip','shroom','beer','shades','shroomAranha','shroomGold','shroomRoxo'].includes(s))drawItem(g,s,12,19,0);
    else if(s==='amigo')drawBuddy(g,12,23,BUDDY_DEFS.altinha,{t:0});
    else if(s==='boss')drawMestre(g,12,24,{t:0});
    else if(s==='barco')drawShipIcon(g,12,14);
    else if(s==='bus')drawBusStop(g,10,23);
    else if(s==='chair'){drawChair(g,10,22);}
    else if(s==='mom')drawMom(g,12,24,{chase:true,angry:true});
    else if(s==='tia')drawTia(g,12,24,{});
    else if(s==='key')drawKey(g,12,20,0);
    else if(s==='phone')drawPhoneIcon(g,12,12);
    else if(s==='house')drawHouseIcon(g,12,12);
    else if(s==='festa'){g.save();g.scale(.4,.4);drawGatinha(g,0,0,'smile');g.restore();}
    else if(s==='maraca'){g.fillStyle='#f4f4f4';g.beginPath();g.arc(12,12,8,0,Math.PI*2);g.fill();R(g,10,10,4,4,'#1a1a1a');R(g,5,9,2,3,'#1a1a1a');R(g,17,9,2,3,'#1a1a1a');R(g,10,17,4,2,'#1a1a1a');}
    else if(s==='mendigo')drawBuddy(g,12,23,NPC_DEFS.find(d=>d.k==='mendigo').look,{t:0});
    else if(s==='taxi')drawTaxi(g,{dir:[1,0],chase:false},12,12);
    else if(s==='clock'){g.fillStyle='#f4f1e8';g.beginPath();g.arc(12,12,8,0,Math.PI*2);g.fill();R(g,11,6,2,7,'#1a1422');R(g,11,11,5,2,'#1a1422');R(g,15,3,5,4,'#8be08b');}
    else if(s==='ball'){const d=()=>g.drawImage(ballImg,4,4,16,16);if(ballImg.complete)d();else ballImg.addEventListener('load',d);}
    else if(s==='bloco'){g.save();g.translate(12,22);g.scale(.5,.5);drawBlocoSpot(g,0,0,1.2);g.restore();}
  });
}

/* ================= FACE GALLERY ================= */
const FACES=[
  ['De boa','energia alta',{e:90}],
  ['Normal','energia média',{e:55}],
  ['Cansado','energia baixa',{e:30}],
  ['Apagando','quase zerando',{e:10}],
  ['Turbo','pozinho',{e:80,turbo:true}],
  ['Viagem','cogumelo',{e:70,trip:true}],
  ['Bêbado','3 cervejas',{e:60,drunk:true}],
  ['Bad','depois do turbo',{e:45,crash:true}],
  ['Disfarçado','óculos escuros',{e:70,glasses:true}],
  ['Óculos + viagem','lente arco-íris',{e:70,glasses:true,trip:true}],
  ['Óculos + turbo','tremendo de óculos',{e:80,glasses:true,turbo:true}],
  ['Óculos + bêbado','óculos torto',{e:60,glasses:true,drunk:true}],
  ['Óculos + cansado','óculos escorregando',{e:30,glasses:true}],
  ['Dormindo','ponto / cadeira',{e:60,sleep:true}],
  ['Torrado','sol sem óculos',{e:60,sleep:true,burn:true}],
  ['Homem-Aranha','cogumelo-aranha',{e:80,spider:true}]
];
const galleryCtx=[];
function faceGallery(){
  const grid=$('faceGrid');
  for(const [name,sub,st] of FACES){
    const f=document.createElement('figure');const c=document.createElement('canvas');c.width=100;c.height=125;
    const cap=document.createElement('figcaption');cap.innerHTML=`${name}<span>${sub}</span>`;
    f.append(c,cap);grid.appendChild(f);const g=c.getContext('2d');drawFace(g,st);galleryCtx.push([g,st]);
  }
  setInterval(()=>{for(const [g,st] of galleryCtx)drawFace(g,st);},150);
}

/* ================= BOOT ================= */
setupStatics();
faceGallery();
legend();
goTitle();
requestAnimationFrame(loop);})();
