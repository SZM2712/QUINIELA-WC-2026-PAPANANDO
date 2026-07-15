// Panel de Admin: autenticacion por contrasena, carga de resultados reales, gestion de participantes.
import {GS,MU,TEAMS,R32,R16P,R16V,QFP_REAL,QFV,SFP,SFV,PPTS,APAS} from './data.js';
import {AppState} from './state.js';
import {stG,stS,stU,stD,getAllUsers,addIdx,delIdx,rawGetAll} from './firebase.js';
import {cSt,buildBkt,deriveUP,getRlE,getRlP,rawThirds,recRS,loadRD,initRS,teamPosStatus,runPodiumSimulation} from './logic.js';
import {esc} from './esc.js';
import {flagImg,buildUBkt,fmtPct} from './render.js';

export function chkAdm(){
  var passEl=document.getElementById('ap'),errEl=document.getElementById('aerr');
  if(!passEl)return;
  var v=passEl.value||'';
  if(v.toLowerCase()===APAS.toLowerCase()){
    AppState.adm=true;initRS();loadRD().then(function(){renderAdmin();});
  }else{
    errEl.textContent='Contraseña incorrecta.';
  }
}
export function adminLogout(){
  AppState.adm=false;renderAdmin();
}

export async function renderAdmin(){
  var wrap=document.getElementById('awrap');if(!wrap)return;
  if(!AppState.adm){
    wrap.innerHTML='<div class="abox"><div class="atitle">Admin</div>'+
      '<label class="ll">Contraseña</label><input class="li" id="ap" type="password" placeholder="..." onkeydown="if(event.key===\'Enter\')chkAdm()">'+
      '<button class="lbtn" style="background:var(--purple)" onclick="chkAdm()">INGRESAR</button><div class="lerr" id="aerr"></div></div>';
    return;
  }
  await loadRD();
  var users=await getAllUsers();
  var offR=await stG('official_podio')||[null,null,null,null];
  var el=getRlE(),rp=getRlP();
  var sim=runPodiumSimulation();
  var offP=offR.map(function(n){return n?Object.values(TEAMS).flat().find(function(t){return t.n===n;})||null:null;});
  var pc=['var(--gold)','#9aa0aa','#a07040','var(--muted)'];
  var ranked=users.map(function(u){
    var podio=deriveUP(u),pts2=0,maxPos=0;
    podio.forEach(function(t,i){
      if(t&&offP[i]&&t.n===offP[i].n)pts2+=PPTS[i];
      var posDecided=rp[i]&&rp[i].n;
      var alreadyWon=posDecided&&t&&rp[i].n===t.n;
      var alreadyLost=posDecided&&(!t||rp[i].n!==t.n);
      var teamEliminated=t&&!!teamPosStatus(el,t.n,i);
      if(alreadyWon){maxPos+=PPTS[i];}
      else if(!alreadyLost&&t&&!teamEliminated){maxPos+=PPTS[i];}
    });
    return{data:u,name:u.name,pts:pts2,maxPos:maxPos,podio:podio,locked:u.locked};
  }).sort(function(a,b){return b.pts-a.pts;});
  var topP=ranked.length?ranked[0].pts:0;
  var allT=Object.values(TEAMS).flat();
  var h='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:7px;">';
  h+='<div style="font-family:\'Bebas Neue\';font-size:22px;letter-spacing:2px;color:var(--purple)">Admin Papanando</div>';
  h+='<div style="display:flex;gap:5px;flex-wrap:wrap;"><button class="abtn" onclick="renderAdmin()">Actualizar</button><button class="abtn" style="border-color:#1a4a2c;color:#2a8a4c" onclick="rebuildIdx()">Reconstruir Indice</button><button class="abtn" style="border-color:#1a3050;color:#4a70b0" onclick="diagFB()">Diagnostico FB</button><button class="abtn" style="border-color:#5a3a10;color:#c07820" onclick="clearCache()">Limpiar Cache</button><button class="abtn" style="border-color:#1a3a22;color:#2a8a4c" onclick="expCSV()">Exportar</button><button class="abtn" style="border-color:#3a2a50;color:#9a7ab0" onclick="adminLogout()">Salir</button><button class="abtn" style="border-color:var(--red);color:var(--red)" onclick="nukeAll()">Borrar Todo</button></div></div>';
  h+='<div class="asec"><div class="asectitle">Resultados Reales</div><div class="rr-rtabs">';
  ['grupos','r32','r16','qf','sf','third','final'].forEach(function(r){var lbs={grupos:'Grupos',r32:'16avos',r16:'Octavos',qf:'Cuartos',sf:'Semis',third:'3er Lugar',final:'Final'};h+='<button class="rr-rtab'+(r===AppState.rrTab?' active':'')+'" role="tab" aria-selected="'+(r===AppState.rrTab?'true':'false')+'" onclick="setRRTab(\''+r+'\')">'+lbs[r]+'</button>';});
  h+='</div><div id="rr-content"></div><div style="margin-top:10px;display:flex;align-items:center;gap:10px;"><button class="cbtn" onclick="saveRR()">Guardar Resultados</button><span id="rr-msg" style="font-size:11px;color:#2a8a4c;"></span></div></div>';
  var rtArr=rawThirds(AppState.rGr);
  h+='<div class="asec"><div class="asectitle">Desempate de Terceros (8&ordm;/9&ordm;)</div>';
  if(rtArr.length<9){
    h+='<div class="ibox">Aun no hay 9 terceros con partidos jugados; todavia no puede haber empate en el borde.</div>';
    if(AppState.rThirdOv)h+='<div style="font-size:12px;color:#c07820;">Override guardado: Grupo '+AppState.rThirdOv+' (se aplicara solo si hay empate exacto 8&ordm;/9&ordm;). <button class="abtn" onclick="clearThirdOv()">Quitar</button></div>';
  }else{
    var t8=rtArr[7],t9=rtArr[8];
    var tied=(t8.pts===t9.pts&&t8.gd===t9.gd&&t8.gf===t9.gf);
    if(!tied){
      h+='<div class="ibox">No hay empate exacto entre el 8&ordm; ('+t8.t.n+') y el 9&ordm; ('+t9.t.n+'). El override solo aplica cuando empatan en puntos, diferencia de gol y goles a favor.</div>';
      if(AppState.rThirdOv)h+='<div style="font-size:12px;color:#c07820;">Override guardado: Grupo '+AppState.rThirdOv+' (ignorado mientras no haya empate). <button class="abtn" onclick="clearThirdOv()">Quitar</button></div>';
    }else{
      var active9=(AppState.rThirdOv===t9.g);
      h+='<div class="ibox">Empate exacto 8&ordm;/9&ordm;: <b>'+t8.t.n+'</b> (Gr.'+t8.g+') y <b>'+t9.t.n+'</b> (Gr.'+t9.g+') &mdash; '+t8.pts+'pts, DG '+(t8.gd>=0?'+':'')+t8.gd+', '+t8.gf+'GF. FIFA desempata por fair-play/sorteo (la app no lo calcula). Elige quien clasifica como 8&ordm;:</div>';
      h+='<div style="display:flex;gap:7px;flex-wrap:wrap;">';
      h+='<button class="abtn" style="'+(!active9?'border-color:#1a6b3c;color:#2a8a4c;background:#0d1a12;':'')+'" onclick="clearThirdOv()">'+flagImg(t8.t.f,20,t8.t.n)+' '+t8.t.n+' (Gr.'+t8.g+')'+(!active9?' &#10003;':'')+'</button>';
      h+='<button class="abtn" style="'+(active9?'border-color:#1a6b3c;color:#2a8a4c;background:#0d1a12;':'')+'" onclick="setThirdOv(\''+t9.g+'\')">'+flagImg(t9.t.f,20,t9.t.n)+' '+t9.t.n+' (Gr.'+t9.g+')'+(active9?' &#10003;':'')+'</button>';
      h+='</div>';
    }
  }
  h+='</div>';
  h+='<div class="asec"><div class="asectitle">Podio Oficial</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:7px;margin-bottom:9px;">';
  [0,1,2,3].forEach(function(pos){h+='<div style="background:var(--panel);border:1px solid var(--border);padding:9px;"><div style="font-size:9px;letter-spacing:1px;color:'+pc[pos]+';text-transform:uppercase;margin-bottom:5px;">'+['1er','2do','3ro','4to'][pos]+' '+PPTS[pos]+'pts</div><select id="op-'+pos+'" style="width:100%;padding:5px;background:#1a2030;border:1px solid var(--border);color:var(--text);font-family:\'Barlow Condensed\',sans-serif;font-size:12px;"><option value="">Sin definir</option>'+allT.map(function(t){return'<option value="'+t.n+'"'+(offR[pos]===t.n?' selected':'')+'>'+t.n+'</option>';}).join('')+'</select></div>';});
  h+='</div><button class="cbtn" onclick="saveOP()">Guardar Podio Oficial</button><span id="op-msg" style="font-size:11px;color:#2a8a4c;margin-left:9px;"></span></div>';
  h+='<div class="asec"><div class="asectitle">Podio de Todos ('+users.length+' participantes)</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;">';
  if(!ranked.length)h+='<div style="text-align:center;padding:16px;color:var(--muted);">Nadie registrado aun.</div>';
  ranked.forEach(function(u){
    var isW=u.pts>0&&u.pts===topP;
    var lk=u.locked?'<span style="font-size:9px;padding:1px 4px;border:1px solid #1a4a2c;color:#2a8a4c;">CONF</span>':'<span style="font-size:9px;padding:1px 4px;border:1px solid #3a3010;color:#a09020;">ABIERTO</span>';
    var uid='ubkt-'+btoa(unescape(encodeURIComponent(u.name))).replace(/[^a-zA-Z0-9]/g,'');
    var jp=sim.jointProb(u.podio);
    var jBadge='<span style="font-size:9px;color:var(--gold);border:1px solid var(--gold);padding:0 4px;margin-left:4px;" title="Probabilidad simulada de acertar los 4 puestos exactos a la vez">Podio '+fmtPct(jp)+'</span>';
    h+='<div class="ptcard"><div class="ptcard-hdr"><span class="ptcard-name">'+(isW?'🏆 ':'')+lk+' '+esc(u.name)+jBadge+'</span><span class="ptcard-pts">'+u.pts+'pts'+(u.maxPos>u.pts?' <span style="font-size:11px;color:var(--muted);font-weight:400;">(max '+u.maxPos+')</span>':'')+'</span></div><div class="ptpodio">';
    u.podio.forEach(function(t,pi){
      if(!t){h+='<div class="ptpos unk"><div class="ptpos-num" style="color:'+pc[pi]+'">'+(pi+1)+'°</div><div class="ptpos-fl">?</div><div class="ptpos-nm">-</div><div class="ptpos-st">-</div></div>';return;}
      var st3=teamPosStatus(el,t.n,pi),pW=rp[pi]&&rp[pi].n===t.n,pL=rp[pi]&&rp[pi].n!==t.n;
      var cls2=pW?'won':st3||pL?'dead':'alive';
      var st2=pW?'Acerto':st3==='out'?'Eliminado':(st3==='noTop2'||st3==='noBottom2'||pL)?'Pos. perdida':'Sigue vivo';
      var prob=sim.posProb[t.n]?sim.posProb[t.n][pi]:0;
      h+='<div class="ptpos '+cls2+'"><div class="ptpos-num" style="color:'+pc[pi]+'">'+(pi+1)+'°</div><div class="ptpos-fl">'+flagImg(t.f,24,t.n)+'</div><div class="ptpos-nm">'+t.n+'</div><div class="ptpos-st">'+st2+'</div><div class="ptpos-pct">'+fmtPct(prob)+'</div></div>';
    });
    h+='</div><div style="padding:5px 9px;display:flex;gap:5px;justify-content:flex-end;border-top:1px solid var(--border);background:#0d1118;">';
    h+='<button class="abtn" style="font-size:9px;border-color:#1a3a50;color:#4a8ab0" onclick="toggleUBkt(\''+u.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')" >Ver bracket</button>';
    if(u.locked)h+='<button class="abtn" style="font-size:9px;border-color:#3a2a10;color:#a07030" onclick="unlockU(\''+encodeURIComponent(u.name)+'\')">Desbloquear</button>';
    if(!u.data.extended){h+='<button class="abtn" style="font-size:9px;border-color:#3a5a10;color:#6a9a30" onclick="grantExt(\''+encodeURIComponent(u.name)+'\')">Dar ext.</button>';}else{h+='<button class="abtn" style="font-size:9px;border-color:#5a3a10;color:#c07820" onclick="revokeExt(\''+encodeURIComponent(u.name)+'\')">Revocar ext.</button>';}
    h+='<button class="dbtn" onclick="delU(\''+encodeURIComponent(u.name)+'\')">X</button></div>';
    h+='<div class="ubkt" id="'+uid+'">'+buildUBkt(u.data)+'</div></div>';
  });
  h+='</div></div>';
  h+='<div class="asec"><div class="asectitle">Registrar Participante</div>';
  h+='<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:flex-end;margin-bottom:9px;"><div style="flex:1;min-width:150px;"><label class="ll">Nombre</label><input class="li" id="nn" type="text" placeholder="Ej: Juan Perez" maxlength="40" style="margin-bottom:0;" autocomplete="off"></div><button class="cbtn" onclick="createU()">Crear Codigo</button></div>';
  h+='<div id="nr" style="display:none;background:#0d1a12;border:1px solid #1a3a22;padding:10px;"><div style="font-size:9px;letter-spacing:2px;color:var(--muted);margin-bottom:5px;">Codigo generado:</div>';
  h+='<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;"><span id="nc" style="font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:var(--gold);letter-spacing:4px;"></span>';
  h+='<button onclick="copyC()" style="padding:3px 10px;background:transparent;border:1px solid var(--gold);color:var(--gold);font-family:\'Barlow Condensed\',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;cursor:pointer;">Copiar para WhatsApp</button></div>';
  h+='<div id="nnd" style="font-size:11px;color:var(--muted);margin-top:3px;"></div></div></div>';
  wrap.innerHTML=h;
  setTimeout(renderRS,100);
}

export function setRRTab(r){
  AppState.rrTab=r;
  document.querySelectorAll('.rr-rtab').forEach(function(b){var lbs={grupos:'Grupos',r32:'16avos',r16:'Octavos',qf:'Cuartos',sf:'Semis',third:'3er Lugar',final:'Final'};b.classList.toggle('active',b.textContent===lbs[r]);});
  renderRS();
}
export function setRGr(g,mi,side,val){
  var v=val===''?null:Math.max(0,parseInt(val)||0);
  var rGr=AppState.rGr;
  if(!rGr[g])rGr[g]=MU.map(function(){return{h:null,a:null};});
  if(!rGr[g][mi])rGr[g][mi]={h:null,a:null};
  rGr[g][mi][side]=v;recRS(g);renderRS();
}
export function setRKo(r,i,side){
  var rKo=AppState.rKo;
  if(!rKo[r])rKo[r]=[];if(!rKo[r][i])rKo[r][i]={w:null};
  rKo[r][i].w=rKo[r][i].w===side?null:side;renderRS();
}
export function renderRS(){
  var cont=document.getElementById('rr-content');if(!cont)return;
  var rGr=AppState.rGr,rKo=AppState.rKo,rSt=AppState.rSt,rrTab=AppState.rrTab;
  if(rrTab==='grupos'){
    var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">';
    GS.forEach(function(g){
      var T=TEAMS[g];
      h+='<div class="gcard"><div class="ghdr"><div class="gltr">'+g+'</div><div class="gtitle">Grupo '+g+'</div></div><div class="msec">';
      MU.forEach(function(p,mi){
        var i=p[0],j=p[1],sc=rGr[g]?rGr[g][mi]||{h:null,a:null}:{h:null,a:null};
        var hid='rg'+g+'m'+mi+'h',aid='rg'+g+'m'+mi+'a';
        h+='<div class="mrow"><div class="mt">'+flagImg(T[i].f,20,T[i].n)+' '+T[i].n+'</div>';
        h+='<div class="sbox"><input id="'+hid+'" type="number" class="sinput'+(sc.h!==null?' filled':'')+'" min="0" max="99" placeholder="-" aria-label="Goles reales de '+esc(T[i].n)+'" oninput="setRGr(\''+g+'\','+mi+',\'h\',this.value)"><span class="ssep">:</span><input id="'+aid+'" type="number" class="sinput'+(sc.a!==null?' filled':'')+'" min="0" max="99" placeholder="-" aria-label="Goles reales de '+esc(T[j].n)+'" oninput="setRGr(\''+g+'\','+mi+',\'a\',this.value)"></div>';
        h+='<div class="mt r">'+T[j].n+' '+flagImg(T[j].f,20,T[j].n)+'</div></div>';
      });
      h+='</div></div>';
    });
    h+='</div>';cont.innerHTML=h;
    GS.forEach(function(g){MU.forEach(function(p,mi){var sc=rGr[g]?rGr[g][mi]||{h:null,a:null}:{h:null,a:null};var hi=cont.querySelector('#rg'+g+'m'+mi+'h'),ai=cont.querySelector('#rg'+g+'m'+mi+'a');if(hi&&sc.h!==null)hi.value=sc.h;if(ai&&sc.a!==null)ai.value=sc.a;});});
  }else{
    var rst={};GS.forEach(function(g){rst[g]=rSt[g]||[0,1,2,3];});
    var rb=buildBkt(rGr,rst,rKo,QFP_REAL);
    var kRounds={r32:{n:16,lbls:R32.map(function(d){return d.l;}),vs:R32.map(function(d){return d.v;}),bk:rb.r32},r16:{n:8,lbls:R16P.map(function(p,i){return'P'+(89+i);}),vs:R16V,bk:rb.r16},qf:{n:4,lbls:['P97','P98','P99','P100'],vs:QFV,bk:rb.qf},sf:{n:2,lbls:['P101','P102'],vs:SFV,bk:rb.sf},third:{n:1,lbls:['P103'],vs:['Dallas-ATT'],bk:rb.third},final:{n:1,lbls:['P104'],vs:['Nueva York-MetLife'],bk:rb.final}};
    var rd=kRounds[rrTab];if(!rd){cont.innerHTML='';return;}
    if(!rKo[rrTab])rKo[rrTab]=Array(rd.n).fill(null).map(function(){return{w:null};});
    var h='<div class="mgrid">';
    Array(rd.n).fill(0).forEach(function(x,idx){
      var k=rKo[rrTab][idx]||{w:null},m2=rd.bk[idx]||{h:null,a:null},hm=m2.h,am=m2.a,w=k.w;
      h+='<div class="mcard"><div class="mcard-hdr"><span>'+rd.lbls[idx]+'</span><span style="font-size:8px;color:var(--muted);">'+rd.vs[idx]+'</span></div>';
      h+='<div class="mcard-body"><div class="mcteam'+(w==='h'?' win':w?' los':'')+'"><div class="mcfl">'+(hm?flagImg(hm.f,28,hm.n):'?')+'</div><div class="mcnm">'+(hm?hm.n:'Por definir')+'</div></div>';
      h+='<div style="font-size:10px;color:var(--muted);padding:0 4px;">VS</div>';
      h+='<div class="mcteam'+(w==='a'?' win':w?' los':'')+'"><div class="mcfl">'+(am?flagImg(am.f,28,am.n):'?')+'</div><div class="mcnm">'+(am?am.n:'Por definir')+'</div></div></div>';
      h+='<div class="ko-gep"><button class="ko-gbtn'+(w==='h'?' win':'')+'" onclick="setRKo(\''+rrTab+'\','+idx+',\'h\')"'+((!hm&&!am)?' disabled':'')+'>&larr; '+(hm?hm.n:'Local')+'</button>';
      h+='<button class="ko-gbtn'+(w==='a'?' win':'')+'" onclick="setRKo(\''+rrTab+'\','+idx+',\'a\')"'+((!hm&&!am)?' disabled':'')+'>'+( am?am.n:'Visit.')+' &rarr;</button></div></div>';
    });
    h+='</div>';cont.innerHTML=h;
  }
}
export async function saveRR(){
  await stS('real_results',{grSc:AppState.rGr,koSc:AppState.rKo,savedAt:new Date().toISOString()});
  var m=document.getElementById('rr-msg');if(m){m.textContent='Guardado';setTimeout(function(){m.textContent='';},3000);}
}
export async function saveOP(){
  var vals=[0,1,2,3].map(function(i){var el=document.getElementById('op-'+i);return el?el.value||null:null;}).map(function(v){return v||null;});
  await stS('official_podio',vals);
  var m=document.getElementById('op-msg');if(m){m.textContent='Guardado';setTimeout(function(){m.textContent='';},3000);}
}
export async function setThirdOv(g){
  await stS('third_override',g);AppState.rThirdOv=g;
  alert('Listo. El Grupo '+g+' clasificara como 8vo mejor tercero mientras siga el empate exacto 8/9.');
  renderAdmin();
}
export async function clearThirdOv(){
  await stD('third_override');AppState.rThirdOv=null;
  renderAdmin();
}
function genCd(){var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',s='';for(var i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
export async function createU(){
  var nn=document.getElementById('nn');var name=(nn.value||'').trim();
  if(!name){alert('Ingresa el nombre.');return;}
  var ex=await stG('u_'+name);if(ex){alert('Ya existe.');return;}
  var code=genCd(),tries=0;
  while(await stG('c_'+code)&&tries<10){code=genCd();tries++;}
  await stS('c_'+code,{name:name,createdAt:new Date().toISOString()});
  await stS('u_'+name,{name:name,code:code,grSc:{},koSc:{},locked:false,savedAt:new Date().toISOString()});
  await addIdx(name);AppState.lastCd=code;AppState.lastNm=name;
  var nr=document.getElementById('nr'),nc=document.getElementById('nc'),nnd=document.getElementById('nnd');
  if(nr)nr.style.display='block';if(nc)nc.textContent=code;if(nnd)nnd.textContent='Participante: '+name;if(nn)nn.value='';
}
export async function copyC(){
  var msg='Mundial 2026 - Quiniela de Papanando\n\nHola '+AppState.lastNm+'! Tu codigo de acceso es:\n\n'+AppState.lastCd+'\n\nEntra aqui: https://szm2712.github.io/QUINIELA-WC-2026/\n\nEntrada: Q.250 - El ganador se lleva todo el pozo!';
  try{await navigator.clipboard.writeText(msg);var b=event.target;b.textContent='Copiado!';setTimeout(function(){b.textContent='Copiar para WhatsApp';},2500);}
  catch(e){prompt('Copia este codigo:',AppState.lastCd);}
}
export async function delU(enc){
  var name=decodeURIComponent(enc);if(!confirm('Eliminar a '+name+'?'))return;
  var u=await stG('u_'+name);if(u&&u.code)await stD('c_'+u.code);
  await stD('u_'+name);await delIdx(name);renderAdmin();
}
export async function grantExt(enc){
  var name=decodeURIComponent(enc);
  if(!confirm('Dar extension a '+name+'? Podra seguir editando aunque el plazo haya vencido.'))return;
  var u=await stG('u_'+name);if(!u){alert('Usuario no encontrado.');return;}
  await stU('u_'+name,{extended:true,locked:false});
  alert('Extension dada. '+name+' debe recargar la pagina para editar.');
  renderAdmin();
}
export async function revokeExt(enc){
  var name=decodeURIComponent(enc);
  if(!confirm('Revocar extension de '+name+'?'))return;
  await stU('u_'+name,{extended:false});
  renderAdmin();
}
export async function unlockU(enc){
  var name=decodeURIComponent(enc);if(!confirm('Desbloquear quiniela de '+name+' y darle extension de tiempo?'))return;
  await stU('u_'+name,{locked:false,extended:true});
  renderAdmin();
}
export async function diagFB(){
  var data=await rawGetAll();
  if(!data){alert('Firebase vacio o sin conexion.');return;}
  var keys=Object.keys(data);
  var codes=keys.filter(function(k){return k.startsWith('c_');});
  var users=keys.filter(function(k){return k.startsWith('u_');});
  var idx=data['idx']||[];
  var lines=['FIREBASE DIAGNOSTICO:','Codigos ('+codes.length+'): '+codes.join(', '),'Usuarios ('+users.length+'): '+users.join(', '),'Indice ('+idx.length+'): '+JSON.stringify(idx)];
  codes.forEach(function(c){lines.push('  '+c+' -> '+JSON.stringify(data[c]));});
  alert(lines.join('\n'));
}
export async function rebuildIdx(){
  if(!confirm('Reconstruir indice? Esto busca todos los usuarios registrados.'))return;
  var data=await rawGetAll();if(!data){alert('No hay datos en Firebase.');return;}
  var names=Object.keys(data).filter(function(k){return k.startsWith('u_');}).map(function(k){return k.replace('u_','');});
  await stS('idx',names);
  alert('Indice reconstruido con '+names.length+' usuarios: '+names.join(', '));
  renderAdmin();
}
export function clearCache(){
  var keys=Object.keys(localStorage).filter(function(k){return k.startsWith('pap26_');});
  keys.forEach(function(k){localStorage.removeItem(k);});
  alert('Cache local limpiado ('+keys.length+' entradas). Recarga la pagina.');
  location.reload();
}
export async function nukeAll(){
  if(!confirm('Borrar TODO?'))return;if(!confirm('Seguro?'))return;
  await stD('idx');await stD('official_podio');await stD('real_results');
  Object.keys(localStorage).filter(function(k){return k.startsWith('pap26_');}).forEach(function(k){localStorage.removeItem(k);});
  alert('Borrado.');location.reload();
}
export async function expCSV(){
  var users=await getAllUsers();if(!users.length){alert('No hay datos.');return;}
  var offR=await stG('official_podio')||[null,null,null,null];
  var offP=offR.map(function(n){return n?Object.values(TEAMS).flat().find(function(t){return t.n===n;})||null:null;});
  var posLabels=['1ro Campeon','2do Subcampeon','3ro Tercer Lugar','4to Cuarto Lugar'];
  var favorites={'Francia':92,'Brasil':90,'Espana':89,'Inglaterra':87,'Argentina':86,'Portugal':84,'Alemania':82,'Paises Bajos':80,'Belgica':75,'Uruguay':70,'EE.UU.':65,'Mexico':60,'Croacia':58,'Senegal':55,'Marruecos':54,'Japon':52,'Corea del Sur':50,'Austria':48,'Colombia':47,'Ecuador':45,'Suiza':44,'Canada':42,'Australia':40,'Turquia':38,'Noruega':35,'Suecia':34,'Iran':30,'Arabia Saudita':28,'Rep. Checa':28,'Ghana':27,'Tunez':26,'Egipto':25,'Escocia':25,'Paraguay':23,'Bosnia y Herz.':22,'Panama':22,'Qatar':20,'Uzbekistan':19,'RD del Congo':18,'Irak':17,'Jordania':16,'Argelia':15,'Sudafrica':14,'Cabo Verde':12,'Nueva Zelanda':10,'Haiti':8,'Curazao':5,'Costa de Marfil':35};
  var BOLD_THRESHOLD=25;
  var podios=users.map(function(u){
    var p=deriveUP(u),pts2=0;
    p.forEach(function(t,i){if(t&&offP[i]&&t.n===offP[i].n)pts2+=PPTS[i];});
    return{name:u.name,code:u.code||'',locked:u.locked,pts:pts2,podio:p};
  });
  var rows1=[['PREDICCIONES DE PODIO - Quiniela de Papanando','','','','','','','']];
  rows1.push(['Participante','Codigo','Estado','Campeon (1ro)','2do Lugar','3ro Lugar','4to Lugar','Pts']);
  podios.forEach(function(u){rows1.push([u.name,u.code,u.locked?'Confirmado':'Abierto',u.podio[0]?u.podio[0].n:'-',u.podio[1]?u.podio[1].n:'-',u.podio[2]?u.podio[2].n:'-',u.podio[3]?u.podio[3].n:'-',u.pts]);});
  var rows2=[['ESTADISTICAS POR POSICION','','','']];
  [0,1,2,3].forEach(function(pos){
    var counts={};
    podios.forEach(function(u){var t=u.podio[pos];if(t)counts[t.n]=(counts[t.n]||0)+1;});
    var sorted=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a];});
    rows2.push(['']);
    rows2.push([posLabels[pos],'Equipo','Votos','% participantes']);
    sorted.forEach(function(team){rows2.push(['',team,counts[team],Math.round(counts[team]/podios.length*100)+'%']);});
  });
  var rows3=[['PREDICCIONES ATREVIDAS (prob. estimada < '+BOLD_THRESHOLD+'%)','','','']];
  rows3.push(['Participante','Posicion','Equipo','Probabilidad estimada']);
  podios.forEach(function(u){
    u.podio.forEach(function(t,pos){
      if(!t)return;
      var prob=favorites[t.n]||15;
      if(prob<BOLD_THRESHOLD)rows3.push([u.name,posLabels[pos],t.n,prob+'%']);
    });
  });
  if(rows3.length===2)rows3.push(['(Ninguna prediccion atrevida)','','','']);
  var rows4=[['PODIOS UNICOS (solo una persona los eligio)','','','','']];
  rows4.push(['Participante','Campeon','2do','3ro','4to']);
  var podioStrs={};
  podios.forEach(function(u){var key=u.podio.map(function(t){return t?t.n:'-';}).join('|');(podioStrs[key]=podioStrs[key]||[]).push(u);});
  Object.keys(podioStrs).forEach(function(key){if(podioStrs[key].length===1){var u=podioStrs[key][0];rows4.push([u.name,u.podio[0]?u.podio[0].n:'-',u.podio[1]?u.podio[1].n:'-',u.podio[2]?u.podio[2].n:'-',u.podio[3]?u.podio[3].n:'-']);}});
  if(rows4.length===2)rows4.push(['(Todos comparten algun podio igual)','','','','']);
  var allRows=[].concat(rows1,[[''],['']],rows2,[[''],['']],rows3,[[''],['']],rows4);
  var csv=allRows.map(function(r){return r.map(function(v){return'"'+String(v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='papanando_reporte_'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(url);
}
