function statFunctionKillTime(replay, playerIndex, boss)
{
	return replayGetBossKillTime(replay, boss);
}

function statFunctionDps(replay, playerIndex, boss)
{
	const killTime = replayGetBossKillTime(replay, boss);
	if (killTime == null) {
		return null;
	}
	return replay.players[playerIndex].statsBoss[boss].dmg / killTime;
}

function statFunctionHps(replay, playerIndex, boss)
{
	const killTime = replayGetBossKillTime(replay, boss);
	if (killTime == null) {
		return null;
	}
	return replay.players[playerIndex].statsBoss[boss].hl / killTime;
}

function statFunctionDegen(replay, playerIndex, boss)
{
	return replay.players[playerIndex].statsBoss[boss].degen;
}

function statFunctionDegenPerSec(replay, playerIndex, boss)
{
	const killTime = replayGetBossKillTime(replay, boss);
	if (killTime == null) {
		return null;
	}
	return replay.players[playerIndex].statsBoss[boss].degen / killTime;
}

function statFunctionDeaths(replay, playerIndex, boss)
{
	return replay.players[playerIndex].statsBoss[boss].deaths;
}

function statFunctionAddKills(replay, playerIndex, boss)
{
	return replay.players[playerIndex].statsBoss[boss].addKills;
}

function getTopDifficultyStats(replaysDescending, players, boss, statFunction, descending)
{
	let difficultyStats = {};
	for (const d in DIFFICULTY) {
		difficultyStats[DIFFICULTY[d]] = [];
	}

	for (let i = 0; i < replaysDescending.length; i++) {
		const replay = replaysDescending[i];
		if (replay.bossKills == null) {
			continue;
		}
		if (!isBossInDifficulty(boss, replay.difficulty)) {
			continue;
		}
		if (players == null) {
			const value = statFunction(replay, null, boss);
			if (value != null) {
				difficultyStats[replay.difficulty].push({
					replayId: replay.id,
					playedOn: replay.playedOn,
					value: value
				});
			}
		}
		else {
			for (let j = 0; j < replay.players.length; j++) {
				const playerData = replay.players[j];
				const value = statFunction(replay, j, boss);
				if (value != null) {
					difficultyStats[replay.difficulty].push({
						replayId: replay.id,
						playedOn: replay.playedOn,
						value: value,
						player: getPlayerFromAlias(players, playerData.name),
						class: playerData.class
					});
				}
			}
		}
	}

	for (const d in DIFFICULTY) {
		difficultyStats[DIFFICULTY[d]].sort(function(s1, s2) {
			if (s1.value == s2.value) {
				return s1.playedOn - s2.playedOn;
			}
			if (descending) {
				return s2.value - s1.value;
			}
			else {
				return s1.value - s2.value;
			}
		});
	}

	return difficultyStats;
}