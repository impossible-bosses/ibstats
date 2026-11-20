const assert = require('node:assert/strict');
const {parseWc3StatsReplayData: parse} = require('../scripts/replay');
const original = require('./fixtures/salgeras1.json');

function campaign(flag, difficulty = 'Hard') {
    const replay = structuredClone(original);
    const game = replay.body.data.game;
    game.map = 'IB_1.13.1_R71_NORMAL_TEST.w3x';
    for (const [stock, replacement] of [['Brute', 'Wind'], ['Ancient', 'Sylvanas']]) {
        for (const event of game.events) if (event.args[0] === stock) event.args[0] = replacement;
        // Older builds also emitted the stock kill without starting that boss.
        const kill = game.events.find(event => event.args[0] === replacement && event.event.eventName === 'bossKill');
        game.events.push({...kill, args: [stock]});
    }
    for (const player of game.players) {
        player.flags = flag ? [flag] : [];
        Object.assign(player.variables, {
            ibCampaignRules: '11', difficulty, continues: 'yes',
            sylvanasDeaths: 0, windDeaths: 0, ilgynothDamage: 1234, ilgynothDeaths: 0,
        });
    }
    game.events.sort((a, b) => a.time - b.time);
    return replay;
}
function add(replay, name, eventName, time) {
    replay.body.data.game.events.push({args: [name], event: {eventName}, time});
}

const failed = campaign('loser');
add(failed, 'Ilgynoth', 'bossEngage', 3630);
add(failed, 'Ilgynoth', 'bossWipe', 3750);
const defeat = parse(failed);
assert.equal(defeat.win, false);
assert.equal(defeat.incomplete, false);
assert.equal(defeat.baseClear.confirmed, true);
assert.equal(defeat.bossKills, 10);
assert.equal(defeat.maxBosses, 11);
assert.equal(defeat.bosses.brute.killTime, null);
assert.equal(defeat.extensionData.bosses.ilgynoth.players[0].stats.dmg, 1234);
assert.equal(defeat.extensionData.bosses.ilgynoth.wipeTimes.length, 1);
assert.equal(defeat.players[0].bossKills, 10);
assert.equal(defeat.totalWipes, 2);

const success = campaign('winner');
add(success, 'Ilgynoth', 'bossEngage', 3630);
add(success, 'Ilgynoth', 'bossWipe', 3690);
add(success, 'Ilgynoth', 'bossEngage', 3730);
add(success, 'Ilgynoth', 'bossKill', 3750);
const victory = parse(success);
assert.equal(victory.win, true);
assert.equal(victory.bossKills, 11);
assert.equal(victory.maxBosses, 11);

const exitBeforeBoss = parse(campaign(null));
assert.equal(exitBeforeBoss.win, false);
assert.equal(exitBeforeBoss.incomplete, true);
assert.equal(exitBeforeBoss.bossKills, 10);
assert.equal(parse(campaign('winner', 'Normal')).win, true);
assert.equal(parse(campaign('winner', 'Normal')).bossKills, 10);

const continued = campaign('winner', 'Normal');
continued.body.data.game.events.splice(1, 0,
    {args: ['Fire'], event: {eventName: 'bossWipe'}, time: 330},
    {args: ['Fire'], event: {eventName: 'bossEngage'}, time: 360});
const retry = parse(continued);
assert.equal(retry.remakeData, false);
assert.deepEqual(retry.bosses.fire.wipeTimes, [330]);
assert.deepEqual(retry.bosses.fire.startTimes, [300, 360]);
assert.equal(retry.bossKills, 10);

function releasedCampaign(flag, difficulty) {
    const replay = campaign(flag, difficulty);
    const game = replay.body.data.game;
    game.map = 'Impossible.Bosses.v1.13.2.w3x';
    for (const player of game.players) delete player.variables.ibCampaignRules;
    return replay;
}

const releasedHardExit = parse(releasedCampaign(null, 'Hard'));
assert.equal(releasedHardExit.win, false);
assert.equal(releasedHardExit.incomplete, true);
assert.equal(releasedHardExit.bossKills, 10);
assert.equal(releasedHardExit.maxBosses, 11);

const releasedHardWipe = releasedCampaign('loser', 'Hard');
add(releasedHardWipe, 'Ilgynoth', 'bossEngage', 3630);
add(releasedHardWipe, 'Ilgynoth', 'bossWipe', 3750);
assert.equal(parse(releasedHardWipe).bossKills, 10);
assert.equal(parse(releasedHardWipe).win, false);
assert.equal(parse(releasedHardWipe).incomplete, false);

const releasedHardWin = releasedCampaign('winner', 'Hard');
add(releasedHardWin, 'Ilgynoth', 'bossEngage', 3630);
add(releasedHardWin, 'Ilgynoth', 'bossKill', 3750);
assert.equal(parse(releasedHardWin).bossKills, 11);
assert.equal(parse(releasedHardWin).win, true);
assert.equal(parse(releasedHardWin).mapVersion, 1132);
assert.equal(parse(releasedCampaign('winner', 'Normal')).bossKills, 10);
assert.equal(parse(releasedCampaign('winner', 'Normal')).win, true);
