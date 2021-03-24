const DIFFICULTY = {
	VE: "Very Easy",
	E: "Easy",
	M: "Moderate",
	N: "Normal",
	H: "Hard",
};

const BOSS = {
	FIRE: "fire",
	WATER: "water",
	BRUTE: "brute",
	THUNDER: "thunder",
	DRUID: "druid",
	SHADOW: "shadow",
	ICE: "ice",
	LIGHT: "light",
	ANCIENT: "ancient",
	DEMONIC: "demonic"
};

const CLASS = {
	DK: "Death Knight",
	DRUID: "Druid",
	FM: "Fire Mage",
	IM: "Ice Mage",
	PALADIN: "Paladin",
	PRIEST: "Priest",
	RANGER: "Ranger",
	ROGUE: "Rogue",
	WARLOCK: "Warlock",
	WARRIOR: "Warrior"
};

const MAP_VERSION = {
	V1_11_4: 4,
	V1_11_5: 5,
	V1_11_6: 6
};

function numberSeparateThousands(x, sep)
{
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

function secondsToTimestamp(seconds)
{
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	let str = m.toString() + ":";
	if (s < 10) {
		str += "0";
	}
	str += s.toString();
	return str;
}

function stringToEnum(str, enumObject)
{
	for (k in enumObject) {
		if (str == enumObject[k]) {
			return enumObject[k];
		}
	}
	return null;
}

function mapFileToVersion(file)
{
	if (file == "Impossible.Bosses.v1.11.4-nobnet.w3x") {
		return MAP_VERSION.V1_11_4;
	}
	else if (file == "Impossible.Bosses.v1.11.5-no-bnet.w3x") {
		return MAP_VERSION.V1_11_5;
	}
	else if (file == "Impossible.Bosses.v1.11.6.w3x" || file == "Impossible.Bosses.v1.11.6-no-bnet.w3x") {
		return MAP_VERSION.V1_11_6;
	}
	return null;
}

function difficultyToShortString(d)
{
	if (d == DIFFICULTY.VE) {
		return "VE";
	}
	else if (d == DIFFICULTY.E) {
		return "E";
	}
	else if (d == DIFFICULTY.M) {
		return "M";
	}
	else if (d == DIFFICULTY.N) {
		return "N";
	}
	else if (d == DIFFICULTY.H) {
		return "H";
	}
	throw `Unknown difficulty ${d}`;
}

function getDifficultyMaxBosses(d)
{
	if (d == DIFFICULTY.VE) {
		return 8;
	}
	else if (d == DIFFICULTY.E || d == DIFFICULTY.M) {
		return 9;
	}
	else if (d == DIFFICULTY.N || d == DIFFICULTY.H) {
		return 10;
	}
	throw `Unknown difficulty ${d}`;
}

function getBossLongName(b)
{
	if (b == BOSS.FIRE) {
		return "Belthazar, Lord of Flame";
	}
	else if (b == BOSS.WATER) {
		return "Ai, Serpent of the Sea";
	}
	else if (b == BOSS.BRUTE) {
		return "Gaven the Brute";
	}
	else if (b == BOSS.THUNDER) {
		return "Zephire the Thunder Lord";
	}
	else if (b == BOSS.DRUID) {
		return "Gaia the Master Druid";
	}
	else if (b == BOSS.SHADOW) {
		return "Varenel the Shadow";
	}
	else if (b == BOSS.ICE) {
		return "Selia the Ice Queen";
	}
	else if (b == BOSS.LIGHT) {
		return "Remington the Holy Saint";
	}
	else if (b == BOSS.ANCIENT) {
		return "Ancient Spirit";
	}
	else if (b == BOSS.DEMONIC) {
		return "Pandomonium the Demi-God";
	}
	throw `Unknown boss ${b}`;
}

function classToIconPath(c)
{
	let path = IMAGES_PATH + "images/";
	if (c == CLASS.DK) {
		path += "icon-dk.png";
	}
	else if (c == CLASS.DRUID) {
		path += "icon-druid.png";
	}
	else if (c == CLASS.FM) {
		path += "icon-fm.png";
	}
	else if (c == CLASS.IM) {
		path += "icon-im.png";
	}
	else if (c == CLASS.PALADIN) {
		path += "icon-pala.png";
	}
	else if (c == CLASS.PRIEST) {
		path += "icon-priest.png";
	}
	else if (c == CLASS.RANGER) {
		path += "icon-ranger.png";
	}
	else if (c == CLASS.ROGUE) {
		path += "icon-rogue.png";
	}
	else if (c == CLASS.WARLOCK) {
		path += "icon-warlock.png";
	}
	else if (c == CLASS.WARRIOR) {
		path += "icon-warrior.png";
	}
	return path;
}

function mapVersionToString(v)
{
	if (v == MAP_VERSION.V1_11_4) {
		return "Impossible Bosses v1.11.4";
	}
	else if (v == MAP_VERSION.V1_11_5) {
		return "Impossible Bosses v1.11.5";
	}
	else if (v == MAP_VERSION.V1_11_6) {
		return "Impossible Bosses v1.11.6";
	}
	throw `Unknown map version ${v}`;
}

function parseWc3StatsPlayerStats(data)
{
	let playerStats = {
		deaths: data.deaths,
		dmg: data.damage,
		hl: data.healing,
		hlr: data.healingReceived,
		hlrSw: null,
		degen: data.degen
	};

	if (data.hasOwnProperty("sWHealingReceived")) {
		playerStats.hlrSw = data.sWHealingReceived;
	}

	return playerStats;
}

function parseWc3StatsPlayerData(data)
{
	const mmdVars = data.variables;
	let playerData = {
		name: data.name,
		isHost: data.isHost,
		slot: data.slot,
		color: data.colour,
		class: stringToEnum(mmdVars.class, CLASS),
		health: mmdVars.health,
		mana: mmdVars.mana,
		ability: mmdVars.ability,
		ms: mmdVars.movementSpeed,
		coins: mmdVars.coins,
		statsOverall: parseWc3StatsPlayerStats(mmdVars),
		bossKills: 0,
		statsBoss: {}
	};

	if (playerData.class == null) {
		return null;
	}

	for (b in BOSS) {
		let mmdVarsBoss = {};
		for (k in mmdVars) {
			if (k.substring(0, BOSS[b].length) == BOSS[b]) {
				let kTrim = k[BOSS[b].length].toLowerCase() + k.substring(BOSS[b].length + 1, k.length);
				mmdVarsBoss[kTrim] = mmdVars[k];
			}
		}

		const bossStats = parseWc3StatsPlayerStats(mmdVarsBoss);
		if (bossStats.deaths != null) {
			playerData.bossKills += 1;
		}
		playerData.statsBoss[BOSS[b]] = bossStats;
	}

	return playerData
}

function parseWc3StatsReplayData(data)
{
	const game = data.body.data.game;
	let replayData = {
		id: data.body.id,
		name: game.name,
		mapVersion: mapFileToVersion(game.map),
		host: game.host,
		win: false,
		difficulty: DIFFICULTY.VE,
		continues: false,
		players: [],
		bosses: {},
		bossKills: null,
		totalWipes: 0
	};

	if (replayData.mapVersion == null) {
		throw `Unknown map version, file "${game.map}"`;
	}

	let flag = null;
	let difficulty = null;
	let continues = null;
	for (let i = 0; i < game.players.length; i++) {
		const player = game.players[i];
		if (player.flags.length == 1) {
			let flagPlayer = player.flags[0];
			if (flag == null) {
				flag = flagPlayer;
			}
			else if (flag != flagPlayer) {
				throw `Inconsistent flags: ${flag} and ${flagPlayer}`;
			}
		}

		const difficultyPlayer = player.variables.difficulty;
		if (difficulty == null) {
			difficulty = difficultyPlayer;
		}
		else if (difficulty != difficultyPlayer) {
			throw `Inconsistent difficulties: ${difficulty} and ${difficultyPlayer}`;
		}

		let continuesPlayer = null;
		if (player.variables.hasOwnProperty("contines")) {
			// I had a typo in the IB map...
			continuesPlayer = player.variables.contines;
		}
		else {
			continuesPlayer = player.variables.continues;
		}
		if (continues == null) {
			continues = continuesPlayer;
		}
		else if (continues != continuesPlayer) {
			throw `Inconsistent continues: ${continues} and ${continuesPlayer}`;
		}
	}

	if (flag == "winner") {
		replayData.win = true;
	}
	else if (flag == "loser") {
		replayData.win = false;
	}
	else if (flag == null) {
		throw "No flag values found";
	}
	else {
		throw `Invalid flag value: ${flag}`;
	}

	replayData.difficulty = stringToEnum(difficulty, DIFFICULTY);
	if (replayData.difficulty == null) {
		throw `Invalid difficulty value: ${difficulty}`;
	}

	if (continues == "yes") {
		replayData.continues = true;
	}
	else if (continues == "no") {
		replayData.continues = false;
	}
	else {
		throw `Invalid continues value: ${continues}`;
	}

	for (let i = 0; i < game.players.length; i++) {
		const playerData = parseWc3StatsPlayerData(game.players[i]);
		if (playerData == null) {
			continue;
		}
		if (replayData.bossKills == null || replayData.bossKills < playerData.bossKills) {
			replayData.bossKills = playerData.bossKills;
		}
		replayData.players.push(playerData);
	}

	for (b in BOSS) {
		replayData.bosses[BOSS[b]] = {
			startTimes: [],
			wipeTimes: [],
			killTime: null
		};
	}
	for (let i = 0; i < game.events.length; i++) {
		const e = game.events[i];
		if (e.args.length != 1) {
			throw `Event with more than 1 arg: ${e}`;
		}
		const boss = stringToEnum(e.args[0].toLowerCase(), BOSS);
		if (boss == null) {
			throw `Unrecognized boss in event: ${e.args[0]}`;
		}

		const eName = e.event.eventName;
		if (eName == "bossEngage") {
			replayData.bosses[boss].startTimes.push(e.time);
		}
		else if (eName == "bossKill") {
			replayData.bosses[boss].killTime = e.time;
		}
		else if (eName == "bossWipe") {
			replayData.bosses[boss].wipeTimes.push(e.time);
			replayData.totalWipes += 1;
		}
		else {
			throw `Unrecognized event ${eName}`;
		}
	}
	for (b in BOSS) {
		const bossData = replayData.bosses[BOSS[b]];
		let expectedWipeTimes = bossData.startTimes.length;
		if (bossData.killTime != null) {
			expectedWipeTimes -= 1;
		}
		if (bossData.wipeTimes.length != expectedWipeTimes) {
			throw `Unexpected # of wipe times for boss ${BOSS[b]}: ${bossData.wipeTimes.length}, expected ${expectedWipeTimes}`;
		}
	}

	return replayData;
}

function generateHtmlTitle(data)
{
	const diffString = difficultyToShortString(data.difficulty);
	let victoryDefeatString = null;
	if (data.win) {
		victoryDefeatString = "Victory!";
	}
	else {
		victoryDefeatString = `Defeat (${data.bossKills}/${getDifficultyMaxBosses(data.difficulty)})`;
	}

	let html = `<h1>${data.players.length} ${diffString} - ${victoryDefeatString}</h1>`;
	html += `<h4>${mapVersionToString(data.mapVersion)}</h4>`;
	html += `<hr>`;
	return html;
}

function generateHtmlPlayer(playerData)
{
	const iconPath = classToIconPath(playerData.class);
	let html = `<td class="playerImageName">`;
	html += `<img src="${iconPath}"/>`;
	html += `<div class="player player${playerData.slot}">${playerData.name}</div>`;
	html += `</td>`;
	return html;
}

function generateHtmlKarma(data)
{
	let html = `<h2>Karma</h2>`;
	html += `<table>`;
	html += `<tr><th></th><th>Health</th><th>Mana</th><th>Ability</th><th>MS</th></tr>`;
	for (let i = 0; i < data.players.length; i++) {
		const p = data.players[i];
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = " rowLighter";
		}
		html += `<tr class="playerRow${rowLighterOrNot}">`;
		html += generateHtmlPlayer(p);
		html += `<td>${p.health}</td>`;
		html += `<td>${p.mana}</td>`;
		html += `<td>${p.ability}</td>`;
		html += `<td>${p.ms}</td>`;
		html += `</tr>`;
	}
	html += `</table>`;
	return html;
}

function generateHtmlBoss(data, boss)
{
	const bossData = data.bosses[boss];
	const numWipes = bossData.wipeTimes.length;
	let continuesStr = "";
	if (numWipes > 0) {
		continuesStr = `${numWipes} Wipes | `;
	}
	const bossTime = secondsToTimestamp(bossData.killTime - bossData.startTimes[bossData.startTimes.length - 1]);

	let html = `<h2 class="bossTitleLeft">${getBossLongName(boss)}</h2>`;
	html += `<h2 class="bossTitleRight">${continuesStr}${bossTime} <img src="${""}"/></h2>`;
	html += `<table>`;
	html += `<tr><th></th><th>Deaths</th><th>Damage</th><th>Healing</th><th>Healing Received</th><th>Degen</th></tr>`;
	for (let i = 0; i < data.players.length; i++) {
		const p = data.players[i];
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = " rowLighter";
		}
		const pb = p.statsBoss[boss];
		html += `<tr class="playerRow${rowLighterOrNot}">`;
		html += generateHtmlPlayer(p);
		html += `<td>${pb.deaths}</td>`;
		html += `<td>${numberSeparateThousands(Math.round(pb.dmg), " ")}</td>`;
		html += `<td>${numberSeparateThousands(Math.round(pb.hl), " ")}</td>`;
		html += `<td>${numberSeparateThousands(Math.round(pb.hlr), " ")}</td>`;
		html += `<td>${numberSeparateThousands(Math.round(pb.degen), " ")}</td>`;
		html += `</tr>`;
	}
	html += `</table>`;
	return html;
}

function generateHtml(data)
{
	let html = generateHtmlTitle(data);

	let contString = null;
	if (data.continues) {
		contString = "Enabled";
	}
	else {
		contString = "Disabled";
	}
	html += `<h3>Continues ${contString} / ${data.totalWipes} Used</h3>`;

	html += generateHtmlKarma(data);
	for (b in BOSS) {
		html += generateHtmlBoss(data, BOSS[b]);
	}

	html += `<br><br><br><br><br>`;

	return html;
}

$(document).ready(function() {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has("id")) {
		const replayIdString = urlParams.get("id");
		const replayId = parseInt(replayIdString);
		const wc3statsReplayUrl = "https://api.wc3stats.com/replays/" + replayId.toString();
		console.log(wc3statsReplayUrl);
		$.get(wc3statsReplayUrl, function(data) {
			console.log(data);
			let replayData = parseWc3StatsReplayData(data);
			console.log(replayData);
			let html = generateHtml(replayData);
			document.getElementById("thinWrapper").innerHTML = html;
		});
	}
	else {
		console.error("Expected replay ID in URL");
	}
});
