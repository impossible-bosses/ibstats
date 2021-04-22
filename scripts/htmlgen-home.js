let replays_ = null;
let players_ = null;

const TOP_N = 3;

function generateHtmlBossTopStat(replaysDescending, players, boss, stat)
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
		for (let j = 0; j < replay.players.length; j++) {
			const playerData = replay.players[j];
			const value = playerData.statsBoss[boss][stat];
			if (value != null) {
				difficultyStats[replay.difficulty].push({
					replayId: replay.id,
					playedOn: replay.playedOn,
					player: getPlayerFromAlias(players, playerData.name),
					class: playerData.class,
					value: value
				});
			}
		}
	}

	for (const d in DIFFICULTY) {
		difficultyStats[DIFFICULTY[d]].sort(function(s1, s2) {
			if (s1.value == s2.value) {
				return s1.playedOn - s2.playedOn;
			}
			return s2.value - s1.value;
		});
	}

	let html = "";
	html += `<table class="tableTopStat">`;
	html += `<thead><tr><th class="columnRank"></th>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		html += `<th>${DIFFICULTIES_SORTED[i]}</th>`;
	}
	html += `</tr></thead>`;
	html += `<tbody>`;
	for (let i = 0; i < TOP_N; i++) {
		html += `<tr class="${i % 2 == 1 ? "rowLighter" : ""}">`;
		html += `<td class="columnRank"><p>#${i + 1}</p></td>`;
		for (let j = 0; j < DIFFICULTIES_SORTED.length; j++) {
			const d = DIFFICULTIES_SORTED[j];
			if (i >= difficultyStats[d].length) {
				html += `<td>-</td>`;
				continue;
			}
			const s = difficultyStats[d][i];
			const iconPath = classToIconPath(s.class, ".");
			const valueString = numberSeparateThousands(Math.round(s.value), " ");
			html += `<td>`;
			html += `<div class="topPlayer">`;
			html += `<div class="topPlayerName">${s.player}</div>`;
			html += `<div class="topPlayerImage"><img src="${iconPath}"/></div>`;
			html += `<div class="topPlayerValue"><a href="game?id=${s.replayId}">${valueString}</a></div>`;
			html += `</div>`; // topPlayer
			html += `</td>`;
		}
		html += `</tr>`;
	}
	html += `</tbody>`;
	html += `</table>`;
	html += `<p class="temp">TODO: button to expand list, maybe to 10 rows...</p>`;
	return html;
}

function generateHtmlBoss(replaysDescending, players, boss)
{
	let difficultyReplays = {};
	for (const d in DIFFICULTY) {
		difficultyReplays[DIFFICULTY[d]] = [];
	}
	for (let i = 0; i < replaysDescending.length; i++) {
		const replay = replaysDescending[i];
		if (replay.bossKills == null) {
			continue;
		}
		if (!isBossInDifficulty(boss, replay.difficulty)) {
			continue;
		}
		difficultyReplays[replay.difficulty].push(replay);
	}

	for (const d in DIFFICULTY) {
		difficultyReplays[DIFFICULTY[d]].sort(function(r1, r2) {
			const t1 = replayGetBossKillTime(r1, boss);
			const t2 = replayGetBossKillTime(r2, boss);
			if (t1 == null && t2 == null) {
				return 0;
			}
			else if (t1 == null) {
				return 1;
			}
			else if (t2 == null) {
				return -1;
			}
			if (t1 == t2) {
				return r1.playedOn - r2.playedOn;
			}
			return t1 - t2;
		});
	}

	let html = "";

	html += `<h3>Fastest Kills</h3>`;
	html += `<table class="tableTopStat tableFastestKills">`;
	html += `<thead><tr><th class="columnRank"></th>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		html += `<th>${DIFFICULTIES_SORTED[i]}</th>`;
	}
	html += `</tr></thead>`;
	html += `<tbody>`;
	for (let i = 0; i < TOP_N; i++) {
		html += `<tr class="${i % 2 == 1 ? "rowLighter" : ""}">`;
		html += `<td class="columnRank">#${i + 1}</td>`;
		for (let j = 0; j < DIFFICULTIES_SORTED.length; j++) {
			const d = DIFFICULTIES_SORTED[j];
			if (i >= difficultyReplays[d].length) {
				html += `<td>-</td>`;
				continue;
			}
			const replay = difficultyReplays[d][i];
			const time = replayGetBossKillTime(replay, boss);
			if (time == null) {
				html += `<td>-</td>`;
			}
			else {
				html += `<td><a href="game?id=${replay.id}">${secondsToTimestamp(time)}</a></td>`;
			}
		}
		html += `</tr>`;
	}
	html += `</tbody>`;
	html += `</table>`;
	html += `<p class="temp">TODO: button to expand list, maybe to 10 rows...</p>`;

	html += `<h3>Top Damage</h3>`;
	html += generateHtmlBossTopStat(replaysDescending, players, boss, "dmg");

	html += `<h3>Top Healing</h3>`;
	html += generateHtmlBossTopStat(replaysDescending, players, boss, "hl");

	html += `<h3>Top Degen</h3>`;
	html += generateHtmlBossTopStat(replaysDescending, players, boss, "degen");

	return html;
}

function generateHtmlReplayInsideTr(replay)
{
	const versionString = mapVersionToString(replay.mapVersion);
	const hostServerString = wc3VersionToHostingServer(replay.wc3Version);
	const date = new Date(replay.playedOn * 1000);
	const dateString = date.toLocaleDateString();

	let html = "";
	if (replay.mapVersion >= MAP_VERSION.V1_11_4) {
		const diffString = difficultyToShortString(replay.difficulty);
		const maxBosses = getDifficultyMaxBosses(replay.difficulty);

		html += `<td class="alignCenter"><a href="game?id=${replay.id}">${replay.name}</a></td>`;
		html += `<td>${replay.players.length}</td>`;
		html += `<td>${diffString}</td>`;
		html += `<td>${replay.win ? maxBosses : replay.bossKills}/${maxBosses}</td>`;
		html += `<td>${replay.totalWipes}</td>`;
	}
	else {
		html += `<td class="alignCenter">${replay.name}</td>`;
		html += `<td>-</td>`;
		html += `<td>-</td>`;
		html += `<td>-</td>`;
		html += `<td>-</td>`;
	}
	html += `<td>${versionString}</td>`;
	html += `<td>${hostServerString}</td>`;
	html += `<td>${dateString}</td>`;
	return html;
}

function generateHtmlPlayerInsideTr(replays, players, player, games)
{
	let wins = 0;
	let winsN = 0;
	let winsH = 0;
	for (let i = 0; i < games.length; i++) {
		const replay = replays[games[i]];
		if (replay.win) {
			wins++;
			if (replay.difficulty == DIFFICULTY.N) {
				winsN++;
			}
			if (replay.difficulty == DIFFICULTY.H) {
				winsH++;
			}
		}
	}
	const winsPercentage = Math.round(wins / games.length * 100);

	let html = "";
	html += `<td class="alignCenter"><a href="player?name=${encodeURIComponent(player)}">${player}</a></td>`;
	html += `<td>${games.length}</td>`;
	html += `<td>${wins}</td>`;
	html += `<td>${winsN}</td>`;
	html += `<td>${winsH}</td>`;
	return html;
}

function generateHtml(replays, players)
{
	let html = ``;
	html += `<h1>Impossible Bosses</h1>`;
	html += `<div class="thinWrapper">`;

	html += `<div class="tabSection">`;
	html += `<div class="tabSelector ts0 active">Leaderboards</div>`;
	html += `<div class="tabSelector ts1">Players</div>`;
	html += `<div class="tabSelector ts2">Match History</div>`;
	html += `</div>`; // tabSection

	html += `<hr class="big">`;

	html += `<p class="temp">Welcome! This is a work in progress - some things still look janky, and many things are bound to change. If you see anything you don't like, or want to see more of something, or have any other suggestions, just PM Patio. Also, don't try looking at this site on a phone yet, it will be bad :)</p>`;
	html += `<p class="temp"><b>NOTE:</b> To avoid spamming wc3stats with requests for now, new replays aren't automatically added to the stats set - updating the games list requires manual intervention. If you uploaded a game and it's not listed yet, just let Patio know.</p>`;
	html += `</div>`; // thinWrapper

	const playerGamesMap = getPlayerGamesMap(replays, players);
	let replaysDescending = [];
	for (const id in replays) {
		if (replays[id] != null) {
			replaysDescending.push(replays[id]);
		}
	}
	replaysDescending.sort(function(r1, r2) {
		return r2.playedOn - r1.playedOn;
	});

	// Leaderboards section
	html += `<div class="tabContent tc0 active">`;
	html += `<div class="thinWrapper">`;
	html += `<h1>Leaderboards</h1>`;

	html += `<h2>Achievements</h2>`;
	let sortedAchievementDifficultyPlayerReplays = {};
	for (const a in ACHIEVEMENTS) {
		sortedAchievementDifficultyPlayerReplays[a] = {};
		for (const d in DIFFICULTY) {
			sortedAchievementDifficultyPlayerReplays[a][DIFFICULTY[d]] = [];
		}
	}
	for (const player in playerGamesMap) {
		const sortedReplays = getPlayerSortedReplays(replays, players, player);
		const hits = getPlayerAchievementHits(sortedReplays, players, player);
		for (const a in ACHIEVEMENTS) {
			for (const d in DIFFICULTY) {
				const diff = DIFFICULTY[d];
				for (let i = 0; i < hits[a][diff].length; i++) {
					sortedAchievementDifficultyPlayerReplays[a][diff].push({
						player: player,
						replay: hits[a][diff][i]
					});
				}
			}
		}
	}
	for (const a in ACHIEVEMENTS) {
		let difficultyFirstPlayerReplays = {};
		for (const d in DIFFICULTY) {
			const diff = DIFFICULTY[d];
			sortedAchievementDifficultyPlayerReplays[a][diff].sort(function(e1, e2) {
				return e1.replay.playedOn - e2.replay.playedOn;
			});

			const playerReplays = sortedAchievementDifficultyPlayerReplays[a][diff];
			let firstPlayerReplays = [];
			let firstReplay = null;
			for (let i = 0; i < playerReplays.length; i++) {
				const replay = playerReplays[i].replay;
				if (firstReplay == null) {
					firstReplay = replay;
				}
				if (replay.playedOn == firstReplay.playedOn) {
					if (replay != firstReplay) {
						console.error(`Achievement ${a} was first in different replays`);
						continue;
					}
					firstPlayerReplays.push({
						player: playerReplays[i].player,
						replay: replay
					});
				}
			}
			difficultyFirstPlayerReplays[diff] = firstPlayerReplays;
		}
		html += generateHtmlAchievement(a, difficultyFirstPlayerReplays, ".");
	}
	html += `</div>`; // thinWrapper
	html += `<br><br><br><br>`;

	let left = true;
	for (let i = 0; i < BOSSES_SORTED.length; i++) {
		const boss = BOSSES_SORTED[i];
		let innerHtml = generateHtmlBoss(replaysDescending, players, boss);
		html += generateHtmlBossFrame(boss, left, "", innerHtml, ".");
		left = !left;
	}
	html += `</div>`; // tab

	// Players section
	html += `<div class="tabContent tc1">`;
	html += `<div class="thinWrapper">`;
	html += `<h1>Players</h1>`

	let playerGamesSorted = [];
	for (const player in playerGamesMap) {
		playerGamesSorted.push({
			player: player,
			games: playerGamesMap[player]
		});
	}
	playerGamesSorted.sort(function(e1, e2) {
		return e2.games.length - e1.games.length;
	});

	html += `<table class="tablePlayers">`;
	html += `<thead>`;
	html += `<tr><th class="alignCenter">Player</th><th>Games Played</th><th>Wins</th><th>Wins (N)</th><th>Wins (H)</th></tr>`;
	html += `</thead>`;
	html += `<tbody>`;
	for (let i = 0; i < playerGamesSorted.length; i++) {
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = "rowLighter";
		}
		html += `<tr class="${rowLighterOrNot}">`;
		html += generateHtmlPlayerInsideTr(replays, players, playerGamesSorted[i].player, playerGamesSorted[i].games);
		html += `</tr>`;
	}
	html += `</tbody>`;
	html += `</table>`;
	html += `</div>`; // thinWrapper
	html += `</div>`; // tab

	// Games section
	html += `<div class="tabContent tc2">`;
	html += `<div class="thinWrapper">`;
	html += `<h1>Match History</h1>`;
	html += `<table class="tableGames">`;
	html += `<thead>`;
	html += `<tr><th class="alignCenter" style="width: 200pt;">Game Name</th><th>Players</th><th>Difficulty</th><th>Boss Kills</th><th>Continues</th><th>Version</th><th>Server</th><th>Date</th></tr>`;
	html += `</thead>`;
	html += `<tbody>`;
	let index = 0;
	for (let i = 0; i < replaysDescending.length; i++) {
		const replay = replaysDescending[i];
		if (replay.mapVersion >= MAP_VERSION.V1_11_4 && replay.bossKills == null) {
			continue;
		}
		html += `<tr class="${replay.win ? "win" : "lose"}">`;
		html += generateHtmlReplayInsideTr(replay);
		html += `</tr>`;
		index++;
	}
	html += `</tbody>`;
	html += `</table>`;
	html += `</div>`; // thinWrapper
	html += `</div>`; // tab

	html += `<br><br><br><br><br>`;

	return html;
}

function generateHtmlFromGlobals()
{
	let html = generateHtml(replays_, players_);
	document.getElementById("everything").innerHTML = html;
	registerTabs();
	registerCollapsibles();
}

$(document).ready(function() {
	$.get("./data/replays.json", function(data) {
		replays_ = data;
		if (players_ != null) {
			generateHtmlFromGlobals();
		}
	});

	$.get("./data/players.json", function(data) {
		players_ = data;
		if (replays_ != null) {
			generateHtmlFromGlobals();
		}
	});
});
