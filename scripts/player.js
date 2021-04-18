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
		return r2.playedOn - r1.playedOn;
	});

	return sortedReplays;
}
