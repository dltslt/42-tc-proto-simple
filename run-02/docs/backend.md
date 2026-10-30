# Backend

One Nuxt app, no separate backend. The server side of this run:

- `server/utils/db.ts` — opens the SQLite file once (a module-level
  singleton) through db0's `node-sqlite` connector, which wraps
  `node:sqlite` from Node 22. It also runs the three `CREATE INDEX IF NOT
  EXISTS` statements at server start, because `make setup` rebuilds
  `.data/` and would drop indexes stored only in the file. The path comes
  from `LERCH_DB` with a default of `.data/app.sqlite`. `timed()` wraps a
  query with `performance.now()`, which resolves below a millisecond.
- `server/utils/queries.ts` — the ten queries of the brief in one module.
  Each function takes the open database and parameters and returns the SQL
  text, the bound parameters, and the rows, so a route can show what ran.
- `server/utils/bench.ts` — the shared wrapper: runs one query, measures it,
  and gives the response its shape (`query`, `title`, `sql`, `params`,
  `ms`, `rowCount`, `rows`).
- `server/api/q1.get.ts` … `q10.get.ts` — one route per query. Nitro turns
  each file into a URL and auto-imports the helpers. Each route names its
  default parameters (space `org-a`, person `person-1`, tag `Valve`, week
  of `2026-11-02`, search word `valve`, items `item-1`, `item-1351`,
  `item-1250`), so the bench is a fixed set that another run can repeat
  with document storage.
- `server/api/dbinfo.get.ts` — which file is open and how many tasks it
  holds, so the page can name what it measured.

Query 8 is the one write: it reads the target column's state, updates the
task's kanban and state, and inserts the event inside one `BEGIN`/`COMMIT`.
Without a `to` parameter the item moves to the column with the next
position, wrapping around, so repeated runs keep it cycling the board.
