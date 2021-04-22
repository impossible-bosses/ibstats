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
		const ind = getPlayerIndexInReplay(replay, player, players);
		const bossKills = replay.players[ind].bossKills;
		if (replay.win && bossKills == replay.bossKills) {
			progress[replay.difficulty].win = true;
			progress[replay.difficulty].maxBossKills = 0;
		}
		else {
			if (progress[replay.difficulty].maxBossKills < bossKills) {
				progress[replay.difficulty].maxBossKills = bossKills;
			}
		}
	}

	let html = "";
	html += `<table class="tablePlayerProgress">`;
	html += `<thead><tr>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		html += `<th>${DIFFICULTIES_SORTED[i]}</th>`;
	}
	html += `</tr></thead>`;
	html += `<tbody><tr>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		const prog = progress[DIFFICULTIES_SORTED[i]];
		const maxBosses = getDifficultyMaxBosses(DIFFICULTIES_SORTED[i]);
		let string = "-";
		if (prog.win) {
			string = `${maxBosses} / ${maxBosses}`;
		}
		else if (prog.maxBossKills > 0) {
			string = `${prog.maxBossKills} / ${maxBosses}`;
		}
		html += `<td class="${prog.win ? "" : "textDark"}">${string}</td>`;
	}
	html += `</tr></tbody>`;
	html += `</table>`;

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
		if (replay.win && playerData.bossKills == replay.bossKills) {
			playerClassData[playerData.class].won[replay.difficulty]++;
		}
	}

	let html = "";
	html += `<h2>Classes</h2>`;
	html += `<table class="tablePlayerClasses">`;
	html += `<tr><th></th>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		html += `<th>${DIFFICULTIES_SORTED[i]}</th>`;
	}
	html += `</tr>`;
	for (let i = 0; i < CLASSES_SORTED.length; i++) {
		const c = CLASSES_SORTED[i];
		const iconPath = classToIconPath(c, "..");
		html += `<tr class=${i % 2 == 1 ? "rowLighter" : ""}>`;
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
	html += `<h2 class="backButton"><a href="..">&lt; BACK</a></h2>`;
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

	html += `<h2>Games</h2>`;

	html += `<table>`;
	html += generateHtmlGamesList(sortedReplays, "..", players, player);
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
