let replays_ = null;
let players_ = null;
let boss_ = null;

function generateHtmlTitle(boss)
{
    let html = `<h1>${getBossLongName(boss)}</h1>`;
    return html;
}

function generateHtml(replays, players, boss)
{
    let html = "";
    html += `<p class="backButton"><a href="..">&lt; BACK</a></p>`;
    html += `<br><br><br><br>`;
    html += generateHtmlTitle(boss);

    const chartDiv = document.createElement("div");
    const chartCanvas = document.createElement("canvas");
    chartDiv.appendChild(chartCanvas);
    document.body.appendChild(chartDiv);
    new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    return html;
}

function generateHtmlFromGlobals()
{
    let html = generateHtml(replays_, players_, boss_);
    document.getElementById("everything").innerHTML = html;
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
