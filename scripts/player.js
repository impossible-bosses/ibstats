function getPlayerAliases(players, player)
{
	for (let i = 0; i < players.length; i++) {
		if (players[i].name == player) {
			return players[i].aliases;
		}
	}
	return [];
}

function getPlayerIndexInReplay(replay, player, players)
{
	let names = [player];
	for (let i = 0; i < players.length; i++) {
		if (players[i].name == player) {
			names.push(...players[i].aliases);
		}
	}

	for (let i = 0; i < replay.players.length; i++) {
		if (names.indexOf(replay.players[i].name) != -1) {
			return i;
		}
	}
	return -1;
}

function getPlayerFromAlias(players, alias)
{
	for (let i = 0; i < players.length; i++) {
		for (let j = 0; j < players[i].aliases.length; j++) {
			if (players[i].aliases[j] == alias) {
				return players[i].name;
			}
		}
	}
	return alias;
}

function getPlayerGamesMap(replays, players)
{
	// Players section
	let playerAliasMap = {};
	for (let i = 0; i < players.length; i++) {
		const playerName = players[i].name;
		for (let j = 0; j < players[i].aliases.length; j++) {
			const alias = players[i].aliases[j];
			if (alias in playerAliasMap) {
				throw `Duplicate player alias ${alias} for in player ${playerName}`;
			}
			playerAliasMap[alias] = playerName
		}
	}

	let playerGamesMap = {};
	for (const id in replays) {
		const replay = replays[id];
		if (replay == null) {
			continue;
		}

		for (let i = 0; i < replay.players.length; i++) {
			let playerName = replay.players[i].name;
			if (playerName in playerAliasMap) {
				playerName = playerAliasMap[playerName];
			}
			if (!(playerName in playerGamesMap)) {
				playerGamesMap[playerName] = [];
			}
			playerGamesMap[playerName].push(id);
		}
	}

	return playerGamesMap;
}

function getPlayerSortedReplays(replays, players, player)
{
	const playerGamesMap = getPlayerGamesMap(replays, players);
	const games = playerGamesMap[player] || [];

	let sortedReplays = [];
	for (let i = 0; i < games.length; i++) {
		sortedReplays.push(replays[games[i]]);
	}
	sortedReplays.sort(function(r1, r2) {
		return r1.playedOn < r2.playedOn;
	});

	return sortedReplays;
}

/*
achievement "hit" format:
{
	time: <unix # timestamp for when the achievement was earned>,
	replay: <replay where achievement was earned>
}
*/

function achievementWinDifficultyWc3Version(playerSortedReplays, players, player, difficulty, wc3Version=null)
{
	let hits = [];
	for (let i = playerSortedReplays.length - 1; i >= 0; i--) {
		const replay = playerSortedReplays[i];
		if (replay.win && replay.difficulty == difficulty && (wc3Version == null || replay.wc3Version == wc3Version)) {
			hits.push({
				time: replay.playedOn,
				replay: replay
			});
		}
	}
	return hits;
}

function achievementWinDifficultyNoContinues(playerSortedReplays, players, player, difficulty)
{
	const winHits = achievementWinDifficultyWc3Version(playerSortedReplays, players, player, difficulty);
	let hits = [];
	for (let i = 0; i < winHits.length; i++) {
		const replay = winHits[i].replay;
		if (!replay.continues || replay.totalWipes == 0) {
			hits.push({
				time: winHits[i].time,
				replay: replay
			});
		}
	}
	return hits;
}

function achievementWinDifficultyNoDeaths(playerSortedReplays, players, player, difficulty)
{
	const winHits = achievementWinDifficultyWc3Version(playerSortedReplays, players, player, difficulty);
	let hits = [];
	for (let i = 0; i < winHits.length; i++) {
		const replay = winHits[i].replay;
		const ind = getPlayerIndexInReplay(replay, player, players);
		const deaths = replay.players[ind].statsOverall.deaths;
		if (replay.win && replay.difficulty == difficulty && deaths == 0) {
			hits.push({
				time: winHits[i].time,
				replay: replay
			});
		}
	}
	return hits;
}

function achievementWinDifficultyAllClasses(playerSortedReplays, players, player, difficulty)
{
	let classWinMap = {};
	for (const c in CLASS) {
		classWinMap[CLASS[c]] = false;
	}
	const winHits = achievementWinDifficultyWc3Version(playerSortedReplays, players, player, difficulty);
	for (let i = 0; i < winHits.length; i++) {
		const replay = winHits[i].replay;
		const ind = getPlayerIndexInReplay(replay, player, players);
		const c = replay.players[ind].class;
		if (!(c in classWinMap)) {
			throw "Unknown class ${c}";
		}
		classWinMap[c] = true;

		let allWins = true;
		for (const c2 in classWinMap) {
			if (!classWinMap[c2]) {
				allWins = false;
				break;
			}
		}
		if (allWins) {
			return [{
				time: replay.playedOn,
				replay: replay
			}];
		}
	}
	return [];
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
	"Win (Normal)": {
		description: "Win the game on Normal difficulty.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.N);
		}
	},
	"Win (Hard)": {
		description: "Win the game on Hard difficulty.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.H);
		}
	},
	"No Second Chances (Normal)": {
		description: "Win the game on Normal difficulty without using continues.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyNoContinues(playerSortedReplays, players, player, DIFFICULTY.N);
		}
	},
	"No Second Chances (Hard)": {
		description: "Win the game on Hard difficulty without using continues.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyNoContinues(playerSortedReplays, players, player, DIFFICULTY.H);
		}
	},
	"Ace (Normal)": {
		description: "Win the game on Normal difficulty without dying.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyNoDeaths(playerSortedReplays, players, player, DIFFICULTY.N);
		}
	},
	"Ace (Hard)": {
		description: "Win the game on Hard difficulty without dying.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyNoDeaths(playerSortedReplays, players, player, DIFFICULTY.H);
		}
	},
	"Swiss Army Knife (Normal)": {
		description: "Win the game on Normal difficulty with all classes.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyAllClasses(playerSortedReplays, players, player, DIFFICULTY.N);
		}
	},
	"Swiss Army Knife (Hard)": {
		description: "Win the game on Hard difficulty with all classes.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyAllClasses(playerSortedReplays, players, player, DIFFICULTY.H);
		}
	},
};
