(function(root) {
    'use strict';
    function matching(report, player, resolveAlias) {
        if (!report || !Array.isArray(report.unconfirmedResult)) return [];
        const unique = new Map();
        for (const replay of report.unconfirmedResult) {
            if (!Number.isSafeInteger(replay.id) || replay.id <= 0 || !Array.isArray(replay.players)) continue;
            if (replay.players.some(name => resolveAlias(name) === player)) unique.set(replay.id, replay);
        }
        return [...unique.values()].sort((a, b) => b.playedOn - a.playedOn);
    }
    async function render(players, player) {
        const host = document.getElementById('unconfirmed-replays');
        if (!host) return;
        try {
            const response = await fetch('../data/refresh-status.json', {cache: 'no-cache'});
            if (!response.ok) return;
            const report = await response.json();
            const canonical = getPlayerFromAlias(players, player);
            const rows = matching(report, canonical, name => getPlayerFromAlias(players, name));
            if (!rows.length) return;
            const heading = document.createElement('h2');
            heading.textContent = 'Uploaded replays awaiting a confirmed result';
            const explanation = document.createElement('p');
            explanation.textContent = 'These uploads were recognized, but the replay has no confirmed final result. They are not counted as wins or losses and are excluded from rankings.';
            const list = document.createElement('ul');
            for (const row of rows) {
                const item = document.createElement('li');
                const link = document.createElement('a');
                link.href = 'https://wc3stats.com/games/' + row.id;
                const date = Number.isFinite(row.playedOn) ? new Date(row.playedOn * 1000).toISOString().slice(0, 10) : 'Unknown date';
                link.textContent = '#' + row.id + ' — ' + date + ' — ' + (row.difficulty || 'Unknown difficulty');
                item.append(link); list.append(item);
            }
            host.replaceChildren(heading, explanation, list);
            host.hidden = false;
        } catch (_) {
            // A missing status file must not break the existing personal page.
        }
    }
    const api = {matching, render};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.IBUnconfirmed = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
