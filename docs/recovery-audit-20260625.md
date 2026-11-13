# Audited missing replay IDs

Checked on 2026-11-13. A live descending playedOn search returned 150 distinct rows
in pages 1-3, reaching dates before June 25 KST. Of 140 rows played on/after June
25 KST, one was already stored and 139 were absent. All 139 detailed responses
were fetched successfully. This does not audit every Discord attachment.

The response snapshots are 50 normal 1.11.22, 84 normal 1.12.3, two normal 1.13.0,
two 1.11.22_rev8 and one 1.11.22_sal_rev2. No actual 1.13.1 response was found in
this selection. All 139 upstream replay hashes are distinct within this selection;
this is not a byte-hash comparison against every historical original .w3g.

The candidate adds 130 records. Five without confirmed results remain excluded:
823805, 817994, 816307, 814930, 813778.
Four remain parser failures:
- 842372: unverified Impossible.Bosses.v1.11.22_sal_rev2.w3x filename.
- 842258 and 842251: unverified Impossible.Bosses.v1.11.22_rev8.w3x filename.
- 834834: inconsistent Thunder engagement/wipe events.

Unknown map variants are not broadly admitted and missing combat events are not
invented to force acceptance. The base-clear rule confirms actual Demonic kills
in 855188, 835973, 835107 and 812466. This includes absent/loser terminal flags.
855188 is the salgeras1 upload made during our diagnosis, not proof of automatic
Discord collection. Its real game data is included and identified explicitly.

Original 1,820 entries remain unchanged; candidate has 1,950 entries. Original
24 null entries remain. An offline personal-page count example (ice-follower)
changes 223 games / 75 wins to 278 games / 107 wins using existing counting logic.
This is a candidate result, not a claim that the production site has changed.

Review staging/refresh-status.json, especially failed/unconfirmedResult, before
publishing. Audited source reparses the snapshot on each run and skips valid IDs
already present; it is not an instruction to overwrite the source dataset.
