// Bounded collection. A batch is NOT a claim that the historical backfill is complete.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {requestOnce,recover}=require('../refresh');
const parser=require('./replay');
const API='https://api.wc3stats.com',LIMIT=50;
const SINCE=Date.parse('2026-06-25T00:00:00+09:00')/1000;
const QUERY='search=Impossible.Bosses.v&sort=playedOn&order=desc&limit='+LIMIT;
function fresh(){return {version:1,query:QUERY+'|since='+SINCE,run:0,nextPage:1,rows:{},raw:{},retryAt:{},pagesFetched:0,passesReachedEnd:0};}
function validate(state){
 if(!state||state.version!==1||state.query!==QUERY+'|since='+SINCE)throw Error('Unsupported checkpoint');
 for(const k of ['run','pagesFetched','passesReachedEnd'])if(!Number.isSafeInteger(state[k])||state[k]<0)throw Error('Invalid checkpoint '+k);
 if(!Number.isSafeInteger(state.nextPage)||state.nextPage<1||state.nextPage>1000)throw Error('Invalid checkpoint cursor');
 for(const k of ['rows','raw','retryAt'])if(!state[k]||typeof state[k]!=='object'||Array.isArray(state[k]))throw Error('Invalid checkpoint '+k);
 for(const [id,row] of Object.entries(state.rows))if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id))||String(row.id)!==id)throw Error('Invalid checkpoint replay ID');
 for(const [id,raw] of Object.entries(state.raw))if(!state.rows[id]||!raw?.body||String(raw.body.id)!==id)throw Error('Invalid checkpoint detail');
 return state;
}
function atomic(file,value){
 fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
 const tmp=file+'.tmp';
 try{fs.writeFileSync(tmp,JSON.stringify(value)+'\n');fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
}
async function network(url){
 for(let attempt=0;;attempt++){
  try{return await requestOnce(url,90000);}
  catch(e){if(attempt>=1||(e.status&&e.status!==429&&e.status<500))throw e;await new Promise(r=>setTimeout(r,1000));}
 }
}
async function batch(stored,state=fresh(),options={}){
 validate(state);
 const fetch=options.fetchJson||network,now=options.now||Date.now;
 const start=now(),budget=options.budgetMs??12*60*1000;
 const pageLimit=options.pageLimit??4,detailLimit=options.detailLimit??20;
 if(!stored||typeof stored!=='object'||Array.isArray(stored))throw Error('Invalid stored replay data');
 const checkpoint=()=>{if(options.save)options.save(state);};
 const log=value=>{if(options.progress)options.progress(value);};
 const hasTime=()=>now()-start<budget;
 const hasListingTime=()=>now()-start<budget/2;
 state.run++;
 log({phase:'resume',checkpointRun:state.run,nextPage:state.nextPage,cachedDetails:Object.keys(state.raw).length});
 // Successful production publication makes cached details redundant. Never rewrite it.
 for(const id of Object.keys(state.raw))if(stored[id]!=null){delete state.raw[id];delete state.retryAt[id];}
 const errors=[];let pagesThisRun=0,detailsThisRun=0,backfillPages=0;
 async function page(number){
  log({phase:'listing',page:number,limit:LIMIT});
  const data=await fetch(API+'/replays?'+QUERY+'&page='+number);
  if(!Array.isArray(data.body)||data.body.length>LIMIT)throw Error('Invalid listing body');
  const paging=data.pagination;
  if(paging?.current!=null&&Number(paging.current)!==number)throw Error('Unexpected current page');
  let next=null;
  if(!paging){if(data.body.length>=LIMIT)throw Error('Full listing page without pagination');}
  else{
   const last=Number(paging.totalPages??paging.last);
   if(!(Number.isFinite(last)&&number>=last)){
    next=Number(paging.next);
    if(!Number.isSafeInteger(next)||next<=number||next>1000)throw Error('Invalid next page');
   }
  }
  // Validate the whole page before advancing the checkpoint.
  for(const row of data.body)if(!Number.isSafeInteger(Number(row.id))||Number(row.id)<=0)throw Error('Invalid listing ID');
  if(data.body.some(row=>Number.isFinite(row.playedOn)&&row.playedOn<SINCE))next=null;
  for(const row of data.body)if(!Number.isFinite(row.playedOn)||row.playedOn>=SINCE)state.rows[String(Number(row.id))]=row;
  pagesThisRun++;state.pagesFetched++;
  checkpoint();return next;
 }
 // Always refresh the newest page, even while the older backlog is in progress.
 // The persisted cursor repeats a boundary page to reduce offsets caused by new uploads.
 let headNext;
 try{headNext=await page(1);}catch(e){errors.push({phase:'listing',page:1,reason:String(e)});}
 if(pagesThisRun){
  let cursor=state.nextPage===1?headNext:state.nextPage;
  if(headNext===null){cursor=null;state.nextPage=1;state.passesReachedEnd++;checkpoint();}
  while(cursor!==null&&pagesThisRun<pageLimit&&hasListingTime()){
   try{
    const next=await page(cursor);backfillPages++;
    if(next===null){state.nextPage=1;state.passesReachedEnd++;checkpoint();break;}
    // During this run advance normally. Persist the last successful page so a
    // later run overlaps it instead of trusting a moving offset as a snapshot.
    state.nextPage=cursor;checkpoint();cursor=next;
   }catch(e){errors.push({phase:'listing',page:cursor,reason:String(e)});break;}
  }
 }
 // Queue all known eligible missing records, not only the pages fetched this time.
 const queue=Object.values(state.rows).filter(row=>stored[String(row.id)]==null&&row.processed!==false&&parser.isValidReplay(row)).sort((a,b)=>Number(b.id)-Number(a.id));
 for(const row of queue){
  const id=String(row.id);
  if(state.raw[id]&&state.retryAt[id]==null)continue;
  if((state.retryAt[id]||0)>state.run)continue;
  if(detailsThisRun>=detailLimit||!hasTime())break;
  detailsThisRun++;log({phase:'detail',id:Number(id),attempted:detailsThisRun});
  try{
   const raw=await fetch(API+'/replays/'+id);
   if(!raw?.body||String(raw.body.id)!==id)throw Error('Detail ID mismatch');
   // Parse before storing; malformed records remain retryable and never poison data.
   if(raw.body.processed===false){state.retryAt[id]=state.run+2;checkpoint();continue;}
   const parsed=parser.parseWc3StatsReplayData(raw);
   if(!parsed.players.length)throw Error('No supported participants');
   state.raw[id]=raw;
   if(parsed.incomplete)state.retryAt[id]=state.run+5;
   else delete state.retryAt[id];
  }catch(e){errors.push({phase:'detail',id:Number(id),reason:String(e)});state.retryAt[id]=state.run+2;}
  checkpoint();
 }
 // Reparse raw responses against the CURRENT original file and CURRENT parser;
 // a checkpoint never supplies normalized replacement records for old data.
 const available=Object.values(state.rows).filter(row=>state.raw[String(row.id)]||stored[String(row.id)]!=null||row.processed===false||!parser.isValidReplay(row));
 const result=await recover(stored,{fetchJson:async url=>{
  if(url.includes('?'))return {body:available,pagination:{current:1,totalPages:1}};
  const id=url.split('/').at(-1);if(!state.raw[id])throw Error('No cached response');return state.raw[id];
 }});
 result.report.pages=state.pagesFetched;
 result.report.failed.push(...errors);
 result.report.collection={mode:'bounded-resumable',complete:false,coverage:'Incremental best-effort offset scan; end-of-pass is not proof of complete history',
  pagesFetchedThisRun:pagesThisRun,backfillPagesThisRun:backfillPages,detailsAttemptedThisRun:detailsThisRun,nextPage:state.nextPage,
  passesReachedEnd:state.passesReachedEnd,queuedWithoutDetail:queue.filter(row=>!state.raw[String(row.id)]).length,
  checkpointRun:state.run,elapsedSeconds:Math.round((now()-start)/1000)};
 checkpoint();return {state,...result};
}
async function main(args,options={}){
 let input='data/replays.json',output='staging/replays.json',stateFile='sync-state/state.json';
 for(let i=0;i<args.length;i++){
  if(args[i]==='--input'&&args[i+1])input=args[++i];
  else if(args[i]==='--output'&&args[i+1])output=args[++i];
  else if(args[i]==='--state'&&args[i+1])stateFile=args[++i];
  else throw Error('Usage: batch-refresh.js [--input FILE] [--output FILE] [--state FILE]');
 }
 if(path.resolve(input)===path.resolve(output)||path.resolve(input)===path.resolve(stateFile)||path.resolve(output)===path.resolve(stateFile))throw Error('Input, output and checkpoint must be separate');
 const before=fs.readFileSync(input),stored=JSON.parse(before);
 let state=fresh();
 if(fs.existsSync(stateFile))state=validate(JSON.parse(fs.readFileSync(stateFile)));
 const result=await batch(stored,state,{...options,save:s=>atomic(stateFile,s),progress:v=>console.error(JSON.stringify(v))});
 if(!fs.readFileSync(input).equals(before))throw Error('Original changed during collection');
 result.report.sourceDataSha256=crypto.createHash('sha256').update(before).digest('hex');
 atomic(path.join(path.dirname(output),'refresh-status.json'),result.report);
 if(!result.report.collection.pagesFetchedThisRun)throw Error('No listing page succeeded this run; checkpoint preserved, publication blocked');
 atomic(output,result.data);
 console.log(JSON.stringify(result.report,null,2));
}
module.exports={fresh,validate,batch,main};
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1;});
