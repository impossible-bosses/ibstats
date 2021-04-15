function generateHtmlReplay(replay)
{
	const diffString = difficultyToShortString(replay.difficulty);
	let victoryDefeatString = null;
	if (replay.win) {
		victoryDefeatString = "Victory!";
	}
	else {
		victoryDefeatString = `Defeat (${replay.bossKills}/${getDifficultyMaxBosses(replay.difficulty)})`;
	}

	let html = "";
	html += `<p style="font-size: 14pt; margin: 0; margin-bottom: 12pt;">`;
	html += `<a href="game?id=${replay.id}">`;
	html += `${replay.players.length} ${diffString} ${victoryDefeatString} | ${replay.totalWipes} continue(s) used | v${mapVersionToString(replay.mapVersion)} | ${replay.name}`
	html += `</a></p>`;
	return html;
}

function generateHtml(data)
{
	let replaysDescending = [];
	for (let k in data) {
		if (data[k] != null) {
			replaysDescending.push(data[k]);
		}
	}
	replaysDescending.sort(function(r1, r2) {
		return r1.playedOn < r2.playedOn;
	});

	let html = "<h2>Matches</h2>";
	for (let i = 0; i < replaysDescending.length; i++) {
		html += generateHtmlReplay(replaysDescending[i]);
	}
	console.log(html);
	return html;
}

$(document).ready(function() {
	$.get("./data/replays.json", function(data) {
		console.log(data);
		const html = generateHtml(data);
		document.getElementById("thinWrapper").innerHTML = html;
	});
});
