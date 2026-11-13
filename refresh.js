// Refresh normalized replay data. Existing valid records are never reparsed or
// replaced automatically. Use --output FILE for a reviewable staging run.
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const replay = require('./scripts/replay');
const API = 'https://api.wc3stats.com';

function requestOnce(url, timeout = 180000) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {headers: {'User-Agent': 'IBStat-refresh/2.0'}}, res => {
            let body = ''; let size = 0;
            res.setEncoding('utf8');
            res.on('data', chunk => {
                size += Buffer.byteLength(chunk); body += chunk;
                if (size > 8 * 1024 * 1024) req.destroy(new Error('Response exceeds 8 MiB'));
            });
            res.on('error', reject);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    const e = new Error('HTTP ' + res.statusCode);
                    e.status = res.statusCode; e.retryAfter = res.headers['retry-after']; reject(e); return;
                }
                try {
                    const data = JSON.parse(body);
                    if (data.status !== 'OK' || data.code !== 200) throw new Error('API response not OK');
                    resolve(data);
                } catch (e) {reject(e);}
            });
        });
        // Absolute deadline also covers slow/trickling responses.
        const deadline = setTimeout(() => req.destroy(new Error('Request deadline exceeded')), timeout);
        req.on('close', () => clearTimeout(deadline));
        req.on('error', reject);
    });
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function getJson(url) {
    for (let attempt = 0; ; attempt++) {
        try {return await requestOnce(url);}
        catch (e) {
            if (attempt >= 2 || (e.status && e.status !== 429 && e.status < 500)) throw e;
            const seconds = Number(e.retryAfter);
            await wait(Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 60000) : 1000 * (attempt + 1));
        }
    }
}
function idKey(value) {
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n <= 0) throw new Error('Invalid replay ID');
    return String(n);
}
async function collect(fetchJson, maxPages = 100, progress = () => {}) {
    let page = 1;
    const seenPages = new Set(), rows = new Map();
    for (;;) {
        if (seenPages.has(page) || seenPages.size >= maxPages) throw new Error('Replay pagination incomplete/looping; no data will be saved');
        seenPages.add(page);
        progress({phase: 'listing', page, limit: 50});
        const url = API + '/replays?search=Impossible.Bosses.v&sort=playedOn&order=desc&limit=50&page=' + page;
        const data = await fetchJson(url);
        if (!Array.isArray(data.body)) throw new Error('Replay listing body is not an array');
        for (const row of data.body) rows.set(idKey(row.id), row);
        const paging = data.pagination;
        if (!paging) {
            if (data.body.length >= 50) throw new Error('Full page without pagination; refusing a silently incomplete scan');
            break;
        }
        if (paging.current != null && Number(paging.current) !== page) throw new Error('Unexpected pagination current page');
        const last = Number(paging.totalPages ?? paging.last);
        if (Number.isFinite(last) && page >= last) break;
        const next = Number(paging.next);
        if (!Number.isSafeInteger(next) || next <= page) throw new Error('Invalid pagination next page');
        page = next;
    }
    return {rows: [...rows.values()], pages: seenPages.size};
}
async function recover(stored, options = {}) {
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) throw new Error('Stored replay data must be an object');
    const fetchJson = options.fetchJson || getJson;
    const next = {...stored};
    const progress = options.progress || (() => {});
    const listing = await collect(fetchJson, options.maxPages || 100, progress);
    const report = {at: new Date().toISOString(), pages: listing.pages, listed: listing.rows.length,
        preserved: 0, added: [], recoveredNull: [], filtered: [], pending: [], unconfirmedResult: [], failed: [], remainingNull: []};
    let attempts = 0;
    for (const row of listing.rows) {
        const id = idKey(row.id);
        if (stored[id] != null) {report.preserved++; continue;}
        if (row.processed === false) {report.pending.push(Number(id)); continue;}
        if (!replay.isValidReplay(row)) {report.filtered.push(Number(id)); continue;}
        progress({phase: 'detail', id: Number(id), attempted: ++attempts});
        if (!options.fetchJson) await wait(500); // Serial requests with a modest default throttle.
        try {
            const raw = await fetchJson(API + '/replays/' + id);
            if (!raw.body || idKey(raw.body.id) !== id) throw new Error('Detail ID does not match listing');
            if (raw.body.processed === false) {report.pending.push(Number(id)); continue;}
            const parsed = replay.parseWc3StatsReplayData(raw);
            if (parsed.incomplete) {
                report.unconfirmedResult.push({id: Number(id), reason: 'Final result not confirmed in the replay', players: parsed.players.map(p => p.name), playedOn: parsed.playedOn, difficulty: parsed.difficulty, mapVersion: parsed.mapVersion});
                continue;
            }
            // A server response with no supported participants is not a valid new record.
            if (!parsed.players.length) throw new Error('No supported participants');
            next[id] = parsed;
            if (Object.prototype.hasOwnProperty.call(stored, id)) report.recoveredNull.push(Number(id));
            else report.added.push(Number(id));
        } catch (e) {
            // Keep original null entries, and do not add new null poison-pill IDs.
            report.failed.push({id: Number(id), reason: String(e), retryable: true});
        }
    }
    report.remainingNull = Object.keys(next).filter(id => next[id] === null).map(Number);
    return {data: next, report};
}
function atomicJson(file, value) {
    fs.mkdirSync(path.dirname(path.resolve(file)), {recursive: true});
    const temp = file + '.tmp-' + process.pid;
    try {fs.writeFileSync(temp, JSON.stringify(value, null, 4) + '\n'); fs.renameSync(temp, file);}
    finally {if (fs.existsSync(temp)) fs.unlinkSync(temp);}
}
async function main(args) {
    let input = 'data/replays.json', output = null, pages = 100;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && args[i+1]) input = args[++i];
        else if (args[i] === '--output' && args[i+1]) output = args[++i];
        else if (args[i] === '--max-pages' && args[i+1]) pages = Number(args[++i]);
        else throw new Error('Usage: node refresh.js [--input FILE] [--output STAGING_FILE] [--max-pages N]');
    }
    if (!Number.isSafeInteger(pages) || pages < 1 || pages > 100) throw new Error('Invalid page cap');
    output = output || input;
    const before = fs.readFileSync(input);
    const original = JSON.parse(before.toString('utf8'));
    let result;
    try {
        result = await recover(original, {maxPages: pages, progress: value => console.error(JSON.stringify(value))});
    } catch (error) {
        if (path.resolve(output) !== path.resolve(input)) atomicJson(path.join(path.dirname(output), 'refresh-error.json'), {at: new Date().toISOString(), message: String(error), replayDataWriteAttempted: false});
        throw error;
    }
    result.report.sourceDataSha256 = crypto.createHash('sha256').update(before).digest('hex');
    if (!fs.readFileSync(input).equals(before)) throw new Error('Source changed during refresh; refusing overwrite');
    // Write a status file even when every candidate fails. Failures stay retryable.
    atomicJson(path.join(path.dirname(output), 'refresh-status.json'), result.report);
    if (result.report.added.length || result.report.recoveredNull.length || path.resolve(output) !== path.resolve(input)) atomicJson(output, result.data);
    console.log(JSON.stringify(result.report, null, 2));
}
module.exports = {requestOnce, getJson, collect, recover, main};
if (require.main === module) main(process.argv.slice(2)).catch(e => {console.error(e); process.exitCode = 1;});
