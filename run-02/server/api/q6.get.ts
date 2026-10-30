// GET /api/q6?start=2026-11-02 — scheduled items in one week, for a calendar.
// The route turns any date into the Monday-to-Monday bounds for SQL.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const start = new Date(String(q.start ?? '2026-11-02'))
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  const iso = (date: Date) => date.toISOString().slice(0, 19)
  return runBench(6, 'scheduled time in one week', () => q6Week(useSqlite(), iso(start), iso(end)))
})
