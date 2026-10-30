// Shared shape for the bench routes: run the query, measure it, wrap it.
// The ms on the response is server time only; the browser adds its own
// round-trip on top, which /bench shows separately.
import { roundMs, timed } from './db'
import type { QueryResult } from './queries'

export async function runBench(number: number, title: string, fn: () => Promise<QueryResult>) {
  const { value, ms } = await timed(fn)
  return {
    query: number,
    title,
    sql: value.sql,
    params: value.params,
    note: value.note ?? '',
    ms: roundMs(ms),
    rowCount: value.rows.length,
    rows: value.rows,
  }
}
