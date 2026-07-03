// Escapa texto no confiable (nombres, comentarios) antes de insertarlo en innerHTML.
const ESC_MAP={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g,function(c){return ESC_MAP[c];});
}
