// Estado mutable compartido entre modulos (los bindings de ES modules son de solo lectura
// para quien los importa, asi que el estado se agrupa en un solo objeto mutable).
export const AppState={
  CU:null,adm:false,uLk:false,uCd:'',uExt:false,
  grSc:{},koSc:{},ST:{},BKT:{},
  rThirdOv:null,rGr:{},rKo:{},rSt:{},
  rrTab:'grupos',posTab:'grupos',
  saveTimer:null,lastCd:'',lastNm:''
};
