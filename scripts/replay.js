const DIFFICULTY = {
	VE: "Very Easy",
	E: "Easy",
	M: "Moderate",
	N: "Normal",
	H: "Hard",
};
const DIFFICULTIES_SORTED = [
	DIFFICULTY.VE,
	DIFFICULTY.E,
	DIFFICULTY.M,
	DIFFICULTY.N,
	DIFFICULTY.H
];

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
const BOSSES_SORTED = [
	BOSS.FIRE,
	BOSS.WATER,
	BOSS.BRUTE,
	BOSS.THUNDER,
	BOSS.DRUID,
	BOSS.SHADOW,
	BOSS.ICE,
	BOSS.LIGHT,
	BOSS.ANCIENT,
	BOSS.DEMONIC
];
let BOSS_COLORS = {};
BOSS_COLORS[BOSS.FIRE] = "#FF8000";
BOSS_COLORS[BOSS.WATER] = "#0000A0";
BOSS_COLORS[BOSS.BRUTE] = "#804000";
BOSS_COLORS[BOSS.THUNDER] = "#80FFFF";
BOSS_COLORS[BOSS.DRUID] = "#A2F4AC";
BOSS_COLORS[BOSS.SHADOW] = "#808080";
BOSS_COLORS[BOSS.ICE] = "#004080";
BOSS_COLORS[BOSS.LIGHT] = "#FFFF80";
BOSS_COLORS[BOSS.ANCIENT] = "#FFFF00";
BOSS_COLORS[BOSS.DEMONIC] = "#800000";

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
const CLASSES_SORTED = [
	CLASS.DK,
	CLASS.DRUID,
	CLASS.FM,
	CLASS.IM,
	CLASS.PALADIN,
	CLASS.PRIEST,
	CLASS.RANGER,
	CLASS.ROGUE,
	CLASS.WARLOCK,
	CLASS.WARRIOR
];
let CLASS_COLORS = {};
CLASS_COLORS[CLASS.DK] = "#4f5ca1";
CLASS_COLORS[CLASS.DRUID] = "#33ff00";
CLASS_COLORS[CLASS.FM] = "#ff5e00";
CLASS_COLORS[CLASS.IM] = "#00eaff";
CLASS_COLORS[CLASS.PALADIN] = "#f7df00";
CLASS_COLORS[CLASS.PRIEST] = "#feffed";
CLASS_COLORS[CLASS.RANGER] = "#6e945d";
CLASS_COLORS[CLASS.ROGUE] = "#a1745a";
CLASS_COLORS[CLASS.WARLOCK] = "#C981CF";
CLASS_COLORS[CLASS.WARRIOR] = "#5e5e5e";

const MAP_VERSION = {
	V1_10_5: 0,
	V1_11_1: 1,
	V1_11_2: 2,
	V1_11_4: 4,
	V1_11_5: 5,
	V1_11_6: 6,
	V1_11_7: 7,
	V1_11_8: 8,
	V1_11_9: 9,
	V1_11_20: 20,
	V1_11_21: 21,
	V1_11_22: 22,
	V1_12_0: 1120,
	V1_12_1: 1121,
	V1_12_2: 1122,
	V1_12_3: 1123,
};

const WC3_VERSION = {
	V1_28: 128,
	V1_30: 130,
	V1_3x: 30,
	V2_x: 2,
};

function stringToEnum(str, enumObject)
{
	for (k in enumObject) {
		if (str == enumObject[k]) {
			return enumObject[k];
		}
	}
	return null;
}

function compareDifficulties(d1, d2)
{
	const ind1 = DIFFICULTIES_SORTED.indexOf(d1);
	if (ind1 == -1) {
		throw `Invalid difficulty ${d1}`;
	}
	const ind2 = DIFFICULTIES_SORTED.indexOf(d2);
	if (ind2 == -1) {
		throw `Invalid difficulty ${d2}`;
	}
	return ind1 - ind2;
}

function mapFileToVersion(file)
{
	if (file == "Impossible.Bosses.v1.10.5.w3x" || file == "Impossible.Bosses.v1.10.5 (1).w3x" || file == "Impossible.Bosses.v1.10.5-ent.w3x" || file == "Impossible.Bosses.v1.10.5_1.28Fix.w3x") {
		return MAP_VERSION.V1_10_5;
	}
	else if (file == "Impossible.Bosses.v1.11.1-ent.w3x") {
		return MAP_VERSION.V1_11_1;
	}
	else if (file == "Impossible.Bosses.v1.11.2-ent.w3x") {
		return MAP_VERSION.V1_11_2;
	}
	else if (file == "Impossible.Bosses.v1.11.4-ent.w3x" || file == "Impossible.Bosses.v1.11.4-nobnet.w3x") {
		return MAP_VERSION.V1_11_4;
	}
	else if (file == "Impossible.Bosses.v1.11.5-no-bnet.w3x") {
		return MAP_VERSION.V1_11_5;
	}
	else if (file == "Impossible.Bosses.v1.11.6.w3x" || file == "Impossible.Bosses.v1.11.6-no-bnet.w3x") {
		return MAP_VERSION.V1_11_6;
	}
	else if (file == "Impossible.Bosses.v1.11.7.w3x" || file == "Impossible.Bosses.v1.11.7-no-bnet.w3x") {
		return MAP_VERSION.V1_11_7;
	}
	else if (file == "Impossible.Bosses.v1.11.8.w3x" || file == "Impossible.Bosses.v1.11.8-no-bnet.w3x") {
		return MAP_VERSION.V1_11_8;
	}
	else if (file == "Impossible.Bosses.v1.11.9.w3x" || file == "Impossible.Bosses.v1.11.9-no-bnet.w3x") {
		return MAP_VERSION.V1_11_9;
	}
	else if (file == "Impossible.Bosses.v1.11.20.w3x" || file == "Impossible.Bosses.v1.11.20-no-bnet.w3x") {
		return MAP_VERSION.V1_11_20;
	}
	else if (file == "Impossible.Bosses.v1.11.21.w3x" || file == "Impossible.Bosses.v1.11.21-no-bnet.w3x") {
		return MAP_VERSION.V1_11_21;
	}
	else if (file == "Impossible.Bosses.v1.11.22.w3x" || file == "Impossible.Bosses.v1.11.22-no-bnet.w3x") {
		return MAP_VERSION.V1_11_22;
	}
	else if (file == "Impossible.Bosses.v1.12.0.w3x" || file == "Impossible.Bosses.v1.12.0-no-bnet.w3x") {
		return MAP_VERSION.V1_12_0;
	}
	else if (file == "Impossible.Bosses.v1.12.1.w3x" || file == "Impossible.Bosses.v1.12.1-no-bnet.w3x") {
		return MAP_VERSION.V1_12_1;
	}
	else if (file == "Impossible.Bosses.v1.12.2.w3x" || file == "Impossible.Bosses.v1.12.2-no-bnet.w3x") {
		return MAP_VERSION.V1_12_2;
	}
	else if (file == "Impossible.Bosses.v1.12.3.w3x" || file == "Impossible.Bosses.v1.12.3-no-bnet.w3x") {
		return MAP_VERSION.V1_12_3;
	}
	return null;
}

function majorVersionToWc3Version(v)
{
	if (v == 28) {
		return WC3_VERSION.V1_28;
	} else if (v == 30) {
		return WC3_VERSION.V1_30;
	} else if (v >= 10030 && v < 10040) {
		return WC3_VERSION.V1_3x;
	} else if (v >= 10100) {
	   return WC3_VERSION.V2_x;
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

function isBossInDifficulty(b, d)
{
	if (d == DIFFICULTY.VE && (b == BOSS.ANCIENT || b == BOSS.DEMONIC)) {
		return false;
	}
	if ((d == DIFFICULTY.E || d == DIFFICULTY.M) && b == BOSS.DEMONIC) {
		return false;
	}
	return true;
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

function classToIconPath(c, imagesPath)
{
	let path = imagesPath + "/images/";
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
	if (v == MAP_VERSION.V1_10_5) {
		return "1.10.5";
	}
	else if (v == MAP_VERSION.V1_11_1) {
		return "1.11.1";
	}
	else if (v == MAP_VERSION.V1_11_2) {
		return "1.11.2";
	}
	else if (v == MAP_VERSION.V1_11_4) {
		return "1.11.4";
	}
	else if (v == MAP_VERSION.V1_11_5) {
		return "1.11.5";
	}
	else if (v == MAP_VERSION.V1_11_6) {
		return "1.11.6";
	}
	else if (v == MAP_VERSION.V1_11_7) {
		return "1.11.7";
	}
	else if (v == MAP_VERSION.V1_11_8) {
		return "1.11.8";
	}
	else if (v == MAP_VERSION.V1_11_9) {
		return "1.11.9";
	}
	else if (v == MAP_VERSION.V1_11_20) {
		return "1.11.20";
	}
	else if (v == MAP_VERSION.V1_11_21) {
		return "1.11.21";
	}
	else if (v == MAP_VERSION.V1_11_22) {
		return "1.11.22";
	}
	else if (v == MAP_VERSION.V1_12_0) {
		return "1.12.0";
	}
	else if (v == MAP_VERSION.V1_12_1) {
		return "1.12.1";
	}
	else if (v == MAP_VERSION.V1_12_2) {
		return "1.12.2";
	}
	else if (v == MAP_VERSION.V1_12_3) {
		return "1.12.3";
	}
	throw `Unknown map version ${v}`;
}

function wc3VersionToHostingServer(v)
{
	if (v == WC3_VERSION.V1_28) {
		return "M16";
	}
	else if (v == WC3_VERSION.V1_30) {
		return "ENT";
	}
	else if (v == WC3_VERSION.V1_3x || v == WC3_VERSION.V2_x) {
		return "Battle.net";
	}
	throw `Unknown WC3 version ${v}`;
}

function parseWc3StatsPlayerStats(data)
{
	let playerStats = {
		deaths: data.deaths,
		dmg: data.damage,
		hl: data.healing,
		hlr: data.healingReceived,
		hlrSw: null,
		degen: data.degen,
		addKills: null,
		counterCast: null,
		counterHit: null,
	};

	if (data.hasOwnProperty("sWHealingReceived")) {
		// buggy, don't load
		// playerStats.hlrSw = data.sWHealingReceived;
	}
	if (data.hasOwnProperty("addkills")) {
		playerStats.addKills = data.addkills;
	}
	if (data.hasOwnProperty("countercast")) {
		playerStats.counterCast = data.countercast;
	}
	if (data.hasOwnProperty("counterhit")) {
		playerStats.counterHit = data.counterhit;
	}

	let allZero = true;
	for (const stat in playerStats) {
		if (playerStats[stat] != null && playerStats[stat] != 0) {
			allZero = false;
			break;
		}
	}
	if (allZero) {
		// Assume it's a leaver, set all data to null
		for (const stat in playerStats) {
			playerStats[stat] = null;
		}
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
		apm: data.apm,
		class: stringToEnum(mmdVars.class, CLASS),
		health: mmdVars.health,
		mana: mmdVars.mana,
		ability: mmdVars.ability,
		ms: mmdVars.movementSpeed,
		coins: mmdVars.coins,
		bossKills: 0,
		statsOverall: {
			deaths: 0,
			dmg: 0,
			hl: 0,
			hlr: 0,
			hlrSw: null,
			degen: 0,
			addKills: null,
			counterCast: null,
			counterHit: null,
		},
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
			for (k in playerData.statsOverall) {
				if (k in bossStats && bossStats[k] != null) {
					playerData.statsOverall[k] += bossStats[k];
				}
			}
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
		wc3Version: majorVersionToWc3Version(data.body.data.header.majorVersion),
		mapVersion: mapFileToVersion(game.map),
		host: game.host,
		length: data.body.length,
		playedOn: data.body.playedOn,
		win: false,
		difficulty: DIFFICULTY.VE,
		continues: false,
		players: [],
		bosses: {},
		bossKills: null,
		totalWipes: 0,
		remakeData: false,
		incomplete: false
	};

	if (replayData.wc3Version == null) {
		throw `Unknown WC3 version, major version ${data.body.data.header.majorVersion}`;
	}
	if (replayData.mapVersion == null) {
		throw `Unknown map version, file "${game.map}"`;
	}
	if (replayData.mapVersion < MAP_VERSION.V1_11_4) {
		// MMD unsupported before v1.11.4
		return replayData;
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
			else if (flagPlayer == null) {
				continue;
			}
			else if (flag != flagPlayer) {
				throw `Inconsistent flags: ${flag} and ${flagPlayer}`;
			}
		}

		const difficultyPlayer = player.variables.difficulty;
		if (difficulty == null) {
			difficulty = difficultyPlayer;
		}
		else if (difficultyPlayer == null) {
			continue;
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
		replayData.win = false;
		replayData.incomplete = true;
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
	let fireEngaged = false;
	let remake = false;
	for (let i = 0; i < game.events.length; i++) {
		const e = game.events[i];
		if (e.args.length != 1) {
			throw `Event with more than 1 arg: ${e}`;
		}
		const eName = e.event.eventName;
		const bossString = e.args[0].toLowerCase();
		const boss = stringToEnum(bossString, BOSS);
		if (boss == null) {
			if (bossString === "unknown" && eName === "bossWipe" && i === game.events.length - 1) {
				// Late enough wipe that the game thinks it's boss#11
				continue;
			}
			throw `Unrecognized boss in event: ${bossString}`;
		}

		if (replayData.difficulty == DIFFICULTY.VE && boss == BOSS.ANCIENT) {
			// Sneak peek Ancient intro, ignore
			continue;
		}
		if (boss == BOSS.FIRE && eName == "bossEngage") {
			if (fireEngaged) {
				remake = true;
				if (replayData.id == 119579) {
					// rewriting history. fire boss never happened...
					remake = false;
				}
			}
			fireEngaged = true;
		}
		if (remake) {
			if (eName == "bossKill") {
				replayData.remakeData = true;
				replayData.bosses[boss].startTimes = [];
				replayData.bosses[boss].wipeTimes = [];
				replayData.bosses[boss].killTime = null;
				for (let j = 0; j < replayData.players.length; j++) {
					for (const stat in replayData.players[j].statsOverall) {
						replayData.players[j].statsOverall[stat] = null;
					}
					for (const stat in replayData.players[j].statsBoss[boss]) {
						replayData.players[j].statsBoss[boss][stat] = null;
					}
				}
			}
			continue;
		}
		if (eName == "bossEngage") {
			if (replayData.bosses[boss].startTimes.indexOf(e.time) != -1) {
				throw `Duplicate boss engage event for ${boss}, time ${e.time}`;
			}
			replayData.bosses[boss].startTimes.push(e.time);
		}
		else if (eName == "bossKill") {
			replayData.bosses[boss].killTime = e.time;
		}
		else if (eName == "bossWipe") {
			if (replayData.id == 110991 && boss == BOSS.ANCIENT && replayData.bosses[boss].startTimes.length == 0) {
				// Bugged game, boss kill & wipe caused a fake Ancient wipe event
				continue;
			}
			if (replayData.bosses[boss].wipeTimes.indexOf(e.time) != -1) {
				throw `Duplicate boss wipe event for ${boss}, time ${e.time}`;
			}
			replayData.bosses[boss].wipeTimes.push(e.time);
			replayData.totalWipes += 1;
		}
		else {
			throw `Unrecognized event ${eName}`;
		}
	}
	for (b in BOSS) {
		const bossData = replayData.bosses[BOSS[b]];
		if (replayData.mapVersion >= MAP_VERSION.V1_11_6 && replayData.difficulty == DIFFICULTY.E && BOSS[b] == BOSS.ANCIENT && replayData.win && bossData.killTime == null) {
			// TODO known issue, no Ancient boss data after win on Easy
			continue;
		}

		let expectedWipeTimes = bossData.startTimes.length;
		if (bossData.killTime != null) {
			expectedWipeTimes -= 1;
		}
		if (bossData.wipeTimes.length != expectedWipeTimes) {
			if (replayData.difficulty == DIFFICULTY.M && BOSS[b] == BOSS.ANCIENT) {
				// Known issue, no Ancient boss data after win on Moderate.
			} else if (BOSS[b] == BOSS.DRUID && replayData.id === 225459) {
				bossData.killTime = 1119 - 60; // light engage minus 1min, just a guess
			} else if (BOSS[b] == BOSS.SHADOW && replayData.id === 342611) {
				// idk
			} else if (BOSS[b] == BOSS.DEMONIC && replayData.win && bossData.wipeTimes.length == expectedWipeTimes + 1) {
				// All good, it's possible to wipe before killing Demonic. Still counts as a win
				// Remove the last wipe so the site doens't display it.
				bossData.wipeTimes.pop();
			} else if (!(replayData.incomplete && bossData.wipeTimes.length == expectedWipeTimes - 1)) {
				throw `Unexpected # of wipe times for boss ${BOSS[b]}: ${bossData.wipeTimes.length}, expected ${expectedWipeTimes}`;
			}
		}
	}

	// You're welcome, Balth
	if (replayData.id == 119579) {
		replayData.win = true;
		replayData.players[0].class = CLASS.DK;
		replayData.players[1].class = CLASS.WARRIOR;
		replayData.players[2].class = CLASS.PRIEST;
		replayData.players[3].class = CLASS.DRUID;
		replayData.players[4].class = CLASS.FM;
		replayData.players[5].class = CLASS.IM;
		replayData.players[6].class = CLASS.WARLOCK;
		replayData.players[7].class = CLASS.WARLOCK;
		for (let i = 0; i < 8; i++) {
			replayData.players[i].health = null;
			replayData.players[i].mana = null;
			replayData.players[i].ability = null;
			replayData.players[i].ms = null;
			replayData.players[i].coins = null;
		}
	}

	return replayData;
}

function isValidReplay(replay)
{
	return replay.ladder != null && replay.season != null && !replay.isVoid && replay.players.length > 1;
}

function replayGetBossKillTime(replay, boss)
{
	if (!(boss in replay.bosses)) {
		return null;
	}
	const bossData = replay.bosses[boss];
	if (bossData.killTime == null) {
		return null;
	}
	return bossData.killTime - bossData.startTimes[bossData.startTimes.length - 1];
}

if (typeof window === 'undefined') {
	// Exports for node.js
	module.exports = {
		parseWc3StatsReplayData: parseWc3StatsReplayData,
		isValidReplay: isValidReplay
	};
}

function toReplayListDescending(replays)
{
	let replaysDescending = [];
	for (const id in replays) {
		if (replays[id] != null) {
			replaysDescending.push(replays[id]);
		}
	}
	replaysDescending.sort(function(r1, r2) {
		return r2.playedOn - r1.playedOn;
	});
	return replaysDescending;
}
