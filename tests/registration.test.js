const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const parser=require('../scripts/replay');
const baseline=require('./fixtures/baseline-replay');
const {recover,collect}=require('../refresh');
const fixtures=Object.fromEntries([854522,836531,842372].map(id=>[id,JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures',id+'.json')))]));
let checks=0;
function row(id,extra={}){return {id,ladder:'Public',season:'Season 1',isVoid:false,processed:true,players:[{},{}],...extra};}
async function main(){
    const parsed=parser.parseWc3StatsReplayData(fixtures[854522]);
    assert.throws(()=>baseline.parseWc3StatsReplayData(fixtures[854522]),/Unknown map version/);checks++;
    assert.deepEqual(parser.parseWc3StatsReplayData(fixtures[836531]),baseline.parseWc3StatsReplayData(fixtures[836531]));checks++;
    assert.equal(parsed.mapVersion,1130);assert.equal(parsed.players.length,3);assert.equal(parsed.players.find(p=>p.name==='ssb817#31439').class,'Shaman');assert.equal(parsed.win,true);assert.equal(parsed.difficulty,'Easy');checks+=5;
    const simulated=structuredClone(fixtures[854522]);simulated.body.data.game.map='Impossible.Bosses.v1.13.1.w3x';assert.equal(parser.parseWc3StatsReplayData(simulated).mapVersion,1131);checks++;
    let calls=[];
    const fetchJson=async url=>{calls.push(url);if(url.includes('page=1'))return {body:[row(854522),row(836531)],pagination:{current:1,next:2,totalPages:2}};if(url.includes('page=2'))return {body:[row(854522),row(842372),row(999,{processed:false}),row(998,{isVoid:true})],pagination:{current:2,next:null,totalPages:2}};return fixtures[url.split('/').at(-1)];};
    const old={1:{id:1,untouched:'legacy'},836531:null};const before=JSON.stringify(old);
    const result=await recover(old,{fetchJson});assert.equal(JSON.stringify(old),before);assert.deepEqual(result.report.added,[854522]);assert.deepEqual(result.report.recoveredNull,[836531]);assert.deepEqual(result.report.pending,[999]);assert.deepEqual(result.report.filtered,[998]);assert.equal(result.report.failed[0].id,842372);assert(!Object.hasOwn(result.data,842372));assert.equal(result.data[1],old[1]);assert.equal(result.report.pages,2);assert.equal(calls.filter(x=>x.endsWith('/854522')).length,1);checks+=10;
    const again=await recover(result.data,{fetchJson});assert.equal(again.data[854522],result.data[854522]);assert.equal(again.report.added.length,0);checks+=2;
    await assert.rejects(()=>collect(async()=>({body:[row(1)],pagination:{current:1,next:1,totalPages:2}})));checks++;
    await assert.rejects(()=>collect(async()=>({body:new Array(200).fill(row(1))})));checks++;
    await assert.rejects(()=>recover(null,{fetchJson}));checks++;
    const network=await recover({854522:null},{fetchJson:async url=>url.includes('?')?{body:[row(854522)],pagination:{current:1,totalPages:1}}:Promise.reject(Error('timeout'))});assert.equal(network.data[854522],null);assert.equal(network.report.failed.length,1);checks+=2;
    const salgeras=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/unconfirmed-1130.json')));
    const observed=parser.parseWc3StatsReplayData(salgeras);
    assert.equal(observed.players.length,8);assert.equal(observed.mapVersion,1130);assert.equal(observed.incomplete,true);checks+=3;
    const processedButNoResult=structuredClone(salgeras);processedButNoResult.body.processed=true;
    const pendingResult=await recover({}, {fetchJson:async url=>url.includes('?')?{body:[row(855188)],pagination:{current:1,totalPages:1}}:processedButNoResult});
    assert.equal(pendingResult.report.unconfirmedResult[0].id,855188);assert(!Object.hasOwn(pendingResult.data,855188));checks+=2;
    const report={passed:true,checks,realReplay:{id:854522,map:'1.13.0',shamanRetained:true,players:3},syntheticFilenameOnly:'1.13.1 is NOT a real replay fixture',operatingDataChanged:false};
    console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
