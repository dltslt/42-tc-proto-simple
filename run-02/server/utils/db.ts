// The one place that opens the SQLite file and creates the indexes.
//
// db0 is the database layer Nitro ships: one small API (prepare, exec) over
// several SQL engines. The `node-sqlite` connector wraps `node:sqlite`,
// which Node 22 ships in the box, so nothing needs compiling.
import { createDatabase } from 'db0'
// db0 groups its drivers under connectors/. This import picks SQLite.
import nodeSqlite from 'db0/connectors/node-sqlite'

// The path is relative to the run directory (the server's working directory).
// LERCH_DB points the same code at another file, for example the 100k copy.
export const DB_PATH = process.env.LERCH_DB ?? '.data/app.sqlite'

// Indexes live here, not in the schema, because `make setup` rebuilds
// .data/ and would drop them. `CREATE INDEX IF NOT EXISTS` runs once when
// the server opens the file, so the seed file stays index-free on disk.
// Five candidates were tried and measured one by one (NOTES.md has the
// numbers). Three earned their place. Two did not:
//   tasks(space, kanban) helped the column page but made the blockers
//   dashboard 3.4x slower at 100k — with the index the planner scans the
//   space's 75k tasks and looks up blockers per row, instead of walking the
//   8k blockers and looking up tasks; and item_tags(tag_id) never showed a
//   gain because the table scan was already cheaper.
const INDEXES: Array<[string, string]> = [
  ['idx_events_item_at', 'CREATE INDEX IF NOT EXISTS idx_events_item_at ON events (item_id, at)'],
  ['idx_blockers_blocked', 'CREATE INDEX IF NOT EXISTS idx_blockers_blocked ON blockers (blocked_item_id)'],
  ['idx_blockers_blocker', 'CREATE INDEX IF NOT EXISTS idx_blockers_blocker ON blockers (blocker_item_id)'],
]

let database: ReturnType<typeof createDatabase> | null = null

// A module-level singleton: server routes share one connection to the file.
export function useSqlite() {
  if (!database) {
    database = createDatabase(nodeSqlite({ path: DB_PATH }))
    for (const [, statement] of INDEXES) database.exec(statement)
  }
  return database
}

// performance.now() measures milliseconds with sub-ms resolution, which
// Date.now() (whole milliseconds) would round away for fast queries.
export function timed<T>(fn: () => T | Promise<T>): Promise<{ value: T; ms: number }> {
  const started = performance.now()
  return Promise.resolve().then(fn).then((value) => ({ value, ms: performance.now() - started }))
}

export function roundMs(ms: number): number {
  return Math.round(ms * 1000) / 1000
}
