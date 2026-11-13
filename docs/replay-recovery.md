# Replay recovery R7

This patch separates the audited recovery of 139 known missing IDs from ongoing
live synchronization. PR previews and manual runs default to source=audited:
139 statistics-only API response snapshots are reparsed locally against the
current source replay file. No WC3Stats request is needed for that preview.
The current audit adds 130 eligible records, quarantines five unconfirmed results
and reports four parsing failures. Green means the 130-record candidate passed
preservation checks, not that all 139 records or all Discord attachments recovered.
The snapshot includes 855188, which was uploaded during salgeras1 diagnosis.

The manual workflow's publish=false default remains. Only a main-branch run
explicitly choosing publish=true (or the opt-in schedule) may commit generated
replay data. The source SHA256/preservation gate and explicit Pages build check
remain. main still requires a compatible branch-based Pages configuration and
appropriate Actions permissions, neither of which has been deployment-tested.

Scheduled runs use source=live; manual runs may also choose it. This uses bounded
checkpointed batches, not a full-history scan: at most four 50-item listing pages,
20 eligible detail requests, 12-minute soft collection budget (an in-flight retry
can add roughly three minutes), 25-minute outer job limit. Each listing pass
stops at playedOn before 2026-06-25T00:00:00+09:00. This is PLAY DATE, not upload
or Discord message date. Older games uploaded later need a separate explicit-ID
or upload-date audit. Cache keys are isolated by ref and version v2. A cached
boundary page is repeated; latest page is always refreshed. Cache eviction or
save failure can cause repeated work. Offset scans are not stable snapshots and
are not proof of complete historical coverage. Newer IDs have detail priority;
known valid stored records are never replaced automatically.

## Base victory

A valid Demonic bossKill following a Demonic engagement confirms base victory,
even when the terminal result is absent or loser. It does not credit engagement
alone. This applies to newly parsed records; existing stored records are retained
byte-for-byte as JSON values. Lower-difficulty terminal rules remain unless a
valid Demonic kill was actually recorded. Existing personal progress/participation
checks and ranking formulas are unchanged. The original terminal flag is retained
for new-map records. A restart/remake whose kill is ignored by the original parser
does not gain a synthetic victory. Missing results without a confirmed base kill
are quarantined for all versions instead of newly inventing losses.

## Additional bosses

New-map extensionData is separate from base bosses/statsOverall/bossKills. The
personal page displays Sylvanas and Wind boss records and shows missing telemetry
explicitly. Dedicated event names supported by this SITE schema are Sylvanas and
Wind (case-insensitive), with bossEngage/bossWipe/bossKill and seconds timestamps.
Supported per-player variables are the exact sylvanas/wind prefix plus Deaths,
Damage, Healing, HealingReceived, Degen, Addkills, Countercast and Counterhit.
These names are a future integration contract, NOT observed telemetry in the
released maps. Unknown extension event names are retained separately and never
assigned to either boss by guesswork. Additional data does not enter base rankings.

The checked R7 public map initializes only the original ten boss-stat prefixes.
The inspected actual 1.13.0 response has Demonic kill but no dedicated Sylvanas or
Wind events/stat variables. No new-map runtime telemetry has been created here.
A later map patch must actually publish dedicated values/events and be checked
in a real Warcraft replay. This site-only delivery does not modify a map. Empty
telemetry does not prove the optional boss was not attempted. Synthetic extension
inputs verify parsing/display logic only. Real 1.13.1 and browser rendering are
not yet verified.

All response snapshots are read-only WC3Stats GET results projected to the fields
used for statistics. They contain no replay bytes or chat logs. Operational data,
player aliases and map files are not included as replacement datasets.
