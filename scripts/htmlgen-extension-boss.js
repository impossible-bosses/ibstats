(function(root){
'use strict';
const names={wind:'Vaelor, the Gale Reaver',sylvanas:'Sylvanas / Ilgynoth'};
function collect(replays,id,difficulty){
 const rows=[];
 for(const replay of Object.values(replays||{})){
  if(!replay||replay.difficulty!==difficulty)continue;
  const boss=replay.extensionData?.bosses?.[id];
  if(!boss?.recorded)continue;
  const starts=(boss.startTimes||[]).filter(Number.isFinite),wipes=(boss.wipeTimes||[]).filter(Number.isFinite);
  const killed=Number.isFinite(boss.killTime);
  rows.push({replayId:replay.id,playedOn:replay.playedOn,attempts:starts.length,wipes:wipes.length,cleared:killed,
   status:killed?'Cleared':wipes.length?'Wipe recorded':'Outcome unconfirmed',
   duration:killed&&starts.some(t=>t<=boss.killTime)?boss.killTime-Math.max(...starts.filter(t=>t<=boss.killTime)):null,
   players:boss.players||[]});
 }
 return rows.sort((a,b)=>b.playedOn-a.playedOn);
}
function render(host,replays,id,difficulty){
 const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x;};
 const link=(text,href)=>{const a=el('a',text);a.href=href;return a;};
 const frag=el('div');frag.append(link('‹ BACK','../'));
 const nav=el('p');nav.style.textAlign='center';nav.append(link('Original bosses','./?b=fire&d='+encodeURIComponent(difficulty)));
 for(const [key,name]of Object.entries(names)){nav.append(document.createTextNode(' · '),link(name,'./?b='+key+'&d='+encodeURIComponent(difficulty)));}frag.append(nav);
 const diffs=el('p');diffs.style.textAlign='center';for(const d of ['Very Easy','Easy','Moderate','Normal','Hard'])diffs.append(link(d,'./?b='+id+'&d='+encodeURIComponent(d)),document.createTextNode(' · '));frag.append(diffs);
 frag.append(el('h1',names[id]),el('h4','Difficulty: '+difficulty));
 const rows=collect(replays,id,difficulty);
 frag.append(el('p','These optional encounters are recorded separately from original boss rankings. Sylvanas and Ilgynoth form one encounter. Older replays may contain no dedicated records.'));
 frag.append(el('p',`${rows.length} recorded games · ${rows.filter(r=>r.cleared).length} clears · ${rows.reduce((n,r)=>n+r.wipes,0)} recorded wipes`));
 if(!rows.length)frag.append(el('p','No dedicated records are available for this difficulty yet. This does not mean the boss was never attempted.'));
 const table=el('table');table.style.width='100%';const head=el('tr');
 for(const h of ['Game','Result','Attempts / wipes','Final attempt (s)','Player','Damage','Healing','Deaths','Counter hits / casts'])head.append(el('th',h));table.append(head);
 const value=n=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:3}):'—';
 for(const row of rows){for(const player of row.players.length?row.players:[null]){
  const tr=el('tr'),cell=el('td');cell.append(link('#'+row.replayId,'../game/?id='+encodeURIComponent(row.replayId)));tr.append(cell);
  const s=player?.stats||{};for(const text of [row.status,row.attempts+' / '+row.wipes,value(row.duration),player?.name||'—',value(s.dmg),value(s.hl),value(s.deaths),value(s.counterHit)+' / '+value(s.counterCast)])tr.append(el('td',text));table.append(tr);
 }}
 if(rows.length)frag.append(el('p','Damage, healing and counters are totals across recorded attempts. The time column covers the final successful attempt.'),table);
 host.replaceChildren(frag);
}
async function load(host,id,difficulty){
 try{const response=await fetch('../data/replays.json');if(!response.ok)throw Error('HTTP '+response.status);render(host,await response.json(),id,difficulty);}catch(e){host.textContent='Unable to load boss records. Please try again.';console.error(e);}
}
const api={collect,render,load,names};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.IBExtensionBossPage=api;
})(typeof globalThis!=='undefined'?globalThis:this);
