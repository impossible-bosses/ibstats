let replays_ = {};
let loaded_ = false;

function generateHtmlReplay(replay)
{
	const versionString = mapVersionToString(replay.mapVersion);
	const hostServerString = wc3VersionToHostingServer(replay.wc3Version);
	if (replay.mapVersion < MAP_VERSION.V1_11_4) {
		return `<tr><td>${replay.name}</td><td>-</td><td>-</td><td>-</td><td>-</td><td>${versionString}</td><td>${hostServerString}</td></tr>`
	}

	const diffString = difficultyToShortString(replay.difficulty);
	let victoryDefeatString = null;
	if (replay.win) {
		victoryDefeatString = "Victory!";
	}
	else {
		victoryDefeatString = `Defeat (${replay.bossKills}/${getDifficultyMaxBosses(replay.difficulty)})`;
	}

	let html = `<tr style="border-bottom: thin solid; border-bottom-color: #FFFFFF;">`;
	html += `<td><a href="game?id=${replay.id}">${replay.name}</a></td>`;
	html += `<td>${replay.players.length}</td>`;
	html += `<td>${diffString}</td>`;
	html += `<td>${victoryDefeatString}</td>`;
	html += `<td>${replay.totalWipes}</td>`;
	html += `<td>${versionString}</td>`;
	html += `<td>${hostServerString}</td>`;
	html += `</tr>`;
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

	let html = "<h1>Matches</h1><table>";
	html += "<tr><th>Game Name</th><th>Players</th><th>Difficulty</th><th>?</th><th>Continues Used</th><th>Version</th><th>Server</th></tr>";
	for (let i = 0; i < replaysDescending.length; i++) {
		html += generateHtmlReplay(replaysDescending[i]);
	}
	html += "</table>";

	html += `<p><button id="refreshButton">Refresh</button></p>`;
	return html;
}

$(document).ready(function() {
	$.get("./data/replays.json", function(data) {
		const html = generateHtml(data);
		document.getElementById("thinWrapper").innerHTML = html;
		replays_ = data;
		loaded_ = true;

		$("#refreshButton").click(function() {
			const htmlPrev = document.getElementById("thinWrapper").innerHTML;
			document.getElementById("thinWrapper").innerHTML = htmlPrev + `<h4>Checking for new lobbies...</h4>`;
			$.get("https://api.wc3stats.com/replays?search=Impossible.Bosses&limit=0", function(data) {
				console.log(data);
				let numMissing = 0;
				for (let i = 0; i < data.body.length; i++) {
					let r = data.body[i];
					if (isValidReplay(r) && !replays_.hasOwnProperty(r.id)) {
						numMissing++;
						console.log(`Missing replay ${r.id}`);
					}
				}

				if (numMissing != 0) {
					document.getElementById("thinWrapper").innerHTML = htmlPrev + `<h4 style="color:#cc4444">Missing ${numMissing} new replay(s)</h4>`;
				}
				else {
					document.getElementById("thinWrapper").innerHTML = htmlPrev;
				}
			});
		});
	});
});
