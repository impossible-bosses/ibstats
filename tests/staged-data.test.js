const assert=require('assert/strict');
const {verify}=require('../scripts/apply-staged-replays');
const old={'1':{id:1,win:true},'2':null};
const next={'1':{id:1,win:true},'2':{id:2,win:false},'3':{id:3,win:true}};
const report={pages:1,added:[3],recoveredNull:[2]};
verify(old,next,report);
for(const bad of [
 {'2':{id:2},'3':{id:3}},
 {...next,'1':{id:1,win:false}},
 {...next,'4':{id:4}},
 {...next,'3':null},
 {...next,'3':{id:4}}
])assert.throws(()=>verify(old,bad,report));
assert.throws(()=>verify(old,next,{pages:0,added:[3],recoveredNull:[2]}));
assert.throws(()=>verify(old,next,{pages:1,added:[3],recoveredNull:[]}));
console.log('PASS: staged replay integrity gate (8 cases)');
