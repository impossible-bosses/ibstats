let replays_ = null;
let players_ = null;
let boss_ = null;
let diff_ = null;

let charts_ = {};

function generateStatScatterHistogram(replayList, players, boss, statFunction, title, outCharts)
{
    const statByClass = {};
    for (const c of CLASSES_SORTED) {
        statByClass[c] = [];
    }
    for (const replay of replayList) {
        for (let i = 0; i < replay.players.length; i++) {
            const value = statFunction(replay, i, boss);
            if (value !== null) {
                const p = replay.players[i];
                const player = getPlayerFromAlias(players, p.name);
                statByClass[p.class].push({
                    value: value,
                    replay: replay.id,
                    player: player,
                });
            }
        }
    }
    const maxStats = {};
    for (const c of CLASSES_SORTED) {
        maxStats[c] = Math.max(...statByClass[c].map((x) => x.value));
    }
    const classesOrdered = CLASSES_SORTED.toSorted(function(a, b) {
        return maxStats[a] - maxStats[b];
    });
    const datasets = [];
    for (let i = 0; i < classesOrdered.length; i++) {
        const c = classesOrdered[i];
        const data = [];
        for (const stat of statByClass[c]) {
            const yJitterRange = 0.1;
            const yJitter = (Math.random() - 0.5) * yJitterRange;
            data.push({
                x: stat.value,
                y: i + 1 + yJitter,
                replay: stat.replay,
                player: stat.player
            });
        }
        datasets.push({
            label: c,
            pointBackgroundColor: CLASS_COLORS[c],
            pointBorderColor: "#00000000",
            pointBorderWidth: 0,
            data: data,
        });
    }

    const canvasId = `scatterHistogram_${title.replace(/[^a-zA-Z0-9]/g, "")}`;
    outCharts.push({
        canvasId: canvasId,
        config: {
            type: "scatter",
            data: {
                datasets: datasets,
            },
            options: {
                scales: {
                    x: {
                        min: 0,
                    },
                    y: {
                        display: false,
                        min: 0,
                        max: 11,
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const c = context.dataset.label;
                                const value = context.parsed.x;
                                const stat = context.dataset.data[context.dataIndex];
                                return `${c}: ${floatTo3DigitStringMaybeNull(value)} (${stat.player})`;
                            }
                        }
                    }
                },
                onClick: function (e) {
                    const elements = charts_[canvasId].getElementsAtEventForMode(e, "point", { intersect: true }, true);
                    if (elements.length > 0) {
                        const el = elements[0];
                        const stat = datasets[el.datasetIndex].data[el.index];
                        window.location.href = `../game?id=${stat.replay}#${boss}`;
                    }
                },
            }
        }
    });

    let html = "";
    html += `<h2 style="text-align: center;">${title}</h2>`;
    html += `<div style="width: 70%; margin: auto;"><canvas id=${canvasId}></canvas></div>`;
    return html;
}

function generateHtmlAndCharts(replays, players, boss, diff)
{
    Chart.defaults.borderColor = "#FFFFFF20";
    Chart.defaults.color = "#FFFFFF";

    const replayList = [];
    for (const id in replays) {
        const replay = replays[id];
        if (replay === null) {
            continue;
        }
        if (replay.bossKills === null) {
            continue;
        }
        if (replay.difficulty !== diff) {
            continue;
        }
        if (!isBossInDifficulty(boss, replay.difficulty)) {
            continue;
        }
        replayList.push(replay);
    }

    let html = "";
    let charts = [];
    html += `<div style="background-color: ${BOSS_COLORS[boss]}20">`;
    html += `<p class="backButton"><a href="..">&lt; BACK</a></p>`;
    html += `<img src="../images/etch-${boss}.png" style="position: absolute; top: 0; left: 0; width: 20%;"/>`;
    html += `<div style="height: 80pt;"></div>`;
    // html += `<br><br><br><br><br><br><br>`;

    html += `<p style="text-align: center;">.`;
    for (const b of BOSSES_SORTED) {
        html += ` <a href="./?b=${b}&d=${diff}">${b}</a> .`;
    }
    html += `</p>`;
    html += `<p style="text-align: center;">.`;
    for (const d of DIFFICULTIES_SORTED) {
        html += ` <a href="./?b=${boss}&d=${d}">${d}</a> .`;
    }
    html += `</p>`;
    html += `<hr class="rowLighter" style="width: 50%; height: 4px;">`;

    html += `<h1>${getBossLongName(boss)}</h1>`;
    html += `<h4>Difficulty: ${diff}</h4>`;

    html += generateStatScatterHistogram(replayList, players, boss, statFunctionDps, "DPS", charts);
    html += generateStatScatterHistogram(replayList, players, boss, statFunctionHps, "HPS", charts);
    html += generateStatScatterHistogram(replayList, players, boss, statFunctionDegenPerSec, "Degen / sec", charts);
    html += generateStatScatterHistogram(replayList, players, boss, statFunctionAddKillsPerMin, "Add Kills / min", charts);

    html += `</div>`;

    return {
        html: html,
        charts: charts,
    };
}

function generateHtmlFromGlobals()
{
    let htmlAndCharts = generateHtmlAndCharts(replays_, players_, boss_, diff_);
    everything.innerHTML = htmlAndCharts.html;

    charts_ = {};
    for (const chart of htmlAndCharts.charts) {
        const canvas = document.getElementById(chart.canvasId);
        charts_[chart.canvasId] = new Chart(canvas, chart.config);
    }
}

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has("b")) {
        console.error("Expected boss in URL, redirecting to home");
        window.location.href = '../';
    }
    if (!urlParams.has("d")) {
        console.error("Expected difficulty in URL, redirecting to home");
        window.location.href = '../';
    }

    const boss = urlParams.get("b");
    boss_ = boss;
    const diff = urlParams.get("d");
    diff_ = diff;

    $.get("../data/replays.json", function(data) {
        replays_ = data;
        if (players_ != null) {
            generateHtmlFromGlobals();
        }
    });

    $.get("../data/players.json", function(data) {
        players_ = data;
        if (replays_ != null) {
            generateHtmlFromGlobals();
        }
    });
});
