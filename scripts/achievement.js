/*
achievement "hit" format:
{
	time: <unix # timestamp for when the achievement was earned>,
	replay: <replay where achievement was earned>
}

v2
{
	DIFFICULTY.VE: [
		veReplay1,
		veReplay2,
		...
	],
	DIFFICULTY.E: [],
	DIFFICULTY.M: [],
	DIFFICULTY.N: [
		nReplay1,
		nReplay2,
		nReplay3
	],
	DIFFICULTY.H: []
}
*/

function achievementWinDifficulty(playerSortedReplays, players, player, wc3Versions, difficulty)
{
	let replays = [];
	for (let i = playerSortedReplays.length - 1; i >= 0; i--) {
		const replay = playerSortedReplays[i];
		if (replay.win && replay.difficulty == difficulty && (wc3Versions == null || wc3Versions.includes(replay.wc3Version))) {
			replays.push(replay);
		}
	}
	return replays;
}

function achievementWin(playerSortedReplays, players, player, wc3Versions=null)
{
	let hits = {};
	for (const d in DIFFICULTY) {
		const diff = DIFFICULTY[d];
		hits[diff] = achievementWinDifficulty(playerSortedReplays, players, player, wc3Versions, diff);
	}
	return hits;
}

function achievementWinNoContinues(playerSortedReplays, players, player)
{
	const winHits = achievementWin(playerSortedReplays, players, player);

	let hits = {};
	for (const d in DIFFICULTY) {
		const diff = DIFFICULTY[d];
		hits[diff] = winHits[diff].filter(function(replay) {
			return !replay.continues || replay.totalWipes == 0;
		});
	}
	return hits;
}

function achievementWinNoDeaths(playerSortedReplays, players, player)
{
	const winHits = achievementWin(playerSortedReplays, players, player);

	let hits = {};
	for (const d in DIFFICULTY) {
		const diff = DIFFICULTY[d];
		hits[diff] = winHits[diff].filter(function(replay) {
			const ind = getPlayerIndexInReplay(replay, player, players);
			const deaths = replay.players[ind].statsOverall.deaths;
			return deaths == 0;
		});
	}
	return hits;
}

function achievementWinNoClasses(playerSortedReplays, players, player, whichClasses)
{
	const winHits = achievementWin(playerSortedReplays, players, player);

	let hits = {};
	for (const d in DIFFICULTY) {
		const diff = DIFFICULTY[d];
		hits[diff] = winHits[diff].filter(function(replay) {
			for (let i = 0; i < replay.players.length; i++) {
				if (whichClasses.includes(replay.players[i].class)) {
					return false;
				}
			}
			return true;
		});
	}
	return hits;
}

function achievementWinAllClasses(playerSortedReplays, players, player)
{
	const winHits = achievementWin(playerSortedReplays, players, player);

	let classWinMap = {};
	for (const c in CLASS) {
		classWinMap[CLASS[c]] = [];
	}
	for (const d in DIFFICULTY) {
		const diff = DIFFICULTY[d];
		for (let i = 0; i < winHits[diff].length; i++) {
			const replay = winHits[diff][i];
			const ind = getPlayerIndexInReplay(replay, player, players);
			const c = replay.players[ind].class;
			if (!(c in classWinMap)) {
				throw `Unknown class ${c}`;
			}
			classWinMap[c].push(replay);
		}
	}

	let hits = {};
	for (const d in DIFFICULTY) {
		hits[DIFFICULTY[d]] = [];
	}
	for (let i = DIFFICULTIES_SORTED.length - 1; i >= 0; i--) {
		const diff = DIFFICULTIES_SORTED[i];
		let allWin = true;
		let winReplays = [];
		for (const c in CLASS) {
			let found = false;
			for (let j = 0; j < classWinMap[CLASS[c]].length; j++) {
				const replay = classWinMap[CLASS[c]][j];
				if (compareDifficulties(replay.difficulty, diff) >= 0) { // replay.difficulty >= diff
					found = true;
					winReplays.push(replay);
					break;
				}
			}
			if (!found) {
				allWin = false;
				break;
			}
		}
		if (allWin) {
			winReplays.sort(function(r1, r2) {
				return r1.playedOn - r2.playedOn;
			});
			hits[diff].push(winReplays[winReplays.length - 1]);
			return hits;
		}
	}
	return hits;
}

function achievementAK47(playerSortedReplays, players, player)
{
	let hits = {};
	for (const d in DIFFICULTY) {
		const diff = DIFFICULTY[d];
		hits[diff] = [];
		for (let i = playerSortedReplays.length - 1; i >= 0; i--) {
			const replay = playerSortedReplays[i];
			if (replay.difficulty !== diff) continue;

			const ind = getPlayerIndexInReplay(replay, player, players);
			for (const stats of Object.values(replay.players[ind].statsBoss)) {
				if (stats.addKills == 47) {
					hits[diff].push(replay);
					break;
				}
			}
		}
	}
	return hits;
}

function getPlayerAchievementHits(playerSortedReplays, players, player)
{
	let achievementHits = {};
	for (const a in ACHIEVEMENTS) {
		achievementHits[a] = ACHIEVEMENTS[a].condition(playerSortedReplays, players, player);
	}
	return achievementHits;
}

const ACHIEVEMENTS = {
	"Win": {
		description: "Win the game.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWin(playerSortedReplays, players, player);
		}
	},
	"Win (M16)": {
		hideTemp: true,
		hideUnachieved: true,
		description: "Win the game on M16 servers.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWin(playerSortedReplays, players, player, [WC3_VERSION.V1_28]);
		}
	},
	"Win (ENT)": {
		hideUnachieved: true,
		description: "Win the game on ENT servers.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWin(playerSortedReplays, players, player, [WC3_VERSION.V1_30]);
		}
	},
	"Win (Battle.net)": {
		hideUnachieved: true,
		description: "Win the game on Battle.net.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWin(playerSortedReplays, players, player, [WC3_VERSION.V1_3x, WC3_VERSION.V2_x]);
		}
	},
	"No Second Chances": {
		hideTemp: true,
		description: "Win the game without using continues.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinNoContinues(playerSortedReplays, players, player);
		}
	},
	"Ace": {
		hideTemp: true,
		description: "Win the game without dying.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinNoDeaths(playerSortedReplays, players, player);
		}
	},
	"AK-47": {
		hideTemp: true,
		description: "Get 47 add kills in a boss fight.",
		condition: achievementAK47,
	},
	"Sacrilege!": {
		description: "Win the game without a Priest.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinNoClasses(playerSortedReplays, players, player, [CLASS.PRIEST]);
		}
	},
	"Depraved": {
		description: "Win the game without a Priest or Paladin.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinNoClasses(playerSortedReplays, players, player, [CLASS.PALADIN, CLASS.PRIEST]);
		}
	},
	"Defenseless": {
		description: "Win the game without a Warrior.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinNoClasses(playerSortedReplays, players, player, [CLASS.WARRIOR]);
		}
	},
	"Brawl": {
		description: "Win the game with only melee classes.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinNoClasses(playerSortedReplays, players, player, [CLASS.DRUID, CLASS.FM, CLASS.IM, CLASS.PRIEST, CLASS.RANGER, CLASS.WARLOCK]);
		}
	},
	"Kite": {
		description: "Win the game with only ranged classes.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinNoClasses(playerSortedReplays, players, player, [CLASS.DK, CLASS.DRUID, CLASS.PALADIN, CLASS.ROGUE, CLASS.WARRIOR]);
		}
	},
	"Classy": {
		description: "Win the game with all classes.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinAllClasses(playerSortedReplays, players, player);
		}
	},
};
