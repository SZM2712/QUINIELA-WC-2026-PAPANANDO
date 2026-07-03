// Datos estaticos del torneo: configuracion, calendario, equipos y estructura del bracket.
export const FEE=250, CUR='Q.', PFX='pap26_';
export const DEADLINE=new Date('2026-06-11T18:00:00Z');
export const MSTART=new Date('2026-06-11T19:00:00Z');
export const PPTS=[11,9,8,5];

export const SCHEDULE=[
  // 2026-06-11
  {d:'2026-06-11',et:'13:00',h:'Mexico',hf:'mx',a:'Sudafrica',af:'za',v:'Azteca, Cd. Mexico',g:'A'},
  {d:'2026-06-11',et:'20:00',h:'Corea del Sur',hf:'kr',a:'Rep. Checa',af:'cz',v:'Akron, Guadalajara',g:'A'},
  // 2026-06-12
  {d:'2026-06-12',et:'13:00',h:'Canada',hf:'ca',a:'Bosnia y Herz.',af:'ba',v:'BMO, Toronto',g:'B'},
  {d:'2026-06-12',et:'19:00',h:'EE.UU.',hf:'us',a:'Paraguay',af:'py',v:'SoFi, Los Angeles',g:'D'},
  // 2026-06-13
  {d:'2026-06-13',et:'13:00',h:'Qatar',hf:'qa',a:'Suiza',af:'ch',v:'Levis, San Francisco',g:'B'},
  {d:'2026-06-13',et:'16:00',h:'Brasil',hf:'br',a:'Marruecos',af:'ma',v:'MetLife, Nueva York',g:'C'},
  {d:'2026-06-13',et:'19:00',h:'Haiti',hf:'ht',a:'Escocia',af:'gb-sct',v:'Gillette, Boston',g:'C'},
  {d:'2026-06-13',et:'22:00',h:'Australia',hf:'au',a:'Turquia',af:'tr',v:'BC Place, Vancouver',g:'D'},
  // 2026-06-14
  {d:'2026-06-14',et:'11:00',h:'Alemania',hf:'de',a:'Curazao',af:'cw',v:'NRG, Houston',g:'E'},
  {d:'2026-06-14',et:'14:00',h:'Paises Bajos',hf:'nl',a:'Japon',af:'jp',v:'AT&T, Arlington',g:'F'},
  {d:'2026-06-14',et:'17:00',h:'Costa de Marfil',hf:'ci',a:'Ecuador',af:'ec',v:'Lincoln, Philadelphia',g:'E'},
  {d:'2026-06-14',et:'20:00',h:'Suecia',hf:'se',a:'Tunez',af:'tn',v:'Akron, Guadalajara',g:'F'},
  // 2026-06-15
  {d:'2026-06-15',et:'10:00',h:'Espana',hf:'es',a:'Cabo Verde',af:'cv',v:'MBenz, Atlanta',g:'H'},
  {d:'2026-06-15',et:'13:00',h:'Belgica',hf:'be',a:'Egipto',af:'eg',v:'Lumen, Seattle',g:'G'},
  {d:'2026-06-15',et:'16:00',h:'Arabia Saudita',hf:'sa',a:'Uruguay',af:'uy',v:'Hard Rock, Miami',g:'H'},
  {d:'2026-06-15',et:'19:00',h:'Iran',hf:'ir',a:'Nueva Zelanda',af:'nz',v:'SoFi, Los Angeles',g:'G'},
  // 2026-06-16
  {d:'2026-06-16',et:'13:00',h:'Francia',hf:'fr',a:'Senegal',af:'sn',v:'MetLife, Nueva York',g:'I'},
  {d:'2026-06-16',et:'16:00',h:'Irak',hf:'iq',a:'Noruega',af:'no',v:'Gillette, Boston',g:'I'},
  {d:'2026-06-16',et:'19:00',h:'Argentina',hf:'ar',a:'Argelia',af:'dz',v:'Arrowhead, Kansas City',g:'J'},
  {d:'2026-06-16',et:'22:00',h:'Austria',hf:'at',a:'Jordania',af:'jo',v:'Levis, San Francisco',g:'J'},
  // 2026-06-17
  {d:'2026-06-17',et:'11:00',h:'Portugal',hf:'pt',a:'RD del Congo',af:'cd',v:'NRG, Houston',g:'K'},
  {d:'2026-06-17',et:'14:00',h:'Inglaterra',hf:'gb-eng',a:'Croacia',af:'hr',v:'AT&T, Arlington',g:'L'},
  {d:'2026-06-17',et:'17:00',h:'Ghana',hf:'gh',a:'Panama',af:'pa',v:'BMO, Toronto',g:'L'},
  {d:'2026-06-17',et:'20:00',h:'Uzbekistan',hf:'uz',a:'Colombia',af:'co',v:'Azteca, Cd. Mexico',g:'K'},
  // 2026-06-18
  {d:'2026-06-18',et:'10:00',h:'Rep. Checa',hf:'cz',a:'Sudafrica',af:'za',v:'MBenz, Atlanta',g:'A'},
  {d:'2026-06-18',et:'13:00',h:'Suiza',hf:'ch',a:'Bosnia y Herz.',af:'ba',v:'SoFi, Los Angeles',g:'B'},
  {d:'2026-06-18',et:'16:00',h:'Canada',hf:'ca',a:'Qatar',af:'qa',v:'BC Place, Vancouver',g:'B'},
  {d:'2026-06-18',et:'19:00',h:'Mexico',hf:'mx',a:'Corea del Sur',af:'kr',v:'Akron, Guadalajara',g:'A'},
  // 2026-06-19
  {d:'2026-06-19',et:'13:00',h:'EE.UU.',hf:'us',a:'Australia',af:'au',v:'Lumen, Seattle',g:'D'},
  {d:'2026-06-19',et:'16:00',h:'Escocia',hf:'gb-sct',a:'Marruecos',af:'ma',v:'Gillette, Boston',g:'C'},
  {d:'2026-06-19',et:'18:30',h:'Brasil',hf:'br',a:'Haiti',af:'ht',v:'Lincoln, Philadelphia',g:'C'},
  {d:'2026-06-19',et:'21:00',h:'Turquia',hf:'tr',a:'Paraguay',af:'py',v:'Levis, San Francisco',g:'D'},
  // 2026-06-20
  {d:'2026-06-20',et:'11:00',h:'Paises Bajos',hf:'nl',a:'Suecia',af:'se',v:'NRG, Houston',g:'F'},
  {d:'2026-06-20',et:'14:00',h:'Alemania',hf:'de',a:'Costa de Marfil',af:'ci',v:'BMO, Toronto',g:'E'},
  {d:'2026-06-20',et:'18:00',h:'Ecuador',hf:'ec',a:'Curazao',af:'cw',v:'Arrowhead, Kansas City',g:'E'},
  {d:'2026-06-20',et:'22:00',h:'Tunez',hf:'tn',a:'Japon',af:'jp',v:'Akron, Guadalajara',g:'F'},
  // 2026-06-21
  {d:'2026-06-21',et:'10:00',h:'Espana',hf:'es',a:'Arabia Saudita',af:'sa',v:'MBenz, Atlanta',g:'H'},
  {d:'2026-06-21',et:'13:00',h:'Belgica',hf:'be',a:'Iran',af:'ir',v:'SoFi, Los Angeles',g:'G'},
  {d:'2026-06-21',et:'16:00',h:'Uruguay',hf:'uy',a:'Cabo Verde',af:'cv',v:'Hard Rock, Miami',g:'H'},
  {d:'2026-06-21',et:'19:00',h:'Nueva Zelanda',hf:'nz',a:'Egipto',af:'eg',v:'BC Place, Vancouver',g:'G'},
  // 2026-06-22
  {d:'2026-06-22',et:'11:00',h:'Argentina',hf:'ar',a:'Austria',af:'at',v:'AT&T, Arlington',g:'J'},
  {d:'2026-06-22',et:'15:00',h:'Francia',hf:'fr',a:'Irak',af:'iq',v:'Lincoln, Philadelphia',g:'I'},
  {d:'2026-06-22',et:'18:00',h:'Noruega',hf:'no',a:'Senegal',af:'sn',v:'MetLife, Nueva York',g:'I'},
  {d:'2026-06-22',et:'21:00',h:'Jordania',hf:'jo',a:'Argelia',af:'dz',v:'Levis, San Francisco',g:'J'},
  // 2026-06-23
  {d:'2026-06-23',et:'11:00',h:'Portugal',hf:'pt',a:'Uzbekistan',af:'uz',v:'NRG, Houston',g:'K'},
  {d:'2026-06-23',et:'14:00',h:'Inglaterra',hf:'gb-eng',a:'Ghana',af:'gh',v:'Gillette, Boston',g:'L'},
  {d:'2026-06-23',et:'17:00',h:'Panama',hf:'pa',a:'Croacia',af:'hr',v:'BMO, Toronto',g:'L'},
  {d:'2026-06-23',et:'20:00',h:'Colombia',hf:'co',a:'RD del Congo',af:'cd',v:'Akron, Guadalajara',g:'K'},
  // 2026-06-24
  {d:'2026-06-24',et:'19:00',h:'Rep. Checa',hf:'cz',a:'Mexico',af:'mx',v:'Azteca, Cd. Mexico',g:'A'},
  {d:'2026-06-24',et:'19:00',h:'Sudafrica',hf:'za',a:'Corea del Sur',af:'kr',v:'BBVA, Monterrey',g:'A'},
  {d:'2026-06-24',et:'13:00',h:'Suiza',hf:'ch',a:'Canada',af:'ca',v:'BC Place, Vancouver',g:'B'},
  {d:'2026-06-24',et:'13:00',h:'Bosnia y Herz.',hf:'ba',a:'Qatar',af:'qa',v:'Lumen, Seattle',g:'B'},
  {d:'2026-06-24',et:'16:00',h:'Escocia',hf:'gb-sct',a:'Brasil',af:'br',v:'Hard Rock, Miami',g:'C'},
  {d:'2026-06-24',et:'16:00',h:'Marruecos',hf:'ma',a:'Haiti',af:'ht',v:'MBenz, Atlanta',g:'C'},
  // 2026-06-25
  {d:'2026-06-25',et:'20:00',h:'Turquia',hf:'tr',a:'EE.UU.',af:'us',v:'SoFi, Los Angeles',g:'D'},
  {d:'2026-06-25',et:'20:00',h:'Paraguay',hf:'py',a:'Australia',af:'au',v:'Levis, San Francisco',g:'D'},
  {d:'2026-06-25',et:'14:00',h:'Curazao',hf:'cw',a:'Costa de Marfil',af:'ci',v:'Lincoln, Philadelphia',g:'E'},
  {d:'2026-06-25',et:'14:00',h:'Ecuador',hf:'ec',a:'Alemania',af:'de',v:'MetLife, Nueva York',g:'E'},
  {d:'2026-06-25',et:'17:00',h:'Japon',hf:'jp',a:'Suecia',af:'se',v:'AT&T, Arlington',g:'F'},
  {d:'2026-06-25',et:'17:00',h:'Tunez',hf:'tn',a:'Paises Bajos',af:'nl',v:'Arrowhead, Kansas City',g:'F'},
  // 2026-06-26
  {d:'2026-06-26',et:'21:00',h:'Egipto',hf:'eg',a:'Iran',af:'ir',v:'Lumen, Seattle',g:'G'},
  {d:'2026-06-26',et:'21:00',h:'Nueva Zelanda',hf:'nz',a:'Belgica',af:'be',v:'BC Place, Vancouver',g:'G'},
  {d:'2026-06-26',et:'18:00',h:'Cabo Verde',hf:'cv',a:'Arabia Saudita',af:'sa',v:'NRG, Houston',g:'H'},
  {d:'2026-06-26',et:'18:00',h:'Uruguay',hf:'uy',a:'Espana',af:'es',v:'Akron, Guadalajara',g:'H'},
  {d:'2026-06-26',et:'13:00',h:'Noruega',hf:'no',a:'Francia',af:'fr',v:'Gillette, Boston',g:'I'},
  {d:'2026-06-26',et:'13:00',h:'Senegal',hf:'sn',a:'Irak',af:'iq',v:'BMO, Toronto',g:'I'},
  // 2026-06-27
  {d:'2026-06-27',et:'20:00',h:'Jordania',hf:'jo',a:'Argentina',af:'ar',v:'AT&T, Arlington',g:'J'},
  {d:'2026-06-27',et:'20:00',h:'Argelia',hf:'dz',a:'Austria',af:'at',v:'Arrowhead, Kansas City',g:'J'},
  {d:'2026-06-27',et:'17:30',h:'Colombia',hf:'co',a:'Portugal',af:'pt',v:'Hard Rock, Miami',g:'K'},
  {d:'2026-06-27',et:'17:30',h:'RD del Congo',hf:'cd',a:'Uzbekistan',af:'uz',v:'MBenz, Atlanta',g:'K'},
  {d:'2026-06-27',et:'15:00',h:'Panama',hf:'pa',a:'Inglaterra',af:'gb-eng',v:'MetLife, Nueva York',g:'L'},
  {d:'2026-06-27',et:'15:00',h:'Croacia',hf:'hr',a:'Ghana',af:'gh',v:'Lincoln, Philadelphia',g:'L'}
];

export const KO_SCHEDULE=[
  {d:'2026-06-28',et:'13:00',r:'r32',lbl:'M73',h:'Sudafrica',hf:'za',a:'Canada',af:'ca',v:'SoFi, Los Angeles'},
  {d:'2026-06-29',et:'11:00',r:'r32',lbl:'M76',h:'Brasil',hf:'br',a:'Japon',af:'jp',v:'NRG, Houston'},
  {d:'2026-06-29',et:'14:30',r:'r32',lbl:'M74',h:'Alemania',hf:'de',a:'Paraguay',af:'py',v:'Gillette, Boston'},
  {d:'2026-06-29',et:'19:00',r:'r32',lbl:'M75',h:'Paises Bajos',hf:'nl',a:'Marruecos',af:'ma',v:'BBVA, Monterrey'},
  {d:'2026-06-30',et:'11:00',r:'r32',lbl:'M78',h:'Costa de Marfil',hf:'ci',a:'Noruega',af:'no',v:'AT&T, Dallas'},
  {d:'2026-06-30',et:'15:00',r:'r32',lbl:'M77',h:'Francia',hf:'fr',a:'Suecia',af:'se',v:'MetLife, Nueva York'},
  {d:'2026-06-30',et:'19:00',r:'r32',lbl:'M79',h:'Mexico',hf:'mx',a:'Ecuador',af:'ec',v:'Azteca, Cd. Mexico'},
  {d:'2026-07-01',et:'10:00',r:'r32',lbl:'M80',h:'Inglaterra',hf:'gb-eng',a:'RD del Congo',af:'cd',v:'MBenz, Atlanta'},
  {d:'2026-07-01',et:'14:00',r:'r32',lbl:'M82',h:'Belgica',hf:'be',a:'Senegal',af:'sn',v:'Lumen, Seattle'},
  {d:'2026-07-01',et:'18:00',r:'r32',lbl:'M81',h:'EE.UU.',hf:'us',a:'Bosnia y Herz.',af:'ba',v:'Levis, San Francisco'},
  {d:'2026-07-02',et:'13:00',r:'r32',lbl:'M84',h:'Espana',hf:'es',a:'Austria',af:'at',v:'SoFi, Los Angeles'},
  {d:'2026-07-02',et:'17:00',r:'r32',lbl:'M83',h:'Portugal',hf:'pt',a:'Croacia',af:'hr',v:'BMO, Toronto'},
  {d:'2026-07-02',et:'21:00',r:'r32',lbl:'M85',h:'Suiza',hf:'ch',a:'Argelia',af:'dz',v:'BC Place, Vancouver'},
  {d:'2026-07-03',et:'12:00',r:'r32',lbl:'M88',h:'Australia',hf:'au',a:'Egipto',af:'eg',v:'AT&T, Dallas'},
  {d:'2026-07-03',et:'16:00',r:'r32',lbl:'M86',h:'Argentina',hf:'ar',a:'Cabo Verde',af:'cv',v:'Hard Rock, Miami'},
  {d:'2026-07-03',et:'19:30',r:'r32',lbl:'M87',h:'Colombia',hf:'co',a:'Ghana',af:'gh',v:'Arrowhead, Kansas City'}
];

export const TEAMS={
  A:[{n:'Mexico',f:'mx'},{n:'Sudafrica',f:'za'},{n:'Corea del Sur',f:'kr'},{n:'Rep. Checa',f:'cz'}],
  B:[{n:'Canada',f:'ca'},{n:'Bosnia y Herz.',f:'ba'},{n:'Qatar',f:'qa'},{n:'Suiza',f:'ch'}],
  C:[{n:'Brasil',f:'br'},{n:'Marruecos',f:'ma'},{n:'Haiti',f:'ht'},{n:'Escocia',f:'gb-sct'}],
  D:[{n:'EE.UU.',f:'us'},{n:'Paraguay',f:'py'},{n:'Australia',f:'au'},{n:'Turquia',f:'tr'}],
  E:[{n:'Alemania',f:'de'},{n:'Curazao',f:'cw'},{n:'Costa de Marfil',f:'ci'},{n:'Ecuador',f:'ec'}],
  F:[{n:'Paises Bajos',f:'nl'},{n:'Japon',f:'jp'},{n:'Suecia',f:'se'},{n:'Tunez',f:'tn'}],
  G:[{n:'Belgica',f:'be'},{n:'Egipto',f:'eg'},{n:'Iran',f:'ir'},{n:'Nueva Zelanda',f:'nz'}],
  H:[{n:'Espana',f:'es'},{n:'Cabo Verde',f:'cv'},{n:'Arabia Saudita',f:'sa'},{n:'Uruguay',f:'uy'}],
  I:[{n:'Francia',f:'fr'},{n:'Senegal',f:'sn'},{n:'Irak',f:'iq'},{n:'Noruega',f:'no'}],
  J:[{n:'Argentina',f:'ar'},{n:'Argelia',f:'dz'},{n:'Austria',f:'at'},{n:'Jordania',f:'jo'}],
  K:[{n:'Portugal',f:'pt'},{n:'RD del Congo',f:'cd'},{n:'Uzbekistan',f:'uz'},{n:'Colombia',f:'co'}],
  L:[{n:'Inglaterra',f:'gb-eng'},{n:'Croacia',f:'hr'},{n:'Panama',f:'pa'},{n:'Ghana',f:'gh'}]
};
export const GS=Object.keys(TEAMS);
export const MU=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
export const R32=[
  {l:'P73',v:'Toronto-BMO Field',h:{g:'A',r:1},a:{g:'B',r:1}},
  {l:'P74',v:'Boston-Gillette',h:{g:'E',r:0},a:{tf:['A','B','C','D','F']}},
  {l:'P75',v:'Monterrey-BBVA',h:{g:'F',r:0},a:{g:'C',r:1}},
  {l:'P76',v:'Houston-NRG',h:{g:'C',r:0},a:{g:'F',r:1}},
  {l:'P77',v:'Nueva York-MetLife',h:{g:'I',r:0},a:{tf:['C','D','F','G','H']}},
  {l:'P78',v:'Dallas-ATT',h:{g:'E',r:1},a:{g:'I',r:1}},
  {l:'P79',v:'Cd Mexico-Azteca',h:{g:'A',r:0},a:{tf:['C','E','F','H','I']}},
  {l:'P80',v:'Atlanta-MBenz',h:{g:'L',r:0},a:{tf:['E','H','I','J','K']}},
  {l:'P81',v:'San Francisco-Levis',h:{g:'D',r:0},a:{tf:['B','E','F','I','J']}},
  {l:'P82',v:'Seattle-Lumen',h:{g:'G',r:0},a:{tf:['A','E','H','I','J']}},
  {l:'P83',v:'Toronto-BMO Field',h:{g:'K',r:1},a:{g:'L',r:1}},
  {l:'P84',v:'Los Angeles-SoFi',h:{g:'H',r:0},a:{g:'J',r:1}},
  {l:'P85',v:'Vancouver-BC Place',h:{g:'B',r:0},a:{tf:['E','F','G','I','J']}},
  {l:'P86',v:'Kansas City-Arrowhead',h:{g:'J',r:0},a:{g:'H',r:1}},
  {l:'P87',v:'Guadalajara-Akron',h:{g:'K',r:0},a:{tf:['D','E','I','J','L']}},
  {l:'P88',v:'Seattle-Lumen',h:{g:'D',r:1},a:{g:'G',r:1}}
];
export const R16P=[[1,4],[0,2],[3,5],[6,7],[10,11],[8,9],[13,15],[12,14]];
export const R16V=['Philadelphia-Lincoln','Houston-NRG','Nueva York-MetLife','Cd Mexico-Azteca','Dallas-ATT','Seattle-Lumen','Atlanta-MBenz','Vancouver-BC Place'];
export const QFP=[[0,1],[2,3],[4,5],[6,7]];          // orden con el que los participantes llenaron sus brackets (predicciones)
export const QFP_REAL=[[0,1],[4,5],[2,3],[6,7]];     // orden oficial FIFA, solo para el bracket REAL (resultados del admin)
export const QFV=['Boston-Gillette','Los Angeles-SoFi','Miami-Hard Rock','Kansas City-Arrowhead'];
export const SFP=[[0,1],[2,3]];
export const SFV=['Dallas-ATT','Atlanta-MBenz'];
