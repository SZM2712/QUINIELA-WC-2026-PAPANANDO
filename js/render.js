// Renderizado de DOM: grupos, eliminatorias, podio, tabla de posiciones publica y aciertos.
import {GS,MU,TEAMS,R32,R16P,R16V,QFP_REAL,QFV,SFP,SFV,FEE,CUR,PPTS,MSTART} from './data.js';
import {cSt,calcQualStatus,gBT,buildBkt,rebuildBkt,deriveUP,getRlP,getRlE,podioFeasibility,realQuartersMap,placedInR32,confirmedThirds,loadRD,computeAciertos,teamPosStatus,runPodiumSimulation,computeWinProbabilities,computeScenarioBreakdown} from './logic.js';
import {AppState} from './state.js';
import {stG,getAllUsers} from './firebase.js';
import {esc} from './esc.js';
import {renderCommentToggle,refreshCommentCounts} from './features/comments.js';
import {buildBracketTree} from './features/brackettree.js';

// Formatea una probabilidad (0-1) como texto: 1 decimal si es chica, entero si no.
export function fmtPct(p){
  if(p==null)return'&mdash;';
  var v=p*100;
  if(v<=0)return'0%';
  if(v<10)return v.toFixed(1)+'%';
  return Math.round(v)+'%';
}
export function flagImg(code,size,name){
  if(!code)return'';
  size=size||20;
  var alt=name?esc(name):'';
  return'<img src="https://flagcdn.com/w40/'+code+'.png" alt="'+alt+'" style="width:'+size+'px;height:'+Math.round(size*0.75)+'px;object-fit:cover;vertical-align:middle;border-radius:2px;">';
}

export function renderGG(){
  var c=document.getElementById('gg');c.innerHTML='';
  GS.forEach(function(g){var d=document.createElement('div');d.className='gcard';d.id='gc-'+g;c.appendChild(d);renderGroup(g);});
}
export function renderGroup(g){
  var card=document.getElementById('gc-'+g);if(!card)return;
  var grSc=AppState.grSc,uLk=AppState.uLk;
  var s=cSt(g,grSc),T=TEAMS[g],order=s.order;
  var b=['b1','b2','b3','b4'],rc=['q1','q2','q3',''];
  var h='<div class="ghdr"><div class="gltr">'+g+'</div><div class="gtitle">Grupo '+g+'</div></div>';
  h+='<table class="sttbl"><thead><tr><th></th><th>Selección</th><th>PJ</th><th>GF</th><th>DG</th><th>Pts</th></tr></thead><tbody>';
  order.forEach(function(idx,rank){
    var pj=0;MU.forEach(function(p,mi){var sc=grSc[g][mi];if(sc&&sc.h!==null&&sc.a!==null&&(idx===p[0]||idx===p[1]))pj++;});
    var gd=s.gd[idx];
    h+='<tr class="'+rc[rank]+'"><td><span class="pbadge '+b[rank]+'">'+(rank+1)+'</span></td>';
    h+='<td><div class="tcell"><span>'+flagImg(T[idx].f,20,T[idx].n)+'</span>'+T[idx].n+'</div></td>';
    h+='<td>'+pj+'</td><td>'+s.gf[idx]+'</td><td>'+(gd>=0?'+':'')+gd+'</td><td class="stpts">'+s.pts[idx]+'</td></tr>';
  });
  h+='</tbody></table><div class="msec">';
  var dis=AppState.uLk||isPastDeadline();
  MU.forEach(function(p,mi){
    var i=p[0],j=p[1],sc=grSc[g][mi]||{h:null,a:null};
    var hid='g'+g+'m'+mi+'h',aid='g'+g+'m'+mi+'a';
    h+='<div class="mrow"><div class="mt">'+flagImg(T[i].f,20,T[i].n)+' '+T[i].n+'</div>';
    h+='<div class="sbox"><input id="'+hid+'" type="number" class="sinput'+(sc.h!==null?' filled':'')+'" min="0" max="99" placeholder="-" aria-label="Goles de '+esc(T[i].n)+'"'+(dis?' disabled':'')+' oninput="setGrSc(\''+g+'\','+mi+',\'h\',this.value)">';
    h+='<span class="ssep">:</span><input id="'+aid+'" type="number" class="sinput'+(sc.a!==null?' filled':'')+'" min="0" max="99" placeholder="-" aria-label="Goles de '+esc(T[j].n)+'"'+(dis?' disabled':'')+' oninput="setGrSc(\''+g+'\','+mi+',\'a\',this.value)"></div>';
    h+='<div class="mt r">'+T[j].n+' '+flagImg(T[j].f,20,T[j].n)+'</div>';
    h+=renderCommentToggle('gr_'+g+'_'+mi);
    h+='</div>';
    h+='<div class="cmt-slot" data-cmt="gr_'+g+'_'+mi+'"></div>';
  });
  h+='</div>';
  card.innerHTML=h;
  MU.forEach(function(p,mi){
    var sc=grSc[g][mi]||{h:null,a:null};
    var hi=card.querySelector('#g'+g+'m'+mi+'h'),ai=card.querySelector('#g'+g+'m'+mi+'a');
    if(hi&&sc.h!==null)hi.value=sc.h;if(ai&&sc.a!==null)ai.value=sc.a;
  });
  refreshCommentCounts();
}

function isPastDeadline(){
  // Duplicado minimo de app.js:isPast() para no crear un ciclo de import; solo se usa para deshabilitar inputs al renderizar.
  return window.__isPast?window.__isPast():false;
}

export function updKO(){
  var koSc=AppState.koSc,done=0;
  ['r32','r16','qf','sf','third','final'].forEach(function(r){koSc[r].forEach(function(k){if(k.w)done++;});});
  document.getElementById('ko-label').textContent=done+' / 32 partidos';
  document.getElementById('ko-bar').style.width=Math.round(done/32*100)+'%';
}
export function renderTI(){
  var cont=document.getElementById('tinfo');if(!cont)return;
  var qt=gBT(AppState.grSc,AppState.ST);
  var h='<div style="font-family:\'Bebas Neue\',sans-serif;font-size:14px;letter-spacing:2px;color:var(--muted);margin-bottom:6px;">3ros clasificados</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:4px;">';
  qt.forEach(function(t,i){
    var ok=i<8,bg=ok?'#0a1a0d':'#1a0808',bc=ok?'#1a4a2c':'#3a1515',c=ok?'#2a8a4c':'var(--red)';
    h+='<div style="background:'+bg+';border:1px solid '+bc+';padding:3px 7px;font-size:10px;display:flex;align-items:center;gap:4px;">';
    h+='<span style="font-size:9px;font-weight:700;color:'+c+'">#'+(i+1)+'</span>';
    h+='<span style="font-size:9px;background:#1a2030;color:var(--gold);padding:1px 4px;font-weight:700;">Gr.'+t.g+'</span>';
    h+='<span>'+flagImg(t.t.f,20,t.t.n)+'</span><span style="font-weight:600;">'+t.t.n+'</span>';
    h+='<span style="color:var(--muted);font-size:9px;">'+t.pts+'pts '+t.gd+'DG</span></div>';
  });
  h+='</div>';cont.innerHTML=h;
}
export function renderKO(){
  renderTI();
  var tabsEl=document.getElementById('rtabs'),cont=document.getElementById('rviews');
  if(!tabsEl||!cont)return;
  var BKT=AppState.BKT,koSc=AppState.koSc;
  var ar=document.querySelector('.rtab.active');ar=ar?ar.dataset.round:'r32';
  var rounds=[
    {id:'r32',name:'16avos',bk:BKT.r32,ks:koSc.r32,lbls:R32.map(function(d){return d.l;}),vs:R32.map(function(d){return d.v;})},
    {id:'r16',name:'Octavos',bk:BKT.r16,ks:koSc.r16,lbls:R16P.map(function(p,i){return'P'+(89+i);}),vs:R16V},
    {id:'qf',name:'Cuartos',bk:BKT.qf,ks:koSc.qf,lbls:['P97','P98','P99','P100'],vs:QFV},
    {id:'sf',name:'Semis',bk:BKT.sf,ks:koSc.sf,lbls:['P101','P102'],vs:SFV},
    {id:'third',name:'3er Lugar',bk:BKT.third,ks:koSc.third,lbls:['P103'],vs:['Miami-Hard Rock']},
    {id:'final',name:'Final',bk:BKT.final,ks:koSc.final,lbls:['P104'],vs:['Nueva York-MetLife']}
  ];
  tabsEl.innerHTML='';cont.innerHTML='';
  rounds.forEach(function(round){
    var done=round.bk&&round.bk.every(function(m,i){return(!m.h&&!m.a)||round.ks[i]&&round.ks[i].w;});
    var btn=document.createElement('button');
    btn.className='rtab'+(round.id===ar?' active':'')+(done?' done':'');
    btn.dataset.round=round.id;btn.textContent=round.name;
    btn.setAttribute('role','tab');btn.setAttribute('aria-selected',round.id===ar?'true':'false');
    btn.onclick=function(){
      document.querySelectorAll('.rtab').forEach(function(b){b.classList.remove('active');b.setAttribute('aria-selected','false');});
      document.querySelectorAll('.rview').forEach(function(v){v.classList.remove('active');});
      btn.classList.add('active');btn.setAttribute('aria-selected','true');document.getElementById('rv-'+round.id).classList.add('active');
    };
    tabsEl.appendChild(btn);
    var view=document.createElement('div');view.className='rview'+(round.id===ar?' active':'');view.id='rv-'+round.id;view.setAttribute('role','tabpanel');
    var grid=document.createElement('div');grid.className='mgrid';
    (round.bk||[]).forEach(function(match,idx){
      var k=round.ks[idx]||{w:null},h=match.h,a=match.a,w=k.w;
      var dis=AppState.uLk||isPastDeadline()||(!h&&!a);
      var card=document.createElement('div');card.className='mcard';
      var ch='<div class="mcard-hdr"><span>'+round.lbls[idx]+'</span><span style="font-size:8px;color:var(--muted);">'+round.vs[idx]+'</span></div>';
      ch+='<div class="mcard-body">';
      ch+='<div class="mcteam'+(w==='h'?' win':w?' los':'')+'"><div class="mcfl">'+(h?flagImg(h.f,28,h.n):'?')+'</div><div class="mcnm">'+(h?h.n:'Por definir')+'</div></div>';
      ch+='<div style="font-size:10px;color:var(--muted);padding:0 4px;">VS</div>';
      ch+='<div class="mcteam'+(w==='a'?' win':w?' los':'')+'"><div class="mcfl">'+(a?flagImg(a.f,28,a.n):'?')+'</div><div class="mcnm">'+(a?a.n:'Por definir')+'</div></div>';
      ch+='</div><div class="ko-gep">';
      ch+='<button class="ko-gbtn'+(w==='h'?' win':'')+'" onclick="setKo(\''+round.id+'\','+idx+',\'h\')"'+(dis?' disabled':'')+'>&larr; '+(h?h.n:'Local')+'</button>';
      ch+='<button class="ko-gbtn'+(w==='a'?' win':'')+'" onclick="setKo(\''+round.id+'\','+idx+',\'a\')"'+(dis?' disabled':'')+'>'+( a?a.n:'Visit.')+' &rarr;</button>';
      ch+='</div>';
      var cmtKey='ko_'+round.id+'_'+idx;
      ch+=renderCommentToggle(cmtKey)+'<div class="cmt-slot" data-cmt="'+cmtKey+'"></div>';
      card.innerHTML=ch;grid.appendChild(card);
    });
    view.appendChild(grid);cont.appendChild(view);
  });
  window.__applyLk&&window.__applyLk();
  refreshCommentCounts();
}

export function renderPodium(){
  var cont=document.getElementById('podium');if(!cont)return;
  var res=rebuildBkt(),teams=res.podio;
  var order=[1,0,2,3],cls=['pp2','pp1','pp3','pp4'],nums=['2','1','3','4'],pts=['9pts','11pts','8pts','5pts'];
  var h='';
  order.forEach(function(pos,vi){
    var t=teams[pos];
    h+='<div class="pplace '+cls[vi]+'"><div class="pteam">';
    if(t){if(pos===0)h+='<span class="crown">🏆</span>';h+='<div class="pflag">'+flagImg(t.f,32,t.n)+'</div><div class="pname">'+t.n+'</div>';}
    else h+='<span class="pempty">Por definir</span>';
    h+='</div><div class="pblock"><div class="pnum">'+nums[vi]+'</div><div class="ppts">'+pts[vi]+'</div></div></div>';
  });
  cont.innerHTML=h;
  var fc=document.getElementById('podio-feas');
  if(fc){
    var rstM={};GS.forEach(function(g){rstM[g]=cSt(g,AppState.rGr).order;});
    var rbM=buildBkt(AppState.rGr,rstM,AppState.rKo);
    if(placedInR32(rbM)>=32){
      var fM=podioFeasibility(teams,realQuartersMap(rbM),getRlE());
      var col=fM.pct>=100?'#2a8a4c':fM.pct>=50?'#c9a227':'#e05050';
      var hh='<div style="border:1px solid '+col+';background:rgba(0,0,0,0.2);padding:9px 12px;">'+
        '<div style="font-size:13px;color:'+col+';font-weight:700;">Maximo alcanzable segun el bracket: '+fM.pct+'%</div>'+
        '<div style="font-size:10px;color:var(--muted);margin-top:3px;">Maximo de posiciones de tu podio que pueden lograrse a la vez segun en que lado del cuadro proyectado cae cada equipo.</div>';
      if(fM.pct<100&&fM.reasons.length)hh+='<div style="font-size:11px;color:var(--text);margin-top:5px;">&#9888;&#65039; '+fM.reasons.slice(0,2).join('; ')+'.</div>';
      fc.innerHTML=hh+'</div>';
    }else{fc.innerHTML='<div style="font-size:11px;color:var(--muted);text-align:center;">El % alcanzable por bracket aparecera cuando se proyecten los 16avos (faltan resultados de grupos).</div>';}
  }
}

export async function renderPodiosTab(){
  var started=Date.now()>=MSTART.getTime();
  var lk=document.getElementById('podios-locked'),op=document.getElementById('podios-open');
  if(!started){if(lk)lk.style.display='block';if(op)op.style.display='none';return;}
  if(lk)lk.style.display='none';if(op)op.style.display='block';
  await loadRD();
  var el=getRlE(),rp=getRlP();
  var sim=runPodiumSimulation();
  var rstP={};GS.forEach(function(g){rstP[g]=cSt(g,AppState.rGr).order;});
  var rbP=buildBkt(AppState.rGr,rstP,AppState.rKo);
  var qmapP=realQuartersMap(rbP);
  var bracketReady=placedInR32(rbP)>=32;
  var offR=await stG('official_podio')||[null,null,null,null];
  var offP=offR.map(function(n){return n?Object.values(TEAMS).flat().find(function(t){return t.n===n;})||null:null;});
  var users=await getAllUsers();
  var n=users.length,total=n*FEE;
  var bn=document.getElementById('pbanner');
  if(bn)bn.innerHTML='<div class="pi"><div class="pilbl">Participantes</div><div class="pival" style="color:var(--text)">'+n+'</div></div><div class="pi"><div class="pilbl">Pozo</div><div class="pival" style="color:var(--gold)">'+CUR+total.toFixed(0)+'</div></div><div class="pi"><div class="pilbl">Sistema</div><div class="pival" style="font-size:14px;color:var(--muted)">1ro=11 2do=9 3ro=8 4to=5</div></div>';
  var cont=document.getElementById('tgrid');if(!cont)return;
  if(!users.length){cont.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);">Aun no hay participantes.</div>';return;}
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
    return{name:u.name,pts:pts2,maxPos:maxPos,podio:podio,feas:podioFeasibility(podio,qmapP,el)};
  }).sort(function(a,b){return b.maxPos-a.maxPos||b.pts-a.pts;});
  var winRank=computeWinProbabilities(sim.results,ranked);

  var h='<div class="evol-msec-title" style="margin-top:0;">&#127942; Probabilidad de Ganar</div>';
  h+='<div class="ibox">Probabilidad de terminar con MAS puntos que cualquier otro participante'+(sim.exact?', calculando exactamente los '+sim.nSims+' escenarios posibles que quedan para lo que falta del torneo (ver pesta&ntilde;a Escenarios).':', corriendo el resto del torneo miles de veces al azar (quedan demasiados partidos por definir para calcularlo exacto).')+'</div>';
  h+='<table class="rtbl" style="margin-bottom:14px;"><thead><tr><th>Pos</th><th>Participante</th><th class="rr">Prob. de ganar</th></tr></thead><tbody>';
  winRank.forEach(function(r,i){
    var medal=i===0?'&#129351;':i===1?'&#129352;':i===2?'&#129353;':(i+1);
    h+='<tr><td style="font-family:\'Bebas Neue\',sans-serif;font-size:'+(i<3?'18':'13')+'px;color:'+(i<3?'var(--gold)':'var(--muted)')+';">'+medal+'</td><td style="font-weight:700;">'+esc(r.name)+'</td><td style="text-align:right;font-family:\'Bebas Neue\',sans-serif;font-size:16px;color:var(--gold);">'+fmtPct(r.prob)+'</td></tr>';
  });
  h+='</tbody></table>';
  h+='<div class="ibox" style="margin-bottom:10px;">Ordenado por el maximo de puntos que cada quien aun puede alcanzar segun los resultados reales (no solo lo ya confirmado). El % "Bracket" es el maximo de posiciones del podio que pueden lograrse a la vez segun en que lado del cuadro proyectado cae cada equipo.</div>';
  ranked.forEach(function(u){
    var maxLabel=u.maxPos>u.pts?' <span style="font-size:11px;color:var(--muted);font-weight:400;">(max '+u.maxPos+')</span>':'';
    var f=u.feas,fcol=f.pct>=100?'#2a8a4c':f.pct>=50?'#c9a227':'#e05050';
    var fBadge=bracketReady?'<span style="font-size:10px;color:'+fcol+';border:1px solid '+fcol+';padding:0 5px;margin-left:6px;" title="Maximo del podio alcanzable segun el bracket">Bracket '+f.pct+'%</span>':'<span style="font-size:10px;color:var(--muted);margin-left:6px;">Bracket: &mdash;</span>';
    var jp=sim.jointProb(u.podio);
    var jBadge='<span style="font-size:10px;color:var(--gold);border:1px solid var(--gold);padding:0 5px;margin-left:6px;" title="Probabilidad simulada de acertar los 4 puestos exactos a la vez">Podio '+fmtPct(jp)+'</span>';
    h+='<div class="ptcard"><div class="ptcard-hdr"><span class="ptcard-name">'+esc(u.name)+fBadge+jBadge+'</span><span class="ptcard-pts">'+u.pts+'pts'+maxLabel+'</span></div><div class="ptpodio">';
    u.podio.forEach(function(t,pi){
      if(!t){h+='<div class="ptpos unk"><div class="ptpos-num" style="color:'+pc[pi]+'">'+(pi+1)+'°</div><div class="ptpos-fl">?</div><div class="ptpos-nm">-</div><div class="ptpos-st">-</div></div>';return;}
      var st3=teamPosStatus(el,t.n,pi),pW=rp[pi]&&rp[pi].n===t.n,pL=rp[pi]&&rp[pi].n!==t.n;
      var cls2=pW?'won':st3||pL?'dead':'alive';
      var st2=pW?'Acerto':st3==='out'?'Eliminado':(st3==='noTop2'||st3==='noBottom2'||pL)?'Pos. perdida':'Sigue vivo';
      var prob=sim.posProb[t.n]?sim.posProb[t.n][pi]:0;
      h+='<div class="ptpos '+cls2+'"><div class="ptpos-num" style="color:'+pc[pi]+'">'+(pi+1)+'°</div><div class="ptpos-fl">'+flagImg(t.f,24,t.n)+'</div><div class="ptpos-nm">'+t.n+'</div><div class="ptpos-st">'+st2+'</div><div class="ptpos-pct" title="Probabilidad simulada de que '+esc(t.n)+' llegue a este puesto">'+fmtPct(prob)+'</div></div>';
    });
    h+='</div>';
    if(bracketReady&&f.pct<100&&f.reasons.length)h+='<div style="padding:4px 9px 8px;font-size:10px;color:var(--muted);line-height:1.4;">&#9888;&#65039; Limita el podio: '+f.reasons.slice(0,2).join('; ')+'.</div>';
    h+='</div>';
  });
  cont.innerHTML=h;
}

// Cuantos escenarios como maximo se listan uno por uno en la pestaña Escenarios. Con pocos
// partidos de eliminacion directa pendientes (ej. solo Final y 3er lugar) esto lista todos;
// si aun quedan demasiados partidos por jugar, se muestra un aviso en vez de una lista enorme.
var SCENARIO_DISPLAY_MAX=32;
export async function renderEscenariosTab(){
  var started=Date.now()>=MSTART.getTime();
  var cont=document.getElementById('escenarios-content');
  if(!cont)return;
  if(!started){cont.innerHTML='<div style="text-align:center;padding:40px 20px;"><div style="font-size:48px;margin-bottom:12px;">&#9203;</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;letter-spacing:3px;color:var(--gold);">Disponible cuando arranque el Mundial</div></div>';return;}
  await loadRD();
  var sim=runPodiumSimulation();
  var users=await getAllUsers();
  if(!users.length){cont.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);">Aun no hay participantes.</div>';return;}
  var ranked=users.map(function(u){return{name:u.name,podio:deriveUP(u)};});
  var scenarios=computeScenarioBreakdown(sim.results,ranked);
  if(!sim.exact||scenarios.length>SCENARIO_DISPLAY_MAX){
    cont.innerHTML='<div class="ibox">Todavia quedan demasiados partidos de eliminacion directa por definir para listar cada escenario posible uno por uno. Esta vista se activa sola cuando queden pocos partidos pendientes (por ejemplo, cuando ya solo falten la Final y el partido por el 3er lugar). Mientras tanto, revisa las probabilidades en la pesta&ntilde;a Podios.</div>';
    return;
  }
  var pc=['var(--gold)','#9aa0aa','#a07040','var(--muted)'];
  var allT=Object.values(TEAMS).flat();
  var h='<div class="ibox">Con los partidos de eliminacion directa ya jugados fijos, queda'+(scenarios.length===1?'':'n')+' exactamente '+scenarios.length+' escenario'+(scenarios.length===1?'':'s')+' posible'+(scenarios.length===1?'':'s')+' para el resto del torneo'+(scenarios.length>1?' (cada uno con '+fmtPct(scenarios[0].prob)+' de probabilidad)':'')+'.</div>';
  scenarios.forEach(function(s,si){
    h+='<div class="asec" style="background:var(--panel);border:1px solid var(--border);padding:10px;">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px;">';
    h+='<div style="font-family:\'Bebas Neue\',sans-serif;font-size:15px;letter-spacing:1px;color:var(--text);">Escenario '+(si+1)+'</div>';
    h+='<span style="font-size:10px;color:var(--gold);border:1px solid var(--gold);padding:1px 6px;">'+fmtPct(s.prob)+' de probabilidad</span>';
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:6px;margin-bottom:8px;">';
    s.podio.forEach(function(name,pos){
      var t=name?allT.find(function(x){return x.n===name;}):null;
      h+='<div style="background:var(--bg);border:1px solid var(--border);padding:6px;text-align:center;">'+
        '<div style="font-size:9px;letter-spacing:1px;color:'+pc[pos]+';text-transform:uppercase;">'+['1ro','2do','3ro','4to'][pos]+'</div>'+
        (t?flagImg(t.f,22,t.n):'')+
        '<div style="font-size:11px;font-weight:700;margin-top:2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">'+esc(name||'?')+'</div>'+
        '</div>';
    });
    h+='</div>';
    h+='<div style="font-size:12px;"><span style="color:var(--muted);">Ganaria la quiniela: </span><span style="color:var(--gold);font-weight:700;">'+esc(s.winners.join(', '))+'</span> <span style="color:var(--muted);">('+s.best+'pts)</span></div>';
    h+='</div>';
  });
  cont.innerHTML=h;
}

export function buildUBkt(u){
  var gr=u.grSc||{},ko=u.koSc||{};
  var ust={};GS.forEach(function(g){ust[g]=cSt(g,gr).order;});
  var res=buildBkt(gr,ust,ko);
  var h='<div class="ubkt-gg">';
  GS.forEach(function(g){
    var T=TEAMS[g],s=cSt(g,gr),order=s.order;
    h+='<div class="ubkt-gc"><div class="ubkt-gh"><div class="ubkt-gl">'+g+'</div></div>';
    var b2=['b1','b2','b3','b4'];
    order.forEach(function(idx,rank){h+='<div style="display:flex;align-items:center;padding:2px 7px;gap:3px;font-size:10px;'+(rank<2?'background:#0d1a12;':'')+(rank===2?'background:#0d1220;':'')+' border-bottom:1px solid #141c28;"><span class="pbadge '+b2[rank]+'">'+(rank+1)+'</span><span style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:600;">'+flagImg(T[idx].f,20,T[idx].n)+' '+T[idx].n+'</span><span style="color:var(--gold);font-weight:700;font-size:11px;">'+s.pts[idx]+'</span></div>';});
    MU.forEach(function(p,mi){var sc=gr[g]?gr[g][mi]:null;if(!sc||sc.h===null||sc.a===null)return;h+='<div class="ubkt-row"><span class="ubkt-t">'+flagImg(T[p[0]].f,20,T[p[0]].n)+' '+T[p[0]].n+'</span><span class="ubkt-sc">'+sc.h+':'+sc.a+'</span><span class="ubkt-t" style="text-align:right">'+T[p[1]].n+' '+flagImg(T[p[1]].f,20,T[p[1]].n)+'</span></div>';});
    h+='</div>';
  });
  h+='</div><div class="ubkt-ko"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:2px;color:var(--muted);margin-bottom:6px;">Eliminatorias</div><div class="ubkt-ko-rounds">';
  var rds=[{id:'r32',name:'16avos',bk:res.r32,ks:ko.r32||[]},{id:'r16',name:'Octavos',bk:res.r16,ks:ko.r16||[]},{id:'qf',name:'Cuartos',bk:res.qf,ks:ko.qf||[]},{id:'sf',name:'Semis',bk:res.sf,ks:ko.sf||[]},{id:'third',name:'3er Lugar',bk:res.third,ks:ko.third||[]},{id:'final',name:'Final',bk:res.final,ks:ko.final||[]}];
  rds.forEach(function(round){
    var matches=round.bk||[];
    h+='<div class="ubkt-ko-r"><div class="ubkt-ko-rt">'+round.name+'</div>';
    var any=false;
    matches.forEach(function(m,i){var k=round.ks[i];if(!k||!k.w)return;var wn=k.w==='h'?m.h:m.a,ls=k.w==='h'?m.a:m.h;if(!wn)return;any=true;h+='<div class="ubkt-ko-m"><span class="ubkt-ko-w">'+flagImg(wn.f,20,wn.n)+' '+wn.n+'</span>'+(ls?'<span class="ubkt-ko-l"> vs '+ls.n+'</span>':'')+'</div>';});
    if(!any)h+='<div style="font-size:9px;color:var(--muted);">Sin resultados</div>';
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}
export function toggleUBkt(name){
  var id='ubkt-'+btoa(unescape(encodeURIComponent(name))).replace(/[^a-zA-Z0-9]/g,'');
  var el=document.getElementById(id);if(el)el.classList.toggle('open');
}

export async function renderAciertos(){
  var cont=document.getElementById('aciertos-content');if(!cont)return;
  cont.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);">Calculando...</div>';
  await loadRD();
  var users=await getAllUsers();
  if(!users.length){cont.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);">Aun no hay participantes.</div>';return;}
  var res=computeAciertos(users,AppState.rGr),stats=res.stats;
  if(!res.anyPlayed){cont.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);">Aun no hay resultados de partidos guardados.</div>';return;}
  stats.sort(function(a,b){return b.pct-a.pct||b.hits-a.hits;});
  var maxPct=stats.length?stats[0].pct:0;
  var h='<table class="rtbl"><thead><tr><th>Pos</th><th>Participante</th><th class="rr">Aciertos</th><th class="rr">% Acierto</th></tr></thead><tbody>';
  stats.forEach(function(s,i){
    var medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':String(i+1);
    h+='<tr><td style="font-family:\'Bebas Neue\',sans-serif;font-size:'+(i<3?'20':'14')+'px;color:'+(i<3?'var(--gold)':'var(--muted)')+';">'+medal+'</td><td style="font-weight:700;">'+esc(s.name)+'</td><td style="text-align:right;color:var(--muted);">'+s.hits+'/'+s.total+'</td><td style="text-align:right;font-family:\'Bebas Neue\',sans-serif;font-size:18px;color:var(--gold);">'+s.pct+'%</td></tr>';
  });
  h+='</tbody></table>';
  cont.innerHTML=h;
}

export async function renderPosPublic(){
  await loadRD();
  var tabsEl=document.getElementById('pos-rtabs');
  if(tabsEl){
    var lbs={grupos:'Grupos',bracket:'Bracket',r32:'16avos',r16:'Octavos',qf:'Cuartos',sf:'Semis',third:'3er Lugar',final:'Final'};
    tabsEl.innerHTML='';
    ['grupos','bracket','r32','r16','qf','sf','third','final'].forEach(function(r){
      var btn=document.createElement('button');
      btn.className='rr-rtab'+(r===AppState.posTab?' active':'');
      btn.textContent=lbs[r];
      btn.setAttribute('role','tab');btn.setAttribute('aria-selected',r===AppState.posTab?'true':'false');
      btn.onclick=function(){AppState.posTab=r;renderPosPublic();};
      tabsEl.appendChild(btn);
    });
  }
  var cont=document.getElementById('pos-content');if(!cont)return;
  var rGr=AppState.rGr,rKo=AppState.rKo,rSt=AppState.rSt,posTab=AppState.posTab;
  if(posTab==='grupos'){
    var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">';
    GS.forEach(function(g){
      var T=TEAMS[g],s=cSt(g,rGr),order=s.order;
      var b=['b1','b2','b3','b4'],rc=['q1','q2','q3',''];
      h+='<div class="gcard"><div class="ghdr"><div class="gltr">'+g+'</div><div class="gtitle">Grupo '+g+'</div></div>';
      h+='<table class="sttbl"><thead><tr><th></th><th>Equipo</th><th>PJ</th><th>GF</th><th>DG</th><th>Pts</th></tr></thead><tbody>';
      var qs2=calcQualStatus(g,rGr);
      order.forEach(function(idx,rank){
        var pj=0;MU.forEach(function(p,mi){var sc=rGr[g][mi];if(sc&&sc.h!==null&&sc.a!==null&&(idx===p[0]||idx===p[1]))pj++;});
        var gd=s.gd[idx];
        var qst=qs2.status[idx];
        var qfp=qs2.firstPlace[idx];
        var qBg2=qfp?'background:rgba(212,175,55,0.16);':qst==='q'?'background:rgba(42,138,76,0.18);':qst==='e'?'background:rgba(192,57,43,0.15);':'';
        var qTag2=qfp?' <span style="font-size:8px;color:var(--gold);border:1px solid #5a4a10;padding:0 3px;">&#127942; 1&deg; LUGAR</span>':qst==='q'?' <span style="font-size:8px;color:#2a8a4c;border:1px solid #1a4a2c;padding:0 3px;">CLASIFICA</span>':qst==='e'?' <span style="font-size:8px;color:#e05050;border:1px solid #5a1a1a;padding:0 3px;">ELIMINADO</span>':'';
        h+='<tr class="'+rc[rank]+'" style="'+qBg2+'"><td><span class="pbadge '+b[rank]+'">'+(rank+1)+'</span></td><td><div class="tcell"><span>'+flagImg(T[idx].f,20,T[idx].n)+'</span>'+T[idx].n+qTag2+'</div></td><td>'+pj+'</td><td>'+s.gf[idx]+'</td><td>'+(gd>=0?'+':'')+gd+'</td><td class="stpts">'+s.pts[idx]+'</td></tr>';
      });
      h+='</tbody></table></div>';
    });
    h+='</div>';
    cont.innerHTML=h;
  }else if(posTab==='bracket'){
    var rstB={};GS.forEach(function(g){rstB[g]=rSt[g]||[0,1,2,3];});
    var rbB=buildBkt(rGr,rstB,rKo,QFP_REAL);
    var confMapB={},confThirdSetB=confirmedThirds(rGr);
    GS.forEach(function(g){var qr=calcQualStatus(g,rGr),ord=rstB[g];var fl=!!qr.firstPlace[ord[0]];confMapB[g]={first:fl,second:fl&&qr.status[ord[1]]==='q'};});
    function confFn(round,idx,side,team){
      if(!team)return false;
      var sel=round==='r32'?R32[idx][side]:null;
      if(round!=='r32')return false; // el estado "confirmado" solo aplica a los 16avos (grupos ya definidos)
      if(sel.tf)return confThirdSetB.has(team.n);
      return sel.r===0?confMapB[sel.g].first:confMapB[sel.g].second;
    }
    var hh='<div style="font-size:11px;color:var(--muted);margin-bottom:6px;">Bracket <b style="color:var(--gold);">oficial (orden FIFA)</b> del torneo real. Los 16avos usan los clasificados de cada grupo (terceros = proyeccion). Verde = confirmado matematicamente. Dorado = avanzo de verdad. 16avos &rarr; Octavos &rarr; Cuartos &rarr; Semis &rarr; Final.</div>';
    hh+=buildBracketTree(rbB,rKo,confFn);
    cont.innerHTML=hh;
  }else{
    var rst={};GS.forEach(function(g){rst[g]=rSt[g]||[0,1,2,3];});
    var rb=buildBkt(rGr,rst,rKo,QFP_REAL);
    var confMap={};
    var confThirdSet=confirmedThirds(rGr);
    GS.forEach(function(g){
      var qr=calcQualStatus(g,rGr);
      var order=rst[g];
      var firstIdx=order[0],secondIdx=order[1];
      var firstLocked=!!qr.firstPlace[firstIdx];
      confMap[g]={first:firstLocked,second:firstLocked&&qr.status[secondIdx]==='q'};
    });
    function slotConfirmed(sel,team){
      if(!sel)return false;
      if(sel.tf)return !!(team&&confThirdSet.has(team.n));
      return sel.r===0?confMap[sel.g].first:confMap[sel.g].second;
    }
    var kRounds={r32:{n:16,lbls:R32.map(function(d){return d.l;}),vs:R32.map(function(d){return d.v;}),bk:rb.r32,sels:R32},r16:{n:8,lbls:R16P.map(function(p,i){return'P'+(89+i);}),vs:R16V,bk:rb.r16},qf:{n:4,lbls:['P97','P98','P99','P100'],vs:QFV,bk:rb.qf},sf:{n:2,lbls:['P101','P102'],vs:SFV,bk:rb.sf},third:{n:1,lbls:['P103'],vs:['Dallas-ATT'],bk:rb.third},final:{n:1,lbls:['P104'],vs:['Nueva York-MetLife'],bk:rb.final}};
    var rd=kRounds[posTab];if(!rd){cont.innerHTML='';return;}
    var h='<div class="mgrid">';
    Array(rd.n).fill(0).forEach(function(x,idx){
      var k=rKo[posTab]&&rKo[posTab][idx]?rKo[posTab][idx]:{w:null},m2=rd.bk[idx]||{h:null,a:null},hm=m2.h,am=m2.a,w=k.w;
      h+='<div class="mcard"><div class="mcard-hdr"><span>'+rd.lbls[idx]+'</span><span style="font-size:8px;color:var(--muted);">'+rd.vs[idx]+'</span></div>';
      var hConf=(posTab==='r32'&&hm&&slotConfirmed(rd.sels[idx].h,hm));
      var aConf=(posTab==='r32'&&am&&slotConfirmed(rd.sels[idx].a,am));
      var hConfMark=hConf?'<span style="font-size:8px;color:#2a8a4c;" title="Confirmado matematicamente">&#9989;</span>':'';
      var aConfMark=aConf?'<span style="font-size:8px;color:#2a8a4c;" title="Confirmado matematicamente">&#9989;</span>':'';
      var hNameStyle=(hConf&&!w)?' style="color:#2a8a4c;font-weight:700;"':'';
      var aNameStyle=(aConf&&!w)?' style="color:#2a8a4c;font-weight:700;"':'';
      h+='<div class="mcard-body"><div class="mcteam'+(w==='h'?' win':w?' los':'')+'"><div class="mcfl">'+(hm?flagImg(hm.f,28,hm.n):'?')+'</div><div class="mcnm"'+hNameStyle+'>'+hConfMark+(hm?hm.n:'Por definir')+'</div></div>';
      h+='<div style="font-size:10px;color:var(--muted);padding:0 4px;">VS</div>';
      h+='<div class="mcteam'+(w==='a'?' win':w?' los':'')+'"><div class="mcfl">'+(am?flagImg(am.f,28,am.n):'?')+'</div><div class="mcnm"'+aNameStyle+'>'+aConfMark+(am?am.n:'Por definir')+'</div></div></div>';
      if(w){var winner=w==='h'?hm:am;h+='<div style="padding:4px 10px;background:#0a1208;border-top:1px solid #1a3a22;font-size:10px;color:#2a8a4c;font-weight:700;text-align:center;">Avanza: '+winner.n+'</div>';}
      h+='</div>';
    });
    h+='</div>';
    cont.innerHTML=h;
  }
}

export function showTab(t,btn){
  document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active');x.setAttribute('aria-selected','false');});
  document.querySelectorAll('.view').forEach(function(x){x.classList.remove('active');});
  document.getElementById('tab-'+t).classList.add('active');
  if(btn){btn.classList.add('active');btn.setAttribute('aria-selected','true');}
  if(t==='podio')renderPodium();
  if(t==='podios')renderPodiosTab();
  if(t==='escenarios')renderEscenariosTab();
  if(t==='pos')renderPosPublic();
  if(t==='aciertos')renderAciertos();
  if(t==='admin')window.__renderAdmin&&window.__renderAdmin();
}
