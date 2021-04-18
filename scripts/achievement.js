/*
achievement "hit" format:
{
	time: <unix # timestamp for when the achievement was earned>,
	replay: <replay where achievement was earned>
}
*/

function achievementWinDifficultyWc3Version(playerSortedReplays, players, player, difficulty, wc3Version=null)
{
	let hits = [];
	for (let i = playerSortedReplays.length - 1; i >= 0; i--) {
		const replay = playerSortedReplays[i];
		if (replay.win && replay.difficulty == difficulty && (wc3Version == null || replay.wc3Version == wc3Version)) {
			hits.push({
				time: replay.playedOn,
				replay: replay
			});
		}
	}
	return hits;
}

function achievementWinDifficultyNoContinues(playerSortedReplays, players, player, difficulty)
{
	const winHits = achievementWinDifficultyWc3Version(playerSortedReplays, players, player, difficulty);
	let hits = [];
	for (let i = 0; i < winHits.length; i++) {
		const replay = winHits[i].replay;
		if (!replay.continues || replay.totalWipes == 0) {
			hits.push({
				time: winHits[i].time,
				replay: replay
			});
		}
	}
	return hits;
}

function achievementWinDifficultyNoDeaths(playerSortedReplays, players, player, difficulty)
{
	const winHits = achievementWinDifficultyWc3Version(playerSortedReplays, players, player, difficulty);
	let hits = [];
	for (let i = 0; i < winHits.length; i++) {
		const replay = winHits[i].replay;
		const ind = getPlayerIndexInReplay(replay, player, players);
		const deaths = replay.players[ind].statsOverall.deaths;
		if (replay.win && replay.difficulty == difficulty && deaths == 0) {
			hits.push({
				time: winHits[i].time,
				replay: replay
			});
		}
	}
	return hits;
}

function achievementWinDifficultyAllClasses(playerSortedReplays, players, player, difficulty)
{
	let classWinMap = {};
	for (const c in CLASS) {
		classWinMap[CLASS[c]] = false;
	}
	const winHits = achievementWinDifficultyWc3Version(playerSortedReplays, players, player, difficulty);
	for (let i = 0; i < winHits.length; i++) {
		const replay = winHits[i].replay;
		const ind = getPlayerIndexInReplay(replay, player, players);
		const c = replay.players[ind].class;
		if (!(c in classWinMap)) {
			throw "Unknown class ${c}";
		}
		classWinMap[c] = true;

		let allWins = true;
		for (const c2 in classWinMap) {
			if (!classWinMap[c2]) {
				allWins = false;
				break;
			}
		}
		if (allWins) {
			return [{
				time: replay.playedOn,
				replay: replay
			}];
		}
	}
	return [];
}

function getPlayerAchievementHits(playerSortedReplays, players, player)
{
	let achievementHits = {};
	for (const a in ACHIEVEMENTS) {
		achievementHits[a] = ACHIEVEMENTS[a].condition(playerSortedReplays, players, player);
	}
	return achievementHits;
}

const ACHIEVEMENTS = {
	"Win (Normal)": {
		description: "Win the game on Normal difficulty.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.N);
		}
	},
	"Win (Hard)": {
		description: "Win the game on Hard difficulty.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.H);
		}
	},
	"M16 Win (Normal)": {
		hideUnachieved: true,
		description: "Win the game on Normal difficulty, hosted on M16 servers.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.N, WC3_VERSION.V1_28);
		}
	},
	"M16 Win (Hard)": {
		hideUnachieved: true,
		description: "Win the game on Hard difficulty, hosted on M16 servers.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.H, WC3_VERSION.V1_28);
		}
	},
	"ENT Win (Normal)": {
		hideUnachieved: true,
		description: "Win the game on Normal difficulty, hosted on ENT servers.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.N, WC3_VERSION.V1_30);
		}
	},
	"ENT Win (Hard)": {
		hideUnachieved: true,
		description: "Win the game on Hard difficulty, hosted on ENT servers.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.H, WC3_VERSION.V1_30);
		}
	},
	"Battle.net Win (Normal)": {
		hideUnachieved: true,
		description: "Win the game on Normal difficulty, hosted on Battle.net.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.N, WC3_VERSION.V1_32);
		}
	},
	"Battle.net Win (Hard)": {
		hideUnachieved: true,
		description: "Win the game on Hard difficulty, hosted on Battle.net.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyWc3Version(playerSortedReplays, players, player, DIFFICULTY.H, WC3_VERSION.V1_32);
		}
	},
	"No Second Chances (Normal)": {
		description: "Win the game on Normal difficulty without using continues.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyNoContinues(playerSortedReplays, players, player, DIFFICULTY.N);
		}
	},
	"No Second Chances (Hard)": {
		description: "Win the game on Hard difficulty without using continues.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyNoContinues(playerSortedReplays, players, player, DIFFICULTY.H);
		}
	},
	"Ace (Normal)": {
		description: "Win the game on Normal difficulty without dying.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyNoDeaths(playerSortedReplays, players, player, DIFFICULTY.N);
		}
	},
	"Ace (Hard)": {
		description: "Win the game on Hard difficulty without dying.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyNoDeaths(playerSortedReplays, players, player, DIFFICULTY.H);
		}
	},
	"Classy (Normal)": {
		description: "Win the game on Normal difficulty with all classes.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyAllClasses(playerSortedReplays, players, player, DIFFICULTY.N);
		}
	},
	"Classy (Hard)": {
		description: "Win the game on Hard difficulty with all classes.",
		condition: function(playerSortedReplays, players, player) {
			return achievementWinDifficultyAllClasses(playerSortedReplays, players, player, DIFFICULTY.H);
		}
	},
};

function generateHtmlAchievement(achievement, playerHits, homePath)
{
	let frameClass = "achievementFrame";
	let style = "color: #777;";
	let status = "&#x2717;"; // X
	let earnedString = "";
	if (playerHits.length > 0) {
		frameClass += " achievementFrameEarned";
		style = "";
		status = "&#x2713;"; // check

		const firstTime = playerHits[0].hit.time;
		const date = new Date(firstTime * 1000);
		const dateString = date.toLocaleDateString();
		let playersString = "";
		for (let i = 0; i < playerHits.length; i++) {
			const player = playerHits[i].player;
			if (i != 0) {
				playersString += ", ";
			}
			playersString += `<a href="${homePath}/player?name=${player}">${player}</a>`;
		}
		const firstReplay = playerHits[0].hit.replay;
		earnedString = ` &mdash; first earned ${dateString} by <i>${playersString}</i> on <a href="${homePath}/game?id=${firstReplay.id}">${firstReplay.name}</a>`;
	}

	let html = "";
	html += `<div class="${frameClass}">`;
	html += `<p style="${style}"><b>${status} ${a}</b>${earnedString}</p>`;
	html += `<p style="${style}"><i>${ACHIEVEMENTS[a].description}</i></p>`;
	html += `</div>`;
	return html;
}
