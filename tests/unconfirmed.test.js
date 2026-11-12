const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const api=require('../scripts/htmlgen-unconfirmed');
const report={unconfirmedResult:[{id:855188,players:['ssb817#31439'],playedOn:2,difficulty:'Hard'},
    {id:855188,players:['ssb817#31439'],playedOn:2,difficulty:'Hard'},
    {id:1,players:['SomeoneElse'],playedOn:1},{id:'bad',players:['ssb817#31439']}]};
const resolve=name=>name==='ssb817#31439'?'ice-follower':name;
assert.equal(api.matching(report,'ice-follower',resolve).length,1);
assert.equal(api.matching(report,'Absent',resolve).length,0);
assert.deepEqual(api.matching({},'ice-follower',resolve),[]);
class Element{constructor(tag){this.tag=tag;this.children=[];this.hidden=true;}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}}
(async()=>{
 const host=new Element('section');const context={console,Map,Number,Date,document:{getElementById:()=>host,createElement:t=>new Element(t)},getPlayerFromAlias:(_,n)=>resolve(n),fetch:async()=>({ok:true,json:async()=>report})};
 context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/htmlgen-unconfirmed.js'),'utf8'),context);
 await context.IBUnconfirmed.render([],'ice-follower');assert.equal(host.hidden,false);assert(host.children[1].textContent.includes('excluded from rankings'));assert.equal(host.children[2].children[0].children[0].href,'https://wc3stats.com/games/855188');
 context.fetch=async()=>({ok:false});await context.IBUnconfirmed.render([],'ice-follower');
 console.log('PASS: alias matching, deduplication, pending visibility, ranking separation, status-file fallback (7 cases)');
})().catch(e=>{console.error(e);process.exitCode=1});
