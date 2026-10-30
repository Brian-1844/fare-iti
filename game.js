/* Fare Iti — a 3D island game set in French Polynesia.
   Gather, craft, plant, fish, keep animals and build your own fare, level by level.
   Uses three.js r128 (global THREE) and data.js (window.FARE_DATA). */
(function(){
"use strict";
const {ICON,WXICON,ITEMS,ORDER,CATS,CROPS,SEEDS,STAGES,RECIPES,COOK,ANIMALS,LEVELS,GSTAGES,PRICES,SHOP,GUEST_NAMES,REVIEWS,rating}=window.FARE_DATA;
const $=s=>document.querySelector(s);
const coarse=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
if(coarse)document.body.classList.add('coarse');
$('#joy').hidden=!coarse;$('#hint').hidden=coarse;

/* ---------- constants ---------- */
const GROW_PALM=55,REGROW_PALM=30,ROCK_RESPAWN=120,BAMBOO_CD=40,TRENCH_GROW=80;
const DAY_LEN=720,HUNGER_DRAIN=100/540;
const R=38,SITE={x:5,z:-3},SITE_H=2.3,SITE_HX=3.2,SITE_HZ=2.7,REEF=R+6.3;
const START={x:0,z:9};
const SPRING={x:-6,z:-10};
const BAMBOO_SPOTS=[[-12,-5],[-14.2,-2],[-10.4,-1.6]];
const MAX_TRAPS=3,MAX_TRENCH=4;
/* pension de famille: guest fare site and the wharf */
const SITE2={x:18,z:16},SITE2_H=1.56;
const DOCK=(()=>{const a=Math.atan2(26,26);return{dx:Math.cos(a),dz:Math.sin(a),r0:35.2,r1:42.5,w:0.85};})();
const G2_ROT=Math.atan2(DOCK.dx*DOCK.r0-SITE2.x,DOCK.dz*DOCK.r0-SITE2.z);
function dockLocal(x,z){return[x*DOCK.dx+z*DOCK.dz,-x*DOCK.dz+z*DOCK.dx];}
function dockPt(along,side){return{x:DOCK.dx*along-DOCK.dz*side,z:DOCK.dz*along+DOCK.dx*side};}
function g2Local(x,z){const dx=x-SITE2.x,dz=z-SITE2.z,c=Math.cos(G2_ROT),sn=Math.sin(G2_ROT);return[dx*c-dz*sn,dx*sn+dz*c];}
function g2World(lx,lz){const c=Math.cos(G2_ROT),sn=Math.sin(G2_ROT);return{x:SITE2.x+lx*c+lz*sn,z:SITE2.z-lx*sn+lz*c};}
function nearG2(x,z,pad){const[a,b]=g2Local(x,z);return Math.abs(a)<2.4+pad&&b>-2.0-pad&&b<3.5+pad;}
function g2Dist(x,z){const[a,b]=g2Local(x,z);const dx=Math.max(0,Math.abs(a)-2.4),dz=b>3.5?b-3.5:b<-2?-2-b:0;return Math.hypot(dx,dz);}

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function smooth(a,b,x){const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function dist(a,b,x,z){return Math.hypot(a-x,b-z);}
function H(x,z){
  const r=Math.hypot(x,z);
  let h=r<R?2.4*(1-(r/R)**2):-(r-R)*0.35;
  if(r<R)h+=0.45*Math.sin(x*0.23+1.3)*Math.cos(z*0.19)*(1-r/R);
  const mx=x+19,mz=z+25;h+=17*Math.exp(-(mx*mx+mz*mz)/(2*8.5*8.5));
  h=Math.max(h,-4);
  const d=Math.hypot(x-SITE.x,z-SITE.z),f=1-smooth(4.4,6.6,d);
  h=h*(1-f)+SITE_H*f;
  const d2=Math.hypot(x-SITE2.x,z-SITE2.z),f2=1-smooth(4.3,6.4,d2);
  return h*(1-f2)+SITE2_H*f2;
}
function nearSite(x,z,pad){return Math.abs(x-SITE.x)<SITE_HX+pad&&Math.abs(z-SITE.z)<SITE_HZ+pad;}
const Y0=SITE_H+0.6; // fare floor
function lx(x){return x-SITE.x;}function lz(z){return z-SITE.z;}
function inInterior(x,z){return Math.abs(lx(x))<2.55&&Math.abs(lz(z))<2.05;}
function inDoor(x,z){return Math.abs(lx(x))<0.55&&lz(z)>=1.9&&lz(z)<SITE_HZ+0.4;}
function onFloor(x,z){return S.stage>=4&&(inInterior(x,z)||(inDoor(x,z)&&lz(z)<SITE_HZ));}
function groundY(x,z){if(onDock(x,z))return 0.55;return onFloor(x,z)?Y0:Math.max(H(x,z),-0.35);}
function dockOpen(){return S.level>=7;}
function onDock(x,z){if(!dockOpen())return false;const[a,b]=dockLocal(x,z);return a>DOCK.r0-0.6&&a<DOCK.r1&&Math.abs(b)<DOCK.w;}
const TAROSPOTS=[0.5,1.5,2.5].map(a=>[SPRING.x+Math.cos(a)*2.8,SPRING.z+Math.sin(a)*2.8]);
function featureNear(x,z,d,place){
  if(dist(x,z,SPRING.x,SPRING.z)<d+1.6)return true;
  if(BAMBOO_SPOTS.some(([bx,bz])=>dist(x,z,bx,bz)<d+0.9))return true;
  if(place?nearG2(x,z,d+0.3):dist(x,z,SITE2.x,SITE2.z)<d+4.6)return true;
  const[da,ds]=dockLocal(x,z);if(da>DOCK.r0-2&&da<DOCK.r1+1&&Math.abs(ds)<d+1.4)return true;
  return false;
}

/* =========================================================
   State, world generation, save / load
   ========================================================= */
const SAVE_KEY='fare-iti-v3',V2_KEY='fare-iti-v2',V1_KEY='fare-iti-v1';
function genWild(palms,rocks){
  const rand=mulberry32(4242),crops=[];
  const free=(x,z,d)=>!palms.some(p=>dist(p.x,p.z,x,z)<d)&&!rocks.some(o=>dist(o.x,o.z,x,z)<d+0.4)&&!crops.some(c=>dist(c.x,c.z,x,z)<3)&&!featureNear(x,z,2);
  let tries=0;
  while(crops.filter(c=>c.type==='banana').length<6&&tries++<3000){
    const a=rand()*Math.PI*2,r=7+rand()*27,x=Math.cos(a)*r,z=Math.sin(a)*r,h=H(x,z);
    if(h<0.8||h>3||nearSite(x,z,3)||dist(x,z,START.x,START.z)<4||!free(x,z,2.4))continue;
    crops.push({type:'banana',x,z,seed:Math.floor(rand()*1e9),g:1,cd:0,scd:0,wild:true});
  }
  tries=0;
  while(crops.filter(c=>c.type==='fei').length<5&&tries++<4000){
    const a=rand()*Math.PI*2,d=13+rand()*6,x=-19+Math.cos(a)*d,z=-25+Math.sin(a)*d,h=H(x,z);
    if(h<2.9||h>4.7||Math.hypot(x,z)>R-3||!free(x,z,2.4))continue;
    crops.push({type:'fei',x,z,seed:Math.floor(rand()*1e9),g:1,cd:0,scd:0,wild:true});
  }
  return crops;
}
function wildTaro(){return TAROSPOTS.map(([x,z],i)=>({type:'taro',x,z,seed:900+i*77,g:1,cd:0,scd:0,wild:true}));}
function newWorld(){
  const rand=mulberry32(20261028),palms=[],rocks=[];
  let tries=0;
  while(palms.length<17&&tries++<3000){
    const a=rand()*Math.PI*2,r=6+rand()*29,x=Math.cos(a)*r,z=Math.sin(a)*r,h=H(x,z);
    if(h<0.35||h>3.4||nearSite(x,z,3.5)||dist(x,z,START.x,START.z)<3.5)continue;
    if(palms.some(p=>dist(p.x,p.z,x,z)<3.2))continue;
    palms.push({x,z,seed:Math.floor(rand()*1e9),state:'tree',g:1,cd:0});
  }
  tries=0;
  while(rocks.length<7&&tries++<3000){
    const nearM=rocks.length<4,a=rand()*Math.PI*2,r=nearM?9+rand()*6:8+rand()*26;
    const x=(nearM?-19:0)+Math.cos(a)*r,z=(nearM?-25:0)+Math.sin(a)*r,h=H(x,z);
    if(h<0.5||h>4.2||nearSite(x,z,3)||dist(x,z,START.x,START.z)<4)continue;
    if(rocks.some(o=>dist(o.x,o.z,x,z)<4)||palms.some(p=>dist(p.x,p.z,x,z)<2.6))continue;
    rocks.push({x,z,left:3,rcd:0,seed:Math.floor(rand()*1e9)});
  }
  return fillDefaults({v:3,stage:0,palms,rocks,crops:genWild(palms,rocks),startedAt:Date.now(),planted:0});
}
function fillDefaults(s){
  const inv={};ORDER.forEach(k=>inv[k]=0);inv.coconut=2;
  s.inv=Object.assign(inv,s.inv||{});
  s.player=s.player||{x:START.x,z:START.z,yaw:0.5};
  if(s.hunger===undefined)s.hunger=85;
  if(s.tod===undefined)s.tod=0.29;
  if(!s.day)s.day=1;
  if(!s.level)s.level=1;
  s.weather=s.weather||{state:'clear',left:150,c:0.1,r:0,w:0.2};
  s.fire=s.fire||null;s.canoe=s.canoe||null;s.boat=!!s.boat;
  s.coop=s.coop||null;s.pen=s.pen||null;
  s.traps=s.traps||[];s.trenches=s.trenches||[];
  s.furn=s.furn||{};s.flags=s.flags||{};s.stats=s.stats||{};
  s.buff=s.buff||0;s.dogT=s.dogT||0;
  s.planted=s.planted||0;
  s.money=s.money||0;s.g2=s.g2||0;s.stall=s.stall||null;s.owned=s.owned||{};s.seen=s.seen||{};s.npcs=s.npcs||[];
  s.pension=Object.assign({beds:1,ratings:[],reviews:[],next:25,vnext:60},s.pension||{});
  if(!s.crops)s.crops=[];
  if(!s.crops.some(c=>c.type==='taro'&&c.wild))s.crops.push(...wildTaro());
  if(!s.bamboo)s.bamboo=BAMBOO_SPOTS.map(([x,z])=>({x,z,cd:0}));
  if(!s.animals)s.animals=Object.keys(ANIMALS).map(type=>{const[x,z]=ANIMALS[type].spawn;return{type,x,z,tamed:false,fed:0};});
  // keep the spring and bamboo grove clear of wild things
  s.palms=s.palms.filter(p=>!featureNear(p.x,p.z,1.6));
  s.rocks=s.rocks.filter(o=>!featureNear(o.x,o.z,2));
  s.crops=s.crops.filter(c=>c.type==='taro'||!featureNear(c.x,c.z,1.6));
  s.look=Object.assign({type:'woman',build:1,skin:3,hairStyle:'longbun',hairCol:0,eyes:0,bottom:'skirt',pcol:0,top:'tank',tcol:0,flower:true,beard:false,set:false},s.look||{});
  s.store=s.store||null;s.ahimaa=s.ahimaa||null;s.excursion=s.excursion||null;s.market=s.market||{day:0,k:null};
  s.shells=s.shells||[];s.dmg=Object.assign({fare:0,g2:0},s.dmg||{});s.lashed=!!s.lashed;s.compost=s.compost||null;s.decor=s.decor||{};
  s.fields=s.fields||[];s.pfarm=s.pfarm||null;s.pearls=s.pearls||[];s.jewels=s.jewels||[];s.wornJewel=s.wornJewel||null;s.hive=s.hive||null;s.ponton=!!s.ponton;s.port=!!s.port;s.helipad=s.helipad||null;s.disp=s.disp||null;s.wearHat=!!s.wearHat;s.lamps=s.lamps||[];s.parterres=s.parterres||[];s.gen=s.gen||null;s.cargoDay=s.cargoDay||0;
  s.sail=!!s.sail;s.wear=s.wear||null;s.wearPareu=!!s.wearPareu;s.bushcd=s.bushcd||[];
  if(s.owned&&s.owned.ukulele&&!s.flags.ukeGiven){s.inv.uke=(s.inv.uke||0)+1;s.flags.ukeGiven=1;}
  return s;
}
function migrateV1(o){
  const now=Date.now();
  o.palms.forEach(p=>{p.g=p.plantedAt===0?1:clamp((now-p.plantedAt)/55000,0,1);p.cd=Math.max(0,(p.readyAt-now)/1000);delete p.plantedAt;delete p.readyAt;});
  o.rocks.forEach(r=>{r.rcd=r.left<=0?Math.max(0,(r.respawnAt-now)/1000):0;delete r.respawnAt;});
  o.crops=genWild(o.palms,o.rocks);return o;
}
function migrateV2(o){
  const inv=o.inv||{};
  o.stats={coconut:o.stage>=1?6:Math.min(6,inv.coconut||0),stone:o.stage>=1?8:(inv.stone||0),
    cooked:(inv.roastfei||0)+(inv.grillfish||0)>0?1:0,fish:(inv.fish||0)+(inv.grillfish||0)+(inv.iaota||0)};
  o.v=3;delete o.doneAt;return o;
}
function load(){
  try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const s=JSON.parse(raw);if(s&&s.v===3&&s.palms)return fillDefaults(s);}}catch(e){}
  try{const raw=localStorage.getItem(V2_KEY);if(raw){const s=JSON.parse(raw);if(s&&s.v===2&&s.palms)return fillDefaults(migrateV2(s));}}catch(e){}
  try{const raw=localStorage.getItem(V1_KEY);if(raw){const s=JSON.parse(raw);if(s&&s.v===1&&s.palms)return fillDefaults(migrateV2(migrateV1(s)));}}catch(e){}
  return null;
}
const SKIP={holder:1,obj:1,stump:1,mesh:1,sprout:1,anim:1,tx:1,tz:1,wait:1,bubble:1,body:1};
function save(){
  try{S.player.x=player.position.x;S.player.z=player.position.z;S.player.yaw=cam.yaw;
    localStorage.setItem(SAVE_KEY,JSON.stringify(S,(k,v)=>SKIP[k]?undefined:v));}catch(e){}
}
const saved=load();
const S=saved||newWorld();
if(saved){$('#startBtn').textContent='Continue';$('#saveNote').textContent='Welcome back. Your island is as you left it.';}

/* =========================================================
   Renderer, sky, light
   ========================================================= */
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
$('#scene').appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(55,1,0.1,600);

const skyU={top:{value:new THREE.Color()},bottom:{value:new THREE.Color()}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(420,24,12),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 vP;void main(){float h=max(normalize(vP).y,0.0);gl_FragColor=vec4(mix(bottom,top,pow(h,0.55)),1.0);}'}));
sky.renderOrder=-1;scene.add(sky);
const stars=(function(){const n=700,p=new Float32Array(n*3),rand=mulberry32(31);
  for(let i=0;i<n;i++){const u=rand()*Math.PI*2,v=Math.acos(rand()*0.95);p[i*3]=Math.sin(v)*Math.cos(u)*380;p[i*3+1]=Math.cos(v)*380;p[i*3+2]=Math.sin(v)*Math.sin(u)*380;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.8,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(m);return m;})();
scene.fog=new THREE.Fog(0xd6efe9,70,230);

const hemi=new THREE.HemisphereLight(0xdff4ff,0x6f8a4a,0.7);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1d6,1.2);
sun.castShadow=true;sun.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:110});
sun.shadow.bias=-0.0008;scene.add(sun);scene.add(sun.target);
const moon=new THREE.DirectionalLight(0x9db8ff,0);scene.add(moon);scene.add(moon.target);

/* Terrain */
(function terrain(){
  const geo=new THREE.PlaneGeometry(190,190,coarse?150:210,coarse?150:210);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,cols=[];
  const sand=new THREE.Color('#e8c98a'),wet=new THREE.Color('#bf9f62'),deep=new THREE.Color('#9fbf9a'),grass=new THREE.Color('#4f9433'),
        grass2=new THREE.Color('#64a33d'),jungle=new THREE.Color('#2d6a2b'),rock=new THREE.Color('#6b6a5e'),moss=new THREE.Color('#4b8a3e'),c=new THREE.Color();
  const rand=mulberry32(99);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i),h=H(x,z);pos.setY(i,h);
    if(h<-1.2)c.copy(deep).lerp(wet,0.3);
    else if(h<0.05)c.copy(wet).lerp(sand,smooth(-1.2,0.05,h));
    else if(h<0.55)c.copy(sand);
    else if(h<0.95)c.copy(sand).lerp(grass,smooth(0.55,0.95,h));
    else if(h<5)c.copy(grass).lerp(grass2,rand()*0.6);
    else if(h<13)c.copy(grass).lerp(jungle,smooth(5,8,h));
    else c.copy(jungle).lerp(rock,smooth(13,16,h));
    const sd=dist(x,z,SPRING.x,SPRING.z);if(sd<5)c.lerp(moss,(1-sd/5)*0.7);
    c.convertSRGBToLinear();const v=(0.94+rand()*0.1)*1.07;cols.push(c.r*v,c.g*v,c.b*v);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:groundDetail()}));
  m.receiveShadow=true;scene.add(m);
})();
/* Water */
const lagoon=new THREE.Mesh(new THREE.CircleGeometry(R+8,72),new THREE.MeshStandardMaterial({color:0x34c7bf,transparent:true,opacity:0.72,roughness:0.25,metalness:0.1}));
lagoon.rotation.x=-Math.PI/2;lagoon.position.y=0.02;scene.add(lagoon);
const ocean=new THREE.Mesh(new THREE.RingGeometry(R+7.6,320,72,1),new THREE.MeshStandardMaterial({color:0x1d6f9c,roughness:0.35}));
ocean.rotation.x=-Math.PI/2;ocean.position.y=0.03;scene.add(ocean);
const reef=new THREE.Mesh(new THREE.RingGeometry(R+6.9,R+8.1,96,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.6}));
reef.rotation.x=-Math.PI/2;reef.position.y=0.05;scene.add(reef);
const shore=new THREE.Mesh(new THREE.RingGeometry(R-0.4,R+0.7,96,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.3}));
shore.rotation.x=-Math.PI/2;shore.position.y=0.06;scene.add(shore);
const COL={lagoonDay:new THREE.Color(0x34c7bf),lagoonNight:new THREE.Color(0x0e3a48),lagoonStorm:new THREE.Color(0x4c7f7e),
  oceanDay:new THREE.Color(0x1d6f9c),oceanNight:new THREE.Color(0x08243a),oceanStorm:new THREE.Color(0x3a5560)};

/* Clouds */
const clouds=new THREE.Group();scene.add(clouds);
const cloudMat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.95});
(function(){const rand=mulberry32(5);
  for(let i=0;i<16;i++){const g=new THREE.Group();for(let j=0;j<4;j++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(3+rand()*3,1),cloudMat);s.position.set(j*4-6,rand()*2,rand()*3);s.scale.y=0.6;g.add(s);}
    const a=rand()*Math.PI*2,r=40+rand()*90;g.position.set(Math.cos(a)*r,30+rand()*16,Math.sin(a)*r);g.userData.need=i/16;clouds.add(g);}})();

/* Rain streaks */
const RAIN_N=1400;
const rain=(function(){const pos=new Float32Array(RAIN_N*6),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xcfe3ee,transparent:true,opacity:0,depthWrite:false}));m.frustumCulled=false;scene.add(m);
  const P=[];for(let i=0;i<RAIN_N;i++)P.push({x:(Math.random()-0.5)*44,y:Math.random()*24,z:(Math.random()-0.5)*44,s:16+Math.random()*8});
  return {mesh:m,pos,P};})();

/* =========================================================
   Materials & mesh builders
   ========================================================= */
const lin=c=>new THREE.Color(c).convertSRGBToLinear();
const std=(color,o)=>{const m=new THREE.MeshStandardMaterial(Object.assign({roughness:0.9,flatShading:true},o||{}));m.color.copy(lin(color));if(o&&o.emissive)m.emissive.copy(lin(o.emissive));return m;};
const MAT={
  trunk:std(0x8d6b49,{roughness:1}),frond:std(0x4f9d3d,{side:THREE.DoubleSide}),nut:std(0x7a5a2a,{roughness:0.8}),
  basalt:std(0x4f4d49,{roughness:0.95}),basalt2:std(0x67645d,{roughness:0.95}),post:std(0x6e4b2c),
  bush:std(0x3f8a3a,{roughness:1}),bushDark:std(0x2f6f33,{roughness:1}),flower:std(0xe2402e,{roughness:0.6,flatShading:false}),
  canoe:std(0x6b3f22,{roughness:0.8}),canoeTrim:std(0xa87a4e,{roughness:0.8}),
  skin:std(0x9a643c,{roughness:0.8,flatShading:false}),pareo:std(0xde4634,{roughness:0.8}),shirt:std(0xf3ead2),hair:std(0x231912,{flatShading:false}),
  tiare:std(0xffffff,{roughness:0.6,emissive:0x333333,flatShading:false}),rope:std(0xc9a061,{roughness:1,flatShading:false}),
  stem:std(0x7d8f45),stemFei:std(0x5c5a33),leafBanana:std(0x79c44a,{roughness:0.85,side:THREE.DoubleSide}),leafFei:std(0x3d8636,{roughness:0.85,side:THREE.DoubleSide}),
  leafTaro:std(0x3f8f4a,{roughness:0.8,side:THREE.DoubleSide}),leafUru:std(0x2f7a35,{roughness:0.9}),
  banana:std(0xb7c93d,{roughness:0.7}),fei:std(0xd9601e,{roughness:0.6}),uru:std(0x9cc23f,{roughness:0.7}),pod:std(0x3c5a1e),
  bambooMat:std(0x9cbf4a,{roughness:0.6}),bambooNode:std(0x6d8a2e),bambooLeaf:std(0x7fb348,{side:THREE.DoubleSide}),
  sprout:std(0x8fd05e,{roughness:0.8}),soil:std(0x5a3e26,{roughness:1}),soil2:std(0x7a5634,{roughness:1}),
  spring:new THREE.MeshStandardMaterial({color:lin(0x48cfd6),roughness:0.1,metalness:0.1,transparent:true,opacity:0.88}),
  paddy:new THREE.MeshStandardMaterial({color:lin(0x6fb7b8),roughness:0.15,transparent:true,opacity:0.82}),
  flame:new THREE.MeshBasicMaterial({color:0xff7a1f,transparent:true,opacity:0.92}),flame2:new THREE.MeshBasicMaterial({color:0xffd25e,transparent:true,opacity:0.95}),
  ember:std(0x3a2416,{roughness:1,emissive:0x5a1a00}),
  white:std(0xf6f1e6,{flatShading:false}),egg:std(0xf3e6cc,{flatShading:false}),
  dog:std(0xc08a4f),dogDark:std(0x6e4826),cat:std(0xe39a4c),catDark:std(0x9a5a22),pig:std(0xeaa79d,{flatShading:false}),pigDark:std(0xc77d73),
  goat:std(0xefe9dc),horn:std(0x5b5246),hen:std(0xa2522c),comb:std(0xd62a20),beak:std(0xf2b233),tail:std(0x24493a),
  jar:new THREE.MeshStandardMaterial({color:lin(0xf0c75a),roughness:0.2,transparent:true,opacity:0.85}),cup:std(0x7a5530)
};
function canvasTex(draw,rx,ry){const c=document.createElement('canvas');c.width=c.height=128;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.encoding=THREE.sRGBEncoding;return t;}
const plankDraw=g=>{g.fillStyle='#bb8b57';g.fillRect(0,0,128,128);const r=mulberry32(3);
  for(let x=0;x<128;x+=16){g.fillStyle=`rgba(${120+r()*40|0},${80+r()*20|0},40,0.35)`;g.fillRect(x,0,16,128);g.fillStyle='#7a5230';g.fillRect(x,0,2,128);}
  g.strokeStyle='rgba(110,70,35,.35)';for(let i=0;i<40;i++){const x=r()*128,y=r()*128;g.beginPath();g.moveTo(x,y);g.lineTo(x+r()*2,y+10+r()*20);g.stroke();}};
MAT.plank=new THREE.MeshStandardMaterial({roughness:0.9,side:THREE.DoubleSide,transparent:true,map:canvasTex(plankDraw,2,1)});
MAT.wood=new THREE.MeshStandardMaterial({roughness:0.9,map:canvasTex(plankDraw,1,1)});
MAT.thatch=new THREE.MeshStandardMaterial({roughness:1,side:THREE.DoubleSide,map:canvasTex(g=>{g.fillStyle='#c9a35a';g.fillRect(0,0,128,128);const r=mulberry32(8);
  for(let i=0;i<420;i++){const x=r()*128,y=r()*128;g.strokeStyle=r()<0.5?'rgba(150,110,50,.55)':'rgba(235,205,135,.6)';g.lineWidth=1+r();g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-0.5)*3,y+8+r()*12);g.stroke();}
  for(let y=0;y<128;y+=32){g.fillStyle='rgba(110,80,35,.45)';g.fillRect(0,y,128,3);}},3,2)});
MAT.ridge=std(0x9c7838,{roughness:1});
MAT.weave=new THREE.MeshStandardMaterial({roughness:1,map:canvasTex(g=>{g.fillStyle='#d9c27a';g.fillRect(0,0,128,128);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.fillStyle=(x+y)%2?'#c4a95e':'#e8d595';if((x+y)%2)g.fillRect(x*16+2,y*16,12,16);else g.fillRect(x*16,y*16+2,16,12);}
  g.strokeStyle='rgba(120,90,40,.4)';for(let i=0;i<=128;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.stroke();}},3,2)});
MAT.tifaifai=new THREE.MeshStandardMaterial({roughness:0.9,map:canvasTex(g=>{g.fillStyle='#d6392c';g.fillRect(0,0,128,128);g.fillStyle='#fbf3e2';
  const petal=(cx,cy,s)=>{for(let i=0;i<8;i++){g.save();g.translate(cx,cy);g.rotate(i*Math.PI/4);g.beginPath();g.ellipse(0,-s*0.55,s*0.2,s*0.45,0,0,Math.PI*2);g.fill();g.restore();}};
  petal(64,64,46);g.fillStyle='#d6392c';g.beginPath();g.arc(64,64,9,0,Math.PI*2);g.fill();g.fillStyle='#fbf3e2';for(const[a,b]of[[8,8],[120,8],[8,120],[120,120]])petal(a,b,18);},1,1)});
MAT.falls=new THREE.MeshBasicMaterial({transparent:true,opacity:0.8,side:THREE.DoubleSide,depthWrite:false,map:canvasTex(g=>{g.fillStyle='rgba(200,240,250,0.6)';g.fillRect(0,0,128,128);
  for(let i=0;i<30;i++){g.fillStyle='rgba(255,255,255,0.8)';g.fillRect(Math.random()*128,Math.random()*128,2+Math.random()*3,14+Math.random()*24);}},1,1)});

function stripLeaf(L,N,W,lift,droop,ridge){const p=[],idx=[];
  for(let i=0;i<=N;i++){const t=i/N,x=t*L,y=t*lift-t*t*droop,w=Math.sin(Math.PI*Math.min(1,t*1.08))*W+0.02;p.push(x,y,-w,x,y+ridge,0,x,y,w);}
  for(let i=0;i<N;i++){const a=i*3,b=a+3;idx.push(a,b,a+1,a+1,b,b+1,a+1,b+1,a+2,a+2,b+1,b+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;}
const frondGeo=stripLeaf(3.2,8,0.55,0.7,1.9,0.13);
const leafGeo=stripLeaf(2.1,7,0.46,1.0,1.25,0.05);
const smallLeafGeo=stripLeaf(0.9,4,0.12,0.2,0.4,0.02);
const taroLeafGeo=(()=>{const s=new THREE.Shape();s.moveTo(0,-0.62);s.quadraticCurveTo(0.5,-0.25,0.46,0.2);s.quadraticCurveTo(0.42,0.5,0.2,0.48);s.lineTo(0,0.22);s.lineTo(-0.2,0.48);s.quadraticCurveTo(-0.42,0.5,-0.46,0.2);s.quadraticCurveTo(-0.5,-0.25,0,-0.62);
  const g=new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);return g;})();
const nutGeo=new THREE.IcosahedronGeometry(0.2,0);
function noisyGeo(g,amp,seed){const pos=g.attributes.position,r=mulberry32(seed||1),map=new Map();
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),k=`${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;let d=map.get(k);if(d===undefined){d=1+(r()-0.5)*amp;map.set(k,d);}pos.setXYZ(i,x*d,y*d,z*d);}
  g.computeVertexNormals();return g;}
const rockGeo=noisyGeo(new THREE.IcosahedronGeometry(1,1),0.3,5);
const fingerGeo=new THREE.CylinderGeometry(0.05,0.035,0.32,5);
const feiGeo=new THREE.SphereGeometry(0.11,6,5);
function mesh(geo,mat,x,y,z,shadow){const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);if(shadow!==false)m.castShadow=true;return m;}
function box(w,h,d,mat,x,y,z){const m=mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z);m.receiveShadow=true;return m;}
function cyl(r,h,mat,x,y,z,seg){return mesh(new THREE.CylinderGeometry(r,r*1.1,h,seg||7),mat,x,y,z);}

MAT.trunkR=new THREE.MeshStandardMaterial({roughness:1,map:canvasTex(g=>{g.fillStyle='#8d6b49';g.fillRect(0,0,128,128);
  for(let x=0;x<128;x+=8){g.fillStyle='rgba(55,36,18,.6)';g.fillRect(x,0,2,128);g.fillStyle='rgba(200,170,128,.35)';g.fillRect(x+3,0,3,128);}
  const r=mulberry32(4);for(let i=0;i<60;i++){g.fillStyle='rgba(70,50,30,.25)';g.fillRect(r()*128,r()*128,1+r()*3,2+r()*6);}},16,1)});
MAT.frondV=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:0.85,flatShading:true});
MAT.nutG=std(0x7c8a2c,{roughness:0.6,flatShading:false});
function pinnateGeo(L,dry){const p=[],c=[],N=22,lin2=h=>new THREE.Color(h).convertSRGBToLinear();
  const C0=lin2(dry?'#7a5a2a':'#4a7a2a'),C1=lin2(dry?'#8a6a3a':'#2f6e27'),C2=lin2(dry?'#c4a464':'#93d24c');
  const lift=0.8,droop=dry?3.4:1.95,at=t=>[t*L,t*lift-t*t*droop];
  for(let i=0;i<N;i++){const[x0,y0]=at(i/N),[x1,y1]=at((i+1)/N);p.push(x0,y0,-0.035,x1,y1,-0.02,x1,y1,0.02,x0,y0,-0.035,x1,y1,0.02,x0,y0,0.035);for(let k=0;k<6;k++)c.push(C0.r,C0.g,C0.b);}
  for(let i=2;i<N;i++){const t=i/N,[x,y]=at(t),w=(Math.sin(Math.PI*Math.min(1,t*1.04))*0.66+0.08)*(dry?0.75:1),dn=0.34+t*0.2;
    for(const sd of[-1,1]){const tx=x+0.24*w,ty=y-dn*w,tz=sd*w;p.push(x-0.06,y,0,x+0.06,y+0.01,0,tx,ty,tz);c.push(C1.r,C1.g,C1.b,C1.r,C1.g,C1.b,C2.r,C2.g,C2.b);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();return g;}
const frondGeo2=pinnateGeo(3.3,false),dryFrondGeo=pinnateGeo(2.5,true),nutGeo2=new THREE.SphereGeometry(0.16,10,8);
function makePalm(seed){
  const rand=mulberry32(seed),g=new THREE.Group();
  const lean=0.5+rand()*1.1,ang=rand()*Math.PI*2,hgt=4.5+rand()*1.8,dx=Math.cos(ang),dz=Math.sin(ang);
  const pts=[];for(let i=0;i<=6;i++){const t=i/6;pts.push(new THREE.Vector3(dx*lean*t*t,hgt*t,dz*lean*t*t));}
  const curve=new THREE.CatmullRomCurve3(pts),TS=16,RS=8,tube=new THREE.TubeGeometry(curve,TS,0.17,RS,false),tp=tube.attributes.position,cv=new THREE.Vector3();
  for(let i=0;i<=TS;i++){const c=curve.getPointAt(i/TS),f=1.2-0.45*(i/TS)+(i%2?0.04:0);for(let j=0;j<=RS;j++){const k=i*(RS+1)+j;cv.set(tp.getX(k),tp.getY(k),tp.getZ(k)).sub(c).multiplyScalar(f).add(c);tp.setXYZ(k,cv.x,cv.y,cv.z);}}
  tube.computeVertexNormals();g.add(mesh(tube,MAT.trunkR));
  g.add(mesh(new THREE.CylinderGeometry(0.2,0.38,0.45,10),MAT.trunkR,0,0.18,0));
  const top=pts[6],crown=new THREE.Group();crown.position.copy(top);g.add(crown);
  crown.add(mesh(new THREE.SphereGeometry(0.2,8,6),MAT.frond,0,0.05,0,false));
  const n=10+Math.floor(rand()*3);
  for(let i=0;i<n;i++){const f=mesh(frondGeo2,MAT.frondV);f.rotation.y=i/n*Math.PI*2+rand()*0.3;f.rotation.z=(rand()-0.4)*0.5+(i%2?0.18:-0.08);f.scale.setScalar(0.82+rand()*0.32);crown.add(f);}
  for(let i=0;i<2;i++){const f=mesh(dryFrondGeo,MAT.frondV);f.rotation.y=rand()*6;f.rotation.z=-0.5;f.position.y=-0.1;crown.add(f);}
  const nuts=new THREE.Group();nuts.position.copy(top);nuts.position.y-=0.3;
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.4,m=mesh(nutGeo2,i%3?MAT.nutG:MAT.nut,Math.cos(a)*0.21,-(i%2)*0.13,Math.sin(a)*0.21);m.scale.set(1,1.18,1);nuts.add(m);}
  g.add(nuts);
  return {group:g,crown,nuts,phase:rand()*6};
}
function makeBananaPlant(seed,isFei){
  const rand=mulberry32(seed),g=new THREE.Group(),hgt=isFei?2.5+rand()*0.4:2.0+rand()*0.4;
  g.add(mesh(new THREE.CylinderGeometry(0.13,0.22,hgt,7),isFei?MAT.stemFei:MAT.stem,0,hgt/2,0));
  const crown=new THREE.Group();crown.position.y=hgt;g.add(crown);
  const n=6+Math.floor(rand()*2);
  for(let i=0;i<n;i++){const l=mesh(leafGeo,isFei?MAT.leafFei:MAT.leafBanana);l.rotation.y=i/n*Math.PI*2+rand()*0.4;l.rotation.z=0.25+rand()*0.3;l.scale.set(1+rand()*0.25,1,1.1);crown.add(l);}
  const bunch=new THREE.Group();
  if(isFei){bunch.position.set(0.15,hgt+0.1,0);bunch.add(mesh(new THREE.CylinderGeometry(0.04,0.05,0.9,5),MAT.stemFei,0,0.45,0));
    for(let i=0;i<14;i++){const a=i*2.4,f=mesh(feiGeo,MAT.fei,Math.cos(a)*0.17,0.45+(i%5)*0.12,Math.sin(a)*0.17);f.scale.set(1,1.5,1);bunch.add(f);}}
  else{bunch.position.set(0.35,hgt-0.1,0);const st=mesh(new THREE.CylinderGeometry(0.035,0.04,0.9,5),MAT.stem,0,-0.2,0);st.rotation.z=0.4;bunch.add(st);
    for(let r=0;r<4;r++)for(let i=0;i<6;i++){const a=i/6*Math.PI*2+r,f=mesh(fingerGeo,MAT.banana,0.2+Math.cos(a)*0.13,-0.25-r*0.17,Math.sin(a)*0.13);f.rotation.z=-0.5+Math.cos(a)*0.4;f.rotation.x=Math.sin(a)*0.4;bunch.add(f);}}
  g.add(bunch);
  return {group:g,crown,bunch,phase:rand()*6};
}
function makeTaroPlant(seed){
  const rand=mulberry32(seed),g=new THREE.Group(),crown=new THREE.Group();g.add(crown);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+rand()*0.4,h=0.7+rand()*0.35;
    const st=mesh(new THREE.CylinderGeometry(0.025,0.035,h,4),MAT.stem,Math.cos(a)*0.12,h/2,Math.sin(a)*0.12);st.rotation.z=Math.cos(a)*0.25;st.rotation.x=-Math.sin(a)*0.25;crown.add(st);
    const l=mesh(taroLeafGeo,MAT.leafTaro,Math.cos(a)*0.35,h+0.05,Math.sin(a)*0.35);l.rotation.y=-a+Math.PI/2;l.rotation.x=0.35;l.scale.setScalar(0.9+rand()*0.4);crown.add(l);}
  const bunch=new THREE.Group();const corm=mesh(new THREE.SphereGeometry(0.16,6,5),std(0x8c6a7a),0,0.08,0);corm.scale.y=0.7;bunch.add(corm);g.add(bunch);
  return {group:g,crown,bunch,phase:rand()*6};
}
function makeTiare(seed){
  const rand=mulberry32(seed),g=new THREE.Group(),crown=new THREE.Group();g.add(crown);
  for(let i=0;i<5;i++){const b=mesh(new THREE.IcosahedronGeometry(0.42,0),MAT.bushDark,(rand()-0.5)*0.6,0.4+rand()*0.4,(rand()-0.5)*0.6);crown.add(b);}
  const bunch=new THREE.Group();
  for(let i=0;i<10;i++){const a=rand()*Math.PI*2,y=0.4+rand()*0.6,f=new THREE.Group();f.position.set(Math.cos(a)*0.62,y,Math.sin(a)*0.62);
    for(let p=0;p<6;p++){const pe=mesh(new THREE.SphereGeometry(0.05,5,4),MAT.tiare,Math.cos(p)*0.06,0,Math.sin(p)*0.06,false);pe.scale.set(1.4,0.4,0.7);pe.rotation.y=-p;f.add(pe);}bunch.add(f);}
  g.add(bunch);
  return {group:g,crown,bunch,phase:rand()*6};
}
MAT.leafUru2=std(0x4c9a3c,{roughness:0.85});
function makeUru(seed){
  const rand=mulberry32(seed),g=new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.2,0.36,3.4,9),MAT.trunkR,0,1.7,0));
  for(let i=0;i<3;i++){const br=cyl(0.08,1.4,MAT.trunk,0,0,0,6);br.position.set(Math.cos(i*2.1)*0.45,3.0,Math.sin(i*2.1)*0.45);br.rotation.set(Math.sin(i*2.1)*0.7,0,-Math.cos(i*2.1)*0.7);g.add(br);}
  const crown=new THREE.Group();crown.position.y=3.3;g.add(crown);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i?1.15:0,b=mesh(noisyGeo(new THREE.IcosahedronGeometry(0.95+rand()*0.35,1),0.35,seed+i),i%2?MAT.leafUru:MAT.leafUru2,Math.cos(a)*r,(i?0:0.7)+rand()*0.4,Math.sin(a)*r);crown.add(b);}
  for(let i=0;i<12;i++){const a=rand()*Math.PI*2,l=mesh(taroLeafGeo,MAT.leafUru2,Math.cos(a)*1.9,(rand()-0.3)*1.2,Math.sin(a)*1.9);l.scale.setScalar(1.3);l.rotation.set(-0.4,-a+Math.PI/2,0.3);crown.add(l);}
  const bunch=new THREE.Group();bunch.position.y=3.3;
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.3;bunch.add(mesh(noisyGeo(new THREE.IcosahedronGeometry(0.27,1),0.15,i),MAT.uru,Math.cos(a)*1.6,-0.5+rand()*0.6,Math.sin(a)*1.6));}
  g.add(bunch);
  return {group:g,crown,bunch,phase:rand()*6};
}
function makeVanilla(seed){
  const rand=mulberry32(seed),g=new THREE.Group();
  g.add(cyl(0.06,1.8,MAT.post,0,0.9,0,5));
  const crown=new THREE.Group();g.add(crown);
  const pts=[];for(let i=0;i<=24;i++){const t=i/24;pts.push(new THREE.Vector3(Math.cos(t*14)*0.11,0.1+t*1.6,Math.sin(t*14)*0.11));}
  crown.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,0.025,4,false),MAT.sprout));
  for(let i=0;i<10;i++){const t=i/10,l=mesh(smallLeafGeo,MAT.leafFei,Math.cos(t*14)*0.12,0.15+t*1.6,Math.sin(t*14)*0.12);l.rotation.y=-t*14;l.rotation.z=0.3;l.scale.setScalar(0.5);crown.add(l);}
  const bunch=new THREE.Group();
  for(let i=0;i<5;i++){const p=mesh(new THREE.CylinderGeometry(0.018,0.018,0.32,4),MAT.pod,0.16*Math.cos(i*1.3),0.9+i*0.12,0.16*Math.sin(i*1.3));p.rotation.z=0.25;bunch.add(p);}
  g.add(bunch);
  return {group:g,crown,bunch,phase:rand()*6};
}
function makePineapple(seed){
  const rand=mulberry32(seed),g=new THREE.Group(),crown=new THREE.Group();g.add(crown);
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2+rand()*0.3,l=mesh(new THREE.ConeGeometry(0.05,0.95,3),i%2?MAT.leafFei:MAT.leafTaro,Math.cos(a)*0.22,0.42,Math.sin(a)*0.22);
    l.rotation.z=-Math.cos(a)*0.9;l.rotation.x=Math.sin(a)*0.9;crown.add(l);}
  const bunch=new THREE.Group();const fr=mesh(new THREE.SphereGeometry(0.2,8,6),std(0xe0a23a),0,0.6,0);fr.scale.y=1.4;bunch.add(fr);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,l=mesh(new THREE.ConeGeometry(0.035,0.3,3),MAT.leafFei,Math.cos(a)*0.05,0.98,Math.sin(a)*0.05);l.rotation.z=-Math.cos(a)*0.4;l.rotation.x=Math.sin(a)*0.4;bunch.add(l);}
  g.add(bunch);return {group:g,crown,bunch,phase:rand()*6};
}
function makePapaya(seed){
  const rand=mulberry32(seed),g=new THREE.Group(),h=2.6+rand()*0.5;
  g.add(mesh(new THREE.CylinderGeometry(0.1,0.16,h,7),std(0x9a9a6a),0,h/2,0));
  const crown=new THREE.Group();crown.position.y=h;g.add(crown);
  for(let i=0;i<8;i++){const l=mesh(leafGeo,MAT.leafBanana);l.rotation.y=i/8*Math.PI*2;l.rotation.z=0.15+rand()*0.2;l.scale.set(0.6,0.7,1.2);crown.add(l);}
  const bunch=new THREE.Group();bunch.position.y=h-0.45;
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,f=mesh(new THREE.SphereGeometry(0.13,7,5),std(i%3?0xf08a2b:0x9cc23f),Math.cos(a)*0.2,-(i%2)*0.2,Math.sin(a)*0.2);f.scale.y=1.4;bunch.add(f);}
  g.add(bunch);return {group:g,crown,bunch,phase:rand()*6};
}
function makeLime(seed){
  const rand=mulberry32(seed),g=new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.09,0.13,1.3,6),MAT.trunk,0,0.65,0));
  const crown=new THREE.Group();crown.position.y=1.5;g.add(crown);
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2;crown.add(mesh(new THREE.IcosahedronGeometry(0.6+rand()*0.2,0),MAT.leafUru,i?Math.cos(a)*0.45:0,i?0:0.35,i?Math.sin(a)*0.45:0));}
  const bunch=new THREE.Group();bunch.position.y=1.5;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;bunch.add(mesh(new THREE.SphereGeometry(0.08,6,4),std(0x9ccc3c),Math.cos(a)*0.85,-0.2+rand()*0.5,Math.sin(a)*0.85));}
  g.add(bunch);return {group:g,crown,bunch,phase:rand()*6};
}
function makeCropObj(c){
  {const v=makeV10Crop(c);if(v)return v;}
  if(c.type==='pineapple')return makePineapple(c.seed);
  if(c.type==='papaya')return makePapaya(c.seed);
  if(c.type==='lime')return makeLime(c.seed);
  if(c.type==='banana')return makeBananaPlant(c.seed,false);
  if(c.type==='fei')return makeBananaPlant(c.seed,true);
  if(c.type==='taro')return makeTaroPlant(c.seed);
  if(c.type==='tiare')return makeTiare(c.seed);
  if(c.type==='uru')return makeUru(c.seed);
  return makeVanilla(c.seed);
}
MAT.rockV=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95,flatShading:true});
function makeRockMesh(seed){const r=mulberry32(seed),geo=noisyGeo(new THREE.IcosahedronGeometry(1,2),0.34,seed),pos=geo.attributes.position,cols=[],c=new THREE.Color();
  const base=new THREE.Color(r()<0.5?'#4a4844':'#5d5a54'),light=new THREE.Color('#7a766c'),moss=new THREE.Color('#5c7d38'),dark=new THREE.Color('#2f2d2a');
  for(let i=0;i<pos.count;i++){const y=pos.getY(i),n=r();c.copy(base).lerp(n<0.5?dark:light,Math.abs(n-0.5)*0.6);if(y>0.3)c.lerp(moss,smooth(0.3,0.95,y)*0.8);c.convertSRGBToLinear();cols.push(c.r,c.g,c.b);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  const m=new THREE.Mesh(geo,MAT.rockV);m.rotation.set((r()-0.5)*0.4,r()*6,(r()-0.5)*0.4);m.castShadow=true;m.receiveShadow=true;m.userData.base=new THREE.Vector3(1.1+r()*0.3,0.75+r()*0.2,1+r()*0.3);return m;}
function makeSprout(){const g=new THREE.Group();const s=mesh(new THREE.ConeGeometry(0.12,0.5,5),MAT.sprout,0,0.25,0);g.add(s);
  const s2=s.clone();s2.rotation.z=0.5;s2.position.x=0.1;g.add(s2);const s3=s.clone();s3.rotation.z=-0.5;s3.position.x=-0.1;g.add(s3);return g;}
function hullGeo(L,W,Hh){const g=new THREE.SphereGeometry(1,20,10,0,Math.PI*2,Math.PI/2,Math.PI/2),pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){let x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const e=Math.abs(z);x*=W*(1-Math.pow(e,3)*0.6);y=y*Hh+Math.pow(e,4)*Hh*1.1;pos.setXYZ(i,x,y,z*L);}
  g.computeVertexNormals();return g;}
MAT.hullPaint=std(0xde4634,{roughness:0.6});MAT.hullD=std(0x6b3f22,{roughness:0.8,side:THREE.DoubleSide});MAT.hullWhite=std(0xf3ead2,{roughness:0.7});
const HULL=hullGeo(2.4,0.45,0.42),AMA=hullGeo(1.5,0.17,0.15);
function makeCanoe(){
  const v=new THREE.Group();
  const hull=mesh(HULL,MAT.hullD,0,0.36,0);v.add(hull);
  for(const sd of[-1,1]){const g=box(0.07,0.1,4.3,MAT.canoeTrim,sd*0.42,0.38,0);v.add(g);const band=box(0.03,0.09,3.4,MAT.hullPaint,sd*0.43,0.22,0,false);v.add(band);}
  for(const z of[-1,1]){const post=box(0.12,0.55,0.14,MAT.canoeTrim,0,0.72,z*2.25);post.rotation.x=z*0.35;v.add(post);v.add(box(0.13,0.06,0.15,MAT.hullPaint,0,1.0,z*2.36));}
  for(const z of[-0.9,0.3,1.3])v.add(box(0.8,0.05,0.18,MAT.wood,0,0.33,z));
  const ama=mesh(AMA,MAT.hullWhite,1.75,0.12,0);v.add(ama);
  for(const z of[-0.75,0.75]){const pts=[new THREE.Vector3(0.1,0.42,z),new THREE.Vector3(0.9,0.62,z),new THREE.Vector3(1.75,0.2,z)];
    v.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,0.045,6,false),MAT.post));v.add(box(0.12,0.08,0.12,MAT.rope,1.75,0.13,z,false));}
  const paddle=new THREE.Group();paddle.add(cyl(0.03,1.4,MAT.canoeTrim,0,0,0,5));const bl=mesh(new THREE.SphereGeometry(0.16,10,6),MAT.canoeTrim,0,-0.78,0);bl.scale.set(1,1.8,0.25);paddle.add(bl);
  paddle.position.set(-0.45,0.55,0.2);paddle.rotation.z=0.6;v.add(paddle);v.userData.paddle=paddle;
  return v;
}
function makeFire(){
  const g=new THREE.Group();
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2,s=mesh(rockGeo,MAT.basalt,Math.cos(a)*0.62,0.1,Math.sin(a)*0.62);s.scale.setScalar(0.2);s.rotation.set(i,i*2,i*3);g.add(s);}
  for(let i=0;i<3;i++){const l=cyl(0.06,0.9,MAT.ember,0,0.12,0,5);l.rotation.z=Math.PI/2;l.rotation.y=i/3*Math.PI;g.add(l);}
  const flame=new THREE.Group();flame.add(mesh(new THREE.ConeGeometry(0.3,0.8,6),MAT.flame,0,0.45,0,false));flame.add(mesh(new THREE.ConeGeometry(0.16,0.5,6),MAT.flame2,0,0.35,0,false));g.add(flame);
  const light=new THREE.PointLight(0xff8a3d,0,11,2);light.position.y=0.9;g.add(light);
  g.userData={flame,light};return g;
}
function makeCoop(){
  const g=new THREE.Group();
  for(const x of[-0.6,0.6])for(const z of[-0.45,0.45])g.add(cyl(0.05,0.5,MAT.post,x,0.25,z,5));
  g.add(box(1.4,0.8,1.1,MAT.wood,0,0.9,0));
  const L=Math.hypot(0.65,0.5),a=Math.atan2(0.5,0.65);
  for(const s of[-1,1]){const r=box(1.6,0.08,L+0.15,MAT.thatch,0,1.55,s*0.33);r.rotation.x=s*a;g.add(r);}
  g.add(box(0.36,0.42,0.04,new THREE.MeshBasicMaterial({color:0x1d1510}),0,0.85,0.56));
  const ramp=box(0.34,0.04,0.9,MAT.wood,0,0.3,0.9);ramp.rotation.x=0.5;g.add(ramp);
  const eggs=new THREE.Group();for(let i=0;i<4;i++){const e=mesh(new THREE.SphereGeometry(0.07,8,6),MAT.egg,-0.3+i*0.2,0.06,0.75+((i%2)*0.12));e.scale.y=1.25;eggs.add(e);}
  g.add(eggs);g.userData.eggs=eggs;return g;
}
function makePen(){
  const g=new THREE.Group(),n=10,r=2.2;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;g.add(cyl(0.07,1,MAT.post,Math.cos(a)*r,0.5,Math.sin(a)*r,5));}
  for(let i=0;i<n;i++){const a=(i+0.5)/n*Math.PI*2,len=2*r*Math.sin(Math.PI/n);
    for(const y of[0.45,0.85]){const rail=box(len,0.06,0.06,MAT.rope,Math.cos(a)*r*Math.cos(Math.PI/n),y,Math.sin(a)*r*Math.cos(Math.PI/n));rail.rotation.y=-a+Math.PI/2;g.add(rail);}}
  g.add(box(0.9,0.25,0.4,MAT.wood,0.9,0.12,-0.9));
  const finds=new THREE.Group();g.add(finds);g.userData.finds=finds;
  return g;
}
function makeTrap(){
  const g=new THREE.Group();
  const body=mesh(new THREE.CylinderGeometry(0.35,0.5,1.4,10,1,true),new THREE.MeshStandardMaterial({color:0xd9c27a,roughness:1,wireframe:true}));body.rotation.z=Math.PI/2;body.position.y=-0.05;g.add(body);
  g.add(cyl(0.035,1.6,MAT.post,0.8,0.4,0,5));
  const flag=box(0.25,0.15,0.02,MAT.pareo,0.92,1.15,0);g.add(flag);
  const fish=new THREE.Group();for(let i=0;i<3;i++){const f=mesh(new THREE.CircleGeometry(0.14,8),new THREE.MeshBasicMaterial({color:0x0b3a44,transparent:true,opacity:0.6}),-0.3+i*0.3,0.03,0,false);f.rotation.x=-Math.PI/2;f.scale.set(1.6,0.6,1);fish.add(f);}
  g.add(fish);g.userData.fish=fish;return g;
}
function makeTrench(){
  const g=new THREE.Group();
  g.add(box(2.3,0.12,1.6,MAT.soil,0,0.0,0));
  for(const s of[-1,1]){g.add(box(2.5,0.22,0.16,MAT.soil2,0,0.08,s*0.88));g.add(box(0.16,0.22,1.6,MAT.soil2,s*1.23,0.08,0));}
  const water=mesh(new THREE.PlaneGeometry(2.26,1.56),MAT.paddy,0,0.1,0,false);water.rotation.x=-Math.PI/2;g.add(water);
  const plants=new THREE.Group();g.add(plants);
  g.userData={water,plants};return g;
}
function makeBambooClump(seed){
  const rand=mulberry32(seed),g=new THREE.Group(),crown=new THREE.Group();g.add(crown);
  for(let i=0;i<8;i++){const a=rand()*Math.PI*2,r=rand()*0.45,h=4.2+rand()*1.6,c=new THREE.Group();c.position.set(Math.cos(a)*r,0,Math.sin(a)*r);c.rotation.z=Math.cos(a)*0.08;c.rotation.x=Math.sin(a)*0.08;
    c.add(cyl(0.07,h,MAT.bambooMat,0,h/2,0,6));for(let k=1;k<5;k++)c.add(mesh(new THREE.CylinderGeometry(0.085,0.085,0.05,6),MAT.bambooNode,0,k*h/5,0,false));
    for(let k=0;k<4;k++){const l=mesh(smallLeafGeo,MAT.bambooLeaf,0,h*(0.7+k*0.08),0,false);l.rotation.y=k*1.7+i;l.rotation.z=-0.2;c.add(l);}
    crown.add(c);}
  return {group:g,crown,phase:rand()*6};
}
function makeAnimal(type){
  const g=new THREE.Group(),legs=[];let tail=null;
  const leg=(x,z,h,r,mat)=>{const p=new THREE.Group();p.position.set(x,h,z);p.add(mesh(new THREE.CylinderGeometry(r,r*0.85,h,5),mat,0,-h/2,0));g.add(p);legs.push(p);};
  if(type==='dog'){
    g.add(box(0.36,0.34,0.85,MAT.dog,0,0.6,0));
    const head=new THREE.Group();head.position.set(0,0.88,0.48);g.add(head);
    head.add(box(0.32,0.3,0.32,MAT.dog,0,0,0));head.add(box(0.18,0.14,0.2,MAT.dogDark,0,-0.05,0.22));head.add(mesh(new THREE.SphereGeometry(0.04,6,4),MAT.horn,0,0,0.33,false));
    for(const s of[-1,1]){const e=mesh(new THREE.ConeGeometry(0.07,0.16,4),MAT.dogDark,s*0.1,0.2,-0.02);head.add(e);}
    tail=new THREE.Group();tail.position.set(0,0.72,-0.42);const tm=cyl(0.035,0.42,MAT.dog,0,0.2,0,5);tail.add(tm);tail.rotation.x=-0.7;g.add(tail);
    for(const x of[-0.12,0.12])for(const z of[-0.3,0.3])leg(x,z,0.43,0.055,MAT.dog);
  }else if(type==='cat'){
    g.add(box(0.22,0.22,0.52,MAT.cat,0,0.36,0));
    const head=mesh(new THREE.SphereGeometry(0.15,8,6),MAT.cat,0,0.52,0.3);g.add(head);
    for(const s of[-1,1])g.add(mesh(new THREE.ConeGeometry(0.05,0.11,4),MAT.catDark,s*0.08,0.66,0.3));
    for(const z of[-0.12,0.05,0.18])g.add(box(0.23,0.04,0.04,MAT.catDark,0,0.47,z));
    tail=new THREE.Group();tail.position.set(0,0.42,-0.26);tail.add(cyl(0.025,0.45,MAT.cat,0,0.22,0,5));tail.rotation.x=-0.35;g.add(tail);
    for(const x of[-0.08,0.08])for(const z of[-0.18,0.18])leg(x,z,0.26,0.035,MAT.cat);
  }else if(type==='pig'){
    const b=mesh(new THREE.SphereGeometry(0.5,10,8),MAT.pig,0,0.52,0);b.scale.set(0.8,0.72,1.25);g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.26,8,6),MAT.pig,0,0.6,0.58));
    const sn=cyl(0.1,0.1,MAT.pigDark,0,0.56,0.82,8);sn.rotation.x=Math.PI/2;g.add(sn);
    for(const s of[-1,1]){const e=mesh(new THREE.ConeGeometry(0.08,0.14,4),MAT.pigDark,s*0.14,0.83,0.55);e.rotation.x=0.5;g.add(e);}
    tail=new THREE.Group();tail.position.set(0,0.62,-0.6);tail.add(mesh(new THREE.TorusGeometry(0.06,0.018,4,8),MAT.pigDark));g.add(tail);
    for(const x of[-0.18,0.18])for(const z of[-0.3,0.3])leg(x,z,0.3,0.065,MAT.pig);
  }else if(type==='goat'){
    g.add(box(0.36,0.38,0.75,MAT.goat,0,0.72,0));
    const neck=box(0.16,0.32,0.16,MAT.goat,0,0.95,0.38);neck.rotation.x=0.4;g.add(neck);
    g.add(box(0.2,0.24,0.34,MAT.goat,0,1.12,0.5));
    for(const s of[-1,1]){const h=mesh(new THREE.ConeGeometry(0.035,0.24,4),MAT.horn,s*0.07,1.32,0.42);h.rotation.x=-0.6;g.add(h);}
    g.add(mesh(new THREE.ConeGeometry(0.04,0.14,4),MAT.horn,0,0.94,0.64));
    tail=new THREE.Group();tail.position.set(0,0.88,-0.38);tail.add(box(0.06,0.16,0.05,MAT.goat,0,0.06,0));g.add(tail);
    for(const x of[-0.12,0.12])for(const z of[-0.26,0.26])leg(x,z,0.53,0.045,MAT.goat);
  }else{ // chicken
    const b=mesh(new THREE.SphereGeometry(0.22,8,6),MAT.hen,0,0.38,0);b.scale.set(0.9,0.85,1.2);g.add(b);
    g.add(mesh(new THREE.SphereGeometry(0.11,8,6),MAT.hen,0,0.6,0.18));
    g.add(box(0.03,0.08,0.12,MAT.comb,0,0.73,0.17));
    const bk=mesh(new THREE.ConeGeometry(0.035,0.09,4),MAT.beak,0,0.59,0.31);bk.rotation.x=Math.PI/2;g.add(bk);
    tail=new THREE.Group();tail.position.set(0,0.46,-0.22);for(let i=0;i<3;i++){const f=box(0.03,0.26,0.08,MAT.tail,(i-1)*0.06,0.1,0);f.rotation.x=-0.5;f.rotation.z=(i-1)*0.3;tail.add(f);}g.add(tail);
    for(const x of[-0.07,0.07])leg(x,0.02,0.22,0.02,MAT.beak);
  }
  return {group:g,legs,tail};
}

/* =========================================================
   World entities
   ========================================================= */
const world=new THREE.Group();scene.add(world);
function spawnPalm(p){
  const holder=new THREE.Group();holder.position.set(p.x,H(p.x,p.z)-0.05,p.z);
  const obj=makePalm(p.seed);holder.add(obj.group);
  const stump=mesh(new THREE.CylinderGeometry(0.24,0.32,0.45,7),MAT.trunk,0,0.2,0);holder.add(stump);
  stump.add(mesh(new THREE.CylinderGeometry(0.2,0.2,0.04,7),std(0xe3b77c),0,0.23,0,false));
  const sprout=mesh(new THREE.IcosahedronGeometry(0.28,0),MAT.nut,0,0.12,0);holder.add(sprout);
  world.add(holder);p.holder=holder;p.obj=obj;p.stump=stump;p.sprout=sprout;
}
function spawnCrop(c){
  const holder=new THREE.Group();holder.position.set(c.x,H(c.x,c.z)-0.03,c.z);holder.rotation.y=(c.seed%628)/100;
  const obj=makeCropObj(c);holder.add(obj.group);
  const sprout=makeSprout();holder.add(sprout);
  world.add(holder);c.holder=holder;c.obj=obj;c.sprout=sprout;
}
S.palms.forEach(spawnPalm);
S.crops.forEach(spawnCrop);
S.rocks.forEach(o=>{o.mesh=makeRockMesh(o.seed);o.mesh.position.set(o.x,H(o.x,o.z)+0.2,o.z);world.add(o.mesh);});
S.bamboo.forEach((b,i)=>{b.obj=makeBambooClump(310+i*41);b.obj.group.position.set(b.x,H(b.x,b.z)-0.05,b.z);world.add(b.obj.group);});

/* Spring (pape) with a small waterfall */
const springObj=(function(){
  const g=new THREE.Group(),h=H(SPRING.x,SPRING.z);g.position.set(SPRING.x,h,SPRING.z);
  const pool=mesh(new THREE.CircleGeometry(1.4,24),MAT.spring,0,0.14,0,false);pool.rotation.x=-Math.PI/2;g.add(pool);
  const rand=mulberry32(55);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,s=mesh(rockGeo,rand()<0.5?MAT.basalt:MAT.basalt2,Math.cos(a)*1.55,0.12,Math.sin(a)*1.55);s.scale.setScalar(0.28+rand()*0.14);s.rotation.set(i,i*2,i);g.add(s);}
  const toM=Math.atan2(-25-SPRING.z,-19-SPRING.x),bx=Math.cos(toM)*2,bz=Math.sin(toM)*2;
  for(let i=0;i<3;i++){const s=mesh(rockGeo,MAT.basalt,bx+(i-1)*0.5,0.35+i*0.45,bz+(i===1?0.2:0));s.scale.set(0.7,0.55,0.6);s.rotation.y=i;g.add(s);}
  const falls=mesh(new THREE.PlaneGeometry(0.5,1.4),MAT.falls,bx*0.72,0.85,bz*0.72,false);falls.lookAt(new THREE.Vector3(SPRING.x,h+0.85,SPRING.z));g.add(falls);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+0.3,f=new THREE.Group();f.position.set(Math.cos(a)*2.2,0,Math.sin(a)*2.2);
    for(let k=0;k<5;k++){const l=mesh(frondGeo,MAT.bushDark);l.scale.setScalar(0.28);l.rotation.y=k*1.25;l.rotation.z=0.5;f.add(l);}g.add(f);}
  world.add(g);return g;})();

/* Decor: hibiscus bushes */
const bushes=[];
function makeHibiscus(){const f=new THREE.Group();for(let i=0;i<5;i++){const a=i/5*Math.PI*2,pe=mesh(new THREE.SphereGeometry(0.075,8,6),MAT.flower,Math.cos(a)*0.07,Math.sin(a)*0.07,0,false);pe.scale.set(1,1.5,0.3);pe.rotation.z=a+Math.PI/2;f.add(pe);}
  const st=cyl(0.008,0.12,std(0xf2c94c,{flatShading:false}),0,0,0.05,4);st.rotation.x=Math.PI/2;f.add(st);return f;}
(function decor(){const rand=mulberry32(77);let n=0,tries=0;
  while(n<10&&tries++<500){const a=rand()*Math.PI*2,r=8+rand()*27,x=Math.cos(a)*r,z=Math.sin(a)*r,h=H(x,z);
    if(h<0.7||h>3.5||nearSite(x,z,2.5)||featureNear(x,z,1.5)||S.palms.some(p=>dist(p.x,p.z,x,z)<2)||S.rocks.some(o=>dist(o.x,o.z,x,z)<2.5)||S.crops.some(c=>dist(c.x,c.z,x,z)<2.2))continue;
    const g=new THREE.Group();g.position.set(x,h,z);const leaves=new THREE.Group();g.add(leaves);
    for(let k=0;k<5;k++){const b=mesh(noisyGeo(new THREE.IcosahedronGeometry(0.5,1),0.32,n*11+k),k%2?MAT.bush:MAT.bushDark,(rand()-0.5)*0.9,0.38+rand()*0.35,(rand()-0.5)*0.8);b.scale.set(1,0.85,1);leaves.add(b);}
    for(let k=0;k<9;k++){const aa=rand()*Math.PI*2,el=0.2+rand()*0.6,fl=makeHibiscus();fl.position.set(Math.cos(aa)*0.78*Math.cos(el),0.45+Math.sin(el)*0.55,Math.sin(aa)*0.7*Math.cos(el));
      fl.rotation.set(-Math.asin(Math.sin(el)*0.8),Math.atan2(Math.cos(aa),Math.sin(aa)),0,'YXZ');g.add(fl);}
    world.add(g);bushes.push({x,z,g,i:n});n++;}})();

/* Built things */
let fireMesh=null,canoeMesh=null,coopMesh=null,penMesh=null;
function placeFireMesh(){if(!S.fire)return;fireMesh=makeFire();fireMesh.position.set(S.fire.x,H(S.fire.x,S.fire.z),S.fire.z);scene.add(fireMesh);}
function placeCanoeMesh(){if(!S.canoe)return;canoeMesh=makeCanoe();scene.add(canoeMesh);}
function placeCoopMesh(){if(!S.coop)return;coopMesh=makeCoop();coopMesh.position.set(S.coop.x,H(S.coop.x,S.coop.z),S.coop.z);coopMesh.rotation.y=S.coop.rot||0;scene.add(coopMesh);}
function placePenMesh(){if(!S.pen)return;penMesh=makePen();penMesh.position.set(S.pen.x,H(S.pen.x,S.pen.z),S.pen.z);scene.add(penMesh);}
function spawnTrap(t){t.mesh=makeTrap();t.mesh.position.set(t.x,0.08,t.z);t.mesh.rotation.y=t.rot||0;scene.add(t.mesh);}
function spawnTrench(t){t.mesh=makeTrench();t.mesh.position.set(t.x,H(t.x,t.z)+0.02,t.z);t.mesh.rotation.y=t.rot||0;scene.add(t.mesh);
  t.obj=makeTaroPlant(t.seed||7);t.mesh.userData.plants.add(t.obj.group);}
placeFireMesh();placeCanoeMesh();placeCoopMesh();placePenMesh();S.traps.forEach(spawnTrap);S.trenches.forEach(spawnTrench);

/* Fare stages + furniture */
const site=new THREE.Group();site.position.set(SITE.x,0,SITE.z);scene.add(site);
const stageGroups=[];
(function buildStages(){
  const rand=mulberry32(11);let g=new THREE.Group();
  g.add(box(6.4,0.6,5.4,MAT.basalt2,0,SITE_H+0.3,0));
  for(let i=0;i<34;i++){const d=i/34*2*(6.4+5.4);let x,z;
    if(d<6.4){x=-3.2+d;z=-2.7;}else if(d<11.8){x=3.2;z=-2.7+(d-6.4);}else if(d<18.2){x=3.2-(d-11.8);z=2.7;}else{x=-3.2;z=2.7-(d-18.2);}
    if(z>2.6&&Math.abs(x)<0.7)continue; // doorstep gap
    const s=mesh(rockGeo,rand()<0.5?MAT.basalt:MAT.basalt2,x,SITE_H+0.32,z);s.scale.set(0.38,0.34,0.38);s.rotation.set(rand()*3,rand()*3,rand()*3);g.add(s);}
  g.add(box(1.1,0.3,0.5,MAT.basalt,0,SITE_H+0.15,2.95));
  stageGroups.push(g);
  g=new THREE.Group();for(const x of[-2.8,2.8])for(const z of[-2.3,2.3])g.add(cyl(0.15,2.7,MAT.post,x,Y0+1.35,z));stageGroups.push(g);
  g=new THREE.Group();
  for(const z of[-2.3,2.3])g.add(box(6.0,0.2,0.2,MAT.post,0,Y0+2.7,z));
  for(const x of[-2.8,2.8]){g.add(box(0.2,0.2,4.8,MAT.post,x,Y0+2.7,0));g.add(cyl(0.12,1.4,MAT.post,x,Y0+3.4,0));}
  g.add(box(6.4,0.18,0.18,MAT.post,0,Y0+4.08,0));
  const rl=Math.hypot(2.5,1.45),ra=Math.atan2(1.45,2.5);
  for(const x of[-2.8,-1.4,0,1.4,2.8])for(const s of[-1,1]){const m=box(0.12,0.12,rl,MAT.post,x,Y0+3.33,s*1.25);m.rotation.x=s*ra;g.add(m);}
  for(const x of[-2.8,2.8])for(const z of[-2.3,2.3]){const t=mesh(new THREE.TorusGeometry(0.2,0.06,5,10),MAT.rope,x,Y0+2.62,z);t.rotation.x=Math.PI/2;g.add(t);}
  stageGroups.push(g);
  g=new THREE.Group();
  g.add(box(5.6,2.6,0.12,MAT.plank,0,Y0+1.3,-2.3));
  for(const x of[-2.8,2.8])g.add(box(0.12,2.6,4.6,MAT.plank,x,Y0+1.3,0));
  for(const s of[-1,1])g.add(box(2.15,2.6,0.12,MAT.plank,s*1.725,Y0+1.3,2.3));
  g.add(box(1.3,0.5,0.12,MAT.plank,0,Y0+2.35,2.3));
  const tri=new THREE.Shape();tri.moveTo(-2.3,0);tri.lineTo(2.3,0);tri.lineTo(0,1.45);tri.lineTo(-2.3,0);
  for(const x of[-2.8,2.8]){const m=mesh(new THREE.ShapeGeometry(tri),MAT.plank,x,Y0+2.6,0);m.rotation.y=Math.PI/2;g.add(m);}
  stageGroups.push(g);
  g=new THREE.Group();
  const L=Math.hypot(3.1,1.8),a=Math.atan2(1.8,3.1);
  for(const s of[-1,1]){const m=box(7.0,0.24,L,MAT.thatch,0,Y0+3.25,s*1.55);m.rotation.x=s*a;g.add(m);
    for(let i=0;i<14;i++){const f=box(0.5,0.35,0.06,MAT.ridge,-3.25+i*0.5,Y0+2.2,s*3.1);f.rotation.x=s*a*0.4;g.add(f);}}
  const cap=mesh(new THREE.CylinderGeometry(0.2,0.2,7.1,7),MAT.ridge,0,Y0+4.17,0);cap.rotation.z=Math.PI/2;g.add(cap);
  stageGroups.push(g);
  stageGroups.forEach((sg,i)=>{sg.visible=i<S.stage;site.add(sg);});
})();
const marker=new THREE.Group();site.add(marker);
(function(){for(const x of[-3.2,3.2])for(const z of[-2.7,2.7])marker.add(cyl(0.07,0.9,MAT.post,x,SITE_H+0.45,z));
  for(const z of[-2.7,2.7])marker.add(box(6.4,0.04,0.04,MAT.rope,0,SITE_H+0.75,z));
  for(const x of[-3.2,3.2])marker.add(box(0.04,0.04,5.4,MAT.rope,x,SITE_H+0.75,0));})();
marker.visible=S.stage===0;

const FURN_POS={mat:[0.7,0.5],bed:[-1.55,-1.35],shelf:[2.25,-0.9],lamp:[-2.15,1.55]};
const furnGroups={};
let lampLight=null,lampFlame=null,shelfJars=null;
(function buildFurniture(){
  let g=new THREE.Group();const m=box(2.2,0.03,1.5,MAT.weave,0,Y0+0.02,0);m.castShadow=false;g.add(m);g.position.set(...xz(FURN_POS.mat));furnGroups.mat=g;
  g=new THREE.Group();g.add(box(2.1,0.32,1.25,MAT.wood,0,Y0+0.2,0));g.add(box(2.0,0.16,1.15,MAT.tifaifai,0,Y0+0.44,0));
  g.add(box(0.45,0.12,0.8,MAT.white,-0.72,Y0+0.58,0));g.add(box(0.12,0.7,1.25,MAT.wood,-1.06,Y0+0.45,0));g.position.set(...xz(FURN_POS.bed));furnGroups.bed=g;
  g=new THREE.Group();for(const z of[-0.6,0.6])g.add(box(0.08,1.6,0.08,MAT.post,0,Y0+0.8,z));
  for(const y of[0.35,0.85,1.35])g.add(box(0.42,0.05,1.3,MAT.wood,0,Y0+y,0));
  for(let i=0;i<2;i++)g.add(mesh(new THREE.SphereGeometry(0.13,8,5,0,Math.PI*2,Math.PI/2,Math.PI/2),MAT.cup,0,Y0+0.98,-0.3+i*0.45));
  shelfJars=new THREE.Group();for(let i=0;i<4;i++)shelfJars.add(mesh(new THREE.CylinderGeometry(0.07,0.08,0.24,8),MAT.jar,0,Y0+1.5,-0.45+i*0.3));g.add(shelfJars);
  g.position.set(...xz(FURN_POS.shelf));furnGroups.shelf=g;
  g=new THREE.Group();g.add(cyl(0.05,0.9,MAT.post,0,Y0+0.45,0,5));g.add(mesh(new THREE.SphereGeometry(0.14,8,5,0,Math.PI*2,Math.PI/2,Math.PI/2),MAT.cup,0,Y0+1.05,0));
  lampFlame=mesh(new THREE.ConeGeometry(0.05,0.16,6),MAT.flame2,0,Y0+1.08,0,false);g.add(lampFlame);
  lampLight=new THREE.PointLight(0xffb56b,0,7,2);lampLight.position.y=Y0+1.3;g.add(lampLight);
  g.position.set(...xz(FURN_POS.lamp));furnGroups.lamp=g;
  for(const k in furnGroups){furnGroups[k].visible=!!S.furn[k];site.add(furnGroups[k]);}
  function xz(p){return [p[0],0,p[1]];}
})();
function furnWorld(k){const p=FURN_POS[k];return {x:SITE.x+p[0],z:SITE.z+p[1]};}

/* Fish shoals */
const shoals=[];
const rippleMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,depthWrite:false});
const fishShadowMat=new THREE.MeshBasicMaterial({color:0x0b3a44,transparent:true,opacity:0.45,depthWrite:false});
function shoalSpot(){for(let i=0;i<200;i++){const a=Math.random()*Math.PI*2,r=R-2+Math.random()*7.5,x=Math.cos(a)*r,z=Math.sin(a)*r;if(H(x,z)<-0.6&&Math.hypot(x,z)<REEF-0.8)return{x,z};}return{x:R+3,z:0};}
function makeShoal(){const g=new THREE.Group();
  for(let i=0;i<2;i++){const r=new THREE.Mesh(new THREE.RingGeometry(0.9,1.05,28),rippleMat);r.rotation.x=-Math.PI/2;r.userData.k=i*0.5;g.add(r);}
  const fishes=new THREE.Group();for(let i=0;i<5;i++){const f=new THREE.Mesh(new THREE.CircleGeometry(0.22,8),fishShadowMat);f.scale.set(0.5,1.6,1);f.rotation.x=-Math.PI/2;const a=i/5*Math.PI*2;f.position.set(Math.cos(a)*0.9,-0.02,Math.sin(a)*0.9);fishes.add(f);}
  g.add(fishes);g.userData.fishes=fishes;scene.add(g);return g;}
for(let i=0;i<4;i++){const sp=shoalSpot();const s={x:sp.x,z:sp.z,left:3,ttl:120+Math.random()*80,mesh:makeShoal()};s.mesh.position.set(s.x,0.07,s.z);shoals.push(s);}
function moveShoal(s){const sp=shoalSpot();s.x=sp.x;s.z=sp.z;s.left=3;s.ttl=120+Math.random()*80;s.mesh.position.set(s.x,0.07,s.z);}

/* Fishing line, target ring */
const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
const fishLine=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xf3ead2}));fishLine.frustumCulled=false;fishLine.visible=false;scene.add(fishLine);
const bobber=new THREE.Mesh(new THREE.SphereGeometry(0.09,8,6),new THREE.MeshBasicMaterial({color:0xde4634}));bobber.visible=false;scene.add(bobber);
const ringMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.85,depthWrite:false});
const targetRing=new THREE.Mesh(new THREE.RingGeometry(0.9,1.12,32),ringMat);targetRing.rotation.x=-Math.PI/2;targetRing.visible=false;scene.add(targetRing);

/* Characters (player and guests) */
function pareuTex(base,flower,leaf){return canvasTex(g=>{g.fillStyle=base;g.fillRect(0,0,128,128);
  const r=mulberry32(base.length*31+flower.length);
  const hib=(cx,cy,sz)=>{g.fillStyle=flower;for(let i=0;i<5;i++){g.save();g.translate(cx,cy);g.rotate(i*Math.PI*2/5+r());g.beginPath();g.ellipse(0,-sz*0.55,sz*0.36,sz*0.55,0,0,Math.PI*2);g.fill();g.restore();}
    g.fillStyle=leaf;g.beginPath();g.arc(cx,cy,sz*0.18,0,Math.PI*2);g.fill();};
  for(let i=0;i<7;i++)hib(r()*128,r()*128,12+r()*10);
  g.strokeStyle=leaf;g.lineWidth=3;for(let i=0;i<5;i++){const x=r()*128,y=r()*128;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+10,y-14,x+22,y-6);g.stroke();}
  g.fillStyle='rgba(255,255,255,.25)';g.fillRect(0,118,128,10);},2,1);}
const FACE={white:new THREE.MeshBasicMaterial({color:0xffffff}),eye:new THREE.MeshBasicMaterial({color:0x14100c}),glint:new THREE.MeshBasicMaterial({color:0xffffff}),
  mouth:new THREE.MeshBasicMaterial({color:0x5a2418}),cheek:new THREE.MeshBasicMaterial({color:0xff8f80,transparent:true,opacity:0.22,depthWrite:false})};
function makeCharacter(o){
  const g=new THREE.Group(),legs=[],arms=[],skin=o.skin,bw=o.build===2?1.14:o.build===0?0.92:1,eyes=[];
  for(const sd of[-1,1]){const pv=new THREE.Group();pv.position.set(sd*0.12*bw,0.64,0);
    pv.add(mesh(new THREE.CylinderGeometry(0.085*bw,0.068*bw,0.56,12),skin,0,-0.28,0));
    const ft=mesh(new THREE.SphereGeometry(0.075,12,8),skin,0,-0.59,0.05);ft.scale.set(0.85,0.5,1.5);pv.add(ft);
    if(!o.skirt)pv.add(mesh(new THREE.CylinderGeometry(0.115*bw,0.108*bw,0.24,12),o.bottom,0,-0.1,0));
    g.add(pv);legs.push(pv);}
  if(o.skirt){g.add(mesh(new THREE.CylinderGeometry(0.25*bw,0.37*bw,0.54,20,1,true),o.bottom,0,0.72,0));
    g.add(mesh(new THREE.CylinderGeometry(0.255*bw,0.255*bw,0.06,20),o.bottom,0,0.98,0));
    const knot=mesh(new THREE.SphereGeometry(0.065,10,8),o.bottom,0.2*bw,0.92,0.15);knot.scale.set(1,0.75,0.75);g.add(knot);
    const tail=mesh(new THREE.ConeGeometry(0.06,0.24,8),o.bottom,0.23*bw,0.8,0.18);tail.rotation.z=0.25;g.add(tail);}
  else{g.add(mesh(new THREE.CylinderGeometry(0.27*bw,0.29*bw,0.3,16),o.bottom,0,0.86,0));
    const knot=mesh(new THREE.SphereGeometry(0.05,10,8),o.bottom,0.22*bw,0.9,0.14);knot.scale.set(1,0.75,0.75);g.add(knot);}
  const torso=mesh(new THREE.SphereGeometry(0.3,20,14),o.top,0,1.2,0);torso.scale.set(0.84*bw,1.06,0.64*(o.build===2?1.1:1));g.add(torso);
  const shoulderMat=o.tank?skin:o.top;
  for(const sd of[-1,1]){const sh=mesh(new THREE.SphereGeometry(0.074*bw,12,8),shoulderMat,sd*0.262*bw,1.41,0);sh.scale.set(1.05,0.85,1);g.add(sh);}
  if(o.tank)for(const sd of[-1,1]){const st=mesh(new THREE.BoxGeometry(0.05,0.2,0.02),o.top,sd*0.13,1.44,0.17,false);st.rotation.x=-0.25;g.add(st);}
  g.add(mesh(new THREE.CylinderGeometry(0.065,0.075,0.14,10),skin,0,1.5,0));
  const neck=new THREE.Group();neck.position.y=1.47;g.add(neck);
  const head=new THREE.Group();head.position.y=1.8;g.add(head);
  const hd=mesh(new THREE.SphereGeometry(0.27,24,18),skin);hd.scale.set(1,0.98,0.95);head.add(hd);
  for(const sd of[-1,1]){const ear=mesh(new THREE.SphereGeometry(0.05,8,6),skin,sd*0.262,-0.02,0,false);ear.scale.set(0.45,1,0.8);head.add(ear);}
  // face: big friendly eyes with white, iris, pupil and a shine
  const irisMat=new THREE.MeshBasicMaterial({color:lin(o.eye||0x3b2414)});
  for(const sd of[-1,1]){const e=new THREE.Group();e.position.set(sd*0.095,0.0,0.222);e.rotation.y=sd*0.32;
    const wh=mesh(new THREE.SphereGeometry(0.052,16,12),FACE.white,0,0,0,false);wh.scale.set(0.95,1.12,0.42);e.add(wh);
    const ir=mesh(new THREE.SphereGeometry(0.036,16,12),irisMat,0,-0.004,0.014,false);ir.scale.set(1,1.1,0.4);e.add(ir);
    const pu=mesh(new THREE.SphereGeometry(0.019,12,8),FACE.eye,0,-0.004,0.022,false);pu.scale.set(1,1.1,0.4);e.add(pu);
    e.add(mesh(new THREE.SphereGeometry(0.01,8,6),FACE.glint,0.013,0.016,0.03,false));
    e.add(mesh(new THREE.SphereGeometry(0.005,6,4),FACE.glint,-0.012,-0.016,0.031,false));
    head.add(e);eyes.push(e);
    const br=mesh(new THREE.TorusGeometry(0.04,0.0065,4,12,Math.PI*0.7),o.hair,sd*0.098,0.062,0.24,false);br.rotation.z=Math.PI*0.15;br.rotation.y=sd*0.3;head.add(br);
    const ck=mesh(new THREE.CircleGeometry(0.024,14),FACE.cheek,sd*0.155,-0.065,0.208,false);ck.rotation.y=sd*0.6;head.add(ck);}
  const nose=mesh(new THREE.SphereGeometry(0.016,10,8),skin,0,-0.045,0.262,false);nose.scale.set(1.2,0.8,0.7);head.add(nose);
  const smile=mesh(new THREE.TorusGeometry(0.044,0.008,6,18,Math.PI),FACE.mouth,0,-0.088,0.247,false);smile.scale.y=0.8;smile.rotation.z=Math.PI;head.add(smile);
  // hair
  const cap=mesh(new THREE.SphereGeometry(0.282,24,12,0,Math.PI*2,0,Math.PI*0.5),o.hair,0,0.02,-0.012);cap.rotation.x=-0.42;head.add(cap);
  const hs=o.hairStyle||'short';
  if(hs==='short'){const fr=mesh(new THREE.SphereGeometry(0.14,12,8),o.hair,0.06,0.17,0.17);fr.scale.set(1.3,0.45,0.6);fr.rotation.z=-0.25;head.add(fr);}
  if(hs==='long'||hs==='longbun'){const back=mesh(new THREE.SphereGeometry(0.25,16,12),o.hair,0,-0.2,-0.14);back.scale.set(1.0,1.45,0.55);head.add(back);
    for(const sd of[-1,1]){const side=mesh(new THREE.SphereGeometry(0.09,10,8),o.hair,sd*0.235,-0.1,-0.02);side.scale.set(0.5,1.6,0.8);head.add(side);}}
  if(hs==='bun'||hs==='longbun')head.add(mesh(new THREE.SphereGeometry(0.115,14,10),o.hair,0,0.2,-0.19));
  if(hs==='curly'){const r=mulberry32(7);for(let i=0;i<22;i++){const a=r()*Math.PI*2,el=r()*1.25;const c=mesh(new THREE.SphereGeometry(0.075+r()*0.03,8,6),o.hair,Math.cos(a)*Math.cos(el)*0.27,0.05+Math.sin(el)*0.25,Math.sin(a)*Math.cos(el)*0.27-0.03);
    if(c.position.z>0.12&&c.position.y<0.17)continue;head.add(c);}}
  if(o.beard){const bd=mesh(new THREE.SphereGeometry(0.255,18,10,0,Math.PI*2,Math.PI*0.62,Math.PI*0.38),o.hair,0,0.02,0.015);bd.scale.set(1.04,1,1.02);head.add(bd);
    const mu=mesh(new THREE.BoxGeometry(0.1,0.02,0.02),o.hair,0,-0.072,0.252,false);head.add(mu);}
  if(o.tiare){const f=new THREE.Group();f.position.set(0.245,0.07,0.07);f.rotation.set(0,1.2,0.3);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2,pe=mesh(new THREE.SphereGeometry(0.045,8,6),MAT.tiare,Math.cos(a)*0.045,Math.sin(a)*0.045,0,false);pe.scale.set(1,1,0.35);f.add(pe);}
    f.add(mesh(new THREE.SphereGeometry(0.018,6,4),std(0xffc83d,{flatShading:false}),0,0,0.012,false));head.add(f);}
  if(o.hat){head.add(mesh(new THREE.CylinderGeometry(0.43,0.43,0.03,18),o.hat,0,0.17,0));head.add(mesh(new THREE.CylinderGeometry(0.2,0.25,0.18,14),o.hat,0,0.26,0));}
  let hand=null;
  for(const sd of[-1,1]){const pv=new THREE.Group();pv.position.set(sd*0.285*bw,1.43,0);
    pv.add(mesh(new THREE.CylinderGeometry(0.06*bw,0.052*bw,0.5,10),skin,0,-0.25,0));
    pv.add(mesh(new THREE.SphereGeometry(0.066,10,8),skin,0,-0.52,0));
    if(sd===1){hand=new THREE.Group();hand.position.set(0,-0.54,0.02);pv.add(hand);}
    pv.rotation.z=sd*0.12;g.add(pv);arms.push(pv);}
  return {group:g,legs,arms,head,hand,neck,eyes,bottomMat:o.bottom};
}
MAT.pareuRed=new THREE.MeshStandardMaterial({roughness:0.85,side:THREE.DoubleSide,map:pareuTex('#d6392c','#fbf3e2','#f2c94c')});
MAT.pareuViolet=new THREE.MeshStandardMaterial({roughness:0.85,side:THREE.DoubleSide,map:pareuTex('#6f45a8','#fbf3e2','#e2402e')});
/* Player */
const player=new THREE.Group();scene.add(player);
const LOOK={skins:[0xf1d0b0,0xe0b48f,0xc98a5a,0xa8703f,0x8a5530,0x5e3a22],hair:[0x1c1410,0x3a2416,0x6b4226,0x8a3a1c,0xd9b26a,0xb8b8b0],
  eyes:[0x3b2414,0x6b4422,0x8a6a2a,0x3f7d4a,0x3a6fa8,0x7a8a96],tops:[0xf6f1e6,0xf2c94c,0x2fb3b0,0xde4634,0x2c4a6a,0x8fd05e],
  pareu:[['#d6392c','#fbf3e2','#f2c94c'],['#2c7fb8','#fbf3e2','#f2c94c'],['#3f8a3a','#fbf3e2','#f2c94c'],['#f2b233','#fbf3e2','#de4634'],['#2fb3b0','#fbf3e2','#14313a'],['#1c1410','#fbf3e2','#de4634']],
  defaults:{woman:{hairStyle:'longbun',bottom:'skirt',top:'tank',flower:true,beard:false,build:1},man:{hairStyle:'short',bottom:'shorts',top:'tshirt',flower:false,beard:false,build:2},other:{hairStyle:'bun',bottom:'skirt',top:'tshirt',flower:true,beard:false,build:1}}};
const pareuMats={};
function pareuMat(i){if(!pareuMats[i]){const c=LOOK.pareu[i]||LOOK.pareu[0];pareuMats[i]=i===0?MAT.pareuRed:new THREE.MeshStandardMaterial({roughness:0.85,side:THREE.DoubleSide,map:pareuTex(c[0],c[1],c[2])});}return pareuMats[i];}
function lookOpts(){const L=S.look;return{skin:std(LOOK.skins[L.skin]||LOOK.skins[3],{flatShading:false,roughness:0.8}),top:std(LOOK.tops[L.tcol]||LOOK.tops[0],{flatShading:false}),
  bottom:pareuMat(L.pcol||0),hair:std(LOOK.hair[L.hairCol]||LOOK.hair[0],{flatShading:false}),eye:LOOK.eyes[L.eyes]||LOOK.eyes[0],hairStyle:L.hairStyle,tiare:L.flower,beard:L.beard,
  skirt:L.bottom==='skirt',tank:L.top==='tank',build:L.build};}
const PC=makeCharacter(lookOpts());
player.add(PC.group);
const legs=PC.legs,arms=PC.arms;
player.position.set(S.player.x,0,S.player.z);
if(S.boat&&S.canoe){player.position.set(S.canoe.x,0,S.canoe.z);player.rotation.y=S.canoe.rot||0;}

/* Animals */
S.animals.forEach(a=>{a.anim=makeAnimal(a.type);a.mesh=a.anim.group;a.mesh.position.set(a.x,groundYAnimal(a,a.x,a.z),a.z);scene.add(a.mesh);a.tx=a.x;a.tz=a.z;a.wait=Math.random()*3;});
function groundYAnimal(a,x,z){return (a.type==='cat'&&onFloor(x,z))?Y0:Math.max(H(x,z),0);}

/* =========================================================
   Camera & input
   ========================================================= */
const cam={yaw:S.player.yaw||0.5,pitch:0.58,dist:coarse?11:10};
const keys={};
function overlayOpen(){return !$('#look').hidden||!$('#intro').hidden||!$('#menu').hidden||!$('#win').hidden||!$('#levelup').hidden;}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(overlayOpen())return;
  if(k==='e')runAction(0);else if(k==='f')runAction(1);else if(k==='q')eatBest();else if(k==='c')openSheet(sheetMode==='craft'?null:'craft');else if(k==='b'||k==='i')openSheet(sheetMode==='bag'?null:'bag');
  else if(k==='escape'){if(sheetMode)openSheet(null);else openMenu();}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const joyV={x:0,y:0};
(function joystick(){const el=$('#joy'),kn=$('#knob');let id=null;
  function set(e){const r=el.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=Math.hypot(dx,dy),max=r.width/2-14;if(m>max){dx*=max/m;dy*=max/m;}
    kn.style.transform=`translate(${dx}px,${dy}px)`;joyV.x=dx/max;joyV.y=dy/max;}
  el.addEventListener('pointerdown',e=>{id=e.pointerId;el.setPointerCapture(id);set(e);e.preventDefault();});
  el.addEventListener('pointermove',e=>{if(e.pointerId===id)set(e);});
  const end=e=>{if(e.pointerId!==id)return;id=null;joyV.x=joyV.y=0;kn.style.transform='';};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);})();
(function orbit(){const el=renderer.domElement;const pts=new Map();let pinch=0;
  el.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});try{el.setPointerCapture(e.pointerId);}catch(_){}});
  el.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;
    if(pts.size===2){p.x=e.clientX;p.y=e.clientY;const arr=[...pts.values()];const d=Math.hypot(arr[0].x-arr[1].x,arr[0].y-arr[1].y);if(pinch)cam.dist=clamp(cam.dist*pinch/d,4,18);pinch=d;return;}
    cam.yaw-=(e.clientX-p.x)*0.0065;cam.pitch=clamp(cam.pitch+(e.clientY-p.y)*0.004,0.04,1.25);p.x=e.clientX;p.y=e.clientY;});
  const up=e=>{pts.delete(e.pointerId);pinch=0;};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('wheel',e=>{cam.dist=clamp(cam.dist+e.deltaY*0.01,4,18);e.preventDefault();},{passive:false});})();

/* =========================================================
   Inventory helpers
   ========================================================= */
let recent=[];
function give(obj,silentRecent){for(const k in obj){S.inv[k]=(S.inv[k]||0)+obj[k];if(obj[k]>0)S.seen[k]=1;if(!silentRecent&&obj[k]>0){recent=[k,...recent.filter(x=>x!==k)].slice(0,6);}}}
function take(obj){for(const k in obj)S.inv[k]-=obj[k];}
function hasAll(need){return Object.entries(need).every(([k,v])=>(S.inv[k]||0)>=v);}
function stat(k,n){S.stats[k]=(S.stats[k]||0)+(n===undefined?1:n);}
function nm(k){return ITEMS[k].n.toLowerCase();}

/* =========================================================
   UI
   ========================================================= */
const _v=new THREE.Vector3(),_p=new THREE.Vector3();
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2700);}
function floatText(t,pos){_v.copy(pos).project(camera);if(_v.z>1)return;const d=document.createElement('div');d.className='float';d.textContent=t;
  d.style.left=((_v.x+1)/2*innerWidth)+'px';d.style.top=((1-_v.y)/2*innerHeight)+'px';$('#floats').appendChild(d);setTimeout(()=>d.remove(),1350);}
function floatAtPlayer(t){floatText(t,_p.set(player.position.x,player.position.y+2.3,player.position.z));}
function once(flag,msg){if(!S.flags[flag]){S.flags[flag]=1;toast(msg);}}
function fmtTime(){const h=Math.floor(S.tod*24),m=Math.floor((S.tod*24-h)*60/10)*10;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
function isNight(){const h=S.tod*24;return h<5.5||h>=19;}
function stormy(){return S.weather.r>0.72&&S.weather.w>0.8;}

let lastHungerShown=-1,lastInv={};
function renderTop(){
  const L=LEVELS[Math.min(S.level,LEVELS.length)-1];
  $('#lv').innerHTML=S.level>LEVELS.length?'Home':`Lv ${S.level} · ${L.n}`;
  const kinds=ORDER.filter(k=>S.inv[k]>0).length;$('#bagCount').textContent=kinds;
  const h=Math.round(S.hunger),cls=h<15?'crit':h<40?'low':'';
  let html=`<div class="meter ${cls}" title="Food: ${h}%">${ICON.bowl}<div class="track"><div class="fill" style="width:${h}%"></div></div><span>${h}%</span></div>`;
  if(S.level>=7||S.money>0)html+=`<button class="chip money" data-money="1" title="Your money (CFP francs)">${ICON.xpf}<span>${fmtXPF(S.money)}</span></button>`;
  if(S.buff>0)html+=`<div class="chip buff" title="Monoʻi: hunger drains half as fast">${ICON.monoi}<span>${Math.ceil(S.buff/60)}m</span></div>`;
  const shown=[...recent.filter(k=>S.inv[k]>0)];
  for(const k of['coconut','log','stone','frond'])if(shown.length<5&&!shown.includes(k))shown.push(k);
  html+=shown.slice(0,S.level>=7?4:5).map(k=>{const it=ITEMS[k],food=it.food&&S.inv[k]>0,bump=lastInv[k]!==undefined&&S.inv[k]>lastInv[k]?' bump':'';
    const title=`${it.n}${it.t?' · '+it.t:''}${food?' · tap to eat (+'+it.food+')':''}`;
    return food?`<button class="chip food${bump}" data-eat="${k}" title="${title}" aria-label="Eat ${it.n}">${ICON[k]}<span>${S.inv[k]}</span></button>`
               :`<div class="chip${S.inv[k]?'':' zero'}${bump}" title="${title}">${ICON[k]}<span>${S.inv[k]}</span></div>`;}).join('');
  $('#inv').innerHTML=html;lastInv={...S.inv};lastHungerShown=h;
}
$('#inv').addEventListener('click',e=>{if(e.target.closest('[data-money]')){if(S.g2>=3)openSheet('pension');else toast('Open your pension to earn XPF from guests and the fruit stand.');return;}const b=e.target.closest('[data-eat]');if(b)eat(b.dataset.eat);});
$('#bagBtn').onclick=()=>openSheet(sheetMode==='bag'?null:'bag');
function goalDone(g){return g.chk?!!g.chk(S):(S.stats[g.k]||0)>=g.need;}
function goalProg(g){if(g.prog)return g.prog(S);if(g.k)return `${Math.min(S.stats[g.k]||0,g.need)}/${g.need}`;return '';}
function needHtml(need){return Object.entries(need).map(([k,v])=>`<span class="req ${S.inv[k]>=v?'ok':'no'}">${ICON[k]}${Math.min(S.inv[k],v)}/${v}</span>`).join('');}
function renderGoal(){
  const el=$('#goal');
  if(S.level>LEVELS.length){el.innerHTML=`<div class="ghead"><b>Your motu is home</b></div><div class="gnote">Keep planting, fishing and caring for your animals.</div>`;return;}
  const L=LEVELS[S.level-1],min=!!S.flags.goalMin;
  const done=L.goals.filter(goalDone).length;
  let html=`<button class="ghead" id="goalTog" aria-expanded="${!min}"><b>Level ${S.level} · ${L.n}</b><span class="gsub">${L.d} · ${done}/${L.goals.length}</span><span class="chev">${min?'+':'–'}</span></button>`;
  if(!min){
    html+='<ul class="glist">'+L.goals.map(g=>{const d=goalDone(g),p=goalProg(g);return `<li class="${d?'done':''}"><span class="box"></span><span class="gt">${g.t}</span>${p&&!d?`<em>${p}</em>`:''}</li>`;}).join('')+'</ul>';
    const hg=L.goals.find(g=>g.house&&!goalDone(g));
    if(hg&&S.stage<STAGES.length){const st=STAGES[S.stage];html+=`<div class="reqs"><span class="rl">${st.n}:</span>${needHtml(st.need)}</div>`;}
  }
  el.innerHTML=html;
}
$('#goal').addEventListener('click',e=>{if(e.target.closest('#goalTog')){S.flags.goalMin=S.flags.goalMin?0:1;renderGoal();}});
function wxLabel(){const w=S.weather;if(TOR.on)return['tornado','Tornado'];if(w.r>0.72&&w.w>0.8)return['storm','Storm'];if(w.w>0.72&&w.r<0.25)return['wind','Windy'];if(w.r>0.25)return['rain','Rain'];if(w.c>0.45)return['cloud','Cloudy'];return[isNight()?'moon':'sun',isNight()?'Clear night':'Clear'];}
function wxTrend(){const t=WX[S.weather.state],w=S.weather;if(TOR.on)return'Keep clear of it!';if(t.w>w.w+0.3&&t.r<0.2)return'Wind rising';if(t.r>w.r+0.2)return t.w>0.9?'Storm building':'Rain coming';if(t.r<w.r-0.2)return'Clearing up';if(t.c>w.c+0.25)return'Clouding over';return`Day ${S.day}`;}
let wxSig='';
function renderWx(){const[ic,lab]=wxLabel(),sig=ic+lab+fmtTime()+wxTrend();if(sig===wxSig)return;wxSig=sig;
  $('#wx').innerHTML=`${WXICON[ic]}<div>${lab} · ${fmtTime()}<small>${wxTrend()}</small></div>`;}

/* ----- bottom sheet: craft / bag / plant / cook ----- */
let sheetMode=null;
function openSheet(mode){if(mode!=='shop')phoneOrder=false;sheetMode=mode;$('#sheet').hidden=!mode;if(mode)renderSheet();}
$('#sheetClose').onclick=()=>openSheet(null);
function flowHtml(inp,out){return Object.entries(inp).map(([k,v])=>`${ICON[k]}${v}`).join(' <span class="plus">+</span> ')+(out?` <span class="arr">→</span> ${out}`:'');}
function row(id,name,sub,flow,btn,ok,why,extra){
  return `<div class="recipe${extra||''}"><div class="rinfo"><div class="name">${name}</div>${sub?`<div class="tah">${sub}</div>`:''}${flow?`<div class="flow">${flow}</div>`:''}${why?`<div class="why">${why}</div>`:''}</div>${btn?`<button data-id="${id}" ${ok?'':'disabled'}>${btn}</button>`:''}</div>`;}
function recipeCheck(r){
  if(r.lv>S.level)return{ok:false,why:`Unlocks at level ${r.lv}`};
  if(r.tool&&!(S.inv[r.tool]>0))return{ok:false,why:`Needs a ${nm(r.tool)}`};
  if(r.special){const c=specialCheck(r.special);if(!c.ok)return c;}
  if(r.one&&S.inv[r.one]>0)return{ok:false,why:'You already have one'};
  if(r.furn){if(S.stage<5)return{ok:false,why:'Finish your fare first'};if(S.furn[r.furn])return{ok:false,why:'Already in your fare'};}
  if(r.gbed){if(S.g2<3)return{ok:false,why:'Build the guest fare first'};if(S.pension.beds>=3)return{ok:false,why:'The guest fare has 3 beds'};}
  if(r.place){const c=placeCheck(r.place);if(!c.ok)return c;if(!hasAll(r.in))return{ok:false};return c;}
  return{ok:hasAll(r.in)};
}
function renderSheet(){
  const body=$('#sheetBody');let html='';
  if(sheetMode==='craft'){html=craftSheet();
  }else if(sheetMode==='bag'){
    $('#sheetTitle').textContent='Bag';
    let any=false;
    for(const[cat,label]of CATS){const ks=ORDER.filter(k=>ITEMS[k].cat===cat&&S.inv[k]>0);if(!ks.length)continue;any=true;
      html+=`<div class="sec">${label}</div><div class="bag-grid">`+ks.map(k=>{const it=ITEMS[k],act=it.food?'eat':it.use||it.wear||it.play||it.read?'use':'';
        return `<button class="bag-item${act?' act-'+act:''}" data-k="${k}" title="${it.n}${it.t?' · '+it.t:''}">${ICON[k]}<span class="bc">${S.inv[k]}</span><span class="bn">${it.n}</span>${it.food?`<span class="bf">+${it.food}</span>`:''}</button>`;}).join('')+'</div>';}
    if(!any)html+='<p class="small-note">Your bag is empty.</p>';
    html=wornHtml()+html;
    html+='<p class="small-note">Tap food to eat it. Tap monoʻi, a necklace, a pāreu or an instrument to use it.</p>';
    const tame=S.animals.filter(a=>a.tamed);if(tame.length)html+=`<div class="sec">Your animals</div>`+tame.map(a=>{const A=ANIMALS[a.type];return row('',`${A.name} the ${A.n}`,A.perk,'',null,false,'');}).join('');
  }else if(sheetMode==='plant'){
    $('#sheetTitle').textContent='Plant';
    html+=Object.keys(SEEDS).filter(k=>S.inv[k]>0).map(k=>{const kind=SEEDS[k],c=plantCheck(kind);
      return row(k,ITEMS[k].n,kind==='palm'?'Grows into a coconut palm':`Grows into a ${CROPS[kind].n} plant`,`${ICON[k]}${S.inv[k]}`,'Plant',c.ok,c.why);}).join('')||'<p class="small-note">Nothing to plant. Take shoots from banana, fei and taro plants.</p>';
    if(S.inv.taroshoot>0)html+='<p class="small-note">Taro tops go in a flooded taro trench.</p>';
  }else if(V7S[sheetMode]){html=v7Sheet(sheetMode);
  }else if(sheetMode==='decor'||sheetMode==='music'){html=v6Sheet(sheetMode);
  }else if(sheetMode==='shop'||sheetMode==='stall'||sheetMode==='pension'){html=pensionSheet(sheetMode);
  }else if(sheetMode==='cook'){
    $('#sheetTitle').textContent='Cook at the fire';
    html+=COOK.filter(r=>r.lv<=S.level).map(r=>{const[ok,ov]=Object.entries(r.out)[0];
      return row(r.id,r.n,`${r.t?r.t+' · ':''}+${ITEMS[ok].food} food`,flowHtml(r.in,`${ICON[ok]}${ov}`),'Cook',hasAll(r.in),'');}).join('');
  }
  body.innerHTML=html;
}
$('#sheetBody').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(V7S[sheetMode]){v7Click(b);return;}
  if(sheetMode==='decor'||sheetMode==='music'){v6Click(b);return;}
  if(sheetMode==='shop'||sheetMode==='stall'||sheetMode==='pension'){pensionClick(b);return;}
  if(sheetMode==='bag'){const k=b.dataset.k;if(!k)return;const it=ITEMS[k];if(it.read){openSheet('paper');return;}if(it.food)eat(k);else if(it.play)openMusic(k);else if(it.wear)wearItem(k);else if(it.use)applyMonoi(k);else toast(`${it.n}${it.t?': '+it.t:''}`);return;}
  const id=b.dataset.id;
  if(sheetMode==='craft'){if(b.dataset.ctab){craftTab=b.dataset.ctab;renderSheet();return;}doCraft(id);}
  else if(sheetMode==='plant'){const kind=SEEDS[id],c=plantCheck(kind);if(c.ok){plant(id,c);openSheet(null);}else toast(c.why);}
  else if(sheetMode==='cook'){if(!S.fire||dist(player.position.x,player.position.z,S.fire.x,S.fire.z)>2.8){toast('Walk back to your fire');return;}
    const r=COOK.find(x=>x.id===id);if(!hasAll(r.in))return;take(r.in);give(r.out);stat('cooked');
    const[ok]=Object.keys(r.out);floatText(`+1 ${nm(ok)}`,_p.set(S.fire.x,H(S.fire.x,S.fire.z)+1.6,S.fire.z));refresh();}
});
function doCraft(id){
  const r=RECIPES.find(x=>x.id===id),c=recipeCheck(r);
  if(!c.ok||!hasAll(r.in)){if(c.why)toast(c.why);return;}
  take(r.in);
  if(r.special){doSpecial(r.special);refresh();return;}
  if(r.gbed){S.pension.beds++;toast(`The pension now has ${S.pension.beds} rooms.`);}
  else if(r.furn){S.furn[r.furn]=true;furnGroups[r.furn].visible=true;toast(r.done||`${r.n.replace(/^(Build|Weave|Make) an? /,'').replace(/^./,m=>m.toUpperCase())} is in your fare.`);}
  else if(r.place){
    if(v10Place(r.place,c)||v9Place(r.place,c)){}
    else if(r.place==='fire'){S.fire={x:c.x,z:c.z};placeFireMesh();toast('Fire pit built. Cook your food here.');}
    else if(r.place==='canoe'){S.canoe={x:c.x,z:c.z,rot:c.rot};placeCanoeMesh();toast('Your vaʻa is on the water. Walk up to it to board.');}
    else if(r.place==='coop'){S.coop={x:c.x,z:c.z,rot:player.rotation.y,eggs:0,t:0};placeCoopMesh();toast('Coop built. Now win over the hen with grated coconut.');}
    else if(r.place==='pen'){S.pen={x:c.x,z:c.z,finds:[],milk:0,pt:0,gt:0};placePenMesh();toast('Pen built. The pig and the goat can live here.');}
    else if(r.place==='stall'){S.stall={x:c.x,z:c.z,rot:player.rotation.y+Math.PI,stock:{}};placeStallMesh();toast('Fruit stand built. Put things on it and visitors will buy them.');}
    else if(r.place==='ahimaa'){S.ahimaa={x:c.x,z:c.z,load:[],t:0,state:'empty'};placeAhimaaMesh();toast('Your ahimaʻa is dug. Fill it with food, then cover it to cook.');}
    else if(r.place==='store'){S.store={x:c.x,z:c.z,rot:player.rotation.y+Math.PI,stock:{}};placeStoreMesh();toast('Your fare toa is open! Stock its shelves. Shoppers come from the poti.');}
    else if(r.place==='compost'){S.compost={x:c.x,z:c.z,scraps:0,fert:0,t:0};placeCompostMesh();toast('Compost bin built. Put your scraps in it.');}
    else if(r.place==='trap'){const t={x:c.x,z:c.z,rot:c.rot,fish:0,t:0};S.traps.push(t);spawnTrap(t);toast('Trap set. Come back for the fish.');}
    openSheet(null);
  }else{give(r.out);const[ok,ov]=Object.entries(r.out)[0];toast(`+${ov} ${nm(ok)}`);
    stat(id);if(/^hei(pupu|poreho|parau)$/.test(id))stat('shellhei');if(id==='uke')S.owned.ukulele=true;}
  refresh();
}
function refresh(){renderTop();renderGoal();if(sheetMode)renderSheet();actSig='';checkLevel();save();}

/* ----- menu, overlays ----- */
function openMenu(){const m=Math.round((Date.now()-S.startedAt)/60000);
  $('#menuStats').textContent=`Level ${Math.min(S.level,LEVELS.length)} · day ${S.day} · ${S.animals.filter(a=>a.tamed).length} animals · ${S.planted} plants put in the ground · ${m} min on the island.`;$('#menu').hidden=false;armReset(false);}
$('#menuBtn').onclick=openMenu;
$('#resumeBtn').onclick=()=>{$('#menu').hidden=true;};
$('#howBtn').onclick=()=>{$('#menu').hidden=true;$('#intro').hidden=false;$('#startBtn').textContent='Back to the island';};
let resetArmed=false;
function armReset(on){resetArmed=on;const b=$('#resetBtn');b.textContent=on?'Tap again to wipe':'New island';b.className=on?'big warn':'big ghost';}
$('#resetBtn').onclick=()=>{if(!resetArmed){armReset(true);return;}doReset();};
let wiping=false;
function doReset(){wiping=true;try{[SAVE_KEY,V2_KEY,V1_KEY].forEach(k=>localStorage.removeItem(k));}catch(e){}location.reload();}
$('#startBtn').onclick=()=>{$('#intro').hidden=true;if(!S.look.set)openLook();};
$('#winBtn').onclick=()=>{$('#win').hidden=true;};
$('#lvBtn').onclick=()=>{$('#levelup').hidden=true;};
let winArmed=false;$('#winReset').onclick=e=>{if(!winArmed){winArmed=true;e.target.textContent='Tap again to wipe';e.target.className='big warn';return;}doReset();};

/* ----- levels ----- */
function checkLevel(){
  if(S.level>LEVELS.length)return;
  let gained=[],rewards={};
  while(S.level<=LEVELS.length&&LEVELS[S.level-1].goals.every(goalDone)){
    const L=LEVELS[S.level-1];gained.push(L);if(L.reward){for(const k in L.reward)rewards[k]=(rewards[k]||0)+L.reward[k];give(L.reward);}S.level++;
  }
  if(!gained.length)return;
  actSig='';renderTop();renderGoal();if(sheetMode)renderSheet();
  if(S.level>LEVELS.length){const m=Math.max(1,Math.round((Date.now()-S.startedAt)/60000));
    $('#winStats').textContent=`Day ${S.day} · ${S.animals.filter(a=>a.tamed).length} animals · ${S.planted} plants put in the ground · about ${m} minutes on the island.`;
    setTimeout(()=>{$('#win').hidden=false;},700);return;}
  const last=gained[gained.length-1],L=LEVELS[S.level-1];
  const newRec=RECIPES.filter(r=>r.lv===S.level).map(r=>`<li>${ICON[r.place||r.furn||r.special||(r.gbed&&'gbed')||Object.keys(r.out||{})[0]]}<span>${r.n}</span></li>`).join('');
  const newAn=Object.keys(ANIMALS).filter(k=>ANIMALS[k].lv===S.level).map(k=>`<li>${ICON.paw}<span>The ${ANIMALS[k].n} (${ANIMALS[k].t}) will let you approach</span></li>`).join('');
  const rw=Object.entries(rewards).map(([k,v])=>`<li>${ICON[k]}<span>Reward: ${v} ${ITEMS[k].n.toLowerCase()}${v>1&&!/s$/.test(ITEMS[k].n)?'s':''}</span></li>`).join('');
  $('#lvTitle').textContent=`Level ${S.level} · ${L.n}`;
  $('#lvKicker').textContent=`${last.n} complete`;
  $('#lvText').textContent=last.text||'';
  const extra=S.level===7?`<li>${ICON.ship}<span>The goélette calls at the new wharf every morning</span></li><li>${ICON.guest}<span>Guests arrive once the guest fare is built</span></li>`:'';
  $('#lvList').innerHTML=rw+extra+newRec+newAn;
  setTimeout(()=>{$('#levelup').hidden=false;},500);
}

/* =========================================================
   Food & monoʻi
   ========================================================= */
function bestFood(){let best=null;for(const k of ORDER){const f=ITEMS[k].food;if(f&&S.inv[k]>0&&(!best||f>ITEMS[best].food))best=k;}return best;}
function eat(k){if(!ITEMS[k]||!ITEMS[k].food||S.inv[k]<=0)return;
  if(S.hunger>=99){toast('You’re full.');return;}
  S.inv[k]--;S.hunger=Math.min(100,S.hunger+ITEMS[k].food);S.flags.warned=0;S.flags.starved=0;addScraps(k);
  floatAtPlayer(`Mmm, ${nm(k)}  +${ITEMS[k].food}`);refresh();}
function eatBest(){const k=bestFood();if(k)eat(k);else toast('Nothing to eat. Try bananas, coconuts or fish.');}
function applyMonoi(k){if(S.inv[k]<=0)return;S.inv[k]--;S.buff=k==='vmonoi'||k==='smonoi'?420:240;floatAtPlayer('Monoʻi on your skin');
  toast(`You smell of tiare${k==='vmonoi'?' and vanilla':k==='smonoi'?' and sandalwood':''}. Hunger drains half as fast for ${k==='vmonoi'||k==='smonoi'?7:4} minutes.`);refresh();}

/* =========================================================
   Placement checks
   ========================================================= */
function ahead(d){const a=player.rotation.y;return{x:player.position.x+Math.sin(a)*d,z:player.position.z+Math.cos(a)*d};}
function occupied(x,z,d){
  return S.palms.some(p=>dist(p.x,p.z,x,z)<d)||S.crops.some(c=>dist(c.x,c.z,x,z)<d)||
    S.rocks.some(o=>o.left>0&&dist(o.x,o.z,x,z)<d+0.3)||(S.fire&&dist(S.fire.x,S.fire.z,x,z)<d)||nearSite(x,z,d*0.6)||
    featureNear(x,z,d*0.6,true)||S.trenches.some(t=>dist(t.x,t.z,x,z)<d+0.8)||(S.coop&&dist(S.coop.x,S.coop.z,x,z)<d+0.6)||(S.pen&&dist(S.pen.x,S.pen.z,x,z)<d+2)||(S.stall&&dist(S.stall.x,S.stall.z,x,z)<d+0.8)||(S.compost&&dist(S.compost.x,S.compost.z,x,z)<d+0.6)||(S.ahimaa&&dist(S.ahimaa.x,S.ahimaa.z,x,z)<d+0.8)||(S.store&&dist(S.store.x,S.store.z,x,z)<d+2.2)||v9Occupied(x,z,d)||v10Occupied(x,z,d);}
function onLand(){return !S.boat;}
function plantCheck(kind){
  if(!onLand())return{ok:false,why:'Go ashore first'};
  if(onFloor(player.position.x,player.position.z))return{ok:false,why:'Step outside your fare'};
  const{x,z}=ahead(1.3),h=H(x,z);
  if(kind==='fei'){if(h<2.7)return{ok:false,why:'Fei grows on cooler, higher ground. Try the mountain slopes.'};if(h>5)return{ok:false,why:'Too steep here'};}
  else if(h<0.3||h>3.8)return{ok:false,why:h<0.3?'Too close to the water':'Too high and rocky'};
  if(occupied(x,z,kind==='uru'||(CROPS[kind]&&CROPS[kind].big)?2.8:2.0))return{ok:false,why:kind==='uru'||(CROPS[kind]&&CROPS[kind].big)?'An ʻuru tree needs lots of room':'Find open ground'};
  return{ok:true,x,z};
}
function trenchCheck(){
  if(!onLand())return{ok:false,why:'Go ashore first'};
  if(S.trenches.length>=MAX_TRENCH)return{ok:false,why:`You can keep ${MAX_TRENCH} trenches`};
  const{x,z}=ahead(1.8),h=H(x,z);
  if(h<0.5||h>3.8)return{ok:false,why:'Find flat ground inland'};
  if(occupied(x,z,1.9))return{ok:false,why:'Find open ground'};
  return{ok:true,x,z};
}
function placeCheck(what){
  if(!onLand()&&what!=='canoe')return{ok:false,why:'Go ashore first'};
  if(onFloor(player.position.x,player.position.z))return{ok:false,why:'Step outside your fare'};
  {const v10c=v10PlaceCheck(what);if(v10c)return v10c;const v9c=v9PlaceCheck(what);if(v9c)return v9c;}
  if(what==='fire'||what==='coop'||what==='pen'||what==='stall'||what==='compost'||what==='ahimaa'||what==='store'){
    if(S[what])return{ok:false,why:`You already have ${{fire:'a fire pit',coop:'a coop',pen:'a pen',stall:'a fruit stand',compost:'a compost bin',ahimaa:'an ahimaʻa',store:'a store'}[what]}`};
    const d=what==='pen'||what==='store'?3.2:what==='coop'?2.2:1.8,{x,z}=ahead(d),h=H(x,z);
    if(h<0.35||h>3.8)return{ok:false,why:'Stand on flat ground to build it'};
    if(occupied(x,z,what==='pen'||what==='store'?2.6:1.6))return{ok:false,why:'Too close to something. Find open ground.'};
    return{ok:true,x,z};
  }
  if(what==='trap'){
    if(S.traps.length>=MAX_TRAPS)return{ok:false,why:`You can set ${MAX_TRAPS} traps`};
    const px=player.position.x,pz=player.position.z;
    for(let d=1.4;d<=4.5;d+=0.4)for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=px+Math.sin(a)*d,z=pz+Math.cos(a)*d,h=H(x,z);
      if(h<-0.15&&h>-0.95&&!S.traps.some(t=>dist(t.x,t.z,x,z)<3)&&!(S.canoe&&dist(S.canoe.x,S.canoe.z,x,z)<2.5))return{ok:true,x,z,rot:a};}
    return{ok:false,why:'Stand at the water’s edge, by the shallows'};
  }
  if(S.canoe)return{ok:false,why:'You already have a vaʻa'};
  const px=player.position.x,pz=player.position.z;
  for(let d=2;d<=6;d+=0.5)for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=px+Math.sin(a)*d,z=pz+Math.cos(a)*d;
    if(H(x,z)<-0.25&&Math.hypot(x,z)<REEF-1)return{ok:true,x,z,rot:a};}
  return{ok:false,why:'Stand on the beach, next to the lagoon'};
}

/* =========================================================
   Interaction
   ========================================================= */
let actions=[],actSig='',target=null,fishing=null;
function candidates(){
  const px=player.position.x,pz=player.position.z,out=[];
  const add=(type,o,x,z,pad)=>{const d=dist(x,z,px,pz)-(pad||0);if(d<2.4)out.push({type,o,d,x,z});};
  const inside=onFloor(px,pz);
  if(inside){for(const k of['bed','shelf','lamp','mat','table','chairs'])if(S.furn[k]){const p=furnWorld(k);add('furn',k,p.x,p.z,k==='bed'?0.6:0.2);}}
  else{
    for(const p of S.palms)add('palm',p,p.x,p.z);
    for(const c of S.crops)add('crop',c,c.x,c.z,c.type==='uru'?0.6:0);
    for(const o of S.rocks)if(o.left>0)add('rock',o,o.x,o.z,0.4);
    for(const b of S.bamboo)add('bamboo',b,b.x,b.z,0.4);
    for(const t of S.trenches)add('trench',t,t.x,t.z,0.6);
    for(const t of S.traps)add('trap',t,t.x,t.z,0.8);
    add('spring',null,SPRING.x,SPRING.z,1.3);
    if(S.fire)add('fire',S.fire,S.fire.x,S.fire.z,0.4);
    if(S.canoe)add('canoe',S.canoe,S.canoe.x,S.canoe.z,1.0);
    if(S.coop)add('coop',S.coop,S.coop.x,S.coop.z,0.7);
    if(S.pen)add('pen',S.pen,S.pen.x,S.pen.z,2.2);
    if(S.level>=7){
      const gd=g2Dist(px,pz);if(gd<1.9)out.push({type:S.g2<3?'gsite':'gfare',d:gd,x:SITE2.x,z:SITE2.z});
      const e=dockPt(DOCK.r1-1,0);add('goe',null,e.x,e.z,0.3);
      if(S.stall)add('stall',S.stall,S.stall.x,S.stall.z,0.6);
    }
    const sd=(()=>{const dx=Math.max(0,Math.abs(px-SITE.x)-SITE_HX),dz=Math.max(0,Math.abs(pz-SITE.z)-SITE_HZ);return Math.hypot(dx,dz);})();
    if(sd<1.9&&S.stage<STAGES.length)out.push({type:'site',d:sd,x:SITE.x,z:SITE.z});
    v6Candidates(out,px,pz,add);
  }
  for(const n of S.npcs){if(n.role!=='guest'||n.state==='leave'||!n.body.group.visible)continue;const d=dist(n.x,n.z,px,pz)-0.2;if(d<2.1)out.push({type:'npc',o:n,d:d-0.4,x:n.x,z:n.z});}
  for(const a of S.animals){const d=dist(a.mesh.position.x,a.mesh.position.z,px,pz)-0.2;if(d<2.1)out.push({type:'animal',o:a,d:a.tamed?d+2.5:d-0.3,x:a.mesh.position.x,z:a.mesh.position.z});}
  out.sort((a,b)=>a.d-b.d);return out[0]||null;
}
function growSub(g){return `Growing · ${Math.floor(g*100)}%${S.weather.r>0.25?' · rain helps':''}`;}
function waterAct(o){return S.inv.water>0?{label:'Water it',sub:'1 cup · grows faster',cls:'alt',fn:()=>waterPlant(o)}:null;}
function computeActions(){
  if(FLY.on)return [];
  const A=[];
  if(S.boat){
    target=null;
    if(fishing)A.push({label:'Line in the water',sub:'Waiting for a bite…',off:true});
    else if(stormy())A.push({label:'Cast line',sub:'Too rough. Head back to shore.',off:true});
    else{const sh=nearShoal(),fl=nearFlock();A.push({label:'Cast line',sub:fl?'Birds are diving: tuna below!':sh?'Fish are rippling here':S.sail?'Look for ripples, or diving birds at sea':'Look for rippling water',fn:cast});}
    const land=findLanding();A.push(land?{label:'Go ashore',sub:'Pull the vaʻa up the beach',cls:'alt',fn:()=>goAshore(land)}:{label:'Go ashore',sub:'Paddle closer to the beach',cls:'alt',off:true});
    v6BoatActions(A);
  }else{
    const best=candidates();target=best;
    const t=best&&best.type,o=best&&best.o;
    if(t==='palm'){
      if(o.state==='stump')A.push({label:'Stump',sub:'Chopped palms don’t regrow',off:true});
      else if(o.g<1){A.push({label:'Young palm',sub:growSub(o.g),off:true});const w=waterAct(o);if(w)A.push(w);const f2=fertAct(o);if(f2)A.push(f2);}
      else{A.push(o.cd>0?{label:'Shake palm',sub:`Coconuts back in ${Math.ceil(o.cd)}s`,off:true}:{label:'Shake palm',sub:'+2 coconut · +2 frond',fn:()=>gather(o)});
        A.push({label:'Chop down',sub:`+${3+(S.owned.machete?1:0)+(S.inv.toi>0?1:0)} logs · palm is gone`,cls:'alt',fn:()=>chop(o)});}
    }else if(t==='crop'){const C=CROPS[o.type],n=C.n;
      if(o.g<1){A.push({label:`Young ${n}`,sub:growSub(o.g),off:true});const w=waterAct(o);if(w)A.push(w);const f2=fertAct(o);if(f2)A.push(f2);}
      else{const gain=Object.entries(C.yield).map(([k,v])=>`+${v+(o.type==='banana'&&catPerk()?1:0)} ${nm(k)}`).join(' · ');
        const verb=C.verb||(o.type==='taro'?'Pull taro':o.type==='tiare'?'Pick flowers':o.type==='vanilla'?'Pick a pod':o.type==='uru'?'Pick ʻuru':`Cut ${n} bunch`);
        A.push(o.cd>0?{label:verb,sub:`Ready again in ${Math.ceil(o.cd)}s`,off:true}:{label:verb,sub:gain,fn:()=>harvest(o)});
        A.push(o.scd>0?{label:'Take a shoot',sub:`New shoot in ${Math.ceil(o.scd)}s`,cls:'alt',off:true}:{label:o.type==='tiare'||o.type==='vanilla'||C.cutting?'Take a cutting':/seed$/.test(C.shoot)?'Collect a seedling':'Take a shoot',sub:`+1 ${nm(C.shoot)}`,cls:'alt',fn:()=>takeShoot(o)});v6CropExtra(o,A);}
    }else if(t==='rock')A.push({label:'Break basalt',sub:`+2 stone · ${o.left} hit${o.left>1?'s':''} left`,fn:()=>mine(o)});
    else if(t==='bamboo')A.push(o.cd>0?{label:'Cut bamboo',sub:`New canes in ${Math.ceil(o.cd)}s`,off:true}:{label:'Cut bamboo',sub:'+2 bamboo',fn:()=>cutBamboo(o)});
    else if(t==='spring'){
      A.push(S.inv.ipu>0?{label:'Fill cups',sub:`+${S.inv.ipu} cup${S.inv.ipu>1?'s':''} of water`,fn:fillCups}:{label:'Fresh water',sub:S.level>=2?'Carve coconut cups to carry it':'You’ll need cups (level 2)',off:true});
    }else if(t==='trench'){
      if(!o.flooded)A.push(S.inv.water>=2?{label:'Flood the trench',sub:'2 cups of water',fn:()=>flood(o)}:{label:'Flood the trench',sub:`Needs 2 cups of water · you have ${S.inv.water}`,off:true});
      else if(!o.planted)A.push(S.inv.taroshoot>0?{label:'Plant taro',sub:'1 taro top',fn:()=>plantTaro(o)}:{label:'Plant taro',sub:'Take a taro top from the wild taro by the spring',off:true});
      else if(o.g<1){A.push({label:'Taro growing',sub:growSub(o.g),off:true});const f2=fertAct(o);if(f2)A.push(f2);}
      else A.push({label:'Harvest taro',sub:'+2 taro · +1 taro top',fn:()=>harvestTrench(o)});
    }else if(t==='trap')A.push(o.fish>0?{label:'Empty the trap',sub:`+${o.fish} fish`,fn:()=>emptyTrap(o)}:{label:'Fish trap',sub:'Empty for now. Come back later.',off:true});
    else if(t==='fire')A.push(COOK.some(r=>r.lv<=S.level&&hasAll(r.in))?{label:'Cook',sub:'Open the cooking list',fn:()=>openSheet('cook')}:{label:'Fire pit',sub:'Bring fei, fish, taro or ʻuru',off:true});
    else if(t==='canoe')A.push(stormy()?{label:'Board vaʻa',sub:'Too rough to paddle out',off:true}:{label:'Board vaʻa',sub:'Paddle out to fish',cls:'alt',fn:board});
    else if(t==='coop'){const ch=tamedOf('chicken');A.push(o.eggs>0?{label:'Collect eggs',sub:`+${o.eggs} egg${o.eggs>1?'s':''}`,fn:()=>collectEggs(o)}:{label:'Coop',sub:ch?'No eggs yet':'Win over the hen with grated coconut',off:true});}
    else if(t==='pen'){const n=o.finds.length+o.milk;A.push(n>0?{label:'Collect',sub:penSummary(o),fn:()=>collectPen(o)}:{label:'Animal pen',sub:tamedOf('pig')||tamedOf('goat')?'Nothing to collect yet':'For the pig and the goat',off:true});}
    else if(t==='site'){const st=STAGES[S.stage],ok=hasAll(st.need);
      A.push({label:`Build ${st.n}`,sub:ok?Object.entries(st.need).map(([k,v])=>`${v} ${nm(k)}`).join(' · '):'Missing materials',off:!ok,fn:ok?build:null});}
    else if(V6T[t])v6Actions(t,o,A);
    else if(V9T[t])v9Actions(t,o,A);
    else if(V10T[t])v10Actions(t,o,A);
    else if(t==='animal')animalActions(o,A);
    else if(t==='gsite'){const st=GSTAGES[S.g2],ok=hasAll(st.need);
      A.push({label:`Build ${st.n}`,sub:ok?Object.entries(st.need).map(([k,v])=>`${v} ${nm(k)}`).join(' · '):`Guest fare · missing materials`,off:!ok,fn:ok?buildG2:null});}
    else if(t==='gfare')A.push({label:'Pension de famille',sub:`${rating(S).toFixed(1)}★ · ${guestsStaying()}/${S.pension.beds} rooms taken`,fn:()=>openSheet('pension')});
    else if(t==='goe')A.push(goePresent()?{label:'Trade with the goélette',sub:'Things you can’t make yourself',fn:()=>openSheet('shop')}:{label:'The wharf',sub:'The goélette calls every morning, 06:00–13:00',off:true});
    else if(t==='stall'){const n=stockCount();A.push({label:'Stock the stand',sub:n?`${n} thing${n>1?'s':''} on display`:'Empty · visitors walk past',fn:()=>openSheet('stall')});}
    else if(t==='npc'){guestActions(o,A);excActions(o,A);v9GuestActions(o,A);}
    else if(t==='furn'){
      if(o==='bed')A.push(isNight()?(S.dmg.fare>=0.5&&S.weather.r>0.25?{label:'Sleep until morning',sub:'Rain drips through the roof. Repair it first.',off:true}:{label:'Sleep until morning',sub:'In your bed under the tīfaifai',fn:sleep}):{label:'Your bed',sub:'You can sleep after dark (19:00)',off:true});
      else if(o==='lamp')A.push({label:'Oil lamp',sub:isNight()?'Glowing':'It lights itself at dusk',off:true});
      else if(o==='shelf')A.push({label:'Shelf',sub:`${Math.min(4,(S.stats.monoi||0))} monoʻi jars on display`,off:true});
      else if(o==='table'){const bf=bestFood();A.push(bf?{label:'Eat at the table',sub:`${ITEMS[bf].n} · +${Math.round(ITEMS[bf].food*1.25)} at the table`,fn:()=>eatAtTable(bf)}:{label:'Table',sub:'Bring food for a proper meal',off:true});}
      else if(o==='chairs')A.push(sitting?{label:'Sitting',sub:'Move to stand up',off:true}:{label:'Sit down',sub:'Rest a moment on a chair',fn:sitDown});
      else A.push({label:'Peue mat',sub:'Woven from bamboo strips',off:true});
    }else{
      const seeds=Object.keys(SEEDS).filter(k=>S.inv[k]>0);
      if(seeds.length===1){const k=seeds[0],c=plantCheck(SEEDS[k]);A.push(c.ok?{label:`Plant ${nm(k)}`,sub:SEEDS[k]==='palm'?'Grows into a palm':`Grows into a ${CROPS[SEEDS[k]].n} plant`,cls:'alt',fn:()=>plant(k,c)}:{label:`Plant ${nm(k)}`,sub:c.why,cls:'alt',off:true});}
      else if(seeds.length>1)A.push({label:'Plant…',sub:`${seeds.length} kinds to choose from`,cls:'alt',fn:()=>openSheet('plant')});
      if((S.inv.oo>0||S.inv.pelle>0)&&!onFloor(player.position.x,player.position.z)){const c=trenchCheck();A.push(c.ok?{label:'Dig a taro trench',sub:S.inv.pelle>0?'With your wooden spade':'With your digging stick',fn:()=>dig(c)}:{label:'Dig a taro trench',sub:c.why,off:true});}
    }
  }
  v6Extra(A,target);
  const bf=bestFood();
  if(bf&&S.hunger<80)A.push({label:'Eat',sub:`${ITEMS[bf].n} · +${ITEMS[bf].food}`,cls:'eat',eat:true,fn:eatBest});
  A.push({label:'Craft',sub:'Tools, food, furniture',cls:'ghost',craft:true,fn:()=>openSheet(sheetMode==='craft'?null:'craft')});
  return A;
}
function animalActions(a,A){
  const D=ANIMALS[a.type];
  if(a.tamed){A.push({label:`Pet ${D.name}`,sub:D.perk,cls:'alt',fn:()=>pet(a)});return;}
  if(S.level<D.lv){A.push({label:`Wild ${D.n}`,sub:`Shy for now · level ${D.lv}`,off:true});return;}
  if(D.req&&!S[D.req]){A.push({label:`Wild ${D.n}`,sub:`Needs a ${D.req==='coop'?'chicken coop':'pen'} first`,off:true});return;}
  const food=D.food.find(k=>S.inv[k]>0);
  A.push(food?{label:`Feed the ${D.n}`,sub:`${ITEMS[food].n} · ${a.fed}/${D.need}`,fn:()=>feed(a,food)}:{label:`Wild ${D.n}`,sub:`Likes ${D.food.slice(0,2).map(nm).join(' or ')} · ${a.fed}/${D.need}`,off:true});
}
function renderActions(){
  const sig=actions.map(a=>a.label+'|'+a.sub+'|'+!!a.off).join('/');if(sig===actSig)return;actSig=sig;
  let n=0;$('#actions').innerHTML=actions.map((a,i)=>{const key=a.craft?'C':a.eat?'Q':a.off?'':(n<2?(n++===0?'E':'F'):'');
    return `<button class="act ${a.cls||''}" data-i="${i}" ${a.off?'disabled':''}>${a.label}${key?`<kbd>${key}</kbd>`:''}<small>${a.sub}</small></button>`;}).join('');
}
$('#actions').addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;const a=actions[+b.dataset.i];if(a&&a.fn&&!a.off)a.fn();});
function runAction(slot){const live=actions.filter(a=>!a.off&&!a.craft&&!a.eat);const a=live[slot];if(a&&a.fn)a.fn();}

/* ----- actions ----- */
let shakeT=0,shakeObj=null,chopT=0;
function tamedOf(type){return S.animals.some(a=>a.type===type&&a.tamed);}
function catPerk(){return tamedOf('cat');}
function gather(p){give({coconut:2+(p.fert?1:0),frond:2});p.fert=0;stat('coconut',2);p.cd=REGROW_PALM;shakeT=0.5;shakeObj=p;chopT=0.3;
  floatText('+2 coconut  +2 frond',_p.set(p.x,H(p.x,p.z)+3.5,p.z));refresh();}
function chop(p){p.state='stump';showTool('toi');const n=3+(S.owned.machete?1:0)+(S.inv.toi>0?1:0);give({log:n});stat('log',n);chopT=0.4;floatText(`+${n} logs`,_p.set(p.x,H(p.x,p.z)+2,p.z));
  once('chop','Chopped palms are gone for good. Plant coconuts to grow new ones.');refresh();}
function mine(o){o.left--;give({stone:2});stat('stone',2);chopT=0.4;if(o.left<=0)o.rcd=ROCK_RESPAWN;floatText('+2 stone',_p.set(o.x,H(o.x,o.z)+1.6,o.z));refresh();}
function cutBamboo(b){showTool('toi');const n=S.owned.machete?3:2;give({bamboo:n});stat('bamboo',n);b.cd=BAMBOO_CD;chopT=0.4;shakeT=0.5;shakeObj=b;floatText(`+${n} bamboo`,_p.set(b.x,H(b.x,b.z)+2.5,b.z));
  once('bamboo','Split bamboo into strips to weave mats and fish traps.');refresh();}
function harvest(c){const C=CROPS[c.type],y={...C.yield};if(c.fert){for(const k in y)y[k]++;c.fert=0;}if(c.type==='banana'&&catPerk())y.banana++;
  give(y);for(const k in y)if(k==='taro'||k==='vanilla')stat(k,y[k]);
  c.cd=C.regrow;chopT=0.4;shakeT=0.5;shakeObj=c;
  floatText(Object.entries(y).map(([k,v])=>`+${v} ${nm(k)}`).join('  '),_p.set(c.x,H(c.x,c.z)+(c.type==='uru'?4:2.5),c.z));
  if(c.type==='fei')once('fei','Fei is eaten cooked. Roast it at a fire pit.');
  if(c.type==='taro')once('taro','Taro must be cooked. A taro top can be planted in a flooded trench.');
  refresh();}
function takeShoot(c){const C=CROPS[c.type];chopT=0.3;give({[C.shoot]:1});c.scd=C.shootCd;
  floatText(`+1 ${nm(C.shoot)}`,_p.set(c.x,H(c.x,c.z)+1.2,c.z));
  if(c.type==='fei')once('fshoot','Fei shoots only take on the cool mountain slopes.');refresh();}
function plant(k,chk){S.inv[k]--;const kind=SEEDS[k],seed=Math.floor(Math.random()*1e9);
  if(kind==='palm'){const p={x:chk.x,z:chk.z,seed,state:'tree',g:S.inv.pelle>0?0.2:0,cd:0};S.palms.push(p);spawnPalm(p);}
  else{const c={type:kind,x:chk.x,z:chk.z,seed,g:S.inv.pelle>0?0.2:0,cd:0,scd:CROPS[kind].shootCd,wild:false};S.crops.push(c);spawnCrop(c);}
  S.planted++;stat('planted');floatText('Planted',_p.set(chk.x,H(chk.x,chk.z)+1,chk.z));
  once('rainTip','Plants grow faster in the rain, or when you water them.');refresh();}
function waterPlant(o){if(S.inv.water<=0)return;S.inv.water--;S.inv.ipu++;o.g=Math.min(1,o.g+0.25);floatText('Watered',_p.set(o.x,H(o.x,o.z)+1.2,o.z));refresh();}
function fillCups(){const n=S.inv.ipu;if(!n)return;S.inv.ipu=0;give({water:n});stat('water',n);chopT=0.3;floatAtPlayer(`+${n} water`);refresh();}
function dig(c){chopT=0.6;showTool(S.inv.pelle>0?'pelle':'oo');const t={x:c.x,z:c.z,rot:player.rotation.y,flooded:false,planted:false,g:0,seed:Math.floor(Math.random()*1e9)};S.trenches.push(t);spawnTrench(t);
  floatText('Trench dug',_p.set(c.x,H(c.x,c.z)+1,c.z));once('trench','Flood it with 2 cups of water, then plant a taro top.');refresh();}
function flood(t){S.inv.water-=2;S.inv.ipu+=2;t.flooded=true;stat('flooded');floatText('Flooded',_p.set(t.x,H(t.x,t.z)+1,t.z));refresh();}
function plantTaro(t){S.inv.taroshoot--;t.planted=true;t.g=0;stat('planted');S.planted++;floatText('Taro planted',_p.set(t.x,H(t.x,t.z)+1,t.z));refresh();}
function harvestTrench(t){give({taro:2,taroshoot:1});stat('taro',2);t.planted=false;t.g=0;chopT=0.4;floatText('+2 taro  +1 taro top',_p.set(t.x,H(t.x,t.z)+1.5,t.z));refresh();}
function emptyTrap(t){const n=t.fish;give({fish:n});stat('fish',n);t.fish=0;t.t=0;floatText(`+${n} fish`,_p.set(t.x,1,t.z));refresh();}
function collectEggs(c){const n=c.eggs;give({egg:n});c.eggs=0;floatText(`+${n} egg${n>1?'s':''}`,_p.set(c.x,H(c.x,c.z)+1.5,c.z));refresh();}
function penSummary(p){const parts=[];if(p.milk)parts.push(`${p.milk} milk`);const f={};p.finds.forEach(k=>f[k]=(f[k]||0)+1);for(const k in f)parts.push(`${f[k]} ${nm(k)}`);return parts.join(' · ');}
function collectPen(p){const got={};if(p.milk)got.milk=p.milk;p.finds.forEach(k=>got[k]=(got[k]||0)+1);give(got);p.milk=0;p.finds=[];
  floatText(Object.entries(got).map(([k,v])=>`+${v} ${nm(k)}`).join('  '),_p.set(p.x,H(p.x,p.z)+1.5,p.z));refresh();}
function feed(a,food){const D=ANIMALS[a.type];S.inv[food]--;a.fed++;hearts(a);
  if(a.fed>=D.need){a.tamed=true;stat('tamed');toast(`${D.name} the ${D.n} is yours now. ${D.perk}.`);floatText(`Meet ${D.name}!`,_p.set(a.mesh.position.x,a.mesh.position.y+1.8,a.mesh.position.z));
    a.wait=0;}else floatText(`${a.fed}/${D.need}`,_p.set(a.mesh.position.x,a.mesh.position.y+1.6,a.mesh.position.z));
  refresh();}
function pet(a){hearts(a);a.wait=1.2;}
function hearts(a){for(let i=0;i<3;i++)setTimeout(()=>floatText('♥',_p.set(a.mesh.position.x+(Math.random()-0.5)*0.6,a.mesh.position.y+1.3,a.mesh.position.z)),i*180);}
const tweens=[];
function build(){const st=STAGES[S.stage];if(!hasAll(st.need))return;take(st.need);
  const g=stageGroups[S.stage];g.visible=true;g.scale.set(1,0.01,1);tweens.push({g,t:0});
  S.stage++;marker.visible=false;floatText(`${st.n} built`,_p.set(SITE.x,Y0+3,SITE.z));
  if(S.stage===4)toast('Walls up. You can walk in through the doorway.');
  if(S.stage===5)toast('Your fare is finished! Step inside and furnish it.');
  refresh();}

/* canoe & fishing */
function board(){if(!S.canoe)return;S.boat=true;player.position.set(S.canoe.x,0,S.canoe.z);player.rotation.y=S.canoe.rot||0;
  once('boat','Paddle to rippling water and cast your line. Stay inside the reef.');refresh();}
function findLanding(){const px=player.position.x,pz=player.position.z;let best=null,bd=1e9;
  for(let d=1.2;d<=3.4;d+=0.55)for(let i=0;i<20;i++){const a=i/20*Math.PI*2,x=px+Math.sin(a)*d,z=pz+Math.cos(a)*d,h=H(x,z);
    if(h>0.15&&h<3&&!occupied(x,z,0.9)&&d<bd){bd=d;best={x,z};}}
  return best;}
function goAshore(land){S.canoe.x=player.position.x;S.canoe.z=player.position.z;S.canoe.rot=player.rotation.y;S.boat=false;fishing=null;
  player.position.x=land.x;player.position.z=land.z;fishLine.visible=bobber.visible=false;refresh();}
function nearShoal(){const px=player.position.x,pz=player.position.z;return shoals.find(s=>s.left>0&&dist(s.x,s.z,px,pz)<4.5)||null;}
function cast(){if(fishing||stormy())return;const a=player.rotation.y,bx=player.position.x+Math.sin(a)*3.2,bz=player.position.z+Math.cos(a)*3.2;
  fishing={t:1.6+Math.random()*1.8,shoal:nearShoal(),flock:nearFlock(),bx,bz};fishLine.visible=bobber.visible=true;actSig='';}
function finishCast(){const f=fishing;fishing=null;fishLine.visible=bobber.visible=false;if(f.flock||outsideReef()){deepCatch(f.flock);return;}
  const dusk=isNight()||(S.tod>0.72&&S.tod<0.8)?0.12:0,rainB=S.weather.r>0.25?0.08:0;
  let n=0;if(f.shoal&&f.shoal.left>0){n=S.owned.hooks?Math.min(2,f.shoal.left):Math.random()<0.95?(Math.random()<0.45?2:1):0;f.shoal.left-=n;if(f.shoal.left<=0)setTimeout(()=>moveShoal(f.shoal),1500);}
  else n=Math.random()<0.32+dusk+rainB+(S.owned.hooks?0.25:0)?1:0;
  _p.set(player.position.x,1.8,player.position.z);
  if(n){give({fish:n});stat('fish',n);floatText(`+${n} fish`,_p);once('fishTip','Grill fish at your fire, or mix it with coconut for poisson cru.');}
  else floatText('No bite',_p);refresh();}

/* sleep */
function sleep(){
  const skip=S.tod<0.5?(0.27-S.tod):(1-S.tod+0.27),secs=Math.max(0,skip*DAY_LEN);
  const fade=$('#fade');fade.hidden=false;fade.classList.remove('go');void fade.offsetWidth;fade.classList.add('go');
  setTimeout(()=>{for(let i=0;i<secs;i++)simStep(1,true,0.4);S.tod=0.27;stat('slept');wxSig='';actSig='';
    renderWx();refresh();toast('Ia ora na! You slept until morning.');},700);
  setTimeout(()=>{fade.hidden=true;fade.classList.remove('go');},1900);
}

/* =========================================================
   Weather & time
   ========================================================= */
const WX={clear:{c:0.1,r:0,w:0.2,d:[80,150]},cloudy:{c:0.6,r:0,w:0.45,d:[50,100]},rain:{c:0.88,r:0.75,w:0.55,d:[45,90]},storm:{c:1,r:1,w:1,d:[35,60]},windy:{c:0.3,r:0,w:0.9,d:[50,90]}};
const TOR={on:false,x:0,z:0,dx:0,dz:0,t:0,hit:{}};
function nextWeather(s){const r=Math.random();
  if(s==='clear')return r<0.6?'cloudy':r<0.82?'windy':'clear';
  if(s==='cloudy')return r<0.5?'rain':r<0.65?'windy':'clear';
  if(s==='windy')return r<0.45?'cloudy':r<0.6?'rain':'clear';
  if(s==='rain')return r<0.24?'storm':'cloudy';
  return r<0.3?'windy':'rain';}
let lastWxLabel='',flash=0,flashT=8;
function updateWeather(dt,quiet){const w=S.weather;w.left-=dt;
  if(w.left<=0){w.state=w.next||nextWeather(w.state);w.next=nextWeather(w.state);const d=WX[w.state].d;w.left=d[0]+Math.random()*(d[1]-d[0]);}
  const t=WX[w.state],k=Math.min(1,dt*0.035);   // changes little by little (~30 s time constant)
  w.c+=(t.c-w.c)*k;w.r+=(t.r-w.r)*k;w.w+=(t.w-w.w)*k;
  const lab=wxLabel()[1];
  if(lab!==lastWxLabel){if(lastWxLabel&&!quiet){if(lab==='Rain'&&lastWxLabel!=='Storm')toast('Rain is falling. Your plants grow faster now.');
      if(lab==='Storm')toast(S.boat?'Storm! Paddle back to shore.':'Storm! Too rough for the vaʻa.');}lastWxLabel=lab;actSig='';}
  if(!quiet&&stormy()){flashT-=dt;if(flashT<=0){flash=1;flashT=5+Math.random()*9;}}
  flash=Math.max(0,flash-dt*5);
}
const C={topDay:new THREE.Color('#3f9fd6'),topNight:new THREE.Color('#081428'),horDay:new THREE.Color('#d3efe9'),horNight:new THREE.Color('#1b2c45'),
  sunset:new THREE.Color('#f4a35c'),grey:new THREE.Color('#8e9a9e'),greyN:new THREE.Color('#2a3036'),sunWarm:new THREE.Color('#ffb36b'),sunDay:new THREE.Color('#fff1d6'),
  t1:new THREE.Color(),t2:new THREE.Color(),t3:new THREE.Color()};
function updateSky(){
  const ang=(S.tod-0.25)*Math.PI*2,elev=Math.sin(ang),day=smooth(-0.12,0.18,elev),set=Math.max(0,1-Math.abs(elev-0.03)/0.22)*(elev>-0.2?1:0);
  const w=S.weather,cl=w.c;
  const top=C.t1.copy(C.topNight).lerp(C.topDay,day);
  const hor=C.t2.copy(C.horNight).lerp(C.horDay,day).lerp(C.sunset,set*0.75*(1-cl*0.7));
  const g=C.t3.copy(C.greyN).lerp(C.grey,day);
  top.lerp(g,cl*0.75);hor.lerp(g,cl*0.6);
  if(flash>0){top.lerp(C.horDay,flash*0.6);hor.lerp(C.horDay,flash*0.6);}
  skyU.top.value.copy(top);skyU.bottom.value.copy(hor);
  scene.fog.color.copy(hor).convertSRGBToLinear();
  scene.fog.near=70-45*w.r;scene.fog.far=230-120*w.r;
  stars.material.opacity=(1-day)*(1-cl)*0.95;
  const px=player.position.x,pz=player.position.z;
  sun.position.set(px+Math.cos(ang)*30,Math.max(elev,0.05)*40,pz+14);sun.target.position.set(px,0,pz);
  sun.intensity=1.75*smooth(-0.02,0.25,elev)*(1-0.6*cl);
  sun.color.copy(C.sunDay).lerp(C.sunWarm,set);
  moon.position.set(px-Math.cos(ang)*30,Math.max(-elev,0.1)*40,pz-10);moon.target.position.set(px,0,pz);
  moon.intensity=0.35*(1-day)*(1-0.6*cl);
  hemi.intensity=(0.18+0.42*day)*(1-0.25*cl)+flash*1.6;
  lagoon.material.color.copy(COL.lagoonNight).lerp(COL.lagoonDay,0.15+0.85*day).lerp(COL.lagoonStorm,w.r*0.5*day);
  ocean.material.color.copy(COL.oceanNight).lerp(COL.oceanDay,0.15+0.85*day).lerp(COL.oceanStorm,w.r*0.5*day);
  cloudMat.color.setScalar(0.35+0.65*day).lerp(C.grey,w.r*0.6);
  clouds.children.forEach(cg=>{cg.visible=cg.userData.need<0.25+cl*0.8;});
  return day;
}
function updateRain(dt){const w=S.weather,on=w.r>0.03;rain.mesh.visible=on;if(!on)return;
  rain.mesh.material.opacity=Math.min(0.6,w.r*0.65);const cx=player.position.x,cz=player.position.z,cy=player.position.y;
  const active=Math.floor(RAIN_N*Math.min(1,w.r*1.2)),slant=w.w*2.5,pos=rain.pos,inside=onFloor(cx,cz)&&S.stage>=5;
  for(let i=0;i<RAIN_N;i++){const p=rain.P[i],j=i*6;
    if(i>=active){pos[j]=pos[j+3]=0;pos[j+1]=pos[j+4]=-50;pos[j+2]=pos[j+5]=0;continue;}
    p.y-=p.s*dt;p.x+=slant*dt;
    if(p.y<-1||Math.abs(p.x)>22){p.y=18+Math.random()*6;p.x=(Math.random()-0.5)*44;p.z=(Math.random()-0.5)*44;}
    let x=cx+p.x,y=cy+p.y,z=cz+p.z;if(inside&&nearSite(x,z,0.6))y=-50;
    pos[j]=x;pos[j+1]=y;pos[j+2]=z;pos[j+3]=x-slant*0.06;pos[j+4]=y+0.55;pos[j+5]=z;}
  rain.mesh.geometry.attributes.position.needsUpdate=true;}

/* =========================================================
   Simulation step (also used to fast-forward while sleeping)
   ========================================================= */
function simStep(dt,quiet,hungerMul){
  const prev=S.tod;S.tod=(S.tod+dt/DAY_LEN)%1;if(S.tod<prev)S.day++;
  updateWeather(dt,quiet);
  const grow=1+0.6*S.weather.r;
  for(const p of S.palms){if(p.state!=='stump'&&p.g<1)p.g=Math.min(1,p.g+dt*grow/GROW_PALM);if(p.cd>0)p.cd-=dt*grow;}
  for(const c of S.crops){const K=CROPS[c.type];if(c.g<1)c.g=Math.min(1,c.g+dt*grow/K.grow);if(c.cd>0)c.cd-=dt*grow;if(c.scd>0)c.scd-=dt*grow;}
  for(const t of S.trenches)if(t.flooded&&t.planted&&t.g<1)t.g=Math.min(1,t.g+dt*grow/TRENCH_GROW);
  for(const b of S.bamboo)if(b.cd>0)b.cd-=dt*grow;
  for(const o of S.rocks){if(o.left<=0){o.rcd-=dt;if(o.rcd<=0){o.left=3;actSig='';}}}
  for(const s of shoals){s.ttl-=dt;if(s.ttl<=0)moveShoal(s);}
  for(const t of S.traps){if(t.fish<3){t.t+=dt;if(t.t>=75){t.t=0;t.fish++;}}}
  if(S.coop&&tamedOf('chicken')&&S.coop.eggs<4){S.coop.t+=dt;if(S.coop.t>=70){S.coop.t=0;S.coop.eggs++;}}
  if(S.pen){if(tamedOf('pig')&&S.pen.finds.length<3){S.pen.pt+=dt;if(S.pen.pt>=120){S.pen.pt=0;S.pen.finds.push(['taroshoot','coconut','bshoot','coconut'][Math.floor(Math.random()*4)]);}}
    if(tamedOf('goat')&&S.pen.milk<2){S.pen.gt+=dt;if(S.pen.gt>=90){S.pen.gt=0;S.pen.milk++;}}}
  if(tamedOf('dog')){S.dogT+=dt;if(S.dogT>=100){S.dogT=0;const k=['coconut','bshoot','taroshoot','stone','fshoot','coconut'][Math.floor(Math.random()*6)];give({[k]:1});
    if(!quiet){const d=S.animals.find(a=>a.type==='dog');floatText(`Mana found ${ITEMS[k].n.toLowerCase()}`,_p.set(d.mesh.position.x,d.mesh.position.y+1.4,d.mesh.position.z));renderTop();}}}
  pensionSim(dt,quiet);v6Sim(dt,quiet);v7Sim(dt,quiet);v9Sim(dt,quiet);v10Sim(dt,quiet);
  if(S.buff>0)S.buff=Math.max(0,S.buff-dt);
  S.hunger=Math.max(0,S.hunger-dt*HUNGER_DRAIN*(S.buff>0?0.5:1)*(hungerMul||1));
  if(!quiet){
    if(S.hunger<25&&!S.flags.warned){S.flags.warned=1;toast('Getting hungry. Eat something (tap a food chip).');}
    if(S.hunger<=0&&!S.flags.starved){S.flags.starved=1;toast('Starving. You move slowly until you eat.');}
    if(!S.flags.spring&&dist(player.position.x,player.position.z,SPRING.x,SPRING.z)<6){S.flags.spring=1;toast('You found the spring (pape). Fill coconut cups here.');refresh();}
    if(!S.flags.grove&&S.bamboo.some(b=>dist(player.position.x,player.position.z,b.x,b.z)<5)){S.flags.grove=1;toast('A bamboo grove (ʻofe). Cut canes to weave with.');}
  }
}

/* =========================================================
   Pension de famille: guest fare, wharf, goélette, fruit stand, guests
   ========================================================= */
const AMEN=['quilt','ukulele','hammock','kayak','paint'];
function amenCount(){return AMEN.filter(k=>S.owned[k]||(k==='quilt'&&S.decor.g2tifai)).length;}
function fmtXPF(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' XPF';}
function earn(n,where,quiet){n=Math.round(n);if(n<=0)return;S.money+=n;stat('earned',n);if(!quiet&&where)floatText(`+${fmtXPF(n)}`,where);}
function goePresent(){return S.level>=7&&S.tod>0.25&&S.tod<0.55;}
function guestsStaying(){return S.npcs.filter(n=>n.role==='guest'&&n.state!=='leave').length;}
function stockCount(){if(!S.stall)return 0;return Object.values(S.stall.stock).reduce((a,b)=>a+b,0);}

/* ----- guest fare (fare manihini) ----- */
const F2=SITE2_H+0.45;
const g2=new THREE.Group();g2.position.set(SITE2.x,0,SITE2.z);g2.rotation.y=G2_ROT;scene.add(g2);
MAT.gwall=new THREE.MeshStandardMaterial({roughness:0.9,map:canvasTex(plankDraw,2,1)});
MAT.gpaint=new THREE.MeshStandardMaterial({roughness:0.8,map:canvasTex(g=>{g.fillStyle='#f6f1e6';g.fillRect(0,0,128,128);g.fillStyle='rgba(20,49,58,.10)';for(let x=0;x<128;x+=16)g.fillRect(x,0,2,104);g.fillStyle='#2fb3b0';g.fillRect(0,104,128,24);},2,1)});
MAT.shade=new THREE.MeshBasicMaterial({color:0x1d1510});
const gStages=[],gWalls=[];
(function buildG2Stages(){
  const rand=mulberry32(21);let g=new THREE.Group();
  g.add(box(4.8,0.45,4.0,MAT.basalt2,0,SITE2_H+0.22,0));
  for(let i=0;i<26;i++){const d=i/26*2*(4.8+4.0);let x,z;
    if(d<4.8){x=-2.4+d;z=-2;}else if(d<8.8){x=2.4;z=-2+(d-4.8);}else if(d<13.6){x=2.4-(d-8.8);z=2;}else{x=-2.4;z=2-(d-13.6);}
    const st=mesh(rockGeo,rand()<0.5?MAT.basalt:MAT.basalt2,x,SITE2_H+0.25,z);st.scale.setScalar(0.3);st.rotation.set(i,i*2,i);g.add(st);}
  gStages.push(g);
  g=new THREE.Group();
  const wall=(w,h,d,x,y,z)=>{const m=box(w,h,d,MAT.gwall,x,y,z);gWalls.push(m);g.add(m);};
  wall(4.2,2.3,0.1,0,F2+1.15,-1.75);for(const sd of[-1,1])wall(0.1,2.3,3.5,sd*2.1,F2+1.15,0);
  for(const sd of[-1,1])wall(1.5,2.3,0.1,sd*1.35,F2+1.15,1.75);wall(1.2,0.5,0.1,0,F2+2.05,1.75);
  g.add(box(1.2,1.8,0.04,MAT.shade,0,F2+0.9,1.72));
  for(const sd of[-1,1])g.add(box(0.03,0.6,0.9,MAT.shade,sd*2.13,F2+1.4,0));
  for(const x of[-2.1,2.1])for(const z of[-1.75,1.75])g.add(cyl(0.1,2.4,MAT.post,x,F2+1.2,z,6));
  g.add(box(4.8,0.12,1.7,MAT.wood,0,F2-0.04,2.65));
  for(const x of[-2.3,2.3])g.add(cyl(0.08,2.2,MAT.post,x,F2+1.1,3.4,6));
  for(const sd of[-1,1])g.add(box(1.7,0.07,0.07,MAT.post,sd*1.5,F2+0.8,3.42));
  g.add(box(1.0,0.25,0.6,MAT.basalt,0,SITE2_H+0.12,3.75));
  gStages.push(g);
  g=new THREE.Group();
  const L=Math.hypot(2.2,0.95),a=Math.atan2(0.95,2.2);
  for(const sd of[-1,1]){const m=box(5.0,0.22,L,MAT.thatch,0,F2+2.78,sd*1.1);m.rotation.x=sd*a;g.add(m);}
  const cap=mesh(new THREE.CylinderGeometry(0.16,0.16,5.1,7),MAT.ridge,0,F2+3.28,0);cap.rotation.z=Math.PI/2;g.add(cap);
  const pr=box(5.0,0.14,1.8,MAT.thatch,0,F2+2.12,2.7);pr.rotation.x=0.2;g.add(pr);
  gStages.push(g);
  gStages.forEach((sg,i)=>{sg.visible=i<S.g2;g2.add(sg);});
})();
const g2Marker=new THREE.Group();g2.add(g2Marker);
(function(){for(const x of[-2.4,2.4])for(const z of[-2,2])g2Marker.add(cyl(0.07,0.9,MAT.post,x,SITE2_H+0.45,z));
  for(const z of[-2,2])g2Marker.add(box(4.8,0.04,0.04,MAT.rope,0,SITE2_H+0.75,z));for(const x of[-2.4,2.4])g2Marker.add(box(0.04,0.04,4,MAT.rope,x,SITE2_H+0.75,0));})();
const signMat=new THREE.MeshStandardMaterial({roughness:0.8,map:(()=>{const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d');
  g.fillStyle='#bb8b57';g.fillRect(0,0,256,96);g.fillStyle='#7a5230';for(let y=0;y<96;y+=24)g.fillRect(0,y,256,2);
  g.fillStyle='#fff8ea';g.font='bold 26px "Lilita One","Trebuchet MS",sans-serif';g.textAlign='center';g.fillText('PENSION',128,40);g.font='bold 30px "Lilita One","Trebuchet MS",sans-serif';g.fillText('Fare Iti',128,78);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;})()});
const sign=new THREE.Group();sign.add(cyl(0.05,1.5,MAT.post,0,0.75,0,5));sign.add(box(1.2,0.45,0.06,signMat,0,1.35,0));
{const p=g2World(2.9,4.3);sign.position.set(p.x,H(p.x,p.z),p.z);sign.rotation.y=G2_ROT;scene.add(sign);}
const amen={};
(function buildAmenities(){
  let g=new THREE.Group();for(const z of[0.2,3.2])g.add(cyl(0.07,1.6,MAT.post,-3.4,SITE2_H+0.8,z,5));
  const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new THREE.Vector3(-3.4,SITE2_H+1.35-Math.sin(t*Math.PI)*0.7,0.2+t*3));}
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,0.16,6,false),MAT.pareo));amen.hammock=g;g2.add(g);
  g=new THREE.Group();const b1=mesh(new THREE.SphereGeometry(0.14,8,6),std(0xb8763a),0,0,0);b1.scale.z=0.35;g.add(b1);
  const b2=mesh(new THREE.SphereGeometry(0.1,8,6),std(0xb8763a),0,0.16,0);b2.scale.z=0.35;g.add(b2);g.add(box(0.05,0.42,0.03,MAT.post,0,0.42,0));
  g.position.set(1.7,F2+0.3,3.3);g.rotation.z=0.25;amen.ukulele=g;g2.add(g);
  g=new THREE.Group();g.add(box(1.3,0.6,0.03,MAT.tifaifai,-1.3,F2+0.55,3.45));amen.quilt=g;g2.add(g);
  g=new THREE.Group();const k=mesh(new THREE.SphereGeometry(1,10,6),std(0xffc83d),0,0.12,0);k.scale.set(0.3,0.16,1.4);g.add(k);g.add(box(0.36,0.04,0.5,MAT.shade,0,0.25,0));
  const pd=box(0.06,0.04,1.8,MAT.post,0.35,0.28,0);pd.rotation.y=0.5;g.add(pd);
  {const p=dockPt(DOCK.r0-1.1,-2.4);g.position.set(p.x,Math.max(H(p.x,p.z),0)+0.02,p.z);g.rotation.y=Math.atan2(DOCK.dx,DOCK.dz)+0.3;}
  amen.kayak=g;scene.add(g);
})();
function applyPaint(){const m=S.owned.paint?MAT.gpaint:MAT.gwall;gWalls.forEach(w=>{w.material=m;});}
applyPaint();
function buildG2(){const st=GSTAGES[S.g2];if(!hasAll(st.need))return;take(st.need);
  const g=gStages[S.g2];g.visible=true;g.scale.set(1,0.01,1);tweens.push({g,t:0});S.g2++;
  floatText(`${st.n} built`,_p.set(SITE2.x,F2+2.5,SITE2.z));
  if(S.g2>=3){S.pension.next=25;toast('Your pension de famille is open! The first guests are on their way.');}
  refresh();}

/* ----- wharf and boats ----- */
const wharf=new THREE.Group();scene.add(wharf);
(function(){const len=DOCK.r1-DOCK.r0+0.6,mid=(DOCK.r0-0.6+DOCK.r1)/2,c=dockPt(mid,0);
  const g=new THREE.Group();g.position.set(c.x,0,c.z);g.rotation.y=Math.atan2(DOCK.dx,DOCK.dz);
  g.add(box(1.7,0.14,len,MAT.wood,0,0.48,0));
  for(let i=0;i<=Math.floor(len/1.6);i++)for(const sd of[-0.8,0.8])g.add(cyl(0.08,2.2,MAT.post,sd,-0.6,-len/2+i*1.6,6));
  wharf.add(g);})();
function makeBoat(big){
  const g=new THREE.Group(),white=MAT.white,red=MAT.pareo;
  if(!big){const hull=mesh(new THREE.SphereGeometry(1,10,6),white);hull.scale.set(0.7,0.4,2.1);g.add(hull);
    g.add(box(1.0,0.08,2.6,MAT.wood,0,0.3,0));g.add(box(0.5,0.5,0.6,std(0x2c7fb8),0,0.6,-0.2));
    g.add(box(0.25,0.4,0.25,MAT.horn,0,0.35,-2.05));return g;}
  const hull=mesh(new THREE.BoxGeometry(2.6,1.4,10),white,0,0.4,0);g.add(hull);
  g.add(mesh(new THREE.ConeGeometry(1.3,2.6,4),white,0,0.4,6.2)).rotation.set(Math.PI/2,Math.PI/4,0);
  g.add(box(2.64,0.25,10.02,red,0,-0.05,0));
  g.add(box(2.0,1.4,2.2,white,0,1.8,-3));g.add(box(2.05,0.3,2.25,std(0x2c7fb8),0,2.4,-3));
  g.add(cyl(0.08,5,MAT.post,0,3.4,1.5,6));const yard=cyl(0.05,3.4,MAT.post,0,4.4,1.8,5);yard.rotation.z=Math.PI/2;g.add(yard);
  for(let i=0;i<3;i++)g.add(box(0.9,0.6,0.9,[std(0x9a6a38),std(0x2c7fb8),std(0xde4634)][i],-0.5+i*0.5,1.4,0.6+i*1.1));
  return g;
}
const poti=makeBoat(false);scene.add(poti);
const goe=makeBoat(true);scene.add(goe);
const POTI_AT=dockPt(DOCK.r1-0.8,1.6),GOE_AT=dockPt(DOCK.r1-2.5,-4.4),GOE_FROM=dockPt(DOCK.r1+24,-4.4);
let goeT=0,goeToastDay=0;

/* ----- fruit stand ----- */
let stallMesh=null;
const PRODUCE_COL={banana:0xf2c94c,coconut:0x7a5530,papaya:0xf08a2b,pineapple:0xe0a23a,lime:0x8cc63f,fei:0xd9601e,taro:0x8c6a7a,uru:0x9cc23f,egg:0xf6ecd6,milk:0xffffff,fish:0x4aa7c9,tiare:0xffffff,hei:0xffffff,vanilla:0x3a2416,monoi:0xf0c75a,vmonoi:0xb8864a};
function placeStallMesh(){if(!S.stall)return;const g=new THREE.Group();
  for(const x of[-0.8,0.8])for(const z of[-0.45,0.45])g.add(cyl(0.05,1.9,MAT.post,x,0.95,z,5));
  g.add(box(1.8,0.1,1.0,MAT.wood,0,0.85,0));g.add(box(1.8,0.75,0.06,MAT.wood,0,0.45,0.48));
  const roof=box(2.1,0.1,1.4,MAT.thatch,0,1.95,0);roof.rotation.x=-0.15;g.add(roof);
  const disp=new THREE.Group();g.add(disp);g.userData.disp=disp;
  g.position.set(S.stall.x,H(S.stall.x,S.stall.z),S.stall.z);g.rotation.y=S.stall.rot||0;scene.add(g);stallMesh=g;refreshStallDisplay();}
function refreshStallDisplay(){if(!stallMesh)return;const d=stallMesh.userData.disp;while(d.children.length)d.remove(d.children[0]);
  let i=0;for(const k in S.stall.stock){const n=Math.min(4,S.stall.stock[k]);for(let j=0;j<n&&i<16;j++,i++){
    const m=mesh(new THREE.SphereGeometry(k==='coconut'?0.11:0.09,7,5),std(PRODUCE_COL[k]||0xd6b062),-0.7+(i%8)*0.2,0.98,-0.25+Math.floor(i/8)*0.3);if(k==='banana')m.scale.set(1.8,0.6,0.7);if(k==='papaya'||k==='pineapple')m.scale.y=1.4;d.add(m);}}}
placeStallMesh();

/* ----- people ----- */
const SKINS=[0x9a643c,0xc98a5a,0xe0b48f,0x6b4226,0xd9a77c,0xb8784a],SHIRTS=[0x4aa7c9,0xf2c94c,0x8fd05e,0xf08a7e,0xffffff,0xb48ad6,0x2fb3b0,0xde4634],HAIRS=[0x231912,0x6b4226,0xc9a061,0x3a2416,0x111111];
function makePerson(seed){
  const r=mulberry32(seed),pick=a=>a[Math.floor(r()*a.length)];
  const skin=std(pick(SKINS),{flatShading:false}),top=std(pick(SHIRTS),{flatShading:false});
  const skirt=r()<0.45,bottom=skirt?new THREE.MeshStandardMaterial({roughness:0.85,side:THREE.DoubleSide,map:pareuTex(pick(['#2c7fb8','#2fb3b0','#de4634','#f2c94c','#7b4fb0']),'#fbf3e2','#14313a')}):std(pick([0x2c4a6a,0xf3ead2,0x6e4b2c,0x3f7d34,0x9aa4a7]),{flatShading:false});
  const C=makeCharacter({skin,top,bottom,hair:std(pick(HAIRS),{flatShading:false}),hairStyle:pick(['short','long','bun','short']),skirt,hat:r()<0.55?std(pick([0xf2d98a,0xffffff,0xd6b062]),{flatShading:false}):null,tank:r()<0.3});
  return {group:C.group,legs:C.legs,arms:C.arms};
}
function npcY(x,z){return onDock(x,z)?0.55:Math.max(H(x,z),0);}
function spawnNpcMesh(n){n.body=makePerson(n.seed);n.body.group.position.set(n.x,npcY(n.x,n.z),n.z);scene.add(n.body.group);
  if(n.role==='guest'){const b=document.createElement('div');b.className='bubble';b.hidden=true;$('#bubbles').appendChild(b);n.bubble=b;}}
function removeNpc(n){scene.remove(n.body.group);if(n.bubble)n.bubble.remove();S.npcs.splice(S.npcs.indexOf(n),1);}
S.npcs.forEach(spawnNpcMesh);
function porchFront(){return g2World((Math.random()-0.5)*2,4.3);}
function wishPool(){const base=['banana','coconut','grillfish','iaota','hei'],extra=['roastfei','poe','ctaro','ruru','egg','milk','papaya','pineapple','firifiri','iaota2','monoi','fish','heipupu','faraoa','pareu','gaahi','poetaro','rkumara','poemanioc','meli','taupoo'];
  return base.concat(extra.filter(k=>S.seen[k]));}
function spawnGuest(){
  const used=S.npcs.map(n=>n.name),free=GUEST_NAMES.filter(([nme])=>!used.includes(nme)),[name,from]=free[Math.floor(Math.random()*free.length)]||GUEST_NAMES[0];
  const pool=wishPool(),wishes=[];const want=S.level>=8&&Math.random()<0.6?3:2;
  while(wishes.length<want&&pool.length){const i=Math.floor(Math.random()*pool.length);wishes.push(pool.splice(i,1)[0]);}
  const st=dockPt(DOCK.r1-0.8,0);
  const n={role:'guest',name,from,seed:Math.floor(Math.random()*1e9),wishes,served:[],stay:200+Math.random()*80,state:'arrive',x:st.x,z:st.z,path:[dockPt(DOCK.r0-0.4,0),porchFront()],wait:0};
  S.npcs.push(n);spawnNpcMesh(n);stat('guests');return n;
}
function spawnVisitor(){const st=dockPt(DOCK.r1-0.8,0),f=stallFront();
  const n={role:'visitor',seed:Math.floor(Math.random()*1e9),state:'arrive',x:st.x,z:st.z,path:[dockPt(DOCK.r0-0.4,0),f],wait:0};S.npcs.push(n);spawnNpcMesh(n);}
function stallFront(){if(!S.stall)return dockPt(DOCK.r0-2,0);const a=S.stall.rot||0;return{x:S.stall.x+Math.sin(a)*1.3,z:S.stall.z+Math.cos(a)*1.3};}
function leavePath(n){n.state='leave';n.path=[dockPt(DOCK.r0-0.4,0),dockPt(DOCK.r1-0.8,0)];n.wait=0;}
function guestDepart(n,quiet){
  const frac=n.wishes.length?n.served.length/n.wishes.length:1;
  let r=1+3*frac+0.35*amenCount()+(n.served.includes('hei')?0.3:0)+v6Rating(n)+(n.hurt?-1:0)+(n.cared?0.4:0)+v10Rating();r=Math.round(clamp(r,1,5)*2)/2;
  const pay=Math.round((1500+500*r)/100)*100;earn(pay,null,true);give({scraps:1},true);
  const P=S.pension;P.ratings.push(r);if(P.ratings.length>6)P.ratings.shift();
  const txt=REVIEWS[Math.round(r)];P.reviews.unshift({name:n.name,from:n.from,r,text:txt[Math.floor(Math.random()*txt.length)]});if(P.reviews.length>6)P.reviews.pop();
  if(!quiet){toast(`${n.name} from ${n.from} left ${'★'.repeat(Math.floor(r))}${r%1?'½':''} and paid ${fmtXPF(pay)}`);floatText(`+${fmtXPF(pay)}`,_p.set(n.x,2.4,n.z));}
  leavePath(n);
  if(!quiet)refresh();
}
function visitorBuy(n){
  const ks=Object.keys(S.stall?S.stall.stock:{}).filter(k=>S.stall.stock[k]>0);let got=0,spent=0;const want=1+Math.floor(Math.random()*3);
  for(let i=0;i<want&&ks.length;i++){const k=ks[Math.floor(Math.random()*ks.length)];S.stall.stock[k]--;if(S.stall.stock[k]<=0){delete S.stall.stock[k];ks.splice(ks.indexOf(k),1);}got++;spent+=priceOf(k);stat('sold');}
  const at=_p.set(S.stall?S.stall.x:n.x,2.2,S.stall?S.stall.z:n.z);
  if(got){earn(spent,at);refreshStallDisplay();refresh();}else floatText('Nothing to buy…',at);
  leavePath(n);
}
function serve(n,k){S.inv[k]--;n.served.push(k);const tip=Math.round((PRICES[k]||100)*1.5/10)*10;
  earn(tip,_p.set(n.x,2.5,n.z));
  if(k==='hei')toast(`You place a hei tiare on ${n.name}. Maeva!`);
  if(n.served.length>=n.wishes.length)setTimeout(()=>floatText('♥',_p.set(n.x,2.2,n.z)),300);
  refresh();}
function guestActions(n,A){
  const left=n.wishes.filter(k=>!n.served.includes(k)),have=left.filter(k=>S.inv[k]>0);
  have.slice(0,2).forEach(k=>A.push({label:`Give ${nm(k)}`,sub:`${n.name} · +${fmtXPF(Math.round((PRICES[k]||100)*1.5/10)*10)} tip`,fn:()=>serve(n,k)}));
  if(!have.length)A.push({label:`${n.name} from ${n.from}`,sub:left.length?`Hoping for: ${left.map(nm).join(', ')}`:'Happy with everything',off:true});
}

/* ----- sheets ----- */
function pensionSheet(mode){
  let html='';
  if(mode==='shop'){
    $('#sheetTitle').textContent='The goélette';
    html+=`<p class="small-note">The supply schooner from Papeete. You have <b>${fmtXPF(S.money)}</b>.</p>`;
    html+=SHOP.map(it=>{const own=it.once&&S.owned[it.id],ok=!own&&S.money>=it.price;const ic=it.give?ICON[Object.keys(it.give)[0]]:ICON[it.id];
      return row(it.id,it.n,it.t,`${ic}<span class="price">${fmtXPF(it.price)}</span>`,own?'Owned':'Buy',ok,own?'':S.money<it.price?'Not enough XPF yet':'');}).join('');
  }else if(mode==='stall'){
    $('#sheetTitle').textContent='Fruit stand';
    const st=S.stall.stock,onD=Object.keys(st).filter(k=>st[k]>0);
    html+=`<div class="sec">On display · ${stockCount()}</div>`;
    html+=onD.length?onD.map(k=>`<div class="recipe"><div class="rinfo"><div class="name">${ICON[k]} ${ITEMS[k].n} × ${st[k]}</div><div class="tah">${fmtXPF(priceOf(k))} each${marketTag(k)}</div></div><button data-take="${k}">Take back</button></div>`).join(''):'<p class="small-note">Nothing on display. Visitors from the poti walk past.</p>';
    const sell=ORDER.filter(k=>PRICES[k]&&S.inv[k]>0);
    html+=`<div class="sec">From your bag</div>`;
    html+=sell.length?sell.map(k=>`<div class="recipe"><div class="rinfo"><div class="name">${ICON[k]} ${ITEMS[k].n}</div><div class="tah">${fmtXPF(priceOf(k))}${marketTag(k)} · you have ${S.inv[k]}</div></div><div class="btns"><button data-put="${k}" data-n="1">+1</button><button data-put="${k}" data-n="all">All</button></div></div>`).join(''):'<p class="small-note">Nothing you carry can be sold here.</p>';
  }else{
    $('#sheetTitle').textContent='Pension de famille';
    const r=rating(S),P=S.pension;
    html+=`<div class="pen-head"><span class="stars">${starHtml(r)}</span><b>${r.toFixed(1)}</b><span class="small-note">${P.ratings.length?`from ${P.ratings.length} recent guests`:'no reviews yet'}</span></div>`;
    html+=`<p class="small-note">${P.beds} room${P.beds>1?'s':''} · ${guestsStaying()} taken · comforts ${amenCount()}/${AMEN.length} · you have ${fmtXPF(S.money)}</p>`;
    const gs=S.npcs.filter(n=>n.role==='guest'&&n.state!=='leave');
    html+=`<div class="sec">Staying now</div>`;
    html+=gs.length?gs.map(n=>`<div class="recipe"><div class="rinfo"><div class="name">${n.name} <span class="tah">from ${n.from}</span></div><div class="flow wishes">${n.wishes.map(k=>`<span class="wish${n.served.includes(k)?' ok':''}" title="${ITEMS[k].n}">${ICON[k]}</span>`).join('')}<span class="have">leaves in ${Math.ceil(n.stay/60)} min</span></div></div></div>`).join(''):'<p class="small-note">No guests right now. The poti brings them during the day.</p>';
    if(P.reviews.length)html+=`<div class="sec">Reviews</div>`+P.reviews.map(v=>`<div class="review"><span class="stars sm">${starHtml(v.r)}</span><p>“${v.text}”</p><span class="small-note">${v.name}, ${v.from}</span></div>`).join('');
    html+=`<p class="small-note">More rooms: “Add a guest bed” in Craft. Higher stars: grant their wishes, welcome them with a hei tiare, and buy comforts from the goélette.</p>`;
  }
  return html;
}
function starHtml(r){let h='';for(let i=1;i<=5;i++)h+=`<i class="${r>=i?'on':r>=i-0.5?'half':''}"></i>`;return h;}
function pensionClick(b){
  if(sheetMode==='shop'){const it=SHOP.find(x=>x.id===b.dataset.id);if(!it)return;
    const fee=goePresent()?0:300;if(fee&&!phoneOrder){toast('The goélette has sailed. It comes back tomorrow morning.');openSheet(null);return;}
    if(S.money<it.price+fee){toast('Not enough XPF yet');return;}
    if(S.money<it.price||(it.once&&S.owned[it.id]))return;
    S.money-=it.price+fee;stat('bought');if(fee)toast(`Delivered by the poti (+${fee} XPF delivery).`);
    if(it.give)give(it.give);else S.owned[it.id]=true;
    if(it.id==='paint')applyPaint();
    toast(`Bought: ${it.n}.`);refresh();return;}
  if(sheetMode==='stall'){const st=S.stall.stock;
    if(b.dataset.take){const k=b.dataset.take;give({[k]:st[k]},true);delete st[k];}
    else if(b.dataset.put){const k=b.dataset.put,n=b.dataset.n==='all'?S.inv[k]:1;if(S.inv[k]<n||n<=0)return;S.inv[k]-=n;st[k]=(st[k]||0)+n;}
    refreshStallDisplay();refresh();}
}

/* ----- simulation & animation ----- */
function pensionSim(dt,quiet){
  if(S.level<7)return;
  const day=S.tod>0.26&&S.tod<0.78;
  if(S.g2>=3&&day&&S.dmg.g2<0.75){S.pension.next-=dt;
    if(S.pension.next<=0){if(guestsStaying()<S.pension.beds){const g=spawnGuest();if(!quiet)toast(`A guest arrives on the poti: ${g.name} from ${g.from}.`);}
      S.pension.next=guestsStaying()>=S.pension.beds?25:150/(0.6+rating(S)/5)*(0.8+Math.random()*0.4);}}
  if(S.stall&&day&&!quiet&&stockCount()>0){S.pension.vnext-=dt;if(S.pension.vnext<=0){S.pension.vnext=60+Math.random()*50;spawnVisitor();}}
  for(const n of S.npcs.slice()){
    if(n.role==='guest'&&n.state!=='leave'){n.stay-=dt;if(n.stay<=0)guestDepart(n,quiet);}
    if(quiet&&n.state==='leave')removeNpc(n);
  }
}
function wanderGuest(n){
  const spots=[porchFront(),dockPt(DOCK.r0-1.6+Math.random()*1.2,(Math.random()-0.5)*5)];
  if(S.stall)spots.push(stallFront());if(S.owned.hammock)spots.push(g2World(-3.4,1.7));if(S.owned.kayak){const k=amen.kayak.position;spots.push({x:k.x+1,z:k.z});}
  const p=spots[Math.floor(Math.random()*spots.length)];n.path=[{x:p.x+(Math.random()-0.5)*1.2,z:p.z+(Math.random()-0.5)*1.2}];
}
function updatePension(dt,t){
  const open=S.level>=7;wharf.visible=open;poti.visible=open;sign.visible=S.g2>=3;g2Marker.visible=open&&S.g2===0;
  for(const k of AMEN)if(amen[k])amen[k].visible=k!=='paint'&&!!(S.owned[k]||(k==='quilt'&&S.decor.g2tifai));
  if(open){poti.position.set(POTI_AT.x,0.05+Math.sin(t*1.5)*0.05,POTI_AT.z);poti.rotation.y=Math.atan2(DOCK.dx,DOCK.dz);}
  const here=goePresent();goeT=clamp(goeT+(here?dt:-dt)/14,0,1);goe.visible=goeT>0;
  if(goe.visible){const e=1-Math.pow(1-goeT,3);goe.position.set(GOE_FROM.x+(GOE_AT.x-GOE_FROM.x)*e,0.1+Math.sin(t*0.9)*0.06,GOE_FROM.z+(GOE_AT.z-GOE_FROM.z)*e);goe.rotation.y=Math.atan2(-DOCK.dx,-DOCK.dz);}
  if(here&&goeToastDay!==S.day&&!overlayOpen()){goeToastDay=S.day;if(S.flags.goeSeen!==S.day){S.flags.goeSeen=S.day;toast('The goélette has come in at the wharf. Go and trade before 13:00.');}}
  const night=isNight();
  for(const n of S.npcs.slice()){
    const m=n.body.group;let moving=false;
    if(n.role==='guest'&&n.state==='stay'&&night){const door=g2World(0,2.6);if(dist(n.x,n.z,door.x,door.z)>0.4)n.path=[door];else{m.visible=false;n.path=[];}}
    else if(!m.visible)m.visible=true;
    if(n.path&&n.path.length){const p=n.path[0],dx=p.x-n.x,dz=p.z-n.z,d=Math.hypot(dx,dz);
      if(d<0.15){n.path.shift();if(!n.path.length){
        if(n.state==='arrive'){if(n.role==='visitor')visitorBuy(n);else if(n.role==='shopper')shopperBuy(n);else{n.state='stay';n.wait=2;}}
        else if(n.state==='leave'){removeNpc(n);continue;}
        else n.wait=3+Math.random()*6;}}
      else{const st=Math.min(d,1.6*dt);n.x+=dx/d*st;n.z+=dz/d*st;moving=true;let dr=Math.atan2(dx,dz)-m.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));m.rotation.y+=dr*Math.min(1,dt*8);}}
    else if(n.state==='stay'&&!night){n.wait-=dt;if(n.wait<=0)wanderGuest(n);}
    n.ph=(n.ph||0)+(moving?dt*8:0);
    m.position.set(n.x,npcY(n.x,n.z)+(moving?Math.abs(Math.sin(n.ph))*0.05:0),n.z);
    n.body.legs[0].rotation.x=moving?Math.sin(n.ph)*0.6:0;n.body.legs[1].rotation.x=moving?-Math.sin(n.ph)*0.6:0;
    n.body.arms[0].rotation.x=moving?-Math.sin(n.ph)*0.35:0;n.body.arms[1].rotation.x=moving?Math.sin(n.ph)*0.35:0;
    if(n.bubble){const left=n.wishes.filter(k=>!n.served.includes(k));
      _v.set(n.x,m.position.y+2.4,n.z).project(camera);
      const show=m.visible&&n.state!=='leave'&&_v.z<1&&dist(n.x,n.z,camera.position.x,camera.position.z)<32;
      n.bubble.hidden=!show;
      if(show){const key=left.length?left[0]+left.length:'ok';if(n.bubble.dataset.k!==key){n.bubble.dataset.k=key;n.bubble.innerHTML=left.length?ICON[left[0]]+(left.length>1?`<span>+${left.length-1}</span>`:''):ICON.heart;n.bubble.classList.toggle('done',!left.length);}
        n.bubble.style.transform=`translate(${((_v.x+1)/2*innerWidth).toFixed(1)}px,${((1-_v.y)/2*innerHeight).toFixed(1)}px) translate(-50%,-100%)`;}}
  }
}

/* =========================================================
   Graphics: lagoon shader, grass, flowers, jungle, horizon islands
   ========================================================= */
[lagoon,ocean,reef,shore].forEach(m=>{m.visible=false;});
const depthTex=(function(){const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),img=g.createImageData(N,N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-95+(i+0.5)/N*190,z=-95+(j+0.5)/N*190,d=clamp(-H(x,z)/4,0,1),k=(j*N+i)*4;img.data[k]=img.data[k+1]=img.data[k+2]=d*255;img.data[k+3]=255;}
  g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.flipY=false;t.minFilter=THREE.LinearFilter;return t;})();
const waterU={uTime:{value:0},uDepth:{value:depthTex},uDay:{value:1},uStorm:{value:0},uR:{value:R},uSun:{value:new THREE.Vector3(0.5,0.8,0.3)},
  uFog:{value:new THREE.Color()},uFogNear:{value:70},uFogFar:{value:230},uCam:{value:new THREE.Vector3()}};
const water=new THREE.Mesh(new THREE.RingGeometry(0.01,330,160,70),new THREE.ShaderMaterial({uniforms:waterU,transparent:true,depthWrite:false,
  vertexShader:`uniform float uTime;varying vec3 vW;varying float vDist;
  void main(){vec4 w=modelMatrix*vec4(position,1.0);w.y+=sin(w.x*0.35+uTime*1.3)*0.03+sin(w.z*0.28-uTime*1.1)*0.03;vW=w.xyz;vec4 mv=viewMatrix*w;vDist=-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform sampler2D uDepth;uniform float uTime,uDay,uStorm,uR,uFogNear,uFogFar;uniform vec3 uSun,uFog,uCam;varying vec3 vW;varying float vDist;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}
  void main(){
    vec2 uv=(vW.xz+95.0)/190.0;float d=1.0;
    if(uv.x>0.0&&uv.x<1.0&&uv.y>0.0&&uv.y<1.0)d=texture2D(uDepth,uv).r;
    float r=length(vW.xz);
    float n=noise(vW.xz*0.8+uTime*0.22)*0.6+noise(vW.xz*2.4-uTime*0.45)*0.4;
    vec3 shallow=vec3(0.50,0.95,0.86),mid=vec3(0.12,0.78,0.80),deepL=vec3(0.04,0.55,0.72),ocean=vec3(0.03,0.27,0.55);
    vec3 col=mix(shallow,mid,smoothstep(0.0,0.22,d));col=mix(col,deepL,smoothstep(0.22,0.85,d));
    float outside=smoothstep(uR+6.6,uR+8.6,r);col=mix(col,ocean,outside);
    col+=(n-0.5)*0.07;
    float caust=pow(noise(vW.xz*1.6+vec2(uTime*0.3,-uTime*0.2))*noise(vW.zx*1.9-uTime*0.25),2.0)*1.6*(1.0-smoothstep(0.0,0.4,d));
    col+=vec3(0.9,1.0,0.95)*caust*0.35;
    float shoreF=(1.0-smoothstep(0.0,0.06,d))*(0.55+0.45*sin(uTime*2.0+r*1.6+n*3.0));
    float reefF=(1.0-smoothstep(0.0,1.2,abs(r-(uR+7.5))))*(0.6+0.4*sin(uTime*3.0+atan(vW.z,vW.x)*24.0+n*4.0));
    float foam=clamp(shoreF*0.8+reefF*(0.8+uStorm*0.4),0.0,1.0)*smoothstep(0.3,0.75,n+0.3);
    vec3 V=normalize(uCam-vW);vec3 N=normalize(vec3((n-0.5)*0.5,1.0,(noise(vW.zx*1.7+uTime*0.3)-0.5)*0.5));
    float spec=pow(max(dot(reflect(-V,N),normalize(uSun)),0.0),120.0)*1.6;
    float fres=pow(1.0-max(dot(V,vec3(0.0,1.0,0.0)),0.0),3.0);
    vec3 base=col*(0.22+0.78*uDay);
    base=mix(base,vec3(0.32,0.42,0.44)*(0.3+0.7*uDay),uStorm*0.5);
    base=mix(base,uFog,fres*0.35);
    base+=vec3(1.0)*foam*(0.3+0.6*uDay);
    base+=vec3(1.0,0.95,0.82)*spec*uDay*(1.0-uStorm*0.8);
    float a=mix(0.5,0.93,smoothstep(0.0,0.6,d));a=max(a,foam);a=mix(a,1.0,outside);
    base=mix(base,uFog,smoothstep(uFogNear,uFogFar,vDist));
    gl_FragColor=vec4(base,a);
  }`}));
water.rotation.x=-Math.PI/2;water.position.y=0.03;water.renderOrder=1;scene.add(water);

const grassU={uTime:{value:0},uWind:{value:0.2}};
function swayMat(color,amp){const m=new THREE.MeshStandardMaterial({color,roughness:0.95,flatShading:true});
  m.onBeforeCompile=sh=>{sh.uniforms.uTime=grassU.uTime;sh.uniforms.uWind=grassU.uWind;
    sh.vertexShader='uniform float uTime;uniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      #ifdef USE_INSTANCING
      vec4 wp0=instanceMatrix*vec4(0.0,0.0,0.0,1.0);
      float sw=sin(uTime*2.2+wp0.x*0.7+wp0.z*0.5)*(0.06+uWind*0.16)*position.y*${amp.toFixed(2)};
      transformed.x+=sw;transformed.z+=sw*0.6;
      #endif`);};
  return m;}
const bladeGeo=(()=>{const p=[];for(let i=0;i<4;i++){const a=i/4*Math.PI*2+0.3,dx=Math.cos(a)*0.09,dz=Math.sin(a)*0.09,h=0.32+(i%2)*0.14;
  p.push(-dz*0.35,0,dx*0.35, dz*0.35,0,-dx*0.35, dx*1.2,h,dz*1.2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;})();
function clearGround(x,z,pad){return !nearSite(x,z,pad)&&!nearG2(x,z,pad)&&!featureNear(x,z,pad*0.5)&&dist(x,z,START.x,START.z)>1.5;}
function scatter(count,geo,mat,place,colorFn,shadow){
  const inst=new THREE.InstancedMesh(geo,mat,count),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),pos=new THREE.Vector3(),sc=new THREE.Vector3(),col=new THREE.Color();
  const rand=mulberry32(count*7+13);let n=0,tries=0;
  while(n<count&&tries++<count*25){const p=place(rand);if(!p)continue;
    e.set(p.rx||0,rand()*Math.PI*2,p.rz||0);q.setFromEuler(e);pos.set(p.x,p.y,p.z);sc.setScalar(p.s);if(p.sy)sc.y*=p.sy;
    m4.compose(pos,q,sc);inst.setMatrixAt(n,m4);colorFn(rand,col);col.convertSRGBToLinear();inst.setColorAt(n,col);n++;}
  inst.count=n;inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
  inst.castShadow=!!shadow;inst.receiveShadow=true;scene.add(inst);return inst;}
const rp=(rand,rmin,rmax)=>{const a=rand()*Math.PI*2,r=rmin+rand()*(rmax-rmin);return[Math.cos(a)*r,Math.sin(a)*r];};
const GRASS_N=coarse?2600:4200;
scatter(GRASS_N,bladeGeo,swayMat(0xffffff,2.2),rand=>{const[x,z]=rp(rand,2,R-1.5),h=H(x,z);if(h<0.75||h>5.2||!clearGround(x,z,0.8))return null;return{x,y:h-0.02,z,s:0.7+rand()*0.9};},
  (rand,c)=>c.setHSL(0.25+rand()*0.07,0.62+rand()*0.2,0.24+rand()*0.12));
scatter(coarse?220:360,new THREE.IcosahedronGeometry(0.07,0),std(0xffffff,{flatShading:false,roughness:0.6}),rand=>{const[x,z]=rp(rand,4,R-3),h=H(x,z);if(h<0.9||h>4||!clearGround(x,z,1))return null;return{x,y:h+0.28+rand()*0.12,z,s:0.8+rand()*0.7,sy:0.6};},
  (rand,c)=>{const k=rand();c.set(k<0.55?0xffffff:k<0.8?0xe2402e:k<0.92?0xffc83d:0xf08ad0);});
scatter(160,new THREE.SphereGeometry(0.08,6,4),std(0xffffff,{roughness:0.5}),rand=>{const[x,z]=rp(rand,R-3.5,R+0.6),h=H(x,z);if(h<-0.05||h>0.5||!clearGround(x,z,0.5))return null;return{x,y:h+0.01,z,s:0.6+rand()*0.9,sy:0.45};},
  (rand,c)=>c.set([0xfbf3e2,0xf3c9c0,0xe9dcc0,0xd6cfc2][Math.floor(rand()*4)]));
scatter(coarse?180:260,noisyGeo(new THREE.IcosahedronGeometry(1,1),0.38,9),std(0xffffff,{roughness:1}),rand=>{const a=rand()*Math.PI*2,d=8+rand()*13,x=-19+Math.cos(a)*d,z=-25+Math.sin(a)*d,h=H(x,z);
    if(h<5.4||h>16.5)return null;return{x,y:h-0.25,z,s:1.1+rand()*1.6,sy:0.75+rand()*0.4};},(rand,c)=>c.setHSL(0.28+rand()*0.06,0.55,0.13+rand()*0.1),true);
scatter(60,new THREE.ConeGeometry(0.5,3,5),std(0xffffff,{roughness:1}),rand=>{const a=rand()*Math.PI*2,d=7+rand()*12,x=-19+Math.cos(a)*d,z=-25+Math.sin(a)*d,h=H(x,z);
    if(h<6||h>15)return null;return{x,y:h+1,z,s:0.8+rand()*0.6};},(rand,c)=>c.setHSL(0.3,0.4,0.16+rand()*0.08),true);

/* Tahiti and Moorea on the horizon */
(function horizon(){const mat=new THREE.MeshLambertMaterial({color:lin(0x2f5f50)});
  const isl=(cx,cz,n,rad,hgt,seed)=>{const r=mulberry32(seed),g=new THREE.Group();
    for(let i=0;i<n;i++){const a=r()*Math.PI*2,d=r()*rad*0.6,h=hgt*(0.45+r()*0.55),c=new THREE.Mesh(new THREE.ConeGeometry(rad*(0.35+r()*0.4),h,6+Math.floor(r()*3)),mat);
      c.position.set(cx+Math.cos(a)*d,h/2-3,cz+Math.sin(a)*d);c.rotation.y=r()*3;g.add(c);}scene.add(g);};
  isl(-150,40,9,46,62,7);isl(-138,-10,4,22,40,9);isl(60,-160,7,32,44,11);})();

/* Sun disc in the sky */
sky.material.uniforms.sunDir={value:new THREE.Vector3(0,1,0)};sky.material.uniforms.sunCol={value:new THREE.Color(1,0.9,0.7)};
sky.material.fragmentShader='uniform vec3 top;uniform vec3 bottom;uniform vec3 sunDir;uniform vec3 sunCol;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=max(d.y,0.0);vec3 c=mix(bottom,top,pow(h,0.55));float s=max(dot(d,sunDir),0.0);c+=sunCol*(pow(s,900.0)*1.4+pow(s,24.0)*0.18);gl_FragColor=vec4(c,1.0);}';
sky.material.needsUpdate=true;

function updateGfx(t,day){
  waterU.uTime.value=t;waterU.uDay.value=day;waterU.uStorm.value=S.weather.r*S.weather.w;
  waterU.uFog.value.copy(skyU.bottom.value);waterU.uFogNear.value=scene.fog.near;waterU.uFogFar.value=scene.fog.far;
  waterU.uCam.value.copy(camera.position);
  const sd=waterU.uSun.value.copy(sun.position).sub(sun.target.position).normalize();
  sky.material.uniforms.sunDir.value.copy(sd);sky.material.uniforms.sunCol.value.setRGB(1,0.85,0.6).multiplyScalar(day*(1-S.weather.c*0.8));
  grassU.uTime.value=t;grassU.uWind.value=S.weather.w;
}

/* =========================================================
   Manu, the bird who travels with you
   ========================================================= */
const {HINTS,MANU_COLORS,MANU_LINES}=window.FARE_DATA;
if(!S.manu)S.manu={color:'moana',met:false};
const MM={body:std(0x1fa9b0,{flatShading:false,roughness:0.55}),belly:std(0xffe2a8,{flatShading:false,roughness:0.6}),wing:std(0x137e86,{flatShading:false,roughness:0.55}),
  beak:std(0xf2a33a,{flatShading:false}),eye:new THREE.MeshBasicMaterial({color:0x14313a}),glint:new THREE.MeshBasicMaterial({color:0xffffff})};
function paintManu(){const C=MANU_COLORS[S.manu.color]||MANU_COLORS.moana;MM.body.color.copy(lin(C.body));MM.belly.color.copy(lin(C.belly));MM.wing.color.copy(lin(C.wing));$('#manuBtn').style.setProperty('--manu','#'+C.body.toString(16).padStart(6,'0'));}
const manu=(function(){
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  const b=mesh(new THREE.SphereGeometry(0.2,16,12),MM.body);b.scale.set(1,0.95,1.15);body.add(b);
  const bl=mesh(new THREE.SphereGeometry(0.16,14,10),MM.belly,0,-0.04,0.08);bl.scale.set(0.95,0.95,0.9);body.add(bl);
  const head=new THREE.Group();head.position.set(0,0.2,0.1);body.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.14,14,10),MM.body));
  const bk=mesh(new THREE.ConeGeometry(0.045,0.13,8),MM.beak,0,-0.02,0.15);bk.rotation.x=Math.PI/2;head.add(bk);
  const eyes=[];for(const sd of[-1,1]){const e=new THREE.Group();e.position.set(sd*0.075,0.035,0.105);e.add(mesh(new THREE.SphereGeometry(0.03,10,8),MM.eye,0,0,0,false));e.add(mesh(new THREE.SphereGeometry(0.01,6,4),MM.glint,sd*-0.008,0.01,0.025,false));head.add(e);eyes.push(e);}
  for(const sd of[-1,1]){const ck=mesh(new THREE.SphereGeometry(0.025,8,6),MAT.flower,sd*0.1,-0.03,0.08,false);ck.scale.z=0.4;ck.material=new THREE.MeshBasicMaterial({color:0xff9a8a,transparent:true,opacity:0.7});head.add(ck);}
  const flower=new THREE.Group();flower.position.set(0.07,0.13,0);flower.rotation.z=-0.5;
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,p=mesh(new THREE.SphereGeometry(0.035,6,4),MAT.tiare,Math.cos(a)*0.035,0,Math.sin(a)*0.035,false);p.scale.y=0.4;flower.add(p);}
  flower.add(mesh(new THREE.SphereGeometry(0.015,6,4),std(0xffc83d,{flatShading:false}),0,0.012,0,false));head.add(flower);
  const wings=[];for(const sd of[-1,1]){const pv=new THREE.Group();pv.position.set(sd*0.17,0.04,0);const w=mesh(new THREE.SphereGeometry(0.15,10,6),MM.wing,sd*0.11,0,-0.02);w.scale.set(1,0.25,0.7);pv.add(w);body.add(pv);wings.push(pv);}
  const tail=new THREE.Group();tail.position.set(0,0.02,-0.2);for(let i=-1;i<=1;i++){const f=mesh(new THREE.BoxGeometry(0.06,0.015,0.2),MM.wing,i*0.05,0,-0.09);f.rotation.y=i*0.3;tail.add(f);}body.add(tail);
  for(const sd of[-1,1])body.add(mesh(new THREE.CylinderGeometry(0.008,0.008,0.08,4),MM.beak,sd*0.06,-0.21,0.02,false));
  g.scale.setScalar(0.78);scene.add(g);
  return {g,body,head,eyes,wings,tail,pos:new THREE.Vector3(S.player.x,3,S.player.z),state:'follow',guide:null,idle:0,chat:60+Math.random()*60,say:null,sayT:0,ph:0};
})();
paintManu();
const manuBubble=document.createElement('div');manuBubble.className='say';manuBubble.hidden=true;$('#bubbles').appendChild(manuBubble);
function manuSay(text,secs){manuBubble.textContent=text;manuBubble.hidden=false;manu.sayT=secs||5;}
function locateHint(where){
  const px=player.position.x,pz=player.position.z,near=(arr)=>arr.reduce((b,o)=>!b||dist(o.x,o.z,px,pz)<dist(b.x,b.z,px,pz)?o:b,null);
  switch(where){
    case'palm':return near(S.palms.filter(p=>p.state!=='stump'&&p.g>=1&&p.cd<=0));
    case'rock':return near(S.rocks.filter(o=>o.left>0));
    case'site':case'fare':return SITE;
    case'spring':return SPRING;
    case'bamboo':return near(S.bamboo);
    case'mountain':return near(S.crops.filter(c=>c.type==='fei'))||{x:-12,z:-14};
    case'dog':{const a=S.animals.find(a=>a.type==='dog');return a&&{x:a.x,z:a.z};}
    case'animal':{const a=near(S.animals.filter(a=>!a.tamed&&S.level>=ANIMALS[a.type].lv));return a&&{x:a.x,z:a.z};}
    case'trench':return S.trenches[0]||SPRING;
    case'beach':return S.canoe||dockPt(DOCK.r0-1,0);
    case'site2':return SITE2;
    case'dock':return dockPt(DOCK.r1-1,0);
    case'shells':return near(S.shells)||dockPt(DOCK.r0-1,2);
    case'uru':return near(S.crops.filter(c=>c.type==='uru'));
    case'bush':return near(bushes);
    case'sea':return near(flocks);
    case'lagoon':return near(honus);
    case'fire':return S.fire;
  }
  return null;
}
function askManu(){smartHint();}
$('#manuBtn').onclick=()=>{if(manu.state==='sleep'){manu.state='follow';manuSay('Mmm… ia ora na!',3);return;}askManu();};
let manuLastWx='',manuLastLv=S.level;
function updateManu(dt,t,moving){if(FLY.on)return;
  const M=manu;M.ph+=dt;
  const night=isNight();
  if(moving)M.idle=0;else M.idle+=dt;
  // pick a target
  const shoulder=new THREE.Vector3(0.29,1.6,-0.03);player.localToWorld(shoulder);
  let target,perched=false;
  if(M.state==='guide'&&M.guide){M.guide.t-=dt;const gy=Math.max(H(M.guide.x,M.guide.z),0)+3.2;
    const ang=M.ph*1.6;target=new THREE.Vector3(M.guide.x+Math.cos(ang)*1.4,gy+Math.sin(M.ph*3)*0.2,M.guide.z+Math.sin(ang)*1.4);
    if(M.guide.t<=0||dist(player.position.x,player.position.z,M.guide.x,M.guide.z)<3){M.state='follow';M.guide=null;}}
  if(M.state!=='guide'){
    const wantPerch=(M.idle>3.5||night||onFloor(player.position.x,player.position.z))&&!moving;
    if(S.boat&&canoeMesh){target=new THREE.Vector3(0,0.45,1.5);canoeMesh.localToWorld(target);perched=M.pos.distanceTo(target)<0.25;M.state=perched&&night?'sleep':'follow';}
    else if(wantPerch){target=shoulder;perched=M.pos.distanceTo(target)<0.2;if(perched&&night)M.state='sleep';else if(M.state==='sleep'&&!night)M.state='follow';}
    else{if(M.state==='sleep')M.state='follow';
      const off=new THREE.Vector3(0.75+Math.sin(M.ph*0.7)*0.25,2.15+Math.sin(M.ph*2.1)*0.12,-0.45);player.localToWorld(off);target=off;}
  }
  const k=perched?1:Math.min(1,dt*(M.state==='guide'?2.2:3.2));
  const prev=M.pos.clone();M.pos.lerp(target,k);if(perched)M.pos.copy(target);
  const vel=M.pos.clone().sub(prev),spd=vel.length()/Math.max(dt,1e-3);
  M.g.position.copy(M.pos);
  // facing
  let yaw;if(spd>0.4&&!perched)yaw=Math.atan2(vel.x,vel.z);else yaw=player.rotation.y+(perched?0.2:0);
  let dy=yaw-M.g.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));M.g.rotation.y+=dy*Math.min(1,dt*6);
  // wings & body
  const flying=!perched;
  const flap=flying?Math.sin(t*(spd>1.5?28:18))*0.9:0.12;
  M.wings[0].rotation.z=flap;M.wings[1].rotation.z=-flap;
  M.body.rotation.x=flying?Math.min(0.5,spd*0.06):0;
  M.tail.rotation.x=flying?-0.2:Math.sin(t*2)*0.08;
  M.head.rotation.z=perched&&M.state!=='sleep'?Math.sin(t*0.8)*0.25:0;
  const sleepy=M.state==='sleep';M.eyes.forEach(e=>{e.scale.y=sleepy?0.15:(Math.sin(t*0.9)>0.985?0.2:1);});
  if(perched&&!sleepy)M.body.position.y=Math.abs(Math.sin(t*3))*0.01;else M.body.position.y=0;
  // little remarks
  const lab=wxLabel()[1];
  if(lab!==manuLastWx){if(manuLastWx&&!overlayOpen()){if(lab==='Rain')manuSay(MANU_LINES.rain[Math.floor(Math.random()*2)],4);if(lab==='Storm')manuSay(MANU_LINES.storm[0],4);}manuLastWx=lab;}
  if(S.level!==manuLastLv){manuLastLv=S.level;setTimeout(()=>manuSay(MANU_LINES.level[Math.floor(Math.random()*2)],4),1800);}
  M.chat-=dt;if(M.chat<=0){M.chat=120+Math.random()*120;if(!sleepy&&!overlayOpen()&&!M.sayT){const pool=night?MANU_LINES.night:MANU_LINES.idle;manuSay(pool[Math.floor(Math.random()*pool.length)],4);}}
  if(!S.manu.met&&!overlayOpen()){S.manu.met=true;setTimeout(()=>manuSay(MANU_LINES.hello[0],7),1200);}
  if(sleepy&&Math.random()<dt*0.4)floatText('z',_p.set(M.pos.x,M.pos.y+0.3,M.pos.z));
  // speech bubble
  if(M.sayT>0){M.sayT-=dt;_v.set(M.pos.x,M.pos.y+0.45,M.pos.z).project(camera);
    if(_v.z<1){manuBubble.hidden=false;const bw=manuBubble.offsetWidth||200,bx=clamp((_v.x+1)/2*innerWidth,bw/2+10,innerWidth-bw/2-10),by=Math.max((1-_v.y)/2*innerHeight,manuBubble.offsetHeight+70);manuBubble.style.transform=`translate(${bx.toFixed(1)}px,${by.toFixed(1)}px) translate(-50%,-100%)`;}else manuBubble.hidden=true;
    if(M.sayT<=0){M.sayT=0;manuBubble.hidden=true;}}
}
/* Manu's colours (pause menu) */
function renderManuColors(){$('#manuColors').innerHTML=Object.entries(MANU_COLORS).map(([k,c])=>`<button class="swatch${S.manu.color===k?' on':''}" data-c="${k}" style="--c:#${c.body.toString(16).padStart(6,'0')};--b:#${c.belly.toString(16).padStart(6,'0')}" aria-label="${c.n}" title="${c.n}"><span></span></button>`).join('');}
$('#manuColors').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;S.manu.color=b.dataset.c;paintManu();renderManuColors();save();});
renderManuColors();

/* =========================================================
   v6: night sky, wind & tornado, roof damage, beach life, compost,
   cloth & decor, tools, furniture, music, open sea
   ========================================================= */
const PASS_A=Math.atan2(DOCK.dz,DOCK.dx)+Math.atan2(-4.4,REEF+1),SEA_MAX=115;
function angDiff(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
function inPass(x,z){return angDiff(Math.atan2(z,x),PASS_A)<0.085;}
function outsideReef(){return S.boat&&Math.hypot(player.position.x,player.position.z)>REEF+2.2;}
function seaOK(x,z){const r=Math.hypot(x,z);if(r<=REEF)return true;if(!S.sail||r>SEA_MAX)return false;if(r<REEF+2.8)return inPass(x,z);return true;}
function dayAmt(){return smooth(-0.12,0.18,Math.sin((S.tod-0.25)*Math.PI*2));}
function fareDist(px,pz){const dx=Math.max(0,Math.abs(px-SITE.x)-SITE_HX),dz=Math.max(0,Math.abs(pz-SITE.z)-SITE_HZ);return Math.hypot(dx,dz);}
function onDockArea(x,z){const[a,b]=dockLocal(x,z);return a>DOCK.r0-3&&a<DOCK.r1+1&&Math.abs(b)<2.5;}

/* ----- the pass in the reef ----- */
waterU.uPassA={value:PASS_A};
water.material.fragmentShader=water.material.fragmentShader.replace('uniform sampler2D uDepth;','uniform sampler2D uDepth;uniform float uPassA;')
  .replace(/(float reefF=[^;]*;)/,'$1float pa=abs(atan(sin(atan(vW.z,vW.x)-uPassA),cos(atan(vW.z,vW.x)-uPassA)));reefF*=smoothstep(0.05,0.1,pa);col=mix(col,deepL,(1.0-smoothstep(0.05,0.1,pa))*smoothstep(uR+4.0,uR+6.5,r)*(1.0-outside));');
water.material.needsUpdate=true;
(function passMarkers(){for(const[sd,c]of[[-1,0xd62a20],[1,0x2f9d4a]]){const a=PASS_A+sd*0.1,r=REEF+1.4,g=new THREE.Group();
  g.add(cyl(0.12,3,MAT.post,0,0.6,0,6));g.add(cyl(0.3,0.5,std(c),0,2.2,0,8));g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);scene.add(g);}})();

/* ----- night sky: twinkling stars, Milky Way, moon, shooting stars ----- */
stars.visible=false;
sky.material.uniforms.uNight={value:0};sky.material.uniforms.uMoon={value:new THREE.Vector3(0,1,0)};
sky.material.fragmentShader='uniform vec3 top;uniform vec3 bottom;uniform vec3 sunDir;uniform vec3 sunCol;uniform float uNight;uniform vec3 uMoon;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=max(d.y,0.0);vec3 c=mix(bottom,top,pow(h,0.55));float s=max(dot(d,sunDir),0.0);c+=sunCol*(pow(s,900.0)*1.4+pow(s,24.0)*0.18);vec3 md=uMoon;float m=max(dot(d,md),0.0);float disc=smoothstep(0.99935,0.9996,m);float crater=0.92+0.08*sin(d.x*900.0)*sin(d.z*700.0);c=mix(c,vec3(0.96,0.95,0.86)*crater,disc*uNight);c+=vec3(0.55,0.62,0.75)*pow(m,160.0)*0.3*uNight;gl_FragColor=vec4(c,1.0);}';
sky.material.needsUpdate=true;
const starU={uOp:{value:0},uTime:{value:0},uPR:{value:Math.min(window.devicePixelRatio||1,2)}};
function starPoints(N,band,haze){const pos=new Float32Array(N*3),sz=new Float32Array(N),ph=new Float32Array(N),rand=mulberry32(band?91:77);
  const ax=new THREE.Vector3(0.35,0.55,0.75).normalize(),u=new THREE.Vector3(1,0,0).cross(ax).normalize(),w=ax.clone().cross(u),v=new THREE.Vector3();
  for(let i=0;i<N;i++){
    if(!band){const th=rand()*Math.PI*2,y=rand()*1.08-0.08,q=Math.sqrt(1-y*y);v.set(Math.cos(th)*q,y,Math.sin(th)*q);}
    else{const th=rand()*Math.PI*2,off=(rand()+rand()+rand()-1.5)*(haze?0.1:0.13);v.copy(u).multiplyScalar(Math.cos(th)).addScaledVector(w,Math.sin(th)).addScaledVector(ax,off).normalize();}
    if(v.y<-0.04)v.y=-v.y;pos[i*3]=v.x*380;pos[i*3+1]=v.y*380;pos[i*3+2]=v.z*380;
    const b=rand();sz[i]=haze?30+rand()*26:band?(b>0.95?2.8:1.9):(b>0.975?5:b>0.86?3.4:2.3);ph[i]=rand()*6.28;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('size',new THREE.BufferAttribute(sz,1));g.setAttribute('phase',new THREE.BufferAttribute(ph,1));
  const m=new THREE.ShaderMaterial({uniforms:starU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float size;attribute float phase;uniform float uTime;uniform float uPR;varying float vA;void main(){vA=${haze?'1.0':'0.55+0.45*sin(uTime*(1.1+fract(phase)*2.4)+phase*7.0)'};gl_PointSize=size*uPR*${haze?'1.0':'(0.85+0.3*vA)'};gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float uOp;varying float vA;void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.0,d)*uOp*vA*${haze?'0.11':'1.0'};gl_FragColor=vec4(vec3(${haze?'0.75,0.8,1.0':'1.0,0.97,0.9'})*a,a);}`});
  const p=new THREE.Points(g,m);p.frustumCulled=false;scene.add(p);return p;}
const skyStars=[starPoints(coarse?1100:1800,false,false),starPoints(coarse?700:1200,true,false),starPoints(220,true,true)];
const shooters=[];
for(let i=0;i<2;i++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array([1,1,1,0,0,0]),3));
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));l.frustumCulled=false;l.visible=false;scene.add(l);
  shooters.push({l,t:1,dur:1,a:new THREE.Vector3(),b:new THREE.Vector3()});}
let shootT=6;
function launchShooter(){const s=shooters.find(x=>x.t>=x.dur);if(!s)return;
  const az=Math.random()*Math.PI*2,el=0.45+Math.random()*0.6;s.a.set(Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el));
  const tang=new THREE.Vector3(-Math.sin(az),-0.6-Math.random()*0.4,Math.cos(az)).normalize().multiplyScalar(Math.random()<0.5?1:-1);tang.y=-Math.abs(tang.y);
  s.b.copy(s.a).addScaledVector(tang,0.22+Math.random()*0.12).normalize();s.t=0;s.dur=0.7+Math.random()*0.5;s.l.visible=true;
  if(S.flags.shootDay!==S.day){S.flags.shootDay=S.day;manuSay(MANU_LINES.shoot[Math.floor(Math.random()*2)],4);}}
function updateShooters(dt){for(const s of shooters){if(s.t>=s.dur){s.l.visible=false;continue;}s.t+=dt;const k=Math.min(1,s.t/s.dur),c=camera.position,arr=s.l.geometry.attributes.position.array;
  const head=new THREE.Vector3().copy(s.a).lerp(s.b,k).normalize().multiplyScalar(360),tail=new THREE.Vector3().copy(s.a).lerp(s.b,Math.max(0,k-0.35)).normalize().multiplyScalar(360);
  arr[0]=head.x+c.x;arr[1]=head.y+c.y;arr[2]=head.z+c.z;arr[3]=tail.x+c.x;arr[4]=tail.y+c.y;arr[5]=tail.z+c.z;s.l.geometry.attributes.position.needsUpdate=true;
  s.l.material.opacity=Math.sin(k*Math.PI);}}

/* ----- wind: blowing leaves ----- */
const LEAF_N=90;
const leaves=(function(){const p=new Float32Array(LEAF_N*3),P=[];for(let i=0;i<LEAF_N;i++)P.push({x:(Math.random()-0.5)*30,y:Math.random()*6,z:(Math.random()-0.5)*30,s:0.6+Math.random()*0.8});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({color:lin(0x6aa43c),size:0.16,transparent:true,opacity:0.9}));m.frustumCulled=false;m.visible=false;scene.add(m);return{m,P};})();
function updateLeaves(dt,t){const w=S.weather.w,on=w>0.62&&S.weather.r<0.6&&!S.boat;leaves.m.visible=on;if(!on)return;
  const arr=leaves.m.geometry.attributes.position.array,cx=player.position.x,cz=player.position.z,cy=player.position.y,sp=4+w*9;
  leaves.P.forEach((q,i)=>{q.x+=sp*q.s*dt;q.z+=sp*0.35*q.s*dt;q.y+=Math.sin(t*3+i)*0.6*dt;if(q.x>15){q.x=-15;q.z=(Math.random()-0.5)*30;q.y=Math.random()*5;}
    arr[i*3]=cx+q.x;arr[i*3+1]=cy+0.3+q.y;arr[i*3+2]=cz+q.z;});leaves.m.geometry.attributes.position.needsUpdate=true;}

/* ----- tornado (puahiohio) ----- */
const torMesh=(function(){const g=new THREE.Group(),mat=new THREE.MeshLambertMaterial({color:lin(0x8f989a),transparent:true,opacity:0.5,side:THREE.DoubleSide,depthWrite:false}),segs=[];
  for(let i=0;i<6;i++){const c=new THREE.Mesh(new THREE.CylinderGeometry(0.35+(i+1)*0.5,0.35+i*0.5,2.1,14,1,true),mat);c.position.y=1+i*2;g.add(c);segs.push(c);}
  const N=70,pp=new Float32Array(N*3),deb=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:lin(0x5a4630),size:0.24}));deb.geometry.setAttribute('position',new THREE.BufferAttribute(pp,3));deb.frustumCulled=false;g.add(deb);
  const spray=new THREE.Mesh(new THREE.RingGeometry(0.6,2.8,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.35,depthWrite:false,side:THREE.DoubleSide}));spray.rotation.x=-Math.PI/2;spray.position.y=0.15;g.add(spray);
  g.visible=false;scene.add(g);return{g,segs,deb,N};})();
function startTornado(){const a=Math.random()*Math.PI*2,sx=Math.cos(a)*72,sz=Math.sin(a)*72;
  const targets=[SITE,SITE2,{x:0,z:0},{x:(Math.random()-0.5)*30,z:(Math.random()-0.5)*30}],tg=targets[Math.floor(Math.random()*targets.length)];
  const dx=tg.x+(Math.random()-0.5)*16-sx,dz=tg.z+(Math.random()-0.5)*16-sz,l=Math.hypot(dx,dz);
  Object.assign(TOR,{on:true,x:sx,z:sz,dx:dx/l,dz:dz/l,t:0,life:150/3.2,hit:{},pushed:0});torMesh.g.visible=true;
  toast('A puahiohio, a little tornado, is crossing the lagoon! Keep clear of it.');manuSay(MANU_LINES.tornado[0],5);wxSig='';actSig='';}
function updateTornado(dt,t){
  if(!TOR.on)return;TOR.t+=dt;TOR.x+=TOR.dx*3.2*dt;TOR.z+=TOR.dz*3.2*dt;
  const gy=Math.max(H(TOR.x,TOR.z),0);torMesh.g.position.set(TOR.x,gy-0.1,TOR.z);
  torMesh.segs.forEach((s,i)=>{s.rotation.y+=dt*(7-i*0.7);s.position.x=Math.sin(t*1.3+i*0.6)*0.22*i;s.position.z=Math.cos(t*1.1+i*0.5)*0.18*i;});
  const arr=torMesh.deb.geometry.attributes.position.array;for(let i=0;i<torMesh.N;i++){const a=t*(3+i%5)+i,h=(i*0.37+t*2.5)%9,r=0.6+h*0.35;arr[i*3]=Math.cos(a)*r;arr[i*3+1]=h;arr[i*3+2]=Math.sin(a)*r;}
  torMesh.deb.geometry.attributes.position.needsUpdate=true;
  const near=(x,z,r)=>dist(TOR.x,TOR.z,x,z)<r;
  if(!TOR.hit.fare&&near(SITE.x,SITE.z,6.5)){TOR.hit.fare=1;damageRoof('fare',S.lashed?0.25:0.5,'The tornado passed close by.');}
  if(!TOR.hit.g2&&near(SITE2.x,SITE2.z,6)){TOR.hit.g2=1;damageRoof('g2',S.lashed?0.25:0.5,'The tornado passed close by.');}
  if(!TOR.hit.stall&&S.stall&&near(S.stall.x,S.stall.z,4)){TOR.hit.stall=1;let lost=0;for(const k in S.stall.stock){const n=Math.ceil(S.stall.stock[k]/2);S.stall.stock[k]-=n;lost+=n;if(S.stall.stock[k]<=0)delete S.stall.stock[k];}
    if(lost){refreshStallDisplay();toast(`The wind scattered ${lost} things from your fruit stand.`);}}
  for(const c of S.crops)if(c.g>=1&&near(c.x,c.z,4))c.cd=Math.max(c.cd,CROPS[c.type].regrow*0.5);
  for(const p of S.palms)if(p.state!=='stump'&&near(p.x,p.z,4))p.cd=Math.max(p.cd,15);
  const pd=dist(TOR.x,TOR.z,player.position.x,player.position.z);
  if(pd<4.5){const ax=(player.position.x-TOR.x)/(pd||1),az=(player.position.z-TOR.z)/(pd||1),nx=player.position.x+ax*7*dt,nz=player.position.z+az*7*dt;
    if(S.boat?seaOK(nx,nz)&&H(nx,nz)<-0.05:walkable(nx,nz)){player.position.x=nx;player.position.z=nz;}
    if(!TOR.pushed){TOR.pushed=1;toast('The wind throws you back! Get away from the tornado.');}}
  if(TOR.t>TOR.life||Math.hypot(TOR.x,TOR.z)>80&&TOR.t>5){TOR.on=false;torMesh.g.visible=false;wxSig='';actSig='';toast('The tornado has passed.');}
}

/* ----- roof damage, repair, lashing ----- */
const holeMat=std(0x2a1d10,{roughness:1});
const L5=Math.hypot(3.1,1.8),A5=Math.atan2(1.8,3.1),L2=Math.hypot(2.2,0.95),A2=Math.atan2(0.95,2.2);
const fareSlopes=[{pos:new THREE.Vector3(0,Y0+3.25,-1.55),rx:-A5,th:0.24,s:-1},{pos:new THREE.Vector3(0,Y0+3.25,1.55),rx:A5,th:0.24,s:1}];
const g2Slopes=[{pos:new THREE.Vector3(0,F2+2.78,-1.1),rx:-A2,th:0.22,s:-1},{pos:new THREE.Vector3(0,F2+2.78,1.1),rx:A2,th:0.22,s:1}];
function onSlope(parent,sl,build){const g=new THREE.Group();g.position.copy(sl.pos);g.rotation.x=sl.rx;build(g);parent.add(g);return g;}
const fareHoles=[[1,-1.8,0.2],[0,1.6,-0.3],[1,1.9,-0.5],[0,-1.2,0.5]].map(([si,x,zl])=>onSlope(site,fareSlopes[si],g=>g.add(box(1.0,0.28,0.8,holeMat,x,0,zl))));
const g2Holes=[[1,-1.2,0.1],[0,1.1,-0.2],[1,1.2,-0.3],[0,-1,0.3]].map(([si,x,zl])=>onSlope(g2,g2Slopes[si],g=>g.add(box(0.8,0.26,0.6,holeMat,x,0,zl))));
function ropes(parent,slopes,xs,len){const arr=[];slopes.forEach(sl=>xs.forEach(x=>arr.push(onSlope(parent,sl,g=>{g.add(box(0.06,sl.th+0.06,len,MAT.rope,x,0,0));
  const st=mesh(rockGeo,MAT.basalt,x,-0.22,sl.s*(len/2+0.02));st.scale.setScalar(0.13);g.add(st);}))));return arr;}
const fareRopes=ropes(site,fareSlopes,[-2.4,0,2.4],L5),g2Ropes=ropes(g2,g2Slopes,[-1.7,1.7],L2);
const debris=[];for(let i=0;i<3;i++){const b=box(0.5,0.12,0.25,MAT.thatch,SITE.x+3.6+i*0.6,0,SITE.z+1.5-i*0.9);b.rotation.y=i;scene.add(b);debris.push(b);}
let stormT=0;
function damageRoof(which,amt,why){if(which==='fare'&&S.stage<5)return;if(which==='g2'&&S.g2<3)return;
  const before=S.dmg[which];S.dmg[which]=Math.min(1,Math.round((before+amt)*4)/4);
  if(S.dmg[which]>before){toast(`${why} ${which==='fare'?'Your fare':'The guest fare'} lost some thatch. Bring thatch and rope to repair it.`);manuSay(MANU_LINES.damage[0],5);actSig='';save();}}
function repairAct(w){const n=Math.max(1,Math.round(S.dmg[w]*4)),ok=S.inv.thatch>=n&&S.inv.rope>=1;
  return{label:'Repair the roof',sub:ok?`${n} thatch · 1 rope`:`Needs ${n} thatch and 1 rope`,off:!ok,fn:ok?()=>repairRoof(w):null};}
function repairRoof(w){const n=Math.max(1,Math.round(S.dmg[w]*4));if(S.inv.thatch<n||S.inv.rope<1)return;take({thatch:n,rope:1});S.dmg[w]=0;showTool('toi');chopT=0.6;stat('repair');
  floatText('Roof repaired',_p.set(w==='fare'?SITE.x:SITE2.x,4.5,w==='fare'?SITE.z:SITE2.z));refresh();}
function specialCheck(sp){
  {const c9=v9SpecialCheck(sp);if(!c9.ok)return c9;}
  if(sp==='lash'){if(S.lashed)return{ok:false,why:'Your roofs are already lashed down'};if(S.stage<5)return{ok:false,why:'Finish your fare first'};}
  if(sp==='sail'){if(!S.canoe)return{ok:false,why:'Build a vaʻa first'};if(S.sail)return{ok:false,why:'Your vaʻa already has a sail'};}
  if(sp==='taurua'){if(!S.canoe||!S.sail)return{ok:false,why:'Needs a vaʻa with a sail first'};if(S.taurua)return{ok:false,why:'You already have a vaʻa taurua'};}
  if(sp==='ptable'){if(S.g2<3)return{ok:false,why:'Build the guest fare first'};if(S.owned.ptable)return{ok:false,why:'Already on the guest porch'};}
  return{ok:true};}
function doSpecial(sp){
  if(sp==='lash'){S.lashed=true;toast('Ropes and stone weights hold your roofs down. Storms will do less damage.');}
  if(sp==='sail'){S.sail=true;toast('Your vaʻa has a woven sail! Sail out through the pass by the wharf, between the red and green posts.');}
  if(sp==='taurua'){S.taurua=true;toast('Your vaʻa taurua is ready! Paddle it to the wharf to start a lagoon tour.');}
  if(sp==='ptable'){S.owned.ptable=true;toast('A table and chairs now stand on the guest porch.');}
  v9DoSpecial(sp);}

/* ----- shells on the beach ----- */
const SHELL_GEO={pupu:new THREE.ConeGeometry(0.06,0.16,8),poreho:new THREE.SphereGeometry(0.075,12,8),parau:new THREE.CylinderGeometry(0.11,0.12,0.025,16)};
const SHELL_MAT={pupu:std(0xf6efe0,{flatShading:false,roughness:0.4}),poreho:std(0xb8783e,{flatShading:false,roughness:0.2}),parau:new THREE.MeshStandardMaterial({color:lin(0xdfe9ee),roughness:0.12,metalness:0.75})};
const sparkMat=new THREE.SpriteMaterial({map:(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.25,'rgba(255,255,240,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  g.fillStyle='rgba(255,255,255,.9)';g.fillRect(30,4,4,56);g.fillRect(4,30,56,4);const t=new THREE.CanvasTexture(c);return t;})(),transparent:true,depthWrite:false,opacity:0.9});
function spawnShellMesh(sh){const g=new THREE.Group(),m=new THREE.Mesh(SHELL_GEO[sh.t],SHELL_MAT[sh.t]);
  if(sh.t==='pupu')m.rotation.z=Math.PI/2;if(sh.t==='poreho')m.scale.set(0.75,0.5,1.1);m.castShadow=true;g.add(m);
  const sp=new THREE.Sprite(sparkMat);sp.position.y=0.12;sp.scale.setScalar(0.3);g.add(sp);g.userData.sp=sp;g.userData.ph=Math.random()*6;
  g.position.set(sh.x,Math.max(H(sh.x,sh.z),0)+0.03,sh.z);g.rotation.y=Math.random()*6;scene.add(g);sh.mesh=g;}
function shellSpot(){for(let i=0;i<80;i++){const a=Math.random()*Math.PI*2,r=R-4+Math.random()*4.6,x=Math.cos(a)*r,z=Math.sin(a)*r,h=H(x,z);
  if(h<0.02||h>0.55||onDockArea(x,z)||nearG2(x,z,1)||S.shells.some(s=>dist(s.x,s.z,x,z)<2.2)||(S.canoe&&dist(S.canoe.x,S.canoe.z,x,z)<2))continue;return{x,z};}return null;}
function addShell(){const p=shellSpot();if(!p)return;const r=Math.random(),sh={x:p.x,z:p.z,t:r<0.07?'parau':r<0.36?'poreho':'pupu'};S.shells.push(sh);spawnShellMesh(sh);}
S.shells.forEach(spawnShellMesh);
if(!S.flags.shellsInit){S.flags.shellsInit=1;for(let i=0;i<9;i++)addShell();}
let shellT=15;
function pickShell(sh){give({[sh.t]:1});stat('shells');scene.remove(sh.mesh);S.shells.splice(S.shells.indexOf(sh),1);chopT=0.3;
  floatText(`+1 ${ITEMS[sh.t].n}`,_p.set(sh.x,1.2,sh.z));if(sh.t==='parau')toast('A pārau! Mother of pearl is rare on the beach.');once('shellTip','String 10 pūpū and some rope into a hei pūpū (Craft).');refresh();}

/* ----- little crabs ----- */
const crabMat=std(0xd8572a,{flatShading:false,roughness:0.5}),crabDark=std(0xa83e1c,{flatShading:false});
function makeCrab(){const g=new THREE.Group(),b=mesh(new THREE.SphereGeometry(0.16,12,8),crabMat,0,0.09,0);b.scale.set(1.25,0.5,0.9);g.add(b);
  const lg=[];for(const sd of[-1,1])for(let i=0;i<3;i++){const l=mesh(new THREE.CylinderGeometry(0.013,0.01,0.17,4),crabDark,sd*0.2,0.06,-0.07+i*0.07,false);l.rotation.z=sd*1.1;g.add(l);lg.push(l);}
  const cl=[];for(const sd of[-1,1]){const c=new THREE.Group();c.position.set(sd*0.12,0.1,0.13);const m=mesh(new THREE.SphereGeometry(0.055,8,6),crabMat,0,0,0.03,false);m.scale.set(0.8,0.6,1.1);c.add(m);g.add(c);cl.push(c);}
  for(const sd of[-1,1]){g.add(mesh(new THREE.CylinderGeometry(0.008,0.008,0.07,4),crabDark,sd*0.05,0.15,0.1,false));g.add(mesh(new THREE.SphereGeometry(0.02,6,4),FACE.eye,sd*0.05,0.19,0.1,false));}
  g.scale.setScalar(1.1);scene.add(g);return{g,lg,cl};}
const crabs=[];for(let i=0;i<9;i++){const p=shellSpot()||{x:R-2,z:0};const c={x:p.x,z:p.z,yaw:Math.random()*6,dir:1,mode:'walk',t:Math.random()*2,moving:false,sc:1,o:makeCrab(),ph:0};crabs.push(c);}
function updateCrabs(dt,t){const px=player.position.x,pz=player.position.z;
  for(const c of crabs){const o=c.o;c.t-=dt;
    if(c.mode==='hide'){c.sc=Math.max(0,c.sc-dt*4);if(c.t<=0){const p=shellSpot();if(p){c.x=p.x;c.z=p.z;}c.mode='walk';c.t=1;}}
    else{c.sc=Math.min(1,c.sc+dt*3);
      const pd=dist(c.x,c.z,px,pz);
      if(c.mode==='walk'&&pd<2.6&&!S.boat){c.mode='flee';c.t=0.7;const ax=Math.cos(c.yaw),az=-Math.sin(c.yaw);c.dir=((c.x-px)*ax+(c.z-pz)*az)>0?1:-1;}
      if(c.mode==='flee'){c.moving=true;if(c.t<=0){c.mode='hide';c.t=6+Math.random()*5;}}
      else if(c.t<=0){c.moving=!c.moving;c.t=c.moving?0.8+Math.random()*1.5:1+Math.random()*2.5;if(Math.random()<0.4)c.dir*=-1;if(Math.random()<0.3)c.yaw+=(Math.random()-0.5)*1.5;}
      if(c.moving){const sp=c.mode==='flee'?3:1.1,nx=c.x+Math.cos(c.yaw)*c.dir*sp*dt,nz=c.z-Math.sin(c.yaw)*c.dir*sp*dt,h=H(nx,nz);
        if(h<-0.05||h>0.8||nearG2(nx,nz,0.3)){c.dir*=-1;c.yaw+=1.2;}else{c.x=nx;c.z=nz;}c.ph+=dt*22;}}
    o.g.position.set(c.x,Math.max(H(c.x,c.z),0)-(1-c.sc)*0.12,c.z);o.g.rotation.y=c.yaw;o.g.scale.setScalar(1.1*Math.max(0.01,c.sc));o.g.visible=c.sc>0.02;
    o.lg.forEach((l,i)=>{l.rotation.x=c.moving?Math.sin(c.ph+i)*0.6:0;});
    o.cl.forEach((k,i)=>{k.rotation.x=c.mode==='flee'?-0.9:Math.sin(t*2+i)*0.15;});}}

/* ----- honu (sea turtles) ----- */
const honuShellMat=new THREE.MeshStandardMaterial({roughness:0.55,map:canvasTex(g=>{g.fillStyle='#5f6b30';g.fillRect(0,0,128,128);g.strokeStyle='#d8c27a';g.lineWidth=3;
  for(let y=0;y<5;y++)for(let x=0;x<5;x++){const cx=x*30+(y%2)*15,cy=y*28;g.beginPath();for(let k=0;k<6;k++){const a=k/6*Math.PI*2;g.lineTo(cx+Math.cos(a)*14,cy+Math.sin(a)*14);}g.closePath();g.fillStyle=(x+y)%2?'#6f7a38':'#7d6a34';g.fill();g.stroke();}},1,1)});
const honuSkin=std(0x8a9a5a,{flatShading:false});
function makeHonu(){const g=new THREE.Group();
  const sh=mesh(new THREE.SphereGeometry(0.5,18,10,0,Math.PI*2,0,Math.PI/2),honuShellMat,0,0,0);sh.scale.set(0.9,0.45,1.15);g.add(sh);
  const pl=mesh(new THREE.CylinderGeometry(0.44,0.44,0.05,18),std(0xe8d9a8,{flatShading:false}),0,-0.01,0);pl.scale.z=1.25;g.add(pl);
  const head=mesh(new THREE.SphereGeometry(0.13,12,10),honuSkin,0,0.04,0.66);head.scale.set(0.9,0.8,1.1);g.add(head);
  for(const sd of[-1,1])g.add(mesh(new THREE.SphereGeometry(0.022,6,4),FACE.eye,sd*0.07,0.09,0.75,false));
  const fl=[];[[-1,0.3],[1,0.3],[-1,-0.38],[1,-0.38]].forEach(([sd,z],i)=>{const p=new THREE.Group();p.position.set(sd*0.36,0,z);const f=mesh(new THREE.SphereGeometry(i<2?0.24:0.14,10,6),honuSkin,sd*(i<2?0.2:0.1),0,0);f.scale.set(1,0.18,0.5);p.add(f);g.add(p);fl.push(p);});
  g.scale.setScalar(1.15);scene.add(g);return{g,fl};}
function lagoonSpot(){for(let i=0;i<80;i++){const a=Math.random()*Math.PI*2,r=R-1+Math.random()*(REEF-R-1.5),x=Math.cos(a)*r,z=Math.sin(a)*r,h=H(x,z);if(h<-0.9&&h>-3.8&&!onDockArea(x,z))return{x,z};}return{x:R+3,z:0};}
const honus=[0,1].map(i=>{const p=lagoonSpot();const t=lagoonSpot();return{x:p.x,z:p.z,tx:t.x,tz:t.z,yaw:0,y:-0.32,mode:'swim',t:200+Math.random()*120+i*90,surf:8+Math.random()*10,wcd:0,o:makeHonu(),ph:Math.random()*6};});
function updateHonus(dt,t){const day=dayAmt()>0.5;
  for(const h of honus){h.t-=dt;h.surf-=dt;if(h.wcd>0)h.wcd-=dt;
    if(h.mode==='swim'&&h.t<=0&&day&&h===honus[0]){const p=shellSpot();if(p){h.mode='tobeach';h.tx=p.x;h.tz=p.z;}h.t=260+Math.random()*120;}
    const dx=h.tx-h.x,dz=h.tz-h.z,d=Math.hypot(dx,dz),onSand=H(h.x,h.z)>-0.08;
    let sp=h.mode==='beach'?0:onSand?0.35:0.8;
    if(d<0.3){if(h.mode==='swim'){const q=lagoonSpot();h.tx=q.x;h.tz=q.z;}
      else if(h.mode==='tobeach'){h.mode='beach';h.rest=28;if(dist(h.x,h.z,player.position.x,player.position.z)<30){toast('A honu has come up on the beach to rest. Watch it quietly.');manuSay(MANU_LINES.honu[0],5);}}
      else if(h.mode==='back'){h.mode='swim';}}
    if(h.mode==='beach'){h.rest-=dt;if(h.rest<=0){const q=lagoonSpot();h.mode='back';h.tx=q.x;h.tz=q.z;}}
    if(sp>0&&d>0.01){h.x+=dx/d*sp*dt;h.z+=dz/d*sp*dt;const ty=Math.atan2(dx,dz);let dr=ty-h.yaw;dr=Math.atan2(Math.sin(dr),Math.cos(dr));h.yaw+=dr*Math.min(1,dt*1.5);}
    let ty2=-0.32;if(h.surf<0){ty2=-0.04;if(h.surf<-3)h.surf=10+Math.random()*12;}
    if(onSand)ty2=Math.max(H(h.x,h.z),0)+0.02;h.y+=(ty2-h.y)*Math.min(1,dt*2);
    const o=h.o;o.g.position.set(h.x,h.y,h.z);o.g.rotation.y=h.yaw;h.ph+=dt*(sp>0?(onSand?2:3):0.8);
    o.fl.forEach((f,i)=>{const sd=i%2?1:-1;f.rotation.z=sd*Math.sin(h.ph+(i>1?1.5:0))*(i<2?0.55:0.3);f.rotation.y=sd*Math.sin(h.ph)*0.25;});}}
function watchHonu(h){if(h.wcd<=0){stat('honu');h.wcd=30;}floatText('♥',_p.set(h.x,h.y+1.2,h.z));
  toast('Honu are protected in French Polynesia. Never touch, take or eat them: just admire them.');manuSay(MANU_LINES.honu[0],4);refresh();}

/* ----- dolphins and seabirds in the open sea ----- */
const dolphinMat=std(0x6d8796,{flatShading:false,roughness:0.35}),dolphinBelly=std(0xd9e2e6,{flatShading:false});
function makeDolphin(){const g=new THREE.Group(),b=mesh(new THREE.SphereGeometry(0.4,14,10),dolphinMat);b.scale.set(0.75,0.7,2.1);g.add(b);
  const bl=mesh(new THREE.SphereGeometry(0.34,12,8),dolphinBelly,0,-0.1,0.05);bl.scale.set(0.7,0.5,1.8);g.add(bl);
  const sn=mesh(new THREE.ConeGeometry(0.12,0.35,10),dolphinMat,0,-0.05,0.95);sn.rotation.x=Math.PI/2;g.add(sn);
  const fin=mesh(new THREE.ConeGeometry(0.14,0.45,6),dolphinMat,0,0.4,-0.1);fin.rotation.x=-0.5;fin.scale.z=0.3;g.add(fin);
  const tail=mesh(new THREE.BoxGeometry(0.7,0.05,0.25),dolphinMat,0,0,-0.95);g.add(tail);scene.add(g);return g;}
const pod={a:Math.random()*6,r:64,ds:[0,1,2].map(i=>({g:makeDolphin(),off:i*1.4,ph:i*1.3}))};
function updateDolphins(dt,t){pod.a+=dt*0.035;const cx=Math.cos(pod.a)*pod.r,cz=Math.sin(pod.a)*pod.r,tx=-Math.sin(pod.a),tz=Math.cos(pod.a);
  for(const d of pod.ds){const k=((t*0.32+d.ph)%1),up=k<0.38,pr=k/0.38;
    const x=cx+tx*d.off*2+Math.cos(pod.a)*(d.off-1.4)*1.5,z=cz+tz*d.off*2+Math.sin(pod.a)*(d.off-1.4)*1.5;
    const y=up?Math.sin(pr*Math.PI)*1.4-0.15:-0.9;d.g.position.set(x+tx*(up?pr*3:0),y,z+tz*(up?pr*3:0));d.g.rotation.y=Math.atan2(tx,tz);d.g.rotation.x=up?-Math.cos(pr*Math.PI)*0.7:0;d.g.visible=y>-0.6;}}
function nearDolphins(){return S.boat&&dist(Math.cos(pod.a)*pod.r,Math.sin(pod.a)*pod.r,player.position.x,player.position.z)<12;}
const birdMat=std(0xf6f1e6,{flatShading:false,side:THREE.DoubleSide}),birdTip=std(0x2a2a2a,{side:THREE.DoubleSide});
function makeBird(){const g=new THREE.Group(),b=mesh(new THREE.SphereGeometry(0.09,8,6),birdMat,0,0,0,false);b.scale.set(0.7,0.7,1.8);g.add(b);const ws=[];
  for(const sd of[-1,1]){const p=new THREE.Group();const w=mesh(new THREE.PlaneGeometry(0.55,0.16),birdMat,sd*0.27,0,0,false);w.rotation.x=-Math.PI/2;p.add(w);
    const tip=mesh(new THREE.PlaneGeometry(0.14,0.16),birdTip,sd*0.6,0,0,false);tip.rotation.x=-Math.PI/2;p.add(tip);g.add(p);ws.push(p);}return{g,ws};}
function flockSpot(){const a=Math.random()*Math.PI*2,r=58+Math.random()*38;return{x:Math.cos(a)*r,z:Math.sin(a)*r};}
const flocks=[0,1,2].map(()=>{const p=flockSpot(),g=new THREE.Group();scene.add(g);const birds=[0,1,2,3,4,5].map(i=>{const b=makeBird();g.add(b.g);return{...b,ph:i*1.05,r:2.2+Math.random()*1.6,h:3.5+Math.random()*2.5,sp:0.9+Math.random()*0.5};});
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.2,1.5,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=0.06;g.add(ring);
  return{x:p.x,z:p.z,left:3,ttl:150+Math.random()*90,g,birds,ring};});
function moveFlock(f){const p=flockSpot();f.x=p.x;f.z=p.z;f.left=3;f.ttl=150+Math.random()*90;}
function updateFlocks(dt,t){for(const f of flocks){f.ttl-=dt;if(f.ttl<=0)moveFlock(f);f.g.position.set(f.x,0,f.z);f.g.visible=f.left>0;
  f.ring.scale.setScalar(0.6+((t*0.6)%1)*1.4);f.ring.material.opacity=0.5*(1-((t*0.6)%1));
  f.birds.forEach(b=>{const a=t*b.sp+b.ph,dive=Math.max(0,Math.sin(t*0.7+b.ph*2))**12;b.g.position.set(Math.cos(a)*b.r,b.h*(1-dive*0.85),Math.sin(a)*b.r);b.g.rotation.y=-a;b.g.rotation.z=dive*1.2;
    const fl=Math.sin(t*9+b.ph)*0.6*(1-dive);b.ws[0].rotation.z=fl;b.ws[1].rotation.z=-fl;});}}
function nearFlock(){if(!S.boat)return null;return flocks.find(f=>f.left>0&&dist(f.x,f.z,player.position.x,player.position.z)<7.5)||null;}
function deepCatch(fl){_p.set(player.position.x,1.8,player.position.z);
  if(fl&&fl.left>0){const ok=Math.random()<(S.owned.hooks?0.95:0.8);if(ok){const k=Math.random()<0.55?'aahi':'mahi';give({[k]:1});stat('deepfish');stat('fish');fl.left--;if(fl.left<=0)setTimeout(()=>moveFlock(fl),1500);
      floatText(`+1 ${ITEMS[k].n}`,_p);once('deepTip','Grill aʻahi and mahi mahi at your fire, or sell them at the stand.');}else floatText('It got away!',_p);}
  else if(Math.random()<0.25){give({fish:1});stat('fish');floatText('+1 fish',_p);}else floatText('No bite. Find the diving birds.',_p);
  refresh();}

/* ----- compost ----- */
let compostMesh=null;
function placeCompostMesh(){if(!S.compost)return;const g=new THREE.Group();
  for(const sd of[-1,1]){g.add(box(0.08,0.7,0.9,MAT.wood,sd*0.55,0.35,0));g.add(box(1.18,0.7,0.08,MAT.wood,0,0.35,sd*0.45));}
  for(const y of[0.2,0.55])for(const sd of[-1,1])g.add(box(1.22,0.07,0.05,MAT.post,0,y,sd*0.49));
  const soil=box(1.02,0.1,0.82,std(0x3d2a1a,{roughness:1}),0,0.1,0);g.add(soil);g.userData.soil=soil;
  const scr=new THREE.Group();for(let i=0;i<6;i++)scr.add(mesh(new THREE.SphereGeometry(0.075,6,4),std([0xf2c94c,0x7a5530,0x5aa84a][i%3]),-0.3+(i%3)*0.3,0,-0.18+Math.floor(i/3)*0.34,false));g.add(scr);g.userData.scr=scr;
  g.position.set(S.compost.x,H(S.compost.x,S.compost.z),S.compost.z);scene.add(g);compostMesh=g;}
placeCompostMesh();
const SCRAP_FOODS=new Set(['banana','coconut','papaya','pineapple','lime','fish','grillfish','roastfei','ctaro','ruru','iaota','iaota2','poe','poetaro','aahi','mahi','gaahi','gmahi','faraoa','egg']);
function addScraps(k){if(!SCRAP_FOODS.has(k))return;give({scraps:1},true);if(S.level>=2)once('scrapTip','Meals leave scraps. A compost bin turns them into compost (engrais) for your plants.');}
function fertAct(o){if(!(S.inv.fert>0))return null;const growing=o.g<1;if(!growing&&!(o.cd>0))return null;
  return{label:'Add compost',sub:growing?'1 compost · grows much faster':'1 compost · ready now, +1 at harvest',cls:'alt',fn:()=>fertilise(o)};}
function fertilise(o){if(!(S.inv.fert>0))return;S.inv.fert--;if(o.g<1)o.g=Math.min(1,o.g+0.45);else{o.cd=0;o.fert=1;}stat('fert');chopT=0.3;
  floatText('Composted',_p.set(o.x,H(o.x,o.z)+1.2,o.z));refresh();}
function compostActs(c,A){
  if(S.inv.scraps>0)A.push({label:'Add scraps',sub:`${S.inv.scraps} scrap${S.inv.scraps>1?'s':''} · 3 make 1 compost`,fn:()=>{c.scraps+=S.inv.scraps;S.inv.scraps=0;chopT=0.3;floatText('Into the bin',_p.set(c.x,H(c.x,c.z)+1,c.z));refresh();}});
  if(S.inv.frond>=2)A.push({label:'Add 2 fronds',sub:'green waste · counts as 1 scrap',cls:'alt',fn:()=>{S.inv.frond-=2;c.scraps++;refresh();}});
  if(c.fert>0)A.push({label:'Collect compost',sub:`+${c.fert} compost (engrais)`,fn:()=>{give({fert:c.fert});c.fert=0;showTool(S.inv.pelle>0?'pelle':'none');chopT=0.4;refresh();}});
  if(!A.length)A.push({label:'Compost bin',sub:c.scraps>=3?`Turning… next compost in ${Math.ceil((45-c.t)/(S.inv.pelle>0?2:1))}s`:`${c.scraps}/3 scraps inside`,off:true});}

/* ----- ʻaute flowers, ʻuru bark ----- */
function v6CropExtra(o,A){if(o.cd>0){const f2=fertAct(o);if(f2)A.push(f2);}
  if(o.type==='uru'&&S.level>=5)A.push(o.bcd>0?{label:'Strip bark',sub:`More bark in ${Math.ceil(o.bcd)}s`,cls:'alt',off:true}:{label:'Strip bark',sub:'+1 ʻuru bark for tapa',cls:'alt',fn:()=>{give({bark:1});o.bcd=80;chopT=0.4;floatText('+1 ʻuru bark',_p.set(o.x,H(o.x,o.z)+2,o.z));refresh();}});}
function pickAute(b){give({aute:2});S.bushcd[b.i]=60;chopT=0.3;floatText('+2 ʻaute',_p.set(b.x,H(b.x,b.z)+1.3,b.z));once('auteTip','ʻAute flowers dye cotton fabric into a pāreu (Craft, level 7).');refresh();}

/* ----- tools in hand ----- */
const toolMeshes={};let toolT=0;
(function(){const h=PC.hand,mk=(k,build)=>{const g=new THREE.Group();build(g);g.visible=false;h.add(g);toolMeshes[k]=g;};
  mk('toi',g=>{const hd=cyl(0.022,0.5,MAT.post,0,-0.16,0.06,6);hd.rotation.x=0.35;g.add(hd);g.add(box(0.07,0.16,0.2,MAT.basalt,0,-0.38,0.16));g.add(box(0.08,0.05,0.08,MAT.rope,0,-0.36,0.1));});
  mk('pelle',g=>{g.add(cyl(0.022,0.8,MAT.post,0,-0.3,0,6));g.add(box(0.22,0.26,0.03,MAT.wood,0,-0.78,0));});
  mk('oo',g=>{g.add(cyl(0.02,0.85,MAT.post,0,-0.32,0,5));});
  mk('uke',g=>{const b1=mesh(new THREE.SphereGeometry(0.13,12,8),std(0xb8763a),0,0,0.12);b1.scale.z=0.35;g.add(b1);const b2=mesh(new THREE.SphereGeometry(0.09,12,8),std(0xb8763a),0.1,0.06,0.12);b2.scale.z=0.35;g.add(b2);
    const nk=box(0.36,0.04,0.03,MAT.post,0.33,0.12,0.12);nk.rotation.z=0.35;g.add(nk);g.rotation.set(0,0,-0.6);});
  mk('vivo',g=>{const v=cyl(0.025,0.45,MAT.bambooMat,0,0.08,0.1,6);v.rotation.z=1.1;g.add(v);});})();
function showTool(k){if(k==='toi'&&!(S.inv.toi>0))return;if(k==='pelle'&&!(S.inv.pelle>0))return;if(k==='oo'&&!(S.inv.oo>0))return;
  for(const m of Object.values(toolMeshes))m.visible=false;if(toolMeshes[k]){toolMeshes[k].visible=true;toolT=0.9;}}

/* ----- furniture: table and chairs ----- */
FURN_POS.table=[0.95,-1.5];FURN_POS.chairs=[0.95,-0.82];
(function(){let g=new THREE.Group();g.add(box(1.2,0.07,0.75,MAT.wood,0,Y0+0.74,0));for(const x of[-0.52,0.52])for(const z of[-0.3,0.3])g.add(cyl(0.035,0.72,MAT.post,x,Y0+0.36,z,6));
  g.add(mesh(new THREE.SphereGeometry(0.16,12,6,0,Math.PI*2,Math.PI/2,Math.PI/2),MAT.cup,0.25,Y0+0.92,0));
  [[0xf2c94c,0.2,0.05],[0xf08a2b,0.32,-0.03],[0x8cc63f,0.27,0.08]].forEach(([c,x,z])=>g.add(mesh(new THREE.SphereGeometry(0.07,8,6),std(c),x,Y0+0.88,z)));
  g.add(cyl(0.12,0.02,MAT.white,-0.25,Y0+0.79,0.05,14));
  g.position.set(FURN_POS.table[0],0,FURN_POS.table[1]);furnGroups.table=g;
  g=new THREE.Group();for(const x of[-0.42,0.42]){const c=new THREE.Group();c.position.x=x;c.add(box(0.42,0.05,0.42,MAT.wood,0,Y0+0.45,0));
    for(const a of[-0.17,0.17])for(const b of[-0.17,0.17])c.add(cyl(0.025,0.44,MAT.post,a,Y0+0.22,b,5));c.add(box(0.42,0.5,0.05,MAT.wood,0,Y0+0.72,0.2));g.add(c);}
  g.position.set(FURN_POS.chairs[0],0,FURN_POS.chairs[1]);furnGroups.chairs=g;
  for(const k of['table','chairs']){furnGroups[k].visible=!!S.furn[k];site.add(furnGroups[k]);}
  // porch table for guests
  g=new THREE.Group();g.add(cyl(0.38,0.05,MAT.wood,0,F2+0.66,0,16));g.add(cyl(0.05,0.64,MAT.post,0,F2+0.33,0,6));
  for(const sd of[-1,1]){const c=new THREE.Group();c.position.set(sd*0.65,0,0);c.add(box(0.36,0.05,0.36,MAT.wood,0,F2+0.42,0));for(const a of[-0.14,0.14])for(const b of[-0.14,0.14])c.add(cyl(0.02,0.42,MAT.post,a,F2+0.21,b,5));
    c.add(box(0.05,0.42,0.36,MAT.wood,sd*0.17,F2+0.66,0));g.add(c);}
  g.position.set(0.9,0,2.6);g.visible=false;g2.add(g);amen.ptable=g;})();
AMEN.push('ptable');
let sitting=false;
function sitDown(){const p=furnWorld('chairs');sitting=true;player.position.set(p.x-0.42,0,p.z);player.rotation.y=Math.PI;floatAtPlayer('Ahh…');actSig='';}
function eatAtTable(k){if(!(S.inv[k]>0))return;if(S.hunger>=99){toast('You’re full.');return;}S.inv[k]--;const f=Math.round(ITEMS[k].food*1.25);
  S.hunger=Math.min(100,S.hunger+f);S.flags.warned=0;S.flags.starved=0;addScraps(k);stat('tablemeal');floatAtPlayer(`A meal at the table  +${f}`);refresh();}

/* ----- decorations: tapa, pāreu, tīfaifai ----- */
MAT.tapa=new THREE.MeshStandardMaterial({roughness:1,side:THREE.DoubleSide,map:canvasTex(g=>{g.fillStyle='#c79a62';g.fillRect(0,0,128,128);g.strokeStyle='#3d2a1a';g.fillStyle='#3d2a1a';
  g.lineWidth=3;g.strokeRect(6,6,116,116);g.lineWidth=2;for(let i=0;i<4;i++){g.beginPath();g.moveTo(6,26+i*26);g.lineTo(122,26+i*26);g.stroke();}
  for(let r=0;r<4;r++)for(let c=0;c<7;c++){const x=12+c*16,y=13+r*26;if((r+c)%2){g.beginPath();g.moveTo(x,y-6);g.lineTo(x+6,y+6);g.lineTo(x-6,y+6);g.closePath();g.fill();}else{g.fillRect(x-4,y-1,8,3);}}},1,1)});
MAT.tifai=new THREE.MeshStandardMaterial({roughness:0.9,side:THREE.DoubleSide,map:canvasTex(g=>{g.fillStyle='#2fb3b0';g.fillRect(0,0,128,128);g.fillStyle='#fbf3e2';
  for(let i=0;i<8;i++){g.save();g.translate(64,64);g.rotate(i*Math.PI/4);g.beginPath();g.ellipse(0,-30,9,24,0,0,Math.PI*2);g.fill();g.restore();}
  g.fillStyle='#2fb3b0';g.beginPath();g.arc(64,64,10,0,Math.PI*2);g.fill();g.strokeStyle='#fbf3e2';g.lineWidth=4;g.strokeRect(4,4,120,120);},1,1)});
const DECOR={
 tapa:{item:'tapa',where:'fare',n:'Tapa on the back wall',need:()=>S.stage>=4},
 pareu:{item:'pareu',where:'fare',n:'Pāreu curtains at the door',need:()=>S.stage>=4},
 tifai:{item:'tifai',where:'fare',n:'Tīfaifai on the side wall',need:()=>S.stage>=4},
 g2tifai:{item:'tifai',where:'g2',n:'Tīfaifai on the guest porch',t:'counts as a comfort for guests',need:()=>S.g2>=3},
 g2pareu:{item:'pareu',where:'g2',n:'Pāreu curtains on the guest door',t:'guests rate you a little higher',need:()=>S.g2>=3},
 g2tapa:{item:'tapa',where:'g2',n:'Tapa in the guest room',t:'guests rate you a little higher',need:()=>S.g2>=3}
};
const decorMesh={};
(function(){const pl=(w,h,mat)=>new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  let m=pl(1.5,1.05,MAT.tapa);m.position.set(0.55,Y0+1.6,-2.22);site.add(m);decorMesh.tapa=m;
  let g=new THREE.Group();for(const sd of[-1,1]){const c=pl(0.36,2.0,MAT.pareuViolet);c.position.set(sd*0.44,Y0+1.08,2.2);c.rotation.y=sd*0.15;g.add(c);}site.add(g);decorMesh.pareu=g;
  m=pl(1.4,1.15,MAT.tifai);m.position.set(-2.72,Y0+1.5,0.75);m.rotation.y=Math.PI/2;site.add(m);decorMesh.tifai=m;
  g=new THREE.Group();for(const sd of[-1,1]){const c=pl(0.34,1.8,MAT.pareuViolet);c.position.set(sd*0.45,F2+0.95,1.79);c.rotation.y=-sd*0.15;g.add(c);}g2.add(g);decorMesh.g2pareu=g;
  m=pl(1.2,0.8,MAT.tapa);m.position.set(1.2,F2+1.5,1.68);m.rotation.y=Math.PI;g2.add(m);decorMesh.g2tapa=m;})();
function decorCount(where){return Object.keys(DECOR).filter(k=>DECOR[k].where===where&&S.decor[k]).length;}
function decorItemsIn(where){return Object.keys(DECOR).some(k=>DECOR[k].where===where&&!S.decor[k]&&S.inv[DECOR[k].item]>0);}
let decorWhere='fare';

/* ----- wearing necklaces and the pāreu ----- */
const neckMeshes={};
(function(){const nk=PC.neck,beadRing=(k,n,make)=>{const g=new THREE.Group();g.position.z=0.02;
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=Math.cos(a)*0.17,z=Math.sin(a)*0.13,y=-Math.max(0,Math.sin(a))*0.1;const b=make();b.position.set(x,y,z);b.rotation.y=-a;g.add(b);}
    g.visible=false;nk.add(g);neckMeshes[k]=g;};
  beadRing('heipupu',14,()=>{const m=new THREE.Mesh(SHELL_GEO.pupu,SHELL_MAT.pupu);m.scale.setScalar(0.45);m.rotation.z=Math.PI;return m;});
  beadRing('heiporeho',11,()=>{const m=new THREE.Mesh(SHELL_GEO.poreho,SHELL_MAT.poreho);m.scale.set(0.38,0.3,0.5);return m;});
  const g=new THREE.Group();const cord=new THREE.Mesh(new THREE.TorusGeometry(0.16,0.006,4,28),std(0x3d2a1a));cord.rotation.x=Math.PI/2+0.5;cord.position.set(0,-0.04,0.03);g.add(cord);
  const pd=new THREE.Mesh(SHELL_GEO.parau,SHELL_MAT.parau);pd.scale.setScalar(0.55);pd.rotation.x=Math.PI/2-0.3;pd.position.set(0,-0.13,0.16);g.add(pd);g.visible=false;nk.add(g);neckMeshes.heiparau=g;})();
function applyWear(){for(const k in neckMeshes)neckMeshes[k].visible=S.wear===k;
  PC.group.traverse(m=>{if(m.material===PC.bottomMat||m.material===MAT.pareuViolet)m.material=S.wearPareu?MAT.pareuViolet:PC.bottomMat;});}
applyWear();
function wearItem(k){if(!(S.inv[k]>0))return;
  if(k==='taupoo'){if(S.wearHat){toast('You’re already wearing your taupoʻo.');return;}S.inv.taupoo--;S.wearHat=true;applyHat();floatAtPlayer('Looking good!');refresh();return;}
  if(k==='pareu'){if(S.wearPareu){toast('You’re already wearing your pāreu.');return;}S.inv.pareu--;S.wearPareu=true;}
  else{if(S.wear)S.inv[S.wear]=(S.inv[S.wear]||0)+1;S.inv[k]--;S.wear=k;}
  applyWear();floatAtPlayer('Looking good!');refresh();}
function takeOff(k){if(k==='taupoo'){if(S.wearHat){S.wearHat=false;S.inv.taupoo=(S.inv.taupoo||0)+1;applyHat();refresh();}return;}if(k==='pareu'&&S.wearPareu){S.wearPareu=false;S.inv.pareu++;}else if(S.wear===k){S.wear=null;S.inv[k]++;}applyWear();refresh();}
function wornHtml(){const w=[];if(S.wear)w.push(S.wear);if(S.wearPareu)w.push('pareu');if(S.wearHat)w.push('taupoo');if(!w.length)return'';
  return `<div class="sec">Wearing</div>`+w.map(k=>`<div class="recipe"><div class="rinfo"><div class="name">${ICON[k]} ${ITEMS[k].n}</div></div><button data-off="${k}">Take off</button></div>`).join('');}
$('#sheetBody').addEventListener('click',e=>{const b=e.target.closest('[data-off]');if(b){takeOff(b.dataset.off);}});

/* ----- music ----- */
let AC=null,master=null,noiseB=null;const pluckCache={};
function audio(){try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();master=AC.createGain();master.gain.value=0.6;
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;master.connect(lp);lp.connect(AC.destination);
  noiseB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  if(AC.state==='suspended')AC.resume();return AC;}catch(e){return null;}}
function pluck(f,delay,vol){const sr=AC.sampleRate,key=Math.round(f);let buf=pluckCache[key];
  if(!buf){const len=Math.floor(sr*1.8),N=Math.max(2,Math.round(sr/f));buf=AC.createBuffer(1,len,sr);const d=buf.getChannelData(0);
    for(let i=0;i<N;i++)d[i]=(Math.random()*2-1)*0.8;for(let i=N;i<len;i++)d[i]=0.4985*(d[i-N]+d[i-N+1]);pluckCache[key]=buf;}
  const s=AC.createBufferSource(),g=AC.createGain();s.buffer=buf;g.gain.value=vol||0.5;s.connect(g);g.connect(master);s.start(AC.currentTime+(delay||0));}
function flute(f){const t=AC.currentTime,o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),g2=AC.createGain(),lfo=AC.createOscillator(),lg=AC.createGain();
  o.type='sine';o.frequency.value=f;o2.type='sine';o2.frequency.value=f*2;g2.gain.value=0.06;lfo.frequency.value=4.8;lg.gain.value=f*0.01;lfo.connect(lg);lg.connect(o.frequency);
  o.connect(g);o2.connect(g2);g2.connect(g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.3,t+0.1);g.gain.setValueAtTime(0.3,t+0.45);g.gain.exponentialRampToValueAtTime(0.001,t+1.3);g.connect(master);
  const n=AC.createBufferSource();n.buffer=noiseB;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*2;bp.Q.value=2.5;const ng=AC.createGain();ng.gain.setValueAtTime(0.06,t);ng.gain.exponentialRampToValueAtTime(0.001,t+0.5);
  n.connect(bp);bp.connect(ng);ng.connect(master);[o,o2,lfo].forEach(x=>{x.start(t);x.stop(t+1.4);});n.start(t);n.stop(t+0.6);}
function wood(freq,dur,vol,delay){const t=AC.currentTime+(delay||0),n=AC.createBufferSource();n.buffer=noiseB;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=freq;bp.Q.value=7;
  const g=AC.createGain();g.gain.setValueAtTime(vol*3,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);n.connect(bp);bp.connect(g);g.connect(master);n.start(t);n.stop(t+dur+0.05);
  const o=AC.createOscillator();o.type='triangle';o.frequency.setValueAtTime(freq*0.55,t);o.frequency.exponentialRampToValueAtTime(freq*0.35,t+dur);const og=AC.createGain();og.gain.setValueAtTime(vol*0.7,t);og.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(og);og.connect(master);o.start(t);o.stop(t+dur+0.05);}
const PADS={
 vivo:[['G',196],['A',220],['C',262],['D',294],['E',330],['G',392]],
 uke:[['C',[196,262,330,392]],['F',[220,262,349,440]],['G',[196,247,294,392]],['Am',[220,262,330,440]],['C',262],['D',294],['E',330],['G',392]],
 toere:[['Tō · low',0],['Ke · edge',1],['Rā · roll',2]],
 ihara:[['Pa',0],['Pa-pa',1]]
};
let musicInst=null,musicNotes=0,musicLast=-99;
function instruments(){return['vivo','ihara','toere','uke'].filter(k=>S.inv[k]>0);}
function openMusic(k){musicInst=k||instruments()[0];if(!musicInst){toast('Make an instrument first (Craft).');return;}openSheet('music');}
function playPad(i){if(!audio())return;const p=PADS[musicInst][i];if(!p)return;
  if(musicInst==='vivo')flute(p[1]);
  else if(musicInst==='uke'){if(Array.isArray(p[1]))p[1].forEach((f,j)=>pluck(f,j*0.018,0.32));else pluck(p[1],0,0.55);}
  else if(musicInst==='toere'){if(p[1]===0)wood(300,0.3,0.9);else if(p[1]===1)wood(520,0.18,0.7);else for(let j=0;j<5;j++)wood(j%2?520:340,0.14,0.6,j*0.075);}
  else{wood(820,0.07,0.6);if(p[1]===1)wood(820,0.07,0.55,0.13);}
  musicNotes++;musicLast=clock.elapsedTime;if(musicNotes%2===0)floatText('♪',_p.set(player.position.x+(Math.random()-0.5)*0.6,player.position.y+2.3,player.position.z));stat('notes');}
$('#sheetBody').addEventListener('pointerdown',e=>{const b=e.target.closest('[data-note]');if(!b)return;e.preventDefault();b.classList.add('hit');setTimeout(()=>b.classList.remove('hit'),120);playPad(+b.dataset.note);});

/* ----- sheets: decorate, music ----- */
function v6Sheet(mode){let html='';
  if(mode==='music'){$('#sheetTitle').textContent='Play music';const own=instruments();if(!own.includes(musicInst))musicInst=own[0];
    html+=`<div class="tabs">${own.map(k=>`<button class="tab${k===musicInst?' on':''}" data-inst="${k}">${ICON[k]}<span>${ITEMS[k].n}</span></button>`).join('')}</div>`;
    if(musicInst)html+=`<div class="pads pads-${musicInst}">${PADS[musicInst].map((p,i)=>`<button class="pad${Array.isArray(p[1])?' chord':''}" data-note="${i}">${p[0]}</button>`).join('')}</div>`;
    html+=`<p class="small-note">Play near your guests in the evening and they’ll remember it. Manu sings along.</p>`;}
  else{$('#sheetTitle').textContent=decorWhere==='fare'?'Decorate your fare':'Decorate the guest fare';
    html+=Object.keys(DECOR).filter(k=>DECOR[k].where===decorWhere).map(k=>{const d=DECOR[k],on=!!S.decor[k],have=S.inv[d.item]||0,ok=d.need();
      return `<div class="recipe"><div class="rinfo"><div class="name">${ICON[d.item]} ${d.n}</div><div class="tah">${on?'Hanging now':ok?(have?`You have ${have}`:`Make a ${nm(d.item)} first`):'Build the walls first'}${d.t?' · '+d.t:''}</div></div>${on?`<button data-dtake="${k}">Take down</button>`:`<button data-dput="${k}" ${have&&ok?'':'disabled'}>Hang it</button>`}</div>`;}).join('');}
  return html;}
function v6Click(b){
  if(b.dataset.inst){musicInst=b.dataset.inst;renderSheet();return;}
  if(b.dataset.dput){const k=b.dataset.dput,d=DECOR[k];if(!(S.inv[d.item]>0)||!d.need())return;S.inv[d.item]--;S.decor[k]=true;stat('decor');toast('Hung up. It looks lovely.');refresh();}
  else if(b.dataset.dtake){const k=b.dataset.dtake;S.decor[k]=false;give({[DECOR[k].item]:1},true);refresh();}}

/* ----- interaction hooks ----- */
const V6T={shell:1,honu:1,bush:1,compost:1,ahimaa:1,store:1};
function v6Candidates(out,px,pz,add){
  for(const sh of S.shells)add('shell',sh,sh.x,sh.z,0);
  for(const h of honus)if(H(h.x,h.z)>-1.2)add('honu',h,h.x,h.z,0.4);
  for(const b of bushes)add('bush',b,b.x,b.z,0.7);
  if(S.compost)add('compost',S.compost,S.compost.x,S.compost.z,0.5);
  if(S.ahimaa)add('ahimaa',S.ahimaa,S.ahimaa.x,S.ahimaa.z,0.6);
  if(S.store){const f=storeFront();add('store',S.store,f.x,f.z,0.6);}
  v9Candidates(add);v10Candidates(add);}
function v6Actions(t,o,A){
  if(t==='shell')A.push({label:`Pick up a ${ITEMS[o.t].n}`,sub:ITEMS[o.t].t,fn:()=>pickShell(o)});
  else if(t==='honu')A.push({label:'Watch the honu',sub:'Protected: look, never touch',cls:'alt',fn:()=>watchHonu(o)});
  else if(t==='bush'){const cd=S.bushcd[o.i]||0;A.push(cd>0?{label:'ʻAute bush',sub:`New flowers in ${Math.ceil(cd)}s`,off:true}:{label:'Pick ʻaute flowers',sub:'+2 hibiscus flowers · a dye for pāreu',fn:()=>pickAute(o)});}
  else if(t==='compost')compostActs(o,A);
  else if(t==='ahimaa')ahimaaActs(o,A);
  else if(t==='store')A.push({label:'Stock the store',sub:`${storeCount()} things on the shelves`,fn:()=>openSheet('store')});}
function v6BoatActions(A){const px=player.position.x,pz=player.position.z;
  const h=honus.find(h=>dist(h.x,h.z,px,pz)<4.5);if(h)A.push({label:'Watch the honu',sub:'Protected: look, never touch',cls:'alt',fn:()=>watchHonu(h)});
  v7BoatActions(A);
  if(nearDolphins())A.push({label:'Watch the dolphins',sub:'They’re racing your vaʻa',cls:'alt',fn:()=>{stat('dolphin');floatAtPlayer('♥');manuSay(MANU_LINES.dolphin[0],4);refresh();}});}
function v6Extra(A,tg){v7Extra(A,tg);if(S.boat)return;const px=player.position.x,pz=player.position.z,inside=onFloor(px,pz);
  if(S.stage>=5&&S.dmg.fare>0&&(inside||fareDist(px,pz)<2.2))A.unshift(repairAct('fare'));
  if(S.g2>=3&&S.dmg.g2>0&&g2Dist(px,pz)<2.2)A.unshift(repairAct('g2'));
  if(inside&&S.stage>=4&&(decorItemsIn('fare')||decorCount('fare')))A.push({label:'Decorate',sub:'Tapa, pāreu or tīfaifai',cls:'alt',fn:()=>{decorWhere='fare';openSheet('decor');}});
  if(tg&&tg.type==='gfare'&&(decorItemsIn('g2')||decorCount('g2')))A.push({label:'Decorate',sub:'The guest fare',cls:'alt',fn:()=>{decorWhere='g2';openSheet('decor');}});
  if(instruments().length&&S.npcs.some(n=>n.role==='guest'&&n.state!=='leave'&&dist(n.x,n.z,px,pz)<9))A.push({label:'Play music',sub:'For your guests',cls:'alt',fn:()=>openMusic()});}
function v6Rating(n){const shell=['heipupu','heiporeho','heiparau'].some(k=>n.served.includes(k));
  return(shell?0.4:0)+(n.music?0.3:0)+(n.excOK?0.6:0)+(n.served.includes('maa')?0.3:0)+(S.decor.g2pareu?0.15:0)+(S.decor.g2tapa?0.15:0)-S.dmg.g2*2;}

/* ----- simulation (also runs while sleeping) ----- */
function v6Sim(dt){
  const c=S.compost;if(c&&c.scraps>=3&&c.fert<9){c.t+=dt*(S.inv.pelle>0?2:1);if(c.t>=45){c.t=0;c.scraps-=3;c.fert++;}}
  for(const cr of S.crops)if(cr.bcd>0)cr.bcd-=dt;
  for(let i=0;i<bushes.length;i++)if(S.bushcd[i]>0)S.bushcd[i]-=dt;}

/* ----- per-frame update ----- */
let v6Lab='',seaToastStorm=0;
function updateV6(dt,t,moving,paused){
  const day=dayAmt(),cl=S.weather.c;
  starU.uTime.value=t;starU.uOp.value=(1-day)*(1-cl*0.95);skyStars.forEach(s=>{s.position.copy(camera.position);s.visible=starU.uOp.value>0.01;});
  sky.material.uniforms.uNight.value=(1-day)*(1-cl*0.85);{const a=(S.tod-0.25)*Math.PI*2;sky.material.uniforms.uMoon.value.set(-Math.cos(a),Math.max(-Math.sin(a),0)*0.7+0.06,0.4).normalize();}
  if(!paused&&day<0.2&&cl<0.55){shootT-=dt;if(shootT<=0){shootT=7+Math.random()*16;launchShooter();}}
  updateShooters(dt);updateLeaves(dt,t);
  if(!paused){
    if(!TOR.on&&S.level>=2&&stormy()&&Math.random()<dt/55)startTornado();
    updateTornado(dt,t);
    if(stormy()){stormT+=dt;if(stormT>20){stormT=0;for(const w of['fare','g2'])if(Math.random()<0.3*(S.lashed?0.35:1))damageRoof(w,0.25,'The storm tore off some thatch.');}}
    shellT-=dt;if(shellT<=0){shellT=16+Math.random()*10;if(S.shells.length<12)addShell();}
  }
  const lab=wxLabel()[1];if(lab!==v6Lab){if(v6Lab&&lab==='Windy')manuSay(MANU_LINES.wind[0],4);v6Lab=lab;}
  const nf=Math.round(S.dmg.fare*4),ng=Math.round(S.dmg.g2*4),roofOn=S.stage>=5&&stageGroups[4].visible;
  fareHoles.forEach((h,i)=>{h.visible=roofOn&&i<nf;});g2Holes.forEach((h,i)=>{h.visible=S.g2>=3&&i<ng;});
  debris.forEach((d,i)=>{d.visible=S.stage>=5&&i<nf;if(d.visible)d.position.y=Math.max(H(d.position.x,d.position.z),0)+0.06;});
  fareRopes.forEach(r=>{r.visible=S.lashed&&roofOn;});g2Ropes.forEach(r=>{r.visible=S.lashed&&S.g2>=3;});
  for(const sh of S.shells){const sp=sh.mesh.userData.sp,k=Math.max(0,Math.sin(t*2.2+sh.mesh.userData.ph));sp.scale.setScalar(0.08+0.32*k*k*k);}
  updateCrabs(dt,t);updateHonus(dt,t);updateDolphins(dt,t);updateFlocks(dt,t);
  if(compostMesh){const c=S.compost,u=compostMesh.userData;u.soil.position.y=0.1+Math.min(0.45,c.fert*0.05);u.scr.visible=c.scraps>0;u.scr.position.y=u.soil.position.y+0.07;}
  bushes.forEach(b=>{const on=!((S.bushcd[b.i]||0)>0);for(let i=1;i<b.g.children.length;i++)b.g.children[i].visible=on;});
  for(const k in decorMesh)decorMesh[k].visible=!!S.decor[k]&&(k.startsWith('g2')?S.g2>=3:S.stage>=4);
  if(toolT>0){toolT-=dt;if(toolT<=0)for(const m of Object.values(toolMeshes))m.visible=false;}
  if(sheetMode==='music'&&(musicInst==='uke'||musicInst==='vivo')){for(const k in toolMeshes)toolMeshes[k].visible=k===musicInst;arms[1].rotation.x=-0.9;arms[0].rotation.x=-0.6;}
  else if(toolT<=0)for(const k of['uke','vivo'])toolMeshes[k].visible=false;
  if(sitting){if(moving||!onFloor(player.position.x,player.position.z))sitting=false;
    else{player.position.y=Y0-0.12;legs[0].rotation.x=legs[1].rotation.x=-1.5;arms[0].rotation.x=arms[1].rotation.x=-0.5;}}
  if(t-musicLast<3&&musicNotes>=4){
    for(const n of S.npcs)if(n.role==='guest'&&n.state!=='leave'&&!n.music&&dist(n.x,n.z,player.position.x,player.position.z)<10){n.music=true;stat('musicguest');floatText('♪ ♥',_p.set(n.x,2.6,n.z));}
    if(Math.random()<dt*0.8)floatText('♪',_p.set(manu.pos.x,manu.pos.y+0.3,manu.pos.z));
    if(!S.flags.musicSaid){S.flags.musicSaid=1;manuSay(MANU_LINES.music[0],3);}
    for(const a of S.animals)if(a.tamed&&Math.random()<dt*0.4&&dist(a.x,a.z,player.position.x,player.position.z)<8)hearts(a);}
  if(t-musicLast>6)musicNotes=0;
  if(canoeMesh&&!canoeMesh.userData.sailG){const sg=new THREE.Group();sg.add(cyl(0.04,2.6,MAT.post,0,1.5,0.2,6));
    const sh=new THREE.Shape();sh.moveTo(0,0.45);sh.lineTo(0,2.6);sh.lineTo(1.25,0.55);sh.lineTo(0,0.45);const sail=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshStandardMaterial({map:MAT.weave.map,roughness:1,side:THREE.DoubleSide}));
    sail.position.set(0,0,0.2);sail.rotation.y=-Math.PI/2;sail.castShadow=true;sg.add(sail);canoeMesh.add(sg);canoeMesh.userData.sailG=sg;canoeMesh.userData.sail=sail;}
  if(canoeMesh){canoeMesh.userData.sailG.visible=S.sail;canoeMesh.userData.sail.rotation.y=-Math.PI/2+0.95+Math.sin(t*0.8)*0.08+S.weather.w*0.25;}
  if(S.boat&&outsideReef()){if(!S.flags.seaSaid){S.flags.seaSaid=1;toast('You sailed out through the pass! Look for seabirds diving: aʻahi and mahi mahi feed below.');manuSay(MANU_LINES.sea[0],4);}
    if(stormy()&&seaToastStorm!==S.day){seaToastStorm=S.day;toast('Rough seas! Sail back through the pass.');}}
}

/* =========================================================
   v7: look creator, craft tabs, smart Manu, ahimaʻa, excursions,
   whales, star lesson, phone, newspaper, store
   ========================================================= */
const {CRAFT_CATS,EXCURSIONS:EXC,STARS,NEWS}=window.FARE_DATA;
let phoneOrder=false,craftTab=null,lookOpen=false,blinkT=3,blinkOn=0,v7T=0,excSig='',storeT=20;

/* ----- never get stuck inside something you just built ----- */
function unstick(){if(S.boat||sitting)return;const px=player.position.x,pz=player.position.z;if(walkable(px,pz))return;
  for(let r=0.5;r<9;r+=0.5)for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=px+Math.cos(a)*r,z=pz+Math.sin(a)*r;if(walkable(x,z)){player.position.x=x;player.position.z=z;return;}}}

/* ----- character creator ----- */
function buildPlayer(){const np=makeCharacter(lookOpts());player.remove(PC.group);player.add(np.group);
  legs.length=0;legs.push(...np.legs);arms.length=0;arms.push(...np.arms);Object.assign(PC,np);
  for(const m of Object.values(toolMeshes))PC.hand.add(m);for(const k in neckMeshes)PC.neck.add(neckMeshes[k]);applyWear();applyHat();}
if(S.look.set||S.look.type!=='woman'||S.look.skin!==3)buildPlayer();
function hex(c){return'#'+c.toString(16).padStart(6,'0');}
function openLook(){lookOpen=true;document.body.classList.add('looking');$('#look').hidden=false;openSheet(null);renderLook();}
function renderLook(){const L=S.look;
  const chips=(key,opts)=>`<div class="opts">${opts.map(([v,n])=>`<button class="opt${L[key]===v?' on':''}" data-lk="${key}" data-v="${v}">${n}</button>`).join('')}</div>`;
  const sw=(key,cols)=>`<div class="swatches">${cols.map((c,i)=>`<button class="swatch${L[key]===i?' on':''}" data-lk="${key}" data-v="${i}" style="--c:${typeof c==='number'?hex(c):c[0]};--b:${typeof c==='number'?hex(c):c[1]}" aria-label="Colour ${i+1}"><span></span></button>`).join('')}</div>`;
  const row=(label,inner)=>`<div class="lrow"><span class="ll">${label}</span><div>${inner}</div></div>`;
  $('#lookBody').innerHTML=
    row('Person',chips('type',[['woman','Woman'],['man','Man'],['other','Other']]))+
    row('Body',chips('build',[[0,'Slim'],[1,'Medium'],[2,'Strong']]))+
    row('Skin',sw('skin',LOOK.skins))+
    row('Hair',chips('hairStyle',[['short','Short'],['long','Long'],['bun','Bun'],['longbun','Long + bun'],['curly','Curly']])+sw('hairCol',LOOK.hair))+
    row('Eyes',sw('eyes',LOOK.eyes))+
    row('Pāreu',chips('bottom',[['skirt','Skirt'],['shorts','Shorts']])+sw('pcol',LOOK.pareu))+
    row('Top',chips('top',[['tank','Tank top'],['tshirt','T-shirt']])+sw('tcol',LOOK.tops))+
    row('Extras',`<div class="opts"><button class="opt${L.flower?' on':''}" data-lk="flower" data-v="toggle">Tiare behind the ear</button><button class="opt${L.beard?' on':''}" data-lk="beard" data-v="toggle">Beard</button></div>`);}
$('#lookBody').addEventListener('click',e=>{const b=e.target.closest('[data-lk]');if(!b)return;const k=b.dataset.lk,L=S.look;let v=b.dataset.v;
  if(v==='toggle')L[k]=!L[k];else if(k==='type'){L.type=v;Object.assign(L,LOOK.defaults[v]);}else L[k]=/^\d+$/.test(v)?+v:v;
  buildPlayer();renderLook();});
$('#lookBtn').onclick=()=>{$('#menu').hidden=true;openLook();};
$('#lookDone').onclick=()=>{S.look.set=true;lookOpen=false;document.body.classList.remove('looking');$('#look').hidden=true;save();manuSay('Ia ora na! You look wonderful.',4);};

/* ----- craft menu with category tabs ----- */
function craftSheet(){$('#sheetTitle').textContent='Craft';
  const ready=r=>{const c=recipeCheck(r);return c.ok&&hasAll(r.in);};
  if(!craftTab){const f=CRAFT_CATS.find(([k])=>RECIPES.some(r=>r.cat===k&&ready(r)));craftTab=f?f[0]:'mat';}
  let html=`<div class="ctabs">${CRAFT_CATS.map(([k,n,ic])=>{const cnt=RECIPES.filter(r=>r.cat===k&&ready(r)).length;
    return `<button class="ctab${k===craftTab?' on':''}" data-ctab="${k}">${ICON[ic]}<span>${n}</span>${cnt?`<b>${cnt}</b>`:''}</button>`;}).join('')}</div>`;
  const list=RECIPES.filter(r=>r.cat===craftTab).slice().sort((a,b)=>a.lv-b.lv);
  html+='<div class="tree">'+list.map(r=>{const c=recipeCheck(r),locked=r.lv>S.level,ik=r.place||r.furn||r.special||(r.gbed&&'gbed'),
      out=ik?ICON[ik]:Object.entries(r.out).map(([k,v])=>`${ICON[k]}${v}`).join(' '),ok=c.ok&&hasAll(r.in);
    return `<div class="recipe node${locked?' locked':ok?' ready':''}"><span class="lvchip">Lv ${r.lv}</span><div class="rinfo"><div class="name">${r.n}</div>${r.t?`<div class="tah">${r.t}</div>`:''}<div class="flow">${flowHtml(r.in,out)}${r.tool?` <span class="plus">· tool</span> ${ICON[r.tool]}`:''}</div>${c.why&&!locked?`<div class="why">${c.why}</div>`:''}${locked?`<div class="why muted">Unlocks at level ${r.lv}</div>`:''}</div>${locked?'':`<button data-id="${r.id}" ${ok?'':'disabled'}>${ik?'Build':'Craft'}</button>`}</div>`;}).join('')+'</div>';
  return html;}

/* ----- Manu: tap the bird, get a precise clue ----- */
const HOW={stone:['rock','Break the dark basalt rocks for stone.'],log:['palm','Chop down a palm for logs.'],coconut:['palm','Shake a coconut palm.'],frond:['palm','Shake a palm for fronds.'],
  plank:[null,'Saw logs into planks (Craft · Materials).'],rope:[null,'Twist coconuts into rope (Craft · Materials).'],thatch:[null,'Weave fronds into thatch (Craft · Materials).'],
  bamboo:['bamboo','Cut canes in the bamboo grove.'],strips:[null,'Split bamboo into strips (Craft · Materials).'],water:['spring','Fill coconut cups at the spring.'],
  tiare:[null,'Pick flowers from a tiare bush.'],oil:[null,'Press coconut oil (Craft · Materials).'],fish:['beach','Catch fish from your vaʻa or with a fish trap.'],
  pupu:['shells','Pick up shells on the beach.'],poreho:['shells','Look for cowries on the beach.'],parau:['shells','Pārau are rare. Keep looking on the beach.'],
  aute:['bush','Pick ʻaute flowers from the red hibiscus bushes.'],bark:['uru','Strip bark from your ʻuru tree.'],ahu:['dock','Buy cotton fabric from the goélette.'],
  thread:['dock','Buy thread from the goélette.'],strings:['dock','Buy ukulele strings from the goélette.'],fei:['mountain','Cut fei on the mountain slopes.'],
  taro:['spring','Pull taro by the spring.'],banana:[null,'Cut a banana bunch.'],ipu:[null,'Carve coconut cups (Craft · Tools).'],vanilla:[null,'Pick a pod from your vanilla vine.'],
  monoi:[null,'Make monoʻi from coconut oil and tiare (Craft · Crafts).'],flour:['dock','Buy flour from the goélette.']};
const GOAL_RECIPE={shellhei:'heipupu'};
const MASS=new Set(['stone','thatch','bamboo','fish','water','oil','pupu','poreho','parau','aute','bark','flour','rice','sugar','coffee','fei','taro','uru']);
function plural(k,n){const w=nm(k);return n>1&&!MASS.has(k)&&!/s$/.test(w)?w.replace(/^(\S+)/,m=>m+'s'):w;}
function sayMissing(title,need,done){const miss=Object.entries(need).filter(([k,v])=>(S.inv[k]||0)<v).map(([k,v])=>[k,v-(S.inv[k]||0)]);
  if(!miss.length){manuSay(`You have everything for the ${title}! ${done[1]}`,7);return done[0];}
  const how=HOW[miss[0][0]]||[null,''];manuSay(`For the ${title} you still need ${miss.map(([k,n])=>`${n} ${plural(k,n)}`).join(', ')}. ${how[1]}`,9);return how[0];}
function guideTo(where){if(!where||where==='none')return;let p=where==='whale'?whales.reduce((b,w)=>!b||dist(w.x,w.z,player.position.x,player.position.z)<dist(b.x,b.z,player.position.x,player.position.z)?w:b,null):locateHint(where);
  if(p&&!S.boat&&dist(p.x,p.z,player.position.x,player.position.z)>4){manu.state='guide';manu.guide={x:p.x,z:p.z,t:9};}}
function smartHint(){
  if(manu.state==='sleep')manu.state='follow';
  if(S.excursion&&!S.excursion.done){const E=EXC[S.excursion.type];manuSay(E.t.replace('{n}',S.excursion.name),8);guideTo(E.where);return;}
  if(S.level>LEVELS.length){manuSay(MANU_LINES.done[0],5);return;}
  const L=LEVELS[S.level-1],i=L.goals.findIndex(g=>!goalDone(g));if(i<0)return;const g=L.goals[i];let where=null;
  if(g.house&&S.stage<STAGES.length){const st=STAGES[S.stage];where=sayMissing(st.n.toLowerCase(),st.need,['site','Walk to the roped-off fare site and build it.']);}
  else if(S.level===7&&i===0&&S.g2<3){const st=GSTAGES[S.g2];where=sayMissing(`guest fare ${st.n.toLowerCase()}`,st.need,['site2','Walk to the guest fare spot by the beach.']);}
  else{const rid=GOAL_RECIPE[g.k]||g.k,r=g.k&&RECIPES.find(x=>x.id===rid&&x.out);
    if(r&&r.lv<=S.level){if(r.tool&&!(S.inv[r.tool]>0))manuSay(`First make a ${nm(r.tool)} (Craft · Tools).`,7);
      else where=sayMissing(r.n.replace(/^(Make|Beat|Dye|Sew|String|Carve|Build|Weave|Press|Split|Saw|Twist) (a |an |the )?/i,''),r.in,[null,`Open Craft, tab ${CRAFT_CATS.find(c=>c[0]===r.cat)[1]}, and make it.`]);}
    else{const[w,text]=(HINTS[S.level-1]||[])[i]||['none',g.t];manuSay(text,8);where=w;}}
  guideTo(where);}
(function tapManu(){const el=renderer.domElement,rc=new THREE.Raycaster(),v=new THREE.Vector2();let st=null;
  el.addEventListener('pointerdown',e=>{st={x:e.clientX,y:e.clientY,t:performance.now()};});
  el.addEventListener('pointerup',e=>{if(!st)return;const moved=Math.hypot(e.clientX-st.x,e.clientY-st.y),d=performance.now()-st.t;st=null;if(moved>12||d>500)return;
    const r=el.getBoundingClientRect();v.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);rc.setFromCamera(v,camera);
    if(rc.ray.distanceToPoint(manu.pos)<0.7)smartHint();});})();

/* ----- ahimaʻa (earth oven) ----- */
const AHI_IN={fei:'roastfei',taro:'ctaro',uru:'ruru',fish:'grillfish',aahi:'gaahi',mahi:'gmahi'};
const smokeMat=new THREE.SpriteMaterial({map:(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(220,220,215,.8)');gr.addColorStop(1,'rgba(220,220,215,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})(),transparent:true,depthWrite:false,opacity:0.55});
let ahimaaMesh=null;
function placeAhimaaMesh(){if(!S.ahimaa)return;const g=new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.95,0.8,0.12,18),std(0x3d2a1a,{roughness:1}),0,0.03,0,false));
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,st=mesh(rockGeo,MAT.basalt,Math.cos(a)*1.05,0.08,Math.sin(a)*1.05);st.scale.setScalar(0.2);st.rotation.set(i,i*2,i);g.add(st);}
  const mound=mesh(new THREE.SphereGeometry(0.95,16,8,0,Math.PI*2,0,Math.PI/2),MAT.leafBanana,0,0,0);mound.scale.y=0.42;g.add(mound);
  const food=new THREE.Group();for(let i=0;i<6;i++)food.add(mesh(new THREE.SphereGeometry(0.13,8,6),std([0xd9601e,0x8c6a7a,0x9cc23f,0x4aa7c9][i%4]),Math.cos(i)*0.45,0.12,Math.sin(i)*0.45,false));g.add(food);
  const smoke=[];for(let i=0;i<5;i++){const sp=new THREE.Sprite(smokeMat);sp.scale.setScalar(0.7);g.add(sp);smoke.push(sp);}
  g.position.set(S.ahimaa.x,H(S.ahimaa.x,S.ahimaa.z),S.ahimaa.z);scene.add(g);ahimaaMesh={g,mound,food,smoke};}
placeAhimaaMesh();
function ahimaaActs(a,A){
  if(a.state==='cooking')A.push({label:'Cooking under the earth',sub:`Ready in ${Math.ceil(a.t)}s`,off:true});
  else if(a.state==='done')A.push({label:'Open the ahimaʻa',sub:`${a.load.length} foods${a.load.length>=4?' · a feast!':''}`,fn:()=>openAhimaa(a)});
  else{A.push({label:'Fill the ahimaʻa',sub:`${a.load.length}/6 · fei, taro, ʻuru or fish`,fn:()=>openSheet('ahimaa')});
    if(a.load.length)A.push(S.inv.log>0?{label:'Cover and cook',sub:'Hot stones, leaves and earth · 1 log',cls:'alt',fn:()=>coverAhimaa(a)}:{label:'Cover and cook',sub:'Needs 1 log for the fire',cls:'alt',off:true});}}
function coverAhimaa(a){if(!a.load.length||S.inv.log<1)return;S.inv.log--;a.state='cooking';a.t=60;showTool(S.inv.pelle>0?'pelle':'none');chopT=0.6;openSheet(null);
  toast('The ahimaʻa is covered. Your food cooks slowly on the hot stones.');refresh();}
function openAhimaa(a){const got={};a.load.forEach(k=>{const o=AHI_IN[k];got[o]=(got[o]||0)+1;});
  if(a.load.length>=4){got.maa=1;stat('feast');toast('A real māʻa Tahiti! You get a feast plate too.');}
  give(got);stat('ahimaa');a.load=[];a.state='empty';
  floatText(Object.entries(got).map(([k,v])=>`+${v} ${nm(k)}`).join('  '),_p.set(a.x,H(a.x,a.z)+1.4,a.z));refresh();}

/* ----- store (fare toa) ----- */
let storeMesh=null;
const awningMat=new THREE.MeshStandardMaterial({roughness:0.8,side:THREE.DoubleSide,map:canvasTex(g=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#fbf3e2':'#de4634';g.fillRect(i*16,0,16,128);}},2,1)});
const storeSignMat=new THREE.MeshStandardMaterial({roughness:0.8,map:(()=>{const c=document.createElement('canvas');c.width=256;c.height=80;const g=c.getContext('2d');
  g.fillStyle='#2fb3b0';g.fillRect(0,0,256,80);g.fillStyle='#fff8ea';g.font='bold 40px "Lilita One","Trebuchet MS",sans-serif';g.textAlign='center';g.fillText('FARE TOA',128,54);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;})()});
function placeStoreMesh(){if(!S.store)return;const g=new THREE.Group();
  g.add(box(3.6,0.25,2.8,MAT.basalt2,0,0.12,0));g.add(box(3.4,2.2,0.1,MAT.wood,0,1.35,-1.25));
  for(const sd of[-1,1])g.add(box(0.1,2.2,2.5,MAT.wood,sd*1.7,1.35,0));
  g.add(box(3.1,0.9,0.5,MAT.wood,0,0.7,0.95));
  for(const y of[0.9,1.45,2.0])g.add(box(3.2,0.06,0.42,MAT.post,0,y,-1.0));
  const roof=box(4.0,0.16,3.4,MAT.thatch,0,2.62,0);roof.rotation.x=0.12;g.add(roof);
  const aw=box(3.6,0.04,0.9,awningMat,0,2.25,1.65);aw.rotation.x=0.35;g.add(aw);
  const sg=box(1.8,0.5,0.06,storeSignMat,0,2.95,1.45);g.add(sg);
  const disp=new THREE.Group();g.add(disp);
  g.position.set(S.store.x,H(S.store.x,S.store.z),S.store.z);g.rotation.y=S.store.rot||0;scene.add(g);storeMesh={g,disp};refreshStoreDisplay();}
function storeFront(){const a=S.store.rot||0;return{x:S.store.x+Math.sin(a)*2.1,z:S.store.z+Math.cos(a)*2.1};}
function storeCount(){return S.store?Object.values(S.store.stock).reduce((a,b)=>a+b,0):0;}
function refreshStoreDisplay(){if(!storeMesh)return;const d=storeMesh.disp;while(d.children.length)d.remove(d.children[0]);let i=0;
  for(const k in S.store.stock){const n=Math.min(5,S.store.stock[k]);for(let j=0;j<n&&i<30;j++,i++){const row=Math.floor(i/10),col=i%10;
    const m=mesh(new THREE.BoxGeometry(0.2,0.24,0.2),std(PRODUCE_COL[k]||{rice:0xf6f1e6,sugar:0x2fb3b0,coffee:0x7a4a28}[k]||0xd6b062),-1.35+col*0.3,1.06+row*0.55,-1.0,false);d.add(m);}}}
placeStoreMesh();
function shopperBuy(n){const st=S.store?S.store.stock:{},ks=Object.keys(st).filter(k=>st[k]>0);let got=0,spent=0;const want=2+Math.floor(Math.random()*3);
  for(let i=0;i<want&&ks.length;i++){const k=ks[Math.floor(Math.random()*ks.length)];st[k]--;if(st[k]<=0){delete st[k];ks.splice(ks.indexOf(k),1);}got++;spent+=priceOf(k);stat('sold');}
  const at=_p.set(n.x,2.3,n.z);if(got){earn(spent,at);refreshStoreDisplay();refresh();}else floatText('The shelves are empty…',at);leavePath(n);}
function spawnShopper(){const st=dockPt(DOCK.r1-0.8,0),n={role:'shopper',seed:Math.floor(Math.random()*1e9),state:'arrive',x:st.x,z:st.z,path:[dockPt(DOCK.r0-0.4,0),storeFront()],wait:0};S.npcs.push(n);spawnNpcMesh(n);}

/* ----- newspaper and market of the day ----- */
const MARKET=['banana','papaya','pineapple','coconut','fish','taro','heipupu','pareu','tapa','monoi','faraoa','maa','poe','vanilla','aahi','tifai'];
function marketOn(k){return S.market&&S.market.day===S.day&&S.market.k===k;}
function priceOf(k){return Math.round((PRICES[k]||50)*(marketOn(k)?2:1));}
function marketTag(k){return marketOn(k)?' · <b class="hot">×2 today</b>':'';}
function fmtClock(tod){const h=Math.floor(tod*24)%24,m=Math.floor((tod*24-Math.floor(tod*24))*6)*10;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
const WXN={clear:'Clear',cloudy:'Cloudy',rain:'Rain',storm:'Storm',windy:'Windy'};
function forecastHtml(){const w=S.weather;if(!w.next)w.next=nextWeather(w.state);return `Now: <b>${WXN[w.state]}</b>. Around ${fmtClock((S.tod+w.left/DAY_LEN)%1)}: <b>${WXN[w.next]}</b>${w.next==='storm'?' · lash your roofs!':''}.`;}

/* ----- whales (tohorā) ----- */
function makeWhale(){const g=new THREE.Group(),dark=std(0x34404a,{flatShading:false,roughness:0.5}),light=std(0xd9e2e6,{flatShading:false}),body=new THREE.Group();g.add(body);
  const b=mesh(new THREE.SphereGeometry(1,18,12),dark);b.scale.set(1.3,1.05,4.6);body.add(b);
  const bl=mesh(new THREE.SphereGeometry(1,16,10),light,0,-0.38,0.4);bl.scale.set(1.0,0.65,3.8);body.add(bl);
  for(const sd of[-1,1]){const f=box(2.6,0.12,0.55,light,sd*2.1,-0.45,1.6);f.rotation.z=sd*-0.4;f.rotation.y=sd*0.45;body.add(f);}
  const tail=new THREE.Group();tail.position.z=-4.2;body.add(tail);const ts=mesh(new THREE.CylinderGeometry(0.3,0.6,1.4,10),dark,0,0,-0.4);ts.rotation.x=Math.PI/2;tail.add(ts);
  for(const sd of[-1,1]){const fl=box(1.6,0.1,0.9,dark,sd*0.85,0,-1.2);fl.rotation.y=sd*0.35;tail.add(fl);}
  const fin=mesh(new THREE.ConeGeometry(0.25,0.5,6),dark,0,1.02,-1.6);fin.scale.z=0.4;body.add(fin);
  const spout=new THREE.Mesh(new THREE.ConeGeometry(0.9,3.2,10,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  spout.rotation.x=Math.PI;spout.position.set(0,2.6,2.3);body.add(spout);
  const splash=new THREE.Mesh(new THREE.RingGeometry(1.5,3.5,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));splash.rotation.x=-Math.PI/2;splash.position.y=0.1;scene.add(splash);
  g.scale.setScalar(1.4);scene.add(g);return{g,body,tail,spout,splash};}
const whales=[0,1].map(i=>({a:Math.random()*6,r:86+i*12,sp:0.012+i*0.004,ph:i*11,o:makeWhale(),x:0,z:0}));
function updateWhales(dt,t){for(const w of whales){w.a+=w.sp*dt;w.x=Math.cos(w.a)*w.r;w.z=Math.sin(w.a)*w.r;const o=w.o,yaw=Math.atan2(-Math.sin(w.a),Math.cos(w.a));
  const T=t+w.ph,k=T%26,cyc=Math.floor(T/26)%3;let y=-6,pitch=0,roll=0,tailUp=0,sp=0,spl=0;
  if(k<7){y=-0.42+Math.sin(k*1.2)*0.08;sp=k<1.4?1-k/1.4:0;}
  else if(k<9.5){const p=(k-7)/2.5;y=-0.42-p*3;pitch=0.45*Math.sin(p*Math.PI);tailUp=p;}
  else if(cyc===2&&k>14&&k<17){const p=(k-14)/3;y=Math.sin(p*Math.PI)*5.5-2.2;pitch=-1.1+p*1.9;roll=p*0.9;spl=p>0.85?1:0;}
  o.g.position.set(w.x,y,w.z);o.g.rotation.set(0,yaw,0);o.body.rotation.set(pitch,0,roll);o.tail.rotation.x=-tailUp*0.9;
  o.g.visible=y>-5;o.spout.material.opacity=sp*0.7;o.spout.scale.setScalar(0.4+(1-sp)*0.9);
  o.splash.position.set(w.x,0.1,w.z);o.splash.material.opacity=Math.max(o.splash.material.opacity-dt*0.8,spl*0.8);o.splash.scale.setScalar(1+(1-o.splash.material.opacity)*1.5);}}
function nearWhale(r){return S.boat&&whales.some(w=>dist(w.x,w.z,player.position.x,player.position.z)<(r||30));}
function v7BoatActions(A){tourActions(A);v9BoatActions(A);if(nearWhale())A.push({label:'Watch the whales',sub:'Tohorā · humpback whales',cls:'alt',fn:()=>{stat('whale');floatAtPlayer('♥');manuSay(MANU_LINES.whale[0],5);refresh();}});}

/* ----- constellations for the star lesson ----- */
const constel=(function(){const root=new THREE.Group(),R2=360,groups={};scene.add(root);
  const dir=(az,el)=>{az*=Math.PI/180;el*=Math.PI/180;return new THREE.Vector3(Math.sin(az)*Math.cos(el)*R2,Math.sin(el)*R2,-Math.cos(az)*Math.cos(el)*R2);};
  const make=(k,pts,lines)=>{const g=new THREE.Group(),P=pts.map(([a,e])=>dir(a,e));
    const pg=new THREE.BufferGeometry().setFromPoints(P);const pm=new THREE.PointsMaterial({color:0xfff3c4,size:9,map:sparkMat.map,alphaTest:0.05,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,fog:false});g.add(new THREE.Points(pg,pm));
    const seg=[];lines.forEach(([i,j])=>{seg.push(P[i],P[j]);});const lm=new THREE.LineBasicMaterial({color:0xffc83d,transparent:true,opacity:0,depthWrite:false,fog:false});
    if(seg.length)g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg),lm));root.add(g);groups[k]={g,pm,lm};};
  make('matarii',[[-40,32],[-39.2,32.6],[-38.6,31.9],[-39.6,31.4],[-40.4,31.1],[-38.9,33.2],[-41,32.4]],[]);
  make('matau',[[-6,42],[0,41],[-3,37],[-1,33],[1,29],[4,26],[8,24],[12,24],[15,26],[15.5,29.5]],[[0,2],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]]);
  make('cross',[[30,38],[30,26],[26,32],[34.5,33]],[[0,1],[2,3]]);
  const ring=[],ticks=[];for(let i=0;i<=64;i++)ring.push([i/64*360,2]);for(let i=0;i<32;i++)ticks.push([i/32*360,2],[i/32*360,i%8===0?7:4.5]);
  make('compass',ring.concat(ticks),ring.slice(0,-1).map((_,i)=>[i,i+1]).concat(ticks.map((_,i)=>i%2===0?[ring.length+i,ring.length+i+1]:null).filter(Boolean)));
  root.visible=false;return{root,groups};})();
let starFocus=null;

/* ----- excursions with tourists ----- */
function excAvailable(t){if(t==='dolphin'||t==='whale')return S.sail;if(t==='animals')return S.animals.filter(a=>a.tamed).length>=2;return true;}
function excGuest(){return S.excursion?S.npcs.find(n=>n.role==='guest'&&n.name===S.excursion.name):null;}
function excActions(n,A){if(!n.exc||n.excOK)return;
  if(S.excursion){if(S.excursion.name===n.name)A.push({label:'On excursion',sub:EXC[n.exc].n,off:true});return;}
  A.push({label:`Excursion: ${EXC[n.exc].n}`,sub:`${n.name} · +${fmtXPF(EXC[n.exc].pay)}`,cls:'alt',fn:()=>startExc(n)});}
function startExc(n){S.excursion={name:n.name,type:n.exc,read:[]};n.state='follow';n.path=[];n.stay=Math.max(n.stay,240);
  toast(`${n.name} is coming with you. ${EXC[n.exc].t.replace('{n}',n.name)}`);actSig='';setTimeout(smartHint,600);}
function stopExc(msg){const n=excGuest();if(n&&n.state==='follow'){n.state='stay';n.wait=2;}S.excursion=null;excSig='';actSig='';if(msg)toast(msg);}
function excCheck(n){const px=player.position.x,pz=player.position.z,T=S.excursion.type;
  if(T==='honu')return honus.some(h=>dist(h.x,h.z,px,pz)<7);
  if(T==='spring')return dist(px,pz,SPRING.x,SPRING.z)<6;
  if(T==='sunset')return S.tod>0.72&&S.tod<0.8&&(S.boat||H(px,pz)<0.9);
  if(T==='animals')return S.animals.filter(a=>a.tamed&&dist(a.x,a.z,px,pz)<7).length>=2;
  if(T==='dolphin')return S.boat&&dist(Math.cos(pod.a)*pod.r,Math.sin(pod.a)*pod.r,px,pz)<16;
  if(T==='whale')return nearWhale(30);
  if(T==='stars')return S.excursion.read.length>=STARS.length;return false;}
function completeExc(n){const T=S.excursion.type,E=EXC[T];earn(E.pay,_p.set(n.x,2.6,n.z));n.excOK=true;stat('excursions');stat('ex_'+T);
  let gift=null;if(Math.random()<0.5){gift=['pinetop','papseed','ahu','thread','strings','flour'][Math.floor(Math.random()*6)];give({[gift]:1});}
  toast(`${n.name} loved it! +${fmtXPF(E.pay)}${gift?`, and a gift: ${ITEMS[gift].n}`:''}.`);manuSay(MANU_LINES.excursion[Math.floor(Math.random()*2)],4);
  S.excursion.done=true;excSig='';refresh();}
function updateExcursion(dt){if(!S.excursion)return;const n=excGuest();
  if(!n||n.state==='leave'){stopExc('Your guest has gone back to the wharf.');return;}
  const m=n.body.group;m.visible=true;
  if(S.boat&&canoeMesh){const v=S.taurua?new THREE.Vector3(0,0.33,1.45):new THREE.Vector3(0,0.05,-1.15);canoeMesh.localToWorld(v);n.x=v.x;n.z=v.z;m.position.copy(v);m.rotation.y=canoeMesh.rotation.y;
    n.body.legs.forEach(l=>{l.rotation.x=-1.4;});n.inBoat=true;}
  else{if(n.inBoat){n.inBoat=false;n.x=player.position.x-Math.sin(player.rotation.y)*1.2;n.z=player.position.z-Math.cos(player.rotation.y)*1.2;}
    const tx=player.position.x-Math.sin(player.rotation.y)*1.5+Math.cos(player.rotation.y)*0.7,tz=player.position.z-Math.cos(player.rotation.y)*1.5-Math.sin(player.rotation.y)*0.7,d=dist(tx,tz,n.x,n.z);
    if(d>22){n.x=tx;n.z=tz;}else if(d>0.6){const sp=Math.min(6.5,d*2.2)*dt;n.x+=(tx-n.x)/d*sp;n.z+=(tz-n.z)/d*sp;n.ph=(n.ph||0)+dt*9;}
    m.position.set(n.x,onFloor(n.x,n.z)?Y0:npcY(n.x,n.z),n.z);m.rotation.y=Math.atan2(player.position.x-n.x,player.position.z-n.z);
    const mv=d>0.6;n.body.legs[0].rotation.x=mv?Math.sin(n.ph)*0.6:0;n.body.legs[1].rotation.x=mv?-Math.sin(n.ph)*0.6:0;
    if(S.excursion.done){n.state='stay';n.wait=2;S.excursion=null;excSig='';return;}}
  if(!S.excursion.done&&(dist(n.x,n.z,player.position.x,player.position.z)<12)&&excCheck(n))completeExc(n);}
function renderExc(){const el=$('#exc');const sig=!S.excursion?'none':S.excursion.name+S.excursion.type+(S.excursion.done?1:0)+(S.excursion.read||[]).length;if(sig===excSig)return;excSig=sig;
  if(!S.excursion){el.hidden=true;return;}const E=EXC[S.excursion.type];el.hidden=false;
  el.innerHTML=`${ICON.trip}<div><b>Excursion with ${S.excursion.name}</b><small>${S.excursion.done?'Done! Head back to land.':E.n+(S.excursion.type==='stars'?` · ${S.excursion.read.length}/${STARS.length}`:'')}</small></div><button data-stop="1" aria-label="Stop the excursion">Stop</button>`;}
$('#exc').addEventListener('click',e=>{if(e.target.closest('[data-stop]'))stopExc('Excursion stopped.');});
function v7Extra(A,tg){v9Extra(A,tg);
  if(S.excursion&&!S.excursion.done&&S.excursion.type==='stars'&&!onFloor(player.position.x,player.position.z)){
    A.push(isNight()?{label:'Explain the stars',sub:`To ${S.excursion.name} · ${S.excursion.read.length}/${STARS.length}`,fn:()=>openSheet('stars')}:{label:'Explain the stars',sub:'Wait for the night, after 19:00',off:true});}}

/* ----- sheets: ahimaʻa, store, phone, paper, stars ----- */
const V7S={lampcol:1,pearls:1,ahimaa:1,store:1,phone:1,paper:1,stars:1};
function v7Sheet(mode){let html='';if(mode==='pearls')return pearlSheet();if(mode==='lampcol')return lampSheet();
  if(mode==='ahimaa'){const a=S.ahimaa;$('#sheetTitle').textContent='Fill the ahimaʻa';
    html+=`<p class="small-note">Up to 6 foods. 4 or more make a feast plate (māʻa Tahiti).</p><div class="sec">Inside · ${a.load.length}/6</div>`;
    html+=a.load.length?`<div class="bag-grid">${a.load.map((k,i)=>`<button class="bag-item" data-ahout="${i}">${ICON[k]}<span class="bn">${ITEMS[k].n}</span><span class="bf">take out</span></button>`).join('')}</div>`:'<p class="small-note">Empty.</p>';
    const can=Object.keys(AHI_IN).filter(k=>S.inv[k]>0);
    html+=`<div class="sec">From your bag</div>`+(can.length?can.map(k=>`<div class="recipe"><div class="rinfo"><div class="name">${ICON[k]} ${ITEMS[k].n}</div><div class="tah">becomes ${nm(AHI_IN[k])} · you have ${S.inv[k]}</div></div><button data-ahin="${k}" ${a.load.length<6?'':'disabled'}>Put in</button></div>`).join(''):'<p class="small-note">Bring fei, taro, ʻuru or fish.</p>');
    html+=`<div class="row"><button class="big" data-ahcook="1" ${a.load.length&&S.inv.log>0?'':'disabled'}>Cover and cook · 1 log</button></div>`;}
  else if(mode==='store'){$('#sheetTitle').textContent='Fare toa';const st=S.store.stock,onD=Object.keys(st).filter(k=>st[k]>0);
    html+=`<p class="small-note">Shoppers come on the poti during the day.${S.market.day===S.day&&S.market.k?` Today the paper says <b>${ITEMS[S.market.k].n}</b> sells for double.`:''}</p>`;
    html+=`<div class="sec">On the shelves · ${storeCount()}</div>`+(onD.length?onD.map(k=>`<div class="recipe"><div class="rinfo"><div class="name">${ICON[k]} ${ITEMS[k].n} × ${st[k]}</div><div class="tah">${fmtXPF(priceOf(k))} each${marketTag(k)}</div></div><button data-stake="${k}">Take back</button></div>`).join(''):'<p class="small-note">Empty shelves.</p>');
    const sell=ORDER.filter(k=>PRICES[k]&&S.inv[k]>0);
    html+=`<div class="sec">From your bag</div>`+(sell.length?sell.map(k=>`<div class="recipe"><div class="rinfo"><div class="name">${ICON[k]} ${ITEMS[k].n}</div><div class="tah">${fmtXPF(priceOf(k))}${marketTag(k)} · you have ${S.inv[k]}</div></div><div class="btns"><button data-sput="${k}" data-n="1">+1</button><button data-sput="${k}" data-n="all">All</button></div></div>`).join(''):'<p class="small-note">Nothing to sell. Buy shop goods from the goélette.</p>');}
  else if(mode==='phone'){$('#sheetTitle').textContent='Telephone';
    html+=`<div class="apps"><button class="app" data-app="order">${ICON.ship}<span>Order from the goélette</span><small>+300 XPF delivery when it’s away</small></button>
      <button class="app" data-app="guests" ${S.g2>=3?'':'disabled'}>${ICON.guest}<span>Call for guests</span><small>500 XPF · a guest comes soon</small></button>
      <button class="app" data-app="paper" ${S.inv.paper>0?'':'disabled'}>${ICON.paper}<span>Read the paper</span><small>${S.inv.paper>0?'Today’s edition':'Comes every morning'}</small></button></div>
      <div class="sec">Weather forecast</div><p class="fc">${forecastHtml()}</p>`;}
  else if(mode==='paper'){$('#sheetTitle').textContent='Te Parau ʻĀpī';const M=S.market;
    html+=`<div class="paper"><div class="mast">Te Parau ʻĀpī <small>Day ${S.day}</small></div><h3>${NEWS[(M.news||0)%NEWS.length]}</h3>
      ${M.k?`<p><b>Market today:</b> ${ITEMS[M.k].n} sells for double at your fruit stand and your store.</p>`:''}
      <p><b>Weather:</b> ${forecastHtml()}</p><p><b>Manu’s tip:</b> ${['Lash your roofs before storm season.','Guests love a feast from the ahimaʻa.','Whales visit from July to November.','A shell necklace is the traditional farewell gift.','Compost makes plants grow faster.'][S.day%5]}</p></div>`;
    if(!M.read){M.read=true;stat('paper');}}
  else if(mode==='stars'){$('#sheetTitle').textContent='Explain the stars';const read=S.excursion?S.excursion.read:[];
    html+=`<p class="small-note">Tap each one to explain it${S.excursion?' to '+S.excursion.name:''}. Look up: it lights up in the sky.</p>`;
    html+=STARS.map(s=>`<button class="starcard${read.includes(s.k)?' read':''}${starFocus===s.k?' on':''}" data-star="${s.k}"><b>${s.n}</b> <small>${s.t}</small>${starFocus===s.k||read.includes(s.k)?`<span>${s.x}</span>`:''}</button>`).join('');}
  return html;}
function v7Click(b){const d=b.dataset;if(sheetMode==='pearls'){pearlClick(b);return;}if(sheetMode==='lampcol'){lampClick(b);return;}
  if(sheetMode==='ahimaa'){const a=S.ahimaa;if(d.ahin&&a.load.length<6&&S.inv[d.ahin]>0){S.inv[d.ahin]--;a.load.push(d.ahin);}else if(d.ahout!==undefined){const k=a.load.splice(+d.ahout,1)[0];if(k)S.inv[k]++;}else if(d.ahcook){coverAhimaa(a);return;}refresh();return;}
  if(sheetMode==='store'){const st=S.store.stock;if(d.stake){give({[d.stake]:st[d.stake]},true);delete st[d.stake];}
    else if(d.sput){const k=d.sput,n=d.n==='all'?S.inv[k]:1;if(n>0&&S.inv[k]>=n){S.inv[k]-=n;st[k]=(st[k]||0)+n;}}refreshStoreDisplay();refresh();return;}
  if(sheetMode==='phone'){if(d.app==='order'){phoneOrder=true;sheetMode='shop';$('#sheet').hidden=false;renderSheet();}
    else if(d.app==='guests'){if(guestsStaying()>=S.pension.beds){toast('All your rooms are taken.');return;}if(S.money<500){toast('Not enough XPF');return;}S.money-=500;S.pension.next=3;toast('The tourist office will send a guest on the next poti.');refresh();}
    else if(d.app==='paper')openSheet('paper');return;}
  if(sheetMode==='stars'&&d.star){starFocus=d.star;if(S.excursion&&!S.excursion.read.includes(d.star))S.excursion.read.push(d.star);excSig='';renderSheet();}}
$('#phoneBtn').onclick=()=>openSheet(sheetMode==='phone'?null:'phone');

/* ----- simulation (also while sleeping) ----- */
function v7Sim(dt,quiet){const a=S.ahimaa;if(a&&a.state==='cooking'){a.t-=dt;if(a.t<=0){a.state='done';if(!quiet)toast('Your ahimaʻa is ready! Open it to eat.');}}}

/* ----- per-frame ----- */
function updateV7(dt,t,moving,paused){
  unstick();
  const px=player.position.x,pz=player.position.z;
  blinkT-=dt;if(blinkT<=0){blinkOn=0.12;blinkT=2.5+Math.random()*3.5;}if(blinkOn>0)blinkOn-=dt;PC.eyes.forEach(e=>{e.scale.y=blinkOn>0?0.12:1;});
  if(lookOpen){const f=player.rotation.y+Math.sin(t*0.4)*0.25,wide=innerWidth>innerHeight;camera.position.set(px+Math.sin(f)*(wide?4.2:5.2),player.position.y+1.4,pz+Math.cos(f)*(wide?4.2:5.2));camera.lookAt(px,player.position.y+(wide?0.7:-0.27),pz);}
  if(window.__faceCam){const f=player.rotation.y;camera.position.set(px+Math.sin(f)*1.15,player.position.y+1.86,pz+Math.cos(f)*1.15);camera.lookAt(px,player.position.y+1.74,pz);PC.eyes.forEach(e=>{e.scale.y=1;});}
  updateWhales(dt,t);
  if(!paused)updateExcursion(dt);
  for(const n of S.npcs)if(n.role==='guest'&&n.exc===undefined){const o=Object.keys(EXC).filter(excAvailable);n.exc=S.level>=7&&o.length&&Math.random()<0.75?o[Math.floor(Math.random()*o.length)]:null;}
  if(ahimaaMesh){const a=S.ahimaa,cook=a.state!=='empty';ahimaaMesh.mound.visible=cook;ahimaaMesh.food.visible=!cook;ahimaaMesh.food.children.forEach((c,i)=>{c.visible=i<a.load.length;});
    ahimaaMesh.smoke.forEach((sp,i)=>{sp.visible=a.state==='cooking';const k=((t*0.35+i/5)%1);sp.position.set(Math.sin(i*2+t)*0.2,0.4+k*2.2,Math.cos(i*3)*0.2);sp.material.opacity=0.55*(1-k);sp.scale.setScalar(0.5+k*0.9);});}
  const lessonOn=sheetMode==='stars';constel.root.visible=lessonOn&&isNight();constel.root.position.copy(camera.position);
  if(lessonOn){constel.root.rotation.y=cam.yaw;if(cam.pitch>0.1)cam.pitch=Math.max(0.06,cam.pitch-dt*1.5);
    for(const k in constel.groups){const G=constel.groups[k],on=starFocus===k,tgt=on?1:0.3;G.pm.opacity+=(tgt-G.pm.opacity)*Math.min(1,dt*4);G.lm.opacity+=((on?0.9:0.15)-G.lm.opacity)*Math.min(1,dt*4);}}
  if(!paused&&S.store){const day=S.tod>0.27&&S.tod<0.76;storeT-=dt;if(storeT<=0){storeT=28+Math.random()*30;if(day&&storeCount()>0&&S.npcs.filter(n=>n.role==='shopper').length<3)spawnShopper();}}
  if(S.level>=12&&S.market.day!==S.day&&S.tod>0.26&&!paused){S.market={day:S.day,k:MARKET[Math.floor(Math.random()*MARKET.length)],news:Math.floor(Math.random()*NEWS.length),read:false};S.inv.paper=1;toast('The poti brought today’s newspaper. Tap it in your bag to read.');renderTop();}
  if(S.boat&&nearWhale(40)&&S.flags.whaleDay!==S.day){S.flags.whaleDay=S.day;manuSay(MANU_LINES.whale[0],5);}
  v7T+=dt;if(v7T>0.3){v7T=0;$('#phoneBtn').hidden=!S.owned.phone;renderExc();}}

/* =========================================================
   v8: fly with Manu (fatigue bar, viewpoints), vaʻa taurua, lagoon tours
   ========================================================= */
const FLY={on:false,fat:100,yaw:0,up:false,down:false,mode:'fly',spd:6,vy:0,cam:new THREE.Vector3(),camYaw:0};
if(!S.rings)S.rings={};
const RINGS=(()=>{const pa={x:Math.cos(PASS_A)*(REEF+1),z:Math.sin(PASS_A)*(REEF+1)},wh=dockPt(DOCK.r1,0);
  return[{k:'summit',n:'The mountain summit',x:-19,y:22,z:-25},{k:'falls',n:'The waterfall',x:-6,y:8,z:-10},{k:'pass',n:'The reef pass',x:pa.x,y:6,z:pa.z},
    {k:'wharf',n:'The wharf',x:wh.x,y:6,z:wh.z},{k:'fare',n:'Your fare from above',x:SITE.x,y:11,z:SITE.z},{k:'whales',n:'Whale waters',x:Math.cos(2.4)*84,y:9,z:Math.sin(2.4)*84}];})();
const ringMeshes=RINGS.map(r=>{const m=new THREE.Mesh(new THREE.TorusGeometry(2.3,0.22,8,32),new THREE.MeshBasicMaterial({color:0xffc83d,transparent:true,opacity:0.9,fog:false}));
  m.position.set(r.x,r.y,r.z);m.rotation.y=Math.atan2(r.x,r.z);m.visible=false;scene.add(m);return m;});
function startFly(){if(S.boat||FLY.on)return;if(FLY.fat<25){toast('Manu is still tired. Let Manu rest a little.');return;}
  FLY.on=true;FLY.mode='fly';FLY.yaw=player.rotation.y;FLY.camYaw=FLY.yaw;FLY.spd=6;FLY.vy=2;
  manu.pos.set(player.position.x,player.position.y+2.2,player.position.z);FLY.cam.copy(camera.position);
  document.body.classList.add('flying');openSheet(null);manuBubble.hidden=true;$('#flybar').hidden=false;$('#flypad').hidden=false;
  toast(coarse?'You fly with Manu! Steer with the joystick, hold ▲ to climb.':'You fly with Manu! Steer with WASD, hold Space to climb, Shift to dive.');}
function stopFly(){FLY.on=false;manu.state='follow';document.body.classList.remove('flying');$('#flybar').hidden=true;$('#flypad').hidden=true;actSig='';}
$('#flyBtn').onclick=startFly;
$('#flyLand').onclick=()=>{if(FLY.on)FLY.mode='return';};
for(const[id,k]of[['flyUp','up'],['flyDown','down']]){const el=$('#'+id);
  el.addEventListener('pointerdown',e=>{e.preventDefault();FLY[k]=true;try{el.setPointerCapture(e.pointerId);}catch(_){}});
  for(const ev of['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>{FLY[k]=false;});}
function updateFly(dt,t){
  const M=manu,P=M.pos,gy=Math.max(H(P.x,P.z),0),overLand=H(P.x,P.z)>0.05;
  let ix=0,iy=0;if(keys.w||keys.arrowup)iy-=1;if(keys.s||keys.arrowdown)iy+=1;if(keys.a||keys.arrowleft)ix-=1;if(keys.d||keys.arrowright)ix+=1;ix+=joyV.x;iy+=joyV.y;
  const mag=Math.min(1,Math.hypot(ix,iy)),up=FLY.up||keys[' '],down=FLY.down||keys.shift,storm=stormy()?1.6:1;
  if(FLY.mode==='return'){const tg=new THREE.Vector3(0.29,1.6,-0.03);player.localToWorld(tg);const d=P.distanceTo(tg);
    if(d<0.8){stopFly();toast('Manu is back on your shoulder.');return;}
    const dir=tg.clone().sub(P).normalize();P.addScaledVector(dir,Math.min(d,11*dt));FLY.yaw=Math.atan2(dir.x,dir.z);FLY.vy=dir.y*4;}
  else if(FLY.mode==='rest'){FLY.fat=Math.min(100,FLY.fat+dt*22);P.y=gy+0.25;FLY.spd=0;FLY.vy=0;
    if((mag>0.1||up)&&FLY.fat>30){FLY.mode='fly';FLY.vy=3;FLY.spd=5;}}
  else{
    if(mag>0.1){const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
      const mx=rx*ix-fx*iy,mz=rz*ix-fz*iy,ty=Math.atan2(mx,mz);let dr=ty-FLY.yaw;dr=Math.atan2(Math.sin(dr),Math.cos(dr));FLY.yaw+=dr*Math.min(1,dt*2.6);}
    const tired=FLY.fat<=0;
    FLY.spd+=((mag>0.1?11:6.5)-FLY.spd)*Math.min(1,dt*1.5);
    const tvy=tired?-3:up?4.2:down?-6:-0.55;FLY.vy+=(tvy-FLY.vy)*Math.min(1,dt*3);
    FLY.fat=Math.max(0,FLY.fat-dt*storm*(up&&!tired?9:mag>0.1?3.2:2));
    if(tired&&!FLY.saidTired){FLY.saidTired=true;toast('Manu is exhausted! '+(overLand?'Manu glides down to rest.':'Manu turns back to you.'));if(!overLand)FLY.mode='return';}
    P.x+=Math.sin(FLY.yaw)*FLY.spd*dt;P.z+=Math.cos(FLY.yaw)*FLY.spd*dt;P.y+=FLY.vy*dt;
    const r=Math.hypot(P.x,P.z);if(r>150){const ty=Math.atan2(-P.x,-P.z);let dr=ty-FLY.yaw;dr=Math.atan2(Math.sin(dr),Math.cos(dr));FLY.yaw+=dr*Math.min(1,dt*2);}
    const g2=Math.max(H(P.x,P.z),0);
    if(P.y<g2+0.55){P.y=g2+0.55;
      if(H(P.x,P.z)<0.05){FLY.fat=Math.max(0,FLY.fat-12);toast('Splash! Manu’s feathers are wet. Manu flies back to you.');FLY.mode='return';}
      else if(!up&&(mag<0.1||tired)){FLY.mode='rest';FLY.saidTired=false;toast('Manu lands to rest.');}}
    P.y=Math.min(P.y,48);
    RINGS.forEach((rg,i)=>{if(!S.rings[rg.k]&&dist(P.x,P.z,rg.x,rg.z)<2.6&&Math.abs(P.y-rg.y)<2.6){S.rings[rg.k]=1;stat('skyrings');earn(800,_p.set(rg.x,rg.y+2,rg.z));
      toast(`Viewpoint: ${rg.n}! +800 XPF (${Object.keys(S.rings).length}/${RINGS.length})`);refresh();}});}
  M.g.position.copy(P);M.g.rotation.y=FLY.yaw;
  const rest=FLY.mode==='rest',flap=rest?0.1:up||FLY.mode==='return'?Math.sin(t*26)*1.0:Math.sin(t*6)*0.25+0.35;
  M.wings[0].rotation.z=flap;M.wings[1].rotation.z=-flap;M.body.rotation.x=rest?0:clamp(-FLY.vy*0.08,-0.5,0.5);M.body.rotation.z=0;
  M.eyes.forEach(e=>{e.scale.y=FLY.fat<15?0.5:1;});
  FLY.camYaw+=Math.atan2(Math.sin(FLY.yaw-FLY.camYaw),Math.cos(FLY.yaw-FLY.camYaw))*Math.min(1,dt*2.2);cam.yaw=FLY.camYaw+Math.PI;
  const back=new THREE.Vector3(P.x-Math.sin(FLY.camYaw)*5.5,P.y+2.5,P.z-Math.cos(FLY.camYaw)*6.2);back.y=Math.max(back.y,Math.max(H(back.x,back.z),0)+1.6);
  FLY.cam.lerp(back,Math.min(1,dt*4));camera.position.copy(FLY.cam);camera.lookAt(P.x+Math.sin(FLY.camYaw)*3,P.y+0.2,P.z+Math.cos(FLY.camYaw)*3);
  sky.position.copy(camera.position);skyStars.forEach(s=>s.position.copy(camera.position));
  const f=Math.round(FLY.fat);$('#flyfill').style.width=f+'%';$('#flybar').classList.toggle('low',f<30);
  $('#flytxt').textContent=FLY.mode==='rest'?'Resting…':FLY.mode==='return'?'Flying back':f<=0?'Exhausted':`${f}%`;}

/* ----- vaʻa taurua and lagoon tours ----- */
function makeTaurua(){const v=new THREE.Group();
  for(const sd of[-1,1]){v.add(mesh(HULL,MAT.hullD,sd*1.05,0.36,0));v.add(box(0.03,0.09,3.4,MAT.hullPaint,sd*1.48,0.22,0,false));v.add(box(0.03,0.09,3.4,MAT.hullPaint,sd*0.62,0.22,0,false));
    for(const z of[-1,1]){const post=box(0.12,0.55,0.14,MAT.canoeTrim,sd*1.05,0.72,z*2.25);post.rotation.x=z*0.35;v.add(post);v.add(box(0.13,0.06,0.15,MAT.hullPaint,sd*1.05,1.0,z*2.36));}}
  v.add(box(2.9,0.08,3.4,MAT.wood,0,0.5,0));for(const z of[-1.5,0,1.5])v.add(box(3.0,0.1,0.12,MAT.post,0,0.45,z));
  for(const sd of[-1,1]){v.add(box(0.05,0.05,3.2,MAT.rope,sd*1.45,0.85,0));for(const z of[-1.4,0,1.4])v.add(cyl(0.03,0.35,MAT.post,sd*1.45,0.68,z,5));}
  v.add(box(1.9,0.08,1.2,MAT.thatch,0,1.75,-1.15));for(const x of[-0.85,0.85])for(const z of[-1.65,-0.65])v.add(cyl(0.04,1.2,MAT.post,x,1.15,z,5));
  for(const z of[-0.6,0.7])v.add(box(2.2,0.08,0.3,MAT.wood,0,0.72,z));
  const sg=new THREE.Group();sg.add(cyl(0.05,3.4,MAT.post,0,2.2,0.9,6));const sh=new THREE.Shape();sh.moveTo(0,0.8);sh.lineTo(0,3.8);sh.lineTo(1.7,0.9);sh.lineTo(0,0.8);
  const sail=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshStandardMaterial({map:MAT.weave.map,roughness:1,side:THREE.DoubleSide}));sail.position.set(0,0,0.9);sail.castShadow=true;sg.add(sail);v.add(sg);
  const paddle=new THREE.Group();paddle.add(cyl(0.03,1.4,MAT.canoeTrim,0,0,0,5));paddle.position.set(-1.3,0.9,-1.5);paddle.rotation.z=0.6;v.add(paddle);
  Object.assign(v.userData,{sailG:sg,sail,paddle,taurua:true,seats:[[-0.7,0.78,-0.6],[0.7,0.78,-0.6],[-0.7,0.78,0.7],[0.7,0.78,0.7]]});return v;}
const TOUR_DOCK=dockPt(DOCK.r1+1.5,-2.2);
const TOUR_STOPS=[{n:'Coral garden',a:1.5},{n:'Honu bay',a:2.8},{n:'Sandbar motu',a:4.6},{n:'Stingray shallows',a:5.8}].map(st=>{let x=0,z=0;
  if(st.pass){x=Math.cos(PASS_A-0.04)*(REEF-1.6);z=Math.sin(PASS_A-0.04)*(REEF-1.6);}else for(let r=R+5;r>R-2;r-=0.5){x=Math.cos(st.a)*r;z=Math.sin(st.a)*r;if(H(x,z)<-1.2)break;}
  const g=new THREE.Group();g.add(cyl(0.22,0.5,MAT.hullPaint,0,0.1,0,10));g.add(cyl(0.04,1.4,MAT.post,0,0.8,0,5));g.add(box(0.5,0.3,0.02,MAT.white,0.26,1.35,0));
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.6,1.9,28),new THREE.MeshBasicMaterial({color:0xffc83d,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=0.08;g.add(ring);
  g.position.set(x,0,z);g.visible=false;scene.add(g);return{...st,x,z,g,ring};});
let tourPax=[];
function tourActions(A){if(!S.taurua)return;const nearDock=dist(player.position.x,player.position.z,TOUR_DOCK.x,TOUR_DOCK.z)<9;
  if(S.tour){const left=S.tour.done.filter(d=>!d).length;A.push({label:'Lagoon tour',sub:left?`${left} stop${left>1?'s':''} left · ${S.tour.pax} passengers`:'All stops done · back to the wharf',off:true});return;}
  if(nearDock)A.push(S.tod>0.27&&S.tod<0.78?{label:'Start a lagoon tour',sub:'2–4 visitors · 1 500 XPF each',fn:startTour}:{label:'Lagoon tour',sub:'Tours run in the daytime',off:true});}
function startTour(){const pax=S.ponton?4:2+Math.floor(Math.random()*3);S.tour={pax,done:TOUR_STOPS.map(()=>0)};makePax();toast(`${pax} visitors climb aboard! Visit the ${TOUR_STOPS.length} yellow buoys, then come back to the wharf.`);actSig='';}
function makePax(){clearPax();for(let i=0;i<S.tour.pax;i++){const b=makePerson(Math.floor(Math.random()*1e9));scene.add(b.group);tourPax.push(b);}}
function clearPax(){tourPax.forEach(b=>scene.remove(b.group));tourPax=[];}
function endTour(full){const T=S.tour,stops=T.done.filter(Boolean).length,pay=full?T.pax*((S.ponton?2000:1500)+500):T.pax*400*stops;
  if(pay)earn(pay,_p.set(player.position.x,2.5,player.position.z));if(full){stat('tours');stat('passengers',T.pax);}
  toast(full?`Tour complete! ${T.pax} happy passengers paid ${fmtXPF(pay)}.`:`The visitors went home early${pay?` and paid ${fmtXPF(pay)}`:''}.`);
  S.tour=null;clearPax();actSig='';refresh();}
function updateTour(dt,t){
  TOUR_STOPS.forEach((st,i)=>{st.g.visible=!!S.tour&&!S.tour.done[i];if(st.g.visible){st.g.position.y=Math.sin(t*1.5+i)*0.06;st.ring.scale.setScalar(1+Math.sin(t*3+i)*0.06);}});
  if(!S.tour)return;if(!tourPax.length)makePax();
  if(!S.boat){endTour(S.tour.done.every(Boolean));return;}
  if(canoeMesh&&canoeMesh.userData.seats)tourPax.forEach((b,i)=>{const s=canoeMesh.userData.seats[i];const v=new THREE.Vector3(...s);canoeMesh.localToWorld(v);b.group.position.copy(v);b.group.position.y-=0.45;
    b.group.rotation.y=canoeMesh.rotation.y+(i%2?-0.3:0.3);b.legs.forEach(l=>{l.rotation.x=-1.4;});b.arms[i%2].rotation.x=Math.sin(t*2+i)*0.3-0.2;});
  const px=player.position.x,pz=player.position.z;
  TOUR_STOPS.forEach((st,i)=>{if(!S.tour.done[i]&&dist(px,pz,st.x,st.z)<6){S.tour.done[i]=1;stat('tourstops');floatText(`${st.n} ✓`,_p.set(st.x,2,st.z));
    tourPax.forEach((b,j)=>setTimeout(()=>floatText('♥',_p.set(b.group.position.x,b.group.position.y+2.2,b.group.position.z)),j*150));actSig='';}});
  if(S.tour.done.every(Boolean)&&dist(px,pz,TOUR_DOCK.x,TOUR_DOCK.z)<9)endTour(true);}

/* ----- per-frame ----- */
function updateV8(dt,t,paused){
  if(S.taurua&&canoeMesh&&!canoeMesh.userData.taurua){const o=canoeMesh;scene.remove(o);canoeMesh=makeTaurua();canoeMesh.position.copy(o.position);canoeMesh.rotation.copy(o.rotation);scene.add(canoeMesh);}
  updateTour(dt,t);
  ringMeshes.forEach((m,i)=>{m.visible=FLY.on;m.material.opacity=S.rings[RINGS[i].k]?0.22:0.9;m.rotation.z=t*0.6;});
  if(FLY.on){if(!paused)updateFly(dt,t);}else FLY.fat=Math.min(100,FLY.fat+dt*8);
  $('#flyBtn').hidden=!(S.level>=5&&!S.boat&&!FLY.on&&!lookOpen);}

/* =========================================================
   v9: tilled fields, ʻumara & manioc, taupoʻo, ponton, pearl farm,
       honey, small port, helipad, dispensary, ground details
   ========================================================= */
var CROPS2=window.FARE_DATA.CROPS2,PEARL=window.FARE_DATA.PEARL;
const MAX_FIELDS=6;
Object.assign(AHI_IN,{kumara:'rkumara',manioc:'cmanioc'});
['kumara','manioc','rkumara','cmanioc','poemanioc','meli'].forEach(k=>SCRAP_FOODS.add(k));
MAT.tilled=std(0x5a3a22,{flatShading:false});MAT.tilled2=std(0x74492a);MAT.kleaf=std(0x4f9a3a,{side:THREE.DoubleSide});MAT.kleaf2=std(0x7a4a6a,{side:THREE.DoubleSide});
MAT.mleaf=std(0x3f8a34,{side:THREE.DoubleSide});MAT.mstem=std(0xb06a4a);MAT.tuber=std(0xa8456a);MAT.concrete=std(0xb9bcb6);MAT.dark=std(0x1d1f22);MAT.red=std(0xde4634);
MAT.blue=std(0x2c7fb8);MAT.yellow=std(0xf2c94c);MAT.glass=new THREE.MeshStandardMaterial({color:lin(0x9ad0e8),roughness:0.1,metalness:0.3,transparent:true,opacity:0.75});
const ridgeGeo=new THREE.CylinderGeometry(0.2,0.2,2.0,7,1);ridgeGeo.rotateZ(Math.PI/2);ridgeGeo.scale(1,0.55,1);
const kLeafGeo=new THREE.CircleGeometry(0.11,7);kLeafGeo.rotateX(-Math.PI/2+0.35);
const mLeafGeo=new THREE.PlaneGeometry(0.07,0.34);mLeafGeo.translate(0,0.17,0);
function v9Sign(text,bg,fg,w,h){const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);const g=c.getContext('2d');
  g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.font=`bold ${Math.round(c.height*0.5)}px "Lilita One","Trebuchet MS",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,c.width/2,c.height*0.54);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return new THREE.MeshStandardMaterial({map:t,roughness:0.8});}

/* ----- tilled beds ----- */
function makeField(f){const g=new THREE.Group();
  const base=box(2.3,0.06,1.6,MAT.tilled,0,0.0,0);base.castShadow=false;g.add(base);
  for(const z of[-0.5,0,0.5]){const r=mesh(ridgeGeo,MAT.tilled2,0,0.07,z);r.castShadow=false;g.add(r);}
  const plants=new THREE.Group();g.add(plants);g.userData.plants=plants;
  g.position.set(f.x,H(f.x,f.z)-0.01,f.z);g.rotation.y=f.rot||0;world.add(g);f.mesh=g;fieldPlants(f);}
function fieldPlants(f){const P=f.mesh.userData.plants;while(P.children.length)P.remove(P.children[0]);if(!f.type)return;const r=mulberry32(f.seed||7);
  for(const x of[-0.72,0,0.72])for(const z of[-0.5,0,0.5]){const p=new THREE.Group();p.position.set(x+(r()-0.5)*0.15,0.14,z);p.rotation.y=r()*6;
    if(f.type==='kumara'){for(let i=0;i<7;i++){const a=i/7*Math.PI*2+r(),d=0.08+r()*0.2;const l=mesh(kLeafGeo,i%3?MAT.kleaf:MAT.kleaf2,Math.cos(a)*d,0.05+r()*0.1,Math.sin(a)*d);l.rotation.y=-a;l.castShadow=false;p.add(l);}
      const tu=mesh(new THREE.SphereGeometry(0.07,7,5),MAT.tuber,0.05,0,0.04);tu.scale.set(1.5,0.8,1);tu.visible=false;tu.name='tuber';p.add(tu);}
    else{const h=0.8+r()*0.4;p.add(cyl(0.022,h,MAT.mstem,0,h/2,0,5));
      for(let k=0;k<3;k++){const top=new THREE.Group();top.position.set(0,h*(0.7+k*0.15),0);top.rotation.y=k*1.1;
        for(let i=0;i<6;i++){const l=mesh(mLeafGeo,MAT.mleaf);l.rotation.set(0,i/6*Math.PI*2,1.0+r()*0.3);l.castShadow=false;top.add(l);}p.add(top);}}
    P.add(p);}
  P.scale.setScalar(0.15+0.85*f.g);}
function tillCheck(){if(S.boat)return{ok:false,why:'Go ashore first'};if(S.fields.length>=MAX_FIELDS)return{ok:false,why:`You can keep ${MAX_FIELDS} beds`};
  const{x,z}=ahead(1.9),h=H(x,z);if(h<0.45||h>3.8)return{ok:false,why:'Find flat ground inland'};
  if(occupied(x,z,1.7)||S.fields.some(f=>dist(f.x,f.z,x,z)<2.6))return{ok:false,why:'Find open ground'};return{ok:true,x,z};}
function till(c){chopT=0.7;showTool(S.inv.pelle>0?'pelle':'oo');const f={x:c.x,z:c.z,rot:player.rotation.y,type:null,g:0,seed:Math.floor(Math.random()*1e9)};S.fields.push(f);makeField(f);stat('tilled');
  floatText('Bed tilled',_p.set(c.x,H(c.x,c.z)+1,c.z));once('tillTip','Plant ʻumara slips or manioc stems in your bed.');refresh();}
function plantField(f,type){const C=CROPS2[type];S.inv[C.slip]--;f.type=type;f.g=S.inv.pelle>0?0.1:0;f.fert=0;fieldPlants(f);stat('planted');S.planted++;
  floatText(`${C.n} planted`,_p.set(f.x,H(f.x,f.z)+1,f.z));refresh();}
function harvestField(f){const C=CROPS2[f.type],y={...C.yield};if(f.fert){y[f.type]++;}give(y);stat(f.type,y[f.type]);chopT=0.5;showTool(S.inv.pelle>0?'pelle':'none');
  floatText(Object.entries(y).map(([k,v])=>`+${v} ${nm(k)}`).join('  '),_p.set(f.x,H(f.x,f.z)+1.4,f.z));
  if(f.type==='manioc')once('maniocTip','Manioc must be cooked: boil it, or make poʻe maniota at the fire.');
  f.type=null;f.g=0;f.fert=0;fieldPlants(f);refresh();}
function fieldActs(f,A){
  if(!f.type){const ks=Object.keys(CROPS2).filter(k=>S.inv[CROPS2[k].slip]>0);
    if(ks.length)ks.forEach(k=>A.push({label:`Plant ${CROPS2[k].n}`,sub:`1 ${nm(CROPS2[k].slip)} · ${S.inv[CROPS2[k].slip]} left`,fn:()=>plantField(f,k)}));
    else A.push({label:'Tilled bed',sub:'Plant ʻumara slips or manioc stems · goélette',off:true});return;}
  const C=CROPS2[f.type];
  if(f.g<1){A.push({label:`Young ${C.n}`,sub:growSub(f.g),off:true});const w=waterAct(f);if(w)A.push(w);const f2=fertAct(f);if(f2)A.push(f2);}
  else A.push({label:C.verb,sub:Object.entries(C.yield).map(([k,v])=>`+${v+(f.fert&&k===f.type?1:0)} ${nm(k)}`).join(' · '),fn:()=>harvestField(f)});}

/* ----- taupoʻo hat ----- */
var hatMesh=null;
function makeHat(){const g=new THREE.Group(),straw=MAT.weave,band=std(0xde4634);
  const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.44,0.48,0.03,22),straw);brim.position.y=0.17;g.add(brim);
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.25,0.2,18),straw);crown.position.y=0.28;g.add(crown);
  const b=new THREE.Mesh(new THREE.CylinderGeometry(0.255,0.255,0.06,18),band);b.position.y=0.22;g.add(b);
  const fl=std(0xffffff);for(let i=0;i<3;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),fl);const a=0.6+i*0.28;s.position.set(Math.sin(a)*0.26,0.23,Math.cos(a)*0.26);g.add(s);}
  g.traverse(m=>{if(m.isMesh)m.castShadow=true;});return g;}
function applyHat(){if(!PC.head)return;if(!hatMesh)hatMesh=makeHat();if(hatMesh.parent!==PC.head)PC.head.add(hatMesh);hatMesh.visible=!!S.wearHat;applyJewelWear();}

/* ----- ponton ----- */
const DOCK_YAW=Math.atan2(DOCK.dx,DOCK.dz),PONTON_C=dockPt(DOCK.r1+0.6,-2.9);
let pontonMesh=null,pontonPax=[];
function placePonton(){if(!S.ponton||pontonMesh)return;const g=new THREE.Group();
  for(const x of[-0.9,0.9])for(const z of[-1.6,0,1.6]){const f=cyl(0.28,0.5,MAT.dark,x,0.1,z,10);f.rotation.x=Math.PI/2;g.add(f);}
  g.add(box(2.6,0.1,4.4,MAT.wood,0,0.4,0));for(const z of[-2.2,2.2])g.add(box(2.6,0.12,0.12,MAT.post,0,0.46,z));
  for(const x of[-1.15,1.15])for(const z of[0.4,2.0])g.add(cyl(0.05,1.9,MAT.post,x,1.35,z,6));
  const roof=box(2.7,0.14,2.0,MAT.thatch,0,2.3,1.2);roof.rotation.x=0.08;g.add(roof);
  g.add(box(2.0,0.08,0.35,MAT.wood,0,0.72,1.9));g.add(box(0.08,0.3,0.35,MAT.post,-0.9,0.57,1.9));g.add(box(0.08,0.3,0.35,MAT.post,0.9,0.57,1.9));
  const gw=box(0.9,0.07,1.0,MAT.wood,1.6,0.48,-1.0);g.add(gw);
  g.add(cyl(0.04,2.2,MAT.post,-1.15,1.5,-2.0,6));const sg=box(0.9,0.45,0.04,v9Sign('LAGOON TOURS','#2fb3b0','#fff8ea',0.9,0.45),-0.68,2.3,-2.0);g.add(sg);
  for(const x of[-1.3,1.3]){const lad=box(0.4,0.6,0.05,MAT.post,x,0.15,-2.25);g.add(lad);}
  g.position.set(PONTON_C.x,0,PONTON_C.z);g.rotation.y=DOCK_YAW;scene.add(g);pontonMesh=g;}

/* ----- pearl farm ----- */
const PFARM_AT=(()=>{const a=2.2;for(let r=R+5.5;r>R-2;r-=0.5){const x=Math.cos(a)*r,z=Math.sin(a)*r;if(H(x,z)<-1.4)return{x,z,a};}return{x:Math.cos(a)*42,z:Math.sin(a)*42,a};})();
let pfarmMesh=null;
function placePfarm(){if(!S.pfarm||pfarmMesh)return;const g=new THREE.Group();
  for(const x of[-1.2,1.2])for(const z of[-1.0,1.0])g.add(cyl(0.09,2.6,MAT.post,x,-0.2,z,6));
  g.add(box(3.0,0.1,2.6,MAT.wood,0,1.05,0));g.add(box(2.4,1.3,0.08,MAT.wood,0,1.75,-1.0));
  for(const x of[-1.15,1.15])g.add(box(0.08,1.3,2.0,MAT.wood,x,1.75,-0.05));
  const rf=box(3.0,0.14,2.6,MAT.thatch,0,2.55,0);rf.rotation.x=0.1;g.add(rf);
  g.add(box(0.8,0.06,1.2,MAT.wood,0,0.55,1.7));
  const lines=new THREE.Group();g.add(lines);
  for(const sd of[-1,1]){lines.add(box(0.03,0.03,9,MAT.rope,sd*0.9,0.05,-6.5));
    for(let i=0;i<7;i++){const b=mesh(new THREE.SphereGeometry(0.2,10,7),MAT.dark,sd*0.9,0.06,-2.6-i*1.3);lines.add(b);}}
  g.position.set(PFARM_AT.x,0,PFARM_AT.z);g.rotation.y=Math.atan2(PFARM_AT.x,PFARM_AT.z)+Math.PI/2;scene.add(g);pfarmMesh={g,lines};}
function ecrinRoom(){return 6*(S.inv.ecrin||0)-S.pearls.length;}
function pearlId(){S.pid=(S.pid||0)+1;return S.pid;}
function rollPearl(o){const avg=o.t>0?clamp(o.q/o.t,0,1):0.5;if(Math.random()<0.06)return null;
  const wA=0.04+0.14*avg,wB=0.16+0.16*avg,wC=0.38,r=Math.random()*(wA+wB+wC+0.3);
  const g=r<wA?'A':r<wA+wB?'B':r<wA+wB+wC?'C':'D';
  const cs=['paon','aubergine','vert','gris','noir','noir','gris','or'],c=cs[Math.floor(Math.random()*cs.length)];
  return{id:pearlId(),g,c,s:Math.round((8+Math.random()*4+avg*2)*10)/10};}
function pearlValue(p){return Math.round(PEARL.grades[p.g].v*PEARL.colors[p.c].m*(p.s/10)/100)*100;}
function graft(){if(!(S.inv.nucleus>0)||S.pfarm.oys.length>=8)return;S.inv.nucleus--;S.pfarm.oys.push({g:0,q:0,t:0});stat('grafted');chopT=0.4;
  floatAtPlayer('Oyster grafted');once('graftTip','The pearl grows very slowly, about a day and a half. Keep the lines clean for better pearls.');refresh();}
function cleanOys(){S.pfarm.clean=1;chopT=0.6;stat('cleaned');floatAtPlayer('Oysters cleaned');refresh();}
function harvestPearls(){const F=S.pfarm,ready=F.oys.filter(o=>o.g>=1);let got=0,lost=0;
  for(const o of ready){if(ecrinRoom()<=0)break;F.oys.splice(F.oys.indexOf(o),1);const p=rollPearl(o);if(p){S.pearls.push(p);got++;stat('pearls');}else lost++;}
  const txt=got?`${got} pearl${got>1?'s':''}!`:'';toast(`${txt}${lost?` ${lost} oyster${lost>1?'s':''} rejected the nucleus.`:''} ${got?'They are in your écrins.':''}`.trim());
  if(got)manuSay(MANU_LINES.pearl[Math.floor(Math.random()*MANU_LINES.pearl.length)],4);refresh();}
function pfarmActs(A){const F=S.pfarm;if(!F||dist(player.position.x,player.position.z,PFARM_AT.x,PFARM_AT.z)>8)return;
  const ready=F.oys.filter(o=>o.g>=1).length,grow=F.oys.filter(o=>o.g<1);
  if(ready)A.push(ecrinRoom()>0?{label:'Harvest pearls',sub:`${ready} ready · room for ${ecrinRoom()} in your écrins`,fn:harvestPearls}:{label:'Harvest pearls',sub:`${ready} ready · make an écrin to keep them`,off:true});
  if(F.oys.length<8)A.push(S.inv.nucleus>0?{label:'Graft an oyster',sub:`1 nucleus bead · ${F.oys.length}/8 on the lines`,fn:graft}:{label:'Graft an oyster',sub:'Needs nucleus beads · goélette',off:true});
  if(F.oys.length&&F.clean<0.75)A.push({label:'Clean the oysters',sub:`Lines ${Math.round(F.clean*100)}% clean · better pearls`,cls:'alt',fn:cleanOys});
  if(grow.length){const m=Math.max(...grow.map(o=>o.g));A.push({label:'Pearl farm',sub:`${grow.length} growing · next pearl in about ${Math.max(1,Math.round((1-m)*PEARL.growDays*24))} h`,off:true});}}

/* ----- pearl sheet: écrins and jewellery ----- */
let pearlSel=[];
function canSellHere(){const px=player.position.x,pz=player.position.z;if(S.boat)return false;
  return (S.store&&dist(px,pz,S.store.x,S.store.z)<7)||(S.g2>=3&&g2Dist(px,pz)<7)||(S.stall&&dist(px,pz,S.stall.x,S.stall.z)<6)||dist(px,pz,dockPt(DOCK.r0,0).x,dockPt(DOCK.r0,0).z)<8;}
function pearlDot(p,sel){const C=PEARL.colors[p.c];return`<button class="pearl${sel?' sel':''}" data-pearl="${p.id}" style="--pc:${C.c};--ph:${C.h}" title="${C.n} · ${p.g} · ${p.s} mm"><b>${p.g}</b></button>`;}
function jewelValue(j){return Math.round(j.pearls.reduce((a,p)=>a+pearlValue(p),0)*PEARL.jewels[j.t].mult/100)*100;}
function jewelGrade(j){const sc={A:4,B:3,C:2,D:1},m=j.pearls.reduce((a,p)=>a+sc[p.g],0)/j.pearls.length;return m>=3.5?'A':m>=2.5?'B':m>=1.5?'C':'D';}
function pearlSheet(){$('#sheetTitle').textContent='Écrins';const sell=canSellHere();
  let html=`<p class="small-note">${S.pearls.length} pearl${S.pearls.length===1?'':'s'} · ${S.inv.ecrin||0} écrin${S.inv.ecrin===1?'':'s'} (room for ${Math.max(0,ecrinRoom())} more). Tap pearls to choose them.</p>`;
  const n=Math.max(S.inv.ecrin||0,Math.ceil(S.pearls.length/6));
  if(!n)html+='<p class="small-note">Make an écrin (Craft · Crafts) to keep your pearls.</p>';
  for(let i=0;i<n;i++){const ps=S.pearls.slice(i*6,i*6+6);html+=`<div class="ecrin">${ps.map(p=>pearlDot(p,pearlSel.includes(p.id))).join('')}${'<span class="slot"></span>'.repeat(6-ps.length)}</div>`;}
  const sp=S.pearls.filter(p=>pearlSel.includes(p.id));
  if(sp.length){const v=sp.reduce((a,p)=>a+pearlValue(p),0);
    html+=`<div class="sec">Chosen · ${sp.length}</div><p class="small-note">${sp.map(p=>`${PEARL.colors[p.c].n} ${p.g}, ${p.s} mm`).join(' · ')}</p>`;
    html+=Object.entries(PEARL.jewels).map(([k,J])=>{const ok=sp.length===J.need&&(S.inv.rope||0)>=J.rope;
      return`<div class="recipe"><div class="rinfo"><div class="name">${J.n}</div><div class="tah">${J.need} pearl${J.need>1?'s':''} + ${J.rope} rope${sp.length!==J.need?` · choose exactly ${J.need}`:''}</div></div><button data-jmake="${k}" ${ok?'':'disabled'}>Make</button></div>`;}).join('');
    html+=`<div class="recipe"><div class="rinfo"><div class="name">Sell ${sp.length===1?'this pearl':'these pearls'}</div><div class="tah">${fmtXPF(v)}${sell?'':' · sell at your store, the pension or the wharf'}</div></div><button data-psell="1" ${sell?'':'disabled'}>Sell</button></div>`;}
  const all=S.jewels.slice();
  if(S.wornJewel)html+=`<div class="sec">Wearing</div><div class="recipe"><div class="rinfo"><div class="name">${PEARL.jewels[S.wornJewel.t].n} · grade ${jewelGrade(S.wornJewel)}</div></div><button data-joff="1">Take off</button></div>`;
  if(all.length)html+=`<div class="sec">Jewellery</div>`+all.map((j,i)=>`<div class="recipe"><div class="rinfo"><div class="name"><span class="minipearls">${j.pearls.map(p=>`<i style="--pc:${PEARL.colors[p.c].c};--ph:${PEARL.colors[p.c].h}"></i>`).join('')}</span> ${PEARL.jewels[j.t].n}</div><div class="tah">Grade ${jewelGrade(j)} · ${fmtXPF(jewelValue(j))}</div></div><div class="btns"><button data-jwear="${i}">Wear</button><button data-jsell="${i}" ${sell?'':'disabled'}>Sell</button></div></div>`).join('');
  return html;}
function pearlClick(b){const d=b.dataset;
  if(d.pearl){const id=+d.pearl,i=pearlSel.indexOf(id);if(i>=0)pearlSel.splice(i,1);else pearlSel.push(id);renderSheet();return;}
  if(d.jmake){const J=PEARL.jewels[d.jmake],sp=S.pearls.filter(p=>pearlSel.includes(p.id));if(sp.length!==J.need||(S.inv.rope||0)<J.rope)return;
    S.inv.rope-=J.rope;S.pearls=S.pearls.filter(p=>!pearlSel.includes(p.id));pearlSel=[];const j={t:d.jmake,pearls:sp};S.jewels.push(j);stat('j_'+d.jmake);stat('jewels');
    toast(`You made a ${J.n.toLowerCase()} · grade ${jewelGrade(j)}, worth ${fmtXPF(jewelValue(j))}.`);refresh();return;}
  if(d.psell){if(!canSellHere())return;const sp=S.pearls.filter(p=>pearlSel.includes(p.id)),v=sp.reduce((a,p)=>a+pearlValue(p),0);S.pearls=S.pearls.filter(p=>!pearlSel.includes(p.id));pearlSel=[];stat('pearlsold',sp.length);
    earn(v,_p.set(player.position.x,2.4,player.position.z));refresh();return;}
  if(d.jsell){if(!canSellHere())return;const j=S.jewels.splice(+d.jsell,1)[0];if(!j)return;earn(jewelValue(j),_p.set(player.position.x,2.4,player.position.z));stat('jewelsold');refresh();return;}
  if(d.jwear){const j=S.jewels.splice(+d.jwear,1)[0];if(!j)return;if(S.wornJewel)S.jewels.push(S.wornJewel);S.wornJewel=j;
    if(j.t!=='bracelet'&&S.wear){S.inv[S.wear]=(S.inv[S.wear]||0)+1;S.wear=null;applyWear();}applyJewelWear();floatAtPlayer('Looking good!');refresh();return;}
  if(d.joff){if(S.wornJewel){S.jewels.push(S.wornJewel);S.wornJewel=null;applyJewelWear();refresh();}}}
var jewelMeshes=null;
function applyJewelWear(){if(!PC.neck||!PC.hand)return;
  if(!jewelMeshes){const pm=()=>new THREE.MeshStandardMaterial({color:0x2e3a3a,roughness:0.15,metalness:0.6});
    const neck=new THREE.Group();for(let i=0;i<18;i++){const a=i/18*Math.PI*2,b=new THREE.Mesh(new THREE.SphereGeometry(0.022,8,6),pm());b.position.set(Math.cos(a)*0.16,-0.05-Math.max(0,Math.sin(a))*0.06,Math.sin(a)*0.15+0.02);neck.add(b);}
    const pend=new THREE.Group();const cord=new THREE.Mesh(new THREE.TorusGeometry(0.16,0.006,4,28),std(0x3d2a1a));cord.rotation.x=Math.PI/2+0.5;cord.position.set(0,-0.04,0.03);pend.add(cord);
    const pp=new THREE.Mesh(new THREE.SphereGeometry(0.035,10,8),pm());pp.position.set(0,-0.14,0.16);pend.add(pp);
    const brac=new THREE.Group();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,b=new THREE.Mesh(new THREE.SphereGeometry(0.018,6,5),pm());b.position.set(Math.cos(a)*0.065,0.06,Math.sin(a)*0.065);brac.add(b);}
    jewelMeshes={collier:neck,pendant:pend,bracelet:brac};}
  PC.neck.add(jewelMeshes.collier);PC.neck.add(jewelMeshes.pendant);PC.hand.add(jewelMeshes.bracelet);
  const w=S.wornJewel;for(const k in jewelMeshes)jewelMeshes[k].visible=!!w&&w.t===k;
  if(w){const c=lin(window.FARE_DATA.PEARL.colors[w.pearls[0].c].c);jewelMeshes[w.t].traverse(m=>{if(m.isMesh&&m.material.metalness>0.5)m.material.color.copy(c);});}}

/* ----- beehive ----- */
let hiveMesh=null;const bees=[];
function placeHiveMesh(){if(!S.hive)return;const g=new THREE.Group();
  for(const x of[-0.3,0.3])for(const z of[-0.25,0.25])g.add(cyl(0.035,0.45,MAT.post,x,0.22,z,5));
  const boxM=std(0xe3b77c),boxM2=std(0xd39e62);for(let i=0;i<3;i++)g.add(box(0.75,0.28,0.6,i%2?boxM2:boxM,0,0.6+i*0.29,0));
  g.add(box(0.85,0.07,0.7,MAT.post,0,1.05,0));g.add(box(0.2,0.03,0.05,MAT.dark,0,0.5,0.31));
  g.position.set(S.hive.x,H(S.hive.x,S.hive.z),S.hive.z);g.rotation.y=player.rotation.y;scene.add(g);hiveMesh=g;
  if(!bees.length)for(let i=0;i<14;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(0.03,5,4),MAT.yellow);b.userData={a:Math.random()*6,r:0.4+Math.random()*1.4,s:0.8+Math.random()*1.5,y:0.4+Math.random()*1.2};scene.add(b);bees.push(b);}}
function flowersNear(x,z){let n=0;const FL={tiare:1,vanilla:1,lime:1,papaya:0.7,banana:0.5,pineapple:0.5,uru:0.5};
  for(const c of S.crops)if(c.g>=0.6&&(FL[c.type]=FL[c.type]||CROPS[c.type].flowers)&&dist(c.x,c.z,x,z)<14)n+=FL[c.type];
  for(const b of bushes)if(dist(b.x,b.z,x,z)<14)n+=1;
  for(const p of S.palms)if(p.state!=='stump'&&p.g>=1&&dist(p.x,p.z,x,z)<14)n+=0.3;return Math.round(n*10)/10;}
function hiveActs(h,A){const fl=flowersNear(h.x,h.z);
  A.push(h.honey>0?{label:'Harvest honey',sub:`+${h.honey} jar${h.honey>1?'s':''} of meli`,fn:()=>{const n=h.honey;give({meli:n});stat('honey',n);h.honey=0;chopT=0.4;floatText(`+${n} meli`,_p.set(h.x,H(h.x,h.z)+1.4,h.z));refresh();}}
    :{label:'Beehive',sub:`${fl} flowers nearby · ${fl<3?'plant tiare and hibiscus nearby':'the bees are busy'}`,off:true});}

/* ----- small port ----- */
const PORT_C=dockPt(39.3,6.6),PORT_AT=dockPt(36.4,5.2);
let portMesh=null;
function placePort(){if(!S.port||portMesh)return;const g=new THREE.Group();
  g.add(box(4.2,2.3,6.0,MAT.basalt2,0,-0.6,0));g.add(box(4.3,0.12,6.1,MAT.concrete,0,0.58,0));
  for(const z of[-2.4,-0.6,1.2,2.8]){g.add(cyl(0.12,0.3,MAT.dark,-2.0,0.78,z,8));}
  g.add(box(0.06,0.5,6.0,MAT.dark,-2.16,0.3,0));
  const crane=new THREE.Group();crane.add(cyl(0.35,0.4,MAT.yellow,0,0.8,0,10));crane.add(box(0.3,4.0,0.3,MAT.yellow,0,2.9,0));
  const jib=box(0.22,0.22,4.2,MAT.yellow,0,4.7,-1.6);jib.rotation.x=-0.18;crane.add(jib);crane.add(box(0.6,0.6,0.6,MAT.dark,0,4.6,0.7));
  crane.add(cyl(0.012,2.4,MAT.dark,0,3.9,-3.4,4));crane.add(box(0.5,0.4,0.5,MAT.red,0,2.6,-3.4));crane.position.set(0.9,0,1.6);crane.rotation.y=-1.2;g.add(crane);
  const cA=box(1.2,1.1,2.6,MAT.red,0.9,1.2,-1.6),cB=box(1.2,1.1,2.6,MAT.blue,0.9,2.32,-1.6),cC=box(1.2,1.1,2.6,std(0x3f8a3a),-0.5,1.2,-1.6);g.add(cA,cB,cC);
  for(let i=0;i<4;i++)g.add(box(0.55,0.5,0.55,MAT.wood,-1.2+i*0.6,0.9,1.9+(i%2)*0.4));
  g.position.set(PORT_C.x,0,PORT_C.z);g.rotation.y=DOCK_YAW;scene.add(g);
  const shed=new THREE.Group();shed.add(box(3.0,1.8,2.2,std(0xd9e2e6),0,0.9,0));const sr=box(3.3,0.08,2.6,std(0x9aa4a7),0,1.85,0);sr.rotation.x=0.1;shed.add(sr);
  shed.add(box(1.2,1.3,0.04,MAT.dark,0,0.65,1.11));shed.add(box(1.6,0.35,0.04,v9Sign('PORT','#2c4a6a','#fff8ea',1.6,0.35),0,1.55,1.13));
  const sp=dockPt(34.0,6.8);shed.position.set(sp.x,H(sp.x,sp.z),sp.z);shed.rotation.y=DOCK_YAW+Math.PI;scene.add(shed);
  portMesh={g,shed};applyPortPrices();}
function applyPortPrices(){SHOP.forEach(it=>{if(it.p0==null)it.p0=it.price;it.price=S.port?Math.round(it.p0*0.8/10)*10:it.p0;});}
function portActs(A){const done=S.cargoDay===S.day;
  A.push(!goePresent()?{label:'Small port',sub:'The goélette unloads here in the morning · prices 20% lower',off:true}
   :done?{label:'Small port',sub:'Cargo unloaded today · come back tomorrow',off:true}
   :{label:'Unload the cargo',sub:'+1 500 XPF dock fee · goods for your store',fn:()=>{S.cargoDay=S.day;give({rice:2,sugar:2,coffee:1});stat('cargo');chopT=0.8;earn(1500,_p.set(player.position.x,2.4,player.position.z));toast('Cargo unloaded: rice, sugar and coffee for your store, and a dock fee.');refresh();}});}

/* ----- helipad and helicopter ----- */
let heliPad=null,heli=null;const HELI={state:'idle',t:0,n:null};
function makeHeli(){const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  const hull=mesh(new THREE.SphereGeometry(0.75,16,12),MAT.red,0,1.05,0.1);hull.scale.set(0.85,0.8,1.25);body.add(hull);
  const gl=mesh(new THREE.SphereGeometry(0.62,14,10,0,Math.PI*2,0,Math.PI/2),MAT.glass,0,1.1,0.55);gl.rotation.x=1.25;gl.scale.set(0.95,0.8,0.9);body.add(gl);
  const boom=cyl(0.1,2.4,MAT.red,0,1.25,-1.7,8);boom.rotation.x=Math.PI/2;body.add(boom);body.add(box(0.05,0.55,0.35,MAT.red,0,1.5,-2.85));
  for(const sd of[-1,1]){const sk=cyl(0.04,1.9,MAT.dark,sd*0.55,0.2,0,6);sk.rotation.x=Math.PI/2;body.add(sk);for(const z of[-0.4,0.45])body.add(cyl(0.03,0.6,MAT.dark,sd*0.5,0.5,z,5));}
  body.add(cyl(0.08,0.35,MAT.dark,0,1.85,0,6));
  const rotor=new THREE.Group();rotor.position.set(0,2.05,0);for(const a of[0,Math.PI/2]){const bl=box(4.2,0.03,0.18,MAT.dark,0,0,0);bl.rotation.y=a;rotor.add(bl);}body.add(rotor);
  const tr=new THREE.Group();tr.position.set(0.08,1.5,-2.85);tr.add(box(0.02,0.7,0.08,MAT.dark,0,0,0));body.add(tr);
  g.userData={rotor,tr,body};return g;}
function placeHelipad(){if(!S.helipad||heliPad)return;const p=S.helipad,g=new THREE.Group(),y=H(p.x,p.z);
  g.add(cyl(2.7,0.3,MAT.concrete,0,0.0,0,32));
  const hm=v9Sign('H','#b9bcb6','#fbf3e2',1,1);hm.map.repeat.set(1,1);const top=mesh(new THREE.CircleGeometry(2.4,32),new THREE.MeshStandardMaterial({map:(()=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#a9aca6';x.fillRect(0,0,256,256);
    x.strokeStyle='#fbf3e2';x.lineWidth=10;x.beginPath();x.arc(128,128,110,0,Math.PI*2);x.stroke();x.fillStyle='#fbf3e2';x.fillRect(80,60,24,136);x.fillRect(152,60,24,136);x.fillRect(80,116,96,24);const t=new THREE.CanvasTexture(x.canvas);t.encoding=THREE.sRGBEncoding;return t;})(),roughness:0.9}),0,0.16,0,false);
  top.rotation.x=-Math.PI/2;g.add(top);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.add(mesh(new THREE.SphereGeometry(0.07,6,5),new THREE.MeshBasicMaterial({color:0xffc83d}),Math.cos(a)*2.6,0.2,Math.sin(a)*2.6,false));}
  g.add(cyl(0.04,2.4,MAT.post,2.9,1.2,0,5));const sock=mesh(new THREE.ConeGeometry(0.16,0.7,8,1,true),std(0xf2a33a,{side:THREE.DoubleSide}),3.25,2.25,0);sock.rotation.z=Math.PI/2;g.add(sock);g.userData.sock=sock;
  g.position.set(p.x,y,p.z);scene.add(g);heliPad=g;heli=makeHeli();heli.position.set(p.x,y+0.15,p.z);heli.rotation.y=p.rot||0;scene.add(heli);}
function heliPath(t){const p=S.helipad,y0=H(p.x,p.z)+0.15,a0=Math.atan2(p.z,p.x);
  if(t<5){const k=smooth(0,5,t);return{x:p.x,y:y0+k*14,z:p.z,yaw:(p.rot||0)+k*1.2,tilt:0};}
  if(t<36){const k=(t-5)/31,a=a0+k*Math.PI*2,rad=24+Math.sin(k*Math.PI)*16,bl=smooth(0,0.12,k)*(1-smooth(0.88,1,k));
    const cx=Math.cos(a)*rad,cz=Math.sin(a)*rad,x=p.x+(cx-p.x)*bl,z=p.z+(cz-p.z)*bl;return{x,y:y0+14+Math.sin(k*Math.PI)*6,z,yaw:-a,tilt:0.18};}
  const k=smooth(36,42,t);return{x:p.x,y:y0+14*(1-k),z:p.z,yaw:(p.rot||0)+1.2*(1-k),tilt:0};}
function helipadActs(A){if(HELI.state==='flight'){A.push({label:'Scenic flight',sub:`In the air with ${HELI.n?HELI.n.name:'a guest'} · back soon`,off:true});return;}
  const day=S.tod>0.27&&S.tod<0.76;if(!day){A.push({label:'Helipad',sub:'Flights run in the daytime',off:true});return;}
  if(stormy()||S.weather.w>0.85){A.push({label:'Helipad',sub:'Too windy to fly today',off:true});return;}
  const g=S.npcs.find(n=>n.role==='guest'&&n.state!=='leave'&&!n.heli);
  A.push(g?{label:'Scenic flight',sub:`Fly ${g.name} over the island · 8 000 XPF`,fn:()=>startHeli(g)}:{label:'Helipad',sub:'No guest waiting for a flight',off:true});}
function startHeli(n){HELI.state='flight';HELI.t=0;HELI.n=n;n.heli=true;toast(`${n.name} climbs aboard. The helicopter lifts off over the lagoon!`);manuSay(MANU_LINES.heli[0],4);actSig='';}
function updateHeli(dt,t){if(!heli)return;const U=heli.userData;
  if(HELI.state==='flight'){HELI.t+=dt;const P=heliPath(HELI.t);heli.position.set(P.x,P.y,P.z);heli.rotation.y=P.yaw;U.body.rotation.x=P.tilt;U.rotor.rotation.y+=dt*30;U.tr.rotation.x+=dt*40;
    if(HELI.n&&HELI.n.body)HELI.n.body.group.visible=false;
    if(HELI.t>=42){HELI.state='idle';const n=HELI.n;HELI.n=null;if(n&&n.body)n.body.group.visible=true;stat('heliflights');earn(8000,_p.set(heli.position.x,3,heli.position.z));
      toast(`${n?n.name:'Your guest'} loved the flight over the reef and the mountain! +8 000 XPF`);actSig='';refresh();}}
  else{U.rotor.rotation.y+=dt*0.0;U.body.rotation.x=0;}
  if(heliPad)heliPad.userData.sock.rotation.y=Math.sin(t*0.7)*0.4+S.weather.w*0.6;}

/* ----- dispensary ----- */
let dispMesh=null,nurse=null;const HURTS=['a coral cut','a sunburn','sea urchin spines','a jellyfish sting','a twisted ankle'];
function placeDisp(){if(!S.disp||dispMesh)return;const p=S.disp,g=new THREE.Group();
  g.add(box(4.2,0.25,3.4,MAT.concrete,0,0.12,0));const wall=std(0xf6f1e6);
  g.add(box(4.0,2.2,0.12,wall,0,1.35,-1.4));for(const sd of[-1,1])g.add(box(0.12,2.2,2.8,wall,sd*1.95,1.35,0));
  g.add(box(1.5,2.2,0.12,wall,-1.25,1.35,1.4));g.add(box(1.5,2.2,0.12,wall,1.25,1.35,1.4));g.add(box(1.0,0.5,0.12,wall,0,2.2,1.4));
  const rf=box(4.6,0.1,3.9,std(0x7fa7b8),0,2.55,0.1);rf.rotation.x=0.07;g.add(rf);const ve=box(4.4,0.06,1.4,std(0x9aa4a7),0,2.25,2.2);ve.rotation.x=0.18;g.add(ve);
  for(const x of[-2.0,2.0])g.add(cyl(0.05,2.1,MAT.post,x,1.15,2.8,6));
  g.add(box(2.2,0.5,0.06,v9Sign('DISPENSAIRE','#2fa36b','#ffffff',2.2,0.5),0,2.75,1.5));
  const crossM=std(0x2fa36b,{emissive:0x1a6a40});g.add(box(0.12,0.5,0.06,crossM,1.6,1.8,1.47));g.add(box(0.5,0.12,0.06,crossM,1.6,1.8,1.47));
  g.add(box(1.4,0.08,0.4,MAT.wood,-1.2,0.6,2.4));
  g.position.set(p.x,H(p.x,p.z),p.z);g.rotation.y=p.rot||0;scene.add(g);dispMesh=g;
  nurse=makeCharacter({skin:std(0xa8703f,{flatShading:false}),top:std(0xffffff,{flatShading:false}),bottom:std(0x2c7fb8,{flatShading:false}),hair:std(0x1c1410,{flatShading:false}),hairStyle:'bun',eye:0x3b2414,build:1,tiare:true});
  const f=dispFront();nurse.group.position.set(f.x,H(f.x,f.z),f.z);nurse.group.rotation.y=p.rot||0;scene.add(nurse.group);}
function dispFront(){const a=S.disp.rot||0;return{x:S.disp.x+Math.sin(a)*2.4,z:S.disp.z+Math.cos(a)*2.4};}
function treat(n){const h=n.hurt;n.hurt=null;n.cared=true;stat('treated');chopT=0.3;
  toast(`Teura, the nurse, takes care of ${n.name}’s ${h.replace(/^an? /,'')}. ${n.name} feels much better. Māuruuru!`);floatText('♥',_p.set(n.x,2.3,n.z));earn(500,_p.set(n.x,2.6,n.z));refresh();}
function v9GuestActions(n,A){if(n.hurt)A.unshift(S.disp?{label:`Care for ${n.name}`,sub:`${n.hurt} · the nurse at the dispensary helps`,fn:()=>treat(n)}:{label:`${n.name} is hurt`,sub:`${n.hurt} · build a dispensary`,off:true});}

/* ----- hooks ----- */
function v9Place(what,c){
  if(what==='hive'){S.hive={x:c.x,z:c.z,honey:0,t:0};placeHiveMesh();toast('The bees move into their new hive. More flowers nearby means more honey.');return true;}
  if(what==='helipad'){S.helipad={x:c.x,z:c.z,rot:player.rotation.y};placeHelipad();toast('Your helipad is ready! Bring a guest for a scenic flight. More guests will come, too.');return true;}
  if(what==='disp'){S.disp={x:c.x,z:c.z,rot:player.rotation.y+Math.PI};placeDisp();toast('The dispensary is open. Teura, the nurse, will care for your guests’ small injuries.');return true;}
  return false;}
function v9PlaceCheck(what){if(!['hive','helipad','disp'].includes(what))return null;
  if(S[what])return{ok:false,why:`You already have ${{hive:'a beehive',helipad:'a helipad',disp:'a dispensary'}[what]}`};
  const d=what==='hive'?1.6:3.4,{x,z}=ahead(d),h=H(x,z);if(h<0.35||h>3.8)return{ok:false,why:'Stand on flat ground to build it'};
  const rad=what==='hive'?1.2:2.9;if(occupied(x,z,rad))return{ok:false,why:'Too close to something. Find open ground.'};
  if(what!=='hive'){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;if(Math.abs(H(x+Math.cos(a)*2.6,z+Math.sin(a)*2.6)-h)>0.9||H(x+Math.cos(a)*2.6,z+Math.sin(a)*2.6)<0.1)return{ok:false,why:'The ground here is too uneven. Find a flatter spot.'};}}
  return{ok:true,x,z};}
function v9SpecialCheck(sp){
  if(sp==='ponton'){if(!S.taurua)return{ok:false,why:'Build the vaʻa taurua first'};if(S.ponton)return{ok:false,why:'The ponton is already built'};}
  if(sp==='pfarm'&&S.pfarm)return{ok:false,why:'You already have a pearl farm'};
  if(sp==='port'&&S.port)return{ok:false,why:'The port is already built'};return{ok:true};}
function v9DoSpecial(sp){
  if(sp==='ponton'){S.ponton=true;placePonton();toast('The ponton floats at the end of the wharf. Lagoon tours now take 4 visitors and pay more.');}
  if(sp==='pfarm'){S.pfarm={oys:[],clean:1};placePfarm();toast('Your pearl farm stands in the lagoon. Paddle out to graft oysters with nucleus beads.');}
  if(sp==='port'){S.port=true;placePort();toast('The small port is built beside the wharf. The goélette unloads here and its prices drop by 20%.');}}
function v9Occupied(x,z,d){return S.fields.some(f=>dist(f.x,f.z,x,z)<d+1.1)||(S.hive&&dist(S.hive.x,S.hive.z,x,z)<d+0.5)||(S.helipad&&dist(S.helipad.x,S.helipad.z,x,z)<d+2.6)||(S.disp&&dist(S.disp.x,S.disp.z,x,z)<d+2.4);}
function v9Obstacles(list){if(S.hive)list.push([S.hive.x,S.hive.z,0.55]);if(S.disp)list.push([S.disp.x,S.disp.z,2.1]);
  if(S.port)for(const a of[37.4,39.3,41.2])for(const s of[5.4,7.8]){const p=dockPt(a,s);list.push([p.x,p.z,1.2]);}}
const V9T={field:1,hive:1,helipad:1,disp:1,port:1};
function v9Candidates(add){for(const f of S.fields)add('field',f,f.x,f.z,0.9);if(S.hive)add('hive',S.hive,S.hive.x,S.hive.z,0.5);
  if(S.helipad)add('helipad',S.helipad,S.helipad.x,S.helipad.z,2.4);if(S.disp){const f=dispFront();add('disp',S.disp,f.x,f.z,0.6);}if(S.port)add('port',null,PORT_AT.x,PORT_AT.z,1.6);}
function v9Actions(t,o,A){if(t==='field')fieldActs(o,A);else if(t==='hive')hiveActs(o,A);else if(t==='helipad')helipadActs(A);else if(t==='port')portActs(A);
  else if(t==='disp'){const hurt=S.npcs.filter(n=>n.role==='guest'&&n.hurt&&n.state!=='leave');A.push({label:'Dispensary',sub:hurt.length?`${hurt.map(n=>n.name).join(', ')} need${hurt.length>1?'':'s'} care · talk to them`:'Teura, the nurse, is on duty',off:true});}}
function v9Extra(A,tg){if(S.boat)return;const px=player.position.x,pz=player.position.z;
  if(S.level>=14&&!tg&&(S.inv.pelle>0||S.inv.oo>0)&&!onFloor(px,pz)){const c=tillCheck();A.push(c.ok?{label:'Till a garden bed',sub:'Faʻaapu · for ʻumara and manioc',fn:()=>till(c)}:{label:'Till a garden bed',sub:c.why,off:true});}}
function v9BoatActions(A){pfarmActs(A);}
function v9Sim(dt,quiet){const grow=1+0.6*S.weather.r;
  for(const f of S.fields)if(f.type&&f.g<1){f.g=Math.min(1,f.g+dt*grow/CROPS2[f.type].grow);}
  const F=S.pfarm;if(F){F.clean=Math.max(0,(F.clean==null?1:F.clean)-dt/(DAY_LEN*0.8));
    for(const o of F.oys)if(o.g<1){o.g=Math.min(1,o.g+dt/(PEARL.growDays*DAY_LEN)*(0.5+0.5*F.clean));o.q+=F.clean*dt;o.t+=dt;if(o.g>=1&&!quiet){toast('A pearl is ready at the pearl farm!');actSig='';}}}
  const h=S.hive,day=S.tod>0.26&&S.tod<0.78;if(h&&day&&h.honey<6){h.t+=dt*(1+flowersNear(h.x,h.z)*0.6);if(h.t>=360){h.t=0;h.honey++;if(!quiet&&h.honey===1)toast('The bees have made honey!');}}
  if(S.helipad&&S.g2>=3&&day)S.pension.next-=dt*0.4;
  if(S.disp)for(const n of S.npcs)if(n.role==='guest'&&n.state!=='leave'&&!n.hurt&&!n.hurtOnce&&Math.random()<dt/500){n.hurt=HURTS[Math.floor(Math.random()*HURTS.length)];n.hurtOnce=true;
    if(!quiet){toast(`${n.name} got ${n.hurt}. Take them to see the nurse at the dispensary.`);actSig='';}}}
let v9T=0;
function updateV9(dt,t){
  for(const f of S.fields)if(f.mesh&&f.type){const P=f.mesh.userData.plants;P.scale.setScalar(0.15+0.85*f.g);if(f.type==='kumara')P.traverse(m=>{if(m.name==='tuber')m.visible=f.g>=1;});
    P.children.forEach((p,i)=>{p.rotation.z=Math.sin(t*1.6+i)*0.04*(0.4+S.weather.w);});}
  const dayB=S.tod>0.26&&S.tod<0.78&&S.weather.r<0.5;
  bees.forEach((b,i)=>{b.visible=!!S.hive&&dayB;if(!b.visible)return;const u=b.userData;u.a+=dt*u.s;b.position.set(S.hive.x+Math.cos(u.a)*u.r,H(S.hive.x,S.hive.z)+u.y+Math.sin(t*3+i)*0.15,S.hive.z+Math.sin(u.a*1.3)*u.r);});
  updateHeli(dt,t);
  if(nurse){nurse.arms[0].rotation.x=Math.sin(t*0.8)*0.1;}
  const showPax=S.ponton&&!S.tour&&S.tod>0.3&&S.tod<0.74;
  if(showPax&&!pontonPax.length&&pontonMesh){for(let i=0;i<2;i++){const b=makePerson(Math.floor(Math.random()*1e9));const v=new THREE.Vector3(i?0.5:-0.4,0.45,i?1.3:0.9);pontonMesh.localToWorld(v);b.group.position.copy(v);b.group.rotation.y=DOCK_YAW+(i?2.4:-2.6);scene.add(b.group);pontonPax.push(b);}}
  if(!showPax&&pontonPax.length){pontonPax.forEach(b=>scene.remove(b.group));pontonPax=[];}
  if(pfarmMesh)pfarmMesh.lines.children.forEach((c,i)=>{c.position.y=0.05+Math.sin(t*1.4+i*0.7)*0.05;});
  v9T-=dt;if(v9T<=0){v9T=0.5;const show=!!(S.pfarm||S.pearls.length||S.jewels.length||S.wornJewel);$('#pearlBtn').hidden=!show||lookOpen;}}
$('#pearlBtn').onclick=()=>{pearlSel=[];openSheet(sheetMode==='pearls'?null:'pearls');};

/* ----- ground details: ferns, beach vines, flowers ----- */
const fernGeo=(()=>{const p=[];const N=9;for(let k=0;k<N;k++){const a=k/N*Math.PI*2+0.3,ca=Math.cos(a),sa=Math.sin(a),L=0.55+(k%3)*0.12;
  for(let i=0;i<8;i++){const t0=i/8,t1=(i+1)/8,r0=L*t0,r1=L*t1,y0=Math.sin(t0*Math.PI*0.8)*0.34,y1=Math.sin(t1*Math.PI*0.8)*0.34,w=0.065*(1-t0*0.7);
    const x0=ca*r0,z0=sa*r0,x1=ca*r1,z1=sa*r1,nx=-sa*w,nz=ca*w;
    p.push(x0+nx,y0,z0+nz, x1,y1,z1, x0-nx,y0,z0-nz);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;})();
const fernMat=swayMat(0xffffff,1.4);fernMat.side=THREE.DoubleSide;
scatter(coarse?110:190,fernGeo,fernMat,rand=>{const[x,z]=rp(rand,6,R-4),h=H(x,z);if(h<2.2||h>9||!clearGround(x,z,1.2))return null;return{x,y:h-0.02,z,s:0.7+rand()*0.7};},
  (rand,c)=>c.setHSL(0.27+rand()*0.06,0.55,0.22+rand()*0.08));
const vineGeo=(()=>{const g=new THREE.CircleGeometry(0.16,6);g.rotateX(-Math.PI/2);return g;})();
scatter(coarse?380:640,vineGeo,std(0xffffff,{roughness:0.8}),rand=>{const a=rand()*Math.PI*2,cl=Math.floor(a*9)/9,[x,z]=[Math.cos(cl+rand()*0.06)*(R-2.5-rand()*3),Math.sin(cl+rand()*0.06)*(R-2.5-rand()*3)],h=H(x,z);if(h<0.25||h>0.9||!clearGround(x,z,0.6))return null;return{x,y:h+0.03,z,s:0.35+rand()*0.5,rx:(rand()-0.5)*0.5,rz:(rand()-0.5)*0.5};},
  (rand,c)=>c.setHSL(0.26+rand()*0.05,0.55,0.24+rand()*0.08));
scatter(coarse?70:120,new THREE.SphereGeometry(0.06,6,4),std(0xffffff,{roughness:0.6}),rand=>{const a=rand()*Math.PI*2,cl=Math.floor(a*9)/9,[x,z]=[Math.cos(cl+rand()*0.06)*(R-2.5-rand()*3),Math.sin(cl+rand()*0.06)*(R-2.5-rand()*3)],h=H(x,z);if(h<0.25||h>0.9||!clearGround(x,z,0.6))return null;return{x,y:h+0.07,z,s:0.9+rand()*0.5,sy:0.5};},
  (rand,c)=>c.set(rand()<0.8?0xc58ad8:0xffffff));

/* ----- place saved things ----- */
placePonton();placePfarm();placeHiveMesh();placePort();placeHelipad();placeDisp();S.fields.forEach(makeField);applyHat();applyPortPrices();

function groundDetail(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=mulberry32(4242);
  g.fillStyle='rgb(238,238,238)';g.fillRect(0,0,256,256);
  for(let i=0;i<160;i++){const x=r()*256,y=r()*256,s=10+r()*34,v=Math.round(218+r()*37);g.fillStyle=`rgba(${v},${v},${v},0.35)`;g.beginPath();g.ellipse(x,y,s,s*(0.5+r()*0.5),r()*3,0,Math.PI*2);g.fill();}
  for(let i=0;i<5200;i++){const x=r()*256,y=r()*256,v=Math.round(200+r()*55);g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x,y,1+r()*1.6,1+r()*1.6);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(52,52);t.anisotropy=4;return t;}
/* =========================================================
   v10: street lamps (oil, solar, generator), lamp colours,
        new flowers and trees, flower beds, gift milestones
   ========================================================= */
var LAMPCOL=window.FARE_DATA.LAMPCOL,MILESTONES=window.FARE_DATA.MILESTONES;
const MAX_LAMPS=12,MAX_PARTERRES=8;
/* ----- new plants ----- */
MAT.bougain=std(0xd6359a);MAT.bougain2=std(0xe85ab0);MAT.tainaF=std(0xfbf8f0);MAT.puaF=std(0xf6e3a0);MAT.glossy=std(0x2e6a2e,{roughness:0.5});MAT.glossy2=std(0x3d7e34,{roughness:0.5});
MAT.nonoF=std(0xe9e6b8);MAT.tamanuF=std(0x7fae4a);MAT.mapeF=std(0xb48a4a);MAT.barkG=std(0x6e6458);MAT.barkR=std(0x7a4a2a);MAT.santL=std(0x6a9a4a);
function blobCrown(crown,n,rad,size,mats,seed,yOff){const r=mulberry32(seed);for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r(),d=i?rad*(0.6+r()*0.4):0;
  crown.add(mesh(noisyGeo(new THREE.IcosahedronGeometry(size*(0.8+r()*0.4),1),size*0.3,seed+i),mats[i%mats.length],Math.cos(a)*d,(yOff||0)+(i?r()*size*0.6:size*0.5),Math.sin(a)*d));}}
function flowerDots(bunch,n,mat,rad,y0,y1,size,seed,shape){const r=mulberry32(seed);for(let i=0;i<n;i++){const a=r()*Math.PI*2,y=y0+r()*(y1-y0),d=rad*(0.75+r()*0.3);
  const f=mesh(shape||new THREE.SphereGeometry(size,6,5),mat,Math.cos(a)*d,y,Math.sin(a)*d,false);f.scale.y=0.6;bunch.add(f);}}
function makeV10Crop(c){const s=c.seed,r=mulberry32(s),g=new THREE.Group(),crown=new THREE.Group(),bunch=new THREE.Group();g.add(crown);g.add(bunch);
  const T=c.type;
  if(T==='bougain'){for(let i=0;i<4;i++){const st=cyl(0.03,1.4,MAT.trunk,(r()-0.5)*0.4,0.6,(r()-0.5)*0.4,5);st.rotation.set((r()-0.5)*0.6,0,(r()-0.5)*0.6);g.add(st);}
    blobCrown(crown,5,0.5,0.4,[MAT.bushDark,MAT.bush],s,0.8);flowerDots(bunch,26,MAT.bougain,0.62,0.6,1.5,0.09,s+1);flowerDots(bunch,10,MAT.bougain2,0.55,0.9,1.5,0.08,s+2);}
  else if(T==='taina'){blobCrown(crown,5,0.4,0.36,[MAT.glossy,MAT.glossy2],s,0.35);flowerDots(bunch,12,MAT.tainaF,0.55,0.4,1.0,0.075,s+1,new THREE.IcosahedronGeometry(0.075,0));}
  else if(T==='pua'){g.add(cyl(0.09,1.4,MAT.trunk,0,0.7,0,6));crown.position.y=1.3;blobCrown(crown,6,0.6,0.5,[MAT.glossy2,MAT.bushDark],s,0);
    bunch.position.y=1.3;flowerDots(bunch,14,MAT.puaF,0.85,-0.1,0.7,0.08,s+1);}
  else if(T==='nono'){g.add(cyl(0.1,1.6,MAT.barkG,0,0.8,0,6));crown.position.y=1.7;
    for(let i=0;i<14;i++){const a=r()*Math.PI*2,l=mesh(taroLeafGeo,MAT.glossy2,Math.cos(a)*0.55,(r()-0.4)*0.8,Math.sin(a)*0.55);l.scale.setScalar(0.75);l.rotation.set(-0.3,-a+Math.PI/2,0.2);crown.add(l);}
    bunch.position.y=1.5;for(let i=0;i<4;i++){const a=i*1.6,f=mesh(noisyGeo(new THREE.SphereGeometry(0.11,8,6),0.03,s+i),MAT.nonoF,Math.cos(a)*0.35,0,Math.sin(a)*0.35);f.scale.y=1.4;bunch.add(f);}}
  else if(T==='tamanu'){const tr=mesh(new THREE.CylinderGeometry(0.22,0.4,2.6,9),MAT.barkG,0,1.3,0);tr.rotation.z=0.12;g.add(tr);
    for(let i=0;i<4;i++){const br=cyl(0.09,1.8,MAT.barkG,0,0,0,6);br.position.set(Math.cos(i*1.6)*0.7,2.6,Math.sin(i*1.6)*0.7);br.rotation.set(Math.sin(i*1.6)*1.0,0,-Math.cos(i*1.6)*1.0);g.add(br);}
    crown.position.y=3.0;blobCrown(crown,9,1.7,0.95,[MAT.glossy,MAT.glossy2,MAT.leafUru2],s,0);
    bunch.position.y=2.8;for(let i=0;i<8;i++){const a=i/8*Math.PI*2;bunch.add(mesh(new THREE.SphereGeometry(0.12,8,6),MAT.tamanuF,Math.cos(a)*1.9,-0.4+r()*0.5,Math.sin(a)*1.9));}}
  else if(T==='santal'){g.add(cyl(0.08,1.8,MAT.barkR,0,0.9,0,6));crown.position.y=1.9;blobCrown(crown,6,0.55,0.45,[MAT.santL,MAT.bush],s,0);
    bunch.position.y=1.8;flowerDots(bunch,10,std(0x8a3a5a),0.75,-0.1,0.5,0.05,s+1);}
  else if(T==='mape'){g.add(mesh(new THREE.CylinderGeometry(0.28,0.42,3.2,10),MAT.barkG,0,1.6,0));
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2+0.3,fin=box(0.08,0.9,0.9,MAT.barkG,Math.cos(a)*0.45,0.42,Math.sin(a)*0.45);fin.rotation.y=-a+Math.PI/2;g.add(fin);}
    crown.position.y=3.5;blobCrown(crown,8,1.5,1.0,[MAT.leafUru,MAT.leafUru2,MAT.bushDark],s,0);
    bunch.position.y=3.0;for(let i=0;i<6;i++){const a=i/6*Math.PI*2,f=mesh(new THREE.SphereGeometry(0.16,8,6),MAT.mapeF,Math.cos(a)*1.4,-0.2+r()*0.4,Math.sin(a)*1.4);f.scale.set(1.2,0.8,0.9);bunch.add(f);}}
  else return null;
  return{group:g,crown,bunch,phase:r()*6};}

/* ----- gift milestones ----- */
let msT=3;
function checkMilestones(){for(const m of MILESTONES){if(S.flags[m.k]||!m.chk(S))continue;S.flags[m.k]=1;give(m.give);
  const[k,v]=Object.entries(m.give)[0];toast(`A gift! ${m.from} gives you ${v} ${ITEMS[k].n.toLowerCase()}${v>1&&!/s$/.test(ITEMS[k].n)?'s':''} (for: ${m.t.toLowerCase()}).`);
  manuSay(MANU_LINES.gift[Math.floor(Math.random()*MANU_LINES.gift.length)],4);refresh();return;}}

/* ----- flower beds ----- */
function makeParterre(p){const g=new THREE.Group(),r=mulberry32(p.seed);
  const soil=mesh(new THREE.CylinderGeometry(1.0,1.05,0.16,20),MAT.tilled,0,0.04,0);soil.castShadow=false;g.add(soil);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,st=mesh(rockGeo,i%2?MAT.basalt:MAT.basalt2,Math.cos(a)*1.05,0.08,Math.sin(a)*1.05);st.scale.set(0.22,0.16,0.18);st.rotation.y=a;g.add(st);}
  const mats=[MAT.bougain,MAT.tainaF,MAT.tiare,std(0xde4634),MAT.puaF,MAT.bougain2];
  for(let i=0;i<9;i++){const a=r()*Math.PI*2,d=r()*0.7,b=new THREE.Group();b.position.set(Math.cos(a)*d,0.12,Math.sin(a)*d);
    b.add(mesh(new THREE.IcosahedronGeometry(0.2,0),MAT.bush,0,0.12,0));const m=mats[i%mats.length];
    for(let k=0;k<5;k++)b.add(mesh(new THREE.SphereGeometry(0.06,6,4),m,(r()-0.5)*0.32,0.22+r()*0.12,(r()-0.5)*0.32,false));g.add(b);}
  g.position.set(p.x,H(p.x,p.z),p.z);world.add(g);p.mesh=g;}

/* ----- street lamps ----- */
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.25,'rgba(255,255,255,0.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const LAMP_LIGHTS=(coarse?[0,1,2]:[0,1,2,3]).map(()=>{const l=new THREE.PointLight(0xffcf73,0,13,1.4);scene.add(l);return l;});
MAT.metal=std(0x3a4448,{roughness:0.45,metalness:0.5});
function makeLampMesh(L){const g=new THREE.Group(),col=lin(LAMPCOL[L.col]||LAMPCOL.warm?(LAMPCOL[L.col]||LAMPCOL.warm).c:'#ffcf73');
  const bulbM=new THREE.MeshStandardMaterial({color:0xffffff,emissive:col.clone(),emissiveIntensity:0,roughness:0.3,transparent:true,opacity:0.9});
  let top=2.35;
  g.add(cyl(0.22,0.18,MAT.basalt2,0,0.09,0,8));
  if(L.type==='oil'){g.add(cyl(0.06,2.2,MAT.post,0,1.2,0,6));g.add(box(0.5,0.05,0.06,MAT.post,0.2,2.15,0));
    const lan=new THREE.Group();lan.position.set(0.4,1.9,0);lan.add(box(0.24,0.3,0.24,bulbM,0,0,0));lan.add(box(0.3,0.05,0.3,MAT.dark,0,0.17,0));lan.add(cyl(0.02,0.18,MAT.dark,0,0.25,0,4));
    for(const x of[-0.12,0.12])for(const z of[-0.12,0.12])lan.add(box(0.025,0.3,0.025,MAT.dark,x,0,z));g.add(lan);top=1.9;g.userData.lx=0.4;}
  else if(L.type==='solar'){g.add(cyl(0.05,2.6,MAT.metal,0,1.4,0,8));const pn=box(0.7,0.04,0.45,std(0x2c4a6a,{roughness:0.3,metalness:0.3}),0,2.78,0);pn.rotation.x=-0.5;g.add(pn);
    g.add(box(0.5,0.05,0.05,MAT.metal,0.22,2.45,0));const b=mesh(new THREE.CylinderGeometry(0.16,0.2,0.12,12),bulbM,0.42,2.38,0);g.add(b);top=2.33;g.userData.lx=0.42;}
  else{g.add(cyl(0.06,2.9,MAT.metal,0,1.55,0,8));const arm=box(0.7,0.05,0.05,MAT.metal,0.3,2.95,0);g.add(arm);
    const b=mesh(new THREE.SphereGeometry(0.17,14,10),bulbM,0.6,2.85,0);g.add(b);g.add(mesh(new THREE.CylinderGeometry(0.06,0.22,0.12,12),MAT.metal,0.6,2.98,0));top=2.85;g.userData.lx=0.6;}
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col.clone(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));
  glow.position.set(g.userData.lx,top,0);glow.scale.setScalar(1.6);g.add(glow);
  g.userData.bulbM=bulbM;g.userData.glow=glow;g.userData.top=top;
  g.position.set(L.x,H(L.x,L.z),L.z);g.rotation.y=L.rot||0;return g;}
function spawnLamp(L){if(L.mesh)scene.remove(L.mesh);L.mesh=makeLampMesh(L);scene.add(L.mesh);}
function lampLit(L){if(!isNight())return 0;if(L.type==='oil')return L.fuel>0?0.6:0;if(L.type==='solar')return L.charge>0?0.8:0;return S.gen&&S.gen.fuel>0?1:0;}
function lampName(L){return{oil:'Oil street lamp',solar:'Solar street lamp',elec:'Electric street lamp'}[L.type];}
let lampTarget=null;
function lampActs(L,A){const C=LAMPCOL[L.col]||LAMPCOL.warm,lit=lampLit(L)>0;
  const st=L.type==='oil'?`Oil for ${L.fuel.toFixed(1)} night${L.fuel>=1.95||L.fuel<1?'s':''}`:L.type==='solar'?`Battery ${Math.round(L.charge*100)}%`:S.gen?`Generator: ${S.gen.fuel>0?`${S.gen.fuel.toFixed(1)} nights of fuel`:'no fuel'}`:'No generator';
  A.push({label:lampName(L),sub:`${C.n} · ${st}${lit?' · lit':''}`,off:true});
  if(L.type==='oil'&&L.fuel<3)A.push(S.inv.oil>0?{label:'Fill with coconut oil',sub:'1 oil · 2 nights of light',fn:()=>{S.inv.oil--;L.fuel=Math.min(4,L.fuel+2);floatAtPlayer('Lamp filled');refresh();}}:{label:'Fill with coconut oil',sub:'Make coconut oil first',off:true});
  A.push({label:'Change colour',sub:'A coloured shade',cls:'alt',fn:()=>{lampTarget=L;openSheet('lampcol');}});
  if(S.level>=18||S.inv.solar>0||S.inv.bulb>0){
    if(L.type!=='solar'&&S.inv.solar>0)A.push({label:'Fit the solar kit',sub:'Charges in the sun · no fuel',cls:'alt',fn:()=>{S.inv.solar--;L.type='solar';L.charge=0.5;spawnLamp(L);stat('solarfit');toast('Solar street lamp! It charges in the daytime. Cloudy days give less light.');refresh();}});
    if(L.type!=='elec'&&S.inv.bulb>0)A.push(S.gen?{label:'Wire it to the generator',sub:'1 bulb · bright electric light',cls:'alt',fn:()=>{S.inv.bulb--;L.type='elec';spawnLamp(L);toast('Electric street lamp! It lights up at night while the generator has fuel.');refresh();}}:{label:'Make it electric',sub:'Install a groupe électrogène first',off:true});}}
function lampSheet(){$('#sheetTitle').textContent='Lamp colour';const L=lampTarget;if(!L)return'';
  return`<p class="small-note">Choose a shade for this lamp. It shows at night.</p>`+Object.entries(LAMPCOL).map(([k,C])=>{const cur=L.col===k||(!L.col&&k==='warm'),ok=!C.cost||hasAll(C.cost);
    return`<div class="recipe"><div class="rinfo"><div class="name"><span class="swatch-dot" style="background:${C.c}"></span> ${C.n}</div><div class="tah">${C.cost?`${C.t} · ${Object.entries(C.cost).map(([i,v])=>`${v} ${nm(i)}`).join(' + ')}`:'Plain glass'}</div></div><button data-lcol="${k}" ${cur||!ok?'disabled':''}>${cur?'Now':'Use'}</button></div>`;}).join('');}
function lampClick(b){const k=b.dataset.lcol,L=lampTarget;if(!k||!L)return;const C=LAMPCOL[k];if(C.cost){if(!hasAll(C.cost))return;take(C.cost);}
  L.col=k;spawnLamp(L);stat('lampcol');floatAtPlayer(`${C.n} shade`);openSheet(null);refresh();}

/* ----- generator ----- */
let genMesh=null;
function placeGen(){if(!S.gen||genMesh)return;const g=new THREE.Group();g.add(box(1.4,0.08,1.0,MAT.basalt2,0,0.04,0));
  const body=new THREE.Group();body.add(box(0.9,0.55,0.55,MAT.yellow,0,0.42,0));body.add(box(0.5,0.3,0.04,MAT.dark,-0.1,0.42,0.28));body.add(cyl(0.07,0.07,MAT.red,0.3,0.45,0.29,8));
  body.add(cyl(0.04,0.3,MAT.metal,0.35,0.85,-0.15,6));for(const x of[-0.45,0.45])body.add(box(0.04,0.6,0.6,MAT.metal,x,0.42,0));g.add(body);
  const roof=box(1.4,0.06,1.1,std(0x9aa4a7),0,1.2,0);roof.rotation.x=0.12;g.add(roof);for(const x of[-0.6,0.6])for(const z of[-0.45,0.45])g.add(cyl(0.03,1.15,MAT.post,x,0.6,z,5));
  g.position.set(S.gen.x,H(S.gen.x,S.gen.z),S.gen.z);g.rotation.y=S.gen.rot||0;scene.add(g);genMesh={g,body};}
function genActs(A){const G=S.gen,nE=S.lamps.filter(l=>l.type==='elec').length;
  A.push({label:'Groupe électrogène',sub:`${G.fuel>0?`Fuel for ${G.fuel.toFixed(1)} night${G.fuel>=2?'s':''}`:'Empty tank'} · ${nE} electric lamp${nE===1?'':'s'}`,off:true});
  if(G.fuel<4)A.push(S.inv.fuel>0?{label:'Fill the tank',sub:'1 jerrycan · one night',fn:()=>{S.inv.fuel--;G.fuel=Math.min(4,G.fuel+1);chopT=0.4;floatAtPlayer('Tank filled');refresh();}}:{label:'Fill the tank',sub:'Buy fuel on the goélette',off:true});}

/* ----- hooks ----- */
function v10PlaceCheck(what){if(!['lamp','parterre','gen'].includes(what))return null;
  if(what==='lamp'&&S.lamps.length>=MAX_LAMPS)return{ok:false,why:`You can build ${MAX_LAMPS} street lamps`};
  if(what==='parterre'&&S.parterres.length>=MAX_PARTERRES)return{ok:false,why:`You can plant ${MAX_PARTERRES} flower beds`};
  if(what==='gen'&&S.gen)return{ok:false,why:'Your generator is already installed'};
  const d=what==='lamp'?1.0:1.8,{x,z}=ahead(d),h=H(x,z);if(h<0.15||h>6)return{ok:false,why:'Stand on solid ground to build it'};
  if(what==='lamp'){if(S.lamps.some(l=>dist(l.x,l.z,x,z)<2.2))return{ok:false,why:'Too close to another lamp'};if(occupied(x,z,0.5))return{ok:false,why:'Too close to something'};}
  else if(occupied(x,z,1.3))return{ok:false,why:'Too close to something. Find open ground.'};
  return{ok:true,x,z};}
function v10Place(what,c){
  if(what==='lamp'){const L={x:c.x,z:c.z,rot:player.rotation.y-Math.PI/2,type:'oil',fuel:2,charge:0,col:'warm'};S.lamps.push(L);spawnLamp(L);toast('Street lamp built! It burns coconut oil at night. Tap it to change its colour.');return true;}
  if(what==='parterre'){const p={x:c.x,z:c.z,seed:Math.floor(Math.random()*1e9)};S.parterres.push(p);makeParterre(p);stat('parterre');toast('A flower bed brightens the garden. Your guests will notice.');return true;}
  if(what==='gen'){S.gen={x:c.x,z:c.z,rot:player.rotation.y,fuel:0};placeGen();toast('The groupe électrogène is installed. Fill it with fuel, then wire lamps with bulbs.');return true;}
  return false;}
function v10Occupied(x,z,d){return S.lamps.some(l=>dist(l.x,l.z,x,z)<d+0.1)||S.parterres.some(p=>dist(p.x,p.z,x,z)<d+0.9)||(S.gen&&dist(S.gen.x,S.gen.z,x,z)<d+0.7);}
function v10Obstacles(list){for(const l of S.lamps)list.push([l.x,l.z,0.25]);for(const p of S.parterres)list.push([p.x,p.z,1.0]);if(S.gen)list.push([S.gen.x,S.gen.z,0.75]);}
const V10T={lamp:1,gen:1};
function v10Candidates(add){for(const l of S.lamps)add('lamp',l,l.x,l.z,0.2);if(S.gen)add('gen',S.gen,S.gen.x,S.gen.z,0.6);}
function v10Actions(t,o,A){if(t==='lamp')lampActs(o,A);else if(t==='gen')genActs(A);}
function v10Rating(){return Math.min(0.5,S.parterres.length*0.1+S.lamps.filter(l=>lampLit(l)>0||l.type!=='oil'||l.fuel>0).length*0.04);}
function v10Sim(dt,quiet){const night=isNight(),day=dayAmt();
  for(const L of S.lamps){if(L.type==='oil'&&night&&L.fuel>0)L.fuel=Math.max(0,L.fuel-dt/(DAY_LEN*0.44));
    if(L.type==='solar'){if(night){if(L.charge>0)L.charge=Math.max(0,L.charge-dt/(DAY_LEN*0.44));}else L.charge=Math.min(1,L.charge+dt*day*(1-S.weather.c*0.75)/(DAY_LEN*0.3));}}
  const G=S.gen;if(G&&night&&G.fuel>0&&S.lamps.some(l=>l.type==='elec')){G.fuel=Math.max(0,G.fuel-dt/(DAY_LEN*0.44));G.run=(G.run||0)+dt;
    if(G.run>DAY_LEN*0.3&&S.flags.genDay!==S.day){S.flags.genDay=S.day;stat('gennight');}}
  if(!night&&G)G.run=0;
  if(night&&S.flags.solarDay!==S.day&&S.lamps.some(l=>l.type==='solar'&&l.charge>0)){S.flags.solarDay=S.day;stat('solarlamp');}}
let lampT=0;
function updateV10(dt,t){
  msT-=dt;if(msT<=0){msT=2;checkMilestones();}
  for(const L of S.lamps){if(!L.mesh)continue;const u=L.mesh.userData,k=lampLit(L),fl=L.type==='oil'?(0.85+Math.sin(t*9+L.x)*0.08+Math.sin(t*23+L.z)*0.05):1;
    u.bulbM.emissiveIntensity=k*2.4*fl;u.glow.material.opacity=Math.min(1,k*1.1*fl);u.glow.scale.setScalar(1.4+k*2.2);}
  lampT-=dt;if(lampT<=0){lampT=0.25;const px=camera.position.x,pz=camera.position.z;
    const lit=S.lamps.filter(l=>l.mesh&&lampLit(l)>0).sort((a,b)=>dist(a.x,a.z,px,pz)-dist(b.x,b.z,px,pz));
    LAMP_LIGHTS.forEach((pl,i)=>{const L=lit[i];if(!L){pl.intensity=0;return;}const u=L.mesh.userData,v=new THREE.Vector3(u.lx,u.top-0.1,0);L.mesh.localToWorld(v);pl.position.copy(v);
      pl.color.copy(lin((LAMPCOL[L.col]||LAMPCOL.warm).c));pl.intensity=lampLit(L)*3.2;pl.userData.L=L;});}
  LAMP_LIGHTS.forEach(pl=>{const L=pl.userData.L;if(L&&pl.intensity>0&&L.type==='oil')pl.intensity=lampLit(L)*3.2*(0.85+Math.sin(t*9+L.x)*0.08);});
  if(genMesh){const run=isNight()&&S.gen.fuel>0&&S.lamps.some(l=>l.type==='elec');genMesh.body.position.x=run?Math.sin(t*60)*0.006:0;}}
/* hei pua on the neck */
(function(){const g=new THREE.Group();g.position.z=0.02;const cols=[MAT.bougain,MAT.tainaF,MAT.puaF,std(0xde4634)];
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,b=new THREE.Mesh(new THREE.IcosahedronGeometry(0.03,0),cols[i%4]);b.position.set(Math.cos(a)*0.17,-Math.max(0,Math.sin(a))*0.1,Math.sin(a)*0.13);g.add(b);}
  g.visible=false;PC.neck.add(g);neckMeshes.heipua=g;applyWear();})();
S.lamps.forEach(spawnLamp);S.parterres.forEach(makeParterre);placeGen();

/* =========================================================
   Main loop
   ========================================================= */
const clock=new THREE.Clock();let walkT=0,uiT=0,saveT=0,paddleT=0,levelT=0,interior=0;
const fwd=new THREE.Vector3(),right=new THREE.Vector3();
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
function obstacles(){const list=[];
  for(const p of S.palms){if(p.state==='stump')list.push([p.x,p.z,0.4]);else if(p.g>0.4)list.push([p.x,p.z,0.45]);}
  for(const c of S.crops)if(c.g>0.4)list.push([c.x,c.z,c.type==='uru'?0.5:0.35]);
  for(const o of S.rocks)if(o.left>0)list.push([o.x,o.z,0.7+0.25*o.left]);
  for(const b of S.bamboo)list.push([b.x,b.z,0.75]);
  list.push([SPRING.x,SPRING.z,1.5]);
  if(S.fire)list.push([S.fire.x,S.fire.z,0.75]);
  if(S.canoe&&!S.boat)list.push([S.canoe.x,S.canoe.z,0.9]);
  if(S.coop)list.push([S.coop.x,S.coop.z,0.95]);
  if(S.pen)list.push([S.pen.x,S.pen.z,2.4]);
  if(S.stall)list.push([S.stall.x,S.stall.z,0.95]);
  if(S.compost)list.push([S.compost.x,S.compost.z,0.7]);
  if(S.ahimaa)list.push([S.ahimaa.x,S.ahimaa.z,0.9]);
  if(S.store)list.push([S.store.x,S.store.z,1.9]);
  v9Obstacles(list);v10Obstacles(list);
  if(S.furn.table){const p=furnWorld('table');list.push([p.x,p.z,0.5]);}
  if(S.furn.bed){const p=furnWorld('bed');list.push([p.x,p.z,0.7]);}
  if(S.furn.shelf){const p=furnWorld('shelf');list.push([p.x,p.z,0.45]);}
  if(S.furn.lamp){const p=furnWorld('lamp');list.push([p.x,p.z,0.25]);}
  return list;}
function walkable(x,z){
  if(onDock(x,z))return true;
  if(S.g2>0&&nearG2(x,z,0.1))return false;
  const h=H(x,z);if(h>5||h<-0.55)return false;
  if(nearSite(x,z,0.3)){if(S.stage===0)return true;if(S.stage<4)return false;return inInterior(x,z)||inDoor(x,z);}
  return true;
}
function wanderTarget(a){
  const D=ANIMALS[a.type];let cx,cz,r;
  if(a.tamed){
    if(a.type==='chicken'&&S.coop){cx=S.coop.x;cz=S.coop.z;r=2.2;}
    else if((a.type==='pig'||a.type==='goat')&&S.pen){cx=S.pen.x;cz=S.pen.z;r=1.4;}
    else if(a.type==='cat'){cx=SITE.x;cz=SITE.z+(S.stage>=4?0:4.5);r=S.stage>=4?2:3;}
    else{cx=a.mesh.position.x;cz=a.mesh.position.z;r=3;}
  }else{cx=D.spawn[0];cz=D.spawn[1];r=5;}
  for(let i=0;i<12;i++){const ang=Math.random()*Math.PI*2,rr=Math.random()*r,x=cx+Math.cos(ang)*rr,z=cz+Math.sin(ang)*rr,h=H(x,z);
    if(a.type==='cat'&&a.tamed&&S.stage>=4&&inInterior(x,z)){a.tx=x;a.tz=z;return;}
    if(h<0.25||h>5)continue;if(nearSite(x,z,0.4)&&!(a.type==='cat'&&a.tamed))continue;a.tx=x;a.tz=z;return;}
  a.tx=cx;a.tz=cz;
}
function updateAnimals(dt,t){
  for(const a of S.animals){
    const m=a.mesh,px=m.position.x,pz=m.position.z;let speed=0;
    if(a.type==='dog'&&a.tamed&&!S.boat){
      const bx=player.position.x-Math.sin(player.rotation.y)*1.6,bz=player.position.z-Math.cos(player.rotation.y)*1.6,d=dist(bx,bz,px,pz);
      if(d>1.0){a.tx=bx;a.tz=bz;speed=Math.min(7,1.5+d*1.6);}
      if(onFloor(bx,bz)){a.tx=SITE.x;a.tz=SITE.z+3.6;}
    }else{
      if(a.wait>0)a.wait-=dt;
      else{const d=dist(a.tx,a.tz,px,pz);if(d<0.25){a.wait=1.5+Math.random()*4;wanderTarget(a);}else speed=a.type==='chicken'?0.9:a.type==='cat'?1.1:1.2;}
      if(a.tamed){ // walk home briskly if far
        const far=a.type==='chicken'&&S.coop?dist(S.coop.x,S.coop.z,px,pz)>4:(a.type==='pig'||a.type==='goat')&&S.pen?dist(S.pen.x,S.pen.z,px,pz)>2:false;
        if(far&&speed===0){wanderTarget(a);a.wait=0;}if(far)speed=2.6;}
    }
    if(speed>0){const dx=a.tx-px,dz=a.tz-pz,d=Math.hypot(dx,dz)||1,st=Math.min(d,speed*dt);
      m.position.x+=dx/d*st;m.position.z+=dz/d*st;const tr=Math.atan2(dx,dz);let dr=tr-m.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));m.rotation.y+=dr*Math.min(1,dt*8);}
    const moving=speed>0.05;a.ph=(a.ph||0)+dt*(moving?speed*5:0);
    m.position.y=groundYAnimal(a,m.position.x,m.position.z)+(a.type==='chicken'&&moving?Math.abs(Math.sin(a.ph))*0.05:0);
    a.anim.legs.forEach((l,i)=>{l.rotation.x=moving?Math.sin(a.ph+(i%2?Math.PI:0)+(i>1?Math.PI/2:0))*0.6:0;});
    if(a.anim.tail){if(a.type==='dog')a.anim.tail.rotation.z=Math.sin(t*(a.tamed?14:5))*0.6;else if(a.type==='cat')a.anim.tail.rotation.z=Math.sin(t*1.5)*0.3;else if(a.type==='goat')a.anim.tail.rotation.x=Math.sin(t*6)*0.3;}
    a.x=m.position.x;a.z=m.position.z;
  }
}
const _cv=new THREE.Vector3();
function segDist(px,py,pz,ax,ay,az,bx,by,bz){const vx=bx-ax,vy=by-ay,vz=bz-az,wx=px-ax,wy=py-ay,wz=pz-az,l=vx*vx+vy*vy+vz*vz||1;
  const k=clamp((wx*vx+wy*vy+wz*vz)/l,0,1);return Math.hypot(px-(ax+vx*k),py-(ay+vy*k),pz-(az+vz*k));}
function occludes(o,r){const e=o.matrixWorld.elements,c=camera.position;return segDist(e[12],e[13],e[14],c.x,c.y,c.z,player.position.x,player.position.y+1.3,player.position.z)<r;}
function tick(){
  const dt=Math.min(0.05,clock.getDelta()),t=clock.elapsedTime;
  const paused=overlayOpen();
  if(!paused){simStep(dt,false);if(fishing){fishing.t-=dt;if(fishing.t<=0)finishCast();}}
  /* movement */
  let ix=0,iy=0;
  if(!paused){if(keys.w||keys.arrowup)iy-=1;if(keys.s||keys.arrowdown)iy+=1;if(keys.a||keys.arrowleft)ix-=1;if(keys.d||keys.arrowright)ix+=1;ix+=joyV.x;iy+=joyV.y;}
  const mag=FLY.on?0:Math.min(1,Math.hypot(ix,iy));
  if(mag>0.08&&!fishing){
    fwd.set(-Math.sin(cam.yaw),0,-Math.cos(cam.yaw));right.set(Math.cos(cam.yaw),0,-Math.sin(cam.yaw));
    const mx=right.x*ix-fwd.x*iy,mz=right.z*ix-fwd.z*iy,ml=Math.hypot(mx,mz)||1;
    let speed=S.boat?(stormy()?3.5:(S.owned.motor?12:S.sail?8+S.weather.w*5:7)):(onFloor(player.position.x,player.position.z)?3.4:6.2);if(S.hunger<=0)speed*=0.55;
    const sp=speed*mag*dt,nx=player.position.x+mx/ml*sp,nz=player.position.z+mz/ml*sp;
    const tryMove=S.boat
      ?(x,z)=>{if(H(x,z)>-0.05||!seaOK(x,z))return false;player.position.x=x;player.position.z=z;return true;}
      :(x,z)=>{if(!walkable(x,z))return false;player.position.x=x;player.position.z=z;return true;};
    if(!tryMove(nx,nz)){tryMove(nx,player.position.z)||tryMove(player.position.x,nz);}
    if(!S.boat)for(const[ox,oz,r]of obstacles()){const dx=player.position.x-ox,dz=player.position.z-oz,d=Math.hypot(dx,dz);
      if(d<r+0.3&&d>0.001){const nx2=ox+dx/d*(r+0.3),nz2=oz+dz/d*(r+0.3);if(walkable(nx2,nz2)){player.position.x=nx2;player.position.z=nz2;}}}
    const targetRot=Math.atan2(mx,mz);let dr=targetRot-player.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));player.rotation.y+=dr*Math.min(1,dt*(S.boat?5:12));
    walkT+=dt*10*mag;paddleT+=dt*6*mag;
  }else walkT*=0.85;
  const swell=Math.sin(t*1.6)*0.04*(1+S.weather.w*2)*(outsideReef()?2.4:1);
  if(S.boat){player.position.y=(S.taurua?0.48:0.02)+swell;legs.forEach(l=>{l.visible=false;});}
  else{legs.forEach(l=>{l.visible=true;});player.position.y=groundY(player.position.x,player.position.z)+Math.abs(Math.sin(walkT))*0.06;}
  legs[0].rotation.x=Math.sin(walkT)*0.7;legs[1].rotation.x=-Math.sin(walkT)*0.7;
  if(chopT>0)chopT-=dt;
  arms[0].rotation.x=chopT>0?-Math.sin(chopT*12)*1.4:(S.boat?-0.6:-Math.sin(walkT)*0.4);
  arms[1].rotation.x=chopT>0?-Math.sin(chopT*12)*1.4:(S.boat?-0.6:Math.sin(walkT)*0.4);
  /* canoe */
  if(canoeMesh){
    if(S.boat){canoeMesh.position.set(player.position.x,swell-0.05,player.position.z);canoeMesh.rotation.y=player.rotation.y;canoeMesh.rotation.z=Math.sin(t*1.3)*0.05*(1+S.weather.w);
      canoeMesh.userData.paddle.rotation.x=Math.sin(paddleT)*0.7;}
    else{canoeMesh.position.set(S.canoe.x,Math.max(H(S.canoe.x,S.canoe.z),0)-0.05+swell*0.6,S.canoe.z);canoeMesh.rotation.y=S.canoe.rot||0;canoeMesh.rotation.z=0;}
  }
  /* interior view: lift the roof off and fade the walls */
  const inside=!S.boat&&S.stage>=4&&inInterior(player.position.x,player.position.z);
  interior+=((inside?1:0)-interior)*Math.min(1,dt*6);
  if(S.stage>=5)stageGroups[4].visible=interior<0.5;
  MAT.plank.opacity=1-interior*0.78;MAT.plank.depthWrite=interior<0.3;
  /* camera */
  const dist0=cam.dist*(1-interior*0.35),pitch=cam.pitch+(1.05-cam.pitch)*interior*0.8;
  const cp=Math.cos(pitch),tx=player.position.x,ty=player.position.y+1.3,tz=player.position.z;
  const camX=tx+Math.sin(cam.yaw)*dist0*cp,camZ=tz+Math.cos(cam.yaw)*dist0*cp;let camY=ty+Math.sin(pitch)*dist0;
  camY=Math.max(camY,Math.max(H(camX,camZ),0)+1.2);
  camera.position.lerp(_v.set(camX,camY,camZ),Math.min(1,dt*8));camera.lookAt(tx,ty+Math.max(0,0.3-pitch)*16,tz);
  sky.position.copy(camera.position);stars.position.copy(camera.position);
  const day=updateSky();updateRain(dt);updateGfx(t,day);
  /* plants */
  const sway=0.04+S.weather.w*0.16;
  for(const p of S.palms){
    if(p.state==='stump'){p.obj.group.visible=false;p.stump.visible=true;p.sprout.visible=false;continue;}
    p.stump.visible=false;
    if(p.g<0.12){p.obj.group.visible=false;p.sprout.visible=true;p.sprout.scale.setScalar(0.8+p.g*3);}
    else{p.sprout.visible=false;p.obj.group.visible=true;p.obj.group.scale.setScalar(0.1+0.9*smooth(0.12,1,p.g));}
    p.obj.nuts.visible=p.g>=1&&p.cd<=0;
    let s=Math.sin(t*(0.9+S.weather.w)+p.obj.phase)*sway;if(shakeObj===p&&shakeT>0)s+=Math.sin(t*40)*0.12*shakeT;
    p.obj.crown.rotation.z=s;p.obj.crown.rotation.x=s*0.6;
    const hide=occludes(p.obj.crown,2.7*p.obj.group.scale.x);p.obj.crown.visible=!hide;if(hide)p.obj.nuts.visible=false;
  }
  for(const c of S.crops){
    if(c.g<0.15){c.obj.group.visible=false;c.sprout.visible=true;c.sprout.scale.setScalar(0.7+c.g*3);}
    else{c.sprout.visible=false;c.obj.group.visible=true;c.obj.group.scale.setScalar(0.15+0.85*smooth(0.15,1,c.g));}
    c.obj.bunch.visible=c.g>=1&&c.cd<=0;
    let s=Math.sin(t*(1.1+S.weather.w)+c.obj.phase)*sway*(c.type==='uru'?0.3:0.8);if(shakeObj===c&&shakeT>0)s+=Math.sin(t*40)*0.1*shakeT;
    c.obj.crown.rotation.z=s;c.obj.crown.rotation.x=s*0.5;
    if(c.type==='banana'||c.type==='fei'||c.type==='uru'){const hide=occludes(c.obj.crown,(c.type==='uru'?2.4:1.9)*c.obj.group.scale.x);c.obj.crown.visible=!hide;if(hide&&c.type==='uru')c.obj.bunch.visible=false;}
  }
  for(const b of S.bamboo){let s=Math.sin(t*(1.2+S.weather.w)+b.obj.phase)*sway*0.5;if(shakeObj===b&&shakeT>0)s+=Math.sin(t*40)*0.06*shakeT;b.obj.crown.rotation.z=s;b.obj.crown.rotation.x=s*0.4;}
  for(const tr of S.trenches){const u=tr.mesh.userData;u.water.visible=tr.flooded;u.plants.visible=tr.planted;if(tr.planted)tr.obj.group.scale.setScalar(0.15+0.85*tr.g);tr.obj.bunch.visible=tr.g>=1;}
  for(const tp of S.traps){tp.mesh.userData.fish.children.forEach((f,i)=>{f.visible=i<tp.fish;});}
  if(coopMesh)coopMesh.userData.eggs.children.forEach((e,i)=>{e.visible=i<S.coop.eggs;});
  if(shakeT>0)shakeT-=dt;
  for(const o of S.rocks){o.mesh.visible=o.left>0;const s=0.45+0.55*o.left/3,b=o.mesh.userData.base;o.mesh.scale.set(b.x*s,b.y*s,b.z*s);}
  for(let i=tweens.length-1;i>=0;i--){const tw=tweens[i];tw.t+=dt/0.7;const k=Math.min(1,tw.t),e=1-Math.pow(1-k,3);tw.g.scale.y=0.01+0.99*e+Math.sin(k*Math.PI)*0.06;if(k>=1){tw.g.scale.y=1;tweens.splice(i,1);}}
  updateAnimals(dt,t);
  updatePension(dt,t);
  updateManu(dt,t,mag>0.08);
  updateV6(dt,t,mag>0.08,paused);
  updateV7(dt,t,mag>0.08,paused);
  updateV8(dt,t,paused);
  updateV9(dt,t);
  updateV10(dt,t);
  /* fire, lamp */
  if(fireMesh){const u=fireMesh.userData,f=0.85+Math.sin(t*13)*0.08+Math.sin(t*7.3)*0.06,damp=1-S.weather.r*0.45;
    u.flame.scale.set(f*damp,(f+0.1)*damp,f*damp);u.light.intensity=(0.4+1.8*(1-day))*f*damp;}
  if(S.furn.lamp){const f=0.9+Math.sin(t*11)*0.08;lampLight.intensity=(1-day)*1.6*f+interior*0.4;lampFlame.scale.setScalar(f*(0.5+0.5*(1-day)));}
  if(S.furn.shelf)shelfJars.children.forEach((j,i)=>{j.visible=i<Math.min(4,(S.stats.monoi||0)+(S.stats.vmonoi||0));});
  /* water */
  MAT.falls.map.offset.y-=dt*1.2;
  clouds.rotation.y+=dt*(0.004+S.weather.w*0.01);
  reef.material.opacity=0.45+Math.sin(t*1.3)*0.12+S.weather.w*0.25;shore.material.opacity=0.2+Math.sin(t*1.8)*0.1+S.weather.w*0.15;
  for(const s of shoals){s.mesh.visible=s.left>0;s.mesh.children.forEach(r=>{if(r.userData.k===undefined)return;r.scale.setScalar(0.6+((t*0.5+r.userData.k)%1)*1.6);});s.mesh.userData.fishes.rotation.y=t*0.8;}
  if(fishing){const a=player.rotation.y,hx=player.position.x+Math.sin(a)*0.6,hz=player.position.z+Math.cos(a)*0.6,arr=lineGeo.attributes.position.array;
    const by=0.06+Math.sin(t*6)*0.03-(fishing.t<0.4?0.1:0);
    arr[0]=hx;arr[1]=player.position.y+1.6;arr[2]=hz;arr[3]=fishing.bx;arr[4]=by;arr[5]=fishing.bz;lineGeo.attributes.position.needsUpdate=true;bobber.position.set(fishing.bx,by,fishing.bz);}
  /* target ring */
  if(target&&!S.boat){targetRing.visible=true;let r=1,y;const tt=target.type;
    if(tt==='site'){r=4.6;y=SITE_H+0.66;}else{r={rock:1.4,canoe:2,pen:2.8,trench:1.6,spring:2,bamboo:1.3,animal:0.8,furn:0.9,coop:1.2,trap:1.1,crop:target.o&&target.o.type==='uru'?1.6:1}[tt]||1;
      y=tt==='furn'?Y0+0.06:Math.max(H(target.x,target.z),0)+0.08;}
    if(tt==='gsite'||tt==='gfare'){r=3.4;y=SITE2_H+0.5;}else if(tt==='goe'||tt==='stall'){r=1.3;y=tt==='goe'?0.62:y;}else if(tt==='npc'){r=0.8;y=groundY(target.x,target.z)+0.08;}
    targetRing.position.set(target.x,y,target.z);targetRing.scale.setScalar(r*(1+Math.sin(t*5)*0.05));ringMat.color.set(tt==='site'||tt==='gsite'?0xffd36b:tt==='animal'||tt==='npc'?0xffb3a8:0xffffff);}
  else targetRing.visible=false;
  /* ui */
  uiT+=dt;if(uiT>0.12){uiT=0;actions=computeActions();renderActions();renderWx();if(Math.round(S.hunger)!==lastHungerShown)renderTop();}
  levelT+=dt;if(levelT>1){levelT=0;if(!paused)checkLevel();}
  saveT+=dt;if(saveT>4){saveT=0;save();}
  renderer.render(scene,camera);requestAnimationFrame(tick);
}
lastWxLabel=wxLabel()[1];
renderTop();renderGoal();renderWx();
actions=computeActions();renderActions();
addEventListener('pagehide',()=>{if(!wiping)save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!wiping)save();});
if(location.hash==='#debug')window.__fare={v10:{spawnCrop,spawnLamp,v10Sim,v10Place,checkMilestones,lampActs,genActs,lampClick,makeV10Crop},v9:{v9Place,v9DoSpecial,pfarmActs,portActs,helipadActs,hiveActs,PONTON_C,tillCheck,till,S_fields:()=>S.fields,plantField,graft,harvestPearls,rollPearl,PFARM_AT,PORT_AT,startHeli,HELI,flowersNear,treat,canSellHere,pearlClick},v8:{FLY,startFly,stopFly,RINGS,TOUR_STOPS,startTour,board,TOUR_DOCK,computeActions,placeCanoeMesh},v7:{openLook,startExc,whales,smartHint,buildPlayer,clock,cam},S,give,refresh,checkLevel,player,openSheet,doCraft,simStep,v6:{startTornado,TOR,launchShooter,flocks,honus,crabs}};
requestAnimationFrame(tick);
})();
