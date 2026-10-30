// Database access. Nitro auto-imports every export of a file in
// `server/utils/` into all server routes, so route files can just call `db`.
//
// db0 is Nitro's thin database layer: one small async API (`prepare`, `exec`)
// wrapped around a driver. The `node-sqlite` connector drives the
// `node:sqlite` module that ships with Node 22, so nothing needs compiling.
import { createDatabase } from 'db0'
import nodeSqlite from 'db0/connectors/node-sqlite'
import { join } from 'node:path'

// `process.cwd()` is the run directory while `nuxt dev` serves it, and
// `make setup` built the SQLite file at `.data/app.sqlite` there.
const database = createDatabase(
  nodeSqlite({ path: join(process.cwd(), '.data', 'app.sqlite') }),
)

export function db() {
  return database
}

// Small helpers so route files read like plain SQL calls. db0 is async
// throughout (`await` returns the rows), unlike the synchronous C API that
// node:sqlite exposes directly.
export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return await database.prepare(sql).all(...params) as T[]
}

export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return await database.prepare(sql).get(...params) as T | undefined
}

export async function run(sql: string, params: any[] = []): Promise<void> {
  await database.prepare(sql).run(...params)
}
