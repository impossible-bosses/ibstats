const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const {fresh,validate,batch,main}=require('../scripts/batch-refresh');
const {verify,applyFiles}=require('../scripts/apply-staged-replays');
const win=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/854522.json')));
const incomplete=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/unconfirmed-1130.json')));
const row=id=>({id,processed:true,ladder:'Public',season:'Season 1',isVoid:false,players:[{},{}]});
function fixture(id){const f=structuredClone(win);f.body.id=id;return f;}
function source(ids,{failPage=0,detailFail=0,pages=10}={}){
 const calls=[];
 return {calls,fetch:async url=>{
  const u=new URL(url);calls.push(url);
  if(u.search){const p=Number(u.searchParams.get('page'));assert.equal(u.searchParams.get('limit'),'50');if(p===failPage)throw Error('page timeout');return {body:[row(ids[p-1]??(900000+p))],pagination:{current:p,next:p===pages?null:p+1,totalPages:pages}};}
  const id=Number(u.pathname.split('/').at(-1));if(id===detailFail)throw Error('detail timeout');return fixture(id);
 }};
}
let checks=0;
(async()=>{
 const old={1:{id:1,legacy:true},2:null};const before=JSON.stringify(old);let saves=[];
 const s=source([854522,854523,854524,854525,854526,854527]);
 const a=await batch(old,fresh(),{fetchJson:s.fetch,save:v=>saves.push(structuredClone(v))});
 assert.equal(a.report.collection.pagesFetchedThisRun,4);assert.equal(a.state.nextPage,4);assert.equal(a.report.added.length,4);assert.equal(JSON.stringify(old),before);assert(saves.length>=8);assert.equal(a.report.collection.complete,false);verify(old,a.data,a.report);checks+=7;
 const b=await batch(old,JSON.parse(JSON.stringify(a.state)),{fetchJson:s.fetch});
 const last=s.calls.slice(s.calls.findIndex(u=>u.includes('page=4'))+1);
 assert.equal(b.state.nextPage,6);assert.equal(b.report.added.length,6);assert.equal(s.calls.filter(u=>u.endsWith('/854522')).length,1);assert(last.some(u=>u.includes('page=1')));checks+=4;
 // New front entries do not get starved while the older-page cursor moves on.
 const shifted=source([855000,854522,854523,854524,854525,854526,854527]);
 const c=await batch(old,structuredClone(b.state),{fetchJson:shifted.fetch});assert(c.report.added.includes(855000));assert(c.report.added.includes(854527));checks+=2;
 // A page failure preserves progress and valid detail work from earlier pages.
 const bad=source([854522,854523],{failPage:3});let checkpoint;
 const failed=await batch(old,fresh(),{fetchJson:bad.fetch,save:v=>checkpoint=structuredClone(v)});
 assert.equal(checkpoint.nextPage,2);assert.equal(failed.report.added.length,2);assert(failed.report.failed.some(e=>e.page===3));verify(old,failed.data,failed.report);checks+=4;
 const resume=source([854522,854523,854524,854525]);const resumed=await batch(old,checkpoint,{fetchJson:resume.fetch});assert(resumed.report.added.includes(854524));assert(!resume.calls.some(u=>u.endsWith('/854522')));checks+=2;
 // A bounded detail queue persists the remaining work; no need to re-list every page.
 const q=source([854522,854523,854524,854525]);const q1=await batch(old,fresh(),{fetchJson:q.fetch,detailLimit:1});assert.equal(q1.report.collection.queuedWithoutDetail,3);
 const q2=await batch(old,q1.state,{fetchJson:q.fetch,detailLimit:1,pageLimit:1});assert.equal(q2.report.added.length,2);checks+=2;
 // Fresh IDs are processed first; a repeatedly failing detail does not block the queue.
 const priority=source([854522,854523,854524,854525]);
 const prioritized=await batch(old,fresh(),{fetchJson:priority.fetch,detailLimit:1});assert(prioritized.report.added.includes(854525));checks++;
 const brokenDetail=source([854522,854523],{detailFail:854523});
 const d1=await batch(old,fresh(),{fetchJson:brokenDetail.fetch,pageLimit:2});assert(d1.report.added.includes(854522));assert(d1.report.failed.some(e=>e.id===854523));
 const d2=await batch(old,structuredClone(d1.state),{fetchJson:brokenDetail.fetch,pageLimit:1});assert.equal(d2.report.collection.detailsAttemptedThisRun,0);
 const d3=await batch(old,d2.state,{fetchJson:brokenDetail.fetch,pageLimit:1});assert.equal(d3.report.collection.detailsAttemptedThisRun,1);checks+=4;
 // Changes to the ORIGINAL source between batches are respected, never overwritten.
 const changed={...old,854522:{id:854522,custom:'new original'}};
 const rebased=await batch(changed,structuredClone(a.state),{fetchJson:s.fetch,pageLimit:1});assert.strictEqual(rebased.data[854522],changed[854522]);assert(!rebased.state.raw[854522]);verify(changed,rebased.data,rebased.report);checks+=3;
 // Unconfirmed outcomes stay outside normal results across a checkpoint reload.
 const f=structuredClone(incomplete);f.body.processed=true;f.body.data.game.events=f.body.data.game.events.filter(e=>!(e.args[0]==='Demonic'&&e.event.eventName==='bossKill'));
 const un=await batch(old,fresh(),{fetchJson:async url=>url.includes('?')?{body:[row(855188)],pagination:{current:1,totalPages:1}}:f});
 assert.equal(un.report.unconfirmedResult[0].id,855188);assert(!Object.hasOwn(un.data,855188));
 const un2=await batch(old,structuredClone(un.state),{fetchJson:async url=>{assert(url.includes('?'));return {body:[row(855188)],pagination:{current:1,totalPages:1}};}});assert.equal(un2.report.unconfirmedResult[0].id,855188);checks+=3;
 const nullSource=source([854522]);const nullResult=await batch({854522:null},fresh(),{fetchJson:nullSource.fetch,pageLimit:1});assert.deepEqual(nullResult.report.recoveredNull,[854522]);checks++;
 // Soft deadline leaves a checkpoint, not a killed process or fabricated completion.
 let clock=0;const timedSource=source([854522,854523]);
 const timed=await batch(old,fresh(),{fetchJson:async u=>{clock+=100;return timedSource.fetch(u);},now:()=>clock,budgetMs:100});
 assert.equal(timed.report.collection.pagesFetchedThisRun,1);assert.equal(timed.report.collection.detailsAttemptedThisRun,0);checks+=2;
 assert.throws(()=>validate({...fresh(),nextPage:-1}));assert.throws(()=>validate({...fresh(),query:'other'}));assert.throws(()=>validate({...fresh(),rows:{'3':{id:4}}}));checks+=3;
 // Date-scoped live collection stops before historical pages and filters old rows.
 let datedCalls=0;
 const dated=await batch(old,fresh(),{fetchJson:async url=>{
  if(url.includes('?')){datedCalls++;return {body:[{...row(854522),playedOn:1794239118},{...row(700000),playedOn:1700000000}],pagination:{current:1,next:2,totalPages:40}};}
  return fixture(854522);
 }});
 assert.equal(datedCalls,1);assert.equal(dated.state.passesReachedEnd,1);assert(!dated.state.rows[700000]);assert.deepEqual(dated.report.added,[854522]);checks+=4;
 // CLI-level files: staging + hash gate, checkpoint persistence and input unchanged.
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ibstat-batch-'));
 try{
  const input=path.join(dir,'original.json'),output=path.join(dir,'staging/replays.json'),state=path.join(dir,'sync-state/state.json'),status=path.join(dir,'staging/refresh-status.json');fs.writeFileSync(input,before);
  await main(['--input',input,'--output',output,'--state',state],{fetchJson:source([854522,854523]).fetch,pageLimit:1});
  assert.equal(fs.readFileSync(input,'utf8'),before);assert.equal(JSON.parse(fs.readFileSync(state)).nextPage,1);applyFiles(input,output,status,true);checks+=3;
  // No successful listing means no staged replay candidate, even with a previous cache.
  fs.unlinkSync(output);await assert.rejects(()=>main(['--input',input,'--output',output,'--state',state],{fetchJson:async()=>{throw Error('offline');}}),/No listing page succeeded/);assert(!fs.existsSync(output));assert.equal(fs.readFileSync(input,'utf8'),before);checks+=3;
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 console.log('PASS: bounded collection and restart safety ('+checks+' checks)');
})().catch(e=>{console.error(e);process.exitCode=1});
