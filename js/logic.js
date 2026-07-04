// Logica de grupos, terceros lugares y bracket de eliminatorias.
import {GS,MU,TEAMS,R32,R16P,QFP,QFP_REAL,SFP} from './data.js';
import {R32_SCENARIOS} from './scenarios.js';
import {AppState} from './state.js';
import {stG} from './firebase.js';

export function assignThirds(qg){
  var res={};
  if(!qg||qg.length<8)return res;
  var key=qg.slice(0,8).sort().join('');
  var found=R32_SCENARIOS.find(function(s){return s[0]===key;});
  if(!found)return res;
  var colOrder=['A','B','D','E','G','I','K','L'];
  colOrder.forEach(function(wg,i){res[wg]=found[1][i];});
  return res;
}

export function initS(){
  var grSc=AppState.grSc,ST=AppState.ST,koSc=AppState.koSc,BKT=AppState.BKT;
  GS.forEach(function(g){grSc[g]=MU.map(function(){return{h:null,a:null};});ST[g]=[0,1,2,3];});
  ['r32','r16','qf','sf','final','third'].forEach(function(r){
    var n={r32:16,r16:8,qf:4,sf:2,final:1,third:1}[r];
    koSc[r]=Array(n).fill(null).map(function(){return{w:null};});
    BKT[r]=Array(n).fill(null).map(function(){return{h:null,a:null};});
  });
}
export function initRS(){
  var rGr=AppState.rGr,rSt=AppState.rSt,rKo=AppState.rKo;
  GS.forEach(function(g){rGr[g]=MU.map(function(){return{h:null,a:null};});rSt[g]=[0,1,2,3];});
  ['r32','r16','qf','sf','final','third'].forEach(function(r){
    var n={r32:16,r16:8,qf:4,sf:2,final:1,third:1}[r];
    rKo[r]=Array(n).fill(null).map(function(){return{w:null};});
  });
}

export function cSt(g,gr){
  var pts=[0,0,0,0],gd=[0,0,0,0],gf=[0,0,0,0],w=[0,0,0,0];
  MU.forEach(function(pair,mi){
    var i=pair[0],j=pair[1],s=gr[g]?gr[g][mi]:null;
    if(!s||s.h===null||s.a===null)return;
    gf[i]+=s.h;gf[j]+=s.a;gd[i]+=s.h-s.a;gd[j]+=s.a-s.h;
    if(s.h>s.a){pts[i]+=3;w[i]++;}else if(s.a>s.h){pts[j]+=3;w[j]++;}else{pts[i]++;pts[j]++;}
  });
  var order=[0,1,2,3].sort(function(a,b){return pts[b]-pts[a]||gd[b]-gd[a]||gf[b]-gf[a]||a-b;});
  return{pts:pts,gd:gd,gf:gf,w:w,order:order};
}
export function calcQualStatus(g,gr){
  // status: 'q' = top-2 del grupo asegurado, 'e' = ULTIMO lugar asegurado (no avanza por ninguna via),
  //   null = por definir (incluye 3ro, que puede clasificar como mejor tercero).
  // firstPlace: true solo cuando el 1er lugar esta matematicamente asegurado (uno solo; usa DG/GF si hay empate en pts).
  var s=cSt(g,gr);
  var pts=s.pts,gd=s.gd,gf=s.gf;
  var remaining=[0,0,0,0];
  MU.forEach(function(p,mi){
    var rs=gr[g]?gr[g][mi]:null;
    if(rs&&rs.h!==null&&rs.a!==null)return;
    remaining[p[0]]++;remaining[p[1]]++;
  });
  var groupDone=(remaining[0]+remaining[1]+remaining[2]+remaining[3])===0;
  var status=[null,null,null,null];
  var firstPlace=[false,false,false,false];
  var ord=[0,1,2,3].sort(function(a,b){return pts[b]-pts[a]||gd[b]-gd[a]||gf[b]-gf[a]||a-b;});
  if(groupDone){
    status[ord[0]]='q';status[ord[1]]='q';
    status[ord[3]]='e';
    firstPlace[ord[0]]=true;
    return {status:status,firstPlace:firstPlace};
  }
  var maxPts=pts.map(function(p,i){return p+remaining[i]*3;});
  var minPts=pts.slice();
  for(var i=0;i<4;i++){
    var surelyAbove=0,couldTieOrBeat=0,surelyBelow=0;
    for(var x=0;x<4;x++){if(x===i)continue;
      if(minPts[x]>maxPts[i])surelyAbove++;
      if(maxPts[x]>=minPts[i])couldTieOrBeat++;
      if(maxPts[x]<minPts[i])surelyBelow++;
    }
    if(surelyAbove>=3)status[i]='e';
    if(couldTieOrBeat<=1)status[i]='q';
    if(surelyBelow===3)firstPlace[i]=true;
  }
  return {status:status,firstPlace:firstPlace};
}
export function recSt(g){var s=cSt(g,AppState.grSc);AppState.ST[g]=s.order;}
export function recRS(g){var s=cSt(g,AppState.rGr);AppState.rSt[g]=s.order;}

export function rawThirds(gr){
  return GS.map(function(g){
    var s=cSt(g,gr),idx=s.order[2];
    var pj=0;MU.forEach(function(p,mi){var sc=gr[g]?gr[g][mi]:null;if(sc&&sc.h!==null&&sc.a!==null&&(idx===p[0]||idx===p[1]))pj++;});
    return{g:g,t:TEAMS[g][idx],pts:s.pts[idx]||0,gd:s.gd[idx]||0,gf:s.gf[idx]||0,w:s.w[idx]||0,pj:pj};
  }).filter(function(t){return t.pj>0;}).sort(function(a,b){return b.pts-a.pts||b.gd-a.gd||b.gf-a.gf;});
}
export function applyThirdOverride(arr,ov){
  if(!ov||arr.length<9)return arr;
  var a=arr[7],b=arr[8];
  if(a.pts!==b.pts||a.gd!==b.gd||a.gf!==b.gf)return arr;
  if(b.g!==ov)return arr;
  var copy=arr.slice();copy[7]=b;copy[8]=a;return copy;
}
export function gBT(gr,sts){
  var arr=rawThirds(gr);
  if(gr===AppState.rGr&&AppState.rThirdOv)arr=applyThirdOverride(arr,AppState.rThirdOv);
  return arr;
}
export function confirmedThirds(gr){
  var info={};
  GS.forEach(function(g){
    var s=cSt(g,gr),rem=[0,0,0,0];
    MU.forEach(function(p,mi){var rs=gr[g]?gr[g][mi]:null;if(rs&&rs.h!==null&&rs.a!==null)return;rem[p[0]]++;rem[p[1]]++;});
    var maxP=[0,1,2,3].map(function(i){return s.pts[i]+3*rem[i];});
    info[g]={s:s,maxP:maxP,done:(rem[0]+rem[1]+rem[2]+rem[3])===0};
  });
  function thirdCeil(g){var m=info[g].maxP.slice().sort(function(a,b){return b-a;});return m[2];}
  var conf=new Set();
  GS.forEach(function(g){
    var gi=info[g],ord=gi.s.order,ti=ord[2];
    var Tf=gi.s.pts[ti],Td=gi.s.gd[ti],Tg=gi.s.gf[ti];
    var lockedTop3=gi.done?true:([ord[0],ord[1],ord[3]].filter(function(idx){return gi.maxP[idx]>=Tf;}).length<=2);
    if(!lockedTop3)return;
    var notBelow=0;
    GS.forEach(function(h){
      if(h===g)return;var hi=info[h];
      if(gi.done&&hi.done){
        var hj=hi.s.order[2],hp=hi.s.pts[hj],hd=hi.s.gd[hj],hg=hi.s.gf[hj];
        var below=(hp<Tf)||(hp===Tf&&(hd<Td||(hd===Td&&hg<Tg)));
        if(!below)notBelow++;
      }else{
        var hc=hi.done?hi.s.pts[hi.s.order[2]]:thirdCeil(h);
        if(hc>=Tf)notBelow++;
      }
    });
    if(notBelow<=7)conf.add(TEAMS[g][ti].n);
  });
  return conf;
}

export function buildBkt(gr,sts,ko,qfp){
  qfp=qfp||QFP; // por defecto, el orden de las PREDICCIONES; el bracket real (getRlP/getRlE/renderRS/renderPosPublic) pasa QFP_REAL
  var qt=gBT(gr,sts).slice(0,8);
  var qg=qt.map(function(t){return t.g;});
  var asgn=assignThirds(qg);
  var h2i={E:1,I:4,A:6,L:7,D:8,G:9,B:12,K:14};
  var tm={};
  Object.keys(asgn).forEach(function(host){
    var tg=asgn[host],idx=h2i[host],ti=sts[tg]?sts[tg][2]:undefined;
    tm[idx]=ti!==undefined?TEAMS[tg][ti]:null;
  });
  function rt(sel,i){
    if(!sel)return null;
    if(sel.tf)return tm[i]||null;
    var idx=sts[sel.g]?sts[sel.g][sel.r]:undefined;
    return idx!==undefined?TEAMS[sel.g][idx]:null;
  }
  function gw(bk,ks,i){var k=ks?ks[i]:null,b=bk?bk[i]:null;if(!k||!k.w)return null;return k.w==='h'?b.h:b.a;}
  function gl(bk,ks,i){var k=ks?ks[i]:null,b=bk?bk[i]:null;if(!k||!k.w)return null;return k.w==='h'?b.a:b.h;}
  var r32b=R32.map(function(d,i){return{h:rt(d.h,i),a:rt(d.a,i)};});
  var r16b=R16P.map(function(p){return{h:gw(r32b,ko.r32,p[0]),a:gw(r32b,ko.r32,p[1])};});
  var qfb=qfp.map(function(p){return{h:gw(r16b,ko.r16,p[0]),a:gw(r16b,ko.r16,p[1])};});
  var sfb=SFP.map(function(p){return{h:gw(qfb,ko.qf,p[0]),a:gw(qfb,ko.qf,p[1])};});
  var fb={h:gw(sfb,ko.sf,0),a:gw(sfb,ko.sf,1)};
  var tb={h:gl(sfb,ko.sf,0),a:gl(sfb,ko.sf,1)};
  var fk=ko.final?ko.final[0]:null;
  var ch=fk&&fk.w?(fk.w==='h'?fb.h:fb.a):null;
  var fi=fk&&fk.w?(fk.w==='h'?fb.a:fb.h):null;
  var tk=ko.third?ko.third[0]:null;
  var th=tk&&tk.w?(tk.w==='h'?tb.h:tb.a):null;
  var fo=tk&&tk.w?(tk.w==='h'?tb.a:tb.h):null;
  return{r32:r32b,r16:r16b,qf:qfb,sf:sfb,final:[fb],third:[tb],podio:[ch,fi,th,fo]};
}
export function rebuildBkt(){
  var res=buildBkt(AppState.grSc,AppState.ST,AppState.koSc);
  ['r32','r16','qf','sf','final','third'].forEach(function(r){AppState.BKT[r]=res[r];});
  return res;
}
export function deriveUP(u){
  if(!u.grSc&&!u.koSc)return[null,null,null,null];
  var ust={};GS.forEach(function(g){ust[g]=cSt(g,u.grSc||{}).order;});
  return buildBkt(u.grSc||{},ust,u.koSc||{}).podio;
}
export function getRlP(){
  var rst={};GS.forEach(function(g){rst[g]=cSt(g,AppState.rGr).order;});
  return buildBkt(AppState.rGr,rst,AppState.rKo,QFP_REAL).podio; // bracket REAL: siempre con QFP_REAL
}
// ── Factibilidad del podio segun el lado del bracket ──
export function r32QuarterOf(r){
  var j=-1,k=-1,x;
  for(x=0;x<R16P.length;x++){if(R16P[x].indexOf(r)>=0){j=x;break;}}
  for(x=0;x<QFP.length;x++){if(QFP[x].indexOf(j)>=0){k=x;break;}}
  return k;
}
export function quarterHalfOf(k){for(var x=0;x<SFP.length;x++){if(SFP[x].indexOf(k)>=0)return x;}return -1;}
export function realQuartersMap(rb){
  var out={};
  rb.r32.forEach(function(m,i){var q=r32QuarterOf(i),hf=quarterHalfOf(q);
    if(m.h)out[m.h.n]={q:q,half:hf};
    if(m.a)out[m.a.n]={q:q,half:hf};});
  return out;
}
export function podioFeasibility(podio,qmap,el){
  var info=podio.map(function(t){return (t&&qmap[t.n]&&!(el&&el.has(t.n)))?qmap[t.n]:null;});
  var best=0,mask,p;
  for(mask=1;mask<16;mask++){
    var S=[];for(p=0;p<4;p++)if(mask&(1<<p))S.push(p);
    if(S.some(function(p){return !info[p];}))continue;
    var seen={},dup=false;S.forEach(function(p){if(seen[info[p].q])dup=true;seen[info[p].q]=1;});
    if(dup)continue;
    var fin=S.filter(function(p){return p<2;});
    if(fin.length===2&&info[fin[0]].half===info[fin[1]].half)continue;
    var thr=S.filter(function(p){return p>=2;});
    if(thr.length===2&&info[thr[0]].half===info[thr[1]].half)continue;
    if(S.length>best)best=S.length;
  }
  var nm=['campeón','subcampeón','3º','4º'],reasons=[],a,b;
  for(p=0;p<4;p++){if(podio[p]&&!info[p])reasons.push(podio[p].n+' ('+nm[p]+') no está en el bracket proyectado o ya quedó fuera');}
  if(info[0]&&info[1]&&info[0].half===info[1].half)reasons.push('campeón y subcampeón caen del mismo lado (se cruzarían antes de la final)');
  if(info[2]&&info[3]&&info[2].half===info[3].half)reasons.push('3º y 4º caen del mismo lado');
  for(a=0;a<4;a++)for(b=a+1;b<4;b++){if(info[a]&&info[b]&&info[a].q===info[b].q)reasons.push(podio[a].n+' y '+podio[b].n+' caerían en el mismo cuarto del bracket');}
  return {pct:Math.round(best/4*100),best:best,info:info,reasons:reasons};
}
export function placedInR32(rb){var c=0;rb.r32.forEach(function(m){if(m.h)c++;if(m.a)c++;});return c;}
export function getRlE(){
  var rGr=AppState.rGr,rKo=AppState.rKo;
  var rst={};GS.forEach(function(g){rst[g]=cSt(g,rGr).order;});
  var el=new Set();
  var info={};
  GS.forEach(function(g){
    var s=cSt(g,rGr),rem=[0,0,0,0];
    MU.forEach(function(p,mi){var sc=rGr[g]?rGr[g][mi]:null;if(sc&&sc.h!=null&&sc.a!=null)return;rem[p[0]]++;rem[p[1]]++;});
    info[g]={pts:s.pts,gd:s.gd,gf:s.gf,rem:rem,maxP:s.pts.map(function(p,i){return p+rem[i]*3;}),order:s.order};
  });
  var thirdFloor={};GS.forEach(function(g){thirdFloor[g]=info[g].pts[info[g].order[2]]||0;});
  GS.forEach(function(g){
    var done=info[g].rem.every(function(r){return r===0;});
    for(var idx=0;idx<4;idx++){
      var maxT,blockers;
      if(done){
        var pos=info[g].order.indexOf(idx);
        if(pos<=1)continue;
        if(pos===3){el.add(TEAMS[g][idx].n);continue;}
        maxT=info[g].pts[idx];
        blockers=0;GS.forEach(function(g2){if(g2!==g&&thirdFloor[g2]>maxT)blockers++;});
        if(blockers>=8)el.add(TEAMS[g][idx].n);
        continue;
      }
      maxT=info[g].maxP[idx];
      var guaranteedAbove=0;for(var x=0;x<4;x++){if(x!==idx&&info[g].pts[x]>maxT)guaranteedAbove++;}
      if(guaranteedAbove<=1)continue;
      if(guaranteedAbove>=3){el.add(TEAMS[g][idx].n);continue;}
      blockers=0;GS.forEach(function(g2){if(g2!==g&&thirdFloor[g2]>maxT)blockers++;});
      if(blockers>=8)el.add(TEAMS[g][idx].n);
    }
  });
  var res=buildBkt(rGr,rst,rKo,QFP_REAL);
  ['r32','r16','qf','sf'].forEach(function(r){
    var bk=res[r],ks=rKo[r]||[];
    bk.forEach(function(m,i){var k=ks[i];if(!k||!k.w||!m.h||!m.a)return;el.add((k.w==='h'?m.a:m.h).n);});
  });
  return el;
}

// Carga los resultados reales (ingresados por el admin) en el estado compartido AppState.rGr/rKo.
export async function loadRD(){
  initRS();
  var rGr=AppState.rGr,rKo=AppState.rKo;
  AppState.rThirdOv=(await stG('third_override'))||null;
  var d=await stG('real_results');if(!d)return;
  if(d.grSc)GS.forEach(function(g){
    if(d.grSc[g]){
      if(Array.isArray(d.grSc[g])){
        d.grSc[g].forEach(function(r,i){if(r)rGr[g][i]={h:r.h!=null?r.h:null,a:r.a!=null?r.a:null};});
      }else{
        Object.keys(d.grSc[g]).forEach(function(k){
          var i=parseInt(k,10),r=d.grSc[g][k];
          if(!isNaN(i)&&r)rGr[g][i]={h:r.h!=null?r.h:null,a:r.a!=null?r.a:null};
        });
      }
    }
  });
  if(d.koSc)['r32','r16','qf','sf','final','third'].forEach(function(r){
    if(d.koSc[r]){
      if(Array.isArray(d.koSc[r])){
        d.koSc[r].forEach(function(k,i){if(rKo[r][i]&&k)rKo[r][i]={w:k.w||null};});
      }else{
        Object.keys(d.koSc[r]).forEach(function(key){
          var i=parseInt(key,10),k=d.koSc[r][key];
          if(!isNaN(i)&&rKo[r][i]&&k)rKo[r][i]={w:k.w||null};
        });
      }
    }
  });
  GS.forEach(function(g){recRS(g);});
}

// % de aciertos de resultado (gano/perdio/empato) de cada usuario contra los partidos de grupo ya jugados.
export function computeAciertos(users,rGr){
  var anyPlayed=false;
  var stats=users.map(function(u){
    var hits=0,total=0;
    GS.forEach(function(g){
      MU.forEach(function(p,mi){
        var real=rGr[g]?rGr[g][mi]:null;
        if(!real||real.h===null||real.a===null)return;
        anyPlayed=true;
        var pred=u.grSc&&u.grSc[g]?u.grSc[g][mi]:null;
        if(!pred||pred.h===null||pred.a===null){total++;return;}
        var predW=pred.h>pred.a?'h':pred.a>pred.h?'a':'d';
        var realW=real.h>real.a?'h':real.a>real.h?'a':'d';
        total++;
        if(predW===realW)hits++;
      });
    });
    var pct=total>0?Math.round(hits/total*100):0;
    return{name:u.name,hits:hits,total:total,pct:pct};
  });
  return {anyPlayed:anyPlayed,stats:stats};
}

export function fmtCd(diff){
  if(diff<=0)return'PLAZO VENCIDO';
  var d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  var p=[];if(d>0)p.push(d+'d');p.push(('0'+h).slice(-2)+'h');p.push(('0'+m).slice(-2)+'m');p.push(('0'+s).slice(-2)+'s');
  return p.join(' ');
}
