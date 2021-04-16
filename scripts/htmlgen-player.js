let replays_ = null;
let players_ = null;

function generateHtmlPlayerReplayInsideTr(replay, player, players)
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

	const playerIndex = getPlayerIndexInReplay(replay, player, players);
	const iconPath = classToIconPath(replay.players[playerIndex].class);

	let html = "";
	html += `<td><a href="../game?id=${replay.id}">${replay.name}</a></td>`;
	html += `<td><img src="${iconPath}"/></td>`;
	html += `<td>${replay.players.length}</td>`;
	html += `<td>${diffString}</td>`;
	html += `<td>${victoryDefeatString}</td>`;
	html += `<td>${replay.totalWipes}</td>`;
	html += `<td>${versionString}</td>`;
	html += `<td>${hostServerString}</td>`;
	html += `<td>${dateString}</td>`;
	return html;
}

function generateHtmlPlayerClasses(replays, games, players, player)
{
	let playerClassData = {};
	for (c in CLASS) {
		playerClassData[CLASS[c]] = {
			played: {},
			won: {}
		};
		for (d in DIFFICULTY) {
			playerClassData[CLASS[c]].played[DIFFICULTY[d]] = 0;
			playerClassData[CLASS[c]].won[DIFFICULTY[d]] = 0;
		}
	}

	for (let i = 0; i < games.length; i++) {
		const replay = replays[games[i]];
		const index = getPlayerIndexInReplay(replay, player, players);
		const playerData = replay.players[index];
		playerClassData[playerData.class].played[replay.difficulty]++;
		if (replay.win) {
			playerClassData[playerData.class].won[replay.difficulty]++;
		}
	}

	let html = "";
	html += `<h2>Classes</h2>`;
	html += `<table>`;
	html += `<tr><th></th>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		html += `<th>${DIFFICULTIES_SORTED[i]}</th>`;
	}
	html += `</tr>`;
	for (let i = 0; i < CLASSES_SORTED.length; i++) {
		const c = CLASSES_SORTED[i];
		const iconPath = classToIconPath(c);
		html += `<tr>`;
		html += `<td><img src="${iconPath}"/></td>`;
		for (let j = 0; j < DIFFICULTIES_SORTED.length; j++) {
			const d = DIFFICULTIES_SORTED[j];
			const classData = playerClassData[c];
			const wins = classData.won[d];
			const losses = classData.played[d] - wins;
			if (classData.played[d] == 0) {
				html += `<td>-</td>`;
			}
			else {
				html += `<td>${wins} W / ${losses} L</td>`;
			}
		}
		html += `<td></td>`;
		html += `</tr>`;
	}
	html += `</table>`;
	return html;
}

function generateHtml(replays, players, player)
{
	const playerGamesMap = getPlayerGamesMap(replays, players);
	const games = playerGamesMap[player] || [];

	let html = "";
	html += `<h1>${player}</h1>`;
	html += `<h4>${games.length} games played</h4>`;
	html += `<hr>`;

	let sortedReplays = [];
	for (let i = 0; i < games.length; i++) {
		sortedReplays.push(replays[games[i]]);
	}
	sortedReplays.sort(function(r1, r2) {
		return r1.playedOn < r2.playedOn;
	});

	html += generateHtmlPlayerClasses(replays, games, players, player);

	html += `<h2>Recent Games</h2>`;
	html += `<table>`;
	html += `<tr><th style="width: 200pt;">Game Name</th><th>Class</th><th>Players</th><th>Difficulty</th><th>?</th><th>Continues Used</th><th>Version</th><th>Server</th><th>Date</th></tr>`;
	for (let i = 0; i < sortedReplays.length; i++) {
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = "rowLighter";
		}
		html += `<tr style="height: 28pt;" class="${rowLighterOrNot}">`;
		html += generateHtmlPlayerReplayInsideTr(sortedReplays[i], player, players);
		html += `</tr>`;
	}
	html += `</table>`;

	html += `<br><br><br><br><br>`;

	return html;
}

function generateHtmlFromGlobals(player)
{
	let html = generateHtml(replays_, players_, player);
	document.getElementById("thinWrapper").innerHTML = html;
}

$(document).ready(function() {
	const urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.has("name")) {
		console.error("Expected player name in URL, redirecting to home");
		window.location.href = '../';
	}

	const player = urlParams.get("name");
	$.get("../data/replays.json", function(data) {
		replays_ = data;
		if (players_ != null) {
			generateHtmlFromGlobals(player);
		}
	});

	$.get("../data/players.json", function(data) {
		players_ = data;
		if (replays_ != null) {
			generateHtmlFromGlobals(player);
		}
	});
});
