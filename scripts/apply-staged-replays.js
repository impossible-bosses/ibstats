// Deployment-side integrity gate. Does not run during dry-run collection.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
function verify(original,candidate,report){
    if(!original||!candidate||Array.isArray(original)||Array.isArray(candidate))throw Error('Invalid replay maps');
    if(!report||!Array.isArray(report.added)||!Array.isArray(report.recoveredNull)||report.pages<1)throw Error('Missing collection report');
    const declared=[...report.added,...report.recoveredNull];
    if(declared.some(id=>!Number.isSafeInteger(id)||id<=0))throw Error('Invalid declared ID');
    const allowed=new Set(declared.map(String));
    if(allowed.size!==declared.length)throw Error('Duplicate/overlapping report IDs');
    for(const id of report.added)if(Object.hasOwn(original,String(id)))throw Error('Added ID already existed: '+id);
    for(const id of report.recoveredNull)if(!Object.hasOwn(original,String(id))||original[id]!==null)throw Error('Recovery is not an original null: '+id);
    for(const id of allowed)if(!Object.hasOwn(candidate,id)||candidate[id]===null)throw Error('Declared change absent: '+id);
    for(const [id,value] of Object.entries(original)){
        if(!Object.hasOwn(candidate,id))throw Error('Existing ID removed: '+id);
        if(value!==null&&JSON.stringify(value)!==JSON.stringify(candidate[id]))throw Error('Existing valid record changed: '+id);
        if(value===null&&candidate[id]!==null&&!allowed.has(id))throw Error('Unreported recovery: '+id);
    }
    for(const [id,value] of Object.entries(candidate)){
        if(!Object.hasOwn(original,id)&&(!allowed.has(id)||value===null))throw Error('Unreported/invalid addition: '+id);
        if(allowed.has(id)&&(value==null||String(value.id)!==id))throw Error('Candidate ID mismatch: '+id);
    }
}
function applyFiles(originalFile,candidateFile,reportFile,checkOnly=false){
    const originalBytes=fs.readFileSync(originalFile);
    const original=JSON.parse(originalBytes),candidate=JSON.parse(fs.readFileSync(candidateFile)),report=JSON.parse(fs.readFileSync(reportFile));
    const digest=crypto.createHash('sha256').update(originalBytes).digest('hex');
    if(typeof report.sourceDataSha256!=='string'||report.sourceDataSha256!==digest)throw Error('Collection source does not match original data');
    verify(original,candidate,report);
    if(checkOnly){console.log('PASS: source hash and all existing replay entries preserved; no files changed');return;}
    if(!fs.readFileSync(originalFile).equals(originalBytes))throw Error('Original changed during verification');
    const tmp=originalFile+'.verified-tmp';
    try{fs.writeFileSync(tmp,JSON.stringify(candidate,null,4)+'\n');fs.renameSync(tmp,originalFile);}
    finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
    fs.copyFileSync(reportFile,path.join(path.dirname(originalFile),'refresh-status.json'));
}
if(require.main===module){
    const [originalFile,candidateFile,reportFile,mode]=process.argv.slice(2);
    if(!reportFile||(mode&&mode!=='--check'))throw Error('Usage: node scripts/apply-staged-replays.js ORIGINAL CANDIDATE REPORT [--check]');
    applyFiles(originalFile,candidateFile,reportFile,mode==='--check');
}
module.exports={verify,applyFiles};
