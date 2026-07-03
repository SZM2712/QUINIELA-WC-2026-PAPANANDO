// Recordatorios de cierre de plazo via la Notification API del navegador.
// Limitacion conocida: solo funcionan mientras la pestana/app este abierta - no hay push
// real cuando el navegador esta cerrado, porque este sitio no tiene backend propio.
import {DEADLINE,GS,MU} from '../data.js';
import {AppState} from '../state.js';

var CHECK_INTERVAL_MS=5*60*1000;
var THRESH_24H=24*60*60*1000,THRESH_1H=60*60*1000;
var intervalId=null;

function missingCount(){
  var missing=0;
  GS.forEach(function(g){MU.forEach(function(p,mi){var sc=AppState.grSc[g]&&AppState.grSc[g][mi];if(!sc||sc.h===null||sc.a===null)missing++;});});
  ['r32','r16','qf','sf','third','final'].forEach(function(r){(AppState.koSc[r]||[]).forEach(function(k){if(!k.w)missing++;});});
  return missing;
}

function notify(title,body){
  if(typeof Notification==='undefined'||Notification.permission!=='granted')return;
  try{new Notification(title,{body:body,icon:'logo_mundial.jpg'});}catch(e){}
}

function clearReminderInterval(){if(intervalId){clearInterval(intervalId);intervalId=null;}}

function checkDeadline(){
  if(!AppState.CU||AppState.CU==='__adm__')return;
  var diff=DEADLINE.getTime()-Date.now();
  if(diff<=0){clearReminderInterval();return;}
  var m=missingCount();
  if(diff<=THRESH_24H&&!localStorage.getItem('pap26_notif_24h')){
    localStorage.setItem('pap26_notif_24h','1');
    notify('Quedan 24 horas','Cierra el plazo de tu quiniela pronto.'+(m>0?' Te faltan '+m+' predicciones.':' Ya la tienes completa.'));
  }
  if(diff<=THRESH_1H&&!localStorage.getItem('pap26_notif_1h')){
    localStorage.setItem('pap26_notif_1h','1');
    notify('Ultima hora','El plazo cierra en menos de 1 hora.'+(m>0?' Te faltan '+m+' predicciones.':''));
  }
}

function startChecks(){
  checkDeadline();
  if(!intervalId)intervalId=setInterval(checkDeadline,CHECK_INTERVAL_MS);
}

export function initReminders(){
  if(typeof Notification==='undefined')return;
  var banner=document.getElementById('reminder-banner');
  if(Notification.permission==='granted'){startChecks();return;}
  if(Notification.permission==='denied')return; // el usuario ya lo rechazo antes; no insistir
  if(DEADLINE.getTime()-Date.now()<=0)return; // plazo ya vencido, no tiene caso pedir permiso
  if(banner)banner.style.display='flex';
}

window.enableReminders=function(){
  if(typeof Notification==='undefined')return;
  Notification.requestPermission().then(function(perm){
    var banner=document.getElementById('reminder-banner');
    if(banner)banner.style.display='none';
    if(perm==='granted')startChecks();
  });
};
window.dismissReminderBanner=function(){
  var banner=document.getElementById('reminder-banner');if(banner)banner.style.display='none';
};
