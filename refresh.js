const https = require("https");
const fs = require("fs");
const replay = require("./scripts/replay");

const URL_WC3STATS_API = "https://api.wc3stats.com";

async function getRequest(url)
{
    return new Promise(function(resolve, reject) {
        https.get(url, function(res) {
            let body = "";

            res.on("data", function(chunk) {
                body += chunk;
            });

            res.on("end", function() {
                resolve(body);
            });
        }).on("error", function(e) {
            reject(e);
        });
    });
}

async function getAllIbReplays()
{
    const URL = URL_WC3STATS_API + "/replays?search=Impossible.Bosses&limit=0";
    const allReplaysRaw = await getRequest(URL);
    const allReplays = JSON.parse(allReplaysRaw).body;

    let lastId = 0;
    for (let i = 0; i < allReplays.length; i++) {
        if (allReplays[i].id <= lastId) {
            throw `replay ID out of order: ${allReplays[i].id} after ${lastId}`;
        }
    }

    let replays = [];
    for (let i = 0; i < allReplays.length; i++) {
        if (allReplays[i].ladder == null || allReplays[i].season == null || allReplays[i].isVoid) {
            continue;
        }
        if (allReplays[i].players.length <= 1) {
            continue;
        }
        replays.push(allReplays[i]);
    }

    return replays;
}

async function refreshReplays(filePath, fullRefresh)
{
    const storedReplaysRaw = fs.readFileSync(filePath);
    const storedReplays = JSON.parse(storedReplaysRaw);

    const replays = await getAllIbReplays();
    let newStoredReplays = storedReplays;
    let numNewReplays = 0;

    for (let i = 0; i < replays.length; i++) {
        const id = replays[i].id;
        if (fullRefresh || !storedReplays.hasOwnProperty(id)) {
            console.log(`Querying replay id ${id}...`);

            const urlReplay = URL_WC3STATS_API + "/replays/" + id;
            const wc3StatsDataRaw = await getRequest(urlReplay);
            const wc3StatsData = JSON.parse(wc3StatsDataRaw);
            try {
                const replayData = replay.parseWc3StatsReplayData(wc3StatsData);
                newStoredReplays[id] = replayData;
                numNewReplays++;
            }
            catch (e) {
                console.error(`Failed to parse replay ${id}:`);
                console.error(e);
                newStoredReplays[id] = null;
                numNewReplays++;
            }
        }
    }

    if (numNewReplays == 0) {
        console.log("No new replays");
    }
    else {
        fs.writeFileSync(filePath, JSON.stringify(newStoredReplays, null, 4));
        console.log(`Updated and saved ${numNewReplays} new replays`);
    }
}

refreshReplays("data/replays.json", false);
