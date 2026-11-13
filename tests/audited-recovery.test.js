const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict');
const {prepare}=require('../scripts/prepare-audited-recovery'),{applyFiles}=require('../scripts/apply-staged-replays');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/salgeras1.json')));fixture.body.processed=true;
const row={id:fixture.body.id,ladder:'Public',season:'Season 1',processed:true,isVoid:false,players:[{},{}]};
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'audited-recovery-'));let checks=0;
 try{
  const input=path.join(dir,'data.json'),pack=path.join(dir,'pack.json'),output=path.join(dir,'stage/replays.json');const before=JSON.stringify({1:{id:1,legacy:'preserve'},2:null});fs.writeFileSync(input,before);
  const value={schema:1,checkedAt:'test',expectedMissingIds:[row.id],entries:[{id:row.id,listing:row,response:fixture}]};fs.writeFileSync(pack,JSON.stringify(value));
  const result=await prepare(input,pack,output);assert.deepEqual(result.report.added,[row.id]);assert.equal(result.data[row.id].win,true);assert.equal(result.report.failed.length,0);assert.equal(fs.readFileSync(input,'utf8'),before);applyFiles(input,output,path.join(dir,'stage/refresh-status.json'),true);checks+=5;
  // A second application never replaces the valid record that was already published.
  fs.writeFileSync(input,JSON.stringify(result.data));const again=await prepare(input,pack,output);assert.equal(again.report.added.length,0);assert.deepEqual(again.data[row.id],result.data[row.id]);checks+=2;
  for(const invalid of [{...value,expectedMissingIds:[]},{...value,entries:[value.entries[0],value.entries[0]]},{...value,expectedMissingIds:[row.id,row.id]}]){fs.writeFileSync(pack,JSON.stringify(invalid));await assert.rejects(()=>prepare(input,pack,output));checks++;}
  await assert.rejects(()=>prepare(input,pack,input));checks++;
  console.log('PASS: audited snapshot staging, source preservation, idempotency and manifest rejection ('+checks+' checks)');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
