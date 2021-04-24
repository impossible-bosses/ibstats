let replays_ = null;
let players_ = null;

const TOP_N = 3;

function generateHtmlBossTopStat(replaysDescending, players, boss, statFunction, formatValueFunction, descending=true)
{
	const difficultyStats = getTopDifficultyStats(replaysDescending, players, boss, statFunction, descending);

	let html = "";
	html += `<table class="tableTopStat">`;
	html += `<tbody>`;
	for (let i = 0; i < TOP_N; i++) {
		html += `<tr class="${i % 2 == 1 ? "rowLighter" : ""}">`;
		html += `<td class="columnRank"><p>#${i + 1}</p></td>`;
		for (let j = 0; j < DIFFICULTIES_SORTED.length; j++) {
			const d = DIFFICULTIES_SORTED[j];
			if (i >= difficultyStats[d].length) {
				html += `<td>-</td>`;
				continue;
			}
			const s = difficultyStats[d][i];
			const valueString = formatValueFunction(s.value);
			html += `<td>`;
			html += `<div class="topEntry">`;
			if ("player" in s && "class" in s) {
				const iconPath = classToIconPath(s.class, ".");
				html += `<div class="topEntryPlayerName"><a href="player?name=${encodeURIComponent(s.player)}">${s.player}</a></div>`;
				html += `<div class="topEntryPlayerImage"><img src="${iconPath}"/></div>`;
			}
			html += `<div class="topEntryValue"><a href="game?id=${s.replayId}#${boss}">${valueString}</a></div>`;
			html += `</div>`; // topEntry
			html += `</td>`;
		}
		html += `</tr>`;
	}
	html += `</tbody>`;
	html += `</table>`;
	return html;
}

function generateHtmlBoss(replaysDescending, players, boss)
{
	const stats = [
		{
			label: "Fastest Kills",
			statFunction: statFunctionKillTime,
			formatValueFunction: secondsToTimestamp,
			descending: false,
			playerStat: false
		},
		{
			label: "Top DPS",
			statFunction: statFunctionDps,
			formatValueFunction: floatToStringMaybeNull,
			descending: true,
			playerStat: true
		},
		{
			label: "Top HPS",
			statFunction: statFunctionHps,
			formatValueFunction: floatToStringMaybeNull,
			descending: true,
			playerStat: true
		},
		{
			label: "Top Degen",
			statFunction: statFunctionDegen,
			formatValueFunction: floatToStringMaybeNull,
			descending: true,
			playerStat: true
		},
		{
			label: "Most Deaths",
			statFunction: statFunctionDeaths,
			formatValueFunction: intToStringMaybeNull,
			descending: true,
			playerStat: true
		},
	];

	let html = "";

	html += `<table class="tableTopStat">`;
	html += `<thead><tr><th class="columnRank"></th>`;
	for (let i = 0; i < DIFFICULTIES_SORTED.length; i++) {
		html += `<th>${DIFFICULTIES_SORTED[i]}</th>`;
	}
	html += `</tr></thead>`;
	html += `</table>`;

	for (let i = 0; i < stats.length; i++) {
		const s = stats[i];
		html += `<div><h3>${s.label}</h3><!--<hr class="small">--></div>`;
		html += generateHtmlBossTopStat(replaysDescending, s.playerStat ? players : null, boss, s.statFunction, s.formatValueFunction, s.descending);
	}

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
	html += `<td class="alignCenter"><a href="player?name=${encodeURIComponent(player)}">${player}</a></td>`;
	html += `<td>${games.length}</td>`;
	html += `<td>${wins}</td>`;
	html += `<td>${winsN}</td>`;
	html += `<td>${winsH}</td>`;
	return html;
}

function generateHtml(replays, players, activeTab)
{
	let html = ``;
	html += `<h1>Impossible Bosses</h1>`;
	html += `<div class="thinWrapper">`;

	html += `<div class="tabSection">`;
	html += `<a href="#leaderboards"><div class="tabSelector ts0 ${activeTab == 0 ? "active" : ""}">Leaderboards</div></a>`;
	html += `<a href="#players"><div class="tabSelector ts1 ${activeTab == 1 ? "active" : ""}">Players</div></a>`;
	html += `<a href="#games"><div class="tabSelector ts2 ${activeTab == 2 ? "active" : ""}">Uploaded Games</div></a>`;
	html += `<div class="search">`;
	html += `<input type="text" id="search" name="search" placeholder="player search">`;
	html += `<div id="searchResults"><div class="searchResult"><a href="">Patio</a></div><div class="searchResult"><a href="">typical_methods</a></div><div class="searchResult"><a href="">Kiiski</a></div></div>`;
	html += `</div>`; // search
	html += `</div>`; // tabSection

	html += `<hr class="big">`;

	html += `<p class="temp">Welcome! This is a work in progress - some things still look janky, and many things are bound to change. If you see anything you don't like, or want to see more of something, or have any other suggestions, just post on Discord or PM Patio. Also, don't try looking at this site on a phone yet, it will be bad :)</p>`;
	html += `<p class="temp"><b>NOTE:</b> New replays should be reflected on this site within 5-10 minutes of uploading to wc3stats. The games list is scanned every 5 minutes for new replays and updated accordingly. If you uploaded a game and it's not listed after ~10 minutes, just post on Discord or PM Patio.</p>`;
	html += `</div>`; // thinWrapper

	const playerGamesMap = getPlayerGamesMap(replays, players);
	const replaysDescending = toReplayListDescending(replays);

	// Leaderboards section
	html += `<div class="tabContent tc0 ${activeTab == 0 ? "active" : ""}">`;
	html += `<div class="thinWrapper">`;
	html += `<h1>Leaderboards</h1>`;

	html += `<h2>Achievements</h2>`;
	let sortedAchievementDifficultyPlayerReplays = {};
	for (const a in ACHIEVEMENTS) {
		sortedAchievementDifficultyPlayerReplays[a] = {};
		for (const d in DIFFICULTY) {
			sortedAchievementDifficultyPlayerReplays[a][DIFFICULTY[d]] = [];
		}
	}
	for (const player in playerGamesMap) {
		const sortedReplays = getPlayerSortedReplays(replays, players, player);
		const hits = getPlayerAchievementHits(sortedReplays, players, player);
		for (const a in ACHIEVEMENTS) {
			for (const d in DIFFICULTY) {
				const diff = DIFFICULTY[d];
				for (let i = 0; i < hits[a][diff].length; i++) {
					sortedAchievementDifficultyPlayerReplays[a][diff].push({
						player: player,
						replay: hits[a][diff][i]
					});
				}
			}
		}
	}
	for (const a in ACHIEVEMENTS) {
		if (ACHIEVEMENTS[a].hideTemp) {
			continue;
		}
		let difficultyFirstPlayerReplays = {};
		for (const d in DIFFICULTY) {
			const diff = DIFFICULTY[d];
			sortedAchievementDifficultyPlayerReplays[a][diff].sort(function(e1, e2) {
				return e1.replay.playedOn - e2.replay.playedOn;
			});

			const playerReplays = sortedAchievementDifficultyPlayerReplays[a][diff];
			let firstPlayerReplays = [];
			let firstReplay = null;
			for (let i = 0; i < playerReplays.length; i++) {
				const replay = playerReplays[i].replay;
				if (firstReplay == null) {
					firstReplay = replay;
				}
				if (replay.playedOn == firstReplay.playedOn) {
					if (replay != firstReplay) {
						console.error(`Achievement ${a} was first in different replays`);
						continue;
					}
					firstPlayerReplays.push({
						player: playerReplays[i].player,
						replay: replay
					});
				}
			}
			difficultyFirstPlayerReplays[diff] = firstPlayerReplays;
		}
		html += generateHtmlAchievement(a, difficultyFirstPlayerReplays, ".");
	}
	html += `<br><br>`;
	html += `<p class="temp">${NOTE_KILL_TIME}</p>`;
	html += `</div>`; // thinWrapper
	html += `<br><br>`;

	let left = true;
	for (let i = 0; i < BOSSES_SORTED.length; i++) {
		const boss = BOSSES_SORTED[i];
		let innerHtml = generateHtmlBoss(replaysDescending, players, boss);
		html += generateHtmlBossFrame(boss, left, "", innerHtml, ".");
		left = !left;
	}
	html += `</div>`; // tab

	// Players section
	html += `<div class="tabContent tc1 ${activeTab == 1 ? "active" : ""}">`;
	html += `<div class="thinWrapper">`;
	html += `<h1>Players</h1>`

	let playerGamesSorted = [];
	for (const player in playerGamesMap) {
		playerGamesSorted.push({
			player: player,
			games: playerGamesMap[player]
		});
	}
	playerGamesSorted.sort(function(e1, e2) {
		return e2.games.length - e1.games.length;
	});

	html += `<table class="tablePlayers">`;
	html += `<thead>`;
	html += `<tr><th class="alignCenter">Player</th><th>Games Played</th><th>Wins</th><th>Wins (N)</th><th>Wins (H)</th></tr>`;
	html += `</thead>`;
	html += `<tbody>`;
	for (let i = 0; i < playerGamesSorted.length; i++) {
		let rowLighterOrNot = "";
		if (i % 2 == 1) {
			rowLighterOrNot = "rowLighter";
		}
		html += `<tr class="${rowLighterOrNot}">`;
		html += generateHtmlPlayerInsideTr(replays, players, playerGamesSorted[i].player, playerGamesSorted[i].games);
		html += `</tr>`;
	}
	html += `</tbody>`;
	html += `</table>`;
	html += `</div>`; // thinWrapper
	html += `</div>`; // tab

	// Games section
	html += `<div class="tabContent tc2 ${activeTab == 2 ? "active" : ""}">`;
	html += `<div class="thinWrapper">`;
	html += `<h1>Uploaded Games</h1>`;
	html += generateHtmlGamesList(replaysDescending, ".");
	html += `</div>`; // thinWrapper
	html += `</div>`; // tab

	html += `<br><br><br><br><br>`;

	return html;
}

function generateHtmlFromGlobals()
{
	const hash = window.location.hash;
	let activeTab = 0;
	if (hash == "#players") {
		activeTab = 1;
	}
	else if (hash == "#games") {
		activeTab = 2;
	}

	const html = generateHtml(replays_, players_, activeTab);
	document.getElementById("everything").innerHTML = html;
	registerTabs();
	registerCollapsibles();
	scrollToBossFromHash();

	const playerAliasList = getFullPlayerAliasList(replays_, players_);
	for (let i = 0; i < playerAliasList.length; i++) {
		playerAliasList[i].alias = playerAliasList[i].alias.toLowerCase();
	}

	const search = document.getElementById("search");
	search.addEventListener("input", function(e) {
		const searchText = e.target.value.toLowerCase();
		const searchResults = document.getElementById("searchResults");

		if (searchText.length == 0) {
			searchResults.style.visibility = "hidden";
			return;
		}

		const playerSet = {};
		let numPlayers = 0;
		for (let i = 0; i < playerAliasList.length; i++) {
			const alias = playerAliasList[i].alias;
			if (alias.indexOf(searchText) !== -1) {
				const player = playerAliasList[i].player;
				if (!(player in playerSet)) {
					playerSet[player] = null;
					numPlayers++;
				}
			}
		}

		console.log(playerSet);
		if (numPlayers == 0) {
			searchResults.innerHTML = `<div class="searchResult">No matching players</div>`;
		}
		else {
			let resultHtml = "";
			for (const player in playerSet) {
				resultHtml += `<div class="searchResult"><a href="player?name=${encodeURIComponent(player)}">${player}</a></div>`;
			}
			searchResults.innerHTML = resultHtml;
		}
		searchResults.style.visibility = "visible";
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
