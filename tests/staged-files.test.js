const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto');
const {applyFiles}=require('../scripts/apply-staged-replays');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ibstat-gate-'));
const original=path.join(dir,'replays.json'),candidate=path.join(dir,'candidate.json'),report=path.join(dir,'report.json'),status=path.join(dir,'refresh-status.json');
const old={1:{id:1,win:true},2:null},next={...old,2:{id:2,win:false},3:{id:3,win:true}};
function setup(c=next,r={}){
 fs.writeFileSync(original,JSON.stringify(old));fs.writeFileSync(candidate,JSON.stringify(c));
 fs.writeFileSync(report,JSON.stringify({pages:1,added:[3],recoveredNull:[2],sourceDataSha256:crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex'),...r}));
 if(fs.existsSync(status))fs.unlinkSync(status);
}
let cases=0;
try{
 setup();const bytes=fs.readFileSync(original);applyFiles(original,candidate,report,true);assert.deepEqual(fs.readFileSync(original),bytes);assert.equal(fs.existsSync(status),false);cases++;
 setup();applyFiles(original,candidate,report);assert.deepEqual(JSON.parse(fs.readFileSync(original)),next);assert.deepEqual(fs.readFileSync(status),fs.readFileSync(report));cases++;
 for(const [c,r] of [
  [next,{sourceDataSha256:'wrong'}],
  [next,{sourceDataSha256:undefined}],
  [{...next,1:{id:1,win:false}},{}],
  [{2:next[2],3:next[3]},{}],
  [next,{added:[3,3]}],
  [next,{added:[1,3]}],
  [next,{recoveredNull:[1,2]}],
  [next,{added:[3,4]}],
  [next,{added:['3']}],
  [{...next,3:{id:4}},{}]
 ]){setup(c,r);const before=fs.readFileSync(original);assert.throws(()=>applyFiles(original,candidate,report));assert.deepEqual(fs.readFileSync(original),before);assert.equal(fs.existsSync(status),false);cases++;}
 console.log('PASS: staged file application ('+cases+' cases; rejected inputs leave original untouched)');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
