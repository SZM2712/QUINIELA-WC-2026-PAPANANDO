// Pestaña "Estadísticas": historial de % de aciertos y export de la tabla actual como imagen.
import {stG,stPush,getAllUsers} from '../firebase.js';
import {loadRD,computeAciertos} from '../logic.js';
import {AppState} from '../state.js';
import {esc} from '../esc.js';

var PALETTE=['#e84545','#f2994a','#f2c94c','#6fcf97','#2d9cdb','#9b51e0','#eb5dab','#56ccf2'];
var lastRanking=[];

// Se llama desde admin.js justo despues de guardar resultados reales (saveRR), para ir
// acumulando un historial de % de aciertos sin necesidad de rediseñar el sistema de puntuacion.
export async function appendSnapshot(){
  await loadRD();
  var users=await getAllUsers();
  if(!users.length)return;
  var res=computeAciertos(users,AppState.rGr);
  if(!res.anyPlayed)return;
  var byUser={};
  res.stats.forEach(function(s){byUser[s.name]=s.pct;});
  await stPush('stats_history',{ts:Date.now(),byUser:byUser});
}

function buildSvgChart(snapshots,names){
  var w=Math.max(320,snapshots.length*60),h=180,padL=30,padB=20,padT=10;
  var innerW=w-padL-10,innerH=h-padT-padB;
  function x(i){return padL+(snapshots.length===1?0:i/(snapshots.length-1)*innerW);}
  function y(pct){return padT+innerH-(pct/100*innerH);}
  var svg='<svg viewBox="0 0 '+w+' '+h+'" width="100%" style="max-width:'+w+'px;">';
  [0,25,50,75,100].forEach(function(g){
    svg+='<line x1="'+padL+'" y1="'+y(g)+'" x2="'+(w-10)+'" y2="'+y(g)+'" stroke="#2a3040" stroke-width="1"/>';
    svg+='<text x="2" y="'+(y(g)+3)+'" font-size="8" fill="#6a7585">'+g+'%</text>';
  });
  names.forEach(function(name,ni){
    var pts=snapshots.map(function(s,i){var v=s.byUser?s.byUser[name]:undefined;return v===undefined?null:{x:x(i),y:y(v)};});
    var color=PALETTE[ni%PALETTE.length];
    var path='';
    pts.forEach(function(p){if(!p)return;path+=(path?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)+' ';});
    if(path)svg+='<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="2"/>';
    pts.forEach(function(p){if(p)svg+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="2.5" fill="'+color+'"/>';});
  });
  svg+='</svg>';
  return svg;
}

export async function renderStats(){
  var cont=document.getElementById('stats-content');if(!cont)return;
  cont.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);">Cargando...</div>';
  await loadRD();
  var users=await getAllUsers();
  if(!users.length){cont.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);">Aun no hay participantes.</div>';return;}
  var histRaw=await stG('stats_history')||{};
  var snapshots=Object.keys(histRaw).map(function(k){return histRaw[k];}).sort(function(a,b){return a.ts-b.ts;});
  var res=computeAciertos(users,AppState.rGr),current=res.stats.slice().sort(function(a,b){return b.pct-a.pct;});
  lastRanking=current;
  var names=users.map(function(u){return u.name;});

  var chartHtml;
  if(!res.anyPlayed){chartHtml='<div class="cmt-empty">Aun no hay resultados de partidos guardados.</div>';}
  else if(snapshots.length<2){chartHtml='<div class="cmt-empty">Se necesitan al menos 2 cargas de resultados del admin para mostrar una evolucion. Por ahora solo hay '+snapshots.length+'.</div>';}
  else{
    chartHtml=buildSvgChart(snapshots,names)+'<div class="stat-legend">'+names.map(function(n,i){return '<span class="stat-legend-item"><span class="stat-legend-sw" style="background:'+PALETTE[i%PALETTE.length]+'"></span>'+esc(n)+'</span>';}).join('')+'</div>';
  }

  var rows=current.map(function(s,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(s.name)+'</td><td style="text-align:right">'+s.pct+'% ('+s.hits+'/'+s.total+')</td></tr>';}).join('');

  cont.innerHTML='<div class="stat-card"><div class="stat-title">Evolucion de % de aciertos</div><div class="stat-svg-wrap">'+chartHtml+'</div></div>'+
    '<div class="stat-card"><div class="stat-title">Ranking actual de aciertos</div><table class="rtbl"><thead><tr><th>Pos</th><th>Participante</th><th class="rr">% Acierto</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<button class="cbtn stat-export-btn" onclick="exportRankingImage()">Descargar imagen</button></div>';
}

window.exportRankingImage=function(){
  if(!lastRanking.length){alert('Nada que exportar todavia.');return;}
  var rows=lastRanking.slice(0,10);
  var w=560,rowH=34,padTop=70,h=padTop+rows.length*rowH+20;
  var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  var ctx=canvas.getContext('2d');
  ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#D4AF37';ctx.font='bold 26px sans-serif';ctx.textAlign='center';
  ctx.fillText('Quiniela de Papanando - Aciertos',w/2,36);
  ctx.font='11px sans-serif';ctx.fillStyle='#6a7585';
  ctx.fillText('Mundial 2026',w/2,54);
  rows.forEach(function(s,i){
    var y=padTop+i*rowH;
    ctx.textAlign='left';
    ctx.fillStyle=i<3?'#D4AF37':'#e8e0d0';
    ctx.font='bold 15px sans-serif';
    ctx.fillText((i+1)+'. '+s.name,20,y+20);
    ctx.textAlign='right';
    ctx.fillText(s.pct+'%',w-20,y+20);
    ctx.strokeStyle='#2a3040';ctx.beginPath();ctx.moveTo(20,y+28);ctx.lineTo(w-20,y+28);ctx.stroke();
  });
  var a=document.createElement('a');a.download='papanando_aciertos.png';a.href=canvas.toDataURL('image/png');a.click();
};
