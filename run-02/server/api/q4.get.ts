// GET /api/q4?space=org-a — open blockers in a space, grouped by severity.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const space = String(q.space ?? 'org-a')
  return runBench(4, 'open blockers grouped by severity, both titles', () => q4OpenBlockers(useSqlite(), space))
})
