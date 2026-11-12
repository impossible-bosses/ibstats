# Replay registration and refresh recovery

The existing parser rejects the released `Impossible.Bosses.v1.13.0.w3x` and
`Impossible.Bosses.v1.13.1.w3x` filenames and does not recognize Shaman. This patch
adds those exact production filenames and the class metadata/icon. Debug or
unverified suffixed filenames are not broadly admitted.

`refresh.js` now follows listing pagination, retries transient transport errors,
retries stored null entries encountered in the listing, retains every existing
valid record, and records pending/failed/unconfirmed IDs separately. New parser
failures are not stored as permanent null IDs. Listing failures/incomplete scans
abort before replacing the data file. Writes are atomic and a concurrent input
change prevents replacement.

The public collection history has a long gap after June 2026. A sample of 200
recent upstream IB records contained 138 IDs missing from the stored dataset.
This is evidence of a collection gap, not a claim that all 138 are eligible.
The historical publication path stopped updating the dataset; its current external runtime state is not verified. A replacement workflow is now
included but stays disabled until the owner explicitly enables the repository
variable IBSTATS_AUTO_SYNC_ENABLED=true. Manual runs default to staging only.
The currently responding Discord uploader is not replaced by this site patch.

## Staging before applying

From a development checkout with the original data file:

```sh
node tests/registration.test.js
node refresh.js --input data/replays.json --output staging/replays.json
```

Review `staging/refresh-status.json` and the candidate data. With no `--output`,
the script updates `data/replays.json`, matching the previous operational CLI.
Do not invoke `refresh.sh` until that operational update is approved: it pulls,
refreshes, and commits/pushes only the generated data/status files.

The tests use Node's `structuredClone` (Node 18+ is suitable); this development
run used Node v24.22.1. No dependencies are required for the test or refresher.

## Result integrity

An uploaded replay can have fully parsed MMD statistics while upstream
`processed` remains false or `season` has not been assigned. The uploader's
request and the later server processing stage are distinct.

Replay 855188, after processing, still has no per-player MMD winner/loser flags.
The candidate parser can read its eight players and original boss statistics,
but reports `incomplete=true`. New 1.13.x records without a confirmed result are
placed in `unconfirmedResult` instead of guessing a defeat or adding them to
normal records. Existing valid historical records remain untouched. No season,
winner, or loser flag is fabricated.

The custom terminal encounter's map-side result-emission path needs a separate
map fix and actual replay tests. A website parser cannot recover a result that
was never emitted into the original replay.

## Validation and limits

- Real processed 1.13.0 fixture 854522: three players retained, including Shaman.
- Real 1.12.3 fixture 836531: normalized output identical to the pinned old parser.
- Actual missing-result 1.13.0 fixture 855188: incomplete result quarantined.
- Pagination/deduplication, stored-null recovery, pending/void handling,
  unsupported filenames, transport failures and existing-object preservation:
  30 assertions passed.
- The 1.13.1 test changes the filename in a known-format fixture only; a real
  1.13.1 replay and all new-content telemetry are not yet verified.
- Fixtures contain parser inputs only, without raw chat logs or replay files.
- No production replay/alias datasets or ranking formulas change in this patch.
- No in-game import/export feature or automatic replay uploader is included.

## Automated site synchronization candidate

Use the included IBStat replay synchronization workflow with publish=false first.
After reviewing the staging artifact, a main-branch publish run verifies existing
records, commits only generated data, explicitly requests a Pages build, and
checks that the requested revision was built. GITHUB_TOKEN commits alone do not
trigger Pages builds. Contents/Pages write permissions and branch-based Pages
configuration must be verified by the operator. No workflow has been installed
or activated by this development run.

Unconfirmed new-map records are listed separately on the personal page, with
alias matching and a WC3Stats source link. They do not increment normal game
wins/losses or enter leaderboards. This keeps recognized uploads visible without
inventing a missing result. UI behavior was tested with a DOM/API model only.

## R4 rollout safeguards

Pull requests run the preview job with contents:read and no publisher. The preview
collects into staging, runs the integrity gate with --check, and uploads review
artifacts even when collection fails. Manual dispatch is available after the
workflow lands on the default branch and defaults to publish=false. Scheduled
runs remain disabled until the repository variable is explicitly true.

The separate main-only publisher checks out the preview source revision and
requires the original replay-file SHA256 to match the collection source. It
rejects removed/changed valid records and inconsistent declared IDs before
writing. A non-forced push rejects intervening main changes. Pages access is
checked before data commit. The existing branch-based Pages configuration must
use main; alternate deployment configurations require adaptation. Publishing
recollects and validates a fresh candidate in that run, rather than approving an
artifact from an earlier manual run. No real Actions/Pages execution is claimed.
