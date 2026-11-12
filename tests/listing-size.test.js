const assert=require('assert/strict');
const {collect}=require('../refresh');
(async()=>{
 let calls=0;
 const result=await collect(async url=>{
  const u=new URL(url);assert.equal(u.searchParams.get('limit'),'50');
  const page=Number(u.searchParams.get('page'));calls++;
  return {body:[{id:page}],pagination:{current:page,next:page===40?null:page+1,totalPages:40}};
 });
 assert.equal(calls,40);assert.equal(result.pages,40);assert.equal(result.rows.length,40);
 await assert.rejects(()=>collect(async()=>({body:Array.from({length:50},(_,i)=>({id:i+1}))})),/without pagination/);
 await assert.rejects(()=>collect(async url=>{const p=Number(new URL(url).searchParams.get('page'));if(p===5)throw Error('timeout');return {body:[{id:p}],pagination:{current:p,next:p+1,totalPages:40}};}),/timeout/);
 console.log('PASS: 50-item requests, >30 pages, full-page ambiguity and failed-page rejection');
})().catch(e=>{console.error(e);process.exitCode=1});
