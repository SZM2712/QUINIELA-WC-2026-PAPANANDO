// Bracket visual tipo torneo (con lineas conectando cada ronda) para Posiciones > Bracket.
import {R16P,QFP_REAL,SFP} from '../data.js';
import {esc} from '../esc.js';

// Copia minima de flagImg (evita un import circular con render.js, que a su vez usaria este modulo).
function flag(code,name){
  if(!code)return'';
  return'<img src="https://flagcdn.com/w40/'+code+'.png" alt="'+esc(name||'')+'" style="width:16px;height:12px;object-fit:cover;vertical-align:middle;border-radius:2px;">';
}

var PAIRS={r16:R16P,qf:QFP_REAL,sf:SFP,final:[[0,1]]};
var PREV={r16:'r32',qf:'r16',sf:'qf',final:'sf'};

function teamRow(team,isWin,isLose,isConfirmed){
  if(!team)return '<div class="bkt-team bkt-team-empty">?</div>';
  var cls='bkt-team'+(isWin?' bkt-team-win':'')+(isLose?' bkt-team-lose':'')+(isConfirmed&&!isWin&&!isLose?' bkt-team-conf':'');
  return '<div class="'+cls+'">'+flag(team.f,team.n)+'<span>'+team.n+'</span></div>';
}

function matchBox(round,idx,rb,rKo,confFn){
  var m=(rb[round]||[])[idx]||{h:null,a:null};
  var k=(rKo[round]||[])[idx];
  var w=k&&k.w;
  var hConf=confFn?confFn(round,idx,'h',m.h):false;
  var aConf=confFn?confFn(round,idx,'a',m.a):false;
  return '<div class="bkt-match">'+
    teamRow(m.h,w==='h',w==='a',hConf)+
    teamRow(m.a,w==='a',w==='h',aConf)+
    '</div>';
}

function buildNode(round,idx,rb,rKo,confFn){
  var box=matchBox(round,idx,rb,rKo,confFn);
  if(round==='r32')return '<div class="bkt-leaf">'+box+'</div>';
  var pair=PAIRS[round][idx],prev=PREV[round];
  return '<div class="bkt-group">'+
    '<div class="bkt-side">'+buildNode(prev,pair[0],rb,rKo,confFn)+buildNode(prev,pair[1],rb,rKo,confFn)+'</div>'+
    '<div class="bkt-node">'+box+'</div>'+
    '</div>';
}

// rb: resultado de buildBkt(...) (con r32/r16/qf/sf/final/third). rKo: ganadores marcados por el admin.
// confFn(round, idx, side, team) -> bool, opcional: si ese slot ya esta matematicamente confirmado.
export function buildBracketTree(rb,rKo,confFn){
  var tree=buildNode('final',0,rb,rKo,confFn);
  var third=matchBox('third',0,rb,rKo,confFn);
  return '<div class="bkt-wrap"><div class="bkt-tree">'+tree+
    '<div class="bkt-third"><div class="bkt-third-lbl">Tercer Lugar</div>'+third+'</div>'+
    '</div></div>';
}
