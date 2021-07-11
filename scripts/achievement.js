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

function achievementWinDifficulty(playerSortedReplays, players, player, wc3Version, difficulty)
{
	let replays = [];
	for (let i = playerSortedReplays.length - 1; i >= 0; i--) {
		const replay = playerSortedReplays[i];
		if (replay.win && replay.difficulty == difficulty && (wc3Version == null || replay.wc3Version == wc3Version)) {
			replays.push(replay);
		}
	}
	return replays;
}

function achievementWin(playerSortedReplays, players, player, wc3Version=null)
{
	let hits = {};
	for (const d in DIFFICULTY) {
		const diff = DIFFICULTY[d];
		hits[diff] = achievementWinDifficulty(playerSortedReplays, players, player, wc3Version, diff);
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
			return achievementWin(playerSortedReplays, players, player, WC3_VERSION.V1_28);
		}
	},
	"Win (ENT)": {
		hideUnachieved: true,
		description: "Win the game on ENT servers.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWin(playerSortedReplays, players, player, WC3_VERSION.V1_30);
		}
	},
	"Win (Battle.net)": {
		hideUnachieved: true,
		description: "Win the game on Battle.net.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWin(playerSortedReplays, players, player, WC3_VERSION.V1_32);
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
	"Classy": {
		description: "Win the game with all classes.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinAllClasses(playerSortedReplays, players, player);
		}
	},
};
