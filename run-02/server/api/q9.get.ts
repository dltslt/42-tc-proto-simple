// GET /api/q9?space=org-a — counts per column and per state, for a chart.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const space = String(q.space ?? 'org-a')
  return runBench(9, 'counts per column and per state', () => q9Counts(useSqlite(), space))
})
