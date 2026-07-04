// Comentarios cortos por partido (grupos y eliminatorias).
import {stG,stPush,stRemoveChild,stWatch} from '../firebase.js';
import {esc} from '../esc.js';
import {AppState} from '../state.js';

var MIN_POST_INTERVAL_MS=4000;
var openThreads={}; // key -> unsubscribe function de la suscripcion en tiempo real

export function renderCommentToggle(key){
  return '<button type="button" class="cmt-toggle" id="cmtbtn_'+key+'" onclick="toggleComments(\''+key+'\')">💬 <span id="cmtcount_'+key+'"></span></button>';
}

export async function refreshCommentCounts(){
  var btns=document.querySelectorAll('[id^="cmtbtn_"]');
  for(var i=0;i<btns.length;i++){
    var key=btns[i].id.replace('cmtbtn_','');
    var data=await stG('comments/'+key);
    var n=data?Object.keys(data).length:0;
    var cEl=document.getElementById('cmtcount_'+key);
    if(cEl)cEl.textContent=n>0?n:'';
  }
}

function renderThreadHtml(key,data){
  var items=data?Object.keys(data).map(function(id){return Object.assign({id:id},data[id]);}):[];
  items.sort(function(a,b){return (a.ts||0)-(b.ts||0);});
  var canModerate=AppState.adm;
  var h='';
  if(!items.length)h='<div class="cmt-empty">Sin comentarios todavia.</div>';
  else items.forEach(function(c){
    var canDel=canModerate||(AppState.CU&&AppState.CU===c.name);
    h+='<div class="cmt-item"><span class="cmt-name">'+esc(c.name)+':</span><span class="cmt-txt">'+esc(c.text)+'</span>'+
      (canDel?'<button class="cmt-del" onclick="deleteComment(\''+key+'\',\''+c.id+'\')">Borrar</button>':'')+'</div>';
  });
  if(AppState.CU&&AppState.CU!=='__adm__'){
    h+='<div class="cmt-form"><input class="cmt-input" id="cmtinput_'+key+'" maxlength="200" placeholder="Escribe un comentario..." onkeydown="if(event.key===\'Enter\')postComment(\''+key+'\')"><button class="cmt-send" onclick="postComment(\''+key+'\')">Enviar</button></div>';
  }
  return h;
}

window.toggleComments=async function(key){
  var slot=document.querySelector('.cmt-slot[data-cmt="'+key+'"]');
  if(!slot)return;
  var isOpen=slot.classList.contains('open');
  if(isOpen){
    slot.classList.remove('open');slot.innerHTML='';
    if(openThreads[key]){openThreads[key]();delete openThreads[key];}
    return;
  }
  slot.classList.add('open');
  slot.innerHTML='<div class="cmt-thread open cmt-empty">Cargando...</div>';
  var unsub=await stWatch('comments/'+key,function(data){
    var thread=slot.querySelector('.cmt-thread')||slot;
    slot.innerHTML='<div class="cmt-thread open">'+renderThreadHtml(key,data)+'</div>';
  });
  openThreads[key]=unsub;
};

window.postComment=async function(key){
  var input=document.getElementById('cmtinput_'+key);if(!input)return;
  var text=(input.value||'').trim();
  if(!text)return;
  if(text.length>200)text=text.slice(0,200);
  var last=parseInt(localStorage.getItem('pap26_lastComment')||'0',10);
  if(Date.now()-last<MIN_POST_INTERVAL_MS){alert('Espera unos segundos antes de comentar de nuevo.');return;}
  var name=AppState.CU==='__adm__'?'Admin':(AppState.CU||'Anonimo');
  await stPush('comments/'+key,{name:name,text:text,ts:Date.now()});
  localStorage.setItem('pap26_lastComment',String(Date.now()));
  input.value='';
};

window.deleteComment=async function(key,commentId){
  if(!confirm('¿Borrar este comentario?'))return;
  await stRemoveChild('comments/'+key,commentId);
};
