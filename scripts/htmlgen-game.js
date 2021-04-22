let replay_ = null;
let players_ = null;

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
	html += `<h4>${dateString} &mdash; Impossible Bosses v${mapVersionToString(replay.mapVersion)}</h4>`;
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

// Use boss=null for overall stats
function generateHtmlStatsTable(replay, players, boss)
{
	let html = "";
	html += `<table class="tableStats">`;
	html += `<tr><th></th><th>Deaths</th><th>Damage</th><th>Healing</th><th>Healing Received</th><th>Degen</th></tr>`;
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
		html += `<td>${intToStringMaybeNull(pb.deaths)}</td>`;
		html += `<td>${floatToStringMaybeNull(pb.dmg)}</td>`;
		html += `<td>${floatToStringMaybeNull(pb.hl)}</td>`;
		html += `<td>${floatToStringMaybeNull(pb.hlr)}</td>`;
		html += `<td>${floatToStringMaybeNull(pb.degen)}</td>`;
		html += `</tr>`;
	}
	html += `</table>`;
	return html;
}

function generateHtmlOverallStats(replay, players)
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
	html += generateHtmlStatsTable(replay, players, null);
	html += `</div>`;
	return html;
}

function generateHtmlBoss(replay, players, boss, left)
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
	const bossTime = secondsToTimestamp(bossData.killTime - bossData.startTimes[bossData.startTimes.length - 1]);

	let html = "";
	let titleRight = `${continuesStr}${bossTime}`;
	let innerHtml = generateHtmlStatsTable(replay, players, boss);
	html += generateHtmlBossFrame(boss, left, titleRight, innerHtml, "..");
	return html;
}

function generateHtml(replay, players)
{
	let html = "";
	html += `<p class="backButton"><a href="..">&lt; BACK</a></p>`;
	html += `<div class="downloadButton">`;
	html += `<a href="https://api.wc3stats.com/replays/${replay.id}/download">`;
	html += `<img src="../images/download.svg"/>`;
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
	html += `</div>`;

	let contString = null;
	if (replay.continues) {
		contString = "Enabled";
	}
	else {
		contString = "Disabled";
	}
	html += `<h4>Continues ${contString} (${replay.totalWipes} Used)</h4>`;
	html += `<br><br><br>`;
	html += generateHtmlOverallStats(replay, players);
	html += `<br><br><br><br><br>`;

	let left = true;
	for (let i = 0; i < BOSSES_SORTED.length; i++) {
		const boss = BOSSES_SORTED[i];
		const bossData = replay.bosses[boss];
		if (bossData.killTime != null) {
			html += generateHtmlBoss(replay, players, boss, left);
		}
		left = !left;
	}

	html += `<br><br><br><br><br>`;

	return html;
}

function generateHtmlFromGlobals()
{
	let html = generateHtml(replay_, players_);
	document.getElementById("everything").innerHTML = html;
	registerCollapsibles();
}

$(document).ready(function() {
	const urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.has("id")) {
		console.error("Expected replay ID in URL, redirecting to home");
		window.location.href = '../';
	}

	const replayIdString = urlParams.get("id");
	const replayId = parseInt(replayIdString);

	$.get("../data/replays.json", function(data) {
		if (replayId in data) {
			replay_ = data[replayId];
			if (players_ != null) {
				generateHtmlFromGlobals();
			}
		}
		else {
			console.log("New replay, not in cache. Querying wc3stats...");
			const wc3statsReplayUrl = "https://api.wc3stats.com/replays/" + replayId.toString();
			$.get(wc3statsReplayUrl, function(data) {
				console.log(data);
				let replay = parseWc3StatsReplayData(data);
				console.log(replay);
				replay_ = replay;
				if (players_ != null) {
					generateHtmlFromGlobals();
				}
			});
		}
	});

	$.get("../data/players.json", function(data) {
		players_ = data;
		if (replay_ != null) {
			generateHtmlFromGlobals();
		}
	});
});
