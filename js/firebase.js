// Acceso a Firebase Realtime Database + Firebase Auth.
// Todo dato de la app vive bajo la clave plana PFX+<key> (ver js/data.js: PFX='pap26_').
import {PFX} from './data.js';

const FB={
  apiKey:'AIzaSyCsy3hxB8TX_PGSC_J74hcmL2BK-nJTM2g',
  authDomain:'quiniela-papanando.firebaseapp.com',
  databaseURL:'https://quiniela-papanando-default-rtdb.firebaseio.com',
  projectId:'quiniela-papanando',
  storageBucket:'quiniela-papanando.firebasestorage.app',
  messagingSenderId:'426699237409',
  appId:'1:426699237409:web:e2549b7745ad0399199b60'
};

let _db=null,_auth=null,_fns=null,_initPromise=null,_anonPromise=null;

function ensureInit(){
  if(_db)return Promise.resolve(_db);
  if(!_initPromise){
    _initPromise=(async function(){
      try{
        var fa=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        var fd=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
        var fau=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        var app;
        try{app=fa.getApp('pap');}catch(e){app=fa.initializeApp(FB,'pap');}
        _db=fd.getDatabase(app);
        _auth=fau.getAuth(app);
        _fns={
          ref:fd.ref,get:fd.get,set:fd.set,update:fd.update,remove:fd.remove,push:fd.push,onValue:fd.onValue,
          signInAnonymously:fau.signInAnonymously,signInWithEmailAndPassword:fau.signInWithEmailAndPassword,
          onAuthStateChanged:fau.onAuthStateChanged,signOut:fau.signOut
        };
      }catch(e){console.error('FB init:',e.message);}
      return _db;
    })();
  }
  return _initPromise;
}

function ensureAnonAuth(){
  if(!_auth)return Promise.resolve();
  if(_auth.currentUser)return Promise.resolve();
  if(!_anonPromise)_anonPromise=_fns.signInAnonymously(_auth).catch(function(e){console.error('anon auth:',e.message);});
  return _anonPromise;
}

export async function getDB(){
  await ensureInit();
  if(_db)await ensureAnonAuth();
  return _db;
}

export function getCurrentUid(){return _auth&&_auth.currentUser?_auth.currentUser.uid:null;}

export async function adminSignIn(email,pass){
  await ensureInit();
  if(!_db)throw new Error('Sin conexion a Firebase.');
  var cred=await _fns.signInWithEmailAndPassword(_auth,email,pass);
  return cred.user.uid;
}
export async function adminSignOut(){if(_auth)await _fns.signOut(_auth);}

export async function isAdminUid(uid){
  if(!uid)return false;
  var db=await getDB();if(!db)return false;
  try{var snap=await _fns.get(_fns.ref(db,PFX+'admins/'+uid));return snap.exists()&&snap.val()===true;}
  catch(e){return false;}
}

export async function stG(k){
  try{var db=await getDB();if(db){var s=await _fns.get(_fns.ref(db,PFX+k));if(s.exists()){var v=s.val();try{localStorage.setItem(PFX+k,JSON.stringify(v));}catch(e){}return v;}}}catch(e){}
  try{var v2=localStorage.getItem(PFX+k);return v2?JSON.parse(v2):null;}catch(e){return null;}
}
export async function stS(k,v){
  try{var db=await getDB();if(db)await _fns.set(_fns.ref(db,PFX+k),v);}catch(e){}
  try{localStorage.setItem(PFX+k,JSON.stringify(v));}catch(e){}
}
// Actualiza solo los campos indicados en `patch` sin sobreescribir el resto del documento
// (evita pisar cambios concurrentes de otro escritor - ver grantExt/revokeExt/unlockU/doSave).
export async function stU(k,patch){
  try{var db=await getDB();if(db)await _fns.update(_fns.ref(db,PFX+k),patch);}catch(e){}
  try{
    var cur=localStorage.getItem(PFX+k);var obj=cur?JSON.parse(cur):{};
    Object.assign(obj,patch);localStorage.setItem(PFX+k,JSON.stringify(obj));
  }catch(e){}
}
export async function stD(k){
  try{var db=await getDB();if(db)await _fns.remove(_fns.ref(db,PFX+k));}catch(e){}
  try{localStorage.removeItem(PFX+k);}catch(e){}
}
export async function stPush(k,v){
  var db=await getDB();if(!db)throw new Error('Sin conexion a Firebase.');
  var newRef=_fns.push(_fns.ref(db,PFX+k));
  await _fns.set(newRef,v);
  return newRef.key;
}
export async function stRemoveChild(k,childKey){
  var db=await getDB();if(!db)return;
  await _fns.remove(_fns.ref(db,PFX+k+'/'+childKey));
}
// Suscripcion en tiempo real. Devuelve una funcion para des-suscribirse.
export async function stWatch(k,cb){
  var db=await getDB();if(!db)return function(){};
  return _fns.onValue(_fns.ref(db,PFX+k),function(snap){cb(snap.exists()?snap.val():null);});
}

export async function getIdx(){return(await stG('idx'))||[];}
export async function addIdx(n){var i=await getIdx();if(!i.includes(n)){i.push(n);await stS('idx',i);}}
export async function delIdx(n){var i=(await getIdx()).filter(function(x){return x!==n;});await stS('idx',i);}
export async function getAllUsers(){var idx=await getIdx();var a=await Promise.all(idx.map(function(n){return stG('u_'+n);}));return a.filter(Boolean);}

// Acceso de bajo nivel para el panel de diagnostico/reconstruccion de indice (admin.js).
export async function rawGetAll(){
  var db=await getDB();if(!db)return null;
  var snap=await _fns.get(_fns.ref(db,PFX));
  return snap.exists()?snap.val():null;
}
