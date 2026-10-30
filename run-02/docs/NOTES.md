# NOTES

Built by: Mistral Vibe, glm-5.3-flash

## Run

Brief `fast-02-storage-sql` (fast). Port 3002. `make dev` starts the server;
`/bench` is the one screen. The 100k file is generated, not committed:
`node bench/make-100k.mjs` (needs the `.data/seed/` that `make setup`
wrote), then the server reads it with `LERCH_DB=bench/bench-100k.sqlite
make dev`.

## What it shows

The Lerch seed as tables, and ten fixed queries timed against it: 10,000
items by default, 100,000 on the second file. `/bench` runs each query 20
times and shows median and slowest server ms, the rows, and the SQL. The
data model is the schema's eleven tables; the numbers say which reads a
document store would have to beat.

## Open questions touched

- *Which candidates are objects of their own (OPEN).* The schema makes
  actors, tags, blockers, and artifacts their own tables, and events a log
  table. Nothing else survived as a record: views, templates, policies are
  absent. The bench did not need more.
- *Where score and severity are stored (OPEN).* Severity is a text column
  on `blockers` and Q4 groups by it. Item score is nowhere — no column, no
  seed value. The two scales stayed apart.
- *Does a task sit in exactly one space (OPEN).* `tasks.space` is one
  column. The cost of that default is visible in Q5: a person's work is a
  subquery over `members` plus a LIKE over the `;`-joined contributors
  string, and no index can help the LIKE.

## Added

- Three indexes (`idx_events_item_at`, `idx_blockers_blocked`,
  `idx_blockers_blocker`), created at server start, not in the schema.
- Default parameters per query: space `org-a`, person `person-1`, tag
  `Valve`, week starting `2026-11-02`, search word `valve`, items
  `item-1` (subtree), `item-1351` (panel), `item-1250` (move).
- "Open" blocker = the blocked item is not done (Q4's WHERE clause).
- `changed_at` in Q1, computed from `MAX(events.at)`; not stored.
- `LERCH_DB` env var and `/api/dbinfo` route.
- `bench/bench-100k.sqlite`: the 10k seed copied ten times, ids shifted per
  prefix, same spaces. Co-occurrence and blocker counts scale 10x; the
  population shape (levels, states) is unchanged. Gitignored (58 MB);
  `bench/make-100k.mjs` rebuilds it from the seed.

## Stack assumptions

- db0 `0.3.4` added as a direct dependency; connector `node-sqlite`
  (wraps `node:sqlite`, Node 22, no compiling). `db0` has no transaction
  helper, so Q8 uses raw `BEGIN`/`COMMIT`.
- No test suite — a fast brief. The check is the bench page itself.
- No policy check and no current-user stub: the only write is Q8's move,
  which acts as `person-1`.
- The 100k file is gitignored and rebuilt with `node bench/make-100k.mjs`;
  only the generator is committed.

## Cut

- No FTS5 for the title search (Q10): the full scan is measured as-is
  (~0.3 ms at both scales; it would not survive real text volume).
- No charts or any interface beyond the plain bench table, per the brief.
- Each `/bench` run leaves ~20 move events in the database (Q8 writes);
  the seed rebuild wipes them. Not stored elsewhere.
- Nothing from the brief's Build list was dropped.

## Numbers

Laptop, dev server, Node 22.23.1, db0 0.3.4, sequential requests. Two
tables: ms measured around the SQL inside the server (what `/bench` shows,
20 runs each).

At 10,000 items (`app.sqlite`, three indexes):

| query | median | slowest |
|---|---|---|
| q1 column page | 2.88 | 4.81 |
| q2 item panel | 0.63 | 1.14 |
| q3 project subtree | 7.41 | 14.44 |
| q4 open blockers | 2.86 | 3.54 |
| q5 person's open items | 2.51 | 5.21 |
| q6 week calendar | 1.82 | 2.81 |
| q7 tag + co-occurrence | 10.71 | 18.33 |
| q8 move, transaction | 2.08 | 14.90 |
| q9 counts per column/state | 6.47 | 9.40 |
| q10 title search | 0.26 | 0.32 |

At 100,000 items (`bench/bench-100k.sqlite`, same three indexes):

| query | median | slowest |
|---|---|---|
| q1 column page | 21.20 | 24.66 |
| q2 item panel | 0.40 | 0.65 |
| q3 project subtree | 18.51 | 23.18 |
| q4 open blockers | 17.43 | 24.20 |
| q5 person's open items | 25.09 | 36.79 |
| q6 week calendar | 9.09 | 18.77 |
| q7 tag + co-occurrence | 86.35 | 91.51 |
| q8 move, transaction | 1.92 | 17.25 |
| q9 counts per column/state | 37.87 | 42.46 |
| q10 title search | 0.25 | 0.34 |

The three slowest at 10k and why: **q7** joins `item_tags` twice, once for
the items and once for the co-occurrence counts through an `IN (subquery)`;
the tag membership list is ~3,700 rows at 100k. **q3** walks 1,126 subtree
rows through a recursive CTE and joins tasks back by id, row by row. **q9**
groups all of a space's rows twice, and with no useful index that is a full
table scan per statement.

Index log (raw SQL timings, `node:sqlite`, median of 5+ runs):

| index | effect at 10k | effect at 100k |
|---|---|---|
| (none) | q1 2743 ms, all others under 6 ms | q1 324,306 ms (one run), others under 56 ms |
| `idx_events_item_at` on events (item_id, at) | q1 2.4 ms | q1 27 ms |
| `idx_item_tags_tag` on item_tags (tag_id) | no change (dropped) | no change (dropped) |
| `idx_blockers_blocked` on blockers (blocked_item_id) | no change | q2 0.58 → 0.36 ms |
| `idx_blockers_blocker` on blockers (blocker_item_id) | no change | q2 0.36 → 0.14 ms |
| `idx_tasks_space_kanban` on tasks (space, kanban) | q9 2.9 → 2.0 ms | q1 27 → 20 ms, q9 39 → 32 ms, **but q4 16 → 55 ms and q5 17 → 30 ms** (dropped) |
| `idx_tasks_space_scheduled` on tasks (space, scheduled_time) | no change (dropped) | no change (dropped) |
| `idx_tasks_lead` on tasks (lead) | no change (dropped) | no change (dropped) |
| `idx_relations_child` on relations (child_id) | no change (dropped) | no change (dropped) |

Why the dropped ones cannot help: `idx_tasks_lead` loses to the `OR lead =
? OR contributors LIKE ?`; the LIKE match can never use an index.
`idx_tasks_space_scheduled` is a range scan over 139 rows either way.
`idx_relations_child` walks down, which the primary key `(parent_id,
child_id)` already covers. `idx_tasks_space_kanban` made the blockers
dashboard 3.4x slower at 100k — with it the planner scans the space's 75k
tasks and looks up blockers per row, instead of walking the 8k blockers and
looking up tasks; the q1 gain did not pay for that.
