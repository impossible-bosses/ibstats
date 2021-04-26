let replays_ = null;
let players_ = null;
let replayId_ = null;

function generateHtmlTitle(replay)
{
	const diffString = difficultyToShortString(replay.difficulty);
	let victoryDefeatString = null;
	if (replay.win) {
		victoryDefeatString = "Victory!";
	}
	else {
		victoryDefeatString = `Defeat (${replay.bossKills}/${getDifficultyMaxBosses(replay.difficulty)})`;
	}

	const date = new Date(replay.playedOn * 1000);
	const dateString = date.toLocaleDateString();

	let html = `<h1>${replay.players.length} ${diffString} &mdash; ${victoryDefeatString}</h1>`;
	html += `<h4>${replay.name}</h4>`;
	html += `<h4>${dateString} &mdash; v${mapVersionToString(replay.mapVersion)}</h4>`;
	html += `<h4><a href="https://wc3stats.com/games/${replay.id}">View in wc3stats</a></h4>`;
	return html;
}

function generateHtmlPlayer(players, playerData)
{
	const player = getPlayerFromAlias(players, playerData.name);
	const iconPath = classToIconPath(playerData.class, "..");
	let html = `<td class="playerImageName">`;
	html += `<img src="${iconPath}"/>`;
	html += `<div class="player player${playerData.slot}">`;
	html += `<a href="../player?name=${encodeURIComponent(player)}">${playerData.name}</a>`;
	html += `</div>`;
	html += `</td>`;
	return html;
}

function generateHtmlRankedStat(replaysDescending, players, replay, playerIndex, boss, value, statFunction, descending, formatValueFunction, statName, statClass)
{
	const topDifficultyStat = getTopDifficultyStats(replaysDescending, players, boss, statFunction, descending);
	console.log(boss);
	console.log(statName);
	console.log(value);
	console.log(topDifficultyStat);
	const total = topDifficultyStat[replay.difficulty].length;
	let player = null;
	if (players != null) {
		player = getPlayerFromAlias(players, replay.players[playerIndex].name);
	}
	let rank = null;
	for (let i = 0; i < total; i++) {
		const s = topDifficultyStat[replay.difficulty][i];
		if (replay.id == s.replayId && player == s.player) {
			rank = i;
			break;
		}
	}

	let html = "";
	html += `<div class="${statClass}">`;
	if (rank != null) {
		html += `<a href="../#${boss}">`;
	}
	html += `${formatValueFunction(value)}`
	if (rank != null) {
		if (rank == 0) {
			html += ` &#9733;`;
		}
		else if (rank < 3) {
			html += `***`;
		}
		else if (rank < 5) {
			html += `**`;
		}
		else if (rank < 10) {
			html += `*`;
		}
		html += `</a>`;
	}
	html += `<div class="tooltip">`;
	if (rank != null) {
		html += `<b>Rank ${rank + 1}</b> out of ${total} ${statName} rankings on ${replay.difficulty} difficulty`;
	}
	else {
		html += `Error, ranking unavailable. Plz tell Patio that something went wrong :(`;
	}
	html += `</div>`; // tooltip
	html += `</div>`; // rankDps
	return html;
}

// Use boss=null for overall stats
function generateHtmlStatsTable(replays, replay, players, boss)
{
	const replaysDescending = toReplayListDescending(replays);
	const killTime = replayGetBossKillTime(replay, boss);

	let html = "";
	html += `<table class="tableStats">`;
	html += `<tr><th></th><th>Deaths</th><th>Damage</th>${boss != null ? "<th>DPS</th>" : ""}<th>Healing</th>${boss != null ? "<th>HPS</th>" : ""}<th>Healing Received</th><th>Degen</th></tr>`;
	for (let i = 0; i < replay.players.length; i++) {
		const p = replay.players[i];
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = " rowLighter";
		}
		let pb = null;
		if (boss == null) {
			pb = p.statsOverall;
		}
		else {
			pb = p.statsBoss[boss];
		}
		html += `<tr class="playerRow${rowLighterOrNot}">`;
		html += generateHtmlPlayer(players, p);
		if (boss != null && pb.deaths != null) {
			html += `<td>`;
			html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, pb.deaths, statFunctionDeaths, true, intToStringMaybeNull, "death", "rankStatInTable");
			html += `</td>`;
		}
		else {
			html += `<td>${intToStringMaybeNull(pb.deaths)}</td>`;
		}
		html += `<td>${floatToStringMaybeNull(pb.dmg)}</td>`;
		if (boss != null) {
			html += `<td>`;
			if (killTime != null && pb.dmg != null) {
				const dps = pb.dmg / killTime;
				html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, dps, statFunctionDps, true, function(f) { return floatToStringMaybeNull(f, 1); }, "DPS", "rankStatInTable");
			}
			else {
				html += `n/a`;
			}
			html += `</td>`;
		}
		html += `<td>${floatToStringMaybeNull(pb.hl)}</td>`;
		if (boss != null) {
			html += `<td>`;
			if (killTime != null && pb.dmg != null) {
				const hps = pb.hl / killTime;
				html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, hps, statFunctionHps, true, floatToStringMaybeNull, "HPS", "rankStatInTable");
			}
			else {
				html += `n/a`;
			}
			html += `</td>`;
		}
		html += `<td>${floatToStringMaybeNull(pb.hlr)}</td>`;
		if (boss != null && pb.degen != null) {
			html += `<td>`;
			html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, pb.degen, statFunctionDegen, true, floatToStringMaybeNull, "degen", "rankStatInTable");
			html += `</td>`;
		}
		else {
			html += `<td>${floatToStringMaybeNull(pb.degen)}</td>`;
		}
		html += `</tr>`;
	}
	html += `</table>`;
	return html;
}

function generateHtmlOverallStats(replays, replay, players)
{
	let html = "";

	html += `<div class="thinWrapper">`;
	html += `<table class="tableStats">`;
	html += `<thead>`;
	html += `<tr><th></th><th>Boss Kills</th><th>Coins</th><th>Health</th><th>Mana</th><th>Ability</th><th>MS</th><th>APM</th></tr>`;
	html += `</thead>`;
	html += `<tbody>`;
	for (let i = 0; i < replay.players.length; i++) {
		const p = replay.players[i];
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = " rowLighter";
		}
		html += `<tr class="playerRow${rowLighterOrNot}">`;
		html += generateHtmlPlayer(players, p);
		html += `<td>${p.bossKills}</td>`;
		html += `<td>${intToStringMaybeNull(p.coins)}</td>`;
		html += `<td>${intToStringMaybeNull(p.health)}</td>`;
		html += `<td>${intToStringMaybeNull(p.mana)}</td>`;
		html += `<td>${intToStringMaybeNull(p.ability)}</td>`;
		html += `<td>${intToStringMaybeNull(p.ms)}</td>`;
		html += `<td>${intToStringMaybeNull(p.apm)}</td>`;
		html += `</tr>`;
	}
	html += `</tbody>`;
	html += `</table>`;

	html += `<h2>Overall Stats</h2>`;
	html += generateHtmlStatsTable(replays, replay, players, null);
	html += `</div>`;
	return html;
}

function generateHtmlBoss(replays, replay, players, boss, left)
{
	const bossData = replay.bosses[boss];
	const numWipes = bossData.wipeTimes.length;
	let continuesStr = "";
	if (numWipes == 1) {
		continuesStr = `${numWipes} wipe | `;
	}
	else if (numWipes > 1) {
		continuesStr = `${numWipes} wipes | `;
	}
	const killTime = bossData.killTime - bossData.startTimes[bossData.startTimes.length - 1];

	const replaysDescending = toReplayListDescending(replays);
	const titleRight = continuesStr + generateHtmlRankedStat(replaysDescending, null, replay, null, boss, killTime, statFunctionKillTime, false, secondsToTimestamp, "kill time", "rankKillTime");

	const innerHtml = generateHtmlStatsTable(replays, replay, players, boss);

	return generateHtmlBossFrame(boss, left, titleRight, innerHtml, "..");
}

function generateHtml(replays, players, replayId)
{
	const replay = replays[replayId];

	let html = "";
	html += `<p class="backButton"><a href="..">&lt; BACK</a></p>`;
	html += `<div class="downloadButton">`;
	html += `<a href="https://api.wc3stats.com/replays/${replay.id}/download">`;
	html += `<img src="../images/symbol-download.svg"/>`;
	html += `</a>`;
	html += `</div>`; // downloadButton
	html += generateHtmlTitle(replay);

	html += `<div class="thinWrapper">`;
	html += `<hr class="big">`;
	if (replay.remakeData) {
		html += `<div class="temp">`;
		html += `<h2>Warning: In-game Remake</h2>`;
		html += `<p>An in-game remake was used in this game. This invalidates data for all bosses that were re-played in the remake. Overall progress and boss kills are still properly recorded, though.</p>`;
		html += `</div>`;
		html += `<br><br>`;
	}
	html += `</div>`; // thinWrapper

	let contString = null;
	if (replay.continues) {
		contString = "Enabled";
	}
	else {
		contString = "Disabled";
	}
	html += `<h4>Continues ${contString} (${replay.totalWipes} Used)</h4>`;
	html += `<br><br><br>`;
	html += generateHtmlOverallStats(replays, replay, players);
	html += `<br><br>`;

	html += `<div class="thinWrapper">`;
	html += `<p class="temp">${NOTE_KILL_TIME}</p>`;
	html += `</div>`; // thinWrapper

	html += `<br><br><br>`;

	let left = true;
	for (let i = 0; i < BOSSES_SORTED.length; i++) {
		const boss = BOSSES_SORTED[i];
		const bossData = replay.bosses[boss];
		if (bossData.killTime != null) {
			html += generateHtmlBoss(replays, replay, players, boss, left);
		}
		left = !left;
	}

	html += `<br><br><br><br><br>`;

	return html;
}

function generateHtmlFromGlobals()
{
	let html = generateHtml(replays_, players_, replayId_);
	document.getElementById("everything").innerHTML = html;
	scrollToBossFromHash();
}

$(document).ready(function() {
	const urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.has("id")) {
		console.error("Expected replay ID in URL, redirecting to home");
		window.location.href = '../';
	}

	const replayIdString = urlParams.get("id");
	const replayId = parseInt(replayIdString);
	replayId_ = replayId;

	$.get("../data/replays.json", function(data) {
		replays_ = data;
		if (replayId in replays_) {
			if (players_ != null) {
				generateHtmlFromGlobals();
			}
		}
		else {
			console.log("New replay, not in cache. Querying wc3stats...");
			const wc3statsReplayUrl = "https://api.wc3stats.com/replays/" + replayId.toString();
			$.get(wc3statsReplayUrl, function(data) {
				console.log(data);
				const replay = parseWc3StatsReplayData(data);
				console.log(replay);
				replays_[replayId] = replay;
				if (players_ != null) {
					generateHtmlFromGlobals();
				}
			});
		}
	});

	$.get("../data/players.json", function(data) {
		players_ = data;
		if (replays_ != null) {
			generateHtmlFromGlobals();
		}
	});
});
