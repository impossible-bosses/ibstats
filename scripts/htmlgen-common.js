const NOTE_KILL_TIME = "<b>NOTE:</b> At the moment, boss kill times are calculated slightly differently from the timer displayed in game, so you might see some discrepancies. This will obviously affect DPS/HPS calculations as well. The difference shouldn't be more than 2-3 seconds, though, EXCEPT if you pause the game - pauses currently count as part of your kill time. This will all be fixed in a future version.";

function registerTabs()
{
	const MAX_TABS = 16;
	let tabSelectorsFlat = [];
	for (let i = 0; i < MAX_TABS; i++) {
		const ts = document.getElementsByClassName(`ts${i}`);
		for (let j = 0; j < ts.length; j++) {
			tabSelectorsFlat.push({
				tab: i,
				element: ts[j]
			});
		}
	}

	for (let i = 0; i < tabSelectorsFlat.length; i++) {
		const ts = tabSelectorsFlat[i];
		ts.element.addEventListener("click", function() {
			for (let j = 0; j < tabSelectorsFlat.length; j++) {
				const ts2 = tabSelectorsFlat[j];
				ts2.element.classList.remove("active");
			}
			for (let j = 0; j < MAX_TABS; j++) {
				const tc = document.getElementsByClassName(`tc${j}`);
				for (let k = 0; k < tc.length; k++) {
					tc[k].classList.remove("active");
				}
			}

			this.classList.add("active");
			const tc = document.getElementsByClassName(`tc${ts.tab}`);
			for (let j = 0; j < tc.length; j++) {
				tc[j].classList.add("active");
			}
		});
	}
}

function registerCollapsibles()
{
	const collapsibleOpeners = document.getElementsByClassName("collapsible");
	for (let i = 0; i < collapsibleOpeners.length; i++) {
		collapsibleOpeners[i].addEventListener("click", function() {
			this.classList.toggle("active");
			let content = this.nextElementSibling;
			if (content.style.display === "block") {
				content.style.display = "none";
			} else {
				content.style.display = "block";
			}
		});
	}
}

function scrollToBossFromHash()
{
	let hash = window.location.hash;
	if (hash && hash.length > 0) {
		hash = hash.substring(1);
	}

	for (b in BOSS) {
		if (hash == BOSS[b]) {
			document.getElementById(hash).scrollIntoView();
			break;
		}
	}
}

function numberSeparateThousands(x, sep)
{
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

function intToStringMaybeNull(i)
{
	if (i == null) {
		return "-";
	}
	else {
		return i.toString();
	}
}

function floatToStringMaybeNull(f, decimals=0)
{
	if (f == null) {
		return "-";
	}
	else {
		return numberSeparateThousands(f.toFixed(decimals), " ");
	}
}

function floatTo3DigitStringMaybeNull(f)
{
	let decimals = 0;
	const absF = Math.abs(f);
	if (absF < 10) {
		decimals = 2;
	}
	else if (absF < 100) {
		decimals = 1;
	}
	return floatToStringMaybeNull(f, decimals);
}

function secondsToTimestamp(seconds)
{
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	let str = m.toString() + ":";
	if (s < 10) {
		str += "0";
	}
	str += s.toString();
	return str;
}

function generateHtmlBossFrame(boss, left, titleRight, innerHtml, imagePath)
{
	let html = "";
	html += `<div id="${boss}" class="bossBackground" style="background-color: ${BOSS_COLORS[boss]}60;">`;
	html += `<img class="${left ? "left" : "right"}" src="${imagePath}/images/etch-${boss}.png"/>`;
	html += `<div class="thinWrapper">`;
	html += `<div class="bossTitle">`;
	// html += `<h2 class="bossTitleLeft">${getBossLongName(boss)}</h2>`;
	html += `<h2 class="bossTitleLeft"><a href="/boss/?b=${boss}&d=Normal">${getBossLongName(boss)}</a></h2>`;
	html += `<h2 class="bossTitleRight">${titleRight}</h2>`;
	html += `</div>`;
	html += `<hr class="rowLighter" style="height: 4px;">`;
	html += innerHtml;
	html += `</div>`;
	html += `</div>`;
	return html;
}

function generateHtmlAchievementSingle(a, playerReplays, homePath, difficulty, outer)
{
	let status = "&#x2717;"; // X
	let earnedString = "";
	if (playerReplays.length > 0) {
		status = "&#x2713;"; // check

		const replay0 = playerReplays[0].replay; // safe to assume it's the same replay
		const date = new Date(replay0.playedOn * 1000);
		const dateString = date.toLocaleDateString();
		let playersString = "";
		for (let i = 0; i < playerReplays.length; i++) {
			const player = playerReplays[i].player;
			if (i != 0) {
				playersString += ", ";
			}
			playersString += `<a href="${homePath}/player?name=${player}">${player}</a>`;
		}
		earnedString += `<p>`;
		earnedString += `- <i>First earned ${dateString} on <b>${difficulty}</b> difficulty by</i>`;
		earnedString += `<br>`;
		earnedString += `${playersString} on <a href="${homePath}/game?id=${replay0.id}">${replay0.name}</a>`;
		earnedString += `</p>`;
	}
	else {
		earnedString += `<p>- <i>Unearned on <b>${difficulty}</b> difficulty.</i></p>`;
	}

	let html = "";
	let earnedClass = difficultyToShortString(difficulty);
	if (playerReplays.length > 0) {
		earnedClass += " earned";
	}
	html += `<div class="achievementFrame ${earnedClass} ${outer ? "collapsible" : ""}">`;
	html += `<p class="title"><b>${status} ${a}</b> &mdash; ${ACHIEVEMENTS[a].description}</p>`;
	html += `${earnedString}`;
	html += `</div>`;
	return html;
}

function generateHtmlAchievement(a, difficultyPlayerReplays, homePath)
{
	let html = "";
	let anyEarned = false;
	for (let i = DIFFICULTIES_SORTED.length - 1; i >= 0; i--) {
		const diff = DIFFICULTIES_SORTED[i];
		const playerReplays = difficultyPlayerReplays[diff];
		if (playerReplays.length > 0) {
			anyEarned = true;
			html += generateHtmlAchievementSingle(a, playerReplays, homePath, diff, true);
			break;
		}
	}
	if (!anyEarned) {
		html += generateHtmlAchievementSingle(a, [], homePath, DIFFICULTY.VE, true);
	}
	html += `<div class="achievementsInner" style="display: none;">`;
	for (let i = DIFFICULTIES_SORTED.length - 1; i >= 0; i--) {
		const diff = DIFFICULTIES_SORTED[i];
		const playerReplays = difficultyPlayerReplays[diff];
		html += generateHtmlAchievementSingle(a, playerReplays, homePath, diff, false);
	}
	html += `</div>`;
	return html;
}

function generateHtmlGameRow(replay, homePath, players, player)
{
	const versionString = mapVersionToString(replay.mapVersion);
	const hostServerString = wc3VersionToHostingServer(replay.wc3Version);
	const date = new Date(replay.playedOn * 1000);
	const dateString = date.toLocaleDateString();

	let html = "";
	if (replay.mapVersion >= MAP_VERSION.V1_11_4) {
		const diffString = difficultyToShortString(replay.difficulty);
		const maxBosses = getDifficultyMaxBosses(replay.difficulty);

		html += `<td class="alignCenter"><a href="${homePath}/game?id=${replay.id}">${replay.name}</a></td>`;
		if (player != null) {
			const ind = getPlayerIndexInReplay(replay, player, players);
			const iconPath = classToIconPath(replay.players[ind].class, homePath);
			html += `<td><img src="${iconPath}"/></td>`;
		}
		html += `<td>${replay.players.length}</td>`;
		html += `<td>${diffString}</td>`;
		html += `<td>${replay.win ? maxBosses : replay.bossKills}/${maxBosses}</td>`;
		html += `<td>${replay.totalWipes}</td>`;
	}
	else {
		html += `<td class="alignCenter">${replay.name}</td>`;
		if (player != null) {
			html += `<td>-</td>`;
		}
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

function generateHtmlGamesList(replays, homePath, players=null, player=null)
{
	let html = "";
	html += `<table class="tableGames">`;
	html += `<thead>`;
	html += `<tr><th class="alignCenter" style="width: 200pt;">Game Name</th>${player != null ? "<th>Class</th>" : ""}<th>Players</th><th>Difficulty</th><th>Boss Kills</th><th>Continues</th><th>Version</th><th>Server</th><th>Date</th></tr>`;
	html += `</thead>`;
	html += `<tbody>`;
	let index = 0;
	for (let i = 0; i < replays.length; i++) {
		const replay = replays[i];
		if (replay.mapVersion >= MAP_VERSION.V1_11_4 && replay.bossKills == null) {
			continue;
		}
		html += `<tr class="${replay.win ? "win" : "lose"}">`;
		html += generateHtmlGameRow(replay, homePath, players, player);
		html += `</tr>`;
		index++;
	}
	html += `</tbody>`;
	html += `</table>`;
	return html;
}