let replays_ = null;
let players_ = null;

function generateHtmlPlayerProgress(playerSortedReplays, players, player)
{
	let progress = {};
	for (let d in DIFFICULTY) {
		progress[DIFFICULTY[d]] = {
			win: false,
			maxBossKills: 0
		};
	}

	for (let i = 0; i < playerSortedReplays.length; i++) {
		const replay = playerSortedReplays[i];
		if (progress[replay.difficulty].win) {
			continue;
		}
		if (replay.win) {
			progress[replay.difficulty].win = true;
			progress[replay.difficulty].maxBossKills = 0;
		}
		else {
			if (progress[replay.difficulty].maxBossKills < replay.bossKills) {
				progress[replay.difficulty].maxBossKills = replay.bossKills;
			}
		}
	}

	let html = "";
	html += `<table>`;
	html += `<tr>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		html += `<th>${DIFFICULTIES_SORTED[i]}</th>`;
	}
	html += `</tr><tr>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		const prog = progress[DIFFICULTIES_SORTED[i]];
		const maxBosses = getDifficultyMaxBosses(DIFFICULTIES_SORTED[i]);
		let string = "&#x2717;"; // X
		if (prog.win) {
			string = "&#x2713;"; // check
		}
		else if (prog.maxBossKills > 0) {
			string = `${prog.maxBossKills} / ${maxBosses}`;
		}
		html += `<td>${string}</td>`;
	}
	html += `</tr></table>`;

	return html;
}

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

function generateHtmlPlayerClasses(playerSortedReplays, players, player)
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

	for (let i = 0; i < playerSortedReplays.length; i++) {
		const replay = playerSortedReplays[i];
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

function generateHtmlPlayerAchievements(playerSortedReplays, players, player)
{
	const achievementHits = getPlayerAchievementHits(playerSortedReplays, players, player);
	let html = "";
	html += `<h2>Achievements</h2>`;
	for (const a in ACHIEVEMENTS) {
		let difficultyPlayerReplays = {};
		let noHits = true;
		for (const d in DIFFICULTY) {
			const diff = DIFFICULTY[d];
			difficultyPlayerReplays[diff] = [];

			const hits = achievementHits[a][diff];
			if (hits.length > 0) {
				noHits = false;
				difficultyPlayerReplays[diff] = [{
					player: player,
					replay: hits[0]
				}];
			}
		}
		if (!(noHits && ACHIEVEMENTS[a].hideUnachieved)) {
			html += generateHtmlAchievement(a, difficultyPlayerReplays, "..");
		}
	}
	return html;
}

function generateHtml(replays, players, player)
{
	const sortedReplays = getPlayerSortedReplays(replays, players, player);

	let html = "";
	html += `<h2 style="position: absolute; left: 30%;"><a href="..">&lt; BACK</a></h2>`;
	html += `<h1>${player}</h1>`;
	const aliases = getPlayerAliases(players, player);
	if (aliases.length > 0) {
		html += `<h4>( aka ${aliases.join(", ")} )</h4>`;
	}
	html += `<h4>${sortedReplays.length} games played</h4>`;
	html += `<div class="thinWrapper">`;
	html += `<hr class="big">`;

	html += generateHtmlPlayerProgress(sortedReplays, players, player);
	html += generateHtmlPlayerClasses(sortedReplays, players, player);
	html += generateHtmlPlayerAchievements(sortedReplays, players, player);

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
	html += `</div>`; // thinWrapper

	html += `<br><br><br><br><br>`;

	return html;
}

function generateHtmlFromGlobals(player)
{
	let html = generateHtml(replays_, players_, player);
	document.getElementById("everything").innerHTML = html;
	registerCollapsibles();
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
