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
	html += `<h4>${dateString}</h4>`;
	html += `<h4>Impossible Bosses v${mapVersionToString(replay.mapVersion)}</h4>`;
	html += `<a href="https://wc3stats.com/games/${replay.id}"><h4>View in wc3stats</h4></a>`;
	html += `<hr class="big">`;
	return html;
}

function generateHtmlPlayer(players, playerData)
{
	const player = getPlayerFromAlias(players, playerData.name);
	const iconPath = classToIconPath(playerData.class);
	let html = `<td class="playerImageName">`;
	html += `<img src="${iconPath}"/>`;
	html += `<div class="player player${playerData.slot}">`;
	html += `<a href="../player?name=${player}">${playerData.name}</a>`;
	html += `</div>`;
	html += `</td>`;
	return html;
}

// Use boss=null for overall stats
function generateHtmlStatsTable(replay, players, boss)
{
	let html = "";
	html += `<table>`;
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
		html += `<td>${pb.deaths}</td>`;
		html += `<td>${numberSeparateThousands(Math.round(pb.dmg), " ")}</td>`;
		html += `<td>${numberSeparateThousands(Math.round(pb.hl), " ")}</td>`;
		html += `<td>${numberSeparateThousands(Math.round(pb.hlr), " ")}</td>`;
		html += `<td>${numberSeparateThousands(Math.round(pb.degen), " ")}</td>`;
		html += `</tr>`;
	}
	html += `</table>`;
	return html;
}

function generateHtmlOverallStats(replay, players)
{
	let html = "";

	html += `<div class="thinWrapper">`;
	html += `<table>`;
	html += `<tr><th></th><th>Coins</th><th>Health</th><th>Mana</th><th>Ability</th><th>MS</th></tr>`;
	for (let i = 0; i < replay.players.length; i++) {
		const p = replay.players[i];
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = " rowLighter";
		}
		html += `<tr class="playerRow${rowLighterOrNot}">`;
		html += generateHtmlPlayer(players, p);
		html += `<td>${p.coins}</td>`;
		html += `<td>${p.health}</td>`;
		html += `<td>${p.mana}</td>`;
		html += `<td>${p.ability}</td>`;
		html += `<td>${p.ms}</td>`;
		html += `</tr>`;
	}
	html += `</table>`;

	html += `<h2>Overall Stats</h2>`;
	html += generateHtmlStatsTable(replay, players, null);
	html += `</div>`;
	return html;
}

function generateHtmlBoss(replay, players, boss, left)
{
	let BOSS_COLORS = {};
	BOSS_COLORS[BOSS.FIRE] = "#FF8000";
	BOSS_COLORS[BOSS.WATER] = "#0000A0";
	BOSS_COLORS[BOSS.BRUTE] = "#804000";
	BOSS_COLORS[BOSS.THUNDER] = "#80FFFF";
	BOSS_COLORS[BOSS.DRUID] = "#A2F4AC";
	BOSS_COLORS[BOSS.SHADOW] = "#808080";
	BOSS_COLORS[BOSS.ICE] = "#004080";
	BOSS_COLORS[BOSS.LIGHT] = "#FFFF80";
	BOSS_COLORS[BOSS.ANCIENT] = "#FFFF00";
	BOSS_COLORS[BOSS.DEMONIC] = "#800000";
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
	html += `<div class="bossBackground" style="background-color: ${BOSS_COLORS[boss]}60;">`;
	html += `<img class="${left ? "left" : "right"}" src="../images/etch-${boss}.png"/>`;
	html += `<div class="thinWrapper">`;
	html += `<div class="bossTitle">`;
	html += `<h2 class="${left ? "bossTitleLeft" : "bossTitleLeft"}">${getBossLongName(boss)}</h2>`;
	html += `<h2 class="${left ? "bossTitleRight" : "bossTitleRight"}">${continuesStr}${bossTime}</h2>`;
	html += `</div>`;
	html += `<hr>`;
	html += generateHtmlStatsTable(replay, players, boss);
	html += `</div>`;
	html += `</div>`;
	return html;
}

function generateHtml(replay, players)
{
	let html = "";
	html += `<h2 style="position: absolute; left: 30%;"><a href="..">&lt; BACK</a></h2>`;
	html += generateHtmlTitle(replay);

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
	for (b in BOSS) {
		let bossData = replay.bosses[BOSS[b]];
		if (bossData.killTime != null) {
			html += generateHtmlBoss(replay, players, BOSS[b], left);
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
