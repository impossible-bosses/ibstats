let replays_ = null;
let players_ = null;
let boss_ = null;

function generateHtmlTitle(boss)
{
    let html = `<h1>${getBossLongName(boss)}</h1>`;
    return html;
}

function generateHtmlAndCharts(replays, players, boss)
{
    const diff = DIFFICULTY.N;
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
    html += `<p class="backButton"><a href="..">&lt; BACK</a></p>`;
    html += `<br><br><br><br>`;
    html += generateHtmlTitle(boss);

    html += `<div style="width: 70%; margin: auto;"><canvas id="scatterDmg"></canvas></div>`;
    charts.push({
        canvasId: "scatterDmg",
        config: {
            type: "scatter",
            data: {
                datasets: [{
                    label: "Fire Mage",
                    data: [{
                        x: 10,
                        y: 10
                    }, {
                        x: 10,
                        y: 10
                    }, {
                        x: 10,
                        y: 10
                    }, {
                        x: 10,
                        y: 10
                    }, {
                        x: 15,
                        y: 10
                    }],
                }]
            },
            options: {
                scales: {
                    y: {
                        display: false,
                        // type: "category",
                        // labels: ["Fire Mage", "Ice Mage"]
                    }
                },
                plugins: {
                    tooltip: {
                    }
                }
            }
        }
    })

    return {
        html: html,
        charts: charts,
    };
}

function generateHtmlFromGlobals()
{
    let htmlAndCharts = generateHtmlAndCharts(replays_, players_, boss_);
    everything.innerHTML = htmlAndCharts.html;

    for (const chart of htmlAndCharts.charts) {
        const canvas = document.getElementById(chart.canvasId);
        new Chart(canvas, chart.config);
    }
}

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has("b")) {
        console.error("Expected boss in URL, redirecting to home");
        window.location.href = '../';
    }

    const boss = urlParams.get("b");
    boss_ = boss;

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
