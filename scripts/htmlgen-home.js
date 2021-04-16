let replays_ = null;
let players_ = null;

function getWorldFirst(replays, players, difficulty, wc3Version)
{
}

function generateHtmlReplayInsideTr(replay)
{
	const versionString = mapVersionToString(replay.mapVersion);
	const hostServerString = wc3VersionToHostingServer(replay.wc3Version);
	const date = new Date(replay.playedOn * 1000);
	const dateString = date.toLocaleDateString();

	if (replay.mapVersion < MAP_VERSION.V1_11_4) {
		return `<td>${replay.name}</td><td>-</td><td>-</td><td>-</td><td>-</td><td>${versionString}</td><td>${hostServerString}</td><td>${dateString}</td>`
	}

	const diffString = difficultyToShortString(replay.difficulty);
	let victoryDefeatString = null;
	if (replay.win) {
		victoryDefeatString = "Victory!";
	}
	else {
		victoryDefeatString = `Defeat (${replay.bossKills}/${getDifficultyMaxBosses(replay.difficulty)})`;
	}

	let html = "";
	html += `<td><a href="game?id=${replay.id}">${replay.name}</a></td>`;
	html += `<td>${replay.players.length}</td>`;
	html += `<td>${diffString}</td>`;
	html += `<td>${victoryDefeatString}</td>`;
	html += `<td>${replay.totalWipes}</td>`;
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
	html += `<td><a href="player?name=${encodeURIComponent(player)}">${player}</a></td>`;
	html += `<td>${games.length}</td>`;
	html += `<td>${wins}</td>`;
	html += `<td>${winsN}</td>`;
	html += `<td>${winsH}</td>`;
	return html;
}

function generateHtml(replays, players)
{
	let html = ``;

	// Players section
	const playerGamesMap = getPlayerGamesMap(replays, players);
	let playerGamesSorted = [];
	for (const player in playerGamesMap) {
		playerGamesSorted.push({
			player: player,
			games: playerGamesMap[player]
		});
	}
	playerGamesSorted.sort(function(e1, e2) {
		return e1.games.length < e2.games.length;
	});

	html += `<h1>Players</h1><table>`;
	html += `<tr><th>Player</th><th>Games Played</th><th>Wins</th><th>Wins (N)</th><th>Wins (H)</th></tr>`;
	for (let i = 0; i < playerGamesSorted.length; i++) {
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = "rowLighter";
		}
		html += `<tr style="height: 28pt;" class="${rowLighterOrNot}">`;
		html += generateHtmlPlayerInsideTr(replays, players, playerGamesSorted[i].player, playerGamesSorted[i].games);
		html += `</tr>`;
	}
	html += `</table>`;

	// Leaderboards section
	html += `<h1>Leaderboards</h1>`;
	html += `<h2>Achievements</h2>`;
	const worldFirstDifficulties = [
		DIFFICULTY.N,
		DIFFICULTY.H
	];
	for (let i = 0; i < worldFirstDifficulties.length; i++) {
	}
	html += `<p>World First: Normal Win &#x2713;</p>`;
	html += `<p>World First: Hard Win</p>`;
	html += `<p>M16 First: Normal Win</p>`;
	html += `<p>M16 First: Hard Win</p>`;
	html += `<p>ENT First: Normal Win</p>`;
	html += `<p>ENT First: Hard Win</p>`;
	html += `<p>Battle.net First: Normal Win</p>`;
	html += `<p>Battle.net First: Hard Win</p>`;

	// Games section
	let replaysDescending = [];
	for (const id in replays) {
		if (replays[id] != null) {
			replaysDescending.push(replays[id]);
		}
	}
	replaysDescending.sort(function(r1, r2) {
		return r1.playedOn < r2.playedOn;
	});

	html += `<h1>Recent Games</h1><table>`;
	html += `<tr><th style="width: 200pt;">Game Name</th><th>Players</th><th>Difficulty</th><th>?</th><th>Continues Used</th><th>Version</th><th>Server</th><th>Date</th></tr>`;
	for (let i = 0; i < replaysDescending.length; i++) {
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = "rowLighter";
		}
		html += `<tr style="height: 28pt;" class="${rowLighterOrNot}">`;
		html += generateHtmlReplayInsideTr(replaysDescending[i]);
		html += `</tr>`;
	}
	html += `</table>`;

	html += `<br><br>`;
	html += `<p><button id="refreshButton">Refresh</button></p>`;
	html += `<br><br><br><br><br>`;

	return html;
}

function generateHtmlFromGlobals()
{
	let html = generateHtml(replays_, players_);
	document.getElementById("thinWrapper").innerHTML = html;

	$("#refreshButton").click(function() {
		const htmlPrev = document.getElementById("thinWrapper").innerHTML;
		document.getElementById("thinWrapper").innerHTML = htmlPrev + `<h4>Checking for new lobbies...</h4>`;
		$.get("https://api.wc3stats.com/replays?search=Impossible.Bosses&limit=0", function(data) {
			console.log(data);
			let numMissing = 0;
			for (let i = 0; i < data.body.length; i++) {
				let r = data.body[i];
				if (isValidReplay(r) && !(r.id in replays_)) {
					numMissing++;
					console.log(`Missing replay ${r.id}`);
				}
			}

			if (numMissing != 0) {
				document.getElementById("thinWrapper").innerHTML = htmlPrev + `<h4 style="color:#cc4444">Missing ${numMissing} new replay(s)</h4>`;
			}
			else {
				document.getElementById("thinWrapper").innerHTML = htmlPrev;
			}
		});
	});
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
