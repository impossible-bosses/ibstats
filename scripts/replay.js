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
	V1_10_5: 0,
	V1_11_1: 1,
	V1_11_2: 2,
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
		length: data.body.length,
		playedOn: data.body.playedOn,
		win: false,
		difficulty: DIFFICULTY.VE,
		continues: false,
		players: [],
		bosses: {},
		bossKills: null,
		totalWipes: 0,
		incomplete: false
	};

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
	let remake = false;
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
		if (boss == BOSS.FIRE && eName == "bossEngage") {
			if (remake) {
				// In-game remake, skip remaining events
				break;
			}
			remake = true;
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
		if (replayData.mapVersion == MAP_VERSION.V1_11_6 && replayData.difficulty == DIFFICULTY.E
			&& BOSS[b] == BOSS.ANCIENT && replayData.win && bossData.killTime == null) {
			// TODO known issue, no Ancient boss data after win on Easy
			continue;
		}

		let expectedWipeTimes = bossData.startTimes.length;
		if (bossData.killTime != null) {
			expectedWipeTimes -= 1;
		}
		if (bossData.wipeTimes.length != expectedWipeTimes) {
			if (!(replayData.incomplete && bossData.wipeTimes.length == expectedWipeTimes - 1)) {
				throw `Unexpected # of wipe times for boss ${BOSS[b]}: ${bossData.wipeTimes.length}, expected ${expectedWipeTimes}`;
			}
		}
	}

	return replayData;
}

function isValidReplay(replay)
{
	return replay.ladder != null && replay.season != null && !replay.isVoid && replay.players.length > 1;
}

module.exports = {
	parseWc3StatsReplayData: parseWc3StatsReplayData,
	isValidReplay: isValidReplay
};
