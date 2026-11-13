// No network: reparse the explicitly audited API responses against current source.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {recover}=require('../refresh');
async function prepare(input='data/replays.json',packFile='data/recovery-audit-20260625.json',output='staging/replays.json'){
 if(path.resolve(input)===path.resolve(output))throw Error('Staging must be separate from source');
 const bytes=fs.readFileSync(input),original=JSON.parse(bytes),pack=JSON.parse(fs.readFileSync(packFile));
 if(pack.schema!==1||!Array.isArray(pack.entries)||!pack.entries.length||!Array.isArray(pack.expectedMissingIds))throw Error('Invalid audit pack');
 const expected=new Set(pack.expectedMissingIds);
 if(expected.size!==pack.expectedMissingIds.length||[...expected].some(id=>!Number.isSafeInteger(id)||id<=0))throw Error('Invalid expected IDs');
 const entries=new Map();
 for(const entry of pack.entries){if(!Number.isSafeInteger(entry.id)||entry.id<=0||entries.has(entry.id)||!expected.has(entry.id)||entry.listing.id!==entry.id||entry.response.body.id!==entry.id)throw Error('Invalid/duplicate audited ID');entries.set(entry.id,entry);}
 const result=await recover(original,{fetchJson:async url=>url.includes('?')?{body:pack.entries.map(e=>e.listing),pagination:{current:1,totalPages:1}}:entries.get(Number(url.split('/').at(-1))).response});
 result.report.sourceDataSha256=crypto.createHash('sha256').update(bytes).digest('hex');
 result.report.collection={mode:'audited-id-recovery',complete:pack.entries.length===pack.expectedMissingIds.length,scope:'Only the explicitly audited missing IDs; not all Discord attachments',auditedIds:pack.entries.length,pagesFetchedThisRun:0,detailsAttemptedThisRun:0,queuedWithoutDetail:0,nextPage:null,checkpointRun:null};
 result.report.audit={checkedAt:pack.checkedAt,expected:pack.expectedMissingIds.length,included:pack.entries.length,diagnosticReplay:855188};
 if(!fs.readFileSync(input).equals(bytes))throw Error('Source changed during preparation');
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(result.data,null,4)+'\n');fs.writeFileSync(path.join(path.dirname(output),'refresh-status.json'),JSON.stringify(result.report,null,2)+'\n');
 console.log(JSON.stringify({added:result.report.added.length,recoveredNull:result.report.recoveredNull.length,unconfirmed:result.report.unconfirmedResult.length,failed:result.report.failed,collection:result.report.collection},null,2));
 return result;
}
module.exports={prepare};if(require.main===module)prepare(...process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1});
