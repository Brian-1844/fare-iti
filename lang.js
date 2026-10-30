/* Fare Iti — languages (English / French), welcome screen and "install on your phone".
   Loaded after data.js and fr.js, before game.js.
   English is the source language. In French, the game data is replaced from fr.js
   and every interface text is translated as it appears on screen. */
(function(){
"use strict";
var LANG_KEY='fare-iti-lang';
var lang=null;try{lang=localStorage.getItem(LANG_KEY);}catch(e){}
var FR=window.FARE_FR||{data:{},ui:{}};
var isFR=lang==='fr';
window.FARE_LANG=lang||'en';
document.documentElement.lang=isFR?'fr':'en';

/* ---------- 1. game data, by path ---------- */
function setPath(root,path,val){
  var parts=path.replace(/\[(\d+)\]/g,'.$1').split('.'),o=root;
  for(var i=0;i<parts.length-1;i++){o=o[parts[i]];if(o==null)return;}
  var last=parts[parts.length-1];if(typeof o[last]==='string')o[last]=val;}
if(isFR&&window.FARE_DATA)for(var p in FR.data)setPath(window.FARE_DATA,p,FR.data[p]);

/* ---------- 2. interface translator ---------- */
var EXACT=new Map(),PATS=[],CACHE=new Map();
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
if(isFR){
  for(var en in FR.ui){var fr=FR.ui[en];if(!fr||fr===en)continue;var key=en.replace(/\s+/g,' ').trim();
    if(!/\{\d+\}/.test(key)){EXACT.set(key,fr.trim());continue;}
    var order=[],re='^'+key.split(/(\{\d+\})/).map(function(part){var m=part.match(/^\{(\d+)\}$/);if(m){order.push(m[1]);return '([\\s\\S]*?)';}return esc(part);}).join('')+'$';
    var lit=key.replace(/\{\d+\}/g,'').length;
    PATS.push({re:new RegExp(re),order:order,fr:fr.trim(),lit:lit});}
  PATS.sort(function(a,b){return b.lit-a.lit;});
}
function trCore(s,depth){
  if(!s||!/[A-Za-z]{2}/.test(s))return s;
  var hit=EXACT.get(s);if(hit!==undefined)return hit;
  var low=s.charAt(0).toUpperCase()+s.slice(1);
  if(depth<3){
    for(var i=0;i<PATS.length;i++){var P=PATS[i],m=P.re.exec(s);if(!m)continue;
      var vals={};P.order.forEach(function(n,j){var v=m[j+1];if(depth<2){var mm=v.match(/^(\s*)([\s\S]*?)(\s*)$/);v=mm[1]+trCore(mm[2],depth+1)+mm[3];}vals[n]=v;});
      return P.fr.replace(/\{(\d+)\}/g,function(_,n){return vals[n]!==undefined?vals[n]:'';});}}
  if(s.indexOf(' · ')>0){var parts=s.split(' · '),ch=false;parts=parts.map(function(x){var y=trCore(x,depth+1);if(y!==x)ch=true;return y;});if(ch)return parts.join(' · ');}
  return s;}
function tr(raw){
  if(!isFR||raw==null)return raw;
  var c=CACHE.get(raw);if(c!==undefined)return c;
  var m=String(raw).match(/^(\s*)([\s\S]*?)(\s*)$/),core=m[2].replace(/\s+/g,' ');
  var out=core?m[1]+trCore(core,0)+m[3]:raw;
  if(out===m[1]+core+m[3])out=raw;
  if(CACHE.size>6000)CACHE.clear();CACHE.set(raw,out);return out;}
window.FARE_T=tr;

var SKIPTAG={SCRIPT:1,STYLE:1,svg:1,SVG:1,CANVAS:1,TEXTAREA:1,INPUT:1};
var mine=new WeakMap();
function doText(n){var v=n.nodeValue;if(mine.get(n)===v)return;var t=tr(v);if(t!==v){mine.set(n,t);n.nodeValue=t;}else mine.set(n,v);}
function doAttrs(el){['title','aria-label','placeholder'].forEach(function(a){var v=el.getAttribute&&el.getAttribute(a);if(v){var t=tr(v);if(t!==v)el.setAttribute(a,t);}});}
function walk(root){
  if(root.nodeType===3){var p=root.parentNode;if(p&&!SKIPTAG[p.nodeName]&&!(p.closest&&p.closest('svg,[data-notr]')))doText(root);return;}
  if(root.nodeType!==1||SKIPTAG[root.nodeName]||(root.closest&&root.closest('[data-notr]')))return;
  doAttrs(root);
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:function(n){
    if(n.nodeType===1){if(SKIPTAG[n.nodeName]||n.hasAttribute('data-notr'))return NodeFilter.FILTER_REJECT;doAttrs(n);return NodeFilter.FILTER_SKIP;}return NodeFilter.FILTER_ACCEPT;}});
  var t;while((t=w.nextNode()))doText(t);}
if(isFR){
  walk(document.body);document.title='Fare Iti';
  new MutationObserver(function(list){for(var i=0;i<list.length;i++){var r=list[i];
    if(r.type==='characterData'){var p=r.target.parentNode;if(p&&!(p.closest&&p.closest('svg,[data-notr]')))doText(r.target);}
    else if(r.type==='attributes')doAttrs(r.target);
    else for(var j=0;j<r.addedNodes.length;j++)walk(r.addedNodes[j]);}})
  .observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
}

/* ---------- 3. install on the phone (PWA) ---------- */
var deferred=null;
var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
var iOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;});
window.addEventListener('appinstalled',function(){deferred=null;standalone=true;showInstallNote(T2('Fare Iti est installé ! Tu le trouveras sur ton écran d’accueil.','Fare Iti is installed! You’ll find it on your home screen.'));});
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){try{navigator.serviceWorker.register('sw.js').catch(function(){});}catch(e){}}
function T2(fr,en){return (window.FARE_LANG==='fr')?fr:en;}
function showInstallNote(txt){var n=document.getElementById('installNote');if(n){n.textContent=txt;n.hidden=false;}}
function install(){
  if(standalone){showInstallNote(T2('Le jeu est déjà installé sur cet appareil.','The game is already installed on this device.'));return;}
  if(deferred){deferred.prompt();deferred.userChoice.then(function(){deferred=null;});return;}
  if(iOS)showInstallNote(T2('Sur iPhone ou iPad (Safari) : touche le bouton Partager ⬆︎, puis « Sur l’écran d’accueil ».','On iPhone or iPad (Safari): tap the Share button ⬆︎, then “Add to Home Screen”.'));
  else showInstallNote(T2('Ouvre le menu du navigateur (⋮ ou ☰) et choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».','Open your browser menu (⋮ or ☰) and choose “Install app” or “Add to Home screen”.'));}
window.FARE_INSTALL=install;

/* ---------- 4. welcome screen ---------- */
function setLang(l){try{localStorage.setItem(LANG_KEY,l);}catch(e){}
  if(l===(isFR?'fr':'en')){lang=l;window.FARE_LANG=l;hideWelcome();return;}
  location.reload();}
function hideWelcome(){var w=document.getElementById('welcome');if(w)w.hidden=true;}
function showWelcome(){var w=document.getElementById('welcome');if(!w)return;
  var n=document.getElementById('installNote');if(n)n.hidden=true;
  document.querySelectorAll('#welcome [data-lang]').forEach(function(b){b.classList.toggle('on',b.dataset.lang===(lang||''));});
  var ib=document.getElementById('installBtn');if(ib)ib.hidden=standalone;
  w.hidden=false;}
window.FARE_WELCOME=showWelcome;
document.querySelectorAll('#welcome [data-lang]').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.lang);});});
var ib=document.getElementById('installBtn');if(ib)ib.addEventListener('click',install);
var lb=document.getElementById('langBtn');if(lb)lb.addEventListener('click',function(){var m=document.getElementById('menu');if(m)m.hidden=true;showWelcome();});
var mi=document.getElementById('menuInstallBtn');if(mi){mi.hidden=standalone;mi.addEventListener('click',function(){var m=document.getElementById('menu');if(m)m.hidden=true;showWelcome();install();});}
if(!lang)showWelcome();
})();
