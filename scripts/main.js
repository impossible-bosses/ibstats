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
	return html;
}

$(document).ready(function() {
	$.get("./data/replays.json", function(data) {
		console.log(data);
		const html = generateHtml(data);
		document.getElementById("thinWrapper").innerHTML = html;

		$.get("https://api.wc3stats.com/replays?search=Impossible.Bosses&limit=0", function(data2) {
			console.log(data2);
			let numMissing = 0;
			for (let i = 0; i < data2.body.length; i++) {
				let r = data2.body[i];
				if (isValidReplay(r) && !data.hasOwnProperty(r.id)) {
					numMissing++;
					console.log(`Missing replay ${r.id}`);
				}
			}

			if (numMissing != 0) {
				document.getElementById("thinWrapper").innerHTML = `<h3 style="color:#cc4444">Missing ${numMissing} new replays</h3>` + document.getElementById("thinWrapper").innerHTML
			}
		});
	});
});
