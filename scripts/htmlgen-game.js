function generateHtmlTitle(data)
{
	const diffString = difficultyToShortString(data.difficulty);
	let victoryDefeatString = null;
	if (data.win) {
		victoryDefeatString = "Victory!";
	}
	else {
		victoryDefeatString = `Defeat (${data.bossKills}/${getDifficultyMaxBosses(data.difficulty)})`;
	}

	let html = `<h1>${data.players.length} ${diffString} - ${victoryDefeatString}</h1>`;
	html += `<h4>Impossible Bosses v${mapVersionToString(data.mapVersion)}</h4>`;
	html += `<a href="https://wc3stats.com/games/${data.id}"><h4>View in wc3stats</h4></a>`;
	html += `<hr>`;
	return html;
}

function generateHtmlPlayer(playerData)
{
	const iconPath = classToIconPath(playerData.class);
	let html = `<td class="playerImageName">`;
	html += `<img src="${iconPath}"/>`;
	html += `<div class="player player${playerData.slot}">${playerData.name}</div>`;
	html += `</td>`;
	return html;
}

function generateHtmlOverallStats(data)
{
	let html = `<h2>Overall Stats</h2>`;
	html += `<table>`;
	html += `<tr><th></th><th>Coins</th><th>Health</th><th>Mana</th><th>Ability</th><th>MS</th></tr>`;
	for (let i = 0; i < data.players.length; i++) {
		const p = data.players[i];
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = " rowLighter";
		}
		html += `<tr class="playerRow${rowLighterOrNot}">`;
		html += generateHtmlPlayer(p);
		html += `<td>${p.coins}</td>`;
		html += `<td>${p.health}</td>`;
		html += `<td>${p.mana}</td>`;
		html += `<td>${p.ability}</td>`;
		html += `<td>${p.ms}</td>`;
		html += `</tr>`;
	}
	html += `</table>`;
	return html;
}

function generateHtmlBoss(data, boss)
{
	const bossData = data.bosses[boss];
	const numWipes = bossData.wipeTimes.length;
	let continuesStr = "";
	if (numWipes == 1) {
		continuesStr = `${numWipes} wipe | `;
	}
	else if (numWipes > 1) {
		continuesStr = `${numWipes} wipes | `;
	}
	const bossTime = secondsToTimestamp(bossData.killTime - bossData.startTimes[bossData.startTimes.length - 1]);

	let html = `<h2 class="bossTitleLeft">${getBossLongName(boss)}</h2>`;
	html += `<h2 class="bossTitleRight">${continuesStr}${bossTime} <img src="${""}"/></h2>`;
	html += `<table>`;
	html += `<tr><th></th><th>Deaths</th><th>Damage</th><th>Healing</th><th>Healing Received</th><th>Degen</th></tr>`;
	for (let i = 0; i < data.players.length; i++) {
		const p = data.players[i];
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = " rowLighter";
		}
		const pb = p.statsBoss[boss];
		html += `<tr class="playerRow${rowLighterOrNot}">`;
		html += generateHtmlPlayer(p);
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

function generateHtml(data)
{
	let html = generateHtmlTitle(data);

	let contString = null;
	if (data.continues) {
		contString = "Enabled";
	}
	else {
		contString = "Disabled";
	}
	html += `<h3>Continues ${contString} / ${data.totalWipes} Used</h3>`;

	html += generateHtmlOverallStats(data);
	for (b in BOSS) {
		let bossData = data.bosses[BOSS[b]];
		if (bossData.killTime != null) {
			html += generateHtmlBoss(data, BOSS[b]);
		}
	}

	html += `<br><br><br><br><br>`;

	return html;
}

$(document).ready(function() {
	const urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.has("id")) {
		console.error("Expected replay ID in URL, redirecting to home");
		window.location.href = '../';
	}

	const replayIdString = urlParams.get("id");
	const replayId = parseInt(replayIdString);
	const wc3statsReplayUrl = "https://api.wc3stats.com/replays/" + replayId.toString();
	console.log(wc3statsReplayUrl);
	$.get(wc3statsReplayUrl, function(data) {
		console.log(data);
		let replayData = parseWc3StatsReplayData(data);
		console.log(replayData);
		let html = generateHtml(replayData);
		document.getElementById("thinWrapper").innerHTML = html;
	});
});
