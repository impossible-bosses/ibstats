let replays_ = null;
let players_ = null;
let replayId_ = null;
let inCache_ = true;

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
	let hour12 = date.getHours();
	let ampm = "AM";
	if (hour12 == 0) {
		hour12 = 12;
	}
	else if (hour12 >= 12) {
		ampm = "PM";
		if (hour12 != 12) {
			hour12 -= 12;
		}
	}
	const timeString = `~${hour12} ${ampm} on ${date.toLocaleDateString()}`;

	let html = `<h1>${replay.players.length} ${diffString} &mdash; ${victoryDefeatString}</h1>`;
	html += `<h4>${replay.name}</h4>`;
	html += `<h4>${timeString} &mdash; v${mapVersionToString(replay.mapVersion)}</h4>`;
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

function generateHtmlRankedStat(replaysDescending, players, replay, playerIndex, boss, c, value, statFunction, descending, formatValueFunction, statName, statClass)
{
	const topDifficultyStat = getTopDifficultyStats(replaysDescending, players, boss, null, statFunction, descending);
	const topDifficultyStatClass = getTopDifficultyStats(replaysDescending, players, boss, c, statFunction, descending);
	const total = topDifficultyStat[replay.difficulty].length;
	const totalClass = topDifficultyStatClass[replay.difficulty].length;
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
	let rankClass = null;
	for (let i = 0; i < totalClass; i++) {
		const s = topDifficultyStatClass[replay.difficulty][i];
		if (replay.id == s.replayId && player == s.player) {
			rankClass = i;
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
			html += ` ***`;
		}
		else if (rank < 5) {
			html += ` **`;
		}
		else if (rank < 10) {
			html += ` *`;
		}
		html += `</a>`;
	}
	html += `<div class="tooltip">`;
	if (rank !== null) {
		html += `<b>Rank ${rank + 1}</b> out of ${total} rankings on ${replay.difficulty} difficulty`;
		if (c !== null) {
			html += `<br><b>Rank ${rankClass + 1}</b> out of ${totalClass} rankings for ${c}`;
		}
	} else {
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
	html += `<tr><th></th><th>Deaths</th><th>Damage</th>${boss != null ? "<th>DPS</th>" : ""}<th>Healing</th>${boss != null ? "<th>HPS</th>" : ""}<th>Healing Received</th><th>Degen</th>${boss != null ? "<th>Degen/s</th>" : ""}<th>AK</th><th>AKPM</th><th>CS</th></tr>`;
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
			html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, p.class, pb.deaths, statFunctionDeaths, true, intToStringMaybeNull, "death", "rankStatInTable");
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
				html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, p.class, dps, statFunctionDps, true, floatTo3DigitStringMaybeNull, "DPS", "rankStatInTable");
			} else {
				html += `-`;
			}
			html += `</td>`;
		}
		html += `<td>${floatToStringMaybeNull(pb.hl)}</td>`;
		if (boss != null) {
			html += `<td>`;
			if (killTime != null && pb.hl != null) {
				const hps = pb.hl / killTime;
				html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, p.class, hps, statFunctionHps, true, floatTo3DigitStringMaybeNull, "HPS", "rankStatInTable");
			} else {
				html += `-`;
			}
			html += `</td>`;
		}
		html += `<td>${floatToStringMaybeNull(pb.hlr)}</td>`;
		html += `<td>${floatToStringMaybeNull(pb.degen)}</td>`;
		if (boss != null) {
			html += `<td>`;
			if (killTime != null && pb.degen != null) {
				const degenps = pb.degen / killTime;
				html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, p.class, degenps, statFunctionDegenPerSec, true, floatTo3DigitStringMaybeNull, "degenps", "rankStatInTable");
			} else {
				html += `-`;
			}
			html += `</td>`;
		}
		if (boss != null && pb.addKills != null) {
			html += `<td>${intToStringMaybeNull(pb.addKills)}</td>`;
			html += `<td>`;
			if (killTime != null) {
				const akpm = pb.addKills / killTime * 60;
				html += generateHtmlRankedStat(replaysDescending, players, replay, i, boss, p.class, akpm, statFunctionAddKillsPerMin, true, floatTo3DigitStringMaybeNull, "AKPM", "rankStatInTable");
			} else {
				html += `n/a`;
			}
			html += `</td>`
		} else {
			html += `<td>-</td><td>-</td>`;
		}
		html += `<td>${intToStringMaybeNull(pb.counterHit)} (${intToStringMaybeNull(pb.counterCast)})</td>`;
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
	const titleRight = continuesStr + generateHtmlRankedStat(replaysDescending, null, replay, null, boss, null, killTime, statFunctionKillTime, false, secondsToTimestamp, "kill time", "rankKillTime");

	const innerHtml = generateHtmlStatsTable(replays, replay, players, boss);

	return generateHtmlBossFrame(boss, left, titleRight, innerHtml, "..");
}

function generateHtml(replays, players, replayId, inCache)
{
	const replay = replays[replayId];

	if (replay == null) {
		let html = "";
		html += `<div class="thinWrapper">`;
		html += `<h2>Something went wrong</h2>`;
		html += `<p>This replay couldn't be parsed by the site. Please let Patio know.`;
		html += `</div>`; // thinWrapper
		return html;
	}

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
	if (!inCache) {
		html += `<div class="temp">`;
		html += `<h2>Game not yet processed</h2>`;
		html += `<p>This game was uploaded to wc3stats but hasn't been processed by this site yet. New rankings, achievements, etc will show correctly here but won't be updated in the home or player pages yet. This should happen automatically in the next 5-ish minutes.</p>`;
		html += `</div>`; // temp
		html += `<br><br>`;
	}
	if (replay.remakeData) {
		html += `<div class="temp">`;
		html += `<h2>Warning: In-game Remake</h2>`;
		html += `<p>An in-game remake was used in this game. This invalidates data for all bosses that were played in the remake. Overall progress and boss kills are still properly recorded, though.</p>`;
		html += `</div>`; // temp
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
	let html = generateHtml(replays_, players_, replayId_, inCache_);
	document.getElementById("everything").innerHTML = html;
	scrollToBossFromHash();
}

$(document).ready(function() {
	const urlParams = new URLSearchParams(window.location.search);
	if (!urlParams.has("id")) {
		console.error("Expected replay ID in URL, redirecting to home");
		window.location.href = "../";
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
				inCache_ = false;
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
