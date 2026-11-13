(function(root){
 'use strict';
 function records(replays,player,resolve){
  const result=[];
  for(const replay of Object.values(replays||{})){
   if(!replay?.extensionData)continue;
   if(!replay.players.some(p=>resolve(p.name)===player))continue;
   for(const [id,boss]of Object.entries(replay.extensionData.bosses)){
    const own=boss.players.find(p=>resolve(p.name)===player);
    let duration=null;
    if(boss.killTime!=null){const starts=boss.startTimes.filter(t=>t<=boss.killTime);if(starts.length)duration=boss.killTime-Math.max(...starts);}
    result.push({replayId:replay.id,playedOn:replay.playedOn,boss:id,name:boss.name,recorded:boss.recorded,
     status:!boss.recorded?'No dedicated telemetry':boss.killTime!=null?'Cleared':boss.wipeTimes.length?'Wipe recorded':'Result not confirmed',
     attempts:boss.startTimes.length,wipes:boss.wipeTimes.length,duration,stats:own?.stats||{},baseClear:!!replay.baseClear?.confirmed});
   }
  }
  return result.sort((a,b)=>b.playedOn-a.playedOn);
 }
 function render(replays,players,player){
  const host=document.getElementById('extra-boss-replays');if(!host)return;
  const rows=records(replays,getPlayerFromAlias(players,player),name=>getPlayerFromAlias(players,name));if(!rows.length)return;
  const h=document.createElement('h2');h.textContent='Additional boss records';
  const p=document.createElement('p');p.textContent='Base victory is recorded separately. Missing dedicated telemetry does not mean the boss was not attempted. Additional boss records do not alter base rankings.';
  const table=document.createElement('table');const head=document.createElement('tr');
  for(const title of ['Replay','Boss','Result','Attempts / wipes','Kill time (s)','Damage','Healing','Deaths','Counter hits / casts']){const th=document.createElement('th');th.textContent=title;head.append(th);}table.append(head);
  const value=x=>Number.isFinite(x)?String(x):'—';
  for(const row of rows){
   const tr=document.createElement('tr'),td=document.createElement('td'),a=document.createElement('a');a.href='https://wc3stats.com/games/'+row.replayId;a.textContent='#'+row.replayId;td.append(a);tr.append(td);
   for(const text of [row.name,row.status,row.recorded?row.attempts+' / '+row.wipes:'—',value(row.duration),value(row.stats.dmg),value(row.stats.hl),value(row.stats.deaths),value(row.stats.counterHit)+' / '+value(row.stats.counterCast)]){const cell=document.createElement('td');cell.textContent=text;tr.append(cell);}table.append(tr);
  }
  host.replaceChildren(h,p,table);host.hidden=false;
 }
 const api={records,render};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.IBExtraBosses=api;
})(typeof globalThis!=='undefined'?globalThis:this);
