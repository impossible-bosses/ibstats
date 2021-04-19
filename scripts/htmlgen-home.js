let replays_ = null;
let players_ = null;

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
	html += `<h1>IB Stats</h1>`;
	html += `<hr class="big">`;

	html += `<div class="thinWrapper">`;
	html += `<p>To whoever is looking at this in the early stages: this is a work in progress - the priority at the moment is to play around with all the new data we have available after wc3stats/MMD support in v1.11+. For now, everything is in very simple, plain, and untrimmed table formats.</p>`;
	html += `<p><b>NOTE:</b> To avoid spamming wc3stats with requests for now, the recent games list doesn't automatically update; it must be manually updated. If you uploaded a game and it's not listed yet, just let Patio know.</p>`

	const playerGamesMap = getPlayerGamesMap(replays, players);

	// Leaderboards section
	html += `<h1>Leaderboards</h1>`;
	html += `<p>Coming soon - top damage, healing... coins? deaths? Also really need some more color in this page.</p>`;
	html += `<h2>Achievements</h2>`;
	let playerAchievementHits = {};
	for (const player in playerGamesMap) {
		const sortedReplays = getPlayerSortedReplays(replays, players, player);
		playerAchievementHits[player] = getPlayerAchievementHits(sortedReplays, players, player);
	}
	let sortedAchievementPlayerHits = {};
	for (a in ACHIEVEMENTS) {
		sortedAchievementPlayerHits[a] = [];
	}
	for (const player in playerAchievementHits) {
		for (a in playerAchievementHits[player]) {
			const hits = playerAchievementHits[player][a];
			for (let i = 0; i < hits.length; i++) {
				sortedAchievementPlayerHits[a].push({
					player: player,
					hit: hits[i]
				});
			}
		}
	}
	for (a in ACHIEVEMENTS) {
		sortedAchievementPlayerHits[a].sort(function(e1, e2) {
			return e1.hit.time - e2.hit.time;
		});

		const playerHits = sortedAchievementPlayerHits[a];
		let firstPlayerHits = [];
		let firstTime = 0;
		let firstReplay = null;
		for (let i = 0; i < playerHits.length; i++) {
			const hit = playerHits[i].hit;
			if (firstTime == 0) {
				firstTime = hit.time;
				firstReplay = hit.replay;
			}
			if (firstTime == hit.time) {
				if (firstReplay != hit.replay) {
					console.error(`Achievement ${a} first in different replays`);
					continue;
				}
				firstPlayerHits.push(playerHits[i]);
			}
		}

		html += generateHtmlAchievement(a, firstPlayerHits, ".");
	}

	// Players section
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

	html += `<h1>Players</h1>`;
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
		html += `<tr style="height: 28pt;" class="${rowLighterOrNot}">`;
		html += generateHtmlPlayerInsideTr(replays, players, playerGamesSorted[i].player, playerGamesSorted[i].games);
		html += `</tr>`;
	}
	html += `</tbody>`;
	html += `</table>`;

	// Games section
	let replaysDescending = [];
	for (const id in replays) {
		if (replays[id] != null) {
			replaysDescending.push(replays[id]);
		}
	}
	replaysDescending.sort(function(r1, r2) {
		return r2.playedOn - r1.playedOn;
	});

	html += `<h1>Recent Games</h1>`;
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
		let rowLighterOrNot = "";
		if (index % 2 == 1) {
			//rowLighterOrNot = "rowLighter";
		}
		html += `<tr class="${replay.win ? "win" : "lose"}">`;
		html += generateHtmlReplayInsideTr(replay);
		html += `</tr>`;
		index++;
	}
	html += `</tbody>`;
	html += `</table>`;
	html += `</div>`; // thinWrapper

	html += `<br><br><br><br><br>`;

	return html;
}

function generateHtmlFromGlobals()
{
	let html = generateHtml(replays_, players_);
	document.getElementById("everything").innerHTML = html;
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
