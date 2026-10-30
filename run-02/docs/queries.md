# The query set

The brief fixes ten queries; another run repeats the same set with document
storage. What each one is for, and where SQL helped or fought back.

| # | View it feeds | Shape |
|---|---|---|
| 1 | kanban column page | filter by space + kanban, order by last event, 50 rows |
| 2 | item panel | 7 statements: item, children, parent chain, tags, artifacts, blockers in and out |
| 3 | relationship view | recursive CTE down `relations`, all levels |
| 4 | blockers dashboard | group by severity + list with both titles |
| 5 | person's work | membership subquery, `;`-list contributors via LIKE |
| 6 | calendar | range over ISO text, order by time |
| 7 | filter panel | items with a tag + counts of their other tags |
| 8 | moving a card | read column state, update task, insert event, one transaction |
| 9 | chart | two group-bys over one space |
| 10 | search | LIKE with leading wildcard, first 20 |

## Easy in SQL

- Q4, Q6, Q9, Q10 are plain filters, ranges, and group-bys; the seed stores
  ISO timestamps, and ISO text sorts, so the calendar is a string range.
- Q1's filter half is trivial; only its ordering costs anything.
- The parent/child hierarchy as its own `relations` table with a composite
  primary key means walking *down* needs no extra index — the key's first
  column is the parent.

## Awkward in SQL

- "Newest change first" (Q1): tasks has no updated-at column, so the order
  key is a correlated `MAX(events.at)` per row. Without an index on
  `events (item_id, at)` this was the one catastrophic query: 2.7 s at 10k,
  324 s at 100k. With the index it is ~21 ms at 100k.
- Contributors as a `;` list (Q5): only a LIKE match can find a member, and
  the OR with `lead` stops SQLite from using an index on either.
- The subtree and the parent chain (Q2, Q3) need recursive CTEs — readable,
  but a document store would likely read the whole subtree in one record.
- Co-occurrence counts (Q7): an `IN (subquery)` over item_tags joined twice;
  this is the slowest query at both scales (10.7 ms at 10k, 86 ms at 100k).
- db0 has no transaction helper (Q8), so the route runs raw `BEGIN`/`COMMIT`
  statements.
- "Open" blocker: the schema has no open/closed flag on a blocker, so the
  prototype defines open as *the blocked item is not done*. That reading
  lives in the SQL of Q4 and nowhere else.
