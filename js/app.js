// Punto de entrada: login/logout, guardado, temporizadores y wiring de la pagina.
import {PFX,APAS,DEADLINE,SCHEDULE,KO_SCHEDULE,TEAMS,GS,MU} from './data.js';
import {AppState} from './state.js';
import {stG,stU,addIdx} from './firebase.js';
import {initS,initRS,recSt,rebuildBkt,fmtCd,loadRD} from './logic.js';
import {renderGG,renderGroup,renderKO,updKO,renderPodium,flagImg,showTab,toggleUBkt} from './render.js';
import * as Admin from './admin.js';
import {renderStats} from './features/stats.js';
import {initReminders} from './features/notifications.js';

export function isPast(){if(AppState.uExt)return false;return Date.now()>=DEADLINE.getTime();}
export function applyLk(){
  var dis=AppState.uLk||isPast(),past=isPast()&&!AppState.uExt;
  document.getElementById('lk-open').style.display=(!AppState.uLk&&!past)?'flex':'none';
  document.getElementById('lk-locked').style.display=(AppState.uLk&&!AppState.uExt)?'flex':'none';
  document.getElementById('lk-past').style.display=(!AppState.uLk&&past)?'block':'none';
  var extEl=document.getElementById('lk-ext');if(extEl)extEl.style.display=AppState.uExt?'flex':'none';
  document.getElementById('lkbar').style.background=AppState.uExt?'#1a1500':AppState.uLk?'#0d1a12':past?'#1a0808':'#1a1020';
  document.querySelectorAll('.sinput,.ko-gbtn').forEach(function(el){el.disabled=dis;});
  var rb=document.getElementById('rbtn');if(rb)rb.disabled=dis;
}
window.__isPast=isPast;
window.__applyLk=applyLk;

export async function confirmar(){
  if(AppState.uLk||isPast())return;
  if(!confirm('Confirmar tu quiniela? No podras cambiarla despues.'))return;
  AppState.uLk=true;await doSave();applyLk();
}

function sched(){clearTimeout(AppState.saveTimer);AppState.saveTimer=setTimeout(doSave,900);}

async function checkExt(){
  if(!AppState.CU||AppState.CU==='__adm__')return;
  try{
    var u=await stG('u_'+AppState.CU);
    if(u&&u.extended&&!AppState.uExt){
      AppState.uExt=true;AppState.uLk=false;
      applyLk();renderGG();renderKO();
      var extEl=document.getElementById('lk-ext');if(extEl)extEl.style.display='flex';
      alert('El admin te dio una extension de tiempo. Ya puedes editar tu quiniela.');
    }
  }catch(e){}
  setTimeout(checkExt,30000);
}

async function doSave(){
  if(!AppState.CU||AppState.CU==='__adm__')return;
  // Actualizacion parcial: NO incluye "extended" a proposito, ese campo solo lo escribe el admin
  // (grantExt/revokeExt en admin.js) - evita que este guardado le pise una extension recien dada.
  await stU('u_'+AppState.CU,{name:AppState.CU,code:AppState.uCd,grSc:AppState.grSc,koSc:AppState.koSc,locked:AppState.uLk,savedAt:new Date().toISOString()});
  await addIdx(AppState.CU);
  var el=document.getElementById('sind');
  if(el){el.style.display='inline-block';clearTimeout(el._t);el._t=setTimeout(function(){el.style.display='none';},2000);}
}

function restoreD(s){
  if(s.grSc)GS.forEach(function(g){
    if(s.grSc[g]){
      if(Array.isArray(s.grSc[g])){
        s.grSc[g].forEach(function(r,i){if(r)AppState.grSc[g][i]={h:r.h!=null?r.h:null,a:r.a!=null?r.a:null};});
      }else{
        Object.keys(s.grSc[g]).forEach(function(k){
          var i=parseInt(k,10),r=s.grSc[g][k];
          if(!isNaN(i)&&r)AppState.grSc[g][i]={h:r.h!=null?r.h:null,a:r.a!=null?r.a:null};
        });
      }
    }
  });
  if(s.koSc)['r32','r16','qf','sf','final','third'].forEach(function(r){
    if(s.koSc[r]){
      if(Array.isArray(s.koSc[r])){
        s.koSc[r].forEach(function(k,i){if(AppState.koSc[r][i]&&k)AppState.koSc[r][i]={w:k.w||null};});
      }else{
        Object.keys(s.koSc[r]).forEach(function(key){
          var i=parseInt(key,10),k=s.koSc[r][key];
          if(!isNaN(i)&&AppState.koSc[r][i]&&k)AppState.koSc[r][i]={w:k.w||null};
        });
      }
    }
  });
}

export function setGrSc(g,mi,side,val){
  if(AppState.uLk||isPast())return;
  var v=val===''?null:Math.max(0,parseInt(val)||0);
  var grSc=AppState.grSc;
  if(!grSc[g][mi])grSc[g][mi]={h:null,a:null};
  grSc[g][mi][side]=v;
  recSt(g);renderGroup(g);
  rebuildBkt();renderKO();renderPodium();sched();
}
export function setKo(r,i,side){
  if(AppState.uLk||isPast())return;
  AppState.koSc[r][i].w=AppState.koSc[r][i].w===side?null:side;
  rebuildBkt();renderKO();renderPodium();updKO();sched();
}

function getTodayMatches(){
  var now=new Date(),etNow=new Date(now.getTime()+(-6*60)*60000);
  var y=etNow.getUTCFullYear(),m=('0'+(etNow.getUTCMonth()+1)).slice(-2),d=('0'+etNow.getUTCDate()).slice(-2);
  var today=y+'-'+m+'-'+d;
  return SCHEDULE.filter(function(x){return x.d===today;});
}
function getTodayKO(){
  var now=new Date(),etNow=new Date(now.getTime()+(-6*60)*60000);
  var y=etNow.getUTCFullYear(),m=('0'+(etNow.getUTCMonth()+1)).slice(-2),d=('0'+etNow.getUTCDate()).slice(-2);
  var today=y+'-'+m+'-'+d;
  return KO_SCHEDULE.filter(function(x){return x.d===today;});
}
async function renderMatchday(){
  var cont=document.getElementById('matchday');if(!cont)return;
  var matches=getTodayMatches(),koToday=getTodayKO();
  if(!matches.length&&!koToday.length){
    var now=new Date(),start2=new Date('2026-06-11T00:00:00-04:00'),end2=new Date('2026-07-19T23:59:00-04:00');
    if(now<start2)cont.innerHTML='<div style="font-size:10px;color:var(--muted);text-align:center;">El torneo comienza el 11 de junio</div>';
    else if(now>end2)cont.innerHTML='<div style="font-size:10px;color:var(--muted);text-align:center;">El torneo ha concluido</div>';
    else cont.innerHTML='<div style="font-size:10px;color:var(--muted);text-align:center;">No hay partidos hoy</div>';
    return;
  }
  var rrData=await stG('real_results');
  var grR=rrData&&rrData.grSc?rrData.grSc:{};
  var MUlocal=MU;
  var h='<div style="font-size:9px;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:6px;text-align:center;">Partidos de hoy</div>';
  matches.forEach(function(match){
    var result=null,g=match.g;
    if(grR[g]){
      MUlocal.forEach(function(p,mi){
        var hn=TEAMS[g][p[0]].n,an=TEAMS[g][p[1]].n;
        if(hn===match.h&&an===match.a){var sc=grR[g][mi];if(sc&&sc.h!==null&&sc.a!==null)result={h:sc.h,a:sc.a};}
        else if(hn===match.a&&an===match.h){var sc2=grR[g][mi];if(sc2&&sc2.h!==null&&sc2.a!==null)result={h:sc2.a,a:sc2.h};}
      });
    }
    var mid=result
      ?'<span style="padding:0 6px;font-family:\'Bebas Neue\',sans-serif;font-size:22px;color:var(--gold);">'+result.h+' - '+result.a+'</span>'
      :'<span style="padding:0 8px;color:var(--muted);font-size:14px;">'+match.et+' GT</span>';
    h+='<div style="padding:5px 0;border-bottom:1px solid #1a2030;">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;">';
    h+='<span style="flex:1;text-align:right;">'+flagImg(match.hf,20,match.h)+' '+match.h+'</span>'+mid+'<span style="flex:1;">'+match.a+' '+flagImg(match.af,20,match.a)+'</span>';
    h+='</div><div style="font-size:9px;color:var(--muted);text-align:center;">Gr.'+match.g+' &middot; '+match.v+'</div></div>';
  });
  koToday.forEach(function(match){
    h+='<div style="padding:5px 0;border-bottom:1px solid #1a2030;">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;">';
    h+='<span style="flex:1;text-align:right;">'+flagImg(match.hf,20,match.h)+' '+match.h+'</span><span style="padding:0 8px;color:var(--muted);font-size:14px;">'+match.et+' GT</span><span style="flex:1;">'+match.a+' '+flagImg(match.af,20,match.a)+'</span>';
    h+='</div><div style="font-size:9px;color:var(--gold);text-align:center;">Dieciseisavos &middot; '+match.v+'</div></div>';
  });
  cont.innerHTML=h;
  setTimeout(renderMatchday,60000);
}
async function renderTodayBanner(){
  var box=document.getElementById('today-banner');if(!box)return;
  if(!AppState.CU||AppState.CU==='__adm__'){box.style.display='none';return;}
  var matches=getTodayMatches();
  if(!matches.length){box.style.display='none';return;}
  var h='<div class="today-banner-title">&#9917; Tus predicciones para hoy</div>';
  matches.forEach(function(match){
    var g=match.g,pred=null;
    MU.forEach(function(p,mi){
      var hn=TEAMS[g][p[0]].n,an=TEAMS[g][p[1]].n;
      var sc=AppState.grSc[g]?AppState.grSc[g][mi]:null;
      if(!sc||sc.h===null||sc.a===null)return;
      if(hn===match.h&&an===match.a)pred={h:sc.h,a:sc.a};
      else if(hn===match.a&&an===match.h)pred={h:sc.a,a:sc.h};
    });
    var mid=pred?(pred.h+' - '+pred.a):'<span style="color:var(--muted);font-size:11px;">Sin predecir</span>';
    h+='<div class="today-match"><span class="today-mt" style="text-align:right;">'+flagImg(match.hf,20,match.h)+' '+match.h+'</span><span class="today-msc">'+mid+'</span><span class="today-mt">'+match.a+' '+flagImg(match.af,20,match.a)+'</span></div>';
  });
  box.innerHTML=h;
  box.style.display='block';
}

function tickCd(){
  var diff=DEADLINE.getTime()-Date.now();
  var col=diff<=0?'var(--red)':diff<3600000?'#c07820':'var(--gold)';
  var e2=document.getElementById('cd-app');
  if(e2){e2.textContent='Cierre grupos: '+fmtCd(diff);e2.style.color=col;}
  if(diff>0)setTimeout(tickCd,1000);else applyLk();
}

export async function doLogin(){
  var pe=document.getElementById('lpass'),ee=document.getElementById('lerr'),be=document.getElementById('lbtn');
  var code=(pe.value||'').trim();
  if(!code){ee.textContent='Ingresa tu codigo.';return;}
  if(code.toLowerCase()===APAS.toLowerCase()){
    document.getElementById('ls').style.display='none';
    document.getElementById('app').style.display='block';
    document.getElementById('utag').textContent='Admin';
    AppState.adm=true;AppState.CU='__adm__';
    initRS();await loadRD();
    showTab('admin',document.querySelector('.atab'));
    return;
  }
  ee.textContent='';be.textContent='Verificando...';be.disabled=true;
  try{
    var ud=null;
    var candidates=[code,code.toUpperCase(),code.toLowerCase()];
    for(var i=0;i<candidates.length;i++){var d=await stG('c_'+candidates[i]);if(d&&d.name){ud=d;AppState.uCd=candidates[i].toUpperCase();break;}}
    if(!ud){ee.textContent='Codigo no valido. Pide al admin que te registre.';be.textContent='ENTRAR';be.disabled=false;return;}
    AppState.CU=ud.name;
    try{localStorage.setItem(PFX+'lc',AppState.uCd);}catch(e){}
    initS();
    var saved=await stG('u_'+AppState.CU);
    if(saved){restoreD(saved);AppState.uLk=saved.locked||false;AppState.uExt=saved.extended||false;}
    GS.forEach(function(g){recSt(g);});rebuildBkt();
    document.getElementById('utag').textContent=AppState.CU;
    document.getElementById('ls').style.display='none';
    document.getElementById('app').style.display='block';
    renderGG();renderKO();renderPodium();updKO();applyLk();renderTodayBanner();
    setTimeout(checkExt,30000);
    initReminders();
  }catch(e){ee.textContent='Error: '+e.message;console.error(e);}
  be.textContent='ENTRAR';be.disabled=false;
}
export function doLogout(){
  if(!confirm('Salir?'))return;
  AppState.CU=null;AppState.adm=false;AppState.uLk=false;AppState.uCd='';AppState.uExt=false;
  document.getElementById('app').style.display='none';
  document.getElementById('ls').style.display='flex';
  document.getElementById('lpass').value='';
  document.getElementById('lbtn').textContent='ENTRAR';
  document.getElementById('lbtn').disabled=false;
}
export function resetTodo(){
  if(AppState.uLk||isPast()){alert('Tu quiniela esta bloqueada.');return;}
  if(!confirm('Reiniciar todo?'))return;
  initS();GS.forEach(function(g){recSt(g);});rebuildBkt();renderGG();renderKO();renderPodium();updKO();doSave();
}

// --- Exposicion en window: el HTML generado dinamicamente usa onclick="fn(...)" como identificadores
// globales, y los modulos ES no son globales automaticamente. ---
window.doLogin=doLogin;
window.doLogout=doLogout;
window.confirmar=confirmar;
window.resetTodo=resetTodo;
window.setGrSc=setGrSc;
window.setKo=setKo;
window.showTab=showTab;
window.toggleUBkt=toggleUBkt;
window.__renderStats=renderStats;
window.__renderAdmin=Admin.renderAdmin;
window.renderAdmin=Admin.renderAdmin;
window.chkAdm=Admin.chkAdm;
window.adminLogout=Admin.adminLogout;
window.setRRTab=Admin.setRRTab;
window.setRGr=Admin.setRGr;
window.setRKo=Admin.setRKo;
window.saveRR=Admin.saveRR;
window.saveOP=Admin.saveOP;
window.setThirdOv=Admin.setThirdOv;
window.clearThirdOv=Admin.clearThirdOv;
window.createU=Admin.createU;
window.copyC=Admin.copyC;
window.delU=Admin.delU;
window.grantExt=Admin.grantExt;
window.revokeExt=Admin.revokeExt;
window.unlockU=Admin.unlockU;
window.diagFB=Admin.diagFB;
window.rebuildIdx=Admin.rebuildIdx;
window.clearCache=Admin.clearCache;
window.nukeAll=Admin.nukeAll;
window.expCSV=Admin.expCSV;

document.addEventListener('DOMContentLoaded',function(){
  tickCd();renderMatchday();
  var s=localStorage.getItem(PFX+'lc');if(s)document.getElementById('lpass').value=s;
  document.getElementById('lpass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
});
